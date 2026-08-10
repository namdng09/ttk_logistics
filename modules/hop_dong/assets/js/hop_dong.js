(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var currentKhachHang = '';
  var KHACH_HANG_OPTIONS = [];
  var KHACH_HANG_DATA = {};
  var CURRENT_FILES = [];
  var PENDING_FILES = [];
  var CURRENT_HOP_DONG_ID = null;
  var CURRENT_FORM_MODE = 'create';
  var PAGE_INITIALIZED = false;

  function modalShow(id) {
    var el = document.getElementById(id);
    if (el) new bootstrap.Modal(el).show();
  }
  function modalHide(id) {
    var el = document.getElementById(id);
    if (el) {
      var m = bootstrap.Modal.getInstance(el);
      if (m) m.hide();
    }
  }

  Drupal.behaviors.hopDong = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-hop-dong', context).length) {
        if (PAGE_INITIALIZED) {
          return;
        }
        PAGE_INITIALIZED = true;
        loadKhachHangSelect();
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;

    doc.getElementById('btn-search-hop-dong').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-hop-dong').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-hop-dong').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    doc.getElementById('form-hop-dong').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-hop-dong');
        if (btn && !btn.disabled) btn.click();
      }
    });

    var reloadBtn = doc.querySelector('.btn-reload-hop-dong');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentKhachHang = '';
        doc.getElementById('search-hop-dong').value = '';
        if (doc.getElementById('filter-khach-hang')) {
          doc.getElementById('filter-khach-hang').value = '';
        }
        initFilterSelect2();
        currentPage = 1;
        loadList();
      });
    }

    var themBtn = doc.querySelector('.btn-them-hop-dong');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    var luuBtn = doc.querySelector('.btn-luu-hop-dong');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    var modal = doc.getElementById('hop-dong-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initDatePickers();
      initSelect2();
    });

    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-hop-dong')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-hop-dong')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-hop-dong')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('page-link')) {
            var pageLink = parseInt(t.getAttribute('data-page'));
            if (pageLink && pageLink !== currentPage) {
              e.preventDefault();
              currentPage = pageLink;
              loadList();
            }
            return;
          }
          if (t.classList.contains('btn-delete-file')) {
            e.preventDefault();
            var fid = t.getAttribute('data-file-id');
            if (fid) confirmDeleteFile(fid);
            return;
          }
          if (t.classList.contains('btn-remove-pending-file')) {
            e.preventDefault();
            var idx = parseInt(t.getAttribute('data-pending-index'));
            if (!isNaN(idx) && PENDING_FILES[idx]) {
              PENDING_FILES.splice(idx, 1);
              renderFileList();
            }
            return;
          }
        }
        t = t.parentElement;
      }
    });

    // Select2 change -> show NV KD
    var selKh = doc.getElementById('select-khach-hang');
    if (selKh) {
      selKh.addEventListener('change', function () {
        showNvKinhDoanh(this.value);
      });
    }

    doc.getElementById('pagination-jump').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value);
        var total = parseInt(this.getAttribute('data-total-pages'));
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });

    // File upload
    var btnChonFile = doc.getElementById('btn-chon-file');
    var fileInput = doc.getElementById('file-input-hop-dong');
    if (btnChonFile && fileInput) {
      btnChonFile.addEventListener('click', function () {
        fileInput.click();
      });
      fileInput.addEventListener('change', function () {
        if (this.files.length > 0) {
          uploadFiles(this.files);
          this.value = '';
        }
      });
    }
  }

  function showNvKinhDoanh(khNid) {
    var section = document.getElementById('nv-kinh-doanh-section');
    var display = document.getElementById('nv-kinh-doanh-display');
    if (!khNid || !KHACH_HANG_DATA[khNid]) {
      section.style.display = 'none';
      display.innerHTML = '';
      return;
    }
    var kh = KHACH_HANG_DATA[khNid];
    var nv = kh.nv_kinh_doanh;
    if (!nv) {
      section.style.display = 'none';
      display.innerHTML = '';
      return;
    }
    var text = nv.ten || '';
    if (nv.ma_nhan_vien) text += ' - ' + nv.ma_nhan_vien;
    display.innerHTML = escapeHtml(text);
    section.style.display = '';
  }

  function loadKhachHangSelect() {
    $.ajax({
      url: '/api/khach-hang',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data) {
          var items = res.data.items || [];
          var select = document.getElementById('select-khach-hang');
          var filter = document.getElementById('filter-khach-hang');
          if (select) {
            select.innerHTML = '<option value="">Chọn khách hàng</option>';
          }
          if (filter) {
            filter.innerHTML = '<option value="">Tất cả khách hàng</option>';
          }
          var opts = [];
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var label = item.ten || '';
            if (item.ma_kh) label += ' (' + item.ma_kh + ')';
            opts.push({ id: item.nid, text: label });
            KHACH_HANG_DATA[item.nid] = item;
          }
          KHACH_HANG_OPTIONS = opts;
          for (var j = 0; j < opts.length; j++) {
            if (select) {
              var opt = document.createElement('option');
              opt.value = opts[j].id;
              opt.textContent = opts[j].text;
              select.appendChild(opt);
            }
            if (filter) {
              var filterOpt = document.createElement('option');
              filterOpt.value = opts[j].id;
              filterOpt.textContent = opts[j].text;
              filter.appendChild(filterOpt);
            }
          }
          initSelect2();
          initFilterSelect2();
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function initSelect2() {
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    var $sel = $jq ? $jq('#select-khach-hang') : null;
    if ($sel && $sel.length) {
      if ($sel.data('select2')) {
        $sel.select2('destroy');
      }
      $sel.select2({
        dropdownParent: $jq('#hop-dong-modal'),
        placeholder: 'Chọn khách hàng',
        allowClear: true,
        width: '100%'
      });
    }
  }

  function initFilterSelect2() {
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    var $sel = $jq ? $jq('#filter-khach-hang') : null;
    if ($sel && $sel.length) {
      if ($sel.data('select2')) {
        $sel.select2('destroy');
      }
      $sel.select2({
        placeholder: 'Tất cả khách hàng',
        allowClear: true,
        width: '100%'
      });
      $sel.off('change.hopDongFilterKh');
      $sel.on('change.hopDongFilterKh', function () {
        currentKhachHang = this.value || '';
        currentPage = 1;
        loadList();
      });
      $sel.val(currentKhachHang || '').trigger('change.select2');
    }
  }

  function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
      $('.flatpickr-date').each(function () {
        try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
        if (!this.hasAttribute('readonly') && !this.hasAttribute('disabled')) {
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, static: true });
        }
      });
    }
  }

  function loadList() {
    var tbody = $('#table-hop-dong-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="8" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    var params = { page: currentPage, keyword: currentKeyword };
    if (currentKhachHang) {
      params.khach_hang = currentKhachHang;
    }

    $.ajax({
      url: '/api/hop-dong',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="8" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="8" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.nid);
          var khName = '';
          if (item.khach_hang) {
            khName = item.khach_hang.ten || '';
            if (item.khach_hang.ma_kh) khName += ' (' + item.khach_hang.ma_kh + ')';
          }
          var nvKdHtml = '';
          if (item.khach_hang && item.khach_hang.nv_kinh_doanh) {
            var nv = item.khach_hang.nv_kinh_doanh;
            var nvText = nv.ten || '';
            if (nv.ma_nhan_vien) nvText += ' - ' + nv.ma_nhan_vien;
            nvKdHtml = escapeHtml(nvText);
          }
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + escapeHtml(item.so_hop_dong || '') + '</td>' +
            '<td>' + (item.ngay_hop_dong || '') + '</td>' +
            '<td>' + (item.han_hop_dong || '') + '</td>' +
            '<td>' + escapeHtml(khName) + '</td>' +
            '<td>' + nvKdHtml + '</td>' +
            '<td>' + escapeHtml(item.ghi_chu || '') + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    var perms = Drupal.settings.hop_dong && Drupal.settings.hop_dong.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.hop_dong_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-hop-dong" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.hop_dong_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-hop-dong" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.hop_dong_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-hop-dong" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-hop-dong');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var total = data.total_pages || 0;
    var current = data.current_page || 0;
    var totalItems = data.total || 0;

    document.getElementById('pagination-info').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('pagination-total-pages').textContent = '/ ' + total;

    var jumpInput = document.getElementById('pagination-jump');
    jumpInput.value = current;
    jumpInput.setAttribute('data-total-pages', total);

    container.style.display = '';

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-first" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-prev" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';

    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);

    if (start > 1) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }

    if (end < total) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-next" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-last" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';

    ul.innerHTML = html;
  }

  function showLoading(show) {
    var loading = document.getElementById('modal-loading');
    loading.style.display = show ? '' : 'none';
  }

  function openViewModal(id) {
    setFormMode('view');
    document.getElementById('hop-dong-modal-title').textContent = 'Chi tiết hợp đồng';
    document.querySelector('.btn-luu-hop-dong').style.display = 'none';
    showLoading(true);
    modalShow('hop-dong-modal');

    $.ajax({
      url: '/api/hop-dong/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        initDatePickers();
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('hop-dong-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('hop-dong-modal-title').textContent = 'Cập nhật hợp đồng';
    document.querySelector('#form-hop-dong input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-hop-dong');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('hop-dong-modal');

    $.ajax({
      url: '/api/hop-dong/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('hop-dong-modal');
          return;
        }
        initDatePickers();
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('hop-dong-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    CURRENT_FORM_MODE = mode;
    var inputs = document.querySelectorAll('#form-hop-dong input, #form-hop-dong select');
    var btn = document.querySelector('.btn-luu-hop-dong');
    for (var i = 0; i < inputs.length; i++) {
      if (mode === 'view') {
        inputs[i].setAttribute('readonly', 'readonly');
        inputs[i].setAttribute('disabled', 'disabled');
        btn.style.display = 'none';
      } else {
        inputs[i].removeAttribute('readonly');
        inputs[i].removeAttribute('disabled');
        btn.style.display = '';
      }
    }
    var sel = document.querySelector('#select-khach-hang');
    if (sel) {
      if (mode === 'view') {
        sel.setAttribute('disabled', 'disabled');
      } else {
        sel.removeAttribute('disabled');
      }
    }

    // File upload area: show in create/edit, hide in view
    var uploadArea = document.getElementById('file-upload-area');
    if (uploadArea) {
      uploadArea.style.display = (mode === 'view') ? 'none' : '';
    }
  }

  function resetForm() {
    showLoading(false);
    document.getElementById('form-hop-dong').reset();
    document.querySelector('#form-hop-dong input[name="nid"]').value = '';
    document.getElementById('hop-dong-modal-title').textContent = 'Thêm hợp đồng';
    var sel = document.querySelector('#select-khach-hang');
    if (sel) {
      sel.value = '';
    }
    document.getElementById('nv-kinh-doanh-section').style.display = 'none';
    document.getElementById('nv-kinh-doanh-display').innerHTML = '';
    setFormMode('create');

    // Reset file section
    CURRENT_FILES = [];
    PENDING_FILES = [];
    CURRENT_HOP_DONG_ID = null;
    document.getElementById('file-section').style.display = '';
    document.getElementById('file-table-tbody').innerHTML = '';
    document.getElementById('file-table').style.display = 'none';
    document.getElementById('file-list-empty').style.display = 'none';
    document.getElementById('file-upload-progress').style.display = 'none';
  }

  function populateForm(d) {
    document.querySelector('#form-hop-dong input[name="nid"]').value = d.nid || '';
    document.querySelector('#form-hop-dong input[name="so_hop_dong"]').value = d.so_hop_dong || '';
    document.querySelector('#form-hop-dong input[name="ngay_hop_dong"]').value = d.ngay_hop_dong || '';
    document.querySelector('#form-hop-dong input[name="han_hop_dong"]').value = d.han_hop_dong || '';
    document.querySelector('#form-hop-dong input[name="ghi_chu"]').value = d.ghi_chu || '';

    if (d.khach_hang && d.khach_hang.nid) {
      var sel = document.querySelector('#select-khach-hang');
      if (sel) {
        sel.value = d.khach_hang.nid;
      }
      showNvKinhDoanh(d.khach_hang.nid);
    }

    initDatePickers();

    // Show file section for edit/view
    CURRENT_HOP_DONG_ID = d.nid || null;
    CURRENT_FILES = d.files || [];
    renderFileList();
  }

  function renderFileList() {
    var section = document.getElementById('file-section');
    var tbody = document.getElementById('file-table-tbody');
    var table = document.getElementById('file-table');
    var empty = document.getElementById('file-list-empty');

    section.style.display = '';
    tbody.innerHTML = '';

    var allFiles = CURRENT_FILES.slice();
    var hasPending = PENDING_FILES.length > 0;

    for (var p = 0; p < PENDING_FILES.length; p++) {
      var pf = PENDING_FILES[p];
      allFiles.push({
        id: 'pending_' + p,
        file_name: pf.name,
        file_size: pf.size,
        file_type: pf.type || '',
        created: '',
        _pending: true,
        _pendingIndex: p
      });
    }

    if (allFiles.length === 0) {
      table.style.display = 'none';
      empty.style.display = '';
      return;
    }

    empty.style.display = 'none';
    table.style.display = '';

    var html = '';
    for (var i = 0; i < allFiles.length; i++) {
      var f = allFiles[i];
      var sizeText = formatFileSize(f.file_size);
      var dateText = f.created || '';
      if (dateText.length > 10) dateText = dateText.substring(0, 10);
      var isPending = f._pending;
      html += '<tr class="file-row">' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' +
          '<i class="ti tabler-file me-1 text-primary"></i>' +
          '<span class="file-name-text">' + escapeHtml(f.file_name) + '</span>' +
          (isPending ? ' <span class="badge bg-label-warning ms-1">Chờ lưu</span>' : '') +
        '</td>' +
        '<td>' + sizeText + '</td>' +
        '<td>' + dateText + '</td>' +
        '<td class="text-center">' +
          (isPending ?
            '<button type="button" class="btn btn-sm btn-icon btn-outline-danger btn-remove-pending-file" data-pending-index="' + f._pendingIndex + '" title="Bỏ file"><i class="ti tabler-x"></i></button>' :
            '<div class="d-inline-flex gap-1">' +
              '<a href="' + escapeHtml(f.file_url || '#') + '" target="_blank" class="btn btn-sm btn-icon btn-outline-primary" title="Tải xuống"><i class="ti tabler-download"></i></a>' +
              (CURRENT_FORM_MODE !== 'view' ?
                '<button type="button" class="btn btn-sm btn-icon btn-outline-danger btn-delete-file" data-file-id="' + f.id + '" title="Xoá file"><i class="ti tabler-x"></i></button>' : '') +
            '</div>') +
        '</td>' +
        '</tr>';
    }
    tbody.innerHTML = html;
  }

  function renderPendingFiles() {
    renderFileList();
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    var units = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + ' ' + units[i];
  }

  var ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
  var ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'gif'];
  var MAX_FILE_SIZE = 10 * 1024 * 1024;

  function validateFile(file) {
    var ext = file.name.split('.').pop().toLowerCase();
    if (ALLOWED_EXTENSIONS.indexOf(ext) === -1) {
      return 'File "' + file.name + '" không được hỗ trợ. Chỉ chấp nhận PDF, JPG, PNG, GIF';
    }
    if (ALLOWED_TYPES.indexOf(file.type) === -1 && file.type !== '') {
      return 'File "' + file.name + '" không được hỗ trợ. Chỉ chấp nhận PDF, JPG, PNG, GIF';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File "' + file.name + '" vượt quá 10MB (' + formatFileSize(file.size) + ')';
    }
    return null;
  }

  function uploadFiles(fileList) {
    var validFiles = [];
    for (var v = 0; v < fileList.length; v++) {
      var err = validateFile(fileList[v]);
      if (err) {
        if (notyf) notyf.error(err);
      } else {
        validFiles.push(fileList[v]);
      }
    }
    if (validFiles.length === 0) return;

    if (!CURRENT_HOP_DONG_ID) {
      for (var k = 0; k < validFiles.length; k++) {
        PENDING_FILES.push(validFiles[k]);
      }
      renderPendingFiles();
      return;
    }

    var progress = document.getElementById('file-upload-progress');
    var progressBar = progress.querySelector('.progress-bar');
    var statusText = document.getElementById('file-upload-status');
    progress.style.display = '';

    var total = validFiles.length;
    var done = 0;

    function uploadNext() {
      if (done >= total) {
        progress.style.display = 'none';
        progressBar.style.width = '0%';
        return;
      }

      var file = validFiles[done];
      var pct = Math.round(((done) / total) * 100);
      progressBar.style.width = pct + '%';
      statusText.textContent = 'Đang tải ' + (done + 1) + '/' + total + ': ' + file.name;

      var reader = new FileReader();
      reader.onload = function(e) {
        var base64Data = e.target.result;
        var payload = JSON.stringify({
          file: base64Data,
          filename: file.name,
          filesize: file.size,
          filetype: file.type
        });

        $.ajax({
          url: '/api/hop-dong/' + CURRENT_HOP_DONG_ID + '/file',
          type: 'POST',
          data: payload,
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          success: function (res) {
            if (res.status === 'success' && res.data) {
              CURRENT_FILES.push(res.data);
              renderFileList();
              if (notyf) notyf.success('Tải lên thành công: ' + file.name);
            } else {
              if (notyf) notyf.error(res.message || 'Lỗi tải file');
            }
            done++;
            uploadNext();
          },
          error: function (jqXHR) {
            if (notyf) notyf.error(apiMsg(jqXHR));
            done++;
            uploadNext();
          }
        });
      };
      reader.readAsDataURL(file);
    }

    uploadNext();
  }

  function confirmDeleteFile(fileId) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xoá file',
        text: 'Bạn có chắc chắn muốn xoá file này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        confirmButtonColor: '#d33',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) {
          deleteFile(fileId);
        }
      });
    } else {
      if (confirm('Xoá file này?')) {
        deleteFile(fileId);
      }
    }
  }

  function deleteFile(fileId) {
    if (!CURRENT_HOP_DONG_ID) return;

    $.ajax({
      url: '/api/hop-dong/' + CURRENT_HOP_DONG_ID + '/file/' + fileId,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          CURRENT_FILES = CURRENT_FILES.filter(function (f) { return f.id !== fileId; });
          renderFileList();
          if (notyf) notyf.success('Xoá file thành công');
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi xoá file');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function submitForm() {
    var form = document.getElementById('form-hop-dong');

    var khSelect = document.querySelector('#select-khach-hang');
    var khNid = khSelect ? khSelect.value : '';
    if (!khNid) {
      form.classList.add('was-validated');
      if (notyf) notyf.error('Vui lòng chọn khách hàng');
      return;
    }

    var ngayStr = document.querySelector('#form-hop-dong input[name="ngay_hop_dong"]').value;
    var hanStr = document.querySelector('#form-hop-dong input[name="han_hop_dong"]').value;
    if (ngayStr && hanStr) {
      var parseDate = function (s) {
        var parts = s.split('/');
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      };
      var ngay = parseDate(ngayStr);
      var han = parseDate(hanStr);
      if (han < ngay) {
        if (notyf) notyf.error('Hạn hợp đồng không được trước ngày hợp đồng');
        return;
      }
    }

    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var nid = document.querySelector('#form-hop-dong input[name="nid"]').value;

    var apiData = {
      so_hop_dong: document.querySelector('#form-hop-dong input[name="so_hop_dong"]').value,
      ngay_hop_dong: document.querySelector('#form-hop-dong input[name="ngay_hop_dong"]').value,
      han_hop_dong: document.querySelector('#form-hop-dong input[name="han_hop_dong"]').value,
      khach_hang: parseInt(document.querySelector('#select-khach-hang').value) || null,
      ghi_chu: document.querySelector('#form-hop-dong input[name="ghi_chu"]').value
    };

    var url = nid ? '/api/hop-dong/' + nid : '/api/hop-dong';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-hop-dong');
    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';

    $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      data: JSON.stringify(apiData),
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status === 'success') {
          if (notyf) notyf.success(nid ? 'Cập nhật thành công' : 'Tạo mới thành công');
          if (!nid && res.data && res.data.nid && PENDING_FILES.length > 0) {
            var newId = res.data.nid;
            var pending = PENDING_FILES.slice();
            PENDING_FILES = [];
            modalHide('hop-dong-modal');
            resetForm();
            loadList();
            CURRENT_HOP_DONG_ID = newId;
            uploadFiles(pending);
          } else {
            modalHide('hop-dong-modal');
            resetForm();
            loadList();
          }
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function (jqXHR) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá hợp đồng này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        confirmButtonColor: '#d33',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) {
          deleteItem(id);
        }
      });
    } else {
      if (confirm('Xác nhận xoá hợp đồng này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/hop-dong/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success('Xoá thành công');
          loadList();
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r && r.message || 'Lỗi kết nối server';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})(jQuery, Drupal);

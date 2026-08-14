(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var BANK_LIST = [];
  var BANK_LIST_LOADED = false;
  var CURRENT_DRIVER_ID = '';
  var CURRENT_FILES = [];
  var CURRENT_FORM_MODE = 'create';
  var SELECTED_DRIVER_FILE = null;
  var FILE_TYPE_LABELS = {
    cccd_truoc: 'CCCD mặt trước',
    cccd_sau: 'CCCD mặt sau',
    bang_lai: 'Bằng lái',
    anh_chan_dung: 'Ảnh chân dung',
    giay_kham_suc_khoe: 'Giấy khám sức khoẻ',
    khac: 'Khác'
  };

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

  Drupal.behaviors.laiXe = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-lai-xe', context).length) {
        loadBankList();
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;
    if (doc.body.getAttribute('data-lai-xe-bound') === '1') return;
    doc.body.setAttribute('data-lai-xe-bound', '1');

    // Search
    doc.getElementById('btn-search-lai-xe').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-lai-xe').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-lai-xe').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    // Enter key submit
    doc.getElementById('form-lai-xe').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        if (e.target && e.target.closest && e.target.closest('#lai-xe-file-section')) return;
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-lai-xe');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-lai-xe');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        doc.getElementById('search-lai-xe').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-lai-xe');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-lai-xe');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('lai-xe-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initDatePickers();
      initMasks();
    });

    // Add bank info row
    var btnThemNh = document.getElementById('btn-them-ngan-hang');
    if (btnThemNh) {
      btnThemNh.addEventListener('click', function () {
        addNganHangRow();
      });
    }

    var uploadFileBtn = document.getElementById('btn-upload-lai-xe-file');
    if (uploadFileBtn) {
      uploadFileBtn.addEventListener('click', function () {
        uploadDriverFile();
      });
    }
    var fileInput = document.getElementById('lx-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        SELECTED_DRIVER_FILE = this.files && this.files.length ? this.files[0] : null;
      });
    }

    // Delegated clicks (dropdown items, pagination)
    doc.addEventListener('click', function (e) {
      var t = e.target;
      // Walk up to find the actual button
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-lai-xe')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-lai-xe')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-lai-xe')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-xoa-ngan-hang')) {
            e.preventDefault();
            var row = t.closest('.ngan-hang-row');
            if (row) {
              var sel = row.querySelector('.ngan-hang-ten-ngan-hang');
              if (sel && typeof $ === 'function' && $.fn.select2) {
                $(sel).select2('destroy');
              }
              row.remove();
            }
            return;
          }
          if (t.classList.contains('btn-lx-file-view')) {
            e.preventDefault();
            viewDriverFile(t.getAttribute('data-file-id'));
            return;
          }
          if (t.classList.contains('btn-lx-file-edit')) {
            e.preventDefault();
            editDriverFileRow(t.getAttribute('data-file-id'));
            return;
          }
          if (t.classList.contains('btn-lx-file-cancel')) {
            e.preventDefault();
            renderFileSection();
            return;
          }
          if (t.classList.contains('btn-lx-file-save')) {
            e.preventDefault();
            saveDriverFileMeta(t.getAttribute('data-file-id'));
            return;
          }
          if (t.classList.contains('btn-lx-file-delete')) {
            e.preventDefault();
            confirmDeleteDriverFile(t.getAttribute('data-file-id'));
            return;
          }
          // Pagination jump
          if (t.id === 'pagination-jump' && e.type === 'keypress' && e.which === 13) {
            var page = parseInt(t.value);
            var total = parseInt(t.getAttribute('data-total-pages'));
            if (page > 0 && page <= total) {
              currentPage = page;
              loadList();
            }
            return;
          }
          // Pagination links
          if (t.classList.contains('page-link')) {
            var pageLink = parseInt(t.getAttribute('data-page'));
            if (pageLink && pageLink !== currentPage) {
              e.preventDefault();
              currentPage = pageLink;
              loadList();
            }
            return;
          }
        }
        t = t.parentElement;
      }
    });

    // Pagination jump keypress (separate listener to avoid conflict)
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
  }

  function submitForm() {
    var form = document.getElementById('form-lai-xe');
    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var inputs = form.querySelectorAll('input, select');
    var data = {};
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.name) data[inp.name] = inp.value;
    }
    data.thong_tin_ngan_hang = collectNganHang();

    var nid = data.nid;
    var url = nid ? '/api/lai-xe/' + nid : '/api/lai-xe';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-lai-xe');
    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';

    $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status === 'success') {
          if (notyf) notyf.success(nid ? 'Cập nhật thành công' : 'Tạo mới thành công');
          modalHide('lai-xe-modal');
          resetForm();
          loadList();
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

  function loadList() {
    var tbody = $('#table-lai-xe-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="9" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    $.ajax({
      url: '/api/lai-xe',
      type: 'GET',
      dataType: 'json',
      data: { page: currentPage, keyword: currentKeyword },
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="9" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="9" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.nid);
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + escapeHtml(item.ten || '') + '</td>' +
            '<td>' + escapeHtml(item.ma_nhan_vien || '') + '</td>' +
            '<td>' + escapeHtml(item.sdt || '') + '</td>' +
            '<td>' + escapeHtml(item.cccd || '') + '</td>' +
            '<td>' + escapeHtml(item.so_bang_lai || '') + '</td>' +
            '<td>' + escapeHtml(item.loai_bang_lai || '') + '</td>' +
            '<td class="text-center">' + escapeHtml(item.dod || '') + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="9" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    var perms = Drupal.settings.lai_xe && Drupal.settings.lai_xe.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.lai_xe_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-lai-xe" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.lai_xe_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-lai-xe" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.lai_xe_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-lai-xe" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-lai-xe');
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
    document.getElementById('lai-xe-modal-title').textContent = 'Chi tiết lái xe';
    document.querySelector('.btn-luu-lai-xe').style.display = 'none';
    showLoading(true);
    modalShow('lai-xe-modal');

    $.ajax({
      url: '/api/lai-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        populateForm(res.data);
        initDatePickers();
        initMasks();
        setFormMode('view');
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('lai-xe-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('lai-xe-modal-title').textContent = 'Cập nhật lái xe';
    document.querySelector('#form-lai-xe input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-lai-xe');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('lai-xe-modal');

    $.ajax({
      url: '/api/lai-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('lai-xe-modal');
          return;
        }
        populateForm(res.data);
        initDatePickers();
        initMasks();
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('lai-xe-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    CURRENT_FORM_MODE = mode;
    var inputs = document.querySelectorAll('#form-lai-xe input, #form-lai-xe textarea, #form-lai-xe select');
    var btn = document.querySelector('.btn-luu-lai-xe');
    for (var i = 0; i < inputs.length; i++) {
      if (mode === 'view') {
        inputs[i].setAttribute('readonly', 'readonly');
        inputs[i].setAttribute('disabled', 'disabled');
      } else {
        inputs[i].removeAttribute('readonly');
        inputs[i].removeAttribute('disabled');
      }
    }
    if (btn) btn.style.display = mode === 'view' ? 'none' : '';
    var btnThemNh = document.getElementById('btn-them-ngan-hang');
    if (btnThemNh) {
      btnThemNh.style.display = mode === 'view' ? 'none' : '';
    }
    var btnXoaNh = document.querySelectorAll('.btn-xoa-ngan-hang');
    for (var j = 0; j < btnXoaNh.length; j++) {
      btnXoaNh[j].style.display = mode === 'view' ? 'none' : '';
    }
    // Handle Select2 bank selects
    var bankSelects = document.querySelectorAll('#form-lai-xe .ngan-hang-ten-ngan-hang');
    for (var k = 0; k < bankSelects.length; k++) {
      var $sel;
      try { $sel = $(bankSelects[k]); } catch (e) {}
      if ($sel && typeof $sel.select2 === 'function' && $sel.data && $sel.data('select2')) {
        $sel.select2(mode === 'view' ? 'disable' : 'enable');
      }
    }
    renderFileSection();
  }

  function initRepeater() {
    var container = document.getElementById('ngan-hang-repeater');
    if (!container) return;
    container.innerHTML = '';
    // Header row with labels (only once)
    var headerHtml = '<div class="row g-2 mb-1">' +
      '<div class="col-md-3"><label class="form-label mb-0">Tên tài khoản</label></div>' +
      '<div class="col-md-4"><label class="form-label mb-0">Số tài khoản</label></div>' +
      '<div class="col-md-4"><label class="form-label mb-0">Ngân hàng</label></div>' +
      '<div class="col-md-1"></div>' +
    '</div>';
    container.innerHTML = headerHtml;
    addNganHangRow();
  }

  function addNganHangRow(data) {
    var container = document.getElementById('ngan-hang-repeater');
    if (!container) return;
    var html = '<div class="ngan-hang-row row g-2 mb-2">' +
      '<div class="col-md-3">' +
        '<input type="text" class="form-control nganh-hang-ten-tai-khoan" placeholder="Tên TK">' +
      '</div>' +
      '<div class="col-md-4">' +
        '<input type="text" class="form-control ngan-hang-so-tai-khoan" placeholder="Số TK">' +
      '</div>' +
      '<div class="col-md-4">' +
        '<select class="form-select ngan-hang-ten-ngan-hang" style="width:100%">' +
          '<option value="">Chọn ngân hàng</option>' +
        '</select>' +
      '</div>' +
      '<div class="col-md-1">' +
        '<button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-ngan-hang"><i class="ti tabler-x"></i></button>' +
      '</div>' +
    '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    var row = div.querySelector('.ngan-hang-row');
    container.appendChild(row);
    var sel = row.querySelector('.ngan-hang-ten-ngan-hang');
    initBankSelect(sel, data ? data.ngan_hang : null);
    if (data) {
      row.querySelector('.nganh-hang-ten-tai-khoan').value = data.ten_tai_khoan || '';
      row.querySelector('.ngan-hang-so-tai-khoan').value = data.so_tai_khoan || '';
    }
  }

  function collectNganHang() {
    var rows = document.querySelectorAll('#ngan-hang-repeater .ngan-hang-row');
    var result = [];
    for (var i = 0; i < rows.length; i++) {
      var ten = rows[i].querySelector('.nganh-hang-ten-tai-khoan').value.trim();
      var so = rows[i].querySelector('.ngan-hang-so-tai-khoan').value.trim();
      var sel = rows[i].querySelector('.ngan-hang-ten-ngan-hang');
      var nh = sel ? sel.value.trim() : '';
      if (ten || so || nh) {
        result.push({ ten_tai_khoan: ten, so_tai_khoan: so, ngan_hang: nh });
      }
    }
    return result;
  }

  function loadBankList() {
    if (BANK_LIST_LOADED) return;
    var cached = localStorage.getItem('bankList');
    if (cached) {
      try { BANK_LIST = JSON.parse(cached); BANK_LIST_LOADED = true; } catch (e) {}
    }
    $.ajax({
      url: 'https://api.vietqr.io/v2/banks',
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res && res.data && res.data.length) {
          BANK_LIST = res.data;
          BANK_LIST_LOADED = true;
          try { localStorage.setItem('bankList', JSON.stringify(res.data)); } catch (e) {}
          // Refresh all existing bank selects
          var selects = document.querySelectorAll('.ngan-hang-ten-ngan-hang');
          for (var i = 0; i < selects.length; i++) {
            var curVal = selects[i].value;
            initBankSelect(selects[i], curVal || null);
          }
        }
      },
      error: function () {}
    });
  }

  function initBankSelect(selEl, value) {
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(selEl);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#lai-xe-modal'),
        placeholder: 'Chọn ngân hàng',
        allowClear: true,
        width: '100%'
      });
    }
    // Populate options from BANK_LIST
    selEl.innerHTML = '<option value="">Chọn ngân hàng</option>';
    for (var i = 0; i < BANK_LIST.length; i++) {
      var b = BANK_LIST[i];
      var opt = document.createElement('option');
      opt.value = b.shortName;
      opt.textContent = b.shortName + ' - ' + b.name;
      selEl.appendChild(opt);
    }
    // Set value
    if (value) {
      var found = false;
      for (var j = 0; j < selEl.options.length; j++) {
        if (selEl.options[j].value === value || selEl.options[j].textContent.indexOf(value) !== -1) {
          selEl.value = selEl.options[j].value;
          found = true;
          break;
        }
      }
      if (!found) {
        var newOpt = document.createElement('option');
        newOpt.value = value;
        newOpt.textContent = value;
        selEl.appendChild(newOpt);
        selEl.value = value;
      }
    }
    // Trigger Select2 change to reflect the value
    if ($jq && $jq.fn.select2 && $jq(selEl).data('select2')) {
      $jq(selEl).trigger('change.select2');
    }
  }

  var LOAI_BANG_LAI_OPTIONS = ['A1', 'A', 'B1', 'B', 'C1', 'C', 'D1', 'D2', 'D', 'BE', 'C1E', 'CE', 'D1E', 'D2E', 'DE'];

  function initLoaiBangLaiSelect(selEl, value) {
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(selEl);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#lai-xe-modal'),
        placeholder: 'Chọn hoặc nhập loại bằng',
        allowClear: true,
        width: '100%',
        tags: true
      });
    }
    selEl.innerHTML = '<option value="">Chọn loại bằng</option>';
    for (var i = 0; i < LOAI_BANG_LAI_OPTIONS.length; i++) {
      var opt = document.createElement('option');
      opt.value = LOAI_BANG_LAI_OPTIONS[i];
      opt.textContent = LOAI_BANG_LAI_OPTIONS[i];
      selEl.appendChild(opt);
    }
    if (value) {
      var found = false;
      for (var j = 0; j < selEl.options.length; j++) {
        if (selEl.options[j].value === value) {
          selEl.value = value;
          found = true;
          break;
        }
      }
      if (!found) {
        var newOpt = document.createElement('option');
        newOpt.value = value;
        newOpt.textContent = value;
        selEl.appendChild(newOpt);
        selEl.value = value;
      }
    }
    if ($jq && $jq.fn.select2 && $jq(selEl).data('select2')) {
      $jq(selEl).trigger('change.select2');
    }
  }

  function resetForm() {
    showLoading(false);
    document.getElementById('form-lai-xe').reset();
    document.querySelector('#form-lai-xe input[name="nid"]').value = '';
    CURRENT_DRIVER_ID = '';
    CURRENT_FILES = [];
    SELECTED_DRIVER_FILE = null;
    document.getElementById('lai-xe-modal-title').textContent = 'Thêm lái xe';
    var selBang = document.querySelector('#form-lai-xe select[name="loai_bang_lai"]');
    if (selBang) initLoaiBangLaiSelect(selBang, '');
    initRepeater();
    setFormMode('create');
  }

  function populateForm(d) {
    CURRENT_DRIVER_ID = d.nid || '';
    CURRENT_FILES = d.files || (d.thong_tin_json && d.thong_tin_json.files ? d.thong_tin_json.files : []);
    document.querySelector('#form-lai-xe input[name="nid"]').value = CURRENT_DRIVER_ID;
    document.querySelector('#form-lai-xe input[name="ten"]').value = d.ten || '';
    document.querySelector('#form-lai-xe input[name="ma_nhan_vien"]').value = d.ma_nhan_vien || '';
    document.querySelector('#form-lai-xe input[name="sdt"]').value = d.sdt || '';
    document.querySelector('#form-lai-xe input[name="cccd"]').value = d.cccd || '';
    document.querySelector('#form-lai-xe input[name="ngay_cap"]').value = d.ngay_cap || '';
    document.querySelector('#form-lai-xe input[name="noi_cap"]').value = d.noi_cap || '';
    document.querySelector('#form-lai-xe input[name="han_cccd"]').value = d.han_cccd || '';
    document.querySelector('#form-lai-xe input[name="so_bang_lai"]').value = d.so_bang_lai || '';
    var selBang = document.querySelector('#form-lai-xe select[name="loai_bang_lai"]');
    if (selBang) {
      initLoaiBangLaiSelect(selBang, d.loai_bang_lai || '');
    }
    document.querySelector('#form-lai-xe input[name="han_bang_lai"]').value = d.han_bang_lai || '';
    document.querySelector('#form-lai-xe input[name="ngay_nhan_viec"]').value = d.ngay_nhan_viec || '';
    document.querySelector('#form-lai-xe input[name="dod"]').value = d.dod || '';

    // Repeater ngan hang
    var container = document.getElementById('ngan-hang-repeater');
    if (container) container.innerHTML = '';
    if (d.thong_tin_ngan_hang && d.thong_tin_ngan_hang.length) {
      for (var i = 0; i < d.thong_tin_ngan_hang.length; i++) {
        addNganHangRow(d.thong_tin_ngan_hang[i]);
      }
    } else {
      addNganHangRow();
    }
    renderFileSection();
  }

  function renderFileSection() {
    var tbody = document.getElementById('lai-xe-file-tbody');
    if (!tbody) return;

    var count = document.getElementById('lai-xe-file-count');
    var note = document.getElementById('lai-xe-file-create-note');
    var upload = document.getElementById('lai-xe-file-upload');
    var canUpload = CURRENT_FORM_MODE !== 'view' && !!CURRENT_DRIVER_ID;

    if (count) count.textContent = (CURRENT_FILES.length || 0) + ' file';
    if (note) note.style.display = CURRENT_DRIVER_ID ? 'none' : '';
    if (upload) upload.style.display = canUpload ? '' : 'none';

    if (!CURRENT_FILES.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có hồ sơ</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < CURRENT_FILES.length; i++) {
      var f = CURRENT_FILES[i] || {};
      var title = f.ten_hien_thi || f.filename || '';
      html += '<tr data-file-id="' + escapeHtml(f.id || '') + '">' +
        '<td class="text-center text-muted">' + (i + 1) + '</td>' +
        '<td><span class="badge bg-label-secondary border">' + escapeHtml(fileTypeLabel(f.loai)) + '</span></td>' +
        '<td><div class="d-flex align-items-center gap-2 min-w-0">' +
          '<i class="ti ' + fileIcon(f) + '"></i>' +
          '<div class="min-w-0"><div class="fw-medium text-truncate">' + escapeHtml(title) + '</div>' +
          '<div class="small text-muted text-truncate">' + escapeHtml(f.filename || '') + '</div></div>' +
        '</div></td>' +
        '<td class="text-end">' + escapeHtml(formatFileSize(f.size)) + '</td>' +
        '<td class="text-center">' + escapeHtml(fileUploadedText(f)) + '</td>' +
        '<td class="text-center">' + fileActions(f) + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = html;
  }

  function fileActions(file) {
    var id = escapeHtml(file && file.id ? file.id : '');
    var html = '<div class="d-flex justify-content-center gap-1">' +
      '<button type="button" class="btn btn-sm btn-icon btn-label-primary btn-lx-file-view" data-file-id="' + id + '" title="Xem"><i class="ti tabler-eye"></i></button>';
    if (CURRENT_FORM_MODE !== 'view') {
      html += '<button type="button" class="btn btn-sm btn-icon btn-label-warning btn-lx-file-edit" data-file-id="' + id + '" title="Sửa"><i class="ti tabler-edit"></i></button>' +
        '<button type="button" class="btn btn-sm btn-icon btn-label-danger btn-lx-file-delete" data-file-id="' + id + '" title="Xoá"><i class="ti tabler-trash"></i></button>';
    }
    return html + '</div>';
  }

  function editDriverFileRow(fileId) {
    var index = findFileIndex(fileId);
    if (index < 0 || CURRENT_FORM_MODE === 'view') return;
    var f = CURRENT_FILES[index] || {};
    var row = document.querySelector('#lai-xe-file-tbody tr[data-file-id="' + cssEscape(fileId) + '"]');
    if (!row) return;

    row.innerHTML =
      '<td class="text-center text-muted">' + (index + 1) + '</td>' +
      '<td><select class="form-select form-select-sm lx-file-edit-type">' + fileTypeOptions(f.loai) + '</select></td>' +
      '<td><input type="text" class="form-control form-control-sm lx-file-edit-title" value="' + escapeHtml(f.ten_hien_thi || f.filename || '') + '"></td>' +
      '<td class="text-end">' + escapeHtml(formatFileSize(f.size)) + '</td>' +
      '<td class="text-center">' + escapeHtml(fileUploadedText(f)) + '</td>' +
      '<td class="text-center"><div class="d-flex justify-content-center gap-1">' +
        '<button type="button" class="btn btn-sm btn-icon btn-primary text-white btn-lx-file-save" data-file-id="' + escapeHtml(fileId) + '" title="Lưu"><i class="ti tabler-check"></i></button>' +
        '<button type="button" class="btn btn-sm btn-icon btn-label-secondary btn-lx-file-cancel" title="Huỷ"><i class="ti tabler-x"></i></button>' +
      '</div></td>';
  }

  function uploadDriverFile() {
    if (!CURRENT_DRIVER_ID) {
      if (notyf) notyf.error('Vui lòng lưu lái xe trước khi upload hồ sơ');
      return;
    }

    var input = document.querySelector('#lai-xe-file-upload input[type="file"]');
    var btn = document.getElementById('btn-upload-lai-xe-file');
    var selectedFile = input && input.files && input.files.length ? input.files[0] : SELECTED_DRIVER_FILE;
    if (!selectedFile && (!input || !input.value)) {
      if (notyf) notyf.error('Vui lòng chọn file cần upload');
      return;
    }

    var formData = new FormData();
    if (selectedFile) {
      formData.append('driver_file', selectedFile, selectedFile.name || 'driver_file');
    }
    formData.append('loai', document.getElementById('lx-file-type').value || 'khac');
    formData.append('ten_hien_thi', document.getElementById('lx-file-title').value || '');

    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang upload';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/lai-xe/' + CURRENT_DRIVER_ID + '/file', true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.onload = function () {
      var res = null;
      try {
        res = JSON.parse(xhr.responseText || '{}');
      } catch (e) {}

      if (xhr.status >= 200 && xhr.status < 300) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-upload me-1"></i>Upload';
        if (res && res.status === 'success' && res.data) {
          CURRENT_FILES = res.data.files || [];
          input.value = '';
          SELECTED_DRIVER_FILE = null;
          document.getElementById('lx-file-title').value = '';
          renderFileSection();
          if (notyf) notyf.success('Upload hồ sơ thành công');
        } else {
          if (notyf) notyf.error((res && res.message) || 'Upload không thành công');
        }
      } else {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-upload me-1"></i>Upload';
        if (notyf) notyf.error((res && res.message) || 'Upload không thành công');
      }
    };
    xhr.onerror = function () {
      btn.removeAttribute('disabled');
      btn.innerHTML = '<i class="ti tabler-upload me-1"></i>Upload';
      if (notyf) notyf.error('Lỗi kết nối server');
    };
    xhr.send(formData);
  }

  function saveDriverFileMeta(fileId) {
    var row = document.querySelector('#lai-xe-file-tbody tr[data-file-id="' + cssEscape(fileId) + '"]');
    if (!row || !CURRENT_DRIVER_ID) return;
    var btn = row.querySelector('.btn-lx-file-save');
    var payload = {
      loai: row.querySelector('.lx-file-edit-type').value || 'khac',
      ten_hien_thi: row.querySelector('.lx-file-edit-title').value || ''
    };
    if (btn) {
      btn.setAttribute('disabled', 'disabled');
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    }

    $.ajax({
      url: '/api/lai-xe/' + CURRENT_DRIVER_ID + '/file/' + encodeURIComponent(fileId),
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success' && res.data) {
          CURRENT_FILES = res.data.files || [];
          renderFileSection();
          if (notyf) notyf.success('Cập nhật hồ sơ thành công');
        } else {
          renderFileSection();
          if (notyf) notyf.error(res.message || 'Cập nhật không thành công');
        }
      },
      error: function (jqXHR) {
        renderFileSection();
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function confirmDeleteDriverFile(fileId) {
    if (!CURRENT_DRIVER_ID) return;
    var done = function () { deleteDriverFile(fileId); };
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá file hồ sơ này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        confirmButtonColor: '#d33',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) done();
      });
    } else if (confirm('Xác nhận xoá file hồ sơ này?')) {
      done();
    }
  }

  function deleteDriverFile(fileId) {
    $.ajax({
      url: '/api/lai-xe/' + CURRENT_DRIVER_ID + '/file/' + encodeURIComponent(fileId),
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success' && res.data) {
          CURRENT_FILES = res.data.files || [];
          renderFileSection();
          if (notyf) notyf.success('Xoá hồ sơ thành công');
        } else {
          if (notyf) notyf.error(res.message || 'Xoá không thành công');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function viewDriverFile(fileId) {
    var index = findFileIndex(fileId);
    if (index < 0 || !CURRENT_FILES[index].url) {
      if (notyf) notyf.error('Không tìm thấy đường dẫn file');
      return;
    }
    window.open(CURRENT_FILES[index].url, '_blank', 'noopener');
  }

  function findFileIndex(fileId) {
    for (var i = 0; i < CURRENT_FILES.length; i++) {
      if (String(CURRENT_FILES[i].id) === String(fileId)) return i;
    }
    return -1;
  }

  function fileTypeLabel(type) {
    return FILE_TYPE_LABELS[type] || FILE_TYPE_LABELS.khac;
  }

  function fileTypeOptions(value) {
    var html = '';
    for (var key in FILE_TYPE_LABELS) {
      if (!Object.prototype.hasOwnProperty.call(FILE_TYPE_LABELS, key)) continue;
      html += '<option value="' + escapeHtml(key) + '"' + (key === value ? ' selected' : '') + '>' + escapeHtml(FILE_TYPE_LABELS[key]) + '</option>';
    }
    return html;
  }

  function fileIcon(file) {
    var mime = file && file.mime ? String(file.mime) : '';
    return mime.indexOf('pdf') !== -1 ? 'tabler-file-type-pdf text-danger' : 'tabler-photo text-info';
  }

  function fileUploadedText(file) {
    if (!file) return '';
    if (file.uploaded_text) return file.uploaded_text;
    if (file.uploaded) {
      var d = new Date(parseInt(file.uploaded, 10) * 1000);
      if (!isNaN(d.getTime())) {
        return pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
      }
    }
    return '';
  }

  function formatFileSize(size) {
    size = parseInt(size, 10) || 0;
    if (!size) return '';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
    return (size / 1024 / 1024).toFixed(1).replace('.0', '') + ' MB';
  }

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') {
      return window.CSS.escape(value);
    }
    return String(value).replace(/"/g, '\\"');
  }

  function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
      $('.flatpickr-date').each(function () {
        try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
        if (!this.hasAttribute('readonly')) {
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, static: true });
        }
      });
    }
  }

  function initMasks() {
    if (typeof Cleave !== 'undefined') {
      $('.phone-mask').each(function () {
        if (this.hasAttribute('readonly')) return;
        if (!this._cleave) {
          this._cleave = new Cleave(this, { phone: true, phoneRegionCode: 'VN' });
        }
      });
      $('.date-mask').each(function () {
        if (this.hasAttribute('readonly')) return;
        if (!this._cleave) {
          this._cleave = new Cleave(this, { date: true, datePattern: ['d', 'm', 'Y'] });
        }
      });
    }
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá lái xe này?',
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
      if (confirm('Xác nhận xoá lái xe này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/lai-xe/' + id,
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

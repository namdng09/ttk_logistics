(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var currentLoai = '';
  var CURRENT_VEHICLE_ID = '';
  var CURRENT_FILES = [];
  var CURRENT_FORM_MODE = 'create';
  var SELECTED_VEHICLE_FILE = null;
  var LOAI_PHUONG_TIEN_MAP = {
    dau_keo: 'Đầu kéo',
    mooc: 'Mooc',
  };
  var LOAI_PHUONG_TIEN_COLOR = {
    dau_keo: 'bg-label-primary',
    mooc: 'bg-label-warning',
  };
  var FILE_TYPE_LABELS = {
    dang_ky_xe: 'Đăng ký xe',
    dang_kiem: 'Đăng kiểm',
    bao_hiem_than_vo: 'Bảo hiểm thân vỏ',
    bao_hiem_tnds: 'Bảo hiểm TNDS',
    phu_hieu: 'Phù hiệu',
    khac: 'Khác'
  };
  var currentItemsMap = {};

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

  function fileIsImage(file) {
    var mime = file && file.mime ? String(file.mime).toLowerCase() : '';
    var url = file && file.url ? String(file.url).toLowerCase() : '';
    return mime.indexOf('image/') === 0 || /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(url);
  }

  function fileIsPdf(file) {
    var mime = file && file.mime ? String(file.mime).toLowerCase() : '';
    var url = file && file.url ? String(file.url).toLowerCase() : '';
    return mime.indexOf('pdf') !== -1 || /\.pdf(\?|$)/.test(url);
  }

  function ensureVehicleFilePreviewModal() {
    if (document.getElementById('phuong-tien-file-preview-modal')) return;
    document.body.insertAdjacentHTML('beforeend',
      '<div class="modal fade" id="phuong-tien-file-preview-modal" tabindex="-1" aria-hidden="true">' +
        '<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">' +
          '<div class="modal-content">' +
            '<div class="modal-header">' +
              '<h5 class="modal-title mb-0" id="phuong-tien-file-preview-title">Xem hồ sơ phương tiện</h5>' +
              '<div class="d-flex align-items-center gap-2 ms-auto">' +
                '<a class="btn btn-sm btn-label-primary" id="phuong-tien-file-preview-open" href="#" target="_blank" rel="noopener"><i class="ti tabler-external-link me-1"></i>Mở tab mới</a>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
              '</div>' +
            '</div>' +
            '<div class="modal-body text-center" id="phuong-tien-file-preview-body"></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function openVehicleFilePreview(file) {
    if (!file || !file.url) return;
    ensureVehicleFilePreviewModal();
    var title = file.ten_hien_thi || file.filename || 'Xem hồ sơ phương tiện';
    document.getElementById('phuong-tien-file-preview-title').textContent = title;
    document.getElementById('phuong-tien-file-preview-open').setAttribute('href', file.url);

    var body = document.getElementById('phuong-tien-file-preview-body');
    if (fileIsImage(file)) {
      body.innerHTML = '<img src="' + escapeHtml(file.url) + '" alt="' + escapeHtml(file.filename || title) + '" class="phuong-tien-file-preview-img">';
    } else if (fileIsPdf(file)) {
      body.innerHTML =
        '<div class="phuong-tien-file-preview-pdf">' +
          '<iframe src="' + escapeHtml(file.url) + '" title="' + escapeHtml(title) + '"></iframe>' +
        '</div>';
    } else {
      body.innerHTML =
        '<div class="phuong-tien-file-preview-file">' +
          '<i class="ti tabler-file"></i>' +
          '<div class="fw-semibold mt-2">' + escapeHtml(title) + '</div>' +
          '<a class="btn btn-primary mt-3" target="_blank" rel="noopener" href="' + escapeHtml(file.url) + '"><i class="ti tabler-external-link me-1"></i>Mở file</a>' +
        '</div>';
    }

    var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(document.getElementById('phuong-tien-file-preview-modal')) : new bootstrap.Modal(document.getElementById('phuong-tien-file-preview-modal'));
    modal.show();
  }

  Drupal.behaviors.phuongTien = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-phuong-tien', context).length) {
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;
    if (doc.body.getAttribute('data-phuong-tien-bound') === '1') return;
    doc.body.setAttribute('data-phuong-tien-bound', '1');

    // Search
    doc.getElementById('btn-search-phuong-tien').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-phuong-tien').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-phuong-tien').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    // Filter loại phương tiện
    doc.getElementById('filter-loai-phuong-tien').addEventListener('change', function () {
      currentLoai = this.value;
      currentPage = 1;
      loadList();
    });

    // Enter key submit
    doc.getElementById('form-phuong-tien').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        if (e.target && e.target.closest && e.target.closest('#phuong-tien-file-section')) return;
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-phuong-tien');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-phuong-tien');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentLoai = '';
        doc.getElementById('search-phuong-tien').value = '';
        doc.getElementById('filter-loai-phuong-tien').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-phuong-tien');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-phuong-tien');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('phuong-tien-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initDatePickers();
      initMasks();
    });

    var uploadFileBtn = document.getElementById('btn-upload-phuong-tien-file');
    if (uploadFileBtn) {
      uploadFileBtn.addEventListener('click', function () {
        uploadVehicleFile();
      });
    }
    var fileInput = document.getElementById('pt-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        SELECTED_VEHICLE_FILE = this.files && this.files.length ? this.files[0] : null;
      });
    }

    // Delegated clicks (dropdown items, pagination)
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-phuong-tien')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-phuong-tien')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-assign-lai-xe')) {
            e.preventDefault();
            var nid = t.getAttribute('data-id');
            var tr = t.closest('tr');
            var bks = tr.querySelector('td:nth-child(3)').textContent;
            var maTS = tr.querySelector('td:nth-child(4)').textContent;
            var bksText = bks + (maTS ? ' - ' + maTS : '');
            var item = currentItemsMap[nid] || null;
            var laixeData = item ? (item.lai_xe || null) : null;
            window.ptlxOpenAssignModal(nid, bksText, laixeData);
            return;
          }
          if (t.classList.contains('btn-delete-phuong-tien')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-pt-file-view')) {
            e.preventDefault();
            viewVehicleFile(t.getAttribute('data-file-id'));
            return;
          }
          if (t.classList.contains('btn-pt-file-edit')) {
            e.preventDefault();
            editVehicleFileRow(t.getAttribute('data-file-id'));
            return;
          }
          if (t.classList.contains('btn-pt-file-cancel')) {
            e.preventDefault();
            renderFileSection();
            return;
          }
          if (t.classList.contains('btn-pt-file-save')) {
            e.preventDefault();
            saveVehicleFileMeta(t.getAttribute('data-file-id'));
            return;
          }
          if (t.classList.contains('btn-pt-file-delete')) {
            e.preventDefault();
            confirmDeleteVehicleFile(t.getAttribute('data-file-id'));
            return;
          }
          if (t.id === 'pagination-jump' && e.type === 'keypress' && e.which === 13) {
            var page = parseInt(t.value);
            var total = parseInt(t.getAttribute('data-total-pages'));
            if (page > 0 && page <= total) {
              currentPage = page;
              loadList();
            }
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
        }
        t = t.parentElement;
      }
    });

    // Pagination jump keypress
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
    var form = document.getElementById('form-phuong-tien');
    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var data = {};
    var allInputs = form.querySelectorAll('input, select');
    for (var i = 0; i < allInputs.length; i++) {
      var inp = allInputs[i];
      if (inp.name) {
        var val = inp.value;
        if (inp.classList.contains('money-mask')) {
          val = val.replace(/\./g, '');
        }
        data[inp.name] = val;
      }
    }

    var nid = data.nid;
    var url = nid ? '/api/phuong-tien/' + nid : '/api/phuong-tien';
    var method = nid ? 'PUT' : 'POST';

    if (data.ngay_phu_hieu && data.han_phu_hieu) {
      var parts1 = data.ngay_phu_hieu.split('/');
      var parts2 = data.han_phu_hieu.split('/');
      var d1 = new Date(parts1[2], parts1[1] - 1, parts1[0]);
      var d2 = new Date(parts2[2], parts2[1] - 1, parts2[0]);
      if (d2 < d1) {
        if (notyf) notyf.error('Hạn phù hiệu không được trước ngày phù hiệu');
        return;
      }
    }

    var btn = document.querySelector('.btn-luu-phuong-tien');
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
          modalHide('phuong-tien-modal');
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
    var tbody = $('#table-phuong-tien-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="7" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    $.ajax({
      url: '/api/phuong-tien',
      type: 'GET',
      dataType: 'json',
      data: { page: currentPage, keyword: currentKeyword, loai_phuong_tien: currentLoai },
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="7" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        currentItemsMap = {};
        for (var k = 0; k < items.length; k++) {
          currentItemsMap[items[k].nid] = items[k];
        }

        if (items.length === 0) {
          tbody.append('<tr><td colspan="7" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.nid);
          var giaMua = item.gia_mua ? formatMoney(item.gia_mua) : '';
          var laixeName = '';
          var laixeSDT = '';
          if (item.lai_xe) {
            laixeName = escapeHtml(item.lai_xe.ten || '');
            laixeSDT = item.lai_xe.sdt ? ' <small class="text-muted">(' + escapeHtml(item.lai_xe.sdt) + ')</small>' : '';
          } else {
            laixeName = '<span class="text-muted fst-italic">Chưa chọn</span>';
          }
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + escapeHtml(item.bks || '') + '</td>' +
            '<td>' + escapeHtml(item.ma_tai_san || '') + '</td>' +
            '<td><span class="badge ' + (LOAI_PHUONG_TIEN_COLOR[item.loai_phuong_tien] || 'bg-label-secondary') + '">' + escapeHtml(LOAI_PHUONG_TIEN_MAP[item.loai_phuong_tien] || item.loai_phuong_tien || '') + '</span></td>' +
            '<td>' + escapeHtml(item.hang_xe || '') + '</td>' +
            '<td>' + laixeName + laixeSDT + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="7" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function formatMoney(n) {
    if (!n) return '';
    var s = String(n).replace(/[^\d.-]/g, '');
    var num = parseFloat(s);
    if (isNaN(num)) return '';
    var intPart = num % 1 === 0 ? String(Math.round(num)) : String(Math.floor(num));
    return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function buildActions(nid) {
    var perms = Drupal.settings.phuong_tien && Drupal.settings.phuong_tien.permissions;
    if (!perms) return '';
    var item = currentItemsMap[nid] || null;

    var items = '';
    if (perms.phuong_tien_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-phuong-tien" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.phuong_tien_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-phuong-tien" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
      items += '<li><button type="button" class="dropdown-item btn-assign-lai-xe" data-id="' + nid + '"><i class="ti tabler-steering-wheel me-2"></i>Chọn lái xe</button></li>';
    }
    if (perms.phuong_tien_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-phuong-tien" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-phuong-tien');
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
    document.getElementById('phuong-tien-modal-title').textContent = 'Chi tiết phương tiện';
    document.querySelector('.btn-luu-phuong-tien').style.display = 'none';
    showLoading(true);
    modalShow('phuong-tien-modal');

    $.ajax({
      url: '/api/phuong-tien/' + id,
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
        modalHide('phuong-tien-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('phuong-tien-modal-title').textContent = 'Cập nhật phương tiện';
    document.querySelector('#form-phuong-tien input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-phuong-tien');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('phuong-tien-modal');

    $.ajax({
      url: '/api/phuong-tien/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('phuong-tien-modal');
          return;
        }
        populateForm(res.data);
        initDatePickers();
        initMasks();
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('phuong-tien-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    CURRENT_FORM_MODE = mode;
    var inputs = document.querySelectorAll('#form-phuong-tien input, #form-phuong-tien textarea, #form-phuong-tien select');
    var btn = document.querySelector('.btn-luu-phuong-tien');
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
    renderFileSection();
  }

  function resetForm() {
    showLoading(false);
    document.getElementById('form-phuong-tien').reset();
    document.querySelector('#form-phuong-tien input[name="nid"]').value = '';
    CURRENT_VEHICLE_ID = '';
    CURRENT_FILES = [];
    SELECTED_VEHICLE_FILE = null;
    document.getElementById('phuong-tien-modal-title').textContent = 'Thêm phương tiện';
    setFormMode('create');
  }

  function populateForm(d) {
    CURRENT_VEHICLE_ID = d.nid || '';
    CURRENT_FILES = d.files || (d.thong_tin_json && d.thong_tin_json.files ? d.thong_tin_json.files : []);
    document.querySelector('#form-phuong-tien input[name="nid"]').value = CURRENT_VEHICLE_ID;
    document.querySelector('#form-phuong-tien input[name="bks"]').value = d.bks || '';
    document.querySelector('#form-phuong-tien input[name="ma_tai_san"]').value = d.ma_tai_san || '';
    document.querySelector('#form-phuong-tien select[name="loai_phuong_tien"]').value = d.loai_phuong_tien || '';
    document.querySelector('#form-phuong-tien input[name="hang_xe"]').value = d.hang_xe || '';
    document.querySelector('#form-phuong-tien input[name="nam_san_xuat"]').value = d.nam_san_xuat || '';
    document.querySelector('#form-phuong-tien input[name="gia_mua"]').value = d.gia_mua ? formatMoney(d.gia_mua) : '';
    document.querySelector('#form-phuong-tien input[name="ngay_mua"]').value = d.ngay_mua || '';
    document.querySelector('#form-phuong-tien input[name="so_dang_kiem"]').value = d.so_dang_kiem || '';
    document.querySelector('#form-phuong-tien input[name="han_dang_kiem"]').value = d.han_dang_kiem || '';
    document.querySelector('#form-phuong-tien input[name="so_bao_hiem_than_vo"]').value = d.so_bao_hiem_than_vo || '';
    document.querySelector('#form-phuong-tien input[name="han_bao_hiem_than_vo"]').value = d.han_bao_hiem_than_vo || '';
    document.querySelector('#form-phuong-tien input[name="so_bao_hiem_tnds"]').value = d.so_bao_hiem_tnds || '';
    document.querySelector('#form-phuong-tien input[name="han_bao_hiem_tnds"]').value = d.han_bao_hiem_tnds || '';
    document.querySelector('#form-phuong-tien input[name="ngay_phu_hieu"]').value = d.ngay_phu_hieu || '';
    document.querySelector('#form-phuong-tien input[name="han_phu_hieu"]').value = d.han_phu_hieu || '';
    renderFileSection();
  }

  function renderFileSection() {
    var tbody = document.getElementById('phuong-tien-file-tbody');
    if (!tbody) return;

    var count = document.getElementById('phuong-tien-file-count');
    var note = document.getElementById('phuong-tien-file-create-note');
    var upload = document.getElementById('phuong-tien-file-upload');
    var canUpload = CURRENT_FORM_MODE !== 'view' && !!CURRENT_VEHICLE_ID;

    if (count) count.textContent = (CURRENT_FILES.length || 0) + ' file';
    if (note) note.style.display = CURRENT_VEHICLE_ID ? 'none' : '';
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
      '<button type="button" class="btn btn-sm btn-icon btn-label-primary btn-pt-file-view" data-file-id="' + id + '" title="Xem"><i class="ti tabler-eye"></i></button>';
    if (CURRENT_FORM_MODE !== 'view') {
      html += '<button type="button" class="btn btn-sm btn-icon btn-label-warning btn-pt-file-edit" data-file-id="' + id + '" title="Sửa"><i class="ti tabler-edit"></i></button>' +
        '<button type="button" class="btn btn-sm btn-icon btn-label-danger btn-pt-file-delete" data-file-id="' + id + '" title="Xoá"><i class="ti tabler-trash"></i></button>';
    }
    return html + '</div>';
  }

  function uploadVehicleFile() {
    if (!CURRENT_VEHICLE_ID) {
      if (notyf) notyf.error('Vui lòng lưu phương tiện trước khi upload hồ sơ');
      return;
    }

    var input = document.querySelector('#phuong-tien-file-upload input[type="file"]');
    var btn = document.getElementById('btn-upload-phuong-tien-file');
    var selectedFile = input && input.files && input.files.length ? input.files[0] : SELECTED_VEHICLE_FILE;
    if (!selectedFile && (!input || !input.value)) {
      if (notyf) notyf.error('Vui lòng chọn file cần upload');
      return;
    }

    var formData = new FormData();
    if (selectedFile) {
      formData.append('vehicle_file', selectedFile, selectedFile.name || 'vehicle_file');
    }
    formData.append('loai', document.getElementById('pt-file-type').value || 'khac');
    formData.append('ten_hien_thi', document.getElementById('pt-file-title').value || '');

    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Đang upload';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/phuong-tien/' + CURRENT_VEHICLE_ID + '/file', true);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.onload = function () {
      var res = null;
      try { res = JSON.parse(xhr.responseText || '{}'); } catch (e) {}

      btn.removeAttribute('disabled');
      btn.innerHTML = '<i class="ti tabler-upload me-1"></i>Upload';
      if (xhr.status >= 200 && xhr.status < 300 && res && res.status === 'success' && res.data) {
        CURRENT_FILES = res.data.files || [];
        input.value = '';
        SELECTED_VEHICLE_FILE = null;
        document.getElementById('pt-file-title').value = '';
        renderFileSection();
        if (notyf) notyf.success('Upload hồ sơ thành công');
      } else {
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

  function editVehicleFileRow(fileId) {
    var index = findFileIndex(fileId);
    if (index < 0 || CURRENT_FORM_MODE === 'view') return;
    var f = CURRENT_FILES[index] || {};
    var row = document.querySelector('#phuong-tien-file-tbody tr[data-file-id="' + cssEscape(fileId) + '"]');
    if (!row) return;

    row.innerHTML =
      '<td class="text-center text-muted">' + (index + 1) + '</td>' +
      '<td><select class="form-select form-select-sm pt-file-edit-type">' + fileTypeOptions(f.loai) + '</select></td>' +
      '<td><input type="text" class="form-control form-control-sm pt-file-edit-title" value="' + escapeHtml(f.ten_hien_thi || f.filename || '') + '"></td>' +
      '<td class="text-end">' + escapeHtml(formatFileSize(f.size)) + '</td>' +
      '<td class="text-center">' + escapeHtml(fileUploadedText(f)) + '</td>' +
      '<td class="text-center"><div class="d-flex justify-content-center gap-1">' +
        '<button type="button" class="btn btn-sm btn-icon btn-primary text-white btn-pt-file-save" data-file-id="' + escapeHtml(fileId) + '" title="Lưu"><i class="ti tabler-check"></i></button>' +
        '<button type="button" class="btn btn-sm btn-icon btn-label-secondary btn-pt-file-cancel" title="Huỷ"><i class="ti tabler-x"></i></button>' +
      '</div></td>';
  }

  function saveVehicleFileMeta(fileId) {
    var row = document.querySelector('#phuong-tien-file-tbody tr[data-file-id="' + cssEscape(fileId) + '"]');
    if (!row || !CURRENT_VEHICLE_ID) return;
    var btn = row.querySelector('.btn-pt-file-save');
    var payload = {
      loai: row.querySelector('.pt-file-edit-type').value || 'khac',
      ten_hien_thi: row.querySelector('.pt-file-edit-title').value || ''
    };
    if (btn) {
      btn.setAttribute('disabled', 'disabled');
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
    }

    $.ajax({
      url: '/api/phuong-tien/' + CURRENT_VEHICLE_ID + '/file/' + encodeURIComponent(fileId),
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

  function confirmDeleteVehicleFile(fileId) {
    if (!CURRENT_VEHICLE_ID) return;
    var done = function () { deleteVehicleFile(fileId); };
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

  function deleteVehicleFile(fileId) {
    $.ajax({
      url: '/api/phuong-tien/' + CURRENT_VEHICLE_ID + '/file/' + encodeURIComponent(fileId),
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

  function viewVehicleFile(fileId) {
    var index = findFileIndex(fileId);
    if (index < 0 || !CURRENT_FILES[index].url) {
      if (notyf) notyf.error('Không tìm thấy đường dẫn file');
      return;
    }
    openVehicleFilePreview(CURRENT_FILES[index]);
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
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
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
    // Money mask with thousands separator (no Cleave dependency)
    $('.money-mask').each(function () {
      if (this.hasAttribute('readonly')) return;
      if (this._moneyHandler) return;
      this._moneyHandler = true;
      this.addEventListener('input', function () {
        var cursor = this.selectionStart;
        var raw = this.value.replace(/[^\d]/g, '');
        var formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        if (formatted !== this.value) {
          var diff = formatted.length - this.value.length;
          this.value = formatted;
          this.setSelectionRange(cursor + diff, cursor + diff);
        }
      });
    });
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá phương tiện này?',
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
      if (confirm('Xác nhận xoá phương tiện này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/phuong-tien/' + id,
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

  // Expose loadList for external modules (phuong_tien_lai_xe)
  window.ptlxLoadList = loadList;

})(jQuery, Drupal);

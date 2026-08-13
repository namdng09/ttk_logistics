(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var currentPhanLoai = '';
  var currentMode = 'create';
  var quickCreateCallback = null;
  var modalBound = false;
  var settings = Drupal.settings.danh_muc || {};
  var PHAN_LOAI_CO_PHU_PHI = settings.phan_loai_co_phu_phi || ['Bãi', 'Cảng', 'Kho'];
  var PHAN_LOAI_OPTIONS = ['Phòng ban', 'Chức vụ', 'Chi phí', 'Kho', 'Cửa khẩu', 'Bãi', 'Cảng'];

  function hasPhuPhi(phanLoai) {
    return PHAN_LOAI_CO_PHU_PHI.indexOf(phanLoai) !== -1;
  }

  function parseThongTinJson(raw) {
    var data = {};
    if (!raw) {
      return data;
    }

    if (typeof raw === 'object') {
      data = raw;
    } else {
      try {
        data = JSON.parse(raw);
      } catch (e) {
        data = {};
      }
    }

    if (!data || typeof data !== 'object') {
      return {};
    }

    if (!Array.isArray(data.phu_phi)) {
      data.phu_phi = [];
    }

    return data;
  }

  function getPhuPhiItems(item) {
    return parseThongTinJson(item && item.thong_tin).phu_phi || [];
  }

  function getTongPhuPhi(items) {
    var tong = 0;
    for (var i = 0; i < items.length; i++) {
      tong += parseInt(items[i].so_tien, 10) || 0;
    }
    return tong;
  }

  function formatMoney(n) {
    if (!n || isNaN(n)) return '';
    return Number(n).toLocaleString('vi-VN');
  }

  function parseMoney(s) {
    if (!s) return 0;
    return parseInt(String(s).replace(/[^\d]/g, ''), 10) || 0;
  }

  function applyMoneyMaskValue(input) {
    if (!input) return;
    input.value = formatMoney(parseMoney(input.value));
  }

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

  Drupal.behaviors.danhMuc = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#danh-muc-modal', context).length) {
        bindModalEvents();
      }
      if ($('#table-danh-muc', context).length) {
        loadList();
        bindListEvents();
      }
    }
  };

  function ensureModal() {
    var modal = document.getElementById('danh-muc-modal');
    if (modal) {
      return modal;
    }
    var currentSettings = (Drupal.settings && Drupal.settings.danh_muc) ? Drupal.settings.danh_muc : settings;
    var html = (currentSettings && currentSettings.modal_html) || '';
    if (!html) {
      return null;
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var node = wrap.firstElementChild;
    if (!node) {
      return null;
    }
    document.body.appendChild(node);
    bindModalEvents();
    return node;
  }

  function setPhanLoaiOptions(list) {
    var sel = document.querySelector('#form-danh-muc select[name="phan_loai"]');
    if (!sel) return;
    var current = sel.value;
    sel.innerHTML = '';
    var ph = document.createElement('option');
    ph.value = '';
    ph.textContent = 'Chọn phân loại';
    sel.appendChild(ph);
    for (var i = 0; i < list.length; i++) {
      var o = document.createElement('option');
      o.value = list[i];
      o.textContent = list[i];
      sel.appendChild(o);
    }
    sel.value = list.indexOf(current) !== -1 ? current : '';
  }

  Drupal.danhMuc = Drupal.danhMuc || {};
  Drupal.danhMuc.openCreate = function (config) {
    config = config || {};
    var modal = ensureModal();
    if (!modal) {
      if (notyf) notyf.error('Không tải được form tạo danh mục');
      return;
    }
    resetForm();
    setFormMode('create');
    if (config.phanLoaiOptions && config.phanLoaiOptions.length) {
      setPhanLoaiOptions(config.phanLoaiOptions);
    }
    var loaiSelect = document.querySelector('#form-danh-muc select[name="phan_loai"]');
    if (config.phanLoai && loaiSelect) {
      loaiSelect.value = config.phanLoai;
      togglePhuPhiSection(config.phanLoai);
      if (config.phanLoaiLocked) {
        loaiSelect.setAttribute('disabled', 'disabled');
      }
    }
    quickCreateCallback = config.onCreated || null;
    modalShow('danh-muc-modal');
  };

  function bindModalEvents() {
    if (modalBound) return;
    modalBound = true;
    var doc = document;
    var form = doc.getElementById('form-danh-muc');
    if (!form) return;

    // Enter key submit
    form.addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-danh-muc');
        if (btn && !btn.disabled) btn.click();
      }
    });

    var loaiSelect = form.querySelector('select[name="phan_loai"]');
    if (loaiSelect) {
      loaiSelect.addEventListener('change', function () {
        togglePhuPhiSection(this.value);
      });
    }

    var btnThemPhi = doc.getElementById('btn-them-phu-phi');
    if (btnThemPhi) {
      btnThemPhi.addEventListener('click', function () {
        addPhuPhiRow();
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-danh-muc');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('danh-muc-modal');
    if (modal) {
      modal.addEventListener('hidden.bs.modal', function () {
        resetForm();
        quickCreateCallback = null;
      });
      modal.addEventListener('shown.bs.modal', function () {
        initMoneyMasks();
        var backdrops = doc.querySelectorAll('.modal-backdrop.show');
        if (backdrops.length) {
          backdrops[backdrops.length - 1].style.zIndex = '1900';
        }
        modal.style.zIndex = '2000';
      });
    }

    // Delegated clicks (phu phi row remove)
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList && t.classList.contains('btn-xoa-phu-phi')) {
          e.preventDefault();
          var row = t.closest('.phu-phi-row');
          if (row) row.remove();
          return;
        }
        t = t.parentElement;
      }
    });
  }

  function bindListEvents() {
    var doc = document;

    // Search
    doc.getElementById('btn-search-danh-muc').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-danh-muc').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-danh-muc').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    // Filter phan loai
    doc.getElementById('filter-phan-loai').addEventListener('change', function () {
      currentPhanLoai = this.value;
      currentPage = 1;
      loadList();
    });

    // Enter key submit
    doc.getElementById('form-danh-muc').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-danh-muc');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-danh-muc');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentPhanLoai = '';
        doc.getElementById('search-danh-muc').value = '';
        doc.getElementById('filter-phan-loai').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-danh-muc');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    // Delegated clicks (dropdown items, pagination)
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-danh-muc')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-danh-muc')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-danh-muc')) {
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

  function initPhuPhiRepeater() {
    var container = document.getElementById('phu-phi-repeater');
    if (!container) return;
    container.innerHTML = '' +
      '<div class="row g-2 mb-1 phu-phi-header">' +
        '<div class="col-md-6"><label class="form-label mb-0">Tên phụ phí</label></div>' +
        '<div class="col-md-5"><label class="form-label mb-0">Số tiền</label></div>' +
        '<div class="col-md-1"></div>' +
      '</div>';
  }

  function addPhuPhiRow(data) {
    var container = document.getElementById('phu-phi-repeater');
    if (!container) return;
    var html = '' +
      '<div class="phu-phi-row row g-2 mb-2">' +
        '<div class="col-md-6">' +
          '<input type="text" class="form-control phu-phi-ten" placeholder="Nhập tên phụ phí"' + (data && data.ten_phu_phi ? ' value="' + escapeHtml(data.ten_phu_phi) + '"' : '') + '>' +
        '</div>' +
        '<div class="col-md-5">' +
          '<div class="input-group">' +
            '<span class="input-group-text">đ</span>' +
            '<input type="text" class="form-control phu-phi-so-tien money-mask" placeholder="0" inputmode="numeric"' + (data && data.so_tien ? ' value="' + formatMoney(data.so_tien) + '"' : '') + '>' +
          '</div>' +
        '</div>' +
        '<div class="col-md-1">' +
          '<button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-phu-phi"><i class="ti tabler-x"></i></button>' +
        '</div>' +
      '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    container.appendChild(wrap.firstChild);
    initMoneyMasks();
  }

  function collectPhuPhi() {
    var rows = document.querySelectorAll('#phu-phi-repeater .phu-phi-row');
    var items = [];
    for (var i = 0; i < rows.length; i++) {
      var ten = rows[i].querySelector('.phu-phi-ten').value.trim();
      var soTien = parseMoney(rows[i].querySelector('.phu-phi-so-tien').value);
      if (!ten && !soTien) continue;
      if (!ten) {
        if (notyf) notyf.error('Tên phụ phí không được để trống');
        return false;
      }
      items.push({
        ten_phu_phi: ten,
        so_tien: soTien
      });
    }
    return items;
  }

  function togglePhuPhiSection(phanLoai) {
    var section = document.getElementById('phu-phi-section');
    if (!section) return;
    var show = hasPhuPhi(phanLoai);
    section.style.display = show ? '' : 'none';
    if (!show) {
      initPhuPhiRepeater();
      return;
    }
    var rows = document.querySelectorAll('#phu-phi-repeater .phu-phi-row');
    if (!rows.length) {
      initPhuPhiRepeater();
      addPhuPhiRow();
    }
  }

  function initMoneyMasks() {
    $('.money-mask').each(function () {
      if (this.hasAttribute('readonly')) return;
      if (this._moneyHandler) return;
      this._moneyHandler = true;
      applyMoneyMaskValue(this);
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

  function submitForm() {
    var form = document.getElementById('form-danh-muc');
    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var inputs = form.querySelectorAll('input, select');
    var data = {};
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.name) {
        data[inp.name] = inp.value;
      }
    }

    if (hasPhuPhi(data.phan_loai)) {
      var phuPhi = collectPhuPhi();
      if (phuPhi === false) return;
      data.phu_phi = phuPhi;
    }

    var nid = data.nid;
    var url = nid ? '/api/danh-muc/' + nid : '/api/danh-muc';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-danh-muc');
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
          var createdData = res.data || null;
          var callback = quickCreateCallback;
          quickCreateCallback = null;
          modalHide('danh-muc-modal');
          resetForm();
          if (callback) callback(createdData);
          if ($('#table-danh-muc').length) loadList();
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
    var tbody = $('#table-danh-muc-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="5" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    var params = { page: currentPage, keyword: currentKeyword };
    if (currentPhanLoai) {
      params.phan_loai = currentPhanLoai;
    }

    $.ajax({
      url: '/api/danh-muc',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="5" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="5" class="text-center">Không có dữ liệu</td></tr>');
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
            '<td>' + escapeHtml(item.phan_loai || '') + '</td>' +
            '<td>' + buildPhuPhiSummary(item) + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="5" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildPhuPhiSummary(item) {
    if (!hasPhuPhi(item.phan_loai)) {
      return '<span class="text-muted fst-italic">—</span>';
    }
    var phuPhi = getPhuPhiItems(item);
    if (!phuPhi.length) {
      return '<span class="text-muted fst-italic">Chưa cấu hình phụ phí</span>';
    }

    var html = '<div>';
    for (var i = 0; i < phuPhi.length; i++) {
      html += '<div>' + escapeHtml(phuPhi[i].ten_phu_phi || '') + ': ' + escapeHtml(formatMoney(phuPhi[i].so_tien || 0)) + 'đ</div>';
    }
    html += '<div class="text-primary mt-1"><strong>Tổng:</strong> ' + escapeHtml(formatMoney(getTongPhuPhi(phuPhi))) + 'đ</div>';
    html += '</div>';
    return html;
  }

  function buildActions(nid) {
    var perms = Drupal.settings.danh_muc && Drupal.settings.danh_muc.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.danh_muc_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-danh-muc" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.danh_muc_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-danh-muc" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.danh_muc_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-danh-muc" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-danh-muc');
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
    document.getElementById('danh-muc-modal-title').textContent = 'Chi tiết danh mục';
    document.querySelector('.btn-luu-danh-muc').style.display = 'none';
    showLoading(true);
    modalShow('danh-muc-modal');

    $.ajax({
      url: '/api/danh-muc/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('danh-muc-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('danh-muc-modal-title').textContent = 'Cập nhật danh mục';
    document.querySelector('#form-danh-muc input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-danh-muc');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('danh-muc-modal');

    $.ajax({
      url: '/api/danh-muc/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('danh-muc-modal');
          return;
        }
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('danh-muc-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    currentMode = mode;
    var inputs = document.querySelectorAll('#form-danh-muc input, #form-danh-muc select');
    var btn = document.querySelector('.btn-luu-danh-muc');
    var btnAdd = document.getElementById('btn-them-phu-phi');
    var btnRemove = document.querySelectorAll('#phu-phi-repeater .btn-xoa-phu-phi');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.type === 'hidden') continue;
      if (mode === 'view') {
        el.setAttribute('readonly', 'readonly');
        el.setAttribute('disabled', 'disabled');
      } else {
        el.removeAttribute('readonly');
        el.removeAttribute('disabled');
      }
    }
    if (btnAdd) btnAdd.style.display = mode === 'view' ? 'none' : '';
    for (var j = 0; j < btnRemove.length; j++) {
      btnRemove[j].style.display = mode === 'view' ? 'none' : '';
    }
    btn.style.display = mode === 'view' ? 'none' : '';
  }

  function resetForm() {
    currentMode = 'create';
    showLoading(false);
    document.getElementById('form-danh-muc').reset();
    setPhanLoaiOptions(PHAN_LOAI_OPTIONS);
    document.querySelector('#form-danh-muc input[name="nid"]').value = '';
    document.getElementById('danh-muc-modal-title').textContent = 'Thêm danh mục';
    document.getElementById('form-danh-muc').classList.remove('was-validated');
    initPhuPhiRepeater();
    togglePhuPhiSection('');
    setFormMode('create');
  }

  function populateForm(d) {
    var thongTin = parseThongTinJson(d.thong_tin);
    var phuPhi = thongTin.phu_phi || [];

    document.querySelector('#form-danh-muc input[name="nid"]').value = d.nid || '';
    document.querySelector('#form-danh-muc input[name="ten"]').value = d.ten || '';
    document.querySelector('#form-danh-muc select[name="phan_loai"]').value = d.phan_loai || '';

    initPhuPhiRepeater();
    togglePhuPhiSection(d.phan_loai || '');
    if (phuPhi.length && hasPhuPhi(d.phan_loai)) {
      initPhuPhiRepeater();
      for (var i = 0; i < phuPhi.length; i++) {
        addPhuPhiRow(phuPhi[i]);
      }
    }
    setFormMode(currentMode);
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá danh mục này?',
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
      if (confirm('Xác nhận xoá danh mục này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/danh-muc/' + id,
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
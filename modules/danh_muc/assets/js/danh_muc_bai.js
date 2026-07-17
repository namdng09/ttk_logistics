(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var currentPhanLoai = '';
  var currentMode = 'create';
  var eventsBound = false;
  var settings = Drupal.settings.danh_muc_bai || {};
  var PHAN_LOAI_CO_PHU_PHI = settings.phan_loai_co_phu_phi || ['Bãi', 'Cảng'];

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
    return parseThongTinJson(item && item.thong_tin_json).phu_phi || [];
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

  Drupal.behaviors.danhMucBai = {
    attach: function (context) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-danh-muc-bai', context).length && !eventsBound) {
        eventsBound = true;
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;

    doc.getElementById('btn-search-danh-muc-bai').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-danh-muc-bai').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-danh-muc-bai').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    doc.getElementById('filter-phan-loai-bai').addEventListener('change', function () {
      currentPhanLoai = this.value;
      currentPage = 1;
      loadList();
    });

    doc.getElementById('form-danh-muc-bai').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-danh-muc-bai');
        if (btn && !btn.disabled) btn.click();
      }
    });

    var reloadBtn = doc.querySelector('.btn-reload-danh-muc-bai');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentPhanLoai = '';
        doc.getElementById('search-danh-muc-bai').value = '';
        doc.getElementById('filter-phan-loai-bai').value = '';
        currentPage = 1;
        loadList();
      });
    }

    var themBtn = doc.querySelector('.btn-them-danh-muc-bai');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    var luuBtn = doc.querySelector('.btn-luu-danh-muc-bai');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    var loaiSelect = doc.querySelector('#form-danh-muc-bai select[name="phan_loai"]');
    if (loaiSelect) {
      loaiSelect.addEventListener('change', function () {
        togglePhuPhiSection(this.value);
      });
    }

    var btnThemPhi = doc.getElementById('btn-them-phu-phi-bai');
    if (btnThemPhi) {
      btnThemPhi.addEventListener('click', function () {
        addPhuPhiRow();
      });
    }

    var modal = doc.getElementById('danh-muc-bai-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initMoneyMasks();
    });

    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-danh-muc-bai')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-danh-muc-bai')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-danh-muc-bai')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-xoa-phu-phi-bai')) {
            e.preventDefault();
            var row = t.closest('.phu-phi-bai-row');
            if (row) row.remove();
            return;
          }
          if (t.classList.contains('page-link')) {
            var pageLink = parseInt(t.getAttribute('data-page'), 10);
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

    doc.addEventListener('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-danh-muc-bai-tbody')) {
        var menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          var btn = dropdown.querySelector('button');
          var rect = btn.getBoundingClientRect();
          menu.style.position = 'fixed';
          menu.style.top = rect.top + 'px';
          menu.style.left = rect.right + 'px';
          menu.style.display = 'block';
        }
      }
    });

    doc.addEventListener('mouseout', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-danh-muc-bai-tbody')) {
        if (!dropdown.contains(e.relatedTarget)) {
          var menu = dropdown.querySelector('.dropdown-menu');
          if (menu) {
            menu.style.display = '';
            menu.style.position = '';
            menu.style.top = '';
            menu.style.left = '';
          }
        }
      }
    });

    doc.getElementById('pagination-bai-jump').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value, 10);
        var total = parseInt(this.getAttribute('data-total-pages'), 10);
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });
  }

  function initPhuPhiRepeater() {
    var container = document.getElementById('phu-phi-bai-repeater');
    if (!container) return;
    container.innerHTML = '' +
      '<div class="row g-2 mb-1 phu-phi-bai-header">' +
        '<div class="col-md-6"><label class="form-label mb-0">Tên phụ phí</label></div>' +
        '<div class="col-md-5"><label class="form-label mb-0">Số tiền</label></div>' +
        '<div class="col-md-1"></div>' +
      '</div>';
  }

  function addPhuPhiRow(data) {
    var container = document.getElementById('phu-phi-bai-repeater');
    if (!container) return;
    var html = '' +
      '<div class="phu-phi-bai-row row g-2 mb-2">' +
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
          '<button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-phu-phi-bai"><i class="ti tabler-x"></i></button>' +
        '</div>' +
      '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    container.appendChild(wrap.firstChild);
    initMoneyMasks();
  }

  function collectPhuPhi() {
    var rows = document.querySelectorAll('#phu-phi-bai-repeater .phu-phi-bai-row');
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
    var rows = document.querySelectorAll('#phu-phi-bai-repeater .phu-phi-bai-row');
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
    var form = document.getElementById('form-danh-muc-bai');
    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var data = {
      nid: form.querySelector('input[name="nid"]').value,
      ten: form.querySelector('input[name="ten"]').value.trim(),
      phan_loai: form.querySelector('select[name="phan_loai"]').value,
      ghi_chu: form.querySelector('textarea[name="ghi_chu"]').value.trim()
    };

    var phuPhi = collectPhuPhi();
    if (phuPhi === false) return;
    data.phu_phi = hasPhuPhi(data.phan_loai) ? phuPhi : [];

    var nid = data.nid;
    var url = nid ? '/api/danh-muc-dia-diem/' + nid : '/api/danh-muc-dia-diem';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-danh-muc-bai');
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
          modalHide('danh-muc-bai-modal');
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
    var tbody = $('#table-danh-muc-bai-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="5" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div>' +
      '</td></tr>'
    );

    var params = { page: currentPage, keyword: currentKeyword };
    if (currentPhanLoai) params.phan_loai = currentPhanLoai;

    $.ajax({
      url: '/api/danh-muc-dia-diem',
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
          html += '' +
            '<tr>' +
              '<td class="text-center">' + actions + '</td>' +
              '<td>' + stt + '</td>' +
              '<td>' + buildTenBaiCell(item) + '</td>' +
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

  function buildActions(nid) {
    var perms = Drupal.settings.danh_muc_bai && Drupal.settings.danh_muc_bai.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.danh_muc_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-danh-muc-bai" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.danh_muc_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-danh-muc-bai" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.danh_muc_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-danh-muc-bai" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function buildTenBaiCell(item) {
    var html = escapeHtml(item.ten || '');
    var thongTin = parseThongTinJson(item.thong_tin_json);
    if (thongTin.ghi_chu) {
      html += '<div class="text-muted mt-1">' + escapeHtml(thongTin.ghi_chu) + '</div>';
    }
    return html;
  }

  function buildPhuPhiSummary(item) {
    if (!hasPhuPhi(item.phan_loai)) {
      return '<span class="text-muted fst-italic">Không áp dụng phụ phí</span>';
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

  function renderPagination(data) {
    var container = document.getElementById('pagination-danh-muc-bai');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var total = data.total_pages || 0;
    var current = data.current_page || 0;
    var totalItems = data.total || 0;

    document.getElementById('pagination-bai-info').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('pagination-bai-total-pages').textContent = '/ ' + total;

    var jumpInput = document.getElementById('pagination-bai-jump');
    jumpInput.value = current;
    jumpInput.setAttribute('data-total-pages', total);

    container.style.display = '';

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';

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

    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';
    ul.innerHTML = html;
  }

  function showLoading(show) {
    var loading = document.getElementById('modal-bai-loading');
    loading.style.display = show ? '' : 'none';
  }

  function openViewModal(id) {
    currentMode = 'view';
    document.getElementById('danh-muc-bai-modal-title').textContent = 'Chi tiết địa điểm';
    document.querySelector('.btn-luu-danh-muc-bai').style.display = 'none';
    showLoading(true);
    modalShow('danh-muc-bai-modal');

    $.ajax({
      url: '/api/danh-muc-dia-diem/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        populateForm(res.data);
        setFormMode('view');
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('danh-muc-bai-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    currentMode = 'edit';
    document.getElementById('danh-muc-bai-modal-title').textContent = 'Cập nhật địa điểm';
    document.querySelector('#form-danh-muc-bai input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-danh-muc-bai');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('danh-muc-bai-modal');

    $.ajax({
      url: '/api/danh-muc-dia-diem/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('danh-muc-bai-modal');
          return;
        }
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('danh-muc-bai-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    currentMode = mode;
    var inputs = document.querySelectorAll('#form-danh-muc-bai input, #form-danh-muc-bai select, #form-danh-muc-bai textarea');
    var btnSave = document.querySelector('.btn-luu-danh-muc-bai');
    var btnAdd = document.getElementById('btn-them-phu-phi-bai');
    var btnRemove = document.querySelectorAll('#phu-phi-bai-repeater .btn-xoa-phu-phi-bai');
    for (var i = 0; i < inputs.length; i++) {
      var el = inputs[i];
      if (el.type === 'hidden') continue;
      if (mode === 'view') {
        el.setAttribute('disabled', 'disabled');
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.setAttribute('readonly', 'readonly');
        }
      } else {
        el.removeAttribute('disabled');
        el.removeAttribute('readonly');
      }
    }
    if (btnAdd) btnAdd.style.display = mode === 'view' ? 'none' : '';
    for (var j = 0; j < btnRemove.length; j++) {
      btnRemove[j].style.display = mode === 'view' ? 'none' : '';
    }
    btnSave.style.display = mode === 'view' ? 'none' : '';
  }

  function resetForm() {
    currentMode = 'create';
    showLoading(false);
    document.getElementById('form-danh-muc-bai').reset();
    document.querySelector('#form-danh-muc-bai input[name="nid"]').value = '';
    document.getElementById('danh-muc-bai-modal-title').textContent = 'Thêm địa điểm';
    document.getElementById('form-danh-muc-bai').classList.remove('was-validated');
    initPhuPhiRepeater();
    togglePhuPhiSection('');
    setFormMode('create');
  }

  function populateForm(d) {
    var thongTin = parseThongTinJson(d.thong_tin_json);
    var phuPhi = thongTin.phu_phi || [];

    document.querySelector('#form-danh-muc-bai input[name="nid"]').value = d.nid || '';
    document.querySelector('#form-danh-muc-bai input[name="ten"]').value = d.ten || '';
    document.querySelector('#form-danh-muc-bai select[name="phan_loai"]').value = d.phan_loai || '';
    document.querySelector('#form-danh-muc-bai textarea[name="ghi_chu"]').value = thongTin.ghi_chu || '';

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
        text: 'Bạn có chắc chắn muốn xoá địa điểm này?',
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
    } else if (confirm('Xác nhận xoá địa điểm này?')) {
      deleteItem(id);
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/danh-muc-dia-diem/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success('Xoá thành công');
          loadList();
        } else if (notyf) {
          notyf.error(res.message || 'Lỗi không xác định');
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

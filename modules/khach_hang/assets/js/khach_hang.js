(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var currentPhanLoai = '';
  var tagifyPhanLoai = null;
  var PHAN_LOAI_LIST = ['Doanh nghiệp', 'Cá nhân', 'Khách hàng', 'Nhà cung cấp', 'Đối tác', 'Khác'];

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

  Drupal.behaviors.khachHang = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-khach-hang', context).length) {
        loadNvKinhDoanh();
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;

    // Search
    doc.getElementById('btn-search-khach-hang').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-khach-hang').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-khach-hang').addEventListener('keypress', function (e) {
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
    doc.getElementById('form-khach-hang').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-khach-hang');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-khach-hang');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentPhanLoai = '';
        doc.getElementById('search-khach-hang').value = '';
        doc.getElementById('filter-phan-loai').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-khach-hang');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-khach-hang');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('khach-hang-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initSelect2();
      initTagify();
      initDatePickers();
    });

    // Add bank info row
    var btnThemNh = doc.getElementById('btn-them-ngan-hang');
    if (btnThemNh) {
      btnThemNh.addEventListener('click', function () {
        addNganHangRow();
      });
    }

    // Delegated clicks
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-khach-hang')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-khach-hang')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-khach-hang')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-xoa-ngan-hang')) {
            e.preventDefault();
            var row = t.closest('.ngan-hang-row');
            if (row) row.remove();
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

    // Dropdown hover
    doc.addEventListener('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-khach-hang-tbody')) {
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
      if (dropdown && dropdown.closest('#table-khach-hang-tbody')) {
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

  function loadNvKinhDoanh() {
    $.ajax({
      url: '/api/nhan-vien',
      type: 'GET',
      dataType: 'json',
      data: { limit: 100 },
      success: function (res) {
        if (res.status === 'success' && res.data) {
          var $select = $('select[name="nv_kinh_doanh"]');
          if (!$select.length) return;
          var html = '<option value="">Chọn nhân viên</option>';
          var items = res.data.items || [];
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var text = item.ten || item.name || '';
            if (item.ma_nhan_vien) text += ' - ' + item.ma_nhan_vien;
            html += '<option value="' + item.uid + '">' + escapeHtml(text) + '</option>';
          }
          $select.html(html);
          if ($select.data('select2')) {
            $select.select2('destroy').unwrap();
            $select.wrap('<div class="position-relative"></div>').select2({
              placeholder: $select.data('placeholder') || 'Chọn nhân viên',
              dropdownParent: $select.parent()
            });
          }
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function initSelect2() {
    if (typeof $.fn.select2 !== 'undefined') {
      $('#form-khach-hang .select2').each(function () {
        var $this = $(this);
        if ($this.data('select2')) return;
        $this.wrap('<div class="position-relative"></div>').select2({
          placeholder: $this.data('placeholder') || 'Select value',
          dropdownParent: $this.parent()
        });
      });
    }
  }

  function initTagify() {
    var el = document.getElementById('tagifyPhanLoai');
    if (!el) return;
    if (tagifyPhanLoai) return;
    tagifyPhanLoai = new Tagify(el, {
      whitelist: PHAN_LOAI_LIST,
      enforceWhitelist: true,
      maxTags: 10,
      dropdown: {
        maxItems: 20,
        enabled: 0,
        closeOnSelect: false
      }
    });
  }

  function getTagifyValue() {
    if (!tagifyPhanLoai) return [];
    return tagifyPhanLoai.value.map(function (t) { return t.value; });
  }

  function setTagifyValue(arr) {
    if (!tagifyPhanLoai) return;
    tagifyPhanLoai.removeAllTags();
    if (arr && arr.length) {
      tagifyPhanLoai.addTags(arr);
    }
  }

  function destroyTagify() {
    if (tagifyPhanLoai) {
      tagifyPhanLoai.destroy();
      tagifyPhanLoai = null;
    }
  }

  function initRepeater() {
    var container = document.getElementById('ngan-hang-repeater');
    if (!container) return;
    container.innerHTML = '';
    addNganHangRow();
  }

  function addNganHangRow(data) {
    var container = document.getElementById('ngan-hang-repeater');
    if (!container) return;
    var html = '<div class="ngan-hang-row row g-2 mb-2 align-items-end">' +
      '<div class="col-md-3">' +
        '<label class="form-label small">Tên tài khoản</label>' +
        '<input type="text" class="form-control form-control-sm nganh-hang-ten-tai-khoan" placeholder="Tên TK">' +
      '</div>' +
      '<div class="col-md-4">' +
        '<label class="form-label small">Số tài khoản</label>' +
        '<input type="text" class="form-control form-control-sm ngan-hang-so-tai-khoan" placeholder="Số TK">' +
      '</div>' +
      '<div class="col-md-4">' +
        '<label class="form-label small">Ngân hàng</label>' +
        '<input type="text" class="form-control form-control-sm ngan-hang-ten-ngan-hang" placeholder="Tên ngân hàng">' +
      '</div>' +
      '<div class="col-md-1">' +
        '<button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-ngan-hang"><i class="ti tabler-x"></i></button>' +
      '</div>' +
    '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    var row = div.querySelector('.ngan-hang-row');
    container.appendChild(row);
    if (data) {
      row.querySelector('.nganh-hang-ten-tai-khoan').value = data.ten_tai_khoan || '';
      row.querySelector('.ngan-hang-so-tai-khoan').value = data.so_tai_khoan || '';
      row.querySelector('.ngan-hang-ten-ngan-hang').value = data.ngan_hang || '';
    }
  }

  function collectNganHang() {
    var rows = document.querySelectorAll('#ngan-hang-repeater .ngan-hang-row');
    var result = [];
    for (var i = 0; i < rows.length; i++) {
      var ten = rows[i].querySelector('.nganh-hang-ten-tai-khoan').value.trim();
      var so = rows[i].querySelector('.ngan-hang-so-tai-khoan').value.trim();
      var nh = rows[i].querySelector('.ngan-hang-ten-ngan-hang').value.trim();
      if (ten || so || nh) {
        result.push({ ten_tai_khoan: ten, so_tai_khoan: so, ngan_hang: nh });
      }
    }
    return result;
  }

  function submitForm() {
    var form = document.getElementById('form-khach-hang');

    var phanLoai = getTagifyValue();
    if (!phanLoai || phanLoai.length === 0) {
      form.classList.add('was-validated');
      if (notyf) notyf.error('Vui lòng chọn phân loại');
      return;
    }

    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var nid = document.querySelector('#form-khach-hang input[name="nid"]').value;
    var phanLoaiVal = getTagifyValue();
    var nvKdVal = $('select[name="nv_kinh_doanh"]').val();

    var apiData = {
      ten: document.querySelector('#form-khach-hang input[name="ten"]').value,
      ma_kh: document.querySelector('#form-khach-hang input[name="ma_kh"]').value,
      phan_loai: phanLoaiVal,
      cccd_mst: document.querySelector('#form-khach-hang input[name="cccd_mst"]').value,
      sdt: document.querySelector('#form-khach-hang input[name="sdt"]').value,
      dia_chi: document.querySelector('#form-khach-hang input[name="dia_chi"]').value,
      thong_tin_ngan_hang: collectNganHang(),
      nv_kinh_doanh: nvKdVal || '',
      dob: document.querySelector('#form-khach-hang input[name="dob"]').value,
      ghi_chu: document.querySelector('#form-khach-hang input[name="ghi_chu"]').value
    };

    var url = nid ? '/api/khach-hang/' + nid : '/api/khach-hang';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-khach-hang');
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
          modalHide('khach-hang-modal');
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
    var tbody = $('#table-khach-hang-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="12" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    var params = { page: currentPage, keyword: currentKeyword };
    if (currentPhanLoai) {
      params.phan_loai = currentPhanLoai;
    }

    $.ajax({
      url: '/api/khach-hang',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="12" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="12" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i =  0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.nid);
          var phanLoaiHtml = escapeHtml(item.phan_loai || '');
          var nganHangHtml = escapeHtml(item.thong_tin_ngan_hang_display || '').replace(/\n/g, '<br>');
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + phanLoaiHtml + '</td>' +
            '<td>' + escapeHtml(item.ten || '') + '</td>' +
            '<td>' + escapeHtml(item.ma_kh || '') + '</td>' +
            '<td>' + escapeHtml(item.cccd_mst || '') + '</td>' +
            '<td>' + escapeHtml(item.sdt || '') + '</td>' +
            '<td>' + escapeHtml(item.dia_chi || '') + '</td>' +
            '<td>' + nganHangHtml + '</td>' +
            '<td>' + escapeHtml(item.nv_kinh_doanh_display || '') + '</td>' +
            '<td>' + (item.dob || '') + '</td>' +
            '<td>' + escapeHtml(item.ghi_chu || '') + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="12" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    var perms = Drupal.settings.khach_hang && Drupal.settings.khach_hang.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.khach_hang_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-khach-hang" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.khach_hang_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-khach-hang" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.khach_hang_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-khach-hang" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-khach-hang');
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
    document.getElementById('khach-hang-modal-title').textContent = 'Chi tiết khách hàng';
    document.querySelector('.btn-luu-khach-hang').style.display = 'none';
    showLoading(true);
    modalShow('khach-hang-modal');

    $.ajax({
      url: '/api/khach-hang/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        initSelect2();
        initTagify();
        initRepeater();
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('khach-hang-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('khach-hang-modal-title').textContent = 'Cập nhật khách hàng';
    document.querySelector('#form-khach-hang input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-khach-hang');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('khach-hang-modal');

    $.ajax({
      url: '/api/khach-hang/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('khach-hang-modal');
          return;
        }
        initSelect2();
        initTagify();
        initRepeater();
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('khach-hang-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    var inputs = document.querySelectorAll('#form-khach-hang input, #form-khach-hang select, #form-khach-hang textarea');
    var btn = document.querySelector('.btn-luu-khach-hang');
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
    if (mode === 'view') {
      $('#form-khach-hang .select2').each(function () { var $t = $(this); if ($t.data('select2')) $t.select2('disable'); });
      if (tagifyPhanLoai) tagifyPhanLoai.setReadonly(true);
    } else {
      $('#form-khach-hang .select2').each(function () { var $t = $(this); if ($t.data('select2')) $t.select2('enable'); });
      if (tagifyPhanLoai) tagifyPhanLoai.setReadonly(false);
    }
    var btnThemNh = document.getElementById('btn-them-ngan-hang');
    if (btnThemNh) {
      btnThemNh.style.display = mode === 'view' ? 'none' : '';
    }
    var btnXoaNh = document.querySelectorAll('.btn-xoa-ngan-hang');
    for (var j = 0; j < btnXoaNh.length; j++) {
      btnXoaNh[j].style.display = mode === 'view' ? 'none' : '';
    }
  }

  function resetForm() {
    showLoading(false);
    destroyTagify();
    $('#form-khach-hang .select2').val(null).trigger('change');
    document.getElementById('form-khach-hang').reset();
    document.querySelector('#form-khach-hang input[name="nid"]').value = '';
    document.getElementById('khach-hang-modal-title').textContent = 'Thêm khách hàng';
    initRepeater();
    setFormMode('create');
  }

  function populateForm(d) {
    document.querySelector('#form-khach-hang input[name="nid"]').value = d.nid || '';
    document.querySelector('#form-khach-hang input[name="ten"]').value = d.ten || '';
    document.querySelector('#form-khach-hang input[name="ma_kh"]').value = d.ma_kh || '';
    document.querySelector('#form-khach-hang input[name="cccd_mst"]').value = d.cccd_mst || '';
    document.querySelector('#form-khach-hang input[name="sdt"]').value = d.sdt || '';
    document.querySelector('#form-khach-hang input[name="dia_chi"]').value = d.dia_chi || '';
    document.querySelector('#form-khach-hang input[name="dob"]').value = d.dob || '';
    document.querySelector('#form-khach-hang input[name="ghi_chu"]').value = d.ghi_chu || '';

    // Tagify phan_loai
    if (d.phan_loai_arr && d.phan_loai_arr.length) {
      setTagifyValue(d.phan_loai_arr);
    }

    // Select2 nv_kinh_doanh
    if (d.nv_kinh_doanh) {
      $('select[name="nv_kinh_doanh"]').val(String(d.nv_kinh_doanh)).trigger('change');
    }

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

    initDatePickers();
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

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá khách hàng này?',
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
      if (confirm('Xác nhận xoá khách hàng này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/khach-hang/' + id,
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
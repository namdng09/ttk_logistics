(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var currentKhachHangId = 0;
  var tagifyLoaiCongNo = null;
  var KHACH_HANG_LIST = [];
  var KHACH_HANG_DETAIL_CACHE = {};
  var LOAI_CONT_LIST = ['40RF', '20RF', '40HC', '20HC', '40OT', '20OT', '45HC', '45RF', '20RF'];
  var LOAI_CONG_NO_LIST = ['Cuối tháng', 'Thanh toán ngay'];
  var currentKhachHangData = null;

  var DEFAULT_CHI_PHI = [
    { ten: 'Đơn giá', so_tien: '' },
    { ten: 'Phí neo xe', so_tien: '' },
    { ten: 'Phụ cấp', so_tien: '' }
  ];

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

  Drupal.behaviors.cauHinhGiaBan = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-cau-hinh-gia-ban', context).length) {
        loadKhachHangList();
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;

    // Search
    doc.getElementById('btn-search-cau-hinh-gia-ban').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-cau-hinh-gia-ban').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-cau-hinh-gia-ban').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    // Filter KH
    doc.getElementById('filter-khach-hang').addEventListener('change', function () {
      currentKhachHangId = parseInt(this.value) || 0;
      currentPage = 1;
      loadList();
    });

    // Enter key submit
    doc.getElementById('form-cau-hinh-gia-ban').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-cau-hinh-gia-ban');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-cau-hinh-gia-ban');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentKhachHangId = 0;
        doc.getElementById('search-cau-hinh-gia-ban').value = '';
        doc.getElementById('filter-khach-hang').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-cau-hinh-gia-ban');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-cau-hinh-gia-ban');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('cau-hinh-gia-ban-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initKhachHangSelect();
      initDiaChiKhoSelect();
      initLoaiContSelect();
      initTagify();
      initMoneyMasks();
    });

    // Add chi phi row
    var btnThemCp = doc.getElementById('btn-them-chi-phi');
    if (btnThemCp) {
      btnThemCp.addEventListener('click', function () {
        addChiPhiRow();
      });
    }

    // Delegated clicks
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-cau-hinh-gia-ban')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-cau-hinh-gia-ban')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-cau-hinh-gia-ban')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-xoa-chi-phi')) {
            e.preventDefault();
            var row = t.closest('.chi-phi-row');
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

    // KH change handler via native event + Select2 event
    var khSelEl = document.getElementById('khach-hang-select');
    if (khSelEl) {
      khSelEl.addEventListener('change', function () {
        var val = this.value;
        if (val) {
          loadKhachHangDetail(parseInt(val));
        } else {
          currentKhachHangData = null;
          resetDiaChiKhoSelect();
          doc.querySelector('input[name="khoang_cach"]').value = '';
        }
      });
    }

    // Dropdown hover
    doc.addEventListener('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-cau-hinh-gia-ban-tbody')) {
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
      if (dropdown && dropdown.closest('#table-cau-hinh-gia-ban-tbody')) {
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

    // Pagination jump
    var jumpInput = doc.getElementById('pagination-jump');
    if (jumpInput) {
      jumpInput.addEventListener('keypress', function (e) {
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
  }

  function loadKhachHangList() {
    $.ajax({
      url: '/api/khach-hang',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data) {
          var items = res.data.items || [];
          KHACH_HANG_LIST = items;
          var sel = document.getElementById('khach-hang-select');
          var filterSel = document.getElementById('filter-khach-hang');
          if (sel) {
            sel.innerHTML = '<option value="">Chọn khách hàng</option>';
            for (var i = 0; i < items.length; i++) {
              var opt = document.createElement('option');
              opt.value = items[i].nid;
              opt.textContent = items[i].ten || 'KH #' + items[i].nid;
              sel.appendChild(opt);
            }
          }
          if (filterSel) {
            filterSel.innerHTML = '<option value="">Tất cả khách hàng</option>';
            for (var j = 0; j < items.length; j++) {
              var opt2 = document.createElement('option');
              opt2.value = items[j].nid;
              opt2.textContent = items[j].ten || 'KH #' + items[j].nid;
              filterSel.appendChild(opt2);
            }
          }
        }
      },
      error: function () {}
    });
  }

  function loadKhachHangDetail(id, callback) {
    if (KHACH_HANG_DETAIL_CACHE[id]) {
      currentKhachHangData = KHACH_HANG_DETAIL_CACHE[id];
      populateDiaChiKhoSelect(currentKhachHangData);
      if (callback) callback(currentKhachHangData);
      return;
    }
    $.ajax({
      url: '/api/khach-hang/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success' && res.data) {
          KHACH_HANG_DETAIL_CACHE[id] = res.data;
          currentKhachHangData = res.data;
          populateDiaChiKhoSelect(res.data);
          if (callback) callback(res.data);
        }
      },
      error: function () {}
    });
  }

  function populateDiaChiKhoSelect(data) {
    var sel = document.getElementById('dia-chi-kho-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">Chọn/Nhập địa chỉ kho</option>';
    if (data.dia_chi_kho && data.dia_chi_kho.length) {
      for (var i = 0; i < data.dia_chi_kho.length; i++) {
        var opt = document.createElement('option');
        opt.value = data.dia_chi_kho[i].dia_chi;
        opt.textContent = data.dia_chi_kho[i].dia_chi;
        opt.setAttribute('data-khoang-cach', data.dia_chi_kho[i].khoang_cach || '');
        sel.appendChild(opt);
      }
    }
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(sel);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#cau-hinh-gia-ban-modal'),
        placeholder: 'Chọn/Nhập địa chỉ kho',
        allowClear: true,
        tags: true,
        width: '100%'
      });
      $jq(sel).on('change', function () {
        var val = $jq(this).val();
        var dist = '';
        if (currentKhachHangData && currentKhachHangData.dia_chi_kho) {
          for (var k = 0; k < currentKhachHangData.dia_chi_kho.length; k++) {
            if (currentKhachHangData.dia_chi_kho[k].dia_chi === val) {
              dist = currentKhachHangData.dia_chi_kho[k].khoang_cach || '';
              break;
            }
          }
        }
        doc.querySelector('input[name="khoang_cach"]').value = dist;
      });
    }
  }

  function resetDiaChiKhoSelect() {
    var sel = document.getElementById('dia-chi-kho-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">Chọn/Nhập địa chỉ kho</option>';
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(sel);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#cau-hinh-gia-ban-modal'),
        placeholder: 'Chọn/Nhập địa chỉ kho',
        allowClear: true,
        tags: true,
        width: '100%'
      });
    }
  }

  function initKhachHangSelect() {
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    var sel = document.getElementById('khach-hang-select');
    if (!sel) return;
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(sel);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#cau-hinh-gia-ban-modal'),
        placeholder: 'Chọn khách hàng',
        allowClear: true,
        width: '100%'
      });
    }
  }

  function initDiaChiKhoSelect() {
    var sel = document.getElementById('dia-chi-kho-select');
    if (!sel) return;
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(sel);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#cau-hinh-gia-ban-modal'),
        placeholder: 'Chọn/Nhập địa chỉ kho',
        allowClear: true,
        tags: true,
        width: '100%'
      });
    }
  }

  function initLoaiContSelect() {
    var sel = document.getElementById('loai-cont-select');
    if (!sel) return;
    sel.innerHTML = '<option value="">Chọn/Nhập loại cont</option>';
    for (var i = 0; i < LOAI_CONT_LIST.length; i++) {
      var opt = document.createElement('option');
      opt.value = LOAI_CONT_LIST[i];
      opt.textContent = LOAI_CONT_LIST[i];
      sel.appendChild(opt);
    }
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(sel);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#cau-hinh-gia-ban-modal'),
        placeholder: 'Chọn/Nhập loại cont',
        allowClear: true,
        tags: true,
        width: '100%'
      });
    }
  }

  function initTagify() {
    var el = document.getElementById('tagifyLoaiCongNo');
    if (!el) return;
    if (tagifyLoaiCongNo) return;
    tagifyLoaiCongNo = new Tagify(el, {
      whitelist: LOAI_CONG_NO_LIST,
      enforceWhitelist: false,
      maxTags: 10,
      dropdown: {
        maxItems: 20,
        enabled: 0,
        closeOnSelect: false
      }
    });
  }

  function getTagifyValue() {
    if (!tagifyLoaiCongNo) return [];
    return tagifyLoaiCongNo.value.map(function (t) { return t.value; });
  }

  function setTagifyValue(arr) {
    if (!tagifyLoaiCongNo) return;
    tagifyLoaiCongNo.removeAllTags();
    if (arr && arr.length) {
      tagifyLoaiCongNo.addTags(arr);
    }
  }

  function destroyTagify() {
    if (tagifyLoaiCongNo) {
      tagifyLoaiCongNo.destroy();
      tagifyLoaiCongNo = null;
    }
  }

  function initChiPhiRepeater() {
    var container = document.getElementById('chi-phi-repeater');
    if (!container) return;
    container.innerHTML = '';
    var headerHtml = '<div class="row g-2 mb-1">' +
      '<div class="col-md-6"><label class="form-label mb-0">Tên chi phí</label></div>' +
      '<div class="col-md-5"><label class="form-label mb-0">Số tiền</label></div>' +
      '<div class="col-md-1"></div>' +
    '</div>';
    container.innerHTML = headerHtml;
    for (var i = 0; i < DEFAULT_CHI_PHI.length; i++) {
      addChiPhiRow(DEFAULT_CHI_PHI[i]);
    }
  }

  function addChiPhiRow(data) {
    var container = document.getElementById('chi-phi-repeater');
    if (!container) return;
    var html = '<div class="chi-phi-row row g-2 mb-2">' +
      '<div class="col-md-6">' +
        '<input type="text" class="form-control chi-phi-ten" placeholder="Tên chi phí">' +
      '</div>' +
      '<div class="col-md-5">' +
        '<input type="text" class="form-control chi-phi-so-tien money-mask" placeholder="0" inputmode="numeric">' +
      '</div>' +
      '<div class="col-md-1">' +
        '<button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-chi-phi"><i class="ti tabler-x"></i></button>' +
      '</div>' +
    '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    var row = div.querySelector('.chi-phi-row');
    container.appendChild(row);
    if (data) {
      row.querySelector('.chi-phi-ten').value = data.ten || '';
      if (data.so_tien) {
        row.querySelector('.chi-phi-so-tien').value = formatMoney(data.so_tien);
      }
    }
  }

  function collectChiPhi() {
    var rows = document.querySelectorAll('#chi-phi-repeater .chi-phi-row');
    var result = [];
    for (var i = 0; i < rows.length; i++) {
      var ten = rows[i].querySelector('.chi-phi-ten').value.trim();
      var soTienRaw = rows[i].querySelector('.chi-phi-so-tien').value.replace(/\./g, '');
      var soTien = soTienRaw ? parseInt(soTienRaw) : 0;
      if (ten) {
        result.push({ ten: ten, so_tien: soTien });
      }
    }
    return result;
  }

  function formatMoney(val) {
    if (!val && val !== 0) return '';
    var num = parseInt(val);
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function initMoneyMasks() {
    var inputs = document.querySelectorAll('#chi-phi-repeater .money-mask');
    for (var i = 0; i < inputs.length; i++) {
      if (!inputs[i]._moneyMaskReady) {
        inputs[i]._moneyMaskReady = true;
        inputs[i].addEventListener('input', function () {
          var raw = this.value.replace(/[^0-9]/g, '');
          if (raw === '') {
            this.value = '';
            return;
          }
          this.value = formatMoney(raw);
        });
      }
    }
  }

  function submitForm() {
    var form = document.getElementById('form-cau-hinh-gia-ban');

    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var nid = document.querySelector('#form-cau-hinh-gia-ban input[name="nid"]').value;
    var khachHangVal = document.querySelector('#form-cau-hinh-gia-ban select[name="nid_khach_hang"]').value;
    if (!khachHangVal) {
      form.classList.add('was-validated');
      if (notyf) notyf.error('Vui lòng chọn khách hàng');
      return;
    }

    var chiPhiData = collectChiPhi();
    var loaiCongNoVal = getTagifyValue();

    var apiData = {
      nid_khach_hang: parseInt(khachHangVal),
      dia_chi_kho: document.querySelector('#form-cau-hinh-gia-ban select[name="dia_chi_kho"]').value,
      khoang_cach: document.querySelector('#form-cau-hinh-gia-ban input[name="khoang_cach"]').value,
      loai_cont: document.querySelector('#form-cau-hinh-gia-ban select[name="loai_cont"]').value,
      chi_phi: chiPhiData,
      loai_cong_no: loaiCongNoVal,
      trang_thai: parseInt(document.querySelector('#form-cau-hinh-gia-ban select[name="trang_thai"]').value)
    };

    var url = nid ? '/api/cau-hinh-gia-ban/' + nid : '/api/cau-hinh-gia-ban';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-cau-hinh-gia-ban');
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
          modalHide('cau-hinh-gia-ban-modal');
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
    var tbody = $('#table-cau-hinh-gia-ban-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="9" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    var params = { page: currentPage, keyword: currentKeyword };
    if (currentKhachHangId) {
      params.khach_hang_id = currentKhachHangId;
    }

    $.ajax({
      url: '/api/cau-hinh-gia-ban',
      type: 'GET',
      dataType: 'json',
      data: params,
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
          var khTen = item.khach_hang ? escapeHtml(item.khach_hang.ten || '') : 'KH #' + item.nid_khach_hang;
          var trangThaiHtml = item.trang_thai === 1
            ? '<span class="badge bg-label-success">Hoạt động</span>'
            : '<span class="badge bg-label-warning">Khoá</span>';
          var nguoiTaoHtml = '';
          if (item.nguoi_tao) {
            var name = item.nguoi_tao.name || '';
            var created = item.created || '';
            nguoiTaoHtml = escapeHtml(name) + ' - ' + created;
          }

          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + khTen + '</td>' +
            '<td>' + escapeHtml(item.dia_chi_kho || '') + '</td>' +
            '<td>' + escapeHtml(item.khoang_cach || '') + '</td>' +
            '<td>' + escapeHtml(item.loai_cont || '') + '</td>' +
            '<td>' + escapeHtml(item.loai_cong_no || '') + '</td>' +
            '<td>' + trangThaiHtml + '</td>' +
            '<td>' + nguoiTaoHtml + '</td>' +
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
    var perms = Drupal.settings.cau_hinh_gia_ban && Drupal.settings.cau_hinh_gia_ban.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.view) {
      items += '<li><button type="button" class="dropdown-item btn-view-cau-hinh-gia-ban" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-cau-hinh-gia-ban" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-cau-hinh-gia-ban" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-cau-hinh-gia-ban');
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
    document.getElementById('cau-hinh-gia-ban-modal-title').textContent = 'Chi tiết cấu hình giá bán';
    document.querySelector('.btn-luu-cau-hinh-gia-ban').style.display = 'none';
    showLoading(true);
    modalShow('cau-hinh-gia-ban-modal');

    $.ajax({
      url: '/api/cau-hinh-gia-ban/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        initKhachHangSelect();
        initLoaiContSelect();
        initTagify();
        initChiPhiRepeater();
        populateForm(res.data);
        setFormMode('view');
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('cau-hinh-gia-ban-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('cau-hinh-gia-ban-modal-title').textContent = 'Cập nhật cấu hình giá bán';
    document.querySelector('#form-cau-hinh-gia-ban input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-cau-hinh-gia-ban');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('cau-hinh-gia-ban-modal');

    $.ajax({
      url: '/api/cau-hinh-gia-ban/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('cau-hinh-gia-ban-modal');
          return;
        }
        initKhachHangSelect();
        initLoaiContSelect();
        initTagify();
        initChiPhiRepeater();
        populateForm(res.data);
        setFormMode('edit');
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('cau-hinh-gia-ban-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    var inputs = document.querySelectorAll('#form-cau-hinh-gia-ban input, #form-cau-hinh-gia-ban select, #form-cau-hinh-gia-ban textarea');
    var btn = document.querySelector('.btn-luu-cau-hinh-gia-ban');
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
      if (tagifyLoaiCongNo) tagifyLoaiCongNo.setReadonly(true);
    } else {
      if (tagifyLoaiCongNo) tagifyLoaiCongNo.setReadonly(false);
    }
    var btnThemCp = document.getElementById('btn-them-chi-phi');
    if (btnThemCp) btnThemCp.style.display = mode === 'view' ? 'none' : '';
    var btnXoaCp = document.querySelectorAll('.btn-xoa-chi-phi');
    for (var j = 0; j < btnXoaCp.length; j++) {
      btnXoaCp[j].style.display = mode === 'view' ? 'none' : '';
    }
    // Handle Select2
    var selects = document.querySelectorAll('#form-cau-hinh-gia-ban select');
    for (var k = 0; k < selects.length; k++) {
      var $sel;
      try { $sel = $(selects[k]); } catch (e) {}
      if ($sel && typeof $sel.select2 === 'function' && $sel.data && $sel.data('select2')) {
        $sel.select2(mode === 'view' ? 'disable' : 'enable');
      }
    }
  }

  function resetForm() {
    showLoading(false);
    destroyTagify();
    document.getElementById('form-cau-hinh-gia-ban').reset();
    document.querySelector('#form-cau-hinh-gia-ban input[name="nid"]').value = '';
    document.getElementById('cau-hinh-gia-ban-modal-title').textContent = 'Thêm cấu hình giá bán';
    currentKhachHangData = null;
    initChiPhiRepeater();
    setFormMode('create');
  }

  function populateForm(d) {
    document.querySelector('#form-cau-hinh-gia-ban input[name="nid"]').value = d.nid || '';

    // KH select
    var khSel = document.querySelector('#form-cau-hinh-gia-ban select[name="nid_khach_hang"]');
    if (d.nid_khach_hang) {
      khSel.value = d.nid_khach_hang;
      var $kjq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
      if ($kjq && $kjq.fn.select2 && $kjq(khSel).data('select2')) {
        $kjq(khSel).trigger('change.select2');
      }
    }

    // Địa chỉ kho & khoảng cách
    document.querySelector('#form-cau-hinh-gia-ban input[name="khoang_cach"]').value = d.khoang_cach || '';
    if (d.nid_khach_hang) {
      loadKhachHangDetail(d.nid_khach_hang, function () {
        var dcSel = document.getElementById('dia-chi-kho-select');
        if (dcSel && d.dia_chi_kho) {
          dcSel.value = d.dia_chi_kho;
          var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
          if ($jq && $jq.fn.select2) {
            $jq(dcSel).trigger('change.select2');
          }
        }
      });
    }

    // Loại cont
    var contSel = document.querySelector('#form-cau-hinh-gia-ban select[name="loai_cont"]');
    if (d.loai_cont) {
      contSel.value = d.loai_cont;
      var $cjq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
      if ($cjq && $cjq.fn.select2 && $cjq(contSel).data('select2')) {
        $cjq(contSel).trigger('change.select2');
      }
    }

    // Trạng thái
    if (d.trang_thai) {
      document.querySelector('#form-cau-hinh-gia-ban select[name="trang_thai"]').value = d.trang_thai;
    }

    // Loại công nợ
    if (d.loai_cong_no) {
      setTagifyValue(d.loai_cong_no.split(',').map(function (s) { return s.trim(); }));
    }

    // Chi phí repeater
    if (d.chi_phi && d.chi_phi.length) {
      var container = document.getElementById('chi-phi-repeater');
      if (container) container.innerHTML = '';
      for (var i = 0; i < d.chi_phi.length; i++) {
        addChiPhiRow(d.chi_phi[i]);
      }
    }

    initMoneyMasks();
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá cấu hình giá bán này?',
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
      if (confirm('Xác nhận xoá cấu hình giá bán này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/cau-hinh-gia-ban/' + id,
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

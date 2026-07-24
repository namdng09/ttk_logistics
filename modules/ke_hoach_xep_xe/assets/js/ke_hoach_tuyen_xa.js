(function ($, Drupal) {
  'use strict';

  var notyf;
  var settings = Drupal.settings.ke_hoach_tuyen_xa || {};
  var currentPage = 1;
  var currentKeyword = '';
  var modal;
  var supportLoaded = false;
  var supportLoading = false;
  var supportCallbacks = [];
  var changKeySeq = 0;
  var state = {
    mode: 'create',
    customers: [],
    drivers: [],
    vehicles: [],
    changs: [],
    chiPhi: [],
    dau: []
  };

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r.message || 'Lỗi không xác định';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function escHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function apiToDate(val) {
    if (!val) return '';
    var raw = String(val).split(' ')[0];
    var d = raw.split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : raw;
  }

  function dateToApi(val) {
    val = (val || '').trim();
    if (!val) return '';
    var d = val.split('/');
    if (d.length !== 3) return val;
    return d[2] + '-' + d[1] + '-' + d[0];
  }

  function moneyText(val) {
    var num = parseInt(val, 10) || 0;
    return num ? new Intl.NumberFormat('vi-VN').format(num) : '';
  }

  function _jq() {
    return (typeof $ === 'function' && $.fn && $.fn.select2) ? $ : null;
  }

  function initSelect2(el, placeholder, dropdownParent) {
    var jq = _jq();
    if (!jq || !el) return;
    var $el = jq(el);
    if ($el.data('select2')) $el.select2('destroy');
    $el.select2({
      placeholder: placeholder || '— Chọn —',
      allowClear: true,
      width: '100%',
      dropdownParent: dropdownParent || jq('#ke-hoach-tuyen-xa-modal')
    });
  }

  function initDateInputs(scope) {
    if (typeof flatpickr === 'undefined') return;
    $(scope).find('.input-date-only').each(function () {
      if (this._flatpickr) this._flatpickr.destroy();
      flatpickr(this, {
        enableTime: false,
        dateFormat: 'd/m/Y',
        allowInput: true,
        static: false,
        appendTo: document.body
      });
    });
  }

  Drupal.behaviors.keHoachTuyenXa = {
    attach: function (context) {
      if ($('#ke-hoach-tuyen-xa-app', context).length) {
        if (typeof Notyf !== 'undefined' && !notyf) notyf = new Notyf();
        bindEvents();
        loadList();
      }
    }
  };

  function bindEvents() {
    if (bindEvents._bound) return;
    bindEvents._bound = true;

    $('#btn-search-ke-hoach-tuyen-xa').on('click', function () {
      currentKeyword = $('#search-ke-hoach-tuyen-xa').val().trim();
      currentPage = 1;
      loadList();
    });
    $('#search-ke-hoach-tuyen-xa').on('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });
    $('.btn-reload-ke-hoach-tuyen-xa').on('click', function () {
      currentKeyword = '';
      currentPage = 1;
      $('#search-ke-hoach-tuyen-xa').val('');
      loadList();
    });
    $('.btn-them-ke-hoach-tuyen-xa').on('click', function () {
      openCreate();
    });
    $('#pagination-ke-hoach-tuyen-xa').on('click', '.page-link', function (e) {
      e.preventDefault();
      var p = parseInt($(this).data('page'), 10) || 0;
      if (p && p !== currentPage) {
        currentPage = p;
        loadList();
      }
    });
    $('#pagination-ke-hoach-tuyen-xa-jump').on('keypress', function (e) {
      if (e.which === 13) {
        var total = parseInt($(this).attr('data-total-pages'), 10) || 0;
        var page = parseInt($(this).val(), 10) || 0;
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });

    $(document).on('click', '.btn-view-ke-hoach-tuyen-xa', function (e) {
      e.preventDefault();
      openEdit($(this).data('id'), 'view');
    });
    $(document).on('click', '.btn-edit-ke-hoach-tuyen-xa', function (e) {
      e.preventDefault();
      openEdit($(this).data('id'), 'edit');
    });
    $(document).on('click', '.btn-delete-ke-hoach-tuyen-xa', function (e) {
      e.preventDefault();
      deleteItem($(this).data('id'));
    });

    $(document).on('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-ke-hoach-tuyen-xa-tbody')) {
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

    $(document).on('mouseout', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-ke-hoach-tuyen-xa-tbody')) {
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

    $('#btn-them-chang').on('click', function () {
      syncStateFromDom();
      state.changs.push(blankChang());
      renderChangs();
    });
    $('#btn-them-chi-phi').on('click', function () {
      syncStateFromDom();
      state.chiPhi.push(blankChiPhi());
      renderChiPhi();
    });
    $('#btn-them-dau').on('click', function () {
      syncStateFromDom();
      state.dau.push(blankDau());
      renderDau();
    });

    $('#ke-hoach-tuyen-xa-chang-body').on('click', '.btn-remove-chang', function () {
      syncStateFromDom();
      var index = parseInt($(this).closest('tr').attr('data-index'), 10) || 0;
      state.changs.splice(index, 1);
      if (!state.changs.length) state.changs.push(blankChang());
      renderChangs();
      renderChiPhi();
      renderDau();
    });
    $('#ke-hoach-tuyen-xa-chi-phi-body').on('click', '.btn-remove-chi-phi', function () {
      syncStateFromDom();
      var index = parseInt($(this).closest('tr').attr('data-index'), 10) || 0;
      state.chiPhi.splice(index, 1);
      if (!state.chiPhi.length) state.chiPhi.push(blankChiPhi());
      renderChiPhi();
    });
    $('#ke-hoach-tuyen-xa-dau-body').on('click', '.btn-remove-dau', function () {
      syncStateFromDom();
      var index = parseInt($(this).closest('tr').attr('data-index'), 10) || 0;
      state.dau.splice(index, 1);
      if (!state.dau.length) state.dau.push(blankDau());
      renderDau();
    });

    $('#btn-save-ke-hoach-tuyen-xa').on('click', function () {
      submitForm();
    });
    $('#ke-hoach-tuyen-xa-modal').on('hidden.bs.modal', function () {
      resetForm();
    });
  }

  function blankChang() {
    return {
      chang_key: nextChangKey(),
      loai_chang: '',
      diem_di: '',
      diem_den: '',
      ngay_di: '',
      ngay_den: '',
      nid_phuong_tien: '',
      nid_mooc: '',
      nid_lai_xe: ''
    };
  }

  function blankChiPhi() {
    return {
      loai_chi_phi: '',
      ten_chi_phi: '',
      so_tien: '',
      ngay: '',
      chang_key: ''
    };
  }

  function blankDau() {
    return {
      loai_dau: '',
      ngay: '',
      so_lit: '',
      so_tien: '',
      chang_key: ''
    };
  }

  function nextChangKey() {
    changKeySeq += 1;
    return 'tmp-' + changKeySeq;
  }

  function showLoading(show) {
    $('#ke-hoach-tuyen-xa-modal-loading').toggle(show);
    $('#btn-save-ke-hoach-tuyen-xa').prop('disabled', show);
  }

  function loadList() {
    var tbody = $('#table-ke-hoach-tuyen-xa-tbody');
    tbody.html('<tr id="loading-row"><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>');
    $.ajax({
      url: '/api/ke-hoach-tuyen-xa',
      type: 'GET',
      dataType: 'json',
      data: { page: currentPage, keyword: currentKeyword },
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          tbody.html('<tr><td colspan="10" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi tải dữ liệu') + '</td></tr>');
          return;
        }
        var resp = res.data;
        var items = resp.items || [];
        if (!items.length) {
          tbody.html('<tr><td colspan="10" class="text-center py-4">Không có dữ liệu</td></tr>');
          renderPagination(resp);
          return;
        }
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          html += '<tr>' +
            '<td class="text-center">' + actionHtml(item.nid) + '</td>' +
            '<td>' + (((resp.current_page - 1) * resp.limit) + i + 1) + '</td>' +
            '<td>' + escHtml(item.khach_hang && item.khach_hang.ten ? item.khach_hang.ten : '') + '</td>' +
            '<td><div>' + escHtml(item.so_bkg || '') + '</div><div class="text-muted small fw-semibold">' + escHtml(item.so_cont || '') + '</div></td>' +
            '<td class="ke-hoach-tuyen-xa-route">' +
              '<div>' + escHtml(item.diem_di || '') + (item.cua_khau ? '<span class="route-arrow">→</span>' + escHtml(item.cua_khau) : '') + (item.diem_den ? '<span class="route-arrow">→</span>' + escHtml(item.diem_den) : '') + '</div>' +
            '</td>' +
            '<td><span class="ke-hoach-tuyen-xa-chip">' + escHtml((settings.loai_hinh_options || {})[item.loai_hinh_tuyen_xa] || item.loai_hinh_tuyen_xa || '') + '</span></td>' +
            '<td>' + escHtml(apiToDate(item.ngay_bat_dau || '')) + '</td>' +
            '<td>' + escHtml(apiToDate(item.ngay_ket_thuc_du_kien || '')) + '</td>' +
            '<td>' + (item.chang_count || 0) + '</td>' +
            '<td>' + escHtml(item.trang_thai_van_chuyen || '') + '</td>' +
          '</tr>';
        }
        tbody.html(html);
        renderPagination(resp);
      },
      error: function (jqXHR) {
        tbody.html('<tr><td colspan="10" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function actionHtml(id) {
    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill" type="button">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><button type="button" class="dropdown-item btn-view-ke-hoach-tuyen-xa" data-id="' + id + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>' +
      '<li><button type="button" class="dropdown-item btn-edit-ke-hoach-tuyen-xa" data-id="' + id + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><button type="button" class="dropdown-item text-danger btn-delete-ke-hoach-tuyen-xa" data-id="' + id + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>' +
      '</ul></div>';
  }

  function renderPagination(resp) {
    var wrap = $('#pagination-ke-hoach-tuyen-xa');
    var ul = wrap.find('ul.pagination');
    var total = resp.total_pages || 0;
    var current = resp.current_page || 0;
    $('#pagination-ke-hoach-tuyen-xa-info').text('Tổng số: ' + (resp.total || 0) + ' bản ghi');
    $('#pagination-ke-hoach-tuyen-xa-total-pages').text('/ ' + total);
    $('#pagination-ke-hoach-tuyen-xa-jump').val(current).attr('data-total-pages', total);
    if (!total) {
      wrap.hide();
      return;
    }
    wrap.show();
    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    ul.html(html);
  }

  function ensureSupportData(callback) {
    if (supportLoaded) {
      callback();
      return;
    }
    supportCallbacks.push(callback);
    if (supportLoading) return;
    supportLoading = true;
    var pending = 3;
    function done() {
      pending--;
      if (pending > 0) return;
      supportLoading = false;
      supportLoaded = true;
      while (supportCallbacks.length) {
        supportCallbacks.shift()();
      }
    }
    $.getJSON('/api/khach-hang', { limit: 500 }, function (res) {
      if (res.status === 'success' && res.data) state.customers = res.data.items || [];
    }).always(done);
    $.getJSON('/api/lai-xe', { limit: 500 }, function (res) {
      if (res.status === 'success' && res.data) state.drivers = res.data.items || [];
    }).always(done);
    $.getJSON('/api/phuong-tien', { limit: 500 }, function (res) {
      if (res.status === 'success' && res.data) state.vehicles = res.data.items || [];
    }).always(done);
  }

  function openCreate() {
    state.mode = 'create';
    resetForm();
    ensureSupportData(function () {
      renderSupportOptions();
      state.changs = [blankChang()];
      state.chiPhi = [blankChiPhi()];
      state.dau = [blankDau()];
      renderAllRepeaterTables();
      applyMode();
      getModal().show();
    });
  }

  function openEdit(id, mode) {
    state.mode = mode || 'edit';
    resetForm();
    ensureSupportData(function () {
      renderSupportOptions();
      showLoading(true);
      $.getJSON('/api/ke-hoach-tuyen-xa/' + id, function (res) {
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tải được dữ liệu');
          return;
        }
        fillForm(res.data);
        applyMode();
        getModal().show();
      }).fail(function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }).always(function () {
        showLoading(false);
      });
    });
  }

  function deleteItem(id) {
    if (!window.confirm('Bạn có chắc chắn muốn xoá kế hoạch tuyến xa này?')) return;
    $.ajax({
      url: '/api/ke-hoach-tuyen-xa/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success('Đã xoá kế hoạch tuyến xa');
          loadList();
        } else if (notyf) {
          notyf.error(res.message || 'Xoá thất bại');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function getModal() {
    if (!modal) modal = new bootstrap.Modal(document.getElementById('ke-hoach-tuyen-xa-modal'));
    return modal;
  }

  function renderSupportOptions() {
    var $customer = $('#form-ke-hoach-tuyen-xa select[name="nid_khach_hang"]');
    var customerHtml = '<option value="">Chọn khách hàng</option>';
    for (var i = 0; i < state.customers.length; i++) {
      customerHtml += '<option value="' + state.customers[i].nid + '">' + escHtml(state.customers[i].ten || ('#' + state.customers[i].nid)) + '</option>';
    }
    $customer.html(customerHtml);

    var loaiHtml = '<option value="">Chọn loại tuyến xa</option>';
    $.each(settings.loai_hinh_options || {}, function (key, label) {
      loaiHtml += '<option value="' + key + '">' + escHtml(label) + '</option>';
    });
    $('#form-ke-hoach-tuyen-xa select[name="loai_hinh_tuyen_xa"]').html(loaiHtml);

    initSelect2($customer[0], 'Chọn khách hàng');
    initSelect2($('#form-ke-hoach-tuyen-xa select[name="loai_hinh_tuyen_xa"]')[0], 'Chọn loại tuyến xa');
    initDateInputs('#ke-hoach-tuyen-xa-modal');
  }

  function vehicleOptions(type, selected) {
    var html = '<option value="">— Chọn —</option>';
    for (var i = 0; i < state.vehicles.length; i++) {
      var item = state.vehicles[i];
      var loai = String(item.loai_phuong_tien || '').toLowerCase();
      if (type === 'dau_keo' && loai !== 'dau_keo') continue;
      if (type === 'mooc' && loai.indexOf('mooc') === -1) continue;
      var label = item.bks || ('#' + item.nid);
      if (item.ma_tai_san) label += ' - ' + item.ma_tai_san;
      html += '<option value="' + item.nid + '"' + (String(selected || '') === String(item.nid) ? ' selected' : '') + '>' + escHtml(label) + '</option>';
    }
    return html;
  }

  function driverOptions(selected) {
    var html = '<option value="">— Chọn —</option>';
    for (var i = 0; i < state.drivers.length; i++) {
      var item = state.drivers[i];
      html += '<option value="' + item.nid + '"' + (String(selected || '') === String(item.nid) ? ' selected' : '') + '>' + escHtml(item.ten || ('#' + item.nid)) + '</option>';
    }
    return html;
  }

  function changRefOptions(selected) {
    var html = '<option value="">Toàn chuyến</option>';
    for (var i = 0; i < state.changs.length; i++) {
      var key = state.changs[i].chang_key || String(i + 1);
      html += '<option value="' + key + '"' + (String(selected || '') === String(key) ? ' selected' : '') + '>Chặng #' + (i + 1) + '</option>';
    }
    return html;
  }

  function renderAllRepeaterTables() {
    renderChangs();
    renderChiPhi();
    renderDau();
  }

  function renderChangs() {
    var html = '';
    var changOptions = settings.loai_chang_options || [];
    for (var i = 0; i < state.changs.length; i++) {
      var item = state.changs[i];
      var loaiHtml = '<option value="">Chọn loại</option>';
      for (var j = 0; j < changOptions.length; j++) {
        var key = changOptions[j];
        loaiHtml += '<option value="' + key + '"' + (item.loai_chang === key ? ' selected' : '') + '>' + escHtml(key) + '</option>';
      }
      html += '<tr data-index="' + i + '" data-chang-key="' + escHtml(item.chang_key || '') + '">' +
        '<td>' + (i + 1) + '</td>' +
        '<td><select class="form-select chang-loai">' + loaiHtml + '</select></td>' +
        '<td><input type="text" class="form-control chang-diem-di" value="' + escHtml(item.diem_di || '') + '" placeholder="Điểm đi"></td>' +
        '<td><input type="text" class="form-control chang-diem-den" value="' + escHtml(item.diem_den || '') + '" placeholder="Điểm đến"></td>' +
        '<td><input type="text" class="form-control input-date-only chang-ngay-di" value="' + escHtml(apiToDate(item.ngay_di || '')) + '" placeholder="dd/mm/yyyy"></td>' +
        '<td><input type="text" class="form-control input-date-only chang-ngay-den" value="' + escHtml(apiToDate(item.ngay_den || '')) + '" placeholder="dd/mm/yyyy"></td>' +
        '<td><select class="form-select chang-phuong-tien">' + vehicleOptions('dau_keo', item.nid_phuong_tien) + '</select></td>' +
        '<td><select class="form-select chang-mooc">' + vehicleOptions('mooc', item.nid_mooc) + '</select></td>' +
        '<td><select class="form-select chang-lai-xe">' + driverOptions(item.nid_lai_xe) + '</select></td>' +
        '<td class="text-center"><button type="button" class="btn btn-sm btn-label-danger btn-remove-chang"><i class="ti tabler-trash"></i></button></td>' +
      '</tr>';
    }
    $('#ke-hoach-tuyen-xa-chang-body').html(html);
    initSelectsInTable('#ke-hoach-tuyen-xa-chang-body');
    initDateInputs('#ke-hoach-tuyen-xa-chang-body');
  }

  function renderChiPhi() {
    var html = '';
    var opts = settings.loai_chi_phi_options || {};
    for (var i = 0; i < state.chiPhi.length; i++) {
      var item = state.chiPhi[i];
      var loaiHtml = '<option value="">Chọn loại</option>';
      $.each(opts, function (key, label) {
        loaiHtml += '<option value="' + key + '"' + (item.loai_chi_phi === key ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      });
      html += '<tr data-index="' + i + '">' +
        '<td><select class="form-select chi-phi-loai">' + loaiHtml + '</select></td>' +
        '<td><input type="text" class="form-control chi-phi-ten" value="' + escHtml(item.ten_chi_phi || '') + '" placeholder="Tên chi phí"></td>' +
        '<td><input type="text" class="form-control chi-phi-so-tien" value="' + escHtml(moneyText(item.so_tien || '')) + '" placeholder="Số tiền"></td>' +
        '<td><input type="text" class="form-control input-date-only chi-phi-ngay" value="' + escHtml(apiToDate(item.ngay || '')) + '" placeholder="dd/mm/yyyy"></td>' +
        '<td><select class="form-select chi-phi-chang-key">' + changRefOptions(item.chang_key) + '</select></td>' +
        '<td class="text-center"><button type="button" class="btn btn-sm btn-label-danger btn-remove-chi-phi"><i class="ti tabler-trash"></i></button></td>' +
      '</tr>';
    }
    $('#ke-hoach-tuyen-xa-chi-phi-body').html(html);
    initSelectsInTable('#ke-hoach-tuyen-xa-chi-phi-body');
    initDateInputs('#ke-hoach-tuyen-xa-chi-phi-body');
  }

  function renderDau() {
    var html = '';
    var opts = settings.loai_dau_options || {};
    for (var i = 0; i < state.dau.length; i++) {
      var item = state.dau[i];
      var loaiHtml = '<option value="">Chọn loại</option>';
      $.each(opts, function (key, label) {
        loaiHtml += '<option value="' + key + '"' + (item.loai_dau === key ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      });
      html += '<tr data-index="' + i + '">' +
        '<td><select class="form-select dau-loai">' + loaiHtml + '</select></td>' +
        '<td><input type="text" class="form-control input-date-only dau-ngay" value="' + escHtml(apiToDate(item.ngay || '')) + '" placeholder="dd/mm/yyyy"></td>' +
        '<td><input type="text" class="form-control dau-so-lit" value="' + escHtml(item.so_lit || '') + '" placeholder="Số lít"></td>' +
        '<td><input type="text" class="form-control dau-so-tien" value="' + escHtml(moneyText(item.so_tien || '')) + '" placeholder="Số tiền"></td>' +
        '<td><select class="form-select dau-chang-key">' + changRefOptions(item.chang_key) + '</select></td>' +
        '<td class="text-center"><button type="button" class="btn btn-sm btn-label-danger btn-remove-dau"><i class="ti tabler-trash"></i></button></td>' +
      '</tr>';
    }
    $('#ke-hoach-tuyen-xa-dau-body').html(html);
    initSelectsInTable('#ke-hoach-tuyen-xa-dau-body');
    initDateInputs('#ke-hoach-tuyen-xa-dau-body');
  }

  function initSelectsInTable(scope) {
    $(scope).find('select').each(function () {
      initSelect2(this, '— Chọn —');
    });
  }

  function fillForm(data) {
    var form = $('#form-ke-hoach-tuyen-xa');
    form.find('[name="nid"]').val(data.nid || '');
    form.find('[name="nid_khach_hang"]').val(data.khach_hang ? data.khach_hang.nid : '').trigger('change');
    form.find('[name="loai_hinh_tuyen_xa"]').val(data.loai_hinh_tuyen_xa || '').trigger('change');
    form.find('[name="trang_thai_van_chuyen"]').val(data.trang_thai_van_chuyen || '');
    form.find('[name="so_bkg"]').val(data.so_bkg || '');
    form.find('[name="so_cont"]').val(data.so_cont || '');
    form.find('[name="loai_cont"]').val(data.loai_cont || '');
    form.find('[name="dia_chi_kho"]').val(data.dia_chi_kho || '');
    form.find('[name="diem_di"]').val(data.diem_di || '');
    form.find('[name="cua_khau"]').val(data.cua_khau || '');
    form.find('[name="diem_den"]').val(data.diem_den || '');
    form.find('[name="ngay_bat_dau"]').val(apiToDate(data.ngay_bat_dau || ''));
    form.find('[name="ngay_ket_thuc_du_kien"]').val(apiToDate(data.ngay_ket_thuc_du_kien || ''));
    form.find('[name="ghi_chu"]').val(data.ghi_chu || '');
    state.changs = data.changs && data.changs.length ? $.map(data.changs, function (item) {
      return {
        chang_key: item.chang_key || nextChangKey(),
        loai_chang: item.loai_chang || '',
        diem_di: item.diem_di || '',
        diem_den: item.diem_den || '',
        ngay_di: item.ngay_di || '',
        ngay_den: item.ngay_den || '',
        nid_phuong_tien: item.nid_phuong_tien || '',
        nid_mooc: item.nid_mooc || '',
        nid_lai_xe: item.nid_lai_xe || ''
      };
    }) : [blankChang()];
    state.chiPhi = data.chi_phi && data.chi_phi.length ? $.map(data.chi_phi, function (item) {
      return {
        loai_chi_phi: item.loai_chi_phi || '',
        ten_chi_phi: item.ten_chi_phi || '',
        so_tien: item.so_tien || '',
        ngay: item.ngay || '',
        chang_key: item.chang_key || ''
      };
    }) : [blankChiPhi()];
    state.dau = data.dau && data.dau.length ? $.map(data.dau, function (item) {
      return {
        loai_dau: item.loai_dau || '',
        ngay: item.ngay || '',
        so_lit: item.so_lit || '',
        so_tien: item.so_tien || '',
        chang_key: item.chang_key || ''
      };
    }) : [blankDau()];
    renderAllRepeaterTables();
  }

  function syncStateFromDom() {
    state.changs = [];
    $('#ke-hoach-tuyen-xa-chang-body tr').each(function () {
      var $tr = $(this);
      state.changs.push({
        chang_key: $tr.attr('data-chang-key') || nextChangKey(),
        loai_chang: $tr.find('.chang-loai').val() || '',
        diem_di: $tr.find('.chang-diem-di').val().trim(),
        diem_den: $tr.find('.chang-diem-den').val().trim(),
        ngay_di: dateToApi($tr.find('.chang-ngay-di').val()),
        ngay_den: dateToApi($tr.find('.chang-ngay-den').val()),
        nid_phuong_tien: $tr.find('.chang-phuong-tien').val() || '',
        nid_mooc: $tr.find('.chang-mooc').val() || '',
        nid_lai_xe: $tr.find('.chang-lai-xe').val() || ''
      });
    });
    state.chiPhi = [];
    $('#ke-hoach-tuyen-xa-chi-phi-body tr').each(function () {
      var $tr = $(this);
      state.chiPhi.push({
        loai_chi_phi: $tr.find('.chi-phi-loai').val() || '',
        ten_chi_phi: $tr.find('.chi-phi-ten').val().trim(),
        so_tien: parseMoney($tr.find('.chi-phi-so-tien').val()),
        ngay: dateToApi($tr.find('.chi-phi-ngay').val()),
        chang_key: $tr.find('.chi-phi-chang-key').val() || ''
      });
    });
    state.dau = [];
    $('#ke-hoach-tuyen-xa-dau-body tr').each(function () {
      var $tr = $(this);
      state.dau.push({
        loai_dau: $tr.find('.dau-loai').val() || '',
        ngay: dateToApi($tr.find('.dau-ngay').val()),
        so_lit: ($tr.find('.dau-so-lit').val() || '').trim(),
        so_tien: parseMoney($tr.find('.dau-so-tien').val()),
        chang_key: $tr.find('.dau-chang-key').val() || ''
      });
    });
  }

  function parseMoney(val) {
    return parseInt(String(val || '').replace(/[^\d]/g, ''), 10) || 0;
  }

  function validateForm() {
    var form = $('#form-ke-hoach-tuyen-xa');
    form.find('.is-invalid').removeClass('is-invalid');
    var ok = true;
    ['nid_khach_hang', 'so_bkg', 'so_cont', 'diem_di', 'diem_den'].forEach(function (name) {
      var $el = form.find('[name="' + name + '"]');
      if (!$el.val()) {
        ok = false;
        $el.addClass('is-invalid');
        if ($el.next('.select2-container').length) $el.next('.select2-container').addClass('is-invalid');
      }
    });
    syncStateFromDom();
    if (!state.changs.length) {
      ok = false;
      if (notyf) notyf.error('Cần ít nhất một chặng');
    }
    for (var i = 0; i < state.changs.length; i++) {
      var item = state.changs[i];
      if (!item.diem_di || !item.diem_den) {
        ok = false;
        if (notyf) notyf.error('Chặng #' + (i + 1) + ' chưa đủ thông tin bắt buộc');
        break;
      }
    }
    return ok;
  }

  function buildPayload() {
    var form = $('#form-ke-hoach-tuyen-xa');
    syncStateFromDom();
    return {
      nid_khach_hang: form.find('[name="nid_khach_hang"]').val(),
      loai_hinh_tuyen_xa: form.find('[name="loai_hinh_tuyen_xa"]').val(),
      trang_thai_van_chuyen: form.find('[name="trang_thai_van_chuyen"]').val().trim(),
      so_bkg: form.find('[name="so_bkg"]').val().trim(),
      so_cont: form.find('[name="so_cont"]').val().trim(),
      loai_cont: form.find('[name="loai_cont"]').val().trim(),
      dia_chi_kho: form.find('[name="dia_chi_kho"]').val().trim(),
      diem_di: form.find('[name="diem_di"]').val().trim(),
      cua_khau: form.find('[name="cua_khau"]').val().trim(),
      diem_den: form.find('[name="diem_den"]').val().trim(),
      ngay_bat_dau: dateToApi(form.find('[name="ngay_bat_dau"]').val()),
      ngay_ket_thuc_du_kien: dateToApi(form.find('[name="ngay_ket_thuc_du_kien"]').val()),
      ghi_chu: form.find('[name="ghi_chu"]').val().trim(),
      changs: state.changs,
      chi_phi: state.chiPhi,
      dau: state.dau
    };
  }

  function submitForm() {
    if (state.mode === 'view') return;
    if (!validateForm()) return;
    var payload = buildPayload();
    var id = $('#form-ke-hoach-tuyen-xa [name="nid"]').val();
    showLoading(true);
    $.ajax({
      url: id ? '/api/ke-hoach-tuyen-xa/' + id : '/api/ke-hoach-tuyen-xa',
      type: id ? 'PUT' : 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(payload),
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success(id ? 'Cập nhật thành công' : 'Tạo kế hoạch tuyến xa thành công');
          getModal().hide();
          loadList();
        } else if (notyf) {
          notyf.error(res.message || 'Lưu thất bại');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      },
      complete: function () {
        showLoading(false);
      }
    });
  }

  function applyMode() {
    var isView = state.mode === 'view';
    $('#ke-hoach-tuyen-xa-modal-title').text(isView ? 'Chi tiết kế hoạch tuyến xa' : ($('#form-ke-hoach-tuyen-xa [name="nid"]').val() ? 'Cập nhật kế hoạch tuyến xa' : 'Thêm kế hoạch tuyến xa'));
    $('#btn-save-ke-hoach-tuyen-xa').toggle(!isView);
    $('#form-ke-hoach-tuyen-xa').toggleClass('section-readonly', isView);
    $('#form-ke-hoach-tuyen-xa')
      .find('input, textarea, select, button')
      .not('[data-bs-dismiss="modal"], .btn-close')
      .prop('disabled', isView);
    if (!isView) {
      renderSupportOptions();
      renderAllRepeaterTables();
    }
  }

  function resetForm() {
    var form = $('#form-ke-hoach-tuyen-xa');
    form[0].reset();
    form.find('[name="nid"]').val('');
    state.mode = 'create';
    changKeySeq = 0;
    state.changs = [blankChang()];
    state.chiPhi = [blankChiPhi()];
    state.dau = [blankDau()];
    $('#ke-hoach-tuyen-xa-chang-body').empty();
    $('#ke-hoach-tuyen-xa-chi-phi-body').empty();
    $('#ke-hoach-tuyen-xa-dau-body').empty();
  }
})(jQuery, Drupal);

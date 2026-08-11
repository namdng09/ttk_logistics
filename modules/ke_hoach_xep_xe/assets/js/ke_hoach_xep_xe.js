(function ($, Drupal) {
  'use strict';

  var notyf;
  var settings = Drupal.settings.ke_hoach_xep_xe || {};
  var perms = settings.permissions || {};
  var statuses = settings.statuses || [];
  var mode = settings.mode || 'list';
  var editData = settings.data || null;
  var currentPage = 1;
  var currentKeyword = '';
  var currentStatus = '';
  var currentFilters = {};
  var FORM_DROPDOWN_CACHE_KEY = 'ke_hoach_xep_xe_form_dropdowns_v1';
  var LIST_SNAPSHOT_CACHE_KEY = 'ke_hoach_xep_xe_list_snapshot_v2';
  var LIST_FORCE_RELOAD_KEY = 'ke_hoach_xep_xe_list_force_reload_v1';
  var formDropdownCacheMemory = null;
  var detachedCreateFormApp = null;
  var listPageSettingsBeforeEdit = null;
  var listSearchDropdownsLoaded = false;
  var listSearchDropdownsLoading = false;
  var listSearchDropdownCallbacks = [];
  var listSearchDropdownData = {
    customers: [],
    kho: [],
    loaiCont: ['20DC', '40DC', '40HC', '45HC'],
    vehicles: [],
    moocs: []
  };

  function currentPlanType() {
    return settings.plan_type === 'tuyen_xa' ? 'tuyen_xa' : 'thuong';
  }

  function currentListPath() {
    return currentPlanType() === 'tuyen_xa' ? '/ke-hoach-tuyen-xa' : '/ke-hoach-xep-xe';
  }

  function listSnapshotKey() {
    return LIST_SNAPSHOT_CACHE_KEY + '_' + currentPlanType();
  }

  function listForceReloadKey() {
    return LIST_FORCE_RELOAD_KEY + '_' + currentPlanType();
  }

  function listFilterFields() {
    return {
      khach_hang: '#filter-khach-hang',
      so_bkg: '#filter-so-bkg',
      date_from: '#filter-date-from',
      date_to: '#filter-date-to',
      dia_chi_kho: '#filter-dia-chi-kho',
      loai_cont: '#filter-loai-cont',
      so_cont: '#filter-so-cont',
      so_seal_chinh: '#filter-seal-chinh',
      so_seal_tam: '#filter-seal-phu',
      bks_dau_keo: '#filter-bks-dau-keo',
      bks_mooc: '#filter-bks-mooc',
      da_du_hang: '#filter-da-du-hang'
    };
  }

  var HINH_THUC_MAP = {
    cat_keo: 'Cắt kéo',
    cat_keo_cheo: 'Cắt kéo chéo',
    tha_mooc: 'Thả mooc',
    rut_mooc: 'Rút mooc',
    dong_hang_trong_ngay: 'Đóng hàng trong ngày',
    roi_cont: 'Rời Cont'
  };
  var HINH_THUC_COLOR = {
    cat_keo: 'bg-label-success',
    cat_keo_cheo: 'bg-label-primary',
    tha_mooc: 'bg-label-warning',
    rut_mooc: 'bg-label-info',
    dong_hang_trong_ngay: 'bg-label-danger',
    roi_cont: 'bg-label-secondary'
  };

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r.message || 'Lỗi không xác định';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function setPlanStatus(id, status, options) {
    options = options || {};
    status = status || 'Hoàn thành';
    var isComplete = status === 'Hoàn thành';
    var doUpdate = function () {
      if (options.$button && options.$button.length) {
        options.$button.prop('disabled', true);
      }
      $.ajax({
        url: '/api/quan-ly-cont/' + id,
        type: 'PUT',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify({ trang_thai_van_chuyen: status }),
        success: function (res) {
          if (res.status === 'success') {
            if (notyf) notyf.success(isComplete ? 'Chuyến này đã hoàn thành' : 'Đã chuyển kế hoạch về Chưa xếp xe');
            if (typeof options.onSuccess === 'function') options.onSuccess(res);
          } else if (notyf) {
            notyf.error(res.message || 'Cập nhật trạng thái thất bại');
          }
        },
        error: function (jqXHR) {
          if (notyf) notyf.error(apiMsg(jqXHR));
        },
        complete: function () {
          if (options.$button && options.$button.length) {
            options.$button.prop('disabled', false);
          }
        }
      });
    };
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: isComplete ? 'Chuyển hoàn thành?' : 'Chuyển về Chưa xếp xe?',
        text: isComplete ? 'Kế hoạch hoàn thành sẽ được đưa vào kỳ tính lương lái xe.' : 'Kế hoạch sẽ quay về trạng thái Chưa xếp xe.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: isComplete ? 'Hoàn thành' : 'Chuyển về',
        cancelButtonText: 'Huỷ',
        customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) doUpdate();
      });
    } else if (confirm(isComplete ? 'Chuyển kế hoạch sang Hoàn thành?' : 'Chuyển kế hoạch về Chưa xếp xe?')) {
      doUpdate();
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

  function phieuTraKhachBadge(row) {
    var info = row.phieu_tra_khach_hang || {};
    var status = info.trang_thai_duyet || '';
    var label = info.trang_thai_label || 'Chưa xuất';
    var badgeClass = 'bg-label-secondary';
    if (info.co_the_tao_phieu) badgeClass = 'bg-label-success';
    else if (status === 'chua_duyet') badgeClass = 'bg-label-warning';
    else if (status === 'da_duyet') badgeClass = 'bg-label-primary';
    else if (status === 'khong_duyet') badgeClass = 'bg-label-danger';
    var note = info.ma_phieu ? '<div class="small text-muted mt-1">' + escHtml(info.ma_phieu) + (info.so_hoa_don ? ' - HĐ ' + escHtml(info.so_hoa_don) : '') + '</div>' : '';
    return '<span class="badge ' + badgeClass + '">' + escHtml(label) + '</span>' + note;
  }

  function updateBulkPhieuTraKhachState() {
    var count = $('.khxh-plan-check:checked').length;
    $('#khxh-selected-count').text(count);
    $('.btn-create-phieu-tra-khach').prop('disabled', count === 0);
    var totalEnabled = $('.khxh-plan-check:not(:disabled)').length;
    $('#khxh-check-all').prop('checked', totalEnabled > 0 && count === totalEnabled);
  }

  function selectedPlanPayload() {
    var ids = [];
    var customerId = 0;
    var customerName = '';
    var mismatch = false;
    $('.khxh-plan-check:checked').each(function () {
      var $check = $(this);
      var id = parseInt($check.val(), 10) || 0;
      var rowCustomerId = parseInt($check.attr('data-customer-id'), 10) || 0;
      if (id) ids.push(id);
      if (!customerId) {
        customerId = rowCustomerId;
        customerName = $check.attr('data-customer-name') || '';
      }
      else if (customerId !== rowCustomerId) {
        mismatch = true;
      }
    });
    return { ids: ids, customerId: customerId, customerName: customerName, mismatch: mismatch };
  }

  function createPhieuTraKhachFromSelected() {
    var payload = selectedPlanPayload();
    if (!payload.ids.length) {
      if (notyf) notyf.error('Vui lòng chọn kế hoạch cần tạo phiếu trả khách hàng');
      return;
    }
    if (payload.mismatch || !payload.customerId) {
      if (notyf) notyf.error('Các kế hoạch được chọn phải cùng một khách hàng');
      return;
    }
    var doCreate = function () {
      $('.btn-create-phieu-tra-khach').prop('disabled', true);
      $.ajax({
        url: '/api/phieu-tra-khach-hang',
        type: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify({
          nid_khach_hang: payload.customerId,
          nid_ke_hoach: payload.ids
        }),
        success: function (res) {
          if (res.status === 'success') {
            var code = res.data && res.data.ma_phieu ? res.data.ma_phieu : '';
            if (notyf) notyf.success('Đã tạo phiếu trả khách hàng' + (code ? ': ' + code : ''));
            loadList();
          }
          else if (notyf) {
            notyf.error(res.message || 'Tạo phiếu trả khách hàng thất bại');
          }
        },
        error: function (jqXHR) {
          if (notyf) notyf.error(apiMsg(jqXHR));
        },
        complete: function () {
          updateBulkPhieuTraKhachState();
        }
      });
    };
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Tạo phiếu trả khách hàng?',
        text: 'Tạo phiếu cho ' + payload.ids.length + ' kế hoạch của ' + (payload.customerName || 'khách hàng đã chọn') + '.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Tạo phiếu',
        cancelButtonText: 'Huỷ',
        customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) doCreate();
      });
    }
    else if (confirm('Tạo phiếu trả khách hàng cho ' + payload.ids.length + ' kế hoạch đã chọn?')) {
      doCreate();
    }
  }

  function apiToDate(val) {
    if (!val) return '';
    var d = String(val).split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : val;
  }

  function dateToApi(val) {
    if (!val) return '';
    var d = String(val).split('/');
    return d.length === 3 ? d[2] + '-' + d[1] + '-' + d[0] : val;
  }

  function apiToDatetime(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    if (parts.length === 2) {
      var d = parts[0].split('-');
      if (d.length === 3) return d[2] + '/' + d[1] + '/' + d[0] + ' ' + parts[1];
    }
    return val;
  }

  function datetimeToApi(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    if (parts.length === 2) {
      var d = parts[0].split('/');
      if (d.length === 3) return d[2] + '-' + d[1] + '-' + d[0] + ' ' + parts[1];
    }
    return val;
  }

  function toDdMmYyyyHm(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    var d = parts[0] ? parts[0].split('-') : [];
    if (d.length !== 3) return val;
    return d[2] + '/' + d[1] + '/' + d[0] + (parts[1] ? ' ' + parts[1].substring(0, 5) : '');
  }

  function dateTimeStack(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    var d = parts[0] ? parts[0].split('-') : [];
    if (d.length !== 3) return escHtml(val);
    var year = d[0].slice(-2);
    var time = parts[1] ? parts[1].substring(0, 5) : '';
    return escHtml(d[2] + '/' + d[1] + '/' + year) + (time ? '<br>' + escHtml(time) : '');
  }

  function cutOffBadge(val) {
    if (!val) return '';
    var normalized = apiToDatetime(val);
    var d = parseCutOff(normalized);
    if (!d) return escHtml(val);
    return dateTimeStack(val);
  }

  function vehicleListInfoHtml(row) {
    row = row || {};
    var lxName = (row.lai_xe && row.lai_xe.ten) || '';
    var lxSdt = (row.lai_xe && row.lai_xe.sdt) || '';
    var pt = row.phuong_tien || {};
    var mooc = row.mooc || {};
    var ptDisplay = pt.bks || '';
    var moocDisplay = mooc.bks || '';
    var ptText = pt.bks ? pt.bks + (pt.ma_tai_san ? ' - ' + pt.ma_tai_san : '') : '';
    var moocText = mooc.bks ? mooc.bks + (mooc.ma_tai_san ? ' - ' + mooc.ma_tai_san : '') : '';
    var tooltipLines = [];
    if (ptText) tooltipLines.push(ptText);
    if (moocText) tooltipLines.push(moocText);
    if (lxName || lxSdt) tooltipLines.push(lxName + (lxSdt ? ' - ' + lxSdt : ''));
    var tooltip = tooltipLines.join('\n');
    return '' +
      '<div class="khxh-vehicle-info"' + (tooltip ? ' title="' + escHtml(tooltip) + '"' : '') + '>' +
      '<div class="khxh-vehicle-bks">' + (ptDisplay ? escHtml(ptDisplay) : '<span class="text-muted fst-italic small">BKS đầu kéo</span>') + '</div>' +
      '<div class="khxh-vehicle-mooc">' + (moocDisplay ? escHtml(moocDisplay) : '<span class="text-muted fst-italic small">BKS mooc</span>') + '</div>' +
      '<div class="khxh-vehicle-driver">' +
        (lxName ? escHtml(lxName) : '<span class="text-muted fst-italic small">lái xe</span>') +
      '</div>' +
      '</div>';
  }

  function normalizeBaiHaThucTe(value, planned) {
    value = (value || '').trim();
    planned = (planned || '').trim();
    return value && value !== planned ? value : '';
  }

  function parseCutOff(val) {
    var parts = String(val).split(' ');
    if (parts.length < 1) return null;
    var dParts = parts[0].split('/');
    if (dParts.length !== 3) return null;
    var dd = parseInt(dParts[0], 10);
    var mm = parseInt(dParts[1], 10) - 1;
    var yyyy = parseInt(dParts[2], 10);
    if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return null;
    var tParts = parts[1] ? parts[1].split(':') : [];
    var hh = tParts[0] ? parseInt(tParts[0], 10) : 0;
    var mi = tParts[1] ? parseInt(tParts[1], 10) : 0;
    return new Date(yyyy, mm, dd, hh, mi);
  }

  function getNidFromUrl() {
    var parts = window.location.pathname.split('/');
    if (parts.length >= 3 && parts[1] === 'ke-hoach-xep-xe') {
      return parseInt(parts[2], 10) || 0;
    }
    return 0;
  }

  function _jq() {
    return (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ :
      (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function') ? jQuery : null;
  }

  function isKeHoachRoute(path) {
    path = path || window.location.pathname || '';
    return path.indexOf('/ke-hoach-xep-xe') === 0 || path.indexOf('/ke-hoach-tuyen-xa') === 0 || path.indexOf('/tao-ke-hoach-xep-xe') === 0;
  }

  function clearFormDropdownCache() {
    formDropdownCacheMemory = null;
    try { sessionStorage.removeItem(FORM_DROPDOWN_CACHE_KEY); } catch (e) {}
  }

  function maybeResetFormDropdownCache() {
    var navEntry = null;
    try {
      navEntry = window.performance && window.performance.getEntriesByType ? window.performance.getEntriesByType('navigation')[0] : null;
    } catch (e) {}
    if (navEntry && navEntry.type === 'reload') {
      clearFormDropdownCache();
      return;
    }

    var ref = document.referrer || '';
    if (!ref) {
      clearFormDropdownCache();
      return;
    }

    try {
      var refUrl = new URL(ref, window.location.origin);
      if (refUrl.origin !== window.location.origin || !isKeHoachRoute(refUrl.pathname)) {
        clearFormDropdownCache();
      }
    } catch (e) {
      clearFormDropdownCache();
    }
  }

  function getFormDropdownCache() {
    if (formDropdownCacheMemory) return formDropdownCacheMemory;
    try {
      var raw = sessionStorage.getItem(FORM_DROPDOWN_CACHE_KEY);
      if (!raw) return null;
      formDropdownCacheMemory = JSON.parse(raw);
      return formDropdownCacheMemory;
    } catch (e) {
      return null;
    }
  }

  function setFormDropdownCache(data) {
    formDropdownCacheMemory = data;
    try {
      sessionStorage.setItem(FORM_DROPDOWN_CACHE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function getListSnapshot() {
    try {
      var raw = sessionStorage.getItem(listSnapshotKey());
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setListSnapshot(data) {
    try {
      sessionStorage.setItem(listSnapshotKey(), JSON.stringify(data));
    } catch (e) {}
  }

  function clearListSnapshot() {
    try { sessionStorage.removeItem(listSnapshotKey()); } catch (e) {}
  }

  function shouldForceReloadList() {
    try {
      return sessionStorage.getItem(listForceReloadKey()) === '1';
    } catch (e) {
      return false;
    }
  }

  function markForceReloadList() {
    try { sessionStorage.setItem(listForceReloadKey(), '1'); } catch (e) {}
  }

  function clearForceReloadList() {
    try { sessionStorage.removeItem(listForceReloadKey()); } catch (e) {}
  }

  maybeResetFormDropdownCache();

  function syncPageSettings() {
    settings = Drupal.settings.ke_hoach_xep_xe || {};
    perms = settings.permissions || {};
    statuses = settings.statuses || [];
    mode = settings.mode || 'list';
    editData = settings.data || null;
  }

  function initSelect2(el, placeholder, options) {
    var jq = _jq();
    if (!jq || !el) return;
    var $el = jq(el);
    if ($el.data('select2')) $el.select2('destroy');
    var opts = $.extend({
      placeholder: placeholder || '— Chọn —',
      allowClear: true,
      width: '100%'
    }, options || {});
    if (!opts.dropdownParent) {
      var $modal = $el.closest('.modal');
      if ($modal.length) opts.dropdownParent = $modal;
    }
    $el.select2(opts);
    $el.off('select2:open.khxhFocus').on('select2:open.khxhFocus', function () {
      window.setTimeout(function () {
        var search = document.querySelector('.select2-container--open .select2-search__field');
        if (search) search.focus();
      }, 0);
    });
  }

  function setSelect2Invalid($select, invalid) {
    if (!$select || !$select.length) return;
    var instance = $select.data('select2');
    var $container = instance && instance.$container ? instance.$container : $select.nextAll('.select2-container').first();
    $select.removeClass('is-invalid');
    $container.removeClass('is-invalid khxh-select2-invalid');
    if (invalid) $container.addClass('khxh-select2-invalid');
  }

  Drupal.behaviors.keHoachXepXe = {
    attach: function (context) {
      syncPageSettings();
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }
      bindGlobalCreateModal();
      if ($('#ke-hoach-list-app', context).length) initList();
      if ($('#ke-hoach-form-app', context).length) initForm();
      if ($('#ke-hoach-cont-app', context).length) initContList();
      if ($('#detail-body', context).length) initDetail();
    }
  };

  function bindGlobalCreateModal() {
    if (bindGlobalCreateModal._bound) return;
    bindGlobalCreateModal._bound = true;

    $(document).on('click', '.btn-open-create-ke-hoach', function (e) {
      e.preventDefault();
      var modalEl = document.getElementById('ke-hoach-fullscreen-modal');
      if (!modalEl) {
        window.location.href = currentListPath() + '?open_create=1';
        return;
      }
      var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
      modal.show();
    });
  }

  function buildActions(row) {
    var nid = typeof row === 'object' ? row.nid : row;
    var nidLaiXe = typeof row === 'object' ? (row.nid_lai_xe || 0) : 0;
    var loaiKeHoach = typeof row === 'object' ? (row.loai_ke_hoach || currentPlanType()) : currentPlanType();
    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><button type="button" class="dropdown-item btn-view-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>' +
      '<li><button type="button" class="dropdown-item btn-edit-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-truck-delivery me-2"></i>Xếp xe</button></li>' +
      '<li><button type="button" class="dropdown-item btn-open-ke-hoach-chi-phi" data-id="' + nid + '" data-nid-lai-xe="' + nidLaiXe + '" data-loai-ke-hoach="' + escHtml(loaiKeHoach) + '"><i class="ti tabler-receipt-2 me-2"></i>Chi phí</button></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><button type="button" class="dropdown-item text-danger btn-delete-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>' +
      '</ul></div>';
  }

  function valueOrMuted(value, placeholder) {
    return value ? escHtml(value) : '<span class="text-muted fst-italic">' + escHtml(placeholder || 'Chưa có') + '</span>';
  }

  function detailItem(label, value) {
    return '<div class="detail-info-item"><div class="detail-info-label">' + escHtml(label) + '</div><div class="detail-info-value">' + valueOrMuted(value) + '</div></div>';
  }

  function transportCardHtml(title, row, emptyText) {
    if (!row) {
      return '<div class="detail-transport-card detail-transport-empty"><div class="detail-transport-title">' + escHtml(title) + '</div><div class="text-muted">' + escHtml(emptyText || 'Chưa có dữ liệu') + '</div></div>';
    }
    var driver = row.lai_xe || {};
    var vehicle = row.phuong_tien || {};
    var mooc = row.mooc || {};
    var html = '<div class="detail-transport-card">' +
      '<div class="detail-transport-title">' + escHtml(title) + '</div>' +
      '<div class="detail-info-grid detail-info-grid-compact">' +
        detailItem('Đầu kéo', vehicle.bks || '') +
        detailItem('Mooc', mooc.bks || '') +
        detailItem('Lái xe', driver.ten || '') +
        detailItem('SĐT lái xe', driver.sdt || '') +
      '</div>' +
    '</div>';
    return html;
  }

  function renderDetailModal(d) {
    var khName = (d.khach_hang && d.khach_hang.ten) || '';
    var hinhThuc = d.hinh_thuc_van_tai ? (HINH_THUC_MAP[d.hinh_thuc_van_tai] || d.hinh_thuc_van_tai) : '';
    var diemDen = d.bai_ha_thuc_te || d.bai_ha_cont || '';
    var commonHtml = '' +
      '<div class="detail-info-grid">' +
        detailItem('Ngày lập KH', d.created ? d.created.substring(0, 16) : '') +
        detailItem('Khách hàng', khName) +
        detailItem('Hình thức vận tải', hinhThuc) +
        detailItem('Trạng thái', d.trang_thai_van_chuyen || '') +
        detailItem('Cut-off', apiToDatetime(d.cut_off || '')) +
        detailItem('Ghi chú', d.ghi_chu || '') +
      '</div>';
    var containerHtml = '' +
      '<div class="detail-info-grid">' +
        detailItem('Số BKG', d.so_bkg || '') +
        detailItem('Số cont', d.so_cont || '') +
        detailItem('Loại cont', d.loai_cont || '') +
        detailItem('Seal chính', d.so_seal_chinh || '') +
        detailItem('Seal phụ', d.so_seal_tam || '') +
        detailItem('Địa chỉ kho', d.dia_chi_kho || '') +
        detailItem('Bãi lấy', d.bai_lay_cont || '') +
        detailItem('Bãi lấy thực tế', d.bai_lay_thuc_te || '') +
        detailItem('Bãi hạ', d.bai_ha_cont || '') +
        detailItem('Bãi hạ thực tế', d.bai_ha_thuc_te || '') +
        detailItem('Điểm đến', diemDen) +
        detailItem('Cảng xuất', d.cang_xuat || '') +
        detailItem('Đủ hàng', parseInt(d.da_du_hang, 10) === 1 ? 'Đủ hàng' : 'Chưa đủ') +
      '</div>';
    var transportHtml = '<div class="detail-transport-grid">' +
      transportCardHtml('Kéo lên', d.cont_ref || d, 'Chưa có kế hoạch kéo lên') +
      transportCardHtml('Kéo về', d.cont_keo_ve_by || null, 'Chưa có kế hoạch kéo về') +
    '</div>';
    $('#ke-hoach-detail-subtitle').text((d.so_bkg || 'Kế hoạch') + (d.so_cont ? ' - ' + d.so_cont : ''));
    $('#ke-hoach-detail-edit-btn').attr('href', '/ke-hoach-xep-xe/' + d.nid + '/sua');
    $('#ke-hoach-detail-content').html(
      '<div class="detail-card"><div class="detail-section-title">Thông tin chung</div>' + commonHtml + '</div>' +
      '<div class="detail-card"><div class="detail-section-title">Thông tin container</div>' + containerHtml + '</div>' +
      '<div class="detail-card"><div class="detail-section-title">Thông tin vận chuyển</div>' + transportHtml + '</div>'
    );
  }

  function openDetailModal(id) {
    var modalEl = document.getElementById('ke-hoach-detail-modal');
    if (!modalEl) return;
    var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
    $('#ke-hoach-detail-content').html('');
    $('#ke-hoach-detail-subtitle').text('Đang tải dữ liệu...');
    $('#ke-hoach-detail-loading').show();
    modal.show();
    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        $('#ke-hoach-detail-loading').hide();
        if (res.status !== 'success' || !res.data) {
          $('#ke-hoach-detail-content').html('<div class="alert alert-danger mb-0">' + escHtml(res.message || 'Không tải được chi tiết kế hoạch') + '</div>');
          return;
        }
        renderDetailModal(res.data);
      },
      error: function (jqXHR) {
        $('#ke-hoach-detail-loading').hide();
        $('#ke-hoach-detail-content').html('<div class="alert alert-danger mb-0">' + escHtml(apiMsg(jqXHR)) + '</div>');
      }
    });
  }

  function openEditFullscreenModal(id) {
    id = parseInt(id, 10) || 0;
    if (!id) return;
    var isTuyenXa = currentPlanType() === 'tuyen_xa';
    var modalId = isTuyenXa ? 'ke-hoach-tuyen-xa-edit-fullscreen-modal' : 'ke-hoach-edit-fullscreen-modal';
    var templateId = isTuyenXa ? 'ke-hoach-tuyen-xa-edit-modal-template' : 'ke-hoach-edit-modal-template';
    var contentId = isTuyenXa ? 'ke-hoach-tuyen-xa-edit-modal-content' : 'ke-hoach-edit-modal-content';
    var modalEl = document.getElementById(modalId);
    var templateEl = document.getElementById(templateId);
    var contentEl = document.getElementById(contentId);
    if (!modalEl || !templateEl || !contentEl) {
      window.location.href = '/ke-hoach-xep-xe/' + id + '/sua';
      return;
    }
    listPageSettingsBeforeEdit = $.extend(true, {}, Drupal.settings.ke_hoach_xep_xe || {});
    if (!detachedCreateFormApp) {
      detachedCreateFormApp = $('#ke-hoach-form-app').detach();
    }
    contentEl.innerHTML = templateEl.innerHTML;
    $('#' + contentId + ' #form-loading').show();
    var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
    modal.show();
    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          $('#' + contentId + ' #form-loading').hide();
          if (notyf) notyf.error(res.message || 'Không tải được kế hoạch');
          return;
        }
        Drupal.settings.ke_hoach_xep_xe = $.extend({}, Drupal.settings.ke_hoach_xep_xe || {}, {
          mode: 'edit',
          plan_type: res.data.loai_ke_hoach === 'tuyen_xa' ? 'tuyen_xa' : 'thuong',
          data: res.data
        });
        syncPageSettings();
        initForm._bound = false;
        initForm();
        $('#' + contentId + ' #ke-hoach-form-app .card-header a.btn-outline-secondary')
          .attr('href', '#')
          .attr('data-bs-dismiss', 'modal');
      },
      error: function (jqXHR) {
        $('#' + contentId + ' #form-loading').hide();
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function collectListFilters() {
    var fields = listFilterFields();
    var filters = {};
    for (var key in fields) {
      if (!fields.hasOwnProperty(key)) continue;
      var value = ($(fields[key]).val() || '').trim();
      if (value) filters[key] = value;
    }
    return filters;
  }

  function setListFilterInputs(filters) {
    filters = filters || {};
    var fields = listFilterFields();
    for (var key in fields) {
      if (!fields.hasOwnProperty(key)) continue;
      var $field = $(fields[key]);
      $field.val(filters[key] || '');
      if ($field.data('select2')) $field.trigger('change');
    }
  }

  function clearListFilters() {
    currentKeyword = '';
    currentStatus = '';
    currentFilters = {};
    setListFilterInputs({});
    $('#status-filter').val('');
    if ($('#status-filter').data('select2')) $('#status-filter').trigger('change');
  }

  function setListSearchLoading(show) {
    var $modal = $('#ke-hoach-search-modal');
    $('#ke-hoach-search-loading').toggle(!!show);
    $modal.find('input, select, button').prop('disabled', !!show);
  }

  function appendTextOptions($select, items, selectedValue) {
    var html = '<option></option>';
    var seen = {};
    selectedValue = selectedValue || '';
    for (var i = 0; i < items.length; i++) {
      var value = String(items[i] || '').trim();
      if (!value || seen[value]) continue;
      seen[value] = true;
      html += '<option value="' + escHtml(value) + '"' + (value === selectedValue ? ' selected' : '') + '>' + escHtml(value) + '</option>';
    }
    if (selectedValue && !seen[selectedValue]) {
      html += '<option value="' + escHtml(selectedValue) + '" selected>' + escHtml(selectedValue) + '</option>';
    }
    $select.html(html);
  }

  function initListSearchSelects() {
    var dropdownParent = $('#ke-hoach-search-modal');
    var filters = $.extend({}, currentFilters || {});
    $('#ke-hoach-search-modal').find('input, select, button').prop('disabled', false);
    appendTextOptions($('#filter-khach-hang'), $.map(listSearchDropdownData.customers, function (item) { return item.ten || ''; }), filters.khach_hang || '');
    appendTextOptions($('#filter-dia-chi-kho'), listSearchDropdownData.kho, filters.dia_chi_kho || '');
    appendTextOptions($('#filter-loai-cont'), listSearchDropdownData.loaiCont, filters.loai_cont || '');
    appendTextOptions($('#filter-bks-dau-keo'), $.map(listSearchDropdownData.vehicles, function (item) { return item.bks || ''; }), filters.bks_dau_keo || '');
    appendTextOptions($('#filter-bks-mooc'), $.map(listSearchDropdownData.moocs, function (item) { return item.bks || ''; }), filters.bks_mooc || '');
    setListFilterInputs(filters);
    $('#status-filter').val(currentStatus || '');
    initSelect2(document.getElementById('filter-khach-hang'), '— Chọn khách hàng —', { dropdownParent: dropdownParent });
    initSelect2(document.getElementById('filter-dia-chi-kho'), '— Chọn địa chỉ kho —', { dropdownParent: dropdownParent });
    initSelect2(document.getElementById('filter-loai-cont'), 'Loại cont', { tags: true, dropdownParent: dropdownParent });
    initSelect2(document.getElementById('filter-bks-dau-keo'), '— Chọn BKS đầu kéo —', { dropdownParent: dropdownParent });
    initSelect2(document.getElementById('filter-bks-mooc'), '— Chọn BKS mooc —', { dropdownParent: dropdownParent });
    initSelect2(document.getElementById('status-filter'), '— Chọn trạng thái —', { dropdownParent: dropdownParent, allowClear: true });
    initSelect2(document.getElementById('filter-da-du-hang'), '— Chọn đủ hàng —', { dropdownParent: dropdownParent, allowClear: true });
  }

  function loadListSearchDropdowns(done) {
    if (listSearchDropdownsLoaded) {
      if (done) done();
      return;
    }
    if (done) listSearchDropdownCallbacks.push(done);
    if (listSearchDropdownsLoading) return;
    listSearchDropdownsLoading = true;
    var pending = 3;
    function finish() {
      pending -= 1;
      if (pending > 0) return;
      listSearchDropdownsLoaded = true;
      listSearchDropdownsLoading = false;
      var callbacks = listSearchDropdownCallbacks.splice(0);
      for (var i = 0; i < callbacks.length; i++) callbacks[i]();
    }
    $.ajax({
      url: '/api/khach-hang',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) listSearchDropdownData.customers = res.data.items;
      },
      complete: finish
    });
    $.ajax({
      url: '/api/phuong-tien',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          listSearchDropdownData.vehicles = [];
          listSearchDropdownData.moocs = [];
          for (var i = 0; i < res.data.items.length; i++) {
            var item = res.data.items[i];
            if (String(item.loai_phuong_tien || '').toLowerCase().indexOf('mooc') !== -1) listSearchDropdownData.moocs.push(item);
            else listSearchDropdownData.vehicles.push(item);
          }
        }
      },
      complete: finish
    });
    $.ajax({
      url: '/api/danh-muc',
      type: 'GET',
      dataType: 'json',
      data: { phan_loai: 'Kho', limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          listSearchDropdownData.kho = $.map(res.data.items, function (item) { return item.ten || ''; });
        }
      },
      complete: finish
    });
  }

  function initListDateFilters() {
    if (typeof flatpickr === 'undefined') return;
    $('#filter-date-from, #filter-date-to').each(function () {
      if (this._flatpickr) return;
      flatpickr(this, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        appendTo: document.body
      });
    });
  }

  function initList() {
    if (initList._bound) return;
    initList._bound = true;
    var doc = document;
    initListDateFilters();

    function canRestoreListSnapshot() {
      if (shouldForceReloadList()) return false;
      var navEntry = null;
      try {
        navEntry = window.performance && window.performance.getEntriesByType ? window.performance.getEntriesByType('navigation')[0] : null;
      } catch (e) {}
      if (navEntry && navEntry.type === 'reload') return false;
      if (!document.referrer) return false;
      try {
        var refUrl = new URL(document.referrer, window.location.origin);
        if (refUrl.origin !== window.location.origin) return false;
        return isKeHoachRoute(refUrl.pathname) && refUrl.pathname !== currentListPath();
      } catch (e) {
        return false;
      }
    }

    function restoreListSnapshot() {
      var snapshot = getListSnapshot();
      if (!snapshot) return false;
      currentPage = snapshot.currentPage || 1;
      currentKeyword = snapshot.currentKeyword || '';
      currentStatus = snapshot.currentStatus || '';
      currentFilters = snapshot.currentFilters || {};
      setListFilterInputs(currentFilters);
      $('#status-filter').val(currentStatus);
      $('#list-body').html(snapshot.bodyHtml || '');
      if (snapshot.paginationWrapHtml) {
        $('#pagination-wrap').replaceWith(snapshot.paginationWrapHtml);
      }
      clearForceReloadList();
      updateBulkPhieuTraKhachState();
      return true;
    }

    function persistListSnapshot() {
      var paginationWrap = document.getElementById('pagination-wrap');
      setListSnapshot({
        currentPage: currentPage,
        currentKeyword: currentKeyword,
        currentStatus: currentStatus,
        currentFilters: currentFilters,
        bodyHtml: $('#list-body').html(),
        paginationWrapHtml: paginationWrap ? paginationWrap.outerHTML : ''
      });
    }

    function deleteItem(id) {
      $.ajax({
        url: '/api/ke-hoach-xep-xe/' + id,
        type: 'DELETE',
        dataType: 'json',
        success: function (res) {
          if (res.status === 'success') {
            if (notyf) notyf.success('Xoá kế hoạch thành công');
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

    $('#search-btn').on('click', function () {
      currentFilters = collectListFilters();
      currentStatus = $('#status-filter').val() || '';
      currentPage = 1;
      loadList();
      var searchModalEl = document.getElementById('ke-hoach-search-modal');
      var searchModal = searchModalEl && typeof bootstrap !== 'undefined' && bootstrap.Modal.getInstance ? bootstrap.Modal.getInstance(searchModalEl) : null;
      if (searchModal) searchModal.hide();
    });
    $('.ke-hoach-list-filter input, .ke-hoach-list-filter select').on('keypress', function (e) {
      if (e.which === 13) {
        currentFilters = collectListFilters();
        currentStatus = $('#status-filter').val() || '';
        currentPage = 1;
        loadList();
      }
    });
    $('#ke-hoach-search-modal').on('show.bs.modal', function () {
      if (!listSearchDropdownsLoaded) setListSearchLoading(true);
    });
    $('#ke-hoach-search-modal').on('shown.bs.modal', function () {
      if (listSearchDropdownsLoaded) {
        initListSearchSelects();
        setListSearchLoading(false);
        return;
      }
      loadListSearchDropdowns(function () {
        initListSearchSelects();
        setListSearchLoading(false);
      });
    });
    $('.btn-reload').on('click', function () {
      clearListFilters();
      currentPage = 1;
      loadList();
    });
    $(document).on('change', '#khxh-check-all', function () {
      $('.khxh-plan-check:not(:disabled)').prop('checked', this.checked);
      updateBulkPhieuTraKhachState();
    });
    $(document).on('change', '.khxh-plan-check', updateBulkPhieuTraKhachState);
    $(document).on('click', '.btn-create-phieu-tra-khach', function (e) {
      e.preventDefault();
      createPhieuTraKhachFromSelected();
    });
    $('#pagination-jump').on('keypress', function (e) {
      if (e.which === 13) {
        var total = parseInt($(this).attr('data-total-pages'), 10) || 0;
        var page = parseInt($(this).val(), 10) || 0;
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });

    $(document).on('click', '.btn-view-ke-hoach-xep-xe', function (e) {
      e.preventDefault();
      openDetailModal($(this).data('id'));
    });
    $(document).on('click', '.btn-edit-ke-hoach-xep-xe', function (e) {
      e.preventDefault();
      persistListSnapshot();
      openEditFullscreenModal($(this).data('id'));
    });
    $(document).on('click', '#ke-hoach-detail-edit-btn', function (e) {
      var id = $(this).attr('href') || '';
      var match = id.match(/ke-hoach-xep-xe\/(\d+)\/sua/);
      if (!match) return;
      e.preventDefault();
      var detailModalEl = document.getElementById('ke-hoach-detail-modal');
      var detailModal = detailModalEl && bootstrap.Modal.getInstance ? bootstrap.Modal.getInstance(detailModalEl) : null;
      if (detailModal) detailModal.hide();
      persistListSnapshot();
      openEditFullscreenModal(match[1]);
    });
    $('#ke-hoach-edit-fullscreen-modal, #ke-hoach-tuyen-xa-edit-fullscreen-modal').on('hidden.bs.modal', function (e) {
      if (e.target !== this) return;
      $('#ke-hoach-edit-modal-content, #ke-hoach-tuyen-xa-edit-modal-content').empty();
      if (detachedCreateFormApp) {
        $('#ke-hoach-edit-modal-template').after(detachedCreateFormApp);
        detachedCreateFormApp = null;
      }
      if (listPageSettingsBeforeEdit) {
        Drupal.settings.ke_hoach_xep_xe = listPageSettingsBeforeEdit;
        listPageSettingsBeforeEdit = null;
        syncPageSettings();
      }
      initForm._bound = false;
      initForm();
    });
    $(document).on('click', '.btn-delete-ke-hoach-xep-xe', function (e) {
      e.preventDefault();
      var id = $(this).data('id');
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xác nhận xoá',
          text: 'Bạn có chắc chắn muốn xoá kế hoạch này?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xoá',
          cancelButtonText: 'Huỷ',
          confirmButtonColor: '#d33',
          customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false
        }).then(function (result) {
          if (result.isConfirmed) deleteItem(id);
        });
      } else if (confirm('Bạn có chắc chắn muốn xoá kế hoạch này?')) {
        deleteItem(id);
      }
    });
    $(document).on('click', '#pagination-wrap .page-link', function (e) {
      e.preventDefault();
      var page = parseInt($(this).data('page'), 10) || 0;
      if (page && page !== currentPage) {
        currentPage = page;
        loadList();
      }
    });

    if (canRestoreListSnapshot() && restoreListSnapshot()) {
      return;
    }
    clearForceReloadList();
    loadList();
    try {
      var url = new URL(window.location.href);
      if (url.searchParams.get('open_create') === '1') {
        url.searchParams.delete('open_create');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
        $('.btn-open-create-ke-hoach').first().trigger('click');
      }
    } catch (e) {}
  }

  function loadList() {
    var tbody = document.getElementById('list-body');
    $('#khxh-check-all').prop('checked', false);
    updateBulkPhieuTraKhachState();
    tbody.innerHTML = '<tr id="loading-row"><td colspan="14" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>';
    var params = { page: currentPage, loai_ke_hoach: currentPlanType() };
    if (currentKeyword) params.keyword = currentKeyword;
    if (currentStatus) params.trang_thai_van_chuyen = currentStatus;
    $.extend(params, currentFilters || {});
    $.ajax({
      url: '/api/ke-hoach-xep-xe',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();
        if (res.status !== 'success' || !res.data) {
          tbody.innerHTML = '<tr><td colspan="14" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi không xác định') + '</td></tr>';
          return;
        }
        var resp = res.data;
        var items = resp.items || [];
        var pageSize = resp.limit || 20;
        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="14" class="text-center py-4">Không có dữ liệu</td></tr>';
          renderPagination(resp);
          return;
        }
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var row = items[i];
          var daDuHang = parseInt(row.da_du_hang, 10) === 1;
          var stt = (resp.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(row);
          var khName = (row.khach_hang && row.khach_hang.ten) || '';
          var khId = row.khach_hang && row.khach_hang.nid ? parseInt(row.khach_hang.nid, 10) || 0 : 0;
          var ptkh = row.phieu_tra_khach_hang || {};
          var canCreatePhieu = !!ptkh.co_the_tao_phieu;
          var hinhThucBadge = row.hinh_thuc_van_tai ? '<span class="badge ' + (HINH_THUC_COLOR[row.hinh_thuc_van_tai] || 'bg-label-secondary') + '">' + escHtml(HINH_THUC_MAP[row.hinh_thuc_van_tai] || '') + '</span>' : '';
          var hinhThucStatus = '';
          if (row.is_cont_keo_ve || row.hinh_thuc_van_tai === 'dong_hang_trong_ngay') {
            hinhThucStatus = 'Kéo về';
          } else if (row.hinh_thuc_van_tai === 'cat_keo' || row.hinh_thuc_van_tai === 'cat_keo_cheo' || row.hinh_thuc_van_tai === 'tha_mooc') {
            hinhThucStatus = 'Kéo lên';
          }
          var contHtml = row.loai_cont ? escHtml(row.loai_cont) : '';
          if (row.so_cont) {
            contHtml += (contHtml ? ' - ' : '') + escHtml(row.so_cont);
          }
          html += '<tr>' +
            '<td class="text-center"><input class="form-check-input khxh-plan-check" type="checkbox" value="' + row.nid + '" data-customer-id="' + khId + '" data-customer-name="' + escHtml(khName) + '"' + (canCreatePhieu ? '' : ' disabled') + '></td>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td class="khxh-date-cell">' + formatDateBadge(row.created) + '</td>' +
            '<td class="khxh-common-cell">' +
              '<div class="khxh-customer-cell">' + (khName ? escHtml(khName) : '<span class="text-muted fst-italic small">khách hàng</span>') + '</div>' +
              '<div class="khxh-htvt-cell">' +
                (hinhThucStatus ? '<div class="khxh-htvt-status">' + escHtml(hinhThucStatus) + '</div>' : '') +
                (hinhThucBadge ? '<div class="khxh-htvt-badge-wrap">' + hinhThucBadge + '</div>' : '') +
              '</div>' +
            '</td>' +
            '<td class="khxh-bkg-cell">' + escHtml(row.so_bkg || '') + '</td>' +
            '<td class="khxh-container-cell">' +
              '<div>' + (contHtml || '<span class="text-muted fst-italic small">container</span>') + '</div>' +
              '<div>' + (row.so_seal_tam ? escHtml(row.so_seal_tam) : '<span class="text-muted fst-italic small">seal tạm</span>') + '</div>' +
              '<div>' + (row.so_seal_chinh ? escHtml(row.so_seal_chinh) : '<span class="text-muted fst-italic small">seal chính</span>') + '</div>' +
            '</td>' +
            '<td class="khxh-vehicle-cell">' + vehicleListInfoHtml(row) + '</td>' +
            '<td class="khxh-kho-cell">' + escHtml(row.dia_chi_kho || '') + '</td>' +
            '<td class="text-nowrap">' +
              '<div class="khxh-hanh-trinh-cell">' +
                '<div class="khxh-hanh-trinh-box">' + (row.bai_lay_cont ? escHtml(row.bai_lay_cont) : '<span class="text-muted fst-italic small">Chưa có</span>') + '</div>' +
                '<div class="khxh-hanh-trinh-separator"></div>' +
                '<div class="khxh-hanh-trinh-box">' + (row.bai_ha_cont ? escHtml(row.bai_ha_cont) : '<span class="text-muted fst-italic small">Chưa có</span>') + '</div>' +
              '</div>' +
            '</td>' +
            '<td class="khxh-cang-cell">' + escHtml(row.cang_xuat || '') + '</td>' +
            '<td class="khxh-date-cell">' + cutOffBadge(row.cut_off) + '</td>' +
            '<td class="khxh-status-cell"><span class="badge ' + (daDuHang ? 'bg-label-success' : 'bg-label-warning') + '">' + (daDuHang ? 'Đã đủ hàng' : 'Chưa đủ hàng') + '</span></td>' +
            '<td class="khxh-phieu-cell">' + phieuTraKhachBadge(row) + '</td>' +
            '</tr>';
        }
        tbody.innerHTML = html;
        updateBulkPhieuTraKhachState();
        renderPagination(resp);
        if ($('#ke-hoach-list-app').length) {
          setListSnapshot({
            currentPage: currentPage,
            currentKeyword: currentKeyword,
            currentStatus: currentStatus,
            bodyHtml: $('#list-body').html(),
            paginationWrapHtml: document.getElementById('pagination-wrap') ? document.getElementById('pagination-wrap').outerHTML : ''
          });
        }
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.innerHTML = '<tr><td colspan="14" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>';
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function renderPagination(resp) {
    var container = document.getElementById('pagination-wrap');
    if (!container) return;
    var ul = container.querySelector('ul.pagination');
    if (!ul) return;
    ul.innerHTML = '';
    var total = resp.total_pages || 0;
    var current = resp.current_page || 0;
    var totalItems = resp.total || 0;
    var infoEl = document.getElementById('pagination-info');
    if (infoEl) infoEl.textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    var totalPagesEl = document.getElementById('pagination-total-pages');
    if (totalPagesEl) totalPagesEl.textContent = '/ ' + total;
    var jumpInput = document.getElementById('pagination-jump');
    if (jumpInput) {
      jumpInput.value = current;
      jumpInput.setAttribute('data-total-pages', total);
    }
    container.style.display = '';
    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    if (start > 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }
    if (end < total) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';
    ul.innerHTML = html;
  }

  function formatDateBadge(val) {
    if (!val) return '';
    return dateTimeStack(val);
  }

  function initForm() {
    if (initForm._bound) return;
    initForm._bound = true;

    var state = {
      customers: [],
      drivers: [],
      vehicles: [],
      vehicleMap: {},
      moocs: [],
      moocMap: {},
      diaDiem: { bai: [], cang: [], kho: [] },
      cauHinh: { diaChiKho: [], loaiCont: [] },
      contCandidateCache: {},
      contCandidatePending: {},
      pendingContDestinationUpdates: {},
      lines: [],
      activeLineKey: null
    };
    var lineSeq = 0;
    var vehicleModal = null;
    var activePickerType = 'vehicle';
    var formModal = null;
    var dropdownsLoaded = false;
    var dropdownsLoading = false;
    var $formApp = $('#ke-hoach-edit-modal-content #ke-hoach-form-app, #ke-hoach-tuyen-xa-edit-modal-content #ke-hoach-form-app').first();
    if (!$formApp.length) {
      $formApp = $('#ke-hoach-form-app').first();
    }
    function $form(selector) {
      return $formApp.find(selector);
    }
    function formDropdownParent() {
      var $modal = $formApp.closest('.modal');
      if (!$modal.length) {
        $modal = $form('#ke-hoach-fullscreen-modal');
      }
      return $modal.length ? $modal : $(document.body);
    }
    var useTableLayout = $form('#ke-hoach-lines-body').length > 0;
    if (currentPlanType() === 'tuyen_xa') {
      $form('#form-title').text('Xếp xe tuyến xa');
      $formApp.find('.card-header a[href="/ke-hoach-xep-xe"]').attr('href', '/ke-hoach-tuyen-xa');
    }

    $(document)
      .off('click', '.btn-open-vehicle-modal')
      .off('click', '.btn-open-mooc-modal')
      .off('click', '.btn-remove-row-ke-hoach')
      .off('click', '.btn-copy-row-ke-hoach')
      .off('click', '.btn-pick-vehicle')
      .off('change', 'input[name="vehicle-picker-radio"]')
      .off('click', '.line-hinh-thuc-radio')
      .off('input', '.line-cont-filter-bkg, .line-cont-filter-cont')
      .off('change', '.line-cont-filter-kho, .line-cont-filter-du-hang')
      .off('change', '.line-cont-ref-checkbox')
      .off('change', '.line-bai-ha-theo-ke-hoach-checkbox')
      .off('change', '.line-cont-picker-wrap .line-bai-ha-thuc-te-select')
      .off('change blur', '.cont-inline-note')
      .off('click', '#vehicle-picker-clear-btn')
      .off('change', '#nid_khach_hang-input');

    function applyDropdownData(cache) {
      cache = cache || {};
      state.customers = cache.customers || [];
      state.drivers = cache.drivers || [];
      state.vehicles = cache.vehicles || [];
      state.vehicleMap = {};
      for (var i = 0; i < state.vehicles.length; i++) {
        state.vehicleMap[String(state.vehicles[i].nid)] = state.vehicles[i];
      }
      state.moocs = [];
      state.moocMap = {};
      for (var m = 0; m < state.vehicles.length; m++) {
        if (String(state.vehicles[m].loai_phuong_tien || '').toLowerCase().indexOf('mooc') !== -1) {
          state.moocs.push(state.vehicles[m]);
          state.moocMap[String(state.vehicles[m].nid)] = state.vehicles[m];
        }
      }
      state.diaDiem = $.extend({ bai: [], cang: [], kho: [] }, cache.diaDiem || {});

      var html = '<option value="0">— Chọn —</option>';
      for (var j = 0; j < state.customers.length; j++) {
        html += '<option value="' + state.customers[j].nid + '">' + escHtml(state.customers[j].ten || ('#' + state.customers[j].nid)) + '</option>';
      }
      $form('#nid_khach_hang-input').html(html);
    }

    function showLoading(show) {
      $form('#form-loading').toggle(show);
      $form('#save-btn, #add-line-btn, #reset-lines-btn, #complete-plan-btn').prop('disabled', show);
      if (useTableLayout) {
        $form('#ke-hoach-fullscreen-modal').find('input, select, button').not('.btn-close').prop('disabled', show);
      }
    }

    function nextLineKey() {
      lineSeq += 1;
      return 'line-' + lineSeq;
    }

    function findLine(key) {
      for (var i = 0; i < state.lines.length; i++) {
        if (state.lines[i].key === key) return state.lines[i];
      }
      return null;
    }

    function createLine(source) {
      return $.extend({
        key: nextLineKey(),
        nid_khach_hang: 0,
        nid_phuong_tien: 0,
        nid_mooc: 0,
        mooc: null,
        nid_lai_xe: 0,
        so_bkg: '',
        dia_chi_kho: '',
        loai_cont: '',
        so_cont: '',
        so_seal_chinh: '',
        so_seal_tam: '',
        bai_lay_cont: '',
        bai_lay_thuc_te: '',
        bai_ha_cont: '',
        bai_ha_thuc_te: '',
        cang_xuat: '',
        cut_off: '',
        ghi_chu: '',
        hinh_thuc_van_tai: '',
        ke_hoach_cont_ref_nid: 0,
        da_cat_mooc: 0,
        da_du_hang: 0,
        ha_bai_ngoai: 0,
        ha_cang: 0
      }, source || {});
    }

    function findDriver(id) {
      id = parseInt(id, 10) || 0;
      for (var i = 0; i < state.drivers.length; i++) {
        if ((parseInt(state.drivers[i].nid, 10) || 0) === id) return state.drivers[i];
      }
      return null;
    }

    function buildTagOptions(list, value) {
      var html = '<option value="">— Chọn —</option>';
      var seen = {};
      value = value || '';
      for (var i = 0; i < list.length; i++) {
        if (seen[list[i]]) continue;
        seen[list[i]] = true;
        html += '<option value="' + escHtml(list[i]) + '"' + (list[i] === value ? ' selected' : '') + '>' + escHtml(list[i]) + '</option>';
      }
      if (value && !seen[value]) {
        html += '<option value="' + escHtml(value) + '" selected>' + escHtml(value) + '</option>';
      }
      return html;
    }

    function vehicleSummaryText(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      if (!vehicle) {
        return '';
      }
      var mooc = state.moocMap[String(line.nid_mooc || 0)] || vehicle.mooc || null;
      var parts = [];
      if (vehicle.bks) parts.push(vehicle.bks);
      if (mooc && mooc.bks) parts.push(mooc.bks);
      if (vehicle.lai_xe && vehicle.lai_xe.ten) parts.push(vehicle.lai_xe.ten);
      return parts.join(' - ');
    }

    function vehicleOnlyText(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      if (!vehicle) return '';
      var text = vehicle.bks || '';
      if (vehicle.ma_tai_san) text += ' - ' + vehicle.ma_tai_san;
      return text;
    }

    function vehicleSummaryCardHtml(line) {
      var text = vehicleOnlyText(line);
      if (!text) {
        return '<span class="vehicle-inline-placeholder">Chọn phương tiện</span>';
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function moocSummaryText(line) {
      var mooc = line && line.mooc ? line.mooc : (state.moocMap[String(line.nid_mooc || 0)] || null);
      if (!mooc) return '';
      var text = mooc.bks || '';
      if (mooc.ma_tai_san) text += ' - ' + mooc.ma_tai_san;
      return text;
    }

    function moocSummaryHtml(line) {
      var text = moocSummaryText(line);
      if (!text) {
        return '<span class="vehicle-inline-placeholder">Chọn mooc</span>';
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function findMoocById(id) {
      id = parseInt(id, 10) || 0;
      if (!id) return null;
      if (state.moocMap[String(id)]) return state.moocMap[String(id)];
      for (var i = 0; i < state.moocs.length; i++) {
        if ((parseInt(state.moocs[i].nid, 10) || 0) === id) return state.moocs[i];
      }
      for (var j = 0; j < state.vehicles.length; j++) {
        if ((parseInt(state.vehicles[j].nid, 10) || 0) === id) return state.vehicles[j];
      }
      return null;
    }

    function buildDriverOptions(selectedId) {
      var html = '<option></option>';
      for (var i = 0; i < state.drivers.length; i++) {
        var item = state.drivers[i];
        html += '<option value="' + item.nid + '"' + ((parseInt(selectedId, 10) === parseInt(item.nid, 10)) ? ' selected' : '') + '>' + escHtml(item.ten || ('#' + item.nid)) + '</option>';
      }
      return html;
    }

    function buildCustomerOptions(selectedId) {
      var html = '<option></option>';
      for (var i = 0; i < state.customers.length; i++) {
        var item = state.customers[i];
        html += '<option value="' + item.nid + '"' + ((parseInt(selectedId, 10) === parseInt(item.nid, 10)) ? ' selected' : '') + '>' + escHtml(item.ten || ('#' + item.nid)) + '</option>';
      }
      return html;
    }

    function buildMoocOptions(selectedId) {
      var html = '<option value="0">— Chọn mooc —</option>';
      for (var i = 0; i < state.moocs.length; i++) {
        var item = state.moocs[i];
        var label = item.bks || ('#' + item.nid);
        if (item.ma_tai_san) label += ' - ' + item.ma_tai_san;
        html += '<option value="' + item.nid + '"' + ((parseInt(selectedId, 10) === parseInt(item.nid, 10)) ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      }
      return html;
    }

    function buildHinhThucRadios(line) {
      var html = '';
      $.each(HINH_THUC_MAP, function (key, label) {
        var checked = key === (line.hinh_thuc_van_tai || '') ? ' checked' : '';
        html += '<label class="form-check form-check-inline line-hinh-thuc-option">' +
          '<input class="form-check-input line-hinh-thuc-radio" type="radio" name="line-hinh-thuc-' + escHtml(line.key) + '" value="' + key + '" data-current="' + (checked ? '1' : '0') + '"' + checked + '>' +
          '<span class="form-check-label">' + escHtml(label) + '</span>' +
        '</label>';
      });
      return html;
    }

    function vehicleSummaryHtml(line) {
      var text = vehicleOnlyText(line);
      if (!text) {
        return '<span class="vehicle-inline-placeholder">Chọn phương tiện</span>';
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function vehicleSummaryTableHtml(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      if (!vehicle) {
        return '<span class="vehicle-inline-placeholder">Chọn PT</span>';
      }
      var text = vehicle.bks || '';
      if (vehicle.lai_xe && vehicle.lai_xe.ten) {
        text += ' - ' + vehicle.lai_xe.ten;
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function initRowUi($row, line) {
      var dropdownParent = formDropdownParent();
      initSelect2($row.find('.line-customer-select')[0], 'Chọn khách hàng', { dropdownParent: dropdownParent });
      initSelect2($row.find('.line-loai-cont-select')[0], 'Loại cont', { tags: true, dropdownParent: dropdownParent });
      initSelect2($row.find('.line-kho-select')[0], '— Chọn địa chỉ kho —', { tags: true, dropdownParent: dropdownParent });
      initSelect2($row.find('.line-bai-lay-select')[0], '— Chọn bãi lấy —', { dropdownParent: dropdownParent });
      initSelect2($row.find('.line-bai-ha-select')[0], '— Chọn bãi hạ —', { dropdownParent: dropdownParent });
      initSelect2($row.find('.line-cang-select')[0], '— Chọn cảng xuất —', { dropdownParent: dropdownParent });
      if (typeof flatpickr !== 'undefined' && $row.find('.line-cut-off-input')[0]) {
        flatpickr($row.find('.line-cut-off-input')[0], {
          enableTime: true,
          dateFormat: 'd/m/Y H:i',
          time_24hr: true,
          allowInput: true,
          static: false,
          appendTo: document.body
        });
      }
      $row.find('.line-vehicle-display').toggleClass('is-selected', !!line.nid_phuong_tien).html(vehicleSummaryTableHtml(line));
      $row.find('.line-mooc-display').toggleClass('is-selected', !!line.nid_mooc).html(moocSummaryHtml(line));
    }

    function initCardUi($card, line) {
      initSelect2($card.find('#nid_khach_hang-input')[0], '— Chọn khách hàng —');
      initSelect2($card.find('.line-driver-select')[0], '— Chọn lái xe —');
      initSelect2($card.find('.line-kho-select')[0], '— Chọn địa chỉ kho —', { tags: true });
      initSelect2($card.find('.line-loai-cont-select')[0], 'Loại cont', { tags: true });
      initSelect2($card.find('.line-bai-lay-select')[0], '— Chọn bãi lấy —');
      initSelect2($card.find('.line-bai-ha-select')[0], '— Chọn bãi hạ —');
      initSelect2($card.find('.line-bai-lay-thuc-te-select')[0], '— Theo bãi lấy kế hoạch —', { tags: true });
      initSelect2($card.find('.line-bai-ha-thuc-te-select')[0], '— Theo bãi hạ kế hoạch —', { tags: true });
      initSelect2($card.find('.line-cang-select')[0], '— Chọn cảng xuất —');
      if (typeof flatpickr !== 'undefined' && $card.find('.line-cut-off-input')[0]) {
        flatpickr($card.find('.line-cut-off-input')[0], {
          enableTime: true,
          dateFormat: 'd/m/Y H:i',
          time_24hr: true,
          allowInput: true,
          static: false,
          appendTo: document.body
        });
      }
      $card.find('.vehicle-summary').toggleClass('is-selected', !!line.nid_phuong_tien).html(vehicleSummaryCardHtml(line));
      $card.find('.line-mooc-display').toggleClass('is-selected', !!line.nid_mooc).html(moocSummaryHtml(line));
      loadContCandidates(line, $card);
    }

    function renderCards() {
      var html = '';
      var pickerHtml = '';
      for (var i = 0; i < state.lines.length; i++) {
        var line = state.lines[i];
        html += '' +
          '<div class="ke-hoach-line-card ke-hoach-line-section ke-hoach-line-section-primary" data-line-key="' + line.key + '">' +
              '<div class="ke-hoach-edit-grid">' +
              '<div class="khxh-span-4">' +
                '<label class="form-label">Khách hàng <span class="text-danger">*</span></label>' +
                '<select id="nid_khach_hang-input" class="form-select select2-searchable" style="width:100%" required>' +
                  buildCustomerOptions(line.nid_khach_hang || 0) +
                '</select>' +
                '<div class="invalid-feedback">Vui lòng chọn khách hàng</div>' +
              '</div>' +
              '<div class="khxh-span-4"><label class="form-label">Số booking/ bill <span class="text-danger">*</span></label><input type="text" id="so_bkg-input" class="form-control" value="' + escHtml(line.so_bkg || '') + '" placeholder="Số booking/ bill" required><div class="invalid-feedback">Vui lòng nhập số booking/ bill</div></div>' +
              '<div class="khxh-span-4"><label class="form-label">Cut-off</label><input type="text" class="form-control line-cut-off-input" value="' + escHtml(apiToDatetime(line.cut_off || '')) + '" placeholder="dd/mm/yyyy HH:MM"></div>' +
              '<div class="khxh-span-4"><label class="form-label">Bãi lấy</label><select class="form-select line-bai-lay-select">' + buildTagOptions(state.diaDiem.bai, line.bai_lay_cont) + '</select></div>' +
              '<div class="khxh-span-4"><label class="form-label">Bãi hạ</label><select class="form-select line-bai-ha-select">' + buildTagOptions(state.diaDiem.bai, line.bai_ha_cont) + '</select></div>' +
              '<div class="khxh-span-4"><label class="form-label">Cảng xuất</label><select class="form-select line-cang-select">' + buildTagOptions(state.diaDiem.cang, line.cang_xuat) + '</select></div>' +
              '<div class="khxh-span-4"><label class="form-label">Địa chỉ đóng/ trả hàng (Kho) <span class="text-danger">*</span></label><select class="form-select line-kho-select">' + buildTagOptions(state.cauHinh.diaChiKho, line.dia_chi_kho) + '</select></div>' +
              '<div class="khxh-span-3"><label class="form-label">Loại cont</label><select class="form-select line-loai-cont-select">' + buildTagOptions(state.cauHinh.loaiCont, line.loai_cont) + '</select></div>' +
              '<div class="khxh-span-3"><label class="form-label">Số cont</label><input type="text" class="form-control line-so-cont-input" value="' + escHtml(line.so_cont || '') + '" placeholder="Số cont"></div>' +
              '<div class="khxh-span-3"><label class="form-label">Seal phụ</label><input type="text" class="form-control line-seal-tam-input" value="' + escHtml(line.so_seal_tam || '') + '" placeholder="Seal phụ"></div>' +
              '<div class="khxh-span-3"><label class="form-label">Seal chính</label><input type="text" class="form-control line-seal-chinh-input" value="' + escHtml(line.so_seal_chinh || '') + '" placeholder="Seal chính"></div>' +
              '<div class="khxh-span-4"><label class="form-label">Bãi lấy thực tế</label><select class="form-select line-bai-lay-thuc-te-select">' + buildTagOptions(state.diaDiem.bai, line.bai_lay_thuc_te) + '</select></div>' +
              '<div class="khxh-span-4"><label class="form-label">Bãi hạ thực tế</label><select class="form-select line-bai-ha-thuc-te-select">' + buildTagOptions(state.diaDiem.bai, line.bai_ha_thuc_te) + '</select></div>' +
              '<div class="khxh-span-4">' +
                '<label class="form-label">Phương tiện</label>' +
                '<input type="hidden" class="line-vehicle-id" value="' + (line.nid_phuong_tien || 0) + '">' +
                '<button type="button" class="btn btn-outline-secondary w-100 text-start vehicle-summary btn-open-vehicle-modal' + (line.nid_phuong_tien ? ' is-selected' : '') + '"></button>' +
                '<div class="invalid-feedback d-block line-vehicle-feedback" style="display:none !important;">Vui lòng chọn phương tiện</div>' +
              '</div>' +
              '<div class="khxh-span-4"><label class="form-label">Lái xe</label><select class="form-select line-driver-select">' + buildDriverOptions(line.nid_lai_xe) + '</select></div>' +
              '<div class="khxh-span-4">' +
                '<label class="form-label">Mooc</label>' +
                '<input type="hidden" class="line-mooc-id" value="' + (line.nid_mooc || 0) + '">' +
                '<button type="button" class="btn btn-outline-secondary w-100 text-start line-mooc-display btn-open-mooc-modal' + (line.nid_mooc ? ' is-selected' : '') + '">' + moocSummaryHtml(line) + '</button>' +
              '</div>' +
              '<div class="khxh-span-4"><label class="form-label">Ghi chú</label><input type="text" class="form-control line-ghi-chu-input" value="' + escHtml(line.ghi_chu || '') + '" placeholder="Ghi chú"></div>' +
              '<div class="khxh-span-8"><label class="form-label d-block">Hình thức vận tải</label><div class="line-hinh-thuc-group">' + buildHinhThucRadios(line) + '</div></div>' +
              '</div>' +
          '</div>';
        pickerHtml += '' +
            '<div class="line-cont-picker-wrap" data-line-key="' + line.key + '" style="display:none;">' +
              '<div class="ke-hoach-cont-picker-head">' +
                '<div>' +
                  '<label class="form-label d-block mb-1">Chọn cont kéo về</label>' +
                '</div>' +
              '</div>' +
                '<div class="row line-cont-filter-row mb-2">' +
                  '<div class="col-md-3"><input type="text" class="form-control line-cont-filter-bkg" placeholder="Tìm theo số BKG"></div>' +
                  '<div class="col-md-3"><input type="text" class="form-control line-cont-filter-cont" placeholder="Tìm theo số cont"></div>' +
                  '<div class="col-md-4"><select class="form-select line-cont-filter-kho">' + buildTagOptions(state.diaDiem.kho, '') + '</select></div>' +
                  '<div class="col-md-2"><select class="form-select line-cont-filter-du-hang"><option value="">Trạng thái</option><option value="1">Đã đủ</option><option value="0">Chưa đủ</option></select></div>' +
                '</div>' +
                '<div class="table-responsive">' +
                  '<table class="table table-bordered table-sm mb-0">' +
                    '<thead><tr><th></th><th>Xe kéo lên</th><th>Booking / Cont</th><th>Địa chỉ đóng/ trả hàng (Kho)</th><th>Bãi hạ</th><th>Đủ hàng</th><th>Ghi chú</th></tr></thead>' +
                    '<tbody class="line-cont-picker-body"><tr><td colspan="7" class="text-center text-muted">Chưa có dữ liệu</td></tr></tbody>' +
                  '</table>' +
                '</div>' +
            '</div>';
      }
      $form('#ke-hoach-lines').html(html);
      if (!$form('#ke-hoach-cont-pickers').length) {
        $form('#ke-hoach-lines').after('<div id="ke-hoach-cont-pickers"></div>');
      }
      $form('#ke-hoach-cont-pickers').html(pickerHtml);
      $form('#ke-hoach-lines .ke-hoach-line-card').each(function () {
        var $card = $(this);
        var line = findLine($card.data('line-key'));
        if (line) initCardUi($card, line);
      });
    }

    function buildTableRow(line, index) {
      var actionCopy = mode === 'edit' ? '<span class="text-muted">-</span>' : '<button type="button" class="btn btn-sm btn-icon btn-label-secondary btn-copy-row-ke-hoach" title="Sao chép dòng"><i class="ti tabler-copy"></i></button>';
      var actionRemove = mode === 'edit' ? '<span class="text-muted">-</span>' : '<button type="button" class="btn btn-sm btn-icon btn-label-danger btn-remove-row-ke-hoach" title="Xoá dòng"><i class="ti tabler-trash"></i></button>';
      var hinhThucOptions = '<option value="">H.Thức VT</option>';
      $.each(HINH_THUC_MAP, function (key, label) {
        hinhThucOptions += '<option value="' + key + '"' + (line.hinh_thuc_van_tai === key ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      });
      return '' +
        '<tr class="ke-hoach-table-row" data-line-key="' + line.key + '">' +
          '<td><select class="form-select line-customer-select">' + buildCustomerOptions(line.nid_khach_hang || 0) + '</select><div class="line-customer-feedback text-danger small mt-1" style="display:none;">Vui lòng chọn khách hàng</div></td>' +
          '<td><input type="text" class="form-control line-so-bkg-input" value="' + escHtml(line.so_bkg || '') + '" placeholder="Số BKG"></td>' +
          '<td>' +
            '<input type="hidden" class="line-vehicle-id" value="' + (line.nid_phuong_tien || 0) + '">' +
            '<button type="button" class="btn btn-outline-secondary w-100 text-start line-vehicle-display btn-open-vehicle-modal' + (line.nid_phuong_tien ? ' is-selected' : '') + '">' + vehicleSummaryTableHtml(line) + '</button>' +
            '<input type="hidden" class="line-mooc-id" value="' + (line.nid_mooc || 0) + '">' +
            '<button type="button" class="btn btn-outline-secondary w-100 text-start line-mooc-display btn-open-mooc-modal mt-2' + (line.nid_mooc ? ' is-selected' : '') + '">' + moocSummaryHtml(line) + '</button>' +
          '</td>' +
          '<td class="line-combo-cell">' +
            '<select class="form-select line-loai-cont-select mb-2">' + buildTagOptions(state.cauHinh.loaiCont, line.loai_cont) + '</select>' +
            '<input type="text" class="form-control line-so-cont-input" value="' + escHtml(line.so_cont || '') + '" placeholder="Số cont">' +
          '</td>' +
          '<td class="line-combo-cell">' +
            '<input type="text" class="form-control line-seal-tam-input mb-2" value="' + escHtml(line.so_seal_tam || '') + '" placeholder="Số seal tạm">' +
            '<input type="text" class="form-control line-seal-chinh-input" value="' + escHtml(line.so_seal_chinh || '') + '" placeholder="Số seal chính">' +
          '</td>' +
          '<td class="line-combo-cell">' +
            '<select class="form-select line-kho-select mb-2">' + buildTagOptions(state.cauHinh.diaChiKho, line.dia_chi_kho) + '</select>' +
            '<select class="form-select line-cang-select">' + buildTagOptions(state.diaDiem.cang, line.cang_xuat) + '</select>' +
          '</td>' +
          '<td class="line-combo-cell">' +
            '<select class="form-select line-bai-lay-select mb-2">' + buildTagOptions(state.diaDiem.bai, line.bai_lay_cont) + '</select>' +
            '<select class="form-select line-bai-ha-select">' + buildTagOptions(state.diaDiem.bai, line.bai_ha_cont) + '</select>' +
          '</td>' +
          '<td class="line-combo-cell">' +
            '<input type="text" class="form-control line-cut-off-input mb-2" value="' + escHtml(apiToDatetime(line.cut_off || '')) + '" placeholder="dd/mm/yyyy HH:MM">' +
            '<select class="form-select line-hinh-thuc-select">' + hinhThucOptions + '</select>' +
          '</td>' +
          '<td class="text-center">' + actionCopy + '</td>' +
          '<td class="text-center">' + actionRemove + '</td>' +
        '</tr>';
    }

    function renderRows() {
      if (!useTableLayout) {
        renderCards();
        return;
      }
      var html = '';
      for (var i = 0; i < state.lines.length; i++) {
        html += buildTableRow(state.lines[i], i);
      }
      $form('#ke-hoach-lines-body').html(html);
      $form('#ke-hoach-lines-body .ke-hoach-table-row').each(function () {
        var $row = $(this);
        var line = findLine($row.data('line-key'));
        if (line) initRowUi($row, line);
      });
    }

    function syncLine($row) {
      var line = findLine($row.data('line-key'));
      if (!line) return null;
      if (!useTableLayout) {
        line.nid_khach_hang = parseInt($form('#nid_khach_hang-input').val(), 10) || 0;
        line.nid_phuong_tien = parseInt($row.find('.line-vehicle-id').val(), 10) || 0;
        line.nid_mooc = parseInt($row.find('.line-mooc-id').val(), 10) || 0;
        if (line.nid_mooc && (!line.mooc || parseInt(line.mooc.nid, 10) !== line.nid_mooc)) {
          line.mooc = state.moocMap[String(line.nid_mooc)] || line.mooc || null;
        }
        if (!line.nid_mooc) {
          line.mooc = null;
        }
        line.nid_lai_xe = parseInt($row.find('.line-driver-select').val(), 10) || 0;
        line.so_bkg = $form('#so_bkg-input').val().trim();
        line.so_cont = $row.find('.line-so-cont-input').val().trim();
        line.loai_cont = ($row.find('.line-loai-cont-select').val() || '').trim();
        line.so_seal_chinh = $row.find('.line-seal-chinh-input').val().trim();
        line.so_seal_tam = $row.find('.line-seal-tam-input').val().trim();
        line.dia_chi_kho = ($row.find('.line-kho-select').val() || '').trim();
        line.bai_lay_cont = ($row.find('.line-bai-lay-select').val() || '').trim();
        line.bai_lay_thuc_te = ($row.find('.line-bai-lay-thuc-te-select').val() || '').trim();
        line.bai_ha_cont = ($row.find('.line-bai-ha-select').val() || '').trim();
        line.cang_xuat = ($row.find('.line-cang-select').val() || '').trim();
        line.bai_ha_thuc_te = ($row.find('.line-bai-ha-thuc-te-select').val() || '').trim();
        line.cut_off = datetimeToApi($row.find('.line-cut-off-input').val().trim());
        line.ghi_chu = ($row.find('.line-ghi-chu-input').val() || '').trim();
        line.hinh_thuc_van_tai = ($row.find('.line-hinh-thuc-radio:checked').val() || '').trim();
        line.da_cat_mooc = (line.hinh_thuc_van_tai === 'cat_keo' || line.hinh_thuc_van_tai === 'cat_keo_cheo' || line.hinh_thuc_van_tai === 'tha_mooc') ? 1 : 0;
        if (line.hinh_thuc_van_tai === 'dong_hang_trong_ngay') {
          line.da_du_hang = 1;
        }
        return line;
      }
      line.nid_khach_hang = parseInt($row.find('.line-customer-select').val(), 10) || 0;
      line.nid_phuong_tien = parseInt($row.find('.line-vehicle-id').val(), 10) || 0;
      line.nid_mooc = parseInt($row.find('.line-mooc-id').val(), 10) || 0;
      if (line.nid_mooc && (!line.mooc || parseInt(line.mooc.nid, 10) !== line.nid_mooc)) {
        line.mooc = findMoocById(line.nid_mooc);
      }
      if (!line.nid_mooc) {
        line.mooc = null;
      }
      line.so_bkg = $row.find('.line-so-bkg-input').val().trim();
      line.so_cont = $row.find('.line-so-cont-input').val().trim();
      line.loai_cont = ($row.find('.line-loai-cont-select').val() || '').trim();
      line.so_seal_chinh = $row.find('.line-seal-chinh-input').val().trim();
      line.so_seal_tam = $row.find('.line-seal-tam-input').val().trim();
      line.dia_chi_kho = ($row.find('.line-kho-select').val() || '').trim();
      line.bai_lay_cont = ($row.find('.line-bai-lay-select').val() || '').trim();
      line.bai_ha_cont = ($row.find('.line-bai-ha-select').val() || '').trim();
      line.bai_ha_thuc_te = normalizeBaiHaThucTe(($row.find('.line-bai-ha-thuc-te-select').val() || '').trim(), line.bai_ha_cont);
      line.hinh_thuc_van_tai = ($row.find('.line-hinh-thuc-select').val() || '').trim();
      line.cang_xuat = ($row.find('.line-cang-select').val() || '').trim();
      line.cut_off = datetimeToApi($row.find('.line-cut-off-input').val().trim());
      line.ghi_chu = ($row.find('.line-ghi-chu-input').val() || '').trim();
      return line;
    }

    function syncAllLines() {
      var selector = useTableLayout ? '#ke-hoach-lines-body .ke-hoach-table-row' : '#ke-hoach-lines .ke-hoach-line-card';
      $form(selector).each(function () {
        syncLine($(this));
      });
    }

    function refreshLineSources() {
      syncAllLines();
      renderRows();
    }

    function addLine(source) {
      var line = createLine(source);
      state.lines.push(line);
      renderRows();
    }

    function resetAllLines() {
      state.lines = [];
      addLine({});
    }

    function openVehicleModal(key) {
      activePickerType = 'vehicle';
      openPickerModal(key);
    }

    function openMoocModal(key) {
      activePickerType = 'mooc';
      openPickerModal(key);
    }

    function openPickerModal(key) {
      state.activeLineKey = key;
      var lineIndex = $form('#ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + key + '"]').index() + 1;
      if (!useTableLayout) {
        lineIndex = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]').index() + 1;
      }
      if (activePickerType === 'mooc') {
        $('#vehicle-picker-target').text('Đang chọn mooc cho dòng #' + lineIndex);
        $('#vehicle-picker-modal .modal-title').text('Chọn mooc');
        $('#vehicle-picker-col-bks').text('Biển số');
        $('#vehicle-picker-col-type').text('Loại xe');
        $('#vehicle-picker-col-extra').text('Mã tài sản');
      } else {
        $('#vehicle-picker-target').text('Đang chọn phương tiện cho dòng #' + lineIndex);
        $('#vehicle-picker-modal .modal-title').text('Chọn phương tiện');
        $('#vehicle-picker-col-bks').text('Biển số');
        $('#vehicle-picker-col-type').text('Loại xe');
        $('#vehicle-picker-col-extra').text('Lái xe hiện tại');
      }
      $form('#vehicle-picker-search').val('');
      renderVehicleTable('');
      if (!vehicleModal) vehicleModal = new bootstrap.Modal(document.getElementById('vehicle-picker-modal'));
      vehicleModal.show();
    }

    function renderVehicleTable(keyword) {
      keyword = (keyword || '').toLowerCase();
      var activeLine = findLine(state.activeLineKey);
      var html = '';
      var sourceItems = activePickerType === 'mooc' ? state.moocs : state.vehicles;
      if (activePickerType === 'mooc' && (!sourceItems || !sourceItems.length)) {
        sourceItems = $.grep(state.vehicles, function (item) {
          return String(item.loai_phuong_tien || '').toLowerCase().indexOf('mooc') !== -1;
        });
      }
      for (var i = 0; i < sourceItems.length; i++) {
        var item = sourceItems[i];
        if (activePickerType === 'vehicle' && item.loai_phuong_tien !== 'dau_keo') continue;
        var driverText = item.lai_xe && item.lai_xe.ten ? item.lai_xe.ten + (item.lai_xe.sdt ? ' - ' + item.lai_xe.sdt : '') : 'Chưa gán lái xe';
        var metaText = item.ma_tai_san || item.hang_xe || item.loai_phuong_tien || '';
        var haystack = [item.bks, metaText, item.loai_phuong_tien, item.hang_xe, driverText].join(' ').toLowerCase();
        if (keyword && haystack.indexOf(keyword) === -1) continue;
        var checked = activeLine && (activePickerType === 'mooc'
          ? parseInt(activeLine.nid_mooc, 10) === parseInt(item.nid, 10)
          : parseInt(activeLine.nid_phuong_tien, 10) === parseInt(item.nid, 10));
        html += '<tr>' +
          '<td class="text-center"><input type="radio" name="vehicle-picker-radio" value="' + item.nid + '"' + (checked ? ' checked' : '') + '></td>' +
          '<td><strong>' + escHtml(item.bks || ('#' + item.nid)) + '</strong><div class="text-muted small">' + escHtml(item.ma_tai_san || '') + '</div></td>' +
          '<td><span class="badge bg-label-warning">' + escHtml(item.loai_phuong_tien || 'Chưa phân loại') + '</span></td>' +
          '<td><div>' + escHtml(activePickerType === 'mooc' ? (item.ma_tai_san || 'Chưa có mã tài sản') : (item.lai_xe && item.lai_xe.ten ? item.lai_xe.ten : 'Chưa gán lái xe')) + '</div><div class="vehicle-picker-driver">' + escHtml(activePickerType === 'mooc' ? '' : (item.lai_xe && item.lai_xe.sdt ? item.lai_xe.sdt : '')) + '</div></td>' +
          '<td class="text-center"><button type="button" class="btn btn-sm btn-primary btn-pick-vehicle" data-id="' + item.nid + '">Chọn</button></td>' +
          '</tr>';
      }
      if (!html) html = '<tr><td colspan="5" class="text-center text-muted py-4">Không tìm thấy ' + (activePickerType === 'mooc' ? 'mooc' : 'phương tiện') + ' phù hợp</td></tr>';
      $('#vehicle-picker-body').html(html);
    }

    function selectVehicleForLine(vehicleId) {
      var line = findLine(state.activeLineKey);
      if (!line) return;
      if (activePickerType === 'mooc') {
        var mooc = findMoocById(vehicleId);
        line.nid_mooc = mooc ? parseInt(mooc.nid, 10) || 0 : 0;
        line.mooc = mooc || null;
      } else {
        var vehicle = state.vehicleMap[String(vehicleId)] || null;
        line.nid_phuong_tien = vehicle ? parseInt(vehicle.nid, 10) || 0 : 0;
        line.nid_lai_xe = vehicle && vehicle.lai_xe && vehicle.lai_xe.nid ? parseInt(vehicle.lai_xe.nid, 10) || 0 : 0;
      }
      if (useTableLayout) {
        var $row = $form('#ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + line.key + '"]');
        if (activePickerType === 'vehicle') {
          $row.find('.line-vehicle-id').val(line.nid_phuong_tien || 0);
          $row.find('.line-vehicle-display').addClass('is-selected').html(vehicleSummaryTableHtml(line));
        } else {
          $row.find('.line-mooc-id').val(line.nid_mooc || 0);
          if (line.nid_mooc) {
            $row.find('.line-mooc-display').addClass('is-selected').html('<span class="vehicle-inline-text">' + escHtml(moocSummaryText(line)) + '</span>');
          } else {
            $row.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
          }
        }
        $row.removeClass('table-danger');
        $row.find('.line-customer-feedback').hide();
      }
      else {
        var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + line.key + '"]');
        if (activePickerType === 'mooc') {
          $card.find('.line-mooc-id').val(line.nid_mooc || 0);
          if (line.nid_mooc) {
            var moocText = moocSummaryText(line);
            $card.find('.line-mooc-display').addClass('is-selected').html('<span class="vehicle-inline-text">' + escHtml(moocText) + '</span>');
          } else {
            $card.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
          }
        } else {
          $card.find('.line-vehicle-id').val(line.nid_phuong_tien || 0);
          $card.find('.line-driver-select').val(line.nid_lai_xe || '').trigger('change');
        }
        $card.find('.vehicle-summary').addClass('is-selected').html(vehicleSummaryCardHtml(line));
        $card.find('.line-vehicle-feedback').hide();
        $card.removeClass('line-card-invalid');
      }
      if (vehicleModal) vehicleModal.hide();
    }

    function clearVehicleForActiveLine() {
      var line = findLine(state.activeLineKey);
      if (!line) return;
      if (activePickerType === 'mooc') {
        line.nid_mooc = 0;
        line.mooc = null;
      } else {
        line.nid_phuong_tien = 0;
        line.nid_lai_xe = 0;
      }

      if (useTableLayout) {
        var $row = $form('#ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + line.key + '"]');
        if (activePickerType === 'vehicle') {
          $row.find('.line-vehicle-id').val(0);
          $row.find('.line-vehicle-display').removeClass('is-selected').html(vehicleSummaryTableHtml(line));
        } else {
          $row.find('.line-mooc-id').val(0);
          $row.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
        }
      }
      else {
        var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + line.key + '"]');
        if (activePickerType === 'mooc') {
          $card.find('.line-mooc-id').val(0);
          $card.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
        } else {
          $card.find('.line-vehicle-id').val(0);
          $card.find('.line-driver-select').val('').trigger('change');
        }
        $card.find('.vehicle-summary').removeClass('is-selected').html(vehicleSummaryCardHtml(line));
      }

      if (vehicleModal) vehicleModal.hide();
    }

    function shouldShowContPicker(hinhThuc) {
      return hinhThuc === 'cat_keo' || hinhThuc === 'cat_keo_cheo' || hinhThuc === 'rut_mooc';
    }

    function getContPicker($card) {
      var key = $card && $card.length ? $card.data('line-key') : '';
      var $picker = key ? $form('#ke-hoach-cont-pickers .line-cont-picker-wrap[data-line-key="' + key + '"]') : $();
      return $picker.length ? $picker : $card.find('.line-cont-picker-wrap');
    }

    function renderContPickerLoading($card, message) {
      var $wrap = getContPicker($card);
      var $body = $wrap.find('.line-cont-picker-body');
      $wrap.addClass('is-loading');
      $body.html(
        '<tr>' +
          '<td colspan="7" class="text-center py-4">' +
            '<div class="cont-picker-loading">' +
              '<div class="spinner-border spinner-border-sm text-primary" role="status">' +
                '<span class="visually-hidden">Đang tải...</span>' +
              '</div>' +
              '<span>' + escHtml(message || 'Đang tải danh sách cont...') + '</span>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }

    function clearContPickerLoading($card) {
      getContPicker($card).removeClass('is-loading');
    }

    function loadContCandidates(line, $card) {
      var hinhThuc = line.hinh_thuc_van_tai || '';
      var $wrap = getContPicker($card);
      var $body = $wrap.find('.line-cont-picker-body');
      if (!shouldShowContPicker(hinhThuc)) {
        clearContPickerLoading($card);
        $wrap.hide();
        $body.html('<tr><td colspan="7" class="text-center text-muted">Không áp dụng cho hình thức này</td></tr>');
        return;
      }
      $wrap.show();
      var currentNid = parseInt($form('#nid-input').val(), 10) || 0;
      var cacheKey = [currentPlanType(), hinhThuc, line.dia_chi_kho || '', currentNid].join('||');
      if (state.contCandidateCache[cacheKey]) {
        clearContPickerLoading($card);
        $card.data('contCandidates', state.contCandidateCache[cacheKey]);
        $card.data('contCandidatesCacheKey', cacheKey);
        $card.data('contCandidatesLoaded', true);
        renderContCandidateRows(line, $card);
        return;
      }
      if (state.contCandidatePending[cacheKey]) {
        renderContPickerLoading($card, 'Đang tải danh sách cont...');
        state.contCandidatePending[cacheKey].push($card);
        return;
      }
      var requestData = {
        da_cat_mooc: 1,
        loai_ke_hoach: currentPlanType(),
        available_keo_ve_for: currentNid
      };
      if (currentNid) {
        requestData.exclude_nid = currentNid;
      }
      if (hinhThuc === 'cat_keo') {
        requestData.dia_chi_kho = line.dia_chi_kho || '';
      }
      renderContPickerLoading($card, 'Đang tải danh sách cont...');
      state.contCandidatePending[cacheKey] = [$card];
      $.ajax({
        url: '/api/quan-ly-cont',
        type: 'GET',
        dataType: 'json',
        data: requestData,
        success: function (res) {
          var waitingCards = state.contCandidatePending[cacheKey] || [];
          if (res.status !== 'success' || !res.data || !res.data.items) {
            for (var i = 0; i < waitingCards.length; i++) {
              clearContPickerLoading(waitingCards[i]);
              getContPicker(waitingCards[i]).find('.line-cont-picker-body').html('<tr><td colspan="7" class="text-center text-danger">Không tải được danh sách cont</td></tr>');
            }
            return;
          }
          state.contCandidateCache[cacheKey] = res.data.items || [];
          for (var j = 0; j < waitingCards.length; j++) {
            var $waitingCard = waitingCards[j];
            var waitingLine = syncLine($waitingCard);
            clearContPickerLoading($waitingCard);
            $waitingCard.data('contCandidates', res.data.items || []);
            $waitingCard.data('contCandidatesCacheKey', cacheKey);
            $waitingCard.data('contCandidatesLoaded', true);
            renderContCandidateRows(waitingLine, $waitingCard);
          }
        },
        error: function () {
          var waitingCards = state.contCandidatePending[cacheKey] || [];
          for (var i = 0; i < waitingCards.length; i++) {
            clearContPickerLoading(waitingCards[i]);
            getContPicker(waitingCards[i]).find('.line-cont-picker-body').html('<tr><td colspan="7" class="text-center text-danger">Không tải được danh sách cont</td></tr>');
          }
        },
        complete: function () {
          delete state.contCandidatePending[cacheKey];
        }
      });
    }

    function renderContCandidateRows(line, $card) {
      var hinhThuc = line.hinh_thuc_van_tai || '';
      var $picker = getContPicker($card);
      var $body = $picker.find('.line-cont-picker-body');
      var scrollTop = $picker.scrollTop();
      var bodyScrollTop = $formApp.closest('.modal-body').scrollTop();
      clearContPickerLoading($card);
      var items = $card.data('contCandidates') || [];
      var fBkg = ($picker.find('.line-cont-filter-bkg').val() || '').toLowerCase();
      var fCont = ($picker.find('.line-cont-filter-cont').val() || '').toLowerCase();
      var fKho = ($picker.find('.line-cont-filter-kho').val() || '').toLowerCase();
      var fDuHang = $picker.find('.line-cont-filter-du-hang').val();
      var rows = [];
      var candidates = [];
      var currentNid = parseInt($form('#nid-input').val(), 10) || 0;
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (parseInt(item.da_cat_mooc, 10) !== 1) continue;
        if (!item.so_cont || (parseInt(item.nid, 10) || 0) === currentNid) continue;
        if (hinhThuc === 'cat_keo' && item.dia_chi_kho !== line.dia_chi_kho) continue;
        if ((hinhThuc === 'cat_keo_cheo' || hinhThuc === 'rut_mooc') && item.dia_chi_kho === line.dia_chi_kho) continue;
        if (fBkg && String(item.so_bkg || '').toLowerCase().indexOf(fBkg) === -1) continue;
        if (fCont && String(item.so_cont || '').toLowerCase().indexOf(fCont) === -1) continue;
        if (fKho && String(item.dia_chi_kho || '').toLowerCase().indexOf(fKho) === -1) continue;
        if (fDuHang !== '' && parseInt(item.da_du_hang, 10) !== parseInt(fDuHang, 10)) continue;
        var selected = parseInt(line.ke_hoach_cont_ref_nid, 10) === parseInt(item.nid, 10);
        var usedBy = item.cont_keo_ve_by || null;
        var usedByNid = usedBy && usedBy.nid ? (parseInt(usedBy.nid, 10) || 0) : 0;
        if (!selected && usedByNid && usedByNid !== currentNid) continue;
        candidates.push({ item: item, selected: selected });
      }
      candidates.sort(function (a, b) {
        if (a.selected && !b.selected) return -1;
        if (!a.selected && b.selected) return 1;
        return (parseInt(b.item.nid, 10) || 0) - (parseInt(a.item.nid, 10) || 0);
      });
      for (var c = 0; c < candidates.length; c++) {
        var item = candidates[c].item;
        var selected = candidates[c].selected;
        var plannedBaiHa = item.bai_ha_cont || '';
        var actualBaiHa = normalizeBaiHaThucTe(item.bai_ha_thuc_te || '', plannedBaiHa);
        var destinationValue = actualBaiHa || plannedBaiHa;
        var theoKeHoach = !actualBaiHa;
        var duHang = parseInt(item.da_du_hang, 10) === 1;
        var khachHangName = (item.khach_hang && item.khach_hang.ten) || item.ten_khach_hang || item.khach_hang_ten || '';
        rows.push('<tr>' +
          '<td class="text-center"><input class="form-check-input line-cont-ref-checkbox" type="checkbox" value="' + item.nid + '" data-id="' + item.nid + '" data-so-cont="' + escHtml(item.so_cont || '') + '"' + (selected ? ' checked' : '') + '></td>' +
          '<td class="khxh-vehicle-cell">' + vehicleListInfoHtml(item) + '</td>' +
          '<td><div>' + escHtml(item.so_bkg || '') + '</div><div class="fw-semibold">' + escHtml(item.so_cont || '') + '</div></td>' +
          '<td class="line-cont-kho-cell"><div>' + escHtml(khachHangName) + '</div><div class="text-muted small">' + escHtml(item.dia_chi_kho || '') + '</div></td>' +
          '<td class="line-cont-destination-cell">' +
            '<label class="form-check form-check-inline mb-1">' +
              '<input class="form-check-input line-bai-ha-theo-ke-hoach-checkbox" type="checkbox" data-id="' + item.nid + '"' + (theoKeHoach ? ' checked' : '') + '>' +
              '<span class="form-check-label small">Hạ theo booking</span>' +
            '</label>' +
            '<select class="form-select form-select-sm line-bai-ha-thuc-te-select" data-id="' + item.nid + '" data-planned="' + escHtml(plannedBaiHa) + '">' + buildTagOptions(state.diaDiem.bai, destinationValue) + '</select>' +
          '</td>' +
          '<td class="text-center">' + (duHang ? '<span class="badge bg-label-success">Đủ hàng</span>' : '<span class="badge bg-label-secondary">Chưa đủ</span>') + '</td>' +
          '<td><input type="text" class="form-control form-control-sm cont-inline-note" data-id="' + item.nid + '" value="' + escHtml(item.ghi_chu || '') + '" placeholder="Ghi chú"></td>' +
          '</tr>');
      }
      $body.html(rows.length ? rows.join('') : '<tr><td colspan="7" class="text-center text-muted">Không có cont phù hợp</td></tr>');
      $body.find('.line-bai-ha-thuc-te-select').each(function () {
        initSelect2(this, '— Chọn bãi hạ —', { tags: true, allowClear: false, dropdownParent: formDropdownParent() });
      });
      $picker.find('.line-cont-filter-kho').each(function () {
        if (!$(this).data('select2')) {
          initSelect2(this, '— Tìm theo địa chỉ kho —', { allowClear: true, dropdownParent: formDropdownParent() });
        }
      });
      $picker.scrollTop(scrollTop);
      $formApp.closest('.modal-body').scrollTop(bodyScrollTop);
    }

    function updateContCandidateItem($card, id, fields) {
      id = parseInt(id, 10) || 0;
      if (!id) return;
      var items = $card.data('contCandidates') || [];
      for (var i = 0; i < items.length; i++) {
        if ((parseInt(items[i].nid, 10) || 0) === id) {
          $.extend(items[i], fields);
          break;
        }
      }
      $card.data('contCandidates', items);
      var cacheKey = $card.data('contCandidatesCacheKey');
      var cached = cacheKey ? state.contCandidateCache[cacheKey] : null;
      if (cached) {
        for (var j = 0; j < cached.length; j++) {
          if ((parseInt(cached[j].nid, 10) || 0) === id) {
            $.extend(cached[j], fields);
            break;
          }
        }
      }
    }

    function stageContBaiHaThucTe($card, contId, value) {
      contId = parseInt(contId, 10) || 0;
      if (!contId) return;
      state.pendingContDestinationUpdates[String(contId)] = value || '';
      updateContCandidateItem($card, contId, { bai_ha_thuc_te: value || '' });
      var $picker = getContPicker($card);
      var $select = $picker.find('.line-bai-ha-thuc-te-select[data-id="' + contId + '"]');
      var planned = ($select.attr('data-planned') || '').trim();
      var actual = normalizeBaiHaThucTe(value || '', planned);
      $select.closest('td').find('.line-bai-ha-theo-ke-hoach-checkbox').prop('checked', !actual);
    }

    function flushPendingContDestinationUpdates() {
      var updates = $.extend({}, state.pendingContDestinationUpdates);
      var ids = Object.keys(updates);
      if (!ids.length) return $.Deferred().resolve().promise();

      var requests = $.map(ids, function (id) {
        var deferred = $.Deferred();
        $.ajax({
          url: '/api/quan-ly-cont/' + id,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({ bai_ha_thuc_te: updates[id] || '' }),
          dataType: 'json'
        }).done(function (res) {
          if (res && res.status === 'success') {
            deferred.resolve(res);
          } else {
            deferred.reject({ responseText: JSON.stringify(res || { message: 'Không cập nhật được bãi hạ thực tế' }) });
          }
        }).fail(function (jqXHR) {
          deferred.reject(jqXHR);
        });
        return deferred.promise();
      });

      return $.when.apply($, requests).then(function () {
        state.pendingContDestinationUpdates = {};
      });
    }

    function loadCauHinh(khId, callback) {
      state.cauHinh = { diaChiKho: [], loaiCont: [] };
      if (!khId) {
        refreshLineSources();
        if (callback) callback();
        return;
      }
      $.ajax({
        url: '/api/cau-hinh-gia-ban',
        type: 'GET',
        dataType: 'json',
        data: { khach_hang_id: khId, limit: 999 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            var khoSet = {};
            var contSet = {};
            for (var i = 0; i < res.data.items.length; i++) {
              if (res.data.items[i].dia_chi_kho) khoSet[res.data.items[i].dia_chi_kho] = true;
              if (res.data.items[i].loai_cont) contSet[res.data.items[i].loai_cont] = true;
            }
            state.cauHinh.diaChiKho = Object.keys(khoSet);
            state.cauHinh.loaiCont = Object.keys(contSet);
          }
        },
        complete: function () {
          refreshLineSources();
          if (callback) callback();
        }
      });
    }

    function validateForm() {
      var ok = true;
      if (!useTableLayout) {
        setSelect2Invalid($form('#nid_khach_hang-input'), false);
        var khId = parseInt($form('#nid_khach_hang-input').val(), 10) || 0;
        if (!khId) {
          ok = false;
          setSelect2Invalid($form('#nid_khach_hang-input'), true);
        }
      }
      syncAllLines();
      if (!state.lines.length) {
        if (notyf) notyf.error('Cần có ít nhất một dòng xe');
        return false;
      }
      var selector = useTableLayout ? '#ke-hoach-lines-body .ke-hoach-table-row' : '#ke-hoach-lines .ke-hoach-line-card';
      $form(selector).each(function () {
        var $row = $(this);
        var line = syncLine($row);
        if (useTableLayout) {
          $row.removeClass('table-danger');
          $row.find('.line-customer-feedback').hide();
          setSelect2Invalid($row.find('.line-customer-select'), false);
          $row.find('.line-so-bkg-input').removeClass('is-invalid');
          setSelect2Invalid($row.find('.line-kho-select'), false);
          setSelect2Invalid($row.find('.line-cang-select'), false);
        } else {
          $row.removeClass('line-card-invalid');
          $form('#so_bkg-input').removeClass('is-invalid');
          setSelect2Invalid($row.find('.line-driver-select'), false);
          setSelect2Invalid($row.find('.line-kho-select'), false);
          setSelect2Invalid($row.find('.line-cang-select'), false);
          $row.find('.line-vehicle-feedback').hide();
        }
        if ((useTableLayout && !line.so_bkg) || (!useTableLayout && !$form('#so_bkg-input').val().trim())) {
          ok = false;
          if (useTableLayout) {
            $row.find('.line-so-bkg-input').addClass('is-invalid');
          } else {
            $form('#so_bkg-input').addClass('is-invalid');
          }
        }
        if (useTableLayout && !line.nid_khach_hang) {
          ok = false;
          $row.find('.line-customer-feedback').show();
          setSelect2Invalid($row.find('.line-customer-select'), true);
        }
        if (!line.dia_chi_kho) {
          ok = false;
          if (useTableLayout) {
            setSelect2Invalid($row.find('.line-kho-select'), true);
          } else {
            $row.addClass('line-card-invalid');
            setSelect2Invalid($row.find('.line-kho-select'), true);
          }
        }
      });
      return ok;
    }

    function gatherCreatePayload() {
      syncAllLines();
      var firstLine = state.lines[0] || {};
      return {
        nid_khach_hang: firstLine.nid_khach_hang || 0,
        loai_ke_hoach: currentPlanType(),
        items: $.map(state.lines, function (line) {
          return {
            nid_khach_hang: line.nid_khach_hang || 0,
            so_bkg: line.so_bkg || '',
            nid_phuong_tien: line.nid_phuong_tien || 0,
            nid_mooc: line.nid_mooc || 0,
            nid_lai_xe: line.nid_lai_xe || 0,
            dia_chi_kho: line.dia_chi_kho || '',
            loai_cont: line.loai_cont || '',
            so_cont: line.so_cont || '',
            so_seal_chinh: line.so_seal_chinh || '',
            so_seal_tam: line.so_seal_tam || '',
            bai_lay_cont: line.bai_lay_cont || '',
            bai_lay_thuc_te: line.bai_lay_thuc_te || '',
            bai_ha_cont: line.bai_ha_cont || '',
            bai_ha_thuc_te: line.bai_ha_thuc_te || '',
            cang_xuat: line.cang_xuat || '',
            cut_off: line.cut_off || '',
            ghi_chu: line.ghi_chu || '',
            hinh_thuc_van_tai: line.hinh_thuc_van_tai || '',
            ke_hoach_cont_ref_nid: line.ke_hoach_cont_ref_nid || 0,
            da_cat_mooc: line.da_cat_mooc || 0,
            da_du_hang: line.da_du_hang || 0,
            ha_bai_ngoai: line.ha_bai_ngoai || 0,
            ha_cang: line.ha_cang || 0
          };
        })
      };
    }

    function gatherEditPayload() {
      syncAllLines();
      var line = state.lines[0] || {};
      return {
        nid_khach_hang: parseInt($form('#nid_khach_hang-input').val(), 10) || 0,
        item: {
          so_bkg: useTableLayout ? (line.so_bkg || '') : $form('#so_bkg-input').val().trim(),
          nid_phuong_tien: line.nid_phuong_tien || 0,
          nid_mooc: line.nid_mooc || 0,
          nid_lai_xe: line.nid_lai_xe || 0,
          dia_chi_kho: line.dia_chi_kho || '',
          loai_cont: line.loai_cont || '',
          so_cont: line.so_cont || '',
          so_seal_chinh: line.so_seal_chinh || '',
          so_seal_tam: line.so_seal_tam || '',
          bai_lay_cont: line.bai_lay_cont || '',
          bai_lay_thuc_te: line.bai_lay_thuc_te || '',
          bai_ha_cont: line.bai_ha_cont || '',
          bai_ha_thuc_te: line.bai_ha_thuc_te || '',
          cang_xuat: line.cang_xuat || '',
          cut_off: line.cut_off || '',
          ghi_chu: line.ghi_chu || '',
          hinh_thuc_van_tai: useTableLayout ? '' : (line.hinh_thuc_van_tai || ''),
          ke_hoach_cont_ref_nid: line.ke_hoach_cont_ref_nid || 0,
          da_cat_mooc: line.da_cat_mooc || 0,
          da_du_hang: line.da_du_hang || 0,
          ha_bai_ngoai: line.ha_bai_ngoai || 0,
          ha_cang: line.ha_cang || 0
        }
      };
    }

    function updateEditTitle(row) {
      var parts = [currentPlanType() === 'tuyen_xa' ? 'Xếp xe tuyến xa' : 'Xếp xe'];
      var khName = row && row.khach_hang && row.khach_hang.ten ? row.khach_hang.ten : '';
      var soBkg = row && row.so_bkg ? row.so_bkg : '';
      if (khName) parts.push(khName);
      if (soBkg) parts.push(soBkg);
      $form('#form-title').text(parts.join(' - '));
    }

    function updateCompleteButton(row) {
      var $btn = $form('#complete-plan-btn');
      if (!$btn.length) return;
      var nid = row && row.nid ? parseInt(row.nid, 10) : parseInt($form('#nid-input').val(), 10);
      var status = row && row.trang_thai_van_chuyen ? String(row.trang_thai_van_chuyen) : '';
      if (!nid) {
        $btn.addClass('d-none').removeAttr('data-id');
        return;
      }
      var isComplete = status === 'Hoàn thành';
      $btn.removeClass('d-none').attr('data-id', nid);
      $btn
        .toggleClass('btn-success', !isComplete)
        .toggleClass('btn-outline-success', isComplete)
        .html(isComplete
          ? '<i class="icon-base ti tabler-circle-check me-1"></i>Đã hoàn thành'
          : '<i class="icon-base ti tabler-circle-check me-1"></i>Hoàn thành');
    }

    function populateEdit(row) {
      var khachHangId = (row.khach_hang && row.khach_hang.nid) || 0;
      updateEditTitle(row);
      $form('#nid-input').val(row.nid || '');
      updateCompleteButton(row);
      state.pendingContDestinationUpdates = {};
      state.lines = [];
      addLine({
        nid_khach_hang: khachHangId,
        so_bkg: row.so_bkg || '',
        nid_phuong_tien: row.phuong_tien ? row.phuong_tien.nid : 0,
        nid_mooc: row.mooc ? row.mooc.nid : 0,
        mooc: row.mooc || null,
        nid_lai_xe: row.lai_xe ? row.lai_xe.nid : 0,
        dia_chi_kho: row.dia_chi_kho || '',
        loai_cont: row.loai_cont || '',
        so_cont: row.so_cont || '',
        so_seal_chinh: row.so_seal_chinh || '',
        so_seal_tam: row.so_seal_tam || '',
        bai_lay_cont: row.bai_lay_cont || '',
        bai_lay_thuc_te: row.bai_lay_thuc_te || '',
        bai_ha_cont: row.bai_ha_cont || '',
        bai_ha_thuc_te: row.bai_ha_thuc_te || '',
        cang_xuat: row.cang_xuat || '',
        cut_off: row.cut_off || '',
        ghi_chu: row.ghi_chu || '',
        hinh_thuc_van_tai: row.hinh_thuc_van_tai || '',
        ke_hoach_cont_ref_nid: row.ke_hoach_cont_ref_nid || 0,
        da_cat_mooc: row.da_cat_mooc || 0,
        da_du_hang: row.da_du_hang || 0,
        ha_bai_ngoai: row.ha_bai_ngoai || 0,
        ha_cang: row.ha_cang || 0
      });
      $form('#nid_khach_hang-input').val(khachHangId).trigger('change');
      if ($form('#so_bkg-input').length) $form('#so_bkg-input').val(row.so_bkg || '');
    }

    function loadEditDetail(done) {
      if (editData && parseInt(editData.nid, 10)) {
        if (done) done(editData);
        return;
      }
      var nid = getNidFromUrl();
      if (!nid) {
        if (done) done(editData);
        return;
      }
      $.ajax({
        url: '/api/ke-hoach-xep-xe/' + nid,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
          if (res.status === 'success' && res.data) {
            editData = res.data;
            if (done) done(res.data);
            return;
          }
          if (notyf) notyf.error(res.message || 'Không tải được chi tiết kế hoạch');
          if (done) done(editData);
        },
        error: function (jqXHR) {
          if (notyf) notyf.error(apiMsg(jqXHR));
          if (done) done(editData);
        }
      });
    }

    function loadDropdowns(done) {
      var cached = getFormDropdownCache();
      if (cached) {
        applyDropdownData(cached);
        dropdownsLoaded = true;
        dropdownsLoading = false;
        if (done) done();
        return;
      }
      if (dropdownsLoaded) {
        if (done) done();
        return;
      }
      if (dropdownsLoading) {
        var timer = setInterval(function () {
          if (dropdownsLoaded) {
            clearInterval(timer);
            if (done) done();
          }
        }, 50);
        return;
      }
      dropdownsLoading = true;
      var pending = 5;
      function finish() {
        pending -= 1;
        if (pending === 0) {
          setFormDropdownCache({
            customers: state.customers,
            drivers: state.drivers,
            vehicles: state.vehicles,
            diaDiem: state.diaDiem
          });
          dropdownsLoaded = true;
          dropdownsLoading = false;
          if (done) done();
        }
      }
      $.ajax({
        url: '/api/khach-hang',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            state.customers = res.data.items;
            var html = '<option value="0">— Chọn —</option>';
            for (var i = 0; i < state.customers.length; i++) {
              html += '<option value="' + state.customers[i].nid + '">' + escHtml(state.customers[i].ten || ('#' + state.customers[i].nid)) + '</option>';
            }
            $form('#nid_khach_hang-input').html(html);
          }
        },
        complete: finish
      });
      $.ajax({
        url: '/api/lai-xe',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) state.drivers = res.data.items;
        },
        complete: finish
      });
      $.ajax({
        url: '/api/phuong-tien',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            state.vehicles = res.data.items;
            state.vehicleMap = {};
            for (var i = 0; i < state.vehicles.length; i++) state.vehicleMap[String(state.vehicles[i].nid)] = state.vehicles[i];
          }
        },
        complete: finish
      });
      $.ajax({
        url: '/api/danh-muc-dia-diem',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            for (var i = 0; i < res.data.items.length; i++) {
              var phanLoai = String(res.data.items[i].phan_loai || '').toLowerCase();
              if (phanLoai === 'bãi' && res.data.items[i].ten) state.diaDiem.bai.push(res.data.items[i].ten);
              if (phanLoai === 'cảng' && res.data.items[i].ten) state.diaDiem.cang.push(res.data.items[i].ten);
            }
          }
        },
        complete: finish
      });
      $.ajax({
        url: '/api/danh-muc',
        type: 'GET',
        dataType: 'json',
        data: { phan_loai: 'Kho', limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            state.diaDiem.kho = [];
            for (var i = 0; i < res.data.items.length; i++) {
              if (res.data.items[i].ten) state.diaDiem.kho.push(res.data.items[i].ten);
            }
          }
        },
        complete: finish
      });
    }

    $(document).on('change', '#nid_khach_hang-input', function () {
      loadCauHinh(parseInt($(this).val(), 10) || 0);
    });
    $form('#add-line-btn, #reset-lines-btn, #save-btn, #complete-plan-btn, #vehicle-picker-search, #ke-hoach-form').off();
    $form('#add-line-btn').on('click', function () {
      syncAllLines();
      addLine({});
    });
    $form('#reset-lines-btn').on('click', function () {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xác nhận reset',
          text: 'Bạn có chắc chắn muốn xoá toàn bộ dữ liệu đang nhập và quay về 1 dòng trống?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Reset',
          cancelButtonText: 'Huỷ',
          confirmButtonColor: '#7367f0',
          customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false
        }).then(function (result) {
          if (result.isConfirmed) resetAllLines();
        });
      } else if (confirm('Bạn có chắc chắn muốn reset toàn bộ dữ liệu đang nhập?')) {
        resetAllLines();
      }
    });
    $form('#vehicle-picker-search').on('input', function () {
      renderVehicleTable($(this).val());
    });
    $form('#complete-plan-btn').on('click', function () {
      var $btn = $(this);
      var id = parseInt($btn.attr('data-id') || $form('#nid-input').val(), 10) || 0;
      if (!id) return;
      var isComplete = editData && String(editData.trang_thai_van_chuyen || '') === 'Hoàn thành';
      var nextStatus = isComplete ? 'Chưa xếp xe' : 'Hoàn thành';
      setPlanStatus(id, nextStatus, {
        $button: $btn,
        onSuccess: function () {
          markForceReloadList();
          if (editData) editData.trang_thai_van_chuyen = nextStatus;
          updateCompleteButton($.extend({}, editData || {}, { nid: id, trang_thai_van_chuyen: nextStatus }));
        }
      });
    });
    $form('#ke-hoach-form').on('keydown', function (e) {
      if (e.which === 13 && !$(e.target).is('textarea')) {
        e.preventDefault();
        $form('#save-btn').trigger('click');
      }
    });
    $form('#save-btn').on('click', function () {
      if (!validateForm()) return;
      showLoading(true);
      var nid = $form('#nid-input').val();
      $.ajax({
        url: nid ? '/api/ke-hoach-xep-xe/' + nid : '/api/ke-hoach-xep-xe',
        method: nid ? 'PUT' : 'POST',
        contentType: 'application/json',
        data: JSON.stringify(nid ? gatherEditPayload() : gatherCreatePayload()),
        success: function (res) {
          if (res.status !== 'success') {
            showLoading(false);
            if (notyf) notyf.error(res.message || 'Lưu thất bại');
            return;
          }

          flushPendingContDestinationUpdates().done(function () {
            showLoading(false);
            if (notyf) notyf.success(nid ? 'Đã cập nhật kế hoạch' : 'Đã tạo kế hoạch');
            if (nid) {
              markForceReloadList();
              if ($('#ke-hoach-edit-fullscreen-modal').hasClass('show') || $('#ke-hoach-tuyen-xa-edit-fullscreen-modal').hasClass('show')) {
                if (typeof loadList === 'function' && $('#ke-hoach-list-app').length) loadList();
              }
            }
            if (nid) {
              if (res.data) {
                populateEdit(res.data);
              }
            } else {
              if (formModal) formModal.hide();
              var formEl = $form('#ke-hoach-form')[0];
              if (formEl) formEl.reset();
              $form('#nid_khach_hang-input').val('0').trigger('change');
              state.lines = [];
              addLine({});
              if (typeof loadList === 'function' && $('#ke-hoach-list-app').length) loadList();
            }
          }).fail(function (jqXHR) {
            showLoading(false);
            if (notyf) notyf.error(apiMsg(jqXHR));
          });
        },
        error: function (jqXHR) {
          showLoading(false);
          if (notyf) notyf.error(apiMsg(jqXHR));
        }
      });
    });

    $(document).on('click', '.btn-open-vehicle-modal', function () {
      syncAllLines();
      openVehicleModal($(this).closest(useTableLayout ? '.ke-hoach-table-row' : '.ke-hoach-line-card').data('line-key'));
    });
    $(document).on('click', '.btn-open-mooc-modal', function () {
      syncAllLines();
      openMoocModal($(this).closest(useTableLayout ? '.ke-hoach-table-row' : '.ke-hoach-line-card').data('line-key'));
    });
    $(document).on('click', '.btn-remove-row-ke-hoach', function () {
      if (!useTableLayout) return;
      var key = $(this).closest('.ke-hoach-table-row').data('line-key');
      if (state.lines.length <= 1) {
        resetAllLines();
        return;
      }
      state.lines = $.grep(state.lines, function (line) { return line.key !== key; });
      renderRows();
    });
    $(document).on('click', '.btn-copy-row-ke-hoach', function () {
      if (!useTableLayout) return;
      var line = syncLine($(this).closest('.ke-hoach-table-row'));
      var copy = $.extend({}, line);
      delete copy.key;
      addLine(copy);
    });
    $(document).on('click', '.btn-pick-vehicle', function () {
      selectVehicleForLine($(this).data('id'));
    });
    $(document).on('change', 'input[name="vehicle-picker-radio"]', function () {
      selectVehicleForLine($(this).val());
    });
    $(document).on('click', '.line-hinh-thuc-radio', function () {
      var $radio = $(this);
      var $card = $radio.closest('.ke-hoach-line-card');
      if ($radio.data('current') === 1) {
        $radio.prop('checked', false);
        $radio.data('current', 0);
      } else {
        $card.find('.line-hinh-thuc-radio').data('current', 0);
        $radio.data('current', 1);
      }
      var line = syncLine($card);
      loadContCandidates(line, $card);
    });
    $(document).on('input', '.line-cont-filter-bkg, .line-cont-filter-cont', function () {
      var key = $(this).closest('.line-cont-picker-wrap').data('line-key');
      var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]');
      var line = syncLine($card);
      renderContCandidateRows(line, $card);
    });
    $(document).on('change', '.line-cont-filter-kho, .line-cont-filter-du-hang', function () {
      var key = $(this).closest('.line-cont-picker-wrap').data('line-key');
      var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]');
      var line = syncLine($card);
      renderContCandidateRows(line, $card);
    });
    $(document).on('change', '.line-cont-ref-checkbox', function () {
      var $checkbox = $(this);
      var key = $checkbox.closest('.line-cont-picker-wrap').data('line-key');
      var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]');
      var line = syncLine($card);
      line.ke_hoach_cont_ref_nid = $checkbox.is(':checked') ? (parseInt($checkbox.attr('data-id'), 10) || 0) : 0;
      renderContCandidateRows(line, $card);
      if (line.ke_hoach_cont_ref_nid && notyf) notyf.success('Đã chọn cont kéo về: ' + ($checkbox.attr('data-so-cont') || ''));
    });
    $(document).on('change', '.line-bai-ha-theo-ke-hoach-checkbox', function () {
      var $checkbox = $(this);
      var $picker = $checkbox.closest('.line-cont-picker-wrap');
      var key = $picker.data('line-key');
      var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]');
      var contId = parseInt($checkbox.data('id'), 10) || 0;
      if (!contId) return;
      if ($checkbox.is(':checked')) {
        stageContBaiHaThucTe($card, contId, '');
        return;
      }
      $checkbox.closest('td').find('.line-bai-ha-thuc-te-select').val('').trigger('change.select2');
      stageContBaiHaThucTe($card, contId, '');
    });
    $(document).on('change', '.line-cont-picker-wrap .line-bai-ha-thuc-te-select', function () {
      var $select = $(this);
      var $picker = $select.closest('.line-cont-picker-wrap');
      var key = $picker.data('line-key');
      var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]');
      var contId = parseInt($select.data('id'), 10) || 0;
      var planned = ($select.attr('data-planned') || '').trim();
      var value = ($select.val() || '').trim();
      if (!contId) return;
      stageContBaiHaThucTe($card, contId, normalizeBaiHaThucTe(value, planned));
    });
    $(document).on('change blur', '.cont-inline-note', function () {
      var $input = $(this);
      var id = parseInt($input.data('id'), 10) || 0;
      if (!id) return;
      $.ajax({
        url: '/api/quan-ly-cont/' + id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ ghi_chu: $input.val().trim() }),
        dataType: 'json'
      });
    });
    $(document).on('click', '#vehicle-picker-clear-btn', function () {
      clearVehicleForActiveLine();
    });
    $(document).off('hidden.bs.modal', '#vehicle-picker-modal').on('hidden.bs.modal', '#vehicle-picker-modal', function () {
      if ($('#ke-hoach-edit-fullscreen-modal').hasClass('show') || $('#ke-hoach-tuyen-xa-edit-fullscreen-modal').hasClass('show')) {
        $('body').addClass('modal-open');
      }
    });

    var modalEl = $form('#ke-hoach-fullscreen-modal')[0];
    if (useTableLayout && modalEl) {
      formModal = new bootstrap.Modal(modalEl);
      modalEl.addEventListener('show.bs.modal', function () {
        showLoading(true);
        loadDropdowns(function () {
          try {
            if (!$form('#nid-input').val()) {
              var formEl = $form('#ke-hoach-form')[0];
              if (formEl) formEl.reset();
              state.lines = [];
              addLine({});
            }
          } catch (err) {
            if (window.console && console.error) console.error(err);
            if (notyf) notyf.error('Không khởi tạo được form tạo kế hoạch');
          } finally {
            showLoading(false);
          }
        });
      });
    }

    if (mode === 'edit') {
      showLoading(true);
      loadDropdowns(function () {
        try {
          initSelect2($form('#nid_khach_hang-input')[0], '— Chọn khách hàng —', { dropdownParent: formDropdownParent() });
          loadEditDetail(function (row) {
            try {
              if (row) {
                populateEdit(row);
              }
            } catch (err) {
              if (window.console && console.error) console.error(err);
              if (notyf) notyf.error('Không hiển thị được form sửa kế hoạch');
            } finally {
              window.setTimeout(function () {
                showLoading(false);
                $(document).trigger('keHoachEditReady');
              }, 0);
            }
          });
        } catch (err) {
          if (window.console && console.error) console.error(err);
          if (notyf) notyf.error('Không khởi tạo được form sửa kế hoạch');
          showLoading(false);
          $(document).trigger('keHoachEditReady');
        }
      });
    }
  }

  function initContList() {
    if (initContList._bound) return;
    initContList._bound = true;
    var contMode = (Drupal.settings.ke_hoach_cont && Drupal.settings.ke_hoach_cont.mode) || ($('#ke-hoach-cont-app').data('mode')) || 'overall';

    function loadCustomers() {
      $.getJSON('/api/khach-hang', { limit: 500 }, function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          var html = '<option value="">Khách hàng</option>';
          for (var i = 0; i < res.data.items.length; i++) {
            html += '<option value="' + res.data.items[i].nid + '">' + escHtml(res.data.items[i].ten || '') + '</option>';
          }
          $('#cont-filter-khach-hang').html(html);
        }
      });
    }

    function loadConts() {
      var params = {
        keyword: $('#cont-keyword').val().trim(),
        nid_khach_hang: $('#cont-filter-khach-hang').val() || '',
        da_du_hang: $('#cont-filter-du-hang').val() || ''
      };
      if (contMode === 'cat_mooc') {
        params.da_cat_mooc = 1;
      }
      $('#cont-list-body').html('<tr><td colspan="11" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải dữ liệu...</td></tr>');
      $.getJSON('/api/quan-ly-cont', params, function (res) {
        if (res.status !== 'success' || !res.data) {
          $('#cont-list-body').html('<tr><td colspan="11" class="text-center text-danger">Không tải được dữ liệu</td></tr>');
          return;
        }
        var items = res.data.items || [];
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var daDuHang = parseInt(item.da_du_hang, 10) === 1;
          if (contMode === 'cat_mooc') {
            var hinhThucBadge = item.hinh_thuc_van_tai ? '<span class="badge ' + (HINH_THUC_COLOR[item.hinh_thuc_van_tai] || 'bg-label-secondary') + '">' + escHtml(HINH_THUC_MAP[item.hinh_thuc_van_tai] || '') + '</span>' : '';
            var khName = item.khach_hang && item.khach_hang.ten ? item.khach_hang.ten : '';
            var contHtml = item.loai_cont ? escHtml(item.loai_cont) : '';
            if (item.so_cont) {
              contHtml += (contHtml ? ' - ' : '') + escHtml(item.so_cont);
            }
            html += '<tr data-id="' + item.nid + '">' +
              '<td>' + (i + 1) + '</td>' +
              '<td class="khxh-date-cell">' + formatDateBadge(item.created) + '</td>' +
              '<td class="khxh-common-cell">' +
                '<div class="khxh-customer-cell">' + (khName ? escHtml(khName) : '<span class="text-muted fst-italic small">khách hàng</span>') + '</div>' +
                '<div class="khxh-htvt-cell">' +
                  (item.hinh_thuc_status_text ? '<div class="khxh-htvt-status">' + escHtml(item.hinh_thuc_status_text) + '</div>' : '') +
                  (hinhThucBadge ? '<div class="khxh-htvt-badge-wrap">' + hinhThucBadge + '</div>' : '') +
                '</div>' +
              '</td>' +
              '<td class="khxh-bkg-cell">' + escHtml(item.so_bkg || '') + '</td>' +
              '<td class="khxh-container-cell">' +
                '<div>' + (contHtml || '<span class="text-muted fst-italic small">container</span>') + '</div>' +
                '<div>' + (item.so_seal_tam ? escHtml(item.so_seal_tam) : '<span class="text-muted fst-italic small">seal tạm</span>') + '</div>' +
                '<div>' + (item.so_seal_chinh ? escHtml(item.so_seal_chinh) : '<span class="text-muted fst-italic small">seal chính</span>') + '</div>' +
              '</td>' +
              '<td class="khxh-vehicle-cell">' + vehicleListInfoHtml(item) + '</td>' +
              '<td class="khxh-kho-cell">' + escHtml(item.dia_chi_kho || '') + '</td>' +
              '<td class="text-nowrap"><div class="khxh-hanh-trinh-cell"><div class="khxh-hanh-trinh-box">' + (item.bai_lay_cont ? escHtml(item.bai_lay_cont) : '<span class="text-muted fst-italic small">Chưa có</span>') + '</div><div class="khxh-hanh-trinh-separator"></div><div class="khxh-hanh-trinh-box">' + (item.bai_ha_cont ? escHtml(item.bai_ha_cont) : '<span class="text-muted fst-italic small">Chưa có</span>') + '</div></div></td>' +
              '<td class="khxh-cang-cell">' + escHtml(item.cang_xuat || '') + '</td>' +
              '<td class="khxh-date-cell">' + cutOffBadge(item.cut_off) + '</td>' +
              '<td class="khxh-status-cell text-center"><button type="button" class="btn btn-sm ' + (daDuHang ? 'btn-success' : 'btn-label-secondary') + ' cont-toggle-btn" data-field="da_du_hang">' + (daDuHang ? 'Đã đủ hàng' : 'Chưa đủ hàng') + '</button></td>' +
              '</tr>';
          } else {
            html += '<tr data-id="' + item.nid + '">' +
              '<td>' + (i + 1) + '</td>' +
              '<td>' + escHtml(item.khach_hang && item.khach_hang.ten ? item.khach_hang.ten : '') + '</td>' +
              '<td>' + escHtml(item.so_bkg || '') + '</td>' +
              '<td>' + escHtml(item.so_cont || '') + '</td>' +
              '<td class="text-center"><input type="checkbox" class="cont-toggle" data-field="da_du_hang"' + (daDuHang ? ' checked' : '') + '></td>' +
              '<td class="text-center"><input type="checkbox" class="cont-toggle" data-field="ha_bai_ngoai"' + (parseInt(item.ha_bai_ngoai, 10) === 1 ? ' checked' : '') + '></td>' +
              '<td class="text-center"><input type="checkbox" class="cont-toggle" data-field="ha_cang"' + (parseInt(item.ha_cang, 10) === 1 ? ' checked' : '') + '></td>' +
              '<td>' + escHtml(item.dia_chi_kho || '') + '</td>' +
              '<td>' + escHtml(item.hinh_thuc_status_text || '') + '</td>' +
              '<td>' + escHtml(item.trang_thai_cont || '') + '</td>' +
              '</tr>';
          }
        }
        $('#cont-list-body').html(html || '<tr><td colspan="' + (contMode === 'cat_mooc' ? '11' : '10') + '" class="text-center">Không có dữ liệu</td></tr>');
      }).fail(function () {
        $('#cont-list-body').html('<tr><td colspan="' + (contMode === 'cat_mooc' ? '11' : '10') + '" class="text-center text-danger">Không tải được dữ liệu</td></tr>');
      });
    }

    $(document).on('click', '#cont-search-btn', function () { loadConts(); });
    $(document).on('click', '#cont-reload-btn', function () {
      $('#cont-keyword').val('');
      $('#cont-filter-khach-hang').val('');
      $('#cont-filter-du-hang').val('');
      loadConts();
    });
    $(document).on('change', '.cont-toggle', function () {
      var $cb = $(this);
      var $tr = $cb.closest('tr');
      var id = $tr.data('id');
      var payload = {};
      payload[$cb.data('field')] = $cb.is(':checked') ? 1 : 0;
      $.ajax({ url: '/api/quan-ly-cont/' + id, type: 'PUT', contentType: 'application/json', data: JSON.stringify(payload), dataType: 'json' });
    });
    $(document).on('click', '.cont-toggle-btn', function () {
      var $btn = $(this);
      var $tr = $btn.closest('tr');
      var id = $tr.data('id');
      var nextVal = $btn.hasClass('btn-success') ? 0 : 1;
      var doUpdate = function () {
        $.ajax({
          url: '/api/quan-ly-cont/' + id,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({ da_du_hang: nextVal }),
          dataType: 'json',
          success: function () { loadConts(); }
        });
      };
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xác nhận cập nhật',
          text: nextVal ? 'Chuyển cont này sang trạng thái đã đủ hàng?' : 'Chuyển cont này về trạng thái chưa đủ hàng?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xác nhận',
          cancelButtonText: 'Huỷ',
          customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false
        }).then(function (result) {
          if (result.isConfirmed) {
            doUpdate();
          }
        });
      } else if (confirm(nextVal ? 'Chuyển cont này sang trạng thái đã đủ hàng?' : 'Chuyển cont này về trạng thái updating.. ?')) {
        doUpdate();
      }
    });

    loadCustomers();
    loadConts();
  }

  function initDetail() {
    if (initDetail._bound) return;
    initDetail._bound = true;

    var nid = getNidFromUrl();
    if (!nid) {
      $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">ID không hợp lệ</td></tr>');
      return;
    }

    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + nid,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi tải dữ liệu') + '</td></tr>');
          return;
        }
        var d = res.data;
        var khName = (d.khach_hang && d.khach_hang.ten) || '';
        var lxName = (d.lai_xe && d.lai_xe.ten) || '';
        var lxSdt = (d.lai_xe && d.lai_xe.sdt) || '';
        var ptName = (d.phuong_tien && d.phuong_tien.bks) || '';
        var rows = [
          { label: 'Ngày lập KH', value: d.created ? d.created.substring(0, 16) : '' },
          { label: 'Khách hàng', value: khName },
          { label: 'Lái xe', value: lxName + (lxSdt ? ' - ' + lxSdt : '') },
          { label: 'Phương tiện', value: ptName },
          { label: 'Số BKG', value: d.so_bkg },
          { label: 'Địa chỉ kho', value: d.dia_chi_kho },
          { label: 'Loại cont', value: d.loai_cont },
          { label: 'Số cont', value: d.so_cont },
          { label: 'Số seal chính', value: d.so_seal_chinh },
          { label: 'Số seal tạm', value: d.so_seal_tam },
          { label: 'Trạng thái', value: d.trang_thai_van_chuyen },
          { label: 'Bãi lấy cont', value: d.bai_lay_cont },
          { label: 'Bãi lấy thực tế', value: d.bai_lay_thuc_te },
          { label: 'Bãi hạ cont', value: d.bai_ha_cont },
          { label: 'Bãi hạ thực tế', value: d.bai_ha_thuc_te },
          { label: 'Cảng xuất', value: d.cang_xuat },
          { label: 'Cut-off', value: apiToDatetime(d.cut_off) },
          { label: 'Hình thức vận tải', value: HINH_THUC_MAP[d.hinh_thuc_van_tai] },
        ];
        var html = '';
        $.each(rows, function (i, r) {
          html += '<tr><th class="text-nowrap" style="width:180px;">' + r.label + '</th><td>' + escHtml(r.value || '') + '</td></tr>';
        });
        $('#detail-body').html(html);
        if (d.nid) {
          $('#edit-btn').attr('href', '/ke-hoach-xep-xe/' + d.nid + '/sua');
        }
      },
      error: function (jqXHR) {
        $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>');
      }
    });
  }

})(jQuery, Drupal);

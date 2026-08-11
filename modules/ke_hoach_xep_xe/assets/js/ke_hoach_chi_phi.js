(function ($, Drupal, window, document) {
  'use strict';

  var API_BASE = '/api/ke-hoach-chi-phi';
  var REVENUE_TYPE = 'doanh_thu';
  var DRIVER_SALARY_TYPE = 'luong_lai_xe';
  var REVENUE_FIELDS = [
    'Cước khách hàng',
    'Phí vận chuyển',
    'Phụ phí dầu',
    'PT GFT + HĐ',
    'Điều chỉnh phụ thu vé'
  ];
  var COST_SECTIONS = [
    { value: 'tinh_cho_khach', label: 'Chi hộ khách hàng', source: 'ke_hoach' },
    { value: 'cong_ty_chi_tra', label: 'Công ty chi trả', source: 'ke_hoach' },
    { value: 'lai_xe_tu_chiu', label: 'Lái xe chi trả', source: 'lai_xe' },
    { value: DRIVER_SALARY_TYPE, label: 'Lương lái xe', source: 'lai_xe' }
  ];
  var DRIVER_COST_TYPE = 'lai_xe_tu_chiu';
  var notyf;
  var modal;
  var state = {
    nidKeHoach: 0,
    nidLaiXe: 0,
    loaiKeHoach: 'thuong',
    plan: null,
    expenseNames: [],
    expenseCatalogNames: [],
    locationNames: [],
    dinhMucRoutes: [],
    dinhMucRows: [],
    oilRows: [],
    driverPayMode: 'khoan',
    rows: [],
    busy: false,
    tempIndex: 0
  };

  function uid() {
    state.tempIndex += 1;
    return 'tmp_' + Date.now() + '_' + state.tempIndex;
  }

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r.message || 'Lỗi không xác định';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function notify(message, type) {
    if (!notyf && typeof Notyf !== 'undefined') {
      notyf = new Notyf();
    }
    if (!notyf) {
      if (type === 'error') window.alert(message);
      return;
    }
    if (type === 'error') notyf.error(message);
    else notyf.success(message);
  }

  function confirmAction(options, onConfirm) {
    options = options || {};
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: options.title || 'Xác nhận?',
        text: options.text || '',
        icon: options.icon || 'question',
        showCancelButton: true,
        confirmButtonText: options.confirmButtonText || 'Xác nhận',
        cancelButtonText: options.cancelButtonText || 'Huỷ',
        customClass: {
          confirmButton: options.confirmButtonClass || 'btn btn-primary',
          cancelButton: 'btn btn-label-secondary ms-1'
        },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed && typeof onConfirm === 'function') onConfirm();
      });
      return;
    }
    if (window.confirm(options.text || options.title || 'Xác nhận?')) {
      if (typeof onConfirm === 'function') onConfirm();
    }
  }

  function escHtml(value) {
    return String(value === null || typeof value === 'undefined' ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toNumber(value) {
    if (typeof value === 'number') {
      return isFinite(value) ? value : 0;
    }
    var normalized = String(value || '').trim();
    if (!normalized) return 0;
    normalized = normalized.replace(/\s/g, '');
    if (normalized.indexOf(',') !== -1) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    }
    else if ((normalized.match(/\./g) || []).length === 1 && /^\-?\d+\.\d{1,2}$/.test(normalized)) {
      normalized = normalized;
    }
    else {
      normalized = normalized.replace(/\./g, '');
    }
    var number = Number(normalized);
    return isFinite(number) ? number : 0;
  }

  function roundMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function clampPercent(value) {
    value = toNumber(value);
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(roundMoney(value));
  }

  function formatMoneyInputKeepingCaret(input) {
    if (!input || input.readOnly || input.disabled) return;
    var raw = String(input.value || '');
    var caret = typeof input.selectionStart === 'number' ? input.selectionStart : raw.length;
    var digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
    var digits = raw.replace(/\D/g, '');
    if (!digits) {
      input.value = '';
      return;
    }
    input.value = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(digits));
    var nextCaret = input.value.length;
    var seen = 0;
    for (var i = 0; i < input.value.length; i++) {
      if (/\d/.test(input.value.charAt(i))) {
        seen += 1;
        if (seen >= digitsBeforeCaret) {
          nextCaret = i + 1;
          break;
        }
      }
    }
    try {
      input.setSelectionRange(nextCaret, nextCaret);
    } catch (e) {}
  }

  function formatDecimal(value) {
    var number = Number(value) || 0;
    if (Math.round(number) === number) {
      return String(number);
    }
    return String(Math.round(number * 100) / 100).replace('.', ',');
  }

  function apiToDate(value) {
    value = String(value || '').trim();
    if (!value) return '';
    var match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? (match[3] + '/' + match[2] + '/' + match[1]) : value;
  }

  function dateToApi(value) {
    value = String(value || '').trim();
    if (!value) return '';
    var match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) {
      return match[3] + '-' + ('0' + match[2]).slice(-2) + '-' + ('0' + match[1]).slice(-2);
    }
    return value.substr(0, 10);
  }

  function textOrDash(value) {
    value = String(value || '').trim();
    return value || '-';
  }

  function setInfoText(selector, value) {
    value = textOrDash(value);
    $(selector).text(value).attr('title', value);
  }

  function pushRoutePoint(points, value) {
    value = String(value || '').trim();
    if (!value) return;
    if (points.length && points[points.length - 1] === value) return;
    points.push(value);
  }

  function planRouteText(plan) {
    plan = plan || {};
    var points = [];
    pushRoutePoint(points, plan.bai_lay_thuc_te || plan.bai_lay_cont);
    pushRoutePoint(points, plan.dia_chi_kho || plan.diem_den);
    pushRoutePoint(points, plan.bai_ha_thuc_te || plan.bai_ha_cont || plan.diem_den);
    return points.join(' - ');
  }

  function hinhThucLabel(value) {
    var map = {
      cat_keo: 'Cắt kéo',
      cat_keo_cheo: 'Cắt kéo chéo',
      tha_mooc: 'Thả mooc',
      rut_mooc: 'Rút mooc',
      dong_hang_trong_ngay: 'Đóng hàng trong ngày',
      roi_cont: 'Rời cont'
    };
    value = String(value || '').trim();
    return map[value] || value;
  }

  function hinhThucColor(value) {
    var map = {
      cat_keo: 'bg-label-success',
      cat_keo_cheo: 'bg-label-primary',
      tha_mooc: 'bg-label-warning',
      rut_mooc: 'bg-label-info',
      dong_hang_trong_ngay: 'bg-label-danger',
      roi_cont: 'bg-label-secondary'
    };
    return map[String(value || '').trim()] || 'bg-label-secondary';
  }

  function updateTransportBadge(value) {
    var raw = String(value || '').trim();
    var label = raw ? hinhThucLabel(raw) : 'Chưa chọn hình thức vận tải';
    $('#khcp-header-transport')
      .removeClass('bg-label-success bg-label-primary bg-label-warning bg-label-info bg-label-danger bg-label-secondary')
      .addClass(hinhThucColor(raw))
      .text(label)
      .attr('title', label);
  }

  function parseJson(value) {
    if ($.isPlainObject(value)) return value;
    try {
      return value ? JSON.parse(value) : {};
    } catch (e) {
      return {};
    }
  }

  function hasExpenseName(name) {
    name = String(name || '').trim().toLowerCase();
    if (!name) return true;
    for (var i = 0; i < state.expenseNames.length; i++) {
      if (String(state.expenseNames[i] || '').trim().toLowerCase() === name) return true;
    }
    return false;
  }

  function addExpenseName(name) {
    name = String(name || '').trim();
    if (!name || hasExpenseName(name)) return;
    state.expenseNames.push(name);
    state.expenseNames.sort(function (a, b) {
      return String(a).localeCompare(String(b), 'vi');
    });
  }

  function loadExpenseNames() {
    return $.getJSON('/api/danh-muc', { phan_loai: 'Chi phí', limit: 500 })
      .done(function (response) {
        var items = response && response.data && response.data.items ? response.data.items : [];
        state.expenseNames = [];
        state.expenseCatalogNames = [];
        $.each(items, function (_, item) {
          if (item && item.ten) {
            state.expenseCatalogNames.push(item.ten);
            addExpenseName(item.ten);
          }
        });
      });
  }

  function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
  }

  function addLocationName(name) {
    name = String(name || '').trim();
    if (!name) return;
    for (var i = 0; i < state.locationNames.length; i++) {
      if (normalizeKey(state.locationNames[i]) === normalizeKey(name)) return;
    }
    state.locationNames.push(name);
    state.locationNames.sort(function (a, b) {
      return String(a).localeCompare(String(b), 'vi');
    });
  }

  function loadLocations() {
    return $.getJSON('/api/danh-muc-dinh-muc-dia-diem', { limit: 500 })
      .done(function (response) {
        var items = response && response.data && response.data.items ? response.data.items : [];
        state.locationNames = [];
        $.each(items, function (_, item) {
          if (item && item.ten) addLocationName(item.ten);
        });
      });
  }

  function loadCustomerDinhMuc() {
    state.dinhMucRoutes = [];
    var nidKhachHang = state.plan && state.plan.khach_hang && state.plan.khach_hang.nid ? Number(state.plan.khach_hang.nid) : 0;
    if (!nidKhachHang) return $.Deferred().resolve().promise();
    return $.getJSON('/api/khach-hang/' + nidKhachHang + '/dinh-muc')
      .done(function (response) {
        state.dinhMucRoutes = response && response.data && response.data.routes ? response.data.routes : [];
      });
  }

  function locationOptions(selectedValue) {
    var selected = String(selectedValue || '').trim();
    var html = '<option value=""></option>';
    var hasSelected = !selected;
    for (var i = 0; i < state.locationNames.length; i++) {
      var name = String(state.locationNames[i] || '').trim();
      if (!name) continue;
      if (selected && normalizeKey(name) === normalizeKey(selected)) hasSelected = true;
      html += '<option value="' + escHtml(name) + '"' + (name === selected ? ' selected' : '') + '>' + escHtml(name) + '</option>';
    }
    if (selected && !hasSelected) {
      html += '<option value="' + escHtml(selected) + '" selected>' + escHtml(selected) + '</option>';
    }
    return html;
  }

  function initDinhMucSelect2(scope) {
    if (!$.fn || !$.fn.select2) return;
    $(scope).find('.khcp-dm-place-select').each(function () {
      var $select = $(this);
      if ($select.data('select2')) $select.select2('destroy');
      $select.select2({
        placeholder: 'Chọn địa điểm',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#ke-hoach-chi-phi-modal')
      });
    });
  }

  function statusOptions(selectedValue) {
    var options = [
      { value: 'v', label: 'Vỏ' },
      { value: 'h', label: 'Hàng' },
      { value: 't', label: 'Trống' }
    ];
    var html = '';
    for (var i = 0; i < options.length; i++) {
      html += '<option value="' + options[i].value + '"' + (options[i].value === selectedValue ? ' selected' : '') + '>' + options[i].label + '</option>';
    }
    return html;
  }

  function routeHasLocation(list, key) {
    var found = false;
    $.each(list || [], function (_, item) {
      if (normalizeKey(item) === key) found = true;
    });
    return found;
  }

  function findDinhMucAmount(from, to, status) {
    var fromKey = normalizeKey(from);
    var toKey = normalizeKey(to);
    if (!fromKey || !toKey) return 0;
    var matched = 0;
    $.each(state.dinhMucRoutes || [], function (_, route) {
      var fromList = route && $.isArray(route.from) ? route.from : [];
      var toList = route && $.isArray(route.to) ? route.to : [];
      var forward = routeHasLocation(fromList, fromKey) && routeHasLocation(toList, toKey);
      var reverse = routeHasLocation(fromList, toKey) && routeHasLocation(toList, fromKey);
      if (forward || reverse) {
        matched = toNumber(route[status] || 0);
        return false;
      }
    });
    return matched;
  }

  function normalizeDinhMucRow(item, index) {
    item = item || {};
    var status = item.trang_thai_xe || 'v';
    if ($.inArray(status, ['v', 'h', 't']) === -1) status = 'v';
    return {
      key: item.key || uid(),
      ten_chang: item.ten_chang || ('Chặng ' + (index + 1)),
      trang_thai_xe: status,
      diem_dau: item.diem_dau || '',
      diem_cuoi: item.diem_cuoi || '',
      dinh_muc: toNumber(item.dinh_muc),
      manual: !!item.manual
    };
  }

  function normalizeOilRow(item) {
    item = item || {};
    return {
      key: item.key || uid(),
      ngay: item.ngay || '',
      so_lit: toNumber(item.so_lit),
      so_tien: toNumber(item.so_tien)
    };
  }

  function isCompanyOilEnabled() {
    return state.loaiKeHoach === 'tuyen_xa' && state.driverPayMode === 'theo_chuyen';
  }

  function oilTotalLit() {
    var total = 0;
    $.each(state.oilRows || [], function (_, row) {
      total += toNumber(row.so_lit);
    });
    return total;
  }

  function oilTotalMoney() {
    if (!isCompanyOilEnabled()) return 0;
    var total = 0;
    $.each(state.oilRows || [], function (_, row) {
      total += toNumber(row.so_tien);
    });
    return total;
  }

  function applyDinhMuc(row, force) {
    var amount = findDinhMucAmount(row.diem_dau, row.diem_cuoi, row.trang_thai_xe);
    if (force || !row.manual) {
      row.dinh_muc = amount;
      row.manual = false;
    }
    return amount;
  }

  function actualStart() {
    return (state.plan && (state.plan.bai_lay_thuc_te || state.plan.bai_lay_cont)) || '';
  }

  function actualEnd() {
    return (state.plan && (state.plan.bai_ha_thuc_te || state.plan.bai_ha_cont || state.plan.diem_den)) || '';
  }

  function khoPoint(plan) {
    plan = plan || state.plan || {};
    return plan.dia_chi_kho || plan.diem_den || '';
  }

  function relatedContPlan() {
    if (!state.plan) return null;
    return state.plan.cont_keo_ve_by || state.plan.cont_ref || null;
  }

  function buildDefaultDinhMucRows() {
    var plan = state.plan || {};
    var start = actualStart();
    var end = actualEnd();
    var kho = khoPoint(plan);
    var hinhThuc = plan.hinh_thuc_van_tai || 'cat_keo';
    var rows = [];

    function push(name, status, from, to) {
      var row = normalizeDinhMucRow({
        ten_chang: name,
        trang_thai_xe: status,
        diem_dau: from || '',
        diem_cuoi: to || ''
      }, rows.length);
      applyDinhMuc(row, true);
      rows.push(row);
    }

    if (hinhThuc === 'cat_keo_cheo') {
      var related = relatedContPlan() || {};
      var kho2 = khoPoint(related) || '';
      var end2 = related.bai_ha_thuc_te || related.bai_ha_cont || end;
      push('Chặng 1', 'v', start, kho);
      push('Chặng 2', 't', kho, kho2);
      push('Chặng 3', 'h', kho2, end2);
    }
    else if (hinhThuc === 'rut_mooc') {
      push('Chặng 1', 'v', start, kho);
      push('Chặng 2', 'h', kho, end);
    }
    else if (hinhThuc === 'roi_cont') {
      if (start && kho) push('Chặng 1', 'v', start, kho);
      push('Chặng ' + (rows.length + 1), 'h', kho, end);
    }
    else {
      push('Chặng 1', 'v', start, kho);
      push('Chặng 2', 'h', kho, end);
    }

    return rows;
  }

  function getSavedDinhMucRows() {
    var json = parseJson(state.plan && state.plan.thong_tin_json);
    var saved = json && json.dinh_muc_khoan_lai_xe && $.isArray(json.dinh_muc_khoan_lai_xe.items) ? json.dinh_muc_khoan_lai_xe.items : [];
    return $.map(saved, function (item, index) { return normalizeDinhMucRow(item, index); });
  }

  function rebuildDinhMucRows(useSaved) {
    state.dinhMucRows = useSaved ? getSavedDinhMucRows() : [];
    if (!state.dinhMucRows.length) {
      state.dinhMucRows = buildDefaultDinhMucRows();
    }
    $.each(state.dinhMucRows, function (_, row) {
      addLocationName(row.diem_dau);
      addLocationName(row.diem_cuoi);
      applyDinhMuc(row, false);
    });
    renderDinhMucTable();
  }

  function recalcAllDinhMucRows(rebuildFromPlan) {
    if (rebuildFromPlan) {
      state.dinhMucRows = buildDefaultDinhMucRows();
    }
    else {
      $.each(state.dinhMucRows || [], function (_, row) {
        applyDinhMuc(row, true);
      });
    }
    renderDinhMucTable();
  }

  function countDinhMucMatchedRows() {
    var matched = 0;
    $.each(state.dinhMucRows || [], function (_, row) {
      if (toNumber(row.dinh_muc) > 0) matched += 1;
    });
    return matched;
  }

  function dinhMucTotal() {
    var total = 0;
    $.each(state.dinhMucRows || [], function (_, row) {
      total += toNumber(row.dinh_muc);
    });
    return total;
  }

  function reloadAndRecalcDinhMuc(rebuildFromPlan, targetRow) {
    setBusy(true);
    return loadCustomerDinhMuc()
      .done(function () {
        if (targetRow) {
          applyDinhMuc(targetRow, true);
          renderDinhMucTable();
        }
        else {
          recalcAllDinhMucRows(!!rebuildFromPlan);
        }
        notify('Đã tính lại định mức. Khớp ' + countDinhMucMatchedRows() + '/' + (state.dinhMucRows || []).length + ' chặng.', 'success');
      })
      .fail(function (jqXHR) {
        notify(apiMsg(jqXHR), 'error');
      })
      .always(function () {
        setBusy(false);
      });
  }

  function resolveSource(item) {
    var json = parseJson(item.thong_tin_json);
    if (item.loai_chi_phi === DRIVER_COST_TYPE || item.loai_chi_phi === DRIVER_SALARY_TYPE) return 'lai_xe';
    return json.nguon_nhap === 'lai_xe' ? 'lai_xe' : 'ke_hoach';
  }

  function getSection(type) {
    for (var i = 0; i < COST_SECTIONS.length; i++) {
      if (COST_SECTIONS[i].value === type) return COST_SECTIONS[i];
    }
    return COST_SECTIONS[1];
  }

  function normalizeRow(item, fallbackSource) {
    item = item || {};
    var before = toNumber(item.tong_truoc_vat);
    var after = toNumber(item.tong_sau_vat);
    var unitPrice = toNumber(item.don_gia);
    var quantity = toNumber(item.so_luong || 1) || 1;
    var vat = clampPercent(item.vat_percent);
    var rawType = item.loai_chi_phi || '';
    var type = rawType || (fallbackSource === 'lai_xe' ? DRIVER_COST_TYPE : 'cong_ty_chi_tra');
    if (type !== REVENUE_TYPE && type !== 'tinh_cho_khach' && type !== 'cong_ty_chi_tra' && type !== DRIVER_COST_TYPE && type !== DRIVER_SALARY_TYPE) type = 'cong_ty_chi_tra';
    var source = item.source || fallbackSource || resolveSource($.extend({}, item, { loai_chi_phi: type }));
    if (type === DRIVER_COST_TYPE || type === DRIVER_SALARY_TYPE) source = 'lai_xe';
    else source = 'ke_hoach';
    return {
      key: item.key || (item.nid ? 'nid_' + item.nid : uid()),
      nid: Number(item.nid) || 0,
      nid_ke_hoach: Number(item.nid_ke_hoach) || state.nidKeHoach,
      nid_lai_xe: Number(item.nid_lai_xe) || 0,
      source: source,
      loai_chi_phi: type,
      ten_chi_phi: item.ten_chi_phi || '',
      don_gia: unitPrice,
      so_luong: quantity,
      tong_truoc_vat: before,
      vat_percent: vat,
      tong_sau_vat: after,
      ghi_chu: item.ghi_chu || '',
      thong_tin_json: parseJson(item.thong_tin_json),
      override_before: before > 0 && before !== roundMoney(unitPrice * quantity),
      override_after: after > 0 && after !== roundMoney(before * (1 + vat / 100))
    };
  }

  function createEmptyRow(type) {
    var section = getSection(type);
    return normalizeRow({
      source: section.source,
      loai_chi_phi: section.value,
      so_luong: 1
    }, section.source);
  }

  function getRow(key) {
    for (var i = 0; i < state.rows.length; i++) {
      if (state.rows[i].key === key) return state.rows[i];
    }
    return null;
  }

  function getDinhMucRow(key) {
    for (var i = 0; i < state.dinhMucRows.length; i++) {
      if (state.dinhMucRows[i].key === key) return state.dinhMucRows[i];
    }
    return null;
  }

  function getOilRow(key) {
    for (var i = 0; i < state.oilRows.length; i++) {
      if (state.oilRows[i].key === key) return state.oilRows[i];
    }
    return null;
  }

  function getRowsByType(type) {
    return $.grep(state.rows, function (row) {
      return row.loai_chi_phi === type;
    });
  }

  function findRowByTypeAndName(type, name) {
    name = normalizeKey(name);
    for (var i = 0; i < state.rows.length; i++) {
      if (state.rows[i].loai_chi_phi === type && normalizeKey(state.rows[i].ten_chi_phi) === name) {
        return state.rows[i];
      }
    }
    return null;
  }

  function isBlankRow(row) {
    return toNumber(row.don_gia) === 0
      && toNumber(row.tong_truoc_vat) === 0
      && toNumber(row.tong_sau_vat) === 0
      && !String(row.ghi_chu || '').trim();
  }

  function ensureEmptyRows() {
    for (var i = 0; i < REVENUE_FIELDS.length; i++) {
      if (!findRowByTypeAndName(REVENUE_TYPE, REVENUE_FIELDS[i])) {
        state.rows.push(normalizeRow({
          source: 'ke_hoach',
          loai_chi_phi: REVENUE_TYPE,
          ten_chi_phi: REVENUE_FIELDS[i],
          so_luong: 1
        }, 'ke_hoach'));
      }
    }
  }

  function expenseNameOptions(selectedValue) {
    var selected = String(selectedValue || '').trim();
    var html = '<option value=""></option>';
    var hasSelected = !selected;
    for (var i = 0; i < state.expenseNames.length; i++) {
      var name = String(state.expenseNames[i] || '').trim();
      if (!name) continue;
      if (selected && name.toLowerCase() === selected.toLowerCase()) hasSelected = true;
      html += '<option value="' + escHtml(name) + '"' + (name === selected ? ' selected' : '') + '>' + escHtml(name) + '</option>';
    }
    if (selected && !hasSelected) {
      html += '<option value="' + escHtml(selected) + '" selected>' + escHtml(selected) + '</option>';
    }
    return html;
  }

  function initExpenseSelect2(scope) {
    if (!$.fn || !$.fn.select2) return;
    $(scope).find('.cost-name-select').each(function () {
      var $select = $(this);
      if ($select.data('select2')) $select.select2('destroy');
      $select.select2({
        placeholder: 'Tên chi phí',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#ke-hoach-chi-phi-modal')
      });
    });
  }

  function revenueFieldTemplate(row) {
    return '' +
      '<div class="col">' +
        '<label class="form-label small mb-1">' + escHtml(row.ten_chi_phi) + '</label>' +
        '<input type="text" inputmode="decimal" class="form-control form-control-sm khcp-revenue-field money-input" data-row-key="' + escHtml(row.key) + '" value="' + formatMoney(row.don_gia) + '" placeholder="0">' +
      '</div>';
  }

  function renderRevenueFields() {
    var html = '';
    for (var i = 0; i < REVENUE_FIELDS.length; i++) {
      var row = findRowByTypeAndName(REVENUE_TYPE, REVENUE_FIELDS[i]);
      if (row) html += revenueFieldTemplate(row);
    }
    $('#khcp-revenue-fields').html(html);
  }

  function rowTemplate(row, index) {
    return '' +
      '<tr data-row-key="' + escHtml(row.key) + '">' +
        '<td class="khcp-col-index"><span class="khcp-row-number">' + (index + 1) + '</span></td>' +
        '<td><select class="form-select form-select-sm row-field cost-name cost-name-select" data-field="ten_chi_phi">' + expenseNameOptions(row.ten_chi_phi) + '</select></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm row-field money-input" data-field="don_gia" value="' + formatMoney(row.don_gia) + '"></td>' +
        '<td><input type="number" min="1" step="1" class="form-control form-control-sm row-field qty-input" data-field="so_luong" value="' + Math.max(1, parseInt(row.so_luong, 10) || 1) + '"></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm money-input calculated-input ' + (row.override_before ? 'is-overridden' : '') + '" data-field="tong_truoc_vat" value="' + formatMoney(row.tong_truoc_vat) + '" readonly disabled></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm row-field decimal-input vat-input" data-field="vat_percent" value="' + formatDecimal(row.vat_percent) + '"></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm money-input calculated-input ' + (row.override_after ? 'is-overridden' : '') + '" data-field="tong_sau_vat" value="' + formatMoney(row.tong_sau_vat) + '" readonly disabled></td>' +
        '<td><input type="text" class="form-control form-control-sm row-field" data-field="ghi_chu" value="' + escHtml(row.ghi_chu) + '" placeholder="Ghi chú"></td>' +
        '<td><div class="khcp-row-actions">' +
          '<button type="button" class="btn btn-label-danger btn-sm btn-delete-row" title="Xoá dòng"><i class="ti tabler-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
  }

  function sectionTemplate(section) {
    return '' +
      '<tr class="khcp-type-divider" data-cost-type="' + escHtml(section.value) + '">' +
        '<td class="text-center py-1">' +
          '<button type="button" class="btn btn-sm btn-icon btn-primary btn-add-row text-white" data-cost-type="' + escHtml(section.value) + '" title="Thêm dòng">' +
            '<i class="ti tabler-plus"></i>' +
          '</button>' +
        '</td>' +
        '<td colspan="8" class="py-2 px-3"><strong class="small">' + escHtml(section.label) + '</strong></td>' +
      '</tr>';
  }

  function renderTable() {
    var html = '';
    for (var s = 0; s < COST_SECTIONS.length; s++) {
      var section = COST_SECTIONS[s];
      var rows = getRowsByType(section.value);
      html += sectionTemplate(section);
      for (var i = 0; i < rows.length; i++) {
        html += rowTemplate(rows[i], i);
      }
    }
    $('#khcp-cost-table-body').html(html);
    initExpenseSelect2('#khcp-cost-table-body');
  }

  function dinhMucRowTemplate(row, index) {
    return '' +
      '<tr data-dm-key="' + escHtml(row.key) + '">' +
        '<td class="khcp-col-index"><span class="khcp-row-number">' + (index + 1) + '</span></td>' +
        '<td><input type="text" class="form-control form-control-sm khcp-dm-field" data-field="ten_chang" value="' + escHtml(row.ten_chang) + '"></td>' +
        '<td><select class="form-select form-select-sm khcp-dm-field" data-field="trang_thai_xe">' + statusOptions(row.trang_thai_xe) + '</select></td>' +
        '<td><select class="form-select form-select-sm khcp-dm-field khcp-dm-place-select" data-field="diem_dau">' + locationOptions(row.diem_dau) + '</select></td>' +
        '<td><select class="form-select form-select-sm khcp-dm-field khcp-dm-place-select" data-field="diem_cuoi">' + locationOptions(row.diem_cuoi) + '</select></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm khcp-dm-field money-input" data-field="dinh_muc" value="' + formatMoney(row.dinh_muc) + '"></td>' +
        '<td><div class="khcp-row-actions">' +
          '<button type="button" class="btn btn-label-primary btn-sm btn-dm-recalc-row" title="Tính lại định mức"><i class="ti tabler-refresh"></i></button>' +
          '<button type="button" class="btn btn-label-danger btn-sm btn-dm-delete-row" title="Xoá chặng"><i class="ti tabler-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
  }

  function updateDinhMucSummary() {
    var total = dinhMucTotal();
    var matched = 0;
    var missing = 0;
    $.each(state.dinhMucRows || [], function (_, row) {
      if (toNumber(row.dinh_muc) > 0) matched += 1;
      else missing += 1;
    });
    $('#khcp-dm-total').text(formatMoney(total));
    $('#khcp-dm-matched').text(matched);
    $('#khcp-dm-missing').text(missing);
    $('#khcp-dm-count').text((state.dinhMucRows || []).length + ' chặng');
    updateSummary();
  }

  function renderDinhMucTable() {
    var rows = state.dinhMucRows || [];
    var html = '';
    if (!rows.length) {
      html = '<tr><td colspan="7" class="text-center text-muted py-3">Chưa có chặng định mức</td></tr>';
    }
    else {
      for (var i = 0; i < rows.length; i++) {
        html += dinhMucRowTemplate(rows[i], i);
      }
    }
    $('#khcp-dm-table-body').html(html);
    initDinhMucSelect2('#khcp-dm-table-body');
    updateDinhMucSummary();
  }

  function oilRowTemplate(row, index) {
    return '' +
      '<tr data-oil-key="' + escHtml(row.key) + '">' +
        '<td><input type="text" class="form-control form-control-sm khcp-oil-field khcp-oil-date" data-field="ngay" value="' + escHtml(apiToDate(row.ngay)) + '" placeholder="dd/mm/yyyy"></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm khcp-oil-field decimal-input" data-field="so_lit" value="' + escHtml(formatDecimal(row.so_lit)) + '" placeholder="0"></td>' +
        '<td><input type="text" inputmode="numeric" class="form-control form-control-sm khcp-oil-field money-input" data-field="so_tien" value="' + formatMoney(row.so_tien) + '" placeholder="0"></td>' +
        '<td><div class="khcp-row-actions"><button type="button" class="btn btn-sm btn-label-danger btn-oil-delete-row" title="Xoá dòng"><i class="ti tabler-trash"></i></button></div></td>' +
      '</tr>';
  }

  function renderOilTable() {
    var html = '';
    var enabled = isCompanyOilEnabled();
    var rows = state.oilRows || [];
    if (!rows.length) {
      html = '<tr><td colspan="4" class="text-center text-muted py-3">Chưa có dữ liệu dầu</td></tr>';
    }
    else {
      $.each(rows, function (index, row) {
        html += oilRowTemplate(row, index);
      });
    }
    $('#khcp-oil-table-body').html(html);
    $('#khcp-oil-table-wrap, #khcp-oil-add-row').toggle(enabled);
    $('#khcp-oil-card').toggle(state.loaiKeHoach === 'tuyen_xa');
    updateOilSummary();
    $('#khcp-oil-table-body').find('.khcp-oil-date').each(function () {
      if (typeof flatpickr !== 'undefined') {
        flatpickr(this, {
          enableTime: false,
          dateFormat: 'd/m/Y',
          allowInput: true,
          static: false,
          appendTo: document.body
        });
      }
    });
  }

  function focusLastOilDatePicker() {
    window.setTimeout(function () {
      var input = $('#khcp-oil-table-body tr:last .khcp-oil-date')[0];
      if (!input) return;
      input.focus();
      if (input._flatpickr) {
        input._flatpickr.open();
      }
    }, 0);
  }

  function updateOilSummary() {
    var enabled = isCompanyOilEnabled();
    $('#khcp-oil-table-wrap, #khcp-oil-add-row').toggle(enabled);
    $('#khcp-oil-card').toggle(state.loaiKeHoach === 'tuyen_xa');
    updateDriverPayModeButton();
    $('#khcp-oil-total-lit').text(enabled ? formatDecimal(oilTotalLit()) : '0');
    $('#khcp-oil-total-money').text(formatMoney(oilTotalMoney()));
  }

  function updateDriverPayModeButton() {
    var isTuyenXa = state.loaiKeHoach === 'tuyen_xa';
    var isTripSalary = state.driverPayMode === 'theo_chuyen';
    var $btn = $('#khcp-driver-pay-mode-btn');
    $btn.toggle(isTuyenXa);
    $btn
      .toggleClass('btn-label-secondary', !isTripSalary)
      .toggleClass('btn-label-primary', isTripSalary)
      .attr('title', isTripSalary ? 'Click để chuyển về chuyến khoán' : 'Click để chuyển sang tính lương theo chuyến')
      .html(isTripSalary
        ? '<i class="ti tabler-gas-station me-1"></i><span>Tính lương theo chuyến</span>'
        : '<i class="ti tabler-cash me-1"></i><span>Chuyến khoán</span>');
  }

  function updateSummary() {
    var company = 0;
    var driverSelf = 0;
    var driverSalaryExtra = 0;
    var customer = 0;
    var revenue = 0;
    var driverSalary = dinhMucTotal();
    var rows = $.grep(state.rows, function (row) { return !isBlankRow(row); });
    $.each(rows, function (_, row) {
      var amount = toNumber(row.tong_sau_vat);
      if (row.loai_chi_phi === 'cong_ty_chi_tra') company += amount;
      if (row.loai_chi_phi === 'lai_xe_tu_chiu') driverSelf += amount;
      if (row.loai_chi_phi === DRIVER_SALARY_TYPE) driverSalaryExtra += amount;
      if (row.loai_chi_phi === 'tinh_cho_khach') customer += amount;
      if (row.loai_chi_phi === REVENUE_TYPE) revenue += amount;
    });
    company += oilTotalMoney();
    driverSalary += driverSalaryExtra;
    $('#khcp-revenue-total').text(formatMoney(revenue));
    $('#khcp-total-revenue').text(formatMoney(revenue));
    $('#khcp-total-company').text(formatMoney(company));
    $('#khcp-total-driver-self').text(formatMoney(driverSelf));
    $('#khcp-total-driver-salary').text(formatMoney(driverSalary));
    $('#khcp-total-customer').text(formatMoney(customer));
    $('#khcp-total-all').text(formatMoney(company + driverSelf + driverSalary + customer + revenue));
  }

  function clearPlanInfo() {
    state.plan = null;
    $('#khcp-header-meta').text('').attr('title', '');
    updateTransportBadge('');
    $('#khcp-info-customer, #khcp-info-bkg-cont, #khcp-info-vehicle-driver, #khcp-info-route').text('-').attr('title', '-');
  }

  function fillPlanInfo(plan) {
    state.plan = plan || {};
    state.driverPayMode = state.plan.hinh_thuc_tinh_luong_lai_xe || (state.plan.thong_tin_json && state.plan.thong_tin_json.hinh_thuc_tinh_luong_lai_xe) || 'khoan';
    if ($.inArray(state.driverPayMode, ['khoan', 'theo_chuyen']) === -1) state.driverPayMode = 'khoan';
    var customer = state.plan.khach_hang && state.plan.khach_hang.ten ? state.plan.khach_hang.ten : '';
    var vehicle = state.plan.phuong_tien && state.plan.phuong_tien.bks ? state.plan.phuong_tien.bks : '';
    var driver = state.plan.lai_xe && state.plan.lai_xe.ten ? state.plan.lai_xe.ten : '';
    var cont = [state.plan.loai_cont, state.plan.so_cont].filter(Boolean).join(' - ');
    var bkgCont = [state.plan.so_bkg, cont].filter(Boolean).join(' / ');
    var vehicleDriver = [vehicle, driver].filter(Boolean).join(' / ');
    var route = planRouteText(state.plan);
    var headerMeta = [customer, bkgCont].filter(Boolean).join(' - ');
    $('#khcp-header-meta').text(headerMeta).attr('title', headerMeta);
    updateTransportBadge(state.plan.hinh_thuc_van_tai || '');
    setInfoText('#khcp-info-customer', customer);
    setInfoText('#khcp-info-bkg-cont', bkgCont);
    setInfoText('#khcp-info-vehicle-driver', vehicleDriver);
    setInfoText('#khcp-info-route', route);
    if (!state.nidLaiXe && state.plan.lai_xe && state.plan.lai_xe.nid) {
      state.nidLaiXe = Number(state.plan.lai_xe.nid) || 0;
    }
  }

  function renderAll() {
    ensureEmptyRows();
    renderDinhMucTable();
    renderRevenueFields();
    renderTable();
    renderOilTable();
    updateSummary();
    setBusy(state.busy);
  }

  function updateRowDom(row, preserveField) {
    var $tr = $('tr[data-row-key="' + row.key + '"]');
    var $before = $tr.find('[data-field="tong_truoc_vat"]');
    var $after = $tr.find('[data-field="tong_sau_vat"]');
    if (preserveField !== 'tong_truoc_vat') $before.val(formatMoney(row.tong_truoc_vat));
    if (preserveField !== 'tong_sau_vat') $after.val(formatMoney(row.tong_sau_vat));
    $before.toggleClass('is-overridden', row.override_before);
    $after.toggleClass('is-overridden', row.override_after);
  }

  function calculateRow(row, changedField) {
    if (changedField === 'don_gia' || changedField === 'so_luong') {
      if (!row.override_before) row.tong_truoc_vat = roundMoney(row.don_gia * row.so_luong);
      if (!row.override_after) row.tong_sau_vat = roundMoney(row.tong_truoc_vat * (1 + row.vat_percent / 100));
    }
    if (changedField === 'tong_truoc_vat') {
      row.override_before = true;
      if (!row.override_after) row.tong_sau_vat = roundMoney(row.tong_truoc_vat * (1 + row.vat_percent / 100));
    }
    if (changedField === 'vat_percent' && !row.override_after) {
      row.tong_sau_vat = roundMoney(row.tong_truoc_vat * (1 + row.vat_percent / 100));
    }
    if (changedField === 'tong_sau_vat') row.override_after = true;
  }

  function validateRow(row, mark) {
    if (row.loai_chi_phi === REVENUE_TYPE) return true;
    var hasMoney = toNumber(row.don_gia) > 0 || toNumber(row.tong_truoc_vat) > 0 || toNumber(row.tong_sau_vat) > 0;
    var hasName = String(row.ten_chi_phi || '').trim().length > 0;
    var valid = !hasMoney || (hasName && hasExpenseName(row.ten_chi_phi));
    if (mark) {
      var $tr = $('tr[data-row-key="' + row.key + '"]');
      $tr.toggleClass('is-invalid-row', !valid);
      $tr.find('.cost-name').toggleClass('is-invalid', !valid);
    }
    return valid;
  }

  function setBusy(busy) {
    state.busy = !!busy;
    $('#khcp-loading').toggleClass('is-visible', state.busy);
    $('#ke-hoach-chi-phi-modal button, #ke-hoach-chi-phi-modal select').prop('disabled', state.busy);
    $('#ke-hoach-chi-phi-modal input').not('[readonly]').prop('disabled', state.busy);
  }

  function payloadFromRow(row) {
    if (row.source === 'lai_xe' && row.loai_chi_phi !== DRIVER_SALARY_TYPE) {
      row.loai_chi_phi = DRIVER_COST_TYPE;
    }
    if (row.source !== 'lai_xe' && row.loai_chi_phi === DRIVER_COST_TYPE) {
      row.loai_chi_phi = 'cong_ty_chi_tra';
    }
    var json = $.extend({}, row.thong_tin_json || {});
    delete json.nguon_nhap;
    return {
      nid_ke_hoach: state.nidKeHoach,
      loai_ke_hoach: state.loaiKeHoach || 'thuong',
      nid_lai_xe: row.source === 'lai_xe' ? (row.nid_lai_xe || state.nidLaiXe || 0) : (row.nid_lai_xe || 0),
      loai_chi_phi: row.loai_chi_phi,
      ten_chi_phi: String(row.ten_chi_phi || '').trim(),
      don_gia: toNumber(row.don_gia),
      so_luong: toNumber(row.so_luong),
      tong_truoc_vat: toNumber(row.tong_truoc_vat),
      vat_percent: clampPercent(row.vat_percent),
      tong_sau_vat: toNumber(row.tong_sau_vat),
      ghi_chu: String(row.ghi_chu || '').trim(),
      thong_tin_json: json
    };
  }

  function loadRows() {
    if (!state.nidKeHoach) return $.Deferred().resolve().promise();
    setBusy(true);
    return fetchRows()
      .always(function () {
        setBusy(false);
      });
  }

  function fetchRows() {
    if (!state.nidKeHoach) return $.Deferred().resolve().promise();
    return $.getJSON(API_BASE, { nid_ke_hoach: state.nidKeHoach, limit: 100 })
      .done(function (response) {
        var items = response && response.data && response.data.items ? response.data.items : [];
        state.rows = $.map(items, function (item) { return normalizeRow(item); });
        renderAll();
      })
      .fail(function (jqXHR) {
        state.rows = [];
        renderAll();
        notify(apiMsg(jqXHR), 'error');
      });
  }

  function loadPlanInfo() {
    if (!state.nidKeHoach) return $.Deferred().resolve().promise();
    clearPlanInfo();
    return $.getJSON('/api/ke-hoach-xep-xe/' + state.nidKeHoach)
      .done(function (response) {
        if (response && response.status === 'success' && response.data) {
          fillPlanInfo(response.data);
        }
      });
  }

  function loadOilRows() {
    state.oilRows = [];
    if (!state.nidKeHoach || state.loaiKeHoach !== 'tuyen_xa') return $.Deferred().resolve().promise();
    return $.getJSON('/api/ke-hoach-tuyen-xa-dau', { nid_ke_hoach: state.nidKeHoach, limit: 100 })
      .done(function (response) {
        var items = response && response.data && response.data.items ? response.data.items : [];
        state.oilRows = $.map(items, function (item) { return normalizeOilRow(item); });
      });
  }

  function dinhMucPayload() {
    var items = $.map(state.dinhMucRows || [], function (row, index) {
      return {
        ten_chang: row.ten_chang || ('Chặng ' + (index + 1)),
        trang_thai_xe: row.trang_thai_xe || 'v',
        diem_dau: row.diem_dau || '',
        diem_cuoi: row.diem_cuoi || '',
        dinh_muc: toNumber(row.dinh_muc),
        manual: row.manual ? 1 : 0
      };
    });
    return {
      items: items,
      tong_khoan: dinhMucTotal()
    };
  }

  function persistDinhMucRows() {
    if (!state.nidKeHoach) return $.Deferred().resolve({ skipped: true }).promise();
    var payload = {
      dinh_muc_khoan_lai_xe: dinhMucPayload()
    };
    if (state.loaiKeHoach === 'tuyen_xa') {
      payload.hinh_thuc_tinh_luong_lai_xe = state.driverPayMode;
    }
    return $.ajax({
      url: '/api/quan-ly-cont/' + state.nidKeHoach,
      method: 'PUT',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payload)
    }).done(function (response) {
      if (response && response.status === 'success' && response.data) {
        fillPlanInfo(response.data);
      }
    });
  }

  function oilPayload() {
    var items = $.map(state.oilRows || [], function (row) {
      var item = {
        ngay: dateToApi(row.ngay),
        so_lit: toNumber(row.so_lit),
        so_tien: toNumber(row.so_tien)
      };
      if (!item.ngay && !item.so_lit && !item.so_tien) return null;
      return item;
    });
    return {
      nid_ke_hoach: state.nidKeHoach,
      items: items
    };
  }

  function persistOilRows() {
    if (!state.nidKeHoach || state.loaiKeHoach !== 'tuyen_xa') return $.Deferred().resolve({ skipped: true }).promise();
    return $.ajax({
      url: '/api/ke-hoach-tuyen-xa-dau',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(oilPayload())
    }).done(function (response) {
      var items = response && response.data && response.data.items ? response.data.items : [];
      state.oilRows = $.map(items, function (item) { return normalizeOilRow(item); });
    });
  }

  function saveRow(row, silent) {
    if (isBlankRow(row) && !row.nid) return $.Deferred().resolve({ skipped: true }).promise();
    if (!validateRow(row, true)) return $.Deferred().reject({ message: 'Vui lòng chọn tên chi phí từ danh mục.' }).promise();
    var isUpdate = row.nid > 0;
    return $.ajax({
      url: isUpdate ? API_BASE + '/' + row.nid : API_BASE,
      method: isUpdate ? 'PUT' : 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payloadFromRow(row))
    })
      .done(function (response) {
        if (response && response.data && response.data.nid) {
          row.nid = Number(response.data.nid) || row.nid;
          row.key = 'nid_' + row.nid;
        }
        if (!silent) notify('Đã lưu chi phí.', 'success');
      });
  }

  function saveRowsBulk(rows) {
    if (!rows.length) return $.Deferred().resolve({ skipped: true }).promise();
    var items = $.map(rows, function (row) {
      return $.extend({ nid: row.nid || 0, client_key: row.key }, payloadFromRow(row));
    });
    return $.ajax({
      url: API_BASE + '/bulk',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({ items: items })
    }).done(function (response) {
      var savedItems = response && response.data && $.isArray(response.data.items) ? response.data.items : [];
      $.each(savedItems, function (_, item) {
        if (!item || !item.client_key || !item.nid) return;
        var row = getRow(item.client_key);
        if (!row) return;
        row.nid = Number(item.nid) || row.nid;
        row.key = 'nid_' + row.nid;
      });
    });
  }

  function saveAllRows() {
    var rows = $.grep(state.rows, function (row) { return !isBlankRow(row) || row.nid > 0; });
    var invalidRows = $.grep(rows, function (row) { return !validateRow(row, true); });
    if (invalidRows.length) {
      notify('Vui lòng chọn tên chi phí từ danh mục cho các dòng có số tiền.', 'error');
      $('tr[data-row-key="' + invalidRows[0].key + '"] .cost-name').trigger('focus');
      return;
    }
    if (!rows.length && !(state.dinhMucRows || []).length) {
      notify('Chưa có dữ liệu cần lưu.', 'error');
      return;
    }
    setBusy(true);
    var chain = persistDinhMucRows().then(function () {
      return saveRowsBulk(rows);
    }).then(function () {
      return persistOilRows();
    });
    chain.done(function () {
      notify('Đã lưu toàn bộ dữ liệu chi phí.', 'success');
      loadRows();
    }).fail(function (error) {
      notify(error && error.responseText ? apiMsg(error) : (error && error.message ? error.message : 'Lưu dữ liệu chi phí thất bại.'), 'error');
    }).always(function () {
      setBusy(false);
    });
  }

  function deleteRow(row) {
    if (!row.nid) {
      state.rows = $.grep(state.rows, function (item) { return item.key !== row.key; });
      renderAll();
      return;
    }
    if (!window.confirm('Xoá dòng chi phí này?')) return;
    setBusy(true);
    $.ajax({ url: API_BASE + '/' + row.nid, method: 'DELETE', dataType: 'json' })
      .done(function () {
        state.rows = $.grep(state.rows, function (item) { return item.key !== row.key; });
        renderAll();
        notify('Đã xoá chi phí.', 'success');
      })
      .fail(function (jqXHR) {
        notify(apiMsg(jqXHR), 'error');
      })
      .always(function () {
        setBusy(false);
      });
  }

  function openModal($button) {
    state.nidKeHoach = Number($button.data('id')) || 0;
    state.nidLaiXe = Number($button.data('nid-lai-xe')) || 0;
    state.loaiKeHoach = String($button.data('loai-ke-hoach') || 'thuong');
    state.rows = [];
    state.dinhMucRows = [];
    state.dinhMucRoutes = [];
    state.oilRows = [];
    state.driverPayMode = 'khoan';
    $('#khcp-plan-code').text('#' + state.nidKeHoach);
    clearPlanInfo();
    setBusy(true);
    renderAll();
    if (!modal) {
      modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(document.getElementById('ke-hoach-chi-phi-modal'), { backdrop: 'static', keyboard: true }) : new bootstrap.Modal(document.getElementById('ke-hoach-chi-phi-modal'), { backdrop: 'static', keyboard: true });
    }
    modal.show();
    var planChain = loadPlanInfo().then(loadCustomerDinhMuc);
    $.when(loadExpenseNames(), loadLocations(), planChain, loadOilRows(), fetchRows())
      .done(function () {
        rebuildDinhMucRows(true);
      })
      .fail(function (jqXHR) {
        notify(jqXHR && jqXHR.responseText ? apiMsg(jqXHR) : 'Không tải được dữ liệu modal chi phí', 'error');
      })
      .always(function () {
        renderAll();
        setBusy(false);
      });
  }

  function bindEvents() {
    if (bindEvents._bound) return;
    bindEvents._bound = true;

    $(document).on('click', '.btn-open-ke-hoach-chi-phi', function (e) {
      e.preventDefault();
      openModal($(this));
    });
    $(document).on('click', '.btn-add-row', function () {
      var type = String($(this).data('cost-type') || 'cong_ty_chi_tra');
      var row = createEmptyRow(type);
      state.rows.push(row);
      renderTable();
      updateSummary();
      $('tr[data-row-key="' + row.key + '"] .cost-name').trigger('focus');
    });
    $(document).on('click', '#khcp-dm-add-row', function () {
      var row = normalizeDinhMucRow({ manual: true }, state.dinhMucRows.length);
      state.dinhMucRows.push(row);
      renderDinhMucTable();
      $('tr[data-dm-key="' + row.key + '"] .khcp-dm-place-select').first().trigger('focus');
    });
    $(document).on('click', '#khcp-oil-add-row', function () {
      state.oilRows.push(normalizeOilRow({}));
      renderOilTable();
      updateSummary();
      focusLastOilDatePicker();
    });
    $(document).on('click', '.btn-oil-delete-row', function () {
      var key = $(this).closest('tr').data('oil-key');
      state.oilRows = $.grep(state.oilRows, function (row) { return row.key !== key; });
      renderOilTable();
      updateSummary();
    });
    $(document).on('click', '#khcp-driver-pay-mode-btn', function () {
      state.driverPayMode = state.driverPayMode === 'theo_chuyen' ? 'khoan' : 'theo_chuyen';
      renderOilTable();
      updateSummary();
    });
    $(document).on('click', '#khcp-dm-rebuild', function (e) {
      e.preventDefault();
      confirmAction({
        title: 'Tính lại định mức?',
        text: 'Hệ thống sẽ tạo lại các chặng theo thông tin kế hoạch hiện tại và ghi đè danh sách định mức đang nhập.',
        icon: 'warning',
        confirmButtonText: 'Tính lại',
        confirmButtonClass: 'btn btn-primary'
      }, function () {
        reloadAndRecalcDinhMuc(true);
      });
    });
    $(document).on('click', '.btn-dm-recalc-row', function (e) {
      e.preventDefault();
      var row = getDinhMucRow($(this).closest('tr').data('dm-key'));
      if (!row) return;
      reloadAndRecalcDinhMuc(false, row);
    });
    $(document).on('click', '.btn-dm-delete-row', function () {
      var key = $(this).closest('tr').data('dm-key');
      state.dinhMucRows = $.grep(state.dinhMucRows, function (row) { return row.key !== key; });
      renderDinhMucTable();
    });
    $(document).on('input change', '.khcp-dm-field', function () {
      var $input = $(this);
      var row = getDinhMucRow($input.closest('tr').data('dm-key'));
      var field = $input.data('field');
      if (!row || !field) return;
      if ($input.hasClass('money-input')) formatMoneyInputKeepingCaret(this);
      row[field] = $input.hasClass('money-input') ? toNumber($input.val()) : $input.val();
      if (field === 'dinh_muc') row.manual = true;
      if ($.inArray(field, ['diem_dau', 'diem_cuoi', 'trang_thai_xe']) !== -1) applyDinhMuc(row, false);
      updateDinhMucSummary();
      if ($.inArray(field, ['diem_dau', 'diem_cuoi', 'trang_thai_xe']) !== -1) {
        var $tr = $input.closest('tr');
        $tr.find('[data-field="dinh_muc"]').val(formatMoney(row.dinh_muc));
      }
    });
    $(document).on('input change', '.khcp-revenue-field', function () {
      var $input = $(this);
      var row = getRow($input.data('row-key'));
      if (!row) return;
      formatMoneyInputKeepingCaret(this);
      var amount = toNumber($input.val());
      row.don_gia = amount;
      row.so_luong = 1;
      row.tong_truoc_vat = amount;
      row.vat_percent = 0;
      row.tong_sau_vat = amount;
      row.source = 'ke_hoach';
      row.loai_chi_phi = REVENUE_TYPE;
      updateSummary();
    });
    $(document).on('input change', '.row-field', function () {
      var $input = $(this);
      var row = getRow($input.closest('tr').data('row-key'));
      var field = $input.data('field');
      if (!row || !field) return;
      if ($input.hasClass('money-input')) formatMoneyInputKeepingCaret(this);
      row[field] = ($input.hasClass('money-input') || $input.hasClass('decimal-input') || $input.hasClass('qty-input')) ? toNumber($input.val()) : $input.val();
      if (field === 'so_luong') row[field] = Math.max(1, parseInt(row[field], 10) || 1);
      if (field === 'vat_percent') row[field] = clampPercent(row[field]);
      calculateRow(row, field);
      validateRow(row, false);
      if ($.inArray(field, ['don_gia', 'so_luong', 'tong_truoc_vat', 'vat_percent', 'tong_sau_vat']) !== -1) updateRowDom(row, field);
      updateSummary();
    });
    $(document).on('input change', '.khcp-oil-field', function () {
      var $input = $(this);
      var row = getOilRow($input.closest('tr').data('oil-key'));
      var field = $input.data('field');
      if (!row || !field) return;
      if ($input.hasClass('money-input')) formatMoneyInputKeepingCaret(this);
      row[field] = field === 'ngay' ? dateToApi($input.val()) : toNumber($input.val());
      updateOilSummary();
      updateSummary();
    });
    $(document).on('focus', '.decimal-input, .qty-input', function () {
      this.select();
    });
    $(document).on('blur', '.money-input', function () {
      $(this).val(formatMoney(toNumber($(this).val())));
    });
    $(document).on('blur', '.decimal-input', function () {
      var val = $(this).hasClass('vat-input') ? clampPercent($(this).val()) : toNumber($(this).val());
      $(this).val(formatDecimal(val));
    });
    $(document).on('blur', '.qty-input', function () {
      $(this).val(Math.max(1, parseInt($(this).val(), 10) || 1));
    });
    $(document).on('click', '.btn-delete-row', function () {
      var row = getRow($(this).closest('tr').data('row-key'));
      if (row) deleteRow(row);
    });
    $(document).on('click', '#khcp-reload', loadRows);
    $(document).on('click', '#khcp-save-all, #khcp-save-all-footer', saveAllRows);
    $('#ke-hoach-chi-phi-modal').on('hidden.bs.modal', function () {
      state.nidKeHoach = 0;
      state.rows = [];
      state.oilRows = [];
    });
  }

  Drupal.behaviors.keHoachChiPhi = {
    attach: function (context) {
      if ($('#ke-hoach-chi-phi-modal', context).length || $('#ke-hoach-list-app', context).length) {
        bindEvents();
      }
    }
  };
})(jQuery, Drupal, window, document);

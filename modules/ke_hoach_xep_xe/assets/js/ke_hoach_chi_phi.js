(function ($, Drupal, window, document) {
  'use strict';

  var API_BASE = '/api/ke-hoach-chi-phi';
  var PLAN_COST_TYPES = [
    { value: 'cong_ty_chi_tra', label: 'Cty chi trả' },
    { value: 'tinh_cho_khach', label: 'Tính cho khách' }
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

  function formatDecimal(value) {
    var number = Number(value) || 0;
    if (Math.round(number) === number) {
      return String(number);
    }
    return String(Math.round(number * 100) / 100).replace('.', ',');
  }

  function textOrDash(value) {
    value = String(value || '').trim();
    return value || '-';
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

  function hasExpenseCatalogName(name) {
    name = String(name || '').trim().toLowerCase();
    if (!name) return true;
    for (var i = 0; i < state.expenseCatalogNames.length; i++) {
      if (String(state.expenseCatalogNames[i] || '').trim().toLowerCase() === name) return true;
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

  function ensureExpenseNameInCatalog(name) {
    name = String(name || '').trim();
    if (!name || hasExpenseCatalogName(name)) return $.Deferred().resolve().promise();
    var done = $.Deferred();
    $.ajax({
      url: '/api/danh-muc',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        ten: name,
        phan_loai: 'Chi phí',
        hoat_dong: 1
      })
    }).always(function () {
      if (!hasExpenseCatalogName(name)) state.expenseCatalogNames.push(name);
      addExpenseName(name);
      done.resolve();
    });
    return done.promise();
  }

  function resolveSource(item) {
    var json = parseJson(item.thong_tin_json);
    return json.nguon_nhap === 'lai_xe' ? 'lai_xe' : 'ke_hoach';
  }

  function normalizeRow(item, fallbackSource) {
    item = item || {};
    var before = toNumber(item.tong_truoc_vat);
    var after = toNumber(item.tong_sau_vat);
    var unitPrice = toNumber(item.don_gia);
    var quantity = toNumber(item.so_luong || 1) || 1;
    var vat = clampPercent(item.vat_percent);
    var source = item.source || fallbackSource || resolveSource(item);
    var type = source === 'lai_xe' ? DRIVER_COST_TYPE : (item.loai_chi_phi === DRIVER_COST_TYPE ? 'cong_ty_chi_tra' : (item.loai_chi_phi || 'cong_ty_chi_tra'));
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

  function createEmptyRow(source) {
    return normalizeRow({
      source: source,
      loai_chi_phi: source === 'lai_xe' ? DRIVER_COST_TYPE : 'cong_ty_chi_tra',
      so_luong: 1
    }, source);
  }

  function getRow(key) {
    for (var i = 0; i < state.rows.length; i++) {
      if (state.rows[i].key === key) return state.rows[i];
    }
    return null;
  }

  function getRowsBySource(source) {
    return $.grep(state.rows, function (row) {
      return row.source === source;
    });
  }

  function isBlankRow(row) {
    return !String(row.ten_chi_phi || '').trim()
      && toNumber(row.don_gia) === 0
      && toNumber(row.tong_truoc_vat) === 0
      && toNumber(row.tong_sau_vat) === 0;
  }

  function ensureEmptyRows() {
    if (!getRowsBySource('ke_hoach').length) state.rows.push(createEmptyRow('ke_hoach'));
    if (!getRowsBySource('lai_xe').length) state.rows.push(createEmptyRow('lai_xe'));
  }

  function optionHtml(selectedValue) {
    var html = '';
    for (var i = 0; i < PLAN_COST_TYPES.length; i++) {
      html += '<option value="' + escHtml(PLAN_COST_TYPES[i].value) + '"' + (PLAN_COST_TYPES[i].value === selectedValue ? ' selected' : '') + '>' + escHtml(PLAN_COST_TYPES[i].label) + '</option>';
    }
    return html;
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
        tags: true,
        placeholder: 'Tên chi phí',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#ke-hoach-chi-phi-modal'),
        createTag: function (params) {
          var term = $.trim(params.term || '');
          if (!term) return null;
          return { id: term, text: term, newTag: true };
        }
      });
    });
  }

  function rowTemplate(row, index) {
    var typeCell = row.source === 'lai_xe' ? '' : '<td><select class="form-select form-select-sm row-field" data-field="loai_chi_phi">' + optionHtml(row.loai_chi_phi) + '</select></td>';
    return '' +
      '<tr data-row-key="' + escHtml(row.key) + '">' +
        '<td class="khcp-col-index"><span class="khcp-row-number">' + (index + 1) + '</span></td>' +
        typeCell +
        '<td><select class="form-select form-select-sm row-field cost-name cost-name-select" data-field="ten_chi_phi">' + expenseNameOptions(row.ten_chi_phi) + '</select></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm row-field money-input" data-field="don_gia" value="' + formatMoney(row.don_gia) + '"></td>' +
        '<td><input type="number" min="1" step="1" class="form-control form-control-sm row-field qty-input" data-field="so_luong" value="' + Math.max(1, parseInt(row.so_luong, 10) || 1) + '"></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm money-input calculated-input ' + (row.override_before ? 'is-overridden' : '') + '" data-field="tong_truoc_vat" value="' + formatMoney(row.tong_truoc_vat) + '" readonly disabled></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm row-field decimal-input vat-input" data-field="vat_percent" value="' + formatDecimal(row.vat_percent) + '"></td>' +
        '<td><input type="text" inputmode="decimal" class="form-control form-control-sm money-input calculated-input ' + (row.override_after ? 'is-overridden' : '') + '" data-field="tong_sau_vat" value="' + formatMoney(row.tong_sau_vat) + '" readonly disabled></td>' +
        '<td><input type="text" class="form-control form-control-sm row-field" data-field="ghi_chu" value="' + escHtml(row.ghi_chu) + '" placeholder="Ghi chú"></td>' +
        '<td><div class="khcp-row-actions">' +
          '<button type="button" class="btn btn-label-primary btn-sm btn-add-row" title="Thêm dòng"><i class="ti tabler-plus"></i></button>' +
          '<button type="button" class="btn btn-label-danger btn-sm btn-delete-row" title="Xoá dòng"><i class="ti tabler-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
  }

  function renderTable(source) {
    var rows = getRowsBySource(source);
    var html = '';
    for (var i = 0; i < rows.length; i++) {
      html += rowTemplate(rows[i], i);
    }
    var target = source === 'ke_hoach' ? '#khcp-plan-table-body' : '#khcp-driver-table-body';
    $(target).html(html);
    initExpenseSelect2(target);
  }

  function updateSummary() {
    var company = 0;
    var driverSelf = 0;
    var customer = 0;
    var planSource = 0;
    var driverSource = 0;
    var rows = $.grep(state.rows, function (row) { return !isBlankRow(row); });
    $.each(rows, function (_, row) {
      var amount = toNumber(row.tong_sau_vat);
      if (row.loai_chi_phi === 'cong_ty_chi_tra') company += amount;
      if (row.loai_chi_phi === 'lai_xe_tu_chiu') driverSelf += amount;
      if (row.loai_chi_phi === 'tinh_cho_khach') customer += amount;
      if (row.source === 'lai_xe') driverSource += amount;
      else planSource += amount;
    });
    $('#khcp-total-company').text(formatMoney(company));
    $('#khcp-total-driver-self').text(formatMoney(driverSelf));
    $('#khcp-total-customer').text(formatMoney(customer));
    $('#khcp-total-all').text(formatMoney(company + driverSelf + customer));
    $('#khcp-total-plan-source').text(formatMoney(planSource));
    $('#khcp-total-driver-source').text(formatMoney(driverSource));
    $('#khcp-total-rows').text(rows.length);
    $('#khcp-plan-count').text($.grep(getRowsBySource('ke_hoach'), function (row) { return !isBlankRow(row); }).length);
    $('#khcp-driver-count').text($.grep(getRowsBySource('lai_xe'), function (row) { return !isBlankRow(row); }).length);
  }

  function clearPlanInfo() {
    state.plan = null;
    $('#khcp-header-meta').text('');
    $('#khcp-info-customer, #khcp-info-bkg-cont, #khcp-info-vehicle-driver, #khcp-info-route, #khcp-info-status').text('-');
  }

  function fillPlanInfo(plan) {
    state.plan = plan || {};
    var customer = state.plan.khach_hang && state.plan.khach_hang.ten ? state.plan.khach_hang.ten : '';
    var vehicle = state.plan.phuong_tien && state.plan.phuong_tien.bks ? state.plan.phuong_tien.bks : '';
    var mooc = state.plan.mooc && state.plan.mooc.bks ? state.plan.mooc.bks : '';
    var driver = state.plan.lai_xe && state.plan.lai_xe.ten ? state.plan.lai_xe.ten : '';
    var cont = [state.plan.loai_cont, state.plan.so_cont].filter(Boolean).join(' - ');
    var bkgCont = [state.plan.so_bkg, cont].filter(Boolean).join(' / ');
    var vehicleDriver = [vehicle, mooc, driver].filter(Boolean).join(' / ');
    var route = [state.plan.dia_chi_kho, state.plan.bai_ha_thuc_te || state.plan.bai_ha_cont || state.plan.diem_den].filter(Boolean).join(' / ');
    var status = state.plan.trang_thai_van_chuyen || state.plan.hinh_thuc_status_text || '';
    $('#khcp-header-meta').text([customer, bkgCont, driver].filter(Boolean).join(' - '));
    $('#khcp-info-customer').text(textOrDash(customer));
    $('#khcp-info-bkg-cont').text(textOrDash(bkgCont));
    $('#khcp-info-vehicle-driver').text(textOrDash(vehicleDriver));
    $('#khcp-info-route').text(textOrDash(route));
    $('#khcp-info-status').text(textOrDash(status));
    if (!state.nidLaiXe && state.plan.lai_xe && state.plan.lai_xe.nid) {
      state.nidLaiXe = Number(state.plan.lai_xe.nid) || 0;
    }
  }

  function renderAll() {
    ensureEmptyRows();
    renderTable('ke_hoach');
    renderTable('lai_xe');
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
    var hasMoney = toNumber(row.don_gia) > 0 || toNumber(row.tong_truoc_vat) > 0 || toNumber(row.tong_sau_vat) > 0;
    var hasName = String(row.ten_chi_phi || '').trim().length > 0;
    var valid = !hasMoney || hasName;
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
    row.loai_chi_phi = row.source === 'lai_xe' ? DRIVER_COST_TYPE : (row.loai_chi_phi === DRIVER_COST_TYPE ? 'cong_ty_chi_tra' : row.loai_chi_phi);
    var json = $.extend({}, row.thong_tin_json || {}, { nguon_nhap: row.source });
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
    if (!state.nidKeHoach) return;
    setBusy(true);
    $.getJSON(API_BASE, { nid_ke_hoach: state.nidKeHoach, limit: 100 })
      .done(function (response) {
        var items = response && response.data && response.data.items ? response.data.items : [];
        state.rows = $.map(items, function (item) { return normalizeRow(item); });
        renderAll();
      })
      .fail(function (jqXHR) {
        state.rows = [];
        renderAll();
        notify(apiMsg(jqXHR), 'error');
      })
      .always(function () {
        setBusy(false);
      });
  }

  function loadPlanInfo() {
    if (!state.nidKeHoach) return;
    clearPlanInfo();
    $.getJSON('/api/ke-hoach-xep-xe/' + state.nidKeHoach)
      .done(function (response) {
        if (response && response.status === 'success' && response.data) {
          fillPlanInfo(response.data);
        }
      });
  }

  function saveRow(row, silent) {
    if (isBlankRow(row)) return $.Deferred().resolve({ skipped: true }).promise();
    if (!validateRow(row, true)) return $.Deferred().reject({ message: 'Vui lòng nhập tên chi phí.' }).promise();
    var isUpdate = row.nid > 0;
    return ensureExpenseNameInCatalog(row.ten_chi_phi)
      .then(function () {
        return $.ajax({
          url: isUpdate ? API_BASE + '/' + row.nid : API_BASE,
          method: isUpdate ? 'PUT' : 'POST',
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          data: JSON.stringify(payloadFromRow(row))
        });
      })
      .done(function (response) {
        if (response && response.data && response.data.nid) {
          row.nid = Number(response.data.nid) || row.nid;
          row.key = 'nid_' + row.nid;
        }
        if (!silent) notify('Đã lưu chi phí.', 'success');
      });
  }

  function saveAllRows() {
    var rows = $.grep(state.rows, function (row) { return !isBlankRow(row); });
    var invalidRows = $.grep(rows, function (row) { return !validateRow(row, true); });
    if (invalidRows.length) {
      notify('Vui lòng nhập tên cho các dòng có số tiền.', 'error');
      $('tr[data-row-key="' + invalidRows[0].key + '"] .cost-name').trigger('focus');
      return;
    }
    if (!rows.length) {
      notify('Chưa có chi phí cần lưu.', 'error');
      return;
    }
    var chain = $.Deferred().resolve().promise();
    setBusy(true);
    $.each(rows, function (_, row) {
      chain = chain.then(function () { return saveRow(row, true); });
    });
    chain.done(function () {
      notify('Đã lưu toàn bộ chi phí.', 'success');
      loadRows();
    }).fail(function (error) {
      notify(error && error.message ? error.message : 'Lưu chi phí thất bại.', 'error');
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
    $('#khcp-plan-code').text('#' + state.nidKeHoach);
    if (!modal) {
      modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(document.getElementById('ke-hoach-chi-phi-modal'), { backdrop: 'static', keyboard: false }) : new bootstrap.Modal(document.getElementById('ke-hoach-chi-phi-modal'));
    }
    modal.show();
    clearPlanInfo();
    loadPlanInfo();
    loadExpenseNames().always(loadRows);
  }

  function bindEvents() {
    if (bindEvents._bound) return;
    bindEvents._bound = true;

    $(document).on('click', '.btn-open-ke-hoach-chi-phi', function (e) {
      e.preventDefault();
      openModal($(this));
    });
    $(document).on('click', '.btn-add-row', function () {
      var currentRow = getRow($(this).closest('tr').data('row-key'));
      var source = currentRow && currentRow.source === 'lai_xe' ? 'lai_xe' : 'ke_hoach';
      state.rows.push(createEmptyRow(source));
      renderTable(source);
      updateSummary();
      var rows = getRowsBySource(source);
      $('tr[data-row-key="' + rows[rows.length - 1].key + '"] .cost-name').trigger('focus');
    });
    $(document).on('input change', '.row-field', function () {
      var $input = $(this);
      var row = getRow($input.closest('tr').data('row-key'));
      var field = $input.data('field');
      if (!row || !field) return;
      row[field] = ($input.hasClass('money-input') || $input.hasClass('decimal-input') || $input.hasClass('qty-input')) ? toNumber($input.val()) : $input.val();
      if (field === 'ten_chi_phi') addExpenseName(row[field]);
      if (field === 'so_luong') row[field] = Math.max(1, parseInt(row[field], 10) || 1);
      if (field === 'vat_percent') row[field] = clampPercent(row[field]);
      if ($input.hasClass('money-input') && !$input.prop('readonly')) {
        $input.val(formatMoney(row[field]));
      }
      calculateRow(row, field);
      validateRow(row, false);
      if ($.inArray(field, ['don_gia', 'so_luong', 'tong_truoc_vat', 'vat_percent', 'tong_sau_vat']) !== -1) updateRowDom(row, field);
      updateSummary();
    });
    $(document).on('focus', '.money-input, .decimal-input, .qty-input', function () {
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

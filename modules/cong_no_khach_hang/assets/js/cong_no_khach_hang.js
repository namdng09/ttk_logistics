(function ($) {
  'use strict';

  var API = '/api/cong-no-khach-hang';
  var VOUCHER_API = '/api/phieu-tra-khach-hang';
  var state = {
    items: [],
    page: 1,
    expanded: {},
    payment: null
  };
  var notyf;

  function settings() {
    return (window.Drupal && Drupal.settings && Drupal.settings.cong_no_khach_hang) || {};
  }

  function notify(msg, type) {
    if (!notyf && window.Notyf) notyf = new Notyf();
    if (notyf) {
      type === 'error' ? notyf.error(msg) : notyf.success(msg);
    }
    else {
      alert(msg);
    }
  }

  function esc(v) {
    return $('<div>').text(v == null ? '' : v).html();
  }

  function moneyValue(v) {
    if (typeof v === 'number') return Math.round(v);
    var raw = String(v == null ? '' : v).replace(/[^\d-]/g, '');
    return raw === '' || raw === '-' ? 0 : parseInt(raw, 10) || 0;
  }

  function money(v) {
    return moneyValue(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function moneyText(v) {
    return money(v) + ' đ';
  }

  function apiMsg(xhr) {
    try {
      return JSON.parse(xhr.responseText).message || 'Lỗi không xác định';
    }
    catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function pad(n) {
    n = parseInt(n, 10) || 0;
    return n < 10 ? '0' + n : String(n);
  }

  function monthLabel(yyyymm) {
    yyyymm = String(yyyymm || '');
    return yyyymm.length === 6 ? yyyymm.substr(4, 2) + '/' + yyyymm.substr(0, 4) : '';
  }

  function todayText() {
    var d = new Date();
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  function apiToDatetime(v) {
    if (!v) return '';
    var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
    if (!m) return v;
    return m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' ' + m[4] + ':' + m[5] : '');
  }

  function statusBadge(s) {
    var map = {
      chua_thanh_toan: ['Chưa thanh toán', 'bg-label-secondary'],
      thanh_toan_mot_phan: ['Thanh toán một phần', 'bg-label-info'],
      da_thanh_toan: ['Đã thanh toán', 'bg-label-success']
    };
    var item = map[s] || [s || '-', 'bg-label-secondary'];
    return '<span class="badge ' + item[1] + '">' + esc(item[0]) + '</span>';
  }

  function initSelect2($el, opts) {
    if (!$.fn.select2 || !$el.length) return;
    if ($el.data('select2')) $el.select2('destroy');
    $el.select2($.extend({ width: '100%', allowClear: true }, opts || {}));
  }

  function initMonthYearFilters() {
    var now = new Date();
    var currentYear = now.getFullYear();
    var monthHtml = '';
    for (var i = 1; i <= 12; i++) monthHtml += '<option value="' + i + '">' + pad(i) + '</option>';
    $('.cnkh-month-select').html(monthHtml);
    var yearHtml = '<option value="">Tất cả</option>';
    for (var y = currentYear + 1; y >= currentYear - 5; y--) yearHtml += '<option value="' + y + '">' + y + '</option>';
    $('.cnkh-year-select').html(yearHtml);
    $('#cnkh-filter-from-month').val(1);
    $('#cnkh-filter-to-month').val(12);
    $('#cnkh-filter-from-year,#cnkh-filter-to-year').val(currentYear);
  }

  function loadCustomers() {
    $.getJSON('/api/khach-hang', { limit: 500 }).done(function (res) {
      var html = '<option value="">Tất cả</option>';
      $.each((res.data && res.data.items) || [], function (_, item) {
        var label = item.ten || item.ma_kh || ('Khách hàng #' + item.nid);
        html += '<option value="' + esc(item.nid) + '">' + esc(label) + '</option>';
      });
      $('#cnkh-filter-customer').html(html);
      initSelect2($('#cnkh-filter-customer'), { placeholder: 'Tất cả' });
    });
  }

  function loadFunds() {
    var funds = settings().fund_options || [];
    var html = '<option value="">Chọn quỹ</option>';
    $.each(funds, function (_, item) {
      html += '<option value="' + esc(item.nid) + '">' + esc(item.label) + '</option>';
    });
    $('#cnkh-pay-fund').html(html);
    initSelect2($('#cnkh-pay-fund'), { placeholder: 'Chọn quỹ', dropdownParent: $('#cnkh-payment-modal') });
  }

  function collectFilters() {
    return {
      page: state.page,
      limit: 20,
      nid_khach_hang: $('#cnkh-filter-customer').val() || '',
      from_month: $('#cnkh-filter-from-month').val() || '',
      from_year: $('#cnkh-filter-from-year').val() || '',
      to_month: $('#cnkh-filter-to-month').val() || '',
      to_year: $('#cnkh-filter-to-year').val() || '',
      trang_thai: $('#cnkh-filter-status').val() || ''
    };
  }

  function renderSummary(summary) {
    summary = summary || {};
    $('#cnkh-summary-total').text(moneyText(summary.tong_phai_thu));
    $('#cnkh-summary-paid').text(moneyText(summary.da_thanh_toan));
    $('#cnkh-summary-remaining').text(moneyText(summary.con_lai));
    $('#cnkh-summary-count').text((summary.so_khach_hang || 0) + ' / ' + (summary.so_phieu || 0));
  }

  function loadingRow() {
    $('#cnkh-table-body').html('<tr><td colspan="9" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>');
  }

  function loadList() {
    loadingRow();
    $.getJSON(API, collectFilters()).done(function (res) {
      var data = res.data || {};
      state.items = data.items || [];
      renderSummary(data.summary || {});
      renderTable();
      renderPagination(data);
    }).fail(function (xhr) {
      $('#cnkh-table-body').html('<tr><td colspan="9" class="text-center text-danger py-4">' + esc(apiMsg(xhr)) + '</td></tr>');
    });
  }

  function rowKey(item) {
    return String(item.nid_khach_hang) + ':' + String(item.thang_cong_no);
  }

  function actionDropdown(index) {
    return '<div class="dropdown">' +
      '<button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><a class="dropdown-item d-flex align-items-center cnkh-toggle-detail" href="#" data-index="' + index + '"><i class="ti tabler-list-details text-primary me-2"></i>Chi tiết</a></li>' +
      '<li><a class="dropdown-item d-flex align-items-center cnkh-pay-period" href="#" data-index="' + index + '"><i class="ti tabler-wallet text-success me-2"></i>Thanh toán kỳ</a></li>' +
      '</ul></div>';
  }

  function renderTable() {
    if (!state.items.length) {
      $('#cnkh-table-body').html('<tr><td colspan="9" class="text-center text-muted py-4">Không có công nợ.</td></tr>');
      $('#cnkh-list-count').text('0 nhóm');
      return;
    }
    $('#cnkh-list-count').text(state.items.length + ' nhóm');
    var html = '';
    var groups = groupItemsByMonth(state.items);
    var displayIndex = 1;
    $.each(groups, function (_, group) {
      html += renderMonthRow(group);
      $.each(group.items, function (_, entry) {
        var idx = entry.index;
        var item = entry.item;
        var key = rowKey(item);
        var expanded = !!state.expanded[key];
        var customer = item.khach_hang || {};
        html += '<tr class="cnkh-group-row cnkh-summary-row' + (expanded ? ' is-open' : '') + '" data-index="' + idx + '">' +
          '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-secondary cnkh-expand cnkh-toggle-btn" data-index="' + idx + '"><i class="ti tabler-chevron-right cnkh-toggle-icon"></i></button></td>' +
          '<td class="text-center text-muted">' + displayIndex++ + '</td>' +
          '<td><div class="cnkh-customer-name fw-semibold">' + esc(customer.ten || '') + '</div>' + (customer.ma_kh ? '<div class="cnkh-customer-meta text-muted">' + esc(customer.ma_kh) + '</div>' : '') + '</td>' +
          '<td class="text-center"><span class="badge bg-label-info rounded-pill">' + esc(item.so_phieu || 0) + '</span></td>' +
          '<td class="text-end cnkh-money fw-semibold">' + moneyText(item.tong_phai_thu) + '</td>' +
          '<td class="text-end cnkh-money cnkh-paid">' + moneyText(item.da_thanh_toan) + '</td>' +
          '<td class="text-end cnkh-money fw-semibold ' + (moneyValue(item.con_lai) > 0 ? 'cnkh-debt' : 'text-success') + '">' + moneyText(item.con_lai) + '</td>' +
          '<td class="text-center">' + statusBadge(item.trang_thai) + '</td>' +
          '<td>' + actionDropdown(idx) + '</td>' +
          '</tr>';
        if (expanded) html += renderDetailRow(item, idx);
      });
    });
    $('#cnkh-table-body').html(html);
  }

  function groupItemsByMonth(items) {
    var map = {};
    var groups = [];
    $.each(items, function (idx, item) {
      var month = String(item.thang_cong_no || '');
      if (!map[month]) {
        map[month] = {
          month: month,
          label: item.thang_cong_no_label || monthLabel(month),
          items: [],
          customerCount: 0,
          voucherCount: 0,
          total: 0,
          paid: 0,
          remaining: 0
        };
        groups.push(map[month]);
      }
      var group = map[month];
      group.items.push({ item: item, index: idx });
      group.customerCount += 1;
      group.voucherCount += moneyValue(item.so_phieu);
      group.total += moneyValue(item.tong_phai_thu);
      group.paid += moneyValue(item.da_thanh_toan);
      group.remaining += moneyValue(item.con_lai);
    });
    return groups;
  }

  function renderMonthRow(group) {
    return '<tr class="cnkh-month-group-row"><td colspan="9">' +
      '<div class="d-flex flex-wrap align-items-center justify-content-between gap-2">' +
      '<div class="d-flex align-items-center gap-2">' +
      '<i class="ti tabler-calendar-month fs-3 cnkh-month-icon"></i>' +
      '<div><div class="fw-bold">Tháng ' + esc(group.label) + '</div>' +
      '<div class="small opacity-75">' + group.customerCount + ' khách hàng · ' + group.voucherCount + ' phiếu trả</div></div>' +
      '</div>' +
      '<div class="d-flex flex-wrap gap-2 cnkh-month-totals">' +
      '<span>Phải thu: <strong>' + moneyText(group.total) + '</strong></span>' +
      '<span>Đã TT: <strong>' + moneyText(group.paid) + '</strong></span>' +
      '<span>Còn lại: <strong>' + moneyText(group.remaining) + '</strong></span>' +
      '</div></div></td></tr>';
  }

  function renderDetailRow(item, index) {
    var rows = item.items || [];
    var body = '';
    if (!rows.length) {
      body = '<tr><td colspan="9" class="text-center text-muted py-3">Không có phiếu.</td></tr>';
    }
    else {
      $.each(rows, function (_, row) {
        var disabled = moneyValue(row.con_lai) <= 0 ? ' disabled' : '';
        body += '<tr>' +
          '<td class="text-center"><input type="checkbox" class="form-check-input cnkh-voucher-check" data-group-index="' + index + '" value="' + esc(row.nid) + '" data-remaining="' + esc(row.con_lai) + '"' + disabled + '></td>' +
          '<td><a href="#" class="fw-semibold cnkh-open-voucher" data-id="' + esc(row.nid) + '">' + esc(row.ma_phieu) + '</a></td>' +
          '<td>' + esc(apiToDatetime(row.created)) + '</td>' +
          '<td>' + esc(row.so_hoa_don || '-') + '</td>' +
          '<td class="text-end">' + moneyText(row.tong_tien) + '</td>' +
          '<td class="text-end">' + moneyText(row.da_thanh_toan) + '</td>' +
          '<td class="text-end fw-semibold">' + moneyText(row.con_lai) + '</td>' +
          '<td>' + statusBadge(row.trang_thai_thanh_toan) + '</td>' +
          '<td class="text-nowrap">' +
          '<a target="_blank" href="' + esc(row.download_url) + '" class="btn btn-sm btn-icon btn-label-primary me-1" title="Tải phiếu"><i class="ti tabler-download"></i></a>' +
          '<button type="button" class="btn btn-sm btn-icon btn-label-success cnkh-pay-voucher" data-group-index="' + index + '" data-voucher-id="' + esc(row.nid) + '" title="Thanh toán phiếu"' + disabled + '><i class="ti tabler-wallet"></i></button>' +
          '</td>' +
          '</tr>';
      });
    }
    return '<tr class="cnkh-detail-row"><td colspan="9"><div class="cnkh-detail-panel">' +
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">' +
      '<div class="fw-semibold">Phiếu trả khách hàng đã duyệt</div>' +
      '<div class="d-flex flex-wrap gap-2">' +
      '<button type="button" class="btn btn-sm btn-label-secondary cnkh-check-all-vouchers" data-group-index="' + index + '"><i class="ti tabler-checks me-1"></i>Chọn phiếu còn nợ</button>' +
      '<button type="button" class="btn btn-sm btn-success cnkh-pay-selected" data-group-index="' + index + '"><i class="ti tabler-wallet me-1"></i>Thanh toán phiếu chọn</button>' +
      '<button type="button" class="btn btn-sm btn-primary cnkh-pay-period" data-index="' + index + '"><i class="ti tabler-cash me-1"></i>Thanh toán cả kỳ</button>' +
      '</div></div>' +
      '<div class="table-responsive"><table class="table table-sm table-bordered align-middle cnkh-voucher-table">' +
      '<thead><tr><th style="width:44px"></th><th>Mã phiếu</th><th>Ngày tạo</th><th>Số HĐ</th><th class="text-end">Tổng tiền</th><th class="text-end">Đã TT</th><th class="text-end">Còn lại</th><th>Trạng thái</th><th style="width:100px">CN</th></tr></thead>' +
      '<tbody>' + body + '</tbody></table></div></div></td></tr>';
  }

  function renderPagination(data) {
    var total = parseInt(data.total_pages || 0, 10);
    var current = parseInt(data.current_page || 1, 10);
    var totalItems = parseInt(data.total || 0, 10);
    state.page = current || 1;
    $('#cnkh-pagination-info').text('Tổng số: ' + totalItems + ' nhóm công nợ');
    $('#cnkh-pagination-total-pages').text('/ ' + total);
    $('#cnkh-pagination-jump').val(current || '').attr('data-total-pages', total);
    $('#cnkh-pagination-wrap').show();

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link cnkh-page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link cnkh-page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    if (start > 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link cnkh-page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }
    if (end < total) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    html += '<li class="page-item ' + (current >= total || total === 0 ? 'disabled' : '') + '"><a class="page-link cnkh-page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total || total === 0 ? 'disabled' : '') + '"><a class="page-link cnkh-page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';
    $('#cnkh-pagination').html(html);
  }

  function vouchersWithDebt(item) {
    return $.grep(item.items || [], function (row) {
      return moneyValue(row.con_lai) > 0;
    });
  }

  function selectedVouchers(groupIndex) {
    var item = state.items[groupIndex];
    if (!item) return [];
    var ids = $('.cnkh-voucher-check[data-group-index="' + groupIndex + '"]:checked').map(function () {
      return parseInt(this.value, 10);
    }).get();
    return $.grep(item.items || [], function (row) {
      return ids.indexOf(parseInt(row.nid, 10)) !== -1 && moneyValue(row.con_lai) > 0;
    });
  }

  function openPayment(item, vouchers, scope) {
    if (!item || !vouchers.length) {
      notify('Không có phiếu còn nợ để thanh toán.', 'error');
      return;
    }
    var total = 0;
    $.each(vouchers, function (_, row) { total += moneyValue(row.con_lai); });
    var customer = item.khach_hang || {};
    state.payment = { item: item, vouchers: vouchers, scope: scope || 'selected' };
    $('#cnkh-pay-customer').val(customer.ten || '');
    $('#cnkh-pay-month').val(item.thang_cong_no_label || monthLabel(item.thang_cong_no));
    $('#cnkh-pay-date').val(todayText());
    $('#cnkh-pay-amount').val(money(total));
    $('#cnkh-pay-note').val('');
    $('#cnkh-pay-scope').val(scope === 'period' ? 'Thanh toán cả kỳ' : (vouchers.length === 1 ? 'Thanh toán 1 phiếu' : 'Thanh toán phiếu chọn'));
    $('#cnkh-pay-vouchers').html(renderPaymentVoucherList(vouchers));
    $('#cnkh-payment-form').removeClass('was-validated');
    if (window.flatpickr) {
      flatpickr($('#cnkh-pay-date')[0], { dateFormat: 'd/m/Y', allowInput: true, static: true });
    }
    $('#cnkh-payment-modal').modal('show');
  }

  function renderPaymentVoucherList(vouchers) {
    var html = '<div class="table-responsive"><table class="table table-sm table-bordered align-middle mb-0"><thead><tr><th>Mã phiếu</th><th>Số HĐ</th><th class="text-end">Còn lại</th></tr></thead><tbody>';
    $.each(vouchers, function (_, row) {
      html += '<tr><td>' + esc(row.ma_phieu) + '</td><td>' + esc(row.so_hoa_don || '-') + '</td><td class="text-end fw-semibold">' + moneyText(row.con_lai) + '</td></tr>';
    });
    return html + '</tbody></table></div>';
  }

  function submitPayment() {
    var form = $('#cnkh-payment-form')[0];
    if (form && !form.checkValidity()) {
      $('#cnkh-payment-form').addClass('was-validated');
      return;
    }
    if (!state.payment) return;
    var amount = moneyValue($('#cnkh-pay-amount').val());
    if (amount <= 0) {
      notify('Số tiền thanh toán phải lớn hơn 0.', 'error');
      return;
    }
    var ids = $.map(state.payment.vouchers, function (row) { return parseInt(row.nid, 10); });
    var payload = {
      nid_khach_hang: state.payment.item.nid_khach_hang,
      thang_cong_no: state.payment.item.thang_cong_no,
      voucher_ids: ids,
      so_tien: amount,
      nid_quy: $('#cnkh-pay-fund').val(),
      ngay_giao_dich: $('#cnkh-pay-date').val(),
      ghi_chu: $('#cnkh-pay-note').val(),
      payment_scope: state.payment.scope
    };
    var $btn = $('#cnkh-payment-submit');
    $btn.prop('disabled', true).addClass('disabled');
    $.ajax({
      url: API + '/thanh-toan',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payload)
    }).done(function () {
      notify('Đã thanh toán công nợ.', 'success');
      $('#cnkh-payment-modal').modal('hide');
      loadList();
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      $btn.prop('disabled', false).removeClass('disabled');
    });
  }

  function renderVoucherDetail(data) {
    var customer = data.khach_hang || {};
    var user = data.nguoi_thuc_hien || {};
    var rows = data.chi_tiet || data.items || [];
    var html = '<div class="row g-3 mb-3">' +
      '<div class="col-md-3"><div class="cnkh-info-box"><div class="text-muted small">Mã phiếu</div><strong>' + esc(data.ma_phieu || '') + '</strong></div></div>' +
      '<div class="col-md-3"><div class="cnkh-info-box"><div class="text-muted small">Khách hàng</div><strong>' + esc(customer.ten || '') + '</strong></div></div>' +
      '<div class="col-md-3"><div class="cnkh-info-box"><div class="text-muted small">Người thực hiện</div><strong>' + esc(user.name || user.username || '') + '</strong></div></div>' +
      '<div class="col-md-3"><div class="cnkh-info-box"><div class="text-muted small">Tổng tiền</div><strong>' + moneyText(data.tong_tien) + '</strong></div></div>' +
      '</div>';
    html += '<div class="table-responsive"><table class="table table-sm table-bordered align-middle"><thead><tr><th>#</th><th>Ngày vận chuyển</th><th>Số BKG</th><th>Loại cont</th><th>Số cont</th><th>Tuyến</th><th class="text-end">Doanh thu</th><th class="text-end">Chi hộ</th><th class="text-end">Tổng</th></tr></thead><tbody>';
    if (!rows.length) {
      html += '<tr><td colspan="9" class="text-center text-muted py-3">Không có dữ liệu.</td></tr>';
    }
    else {
      $.each(rows, function (idx, row) {
        html += '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td>' + esc(row.ngay || '') + '</td>' +
          '<td>' + esc(row.so_bkg || '') + '</td>' +
          '<td>' + esc(row.loai_cont || '') + '</td>' +
          '<td>' + esc(row.so_cont || '') + '</td>' +
          '<td>' + esc(row.tuyen || '') + '</td>' +
          '<td class="text-end">' + moneyText(row.tong_doanh_thu) + '</td>' +
          '<td class="text-end">' + moneyText(row.tong_chi_ho_khach_hang) + '</td>' +
          '<td class="text-end fw-semibold">' + moneyText(row.tong_tien) + '</td>' +
          '</tr>';
      });
    }
    return html + '</tbody></table></div>';
  }

  function openVoucher(id) {
    $('#cnkh-voucher-body').html('<div class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></div>');
    $('#cnkh-voucher-download').attr('href', '#').hide();
    $('#cnkh-voucher-modal').modal('show');
    $.getJSON(VOUCHER_API + '/' + id).done(function (res) {
      var data = res.data || {};
      $('#cnkh-voucher-body').html(renderVoucherDetail(data));
      if (data.download_url) $('#cnkh-voucher-download').attr('href', data.download_url).show();
    }).fail(function (xhr) {
      $('#cnkh-voucher-body').html('<div class="text-danger">' + esc(apiMsg(xhr)) + '</div>');
    });
  }

  function bindEvents() {
    $('#cnkh-search').on('click', function () {
      state.page = 1;
      state.expanded = {};
      loadList();
    });
    $('#cnkh-reset').on('click', function () {
      var now = new Date();
      $('#cnkh-filter-customer').val('').trigger('change');
      $('#cnkh-filter-status').val('').trigger('change');
      $('#cnkh-filter-from-month').val(1);
      $('#cnkh-filter-to-month').val(12);
      $('#cnkh-filter-from-year,#cnkh-filter-to-year').val(now.getFullYear());
      state.page = 1;
      state.expanded = {};
      loadList();
    });
    $(document).on('click', '.cnkh-expand,.cnkh-toggle-detail', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var idx = parseInt($(this).data('index'), 10);
      var item = state.items[idx];
      if (!item) return;
      var key = rowKey(item);
      state.expanded[key] = !state.expanded[key];
      renderTable();
    });
    $(document).on('click', '.cnkh-summary-row', function (e) {
      if ($(e.target).closest('a,button,input,.dropdown-menu').length) return;
      var idx = parseInt($(this).data('index'), 10);
      var item = state.items[idx];
      if (!item) return;
      var key = rowKey(item);
      state.expanded[key] = !state.expanded[key];
      renderTable();
    });
    $(document).on('click', '.cnkh-pay-period', function (e) {
      e.preventDefault();
      var item = state.items[parseInt($(this).data('index'), 10)];
      openPayment(item, vouchersWithDebt(item), 'period');
    });
    $(document).on('click', '.cnkh-check-all-vouchers', function () {
      var idx = parseInt($(this).data('group-index'), 10);
      $('.cnkh-voucher-check[data-group-index="' + idx + '"]:not(:disabled)').prop('checked', true);
    });
    $(document).on('click', '.cnkh-pay-selected', function () {
      var idx = parseInt($(this).data('group-index'), 10);
      openPayment(state.items[idx], selectedVouchers(idx), 'selected');
    });
    $(document).on('click', '.cnkh-pay-voucher', function () {
      var idx = parseInt($(this).data('group-index'), 10);
      var id = parseInt($(this).data('voucher-id'), 10);
      var item = state.items[idx];
      var voucher = $.grep((item && item.items) || [], function (row) { return parseInt(row.nid, 10) === id; });
      openPayment(item, voucher, 'voucher');
    });
    $(document).on('click', '.cnkh-open-voucher', function (e) {
      e.preventDefault();
      openVoucher($(this).data('id'));
    });
    $(document).on('click', '.cnkh-page-link', function (e) {
      e.preventDefault();
      var page = parseInt($(this).data('page'), 10) || 0;
      if (page && page !== state.page) {
        state.page = page;
        loadList();
      }
    });
    $('#cnkh-pagination-jump').on('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value, 10) || 0;
        var total = parseInt($(this).attr('data-total-pages'), 10) || 0;
        if (page > 0 && page <= total) {
          state.page = page;
          loadList();
        }
      }
    });
    $('#cnkh-payment-submit').on('click', submitPayment);
    $('#cnkh-payment-form').on('keydown', function (e) {
      if (e.which === 13) {
        e.preventDefault();
        submitPayment();
      }
    });
    $(document).on('input', '#cnkh-pay-amount', function () {
      var pos = this.selectionStart;
      this.value = money(this.value);
      try { this.setSelectionRange(pos, pos); } catch (e) {}
    });
  }

  $(function () {
    initMonthYearFilters();
    loadCustomers();
    loadFunds();
    initSelect2($('#cnkh-filter-status'), { placeholder: 'Tất cả' });
    bindEvents();
    loadList();
  });
})(jQuery);

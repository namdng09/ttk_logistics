(function ($) {
  'use strict';

  var API = '/api/cong-no-khach-hang';
  var VOUCHER_API = '/api/phieu-tra-khach-hang';
  var state = {
    items: [],
    page: 1,
    expanded: {},
    payment: null,
    // Kỳ công nợ: from/to = 'YYYYMM' ('' = không giới hạn). Mặc định cả năm hiện tại.
    period: { from: '', to: '' },
    periodPick: '',
    periodYear: new Date().getFullYear()
  };
  var BANK_LIST = [];
  var BANK_LIST_LOADED = false;
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

  // Dòng báo lỗi khi tải danh sách: hiện đúng lý do server trả về; 401/403 (không có quyền) thì chữ vàng + icon ổ khoá.
  function loadErrorRow(colspan, jqXHR) {
    var denied = !!jqXHR && (jqXHR.status === 401 || jqXHR.status === 403);
    var msg = String(apiMsg(jqXHR)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<tr><td colspan="' + colspan + '" class="text-center py-4 ' + (denied ? 'text-warning' : 'text-danger') + '">' +
      (denied ? '<i class="ti tabler-lock me-1"></i>' : '') + msg + '</td></tr>';
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

  function dateDashText(v) {
    if (!v) return '';
    var raw = String(v).trim();
    var iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return iso[3] + '-' + iso[2] + '-' + iso[1];
    var slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (slash) return slash[1] + '-' + slash[2] + '-' + slash[3];
    var dash = raw.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dash) return dash[1] + '-' + dash[2] + '-' + dash[3];
    return raw;
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

  function loadBankList(done) {
    if (BANK_LIST_LOADED) {
      if (done) done();
      return;
    }
    var cached = '';
    try { cached = localStorage.getItem('bankList'); } catch (e) {}
    if (cached) {
      try {
        BANK_LIST = JSON.parse(cached) || [];
        BANK_LIST_LOADED = BANK_LIST.length > 0;
      } catch (e) {}
    }
    if (BANK_LIST_LOADED) {
      if (done) done();
      return;
    }
    $.ajax({
      url: 'https://api.vietqr.io/v2/banks',
      type: 'GET',
      dataType: 'json'
    }).done(function (res) {
      BANK_LIST = (res && res.data) || [];
      BANK_LIST_LOADED = BANK_LIST.length > 0;
      try { localStorage.setItem('bankList', JSON.stringify(BANK_LIST)); } catch (e) {}
    }).always(function () {
      if (done) done();
    });
  }

  function initBankSelect(value) {
    var $select = $('#cnkh-bank-name');
    var html = '<option value="">Chọn ngân hàng</option>';
    $.each(BANK_LIST, function (_, bank) {
      var val = bank.shortName || bank.code || bank.name || '';
      var label = (bank.shortName || bank.code || '') + (bank.name ? ' - ' + bank.name : '');
      html += '<option value="' + esc(val) + '">' + esc(label || val) + '</option>';
    });
    $select.html(html);
    if (value) {
      var found = false;
      $select.find('option').each(function () {
        if ($(this).val() === value) found = true;
      });
      if (!found) {
        $select.append('<option value="' + esc(value) + '">' + esc(value) + '</option>');
      }
      $select.val(value);
    }
    initSelect2($select, { placeholder: 'Chọn ngân hàng', dropdownParent: $('#cnkh-payment-modal') });
  }

  // --- Ô "Kỳ công nợ": chọn khoảng tháng (bấm tháng bắt đầu rồi tháng kết thúc), thay cho 4 ô Từ tháng/năm – Đến tháng/năm.
  function ym(year, month) { return String(year) + pad(month); }

  function periodLabel(value) {
    return value ? value.slice(4) + '/' + value.slice(0, 4) : '';
  }

  function periodText() {
    var p = state.period;
    if (!p.from && !p.to) return 'Tất cả thời gian';
    if (p.from === p.to) return 'Tháng ' + periodLabel(p.from);
    if (p.from.slice(0, 4) === p.to.slice(0, 4) && p.from.slice(4) === '01' && p.to.slice(4) === '12') return 'Năm ' + p.from.slice(0, 4);
    return periodLabel(p.from) + ' – ' + periodLabel(p.to);
  }

  function setPeriod(from, to, reload) {
    if (from && to && from > to) { var t = from; from = to; to = t; }
    state.period = { from: from || '', to: to || '' };
    state.periodPick = '';
    $('#cnkh-period-text').text(periodText());
    $('#cnkh-period-pop').addClass('d-none');
    if (reload && !state.suppressFilter) {
      state.page = 1;
      state.expanded = {};
      loadList();
    }
  }

  function defaultPeriod() {
    var y = new Date().getFullYear();
    return { from: ym(y, 1), to: ym(y, 12) };
  }

  function renderPeriodPop() {
    var year = state.periodYear;
    var now = new Date();
    var current = ym(now.getFullYear(), now.getMonth() + 1);
    var from = state.periodPick || state.period.from;
    var to = state.periodPick ? state.periodPick : state.period.to;
    var html = '<div class="cnkh-period-head">' +
      '<button type="button" class="cnkh-period-nav" data-period-year="-1" title="Năm trước"><i class="ti tabler-chevron-left"></i></button>' +
      '<strong>' + year + '</strong>' +
      '<button type="button" class="cnkh-period-nav" data-period-year="1" title="Năm sau"><i class="ti tabler-chevron-right"></i></button></div>' +
      '<div class="cnkh-period-grid">';
    for (var m = 1; m <= 12; m++) {
      var v = ym(year, m);
      var cls = 'cnkh-period-month';
      if (from && to && v >= from && v <= to) cls += ' is-range';
      if (v === from || v === to) cls += ' is-edge';
      if (v === current) cls += ' is-current';
      html += '<button type="button" class="' + cls + '" data-period-month="' + v + '">Th ' + m + '</button>';
    }
    html += '</div><div class="cnkh-period-hint">' + (state.periodPick ? 'Chọn tháng kết thúc (bấm lại tháng này = chỉ 1 tháng)' : 'Bấm tháng bắt đầu, rồi tháng kết thúc') + '</div>' +
      '<div class="cnkh-period-quick">' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="month">Tháng này</button>' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="quarter">Quý này</button>' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="year">Năm nay</button>' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="last_year">Năm trước</button>' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="all">Tất cả</button>' +
      '</div>';
    $('#cnkh-period-pop').html(html);
  }

  function initPeriodPicker() {
    var d = defaultPeriod();
    state.period = d;
    $('#cnkh-period-text').text(periodText());
    $('#cnkh-period-input').on('click', function (e) {
      e.stopPropagation();
      var $pop = $('#cnkh-period-pop');
      if (!$pop.hasClass('d-none')) { $pop.addClass('d-none'); state.periodPick = ''; return; }
      state.periodPick = '';
      state.periodYear = parseInt((state.period.to || state.period.from || ym(new Date().getFullYear(), 1)).slice(0, 4), 10);
      renderPeriodPop();
      $pop.removeClass('d-none');
    });
    $('#cnkh-period-pop').on('click', function (e) {
      e.stopPropagation();
      var $t = $(e.target).closest('button');
      if (!$t.length) return;
      if ($t.is('[data-period-year]')) {
        state.periodYear += parseInt($t.attr('data-period-year'), 10);
        renderPeriodPop();
      } else if ($t.is('[data-period-month]')) {
        var v = String($t.attr('data-period-month'));
        if (!state.periodPick) { state.periodPick = v; renderPeriodPop(); }
        else setPeriod(state.periodPick, v, true);
      } else if ($t.is('[data-period-quick]')) {
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth() + 1;
        var q = $t.attr('data-period-quick');
        if (q === 'month') setPeriod(ym(y, m), ym(y, m), true);
        else if (q === 'quarter') { var qs = Math.floor((m - 1) / 3) * 3 + 1; setPeriod(ym(y, qs), ym(y, qs + 2), true); }
        else if (q === 'year') setPeriod(ym(y, 1), ym(y, 12), true);
        else if (q === 'last_year') setPeriod(ym(y - 1, 1), ym(y - 1, 12), true);
        else setPeriod('', '', true);
      }
    });
    $(document).on('click.cnkhPeriod', function () {
      if (!$('#cnkh-period-pop').hasClass('d-none')) { $('#cnkh-period-pop').addClass('d-none'); state.periodPick = ''; }
    }).on('keydown.cnkhPeriod', function (e) {
      if (e.which === 27) { $('#cnkh-period-pop').addClass('d-none'); state.periodPick = ''; }
    });
  }

  // Tải đủ mọi trang của 1 API danh sách: trang 1 cho biết total_pages, các trang còn lại gọi song song (mỗi lần tối đa 100 dòng
  // khi dùng select, tối đa 50 trang). done(items) khi đủ, fail(jqXHR|undefined) nếu có trang lỗi.
  function fetchAllPages(url, params, done, fail) {
    function request(page) {
      return $.ajax({ url: url, type: 'GET', dataType: 'json', data: $.extend({ page: page }, params) });
    }
    request(1).done(function (res) {
      if (!(res && res.status === 'success' && res.data && res.data.items)) {
        fail();
        return;
      }
      var first = res.data.items;
      var pages = Math.min(50, Math.max(1, parseInt(res.data.total_pages, 10) || 1));
      if (pages === 1) {
        done(first);
        return;
      }
      var chunks = [];
      var left = pages - 1;
      var failed = false;
      for (var page = 2; page <= pages; page++) {
        (function (p) {
          request(p).done(function (r) {
            if (r && r.status === 'success' && r.data && r.data.items) chunks[p - 2] = r.data.items; else failed = true;
          }).fail(function () {
            failed = true;
          }).always(function () {
            left -= 1;
            if (left > 0) return;
            if (failed) { fail(); return; }
            var all = first;
            for (var c = 0; c < chunks.length; c++) all = all.concat(chunks[c]);
            done(all);
          });
        })(page);
      }
    }).fail(function (jqXHR) {
      fail(jqXHR);
    });
  }

  function loadCustomers() {
    // Chỉ lấy nid, tên, mã KH (đủ để dựng ô chọn); tải đủ mọi trang.
    fetchAllPages('/api/khach-hang', { limit: 100, select: 'nid,ten,ma_kh' }, function (items) {
      var html = '<option value="">Tất cả</option>';
      $.each(items, function (_, item) {
        // Hiện mã KH (tên ngắn gọn), chưa có mã thì tên — cùng quy ước các màn khác.
        var label = item.ma_kh || item.ten || ('Khách hàng #' + item.nid);
        html += '<option value="' + esc(item.nid) + '">' + esc(label) + '</option>';
      });
      $('#cnkh-filter-customer').html(html);
      initSelect2($('#cnkh-filter-customer'), { placeholder: 'Tất cả' });
    }, function () {});
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
      from_month: state.period.from ? parseInt(state.period.from.slice(4), 10) : '',
      from_year: state.period.from ? state.period.from.slice(0, 4) : '',
      to_month: state.period.to ? parseInt(state.period.to.slice(4), 10) : '',
      to_year: state.period.to ? state.period.to.slice(0, 4) : '',
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
      $('#cnkh-table-body').html(loadErrorRow(9, xhr));
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
    var selectedTotal = voucherTotal(vouchers);
    var totalVouchers = vouchersWithDebt(item);
    var totalDebt = voucherTotal(totalVouchers);
    var customer = item.khach_hang || {};
    state.payment = { item: item, vouchers: vouchers, totalVouchers: totalVouchers, scope: scope || 'selected' };
    $('#cnkh-pay-customer').text(customer.ten || '');
    $('#cnkh-pay-month').text(item.thang_cong_no_label || monthLabel(item.thang_cong_no));
    $('#cnkh-pay-date').val(todayText());
    $('#cnkh-pay-amount').val(money(selectedTotal));
    $('#cnkh-pay-note').val('');
    $('#cnkh-pay-bill').val('');
    $('#cnkh-pay-scope').text(scope === 'period' ? 'Thanh toán cả kỳ' : (vouchers.length === 1 ? 'Thanh toán 1 phiếu' : 'Thanh toán phiếu chọn'));
    $('#cnkh-method-voucher-label').text(vouchers.length === 1 ? 'Thanh toán theo phiếu đang chọn' : 'Thanh toán theo các phiếu đã chọn');
    $('input[name="cnkh-payment-method"][value="voucher"]').prop('checked', true);
    renderPaymentBankInfo(customer);
    $('#cnkh-pay-vouchers').html(renderPaymentVoucherList(vouchers));
    updatePaymentMethodNote();
    $('#cnkh-payment-form').removeClass('was-validated');
    if (window.flatpickr) {
      flatpickr($('#cnkh-pay-date')[0], { dateFormat: 'd/m/Y', allowInput: true, static: true });
    }
    $('#cnkh-payment-modal').modal('show');
  }

  function voucherTotal(vouchers) {
    var total = 0;
    $.each(vouchers || [], function (_, row) { total += moneyValue(row.con_lai); });
    return total;
  }

  function activePaymentVouchers() {
    if (!state.payment) return [];
    var method = $('input[name="cnkh-payment-method"]:checked').val() || 'voucher';
    return method === 'total' ? (state.payment.totalVouchers || []) : (state.payment.vouchers || []);
  }

  function updatePaymentMethodNote() {
    if (!state.payment) return;
    var method = $('input[name="cnkh-payment-method"]:checked').val() || 'voucher';
    var vouchers = activePaymentVouchers();
    var total = voucherTotal(vouchers);
    $('#cnkh-pay-amount').val(money(total));
    $('#cnkh-pay-vouchers').html(renderPaymentVoucherList(vouchers));
    $('#cnkh-payment-method-note').text(method === 'total'
      ? 'Thanh toán theo tổng tiền còn nợ của tất cả phiếu trong kỳ: ' + moneyText(total)
      : 'Thanh toán theo danh sách phiếu đang chọn: ' + moneyText(total));
  }

  function renderPaymentBankInfo(customer) {
    var banks = customer && $.isArray(customer.thong_tin_ngan_hang) ? customer.thong_tin_ngan_hang : [];
    $('#cnkh-bank-name,#cnkh-bank-account-number,#cnkh-bank-account-name').val('').prop('required', false);
    $('.cnkh-bank-input-form').addClass('d-none');
    if (!banks.length) {
      $('#cnkh-pay-bank-info').html('<div class="alert alert-warning py-2 mb-0">Khách hàng chưa có thông tin ngân hàng.</div>');
      $('.cnkh-bank-input-form').removeClass('d-none');
      $('#cnkh-bank-name,#cnkh-bank-account-number,#cnkh-bank-account-name').prop('required', true);
      loadBankList(function () { initBankSelect(''); });
      return;
    }
    var html = '<div class="small text-muted mb-2">Chọn tài khoản ngân hàng dùng cho lần thanh toán này.</div>';
    $.each(banks, function (idx, bank) {
      html += '<label class="cnkh-bank-line cnkh-bank-choice">' +
        '<input class="form-check-input cnkh-bank-choice-input" type="radio" name="cnkh-bank-choice" value="' + idx + '"' + (idx === 0 ? ' checked' : '') +
          ' data-ngan-hang="' + esc(bank.ngan_hang || '') + '"' +
          ' data-so-tai-khoan="' + esc(bank.so_tai_khoan || '') + '"' +
          ' data-ten-tai-khoan="' + esc(bank.ten_tai_khoan || '') + '">' +
        '<span class="min-w-0">' +
          '<span class="fw-semibold d-block">' + esc(bank.ngan_hang || '-') + '</span>' +
          '<span class="small text-muted d-block">STK: <strong>' + esc(bank.so_tai_khoan || '-') + '</strong> · Chủ TK: <strong>' + esc(bank.ten_tai_khoan || '-') + '</strong></span>' +
        '</span>' +
        '</label>';
    });
    $('#cnkh-pay-bank-info').html(html);
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
    var vouchers = activePaymentVouchers();
    var ids = $.map(vouchers, function (row) { return parseInt(row.nid, 10); });
    var payload = new FormData();
    payload.append('nid_khach_hang', state.payment.item.nid_khach_hang);
    payload.append('thang_cong_no', state.payment.item.thang_cong_no);
    payload.append('voucher_ids', JSON.stringify(ids));
    payload.append('so_tien', amount);
    payload.append('nid_quy', $('#cnkh-pay-fund').val());
    payload.append('ngay_giao_dich', $('#cnkh-pay-date').val());
    payload.append('ghi_chu', $('#cnkh-pay-note').val());
    payload.append('payment_scope', $('input[name="cnkh-payment-method"]:checked').val() === 'total' ? 'total' : state.payment.scope);
    payload.append('payment_method', $('input[name="cnkh-payment-method"]:checked').val() || 'voucher');
    if (!$('.cnkh-bank-input-form').hasClass('d-none')) {
      payload.append('bank_ngan_hang', $('#cnkh-bank-name').val());
      payload.append('bank_so_tai_khoan', $('#cnkh-bank-account-number').val());
      payload.append('bank_ten_tai_khoan', $('#cnkh-bank-account-name').val());
    } else {
      var $bankChoice = $('input[name="cnkh-bank-choice"]:checked');
      if ($bankChoice.length) {
        payload.append('selected_bank_ngan_hang', $bankChoice.attr('data-ngan-hang') || '');
        payload.append('selected_bank_so_tai_khoan', $bankChoice.attr('data-so-tai-khoan') || '');
        payload.append('selected_bank_ten_tai_khoan', $bankChoice.attr('data-ten-tai-khoan') || '');
      }
    }
    var billInput = $('#cnkh-pay-bill')[0];
    if (billInput && billInput.files && billInput.files[0]) {
      payload.append('bill_file', billInput.files[0]);
    }
    var $btn = $('#cnkh-payment-submit');
    $btn.prop('disabled', true).addClass('disabled');
    $.ajax({
      url: API + '/thanh-toan',
      method: 'POST',
      processData: false,
      contentType: false,
      dataType: 'json',
      data: payload
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
    html += '<div class="table-responsive"><table class="table table-sm table-bordered align-middle cnkh-voucher-detail-table"><thead><tr><th>#</th><th>Ngày VC</th><th>Số BKG</th><th>Container</th><th>Tuyến</th><th class="text-end">Doanh thu</th><th class="text-end">Chi hộ</th><th class="text-end">Tổng</th></tr></thead><tbody>';
    if (!rows.length) {
      html += '<tr><td colspan="8" class="text-center text-muted py-3">Không có dữ liệu.</td></tr>';
    }
    else {
      $.each(rows, function (idx, row) {
        var loaiCont = $.trim(row.loai_cont || '');
        var soCont = $.trim(row.so_cont || '');
        var container = (loaiCont ? esc(loaiCont) : '<em class="text-muted">loại cont</em>') +
          ' - ' +
          (soCont ? esc(soCont) : '<em class="text-muted">số cont</em>');
        html += '<tr>' +
          '<td>' + (idx + 1) + '</td>' +
          '<td>' + esc(dateDashText(row.ngay || '')) + '</td>' +
          '<td>' + esc(row.so_bkg || '') + '</td>' +
          '<td>' + container + '</td>' +
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
    function applyFilters() {
      if (state.suppressFilter) return;
      state.page = 1;
      state.expanded = {};
      loadList();
    }
    $('#cnkh-search').on('click', applyFilters);
    // Các ô chọn (khách hàng, trạng thái) đổi là tải lại ngay; kỳ công nợ tự tải lại khi chọn xong (setPeriod()).
    $('#cnkh-filter-customer, #cnkh-filter-status').on('change', applyFilters);
    $('#cnkh-reset').on('click', function () {
      state.suppressFilter = true;
      $('#cnkh-filter-customer').val('').trigger('change');
      $('#cnkh-filter-status').val('').trigger('change');
      var d = defaultPeriod();
      setPeriod(d.from, d.to, false);
      state.suppressFilter = false;
      applyFilters();
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
    $(document).on('change', 'input[name="cnkh-payment-method"]', updatePaymentMethodNote);
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
    initPeriodPicker();
    loadCustomers();
    loadFunds();
    initSelect2($('#cnkh-filter-status'), { placeholder: 'Tất cả' });
    bindEvents();
    loadList();
  });
})(jQuery);

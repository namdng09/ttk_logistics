(function ($, Drupal) {
  'use strict';

  var API = '/api/luong-lai-xe';
  var currentPage = 1;
  var state = {
    date_from: '',
    date_to: '',
    // Tab trạng thái trả lương: '' = tất cả, chua_tra, tra_mot_phan, da_tra, tra_thua (server lọc trước khi cắt trang).
    trang_thai_tra: '',
    keyword: ''
  };
  var driverCache = {};
  var currentDetail = null;
  var deductCaps = { tong_luong: 0, du_co_the_tru: 0 };
  var payModalData = { luong_phai_tra: 0 };
  var payQuyBalances = {};
  var notyf;

  // Ứng tiền / Thanh toán lương / Khấu trừ tạm ứng: server kiểm tra luong_lai_xe_pay — không có quyền thì ẩn nút.
  function canPay() {
    var s = Drupal.settings && Drupal.settings.luong_lai_xe;
    return !!(s && s.permissions && s.permissions.pay);
  }

  Drupal.behaviors.luongLaiXe = {
    attach: function (context) {
      if (!canPay()) $('#llx-btn-advance, #llx-btn-pay').remove();
      var $table = $('#llx-table-body', context);
      if (!$table.length || $table.data('llxInit')) return;
      $table.data('llxInit', true);
      if (typeof Notyf !== 'undefined' && !notyf) notyf = new Notyf();
      initPeriodPicker();
      initDefaults();
      initDatePickers();
      bindEvents();
      loadList();
    }
  };

  // --- Ô "Kỳ lương": khoảng tháng {from, to} dạng 'YYYYMM' (mặc định tháng hiện tại). Cùng cách chọn với ô "Kỳ công nợ".
  var period = { from: '', to: '' };
  var periodPick = '';
  var periodYear = new Date().getFullYear();

  function ymKey(year, month) { return String(year) + (month < 10 ? '0' : '') + month; }
  function periodLabel(v) { return v ? v.slice(4) + '/' + v.slice(0, 4) : ''; }
  function periodText() {
    if (period.from === period.to) return 'Tháng ' + periodLabel(period.from);
    if (period.from.slice(0, 4) === period.to.slice(0, 4) && period.from.slice(4) === '01' && period.to.slice(4) === '12') return 'Năm ' + period.from.slice(0, 4);
    return periodLabel(period.from) + ' – ' + periodLabel(period.to);
  }
  function setPeriod(from, to, reload) {
    if (from > to) { var t = from; from = to; to = t; }
    period = { from: from, to: to };
    periodPick = '';
    $('#llx-period-text').text(periodText());
    $('#llx-period-pop').addClass('d-none');
    readFilters();
    if (reload) { currentPage = 1; loadList(); }
  }
  function renderPeriodPop() {
    var now = new Date();
    var current = ymKey(now.getFullYear(), now.getMonth() + 1);
    var from = periodPick || period.from;
    var to = periodPick || period.to;
    var html = '<div class="llx-period-head"><button type="button" class="llx-period-nav" data-period-year="-1" title="Năm trước"><i class="ti tabler-chevron-left"></i></button>' +
      '<strong>' + periodYear + '</strong><button type="button" class="llx-period-nav" data-period-year="1" title="Năm sau"><i class="ti tabler-chevron-right"></i></button></div><div class="llx-period-grid">';
    for (var m = 1; m <= 12; m++) {
      var v = ymKey(periodYear, m);
      var cls = 'llx-period-month';
      if (v >= from && v <= to) cls += ' is-range';
      if (v === from || v === to) cls += ' is-edge';
      if (v === current) cls += ' is-current';
      html += '<button type="button" class="' + cls + '" data-period-month="' + v + '">Th ' + m + '</button>';
    }
    html += '</div><div class="llx-period-hint">' + (periodPick ? 'Chọn tháng kết thúc (bấm lại tháng này = chỉ 1 tháng)' : 'Bấm tháng bắt đầu, rồi tháng kết thúc') + '</div>' +
      '<div class="llx-period-quick">' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="month">Tháng này</button>' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="last_month">Tháng trước</button>' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="quarter">Quý này</button>' +
      '<button type="button" class="btn btn-label-secondary" data-period-quick="year">Năm nay</button></div>';
    $('#llx-period-pop').html(html);
  }
  // Gắn thẳng vào ô (như ô "Kỳ công nợ" ở /cong-no-khach-hang): stopPropagation() chặn được handler "click ra ngoài thì đóng".
  function initPeriodPicker() {
    var $input = $('#llx-period-input');
    var $pop = $('#llx-period-pop');
    if (!$input.length || !$pop.length) return;
    $input.on('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!$pop.hasClass('d-none')) { $pop.addClass('d-none'); periodPick = ''; return; }
      periodPick = '';
      periodYear = parseInt(period.to.slice(0, 4), 10) || new Date().getFullYear();
      renderPeriodPop();
      $pop.removeClass('d-none');
    });
    $pop.on('click', function (e) {
      e.stopPropagation();
      var $t = $(e.target).closest('button');
      if (!$t.length) return;
      if ($t.is('[data-period-year]')) { periodYear += parseInt($t.attr('data-period-year'), 10); renderPeriodPop(); return; }
      if ($t.is('[data-period-month]')) {
        var v = String($t.attr('data-period-month'));
        if (!periodPick) { periodPick = v; renderPeriodPop(); } else setPeriod(periodPick, v, true);
        return;
      }
      var now = new Date(), y = now.getFullYear(), m = now.getMonth() + 1, q = $t.attr('data-period-quick');
      if (q === 'month') setPeriod(ymKey(y, m), ymKey(y, m), true);
      else if (q === 'last_month') { var py = m === 1 ? y - 1 : y, pm = m === 1 ? 12 : m - 1; setPeriod(ymKey(py, pm), ymKey(py, pm), true); }
      else if (q === 'quarter') { var qs = Math.floor((m - 1) / 3) * 3 + 1; setPeriod(ymKey(y, qs), ymKey(y, qs + 2), true); }
      else if (q === 'year') setPeriod(ymKey(y, 1), ymKey(y, 12), true);
    });
    $(document).on('click.llxPeriod', function () {
      if (!$pop.hasClass('d-none')) { $pop.addClass('d-none'); periodPick = ''; }
    }).on('keydown.llxPeriod', function (e) {
      if (e.which === 27) { $pop.addClass('d-none'); periodPick = ''; }
    });
  }

  function initDefaults() {
    var now = new Date();
    var cur = ymKey(now.getFullYear(), now.getMonth() + 1);
    setPeriod(cur, cur, false);
  }

  function initDatePickers() {
    if (typeof flatpickr === 'undefined') return;
    $('.luong-lai-xe-page .flatpickr-month').each(function () {
      try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
      var options = {
        dateFormat: 'm/Y',
        allowInput: true,
        static: true
      };
      if (typeof monthSelectPlugin !== 'undefined') {
        options.plugins = [new monthSelectPlugin({
          shorthand: true,
          dateFormat: 'm/Y',
          altFormat: 'm/Y'
        })];
      }
      flatpickr(this, options);
    });
  }

  function bindEvents() {
    $(document).off('click.llx');
    $(document).off('keypress.llx');
    $(document).off('keydown.llx');
    $(document).off('input.llx');
    $(document).off('change.llx');

    $(document).on('keypress.llx', '#llx-pagination-jump', function (e) {
      if (e.which !== 13) return;
      var page = parseInt(this.value, 10);
      var total = parseInt($(this).attr('data-total-pages'), 10);
      if (page > 0 && page <= total) {
        currentPage = page;
        loadList();
      }
    });


    $(document).on('click.llx', '#llx-search-btn', function () {
      applySearch();
    });

    $(document).on('keypress.llx', '#llx-keyword', function (e) {
      if (e.which !== 13) return;
      e.preventDefault();
      applySearch();
    });

    $(document).on('input.llx', '#llx-deduct-so-tien', function () {
      updateDeductRemaining();
    });

    $(document).on('click.llx', '#llx-tabs [data-tab]', function (e) {
      e.preventDefault();
      var tab = String($(this).attr('data-tab') || '');
      if (tab === state.trang_thai_tra) return;
      state.trang_thai_tra = tab;
      currentPage = 1;
      loadList();
    });

    $(document).on('click.llx', '#llx-btn-reload', function () {
      state.trang_thai_tra = '';
      $('#llx-keyword').val('');
      initDefaults();
      currentPage = 1;
      loadList();
    });

    $(document).on('click.llx', '#llx-pagination .page-link', function (e) {
      e.preventDefault();
      if ($(this).closest('.page-item').hasClass('disabled')) return;
      var page = parseInt($(this).attr('data-page'), 10);
      if (page && page !== currentPage) {
        currentPage = page;
        loadList();
      }
    });

    $(document).on('click.llx', '.llx-act-view', function (e) {
      e.preventDefault();
      openDetail($(this).attr('data-id'), $(this).attr('data-ky-luong'));
    });

    // Double-click 1 dòng: mở chi tiết lương (bỏ qua khi trúng nút / menu).
    $(document).on('dblclick.llx', '#llx-table-body tr[data-id]', function (e) {
      if ($(e.target).closest('a, button, input, .dropdown').length) return;
      openDetail($(this).attr('data-id'), $(this).attr('data-ky-luong'));
    });

    $(document).on('click.llx', '.llx-act-pay', function (e) {
      e.preventDefault();
      openPayModal($(this).attr('data-id'), $(this).attr('data-ky-luong'));
    });

    $(document).on('click.llx', '.llx-act-deduct', function (e) {
      e.preventDefault();
      openDeductModal($(this).attr('data-id'), $(this).attr('data-ky-luong'));
    });

    $(document).on('click.llx', '.llx-act-history', function (e) {
      e.preventDefault();
      openHistoryModal($(this).attr('data-id'), $(this).attr('data-ky-luong'));
    });

    $(document).on('click.llx', '.llx-act-advance', function (e) {
      e.preventDefault();
      var nid = $(this).attr('data-id');
      openAdvanceModal(nid, $(this).attr('data-ky-luong'), driverCache[nid] || {});
    });

    $(document).on('click.llx', '#llx-btn-advance', function () {
      createAdvance();
    });

    $(document).on('click.llx', '#llx-advance-save', function () {
      submitAdvance();
    });

    $(document).on('keydown.llx', '#llx-advance-form', function (e) {
      if (e.which === 13 && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        submitAdvance();
      }
    });

    $(document).on('keypress.llx', '#llx-adv-so-tien', function (e) {
      if (e.charCode < 48 || e.charCode > 57) {
        e.preventDefault();
      }
    });

    $(document).on('input.llx', '.money-mask', function () {
      formatMoneyInputKeepingCaret(this);
    });

    $(document).on('change.llx', '#llx-adv-so-tien', function () {
      formatMoneyInputKeepingCaret(this);
    });

    $(document).on('click.llx', '#llx-btn-pay', function () {
      if (currentDetail && currentDetail.lai_xe && currentDetail.lai_xe.nid) {
        openPayModal(currentDetail.lai_xe.nid, currentDetail.filters && currentDetail.filters.ky_luong);
      }
    });

    $(document).on('click.llx', '#llx-pay-save', function () {
      submitPay();
    });

    $(document).on('keydown.llx', '#llx-pay-form', function (e) {
      if (e.which === 13 && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        submitPay();
      }
    });

    $(document).on('input.llx', '#llx-pay-so-tien', function () {
      formatMoneyInputKeepingCaret(this);
    });

    $(document).on('click.llx', '#llx-deduct-save', function () {
      submitDeduct();
    });

    $(document).on('keydown.llx', '#llx-deduct-form', function (e) {
      if (e.which === 13 && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        submitDeduct();
      }
    });

    $(document).on('keypress.llx', '#llx-deduct-so-tien', function (e) {
      if (e.charCode < 48 || e.charCode > 57) {
        e.preventDefault();
      }
    });
  }

  // Kỳ lương ⇒ khoảng ngày gửi API (ngày đầu tháng bắt đầu → ngày cuối tháng kết thúc).
  function readFilters() {
    state.date_from = period.from ? period.from.slice(0, 4) + '-' + period.from.slice(4) + '-01' : '';
    state.date_to = period.to ? period.to.slice(0, 4) + '-' + period.to.slice(4) + '-' + lastDayOfMonth(parseInt(period.to.slice(0, 4), 10), parseInt(period.to.slice(4), 10)) : '';
  }

  function query(extra) {
    return $.extend({}, state, extra || {});
  }

  function applySearch() {
    state.keyword = $('#llx-keyword').val().trim();
    currentPage = 1;
    loadList();
  }

  function loadList() {
    setTableLoading();
    $.getJSON(API, query({ page: currentPage, limit: 20 }))
      .done(function (res) {
        var data = res && res.data ? res.data : {};
        renderRows(data.items || []);
        renderPagination(data);
        renderTabs(data.status_counts || {});
        renderSum(data.tong || {});
      })
      .fail(function (xhr) {
        $('#llx-table-body').html(loadErrorRow(12, xhr));
      });
  }

  var PAY_TABS = [
    { id: '', key: 'all', label: 'Tất cả' },
    { id: 'chua_tra', key: 'chua_tra', label: 'Chưa trả' },
    { id: 'tra_mot_phan', key: 'tra_mot_phan', label: 'Trả 1 phần' },
    { id: 'da_tra', key: 'da_tra', label: 'Đã trả đủ' },
    { id: 'tra_thua', key: 'tra_thua', label: 'Trả thừa' }
  ];
  var PAY_STATUS = {
    chua_tra: ['Chưa trả', 'bg-label-warning'],
    tra_mot_phan: ['Trả 1 phần', 'bg-label-info'],
    da_tra: ['Đã trả đủ', 'bg-label-success'],
    tra_thua: ['Trả thừa', 'bg-label-danger']
  };

  // Hoàn chi phí: số đã hoàn qua ĐNTT + dòng phụ "Chờ hoàn" (bên nhận là lái xe, ĐNTT chưa xong) nếu có.
  function hoanHtml(da, cho) {
    var c = parseInt(cho, 10) || 0;
    return money(da) + (c > 0 ? '<div class="llx-subtext text-warning" title="Chi phí công ty/khách chịu, bên nhận là lái xe, chưa trả xong qua đề nghị thanh toán">Chờ hoàn ' + money(c) + '</div>' : '');
  }

  function renderTabs(counts) {
    $('#llx-tabs').html($.map(PAY_TABS, function (t) {
      return '<li class="nav-item"><button type="button" class="nav-link waves-effect waves-light' + (state.trang_thai_tra === t.id ? ' active' : '') + '" data-tab="' + t.id + '" role="tab">' +
        esc(t.label) + ' <span class="badge bg-label-primary ms-1">' + (parseInt(counts[t.key], 10) || 0) + '</span></button></li>';
    }).join(''));
  }

  // Dải tổng theo bộ lọc hiện tại (cả danh sách, không theo tab).
  function renderSum(t) {
    function stat(label, value, cls) {
      return '<div class="llx-sum-item"><span class="llx-sum-label">' + label + '</span><span class="llx-sum-value ' + cls + '">' + money(value) + '</span></div>';
    }
    $('#llx-sum').html(stat('Tổng lương', t.tong_luong, 'text-primary') + stat('Thực lĩnh', t.thuc_lanh, '') + stat('Đã trả', t.da_thanh_toan, 'text-success') + stat('Còn phải trả', t.con_phai_tra, 'text-danger') +
      ((parseInt(t.tra_thua, 10) || 0) > 0 ? stat('Trả thừa', t.tra_thua, 'text-danger') : '') +
      ((parseInt(t.cho_hoan, 10) || 0) > 0 ? stat('Chờ hoàn chi phí', t.cho_hoan, 'text-warning') : ''));
  }

  function renderRows(items) {
    if (!items.length) {
      $('#llx-table-body').html('<tr><td colspan="12" class="text-center text-muted py-4">Không có dữ liệu lương trong khoảng lọc.</td></tr>');
      return;
    }
    var html = '';
    $.each(items, function (index, item) {
      var driver = item.lai_xe || {};
      if (driver.nid) driverCache[driver.nid] = driver;
      var driverName = String(driver.ten || '').trim() || '-';
      var driverSub = [String(driver.ma_nhan_vien || '').trim(), driverBankLine(driver)].filter(Boolean).join(' · ');
      var st = PAY_STATUS[item.trang_thai_tra] || ['—', 'bg-label-secondary'];
      var remaining = parseInt(item.luong_phai_tra, 10) || 0;
      var over = parseInt(item.tra_thua, 10) || 0;
      html += '<tr data-id="' + esc(driver.nid || 0) + '" data-ky-luong="' + esc(item.ky_luong || '') + '">' +
        '<td class="text-center">' + buildActions(item) + '</td>' +
        '<td><div class="llx-driver-name">' + esc(driverName) + '</div><div class="llx-subtext">' + esc(driverSub) + '</div></td>' +
        '<td><span class="llx-period">' + esc(item.ky_luong_display || '-') + '</span></td>' +
        '<td class="text-center">' + number(item.so_ke_hoach) + '</td>' +
        '<td class="text-end fw-semibold text-primary llx-money">' + money(item.luong_chot) + '</td>' +
        '<td class="text-end llx-money">' + money(item.tam_ung_da_chi) + '</td>' +
        '<td class="text-end llx-money">' + money(item.khau_tru_tam_ung) + '</td>' +
        '<td class="text-end fw-semibold llx-money">' + money(item.thuc_lanh) + '</td>' +
        '<td class="text-end text-success llx-money">' + money(item.da_thanh_toan) + '</td>' +
        (over > 0
          ? '<td class="text-end fw-bold llx-money text-danger" title="Đã trả nhiều hơn thực lĩnh">−' + money(over) + '<div class="llx-subtext text-danger">Trả thừa</div></td>'
          : '<td class="text-end fw-bold llx-money ' + (remaining > 0 ? 'text-danger' : 'text-muted') + '">' + money(remaining) + '</td>') +
        '<td class="text-end text-muted llx-money">' + hoanHtml(item.hoan_chi_phi_da_thanh_toan, item.hoan_chi_phi_cho_hoan) + '</td>' +
        '<td><span class="badge ' + st[1] + '">' + esc(st[0]) + '</span></td>' +
      '</tr>';
    });
    $('#llx-table-body').html(html);
  }

  function buildActions(item) {
    var nid = esc((item.lai_xe && item.lai_xe.nid) || 0);
    var ky = esc(item.ky_luong || '');
    return '<div class="dropdown">' +
      '<button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><button type="button" class="dropdown-item llx-act-view" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-eye me-2 text-primary"></i>Xem chi tiết</button></li>' +
      (canPay() ?
      '<li><button type="button" class="dropdown-item llx-act-advance" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-cash me-2 text-info"></i>Ứng tiền</button></li>' +
      '<li><button type="button" class="dropdown-item llx-act-pay" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-wallet me-2 text-success"></i>Thanh toán lương</button></li>' +
      '<li><button type="button" class="dropdown-item llx-act-deduct" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-receipt-2 me-2 text-warning"></i>Khấu trừ tạm ứng</button></li>' : '') +
      '<li><button type="button" class="dropdown-item llx-act-history" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-history me-2 text-secondary"></i>Lịch sử tạm ứng</button></li>' +
      '</ul></div>';
  }

  function driverBankLine(driver) {
    var banks = driver.thong_tin_ngan_hang;
    if (Object.prototype.toString.call(banks) === '[object Array]' && banks.length) {
      var parts = [];
      $.each(banks, function (_, b) {
        b = b || {};
        var name = String(b.ngan_hang || '').trim();
        var stk = String(b.so_tai_khoan || '').trim();
        if (name || stk) parts.push([name, stk].filter(Boolean).join(' - '));
      });
      if (parts.length) return parts.join('; ');
    }
    return String(driver.sdt || '').trim();
  }

  function openDetail(nid, kyLuong) {
    var modalEl = document.getElementById('llx-detail-modal');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    $('#llx-detail-loading').addClass('is-visible');
    $('#llx-detail-body').html('');
    $('#llx-advance-body').html('');
    $('#llx-khau-tru-body').html('');
    $('#llx-payment-body').html('');
    modal.show();
    $.getJSON(API + '/' + nid, kyLuong ? { ky_luong: kyLuong } : query())
      .done(function (res) {
        renderDetail(res.data || {});
      })
      .fail(function (xhr) {
        notify(apiMsg(xhr), 'error');
      })
      .always(function () {
        $('#llx-detail-loading').removeClass('is-visible');
      });
  }

  function renderDetail(data) {
    currentDetail = data || {};
    var driver = data.lai_xe || {};
    $('#llx-detail-title').text('Chi tiết lương - ' + (driver.ten || 'Lái xe'));
    $('#llx-detail-meta').text([driver.ma_nhan_vien, driver.sdt].filter(Boolean).join(' / '));
    $('#llx-detail-plan-salary').text(money(data.tong_luong_ke_hoach));
    $('#llx-detail-reimburse').html(hoanHtml(data.hoan_chi_phi_da_thanh_toan, data.hoan_chi_phi_cho_hoan));
    $('#llx-detail-advance').text(money(data.tam_ung_da_chi));
    $('#llx-detail-deduct').text(money(data.khau_tru_tam_ung));
    $('#llx-detail-final').text(money(data.luong_chot));
    $('#llx-detail-net').text(money(data.thuc_lanh));
    $('#llx-print-link').attr('href', '/luong-lai-xe/pdf/' + driver.nid + '?date_from=' + encodeURIComponent(state.date_from || '') + '&date_to=' + encodeURIComponent(state.date_to || ''));

    var rows = data.plans || [];
    var html = '';
    if (!rows.length) {
      html = '<tr><td colspan="5" class="text-center text-muted py-4">Không có kế hoạch.</td></tr>';
    }
    $.each(rows, function (index, row) {
      var plan = row.ke_hoach || {};
      html += '<tr>' +
        '<td class="text-center">' + (index + 1) + '</td>' +
        '<td><div class="fw-semibold">' + esc(plan.so_bkg || ('#' + plan.nid)) + '</div><div class="llx-subtext">' + esc([plan.loai_cont, plan.so_cont].filter(Boolean).join(' - ')) + '</div></td>' +
        '<td>' + esc(plan.ngay_ke_hoach || '-') + '</td>' +
        '<td class="text-end">' + hoanHtml(row.de_nghi && row.de_nghi.da_thanh_toan, row.de_nghi && row.de_nghi.cho_hoan) + '</td>' +
        '<td class="text-end fw-semibold">' + money(row.luong_ke_hoach) + '</td>' +
      '</tr>';
    });
    $('#llx-detail-body').html(html);
    renderAdvanceHistory(data.tam_ung_items || []);
    renderKhauTruHistory(data.khau_tru_items || []);
    renderPaymentHistory(data.thanh_toan_items || []);
  }

  function renderKhauTruHistory(items) {
    var html = '';
    if (!items.length) {
      html = '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có khấu trừ tạm ứng.</td></tr>';
    }
    $.each(items, function (index, item) {
      var status = item.trang_thai_label || item.trang_thai || 'da_chi';
      var statusClass = item.trang_thai === 'huy' ? 'bg-label-danger'
        : (item.trang_thai === 'cho_duyet' ? 'bg-label-warning' : 'bg-label-success');
      var content = item.noi_dung || item.ghi_chu || ('Khấu trừ tạm ứng lương kỳ ' + (item.thang_luong || ''));
      html += '<tr>' +
        '<td class="text-center">' + (index + 1) + '</td>' +
        '<td>' + esc(item.created || '') + '</td>' +
        '<td>' + esc(item.ma_giao_dich || '') + '</td>' +
        '<td>' + esc(content) + '</td>' +
        '<td class="text-end">' + money(item.so_tien) + '</td>' +
        '<td class="text-center"><span class="badge ' + statusClass + '">' + esc(status) + '</span></td>' +
      '</tr>';
    });
    $('#llx-khau-tru-body').html(html);
  }

  function renderPaymentHistory(items) {
    var html = '';
    if (!items.length) {
      html = '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có thanh toán lương.</td></tr>';
    }
    $.each(items, function (index, item) {
      var status = item.trang_thai_label || item.trang_thai || 'da_chi';
      var statusClass = item.trang_thai === 'huy' ? 'bg-label-danger'
        : (item.trang_thai === 'cho_duyet' ? 'bg-label-warning' : 'bg-label-success');
      var content = item.noi_dung || item.ghi_chu || ('Thanh toán lương kỳ ' + (item.thang_luong || ''));
      html += '<tr>' +
        '<td class="text-center">' + (index + 1) + '</td>' +
        '<td>' + esc(item.ngay_chi_display || item.created_display || '') + '</td>' +
        '<td>' + esc(item.ma_phieu || '') + '</td>' +
        '<td>' + esc(content) + '</td>' +
        '<td class="text-end">' + money(item.so_tien) + '</td>' +
        '<td class="text-center"><span class="badge ' + statusClass + '">' + esc(status) + '</span></td>' +
      '</tr>';
    });
    $('#llx-payment-body').html(html);
  }

  function renderAdvanceHistory(items) {
    var html = '';
    if (!items.length) {
      html = '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có tạm ứng trong kỳ.</td></tr>';
    }
    $.each(items, function (index, item) {
      var status = item.trang_thai_label || item.trang_thai || 'da_chi';
      var statusClass = item.trang_thai === 'huy' ? 'bg-label-danger'
        : (item.trang_thai === 'cho_duyet' ? 'bg-label-warning' : 'bg-label-success');
      html += '<tr>' +
        '<td class="text-center">' + (index + 1) + '</td>' +
        '<td>' + esc(item.created || '') + '</td>' +
        '<td>' + esc(item.ma_giao_dich || '') + '</td>' +
        '<td>' + esc(item.noi_dung || '') + '</td>' +
        '<td class="text-end">' + money(item.so_tien) + '</td>' +
        '<td class="text-center"><span class="badge ' + statusClass + '">' + esc(status) + '</span></td>' +
      '</tr>';
    });
    $('#llx-advance-body').html(html);
  }

  function openDeductModal(nid, kyLuong) {
    if (!nid) return;
    var modalEl = document.getElementById('llx-deduct-modal');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    $('#llx-deduct-loading').addClass('is-visible');
    $('#llx-deduct-form').removeClass('was-validated');
    $('#llx-deduct-so-tien').val('');
    $('#llx-deduct-ghi-chu').val('');
    $('#llx-deduct-form').attr('data-driver-id', nid);
    $('#llx-deduct-form').attr('data-ky-luong', kyLuong || '');
    var driver = driverCache[nid] || {};
    var name = [String(driver.ten || '').trim(), String(driver.ma_nhan_vien || '').trim()].filter(Boolean).join(' - ') || 'Lái xe';
    $('#llx-deduct-title').text('Khấu trừ tạm ứng lương');
    $('#llx-deduct-driver').text([driver.ma_nhan_vien, driver.sdt].filter(Boolean).join(' / '));
    $('#llx-deduct-info-driver').text(name);
    $('#llx-deduct-info-ky').text('-');
    $('#llx-deduct-info-tong-luong').text('-');
    $('#llx-deduct-info-du-tru').text('-');
    modal.show();

    $.getJSON(API + '/' + nid + '/khau-tru', kyLuong ? { ky_luong: kyLuong } : query())
      .done(function (res) {
        populateDeductForm(res.data || {});
      })
      .fail(function (xhr) {
        notify(apiMsg(xhr), 'error');
      })
      .always(function () {
        $('#llx-deduct-loading').removeClass('is-visible');
      });
  }

  function populateDeductForm(data) {
    var driver = data.lai_xe || {};
    var summary = data.summary || {};
    var ky = data.ky_luong || '';
    deductCaps.tong_luong = number(summary.luong_con_lai !== undefined ? summary.luong_con_lai : summary.tong_luong);
    deductCaps.du_co_the_tru = number(summary.tam_ung_con_lai !== undefined ? summary.tam_ung_con_lai : summary.du_co_the_tru);
    $('#llx-deduct-info-driver').text([String(driver.ten || '').trim(), String(driver.ma_nhan_vien || '').trim()].filter(Boolean).join(' - ') || 'Lái xe');
    $('#llx-deduct-info-ky').text(data.ky_luong_display || '-');
    $('#llx-deduct-form').attr('data-ky-luong', data.ky_luong || ky || '');

    $('#llx-deduct-so-tien').val('');
    $('#llx-deduct-ghi-chu').val('Khấu trừ tạm ứng vào lương tháng ' + (data.ky_luong_display || ''));
    updateDeductRemaining();
  }

  function updateDeductRemaining() {
    var amount = parseMoney($('#llx-deduct-so-tien').val());
    $('#llx-deduct-info-tong-luong').text(money(Math.max(0, deductCaps.tong_luong - amount)));
    $('#llx-deduct-info-du-tru').text(money(Math.max(0, deductCaps.du_co_the_tru - amount)));
  }

  function submitDeduct() {
    var formEl = document.getElementById('llx-deduct-form');
    var nid = $(formEl).attr('data-driver-id');
    if (!nid) {
      notify('Không xác định được lái xe', 'error');
      return;
    }
    var kyLuong = $('#llx-deduct-form').attr('data-ky-luong') || '';
    var ky = String(kyLuong || '').replace(/\D/g, '');
    if (!/^\d{6}$/.test(ky)) {
      notify('Không xác định được kỳ lương của lái xe', 'error');
      return;
    }
    var amount = parseMoney($('#llx-deduct-so-tien').val());

    $('#llx-deduct-form').addClass('was-validated');
    if (amount <= 0) {
      notify('Vui lòng nhập số tiền khấu trừ hợp lệ', 'error');
      return;
    }
    if (amount > deductCaps.tong_luong) {
      notify('Số tiền khấu trừ không được lớn hơn lương còn lại', 'error');
      return;
    }
    if (amount > deductCaps.du_co_the_tru) {
      notify('Số tiền khấu trừ không được lớn hơn tạm ứng còn lại', 'error');
      return;
    }

    var btn = document.getElementById('llx-deduct-save');
    btn.disabled = true;
    $.ajax({
      url: API + '/' + nid + '/khau-tru',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        ky_luong: ky,
        so_tien: amount,
        ghi_chu: $('#llx-deduct-ghi-chu').val().trim()
      })
    }).done(function (res) {
      notify(res.data && res.data.message ? res.data.message : 'Đã lưu khấu trừ tạm ứng', 'success');
      var m = bootstrap.Modal.getInstance(document.getElementById('llx-deduct-modal'));
      if (m) m.hide();
      loadList();
      if (currentDetail && currentDetail.lai_xe && currentDetail.lai_xe.nid == nid) {
        openDetail(nid, currentDetail.filters && currentDetail.filters.ky_luong);
      }
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      btn.disabled = false;
    });
  }

  function openHistoryModal(nid, kyLuong) {
    if (!nid) return;
    var modalEl = document.getElementById('llx-history-modal');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    $('#llx-history-loading').addClass('is-visible');
    $('#llx-history-advance-body').html('');
    $('#llx-history-khau-tru-body').html('');
    var driver = driverCache[nid] || {};
    var name = [String(driver.ten || '').trim(), String(driver.ma_nhan_vien || '').trim()].filter(Boolean).join(' - ') || 'Lái xe';
    $('#llx-history-title').text('Lịch sử tạm ứng');
    $('#llx-history-driver').text([driver.ma_nhan_vien, driver.sdt].filter(Boolean).join(' / '));
    modal.show();

    $.getJSON(API + '/' + nid + '/lich-su-tam-ung', kyLuong ? { ky_luong: kyLuong } : query())
      .done(function (res) {
        renderHistory(res.data || {});
      })
      .fail(function (xhr) {
        notify(apiMsg(xhr), 'error');
      })
      .always(function () {
        $('#llx-history-loading').removeClass('is-visible');
      });
  }

  function renderHistory(data) {
    var summary = data.summary || {};
    $('#llx-history-dau-ky').text(money(summary.so_du_dau_ky));
    $('#llx-history-ung-ky').text(money(summary.phat_sinh_ung_trong_ky));
    $('#llx-history-khau-tru').text(money(summary.khau_tru_trong_ky));
    $('#llx-history-cuoi-ky').text(money(summary.so_du_cuoi_ky));

    var advances = data.tam_ung_rows || [];
    var html = '';
    if (!advances.length) {
      html = '<tr><td colspan="7" class="text-center text-muted py-3">Chưa có phiếu ứng tiền trong kỳ.</td></tr>';
    }
    $.each(advances, function (index, item) {
      var status = item.trang_thai_label || item.trang_thai || 'da_chi';
      var statusClass = item.trang_thai === 'huy' ? 'bg-label-danger'
        : (item.trang_thai === 'cho_duyet' ? 'bg-label-warning' : 'bg-label-success');
      html += '<tr>' +
        '<td><span class="fw-semibold">' + esc(item.ma_giao_dich || ('UT' + String(item.id || '').padStart(5, '0'))) + '</span></td>' +
        '<td>' + esc(item.created || '') + '</td>' +
        '<td class="text-end fw-semibold">' + money(item.so_tien) + '</td>' +
        '<td>' + esc(item.quy_chi_label || '-') + '</td>' +
        '<td>' + esc(item.hinh_thuc_chi_label || '-') + '</td>' +
        '<td class="text-center"><span class="badge ' + statusClass + '">' + esc(status) + '</span></td>' +
        '<td>' + esc(item.noi_dung || '') + '</td>' +
      '</tr>';
    });
    $('#llx-history-advance-body').html(html);

    var deductions = data.khau_tru_rows || [];
    var htmlKt = '';
    if (!deductions.length) {
      htmlKt = '<tr><td colspan="6" class="text-center text-muted py-3">Chưa có khấu trừ tạm ứng trong kỳ.</td></tr>';
    }
    $.each(deductions, function (index, item) {
      var status = item.trang_thai_label || item.trang_thai || 'da_chi';
      var statusClass = item.trang_thai === 'huy' ? 'bg-label-danger'
        : (item.trang_thai === 'cho_duyet' ? 'bg-label-warning' : 'bg-label-success');
      htmlKt += '<tr>' +
        '<td><span class="fw-semibold">' + esc(item.ma_giao_dich || '-') + '</span></td>' +
        '<td>' + esc(item.created || '') + '</td>' +
        '<td class="text-end fw-semibold">' + money(item.so_tien) + '</td>' +
        '<td>' + esc(item.quy_chi_label || '-') + '</td>' +
        '<td class="text-center"><span class="badge ' + statusClass + '">' + esc(status) + '</span></td>' +
        '<td>' + esc(item.noi_dung || '') + '</td>' +
      '</tr>';
    });
    $('#llx-history-khau-tru-body').html(htmlKt);
  }

  function moneyInputValue(value) {
    value = parseInt(value, 10) || 0;
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function monthDisplayToKy(value) {
    var parts = monthDisplayToParts(value);
    if (parts) return parts.year + parts.month;
    return '';
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
    try { input.setSelectionRange(nextCaret, nextCaret); } catch (e) {}
  }

  function createAdvance() {
    if (!currentDetail || !currentDetail.lai_xe || !currentDetail.lai_xe.nid) return;
    openAdvanceModal(currentDetail.lai_xe.nid, currentDetail.filters && currentDetail.filters.ky_luong, currentDetail.lai_xe);
  }

  function openAdvanceModal(nid, kyLuong, driver) {
    if (!nid) return;
    driver = driver || {};
    var modalEl = document.getElementById('llx-advance-modal');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    $('#llx-advance-loading').addClass('is-visible');
    $('#llx-advance-form').removeClass('was-validated');
    $('#llx-adv-so-tien').val('');
    $('#llx-adv-ghi-chu').val('');
    $('#llx-adv-quy').html('<option value="">-- Chọn quỹ chi --</option>');
    renderAdvanceDriver(nid, driver);
    initAdvancePeriod(kyLuong);
    initAdvanceDatePicker();
    modal.show();

    $.getJSON('/api/quan-ly-quy')
      .done(function (res) {
        populateAdvanceQuy((res.data && res.data.items) || []);
      })
      .fail(function (xhr) {
        notify(apiMsg(xhr), 'error');
      })
      .always(function () {
        $('#llx-advance-loading').removeClass('is-visible');
      });
  }

  function renderAdvanceDriver(nid, driver) {
    driver = driver || {};
    var name = [String(driver.ten || '').trim(), String(driver.ma_nhan_vien || '').trim()].filter(Boolean).join(' - ') || 'Lái xe';
    $('#llx-advance-title').text('Ứng tiền - ' + name);
    $('#llx-advance-driver').text(driverBankLine(driver));
    $('#llx-advance-form').attr('data-driver-id', nid);
  }

  function populateAdvanceQuy(items) {
    var quyHtml = '<option value="">-- Chọn quỹ chi --</option>';
    $.each(items, function (_, quy) {
      var label = String(quy.ten_quy || '');
      if (quy.ma_quy) label += ' (' + quy.ma_quy + ')';
      if (parseInt(quy.so_du_hien_tai, 10) > 0) label += ' - Số dư: ' + money(quy.so_du_hien_tai);
      quyHtml += '<option value="' + esc(quy.nid) + '">' + esc(label) + '</option>';
    });
    $('#llx-adv-quy').html(quyHtml);
  }

  function initAdvancePeriod(kyLuong) {
    var input = document.getElementById('llx-adv-ky-luong');
    input.value = kyToMonthDisplay(kyLuong);
    if (typeof flatpickr === 'undefined') return;
    try { input._flatpickr && input._flatpickr.destroy(); } catch (e) {}
    var options = {
      dateFormat: 'm/Y',
      allowInput: true,
      static: true
    };
    if (typeof monthSelectPlugin !== 'undefined') {
      options.plugins = [new monthSelectPlugin({
        shorthand: true,
        dateFormat: 'm/Y',
        altFormat: 'm/Y'
      })];
    }
    flatpickr(input, options);
  }

  function kyToMonthDisplay(kyLuong) {
    var m = String(kyLuong || '').match(/^(\d{4})(\d{2})$/);
    if (m) return m[2] + '/' + m[1];
    return toMonthDisplay(new Date());
  }

  function initAdvanceDatePicker() {
    var input = document.getElementById('llx-adv-ngay-ung');
    if (typeof flatpickr !== 'undefined') {
      try { input._flatpickr && input._flatpickr.destroy(); } catch (e) {}
      flatpickr(input, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        static: true,
        defaultDate: new Date()
      });
    } else {
      input.value = toDateDisplay(new Date());
    }
  }

  function toDateDisplay(date) {
    var d = String(date.getDate()).padStart(2, '0');
    var m = String(date.getMonth() + 1).padStart(2, '0');
    return d + '/' + m + '/' + date.getFullYear();
  }

  function submitAdvance() {
    var formEl = document.getElementById('llx-advance-form');
    var nid = $(formEl).attr('data-driver-id');
    if (!nid) {
      notify('Không xác định được lái xe', 'error');
      return;
    }
    var thang = '';
    var nam = '';
    var kyParts = monthDisplayToParts($('#llx-adv-ky-luong').val());
    if (kyParts) {
      nam = kyParts.year;
      thang = kyParts.month;
    }
    var quy = $('#llx-adv-quy').val();
    var ngay = $('#llx-adv-ngay-ung').val().trim();
    var amount = parseMoney($('#llx-adv-so-tien').val());

    $('#llx-advance-form').addClass('was-validated');
    if (!ngay || !thang || !nam || !quy || amount <= 0) {
      notify('Vui lòng nhập đầy đủ thông tin bắt buộc và số tiền lớn hơn 0', 'error');
      return;
    }

    var btn = document.getElementById('llx-advance-save');
    btn.disabled = true;
    $.ajax({
      url: API + '/' + nid + '/tam-ung',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        ky_luong: nam + thang,
        so_tien: amount,
        ngay_ung: ngay,
        hinh_thuc_chi: $('#llx-adv-hinh-thuc').val(),
        quy_chi: quy,
        ghi_chu: $('#llx-adv-ghi-chu').val().trim()
      })
    }).done(function (res) {
      notify(res.message || 'Đã tạo phiếu ứng tiền, chờ duyệt', 'success');
      var m = bootstrap.Modal.getInstance(document.getElementById('llx-advance-modal'));
      if (m) m.hide();
      loadList();
      if (currentDetail && currentDetail.lai_xe && currentDetail.lai_xe.nid == nid) {
        openDetail(nid, currentDetail.filters && currentDetail.filters.ky_luong);
      }
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      btn.disabled = false;
    });
  }

  function openPayModal(nid, kyLuong) {
    if (!nid) return;
    var modalEl = document.getElementById('llx-pay-modal');
    var modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    $('#llx-pay-loading').addClass('is-visible');
    $('#llx-pay-form').removeClass('was-validated');
    $('#llx-pay-quy').html('<option value="">-- Chọn quỹ chi --</option>');
    $('#llx-pay-form').attr('data-driver-id', nid);
    $('#llx-pay-form').attr('data-ky-luong', kyLuong || '');
    payQuyBalances = {};
    payModalData = { luong_phai_tra: 0 };
    var driver = driverCache[nid] || {};
    renderPayDriver(nid, driver);
    modal.show();

    $.getJSON('/api/quan-ly-quy')
      .done(function (res) {
        populatePayQuy((res.data && res.data.items) || []);
      })
      .fail(function (xhr) {
        notify(apiMsg(xhr), 'error');
      });

    $.getJSON(API + '/' + nid, kyLuong ? { ky_luong: kyLuong } : query())
      .done(function (res) {
        renderPayModal(res.data || {});
      })
      .fail(function (xhr) {
        notify(apiMsg(xhr), 'error');
      })
      .always(function () {
        $('#llx-pay-loading').removeClass('is-visible');
      });
  }

  function renderPayDriver(nid, driver) {
    driver = driver || {};
    var name = [String(driver.ten || '').trim(), String(driver.ma_nhan_vien || '').trim()].filter(Boolean).join(' - ') || 'Lái xe';
    $('#llx-pay-title').text('Thanh toán lương - ' + name);
    $('#llx-pay-driver').text(driverBankLine(driver));
  }

  function populatePayQuy(items) {
    var quyHtml = '<option value="">-- Chọn quỹ chi --</option>';
    $.each(items, function (_, quy) {
      var balance = parseInt(quy.so_du_hien_tai, 10) || 0;
      payQuyBalances[String(quy.nid)] = balance;
      var label = String(quy.ten_quy || '');
      if (quy.ma_quy) label += ' (' + quy.ma_quy + ')';
      label += ' - Số dư: ' + money(balance);
      quyHtml += '<option value="' + esc(quy.nid) + '">' + esc(label) + '</option>';
    });
    $('#llx-pay-quy').html(quyHtml);
  }

  function renderPayModal(data) {
    var driver = data.lai_xe || {};
    if (driver.nid) driverCache[driver.nid] = driver;
    renderPayDriver(driver.nid, driver);
    $('#llx-pay-plan-salary').text(money(data.tong_luong_ke_hoach));
    $('#llx-pay-reimburse').html(hoanHtml(data.hoan_chi_phi_da_thanh_toan, data.hoan_chi_phi_cho_hoan));
    $('#llx-pay-advance').text(money(data.tam_ung_da_chi));
    $('#llx-pay-deduct').text(money(data.khau_tru_tam_ung));
    $('#llx-pay-final').text(money(data.luong_chot));
    $('#llx-pay-paid').text(money(data.da_thanh_toan));
    $('#llx-pay-remaining').text(money(data.luong_phai_tra));
    $('#llx-pay-net').text(money(data.thuc_lanh));
    payModalData.luong_phai_tra = parseInt(data.luong_phai_tra, 10) || 0;

    var input = document.getElementById('llx-pay-ngay-chi');
    if (typeof flatpickr !== 'undefined') {
      try { input._flatpickr && input._flatpickr.destroy(); } catch (e) {}
      flatpickr(input, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        static: true,
        defaultDate: new Date()
      });
    } else {
      input.value = toDateDisplay(new Date());
    }

    $('#llx-pay-so-tien').val(moneyInputValue(data.luong_phai_tra));
    $('#llx-pay-ghi-chu').val('Thanh toán lương lái xe');
  }

  function submitPay() {
    var formEl = document.getElementById('llx-pay-form');
    var nid = $(formEl).attr('data-driver-id');
    if (!nid) {
      notify('Không xác định được lái xe', 'error');
      return;
    }
    var kyLuong = $(formEl).attr('data-ky-luong');
    if (!kyLuong) {
      notify('Không xác định được kỳ lương', 'error');
      return;
    }
    var ngayChi = $.trim($('#llx-pay-ngay-chi').val());
    if (!ngayChi || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ngayChi)) {
      notify('Vui lòng nhập ngày thanh toán hợp lệ (dd/mm/yyyy)', 'error');
      return;
    }
    var soTien = parseMoney($('#llx-pay-so-tien').val());
    var quyChi = $('#llx-pay-quy').val();

    $('#llx-pay-form').addClass('was-validated');
    if (soTien <= 0) {
      notify('Vui lòng nhập số tiền thanh toán lớn hơn 0', 'error');
      return;
    }
    if (payModalData.luong_phai_tra > 0 && soTien > payModalData.luong_phai_tra) {
      notify('Số tiền thanh toán không được lớn hơn lương phải trả còn lại (' + money(payModalData.luong_phai_tra) + ')', 'error');
      return;
    }
    if (!quyChi) {
      notify('Vui lòng chọn quỹ chi', 'error');
      return;
    }
    var quyBalance = payQuyBalances[quyChi];
    if (typeof quyBalance === 'number' && soTien > quyBalance) {
      notify('Số dư quỹ không đủ. Số dư hiện tại: ' + money(quyBalance), 'error');
      return;
    }

    var btn = document.getElementById('llx-pay-save');
    btn.disabled = true;
    $('#llx-pay-loading').addClass('is-visible');
    $.ajax({
      url: API + '/' + nid + '/thanh-toan',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        ky_luong: kyLuong,
        ngay_thanh_toan: ngayChi,
        hinh_thuc_chi: $('#llx-pay-hinh-thuc').val(),
        quy_chi: quyChi,
        so_tien: soTien,
        ghi_chu: $.trim($('#llx-pay-ghi-chu').val())
      })
    }).done(function (res) {
      notify('Đã tạo phiếu thanh toán lương ' + (res.data && res.data.ma_phieu ? res.data.ma_phieu : ''), 'success');
      var modalEl = document.getElementById('llx-pay-modal');
      if (modalEl) {
        var modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      loadList();
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      btn.disabled = false;
      $('#llx-pay-loading').removeClass('is-visible');
    });
  }

  function renderPagination(data) {
    var container = document.getElementById('llx-pagination');
    if (!container) return;
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var total = parseInt(data.total_pages, 10) || 0;
    var current = parseInt(data.current_page, 10) || 0;
    var totalItems = parseInt(data.total, 10) || 0;

    document.getElementById('llx-pagination-info').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('llx-pagination-total').textContent = '/ ' + total;

    var jumpInput = document.getElementById('llx-pagination-jump');
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

  function setTableLoading() {
    $('#llx-table-body').html('<tr><td colspan="12" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
  }

  function money(value) {
    value = parseInt(value, 10) || 0;
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
  }

  function number(value) {
    return parseInt(value, 10) || 0;
  }

  function parseMoney(value) {
    value = String(value || '').replace(/[^\d-]/g, '');
    return parseInt(value, 10) || 0;
  }

  function toMonthDisplay(date) {
    var m = String(date.getMonth() + 1).padStart(2, '0');
    return m + '/' + date.getFullYear();
  }

  function monthDisplayToParts(value) {
    value = $.trim(String(value || ''));
    if (!value) return null;
    var my = value.match(/^(\d{1,2})\/(\d{4})$/);
    if (my) {
      return { year: my[2], month: String(my[1]).padStart(2, '0') };
    }
    var ym = value.match(/^(\d{4})-(\d{1,2})$/);
    if (ym) {
      return { year: ym[1], month: String(ym[2]).padStart(2, '0') };
    }
    return null;
  }

  function lastDayOfMonth(year, month) {
    return String(new Date(parseInt(year, 10), parseInt(month, 10), 0).getDate()).padStart(2, '0');
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
      var res = JSON.parse(xhr.responseText || '{}');
      return res.message || 'Lỗi kết nối server';
    }
    catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function notify(message, type) {
    if (notyf && type === 'error') notyf.error(message);
    else if (notyf) notyf.success(message);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }
})(jQuery, Drupal);

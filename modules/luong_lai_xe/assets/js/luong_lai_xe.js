(function ($, Drupal) {
  'use strict';

  var API = '/api/luong-lai-xe';
  var currentPage = 1;
  var state = {
    date_from: '',
    date_to: '',
    keyword: ''
  };
  var driverCache = {};
  var currentDetail = null;
  var notyf;

  Drupal.behaviors.luongLaiXe = {
    attach: function (context) {
      var $table = $('#llx-table-body', context);
      if (!$table.length || $table.data('llxInit')) return;
      $table.data('llxInit', true);
      if (typeof Notyf !== 'undefined' && !notyf) notyf = new Notyf();
      initDefaults();
      initDatePickers();
      bindEvents();
      loadList();
    }
  };

  function initDefaults() {
    if ($('#llx-ky-luong-from').val() || $('#llx-ky-luong-to').val()) return;
    var now = new Date();
    $('#llx-ky-luong-from').val(toMonthDisplay(now));
    $('#llx-ky-luong-to').val(toMonthDisplay(now));
    readFilters();
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
    $(document).off('mouseover.llx');
    $(document).off('mouseout.llx');

    $(document).on('keypress.llx', '#llx-pagination-jump', function (e) {
      if (e.which !== 13) return;
      var page = parseInt(this.value, 10);
      var total = parseInt($(this).attr('data-total-pages'), 10);
      if (page > 0 && page <= total) {
        currentPage = page;
        loadList();
      }
    });

    $(document).on('change.llx', '#llx-ky-luong-from, #llx-ky-luong-to', function () {
      readFilters();
      currentPage = 1;
      loadList();
    });

    $(document).on('click.llx', '#llx-search-btn', function () {
      applySearch();
    });

    $(document).on('keypress.llx', '#llx-keyword', function (e) {
      if (e.which !== 13) return;
      e.preventDefault();
      applySearch();
    });

    $(document).on('click.llx', '#llx-btn-reload', function () {
      $('#llx-ky-luong-from, #llx-ky-luong-to, #llx-keyword').val('');
      initDefaults();
      readFilters();
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

    $(document).on('click.llx', '.llx-act-view, .llx-act-pay, .llx-act-deduct, .llx-act-history', function (e) {
      e.preventDefault();
      openDetail($(this).attr('data-id'), $(this).attr('data-ky-luong'));
    });

    $(document).on('click.llx', '.llx-act-advance', function (e) {
      e.preventDefault();
      var nid = $(this).attr('data-id');
      openAdvanceModal(nid, $(this).attr('data-ky-luong'), driverCache[nid] || {});
    });

    $(document).on('mouseover.llx', '#llx-table-body .dropdown', function () {
      var menu = this.querySelector('.dropdown-menu');
      if (!menu) return;
      var btn = this.querySelector('button');
      var rect = btn.getBoundingClientRect();
      menu.style.position = 'fixed';
      menu.style.top = rect.top + 'px';
      menu.style.left = rect.right + 'px';
      menu.style.display = 'block';
    });

    $(document).on('mouseout.llx', '#llx-table-body .dropdown', function (e) {
      var menu = this.querySelector('.dropdown-menu');
      if (menu && !this.contains(e.relatedTarget)) {
        menu.style.display = '';
        menu.style.position = '';
        menu.style.top = '';
        menu.style.left = '';
      }
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
      paySalary();
    });
  }

  function readFilters() {
    var from = monthDisplayToParts($('#llx-ky-luong-from').val());
    var to = monthDisplayToParts($('#llx-ky-luong-to').val());
    state.date_from = from ? from.year + '-' + from.month + '-01' : '';
    state.date_to = to ? to.year + '-' + to.month + '-' + lastDayOfMonth(to.year, to.month) : '';
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
      })
      .fail(function (xhr) {
        $('#llx-table-body').html('<tr><td colspan="10" class="text-center text-danger py-4">' + esc(apiMsg(xhr)) + '</td></tr>');
      });
  }

  function renderRows(items) {
    if (!items.length) {
      $('#llx-table-body').html('<tr><td colspan="10" class="text-center text-muted py-4">Không có dữ liệu lương trong khoảng lọc.</td></tr>');
      return;
    }
    var html = '';
    $.each(items, function (index, item) {
      var driver = item.lai_xe || {};
      if (driver.nid) driverCache[driver.nid] = driver;
      var stt = (((currentPage - 1) * 20) + index + 1);
      var driverName = [String(driver.ten || '').trim(), String(driver.ma_nhan_vien || '').trim()].filter(Boolean).join(' - ') || '-';
      var driverSub = driverBankLine(driver);
      html += '<tr>' +
        '<td class="text-center">' + buildActions(item) + '</td>' +
        '<td class="text-center">' + stt + '</td>' +
        '<td><div class="llx-driver-name">' + esc(driverName) + '</div><div class="llx-subtext">' + esc(driverSub) + '</div></td>' +
        '<td>' + esc(item.ky_luong_display || '-') + '</td>' +
        '<td class="text-center">' + number(item.so_ke_hoach) + '</td>' +
        '<td class="text-end fw-semibold text-primary">' + money(item.tong_luong_ke_hoach) + '</td>' +
        '<td class="text-end">' + money(item.hoan_chi_phi_da_thanh_toan) + '</td>' +
        '<td class="text-end">' + money(item.tam_ung_da_chi) + '</td>' +
        '<td class="text-end">' + money(item.khau_tru_tam_ung) + '</td>' +
        '<td class="text-end fw-semibold text-success">' + money(item.thuc_lanh) + '</td>' +
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
      '<li><button type="button" class="dropdown-item llx-act-advance" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-cash me-2 text-info"></i>Ứng tiền</button></li>' +
      '<li><button type="button" class="dropdown-item llx-act-pay" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-wallet me-2 text-success"></i>Thanh toán lương</button></li>' +
      '<li><button type="button" class="dropdown-item llx-act-deduct" data-id="' + nid + '" data-ky-luong="' + ky + '"><i class="ti tabler-receipt-2 me-2 text-warning"></i>Khấu trừ tạm ứng</button></li>' +
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
    $('#llx-detail-reimburse').text(money(data.hoan_chi_phi_da_thanh_toan));
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
        '<td class="text-end">' + money(row.de_nghi && row.de_nghi.da_thanh_toan) + '</td>' +
        '<td class="text-end fw-semibold">' + money(row.luong_ke_hoach) + '</td>' +
      '</tr>';
    });
    $('#llx-detail-body').html(html);
    renderAdvanceHistory(data.tam_ung_items || []);
    renderKhauTruHistory(data.khau_tru_items || []);
  }

  function renderKhauTruHistory(items) {
    var html = '';
    if (!items.length) {
      html = '<tr><td colspan="4" class="text-center text-muted py-3">Chưa có khấu trừ tạm ứng.</td></tr>';
    }
    $.each(items, function (index, item) {
      var content = item.noi_dung || item.ghi_chu || ('Khấu trừ tạm ứng kỳ ' + (item.thang_luong || ''));
      html += '<tr>' +
        '<td class="text-center">' + (index + 1) + '</td>' +
        '<td>' + esc(item.created || '') + '</td>' +
        '<td>' + esc(content) + '</td>' +
        '<td class="text-end">' + money(item.so_tien) + '</td>' +
      '</tr>';
    });
    $('#llx-khau-tru-body').html(html);
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
    $('#llx-advance-driver').text([driver.ma_nhan_vien, driver.sdt].filter(Boolean).join(' / '));
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

  function paySalary() {
    if (!currentDetail || !currentDetail.lai_xe || !currentDetail.lai_xe.nid) return;
    var net = parseInt(currentDetail.thuc_lanh, 10) || 0;
    var msg = 'Thanh toán lương thực lãnh ' + money(net) + ' cho ' + (currentDetail.lai_xe.ten || 'lái xe') + '?';
    if (!window.confirm(msg)) return;
    $('#llx-detail-loading').addClass('is-visible');
    $.ajax({
      url: API + '/' + currentDetail.lai_xe.nid + '/thanh-toan',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        ky_luong: currentDetail.filters && currentDetail.filters.ky_luong,
        luong_chot: currentDetail.luong_chot || currentDetail.luong_tam_tinh,
        khau_tru_tam_ung: currentDetail.khau_tru_tam_ung
      })
    }).done(function () {
      notify('Đã thanh toán lương', 'success');
      openDetail(currentDetail.lai_xe.nid, currentDetail.filters && currentDetail.filters.ky_luong);
      loadList();
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      $('#llx-detail-loading').removeClass('is-visible');
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
    $('#llx-table-body').html('<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
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

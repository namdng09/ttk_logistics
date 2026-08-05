(function ($, Drupal) {
  'use strict';

  var API = '/api/luong-lai-xe';
  var currentPage = 1;
  var state = {
    date_from: '',
    date_to: ''
  };
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

    $(document).on('change.llx', '#llx-ky-luong-from, #llx-ky-luong-to', function () {
      readFilters();
      currentPage = 1;
      loadList();
    });

    $(document).on('click.llx', '#llx-btn-reload', function () {
      $('#llx-ky-luong-from, #llx-ky-luong-to').val('');
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

    $(document).on('click.llx', '.llx-view-detail', function (e) {
      e.preventDefault();
      openDetail($(this).attr('data-id'), $(this).attr('data-ky-luong'));
    });

    $(document).on('click.llx', '#llx-btn-advance', function () {
      createAdvance();
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
      html += '<tr>' +
        '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill llx-view-detail" data-id="' + esc(driver.nid) + '" data-ky-luong="' + esc(item.ky_luong || '') + '"><i class="ti tabler-dots-vertical"></i></button></td>' +
        '<td class="text-center">' + (((currentPage - 1) * 20) + index + 1) + '</td>' +
        '<td><div class="llx-driver-name">' + esc(driver.ten || '-') + '</div><div class="llx-subtext">' + esc([driver.ma_nhan_vien, driver.sdt].filter(Boolean).join(' / ')) + '</div></td>' +
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
  }

  function renderAdvanceHistory(items) {
    var html = '';
    if (!items.length) {
      html = '<tr><td colspan="5" class="text-center text-muted py-3">Chưa có tạm ứng trong kỳ.</td></tr>';
    }
    $.each(items, function (index, item) {
      html += '<tr>' +
        '<td class="text-center">' + (index + 1) + '</td>' +
        '<td>' + esc(item.created || '') + '</td>' +
        '<td>' + esc(item.ma_giao_dich || '') + '</td>' +
        '<td>' + esc(item.noi_dung || '') + '</td>' +
        '<td class="text-end">' + money(item.so_tien) + '</td>' +
      '</tr>';
    });
    $('#llx-advance-body').html(html);
  }

  function createAdvance() {
    if (!currentDetail || !currentDetail.lai_xe || !currentDetail.lai_xe.nid) return;
    var raw = window.prompt('Nhập số tiền tạm ứng');
    if (raw === null) return;
    var amount = parseMoney(raw);
    if (amount <= 0) {
      notify('Số tiền tạm ứng không hợp lệ', 'error');
      return;
    }
    $('#llx-detail-loading').addClass('is-visible');
    $.ajax({
      url: API + '/' + currentDetail.lai_xe.nid + '/tam-ung',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        ky_luong: currentDetail.filters && currentDetail.filters.ky_luong,
        so_tien: amount,
        noi_dung: 'Tạm ứng lương kỳ ' + ((currentDetail.filters && currentDetail.filters.ky_luong) || '')
      })
    }).done(function () {
      notify('Đã tạo tạm ứng lương', 'success');
      openDetail(currentDetail.lai_xe.nid, currentDetail.filters && currentDetail.filters.ky_luong);
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      $('#llx-detail-loading').removeClass('is-visible');
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
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
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

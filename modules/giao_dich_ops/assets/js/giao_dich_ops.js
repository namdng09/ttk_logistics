(function ($, Drupal) {
  'use strict';

  var notyf;
  var bound = false;
  var currentPage = 1;
  var currentLimit = 20;
  var filters = {};

  Drupal.behaviors.giaoDichOps = {
    attach: function (context) {
      if (!$('#giao-dich-ops-app', context).length || bound) return;
      bound = true;
      if (typeof Notyf !== 'undefined') notyf = new Notyf();
      bindEvents();
      loadList();
    }
  };

  function bindEvents() {
    bind('btn-reload-giao-dich-ops', 'click', function () {
      currentPage = 1;
      loadList();
    });

    bind('btn-open-filter-giao-dich-ops', 'click', function () {
      modalShow('giao-dich-ops-filter-modal');
    });

    bind('btn-reset-filter-giao-dich-ops', 'click', function () {
      filters = {};
      currentLimit = 20;
      currentPage = 1;
      document.getElementById('form-filter-giao-dich-ops').reset();
      loadList();
    });

    bind('form-filter-giao-dich-ops', 'submit', function (e) {
      e.preventDefault();
      var data = formData(this);
      filters = {};
      Object.keys(data).forEach(function (key) {
        if (data[key] !== '') filters[key] = data[key];
      });
      currentLimit = parseInt(filters.limit || 20, 10) || 20;
      currentPage = 1;
      modalHide('giao-dich-ops-filter-modal');
      loadList();
    });

    bind('pagination-giao-dich-ops-jump', 'keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value, 10);
        var total = parseInt(this.getAttribute('data-total-pages'), 10);
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (t.classList && t.classList.contains('btn-view-giao-dich-ops')) {
          e.preventDefault();
          openDetail(t.getAttribute('data-id'));
          return;
        }
        if (t.classList && t.classList.contains('page-link-giao-dich-ops')) {
          e.preventDefault();
          var page = parseInt(t.getAttribute('data-page'), 10);
          if (page && page !== currentPage) {
            currentPage = page;
            loadList();
          }
          return;
        }
        t = t.parentElement;
      }
    });
  }

  function loadList() {
    renderLoading();
    var params = $.extend({}, filters, { page: currentPage, limit: currentLimit });
    $.ajax({
      url: '/api/giao-dich-ops',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        var data = res && res.data ? res.data : {};
        renderRows(data.items || []);
        renderPagination(data);
        renderKpis(data.items || [], data.total || 0);
      },
      error: function (xhr) {
        renderError(apiMsg(xhr));
        toastError(apiMsg(xhr));
      }
    });
  }

  function renderLoading() {
    $('#table-giao-dich-ops-tbody').html('<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
  }

  function renderError(message) {
    $('#table-giao-dich-ops-tbody').html('<tr><td colspan="10" class="text-center text-danger py-4">' + esc(message) + '</td></tr>');
  }

  function renderRows(items) {
    if (!items.length) {
      $('#table-giao-dich-ops-tbody').html('<tr><td colspan="10" class="text-center text-muted py-4">Không có dữ liệu</td></tr>');
      return;
    }

    var html = items.map(function (item, idx) {
      var stt = (currentPage - 1) * currentLimit + idx + 1;
      var isCredit = item.huong === 'credit';
      var personMain = item.lai_xe_ten || item.ops_ten || '';
      var personSub = item.lai_xe_ten && item.ops_ten ? item.ops_ten : (item.nid_lai_xe ? 'Lái xe #' + item.nid_lai_xe : (item.uid_ops ? 'UID #' + item.uid_ops : ''));
      var directionText = isCredit ? 'Thu' : 'Chi';
      var directionIcon = isCredit ? 'tabler-arrow-up' : 'tabler-arrow-down';
      var moneySign = isCredit ? '+' : '-';
      return '<tr>'
        + '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill btn-view-giao-dich-ops" data-id="' + item.nid + '"><i class="ti tabler-eye"></i></button></td>'
        + '<td>' + stt + '</td>'
        + '<td>' + esc(formatDateTime(item.created)) + '</td>'
        + '<td><span class="ops-code">' + esc(item.ma_giao_dich) + '</span></td>'
        + '<td><div class="ops-person-main">' + esc(personMain || '-') + '</div><div class="ops-person-sub">' + esc(personSub || '') + '</div></td>'
        + '<td><span class="ops-direction-pill ops-direction-pill-' + (isCredit ? 'credit' : 'debit') + '"><i class="ti ' + directionIcon + '"></i>' + directionText + '</span></td>'
        + '<td><span class="ops-type-pill ops-type-pill-' + (isCredit ? 'credit' : 'debit') + '">' + esc(item.loai_giao_dich_label || item.loai_giao_dich) + '</span></td>'
        + '<td class="text-end"><span class="ops-money-pill ops-money-pill-' + (isCredit ? 'credit' : 'debit') + '">' + moneySign + formatMoney(item.so_tien) + '</span></td>'
        + '<td class="text-end fw-semibold"><span class="ops-balance-pill">' + formatMoney(item.so_du_sau) + '</span></td>'
        + '<td>' + esc(item.so_bkg || '') + '</td>'
        + '<td class="ops-desc-cell">' + esc(item.noi_dung || '') + '</td>'
        + '</tr>';
    }).join('');
    $('#table-giao-dich-ops-tbody').html(html);
  }

  function renderPagination(data) {
    var total = parseInt(data.total || 0, 10);
    var totalPages = parseInt(data.total_pages || 0, 10);
    $('#pagination-giao-dich-ops-info').text('Tổng ' + total + ' dòng');
    $('#pagination-giao-dich-ops-total-pages').text('/ ' + totalPages);
    $('#pagination-giao-dich-ops-jump').val(currentPage).attr('data-total-pages', totalPages);

    var html = '';
    html += '<li class="page-item ' + (currentPage <= 1 ? 'disabled' : '') + '"><a href="#" class="page-link page-link-giao-dich-ops" data-page="' + Math.max(1, currentPage - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    for (var i = 1; i <= Math.max(totalPages, 1); i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        html += '<li class="page-item ' + (i === currentPage ? 'active' : '') + '"><a href="#" class="page-link page-link-giao-dich-ops" data-page="' + i + '">' + i + '</a></li>';
      }
      else if (i === currentPage - 3 || i === currentPage + 3) {
        html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }
    html += '<li class="page-item ' + (currentPage >= totalPages ? 'disabled' : '') + '"><a href="#" class="page-link page-link-giao-dich-ops" data-page="' + Math.max(1, Math.min(totalPages, currentPage + 1)) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    $('#pagination-giao-dich-ops .pagination').html(html);
  }

  function renderKpis(items, total) {
    var credit = 0;
    var debit = 0;
    var balance = 0;
    items.forEach(function (item) {
      if (item.huong === 'credit') credit += parseInt(item.so_tien || 0, 10);
      if (item.huong === 'debit') debit += parseInt(item.so_tien || 0, 10);
      if (!balance) balance = parseInt(item.so_du_sau || 0, 10);
    });
    $('[data-kpi="total"]').text(total);
    $('[data-kpi="credit"]').text('+' + formatMoney(credit));
    $('[data-kpi="debit"]').text('-' + formatMoney(debit));
    $('[data-kpi="balance"]').text(formatMoney(balance));
  }

  function openDetail(id) {
    $('#giao-dich-ops-detail-content').empty();
    $('#giao-dich-ops-detail-loading').show();
    modalShow('giao-dich-ops-detail-modal');

    $.ajax({
      url: '/api/giao-dich-ops/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        renderDetail(res.data || {});
      },
      error: function (xhr) {
        $('#giao-dich-ops-detail-content').html('<div class="text-danger">' + esc(apiMsg(xhr)) + '</div>');
      },
      complete: function () {
        $('#giao-dich-ops-detail-loading').hide();
      }
    });
  }

  function renderDetail(item) {
    var isCredit = item.huong === 'credit';
    var rows = [
      ['Mã giao dịch', item.ma_giao_dich],
      ['Thời gian', formatDateTime(item.created)],
      ['Hướng', item.huong_label],
      ['Nghiệp vụ', item.loai_giao_dich_label],
      ['Số tiền', formatMoney(item.so_tien)],
      ['Số dư trước', formatMoney(item.so_du_truoc)],
      ['Số dư sau', formatMoney(item.so_du_sau)],
      ['OPS', item.ops_ten || item.uid_ops],
      ['Lái xe', item.lai_xe_ten || item.nid_lai_xe],
      ['Booking', item.so_bkg],
      ['Tham chiếu', (item.tham_chieu_loai || '') + (item.tham_chieu_id ? ' #' + item.tham_chieu_id : '')],
      ['Nội dung', item.noi_dung]
    ];
    var html = '<div class="mb-3"><span class="badge bg-label-' + (isCredit ? 'success' : 'danger') + '">' + esc(item.huong_label || '') + '</span></div>';
    html += '<div class="ops-detail-grid">';
    rows.forEach(function (row) {
      html += '<div class="ops-detail-item"><div class="ops-detail-label">' + esc(row[0]) + '</div><div class="ops-detail-value">' + esc(row[1] || '-') + '</div></div>';
    });
    html += '</div>';
    $('#giao-dich-ops-detail-content').html(html);
  }

  function formData(form) {
    var data = {};
    $(form).serializeArray().forEach(function (item) {
      data[item.name] = item.value.trim();
    });
    return data;
  }

  function modalHide(id) {
    var el = document.getElementById(id);
    var m = el ? bootstrap.Modal.getInstance(el) : null;
    if (m) m.hide();
  }

  function modalShow(id) {
    var el = document.getElementById(id);
    if (el) new bootstrap.Modal(el).show();
  }

  function bind(id, eventName, handler) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(eventName, handler);
  }

  function apiMsg(xhr) {
    try {
      var json = JSON.parse(xhr.responseText);
      return json.message || 'Lỗi kết nối server';
    }
    catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function toastError(message) {
    if (notyf) notyf.error(message);
  }

  function formatMoney(value) {
    var n = parseInt(value || 0, 10);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
  }

  function formatDateTime(value) {
    if (!value) return '';
    var parts = String(value).split(' ');
    if (parts.length < 2) return value;
    var d = parts[0].split('-');
    if (d.length !== 3) return value;
    return d[2] + '/' + d[1] + '/' + d[0] + ' ' + parts[1].slice(0, 5);
  }

  function esc(value) {
    return $('<div>').text(value == null ? '' : String(value)).html();
  }
})(jQuery, Drupal);

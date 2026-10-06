(function ($) {
  'use strict';

  var API = '/api/phieu-tra-khach-hang';
  // tab: trạng thái đang xem ('all' = mọi trạng thái, kể cả đã huỷ).
  var state = { page: 1, suppressFilterChange: false, tab: 'all' };
  var TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'chua_duyet', label: 'Chờ duyệt' },
    { id: 'da_duyet', label: 'Khách đã duyệt' },
    { id: 'huy', label: 'Đã huỷ' }
  ];
  var notyf;

  function notify(message, type) {
    if (!notyf && window.Notyf) notyf = new Notyf();
    if (notyf) type === 'error' ? notyf.error(message) : notyf.success(message);
    else window.alert(message);
  }

  // Dòng báo lỗi khi tải danh sách: hiện đúng lý do server trả về; 401/403 (không có quyền) thì chữ vàng + icon ổ khoá.
  function loadErrorRow(colspan, jqXHR) {
    var denied = !!jqXHR && (jqXHR.status === 401 || jqXHR.status === 403);
    var msg = String(apiMsg(jqXHR)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<tr><td colspan="' + colspan + '" class="text-center py-4 ' + (denied ? 'text-warning' : 'text-danger') + '">' +
      (denied ? '<i class="ti tabler-lock me-1"></i>' : '') + msg + '</td></tr>';
  }

  function apiMsg(xhr) {
    try { return JSON.parse(xhr.responseText).message || 'Lỗi không xác định'; }
    catch (e) { return 'Lỗi kết nối server'; }
  }

  function esc(v) {
    return $('<div>').text(v == null ? '' : v).html();
  }

  function money(v) {
    v = parseInt(v || 0, 10) || 0;
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function moneyDong(v) {
    return money(v) + ' đ';
  }

  function apiToDatetime(val) {
    if (!val) return '-';
    var parts = String(val).split(' ');
    var d = parts[0] ? parts[0].split('-') : [];
    if (d.length === 3) return d[2] + '/' + d[1] + '/' + d[0] + (parts[1] ? ' ' + parts[1] : '');
    return val;
  }

  function apiToDate(val) {
    if (!val) return '-';
    var d = String(val).split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : val;
  }

  function statusText(s) {
    if (s && typeof s === 'object') return s.label || s.value || '-';
    var map = {
      chua_duyet: 'Chờ duyệt',
      da_duyet: 'Khách đã duyệt',
      huy: 'Đã huỷ',
      khong_duyet: 'Không duyệt'
    };
    return map[s] || (s || '-');
  }

  function statusBadge(s) {
    if (s && typeof s === 'object') s = s.value || '';
    var map = {
      chua_duyet: ['Chờ duyệt', 'bg-label-warning'],
      da_duyet: ['Khách đã duyệt', 'bg-label-success'],
      huy: ['Đã huỷ', 'bg-label-secondary'],
      khong_duyet: ['Không duyệt', 'bg-label-danger']
    };
    var item = map[s] || [s || '-', 'bg-label-secondary'];
    return '<span class="badge ' + item[1] + '">' + esc(item[0]) + '</span>';
  }

  function customerName(item) {
    return item && item.khach_hang && typeof item.khach_hang === 'object' ? (item.khach_hang.ten || '-') : (item.khach_hang || '-');
  }

  function userName(item) {
    return item && item.nguoi_thuc_hien && typeof item.nguoi_thuc_hien === 'object' ? (item.nguoi_thuc_hien.name || '-') : (item.nguoi_thuc_hien || '-');
  }

  function itemTime(item, key) {
    return item && item.thoi_gian ? (item.thoi_gian[key] || '') : (item ? (item[key] || '') : '');
  }

  function itemTotal(item, key) {
    if (item && item.tong_tien && typeof item.tong_tien === 'object') return item.tong_tien[key] || 0;
    if (!item) return 0;
    if (key === 'doanh_thu') return item.tong_doanh_thu || 0;
    if (key === 'chi_ho_khach_hang') return item.tong_chi_ho_khach_hang || 0;
    return key === 'tong' ? (item.tong_tien || 0) : 0;
  }

  function approveStatus(item) {
    return item && item.trang_thai && item.trang_thai.duyet ? item.trang_thai.duyet : (item ? item.trang_thai_duyet : '');
  }

  // Thao tác do server trả về (_ptkh_actions()): JS chỉ hiển thị.
  var ACTION_UI = {
    sua: { icon: 'tabler-edit', color: 'text-primary', cls: 'ptkh-edit' },
    duyet: { icon: 'tabler-circle-check', color: 'text-success', cls: 'ptkh-approve' },
    bo_duyet: { icon: 'tabler-arrow-back-up', color: 'text-warning', cls: 'ptkh-act' },
    huy: { icon: 'tabler-circle-x', color: 'text-danger', cls: 'ptkh-act' }
  };

  function actionItemsHtml(item) {
    return $.map(item.hanh_dong || [], function (a) {
      var ui = ACTION_UI[a.action] || { icon: 'tabler-point', color: 'text-secondary', cls: 'ptkh-act' };
      if (a.ly_do) {
        return '<li title="' + esc(a.ly_do) + '"><span class="dropdown-item disabled"><i class="ti ' + ui.icon + ' me-2 text-muted"></i>' + esc(a.label) + ' <small class="text-muted">(' + esc(a.ly_do) + ')</small></span></li>';
      }
      return '<li><a href="#" class="dropdown-item ' + ui.cls + (a.action === 'huy' ? ' text-danger' : '') + '" data-id="' + item.nid + '" data-action="' + esc(a.action) + '"><i class="ti ' + ui.icon + ' me-2 ' + ui.color + '"></i>' + esc(a.label) + '</a></li>';
    }).join('');
  }

  function downloadUrl(item) {
    return (item && item.download_url) || (item && item.file && item.file.download_url) || (item ? ('/phieu-tra-khach-hang/tai/' + item.nid) : '#');
  }

  function reloadFromFilter() {
    if (state.suppressFilterChange) return;
    state.page = 1;
    loadList();
  }

  function resetFilters() {
    state.suppressFilterChange = true;
    state.page = 1;
    state.tab = 'all';
    $('#ptkh-filter-customer').val('').trigger('change');
    $('#ptkh-keyword').val('');
    clearCreatedRange();
    state.suppressFilterChange = false;
    loadList();
  }

  // Khoảng ngày tạo đã áp dụng (d/m/Y cho API) — ô để trống = không lọc ngày.
  function readCreatedRange() {
    var $range = $('#ptkh-filter-created');
    var picker = $range.data('daterangepicker');
    if (!$range.val() || !picker) return { from: '', to: '' };
    return { from: picker.startDate.format('DD/MM/YYYY'), to: picker.endDate.format('DD/MM/YYYY') };
  }

  function clearCreatedRange() {
    var $range = $('#ptkh-filter-created');
    var picker = $range.data('daterangepicker');
    $range.val('');
    if (picker && window.moment) { picker.setStartDate(moment().startOf('day')); picker.setEndDate(moment().endOf('day')); }
  }

  function queryFilters() {
    var range = readCreatedRange();
    return {
      page: state.page,
      nid_khach_hang: $('#ptkh-filter-customer').val() || '',
      created_from: range.from,
      created_to: range.to,
      trang_thai_duyet: state.tab === 'all' ? '' : state.tab,
      keyword: $('#ptkh-keyword').val() || ''
    };
  }

  function renderTabs(counts) {
    counts = counts || {};
    $('#ptkh-tabs').html($.map(TABS, function (t) {
      return '<li class="nav-item"><button type="button" class="nav-link waves-effect waves-light' + (state.tab === t.id ? ' active' : '') + '" data-tab="' + t.id + '" role="tab">' +
        esc(t.label) + ' <span class="badge bg-label-primary ms-1">' + (parseInt(counts[t.id], 10) || 0) + '</span></button></li>';
    }).join(''));
  }

  function initSelect2($el, placeholder, dropdownParent) {
    if (!$el || !$el.length || !$.fn.select2) return;
    if ($el.data('select2')) $el.select2('destroy');
    var opts = {
      width: '100%',
      allowClear: true,
      placeholder: placeholder || 'Tất cả'
    };
    if (dropdownParent) opts.dropdownParent = dropdownParent;
    $el.select2(opts);
    $el.off('select2:open.ptkhFocus').on('select2:open.ptkhFocus', function () {
      window.setTimeout(function () {
        var search = document.querySelector('.select2-container--open .select2-search__field');
        if (search) search.focus();
      }, 0);
    });
  }

  // Ô "Ngày tạo": daterangepicker tiếng Việt + Hôm nay/Tuần này/Tháng này, giống bộ lọc /de-nghi-thanh-toan và /ke-hoach-xep-xe.
  function initCreatedRange() {
    var $range = $('#ptkh-filter-created');
    if (!$range.length || $range.data('daterangepicker') || typeof $.fn.daterangepicker !== 'function' || typeof moment === 'undefined') return;
    $range.daterangepicker({
      autoUpdateInput: false,
      autoApply: true,
      showDropdowns: true,
      opens: 'left',
      locale: {
        format: 'DD/MM/YYYY', separator: ' đến ', applyLabel: 'Áp dụng', cancelLabel: 'Xóa', customRangeLabel: 'Tùy chọn',
        daysOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        firstDay: 1
      }
    });
    var picker = $range.data('daterangepicker');
    if (picker && picker.container) picker.container.addClass('ptkh-filter-daterangepicker');
    $range.on('apply.daterangepicker', function (e, p) {
      $(this).val(p.startDate.format('DD/MM/YYYY') + ' đến ' + p.endDate.format('DD/MM/YYYY'));
      reloadFromFilter();
    }).on('cancel.daterangepicker', function () {
      $(this).val('');
      reloadFromFilter();
    }).on('show.daterangepicker', function (e, p) {
      var $footer = p.container.find('.drp-buttons');
      if (!$footer.length) return;
      $footer.find('.ptkh-date-quick').remove();
      $footer.find('.cancelBtn').show();
      var $quick = $('<span class="ptkh-date-quick"></span>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="today">Hôm nay</button>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="week">Tuần này</button>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="month">Tháng này</button>');
      $footer.prepend($quick);
      $quick.find('[data-q]').on('click', function () {
        var q = $(this).attr('data-q');
        var end = moment().startOf('day');
        var start = end.clone();
        if (q === 'week') { start = end.clone().startOf('isoWeek'); end = end.clone().endOf('isoWeek').startOf('day'); }
        else if (q === 'month') { start = end.clone().startOf('month'); end = end.clone().endOf('month').startOf('day'); }
        p.setStartDate(start);
        p.setEndDate(end);
        $range.val(start.format('DD/MM/YYYY') + ' đến ' + end.format('DD/MM/YYYY'));
        p.hide();
        reloadFromFilter();
      });
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
        // Chỉ hiện mã KH (tên ngắn gọn), chưa có mã thì tên — cùng quy ước modal tạo phiếu.
        var label = (item.ma_kh || item.ten || ('Khách hàng #' + item.nid));
        html += '<option value="' + item.nid + '">' + esc(label) + '</option>';
      });
      $('#ptkh-filter-customer').html(html);
      initSelect2($('#ptkh-filter-customer'), 'Tất cả');
    }, function () {});
  }

  function loadList() {
    $('#ptkh-table-body').html('<tr id="ptkh-loading-row"><td colspan="9" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
    $.getJSON(API, queryFilters()).done(function (res) {
      $('#ptkh-loading-row').remove();
      var items = res && res.data ? (res.data.items || []) : [];
      if (!items.length) {
        $('#ptkh-table-body').html('<tr><td colspan="9" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
      }
      else {
        $('#ptkh-table-body').html($.map(items, rowHtml).join(''));
      }
      renderPager(res.data || {});
      renderTabs((res.data && res.data.status_counts) || {});
    }).fail(function (xhr) {
      $('#ptkh-loading-row').remove();
      $('#ptkh-table-body').html(loadErrorRow(9, xhr));
    });
  }

  function rowHtml(item) {
    return '<tr' + (approveStatus(item) === 'huy' ? ' class="ptkh-row-huy"' : '') + '>' +
      '<td><div class="dropdown"><button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button><ul class="dropdown-menu">' +
        '<li><a href="#" class="dropdown-item ptkh-view" data-id="' + item.nid + '"><i class="ti tabler-eye me-2 text-primary"></i>Xem chi tiết</a></li>' +
        '<li><a class="dropdown-item" target="_blank" href="' + esc(downloadUrl(item)) + '"><i class="ti tabler-download me-2 text-info"></i>Tải phiếu trả</a></li>' +
        '<li><a href="#" class="dropdown-item ptkh-history" data-id="' + item.nid + '"><i class="ti tabler-history me-2 text-secondary"></i>Lịch sử duyệt</a></li>' +
        ((item.hanh_dong || []).length ? '<li><hr class="dropdown-divider"></li>' + actionItemsHtml(item) : '') +
      '</ul></div></td>' +
      '<td><a href="#" class="ptkh-voucher-link ptkh-view" data-id="' + item.nid + '">' + esc(item.ma_phieu) + '</a></td>' +
      '<td>' + esc(customerName(item)) + '</td>' +
      '<td>' + esc(userName(item)) + '</td>' +
      '<td>' + esc(apiToDatetime(itemTime(item, 'created'))) + '<div class="small text-muted">' + esc(itemTime(item, 'tu_ngay') || '-') + ' - ' + esc(itemTime(item, 'den_ngay') || '-') + '</div></td>' +
      '<td class="text-end ptkh-money fw-semibold">' + moneyDong(itemTotal(item, 'tong')) + '</td>' +
      '<td>' + statusBadge(approveStatus(item)) +
        (approveStatus(item) === 'da_duyet' ? '<div class="small text-muted mt-1">HĐ: ' + esc(item.so_hoa_don || '-') + '</div>' : '') +
        (item.chenh_lech_sau_duyet ? '<div class="small text-warning mt-1" title="Kế hoạch đã thay đổi sau khi khách duyệt; số trên phiếu không tự đổi."><i class="ti tabler-alert-triangle me-1"></i>Lệch ' + moneyDong(item.chenh_lech_sau_duyet) + '</div>' : '') +
      '</td>' +
      '<td class="text-center"><a class="btn btn-sm btn-icon btn-label-primary" target="_blank" href="' + esc(downloadUrl(item)) + '" title="Tải phiếu trả"><i class="ti tabler-download"></i></a></td>' +
      '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-secondary ptkh-history" data-id="' + item.nid + '" title="Lịch sử duyệt"><i class="ti tabler-history"></i></button></td>' +
    '</tr>';
  }

  function renderPager(data) {
    var container = $('#ptkh-pagination-wrap');
    var total = parseInt(data.total_pages || 0, 10);
    var current = parseInt(data.current_page || 0, 10);
    var totalItems = parseInt(data.total || 0, 10);
    if (current) state.page = current;
    $('#ptkh-pagination-info').text('Tổng số: ' + totalItems + ' bản ghi');
    $('#ptkh-pagination-total-pages').text('/ ' + total);
    $('#ptkh-pagination-jump').val(current || '').attr('data-total-pages', total);
    container.show();
    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link ptkh-page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link ptkh-page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    if (start > 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    for (var i = start; i <= end; i++) {
      html += '<li class="page-item ' + (i === current ? 'active' : '') + '"><a class="page-link ptkh-page-link" href="#" data-page="' + i + '">' + i + '</a></li>';
    }
    if (end < total) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link ptkh-page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link ptkh-page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';
    $('#ptkh-pagination').html(html);
  }

  function openDetail(id, showHistoryOnly) {
    $('#ptkh-detail-modal .modal-dialog')
      .removeClass('modal-fullscreen modal-xl modal-dialog-centered modal-dialog-scrollable')
      .addClass(showHistoryOnly ? 'modal-xl modal-dialog-centered modal-dialog-scrollable' : 'modal-fullscreen modal-dialog-scrollable');
    $('#ptkh-detail-title').text(showHistoryOnly ? 'Lịch sử duyệt' : 'Chi tiết phiếu');
    $('#ptkh-detail-body').html('<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></div>');
    $('#ptkh-detail-modal').modal('show');
    $.getJSON(API + '/' + id).done(function (res) {
      renderDetail(res.data || {}, showHistoryOnly);
    }).fail(function (xhr) {
      $('#ptkh-detail-body').html('<div class="alert alert-danger">' + esc(apiMsg(xhr)) + '</div>');
    });
  }

  function renderDetail(item, showHistoryOnly) {
    $('#ptkh-detail-title').text((showHistoryOnly ? 'Lịch sử duyệt ' : 'Chi tiết ') + (item.ma_phieu || ''));
    $('#ptkh-detail-download').attr('href', downloadUrl(item)).toggle(!showHistoryOnly);
    if (showHistoryOnly) {
      var history = item.lich_su_duyet || [];
      var ACT = { tao: 'Tạo phiếu', sua: 'Sửa phiếu', duyet: 'Khách duyệt', bo_duyet: 'Bỏ duyệt', huy: 'Huỷ phiếu' };
      $('#ptkh-detail-body').html('<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Thời gian</th><th>Người cập nhật</th><th>Thao tác</th><th>Từ</th><th>Đến</th><th>Số HĐ</th><th>Tháng HT</th><th>Ghi chú</th></tr></thead><tbody>' + (history.length ? $.map(history, function (h) {
        return '<tr><td>' + esc(h.time_text) + '</td><td>' + esc(h.username) + '</td><td>' + esc(ACT[h.hanh_dong] || 'Đổi trạng thái') + '</td><td>' + esc(h.old_status ? (h.old_status_label || statusText(h.old_status)) : '-') + '</td><td>' + esc(h.new_status_label || statusText(h.new_status)) + '</td><td>' + esc(h.so_hoa_don) + '</td><td>' + esc(h.thang_hach_toan) + '</td><td>' + esc(h.ghi_chu) + '</td></tr>';
      }).join('') : '<tr><td colspan="8" class="text-center text-muted">Chưa có lịch sử.</td></tr>') + '</tbody></table></div>');
      return;
    }
    var rows = $.map(item.items || [], function (r, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(apiToDate(r.ngay)) + '</td><td>' + esc(r.so_bkg || '-') + '</td><td>' + esc(r.loai_cont || '-') + '</td><td>' + esc(r.so_cont || '-') + '</td><td>' + esc(r.tuyen || '-') + '</td><td class="text-end">' + money(r.tong_doanh_thu) + '</td><td class="text-end">' + money(r.tong_chi_ho_khach_hang) + '</td><td class="text-end fw-semibold">' + money(r.tong_tien) + '</td></tr>';
    }).join('');
    var warn = item.chenh_lech_sau_duyet
      ? '<div class="alert alert-warning py-2"><i class="ti tabler-alert-triangle me-1"></i>Kế hoạch đã thay đổi sau khi khách duyệt: số hiện tại trên kế hoạch chênh <strong>' + moneyDong(item.chenh_lech_sau_duyet) + '</strong> so với số đã chốt. Phiếu và công nợ vẫn giữ số đã chốt.</div>'
      : '';
    $('#ptkh-detail-body').html(warn +
      '<div class="ptkh-detail-summary"><div><span>Khách hàng</span><strong>' + esc(customerName(item)) + '</strong></div><div><span>Trạng thái duyệt</span><strong>' + statusBadge(approveStatus(item)) + '</strong></div><div><span>Số hóa đơn</span><strong>' + esc(item.so_hoa_don || '-') + '</strong></div><div><span>Tổng tiền</span><strong>' + money(itemTotal(item, 'tong')) + '</strong></div></div>' +
      (item.ghi_chu ? '<div class="mb-3"><span class="text-muted">Ghi chú:</span> ' + esc(item.ghi_chu) + '</div>' : '') +
      '<div class="table-responsive"><table class="table table-bordered"><thead class="table-light"><tr><th>#</th><th>Ngày vận chuyển</th><th>Số BKG</th><th>Loại cont</th><th>Số cont</th><th>Tuyến</th><th class="text-end">Doanh thu</th><th class="text-end">Chi hộ</th><th class="text-end">Tổng</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    );
  }

  var statusModal = { id: 0, status: '', fp: null };

  function monthToInput(val) {
    var s = String(val || '').replace(/[^0-9]/g, '');
    if (s.length !== 6) return '';
    return s.slice(4) + '/' + s.slice(0, 4);
  }

  function inputToMonth(val) {
    var m = String(val || '').trim().match(/^(\d{2})\/(\d{4})$/);
    if (!m) return '';
    var mm = parseInt(m[1], 10);
    if (mm < 1 || mm > 12) return '';
    return m[2] + m[1];
  }

  function initStatusMonthPicker() {
    if (typeof flatpickr === 'undefined') return;
    var $input = $('#ptkh-status-month');
    if (statusModal.fp) statusModal.fp.destroy();
    statusModal.fp = flatpickr($input[0], {
      dateFormat: 'm/Y',
      allowInput: true,
      static: true,
      disableMobile: true,
      onChange: function (_, dateStr) {
        $input.val(dateStr);
        $input.removeClass('is-invalid');
      }
    });
  }

  function showStatusLoading(show) {
    $('#ptkh-status-loading').toggle(!!show);
  }

  function openStatusModal(id, status) {
    statusModal.id = parseInt(id, 10) || 0;
    statusModal.status = status || '';
    if (!statusModal.id || !statusModal.status) return;

    var isApproved = status === 'da_duyet';
    var labelMap = {
      da_duyet: ['Khách đã duyệt', 'bg-label-success'],
      chua_duyet: ['Chờ duyệt', 'bg-label-warning'],
      khong_duyet: ['Không duyệt', 'bg-label-danger']
    };
    var lb = labelMap[status] || [status, 'bg-label-secondary'];

    $('#ptkh-status-title').text('Cập nhật trạng thái: ' + lb[0]);
    $('#ptkh-status-badge').html('<span class="badge ' + lb[1] + '">' + esc(lb[0]) + '</span>');
    $('#ptkh-status-invoice-row').toggle(isApproved);
    $('#ptkh-status-month-row').toggle(isApproved);
    $('#ptkh-status-invoice, #ptkh-status-month').removeClass('is-invalid');
    $('#ptkh-status-invoice').val('');
    $('#ptkh-status-note').val('');
    if (statusModal.fp) statusModal.fp.clear();
    $('#ptkh-status-submit').html(isApproved
      ? '<i class="ti tabler-circle-check me-1"></i>Xác nhận duyệt'
      : '<i class="ti tabler-device-floppy me-1"></i>Xác nhận');

    showStatusLoading(true);
    $('#ptkh-status-modal').modal('show');

    $.getJSON(API + '/' + statusModal.id).done(function (res) {
      var item = res && res.data ? res.data : {};
      $('#ptkh-status-invoice').val(item.so_hoa_don || item.so_hoa_don_da_nhap || '');
      var lastNote = '';
      var history = item.lich_su_duyet || [];
      if (history.length && history[history.length - 1].ghi_chu) {
        lastNote = history[history.length - 1].ghi_chu;
      }
      $('#ptkh-status-note').val(lastNote);
      var savedMonth = item.thang_hach_toan || item.thang_hach_toan_da_nhap;
      if (isApproved && statusModal.fp && savedMonth) {
        var mm = monthToInput(savedMonth);
        if (mm) {
          statusModal.fp.setDate(new Date(parseInt(mm.slice(3), 10), parseInt(mm.slice(0, 2), 10) - 1, 1));
        }
      }
      showStatusLoading(false);
    }).fail(function (xhr) {
      showStatusLoading(false);
      notify(apiMsg(xhr), 'error');
    });
  }

  function submitStatus() {
    var id = statusModal.id;
    var status = statusModal.status;
    if (!id || !status) return;
    var payload = {};
    var isApproved = status === 'da_duyet';
    if (isApproved) {
      var invoice = $('#ptkh-status-invoice').val().trim();
      var month = inputToMonth($('#ptkh-status-month').val());
      var valid = true;
      if (!invoice) {
        $('#ptkh-status-invoice').addClass('is-invalid');
        valid = false;
      }
      else {
        $('#ptkh-status-invoice').removeClass('is-invalid');
      }
      if (!month) {
        $('#ptkh-status-month').addClass('is-invalid');
        valid = false;
      }
      else {
        $('#ptkh-status-month').removeClass('is-invalid');
      }
      if (!valid) {
        notify('Vui lòng nhập số hóa đơn và tháng hạch toán.', 'error');
        return;
      }
      payload.so_hoa_don = invoice;
      payload.thang_hach_toan = month;
    }
    var note = $('#ptkh-status-note').val().trim();
    if (note) payload.ghi_chu = note;

    var $btn = $('#ptkh-status-submit');
    $btn.prop('disabled', true);
    $.ajax({
      url: API + '/' + id + '/duyet',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payload)
    }).done(function () {
      notify('Khách đã duyệt phiếu, phiếu đã sang công nợ.', 'success');
      $('#ptkh-status-modal').modal('hide');
      loadList();
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      $btn.prop('disabled', false);
    });
  }

  function confirmAction(id, action) {
    var texts = {
      huy: ['Huỷ phiếu trả khách hàng?', 'Các kế hoạch trong phiếu sẽ được nhả ra để xuất phiếu khác.', 'Huỷ phiếu', 'Đã huỷ phiếu.'],
      bo_duyet: ['Bỏ duyệt phiếu?', 'Phiếu quay về Chờ duyệt, rời khỏi công nợ khách hàng và được sửa lại.', 'Bỏ duyệt', 'Đã bỏ duyệt phiếu.']
    };
    var t = texts[action];
    if (!t) return;
    var run = function (note) {
      $.ajax({
        url: API + '/' + id + '/' + action.replace('_', '-'),
        method: 'POST',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(note ? { ghi_chu: note } : {})
      }).done(function () {
        notify(t[3], 'success');
        loadList();
      }).fail(function (xhr) {
        notify(apiMsg(xhr), 'error');
      });
    };
    if (window.Swal) {
      Swal.fire({
        title: t[0],
        text: t[1],
        icon: 'warning',
        input: 'text',
        inputPlaceholder: 'Lý do / ghi chú (không bắt buộc)',
        showCancelButton: true,
        confirmButtonText: t[2],
        cancelButtonText: 'Đóng',
        customClass: { confirmButton: 'btn btn-' + (action === 'huy' ? 'danger' : 'warning') + ' me-2', cancelButton: 'btn btn-label-secondary' },
        buttonsStyling: false
      }).then(function (r) { if (r.isConfirmed) run(r.value || ''); });
    }
    else if (window.confirm(t[0] + '\n' + t[1])) {
      run('');
    }
  }

  function bind() {
    // Màn này chỉ Sửa phiếu (modal chung phieu_tra_khach_hang_modal.js); tạo phiếu ở nút "Tạo phiếu trả KH" trên /ke-hoach-xep-xe.
    $('#ptkh-search').on('click', reloadFromFilter);
    $('#ptkh-reload').on('click', resetFilters);
    $('#ptkh-keyword').on('keydown', function (e) { if (e.which === 13) reloadFromFilter(); });
    $('#ptkh-filter-customer').on('change', reloadFromFilter);
    $(document).on('click', '#ptkh-tabs [data-tab]', function (e) {
      e.preventDefault();
      var tab = String($(this).attr('data-tab') || 'all');
      if (tab === state.tab) return;
      state.tab = tab;
      state.page = 1;
      $('#ptkh-tabs .nav-link').removeClass('active');
      $(this).addClass('active');
      loadList();
    });
    $(document).on('click', '.ptkh-page-link', function (e) {
      e.preventDefault();
      var page = parseInt($(this).data('page'), 10) || 0;
      if (page && page !== state.page) {
        state.page = page;
        loadList();
      }
    });
    $('#ptkh-pagination-jump').on('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value, 10) || 0;
        var total = parseInt($(this).attr('data-total-pages'), 10) || 0;
        if (page > 0 && page <= total) {
          state.page = page;
          loadList();
        }
      }
    });
    $(document).on('click', '.ptkh-view', function (e) { e.preventDefault(); openDetail($(this).data('id'), false); });
    $(document).on('click', '.ptkh-history', function (e) { e.preventDefault(); openDetail($(this).data('id'), true); });
    $(document).on('click', '.ptkh-approve', function (e) { e.preventDefault(); openStatusModal($(this).data('id'), 'da_duyet'); });
    $(document).on('click', '.ptkh-edit', function (e) {
      e.preventDefault();
      if (window.PtkhModal) window.PtkhModal.openEdit($(this).data('id'), { onSaved: function () { loadList(); } });
    });
    $(document).on('click', '.ptkh-act', function (e) { e.preventDefault(); confirmAction($(this).data('id'), String($(this).data('action'))); });
    $('#ptkh-status-submit').on('click', submitStatus);
    $('#ptkh-status-invoice, #ptkh-status-month').on('input', function () { $(this).removeClass('is-invalid'); });
    $('#ptkh-status-modal').on('keydown', function (e) {
      if (e.which === 13 && !$(e.target).is('textarea')) {
        e.preventDefault();
        if (!$('#ptkh-status-submit').prop('disabled')) submitStatus();
      }
    });
    $('#ptkh-status-modal').on('hidden.bs.modal', function () {
      showStatusLoading(false);
      $('#ptkh-status-invoice, #ptkh-status-month').removeClass('is-invalid');
    });
  }

  $(function () {
    bind();
    renderTabs({});
    initCreatedRange();
    initStatusMonthPicker();
    loadCustomers();
    loadList();
  });
})(jQuery);

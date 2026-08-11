(function ($) {
  'use strict';

  var API = '/api/phieu-tra-khach-hang';
  var state = { page: 1, candidates: [] };
  var notyf;

  function notify(message, type) {
    if (!notyf && window.Notyf) notyf = new Notyf();
    if (notyf) type === 'error' ? notyf.error(message) : notyf.success(message);
    else window.alert(message);
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

  function statusBadge(s) {
    var map = {
      chua_duyet: ['Chờ duyệt', 'bg-label-warning'],
      da_duyet: ['Đã duyệt', 'bg-label-success'],
      khong_duyet: ['Không duyệt', 'bg-label-danger']
    };
    var item = map[s] || [s || '-', 'bg-label-secondary'];
    return '<span class="badge ' + item[1] + '">' + esc(item[0]) + '</span>';
  }

  function paymentBadge(s) {
    var map = {
      chua_thanh_toan: ['Chưa thanh toán', 'bg-label-secondary'],
      thanh_toan_mot_phan: ['Thanh toán một phần', 'bg-label-info'],
      da_thanh_toan: ['Đã thanh toán', 'bg-label-success']
    };
    var item = map[s] || [s || '-', 'bg-label-secondary'];
    return '<span class="badge ' + item[1] + '">' + esc(item[0]) + '</span>';
  }

  function queryFilters() {
    return {
      page: state.page,
      nid_khach_hang: $('#ptkh-filter-customer').val() || '',
      thang_hach_toan: $('#ptkh-filter-month').val() || '',
      trang_thai_duyet: $('#ptkh-filter-status').val() || '',
      keyword: $('#ptkh-keyword').val() || ''
    };
  }

  function loadCustomers() {
    $.getJSON('/api/khach-hang', { limit: 500 }).done(function (res) {
      var items = res && res.data ? (res.data.items || []) : [];
      var html = '<option value="">Tất cả</option>';
      var createHtml = '<option value="">Chọn khách hàng</option>';
      $.each(items, function (_, item) {
        var label = (item.ten || item.ma_kh || ('Khách hàng #' + item.nid));
        html += '<option value="' + item.nid + '">' + esc(label) + '</option>';
        createHtml += '<option value="' + item.nid + '">' + esc(label) + '</option>';
      });
      $('#ptkh-filter-customer').html(html);
      $('#ptkh-create-customer').html(createHtml);
      if ($.fn.select2) {
        $('#ptkh-filter-customer').select2({ width: '100%', allowClear: true, placeholder: 'Tất cả' });
        $('#ptkh-create-customer').select2({ width: '100%', dropdownParent: $('#ptkh-create-modal'), placeholder: 'Chọn khách hàng' });
      }
    });
  }

  function loadList() {
    $('#ptkh-table-body').html('<tr id="ptkh-loading-row"><td colspan="8" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
    $.getJSON(API, queryFilters()).done(function (res) {
      $('#ptkh-loading-row').remove();
      var items = res && res.data ? (res.data.items || []) : [];
      if (!items.length) {
        $('#ptkh-table-body').html('<tr><td colspan="8" class="text-center text-muted py-4">Không có dữ liệu.</td></tr>');
      }
      else {
        $('#ptkh-table-body').html($.map(items, rowHtml).join(''));
      }
      renderPager(res.data || {});
    }).fail(function (xhr) {
      $('#ptkh-loading-row').remove();
      $('#ptkh-table-body').html('<tr><td colspan="8" class="text-center text-danger py-4">' + esc(apiMsg(xhr)) + '</td></tr>');
    });
  }

  function rowHtml(item) {
    return '<tr>' +
      '<td><div class="dropdown"><button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button><ul class="dropdown-menu">' +
        '<li><a href="#" class="dropdown-item ptkh-view" data-id="' + item.nid + '"><i class="ti tabler-eye me-2 text-primary"></i>Xem chi tiết</a></li>' +
        '<li><a class="dropdown-item" target="_blank" href="' + esc(item.download_url || ('/phieu-tra-khach-hang/tai/' + item.nid)) + '"><i class="ti tabler-download me-2 text-info"></i>Tải phiếu trả</a></li>' +
        '<li><a href="#" class="dropdown-item ptkh-history" data-id="' + item.nid + '"><i class="ti tabler-history me-2 text-secondary"></i>Lịch sử duyệt</a></li>' +
        '<li><hr class="dropdown-divider"></li>' +
        '<li><a href="#" class="dropdown-item ptkh-status" data-id="' + item.nid + '" data-status="da_duyet"><i class="ti tabler-circle-check me-2 text-success"></i>Khách đã duyệt</a></li>' +
        '<li><a href="#" class="dropdown-item ptkh-status" data-id="' + item.nid + '" data-status="chua_duyet"><i class="ti tabler-refresh me-2 text-warning"></i>Chờ duyệt</a></li>' +
        '<li><a href="#" class="dropdown-item text-danger ptkh-status" data-id="' + item.nid + '" data-status="khong_duyet"><i class="ti tabler-circle-x me-2 text-danger"></i>Không duyệt</a></li>' +
      '</ul></div></td>' +
      '<td><strong>' + esc(item.ma_phieu) + '</strong><div class="small text-muted">' + esc(item.ma_phieu_khach || '') + '</div></td>' +
      '<td>' + esc(item.khach_hang) + '</td>' +
      '<td>' + esc(item.tu_ngay_display || '-') + ' - ' + esc(item.den_ngay_display || '-') + '<div class="small text-muted">HT: ' + esc(item.thang_hach_toan || '-') + '</div></td>' +
      '<td class="text-end ptkh-money fw-semibold">' + money(item.tong_tien) + '</td>' +
      '<td class="text-end ptkh-money">' + money(item.da_thanh_toan) + '</td>' +
      '<td class="text-end ptkh-money">' + money(item.con_lai_thanh_toan) + '</td>' +
      '<td>' + statusBadge(item.trang_thai_duyet) + '<div class="mt-1">' + paymentBadge(item.trang_thai_thanh_toan) + '</div></td>' +
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

  function loadCandidates() {
    var customer = $('#ptkh-create-customer').val();
    if (!customer) {
      notify('Vui lòng chọn khách hàng.', 'error');
      return;
    }
    $('#ptkh-check-all').prop('checked', false);
    $('#ptkh-candidate-body').html('<tr id="ptkh-candidate-loading-row"><td colspan="8" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
    $.getJSON(API + '/candidates', {
      nid_khach_hang: customer,
      from_date: $('#ptkh-create-from').val() || '',
      to_date: $('#ptkh-create-to').val() || ''
    }).done(function (res) {
      $('#ptkh-candidate-loading-row').remove();
      state.candidates = res && res.data ? (res.data.items || []) : [];
      renderCandidates();
    }).fail(function (xhr) {
      $('#ptkh-candidate-loading-row').remove();
      $('#ptkh-candidate-body').html('<tr><td colspan="8" class="text-center text-danger py-4">' + esc(apiMsg(xhr)) + '</td></tr>');
    });
  }

  function renderCandidates() {
    $('#ptkh-check-all').prop('checked', false);
    if (!state.candidates.length) {
      $('#ptkh-candidate-body').html('<tr><td colspan="8" class="text-center text-muted py-4">Không có kế hoạch đủ điều kiện.</td></tr>');
      updateSelectedTotal();
      return;
    }
    $('#ptkh-candidate-body').html($.map(state.candidates, function (item) {
      var canExport = !!item.co_the_xuat;
      var status = item.trang_thai_phieu || {};
      var badgeClass = canExport ? 'bg-label-success' : (status.trang_thai_duyet === 'da_duyet' ? 'bg-label-primary' : 'bg-label-warning');
      var statusText = status.trang_thai_label || (canExport ? 'Có thể xuất' : 'Đã có phiếu');
      var voucherText = status.ma_phieu ? '<div class="small text-muted">' + esc(status.ma_phieu) + (status.so_hoa_don ? ' - HĐ ' + esc(status.so_hoa_don) : '') + '</div>' : '';
      return '<tr class="' + (canExport ? '' : 'ptkh-candidate-disabled') + '">' +
        '<td class="text-center"><input type="checkbox" class="ptkh-plan-check" value="' + item.nid + '" data-total="' + item.tong_tien + '"' + (canExport ? '' : ' disabled') + '></td>' +
        '<td><strong>' + esc(item.label) + '</strong><div class="small text-muted">#' + item.nid + '</div></td>' +
        '<td><span class="badge ' + badgeClass + '">' + esc(statusText) + '</span>' + voucherText + '</td>' +
        '<td>' + esc(item.ngay_display || '-') + '</td><td>' + esc(item.tuyen || '-') + '</td>' +
        '<td class="text-end ptkh-money">' + money(item.tong_doanh_thu) + '</td>' +
        '<td class="text-end ptkh-money">' + money(item.tong_chi_ho_khach_hang) + '</td>' +
        '<td class="text-end ptkh-money fw-semibold">' + money(item.tong_tien) + '</td>' +
      '</tr>';
    }).join(''));
    updateSelectedTotal();
  }

  function updateSelectedTotal() {
    var count = 0;
    var total = 0;
    $('.ptkh-plan-check:checked').each(function () {
      count++;
      total += parseInt($(this).data('total') || 0, 10) || 0;
    });
    $('#ptkh-selected-count').text(count);
    $('#ptkh-selected-total').text(money(total));
  }

  function createVoucher() {
    var ids = $('.ptkh-plan-check:checked').map(function () { return parseInt(this.value, 10); }).get();
    if (!ids.length) {
      notify('Vui lòng chọn kế hoạch.', 'error');
      return;
    }
    $('#ptkh-create-submit').prop('disabled', true);
    $.ajax({
      url: API,
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        nid_khach_hang: $('#ptkh-create-customer').val(),
        tu_ngay: $('#ptkh-create-from').val(),
        den_ngay: $('#ptkh-create-to').val(),
        ma_phieu_khach: $('#ptkh-create-code').val(),
        nid_ke_hoach: ids
      })
    }).done(function () {
      notify('Đã tạo phiếu trả khách hàng.', 'success');
      $('#ptkh-create-modal').modal('hide');
      loadList();
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      $('#ptkh-create-submit').prop('disabled', false);
    });
  }

  function openDetail(id, showHistoryOnly) {
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
    $('#ptkh-detail-download').attr('href', item.download_url || '#').toggle(!showHistoryOnly);
    if (showHistoryOnly) {
      var history = item.lich_su_duyet || [];
      $('#ptkh-detail-body').html('<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Thời gian</th><th>Người cập nhật</th><th>Từ</th><th>Đến</th><th>Số HĐ</th><th>Tháng HT</th><th>Ghi chú</th></tr></thead><tbody>' + (history.length ? $.map(history, function (h) {
        return '<tr><td>' + esc(h.time_text) + '</td><td>' + esc(h.username) + '</td><td>' + esc(h.old_status) + '</td><td>' + esc(h.new_status) + '</td><td>' + esc(h.so_hoa_don) + '</td><td>' + esc(h.thang_hach_toan) + '</td><td>' + esc(h.ghi_chu) + '</td></tr>';
      }).join('') : '<tr><td colspan="7" class="text-center text-muted">Chưa có lịch sử.</td></tr>') + '</tbody></table></div>');
      return;
    }
    var rows = $.map(item.items || [], function (r, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.label) + '</td><td>' + esc(r.ngay_display || '-') + '</td><td>' + esc(r.tuyen || '-') + '</td><td class="text-end">' + money(r.tong_doanh_thu) + '</td><td class="text-end">' + money(r.tong_chi_ho_khach_hang) + '</td><td class="text-end fw-semibold">' + money(r.tong_tien) + '</td></tr>';
    }).join('');
    $('#ptkh-detail-body').html(
      '<div class="ptkh-detail-summary"><div><span>Khách hàng</span><strong>' + esc(item.khach_hang) + '</strong></div><div><span>Trạng thái duyệt</span><strong>' + statusBadge(item.trang_thai_duyet) + '</strong></div><div><span>Số hóa đơn</span><strong>' + esc(item.so_hoa_don || '-') + '</strong></div><div><span>Tổng tiền</span><strong>' + money(item.tong_tien) + '</strong></div></div>' +
      '<div class="table-responsive"><table class="table table-bordered"><thead class="table-light"><tr><th>#</th><th>Kế hoạch</th><th>Ngày</th><th>Tuyến</th><th class="text-end">Doanh thu</th><th class="text-end">Chi hộ</th><th class="text-end">Tổng</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
    );
  }

  function updateStatus(id, status) {
    var payload = { trang_thai_duyet: status };
    if (status === 'da_duyet') {
      var invoice = window.prompt('Nhập số hóa đơn:');
      if (!invoice) return;
      var month = window.prompt('Nhập tháng hạch toán YYYYMM:', (new Date()).getFullYear().toString() + String((new Date()).getMonth() + 1).padStart(2, '0'));
      if (!month) return;
      payload.so_hoa_don = invoice;
      payload.thang_hach_toan = month;
    }
    var note = window.prompt('Ghi chú duyệt nếu có:', '');
    if (note !== null) payload.ghi_chu = note;
    $.ajax({ url: API + '/' + id, method: 'PUT', contentType: 'application/json; charset=utf-8', dataType: 'json', data: JSON.stringify(payload) })
      .done(function () { notify('Đã cập nhật trạng thái.', 'success'); loadList(); })
      .fail(function (xhr) { notify(apiMsg(xhr), 'error'); });
  }

  function bind() {
    $('#ptkh-search, #ptkh-reload').on('click', function () { state.page = 1; loadList(); });
    $('#ptkh-keyword').on('keydown', function (e) { if (e.which === 13) { state.page = 1; loadList(); } });
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
    $('#ptkh-open-create').on('click', function () { state.candidates = []; renderCandidates(); $('#ptkh-create-modal').modal('show'); });
    $('#ptkh-load-candidates').on('click', loadCandidates);
    $('#ptkh-check-all').on('change', function () { $('.ptkh-plan-check:not(:disabled)').prop('checked', this.checked); updateSelectedTotal(); });
    $(document).on('change', '.ptkh-plan-check', updateSelectedTotal);
    $('#ptkh-create-submit').on('click', createVoucher);
    $(document).on('click', '.ptkh-view', function (e) { e.preventDefault(); openDetail($(this).data('id'), false); });
    $(document).on('click', '.ptkh-history', function (e) { e.preventDefault(); openDetail($(this).data('id'), true); });
    $(document).on('click', '.ptkh-status', function (e) { e.preventDefault(); updateStatus($(this).data('id'), $(this).data('status')); });
  }

  $(function () {
    bind();
    loadCustomers();
    loadList();
  });
})(jQuery);

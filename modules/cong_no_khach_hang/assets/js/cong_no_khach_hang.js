(function ($) {
  'use strict';
  var API = '/api/cong-no-khach-hang';
  var state = { items: [], current: null, page: 1 };
  var notyf;

  function notify(msg, type) { if (!notyf && window.Notyf) notyf = new Notyf(); notyf ? (type === 'error' ? notyf.error(msg) : notyf.success(msg)) : alert(msg); }
  function esc(v) { return $('<div>').text(v == null ? '' : v).html(); }
  function money(v) { v = parseInt(v || 0, 10) || 0; return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function apiMsg(xhr) { try { return JSON.parse(xhr.responseText).message || 'Lỗi không xác định'; } catch (e) { return 'Lỗi kết nối server'; } }
  function statusBadge(s) {
    var map = { chua_thanh_toan: ['Chưa thanh toán', 'bg-label-secondary'], thanh_toan_mot_phan: ['Thanh toán một phần', 'bg-label-info'], da_thanh_toan: ['Đã thanh toán', 'bg-label-success'] };
    var item = map[s] || [s || '-', 'bg-label-secondary'];
    return '<span class="badge ' + item[1] + '">' + esc(item[0]) + '</span>';
  }
  function loadCustomers() {
    $.getJSON('/api/khach-hang', { limit: 500 }).done(function (res) {
      var html = '<option value="">Tất cả</option>';
      $.each((res.data && res.data.items) || [], function (_, item) { html += '<option value="' + item.nid + '">' + esc(item.ten || item.ma_kh || ('Khách hàng #' + item.nid)) + '</option>'; });
      $('#cnkh-filter-customer').html(html);
      if ($.fn.select2) $('#cnkh-filter-customer').select2({ width: '100%', allowClear: true, placeholder: 'Tất cả' });
    });
  }
  function loadList() {
    $('#cnkh-table-body').html('<tr><td colspan="8" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>');
    $.getJSON(API, { page: state.page, nid_khach_hang: $('#cnkh-filter-customer').val() || '', thang_hach_toan: $('#cnkh-filter-month').val() || '' }).done(function (res) {
      state.items = (res.data && res.data.items) || [];
      if (!state.items.length) {
        $('#cnkh-table-body').html('<tr><td colspan="8" class="text-center text-muted py-4">Không có công nợ.</td></tr>');
        renderPagination(res.data || {});
        return;
      }
      $('#cnkh-table-body').html($.map(state.items, function (item, idx) {
        return '<tr><td><strong>' + esc(item.khach_hang) + '</strong></td><td>' + esc(item.thang_hach_toan) + '</td><td class="text-center">' + item.so_phieu + '</td><td class="text-end cnkh-money fw-semibold">' + money(item.tong_phai_thu) + '</td><td class="text-end cnkh-money">' + money(item.da_thanh_toan) + '</td><td class="text-end cnkh-money">' + money(item.con_lai) + '</td><td>' + statusBadge(item.trang_thai) + '</td><td><button class="btn btn-sm btn-label-primary cnkh-detail" data-index="' + idx + '"><i class="ti tabler-eye"></i></button></td></tr>';
      }).join(''));
      renderPagination(res.data || {});
    }).fail(function (xhr) { $('#cnkh-table-body').html('<tr><td colspan="8" class="text-center text-danger py-4">' + esc(apiMsg(xhr)) + '</td></tr>'); });
  }
  function renderPagination(data) {
    var total = parseInt(data.total_pages || 0, 10);
    var current = parseInt(data.current_page || 0, 10);
    var totalItems = parseInt(data.total || 0, 10);
    if (current) state.page = current;
    $('#cnkh-pagination-info').text('Tổng số: ' + totalItems + ' bản ghi');
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
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link cnkh-page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link cnkh-page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';
    $('#cnkh-pagination').html(html);
  }
  function openDetail(index) {
    var item = state.items[index]; if (!item) return;
    state.current = item;
    $('#cnkh-detail-title').text('Công nợ ' + item.khach_hang + ' - ' + item.thang_hach_toan);
    $('#cnkh-detail-body').html('<div class="row g-3 mb-3"><div class="col-md-4"><div class="cnkh-summary-box"><div class="text-muted small">Phải thu</div><strong>' + money(item.tong_phai_thu) + '</strong></div></div><div class="col-md-4"><div class="cnkh-summary-box"><div class="text-muted small">Đã thanh toán</div><strong>' + money(item.da_thanh_toan) + '</strong></div></div><div class="col-md-4"><div class="cnkh-summary-box"><div class="text-muted small">Còn lại</div><strong>' + money(item.con_lai) + '</strong></div></div></div>' +
      '<div class="table-responsive"><table class="table table-bordered align-middle"><thead class="table-light"><tr><th class="text-center"><input type="checkbox" id="cnkh-check-all"></th><th>Mã phiếu</th><th>Số HĐ</th><th class="text-end">Tổng</th><th class="text-end">Đã TT</th><th class="text-end">Còn lại</th><th>Tải</th></tr></thead><tbody>' +
      $.map(item.items || [], function (r) { return '<tr><td class="text-center"><input type="checkbox" class="cnkh-voucher-check" value="' + r.nid + '" data-remaining="' + r.con_lai + '"' + (r.con_lai > 0 ? '' : ' disabled') + '></td><td><strong>' + esc(r.ma_phieu) + '</strong><div class="small text-muted">' + esc(r.ma_phieu_khach || '') + '</div></td><td>' + esc(r.so_hoa_don || '-') + '</td><td class="text-end">' + money(r.tong_tien) + '</td><td class="text-end">' + money(r.da_thanh_toan) + '</td><td class="text-end fw-semibold">' + money(r.con_lai) + '</td><td><a target="_blank" href="' + esc(r.download_url) + '" class="btn btn-sm btn-label-primary"><i class="ti tabler-download"></i></a></td></tr>'; }).join('') +
      '</tbody></table></div>');
    $('#cnkh-detail-modal').modal('show');
  }
  function paySelected() {
    var item = state.current; if (!item) return;
    var ids = $('.cnkh-voucher-check:checked').map(function () { return parseInt(this.value, 10); }).get();
    if (!ids.length) { notify('Vui lòng chọn phiếu cần thanh toán.', 'error'); return; }
    var suggested = 0; $('.cnkh-voucher-check:checked').each(function () { suggested += parseInt($(this).data('remaining') || 0, 10) || 0; });
    var amount = prompt('Số tiền thanh toán:', money(suggested)); if (!amount) return;
    var fund = prompt('Nhập NID quỹ nhận tiền:'); if (!fund) return;
    $.ajax({ url: API + '/thanh-toan', method: 'POST', contentType: 'application/json; charset=utf-8', dataType: 'json', data: JSON.stringify({ nid_khach_hang: item.nid_khach_hang, thang_hach_toan: item.thang_hach_toan, voucher_ids: ids, so_tien: amount, nid_quy: fund }) })
      .done(function () { notify('Đã thanh toán công nợ.', 'success'); $('#cnkh-detail-modal').modal('hide'); loadList(); })
      .fail(function (xhr) { notify(apiMsg(xhr), 'error'); });
  }
  $(function () {
    loadCustomers(); loadList();
    $('#cnkh-search').on('click', function () { state.page = 1; loadList(); });
    $('#cnkh-filter-month').on('keydown', function (e) { if (e.which === 13) { state.page = 1; loadList(); } });
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
    $(document).on('click', '.cnkh-detail', function () { openDetail($(this).data('index')); });
    $(document).on('change', '#cnkh-check-all', function () { $('.cnkh-voucher-check:not(:disabled)').prop('checked', this.checked); });
    $('#cnkh-pay-selected').on('click', paySelected);
  });
})(jQuery);

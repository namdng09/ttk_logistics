(function ($) {
  'use strict';

  var API = '/api/phieu-tra-khach-hang';
  var state = { page: 1, candidates: [], suppressFilterChange: false };
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
      da_duyet: 'Đã duyệt',
      khong_duyet: 'Không duyệt'
    };
    return map[s] || (s || '-');
  }

  function statusBadge(s) {
    if (s && typeof s === 'object') s = s.value || '';
    var map = {
      chua_duyet: ['Chờ duyệt', 'bg-label-warning'],
      da_duyet: ['Đã duyệt', 'bg-label-success'],
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
    $('#ptkh-filter-customer, #ptkh-filter-status').val('').trigger('change');
    $('#ptkh-filter-created-from, #ptkh-filter-created-to, #ptkh-keyword').val('');
    $('#ptkh-filter-created-from, #ptkh-filter-created-to').each(function () {
      if (this._flatpickr) this._flatpickr.clear();
    });
    state.suppressFilterChange = false;
    loadList();
  }

  function resetCandidates(message) {
    state.candidates = [];
    $('#ptkh-check-all').prop('checked', false);
    $('#ptkh-candidate-body').html('<tr><td colspan="7" class="text-center text-muted py-4">' + esc(message || 'Chọn khách hàng rồi bấm Lọc.') + '</td></tr>');
    updateSelectedTotal();
  }

  function queryFilters() {
    return {
      page: state.page,
      nid_khach_hang: $('#ptkh-filter-customer').val() || '',
      created_from: $('#ptkh-filter-created-from').val() || '',
      created_to: $('#ptkh-filter-created-to').val() || '',
      trang_thai_duyet: $('#ptkh-filter-status').val() || '',
      keyword: $('#ptkh-keyword').val() || ''
    };
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

  function initDatePickers() {
    if (typeof flatpickr === 'undefined') return;
    $('.ptkh-page .flatpickr-date, #ptkh-create-modal .flatpickr-date').each(function () {
      if (this._flatpickr) this._flatpickr.destroy();
      flatpickr(this, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        static: true,
        onChange: function (_, __, instance) {
          if ($(instance.input).is('#ptkh-filter-created-from, #ptkh-filter-created-to')) reloadFromFilter();
        }
      });
    });
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
      initSelect2($('#ptkh-filter-customer'), 'Tất cả');
      initSelect2($('#ptkh-create-customer'), 'Chọn khách hàng', $('#ptkh-create-modal'));
    });
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
    }).fail(function (xhr) {
      $('#ptkh-loading-row').remove();
      $('#ptkh-table-body').html('<tr><td colspan="9" class="text-center text-danger py-4">' + esc(apiMsg(xhr)) + '</td></tr>');
    });
  }

  function rowHtml(item) {
    return '<tr>' +
      '<td><div class="dropdown"><button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button><ul class="dropdown-menu">' +
        '<li><a href="#" class="dropdown-item ptkh-view" data-id="' + item.nid + '"><i class="ti tabler-eye me-2 text-primary"></i>Xem chi tiết</a></li>' +
        '<li><a class="dropdown-item" target="_blank" href="' + esc(downloadUrl(item)) + '"><i class="ti tabler-download me-2 text-info"></i>Tải phiếu trả</a></li>' +
        '<li><a href="#" class="dropdown-item ptkh-history" data-id="' + item.nid + '"><i class="ti tabler-history me-2 text-secondary"></i>Lịch sử duyệt</a></li>' +
        '<li><hr class="dropdown-divider"></li>' +
        '<li><a href="#" class="dropdown-item ptkh-status" data-id="' + item.nid + '" data-status="da_duyet"><i class="ti tabler-circle-check me-2 text-success"></i>Khách đã duyệt</a></li>' +
        '<li><a href="#" class="dropdown-item ptkh-status" data-id="' + item.nid + '" data-status="chua_duyet"><i class="ti tabler-refresh me-2 text-warning"></i>Chờ duyệt</a></li>' +
        '<li><a href="#" class="dropdown-item text-danger ptkh-status" data-id="' + item.nid + '" data-status="khong_duyet"><i class="ti tabler-circle-x me-2 text-danger"></i>Không duyệt</a></li>' +
      '</ul></div></td>' +
      '<td><a href="#" class="ptkh-voucher-link ptkh-view" data-id="' + item.nid + '">' + esc(item.ma_phieu) + '</a></td>' +
      '<td>' + esc(customerName(item)) + '</td>' +
      '<td>' + esc(userName(item)) + '</td>' +
      '<td>' + esc(apiToDatetime(itemTime(item, 'created'))) + '<div class="small text-muted">' + esc(itemTime(item, 'tu_ngay') || '-') + ' - ' + esc(itemTime(item, 'den_ngay') || '-') + '</div></td>' +
      '<td class="text-end ptkh-money fw-semibold">' + moneyDong(itemTotal(item, 'tong')) + '</td>' +
      '<td>' + statusBadge(approveStatus(item)) + '<div class="small text-muted mt-1">HĐ: ' + esc(item.so_hoa_don || '-') + '</div></td>' +
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

  function loadCandidates() {
    var customer = $('#ptkh-create-customer').val();
    if (!customer) {
      resetCandidates('Chọn khách hàng rồi bấm Lọc.');
      notify('Vui lòng chọn khách hàng.', 'error');
      return;
    }
    $('#ptkh-check-all').prop('checked', false);
    $('#ptkh-load-candidates').prop('disabled', true);
    $('#ptkh-candidate-body').html('<tr id="ptkh-candidate-loading-row"><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
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
      $('#ptkh-candidate-body').html('<tr><td colspan="7" class="text-center text-danger py-4">' + esc(apiMsg(xhr)) + '</td></tr>');
      state.candidates = [];
      updateSelectedTotal();
    }).always(function () {
      $('#ptkh-load-candidates').prop('disabled', false);
    });
  }

  function renderCandidates() {
    $('#ptkh-check-all').prop('checked', false);
    if (!state.candidates.length) {
      $('#ptkh-candidate-body').html('<tr><td colspan="7" class="text-center text-muted py-4">Không có kế hoạch đủ điều kiện.</td></tr>');
      updateSelectedTotal();
      return;
    }
    $('#ptkh-candidate-body').html($.map(state.candidates, function (item) {
      return '<tr>' +
        '<td class="text-center"><input type="checkbox" class="ptkh-plan-check" value="' + item.nid + '" data-total="' + item.tong_tien + '"></td>' +
        '<td><strong>' + esc(item.label) + '</strong><div class="small text-muted">#' + item.nid + '</div></td>' +
        '<td>' + esc(apiToDate(item.ngay)) + '</td><td>' + esc(item.tuyen || '-') + '</td>' +
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
      $('#ptkh-detail-body').html('<div class="table-responsive"><table class="table table-bordered"><thead><tr><th>Thời gian</th><th>Người cập nhật</th><th>Từ</th><th>Đến</th><th>Số HĐ</th><th>Tháng HT</th><th>Ghi chú</th></tr></thead><tbody>' + (history.length ? $.map(history, function (h) {
        return '<tr><td>' + esc(h.time_text) + '</td><td>' + esc(h.username) + '</td><td>' + esc(h.old_status_label || statusText(h.old_status)) + '</td><td>' + esc(h.new_status_label || statusText(h.new_status)) + '</td><td>' + esc(h.so_hoa_don) + '</td><td>' + esc(h.thang_hach_toan) + '</td><td>' + esc(h.ghi_chu) + '</td></tr>';
      }).join('') : '<tr><td colspan="7" class="text-center text-muted">Chưa có lịch sử.</td></tr>') + '</tbody></table></div>');
      return;
    }
    var rows = $.map(item.items || [], function (r, i) {
      return '<tr><td>' + (i + 1) + '</td><td>' + esc(apiToDate(r.ngay)) + '</td><td>' + esc(r.so_bkg || '-') + '</td><td>' + esc(r.loai_cont || '-') + '</td><td>' + esc(r.so_cont || '-') + '</td><td>' + esc(r.tuyen || '-') + '</td><td class="text-end">' + money(r.tong_doanh_thu) + '</td><td class="text-end">' + money(r.tong_chi_ho_khach_hang) + '</td><td class="text-end fw-semibold">' + money(r.tong_tien) + '</td></tr>';
    }).join('');
    $('#ptkh-detail-body').html(
      '<div class="ptkh-detail-summary"><div><span>Khách hàng</span><strong>' + esc(customerName(item)) + '</strong></div><div><span>Trạng thái duyệt</span><strong>' + statusBadge(approveStatus(item)) + '</strong></div><div><span>Số hóa đơn</span><strong>' + esc(item.so_hoa_don || '-') + '</strong></div><div><span>Tổng tiền</span><strong>' + money(itemTotal(item, 'tong')) + '</strong></div></div>' +
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
      $('#ptkh-status-invoice').val(item.so_hoa_don || '');
      var lastNote = '';
      var history = item.lich_su_duyet || [];
      if (history.length && history[history.length - 1].ghi_chu) {
        lastNote = history[history.length - 1].ghi_chu;
      }
      $('#ptkh-status-note').val(lastNote);
      if (isApproved && statusModal.fp && item.thang_hach_toan) {
        var mm = monthToInput(item.thang_hach_toan);
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
    var payload = { trang_thai_duyet: status };
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
      url: API + '/' + id,
      method: 'PUT',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payload)
    }).done(function () {
      notify('Đã cập nhật trạng thái.', 'success');
      $('#ptkh-status-modal').modal('hide');
      loadList();
    }).fail(function (xhr) {
      notify(apiMsg(xhr), 'error');
    }).always(function () {
      $btn.prop('disabled', false);
    });
  }

  function bind() {
    function openCreateModal() {
      resetCandidates('Chọn khách hàng rồi bấm Lọc.');
      $('#ptkh-create-modal').modal('show');
    }
    $('#ptkh-search').on('click', reloadFromFilter);
    $('#ptkh-reload').on('click', resetFilters);
    $('#ptkh-keyword').on('keydown', function (e) { if (e.which === 13) reloadFromFilter(); });
    $('#ptkh-filter-customer, #ptkh-filter-status').on('change', reloadFromFilter);
    $('#ptkh-filter-created-from, #ptkh-filter-created-to').on('change', reloadFromFilter);
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
    $('#ptkh-open-create').on('click', openCreateModal);
    $(document).on('click', '#ptkh-load-candidates', loadCandidates);
    $('#ptkh-check-all').on('change', function () { $('.ptkh-plan-check:not(:disabled)').prop('checked', this.checked); updateSelectedTotal(); });
    $(document).on('change', '.ptkh-plan-check', updateSelectedTotal);
    $('#ptkh-create-submit').on('click', createVoucher);
    $(document).on('click', '.ptkh-view', function (e) { e.preventDefault(); openDetail($(this).data('id'), false); });
    $(document).on('click', '.ptkh-history', function (e) { e.preventDefault(); openDetail($(this).data('id'), true); });
    $(document).on('click', '.ptkh-status', function (e) { e.preventDefault(); openStatusModal($(this).data('id'), $(this).data('status')); });
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
    try {
      var url = new URL(window.location.href);
      if (url.searchParams.get('open_create') === '1') {
        url.searchParams.delete('open_create');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : '') + url.hash);
        setTimeout(openCreateModal, 0);
      }
    } catch (e) {}
  }

  $(function () {
    bind();
    initDatePickers();
    initStatusMonthPicker();
    initSelect2($('#ptkh-filter-status'), 'Tất cả');
    loadCustomers();
    loadList();
  });
})(jQuery);

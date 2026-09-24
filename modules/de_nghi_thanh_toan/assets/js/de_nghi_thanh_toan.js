(function ($, Drupal) {
  'use strict';

  // Lưu ý jQuery: Drupal 7 mặc định 1.4.4 nên KHÔNG dùng .on()/.prop()/.done()/.fail() hay $.ajax({method}).
  // Dùng .live()/.delegate() không cần: ở đây bind trực tiếp lên phần tử tĩnh của template.
  // Toàn bộ gọi API bằng $.ajax({type, success, error}).

  var API = '/api/de-nghi-thanh-toan';
  var settings = (Drupal.settings && Drupal.settings.de_nghi_thanh_toan) || {};
  var perms = settings.permissions || {};

  var notyf;
  var state = {
    page: 1,
    tab: 'all',
    filters: { keyword: '', nid_ncc: '', hinh_thuc: '' },
    chips: { qua_han: false, chua_hd: false, khac_ben: false },
    items: {},
    options: null,
    optionsLoading: false,
    optionsCallbacks: [],
    menuId: 0,
    viewId: 0,
    editId: 0,
    rejectCtx: null,
    payCtx: null
  };

  var TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'mine', label: 'Của tôi' },
    { id: 'nhap', label: 'Nháp' },
    { id: 'cho_duyet', label: 'Chờ duyệt' },
    { id: 'cho_duyet_thanh_toan', label: 'Chờ duyệt TT' },
    { id: 'cho_thanh_toan', label: 'Chờ thanh toán' },
    { id: 'hoan_thanh', label: 'Hoàn thành' },
    { id: 'tu_choi', label: 'Từ chối' }
  ];

  var STATUS_CLASS = {
    nhap: 'bg-label-secondary',
    cho_duyet: 'bg-label-warning',
    cho_duyet_thanh_toan: 'bg-label-warning',
    cho_thanh_toan: 'bg-label-primary',
    hoan_thanh: 'bg-label-success',
    tu_choi: 'bg-label-danger',
    tu_choi_thanh_toan: 'bg-label-danger'
  };

  var ACTION_ICON = {
    'gui-duyet': 'tabler-send',
    'thu-hoi': 'tabler-history',
    'duyet': 'tabler-check',
    'tu-choi': 'tabler-x',
    'duyet-thanh-toan': 'tabler-check',
    'tu-choi-thanh-toan': 'tabler-x',
    'thanh-toan': 'tabler-cash'
  };

  var HINH_THUC_LABEL = { CK: 'Chuyển khoản', TM: 'Tiền mặt' };

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return (r && r.message) || 'Có lỗi xảy ra';
    } catch (e) {
      return 'Có lỗi xảy ra';
    }
  }

  function esc(v) {
    if (v === null || typeof v === 'undefined') return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function money(v) {
    var n = parseInt(v, 10);
    if (isNaN(n)) return '0';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function digits(v) {
    var n = parseInt(String(v || '').replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  // Ngày API (YYYY-MM-DD) <-> hiển thị (dd/mm/yyyy).
  function toView(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  function toApi(v) {
    v = $.trim(v || '');
    if (!v) return '';
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
    if (!m) return null;
    var dd = ('0' + m[1]).slice(-2), mm = ('0' + m[2]).slice(-2);
    return m[3] + '-' + mm + '-' + dd;
  }

  function toDateTimeView(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(s || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] : (s || '');
  }

  function toast(msg, ok) {
    if (!notyf && typeof Notyf !== 'undefined') notyf = new Notyf();
    if (notyf) { if (ok === false) notyf.error(msg); else notyf.success(msg); }
  }

  function modalOf(id) {
    var el = document.getElementById(id);
    return bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(el) : new bootstrap.Modal(el);
  }

  function statusBadge(item) {
    return '<span class="badge ' + (STATUS_CLASS[item.trang_thai] || 'bg-label-secondary') + '">' + esc(item.trang_thai_label) + '</span>';
  }

  /* ─────────── API ─────────── */

  function call(type, url, data, ok, fail) {
    $.ajax({
      url: url,
      type: type,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: data ? JSON.stringify(data) : undefined,
      success: function (res) { if (ok) ok(res && res.data); },
      error: function (jqXHR) { if (fail) fail(jqXHR); else toast(apiMsg(jqXHR), false); }
    });
  }

  function loadOptions(cb) {
    if (state.options) { cb(state.options); return; }
    state.optionsCallbacks.push(cb);
    if (state.optionsLoading) return;
    state.optionsLoading = true;
    $.ajax({
      url: API + '/tuy-chon', type: 'GET', dataType: 'json',
      success: function (res) { state.options = (res && res.data) || { ncc: [], nhan_vien: [], hinh_thuc: [], quy: [] }; },
      error: function (jqXHR) { toast(apiMsg(jqXHR), false); state.options = { ncc: [], nhan_vien: [], hinh_thuc: [], quy: [] }; },
      complete: function () {
        state.optionsLoading = false;
        var cbs = state.optionsCallbacks.splice(0);
        for (var i = 0; i < cbs.length; i++) cbs[i](state.options);
      }
    });
  }

  /* ─────────── Danh sách ─────────── */

  function listParams() {
    var p = { page: state.page, limit: 20, tab: state.tab };
    if (state.filters.keyword) p.keyword = state.filters.keyword;
    if (state.filters.nid_ncc) p.nid_ncc = state.filters.nid_ncc;
    if (state.filters.hinh_thuc) p.hinh_thuc = state.filters.hinh_thuc;
    if (state.chips.qua_han) p.qua_han = 1;
    if (state.chips.chua_hd) p.chua_hd = 1;
    if (state.chips.khac_ben) p.khac_ben = 1;
    return p;
  }

  function loadList() {
    $('#dn-tbody').html('<tr><td colspan="11" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>');
    $.ajax({
      url: API, type: 'GET', dataType: 'json', data: listParams(),
      success: function (res) {
        var d = (res && res.data) || {};
        state.items = {};
        var items = d.items || [];
        for (var i = 0; i < items.length; i++) state.items[items[i].nid] = items[i];
        renderTabs(d.tab_counts || {});
        renderRows(items, d);
        renderSum(d.tong || {});
        renderPagination(d);
      },
      error: function (jqXHR) {
        $('#dn-tbody').html('<tr><td colspan="11" class="text-center text-danger py-4">' + esc(apiMsg(jqXHR)) + '</td></tr>');
      }
    });
  }

  function renderTabs(counts) {
    var html = '';
    for (var i = 0; i < TABS.length; i++) {
      var t = TABS[i];
      var on = state.tab === t.id;
      html += '<li class="nav-item"><button type="button" class="nav-link waves-effect waves-light' + (on ? ' active' : '') + '" data-tab="' + t.id + '" role="tab">' +
        esc(t.label) + ' <span class="badge bg-label-primary ms-1">' + (counts[t.id] || 0) + '</span></button></li>';
    }
    $('#dn-tabs').html(html);
  }

  function renderSum(t) {
    function stat(label, value, cls) {
      return '<div class="dn-sum-item"><span class="dn-sum-label">' + label + '</span><span class="dn-sum-value ' + cls + '">' + money(value) + ' đ</span></div>';
    }
    $('#dn-sum').html(stat('Tổng sau VAT', t.tong_sau_vat, '') + stat('Đã thanh toán', t.da_thanh_toan, 'text-success') + stat('Còn lại', t.con_lai, 'text-danger'));
  }

  function actionButtons(item) {
    var html = '';
    var list = item.hanh_dong || [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var cls = a.style === 'danger' ? 'btn-label-danger' : (a.style === 'secondary' ? 'btn-label-secondary' : 'btn-primary');
      html += ' <button type="button" class="btn btn-sm dn-act ' + cls + '" data-act="' + esc(a.key) + '" data-id="' + item.nid + '">' +
        '<i class="ti ' + (ACTION_ICON[a.key] || 'tabler-point') + '"></i> ' + esc(a.label) + '</button>';
    }
    if (item.co_the_sua && (item.trang_thai === 'tu_choi' || item.trang_thai === 'tu_choi_thanh_toan')) {
      html += ' <button type="button" class="btn btn-sm dn-act btn-label-primary" data-act="sua" data-id="' + item.nid + '"><i class="ti tabler-edit"></i> Sửa</button>';
    }
    if (item.co_the_sua && item.trang_thai === 'nhap') {
      html += ' <button type="button" class="btn btn-sm dn-act btn-label-primary" data-act="sua" data-id="' + item.nid + '"><i class="ti tabler-edit"></i> Sửa</button>';
    }
    return html;
  }

  function payeeCell(item) {
    var b = item.ben_nhan_tien || {};
    if (!b.khac_ben_phat_hanh) return '<span class="small text-muted">Trùng bên phát hành</span>';
    return '<div>' + esc(b.ten) + '</div><span class="dn-payee"><i class="ti tabler-user-dollar" style="font-size:11px;"></i>' +
      (b.loai === 'nhan_vien' ? 'Nhân viên' : 'NCC khác') + '</span>';
  }

  function noteHtml(item) {
    if (item.trang_thai === 'tu_choi' || item.trang_thai === 'tu_choi_thanh_toan') {
      return '<div class="small mt-1 text-danger">Lý do: ' + esc(item.ly_do_tu_choi) + '</div>';
    }
    if (item.qua_han_ngay > 0) {
      return '<div class="small mt-1 text-danger fw-semibold">Quá hạn thanh toán ' + item.qua_han_ngay + ' ngày</div>';
    }
    if (item.trang_thai === 'cho_thanh_toan' && item.da_thanh_toan > 0) {
      return '<div class="small mt-1 text-muted">Đã trả ' + money(item.da_thanh_toan) + ' đ · còn ' + money(item.con_lai) + ' đ</div>';
    }
    return '';
  }

  /** Các dòng <tr> chi phí của 1 đề nghị (dùng cho modal chi tiết và dòng mở rộng ở danh sách). */
  function linesRowsHtml(lines) {
    var html = '';
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      html += '<tr><td>' + esc(l.ke_hoach_label) + '</td><td>' + esc(l.ten_chi_phi) + '</td><td><span class="dn-tag ' + (l.loai_chi_phi === 'tinh_cho_khach' ? 'kh' : 'ct') + '">' +
        (l.loai_chi_phi === 'tinh_cho_khach' ? 'KH' : 'CT') + '</span></td><td class="text-end">' + money(l.don_gia) + '</td><td class="text-end">' + esc(l.so_luong) +
        '</td><td class="text-end">' + money(l.tong_truoc_vat) + '</td><td class="text-end">' + esc(l.vat_percent) + '</td><td class="text-end fw-semibold">' + money(l.tong_sau_vat) +
        '</td><td class="text-muted">' + esc(l.ghi_chu) + '</td></tr>';
    }
    return html;
  }

  /* ─────────── Mở rộng dòng: chi phí của đề nghị ─────────── */

  function expandHtml(d) {
    var lines = d.dong_chi_phi || [];
    var html = '<div class="dn-expand-wrap"><div class="dn-expand-title"><i class="ti tabler-list-details me-1"></i>Chi phí trong đề nghị (' + lines.length + ')</div>' +
      '<table class="table table-sm table-bordered dn-expand-table mb-0"><thead><tr><th>Kế hoạch</th><th>Tên chi phí</th><th style="width:50px;">Loại</th>' +
      '<th class="text-end">Đơn giá</th><th class="text-end" style="width:50px;">SL</th><th class="text-end">Trước VAT</th><th class="text-end" style="width:60px;">VAT%</th>' +
      '<th class="text-end">Sau VAT</th><th>Ghi chú</th></tr></thead><tbody>';
    html += lines.length ? linesRowsHtml(lines) : '<tr><td colspan="9" class="text-center text-muted">Chưa có dòng chi phí</td></tr>';
    html += '</tbody><tfoot><tr><td colspan="5" class="text-end fw-semibold">Tổng</td><td class="text-end fw-semibold">' + money(d.tong_truoc_vat) +
      '</td><td class="text-end">' + money(d.tong_vat) + '</td><td class="text-end fw-semibold">' + money(d.tong_sau_vat) + '</td><td></td></tr></tfoot></table></div>';
    return html;
  }

  function toggleExpand(id) {
    var $tr = $('#dn-tbody tr[data-id="' + id + '"]');
    var $exp = $('#dn-tbody tr.dn-exp-row[data-exp="' + id + '"]');
    if ($exp.length) {
      if ($exp.data('loading')) return;
      $exp.toggle();
      var open = $exp.is(':visible');
      $tr.toggleClass('dn-row-open', open);
      $tr.find('.dn-chevron').toggleClass('tabler-chevron-right', !open).toggleClass('tabler-chevron-down', open);
      return;
    }
    $exp = $('<tr class="dn-exp-row" data-exp="' + id + '"><td colspan="11"><div class="dn-expand-loading"><span class="spinner-border spinner-border-sm text-primary me-2"></span>Đang tải chi phí…</div></td></tr>');
    $exp.data('loading', true);
    $tr.after($exp).addClass('dn-row-open');
    $tr.find('.dn-chevron').removeClass('tabler-chevron-right').addClass('tabler-chevron-down');
    call('GET', API + '/' + id, null, function (d) {
      $exp.data('loading', false);
      $exp.children('td').html(expandHtml(d || {}));
    }, function (jqXHR) {
      $exp.remove();
      $tr.removeClass('dn-row-open');
      $tr.find('.dn-chevron').removeClass('tabler-chevron-down').addClass('tabler-chevron-right');
      toast(apiMsg(jqXHR), false);
    });
  }

  function renderRows(items, d) {
    if (!items.length) {
      $('#dn-tbody').html('<tr><td colspan="11" class="text-center text-muted py-4">Không có dữ liệu</td></tr>');
      return;
    }
    var html = '';
    var stt = ((d.current_page || 1) - 1) * (d.limit || 20);
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      stt++;
      html += '<tr data-id="' + it.nid + '">' +
        '<td class="text-center"><button type="button" class="dn-stt-btn" data-menu-open="' + it.nid + '" title="Chức năng">' + stt + '</button></td>' +
        '<td><div class="fw-semibold">' + esc(it.ma_de_nghi) + '</div><div class="small text-muted">' + esc(toView(it.created)) + ' · ' + esc(it.nguoi_tao) + '</div></td>' +
        '<td><div>' + esc(it.ncc_ten) + '</div><div class="small text-muted"><i class="ti tabler-file-invoice me-1"></i>' +
          (it.so_hoa_don ? 'HĐ ' + esc(it.so_hoa_don) + (it.ngay_hoa_don ? ' · ' + esc(toView(it.ngay_hoa_don)) : '') : 'Chưa có số hoá đơn') + '</div></td>' +
        '<td>' + payeeCell(it) + '</td>' +
        '<td><div><i class="ti tabler-chevron-right dn-chevron me-1"></i>' + it.so_dong + ' dòng</div><div class="small text-muted">' + it.so_chuyen + ' chuyến</div></td>' +
        '<td class="text-end">' + money(it.tong_truoc_vat) + '</td>' +
        '<td class="text-end">' + money(it.tong_vat) + '</td>' +
        '<td class="text-end fw-semibold">' + money(it.tong_sau_vat) + '</td>' +
        '<td class="text-end"><div class="text-success">' + money(it.da_thanh_toan) + '</div><div class="small text-danger">' + money(it.con_lai) + '</div></td>' +
        '<td><div class="' + (it.qua_han_ngay > 0 ? 'text-danger fw-semibold' : '') + '">' + (it.han_thanh_toan ? esc(toView(it.han_thanh_toan)) : '—') + '</div>' +
          '<div class="small text-muted">' + esc(HINH_THUC_LABEL[it.hinh_thuc_tt] || '—') + '</div></td>' +
        '<td><div class="d-flex align-items-center flex-wrap gap-1">' + statusBadge(it) + actionButtons(it) + '</div>' + noteHtml(it) + '</td>' +
        '</tr>';
    }
    $('#dn-tbody').html(html);
  }

  function renderPagination(d) {
    var total = d.total || 0;
    var totalPages = d.total_pages || 0;
    var current = d.current_page || 1;
    $('#dn-pagination').show();
    var from = total ? (current - 1) * (d.limit || 20) + 1 : 0;
    var to = Math.min(current * (d.limit || 20), total);
    $('#dn-pagination-info').text('Hiển thị ' + from + '–' + to + ' / ' + total + ' bản ghi');
    $('#dn-pagination-total-pages').text('/ ' + Math.max(totalPages, 1));
    $('#dn-pagination-jump').val(current);
    var html = '<li class="page-item prev' + (current <= 1 ? ' disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    var start = Math.max(1, current - 2), end = Math.min(Math.max(totalPages, 1), current + 2);
    for (var p = start; p <= end; p++) {
      html += '<li class="page-item' + (p === current ? ' active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }
    html += '<li class="page-item next' + (current >= totalPages ? ' disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    $('#dn-pagination .pagination').html(html);
  }

  /* ─────────── Hành động ─────────── */

  function doAction(id, key, body, done) {
    call('POST', API + '/' + id + '/' + key, body || {}, function (data) {
      if (done) done(data);
      loadList();
    });
  }

  function openReject(item, key, title) {
    state.rejectCtx = { id: item.nid, key: key };
    $('#dn-reject-title').text(title + ' ' + item.ma_de_nghi);
    $('#dn-reject-reason').removeClass('is-invalid').val('');
    modalOf('dn-reject-modal').show();
  }

  function confirmReject() {
    var reason = $.trim($('#dn-reject-reason').val());
    if (!reason) { $('#dn-reject-reason').addClass('is-invalid'); return; }
    var ctx = state.rejectCtx;
    if (!ctx) return;
    $('#dn-reject-confirm').attr('disabled', 'disabled');
    call('POST', API + '/' + ctx.id + '/' + ctx.key, { ly_do: reason }, function () {
      $('#dn-reject-confirm').removeAttr('disabled');
      modalOf('dn-reject-modal').hide();
      toast('Đã cập nhật đề nghị.');
      loadList();
    }, function (jqXHR) {
      $('#dn-reject-confirm').removeAttr('disabled');
      toast(apiMsg(jqXHR), false);
    });
  }

  function quyOptionsFor(ht) {
    var opts = (state.options && state.options.hinh_thuc) || [];
    var loai = '';
    for (var i = 0; i < opts.length; i++) if (opts[i].value === ht) loai = opts[i].loai_quy;
    var out = [];
    var quy = (state.options && state.options.quy) || [];
    for (var j = 0; j < quy.length; j++) if (quy[j].loai === loai) out.push(quy[j]);
    return out;
  }

  function fillQuySelect() {
    var ht = $('#dn-pay-ht').val();
    var list = quyOptionsFor(ht);
    var html = '<option value="">Chọn quỹ</option>';
    for (var i = 0; i < list.length; i++) {
      html += '<option value="' + list[i].nid + '">' + esc(list[i].ten) + ' — số dư ' + money(list[i].so_du) + ' đ</option>';
    }
    $('#dn-pay-quy').html(html).removeClass('is-invalid');
    $('#dn-pay-quy-hint').text('(chỉ hiện quỹ ' + (ht === 'TM' ? 'tiền mặt' : 'ngân hàng') + ')');
    if (list.length === 1) $('#dn-pay-quy').val(String(list[0].nid));
  }

  function openPay(item) {
    loadOptions(function () {
      state.payCtx = { id: item.nid };
      $('#dn-pay-title').text('Ghi nhận thanh toán ' + item.ma_de_nghi);
      var to = item.ben_nhan_tien && item.ben_nhan_tien.ten ? item.ben_nhan_tien.ten : item.ncc_ten;
      $('#dn-pay-info').html('Trả cho: <strong>' + esc(to) + '</strong> · Còn lại <strong>' + money(item.con_lai) + ' đ</strong> / Sau VAT ' + money(item.tong_sau_vat) + ' đ');
      $('#dn-pay-amount').val(money(item.con_lai)).removeClass('is-invalid');
      $('#dn-pay-ht').val(item.hinh_thuc_tt === 'TM' ? 'TM' : 'CK');
      $('#dn-pay-note').val('');
      fillQuySelect();
      modalOf('dn-pay-modal').show();
    });
  }

  function confirmPay() {
    var ctx = state.payCtx;
    if (!ctx) return;
    var amount = digits($('#dn-pay-amount').val());
    var quy = parseInt($('#dn-pay-quy').val(), 10) || 0;
    var item = state.items[ctx.id];
    var ok = true;
    if (!amount || (item && amount > item.con_lai)) { $('#dn-pay-amount').addClass('is-invalid'); ok = false; } else { $('#dn-pay-amount').removeClass('is-invalid'); }
    if (!quy) { $('#dn-pay-quy').addClass('is-invalid'); ok = false; } else { $('#dn-pay-quy').removeClass('is-invalid'); }
    if (!ok) return;
    $('#dn-pay-confirm').attr('disabled', 'disabled');
    call('POST', API + '/' + ctx.id + '/thanh-toan', {
      so_tien: amount, hinh_thuc_tt: $('#dn-pay-ht').val(), nid_quy: quy, ghi_chu: $.trim($('#dn-pay-note').val())
    }, function () {
      $('#dn-pay-confirm').removeAttr('disabled');
      modalOf('dn-pay-modal').hide();
      toast('Đã ghi nhận thanh toán.');
      loadList();
      if (state.viewId === ctx.id) openView(ctx.id, true);
    }, function (jqXHR) {
      $('#dn-pay-confirm').removeAttr('disabled');
      toast(apiMsg(jqXHR), false);
    });
  }

  function runAction(id, key) {
    var item = state.items[id];
    if (!item) return;
    if (key === 'sua') { openEdit(id); return; }
    if (key === 'tu-choi') { openReject(item, key, 'Từ chối'); return; }
    if (key === 'tu-choi-thanh-toan') { openReject(item, key, item.trang_thai === 'cho_thanh_toan' ? 'Trả lại' : 'Từ chối TT'); return; }
    if (key === 'thanh-toan') { openPay(item); return; }
    doAction(id, key, {}, function () {
      toast(key === 'gui-duyet' ? 'Đã gửi duyệt ' + item.ma_de_nghi : 'Đã cập nhật ' + item.ma_de_nghi);
    });
  }

  /* ─────────── Chi tiết ─────────── */

  function field(label, value) {
    return '<div class="col-md-3"><div class="dn-info-label">' + esc(label) + '</div><div class="dn-info-value">' + (value === '' || value === null ? '—' : value) + '</div></div>';
  }

  function renderDetail(d) {
    var b = d.ben_nhan_tien || {};
    var payee = b.khac_ben_phat_hanh ? esc(b.ten) + ' <span class="small text-muted">(' + (b.loai === 'nhan_vien' ? 'nhân viên ứng trước' : 'NCC thu hộ') + ')</span>' : 'Trùng bên phát hành (' + esc(d.ncc_ten) + ')';
    var han = d.han_thanh_toan ? esc(toView(d.han_thanh_toan)) + (d.qua_han_ngay > 0 ? ' <span class="text-danger fw-semibold">(quá hạn ' + d.qua_han_ngay + ' ngày)</span>' : '') : 'Chưa đặt';
    var html = '';
    if ((d.trang_thai === 'tu_choi' || d.trang_thai === 'tu_choi_thanh_toan') && d.ly_do_tu_choi) {
      html += '<div class="alert alert-danger py-2"><strong>Lý do từ chối:</strong> ' + esc(d.ly_do_tu_choi) + '</div>';
    }
    html += '<div class="row g-3">' +
      field('Bên phát hành', esc(d.ncc_ten)) + field('Bên nhận tiền', payee) +
      field('Số hoá đơn', d.so_hoa_don ? esc(d.so_hoa_don) : 'Chưa có') + field('Ngày hoá đơn', d.ngay_hoa_don ? esc(toView(d.ngay_hoa_don)) : 'Chưa có') +
      field('Hạn thanh toán', han) + field('Hình thức thanh toán', esc(HINH_THUC_LABEL[d.hinh_thuc_tt] || 'Chưa chọn')) +
      field('Người tạo', esc(d.nguoi_tao)) + field('Ngày tạo', esc(toView(d.created))) +
      '<div class="col-12"><div class="dn-info-label">Ghi chú</div><div class="dn-info-value">' + (d.ghi_chu ? esc(d.ghi_chu) : '—') + '</div></div></div>';

    html += '<div class="fw-semibold mt-4 mb-2">Các dòng chi phí trong đề nghị (' + d.so_dong + ')</div>' +
      '<div class="table-responsive"><table class="table table-sm table-bordered dn-lines mb-0"><thead><tr><th>Kế hoạch</th><th>Tên chi phí</th><th style="width:50px;">Loại</th>' +
      '<th class="text-end">Đơn giá</th><th class="text-end" style="width:50px;">SL</th><th class="text-end">Trước VAT</th><th class="text-end" style="width:60px;">VAT%</th><th class="text-end">Sau VAT</th><th>Ghi chú</th></tr></thead><tbody>';
    html += linesRowsHtml(d.dong_chi_phi || []);
    html += '</tbody><tfoot><tr class="table-light"><td colspan="5" class="text-end fw-semibold">Tổng</td><td class="text-end fw-semibold">' + money(d.tong_truoc_vat) +
      '</td><td class="text-end">' + money(d.tong_vat) + '</td><td class="text-end fw-semibold">' + money(d.tong_sau_vat) + '</td><td></td></tr></tfoot></table></div>';

    html += '<div class="row g-3 mt-1"><div class="col-md-4"><div class="dn-box"><span>Tổng sau VAT</span><strong>' + money(d.tong_sau_vat) + ' đ</strong></div></div>' +
      '<div class="col-md-4"><div class="dn-box"><span>Đã trả</span><strong class="text-success">' + money(d.da_thanh_toan) + ' đ</strong></div></div>' +
      '<div class="col-md-4"><div class="dn-box"><span>Còn lại</span><strong class="text-danger">' + money(d.con_lai) + ' đ</strong></div></div></div>';

    html += '<div class="row g-4 mt-1"><div class="col-lg-6 dn-col"><div class="fw-semibold mb-2">Lịch sử thanh toán từng đợt</div>' +
      '<div class="table-responsive"><table class="table table-sm table-bordered dn-lines mb-0"><thead><tr><th style="width:50px;">Đợt</th><th>Ngày</th><th class="text-end">Số tiền</th><th>Hình thức / Quỹ</th><th>Người ghi nhận</th></tr></thead><tbody>';
    var pays = d.thanh_toan || [];
    if (!pays.length) html += '<tr><td colspan="5" class="text-muted text-center">Chưa có đợt thanh toán nào</td></tr>';
    for (var j = 0; j < pays.length; j++) {
      var p = pays[j];
      html += '<tr><td>' + p.dot + '</td><td>' + esc(toDateTimeView(p.created)) + '</td><td class="text-end">' + money(p.so_tien) + '</td><td>' + esc(p.hinh_thuc_label) +
        '<div class="small text-muted">' + esc(p.quy_ten) + '</div></td><td>' + esc(p.nguoi_thanh_toan) + '</td></tr>';
    }
    html += '</tbody></table></div>' +
      '<div class="fw-semibold mt-3 mb-2">Ảnh chứng từ</div><div class="small text-muted">Chưa có chứng từ</div></div>' +
      '<div class="col-lg-6 dn-col"><div class="fw-semibold mb-2">Lịch sử duyệt</div><ul class="list-unstyled mb-0 dn-history">';
    var hist = d.lich_su || [];
    for (var k = 0; k < hist.length; k++) {
      html += '<li class="d-flex gap-2 mb-2"><i class="ti tabler-history text-muted dn-history-icon"></i><span class="small text-muted" style="width:118px;flex-shrink:0;">' + esc(toDateTimeView(hist[k].at)) +
        '</span><span class="small dn-history-text">' + esc(hist[k].text) + (hist[k].nguoi ? ' <span class="text-muted">· ' + esc(hist[k].nguoi) + '</span>' : '') + '</span></li>';
    }
    html += '</ul></div></div>';
    $('#dn-view-body').html(html);
    $('#dn-view-ma').text(d.ma_de_nghi);
    $('#dn-view-status').html(statusBadge(d));
  }

  function openView(id, keepOpen) {
    state.viewId = id;
    $('#dn-view-loading').show();
    if (!keepOpen) { $('#dn-view-body').html(''); modalOf('dn-view-modal').show(); }
    call('GET', API + '/' + id, null, function (d) {
      renderDetail(d);
      $('#dn-view-loading').hide();
    }, function (jqXHR) {
      $('#dn-view-loading').hide();
      toast(apiMsg(jqXHR), false);
    });
  }

  /* ─────────── Sửa ─────────── */

  // Tên kèm số điện thoại nếu có: "Nguyễn Văn A (0123456789)"; không có thì chỉ tên.
  function payeeLabel(x) { return x.ten + (x.sdt ? ' (' + x.sdt + ')' : ''); }

  function payeeSelectHtml(current, nccId) {
    var html = '<option value=""></option>';
    var staff = (state.options && state.options.nhan_vien) || [];
    var nccs = (state.options && state.options.ncc) || [];
    html += '<optgroup label="Nhân viên (ứng tiền trước)">';
    var hasCurrent = false;
    for (var i = 0; i < staff.length; i++) {
      html += '<option value="nhan_vien|' + staff[i].uid + '">' + esc(payeeLabel(staff[i])) + '</option>';
      if (current && current.loai === 'nhan_vien' && staff[i].uid === current.id) hasCurrent = true;
    }
    // Bên nhận đã lưu là 1 lái xe (danh sách nhân viên không liệt kê lái xe): giữ lại để ô không bị trống khi sửa.
    if (current && current.loai === 'nhan_vien' && !hasCurrent) {
      html += '<option value="nhan_vien|' + current.id + '">' + esc(current.ten) + '</option>';
    }
    html += '</optgroup><optgroup label="Nhà cung cấp khác (thu hộ)">';
    for (var j = 0; j < nccs.length; j++) if (nccs[j].nid !== nccId) html += '<option value="ncc|' + nccs[j].nid + '">' + esc(payeeLabel(nccs[j])) + '</option>';
    html += '</optgroup>';
    return html;
  }

  // Select2 chuẩn (SELECT2_PATTERN.md): tìm kiếm được, nhóm theo optgroup.
  function initPayeeSelect(optionsHtml) {
    var $p = $('#dn-edit-payee');
    if ($p.data('select2')) $p.select2('destroy');
    $p.html(optionsHtml);
    if (!$.fn.select2) return;
    $p.select2({ placeholder: 'Chọn nhân viên hoặc NCC khác…', allowClear: true, width: '100%', dropdownParent: $('#dn-edit-modal') });
    $p.unbind('select2:open.dnFocus').bind('select2:open.dnFocus', function () {
      window.setTimeout(function () {
        var search = document.querySelector('.select2-container--open .select2-search__field');
        if (search) search.focus();
      }, 0);
    });
  }

  function openEdit(id) {
    state.editId = id;
    $('#dn-edit-loading').show();
    $('#dn-edit-lines').html('');
    modalOf('dn-edit-modal').show();
    loadOptions(function () {
      call('GET', API + '/' + id, null, function (d) {
        $('#dn-edit-ma').text(d.ma_de_nghi);
        $('#dn-edit-ncc').val(d.ncc_ten);
        $('#dn-edit-so-hd').val(d.so_hoa_don);
        $('#dn-edit-ngay-hd').val(toView(d.ngay_hoa_don));
        $('#dn-edit-han-tt').val(toView(d.han_thanh_toan));
        $('#dn-edit-ht').val(d.hinh_thuc_tt);
        $('#dn-edit-ghi-chu').val(d.ghi_chu);
        var b = d.ben_nhan_tien || {};
        initPayeeSelect(payeeSelectHtml(b.khac_ben_phat_hanh ? b : null, d.nid_ncc));
        var same = !b.khac_ben_phat_hanh;
        $('#dn-edit-trung').prop ? $('#dn-edit-trung').prop('checked', same) : $('#dn-edit-trung').attr('checked', same);
        $('#dn-edit-payee-box').toggle(!same);
        if (!same) $('#dn-edit-payee').val(b.loai + '|' + b.id).trigger('change');
        $('#dn-edit-payee').removeClass('is-invalid');
        if (d.ly_do_tu_choi && (d.trang_thai === 'tu_choi' || d.trang_thai === 'tu_choi_thanh_toan')) {
          $('#dn-edit-reject').removeClass('d-none').html('<strong>Lý do từ chối:</strong> ' + esc(d.ly_do_tu_choi));
        } else {
          $('#dn-edit-reject').addClass('d-none');
        }
        var html = '';
        var lines = d.dong_chi_phi || [];
        for (var i = 0; i < lines.length; i++) {
          html += '<tr><td>' + esc(lines[i].ke_hoach_label) + '</td><td>' + esc(lines[i].ten_chi_phi) + '</td><td class="text-end">' + money(lines[i].tong_sau_vat) +
            '</td><td class="text-end"><button type="button" class="btn btn-sm btn-label-secondary dn-act" data-remove-line="' + lines[i].nid + '" title="Rút khỏi đề nghị"><i class="ti tabler-unlink"></i></button></td></tr>';
        }
        $('#dn-edit-lines').html(html);
        $('#dn-edit-save-send').toggle(d.hanh_dong.length > 0 && hasAction(d, 'gui-duyet'));
        $('#dn-edit-loading').hide();
      }, function (jqXHR) {
        $('#dn-edit-loading').hide();
        toast(apiMsg(jqXHR), false);
      });
    });
  }

  function hasAction(d, key) {
    var list = d.hanh_dong || [];
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return true;
    return false;
  }

  function editPayload() {
    var ngay = toApi($('#dn-edit-ngay-hd').val());
    var han = toApi($('#dn-edit-han-tt').val());
    if (ngay === null || han === null) { toast('Ngày phải có dạng dd/mm/yyyy.', false); return null; }
    var body = {
      so_hoa_don: $.trim($('#dn-edit-so-hd').val()),
      ngay_hoa_don: ngay,
      han_thanh_toan: han,
      hinh_thuc_tt: $('#dn-edit-ht').val(),
      ghi_chu: $.trim($('#dn-edit-ghi-chu').val())
    };
    var same = $('#dn-edit-trung').is(':checked');
    body.ben_nhan_tien_trung = same;
    if (!same) {
      var v = $('#dn-edit-payee').val();
      if (!v) { $('#dn-edit-payee').addClass('is-invalid'); return null; }
      var i = v.indexOf('|');
      body.loai_ben_nhan_tien = v.slice(0, i);
      body.id_ben_nhan_tien = parseInt(v.slice(i + 1), 10);
    }
    return body;
  }

  function saveEdit(andSend) {
    var body = editPayload();
    if (!body) return;
    var id = state.editId;
    $('#dn-edit-save, #dn-edit-save-send').attr('disabled', 'disabled');
    call('PUT', API + '/' + id, body, function () {
      if (andSend) {
        call('POST', API + '/' + id + '/gui-duyet', {}, function () {
          $('#dn-edit-save, #dn-edit-save-send').removeAttr('disabled');
          modalOf('dn-edit-modal').hide();
          toast('Đã lưu và gửi duyệt.');
          loadList();
        }, function (jqXHR) {
          $('#dn-edit-save, #dn-edit-save-send').removeAttr('disabled');
          toast(apiMsg(jqXHR), false);
        });
      } else {
        $('#dn-edit-save, #dn-edit-save-send').removeAttr('disabled');
        modalOf('dn-edit-modal').hide();
        toast('Đã lưu đề nghị.');
        loadList();
      }
    }, function (jqXHR) {
      $('#dn-edit-save, #dn-edit-save-send').removeAttr('disabled');
      toast(apiMsg(jqXHR), false);
    });
  }

  function removeLine(chiPhiId) {
    var id = state.editId;
    call('POST', API + '/' + id + '/rut-dong', { chi_phi_id: chiPhiId }, function (data) {
      if (data && data.deleted) {
        modalOf('dn-edit-modal').hide();
        toast('Đã rút dòng cuối, đề nghị được xoá.');
      } else {
        toast('Đã rút dòng chi phí khỏi đề nghị.');
        openEdit(id);
      }
      loadList();
    });
  }

  /* ─────────── Xoá + menu ─────────── */

  function confirmDelete(item) {
    var run = function () {
      call('DELETE', API + '/' + item.nid, null, function () {
        toast('Đã xoá đề nghị ' + item.ma_de_nghi);
        loadList();
      });
    };
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xoá đề nghị ' + item.ma_de_nghi + '?',
        text: 'Các dòng chi phí trong đó được trả về trạng thái chưa gộp.',
        icon: 'warning', showCancelButton: true, confirmButtonText: 'Xoá', cancelButtonText: 'Huỷ',
        customClass: { confirmButton: 'btn btn-danger me-2', cancelButton: 'btn btn-label-secondary' }, buttonsStyling: false
      }).then(function (r) { if (r.isConfirmed) run(); });
    } else if (window.confirm('Xoá đề nghị ' + item.ma_de_nghi + '?')) {
      run();
    }
  }

  function openMenu(id, x, y) {
    var item = state.items[id];
    if (!item) return;
    state.menuId = id;
    $('#dn-menu-title').text(item.ma_de_nghi + ' · ' + item.ncc_ten);
    $('#dn-menu [data-menu="edit"]').toggleClass('disabled', !item.co_the_sua);
    $('#dn-menu [data-menu="delete"]').toggleClass('disabled', !item.co_the_xoa);
    var w = 220, h = 190;
    var left = Math.min(x, window.innerWidth - w - 8), top = Math.min(y, window.innerHeight - h - 8);
    $('#dn-menu').css({ left: left + 'px', top: top + 'px', display: 'block' });
  }

  function closeMenu() {
    $('#dn-menu').hide();
  }

  /* ─────────── Bind ─────────── */

  function syncChips() {
    $('.dn-chip').each(function () {
      $(this).toggleClass('on', !!state.chips[$(this).data('chip')]);
    });
  }

  function applyFilters() {
    state.filters.keyword = $.trim($('#dn-f-q').val());
    state.filters.nid_ncc = $('#dn-f-ncc').val();
    state.filters.hinh_thuc = $('#dn-f-ht').val();
    state.page = 1;
    loadList();
  }

  function bind() {
    $('#dn-btn-search').click(applyFilters);
    $('#dn-f-q').keydown(function (e) { if (e.which === 13) { e.preventDefault(); applyFilters(); } });
    $('#dn-btn-reset').click(function () {
      $('#dn-f-q').val(''); $('#dn-f-ncc').val(''); $('#dn-f-ht').val('');
      state.chips = { qua_han: false, chua_hd: false, khac_ben: false };
      syncChips();
      applyFilters();
    });
    $('.dn-chip').click(function () {
      var k = $(this).data('chip');
      state.chips[k] = !state.chips[k];
      syncChips();
      state.page = 1;
      loadList();
    });
    $('#dn-tabs').delegate('[data-tab]', 'click', function () {
      state.tab = $(this).data('tab');
      state.page = 1;
      loadList();
    });
    $('#dn-pagination').delegate('[data-page]', 'click', function (e) {
      e.preventDefault();
      var p = parseInt($(this).data('page'), 10);
      if (!p || p < 1 || $(this).parent().hasClass('disabled')) return;
      state.page = p;
      loadList();
    });
    $('#dn-pagination-jump').keydown(function (e) {
      if (e.which !== 13) return;
      var p = parseInt($(this).val(), 10);
      if (p > 0) { state.page = p; loadList(); }
    });

    $('#dn-tbody').delegate('[data-act]', 'click', function (e) {
      e.stopPropagation();
      runAction(parseInt($(this).data('id'), 10), $(this).data('act'));
    });
    // 1 click nhanh vào dòng: mở/đóng bảng chi phí (bỏ qua nút, link, ô nhập; số thứ tự mở menu riêng).
    // Không mở khi: bôi đen chữ, kéo chuột, nhấn giữ lâu, hoặc double click (để chọn chữ).
    var rowPress = null, rowTimer = null;
    var HOLD_MS = 400, DOUBLE_MS = 250, MOVE_PX = 5;
    function hasTextSelection() {
      try {
        var sel = window.getSelection ? window.getSelection() : null;
        return !!(sel && String(sel).replace(/\s+/g, '') !== '');
      } catch (err) { return false; }
    }
    $('#dn-tbody').delegate('tr[data-id]', 'mousedown', function (e) {
      rowPress = { t: new Date().getTime(), x: e.pageX, y: e.pageY };
    });
    $('#dn-tbody').delegate('tr[data-id]', 'click', function (e) {
      if ($(e.target).closest('button, a, input, select, textarea, .btn').length) return;
      var id = parseInt($(this).data('id'), 10);
      var press = rowPress;
      rowPress = null;
      if (rowTimer) { clearTimeout(rowTimer); rowTimer = null; return; }   // click thứ 2 trong khoảng ngắn = double click
      if (press) {
        if (new Date().getTime() - press.t > HOLD_MS) return;                // nhấn giữ
        if (Math.abs(e.pageX - press.x) > MOVE_PX || Math.abs(e.pageY - press.y) > MOVE_PX) return; // kéo chuột
      }
      if (hasTextSelection()) return;                                        // đang bôi đen
      rowTimer = setTimeout(function () {
        rowTimer = null;
        if (hasTextSelection()) return;
        toggleExpand(id);
      }, DOUBLE_MS);
    });
    $('#dn-tbody').delegate('[data-menu-open]', 'click', function (e) {
      e.stopPropagation();
      var off = $(this).offset();
      openMenu(parseInt($(this).data('menu-open'), 10), e.clientX, e.clientY);
    });
    $('#dn-tbody').delegate('tr', 'contextmenu', function (e) {
      var id = parseInt($(this).data('id'), 10);
      if (!id) return;
      e.preventDefault();
      openMenu(id, e.clientX, e.clientY);
    });
    $(document).click(closeMenu);
    $(document).keydown(function (e) { if (e.which === 27) closeMenu(); });
    $('#dn-menu').delegate('[data-menu]', 'click', function (e) {
      e.stopPropagation();
      if ($(this).hasClass('disabled')) return;
      var id = state.menuId, item = state.items[id], what = $(this).data('menu');
      closeMenu();
      if (what === 'view') openView(id);
      if (what === 'edit') openEdit(id);
      if (what === 'delete' && item) confirmDelete(item);
    });

    $('#dn-reject-confirm').click(confirmReject);
    $('#dn-pay-confirm').click(confirmPay);
    $('#dn-pay-ht').change(fillQuySelect);
    $('#dn-pay-amount').bind('input', function () {
      var raw = this.value.replace(/[^0-9]/g, '');
      this.value = raw === '' ? '' : money(raw);
    });
    $('#dn-edit-trung').change(function () {
      $('#dn-edit-payee-box').toggle(!$(this).is(':checked'));
    });
    $('#dn-edit-form').submit(function (e) { e.preventDefault(); saveEdit(false); });
    $('#dn-edit-save-send').click(function () { saveEdit(true); });
    $('#dn-edit-lines').delegate('[data-remove-line]', 'click', function () {
      removeLine(parseInt($(this).data('remove-line'), 10));
    });
  }

  function initFilters() {
    loadOptions(function (opts) {
      var html = '<option value="">Tất cả</option>';
      var nccs = opts.ncc || [];
      for (var i = 0; i < nccs.length; i++) html += '<option value="' + nccs[i].nid + '">' + esc(nccs[i].ten) + '</option>';
      $('#dn-f-ncc').html(html);
    });
  }

  Drupal.behaviors.deNghiThanhToan = {
    attach: function (context) {
      if (!$('#dn-app', context).length || Drupal.behaviors.deNghiThanhToan._done) return;
      Drupal.behaviors.deNghiThanhToan._done = true;
      bind();
      syncChips();
      initFilters();
      loadList();
      var hash = /^#xem-(\d+)$/.exec(window.location.hash || '');
      if (hash) openView(parseInt(hash[1], 10));
      if (typeof flatpickr !== 'undefined') {
        $('.flatpickr-date').each(function () {
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, static: true });
        });
      }
    }
  };
})(jQuery, Drupal);

(function (Drupal) {
  'use strict';

  // Trang có thể có nhiều bản jQuery (của Drupal và của theme; plugin select2 chỉ gắn vào 1 bản). Sự kiện của plugin
  // (vd 'change' của Select2) chỉ tới được handler gắn bằng CHÍNH bản jQuery đó, nên toàn bộ code trang chạy trên bản có
  // plugin, chọn lúc trang khởi tạo. Vẫn giữ cách viết tương thích jQuery cũ: không dùng .on()/.prop()/.done()/.fail().
  function pickJq() {
    var list = [window.jQuery, window.$];
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] === 'function' && list[i].fn && typeof list[i].fn.select2 === 'function') return list[i];
    }
    return typeof window.jQuery === 'function' ? window.jQuery : null;
  }

  function DeNghi($) {

  var API = '/api/de-nghi-thanh-toan';
  var settings = {};
  var perms = {};

  var notyf;
  var state = {
    page: 1,
    tab: 'all',
    filters: { keyword: '', nid_ncc_phat_hanh: '', ben_nhan_tien: '', hinh_thuc: '' },
    chips: { qua_han: false, chua_hd: false, nhieu_hd: false },
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

  // Dòng báo lỗi khi tải danh sách: hiện đúng lý do server trả về; 401/403 (không có quyền) thì chữ vàng + icon ổ khoá.
  function loadErrorRow(colspan, jqXHR) {
    var denied = !!jqXHR && (jqXHR.status === 401 || jqXHR.status === 403);
    var msg = String(apiMsg(jqXHR)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<tr><td colspan="' + colspan + '" class="text-center py-4 ' + (denied ? 'text-warning' : 'text-danger') + '">' +
      (denied ? '<i class="ti tabler-lock me-1"></i>' : '') + msg + '</td></tr>';
  }

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
    if (state.filters.nid_ncc_phat_hanh) p.nid_ncc_phat_hanh = state.filters.nid_ncc_phat_hanh;
    if (state.filters.ben_nhan_tien) p.ben_nhan_tien = state.filters.ben_nhan_tien;
    if (state.filters.hinh_thuc) p.hinh_thuc = state.filters.hinh_thuc;
    if (state.chips.qua_han) p.qua_han = 1;
    if (state.chips.chua_hd) p.chua_hd = 1;
    if (state.chips.nhieu_hd) p.nhieu_hd = 1;
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
        $('#dn-tbody').html(loadErrorRow(11, jqXHR));
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

  // Loại bên nhận tiền: nhãn ngắn ở danh sách.
  var PAYEE_SHORT = { nhan_vien: 'Nhân viên', lai_xe: 'Lái xe', ncc: 'Nhà cung cấp' };

  // Không còn "trùng bên phát hành" (không có 1 bên phát hành duy nhất nữa) — luôn hiện thẳng bên nhận tiền.
  // Mỗi loại bên nhận 1 màu (dn-payee-ncc / -nhan_vien / -lai_xe, xem CSS).
  function payeeCell(item) {
    var b = item.ben_nhan_tien || {};
    var loai = PAYEE_SHORT[b.loai] ? b.loai : 'ncc';
    return '<div>' + esc(b.ten) + '</div><span class="dn-payee dn-payee-' + loai + '"><i class="ti tabler-user-dollar" style="font-size:11px;"></i>' +
      PAYEE_SHORT[loai] + '</span>';
  }

  // Hình thức thanh toán dạng thẻ cùng kiểu thẻ bên nhận tiền: CK / TM mỗi loại 1 màu.
  function hinhThucTag(ht) {
    if (!HINH_THUC_LABEL[ht]) return '<span class="small text-muted">—</span>';
    var icon = ht === 'CK' ? 'tabler-building-bank' : 'tabler-cash';
    return '<span class="dn-payee dn-ht-' + ht.toLowerCase() + '"><i class="ti ' + icon + '" style="font-size:11px;"></i>' + HINH_THUC_LABEL[ht] + '</span>';
  }

  // Hạn TT: đỏ = đến hạn hôm nay/quá hạn, vàng = còn ≤ 3 ngày (han_tt_muc do server tính, chỉ khi đề nghị chưa xong).
  function hanTtHtml(it) {
    if (!it.han_thanh_toan) return '<div>—</div>';
    var cls = it.han_tt_muc === 'den_han' ? 'text-danger fw-semibold' : (it.han_tt_muc === 'sap_den_han' ? 'text-warning fw-semibold' : '');
    var title = it.qua_han_ngay > 0 ? 'Quá hạn ' + it.qua_han_ngay + ' ngày' : (it.han_tt_muc === 'den_han' ? 'Đến hạn hôm nay' : (it.han_tt_muc === 'sap_den_han' ? 'Sắp đến hạn' : ''));
    return '<div class="' + cls + '"' + (title ? ' title="' + title + '"' : '') + '>' + esc(toView(it.han_thanh_toan)) + '</div>';
  }

  // Chip "Hoá đơn liên quan": tối đa 2 hoá đơn đầu, còn lại gộp "+N khác".
  function hoaDonChipsHtml(item) {
    var list = item.hoa_dons || [];
    if (!list.length) return '<span class="small text-muted">Chưa có số hoá đơn</span>';
    var html = '<div class="d-flex flex-wrap gap-1">';
    var shown = list.slice(0, 2);
    for (var i = 0; i < shown.length; i++) {
      var g = shown[i];
      html += '<span class="dn-hdchip">' + esc(g.ncc_ten || '—') + (g.so_hoa_don ? ' · ' + esc(g.so_hoa_don) : ' · chưa có HĐ') + '</span>';
    }
    if (list.length > 2) html += '<span class="dn-hdchip more">+' + (list.length - 2) + ' hoá đơn khác</span>';
    html += '</div>';
    return html;
  }

  // Nhóm các dòng chi phí theo hoá đơn (nid_ncc + so_hoa_don), giữ thứ tự xuất hiện — dùng cho bảng gộp
  // (dòng bung ở danh sách + modal chi tiết + modal sửa).
  function groupLinesByHoaDon(lines) {
    var map = {}, order = [];
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      var key = (l.nid_ncc || 0) + '|' + (l.so_hoa_don || '');
      if (!map[key]) { map[key] = { ncc_ten: l.ncc_ten || '', so_hoa_don: l.so_hoa_don || '', ngay_hoa_don: l.ngay_hoa_don || '', lines: [], sau: 0 }; order.push(key); }
      map[key].lines.push(l);
      map[key].sau += Number(l.tong_sau_vat) || 0;
    }
    var out = [];
    for (var j = 0; j < order.length; j++) out.push(map[order[j]]);
    return out;
  }

  function isDoDau(item) { return item && item.loai_nguon === 'do_dau'; }

  // Cột "Chi phí" ở danh sách: chi phí kế hoạch hiện số dòng / số chuyến, đề nghị đổ dầu hiện mã phiếu + biển số.
  function sourceCell(it) {
    var chev = '<i class="ti tabler-chevron-right dn-chevron me-1"></i>';
    if (isDoDau(it)) {
      var ref = it.nguon_ref || {};
      return '<div>' + chev + '<span class="dn-tag dd">ĐD</span> ' + esc(ref.bks || '') + '</div><div class="small text-muted">' + esc(ref.ma || '') + '</div>';
    }
    return '<div>' + chev + it.so_dong + ' chi phí</div><div class="small text-muted">' + it.so_chuyen + ' chuyến</div>';
  }

  // Cột Trạng thái: dòng 1 = thẻ trạng thái (+ lý do nếu bị từ chối), dòng 2 = các nút hành động.
  function statusCellHtml(it) {
    var rejected = (it.trang_thai === 'tu_choi' || it.trang_thai === 'tu_choi_thanh_toan') && it.ly_do_tu_choi;
    var html = '<div class="d-flex align-items-center flex-wrap gap-1">' + statusBadge(it) +
      (rejected ? '<span class="small text-danger">Lý do: ' + esc(it.ly_do_tu_choi) + '</span>' : '') + '</div>';
    var btns = actionButtons(it);
    if (btns) html += '<div class="d-flex flex-wrap gap-1 mt-1">' + btns + '</div>';
    return html;
  }

  /** Cell "Kế hoạch" (mọi bảng dòng chi phí): số cont dòng trên, ngày kế hoạch dòng dưới. Không có ngày kế hoạch
   *  (dòng đổ dầu) thì hiện nhãn nguồn (ke_hoach_label). */
  function planCellHtml(l) {
    var ngay = toView(String(l.ngay_ke_hoach || '').slice(0, 10)) || esc(l.ke_hoach_label || '');
    if (l.so_cont) return '<div>' + esc(l.so_cont) + '</div><div class="small text-muted">' + ngay + '</div>';
    return ngay;
  }

  /**
   * Bảng GỘP các dòng chi phí của 1 đề nghị: 1 bảng duy nhất, có dòng phân cách riêng cho từng hoá đơn
   * (đề nghị giờ có thể gồm nhiều hoá đơn của nhiều NCC — xem docblock server). Dùng cho dòng mở rộng ở
   * danh sách và modal chi tiết (chỉ xem); modal Tạo/Sửa dùng bảng chọn dòng riêng, xem createRowHtml().
   */
  function groupedLinesTableHtml(lines, opts) {
    opts = opts || {};
    var groups = groupLinesByHoaDon(lines);
    var html = '<table class="table table-sm table-bordered dn-lines mb-0"><thead><tr>' +
      '<th style="width:130px;">NCC</th><th>Kế hoạch</th><th>Tên chi phí</th><th style="width:50px;">Loại</th>' +
      '<th class="text-end">Đơn giá</th><th class="text-end" style="width:50px;">SL</th><th class="text-end">Trước VAT</th><th class="text-end" style="width:60px;">VAT%</th>' +
      '<th class="text-end">Sau VAT</th><th>Ghi chú</th></tr></thead><tbody>';
    if (!lines.length) {
      html += '<tr><td colspan="10" class="text-center text-muted">Chưa có dòng chi phí</td></tr>';
    }
    for (var g = 0; g < groups.length; g++) {
      var grp = groups[g];
      var hdText = grp.so_hoa_don ? ('Hoá đơn: ' + esc(grp.so_hoa_don) + (grp.ngay_hoa_don ? ' · ' + esc(toView(grp.ngay_hoa_don)) : '')) : 'Chưa có số hoá đơn';
      html += '<tr class="dn-hdrow"><td colspan="10"><i class="ti tabler-file-invoice me-1"></i>' + hdText +
        '<span class="dn-hdrow-count">(' + grp.lines.length + ' dòng)</span><span class="dn-hdrow-sum">' + money(grp.sau) + ' đ</span></td></tr>';
      for (var i = 0; i < grp.lines.length; i++) {
        var l = grp.lines[i];
        var tagCls = l.loai_chi_phi === 'do_dau' ? 'dd' : (l.loai_chi_phi === 'tinh_cho_khach' ? 'kh' : 'ct');
        var tagTxt = l.loai_chi_phi === 'do_dau' ? 'ĐD' : (l.loai_chi_phi === 'tinh_cho_khach' ? 'KH' : 'CT');
        html += '<tr><td>' + esc(l.ncc_ten || '—') + '</td><td>' + planCellHtml(l) + '</td><td>' + esc(l.ten_chi_phi) + '</td><td><span class="dn-tag ' + tagCls + '">' +
          tagTxt + '</span></td><td class="text-end">' + money(l.don_gia) + '</td><td class="text-end">' + esc(l.so_luong) +
          '</td><td class="text-end">' + money(l.tong_truoc_vat) + '</td><td class="text-end">' + esc(l.vat_percent) + '</td><td class="text-end fw-semibold">' + money(l.tong_sau_vat) +
          '</td><td class="text-muted">' + esc(l.ghi_chu) + '</td></tr>';
      }
    }
    html += '</tbody>';
    if (opts.totals) {
      html += '<tfoot><tr class="table-light"><td colspan="6" class="text-end fw-semibold">Tổng</td><td class="text-end fw-semibold">' + money(opts.totals.truoc) +
        '</td><td class="text-end">' + money(opts.totals.vat) + '</td><td class="text-end fw-semibold">' + money(opts.totals.sau) + '</td><td></td></tr></tfoot>';
    }
    return html + '</table>';
  }

  /* ─────────── Mở rộng dòng: chi phí của đề nghị ─────────── */

  function expandHtml(d) {
    var lines = d.dong_chi_phi || [];
    var html = '<div class="dn-expand-wrap"><div class="dn-expand-title"><i class="ti tabler-list-details me-1"></i>' +
      (isDoDau(d) ? 'Phiếu đổ dầu trong đề nghị' : 'Hoá đơn / chi phí trong đề nghị') + ' (' + lines.length + ' dòng · ' + (d.so_hoa_don_count || 0) + ' hoá đơn)</div>' +
      groupedLinesTableHtml(lines, { totals: { truoc: d.tong_truoc_vat, vat: d.tong_vat, sau: d.tong_sau_vat } }) + '</div>';
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
        '<td>' + payeeCell(it) + '</td>' +
        '<td>' + hoaDonChipsHtml(it) + '</td>' +
        '<td>' + sourceCell(it) + '</td>' +
        '<td class="text-end">' + money(it.tong_truoc_vat) + '</td>' +
        '<td class="text-end">' + money(it.tong_vat) + '</td>' +
        '<td class="text-end fw-semibold">' + money(it.tong_sau_vat) + '</td>' +
        '<td class="text-end"><div class="text-success">' + money(it.da_thanh_toan) + '</div><div class="small text-danger">' + money(it.con_lai) + '</div></td>' +
        '<td>' + hanTtHtml(it) + '<div class="mt-1">' + hinhThucTag(it.hinh_thuc_tt) + '</div></td>' +
        '<td>' + statusCellHtml(it) + '</td>' +
        '</tr>';
    }
    $('#dn-tbody').html(html);
  }

  // Phân trang giống màn /ke-hoach-xep-xe và /theo-doi-do-dau: về đầu, lùi, số trang (±2, có "..."), tiến, về cuối, ô nhập trang.
  function renderPagination(d) {
    var total = d.total_pages || 0;
    var current = d.current_page || 0;
    $('#dn-pagination').show();
    $('#dn-pagination-info').text('Tổng số: ' + (d.total || 0) + ' bản ghi');
    $('#dn-pagination-total-pages').text('/ ' + total);
    $('#dn-pagination-jump').val(current).attr('data-total-pages', total);
    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    if (start > 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }
    if (end < total) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';
    $('#dn-pagination ul.pagination').html(html);
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
    call('POST', API + '/' + ctx.id + '/' + ctx.key, { ly_do: reason }, function (data) {
      $('#dn-reject-confirm').removeAttr('disabled');
      modalOf('dn-reject-modal').hide();
      toast(data && data.phieu_do_dau_tu_choi ? 'Đã từ chối: đề nghị bị huỷ và phiếu đổ dầu quay về Từ chối.' : 'Đã cập nhật đề nghị.');
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
      var to = item.ben_nhan_tien ? item.ben_nhan_tien.ten : '';
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
    var payee = esc(b.ten) + (PAYEE_SHORT[b.loai] ? ' <span class="dn-payee dn-payee-' + b.loai + '">' + PAYEE_SHORT[b.loai] + '</span>' : '');
    var han = d.han_thanh_toan ? esc(toView(d.han_thanh_toan)) + (d.qua_han_ngay > 0 ? ' <span class="text-danger fw-semibold">(quá hạn ' + d.qua_han_ngay + ' ngày)</span>' : '') : 'Chưa đặt';
    var hdChips = hoaDonChipsHtml(d);
    var html = '';
    if ((d.trang_thai === 'tu_choi' || d.trang_thai === 'tu_choi_thanh_toan') && d.ly_do_tu_choi) {
      html += '<div class="alert alert-danger py-2"><strong>Lý do từ chối:</strong> ' + esc(d.ly_do_tu_choi) + '</div>';
    }
    html += '<div class="row g-3">' +
      field('Bên nhận tiền', payee) + ('<div class="col-md-6"><div class="dn-info-label">Hoá đơn liên quan (' + (d.so_hoa_don_count || 0) + ')</div><div class="dn-info-value">' + hdChips + '</div></div>') +
      field('Hạn thanh toán', han) + field('Hình thức thanh toán', esc(HINH_THUC_LABEL[d.hinh_thuc_tt] || 'Chưa chọn')) +
      field('Người tạo', esc(d.nguoi_tao)) + field('Ngày tạo', esc(toView(d.created))) + field('Nguồn', esc(d.nguon_label || 'Chi phí kế hoạch')) +
      '<div class="col-md-9"><div class="dn-info-label">Ghi chú</div><div class="dn-info-value">' + (d.ghi_chu ? esc(d.ghi_chu) : '—') + '</div></div></div>';

    html += '<div class="fw-semibold mt-4 mb-2">' + (isDoDau(d) ? 'Phiếu đổ dầu trong đề nghị' : 'Các hoá đơn / dòng chi phí trong đề nghị') + ' (' + d.so_dong + ' dòng)</div>' +
      '<div class="table-responsive">' + groupedLinesTableHtml(d.dong_chi_phi || [], { totals: { truoc: d.tong_truoc_vat, vat: d.tong_vat, sau: d.tong_sau_vat } }) + '</div>';

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

  // focusInList: mở từ ngoài màn (link "Xem" ở tab Chi phí kế hoạch) — lọc danh sách nền theo đúng mã đề nghị (trang 1,
  // tab "Tất cả") để khi đóng modal, dòng chắc chắn có trên màn hình cho applyTouchedRow() nổi bật, dù đề nghị đang ở
  // trang/tab nào theo bộ lọc mặc định.
  function openView(id, keepOpen, focusInList) {
    state.viewId = id;
    markTouched(id);
    $('#dn-view-loading').show();
    if (!keepOpen) { $('#dn-view-body').html(''); modalOf('dn-view-modal').show(); }
    call('GET', API + '/' + id, null, function (d) {
      renderDetail(d);
      $('#dn-view-loading').hide();
      if (focusInList && d && d.ma_de_nghi) {
        $('#dn-f-q').val(d.ma_de_nghi);
        state.filters.keyword = d.ma_de_nghi;
        state.page = 1;
        loadList();
      }
    }, function (jqXHR) {
      $('#dn-view-loading').hide();
      toast(apiMsg(jqXHR), false);
    });
  }

  /* ─────────── Bên nhận tiền (dùng chung cho modal Tạo/Sửa đề nghị — xem phần "Tạo đề nghị" bên dưới) ─────────── */

  // Tên kèm số điện thoại nếu có: "Nguyễn Văn A (0123456789)"; không có thì chỉ tên.
  function payeeLabel(x) { return x.ten + (x.sdt ? ' (' + x.sdt + ')' : ''); }

  // Bên nhận tiền giờ là khoá gộp bắt buộc của đề nghị (không còn khái niệm "trùng bên phát hành" để loại trừ 1 NCC
  // khỏi danh sách) — liệt kê đủ Nhân viên + mọi Nhà cung cấp.
  // Nhóm theo cùng thứ tự với popup "Bên nhận tiền" ở tab Chi phí hàng cảng: Nhân viên → Nhà cung cấp → Lái xe.
  function payeeSelectHtml(current) {
    var html = '<option value=""></option>';
    var staff = (state.options && state.options.nhan_vien) || [];
    var nccs = (state.options && state.options.ncc) || [];
    var drivers = (state.options && state.options.lai_xe_ds) || [];
    var hasStaff = false, hasDriver = false, i;
    html += '<optgroup label="Nhân viên">';
    for (i = 0; i < staff.length; i++) {
      html += '<option value="nhan_vien|' + staff[i].uid + '">' + esc(payeeLabel(staff[i])) + '</option>';
      if (current && current.loai === 'nhan_vien' && staff[i].uid === current.id) hasStaff = true;
    }
    // Bên nhận đã lưu là tài khoản không còn trong danh sách nhân viên (vd tài khoản lái xe): giữ lại để ô không trống khi sửa.
    if (current && current.loai === 'nhan_vien' && !hasStaff) {
      html += '<option value="nhan_vien|' + current.id + '">' + esc(current.ten) + '</option>';
    }
    html += '</optgroup><optgroup label="Nhà cung cấp">';
    for (i = 0; i < nccs.length; i++) html += '<option value="ncc|' + nccs[i].nid + '">' + esc(payeeLabel(nccs[i])) + '</option>';
    html += '</optgroup><optgroup label="Lái xe">';
    for (i = 0; i < drivers.length; i++) {
      html += '<option value="lai_xe|' + drivers[i].nid + '">' + esc(payeeLabel(drivers[i])) + '</option>';
      if (current && current.loai === 'lai_xe' && drivers[i].nid === current.id) hasDriver = true;
    }
    if (current && current.loai === 'lai_xe' && !hasDriver) {
      html += '<option value="lai_xe|' + current.id + '">' + esc(current.ten) + '</option>';
    }
    html += '</optgroup>';
    return html;
  }

  // Select2 chuẩn (SELECT2_PATTERN.md): tìm kiếm được, nhóm theo optgroup.
  function initPayeeSelect(optionsHtml, selId, modalId) {
    selId = selId || '#dn-create-payee';
    modalId = modalId || '#dn-create-modal';
    var $p = $(selId);
    if ($p.data('select2')) $p.select2('destroy');
    $p.html(optionsHtml);
    if (!$.fn.select2) return;
    $p.select2({ placeholder: 'Chọn bên nhận tiền…', allowClear: false, width: '100%', dropdownParent: $(modalId) });
    $p.unbind('select2:open.dnFocus').bind('select2:open.dnFocus', function () {
      window.setTimeout(function () {
        var search = document.querySelector('.select2-container--open .select2-search__field');
        if (search) search.focus();
      }, 0);
    });
  }

  function hasAction(d, key) {
    var list = d.hanh_dong || [];
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return true;
    return false;
  }

  /* ─────────── Tạo / Sửa đề nghị (1 modal dùng chung — chọn bên nhận tiền trước, gom theo hoá đơn,
   * sửa trực tiếp trên bảng chọn dòng; Sửa chỉ khác Tạo ở chỗ nạp sẵn dòng/bên nhận/hạn TT hiện có
   * và PUT thay vì POST) ─────────── */

  var CP_API = '/api/ke-hoach-chi-phi';
  var createState = { rows: {}, selected: {}, edits: {}, mode: 'create', editId: 0, ownLines: [], suppressPayeeChange: false };
  var suppressLineEditChange = false;

  // Dòng chi phí sau khi áp mọi lần sửa tại chỗ (so_hoa_don/ngay_hoa_don/ghi_chu) — createState.edits[nid]
  // luôn là BẢN SAO ĐẦY ĐỦ (không phải diff) nên dùng thẳng, không cần merge lại với bản gốc.
  function createEffectiveLine(item) {
    return (item && createState.edits[item.nid]) || item;
  }

  function setCreateEdit(nid, field, val) {
    var base = createState.edits[nid] || $.extend({}, createState.rows[nid]);
    var next = $.extend({}, base);
    next[field] = val;
    // Đơn giá/SL/VAT đổi thì tính lại Trước VAT/Sau VAT ngay tại chỗ (giống công thức server
    // _de_nghi_thanh_toan_apply_line_edits: truoc = round(don_gia*so_luong), sau = round(truoc*(1+vat/100))).
    if (field === 'don_gia' || field === 'so_luong' || field === 'vat_percent') {
      var truoc = Math.round((Number(next.don_gia) || 0) * (Number(next.so_luong) || 0));
      next.tong_truoc_vat = truoc;
      next.tong_sau_vat = Math.round(truoc * (1 + (Number(next.vat_percent) || 0) / 100));
    }
    createState.edits[nid] = next;
  }

  // 1 -> "1", 1.5 -> "1.5", 1.50 -> "1.5" (bỏ số 0 thừa, giữ dấu chấm thập phân khi cần).
  function formatQty(v) {
    var n = parseFloat(v);
    if (isNaN(n)) return '0';
    return String(Math.round(n * 100) / 100);
  }

  // Định dạng số tiền ngay khi gõ (giữ nguyên vị trí caret) — cùng cách làm với ô .money-input trong tab
  // Chi phí kế hoạch hàng cảng (formatMoneyInputKeepingCaret ở ke_hoach_chi_phi.js), chỉ đổi formatter
  // sang money() sẵn có ở file này (cùng cho ra dạng "400.000").
  function formatMoneyKeepCaret(input) {
    var raw = String(input.value || '');
    var caret = typeof input.selectionStart === 'number' ? input.selectionStart : raw.length;
    var digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
    var d = raw.replace(/\D/g, '');
    if (!d) { input.value = ''; return; }
    input.value = money(d);
    var nextCaret = input.value.length, seen = 0;
    for (var i = 0; i < input.value.length; i++) {
      if (/\d/.test(input.value.charAt(i))) {
        seen++;
        if (seen >= digitsBeforeCaret) { nextCaret = i + 1; break; }
      }
    }
    try { input.setSelectionRange(nextCaret, nextCaret); } catch (e) {}
  }

  function createRowsArray() {
    var out = [];
    for (var nid in createState.rows) { if (createState.rows.hasOwnProperty(nid)) out.push(createState.rows[nid]); }
    return out;
  }

  // Danh sách tên chi phí gợi ý cho select2 "Tên chi phí" trong bảng chọn dòng: gom từ chính các dòng
  // đang tải (đủ dùng cho việc sửa/chuẩn hoá tên, không cần thêm API riêng); tags:true vẫn cho gõ tên mới.
  function distinctExpenseNames() {
    var seen = {}, out = [];
    for (var nid in createState.rows) {
      if (!createState.rows.hasOwnProperty(nid)) continue;
      var name = $.trim((createState.rows[nid] && createState.rows[nid].ten_chi_phi) || '');
      if (name && !seen[name]) { seen[name] = true; out.push(name); }
    }
    out.sort(function (a, b) { return a.localeCompare(b, 'vi'); });
    return out;
  }

  function expenseSelectOptionsHtml(current, names) {
    var html = '<option value=""></option>';
    var hasCurrent = !current;
    for (var i = 0; i < names.length; i++) {
      html += '<option value="' + esc(names[i]) + '"' + (names[i] === current ? ' selected' : '') + '>' + esc(names[i]) + '</option>';
      if (names[i] === current) hasCurrent = true;
    }
    if (current && !hasCurrent) html += '<option value="' + esc(current) + '" selected>' + esc(current) + '</option>';
    return html;
  }

  function createRowHtml(l, names) {
    var tagCls = l.loai_chi_phi === 'tinh_cho_khach' ? 'kh' : 'ct';
    var tagTxt = l.loai_chi_phi === 'tinh_cho_khach' ? 'KH' : 'CT';
    var checked = !!createState.selected[l.nid];
    return '<tr class="dn-create-row" data-nid="' + l.nid + '">' +
      '<td class="text-center"><input type="checkbox" class="dn-create-check" data-nid="' + l.nid + '"' + (checked ? ' checked' : '') + '></td>' +
      '<td>' + esc(l.ncc_ten || '—') + '</td>' +
      '<td>' + planCellHtml(l) + '</td>' +
      '<td><select class="form-select form-select-sm dn-create-edit dn-name-select" data-nid="' + l.nid + '" data-field="ten_chi_phi">' + expenseSelectOptionsHtml(l.ten_chi_phi, names) + '</select></td>' +
      '<td><span class="dn-tag ' + tagCls + '">' + tagTxt + '</span></td>' +
      '<td><input type="text" inputmode="decimal" class="form-control form-control-sm row-field money-input dn-create-edit" data-nid="' + l.nid + '" data-field="don_gia" value="' + (Number(l.don_gia) ? money(l.don_gia) : '') + '" placeholder="0"></td>' +
      '<td><input type="text" inputmode="decimal" class="form-control form-control-sm row-field decimal-input dn-create-edit" data-nid="' + l.nid + '" data-field="so_luong" value="' + esc(formatQty(l.so_luong)) + '"></td>' +
      '<td><input type="text" inputmode="decimal" class="form-control form-control-sm row-field decimal-input dn-create-edit" data-nid="' + l.nid + '" data-field="vat_percent" value="' + (Number(l.vat_percent) ? esc(formatQty(l.vat_percent)) : '') + '" placeholder="0"></td>' +
      '<td class="text-end fw-semibold">' + money(l.tong_sau_vat) + '</td>' +
      '<td><input type="text" class="form-control form-control-sm row-field dn-create-edit" data-nid="' + l.nid + '" data-field="ghi_chu" value="' + esc(l.ghi_chu || '') + '" placeholder="Ghi chú"></td>' +
      '<td><input type="text" class="form-control form-control-sm row-field dn-create-edit" data-nid="' + l.nid + '" data-field="so_hoa_don" placeholder="Chưa có" value="' + esc(l.so_hoa_don || '') + '"></td>' +
      '<td><input type="text" class="form-control form-control-sm row-field dn-create-edit dn-hd-date" autocomplete="off" data-nid="' + l.nid + '" data-field="ngay_hoa_don" placeholder="dd/mm/yyyy" value="' + esc(toView(l.ngay_hoa_don)) + '"></td>' +
      '</tr>';
  }

  function createGroupHeaderHtml(grp) {
    var ids = $.map(grp.lines, function (l) { return l.nid; });
    var uncheckedCount = $.grep(ids, function (id) { return !createState.selected[id]; }).length;
    var hdText = grp.so_hoa_don ? ('Hoá đơn: ' + esc(grp.so_hoa_don) + (grp.ngay_hoa_don ? ' · ' + esc(toView(grp.ngay_hoa_don)) : '')) : 'Chưa có số hoá đơn';
    return '<tr class="dn-hdrow"><td colspan="12"><label style="cursor:pointer;display:flex;align-items:center;gap:6px;margin:0;">' +
      '<input type="checkbox" class="dn-create-group-check" data-ids="' + ids.join(',') + '"' + (uncheckedCount === 0 ? ' checked' : '') + '>' +
      '<i class="ti tabler-file-invoice"></i>' + hdText + '<span class="dn-hdrow-count">(' + grp.lines.length + ' dòng)</span><span class="dn-hdrow-sum">' + money(grp.sau) + ' đ</span></label></td></tr>';
  }

  function updateCreateSummary() {
    var count = 0, sum = 0;
    for (var nid in createState.selected) {
      if (createState.selected.hasOwnProperty(nid) && createState.selected[nid] && createState.rows[nid]) {
        count++;
        sum += Number(createEffectiveLine(createState.rows[nid]).tong_sau_vat) || 0;
      }
    }
    $('#dn-create-count').text(count);
    $('#dn-create-total').text(money(sum) + ' đ');
  }

  // Từ 2 dòng đã tick trở lên cùng 1 NCC mà còn thiếu số hoá đơn: hiện thanh gán nhanh riêng cho NCC đó
  // (không gộp chung mọi NCC vào 1 ô vì 1 hoá đơn chỉ thuộc đúng 1 NCC).
  function updateCreateBulkBar() {
    var byNcc = {};
    for (var nid in createState.selected) {
      if (!createState.selected.hasOwnProperty(nid) || !createState.selected[nid] || !createState.rows[nid]) continue;
      var eff = createEffectiveLine(createState.rows[nid]);
      if (eff.so_hoa_don) continue;
      var key = eff.nid_ncc || 0;
      if (!byNcc[key]) byNcc[key] = { ncc_ten: eff.ncc_ten || '—', ids: [] };
      byNcc[key].ids.push(parseInt(nid, 10));
    }
    var html = '';
    for (var k in byNcc) {
      if (!byNcc.hasOwnProperty(k) || byNcc[k].ids.length < 2) continue;
      var grp = byNcc[k];
      html += '<div class="dn-bulk-hd">' +
        '<i class="ti tabler-bolt text-warning"></i>' +
        '<span class="txt">' + grp.ids.length + ' dòng đã tick của <strong>' + esc(grp.ncc_ten) + '</strong> chưa có số hoá đơn — gán chung 1 lần:</span>' +
        '<input type="text" class="form-control form-control-sm row-field dn-bulk-so" placeholder="Số hoá đơn">' +
        '<input type="text" class="form-control form-control-sm row-field dn-bulk-ngay" autocomplete="off" placeholder="dd/mm/yyyy">' +
        '<button type="button" class="btn btn-sm btn-warning dn-bulk-apply" data-ids="' + grp.ids.join(',') + '"><i class="ti tabler-check me-1"></i>Áp dụng cho ' + grp.ids.length + ' dòng</button>' +
        '</div>';
    }
    $('#dn-create-bulk').html(html);
    // Ô ngày của thanh gán nhanh dùng cùng flatpickr với cột Ngày HĐ trong bảng (vẽ lại mỗi lần tick nên phải khởi tạo lại).
    if (typeof flatpickr !== 'undefined') {
      $('#dn-create-bulk .dn-bulk-ngay').each(function () {
        flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, appendTo: document.body });
      });
    }
  }

  function renderCreateLines(items) {
    var lines = $.map(items, function (it) { return createEffectiveLine(it); });
    var groups = groupLinesByHoaDon(lines);
    var names = distinctExpenseNames();
    var html = '';
    for (var g = 0; g < groups.length; g++) {
      html += createGroupHeaderHtml(groups[g]);
      for (var i = 0; i < groups[g].lines.length; i++) html += createRowHtml(groups[g].lines[i], names);
    }
    $('#dn-create-lines').html(html);
    initCreateRowWidgets();
    var hasPayee = !!$('#dn-create-payee').val();
    $('#dn-create-table-wrap').toggleClass('d-none', !lines.length);
    if (!hasPayee) {
      $('#dn-create-empty').removeClass('d-none').text('Chọn bên nhận tiền để hiện các dòng chi phí khả dụng.');
    } else if (!lines.length) {
      $('#dn-create-empty').removeClass('d-none').text('Bên nhận tiền này hiện không có dòng chi phí nào đang chờ gộp (thử bỏ bớt bộ lọc).');
    } else {
      $('#dn-create-empty').addClass('d-none');
    }
    updateCreateBulkBar();
    updateCreateSummary();
  }

  // Select2 (tên chi phí) + flatpickr (ngày hoá đơn) cho các ô trong bảng — bảng được vẽ lại toàn bộ mỗi
  // lần sửa 1 ô (giống các cột khác), nên phải khởi tạo lại 2 plugin này sau mỗi lần render.
  function initCreateRowWidgets() {
    if ($.fn && $.fn.select2) {
      $('#dn-create-lines .dn-name-select').each(function () {
        var $s = $(this);
        if ($s.data('select2')) $s.select2('destroy');
        $s.select2({ placeholder: 'Tên chi phí', tags: true, allowClear: true, width: '100%', dropdownParent: $('#dn-create-modal') });
      });
    }
    if (typeof flatpickr !== 'undefined') {
      // appendTo body (không static:true): trong bảng cuộn ngang/dọc của modal, static:true đặt lịch
      // position:absolute NGAY TRONG bảng nên bị overflow của .table-responsive/.modal-body cắt mất.
      $('#dn-create-lines .dn-hd-date').each(function () {
        flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, appendTo: document.body });
      });
    }
  }

  // Đề nghị đang sửa: dòng đã gộp sẵn (nid_de_nghi_chi_phi = đề nghị này) bị chua_gop=1 loại khỏi bể chọn
  // phía dưới, nên phải gộp thủ công vào items để vẫn thấy/được bỏ tick — không trùng nid với bể chọn
  // (chua_gop=1 chỉ trả dòng CHƯA thuộc đề nghị nào).
  function mergeOwnLines(items) {
    if (createState.mode !== 'edit' || !createState.ownLines.length) return items;
    var ownIds = {};
    for (var i = 0; i < createState.ownLines.length; i++) ownIds[createState.ownLines[i].nid] = true;
    var pool = $.grep(items, function (it) { return !ownIds[it.nid]; });
    return createState.ownLines.concat(pool);
  }

  function finishCreateLines(items) {
    $('#dn-create-loading').hide();
    items = mergeOwnLines(items);
    // Dòng đã tick mà không khớp bộ lọc mới (tên/cont/số HĐ/ngày) vẫn giữ lại trong bảng và giữ tick — lọc chỉ để
    // tìm thêm dòng, không làm mất dòng đã chọn. Đổi bên nhận tiền thì handler riêng đã xoá hết tick trước khi tải.
    var seen = {}, i, nid;
    for (i = 0; i < items.length; i++) seen[items[i].nid] = true;
    for (nid in createState.selected) {
      if (createState.selected.hasOwnProperty(nid) && !seen[nid] && createState.rows[nid]) items.push(createState.rows[nid]);
    }
    createState.rows = {};
    for (i = 0; i < items.length; i++) createState.rows[items[i].nid] = items[i];
    for (nid in createState.selected) {
      if (createState.selected.hasOwnProperty(nid) && !createState.rows[nid]) delete createState.selected[nid];
    }
    renderCreateLines(items);
  }

  // Đọc khoảng ngày đã áp dụng từ daterangepicker (Y-m-d cho API) — input để trống = không lọc ngày.
  function readCreateDateRange() {
    var $range = $('#dn-create-daterange');
    var picker = $range.data('daterangepicker');
    if (!$range.val() || !picker) return { tu: '', den: '' };
    return { tu: picker.startDate.format('YYYY-MM-DD'), den: picker.endDate.format('YYYY-MM-DD') };
  }

  // Tải hết các trang (mỗi lần tối đa 100 dòng, cùng quy ước với các dropdown dùng chung khác trong dự án).
  function fetchCreateLines() {
    var payee = $('#dn-create-payee').val();
    if (!payee) { createState.rows = {}; renderCreateLines([]); return; }
    var params = { ben_nhan_tien: payee, chua_gop: 1, gop_duoc: 1, limit: 100, page: 1 };
    var kw = $.trim($('#dn-create-q').val());
    if (kw) params.keyword = kw;
    var cont = $.trim($('#dn-create-cont').val());
    if (cont) params.so_cont = cont;
    var soHd = $.trim($('#dn-create-so-hd').val());
    if (soHd) params.so_hoa_don = soHd;
    var range = readCreateDateRange();
    if (range.tu) params.tu_ngay = range.tu;
    if (range.den) params.den_ngay = range.den;
    $('#dn-create-loading').show();
    $.ajax({
      url: CP_API, type: 'GET', dataType: 'json', data: params,
      success: function (res) {
        var d = (res && res.data) || {};
        var items = d.items || [];
        var totalPages = Math.min(d.total_pages || 1, 50);
        if (totalPages <= 1) { finishCreateLines(items); return; }
        var pending = totalPages - 1, more = [];
        for (var p = 2; p <= totalPages; p++) {
          (function (page) {
            $.ajax({
              url: CP_API, type: 'GET', dataType: 'json', data: $.extend({}, params, { page: page }),
              success: function (r2) { more = more.concat((r2 && r2.data && r2.data.items) || []); },
              complete: function () { pending--; if (pending <= 0) finishCreateLines(items.concat(more)); }
            });
          })(p);
        }
      },
      error: function (jqXHR) { $('#dn-create-loading').hide(); toast(apiMsg(jqXHR), false); }
    });
  }

  function resetCreateState() {
    createState = { rows: {}, selected: {}, edits: {}, mode: 'create', editId: 0, ownLines: [], suppressPayeeChange: false };
  }

  // Vietnamese locale + 3 nút chọn nhanh, giống hệt khoảng ngày ở bộ lọc /ke-hoach-xep-xe (#filter-date-range).
  function initCreateDateRange() {
    var $range = $('#dn-create-daterange');
    if (!$range.length || $range.data('daterangepicker') || typeof $.fn.daterangepicker !== 'function' || typeof moment === 'undefined') return;
    $range.daterangepicker({
      autoUpdateInput: false,
      autoApply: true,
      showDropdowns: true,
      opens: 'center',
      locale: {
        format: 'DD/MM/YYYY', separator: ' đến ', applyLabel: 'Áp dụng', cancelLabel: 'Xóa', customRangeLabel: 'Tùy chọn',
        daysOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        firstDay: 1
      }
    });
    var picker = $range.data('daterangepicker');
    if (picker && picker.container) picker.container.addClass('dn-create-daterangepicker');
    $range.on('apply.daterangepicker', function (e, p) {
      $(this).val(p.startDate.format('DD/MM/YYYY') + ' đến ' + p.endDate.format('DD/MM/YYYY'));
      fetchCreateLines();
    }).on('cancel.daterangepicker', function () {
      $(this).val('');
      fetchCreateLines();
    }).on('show.daterangepicker', function (e, p) {
      var $footer = p.container.find('.drp-buttons');
      if (!$footer.length) return;
      $footer.find('.dn-create-date-quick').remove();
      $footer.find('.drp-selected, .applyBtn').hide();
      $footer.find('.cancelBtn').show();
      var $shortcuts = $('<span class="dn-create-date-quick"></span>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-dn-date-quick="today">Hôm nay</button>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-dn-date-quick="week">Tuần này</button>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-dn-date-quick="month">Tháng này</button>');
      $footer.prepend($shortcuts);
      $footer.off('click.dnDateQuick', '[data-dn-date-quick]').on('click.dnDateQuick', '[data-dn-date-quick]', function () {
        var action = $(this).attr('data-dn-date-quick');
        var end = moment().startOf('day');
        var start = end.clone();
        if (action === 'week') { start = end.clone().startOf('isoWeek'); end = end.clone().endOf('isoWeek').startOf('day'); }
        else if (action === 'month') { start = end.clone().startOf('month'); end = end.clone().endOf('month').startOf('day'); }
        p.setStartDate(start);
        p.setEndDate(end);
        $range.val(start.format('DD/MM/YYYY') + ' đến ' + end.format('DD/MM/YYYY'));
        p.hide();
        fetchCreateLines();
      });
    });
  }

  function clearCreateDateRange() {
    var $range = $('#dn-create-daterange');
    var picker = $range.data('daterangepicker');
    $range.val('');
    if (picker) { picker.setStartDate(moment().startOf('day')); picker.setEndDate(moment().endOf('day')); }
  }

  function setCreateModalMode(mode) {
    if (mode === 'edit') {
      $('#dn-create-modal-title').text('Sửa đề nghị thanh toán');
      $('#dn-create-alert-hint').addClass('d-none');
      $('#dn-create-save').html('<i class="ti tabler-device-floppy me-1"></i>Lưu');
      $('#dn-create-save-send').html('<i class="ti tabler-send me-1"></i>Lưu & gửi duyệt');
    } else {
      $('#dn-create-modal-title').text('Tạo đề nghị thanh toán');
      $('#dn-create-modal-ma').addClass('d-none').text('');
      $('#dn-create-reject').addClass('d-none').html('');
      $('#dn-create-alert-hint').removeClass('d-none');
      $('#dn-create-save').html('<i class="ti tabler-device-floppy me-1"></i>Lưu nháp');
      $('#dn-create-save-send').html('<i class="ti tabler-send me-1"></i>Gửi duyệt').show();
    }
  }

  function openCreate() {
    resetCreateState();
    setCreateModalMode('create');
    $('#dn-create-q, #dn-create-cont, #dn-create-so-hd, #dn-create-han-tt, #dn-create-ghi-chu').val('');
    $('.dn-create-filter').data('dnLast', '');
    clearCreateDateRange();
    $('#dn-create-ht').val('');
    $('#dn-create-lines').html('');
    $('#dn-create-table-wrap').addClass('d-none');
    $('#dn-create-empty').removeClass('d-none').text('Chọn bên nhận tiền để hiện các dòng chi phí khả dụng.');
    $('#dn-create-bulk').html('');
    $('#dn-create-payee').removeClass('is-invalid');
    updateCreateSummary();
    modalOf('dn-create-modal').show();
    loadOptions(function () {
      initPayeeSelect(payeeSelectHtml(null), '#dn-create-payee', '#dn-create-modal');
    });
  }

  // Sửa dùng lại nguyên modal/bảng chọn dòng của Tạo: nạp sẵn bên nhận tiền + hạn TT/hình thức/ghi chú +
  // các dòng đã thuộc đề nghị (tự tick sẵn), cho tick thêm/bỏ tick như Tạo rồi PUT thay vì POST khi lưu.
  function openEdit(id) {
    resetCreateState();
    createState.mode = 'edit';
    createState.editId = id;
    setCreateModalMode('edit');
    $('#dn-create-q, #dn-create-cont, #dn-create-so-hd, #dn-create-han-tt, #dn-create-ghi-chu').val('');
    $('.dn-create-filter').data('dnLast', '');
    clearCreateDateRange();
    $('#dn-create-ht').val('');
    $('#dn-create-lines').html('');
    $('#dn-create-table-wrap').addClass('d-none');
    $('#dn-create-empty').removeClass('d-none').text('Đang tải…');
    $('#dn-create-bulk').html('');
    $('#dn-create-payee').removeClass('is-invalid');
    $('#dn-create-loading').show();
    modalOf('dn-create-modal').show();
    loadOptions(function () {
      call('GET', API + '/' + id, null, function (d) {
        $('#dn-create-modal-ma').removeClass('d-none').text(d.ma_de_nghi);
        $('#dn-create-han-tt').val(toView(d.han_thanh_toan));
        $('#dn-create-ht').val(d.hinh_thuc_tt);
        $('#dn-create-ghi-chu').val(d.ghi_chu);
        var b = d.ben_nhan_tien || {};
        initPayeeSelect(payeeSelectHtml(b), '#dn-create-payee', '#dn-create-modal');
        createState.suppressPayeeChange = true;
        $('#dn-create-payee').val(b.loai + '|' + b.id).trigger('change');
        createState.suppressPayeeChange = false;
        $('#dn-create-payee').removeClass('is-invalid');
        if (d.ly_do_tu_choi && (d.trang_thai === 'tu_choi' || d.trang_thai === 'tu_choi_thanh_toan')) {
          $('#dn-create-reject').removeClass('d-none').html('<strong>Lý do từ chối:</strong> ' + esc(d.ly_do_tu_choi));
        } else {
          $('#dn-create-reject').addClass('d-none');
        }
        createState.ownLines = d.dong_chi_phi || [];
        for (var i = 0; i < createState.ownLines.length; i++) createState.selected[createState.ownLines[i].nid] = true;
        $('#dn-create-save-send').toggle((d.hanh_dong || []).length > 0 && hasAction(d, 'gui-duyet'));
        fetchCreateLines();
      }, function (jqXHR) {
        $('#dn-create-loading').hide();
        toast(apiMsg(jqXHR), false);
      });
    });
  }

  function buildCreateEdits() {
    var out = {};
    for (var nid in createState.edits) {
      if (!createState.edits.hasOwnProperty(nid) || !createState.selected[nid]) continue;
      var eff = createState.edits[nid];
      out[nid] = {
        ten_chi_phi: eff.ten_chi_phi,
        don_gia: eff.don_gia,
        so_luong: eff.so_luong,
        vat_percent: eff.vat_percent,
        ghi_chu: eff.ghi_chu || '',
        so_hoa_don: eff.so_hoa_don || '',
        ngay_hoa_don: eff.ngay_hoa_don || ''
      };
    }
    return out;
  }

  function submitCreate(andSend) {
    var payee = $('#dn-create-payee').val();
    if (!payee) { $('#dn-create-payee').addClass('is-invalid'); return; }
    $('#dn-create-payee').removeClass('is-invalid');
    var ids = [];
    for (var nid in createState.selected) { if (createState.selected.hasOwnProperty(nid) && createState.selected[nid]) ids.push(parseInt(nid, 10)); }
    if (!ids.length) { toast('Vui lòng chọn ít nhất 1 dòng chi phí.', false); return; }
    var han = toApi($('#dn-create-han-tt').val());
    if (han === null) { toast('Hạn thanh toán phải có dạng dd/mm/yyyy.', false); return; }
    var i = payee.indexOf('|');
    var body = {
      chi_phi_ids: ids,
      loai_ben_nhan_tien: payee.slice(0, i),
      id_ben_nhan_tien: parseInt(payee.slice(i + 1), 10),
      han_thanh_toan: han,
      hinh_thuc_tt: $('#dn-create-ht').val(),
      ghi_chu: $.trim($('#dn-create-ghi-chu').val()),
      chi_phi_edits: buildCreateEdits()
    };
    var isEdit = createState.mode === 'edit';
    var method = isEdit ? 'PUT' : 'POST';
    var url = isEdit ? (API + '/' + createState.editId) : API;
    $('#dn-create-save, #dn-create-save-send').attr('disabled', 'disabled');
    call(method, url, body, function (data) {
      var nid = isEdit ? createState.editId : (data && data.nid);
      var ma = (data && data.ma_de_nghi) || '';
      if (andSend && nid) {
        call('POST', API + '/' + nid + '/gui-duyet', {}, function () {
          $('#dn-create-save, #dn-create-save-send').removeAttr('disabled');
          modalOf('dn-create-modal').hide();
          toast(isEdit ? 'Đã lưu và gửi duyệt.' : ('Đã tạo và gửi duyệt ' + ma + '.'));
          loadList();
        }, function (jqXHR) {
          $('#dn-create-save, #dn-create-save-send').removeAttr('disabled');
          toast(apiMsg(jqXHR), false);
        });
      } else {
        $('#dn-create-save, #dn-create-save-send').removeAttr('disabled');
        modalOf('dn-create-modal').hide();
        toast(isEdit ? 'Đã lưu đề nghị.' : ('Đã tạo đề nghị (nháp) ' + ma + '.'));
        loadList();
      }
    }, function (jqXHR) {
      $('#dn-create-save, #dn-create-save-send').removeAttr('disabled');
      toast(apiMsg(jqXHR), false);
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
    $('#dn-menu-title').text(item.ma_de_nghi + ' · ' + ((item.ben_nhan_tien && item.ben_nhan_tien.ten) || ''));
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

  /* ─────────── Nổi bật 1 dòng sau khi đóng modal Xem (cùng animation với dòng kế hoạch vừa thao tác ở /ke-hoach-xep-xe) ───────────
   * Dùng khi mở "Xem" từ tab Chi phí kế hoạch (link #xem-{id}, thường ra tab mới): đóng modal xong thì biết ngay đề nghị
   * đang ở dòng nào, khỏi tự tìm/tự bấm sang trang. Nếu đề nghị không nằm ở trang/tab/bộ lọc đang xem thì bỏ qua (không có gì
   * để cuộn tới) — openView(..., true) đã tự lọc theo đúng mã đề nghị (trang 1, tab "Tất cả") trước khi tới bước này nên
   * trường hợp không tìm thấy chỉ xảy ra khi mở "Xem" bình thường (dòng đã ở ngay trên màn hình, không cần cuộn/nổi bật). */
  var touchedId = 0;
  var touchedTimer = null;

  function markTouched(id) {
    touchedId = parseInt(id, 10) || 0;
  }

  function applyTouchedRow() {
    if (!touchedId) return;
    if ($('.modal.show').length) return; // đợi modal khác (nếu có) đóng hẳn
    var id = touchedId;
    touchedId = 0;
    var $row = $('#dn-tbody tr[data-id="' + id + '"]');
    if (!$row.length) return; // đề nghị không nằm ở trang/tab/bộ lọc đang xem
    clearTimeout(touchedTimer);
    $('#dn-tbody tr.dn-row-touched').removeClass('dn-row-touched dn-row-touched-out');
    $row.addClass('dn-row-touched');
    var rect = $row[0].getBoundingClientRect();
    if (rect.top < 120 || rect.bottom > window.innerHeight - 20) {
      $row[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    touchedTimer = window.setTimeout(function () {
      $row.addClass('dn-row-touched-out');
      window.setTimeout(function () { $row.removeClass('dn-row-touched dn-row-touched-out'); }, 900);
    }, 10000);
  }

  function applyFilters() {
    state.filters.keyword = $.trim($('#dn-f-q').val());
    state.filters.nid_ncc_phat_hanh = $('#dn-f-issuer').val() || '';
    state.filters.ben_nhan_tien = $('#dn-f-payee').val() || '';
    state.filters.hinh_thuc = $('#dn-f-ht').val();
    state.page = 1;
    loadList();
  }

  function bind() {
    $('#dn-view-modal').bind('hidden.bs.modal', applyTouchedRow);
    $('#dn-btn-search').click(applyFilters);
    $('#dn-f-q').keydown(function (e) { if (e.which === 13) { e.preventDefault(); applyFilters(); } });
    $('#dn-btn-reset').click(function () {
      $('#dn-f-q').val(''); setSelectVal('#dn-f-issuer', ''); setSelectVal('#dn-f-payee', ''); $('#dn-f-ht').val('');
      state.chips = { qua_han: false, chua_hd: false, nhieu_hd: false };
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
      var totalPages = parseInt($(this).attr('data-total-pages'), 10) || 1;
      if (p > 0) { state.page = Math.min(p, totalPages); loadList(); }
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
    // Double-click dòng: mở modal Sửa nếu đề nghị còn sửa được, không thì mở Xem chi tiết (cùng cơ chế với /theo-doi-do-dau,
    // /ke-hoach-xep-xe). Bỏ qua khi trúng nút/link/ô nhập trong dòng — 1 click nhanh vào dòng còn dùng để mở/đóng bảng chi phí,
    // nhưng click thứ 2 của double click đã tự huỷ việc đó ở handler 'click' phía trên (rowTimer bị clear trước khi dblclick nổ ra).
    $('#dn-tbody').delegate('tr[data-id]', 'dblclick', function (e) {
      if ($(e.target).closest('button, a, input, select, textarea, label, .dropdown, .select2-container, [role="button"], .btn').length) return;
      if (rowTimer) { clearTimeout(rowTimer); rowTimer = null; }
      var id = parseInt($(this).data('id'), 10);
      var item = id && state.items[id];
      if (!item) return;
      closeMenu();
      if (item.co_the_sua) openEdit(id); else openView(id);
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
    $('#dn-btn-create').click(openCreate);
    $('#dn-create-form').submit(function (e) { e.preventDefault(); submitCreate(false); });
    $('#dn-create-save-send').click(function () { submitCreate(true); });
    $('#dn-create-payee').change(function () {
      if (createState.suppressPayeeChange) return;
      createState.selected = {};
      createState.edits = {};
      $('#dn-create-payee').removeClass('is-invalid');
      fetchCreateLines();
    });
    // 3 ô lọc Tên chi phí / Số cont / Số hoá đơn: Enter hoặc rời ô thì tải lại, chỉ khi giá trị thực sự đổi.
    var filterRefetch = function () {
      var v = $.trim($(this).val());
      if ($(this).data('dnLast') === v) return;
      $(this).data('dnLast', v);
      fetchCreateLines();
    };
    $('.dn-create-filter').keydown(function (e) { if (e.which === 13) { e.preventDefault(); filterRefetch.call(this); } });
    $('.dn-create-filter').bind('blur', filterRefetch);
    $('#dn-create-lines').delegate('.money-input', 'input', function () { formatMoneyKeepCaret(this); });
    // Click vào dòng (chỗ không phải ô nhập/select2/nút) = tick/bỏ tick dòng đó.
    // Bôi đen chữ (kéo chuột / có vùng chọn) thì không tính là click chọn dòng.
    var rowDownX = 0, rowDownY = 0;
    $('#dn-create-lines').delegate('tr.dn-create-row', 'mousedown', function (e) { rowDownX = e.pageX; rowDownY = e.pageY; });
    $('#dn-create-lines').delegate('tr.dn-create-row', 'click', function (e) {
      if ($(e.target).closest('input, select, textarea, button, a, label, .select2-container').length) return;
      if (Math.abs(e.pageX - rowDownX) > 4 || Math.abs(e.pageY - rowDownY) > 4) return;
      var sel = window.getSelection ? String(window.getSelection()) : '';
      if (sel) return;
      var cb = $(this).find('.dn-create-check')[0];
      if (!cb) return;
      cb.checked = !cb.checked;
      $(cb).trigger('change');
    });
    $('#dn-create-lines').delegate('.dn-create-check', 'change', function () {
      var nid = parseInt($(this).data('nid'), 10);
      if ($(this).is(':checked')) createState.selected[nid] = true; else delete createState.selected[nid];
      updateCreateBulkBar();
      updateCreateSummary();
    });
    $('#dn-create-lines').delegate('.dn-create-group-check', 'change', function () {
      var ids = String($(this).data('ids')).split(','), on = $(this).is(':checked');
      for (var i = 0; i < ids.length; i++) {
        var nid = parseInt(ids[i], 10);
        if (on) createState.selected[nid] = true; else delete createState.selected[nid];
      }
      renderCreateLines(createRowsArray());
    });
    $('#dn-create-lines').delegate('.dn-create-edit', 'change', function () {
      if (suppressLineEditChange) return;
      var $el = $(this);
      var nid = parseInt($el.data('nid'), 10), field = $el.attr('data-field'), val = $el.val();
      var cur = createEffectiveLine(createState.rows[nid]);
      // Trả ô về giá trị cũ khi nhập sai — cần trigger 'change' để select2 (tên chi phí) vẽ lại đúng nhãn
      // đang chọn, nên phải chặn tự gọi lại chính handler này (suppressLineEditChange).
      function revert(value) {
        suppressLineEditChange = true;
        $el.val(value).trigger('change');
        suppressLineEditChange = false;
      }
      if (field === 'ngay_hoa_don') {
        var d = toApi(val);
        if (d === null) {
          toast('Ngày hoá đơn phải có dạng dd/mm/yyyy.', false);
          revert(toView(cur.ngay_hoa_don));
          return;
        }
        setCreateEdit(nid, 'ngay_hoa_don', d);
      }
      else if (field === 'so_hoa_don') {
        setCreateEdit(nid, 'so_hoa_don', $.trim(val));
      }
      else if (field === 'ten_chi_phi') {
        var ten = $.trim(val);
        if (!ten) {
          toast('Tên chi phí không được để trống.', false);
          revert(cur.ten_chi_phi);
          return;
        }
        setCreateEdit(nid, 'ten_chi_phi', ten);
      }
      else if (field === 'don_gia') {
        setCreateEdit(nid, 'don_gia', digits(val));
      }
      else if (field === 'so_luong') {
        var sl = parseFloat(String(val).replace(',', '.'));
        if (!sl || sl <= 0) {
          toast('Số lượng phải lớn hơn 0.', false);
          revert(formatQty(cur.so_luong));
          return;
        }
        setCreateEdit(nid, 'so_luong', Math.round(sl * 100) / 100);
      }
      else if (field === 'vat_percent') {
        var vat = parseFloat(String(val).replace(',', '.'));
        if (isNaN(vat)) vat = 0;
        vat = Math.min(100, Math.max(0, vat));
        setCreateEdit(nid, 'vat_percent', Math.round(vat * 100) / 100);
      }
      else {
        setCreateEdit(nid, field, val);
      }
      renderCreateLines(createRowsArray());
    });
    $('#dn-create-bulk').delegate('.dn-bulk-apply', 'click', function () {
      var $bar = $(this).closest('.dn-bulk-hd');
      var ids = String($(this).data('ids')).split(',');
      var so = $.trim($bar.find('.dn-bulk-so').val());
      if (!so) return;
      var ngay = toApi($bar.find('.dn-bulk-ngay').val());
      if (ngay === null) { toast('Ngày hoá đơn phải có dạng dd/mm/yyyy.', false); return; }
      var n = 0;
      for (var i = 0; i < ids.length; i++) {
        var nid = parseInt(ids[i], 10);
        if (createEffectiveLine(createState.rows[nid]).so_hoa_don) continue;
        setCreateEdit(nid, 'so_hoa_don', so);
        setCreateEdit(nid, 'ngay_hoa_don', ngay);
        n++;
      }
      toast('Đã gán hoá đơn ' + so + ' cho ' + n + ' dòng');
      renderCreateLines(createRowsArray());
    });
  }

  // Select2 chuẩn (SELECT2_PATTERN.md): destroy trước khi tạo lại, dropdown gắn trong khung bộ lọc, focus ô tìm khi mở.
  function initFilterSelect2($el, placeholder) {
    if (!$.fn.select2) return;
    if ($el.data('select2')) $el.select2('destroy');
    $el.select2({ placeholder: placeholder, allowClear: true, width: '100%', dropdownParent: $('#dn-app .dn-filter-body') });
    $el.unbind('select2:open.dnFocus').bind('select2:open.dnFocus', function () {
      window.setTimeout(function () {
        var search = document.querySelector('.select2-container--open .select2-search__field');
        if (search) search.focus();
      }, 0);
    });
  }

  function setSelectVal(sel, val) {
    var $s = $(sel);
    $s.val(val || '');
    if ($.fn.select2 && $s.data('select2')) $s.trigger('change');
  }

  function initFilters() {
    loadOptions(function (opts) {
      var i;
      // Nhà cung cấp hiển thị bằng mã KH (server trả sẵn trong "ten").
      var issuer = '<option value="">Tất cả</option>';
      var nccs = opts.ncc || [];
      for (i = 0; i < nccs.length; i++) issuer += '<option value="' + nccs[i].nid + '">' + esc(nccs[i].ten) + '</option>';
      $('#dn-f-issuer').html(issuer);
      initFilterSelect2($('#dn-f-issuer'), 'Tất cả');

      var payee = '<option value="">Tất cả</option><optgroup label="Nhà cung cấp">';
      for (i = 0; i < nccs.length; i++) payee += '<option value="ncc|' + nccs[i].nid + '">' + esc(payeeLabel(nccs[i])) + '</option>';
      payee += '</optgroup><optgroup label="Nhân viên">';
      var staff = opts.nhan_vien || [];
      for (i = 0; i < staff.length; i++) payee += '<option value="nhan_vien|' + staff[i].uid + '">' + esc(payeeLabel(staff[i])) + '</option>';
      payee += '</optgroup><optgroup label="Lái xe">';
      var drivers = opts.lai_xe_ds || [];
      for (i = 0; i < drivers.length; i++) payee += '<option value="lai_xe|' + drivers[i].nid + '">' + esc(payeeLabel(drivers[i])) + '</option>';
      payee += '</optgroup>';
      $('#dn-f-payee').html(payee);
      initFilterSelect2($('#dn-f-payee'), 'Tất cả');
    });
  }

  return {
    start: function () {
      settings = (Drupal.settings && Drupal.settings.de_nghi_thanh_toan) || {};
      perms = settings.permissions || {};
      // Không có quyền tạo thì ẩn nút "Tạo đề nghị" (server vẫn chặn POST nếu gọi thẳng API).
      if (!perms.create) $('#dn-btn-create').hide();
      bind();
      syncChips();
      initFilters();
      // Mở từ link "Xem" ở tab Chi phí kế hoạch (thường ra tab mới): nạp danh sách nền đã lọc sẵn theo mã đề nghị
      // (xem openView, tham số focusInList) thay vì nạp mặc định rồi lại phải nạp lại ngay.
      var hash = /^#xem-(\d+)$/.exec(window.location.hash || '');
      if (hash) openView(parseInt(hash[1], 10), false, true); else loadList();
      if (typeof flatpickr !== 'undefined') {
        // appendTo body: theme này đặt z-index modal (1090) cao hơn z-index mặc định của flatpickr (1074),
        // static:true lại đặt lịch position:absolute bên trong modal-body (overflow-y:auto) nên bị cắt —
        // appendTo body + .flatpickr-calendar{z-index:99999} (CSS) tránh được cả 2 vấn đề.
        $('.flatpickr-date').each(function () {
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, appendTo: document.body });
        });
      }
      initCreateDateRange();
    }
  };
  }

  Drupal.behaviors.deNghiThanhToan = {
    attach: function (context) {
      var $ = pickJq();
      if (!$ || !$('#dn-app', context).length || Drupal.behaviors.deNghiThanhToan._done) return;
      Drupal.behaviors.deNghiThanhToan._done = true;
      DeNghi($).start();
    }
  };
})(Drupal);

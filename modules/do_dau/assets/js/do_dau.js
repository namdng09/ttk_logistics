(function (Drupal) {
  'use strict';

  // Trang có thể có nhiều bản jQuery (jQuery của Drupal + jQuery của theme, plugin select2/daterangepicker chỉ gắn vào 1 bản).
  // Sự kiện phát bởi plugin (vd 'change' của select2) chỉ tới được handler gắn bằng CHÍNH bản jQuery đó, nên toàn bộ
  // code trang chạy trên bản có plugin, chọn lúc trang khởi tạo (không phải lúc nạp file).
  function pickJq() {
    var list = [window.jQuery, window.$];
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] === 'function' && list[i].fn && typeof list[i].fn.select2 === 'function') return list[i];
    }
    return typeof window.jQuery === 'function' ? window.jQuery : null;
  }

  function DoDau($) {

  // Lưu ý jQuery: Drupal 7 mặc định 1.4.4 nên KHÔNG dùng .on()/.prop()/.done()/.fail() hay $.ajax({method}).
  // Dùng .bind()/.delegate()/.attr()/.removeAttr(); gọi API bằng $.ajax({type, success, error}).

  var API = '/api/do-dau';
  // Drupal.settings có thể CHƯA có lúc file JS chạy (thứ tự nạp script), nên chỉ đọc khi trang khởi tạo (attach).
  var settings = {};
  var perms = {};
  var LIMIT = 20;

  var notyf;
  var state = {
    page: 1,
    tab: 'all',
    filters: { keyword: '', nid_phuong_tien: '', nid_lai_xe: '', nid_ncc: '' },
    range: { tu: '', den: '' },
    items: {},
    options: null,
    optionsLoading: false,
    optionsCallbacks: [],
    menuId: 0,
    editId: 0,
    rejectId: 0,
    rejectKey: 'tu-choi',
    deleteId: 0,
    saving: false
  };

  var TABS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'mine', label: 'Của tôi' },
    { id: 'cho_duyet', label: 'Chờ duyệt' },
    { id: 'cho_duyet_tt', label: 'Chờ duyệt TT' },
    { id: 'cho_tt', label: 'Chờ thanh toán' },
    { id: 'da_tt', label: 'Đã thanh toán' },
    { id: 'khac', label: 'Từ chối / Thu hồi / Huỷ' }
  ];

  var STATUS_CLASS = {
    cho_duyet: 'bg-label-warning',
    thu_hoi: 'bg-label-secondary',
    da_duyet: 'bg-label-info',
    cho_duyet_tt: 'bg-label-warning',
    cho_tt: 'bg-label-primary',
    da_tt: 'bg-label-success',
    tu_choi: 'bg-label-danger',
    huy: 'bg-label-secondary'
  };

  var ACTION_ICON = { 'thu-hoi': 'tabler-history', 'gui-duyet': 'tabler-send', 'huy': 'tabler-x', 'duyet': 'tabler-check', 'tu-choi': 'tabler-x', 'duyet-tt': 'tabler-check', 'tu-choi-tt': 'tabler-x' };

  /* ─────────── Tiện ích ─────────── */

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

  // Số nguyên đồng có dấu chấm ngăn cách nghìn.
  function money(v) {
    var n = Math.round(Number(v));
    if (isNaN(n)) return '0';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  // Số lít: tối đa 2 số lẻ, dấu phẩy thập phân.
  function lit(v) {
    var n = Number(v);
    if (isNaN(n)) return '0';
    var parts = (Math.round(n * 100) / 100).toString().split('.');
    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (parts[1] ? ',' + parts[1] : '');
  }

  function digits(v) {
    var n = parseInt(String(v || '').replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  // "320,5" / "320.5" -> 320.5 (không có số -> 0).
  function decimal(v) {
    var s = String(v || '').replace(/[^\d,.]/g, '').replace(',', '.');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function pad(n) { return ('0' + n).slice(-2); }
  function toApiDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function toViewDateObj(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }

  function toView(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  // dd/mm/yyyy -> Y-m-d, '' nếu trống, null nếu sai định dạng.
  function toApi(v) {
    v = $.trim(v || '');
    if (!v) return '';
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
    if (!m) return null;
    return m[3] + '-' + pad(m[2]) + '-' + pad(m[1]);
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

  // Select2 chuẩn (SELECT2_PATTERN.md): destroy trước khi tạo lại, focus ô tìm khi mở.
  function initSelect2($el, placeholder, $parent) {
    if (!$.fn.select2) return;
    if ($el.data('select2')) $el.select2('destroy');
    $el.select2({ placeholder: placeholder, allowClear: true, width: '100%', dropdownParent: $parent });
    $el.unbind('select2:open.ddFocus').bind('select2:open.ddFocus', function () {
      window.setTimeout(function () {
        var search = document.querySelector('.select2-container--open .select2-search__field');
        if (search) search.focus();
      }, 0);
    });
  }

  /* ─────────── Tuỳ chọn (đầu kéo, lái xe, NCC, bên nhận tiền) ─────────── */

  // Tên kèm số điện thoại nếu có: "Nguyễn Văn A (0123456789)"; không có thì chỉ tên.
  function withPhone(x) { return x.ten + (x.sdt ? ' (' + x.sdt + ')' : ''); }

  // Ô Bên nhận tiền: 3 nhóm, giá trị "loại|id" (ncc|nid, nhan_vien|uid, lai_xe|nid).
  function payeeOptionsHtml() {
    var o = state.options || { lai_xe: [], nhan_vien: [], ncc: [] };
    var html = '<option value="">Chọn bên nhận tiền</option>';
    var i;
    html += '<optgroup label="Lái xe (ứng tiền trước)">';
    for (i = 0; i < o.lai_xe.length; i++) html += '<option value="lai_xe|' + o.lai_xe[i].nid + '">' + esc(withPhone(o.lai_xe[i])) + '</option>';
    html += '</optgroup><optgroup label="Nhân viên (ứng tiền trước)">';
    for (i = 0; i < (o.nhan_vien || []).length; i++) html += '<option value="nhan_vien|' + o.nhan_vien[i].uid + '">' + esc(withPhone(o.nhan_vien[i])) + '</option>';
    html += '</optgroup><optgroup label="Nhà cung cấp (thu hộ)">';
    for (i = 0; i < o.ncc.length; i++) html += '<option value="ncc|' + o.ncc[i].nid + '">' + esc(withPhone(o.ncc[i])) + '</option>';
    html += '</optgroup>';
    return html;
  }

  function optionsHtml(list, valueKey, labelFn, first) {
    var html = '<option value="">' + esc(first) + '</option>';
    for (var i = 0; i < list.length; i++) html += '<option value="' + list[i][valueKey] + '">' + esc(labelFn(list[i])) + '</option>';
    return html;
  }

  function fillSelects() {
    var o = state.options || { dau_keo: [], lai_xe: [], ncc: [] };
    var byBks = function (t) { return t.bks; };
    var byTen = function (x) { return x.ten; };
    var $filter = $('#dd-app .dd-filter-bar');
    var $modal = $('#dd-form-modal');
    var map = [
      ['#dd-f-dk', o.dau_keo, byBks, 'Tất cả', 'Tất cả', $filter],
      ['#dd-f-lx', o.lai_xe, byTen, 'Tất cả', 'Tất cả', $filter],
      ['#dd-f-ncc', o.ncc, byTen, 'Tất cả', 'Tất cả', $filter],
      ['#dd-m-dk', o.dau_keo, byBks, 'Chọn đầu kéo', 'Chọn đầu kéo', $modal],
      ['#dd-m-lx', o.lai_xe, byTen, 'Chọn lái xe', 'Chọn lái xe', $modal],
      ['#dd-m-ncc', o.ncc, byTen, 'Chọn NCC', 'Chọn NCC', $modal]
    ];
    var $pay = $('#dd-m-payee');
    if ($pay.data('select2')) $pay.select2('destroy');
    $pay.html(payeeOptionsHtml());
    initSelect2($pay, 'Chọn bên nhận tiền', $modal);
    for (var i = 0; i < map.length; i++) {
      var $s = $(map[i][0]);
      var keep = $s.val();
      $s.html(optionsHtml(map[i][1], 'nid', map[i][2], map[i][3]));
      if (keep) $s.val(keep);
      initSelect2($s, map[i][4], map[i][5]);
    }
  }

  function loadOptions(cb) {
    if (state.options) { cb(state.options); return; }
    state.optionsCallbacks.push(cb);
    if (state.optionsLoading) return;
    state.optionsLoading = true;
    $.ajax({
      url: API + '/tuy-chon', type: 'GET', dataType: 'json',
      success: function (res) { state.options = (res && res.data) || { dau_keo: [], lai_xe: [], ncc: [] }; },
      error: function (jqXHR) { toast(apiMsg(jqXHR), false); state.options = { dau_keo: [], lai_xe: [], ncc: [] }; },
      complete: function () {
        state.optionsLoading = false;
        fillSelects();
        var cbs = state.optionsCallbacks.splice(0);
        for (var i = 0; i < cbs.length; i++) cbs[i](state.options);
      }
    });
  }

  function truckById(id) {
    var list = (state.options && state.options.dau_keo) || [];
    for (var i = 0; i < list.length; i++) if (list[i].nid === id) return list[i];
    return null;
  }

  function driverName(id) {
    var list = (state.options && state.options.lai_xe) || [];
    for (var i = 0; i < list.length; i++) if (list[i].nid === id) return list[i].ten;
    return '';
  }

  /* ─────────── Khoảng ngày (bộ lọc) ─────────── */

  // Ô "Ngày đổ" dùng daterangepicker như ô "Ngày kế hoạch" ở /ke-hoach-xep-xe (hiển thị "dd/mm/yyyy đến dd/mm/yyyy").
  var RANGE_SEP = ' đến ';

  function readRange() {
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*đến\s*(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec($.trim($('#dd-f-date').val() || ''));
    if (!m) return { tu: '', den: '' };
    return { tu: m[3] + '-' + pad(m[2]) + '-' + pad(m[1]), den: m[6] + '-' + pad(m[5]) + '-' + pad(m[4]) };
  }

  // Mặc định KHÔNG lọc ngày (ô để trống); Reset cũng xoá ngày. Chọn khoảng ngày rồi bấm Tìm để lọc.
  function clearRange() {
    $('#dd-f-date').val('');
  }

  function initPicker() {
    var $in = $('#dd-f-date');
    if (!$in.length || typeof $.fn.daterangepicker !== 'function' || typeof moment === 'undefined') return;
    $in.daterangepicker({
      autoUpdateInput: false,
      autoApply: true,
      showDropdowns: true,
      opens: 'center',
      locale: {
        format: 'DD/MM/YYYY',
        separator: RANGE_SEP,
        applyLabel: 'Áp dụng',
        cancelLabel: 'Xóa',
        customRangeLabel: 'Tùy chọn',
        daysOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
        firstDay: 1
      }
    });
    var dp = $in.data('daterangepicker');
    if (dp && dp.container) dp.container.addClass('dd-filter-daterangepicker');
    $in.bind('apply.daterangepicker', function (event, picker) {
      $(this).val(picker.startDate.format('DD/MM/YYYY') + RANGE_SEP + picker.endDate.format('DD/MM/YYYY'));
    }).bind('cancel.daterangepicker', function () {
      $(this).val('');
    });
  }

  /* ─────────── Danh sách ─────────── */

  function listParams() {
    var p = { page: state.page, limit: LIMIT, tab: state.tab };
    if (state.filters.keyword) p.keyword = state.filters.keyword;
    if (state.filters.nid_phuong_tien) p.nid_phuong_tien = state.filters.nid_phuong_tien;
    if (state.filters.nid_lai_xe) p.nid_lai_xe = state.filters.nid_lai_xe;
    if (state.filters.nid_ncc) p.nid_ncc = state.filters.nid_ncc;
    if (state.range.tu) p.tu_ngay = state.range.tu;
    if (state.range.den) p.den_ngay = state.range.den;
    return p;
  }

  function loadList() {
    $('#dd-tbody').html('<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>');
    $.ajax({
      url: API, type: 'GET', dataType: 'json', data: listParams(),
      success: function (res) {
        var d = (res && res.data) || {};
        state.items = {};
        var items = d.items || [];
        for (var i = 0; i < items.length; i++) state.items[items[i].nid] = items[i];
        state.page = d.current_page || 1;
        renderTabs(d.tab_counts || {});
        renderRows(items, d);
        renderStat(d.tong || {});
        renderPagination(d);
      },
      error: function (jqXHR) {
        $('#dd-tbody').html('<tr><td colspan="10" class="text-center text-danger py-4">' + esc(apiMsg(jqXHR)) + '</td></tr>');
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
    $('#dd-tabs').html(html);
  }

  function renderStat(t) {
    $('#dd-sum-lit').text(lit(t.so_lit));
    $('#dd-sum-tien').text(money(t.tong_sau_vat));
  }

  function actionButtons(item) {
    var html = '';
    var list = item.hanh_dong || [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      var cls = a.style === 'danger' ? 'btn-label-danger' : (a.style === 'secondary' ? 'btn-label-secondary' : (a.key === 'gui-duyet' ? 'btn-label-primary' : 'btn-primary'));
      html += ' <button type="button" class="btn btn-sm dd-act ' + cls + '" data-act="' + esc(a.key) + '" data-id="' + item.nid + '">' +
        '<i class="ti ' + (ACTION_ICON[a.key] || 'tabler-point') + '"></i> ' + esc(a.label) + '</button>';
    }
    if (item.co_the_sua && item.trang_thai === 'tu_choi') {
      html += ' <button type="button" class="btn btn-sm dd-act btn-label-primary" data-act="sua" data-id="' + item.nid + '"><i class="ti tabler-edit"></i> Sửa &amp; gửi lại</button>';
    }
    return html;
  }

  function deNghiLink(item) {
    if (!item.nid_de_nghi) return '';
    return '<a href="/de-nghi-thanh-toan#xem-' + item.nid_de_nghi + '" target="_blank">' + esc(item.ma_de_nghi) + '</a>';
  }

  function noteHtml(item) {
    if (item.trang_thai === 'tu_choi' && item.ly_do_tu_choi) {
      return '<div class="small mt-1 text-danger">Lý do: ' + esc(item.ly_do_tu_choi) + '</div>';
    }
    // Chờ duyệt TT chưa có đề nghị: không ghi chú. Sau "Duyệt TT" đề nghị thanh toán được tạo, kế toán ghi nhận thanh toán ở màn đó.
    if ((item.trang_thai === 'cho_duyet_tt' || item.trang_thai === 'cho_tt') && item.nid_de_nghi) {
      return '<div class="small mt-1 text-muted">ĐNTT: ' + deNghiLink(item) + '</div>';
    }
    if (item.trang_thai === 'da_tt') {
      return '<div class="small mt-1 text-muted">ĐNTT: ' + deNghiLink(item) + ' · đã chi</div>';
    }
    return '';
  }

  function renderRows(items, d) {
    if (!items.length) {
      $('#dd-tbody').html('<tr><td colspan="10" class="text-center text-muted py-4">Không có dữ liệu</td></tr>');
      return;
    }
    var html = '';
    var stt = ((d.current_page || 1) - 1) * (d.limit || LIMIT);
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      stt++;
      html += '<tr data-id="' + it.nid + '">' +
        '<td class="text-center"><button type="button" class="dd-stt-btn" data-menu-open="' + it.nid + '" title="Chức năng" aria-label="Mở menu chức năng">' + stt + '</button></td>' +
        '<td><div class="fw-semibold">' + esc(it.ma_phieu) + '</div><div class="small text-muted"><i class="ti tabler-calendar me-1"></i>' + esc(toView(it.ngay_do)) + '</div></td>' +
        '<td><div class="fw-semibold">' + esc(it.bks) + '</div><div class="small text-muted"><i class="ti tabler-user me-1"></i>' + esc(it.lai_xe_ten) + '</div></td>' +
        '<td><div>' + esc(it.ncc_ten) + '</div><div class="small text-muted"><i class="ti tabler-file-invoice me-1"></i>' + (it.so_hoa_don ? 'HĐ ' + esc(it.so_hoa_don) : 'Chưa có số hoá đơn') + '</div></td>' +
        '<td class="text-end">' + lit(it.so_lit) + '</td>' +
        '<td class="text-end">' + money(it.don_gia) + '</td>' +
        '<td class="text-end">' + money(it.tong_truoc_vat) + '</td>' +
        '<td class="text-end"><div>' + money(it.tong_vat) + '</div><div class="small text-muted">' + esc(lit(it.vat_percent)) + '%</div></td>' +
        '<td class="text-end fw-semibold">' + money(it.tong_sau_vat) + '</td>' +
        '<td><div class="d-flex align-items-center flex-wrap gap-1">' + statusBadge(it) + actionButtons(it) + '</div>' + noteHtml(it) + '</td>' +
        '</tr>';
    }
    $('#dd-tbody').html(html);
  }

  // Phân trang giống màn /ke-hoach-xep-xe: về đầu, lùi, số trang (±2, có "..."), tiến, về cuối, ô nhập trang.
  function renderPagination(d) {
    var total = d.total_pages || 0;
    var current = d.current_page || 0;
    $('#dd-pagination').show();
    $('#dd-pagination-info').text('Tổng số: ' + (d.total || 0) + ' bản ghi');
    $('#dd-pagination-total-pages').text('/ ' + total);
    $('#dd-pagination-jump').val(current).attr('data-total-pages', total);
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
    $('#dd-pagination ul.pagination').html(html);
  }

  function reloadFirstPage() {
    state.page = 1;
    loadList();
  }

  function applyFilters() {
    state.filters = {
      keyword: $.trim($('#dd-f-q').val()),
      nid_phuong_tien: $('#dd-f-dk').val() || '',
      nid_lai_xe: $('#dd-f-lx').val() || '',
      nid_ncc: $('#dd-f-ncc').val() || ''
    };
    state.range = readRange();
    reloadFirstPage();
  }

  /* ─────────── Menu dòng ─────────── */

  // Bỏ qua double-click khi trúng nút hành động, link đề nghị TT, hay bất kỳ phần tử tương tác nào trong dòng
  // (cùng danh sách loại trừ với /ke-hoach-xep-xe).
  function isRowInteractiveTarget(target) {
    return $(target).closest('button, a, input, select, textarea, label, .dropdown, .select2-container, [role="button"]').length > 0;
  }

  function closeMenu() { $('#dd-menu').hide(); }

  function openMenu(id, x, y) {
    var item = state.items[id];
    if (!item) return;
    state.menuId = id;
    $('#dd-menu-title').text(item.ma_phieu + ' · ' + item.bks);
    if (item.co_the_sua) $('#dd-menu [data-menu="edit"]').removeClass('disabled'); else $('#dd-menu [data-menu="edit"]').addClass('disabled');
    if (item.co_the_xoa) $('#dd-menu [data-menu="delete"]').removeClass('disabled'); else $('#dd-menu [data-menu="delete"]').addClass('disabled');
    if (!item.co_the_sua && item.trang_thai !== 'huy') $('#dd-menu-locked').show(); else $('#dd-menu-locked').hide();
    var $m = $('#dd-menu');
    $m.css({ display: 'block', left: 0, top: 0 });
    var w = $m.outerWidth(), h = $m.outerHeight();
    var left = Math.max(8, Math.min(x, $(window).width() - w - 8));
    var top = Math.max(8, Math.min(y, $(window).height() - h - 8));
    $m.css({ left: left + 'px', top: top + 'px' });
  }

  /* ─────────── Hành động chuyển trạng thái ─────────── */

  function doAction(id, key, body, done) {
    call('POST', API + '/' + id + '/' + key, body || {}, function (data) {
      if (done) done(data);
      loadList();
    });
  }

  function runAction(id, key) {
    var item = state.items[id];
    if (!item) return;
    if (key === 'sua') { openEdit(id); return; }
    if (key === 'tu-choi' || key === 'tu-choi-tt') { openReject(id, key); return; }
    var msg = { 'thu-hoi': 'Đã thu hồi phiếu ', 'gui-duyet': 'Đã gửi duyệt phiếu ', 'huy': 'Đã huỷ phiếu ', 'duyet': 'Đã duyệt phiếu ', 'duyet-tt': 'Đã duyệt thanh toán phiếu ' };
    doAction(id, key, {}, function (data) {
      var text = (msg[key] || 'Đã cập nhật phiếu ') + item.ma_phieu;
      if (key === 'duyet-tt' && data && data.ma_de_nghi) text += '. Đề nghị ' + data.ma_de_nghi + ' đã chuyển sang màn Đề nghị thanh toán để ghi nhận thanh toán';
      toast(text);
    });
  }

  // Một hộp nhập lý do dùng chung cho: Từ chối (duyệt phiếu), Từ chối (duyệt thanh toán).
  var REJECT_TEXT = {
    'tu-choi': { title: 'Từ chối phiếu ', btn: 'Xác nhận từ chối', done: 'Đã từ chối phiếu ' },
    'tu-choi-tt': { title: 'Từ chối duyệt thanh toán phiếu ', btn: 'Xác nhận từ chối', done: 'Đã từ chối phiếu ' }
  };

  function openReject(id, key) {
    state.rejectId = id;
    state.rejectKey = key || 'tu-choi';
    var t = REJECT_TEXT[state.rejectKey];
    $('#dd-reject-title').text(t.title + state.items[id].ma_phieu);
    $('#dd-reject-confirm').text(t.btn);
    $('#dd-reject-reason').val('').removeClass('is-invalid');
    modalOf('dd-reject-modal').show();
  }

  function confirmReject() {
    var reason = $.trim($('#dd-reject-reason').val());
    if (!reason) { $('#dd-reject-reason').addClass('is-invalid'); return; }
    var id = state.rejectId, item = state.items[id];
    $('#dd-reject-confirm').attr('disabled', 'disabled');
    var key = state.rejectKey || 'tu-choi';
    call('POST', API + '/' + id + '/' + key, { ly_do: reason }, function () {
      $('#dd-reject-confirm').removeAttr('disabled');
      modalOf('dd-reject-modal').hide();
      toast(REJECT_TEXT[key].done + (item ? item.ma_phieu : ''));
      loadList();
    }, function (jqXHR) {
      $('#dd-reject-confirm').removeAttr('disabled');
      toast(apiMsg(jqXHR), false);
    });
  }

  /* ─────────── Chi tiết ─────────── */

  function field(label, value) {
    return '<div class="col-md-4"><div class="dd-info-label">' + esc(label) + '</div><div class="dd-info-value">' + (value === '' || value === null ? '—' : value) + '</div></div>';
  }

  // Chỉ hiển thị tên bên nhận tiền (trùng bên phát hành thì là tên bên phát hành), không kèm ghi chú.
  function payeeText(d) {
    var b = d.ben_nhan_tien || {};
    return esc(b.ten || d.ncc_ten);
  }

  function deNghiDetail(d) {
    if (!d.nid_de_nghi || !d.de_nghi) return d.nid_de_nghi ? deNghiLink(d) : 'Chưa có';
    var dn = d.de_nghi;
    var html = deNghiLink(d) + ' <span class="text-muted">· ' + esc(d.trang_thai_label) + '</span>';
    if (dn.da_thanh_toan > 0) html += '<div class="small text-muted">Đã trả ' + money(dn.da_thanh_toan) + ' đ · còn ' + money(dn.con_lai) + ' đ</div>';
    return html;
  }

  function renderDetail(d) {
    var html = '';
    if (d.trang_thai === 'tu_choi' && d.ly_do_tu_choi) {
      html += '<div class="alert alert-danger py-2"><strong>Lý do từ chối:</strong> ' + esc(d.ly_do_tu_choi) + '</div>';
    }
    html += '<div class="row g-3">' +
      field('Ngày đổ', esc(toView(d.ngay_do))) + field('BKS đầu kéo', esc(d.bks)) + field('Lái xe', esc(d.lai_xe_ten)) +
      field('Số công tơ mét', d.so_cong_to_met === null ? '' : money(d.so_cong_to_met) + ' km') + field('Người tạo', esc(d.nguoi_tao)) + field('Ngày tạo', esc(toDateTimeView(d.created))) +
      field('Nhà cung cấp', esc(d.ncc_ten)) + field('Bên nhận tiền', payeeText(d)) + field('Số hoá đơn', d.so_hoa_don ? esc(d.so_hoa_don) : '') + field('Đề nghị thanh toán', deNghiDetail(d)) +
      field('Số lít', lit(d.so_lit) + ' lít') + field('Đơn giá (chưa VAT)', money(d.don_gia) + ' đ') + field('Tổng tiền', money(d.tong_truoc_vat) + ' đ') +
      field('VAT', esc(lit(d.vat_percent)) + '% · ' + money(d.tong_vat) + ' đ') + field('Tổng tiền sau VAT', '<strong>' + money(d.tong_sau_vat) + ' đ</strong>') + field('Ghi chú', d.ghi_chu ? esc(d.ghi_chu) : '') +
      '</div>';
    html += '<div class="fw-semibold mt-4 mb-2">Lịch sử trạng thái</div><ul class="list-unstyled mb-0">';
    var hist = d.lich_su || [];
    for (var k = 0; k < hist.length; k++) {
      html += '<li class="d-flex gap-2 mb-2"><i class="ti tabler-history text-muted dd-history-icon"></i><span class="small text-muted" style="width:118px;flex-shrink:0;">' + esc(toDateTimeView(hist[k].at)) +
        '</span><span class="small dd-history-text">' + esc(hist[k].text) + (hist[k].nguoi ? ' <span class="text-muted">· ' + esc(hist[k].nguoi) + '</span>' : '') + '</span></li>';
    }
    html += '</ul>';
    $('#dd-view-body').html(html);
    $('#dd-view-ma').text(d.ma_phieu);
    $('#dd-view-status').html(statusBadge(d));
  }

  function openView(id) {
    $('#dd-view-loading').show();
    $('#dd-view-body').html('');
    modalOf('dd-view-modal').show();
    call('GET', API + '/' + id, null, function (d) {
      renderDetail(d);
      $('#dd-view-loading').hide();
    }, function (jqXHR) {
      $('#dd-view-loading').hide();
      toast(apiMsg(jqXHR), false);
    });
  }

  /* ─────────── Tạo / sửa ─────────── */

  var datePicker = null;

  function initFormDate() {
    if (datePicker || typeof flatpickr === 'undefined') return;
    datePicker = flatpickr(document.getElementById('dd-m-ngay'), { dateFormat: 'd/m/Y', allowInput: true, static: true });
  }

  function setSelect(sel, val) {
    var $s = $(sel);
    $s.val(val ? String(val) : '');
    if ($.fn.select2 && $s.data('select2')) $s.trigger('change');
  }

  function calcTotals() {
    var l = decimal($('#dd-m-lit').val());
    var g = digits($('#dd-m-dg').val());
    var vat = Math.max(0, Math.min(100, decimal($('#dd-m-vat').val())));
    // Cùng công thức với dòng chi phí kế hoạch: làm tròn về đồng ở từng bước.
    var truoc = Math.round(g * l);
    var sau = Math.round(truoc * (1 + vat / 100));
    $('#dd-m-tong').val(money(truoc));
    $('#dd-m-tvat').val(money(sau - truoc));
    $('#dd-m-sau').val(money(sau));
  }

  // Đọc/ghi thẳng thuộc tính DOM: attr('checked') trả về khác nhau giữa các bản jQuery.
  function payeeSame() { return !!document.getElementById('dd-m-same').checked; }

  function setPayeeDisabled(on) {
    var $p = $('#dd-m-payee');
    if (on) $p.attr('disabled', 'disabled'); else $p.removeAttr('disabled');
  }

  // Trùng bên phát hành: ô bên nhận khoá và tự điền theo nhà cung cấp; bỏ tick thì mở ra để chọn.
  function syncPayee(clear) {
    var ncc = parseInt($('#dd-m-ncc').val(), 10) || 0;
    if (payeeSame()) {
      setSelect('#dd-m-payee', ncc ? 'ncc|' + ncc : '');
      setPayeeDisabled(true);
    } else {
      setPayeeDisabled(false);
      if (clear) setSelect('#dd-m-payee', '');
    }
    $('#dd-m-payee').removeClass('is-invalid');
  }

  function resetFormErrors() {
    $('#dd-form .is-invalid').removeClass('is-invalid');
    $('#dd-form-error').addClass('d-none').text('');
  }

  function fillForm(d) {
    $('#dd-m-ngay').val(d ? toView(d.ngay_do) : toViewDateObj(new Date()));
    if (datePicker) datePicker.setDate($('#dd-m-ngay').val(), false, 'd/m/Y');
    setSelect('#dd-m-dk', d ? d.nid_phuong_tien : '');
    setSelect('#dd-m-lx', d ? d.nid_lai_xe : '');
    setSelect('#dd-m-ncc', d ? d.nid_ncc : '');
    $('#dd-m-hd').val(d ? d.so_hoa_don : '');
    var b = d && d.ben_nhan_tien ? d.ben_nhan_tien : null;
    var same = !b || !b.khac_ben_phat_hanh;
    document.getElementById('dd-m-same').checked = same;
    syncPayee(false);
    if (!same) setSelect('#dd-m-payee', b.loai + '|' + b.id);
    $('#dd-m-km').val(d && d.so_cong_to_met !== null ? money(d.so_cong_to_met) : '');
    $('#dd-m-lit').val(d ? lit(d.so_lit) : '');
    $('#dd-m-dg').val(d ? money(d.don_gia) : '');
    $('#dd-m-vat').val(d ? lit(d.vat_percent) : '');
    $('#dd-m-gc').val(d ? d.ghi_chu : '');
    calcTotals();
  }

  function openCreate() {
    state.editId = 0;
    resetFormErrors();
    $('#dd-form-title').text('Tạo phiếu đổ dầu');
    $('#dd-form-ma').hide();
    $('#dd-form-reject').addClass('d-none');
    modalOf('dd-form-modal').show();
    initFormDate();
    $('#dd-form-loading').show();
    loadOptions(function () {
      fillForm(null);
      $('#dd-form-loading').hide();
    });
  }

  function openEdit(id) {
    state.editId = id;
    resetFormErrors();
    closeMenu();
    $('#dd-form-title').text('Sửa phiếu đổ dầu');
    $('#dd-form-ma').text(state.items[id] ? state.items[id].ma_phieu : '').show();
    $('#dd-form-reject').addClass('d-none');
    modalOf('dd-form-modal').show();
    initFormDate();
    $('#dd-form-loading').show();
    loadOptions(function () {
      call('GET', API + '/' + id, null, function (d) {
        fillForm(d);
        $('#dd-form-ma').text(d.ma_phieu);
        if (d.trang_thai === 'tu_choi' && d.ly_do_tu_choi) {
          $('#dd-form-reject').removeClass('d-none').html('<strong>Lý do từ chối:</strong> ' + esc(d.ly_do_tu_choi));
        }
        $('#dd-form-loading').hide();
      }, function (jqXHR) {
        $('#dd-form-loading').hide();
        modalOf('dd-form-modal').hide();
        toast(apiMsg(jqXHR), false);
      });
    });
  }

  // Trả về body gửi API hoặc null (đã đánh dấu ô lỗi).
  function collectForm() {
    var ok = true;
    function bad(sel) { $(sel).addClass('is-invalid'); ok = false; }
    resetFormErrors();
    var ngay = toApi($('#dd-m-ngay').val());
    if (!ngay) bad('#dd-m-ngay');
    var dk = parseInt($('#dd-m-dk').val(), 10) || 0;
    var lx = parseInt($('#dd-m-lx').val(), 10) || 0;
    var ncc = parseInt($('#dd-m-ncc').val(), 10) || 0;
    var hd = $.trim($('#dd-m-hd').val());
    var payee = $('#dd-m-payee').val() || '';
    var l = decimal($('#dd-m-lit').val());
    var g = digits($('#dd-m-dg').val());
    if (!dk) bad('#dd-m-dk');
    if (!lx) bad('#dd-m-lx');
    if (!ncc) bad('#dd-m-ncc');
    if (!payeeSame() && !payee) bad('#dd-m-payee');
    if (!(l > 0)) bad('#dd-m-lit');
    if (!(g > 0)) bad('#dd-m-dg');
    if (!ok) {
      $('#dd-form-error').removeClass('d-none').text('Vui lòng nhập đủ các trường bắt buộc.');
      return null;
    }
    var km = $.trim($('#dd-m-km').val());
    var body = {
      ngay_do: ngay, nid_phuong_tien: dk, nid_lai_xe: lx, nid_ncc: ncc, so_hoa_don: hd,
      ben_nhan_tien_trung: payeeSame(),
      so_cong_to_met: km === '' ? '' : digits(km),
      so_lit: Math.round(l * 100) / 100, don_gia: g,
      vat_percent: Math.max(0, Math.min(100, decimal($('#dd-m-vat').val()))),
      ghi_chu: $.trim($('#dd-m-gc').val())
    };
    if (!payeeSame()) {
      var cut = payee.indexOf('|');
      body.loai_ben_nhan_tien = payee.slice(0, cut);
      body.id_ben_nhan_tien = parseInt(payee.slice(cut + 1), 10);
    }
    return body;
  }

  function submitForm() {
    if (state.saving) return;
    var body = collectForm();
    if (!body) return;
    state.saving = true;
    $('#dd-form-save').attr('disabled', 'disabled');
    var editing = !!state.editId;
    call(editing ? 'PUT' : 'POST', editing ? API + '/' + state.editId : API, body, function () {
      state.saving = false;
      $('#dd-form-save').removeAttr('disabled');
      modalOf('dd-form-modal').hide();
      toast(editing ? 'Cập nhật thành công' : 'Tạo mới thành công');
      if (!editing) state.tab = 'all';
      reloadFirstPage();
    }, function (jqXHR) {
      state.saving = false;
      $('#dd-form-save').removeAttr('disabled');
      $('#dd-form-error').removeClass('d-none').text(apiMsg(jqXHR));
    });
  }

  /* ─────────── Xoá ─────────── */

  function openDelete(id) {
    var item = state.items[id];
    if (!item) return;
    state.deleteId = id;
    closeMenu();
    $('#dd-delete-title').text('Xoá phiếu ' + item.ma_phieu + '?');
    $('#dd-delete-text').text('Phiếu đổ dầu ' + item.bks + ' ngày ' + toView(item.ngay_do) + ' sẽ bị xoá và không thể khôi phục.');
    modalOf('dd-delete-modal').show();
  }

  function confirmDelete() {
    var id = state.deleteId, item = state.items[id];
    $('#dd-delete-confirm').attr('disabled', 'disabled');
    call('DELETE', API + '/' + id, null, function () {
      $('#dd-delete-confirm').removeAttr('disabled');
      modalOf('dd-delete-modal').hide();
      toast('Đã xoá phiếu ' + (item ? item.ma_phieu : ''));
      loadList();
    }, function (jqXHR) {
      $('#dd-delete-confirm').removeAttr('disabled');
      toast(apiMsg(jqXHR), false);
    });
  }

  /* ─────────── Khởi tạo ─────────── */

  function bind() {
    if (perms.create) $('#dd-btn-create').show().bind('click', openCreate);

    $('#dd-btn-search').bind('click', applyFilters);
    $('#dd-btn-reset').bind('click', function () {
      $('#dd-f-q').val('');
      setSelect('#dd-f-dk', ''); setSelect('#dd-f-lx', ''); setSelect('#dd-f-ncc', '');
      state.filters = { keyword: '', nid_phuong_tien: '', nid_lai_xe: '', nid_ncc: '' };
      clearRange();
      state.range = readRange();
      reloadFirstPage();
    });
    $('#dd-f-q').bind('keydown', function (e) { if (e.which === 13) applyFilters(); });

    $('#dd-tabs').delegate('[data-tab]', 'click', function () {
      state.tab = $(this).attr('data-tab');
      reloadFirstPage();
    });
    $('#dd-pagination').delegate('[data-page]', 'click', function (e) {
      e.preventDefault();
      var p = parseInt($(this).attr('data-page'), 10);
      if (!p || p < 1 || $(this).parent().hasClass('disabled')) return;
      state.page = p;
      loadList();
    });
    $('#dd-pagination-jump').bind('keydown', function (e) {
      if (e.which !== 13) return;
      var p = parseInt($(this).val(), 10);
      var total = parseInt($(this).attr('data-total-pages'), 10) || 1;
      if (p > 0) { state.page = Math.min(p, total); loadList(); }
    });

    $('#dd-tbody').delegate('[data-act]', 'click', function (e) {
      e.stopPropagation();
      runAction(parseInt($(this).attr('data-id'), 10), $(this).attr('data-act'));
    });
    $('#dd-tbody').delegate('[data-menu-open]', 'click', function (e) {
      e.stopPropagation();
      openMenu(parseInt($(this).attr('data-menu-open'), 10), e.clientX, e.clientY);
    });
    $('#dd-tbody').delegate('tr', 'contextmenu', function (e) {
      var id = parseInt($(this).attr('data-id'), 10);
      if (!id) return;
      e.preventDefault();
      openMenu(id, e.clientX, e.clientY);
    });
    // Double-click dòng: mở modal Sửa nếu phiếu còn sửa được, không thì mở Xem chi tiết. Cùng cơ chế với /ke-hoach-xep-xe
    // (bỏ qua khi double-click trúng nút/link/ô nhập trong dòng, tránh xung đột với thao tác của chính phần tử đó).
    $('#dd-tbody').delegate('tr', 'dblclick', function (e) {
      if (isRowInteractiveTarget(e.target)) return;
      var id = parseInt($(this).attr('data-id'), 10);
      var item = id && state.items[id];
      if (!item) return;
      closeMenu();
      if (item.co_the_sua) openEdit(id); else openView(id);
    });
    $(document).bind('click', closeMenu);
    $(document).bind('keydown', function (e) { if (e.which === 27) closeMenu(); });
    $('#dd-menu').delegate('[data-menu]', 'click', function (e) {
      e.stopPropagation();
      if ($(this).hasClass('disabled')) return;
      var act = $(this).attr('data-menu'), id = state.menuId;
      closeMenu();
      if (act === 'view') openView(id);
      if (act === 'edit') openEdit(id);
      if (act === 'delete') openDelete(id);
    });

    $('#dd-form').bind('submit', function (e) { e.preventDefault(); submitForm(); });
    $('#dd-m-lit, #dd-m-vat').bind('keyup change', calcTotals);
    $('#dd-m-dg').bind('keyup change', function () {
      var n = digits($(this).val());
      $(this).val(n ? money(n) : '');
      calcTotals();
    });
    $('#dd-m-km').bind('keyup change', function () {
      var n = digits($(this).val());
      $(this).val(n ? money(n) : '');
    });
    // Chọn đầu kéo có lái xe được gán thì tự điền lái xe (vẫn chọn lại được).
    $('#dd-m-dk').bind('change', function () {
      var truck = truckById(parseInt($(this).val(), 10) || 0);
      if (truck && truck.nid_lai_xe) setSelect('#dd-m-lx', truck.nid_lai_xe);
    });
    $('#dd-m-ncc').bind('change', function () { if (payeeSame()) syncPayee(false); });
    $('#dd-m-same').bind('change', function () { syncPayee(true); });
    $('#dd-reject-confirm').bind('click', confirmReject);
    $('#dd-delete-confirm').bind('click', confirmDelete);
  }

    return {
      start: function () {
        // Drupal.settings có thể CHƯA có lúc file JS chạy (thứ tự nạp script), nên chỉ đọc khi trang khởi tạo.
        settings = (Drupal.settings && Drupal.settings.do_dau) || {};
        perms = settings.permissions || {};
        bind();
        initPicker();
        state.range = readRange();
        loadOptions(function () {});
        loadList();
      }
    };
  }

  Drupal.behaviors.doDau = {
    attach: function (context) {
      var $ = pickJq();
      if (!$ || !$('#dd-app', context).length || $('#dd-app').data('ddInit')) return;
      $('#dd-app').data('ddInit', true);
      DoDau($).start();
    }
  };

})(Drupal);

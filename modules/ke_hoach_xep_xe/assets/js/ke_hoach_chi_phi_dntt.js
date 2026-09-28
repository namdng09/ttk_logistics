/**
 * Tab Chi phí kế hoạch HÀNG CẢNG — phần mở rộng "đề nghị thanh toán".
 *
 * Chỉ được nạp ở màn hàng cảng (ke_hoach_xep_xe_page_list → _ke_hoach_hang_cang_add_dntt_assets) và chỉ khi
 * module de_nghi_thanh_toan được bật + người dùng có quyền xem. Đăng ký vào điểm mở rộng
 * Drupal.keHoachChiPhi.extension của ke_hoach_chi_phi.js nên tuyến xa không bị ảnh hưởng.
 *
 * Bổ sung: cột Nhà cung cấp (nid_ncc), cột Bên nhận tiền (mặc định trùng NCC, chọn khác qua popup tìm kiếm), cột checkbox chọn dòng, cột trạng thái đề nghị thanh toán (đẩy/thu hồi/
 * gửi lại/rút khỏi đề nghị), thanh công cụ "Tạo đề nghị thanh toán", nhóm tóm tắt ở Tổng quan, khoá ô nhập với
 * dòng đã nộp duyệt. Toàn bộ trạng thái/hành động hợp lệ do server (module de_nghi_thanh_toan) trả về.
 */
(function ($, Drupal, window, document) {
  'use strict';

  // Phiên bản file: ke_hoach_chi_phi_dntt:v2 (đọc settings và tìm core trong behavior, không đọc lúc nạp file).
  // Lý do: thứ tự nạp script/khai báo Drupal.settings không được đảm bảo so với file này.
  var cfg = {};
  var perms = {};
  var core = null;

  var API = '/api/de-nghi-thanh-toan';
  var LX = 'lai_xe_tu_chiu';
  // Loại dòng KHÔNG thuộc bảng "Chi phí vận hành" (nằm ở card khác: Lương lái xe theo chuyến, Doanh thu khách hàng) —
  // dùng để đếm số dòng hiện trong bảng này, giống danh sách renderTable() lọc ở ke_hoach_chi_phi.js.
  var DRIVER_SALARY_TYPE = 'luong_lai_xe';
  var REVENUE_TYPE = 'doanh_thu';
  var STATUS_CLASS = {
    nhap: 'bg-label-secondary',
    cho_duyet: 'bg-label-warning',
    cho_duyet_thanh_toan: 'bg-label-warning',
    cho_thanh_toan: 'bg-label-primary',
    hoan_thanh: 'bg-label-success',
    tu_choi: 'bg-label-danger',
    tu_choi_thanh_toan: 'bg-label-danger'
  };

  // Nút hành động cột "Đề nghị thanh toán": cùng icon/màu với màn /de-nghi-thanh-toan (ACTION_ICON trong
  // de_nghi_thanh_toan.js) để nút rõ ràng là bấm được, không lẫn với chữ mô tả cạnh nó.
  var ACTION_STYLE = {
    'thu-hoi': { icon: 'tabler-history', cls: 'btn-label-secondary' },
    'gui-duyet': { icon: 'tabler-send', cls: 'btn-primary' },
    'rut-dong': { icon: 'tabler-unlink', cls: 'btn-label-danger' }
  };

  var selected = {};
  var options = null;
  var optionsAt = 0;
  var optionsLoading = false;
  var optionsCallbacks = [];
  var dialog = { rows: [], choice: 'new', tried: false };
  var modalInstance = null;

  function esc(v) { return core.escHtml(v); }
  function money(v) { return core.formatMoney(v); }
  function rowsOf() { return core.state.rows || []; }
  function applicable(row) { return row.loai_chi_phi === 'tinh_cho_khach' || row.loai_chi_phi === 'cong_ty_chi_tra'; }
  function selectable(row) { return !!perms.create && applicable(row) && row.nid > 0 && !row.nid_de_nghi; }

  // Ảnh chụp các trường ảnh hưởng tới đề nghị, để biết dòng đã sửa chưa lưu (tránh lưu + tải lại vô ích).
  function snapshotOf(row) {
    return JSON.stringify([row.loai_chi_phi, row.ten_chi_phi, row.don_gia, row.so_luong, row.vat_percent, row.tong_truoc_vat, row.tong_sau_vat, row.ghi_chu || '', row.nid_ncc || 0, row.loai_ben_nhan_tien || '', row.id_ben_nhan_tien || 0, row.so_hoa_don || '', row.ngay_hoa_don || '']);
  }

  function isDirty(row) {
    return row._snap !== snapshotOf(row);
  }

  function selectedRows() {
    return $.grep(rowsOf(), function (row) { return selected[row.nid] && selectable(row); });
  }

  // Số dòng đang có trong bảng "Chi phí vận hành" (badge cạnh tiêu đề card): mọi dòng KH/CT/LX đã nhập tên, trừ
  // dòng trống (mẫu chờ nhập) và các loại thuộc card khác (lương lái xe theo chuyến, doanh thu khách hàng).
  function operatingCostCount() {
    return $.grep(rowsOf(), function (row) {
      return row.loai_chi_phi !== DRIVER_SALARY_TYPE && row.loai_chi_phi !== REVENUE_TYPE && String(row.ten_chi_phi || '').trim() !== '';
    }).length;
  }

  /* ─────────── Tuỳ chọn (NCC, nhân viên, lái xe chuyến) ─────────── */

  // Danh sách NCC / nhân viên / lái xe không phụ thuộc kế hoạch nên gọi 1 lần cho cả trang (giữ 10 phút, F5 tải mới).
  // "Lái xe của chuyến" suy ra từ lai_xe_ds theo lái xe của kế hoạch đang mở (xem tripDriver), không gọi lại theo từng lái xe.
  var OPTIONS_TTL_MS = 10 * 60 * 1000;

  function ensureOptions(cb) {
    if (options && new Date().getTime() - optionsAt < OPTIONS_TTL_MS) { cb(options); return; }
    optionsCallbacks.push(cb);
    if (optionsLoading) return;
    optionsLoading = true;
    $.ajax({
      url: API + '/tuy-chon', type: 'GET', dataType: 'json',
      success: function (res) { options = (res && res.data) || { ncc: [], nhan_vien: [], lai_xe_ds: [] }; optionsAt = new Date().getTime(); },
      error: function (jqXHR) { options = { ncc: [], nhan_vien: [], lai_xe_ds: [] }; optionsAt = 0; core.notify(core.apiMsg(jqXHR), 'error'); },
      complete: function () {
        optionsLoading = false;
        var cbs = optionsCallbacks.splice(0);
        for (var i = 0; i < cbs.length; i++) cbs[i](options);
      }
    });
  }

  /* Lái xe của kế hoạch đang mở (nid, ten, sdt, uid tài khoản) hoặc NULL. */
  function tripDriver() {
    var id = Number(core.state.nidLaiXe) || 0;
    var list = (options && options.lai_xe_ds) || [];
    if (!id) return null;
    for (var i = 0; i < list.length; i++) {
      if (Number(list[i].nid) === id) return list[i];
    }
    return null;
  }

  /* Nhân viên ứng tiền: danh sách của server (đã bỏ tài khoản lái xe) cộng thêm tài khoản của lái xe chuyến này. */
  function staffOptions() {
    var staff = ((options && options.nhan_vien) || []).slice();
    var lx = tripDriver();
    if (lx && lx.uid) {
      var found = false;
      for (var i = 0; i < staff.length; i++) if (Number(staff[i].uid) === Number(lx.uid)) found = true;
      if (!found) {
        staff.push({ uid: lx.uid, ten: lx.ten, sdt: lx.sdt || '' });
        staff.sort(function (a, b) { return String(a.ten).localeCompare(String(b.ten), 'vi'); });
      }
    }
    return staff;
  }

  /* ─────────── HTML từng ô ─────────── */

  function leadInner(row) {
    if (!selectable(row)) return '';
    return '<input type="checkbox" class="khcp-dntt-check" data-nid="' + row.nid + '"' + (selected[row.nid] ? ' checked' : '') + '>';
  }

  function nccInner(row) {
    return '<select class="form-select form-select-sm khcp-ncc-select" data-placeholder="Chọn NCC">' +
      '<option value="' + (row.nid_ncc || '') + '" selected>' + esc(row.ncc_ten || '') + '</option></select>';
  }

  /* ─────────── Hoá đơn của dòng (số + ngày) ─────────── */

  // Ngày API (YYYY-MM-DD) <-> hiển thị (dd/mm/yyyy) — cùng quy tắc với de_nghi_thanh_toan.js/do_dau.js.
  function toView(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }

  // Dòng "Lái xe chi trả" không tham gia đề nghị thanh toán nên hoá đơn không có ý nghĩa — ẩn hẳn 2 ô, giống cột Bên nhận tiền.
  function hoaDonInner(row) {
    if (!payeeApplies(row)) {
      return '<span class="small text-muted">—</span>';
    }
    return '<input type="text" class="form-control form-control-sm khcp-hd-input mb-1" placeholder="Số hoá đơn" maxlength="50" value="' + esc(row.so_hoa_don || '') + '" data-hd-field="so_hoa_don">' +
      '<input type="text" class="form-control form-control-sm khcp-hd-input khcp-hd-date" placeholder="dd/mm/yyyy" autocomplete="off" value="' + esc(toView(row.ngay_hoa_don)) + '" data-hd-field="ngay_hoa_don">';
  }

  /* ─────────── Bên nhận tiền ─────────── */

  var KIND_LABEL = { ncc: 'NCC', nhan_vien: 'Nhân viên', lai_xe: 'Lái xe' };
  var KIND_ICON = { ncc: 'ti tabler-building-store', nhan_vien: 'ti tabler-user', lai_xe: 'ti tabler-steering-wheel' };
  var payeePop = { target: null, q: '', items: {} };
  var payeeSuggest = null;

  // Chọn bên nhận được ngay cả khi dòng chưa lưu hoặc chưa chọn loại chi trả; chỉ dòng "Lái xe chi trả" không áp dụng.
  function payeeApplies(row) { return row.loai_chi_phi !== LX; }
  function payeeEditable(row) { return payeeApplies(row) && !row.khoa_sua && !row.nid_de_nghi; }

  /* Bên nhận hiệu lực: chọn riêng thì theo lựa chọn, không thì trùng nhà cung cấp của dòng (đi theo khi đổi NCC). */
  function payeeOf(row) {
    if (!payeeApplies(row)) return null;
    if (row.loai_ben_nhan_tien && row.id_ben_nhan_tien) {
      return { loai: row.loai_ben_nhan_tien, id: Number(row.id_ben_nhan_tien), ten: row.ben_nhan_ten || lookupPayeeName(row.loai_ben_nhan_tien, row.id_ben_nhan_tien), manual: true };
    }
    if (row.nid_ncc) return { loai: 'ncc', id: Number(row.nid_ncc), ten: row.ncc_ten || '', manual: false };
    return null;
  }

  function payeeKey(p) { return p ? p.loai + '|' + p.id : ''; }

  function lookupPayeeName(loai, id) {
    var list = !options ? [] : (loai === 'ncc' ? options.ncc : (loai === 'nhan_vien' ? options.nhan_vien : options.lai_xe_ds)) || [];
    for (var i = 0; i < list.length; i++) {
      if ((list[i].nid || list[i].uid) === Number(id)) return list[i].ten;
    }
    return '';
  }

  function payeeInner(row) {
    var p = payeeOf(row);
    var name = p ? (p.ten || ('#' + p.id)) : '';
    var cls = !p ? 'is-empty' : (p.manual ? 'is-other' : 'is-auto');
    var tag = !p ? '' : (p.manual ? '<span class="khcp-mini ' + p.loai + '">' + KIND_LABEL[p.loai] + '</span>' : '<span class="khcp-mini auto">trùng NCC</span>');
    // Dòng LX hoặc dòng đã thuộc đề nghị: vẫn là ô nhập nhưng disable (không icon khoá, không chữ giải thích).
    var off = !payeeEditable(row);
    return '<button type="button" class="khcp-payee-btn ' + cls + '"' + (off ? ' disabled' : '') + '><span class="khcp-payee-name">' + esc(name || (off ? '' : 'Chọn bên nhận…')) + '</span>' + tag +
      '<i class="ti tabler-chevron-down khcp-payee-caret"></i></button>';
  }

  function statusInner(row) {
    if (row.loai_chi_phi === LX) return '<span class="small text-muted">Không áp dụng (LX tự chịu)</span>';
    if (!applicable(row)) return '';
    if (!row.nid) return '<span class="small text-muted">Lưu để đẩy vào ĐNTT</span>';
    var dn = row.de_nghi;
    if (row.nid_de_nghi && dn) {
      // Dòng 1: trạng thái + mã đề nghị/hoá đơn (bên nhận tiền đã có cột riêng, không lặp lại ở đây).
      // Chỉ mã đề nghị: số hoá đơn xem ở màn /de-nghi-thanh-toan hoặc modal chi tiết, không cần lặp ở đây.
      var html = '<div class="d-flex align-items-center flex-wrap gap-1"><span class="badge ' + (STATUS_CLASS[dn.trang_thai] || 'bg-label-secondary') + '">' + esc(dn.trang_thai_label) + '</span>' +
        '<span class="small text-muted">' + esc(dn.ma_de_nghi) + '</span></div>';
      // Dòng 2: nút hành động — cùng class/icon với màn /de-nghi-thanh-toan để rõ là bấm được, không lẫn với chữ mô tả.
      var acts = dn.hanh_dong || [];
      html += '<div class="d-flex align-items-center flex-wrap gap-1 mt-1">';
      for (var i = 0; i < acts.length; i++) {
        var meta = ACTION_STYLE[acts[i].key] || { icon: 'tabler-point', cls: 'btn-label-secondary' };
        html += '<button type="button" class="btn btn-sm ' + meta.cls + ' khcp-act khcp-dntt-act" data-act="' + esc(acts[i].key) +
          '" data-dn="' + dn.nid + '" data-nid="' + row.nid + '"><i class="ti ' + meta.icon + '"></i> ' + esc(acts[i].label) + '</button>';
      }
      html += '<a class="btn btn-sm btn-label-info khcp-act" target="_blank" href="' + esc(cfg.page_url || '/de-nghi-thanh-toan') + '#xem-' + dn.nid + '"><i class="ti tabler-eye"></i> Xem</a></div>';
      if ((dn.trang_thai === 'tu_choi' || dn.trang_thai === 'tu_choi_thanh_toan') && dn.ly_do_tu_choi) {
        html += '<div class="small mt-1 text-danger">Lý do: ' + esc(dn.ly_do_tu_choi) + '</div>';
      }
      return html;
    }
    if (row.nid_de_nghi) return '<span class="small text-muted">Đề nghị #' + row.nid_de_nghi + '</span>';
    if (!perms.create) return '<span class="small text-muted">Chưa gộp</span>';
    return '<button type="button" class="btn btn-sm btn-primary khcp-act khcp-dntt-push-one" data-nid="' + row.nid + '"><i class="ti tabler-receipt-2"></i> Đẩy vào ĐNTT</button>';
  }

  /* ─────────── Dựng khung (header, toolbar, tổng quan) ─────────── */

  function ensureHeader() {
    $('.khcp-main-card thead tr').each(function () {
      var $tr = $(this);
      if ($tr.find('.khcp-th-check').length) return;
      $tr.prepend('<th class="khcp-col-check khcp-th-check"><input type="checkbox" class="khcp-dntt-check-all" title="Chọn tất cả dòng cùng nhà cung cấp"></th>');
      $tr.find('.khcp-col-name').after('<th class="khcp-col-ncc">Nhà cung cấp</th>');
      $tr.find('.khcp-col-ncc').after('<th class="khcp-col-hd">Hoá đơn</th>');
      $tr.find('.khcp-col-hd').after('<th class="khcp-col-payee">Bên nhận tiền</th>');
      $tr.find('.khcp-col-action').before('<th class="khcp-col-dntt">Đề nghị thanh toán</th>');
    });
    $('.khcp-main-card').addClass('khcp-has-dntt');
  }

  function ensureToolbar() {
    if ($('#khcp-dntt-toolbar').length) return;
    var $card = $('.khcp-main-card').first();
    if (!$card.length) return;
    var html = '<div id="khcp-dntt-toolbar" class="khcp-dntt-toolbar d-flex justify-content-between align-items-center">' +
      '<span class="d-flex align-items-center gap-2"><span class="khcp-section-title">Chi phí vận hành</span>' +
      '<span class="badge rounded-pill bg-label-primary border" id="khcp-dntt-count">0</span></span><div class="d-flex align-items-center gap-2">' +
      (perms.create ? '<button type="button" class="btn btn-sm btn-label-primary" id="khcp-payee-bulk-btn" disabled><i class="ti tabler-user-dollar me-1"></i>Gán bên nhận tiền</button>' : '') +
      (perms.create ? '<button type="button" class="btn btn-sm btn-primary" id="khcp-dntt-create-btn" disabled><i class="ti tabler-receipt-2 me-1"></i>Tạo đề nghị thanh toán</button>' : '') +
      (perms.create ? '<button type="button" class="btn btn-sm btn-label-success" id="khcp-dntt-add-btn"><i class="ti tabler-circle-plus me-1"></i>Thêm chi phí</button>' : '') + '</div></div>' +
      '<div id="khcp-payee-tools" class="khcp-payee-tools d-none"><div id="khcp-payee-groups"></div><div id="khcp-payee-suggest"></div></div>';
    $card.prepend(html);
  }

  function ensureSummary() {
    if ($('#khcp-dntt-summary').length) return;
    var $body = $('.khcp-summary-card .card-body').first();
    if (!$body.length) return;
    $body.append('<div class="khcp-summary-group" id="khcp-dntt-summary"><div class="khcp-summary-group-title">Đề nghị thanh toán</div>' +
      '<div class="khcp-summary-row"><span>Chưa gộp</span><strong id="khcp-dntt-sum-chua">0</strong></div>' +
      '<div class="khcp-summary-row"><span>Đang xử lý</span><strong id="khcp-dntt-sum-dang">0</strong></div>' +
      '<div class="khcp-summary-row"><span>Đã thanh toán</span><strong id="khcp-dntt-sum-xong" style="color:#29845a;">0</strong></div></div>');
  }

  /* ─────────── Card "Tổng hợp chi phí" ở cột bên (giữa Tóm tắt xếp xe và Kiểm tra trước khi lưu) ─────────── */

  var lastSummary = { total: 0, customer: 0, company: 0, driver_self: 0 };

  function cardMoney(value) {
    return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(value) || 0) + 'đ';
  }

  function cardRow(label, id, extraClass) {
    return '<div class="khxh-summary-row"><div class="khxh-summary-key">' + label + '</div><div class="khxh-summary-value' + (extraClass ? ' ' + extraClass : '') + '" id="' + id + '">0đ</div></div>';
  }

  function ensureCostCard() {
    if ($('#khcp-cost-card').length) return;
    var $first = $('.khxh-hang-cang-side-sticky .khxh-side-card').first();
    if (!$first.length) return;
    $first.after('<div class="khxh-side-card mt-3" id="khcp-cost-card">' +
      '<div class="khxh-side-title">Tổng hợp chi phí</div>' +
      '<div class="khxh-summary-list">' +
        cardRow('Tổng chi phí', 'khcp-card-total') +
        cardRow('Chi hộ khách hàng', 'khcp-card-customer') +
        cardRow('Công ty chi trả', 'khcp-card-company') +
        cardRow('Lái xe tự chịu', 'khcp-card-driver') +
        '<div class="khcp-card-group">Đề nghị thanh toán</div>' +
        cardRow('Chưa gộp', 'khcp-card-chua') +
        cardRow('Đang xử lý', 'khcp-card-dang') +
        cardRow('Đã thanh toán', 'khcp-card-xong', 'khcp-card-paid') +
      '</div></div>');
    syncCardVisibility();
  }

  /* Card chỉ hiện khi đang ở tab Chi phí (cột bên dùng chung với tab Thông tin xếp xe). */
  function syncCardVisibility() {
    var $pane = $('#khxh-hang-cang-cost-mount').closest('.khxh-hang-cang-tab-pane');
    var show = $pane.length ? !$pane.hasClass('d-none') : true;
    $('#khcp-cost-card').toggleClass('d-none', !show);
  }

  function updateCostCard() {
    if (!$('#khcp-cost-card').length) return;
    var chua = 0, dang = 0, xong = 0;
    $.each(rowsOf(), function (_, row) {
      if (!applicable(row) || !row.nid) return;
      var amount = Number(row.tong_sau_vat) || 0;
      if (!row.nid_de_nghi) chua += amount;
      else if ((row.de_nghi && row.de_nghi.trang_thai) === 'hoan_thanh' || row.trang_thai_duyet === 'hoan_thanh') xong += amount;
      else dang += amount;
    });
    $('#khcp-card-total').text(cardMoney(lastSummary.total));
    $('#khcp-card-customer').text(cardMoney(lastSummary.customer));
    $('#khcp-card-company').text(cardMoney(lastSummary.company));
    $('#khcp-card-driver').text(cardMoney(lastSummary.driver_self));
    $('#khcp-card-chua').text(cardMoney(chua));
    $('#khcp-card-dang').text(cardMoney(dang));
    $('#khcp-card-xong').text(cardMoney(xong));
  }

  function updateSummary() {
    updateCostCard();
    var chua = 0, dang = 0, xong = 0;
    $.each(rowsOf(), function (_, row) {
      if (!applicable(row) || !row.nid) return;
      var amount = Number(row.tong_sau_vat) || 0;
      if (!row.nid_de_nghi) chua += amount;
      else if ((row.de_nghi && row.de_nghi.trang_thai) === 'hoan_thanh' || row.trang_thai_duyet === 'hoan_thanh') xong += amount;
      else dang += amount;
    });
    $('#khcp-dntt-sum-chua').text(money(chua));
    $('#khcp-dntt-sum-dang').text(money(dang));
    $('#khcp-dntt-sum-xong').text(money(xong));
  }

  function updateToolbar() {
    $('#khcp-dntt-count').text(operatingCostCount());
    var list = selectedRows();
    var sum = 0;
    $.each(list, function (_, r) { sum += Number(r.tong_sau_vat) || 0; });
    var $btn = $('#khcp-dntt-create-btn');
    $btn.prop('disabled', !list.length);
    $btn.attr('title', list.length ? 'Tổng sau VAT ' + money(sum) + ' đ' : 'Tick chọn dòng chi phí cần đẩy trước');
    $btn.html('<i class="ti tabler-receipt-2 me-1"></i>Tạo đề nghị thanh toán' + (list.length ? ' (' + list.length + ')' : ''));

    $('#khcp-payee-bulk-btn').prop('disabled', !$.grep(list, payeeEditable).length);
    renderPayeeTools();

    $('.khcp-dntt-check').each(function () {
      $(this).prop('checked', !!selected[parseInt($(this).data('nid'), 10)]);
    });
    var elig = eligibleIds();
    var allOn = elig.length > 0 && $.grep(elig, function (id) { return !selected[id]; }).length === 0;
    $('.khcp-dntt-check-all').prop('checked', allOn).prop('disabled', !elig.length);
  }

  function findByNid(nid) {
    var rows = rowsOf();
    for (var i = 0; i < rows.length; i++) if (rows[i].nid === nid) return rows[i];
    return null;
  }

  function eligibleIds() {
    var ids = [];
    $.each(rowsOf(), function (_, row) {
      if (selectable(row)) ids.push(row.nid);
    });
    return ids;
  }

  function toggleAll(on) {
    if (!on) { selected = {}; }
    else { $.each(eligibleIds(), function (_, id) { selected[id] = true; }); }
    updateToolbar();
  }

  /* ─────────── Khoá ô nhập ─────────── */

  function applyLocks() {
    $('#khcp-cost-table-body tr[data-row-key]').each(function () {
      var $tr = $(this);
      var row = core.getRow($tr.data('row-key'));
      if (!row) return;
      var locked = !!row.khoa_sua;
      var linked = !!row.nid_de_nghi;
      $tr.toggleClass('khcp-row-locked', locked);
      // setBusy(false) của core bật lại MỌI button trong tab, kể cả ô bên nhận đang disable (dòng LX / đã thuộc đề nghị);
      // chạy lại ở đây (afterBusy) để trả về đúng trạng thái. Đang busy thì core đã disable hết, không bật lên.
      $tr.find('.khcp-payee-btn').prop('disabled', !payeeEditable(row) || !!core.state.busy);
      if (locked) {
        $tr.find('.row-field, .khcp-cost-type-check, .cost-name-select, .khcp-ncc-select, .khcp-hd-input, .btn-delete-row').prop('disabled', true);
        $tr.attr('title', 'Đề nghị thanh toán đang xử lý — thu hồi đề nghị để sửa dòng này.');
      } else {
        $tr.removeAttr('title');
        if (linked) {
          $tr.find('.btn-delete-row').prop('disabled', true);
          $tr.find('.khcp-cost-type-check[data-cost-type="' + LX + '"]').prop('disabled', true);
        }
      }
    });
  }

  /* ─────────── Select2 NCC ─────────── */

  function initNccSelects() {
    ensureOptions(function (opts) {
      $('#khcp-cost-table-body .khcp-ncc-select').each(function () {
        var $s = $(this);
        var row = core.getRow($s.closest('tr').data('row-key'));
        if (!row) return;
        if ($s.data('select2')) $s.select2('destroy');
        var html = '<option value=""></option>';
        var found = false;
        var nccs = opts.ncc || [];
        for (var i = 0; i < nccs.length; i++) {
          var sel = nccs[i].nid === row.nid_ncc;
          if (sel) found = true;
          html += '<option value="' + nccs[i].nid + '"' + (sel ? ' selected' : '') + '>' + esc(nccs[i].ten) + '</option>';
        }
        if (!found && row.nid_ncc) html += '<option value="' + row.nid_ncc + '" selected>' + esc(row.ncc_ten || ('#' + row.nid_ncc)) + '</option>';
        $s.html(html);
        if ($.fn && $.fn.select2) {
          $s.select2({ placeholder: 'Chọn NCC', allowClear: true, width: '100%', dropdownParent: core.select2Parent() });
        }
      });
      applyLocks();
    });
  }

  function clearPayee(row) {
    row.loai_ben_nhan_tien = '';
    row.id_ben_nhan_tien = 0;
    row.ben_nhan_ten = '';
  }

  function refreshRow($tr, row) {
    if (!selectable(row)) delete selected[row.nid];
    // Server bỏ bên nhận của dòng "Lái xe chi trả"; đổi sang loại đó thì bỏ luôn để khớp với dữ liệu sau khi lưu.
    if (!payeeApplies(row) && row.loai_ben_nhan_tien) clearPayee(row);
    $tr.find('td.khcp-col-payee').html(payeeInner(row));
    $tr.find('td.khcp-col-check').html(leadInner(row));
    $tr.find('td.khcp-col-dntt').html(statusInner(row));
    updateToolbar();
    updateSummary();
  }

  /* ─────────── Popup chọn bên nhận tiền ─────────── */

  function payeeCandidates() {
    var out = { drivers: [], staff: [], nccs: [], trip: null };
    var o = options || {};
    $.each(o.lai_xe_ds || [], function (_, x) { out.drivers.push({ loai: 'lai_xe', id: x.nid, ten: x.ten, sdt: x.sdt || '' }); });
    $.each(o.nhan_vien || [], function (_, x) { out.staff.push({ loai: 'nhan_vien', id: x.uid, ten: x.ten, sdt: x.sdt || '' }); });
    $.each(o.ncc || [], function (_, x) { out.nccs.push({ loai: 'ncc', id: x.nid, ten: x.ten, sdt: x.sdt || '' }); });
    var trip = tripDriver();
    if (trip) {
      for (var i = 0; i < out.drivers.length; i++) if (out.drivers[i].id === trip.nid) out.trip = out.drivers[i];
    }
    return out;
  }

  function popTargetRows() {
    if (payeePop.target === 'bulk') return $.grep(selectedRows(), payeeEditable);
    var row = core.getRow(payeePop.target);
    return row && payeeEditable(row) ? [row] : [];
  }

  function popItemHtml(p, sub, active) {
    payeePop.items[payeeKey(p)] = p;
    return '<button type="button" class="khcp-payee-item' + (active ? ' is-active' : '') + '" data-key="' + esc(payeeKey(p)) + '">' +
      '<i class="' + KIND_ICON[p.loai] + '"></i><span class="khcp-payee-item-name">' + esc(p.ten) + '</span>' +
      '<span class="khcp-mini ' + p.loai + '">' + KIND_LABEL[p.loai] + '</span>' +
      '<span class="khcp-payee-item-sub">' + esc(sub || p.sdt || '') + '</span></button>';
  }

  function renderPayeeList() {
    var $list = $('#khcp-payee-list');
    if (!$list.length) return;
    var rows = popTargetRows();
    var single = payeePop.target !== 'bulk' && rows.length ? rows[0] : null;
    var cur = single && single.loai_ben_nhan_tien ? single.loai_ben_nhan_tien + '|' + single.id_ben_nhan_tien : '';
    var cand = payeeCandidates();
    var q = $.trim(payeePop.q).toLowerCase();
    payeePop.items = {};
    var html = '';
    var section = function (title, items) { return items ? '<div class="khcp-payee-sec">' + title + '</div>' + items : ''; };
    var match = function (p) { return !q || (p.ten + ' ' + p.sdt).toLowerCase().indexOf(q) >= 0; };
    if (!q) {
      var nccName = single && single.nid_ncc ? single.ncc_ten : '';
      var noNcc = single && !single.nid_ncc;
      html += section('Mặc định', '<button type="button" class="khcp-payee-item' + (single && !cur ? ' is-active' : '') + (noNcc ? ' is-disabled' : '') + '" data-key="' + (noNcc ? '__none' : '') + '">' +
        '<i class="ti tabler-link"></i><span class="khcp-payee-item-name">' + (nccName ? 'Trùng nhà cung cấp (' + esc(nccName) + ')' : 'Trùng nhà cung cấp của từng dòng') + '</span></button>');
      var seen = {}, sug = '';
      var add = function (p, sub) { if (p && !seen[payeeKey(p)]) { seen[payeeKey(p)] = 1; sug += popItemHtml(p, sub, payeeKey(p) === cur); } };
      add(cand.trip, 'lái xe của chuyến');
      $.each(rowsOf(), function (i, r) {
        if (r.loai_ben_nhan_tien && r.id_ben_nhan_tien && (!single || r.key !== single.key)) {
          var p = payeeOf(r);
          if (p) add({ loai: p.loai, id: p.id, ten: p.ten || lookupPayeeName(p.loai, p.id) || ('#' + p.id), sdt: '' }, 'đã dùng ở dòng ' + (i + 1));
        }
      });
      html += section('Gợi ý', sug);
    }
    var group = function (title, list) {
      var items = '';
      $.each(list, function (_, p) { if (match(p)) items += popItemHtml(p, '', payeeKey(p) === cur); });
      return section(title, items);
    };
    var groups = group('Nhân viên', cand.staff) + group('Nhà cung cấp', cand.nccs) + group('Lái xe', cand.drivers);
    html += groups;
    if (q && !groups) html += '<div class="text-center text-muted small py-3">Không tìm thấy</div>';
    if (!options) html += '<div class="text-center text-muted small py-3">Đang tải danh sách…</div>';
    $list.html(html);
  }

  function closePayeePop() {
    $('#khcp-payee-pop').remove();
    payeePop.target = null;
  }

  function openPayeePop(target, anchor) {
    var wasSame = payeePop.target === target && $('#khcp-payee-pop').length;
    closePayeePop();
    if (wasSame) return;
    payeePop.target = target;
    payeePop.q = '';
    var $root = core.select2Parent();
    if (!$root.length) return;
    var rows = popTargetRows();
    var title = target === 'bulk' ? 'Gán bên nhận tiền cho ' + rows.length + ' dòng đã chọn' : 'Bên nhận tiền' + (rows[0] && rows[0].ten_chi_phi ? ' — ' + esc(rows[0].ten_chi_phi) : '');
    $root.append('<div id="khcp-payee-pop" class="khcp-payee-pop"><div class="khcp-payee-pop-head"><div class="fw-semibold small mb-2">' + title + '</div>' +
      '<div class="input-group input-group-sm"><span class="input-group-text"><i class="ti tabler-search"></i></span>' +
      '<input type="text" class="form-control" id="khcp-payee-q" placeholder="Tìm tên hoặc số điện thoại" autocomplete="off"></div></div>' +
      '<div class="khcp-payee-list" id="khcp-payee-list"></div></div>');
    var $pop = $('#khcp-payee-pop');
    var rect = anchor.getBoundingClientRect();
    var w = 360, h = 420;
    var left = Math.max(8, Math.min(rect.left, window.innerWidth - w - 8));
    var below = window.innerHeight - rect.bottom;
    var top = below >= h || below >= rect.top ? rect.bottom + 4 : Math.max(8, rect.top - h - 4);
    $pop.css({ left: left + 'px', top: top + 'px', width: w + 'px', maxHeight: Math.max(240, Math.min(h, (below >= h || below >= rect.top ? below : rect.top) - 16)) + 'px' });
    // Popup nằm trong modal nên Esc tới đây trước handler đóng modal của Bootstrap: chỉ đóng popup.
    $pop.on('keydown', function (e) {
      if (e.which === 27) { e.stopPropagation(); e.preventDefault(); closePayeePop(); }
    });
    renderPayeeList();
    ensureOptions(function () { if (payeePop.target === target) renderPayeeList(); });
    var input = document.getElementById('khcp-payee-q');
    if (input && input.focus) { try { input.focus({ preventScroll: true }); } catch (err) { input.focus(); } }
  }

  /* Modal xếp xe theo dõi thay đổi chưa lưu qua sự kiện input/change thật (có originalEvent). Bấm chọn trong popup
     không phải sự kiện của ô nhập, nên phát 1 sự kiện change gốc lên bảng để modal biết mà cảnh báo. */
  function markPayeeChanged() {
    var el = document.getElementById('khcp-cost-table-body');
    if (!el) return;
    var evt;
    try { evt = new Event('change', { bubbles: true }); }
    catch (err) { evt = document.createEvent('Event'); evt.initEvent('change', true, true); }
    el.dispatchEvent(evt);
  }

  function setRowPayee(row, p) {
    if (!p) clearPayee(row);
    else { row.loai_ben_nhan_tien = p.loai; row.id_ben_nhan_tien = Number(p.id); row.ben_nhan_ten = p.ten || ''; }
    var $tr = $('#khcp-cost-table-body tr[data-row-key="' + row.key + '"]');
    if ($tr.length) $tr.find('td.khcp-col-payee').html(payeeInner(row));
  }

  function pickPayee(key) {
    var rows = popTargetRows();
    var isBulk = payeePop.target === 'bulk';
    var p = key && key !== '__none' ? payeePop.items[key] : null;
    if (key === '__none') return;
    $.each(rows, function (_, r) { setRowPayee(r, p); });
    closePayeePop();
    markPayeeChanged();
    offerPayeeSuggest(!isBulk && rows.length ? rows[0] : null, p);
    updateToolbar();
    if (rows.length) core.notify(p ? 'Đã đặt bên nhận tiền: ' + (p.ten || '') + (rows.length > 1 ? ' cho ' + rows.length + ' dòng' : '') : 'Bên nhận tiền trùng nhà cung cấp', 'success');
  }

  /* Vừa đổi bên nhận 1 dòng: gợi ý áp luôn cho các dòng khác cùng NCC chưa chọn riêng. */
  function offerPayeeSuggest(src, p) {
    payeeSuggest = null;
    if (src && p && src.nid_ncc) {
      var ids = [];
      $.each(rowsOf(), function (_, r) {
        if (r.key !== src.key && r.nid_ncc === src.nid_ncc && payeeEditable(r) && !r.loai_ben_nhan_tien) ids.push(r.key);
      });
      if (ids.length) payeeSuggest = { p: p, keys: ids, ncc: src.ncc_ten };
    }
  }

  function renderPayeeTools() {
    var $tools = $('#khcp-payee-tools');
    if (!$tools.length) return;
    var list = selectedRows();
    var map = {}, order = [];
    $.each(list, function (_, r) {
      var p = payeeOf(r), k = payeeKey(p) || 'none';
      if (!map[k]) { map[k] = { p: p, count: 0, sum: 0 }; order.push(k); }
      map[k].count++;
      map[k].sum += Number(r.tong_sau_vat) || 0;
    });
    var groups = '';
    if (order.length) {
      groups = '<span class="small text-muted"><i class="ti tabler-arrows-split-2 me-1"></i>Gom theo bên nhận tiền:</span>';
      $.each(order, function (_, k) {
        var g = map[k];
        groups += '<span class="khcp-payee-group' + (g.p ? '' : ' is-warn') + '"><i class="' + (g.p ? KIND_ICON[g.p.loai] : 'ti tabler-alert-triangle') + '"></i><strong>' +
          esc(g.p ? (g.p.ten || ('#' + g.p.id)) : 'Chưa có bên nhận') + '</strong><span class="text-muted">' + g.count + ' dòng · ' + money(g.sum) + ' đ</span></span>';
      });
    }
    $('#khcp-payee-groups').toggleClass('d-none', !groups).html(groups);
    var sug = '';
    if (payeeSuggest) {
      var names = $.map(payeeSuggest.keys, function (key) { var r = core.getRow(key); return r ? r.ten_chi_phi : null; });
      sug = '<i class="ti tabler-bulb khcp-payee-bulb"></i><span>Áp "<strong>' + esc(payeeSuggest.p.ten || '') + '</strong>" cho ' + names.length + ' dòng khác cùng nhà cung cấp' +
        (payeeSuggest.ncc ? ' ' + esc(payeeSuggest.ncc) : '') + ' chưa có đề nghị (' + esc(names.join(', ')) + ')?</span>' +
        '<span class="ms-auto d-flex gap-2"><button type="button" class="btn btn-sm btn-primary" id="khcp-payee-apply">Áp dụng</button>' +
        '<button type="button" class="btn btn-sm btn-label-secondary" id="khcp-payee-skip">Bỏ qua</button></span>';
    }
    $('#khcp-payee-suggest').toggleClass('d-none', !sug).html(sug);
    $tools.toggleClass('d-none', !groups && !sug);
  }

  function applyPayeeSuggest() {
    var sg = payeeSuggest;
    payeeSuggest = null;
    if (sg) {
      $.each(sg.keys, function (_, key) {
        var r = core.getRow(key);
        if (r && payeeEditable(r)) setRowPayee(r, sg.p);
      });
      markPayeeChanged();
      core.notify('Đã áp bên nhận tiền cho ' + sg.keys.length + ' dòng', 'success');
    }
    updateToolbar();
  }

  /* ─────────── Modal tạo đề nghị ─────────── */

  function modalHtml() {
    return '<div class="modal fade" id="khcp-dn-modal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Tạo đề nghị thanh toán</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body" style="position:relative;">' +
        '<div class="text-muted small mb-2" id="khcp-dn-summary"></div>' +
        '<div class="mb-3" id="khcp-dn-payee-info"></div>' +
        '<div class="alert alert-danger py-2 d-none" id="khcp-dn-payee-mismatch">Các dòng đã chọn không cùng 1 bên nhận tiền (hoặc có dòng chưa xác định được bên nhận tiền) — bỏ chọn bớt rồi thử lại.</div>' +
        '<div id="khcp-dn-draft-list"></div>' +
        '<div id="khcp-dn-new-box" class="khcp-dn-box">' +
          '<div class="row g-2 mb-3">' +
            '<div class="col-6"><label class="form-label small mb-1" for="khcp-dn-han-tt">Hạn thanh toán</label><input type="text" class="form-control form-control-sm khcp-dn-date" id="khcp-dn-han-tt" placeholder="dd/mm/yyyy" autocomplete="off"></div>' +
            '<div class="col-6"><label class="form-label small mb-1" for="khcp-dn-ht">Hình thức thanh toán</label><select class="form-select form-select-sm" id="khcp-dn-ht"><option value="">Chưa chọn</option><option value="CK">Chuyển khoản</option><option value="TM">Tiền mặt</option></select></div>' +
          '</div>' +
        '</div>' +
        '<div class="small text-muted mt-2">Đề nghị gộp theo bên nhận tiền — có thể gồm nhiều hoá đơn của nhiều nhà cung cấp khác nhau, miễn cùng 1 bên nhận. Số/ngày hoá đơn sửa trực tiếp ở cột "Hoá đơn" của từng dòng chi phí.</div>' +
      '</div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>' +
      '<button type="button" class="btn btn-primary" id="khcp-dn-confirm"><i class="ti tabler-receipt-2 me-1"></i>Tạo đề nghị</button></div>' +
    '</div></div></div>';
  }

  function getModal() {
    if (!$('#khcp-dn-modal').length) {
      $('body').append(modalHtml());
      if (typeof flatpickr !== 'undefined') {
        $('#khcp-dn-modal .khcp-dn-date').each(function () { flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, static: true }); });
      }
    }
    var el = document.getElementById('khcp-dn-modal');
    if (!modalInstance) modalInstance = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(el) : new bootstrap.Modal(el);
    return modalInstance;
  }

  function toApiDate(v) {
    v = $.trim(v || '');
    if (!v) return '';
    var m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);
    return m ? m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2) : null;
  }

  function renderDrafts(drafts) {
    var html = '';
    if (drafts.length) {
      for (var i = 0; i < drafts.length; i++) {
        html += '<label class="khcp-dn-option"><input type="radio" name="khcp-dn-choice" value="' + drafts[i].nid + '"> <span><strong>Thêm vào đề nghị nháp ' + esc(drafts[i].ma_de_nghi) +
          '</strong><span class="d-block small text-muted">' + drafts[i].so_dong + ' dòng · ' + money(drafts[i].tong_sau_vat) + ' đ · ' + (drafts[i].so_hoa_don_count || 0) + ' hoá đơn</span></span></label>';
      }
      html += '<label class="khcp-dn-option"><input type="radio" name="khcp-dn-choice" value="new" checked> <span><strong>Tạo đề nghị mới</strong><span class="d-block small text-muted">Tạo 1 đề nghị nháp mới cho bên nhận tiền này</span></span></label>';
    }
    $('#khcp-dn-draft-list').html(html);
    dialog.choice = 'new';
    $('#khcp-dn-new-box').show();
  }

  // Bên nhận tiền của đề nghị giờ suy thẳng từ các dòng đã tick (đã cùng 1 bên nhận, kiểm tra ở openDialog) —
  // không còn ô "Bên phát hành" để tự chọn, và không còn "trùng bên phát hành" (không có 1 phát hành duy nhất nữa).
  function loadDrafts() {
    if (!dialog.payee) { renderDrafts([]); return; }
    var bnt = dialog.payee.loai + '|' + dialog.payee.id;
    $('#khcp-dn-draft-list').html('<div class="small text-muted mb-2"><span class="spinner-border spinner-border-sm me-1" role="status"></span>Đang kiểm tra đề nghị nháp của bên nhận tiền này…</div>');
    $.ajax({
      url: API, type: 'GET', dataType: 'json', data: { tab: 'nhap', ben_nhan_tien: bnt, limit: 50 },
      success: function (res) {
        if (!dialog.payee || (dialog.payee.loai + '|' + dialog.payee.id) !== bnt) return; // đã đổi lựa chọn trong lúc chờ
        var items = (res && res.data && res.data.items) || [];
        renderDrafts($.grep(items, function (it) { return it.co_the_sua && it.trang_thai === 'nhap'; }));
      },
      error: function () { renderDrafts([]); }
    });
  }

  function openDialog() {
    var rows = selectedRows();
    if (!rows.length) return;
    dialog = { rows: rows, choice: 'new', tried: false, payee: null };
    var sum = 0;
    var payeeMap = {};
    var hasNone = false;
    $.each(rows, function (_, r) {
      sum += Number(r.tong_sau_vat) || 0;
      var p = payeeOf(r);
      if (!p) { hasNone = true; return; }
      payeeMap[p.loai + '|' + p.id] = p;
    });
    var keys = [];
    for (var k in payeeMap) { if (payeeMap.hasOwnProperty(k)) keys.push(k); }
    var $modal = getModal();
    $('#khcp-dn-summary').html(rows.length + ' dòng chi phí · Tổng sau VAT ' + money(sum) + ' đ');
    $('#khcp-dn-han-tt, #khcp-dn-ht').val('');
    $('#khcp-dn-draft-list').html('');
    $('#khcp-dn-new-box').show();
    var mismatch = hasNone || keys.length !== 1;
    $('#khcp-dn-payee-mismatch').toggleClass('d-none', !mismatch);
    $('#khcp-dn-confirm').prop('disabled', mismatch);
    if (mismatch) {
      $('#khcp-dn-payee-info').html('');
      $('#khcp-dn-new-box').hide();
      $modal.show();
      return;
    }
    dialog.payee = payeeMap[keys[0]];
    $('#khcp-dn-payee-info').html(
      '<div class="small text-muted mb-1">Bên nhận tiền (theo các dòng đã chọn)</div>' +
      '<div class="d-flex align-items-center gap-2"><i class="' + esc(KIND_ICON[dialog.payee.loai] || 'ti tabler-user') + '"></i>' +
      '<strong>' + esc(dialog.payee.ten) + '</strong><span class="khcp-mini ' + esc(dialog.payee.loai) + '">' + esc(KIND_LABEL[dialog.payee.loai] || '') + '</span></div>'
    );
    $modal.show();
    ensureOptions(function () { loadDrafts(); });
  }

  function submitDialog() {
    if (!dialog.payee) return; // nút đã bị disable khi lệch bên nhận tiền, đây là chặn phòng hờ
    var body = { chi_phi_ids: $.map(dialog.rows, function (r) { return r.nid; }) };
    var choice = $('input[name="khcp-dn-choice"]:checked').val() || 'new';
    if (choice !== 'new') {
      body.nid_de_nghi = parseInt(choice, 10);
    } else {
      var han = toApiDate($('#khcp-dn-han-tt').val());
      if (han === null) { core.notify('Ngày phải có dạng dd/mm/yyyy.', 'error'); return; }
      body.han_thanh_toan = han;
      body.hinh_thuc_tt = $('#khcp-dn-ht').val();
      body.loai_ben_nhan_tien = dialog.payee.loai;
      body.id_ben_nhan_tien = dialog.payee.id;
    }
    var $btn = $('#khcp-dn-confirm');
    $btn.prop('disabled', true);
    $.ajax({
      url: API, type: 'POST', dataType: 'json', contentType: 'application/json; charset=utf-8', data: JSON.stringify(body),
      success: function (res) {
        $btn.prop('disabled', false);
        getModal().hide();
        selected = {};
        core.notify('Đã đưa ' + dialog.rows.length + ' dòng vào ' + ((res && res.data && res.data.ma_de_nghi) || 'đề nghị') + ' (nháp).', 'success');
        core.reload();
      },
      error: function (jqXHR) {
        $btn.prop('disabled', false);
        core.notify(core.apiMsg(jqXHR), 'error');
      }
    });
  }

  function startCreate() {
    if (!selectedRows().length) return;
    // Không có dòng chọn nào sửa dở: mở modal ngay, khỏi lưu + tải lại bảng (chậm và không cần thiết).
    if (!$.grep(selectedRows(), isDirty).length) { openDialog(); return; }
    var run = function () {
      core.reload().always(function () { openDialog(); });
    };
    var saving = core.saveAll();
    if (saving && saving.done) saving.done(run).fail(function (e) { core.notify(e && e.message ? e.message : 'Hãy lưu chi phí trước khi tạo đề nghị.', 'error'); });
    else run();
  }

  /* ─────────── Hành động trên dòng ─────────── */

  function rowAction(act, dn, nid) {
    var body = act === 'rut-dong' ? { chi_phi_id: nid } : {};
    $.ajax({
      url: API + '/' + dn + '/' + act, type: 'POST', dataType: 'json', contentType: 'application/json; charset=utf-8', data: JSON.stringify(body),
      success: function () {
        core.notify(act === 'thu-hoi' ? 'Đã thu hồi đề nghị về Nháp.' : (act === 'rut-dong' ? 'Đã rút dòng khỏi đề nghị.' : 'Đã gửi lại đề nghị.'), 'success');
        core.reload();
      },
      error: function (jqXHR) { core.notify(core.apiMsg(jqXHR), 'error'); }
    });
  }

  /* ─────────── Đăng ký mở rộng ─────────── */

  var extension = {
    normalizeRow: function (row, item) {
      row.nid_ncc = Number(item.nid_ncc) || 0;
      row.ncc_ten = item.ncc_ten || '';
      row.nid_khach_hang = Number(item.nid_khach_hang) || 0;
      row.loai_ben_nhan_tien = item.loai_ben_nhan_tien || '';
      row.id_ben_nhan_tien = Number(item.id_ben_nhan_tien) || 0;
      row.ben_nhan_ten = row.loai_ben_nhan_tien && item.ben_nhan_tien ? (item.ben_nhan_tien.ten || '') : '';
      row.nid_de_nghi = Number(item.nid_de_nghi_chi_phi) || 0;
      row.trang_thai_duyet = item.trang_thai_duyet || 'khong_can_duyet';
      row.de_nghi = item.de_nghi || null;
      row.khoa_sua = !!item.khoa_sua;
      row.so_hoa_don = item.so_hoa_don || '';
      row.ngay_hoa_don = item.ngay_hoa_don || '';
      row._snap = snapshotOf(row);
    },
    isLocked: function (row) { return !!row.khoa_sua; },
    payload: function (row, payload) {
      payload.nid_ncc = row.nid_ncc || 0;
      payload.loai_ben_nhan_tien = payeeApplies(row) ? (row.loai_ben_nhan_tien || '') : '';
      payload.id_ben_nhan_tien = payeeApplies(row) ? (row.id_ben_nhan_tien || 0) : 0;
      payload.so_hoa_don = row.so_hoa_don || '';
      payload.ngay_hoa_don = row.ngay_hoa_don || '';
    },
    leadCell: function (row) { return '<td class="khcp-col-check">' + leadInner(row) + '</td>'; },
    afterNameCell: function (row) {
      return '<td class="khcp-col-ncc">' + nccInner(row) + '</td><td class="khcp-col-hd">' + hoaDonInner(row) + '</td><td class="khcp-col-payee">' + payeeInner(row) + '</td>';
    },
    beforeActionCell: function (row) { return '<td class="khcp-col-dntt">' + statusInner(row) + '</td>'; },
    afterRenderTable: function () {
      ensureHeader();
      ensureToolbar();
      ensureCostCard();
      initNccSelects();
      applyLocks();
      updateToolbar();
    },
    afterRender: function () {
      ensureHeader();
      ensureToolbar();
      ensureCostCard();
      ensureSummary();
      updateSummary();
      updateToolbar();
    },
    afterBusy: function () {
      ensureCostCard();
      applyLocks();
      updateToolbar();
    }
  };

  Drupal.behaviors.keHoachChiPhiDntt = {
    attach: function () {
      if (Drupal.behaviors.keHoachChiPhiDntt._bound) return;
      cfg = (Drupal.settings && Drupal.settings.ke_hoach_chi_phi_dntt) || {};
      perms = cfg.permissions || {};
      if (!perms.view) {
        if (window.console && window.console.warn) window.console.warn('ke_hoach_chi_phi_dntt: không có Drupal.settings.ke_hoach_chi_phi_dntt hoặc tài khoản chưa có quyền xem đề nghị thanh toán.');
        return;
      }
      core = Drupal.keHoachChiPhi && Drupal.keHoachChiPhi.api;
      if (!core) {
        if (window.console && window.console.warn) window.console.warn('ke_hoach_chi_phi_dntt: chưa thấy Drupal.keHoachChiPhi.api (ke_hoach_chi_phi.js chưa nạp?)');
        return;
      }
      Drupal.behaviors.keHoachChiPhiDntt._bound = true;
      Drupal.keHoachChiPhi.extension = extension;

      // Số tổng chi phí lấy từ sự kiện core (cùng nguồn với dòng "Chi phí" của Tóm tắt xếp xe).
      $(document).on('khcp:summary-changed', function (e, summary) {
        if (!summary) return;
        lastSummary = {
          total: Number(summary.total) || 0,
          customer: Number(summary.customer) || 0,
          company: Number(summary.company) || 0,
          driver_self: Number(summary.driver_self) || 0
        };
        updateCostCard();
      });
      $(document).on('click', '[data-khxh-port-tab]', function () {
        window.setTimeout(syncCardVisibility, 0);
      });

      $(document).on('change', '.khcp-dntt-check', function () {
        var nid = parseInt($(this).data('nid'), 10);
        if ($(this).is(':checked')) selected[nid] = true; else delete selected[nid];
        updateToolbar();
      });
      $(document).on('change', '.khcp-dntt-check-all', function () { toggleAll($(this).is(':checked')); });
      $(document).on('click', '#khcp-dntt-create-btn', startCreate);
      $(document).on('click', '#khcp-dntt-add-btn', function () { core.addBlankRow(); });
      $(document).on('click', '.khcp-dntt-push-one', function () {
        selected = {};
        selected[parseInt($(this).data('nid'), 10)] = true;
        updateToolbar();
        startCreate();
      });
      $(document).on('click', '.khcp-dntt-act', function () {
        rowAction($(this).data('act'), parseInt($(this).data('dn'), 10), parseInt($(this).data('nid'), 10));
      });
      $(document).on('change', '.khcp-ncc-select', function () {
        var $s = $(this), $tr = $s.closest('tr');
        var row = core.getRow($tr.data('row-key'));
        if (!row) return;
        row.nid_ncc = parseInt($s.val(), 10) || 0;
        row.ncc_ten = row.nid_ncc ? $.trim($s.find('option:selected').text()) : '';
        refreshRow($tr, row);
      });
      // Số/ngày hoá đơn của dòng — điền ngay tại đây, không cần vào modal đề nghị thanh toán. Không ảnh hưởng
      // ô nào khác nên không cần refreshRow (tránh mất focus khi đang gõ).
      $(document).on('change', '.khcp-hd-input', function () {
        var $i = $(this), $tr = $i.closest('tr'), field = $i.attr('data-hd-field');
        var row = core.getRow($tr.data('row-key'));
        if (!row) return;
        if (field === 'ngay_hoa_don') {
          var d = toApiDate($i.val());
          if (d === null) { core.notify('Ngày hoá đơn phải có dạng dd/mm/yyyy.', 'error'); $i.val(toView(row.ngay_hoa_don)); return; }
          row.ngay_hoa_don = d;
        } else {
          row.so_hoa_don = $.trim($i.val());
        }
      });
      // Core cập nhật loai_chi_phi trong handler của nó; đợi xong mới vẽ lại 2 ô phụ thuộc loại.
      $(document).on('click', '.khcp-payee-btn', function (e) {
        e.stopPropagation();
        openPayeePop($(this).closest('tr').data('row-key'), this);
      });
      $(document).on('click', '#khcp-payee-bulk-btn', function (e) {
        e.stopPropagation();
        if (!$(this).prop('disabled')) openPayeePop('bulk', this);
      });
      $(document).on('click', '.khcp-payee-item', function (e) {
        e.stopPropagation();
        if (!$(this).hasClass('is-disabled')) pickPayee($(this).attr('data-key') || '');
      });
      $(document).on('input', '#khcp-payee-q', function () {
        payeePop.q = this.value;
        renderPayeeList();
      });
      $(document).on('click', '#khcp-payee-apply', applyPayeeSuggest);
      $(document).on('click', '#khcp-payee-skip', function () { payeeSuggest = null; renderPayeeTools(); });
      $(document).on('mousedown', function (e) {
        if (payeePop.target !== null && !$(e.target).closest('#khcp-payee-pop, .khcp-payee-btn, #khcp-payee-bulk-btn').length) closePayeePop();
      });
      // scroll không nổi bọt nên nghe ở pha capture: cuộn bảng thì đóng popup (popup dùng position: fixed).
      document.addEventListener('scroll', function (e) {
        if (payeePop.target !== null && e.target && e.target.nodeType === 1 && $(e.target).closest('.khcp-table-wrap').length) closePayeePop();
      }, true);
      $(window).on('resize', closePayeePop);
      $(document).on('change', '.khcp-cost-type-check', function () {
        var $tr = $(this).closest('tr');
        window.setTimeout(function () {
          var row = core.getRow($tr.data('row-key'));
          if (row) refreshRow($tr, row);
        }, 0);
      });

      $(document).on('change', 'input[name="khcp-dn-choice"]', function () {
        dialog.choice = $(this).val();
        $('#khcp-dn-new-box').toggle(dialog.choice === 'new');
      });
      $(document).on('click', '#khcp-dn-confirm', submitDialog);
    }
  };
})(jQuery, Drupal, window, document);

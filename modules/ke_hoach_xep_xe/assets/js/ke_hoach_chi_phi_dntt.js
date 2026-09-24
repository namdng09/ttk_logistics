/**
 * Tab Chi phí kế hoạch HÀNG CẢNG — phần mở rộng "đề nghị thanh toán".
 *
 * Chỉ được nạp ở màn hàng cảng (ke_hoach_xep_xe_page_list → _ke_hoach_hang_cang_add_dntt_assets) và chỉ khi
 * module de_nghi_thanh_toan được bật + người dùng có quyền xem. Đăng ký vào điểm mở rộng
 * Drupal.keHoachChiPhi.extension của ke_hoach_chi_phi.js nên tuyến xa không bị ảnh hưởng.
 *
 * Bổ sung: cột Nhà cung cấp (nid_ncc), cột checkbox chọn dòng, cột trạng thái đề nghị thanh toán (đẩy/thu hồi/
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
  var STATUS_CLASS = {
    nhap: 'bg-label-secondary',
    cho_duyet: 'bg-label-warning',
    cho_duyet_thanh_toan: 'bg-label-warning',
    cho_thanh_toan: 'bg-label-primary',
    hoan_thanh: 'bg-label-success',
    tu_choi: 'bg-label-danger',
    tu_choi_thanh_toan: 'bg-label-danger'
  };

  var selected = {};
  var options = null;
  var optionsDriver = -1;
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
    return JSON.stringify([row.loai_chi_phi, row.ten_chi_phi, row.don_gia, row.so_luong, row.vat_percent, row.tong_truoc_vat, row.tong_sau_vat, row.ghi_chu || '', row.nid_ncc || 0]);
  }

  function isDirty(row) {
    return row._snap !== snapshotOf(row);
  }

  function selectedRows() {
    return $.grep(rowsOf(), function (row) { return selected[row.nid] && selectable(row); });
  }

  /* ─────────── Tuỳ chọn (NCC, nhân viên, lái xe chuyến) ─────────── */

  function ensureOptions(cb) {
    var driver = Number(core.state.nidLaiXe) || 0;
    if (options && optionsDriver === driver) { cb(options); return; }
    optionsCallbacks.push(cb);
    if (optionsLoading) return;
    optionsLoading = true;
    $.ajax({
      url: API + '/tuy-chon', type: 'GET', dataType: 'json', data: driver ? { nid_lai_xe: driver } : {},
      success: function (res) { options = (res && res.data) || { ncc: [], nhan_vien: [], lai_xe: null }; optionsDriver = driver; },
      error: function (jqXHR) { options = { ncc: [], nhan_vien: [], lai_xe: null }; optionsDriver = driver; core.notify(core.apiMsg(jqXHR), 'error'); },
      complete: function () {
        optionsLoading = false;
        var cbs = optionsCallbacks.splice(0);
        for (var i = 0; i < cbs.length; i++) cbs[i](options);
      }
    });
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

  function statusInner(row) {
    if (row.loai_chi_phi === LX) return '<span class="small text-muted">Không áp dụng (LX tự chịu)</span>';
    if (!applicable(row)) return '';
    if (!row.nid) return '<span class="small text-muted">Lưu để đẩy vào ĐNTT</span>';
    var dn = row.de_nghi;
    if (row.nid_de_nghi && dn) {
      var html = '<div class="d-flex align-items-center flex-wrap gap-1"><span class="badge ' + (STATUS_CLASS[dn.trang_thai] || 'bg-label-secondary') + '">' + esc(dn.trang_thai_label) + '</span>' +
        '<span class="small text-muted">' + esc(dn.ma_de_nghi) + (dn.so_hoa_don ? ' · HĐ ' + esc(dn.so_hoa_don) : '') + (dn.ben_nhan_tien_ten ? ' · Nhận: ' + esc(dn.ben_nhan_tien_ten) : '') + '</span>';
      var acts = dn.hanh_dong || [];
      for (var i = 0; i < acts.length; i++) {
        html += '<button type="button" class="btn btn-sm btn-label-' + (acts[i].key === 'gui-duyet' ? 'primary' : 'secondary') + ' khcp-act khcp-dntt-act" data-act="' + esc(acts[i].key) +
          '" data-dn="' + dn.nid + '" data-nid="' + row.nid + '">' + esc(acts[i].label) + '</button>';
      }
      html += '<a class="btn btn-sm btn-label-info khcp-act" target="_blank" href="' + esc(cfg.page_url || '/de-nghi-thanh-toan') + '#xem-' + dn.nid + '">Xem</a></div>';
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
      $tr.find('.khcp-col-action').before('<th class="khcp-col-dntt">Đề nghị thanh toán</th>');
    });
    $('.khcp-main-card').addClass('khcp-has-dntt');
  }

  function ensureToolbar() {
    if ($('#khcp-dntt-toolbar').length) return;
    var $card = $('.khcp-main-card').first();
    if (!$card.length) return;
    var html = '<div id="khcp-dntt-toolbar" class="khcp-dntt-toolbar d-flex justify-content-between align-items-center">' +
      '<span class="khcp-section-title">Chi phí vận hành</span><div class="d-flex align-items-center gap-2">' +
      (perms.create ? '<button type="button" class="btn btn-sm btn-primary" id="khcp-dntt-create-btn" disabled><i class="ti tabler-receipt-2 me-1"></i>Tạo đề nghị thanh toán</button>' : '') +
      '<button type="button" class="btn btn-sm btn-label-success" id="khcp-dntt-add-btn"><i class="ti tabler-circle-plus me-1"></i>Thêm chi phí</button></div></div>';
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
    var list = selectedRows();
    var sum = 0;
    $.each(list, function (_, r) { sum += Number(r.tong_sau_vat) || 0; });
    var $btn = $('#khcp-dntt-create-btn');
    $btn.prop('disabled', !list.length);
    $btn.attr('title', list.length ? 'Tổng sau VAT ' + money(sum) + ' đ' : 'Tick chọn dòng chi phí cần đẩy trước');
    $btn.html('<i class="ti tabler-receipt-2 me-1"></i>Tạo đề nghị thanh toán' + (list.length ? ' (' + list.length + ')' : ''));

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
      if (locked) {
        $tr.find('.row-field, .khcp-cost-type-check, .cost-name-select, .khcp-ncc-select, .btn-delete-row').prop('disabled', true);
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

  function refreshRow($tr, row) {
    if (!selectable(row)) delete selected[row.nid];
    $tr.find('td.khcp-col-check').html(leadInner(row));
    $tr.find('td.khcp-col-dntt').html(statusInner(row));
    updateToolbar();
    updateSummary();
  }

  /* ─────────── Modal tạo đề nghị ─────────── */

  function modalHtml() {
    return '<div class="modal fade" id="khcp-dn-modal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-dialog-centered"><div class="modal-content">' +
      '<div class="modal-header"><h5 class="modal-title">Tạo đề nghị thanh toán</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>' +
      '<div class="modal-body" style="position:relative;">' +
        '<div class="text-muted small mb-3" id="khcp-dn-summary"></div>' +
        '<div class="mb-3"><label class="form-label small mb-1" for="khcp-dn-issuer">Bên phát hành <span class="text-danger">*</span></label>' +
          '<select class="form-select" id="khcp-dn-issuer"></select>' +
          '<div class="small text-danger mt-1 d-none" id="khcp-dn-issuer-error">Chọn bên phát hành hoá đơn.</div></div>' +
        '<div id="khcp-dn-draft-list"></div>' +
        '<div id="khcp-dn-new-box" class="khcp-dn-box">' +
          '<div class="mb-3"><label class="form-label small mb-1" for="khcp-dn-so-hd">Số hoá đơn</label><input type="text" class="form-control form-control-sm" id="khcp-dn-so-hd" maxlength="50" placeholder="Không bắt buộc, sửa lại được ở màn đề nghị"></div>' +
          '<div class="row g-2 mb-3">' +
            '<div class="col-6"><label class="form-label small mb-1" for="khcp-dn-ngay-hd">Ngày hoá đơn</label><input type="text" class="form-control form-control-sm khcp-dn-date" id="khcp-dn-ngay-hd" placeholder="dd/mm/yyyy" autocomplete="off"></div>' +
            '<div class="col-6"><label class="form-label small mb-1" for="khcp-dn-han-tt">Hạn thanh toán</label><input type="text" class="form-control form-control-sm khcp-dn-date" id="khcp-dn-han-tt" placeholder="dd/mm/yyyy" autocomplete="off"></div>' +
          '</div>' +
          '<div class="mb-3"><label class="form-label small mb-1" for="khcp-dn-ht">Hình thức thanh toán</label><select class="form-select form-select-sm" id="khcp-dn-ht"><option value="">Chưa chọn</option><option value="CK">Chuyển khoản</option><option value="TM">Tiền mặt</option></select></div>' +
          '<div class="form-check"><input type="checkbox" class="form-check-input" id="khcp-dn-same" checked><label class="form-check-label" for="khcp-dn-same">Đối tác nhận tiền trùng bên phát hành</label></div>' +
          '<div id="khcp-dn-payee-box" class="mt-3 khcp-dn-payee" style="display:none;">' +
            '<label class="form-label small mb-1" for="khcp-dn-payee">Đối tác nhận tiền <span class="text-danger">*</span></label>' +
            '<div class="mb-2" id="khcp-dn-driver-chip"></div>' +
            '<select class="form-select" id="khcp-dn-payee"></select>' +
            '<div class="small text-danger mt-1 d-none" id="khcp-dn-payee-error">Chọn đối tác nhận tiền hoặc tick lại "trùng bên phát hành".</div>' +
          '</div>' +
        '</div>' +
        '<div class="small text-muted mt-2">Mỗi đề nghị ứng với 1 hoá đơn của 1 bên phát hành. Cùng nhà cung cấp có 2 hoá đơn thì chọn "Tạo đề nghị mới" cho hoá đơn thứ hai.</div>' +
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
          '</strong><span class="d-block small text-muted">' + drafts[i].so_dong + ' dòng · ' + money(drafts[i].tong_sau_vat) + ' đ' + (drafts[i].so_hoa_don ? ' · HĐ ' + esc(drafts[i].so_hoa_don) : '') + '</span></span></label>';
      }
      html += '<label class="khcp-dn-option"><input type="radio" name="khcp-dn-choice" value="new" checked> <span><strong>Tạo đề nghị mới</strong><span class="d-block small text-muted">Tạo 1 đề nghị nháp mới cho hoá đơn này</span></span></label>';
    }
    $('#khcp-dn-draft-list').html(html);
    dialog.choice = 'new';
    $('#khcp-dn-new-box').show();
  }

  // Tên kèm số điện thoại nếu có: "Nguyễn Văn A (0123456789)"; không có thì chỉ tên.
  function payeeLabel(x) { return x.ten + (x.sdt ? ' (' + x.sdt + ')' : ''); }

  function fillPayee() {
    var html = '<option value=""></option><optgroup label="Nhân viên (ứng tiền trước)">';
    var staff = (options && options.nhan_vien) || [];
    for (var i = 0; i < staff.length; i++) html += '<option value="nhan_vien|' + staff[i].uid + '">' + esc(payeeLabel(staff[i])) + '</option>';
    html += '</optgroup><optgroup label="Nhà cung cấp khác (thu hộ)">';
    var nccs = (options && options.ncc) || [];
    var anchor = issuerId();
    for (var j = 0; j < nccs.length; j++) if (nccs[j].nid !== anchor) html += '<option value="ncc|' + nccs[j].nid + '">' + esc(payeeLabel(nccs[j])) + '</option>';
    html += '</optgroup>';
    var $p = $('#khcp-dn-payee');
    if ($p.data('select2')) $p.select2('destroy');
    $p.html(html);
    if ($.fn.select2) {
      $p.select2({ placeholder: 'Chọn nhân viên hoặc NCC khác…', allowClear: true, width: '100%', dropdownParent: $('#khcp-dn-modal') });
      $p.off('select2:open.khcpFocus').on('select2:open.khcpFocus', function () {
        window.setTimeout(function () {
          var search = document.querySelector('.select2-container--open .select2-search__field');
          if (search) search.focus();
        }, 0);
      });
    }
    var lx = options && options.lai_xe;
    if (lx && lx.uid) {
      $('#khcp-dn-driver-chip').html('<button type="button" class="btn btn-sm btn-label-primary" id="khcp-dn-driver-btn"><i class="ti tabler-steering-wheel me-1"></i>Lái xe của chuyến: ' + esc(lx.ten) + '</button>');
    } else {
      $('#khcp-dn-driver-chip').html('');
    }
  }

  function issuerId() { return parseInt($('#khcp-dn-issuer').val(), 10) || 0; }

  function fillIssuer(preselect) {
    var html = '<option value="">Chọn bên phát hành…</option>';
    var nccs = (options && options.ncc) || [];
    for (var i = 0; i < nccs.length; i++) {
      html += '<option value="' + nccs[i].nid + '"' + (nccs[i].nid === preselect ? ' selected' : '') + '>' + esc(nccs[i].ten) + '</option>';
    }
    var $s = $('#khcp-dn-issuer');
    if ($s.data('select2')) $s.select2('destroy');
    $s.html(html);
    if ($.fn.select2) {
      $s.select2({ placeholder: 'Chọn bên phát hành…', allowClear: true, width: '100%', dropdownParent: $('#khcp-dn-modal') });
      $s.off('select2:open.khcpFocus').on('select2:open.khcpFocus', function () {
        window.setTimeout(function () {
          var search = document.querySelector('.select2-container--open .select2-search__field');
          if (search) search.focus();
        }, 0);
      });
    }
  }

  // Bên phát hành đổi thì nạp lại đề nghị nháp của bên đó và danh sách bên nhận tiền (bỏ chính bên phát hành).
  function loadDrafts() {
    var ncc = issuerId();
    $('#khcp-dn-issuer-error').addClass('d-none');
    fillPayee();
    if (!ncc) { renderDrafts([]); return; }
    $('#khcp-dn-draft-list').html('<div class="small text-muted mb-2"><span class="spinner-border spinner-border-sm me-1" role="status"></span>Đang kiểm tra đề nghị nháp của nhà cung cấp…</div>');
    $.ajax({
      url: API, type: 'GET', dataType: 'json', data: { tab: 'nhap', nid_ncc_phat_hanh: ncc, limit: 50 },
      success: function (res) {
        if (issuerId() !== ncc) return;   // đã đổi bên phát hành khác trong lúc chờ
        var items = (res && res.data && res.data.items) || [];
        renderDrafts($.grep(items, function (it) { return it.co_the_sua && it.trang_thai === 'nhap'; }));
      },
      error: function () { if (issuerId() === ncc) renderDrafts([]); }
    });
  }

  function openDialog() {
    var rows = selectedRows();
    if (!rows.length) return;
    dialog = { rows: rows, choice: 'new', tried: false };
    var sum = 0;
    var nccIds = {};
    $.each(rows, function (_, r) { sum += Number(r.tong_sau_vat) || 0; if (r.nid_ncc) nccIds[r.nid_ncc] = true; });
    // Gợi ý bên phát hành khi tất cả dòng chọn cùng 1 NCC; ngược lại để trống cho người dùng tự chọn.
    var keys = [];
    for (var k in nccIds) { if (nccIds.hasOwnProperty(k)) keys.push(parseInt(k, 10)); }
    var suggested = (keys.length === 1 && $.grep(rows, function (r) { return !r.nid_ncc; }).length === 0) ? keys[0] : 0;
    var $modal = getModal();
    $('#khcp-dn-summary').html(rows.length + ' dòng chi phí · Tổng sau VAT ' + money(sum) + ' đ');
    $('#khcp-dn-so-hd, #khcp-dn-ngay-hd, #khcp-dn-han-tt').val('');
    $('#khcp-dn-ht').val('');
    $('#khcp-dn-same').prop('checked', true);
    $('#khcp-dn-payee-box').hide();
    $('#khcp-dn-payee-error, #khcp-dn-issuer-error').addClass('d-none');
    $('#khcp-dn-issuer').html('<option value="">Đang tải…</option>');
    $('#khcp-dn-draft-list').html('');
    $('#khcp-dn-new-box').show();
    $modal.show();
    ensureOptions(function () {
      fillIssuer(suggested);
      loadDrafts();
    });
  }

  function submitDialog() {
    var body = { chi_phi_ids: $.map(dialog.rows, function (r) { return r.nid; }) };
    var choice = $('input[name="khcp-dn-choice"]:checked').val() || 'new';
    if (!issuerId()) { $('#khcp-dn-issuer-error').removeClass('d-none'); return; }
    body.nid_ncc = issuerId();
    if (choice !== 'new') {
      body.nid_de_nghi = parseInt(choice, 10);
    } else {
      var ngay = toApiDate($('#khcp-dn-ngay-hd').val());
      var han = toApiDate($('#khcp-dn-han-tt').val());
      if (ngay === null || han === null) { core.notify('Ngày phải có dạng dd/mm/yyyy.', 'error'); return; }
      body.so_hoa_don = $.trim($('#khcp-dn-so-hd').val());
      body.ngay_hoa_don = ngay;
      body.han_thanh_toan = han;
      body.hinh_thuc_tt = $('#khcp-dn-ht').val();
      var same = $('#khcp-dn-same').is(':checked');
      body.ben_nhan_tien_trung = same;
      if (!same) {
        var v = $('#khcp-dn-payee').val();
        if (!v) { $('#khcp-dn-payee-error').removeClass('d-none'); return; }
        var i = v.indexOf('|');
        body.loai_ben_nhan_tien = v.slice(0, i);
        body.id_ben_nhan_tien = parseInt(v.slice(i + 1), 10);
      }
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
      row.nid_de_nghi = Number(item.nid_de_nghi_chi_phi) || 0;
      row.trang_thai_duyet = item.trang_thai_duyet || 'khong_can_duyet';
      row.de_nghi = item.de_nghi || null;
      row.khoa_sua = !!item.khoa_sua;
      row._snap = snapshotOf(row);
    },
    isLocked: function (row) { return !!row.khoa_sua; },
    payload: function (row, payload) { payload.nid_ncc = row.nid_ncc || 0; },
    leadCell: function (row) { return '<td class="khcp-col-check">' + leadInner(row) + '</td>'; },
    afterNameCell: function (row) { return '<td class="khcp-col-ncc">' + nccInner(row) + '</td>'; },
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
      // Core cập nhật loai_chi_phi trong handler của nó; đợi xong mới vẽ lại 2 ô phụ thuộc loại.
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
      $(document).on('change', '#khcp-dn-issuer', function () { loadDrafts(); });
      $(document).on('change', '#khcp-dn-same', function () {
        $('#khcp-dn-payee-box').toggle(!$(this).is(':checked'));
        $('#khcp-dn-payee-error').addClass('d-none');
      });
      $(document).on('click', '#khcp-dn-driver-btn', function () {
        var lx = options && options.lai_xe;
        if (lx && lx.uid) $('#khcp-dn-payee').val('nhan_vien|' + lx.uid).trigger('change');
      });
      $(document).on('click', '#khcp-dn-confirm', submitDialog);
    }
  };
})(jQuery, Drupal, window, document);

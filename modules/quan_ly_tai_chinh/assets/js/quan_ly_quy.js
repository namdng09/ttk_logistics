/**
 * Màn /quan-ly-quy — hybrid: template rỗng (templates/quan-ly-quy-list.tpl.php) + JS gọi API /api/quan-ly-quy
 * (quan_ly_tai_chinh.api.inc).
 *
 * - Danh sách: lọc từ khoá + kỳ, tab theo loại quỹ có số lượng, số liệu kỳ (đầu kỳ, thu, chi, chuyển, điều chỉnh, cuối kỳ) từ sổ cái,
 *   dải số dư hiện tại theo loại quỹ.
 * - Thao tác trên từng quỹ do server trả về (`hanh_dong`, quan_ly_tai_chinh_quy_actions()) — JS chỉ hiển thị.
 * - Chi tiết: Sổ quỹ (theo kỳ, phân trang server), Chuyển tiền & điều chỉnh (huỷ được nếu server cho), Lịch sử.
 */
(function () {
  'use strict';

  // Trang có thể có nhiều bản jQuery; Select2/daterangepicker gắn vào 1 bản ⇒ chọn bản có plugin lúc khởi tạo.
  function pickJq() {
    var list = [window.jQuery, window.$];
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] === 'function' && list[i].fn && typeof list[i].fn.select2 === 'function') return list[i];
    }
    return typeof window.jQuery === 'function' ? window.jQuery : null;
  }

  function QuanLyQuy($) {
    var API = '/api/quan-ly-quy';
    var settings = (window.Drupal && Drupal.settings && Drupal.settings.quan_ly_quy) || {};
    var canManage = !!(settings.permissions && settings.permissions.manage);
    var notyf = null;
    var state = { page: 1, tab: '', options: null, formId: 0, view: null, ledgerPage: 1, adjustId: 0, bookBalance: 0 };

    var TABS = [
      { id: '', key: 'all', label: 'Tất cả' },
      { id: 'tien_mat', key: 'tien_mat', label: 'Tiền mặt' },
      { id: 'ngan_hang', key: 'ngan_hang', label: 'Ngân hàng' },
      { id: 'vi_noi_bo', key: 'vi_noi_bo', label: 'Ví nội bộ' }
    ];
    var ACTION_UI = {
      sua: { icon: 'tabler-edit', color: 'text-primary', btn: 'btn-label-primary' },
      dieu_chinh: { icon: 'tabler-adjustments-dollar', color: 'text-warning', btn: 'btn-label-warning' },
      xoa: { icon: 'tabler-trash', color: 'text-danger', btn: 'btn-label-danger' }
    };

    /* ---------- tiện ích ---------- */
    function esc(v) {
      return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
      });
    }
    function money(v) {
      var n = Math.round(parseFloat(v) || 0);
      return (n < 0 ? '-' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    function signedMoney(v) {
      var n = Math.round(parseFloat(v) || 0);
      return n > 0 ? '+' + money(n) : money(n);
    }
    function parseMoney(v) { return parseInt(String(v == null ? '' : v).replace(/[^\d]/g, ''), 10) || 0; }
    function apiMsg(xhr) {
      try { return JSON.parse(xhr.responseText).message || 'Lỗi không xác định'; }
      catch (e) { return 'Lỗi kết nối server'; }
    }
    function toast(msg, ok) {
      if (!notyf && window.Notyf) notyf = new window.Notyf();
      if (notyf) { if (ok) notyf.success(msg); else notyf.error(msg); }
      else window.alert(msg);
    }
    function modal(id) {
      var el = document.getElementById(id);
      return el && window.bootstrap ? window.bootstrap.Modal.getOrCreateInstance(el) : null;
    }
    function loading(id, on) { $('#' + id).toggleClass('is-visible', !!on); }
    function ajax(opts) {
      return $.ajax($.extend({ dataType: 'json', contentType: 'application/json; charset=utf-8' }, opts));
    }
    function loaiChip(loai, label) {
      return '<span class="qq-chip qq-chip-' + esc(loai) + '">' + esc(label || loai) + '</span>';
    }
    function moneyCell(v, cls) {
      var n = Math.round(parseFloat(v) || 0);
      return '<td class="text-end qq-money ' + (n ? (cls || '') : 'text-muted') + '">' + money(n) + '</td>';
    }
    function today() { return window.moment ? moment().format('DD/MM/YYYY') : ''; }
    function bindMoney(sel) {
      $(document).on('input', sel, function () {
        var raw = parseMoney(this.value);
        this.value = raw ? money(raw) : '';
      });
    }
    function initDate(id, val) {
      var el = document.getElementById(id);
      if (!el) return;
      if (typeof flatpickr === 'undefined') { $(el).val(val || ''); return; }
      if (el._flatpickr) el._flatpickr.destroy();
      flatpickr(el, { dateFormat: 'd/m/Y', allowInput: true, static: true, maxDate: 'today', defaultDate: val || null });
    }
    function confirmBox(title, text, okLabel, icon) {
      var d = $.Deferred();
      if (window.Swal) {
        Swal.fire({
          title: title, text: text, icon: icon || 'question', showCancelButton: true, confirmButtonText: okLabel, cancelButtonText: 'Đóng',
          customClass: { confirmButton: 'btn btn-primary me-2', cancelButton: 'btn btn-label-secondary' }, buttonsStyling: false
        }).then(function (r) { if (r.isConfirmed) d.resolve(); else d.reject(); });
      }
      else if (window.confirm(title + '\n' + text)) d.resolve();
      else d.reject();
      return d.promise();
    }
    function reasonBox(title, text, okLabel) {
      var d = $.Deferred();
      if (window.Swal) {
        Swal.fire({
          title: title, text: text, icon: 'warning', input: 'text', inputPlaceholder: 'Lý do', showCancelButton: true,
          confirmButtonText: okLabel, cancelButtonText: 'Đóng',
          customClass: { confirmButton: 'btn btn-danger me-2', cancelButton: 'btn btn-label-secondary' }, buttonsStyling: false,
          inputValidator: function (v) { return $.trim(v || '') ? null : 'Vui lòng nhập lý do'; }
        }).then(function (r) { if (r.isConfirmed) d.resolve($.trim(r.value)); else d.reject(); });
      }
      else {
        var v = window.prompt(title + '\n' + text + '\nLý do:');
        if (v && $.trim(v)) d.resolve($.trim(v)); else d.reject();
      }
      return d.promise();
    }

    /* ---------- ô chọn ---------- */
    function initSelect2($el, opts) {
      if (!$el.length || !$.fn.select2) return;
      if ($el.data('select2')) $el.select2('destroy');
      $el.select2($.extend({ width: '100%', allowClear: true }, opts || {}));
    }
    function loadOptions(done, force) {
      if (state.options && !force) { done(); return; }
      ajax({
        url: API + '/tuy-chon', type: 'GET',
        success: function (res) {
          var o = (res && res.data) || {};
          state.options = o;
          if (canManage) {
            $('#qq-in-loai').html($.map(o.loai_quy || [], function (l) { return '<option value="' + esc(l.id) + '">' + esc(l.ten) + '</option>'; }).join(''));
            $('#qq-in-ql').html('<option value=""></option>' + $.map(o.nguoi_quan_ly || [], function (u) { return '<option value="' + u.id + '">' + esc(u.ten) + '</option>'; }).join(''));
            initSelect2($('#qq-in-ql'), { placeholder: 'Không chọn', dropdownParent: $('#qq-form-modal') });
            var quyOpts = '<option value=""></option>' + $.map(o.quy || [], function (q) { return '<option value="' + q.id + '">' + esc(q.ten) + (q.ma ? ' (' + esc(q.ma) + ')' : '') + '</option>'; }).join('');
            $('#qq-tr-from, #qq-tr-to').html(quyOpts);
            initSelect2($('#qq-tr-from'), { placeholder: 'Chọn quỹ chuyển', dropdownParent: $('#qq-transfer-modal') });
            initSelect2($('#qq-tr-to'), { placeholder: 'Chọn quỹ nhận', dropdownParent: $('#qq-transfer-modal') });
          }
          done();
        },
        error: function (xhr) { toast(apiMsg(xhr), false); done(); }
      });
    }
    function quyOption(id) {
      var list = (state.options && state.options.quy) || [];
      for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i];
      return null;
    }

    /* ---------- khoảng ngày (daterangepicker) ---------- */
    function rangeOf($r) {
      var p = $r.data('daterangepicker');
      if (!$r.val() || !p) return { tu: '', den: '' };
      return { tu: p.startDate.format('DD/MM/YYYY'), den: p.endDate.format('DD/MM/YYYY') };
    }
    function setRangeOf($r, start, end) {
      var p = $r.data('daterangepicker');
      if (!p) return;
      p.setStartDate(start);
      p.setEndDate(end);
      $r.val(start.format('DD/MM/YYYY') + ' đến ' + end.format('DD/MM/YYYY'));
    }
    function monthRange($r) { setRangeOf($r, moment().startOf('month'), moment().endOf('month').startOf('day')); }
    function initRange($r, onChange) {
      if (!$r.length || typeof $.fn.daterangepicker !== 'function' || typeof window.moment === 'undefined') return;
      $r.daterangepicker({
        autoUpdateInput: false, autoApply: true, showDropdowns: true, opens: 'left',
        parentEl: $r.closest('.modal').length ? $r.closest('.modal-body') : 'body',
        locale: {
          format: 'DD/MM/YYYY', separator: ' đến ', applyLabel: 'Áp dụng', cancelLabel: 'Đóng', customRangeLabel: 'Tùy chọn',
          daysOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
          monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
          firstDay: 1
        }
      });
      var p = $r.data('daterangepicker');
      if (p && p.container) p.container.addClass('qq-daterangepicker');
      $r.on('apply.daterangepicker', function (e, pk) { setRangeOf($r, pk.startDate, pk.endDate); onChange(); })
        .on('show.daterangepicker', function (e, pk) {
          var $f = pk.container.find('.drp-buttons');
          $f.find('.qq-date-quick').remove();
          var $q = $('<span class="qq-date-quick"></span>')
            .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="month">Tháng này</button>')
            .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="last">Tháng trước</button>')
            .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="year">Năm nay</button>');
          $f.prepend($q);
          $q.find('[data-q]').on('click', function () {
            var q = $(this).attr('data-q'), s, e2;
            if (q === 'last') { s = moment().subtract(1, 'month').startOf('month'); e2 = moment().subtract(1, 'month').endOf('month').startOf('day'); }
            else if (q === 'year') { s = moment().startOf('year'); e2 = moment().endOf('year').startOf('day'); }
            else { s = moment().startOf('month'); e2 = moment().endOf('month').startOf('day'); }
            setRangeOf($r, s, e2);
            pk.hide();
            onChange();
          });
        });
      monthRange($r);
    }

    /* ---------- danh sách ---------- */
    function params() {
      var r = rangeOf($('#qq-f-ky'));
      return { page: state.page, keyword: $.trim($('#qq-f-q').val() || ''), loai_quy: state.tab, tu_ngay: r.tu, den_ngay: r.den };
    }
    function reload() { state.page = 1; loadList(); }

    function loadList() {
      $('#qq-tbody').html('<tr><td colspan="11" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>');
      $('#qq-tfoot').html('');
      ajax({
        url: API, type: 'GET', data: params(),
        success: function (res) {
          var d = (res && res.data) || {};
          var items = d.items || [];
          $('#qq-tbody').html(items.length ? $.map(items, rowHtml).join('') : '<tr><td colspan="11" class="text-center text-muted py-4">Không có quỹ nào.</td></tr>');
          renderTabs(d.status_counts || {});
          renderSum(d.tong || {});
          renderFoot(d.tong || {}, items.length);
          renderPager(d);
        },
        error: function (xhr) {
          var denied = xhr.status === 401 || xhr.status === 403;
          $('#qq-tbody').html('<tr><td colspan="11" class="text-center py-4 ' + (denied ? 'text-warning' : 'text-danger') + '">' + (denied ? '<i class="ti tabler-lock me-1"></i>' : '') + esc(apiMsg(xhr)) + '</td></tr>');
        }
      });
    }

    function actionMenuItems(item) {
      var html = '<li><a href="#" class="dropdown-item qq-act" data-id="' + item.nid + '" data-action="xem"><i class="ti tabler-eye me-2 text-info"></i>Xem chi tiết</a></li>';
      var acts = item.hanh_dong || [];
      if (acts.length) html += '<li><hr class="dropdown-divider"></li>';
      $.each(acts, function (_, a) {
        var ui = ACTION_UI[a.action] || { icon: 'tabler-point', color: 'text-secondary' };
        html += '<li><a href="#" class="dropdown-item qq-act' + (a.action === 'xoa' ? ' text-danger' : '') + '" data-id="' + item.nid + '" data-action="' + esc(a.action) + '"><i class="ti ' + ui.icon + ' me-2 ' + ui.color + '"></i>' + esc(a.label) + '</a></li>';
      });
      return html;
    }

    function rowHtml(item) {
      var k = item.ky || {};
      var current = Math.round(item.so_du_hien_tai || 0);
      var cuoi = Math.round(k.cuoi_ky || 0);
      return '<tr data-id="' + item.nid + '">' +
        '<td class="text-center"><div class="dropdown"><button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button><ul class="dropdown-menu">' + actionMenuItems(item) + '</ul></div></td>' +
        '<td><a href="#" class="qq-name qq-act" data-id="' + item.nid + '" data-action="xem">' + esc(item.ten_quy) + '</a><div class="small text-muted">' + esc(item.ma_quy) + (item.ghi_chu ? ' · ' + esc(item.ghi_chu) : '') + '</div></td>' +
        '<td>' + loaiChip(item.loai_quy, item.loai_label) + '</td>' +
        '<td>' + (item.nguoi_quan_ly ? esc(item.nguoi_quan_ly.ten) : '<span class="text-muted">—</span>') + '</td>' +
        moneyCell(k.dau_ky) +
        moneyCell(k.thu, 'qq-plus') +
        moneyCell(k.chi, 'qq-minus') +
        moneyCell(k.chuyen_den, 'qq-plus') +
        moneyCell(k.chuyen_di, 'qq-minus') +
        '<td class="text-end qq-money ' + (k.dieu_chinh ? (k.dieu_chinh > 0 ? 'qq-plus' : 'qq-minus') : 'text-muted') + '">' + signedMoney(k.dieu_chinh) + '</td>' +
        '<td class="text-end qq-money fw-bold">' + money(cuoi) + (current !== cuoi ? '<div class="small text-muted fw-normal" title="Số dư hiện tại (tính cả phát sinh sau kỳ đang xem)">Hiện tại ' + money(current) + '</div>' : '') + '</td>' +
        '</tr>';
    }

    function renderFoot(t, n) {
      if (!n) { $('#qq-tfoot').html(''); return; }
      $('#qq-tfoot').html('<tr><td></td><td colspan="3">Tổng (theo bộ lọc)</td>' +
        '<td class="text-end qq-money">' + money(t.dau_ky) + '</td>' +
        '<td class="text-end qq-money qq-plus">' + money(t.thu) + '</td>' +
        '<td class="text-end qq-money qq-minus">' + money(t.chi) + '</td>' +
        '<td class="text-end qq-money qq-plus">' + money(t.chuyen_den) + '</td>' +
        '<td class="text-end qq-money qq-minus">' + money(t.chuyen_di) + '</td>' +
        '<td class="text-end qq-money">' + signedMoney(t.dieu_chinh) + '</td>' +
        '<td class="text-end qq-money">' + money(t.cuoi_ky) + '</td></tr>');
    }

    function renderTabs(counts) {
      $('#qq-tabs').html($.map(TABS, function (t) {
        return '<li class="nav-item"><button type="button" class="nav-link waves-effect waves-light' + (state.tab === t.id ? ' active' : '') + '" data-tab="' + t.id + '" role="tab">' +
          esc(t.label) + ' <span class="badge bg-label-primary ms-1">' + (parseInt(counts[t.key], 10) || 0) + '</span></button></li>';
      }).join(''));
    }

    function renderSum(t) {
      function stat(label, value, cls) {
        return '<div class="qq-sum-item"><span class="qq-sum-label">' + label + '</span><span class="qq-sum-value ' + (cls || '') + '">' + money(value) + ' đ</span></div>';
      }
      var by = t.theo_loai || {};
      var html = stat('Tiền mặt', by.tien_mat, '') + stat('Ngân hàng', by.ngan_hang, '');
      if (Math.round(by.vi_noi_bo || 0)) html += stat('Ví nội bộ', by.vi_noi_bo, '');
      html += stat('Tổng số dư', t.so_du_hien_tai, 'text-primary');
      $('#qq-sum').html(html).attr('title', 'Số dư hiện tại của các quỹ theo từ khoá đang lọc (không theo kỳ, không theo tab)');
    }

    function renderPager(d) {
      var total = parseInt(d.total_pages, 10) || 0;
      var cur = parseInt(d.current_page, 10) || 1;
      state.page = cur;
      $('#qq-pagination').show();
      $('#qq-pagination-info').text('Tổng số: ' + (parseInt(d.total, 10) || 0) + ' quỹ');
      $('#qq-pagination-total-pages').text('/ ' + total);
      $('#qq-pagination-jump').val(cur).attr('data-total', total);
      $('#qq-pagination ul').html(pagerHtml(cur, total, 'qq-page'));
    }
    function pagerHtml(cur, total, cls) {
      function li(page, label, disabled, active) {
        return '<li class="page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '') + '"><a class="page-link ' + cls + '" href="#" data-page="' + page + '">' + label + '</a></li>';
      }
      var html = li(1, '<i class="ti tabler-chevrons-left"></i>', cur <= 1) + li(cur - 1, '<i class="ti tabler-chevron-left"></i>', cur <= 1);
      var s = Math.max(1, cur - 2), e = Math.min(total, cur + 2);
      for (var p = s; p <= e; p++) html += li(p, p, false, p === cur);
      return html + li(cur + 1, '<i class="ti tabler-chevron-right"></i>', cur >= total) + li(total, '<i class="ti tabler-chevrons-right"></i>', cur >= total);
    }

    /* ---------- tạo / sửa ---------- */
    function openForm(id) {
      state.formId = parseInt(id, 10) || 0;
      loadOptions(function () {
        $('#qq-form-title').text(state.formId ? 'Sửa thông tin quỹ' : 'Thêm quỹ');
        $('#qq-in-ma, #qq-in-ten, #qq-in-ghi-chu, #qq-in-so-du').val('').removeClass('is-invalid');
        $('#qq-in-loai').val('tien_mat');
        $('#qq-in-ql').val('').trigger('change');
        $('#qq-in-so-du').prop('readonly', !!state.formId).toggleClass('bg-light', !!state.formId)
          .attr('title', state.formId ? 'Số dư đầu kỳ chỉ nhập khi tạo quỹ. Muốn khớp số dư thì dùng "Điều chỉnh số dư".' : '');
        modal('qq-form-modal').show();
        if (!state.formId) return;
        loading('qq-form-loading', true);
        ajax({
          url: API + '/' + state.formId, type: 'GET',
          success: function (res) {
            var d = (res && res.data) || {};
            $('#qq-in-ma').val(d.ma_quy || '');
            $('#qq-in-ten').val(d.ten_quy || '');
            $('#qq-in-loai').val(d.loai_quy || 'tien_mat');
            $('#qq-in-ql').val(d.nguoi_quan_ly ? String(d.nguoi_quan_ly.uid) : '').trigger('change');
            $('#qq-in-so-du').val(money(d.so_du_dau_ky_goc));
            $('#qq-in-ghi-chu').val(d.ghi_chu || '');
          },
          error: function (xhr) { toast(apiMsg(xhr), false); modal('qq-form-modal').hide(); },
          complete: function () { loading('qq-form-loading', false); }
        });
      });
    }

    function saveForm() {
      var payload = {
        ma_quy: $.trim($('#qq-in-ma').val()),
        ten_quy: $.trim($('#qq-in-ten').val()),
        loai_quy: $('#qq-in-loai').val(),
        uid_nguoi_quan_ly: $('#qq-in-ql').val() || 0,
        ghi_chu: $.trim($('#qq-in-ghi-chu').val())
      };
      if (!state.formId) payload.so_du_dau_ky = parseMoney($('#qq-in-so-du').val());
      var errors = [];
      if (!payload.ma_quy) { $('#qq-in-ma').addClass('is-invalid'); errors.push('mã quỹ'); }
      if (!payload.ten_quy) { $('#qq-in-ten').addClass('is-invalid'); errors.push('tên quỹ'); }
      if (errors.length) { toast('Vui lòng nhập ' + errors.join(', ') + '.', false); return; }
      var $btn = $('#qq-form-save').prop('disabled', true);
      loading('qq-form-loading', true);
      ajax({
        url: state.formId ? API + '/' + state.formId : API,
        type: state.formId ? 'PUT' : 'POST',
        data: JSON.stringify(payload),
        success: function (res) {
          toast((state.formId ? 'Đã lưu quỹ ' : 'Đã thêm quỹ ') + ((res && res.data && res.data.ten_quy) || '') + '.', true);
          state.options = null;
          modal('qq-form-modal').hide();
          loadList();
          if (state.view && state.formId === state.view.nid) openView(state.formId);
        },
        error: function (xhr) { toast(apiMsg(xhr), false); },
        complete: function () { $btn.prop('disabled', false); loading('qq-form-loading', false); }
      });
    }

    /* ---------- chuyển tiền ---------- */
    function showBalance(selId, outId) {
      var q = quyOption($(selId).val());
      $(outId).html(q ? 'Số dư hiện tại: <b>' + money(q.so_du) + ' đ</b>' : '');
    }
    function openTransfer(fromId) {
      loadOptions(function () {
        $('#qq-tr-from').val(fromId ? String(fromId) : '').trigger('change');
        $('#qq-tr-to').val('').trigger('change');
        $('#qq-tr-amount, #qq-tr-note').val('');
        initDate('qq-tr-date', today());
        showBalance('#qq-tr-from', '#qq-tr-from-balance');
        showBalance('#qq-tr-to', '#qq-tr-to-balance');
        modal('qq-transfer-modal').show();
      }, true);
    }
    function saveTransfer() {
      var payload = {
        nid_quy: $('#qq-tr-from').val() || 0,
        nid_quy_nhan: $('#qq-tr-to').val() || 0,
        so_tien: parseMoney($('#qq-tr-amount').val()),
        ngay_giao_dich: $.trim($('#qq-tr-date').val()),
        dien_giai: $.trim($('#qq-tr-note').val())
      };
      var errors = [];
      if (!parseInt(payload.nid_quy, 10)) errors.push('quỹ chuyển');
      if (!parseInt(payload.nid_quy_nhan, 10)) errors.push('quỹ nhận');
      if (!payload.so_tien) errors.push('số tiền');
      if (!payload.ngay_giao_dich) errors.push('ngày chuyển');
      if (errors.length) { toast('Vui lòng nhập ' + errors.join(', ') + '.', false); return; }
      if (payload.nid_quy === payload.nid_quy_nhan) { toast('Quỹ nhận phải khác quỹ chuyển.', false); return; }
      var from = quyOption(payload.nid_quy);
      if (from && payload.so_tien > from.so_du) { toast('Quỹ chuyển không đủ tiền (số dư ' + money(from.so_du) + ' đ).', false); return; }
      var $btn = $('#qq-transfer-save').prop('disabled', true);
      loading('qq-transfer-loading', true);
      ajax({
        url: API + '/chuyen-tien', type: 'POST', data: JSON.stringify(payload),
        success: function (res) {
          toast((res && res.data && res.data.message) || 'Đã chuyển tiền.', true);
          state.options = null;
          modal('qq-transfer-modal').hide();
          loadList();
          if (state.view) openView(state.view.nid);
        },
        error: function (xhr) { toast(apiMsg(xhr), false); },
        complete: function () { $btn.prop('disabled', false); loading('qq-transfer-loading', false); }
      });
    }

    /* ---------- điều chỉnh số dư ---------- */
    function loadBookBalance() {
      var ngay = $.trim($('#qq-adj-date').val());
      if (!state.adjustId || !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ngay)) return;
      $('#qq-adj-book').val('…');
      ajax({
        url: API + '/' + state.adjustId + '/so-du', type: 'GET', data: { ngay: ngay },
        success: function (res) {
          state.bookBalance = Math.round((res && res.data && res.data.so_du) || 0);
          $('#qq-adj-book').val(money(state.bookBalance));
          updateDiff();
        },
        error: function (xhr) { $('#qq-adj-book').val(''); toast(apiMsg(xhr), false); }
      });
    }
    function updateDiff() {
      var raw = $.trim($('#qq-adj-actual').val());
      if (raw === '') { $('#qq-adj-diff').val('').removeClass('text-success text-danger'); return; }
      var diff = parseMoney(raw) - state.bookBalance;
      $('#qq-adj-diff').val(signedMoney(diff)).toggleClass('text-success', diff > 0).toggleClass('text-danger', diff < 0);
    }
    function openAdjust(id, name) {
      state.adjustId = parseInt(id, 10) || 0;
      state.bookBalance = 0;
      $('#qq-adj-quy').text(name || '');
      $('#qq-adj-actual, #qq-adj-reason, #qq-adj-diff, #qq-adj-book').val('');
      initDate('qq-adj-date', today());
      modal('qq-adjust-modal').show();
      loadBookBalance();
    }
    function saveAdjust() {
      var payload = {
        ngay_dieu_chinh: $.trim($('#qq-adj-date').val()),
        so_du_thuc_te: $.trim($('#qq-adj-actual').val()) === '' ? '' : parseMoney($('#qq-adj-actual').val()),
        ly_do: $.trim($('#qq-adj-reason').val())
      };
      var errors = [];
      if (!payload.ngay_dieu_chinh) errors.push('ngày kiểm quỹ');
      if (payload.so_du_thuc_te === '') errors.push('số dư thực tế');
      if (!payload.ly_do) errors.push('lý do');
      if (errors.length) { toast('Vui lòng nhập ' + errors.join(', ') + '.', false); return; }
      var $btn = $('#qq-adjust-save').prop('disabled', true);
      loading('qq-adjust-loading', true);
      ajax({
        url: API + '/' + state.adjustId + '/dieu-chinh', type: 'POST', data: JSON.stringify(payload),
        success: function (res) {
          toast((res && res.data && res.data.message) || 'Đã điều chỉnh số dư.', true);
          state.options = null;
          modal('qq-adjust-modal').hide();
          loadList();
          if (state.view && state.view.nid === state.adjustId) openView(state.adjustId);
        },
        error: function (xhr) { toast(apiMsg(xhr), false); },
        complete: function () { $btn.prop('disabled', false); loading('qq-adjust-loading', false); }
      });
    }

    /* ---------- xoá ---------- */
    function deleteQuy(id, name) {
      confirmBox('Xoá quỹ?', 'Quỹ "' + name + '" sẽ bị xoá (xoá mềm). Chỉ xoá được khi số dư bằng 0 và không còn phiếu chưa duyệt.', 'Xoá', 'warning').done(function () {
        ajax({
          url: API + '/' + id, type: 'DELETE',
          success: function (res) {
            toast((res && res.data && res.data.message) || 'Đã xoá quỹ.', true);
            state.options = null;
            if (state.view && state.view.nid === parseInt(id, 10)) modal('qq-view-modal').hide();
            loadList();
          },
          error: function (xhr) { toast(apiMsg(xhr), false); }
        });
      });
    }

    /* ---------- chi tiết ---------- */
    function box(label, value, cls) {
      return '<div class="col-6 col-md"><div class="qq-box"><span>' + esc(label) + '</span><strong class="' + (cls || '') + '">' + value + '</strong></div></div>';
    }
    function openView(id) {
      id = parseInt(id, 10) || 0;
      state.view = { nid: id };
      $('#qq-view-info, #qq-ledger-body, #qq-noi-bo-body, #qq-history, #qq-ledger-sum, #qq-ledger-info').html('');
      $('#qq-view-title').text('Chi tiết quỹ');
      $('#qq-view-ma, #qq-view-loai').html('');
      $('#qq-view-footer').html('<button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>');
      switchViewTab('so-quy');
      loading('qq-view-loading', true);
      if (!$('#qq-view-modal').hasClass('show')) modal('qq-view-modal').show();
      var r = rangeOf($('#qq-f-ky'));
      ajax({
        url: API + '/' + id, type: 'GET', data: { tu_ngay: r.tu, den_ngay: r.den },
        success: function (res) {
          renderView((res && res.data) || {});
          // Kỳ sổ quỹ mặc định theo kỳ đang lọc ở danh sách.
          var $l = $('#qq-ledger-ky'), p = $l.data('daterangepicker'), pm = $('#qq-f-ky').data('daterangepicker');
          if (p && pm && $('#qq-f-ky').val()) setRangeOf($l, pm.startDate.clone(), pm.endDate.clone());
          state.ledgerPage = 1;
          loadLedger();
        },
        error: function (xhr) { $('#qq-view-info').html('<div class="alert alert-danger">' + esc(apiMsg(xhr)) + '</div>'); },
        complete: function () { loading('qq-view-loading', false); }
      });
    }
    function renderView(d) {
      state.view = d;
      $('#qq-view-title').text(d.ten_quy || 'Chi tiết quỹ');
      $('#qq-view-ma').text(d.ma_quy || '');
      $('#qq-view-loai').html(loaiChip(d.loai_quy, d.loai_label));
      var html = '<div class="row g-3">' +
        box('Số dư hiện tại', money(d.so_du_hien_tai) + ' đ', 'text-primary') +
        box('Người quản lý', d.nguoi_quan_ly ? esc(d.nguoi_quan_ly.ten) : '—') +
        box('Số dư khi tạo quỹ', money(d.so_du_dau_ky_goc) + ' đ') +
        box('Ngày tạo', esc((d.created || '').substr(0, 10).split('-').reverse().join('/')) || '—') +
        '</div>';
      if (d.ghi_chu) html += '<div class="small text-muted mt-2"><i class="ti tabler-notes me-1"></i>' + esc(d.ghi_chu) + '</div>';
      $('#qq-view-info').html(html);
      renderNoiBo(d.giao_dich_noi_bo || []);
      renderHistory(d);
      var footer = '';
      if (canManage) footer += '<button type="button" class="btn btn-label-primary qq-view-transfer" data-id="' + d.nid + '"><i class="ti tabler-arrows-exchange me-1"></i>Chuyển tiền</button>';
      $.each(d.hanh_dong || [], function (_, a) {
        var ui = ACTION_UI[a.action] || { icon: 'tabler-point', btn: 'btn-label-secondary' };
        footer += '<button type="button" class="btn ' + ui.btn + ' qq-act" data-id="' + d.nid + '" data-action="' + esc(a.action) + '"' +
          (a.ly_do ? ' disabled title="' + esc(a.ly_do) + '"' : '') + '><i class="ti ' + ui.icon + ' me-1"></i>' + esc(a.label) + '</button>';
      });
      footer += '<button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>';
      $('#qq-view-footer').html(footer);
    }
    function renderNoiBo(list) {
      $('#qq-noi-bo-count').text(list.length);
      if (!list.length) { $('#qq-noi-bo-body').html('<tr><td colspan="7" class="text-center text-muted py-3">Chưa có giao dịch chuyển tiền / điều chỉnh.</td></tr>'); return; }
      var nid = state.view ? state.view.nid : 0;
      $('#qq-noi-bo-body').html($.map(list, function (g) {
        var amount, content;
        if (g.loai === 'chuyen_quy') {
          var out = g.nid_quy === nid;
          amount = '<span class="' + (out ? 'qq-minus' : 'qq-plus') + '">' + (out ? '−' : '+') + money(g.so_tien) + '</span>';
          content = (out ? 'Chuyển sang <b>' + esc(g.quy_nhan) + '</b>' : 'Nhận từ <b>' + esc(g.quy_chuyen) + '</b>');
        }
        else {
          amount = '<span class="' + (g.so_tien >= 0 ? 'qq-plus' : 'qq-minus') + '">' + signedMoney(g.so_tien) + '</span>';
          content = '';
        }
        if (g.dien_giai) content += (content ? '<br>' : '') + '<span class="qq-dien-giai small">' + esc(g.dien_giai) + '</span>';
        var action = g.da_huy ? '<span class="badge bg-label-secondary">Đã huỷ</span>'
          : (g.co_the_huy ? '<button type="button" class="btn btn-sm btn-label-danger qq-cancel-gd" data-id="' + g.gd_id + '" data-ma="' + esc(g.ma) + '"><i class="ti tabler-x me-1"></i>Huỷ</button>'
            : (g.ly_do_khong_huy ? '<span class="small text-muted" title="' + esc(g.ly_do_khong_huy) + '"><i class="ti tabler-lock"></i></span>' : ''));
        return '<tr class="' + (g.da_huy ? 'qq-row-cancel' : '') + '"><td>' + esc(g.ma) + '</td><td>' + esc(g.ngay) + '</td><td>' + esc(g.loai_label) + '</td><td class="qq-no-strike">' + content + '</td>' +
          '<td class="text-end qq-money">' + amount + '</td><td>' + esc(g.nguoi_tao) + '<div class="small text-muted">' + esc(g.tao_luc) + '</div></td><td class="text-center qq-no-strike">' + action + '</td></tr>';
      }).join(''));
    }
    function renderHistory(d) {
      var html = '<h6 class="mb-2">Đổi người quản lý</h6><div class="table-responsive mb-3"><table class="table table-sm table-bordered qq-lines mb-0"><thead><tr><th style="width:150px;">Thời gian</th><th>Từ</th><th>Sang</th><th>Người thực hiện</th></tr></thead><tbody>' +
        ($.map(d.lich_su_nguoi_quan_ly || [], function (h) {
          return '<tr><td>' + esc(h.thoi_gian) + '</td><td>' + esc(h.tu) + '</td><td>' + esc(h.den) + '</td><td>' + esc(h.nguoi) + '</td></tr>';
        }).join('') || '<tr><td colspan="4" class="text-center text-muted">Chưa có.</td></tr>') + '</tbody></table></div>';
      var old = d.lich_su_dieu_chinh_cu || [];
      if (old.length) {
        html += '<h6 class="mb-2">Điều chỉnh số dư đầu kỳ (cách cũ)</h6><div class="table-responsive"><table class="table table-sm table-bordered qq-lines mb-0"><thead><tr><th style="width:150px;">Thời gian</th><th class="text-end">Cũ</th><th class="text-end">Mới</th><th class="text-end">Chênh lệch</th><th>Lý do</th><th>Người thực hiện</th></tr></thead><tbody>' +
          $.map(old, function (h) {
            return '<tr><td>' + esc(h.thoi_gian) + '</td><td class="text-end qq-money">' + money(h.so_du_cu) + '</td><td class="text-end qq-money">' + money(h.so_du_moi) + '</td><td class="text-end qq-money">' + signedMoney(h.chenh_lech) + '</td><td>' + esc(h.ly_do) + '</td><td>' + esc(h.nguoi) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      $('#qq-history').html(html);
    }
    function switchViewTab(tab) {
      $('#qq-view-modal [data-qq-tab]').removeClass('active').filter('[data-qq-tab="' + tab + '"]').addClass('active');
      $('#qq-view-modal [data-qq-pane]').addClass('d-none').filter('[data-qq-pane="' + tab + '"]').removeClass('d-none');
    }

    function loadLedger() {
      if (!state.view || !state.view.nid) return;
      var r = rangeOf($('#qq-ledger-ky'));
      $('#qq-ledger-body').html('<tr><td colspan="8" class="text-center py-3"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></td></tr>');
      ajax({
        url: API + '/' + state.view.nid + '/so-quy', type: 'GET', data: { tu_ngay: r.tu, den_ngay: r.den, page: state.ledgerPage },
        success: function (res) { renderLedger((res && res.data) || {}); },
        error: function (xhr) { $('#qq-ledger-body').html('<tr><td colspan="8" class="text-center text-danger py-3">' + esc(apiMsg(xhr)) + '</td></tr>'); }
      });
    }
    function renderLedger(d) {
      var items = d.items || [];
      var cur = parseInt(d.current_page, 10) || 1, total = parseInt(d.total_pages, 10) || 0;
      state.ledgerPage = cur;
      $('#qq-ledger-sum').html('<span>Đầu kỳ <b>' + money(d.dau_ky) + '</b></span><span class="qq-plus">Thu <b>' + money(d.thu) + '</b></span>' +
        '<span class="qq-minus">Chi <b>' + money(d.chi) + '</b></span><span>Cuối kỳ <b>' + money(d.cuoi_ky) + '</b></span>');
      var html = '';
      if (cur <= 1) html += '<tr class="qq-row-total"><td colspan="6">Số dư đầu kỳ' + (d.ky ? ' (' + esc(d.ky.tu_ngay) + ')' : '') + '</td><td class="text-end qq-money">' + money(d.dau_ky) + '</td><td></td></tr>';
      html += $.map(items, function (r) {
        var code = r.nid_phieu ? '<a href="/thu-chi#xem-' + r.nid_phieu + '" target="_blank" rel="noopener" title="Mở phiếu ở màn Thu chi">' + esc(r.ma_chung_tu) + '</a>' : esc(r.ma_chung_tu);
        return '<tr><td>' + esc(r.ngay) + '</td><td>' + code + '</td><td>' + esc(r.nguon) + '</td><td class="qq-dien-giai">' + esc(r.dien_giai || '') + '</td>' +
          '<td class="text-end qq-money qq-plus">' + (r.thu ? money(r.thu) : '') + '</td><td class="text-end qq-money qq-minus">' + (r.chi ? money(r.chi) : '') + '</td>' +
          '<td class="text-end qq-money fw-semibold">' + money(r.so_du_sau) + '</td><td>' + esc(r.nguoi) + '</td></tr>';
      }).join('');
      if (!items.length) html += '<tr><td colspan="8" class="text-center text-muted py-3">Không có phát sinh trong kỳ.</td></tr>';
      if (cur >= total) html += '<tr class="qq-row-total"><td colspan="4">Cộng phát sinh / số dư cuối kỳ' + (d.ky ? ' (' + esc(d.ky.den_ngay) + ')' : '') + '</td><td class="text-end qq-money qq-plus">' + money(d.thu) + '</td><td class="text-end qq-money qq-minus">' + money(d.chi) + '</td><td class="text-end qq-money">' + money(d.cuoi_ky) + '</td><td></td></tr>';
      $('#qq-ledger-body').html(html);
      $('#qq-ledger-info').text((parseInt(d.total, 10) || 0) + ' dòng phát sinh');
      $('#qq-ledger-pager').html(total > 1 ? pagerHtml(cur, total, 'qq-ledger-page') : '');
    }

    function cancelGiaoDich(gdId, ma) {
      reasonBox('Huỷ ' + ma + '?', 'Giao dịch bị gỡ khỏi sổ quỹ và số dư được tính lại.', 'Huỷ giao dịch').done(function (lyDo) {
        loading('qq-view-loading', true);
        ajax({
          url: API + '/giao-dich/' + gdId + '/huy', type: 'POST', data: JSON.stringify({ ly_do: lyDo }),
          success: function (res) {
            toast((res && res.data && res.data.message) || 'Đã huỷ.', true);
            state.options = null;
            loadList();
            openView(state.view.nid);
            switchViewTab('noi-bo');
          },
          error: function (xhr) { toast(apiMsg(xhr), false); loading('qq-view-loading', false); }
        });
      });
    }

    /* ---------- thao tác ---------- */
    function runAction(id, action, $el) {
      var row = $('#qq-tbody tr[data-id="' + id + '"]');
      var name = (state.view && state.view.nid === parseInt(id, 10) && state.view.ten_quy) || $.trim(row.find('.qq-name').text()) || '';
      if (action === 'xem') openView(id);
      else if (action === 'sua') openForm(id);
      else if (action === 'dieu_chinh') openAdjust(id, name);
      else if (action === 'xoa') deleteQuy(id, name);
    }

    /* ---------- sự kiện ---------- */
    function bind() {
      $('#qq-btn-search').on('click', reload);
      $('#qq-f-q').on('keydown', function (e) { if (e.which === 13) { e.preventDefault(); reload(); } });
      $('#qq-btn-reset').on('click', function () {
        $('#qq-f-q').val('');
        if ($('#qq-f-ky').data('daterangepicker')) monthRange($('#qq-f-ky'));
        state.tab = '';
        reload();
      });
      $(document).on('click', '#qq-tabs [data-tab]', function (e) {
        e.preventDefault();
        var tab = String($(this).attr('data-tab'));
        if (tab === state.tab) return;
        state.tab = tab;
        reload();
      });
      $(document).on('click', '#qq-pagination .qq-page', function (e) {
        e.preventDefault();
        var p = parseInt($(this).attr('data-page'), 10);
        if (p && p !== state.page && !$(this).parent().hasClass('disabled')) { state.page = p; loadList(); }
      });
      $('#qq-pagination-jump').on('keydown', function (e) {
        if (e.which !== 13) return;
        var p = parseInt(this.value, 10), total = parseInt($(this).attr('data-total'), 10) || 0;
        if (p > 0 && p <= total) { state.page = p; loadList(); }
      });
      $(document).on('click', '.qq-act', function (e) {
        e.preventDefault();
        runAction($(this).attr('data-id'), String($(this).attr('data-action')), $(this));
      });
      $('#qq-tbody').on('dblclick', 'tr[data-id]', function (e) {
        if ($(e.target).closest('a, button, input, .dropdown').length) return;
        openView($(this).attr('data-id'));
      });

      // Chi tiết
      $('#qq-view-modal').on('click', '[data-qq-tab]', function () { switchViewTab($(this).attr('data-qq-tab')); });
      $('#qq-view-modal').on('click', '.qq-ledger-page', function (e) {
        e.preventDefault();
        var p = parseInt($(this).attr('data-page'), 10);
        if (p && p !== state.ledgerPage && !$(this).parent().hasClass('disabled')) { state.ledgerPage = p; loadLedger(); }
      });
      $('#qq-view-modal').on('click', '.qq-cancel-gd', function () { cancelGiaoDich($(this).attr('data-id'), $(this).attr('data-ma')); });
      $('#qq-view-modal').on('click', '.qq-view-transfer', function () { openTransfer($(this).attr('data-id')); });
      $('#qq-view-modal').on('hidden.bs.modal', function () { state.view = null; });
      initRange($('#qq-ledger-ky'), function () { state.ledgerPage = 1; loadLedger(); });

      if (!canManage) return;
      $('#qq-btn-create').on('click', function () { openForm(0); });
      $('#qq-btn-transfer').on('click', function () { openTransfer(0); });
      bindMoney('#qq-in-so-du, #qq-tr-amount, #qq-adj-actual');
      $('#qq-form').on('submit', function (e) { e.preventDefault(); saveForm(); });
      $('#qq-in-ma, #qq-in-ten').on('input', function () { $(this).removeClass('is-invalid'); });
      $('#qq-tr-from').on('change', function () { showBalance('#qq-tr-from', '#qq-tr-from-balance'); });
      $('#qq-tr-to').on('change', function () { showBalance('#qq-tr-to', '#qq-tr-to-balance'); });
      $('#qq-transfer-form').on('submit', function (e) { e.preventDefault(); saveTransfer(); });
      $('#qq-adj-date').on('change', loadBookBalance);
      $('#qq-adj-actual').on('input', updateDiff);
      $('#qq-adjust-form').on('submit', function (e) { e.preventDefault(); saveAdjust(); });
      // Enter = Lưu (trừ ô nhiều dòng / ô tìm của Select2).
      $('#qq-form, #qq-transfer-form, #qq-adjust-form').on('keydown', function (e) {
        if (e.which === 13 && !$(e.target).is('textarea, .select2-search__field')) { e.preventDefault(); $(this).trigger('submit'); }
      });
    }

    bind();
    renderTabs({});
    initRange($('#qq-f-ky'), reload);
    loadList();
  }

  function start() {
    if (!document.getElementById('qq-app')) return;
    var $ = pickJq();
    if ($) QuanLyQuy($);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

/**
 * Modal Tạo / Sửa phiếu trả khách hàng — dùng chung /phieu-tra-khach-hang và /ke-hoach-xep-xe.
 *
 *   PtkhModal.openCreate({ onSaved: function (phieu) {} })
 *   PtkhModal.openEdit(id, { onSaved: function (phieu) {} })
 *
 * Chọn khách hàng → GET /api/phieu-tra-khach-hang/candidates (chỉ kế hoạch hoàn thành, chưa nằm trong phiếu chưa huỷ nào —
 * kế hoạch đã ở phiếu khác không hiện). Sửa: gửi thêm nid_phieu để kế hoạch của chính phiếu vẫn có và được tick sẵn;
 * bỏ tick = bớt, tick thêm = gom thêm, chỉ áp dụng khi Lưu (PUT gửi TOÀN BỘ danh sách muốn giữ).
 * Kế hoạch đã tick vẫn giữ trong bảng khi đổi bộ lọc (lọc chỉ để tìm thêm, không làm mất dòng đã chọn).
 */
(function () {
  'use strict';

  var API = '/api/phieu-tra-khach-hang';

  // Trang có thể có nhiều bản jQuery; Select2/daterangepicker chỉ gắn vào 1 bản ⇒ chọn bản có plugin lúc khởi tạo.
  function pickJq() {
    var list = [window.jQuery, window.$];
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] === 'function' && list[i].fn && typeof list[i].fn.select2 === 'function') return list[i];
    }
    return typeof window.jQuery === 'function' ? window.jQuery : null;
  }

  var $;
  var notyf;
  var customersLoaded = false;
  var st = { mode: 'create', editId: 0, rows: {}, order: [], checked: {}, onSaved: null, loadingSeq: 0 };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
    });
  }

  function money(v) {
    return String(parseInt(v || 0, 10) || 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function apiToDate(val) {
    var d = String(val || '').split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : (val || '');
  }

  function apiMsg(xhr) {
    try { return JSON.parse(xhr.responseText).message || 'Lỗi không xác định'; }
    catch (e) { return 'Lỗi kết nối server'; }
  }

  function toast(message, ok) {
    if (!notyf && window.Notyf) notyf = new window.Notyf();
    if (notyf) { if (ok) notyf.success(message); else notyf.error(message); }
    else window.alert(message);
  }

  function modal() {
    var el = document.getElementById('ptkh-m-modal');
    return el && window.bootstrap ? window.bootstrap.Modal.getOrCreateInstance(el) : null;
  }

  function loading(show) {
    $('#ptkh-m-loading').toggleClass('is-visible', !!show);
  }

  // Khách hàng: tải đủ mọi trang (100 dòng/lần), 1 lần cho cả trang.
  function loadCustomers(done) {
    if (customersLoaded) { done(); return; }
    var all = [];
    function page(p, totalPages) {
      $.ajax({
        url: '/api/khach-hang', type: 'GET', dataType: 'json',
        data: { page: p, limit: 100, select: 'nid,ma_kh,ten' },
        success: function (res) {
          var d = (res && res.data) || {};
          all = all.concat(d.items || []);
          var total = totalPages || Math.min(50, Math.max(1, parseInt(d.total_pages, 10) || 1));
          if (p < total) { page(p + 1, total); return; }
          var html = '<option value="">Chọn khách hàng…</option>';
          $.each(all, function (_, kh) {
            // Chỉ hiện mã KH (tên ngắn gọn); khách chưa có mã thì dùng tên.
            var label = kh.ma_kh || kh.ten || ('Khách hàng #' + kh.nid);
            html += '<option value="' + kh.nid + '">' + esc(label) + '</option>';
          });
          $('#ptkh-m-customer').html(html);
          if ($.fn.select2) {
            var $sel = $('#ptkh-m-customer');
            if ($sel.data('select2')) $sel.select2('destroy');
            $sel.select2({ placeholder: 'Chọn khách hàng…', allowClear: true, width: '100%', dropdownParent: $('#ptkh-m-modal') });
          }
          customersLoaded = true;
          done();
        },
        error: function (xhr) { toast(apiMsg(xhr), false); done(); }
      });
    }
    page(1, 0);
  }

  function readRange() {
    var $range = $('#ptkh-m-daterange');
    var picker = $range.data('daterangepicker');
    if (!$range.val() || !picker) return { from: '', to: '' };
    return { from: picker.startDate.format('DD/MM/YYYY'), to: picker.endDate.format('DD/MM/YYYY') };
  }

  function clearRange() {
    var $range = $('#ptkh-m-daterange');
    var picker = $range.data('daterangepicker');
    $range.val('');
    if (picker && window.moment) { picker.setStartDate(window.moment().startOf('day')); picker.setEndDate(window.moment().endOf('day')); }
  }

  // Cùng daterangepicker (tiếng Việt + Hôm nay/Tuần này/Tháng này) với bộ lọc /ke-hoach-xep-xe và modal Tạo đề nghị thanh toán.
  function initRange() {
    var $range = $('#ptkh-m-daterange');
    if (!$range.length || $range.data('daterangepicker') || typeof $.fn.daterangepicker !== 'function' || typeof window.moment === 'undefined') return;
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
    if (picker && picker.container) picker.container.addClass('ptkh-m-daterangepicker');
    $range.on('apply.daterangepicker', function (e, p) {
      $(this).val(p.startDate.format('DD/MM/YYYY') + ' đến ' + p.endDate.format('DD/MM/YYYY'));
      loadCandidates();
    }).on('cancel.daterangepicker', function () {
      $(this).val('');
      loadCandidates();
    }).on('show.daterangepicker', function (e, p) {
      var $footer = p.container.find('.drp-buttons');
      if (!$footer.length) return;
      $footer.find('.ptkh-m-date-quick').remove();
      $footer.find('.cancelBtn').show();
      var $quick = $('<span class="ptkh-m-date-quick"></span>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="today">Hôm nay</button>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="week">Tuần này</button>')
        .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="month">Tháng này</button>');
      $footer.prepend($quick);
      $quick.find('[data-q]').on('click', function () {
        var q = $(this).attr('data-q');
        var end = window.moment().startOf('day');
        var start = end.clone();
        if (q === 'week') { start = end.clone().startOf('isoWeek'); end = end.clone().endOf('isoWeek').startOf('day'); }
        else if (q === 'month') { start = end.clone().startOf('month'); end = end.clone().endOf('month').startOf('day'); }
        p.setStartDate(start);
        p.setEndDate(end);
        $range.val(start.format('DD/MM/YYYY') + ' đến ' + end.format('DD/MM/YYYY'));
        p.hide();
        loadCandidates();
      });
    });
  }

  function loadCandidates() {
    var customer = $('#ptkh-m-customer').val();
    if (!customer) { st.rows = {}; st.order = []; render(); return; }
    var range = readRange();
    var params = { nid_khach_hang: customer, from_date: range.from, to_date: range.to };
    if (st.mode === 'edit' && st.editId) params.nid_phieu = st.editId;
    var seq = ++st.loadingSeq;
    loading(true);
    $.ajax({
      url: API + '/candidates', type: 'GET', dataType: 'json', data: params,
      success: function (res) {
        if (seq !== st.loadingSeq) return;
        var items = (res && res.data && res.data.items) || [];
        // Giữ lại các dòng đã tick nhưng không có trong kết quả lọc mới.
        var rows = {}, order = [];
        $.each(items, function (_, it) {
          if (it.chon_duoc === false) return;
          rows[it.nid] = it;
          order.push(it.nid);
        });
        $.each(st.order, function (_, nid) {
          if (st.checked[nid] && !rows[nid] && st.rows[nid]) { rows[nid] = st.rows[nid]; order.unshift(nid); }
        });
        st.rows = rows;
        st.order = order;
        $.each(st.checked, function (nid) { if (!st.rows[nid]) delete st.checked[nid]; });
        render();
      },
      error: function (xhr) {
        if (seq !== st.loadingSeq) return;
        toast(apiMsg(xhr), false);
      },
      complete: function () { if (seq === st.loadingSeq) loading(false); }
    });
  }

  function matchesKeyword(it, kw) {
    if (!kw) return true;
    var hay = [it.so_cont, it.so_bkg, it.label].join(' ').toLowerCase();
    return hay.indexOf(kw) !== -1;
  }

  function render() {
    var hasCustomer = !!$('#ptkh-m-customer').val();
    var kw = $.trim($('#ptkh-m-q').val() || '').toLowerCase();
    var html = '';
    var shown = 0;
    $.each(st.order, function (_, nid) {
      var it = st.rows[nid];
      var checked = !!st.checked[nid];
      if (!checked && !matchesKeyword(it, kw)) return;
      shown++;
      html += '<tr class="ptkh-m-row' + (checked ? ' is-checked' : '') + '" data-nid="' + it.nid + '">' +
        '<td class="text-center"><input type="checkbox" class="form-check-input ptkh-m-check" value="' + it.nid + '"' + (checked ? ' checked' : '') + '></td>' +
        '<td>' + esc(apiToDate(it.ngay) || '—') + '</td>' +
        '<td>' + esc(it.so_bkg || '—') + '</td>' +
        '<td class="fw-semibold">' + esc(it.so_cont || '—') + '</td>' +
        '<td>' + esc(it.loai_cont || '—') + '</td>' +
        '<td>' + esc(it.tuyen || '—') + '</td>' +
        '<td class="text-end ptkh-m-money">' + money(it.tong_doanh_thu) + '</td>' +
        '<td class="text-end ptkh-m-money">' + money(it.tong_chi_ho_khach_hang) + '</td>' +
        '<td class="text-end ptkh-m-money fw-semibold">' + money(it.tong_tien) + '</td>' +
        '</tr>';
    });
    $('#ptkh-m-lines').html(html);
    $('#ptkh-m-table-wrap').toggleClass('d-none', !shown);
    if (!hasCustomer) {
      $('#ptkh-m-empty').removeClass('d-none').text('Chọn khách hàng để hiện các kế hoạch khả dụng.');
    } else if (!shown) {
      $('#ptkh-m-empty').removeClass('d-none').text(st.order.length
        ? 'Không có kế hoạch khớp bộ lọc.'
        : 'Khách hàng này không còn kế hoạch hoàn thành nào chưa xuất phiếu (thử bỏ bớt bộ lọc ngày).');
    } else {
      $('#ptkh-m-empty').addClass('d-none');
    }
    summary();
  }

  function summary() {
    var count = 0, dt = 0, ch = 0, total = 0;
    $.each(st.checked, function (nid) {
      var it = st.rows[nid];
      if (!it) return;
      count++;
      dt += parseInt(it.tong_doanh_thu, 10) || 0;
      ch += parseInt(it.tong_chi_ho_khach_hang, 10) || 0;
      total += parseInt(it.tong_tien, 10) || 0;
    });
    $('#ptkh-m-count').text(count);
    $('#ptkh-m-sum-dt').text(money(dt));
    $('#ptkh-m-sum-ch').text(money(ch));
    $('#ptkh-m-total').text(money(total) + ' đ');
    var $rows = $('#ptkh-m-lines .ptkh-m-check');
    var allChecked = $rows.length > 0 && $rows.filter(':checked').length === $rows.length;
    $('#ptkh-m-check-all').prop('checked', allChecked);
  }

  function setChecked(nid, on) {
    if (on) st.checked[nid] = true; else delete st.checked[nid];
    var $tr = $('#ptkh-m-lines tr[data-nid="' + nid + '"]');
    $tr.toggleClass('is-checked', !!on).find('.ptkh-m-check').prop('checked', !!on);
  }

  function resetForm(mode, id) {
    st.mode = mode;
    st.editId = id || 0;
    st.rows = {};
    st.order = [];
    st.checked = {};
    var isEdit = mode === 'edit';
    $('#ptkh-m-title').text(isEdit ? 'Sửa phiếu trả khách hàng' : 'Tạo phiếu trả khách hàng');
    $('#ptkh-m-ma').addClass('d-none').text('');
    $('#ptkh-m-hint').toggleClass('d-none', isEdit);
    $('#ptkh-m-save').html('<i class="ti tabler-device-floppy me-1"></i>' + (isEdit ? 'Lưu phiếu' : 'Tạo phiếu')).prop('disabled', false);
    $('#ptkh-m-q, #ptkh-m-note').val('');
    $('#ptkh-m-customer').removeClass('is-invalid').prop('disabled', false).val('').trigger('change.select2');
    clearRange();
    render();
  }

  function openCreate(opts) {
    opts = opts || {};
    resetForm('create', 0);
    st.onSaved = opts.onSaved || null;
    var m = modal();
    if (m) m.show();
    loading(true);
    loadCustomers(function () {
      loading(false);
      if (opts.nid_khach_hang) {
        $('#ptkh-m-customer').val(String(opts.nid_khach_hang)).trigger('change.select2');
        loadCandidates();
      }
    });
  }

  function openEdit(id, opts) {
    opts = opts || {};
    resetForm('edit', parseInt(id, 10) || 0);
    st.onSaved = opts.onSaved || null;
    var m = modal();
    if (m) m.show();
    loading(true);
    loadCustomers(function () {
      $.ajax({
        url: API + '/' + st.editId, type: 'GET', dataType: 'json',
        success: function (res) {
          var item = (res && res.data) || {};
          $('#ptkh-m-title').text('Sửa phiếu trả khách hàng');
          if (item.ma_phieu) $('#ptkh-m-ma').removeClass('d-none').text(item.ma_phieu);
          $('#ptkh-m-note').val(item.ghi_chu || '');
          // Khách hàng của phiếu không đổi được khi sửa.
          $('#ptkh-m-customer').val(String(item.nid_khach_hang || '')).trigger('change.select2').prop('disabled', true);
          $.each(item.items || [], function (_, r) { st.checked[r.nid_ke_hoach] = true; });
          loadCandidates();
        },
        error: function (xhr) {
          loading(false);
          toast(apiMsg(xhr), false);
          if (m) m.hide();
        }
      });
    });
  }

  function save() {
    var customer = $('#ptkh-m-customer').val();
    if (!customer) {
      $('#ptkh-m-customer').addClass('is-invalid');
      toast('Vui lòng chọn khách hàng.', false);
      return;
    }
    var ids = [];
    $.each(st.checked, function (nid) { ids.push(parseInt(nid, 10)); });
    if (!ids.length) { toast('Vui lòng chọn ít nhất 1 kế hoạch.', false); return; }
    var isEdit = st.mode === 'edit' && st.editId;
    var payload = {
      nid_ke_hoach: ids,
      ghi_chu: $.trim($('#ptkh-m-note').val())
    };
    if (!isEdit) payload.nid_khach_hang = customer;
    var $btn = $('#ptkh-m-save').prop('disabled', true);
    loading(true);
    $.ajax({
      url: isEdit ? API + '/' + st.editId : API,
      type: isEdit ? 'PUT' : 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payload),
      success: function (res) {
        toast(isEdit ? 'Đã lưu phiếu trả khách hàng.' : 'Đã tạo phiếu trả khách hàng ' + ((res && res.data && res.data.ma_phieu) || '') + '.', true);
        var m = modal();
        if (m) m.hide();
        if (typeof st.onSaved === 'function') st.onSaved((res && res.data) || {});
      },
      error: function (xhr) { toast(apiMsg(xhr), false); },
      complete: function () { $btn.prop('disabled', false); loading(false); }
    });
  }

  function bind() {
    $('#ptkh-m-customer').on('change', function () {
      if ($(this).prop('disabled')) return;
      $(this).removeClass('is-invalid');
      st.checked = {};
      loadCandidates();
    });
    $('#ptkh-m-q').on('input', render);
    $('#ptkh-m-lines').on('click', 'tr.ptkh-m-row', function (e) {
      var nid = parseInt($(this).attr('data-nid'), 10);
      if ($(e.target).is('input.ptkh-m-check')) {
        setChecked(nid, e.target.checked);
      } else {
        // Bấm cả dòng để tick; bỏ qua khi đang bôi đen chữ.
        var sel = window.getSelection ? String(window.getSelection()) : '';
        if (sel) return;
        setChecked(nid, !st.checked[nid]);
      }
      summary();
    });
    $('#ptkh-m-check-all').on('change', function () {
      var on = this.checked;
      $('#ptkh-m-lines .ptkh-m-check').each(function () { setChecked(parseInt(this.value, 10), on); });
      summary();
    });
    $('#ptkh-m-save').on('click', save);
    $('#ptkh-m-modal').on('keydown', function (e) {
      if (e.which === 13 && $(e.target).is('#ptkh-m-note')) { e.preventDefault(); save(); }
    });
  }

  function init() {
    if (!document.getElementById('ptkh-m-modal')) return;
    $ = pickJq();
    if (!$) return;
    bind();
    initRange();
  }

  window.PtkhModal = {
    openCreate: function (opts) { if ($) openCreate(opts); },
    openEdit: function (id, opts) { if ($) openEdit(id, opts); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

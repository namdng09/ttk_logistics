/**
 * Màn /thu-chi — hybrid: template rỗng (templates/thu-chi-list.tpl.php) + JS gọi API /api/thu-chi (thu_chi.api.inc).
 *
 * - Danh sách: lọc (từ khoá, loại phiếu, phân loại, quỹ, ngày phiếu), tab trạng thái duyệt có số lượng, tổng thu/chi đã vào quỹ.
 * - Thao tác trên từng phiếu do server trả về (`hanh_dong`, _thu_chi_actions()) — JS chỉ hiển thị.
 * - Phiếu do module khác tạo (công nợ, lương…) có `nguon` + `khoa` (lý do khoá): chỉ xem.
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

  function ThuChi($) {
    var API = '/api/thu-chi';
    var settings = (window.Drupal && Drupal.settings && Drupal.settings.thu_chi) || {};
    var canManage = !!(settings.permissions && settings.permissions.manage);
    var notyf = null;
    var state = { page: 1, tab: 'all', options: null, formId: 0, viewId: 0 };

    var TABS = [
      { id: 'all', label: 'Tất cả' },
      { id: 'cho_duyet', label: 'Chờ duyệt' },
      { id: 'da_duyet', label: 'Đã duyệt' },
      { id: 'yeu_cau_dieu_chinh', label: 'Yêu cầu điều chỉnh' },
      { id: 'duyet_dieu_chinh', label: 'Duyệt điều chỉnh' },
      { id: 'khong_duyet', label: 'Không duyệt' }
    ];
    var STATUS_CLASS = {
      cho_duyet: 'bg-label-warning',
      da_duyet: 'bg-label-success',
      khong_duyet: 'bg-label-danger',
      yeu_cau_dieu_chinh: 'bg-label-info',
      duyet_dieu_chinh: 'bg-label-primary'
    };
    var ACTION_UI = {
      sua: { icon: 'tabler-edit', color: 'text-primary', btn: 'btn-label-primary' },
      duyet: { icon: 'tabler-circle-check', color: 'text-success', btn: 'btn-success' },
      khong_duyet: { icon: 'tabler-circle-x', color: 'text-danger', btn: 'btn-label-danger' },
      yeu_cau_dieu_chinh: { icon: 'tabler-edit-circle', color: 'text-warning', btn: 'btn-label-warning' },
      duyet_dieu_chinh: { icon: 'tabler-circle-check', color: 'text-success', btn: 'btn-success' },
      tu_choi_dieu_chinh: { icon: 'tabler-arrow-back-up', color: 'text-secondary', btn: 'btn-label-secondary' },
      xoa: { icon: 'tabler-trash', color: 'text-danger', btn: 'btn-label-danger' }
    };
    var CONFIRM = {
      duyet: ['Duyệt phiếu?', 'Phiếu được tính vào sổ quỹ ngay sau khi duyệt.', 'Duyệt'],
      khong_duyet: ['Không duyệt phiếu?', 'Phiếu không được tính vào quỹ. Có thể sửa rồi duyệt lại.', 'Không duyệt'],
      yeu_cau_dieu_chinh: ['Yêu cầu điều chỉnh phiếu?', 'Phiếu vẫn giữ hiệu lực trong quỹ cho tới khi yêu cầu được duyệt.', 'Gửi yêu cầu'],
      duyet_dieu_chinh: ['Duyệt yêu cầu điều chỉnh?', 'Phiếu được mở để sửa; tạm thời không tính vào quỹ cho tới khi duyệt lại.', 'Duyệt điều chỉnh'],
      tu_choi_dieu_chinh: ['Từ chối yêu cầu điều chỉnh?', 'Phiếu giữ nguyên trạng thái đã duyệt.', 'Từ chối'],
      xoa: ['Xoá phiếu?', 'Phiếu sẽ bị xoá (xoá mềm).', 'Xoá']
    };

    /* ---------- tiện ích ---------- */
    function esc(v) {
      return String(v == null ? '' : v).replace(/[&<>"']/g, function (m) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[m];
      });
    }
    function money(v) {
      var n = Math.round(parseFloat(v) || 0);
      var neg = n < 0;
      return (neg ? '-' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    function parseMoney(v) { return parseInt(String(v == null ? '' : v).replace(/[^\d-]/g, ''), 10) || 0; }
    function parseNum(v) { return parseFloat(String(v == null ? '' : v).replace(',', '.')) || 0; }
    function apiToDate(v) {
      var d = String(v || '').substr(0, 10).split('-');
      return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : '';
    }
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
    function statusBadge(status, label) {
      return '<span class="badge ' + (STATUS_CLASS[status] || 'bg-label-secondary') + '">' + esc(label || status) + '</span>';
    }
    function loaiChip(loai) {
      return loai === 'thu'
        ? '<span class="tc-chip tc-chip-thu"><i class="ti tabler-arrow-down-left"></i>Thu</span>'
        : '<span class="tc-chip tc-chip-chi"><i class="ti tabler-arrow-up-right"></i>Chi</span>';
    }
    function sourceChip(item) {
      if (!item.nguon || !item.nguon.label) return '';
      return '<div class="mt-1"><span class="tc-chip tc-chip-source" title="' + esc(item.khoa || ('Nguồn: ' + item.nguon.label)) + '">' +
        (item.khoa ? '<i class="ti tabler-lock"></i>' : '<i class="ti tabler-link"></i>') + esc(item.nguon.label) + '</span></div>';
    }
    function hasAction(item, action) {
      return $.grep(item.hanh_dong || [], function (a) { return a.action === action; }).length > 0;
    }
    function ajax(opts) {
      return $.ajax($.extend({ dataType: 'json', contentType: 'application/json; charset=utf-8' }, opts));
    }

    /* ---------- ô chọn ---------- */
    function initSelect2($el, opts) {
      if (!$el.length || !$.fn.select2) return;
      if ($el.data('select2')) $el.select2('destroy');
      $el.select2($.extend({ width: '100%', allowClear: true }, opts || {}));
    }
    function optionsHtml(list, first, key) {
      var html = first ? '<option value="">' + esc(first) + '</option>' : '';
      $.each(list || [], function (_, o) { html += '<option value="' + esc(o[key || 'id']) + '">' + esc(o.ten) + '</option>'; });
      return html;
    }
    function loadOptions(done) {
      if (state.options) { done(); return; }
      ajax({
        url: API + '/tuy-chon', type: 'GET',
        success: function (res) {
          var o = (res && res.data) || {};
          state.options = o;
          $('#tc-f-phan-loai').html(optionsHtml(o.phan_loai, 'Tất cả'));
          $('#tc-f-quy').html(optionsHtml(o.quy, 'Tất cả'));
          initSelect2($('#tc-f-phan-loai'), { placeholder: 'Tất cả' });
          initSelect2($('#tc-f-quy'), { placeholder: 'Tất cả' });
          var parent = $('#tc-form-modal');
          $('#tc-in-phan-loai').html(optionsHtml(o.phan_loai, ' '));
          $('#tc-in-quy').html(optionsHtml(o.quy, ' '));
          $('#tc-in-nguoi').html(optionsHtml(o.nguoi_de_xuat, ' '));
          $('#tc-in-kh').html(optionsHtml(o.khach_hang, ' '));
          $('#tc-in-ncc').html(optionsHtml(o.nha_cung_cap, ' '));
          // Phân loại: chọn có sẵn hoặc gõ tên mới (server tạo phân loại mới trong Danh mục).
          initSelect2($('#tc-in-phan-loai'), { placeholder: 'Chọn hoặc gõ mới', tags: true, dropdownParent: parent });
          initSelect2($('#tc-in-quy'), { placeholder: 'Chọn quỹ', dropdownParent: parent });
          initSelect2($('#tc-in-nguoi'), { placeholder: 'Chọn người đề xuất', dropdownParent: parent });
          initSelect2($('#tc-in-kh'), { placeholder: 'Không chọn', dropdownParent: parent });
          initSelect2($('#tc-in-ncc'), { placeholder: 'Không chọn', dropdownParent: parent });
          $('#tc-noi-dung-list').html($.map(o.noi_dung || [], function (t) { return '<option value="' + esc(t) + '"></option>'; }).join(''));
          done();
        },
        error: function (xhr) { toast(apiMsg(xhr), false); done(); }
      });
    }

    /* ---------- khoảng ngày ---------- */
    function readRange() {
      var $r = $('#tc-f-ngay');
      var p = $r.data('daterangepicker');
      if (!$r.val() || !p) return { tu: '', den: '' };
      return { tu: p.startDate.format('DD/MM/YYYY'), den: p.endDate.format('DD/MM/YYYY') };
    }
    function setRange(start, end) {
      var $r = $('#tc-f-ngay');
      var p = $r.data('daterangepicker');
      if (!p) return;
      p.setStartDate(start);
      p.setEndDate(end);
      $r.val(start.format('DD/MM/YYYY') + ' đến ' + end.format('DD/MM/YYYY'));
    }
    function defaultRange() { setRange(moment().startOf('month'), moment().endOf('month').startOf('day')); }
    function initRange() {
      var $r = $('#tc-f-ngay');
      if (!$r.length || typeof $.fn.daterangepicker !== 'function' || typeof window.moment === 'undefined') return;
      $r.daterangepicker({
        autoUpdateInput: false, autoApply: true, showDropdowns: true, opens: 'left',
        locale: {
          format: 'DD/MM/YYYY', separator: ' đến ', applyLabel: 'Áp dụng', cancelLabel: 'Xóa', customRangeLabel: 'Tùy chọn',
          daysOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
          monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
          firstDay: 1
        }
      });
      var p = $r.data('daterangepicker');
      if (p && p.container) p.container.addClass('tc-daterangepicker');
      $r.on('apply.daterangepicker', function (e, pk) { setRange(pk.startDate, pk.endDate); reload(); })
        .on('cancel.daterangepicker', function () { $(this).val(''); reload(); })
        .on('show.daterangepicker', function (e, pk) {
          var $f = pk.container.find('.drp-buttons');
          $f.find('.tc-date-quick').remove();
          $f.find('.cancelBtn').show();
          var $q = $('<span class="tc-date-quick"></span>')
            .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="today">Hôm nay</button>')
            .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="month">Tháng này</button>')
            .append('<button type="button" class="btn btn-sm btn-label-secondary" data-q="last">Tháng trước</button>');
          $f.prepend($q);
          $q.find('[data-q]').on('click', function () {
            var q = $(this).attr('data-q');
            var s = moment().startOf('day'), e2 = s.clone();
            if (q === 'month') { s = moment().startOf('month'); e2 = moment().endOf('month').startOf('day'); }
            else if (q === 'last') { s = moment().subtract(1, 'month').startOf('month'); e2 = moment().subtract(1, 'month').endOf('month').startOf('day'); }
            setRange(s, e2);
            pk.hide();
            reload();
          });
        });
      defaultRange();
    }

    /* ---------- danh sách ---------- */
    function params() {
      var r = readRange();
      return {
        page: state.page,
        keyword: $.trim($('#tc-f-q').val() || ''),
        loai_phieu: $('#tc-f-loai').val() || '',
        nid_phan_loai: $('#tc-f-phan-loai').val() || '',
        nid_quy: $('#tc-f-quy').val() || '',
        tu_ngay: r.tu,
        den_ngay: r.den,
        duyet_status: state.tab === 'all' ? '' : state.tab
      };
    }
    function reload() { state.page = 1; loadList(); }

    function loadList() {
      $('#tc-tbody').html('<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>');
      ajax({
        url: API, type: 'GET', data: params(),
        success: function (res) {
          var d = (res && res.data) || {};
          var items = d.items || [];
          $('#tc-tbody').html(items.length ? $.map(items, rowHtml).join('') : '<tr><td colspan="10" class="text-center text-muted py-4">Không có phiếu nào.</td></tr>');
          renderTabs(d.status_counts || {});
          renderSum(d.tong || {});
          renderPager(d);
        },
        error: function (xhr) {
          var denied = xhr.status === 401 || xhr.status === 403;
          $('#tc-tbody').html('<tr><td colspan="10" class="text-center py-4 ' + (denied ? 'text-warning' : 'text-danger') + '">' + (denied ? '<i class="ti tabler-lock me-1"></i>' : '') + esc(apiMsg(xhr)) + '</td></tr>');
        }
      });
    }

    function actionMenuItems(item) {
      var html = '<li><a href="#" class="dropdown-item tc-act" data-id="' + item.nid + '" data-action="xem"><i class="ti tabler-eye me-2 text-info"></i>Xem chi tiết</a></li>';
      var acts = item.hanh_dong || [];
      if (acts.length) html += '<li><hr class="dropdown-divider"></li>';
      $.each(acts, function (_, a) {
        var ui = ACTION_UI[a.action] || { icon: 'tabler-point', color: 'text-secondary' };
        html += '<li><a href="#" class="dropdown-item tc-act' + (a.action === 'xoa' ? ' text-danger' : '') + '" data-id="' + item.nid + '" data-action="' + esc(a.action) + '"><i class="ti ' + ui.icon + ' me-2 ' + ui.color + '"></i>' + esc(a.label) + '</a></li>';
      });
      if (item.khoa) html += '<li><span class="dropdown-item disabled small text-wrap" style="max-width:280px;" title="' + esc(item.khoa) + '"><i class="ti tabler-lock me-2"></i>Quản lý ở màn ' + esc(item.nguon.label) + '</span></li>';
      return html;
    }

    function rowHtml(item) {
      var doiTuong = [];
      if (item.khach_hang) doiTuong.push('KH: ' + item.khach_hang.ten);
      if (item.nha_cung_cap) doiTuong.push('NCC: ' + item.nha_cung_cap.ten);
      return '<tr data-id="' + item.nid + '">' +
        '<td class="text-center"><div class="dropdown"><button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button><ul class="dropdown-menu">' + actionMenuItems(item) + '</ul></div></td>' +
        '<td><a href="#" class="tc-code tc-act" data-id="' + item.nid + '" data-action="xem">' + esc(item.ma_giao_dich) + '</a><div class="small text-muted">' + esc(apiToDate(item.ngay_giao_dich)) + '</div></td>' +
        '<td>' + loaiChip(item.loai_phieu) + '</td>' +
        '<td>' + esc(item.phan_loai ? item.phan_loai.ten : '—') + '</td>' +
        '<td>' + esc(item.noi_dung_tom_tat || '—') + (item.ghi_chu ? '<div class="small text-muted">' + esc(item.ghi_chu) + '</div>' : '') + '</td>' +
        '<td>' + (doiTuong.length ? esc(doiTuong.join(' / ')) : '<span class="text-muted">—</span>') + '</td>' +
        '<td>' + esc(item.quy || '—') + '</td>' +
        '<td class="text-end tc-money ' + (item.loai_phieu === 'thu' ? 'tc-money-thu' : 'tc-money-chi') + '">' + (item.loai_phieu === 'thu' ? '+' : '−') + money(item.so_tien) + '</td>' +
        '<td>' + esc(item.nguoi_de_xuat ? item.nguoi_de_xuat.ten : '—') + '</td>' +
        '<td>' + statusBadge(item.duyet_status, item.duyet_label) + sourceChip(item) + '</td>' +
        '</tr>';
    }

    function renderTabs(counts) {
      $('#tc-tabs').html($.map(TABS, function (t) {
        return '<li class="nav-item"><button type="button" class="nav-link waves-effect waves-light' + (state.tab === t.id ? ' active' : '') + '" data-tab="' + t.id + '" role="tab">' +
          esc(t.label) + ' <span class="badge bg-label-primary ms-1">' + (parseInt(counts[t.id], 10) || 0) + '</span></button></li>';
      }).join(''));
    }

    function renderSum(t) {
      function stat(label, value, cls) {
        return '<div class="tc-sum-item"><span class="tc-sum-label">' + label + '</span><span class="tc-sum-value ' + cls + '">' + money(value) + ' đ</span></div>';
      }
      var diff = parseFloat(t.chenh_lech) || 0;
      $('#tc-sum').html(stat('Tổng thu', t.thu, 'text-success') + stat('Tổng chi', t.chi, 'text-danger') + stat('Chênh lệch', diff, diff >= 0 ? 'text-primary' : 'text-danger'))
        .attr('title', 'Tính các phiếu đã duyệt (đang tính vào quỹ) theo bộ lọc hiện tại, không theo tab');
    }

    function renderPager(d) {
      var total = parseInt(d.total_pages, 10) || 0;
      var cur = parseInt(d.current_page, 10) || 1;
      state.page = cur;
      $('#tc-pagination').show();
      $('#tc-pagination-info').text('Tổng số: ' + (parseInt(d.total, 10) || 0) + ' phiếu');
      $('#tc-pagination-total-pages').text('/ ' + total);
      $('#tc-pagination-jump').val(cur).attr('data-total', total);
      function li(page, label, disabled, active) {
        return '<li class="page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '') + '"><a class="page-link tc-page" href="#" data-page="' + page + '">' + label + '</a></li>';
      }
      var html = li(1, '<i class="ti tabler-chevrons-left"></i>', cur <= 1) + li(cur - 1, '<i class="ti tabler-chevron-left"></i>', cur <= 1);
      var s = Math.max(1, cur - 2), e = Math.min(total, cur + 2);
      for (var p = s; p <= e; p++) html += li(p, p, false, p === cur);
      html += li(cur + 1, '<i class="ti tabler-chevron-right"></i>', cur >= total) + li(total, '<i class="ti tabler-chevrons-right"></i>', cur >= total);
      $('#tc-pagination ul').html(html);
    }

    /* ---------- tạo / sửa ---------- */
    function lineHtml(row) {
      row = row || {};
      return '<tr class="tc-line">' +
        '<td class="text-center text-muted tc-line-no"></td>' +
        '<td><input type="text" class="form-control tc-l-noi-dung" list="tc-noi-dung-list" value="' + esc(row.noi_dung || '') + '" placeholder="Nội dung"></td>' +
        '<td><input type="text" class="form-control tc-l-dvt" value="' + esc(row.don_vi_tinh || '') + '" placeholder="ĐVT"></td>' +
        '<td><input type="text" class="form-control tc-num tc-l-sl" inputmode="decimal" value="' + esc(row.so_luong != null ? row.so_luong : 1) + '"></td>' +
        '<td><input type="text" class="form-control tc-num tc-l-gia money-mask" inputmode="numeric" placeholder="0" value="' + (row.don_gia ? money(row.don_gia) : '') + '"></td>' +
        '<td><input type="text" class="form-control tc-num tc-l-vat" inputmode="decimal" placeholder="0" value="' + esc(row.vat ? row.vat : '') + '"></td>' +
        '<td class="text-end tc-line-total">0</td>' +
        '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-danger tc-l-del" title="Xoá dòng"><i class="ti tabler-x"></i></button></td>' +
        '</tr>';
    }
    function recalc() {
      var total = 0;
      $('#tc-lines tr.tc-line').each(function (i) {
        var $tr = $(this);
        var sl = parseNum($tr.find('.tc-l-sl').val()) || 1;
        var gia = parseMoney($tr.find('.tc-l-gia').val());
        var vat = parseNum($tr.find('.tc-l-vat').val());
        var line = gia * sl * (1 + vat / 100);
        total += line;
        $tr.find('.tc-line-no').text(i + 1);
        $tr.find('.tc-line-total').text(money(line));
      });
      $('#tc-lines-total').text(money(total) + ' đ');
    }
    function setLoai(loai) {
      $('#tc-loai-' + (loai === 'chi' ? 'chi' : 'thu')).prop('checked', true);
      updateFormTitle();
    }
    function updateFormTitle() {
      var loai = $('input[name="tc-loai"]:checked').val();
      var label = loai === 'chi' ? 'phiếu chi' : 'phiếu thu';
      $('#tc-form-title').text((state.formId ? 'Sửa ' : 'Tạo ') + label);
    }
    function resetForm() {
      $('#tc-form-ma').addClass('d-none').text('');
      $('#tc-in-phan-loai, #tc-in-quy, #tc-in-nguoi, #tc-in-kh, #tc-in-ncc').val('').trigger('change').removeClass('is-invalid');
      $('#tc-in-ngay, #tc-in-ghi-chu').val('');
      $('#tc-lines').html(lineHtml());
      recalc();
    }
    function initFormDate(val) {
      var el = document.getElementById('tc-in-ngay');
      if (typeof flatpickr === 'undefined' || !el) { $(el).val(val || ''); return; }
      if (el._flatpickr) el._flatpickr.destroy();
      flatpickr(el, { dateFormat: 'd/m/Y', allowInput: true, appendTo: document.body, defaultDate: val || null });
    }
    function ensurePhanLoaiOption(pl) {
      if (!pl) return;
      var $s = $('#tc-in-phan-loai');
      if (!$s.find('option[value="' + pl.nid + '"]').length) $s.append('<option value="' + pl.nid + '">' + esc(pl.ten) + '</option>');
    }

    function openCreate(loai) {
      state.formId = 0;
      loadOptions(function () {
        resetForm();
        setLoai(loai);
        initFormDate(moment().format('DD/MM/YYYY'));
        modal('tc-form-modal').show();
      });
    }

    function openEdit(id) {
      state.formId = parseInt(id, 10) || 0;
      loadOptions(function () {
        resetForm();
        updateFormTitle();
        loading('tc-form-loading', true);
        modal('tc-form-modal').show();
        ajax({
          url: API + '/' + state.formId, type: 'GET',
          success: function (res) {
            var d = (res && res.data) || {};
            setLoai(d.loai_phieu);
            $('#tc-form-ma').removeClass('d-none').text(d.ma_giao_dich || '');
            ensurePhanLoaiOption(d.phan_loai);
            $('#tc-in-phan-loai').val(d.phan_loai ? String(d.phan_loai.nid) : '').trigger('change');
            $('#tc-in-quy').val(d.nid_quy ? String(d.nid_quy) : '').trigger('change');
            $('#tc-in-nguoi').val(d.nguoi_de_xuat && d.nguoi_de_xuat.uid ? String(d.nguoi_de_xuat.uid) : '').trigger('change');
            $('#tc-in-kh').val(d.khach_hang ? String(d.khach_hang.nid) : '').trigger('change');
            $('#tc-in-ncc').val(d.nha_cung_cap ? String(d.nha_cung_cap.nid) : '').trigger('change');
            $('#tc-in-ghi-chu').val(d.ghi_chu || '');
            initFormDate(apiToDate(d.ngay_giao_dich));
            var lines = d.chi_tiet && d.chi_tiet.length ? d.chi_tiet : [{}];
            $('#tc-lines').html($.map(lines, lineHtml).join(''));
            recalc();
          },
          error: function (xhr) { toast(apiMsg(xhr), false); modal('tc-form-modal').hide(); },
          complete: function () { loading('tc-form-loading', false); }
        });
      });
    }

    function save() {
      var plVal = $('#tc-in-phan-loai').val() || '';
      var payload = {
        loai_phieu: $('input[name="tc-loai"]:checked').val(),
        nid_quy: $('#tc-in-quy').val() || 0,
        ngay_giao_dich: $.trim($('#tc-in-ngay').val()),
        uid_nguoi_de_xuat: $('#tc-in-nguoi').val() || 0,
        nid_khach_hang: $('#tc-in-kh').val() || 0,
        nid_nha_cung_cap: $('#tc-in-ncc').val() || 0,
        ghi_chu: $.trim($('#tc-in-ghi-chu').val()),
        chi_tiet: []
      };
      // Phân loại có sẵn ⇒ nid; gõ mới (Select2 tags) ⇒ gửi tên để server tạo trong Danh mục.
      if (/^\d+$/.test(plVal)) payload.nid_phan_loai = parseInt(plVal, 10); else payload.phan_loai_ten = plVal;
      $('#tc-lines tr.tc-line').each(function () {
        var $tr = $(this);
        var nd = $.trim($tr.find('.tc-l-noi-dung').val());
        var gia = parseMoney($tr.find('.tc-l-gia').val());
        if (!nd && !gia) return;
        payload.chi_tiet.push({
          noi_dung: nd,
          don_vi_tinh: $.trim($tr.find('.tc-l-dvt').val()),
          so_luong: parseNum($tr.find('.tc-l-sl').val()) || 1,
          don_gia: gia,
          vat: parseNum($tr.find('.tc-l-vat').val())
        });
      });
      var errors = [];
      if (!plVal) { $('#tc-in-phan-loai').addClass('is-invalid'); errors.push('phân loại'); }
      if (!parseInt(payload.nid_quy, 10)) { $('#tc-in-quy').addClass('is-invalid'); errors.push('quỹ'); }
      if (!payload.ngay_giao_dich) errors.push('ngày phiếu');
      if (!parseInt(payload.uid_nguoi_de_xuat, 10)) { $('#tc-in-nguoi').addClass('is-invalid'); errors.push('người đề xuất'); }
      if (!payload.chi_tiet.length) errors.push('ít nhất 1 dòng chi tiết');
      if ($.grep(payload.chi_tiet, function (r) { return !r.noi_dung; }).length) errors.push('nội dung cho mọi dòng có số tiền');
      if (errors.length) { toast('Vui lòng nhập ' + errors.join(', ') + '.', false); return; }

      var $btn = $('#tc-form-save').prop('disabled', true);
      loading('tc-form-loading', true);
      ajax({
        url: state.formId ? API + '/' + state.formId : API,
        type: state.formId ? 'PUT' : 'POST',
        data: JSON.stringify(payload),
        success: function (res) {
          toast((state.formId ? 'Đã lưu phiếu ' : 'Đã tạo phiếu ') + ((res && res.data && res.data.ma_giao_dich) || '') + '.', true);
          state.options = null; // phân loại / gợi ý nội dung có thể vừa thêm mới
          modal('tc-form-modal').hide();
          loadList();
        },
        error: function (xhr) { toast(apiMsg(xhr), false); },
        complete: function () { $btn.prop('disabled', false); loading('tc-form-loading', false); }
      });
    }

    /* ---------- chi tiết ---------- */
    function info(label, value, col) {
      return '<div class="' + (col || 'col-md-3') + '"><div class="tc-info-label">' + esc(label) + '</div><div class="tc-info-value">' + (value || '<span class="text-muted">—</span>') + '</div></div>';
    }
    function openView(id) {
      state.viewId = parseInt(id, 10) || 0;
      $('#tc-view-body').html('');
      $('#tc-view-ma').text('');
      $('#tc-view-status').html('');
      $('#tc-view-footer').html('<button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>');
      loading('tc-view-loading', true);
      modal('tc-view-modal').show();
      ajax({
        url: API + '/' + state.viewId, type: 'GET',
        success: function (res) { renderView((res && res.data) || {}); },
        error: function (xhr) { $('#tc-view-body').html('<div class="alert alert-danger">' + esc(apiMsg(xhr)) + '</div>'); },
        complete: function () { loading('tc-view-loading', false); }
      });
    }
    function renderView(d) {
      $('#tc-view-ma').text(d.ma_giao_dich || '');
      $('#tc-view-status').html(statusBadge(d.duyet_status, d.duyet_label) + ' ' + loaiChip(d.loai_phieu));
      var doiTuong = [];
      if (d.khach_hang) doiTuong.push('KH: ' + esc(d.khach_hang.ten));
      if (d.nha_cung_cap) doiTuong.push('NCC: ' + esc(d.nha_cung_cap.ten));
      var html = '';
      if (d.khoa) html += '<div class="alert alert-secondary py-2"><i class="ti tabler-lock me-1"></i>' + esc(d.khoa) + '</div>';
      html += '<div class="row g-3 mb-3">' +
        info('Phân loại', d.phan_loai ? esc(d.phan_loai.ten) : '') +
        info('Quỹ', esc(d.quy)) +
        info('Ngày phiếu', esc(apiToDate(d.ngay_giao_dich))) +
        info('Số tiền', '<span class="fw-bold ' + (d.loai_phieu === 'thu' ? 'text-success' : 'text-danger') + '">' + money(d.so_tien) + ' đ</span>') +
        info('Người đề xuất', d.nguoi_de_xuat ? esc(d.nguoi_de_xuat.ten) : '') +
        info('Đối tượng', doiTuong.join(' / ')) +
        info('Nguồn', d.nguon && d.nguon.label ? esc(d.nguon.label) : 'Tạo tay ở Thu chi') +
        info('Tháng hạch toán', d.thang_luong ? esc(d.thang_luong.substr(4) + '/' + d.thang_luong.substr(0, 4)) : '') +
        (d.ghi_chu ? info('Ghi chú', esc(d.ghi_chu), 'col-12') : '') +
        '</div>';
      html += '<h6 class="mb-2">Chi tiết phiếu</h6><div class="table-responsive mb-3"><table class="table table-sm table-bordered tc-lines mb-0"><thead><tr><th>#</th><th>Nội dung</th><th>ĐVT</th><th class="text-end">SL</th><th class="text-end">Đơn giá</th><th class="text-end">VAT %</th><th class="text-end">Thành tiền</th></tr></thead><tbody>' +
        ($.map(d.chi_tiet || [], function (r, i) {
          return '<tr><td>' + (i + 1) + '</td><td>' + esc(r.noi_dung) + '</td><td>' + esc(r.don_vi_tinh) + '</td><td class="text-end">' + esc(r.so_luong) + '</td><td class="text-end">' + money(r.don_gia) + '</td><td class="text-end">' + esc(r.vat || 0) + '</td><td class="text-end fw-semibold">' + money(r.thanh_tien) + '</td></tr>';
        }).join('') || '<tr><td colspan="7" class="text-center text-muted">Không có dòng chi tiết</td></tr>') +
        '</tbody></table></div>';
      if (d.phan_bo_cong_no && d.phan_bo_cong_no.length) {
        html += '<h6 class="mb-2">Phân bổ vào phiếu trả khách hàng</h6><div class="table-responsive mb-3"><table class="table table-sm table-bordered tc-lines mb-0"><thead><tr><th>Phiếu trả</th><th>Số HĐ</th><th class="text-end">Phải thu</th><th class="text-end">Thu lần này</th><th class="text-end">Còn lại sau thu</th></tr></thead><tbody>' +
          $.map(d.phan_bo_cong_no, function (a) {
            return '<tr><td>' + esc(a.ma_phieu) + '</td><td>' + esc(a.so_hoa_don || '—') + '</td><td class="text-end">' + money(a.tong_phai_thu) + '</td><td class="text-end fw-semibold">' + money(a.so_tien_thanh_toan) + '</td><td class="text-end">' + money(a.con_lai_sau_thanh_toan) + '</td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      html += '<h6 class="mb-2">Lịch sử</h6><div class="tc-box">' +
        ($.map(d.lich_su || [], function (h) {
          return '<div class="small mb-1"><span class="text-muted">' + esc(h.thoi_gian) + '</span> · <strong>' + esc(h.nguoi || '—') + '</strong> · ' + esc(h.tu) + ' → ' + esc(h.den) + (h.ghi_chu ? ' <span class="text-muted">(' + esc(h.ghi_chu) + ')</span>' : '') + '</div>';
        }).join('') || '<div class="text-muted small">Chưa có lịch sử.</div>') + '</div>';
      $('#tc-view-body').html(html);
      var footer = '';
      $.each(d.hanh_dong || [], function (_, a) {
        var ui = ACTION_UI[a.action] || { icon: 'tabler-point', btn: 'btn-label-secondary' };
        footer += '<button type="button" class="btn ' + ui.btn + ' tc-act" data-id="' + d.nid + '" data-action="' + esc(a.action) + '"><i class="ti ' + ui.icon + ' me-1"></i>' + esc(a.label) + '</button>';
      });
      footer += '<button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>';
      $('#tc-view-footer').html(footer);
    }

    /* ---------- thao tác ---------- */
    function runAction(id, action) {
      if (action === 'xem') { openView(id); return; }
      if (action === 'sua') { modal('tc-view-modal').hide(); openEdit(id); return; }
      var t = CONFIRM[action];
      if (!t) return;
      var go = function () {
        ajax({
          url: action === 'xoa' ? API + '/' + id : API + '/' + id + '/' + action.replace(/_/g, '-'),
          type: action === 'xoa' ? 'DELETE' : 'POST',
          data: action === 'xoa' ? undefined : JSON.stringify({}),
          success: function (res) {
            toast((res && res.data && res.data.message) || 'Đã cập nhật phiếu.', true);
            loadList();
            if (state.viewId === parseInt(id, 10) && $('#tc-view-modal').hasClass('show')) {
              if (action === 'xoa') modal('tc-view-modal').hide(); else renderView(res.data || {});
            }
          },
          error: function (xhr) { toast(apiMsg(xhr), false); }
        });
      };
      if (window.Swal) {
        Swal.fire({
          title: t[0], text: t[1], icon: action === 'xoa' || action === 'khong_duyet' ? 'warning' : 'question',
          showCancelButton: true, confirmButtonText: t[2], cancelButtonText: 'Đóng',
          customClass: { confirmButton: 'btn btn-primary me-2', cancelButton: 'btn btn-label-secondary' }, buttonsStyling: false
        }).then(function (r) { if (r.isConfirmed) go(); });
      } else if (window.confirm(t[0] + '\n' + t[1])) {
        go();
      }
    }

    /* ---------- sự kiện ---------- */
    function bind() {
      $('#tc-btn-search').on('click', reload);
      $('#tc-f-q').on('keydown', function (e) { if (e.which === 13) { e.preventDefault(); reload(); } });
      $('#tc-f-loai, #tc-f-phan-loai, #tc-f-quy').on('change', function () { if (!state.suppress) reload(); });
      $('#tc-btn-reset').on('click', function () {
        state.suppress = true;
        $('#tc-f-q').val('');
        $('#tc-f-loai, #tc-f-phan-loai, #tc-f-quy').val('').trigger('change');
        defaultRange();
        state.tab = 'all';
        state.suppress = false;
        reload();
      });
      $(document).on('click', '#tc-tabs [data-tab]', function (e) {
        e.preventDefault();
        var tab = String($(this).attr('data-tab'));
        if (tab === state.tab) return;
        state.tab = tab;
        reload();
      });
      $(document).on('click', '#tc-pagination .tc-page', function (e) {
        e.preventDefault();
        var p = parseInt($(this).attr('data-page'), 10);
        if (p && p !== state.page && !$(this).parent().hasClass('disabled')) { state.page = p; loadList(); }
      });
      $('#tc-pagination-jump').on('keydown', function (e) {
        if (e.which !== 13) return;
        var p = parseInt(this.value, 10), total = parseInt($(this).attr('data-total'), 10) || 0;
        if (p > 0 && p <= total) { state.page = p; loadList(); }
      });
      $(document).on('click', '.tc-act', function (e) {
        e.preventDefault();
        runAction($(this).attr('data-id'), String($(this).attr('data-action')));
      });
      // Double-click 1 dòng: sửa nếu được sửa, không thì xem chi tiết (bỏ qua khi trúng nút/link).
      $('#tc-tbody').on('dblclick', 'tr[data-id]', function (e) {
        if ($(e.target).closest('a, button, input, .dropdown').length) return;
        var id = $(this).attr('data-id');
        var canEdit = $(this).find('.tc-act[data-action="sua"]').length > 0;
        runAction(id, canEdit ? 'sua' : 'xem');
      });
      if (canManage) {
        $('#tc-btn-create-thu').on('click', function () { openCreate('thu'); });
        $('#tc-btn-create-chi').on('click', function () { openCreate('chi'); });
      }
      $('input[name="tc-loai"]').on('change', updateFormTitle);
      $('#tc-add-line').on('click', function () { $('#tc-lines').append(lineHtml()); recalc(); $('#tc-lines tr.tc-line:last .tc-l-noi-dung').focus(); });
      $('#tc-lines').on('click', '.tc-l-del', function () {
        $(this).closest('tr').remove();
        if (!$('#tc-lines tr.tc-line').length) $('#tc-lines').html(lineHtml());
        recalc();
      });
      $('#tc-lines').on('input', 'input', function () {
        if ($(this).hasClass('tc-l-gia')) {
          var raw = parseMoney(this.value);
          this.value = raw ? money(raw) : '';
        }
        recalc();
      });
      $('#tc-in-phan-loai, #tc-in-quy, #tc-in-nguoi').on('change', function () { $(this).removeClass('is-invalid'); });
      $('#tc-form').on('submit', function (e) { e.preventDefault(); save(); });
      $('#tc-form').on('keydown', function (e) {
        if (e.which === 13 && !$(e.target).is('textarea, .select2-search__field')) { e.preventDefault(); save(); }
      });
    }

    bind();
    renderTabs({});
    initRange();
    loadOptions(function () {});
    loadList();
  }

  function start() {
    if (!document.getElementById('tc-app')) return;
    var $ = pickJq();
    if ($) ThuChi($);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

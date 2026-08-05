(function ($, Drupal) {
  'use strict';

  var notyf;
  var bound = false;
  var currentPage = 1;
  var currentLimit = 20;
  var filters = {};
  var currentAction = null;
  var supportLoaded = false;
  var supportLoading = false;
  var supportLoadingTimer = null;

  var statusMap = {
    cho_duyet: { text: 'Chờ duyệt', cls: 'bg-label-warning' },
    da_duyet: { text: 'Đã duyệt', cls: 'bg-label-info' },
    tu_choi: { text: 'Từ chối', cls: 'bg-label-danger' },
    da_thanh_toan: { text: 'Đã chi trả', cls: 'bg-label-success' },
    huy: { text: 'Hủy', cls: 'bg-label-secondary' }
  };

  Drupal.behaviors.giaoDichOpsApprove = {
    attach: function (context) {
      if (!$('#giao-dich-ops-approve-app', context).length || bound) return;
      bound = true;
      if (typeof Notyf !== 'undefined') notyf = new Notyf();
      bindEvents();
      loadList();
    }
  };

  function bindEvents() {
    bind('btn-reload-de-nghi-ops', 'click', function () {
      currentPage = 1;
      loadList();
    });

    bind('btn-open-filter-de-nghi-ops', 'click', function () {
      modalShow('de-nghi-ops-filter-modal');
    });

    bind('de-nghi-ops-filter-modal', 'shown.bs.modal', function () {
      loadFilterOptions();
    });

    bind('btn-reset-filter-de-nghi-ops', 'click', function () {
      filters = {};
      currentLimit = 20;
      currentPage = 1;
      document.getElementById('form-filter-de-nghi-ops').reset();
      $('[name="trang_thai"]', '#form-filter-de-nghi-ops').val('');
      $('#filter-de-nghi-ops-nhan-su, #filter-de-nghi-ops-lai-xe').val('').trigger('change');
      loadList();
    });

    bind('form-filter-de-nghi-ops', 'submit', function (e) {
      e.preventDefault();
      var data = formData(this);
      filters = {};
      for (var key in data) {
        if (data.hasOwnProperty(key) && data[key] !== '') filters[key] = data[key];
      }
      normalizeMoneyFilter('amount_min');
      normalizeMoneyFilter('amount_max');
      currentLimit = parseInt(filters.limit || 20, 10) || 20;
      currentPage = 1;
      modalHide('de-nghi-ops-filter-modal');
      loadList();
    });

    bind('pagination-de-nghi-ops-jump', 'keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value, 10);
        var total = parseInt(this.getAttribute('data-total-pages'), 10);
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });

    bind('form-action-de-nghi-ops', 'submit', function (e) {
      e.preventDefault();
      submitAction();
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== document) {
        if (hasClass(t, 'btn-view-de-nghi-ops')) {
          e.preventDefault();
          openDetail(t.getAttribute('data-id'));
          return;
        }
        if (hasClass(t, 'btn-action-de-nghi-ops')) {
          e.preventDefault();
          openAction(t.getAttribute('data-id'), t.getAttribute('data-status'));
          return;
        }
        if (hasClass(t, 'page-link-de-nghi-ops')) {
          e.preventDefault();
          var page = parseInt(t.getAttribute('data-page'), 10);
          if (page && page !== currentPage) {
            currentPage = page;
            loadList();
          }
          return;
        }
        t = t.parentElement;
      }
    });

    document.addEventListener('mouseover', function (e) {
      var dropdown = closest(e.target, 'dropdown');
      if (dropdown && closest(dropdown, 'table-responsive')) {
        var menu = dropdown.querySelector ? dropdown.querySelector('.dropdown-menu') : null;
        var btn = dropdown.querySelector ? dropdown.querySelector('button') : null;
        if (menu && btn) {
          var rect = btn.getBoundingClientRect();
          menu.style.position = 'fixed';
          menu.style.top = rect.top + 'px';
          menu.style.left = rect.right + 'px';
          menu.style.display = 'block';
          menu.style.zIndex = '1080';
        }
      }
    });

    document.addEventListener('mouseout', function (e) {
      var dropdown = closest(e.target, 'dropdown');
      if (dropdown && closest(dropdown, 'table-responsive') && !contains(dropdown, e.relatedTarget)) {
        var menu = dropdown.querySelector ? dropdown.querySelector('.dropdown-menu') : null;
        if (menu) {
          menu.style.display = '';
          menu.style.position = '';
          menu.style.top = '';
          menu.style.left = '';
          menu.style.zIndex = '';
        }
      }
    });
  }

  function loadFilterOptions() {
    if (supportLoaded || supportLoading) return;
    supportLoading = true;
    setFilterLoading(true);
    var pending = 2;
    if (supportLoadingTimer) window.clearTimeout(supportLoadingTimer);
    supportLoadingTimer = window.setTimeout(function () {
      if (supportLoading) {
        supportLoading = false;
        setFilterLoading(false);
      }
    }, 15000);
    function done() {
      pending -= 1;
      if (pending <= 0) {
        if (supportLoadingTimer) window.clearTimeout(supportLoadingTimer);
        supportLoadingTimer = null;
        supportLoaded = true;
        supportLoading = false;
        setFilterLoading(false);
      }
    }
    if (!loadNhanSuOptions(done)) done();
    if (!loadLaiXeOptions(done)) done();
  }

  function setFilterLoading(show) {
    $('#de-nghi-ops-filter-loading').toggle(!!show);
    var form = document.getElementById('form-filter-de-nghi-ops');
    if (!form) return;
    var controls = form.querySelectorAll('input, select, button');
    for (var i = 0; i < controls.length; i++) {
      if (hasClass(controls[i], 'btn-close')) continue;
      controls[i].disabled = !!show;
    }
  }

  function loadNhanSuOptions(done) {
    var sel = document.getElementById('filter-de-nghi-ops-nhan-su');
    if (!sel) {
      return false;
    }
    $.ajax({
      url: '/api/nhan-vien',
      type: 'GET',
      dataType: 'json',
      data: { limit: 100, status: 1 },
      success: function (res) {
        var items = res && res.data && res.data.items ? res.data.items : [];
        var html = '<option value="">Tất cả nhân sự</option>';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var text = item.ten || item.name || item.mail || ('UID #' + item.uid);
          if (item.ma_nhan_vien) text += ' - ' + item.ma_nhan_vien;
          html += '<option value="' + escAttr(item.uid) + '">' + esc(text) + '</option>';
        }
        sel.innerHTML = html;
        initSelect2(sel);
      },
      error: function () {
        sel.innerHTML = '<option value="">Tất cả nhân sự</option>';
        initSelect2(sel);
      },
      complete: function () {
        if (typeof done === 'function') done();
      }
    });
    return true;
  }

  function loadLaiXeOptions(done) {
    var sel = document.getElementById('filter-de-nghi-ops-lai-xe');
    if (!sel) {
      return false;
    }
    $.ajax({
      url: '/api/lai-xe',
      type: 'GET',
      dataType: 'json',
      data: { limit: 100, sort_by: 'ten' },
      success: function (res) {
        var items = res && res.data && res.data.items ? res.data.items : [];
        var html = '<option value="">Tất cả lái xe</option>';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var text = item.ten || ('Lái xe #' + item.nid);
          if (item.ma_nhan_vien) text += ' - ' + item.ma_nhan_vien;
          if (item.sdt) text += ' - ' + item.sdt;
          html += '<option value="' + escAttr(item.nid) + '">' + esc(text) + '</option>';
        }
        sel.innerHTML = html;
        initSelect2(sel);
      },
      error: function () {
        sel.innerHTML = '<option value="">Tất cả lái xe</option>';
        initSelect2(sel);
      },
      complete: function () {
        if (typeof done === 'function') done();
      }
    });
    return true;
  }

  function loadList() {
    renderLoading();
    var params = $.extend({}, filters, { page: currentPage, limit: currentLimit });
    $.ajax({
      url: '/api/de-nghi-ung-ops',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        var data = res && res.data ? res.data : {};
        renderRows(data.items || []);
        renderPagination(data);
        renderKpis(data.items || [], data.total || 0);
      },
      error: function (xhr) {
        renderError(apiMsg(xhr));
        toastError(apiMsg(xhr));
      }
    });
  }

  function renderLoading() {
    $('#table-de-nghi-ops-tbody').html('<tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
  }

  function renderError(message) {
    $('#table-de-nghi-ops-tbody').html('<tr><td colspan="10" class="text-center text-danger py-4">' + esc(message) + '</td></tr>');
  }

  function renderRows(items) {
    if (!items.length) {
      $('#table-de-nghi-ops-tbody').html('<tr><td colspan="10" class="text-center text-muted py-4">Không có dữ liệu</td></tr>');
      return;
    }

    var rows = [];
    for (var idx = 0; idx < items.length; idx++) {
      var item = items[idx];
      var stt = (currentPage - 1) * currentLimit + idx + 1;
      var nhanSu = item.nhan_su || {};
      var laiXe = item.lai_xe || {};
      var ledger = item.ledger || null;
      var personMain = nhanSu.ten || laiXe.ten || '';
      var personSub = laiXe.ten ? ('Lái xe: ' + laiXe.ten) : (laiXe.nid ? 'Lái xe #' + laiXe.nid : (nhanSu.uid ? 'UID #' + nhanSu.uid : ''));
      var ledgerHtml = ledger && ledger.ma_giao_dich
        ? '<span class="badge bg-label-success">' + esc(ledger.ma_giao_dich) + '</span>'
        : (ledger && ledger.nid ? '<span class="badge bg-label-success">#' + ledger.nid + '</span>' : '<span class="badge bg-label-secondary">Chưa ghi</span>');
      rows.push('<tr>'
        + '<td class="text-center">' + renderActions(item) + '</td>'
        + '<td>' + stt + '</td>'
        + '<td>' + esc(formatDateTime(item.created)) + '</td>'
        + '<td><span class="ops-code">' + esc(item.ma_de_nghi) + '</span></td>'
        + '<td><div class="ops-person-main">' + esc(personMain || '-') + '</div><div class="ops-person-sub">' + esc(personSub || '') + '</div></td>'
        + '<td class="text-end"><span class="ops-money-pill ops-money-pill-credit">' + formatMoney(item.so_tien) + '</span></td>'
        + '<td>' + esc(item.so_bkg || '') + '</td>'
        + '<td>' + statusBadge(item.trang_thai, item.trang_thai_label) + '</td>'
        + '<td>' + ledgerHtml + '</td>'
        + '<td class="ops-desc-cell">' + esc(item.muc_dich || '') + '</td>'
        + '</tr>');
    }
    $('#table-de-nghi-ops-tbody').html(rows.join(''));
  }

  function renderActions(item) {
    var items = '';
    items += '<li><button type="button" class="dropdown-item btn-view-de-nghi-ops" data-id="' + item.nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    if (item.trang_thai === 'cho_duyet') {
      items += '<li><button type="button" class="dropdown-item btn-action-de-nghi-ops" data-id="' + item.nid + '" data-status="da_duyet"><i class="ti tabler-check me-2"></i>Duyệt</button></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-action-de-nghi-ops" data-id="' + item.nid + '" data-status="tu_choi"><i class="ti tabler-x me-2"></i>Từ chối</button></li>';
    }
    if (item.trang_thai === 'da_duyet') {
      items += '<li><button type="button" class="dropdown-item btn-action-de-nghi-ops" data-id="' + item.nid + '" data-status="da_thanh_toan"><i class="ti tabler-cash me-2"></i>Chi trả</button></li>';
    }
    return '<div class="dropdown">' +
      '<button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill" title="Chức năng">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var total = parseInt(data.total || 0, 10);
    var totalPages = parseInt(data.total_pages || 0, 10);
    $('#pagination-de-nghi-ops-info').text('Tổng ' + total + ' dòng');
    $('#pagination-de-nghi-ops-total-pages').text('/ ' + totalPages);
    $('#pagination-de-nghi-ops-jump').val(currentPage).attr('data-total-pages', totalPages);

    var html = '';
    html += '<li class="page-item ' + (currentPage <= 1 ? 'disabled' : '') + '"><a href="#" class="page-link page-link-de-nghi-ops" data-page="' + Math.max(1, currentPage - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    for (var i = 1; i <= Math.max(totalPages, 1); i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
        html += '<li class="page-item ' + (i === currentPage ? 'active' : '') + '"><a href="#" class="page-link page-link-de-nghi-ops" data-page="' + i + '">' + i + '</a></li>';
      }
      else if (i === currentPage - 3 || i === currentPage + 3) {
        html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
      }
    }
    html += '<li class="page-item ' + (currentPage >= totalPages ? 'disabled' : '') + '"><a href="#" class="page-link page-link-de-nghi-ops" data-page="' + Math.max(1, Math.min(totalPages || 1, currentPage + 1)) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    $('#pagination-de-nghi-ops .pagination').html(html);
  }

  function renderKpis(items, total) {
    var pending = 0;
    var paid = 0;
    var amount = 0;
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item.trang_thai === 'cho_duyet') pending++;
      if (item.trang_thai === 'da_thanh_toan') paid++;
      amount += parseInt(item.so_tien || 0, 10);
    }
    $('[data-approve-kpi="total"]').text(total);
    $('[data-approve-kpi="pending"]').text(pending);
    $('[data-approve-kpi="paid"]').text(paid);
    $('[data-approve-kpi="amount"]').text(formatMoney(amount));
  }

  function openDetail(id) {
    $('#de-nghi-ops-detail-content').empty();
    $('#de-nghi-ops-detail-actions').html('<button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>');
    $('#de-nghi-ops-detail-loading').show();
    modalShow('de-nghi-ops-detail-modal');

    $.ajax({
      url: '/api/de-nghi-ung-ops/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        renderDetail(res.data || {});
      },
      error: function (xhr) {
        $('#de-nghi-ops-detail-content').html('<div class="text-danger">' + esc(apiMsg(xhr)) + '</div>');
      },
      complete: function () {
        $('#de-nghi-ops-detail-loading').hide();
      }
    });
  }

  function renderDetail(item) {
    var nhanSu = item.nhan_su || {};
    var laiXe = item.lai_xe || {};
    var ledger = item.ledger || null;
    var rows = [
      ['Mã đề nghị', item.ma_de_nghi],
      ['Ngày tạo', formatDateTime(item.created)],
      ['Trạng thái', item.trang_thai_label],
      ['Số tiền', formatMoney(item.so_tien)],
      ['Nhân sự', nhanSu.ten || nhanSu.uid],
      ['Lái xe', laiXe.ten || laiXe.nid],
      ['Booking', item.so_bkg],
      ['Kế hoạch', item.nid_ke_hoach ? '#' + item.nid_ke_hoach : ''],
      ['Ghi sổ', ledger && ledger.ma_giao_dich ? ledger.ma_giao_dich : (ledger && ledger.nid ? '#' + ledger.nid : 'Chưa ghi')],
      ['Số tiền ghi sổ', ledger ? formatMoney(ledger.so_tien) : ''],
      ['Ngày ghi sổ', ledger ? formatDateTime(ledger.created) : ''],
      ['Người duyệt', item.nguoi_duyet_uid ? '#' + item.nguoi_duyet_uid : ''],
      ['Ngày duyệt', formatDateTime(item.ngay_duyet)],
      ['Lý do từ chối', item.ly_do_tu_choi],
      ['Mục đích', item.muc_dich],
      ['Ghi chú', item.ghi_chu]
    ];
    var html = '<div class="mb-3">' + statusBadge(item.trang_thai, item.trang_thai_label) + '</div>';
    html += '<div class="ops-detail-grid">';
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      html += '<div class="ops-detail-item"><div class="ops-detail-label">' + esc(row[0]) + '</div><div class="ops-detail-value">' + esc(row[1] || '-') + '</div></div>';
    }
    html += '</div>';
    $('#de-nghi-ops-detail-content').html(html);

    var actions = '<button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>';
    if (item.trang_thai === 'cho_duyet') {
      actions += '<button type="button" class="btn btn-danger btn-action-de-nghi-ops" data-id="' + item.nid + '" data-status="tu_choi"><i class="ti tabler-x me-1"></i>Từ chối</button>';
      actions += '<button type="button" class="btn btn-success btn-action-de-nghi-ops" data-id="' + item.nid + '" data-status="da_duyet"><i class="ti tabler-check me-1"></i>Duyệt</button>';
    }
    if (item.trang_thai === 'da_duyet') {
      actions += '<button type="button" class="btn btn-primary btn-action-de-nghi-ops" data-id="' + item.nid + '" data-status="da_thanh_toan"><i class="ti tabler-cash me-1"></i>Chi trả</button>';
    }
    $('#de-nghi-ops-detail-actions').html(actions);
  }

  function openAction(id, status) {
    currentAction = { id: id, status: status };
    var config = actionConfig(status);
    $('#de-nghi-ops-action-title').text(config.title);
    $('#de-nghi-ops-action-id').val(id);
    $('#de-nghi-ops-action-status').val(status);
    $('#de-nghi-ops-action-note-label').text(config.noteLabel);
    $('#de-nghi-ops-action-note').val('');
    if (status === 'tu_choi') $('#de-nghi-ops-action-note').attr('required', 'required');
    else $('#de-nghi-ops-action-note').removeAttr('required');
    $('#btn-submit-action-de-nghi-ops').removeClass('btn-primary btn-success btn-danger').addClass(config.btnClass).removeAttr('disabled');
    $('#de-nghi-ops-action-spinner').addClass('d-none');
    modalShow('de-nghi-ops-action-modal');
  }

  function submitAction() {
    if (!currentAction) return;
    var status = $('#de-nghi-ops-action-status').val();
    var note = trim($('#de-nghi-ops-action-note').val());
    var payload = { trang_thai: status };
    if (status === 'tu_choi') payload.ly_do_tu_choi = note;
    else payload.ghi_chu = note;

    $('#btn-submit-action-de-nghi-ops').attr('disabled', 'disabled');
    $('#de-nghi-ops-action-spinner').removeClass('d-none');

    $.ajax({
      url: '/api/de-nghi-ung-ops/' + currentAction.id,
      type: 'PUT',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      success: function () {
        toastSuccess(actionConfig(status).success);
        modalHide('de-nghi-ops-action-modal');
        modalHide('de-nghi-ops-detail-modal');
        loadList();
      },
      error: function (xhr) {
        toastError(apiMsg(xhr));
      },
      complete: function () {
        $('#btn-submit-action-de-nghi-ops').removeAttr('disabled');
        $('#de-nghi-ops-action-spinner').addClass('d-none');
      }
    });
  }

  function actionConfig(status) {
    if (status === 'da_duyet') {
      return { title: 'Duyệt đề nghị chi phí', noteLabel: 'Ghi chú duyệt', btnClass: 'btn-success', success: 'Đã duyệt đề nghị chi phí.' };
    }
    if (status === 'tu_choi') {
      return { title: 'Từ chối đề nghị chi phí', noteLabel: 'Lý do từ chối', btnClass: 'btn-danger', success: 'Đã từ chối đề nghị chi phí.' };
    }
    if (status === 'da_thanh_toan') {
      return { title: 'Xác nhận chi trả', noteLabel: 'Ghi chú chi trả', btnClass: 'btn-primary', success: 'Đã chi trả và ghi vào sổ chi phí.' };
    }
    return { title: 'Cập nhật đề nghị chi phí', noteLabel: 'Ghi chú', btnClass: 'btn-primary', success: 'Đã cập nhật đề nghị chi phí.' };
  }

  function statusBadge(status, fallback) {
    var s = statusMap[status] || { text: fallback || status || '-', cls: 'bg-label-secondary' };
    return '<span class="badge ' + s.cls + '">' + esc(fallback || s.text) + '</span>';
  }

  function formData(form) {
    var data = {};
    var items = $(form).serializeArray();
    for (var i = 0; i < items.length; i++) {
      data[items[i].name] = trim(items[i].value);
    }
    return data;
  }

  function normalizeMoneyFilter(key) {
    if (filters[key] == null || filters[key] === '') return;
    filters[key] = String(filters[key]).replace(/\D+/g, '');
    if (filters[key] === '') delete filters[key];
  }

  function initSelect2(sel) {
    if (!sel || !$.fn || !$.fn.select2) return;
    try {
      var $sel = $(sel);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        allowClear: true,
        width: '100%',
        dropdownParent: $('#de-nghi-ops-filter-modal'),
        placeholder: sel.options.length ? sel.options[0].text : ''
      });
    }
    catch (e) {}
  }

  function hasClass(el, className) {
    return el && ((' ' + el.className + ' ').indexOf(' ' + className + ' ') > -1);
  }

  function closest(el, className) {
    while (el && el !== document) {
      if (hasClass(el, className)) return el;
      el = el.parentElement;
    }
    return null;
  }

  function contains(parent, child) {
    if (!parent || !child) return false;
    if (parent.contains) return parent.contains(child);
    while (child) {
      if (child === parent) return true;
      child = child.parentNode;
    }
    return false;
  }

  function trim(value) {
    return String(value == null ? '' : value).replace(/^\s+|\s+$/g, '');
  }

  function modalHide(id) {
    var el = document.getElementById(id);
    var m = el ? bootstrap.Modal.getInstance(el) : null;
    if (m) m.hide();
  }

  function modalShow(id) {
    var el = document.getElementById(id);
    if (el) new bootstrap.Modal(el).show();
  }

  function bind(id, eventName, handler) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(eventName, handler);
  }

  function apiMsg(xhr) {
    try {
      var json = JSON.parse(xhr.responseText);
      return json.message || 'Lỗi kết nối server';
    }
    catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function toastSuccess(message) {
    if (notyf) notyf.success(message);
  }

  function toastError(message) {
    if (notyf) notyf.error(message);
  }

  function formatMoney(value) {
    var n = parseInt(value || 0, 10);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' đ';
  }

  function formatDateTime(value) {
    if (!value) return '';
    var parts = String(value).split(' ');
    if (parts.length < 2) return value;
    var d = parts[0].split('-');
    if (d.length !== 3) return value;
    return d[2] + '/' + d[1] + '/' + d[0] + ' ' + parts[1].slice(0, 5);
  }

  function esc(value) {
    return $('<div>').text(value == null ? '' : String(value)).html();
  }

  function escAttr(value) {
    return esc(value).replace(/"/g, '&quot;');
  }
})(jQuery, Drupal);

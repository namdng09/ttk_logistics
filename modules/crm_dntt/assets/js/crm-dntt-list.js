(function ($) {
  'use strict';

  var CFG, notyf, currentTab = '', currentPage = 1, currentMode = 'dntt';
  var selectedIds = [];

  var STATUS_LABELS = {
    moi:         {text: 'Mới',        cls: 'bg-label-secondary'},
    cho_duyet:   {text: 'Chờ duyệt',  cls: 'bg-label-warning'},
    da_duyet:    {text: 'Đã duyệt',   cls: 'bg-label-info'},
    tu_choi:     {text: 'Từ chối',     cls: 'bg-label-danger'},
    da_tt:       {text: 'Đã TT',       cls: 'bg-label-success'},
    tu_choi_tt:  {text: 'Từ chối TT',  cls: 'bg-label-danger'}
  };

  var LO_STATUS_LABELS = {
    cho_duyet:   {text: 'Chờ duyệt',  cls: 'bg-label-warning'},
    da_duyet:    {text: 'Đã duyệt',   cls: 'bg-label-info'},
    tu_choi:     {text: 'Từ chối',     cls: 'bg-label-danger'},
    da_tt:       {text: 'Đã TT',       cls: 'bg-label-success'},
    tu_choi_tt:  {text: 'Từ chối TT',  cls: 'bg-label-danger'}
  };

  $(function () {
    CFG = Drupal.settings.crm_dntt || {};
    notyf = new Notyf({position: {x: 'right', y: 'top'}, duration: 3000});

    initTabs();
    initFilters();
    initEvents();
    loadCurrentTab();
  });

  // =========================================================================
  // Tabs
  // =========================================================================

  function initTabs() {
    var perms = CFG.permissions || {};
    var $tabs = $('#dntt-tabs');
    var tabs = [];

    if (perms.dntt_view_own || perms.dntt_create) {
      tabs.push({id: 'cua-toi', label: 'Của tôi', params: {tab: 'own'}});
    }
    if (perms.dntt_approve) {
      tabs.push({id: 'cho-duyet', label: 'Chờ duyệt', params: {trang_thai: 'cho_duyet', tab: 'approve'}});
    }
    if (perms.dntt_pay) {
      tabs.push({id: 'cho-tt', label: 'Chờ TT', params: {trang_thai: 'da_duyet', tab: 'pay'}});
    }
    if (perms.dntt_view_all) {
      tabs.push({id: 'tat-ca', label: 'Tất cả', params: {}});
    }

    $.each(tabs, function (i, t) {
      var active = i === 0 ? ' active' : '';
      var mode = t.mode || 'dntt';
      $tabs.append(
        '<li class="nav-item">' +
        '<a class="nav-link' + active + '" href="#" data-tab="' + t.id + '" data-mode="' + mode + '" data-params=\'' + JSON.stringify(t.params) + '\'>' +
        t.label + '</a></li>'
      );
    });

    if (tabs.length) {
      currentTab = tabs[0].id;
      currentMode = tabs[0].mode || 'dntt';
    }

    if (!perms.dntt_create) $('#btn-create-dntt').hide();
  }

  // =========================================================================
  // Filters
  // =========================================================================

  function initFilters() {
    setTimeout(function () {
      var $doiTac = $('#filter-doi-tac');
      if ($doiTac.hasClass('select2-hidden-accessible')) {
        $doiTac.select2('destroy');
      }
      $doiTac.select2({
        ajax: {
          url: '/api/doi-tac/search',
          dataType: 'json',
          delay: 300,
          data: function (p) { return {term: p.term, page: p.page || 1}; },
          processResults: function (d) { return {results: d.results, pagination: d.pagination}; }
        },
        placeholder: 'Đối tác nhận tiền...',
        allowClear: true,
        width: '100%',
        minimumInputLength: 1,
        dropdownParent: $('body')
      });
    }, 100);

    flatpickr('#filter-daterange', {
      mode: 'range',
      dateFormat: 'd/m/Y',
      onChange: function () { currentPage = 1; loadCurrentTab(); }
    });
  }

  function initEvents() {
    // Tab click
    $('#dntt-tabs').on('click', '.nav-link', function (e) {
      e.preventDefault();
      $('#dntt-tabs .nav-link').removeClass('active');
      $(this).addClass('active');
      currentTab = $(this).data('tab');
      currentMode = $(this).data('mode') || 'dntt';
      currentPage = 1;
      loadCurrentTab();
    });

    // Filter change
    $('#filter-doi-tac, #filter-trang-thai').on('change', function () {
      currentPage = 1;
      loadCurrentTab();
    });

    // Clear filters
    $('#btn-filter-clear').on('click', function () {
      $('#filter-doi-tac').val(null).trigger('change');
      $('#filter-trang-thai').val('');
      var fp = document.querySelector('#filter-daterange')._flatpickr;
      if (fp) fp.clear();
      currentPage = 1;
      loadCurrentTab();
    });

    // Row click → detail (skip chevron, buttons, checkboxes, lô/child rows)
    $('#dntt-tbody').on('click', 'tr', function (e) {
      if ($(e.target).is('input[type="checkbox"]') || $(e.target).closest('.form-check').length) return;
      if ($(e.target).closest('button, .btn').length) return;
      if ($(e.target).hasClass('dntt-chevron') || $(e.target).closest('.dntt-chevron').length) return;
      if ($(this).hasClass('lo-row') || $(this).hasClass('dntt-ct-row')) return;
      var id = $(this).data('dntt-id');
      if (id) window.location.href = '/quan-ly/dntt/' + id;
    });

    // Expand/collapse chi tiết DNTT
    $('#dntt-tbody').on('click', '.dntt-chevron', function (e) {
      e.stopPropagation();
      var $icon = $(this);
      var $tr = $icon.closest('tr');
      var dnttId = $tr.data('dntt-id');
      var $existing = $('#dntt-tbody .dntt-ct-' + dnttId);

      if ($existing.length) {
        $existing.toggleClass('d-none');
        $icon.toggleClass('tabler-chevron-right tabler-chevron-down');
        return;
      }

      $icon.removeClass('tabler-chevron-right').addClass('tabler-dots-circle-horizontal');
      $.ajax({
        url: '/api/dntt-chi-tiet/list',
        data: {dntt_id: dnttId},
        dataType: 'json',
        success: function (res) {
          $icon.removeClass('tabler-dots-circle-horizontal').addClass('tabler-chevron-down');
          var items = (res.data || []);
          if (!items.length) {
            $tr.after(
              '<tr class="dntt-ct-' + dnttId + ' dntt-ct-row">' +
              '<td></td><td colspan="11" class="text-muted small py-3 ps-4"><i class="ti tabler-file-off me-1"></i>Chưa có chi tiết chi phí</td></tr>'
            );
            return;
          }

          var inner = '<table class="table table-sm mb-0 ct-inner-table">' +
            '<thead><tr class="text-uppercase">' +
            '<th width="30" class="text-center">#</th>' +
            '<th>Jobfile</th>' +
            '<th>Loại phí</th>' +
            '<th>Nhóm phí</th>' +
            '<th class="text-end">Đơn giá</th>' +
            '<th class="text-center">SL</th>' +
            '<th class="text-center">VAT</th>' +
            '<th class="text-end">Trước VAT</th>' +
            '<th class="text-end">Sau VAT</th>' +
            '<th>Ghi chú</th>' +
            '</tr></thead><tbody>';

          var tongTruocVat = 0, tongSauVat = 0;
          $.each(items, function (j, ct) {
            var truocVat = parseFloat(ct.tien_truoc_vat || 0);
            var sauVat = parseFloat(ct.tien_sau_vat || 0);
            tongTruocVat += truocVat;
            tongSauVat += sauVat;
            var donGia = parseFloat(ct.don_gia || 0).toLocaleString('vi-VN', {maximumFractionDigits: 2});
            inner +=
              '<tr>' +
              '<td class="text-center text-muted">' + (j + 1) + '</td>' +
              '<td>' + (ct.lo_hang_ten || '<span class="text-muted">—</span>') + '</td>' +
              '<td>' + (ct.loai_chi_phi_ten || '') + '</td>' +
              '<td>' + (ct.nhom_chi_phi_ten || '') + '</td>' +
              '<td class="text-end num">' + donGia + '</td>' +
              '<td class="text-center">' + (ct.so_luong || 1) + '</td>' +
              '<td class="text-center">' + (ct.vat_phan_tram || 0) + '%</td>' +
              '<td class="text-end num">' + truocVat.toLocaleString('vi-VN', {maximumFractionDigits: 2}) + '</td>' +
              '<td class="text-end num">' + sauVat.toLocaleString('vi-VN', {maximumFractionDigits: 2}) + '</td>' +
              '<td class="text-muted">' + (ct.ghi_chu || '') + '</td>' +
              '</tr>';
          });

          inner += '</tbody><tfoot><tr class="ct-total-row">' +
            '<td colspan="7" class="text-end fw-semibold">Tổng:</td>' +
            '<td class="text-end fw-semibold num">' + tongTruocVat.toLocaleString('vi-VN', {maximumFractionDigits: 2}) + '</td>' +
            '<td class="text-end fw-bold num">' + tongSauVat.toLocaleString('vi-VN', {maximumFractionDigits: 2}) + '</td>' +
            '<td></td></tr></tfoot></table>';

          $tr.after(
            '<tr class="dntt-ct-' + dnttId + ' dntt-ct-row">' +
            '<td></td>' +
            '<td colspan="11" class="p-0"><div class="ct-expand-wrap">' + inner + '</div></td>' +
            '</tr>'
          );
        }
      });
    });

    // Checkbox
    $('#dntt-table').on('change', '#chk-all', function () {
      var checked = $(this).is(':checked');
      $('#dntt-tbody input[type="checkbox"]').prop('checked', checked);
      updateSelection();
    });
    $('#dntt-tbody').on('change', 'input[type="checkbox"]', updateSelection);

    // Batch trình duyệt
    $('#btn-batch-trinh').on('click', batchTrinh);

    // Pagination
    $('#pagination-links').on('click', 'a', function (e) {
      e.preventDefault();
      var p = $(this).data('page');
      if (p) { currentPage = p; loadCurrentTab(); }
    });

    // DNTT inline actions (approve/pay tabs)
    $('#dntt-tbody').on('click', '.btn-dntt-approve', function (e) { e.stopPropagation(); dnttAction($(this).closest('tr').data('dntt-id'), 'da_duyet', 'Duyệt DNTT này?', 'Đã duyệt DNTT.'); });
    $('#dntt-tbody').on('click', '.btn-dntt-reject', function (e) { e.stopPropagation(); dnttAction($(this).closest('tr').data('dntt-id'), 'tu_choi', 'Từ chối DNTT này?', 'Đã từ chối DNTT.'); });
    $('#dntt-tbody').on('click', '.btn-dntt-pay', function (e) { e.stopPropagation(); dnttAction($(this).closest('tr').data('dntt-id'), 'da_tt', 'Thanh toán DNTT này?', 'Đã thanh toán DNTT.'); });
    $('#dntt-tbody').on('click', '.btn-dntt-reject-tt', function (e) { e.stopPropagation(); dnttAction($(this).closest('tr').data('dntt-id'), 'tu_choi_tt', 'Từ chối thanh toán DNTT này?', 'Đã từ chối thanh toán.'); });

    // Lô actions
    $('#dntt-tbody').on('click', '.btn-lo-approve', function (e) { e.stopPropagation(); loAction($(this).closest('tr').data('lo-id'), '/api/lo-dntt/approve', 'Duyệt lô này?', 'Đã duyệt lô thành công.'); });
    $('#dntt-tbody').on('click', '.btn-lo-reject', function (e) { e.stopPropagation(); loAction($(this).closest('tr').data('lo-id'), '/api/lo-dntt/reject', 'Từ chối lô này?', 'Đã từ chối lô.'); });
    $('#dntt-tbody').on('click', '.btn-lo-pay', function (e) { e.stopPropagation(); loAction($(this).closest('tr').data('lo-id'), '/api/lo-dntt/pay', 'Thanh toán lô này?', 'Đã thanh toán lô thành công.'); });
    $('#dntt-tbody').on('click', '.btn-lo-reject-tt', function (e) { e.stopPropagation(); loAction($(this).closest('tr').data('lo-id'), '/api/lo-dntt/reject-tt', 'Từ chối thanh toán lô này?', 'Đã từ chối thanh toán.'); });
    $('#dntt-tbody').on('click', '.btn-lo-remove', function (e) {
      e.stopPropagation();
      var $tr = $(this).closest('tr');
      loRemoveDntt($tr.data('lo-id'), $tr.data('dntt-id'));
    });

    // Expand/collapse lô
    $('#dntt-tbody').on('click', '.lo-row', function () {
      var loId = $(this).data('lo-id');
      $(this).find('.lo-chevron').toggleClass('tabler-chevron-right tabler-chevron-down');
      $('#dntt-tbody .lo-child-' + loId).toggleClass('d-none');
    });
  }

  // =========================================================================
  // Load data
  // =========================================================================

  function loadData() {
    var $activeTab = $('#dntt-tabs .nav-link.active');
    var tabParams = $activeTab.length ? $activeTab.data('params') : {};
    if (typeof tabParams === 'string') tabParams = JSON.parse(tabParams);

    var params = $.extend({page: currentPage}, tabParams);

    // Override with filter values
    var doiTac = $('#filter-doi-tac').val();
    if (doiTac) params.doi_tac_nhan_tien_id = doiTac;

    var trangThai = $('#filter-trang-thai').val();
    if (trangThai) params.trang_thai = trangThai;

    $.ajax({
      url: '/api/dntt/list',
      data: params,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        renderTable(res.data || []);
        renderPagination(res);
        selectedIds = [];
        updateSelection();
        $('#chk-all').prop('checked', false);
      }
    });
  }

  function renderTable(rows) {
    var $table = $('#dntt-table');
    var $tbody = $('#dntt-tbody').empty();

    var perms = CFG.permissions || {};
    var isApproveTab = currentTab === 'cho-duyet';
    var isPayTab = currentTab === 'cho-tt';
    var hasActions = (isApproveTab && perms.dntt_approve) || (isPayTab && perms.dntt_pay);

    // Restore DNTT thead
    var thead = '<tr>' +
      '<th width="30"></th>' +
      '<th width="40"><input type="checkbox" class="form-check-input" id="chk-all"></th>' +
      '<th>Số DNTT</th>' +
      '<th>Bên phát hành</th>' +
      '<th>Đối tác nhận tiền</th>' +
      '<th>Số hóa đơn</th>' +
      '<th class="text-end">Tổng tiền</th>' +
      '<th width="60">Tiền</th>' +
      '<th>Chi phí</th>' +
      '<th width="110">Trạng thái</th>' +
      '<th>Người tạo</th>' +
      '<th width="100">Ngày tạo</th>';
    if (hasActions) thead += '<th width="130" class="text-center">Thao tác</th>';
    thead += '</tr>';
    $table.find('thead').html(thead);

    if (!rows.length) {
      $('#dntt-empty').removeClass('d-none');
      $table.addClass('d-none');
      $('#dntt-pagination').addClass('d-none');
      return;
    }

    $('#dntt-empty').addClass('d-none');
    $table.removeClass('d-none');
    $('#dntt-pagination').removeClass('d-none');

    $.each(rows, function (i, r) {
      var sl = STATUS_LABELS[r.trang_thai] || {text: r.trang_thai, cls: 'bg-label-secondary'};
      var ngayTao = r.created ? new Date(r.created * 1000).toLocaleDateString('vi-VN') : '';
      var tongTien = parseFloat(r.tong_tien || 0).toLocaleString('vi-VN', {maximumFractionDigits: 2});
      var canSelect = r.trang_thai === 'moi';

      var soHD = '';
      if (r.no_hoa_don == 1) {
        soHD = '<span class="text-warning fw-semibold">Nợ HĐ</span>';
      } else if (r.so_hoa_don) {
        soHD = r.so_hoa_don;
      }

      var expandIcon = r.chi_tiet_count > 0
        ? '<i class="ti tabler-chevron-right dntt-chevron" style="cursor:pointer;"></i>'
        : '';

      var chiPhi = '';
      if (r.chi_tiet_count > 0) {
        chiPhi = r.chi_tiet_count + ' dòng';
      }

      var actions = '';
      if (isApproveTab && perms.dntt_approve) {
        actions = '<td class="text-center">' +
          '<button class="btn btn-sm btn-success btn-dntt-approve me-1" title="Duyệt"><i class="ti tabler-check"></i></button>' +
          '<button class="btn btn-sm btn-danger btn-dntt-reject" title="Từ chối"><i class="ti tabler-x"></i></button>' +
          '</td>';
      } else if (isPayTab && perms.dntt_pay) {
        actions = '<td class="text-center">' +
          '<button class="btn btn-sm btn-success btn-dntt-pay me-1" title="Thanh toán"><i class="ti tabler-cash"></i></button>' +
          '<button class="btn btn-sm btn-danger btn-dntt-reject-tt" title="Từ chối TT"><i class="ti tabler-x"></i></button>' +
          '</td>';
      }

      $tbody.append(
        '<tr class="dntt-row" data-dntt-id="' + r.dntt_id + '" style="cursor:pointer;">' +
        '<td class="text-center">' + expandIcon + '</td>' +
        '<td class="text-center">' + (canSelect ? '<input type="checkbox" class="form-check-input" value="' + r.dntt_id + '">' : '') + '</td>' +
        '<td><strong>' + (r.so_dntt || '') + '</strong>' + (r.loai_dntt === 'hoan_ve' ? ' <span class="badge bg-label-info">Hoàn về</span>' : '') + '</td>' +
        '<td>' + (r.ben_phat_hanh_ten || '') + '</td>' +
        '<td>' + (r.doi_tac_nhan_tien_ten || '') + '</td>' +
        '<td>' + soHD + '</td>' +
        '<td class="text-end" style="font-variant-numeric:tabular-nums;">' + tongTien + '</td>' +
        '<td>' + (r.loai_tien || 'VND') + '</td>' +
        '<td class="text-muted small">' + chiPhi + '</td>' +
        '<td><span class="badge ' + sl.cls + '">' + sl.text + '</span></td>' +
        '<td>' + (r.nguoi_tao_ten || '') + '</td>' +
        '<td>' + ngayTao + '</td>' +
        actions +
        '</tr>'
      );
    });
  }

  function renderPagination(res) {
    var total = res.total || 0;
    var pages = res.pages || 1;
    var page = res.page || 1;

    var from = total > 0 ? (page - 1) * 20 + 1 : 0;
    var to = Math.min(page * 20, total);
    $('#pagination-info').text(from + '–' + to + ' / ' + total);

    var $links = $('#pagination-links').empty();
    if (pages <= 1) return;

    if (page > 1) $links.append('<li class="page-item"><a class="page-link" href="#" data-page="' + (page - 1) + '">&laquo;</a></li>');
    for (var p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) {
      var cls = p === page ? ' active' : '';
      $links.append('<li class="page-item' + cls + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>');
    }
    if (page < pages) $links.append('<li class="page-item"><a class="page-link" href="#" data-page="' + (page + 1) + '">&raquo;</a></li>');
  }

  // =========================================================================
  // Mode router
  // =========================================================================

  function loadCurrentTab() {
    if (currentMode === 'lo') {
      $('#dntt-filters').addClass('d-none');
      $('#chk-all').closest('th').addClass('d-none');
      loadLoData();
    } else {
      $('#dntt-filters').removeClass('d-none');
      $('#chk-all').closest('th').removeClass('d-none');
      loadData();
    }
  }

  // =========================================================================
  // Lô DNTT view
  // =========================================================================

  function loadLoData() {
    var $activeTab = $('#dntt-tabs .nav-link.active');
    var tabParams = $activeTab.length ? $activeTab.data('params') : {};
    if (typeof tabParams === 'string') tabParams = JSON.parse(tabParams);

    var params = $.extend({page: currentPage}, tabParams);

    $.ajax({
      url: '/api/lo-dntt/list',
      data: params,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        renderLoTable(res.data || []);
        renderPagination(res);
        selectedIds = [];
        $('#btn-batch-trinh').addClass('d-none');
        $('#chk-all').prop('checked', false);
      }
    });
  }

  function renderLoTable(rows) {
    var $table = $('#dntt-table');
    var $tbody = $('#dntt-tbody').empty();

    if (!rows.length) {
      $('#dntt-empty').removeClass('d-none');
      $table.addClass('d-none');
      $('#dntt-pagination').addClass('d-none');
      return;
    }

    $('#dntt-empty').addClass('d-none');
    $table.removeClass('d-none');
    $('#dntt-pagination').removeClass('d-none');

    // Replace thead for lô mode
    $table.find('thead').html(
      '<tr>' +
      '<th width="40"></th>' +
      '<th>Số lô</th>' +
      '<th>Đối tác nhận tiền</th>' +
      '<th class="text-center" width="70">DNTT</th>' +
      '<th class="text-end">Tổng tiền</th>' +
      '<th width="110">Trạng thái</th>' +
      '<th>Người trình</th>' +
      '<th width="100">Ngày trình</th>' +
      '<th width="160" class="text-center">Thao tác</th>' +
      '</tr>'
    );

    var perms = CFG.permissions || {};
    var isApproveTab = currentTab === 'cho-duyet';
    var isPayTab = currentTab === 'cho-tt';

    $.each(rows, function (i, lo) {
      var sl = LO_STATUS_LABELS[lo.trang_thai] || {text: lo.trang_thai, cls: 'bg-label-secondary'};
      var ngayTrinh = lo.ngay_trinh ? new Date(lo.ngay_trinh * 1000).toLocaleDateString('vi-VN') : '';
      var tongTien = parseFloat(lo.tong_tien || 0).toLocaleString('vi-VN', {maximumFractionDigits: 2});

      var actions = '';
      if (isApproveTab && perms.dntt_approve) {
        actions = '<button class="btn btn-sm btn-success btn-lo-approve me-1" title="Duyệt"><i class="ti tabler-check"></i></button>' +
                  '<button class="btn btn-sm btn-danger btn-lo-reject" title="Từ chối"><i class="ti tabler-x"></i></button>';
      } else if (isPayTab && perms.dntt_pay) {
        actions = '<button class="btn btn-sm btn-success btn-lo-pay me-1" title="Thanh toán"><i class="ti tabler-cash"></i></button>' +
                  '<button class="btn btn-sm btn-danger btn-lo-reject-tt" title="Từ chối TT"><i class="ti tabler-x"></i></button>';
      }

      $tbody.append(
        '<tr class="lo-row" data-lo-id="' + lo.lo_dntt_id + '" style="cursor:pointer;background:#f8f7ff;">' +
        '<td class="text-center"><i class="ti tabler-chevron-right lo-chevron"></i></td>' +
        '<td><strong>' + (lo.so_lo || '') + '</strong></td>' +
        '<td>' + (lo.doi_tac_nhan_tien_ten || '') + '</td>' +
        '<td class="text-center">' + (lo.dntt_count || 0) + '</td>' +
        '<td class="text-end" style="font-variant-numeric:tabular-nums;">' + tongTien + '</td>' +
        '<td><span class="badge ' + sl.cls + '">' + sl.text + '</span></td>' +
        '<td>' + (lo.nguoi_trinh_ten || '') + '</td>' +
        '<td>' + ngayTrinh + '</td>' +
        '<td class="text-center">' + actions + '</td>' +
        '</tr>'
      );

      // Child DNTT rows (hidden by default)
      $.each(lo.dntts || [], function (j, d) {
        var dsl = STATUS_LABELS[d.trang_thai] || {text: d.trang_thai, cls: 'bg-label-secondary'};
        var dTien = parseFloat(d.tong_tien || 0).toLocaleString('vi-VN', {maximumFractionDigits: 2});
        var removeBtn = (isApproveTab && perms.dntt_approve) ?
          '<button class="btn btn-sm btn-label-danger btn-lo-remove" title="Gỡ khỏi lô"><i class="ti tabler-unlink"></i></button>' : '';

        $tbody.append(
          '<tr class="lo-child-' + lo.lo_dntt_id + ' d-none" data-lo-id="' + lo.lo_dntt_id + '" data-dntt-id="' + d.dntt_id + '" style="background:#fafafa;">' +
          '<td></td>' +
          '<td class="ps-4 text-muted">' + (d.so_dntt || '') + '</td>' +
          '<td></td>' +
          '<td></td>' +
          '<td class="text-end" style="font-variant-numeric:tabular-nums;">' + dTien + '</td>' +
          '<td><span class="badge ' + dsl.cls + '">' + dsl.text + '</span></td>' +
          '<td></td>' +
          '<td></td>' +
          '<td class="text-center">' + removeBtn + '</td>' +
          '</tr>'
        );
      });
    });
  }

  function dnttAction(dnttId, newStatus, confirmText, successText) {
    Swal.fire({
      title: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then(function (result) {
      if (!result.isConfirmed) return;
      $.ajax({
        url: '/api/dntt/transition',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({dntt_id: parseInt(dnttId), new_status: newStatus}),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            notyf.success(successText);
            loadCurrentTab();
          } else {
            notyf.error(res.message || 'Có lỗi xảy ra.');
          }
        },
        error: function () { notyf.error('Lỗi kết nối server.'); }
      });
    });
  }

  function loAction(loId, url, confirmText, successText) {
    Swal.fire({
      title: confirmText,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận',
      cancelButtonText: 'Hủy'
    }).then(function (result) {
      if (!result.isConfirmed) return;
      $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({lo_dntt_id: loId}),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            notyf.success(successText);
            loadCurrentTab();
          } else {
            notyf.error(res.message || 'Có lỗi xảy ra.');
          }
        },
        error: function () { notyf.error('Lỗi kết nối server.'); }
      });
    });
  }

  function loRemoveDntt(loId, dnttId) {
    Swal.fire({
      title: 'Gỡ DNTT khỏi lô?',
      text: 'DNTT sẽ chuyển về trạng thái Mới.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Gỡ',
      cancelButtonText: 'Hủy'
    }).then(function (result) {
      if (!result.isConfirmed) return;
      $.ajax({
        url: '/api/lo-dntt/remove-dntt',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({lo_dntt_id: loId, dntt_id: dnttId}),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            notyf.success('Đã gỡ DNTT khỏi lô.');
            loadCurrentTab();
          } else {
            notyf.error(res.message || 'Có lỗi xảy ra.');
          }
        },
        error: function () { notyf.error('Lỗi kết nối server.'); }
      });
    });
  }

  // =========================================================================
  // Batch actions
  // =========================================================================

  function updateSelection() {
    selectedIds = [];
    $('#dntt-tbody input[type="checkbox"]:checked').each(function () {
      selectedIds.push($(this).val());
    });
    var $btn = $('#btn-batch-trinh');
    if (selectedIds.length > 0) {
      $btn.removeClass('d-none');
      $('#batch-count').text(selectedIds.length);
    } else {
      $btn.addClass('d-none');
    }
  }

  function batchTrinh() {
    if (!selectedIds.length) return;
    Swal.fire({
      title: 'Trình duyệt ' + selectedIds.length + ' DNTT?',
      text: 'Hệ thống sẽ tự chia lô theo đối tác nhận tiền.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Trình duyệt',
      cancelButtonText: 'Hủy'
    }).then(function (result) {
      if (!result.isConfirmed) return;
      $.ajax({
        url: '/api/lo-dntt/create-batch',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({dntt_ids: selectedIds.map(Number)}),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            notyf.success('Đã tạo ' + res.lo_count + ' lô, trình duyệt ' + res.dntt_count + ' DNTT.');
            loadCurrentTab();
          } else {
            notyf.error(res.message || 'Có lỗi xảy ra.');
          }
        },
        error: function () {
          notyf.error('Lỗi kết nối server.');
        }
      });
    });
  }

})(jQuery);

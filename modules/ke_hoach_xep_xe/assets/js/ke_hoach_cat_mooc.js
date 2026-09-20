/**
 * Screen /cat-mooc: cont đang ở kho (hàng cảng), theo trạng thái cont.
 *
 * Giao diện dùng lại screen hàng cảng nhưng JS là của riêng screen này:
 * dữ liệu từ GET /api/ke-hoach-cat-mooc, thao tác đổi trạng thái cont qua
 * PUT /api/quan-ly-cont/{id}. Danh sách thao tác của mỗi cont do server trả về
 * (hanh_dong_cont); JS chỉ hiển thị.
 */
(function ($, Drupal) {
  'use strict';

  var notyf = null;

  var PAGE_LIMIT = 50;
  var state = {
    page: 1,
    group: 'all',
    sort: 'desc'
  };
  var listXhr = null;

  var HINH_THUC_LABEL = {
    cat_keo: 'Cắt kéo',
    cat_keo_cheo: 'Cắt kéo chéo',
    tha_mooc: 'Thả mooc',
    rut_mooc: 'Rút mooc',
    dong_hang: 'Đóng hàng',
    roi_cont: 'Rời Cont'
  };
  var HINH_THUC_COLOR = {
    cat_keo: 'bg-label-success',
    cat_keo_cheo: 'bg-label-primary',
    tha_mooc: 'bg-label-warning',
    rut_mooc: 'bg-label-info',
    dong_hang: 'bg-label-secondary',
    roi_cont: 'bg-label-secondary'
  };
  var CONT_STATUS_COLOR = {
    'Chưa cắt mooc': 'bg-label-secondary',
    'Đã cắt mooc': 'bg-label-info',
    'Đủ hàng': 'bg-label-primary',
    'Đang kéo về': 'bg-label-warning',
    'Hoàn thành': 'bg-label-success'
  };
  var TRIP_STATUS_COLOR = {
    'Chờ duyệt': 'bg-label-secondary',
    'Chờ thực hiện': 'cm-status-cho-thuc-hien',
    'Đã nhận chuyến': 'bg-label-info',
    'Đang kéo lên': 'bg-label-primary',
    'Đang kéo về': 'bg-label-warning',
    'Hoàn thành': 'bg-label-success',
    'Đã huỷ': 'bg-label-danger'
  };
  // Nhãn các thao tác cont có hộp xác nhận (thao tác còn lại đảo được nên đổi ngay).
  var CONFIRM_TEXT = {
    xac_nhan_cat_mooc: { title: 'Xác nhận đã cắt mooc?', text: 'Dùng khi cont đã thả tại kho nhưng lái xe chưa báo. Cont sẽ chuyển sang "Đã cắt mooc".', ok: 'Xác nhận' },
    xac_nhan_cont_ve: { title: 'Xác nhận cont đã về?', text: 'Cont sẽ chuyển sang trạng thái cont "Hoàn thành".', ok: 'Xác nhận' },
    danh_dau_du_hang: { title: 'Xác nhận cont đã đủ hàng?', text: 'Cont sẽ chuyển từ "Đã cắt mooc" sang "Đủ hàng".', ok: 'Xác nhận' },
    bo_du_hang: { title: 'Bỏ đánh dấu đủ hàng?', text: 'Cont sẽ quay về trạng thái "Đã cắt mooc".', ok: 'Xác nhận' }
  };

  function escHtml(value) {
    return String(value === null || typeof value === 'undefined' ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r.message || 'Lỗi không xác định';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function dateOnlyStack(val) {
    if (!val) return '';
    var d = String(val).split(' ')[0].split('-');
    if (d.length !== 3) return escHtml(val);
    return escHtml(d[2] + '/' + d[1] + '/' + d[0].slice(-2));
  }

  // Nhãn khách hàng ngắn gọn: mã KH, không có mã thì dùng tên.
  function customerLabel(customer) {
    if (!customer) return '';
    return customer.ma_kh || customer.ten || (customer.nid ? '#' + customer.nid : '');
  }

  // Dropdown Select2 nằm trong thanh lọc để nhận kiểu của screen hàng cảng.
  function filterDropdownParent() {
    return $('#cm-filter');
  }

  function hinhThucBadge(value) {
    if (!value) return '';
    var label = HINH_THUC_LABEL[value] || value;
    return '<span class="badge ' + (HINH_THUC_COLOR[value] || 'bg-label-secondary') + '" title="Hình thức vận tải: ' + escHtml(label) + '">' + escHtml(label) + '</span>';
  }

  // Khối xe: đầu kéo / mooc / lái xe. titlePrefix (nếu có) là các dòng thêm vào đầu tooltip.
  function vehicleInfoHtml(row, titlePrefix) {
    var lxName = (row.lai_xe && row.lai_xe.ten) || '';
    var lxSdt = (row.lai_xe && row.lai_xe.sdt) || '';
    var pt = row.phuong_tien || {};
    var mooc = row.mooc || {};
    var title = (titlePrefix ? [titlePrefix] : []).concat([
      'Đầu kéo: ' + (pt.bks ? pt.bks + (pt.ma_tai_san ? ' - ' + pt.ma_tai_san : '') : 'Chưa có'),
      'Mooc: ' + (mooc.bks ? mooc.bks + (mooc.ma_tai_san ? ' - ' + mooc.ma_tai_san : '') : 'Chưa có'),
      'Lái xe: ' + ((lxName || lxSdt) ? (lxName + (lxSdt ? ' - ' + lxSdt : '')) : 'Chưa có')
    ]).join('\n');
    return '<div class="cm-vehicle-info" title="' + escHtml(title) + '">' +
      '<div class="cm-vehicle-bks">' + (pt.bks ? escHtml(pt.bks) : '_') + '</div>' +
      '<div class="cm-vehicle-mooc">' + (mooc.bks ? escHtml(mooc.bks) : '_') + '</div>' +
      '<div class="cm-vehicle-driver">' + (lxName ? escHtml(lxName) : '_') + '</div>' +
      '</div>';
  }

  function daysAtKhoHtml(row) {
    if (row.so_ngay_o_kho === null || typeof row.so_ngay_o_kho === 'undefined') return '';
    var days = parseInt(row.so_ngay_o_kho, 10) || 0;
    return '<span class="cm-o-kho-days" title="Cont ở kho từ: ' + escHtml(row.o_kho_tu || '') + '">' + (days === 0 ? 'Mới về kho' : 'Ở kho ' + days + ' ngày') + '</span>';
  }

  // Xe kéo về: xe của kế hoạch đang kéo cont này về, cùng dạng với cột "Xe kéo lên".
  // Thông tin kế hoạch (BKG, hình thức, trạng thái chuyến) nằm trong tooltip.
  function keoVeHtml(row) {
    var plan = row.keo_ve;
    if (!plan) return '<span class="text-muted fst-italic small">Chưa có</span>';
    var label = HINH_THUC_LABEL[plan.hinh_thuc_van_tai] || plan.hinh_thuc_van_tai || '';
    var header = 'Kế hoạch kéo về #' + plan.nid + (plan.so_bkg ? ' - ' + plan.so_bkg : '') +
      (label ? '\nHình thức: ' + label : '') +
      (plan.trang_thai_van_chuyen ? '\nTrạng thái chuyến: ' + plan.trang_thai_van_chuyen : '');
    return vehicleInfoHtml(plan, header);
  }

  // Trạng thái cont. Đã cắt mooc / Đủ hàng bấm được để đổi qua lại.
  function contStatusBadgeHtml(row) {
    var status = String(row.trang_thai_cont || '');
    if (!status) return '';
    var toggleAction = null;
    $.each(row.hanh_dong_cont || [], function (_, action) {
      if (action.action === 'danh_dau_du_hang' || action.action === 'bo_du_hang') toggleAction = action;
    });
    var color = CONT_STATUS_COLOR[status] || 'bg-label-secondary';
    if (toggleAction) {
      return '<span class="badge rounded-pill cm-cont-toggle ' + color + '" role="button" tabindex="0" data-id="' + row.nid + '" data-cont="' + escHtml(row.so_cont || '') + '" data-action="' + escHtml(toggleAction.action) + '" title="Trạng thái cont: ' + escHtml(status) + '. Bấm để ' + escHtml(toggleAction.label.toLowerCase()) + '"><i class="ti tabler-package me-1"></i>' + escHtml(status) + '</span>';
    }
    return '<span class="badge rounded-pill ' + color + '" title="Trạng thái cont: ' + escHtml(status) + '"><i class="ti tabler-package me-1"></i>' + escHtml(status) + '</span>';
  }

  function rowMenuHtml(row) {
    var items = '';
    $.each(row.hanh_dong_cont || [], function (_, action) {
      items += '<li><button type="button" class="dropdown-item cm-cont-action" data-id="' + row.nid + '" data-cont="' + escHtml(row.so_cont || '') + '" data-action=""' + escHtml(action.action) + '"><i class="ti tabler-package me-2 text-primary"></i>' + escHtml(action.label) + '</button></li>';
    });
    if (!items) {
      items = '<li class="cm-action-disabled"><span class="dropdown-item disabled" aria-disabled="true"><i class="ti tabler-package me-2 text-muted"></i>Không có thao tác<span class="cm-action-hint"></span></span></li>';
    }
    return '<span class="cm-row-action-menu"><div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div></span>';
  }

  function rowHtml(row, stt) {
    var contText = [row.loai_cont || '', row.so_cont || ''].filter(Boolean).join(' - ');
    var baiLay = row.bai_lay_thuc_te || row.bai_lay_cont || '';
    var baiHa = row.bai_ha_thuc_te || row.bai_ha_cont || '';
    var khName = customerLabel(row.khach_hang);
    var customerTitle = 'Khách hàng: ' + (khName ? khName + (row.khach_hang && row.khach_hang.ten ? ' - ' + row.khach_hang.ten : '') : 'Chưa có') + (row.so_bkg ? '\nBKG: ' + row.so_bkg : '');
    var containerTitle = 'Container: ' + (contText || 'Chưa có') + '\nSeal chính: ' + (row.so_seal_chinh || 'Chưa có') + (row.so_seal_tam ? '\nSeal phụ: Có' : '');
    return '<tr data-id="' + row.nid + '">' +
      '<td><button type="button" class="cm-row-actions-trigger" title="Mở chức năng" aria-label="Mở chức năng #' + stt + '">' + stt + '</button></td>' +
      '<td class="cm-date-cell"><div class="cm-date-stack">' + (dateOnlyStack(row.ngay_gio_ke_hoach) || '<span class="text-muted">—</span>') + daysAtKhoHtml(row) + '</div>' + rowMenuHtml(row) + '</td>' +
      '<td class="cm-common-cell">' +
        '<div class="cm-customer-cell" title="' + escHtml(customerTitle) + '">' + (khName ? escHtml(khName) : '_') + (row.so_bkg ? ' <span class="cm-customer-bkg">- ' + escHtml(row.so_bkg) + '</span>' : '') + '</div>' +
        '<div class="cm-htvt-cell">' + (row.hinh_thuc_van_tai ? '<div class="cm-htvt-badge-wrap">' + hinhThucBadge(row.hinh_thuc_van_tai) + '</div>' : '') + '</div>' +
      '</td>' +
      '<td class="cm-container-cell" title="' + escHtml(containerTitle) + '">' +
        '<div>' + (contText ? (row.loai_cont ? escHtml(row.loai_cont) + (row.so_cont ? ' - ' : '') : '') + (row.so_cont ? '<span class="cm-port-list-cont-number">' + escHtml(row.so_cont) + '</span>' : '') : '_') + '</div>' +
        '<div>' + (row.so_seal_chinh ? escHtml(row.so_seal_chinh) : '_') + '</div>' +
        (row.so_seal_tam ? '<div><span class="fst-italic">Có seal phụ</span></div>' : '') +
      '</td>' +
      '<td class="cm-vehicle-cell">' + vehicleInfoHtml(row) + '</td>' +
      '<td class="cm-kho-cell" title="Địa chỉ kho: ' + escHtml(row.dia_chi_kho || 'Chưa có') + '">' + (row.dia_chi_kho ? escHtml(row.dia_chi_kho) : '_') + '</td>' +
      '<td class="text-nowrap"><div class="cm-hanh-trinh-cell" title="' + escHtml('Bãi lấy: ' + (baiLay || 'Chưa có') + '\nBãi hạ: ' + (baiHa || 'Chưa có')) + '">' +
        '<div class="cm-hanh-trinh-box">' + (baiLay ? escHtml(baiLay) : '_') + '</div><div class="cm-hanh-trinh-separator"></div><div class="cm-hanh-trinh-box">' + (baiHa ? escHtml(baiHa) : '_') + '</div></div></td>' +
      '<td class="cm-vehicle-cell cm-keo-ve-cell">' + keoVeHtml(row) + '</td>' +
      '<td class="cm-status-cell"><div class="cm-status-stack">' + contStatusBadgeHtml(row) + '</div></td>' +
      '</tr>';
  }

  // ---- Lọc, tab, phân trang ----

  function collectFilters() {
    var customers = $('#cm-filter-khach-hang').val() || [];
    return {
      khach_hang: customers.join(','),
      dia_chi_kho: $('#cm-filter-dia-chi-kho').val() || '',
      keyword: String($('#cm-filter-keyword').val() || '').trim(),
      da_du_hang: $('#cm-filter-du-hang').val() || ''
    };
  }

  function updateTabs(counts, total) {
    counts = counts || {};
    $('#cm-port-status-tabs [data-group-count]').each(function () {
      var key = String($(this).attr('data-group-count') || '');
      $(this).text(key === 'all' ? (Number(total) || 0) : (Number(counts[key]) || 0));
    });
    $('#cm-port-status-tabs [data-group]').each(function () {
      var active = String($(this).attr('data-group')) === state.group;
      $(this).toggleClass('active', active).attr('aria-selected', active ? 'true' : 'false');
    });
  }

  function renderPagination(resp) {
    var $wrap = $('#cm-pagination-wrap');
    var total = resp.total_pages || 0;
    var current = resp.current_page || 0;
    $('#cm-pagination-info').text('Tổng số: ' + (resp.total || 0) + ' cont');
    $('#cm-pagination-total-pages').text('/ ' + total);
    $('#cm-pagination-jump').val(current).attr('data-total-pages', total);
    $wrap.show();
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
    $wrap.find('ul.pagination').html(html);
  }

  function loadList() {
    var $body = $('#cm-list-body');
    $body.html('<tr id="loading-row"><td colspan="9" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
    var params = $.extend({ page: state.page, limit: PAGE_LIMIT, nhom: state.group, sort: state.sort }, collectFilters());
    // Huỷ request trước đó để response đến trễ không ghi đè kết quả mới.
    if (listXhr && listXhr.readyState !== 4) listXhr.abort();
    var currentXhr = listXhr = $.ajax({
      url: '/api/ke-hoach-cat-mooc',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        if (currentXhr !== listXhr) return;
        if (res.status !== 'success' || !res.data) {
          $body.html('<tr><td colspan="9" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }
        var resp = res.data;
        updateTabs(resp.group_counts, resp.group_total);
        var items = resp.items || [];
        if (!items.length) {
          $body.html('<tr><td colspan="9" class="text-center py-4">Không có dữ liệu</td></tr>');
          renderPagination(resp);
          return;
        }
        var html = '';
        for (var i = 0; i < items.length; i++) {
          html += rowHtml(items[i], (resp.current_page - 1) * (resp.limit || PAGE_LIMIT) + i + 1);
        }
        $body.html(html);
        renderPagination(resp);
      },
      error: function (jqXHR, textStatus) {
        if (textStatus === 'abort' || currentXhr !== listXhr) return;
        $body.html('<tr><td colspan="9" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  // ---- Thao tác đổi trạng thái cont ----

  function payloadForAction(action) {
    switch (action) {
      case 'xac_nhan_cat_mooc': return { trang_thai_cont: 'Đã cắt mooc' };
      case 'xac_nhan_cont_ve': return { trang_thai_cont: 'Hoàn thành' };
      case 'danh_dau_du_hang': return { da_du_hang: 1 };
      case 'bo_du_hang': return { da_du_hang: 0 };
    }
    return null;
  }

  function runContAction(id, action) {
    var payload = payloadForAction(action);
    if (!id || !payload) return;
    var $row = $('#cm-list-body tr[data-id="' + id + '"]').addClass('cm-row-busy');
    $.ajax({
      url: '/api/quan-ly-cont/' + id,
      type: 'PUT',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(payload)
    }).done(function (res) {
      if (res.status !== 'success') {
        if (notyf) notyf.error(res.message || 'Cập nhật thất bại');
        $row.removeClass('cm-row-busy');
        return;
      }
      if (notyf) notyf.success('Đã cập nhật trạng thái cont');
      loadList();
    }).fail(function (jqXHR) {
      $row.removeClass('cm-row-busy');
      if (notyf) notyf.error(apiMsg(jqXHR));
    });
  }

  function requestContAction(id, action, contNumber) {
    var confirmText = CONFIRM_TEXT[action];
    if (!confirmText) {
      runContAction(id, action);
      return;
    }
    if (typeof Swal === 'undefined') {
      if (window.confirm(confirmText.title)) runContAction(id, action);
      return;
    }
    Swal.fire({
      title: confirmText.title,
      text: (contNumber ? 'Cont ' + contNumber + ': ' : '') + confirmText.text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: confirmText.ok,
      cancelButtonText: 'Huỷ',
      customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
      buttonsStyling: false
    }).then(function (result) {
      if (result.isConfirmed) runContAction(id, action);
    });
  }

  // ---- Menu chức năng của dòng (cùng cách dùng với screen hàng cảng) ----

  function closeRowMenu(dropdown) {
    var menu = dropdown.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.position = '';
      menu.style.top = '';
      menu.style.left = '';
      menu.style.display = '';
      menu.style.zIndex = '';
    }
    dropdown.removeAttribute('data-fd-open');
  }

  function closeAllRowMenus() {
    $('.dropdown[data-fd-open]').each(function () { closeRowMenu(this); });
    $('#cm-list-body tr.cm-row-menu-active').removeClass('cm-row-menu-active');
  }

  function openRowMenuAt(row, x, y) {
    var dropdown = row.querySelector('.dropdown');
    var menu = row.querySelector('.dropdown-menu');
    if (!dropdown || !menu) return;
    closeAllRowMenus();
    menu.style.position = 'fixed';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.display = 'block';
    menu.style.zIndex = '1080';
    dropdown.setAttribute('data-fd-open', '1');
    $(row).addClass('cm-row-menu-active');
    var margin = 8;
    var width = menu.offsetWidth || 190;
    var height = menu.offsetHeight || 100;
    var left = x;
    var top = y;
    if (left + width > window.innerWidth - margin) left = Math.max(margin, x - width);
    if (top + height > window.innerHeight - margin) top = Math.max(margin, y - height);
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }

  function isInteractiveTarget(target) {
    return $(target).closest('button, a, input, select, textarea, label, .dropdown, .select2-container, [role="button"]').length > 0;
  }

  function bindEvents() {
    $('#cm-search-btn').on('click', function () { state.page = 1; loadList(); });
    // Các ô lọc chỉ có tác dụng khi bấm Tìm (hoặc Enter), không tự tìm khi đổi giá trị.
    $('#cm-filter').on('keypress', 'input, select', function (e) {
      // Enter trong ô tìm của Select2 dùng để chọn option, không phải để tìm cont.
      if (e.which !== 13 || $(e.target).is('.select2-search__field')) return;
      e.preventDefault();
      $('#cm-search-btn').trigger('click');
    });
    $('.cm-port-filter-reset').on('click', function () {
      $('#cm-filter-keyword').val('');
      $('#cm-filter-dia-chi-kho').val(null).trigger('change');
      $('#cm-filter-du-hang').val(null).trigger('change');
      $('#cm-filter-khach-hang').val(null).trigger('change');
      state.page = 1;
      loadList();
    });
    $('#cm-port-status-tabs').on('click', '[data-group]', function () {
      var group = String($(this).attr('data-group') || '');
      if (!group || group === state.group) return;
      state.group = group;
      state.page = 1;
      loadList();
    });
    $('#cm-date-sort').on('click', function () {
      state.sort = state.sort === 'desc' ? 'asc' : 'desc';
      var asc = state.sort === 'asc';
      $(this).attr('data-direction', state.sort)
        .attr('title', 'Sắp xếp ngày: ' + (asc ? 'cũ đến mới' : 'mới đến cũ'))
        .find('i').toggleClass('tabler-sort-ascending', asc).toggleClass('tabler-sort-descending', !asc);
      state.page = 1;
      loadList();
    });
    $('#cm-pagination-wrap').on('click', 'a.page-link', function (e) {
      e.preventDefault();
      var page = parseInt($(this).attr('data-page'), 10) || 0;
      if (page > 0 && !$(this).closest('.page-item').hasClass('disabled')) {
        state.page = page;
        loadList();
      }
    });
    $('#cm-pagination-jump').on('keypress', function (e) {
      if (e.which !== 13) return;
      var total = parseInt($(this).attr('data-total-pages'), 10) || 0;
      var page = parseInt($(this).val(), 10) || 0;
      if (page > 0 && page <= total) { state.page = page; loadList(); }
    });

    var $list = $('#cm-list-body');
    $list.on('click', '.cm-row-actions-trigger', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var row = $(this).closest('tr')[0];
      if (!row) return;
      var dropdown = row.querySelector('.dropdown');
      if (dropdown && dropdown.hasAttribute('data-fd-open')) {
        closeAllRowMenus();
        return;
      }
      var rect = this.getBoundingClientRect();
      openRowMenuAt(row, rect.left + (rect.width / 2), rect.bottom);
    });
    $list.on('contextmenu', 'tr', function (e) {
      if (isInteractiveTarget(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
      var dropdown = this.querySelector('.dropdown');
      if (dropdown && dropdown.hasAttribute('data-fd-open')) {
        closeAllRowMenus();
        return;
      }
      openRowMenuAt(this, e.clientX, e.clientY);
    });
    $list.on('click', '.cm-cont-action', function (e) {
      e.preventDefault();
      closeAllRowMenus();
      requestContAction(parseInt($(this).attr('data-id'), 10) || 0, String($(this).attr('data-action') || ''), String($(this).attr('data-cont') || ''));
    });
    // Bấm vào trạng thái cont để đổi Đã cắt mooc <-> Đủ hàng.
    $list.on('click keydown', '.cm-cont-toggle', function (e) {
      if (e.type === 'keydown' && e.which !== 13 && e.which !== 32) return;
      e.preventDefault();
      e.stopPropagation();
      requestContAction(parseInt($(this).attr('data-id'), 10) || 0, String($(this).attr('data-action') || ''), String($(this).attr('data-cont') || ''));
    });
    // Bỏ nền dòng đang chọn khi menu đã đóng (theme đóng menu khi bấm ra ngoài / Esc).
    $(document).on('click keydown', function () {
      window.setTimeout(function () {
        if (!$('.dropdown[data-fd-open]').length) $('#cm-list-body tr.cm-row-menu-active').removeClass('cm-row-menu-active');
      }, 0);
    });
  }

  function initFilterSelect2($select, options) {
    if (typeof $.fn.select2 !== 'function' || !$select.length) return;
    if ($select.data('select2')) $select.select2('destroy');
    $select.select2($.extend({ allowClear: true, width: '100%', dropdownParent: filterDropdownParent() }, options));
  }

  // Khách hàng: nhãn là mã KH (ngắn gọn), chọn nhiều.
  function loadCustomerFilter() {
    $.getJSON('/api/khach-hang', { limit: 500 }, function (res) {
      var html = '';
      if (res.status === 'success' && res.data && res.data.items) {
        $.each(res.data.items, function (_, customer) {
          if (!customer || !customer.nid) return;
          html += '<option value="' + customer.nid + '">' + escHtml(customerLabel(customer)) + '</option>';
        });
      }
      $('#cm-filter-khach-hang').html(html);
      initFilterSelect2($('#cm-filter-khach-hang'), { placeholder: '— Chọn một hoặc nhiều khách hàng —', closeOnSelect: false });
    }).fail(function (jqXHR) {
      if (notyf) notyf.error(apiMsg(jqXHR));
    });
  }

  // Kho: lấy đầy đủ từ danh mục Kho (cùng nguồn với màn hàng cảng), không chỉ kho đang có cont.
  function loadKhoFilter() {
    $.getJSON('/api/danh-muc', { phan_loai: 'Kho', limit: 500 }, function (res) {
      var html = '<option></option>';
      var seen = {};
      if (res.status === 'success' && res.data && res.data.items) {
        $.each(res.data.items, function (_, item) {
          var name = String((item && item.ten) || '').trim();
          if (!name || seen[name]) return;
          seen[name] = true;
          html += '<option value="' + escHtml(name) + '">' + escHtml(name) + '</option>';
        });
      }
      $('#cm-filter-dia-chi-kho').html(html);
      initFilterSelect2($('#cm-filter-dia-chi-kho'), { placeholder: '— Chọn địa chỉ kho —' });
    }).fail(function (jqXHR) {
      if (notyf) notyf.error(apiMsg(jqXHR));
    });
  }

  function initFilters() {
    loadCustomerFilter();
    loadKhoFilter();
    initFilterSelect2($('#cm-filter-du-hang'), { placeholder: '— Chọn đủ hàng —', minimumResultsForSearch: Infinity });
  }

  Drupal.behaviors.keHoachCatMooc = {
    attach: function (context) {
      if (!$('#cm-list-app', context).length || Drupal.keHoachCatMoocBound) return;
      Drupal.keHoachCatMoocBound = true;
      if (typeof Notyf !== 'undefined') notyf = new Notyf();
      bindEvents();
      initFilters();
      loadList();
    }
  };
})(jQuery, Drupal);

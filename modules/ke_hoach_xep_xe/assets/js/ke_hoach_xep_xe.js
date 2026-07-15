(function ($, Drupal) {
  'use strict';

  var notyf;
  var settings = Drupal.settings.ke_hoach_xep_xe || {};
  var perms = settings.permissions || {};
  var statuses = settings.statuses || [];
  var mode = settings.mode || 'list';
  var data = settings.data || null;

  var currentPage = 1;
  var currentKeyword = '';
  var currentStatus = '';

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r.message || 'Lỗi không xác định';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  Drupal.behaviors.keHoachXepXe = {
    attach: function (context, settingsBehavior) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#ke-hoach-list-app', context).length) {
        initList(context);
      }
      if ($('#ke-hoach-form-app', context).length) {
        initForm(context);
      }
      if ($('#detail-body', context).length) {
        initDetail(context);
      }
    }
  };

  // ==========================================================================
  // LIST
  // ==========================================================================
  function initList(context) {
    var doc = document;
    var container = doc.getElementById('ke-hoach-list-app');

    // Populate status filter
    var filterEl = doc.getElementById('status-filter');
    if (filterEl) {
      for (var i = 0; i < statuses.length; i++) {
        var opt = doc.createElement('option');
        opt.value = statuses[i];
        opt.textContent = statuses[i];
        filterEl.appendChild(opt);
      }
    }

    loadList();

    // --- Event listeners ---

    // Search button
    var searchBtn = doc.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', function () {
        currentKeyword = doc.getElementById('search-input').value.trim();
        currentPage = 1;
        loadList();
      });
    }

    // Search on Enter
    var searchInput = doc.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('keypress', function (e) {
        if (e.which === 13) {
          currentKeyword = this.value.trim();
          currentPage = 1;
          loadList();
        }
      });
    }

    // Status filter
    if (filterEl) {
      filterEl.addEventListener('change', function () {
        currentStatus = this.value;
        currentPage = 1;
        loadList();
      });
    }

    // Reload button
    var reloadBtn = doc.querySelector('.btn-reload');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentStatus = '';
        doc.getElementById('search-input').value = '';
        doc.getElementById('status-filter').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Pagination jump
    var jumpInput = doc.getElementById('pagination-jump');
    if (jumpInput) {
      jumpInput.addEventListener('keypress', function (e) {
        if (e.which === 13) {
          var page = parseInt(this.value);
          var total = parseInt(this.getAttribute('data-total-pages'));
          if (page > 0 && page <= total) {
            currentPage = page;
            loadList();
          }
        }
      });
    }

    // Delegated clicks
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view')) {
            e.preventDefault();
            window.location.href = '/ke-hoach-xep-xe/' + t.getAttribute('data-id');
            return;
          }
          if (t.classList.contains('btn-edit')) {
            e.preventDefault();
            window.location.href = '/ke-hoach-xep-xe/' + t.getAttribute('data-id') + '/sua';
            return;
          }
          if (t.classList.contains('btn-delete')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('page-link')) {
            var pageLink = parseInt(t.getAttribute('data-page'));
            if (pageLink && pageLink !== currentPage) {
              e.preventDefault();
              currentPage = pageLink;
              loadList();
            }
            return;
          }
        }
        t = t.parentElement;
      }
    });

    // Dropdown hover positioning
    doc.addEventListener('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#list-body')) {
        var menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          var btn = dropdown.querySelector('button');
          var rect = btn.getBoundingClientRect();
          menu.style.position = 'fixed';
          menu.style.top = rect.top + 'px';
          menu.style.left = rect.right + 'px';
          menu.style.display = 'block';
        }
      }
    });

    doc.addEventListener('mouseout', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#list-body')) {
        if (!dropdown.contains(e.relatedTarget)) {
          var menu = dropdown.querySelector('.dropdown-menu');
          if (menu) {
            menu.style.display = '';
            menu.style.position = '';
            menu.style.top = '';
            menu.style.left = '';
          }
        }
      }
    });
  }

  function loadList() {
    var tbody = document.getElementById('list-body');
    tbody.innerHTML =
      '<tr id="loading-row"><td colspan="8" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>';

    var params = { page: currentPage };
    if (currentKeyword) params.keyword = currentKeyword;
    if (currentStatus) params.trang_thai_van_chuyen = currentStatus;

    $.ajax({
      url: '/api/ke-hoach-xep-xe',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi không xác định') + '</td></tr>';
          return;
        }

        var resp = res.data;
        var items = resp.items || [];
        var pageSize = resp.limit || 20;

        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Không có dữ liệu</td></tr>';
          renderPagination(resp);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var row = items[i];
          var stt = (resp.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(row.nid);
          html += '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + (row.ngay || '') + '</td>' +
            '<td>' + escHtml(row.so_bkg || '') + '</td>' +
            '<td>' + escHtml(row.so_cont || '') + '</td>' +
            '<td>' + escHtml(row.loai_cont || '') + '</td>' +
            '<td>' + escHtml(row.dia_chi_kho || '') + '</td>' +
            '<td><span class="badge bg-label-info">' + escHtml(row.trang_thai_van_chuyen || '') + '</span></td>' +
            '</tr>';
        }
        tbody.innerHTML = html;
        renderPagination(resp);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>';
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    var items = '';
    if (perms.view) {
      items += '<li><button type="button" class="dropdown-item btn-view" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.create) {
      items += '<li><button type="button" class="dropdown-item btn-edit" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill" type="button" data-bs-toggle="dropdown">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(resp) {
    var container = document.getElementById('pagination-wrap');
    if (!container) return;
    var ul = container.querySelector('ul.pagination');
    if (!ul) return;
    ul.innerHTML = '';

    var total = resp.total_pages || 0;
    var current = resp.current_page || 0;
    var totalItems = resp.total || 0;

    var infoEl = document.getElementById('pagination-info');
    if (infoEl) infoEl.textContent = 'Tổng số: ' + totalItems + ' bản ghi';

    var totalPagesEl = document.getElementById('pagination-total-pages');
    if (totalPagesEl) totalPagesEl.textContent = '/ ' + total;

    var jumpInput = document.getElementById('pagination-jump');
    if (jumpInput) {
      jumpInput.value = current;
      jumpInput.setAttribute('data-total-pages', total);
    }

    container.style.display = '';

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-first" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-prev" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';

    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);

    if (start > 1) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }

    if (end < total) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-next" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-last" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';

    ul.innerHTML = html;
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá kế hoạch này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        confirmButtonColor: '#d33',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) {
          deleteItem(id);
        }
      });
    } else {
      if (confirm('Xác nhận xoá kế hoạch này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success('Xoá thành công');
          loadList();
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  // ==========================================================================
  // FORM (create / edit)
  // ==========================================================================
  function initForm(context) {
    function esc(str) {
      if (!str) return '';
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function showLoading(show) {
      $('#form-loading').toggle(show);
      $('#save-btn').prop('disabled', show);
    }

    // Populate status select
    var $statusSelect = $('#trang_thai_van_chuyen-input');
    $.each(statuses, function (i, s) {
      $statusSelect.append('<option value="' + s + '">' + s + '</option>');
    });

    function loadDropdowns() {
      $.getJSON('/api/khach-hang?limit=500')
        .done(function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            $.each(res.data.items, function (i, item) {
              $('#nid_khach_hang-input').append('<option value="' + item.nid + '">' + esc(item.ten) + '</option>');
            });
          }
        });
      $.getJSON('/api/lai-xe?limit=500')
        .done(function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            $.each(res.data.items, function (i, item) {
              $('#nid_lai_xe-input').append('<option value="' + item.nid + '">' + esc(item.ten) + '</option>');
            });
          }
        });
      $.getJSON('/api/phuong-tien?limit=500')
        .done(function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            $.each(res.data.items, function (i, item) {
              $('#nid_phuong_tien-input').append('<option value="' + item.nid + '">' + esc(item.bks || '#' + item.nid) + '</option>');
            });
          }
        });
    }

    function initDatepickers() {
      if (typeof flatpickr !== 'undefined') {
        $('.flatpickr-date').each(function () {
          if (this._flatpickr) this._flatpickr.destroy();
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, static: true });
        });
        $('.flatpickr-datetime').each(function () {
          if (this._flatpickr) this._flatpickr.destroy();
          flatpickr(this, { enableTime: true, dateFormat: 'd/m/Y H:i', time_24hr: true, allowInput: true, static: true });
        });
      }
    }

    function dateToApi(val) {
      if (!val) return '';
      var parts = val.split('/');
      if (parts.length === 3) return parts[2] + '-' + parts[1] + '-' + parts[0];
      return val;
    }

    function datetimeToApi(val) {
      if (!val) return '';
      var parts = val.split(' ');
      if (parts.length === 2) {
        var d = parts[0].split('/');
        if (d.length === 3) return d[2] + '-' + d[1] + '-' + d[0] + ' ' + parts[1];
      }
      return val;
    }

    function apiToDate(val) {
      if (!val) return '';
      var parts = val.split('-');
      if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
      return val;
    }

    function apiToDatetime(val) {
      if (!val) return '';
      var parts = val.split(' ');
      if (parts.length === 2) {
        var d = parts[0].split('-');
        if (d.length === 3) return d[2] + '/' + d[1] + '/' + d[0] + ' ' + parts[1];
      }
      return val;
    }

    function populateForm(row) {
      $('#nid-input').val(row.nid || '');
      $('#ngay-input').val(apiToDate(row.ngay));
      $('#nid_khach_hang-input').val(row.nid_khach_hang || 0);
      $('#nid_lai_xe-input').val(row.nid_lai_xe || 0);
      $('#so_bkg-input').val(row.so_bkg || '');
      $('#dia_chi_kho-input').val(row.dia_chi_kho || '');
      $('#loai_cont-input').val(row.loai_cont || '');
      $('#so_cont-input').val(row.so_cont || '');
      $('#nid_phuong_tien-input').val(row.nid_phuong_tien || 0);
      $('#so_seal_chinh-input').val(row.so_seal_chinh || '');
      $('#so_seal_tam-input').val(row.so_seal_tam || '');
      $('#trang_thai_van_chuyen-input').val(row.trang_thai_van_chuyen || 'Chưa xếp xe');
      $('#bai_lay_cont-input').val(row.bai_lay_cont || '');
      $('#bai_ha_cont-input').val(row.bai_ha_cont || '');
      $('#cang_xuat-input').val(row.cang_xuat || '');
      $('#cut_off-input').val(apiToDatetime(row.cut_off));
    }

    function gatherForm() {
      return {
        ngay: dateToApi($('#ngay-input').val()),
        nid_khach_hang: parseInt($('#nid_khach_hang-input').val()) || 0,
        nid_lai_xe: parseInt($('#nid_lai_xe-input').val()) || 0,
        so_bkg: $('#so_bkg-input').val().trim(),
        dia_chi_kho: $('#dia_chi_kho-input').val().trim(),
        loai_cont: $('#loai_cont-input').val().trim(),
        so_cont: $('#so_cont-input').val().trim(),
        nid_phuong_tien: parseInt($('#nid_phuong_tien-input').val()) || 0,
        so_seal_chinh: $('#so_seal_chinh-input').val().trim(),
        so_seal_tam: $('#so_seal_tam-input').val().trim(),
        trang_thai_van_chuyen: $('#trang_thai_van_chuyen-input').val(),
        bai_lay_cont: $('#bai_lay_cont-input').val().trim(),
        bai_ha_cont: $('#bai_ha_cont-input').val().trim(),
        cang_xuat: $('#cang_xuat-input').val().trim(),
        cut_off: datetimeToApi($('#cut_off-input').val()),
      };
    }

    // Init
    loadDropdowns();

    var isEdit = mode === 'edit' && data;
    if (isEdit) {
      $('.card-header .d-flex.align-items-center.gap-2').prepend(
        '<a href="/ke-hoach-xep-xe" class="btn btn-outline-secondary btn-sm waves-effect"><i class="icon-base ti tabler-arrow-left me-1"></i> Quay lại</a>'
      );
      $('.text-end').prepend(
        '<a href="/ke-hoach-xep-xe" class="btn btn-outline-secondary waves-effect me-1">Huỷ</a>'
      );
      $('#form-title').text('Sửa kế hoạch xếp xe');
      $('#form-mode-badge').show();
      $('#nid-input').val(data.nid);

      var popInterval = setInterval(function () {
        var kh = $('#nid_khach_hang-input option[value="' + data.nid_khach_hang + '"]').length;
        var lx = $('#nid_lai_xe-input option[value="' + data.nid_lai_xe + '"]').length;
        var pt = $('#nid_phuong_tien-input option[value="' + data.nid_phuong_tien + '"]').length;
        if (kh > 0 && lx > 0 && pt > 0) {
          clearInterval(popInterval);
          populateForm(data);
          initDatepickers();
          showLoading(false);
        }
      }, 200);

      setTimeout(function () {
        clearInterval(popInterval);
        populateForm(data);
        initDatepickers();
        showLoading(false);
      }, 10000);
    } else {
      showLoading(false);
      setTimeout(initDatepickers, 50);
    }

    // Submit on Enter
    $('#ke-hoach-form').on('keydown', function (e) {
      if (e.which === 13 && !$(e.target).is('textarea')) {
        e.preventDefault();
        $('#save-btn').trigger('click');
      }
    });

    // Submit
    $('#save-btn').on('click', function () {
      if (!$('#ngay-input').val()) {
        if (notyf) notyf.error('Vui lòng nhập ngày');
        return;
      }

      var payload = gatherForm();
      var nid = $('#nid-input').val();
      var url = '/api/ke-hoach-xep-xe/' + (nid ? nid : '');
      var method = nid ? 'PUT' : 'POST';

      showLoading(true);

      $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (res.status === 'success') {
            if (notyf) notyf.success(nid ? 'Đã cập nhật kế hoạch' : 'Đã tạo kế hoạch');
            if (nid) {
              showLoading(false);
            } else {
              $('#ke-hoach-form')[0].reset();
              showLoading(false);
              initDatepickers();
            }
          } else {
            showLoading(false);
            if (notyf) notyf.error(res.message || 'Lưu thất bại');
          }
        },
        error: function (jqXHR) {
          showLoading(false);
          if (notyf) notyf.error(apiMsg(jqXHR));
        }
      });
    });

    if (isEdit) {
      showLoading(true);
    }
  }

  // ==========================================================================
  // DETAIL
  // ==========================================================================
  function initDetail(context) {
    if (!data) return;

    var khName = settings.khach_hang_name || '';
    var lxName = settings.lai_xe_name || '';
    var ptName = settings.phuong_tien_name || '';

    var rows = [
      { label: 'Ngày', value: apiToDate(data.ngay) },
      { label: 'Khách hàng', value: khName },
      { label: 'Lái xe', value: lxName },
      { label: 'Số BKG', value: data.so_bkg },
      { label: 'Địa chỉ kho', value: data.dia_chi_kho },
      { label: 'Loại cont', value: data.loai_cont },
      { label: 'Số cont', value: data.so_cont },
      { label: 'Phương tiện', value: ptName },
      { label: 'Số seal chính', value: data.so_seal_chinh },
      { label: 'Số seal tạm', value: data.so_seal_tam },
      { label: 'Trạng thái', value: data.trang_thai_van_chuyen },
      { label: 'Bãi lấy cont', value: data.bai_lay_cont },
      { label: 'Bãi hạ cont', value: data.bai_ha_cont },
      { label: 'Cảng xuất', value: data.cang_xuat },
      { label: 'Cut-off', value: apiToDatetime(data.cut_off) },
    ];

    var html = '';
    $.each(rows, function (i, r) {
      html += '<tr><th class="text-nowrap" style="width:180px;">' + r.label + '</th><td>' + escHtml(r.value || '') + '</td></tr>';
    });
    $('#detail-body').html(html);

    if (data.nid) {
      $('#edit-btn').attr('href', '/ke-hoach-xep-xe/' + data.nid + '/sua');
    }
  }

  // Reusable conversion utils (used by detail too)
  function apiToDate(val) {
    if (!val) return '';
    var parts = val.split('-');
    if (parts.length === 3) return parts[2] + '/' + parts[1] + '/' + parts[0];
    return val;
  }

  function apiToDatetime(val) {
    if (!val) return '';
    var parts = val.split(' ');
    if (parts.length === 2) {
      var d = parts[0].split('-');
      if (d.length === 3) return d[2] + '/' + d[1] + '/' + d[0] + ' ' + parts[1];
    }
    return val;
  }

})(jQuery, Drupal);
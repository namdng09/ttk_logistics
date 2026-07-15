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

  function getNidFromUrl() {
    var parts = window.location.pathname.split('/');
    if (parts.length >= 3 && parts[1] === 'ke-hoach-xep-xe') {
      return parseInt(parts[2]) || 0;
    }
    return 0;
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
          if (t.classList.contains('btn-view-ke-hoach-xep-xe')) {
            e.preventDefault();
            window.location.href = '/ke-hoach-xep-xe/' + t.getAttribute('data-id');
            return;
          }
          if (t.classList.contains('btn-edit-ke-hoach-xep-xe')) {
            e.preventDefault();
            window.location.href = '/ke-hoach-xep-xe/' + t.getAttribute('data-id') + '/sua';
            return;
          }
          if (t.classList.contains('btn-delete-ke-hoach-xep-xe')) {
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
      '<tr id="loading-row"><td colspan="17" class="text-center py-4">' +
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
          tbody.innerHTML = '<tr><td colspan="17" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi không xác định') + '</td></tr>';
          return;
        }

        var resp = res.data;
        var items = resp.items || [];
        var pageSize = resp.limit || 20;

        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="17" class="text-center py-4">Không có dữ liệu</td></tr>';
          renderPagination(resp);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var row = items[i];
          var stt = (resp.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(row.nid);
          var khName = (row.khach_hang && row.khach_hang.ten) || '';
          var lxName = (row.lai_xe && row.lai_xe.ten) || '';
          var ptBks = (row.phuong_tien && row.phuong_tien.bks) || '';
          html += '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + (row.created ? row.created.substring(0, 16) : '') + '</td>' +
            '<td>' + escHtml(khName) + '</td>' +
            '<td>' + escHtml(row.so_bkg || '') + '</td>' +
            '<td>' + escHtml(row.dia_chi_kho || '') + '</td>' +
            '<td>' + escHtml(row.loai_cont || '') + '</td>' +
            '<td>' + escHtml(row.so_cont || '') + '</td>' +
            '<td>' + escHtml(lxName) + '</td>' +
            '<td>' + escHtml(ptBks) + '</td>' +
            '<td>' + escHtml(row.so_seal_chinh || '') + '</td>' +
            '<td>' + escHtml(row.so_seal_tam || '') + '</td>' +
            '<td>' + escHtml(row.bai_lay_cont || '') + '</td>' +
            '<td>' + escHtml(row.bai_ha_cont || '') + '</td>' +
            '<td>' + escHtml(row.cut_off || '') + '</td>' +
            '<td>' + escHtml(row.cang_xuat || '') + '</td>' +
            '<td><span class="badge bg-label-info">' + escHtml(row.trang_thai_van_chuyen || '') + '</span></td>' +
            '</tr>';
        }
        tbody.innerHTML = html;
        renderPagination(resp);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.innerHTML = '<tr><td colspan="17" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>';
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><button type="button" class="dropdown-item btn-view-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>' +
      '<li><button type="button" class="dropdown-item btn-edit-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><button type="button" class="dropdown-item text-danger btn-delete-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>' +
      '</ul></div>';
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
      $statusSelect.append('<option value="' + esc(s) + '">' + esc(s) + '</option>');
    });

    var LOAI_CONT_LIST = ['40RF', '20RF', '40HC', '20HC', '40OT', '20OT', '45HC', '45RF'];

    // --- Select2 helpers ---
    function _jq() {
      return (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ :
             (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function') ? jQuery : null;
    }

    function initSelect2(el, placeholder) {
      var jq = _jq();
      if (!jq) return;
      var $el = jq(el);
      if ($el.data('select2')) $el.select2('destroy');
      $el.select2({
        placeholder: placeholder || '— Chọn —',
        allowClear: true,
        width: '100%'
      });
    }

    function initLoaiContSelect() {
      var sel = document.getElementById('loai_cont-input');
      if (!sel) return;
      sel.innerHTML = '<option value="">Chọn/Nhập loại cont</option>';
      for (var i = 0; i < LOAI_CONT_LIST.length; i++) {
        sel.appendChild(new Option(LOAI_CONT_LIST[i], LOAI_CONT_LIST[i]));
      }
      var jq = _jq();
      if (!jq) return;
      var $sel = jq('#loai_cont-input');
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        placeholder: 'Chọn/Nhập loại cont',
        allowClear: true,
        tags: true,
        width: '100%'
      });
    }

    // --- Load dropdowns with Select2 ---
    var dropdownReady = { kh: false, lx: false, pt: false };
    var rowData = null;
    var dataReady = false;

    function checkReady() {
      if (dropdownReady.kh && dropdownReady.lx && dropdownReady.pt) {
        initSelect2(document.getElementById('nid_khach_hang-input'), '— Chọn khách hàng —');
        initSelect2(document.getElementById('nid_lai_xe-input'), '— Chọn lái xe —');
        initSelect2(document.getElementById('nid_phuong_tien-input'), '— Chọn phương tiện —');
        if (dataReady) {
          populateForm(rowData);
          initDatepickers();
          showLoading(false);
        }
      }
    }

    function populateSelect(selId, items, textKey) {
      var sel = document.getElementById(selId);
      if (!sel) return;
      for (var i = 0; i < items.length; i++) {
        var label = textKey === 'bks'
          ? (items[i].bks || '#' + items[i].nid)
          : (items[i][textKey] || '#' + items[i].nid);
        sel.appendChild(new Option(label, items[i].nid));
      }
    }

    function loadRowData(nid) {
      $.ajax({
        url: '/api/ke-hoach-xep-xe/' + nid,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
          if (res.status === 'success' && res.data) {
            rowData = res.data;
            dataReady = true;
            checkReady();
          }
        },
        error: function (jqXHR) {
          if (notyf) notyf.error(apiMsg(jqXHR));
          showLoading(false);
        }
      });
    }

    function loadDropdownData() {
      var pending = 3;
      function done(readyKey) {
        dropdownReady[readyKey] = true;
        checkReady();
      }
      function loadOne(url, selId, textKey, readyKey) {
        $.ajax({
          url: url,
          type: 'GET',
          dataType: 'json',
          data: { limit: 500 },
          success: function (res) {
            if (res.status === 'success' && res.data && res.data.items) {
              populateSelect(selId, res.data.items, textKey);
            }
          },
          error: function (jqXHR) {
            console.error('API error (' + url + '):', jqXHR.status, jqXHR.responseText);
          },
          complete: function () {
            done(readyKey);
          }
        });
      }
      loadOne('/api/khach-hang', 'nid_khach_hang-input', 'ten', 'kh');
      loadOne('/api/lai-xe', 'nid_lai_xe-input', 'ten', 'lx');
      loadOne('/api/phuong-tien', 'nid_phuong_tien-input', 'bks', 'pt');
    }

    // --- Date/time helpers ---
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

    function datetimeToApi(val) {
      if (!val) return '';
      var parts = val.split(' ');
      if (parts.length === 2) {
        var d = parts[0].split('/');
        if (d.length === 3) return d[2] + '-' + d[1] + '-' + d[0] + ' ' + parts[1];
      }
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

    // --- Form populate / gather ---
    function populateForm(row) {
      $('#nid-input').val(row.nid || '');
      $('#nid_khach_hang-input').val((row.khach_hang && row.khach_hang.nid) || 0).trigger('change');
      $('#nid_lai_xe-input').val((row.lai_xe && row.lai_xe.nid) || 0).trigger('change');
      $('#so_bkg-input').val(row.so_bkg || '');
      $('#dia_chi_kho-input').val(row.dia_chi_kho || '');
      $('#loai_cont-input').val(row.loai_cont || '').trigger('change');
      $('#so_cont-input').val(row.so_cont || '');
      $('#nid_phuong_tien-input').val((row.phuong_tien && row.phuong_tien.nid) || 0).trigger('change');
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

    // --- Paste button ---
    var pasteBtn = document.getElementById('paste-bkg-btn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', function () {
        var input = document.getElementById('so_bkg-input');
        if (navigator.clipboard && navigator.clipboard.readText) {
          navigator.clipboard.readText().then(function (text) {
            if (text) input.value = text;
          }).catch(function () {
            var val = prompt('Dán nội dung từ clipboard:');
            if (val) input.value = val;
          });
        } else {
          var val = prompt('Dán nội dung từ clipboard:');
          if (val) input.value = val;
        }
      });
    }

    // --- Init ---
    loadDropdownData();
    initLoaiContSelect();

    var editNid = getNidFromUrl();
    if (editNid) {
      $('#nid-input').val(editNid);
      showLoading(true);
      loadRowData(editNid);
    } else {
      showLoading(false);
      setTimeout(initDatepickers, 100);
    }

    // --- Validation helper (manual, not relying on was-validated + :valid/:invalid) ---
    function isValidForm() {
      var ok = true;

      function resetValidation(el) {
        el.classList.remove('is-invalid');
        var c = el.nextElementSibling;
        if (c && c.classList.contains('select2-container')) c.classList.remove('is-invalid');
      }

      function markInvalid(el) {
        ok = false;
        el.classList.add('is-invalid');
        var c = el.nextElementSibling;
        if (c && c.classList.contains('select2-container')) c.classList.add('is-invalid');
      }

      function getFeedback(el) {
        var parent = el.closest('.col-md-4') || el.parentElement;
        return parent.querySelector('.invalid-feedback');
      }

      // Reset
      var requiredFields = ['nid_khach_hang-input', 'nid_lai_xe-input', 'so_bkg-input', 'nid_phuong_tien-input'];
      for (var ri = 0; ri < requiredFields.length; ri++) {
        var el = document.getElementById(requiredFields[ri]);
        if (!el) continue;
        resetValidation(el);
        var fb = getFeedback(el);
        if (fb) fb.style.display = '';
      }

      // Check
      for (var ri = 0; ri < requiredFields.length; ri++) {
        var el = document.getElementById(requiredFields[ri]);
        if (!el) continue;
        var val = el.value;
        if (!val || val === '0') {
          markInvalid(el);
          var fb = getFeedback(el);
          if (fb) fb.style.display = 'block';
        }
      }

      return ok;
    }

    // --- Submit on Enter ---
    $('#ke-hoach-form').on('keydown', function (e) {
      if (e.which === 13 && !$(e.target).is('textarea')) {
        e.preventDefault();
        $('#save-btn').trigger('click');
      }
    });

    // --- Submit ---
    $('#save-btn').on('click', function () {
      if (!isValidForm()) return;

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
              $('#nid_khach_hang-input').val(0).trigger('change');
              $('#nid_lai_xe-input').val(0).trigger('change');
              $('#nid_phuong_tien-input').val(0).trigger('change');
              $('#loai_cont-input').val('').trigger('change');
              $('#trang_thai_van_chuyen-input').val('Chưa xếp xe');
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
  }

  // ==========================================================================
  // DETAIL
  // ==========================================================================
  function initDetail(context) {
    var nid = getNidFromUrl();
    if (!nid) {
      $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">ID không hợp lệ</td></tr>');
      return;
    }

    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + nid,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi tải dữ liệu') + '</td></tr>');
          return;
        }
        var d = res.data;
        var khName = (d.khach_hang && d.khach_hang.ten) || '';
        var lxName = (d.lai_xe && d.lai_xe.ten) || '';
        var ptName = (d.phuong_tien && d.phuong_tien.bks) || '';
        var rows = [
          { label: 'Ngày lập KH', value: d.created ? d.created.substring(0, 16) : '' },
          { label: 'Khách hàng', value: khName },
          { label: 'Lái xe', value: lxName },
          { label: 'Số BKG', value: d.so_bkg },
          { label: 'Địa chỉ kho', value: d.dia_chi_kho },
          { label: 'Loại cont', value: d.loai_cont },
          { label: 'Số cont', value: d.so_cont },
          { label: 'Phương tiện', value: ptName },
          { label: 'Số seal chính', value: d.so_seal_chinh },
          { label: 'Số seal tạm', value: d.so_seal_tam },
          { label: 'Trạng thái', value: d.trang_thai_van_chuyen },
          { label: 'Bãi lấy cont', value: d.bai_lay_cont },
          { label: 'Bãi hạ cont', value: d.bai_ha_cont },
          { label: 'Cảng xuất', value: d.cang_xuat },
          { label: 'Cut-off', value: apiToDatetime(d.cut_off) },
        ];
        var html = '';
        $.each(rows, function (i, r) {
          html += '<tr><th class="text-nowrap" style="width:180px;">' + r.label + '</th><td>' + escHtml(r.value || '') + '</td></tr>';
        });
        $('#detail-body').html(html);
        if (d.nid) {
          $('#edit-btn').attr('href', '/ke-hoach-xep-xe/' + d.nid + '/sua');
        }
      },
      error: function (jqXHR) {
        $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>');
      }
    });
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

})(jQuery, Drupal);
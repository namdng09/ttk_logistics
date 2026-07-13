(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var KHACH_HANG_OPTIONS = [];
  var KHACH_HANG_DATA = {};

  function modalShow(id) {
    var el = document.getElementById(id);
    if (el) new bootstrap.Modal(el).show();
  }
  function modalHide(id) {
    var el = document.getElementById(id);
    if (el) {
      var m = bootstrap.Modal.getInstance(el);
      if (m) m.hide();
    }
  }

  Drupal.behaviors.hopDong = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-hop-dong', context).length) {
        loadKhachHangSelect();
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;

    doc.getElementById('btn-search-hop-dong').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-hop-dong').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-hop-dong').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    doc.getElementById('form-hop-dong').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-hop-dong');
        if (btn && !btn.disabled) btn.click();
      }
    });

    var reloadBtn = doc.querySelector('.btn-reload-hop-dong');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        doc.getElementById('search-hop-dong').value = '';
        currentPage = 1;
        loadList();
      });
    }

    var themBtn = doc.querySelector('.btn-them-hop-dong');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    var luuBtn = doc.querySelector('.btn-luu-hop-dong');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    var modal = doc.getElementById('hop-dong-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initDatePickers();
      initSelect2();
    });

    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-hop-dong')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-hop-dong')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-hop-dong')) {
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

    // Select2 change -> show NV KD
    var selKh = doc.getElementById('select-khach-hang');
    if (selKh) {
      selKh.addEventListener('change', function () {
        showNvKinhDoanh(this.value);
      });
    }

    // Dropdown hover
    doc.addEventListener('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-hop-dong-tbody')) {
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
      if (dropdown && dropdown.closest('#table-hop-dong-tbody')) {
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

    doc.getElementById('pagination-jump').addEventListener('keypress', function (e) {
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

  function showNvKinhDoanh(khNid) {
    var section = document.getElementById('nv-kinh-doanh-section');
    var display = document.getElementById('nv-kinh-doanh-display');
    if (!khNid || !KHACH_HANG_DATA[khNid]) {
      section.style.display = 'none';
      display.innerHTML = '';
      return;
    }
    var kh = KHACH_HANG_DATA[khNid];
    var nv = kh.nv_kinh_doanh;
    if (!nv) {
      section.style.display = 'none';
      display.innerHTML = '';
      return;
    }
    var text = nv.ten || '';
    if (nv.ma_nhan_vien) text += ' - ' + nv.ma_nhan_vien;
    display.innerHTML = escapeHtml(text);
    section.style.display = '';
  }

  function loadKhachHangSelect() {
    $.ajax({
      url: '/api/khach-hang',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data) {
          var items = res.data.items || [];
          var select = document.getElementById('select-khach-hang');
          select.innerHTML = '<option value="">Chọn khách hàng</option>';
          var opts = [];
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var label = item.ten || '';
            if (item.ma_kh) label += ' (' + item.ma_kh + ')';
            opts.push({ id: item.nid, text: label });
            KHACH_HANG_DATA[item.nid] = item;
          }
          KHACH_HANG_OPTIONS = opts;
          for (var j = 0; j < opts.length; j++) {
            var opt = document.createElement('option');
            opt.value = opts[j].id;
            opt.textContent = opts[j].text;
            select.appendChild(opt);
          }
          initSelect2();
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function initSelect2() {
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    var $sel = $jq ? $jq('#select-khach-hang') : null;
    if ($sel && $sel.length) {
      if ($sel.data('select2')) {
        $sel.select2('destroy');
      }
      $sel.select2({
        dropdownParent: $jq('#hop-dong-modal'),
        placeholder: 'Chọn khách hàng',
        allowClear: true,
        width: '100%'
      });
    }
  }

  function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
      $('.flatpickr-date').each(function () {
        try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
        if (!this.hasAttribute('readonly') && !this.hasAttribute('disabled')) {
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, static: true });
        }
      });
    }
  }

  function loadList() {
    var tbody = $('#table-hop-dong-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="8" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    $.ajax({
      url: '/api/hop-dong',
      type: 'GET',
      dataType: 'json',
      data: { page: currentPage, keyword: currentKeyword },
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="8" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="8" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.nid);
          var khName = '';
          if (item.khach_hang) {
            khName = item.khach_hang.ten || '';
            if (item.khach_hang.ma_kh) khName += ' (' + item.khach_hang.ma_kh + ')';
          }
          var nvKdHtml = '';
          if (item.khach_hang && item.khach_hang.nv_kinh_doanh) {
            var nv = item.khach_hang.nv_kinh_doanh;
            var nvText = nv.ten || '';
            if (nv.ma_nhan_vien) nvText += ' - ' + nv.ma_nhan_vien;
            nvKdHtml = escapeHtml(nvText);
          }
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + escapeHtml(item.so_hop_dong || '') + '</td>' +
            '<td>' + (item.ngay_hop_dong || '') + '</td>' +
            '<td>' + (item.han_hop_dong || '') + '</td>' +
            '<td>' + escapeHtml(khName) + '</td>' +
            '<td>' + nvKdHtml + '</td>' +
            '<td>' + escapeHtml(item.ghi_chu || '') + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="8" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    var perms = Drupal.settings.hop_dong && Drupal.settings.hop_dong.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.hop_dong_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-hop-dong" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.hop_dong_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-hop-dong" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.hop_dong_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-hop-dong" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-hop-dong');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var total = data.total_pages || 0;
    var current = data.current_page || 0;
    var totalItems = data.total || 0;

    document.getElementById('pagination-info').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('pagination-total-pages').textContent = '/ ' + total;

    var jumpInput = document.getElementById('pagination-jump');
    jumpInput.value = current;
    jumpInput.setAttribute('data-total-pages', total);

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

  function showLoading(show) {
    var loading = document.getElementById('modal-loading');
    loading.style.display = show ? '' : 'none';
  }

  function openViewModal(id) {
    setFormMode('view');
    document.getElementById('hop-dong-modal-title').textContent = 'Chi tiết hợp đồng';
    document.querySelector('.btn-luu-hop-dong').style.display = 'none';
    showLoading(true);
    modalShow('hop-dong-modal');

    $.ajax({
      url: '/api/hop-dong/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        initDatePickers();
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('hop-dong-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('hop-dong-modal-title').textContent = 'Cập nhật hợp đồng';
    document.querySelector('#form-hop-dong input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-hop-dong');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('hop-dong-modal');

    $.ajax({
      url: '/api/hop-dong/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('hop-dong-modal');
          return;
        }
        initDatePickers();
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('hop-dong-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    var inputs = document.querySelectorAll('#form-hop-dong input, #form-hop-dong select');
    var btn = document.querySelector('.btn-luu-hop-dong');
    for (var i = 0; i < inputs.length; i++) {
      if (mode === 'view') {
        inputs[i].setAttribute('readonly', 'readonly');
        inputs[i].setAttribute('disabled', 'disabled');
        btn.style.display = 'none';
      } else {
        inputs[i].removeAttribute('readonly');
        inputs[i].removeAttribute('disabled');
        btn.style.display = '';
      }
    }
    var sel = document.querySelector('#select-khach-hang');
    if (sel) {
      if (mode === 'view') {
        sel.setAttribute('disabled', 'disabled');
      } else {
        sel.removeAttribute('disabled');
      }
    }
  }

  function resetForm() {
    showLoading(false);
    document.getElementById('form-hop-dong').reset();
    document.querySelector('#form-hop-dong input[name="nid"]').value = '';
    document.getElementById('hop-dong-modal-title').textContent = 'Thêm hợp đồng';
    var sel = document.querySelector('#select-khach-hang');
    if (sel) {
      sel.value = '';
    }
    document.getElementById('nv-kinh-doanh-section').style.display = 'none';
    document.getElementById('nv-kinh-doanh-display').innerHTML = '';
    setFormMode('create');
  }

  function populateForm(d) {
    document.querySelector('#form-hop-dong input[name="nid"]').value = d.nid || '';
    document.querySelector('#form-hop-dong input[name="so_hop_dong"]').value = d.so_hop_dong || '';
    document.querySelector('#form-hop-dong input[name="ngay_hop_dong"]').value = d.ngay_hop_dong || '';
    document.querySelector('#form-hop-dong input[name="han_hop_dong"]').value = d.han_hop_dong || '';
    document.querySelector('#form-hop-dong input[name="ghi_chu"]').value = d.ghi_chu || '';

    if (d.khach_hang && d.khach_hang.nid) {
      var sel = document.querySelector('#select-khach-hang');
      if (sel) {
        sel.value = d.khach_hang.nid;
      }
      showNvKinhDoanh(d.khach_hang.nid);
    }

    initDatePickers();
  }

  function submitForm() {
    var form = document.getElementById('form-hop-dong');

    // Validate khach hang required
    var khSelect = document.querySelector('#select-khach-hang');
    var khNid = khSelect ? khSelect.value : '';
    if (!khNid) {
      form.classList.add('was-validated');
      if (notyf) notyf.error('Vui lòng chọn khách hàng');
      return;
    }

    // Validate han_hop_dong >= ngay_hop_dong
    var ngayStr = document.querySelector('#form-hop-dong input[name="ngay_hop_dong"]').value;
    var hanStr = document.querySelector('#form-hop-dong input[name="han_hop_dong"]').value;
    if (ngayStr && hanStr) {
      var parseDate = function (s) {
        var parts = s.split('/');
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      };
      var ngay = parseDate(ngayStr);
      var han = parseDate(hanStr);
      if (han < ngay) {
        if (notyf) notyf.error('Hạn hợp đồng không được trước ngày hợp đồng');
        return;
      }
    }

    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var nid = document.querySelector('#form-hop-dong input[name="nid"]').value;

    var apiData = {
      so_hop_dong: document.querySelector('#form-hop-dong input[name="so_hop_dong"]').value,
      ngay_hop_dong: document.querySelector('#form-hop-dong input[name="ngay_hop_dong"]').value,
      han_hop_dong: document.querySelector('#form-hop-dong input[name="han_hop_dong"]').value,
      khach_hang: parseInt(document.querySelector('#select-khach-hang').value) || null,
      ghi_chu: document.querySelector('#form-hop-dong input[name="ghi_chu"]').value
    };

    var url = nid ? '/api/hop-dong/' + nid : '/api/hop-dong';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-hop-dong');
    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';

    $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      data: JSON.stringify(apiData),
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status === 'success') {
          if (notyf) notyf.success(nid ? 'Cập nhật thành công' : 'Tạo mới thành công');
          modalHide('hop-dong-modal');
          resetForm();
          loadList();
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function (jqXHR) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá hợp đồng này?',
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
      if (confirm('Xác nhận xoá hợp đồng này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/hop-dong/' + id,
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

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r && r.message || 'Lỗi kết nối server';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

})(jQuery, Drupal);

(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';

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

  Drupal.behaviors.laiXe = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-lai-xe', context).length) {
        loadList();
        bindNativeEvents();
      }
    }
  };

  function bindNativeEvents() {
    var doc = document;

    // Search
    doc.getElementById('btn-search-lai-xe').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-lai-xe').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-lai-xe').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-lai-xe');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        doc.getElementById('search-lai-xe').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-lai-xe');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-lai-xe');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('lai-xe-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initDatePickers();
      initMasks();
    });

    // Delegated clicks (dropdown items, pagination)
    doc.addEventListener('click', function (e) {
      var t = e.target;
      // Walk up to find the actual button
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-lai-xe')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-lai-xe')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-lai-xe')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          // Pagination jump
          if (t.id === 'pagination-jump' && e.type === 'keypress' && e.which === 13) {
            var page = parseInt(t.value);
            var total = parseInt(t.getAttribute('data-total-pages'));
            if (page > 0 && page <= total) {
              currentPage = page;
              loadList();
            }
            return;
          }
          // Pagination links
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

    // Pagination jump keypress (separate listener to avoid conflict)
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

  function submitForm() {
    var form = document.getElementById('form-lai-xe');
    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var inputs = form.querySelectorAll('input');
    var data = {};
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.name) data[inp.name] = inp.value;
    }

    var nid = data.nid;
    var url = nid ? '/api/lai-xe/' + nid : '/api/lai-xe';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-lai-xe');
    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';

    $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status === 'success') {
          if (notyf) notyf.success(nid ? 'Cập nhật thành công' : 'Tạo mới thành công');
          modalHide('lai-xe-modal');
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

  function loadList() {
    var tbody = $('#table-lai-xe-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="15" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    $.ajax({
      url: '/api/lai-xe',
      type: 'GET',
      dataType: 'json',
      data: { page: currentPage, keyword: currentKeyword },
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="15" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="15" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.nid);
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + escapeHtml(item.ten || '') + '</td>' +
            '<td>' + escapeHtml(item.ma_nhan_vien || '') + '</td>' +
            '<td>' + escapeHtml(item.sdt || '') + '</td>' +
            '<td>' + escapeHtml(item.cccd || '') + '</td>' +
            '<td>' + (item.ngay_cap || '') + '</td>' +
            '<td>' + escapeHtml(item.noi_cap || '') + '</td>' +
            '<td>' + (item.han_cccd || '') + '</td>' +
            '<td>' + escapeHtml(item.so_bang_lai || '') + '</td>' +
            '<td>' + escapeHtml(item.loai_bang_lai || '') + '</td>' +
            '<td>' + (item.han_bang_lai || '') + '</td>' +
            '<td>' + (item.ngay_nhan_viec || '') + '</td>' +
            '<td>' + escapeHtml(item.so_tk_ngan_hang || '') + '</td>' +
            '<td>' + escapeHtml(item.ngan_hang || '') + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="15" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    var perms = Drupal.settings.lai_xe && Drupal.settings.lai_xe.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.lai_xe_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-lai-xe" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.lai_xe_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-lai-xe" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.lai_xe_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-lai-xe" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill" data-bs-toggle="dropdown">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-lai-xe');
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

    if (!total || total <= 1) {
      container.style.display = 'none';
      return;
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

  function openViewModal(id) {
    setFormMode('view');
    document.getElementById('lai-xe-modal-title').textContent = 'Chi tiết lái xe';
    var btn = document.querySelector('.btn-luu-lai-xe');
    btn.style.display = 'none';

    $.ajax({
      url: '/api/lai-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        populateForm(res.data);
        modalShow('lai-xe-modal');
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('lai-xe-modal-title').textContent = 'Cập nhật lái xe';
    document.querySelector('#form-lai-xe input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-lai-xe');
    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang tải...';

    $.ajax({
      url: '/api/lai-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('lai-xe-modal');
          return;
        }
        populateForm(res.data);
        modalShow('lai-xe-modal');
      },
      error: function (jqXHR) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (notyf) notyf.error(apiMsg(jqXHR));
        modalHide('lai-xe-modal');
      }
    });
  }

  function setFormMode(mode) {
    var inputs = document.querySelectorAll('#form-lai-xe input, #form-lai-xe textarea, #form-lai-xe select');
    var btn = document.querySelector('.btn-luu-lai-xe');
    for (var i = 0; i < inputs.length; i++) {
      if (mode === 'view') {
        inputs[i].setAttribute('readonly', 'readonly');
        btn.style.display = 'none';
      } else {
        inputs[i].removeAttribute('readonly');
        btn.style.display = '';
      }
    }
  }

  function resetForm() {
    document.getElementById('form-lai-xe').reset();
    document.querySelector('#form-lai-xe input[name="nid"]').value = '';
    document.getElementById('lai-xe-modal-title').textContent = 'Thêm lái xe';
    setFormMode('create');
  }

  function populateForm(d) {
    document.querySelector('#form-lai-xe input[name="ten"]').value = d.ten || '';
    document.querySelector('#form-lai-xe input[name="ma_nhan_vien"]').value = d.ma_nhan_vien || '';
    document.querySelector('#form-lai-xe input[name="sdt"]').value = d.sdt || '';
    document.querySelector('#form-lai-xe input[name="cccd"]').value = d.cccd || '';
    document.querySelector('#form-lai-xe input[name="ngay_cap"]').value = d.ngay_cap || '';
    document.querySelector('#form-lai-xe input[name="noi_cap"]').value = d.noi_cap || '';
    document.querySelector('#form-lai-xe input[name="han_cccd"]').value = d.han_cccd || '';
    document.querySelector('#form-lai-xe input[name="so_bang_lai"]').value = d.so_bang_lai || '';
    document.querySelector('#form-lai-xe input[name="loai_bang_lai"]').value = d.loai_bang_lai || '';
    document.querySelector('#form-lai-xe input[name="han_bang_lai"]').value = d.han_bang_lai || '';
    document.querySelector('#form-lai-xe input[name="ngay_nhan_viec"]').value = d.ngay_nhan_viec || '';
    document.querySelector('#form-lai-xe input[name="so_tk_ngan_hang"]').value = d.so_tk_ngan_hang || '';
    document.querySelector('#form-lai-xe input[name="ngan_hang"]').value = d.ngan_hang || '';
  }

  function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
      $('.flatpickr-date').each(function () {
        try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
        if (!this.hasAttribute('readonly')) {
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true });
        }
      });
    }
  }

  function initMasks() {
    if (typeof Cleave !== 'undefined') {
      $('.phone-mask').each(function () {
        if (!this._cleave) {
          this._cleave = new Cleave(this, { phone: true, phoneRegionCode: 'VN' });
        }
      });
      $('.date-mask').each(function () {
        if (!this._cleave) {
          this._cleave = new Cleave(this, { date: true, datePattern: ['d', 'm', 'Y'] });
        }
      });
    }
  }

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá lái xe này?',
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
      if (confirm('Xác nhận xoá lái xe này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/lai-xe/' + id,
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

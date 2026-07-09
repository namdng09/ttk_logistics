(function ($, Drupal) {
  'use strict';

  var notyf = new Notyf();
  var currentPage = 1;
  var currentKeyword = '';

  Drupal.behaviors.laiXe = {
    attach: function (context, settings) {
      if ($('#table-lai-xe', context).length) {
        loadList();

        $(document).on('click', '#btn-search-lai-xe', function () {
          currentKeyword = $('#search-lai-xe').val().trim();
          currentPage = 1;
          loadList();
        });

        $('#search-lai-xe').on('keypress', function (e) {
          if (e.which === 13) {
            currentKeyword = $(this).val().trim();
            currentPage = 1;
            loadList();
          }
        });

        $(document).on('click', '.btn-reload-lai-xe', function () {
          currentKeyword = '';
          $('#search-lai-xe').val('');
          currentPage = 1;
          loadList();
        });
      }
    }
  };

  function loadList() {
    var tbody = $('#table-lai-xe-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="16" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    $.ajax({
      url: '/api/lai-xe',
      method: 'GET',
      dataType: 'json',
      data: { page: currentPage, keyword: currentKeyword },
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data || !res.data.items || res.data.items.length === 0) {
          tbody.append('<tr><td colspan="16" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(res.data || {});
          return;
        }

        $.each(res.data.items, function (i, item) {
          var stt = (res.data.current_page - 1) * 20 + i + 1;
          var status = item.hoat_dong == 1
            ? '<span class="badge bg-success">Hoạt động</span>'
            : '<span class="badge bg-secondary">Ngừng</span>';

          var actions = '';
          if (Drupal.settings.lai_xe.permissions.lai_xe_view) {
            actions += '<button class="btn btn-sm btn-info me-1 btn-view-lai-xe" data-id="' + item.nid + '"><i class="ti tabler-eye"></i></button>';
          }
          if (Drupal.settings.lai_xe.permissions.lai_xe_create) {
            actions += '<button class="btn btn-sm btn-primary me-1 btn-edit-lai-xe" data-id="' + item.nid + '"><i class="ti tabler-edit"></i></button>';
          }
          if (Drupal.settings.lai_xe.permissions.lai_xe_delete) {
            actions += '<button class="btn btn-sm btn-danger btn-delete-lai-xe" data-id="' + item.nid + '"><i class="ti tabler-trash"></i></button>';
          }

          tbody.append(
            '<tr>' +
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
            '<td>' + status + '</td>' +
            '<td>' + actions + '</td>' +
            '</tr>'
          );
        });

        renderPagination(res.data);
        bindRowActions();
      },
      error: function () {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="16" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        notyf.error('Lỗi kết nối server');
      }
    });
  }

  function renderPagination(data) {
    var nav = $('#pagination-lai-xe');
    var ul = nav.find('ul.pagination');
    ul.empty();

    if (!data.total_pages || data.total_pages <= 1) {
      nav.hide();
      return;
    }

    nav.show();
    var current = data.current_page || 1;
    var total = data.total_pages;

    ul.append('<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-first" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>');
    ul.append('<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-prev" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>');

    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);

    for (var p = start; p <= end; p++) {
      ul.append('<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>');
    }

    ul.append('<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-next" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>');
    ul.append('<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-last" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>');

    ul.find('a.page-link').on('click', function (e) {
      e.preventDefault();
      var page = parseInt($(this).data('page'));
      if (page && page !== currentPage) {
        currentPage = page;
        loadList();
      }
    });
  }

  function bindRowActions() {
    // View
    $(document).off('click', '.btn-view-lai-xe').on('click', '.btn-view-lai-xe', function () {
      var id = $(this).data('id');
      viewDetail(id);
    });

    // Edit
    $(document).off('click', '.btn-edit-lai-xe').on('click', '.btn-edit-lai-xe', function () {
      var id = $(this).data('id');
      openEditModal(id);
    });

    // Delete
    $(document).off('click', '.btn-delete-lai-xe').on('click', '.btn-delete-lai-xe', function () {
      var id = $(this).data('id');
      if (confirm('Xác nhận xoá lái xe này?')) {
        deleteItem(id);
      }
    });
  }

  function viewDetail(id) {
    var body = $('#lai-xe-view-body');
    body.html('<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></div>');
    $('#lai-xe-view-modal').modal('show');

    $.ajax({
      url: '/api/lai-xe/' + id,
      method: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          body.html('<p class="text-danger text-center mb-0">' + (res.message || 'Không tìm thấy dữ liệu') + '</p>');
          return;
        }
        var d = res.data;
        body.html(
          '<div class="row g-3">' +
          '<div class="col-md-6"><strong>Họ tên:</strong> ' + escapeHtml(d.ten || '') + '</div>' +
          '<div class="col-md-6"><strong>Mã NV:</strong> ' + escapeHtml(d.ma_nhan_vien || '') + '</div>' +
          '<div class="col-md-6"><strong>SĐT:</strong> ' + escapeHtml(d.sdt || '') + '</div>' +
          '<div class="col-md-6"><strong>CCCD:</strong> ' + escapeHtml(d.cccd || '') + '</div>' +
          '<div class="col-md-6"><strong>Ngày cấp:</strong> ' + (d.ngay_cap || '') + '</div>' +
          '<div class="col-md-6"><strong>Nơi cấp:</strong> ' + escapeHtml(d.noi_cap || '') + '</div>' +
          '<div class="col-md-6"><strong>Hạn CCCD:</strong> ' + (d.han_cccd || '') + '</div>' +
          '<div class="col-md-6"><strong>Số bằng lái:</strong> ' + escapeHtml(d.so_bang_lai || '') + '</div>' +
          '<div class="col-md-6"><strong>Loại bằng:</strong> ' + escapeHtml(d.loai_bang_lai || '') + '</div>' +
          '<div class="col-md-6"><strong>Hạn bằng:</strong> ' + (d.han_bang_lai || '') + '</div>' +
          '<div class="col-md-6"><strong>Ngày nhận việc:</strong> ' + (d.ngay_nhan_viec || '') + '</div>' +
          '<div class="col-md-6"><strong>Số TK:</strong> ' + escapeHtml(d.so_tk_ngan_hang || '') + '</div>' +
          '<div class="col-md-6"><strong>Ngân hàng:</strong> ' + escapeHtml(d.ngan_hang || '') + '</div>' +
          '<div class="col-md-6"><strong>Trạng thái:</strong> ' + (d.hoat_dong == 1 ? 'Hoạt động' : 'Ngừng') + '</div>' +
          '</div>'
        );
      },
      error: function () {
        body.html('<p class="text-danger text-center mb-0">Lỗi kết nối server</p>');
      }
    });
  }

  function openEditModal(id) {
    $('#lai-xe-modal-title').text('Cập nhật lái xe');
    $('#form-lai-xe input[name="nid"]').val(id);
    $('#form-lai-xe .btn-luu-lai-xe').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang tải...');

    $.ajax({
      url: '/api/lai-xe/' + id,
      method: 'GET',
      dataType: 'json',
      success: function (res) {
        $('#form-lai-xe .btn-luu-lai-xe').prop('disabled', false).html('<i class="ti tabler-device-floppy me-1"></i> Lưu');
        if (res.status !== 'success' || !res.data) {
          notyf.error(res.message || 'Không tìm thấy dữ liệu');
          $('#lai-xe-modal').modal('hide');
          return;
        }
        var d = res.data;
        populateForm(d);
        $('#lai-xe-modal').modal('show');
      },
      error: function () {
        $('#form-lai-xe .btn-luu-lai-xe').prop('disabled', false).html('<i class="ti tabler-device-floppy me-1"></i> Lưu');
        notyf.error('Lỗi kết nối server');
        $('#lai-xe-modal').modal('hide');
      }
    });
  }

  function resetForm() {
    $('#form-lai-xe')[0].reset();
    $('#form-lai-xe input[name="nid"]').val('');
    $('#form-lai-xe .invalid-feedback').hide();
    $('#form-lai-xe .is-invalid').removeClass('is-invalid');
    $('#lai-xe-modal-title').text('Thêm lái xe');
  }

  function populateForm(d) {
    $('#form-lai-xe input[name="ten"]').val(d.ten || '');
    $('#form-lai-xe input[name="ma_nhan_vien"]').val(d.ma_nhan_vien || '');
    $('#form-lai-xe input[name="sdt"]').val(d.sdt || '');
    $('#form-lai-xe input[name="cccd"]').val(d.cccd || '');
    $('#form-lai-xe input[name="ngay_cap"]').val(d.ngay_cap || '');
    $('#form-lai-xe input[name="noi_cap"]').val(d.noi_cap || '');
    $('#form-lai-xe input[name="han_cccd"]').val(d.han_cccd || '');
    $('#form-lai-xe input[name="so_bang_lai"]').val(d.so_bang_lai || '');
    $('#form-lai-xe input[name="loai_bang_lai"]').val(d.loai_bang_lai || '');
    $('#form-lai-xe input[name="han_bang_lai"]').val(d.han_bang_lai || '');
    $('#form-lai-xe input[name="ngay_nhan_viec"]').val(d.ngay_nhan_viec || '');
    $('#form-lai-xe input[name="so_tk_ngan_hang"]').val(d.so_tk_ngan_hang || '');
    $('#form-lai-xe input[name="ngan_hang"]').val(d.ngan_hang || '');
    $('#form-lai-xe input[name="hoat_dong"]').prop('checked', d.hoat_dong == 1);
  }

  // Init Flatpickr for date fields
  function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
      $('.flatpickr-date').each(function () {
        try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
        flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true });
      });
    }
  }

  // Init Cleave-zen masks
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

  // Init form widgets when modal opens
  $('#lai-xe-modal').on('shown.bs.modal', function () {
    initDatePickers();
    initMasks();
  });

  // Form submit
  $(document).on('submit', '#form-lai-xe', function (e) {
    e.preventDefault();

    if (this.checkValidity() === false) {
      e.stopPropagation();
      $(this).addClass('was-validated');
      return;
    }

    var data = {};
    $(this).serializeArray().forEach(function (field) {
      data[field.name] = field.value;
    });
    data.hoat_dong = $('#form-lai-xe input[name="hoat_dong"]').is(':checked') ? 1 : 0;

    var nid = $('#form-lai-xe input[name="nid"]').val();
    var url = nid ? '/api/lai-xe/' + nid : '/api/lai-xe';
    var method = nid ? 'PUT' : 'POST';

    $('.btn-luu-lai-xe').prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...');

    $.ajax({
      url: url,
      method: method,
      contentType: 'application/json',
      data: JSON.stringify(data),
      dataType: 'json',
      success: function (res) {
        $('.btn-luu-lai-xe').prop('disabled', false).html('<i class="ti tabler-device-floppy me-1"></i> Lưu');
        if (res.status === 'success') {
          notyf.success(nid ? 'Cập nhật thành công' : 'Tạo mới thành công');
          $('#lai-xe-modal').modal('hide');
          resetForm();
          loadList();
        } else {
          notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function () {
        $('.btn-luu-lai-xe').prop('disabled', false).html('<i class="ti tabler-device-floppy me-1"></i> Lưu');
        notyf.error('Lỗi kết nối server');
      }
    });
  });

  // Open modal for create
  $(document).on('click', '.btn-them-lai-xe', function () {
    resetForm();
  });

  // Reset form when modal closed
  $('#lai-xe-modal').on('hidden.bs.modal', function () {
    resetForm();
  });

  function deleteItem(id) {
    $.ajax({
      url: '/api/lai-xe/' + id,
      method: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          notyf.success('Xoá thành công');
          loadList();
        } else {
          notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function () {
        notyf.error('Lỗi kết nối server');
      }
    });
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

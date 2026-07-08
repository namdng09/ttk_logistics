(function ($, Drupal) {
  'use strict';

  Drupal.behaviors.phuongTien = {
    attach: function (context, settings) {
      var config = settings.phuong_tien || {};

      if ($('#table-phuong-tien', context).length) {
        loadList();
      }

      if ($('#form-phuong-tien', context).length) {
        initForm(config);
      }
    }
  };

  function loadList() {
    $.ajax({
      url: '/api/phuong-tien',
      method: 'GET',
      dataType: 'json',
      success: function (res) {
        var tbody = $('#table-phuong-tien tbody');
        tbody.empty();

        if (!res.data || res.data.length === 0) {
          tbody.append('<tr><td colspan="7" class="text-center">Không có dữ liệu</td></tr>');
          return;
        }

        $.each(res.data, function (i, item) {
          var stt = (res.page - 1) * 20 + i + 1;
          var status = item.hoat_dong == 1
            ? '<span class="badge bg-success">Hoạt động</span>'
            : '<span class="badge bg-secondary">Ngừng</span>';

          var actions = '<a href="/quan-ly/phuong-tien/' + item.phuong_tien_id + '" class="btn btn-sm btn-primary me-1">Sửa</a>';
          if (Drupal.settings.phuong_tien.permissions.phuong_tien_delete) {
            actions += '<button class="btn btn-sm btn-danger btn-delete" data-id="' + item.phuong_tien_id + '">Xoá</button>';
          }

          tbody.append(
            '<tr>' +
            '<td>' + stt + '</td>' +
            '<td>' + item.bks + '</td>' +
            '<td>' + (item.loai_phuong_tien || '') + '</td>' +
            '<td>' + (item.hang_xe || '') + '</td>' +
            '<td>' + (item.nam_san_xuat || '') + '</td>' +
            '<td>' + status + '</td>' +
            '<td>' + actions + '</td>' +
            '</tr>'
          );
        });
      },
      error: function () {
        $('#table-phuong-tien tbody').append('<tr><td colspan="7" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
      }
    });
  }

  function initForm(config) {
    if (config.is_edit && config.data) {
      var data = config.data;
      $('#form-phuong-tien input[name="bks"]').val(data.bks);
      $('#form-phuong-tien input[name="ma_tai_san"]').val(data.ma_tai_san);
      $('#form-phuong-tien input[name="loai_phuong_tien"]').val(data.loai_phuong_tien);
      $('#form-phuong-tien input[name="hang_xe"]').val(data.hang_xe);
      $('#form-phuong-tien input[name="nam_san_xuat"]').val(data.nam_san_xuat);
      $('#form-phuong-tien input[name="gia_mua"]').val(data.gia_mua);
      $('#form-phuong-tien input[name="ngay_mua"]').val(data.ngay_mua);
      $('#form-phuong-tien input[name="so_dang_kiem"]').val(data.so_dang_kiem);
      $('#form-phuong-tien input[name="han_dang_kiem"]').val(data.han_dang_kiem);
      $('#form-phuong-tien input[name="so_bao_hiem_than_vo"]').val(data.so_bao_hiem_than_vo);
      $('#form-phuong-tien input[name="han_bao_hiem_than_vo"]').val(data.han_bao_hiem_than_vo);
      $('#form-phuong-tien input[name="so_bao_hiem_tnds"]').val(data.so_bao_hiem_tnds);
      $('#form-phuong-tien input[name="han_bao_hiem_tnds"]').val(data.han_bao_hiem_tnds);
      $('#form-phuong-tien input[name="ngay_phu_hieu"]').val(data.ngay_phu_hieu);
      $('#form-phuong-tien input[name="han_phu_hieu"]').val(data.han_phu_hieu);
      if (data.hoat_dong == 1) {
        $('#form-phuong-tien input[name="hoat_dong"]').prop('checked', true);
      } else {
        $('#form-phuong-tien input[name="hoat_dong"]').prop('checked', false);
      }
    }

    $('#form-phuong-tien').on('submit', function (e) {
      e.preventDefault();

      var data = {};
      $(this).serializeArray().forEach(function (field) {
        data[field.name] = field.value;
      });
      data.hoat_dong = $('#form-phuong-tien input[name="hoat_dong"]').is(':checked') ? 1 : 0;

      var url = config.phuong_tien_id
        ? '/api/phuong-tien/' + config.phuong_tien_id
        : '/api/phuong-tien';
      var method = config.phuong_tien_id ? 'PUT' : 'POST';

      $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            window.location.href = '/quan-ly/phuong-tien';
          } else {
            alert(res.message || 'Lỗi không xác định');
          }
        },
        error: function () {
          alert('Lỗi kết nối server');
        }
      });
    });

    $(document).on('click', '.btn-delete', function () {
      if (!confirm('Xác nhận xoá phương tiện này?')) return;

      var id = $(this).data('id');

      $.ajax({
        url: '/api/phuong-tien/' + id,
        method: 'DELETE',
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            loadList();
          } else {
            alert(res.message || 'Lỗi không xác định');
          }
        },
        error: function () {
          alert('Lỗi kết nối server');
        }
      });
    });
  }

})(jQuery, Drupal);

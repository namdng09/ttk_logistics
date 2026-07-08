<?php
$roles = user_roles();
$role_options = [];
foreach ($roles as $role_id => $role_name) {
    $role_options[$role_id] = $role_name;
}
$strTrangThai = explode(',','Chờ hàng,Đã xác nhận,Đang đóng hàng,Chờ chuyển hàng,Đã gửi hàng,Thành công,Đơn hoàn,Đang giao,Đã Hủy');

?>
<!-- Extra Large Modal -->
<div class="modal fade" id="modal-nhan-vien" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl" role="document">
        <div class="modal-content">
            <form id="form-nhan-vien">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel4"><span id="tieu-de">Sửa thông tin nhân viên</span></h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="uid" name="uid" value="-1">
                    <div class="form-group">
                        <div class="row">
                            <div class="col-md-4">
                                <label class="mb-2">Họ tên</label>
                                <input type="text" id="field_ho_ten" name="field_ho_ten" class="form-control" required>
                            </div>
                            <div class="col-md-4">
                                <label class="mb-2">Điện thoại</label>
                                <input type="text" id="field_dien_thoai" name="field_dien_thoai" class="form-control" required>
                            </div>
                            <div class="col-md-4">
                                <label class="mb-2">Email</label>
                                <input type="email" id="email" name="email" class="form-control" required>
                            </div>
                        </div>
                    </div>
                    <!-- Dòng 2: Ngày sinh, Username, Password -->
                    <div class="form-group mt-2 mt-3 mb-5">
                        <div class="row">
                            <div class="col-md-4">
                                <label class="mb-2">Ngày sinh</label>
                                <input type="date" id="field_ngay_sinh" name="field_ngay_sinh" class="form-control" required>
                            </div>
                            <div class="col-md-4">
                                <label class="mb-2">Tên đăng nhập</label>
                                <input type="text" id="username" name="username" class="form-control" required>
                            </div>
                            <div class="col-md-4">
                                <label class="mb-2">Mật khẩu</label>
                                <input type="password" id="password" name="password" class="form-control" required>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <label for="field_roles" class="mb-2">Bộ phận</label>
                            <div>
                                <?php foreach ($role_options as $role_id => $role_name): ?>
                                    <?php if(!in_array($role_id, [1, 2, 3])): ?>
                                        <div class="form-check">
                                            <input type="checkbox" class="form-check-input" id="role_<?php echo $role_id; ?>" name="roles[]" value="<?php echo $role_id; ?>">
                                            <label class="form-check-label" for="role_<?php echo $role_id; ?>"><?php echo $role_name; ?></label>
                                        </div>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="form-group mb-3">
                                <label for="field_roles" class="mb-2">Quyền chọn trạng thái</label>
                                <div>
                                    <?php foreach ($strTrangThai as $index => $trangThai): ?>
                                        <div class="form-check">
                                            <input type="checkbox" class="form-check-input" id="trang_thai_<?php echo $index; ?>" name="trangThai[]" value="<?php echo $trangThai; ?>">
                                            <label class="form-check-label" for="trang_thai_<?php echo $index; ?>"><?php echo $trangThai; ?></label>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                        Đóng lại
                    </button>
                    <a class="btn btn-primary" href="#" id="btn-luu-nhan-vien">
                        <span class="d-flex align-items-center gap-2">
                                <i class="icon-base ti tabler-device-floppy icon-sm"></i>
                                <span class="d-none d-sm-inline-block" id="text-save">Lưu</span>
                            </span>
                    </a>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
<div class="modal fade" id="modal-update-shop-nhan-vien" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg" role="document">
    <div class="modal-content">
      <form id="form-update-shop-nhan-vien">
        <div class="modal-header">
          <h5 class="modal-title" id="exampleModalLabel4"><span id="tieu-de">Cập nhật Shop cho nhân viên</span></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" id="list_cua_hang" name="list_cua_hang">
          <input type="hidden" id="list_shop" name="list_shop">
          <input type="hidden" id="uid_update_shop_nhan_vien" name="uid" value="-1">
          <div class="row">
            <div class="col-3">
              <div class="form-group mb-3">
                <label for="field_kho_id">Kho</label>
                <select class="form-control" id="field_kho_id" name="field_kho_id">
                  <option value="">-- Chọn kho --</option>
                </select>
              </div>
            </div>
          </div>

          <div id="cua-hang-wrapper" class="mt-5 mb-5"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
            Đóng lại
          </button>
          <a class="btn btn-primary btn-save-update-shop-nhan-vien" href="#" >
            <span class="d-flex align-items-center gap-2">
                                <i class="icon-base ti tabler-device-floppy icon-sm"></i>
                                <span class="d-none d-sm-inline-block">Lưu</span>
                            </span>
          </a>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="card">
    <div class="card-datatable table-responsive pt-0">
        <div id="DataTables_Table_0_wrapper" class="dt-container dt-bootstrap5 dt-empty-footer">
            <div class="row card-header flex-column flex-md-row border-bottom mx-0 px-3">
              <div class="col-md-2">
                <h5 class="card-title"><?php print drupal_get_title(); ?></h5>
              </div>
              <div class="col-md-10 text-end">
                <a href="/nhan-vien/add" class="btn btn-them-nhan-vien btn-success me-2">
                  <i class="icon-base ti tabler-plus icon-sm"></i> Thêm nhân viên
                </a>
              </div>
            </div>
          <div class="table-responsive">
            <table class="table table-bordered text-nowrap">
              <?php if (!empty($header)) : ?>
                <thead>
                <tr>
                  <?php foreach ($header as $field => $label): ?>
                    <th width="<?=$field != 'field_ho_ten' ? '1%' : ''?>" >
                      <?php print $label; ?>
                    </th>
                  <?php endforeach; ?>
                </tr>
                </thead>
              <?php endif; ?>
              <tbody class="table-border-bottom-0">
               <?php foreach ($rows as $row_count => $row): ?>
                <tr>
                  <?php foreach ($row as $field => $content): ?>
                    <td>
                      <?php
                      if ($field == 'field_ngay_sinh' && !empty($content)) {
                        print date("d/m/Y", strtotime(strip_tags($content)));
                      }
                      else if ($field == 'uid') echo '
                      <div class="dropdown">
                        <button type="button"
                                class="btn p-0 dropdown-toggle hide-arrow"
                                data-bs-toggle="dropdown">
                          <i class="icon-base ti tabler-dots-vertical"></i>
                        </button>
                        <div class="dropdown-menu">
                          <a class="dropdown-item btn-update-shop-nhan-vien" href="#"
                             data-value="'.$content.'">
                            <i class="icon-base ti tabler-building-store me-1"></i>
                            Chọn shop
                          </a>
                          <a class="dropdown-item btn-sua-nhan-vien" href="#"
                             data-value="'.$content.'">
                            <i class="icon-base ti tabler-edit me-1"></i>
                            Sửa
                          </a>
                          <a class="dropdown-item btn-xoa-nhan-vien text-danger" href="#"
                             data-value="'.$content.'">
                            <i class="icon-base ti tabler-trash me-1"></i> Xóa
                          </a>
                        </div>
                      </div>';
                      else if($field == 'field_quyen_chon_trang_thai')
                          print str_replace(',', '<br />', $content);
                      else if($field == 'field_bo_phan')
                          print str_replace(';', '<br />', $content);
                      else {
                        print $content;
                      }
                      ?>
                    </td>
                  <?php endforeach; ?>
                </tr>
              <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </div>
    </div>
</div>

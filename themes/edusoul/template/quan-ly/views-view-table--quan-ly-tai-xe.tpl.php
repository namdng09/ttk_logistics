<?php
$listChiPhi = getConfigChiPhi();
?>
  <!-- Modal thêm tài xế -->
  <div class="modal fade qltx-driver-modal" id="them-tai-xe-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header py-2">
          <h5 class="modal-title">Thêm tài xế</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <form id="them-tai-xe-form">
            <div class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="qltx-section-title">Thông tin lái xe</h6>
              </div>

              <div class="card-body">
                <div class="row g-2">
                  <div class="col-lg-3 col-md-6">
                    <label for="ten-tai-xe" class="form-label">Tên tài xế</label>
                    <input type="text" class="form-control form-control-sm" id="ten-tai-xe" name="ten_tai_xe" placeholder="Tên tài xế">
                  </div>

                  <div class="col-lg-2 col-md-6">
                    <label for="so-dien-thoai" class="form-label">Số điện thoại</label>
                    <input type="tel" class="form-control form-control-sm" id="so-dien-thoai" name="so_dien_thoai" placeholder="Số điện thoại" pattern="[0-9]{10,11}">
                  </div>

                  <div class="col-lg-2 col-md-6">
                    <label for="ngay-sinh" class="form-label">Ngày sinh</label>
                    <input type="text" class="form-control form-control-sm" id="ngay-sinh" name="ngay_sinh" placeholder="dd-mm-YYYY">
                  </div>

                  <div class="col-lg-2 col-md-6">
                    <label for="loai-bang-lai" class="form-label">Loại bằng</label>
                    <input type="text" class="form-control form-control-sm" id="loai-bang-lai" name="loai_bang_lai" placeholder="Loại bằng">
                  </div>

                  <div class="col-lg-3 col-md-12">
                    <label for="dia-chi" class="form-label">Địa chỉ</label>
                    <input type="text" class="form-control form-control-sm" id="dia-chi" name="dia_chi" placeholder="Địa chỉ">
                  </div>

                  <div class="col-lg-3 col-md-4">
                    <label for="luong-co-ban" class="form-label">Lương cơ bản</label>
                    <input type="text" class="form-control form-control-sm text-end format-money" data-money-input="1" id="luong-co-ban" name="luong_co_ban" placeholder="0">
                  </div>

                  <div class="col-lg-3 col-md-4">
                    <label for="luong-thang" class="form-label">Lương tháng</label>
                    <input type="text" class="form-control form-control-sm text-end format-money" data-money-input="1" id="luong-thang" name="luong_thang" placeholder="0" value="8.500.000">
                  </div>

                  <div class="col-lg-2 col-md-4">
                    <label for="ngay-cong" class="form-label">Ngày công</label>
                    <input type="text" class="form-control form-control-sm text-end" id="ngay-cong" name="ngay_cong" min="0" placeholder="26">
                  </div>

                  <div class="col-lg-3 col-md-4">
                    <label for="luong-ngay" class="form-label">Lương theo ngày</label>
                    <input type="text" class="form-control form-control-sm text-end format-money" data-money-input="1" id="luong-ngay" name="luong_ngay" placeholder="Tự tính" min="0">
                  </div>
                </div>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-lg-5">
                <div class="card h-100">
                  <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 class="qltx-section-title">Chi phí lương lái xe</h6>
                    <button type="button" class="btn btn-sm btn-success btn-them-chi-phi-luong">
                      <i class="icon-base ti tabler-plus me-1"></i> Thêm
                    </button>
                  </div>

                  <div class="card-body">
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                        <tr>
                          <th style="width: 48px;" class="text-center">STT</th>
                          <th>Tên chi phí</th>
                          <th style="width: 140px;" class="text-end">Số tiền</th>
                          <th style="width: 54px;" class="text-center">Xóa</th>
                        </tr>
                        </thead>
                        <tbody class="chi-phi-luong-tbody"></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-7">
                <div class="card h-100">
                  <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 class="qltx-section-title">Thông tin ngân hàng</h6>
                    <button type="button" class="btn btn-sm btn-success btn-them-ngan-hang">
                      <i class="icon-base ti tabler-plus me-1"></i> Thêm
                    </button>
                  </div>

                  <div class="card-body">
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                        <tr>
                          <th style="width: 48px;" class="text-center">STT</th>
                          <th style="min-width: 340px;">Thông tin ngân hàng</th>
                          <th style="width: 76px;" class="text-center">Mặc định</th>
                          <th style="width: 54px;" class="text-center">Xóa</th>
                        </tr>
                        </thead>
                        <tbody class="ngan-hang-tbody"></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer py-2">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
          <button type="button" class="btn btn-primary btn-luu-tai-xe">Lưu tài xế</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal sửa tài xế -->
  <div class="modal fade qltx-driver-modal" id="cap-nhat-tai-xe-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header py-2">
          <h5 class="modal-title">Sửa thông tin tài xế</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body">
          <form id="sua-tai-xe-form">
            <input type="hidden" name="nid" id="nid" value="">

            <div class="card mb-3">
              <div class="card-header bg-light">
                <h6 class="qltx-section-title">Thông tin lái xe</h6>
              </div>

              <div class="card-body">
                <div class="row g-2">
                  <div class="col-lg-3 col-md-6">
                    <label for="ten-tai-xe" class="form-label">Tên tài xế</label>
                    <input type="text" class="form-control form-control-sm" id="ten-tai-xe" name="ten_tai_xe" placeholder="Tên tài xế">
                  </div>

                  <div class="col-lg-2 col-md-6">
                    <label for="so-dien-thoai" class="form-label">Số điện thoại</label>
                    <input type="tel" class="form-control form-control-sm" id="so-dien-thoai" name="so_dien_thoai" placeholder="Số điện thoại" pattern="[0-9]{10,11}">
                  </div>

                  <div class="col-lg-2 col-md-6">
                    <label for="edit-ngay-sinh" class="form-label">Ngày sinh</label>
                    <input type="text" class="form-control form-control-sm" id="edit-ngay-sinh" name="ngay_sinh" placeholder="dd-mm-YYYY">
                  </div>

                  <div class="col-lg-2 col-md-6">
                    <label for="loai-bang-lai" class="form-label">Loại bằng</label>
                    <input type="text" class="form-control form-control-sm" id="loai-bang-lai" name="loai_bang_lai" placeholder="Loại bằng">
                  </div>

                  <div class="col-lg-3 col-md-12">
                    <label for="dia-chi" class="form-label">Địa chỉ</label>
                    <input type="text" class="form-control form-control-sm" id="dia-chi" name="dia_chi" placeholder="Địa chỉ">
                  </div>

                  <div class="col-lg-3 col-md-4">
                    <label for="luong-co-ban" class="form-label">Lương cơ bản</label>
                    <input type="text" class="form-control form-control-sm text-end format-money" data-money-input="1" id="luong-co-ban" name="luong_co_ban" placeholder="0">
                  </div>

                  <div class="col-lg-3 col-md-4">
                    <label for="luong-thang" class="form-label">Lương tháng</label>
                    <input type="text" class="form-control form-control-sm text-end format-money" data-money-input="1" id="luong-thang" name="luong_thang" placeholder="0">
                  </div>

                  <div class="col-lg-2 col-md-4">
                    <label for="ngay-cong" class="form-label">Ngày công</label>
                    <input type="text" class="form-control form-control-sm text-end" id="ngay-cong" name="ngay_cong" min="0" placeholder="26">
                  </div>

                  <div class="col-lg-3 col-md-4">
                    <label for="luong-ngay" class="form-label">Lương theo ngày</label>
                    <input type="text" class="form-control form-control-sm text-end format-money" data-money-input="1" id="luong-ngay" name="luong_ngay" placeholder="Tự tính" min="0">
                  </div>
                </div>
              </div>
            </div>

            <div class="row g-3">
              <div class="col-lg-5">
                <div class="card h-100">
                  <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 class="qltx-section-title">Chi phí lương lái xe</h6>
                    <button type="button" class="btn btn-sm btn-success btn-them-chi-phi-luong">
                      <i class="icon-base ti tabler-plus me-1"></i> Thêm
                    </button>
                  </div>

                  <div class="card-body">
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                        <tr>
                          <th style="width: 48px;" class="text-center">STT</th>
                          <th>Tên chi phí</th>
                          <th style="width: 140px;" class="text-end">Số tiền</th>
                          <th style="width: 54px;" class="text-center">Xóa</th>
                        </tr>
                        </thead>
                        <tbody class="chi-phi-luong-tbody"></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-7">
                <div class="card h-100">
                  <div class="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 class="qltx-section-title">Thông tin ngân hàng</h6>
                    <button type="button" class="btn btn-sm btn-success btn-them-ngan-hang">
                      <i class="icon-base ti tabler-plus me-1"></i> Thêm
                    </button>
                  </div>

                  <div class="card-body">
                    <div class="table-responsive">
                      <table class="table table-sm table-bordered align-middle mb-0">
                        <thead class="table-light">
                        <tr>
                          <th style="width: 48px;" class="text-center">STT</th>
                          <th style="min-width: 340px;">Thông tin ngân hàng</th>
                          <th style="width: 76px;" class="text-center">Mặc định</th>
                          <th style="width: 54px;" class="text-center">Xóa</th>
                        </tr>
                        </thead>
                        <tbody class="ngan-hang-tbody"></tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div class="modal-footer py-2">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
          <button type="button" class="btn btn-primary btn-cap-nhat-tai-xe">Cập nhật</button>
        </div>
      </div>
    </div>
  </div>

    <div class="card">
    <div class="card-header row">
        <div class="col-md-2">
            <h5>
                <?php print drupal_get_title(); ?>
            </h5>
        </div>
        <div class="col-md-6">
        </div>
        <div class="col-md-4 text-end">
            <div>
                <a href="#" class="btn btn-success btn-them-tai-xe" data-bs-toggle="modal"
                   data-bs-target="#them-tai-xe-modal">
                    <i class="icon-base ti tabler-plus me-1"></i>
                    Thêm tài xế
                </a>
            </div>
        </div>
    </div>
    <div class="table-responsive">
        <table class="table table-bordered table-striped text-nowrap">
            <?php if (!empty($title) || !empty($caption)): ?>
                <caption><?php print $caption . $title; ?></caption>
            <?php endif; ?>
            <?php if (!empty($header)) : ?>
                <thead>
                <tr>
                    <?php foreach ($header as $field => $label): ?>
                        <th width="<?= trim($label) != 'Tài xế' ? '1%' : '' ?>">
                            <?php print $label; ?>
                        </th>
                    <?php endforeach; ?>
                </tr>
                </thead>
            <?php endif; ?>
            <tbody>
            <?php foreach ($rows as $row_count => $row): ?>
                <tr>
                    <?php foreach ($row as $field => $content): ?>
                        <td>
                            <?php if ($field == 'nid'): ?>
                                <div class="dropdown">
                                    <button type="button"
                                            class="btn p-0 dropdown-toggle hide-arrow"
                                            data-bs-toggle="dropdown">
                                        <i class="icon-base ti tabler-settings-spark"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        <a class="dropdown-item  btn-load-tai-xe" href="#"
                                           data-value="<?= $content ?>">
                                            <i class="icon-base ti tabler-user-edit me-1"></i>
                                            Sửa
                                        </a>
                                        <a class="dropdown-item btn-xoa-tai-xe text-danger" href="#"
                                           data-value="<?= $content ?>">
                                            <i class="icon-base ti tabler-trash me-1"></i>
                                            Xóa
                                        </a>
                                    </div>
                                </div>
                            <?php elseif ($field == 'field_luong_thang' || $field == 'field_luong_ngay'): ?>
                                <div class="text-end">
                                    <?= $content ?>
                                </div>
                            <?php else: ?>
                                <?php print $content ?>
                            <?php endif; ?>
                        </td>
                    <?php endforeach; ?>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
    </div><?php

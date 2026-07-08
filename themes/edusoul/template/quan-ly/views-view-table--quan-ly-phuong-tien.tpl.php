<?php $tai_xe_list = getTaiXe();
$listNhaXe = getListDanhMuc('Nhà xe');
?>

<div class="modal fade" id="phuong-tien-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h5 class="modal-title"></h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="them-phuong-tien-form">
                    <input type="hidden" id="nid-phuong-tien" name="nid_phuong_tien">
                    <div class="row g-3">

                        <!-- Biển kiểm soát -->
                        <div class="col-md-3">
                            <label for="bienSo" class="form-label">Biển kiểm soát</label>
                            <input type="text" class="form-control" id="bienSo" name="bien_kiem_soat"
                                   placeholder="VD: 51C-123.45">
                        </div>

                        <!-- Định mức nhiên liệu -->
                        <div class="col-md-3">
                            <label for="dinhMuc" class="form-label">Định mức nhiên liệu </label>
                            <input type="number" step="0.1" class="form-control" id="dinhMuc"
                                   name="dinh_muc_nhien_lieu">
                        </div>

                        <!-- Ngày đăng kiểm -->
                        <div class="col-md-3">
                            <label for="ngayDangKiem" class="form-label">Ngày đăng kiểm</label>
                            <input type="text" class="form-control" id="ngay_dang_kiem" name="ngay_dang_kiem" placeholder="dd-mm-YYYY">
                        </div>
                        <!-- Lái xe -->
                        <div class="col-md-3 block-list-lai-xe">
                            <label for="laiXe" class="form-label">Lái xe</label>
                            <select class="form-select" id="laiXe" name="lai_xe">
                                <option value="" selected disabled>-- Chọn lái xe --</option>
                                <?php foreach ($tai_xe_list as $tx): ?>
                                    <option value="<?php echo $tx['nid']; ?>"><?php echo check_plain($tx['ten_lai_xe']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-3 ">
                            <label for="nhaXe" class="form-label">Nhà xe</label>
                            <select class="form-select" id="nhaXe" name="nha_xe">
                                <option value="" >-- Chọn nhà xe --</option>
                                <?php foreach ($listNhaXe as $tx): ?>
                                    <option value="<?php echo $tx['nid']; ?>"><?php echo check_plain($tx['title']); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <!-- Ghi chú -->
                        <div class="col-md-12">
                            <label for="ghiChu" class="form-label">Ghi chú</label>
                            <textarea class="form-control" id="ghiChu" name="ghi_chu" rows="2"></textarea>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
                <button type="button" class="btn btn-primary btn-luu-phuong-tien">Lưu</button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="cap-nhat-tai-xe-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h5 class="modal-title">Cập nhật tài xế</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="form-tai-xe">
                    <input type="hidden" name="nid_phuong_tien" id="nid-phuong-tien-update-tai-xe" value="">
                    <div id="block-thong-tin-phuong-tien"></div>
                    <label for="bienSo" class="form-label">Chọn tài xế</label>
                    <select id="tai-xe-moi" class="form-control" name="tai_xe_moi">

                    </select>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
                <button type="button" class="btn btn-primary btn-save-new-tai-xe">Lưu tài xế mới</button>
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
                <a href="#" class="btn btn-success btn-them-phuong-tien">
                    <i class="icon-base ti tabler-plus me-1"></i>
                    Thêm phương tiện
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
                        <th width="<?= trim($label) != 'Biển kiểm soát'  ? '1%' : '' ?>">
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
                        <?php if($field == 'nid'): ?>
                            <td class="text-center">
                                <div class="dropdown">
                                    <button type="button"
                                            class="btn p-0 dropdown-toggle hide-arrow"
                                            data-bs-toggle="dropdown">
                                        <i class="icon-base ti tabler-settings-spark"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        <a class="dropdown-item btn-update-tai-xe" href="#"
                                           data-value="<?=$content?>">
                                            <i class="icon-base ti tabler-user-edit me-1"></i>
                                            Thay đổi tài xế
                                        </a>
                                        <a class="dropdown-item btn-load-phuong-tien" href="#"
                                           data-value="<?=$content?>">
                                            <i class="icon-base ti tabler-edit me-1"></i>
                                            Sửa thông tin
                                        </a>
                                        <a class="dropdown-item btn-xoa-phuong-tien text-danger" href="#"   data-value="<?=$content?>">
                                            <i class="icon-base ti tabler-trash me-1"></i> Huỷ
                                        </a>
                                    </div>
                                </div>
                            </td>
                        <?php elseif($field == 'field_ngay_do_dau'): ?>
                            <td class="text-center">
                                <?= !empty($content) ? date("d-m-Y", (int)$content) : '' ?>
                            </td>
                        <?php else: ?>
                        <td>
                            <?php print $content ?>
                        </td>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

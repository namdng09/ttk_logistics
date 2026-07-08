<?php
$listChiPhi = getConfigChiPhi();
?>
<div class="modal fade" id="them-cung-duong-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h5 class="modal-title">Thêm mới cung đường</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="them-cung-duong-form">
                    <div class="row g-3">
                        <?php $cities = variable_get('vietnam_cities_list', []); ?>

                        <!-- Điểm đi -->
                        <div class="col-md-3">
                            <label for="diem-di-them" class="form-label">Điểm đi</label>
                            <select id="diem-di-them" name="diem_di" class="form-select select2"
                                    data-placeholder="Chọn tỉnh/thành phố">
                                <?php
                                foreach ($cities as $city) {
                                    echo "<option value='" . check_plain($city) . "'>" . check_plain($city) . "</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <!-- Điểm về -->
                        <div class="col-md-3">
                            <label for="diem-den-them" class="form-label">Điểm đến</label>
                            <select id="diem-den-them" name="diem_den" class="form-select select2"
                                    data-placeholder="Chọn tỉnh/thành phố">
                                <?php
                                foreach ($cities as $city) {
                                    echo "<option value='" . check_plain($city) . "'>" . check_plain($city) . "</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label" for="so-tram">Số trạm</label>
                            <input class="form-control" type="number" id="so-tram" name="so_tram" step="1" min="1">
                        </div>

                        <!-- Tiền vé -->

                        <div class="col-md-3">
                            <label for="tien-ve-thang" class="form-label">Tiền vé tháng</label>
                            <input type="number" class="form-control " id="tien-ve-thang" name="tien_ve_thang"
                                   placeholder="Nhập tiền vé tháng" value="<?= $listChiPhi['tien_ve_thang'] ?>">
                        </div>


                        <div class="col-md-3">
                            <label for="so-chuyen-theo-thang" class="form-label">Số chuyến/tháng</label>
                            <input type="number" class="form-control" id="so-chuyen-theo-thang"
                                   name="so_chuyen_theo_thang"
                                   placeholder="Nhập số chuyến " value="<?= $listChiPhi['so_chuyen_mot_thang'] ?>">
                        </div>

                        <div class="col-md-3">
                            <label for="ve-thang-tren-ngay" class="form-label">Tiền vé tháng/ngày</label>
                            <input type="number" class="form-control " id="ve-thang-tren-ngay"
                                   name="ve_thang_tren_ngay"
                                   placeholder="Tiền vé tháng/ngày"
                                   value="<?= $listChiPhi['tien_ve_thang'] / $listChiPhi['so_chuyen_mot_thang'] ?>"
                                   readonly>
                        </div>

                        <div class="col-md-3">
                            <label for="tien-ve" class="form-label">Tiền vé / trạm</label>
                            <input type="number" class="form-control " id="tien-ve" name="tien_ve"
                                   placeholder="Nhập tiền vé" value="<?= $listChiPhi['tien_ve'] ?>">
                        </div>

                        <div class="col-md-3">
                            <label for="ho-tro-tien-ve" class="form-label">Hỗ trợ tiền vé</label>
                            <input type="number" class="form-control " id="ho-tro-tien-ve" name="ho_tro_tien_ve"
                                   placeholder="Nhập tiền hỗ trợ">
                        </div>

                        <!-- Tiền quay đầu -->
                        <div class="col-md-3">
                            <label for="tien-quay-dau" class="form-label">Tiền quay đầu</label>
                            <input type="number" class="form-control " id="tien-quay-dau" name="tien_quay_dau"
                                   placeholder="Nhập tiền quay đầu" value="<?= $listChiPhi['tien_quay_dau'] ?>">
                        </div>

                        <!-- Tiền đi đường -->
                        <div class="col-md-3">
                            <label for="tien-di-duong" class="form-label">Tiền đi đường</label>
                            <input type="number" class="form-control " id="tien-di-duong" name="tien_di_duong"
                                   placeholder="Nhập tiền">
                        </div>


                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
                <button type="button" class="btn btn-primary btn-luu-cung-duong">Lưu</button>
            </div>
        </div>
    </div>
</div>
<div class="modal fade" id="cap-nhat-cung-duong-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <!-- Modal Header -->
            <div class="modal-header">
                <h5 class="modal-title">Sửa thông tin cung đường</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close">
                </button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="sua-cung-duong-form">
                    <input type="hidden" name="nid" id="nid" value="">
                    <div class="row g-3">
                        <?php $cities = variable_get('vietnam_cities_list', []); ?>

                        <!-- Điểm đi -->
                        <div class="col-md-3">
                            <label for="diem-di-cap-nhat" class="form-label">Điểm đi</label>
                            <select id="diem-di-cap-nhat" name="diem_di" class="form-select select2"
                                    data-placeholder="">
                                <?php
                                foreach ($cities as $city) {
                                    echo "<option value='" . check_plain($city) . "'>" . check_plain($city) . "</option>";
                                }
                                ?>
                            </select>
                        </div>
                        <!-- Điểm về -->
                        <div class="col-md-3">
                            <label for="diem-den-cap-nhat" class="form-label">Điểm đến</label>
                            <select id="diem-den-cap-nhat" name="diem_den" class="form-select select2"
                                    data-placeholder="">
                                <?php
                                foreach ($cities as $city) {
                                    echo "<option value='" . check_plain($city) . "'>" . check_plain($city) . "</option>";
                                }
                                ?>
                            </select>
                        </div>

                        <div class="col-md-3">
                            <label class="form-label" for="so-tram">Số trạm</label>
                            <input class="form-control" type="number" id="so-tram" name="so_tram" step="1" min="1">
                        </div>

                        <!-- Tiền vé -->

                        <div class="col-md-3">
                            <label for="tien-ve-thang" class="form-label">Tiền vé tháng</label>
                            <input type="number" class="form-control " id="tien-ve-thang" name="tien_ve_thang"
                                   placeholder="Nhập tiền vé tháng" value="5800000">
                        </div>

                        <div class="col-md-3">
                            <label for="so-chuyen-theo-thang" class="form-label">Số chuyến/tháng</label>
                            <input type="number" class="form-control" id="so-chuyen-theo-thang"
                                   name="so_chuyen_theo_thang"
                                   placeholder="Nhập số chuyến ">
                        </div>

                        <div class="col-md-3">
                            <label for="ve-thang-tren-ngay" class="form-label">Tiền vé tháng/ngày</label>
                            <input type="number" class="form-control " id="ve-thang-tren-ngay"
                                   name="ve_thang_tren_ngay"
                                   placeholder="Tiền vé tháng/ngày" readonly>
                        </div>

                        <div class="col-md-3">
                            <label for="tien-ve" class="form-label">Tiền vé / trạm</label>
                            <input type="number" class="form-control " id="tien-ve" name="tien_ve"
                                   placeholder="Nhập tiền vé">
                        </div>

                        <div class="col-md-3">
                            <label for="ho-tro-tien-ve" class="form-label">Hỗ trợ tiền vé</label>
                            <input type="number" class="form-control " id="ho-tro-tien-ve" name="ho_tro_tien_ve"
                                   placeholder="Nhập tiền hỗ trợ">
                        </div>

                        <!-- Tiền quay đầu -->
                        <div class="col-md-3">
                            <label for="tien-quay-dau" class="form-label">Tiền quay đầu</label>
                            <input type="number" class="form-control " id="tien-quay-dau" name="tien_quay_dau"
                                   placeholder="Nhập tiền quay đầu">
                        </div>

                        <!-- Tiền đi đường -->
                        <div class="col-md-3">
                            <label for="tien-di-duong" class="form-label">Tiền đi đường</label>
                            <input type="number" class="form-control " id="tien-di-duong" name="tien_di_duong"
                                   placeholder="Nhập tiền">
                        </div>


                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
                <button type="button" class="btn btn-primary btn-cap-nhat-cung-duong">Cập nhật</button>
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
                <a href="#" class="btn btn-success" data-bs-toggle="modal" data-bs-target="#them-cung-duong-modal">
                    <i class="icon-base ti tabler-plus me-1"></i>
                    Thêm cung đường
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
                        <th width="<?= trim($label) != 'Cung đường' ? '1%' : '' ?>">
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
                            <?php if ($content == 'stt'): ?>
                                <?php print $row_count + 1; ?>
                            <?php elseif (strpos($content, 'chuc_nang') !== FALSE): ?>
                                <div class="text-center">
                                    <?php
                                    $nid = str_replace('chuc_nang', '', $content);
                                    echo '
                                      <a class="text-warning btn-load-cung-duong" href="#" data-value="' . $nid . '" title="Sửa">
                                        <i class="icon-base ti tabler-edit me-1"></i>
                                      </a>
                                      <a class="text-danger btn-xoa-cung-duong" href="#" data-value="' . $nid . '" title="Xóa">
                                        <i class="icon-base ti tabler-trash me-1"></i>
                                      </a>
                                ';
                                    ?>
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
</div>

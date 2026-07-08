<?php $hangTau = getListDanhMuc('HÃNG TÀU');
$listNhaXeNgoai = getListDanhMuc('Nhà xe', 1);
$listXe = getAllPhuongTienBienKiemSoatAndTaiXe();
$listKhachHang = getListKhachHang();

?>
<div class="modal fade" id="trucking-nhap-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Cập nhật Trucking Nhập</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="updateForm">
                    <input type="hidden" id="nid" name="nid"/>
                    <div class="row g-3 mb-4">
                        <div class="col-md-3">
                            <label class="form-label" id="hang_tau">Hãng Tàu</label>
                            <select id="hang_tau" name="hang_tau" class="form-control">
                                <option value="">--Chọn--</option>
                                <?php foreach ($hangTau as $item) {
                                    echo '<option value="' . $item['nid'] . '">' . $item['title'] . '</option>';
                                } ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Số Chuyến</label>
                            <input id="so_chuyen" name="so_chuyen" class="form-control" placeholder="Nhập số chuyến">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Ngày tàu cập</label>
                            <input id="ngay_tau_den" name="ngay_tau_den" type="text" class="form-control">
                        </div>
                    </div>

                    <div id="containersForm" class="d-grid gap-3">
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="update-trucking-nhap">Lưu</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="xep-xe-hang-nhap-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Xếp xe </h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="xep-xe-hang-nhap-form">
                    <input type="hidden" name="nid" id="nid" value="">
                    <div>
                        <label for="ngay_van_chuyen" class="form-label">Ngày vận chuyển</label>
                        <input type="text" name="ngay_van_chuyen" id="ngay_van_chuyen" class="form-control">
                    </div>
                    <div>
                        <label for="phuongTien" class="form-label">Danh sách xe</label>
                        <select name="phuongTien" id="phuongTien" class="form-select">
                            <option value="">--Chọn xe--</option>
                            <?php foreach ($listXe as $nidXe => $info): ?>
                                <option value="<?= $nidXe ?>">
                                    <?= $info['bien_kiem_soat'] ?>
                                </option>
                            <?php endforeach; ?>
                            <option value="xe_ngoai">Xe ngoài</option>
                        </select>
                    </div>
                    <div id="block-thong-tin-tai-xe-moi" class="mt-3"></div>
                    <script>
                        var listXe = <?= json_encode($listXe, JSON_UNESCAPED_UNICODE) ?>;
                    </script>
                </form>
            </div>

            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-xep-xe-hang-nhap">Lưu</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="xep-xe-ngoai-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Xe ngoài</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="form-xep-xe-ngoai">
                    <input type="hidden" name="ngay_van_chuyen" id="ngay_van_chuyen" value="">
                    <input type="hidden" name="phuongTien" id="phuongTien" value="xe_ngoai">
                    <input type="hidden" name="nid" id="nid" value="">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label for="nha-xe" class="form-label">Nhà xe</label>
                            <select class="form-select" id="nha-xe" name="nha_xe">
                                <option value="">-- Chọn --</option>
                                <?php
                                foreach ($listNhaXeNgoai as $item) {
                                    echo '<option value="' . $item['nid'] . '">' . $item['title'] . '</option>';
                                }
                                ?>
                                <option value="add-nha-xe">Thêm nhà xe</option>
                            </select>
                        </div>
                        <div class="col-md-4 d-none" id="add_nha_xe">
                            <label for="nha_xe_moi" class="form-label">Thêm nhà xe</label>
                            <input type="text" class="form-control" id="nha_xe_moi" name="nha_xe_moi">
                        </div>
                        <div class="col-md-4">
                            <label for="bks" class="form-label">BKS</label>
                            <input type="text" class="form-control" id="bks" name="bks">
                        </div>
                        <div class="col-md-4" id="tai_xe">
                            <label for="tai-xe" class="form-label">Tài xế</label>
                            <input type="text" class="form-control" id="tai-xe" name="tai_xe">
                        </div>
                        <div class="col-md-4">
                            <label for="dien-thoai" class="form-label">Điện thoại</label>
                            <input type="text" class="form-control" id="dien-thoai" name="dien_thoai">
                        </div>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-xep-xe-hang-nhap">Lưu</a>
                <button type="button" class="btn btn-label-secondary btn-back">
                    Quay lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="xep-ngay-vc-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Xếp ngày vận chuyển</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="form-xep-ngay-vc">
                    <input type="hidden" name="nid" id="nid" value="">
                    <label for="ngay_vc">Xếp ngày</label>
                    <input type="text" name="ngay_van_chuyen" class="form-control" id="ngay_vc">
                </form>
            </div>

            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-xep-ngay-vc">Lưu</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="cuoc-hoan-cuoc-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Cược/Hoàn cược</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form id="form-cuoc-hoan-cuoc">
                    <div class="card shadow-sm mb-3">
                        <div class="card-body ">
                            <p class="mb-0 fs-5">
                                Số Bill: <span id="bill" class=" text-primary fs-5"></span>
                            </p>
                        </div>
                    </div

                    <hr>
                    <h6 class="mb-3">Danh sách cont</h6>
                    <table class="table table-bordered" id="list-container">
                        <thead>
                        <tr>
                            <th class="text-center" style="width: 20%;">Số Cont</th>
                            <th class="text-center" style="width: 20%;">Số Seal</th>
                            <th class="text-center" style="width: 20%;">Cược cont</th>
                            <th class="text-center" style="width: 20%;">Hoàn cược</th>
                            <th class="text-center" style="width: 15%;">STK</th>
                            <th style="width: 5%;"></th>
                        </tr>
                        </thead>
                        <tbody>

                        </tbody>
                    </table>

                </form>
            </div>

            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-cuoc-hoan-cuoc">Lưu</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="modal-update-hang-nhap" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Cập nhật hàng nhập</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Thông tin chung -->
                <form id="form-update-hang-nhap">
                    <input type="hidden" name="nid" id="nid" value="">
                    <div class="row mb-3 g-3">
                        <div class="col-md-2">
                            <label class="form-label" for="khach_hang">Khách hàng</label>
                            <?php $listKhachHang = getListKhachHang(); ?>
                            <select id="khach_hang" name="khach_hang" class="form-select">
                                <option value="">-- Chọn Khách hàng --</option>
                                <?php foreach ($listKhachHang as $node): ?>
                                    <option value="<?= $node['nid'] ?>">
                                        <?= $node['ho_ten'] ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label" for="hang_tau">Hãng tàu</label>
                            <select id="hang_tau" name="hang_tau" class="form-control">
                                <option value="">--Chọn--</option>
                                <?php foreach ($hangTau as $item) {
                                    echo '<option value="' . $item['nid'] . '">' . $item['title'] . '</option>';
                                } ?>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label" for="ten_tau">Tên tàu</label>
                            <input type="text" class="form-control" name="ten_tau" id="ten_tau">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label" for="so_chuyen">Số chuyến</label>
                            <input type="text" class="form-control" name="so_chuyen" id="so_chuyen">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label" for="ngay_tau_den">Ngày tàu đến</label>
                            <input type="text" class="form-control ngay_tau_den" name="ngay_tau_den" id="ngay_tau_den">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label" for="so_van_don">Số vận đơn</label>
                            <input type="text" class="form-control" name="so_van_don" id="so_van_don">
                        </div>
                    </div>
                    <!-- Bảng cont/seal -->
                    <table class="table table-bordered" id="tableContSeal">
                        <thead>
                        <tr>
                            <th>Số cont</th>
                            <th>Loại cont</th>
                            <th>Số seal</th>
                            <th>Điểm trả hàng</th>
                            <th>Ngày trả hàng</th>
                            <th>Tiền cược</th>
                            <th>Hoàn cược</th>
                            <th>Số bill</th>
                            <th>Xoá</th>
                        </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
                <button type="button" class="btn btn-primary update-trucking-nhap">Lưu</button>
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
        <div class="col-md-10">
            <div class="row g-0 justify-content-end" id="form-searching-trucking-nhap">
                <div class="col-md-3 me-1">
                    <input type="text" class="form-control" placeholder="Ngày vận chuyển"
                           id="search-ngay-van-chuyen-nhap"/>
                </div>
                <div class="col-md-2 me-1">
                    <select id="search-khach-hang-value" name="search-khach-hang-value" class="form-control">
                        <option value="">Tất cả khách trả</option>
                        <?php foreach ($listKhachHang as $khachHang): ?>
                            <option value="<?= $khachHang['nid'] ?>">
                                <?= $khachHang['ho_ten'] ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-2 me-1">
                    <a class="btn btn-outline-info w-100" id="btn-tim-kiem-trucking-nhap">
                        <i class="icon-base ti tabler-search me-1"></i> Tìm kiếm
                    </a>
                </div>
                <div class="col-md-2">
                    <a class="btn btn-primary w-100" href="#" id="btn-xuat-file-hang-nhap">
                        <i class="icon-base ti tabler-file-type-xls me-1"></i> Export
                    </a>
                </div>
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
                        <?php if ($field == 'field_chi_phi_json'): ?>
                            <th width="1%">DO</th>
                            <th width="1%">VS</th>
                            <th width="1%">PS<br/>Sửa chữa</th>
                            <th width="1%">Lưu<br/>cont</th>
                            <!--                            <th width="1%">Nâng<br/>cont</th>-->
                            <!--                            <th width="1%">Hạ<br/>cont</th>-->
                            <!--                            <th width="1%">Khác</th>-->
                            <!--                            <th width="1%"> Tổng</th>-->
                        <?php else: ?>
                            <th width="1%" scope="col">
                                <?php print $label; ?>
                            </th>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </tr>
                </thead>
            <?php endif; ?>
            <tbody>
            <?php foreach ($rows as $row_count => $row): ?>
                <tr>
                    <?php foreach ($row as $field => $content): ?>
                        <?php if ($field == 'field_chi_phi_json'): ?>
                            <?php
                            $chiPhi = json_decode($content, true);
                            $map = [];
                            if (is_array($chiPhi)) {
                                foreach ($chiPhi as $cp) {
                                    $map[$cp['ten']] = floatval($cp['tong_tien'])  ?? 0;
                                }
                            }
                            ?>
                            <td class="text-end"><?= number_format($map['DO'] ?? 0, 0, ',', '.'); ?></td>
                            <td class="text-end"><?= number_format($map['Vệ sinh'] ?? 0, 0, ',', '.'); ?></td>
                            <td class="text-end"><?= number_format($map['Phát sinh sửa chữa'] ?? 0, 0, ',', '.'); ?></td>
                            <td class="text-end"><?= number_format($map['Lưu cont'] ?? 0, 0, ',', '.'); ?></td>
<!--                        --><?php //elseif ($field == 'field_so_tien_cuoc' ||
//                            $field == 'field_da_hoan_cuoc' ||
//                            $field == 'field_khach_tra' ||
//                            $field == 'field_doanh_thu'): ?>
<!--                            <td>-->
<!--                                <div class="text-end">--><?php //= number_format(floatval($content)  ?? 0, 0, ',', '.') ?>
<!--                                </div>-->
<!--                            </td>-->
                        <?php elseif (strpos($content, 'ngay_van_chuyen') !== FALSE): ?>
                            <?php
                            $parts = explode(';', $content);
                            $nid_hang_nhap = $parts[1] ?? null;
                            $ngayVanChuyen = $parts[2] ?? null;
                            ?>
                            <td class="text-center">
                                <?php if (!empty($ngayVanChuyen) && is_numeric($ngayVanChuyen)): ?>
                                    <?= date("d-m-Y", (int)$ngayVanChuyen) ?>
                                <?php else: ?>
                                    <a href="#" class="text-warning" id="update-ngay-van-chuyen"
                                       data-value="<?= $nid_hang_nhap ?>">
                                        (Đang chờ)
                                    </a>
                                <?php endif; ?>
                            </td>

                        <?php elseif ($field == 'field_ngay_tau_den'): ?>
                            <td class="text-center">
                                <?= !empty($content) ? date("d-m-Y", (int)$content) : '' ?>
                            </td>
                        <?php elseif (strpos($content, 'stt') !== FALSE): ?>
                            <td class="text-center">
                                <?php
                                $nid_yeu_cau = explode(';', $content)[1];
                                $nid_hang_nhap = explode(';', $content)[2];
                                $ngayVanChuyen = explode(';', $content)[3];
                                $bill = explode(';', $content)[4];
                                $daXepXe = explode(';', $content)[5];
                                ?>
                                <span class="badge badge-outline-secondary"><?= $nid_hang_nhap ?></span>
                                <div class="dropdown">
                                    <button type="button"
                                            class="btn p-0 dropdown-toggle hide-arrow"
                                            data-bs-toggle="dropdown">
                                        <i class="icon-base ti tabler-settings-spark"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        <a class="dropdown-item btn-load-trucking-nhap" href="#"
                                           data-value="<?= $nid_yeu_cau ?>">
                                            <i class="icon-base ti tabler-edit me-1"></i>
                                            Cập nhật
                                        </a>
                                    </div>
                            </td>
                        <?php elseif (strpos($content, 'xep_xe') !== FALSE): ?>
                            <td class="text-center">
                                <?php
                                $xepXe = str_replace('xep_xe', '', $content);
                                if ($xepXe) {
                                    echo '<div class="text-success" title="Đã xếp"><i class="icon-base ti tabler-circle-check"></i></div>';
                                } else {
                                    echo '<div class="text-primary" title="Chưa xếp"><i class="icon-base ti tabler-truck"></i></div>';
                                }
                                ?>
                            </td>
                        <?php else: ?>
                            <td><?= $content; ?></td>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </tr>

            <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</div>

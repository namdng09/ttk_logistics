<?php $hangTau = getListDanhMuc('HÃNG TÀU');
$listNhaXeNgoai = getListDanhMuc('Nhà xe', 1);
$listXe = getAllPhuongTienBienKiemSoatAndTaiXe();
$listKhachHang = getListKhachHang();

?>

<div class="modal fade" id="chi-phi-d2d-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Cập nhật chi phí Door-to-Door</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <h5>Thông tin yêu cầu</h5>
                <div id="info-yeu-cau"></div>

                <form id="chi-phi-d2d-form">
                    <input type="hidden" id="nid" name="nid" value="">
                    <table class="table table-bordered align-middle mt-4">
                        <thead>
                        <tr>
                            <th style="width:30%">TÊN CHI PHÍ</th>
                            <th style="width:35%">SỐ TIỀN</th>
                            <th style="width:35%">SỐ HĐ</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>Giá cước</td>
                            <td><input type="number" name="gia_cuoc" id="gia_cuoc" class="form-control "></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Trucking HCM</td>
                            <td><input type="text" name="trucking_hcm" id="trucking_hcm" class="form-control "></td>
                            <td><input type="text" name="so_hd_trucking_hcm" id="so_hd_trucking_hcm"
                                       class="form-control"></td>
                        </tr>
                        <tr>
                            <td>Cước CY</td>
                            <td><input type="number" name="cuoc_cy" id="cuoc_cy" class="form-control "></td>
                            <td><input type="text" name="so_hd_cy" id="so_hd_cy" class="form-control"></td>
                        </tr>
                        <tr>
                            <td>Nâng hạ HP</td>
                            <td><input type="number" name="nang_ha_hp" id="nang_ha_hp" class="form-control "></td>
                            <td><input type="text" name="so_hd_nang_ha" id="so_hd_nang_ha" class="form-control"></td>
                        </tr>
                        <tr>
                            <td>Cước xe ( Trucking HP )</td>
                            <td><input type="number" name="cuoc_xe" id="cuoc_xe" class="form-control "></td>
                            <td><input type="text" name="so_hd_cuoc_xe" id="so_hd_cuoc_xe" class="form-control">
                            </td>
                        </tr>
                        <tr>
                            <td>Com hãng tàu</td>
                            <td><input type="number" name="com_hang_tau" id="com_hang_tau" class="form-control "></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Com KH</td>
                            <td><input type="number" name="com_kh" id="com_kh" class="form-control "></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Bảo hiểm</td>
                            <td><input type="number" name="bao_hiem" id="bao_hiem" class="form-control "></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Xe nâng</td>
                            <td><input type="number" name="xe_nang" id="xe_nang" class="form-control "></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Bốc xếp</td>
                            <td><input type="number" name="boc_xep" id="boc_xep" class="form-control "></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Khách ứng</td>
                            <td><input type="number" name="khach_ung" id="khach_ung" class="form-control "></td>
                            <td></td>
                        </tr>
                        </tbody>
                    </table>
                    <div class="mt-3">
                         <textarea name="khach_anh_toan" id="khach_anh_toan" rows="4" class="form-control"
                                   placeholder="Khách Anh Toàn"></textarea>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-chi-phi-d2d">Lưu</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
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
        <!--        <div class="col-md-10">-->
        <!--            <div class="row g-0 justify-content-end" id="form-searching-trucking-nhap">-->
        <!--                <div class="col-md-3 me-1">-->
        <!--                    <input type="text" class="form-control" placeholder="Ngày vận chuyển"-->
        <!--                           id="search-ngay-van-chuyen-nhap"/>-->
        <!--                </div>-->
        <!--                <div class="col-md-2 me-1">-->
        <!--                    <select id="search-khach-hang-value" name="search-khach-hang-value" class="form-control">-->
        <!--                        <option value="">Tất cả khách trả</option>-->
        <!--                        --><?php //foreach ($listKhachHang as $khachHang): ?>
        <!--                            <option value="--><?php //= $khachHang['nid'] ?><!--">-->
        <!--                                --><?php //= $khachHang['ho_ten'] ?>
        <!--                            </option>-->
        <!--                        --><?php //endforeach; ?>
        <!--                    </select>-->
        <!--                </div>-->
        <!--                <div class="col-md-2 me-1">-->
        <!--                    <a class="btn btn-outline-info w-100" id="btn-tim-kiem-trucking-nhap">-->
        <!--                        <i class="icon-base ti tabler-search me-1"></i> Tìm kiếm-->
        <!--                    </a>-->
        <!--                </div>-->
        <!--                <div class="col-md-2">-->
        <!--                    <a class="btn btn-primary w-100" href="#" id="btn-xuat-file-hang-nhap">-->
        <!--                        <i class="icon-base ti tabler-file-type-xls me-1"></i> Export-->
        <!--                    </a>-->
        <!--                </div>-->
        <!--            </div>-->
        <!--        </div>-->
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
                            <th width="1%">Cước trucking/<br>Nâng hạ HP</th>
                            <th width="1%">Cước CY</th>
                            <th width="1%">Trucking HCM</th>
                            <th width="1%">Cước xe<br>(Trucking HP)</th>
                            <th width="1%">Bảo hiểm</th>
                            <th width="1%">Xe nâng</th>
                            <th width="1%">Bốc xếp</th>
                            <th width="1%">Com kh</th>
                            <th width="1%">Com<br>hãng tàu</th>
                        <?php elseif ($field == 'field_ngay_van_chuyen'): ?>
                            <th width="1%">Ngày đóng/trả<br>(Trucking)</th>
                        <?php elseif ($field == 'field_ngay_tau'): ?>
                            <th width="1%"> Ngày tàu<br>chạy/về</th>
                        <?php elseif ($field == 'field_don_vi_book'): ?>
                            <th width="1%"> Đơn vị<br>book</th>
                        <?php elseif ($field == 'field_ket_hop_ha_vo'): ?>
                            <th width="1%">Kết hợp/<br>hạ vỏ</th>
                        <?php elseif ($field == 'field_don_vi_thanh_toan'): ?>
                            <th width="1%"> Đơn vị<br>thanh toán</th>
                        <?php elseif ($field == 'field_ngay_hang'): ?>
                            <th width="1%">Ngày giao/<br>đóng hàng</th>
                        <?php elseif ($field == 'field_diem_hang'): ?>
                            <th width="1%">Điểm giao/<br> đóng hàng</th>
                        <?php elseif ($field == 'field_nguoi_hang'): ?>
                            <th width="1%">Người giao/<br>đóng hàng</th>
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
                                foreach ($chiPhi as $key => $value) {
                                    // Bỏ qua key dạng số (ví dụ "0":1) vì không phải chi phí
                                    if (!is_numeric($key)) {
                                        $map[$key] = $value ;
                                    }
                                }
                            }
                            // Danh sách loại chi phí cần hiển thị (theo đúng thứ tự cột)
                            $fieldsChiPhi = [
                                'Nâng hạ HP',
                                'Cước CY',
                                'Trucking HCM',
                                'Cước xe',
                                'Bảo hiểm',
                                'Xe nâng',
                                'Bốc xếp',
                                'Com KH',
                                'Com hãng tàu',
                            ];
                            ?>
                            <?php foreach ($fieldsChiPhi as $ten): ?>
                                <td class="text-end"><?= !empty($map[$ten]) ? number_format($map[$ten], 3, ',', '.') : ''; ?></td>
                            <?php endforeach; ?>
                        <?php elseif ($field == 'field_ngay_van_chuyen'): ?>
                            <td class="text-center">
                                <?php if (!empty($content)): ?>
                                    <?= date("d-m-Y", (int)$content) ?>
                                <?php else: ?>
                                    <a href="#" class="text-warning" id="update-ngay-vc-d2d">(Đang chờ)</a>
                                <?php endif; ?>
                            </td>
                        <?php elseif ($field == 'field_ngay_hang' || $field == 'field_ngay_tau'): ?>
                            <td class="text-center">
                                <?= !empty($content) ? date("d-m-Y", (int)$content) : '' ?>
                            </td>
                        <?php elseif (strpos($content, 'stt') !== FALSE): ?>
                            <td class="text-center">
                                <?php
                                $nid_chi_tiet = explode(';', $content)[1];
                                $loai = explode(';', $content)[2];
                                $ngayVC = explode(';', $content)[3];
                                ?>
                                <span class="badge badge-outline-secondary"><?= $nid_chi_tiet ?></span>
                                <div class="dropdown">
                                    <button type="button"
                                            class="btn p-0 dropdown-toggle hide-arrow"
                                            data-bs-toggle="dropdown">
                                        <i class="icon-base ti tabler-settings-spark"></i>
                                    </button>
                                    <div class="dropdown-menu">
                                        <a class="dropdown-item btn-cap-nhat-chi-phi" href="#"
                                           data-value="<?= $nid_chi_tiet ?>">
                                            <i class="icon-base ti tabler-edit me-1"></i>
                                            Cập nhật chí phí
                                        </a>
                                        <?php if ($loai == 'Xuất'): ?>
                                            <a class="dropdown-item btn-xep-xe-d2d" href="#"
                                               data-value="<?= $nid_chi_tiet ?>" data-date="<?= $ngayVC ?>">
                                                <i class="icon-base ti tabler-truck me-1"></i>
                                                Xếp xe
                                            </a>
                                        <?php endif; ?>
                                    </div>
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
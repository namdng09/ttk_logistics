<?php $tai_xe_list = getTaiXe();
$listNhaXeNgoai = getListDanhMuc('Nhà xe', 1);
$xeNoiBo = getAllPhuongTienBienKiemSoat();
$customers = getListKhachHang();
?>

<style>
    /*
     * Flatpickr trong modal sửa yêu cầu cần z-index cao hơn modal/footer.
     * Calendar được append ra body bằng JS nên không bị .modal-body cắt mất.
     */
    .flatpickr-calendar.flatpickr-sua-yeu-cau,
    .flatpickr-calendar.open {
        z-index: 20000 !important;
    }
</style>


<div class="modal fade" id="sua-yeu-cau-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Sửa thông tin yêu cầu</h5>
                <button type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Đóng"></button>
            </div>
            <div class="modal-body"></div>
            <div class="modal-footer">
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng
                </button>
                <button type="button" class="btn btn-primary" id="btn-luu-sua-yeu-cau">
                    <i class="icon-base ti tabler-device-floppy me-1"></i>
                    Lưu thông tin
                </button>
            </div>
        </div>
    </div>
</div>


<div class="modal fade" id="thay-doi-cung-duong-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-xl">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Thay đổi cung đường</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form>
                    <h5>Chọn cung đường cần thay đổi</h5>
                    <div id="block-cung-duong-can-thay-doi">

                    </div>
                    <h5>Chọn cung đường mới</h5>
                    <div class="row">
                        <div class="col-md-3 mb-3">
                            <label for="diem-di-change-cung-duong" class="form-label">Điểm đi</label>
                            <select class="form-select" id="diem-di-change-cung-duong" name="diem_di_change_cung_duong">
                                <option value="">-- Chọn --</option>

                            </select>
                        </div>

                        <div class="col-md-3 mb-3">
                            <label for="diem-den-change-cung-duong" class="form-label">Điểm đến</label>
                            <select class="form-select" id="diem-den-change-cung-duong"
                                    name="diem_den_change_cung_duong">
                                <option value="">-- Chọn --</option>

                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label for="dia-chi-change-cung-duong" class="form-label">Địa chỉ</label>
                            <input type="text" name="dia_chi_change_cung_duong" id="dia-chi-change-cung-duong"
                                   class="form-control">
                        </div>
                    </div>

                    <!-- Input hidden -->
                    <input type="hidden" id="nid_don_hang_thay_doi_cung_duong" name="nid_don_hang" value="">
                    <input type="hidden" id="selectedCungDuong" name="selectedCungDuong" value="">

                </form>
            </div>
            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-cung-duong-moi">Lưu cung đường mới</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="modal-change-chu-xe" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Thay đổi chủ xe</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <form>
                    <h5>Thông tin chủ xe</h5>
                    <div id="block-thong-tin-chu-xe">

                    </div>
                    <h5>Chọn chủ xe mới</h5>

                    <label for="chu-xe-moi" class="form-label">Chủ xe</label>
                    <select class="form-select" id="chu-xe-moi" name="chu_xe_moi">
                        <option value="">-- Chọn --</option>

                    </select>

                    <div id="block-thong-tin-tai-xe-moi" class="mt-3"></div>
                    <input type="hidden" id="nid-chuyen-xe-change-chu-xe-moi" name="nid_chuyen_xe_change_chu_xe_moi"
                           value="">
                </form>
            </div>
            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-chu-xe-moi">Lưu chủ xe mới</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="thoi-gian-lay-hang-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Cập nhật thời gian lấy hàng</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <h5>Thông tin chuyến xe</h5>
                <div id="info-chuyen-xe">

                </div>
                <form id="thoi-gian-lay-hang-form">
                    <h5>Chọn cung đường cập nhật</h5>
                    <div id="block-cung-duong-can-thay-doi">

                    </div>
                    <h5>Ngày lấy hàng</h5>
                    <div class="row">
                        <div class="col-md-12 mb-3">
                            <input type="text" class="form-control" id="thoi-gian-lay-hang" name="thoi_gian_lay_hang">
                        </div>
                    </div>

                    <!-- Input hidden -->
                    <input type="hidden" id="nid" name="nid" value="">

                </form>
            </div>
            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-thoi-gian-lay-hang">Lưu thời gian</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="chi-phi-modal" tabindex="-1" role="dialog" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">

      <div class="modal-header bg-light border-bottom">
        <div>
          <h5 class="modal-title fw-bold mb-0">Cập nhật chi phí, doanh thu và đổ dầu</h5>
          <small class="text-muted">Quản lý chi phí chuyến xe, doanh thu khách trả và thông tin nhiên liệu</small>
        </div>

        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"></button>
      </div>

      <div class="modal-body bg-light">
        <input type="hidden" id="nid-chuyen-xe-chi-phi-do-dau" name="nid" value="">

        <!-- THÔNG TIN CHUYẾN XE -->
        <div class="card border-0 shadow-sm mb-3">
          <div class="card-header bg-white">
            <h6 class="mb-0 fw-bold">Thông tin chuyến xe</h6>
          </div>
          <div class="card-body">
            <div id="block-cung-dong-tra">
              <div class="row">
                <div class="col-md-6">
                  <strong>Trả Khách hàng: </strong> <span id="tra-khach-hang">........</span>
                  <div><strong>Cung đường:</strong> <span id="cung-duong-tra">........</span>, <strong>Số cont: </strong><span id="so-cont-tra">.......</span></div>
                </div>
                <div class="col-md-6">
                  <strong>Khách hàng đóng: </strong> <span id="khach-hang-dong">........</span>
                  <div><strong>Cung đường:</strong> <span id="cung-duong-dong">........</span>, <strong>Số cont: </strong><span id="so-cont-dong">.......</span></div>
                </div>
              </div>
            </div>
            <div id="info-chuyen-xe"></div>
          </div>
        </div>

        <div class="row g-3">

          <!-- KHỐI CHI PHÍ + DOANH THU -->
          <div class="col-md-8">
            <form id="chi-phi-form">

              <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-white d-flex align-items-center justify-content-between">
                  <h6 class="mb-0 fw-bold">Cập nhật chi phí</h6>
                </div>

                <div class="card-body">
                  <div class="row g-1">

                    <div class="col-md-3">
                      <div class="row g-1">
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Tiền vé</label>
                          <input
                            type="text"
                            inputmode="numeric"
                            class="form-control form-control-sm format-money"
                            placeholder="Nhập tiền vé"
                            id="tien_ve"
                            name="tien_ve">
                        </div>

                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Tiền đi đường</label>
                          <input
                            type="text"
                            inputmode="numeric"
                            class="form-control form-control-sm format-money"
                            placeholder="Nhập tiền đi đường"
                            id="tien_duong"
                            name="tien_duong">
                        </div>
                      </div>
                    </div>

                    <div class="col-md-3">
                      <div class="row g-1">
                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Vé tháng</label>
                          <input
                            type="text"
                            inputmode="numeric"
                            class="form-control form-control-sm format-money"
                            placeholder="Nhập vé tháng"
                            id="ve_thang"
                            name="ve_thang">
                        </div>

                        <div class="col-md-6">
                          <label class="form-label fw-semibold">Kết hợp</label>
                          <input
                            type="text"
                            inputmode="numeric"
                            class="form-control form-control-sm format-money"
                            placeholder="Nhập kết hợp"
                            id="ket_hop"
                            name="ket_hop">
                        </div>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <label class="form-label fw-semibold">Số trạm</label>
                      <input
                        type="number"
                        class="form-control form-control-sm"
                        id="so_tram"
                        name="so_tram"
                        value="">
                    </div>

                    <div class="col-md-2 d-none" id="box-tien-ve-so-sanh">
                      <label class="form-label fw-semibold">Tiền vé chuyến xe</label>
                      <input
                        type="text"
                        class="form-control form-control-sm format-money"
                        id="tien_ve_so_sanh"
                        name="tien_ve_so_sanh"
                        readonly>
                    </div>

                  </div>
                </div>
              </div>

              <!-- CHI PHÍ PHÁT SINH -->
              <div class="card border-0 shadow-sm mb-3" id="phat_sinh">
                <div class="card-header bg-white d-flex align-items-center justify-content-between">
                  <h6 class="mb-0 fw-bold">Chi phí phát sinh</h6>
                </div>

                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-bordered table-sm align-middle mb-0 table-phat-sinh">
                      <thead class="table-light">
                      <tr>
                        <th class="text-center">Đơn giá</th>
                        <th class="text-center">Số lượng</th>
                        <th class="text-center">Tổng</th>
                        <th class="text-center">ĐG VAT</th>
                        <th class="text-center">VAT (%)</th>
                        <th class="text-center">Tổng sau VAT</th>
                        <th class="text-center">Thêm</th>
                        <th class="text-center">Xóa</th>
                      </tr>
                      </thead>

                      <!-- JS sẽ render tbody.phat-sinh-item tại đây -->

                      <tfoot class="table-light fw-bold">
                      <tr>
                        <td colspan="2" class="fs-6">Tổng cộng:</td>
                        <td class="text-end text-primary fs-6 tong-chua-vat" id="tong-chua-vat">0</td>
                        <td></td>
                        <td></td>
                        <td class="text-end text-success fs-6 tong-sau-vat" id="tong-sau-vat">0</td>
                        <td colspan="2"></td>
                      </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>

              <!-- DOANH THU -->
              <div id="khach-tra" class="card border-0 shadow-sm">
                <div class="card-header bg-white">
                  <h6 class="mb-0 fw-bold text-uppercase">Doanh thu</h6>
                </div>

                <div class="card-body">
                  <div class="row g-3">

                    <!-- Khách trả hàng trả -->
                    <div class="col-md-6 d-none" id="da_co_don_tra">
                      <div class="card h-100 border">
                        <div class="card-header bg-light">
                          <h6 class="mb-0 fw-bold">Khách trả hàng trả</h6>
                        </div>

                        <div class="card-body">
                          <div class="row g-3">
                            <div class="col-md-4">
                              <label class="form-label fw-semibold">Số tiền</label>
                              <input
                                type="text"
                                inputmode="numeric"
                                class="form-control form-control-sm format-money"
                                placeholder="Nhập tiền"
                                name="khach_tra_tra"
                                id="khach_tra_tra">
                            </div>

                            <div class="col-md-4">
                              <label class="form-label fw-semibold">Số tiền (+VAT)</label>
                              <input
                                type="text"
                                inputmode="numeric"
                                class="form-control form-control-sm format-money"
                                placeholder="Nhập tiền"
                                name="khach_tra_vat_tra"
                                id="khach_tra_vat_tra">
                            </div>

                            <div class="col-md-4">
                              <label class="form-label fw-semibold">Doanh thu trả</label>
                              <input
                                type="text"
                                inputmode="numeric"
                                class="form-control form-control-sm fw-bold format-money"
                                placeholder="Doanh thu trả"
                                name="doanh_thu_tra"
                                id="doanh_thu_tra">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Khách trả hàng đóng -->
                    <div class="col-md-6 d-none" id="da_co_don_dong">
                      <div class="card h-100 border">
                        <div class="card-header bg-light">
                          <h6 class="mb-0 fw-bold">Khách trả hàng đóng</h6>
                        </div>

                        <div class="card-body">
                          <div class="row g-3">
                            <div class="col-md-4">
                              <label class="form-label fw-semibold">Số tiền</label>
                              <input
                                type="text"
                                inputmode="numeric"
                                class="form-control form-control-sm format-money"
                                placeholder="Nhập tiền"
                                name="khach_tra_dong"
                                id="khach_tra_dong">
                            </div>

                            <div class="col-md-4">
                              <label class="form-label fw-semibold">Số tiền (+VAT)</label>
                              <input
                                type="text"
                                inputmode="numeric"
                                class="form-control form-control-sm format-money"
                                placeholder="Nhập tiền"
                                name="khach_tra_vat_dong"
                                id="khach_tra_vat_dong">
                            </div>

                            <div class="col-md-4">
                              <label class="form-label fw-semibold">Doanh thu đóng</label>
                              <input
                                type="text"
                                inputmode="numeric"
                                class="form-control form-control-sm fw-bold format-money"
                                placeholder="Doanh thu đóng"
                                name="doanh_thu_dong"
                                id="doanh_thu_dong">
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- PHÁT SINH HÀNG TRẢ -->
                    <div class="col-md-12 card border-0 shadow-sm mb-3 d-none" id="phat_sinh_tra">
                      <div class="card-header bg-white d-flex align-items-center justify-content-between">
                        <h6 class="mb-0 fw-bold text-primary">Phát sinh hàng trả</h6>
                      </div>

                      <div class="card-body p-0">
                        <div class="table-responsive">
                          <table class="table table-bordered table-sm align-middle mb-0 table-phat-sinh">
                            <thead class="table-light">
                            <tr>
                              <th class="text-center">Đơn giá</th>
                              <th class="text-center">Số lượng</th>
                              <th class="text-center">Tổng</th>
                              <th class="text-center">ĐG VAT</th>
                              <th class="text-center">VAT (%)</th>
                              <th class="text-center">Tổng sau VAT</th>
                              <th class="text-center">Thêm</th>
                              <th class="text-center">Xóa</th>
                            </tr>
                            </thead>

                            <tfoot class="table-light fw-bold">
                            <tr>
                              <td colspan="2" class="fs-6">Tổng phát sinh hàng trả:</td>
                              <td class="text-end text-primary fs-6 tong-chua-vat">0</td>
                              <td></td>
                              <td></td>
                              <td class="text-end text-success fs-6 tong-sau-vat">0</td>
                              <td colspan="2"></td>
                            </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>

                    <!-- PHÁT SINH HÀNG ĐÓNG -->
                    <div class="col-md-12 card border-0 shadow-sm mb-3 d-none" id="phat_sinh_dong">
                      <div class="card-header bg-white d-flex align-items-center justify-content-between">
                        <h6 class="mb-0 fw-bold text-success">Phát sinh hàng đóng</h6>
                      </div>

                      <div class="card-body p-0">
                        <div class="table-responsive">
                          <table class="table table-bordered table-sm align-middle mb-0 table-phat-sinh">
                            <thead class="table-light">
                            <tr>
                              <th class="text-center">Đơn giá</th>
                              <th class="text-center">Số lượng</th>
                              <th class="text-center">Tổng</th>
                              <th class="text-center">ĐG VAT</th>
                              <th class="text-center">VAT (%)</th>
                              <th class="text-center">Tổng sau VAT</th>
                              <th class="text-center">Thêm</th>
                              <th class="text-center">Xóa</th>
                            </tr>
                            </thead>

                            <tfoot class="table-light fw-bold">
                            <tr>
                              <td colspan="2" class="fs-6">Tổng phát sinh hàng đóng:</td>
                              <td class="text-end text-primary fs-6 tong-chua-vat">0</td>
                              <td></td>
                              <td></td>
                              <td class="text-end text-success fs-6 tong-sau-vat">0</td>
                              <td colspan="2"></td>
                            </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

          <!-- KHỐI ĐỔ DẦU -->
          <div class="col-md-4">
            <form id="oil-form">
              <input type="hidden" id="action" name="action" value="create">
              <input type="hidden" id="nid_chuyen_xe_do_dau" value="" name="nid_chuyen_xe_do_dau">
              <input type="hidden" id="phuong_tien" value="" name="phuong_tien">

              <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-white">
                  <h6 class="mb-0 fw-bold">Thông tin đổ dầu</h6>
                </div>

                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-12">
                      <label for="ngay_do_dau_time" class="form-label fw-semibold">Ngày đổ dầu</label>
                      <input
                        type="datetime-local"
                        id="ngay_do_dau_time"
                        name="field_ngay_do_dau_time"
                        class="form-control form-control-sm">
                    </div>

                    <div class="col-md-6">
                      <label for="km_dau" class="form-label fw-semibold">KM đầu</label>
                      <input
                        type="number"
                        step="0.01"
                        id="km_dau"
                        name="field_km_dau"
                        class="form-control form-control-sm calc bg-light"
                        min="0"
                        inputmode="decimal"
                        readonly>
                    </div>

                    <div class="col-md-6">
                      <label for="km_cuoi" class="form-label fw-semibold">KM hiện tại</label>
                      <input
                        type="number"
                        step="0.01"
                        id="km_cuoi"
                        name="field_km_cuoi"
                        class="form-control form-control-sm calc"
                        min="0"
                        inputmode="decimal">
                    </div>

                    <div class="col-md-6">
                      <label for="dinh_muc" class="form-label fw-semibold">Định mức dầu</label>
                      <div class="input-group input-group-sm">
                        <input
                          type="number"
                          step="0.0001"
                          id="dinh_muc"
                          name="field_dinh_muc_nhien_lieu"
                          class="form-control calc"
                          min="0"
                          inputmode="decimal">
                        <span class="input-group-text">l/100km</span>
                      </div>
                    </div>

                    <div class="col-md-6" id="box-dinh-muc-khong-hang">
                      <label for="dinh_muc_khong_hang" class="form-label fw-semibold">Định mức không hàng</label>
                      <div class="input-group input-group-sm">
                        <input
                          type="number"
                          step="0.0001"
                          id="dinh_muc_khong_hang"
                          name="field_dinh_muc_khong_hang"
                          class="form-control calc"
                          min="0"
                          inputmode="decimal">
                        <span class="input-group-text">l/100km</span>
                      </div>
                    </div>

                    <div class="col-md-6" id="box-km-tra-rong">
                      <label for="km_tra_rong" class="form-label fw-semibold">KM trả rỗng</label>
                      <input
                        type="number"
                        step="0.01"
                        id="km_tra_rong"
                        name="field_km_tra_rong"
                        class="form-control form-control-sm calc"
                        min="0"
                        inputmode="decimal">
                    </div>

                    <div class="col-md-6">
                      <label for="vat" class="form-label fw-semibold">VAT</label>
                      <div class="input-group input-group-sm">
                        <input
                          type="number"
                          step="0.01"
                          id="vat"
                          name="field_vat"
                          class="form-control calc"
                          min="0"
                          inputmode="decimal">
                        <span class="input-group-text">%</span>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <label for="field_don_gia_dau" class="form-label fw-semibold">Đơn giá dầu (+VAT)</label>
                      <input
                        type="text"
                        inputmode="numeric"
                        id="field_don_gia_dau"
                        name="field_don_gia_dau"
                        class="form-control form-control-sm calc format-money"
                        min="0">
                    </div>

                    <div class="col-md-6">
                      <label for="so_lit_dau" class="form-label fw-semibold">Số dầu thực tế</label>
                      <div class="input-group input-group-sm">
                        <input
                          type="number"
                          step="0.01"
                          id="so_lit_dau"
                          name="field_so_lit_dau"
                          class="form-control calc"
                          min="0"
                          inputmode="decimal">
                        <span class="input-group-text">lít</span>
                      </div>
                    </div>

                    <div class="col-md-12">
                      <label for="so_dau_dinh_muc" class="form-label fw-semibold">Số dầu định mức</label>
                      <input
                        type="number"
                        step="0.01"
                        id="so_dau_dinh_muc"
                        name="field_so_dau_dinh_muc"
                        class="form-control form-control-sm money"
                        readonly>
                    </div>
                  </div>
                </div>
              </div>

              <!-- CHÊNH LỆCH -->
              <div class="card border-0 shadow-sm mb-3">
                <div class="card-header bg-white">
                  <h6 class="mb-0 fw-bold">Chênh lệch</h6>
                </div>

                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-4">
                      <div class="border rounded-3 p-2 h-100 bg-light">
                        <small class="text-muted d-block">Chênh lệch lít</small>
                        <h6 id="so-lit-dau-chenh-lech" class="mb-0 fw-bold">0</h6>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="border rounded-3 p-2 h-100 bg-light">
                        <small class="text-muted d-block">Chưa VAT</small>
                        <h6 id="so-tien-chenh-lech-chua-co-vat" class="mb-0 fw-bold">0</h6>
                      </div>
                    </div>

                    <div class="col-md-4">
                      <div class="border rounded-3 p-2 h-100 bg-light">
                        <small class="text-muted d-block">Có VAT</small>
                        <h6 id="so-tien-chenh-lech-da-co-vat" class="mb-0 fw-bold">0</h6>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- TỔNG TIỀN -->
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-white">
                  <h6 class="mb-0 fw-bold">Tổng tiền dầu</h6>
                </div>

                <div class="card-body">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="border rounded-3 p-3 h-100">
                        <h6 class="fw-bold mb-3">Thực tế</h6>

                        <div class="mb-2">
                          <small class="text-muted d-block">Đã có VAT</small>
                          <h6 id="tong-tien-do-dau-thuc-te-da-co-vat" class="mb-0 text-success fw-bold">0 VNĐ</h6>
                        </div>

                        <div>
                          <small class="text-muted d-block">Chưa có VAT</small>
                          <h6 id="tong-tien-do-dau-thuc-te-chua-co-vat" class="mb-0 text-primary fw-bold">0 VNĐ</h6>
                        </div>
                      </div>
                    </div>

                    <div class="col-md-6">
                      <div class="border rounded-3 p-3 h-100">
                        <h6 class="fw-bold mb-3">Định mức</h6>

                        <div class="mb-2">
                          <small class="text-muted d-block">Đã có VAT</small>
                          <h6 id="tong-tien-do-dau-dinh-muc-da-co-vat" class="mb-0 text-success fw-bold">0 VNĐ</h6>
                        </div>

                        <div>
                          <small class="text-muted d-block">Chưa có VAT</small>
                          <h6 id="tong-tien-do-dau-dinh-muc-chua-co-vat" class="mb-0 text-primary fw-bold">0 VNĐ</h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </form>
          </div>

        </div>
      </div>

      <div class="modal-footer bg-white">
        <a href="#" class="btn btn-primary" id="luu-chi-phi">
          Lưu
        </a>

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
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label for="nha-xe" class="form-label">Nhà xe</label>
                            <select class="form-select" id="nha-xe" name="nha_xe">
                                <option value="">-- Chọn --</option>
                                <?php
                                foreach ($listNhaXeNgoai as $item) {
                                    echo '<option value="' . $item['nid'] . '" >' . $item['title'] . '</option>';
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
                <a href="#" class="btn btn-primary" id="luu-xep-xe-ngoai">Lưu</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="chi-phi-xe-ngoai-modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Cập nhật chi phí xe ngoài</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <!-- Modal Body -->
            <div class="modal-body">
                <h5>Thông tin chuyến xe</h5>
                <div id="info-chuyen-xe"></div>

                <form id="chi-phi-xe-ngoai-form">
                    <input type="hidden" id="nid" name="nid" value="">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="p-3 mt-2">
                                <div class="row g-3">
                                    <div class="col-md-6">
                                        <h6>Cước xe</h6>
                                        <input type="number" class="form-control" placeholder="Nhập cước xe "
                                               name="cuoc_xe_ngoai" id="cuoc_xe_ngoai">
                                    </div>
                                </div>
                                <div id="khach-tra" class="mt-2">
                                    <div class="row g-2 mb-3">
                                        <div class="d-none" id="da_co_don_tra">
                                            <h6 class="fs-bold">Khách trả hàng trả</h6>
                                            <div class="row g-2">
                                                <div class="col-md-4">
                                                    <label class="form-label">Số tiền</label>
                                                    <input type="number" class="form-control"
                                                           placeholder="Nhập tiền" name="khach_tra_tra"
                                                           id="khach_tra_tra">
                                                </div>
                                                <div class="col-md-4 mt-2">
                                                    <label class="form-label">Số tiền (+VAT)</label>
                                                    <input type="number" class="form-control"
                                                           name="khach_tra_vat_tra"
                                                           id="khach_tra_vat_tra" placeholder="Nhập tiền">
                                                </div>
                                                <div class="col-md-4 mt-2">
                                                    <label class="form-label">Phát sinh trả</label>
                                                    <input type="number" class="form-control"
                                                           name="phat_sinh_tra"
                                                           id="phat_sinh_tra">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="d-none" id="da_co_don_dong">
                                            <h6 class="fs-bold">Khách trả hàng đóng</h6>
                                            <div class="row g-2">
                                                <div class="col-md-4">
                                                    <label class="form-label">Số tiền</label>
                                                    <input type="number" class="form-control"
                                                           placeholder="Nhập tiền" name="khach_tra_dong"
                                                           id="khach_tra_dong">
                                                </div>
                                                <div class="col-md-4 mt-2">
                                                    <label class="form-label">Số tiền (+VAT)</label>
                                                    <input type="number" class="form-control"
                                                           name="khach_tra_vat_dong"
                                                           id="khach_tra_vat_dong"
                                                           placeholder="Nhập tiền">
                                                </div>
                                                <div class="col-md-4 mt-2">
                                                    <label class="form-label">Phát sinh đóng</label>
                                                    <input type="number" class="form-control"
                                                           name="phat_sinh_dong"
                                                           id="phat_sinh_dong">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div class="row" id="doanh-thu">
                                    <div class="col-md-6 d-none" id="doanh-thu-tra">
                                        <h6>Doanh thu hàng trả </h6>
                                        <input type="number" class="form-control" placeholder="Doanh thu trả"
                                               name="doanh_thu_tra" id="doanh_thu_tra">
                                    </div>
                                    <div class="col-md-6 d-none" id="doanh-thu-dong">
                                        <h6>Doanh thu hàng đóng</h6>
                                        <input type="number" class="form-control" placeholder="Doanh thu đóng"
                                               name="doanh_thu_dong" id="doanh_thu_dong">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-8">
                            <!-- PHẦN 2: BẢNG CHI PHÍ PHÁT SINH -->
                            <div id="phat_sinh" class="p-3 mt-2">
                                <h5>Chi phí phát sinh</h5>
                                <table class="table table-bordered align-middle">
                                    <thead>
                                    <tr>
                                        <th style="width: 20%">Tên</th>
                                        <th style="width: 15%" class="text-end">Đơn giá</th>
                                        <th style="width: 15%" class="text-end">ĐG VAT</th>
                                        <th style="width: 10%" class="text-center">Số lượng</th>
                                        <th style="width: 16%" class="text-end">Tổng</th>
                                        <th style="width: 10%" class="text-end">VAT (%)</th>
                                        <th style="width: 20%" class="text-end">Tổng sau VAT</th>
                                        <th class="text-center"></th>
                                        <th class="text-center"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    <tr>
                                        <td><input type="text" class="form-control" placeholder="Nhập tên"
                                                   name="phat_sinh_ten[]" id="phat_sinh_ten"></td>
                                        <td><input type="number" class="form-control" name="phat_sinh_don_gia[]"
                                                   id="phat_sinh_don_gia"></td>
                                        <td><input type="number" class="form-control"
                                                   id="phat_sinh_don_gia_vat"></td>
                                        <td><input type="number" class="form-control" name="phat_sinh_so_luong[]"
                                                   id="phat_sinh_so_luong"></td>
                                        <td><input type="number" class="form-control tong" name="phat_sinh_tong[]"
                                                   id="phat_sinh_tong"></td>
                                        <td><input type="number" class="form-control" name="phat_sinh_vat[]"
                                                   id="phat_sinh_vat"></td>
                                        <td><input type="number" class="form-control tong_vat"
                                                   name="phat_sinh_tong_vat[]" id="phat_sinh_tong_vat"></td>
                                        <td class="text-center">
                                            <a href="#" class="text-success btn-add"><i
                                                        class="icon-base ti tabler-circle-plus"></i></a>
                                        </td>
                                        <td class="text-center">
                                            <a href="#" class="text-success btn-remove"><i
                                                        class="icon-base ti tabler-circle-minus"></i></a>
                                        </td>
                                    </tr>
                                    </tbody>
                                    <tfoot class="bg-light fw-bold border-top border-3">
                                    <tr>
                                        <td colspan="4" class="fs-5">Tổng cộng:</td>
                                        <td class="text-end text-primary fs-5" id="tong-chua-vat">0</td>
                                        <td></td>
                                        <td class="text-end text-success fs-5" id="tong-sau-vat">0</td>
                                        <td colspan="2"></td>
                                    </tr>
                                    </tfoot>
                                </table>
                            </div>

                        </div>
                    </div>
                </form>
            </div>

            <div class="modal-footer">
                <a href="#" class="btn btn-primary" id="luu-chi-phi-xe-ngoai">Lưu</a>
                <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">
                    Đóng lại
                </button>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" style="z-index: 2000;" id="modal-export-excel-trucking" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 id="exampleModalLabel4">Xuất File Excel</h5>
                <button
                        type="button"
                        class="btn-close"
                        data-bs-dismiss="modal"
                        aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form id="excel-export-trucking-form">
                    <div class="row">
                        <input type="hidden" name="booking_type">
                        <div class="col-md-12">
                            <label class="form-label h6" for="bien_kiem_soat">Biển kiểm soát xe</label>
                            <select id="bien_kiem_soat" name="bien_kiem_soat" class="form-control ms-2">
                                <option value="">Tất cả BKS</option>
                                <?php foreach ($xeNoiBo as $nid => $value): ?>
                                    <option value="<?= $nid ?>"><?= $value ?></option>
                                <?php endforeach; ?>
                                <option value="xe_ngoai">Xe ngoài</option>
                            </select>
                        </div>
                        <div class="col-md-12 mt-3">
                            <label class="form-label h6" for="created_fillter">Thời gian vận chuyển</label>
                            <input type="text" id="created_fillter" name="time_fillter" class="form-control ms-2">
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary me-2" id="btn-xuat-file-trucking" tabindex="0"
                        aria-controls="DataTables_Table_0" type="button">
                    <span>
                         <span class="d-flex align-items-center gap-2">
                              <i class="icon-base ti tabler-file-arrow-right icon-sm"></i>
                              <span class="d-none d-sm-inline-block">Xuất excel</span>
                         </span>
                    </span>
                </button>
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
        <div class="col-md-10">
            <div class="row g-0 justify-content-end" id="form-searching-trucking">
                <div class="col-md-2 me-1">
                    <select name="customer" id="customer_dong" class="form-select form-select-sm">
                        <option value="">Tất cả khách</option>
                        <?php foreach ($customers as $customer): ?>
                            <option value="<?= $customer['nid'] ?>">
                                <?= htmlspecialchars($customer['ho_ten']) ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="col-md-2 me-1">
                    <select id="search-bien-kiem-soat-value" name="search-bien-kiem-soat-value"
                            class="form-control form-control-sm">
                        <option value="">Tất cả BKS</option>
                        <?php foreach ($xeNoiBo as $nid => $value): ?>
                            <option value="<?= $nid ?>"><?= $value ?></option>
                        <?php endforeach; ?>
                        <option value="xe_ngoai">Xe ngoài</option>
                    </select>
                </div>
                <div class="col-md-2 d-none me-1" id="xe_ngoai">
                    <input type="text" class="form-control form-control-sm" placeholder="BKS xe ngoài"
                           id="search-bks-xe-ngoai"/>
                </div>
                <div class="col-md-3 me-1">
                    <input type="text" class="form-control form-control-sm" placeholder="Ngày vận chuyển"
                           id="search-ngay-van-chuyen"/>
                </div>
            </div>

            <div class="d-flex mt-2 justify-content-end">
                <div class="me-1">
                    <a class="btn btn-outline-info" id="btn-tim-kiem-trucking">
                        <i class="icon-base ti tabler-filter me-1"></i> Lọc
                    </a>
                </div>
                <div class="me-1">
                    <a class="export-excel-trucking btn btn-primary" href="#" id="btn-export-excel-trucking-xe-nha"
                       data-value="xe_nha">
                        Hạch toán xe
                    </a>
                </div>
                <div class="me-1">
                    <a class="btn btn-primary" href="#" id="btn-export-excel-tra-khach">
                        Trả khách
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="table-responsive text-nowrap">
        <table class="table table-bordered text-nowrap" id="table-hack-toan-trucking">
            <?php if (!empty($title) || !empty($caption)): ?>
                <caption><?php print $caption . $title; ?></caption>
            <?php endif; ?>
            <?php if (!empty($header)) : ?>
                <thead>
                <tr>
                    <?php foreach ($header as $field => $label): ?>
                        <!--Chi phí -->
                        <?php if ($field == 'nothing_1'): ?>
                            <th width="1%">Tiền<br/>đường</th>
                            <th width="1%">Tiền <br/>Vé</th>
                            <th width="1%">Vé <br/>tháng</th>
                            <th width="1%"> Lương</th>
                            <th width="1%"> Kết <br/>hợp</th>
                            <th width="1%"> Dầu</th>
                            <th width="1%"> Phát <br/>sinh</th>
                            <th width="1%"> Tổng</th>
                            <th width="1%"> DT trả </th>
                            <th width="1%"> DT đóng</th>
                            <th width="1%"> DT<br/>Phát sinh</th>
                            <th width="1%"> Doanh<br/>thu</th>
                            <th width="1%"> Lợi<br/>nhuận</th>
                        <?php elseif ($field == 'field_cung_duong_dong_tra'): ?>
                            <th>Số container</th>
                        <?php elseif ($field == 'field_bien_kiem_soat'): ?>
                            <th>Chủ xe</th>
                            <th>Cung đường</th>
                        <?php elseif ($field == 'nid'): ?>
                            <th class="text-center">
                                <input class="form-check-input" type="checkbox" id="checkAll"
                                       style="width: 20px; height: 20px; cursor: pointer;" title="Chọn tất cả">
                            </th>
                        <th width="1%">Hãng<br/>tàu</th>
                      <?php elseif ($field == 'field_co_quay_dau'): ?>
                        <th width="1%" class="text-center">Quay<br/>đầu</th>
                      <?php else: ?>
                        <th width="1%" scope="col">
                          <?php print $label; ?>
                        </th>
                      <?php endif; ?>
                    <?php endforeach; ?>
                </tr>
                </thead>
            <?php endif; ?>
            <tbody class="table-border-bottom-0">
            <?php $cauHinhThongTinJson = json_decode(node_load(node_load(5429)->field_mo_ta_slider['und'][0]['value']), TRUE); ?>

            <?php foreach ($rows as $row_count => $row): ?>
                <tr>
                    <?php $field_cung_duong_dong_tra = $cauHinhThongTinJson; $nid = 0; ?>
                    <?php foreach ($row as $field => $content): ?>
                        <?php if ($field == 'field_cung_duong_dong_tra') $field_cung_duong_dong_tra = json_decode($content, true); ?>

                        <?php if ($field == 'nothing'): ?>
                            <td>
                                <!-- Chủ hàng-->
                                <?php $arrContent = explode('{{}}', $content); ?>
                                <div class="text-success">
                                    <?= $arrContent[0] ?>
                                </div>
                                <hr class="mt-1 mb-1"/>
                                <div class="text-primary">
                                    <?= $arrContent[1] ?>
                                </div>
                            </td>
                        <?php elseif ($field == 'nid'): ?>
                            <?php $arrContent = explode('{{}}', $content); watchdog('$arrContent', json_encode($arrContent)); ?>
                            <?php
                              $nid = $arrContent[0];
                              $xeNgoai = $arrContent[1] ?? null;
                              $field_hang_tau_hang_dong = $arrContent[2] ?? null;
                              $field_hang_tau_hang_tra = $arrContent[3] ?? null;
                            ?>
                            <td class="text-center">
                                <span class="badge badge-outline-secondary  toggle-badge" data-nid="<?= $nid; ?>" style="cursor: pointer;">
                                    <?= $nid; ?>
                                </span>
                                <div class="dropdown mt-3">
                                    <button type="button" class="btn p-0 dropdown-toggle hide-arrow" data-bs-toggle="dropdown">
                                        <i class="icon-base ti tabler-settings-spark"></i>
                                    </button>

                                    <div class="dropdown-menu">
                                        <?php if (!empty($xeNgoai)): ?>
                                            <a class="dropdown-item btn-sua-chuyen-xe" href="#"
                                               data-value="<?= $nid ?>">
                                                <i class="icon-base ti tabler-arrow-back-up-double me-1"></i>
                                                Sửa chuyến xe
                                            </a>
                                            <a class="dropdown-item btn-update-quay-dau" href="#"
                                               data-value="<?= $nid ?>">
                                                <i class="icon-base ti tabler-arrow-back-up-double me-1"></i>
                                                Quay đầu / Huỷ quay đầu
                                            </a>
                                            <a class="dropdown-item btn-update-chi-phi" href="#"
                                               data-value="<?= $nid ?>">
                                                <i class="icon-base ti tabler-currency-dollar me-1"></i> Chi phí và Đổ
                                                dầu
                                            </a>
                                            <a class="dropdown-item huy-chuyen-xe text-danger" href="#"
                                               data-value="<?= $nid ?>">
                                                <i class="icon-base ti tabler-trash me-1"></i> Huỷ
                                            </a>
                                        <?php else: ?>
                                            <a class="dropdown-item btn-update-chi-phi-xe-ngoai" href="#"  data-value="<?= $nid ?>">
                                                <i class="icon-base ti tabler-currency-dollar me-1"></i> Chi phí xe ngoài
                                            </a>
                                        <?php endif; ?>
                                    </div>
                                </div>
                            </td>
                            <td>
                              <!-- Chủ hàng-->
                              <div class="text-success"><?=$field_hang_tau_hang_tra; ?></div>
                              <hr class="mt-1 mb-1">
                              <div class="text-primary"><?=$field_hang_tau_hang_dong; ?></div>
                            </td>
                      <?php elseif ($field == 'nothing_1'): ?>

                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['tien_duong']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>

                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['tien_ve']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>

                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['ve_thang']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>

                        <!-- Cột Lương -->
                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['luong_co_dinh']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>

                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['ket_hop']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>

                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['dau']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>

                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['phat_sinh']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>

                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['tong_chi_phi']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>
                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['doanh_thu_tra']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>
                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['doanh_thu_dong']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>
                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['doanh_thu_phat_sinh']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>
                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['tong_doanh_thu']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>
                        <td class="text-end">
                          <?= number_format($field_cung_duong_dong_tra['loi_nhuan']/1000 ?? 0, 0, ',', '.'); ?>
                        </td>
                        <?php elseif ($field == 'field_bien_kiem_soat'): ?>
                            <td>
                                <!-- Chủ xe-->
                                <?= $content; ?>
                            </td>
                            <td>
                                <!--                                Cung đường chạy-->
                                <div class="text-success">
                                    <?= $field_cung_duong_dong_tra['tra']['name'] != '' ? 'Trả ' . $field_cung_duong_dong_tra['tra']['name'] : '...'; ?>
                                </div>
                                <?php if ($field_cung_duong_dong_tra['tra']['name'] != ''): ?>
                                    <input type="text" class="form-control diem-tra-dong-hang" data-type="diem-tra"
                                           data-value="<?= $nid; ?>"
                                           value="<?= $field_cung_duong_dong_tra['tra']['dia_diem_dong']; ?>">
                                <?php endif; ?>

                                <hr class="mt-2 mb-2"/>

                                <div class="text-primary">
                                    <?= $field_cung_duong_dong_tra['dong']['name'] != '' ? 'Đóng ' . $field_cung_duong_dong_tra['dong']['name'] : '...'; ?>
                                </div>
                                <?php if ($field_cung_duong_dong_tra['dong']['name'] != ''): ?>
                                    <input type="text" class="form-control diem-tra-dong-hang" data-type="diem-dong"
                                           data-value="<?= $nid; ?>"
                                           value="<?= $field_cung_duong_dong_tra['dong']['dia_diem_dong']; ?>">
                                <?php endif; ?>
                            </td>
                      <?php elseif ($field == 'field_co_quay_dau'): ?>
                        <?php
                        $isQuayDau = false;

                        $rawQuayDau = trim(strip_tags($content));

                        if (
                          $rawQuayDau === '1' ||
                          mb_strtolower($rawQuayDau, 'UTF-8') === 'có' ||
                          mb_strtolower($rawQuayDau, 'UTF-8') === 'yes' ||
                          strpos($content, 'checked') !== false
                        ) {
                          $isQuayDau = true;
                        }
                        ?>

                        <td class="text-center align-middle">
                          <?php if ($isQuayDau): ?>
                            <i class="icon-base ti tabler-circle-check text-success fs-4"
                               title="Đã quay đầu"></i>
                          <?php else: ?>
                            <span class="text-muted">-</span>
                          <?php endif; ?>
                        </td>
                        <?php else: ?>
                            <td>
                                <?php if ($field == 'field_ngay_van_chuyen'): ?>
                                    <div class="h4 text-center"><?php print date("d", $content); ?></div>
                                    <?php print date("m/Y", $content); ?>
                                <?php elseif ($field == 'field_cung_duong_dong_tra'): ?>
                                    <?php if ($field_cung_duong_dong_tra['tra']['name'] != ''): ?>
                                        <input type="text" class="form-control so-cont-seal" data-type="cont-tra"
                                               data-value="<?= $nid ?>"
                                               value="<?= $field_cung_duong_dong_tra['tra']['so_cont_seal']; ?>">
                                    <?php endif; ?>
                                    <hr class="mt-2 mb-2"/>
                                    <?php if ($field_cung_duong_dong_tra['dong']['name'] != ''): ?>
                                        <input type="text" class="form-control so-cont-seal" data-type="cont-dong"
                                               data-value="<?= $nid ?>"
                                               value="<?= $field_cung_duong_dong_tra['dong']['so_cont_seal']; ?>">
                                    <?php endif; ?>
                                <?php elseif (strpos($content, 'xuat_hoa_don') !== FALSE): ?>
                                    <?php
                                    $xuathdTra = explode(';', $content)[1];
                                    $xuathdDong = explode(';', $content)[2];
                                    ?>
                                    <?php if ($xuathdTra != ''): ?>
                                        <div class="text-center">
                                            <input type="checkbox"
                                                   class="form-check-input"
                                                   id="xuat_hd_tra"
                                                   data-value="<?= $nid ?>"
                                                   data-loai="tra"
                                                   name="xuat_hd_tra"
                                                   value="1"
                                                   style="width: 20px; height: 20px;"
                                                <?= ($xuathdTra == 1) ? 'checked' : '' ?>>
                                        </div>
                                    <?php endif; ?>
                                    <hr class="mt-2 mb-2"/>
                                    <div class="text-center">
                                        <?php if ($xuathdDong != ''): ?>
                                            <input type="checkbox"
                                                   class="form-check-input"
                                                   id="xuat_hd_dong"
                                                   data-value="<?= $nid ?>"
                                                   data-loai="dong"
                                                   name="xuat_hd_dong"
                                                   value="1"
                                                   style="width: 20px; height: 20px;"
                                                <?= ($xuathdDong == 1) ? 'checked' : '' ?>>
                                        <?php endif; ?>
                                    </div>
                                <?php else: ?>
                                    <?php print $content; ?>
                                <?php endif; ?>
                            </td>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </tr>
            <?php endforeach; ?>
            </tbody>
            <tfoot class="fw-bold">
            <td class="text-center">Tổng</td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            <td class="text-end tong-hack-toan"></td>
            </tfoot>
        </table>
    </div>
</div>

<!-- Modal hủy chuyến xe: JS sẽ tự render nội dung lựa chọn -->
<div class="modal fade" id="huy-chuyen-xe-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-light">
        <div>
          <h5 class="modal-title fw-bold mb-0">Hủy chuyến xe</h5>
          <small class="text-muted">Chọn nghiệp vụ cần hủy cho chuyến xe</small>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="huy_chuyen_xe_nid" value="">
        <input type="hidden" id="loai_huy_mac_dinh" value="">
        <div class="alert alert-warning small mb-3">
          Thao tác hủy sẽ cập nhật lại doanh thu, phát sinh, lương lái xe và dữ liệu liên quan.
        </div>
        <div id="huy-chuyen-xe-info" class="mb-3"></div>
        <label class="form-label fw-semibold label-loai-huy">Loại hủy</label>
        <div id="huy-chuyen-xe-options" class="vstack gap-2 mb-3"></div>
        <div class="border rounded p-3 bg-light d-none" id="box-huy-quay-dau">
          <div class="form-check">
            <input class="form-check-input" type="checkbox" value="1" id="huy_quay_dau">
            <label class="form-check-label fw-semibold" for="huy_quay_dau">
              Hủy quay đầu / kết hợp của chuyến xe này
            </label>
          </div>
          <small class="text-muted d-block mt-1">
            Khi chọn, hệ thống sẽ trừ tiền kết hợp, giảm số chuyến lái kết hợp và tính lại lương lái xe tháng.
          </small>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-danger" id="luu-huy-chuyen-xe">Xác nhận hủy</button>
      </div>
    </div>
  </div>
</div>




<!-- Modal sửa chuyến xe -->
<div class="modal fade" id="sua-chuyen-xe-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header bg-light">
        <div>
          <h5 class="modal-title fw-bold mb-0">Sửa chuyến xe</h5>
          <small class="text-muted">Cập nhật thông tin chuyến đóng / chuyến trả</small>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <form id="sua-chuyen-xe-form">
        <div class="modal-body">
          <input type="hidden" name="nid" id="sua_chuyen_xe_nid" value="">
          <div id="sua-chuyen-xe-info" class="mb-3"></div>
          <div class="row g-3" id="sua-chuyen-xe-legs"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary" id="luu-sua-chuyen-xe">Lưu chuyến xe</button>
        </div>
      </form>
    </div>
  </div>
</div>

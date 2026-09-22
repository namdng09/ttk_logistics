<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách phương tiện</h4>
  </div>

  <div class="card-body">
    <!-- Search + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-phuong-tien" placeholder="Tìm kiếm (BKS, mã TS, nhãn hiệu)...">
          <button class="btn btn-primary" type="button" id="btn-search-phuong-tien">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-2 mb-md-0">
        <select class="form-select" id="filter-loai-phuong-tien">
          <option value="">Tất cả loại</option>
          <option value="dau_keo">Đầu kéo</option>
          <option value="mooc">Mooc</option>
          <option value="may_phat">Máy phát</option>
        </select>
      </div>
      <div class="col-6 col-md-5">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-phuong-tien" data-bs-toggle="modal" data-bs-target="#phuong-tien-modal">
            <i class="ti tabler-plus me-1"></i>Thêm phương tiện
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-phuong-tien">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-phuong-tien" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>BKS</th>
            <th>Mã Tài sản</th>
            <th>Loại</th>
            <th>Nhãn hiệu</th>
            <th>Thông số</th>
            <th>Lái xe</th>
          </tr>
        </thead>
        <tbody id="table-phuong-tien-tbody">
          <tr id="loading-row">
            <td colspan="8" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="pagination-phuong-tien" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="pagination-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="pagination-total-pages"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Create/Edit/View Modal -->
<div class="modal fade" id="phuong-tien-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <form id="form-phuong-tien" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="phuong-tien-modal-title">Thêm phương tiện</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div id="modal-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
            <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:6rem;" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
          </div>
          <input type="hidden" name="nid" value="">

          <div class="row g-3">
            <div class="col-12">
              <div class="phuong-tien-form-section-title">Thông tin chung</div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Biển kiểm soát <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="bks" required placeholder="VD: 15H12345">
              <div class="invalid-feedback">Vui lòng nhập biển kiểm soát</div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Mã tài sản</label>
              <input type="text" class="form-control" name="ma_tai_san" placeholder="VD: HMN">
            </div>
            <div class="col-md-3">
              <label class="form-label">Loại phương tiện <span class="text-danger">*</span></label>
              <select class="form-select" name="loai_phuong_tien" required>
                <option value="">Chọn loại</option>
                <option value="dau_keo">Đầu kéo</option>
                <option value="mooc">Mooc</option>
                <option value="may_phat">Máy phát</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn loại phương tiện</div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Nhãn hiệu</label>
              <input type="text" class="form-control" name="hang_xe" placeholder="VD: HYUNDAI, CIMC, DONGFENG...">
            </div>
            <div class="col-md-3">
              <label class="form-label">Màu sắc</label>
              <input type="text" class="form-control" name="mau_sac" placeholder="VD: Trắng, xanh...">
            </div>
            <div class="col-md-3">
              <label class="form-label">Năm sản xuất</label>
              <input type="text" class="form-control" name="nam_san_xuat" placeholder="2026" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-3">
              <label class="form-label">Tải trọng</label>
              <input type="text" class="form-control weight-mask pt-weight-field" name="tai_trong" placeholder="0">
            </div>
            <div class="col-md-3">
              <label class="form-label">Tự trọng</label>
              <input type="text" class="form-control weight-mask pt-weight-field" name="tu_trong" placeholder="0">
            </div>
            <div class="col-md-3">
              <label class="form-label">Nước sản xuất</label>
              <input type="text" class="form-control" name="nuoc_san_xuat" placeholder="VD: Việt Nam">
            </div>
            <div class="col-md-3">
              <label class="form-label">Giá mua</label>
              <div class="input-group">
                <span class="input-group-text">đ</span>
                <input type="text" class="form-control money-mask" name="gia_mua" placeholder="1.000.000">
              </div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Ngày mua</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_mua" placeholder="dd/MM/yyyy">
            </div>

            <div class="col-12 pt-dau-keo-field">
              <div class="phuong-tien-form-section-title">Thông số đầu kéo</div>
            </div>
            <div class="col-md-4 pt-dau-keo-field">
              <label class="form-label">Số cầu</label>
              <input type="number" class="form-control integer-only" name="so_cau" placeholder="VD: 2" min="0" step="1" inputmode="numeric" pattern="[0-9]*" onkeydown="return ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].indexOf(event.key) !== -1 || /^[0-9]$/.test(event.key)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
            </div>
            <div class="col-md-4 pt-dau-keo-field">
              <label class="form-label">Số khung</label>
              <input type="text" class="form-control" name="so_khung_dau_keo" placeholder="Nhập số khung">
            </div>
            <div class="col-md-4 pt-dau-keo-field">
              <label class="form-label">Số máy</label>
              <input type="text" class="form-control" name="so_may" placeholder="Nhập số máy">
            </div>

            <div class="col-12 pt-mooc-field">
              <div class="phuong-tien-form-section-title">Thông số rơ mooc</div>
            </div>
            <div class="col-md-4 pt-mooc-field">
              <label class="form-label">Loại mooc</label>
              <select class="form-select" name="loai_mooc">
                <option value="">Chọn loại mooc</option>
                <option value="xuong">Xương</option>
                <option value="san">Sàn</option>
                <option value="long">Lồng</option>
                <option value="ben">Ben</option>
                <option value="bon">Bồn</option>
                <option value="container">Container</option>
                <option value="khac">Khác</option>
              </select>
            </div>
            <div class="col-md-4 pt-mooc-field">
              <label class="form-label">Số khung</label>
              <input type="text" class="form-control" name="so_khung_mooc" placeholder="Nhập số khung">
            </div>
            <div class="col-md-4 pt-mooc-field">
              <label class="form-label">Số trục</label>
              <input type="number" class="form-control integer-only" name="so_truc" placeholder="VD: 3" min="0" step="1" inputmode="numeric" pattern="[0-9]*" onkeydown="return ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].indexOf(event.key) !== -1 || /^[0-9]$/.test(event.key)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
            </div>
            <div class="col-md-4 pt-mooc-field">
              <label class="form-label">Chiều dài mooc</label>
              <div class="input-group">
                <input type="number" class="form-control integer-only" name="chieu_dai_mooc" placeholder="VD: 45" min="0" step="1" inputmode="numeric" pattern="[0-9]*" onkeydown="return ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'].indexOf(event.key) !== -1 || /^[0-9]$/.test(event.key)" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                <span class="input-group-text">Feet</span>
              </div>
            </div>

            <div class="col-12">
              <div class="phuong-tien-form-section-title">Giấy tờ và thời hạn</div>
            </div>
            <div class="col-12"><div class="row g-3 phuong-tien-documents-grid">
              <div class="col-md-4 phuong-tien-documents-column">
                <div class="phuong-tien-documents-block">
                  <div><label class="form-label">Ngày đăng kiểm</label><input type="text" class="form-control flatpickr-date date-mask" name="ngay_dang_kiem" placeholder="dd/MM/yyyy"></div>
                  <div><label class="form-label">Số đăng kiểm</label><input type="text" class="form-control" name="so_dang_kiem" placeholder="Nhập số đăng kiểm"></div>
                  <div><label class="form-label">Hạn đăng kiểm</label><input type="text" class="form-control flatpickr-date date-mask" name="han_dang_kiem" placeholder="dd/MM/yyyy"></div>
                  <div><label class="form-label">Niên hạn sử dụng</label><input type="text" class="form-control integer-only" name="nien_han_su_dung" placeholder="VD: 2035" inputmode="numeric"></div>
                </div>
              </div>
              <div class="col-md-4 phuong-tien-documents-column">
                <div class="phuong-tien-documents-block"><div><label class="form-label">Số giấy phép liên vận</label><input type="text" class="form-control" name="so_giay_phep_lien_van" placeholder="Nhập số giấy phép liên vận"></div><div><label class="form-label">Hạn giấy phép liên vận</label><input type="text" class="form-control flatpickr-date date-mask" name="han_giay_phep_lien_van" placeholder="dd/MM/yyyy"></div></div>
                <div class="phuong-tien-documents-block"><div><label class="form-label">Số BH thân vỏ</label><input type="text" class="form-control" name="so_bao_hiem_than_vo" placeholder="Nhập số BH"></div><div><label class="form-label">Hạn BH thân vỏ</label><input type="text" class="form-control flatpickr-date date-mask" name="han_bao_hiem_than_vo" placeholder="dd/MM/yyyy"></div></div>
              </div>
              <div class="col-md-4 phuong-tien-documents-column">
                <div class="phuong-tien-documents-block"><div><label class="form-label">Số phù hiệu</label><input type="text" class="form-control" name="so_phu_hieu" placeholder="Nhập số phù hiệu"></div><div><label class="form-label">Hạn phù hiệu</label><input type="text" class="form-control flatpickr-date date-mask" name="han_phu_hieu" placeholder="dd/MM/yyyy"></div></div>
                <div class="phuong-tien-documents-block"><div><label class="form-label">Số BH TNDS</label><input type="text" class="form-control" name="so_bao_hiem_tnds" placeholder="Nhập số BH"></div><div><label class="form-label">Hạn BH TNDS</label><input type="text" class="form-control flatpickr-date date-mask" name="han_bao_hiem_tnds" placeholder="dd/MM/yyyy"></div></div>
              </div>
            </div></div>

            <div class="col-12">
              <div class="phuong-tien-file-section" id="phuong-tien-file-section">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <label class="form-label mb-0"><i class="ti tabler-files me-2"></i>Hồ sơ tài liệu</label>
                  <span class="badge rounded-pill bg-label-secondary border" id="phuong-tien-file-count">0 file</span>
                </div>

                <div class="alert alert-light border py-2 px-3 mb-2 small" id="phuong-tien-file-create-note" style="display:none;">
                  Có thể chọn hồ sơ ngay tại đây; hồ sơ sẽ được upload tự động sau khi lưu phương tiện.
                </div>

                <div class="phuong-tien-file-upload row g-2 align-items-end mb-2" id="phuong-tien-file-upload">
                  <div class="col-12 col-lg-3">
                    <label class="form-label">Loại hồ sơ</label>
                    <select class="form-select form-select-sm" id="pt-file-type" name="loai" form="phuong-tien-file-form">
                      <option value="dang_ky_xe">Đăng ký xe</option>
                      <option value="dang_kiem">Đăng kiểm</option>
                      <option value="bao_hiem_than_vo">Bảo hiểm thân vỏ</option>
                      <option value="bao_hiem_tnds">Bảo hiểm TNDS</option>
                      <option value="phu_hieu">Phù hiệu</option>
                      <option value="khac">Khác</option>
                    </select>
                  </div>
                  <div class="col-12 col-lg-4">
                    <label class="form-label">Tên hiển thị</label>
                    <input type="text" class="form-control form-control-sm" id="pt-file-title" name="ten_hien_thi" form="phuong-tien-file-form" placeholder="VD: Đăng kiểm xe">
                  </div>
                  <div class="col-12 col-lg-3">
                    <label class="form-label">File</label>
                    <input type="file" class="form-control form-control-sm" id="pt-file-input" name="vehicle_file" form="phuong-tien-file-form" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf">
                  </div>
                  <div class="col-12 col-lg-2">
                    <button type="button" class="btn btn-sm btn-primary w-100" id="btn-upload-phuong-tien-file">
                      <i class="ti tabler-upload me-1"></i>Upload
                    </button>
                  </div>
                </div>

                <div class="table-responsive phuong-tien-file-table-wrap">
                  <table class="table table-bordered table-hover table-sm align-middle mb-0 phuong-tien-file-table">
                    <thead class="table-light">
                      <tr>
                        <th style="width:56px">#</th>
                        <th style="width:170px">Loại hồ sơ</th>
                        <th>Tên file</th>
                        <th style="width:120px" class="text-end">Dung lượng</th>
                        <th style="width:150px" class="text-center">Ngày upload</th>
                        <th style="width:120px" class="text-center">CN</th>
                      </tr>
                    </thead>
                    <tbody id="phuong-tien-file-tbody">
                      <tr>
                        <td colspan="6" class="text-center text-muted py-3">Chưa có hồ sơ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-phuong-tien">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
      <form id="phuong-tien-file-form" enctype="multipart/form-data" style="display:none;"></form>
    </div>
  </div>
</div>

<!-- Chọn Lái Xe Modal -->
<div class="modal fade" id="phuong-tien-lai-xe-modal" tabindex="-1" aria-hidden="true" data-current-id="">
  <div class="modal-dialog modal-sm modal-dialog-centered">
    <div class="modal-content">
      <form id="form-ptlx-assign">
        <div class="modal-header">
          <h5 class="modal-title" id="ptlx-modal-title">Chọn lái xe</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div id="ptlx-modal-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
            <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:4rem;" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-medium text-muted">Phương tiện</label>
            <div class="form-control-plaintext fw-semibold" id="ptlx-display-bks">---</div>
          </div>

          <div class="mb-3">
            <label class="form-label">Chọn lái xe</label>
            <select class="form-select" id="ptlx-select-lai-xe">
              <option value="">Đang tải...</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-ptlx">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

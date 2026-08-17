<div class="card lssx-card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title mb-0">Lịch sử sửa xe</h4>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-primary btn-lssx-create" data-bs-toggle="modal" data-bs-target="#lssx-modal">
        <i class="ti tabler-plus me-1"></i>Thêm lịch sử
      </button>
      <button type="button" class="btn btn-icon btn-label-secondary btn-lssx-refresh" title="Làm mới">
        <i class="ti tabler-refresh"></i>
      </button>
    </div>
  </div>
  <div class="card-body">
    <div class="row g-2 align-items-end mb-3">
      <div class="col-12 col-lg-3">
        <label class="form-label">Từ khóa</label>
        <input type="text" class="form-control" id="lssx-filter-keyword" placeholder="BKS, gara, lái xe...">
      </div>
      <div class="col-12 col-lg-3">
        <label class="form-label">Phương tiện</label>
        <select class="form-select" id="lssx-filter-phuong-tien"></select>
      </div>
      <div class="col-6 col-lg-2">
        <label class="form-label">Từ ngày</label>
        <input type="text" class="form-control flatpickr-date date-mask" id="lssx-filter-tu-ngay" placeholder="dd/MM/yyyy">
      </div>
      <div class="col-6 col-lg-2">
        <label class="form-label">Đến ngày</label>
        <input type="text" class="form-control flatpickr-date date-mask" id="lssx-filter-den-ngay" placeholder="dd/MM/yyyy">
      </div>
      <div class="col-12 col-lg-2 d-flex gap-2">
        <button type="button" class="btn btn-primary flex-fill" id="btn-lssx-search">
          <i class="ti tabler-search me-1"></i>Tìm
        </button>
        <button type="button" class="btn btn-icon btn-label-secondary" id="btn-lssx-reset" title="Làm mới">
          <i class="ti tabler-refresh"></i>
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-hover align-middle lssx-table" id="lssx-table">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center!important">CN</th>
            <th style="width:52px">#</th>
            <th>Phương tiện</th>
            <th>Ngày sửa</th>
            <th>Nội dung</th>
            <th>Cơ sở sửa</th>
            <th>Lái xe</th>
            <th class="text-end">Chi phí</th>
            <th>Nhắc nhớt</th>
          </tr>
        </thead>
        <tbody id="lssx-table-body">
          <tr>
            <td colspan="9" class="text-center py-4">
              <div class="spinner-border text-primary" role="status"></div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="lssx-pagination" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="lssx-pagination-info"></div>
        <nav><ul class="pagination justify-content-center mb-0"></ul></nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="lssx-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="lssx-pagination-total"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="lssx-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <form id="lssx-form" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="lssx-modal-title">Thêm lịch sử sửa xe</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
        </div>
        <div class="modal-body position-relative">
          <div id="lssx-modal-loading" class="lssx-modal-loading" style="display:none;">
            <div class="spinner-border text-primary" role="status"></div>
          </div>
          <input type="hidden" name="nid" value="">

          <div class="lssx-section-title">Thông tin sửa xe</div>
          <div class="row g-2 lssx-info-grid">
            <div class="col-12 col-xl-4">
              <label class="form-label">Phương tiện <span class="text-danger">*</span></label>
              <select class="form-select" name="nid_phuong_tien" required></select>
              <div class="invalid-feedback">Vui lòng chọn phương tiện</div>
            </div>
            <div class="col-6 col-md-3 col-xl-2">
              <label class="form-label">Ngày sửa <span class="text-danger">*</span></label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_sua" placeholder="dd/MM/yyyy" required>
              <div class="invalid-feedback">Vui lòng nhập ngày sửa</div>
            </div>
            <div class="col-6 col-md-3 col-xl-2">
              <label class="form-label">Loại sửa chữa</label>
              <select class="form-select" name="loai_sua_chua">
                <option value="">Chọn loại</option>
                <option value="sua_chua">Sửa chữa</option>
                <option value="bao_duong">Bảo dưỡng</option>
                <option value="thay_nhot">Thay nhớt</option>
                <option value="thay_vo">Thay vỏ</option>
                <option value="khac">Khác</option>
              </select>
            </div>
            <div class="col-12 col-md-6 col-xl-4">
              <label class="form-label">Lái xe mang đi sửa</label>
              <select class="form-select" name="nid_lai_xe_mang_di_sua"></select>
            </div>
            <div class="col-12 col-xl-4">
              <label class="form-label">Cơ sở sửa chữa</label>
              <input type="text" class="form-control" name="co_so_sua_chua" placeholder="Tên gara/cơ sở sửa chữa">
            </div>
            <div class="col-6 col-md-3 col-xl-2">
              <label class="form-label">Số km lúc sửa</label>
              <input type="text" class="form-control integer-mask" name="so_km_luc_sua" placeholder="0" inputmode="numeric">
            </div>
            <div class="col-6 col-md-3 col-xl-2">
              <label class="form-label">Thời gian sửa</label>
              <input type="text" class="form-control" name="thoi_gian_sua" placeholder="VD: 2 ngày">
            </div>
            <div class="col-12 col-md-3 col-xl-2">
              <label class="form-label">Tình trạng xe</label>
              <select class="form-select" name="tinh_trang_xe">
                <option value="">Chọn tình trạng</option>
                <option value="dang_hoat_dong">Đang hoạt động</option>
                <option value="dang_sua">Đang sửa</option>
                <option value="can_bao_duong">Cần bảo dưỡng</option>
                <option value="ngung_hoat_dong">Ngưng hoạt động</option>
              </select>
            </div>
            <div class="col-12 col-md-3 col-xl-2">
              <label class="form-label">Tổng chi phí</label>
              <div class="input-group">
                <input type="text" class="form-control money-mask" name="tong_chi_phi" placeholder="0">
                <span class="input-group-text">đ</span>
              </div>
            </div>
            <div class="col-6 col-md-3 col-xl-2">
              <label class="form-label">Km nhắc tiếp theo</label>
              <input type="text" class="form-control integer-mask" name="so_km_nhac_tiep_theo" placeholder="0" inputmode="numeric">
            </div>
            <div class="col-6 col-md-3 col-xl-2">
              <label class="form-label">Ngày nhắc tiếp theo</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_nhac_tiep_theo" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-12 col-md-6 col-xl-8">
              <label class="form-label">Ghi chú</label>
              <input type="text" class="form-control" name="ghi_chu" placeholder="Ghi chú thêm">
            </div>
          </div>

          <div class="lssx-section-title mt-3">Hạng mục sửa chữa và bảo hành</div>
          <div class="table-responsive lssx-hang-muc-wrap">
            <table class="table table-bordered table-sm align-middle mb-0 lssx-hang-muc-table">
              <thead class="table-light">
                <tr>
                  <th style="width:48px">#</th>
                  <th>Hạng mục/phụ kiện</th>
                  <th style="width:150px">Đơn giá</th>
                  <th style="width:100px">SL</th>
                  <th style="width:150px">Thành tiền</th>
                  <th style="width:110px">Bảo hành</th>
                  <th style="width:150px">Hết BH</th>
                  <th>Ghi chú BH</th>
                  <th style="width:56px" class="text-center lssx-hang-muc-add-cell">
                    <button type="button" class="btn btn-sm btn-icon btn-primary text-white" id="btn-lssx-add-hang-muc" title="Thêm hạng mục">
                      <i class="ti tabler-plus"></i>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody id="lssx-hang-muc-body"></tbody>
            </table>
          </div>

          <div class="card lssx-files-card mt-3" id="lssx-files-card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white">
              <div class="d-flex align-items-center gap-2 min-w-0">
                <span class="lssx-files-title">Ảnh và chứng từ</span>
                <span class="badge rounded-pill bg-label-secondary border" id="lssx-files-count">0 file</span>
              </div>
            </div>
            <div class="card-body">
              <div class="alert alert-light border py-2 px-3 small mb-3" id="lssx-file-create-note" style="display:none;">
                Lưu lịch sử sửa xe trước khi upload ảnh/chứng từ.
              </div>
              <div class="row g-2 align-items-end mb-3" id="lssx-file-upload">
                <div class="col-12 col-lg-3">
                  <label class="form-label">Phân loại</label>
                  <select class="form-select form-select-sm" id="lssx-file-group">
                    <option value="anh_truoc">Ảnh trước sửa</option>
                    <option value="anh_sau">Ảnh sau sửa</option>
                    <option value="chung_tu">Chứng từ/Hóa đơn</option>
                  </select>
                </div>
                <div class="col-12 col-lg-4">
                  <label class="form-label">Tên hiển thị</label>
                  <input type="text" class="form-control form-control-sm" id="lssx-file-title" placeholder="VD: Ảnh vỏ trước khi thay">
                </div>
                <div class="col-12 col-lg-3">
                  <label class="form-label">File</label>
                  <input type="file" class="form-control form-control-sm" id="lssx-file-input" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf">
                </div>
                <div class="col-12 col-lg-2">
                  <button type="button" class="btn btn-sm btn-primary w-100" id="btn-lssx-upload-file">
                    <i class="ti tabler-upload me-1"></i>Upload
                  </button>
                </div>
              </div>
              <div id="lssx-file-list" class="lssx-file-list"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary" id="btn-lssx-save">
            <i class="ti tabler-device-floppy me-1"></i>Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

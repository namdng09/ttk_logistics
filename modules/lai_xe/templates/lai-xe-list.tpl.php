<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách lái xe</h4>
  </div>

  <div class="card-body">
    <!-- Search + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-lai-xe" placeholder="Tìm kiếm (Tên, mã NV, SDT, CCCD)...">
          <button class="btn btn-primary" type="button" id="btn-search-lai-xe">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-12 col-md-8">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-lai-xe" data-bs-toggle="modal" data-bs-target="#lai-xe-modal">
            <i class="ti tabler-plus me-1"></i>Thêm lái xe
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-lai-xe">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-lai-xe" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Họ tên</th>
            <th>Mã NV</th>
            <th>SĐT</th>
            <th>CCCD</th>
            <th>Số bằng lái</th>
            <th>Loại bằng</th>
            <th style="width:110px;" class="text-center">Ngày sinh</th>
          </tr>
        </thead>
        <tbody id="table-lai-xe-tbody">
          <tr id="loading-row">
            <td colspan="9" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="pagination-lai-xe" class="mt-3" style="display:none;">
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

<!-- Create/Edit Modal -->
<div class="modal fade" id="lai-xe-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <form id="form-lai-xe" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="lai-xe-modal-title">Thêm lái xe</h5>
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
            <div class="col-md-4">
              <label class="form-label">Họ tên <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Nhập họ tên">
              <div class="invalid-feedback">Vui lòng nhập họ tên</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Mã nhân viên</label>
              <input type="text" class="form-control" name="ma_nhan_vien" placeholder="NV001">
            </div>
            <div class="col-md-4">
              <label class="form-label">SĐT</label>
              <input type="tel" class="form-control phone-mask" name="sdt" placeholder="0987654321" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-4">
              <label class="form-label">CCCD</label>
              <input type="text" class="form-control" name="cccd" placeholder="Nhập CCCD" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày cấp</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_cap" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Nơi cấp</label>
              <input type="text" class="form-control" name="noi_cap" placeholder="Nhập nơi cấp">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn CCCD</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_cccd" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Số bằng lái</label>
              <input type="text" class="form-control" name="so_bang_lai" placeholder="Nhập số bằng lái" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-4">
              <label class="form-label">Loại bằng lái</label>
              <select class="form-select select2-tags-loai-bang" name="loai_bang_lai" data-placeholder="Chọn hoặc nhập loại bằng">
                <option value="">Chọn loại bằng</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn bằng lái</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_bang_lai" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày nhận việc</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_nhan_viec" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày sinh</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="dod" placeholder="dd/MM/yyyy">
            </div>

            <!-- Bank Info Repeater -->
            <div class="col-12">
              <div class="ngan-hang-section">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0"><i class="ti tabler-building-bank me-2"></i>Thông tin ngân hàng</label>
                  <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-ngan-hang">
                    <i class="ti tabler-plus me-1"></i>Thêm
                  </button>
                </div>
                <div id="ngan-hang-repeater">
                  <!-- Repeater items will be added here -->
                </div>
              </div>
            </div>

            <!-- Driver Files -->
            <div class="col-12">
              <div class="lai-xe-file-section" id="lai-xe-file-section">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <label class="form-label mb-0"><i class="ti tabler-files me-2"></i>Hồ sơ tài liệu</label>
                  <span class="badge rounded-pill bg-label-secondary border" id="lai-xe-file-count">0 file</span>
                </div>

                <div class="alert alert-light border py-2 px-3 mb-2 small" id="lai-xe-file-create-note" style="display:none;">
                  Lưu thông tin lái xe trước khi upload hồ sơ.
                </div>

                <div class="lai-xe-file-upload row g-2 align-items-end mb-2" id="lai-xe-file-upload">
                  <div class="col-12 col-lg-3">
                    <label class="form-label">Loại hồ sơ</label>
                    <select class="form-select form-select-sm" id="lx-file-type" name="loai" form="lai-xe-file-form">
                      <option value="cccd_truoc">CCCD mặt trước</option>
                      <option value="cccd_sau">CCCD mặt sau</option>
                      <option value="bang_lai">Bằng lái</option>
                      <option value="anh_chan_dung">Ảnh chân dung</option>
                      <option value="giay_kham_suc_khoe">Giấy khám sức khoẻ</option>
                      <option value="khac">Khác</option>
                    </select>
                  </div>
                  <div class="col-12 col-lg-4">
                    <label class="form-label">Tên hiển thị</label>
                    <input type="text" class="form-control form-control-sm" id="lx-file-title" name="ten_hien_thi" form="lai-xe-file-form" placeholder="VD: CCCD mặt trước">
                  </div>
                  <div class="col-12 col-lg-3">
                    <label class="form-label">File</label>
                    <input type="file" class="form-control form-control-sm" id="lx-file-input" name="driver_file" form="lai-xe-file-form" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf">
                  </div>
                  <div class="col-12 col-lg-2">
                    <button type="button" class="btn btn-sm btn-primary w-100" id="btn-upload-lai-xe-file">
                      <i class="ti tabler-upload me-1"></i>Upload
                    </button>
                  </div>
                </div>

                <div class="table-responsive lai-xe-file-table-wrap">
                  <table class="table table-bordered table-hover table-sm align-middle mb-0 lai-xe-file-table">
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
                    <tbody id="lai-xe-file-tbody">
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
          <button type="button" class="btn btn-primary btn-luu-lai-xe">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
      <form id="lai-xe-file-form" enctype="multipart/form-data" style="display:none;"></form>
    </div>
  </div>
</div>

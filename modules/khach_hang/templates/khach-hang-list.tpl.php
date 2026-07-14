<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách khách hàng</h4>
  </div>

  <div class="card-body">
    <!-- Search + Filter + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-khach-hang" placeholder="Tìm kiếm (Tên, mã KH, MST/CCCD, SĐT)...">
          <button class="btn btn-primary" type="button" id="btn-search-khach-hang">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-5 mb-2 mb-md-0">
        <select class="form-select" id="filter-phan-loai">
          <option value="">Tất cả phân loại</option>
          <option value="Doanh nghiệp">Doanh nghiệp</option>
          <option value="Cá nhân">Cá nhân</option>
          <option value="Khách hàng">Khách hàng</option>
          <option value="Nhà cung cấp">Nhà cung cấp</option>
          <option value="Đối tác">Đối tác</option>
          <option value="Khác">Khác</option>
        </select>
      </div>
      <div class="col-6 col-md-3">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-khach-hang" data-bs-toggle="modal" data-bs-target="#khach-hang-modal">
            <i class="ti tabler-plus me-1"></i>Thêm
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-khach-hang">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-khach-hang" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Phân loại</th>
            <th>Tên công ty</th>
            <th>Tên ngắn gọn</th>
            <th>MST / CCCD</th>
            <th>SĐT</th>
            <th>Địa chỉ</th>
            <th>NV</th>
            <th>DOB</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody id="table-khach-hang-tbody">
          <tr id="loading-row">
            <td colspan="11" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="pagination-khach-hang" class="mt-3" style="display:none;">
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
<div class="modal fade" id="khach-hang-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <form id="form-khach-hang" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="khach-hang-modal-title">Thêm khách hàng</h5>
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
            <div class="col-md-6">
              <label class="form-label">Tên công ty / Khách hàng <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Công ty TNHH ABC">
              <div class="invalid-feedback">Vui lòng nhập tên</div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Tên ngắn gọn</label>
              <input type="text" class="form-control" name="ma_kh" placeholder="ABC">
            </div>
            <div class="col-md-3">
              <label class="form-label">MST / CCCD</label>
              <input type="text" class="form-control" name="cccd_mst" placeholder="0201234567">
            </div>
            <div class="col-md-6">
              <label class="form-label">Phân loại <span class="text-danger">*</span></label>
              <input id="tagifyPhanLoai" class="form-control" name="phan_loai_tags" placeholder="Chọn phân loại" required>
              <div class="invalid-feedback">Vui lòng chọn phân loại</div>
            </div>
            <div class="col-md-3">
              <label class="form-label">SĐT</label>
              <input type="tel" class="form-control" name="sdt" placeholder="0901234567" inputmode="numeric">
            </div>
            <div class="col-md-3">
              <label class="form-label">Ngày sinh</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="dob" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-12">
              <label class="form-label">Địa chỉ</label>
              <input type="text" class="form-control" name="dia_chi" placeholder="Số nhà, phường, quận, thành phố">
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

            <!-- Warehouse Address Repeater -->
            <div class="col-12">
              <div class="dia-chi-kho-section">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0"><i class="ti tabler-map-pin me-2"></i>Địa chỉ kho</label>
                  <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-dia-chi-kho">
                    <i class="ti tabler-plus me-1"></i>Thêm
                  </button>
                </div>
                <div id="dia-chi-kho-repeater">
                  <!-- Repeater items will be added here -->
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <label class="form-label">NV Kinh doanh</label>
              <select id="nv-kinh-doanh-select" class="form-select" name="nv_kinh_doanh">
                <option value="">Chọn nhân viên</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Ghi chú</label>
              <input type="text" class="form-control" name="ghi_chu" placeholder="Ghi chú">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-khach-hang">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

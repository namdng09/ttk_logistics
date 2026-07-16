<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách phương tiện</h4>
  </div>

  <div class="card-body">
    <!-- Search + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-phuong-tien" placeholder="Tìm kiếm (BKS, mã TS, hãng xe)...">
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
            <th>Hãng xe</th>
            <th>Lái xe</th>
            <th>Năm sản xuất</th>
            <th>Giá mua</th>
            <th>Ngày mua</th>
            <th>Số đăng kiểm</th>
            <th>Hạn đăng kiểm</th>
            <th>Số BH thân vỏ</th>
            <th>Hạn BH thân vỏ</th>
            <th>Số BH TNDS</th>
            <th>Hạn BH TNDS</th>
            <th>Ngày phù hiệu</th>
            <th>Hạn phù hiệu</th>
          </tr>
        </thead>
        <tbody id="table-phuong-tien-tbody">
          <tr id="loading-row">
            <td colspan="18" class="text-center py-4">
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
            <div class="col-md-4">
              <label class="form-label">Biển kiểm soát <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="bks" required placeholder="VD: 15H12345">
              <div class="invalid-feedback">Vui lòng nhập biển kiểm soát</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Mã tài sản</label>
              <input type="text" class="form-control" name="ma_tai_san" placeholder="VD: HMN">
            </div>
            <div class="col-md-4">
              <label class="form-label">Loại phương tiện <span class="text-danger">*</span></label>
              <select class="form-select" name="loai_phuong_tien" required>
                <option value="">Chọn loại</option>
                <option value="dau_keo">Đầu kéo</option>
                <option value="mooc">Mooc</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn loại phương tiện</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Hãng xe</label>
              <input type="text" class="form-control" name="hang_xe" placeholder="VD: Honda, Hyundai...">
            </div>
            <div class="col-md-4">
              <label class="form-label">Năm sản xuất</label>
              <input type="text" class="form-control" name="nam_san_xuat" placeholder="2026" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-4">
              <label class="form-label">Giá mua</label>
              <div class="input-group">
                <span class="input-group-text">đ</span>
                <input type="text" class="form-control money-mask" name="gia_mua" placeholder="1.000.000">
              </div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày mua</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_mua" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Số đăng kiểm</label>
              <input type="text" class="form-control" name="so_dang_kiem" placeholder="Nhập số đăng kiểm">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn đăng kiểm</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_dang_kiem" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Số BH thân vỏ</label>
              <input type="text" class="form-control" name="so_bao_hiem_than_vo" placeholder="Nhập số BH">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn BH thân vỏ</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_bao_hiem_than_vo" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Số BH TNDS</label>
              <input type="text" class="form-control" name="so_bao_hiem_tnds" placeholder="Nhập số BH">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn BH TNDS</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_bao_hiem_tnds" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày phù hiệu</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_phu_hieu" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn phù hiệu</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_phu_hieu" placeholder="dd/MM/yyyy">
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
            <label class="form-label">Chọn lái xe <span class="text-danger">*</span></label>
            <select class="form-select" id="ptlx-select-lai-xe" required>
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

<div id="giao-dich-ops-app">
  <div class="card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0">Sổ chi phí vận hành</h4>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-label-secondary" id="btn-open-filter-giao-dich-ops">
          <i class="ti tabler-filter me-1"></i>Tìm kiếm
        </button>
        <button type="button" class="btn btn-icon btn-label-secondary" id="btn-reload-giao-dich-ops">
          <i class="ti tabler-refresh"></i>
        </button>
      </div>
    </div>

    <div class="card-body">
      <div class="row g-3 mb-4" id="giao-dich-ops-kpis">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-primary">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Tổng dòng chi phí</div>
                  <div class="h5 mb-0 fw-bold" data-kpi="total">0</div>
                </div>
                <span class="ops-wallet-kpi-icon">
                  <i class="icon-base ti tabler-list-details"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-success">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Tổng thu</div>
                  <div class="h5 mb-0 fw-bold ops-kpi-credit-value" data-kpi="credit">0 đ</div>
                </div>
                <span class="ops-wallet-kpi-icon">
                  <i class="icon-base ti tabler-trending-up"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-danger">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Tổng chi</div>
                  <div class="h5 mb-0 fw-bold ops-kpi-debit-value" data-kpi="debit">0 đ</div>
                </div>
                <span class="ops-wallet-kpi-icon">
                  <i class="icon-base ti tabler-trending-down"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-info">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Số dư tạm ứng</div>
                  <div class="h5 mb-0 fw-bold" data-kpi="balance">0 đ</div>
                </div>
                <span class="ops-wallet-kpi-icon">
                  <i class="icon-base ti tabler-wallet"></i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle" id="table-giao-dich-ops">
          <thead class="table-light">
            <tr>
              <th style="width:60px;text-align:center !important">CN</th>
              <th style="width:50px">#</th>
              <th style="width:145px">Thời gian</th>
              <th style="width:145px">Mã GD</th>
              <th style="width:160px">Người liên quan</th>
              <th style="width:90px">Hướng</th>
              <th style="width:130px">Loại</th>
              <th style="width:130px" class="text-end">Số tiền</th>
              <th style="width:130px" class="text-end">Số dư sau</th>
              <th style="width:130px">Booking</th>
              <th>Nội dung</th>
            </tr>
          </thead>
          <tbody id="table-giao-dich-ops-tbody">
            <tr>
              <td colspan="11" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div id="pagination-giao-dich-ops" class="mt-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="pagination-giao-dich-ops-info"></div>
          <nav>
            <ul class="pagination justify-content-center mb-0"></ul>
          </nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="pagination-giao-dich-ops-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="pagination-giao-dich-ops-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="giao-dich-ops-filter-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <form id="form-filter-giao-dich-ops">
        <div class="modal-header">
          <h5 class="modal-title">Tìm kiếm chi phí vận hành</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Từ khóa</label>
              <input type="text" class="form-control" name="keyword" placeholder="Mã GD, booking, nội dung">
            </div>
            <div class="col-md-3">
              <label class="form-label">Từ ngày</label>
              <input type="date" class="form-control" name="date_from">
            </div>
            <div class="col-md-3">
              <label class="form-label">Đến ngày</label>
              <input type="date" class="form-control" name="date_to">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hướng</label>
              <select class="form-select" name="huong">
                <option value="">Tất cả</option>
                <option value="credit">Thu</option>
                <option value="debit">Chi</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Nghiệp vụ</label>
              <select class="form-select" name="loai_giao_dich">
                <option value="">Tất cả</option>
                <option value="ung_tien">Công ty chi trả</option>
                <option value="bo_sung_ung">Bổ sung chi trả</option>
                <option value="quyet_toan_chi_phi">Quyết toán chi phí</option>
                <option value="hoan_tien_thua">Hoàn tiền thừa</option>
                <option value="cong_ty_hoan_them">Công ty hoàn thêm</option>
                <option value="dieu_chinh_tang">Điều chỉnh tăng</option>
                <option value="dieu_chinh_giam">Điều chỉnh giảm</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Số dòng</label>
              <select class="form-select" name="limit">
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="200">200</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" id="btn-reset-filter-giao-dich-ops">Reset</button>
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="submit" class="btn btn-primary">
            <i class="ti tabler-search me-1"></i>Tìm kiếm
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal fade" id="giao-dich-ops-detail-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Chi tiết chi phí vận hành</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div id="giao-dich-ops-detail-loading" class="ops-modal-loading" style="display:none;">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div id="giao-dich-ops-detail-content"></div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
      </div>
    </div>
  </div>
</div>

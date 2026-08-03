<div id="giao-dich-ops-approve-app">
  <div class="card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0">Duyệt chi phí lái xe</h4>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-label-secondary" id="btn-open-filter-de-nghi-ops">
          <i class="ti tabler-filter me-1"></i>Tìm kiếm
        </button>
        <button type="button" class="btn btn-icon btn-label-secondary" id="btn-reload-de-nghi-ops">
          <i class="ti tabler-refresh"></i>
        </button>
      </div>
    </div>

    <div class="card-body">
      <div class="row g-3 mb-4" id="de-nghi-ops-kpis">
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-primary">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Tổng đề nghị chi phí</div>
                  <div class="h5 mb-0 fw-bold" data-approve-kpi="total">0</div>
                </div>
                <span class="ops-wallet-kpi-icon"><i class="icon-base ti tabler-clipboard-list"></i></span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-warning">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Đang chờ</div>
                  <div class="h5 mb-0 fw-bold" data-approve-kpi="pending">0</div>
                </div>
                <span class="ops-wallet-kpi-icon"><i class="icon-base ti tabler-hourglass"></i></span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-success">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Đã chi trả</div>
                  <div class="h5 mb-0 fw-bold" data-approve-kpi="paid">0</div>
                </div>
                <span class="ops-wallet-kpi-icon"><i class="icon-base ti tabler-circle-check"></i></span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-sm-6 col-xl-3">
          <div class="card h-100 ops-wallet-kpi ops-wallet-kpi-info">
            <div class="card-body">
              <div class="d-flex align-items-center justify-content-between gap-3">
                <div>
                  <div class="text-muted small mb-1">Tổng tiền trang này</div>
                  <div class="h5 mb-0 fw-bold" data-approve-kpi="amount">0 đ</div>
                </div>
                <span class="ops-wallet-kpi-icon"><i class="icon-base ti tabler-cash"></i></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-bordered table-hover align-middle" id="table-de-nghi-ops">
          <thead class="table-light">
            <tr>
              <th style="width:70px;text-align:center !important"></th>
              <th style="width:50px">#</th>
              <th style="width:145px">Ngày tạo</th>
              <th style="width:145px">Mã đề nghị</th>
              <th style="width:160px">N.Viên / L.Xe</th>
              <th style="width:135px" class="text-end">Số tiền</th>
              <th style="width:130px">Booking</th>
              <th style="width:130px">Trạng thái</th>
              <th style="width:120px">Ghi sổ</th>
              <th>Mục đích</th>
            </tr>
          </thead>
          <tbody id="table-de-nghi-ops-tbody">
            <tr>
              <td colspan="10" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Đang tải...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div id="pagination-de-nghi-ops" class="mt-3">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="pagination-de-nghi-ops-info"></div>
          <nav>
            <ul class="pagination justify-content-center mb-0"></ul>
          </nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="pagination-de-nghi-ops-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="pagination-de-nghi-ops-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="de-nghi-ops-filter-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <form id="form-filter-de-nghi-ops">
        <div class="modal-header">
          <h5 class="modal-title">Tìm kiếm đề nghị chi phí</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Từ khóa</label>
              <input type="text" class="form-control" name="keyword" placeholder="Mã đề nghị, booking, mục đích">
            </div>
            <div class="col-md-3">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" name="trang_thai">
                <option value="">Tất cả</option>
                <option value="cho_duyet">Chờ duyệt</option>
                <option value="da_duyet">Đã duyệt</option>
                <option value="da_thanh_toan">Đã chi trả</option>
                <option value="tu_choi">Từ chối</option>
                <option value="huy">Hủy</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Ghi sổ</label>
              <select class="form-select" name="ledger_status">
                <option value="">Tất cả</option>
                <option value="da_ghi">Đã ghi sổ</option>
                <option value="chua_ghi">Chưa ghi sổ</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Nhân sự đề nghị</label>
              <select class="form-select" name="uid_ops" id="filter-de-nghi-ops-nhan-su">
                <option value="">Tất cả nhân sự</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">Lái xe</label>
              <select class="form-select" name="nid_lai_xe" id="filter-de-nghi-ops-lai-xe">
                <option value="">Tất cả lái xe</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Từ ngày</label>
              <input type="date" class="form-control" name="date_from">
            </div>
            <div class="col-md-3">
              <label class="form-label">Đến ngày</label>
              <input type="date" class="form-control" name="date_to">
            </div>
            <div class="col-md-3">
              <label class="form-label">Số tiền từ</label>
              <input type="text" class="form-control" name="amount_min" placeholder="0" inputmode="numeric">
            </div>
            <div class="col-md-3">
              <label class="form-label">Số tiền đến</label>
              <input type="text" class="form-control" name="amount_max" placeholder="0" inputmode="numeric">
            </div>
            <div class="col-md-3">
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
          <button type="button" class="btn btn-label-secondary" id="btn-reset-filter-de-nghi-ops">Reset</button>
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="submit" class="btn btn-primary">
            <i class="ti tabler-search me-1"></i>Tìm kiếm
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal fade" id="de-nghi-ops-detail-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Chi tiết đề nghị chi phí</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div id="de-nghi-ops-detail-loading" class="ops-modal-loading" style="display:none;">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div id="de-nghi-ops-detail-content"></div>
      </div>
      <div class="modal-footer" id="de-nghi-ops-detail-actions">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="de-nghi-ops-action-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-md modal-dialog-centered">
    <div class="modal-content">
      <form id="form-action-de-nghi-ops">
        <div class="modal-header">
          <h5 class="modal-title" id="de-nghi-ops-action-title">Cập nhật đề nghị</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" name="nid" id="de-nghi-ops-action-id">
          <input type="hidden" name="trang_thai" id="de-nghi-ops-action-status">
          <div class="mb-3">
            <label class="form-label" id="de-nghi-ops-action-note-label">Ghi chú</label>
            <textarea class="form-control" name="ghi_chu" id="de-nghi-ops-action-note" rows="3"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="submit" class="btn btn-primary" id="btn-submit-action-de-nghi-ops">
            <span class="spinner-border spinner-border-sm me-1 d-none" id="de-nghi-ops-action-spinner"></span>
            Xác nhận
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

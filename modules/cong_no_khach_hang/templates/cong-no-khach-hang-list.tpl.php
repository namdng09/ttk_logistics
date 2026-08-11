<div class="cnkh-page">
  <div class="card cnkh-filter-card mb-3">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0">Công nợ khách hàng</h4>
      <button type="button" class="btn btn-primary" id="cnkh-search">
        <i class="ti tabler-search me-1"></i>Tìm kiếm
      </button>
    </div>
    <div class="card-body">
      <div class="row g-2 align-items-end">
        <div class="col-xl-3 col-lg-4 col-md-6">
          <label class="form-label">Khách hàng</label>
          <select id="cnkh-filter-customer" class="form-select">
            <option value="">Tất cả</option>
          </select>
        </div>
        <div class="col-xl-2 col-lg-2 col-md-3 col-6">
          <label class="form-label">Từ tháng</label>
          <select id="cnkh-filter-from-month" class="form-select cnkh-month-select"></select>
        </div>
        <div class="col-xl-2 col-lg-2 col-md-3 col-6">
          <label class="form-label">Từ năm</label>
          <select id="cnkh-filter-from-year" class="form-select cnkh-year-select"></select>
        </div>
        <div class="col-xl-2 col-lg-2 col-md-3 col-6">
          <label class="form-label">Đến tháng</label>
          <select id="cnkh-filter-to-month" class="form-select cnkh-month-select"></select>
        </div>
        <div class="col-xl-2 col-lg-2 col-md-3 col-6">
          <label class="form-label">Đến năm</label>
          <select id="cnkh-filter-to-year" class="form-select cnkh-year-select"></select>
        </div>
        <div class="col-xl-3 col-lg-4 col-md-6">
          <label class="form-label">Trạng thái</label>
          <select id="cnkh-filter-status" class="form-select">
            <option value="">Tất cả</option>
            <option value="chua_thanh_toan">Chưa thanh toán</option>
            <option value="thanh_toan_mot_phan">Thanh toán một phần</option>
            <option value="da_thanh_toan">Đã thanh toán</option>
          </select>
        </div>
        <div class="col-xl-4 col-lg-5 col-md-6">
          <label class="form-label">Từ khóa</label>
          <input type="text" id="cnkh-filter-keyword" class="form-control" placeholder="Mã phiếu, số hóa đơn">
        </div>
        <div class="col-xl-2 col-lg-3 col-md-4 d-flex gap-2">
          <button type="button" class="btn btn-label-secondary w-100" id="cnkh-reset">
            <i class="ti tabler-refresh me-1"></i>Reset
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="row g-3 mb-3" id="cnkh-summary">
    <div class="col-xl-3 col-md-6">
      <div class="cnkh-summary-card">
        <div class="cnkh-summary-icon cnkh-summary-primary"><i class="ti tabler-receipt-2"></i></div>
        <div>
          <div class="cnkh-summary-label">Phải thu</div>
          <div class="cnkh-summary-value" id="cnkh-summary-total">0 đ</div>
        </div>
      </div>
    </div>
    <div class="col-xl-3 col-md-6">
      <div class="cnkh-summary-card">
        <div class="cnkh-summary-icon cnkh-summary-success"><i class="ti tabler-cash"></i></div>
        <div>
          <div class="cnkh-summary-label">Đã thanh toán</div>
          <div class="cnkh-summary-value" id="cnkh-summary-paid">0 đ</div>
        </div>
      </div>
    </div>
    <div class="col-xl-3 col-md-6">
      <div class="cnkh-summary-card">
        <div class="cnkh-summary-icon cnkh-summary-warning"><i class="ti tabler-hourglass"></i></div>
        <div>
          <div class="cnkh-summary-label">Còn lại</div>
          <div class="cnkh-summary-value" id="cnkh-summary-remaining">0 đ</div>
        </div>
      </div>
    </div>
    <div class="col-xl-3 col-md-6">
      <div class="cnkh-summary-card">
        <div class="cnkh-summary-icon cnkh-summary-info"><i class="ti tabler-users"></i></div>
        <div>
          <div class="cnkh-summary-label">Khách / Phiếu</div>
          <div class="cnkh-summary-value" id="cnkh-summary-count">0 / 0</div>
        </div>
      </div>
    </div>
  </div>

  <div class="card cnkh-list-card">
    <div class="card-body">
      <div class="table-responsive">
        <table class="table table-hover align-middle cnkh-table">
          <thead>
            <tr>
              <th style="width:52px"></th>
              <th>Khách hàng</th>
              <th>Tháng công nợ</th>
              <th class="text-center">Số phiếu</th>
              <th class="text-end">Phải thu</th>
              <th class="text-end">Đã TT</th>
              <th class="text-end">Còn lại</th>
              <th>Trạng thái</th>
              <th style="width:90px">CN</th>
            </tr>
          </thead>
          <tbody id="cnkh-table-body">
            <tr><td colspan="9" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr>
          </tbody>
        </table>
      </div>
      <div id="cnkh-pagination-wrap" class="mt-3" style="display:none;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="cnkh-pagination-info"></div>
          <nav>
            <ul class="pagination justify-content-center mb-0" id="cnkh-pagination"></ul>
          </nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="cnkh-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="cnkh-pagination-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="cnkh-payment-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Thanh toán công nợ</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
      </div>
      <div class="modal-body">
        <form id="cnkh-payment-form" class="needs-validation" novalidate>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Khách hàng</label>
              <input type="text" class="form-control" id="cnkh-pay-customer" readonly>
            </div>
            <div class="col-md-6">
              <label class="form-label">Tháng công nợ</label>
              <input type="text" class="form-control" id="cnkh-pay-month" readonly>
            </div>
            <div class="col-md-6">
              <label class="form-label">Quỹ nhận tiền <span class="text-danger">*</span></label>
              <select class="form-select" id="cnkh-pay-fund" required>
                <option value="">Chọn quỹ</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn quỹ.</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Ngày giao dịch <span class="text-danger">*</span></label>
              <input type="text" class="form-control flatpickr-date date-mask" id="cnkh-pay-date" required>
              <div class="invalid-feedback">Vui lòng nhập ngày giao dịch.</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Số tiền <span class="text-danger">*</span></label>
              <div class="input-group">
                <input type="text" class="form-control money-mask" id="cnkh-pay-amount" inputmode="numeric" placeholder="0" required>
                <span class="input-group-text">đ</span>
              </div>
              <div class="invalid-feedback">Vui lòng nhập số tiền.</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Phạm vi</label>
              <input type="text" class="form-control" id="cnkh-pay-scope" readonly>
            </div>
            <div class="col-12">
              <label class="form-label">Ghi chú</label>
              <textarea class="form-control" id="cnkh-pay-note" rows="2"></textarea>
            </div>
          </div>
          <div class="cnkh-pay-vouchers mt-3" id="cnkh-pay-vouchers"></div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" id="cnkh-payment-submit">
          <i class="ti tabler-check me-1"></i>Xác nhận thanh toán
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="cnkh-voucher-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Chi tiết phiếu trả khách hàng</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
      </div>
      <div class="modal-body" id="cnkh-voucher-body">
        <div class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></div>
      </div>
      <div class="modal-footer">
        <a href="#" target="_blank" class="btn btn-label-primary" id="cnkh-voucher-download">
          <i class="ti tabler-download me-1"></i>Tải phiếu trả
        </a>
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button>
      </div>
    </div>
  </div>
</div>

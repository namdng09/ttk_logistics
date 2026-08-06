<div class="card luong-lai-xe-page">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title mb-0">Lương lái xe</h4>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-label-secondary btn-icon" id="llx-btn-reload">
        <i class="ti tabler-refresh"></i>
      </button>
    </div>
  </div>

  <div class="card-body">
    <div class="row mb-3 align-items-center g-2">
      <div class="col-6 col-md-3 col-xl-2">
        <label class="form-label" for="llx-ky-luong-from">Từ kỳ</label>
        <input type="text" class="form-control flatpickr-month" id="llx-ky-luong-from" placeholder="MM/yyyy">
      </div>
      <div class="col-6 col-md-3 col-xl-2">
        <label class="form-label" for="llx-ky-luong-to">Đến kỳ</label>
        <input type="text" class="form-control flatpickr-month" id="llx-ky-luong-to" placeholder="MM/yyyy">
      </div>
      <div class="col-12 col-md-6 col-xl-8">
        <label class="form-label" for="llx-keyword">Tìm lái xe</label>
        <div class="input-group">
          <input type="text" class="form-control" id="llx-keyword" placeholder="Tên, mã nhân viên, SĐT, số tài khoản ngân hàng...">
          <button type="button" class="btn btn-label-primary" id="llx-search-btn" title="Tìm kiếm"><i class="ti tabler-search"></i></button>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-hover llx-table">
        <thead class="table-light">
          <tr>
            <th class="llx-col-actions"></th>
            <th class="llx-col-stt">#</th>
            <th class="llx-col-driver">Lái xe</th>
            <th class="llx-col-period">Thời gian</th>
            <th class="llx-col-count text-center">Số kế hoạch</th>
            <th class="llx-col-money text-end">Tổng lương</th>
            <th class="llx-col-money text-end">Hoàn chi phí</th>
            <th class="llx-col-money text-end">Tạm ứng</th>
            <th class="llx-col-money text-end">Khấu trừ</th>
            <th class="llx-col-money text-end">Thực lãnh</th>
          </tr>
        </thead>
        <tbody id="llx-table-body">
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

    <div id="llx-pagination" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="llx-pagination-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="llx-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="llx-pagination-total"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="llx-detail-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0" id="llx-detail-title">Chi tiết lương lái xe</h5>
          <div class="small text-muted" id="llx-detail-meta"></div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div id="llx-detail-loading" class="llx-loading-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Tổng lương</span><strong id="llx-detail-plan-salary">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Hoàn chi phí</span><strong id="llx-detail-reimburse">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Tạm ứng</span><strong id="llx-detail-advance">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Khấu trừ</span><strong id="llx-detail-deduct">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Lương chốt</span><strong id="llx-detail-final">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Thực lãnh</span><strong id="llx-detail-net">0</strong></div></div>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered table-hover llx-detail-table">
            <thead class="table-light">
              <tr>
                <th class="llx-col-stt">#</th>
                <th>Kế hoạch</th>
                <th>Ngày</th>
                <th class="text-end">Hoàn chi phí</th>
                <th class="text-end">Lương kế hoạch</th>
              </tr>
            </thead>
            <tbody id="llx-detail-body"></tbody>
          </table>
        </div>
        <div class="mt-4">
          <h6 class="mb-2">Lịch sử tạm ứng</h6>
          <div class="table-responsive">
            <table class="table table-bordered table-hover llx-advance-table">
              <thead class="table-light">
                <tr>
                  <th style="width:60px">#</th>
                  <th style="width:160px">Ngày</th>
                  <th style="width:150px">Mã giao dịch</th>
                  <th>Nội dung</th>
                  <th class="text-end" style="width:150px">Số tiền</th>
                </tr>
              </thead>
              <tbody id="llx-advance-body"></tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-primary" id="llx-btn-advance">
          <i class="ti tabler-cash me-1"></i>Ứng tiền
        </button>
        <button type="button" class="btn btn-success" id="llx-btn-pay">
          <i class="ti tabler-wallet me-1"></i>Thanh toán lương
        </button>
        <a class="btn btn-label-secondary" id="llx-print-link" target="_blank">
          <i class="ti tabler-printer me-1"></i>In phiếu lương
        </a>
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button>
      </div>
    </div>
  </div>
</div>

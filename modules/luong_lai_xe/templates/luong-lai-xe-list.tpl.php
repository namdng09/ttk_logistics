<div class="card luong-lai-xe-page">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title mb-0">Lương lái xe</h4>
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
      <div class="col-12 col-md-6 col-xl-7">
        <label class="form-label" for="llx-keyword">Tìm lái xe</label>
        <div class="input-group">
          <input type="text" class="form-control" id="llx-keyword" placeholder="Tên, mã nhân viên, SĐT, số tài khoản ngân hàng...">
          <button type="button" class="btn btn-label-primary" id="llx-search-btn" title="Tìm kiếm"><i class="ti tabler-search"></i></button>
        </div>
      </div>
      <div class="col-auto col-xl-1 text-end">
        <label class="form-label d-none d-xl-block">&nbsp;</label>
        <button type="button" class="btn btn-label-secondary btn-icon" id="llx-btn-reload" title="Làm mới">
          <i class="ti tabler-refresh"></i>
        </button>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-hover llx-table">
        <thead class="table-light">
          <tr>
            <th class="llx-col-actions">CN</th>
            <th class="llx-col-stt">#</th>
            <th class="llx-col-driver">Lái xe</th>
            <th class="llx-col-period">Thời gian</th>
            <th class="llx-col-count text-center">Số chuyến</th>
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
          <h6 class="mb-2">Lịch sử thanh toán lương</h6>
          <div class="table-responsive">
            <table class="table table-bordered table-hover llx-payment-table">
              <thead class="table-light">
                <tr>
                  <th style="width:36px">#</th>
                  <th style="width:84px">Ngày</th>
                  <th style="width:130px">Mã giao dịch</th>
                  <th>Nội dung</th>
                  <th class="text-end" style="width:120px">Số tiền</th>
                  <th class="text-center" style="width:88px">T.Thái</th>
                </tr>
              </thead>
              <tbody id="llx-payment-body"></tbody>
            </table>
          </div>
        </div>
        <div class="row g-3 mt-4">
          <div class="col-md-6">
            <h6 class="mb-2">Lịch sử tạm ứng</h6>
            <div class="table-responsive">
              <table class="table table-bordered table-hover llx-advance-table">
                <thead class="table-light">
                  <tr>
                    <th style="width:36px">#</th>
                    <th style="width:84px">Ngày</th>
                    <th style="width:130px">Mã giao dịch</th>
                    <th>Nội dung</th>
                    <th class="text-end" style="width:120px">Số tiền</th>
                    <th class="text-center" style="width:88px">T.Thái</th>
                  </tr>
                </thead>
                <tbody id="llx-advance-body"></tbody>
              </table>
            </div>
          </div>
          <div class="col-md-6">
            <h6 class="mb-2">Lịch sử khấu trừ tạm ứng</h6>
            <div class="table-responsive">
              <table class="table table-bordered table-hover llx-khau-tru-table">
                <thead class="table-light">
                  <tr>
                    <th style="width:36px">#</th>
                    <th style="width:84px">Ngày</th>
                    <th style="width:130px">Mã giao dịch</th>
                    <th>Nội dung</th>
                    <th class="text-end" style="width:120px">Số tiền</th>
                    <th class="text-center" style="width:88px">T.Thái</th>
                  </tr>
                </thead>
                <tbody id="llx-khau-tru-body"></tbody>
              </table>
            </div>
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

<div class="modal fade" id="llx-pay-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0" id="llx-pay-title">Thanh toán lương lái xe</h5>
          <div class="small text-muted" id="llx-pay-driver"></div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div id="llx-pay-loading" class="llx-loading-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Tổng lương</span><strong id="llx-pay-plan-salary">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Hoàn chi phí</span><strong id="llx-pay-reimburse">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Tạm ứng</span><strong id="llx-pay-advance">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Khấu trừ</span><strong id="llx-pay-deduct">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Lương chốt</span><strong id="llx-pay-final">0</strong></div></div>
          <div class="col-6 col-lg-2"><div class="llx-summary-box"><span>Đã thanh toán</span><strong id="llx-pay-paid">0</strong></div></div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-6 col-lg-3"><div class="llx-summary-box llx-summary-box-accent"><span>Lương phải trả</span><strong id="llx-pay-remaining">0</strong></div></div>
          <div class="col-6 col-lg-3"><div class="llx-summary-box"><span>Thực lãnh (sau khấu trừ)</span><strong id="llx-pay-net">0</strong></div></div>
        </div>
        <form id="llx-pay-form" class="needs-validation" novalidate>
          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label" for="llx-pay-ngay-chi">Ngày thanh toán <span class="text-danger">*</span></label>
              <input type="text" class="form-control flatpickr-date" id="llx-pay-ngay-chi" placeholder="dd/mm/yyyy" required>
              <div class="invalid-feedback">Vui lòng nhập ngày thanh toán.</div>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="llx-pay-hinh-thuc">Hình thức chi</label>
              <select class="form-select" id="llx-pay-hinh-thuc">
                <option value="tien_mat" selected>Tiền mặt</option>
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="khac">Khác</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="llx-pay-quy">Quỹ chi <span class="text-danger">*</span></label>
              <select class="form-select" id="llx-pay-quy" required>
                <option value="">-- Chọn quỹ chi --</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn quỹ chi.</div>
            </div>
            <div class="col-md-4">
              <label class="form-label" for="llx-pay-so-tien">Số tiền thanh toán <span class="text-danger">*</span></label>
              <input type="text" class="form-control money-mask" id="llx-pay-so-tien" placeholder="0" inputmode="numeric" required>
              <div class="invalid-feedback">Vui lòng nhập số tiền thanh toán.</div>
            </div>
            <div class="col-md-8">
              <label class="form-label" for="llx-pay-ghi-chu">Ghi chú chung</label>
              <textarea class="form-control" id="llx-pay-ghi-chu" rows="2"></textarea>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-success" id="llx-pay-save">
          <i class="ti tabler-device-floppy me-1"></i>Lưu phiếu thanh toán
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="llx-advance-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0" id="llx-advance-title">Ứng tiền lái xe</h5>
          <div class="small text-muted" id="llx-advance-driver"></div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div id="llx-advance-loading" class="llx-loading-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <form id="llx-advance-form" class="needs-validation" novalidate>
          <div class="row g-3">
            <div class="col-6 col-md-4">
              <label class="form-label" for="llx-adv-ngay-ung">Ngày ứng tiền <span class="text-danger">*</span></label>
              <input type="text" class="form-control flatpickr-date" id="llx-adv-ngay-ung" placeholder="dd/mm/yyyy" required>
              <div class="invalid-feedback">Vui lòng nhập ngày ứng tiền.</div>
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="llx-adv-ky-luong">Kỳ lương <span class="text-danger">*</span></label>
              <input type="text" class="form-control flatpickr-month" id="llx-adv-ky-luong" placeholder="MM/yyyy" required>
              <div class="invalid-feedback">Vui lòng chọn kỳ lương.</div>
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="llx-adv-hinh-thuc">Hình thức chi</label>
              <select class="form-select" id="llx-adv-hinh-thuc">
                <option value="tien_mat" selected>Tiền mặt</option>
                <option value="chuyen_khoan">Chuyển khoản</option>
                <option value="khac">Khác</option>
              </select>
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="llx-adv-quy">Quỹ chi <span class="text-danger">*</span></label>
              <select class="form-select" id="llx-adv-quy" required>
                <option value="">-- Chọn quỹ chi --</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn quỹ chi.</div>
            </div>
            <div class="col-6 col-md-4">
              <label class="form-label" for="llx-adv-so-tien">Số tiền <span class="text-danger">*</span></label>
              <input type="text" class="form-control money-mask" id="llx-adv-so-tien" placeholder="0" inputmode="numeric" required>
              <div class="invalid-feedback">Vui lòng nhập số tiền lớn hơn 0.</div>
            </div>
            <div class="col-12">
              <label class="form-label" for="llx-adv-ghi-chu">Ghi chú chung</label>
              <textarea class="form-control" id="llx-adv-ghi-chu" rows="2"></textarea>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Hủy</button>
        <button type="button" class="btn btn-primary" id="llx-advance-save">
          <i class="ti tabler-device-floppy me-1"></i>Lưu
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="llx-deduct-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0" id="llx-deduct-title">Khấu trừ tạm ứng lương</h5>
          <div class="small text-muted" id="llx-deduct-driver"></div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div id="llx-deduct-loading" class="llx-loading-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div id="llx-deduct-info" class="card border-0 bg-light mb-3">
          <div class="card-body">
            <div class="row g-2">
              <div class="col-md-4"><span class="llx-summary-label">Lái xe</span><div class="fw-bold" id="llx-deduct-info-driver">-</div></div>
              <div class="col-md-2"><span class="llx-summary-label">Kỳ lương</span><div class="fw-bold" id="llx-deduct-info-ky">-</div></div>
              <div class="col-md-3"><span class="llx-summary-label">Lương còn lại</span><div class="fw-bold text-primary" id="llx-deduct-info-tong-luong">-</div></div>
              <div class="col-md-3"><span class="llx-summary-label">Tạm ứng còn lại</span><div class="fw-bold text-danger" id="llx-deduct-info-du-tru">-</div></div>
            </div>
          </div>
        </div>
        <form id="llx-deduct-form" class="needs-validation" novalidate>
          <div class="row g-3">
            <div class="col-6 col-md-4">
              <label class="form-label" for="llx-deduct-ky-luong">Kỳ lương <span class="text-danger">*</span></label>
              <input type="text" class="form-control flatpickr-month" id="llx-deduct-ky-luong" placeholder="MM/yyyy" required>
              <div class="invalid-feedback">Vui lòng chọn kỳ lương.</div>
            </div>
            <div class="col-6 col-md-8">
              <label class="form-label" for="llx-deduct-so-tien">Số tiền khấu trừ tạm ứng <span class="text-danger">*</span></label>
              <input type="text" class="form-control money-mask" id="llx-deduct-so-tien" placeholder="0" inputmode="numeric" required>
              <div class="invalid-feedback">Vui lòng nhập số tiền khấu trừ.</div>
            </div>
            <div class="col-12">
              <label class="form-label" for="llx-deduct-ghi-chu">Ghi chú</label>
              <textarea class="form-control" id="llx-deduct-ghi-chu" rows="3"></textarea>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" id="llx-deduct-save">
          <i class="ti tabler-device-floppy me-1"></i>Lưu khấu trừ
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="llx-history-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0" id="llx-history-title">Lịch sử tạm ứng</h5>
          <div class="small text-muted" id="llx-history-driver"></div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div id="llx-history-loading" class="llx-loading-overlay">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div class="row g-3 mb-3">
          <div class="col-6 col-lg-3"><div class="llx-summary-box"><span>Tạm ứng đầu kỳ</span><strong id="llx-history-dau-ky">0</strong></div></div>
          <div class="col-6 col-lg-3"><div class="llx-summary-box"><span>Ứng trong kỳ</span><strong id="llx-history-ung-ky">0</strong></div></div>
          <div class="col-6 col-lg-3"><div class="llx-summary-box"><span>Đã khấu trừ</span><strong id="llx-history-khau-tru">0</strong></div></div>
          <div class="col-6 col-lg-3"><div class="llx-summary-box"><span>Dư cuối kỳ</span><strong id="llx-history-cuoi-ky">0</strong></div></div>
        </div>
        <div class="mb-3">
          <h6 class="mb-2">Phiếu ứng tiền trong kỳ</h6>
          <div class="table-responsive">
            <table class="table table-bordered table-hover llx-advance-table">
              <thead class="table-light">
                <tr>
                  <th style="width:150px">Mã phiếu</th>
                  <th style="width:110px">Ngày</th>
                  <th class="text-end" style="width:150px">Số tiền</th>
                  <th>Quỹ chi</th>
                  <th>Hình thức</th>
                  <th class="text-center" style="width:110px">Trạng thái</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody id="llx-history-advance-body"></tbody>
            </table>
          </div>
        </div>
        <div>
          <h6 class="mb-2">Khấu trừ tạm ứng trong kỳ</h6>
          <div class="table-responsive">
            <table class="table table-bordered table-hover llx-khau-tru-table">
              <thead class="table-light">
                <tr>
                  <th style="width:110px">Ngày</th>
                  <th class="text-end" style="width:150px">Số tiền</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody id="llx-history-khau-tru-body"></tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button>
      </div>
    </div>
  </div>
</div>

<div id="dn-app" class="dn-list-app">
  <div class="card dn-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0"><i class="ti tabler-receipt-2 me-2 dn-title-icon"></i>Đề nghị thanh toán</h4>
      <div class="d-flex align-items-center gap-3">
        <div class="dn-sum-bar" id="dn-sum"></div>
        <button type="button" class="btn btn-primary" id="dn-btn-create"><i class="ti tabler-plus me-1"></i>Tạo đề nghị</button>
      </div>
    </div>
    <div class="card-body dn-filter-body">
      <div class="dn-filter-grid">
        <div class="dn-filter-field">
          <label class="form-label" for="dn-f-q">Từ khóa</label>
          <input type="text" class="form-control" id="dn-f-q" placeholder="Mã đề nghị, số hoá đơn">
        </div>
        <div class="dn-filter-field">
          <label class="form-label" for="dn-f-issuer">Nhà cung cấp (trong hoá đơn)</label>
          <select class="form-select" id="dn-f-issuer"><option value="">Tất cả</option></select>
        </div>
        <div class="dn-filter-field">
          <label class="form-label" for="dn-f-payee">Bên nhận tiền</label>
          <select class="form-select" id="dn-f-payee"><option value="">Tất cả</option></select>
        </div>
        <div class="dn-filter-field">
          <label class="form-label" for="dn-f-ht">Hình thức TT</label>
          <select class="form-select" id="dn-f-ht">
            <option value="">Tất cả</option>
            <option value="CK">Chuyển khoản</option>
            <option value="TM">Tiền mặt</option>
          </select>
        </div>
        <div class="dn-filter-actions">
          <button type="button" class="btn btn-primary" id="dn-btn-search"><i class="ti tabler-search me-1"></i>Tìm</button>
          <button type="button" class="btn btn-label-secondary dn-filter-reset" id="dn-btn-reset" title="Reset bộ lọc" aria-label="Reset bộ lọc"><i class="ti tabler-refresh"></i></button>
        </div>
      </div>
      <div class="dn-quick-filters mt-3">
        <button type="button" class="dn-chip" data-chip="qua_han"><i class="ti tabler-alarm me-1"></i>Quá hạn thanh toán</button>
        <button type="button" class="dn-chip" data-chip="chua_hd"><i class="ti tabler-file-off me-1"></i>Có dòng chưa hoá đơn</button>
        <button type="button" class="dn-chip" data-chip="nhieu_hd"><i class="ti tabler-files me-1"></i>Gồm nhiều hoá đơn</button>
      </div>
    </div>
  </div>

  <div class="card dn-list-card">
    <div class="card-body p-0">
      <div class="dn-status-tabs-wrap">
        <ul class="nav nav-pills dn-status-tabs" id="dn-tabs" role="tablist"></ul>
      </div>

      <div class="dn-table-scroll">
        <div class="table-responsive">
          <table id="dn-table" class="table table-bordered table-hover mb-0 dn-list-table">
            <thead class="table-light">
              <tr>
                <th style="width:44px;text-align:center;">#</th>
                <th style="width:165px;">Mã đề nghị / Ngày tạo</th>
                <th style="width:170px;">Bên nhận tiền</th>
                <th style="width:230px;">Hoá đơn liên quan</th>
                <th style="width:105px;">Chi phí</th>
                <th class="text-end" style="width:105px;">Trước VAT</th>
                <th class="text-end" style="width:90px;">VAT</th>
                <th class="text-end" style="width:110px;">Sau VAT</th>
                <th class="text-end" style="width:120px;">Đã trả / Còn lại</th>
                <th style="width:135px;">Hạn TT / Hình thức</th>
                <th style="width:300px;">Trạng thái</th>
              </tr>
            </thead>
            <tbody id="dn-tbody">
              <tr><td colspan="11" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="dn-pagination" class="mt-3 px-3 pb-3" style="display:none;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="dn-pagination-info"></div>
          <nav><ul class="pagination justify-content-center mb-0"></ul></nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="dn-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="dn-pagination-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Menu dòng (click # hoặc chuột phải) -->
  <ul class="dropdown-menu dn-menu" id="dn-menu" style="display:none;position:fixed;z-index:1090;min-width:200px;">
    <li><h6 class="dropdown-header" id="dn-menu-title"></h6></li>
    <li><button type="button" class="dropdown-item" data-menu="view"><i class="ti tabler-eye me-2 text-info"></i>Xem chi tiết</button></li>
    <li><button type="button" class="dropdown-item" data-menu="edit"><i class="ti tabler-edit me-2 text-primary"></i>Sửa</button></li>
    <li><hr class="dropdown-divider"></li>
    <li><button type="button" class="dropdown-item text-danger" data-menu="delete"><i class="ti tabler-trash me-2"></i>Xoá</button></li>
  </ul>

  <!-- Chi tiết -->
  <div class="modal fade" id="dn-view-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <div class="d-flex align-items-center gap-2">
            <h5 class="modal-title mb-0">Chi tiết đề nghị thanh toán</h5>
            <span class="badge bg-label-secondary border" id="dn-view-ma"></span>
            <span id="dn-view-status"></span>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div class="dn-loading" id="dn-view-loading"><div class="spinner-border text-primary" role="status"></div></div>
          <div id="dn-view-body"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Tạo / Sửa đề nghị (1 modal dùng chung: mode 'create' hoặc 'edit', xem createState.mode trong JS) -->
  <div class="modal fade" id="dn-create-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" style="max-width:1320px;">
      <div class="modal-content">
        <form id="dn-create-form" novalidate>
          <div class="modal-header">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title mb-0" id="dn-create-modal-title">Tạo đề nghị thanh toán</h5>
              <span class="badge bg-label-secondary border d-none" id="dn-create-modal-ma"></span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="position:relative;max-height:78vh;overflow-y:auto;overflow-x:hidden;">
            <div class="dn-loading" id="dn-create-loading"><div class="spinner-border text-primary" role="status"></div></div>
            <div class="alert alert-danger py-2 d-none" id="dn-create-reject"></div>
            <div class="alert alert-primary py-2 mb-3" id="dn-create-alert-hint">Chọn <strong>bên nhận tiền</strong> trước — hệ thống liệt kê mọi dòng chi phí (của bất kỳ NCC/hoá đơn nào) đang chờ gộp mà có bên nhận tiền này. Dòng chưa có số hoá đơn điền bù ngay tại đây.</div>
            <div class="row g-3 mb-2">
              <div class="col-md-6">
                <label class="form-label" for="dn-create-payee">Bên nhận tiền <span class="text-danger">*</span></label>
                <select class="form-select" id="dn-create-payee"><option value="">Chọn bên nhận tiền…</option></select>
                <div class="invalid-feedback" id="dn-create-payee-error">Vui lòng chọn bên nhận tiền.</div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dn-create-q">Lọc theo tên chi phí</label>
                <input type="text" class="form-control" id="dn-create-q" placeholder="Gõ để lọc">
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dn-create-daterange">Ngày kế hoạch</label>
                <input type="text" class="form-control" id="dn-create-daterange" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
              </div>
            </div>
            <div id="dn-create-bulk"></div>
            <div id="dn-create-empty" class="text-muted small">Chọn bên nhận tiền để hiện các dòng chi phí khả dụng.</div>
            <div class="table-responsive d-none" id="dn-create-table-wrap">
              <table class="table table-sm table-bordered dn-lines mb-0">
                <thead><tr>
                  <th style="width:3%;"></th>
                  <th style="width:9%;">NCC</th>
                  <th style="width:10%;">Kế hoạch</th>
                  <th style="width:16%;">Tên chi phí</th>
                  <th style="width:5%;">Loại</th>
                  <th class="text-end" style="width:9%;">Đơn giá</th>
                  <th class="text-end" style="width:5%;">SL</th>
                  <th class="text-end" style="width:5%;">VAT%</th>
                  <th class="text-end" style="width:9%;">Sau VAT</th>
                  <th style="width:13%;">Ghi chú</th>
                  <th style="width:9%;">Số HĐ</th>
                  <th style="width:9%;">Ngày HĐ</th>
                </tr></thead>
                <tbody id="dn-create-lines"></tbody>
                <tfoot><tr class="table-light"><td colspan="8" class="text-end fw-semibold">Đã chọn <span id="dn-create-count">0</span> dòng · Tổng sau VAT</td><td class="text-end fw-semibold" id="dn-create-total">0 đ</td><td colspan="3"></td></tr></tfoot>
              </table>
            </div>
            <div class="row g-3 mt-1">
              <div class="col-md-4">
                <label class="form-label" for="dn-create-han-tt">Hạn thanh toán</label>
                <input type="text" class="form-control flatpickr-date date-mask" id="dn-create-han-tt" placeholder="dd/mm/yyyy" autocomplete="off">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="dn-create-ht">Hình thức thanh toán</label>
                <select class="form-select" id="dn-create-ht">
                  <option value="">Chưa chọn</option>
                  <option value="CK">Chuyển khoản</option>
                  <option value="TM">Tiền mặt</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="dn-create-ghi-chu">Ghi chú</label>
                <input type="text" class="form-control" id="dn-create-ghi-chu" placeholder="Ghi chú thêm (nếu có)">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" class="btn btn-label-primary" id="dn-create-save"><i class="ti tabler-device-floppy me-1"></i>Lưu nháp</button>
            <button type="button" class="btn btn-primary" id="dn-create-save-send"><i class="ti tabler-send me-1"></i>Gửi duyệt</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Từ chối / Trả lại -->
  <div class="modal fade" id="dn-reject-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="dn-reject-title">Từ chối</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <label class="form-label" for="dn-reject-reason">Lý do <span class="text-danger">*</span></label>
          <textarea class="form-control" id="dn-reject-reason" rows="3" maxlength="255" placeholder="Nhập lý do..."></textarea>
          <div class="invalid-feedback">Vui lòng nhập lý do.</div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-danger" id="dn-reject-confirm"><i class="ti tabler-x me-1"></i>Xác nhận</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Ghi nhận thanh toán -->
  <div class="modal fade" id="dn-pay-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="dn-pay-title">Ghi nhận thanh toán</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <div class="text-muted small mb-3" id="dn-pay-info"></div>
          <div class="mb-3">
            <label class="form-label" for="dn-pay-amount">Số tiền đợt này <span class="text-danger">*</span></label>
            <div class="input-group"><span class="input-group-text">đ</span><input type="text" class="form-control money-mask" id="dn-pay-amount" inputmode="numeric" placeholder="0"></div>
          </div>
          <div class="mb-3">
            <label class="form-label" for="dn-pay-ht">Hình thức <span class="text-danger">*</span></label>
            <select class="form-select" id="dn-pay-ht">
              <option value="CK">Chuyển khoản</option>
              <option value="TM">Tiền mặt</option>
            </select>
          </div>
          <div class="mb-3">
            <label class="form-label" for="dn-pay-quy">Quỹ chi tiền <span class="text-danger">*</span> <span class="small text-muted" id="dn-pay-quy-hint"></span></label>
            <select class="form-select" id="dn-pay-quy"><option value="">Chọn quỹ</option></select>
            <div class="invalid-feedback" id="dn-pay-quy-error">Vui lòng chọn quỹ chi tiền.</div>
          </div>
          <div>
            <label class="form-label" for="dn-pay-note">Ghi chú</label>
            <input type="text" class="form-control" id="dn-pay-note" maxlength="255">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary" id="dn-pay-confirm"><i class="ti tabler-cash me-1"></i>Xác nhận</button>
        </div>
      </div>
    </div>
  </div>
</div>

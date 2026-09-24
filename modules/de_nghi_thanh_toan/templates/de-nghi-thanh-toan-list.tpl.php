<div id="dn-app" class="dn-list-app">
  <div class="card dn-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0"><i class="ti tabler-receipt-2 me-2 dn-title-icon"></i>Đề nghị thanh toán</h4>
      <div class="dn-sum-bar" id="dn-sum"></div>
    </div>
    <div class="card-body dn-filter-body">
      <div class="dn-filter-grid">
        <div class="dn-filter-field">
          <label class="form-label" for="dn-f-q">Từ khóa</label>
          <input type="text" class="form-control" id="dn-f-q" placeholder="Mã đề nghị, số hoá đơn">
        </div>
        <div class="dn-filter-field">
          <label class="form-label" for="dn-f-issuer">Bên phát hành</label>
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
        <button type="button" class="dn-chip" data-chip="chua_hd"><i class="ti tabler-file-off me-1"></i>Chưa có số hoá đơn</button>
        <button type="button" class="dn-chip" data-chip="khac_ben"><i class="ti tabler-user-dollar me-1"></i>Nhận tiền khác bên phát hành</button>
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
                <th style="width:210px;">Bên phát hành / Hoá đơn</th>
                <th style="width:160px;">Bên nhận tiền</th>
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

  <!-- Sửa thông tin đề nghị -->
  <div class="modal fade" id="dn-edit-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <form id="dn-edit-form" novalidate>
          <div class="modal-header">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title mb-0">Sửa đề nghị thanh toán</h5>
              <span class="badge bg-label-secondary border" id="dn-edit-ma"></span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="position:relative;">
            <div class="dn-loading" id="dn-edit-loading"><div class="spinner-border text-primary" role="status"></div></div>
            <div class="alert alert-danger py-2 d-none" id="dn-edit-reject"></div>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Bên phát hành</label>
                <input type="text" class="form-control" id="dn-edit-ncc" readonly>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="dn-edit-so-hd">Số hoá đơn</label>
                <input type="text" class="form-control" id="dn-edit-so-hd" maxlength="50" placeholder="Chưa có cũng được, điền sau">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="dn-edit-ngay-hd">Ngày hoá đơn</label>
                <input type="text" class="form-control flatpickr-date date-mask" id="dn-edit-ngay-hd" placeholder="dd/mm/yyyy" autocomplete="off">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="dn-edit-han-tt">Hạn thanh toán</label>
                <input type="text" class="form-control flatpickr-date date-mask" id="dn-edit-han-tt" placeholder="dd/mm/yyyy" autocomplete="off">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="dn-edit-ht">Hình thức thanh toán</label>
                <select class="form-select" id="dn-edit-ht">
                  <option value="">Chưa chọn</option>
                  <option value="CK">Chuyển khoản</option>
                  <option value="TM">Tiền mặt</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="dn-edit-ghi-chu">Ghi chú</label>
                <input type="text" class="form-control" id="dn-edit-ghi-chu" placeholder="Ghi chú thêm (nếu có)">
              </div>
              <div class="col-12">
                <div class="form-check">
                  <input type="checkbox" class="form-check-input" id="dn-edit-trung" checked>
                  <label class="form-check-label" for="dn-edit-trung">Đối tác nhận tiền trùng bên phát hành</label>
                </div>
                <div id="dn-edit-payee-box" class="dn-payee-box mt-2" style="display:none;">
                  <label class="form-label" for="dn-edit-payee">Đối tác nhận tiền <span class="text-danger">*</span></label>
                  <select class="form-select" id="dn-edit-payee"><option value="">Chọn nhân viên hoặc NCC khác…</option></select>
                  <div class="invalid-feedback" id="dn-edit-payee-error">Chọn đối tác nhận tiền hoặc tick "trùng bên phát hành".</div>
                </div>
              </div>
            </div>
            <div class="fw-semibold mt-4 mb-2">Các dòng chi phí trong đề nghị</div>
            <div class="table-responsive">
              <table class="table table-sm table-bordered dn-lines mb-0">
                <thead><tr><th>Kế hoạch</th><th>Tên chi phí</th><th class="text-end">Sau VAT</th><th style="width:60px;"></th></tr></thead>
                <tbody id="dn-edit-lines"></tbody>
              </table>
            </div>
            <div class="small text-muted mt-1">Thêm dòng chi phí vào đề nghị: chọn dòng ở tab Chi phí của kế hoạch rồi bấm "Tạo đề nghị thanh toán".</div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" class="btn btn-label-primary" id="dn-edit-save"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>
            <button type="button" class="btn btn-primary" id="dn-edit-save-send"><i class="ti tabler-send me-1"></i>Lưu &amp; gửi duyệt</button>
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

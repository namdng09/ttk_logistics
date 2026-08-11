<div class="card ptkh-page">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title mb-0">Phiếu trả khách hàng</h4>
    <button type="button" class="btn btn-primary" id="ptkh-open-create"><i class="ti tabler-plus me-1"></i>Tạo phiếu</button>
  </div>
  <div class="card-body">
    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-3"><label class="form-label">Khách hàng</label><select id="ptkh-filter-customer" class="form-select ptkh-customer-select"><option value="">Tất cả</option></select></div>
      <div class="col-md-2"><label class="form-label">Tháng HT</label><input type="text" id="ptkh-filter-month" class="form-control" placeholder="YYYYMM"></div>
      <div class="col-md-2"><label class="form-label">Trạng thái</label><select id="ptkh-filter-status" class="form-select"><option value="">Tất cả</option><option value="chua_duyet">Chờ duyệt</option><option value="da_duyet">Đã duyệt</option><option value="khong_duyet">Không duyệt</option></select></div>
      <div class="col-md-4"><label class="form-label">Tìm kiếm</label><div class="input-group"><input type="text" id="ptkh-keyword" class="form-control" placeholder="Mã phiếu, mã khách, số hóa đơn"><button class="btn btn-label-primary" id="ptkh-search"><i class="ti tabler-search"></i></button></div></div>
      <div class="col-md-1"><button class="btn btn-label-secondary btn-icon" id="ptkh-reload" title="Làm mới"><i class="ti tabler-refresh"></i></button></div>
    </div>
    <div class="table-responsive">
      <table class="table table-bordered table-hover align-middle">
        <thead class="table-light"><tr><th style="width:46px">CN</th><th>Mã phiếu</th><th>Khách hàng</th><th>Thời gian</th><th class="text-end">Tổng tiền</th><th class="text-end">Đã TT</th><th class="text-end">Còn lại</th><th>Trạng thái</th></tr></thead>
        <tbody id="ptkh-table-body"><tr><td colspan="8" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr></tbody>
      </table>
    </div>
    <div id="ptkh-pagination-wrap" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="ptkh-pagination-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0" id="ptkh-pagination"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="ptkh-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="ptkh-pagination-total-pages"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="ptkh-create-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">Tạo phiếu trả khách hàng</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body position-relative">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-3"><label class="form-label">Khách hàng <span class="text-danger">*</span></label><select id="ptkh-create-customer" class="form-select ptkh-customer-select"><option value="">Chọn khách hàng</option></select></div>
          <div class="col-md-2"><label class="form-label">Từ ngày</label><input type="text" id="ptkh-create-from" class="form-control flatpickr-date date-mask" placeholder="dd/mm/yyyy"></div>
          <div class="col-md-2"><label class="form-label">Đến ngày</label><input type="text" id="ptkh-create-to" class="form-control flatpickr-date date-mask" placeholder="dd/mm/yyyy"></div>
          <div class="col-md-3"><label class="form-label">Mã phiếu khách</label><input type="text" id="ptkh-create-code" class="form-control" placeholder="Để trống dùng mã hệ thống"></div>
          <div class="col-md-2"><button type="button" class="btn btn-label-primary w-100" id="ptkh-load-candidates"><i class="ti tabler-filter me-1"></i>Lọc</button></div>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle">
            <thead class="table-light"><tr><th class="text-center" style="width:44px"><input type="checkbox" id="ptkh-check-all"></th><th>Kế hoạch</th><th>Trạng thái phiếu</th><th>Ngày</th><th>Tuyến</th><th class="text-end">Doanh thu</th><th class="text-end">Chi hộ</th><th class="text-end">Tổng</th></tr></thead>
            <tbody id="ptkh-candidate-body"><tr><td colspan="8" class="text-center text-muted py-4">Chọn khách hàng rồi bấm Lọc.</td></tr></tbody>
          </table>
        </div>
        <div class="d-flex justify-content-end gap-3 mt-3">
          <div class="ptkh-total-box"><span>Đã chọn</span><strong id="ptkh-selected-count">0</strong></div>
          <div class="ptkh-total-box"><span>Tổng tiền</span><strong id="ptkh-selected-total">0</strong></div>
        </div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button><button type="button" class="btn btn-primary" id="ptkh-create-submit"><i class="ti tabler-device-floppy me-1"></i>Tạo phiếu</button></div>
    </div>
  </div>
</div>

<div class="modal fade" id="ptkh-detail-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="ptkh-detail-title">Chi tiết phiếu</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body" id="ptkh-detail-body"></div>
      <div class="modal-footer"><a class="btn btn-label-primary" id="ptkh-detail-download" target="_blank"><i class="ti tabler-download me-1"></i>Tải phiếu trả</a><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button></div>
    </div>
  </div>
</div>

<div class="card cnkh-page">
  <div class="card-header"><h4 class="card-title mb-0">Công nợ khách hàng</h4></div>
  <div class="card-body">
    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-3"><label class="form-label">Khách hàng</label><select id="cnkh-filter-customer" class="form-select"><option value="">Tất cả</option></select></div>
      <div class="col-md-2"><label class="form-label">Tháng hạch toán</label><input type="text" id="cnkh-filter-month" class="form-control" placeholder="YYYYMM"></div>
      <div class="col-md-2"><button type="button" class="btn btn-primary" id="cnkh-search"><i class="ti tabler-search me-1"></i>Tìm kiếm</button></div>
    </div>
    <div class="table-responsive">
      <table class="table table-bordered table-hover align-middle">
        <thead class="table-light"><tr><th>Khách hàng</th><th>Tháng HT</th><th class="text-center">Số phiếu</th><th class="text-end">Phải thu</th><th class="text-end">Đã TT</th><th class="text-end">Còn lại</th><th>Trạng thái</th><th style="width:90px">CN</th></tr></thead>
        <tbody id="cnkh-table-body"><tr><td colspan="8" class="text-center py-4"><span class="spinner-border spinner-border-sm"></span></td></tr></tbody>
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

<div class="modal fade" id="cnkh-detail-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen modal-dialog-scrollable"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title" id="cnkh-detail-title">Chi tiết công nợ</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
    <div class="modal-body" id="cnkh-detail-body"></div>
    <div class="modal-footer"><button type="button" class="btn btn-success" id="cnkh-pay-selected"><i class="ti tabler-wallet me-1"></i>Thanh toán phiếu chọn</button><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button></div>
  </div></div>
</div>

<div id="ke-hoach-form-app">
  <input type="hidden" id="nid-input" value="">
  <div class="modal fade" id="ke-hoach-fullscreen-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h5 class="modal-title mb-1">Tạo kế hoạch xếp xe hàng cảng</h5>
            <div class="text-muted small">Tạo đồng thời nhiều kế hoạch độc lập. Có thể nhân bản để nhập nhanh các kế hoạch có cùng thông tin.</div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
        </div>
        <div class="modal-body position-relative">
          <div class="loading-overlay" id="form-loading" style="display:none"><div class="spinner-border text-primary"></div></div>
          <form id="ke-hoach-form" novalidate>
            <div id="ke-hoach-lines"></div>
            <div class="text-center py-3"><button type="button" class="btn btn-outline-primary" id="add-line-btn"><i class="ti tabler-plus me-1"></i>Thêm kế hoạch</button></div>
          </form>
        </div>
        <div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button><button type="button" class="btn btn-primary" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i>Lưu kế hoạch</button></div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="port-cont-ref-picker-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title mb-0">Chọn cont kéo về</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button></div>
      <div class="modal-body"><div class="line-cont-picker-wrap" id="port-cont-ref-picker-wrap" data-line-key="">
        <div class="row line-cont-filter-row mb-2"><div class="col-md-3"><input type="text" class="form-control line-cont-filter-bkg" placeholder="Tìm theo số BKG"></div><div class="col-md-3"><input type="text" class="form-control line-cont-filter-cont" placeholder="Tìm theo số cont"></div><div class="col-md-4"><select class="form-select line-cont-filter-kho"><option></option></select></div><div class="col-md-2"><select class="form-select line-cont-filter-du-hang"><option value="">Trạng thái</option><option value="1">Đã đủ</option><option value="0">Chưa đủ</option></select></div></div>
        <div class="cont-picker-list-head"><span></span><span>Cont / Booking</span><span>Kho</span><span>Bãi hạ</span><span>Seal</span><span class="cont-picker-port-requirements-head">Yêu cầu</span><span>T.Thái</span><span>Ghi chú</span></div><div class="line-cont-picker-body line-cont-picker-list"><div class="text-center text-muted py-4">Chưa có dữ liệu</div></div>
      </div></div>
      <div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button><button type="button" class="btn btn-primary" id="port-cont-ref-picker-confirm-btn"><i class="ti tabler-check me-1"></i>Chọn cont</button></div>
    </div></div>
  </div>

  <div class="modal fade" id="vehicle-picker-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title mb-0">Chọn phương tiện</h5><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button></div>
      <div class="modal-body"><div class="row g-2 align-items-center mb-3"><div class="col-md-6"><input type="text" class="form-control" id="vehicle-picker-search" placeholder="Tìm theo BKS, mã tài sản, lái xe..."></div><div class="col-md-6 text-md-end"><button type="button" class="btn btn-sm btn-label-secondary" id="vehicle-picker-clear-btn"><i class="ti tabler-x me-1"></i>Bỏ chọn</button></div></div><div class="table-responsive"><table class="table table-bordered table-hover align-middle mb-0"><thead class="table-light"><tr><th class="text-center">Chọn</th><th>Biển số</th><th>Loại xe</th><th id="vehicle-picker-col-extra">Lái xe hiện tại</th></tr></thead><tbody id="vehicle-picker-body"><tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải phương tiện...</td></tr></tbody></table></div></div>
    </div></div>
  </div>
</div>

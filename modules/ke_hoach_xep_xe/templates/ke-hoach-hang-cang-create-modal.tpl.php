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

  <?php print theme('ke_hoach_cont_picker_modal_page', array('id_prefix' => 'port-')); ?>

  <div class="modal fade" id="vehicle-picker-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title mb-0">Chọn phương tiện</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body"><div class="row g-2 align-items-center mb-3"><div class="col-md-6"><input type="text" class="form-control" id="vehicle-picker-search" placeholder="Tìm theo BKS, mã tài sản, lái xe..."></div><div class="col-md-6 text-md-end"><button type="button" class="btn btn-sm btn-label-secondary" id="vehicle-picker-clear-btn"><i class="ti tabler-x me-1"></i>Bỏ chọn</button></div></div><div class="table-responsive"><table class="table table-bordered table-hover align-middle mb-0"><thead class="table-light"><tr><th class="text-center">Chọn</th><th>Biển số</th><th>Loại xe</th><th id="vehicle-picker-col-extra">Lái xe hiện tại</th></tr></thead><tbody id="vehicle-picker-body"><tr><td colspan="4" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải phương tiện...</td></tr></tbody></table></div></div>
    </div></div>
  </div>
</div>

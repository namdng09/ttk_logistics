<!-- Create/Edit/View Modal -->
<div class="modal fade" id="danh-muc-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-xl">
    <div class="modal-content">
      <form id="form-danh-muc" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="danh-muc-modal-title">Thêm danh mục</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div id="modal-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
            <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:6rem;" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
          </div>
          <input type="hidden" name="nid" value="">

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Tên danh mục <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Nhập tên danh mục">
              <div class="invalid-feedback">Vui lòng nhập tên danh mục</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Phân loại <span class="text-danger">*</span></label>
              <select class="form-select" name="phan_loai" required>
                <option value="">Chọn phân loại</option>
                <option value="Phòng ban">Phòng ban</option>
                <option value="Chức vụ">Chức vụ</option>
                <option value="Chi phí">Chi phí</option>
                <option value="Kho">Kho</option>
                <option value="Cửa khẩu">Cửa khẩu</option>
                <option value="Bãi">Bãi</option>
                <option value="Cảng">Cảng</option>
                <option value="Loại hàng">Loại hàng</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn phân loại</div>
            </div>

            <div class="col-12" id="phu-phi-section" style="display:none;">
              <hr class="my-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0"><i class="ti tabler-coin me-2"></i>Phụ phí gợi ý</label>
                <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-phu-phi">
                  <i class="ti tabler-plus me-1"></i>Thêm phụ phí
                </button>
              </div>
              <div id="phu-phi-repeater"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-danh-muc">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

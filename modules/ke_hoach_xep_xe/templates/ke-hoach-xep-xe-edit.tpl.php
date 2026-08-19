<div class="card" id="ke-hoach-form-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <div class="d-flex align-items-center gap-2">
      <a href="/ke-hoach-xep-xe" class="btn btn-outline-secondary btn-sm waves-effect"><i class="icon-base ti tabler-arrow-left me-1"></i> Quay lại</a>
      <h4 class="card-title mb-0" id="form-title">Xếp xe</h4>
    </div>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-success waves-effect d-none" id="complete-plan-btn">
        <i class="icon-base ti tabler-circle-check me-1"></i>Hoàn thành
      </button>
      <button type="button" class="btn btn-primary waves-effect" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i> Lưu xếp xe</button>
    </div>
  </div>

  <div class="card-body position-relative">
    <div class="loading-overlay" id="form-loading" style="display:none;">
      <div class="spinner-border text-primary"></div>
    </div>

    <form id="ke-hoach-form" novalidate>
      <input type="hidden" id="nid-input" value="">

      <div class="ke-hoach-lines-wrap">
        <div id="ke-hoach-lines"></div>
        <div id="ke-hoach-cont-pickers"></div>
      </div>
    </form>

    <div class="card khxh-plan-files-card mt-3" id="khxh-plan-files-card">
      <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white">
        <div class="d-flex align-items-center gap-2 min-w-0">
          <span class="khxh-plan-files-title">4. Chứng từ hình ảnh kế hoạch</span>
          <span class="badge rounded-pill bg-label-secondary border" id="khxh-plan-files-count">0/25 file</span>
        </div>
      </div>
      <div class="card-body">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-12 col-lg-4">
            <label class="form-label">Mốc nghiệp vụ</label>
            <select class="form-select form-select-sm" id="khxh-plan-file-group">
              <option value="lay_cont_rong">1. Nhận cont rỗng</option>
              <option value="giao_cont_rong_cho_kho">2. Giao cont rỗng</option>
              <option value="nhan_cont_hang_tu_kho">3. Nhận cont hàng</option>
              <option value="ha_cont">4. Hạ cont hàng</option>
            </select>
          </div>
          <div class="col-12 col-lg-5">
            <label class="form-label">File ảnh/PDF</label>
            <input type="file" class="form-control form-control-sm" id="khxh-plan-file-input" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" multiple>
          </div>
          <div class="col-12 col-lg-3">
            <button type="button" class="btn btn-sm btn-primary w-100" id="khxh-plan-file-upload">
              <i class="ti tabler-upload me-1"></i>Upload
            </button>
          </div>
        </div>
        <div id="khxh-plan-files-body" class="khxh-plan-files-body"></div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="vehicle-picker-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title mb-0">Chọn phương tiện</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="row g-2 align-items-center mb-3">
          <div class="col-md-6">
            <input type="text" class="form-control" id="vehicle-picker-search" placeholder="Tìm theo biển số, loại xe, tài xế...">
          </div>
          <div class="col-md-6 text-md-end">
            <div class="d-inline-flex align-items-center gap-2 justify-content-md-end flex-wrap">
              <div class="text-muted small" id="vehicle-picker-target">Đang chỉnh sửa phương tiện của kế hoạch</div>
              <button type="button" class="btn btn-sm btn-label-secondary" id="vehicle-picker-clear-btn">
                <i class="ti tabler-x me-1"></i>Bỏ chọn
              </button>
            </div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width:60px" class="text-center">Chọn</th>
                <th id="vehicle-picker-col-bks">Biển số</th>
                <th id="vehicle-picker-col-type">Loại xe</th>
                <th id="vehicle-picker-col-extra">Lái xe hiện tại</th>
                <th style="width:130px" class="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody id="vehicle-picker-body">
              <tr>
                <td colspan="5" class="text-center py-4">
                  <div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải phương tiện...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>

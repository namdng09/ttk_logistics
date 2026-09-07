<div class="card" id="ke-hoach-form-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <div class="d-flex align-items-center gap-2">
      <a href="/ke-hoach-tuyen-xa" class="btn btn-outline-secondary btn-sm waves-effect"><i class="icon-base ti tabler-arrow-left me-1"></i> Quay lại</a>
      <h4 class="card-title mb-0" id="form-title">Xếp xe tuyến xa</h4>
    </div>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-label-primary waves-effect d-none" id="khxh-status-btn">
        <i class="icon-base ti tabler-arrows-exchange me-1"></i>Trạng thái
      </button>
      <button type="button" class="btn btn-primary waves-effect" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i> Lưu xếp xe</button>
    </div>
  </div>

  <div class="card-body position-relative">
    <div class="loading-overlay" id="form-loading" style="display:none;">
      <div class="spinner-border text-primary"></div>
    </div>

    <div class="khxh-tuyen-xa-context" id="khxh-tuyen-xa-context">
      <div class="khxh-context-item"><span>Khách hàng</span><strong data-context="customer">Chưa có</strong></div>
      <div class="khxh-context-item"><span>Container</span><strong data-context="container">Chưa có</strong></div>
      <div class="khxh-context-item khxh-context-route"><span>Tuyến</span><strong data-context="route">Chưa có</strong></div>
      <div class="khxh-context-item"><span>Thời gian</span><strong data-context="time">Chưa có</strong></div>
    </div>

    <div class="khxh-tuyen-xa-layout">
      <main class="khxh-tuyen-xa-main">
        <div id="khxh-tuyen-xa-nav"></div>
        <form id="ke-hoach-form" novalidate>
          <input type="hidden" id="nid-input" value="">

          <div class="ke-hoach-lines-wrap">
            <div id="ke-hoach-lines"></div>
            <div id="ke-hoach-cont-pickers"></div>
          </div>
        </form>

        <div class="khxh-tuyen-xa-card khxh-ket-hop-card khxh-combined-plans-card mt-3 d-none" id="khxh-combined-plans-card">
          <div class="khxh-tuyen-xa-card-head">
            <div class="d-flex align-items-center gap-2 min-w-0">
              <span class="khxh-step-badge">4</span>
              <span class="khxh-tuyen-xa-card-title">Kế hoạch kết hợp (Hàng vào)</span>
            </div>
            <div class="khxh-section-tools">
              <span class="khxh-cont-ref-section-status" id="khxh-combined-plans-count">0 kế hoạch</span>
              <button type="button" class="btn btn-sm btn-primary" id="khxh-combined-plan-create"><i class="ti tabler-plus me-1"></i>Tạo kế hoạch kết hợp</button>
            </div>
          </div>
          <div class="khxh-cont-ref-content" id="khxh-combined-plans-body"></div>
        </div>

        <div class="card khxh-plan-files-card mt-3" id="khxh-plan-files-card">
          <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2 bg-white">
            <div class="d-flex align-items-center gap-2 min-w-0">
              <span class="khxh-step-badge">5</span>
              <span class="khxh-plan-files-title">Chứng từ hình ảnh kế hoạch</span>
              <span class="badge rounded-pill bg-label-secondary border" id="khxh-plan-files-count">0/25 file</span>
            </div>
          </div>
          <div class="card-body">
            <div class="row g-2 align-items-end mb-3">
              <div class="col-12 col-lg-4">
                <label class="form-label">Mốc nghiệp vụ</label>
                <select class="form-select form-select-sm" id="khxh-plan-file-group">
                  <option value="lay_cont_rong">1. Nhận cont rỗng</option>
                  <option value="tang_bo">2. Tăng bo</option>
                  <option value="giao_cont_rong_cho_kho">3. Giao cont rỗng</option>
                  <option value="nhan_cont_hang_tu_kho">4. Nhận cont hàng</option>
                  <option value="ha_cont">5. Hạ cont hàng</option>
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
      </main>

      <aside class="khxh-tuyen-xa-side">
        <div class="khxh-tuyen-xa-side-sticky">
          <div class="khxh-side-card">
            <div class="khxh-side-title">Tóm tắt xếp xe</div>
            <div id="khxh-tuyen-xa-summary" class="khxh-summary-list">
              <div class="khxh-summary-empty">Chưa có dữ liệu</div>
            </div>
          </div>
          <div class="khxh-side-card mt-3">
            <div class="khxh-side-title">Kiểm tra trước khi lưu</div>
            <div id="khxh-tuyen-xa-checklist" class="khxh-check-list"></div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</div>

<div class="modal fade" id="khxh-combined-plan-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0" id="khxh-combined-plan-modal-title">Tạo kế hoạch kết hợp</h5>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <form id="khxh-combined-plan-form" novalidate>
        <div class="modal-body position-relative">
          <div class="loading-overlay" id="khxh-combined-plan-loading" style="display:none;"><div class="spinner-border text-primary"></div></div>
          <input type="hidden" id="khxh-combined-plan-id" value="">
          <div class="alert alert-primary py-2 mb-3" id="khxh-combined-plan-source"></div>
          <div class="row g-3">
            <div class="col-md-6"><label class="form-label">Khách hàng <span class="text-danger">*</span></label><select class="form-select" id="khxh-combined-customer" required></select></div>
            <div class="col-md-6"><label class="form-label">Loại hàng</label><select class="form-select" id="khxh-combined-cargo-type"></select></div>
            <div class="col-md-6"><label class="form-label">Loại cont</label><input type="text" class="form-control" id="khxh-combined-container-type" disabled></div>
            <div class="col-md-6"><label class="form-label">Số cont</label><input type="text" class="form-control" id="khxh-combined-container-no" disabled></div>
            <div class="col-12"><label class="form-label">Điểm xuất phát</label><input type="text" class="form-control" id="khxh-combined-start" disabled></div>
            <div class="col-md-6"><label class="form-label">Địa chỉ kho <span class="text-danger">*</span></label><select class="form-select" id="khxh-combined-kho" required></select></div>
            <div class="col-md-6"><label class="form-label">Bãi hạ <span class="text-danger">*</span></label><select class="form-select" id="khxh-combined-bai-ha" required></select></div>
            <div class="col-12"><label class="form-label">Ghi chú</label><input type="text" class="form-control" id="khxh-combined-note" placeholder="Ghi chú"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Huỷ</button>
          <button type="submit" class="btn btn-primary" id="khxh-combined-plan-save"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="modal fade" id="khxh-status-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title mb-0">Thay đổi trạng thái</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label">Trạng thái kế hoạch</label>
          <select class="form-select" id="khxh-plan-status-select"></select>
        </div>
        <div class="mb-3" id="khxh-main-work-status-wrap">
          <label class="form-label">Công việc chính</label>
          <select class="form-select" id="khxh-main-work-status-select">
            <option value="0">Chưa hoàn thành</option>
            <option value="1">Đã hoàn thành</option>
          </select>
        </div>
        <div class="d-none" id="khxh-return-cont-status-wrap">
          <label class="form-label">Cont kéo về</label>
          <select class="form-select" id="khxh-return-cont-status-select">
            <option value="0">Chưa hoàn thành</option>
            <option value="1">Đã hoàn thành</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Huỷ</button>
        <button type="button" class="btn btn-primary" id="khxh-status-save-btn"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="cont-ref-picker-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0">Chọn kế hoạch / cont</h5>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="line-cont-picker-wrap" id="cont-ref-picker-wrap" data-line-key="">
          <div class="row line-cont-filter-row mb-2">
            <div class="col-md-4"><input type="text" class="form-control line-cont-filter-cont" placeholder="Tìm theo số cont"></div>
            <div class="col-md-4"><select class="form-select line-cont-filter-kho"><option></option></select></div>
            <div class="col-md-2"><select class="form-select line-cont-filter-du-hang"><option value="">Trạng thái</option><option value="1">Đã đủ</option><option value="0">Chưa đủ</option></select></div>
          </div>
          <div class="cont-picker-list-head is-tuyen-xa"><span></span><span>Container</span><span>Vị trí hiện tại</span><span>Dải chặng nhận thực hiện</span><span>T.Thái cont</span><span>Ghi chú</span></div>
          <div class="line-cont-picker-body line-cont-picker-list"><div class="text-center text-muted py-4">Chưa có dữ liệu</div></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
        <button type="button" class="btn btn-primary" id="cont-ref-picker-confirm-btn"><i class="ti tabler-check me-1"></i>Xác nhận cont và chặng</button>
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

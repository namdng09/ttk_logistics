<div class="card" id="ke-hoach-form-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <div class="d-flex align-items-center gap-2">
      <a href="/ke-hoach-xep-xe" class="btn btn-outline-secondary btn-sm waves-effect"><i class="icon-base ti tabler-arrow-left me-1"></i> Quay lại</a>
      <h4 class="card-title mb-0" id="form-title">Xếp xe</h4>
    </div>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-primary waves-effect" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i> Lưu xếp xe</button>
    </div>
  </div>

  <div class="card-body position-relative">
    <div class="loading-overlay" id="form-loading" style="display:none;">
      <div class="spinner-border text-primary"></div>
    </div>

    <form id="ke-hoach-form" novalidate>
      <input type="hidden" id="nid-input" value="">

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
          <select id="nid_khach_hang-input" class="form-select select2-searchable" style="width:100%" required>
            <option value="0">— Chọn —</option>
          </select>
          <div class="invalid-feedback">Vui lòng chọn khách hàng</div>
        </div>

        <div class="col-md-6">
          <label class="form-label">Số BKG <span class="text-danger">*</span></label>
          <div class="input-group">
            <input type="text" id="so_bkg-input" class="form-control" placeholder="Nhập số BKG" required>
            <button class="btn btn-outline-secondary" type="button" id="paste-bkg-btn" title="Dán từ clipboard">
              <i class="ti tabler-clipboard-copy"></i>
            </button>
          </div>
          <div class="invalid-feedback">Vui lòng nhập số BKG</div>
        </div>
      </div>

      <div class="ke-hoach-lines-wrap">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
          <div>
            <h5 class="mb-0">Phương tiện thực hiện</h5>
          </div>
        </div>

        <div id="ke-hoach-lines"></div>
      </div>
    </form>
  </div>
</div>

<div class="modal fade" id="vehicle-picker-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0">Chọn phương tiện</h5>
          <div class="text-muted small">Chọn xe phù hợp cho kế hoạch đang chỉnh sửa.</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="row g-2 align-items-center mb-3">
          <div class="col-md-6">
            <input type="text" class="form-control" id="vehicle-picker-search" placeholder="Tìm theo biển số, loại xe, tài xế...">
          </div>
          <div class="col-md-6 text-md-end">
            <div class="text-muted small" id="vehicle-picker-target">Đang chỉnh sửa phương tiện của kế hoạch</div>
          </div>
        </div>

        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle mb-0">
            <thead class="table-light">
              <tr>
                <th style="width:60px" class="text-center">Chọn</th>
                <th>Biển số</th>
                <th>Loại xe</th>
                <th>Lái xe hiện tại</th>
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

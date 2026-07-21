<div id="ke-hoach-form-app">
  <input type="hidden" id="nid-input" value="">

  <div class="modal fade" id="ke-hoach-fullscreen-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Tạo kế hoạch xếp xe</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body position-relative">
          <div class="loading-overlay" id="form-loading" style="display:none;">
            <div class="spinner-border text-primary"></div>
          </div>

          <form id="ke-hoach-form" novalidate>
            <div class="row mb-3">
              <div class="col-md-3">
                <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
                <select id="nid_khach_hang-input" class="form-select" required>
                  <option value="0">-- Chọn khách hàng --</option>
                </select>
                <div class="invalid-feedback">Vui lòng chọn khách hàng</div>
              </div>
            </div>

            <h4 class="mt-2 mb-3">Danh sách chuyến xe</h4>

            <div class="table-responsive ke-hoach-table-wrap">
              <table class="table table-bordered align-middle ke-hoach-entry-table" id="ke-hoach-entry-table">
                <thead>
                  <tr>
                    <th style="width: 8%">Số BKG</th>
                    <th style="width: 14%">Phương tiện</th>
                    <th style="width: 8%"><span class="th-split-label">Số cont<br>Loại cont</span></th>
                    <th style="width: 8%"><span class="th-split-label">Số seal chính<br>Số seal tạm</span></th>
                    <th style="width: 12%">Địa chỉ kho</th>
                    <th style="width: 14%"><span class="th-split-label">Bãi lấy cont<br>Bãi hạ cont</span></th>
                    <th style="width: 8%">Cảng xuất</th>
                    <th style="width: 8%">Cut-off</th>
                    <th width="1%" class="text-center">
                      <button type="button" class="btn btn-sm btn-icon btn-label-success" id="add-line-btn" title="Thêm dòng">
                        <i class="ti tabler-circle-plus"></i>
                      </button>
                    </th>
                    <th width="1%" class="text-center">
                      <button type="button" class="btn btn-sm btn-icon btn-label-primary" id="reset-lines-btn" title="Reset toàn bộ">
                        <i class="ti tabler-reload"></i>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody id="ke-hoach-lines-body"></tbody>
              </table>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
          <button type="button" class="btn btn-primary" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i>Lưu thông tin</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="vehicle-picker-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h5 class="modal-title mb-0">Chọn phương tiện</h5>
            <div class="text-muted small">Chọn đầu kéo cho dòng đang thao tác.</div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row g-2 align-items-center mb-3">
            <div class="col-md-6">
              <input type="text" class="form-control" id="vehicle-picker-search" placeholder="Tìm theo BKS, mooc, lái xe...">
            </div>
            <div class="col-md-6 text-md-end">
              <div class="d-inline-flex align-items-center gap-2 justify-content-md-end flex-wrap">
                <div class="text-muted small" id="vehicle-picker-target">Đang chọn cho dòng #1</div>
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
                  <th>Biển số</th>
                  <th>Mooc</th>
                  <th>Loại xe</th>
                  <th>Lái xe hiện tại</th>
                  <th style="width:130px" class="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody id="vehicle-picker-body">
                <tr>
                  <td colspan="6" class="text-center py-4">
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
</div>

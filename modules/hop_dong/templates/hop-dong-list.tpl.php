<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title"><?php print !empty($is_employee_contract) ? 'Danh sách hợp đồng nhân viên' : 'Danh sách hợp đồng'; ?></h4>
  </div>

  <div class="card-body">
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-hop-dong" placeholder="<?php print !empty($is_employee_contract) ? 'Tìm kiếm (Số hợp đồng, nhân viên)...' : 'Tìm kiếm (Số hợp đồng, khách hàng)...'; ?>">
          <button class="btn btn-primary" type="button" id="btn-search-hop-dong">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <select class="form-select" id="filter-khach-hang" style="width:100%">
          <option value=""><?php print !empty($is_employee_contract) ? 'Tất cả nhân viên' : 'Tất cả khách hàng'; ?></option>
        </select>
      </div>
      <div class="col-12 col-md-4">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-hop-dong" data-bs-toggle="modal" data-bs-target="#hop-dong-modal">
            <i class="ti tabler-plus me-1"></i>Thêm
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-hop-dong">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table id="table-hop-dong" data-contract-type="<?php print !empty($is_employee_contract) ? 'nhan_vien' : 'khach_hang'; ?>" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Số hợp đồng</th>
            <th>Ngày hợp đồng</th>
            <th>Hạn hợp đồng</th>
            <th><?php print !empty($is_employee_contract) ? 'Nhân viên' : 'Khách hàng'; ?></th>
            <?php if (empty($is_employee_contract)): ?><th>NV Kinh doanh</th><?php endif; ?>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody id="table-hop-dong-tbody">
          <tr id="loading-row">
            <td colspan="<?php print !empty($is_employee_contract) ? 7 : 8; ?>" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="pagination-hop-dong" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="pagination-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="pagination-total-pages"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="hop-dong-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered">
    <div class="modal-content">
      <form id="form-hop-dong" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="hop-dong-modal-title">Thêm hợp đồng</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div id="modal-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
            <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:4rem;" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
          </div>
          <input type="hidden" name="nid" value="">

          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Số hợp đồng <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="so_hop_dong" required placeholder="HĐ-001">
              <div class="invalid-feedback">Vui lòng nhập số hợp đồng</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày hợp đồng</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_hop_dong" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn hợp đồng</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_hop_dong" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-12">
              <label class="form-label"><?php print !empty($is_employee_contract) ? 'Nhân viên' : 'Khách hàng'; ?> <span class="text-danger">*</span></label>
              <select class="form-select select2-khach-hang" name="khach_hang" id="select-khach-hang" required>
                <option value=""><?php print !empty($is_employee_contract) ? 'Chọn nhân viên' : 'Chọn khách hàng'; ?></option>
              </select>
            </div>
            <?php if (empty($is_employee_contract)): ?><div class="col-md-12" id="nv-kinh-doanh-section" style="display:none;">
              <label class="form-label">NV Kinh doanh</label>
              <div id="nv-kinh-doanh-display" class="form-control-plaintext"></div>
            </div><?php endif; ?>
            <div class="col-md-12">
              <label class="form-label">Ghi chú</label>
              <input type="text" class="form-control" name="ghi_chu" placeholder="Ghi chú">
            </div>
          </div>

          <div id="file-section" class="mt-4">
            <hr class="my-3">
            <h6 class="mb-3"><i class="ti tabler-paperclip me-1"></i>File đính kèm</h6>

            <div id="file-upload-area" style="display:none;">
              <div class="d-flex align-items-center gap-2 mb-3">
                <input type="file" id="file-input-hop-dong" class="d-none" accept=".pdf,image/jpeg,image/png,image/gif" multiple>
                <button type="button" class="btn btn-label-secondary btn-sm" id="btn-chon-file">
                  <i class="ti tabler-upload me-1"></i>Chọn file
                </button>
                <span class="text-muted small">Chỉ chấp nhận: <strong>.PDF, .JPG, .JPEG, .PNG, .GIF</strong> — Tối đa 10MB/file</span>
              </div>
              <div id="file-upload-progress" style="display:none;">
                <div class="progress" style="height:6px;">
                  <div class="progress-bar progress-bar-striped progress-bar-animated" style="width:0%"></div>
                </div>
                <small class="text-muted" id="file-upload-status"></small>
              </div>
            </div>

            <div id="file-list">
              <div id="file-list-empty" class="text-muted small" style="display:none;">Chưa có file nào</div>
              <table class="table table-sm table-bordered mb-0" id="file-table" style="display:none;">
                <thead class="table-light">
                  <tr>
                    <th style="width:40px;">#</th>
                    <th>Tên file</th>
                    <th style="width:90px;">Kích thước</th>
                    <th style="width:100px;">Ngày tải</th>
                    <th style="width:90px;text-align:center;">Thao tác</th>
                  </tr>
                </thead>
                <tbody id="file-table-tbody"></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-hop-dong">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

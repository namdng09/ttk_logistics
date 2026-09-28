<div id="pq-app" class="card pq-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <div class="d-flex align-items-center gap-2">
      <h4 class="card-title mb-0">Phân quyền hệ thống</h4>
      <span class="badge bg-label-warning d-none" id="pq-change-badge"></span>
    </div>
    <div class="d-flex gap-2 pq-manage-only">
      <button type="button" class="btn btn-label-secondary" id="pq-btn-discard" disabled><i class="ti tabler-x me-1"></i>Huỷ thay đổi</button>
      <button type="button" class="btn btn-primary" id="pq-btn-save" disabled><i class="ti tabler-device-floppy me-1"></i>Lưu (<span id="pq-save-count">0</span>)</button>
    </div>
  </div>

  <div class="px-4">
    <div class="nav nav-pills gap-1" id="pq-tabs">
      <button type="button" class="nav-link active" data-tab="mt">Ma trận phân quyền</button>
      <button type="button" class="nav-link" data-tab="vt">Vai trò</button>
      <button type="button" class="nav-link" data-tab="ls">Lịch sử thay đổi</button>
    </div>
  </div>

  <div class="card-body pq-body">
    <div class="pq-loading" id="pq-loading"><div class="spinner-border text-primary" role="status"></div></div>

    <!-- Ma trận phân quyền -->
    <div class="pq-panel" data-panel="mt">
      <div class="pq-toolbar">
        <div class="input-group pq-search">
          <span class="input-group-text"><i class="ti tabler-search"></i></span>
          <input type="text" class="form-control" id="pq-q" placeholder="Tìm quyền, mã quyền, module, đường dẫn" autocomplete="off">
        </div>
        <button type="button" class="btn btn-label-secondary pq-filter-reset" id="pq-btn-reset" title="Tải lại" aria-label="Tải lại"><i class="ti tabler-refresh"></i></button>
        <button type="button" class="btn btn-sm btn-label-secondary" id="pq-only-changed">Chỉ dòng đang thay đổi</button>
        <button type="button" class="btn btn-sm btn-label-secondary" id="pq-toggle-groups">Thu gọn tất cả nhóm</button>
        <div class="flex-grow-1"></div>
        <div class="pq-pop-wrap pq-manage-only">
          <button type="button" class="btn btn-sm btn-label-primary" id="pq-btn-copy"><i class="ti tabler-files me-1"></i>Sao chép quyền vai trò</button>
          <div class="pq-pop pq-pop-copy d-none" id="pq-pop-copy">
            <div class="fw-medium mb-2">Sao chép quyền giữa 2 vai trò</div>
            <div class="small text-muted mb-1">Từ vai trò</div>
            <div class="pq-chip-row mb-2" id="pq-copy-from"></div>
            <div class="small text-muted mb-1">Sang vai trò</div>
            <div class="pq-chip-row mb-2" id="pq-copy-to"></div>
            <div class="btn-group mb-3" role="group" id="pq-copy-mode">
              <button type="button" class="btn btn-sm btn-primary" data-mode="add">Cộng thêm vào quyền đang có</button>
              <button type="button" class="btn btn-sm btn-label-secondary" data-mode="over">Ghi đè giống hệt</button>
            </div>
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-sm btn-label-secondary pq-pop-close">Đóng</button>
              <button type="button" class="btn btn-sm btn-primary" id="pq-copy-apply">Áp dụng (chưa lưu)</button>
            </div>
          </div>
        </div>
        <div class="pq-pop-wrap">
          <button type="button" class="btn btn-sm btn-primary" id="pq-btn-add-user"><i class="ti tabler-plus me-1"></i>Thêm cột người dùng</button>
          <div class="pq-pop pq-pop-user d-none" id="pq-pop-user">
            <div class="fw-medium mb-2">Phân quyền riêng cho người dùng</div>
            <input type="text" class="form-control form-control-sm mb-2" id="pq-user-q" placeholder="Tìm tên, tài khoản" autocomplete="off">
            <div class="pq-user-list" id="pq-user-list"></div>
          </div>
        </div>
      </div>

      <div class="pq-legend">
        <span class="small text-muted me-1">Cột vai trò:</span>
        <span id="pq-col-chips" class="pq-chip-row"></span>
        <div class="flex-grow-1"></div>
        <span class="small text-muted"><span class="pq-legend-changed"></span> đang thay đổi</span>
        <span class="small text-muted ms-3"><strong class="pq-inh">✓</strong> kế thừa (rê chuột xem từ đâu)</span>
      </div>

      <div class="pq-matrix-wrap">
        <table class="table table-bordered mb-0 pq-matrix">
          <thead id="pq-thead"></thead>
          <tbody id="pq-tbody"></tbody>
        </table>
      </div>
      <div class="small text-muted mt-2" id="pq-footer"></div>
    </div>

    <!-- Vai trò -->
    <div class="pq-panel d-none" data-panel="vt">
      <div class="d-flex gap-2 mb-3 pq-manage-only">
        <input type="text" class="form-control pq-new-role" id="pq-new-role" placeholder="Tên vai trò mới, vd Thủ quỹ" maxlength="64">
        <button type="button" class="btn btn-primary" id="pq-btn-add-role"><i class="ti tabler-plus me-1"></i>Thêm vai trò</button>
      </div>
      <div class="table-responsive">
        <table class="table table-bordered table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th>Vai trò</th>
              <th style="width:150px;">Thành viên</th>
              <th style="width:130px;">Số quyền</th>
              <th style="width:260px;"></th>
            </tr>
          </thead>
          <tbody id="pq-role-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- Lịch sử -->
    <div class="pq-panel d-none" data-panel="ls">
      <div class="input-group mb-3 pq-search">
        <input type="text" class="form-control" id="pq-ls-q" placeholder="Tìm theo vai trò, người dùng, quyền">
        <button class="btn btn-primary" type="button" id="pq-ls-search"><i class="ti tabler-search"></i> Tìm</button>
      </div>
      <div class="table-responsive">
        <table class="table table-bordered table-hover mb-0">
          <thead class="table-light">
            <tr>
              <th style="width:160px;">Thời gian</th>
              <th style="width:170px;">Người thực hiện</th>
              <th style="width:240px;">Áp cho</th>
              <th style="width:130px;">Thao tác</th>
              <th>Quyền / ghi chú</th>
            </tr>
          </thead>
          <tbody id="pq-ls-tbody"></tbody>
        </table>
      </div>
      <div class="d-flex justify-content-between align-items-center mt-3">
        <div class="text-muted small" id="pq-ls-info"></div>
        <nav><ul class="pagination pagination-sm mb-0" id="pq-ls-pages"></ul></nav>
      </div>
    </div>
  </div>
</div>

<!-- Xác nhận lưu -->
<div class="modal fade" id="pq-confirm-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Xác nhận lưu <span id="pq-confirm-count">0</span> thay đổi</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
      </div>
      <div class="modal-body" id="pq-confirm-body"></div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Quay lại</button>
        <button type="button" class="btn btn-primary" id="pq-confirm-save"><i class="ti tabler-device-floppy me-1"></i>Xác nhận lưu</button>
      </div>
    </div>
  </div>
</div>

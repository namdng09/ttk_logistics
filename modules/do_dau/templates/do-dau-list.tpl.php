<div id="dd-app" class="dd-list-app">
  <div class="card dd-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <div class="d-flex align-items-center gap-2"><i class="ti tabler-gas-station dd-title-icon"></i><h4 class="card-title mb-0">Theo dõi đổ dầu</h4></div>
      <div class="d-flex flex-wrap align-items-center gap-2 ms-auto">
        <div class="dd-stat" title="Tổng theo bộ lọc hiện tại (tất cả các trang)">
          <span class="dd-stat-ico dd-stat-ico-lit"><i class="ti tabler-droplet"></i></span>
          <div><div class="dd-stat-lbl">Tổng số lít</div><div class="dd-stat-val"><span id="dd-sum-lit">0</span><small>lít</small></div></div>
        </div>
        <div class="dd-stat" title="Tổng theo bộ lọc hiện tại (tất cả các trang)">
          <span class="dd-stat-ico dd-stat-ico-tien"><i class="ti tabler-cash"></i></span>
          <div><div class="dd-stat-lbl">Tổng sau VAT</div><div class="dd-stat-val"><span id="dd-sum-tien">0</span><small>đ</small></div></div>
        </div>
      </div>
      <button type="button" class="btn btn-success" id="dd-btn-create" style="display:none;"><i class="ti tabler-plus me-1"></i>Tạo phiếu đổ dầu</button>
    </div>
    <div class="card-body">
      <div class="dd-filter-bar">
        <div class="dd-filter-grid">
          <div class="dd-filter-field">
            <label class="form-label" for="dd-f-q">Từ khóa</label>
            <input type="text" class="form-control" id="dd-f-q" placeholder="Mã đề nghị, số hoá đơn, BKS">
          </div>
          <div class="dd-filter-field">
            <label class="form-label" for="dd-f-dk">Đầu kéo</label>
            <select class="form-select" id="dd-f-dk"><option value="">Tất cả</option></select>
          </div>
          <div class="dd-filter-field">
            <label class="form-label" for="dd-f-lx">Lái xe</label>
            <select class="form-select" id="dd-f-lx"><option value="">Tất cả</option></select>
          </div>
          <div class="dd-filter-field">
            <label class="form-label" for="dd-f-ncc">Nhà cung cấp</label>
            <select class="form-select" id="dd-f-ncc"><option value="">Tất cả</option></select>
          </div>
          <div class="dd-filter-field dd-filter-field-date">
            <label class="form-label" for="dd-f-date">Ngày đổ</label>
            <input type="text" class="form-control" id="dd-f-date" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
          </div>
          <div class="dd-filter-actions">
            <button type="button" class="btn btn-primary" id="dd-btn-search"><i class="ti tabler-search me-1"></i>Tìm</button>
            <button type="button" class="btn btn-label-secondary dd-filter-reset" id="dd-btn-reset" title="Reset bộ lọc" aria-label="Reset bộ lọc"><i class="ti tabler-refresh"></i></button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card dd-list-card">
    <div class="card-body p-0">
      <div class="dd-tabs-wrap">
        <ul class="nav nav-pills dd-tabs" id="dd-tabs" role="tablist"></ul>
      </div>
      <div class="dd-table-scroll">
        <div class="table-responsive">
          <table id="dd-table" class="table table-bordered table-hover mb-0 dd-table">
            <thead class="table-light">
              <tr>
                <th style="width:44px;text-align:center;">#</th>
                <th style="width:150px;">Mã đề nghị</th>
                <th style="width:190px;">Đầu kéo / Lái xe</th>
                <th>NCC / Số hoá đơn</th>
                <th class="text-end" style="width:80px;">Số lít</th>
                <th class="text-end" style="width:95px;">Đơn giá</th>
                <th class="text-end" style="width:120px;">Tổng tiền</th>
                <th class="text-end" style="width:105px;">VAT</th>
                <th class="text-end" style="width:130px;">Sau VAT</th>
                <th style="width:250px;">Trạng thái</th>
              </tr>
            </thead>
            <tbody id="dd-tbody">
              <tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div id="dd-pagination" class="mt-3 px-3 pb-3" style="display:none;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="dd-pagination-info"></div>
          <nav><ul class="pagination justify-content-center mb-0"></ul></nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="dd-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="dd-pagination-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Menu dòng (click # hoặc chuột phải) -->
  <ul class="dropdown-menu dd-menu" id="dd-menu" style="display:none;position:fixed;z-index:1090;min-width:210px;">
    <li><h6 class="dropdown-header" id="dd-menu-title"></h6></li>
    <li><button type="button" class="dropdown-item" data-menu="view"><i class="ti tabler-eye me-2 text-info"></i>Xem chi tiết</button></li>
    <li><button type="button" class="dropdown-item" data-menu="edit"><i class="ti tabler-edit me-2 text-primary"></i>Sửa</button></li>
    <li><hr class="dropdown-divider"></li>
    <li><button type="button" class="dropdown-item text-danger" data-menu="delete"><i class="ti tabler-trash me-2"></i>Xoá</button></li>
    <li id="dd-menu-locked" style="display:none;"><div class="px-3 pt-1 pb-2 small text-muted" style="max-width:220px;white-space:normal;">Phiếu đang trong luồng duyệt. Thu hồi hoặc chờ bị từ chối để sửa/xoá.</div></li>
  </ul>

  <!-- Tạo / sửa phiếu -->
  <div class="modal fade" id="dd-form-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <form id="dd-form" novalidate>
          <div class="modal-header">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title mb-0" id="dd-form-title">Tạo phiếu đổ dầu</h5>
              <span class="badge bg-label-secondary border" id="dd-form-ma" style="display:none;"></span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="position:relative;">
            <div class="dd-loading" id="dd-form-loading"><div class="spinner-border text-primary" role="status"></div></div>
            <div class="alert alert-danger py-2 d-none" id="dd-form-reject"></div>
            <div class="row gx-3 gy-2">
              <div class="col-md-3">
                <label class="form-label" for="dd-m-ngay">Ngày đổ <span class="text-danger">*</span></label>
                <div class="input-group"><span class="input-group-text"><i class="ti tabler-calendar"></i></span><input type="text" class="form-control dd-date" id="dd-m-ngay" placeholder="dd/mm/yyyy" autocomplete="off"></div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dd-m-dk">BKS đầu kéo <span class="text-danger">*</span></label>
                <select class="form-select" id="dd-m-dk"><option value="">Chọn đầu kéo</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dd-m-lx">Lái xe <span class="text-danger">*</span></label>
                <select class="form-select" id="dd-m-lx"><option value="">Chọn lái xe</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dd-m-km">Số công tơ mét hiện tại</label>
                <div class="input-group"><input type="text" class="form-control" id="dd-m-km" inputmode="numeric" placeholder="0"><span class="input-group-text">km</span></div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dd-m-ncc">Nhà cung cấp <span class="text-danger">*</span></label>
                <select class="form-select" id="dd-m-ncc"><option value="">Chọn NCC</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dd-m-payee">Bên nhận tiền <span class="text-danger">*</span></label>
                <select class="form-select" id="dd-m-payee" data-placeholder="Chọn bên nhận tiền"><option value="">Chọn bên nhận tiền</option></select>
                <div class="form-check mt-2 mb-0">
                  <input class="form-check-input" type="checkbox" id="dd-m-same" checked>
                  <label class="form-check-label" for="dd-m-same">Trùng bên phát hành</label>
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="dd-m-hd">Số hoá đơn</label>
                <input type="text" class="form-control" id="dd-m-hd" maxlength="50" placeholder="VD: 0001234">
              </div>
            </div>
            <div class="dd-box mt-2">
              <div class="fw-semibold mb-2">Tiền dầu</div>
              <div class="row gx-3 gy-2">
                <div class="col-md-4">
                  <label class="form-label" for="dd-m-lit">Số lít <span class="text-danger">*</span></label>
                  <div class="input-group"><input type="text" class="form-control" id="dd-m-lit" inputmode="decimal" placeholder="0"><span class="input-group-text">lít</span></div>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dd-m-dg">Đơn giá (chưa VAT) <span class="text-danger">*</span></label>
                  <div class="input-group"><span class="input-group-text">đ</span><input type="text" class="form-control" id="dd-m-dg" inputmode="numeric" placeholder="0"></div>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dd-m-tong">Tổng tiền</label>
                  <div class="input-group"><span class="input-group-text">đ</span><input type="text" class="form-control" id="dd-m-tong" readonly></div>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dd-m-vat">VAT (%)</label>
                  <div class="input-group"><input type="text" class="form-control" id="dd-m-vat" inputmode="decimal" placeholder="0"><span class="input-group-text">%</span></div>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dd-m-tvat">Tiền VAT</label>
                  <div class="input-group"><span class="input-group-text">đ</span><input type="text" class="form-control" id="dd-m-tvat" readonly></div>
                </div>
                <div class="col-md-4">
                  <label class="form-label" for="dd-m-sau">Tổng tiền sau VAT</label>
                  <div class="input-group"><span class="input-group-text">đ</span><input type="text" class="form-control" id="dd-m-sau" readonly></div>
                </div>
              </div>
            </div>
            <div class="mt-2">
              <label class="form-label" for="dd-m-gc">Ghi chú</label>
              <input type="text" class="form-control" id="dd-m-gc" placeholder="Ghi chú thêm (nếu có)">
            </div>
            <div class="alert alert-danger mt-2 mb-0 py-2 d-none" id="dd-form-error"></div>
          </div>
          <div class="modal-footer">
            <div class="text-muted small me-auto">Lưu xong phiếu chuyển sang <span class="badge bg-label-warning">Chờ duyệt</span></div>
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Huỷ</button>
            <button type="submit" class="btn btn-primary" id="dd-form-save"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Chi tiết -->
  <div class="modal fade" id="dd-view-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <div class="d-flex align-items-center gap-2">
            <h5 class="modal-title mb-0">Chi tiết phiếu đổ dầu</h5>
            <span class="badge bg-label-secondary border" id="dd-view-ma"></span>
            <span id="dd-view-status"></span>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div class="dd-loading" id="dd-view-loading"><div class="spinner-border text-primary" role="status"></div></div>
          <div id="dd-view-body"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Từ chối phiếu (nhập lý do) -->
  <div class="modal fade" id="dd-reject-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="dd-reject-title">Từ chối phiếu</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <label class="form-label" for="dd-reject-reason">Lý do <span class="text-danger">*</span></label>
          <textarea class="form-control" id="dd-reject-reason" rows="3" maxlength="255"></textarea>
          <div class="invalid-feedback">Vui lòng nhập lý do.</div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-danger" id="dd-reject-confirm">Xác nhận từ chối</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Xác nhận xoá -->
  <div class="modal fade" id="dd-delete-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-sm">
      <div class="modal-content">
        <div class="modal-body text-center p-4">
          <i class="ti tabler-alert-triangle dd-warn-icon"></i>
          <h5 class="mt-3 mb-2" id="dd-delete-title">Xoá phiếu?</h5>
          <p class="text-muted mb-4" id="dd-delete-text"></p>
          <div class="d-flex justify-content-center gap-2">
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Huỷ</button>
            <button type="button" class="btn btn-danger" id="dd-delete-confirm"><i class="ti tabler-trash me-1"></i>Xoá</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

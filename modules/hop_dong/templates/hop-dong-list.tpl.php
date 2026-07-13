<div class="card">
<link rel="stylesheet" href="<?php print base_path() . drupal_get_path('module', 'hop_dong') . '/assets/css/hop_dong.css'; ?>">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách hợp đồng</h4>
  </div>

  <div class="card-body">
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-hop-dong" placeholder="Tìm kiếm (Số hợp đồng, khách hàng)...">
          <button class="btn btn-primary" type="button" id="btn-search-hop-dong">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-12 col-md-8">
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
      <table id="table-hop-dong" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Số hợp đồng</th>
            <th>Ngày hợp đồng</th>
            <th>Hạn hợp đồng</th>
            <th>Khách hàng</th>
            <th>NV Kinh doanh</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody id="table-hop-dong-tbody">
          <tr id="loading-row">
            <td colspan="8" class="text-center py-4">
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
              <label class="form-label">Khách hàng</label>
              <select class="form-select select2-khach-hang" name="khach_hang" id="select-khach-hang">
                <option value="">Chọn khách hàng</option>
              </select>
            </div>
            <div class="col-md-12" id="nv-kinh-doanh-section" style="display:none;">
              <label class="form-label">NV Kinh doanh</label>
              <div id="nv-kinh-doanh-display" class="form-control-plaintext"></div>
            </div>
            <div class="col-md-12">
              <label class="form-label">Ghi chú</label>
              <input type="text" class="form-control" name="ghi_chu" placeholder="Ghi chú">
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

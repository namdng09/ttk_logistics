<div class="card">
<link rel="stylesheet" href="<?php print base_path() . drupal_get_path('module', 'cau_hinh_gia_ban') . '/assets/css/cau_hinh_gia_ban.css'; ?>">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Cấu hình giá bán</h4>
  </div>

  <div class="card-body">
    <!-- Search + Filter + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-cau-hinh-gia-ban" placeholder="Tìm kiếm (loại cont, địa chỉ kho)...">
          <button class="btn btn-primary" type="button" id="btn-search-cau-hinh-gia-ban">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-5 mb-2 mb-md-0">
        <select class="form-select" id="filter-khach-hang">
          <option value="">Tất cả khách hàng</option>
        </select>
      </div>
      <div class="col-6 col-md-3">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-cau-hinh-gia-ban" data-bs-toggle="modal" data-bs-target="#cau-hinh-gia-ban-modal">
            <i class="ti tabler-plus me-1"></i>Thêm
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-cau-hinh-gia-ban">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-cau-hinh-gia-ban" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Khách hàng</th>
            <th>Địa chỉ kho</th>
            <th>Khoảng cách</th>
            <th>Loại cont</th>
            <th>Loại công nợ</th>
            <th>Trạng thái</th>
            <th>Người tạo báo giá</th>
          </tr>
        </thead>
        <tbody id="table-cau-hinh-gia-ban-tbody">
          <tr id="loading-row">
            <td colspan="9" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="pagination-cau-hinh-gia-ban" class="mt-3" style="display:none;">
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

<!-- Create/Edit/View Modal -->
<div class="modal fade" id="cau-hinh-gia-ban-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <form id="form-cau-hinh-gia-ban" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="cau-hinh-gia-ban-modal-title">Thêm cấu hình giá bán</h5>
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
              <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
              <select id="khach-hang-select" class="form-select" name="nid_khach_hang" style="width:100%" required>
                <option value="">Chọn khách hàng</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn khách hàng</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Loại công nợ <span class="text-danger">*</span></label>
              <select class="form-select" name="loai_cong_no" id="loai-cong-no-select" required>
                <option value="">Chọn loại công nợ</option>
                <option value="Cuối tháng">Cuối tháng</option>
                <option value="Thanh toán ngay">Thanh toán ngay</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn loại công nợ</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Địa chỉ kho <span class="text-danger">*</span></label>
              <select id="dia-chi-kho-select" class="form-select" name="dia_chi_kho" style="width:100%" required>
                <option value="">Chọn/Nhập địa chỉ kho</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn địa chỉ kho</div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Khoảng cách <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text">km</span>
                <input type="text" class="form-control" name="khoang_cach" placeholder="0" required inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
              </div>
              <div class="invalid-feedback">Vui lòng nhập khoảng cách</div>
            </div>
            <div class="col-md-3">
              <label class="form-label">Loại cont <span class="text-danger">*</span></label>
              <select id="loai-cont-select" class="form-select" name="loai_cont" style="width:100%" required>
                <option value="">Chọn/Nhập loại cont</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn loại cont</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Đơn giá <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text">đ</span>
                <input type="text" class="form-control money-mask" name="don_gia" placeholder="1.000.000" required>
              </div>
              <div class="invalid-feedback">Vui lòng nhập đơn giá</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Phí neo xe <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text">đ</span>
                <input type="text" class="form-control money-mask" name="phi_neo_xe" placeholder="1.000.000" required>
              </div>
              <div class="invalid-feedback">Vui lòng nhập phí neo xe</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Phụ cấp <span class="text-danger">*</span></label>
              <div class="input-group">
                <span class="input-group-text">đ</span>
                <input type="text" class="form-control money-mask" name="phu_cap" placeholder="1.000.000" required>
              </div>
              <div class="invalid-feedback">Vui lòng nhập phụ cấp</div>
            </div>

            <!-- Chi phí khác Repeater -->
            <div class="col-12">
              <div class="chi-phi-section">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <label class="form-label mb-0"><i class="ti tabler-coin me-2"></i>Chi phí khác</label>
                  <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-chi-phi">
                    <i class="ti tabler-plus me-1"></i>Thêm
                  </button>
                </div>
                <div id="chi-phi-repeater">
                  <!-- Repeater items will be added here -->
                </div>
              </div>
            </div>

            <div class="col-md-12">
              <div>
                <label class="switch switch-success">
                  <input type="checkbox" class="switch-input" id="switch-trang-thai" checked>
                  <span class="switch-toggle-slider">
                    <span class="switch-on"><i class="icon-base ti tabler-check"></i></span>
                    <span class="switch-off"><i class="icon-base ti tabler-x"></i></span>
                  </span>
                  <span class="switch-label" id="switch-trang-thai-label">Hoạt động</span>
                </label>
                <input type="hidden" name="trang_thai" value="1" id="input-trang-thai">
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-cau-hinh-gia-ban">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách khách hàng</h4>
  </div>

  <div class="card-body">
    <!-- Search + Filter + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-khach-hang" placeholder="Tìm kiếm (Tên, mã KH, MST/CCCD, SĐT)...">
          <button class="btn btn-primary" type="button" id="btn-search-khach-hang">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-5 mb-2 mb-md-0">
        <select class="form-select" id="filter-phan-loai">
          <option value="">Tất cả phân loại</option>
          <option value="Doanh nghiệp">Doanh nghiệp</option>
          <option value="Cá nhân">Cá nhân</option>
          <option value="Khách hàng">Khách hàng</option>
          <option value="Nhà cung cấp">Nhà cung cấp</option>
          <option value="Đối tác">Đối tác</option>
          <option value="Khác">Khác</option>
        </select>
      </div>
      <div class="col-6 col-md-3">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-khach-hang" data-bs-toggle="modal" data-bs-target="#khach-hang-modal">
            <i class="ti tabler-plus me-1"></i>Thêm
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-khach-hang">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-khach-hang" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Tên công ty</th>
            <th>Tên ngắn gọn</th>
            <th>MST / CCCD</th>
            <th>SĐT</th>
            <th>Địa chỉ</th>
            <th>NV</th>
            <th>DOB</th>
            <th>Phân loại</th>
            <th>Ghi chú</th>
          </tr>
        </thead>
        <tbody id="table-khach-hang-tbody">
          <tr id="loading-row">
            <td colspan="11" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="pagination-khach-hang" class="mt-3" style="display:none;">
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

<!-- Create/Edit/View Modal — Fullscreen -->
<div class="modal fade" id="khach-hang-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="khach-hang-modal-title">Thêm khách hàng</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" style="position:relative;">
        <div id="modal-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
          <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:6rem;" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <form id="form-khach-hang" class="needs-validation" novalidate>
          <input type="hidden" name="nid" value="">

          <!-- Customer Info -->
          <div class="row g-3">
            <div class="col-lg-6">
              <label class="form-label">Tên công ty / Khách hàng <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Công ty TNHH ABC">
              <div class="invalid-feedback">Vui lòng nhập tên</div>
            </div>
            <div class="col-lg-3">
              <label class="form-label">Tên ngắn gọn</label>
              <input type="text" class="form-control" name="ma_kh" placeholder="ABC">
            </div>
            <div class="col-lg-3">
              <label class="form-label">MST / CCCD</label>
              <input type="text" class="form-control" name="cccd_mst" placeholder="0201234567">
            </div>

            <div class="col-lg-6">
              <label class="form-label">Phân loại <span class="text-danger">*</span></label>
              <input id="tagifyPhanLoai" class="form-control" name="phan_loai_tags" placeholder="Chọn phân loại" required>
              <div class="invalid-feedback">Vui lòng chọn phân loại</div>
            </div>
            <div class="col-lg-3">
              <label class="form-label">SĐT</label>
              <input type="tel" class="form-control" name="sdt" placeholder="0901234567" inputmode="numeric">
            </div>
            <div class="col-lg-3">
              <label class="form-label">Ngày sinh</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="dob" placeholder="dd/MM/yyyy">
            </div>

            <div class="col-12">
              <label class="form-label">Địa chỉ</label>
              <input type="text" class="form-control" name="dia_chi" placeholder="Số nhà, phường, quận, thành phố">
            </div>
          </div>

          <!-- Bank Info Section -->
          <div class="section mt-4">
            <div class="section-head d-flex justify-content-between align-items-center mb-2">
              <label class="form-label mb-0 fw-bold"><i class="ti tabler-building-bank me-2"></i>Thông tin ngân hàng</label>
              <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-ngan-hang">
                <i class="ti tabler-plus me-1"></i>Thêm
              </button>
            </div>
            <div id="ngan-hang-repeater"></div>
          </div>

          <!-- Warehouse + Pricing Section -->
          <div class="section mt-4 mb-3">
            <div class="section-head d-flex justify-content-between align-items-center mb-2">
              <label class="form-label mb-0 fw-bold"><i class="ti tabler-map-pin me-2"></i>Địa chỉ kho và bảng giá cước vận chuyển</label>
              <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-kho">
                <i class="ti tabler-plus me-1"></i>Thêm kho
              </button>
            </div>
            <div id="kho-list"></div>
          </div>

          <!-- Bottom fields -->
          <div class="row g-3 mt-1 mb-3">
            <div class="col-lg-6">
              <label class="form-label">NV Kinh doanh</label>
              <select id="nv-kinh-doanh-select" class="form-select" name="nv_kinh_doanh">
                <option value="">Chọn nhân viên</option>
              </select>
            </div>
            <div class="col-lg-6">
              <label class="form-label">Ghi chú</label>
              <input type="text" class="form-control" name="ghi_chu" placeholder="Ghi chú">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary btn-luu-khach-hang">
          <i class="ti tabler-device-floppy me-1"></i> Lưu
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Warehouse Card Template -->
<template id="tpl-kho-card">
  <div class="kho-card">
    <div class="kho-card-header">
      <div class="row g-2 align-items-center">
        <div class="col-md-6">
          <select class="form-select kho-dia-chi" style="width:100%">
            <option value="">Chọn hoặc nhập địa chỉ kho</option>
          </select>
        </div>
        <div class="col-md-4">
          <div class="input-group">
            <span class="input-group-text">km</span>
            <input type="number" min="0" class="form-control kho-khoang-cach" placeholder="Khoảng cách">
          </div>
        </div>
        <div class="col-md-2 text-end">
          <button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-kho" title="Xóa kho"><i class="ti tabler-x"></i></button>
        </div>
      </div>
    </div>

    <div class="kho-toolbar d-flex justify-content-between align-items-center px-3 py-2">
      <h6 class="mb-0 fw-bold"><i class="ti tabler-truck me-2"></i>Bảng giá cước vận chuyển theo kho</h6>
      <button type="button" class="btn btn-sm btn-label-primary btn-them-dong-gia"><i class="ti tabler-plus me-1"></i>Thêm dòng giá</button>
    </div>

    <div class="table-wrap">
      <table class="table table-bordered kho-pricing-table mb-0">
        <thead>
          <tr>
            <th rowspan="2">Loại cont</th>
            <th colspan="4">Cấu hình giá bán</th>
            <th colspan="5" class="kho-driver-th">Chi phí lái xe</th>
            <th rowspan="2">Tình trạng</th>
            <th rowspan="2"></th>
          </tr>
          <tr>
            <th>Đơn giá chưa VAT</th>
            <th>Phí neo xe</th>
            <th>Phụ phí 1</th>
            <th>Loại công nợ</th>
            <th class="kho-driver-th">Tổng phụ cấp</th>
            <th class="kho-driver-th">Tiền ăn</th>
            <th class="kho-driver-th">Vé cầu đường</th>
            <th class="kho-driver-th">Tiền dầu</th>
            <th class="kho-driver-th">Lương còn lại</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>

    <div class="kho-summary d-flex gap-2 flex-wrap px-3 py-2">
      <div class="kho-summary-item">
        <span>Số cấu hình giá</span>
        <strong class="kho-summary-count">0</strong>
      </div>
      <div class="kho-summary-item">
        <span>Giá bán thấp nhất</span>
        <strong class="kho-summary-min">0 đ</strong>
      </div>
      <div class="kho-summary-item">
        <span>Giá bán cao nhất</span>
        <strong class="kho-summary-max">0 đ</strong>
      </div>
    </div>
  </div>
</template>

<!-- Price Row Template -->
<template id="tpl-dong-gia">
  <tr>
    <td>
      <select class="form-select dg-loai-cont">
        <option value="20RF">20RF</option>
        <option value="40HC" selected>40HC</option>
        <option value="40RF">40RF</option>
        <option value="20DC">20DC</option>
        <option value="40DC">40DC</option>
      </select>
    </td>
    <td><input class="form-control money-input dg-don-gia" inputmode="numeric" placeholder="0"></td>
    <td><input class="form-control money-input dg-phi-neo-xe" inputmode="numeric" placeholder="0"></td>
    <td><input class="form-control money-input dg-phu-phi-1" inputmode="numeric" placeholder="0"></td>
    <td>
      <select class="form-select dg-loai-cong-no">
        <option value="Cuối tháng">Cuối tháng</option>
        <option value="15 ngày">15 ngày</option>
        <option value="30 ngày">30 ngày</option>
        <option value="Thanh toán ngay">Thanh toán ngay</option>
      </select>
    </td>
    <td><input class="form-control money-input dg-tong-phu-cap" inputmode="numeric" placeholder="0"></td>
    <td><input class="form-control money-input dg-tien-an" inputmode="numeric" placeholder="0"></td>
    <td><input class="form-control money-input dg-ve-cau-duong" inputmode="numeric" placeholder="0"></td>
    <td><input class="form-control money-input dg-tien-dau" inputmode="numeric" placeholder="0"></td>
    <td><input class="form-control money-input dg-luong-con-lai" inputmode="numeric" placeholder="0"></td>
    <td class="text-center">
      <div class="form-check form-switch form-check-inline m-0">
        <input class="form-check-input dg-hoat-dong" type="checkbox" checked>
      </div>
    </td>
    <td class="text-center">
      <button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-dong-gia" title="Xóa dòng"><i class="ti tabler-x"></i></button>
    </td>
  </tr>
</template>

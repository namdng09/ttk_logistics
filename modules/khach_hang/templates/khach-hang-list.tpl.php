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

<style>
  #khach-hang-dinh-muc-modal .kh-dm-loading {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.85);
  }

  #khach-hang-dinh-muc-modal .kh-dm-app,
  #khach-hang-dinh-muc-modal .kh-dm-app * {
    box-sizing: border-box;
  }

  #khach-hang-dinh-muc-modal .kh-dm-app {
    width: 100%;
    height: calc(100vh - 8.75rem);
    min-height: calc(100vh - 8.75rem);
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    overflow: hidden;
    background: #f4f6f9;
  }

  #khach-hang-dinh-muc-modal .kh-dm-topbar {
    flex: 0 0 auto;
    display: grid;
    grid-template-columns: minmax(240px, 360px) minmax(240px, 1fr) auto;
    gap: 8px;
    align-items: center;
    padding: 10px;
    border: 1px solid #dbe2ea;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(20, 37, 63, 0.07);
  }

  #khach-hang-dinh-muc-modal .kh-dm-customer {
    font-weight: 700;
  }

  #khach-hang-dinh-muc-modal .kh-dm-location-add {
    display: grid;
    grid-template-columns: minmax(180px, 1fr) auto;
    gap: 7px;
  }

  #khach-hang-dinh-muc-modal .kh-dm-actions {
    display: flex;
    gap: 7px;
    align-items: center;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-card {
    min-height: 0;
    flex: 1 1 auto;
    overflow: hidden;
    border: 1px solid #dbe2ea;
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 8px 24px rgba(20, 37, 63, 0.07);
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-wrap {
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table {
    width: max-content;
    min-width: 100%;
    margin-bottom: 0;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table th,
  #khach-hang-dinh-muc-modal .kh-dm-matrix-table td {
    border-right: 1px solid #dbe2ea;
    border-bottom: 1px solid #dbe2ea;
    background: #fff;
    vertical-align: top;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table thead th {
    position: sticky;
    top: 0;
    z-index: 5;
    width: 218px;
    min-width: 218px;
    padding: 0;
    background: #eef4fb;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table thead th:first-child {
    left: 0;
    z-index: 8;
    width: 180px;
    min-width: 180px;
    background: #e4edf8;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table tbody th {
    position: sticky;
    left: 0;
    z-index: 4;
    width: 180px;
    min-width: 180px;
    padding: 0;
    background: #f7f9fc;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table tbody td {
    width: 218px;
    min-width: 218px;
    height: 96px;
    padding: 6px;
  }

  #khach-hang-dinh-muc-modal .kh-dm-corner {
    height: 64px;
    display: grid;
    place-items: center;
    color: #0b6bcb;
    font-size: 18px;
    font-weight: 800;
  }

  #khach-hang-dinh-muc-modal .kh-dm-place-head,
  #khach-hang-dinh-muc-modal .kh-dm-place-row {
    position: relative;
    min-height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 30px 8px 10px;
    text-align: center;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.25;
  }

  #khach-hang-dinh-muc-modal .kh-dm-place-row {
    min-height: 96px;
    justify-content: flex-start;
    text-align: left;
    padding-left: 12px;
  }

  #khach-hang-dinh-muc-modal .kh-dm-remove-location {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #98a2b3;
    cursor: pointer;
  }

  #khach-hang-dinh-muc-modal .kh-dm-remove-location:hover {
    color: #d92d20;
    background: #fff0ef;
  }

  #khach-hang-dinh-muc-modal .kh-dm-route-cell {
    position: relative;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    gap: 5px;
    height: 84px;
  }

  #khach-hang-dinh-muc-modal .kh-dm-route-cell.is-changed::after {
    position: absolute;
    top: -2px;
    right: -2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f5a623;
    content: "";
  }

  #khach-hang-dinh-muc-modal .kh-dm-mini {
    position: relative;
    display: block;
    min-width: 0;
    min-height: 0;
  }

  #khach-hang-dinh-muc-modal .kh-dm-mini input {
    appearance: textfield;
    -moz-appearance: textfield;
    display: block;
    width: 100%;
    height: 100%;
    min-height: 34px;
    padding: 0 25px 0 7px;
    border: 1px solid #cfd8e3;
    border-radius: 7px;
    outline: 0;
    background: #fff;
    text-align: right;
    font-size: 12px;
    font-weight: 700;
  }

  #khach-hang-dinh-muc-modal .kh-dm-mini input::-webkit-outer-spin-button,
  #khach-hang-dinh-muc-modal .kh-dm-mini input::-webkit-inner-spin-button {
    margin: 0;
    -webkit-appearance: none;
  }

  #khach-hang-dinh-muc-modal .kh-dm-mini input:focus {
    border-color: #0b6bcb;
    box-shadow: 0 0 0 2px rgba(11, 107, 203, 0.1);
  }

  #khach-hang-dinh-muc-modal .kh-dm-mini span {
    position: absolute;
    top: 50%;
    right: 6px;
    transform: translateY(-50%);
    color: #667085;
    font-size: 10px;
    font-weight: 800;
    pointer-events: none;
  }

  #khach-hang-dinh-muc-modal .kh-dm-mini.allowance input {
    padding-right: 19px;
  }

  #khach-hang-dinh-muc-modal .kh-dm-mini.allowance span {
    right: 5px;
    color: #0b6bcb;
  }

  #khach-hang-dinh-muc-modal .kh-dm-diagonal {
    position: relative;
    height: 96px;
    overflow: hidden;
    background: #f7f9fc;
  }

  #khach-hang-dinh-muc-modal .kh-dm-diagonal::after {
    position: absolute;
    top: 50%;
    left: -12px;
    right: -12px;
    height: 2px;
    background: #98a2b3;
    transform: rotate(24deg);
    content: "";
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table th.kh-dm-highlight-row,
  #khach-hang-dinh-muc-modal .kh-dm-matrix-table td.kh-dm-highlight-row,
  #khach-hang-dinh-muc-modal .kh-dm-matrix-table th.kh-dm-highlight-col,
  #khach-hang-dinh-muc-modal .kh-dm-matrix-table td.kh-dm-highlight-col {
    background: #f1f7ff;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table th.kh-dm-highlight-row .kh-dm-place-row,
  #khach-hang-dinh-muc-modal .kh-dm-matrix-table th.kh-dm-highlight-col .kh-dm-place-head {
    color: #0b6bcb;
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table td.kh-dm-highlight-cell {
    background: #e7f1ff;
    box-shadow: inset 0 0 0 2px rgba(11, 107, 203, 0.28);
  }

  #khach-hang-dinh-muc-modal .kh-dm-matrix-table td.kh-dm-highlight-cell.kh-dm-diagonal::after {
    height: 3px;
    background: #0b6bcb;
  }

  #khach-hang-dinh-muc-modal .kh-dm-status {
    display: inline-flex;
    align-items: center;
    min-height: 38px;
    font-weight: 700;
    color: #16834a;
    white-space: nowrap;
  }

  #khach-hang-dinh-muc-modal .kh-dm-status.is-unsaved,
  #khach-hang-dinh-muc-modal .kh-dm-status.is-error {
    color: #d92d20;
  }

  @media (max-width: 900px) {
    #khach-hang-dinh-muc-modal .kh-dm-app {
      height: auto;
      min-height: calc(100vh - 8.75rem);
    }

    #khach-hang-dinh-muc-modal .kh-dm-topbar {
      grid-template-columns: 1fr;
    }

    #khach-hang-dinh-muc-modal .kh-dm-actions {
      flex-wrap: wrap;
    }

    #khach-hang-dinh-muc-modal .kh-dm-matrix-card {
      min-height: 70vh;
    }
  }
</style>

<div class="modal fade" id="khach-hang-dinh-muc-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="khach-hang-dinh-muc-title">Định mức khách hàng</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-0 position-relative">
        <div id="khach-hang-dinh-muc-loading" class="kh-dm-loading" style="display:none;">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <div class="kh-dm-app">
          <div class="kh-dm-topbar">
            <input type="text" class="form-control kh-dm-customer" id="kh-dm-customer-name" readonly>
            <div class="kh-dm-location-add">
              <select class="form-select" id="kh-dm-new-location"></select>
              <button type="button" class="btn btn-label-secondary" id="kh-dm-add-location">+ Điểm</button>
            </div>
            <div class="kh-dm-actions">
              <button type="button" class="btn btn-label-secondary" id="kh-dm-copy-opposite">Sao chép đối xứng</button>
              <span id="kh-dm-status" class="kh-dm-status">Đã lưu</span>
            </div>
          </div>
          <div class="kh-dm-matrix-card">
            <div class="kh-dm-matrix-wrap">
              <table class="kh-dm-matrix-table" id="kh-dm-matrix-table">
                <thead id="kh-dm-matrix-head"></thead>
                <tbody id="kh-dm-matrix-body"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" id="kh-dm-save"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>
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
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label mb-0 fw-bold"><i class="ti tabler-truck me-2"></i>Địa chỉ kho & Bảng giá cước vận chuyển</label>
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
      <!-- Address inputs row + delete kho -->
      <div class="row g-2 align-items-center">
        <div class="col-md-6">
          <select class="form-select kho-dia-chi" style="width:100%">
            <option value="">Chọn hoặc nhập địa chỉ kho</option>
          </select>
        </div>
        <div class="col-md-5">
          <div class="input-group">
            <span class="input-group-text">km</span>
            <input type="number" min="0" class="form-control kho-khoang-cach" placeholder="Khoảng cách">
          </div>
        </div>
        <div class="col-md-1 text-end">
          <button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-kho" title="Xóa kho"><i class="ti tabler-x"></i></button>
        </div>
      </div>
      <!-- Add price row button -->
      <div class="mt-2 text-end">
        <button type="button" class="btn btn-sm btn-label-primary btn-them-dong-gia"><i class="ti tabler-plus me-1"></i>Thêm dòng giá</button>
      </div>
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

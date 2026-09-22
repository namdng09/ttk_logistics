<div class="card" id="ke-hoach-tuyen-xa-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Kế hoạch tuyến xa</h4>
  </div>

  <div class="card-body">
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-ke-hoach-tuyen-xa" placeholder="Tìm theo BKG, cont, điểm đi, cửa khẩu, điểm đến">
          <button class="btn btn-primary" type="button" id="btn-search-ke-hoach-tuyen-xa">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-12 col-md-8">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-label-primary btn-open-ptkh-create">
            <i class="ti tabler-file-plus me-1"></i>Tạo phiếu trả KH
          </button>
          <button type="button" class="btn btn-primary btn-them-ke-hoach-tuyen-xa">
            <i class="ti tabler-plus me-1"></i>Thêm tuyến xa
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-ke-hoach-tuyen-xa">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center">CN</th>
            <th style="width:50px">#</th>
            <th>Khách hàng</th>
            <th>BKG / Cont</th>
            <th>Tuyến</th>
            <th>Ngày đi</th>
            <th>Ngày dự kiến xong</th>
            <th>Số chặng</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody id="table-ke-hoach-tuyen-xa-tbody">
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

    <div id="pagination-ke-hoach-tuyen-xa" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="pagination-ke-hoach-tuyen-xa-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="pagination-ke-hoach-tuyen-xa-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="pagination-ke-hoach-tuyen-xa-total-pages"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="khxh-ptkh-create-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Tạo phiếu trả khách hàng</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
      </div>
      <div class="modal-body position-relative">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-4">
            <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
            <select id="khxh-ptkh-create-customer" class="form-select khxh-ptkh-customer-select">
              <option value="">Chọn khách hàng</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Từ ngày</label>
            <input type="text" id="khxh-ptkh-create-from" class="form-control flatpickr-date date-mask" placeholder="dd/mm/yyyy">
          </div>
          <div class="col-md-3">
            <label class="form-label">Đến ngày</label>
            <input type="text" id="khxh-ptkh-create-to" class="form-control flatpickr-date date-mask" placeholder="dd/mm/yyyy">
          </div>
          <div class="col-md-2">
            <button type="button" class="btn btn-label-primary w-100" id="khxh-ptkh-load-candidates">
              <i class="ti tabler-filter me-1"></i>Lọc
            </button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle khxh-ptkh-candidate-table">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width:44px"><input type="checkbox" id="khxh-ptkh-check-all"></th>
                <th>Kế hoạch</th>
                <th>Ngày</th>
                <th>Tuyến</th>
                <th class="text-end">Doanh thu</th>
                <th class="text-end">Chi hộ</th>
                <th class="text-end">Tổng</th>
              </tr>
            </thead>
            <tbody id="khxh-ptkh-candidate-body">
              <tr><td colspan="7" class="text-center text-muted py-4">Chọn khách hàng rồi bấm Lọc.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-end gap-3 mt-3">
          <div class="khxh-ptkh-total-box"><span>Đã chọn</span><strong id="khxh-ptkh-selected-count">0</strong></div>
          <div class="khxh-ptkh-total-box"><span>Tổng tiền</span><strong id="khxh-ptkh-selected-total">0</strong></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" id="khxh-ptkh-create-submit">
          <i class="ti tabler-device-floppy me-1"></i>Tạo phiếu
        </button>
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
          <div class="text-muted small">Chọn đầu kéo cho chặng đang thao tác.</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="row g-2 align-items-center mb-3">
          <div class="col-md-6">
            <input type="text" class="form-control" id="vehicle-picker-search" placeholder="Tìm theo BKS, mã tài sản, lái xe...">
          </div>
          <div class="col-md-6 text-md-end">
            <div class="d-inline-flex align-items-center gap-2 justify-content-md-end flex-wrap">
              <div class="text-muted small" id="vehicle-picker-target">Đang chọn cho chặng #1</div>
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

<div class="modal fade" id="ke-hoach-tuyen-xa-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="ke-hoach-tuyen-xa-modal-title">Thêm kế hoạch tuyến xa</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body position-relative">
        <div class="loading-overlay" id="ke-hoach-tuyen-xa-modal-loading" style="display:none;">
          <div class="spinner-border text-primary"></div>
        </div>

        <form id="form-ke-hoach-tuyen-xa" novalidate>
          <input type="hidden" name="nid" value="">

          <div class="row g-3 mb-3">
            <div class="col-md-3">
              <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
              <select class="form-select" name="nid_khach_hang" required>
                <option value="">Chọn khách hàng</option>
              </select>
            </div>
            <div class="col-md-3">
              <label class="form-label">Số BKG <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="so_bkg" placeholder="Nhập số BKG">
            </div>
            <div class="col-md-3">
              <label class="form-label">Số cont <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="so_cont" placeholder="Nhập số cont">
            </div>
            <div class="col-md-3">
              <label class="form-label">Loại cont</label>
              <select class="form-select" name="loai_cont">
                <option value="">Chọn hoặc nhập loại cont</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Điểm đi <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="diem_di" placeholder="Ví dụ: Campuchia">
            </div>
            <div class="col-md-4">
              <label class="form-label">Cửa khẩu</label>
              <select class="form-select" name="cua_khau">
                <option value="">Chọn cửa khẩu</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Điểm đến <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="diem_den" placeholder="Ví dụ: Hà Nội">
            </div>
            <div class="col-md-4">
              <label class="form-label">Kho / điểm nhận</label>
              <select class="form-select" name="dia_chi_kho">
                <option value="">Chọn hoặc nhập kho</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày bắt đầu</label>
              <input type="text" class="form-control input-date-only" name="ngay_bat_dau" placeholder="dd/mm/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày kết thúc</label>
              <input type="text" class="form-control input-date-only" name="ngay_ket_thuc" placeholder="dd/mm/yyyy">
            </div>
          </div>

          <div class="ke-hoach-tuyen-xa-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Chặng chuyến</h6>
              <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-chang">
                <i class="ti tabler-plus me-1"></i>Thêm chặng
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-bordered align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th style="width:60px">#</th>
                    <th>Loại chặng</th>
                    <th>Điểm đi</th>
                    <th>Điểm đến</th>
                    <th>Ngày đi</th>
                    <th>Ngày đến</th>
                    <th>Đầu kéo</th>
                    <th>Mooc</th>
                    <th>Lái xe</th>
                    <th style="width:70px" class="text-center">Xoá</th>
                  </tr>
                </thead>
                <tbody id="ke-hoach-tuyen-xa-chang-body"></tbody>
              </table>
            </div>
          </div>

          <div class="ke-hoach-tuyen-xa-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Chi phí</h6>
              <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-chi-phi">
                <i class="ti tabler-plus me-1"></i>Thêm chi phí
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-bordered align-middle mb-0 ke-hoach-tuyen-xa-chi-phi-table">
                <colgroup>
                  <col style="width: 180px;">
                  <col style="width: 260px;">
                  <col style="width: 140px;">
                  <col style="width: 130px;">
                  <col style="width: 120px;">
                  <col style="width: 70px;">
                </colgroup>
                <thead class="table-light">
                  <tr>
                    <th>Loại chi phí</th>
                    <th>Tên chi phí</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Gắn chặng #</th>
                    <th style="width:70px" class="text-center">Xoá</th>
                  </tr>
                </thead>
                <tbody id="ke-hoach-tuyen-xa-chi-phi-body"></tbody>
              </table>
            </div>
          </div>

          <div class="ke-hoach-tuyen-xa-section">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="mb-0">Nhật ký dầu</h6>
              <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-dau">
                <i class="ti tabler-plus me-1"></i>Thêm dòng dầu
              </button>
            </div>
            <div class="table-responsive">
              <table class="table table-bordered align-middle mb-0 ke-hoach-tuyen-xa-dau-table">
                <colgroup>
                  <col style="width: 220px;">
                  <col style="width: 130px;">
                  <col style="width: 120px;">
                  <col style="width: 140px;">
                  <col style="width: 120px;">
                  <col style="width: 70px;">
                </colgroup>
                <thead class="table-light">
                  <tr>
                    <th>Loại dầu</th>
                    <th>Ngày</th>
                    <th>Số lít</th>
                    <th>Số tiền</th>
                    <th>Gắn chặng #</th>
                    <th style="width:70px" class="text-center">Xoá</th>
                  </tr>
                </thead>
                <tbody id="ke-hoach-tuyen-xa-dau-body"></tbody>
              </table>
            </div>
          </div>

          <div class="ke-hoach-tuyen-xa-section">
            <div class="row g-3">
              <div class="col-12">
                <label class="form-label">Ghi chú</label>
                <textarea class="form-control" name="ghi_chu" rows="3" placeholder="Nhập ghi chú nếu có"></textarea>
              </div>
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
        <button type="button" class="btn btn-primary" id="btn-save-ke-hoach-tuyen-xa">
          <i class="icon-base ti tabler-device-floppy me-1"></i>Lưu thông tin
        </button>
      </div>
    </div>
  </div>
</div>

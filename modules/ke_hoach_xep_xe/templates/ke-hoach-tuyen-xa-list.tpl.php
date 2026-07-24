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
          <button type="button" class="btn btn-primary btn-them-ke-hoach-tuyen-xa">
            <i class="ti tabler-plus me-1"></i>Thêm kế hoạch tuyến xa
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
            <th>Loại</th>
            <th>Ngày đi</th>
            <th>Ngày dự kiến xong</th>
            <th>Số chặng</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody id="table-ke-hoach-tuyen-xa-tbody">
          <tr id="loading-row">
            <td colspan="10" class="text-center py-4">
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
              <input type="text" class="form-control" name="loai_cont" placeholder="Ví dụ: 45'">
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
              <input type="text" class="form-control" name="dia_chi_kho" placeholder="Nhập kho / nơi nhận hàng">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày bắt đầu</label>
              <input type="text" class="form-control input-date-only" name="ngay_bat_dau" placeholder="dd/mm/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày kết thúc dự kiến</label>
              <input type="text" class="form-control input-date-only" name="ngay_ket_thuc_du_kien" placeholder="dd/mm/yyyy">
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
              <table class="table table-bordered align-middle mb-0">
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
              <table class="table table-bordered align-middle mb-0">
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

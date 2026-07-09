<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách lái xe</h4>
    <div class="d-flex gap-2">
      <button type="button" class="btn btn-primary btn-them-lai-xe" data-bs-toggle="modal" data-bs-target="#lai-xe-modal">
        <i class="ti tabler-plus me-1"></i>Thêm lái xe
      </button>
      <button type="button" class="btn btn-label-secondary btn-reload-lai-xe">
        <i class="ti tabler-refresh me-1"></i>Reload
      </button>
    </div>
  </div>

  <div class="card-body">
    <!-- Search -->
    <div class="row mb-3">
      <div class="col-md-4">
        <div class="input-group">
          <input type="text" class="form-control" id="search-lai-xe" placeholder="Tìm kiếm (tên, mã NV, SDT, CCCD)...">
          <button class="btn btn-primary" type="button" id="btn-search-lai-xe">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-lai-xe" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Họ tên</th>
            <th>Mã NV</th>
            <th>SĐT</th>
            <th>CCCD</th>
            <th>Ngày cấp</th>
            <th>Nơi cấp</th>
            <th>Hạn CCCD</th>
            <th>Số bằng lái</th>
            <th>Loại bằng</th>
            <th>Hạn bằng</th>
            <th>Ngày nhận việc</th>
            <th>Số TK</th>
            <th>Ngân hàng</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody id="table-lai-xe-tbody">
          <tr id="loading-row">
            <td colspan="16" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav id="pagination-lai-xe" class="mt-3" style="display:none;">
      <ul class="pagination justify-content-center mb-0"></ul>
    </nav>
  </div>
</div>

<!-- Create/Edit Modal -->
<div class="modal fade" id="lai-xe-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <form id="form-lai-xe" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="lai-xe-modal-title">Thêm lái xe</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <input type="hidden" name="nid" value="">

          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Họ tên <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Nhập họ tên">
              <div class="invalid-feedback">Vui lòng nhập họ tên</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Mã nhân viên</label>
              <input type="text" class="form-control" name="ma_nhan_vien" placeholder="NV001">
            </div>
            <div class="col-md-4">
              <label class="form-label">SĐT</label>
              <input type="tel" class="form-control phone-mask" name="sdt" placeholder="0">
            </div>
            <div class="col-md-4">
              <label class="form-label">CCCD</label>
              <input type="text" class="form-control" name="cccd" placeholder="0" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày cấp</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_cap" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Nơi cấp</label>
              <input type="text" class="form-control" name="noi_cap" placeholder="Nhập nơi cấp">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn CCCD</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_cccd" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Số bằng lái</label>
              <input type="text" class="form-control" name="so_bang_lai" placeholder="Nhập số bằng lái">
            </div>
            <div class="col-md-4">
              <label class="form-label">Loại bằng lái</label>
              <input type="text" class="form-control" name="loai_bang_lai" placeholder="B2, C, D...">
            </div>
            <div class="col-md-4">
              <label class="form-label">Hạn bằng lái</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="han_bang_lai" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày nhận việc</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="ngay_nhan_viec" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">Số TK ngân hàng</label>
              <input type="text" class="form-control" name="so_tk_ngan_hang" placeholder="0" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngân hàng</label>
              <input type="text" class="form-control" name="ngan_hang" placeholder="Tên ngân hàng">
            </div>
            <div class="col-md-4">
              <div class="form-check mt-4">
                <input type="checkbox" class="form-check-input" name="hoat_dong" id="hoat-dong-check" value="1">
                <label class="form-check-label" for="hoat-dong-check">Đang hoạt động</label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="submit" class="btn btn-primary btn-luu-lai-xe">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- View Modal -->
<div class="modal fade" id="lai-xe-view-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Chi tiết lái xe</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" id="lai-xe-view-body">
        <div class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
      </div>
    </div>
  </div>
</div>

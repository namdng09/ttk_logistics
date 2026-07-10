<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách nhân viên</h4>
  </div>

  <div class="card-body">
    <!-- Search + Filter + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-nhan-vien" placeholder="Tìm kiếm (Họ tên, mã NV, username, email)...">
          <button class="btn btn-primary" type="button" id="btn-search-nhan-vien">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-3 mb-2 mb-md-0">
        <select class="form-select" id="filter-role">
          <option value="">Tất cả vai trò</option>
        </select>
      </div>
      <div class="col-6 col-md-3 mb-2 mb-md-0">
        <select class="form-select" id="filter-trang-thai">
          <option value="">Tất cả trạng thái</option>
          <option value="1">Hoạt động</option>
          <option value="0">Khoá</option>
        </select>
      </div>
      <div class="col-12 col-md-2">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-nhan-vien" data-bs-toggle="modal" data-bs-target="#nhan-vien-modal">
            <i class="ti tabler-plus me-1"></i>Thêm
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-nhan-vien">
            <i class="ti tabler-refresh me-1"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-nhan-vien" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px">Chức năng</th>
            <th style="width:50px">#</th>
            <th>Mã NV</th>
            <th>Họ tên</th>
            <th>Username</th>
            <th>Email</th>
            <th>Phòng ban</th>
            <th>Chức vụ</th>
            <th>Vai trò</th>
            <th style="width:90px">Trạng thái</th>
          </tr>
        </thead>
        <tbody id="table-nhan-vien-tbody">
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

    <!-- Pagination -->
    <div id="pagination-nhan-vien" class="mt-3" style="display:none;">
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
<div class="modal fade" id="nhan-vien-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <form id="form-nhan-vien" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="nhan-vien-modal-title">Thêm nhân viên</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div id="modal-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
            <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:6rem;" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
          </div>
          <input type="hidden" name="uid" value="">

          <div class="row g-3">
            <div class="col-md-4">
              <label class="form-label">Họ tên <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Nguyễn Văn An">
              <div class="invalid-feedback">Vui lòng nhập họ tên</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Mã nhân viên</label>
              <input type="text" class="form-control" name="ma_nhan_vien" placeholder="NV0001">
            </div>
            <div class="col-md-4">
              <label class="form-label">Username <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="username" required placeholder="nguyenvanan">
              <div class="invalid-feedback">Vui lòng nhập username</div>
            </div>
            <div class="col-md-4">
              <label class="form-label" id="label-password">Password <span class="text-danger">*</span></label>
              <input type="password" class="form-control" name="password" placeholder="Nhập mật khẩu">
              <div class="invalid-feedback">Vui lòng nhập mật khẩu</div>
              <div class="form-text" id="password-hint" style="display:none;">Để trống nếu không đổi mật khẩu</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" name="mail" placeholder="email@example.com">
              <div class="invalid-feedback">Email không hợp lệ</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Ngày sinh</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="dob" placeholder="dd/MM/yyyy">
            </div>
            <div class="col-md-4">
              <label class="form-label">CCCD</label>
              <input type="text" class="form-control" name="cccd" placeholder="0" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-8">
              <label class="form-label">Địa chỉ</label>
              <input type="text" class="form-control" name="dia_chi" placeholder="Số nhà, phường, quận, thành phố">
            </div>
            <div class="col-md-4">
              <label class="form-label">Số TK ngân hàng</label>
              <input type="text" class="form-control" name="so_tk_ngan_hang" placeholder="0" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">
            </div>
            <div class="col-md-8">
              <label class="form-label">Ngân hàng</label>
              <input type="text" class="form-control" name="ngan_hang" placeholder="Tên ngân hàng">
            </div>
            <div class="col-md-4">
              <label class="form-label">Phòng ban</label>
              <select class="form-select" name="phong_ban">
                <option value="">Chọn phòng ban</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Chức vụ</label>
              <select class="form-select" name="chuc_vu">
                <option value="">Chọn chức vụ</option>
              </select>
            </div>
            <div class="col-md-4">
              <label class="form-label">Vai trò <span class="text-danger">*</span></label>
              <select class="form-select" name="role_rid" required>
                <option value="">Chọn vai trò</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn vai trò</div>
            </div>
            <div class="col-md-4">
              <label class="form-label">Trạng thái</label>
              <select class="form-select" name="trang_thai">
                <option value="1">Hoạt động</option>
                <option value="0">Khoá</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-nhan-vien">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
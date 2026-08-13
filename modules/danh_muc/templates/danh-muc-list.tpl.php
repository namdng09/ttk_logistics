<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách danh mục</h4>
  </div>

  <div class="card-body">
    <!-- Search + Filter + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-danh-muc" placeholder="Tìm kiếm (Tên, phân loại)...">
          <button class="btn btn-primary" type="button" id="btn-search-danh-muc">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-4 mb-2 mb-md-0">
        <select class="form-select" id="filter-phan-loai">
          <option value="">Tất cả phân loại</option>
          <option value="Phòng ban">Phòng ban</option>
          <option value="Chức vụ">Chức vụ</option>
          <option value="Chi phí">Chi phí</option>
          <option value="Kho">Kho</option>
          <option value="Bãi">Bãi</option>
          <option value="Cảng">Cảng</option>
          <option value="Cửa khẩu">Cửa khẩu</option>
        </select>
      </div>
      <div class="col-6 col-md-4">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-danh-muc" data-bs-toggle="modal" data-bs-target="#danh-muc-modal">
            <i class="ti tabler-plus me-1"></i>Thêm danh mục
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-danh-muc">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="table-danh-muc" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Tên danh mục</th>
            <th style="width:160px;">Phân loại</th>
            <th style="width:320px;">Phụ phí</th>
          </tr>
        </thead>
        <tbody id="table-danh-muc-tbody">
          <tr id="loading-row">
            <td colspan="5" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="pagination-danh-muc" class="mt-3" style="display:none;">
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

<?php print theme('danh_muc_modal'); ?>


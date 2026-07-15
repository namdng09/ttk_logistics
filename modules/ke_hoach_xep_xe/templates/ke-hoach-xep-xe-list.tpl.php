<div class="card" id="ke-hoach-list-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách kế hoạch xếp xe</h4>
  </div>

  <div class="card-body">
    <!-- Search + Filter + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-input" placeholder="Tìm kiếm (BKG, cont, kho, bãi, cảng…)">
          <button class="btn btn-primary" type="button" id="search-btn">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-5 mb-2 mb-md-0">
        <select class="form-select" id="status-filter">
          <option value="">Tất cả trạng thái</option>
        </select>
      </div>
      <div class="col-6 col-md-3">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table table-bordered table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center">CN</th>
            <th style="width:50px">#</th>
            <th>Ngày lập KH</th>
            <th>Khách hàng</th>
            <th>Số bkg</th>
            <th>Địa chỉ kho</th>
            <th>Loại cont</th>
            <th>Số cont</th>
            <th>Lái xe</th>
            <th>Biển số đầu xe</th>
            <th>Số seal chính</th>
            <th>Số seal tạm</th>
            <th>Bãi lấy cont</th>
            <th>Bãi hạ cont</th>
            <th>Cut off</th>
            <th>Cảng xuất</th>
            <th>Trạng thái vận chuyển</th>
          </tr>
        </thead>
        <tbody id="list-body">
          <tr id="loading-row">
            <td colspan="17" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="pagination-wrap" class="mt-3" style="display:none;">
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
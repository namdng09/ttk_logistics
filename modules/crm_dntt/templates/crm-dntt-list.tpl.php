<?php
/**
 * @file
 * Template: DNTT list page.
 */
?>
<div class="container-fluid crm-dntt-list">
  <div class="card">
    <div class="card-header d-flex align-items-center justify-content-between">
      <h5 class="mb-0">Đề Nghị Thanh Toán</h5>
      <div>
        <button class="btn btn-warning me-2 d-none" id="btn-batch-trinh" title="Trình duyệt các DNTT đã chọn">
          <i class="bx bx-send me-1"></i>Trình duyệt (<span id="batch-count">0</span>)
        </button>
        <a href="/quan-ly/dntt/them-moi" class="btn btn-primary" id="btn-create-dntt">
          <i class="bx bx-plus me-1"></i>Tạo DNTT
        </a>
      </div>
    </div>

    <div class="card-body">
      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3" id="dntt-tabs" role="tablist">
        <!-- JS renders tabs based on permissions -->
      </ul>

      <!-- Filters -->
      <div class="row g-2 mb-3" id="dntt-filters">
        <div class="col-md-3">
          <select class="form-select" id="filter-doi-tac" data-placeholder="Đối tác nhận tiền..."></select>
        </div>
        <div class="col-md-2">
          <select class="form-select" id="filter-trang-thai">
            <option value="">Tất cả trạng thái</option>
            <option value="moi">Mới</option>
            <option value="cho_duyet">Chờ duyệt</option>
            <option value="da_duyet">Đã duyệt</option>
            <option value="tu_choi">Từ chối</option>
            <option value="da_tt">Đã TT</option>
            <option value="tu_choi_tt">Từ chối TT</option>
          </select>
        </div>
        <div class="col-md-3">
          <input type="text" class="form-control" id="filter-daterange" placeholder="Khoảng ngày...">
        </div>
        <div class="col-md-2">
          <button class="btn btn-label-secondary w-100" id="btn-filter-clear">
            <i class="bx bx-x me-1"></i>Xóa lọc
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="table-responsive">
        <table class="table table-bordered table-hover" id="dntt-table">
          <thead class="table-light">
            <tr>
              <th width="40"><input type="checkbox" class="form-check-input" id="chk-all"></th>
              <th>Số DNTT</th>
              <th>Đối tác nhận tiền</th>
              <th class="text-end">Tổng tiền</th>
              <th width="60">Tiền</th>
              <th width="110">Trạng thái</th>
              <th width="100">Ngày tạo</th>
            </tr>
          </thead>
          <tbody id="dntt-tbody"></tbody>
        </table>
      </div>

      <!-- Pagination -->
      <nav id="dntt-pagination" class="d-flex justify-content-between align-items-center mt-3">
        <small class="text-muted" id="pagination-info"></small>
        <ul class="pagination pagination-sm mb-0" id="pagination-links"></ul>
      </nav>

      <!-- Empty state -->
      <div class="text-center py-5 d-none" id="dntt-empty">
        <i class="bx bx-file-blank" style="font-size:3rem;opacity:.3;"></i>
        <p class="text-muted mt-2">Chưa có DNTT nào</p>
      </div>
    </div>
  </div>
</div>

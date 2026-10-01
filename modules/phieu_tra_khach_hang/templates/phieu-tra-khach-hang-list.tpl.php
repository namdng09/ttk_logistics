<?php
/**
 * @file
 * Danh sách phiếu trả khách hàng — bố cục 2 card như /de-nghi-thanh-toan (bản riêng, tiền tố ptkh-, không dùng chung selector):
 * card trên = tiêu đề + nút tạo + bộ lọc; card dưới = tab trạng thái có số lượng + bảng + phân trang.
 * Modal Tạo/Sửa là modal dùng chung (phieu-tra-khach-hang-modal.tpl.php), nối vào cuối trang ở page callback.
 */
?>
<div id="ptkh-app" class="ptkh-list-app ptkh-page">
  <div class="card ptkh-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0"><i class="ti tabler-file-invoice me-2 ptkh-title-icon"></i>Phiếu trả khách hàng</h4>
      <?php if (api_has_permission('phieu_tra_khach_hang_create')): ?>
      <button type="button" class="btn btn-primary" id="ptkh-open-create"><i class="ti tabler-plus me-1"></i>Tạo phiếu</button>
      <?php endif; ?>
    </div>
    <div class="card-body ptkh-filter-body">
      <div class="ptkh-filter-grid">
        <div class="ptkh-filter-field">
          <label class="form-label" for="ptkh-keyword">Từ khóa</label>
          <input type="text" class="form-control" id="ptkh-keyword" placeholder="Mã phiếu, số hoá đơn">
        </div>
        <div class="ptkh-filter-field">
          <label class="form-label" for="ptkh-filter-customer">Khách hàng</label>
          <select class="form-select" id="ptkh-filter-customer"><option value="">Tất cả</option></select>
        </div>
        <div class="ptkh-filter-field">
          <label class="form-label" for="ptkh-filter-created">Ngày tạo</label>
          <input type="text" class="form-control" id="ptkh-filter-created" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
        </div>
        <div class="ptkh-filter-actions">
          <button type="button" class="btn btn-primary" id="ptkh-search"><i class="ti tabler-search me-1"></i>Tìm</button>
          <button type="button" class="btn btn-label-secondary ptkh-filter-reset" id="ptkh-reload" title="Reset bộ lọc" aria-label="Reset bộ lọc"><i class="ti tabler-refresh"></i></button>
        </div>
      </div>
    </div>
  </div>

  <div class="card ptkh-list-card">
    <div class="card-body p-0">
      <div class="ptkh-status-tabs-wrap">
        <ul class="nav nav-pills ptkh-status-tabs" id="ptkh-tabs" role="tablist"></ul>
      </div>

      <div class="ptkh-table-scroll">
        <div class="table-responsive">
          <table class="table table-bordered table-hover mb-0 ptkh-list-table">
            <thead class="table-light">
              <tr>
                <th style="width:46px;text-align:center;">CN</th>
                <th style="width:170px;">Mã phiếu</th>
                <th>Khách hàng</th>
                <th style="width:150px;">Người thực hiện</th>
                <th style="width:190px;">Thời gian</th>
                <th class="text-end" style="width:140px;">Tổng tiền</th>
                <th style="width:190px;">Trạng thái</th>
                <th class="text-center" style="width:70px;">Tải</th>
                <th class="text-center" style="width:80px;">Lịch sử</th>
              </tr>
            </thead>
            <tbody id="ptkh-table-body">
              <tr id="ptkh-loading-row"><td colspan="9" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="ptkh-pagination-wrap" class="mt-3 px-3 pb-3" style="display:none;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="ptkh-pagination-info"></div>
          <nav><ul class="pagination justify-content-center mb-0" id="ptkh-pagination"></ul></nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="ptkh-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="ptkh-pagination-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="ptkh-detail-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="ptkh-detail-title">Chi tiết phiếu</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body" id="ptkh-detail-body"></div>
      <div class="modal-footer"><a class="btn btn-label-primary" id="ptkh-detail-download" target="_blank"><i class="ti tabler-download me-1"></i>Tải phiếu trả</a><button type="button" class="btn btn-primary" data-bs-dismiss="modal">Đóng</button></div>
    </div>
  </div>
</div>

<div class="modal fade" id="ptkh-status-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header"><h5 class="modal-title" id="ptkh-status-title">Cập nhật trạng thái duyệt</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body position-relative">
        <div class="ptkh-status-loading-overlay" id="ptkh-status-loading" style="display:none;"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></div>
        <div class="mb-3">
          <label class="form-label">Trạng thái</label>
          <div id="ptkh-status-badge"></div>
        </div>
        <div class="mb-3" id="ptkh-status-invoice-row">
          <label class="form-label">Số hóa đơn <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="ptkh-status-invoice" placeholder="Nhập số hóa đơn">
        </div>
        <div class="mb-3" id="ptkh-status-month-row">
          <label class="form-label">Tháng hạch toán <span class="text-danger">*</span></label>
          <input type="text" class="form-control" id="ptkh-status-month" placeholder="MM/YYYY">
          <div class="form-text text-muted">Chọn ngày bất kỳ trong tháng, hệ thống tự lấy tháng/năm.</div>
        </div>
        <div class="mb-3">
          <label class="form-label">Ghi chú</label>
          <textarea class="form-control" id="ptkh-status-note" rows="3" placeholder="Ghi chú duyệt (nếu có)"></textarea>
        </div>
      </div>
      <div class="modal-footer"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Huỷ</button><button type="button" class="btn btn-primary" id="ptkh-status-submit"><i class="ti tabler-device-floppy me-1"></i>Xác nhận</button></div>
    </div>
  </div>
</div>

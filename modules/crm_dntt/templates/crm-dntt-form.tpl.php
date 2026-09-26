<?php
/**
 * @file
 * Template: DNTT form (create/edit) — workspace layout (Issue 16).
 * Variables: $dntt_id, $is_new, $trang_thai, $is_editable
 *
 * Layout: full-viewport workspace, cột trái 75% (form + chi tiết) cuộn riêng,
 * sidebar phải 25% (Tổng hợp / Lô hàng liên quan / Lịch sử / Chứng từ) cuộn riêng,
 * sticky bar đáy = summary + action buttons.
 * Giữ nguyên toàn bộ ID field cũ để JS tương thích.
 */
$dntt_id = isset($dntt_id) ? $dntt_id : NULL;
$is_new = empty($dntt_id);
?>
<div class="crm-dntt-form crm-dntt-workspace">

  <input type="hidden" id="dntt-id" value="<?php echo $is_new ? '' : (int) $dntt_id; ?>">
  <input type="hidden" id="dntt-so-dntt">

  <!-- Workspace body: 75% form trái + 25% sidebar phải -->
  <div class="crm-dntt-ws-body">

    <!-- ============ Cột trái 75% ============ -->
    <div class="crm-dntt-ws-main">

      <!-- Breadcrumb + badges -->
      <div class="d-flex align-items-center justify-content-between mb-3">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb mb-0">
            <li class="breadcrumb-item"><a href="/quan-ly/dntt"><i class="bx bx-arrow-back me-1"></i>DNTT</a></li>
            <li class="breadcrumb-item active"><?php echo $is_new ? 'Tạo mới' : 'Chi tiết'; ?></li>
          </ol>
        </nav>
        <div id="dntt-status-badges">
          <?php if (!$is_new): ?>
            <span id="badge-loai-dntt" class="badge bg-label-primary me-1"></span>
            <span id="badge-trang-thai"></span>
            <span id="dntt-hoan-ve-links" class="ms-2"></span>
          <?php endif; ?>
        </div>
      </div>

      <!-- Section 1: Đối tác -->
      <div class="section-label mb-2"><i class="ti tabler-building me-1"></i>Thông tin đối tác</div>
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <label class="form-label mb-1">Bên phát hành <span class="text-danger">*</span></label>
          <select id="dntt-ben-phat-hanh" class="w-100"></select>
          <div class="form-check mt-1">
            <input class="form-check-input" type="checkbox" id="dntt-same-doi-tac" checked>
            <label class="form-check-label small" for="dntt-same-doi-tac">Đối tác nhận tiền trùng Bên phát hành</label>
          </div>
        </div>
        <div class="col-md-4 d-none" id="row-doi-tac-nhan-tien">
          <label class="form-label mb-1">Đối tác nhận tiền <span class="text-danger">*</span></label>
          <select id="dntt-doi-tac-nhan-tien" class="w-100"></select>
        </div>
      </div>

      <!-- Section 2: Hóa đơn -->
      <div class="section-label mb-2"><i class="ti tabler-receipt me-1"></i>Thông tin hóa đơn</div>
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <label class="form-label mb-1">Số hóa đơn</label>
          <div class="input-group input-group-sm">
            <input type="text" class="form-control" id="dntt-so-hoa-don" placeholder="Nhập số HĐ...">
            <span class="input-group-text">
              <div class="form-check mb-0 d-flex">
                <input class="form-check-input me-1" type="checkbox" id="dntt-no-hoa-don">
                <label class="form-check-label small" for="dntt-no-hoa-don">Nợ HĐ</label>
              </div>
            </span>
          </div>
        </div>
        <div class="col-md-4">
          <label class="form-label mb-1">Ngày hóa đơn</label>
          <input type="text" class="form-control form-control-sm" id="dntt-ngay-hoa-don" placeholder="Chọn ngày...">
        </div>
        <div class="col-md-4">
          <label class="form-label mb-1">Hạn thanh toán</label>
          <input type="text" class="form-control form-control-sm" id="dntt-han-thanh-toan" placeholder="Chọn ngày...">
        </div>
      </div>

      <!-- Section 3: Thanh toán -->
      <div class="section-label mb-2"><i class="ti tabler-cash me-1"></i>Thanh toán</div>
      <div class="row g-2 mb-3">
        <div class="col-md-4">
          <label class="form-label mb-1">Hình thức TT</label>
          <select class="form-select form-select-sm" id="dntt-hinh-thuc-tt">
            <option value="CK">Chuyển khoản (CK)</option>
            <option value="TM">Tiền mặt (TM)</option>
          </select>
        </div>
        <div class="col-md-4" id="dntt-ti-gia-wrap">
          <label class="form-label mb-1">Tỉ giá USD</label>
          <input type="number" class="form-control form-control-sm" id="dntt-ti-gia" value="1" step="0.01" min="0">
          <div class="form-check mt-1">
            <input class="form-check-input" type="checkbox" id="dntt-dung-ty-gia-chung">
            <label class="form-check-label small" for="dntt-dung-ty-gia-chung">Dùng tỷ giá hiện tại</label>
          </div>
        </div>
      </div>

      <!-- Section 4: Chi tiết chi phí -->
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="section-label mb-0"><i class="ti tabler-list-details me-1"></i>Chi tiết chi phí</div>
        <button type="button" class="btn btn-sm btn-label-primary" id="btn-add-row" title="Thêm dòng">
          <i class="bx bx-plus me-1"></i>Thêm dòng
        </button>
      </div>

      <div class="table-responsive crm-dntt-detail-scroll">
        <table class="table table-bordered table-sm mb-0 crm-dntt-detail-table" id="table-chi-tiet">
          <thead class="table-white">
            <tr class="text-uppercase text-nowrap">
              <th class="text-center" width="40">#</th>
              <!--
                Ô này mang HAI thứ: Jobfile (ô chọn) và số cont của chuyến đã
                gom dòng (dòng phụ mờ bên dưới, `.ct-so-cont` do JS điền —
                ticket 03 "Số cont trên dòng chi phí"). Nhan đề nói cả hai vì
                nếu không, dòng phụ là một chuỗi không nhãn giữa bảng 15 cột.
                Cont KHÔNG thành cột thứ 16: nó thuộc về lô, và thêm cột làm vỡ
                bố cục width đang cân.
              -->
              <th width="180">Jobfile / Cont</th>
              <th width="200">Loại phí</th>
              <th width="120">Nhóm phí</th>
              <th class="text-end" width="110">Đơn giá</th>
              <th width="90">Loại tiền</th>
              <th class="text-end" width="60">SL</th>
              <th width="100">Đơn vị tính</th>
              <th class="text-end" width="60">%VAT</th>
              <th class="text-end" width="110">Tiền VAT</th>
              <th class="text-end" width="120">Trước VAT</th>
              <th class="text-end" width="120">Sau VAT</th>
              <th class="text-end" width="120">Quy đổi VND</th>
              <th width="120">Ghi chú</th>
              <th class="text-center" width="40"></th>
            </tr>
          </thead>
          <tbody id="chi-tiet-body"></tbody>
        </table>
      </div>

    </div>

    <!-- ============ Sidebar phải 25% ============ -->
    <div class="crm-dntt-ws-sidebar">

      <div class="dntt-sidebar-toolbar d-flex align-items-center justify-content-between border-bottom flex-shrink-0">
        <span class="dntt-sidebar-title small fw-semibold text-muted">Chi tiết DNTT</span>
        <button type="button"
                class="btn btn-icon btn-label-secondary"
                id="dntt-sidebar-toggle"
                aria-label="Thu gọn sidebar"
                aria-expanded="true"
                title="Thu gọn sidebar">
          <i class="ti tabler-layout-sidebar-right-collapse"></i>
        </button>
      </div>

      <!-- Tabs -->
      <div class="d-flex border-bottom flex-shrink-0" id="dntt-sidebar-tabs">
        <div class="sidebar-tab active px-3 py-2 fw-medium cursor-pointer d-flex align-items-center gap-1" data-tab="tong-hop" title="Tổng hợp">
          <i class="ti tabler-file-description fs-5"></i> <span class="sidebar-tab-label">Tổng hợp</span>
        </div>
        <div class="sidebar-tab px-3 py-2 fw-medium cursor-pointer d-flex align-items-center gap-1" data-tab="lo-hang" title="Lô hàng">
          <i class="ti tabler-package fs-5"></i> <span class="sidebar-tab-label">Lô hàng</span>
          <span class="badge bg-label-secondary ms-1" id="dntt-lo-hang-count">0</span>
        </div>
        <div class="sidebar-tab px-3 py-2 fw-medium cursor-pointer d-flex align-items-center gap-1" data-tab="lich-su" title="Lịch sử">
          <i class="ti tabler-history fs-5"></i> <span class="sidebar-tab-label">Lịch sử</span>
        </div>
        <div class="sidebar-tab px-3 py-2 fw-medium cursor-pointer d-flex align-items-center gap-1" data-tab="chung-tu" title="Chứng từ">
          <i class="ti tabler-paperclip fs-5"></i> <span class="sidebar-tab-label">Chứng từ</span>
        </div>
      </div>

      <!-- Tab body -->
      <div class="flex-grow-1 overflow-y-auto">

        <!-- Tab: Tổng hợp (dữ liệu thật) -->
        <div class="sidebar-panel" id="dntt-panel-tong-hop" style="display:block;">
          <div id="dntt-summary-wrap" class="p-3">
            <div class="text-muted small">Lưu DNTT để xem tổng hợp.</div>
          </div>
        </div>

        <!-- Tab: Lô hàng liên quan (dữ liệu thật) -->
        <div class="sidebar-panel" id="dntt-panel-lo-hang" style="display:none;">
          <div id="dntt-lo-hang-wrap">
            <div class="p-3 text-muted small">Chưa có dòng chi phí.</div>
          </div>
        </div>

        <!-- Tab: Lịch sử (mockup) -->
        <div class="sidebar-panel" id="dntt-panel-lich-su" style="display:none;">
          <div class="p-3">
            <div class="alert alert-label-secondary py-2 px-3 small mb-3">
              <i class="ti tabler-info-circle me-1"></i>Dữ liệu mẫu — lịch sử thao tác sẽ kết nối sau.
            </div>
            <div class="d-flex gap-2 pb-3 border-bottom">
              <span class="d-inline-block rounded-circle mt-1 flex-shrink-0" style="width:8px;height:8px;background:#7367f0;"></span>
              <div>
                <div class="small"><span class="fw-semibold">Nguyễn Văn A</span> tạo mới DNTT</div>
                <div class="text-muted" style="font-size:11px;">16/05/2026 14:30</div>
              </div>
            </div>
            <div class="d-flex gap-2 py-3 border-bottom">
              <span class="d-inline-block rounded-circle mt-1 flex-shrink-0" style="width:8px;height:8px;background:#28c76f;"></span>
              <div>
                <div class="small"><span class="fw-semibold">Trần Thị B</span> duyệt DNTT</div>
                <div class="text-muted" style="font-size:11px;">16/05/2026 15:00</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab: Chứng từ (mockup) -->
        <div class="sidebar-panel" id="dntt-panel-chung-tu" style="display:none;">
          <div class="p-3 d-flex flex-column gap-2">
            <div class="alert alert-label-secondary py-2 px-3 small mb-1">
              <i class="ti tabler-info-circle me-1"></i>Dữ liệu mẫu — chứng từ thật sẽ kết nối sau.
            </div>
            <div class="d-flex align-items-center gap-2 p-2 border rounded">
              <i class="ti tabler-file-type-pdf text-danger" style="font-size:22px;"></i>
              <div class="flex-grow-1 min-w-0">
                <div class="small fw-medium text-truncate">Invoice_052026.pdf</div>
                <div class="text-muted" style="font-size:11px;">245 KB · 16/05/2026</div>
              </div>
              <i class="ti tabler-download text-primary cursor-pointer"></i>
            </div>
            <div class="d-flex align-items-center justify-content-center gap-2 p-3 border border-dashed rounded text-muted small">
              <i class="ti tabler-upload"></i> Upload chứng từ (tính năng sắp có)
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>

  <!-- ============ Sticky bar đáy: summary + actions ============ -->
  <div class="crm-dntt-ws-stickybar" id="dntt-sticky-bar">
    <div class="crm-dntt-sticky-summary">
      <div class="sticky-meta">
        <span id="sticky-so-dntt" class="fw-semibold"><?php echo $is_new ? 'DNTT mới' : ''; ?></span>
        <span id="sticky-badges" class="ms-2"></span>
        <span class="text-muted ms-2"><i class="ti tabler-list-numbers me-1"></i><span id="sticky-so-dong">0</span> dòng</span>
      </div>
    </div>
    <div class="crm-dntt-sticky-total text-end">
      <div class="text-muted text-uppercase" style="font-size:11px;letter-spacing:.3px;">Tổng quy đổi VND</div>
      <div class="fw-bold text-primary fs-4" id="dntt-tong-tien">0</div>
    </div>
    <div class="crm-dntt-sticky-actions d-flex align-items-center gap-2" id="action-bar">
      <a href="/quan-ly/dntt" class="btn btn-label-secondary btn-sm">
        <i class="bx bx-arrow-back me-1"></i>Quay lại
      </a>
      <span id="action-buttons" class="d-flex align-items-center gap-2"></span>
    </div>
  </div>

</div>

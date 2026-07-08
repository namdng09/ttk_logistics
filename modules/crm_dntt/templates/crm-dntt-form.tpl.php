<?php
/**
 * @file
 * Template: DNTT form (create/edit).
 * Variables: $dntt_id, $is_new, $trang_thai, $is_editable
 */
$is_new = empty($dntt_id);
?>
<div class="container-fluid crm-dntt-form">

  <!-- Breadcrumb -->
  <div class="d-flex align-items-center mb-3">
    <a href="/quan-ly/dntt" class="text-muted me-2"><i class="bx bx-arrow-back"></i></a>
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb mb-0">
        <li class="breadcrumb-item"><a href="/quan-ly/dntt">DNTT</a></li>
        <li class="breadcrumb-item active"><?php echo $is_new ? 'Tạo mới' : 'Chi tiết'; ?></li>
      </ol>
    </nav>
  </div>

  <!-- Card 1: Header -->
  <div class="card mb-3">
    <div class="card-header d-flex align-items-center justify-content-between">
      <h5 class="mb-0"><i class="bx bx-receipt me-2 text-primary"></i>Thông tin DNTT</h5>
      <div id="dntt-status-badges">
        <?php if (!$is_new): ?>
          <span id="badge-loai-dntt" class="badge bg-label-primary me-1"></span>
          <span id="badge-trang-thai"></span>
          <span id="dntt-hoan-ve-links" class="ms-2"></span>
        <?php endif; ?>
      </div>
    </div>
    <div class="card-body">
      <input type="hidden" id="dntt-id" value="<?php echo $is_new ? '' : (int)$dntt_id; ?>">

      <input type="hidden" id="dntt-so-dntt">

      <!-- Row: Đối tác -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <label class="form-label">Bên phát hành <span class="text-danger">*</span></label>
          <select id="dntt-ben-phat-hanh" class="w-100"></select>
          <div class="form-check mt-2">
            <input class="form-check-input" type="checkbox" id="dntt-same-doi-tac" checked>
            <label class="form-check-label" for="dntt-same-doi-tac">Đối tác nhận tiền trùng Bên phát hành</label>
          </div>
        </div>
        <div class="col-md-4 d-none" id="row-doi-tac-nhan-tien">
          <label class="form-label">Đối tác nhận tiền <span class="text-danger">*</span></label>
          <select id="dntt-doi-tac-nhan-tien" class="w-100"></select>
        </div>

      </div>

      <!-- Row: Hóa đơn -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <label class="form-label">Số hóa đơn</label>
          <div class="input-group">
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
          <label class="form-label">Ngày hóa đơn</label>
          <input type="text" class="form-control" id="dntt-ngay-hoa-don" placeholder="Chọn ngày...">
        </div>
        <div class="col-md-4">
          <label class="form-label">Hạn thanh toán</label>
          <input type="text" class="form-control" id="dntt-han-thanh-toan" placeholder="Chọn ngày...">
        </div>
      </div>

      <!-- Row: Thanh toán -->
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <label class="form-label">Hình thức TT</label>
          <select class="form-select" id="dntt-hinh-thuc-tt">
            <option value="CK">Chuyển khoản (CK)</option>
            <option value="TM">Tiền mặt (TM)</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Loại tiền</label>
          <select class="form-select" id="dntt-loai-tien">
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div class="col-md-4" id="dntt-ti-gia-wrap" style="display:none;">
          <label class="form-label">Tỉ giá</label>
          <input type="number" class="form-control" id="dntt-ti-gia" value="1" step="0.01" min="0">
        </div>
      </div>
    </div>
  </div>

  <!-- Card 2: Chi tiết -->
  <div class="card mb-5">
    <div class="card-header d-flex align-items-center justify-content-between">
      <h5 class="mb-0"><i class="bx bx-list-ul me-2 text-primary"></i>Chi tiết chi phí</h5>
      <button type="button" class="btn btn-sm btn-primary" id="btn-add-row" title="Thêm dòng">
        <i class="bx bx-plus me-1"></i>Thêm dòng
      </button>
    </div>
    <div class="card-body p-0">
      <div class="table-responsive">
        <table class="table table-bordered table-sm mb-0 crm-dntt-detail-table" id="table-chi-tiet">
          <thead class="table-white">
            <tr class="text-uppercase text-nowrap">
              <th class="text-center" width="40">#</th>
              <th width="180">Jobfile</th>
              <th width="200">Loại phí</th>
              <th width="120">Nhóm phí</th>
              <th class="text-end" width="110">Đơn giá</th>
              <th class="text-end" width="60">SL</th>
              <th width="100">Đơn vị tính</th>
              <th class="text-end" width="60">%VAT</th>
              <th class="text-end" width="110">Tiền VAT</th>
              <th class="text-end" width="120">Trước VAT</th>
              <th class="text-end" width="120">Sau VAT</th>
              <th width="120">Ghi chú</th>
              <th class="text-center" width="40"></th>
            </tr>
          </thead>
          <tbody id="chi-tiet-body"></tbody>
          <tfoot>
            <tr>
              <td colspan="9"></td>
              <td class="text-end fw-semibold py-3">Tổng tiền DNTT:</td>
              <td class="text-end fw-bold text-primary fs-5 py-3" id="dntt-tong-tien">0</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
    <div class="card-footer d-flex align-items-center justify-content-between mt-5" id="action-bar">
      <div>
        <a href="/quan-ly/dntt" class="btn btn-label-secondary">
          <i class="bx bx-arrow-back me-1"></i>Quay lại
        </a>
      </div>
      <div class="d-flex align-items-center gap-2" id="action-buttons"></div>
    </div>
  </div>

</div>


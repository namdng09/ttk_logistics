<?php
/**
 * @file
 * Modal Tạo / Sửa phiếu trả khách hàng — dùng chung cho /phieu-tra-khach-hang và /ke-hoach-xep-xe
 * (nạp bằng phieu_tra_khach_hang_modal_markup()). Bố cục theo modal "Tạo đề nghị thanh toán".
 * JS: assets/js/phieu_tra_khach_hang_modal.js (window.PtkhModal).
 */
?>
<div class="modal fade" id="ptkh-m-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" style="max-width:1320px;">
    <div class="modal-content">
      <div class="modal-header">
        <div class="d-flex align-items-center gap-2">
          <h5 class="modal-title mb-0" id="ptkh-m-title">Tạo phiếu trả khách hàng</h5>
          <span class="badge bg-label-secondary border d-none" id="ptkh-m-ma"></span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" style="position:relative;max-height:78vh;overflow-y:auto;overflow-x:hidden;">
        <div class="ptkh-m-loading" id="ptkh-m-loading"><div class="spinner-border text-primary" role="status"></div></div>
        <div class="alert alert-primary py-2 mb-3" id="ptkh-m-hint">Chọn <strong>khách hàng</strong> trước — hệ thống liệt kê các kế hoạch đã hoàn thành của khách hàng này mà chưa nằm trong phiếu trả nào.</div>
        <div class="row g-3 mb-2">
          <div class="col-md-4">
            <label class="form-label" for="ptkh-m-customer">Khách hàng <span class="text-danger">*</span></label>
            <select class="form-select" id="ptkh-m-customer"><option value="">Chọn khách hàng…</option></select>
            <div class="invalid-feedback" id="ptkh-m-customer-error">Vui lòng chọn khách hàng.</div>
          </div>
          <div class="col-md-3">
            <label class="form-label" for="ptkh-m-q">Số cont / Số BKG</label>
            <input type="text" class="form-control" id="ptkh-m-q" placeholder="Gõ để lọc">
          </div>
          <div class="col-md-3">
            <label class="form-label" for="ptkh-m-daterange">Ngày kế hoạch</label>
            <input type="text" class="form-control" id="ptkh-m-daterange" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
          </div>
        </div>
        <div id="ptkh-m-empty" class="text-muted small">Chọn khách hàng để hiện các kế hoạch khả dụng.</div>
        <div class="table-responsive d-none" id="ptkh-m-table-wrap">
          <table class="table table-sm table-bordered ptkh-m-lines mb-0">
            <thead><tr>
              <th class="text-center" style="width:4%;"><input type="checkbox" class="form-check-input" id="ptkh-m-check-all" title="Chọn tất cả"></th>
              <th style="width:9%;">Ngày KH</th>
              <th style="width:12%;">Số BKG</th>
              <th style="width:12%;">Số cont</th>
              <th style="width:7%;">Loại cont</th>
              <th style="width:26%;">Tuyến</th>
              <th class="text-end" style="width:10%;">Doanh thu</th>
              <th class="text-end" style="width:10%;">Chi hộ KH</th>
              <th class="text-end" style="width:10%;">Tổng</th>
            </tr></thead>
            <tbody id="ptkh-m-lines"></tbody>
            <tfoot><tr class="table-light">
              <td colspan="6" class="text-end fw-semibold">Đã chọn <span id="ptkh-m-count">0</span> kế hoạch · Tổng</td>
              <td class="text-end fw-semibold" id="ptkh-m-sum-dt">0</td>
              <td class="text-end fw-semibold" id="ptkh-m-sum-ch">0</td>
              <td class="text-end fw-semibold" id="ptkh-m-total">0 đ</td>
            </tr></tfoot>
          </table>
        </div>
        <div class="row g-3 mt-1">
          <div class="col-12">
            <label class="form-label" for="ptkh-m-note">Ghi chú</label>
            <input type="text" class="form-control" id="ptkh-m-note" placeholder="Ghi chú thêm (nếu có)">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" id="ptkh-m-save"><i class="ti tabler-device-floppy me-1"></i>Tạo phiếu</button>
      </div>
    </div>
  </div>
</div>

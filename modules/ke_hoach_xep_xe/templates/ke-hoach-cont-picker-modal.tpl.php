<?php
/**
 * Partial tạo kế hoạch/cont kéo về — dùng chung cho modal edit và create.
 * Truyền biến $id_prefix (mặc định '') để phân biệt id giữa các bản copy
 * cùng tồn tại trên 1 trang (VD: 'port-' cho modal create hàng cảng).
 */
$id_prefix = isset($id_prefix) ? (string) $id_prefix : '';
$modal_id = $id_prefix . 'cont-ref-picker-modal';
$wrap_id = $id_prefix . 'cont-ref-picker-wrap';
$confirm_id = $id_prefix . 'cont-ref-picker-confirm-btn';
?>
<div class="modal fade" id="<?php print $modal_id; ?>" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0">Chọn cont kéo về</h5>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
      </div>
      <div class="modal-body">
        <div class="line-cont-picker-wrap" id="<?php print $wrap_id; ?>" data-line-key="">
          <div class="row line-cont-filter-row mb-2">
            <div class="col-md-3"><input type="text" class="form-control line-cont-filter-cont" placeholder="Tìm theo số Cont"></div>
            <div class="col-md-3"><input type="text" class="form-control line-cont-filter-bkg" placeholder="Tìm theo số BKG"></div>
            <div class="col-md-4"><select class="form-select line-cont-filter-kho"><option></option></select></div>
            <div class="col-md-2"><select class="form-select line-cont-filter-du-hang"><option value="">Trạng thái</option><option value="1">Đã đủ</option><option value="0">Chưa đủ</option></select></div>
          </div>
          <div class="cont-picker-list-head"><span></span><span>Cont / Booking</span><span>Kho</span><span>Bãi hạ</span><span>Seal</span><span class="cont-picker-port-requirements-head">Yêu cầu</span><span>T.Thái</span><span>Ghi chú</span></div>
          <div class="line-cont-picker-body line-cont-picker-list"><div class="text-center text-muted py-4">Chưa có dữ liệu</div></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
        <button type="button" class="btn btn-primary" id="<?php print $confirm_id; ?>"><i class="ti tabler-check me-1"></i>Chọn cont</button>
      </div>
    </div>
  </div>
</div>

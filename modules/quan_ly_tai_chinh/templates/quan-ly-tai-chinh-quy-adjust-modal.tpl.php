<div class="qltc-modal-content" data-qltc-form-key="quy-adjust">
  <form id="qltc-quy-adjust-form" class="qltc-quy-adjust-form qltc-module-form qltc-bootstrap-form" method="post" data-action="<?php print check_plain(url('quan-ly-quy/ajax-adjust-save')); ?>">
    <input type="hidden" name="quy_id" value="<?php print intval($quy->quy_id); ?>">
    <input type="hidden" name="so_du_cu" value="<?php print check_plain(quan_ly_tai_chinh_format_money($old_balance)); ?>">

    <div class="alert alert-info py-2 mb-3"><strong>Lưu ý:</strong> Điều chỉnh số dư đầu kỳ không tạo phiếu thu/chi. Hệ thống sẽ lưu lịch sử điều chỉnh trong field_thong_tin_json để đối soát.</div>

    <div class="row g-3 align-items-end">
      <div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Mã quỹ</label><input type="text" class="form-control form-control-sm bg-light" value="<?php print check_plain($quy->ma_quy); ?>" readonly></div>
      <div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Tên quỹ</label><input type="text" class="form-control form-control-sm bg-light" value="<?php print check_plain($quy->ten_quy); ?>" readonly></div>
      <div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Số dư đầu kỳ hiện tại</label><input type="text" class="form-control form-control-sm text-end bg-light" value="<?php print check_plain(quan_ly_tai_chinh_format_money($old_balance)); ?>" readonly></div>
    </div>

    <div class="row g-3 align-items-end mt-1">
      <div class="col-12 col-md"><label class="form-label fw-semibold mb-1" for="qltc_so_du_moi">Số dư đầu kỳ mới <span class="text-danger">*</span></label><input type="text" inputmode="numeric" class="form-control form-control-sm text-end qltc-money-input qltc-adjust-new-balance" id="qltc_so_du_moi" name="so_du_moi" value="<?php print check_plain(quan_ly_tai_chinh_format_money($old_balance)); ?>" required></div>
      <div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Chênh lệch</label><input type="text" class="form-control form-control-sm text-end bg-light qltc-adjust-diff" value="0" readonly></div>
      <div class="col-12 col-md"><label class="form-label fw-semibold mb-1" for="qltc_ngay_dieu_chinh">Ngày điều chỉnh</label><input type="text" class="form-control form-control-sm qltc-flatpickr-date" id="qltc_ngay_dieu_chinh" name="ngay_dieu_chinh" value="<?php print check_plain(date('d/m/Y')); ?>" autocomplete="off" data-flatpickr-month-select="dropdown"></div>
    </div>

    <div class="row g-3 mt-2">
      <div class="col-12"><label class="form-label fw-semibold mb-1" for="qltc_ly_do_dieu_chinh">Lý do điều chỉnh <span class="text-danger">*</span></label><textarea class="form-control form-control-sm" id="qltc_ly_do_dieu_chinh" name="ly_do" rows="3" placeholder="VD: Cập nhật số dư theo sao kê ngân hàng" required></textarea></div>
    </div>

    <div class="qltc-form-alert mt-3 d-none"></div>
    <div class="d-flex justify-content-end gap-2 mt-4 pt-2">
      <button type="button" class="btn btn-label-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
      <button type="submit" class="btn btn-warning btn-sm qltc-btn-save-adjust"><span class="spinner-border spinner-border-sm me-1 d-none qltc-btn-spinner" role="status" aria-hidden="true"></span><span class="qltc-btn-text"><i class="icon-base ti tabler-adjustments-dollar me-1"></i>Lưu điều chỉnh</span></button>
    </div>
  </form>
</div>

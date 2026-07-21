<?php $quy_id = $quy ? intval($quy->quy_id) : 0; ?>
<?php $selected_loai = $quy ? $quy->loai_quy : 'tien_mat'; ?>
<?php $so_du_attrs = $quy_id ? ' readonly disabled data-qltc-locked="1" title="Số dư đầu kỳ chỉ được nhập khi tạo quỹ mới"' : ''; ?>
<?php $so_du_class = $quy_id ? ' bg-light' : ''; ?>
<div class="qltc-modal-content" data-qltc-form-key="quy">
  <form id="qltc-quy-form" class="qltc-quy-form qltc-module-form qltc-bootstrap-form" method="post" data-action="<?php print check_plain(url('quan-ly-quy/ajax-save')); ?>">
    <input type="hidden" name="quy_id" value="<?php print $quy_id; ?>">

    <div class="row g-3 qltc-quy-field-row">
      <div class="col-12 col-md-2"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_ma_quy">Mã quỹ <span class="text-danger">*</span></label><input type="text" class="form-control form-control-sm" id="qltc_ma_quy" name="ma_quy" value="<?php print check_plain($quy ? $quy->ma_quy : ''); ?>" placeholder="VD: TM01" required></div></div></div>
      <div class="col-12 col-md-4"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_ten_quy">Tên quỹ <span class="text-danger">*</span></label><input type="text" class="form-control form-control-sm" id="qltc_ten_quy" name="ten_quy" value="<?php print check_plain($quy ? $quy->ten_quy : ''); ?>" placeholder="VD: Tiền mặt công ty" required></div></div></div>
      <div class="col-12 col-md-3"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_loai_quy">Loại quỹ</label><select class="form-select form-select-sm" id="qltc_loai_quy" name="loai_quy"><?php foreach ($loai_options as $key => $label): ?><option value="<?php print check_plain($key); ?>"<?php print $selected_loai == $key ? ' selected' : ''; ?>><?php print check_plain($label); ?></option><?php endforeach; ?></select></div></div></div>
      <div class="col-12 col-md-3"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_so_du_dau_ky">Số dư đầu kỳ</label><input type="text" inputmode="numeric" class="form-control form-control-sm text-end qltc-money-input<?php print $so_du_class; ?>" id="qltc_so_du_dau_ky" name="so_du_dau_ky" value="<?php print check_plain($quy ? quan_ly_tai_chinh_format_money($quy->so_du_dau_ky) : '0'); ?>" placeholder="0"<?php print $so_du_attrs; ?>><?php if ($quy_id): ?><div class="form-text small text-muted">Không cho sửa số dư đầu kỳ sau khi tạo quỹ.</div><?php endif; ?></div></div></div>
    </div>

    <div class="row g-3 mt-2 qltc-quy-note-row">
      <div class="col-12"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_ghi_chu">Ghi chú</label><textarea class="form-control form-control-sm" id="qltc_ghi_chu" name="ghi_chu" rows="3" placeholder="Nhập ghi chú nếu có"><?php print check_plain($quy ? $quy->ghi_chu : ''); ?></textarea></div></div></div>
    </div>

    <div class="qltc-form-alert mt-3 d-none"></div>
    <div class="qltc-modal-actions d-flex justify-content-end gap-2 mt-4 pt-2">
      <button type="button" class="btn btn-label-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
      <button type="submit" class="btn btn-primary btn-sm qltc-btn-save-quy"><span class="spinner-border spinner-border-sm me-1 d-none qltc-btn-spinner" role="status" aria-hidden="true"></span><span class="qltc-btn-text"><i class="icon-base ti tabler-device-floppy me-1"></i><?php print $quy_id ? 'Cập nhật quỹ' : 'Lưu quỹ'; ?></span></button>
    </div>
  </form>
</div>

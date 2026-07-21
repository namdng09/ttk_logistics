<div class="qltc-modal-content qltc-quy-detail" data-qltc-form-key="quy-detail">
  <div class="row g-3 mb-3">
    <div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Mã quỹ</div><div class="fw-semibold"><?php print check_plain($quy->ma_quy); ?></div></div></div></div>
    <div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Tên quỹ</div><div class="fw-semibold"><?php print check_plain($quy->ten_quy); ?></div></div></div></div>
    <div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Loại quỹ</div><div class="fw-semibold"><?php print check_plain(quan_ly_tai_chinh_loai_quy_label($quy->loai_quy)); ?></div></div></div></div>
    <div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Trạng thái</div><span class="badge bg-label-success">Đang hoạt động</span></div></div></div>
  </div>

  <div class="row g-3 mb-3">
    <div class="col-12 col-md-4"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Số dư đầu kỳ</div><div class="h5 mb-0 text-primary"><?php print check_plain(quan_ly_tai_chinh_format_money($quy->so_du_dau_ky)); ?></div></div></div></div>
    <div class="col-12 col-md-4"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Số dư hiện tại</div><div class="h5 mb-0 text-success"><?php print check_plain(quan_ly_tai_chinh_format_money($quy->so_du_hien_tai)); ?></div></div></div></div>
    <div class="col-12 col-md-4"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Cập nhật gần nhất</div><div class="fw-semibold"><?php print check_plain(!empty($quy->changed) ? date('d/m/Y H:i', intval($quy->changed)) : '-'); ?></div></div></div></div>
  </div>

  <?php if (!empty($quy->ghi_chu)): ?>
    <div class="alert alert-secondary py-2 mb-3"><strong>Ghi chú:</strong> <?php print check_plain($quy->ghi_chu); ?></div>
  <?php endif; ?>

  <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
    <h6 class="mb-0 fw-semibold"><i class="icon-base ti tabler-history me-1"></i>Lịch sử điều chỉnh số dư đầu kỳ</h6>
  </div>
  <?php print $history_html; ?>
  <?php print $so_cai_html; ?>

  <div class="d-flex justify-content-end mt-3">
    <button type="button" class="btn btn-label-secondary btn-sm" data-bs-dismiss="modal">Đóng</button>
  </div>
</div>

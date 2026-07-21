<div class="tc-detail-view">
  <div class="row g-3 mb-3">
    <?php print thu_chi_detail_info_col('Mã phiếu', $gd->ma_giao_dich, 'col-md-3'); ?>
    <?php print thu_chi_detail_info_col('Trạng thái', strip_tags(thu_chi_duyet_badge($gd->duyet_status)), 'col-md-3'); ?>
    <?php print thu_chi_detail_info_col('Loại phiếu', thu_chi_loai_label($gd->loai_phieu), 'col-md-3'); ?>
    <?php print thu_chi_detail_info_col('Ngày phiếu', format_date($gd->ngay_giao_dich, 'custom', 'd/m/Y'), 'col-md-3'); ?>
    <?php print thu_chi_detail_info_col('Người đề xuất', thu_chi_user_label_by_uid($gd->nguoi_de_xuat_uid) ?: '-', 'col-md-6'); ?>
    <?php print thu_chi_detail_info_col('Phân loại', $phan_loai ?: '-', 'col-md-6'); ?>
    <?php print thu_chi_detail_info_col('Quỹ', $quy_text, 'col-md-6'); ?>
    <?php print thu_chi_detail_info_col('Đối tượng', $object_text ?: '-', 'col-md-12'); ?>
  </div>

  <div class="table-responsive mb-3"><table class="table table-bordered align-middle tc-detail-table"><thead><tr><th>Nội dung</th><th class="text-end">Đơn giá</th><th class="text-end">Số lượng</th><th>ĐVT</th><th class="text-end">Tổng tiền</th><th class="text-end">VAT (%)</th><th class="text-end">Thành tiền</th></tr></thead><tbody><?php print $detail_rows_html; ?></tbody><tfoot><tr><th colspan="6" class="text-end">Tổng tiền phiếu</th><th class="text-end"><?php print thu_chi_format_money($gd->so_tien); ?></th></tr></tfoot></table></div>

  <?php print $advance_html; ?>
  <?php print $salary_payment_html; ?>

  <div class="card border"><div class="card-header py-2"><strong>Lịch sử trạng thái phiếu</strong></div><div class="card-body p-0"><div class="table-responsive"><table class="table table-bordered mb-0 align-middle"><thead><tr><th>Thời gian</th><th>Từ trạng thái</th><th>Đến trạng thái</th><th>Người cập nhật</th><th>Ghi chú</th></tr></thead><tbody><?php print $history_rows_html; ?></tbody></table></div></div></div>
</div>

<?php $render_mode = isset($render_mode) ? $render_mode : 'page'; ?>
<?php $filters = isset($filters) ? $filters : array('from_date' => '', 'to_date' => ''); ?>
<?php $table_items = isset($table_items) ? $table_items : array(); ?>

<?php if ($render_mode === 'detail'): ?>
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
    <?php if (!empty($quy->ghi_chu)): ?><div class="alert alert-secondary py-2 mb-3"><strong>Ghi chú:</strong> <?php print check_plain($quy->ghi_chu); ?></div><?php endif; ?>
    <div class="d-flex align-items-center justify-content-between gap-2 mb-2"><h6 class="mb-0 fw-semibold"><i class="icon-base ti tabler-history me-1"></i>Lịch sử điều chỉnh số dư đầu kỳ</h6></div>
    <?php print $history_html; ?>
    <?php print $so_cai_html; ?>
    <div class="d-flex justify-content-end mt-3"><button type="button" class="btn btn-label-secondary btn-sm" data-bs-dismiss="modal">Đóng</button></div>
  </div>
<?php elseif ($render_mode === 'form'): ?>
  <?php $nid_quy = $quy ? intval($quy->nid_quy) : 0; $selected_loai = $quy ? $quy->loai_quy : 'tien_mat'; $so_du_attrs = $nid_quy ? ' readonly disabled data-qltc-locked="1" title="Số dư đầu kỳ chỉ được nhập khi tạo quỹ mới"' : ''; $so_du_class = $nid_quy ? ' bg-light' : ''; ?>
  <div class="qltc-modal-content" data-qltc-form-key="quy">
    <form id="qltc-quy-form" class="qltc-quy-form qltc-module-form qltc-bootstrap-form" method="post" data-action="<?php print check_plain(url('quan-ly-quy/ajax-save')); ?>">
      <input type="hidden" name="nid_quy" value="<?php print $nid_quy; ?>">
      <div class="row g-3 qltc-quy-field-row">
        <div class="col-12 col-md-2"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_ma_quy">Mã quỹ <span class="text-danger">*</span></label><input type="text" class="form-control form-control-sm" id="qltc_ma_quy" name="ma_quy" value="<?php print check_plain($quy ? $quy->ma_quy : ''); ?>" placeholder="VD: TM01" required></div></div></div>
        <div class="col-12 col-md-4"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_ten_quy">Tên quỹ <span class="text-danger">*</span></label><input type="text" class="form-control form-control-sm" id="qltc_ten_quy" name="ten_quy" value="<?php print check_plain($quy ? $quy->ten_quy : ''); ?>" placeholder="VD: Tiền mặt công ty" required></div></div></div>
        <div class="col-12 col-md-3"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_loai_quy">Loại quỹ</label><select class="form-select form-select-sm" id="qltc_loai_quy" name="loai_quy"><?php foreach ($loai_options as $key => $label): ?><option value="<?php print check_plain($key); ?>"<?php print $selected_loai == $key ? ' selected' : ''; ?>><?php print check_plain($label); ?></option><?php endforeach; ?></select></div></div></div>
        <div class="col-12 col-md-3"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_so_du_dau_ky">Số dư đầu kỳ</label><input type="text" inputmode="numeric" class="form-control form-control-sm text-end qltc-money-input<?php print $so_du_class; ?>" id="qltc_so_du_dau_ky" name="so_du_dau_ky" value="<?php print check_plain($quy ? quan_ly_tai_chinh_format_money($quy->so_du_dau_ky) : '0'); ?>" placeholder="0"<?php print $so_du_attrs; ?>><?php if ($nid_quy): ?><div class="form-text small text-muted">Không cho sửa số dư đầu kỳ sau khi tạo quỹ.</div><?php endif; ?></div></div></div>
      </div>
      <div class="row g-3 mt-2 qltc-quy-note-row"><div class="col-12"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold" for="qltc_ghi_chu">Ghi chú</label><textarea class="form-control form-control-sm" id="qltc_ghi_chu" name="ghi_chu" rows="3" placeholder="Nhập ghi chú nếu có"><?php print check_plain($quy ? $quy->ghi_chu : ''); ?></textarea></div></div></div></div>
      <div class="qltc-form-alert mt-3 d-none"></div>
      <div class="qltc-modal-actions d-flex justify-content-end gap-2 mt-4 pt-2"><button type="button" class="btn btn-label-secondary btn-sm" data-bs-dismiss="modal">Đóng</button><button type="submit" class="btn btn-primary btn-sm qltc-btn-save-quy"><span class="spinner-border spinner-border-sm me-1 d-none qltc-btn-spinner" role="status" aria-hidden="true"></span><span class="qltc-btn-text"><i class="icon-base ti tabler-device-floppy me-1"></i><?php print $nid_quy ? 'Cập nhật quỹ' : 'Lưu quỹ'; ?></span></button></div>
    </form>
  </div>
<?php elseif ($render_mode === 'adjust'): ?>
  <div class="qltc-modal-content" data-qltc-form-key="quy-adjust"><form id="qltc-quy-adjust-form" class="qltc-quy-adjust-form qltc-module-form qltc-bootstrap-form" method="post" data-action="<?php print check_plain(url('quan-ly-quy/ajax-adjust-save')); ?>"><input type="hidden" name="nid_quy" value="<?php print intval($quy->nid_quy); ?>"><input type="hidden" name="so_du_cu" value="<?php print check_plain(quan_ly_tai_chinh_format_money($old_balance)); ?>"><div class="alert alert-info py-2 mb-3"><strong>Lưu ý:</strong> Điều chỉnh số dư đầu kỳ không tạo phiếu thu/chi. Hệ thống sẽ lưu lịch sử điều chỉnh trong field_thong_tin_json để đối soát.</div><div class="row g-3 align-items-end"><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Mã quỹ</label><input type="text" class="form-control form-control-sm bg-light" value="<?php print check_plain($quy->ma_quy); ?>" readonly></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Tên quỹ</label><input type="text" class="form-control form-control-sm bg-light" value="<?php print check_plain($quy->ten_quy); ?>" readonly></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Số dư đầu kỳ hiện tại</label><input type="text" class="form-control form-control-sm text-end bg-light" value="<?php print check_plain(quan_ly_tai_chinh_format_money($old_balance)); ?>" readonly></div></div><div class="row g-3 align-items-end mt-1"><div class="col-12 col-md"><label class="form-label fw-semibold mb-1" for="qltc_so_du_moi">Số dư đầu kỳ mới <span class="text-danger">*</span></label><input type="text" inputmode="numeric" class="form-control form-control-sm text-end qltc-money-input qltc-adjust-new-balance" id="qltc_so_du_moi" name="so_du_moi" value="<?php print check_plain(quan_ly_tai_chinh_format_money($old_balance)); ?>" required></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Chênh lệch</label><input type="text" class="form-control form-control-sm text-end bg-light qltc-adjust-diff" value="0" readonly></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1" for="qltc_ngay_dieu_chinh">Ngày điều chỉnh</label><input type="text" class="form-control form-control-sm qltc-flatpickr-date" id="qltc_ngay_dieu_chinh" name="ngay_dieu_chinh" value="<?php print check_plain(date('d/m/Y')); ?>" autocomplete="off" data-flatpickr-month-select="dropdown"></div></div><div class="row g-3 mt-2"><div class="col-12"><label class="form-label fw-semibold mb-1" for="qltc_ly_do_dieu_chinh">Lý do điều chỉnh <span class="text-danger">*</span></label><textarea class="form-control form-control-sm" id="qltc_ly_do_dieu_chinh" name="ly_do" rows="3" placeholder="VD: Cập nhật số dư theo sao kê ngân hàng" required></textarea></div></div><div class="qltc-form-alert mt-3 d-none"></div><div class="d-flex justify-content-end gap-2 mt-4 pt-2"><button type="button" class="btn btn-label-secondary btn-sm" data-bs-dismiss="modal">Đóng</button><button type="submit" class="btn btn-warning btn-sm qltc-btn-save-adjust"><span class="spinner-border spinner-border-sm me-1 d-none qltc-btn-spinner" role="status" aria-hidden="true"></span><span class="qltc-btn-text"><i class="icon-base ti tabler-adjustments-dollar me-1"></i>Lưu điều chỉnh</span></button></div></form></div>
<?php else: ?>
  <div class="qltc-page qltc-page-quy qltc-ajax-region" data-refresh-type="quy">
    <div class="card">
      <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
        <h4 class="card-title mb-0">Quản lý quỹ</h4>
      </div>
      <div class="card-body">
        <div class="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3">
          <div class="d-flex flex-wrap align-items-end gap-2">
            <div>
              <label class="form-label mb-1">Từ ngày</label>
              <input type="text" name="from_date" id="qltc-filter-from-date" class="form-control qltc-flatpickr-date" value="<?php print check_plain($filters['from_date']); ?>" placeholder="dd/mm/yyyy" style="width:150px" autocomplete="off">
            </div>
            <div>
              <label class="form-label mb-1">Đến ngày</label>
              <input type="text" name="to_date" id="qltc-filter-to-date" class="form-control qltc-flatpickr-date" value="<?php print check_plain($filters['to_date']); ?>" placeholder="dd/mm/yyyy" style="width:150px" autocomplete="off">
            </div>
            <button type="button" class="btn btn-primary waves-effect waves-light qltc-btn-filter">
              <i class="ti tabler-search me-1"></i>Lọc
            </button>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2">
            <a href="<?php print url('quan-ly-quy/them'); ?>" class="btn btn-primary waves-effect waves-light qltc-quy-open-modal" data-url="<?php print url('quan-ly-quy/ajax-form'); ?>" data-title="Thêm quỹ"><i class="ti tabler-plus me-1"></i>Thêm quỹ</a>
            <button type="button" class="btn btn-label-primary waves-effect qltc-quy-transfer-modal"><i class="ti tabler-arrows-exchange me-1"></i>Chuyển tiền nội bộ</button>
            <button type="button" class="btn btn-label-secondary qltc-btn-reload waves-effect">
              <i class="ti tabler-refresh me-1"></i>Làm mới
            </button>
          </div>
        </div>
        <div id="qltc-quy-list-wrapper" data-api-url="<?php print url('api/quan-ly-quy'); ?>">
          <div class="table-responsive">
            <table class="table table-bordered table-hover">
              <thead class="table-light">
                <tr>
                  <th style="width:60px;text-align:center !important">CN</th>
                  <th style="width:50px">#</th>
                  <th>Mã quỹ</th>
                  <th>Tên quỹ</th>
                  <th>Loại quỹ</th>
                  <th class="text-end">Đầu kỳ</th>
                  <th class="text-end">Thu</th>
                  <th class="text-end">Chi</th>
                  <th class="text-end">Chuyển đến</th>
                  <th class="text-end">Chuyển đi</th>
                  <th class="text-end">Cuối kỳ</th>
                </tr>
              </thead>
              <tbody id="qltc-quy-table-body">
                <?php if (!empty($table_items['items'])): ?>
                  <?php foreach ($table_items['items'] as $item): ?>
                    <?php $quy = $item['quy']; $period = $item['period']; ?>
                    <tr>
                      <td class="text-center">
                        <div class="dropdown qltc-function-dropdown">
                          <button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill qltc-function-btn" data-bs-toggle="dropdown" aria-expanded="false"><i class="ti tabler-dots-vertical"></i></button>
                          <ul class="dropdown-menu">
                            <li><a href="#" class="dropdown-item qltc-quy-detail-modal" data-url="<?php print check_plain(url('quan-ly-quy/ajax-detail/' . $quy->nid_quy)); ?>" data-title="Chi tiết quỹ"><i class="ti tabler-eye me-2"></i>Xem</a></li>
                            <li><a href="#" class="dropdown-item qltc-quy-open-modal" data-url="<?php print check_plain(url('quan-ly-quy/ajax-form/' . $quy->nid_quy)); ?>" data-title="Sửa quỹ"><i class="ti tabler-edit me-2"></i>Sửa</a></li>
                            <li><a href="#" class="dropdown-item qltc-quy-adjust-modal" data-url="<?php print check_plain(url('quan-ly-quy/ajax-adjust-form/' . $quy->nid_quy)); ?>" data-title="Điều chỉnh số dư đầu kỳ"><i class="ti tabler-adjustments-dollar me-2"></i>Điều chỉnh</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a href="#" class="dropdown-item text-danger qltc-quy-delete" data-url="<?php print check_plain(url('quan-ly-quy/ajax-delete/' . $quy->nid_quy)); ?>" data-title="<?php print check_plain($quy->ten_quy); ?>"><i class="ti tabler-trash me-2"></i>Xóa</a></li>
                          </ul>
                        </div>
                      </td>
                      <td class="text-center"><?php print intval($item['stt']); ?></td>
                      <td><span class="fw-semibold"><?php print check_plain($quy->ma_quy); ?></span></td>
                      <td><strong><?php print check_plain($quy->ten_quy); ?></strong><?php if (!empty($quy->ghi_chu)): ?><div class="qltc-muted"><?php print check_plain($quy->ghi_chu); ?></div><?php endif; ?></td>
                      <td><?php print check_plain(quan_ly_tai_chinh_loai_quy_label($quy->loai_quy)); ?></td>
                      <td class="text-end"><?php print quan_ly_tai_chinh_format_money($period['dau_ky']); ?></td>
                      <td class="text-end text-success"><?php print quan_ly_tai_chinh_format_money($period['thu']); ?></td>
                      <td class="text-end text-danger"><?php print quan_ly_tai_chinh_format_money($period['chi']); ?></td>
                      <td class="text-end text-success"><?php print quan_ly_tai_chinh_format_money($period['chuyen_den']); ?></td>
                      <td class="text-end text-danger"><?php print quan_ly_tai_chinh_format_money($period['chuyen_di']); ?></td>
                      <td class="text-end"><strong><?php print quan_ly_tai_chinh_format_money($period['cuoi_ky']); ?></strong></td>
                    </tr>
                  <?php endforeach; ?>
                <?php else: ?>
                  <tr><td colspan="11" class="text-center py-4 text-muted">Chưa có quỹ nào.</td></tr>
                <?php endif; ?>
              </tbody>
            </table>
          </div>
        </div>

        <?php print quan_ly_tai_chinh_quy_pagination_html($table_items); ?>
      </div>
    </div>
  </div>
</div>

<?php endif; ?>

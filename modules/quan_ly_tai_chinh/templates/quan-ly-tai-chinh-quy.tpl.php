<div class="qltc-page qltc-page-quy qltc-ajax-region" data-refresh-type="quy">
  <?php print $filter_html; ?>
  <div class="card qltc-card">
    <div class="card-body">
      <div class="qltc-title-row qltc-quy-title-row">
        <div>
          <h4 class="mb-1">Quản lý quỹ</h4>
          <div class="text-muted small">Theo dõi số dư đầu kỳ, phát sinh thu chi và số dư cuối kỳ của từng quỹ.</div>
        </div>
        <div class="qltc-toolbar qltc-actions">
          <a href="<?php print url('quan-ly-quy/them'); ?>" class="btn btn-primary btn-sm waves-effect waves-light qltc-quy-open-modal" data-url="<?php print url('quan-ly-quy/ajax-form'); ?>" data-title="Thêm quỹ">
            <i class="icon-base ti tabler-circle-plus me-1"></i> Thêm quỹ
          </a>
          <a href="<?php print url('quan-ly-quy/chuyen-tien'); ?>" class="btn btn-label-primary btn-sm waves-effect qltc-ajax-modal" data-title="Chuyển tiền nội bộ">
            <i class="icon-base ti tabler-arrows-exchange me-1"></i> Chuyển tiền nội bộ
          </a>
        </div>
      </div>

      <div id="qltc-quy-list-wrapper" data-list-url="<?php print url('quan-ly-quy/ajax-list'); ?>">
        <?php print $table_html; ?>
      </div>
    </div>
  </div>
</div>

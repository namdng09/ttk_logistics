<div class="tc-page tc-page-thu-chi tc-ajax-region" data-refresh-type="thu-chi">
  <?php print $filter_html; ?>
  <?php print $summary_html; ?>
  <div class="card tc-card">
    <div class="card-body">
      <div class="tc-title-row tc-thu-chi-title-row">
        <div>
          <h4 class="mb-1">Thu - chi</h4>
          <div class="text-muted small">Quản lý phiếu thu, phiếu chi và theo dõi các phát sinh tài chính theo quỹ.</div>
        </div>
        <div class="tc-toolbar tc-actions">
          <a href="<?php print url('thu-chi/them'); ?>" class="btn btn-primary btn-sm waves-effect waves-light tc-thu-chi-open-modal" data-url="<?php print url('thu-chi/ajax-form'); ?>" data-title="Tạo phiếu thu/chi">
            <i class="icon-base ti tabler-circle-plus me-1"></i> Tạo phiếu
          </a>
        </div>
      </div>
      <div id="tc-thu-chi-list-wrapper">
        <?php print $table_html; ?>
      </div>
    </div>
  </div>
</div>

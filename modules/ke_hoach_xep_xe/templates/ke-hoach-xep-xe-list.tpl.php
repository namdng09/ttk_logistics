<?php
$is_tuyen_xa = isset($plan_type) && $plan_type === 'tuyen_xa';
$list_title = $is_tuyen_xa ? 'Kế hoạch tuyến xa' : 'Kế hoạch hàng cảng';
$create_title = $is_tuyen_xa ? 'Tạo kế hoạch tuyến xa' : 'Tạo kế hoạch xếp xe';
$create_button_text = $is_tuyen_xa ? 'Tạo tuyến xa' : 'Tạo hàng cảng';
?>
<?php if ($is_tuyen_xa): ?>
<div class="card" id="ke-hoach-list-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title"><?php print check_plain($list_title); ?></h4>
  </div>
  <div class="card-body">
<?php else: ?>
<div id="ke-hoach-list-app" class="khxh-port-list-app">
  <div class="card khxh-port-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0"><?php print check_plain($list_title); ?></h4>
      <button type="button" class="btn btn-success waves-effect waves-light btn-open-create-ke-hoach"><i class="ti tabler-plus me-1"></i><?php print check_plain($create_button_text); ?></button>
    </div>
    <div class="card-body">
<?php endif; ?>
    <?php if ($is_tuyen_xa): ?>
      <div class="khxh-filter-bar ke-hoach-list-filter mb-3" id="ke-hoach-tuyen-xa-inline-filter">
        <div class="khxh-filter-grid">
          <div class="khxh-filter-field"><label class="form-label">Khách hàng</label><select class="form-select" id="filter-khach-hang"><option></option></select></div>
          <div class="khxh-filter-field"><label class="form-label">Địa chỉ kho</label><select class="form-select" id="filter-dia-chi-kho"><option></option></select></div>
          <div class="khxh-filter-field"><label class="form-label">Số cont</label><input type="text" class="form-control" id="filter-so-cont" placeholder="Số cont"></div>
          <div class="khxh-filter-field"><label class="form-label">Đầu kéo</label><select class="form-select" id="filter-bks-dau-keo"><option></option></select></div>
          <div class="khxh-filter-field"><label class="form-label">Mooc</label><select class="form-select" id="filter-bks-mooc"><option></option></select></div>
          <div class="khxh-filter-field"><label class="form-label">Lái xe</label><select class="form-select" id="filter-lai-xe"><option></option></select></div>
          <div class="khxh-filter-field"><label class="form-label">Đủ hàng</label><select class="form-select" id="filter-da-du-hang"><option value="">Tất cả</option><option value="1">Đã đủ hàng</option><option value="0">Chưa đủ hàng</option></select></div>
          <div class="khxh-filter-field khxh-filter-field-date"><label class="form-label">Ngày lập KH</label><div class="khxh-date-range"><input type="text" class="form-control flatpickr-date date-mask" id="filter-date-from" placeholder="dd/mm/yyyy"><span class="khxh-date-range-sep"><i class="ti tabler-arrow-right"></i></span><input type="text" class="form-control flatpickr-date date-mask" id="filter-date-to" placeholder="dd/mm/yyyy"></div></div>
          <div class="khxh-filter-actions khxh-filter-actions-tx">
            <button class="btn btn-primary" type="button" id="search-btn"><i class="ti tabler-search me-1"></i>Tìm</button>
            <button type="button" class="btn btn-label-secondary btn-reload waves-effect"><i class="ti tabler-refresh me-1"></i>Reset</button>
            <div class="khxh-filter-actions-sep"></div>
            <button type="button" class="btn btn-label-primary waves-effect btn-open-ptkh-create"><i class="ti tabler-file-plus me-1"></i>Tạo phiếu trả KH</button>
            <button type="button" class="btn btn-success waves-effect waves-light btn-open-create-ke-hoach"><i class="ti tabler-plus me-1"></i>Tạo tuyến xa</button>
          </div>
        </div>
      </div>
    <?php endif; ?>
    <?php if (!$is_tuyen_xa): ?>
      <div class="khxh-filter-bar ke-hoach-list-filter mb-3" id="ke-hoach-inline-filter">
        <div class="khxh-filter-grid">
          <div class="khxh-filter-field"><label class="form-label">Khách hàng</label><select class="select2 form-select khxh-customer-filter-multiple" id="filter-khach-hang" multiple></select></div>
          <div class="khxh-filter-field"><label class="form-label">Địa chỉ kho</label><select class="form-select" id="filter-dia-chi-kho"><option></option></select></div>
          <div class="khxh-filter-field"><label class="form-label">Từ khóa</label><input type="text" class="form-control" id="filter-bkg-cont-seal" placeholder="BKG, số cont, seal"></div>
          <div class="khxh-filter-field"><label class="form-label">Phương tiện</label><select class="form-select" id="filter-phuong-tien"><option></option></select></div>
          <div class="khxh-filter-field khxh-filter-field-date">
            <label class="form-label">Ngày kế hoạch</label>
            <input type="text" class="form-control" id="filter-date-range" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
            <div class="khxh-port-date-quick-filters" aria-label="Chọn nhanh ngày kế hoạch">
              <button type="button" class="khxh-port-date-quick" data-date-quick="today">Hôm nay</button>
              <button type="button" class="khxh-port-date-quick" data-date-quick="tomorrow">Ngày mai</button>
            </div>
          </div>
          <div class="khxh-filter-actions khxh-filter-actions-row">
            <button class="btn btn-primary" type="button" id="search-btn"><i class="ti tabler-search me-1"></i>Tìm</button>
            <button type="button" class="btn btn-label-secondary btn-reload waves-effect khxh-port-filter-reset" title="Reset bộ lọc" aria-label="Reset bộ lọc"><i class="ti tabler-refresh"></i></button>
          </div>
        </div>
      </div>
    <?php endif; ?>

    <?php if (!$is_tuyen_xa): ?>
    </div>
  </div>
  <div class="card khxh-port-list-card">
    <div class="card-body p-0">
      <div class="khxh-port-status-tabs-wrap">
        <ul class="nav nav-pills khxh-port-status-tabs" id="khxh-port-status-tabs" role="tablist">
          <li class="nav-item"><button type="button" class="nav-link active waves-effect waves-light" data-status="" role="tab">Tất cả <span class="badge bg-label-primary ms-1" data-status-count="all">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-status="Chờ thực hiện" role="tab">Chờ thực hiện <span class="badge bg-label-primary ms-1" data-status-count="Chờ thực hiện">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-status="Đã nhận chuyến" role="tab">Đã nhận chuyến <span class="badge bg-label-primary ms-1" data-status-count="Đã nhận chuyến">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-status="Đang kéo lên" role="tab">Đang kéo lên <span class="badge bg-label-primary ms-1" data-status-count="Đang kéo lên">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-status="Đang kéo về" role="tab">Đang kéo về <span class="badge bg-label-primary ms-1" data-status-count="Đang kéo về">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-status="Hoàn thành" role="tab">Hoàn thành <span class="badge bg-label-primary ms-1" data-status-count="Hoàn thành">0</span></button></li>
        </ul>
      </div>
      <div class="khxh-port-table-scroll">
    <?php endif; ?>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table table-bordered table-hover mb-0 khxh-list-table<?php print $is_tuyen_xa ? ' khxh-tuyen-xa-list-table' : ''; ?>">
        <colgroup>
          <col class="khxh-col-stt">
          <col class="khxh-col-date">
          <col class="khxh-col-common">
          <col class="khxh-col-container">
          <col class="khxh-col-vehicle">
          <col class="khxh-col-kho">
          <col class="khxh-col-route">
          <?php if (!$is_tuyen_xa): ?><col class="khxh-col-cang"><?php endif; ?>
          <col class="khxh-col-status">
        </colgroup>
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th><button type="button" class="khxh-date-sort-btn" id="khxh-date-sort" data-direction="desc" title="Sắp xếp ngày: mới đến cũ" aria-label="Sắp xếp ngày: mới đến cũ"><span><?php print $is_tuyen_xa ? 'Ngày' : 'Ngày KH'; ?></span><i class="ti tabler-sort-descending"></i></button></th>
            <th>T.T Chung</th>
            <th>Container</th>
            <th>PT / Lái xe</th>
            <th>Địa chỉ kho</th>
            <th>Bãi lấy/hạ</th>
            <?php if (!$is_tuyen_xa): ?><th>Cảng xuất</th><?php endif; ?>
            <th>T.Thái</th>
          </tr>
        </thead>
        <tbody id="list-body">
          <tr id="loading-row">
            <td colspan="<?php print $is_tuyen_xa ? 8 : 9; ?>" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <?php if (!$is_tuyen_xa): ?></div><?php endif; ?>

    <div id="pagination-wrap" class="mt-3<?php print !$is_tuyen_xa ? ' px-3 pb-3' : ''; ?>" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="pagination-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="pagination-total-pages"></span>
        </div>
      </div>
    </div>
<?php if ($is_tuyen_xa): ?>
  </div>
</div>
<?php else: ?>
    </div>
  </div>
</div>
<?php endif; ?>

<div class="modal fade" id="khxh-ptkh-create-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Tạo phiếu trả khách hàng</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
      </div>
      <div class="modal-body position-relative">
        <div class="row g-2 align-items-end mb-3">
          <div class="col-md-4">
            <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
            <select id="khxh-ptkh-create-customer" class="form-select khxh-ptkh-customer-select">
              <option value="">Chọn khách hàng</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Từ ngày</label>
            <input type="text" id="khxh-ptkh-create-from" class="form-control flatpickr-date date-mask" placeholder="dd/mm/yyyy">
          </div>
          <div class="col-md-3">
            <label class="form-label">Đến ngày</label>
            <input type="text" id="khxh-ptkh-create-to" class="form-control flatpickr-date date-mask" placeholder="dd/mm/yyyy">
          </div>
          <div class="col-md-2">
            <button type="button" class="btn btn-label-primary w-100" id="khxh-ptkh-load-candidates">
              <i class="ti tabler-filter me-1"></i>Lọc
            </button>
          </div>
        </div>
        <div class="table-responsive">
          <table class="table table-bordered table-hover align-middle khxh-ptkh-candidate-table">
            <thead class="table-light">
              <tr>
                <th class="text-center" style="width:44px"><input type="checkbox" id="khxh-ptkh-check-all"></th>
                <th>Kế hoạch</th>
                <th>Ngày</th>
                <th>Tuyến</th>
                <th class="text-end">Doanh thu</th>
                <th class="text-end">Chi hộ</th>
                <th class="text-end">Tổng</th>
              </tr>
            </thead>
            <tbody id="khxh-ptkh-candidate-body">
              <tr><td colspan="7" class="text-center text-muted py-4">Chọn khách hàng rồi bấm Lọc.</td></tr>
            </tbody>
          </table>
        </div>
        <div class="d-flex justify-content-end gap-3 mt-3">
          <div class="khxh-ptkh-total-box"><span>Đã chọn</span><strong id="khxh-ptkh-selected-count">0</strong></div>
          <div class="khxh-ptkh-total-box"><span>Tổng tiền</span><strong id="khxh-ptkh-selected-total">0</strong></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary" id="khxh-ptkh-create-submit">
          <i class="ti tabler-device-floppy me-1"></i>Tạo phiếu
        </button>
      </div>
    </div>
  </div>
</div>



<div class="modal fade" id="ke-hoach-detail-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <div>
          <h5 class="modal-title mb-0">Chi tiết kế hoạch</h5>
          <div class="text-muted small" id="ke-hoach-detail-subtitle">Đang tải dữ liệu...</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body position-relative">
        <div class="loading-overlay" id="ke-hoach-detail-loading" style="display:none;">
          <div class="spinner-border text-primary"></div>
        </div>
        <div id="ke-hoach-detail-content"></div>
      </div>
      <div class="modal-footer">
        <a href="#" class="btn btn-primary" id="ke-hoach-detail-edit-btn">
          <i class="ti tabler-truck-delivery me-1"></i>Xếp xe
        </a>
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="ke-hoach-chi-phi-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen" role="document">
    <div class="modal-content">
      <div class="modal-header khcp-modal-header">
        <div class="d-flex align-items-center gap-2 min-w-0">
          <button type="button" class="btn btn-outline-secondary btn-sm waves-effect" data-bs-dismiss="modal">
            <i class="icon-base ti tabler-arrow-left me-1"></i> Quay lại
          </button>
          <h5 class="modal-title text-truncate mb-0">Chi phí kế hoạch</h5>
          <span class="badge bg-label-secondary border" id="khcp-plan-code">#--</span>
          <span class="text-muted small text-truncate" id="khcp-header-meta"></span>
        </div>

        <div class="d-flex align-items-center gap-2 ms-auto">
          <button type="button" class="btn btn-sm khcp-driver-pay-mode-btn" id="khcp-driver-pay-mode-btn" style="display:none;">
            <i class="ti tabler-cash me-1"></i><span>Chuyến khoán</span>
          </button>
          <span class="badge rounded-pill bg-label-secondary border khcp-header-transport" id="khcp-header-transport">-</span>
        </div>
      </div>

      <div class="modal-body khcp-modal-body">
        <div class="khcp-loading" id="khcp-loading">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div class="row g-3 h-100">
          <div class="col-12 col-xl-8">
            <div class="card khcp-plan-card">
              <div class="card-body">
                <div class="khcp-plan-info-grid">
                  <div>
                    <span>Khách hàng</span>
                    <strong id="khcp-info-customer">-</strong>
                  </div>
                  <div>
                    <span>BKG / Container</span>
                    <strong id="khcp-info-bkg-cont">-</strong>
                  </div>
                  <div>
                    <span>Phương tiện / Lái xe</span>
                    <strong id="khcp-info-vehicle-driver">-</strong>
                  </div>
                  <div class="khcp-plan-info-route">
                    <span>Tuyến</span>
                    <strong id="khcp-info-route">-</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="card khcp-dm-card">
              <div class="card-body p-0">
                <section class="khcp-dm-section">
                  <div class="khcp-dm-header">
                    <div class="d-flex align-items-center gap-2 min-w-0">
                      <span class="khcp-section-title">Định mức khoán lái xe</span>
                      <span class="badge rounded-pill bg-label-secondary border" id="khcp-dm-count">0 chặng</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <button type="button" class="btn btn-sm btn-label-secondary" id="khcp-dm-rebuild">
                        <i class="ti tabler-refresh me-1"></i>Tính lại định mức
                      </button>
                      <button type="button" class="btn btn-sm btn-label-primary" id="khcp-dm-add-row">
                        <i class="ti tabler-plus me-1"></i>Thêm chặng
                      </button>
                    </div>
                  </div>
                  <div class="khcp-dm-summary">
                    <div>
                      <span>Tổng khoán lái xe</span>
                      <strong id="khcp-dm-total">0</strong>
                    </div>
                    <div>
                      <span>Có định mức</span>
                      <strong id="khcp-dm-matched">0</strong>
                    </div>
                    <div>
                      <span>Chưa có định mức</span>
                      <strong id="khcp-dm-missing">0</strong>
                    </div>
                  </div>
                  <div class="table-responsive khcp-dm-table-wrap">
                    <table class="table table-bordered table-sm align-middle mb-0 khcp-table khcp-dm-table">
                      <thead>
                        <tr>
                          <th class="khcp-col-index">#</th>
                          <th class="khcp-dm-col-leg">Chặng</th>
                          <th class="khcp-dm-col-status">Trạng thái xe</th>
                          <th class="khcp-dm-col-place">Điểm đầu</th>
                          <th class="khcp-dm-col-place">Điểm cuối</th>
                          <th class="khcp-col-money">Định mức</th>
                          <th class="khcp-col-action"></th>
                        </tr>
                      </thead>
                      <tbody id="khcp-dm-table-body"></tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>

            <div class="card khcp-revenue-card">
              <div class="card-header bg-white d-flex flex-wrap justify-content-between align-items-center gap-2">
                <div class="d-flex align-items-center gap-2 min-w-0">
                  <span class="khcp-section-title">Doanh thu khách hàng</span>
                  <span class="badge rounded-pill bg-label-primary border" id="khcp-revenue-total">0</span>
                </div>
              </div>
              <div class="card-body">
                <div class="row row-cols-1 row-cols-md-2 row-cols-xl-5 g-3" id="khcp-revenue-fields"></div>
              </div>
            </div>

            <div class="card khcp-main-card">
              <div class="card-body p-0">
                <div class="table-responsive khcp-table-wrap">
                  <table class="table table-bordered table-sm align-middle mb-0 khcp-table">
                    <thead>
                      <tr>
                        <th class="khcp-col-index">#</th>
                        <th class="khcp-col-name">Tên chi phí</th>
                        <th class="khcp-col-money">Đơn giá</th>
                        <th class="khcp-col-qty">SL</th>
                        <th class="khcp-col-money">Trước VAT</th>
                        <th class="khcp-col-vat">VAT (%)</th>
                        <th class="khcp-col-money">Sau VAT</th>
                        <th class="khcp-col-note">Ghi chú</th>
                        <th class="khcp-col-type" title="Chi hộ khách hàng">KH</th>
                        <th class="khcp-col-type" title="Công ty chi trả">CT</th>
                        <th class="khcp-col-type" title="Lái xe chi trả">LX</th>
                        <th class="khcp-col-action"></th>
                      </tr>
                    </thead>
                    <tbody id="khcp-cost-table-body"></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-xl-4">
            <div class="card khcp-summary-card">
              <div class="card-header">Tổng quan</div>
              <div class="card-body">
                <div class="khcp-summary-total">
                  <div class="khcp-summary-label">Tổng dòng tiền</div>
                  <div class="khcp-summary-value" id="khcp-total-all">0</div>
                </div>

                <div class="khcp-summary-group">
                  <div class="khcp-summary-group-title">Khách hàng</div>
                  <div class="khcp-summary-row is-revenue">
                    <span>Doanh thu khách hàng</span>
                    <strong id="khcp-total-revenue">0</strong>
                  </div>
                  <div class="khcp-summary-row">
                    <span>Chi hộ khách hàng</span>
                    <strong id="khcp-total-customer">0</strong>
                  </div>
                </div>

                <div class="khcp-summary-group">
                  <div class="khcp-summary-group-title">Chi phí vận hành</div>
                  <div class="khcp-summary-row">
                    <span>Công ty chi trả</span>
                    <strong id="khcp-total-company">0</strong>
                  </div>
                  <div class="khcp-summary-row">
                    <span>Lái xe tự chịu</span>
                    <strong id="khcp-total-driver-self">0</strong>
                  </div>
                </div>

                <div class="khcp-summary-group">
                  <div class="khcp-summary-group-title">Lái xe</div>
                  <div class="khcp-summary-row is-driver-salary">
                    <span>Lương lái xe</span>
                    <strong id="khcp-total-driver-salary">0</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="card khcp-oil-card mt-3" id="khcp-oil-card" style="display:none;">
              <div class="khcp-dm-header">
                <div class="d-flex align-items-center gap-2 min-w-0">
                  <span class="khcp-section-title">Đổ dầu tuyến xa</span>
                  <span class="badge rounded-pill bg-label-secondary border" id="khcp-oil-count">0 dòng</span>
                </div>
              </div>
              <div class="card-body">
                <div class="khcp-oil-summary khcp-dm-summary">
                  <div>
                    <span>Tổng lít</span>
                    <strong id="khcp-oil-total-lit">0</strong>
                  </div>
                  <div>
                    <span>Tổng tiền dầu</span>
                    <strong id="khcp-oil-total-money">0</strong>
                  </div>
                </div>
                <div class="table-responsive khcp-oil-table-wrap" id="khcp-oil-table-wrap">
                  <table class="table table-bordered table-sm align-middle mb-0 khcp-table khcp-dm-table khcp-oil-table">
                    <thead>
                      <tr>
                        <th class="khcp-col-index">#</th>
                        <th>Ngày</th>
                        <th class="khcp-col-qty">Lít đầu cái</th>
                        <th class="khcp-col-qty">Lít mooc</th>
                        <th class="khcp-col-money">Số tiền</th>
                        <th class="khcp-col-action"></th>
                      </tr>
                    </thead>
                    <tbody id="khcp-oil-table-body"></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer khcp-modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
        <button type="button" class="btn btn-primary" id="khcp-save-all-footer">
          <i class="ti tabler-circle-check me-1"></i>Lưu tất cả
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="ke-hoach-edit-fullscreen-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen" role="document">
    <div class="modal-content">
      <div class="modal-body p-0">
        <div id="ke-hoach-edit-modal-content"></div>
      </div>
    </div>
  </div>
</div>

<template id="ke-hoach-edit-modal-template">
  <?php print theme('ke_hoach_xep_xe_edit_page', array('mode' => 'edit', 'data' => NULL)); ?>
</template>

<div class="modal fade" id="ke-hoach-tuyen-xa-edit-fullscreen-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-fullscreen" role="document">
    <div class="modal-content">
      <div class="modal-body p-0">
        <div id="ke-hoach-tuyen-xa-edit-modal-content"></div>
      </div>
    </div>
  </div>
</div>

<template id="ke-hoach-tuyen-xa-edit-modal-template">
  <?php print theme('ke_hoach_tuyen_xa_edit_page', array('mode' => 'edit', 'data' => NULL)); ?>
</template>

<?php if ($is_tuyen_xa): ?>
<div id="ke-hoach-form-app">
  <input type="hidden" id="nid-input" value="">

  <div class="modal fade" id="ke-hoach-fullscreen-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-fullscreen" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><?php print check_plain($create_title); ?></h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body position-relative">
          <div class="loading-overlay" id="form-loading" style="display:none;">
            <div class="spinner-border text-primary"></div>
          </div>

          <form id="ke-hoach-form" novalidate>
            <h4 class="mt-2 mb-3">Danh sách chuyến xe</h4>

            <div class="table-responsive ke-hoach-table-wrap">
              <table class="table table-bordered align-middle ke-hoach-entry-table" id="ke-hoach-entry-table">
	                <thead>
	                  <tr>
	                    <th style="width: 12%"><?php print $is_tuyen_xa ? 'Khách hàng' : 'Khách hàng / BKG'; ?> <span class="text-danger">*</span></th>
	                    <th style="width: 8%">Phương tiện</th>
	                    <th style="width: 8%"><span class="th-split-label">Container</span></th>
	                    <?php if ($is_tuyen_xa): ?><th style="width: 10%"><span class="th-split-label">Kế hoạch nguồn</span></th><?php endif; ?>
	                    <th style="width: 10%"><span class="th-split-label">H.Thức vận tải</span></th>
	                    <?php if (!$is_tuyen_xa): ?>
	                      <th style="width: 8%"><span class="th-split-label">Seal tạm/chính</span></th>
	                    <?php endif; ?>
	                    <th style="width: 8%"><span class="th-split-label"><?php print $is_tuyen_xa ? 'Kho' : 'Kho <span class="text-danger">*</span>/Cảng xuất'; ?></span></th>
	                    <th style="width: 8%"><span class="th-split-label">Bãi lấy/hạ</span></th>
                    <?php if (!$is_tuyen_xa): ?><th style="width: 8%"><span class="th-split-label">Loại hàng</span></th><?php endif; ?>
                    <th width="1%" class="text-center">
                      <button type="button" class="btn btn-sm btn-icon btn-label-success" id="add-line-btn" title="Thêm dòng">
                        <i class="ti tabler-circle-plus"></i>
                      </button>
                    </th>
                    <th width="1%" class="text-center">
                      <button type="button" class="btn btn-sm btn-icon btn-label-primary" id="reset-lines-btn" title="Reset toàn bộ">
                        <i class="ti tabler-reload"></i>
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody id="ke-hoach-lines-body"></tbody>
              </table>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
          <button type="button" class="btn btn-primary" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i>Lưu thông tin</button>
        </div>
      </div>
    </div>
	  </div>

	  <div class="modal fade" id="cont-ref-picker-modal" tabindex="-1" aria-hidden="true">
	    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
	      <div class="modal-content">
	        <div class="modal-header">
	          <div>
	            <h5 class="modal-title mb-0"><?php print $is_tuyen_xa ? 'Chọn kế hoạch / cont' : 'Chọn cont kéo về'; ?></h5>
	          </div>
	          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
	        </div>
	        <div class="modal-body">
	          <div class="line-cont-picker-wrap" id="cont-ref-picker-wrap" data-line-key="">
	            <div class="row line-cont-filter-row mb-2">
	            <?php if (!$is_tuyen_xa): ?><div class="col-md-3"><input type="text" class="form-control line-cont-filter-bkg" placeholder="Tìm theo số BKG"></div><?php endif; ?>
	            <div class="col-md-<?php print $is_tuyen_xa ? '4' : '3'; ?>"><input type="text" class="form-control line-cont-filter-cont" placeholder="Tìm theo số cont"></div>
	              <div class="col-md-4"><select class="form-select line-cont-filter-kho"><option></option></select></div>
	              <div class="col-md-2"><select class="form-select line-cont-filter-du-hang"><option value="">Trạng thái</option><option value="1">Đã đủ</option><option value="0">Chưa đủ</option></select></div>
	            </div>
	            <div class="cont-picker-list-head<?php print $is_tuyen_xa ? ' is-tuyen-xa' : ''; ?>"><span></span><span><?php print $is_tuyen_xa ? 'Container' : 'Cont / Booking'; ?></span><span>Kho</span><span>Bãi hạ</span><?php if (!$is_tuyen_xa): ?><span>Seal</span><span class="cont-picker-port-requirements-head">Yêu cầu</span><?php endif; ?><span>T.Thái</span><span>Ghi chú</span></div>
	            <div class="line-cont-picker-body line-cont-picker-list"><div class="text-center text-muted py-4">Chưa có dữ liệu</div></div>
	          </div>
	        </div>
	        <div class="modal-footer">
	          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
	          <button type="button" class="btn btn-primary" id="cont-ref-picker-confirm-btn"><i class="ti tabler-check me-1"></i>Chọn cont</button>
	        </div>
	      </div>
	    </div>
	  </div>

	  <div class="modal fade" id="vehicle-picker-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h5 class="modal-title mb-0">Chọn phương tiện</h5>
            <div class="text-muted small">Chọn đầu kéo cho dòng đang thao tác.</div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="row g-2 align-items-center mb-3">
            <div class="col-md-6">
              <input type="text" class="form-control" id="vehicle-picker-search" placeholder="Tìm theo BKS, mooc, lái xe...">
            </div>
            <div class="col-md-6 text-md-end">
              <div class="d-inline-flex align-items-center gap-2 justify-content-md-end flex-wrap">
                <div class="text-muted small" id="vehicle-picker-target">Đang chọn cho dòng #1</div>
                <button type="button" class="btn btn-sm btn-label-secondary" id="vehicle-picker-clear-btn">
                  <i class="ti tabler-x me-1"></i>Bỏ chọn
                </button>
              </div>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th style="width:60px" class="text-center">Chọn</th>
                  <th id="vehicle-picker-col-bks">Biển số</th>
                  <th id="vehicle-picker-col-type">Loại xe</th>
                  <th id="vehicle-picker-col-extra">Lái xe hiện tại</th>
                  <th style="width:130px" class="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody id="vehicle-picker-body">
                <tr>
                  <td colspan="5" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải phương tiện...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<?php else: ?>
  <?php print theme('ke_hoach_hang_cang_create_page'); ?>
<?php endif; ?>

<?php
$is_tuyen_xa = isset($plan_type) && $plan_type === 'tuyen_xa';
$list_title = $is_tuyen_xa ? 'Kế hoạch tuyến xa' : 'Danh sách kế hoạch xếp xe';
$create_title = $is_tuyen_xa ? 'Tạo kế hoạch tuyến xa' : 'Tạo kế hoạch xếp xe';
$create_button_text = $is_tuyen_xa ? 'Thêm kế hoạch tuyến xa' : 'Tạo kế hoạch';
?>
<div class="card" id="ke-hoach-list-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title"><?php print check_plain($list_title); ?></h4>
  </div>

  <div class="card-body">
    <div class="d-flex flex-wrap justify-content-end align-items-center gap-2 mb-3">
      <button type="button" class="btn btn-label-primary" data-bs-toggle="modal" data-bs-target="#ke-hoach-search-modal">
        <i class="ti tabler-search me-1"></i>Tìm kiếm
      </button>
      <button type="button" class="btn btn-label-secondary btn-reload waves-effect">
        <i class="ti tabler-refresh me-1"></i>Reset
      </button>
      <button type="button" class="btn btn-primary waves-effect waves-light btn-open-create-ke-hoach">
        <i class="ti tabler-plus me-1"></i><?php print check_plain($create_button_text); ?>
      </button>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table class="table table-bordered table-hover mb-0 khxh-list-table">
        <colgroup>
          <col class="khxh-col-actions">
          <col class="khxh-col-stt">
          <col class="khxh-col-date">
          <col class="khxh-col-common">
          <col class="khxh-col-bkg">
          <col class="khxh-col-container">
          <col class="khxh-col-vehicle">
          <col class="khxh-col-kho">
          <col class="khxh-col-route">
          <col class="khxh-col-cang">
          <col class="khxh-col-date">
          <col class="khxh-col-status">
        </colgroup>
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center">CN</th>
            <th>#</th>
            <th>Ngày</th>
            <th>T.T Chung</th>
            <th>bkg</th>
            <th>Container</th>
            <th>PT / Lái xe</th>
            <th>Địa chỉ kho</th>
            <th>Bãi lấy/hạ</th>
            <th>Cảng xuất</th>
            <th>Cut off</th>
            <th>T.Thái</th>
          </tr>
        </thead>
        <tbody id="list-body">
          <tr id="loading-row">
            <td colspan="12" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="pagination-wrap" class="mt-3" style="display:none;">
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
  </div>
</div>

<div class="modal fade" id="ke-hoach-search-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Tìm kiếm kế hoạch</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body position-relative">
        <div class="loading-overlay" id="ke-hoach-search-loading" style="display:none;">
          <div class="spinner-border text-primary"></div>
        </div>
        <div class="row g-3 ke-hoach-list-filter">
          <div class="col-12 col-md-4"><label class="form-label">Khách hàng</label><select class="form-select" id="filter-khach-hang"><option></option></select></div>
          <div class="col-12 col-md-4"><label class="form-label">Số BKG</label><input type="text" class="form-control" id="filter-so-bkg" placeholder="Số BKG"></div>
          <div class="col-12 col-md-4"><label class="form-label">Trạng thái vận chuyển</label><select class="form-select" id="status-filter"><option></option><option value="Kéo lên">Kéo lên</option><option value="Kéo về">Kéo về</option><option value="Đã cắt mooc">Đã cắt mooc</option></select></div>
          <div class="col-6 col-md-3"><label class="form-label">Từ ngày</label><input type="text" class="form-control flatpickr-date" id="filter-date-from" placeholder="dd/mm/yyyy"></div>
          <div class="col-6 col-md-3"><label class="form-label">Đến ngày</label><input type="text" class="form-control flatpickr-date" id="filter-date-to" placeholder="dd/mm/yyyy"></div>
          <div class="col-6 col-md-3"><label class="form-label">Loại cont</label><select class="form-select" id="filter-loai-cont"><option></option></select></div>
          <div class="col-6 col-md-3"><label class="form-label">Số cont</label><input type="text" class="form-control" id="filter-so-cont" placeholder="Số cont"></div>
          <div class="col-12 col-md-6"><label class="form-label">Địa chỉ kho</label><select class="form-select" id="filter-dia-chi-kho"><option></option></select></div>
          <div class="col-6 col-md-3"><label class="form-label">Seal chính</label><input type="text" class="form-control" id="filter-seal-chinh" placeholder="Seal chính"></div>
          <div class="col-6 col-md-3"><label class="form-label">Seal phụ</label><input type="text" class="form-control" id="filter-seal-phu" placeholder="Seal phụ"></div>
          <div class="col-6 col-md-4"><label class="form-label">BKS đầu kéo</label><select class="form-select" id="filter-bks-dau-keo"><option></option></select></div>
          <div class="col-6 col-md-4"><label class="form-label">BKS mooc</label><select class="form-select" id="filter-bks-mooc"><option></option></select></div>
          <div class="col-12 col-md-4"><label class="form-label">Đủ hàng</label><select class="form-select" id="filter-da-du-hang"><option value="">Tất cả</option><option value="1">Đã đủ hàng</option><option value="0">Chưa đủ hàng</option></select></div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary btn-reload waves-effect"><i class="ti tabler-refresh me-1"></i>Reset</button>
        <button class="btn btn-primary" type="button" id="search-btn"><i class="ti tabler-search me-1"></i>Tìm kiếm</button>
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
          <h5 class="modal-title text-truncate mb-0">Chi phí kế hoạch</h5>
          <span class="badge bg-label-secondary border" id="khcp-plan-code">#--</span>
          <span class="text-muted small text-truncate" id="khcp-header-meta"></span>
        </div>

        <div class="d-flex align-items-center gap-2 ms-auto">
          <button type="button" class="btn-close ms-1" data-bs-dismiss="modal" aria-label="Đóng"></button>
        </div>
      </div>

      <div class="modal-body khcp-modal-body">
        <div class="khcp-loading" id="khcp-loading">
          <div class="spinner-border text-primary" role="status"></div>
        </div>

        <div class="row g-3 h-100">
          <div class="col-12 col-xl-9">
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
                  <div>
                    <span>Kho / Bãi hạ</span>
                    <strong id="khcp-info-route">-</strong>
                  </div>
                  <div>
                    <span>Hình thức vận tải</span>
                    <strong id="khcp-info-status">-</strong>
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
                        <th class="khcp-col-action"></th>
                      </tr>
                    </thead>
                    <tbody id="khcp-cost-table-body"></tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 col-xl-3">
            <div class="card khcp-summary-card">
              <div class="card-header">Tổng quan</div>
              <div class="card-body">
                <div class="khcp-summary-block">
                  <div class="khcp-summary-label">Doanh thu khách hàng</div>
                  <div class="khcp-summary-value" id="khcp-total-revenue">0</div>
                </div>

                <div class="khcp-summary-block">
                  <div class="khcp-summary-label">Chi hộ khách hàng</div>
                  <div class="khcp-summary-value" id="khcp-total-customer">0</div>
                </div>

                <div class="khcp-summary-block">
                  <div class="khcp-summary-label">Công ty chi trả</div>
                  <div class="khcp-summary-value" id="khcp-total-company">0</div>
                </div>

                <div class="khcp-summary-block">
                  <div class="khcp-summary-label">Lái xe tự chịu</div>
                  <div class="khcp-summary-value" id="khcp-total-driver-self">0</div>
                </div>

                <div class="khcp-summary-block">
                  <div class="khcp-summary-label">Lương lái xe</div>
                  <div class="khcp-summary-value" id="khcp-total-driver-salary">0</div>
                </div>

                <div class="khcp-summary-total">
                  <div class="khcp-summary-label">Tổng dòng tiền</div>
                  <div class="khcp-summary-value" id="khcp-total-all">0</div>
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
                    <th style="width: 8%">Khách hàng <span class="text-danger">*</span></th>
                    <th style="width: 8%">Số BKG <span class="text-danger">*</span></th>
                    <th style="width: 8%">Phương tiện</th>
                    <th style="width: 8%"><span class="th-split-label">Container</span></th>
                    <th style="width: 8%"><span class="th-split-label">Seal tạm/chính</span></th>
                    <th style="width: 8%"><span class="th-split-label">Kho <span class="text-danger">*</span>/Cảng xuất</span></th>
                    <th style="width: 8%"><span class="th-split-label">Bãi lấy/hạ</span></th>
                    <th style="width: 8%"><span class="th-split-label">Cut-off</span></th>
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

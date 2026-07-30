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
    <!-- Search + Filter + Actions -->
    <div class="row g-2 mb-3 align-items-end ke-hoach-list-filter">
      <div class="col-12 col-md-3 col-xl-2"><label class="form-label">Khách hàng</label><input type="text" class="form-control" id="filter-khach-hang" placeholder="Tên khách hàng"></div>
      <div class="col-12 col-md-3 col-xl-2"><label class="form-label">Số BKG</label><input type="text" class="form-control" id="filter-so-bkg" placeholder="Số BKG"></div>
      <div class="col-6 col-md-3 col-xl-2"><label class="form-label">Loại cont</label><input type="text" class="form-control" id="filter-loai-cont" placeholder="Loại"></div>
      <div class="col-6 col-md-3 col-xl-2"><label class="form-label">Số cont</label><input type="text" class="form-control" id="filter-so-cont" placeholder="Số cont"></div>
      <div class="col-12 col-md-4 col-xl-2"><label class="form-label">Địa chỉ kho</label><input type="text" class="form-control" id="filter-dia-chi-kho" placeholder="Địa chỉ kho"></div>
      <div class="col-6 col-md-2 col-xl-1"><label class="form-label">Từ ngày</label><input type="text" class="form-control flatpickr-date" id="filter-date-from" placeholder="dd/mm/yyyy"></div>
      <div class="col-6 col-md-2 col-xl-1"><label class="form-label">Đến ngày</label><input type="text" class="form-control flatpickr-date" id="filter-date-to" placeholder="dd/mm/yyyy"></div>
      <div class="col-6 col-md-3 col-xl-2"><label class="form-label">Seal chính</label><input type="text" class="form-control" id="filter-seal-chinh" placeholder="Seal chính"></div>
      <div class="col-6 col-md-3 col-xl-2"><label class="form-label">Seal phụ</label><input type="text" class="form-control" id="filter-seal-phu" placeholder="Seal phụ"></div>
      <div class="col-6 col-md-3 col-xl-2"><label class="form-label">BKS đầu kéo</label><input type="text" class="form-control" id="filter-bks-dau-keo" placeholder="BKS đầu kéo"></div>
      <div class="col-6 col-md-3 col-xl-2"><label class="form-label">BKS mooc</label><input type="text" class="form-control" id="filter-bks-mooc" placeholder="BKS mooc"></div>
      <div class="col-12 col-xl-4">
        <div class="d-flex flex-wrap gap-2 justify-content-xl-end">
          <button class="btn btn-primary" type="button" id="search-btn"><i class="ti tabler-search me-1"></i>Tìm kiếm</button>
          <button type="button" class="btn btn-label-secondary btn-reload waves-effect"><i class="ti tabler-refresh me-1"></i>Reset</button>
          <button type="button" class="btn btn-primary waves-effect waves-light btn-open-create-ke-hoach"><i class="ti tabler-plus me-1"></i><?php print check_plain($create_button_text); ?></button>
        </div>
      </div>
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
            <th>Ngày K.H</th>
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

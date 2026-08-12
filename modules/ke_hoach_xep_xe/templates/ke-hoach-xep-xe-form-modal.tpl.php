<?php
$is_tuyen_xa = isset($plan_type) && $plan_type === 'tuyen_xa';
$create_title = $is_tuyen_xa ? 'Tạo kế hoạch tuyến xa' : 'Tạo kế hoạch xếp xe';
?>
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
                    <th style="width: 12%">Khách hàng / BKG <span class="text-danger">*</span></th>
                    <th style="width: 8%">Phương tiện</th>
                    <th style="width: 8%"><span class="th-split-label">Container</span></th>
                    <th style="width: 10%"><span class="th-split-label">H.Thức vận tải</span></th>
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

  <div class="modal fade" id="cont-ref-picker-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h5 class="modal-title mb-0">Chọn cont kéo về</h5>
            <div class="text-muted small" id="cont-ref-picker-target">Đang chọn cho dòng #1</div>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="line-cont-picker-wrap" id="cont-ref-picker-wrap" data-line-key="">
            <div class="row line-cont-filter-row mb-2">
              <div class="col-md-3"><input type="text" class="form-control line-cont-filter-bkg" placeholder="Tìm theo số BKG"></div>
              <div class="col-md-3"><input type="text" class="form-control line-cont-filter-cont" placeholder="Tìm theo số cont"></div>
              <div class="col-md-4"><select class="form-select line-cont-filter-kho"><option></option></select></div>
              <div class="col-md-2"><select class="form-select line-cont-filter-du-hang"><option value="">Trạng thái</option><option value="1">Đã đủ</option><option value="0">Chưa đủ</option></select></div>
            </div>
            <div class="table-responsive">
              <table class="table table-bordered table-sm mb-0">
                <thead><tr><th></th><th>Xe kéo lên</th><th>Booking / Cont</th><th>Địa chỉ đóng/ trả hàng (Kho)</th><th>Bãi hạ</th><th>Đủ hàng</th><th>Ghi chú</th></tr></thead>
                <tbody class="line-cont-picker-body"><tr><td colspan="7" class="text-center text-muted">Chưa có dữ liệu</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng lại</button>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="vehicle-picker-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title mb-0">Chọn phương tiện</h5>
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

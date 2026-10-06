<?php
/**
 * @file
 * Màn /thu-chi — hybrid như các màn mới: layout rỗng, JS (assets/js/thu_chi.js) gọi API /api/thu-chi để đổ dữ liệu.
 * Bố cục 2 card như /de-nghi-thanh-toan (bản riêng, tiền tố tc-): card trên = tiêu đề + tổng + nút tạo + bộ lọc;
 * card dưới = tab trạng thái duyệt có số lượng + bảng + phân trang. Modal Tạo/Sửa + modal Chi tiết ở dưới.
 */
$tc_can_manage = thu_chi_manage_access();
?>
<div id="tc-app" class="tc-list-app">
  <div class="card tc-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0"><i class="ti tabler-receipt-2 me-2 tc-title-icon"></i>Thu chi</h4>
      <div class="d-flex flex-wrap align-items-center gap-3">
        <div class="tc-sum-bar" id="tc-sum"></div>
        <?php if ($tc_can_manage): ?>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-label-success" id="tc-btn-create-thu"><i class="ti tabler-arrow-down-left me-1"></i>Tạo phiếu thu</button>
          <button type="button" class="btn btn-label-danger" id="tc-btn-create-chi"><i class="ti tabler-arrow-up-right me-1"></i>Tạo phiếu chi</button>
        </div>
        <?php endif; ?>
      </div>
    </div>
    <div class="card-body tc-filter-body">
      <div class="tc-filter-grid">
        <div class="tc-filter-field">
          <label class="form-label" for="tc-f-q">Từ khóa</label>
          <input type="text" class="form-control" id="tc-f-q" placeholder="Mã phiếu, nội dung">
        </div>
        <div class="tc-filter-field">
          <label class="form-label" for="tc-f-loai">Loại phiếu</label>
          <select class="form-select" id="tc-f-loai">
            <option value="">Tất cả</option>
            <option value="thu">Phiếu thu</option>
            <option value="chi">Phiếu chi</option>
          </select>
        </div>
        <div class="tc-filter-field">
          <label class="form-label" for="tc-f-phan-loai">Phân loại</label>
          <select class="form-select" id="tc-f-phan-loai"><option value="">Tất cả</option></select>
        </div>
        <div class="tc-filter-field">
          <label class="form-label" for="tc-f-quy">Quỹ</label>
          <select class="form-select" id="tc-f-quy"><option value="">Tất cả</option></select>
        </div>
        <div class="tc-filter-field">
          <label class="form-label" for="tc-f-ngay">Ngày phiếu</label>
          <input type="text" class="form-control" id="tc-f-ngay" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
        </div>
        <div class="tc-filter-actions">
          <button type="button" class="btn btn-primary" id="tc-btn-search"><i class="ti tabler-search me-1"></i>Tìm</button>
          <button type="button" class="btn btn-label-secondary tc-filter-reset" id="tc-btn-reset" title="Reset bộ lọc" aria-label="Reset bộ lọc"><i class="ti tabler-refresh"></i></button>
        </div>
      </div>
    </div>
  </div>

  <div class="card tc-list-card">
    <div class="card-body p-0">
      <div class="tc-status-tabs-wrap">
        <ul class="nav nav-pills tc-status-tabs" id="tc-tabs" role="tablist"></ul>
      </div>
      <div class="tc-table-scroll">
        <div class="table-responsive">
          <table class="table table-bordered table-hover mb-0 tc-list-table">
            <thead class="table-light">
              <tr>
                <th style="width:46px;text-align:center;">CN</th>
                <th style="width:150px;">Mã phiếu / Ngày</th>
                <th style="width:90px;">Loại</th>
                <th style="width:160px;">Phân loại</th>
                <th>Nội dung</th>
                <th style="width:150px;">Đối tượng</th>
                <th style="width:160px;">Quỹ</th>
                <th class="text-end" style="width:140px;">Số tiền</th>
                <th style="width:150px;">Người đề xuất</th>
                <th style="width:190px;">Trạng thái</th>
              </tr>
            </thead>
            <tbody id="tc-tbody">
              <tr><td colspan="10" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div id="tc-pagination" class="mt-3 px-3 pb-3" style="display:none;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="tc-pagination-info"></div>
          <nav><ul class="pagination justify-content-center mb-0"></ul></nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="tc-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="tc-pagination-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Tạo / Sửa phiếu -->
  <div class="modal fade" id="tc-form-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
        <form id="tc-form" novalidate>
          <div class="modal-header">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title mb-0" id="tc-form-title">Tạo phiếu thu</h5>
              <span class="badge bg-label-secondary border d-none" id="tc-form-ma"></span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="position:relative;max-height:78vh;overflow-y:auto;overflow-x:hidden;">
            <div class="tc-loading" id="tc-form-loading"><div class="spinner-border text-primary" role="status"></div></div>
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label">Loại phiếu <span class="text-danger">*</span></label>
                <div class="btn-group w-100 tc-loai-toggle" role="group">
                  <input type="radio" class="btn-check" name="tc-loai" id="tc-loai-thu" value="thu" checked>
                  <label class="btn btn-outline-success" for="tc-loai-thu"><i class="ti tabler-arrow-down-left me-1"></i>Thu</label>
                  <input type="radio" class="btn-check" name="tc-loai" id="tc-loai-chi" value="chi">
                  <label class="btn btn-outline-danger" for="tc-loai-chi"><i class="ti tabler-arrow-up-right me-1"></i>Chi</label>
                </div>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="tc-in-phan-loai">Phân loại <span class="text-danger">*</span></label>
                <select class="form-select" id="tc-in-phan-loai"><option value="">Chọn hoặc gõ mới</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="tc-in-quy">Quỹ <span class="text-danger">*</span></label>
                <select class="form-select" id="tc-in-quy"><option value="">Chọn quỹ</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="tc-in-ngay">Ngày phiếu <span class="text-danger">*</span></label>
                <input type="text" class="form-control flatpickr-date date-mask" id="tc-in-ngay" placeholder="dd/mm/yyyy" autocomplete="off">
              </div>
              <div class="col-md-3">
                <label class="form-label" for="tc-in-nguoi">Người đề xuất <span class="text-danger">*</span></label>
                <select class="form-select" id="tc-in-nguoi"><option value="">Chọn</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="tc-in-kh">Khách hàng</label>
                <select class="form-select" id="tc-in-kh"><option value="">Không chọn</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="tc-in-ncc">Nhà cung cấp</label>
                <select class="form-select" id="tc-in-ncc"><option value="">Không chọn</option></select>
              </div>
              <div class="col-md-3">
                <label class="form-label" for="tc-in-ghi-chu">Ghi chú</label>
                <input type="text" class="form-control" id="tc-in-ghi-chu" placeholder="Ghi chú (nếu có)">
              </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mt-4 mb-2">
              <strong>Chi tiết phiếu</strong>
              <button type="button" class="btn btn-sm btn-label-primary" id="tc-add-line"><i class="ti tabler-plus me-1"></i>Thêm dòng</button>
            </div>
            <div class="table-responsive tc-lines-wrap">
              <table class="table table-sm table-bordered tc-lines mb-0">
                <thead><tr>
                  <th style="width:4%;" class="text-center">#</th>
                  <th style="width:34%;">Nội dung <span class="text-danger">*</span></th>
                  <th style="width:9%;">ĐVT</th>
                  <th class="text-end" style="width:9%;">SL</th>
                  <th class="text-end" style="width:15%;">Đơn giá</th>
                  <th class="text-end" style="width:8%;">VAT %</th>
                  <th class="text-end" style="width:16%;">Thành tiền</th>
                  <th style="width:5%;"></th>
                </tr></thead>
                <tbody id="tc-lines"></tbody>
                <tfoot><tr class="table-light">
                  <td colspan="6" class="text-end fw-semibold">Tổng tiền</td>
                  <td class="text-end fw-bold" id="tc-lines-total">0 đ</td>
                  <td></td>
                </tr></tfoot>
              </table>
            </div>
            <datalist id="tc-noi-dung-list"></datalist>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" class="btn btn-primary" id="tc-form-save"><i class="ti tabler-device-floppy me-1"></i>Lưu phiếu</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Chi tiết phiếu -->
  <div class="modal fade" id="tc-view-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <h5 class="modal-title mb-0">Chi tiết phiếu</h5>
            <span class="badge bg-label-secondary border" id="tc-view-ma"></span>
            <span id="tc-view-status"></span>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;min-height:200px;">
          <div class="tc-loading" id="tc-view-loading"><div class="spinner-border text-primary" role="status"></div></div>
          <div id="tc-view-body"></div>
        </div>
        <div class="modal-footer" id="tc-view-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        </div>
      </div>
    </div>
  </div>
</div>

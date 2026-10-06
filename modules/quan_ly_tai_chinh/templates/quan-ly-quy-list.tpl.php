<?php
/**
 * @file
 * Màn /quan-ly-quy — hybrid: layout rỗng, JS (assets/js/quan_ly_quy.js) gọi API /api/quan-ly-quy để đổ dữ liệu.
 * Bố cục 2 card như /de-nghi-thanh-toan, /thu-chi (bản riêng, tiền tố qq-): card trên = tiêu đề + số dư hiện tại + nút + bộ lọc;
 * card dưới = tab theo loại quỹ có số lượng + bảng số liệu theo kỳ + phân trang. Modal: Tạo/Sửa, Chuyển tiền, Điều chỉnh, Chi tiết.
 */
$qq_can_manage = quan_ly_tai_chinh_manage_access();
?>
<div id="qq-app" class="qq-list-app">
  <div class="card qq-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0"><i class="ti tabler-building-bank me-2 qq-title-icon"></i>Quản lý quỹ</h4>
      <div class="d-flex flex-wrap align-items-center gap-3">
        <div class="qq-sum-bar" id="qq-sum"></div>
        <?php if ($qq_can_manage): ?>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-primary" id="qq-btn-create"><i class="ti tabler-plus me-1"></i>Thêm quỹ</button>
          <button type="button" class="btn btn-label-primary" id="qq-btn-transfer"><i class="ti tabler-arrows-exchange me-1"></i>Chuyển tiền nội bộ</button>
        </div>
        <?php endif; ?>
      </div>
    </div>
    <div class="card-body qq-filter-body">
      <div class="qq-filter-grid">
        <div class="qq-filter-field">
          <label class="form-label" for="qq-f-q">Từ khóa</label>
          <input type="text" class="form-control" id="qq-f-q" placeholder="Mã quỹ, tên quỹ">
        </div>
        <div class="qq-filter-field">
          <label class="form-label" for="qq-f-ky">Kỳ</label>
          <input type="text" class="form-control" id="qq-f-ky" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
        </div>
        <div class="qq-filter-actions">
          <button type="button" class="btn btn-primary" id="qq-btn-search"><i class="ti tabler-search me-1"></i>Tìm</button>
          <button type="button" class="btn btn-label-secondary qq-filter-reset" id="qq-btn-reset" title="Reset bộ lọc" aria-label="Reset bộ lọc"><i class="ti tabler-refresh"></i></button>
        </div>
      </div>
    </div>
  </div>

  <div class="card qq-list-card">
    <div class="card-body p-0">
      <div class="qq-status-tabs-wrap">
        <ul class="nav nav-pills qq-status-tabs" id="qq-tabs" role="tablist"></ul>
      </div>
      <div class="qq-table-scroll">
        <div class="table-responsive">
          <table class="table table-bordered table-hover mb-0 qq-list-table">
            <thead class="table-light">
              <tr>
                <th style="width:46px;text-align:center;">CN</th>
                <th>Quỹ</th>
                <th style="width:110px;">Loại</th>
                <th style="width:150px;">Người quản lý</th>
                <th class="text-end" style="width:130px;">Đầu kỳ</th>
                <th class="text-end" style="width:120px;">Thu</th>
                <th class="text-end" style="width:120px;">Chi</th>
                <th class="text-end" style="width:120px;">Chuyển đến</th>
                <th class="text-end" style="width:120px;">Chuyển đi</th>
                <th class="text-end" style="width:110px;">Điều chỉnh</th>
                <th class="text-end" style="width:140px;">Cuối kỳ</th>
              </tr>
            </thead>
            <tbody id="qq-tbody">
              <tr><td colspan="11" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>
            </tbody>
            <tfoot id="qq-tfoot"></tfoot>
          </table>
        </div>
      </div>
      <div id="qq-pagination" class="mt-3 px-3 pb-3" style="display:none;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="qq-pagination-info"></div>
          <nav><ul class="pagination justify-content-center mb-0"></ul></nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="qq-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="qq-pagination-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Chi tiết quỹ (đặt trước các modal thao tác để modal mở từ trong chi tiết nằm đè lên trên) -->
  <div class="modal fade" id="qq-view-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <h5 class="modal-title mb-0" id="qq-view-title">Chi tiết quỹ</h5>
            <span class="badge bg-label-secondary border" id="qq-view-ma"></span>
            <span id="qq-view-loai"></span>
          </div>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;min-height:260px;">
          <div class="qq-loading" id="qq-view-loading"><div class="spinner-border text-primary" role="status"></div></div>
          <div id="qq-view-info"></div>
          <ul class="nav nav-tabs qq-view-tabs mt-3" role="tablist">
            <li class="nav-item"><button type="button" class="nav-link active" data-qq-tab="so-quy">Sổ quỹ</button></li>
            <li class="nav-item"><button type="button" class="nav-link" data-qq-tab="noi-bo">Chuyển tiền &amp; điều chỉnh <span class="badge bg-label-primary ms-1" id="qq-noi-bo-count">0</span></button></li>
            <li class="nav-item"><button type="button" class="nav-link" data-qq-tab="lich-su">Lịch sử</button></li>
          </ul>
          <div class="qq-view-pane pt-3" data-qq-pane="so-quy">
            <div class="d-flex flex-wrap align-items-end gap-2 mb-2">
              <div style="width:260px;">
                <label class="form-label small mb-1" for="qq-ledger-ky">Kỳ</label>
                <input type="text" class="form-control form-control-sm" id="qq-ledger-ky" placeholder="Chọn khoảng ngày" autocomplete="off" readonly>
              </div>
              <div class="qq-ledger-sum ms-auto" id="qq-ledger-sum"></div>
            </div>
            <div class="table-responsive qq-ledger-wrap">
              <table class="table table-sm table-bordered qq-lines mb-0">
                <thead><tr>
                  <th style="width:90px;">Ngày</th>
                  <th style="width:150px;">Chứng từ</th>
                  <th style="width:150px;">Nguồn</th>
                  <th>Diễn giải</th>
                  <th class="text-end" style="width:120px;">Thu</th>
                  <th class="text-end" style="width:120px;">Chi</th>
                  <th class="text-end" style="width:130px;">Số dư sau</th>
                  <th style="width:130px;">Người thực hiện</th>
                </tr></thead>
                <tbody id="qq-ledger-body"></tbody>
              </table>
            </div>
            <div class="d-flex justify-content-between align-items-center mt-2">
              <div class="small text-muted" id="qq-ledger-info"></div>
              <nav><ul class="pagination pagination-sm mb-0" id="qq-ledger-pager"></ul></nav>
            </div>
          </div>
          <div class="qq-view-pane pt-3 d-none" data-qq-pane="noi-bo">
            <div class="table-responsive">
              <table class="table table-sm table-bordered qq-lines mb-0">
                <thead><tr>
                  <th style="width:150px;">Mã</th>
                  <th style="width:90px;">Ngày</th>
                  <th style="width:140px;">Loại</th>
                  <th>Nội dung</th>
                  <th class="text-end" style="width:130px;">Số tiền</th>
                  <th style="width:150px;">Người tạo</th>
                  <th style="width:110px;"></th>
                </tr></thead>
                <tbody id="qq-noi-bo-body"></tbody>
              </table>
            </div>
          </div>
          <div class="qq-view-pane pt-3 d-none" data-qq-pane="lich-su" id="qq-history"></div>
        </div>
        <div class="modal-footer" id="qq-view-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        </div>
      </div>
    </div>
  </div>
  <?php if ($qq_can_manage): ?>
  <!-- Tạo / Sửa quỹ -->
  <div class="modal fade" id="qq-form-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <form id="qq-form" novalidate>
          <div class="modal-header">
            <h5 class="modal-title" id="qq-form-title">Thêm quỹ</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="position:relative;">
            <div class="qq-loading" id="qq-form-loading"><div class="spinner-border text-primary" role="status"></div></div>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label" for="qq-in-ma">Mã quỹ <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="qq-in-ma" maxlength="64" placeholder="VD: TM01" required>
              </div>
              <div class="col-md-8">
                <label class="form-label" for="qq-in-ten">Tên quỹ <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="qq-in-ten" maxlength="255" placeholder="VD: Tiền mặt công ty" required>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="qq-in-loai">Loại quỹ <span class="text-danger">*</span></label>
                <select class="form-select" id="qq-in-loai"></select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="qq-in-ql">Người quản lý</label>
                <select class="form-select" id="qq-in-ql"><option value="">Không chọn</option></select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="qq-in-so-du">Số dư đầu kỳ</label>
                <input type="text" class="form-control text-end money-mask" id="qq-in-so-du" inputmode="numeric" placeholder="0">
              </div>
              <div class="col-12">
                <label class="form-label" for="qq-in-ghi-chu">Ghi chú</label>
                <textarea class="form-control" id="qq-in-ghi-chu" rows="2" placeholder="Ghi chú (nếu có)"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" class="btn btn-primary" id="qq-form-save"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Chuyển tiền nội bộ -->
  <div class="modal fade" id="qq-transfer-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <form id="qq-transfer-form" novalidate>
          <div class="modal-header">
            <h5 class="modal-title">Chuyển tiền nội bộ</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="position:relative;">
            <div class="qq-loading" id="qq-transfer-loading"><div class="spinner-border text-primary" role="status"></div></div>
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="qq-tr-from">Quỹ chuyển <span class="text-danger">*</span></label>
                <select class="form-select" id="qq-tr-from"><option value="">Chọn quỹ</option></select>
                <div class="form-text" id="qq-tr-from-balance"></div>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="qq-tr-to">Quỹ nhận <span class="text-danger">*</span></label>
                <select class="form-select" id="qq-tr-to"><option value="">Chọn quỹ</option></select>
                <div class="form-text" id="qq-tr-to-balance"></div>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="qq-tr-amount">Số tiền <span class="text-danger">*</span></label>
                <input type="text" class="form-control text-end money-mask" id="qq-tr-amount" inputmode="numeric" placeholder="0">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="qq-tr-date">Ngày chuyển <span class="text-danger">*</span></label>
                <input type="text" class="form-control flatpickr-date date-mask" id="qq-tr-date" placeholder="dd/mm/yyyy" autocomplete="off">
              </div>
              <div class="col-12">
                <label class="form-label" for="qq-tr-note">Diễn giải</label>
                <input type="text" class="form-control" id="qq-tr-note" placeholder="VD: Nộp tiền mặt vào tài khoản">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" class="btn btn-primary" id="qq-transfer-save"><i class="ti tabler-arrows-exchange me-1"></i>Chuyển tiền</button>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Điều chỉnh số dư (kiểm quỹ) -->
  <div class="modal fade" id="qq-adjust-modal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <form id="qq-adjust-form" novalidate>
          <div class="modal-header">
            <div class="d-flex align-items-center gap-2">
              <h5 class="modal-title mb-0">Điều chỉnh số dư</h5>
              <span class="badge bg-label-secondary border" id="qq-adj-quy"></span>
            </div>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body" style="position:relative;">
            <div class="qq-loading" id="qq-adjust-loading"><div class="spinner-border text-primary" role="status"></div></div>
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label" for="qq-adj-date">Ngày kiểm quỹ <span class="text-danger">*</span></label>
                <input type="text" class="form-control flatpickr-date date-mask" id="qq-adj-date" placeholder="dd/mm/yyyy" autocomplete="off">
              </div>
              <div class="col-md-4">
                <label class="form-label">Số dư theo sổ (cuối ngày)</label>
                <input type="text" class="form-control text-end bg-light" id="qq-adj-book" readonly>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="qq-adj-actual">Số dư thực tế <span class="text-danger">*</span></label>
                <input type="text" class="form-control text-end money-mask" id="qq-adj-actual" inputmode="numeric" placeholder="0">
              </div>
              <div class="col-md-4">
                <label class="form-label">Chênh lệch</label>
                <input type="text" class="form-control text-end bg-light fw-semibold" id="qq-adj-diff" readonly>
              </div>
              <div class="col-md-8">
                <label class="form-label" for="qq-adj-reason">Lý do <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="qq-adj-reason" placeholder="VD: Khớp số dư theo sao kê ngân hàng">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
            <button type="submit" class="btn btn-warning" id="qq-adjust-save"><i class="ti tabler-adjustments-dollar me-1"></i>Lưu điều chỉnh</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <?php endif; ?>

</div>

<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Định mức khoán</h4>
  </div>

  <div class="card-body">
    <!-- Search + Actions -->
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-8 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="dmk-search" placeholder="Tìm theo điểm đầu, điểm cuối...">
          <button class="btn btn-primary" type="button" id="dmk-btn-search">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-12 col-md-4">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <?php if (api_has_permission('dinh_muc_khoan_create')): ?>
          <button type="button" class="btn btn-primary" id="dmk-btn-them">
            <i class="ti tabler-plus me-1"></i>Thêm định mức
          </button>
          <?php endif; ?>
          <button type="button" class="btn btn-icon btn-label-secondary" id="dmk-btn-reload">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="table-responsive">
      <table id="dmk-table" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:50px">#</th>
            <th>Điểm đầu</th>
            <th>Điểm cuối</th>
            <th style="width:90px">KM</th>
            <th style="width:120px">Trống</th>
            <th style="width:120px">Vỏ</th>
            <th style="width:120px">Hàng</th>
            <th style="width:60px;text-align:center !important">CN</th>
          </tr>
        </thead>
        <tbody id="dmk-tbody">
          <tr id="dmk-loading-row">
            <td colspan="8" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div id="dmk-pagination" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="dmk-pagination-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="dmk-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="dmk-pagination-total-pages"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Create/Edit Modal -->
<div class="modal fade" id="dmk-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered">
    <div class="modal-content">
      <form id="dmk-form" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="dmk-modal-title">Thêm định mức khoán</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div id="dmk-form-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
            <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:6rem;" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
          </div>

          <input type="hidden" name="nid" value="">

          <div class="row g-3">
            <div class="col-lg-6">
              <label class="form-label">Điểm đầu <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="dmk-diem-dau" name="diem_dau" placeholder="Chọn hoặc gõ tên bãi/kho/cảng — có thể thêm nhiều tên gọi cho cùng 1 điểm">
              <div class="invalid-feedback d-block d-none" id="dmk-diem-dau-error">Vui lòng nhập điểm đầu</div>
            </div>
            <div class="col-lg-6">
              <label class="form-label">Điểm cuối <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="dmk-diem-cuoi" name="diem_cuoi" placeholder="Chọn hoặc gõ tên bãi/kho/cảng — có thể thêm nhiều tên gọi cho cùng 1 điểm">
              <div class="invalid-feedback d-block d-none" id="dmk-diem-cuoi-error">Vui lòng nhập điểm cuối</div>
            </div>

            <div class="col-lg-3 col-6">
              <label class="form-label">Khoảng cách (km)</label>
              <input type="text" class="form-control" name="khoang_cach" inputmode="decimal">
            </div>
            <div class="col-lg-3 col-6">
              <label class="form-label">Trống</label>
              <input type="text" class="form-control money-mask" name="gia_trong" placeholder="0" inputmode="numeric">
            </div>
            <div class="col-lg-3 col-6">
              <label class="form-label">Vỏ</label>
              <input type="text" class="form-control money-mask" name="gia_vo" placeholder="0" inputmode="numeric">
            </div>
            <div class="col-lg-3 col-6">
              <label class="form-label">Hàng</label>
              <input type="text" class="form-control money-mask" name="gia_hang" placeholder="0" inputmode="numeric">
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="submit" class="btn btn-primary" id="dmk-btn-save"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>
        </div>
      </form>
    </div>
  </div>
</div>

<?php
/**
 * @file
 * Screen /cat-mooc: cont đang ở kho (hàng cảng), theo trạng thái cont.
 *
 * Giao diện giống screen hàng cảng nhưng là bản RIÊNG: mọi id/class dùng tiền tố `cm-`
 * và kiểu nằm trong ke_hoach_cat_mooc.css (sao chép từ hàng cảng), JS trong
 * ke_hoach_cat_mooc.js. Không chia sẻ selector với hàng cảng nên sửa bên nào cũng
 * không ảnh hưởng bên kia.
 */
?>
<div id="ke-hoach-cat-mooc-screen" class="cm-screen">
<div id="cm-list-app" class="cm-port-list-app">
  <div class="card cm-port-controls-card">
    <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
      <h4 class="card-title mb-0">Cont cắt mooc</h4>
    </div>
    <div class="card-body">
      <div class="cm-filter-bar mb-3" id="cm-filter">
        <div class="cm-filter-grid">
          <div class="cm-filter-field"><label class="form-label">Khách hàng</label><select class="select2 form-select cm-customer-filter-multiple" id="cm-filter-khach-hang" multiple></select></div>
          <div class="cm-filter-field"><label class="form-label">Địa chỉ kho</label><select class="form-select" id="cm-filter-dia-chi-kho"><option></option></select></div>
          <div class="cm-filter-field"><label class="form-label">Từ khóa</label><input type="text" class="form-control" id="cm-filter-keyword" placeholder="BKG, số cont, seal, bãi, cảng"></div>
          <div class="cm-filter-actions cm-filter-actions-row">
            <button class="btn btn-primary" type="button" id="cm-search-btn"><i class="ti tabler-search me-1"></i>Tìm</button>
            <button type="button" class="btn btn-label-secondary btn-reload waves-effect cm-port-filter-reset" title="Reset bộ lọc" aria-label="Reset bộ lọc"><i class="ti tabler-refresh"></i></button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="card cm-port-list-card">
    <div class="card-body p-0">
      <div class="cm-port-status-tabs-wrap">
        <ul class="nav nav-pills cm-port-status-tabs" id="cm-port-status-tabs" role="tablist">
          <li class="nav-item"><button type="button" class="nav-link active waves-effect waves-light" data-group="all" role="tab">Tất cả <span class="badge bg-label-primary ms-1" data-group-count="all">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-group="o_kho" role="tab">Ở kho <span class="badge bg-label-primary ms-1" data-group-count="o_kho">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-group="du_hang" role="tab">Đủ hàng <span class="badge bg-label-primary ms-1" data-group-count="du_hang">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-group="dang_keo_ve" role="tab">Đang kéo về <span class="badge bg-label-primary ms-1" data-group-count="dang_keo_ve">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-group="chua_cat_mooc" role="tab">Chưa cắt mooc <span class="badge bg-label-primary ms-1" data-group-count="chua_cat_mooc">0</span></button></li>
          <li class="nav-item"><button type="button" class="nav-link waves-effect waves-light" data-group="hoan_thanh" role="tab">Hoàn thành <span class="badge bg-label-primary ms-1" data-group-count="hoan_thanh">0</span></button></li>
        </ul>
      </div>
      <div class="cm-port-table-scroll">
        <div class="table-responsive">
          <table class="table table-bordered table-hover mb-0 cm-list-table">
            <colgroup>
              <col class="cm-col-stt">
              <col class="cm-col-date">
              <col class="cm-col-common">
              <col class="cm-col-container">
              <col class="cm-col-vehicle">
              <col class="cm-col-kho">
              <col class="cm-col-route">
              <col class="cm-col-keo-ve">
              <col class="cm-col-status">
            </colgroup>
            <thead class="table-light">
              <tr>
                <th>#</th>
                <th><button type="button" class="cm-date-sort-btn" id="cm-date-sort" data-direction="desc" title="Sắp xếp ngày: mới đến cũ" aria-label="Sắp xếp ngày: mới đến cũ"><span>Ngày KH</span><i class="ti tabler-sort-descending"></i></button></th>
                <th>T.T Chung</th>
                <th>Container</th>
                <th>Xe kéo lên</th>
                <th>Địa chỉ kho</th>
                <th>Bãi lấy/hạ</th>
                <th>Xe kéo về</th>
                <th>T.Thái</th>
              </tr>
            </thead>
            <tbody id="cm-list-body">
              <tr id="loading-row">
                <td colspan="9" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div id="cm-pagination-wrap" class="mt-3 px-3 pb-3" style="display:none;">
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div class="text-muted small" id="cm-pagination-info"></div>
          <nav><ul class="pagination justify-content-center mb-0"></ul></nav>
          <div class="d-flex align-items-center gap-2">
            <span class="text-muted small">Trang</span>
            <input type="text" class="form-control form-control-sm" id="cm-pagination-jump" style="width:60px;text-align:center;" inputmode="numeric">
            <span class="text-muted small" id="cm-pagination-total-pages"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</div>

<div class="modal fade" id="cm-create-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Tạo kế hoạch kéo về</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Đóng"></button>
      </div>
      <div class="modal-body position-relative">
        <div class="cm-loading-overlay" id="cm-create-loading" style="display:none;"><div class="spinner-border text-primary" role="status"></div></div>
        <div class="cm-create-cont" id="cm-create-cont"></div>
        <input type="hidden" id="cm-create-ref">
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Hình thức vận tải <span class="text-danger">*</span></label>
            <select class="form-select" id="cm-create-hinh-thuc">
              <option value="rut_mooc">Rút mooc</option>
              <option value="cat_keo">Cắt kéo</option>
              <option value="cat_keo_cheo">Cắt kéo chéo</option>
            </select>
          </div>
          <div class="col-md-6">
            <div class="row g-2">
              <div class="col-7">
                <label class="form-label">Ngày kế hoạch</label>
                <input type="text" class="form-control" id="cm-create-ngay" placeholder="dd/mm/yyyy" autocomplete="off">
              </div>
              <div class="col-5">
                <label class="form-label">Giờ</label>
                <select class="form-select" id="cm-create-gio">
                  <option value="">— Giờ —</option>
                  <?php for ($hour = 0; $hour < 24; $hour++): ?>
                    <option value="<?php print sprintf('%02d:00', $hour); ?>"><?php print sprintf('%02d:00', $hour); ?></option>
                  <?php endfor; ?>
                </select>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
            <select class="form-select" id="cm-create-khach-hang"><option></option></select>
          </div>
          <div class="col-md-6">
            <label class="form-label">Số booking / bill <span class="text-danger">*</span></label>
            <input type="text" class="form-control" id="cm-create-bkg" placeholder="BKG" autocomplete="off">
          </div>
          <div class="col-md-4">
            <label class="form-label">Bãi lấy</label>
            <select class="form-select" id="cm-create-bai-lay"><option></option></select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Địa chỉ đóng/ trả hàng (Kho) <span class="text-danger">*</span></label>
            <select class="form-select" id="cm-create-kho"><option></option></select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Bãi hạ</label>
            <select class="form-select" id="cm-create-bai-ha"><option></option></select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Đầu kéo</label>
            <select class="form-select" id="cm-create-dau-keo"><option></option></select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Lái xe</label>
            <select class="form-select" id="cm-create-lai-xe"><option></option></select>
          </div>
          <div class="col-md-4">
            <label class="form-label">Mooc</label>
            <select class="form-select" id="cm-create-mooc"><option></option></select>
          </div>
          <div class="col-12">
            <label class="form-label">Ghi chú</label>
            <input type="text" class="form-control" id="cm-create-ghi-chu" autocomplete="off">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Huỷ</button>
        <button type="button" class="btn btn-primary" id="cm-create-submit"><i class="ti tabler-device-floppy me-1"></i>Tạo kế hoạch</button>
      </div>
    </div>
  </div>
</div>

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
          <div class="cm-filter-field"><label class="form-label">Đủ hàng</label><select class="form-select" id="cm-filter-du-hang"><option></option><option value="1">Đã đủ hàng</option><option value="0">Chưa đủ hàng</option></select></div>
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

<style>
#table-han .badge.badge-qua-han { background-color: rgba(234,84,85,.18) !important; color: #ea5455 !important; }
#table-han .badge.badge-sap-het-han { background-color: rgba(255,159,67,.18) !important; color: #ff9f43 !important; }
#table-han .badge.badge-con-han { background-color: rgba(40,199,111,.18) !important; color: #28c76f !important; }
#table-han .badge.badge-chua-co { background-color: rgba(130,135,146,.18) !important; color: #828792 !important; }
</style>
<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title" id="han-page-title">Thông báo hạn</h4>
  </div>

  <div class="card-body">
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-han" placeholder="Tìm kiếm BKS, mã tài sản...">
          <button class="btn btn-primary" type="button" id="btn-search-han">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-2 mb-2 mb-md-0">
        <select class="form-select" id="filter-loai-pt">
          <option value="">Tất cả loại</option>
          <option value="dau_keo">Đầu kéo</option>
          <option value="mooc">Mooc</option>
        </select>
      </div>
      <div class="col-6 col-md-3 mb-2 mb-md-0">
        <select class="form-select" id="filter-trang-thai">
          <option value="">Tất cả trạng thái</option>
          <option value="qua_han">Quá hạn</option>
          <option value="sap_het_han">Sắp hết hạn</option>
          <option value="con_han">Còn hạn</option>
          <option value="chua_co">Chưa có thông tin</option>
        </select>
      </div>
      <div class="col-12 col-md-3">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-han">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table id="table-han" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:50px">#</th>
            <th>BKS</th>
            <th>Loại phương tiện</th>
            <th id="th-so">Số</th>
            <th id="th-han">Hạn</th>
            <th style="width:90px;text-align:center">Còn lại</th>
            <th style="width:130px;text-align:center">Trạng thái</th>
          </tr>
        </thead>
        <tbody id="table-han-tbody">
          <tr id="loading-row-han">
            <td colspan="7" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="pagination-han" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="pagination-info-han"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="pagination-jump-han" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="pagination-total-pages-han"></span>
        </div>
      </div>
    </div>
  </div>
</div>

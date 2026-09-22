<div class="card" id="ke-hoach-cont-app" data-mode="overall">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title mb-0">Quản lý cont</h4>
  </div>
  <div class="card-body">
    <div class="row mb-3 align-items-center g-2">
      <div class="col-12 col-md-3"><input type="text" class="form-control" id="cont-keyword" placeholder="BKG / Số cont"></div>
      <div class="col-12 col-md-2"><select class="form-select" id="cont-filter-khach-hang"><option value="">Khách hàng</option></select></div>
      <div class="col-12 col-md-2"><input type="text" class="form-control" id="cont-filter-kho" placeholder="Địa chỉ kho"></div>
      <div class="col-12 col-md-2"><input type="text" class="form-control" id="cont-filter-bai-lay" placeholder="Bãi lấy cont"></div>
      <div class="col-12 col-md-2"><input type="text" class="form-control" id="cont-filter-bai-ha" placeholder="Bãi hạ cont"></div>
      <div class="col-12 col-md-1 d-flex gap-2"><button type="button" class="btn btn-primary w-100" id="cont-search-btn"><i class="ti tabler-search"></i></button></div>
      <div class="col-12 col-md-2"><select class="form-select" id="cont-filter-du-hang"><option value="">Đủ hàng</option><option value="1">Đã đủ hàng</option><option value="0">Chưa đủ hàng</option></select></div>
      <div class="col-12 col-md-2 d-flex gap-2 justify-content-md-end justify-content-center"><button type="button" class="btn btn-label-secondary" id="cont-reload-btn"><i class="ti tabler-refresh me-1"></i>Khôi phục</button></div>
    </div>

    <div class="table-responsive">
      <table class="table table-bordered table-hover mb-0">
        <thead class="table-light">
          <tr>
            <th>#</th>
            <th>Khách hàng</th>
            <th>Số BKG</th>
            <th>Số cont</th>
            <th class="text-center">Đủ hàng</th>
            <th>Bãi hạ ngoài</th>
            <th class="text-center">Hạ cảng</th>
            <th>Kho</th>
            <th>H.Thức vận tải</th>
            <th>Trạng thái tổng hợp</th>
          </tr>
        </thead>
        <tbody id="cont-list-body">
          <tr><td colspan="10" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

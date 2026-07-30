<div class="card" id="ke-hoach-cont-app" data-mode="<?php print check_plain($mode); ?>">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title mb-0"><?php print $mode === 'cat_mooc' ? 'Danh sách cont đã cắt mooc' : 'Quản lý cont'; ?></h4>
  </div>
  <div class="card-body">
    <?php if ($mode === 'cat_mooc'): ?>
      <div class="row mb-3 align-items-center g-2">
        <div class="col-12 col-md-4 mb-2 mb-md-0">
          <div class="input-group">
            <input type="text" class="form-control" id="cont-keyword" placeholder="Tìm kiếm (BKG, cont, kho, bãi, cảng...)">
            <button class="btn btn-primary" type="button" id="cont-search-btn">
              <i class="ti tabler-search"></i> Tìm
            </button>
          </div>
        </div>
        <div class="col-6 col-md-3 mb-2 mb-md-0">
          <select class="form-select" id="cont-filter-khach-hang"><option value="">Khách hàng</option></select>
        </div>
        <div class="col-6 col-md-3 mb-2 mb-md-0">
          <select class="form-select" id="cont-filter-du-hang"><option value="">Tất cả trạng thái</option><option value="1">Đã đủ hàng</option><option value="0">Chưa đủ hàng</option></select>
        </div>
        <div class="col-12 col-md-2">
          <div class="d-flex gap-2 justify-content-md-end justify-content-center">
            <button type="button" class="btn btn-icon btn-label-secondary" id="cont-reload-btn"><i class="ti tabler-refresh"></i></button>
          </div>
        </div>
      </div>
    <?php else: ?>
      <div class="row mb-3 align-items-center g-2">
        <div class="col-12 col-md-3"><input type="text" class="form-control" id="cont-keyword" placeholder="BKG / Số cont"></div>
        <div class="col-12 col-md-2"><select class="form-select" id="cont-filter-khach-hang"><option value="">Khách hàng</option></select></div>
        <div class="col-12 col-md-2"><input type="text" class="form-control" id="cont-filter-kho" placeholder="Địa chỉ kho"></div>
        <div class="col-12 col-md-2"><input type="text" class="form-control" id="cont-filter-bai-lay" placeholder="Bãi lấy cont"></div>
        <div class="col-12 col-md-2"><input type="text" class="form-control" id="cont-filter-bai-ha" placeholder="Bãi hạ cont"></div>
        <div class="col-12 col-md-1 d-flex gap-2">
          <button type="button" class="btn btn-primary w-100" id="cont-search-btn"><i class="ti tabler-search"></i></button>
        </div>
        <div class="col-12 col-md-2"><select class="form-select" id="cont-filter-du-hang"><option value="">Đủ hàng</option><option value="1">Đã đủ hàng</option><option value="0">Chưa đủ hàng</option></select></div>
        <div class="col-12 col-md-2 d-flex gap-2 justify-content-md-end justify-content-center"><button type="button" class="btn btn-label-secondary" id="cont-reload-btn"><i class="ti tabler-refresh me-1"></i>Khôi phục</button></div>
      </div>
    <?php endif; ?>

    <div class="table-responsive">
      <table class="table table-bordered table-hover mb-0<?php print $mode === 'cat_mooc' ? ' khxh-list-table' : ''; ?>">
        <?php if ($mode === 'cat_mooc'): ?>
          <colgroup>
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
        <?php else: ?>
          <thead class="table-light">
            <tr>
              <th>#</th>
              <th>Khách hàng</th>
              <th>Số BKG</th>
              <th>Số cont</th>
              <th class="text-center">Đủ hàng</th>
              <th class="text-center">Hạ bãi ngoài</th>
              <th class="text-center">Hạ cảng</th>
              <th>Địa chỉ kho</th>
              <th>H.Thức</th>
              <th>T.Thái cont</th>
            </tr>
          </thead>
        <?php endif; ?>
        <tbody id="cont-list-body">
          <tr><td colspan="<?php print $mode === 'cat_mooc' ? '11' : '10'; ?>" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải dữ liệu...</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

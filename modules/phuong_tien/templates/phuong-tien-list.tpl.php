<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh sách phương tiện</h4>
    <a href="/phuong-tien/them-moi" class="btn btn-primary">
      <i class="ti tabler-plus me-1"></i>Thêm phương tiện
    </a>
  </div>
  <div class="card-body">
    <div class="table-responsive">
      <table id="table-phuong-tien" class="table table-bordered table-hover">
        <thead>
          <tr>
            <th>#</th>
            <th>BKS</th>
            <th>Loại</th>
            <th>Hãng xe</th>
            <th>Năm SX</th>
            <th>Trạng thái</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody id="table-phuong-tien-tbody">
          <tr id="loading-row">
            <td colspan="7" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>

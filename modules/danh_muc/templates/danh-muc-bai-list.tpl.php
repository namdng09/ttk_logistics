<div class="card">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
    <h4 class="card-title">Danh mục bãi</h4>
  </div>

  <div class="card-body">
    <div class="row mb-3 align-items-center">
      <div class="col-12 col-md-4 mb-2 mb-md-0">
        <div class="input-group">
          <input type="text" class="form-control" id="search-danh-muc-bai" placeholder="Tìm kiếm tên bãi, loại bãi...">
          <button class="btn btn-primary" type="button" id="btn-search-danh-muc-bai">
            <i class="ti tabler-search"></i> Tìm
          </button>
        </div>
      </div>
      <div class="col-6 col-md-4 mb-2 mb-md-0">
        <select class="form-select" id="filter-phan-loai-bai">
          <option value="">Tất cả loại bãi</option>
          <option value="Bãi lấy">Bãi lấy</option>
          <option value="Bãi hạ">Bãi hạ</option>
          <option value="Cảng xuất">Cảng xuất</option>
          <option value="Cảng hạ">Cảng hạ</option>
          <option value="Bãi hạ ngoài">Bãi hạ ngoài</option>
        </select>
      </div>
      <div class="col-6 col-md-4">
        <div class="d-flex gap-2 justify-content-md-end justify-content-center">
          <button type="button" class="btn btn-primary btn-them-danh-muc-bai" data-bs-toggle="modal" data-bs-target="#danh-muc-bai-modal">
            <i class="ti tabler-plus me-1"></i>Thêm bãi
          </button>
          <button type="button" class="btn btn-icon btn-label-secondary btn-reload-danh-muc-bai">
            <i class="ti tabler-refresh"></i>
          </button>
        </div>
      </div>
    </div>

    <div class="table-responsive">
      <table id="table-danh-muc-bai" class="table table-bordered table-hover">
        <thead class="table-light">
          <tr>
            <th style="width:60px;text-align:center !important">CN</th>
            <th style="width:50px">#</th>
            <th>Tên bãi</th>
            <th style="width:160px;">Loại bãi</th>
            <th style="width:320px;">Phụ phí</th>
          </tr>
        </thead>
        <tbody id="table-danh-muc-bai-tbody">
          <tr id="loading-row">
            <td colspan="5" class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Đang tải...</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div id="pagination-danh-muc-bai" class="mt-3" style="display:none;">
      <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
        <div class="text-muted small" id="pagination-bai-info"></div>
        <nav>
          <ul class="pagination justify-content-center mb-0"></ul>
        </nav>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">Trang</span>
          <input type="text" class="form-control form-control-sm" id="pagination-bai-jump" style="width:60px;text-align:center;" inputmode="numeric">
          <span class="text-muted small" id="pagination-bai-total-pages"></span>
        </div>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="danh-muc-bai-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-xl">
    <div class="modal-content">
      <form id="form-danh-muc-bai" class="needs-validation" novalidate>
        <div class="modal-header">
          <h5 class="modal-title" id="danh-muc-bai-modal-title">Thêm bãi</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" style="position:relative;">
          <div id="modal-bai-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
            <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:6rem;" role="status">
              <span class="visually-hidden">Đang tải...</span>
            </div>
          </div>
          <input type="hidden" name="nid" value="">

          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Tên bãi <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Nhập tên bãi">
              <div class="invalid-feedback">Vui lòng nhập tên bãi</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Loại bãi <span class="text-danger">*</span></label>
              <select class="form-select" name="phan_loai" required>
                <option value="">Chọn loại bãi</option>
                <option value="Bãi lấy">Bãi lấy</option>
                <option value="Bãi hạ">Bãi hạ</option>
                <option value="Cảng xuất">Cảng xuất</option>
                <option value="Cảng hạ">Cảng hạ</option>
                <option value="Bãi hạ ngoài">Bãi hạ ngoài</option>
              </select>
              <div class="invalid-feedback">Vui lòng chọn loại bãi</div>
            </div>
            <div class="col-12">
              <label class="form-label">Ghi chú</label>
              <textarea class="form-control" name="ghi_chu" rows="2" placeholder="Nhập ghi chú nếu có"></textarea>
            </div>

            <div class="col-12" id="phu-phi-section" style="display:none;">
              <hr class="my-2">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="form-label mb-0"><i class="ti tabler-coin me-2"></i>Phụ phí gợi ý</label>
                <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-phu-phi-bai">
                  <i class="ti tabler-plus me-1"></i>Thêm phụ phí
                </button>
              </div>
              <div id="phu-phi-bai-repeater"></div>
              <div class="form-text">Chỉ áp dụng cho Bãi lấy và Bãi hạ.</div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
          <button type="button" class="btn btn-primary btn-luu-danh-muc-bai">
            <i class="ti tabler-device-floppy me-1"></i> Lưu
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

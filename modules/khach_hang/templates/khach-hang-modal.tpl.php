<!-- Create/Edit/View Modal -->
<div class="modal fade" id="khach-hang-modal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="khach-hang-modal-title">Thêm khách hàng</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body" style="position:relative;">
        <div id="modal-loading" class="text-center py-4" style="position:absolute;inset:0;display:none;background:rgba(255,255,255,0.85);z-index:10;border-radius:0.375rem;">
          <div class="spinner-border text-primary" style="position:sticky;top:50%;margin-top:6rem;" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>
        <form id="form-khach-hang" class="needs-validation" novalidate>
          <input type="hidden" name="nid" value="">

          <div class="row g-3">
            <div class="col-lg-6">
              <label class="form-label">Tên công ty / Khách hàng <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ten" required placeholder="Công ty TNHH ABC">
              <div class="invalid-feedback">Vui lòng nhập tên</div>
            </div>
            <div class="col-lg-3">
              <label class="form-label">Tên ngắn gọn <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="ma_kh" required placeholder="ABC">
              <div class="invalid-feedback">Vui lòng nhập tên ngắn gọn</div>
            </div>
            <div class="col-lg-3">
              <label class="form-label">MST / CCCD <span class="text-danger">*</span></label>
              <input type="text" class="form-control" name="cccd_mst" required minlength="10" placeholder="Tối thiểu 10 ký tự">
              <div class="invalid-feedback">MST / CCCD bắt buộc và phải có ít nhất 10 ký tự</div>
            </div>

            <div class="col-lg-3">
              <label class="form-label">Phân loại <span class="text-danger">*</span></label>
              <input id="tagifyPhanLoai" class="form-control" name="phan_loai_tags" placeholder="Chọn phân loại" required>
              <div class="invalid-feedback">Vui lòng chọn phân loại</div>
            </div>
            <div class="col-lg-3">
              <label class="form-label">SĐT</label>
              <input type="tel" class="form-control" name="sdt" placeholder="0901234567" inputmode="numeric">
            </div>
            <div class="col-lg-3">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" name="email" placeholder="email@congty.vn">
            </div>
            <div class="col-lg-3">
              <label class="form-label">Ngày thành lập</label>
              <input type="text" class="form-control flatpickr-date date-mask" name="dob" placeholder="dd/MM/yyyy">
            </div>

            <div class="col-12">
              <label class="form-label">Địa chỉ</label>
              <input type="text" class="form-control" name="dia_chi" placeholder="Số nhà, phường, quận, thành phố">
            </div>
          </div>

          <div class="section mt-4 khach-hang-bank-section">
            <div class="section-head d-flex justify-content-between align-items-center mb-2">
              <label class="form-label mb-0 fw-bold khach-hang-section-title"><i class="ti tabler-building-bank me-2"></i>Thông tin ngân hàng</label>
              <button type="button" class="btn btn-sm btn-icon btn-primary text-white" id="btn-them-ngan-hang" title="Thêm ngân hàng">
                <i class="ti tabler-plus"></i>
              </button>
            </div>
            <div id="ngan-hang-repeater"></div>
          </div>

          <div class="section mt-4 khach-hang-contact-section">
            <div class="section-head d-flex justify-content-between align-items-center mb-2"><label class="form-label mb-0 fw-bold khach-hang-section-title"><i class="ti tabler-user me-2"></i>Người đại diện / Liên hệ</label><button type="button" class="btn btn-sm btn-icon btn-primary text-white" id="btn-them-lien-he" title="Thêm người liên hệ"><i class="ti tabler-plus"></i></button></div><div id="lien-he-repeater"></div>
          </div>

          <div class="section mt-4 mb-3 khach-hang-warehouse-pricing-section d-none">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="form-label mb-0 fw-bold"><i class="ti tabler-truck me-2"></i>Địa chỉ kho & Bảng giá cước vận chuyển</label>
              <button type="button" class="btn btn-sm btn-label-primary" id="btn-them-kho">
                <i class="ti tabler-plus me-1"></i>Thêm kho
              </button>
            </div>
            <div id="kho-list"></div>
          </div>

          <div class="row g-3 mt-1 mb-3">
            <div class="col-lg-6">
              <label class="form-label">NV Kinh doanh</label>
              <select id="nv-kinh-doanh-select" class="form-select" name="nv_kinh_doanh">
                <option value="">Chọn nhân viên</option>
              </select>
            </div>
            <div class="col-lg-6">
              <label class="form-label">Ghi chú</label>
              <input type="text" class="form-control" name="ghi_chu" placeholder="Ghi chú">
            </div>
          </div>
        </form>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button>
        <button type="button" class="btn btn-primary btn-luu-khach-hang">
          <i class="ti tabler-device-floppy me-1"></i> Lưu
        </button>
      </div>
    </div>
  </div>
</div>

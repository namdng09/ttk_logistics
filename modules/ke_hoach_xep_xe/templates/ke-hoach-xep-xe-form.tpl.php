<div class="card" id="ke-hoach-form-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center">
    <div class="d-flex align-items-center gap-2">
      <h4 class="card-title mb-0" id="form-title">Tạo kế hoạch xếp xe</h4>
      <span id="form-mode-badge" class="badge bg-label-success" style="display:none;">Đang sửa</span>
    </div>
  </div>

  <div class="card-body position-relative">
    <div class="loading-overlay" id="form-loading" style="display:none;">
      <div class="spinner-border text-primary"></div>
    </div>

    <form id="ke-hoach-form" class="row g-2 needs-validation" novalidate>
      <input type="hidden" id="nid-input" value="">

      <div class="col-md-4">
        <label class="form-label">Ngày <span class="text-danger">*</span></label>
        <input type="text" id="ngay-input" class="form-control flatpickr-date" required>
      </div>

      <div class="col-md-4">
        <label class="form-label">Khách hàng</label>
        <select id="nid_khach_hang-input" class="form-select">
          <option value="0">— Chọn —</option>
        </select>
      </div>

      <div class="col-md-4">
        <label class="form-label">Lái xe</label>
        <select id="nid_lai_xe-input" class="form-select">
          <option value="0">— Chọn —</option>
        </select>
      </div>

      <div class="col-md-4">
        <label class="form-label">Số BKG</label>
        <input type="text" id="so_bkg-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Địa chỉ kho</label>
        <input type="text" id="dia_chi_kho-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Loại cont</label>
        <input type="text" id="loai_cont-input" class="form-control" placeholder="VD: 20DC, 40HC…">
      </div>

      <div class="col-md-4">
        <label class="form-label">Số cont</label>
        <input type="text" id="so_cont-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Phương tiện</label>
        <select id="nid_phuong_tien-input" class="form-select">
          <option value="0">— Chọn —</option>
        </select>
      </div>

      <div class="col-md-4">
        <label class="form-label">Số seal chính</label>
        <input type="text" id="so_seal_chinh-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Số seal tạm</label>
        <input type="text" id="so_seal_tam-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Trạng thái vận chuyển</label>
        <select id="trang_thai_van_chuyen-input" class="form-select"></select>
      </div>

      <div class="col-md-4">
        <label class="form-label">Bãi lấy cont</label>
        <input type="text" id="bai_lay_cont-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Bãi hạ cont</label>
        <input type="text" id="bai_ha_cont-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Cảng xuất</label>
        <input type="text" id="cang_xuat-input" class="form-control">
      </div>

      <div class="col-md-4">
        <label class="form-label">Cut-off</label>
        <input type="text" id="cut_off-input" class="form-control flatpickr-datetime">
      </div>

      <div class="col-12 mt-3 text-end">
        <button type="submit" class="btn btn-primary waves-effect" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i> Lưu</button>
      </div>
    </form>
  </div>
</div>
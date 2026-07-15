<div class="card" id="ke-hoach-form-app">
  <div class="card-header d-flex flex-wrap justify-content-between align-items-center">
    <div class="d-flex align-items-center gap-2">
      <?php if ($mode === 'edit'): ?>
      <a href="/ke-hoach-xep-xe" class="btn btn-outline-secondary btn-sm waves-effect"><i class="icon-base ti tabler-arrow-left me-1"></i> Quay lại</a>
      <?php endif; ?>
      <h4 class="card-title mb-0" id="form-title"><?php print $mode === 'edit' ? 'Sửa' : 'Tạo'; ?> kế hoạch xếp xe</h4>
    </div>
  </div>

  <div class="card-body position-relative">
    <div class="loading-overlay" id="form-loading" style="display:none;">
      <div class="spinner-border text-primary"></div>
    </div>

    <form id="ke-hoach-form" class="row g-2" novalidate>
      <input type="hidden" id="nid-input" value="">

      <div class="col-md-4">
        <label class="form-label">Khách hàng <span class="text-danger">*</span></label>
        <select id="nid_khach_hang-input" class="form-select select2-searchable" style="width:100%" required>
          <option value="0">— Chọn —</option>
        </select>
        <div class="invalid-feedback">Vui lòng chọn khách hàng</div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Phương tiện <span class="text-danger">*</span></label>
        <select id="nid_phuong_tien-input" class="form-select select2-searchable" style="width:100%" required>
          <option value="0">— Chọn —</option>
        </select>
        <div class="invalid-feedback">Vui lòng chọn phương tiện</div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Số BKG <span class="text-danger">*</span></label>
        <div class="input-group">
          <input type="text" id="so_bkg-input" class="form-control" placeholder="Nhập số BKG" required>
          <button class="btn btn-outline-secondary" type="button" id="paste-bkg-btn" title="Dán từ clipboard">
            <i class="ti tabler-clipboard-copy"></i>
          </button>
        </div>
        <div class="invalid-feedback">Vui lòng nhập số BKG</div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Lái xe <span class="text-danger">*</span></label>
        <select id="nid_lai_xe-input" class="form-select select2-searchable" style="width:100%" required>
          <option value="0">— Chọn —</option>
        </select>
        <div class="invalid-feedback">Vui lòng chọn lái xe</div>
      </div>

      <div class="col-md-4">
        <label class="form-label">Địa chỉ kho</label>
        <select id="dia_chi_kho-input" class="form-select select2-searchable" style="width:100%">
          <option value="">— Chọn —</option>
        </select>
      </div>

      <div class="col-md-4">
        <label class="form-label">Loại cont</label>
        <select id="loai_cont-input" class="form-select select2-tags" style="width:100%">
          <option value="">Chọn/Nhập loại cont</option>
        </select>
      </div>

      <div class="col-md-4">
        <label class="form-label">Số cont</label>
        <input type="text" id="so_cont-input" class="form-control" placeholder="Nhập số container">
      </div>

      <div class="col-md-4">
        <label class="form-label">Số seal chính</label>
        <input type="text" id="so_seal_chinh-input" class="form-control" placeholder="Nhập số seal chính">
      </div>

      <div class="col-md-4">
        <label class="form-label">Số seal tạm</label>
        <input type="text" id="so_seal_tam-input" class="form-control" placeholder="Nhập số seal tạm">
      </div>

      <div class="col-md-4">
        <label class="form-label">Bãi lấy cont</label>
        <input type="text" id="bai_lay_cont-input" class="form-control" placeholder="Nhập bãi lấy container">
      </div>

      <div class="col-md-4">
        <label class="form-label">Bãi hạ cont</label>
        <input type="text" id="bai_ha_cont-input" class="form-control" placeholder="Nhập bãi hạ container">
      </div>

      <div class="col-md-4">
        <label class="form-label">Cảng xuất</label>
        <input type="text" id="cang_xuat-input" class="form-control" placeholder="Nhập cảng xuất">
      </div>

      <div class="col-md-4">
        <label class="form-label">Cut-off</label>
        <input type="text" id="cut_off-input" class="form-control flatpickr-datetime" placeholder="dd/mm/yyyy HH:MM">
      </div>

      <div class="col-md-4">
        <label class="form-label">Hình thức vận tải</label>
        <select id="hinh_thuc_van_tai-input" class="form-select">
          <option value="">— Chọn —</option>
          <option value="cat_keo">Cắt kéo</option>
          <option value="cat_keo_cheo">Cắt kéo chéo</option>
          <option value="tha_mooc">Thả mooc</option>
          <option value="rut_mooc">Rút mooc</option>
          <option value="dong_hang_trong_ngay">Đóng hàng trong ngày</option>
        </select>
      </div>

      <div class="col-12 mt-3 text-end">
        <?php if ($mode !== 'edit'): ?>
        <a href="/ke-hoach-xep-xe" class="btn btn-outline-secondary waves-effect me-1"><i class="icon-base ti tabler-list me-1"></i> Danh sách kế hoạch</a>
        <?php endif; ?>
        <?php if ($mode === 'edit'): ?>
        <a href="/ke-hoach-xep-xe" class="btn btn-outline-secondary waves-effect me-1">Huỷ</a>
        <?php endif; ?>
        <button type="button" class="btn btn-primary waves-effect" id="save-btn"><i class="icon-base ti tabler-device-floppy me-1"></i> Lưu</button>
      </div>
    </form>
  </div>
</div>

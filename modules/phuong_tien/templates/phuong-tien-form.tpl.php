<div class="card">
  <div class="card-header">
    <h4 class="card-title"><?php print $nid ? 'Cập nhật' : 'Thêm mới'; ?> phương tiện</h4>
  </div>
  <div class="card-body">
    <form id="form-phuong-tien" class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Biển kiểm soát <span class="text-danger">*</span></label>
        <input type="text" name="bks" class="form-control" required>
      </div>
      <div class="col-md-6">
        <label class="form-label">Mã tài sản</label>
        <input type="text" name="ma_tai_san" class="form-control">
      </div>
      <div class="col-md-4">
        <label class="form-label">Loại phương tiện</label>
        <input type="text" name="loai_phuong_tien" class="form-control">
      </div>
      <div class="col-md-4">
        <label class="form-label">Nhãn hiệu</label>
        <input type="text" name="hang_xe" class="form-control">
      </div>
      <div class="col-md-4">
        <label class="form-label">Năm sản xuất</label>
        <input type="number" name="nam_san_xuat" class="form-control">
      </div>
      <div class="col-md-4">
        <label class="form-label">Giá mua</label>
        <input type="text" name="gia_mua" class="form-control money-mask" placeholder="1.000.000">
      </div>
      <div class="col-md-4">
        <label class="form-label">Ngày mua</label>
        <input type="text" name="ngay_mua" class="form-control date-mask">
      </div>
      <div class="col-md-4">
        <label class="form-label">Số đăng kiểm</label>
        <input type="text" name="so_dang_kiem" class="form-control">
      </div>
      <div class="col-md-4">
        <label class="form-label">Hạn đăng kiểm</label>
        <input type="text" name="han_dang_kiem" class="form-control date-mask">
      </div>
      <div class="col-md-6">
        <label class="form-label">Số bảo hiểm thân vỏ</label>
        <input type="text" name="so_bao_hiem_than_vo" class="form-control">
      </div>
      <div class="col-md-6">
        <label class="form-label">Hạn bảo hiểm thân vỏ</label>
        <input type="text" name="han_bao_hiem_than_vo" class="form-control date-mask">
      </div>
      <div class="col-md-6">
        <label class="form-label">Số bảo hiểm TNDS</label>
        <input type="text" name="so_bao_hiem_tnds" class="form-control">
      </div>
      <div class="col-md-6">
        <label class="form-label">Hạn bảo hiểm TNDS</label>
        <input type="text" name="han_bao_hiem_tnds" class="form-control date-mask">
      </div>
      <div class="col-md-6">
        <label class="form-label">Ngày phù hiệu</label>
        <input type="text" name="ngay_phu_hieu" class="form-control date-mask">
      </div>
      <div class="col-md-6">
        <label class="form-label">Hạn phù hiệu</label>
        <input type="text" name="han_phu_hieu" class="form-control date-mask">
      </div>
      <div class="col-12">
        <div class="form-check">
          <input type="checkbox" name="hoat_dong" class="form-check-input" value="1" checked>
          <label class="form-check-label">Hoạt động</label>
        </div>
      </div>
      <div class="col-12 text-end">
        <a href="/phuong-tien" class="btn btn-secondary me-2">Huỷ</a>
        <button type="submit" class="btn btn-primary">Lưu</button>
      </div>
    </form>
  </div>
</div>

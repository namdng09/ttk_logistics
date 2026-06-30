const Map<String, String> customerLabels = {
  "field_ho_ten": "Họ tên",
  "field_ma_kh": "Mã KH",
  "field_dia_chi": "Địa chỉ",
  "field_dien_thoai": "Điện thoại",
  "field_mst": "MST",
  "field_email": "Email",
  "field_phi_hai_quan": "Phí hải quan",
  "field_phi_bao_hiem": "Phí bảo hiểm",
  "field_phi_luu_ca": "Phí lưu ca",
  "field_phi_cung_tinh_khac_tuyen": "Phí cùng tỉnh khác tuyến",
  "field_phi_hang_nang": "Phí hàng nặng",
  "field_phi_cung_tuyen_khac_tinh": "Phí cùng tuyến khác tỉnh",
  "field_cong_no": "Công nợ",
  "field_so_ngay_han_cong_no": "Hạn Công nợ (ngày)",
};
const Map<String, String> nhaXeLabels = {
  "title": "Tên nhà xe",
  "field_ho_ten": "Họ tên",
  "field_ma_kh": "Mã KH",
  "field_dia_chi": "Địa chỉ",
  "field_so_dien_thoai": "Điện thoại",
  "field_mst": "MST",
  "field_email": "Email",
  "field_phi_hai_quan": "Phí hải quan",
  "field_phi_bao_hiem": "Phí bảo hiểm",
  "field_phi_luu_ca": "Phí lưu ca",
  "field_phi_cung_tinh_khac_tuyen": "Phí cùng tỉnh khác tuyến",
  "field_phi_hang_nang": "Phí hàng nặng",
  "field_phi_cung_tuyen_khac_tinh": "Phí cùng tuyến khác tỉnh",
  "field_xe_nha": "Xe nhà",
};

Map<String, String> laiXeLabels = {
  "field_ten_lai_xe": "Tên lái xe",
  "field_dien_thoai": "Điện thoại",
  "field_ngay_sinh_time": "Ngày sinh",
  "field_dia_chi": "Địa chỉ",
  "field_loai_bang_lai": "Loại bằng lái",
  "field_hoat_dong": "Hoạt động",
  "field_ngay_cong": "Số ngày công",
  "field_bao_hiem": "Bảo hiểm",
  "field_luong_thang": "Lương tháng",
  "field_luong_ngay": "Lương ngày",
  "field_tien_an": "Tiền ăn",
};

Map<String, String> PhuongTienLabels = {
  "title": "Tên phương tiện",
  "field_bien_kiem_soat": "Biển kiểm soát",
  "field_tai_trong": "Tải trọng",
  "field_ghi_chu": "Ghi chú",
  "field_lai_xe": "Lái xe",
  "ten_lai_xe": "Tên lái xe", // 👈 thêm
  "field_hoat_dong": "Hoạt động",
  "field_dinh_muc_nhien_lieu": "Định mức nhiên liệu",
  "field_ngay_do_dau": "Ngày đổ dầu",
  "field_ngay_do_dau_time": "Ngày đổ dầu Time",
  "field_so_dau": "Số dầu",
  "field_km": "Số km",
  "field_ngay_dang_kiem": "Ngày đăng kiểm",
  "field_nha_xe": "Nhà xe",
  "ten_nha_xe": "Tên nhà xe", // 👈 thêm
  "field_trong_tai": "Trọng tải (tấn)",
  "field_the_tich": "Thể tích (CBM)",
  "field_loai_xe": "Loại xe",
};
String getLabel(String key) {
  return customerLabels[key] ?? key;
}

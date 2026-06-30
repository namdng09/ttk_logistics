class DonHang {
  int? nid;
  String? fieldBienKiemSoat;   // Biển kiểm soát
  String? fieldTenLaiXe;       // Tên lái xe
  int? fieldXe;                // Entity Reference -> Xe
  int? fieldLaiXe;             // Entity Reference -> Lái xe
  String? fieldDienThoai;      // Điện thoại
  String? fieldChiPhiJson;     // Chí phí Json (string dạng JSON)
  int? fieldLoiNhuan;          // Lợi nhuận (số nguyên)
  int? fieldNgayVanChuyen;     // Ngày vận chuyển (timestamp int)
  String? fieldLoaiXe;         // Loại xe (text)
  String? fieldCungDuongJson;  // Cung đường (JSON string)
  int? fieldKhachHang;         // Entity Reference -> Khách hàng
  int? fieldNgayGioTra;        // Ngày giờ trả (timestamp int)
  String? fieldTrangThai;      // Trạng thái (danh sách văn bản)
  String? fieldLichSuTrangThai;// Lịch sử trạng thái (văn bản dài)

  DonHang({
    this.nid,
    this.fieldBienKiemSoat,
    this.fieldTenLaiXe,
    this.fieldXe,
    this.fieldLaiXe,
    this.fieldDienThoai,
    this.fieldChiPhiJson,
    this.fieldLoiNhuan,
    this.fieldNgayVanChuyen,
    this.fieldLoaiXe,
    this.fieldCungDuongJson,
    this.fieldKhachHang,
    this.fieldNgayGioTra,
    this.fieldTrangThai,
    this.fieldLichSuTrangThai,
  });

  factory DonHang.fromJson(Map<String, dynamic> json) {
    return DonHang(
      nid: int.tryParse(json['nid']?.toString() ?? ''),
      fieldBienKiemSoat: json['field_bien_kiem_soat'],
      fieldTenLaiXe: json['field_ten_lai_xe'],
      fieldXe: int.tryParse(json['field_xe']?.toString() ?? ''),
      fieldLaiXe: int.tryParse(json['field_lai_xe']?.toString() ?? ''),
      fieldDienThoai: json['field_dien_thoai'],
      fieldChiPhiJson: json['field_chi_phi_json'],
      fieldLoiNhuan: int.tryParse(json['field_loi_nhuan']?.toString() ?? ''),
      fieldNgayVanChuyen: int.tryParse(json['field_ngay_van_chuyen']?.toString() ?? ''),
      fieldLoaiXe: json['field_loai_xe'],
      fieldCungDuongJson: json['field_cung_duong_json'],
      fieldKhachHang: int.tryParse(json['field_khach_hang']?.toString() ?? ''),
      fieldNgayGioTra: int.tryParse(json['field_ngay_gio_tra']?.toString() ?? ''),
      fieldTrangThai: json['field_trang_thai'],
      fieldLichSuTrangThai: json['field_lich_su_trang_thai'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "nid": nid,
      "field_bien_kiem_soat": fieldBienKiemSoat,
      "field_ten_lai_xe": fieldTenLaiXe,
      "field_xe": fieldXe,
      "field_lai_xe": fieldLaiXe,
      "field_dien_thoai": fieldDienThoai,
      "field_chi_phi_json": fieldChiPhiJson,
      "field_loi_nhuan": fieldLoiNhuan,
      "field_ngay_van_chuyen": fieldNgayVanChuyen,
      "field_loai_xe": fieldLoaiXe,
      "field_cung_duong_json": fieldCungDuongJson,
      "field_khach_hang": fieldKhachHang,
      "field_ngay_gio_tra": fieldNgayGioTra,
      "field_trang_thai": fieldTrangThai,
      "field_lich_su_trang_thai": fieldLichSuTrangThai,
    };
  }
}

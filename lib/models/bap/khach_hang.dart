class KhachHang {
  final int nid;
  final String hoTen;
  final String? maKh;
  final String? diaChi;
  final String? dienThoai;
  final String? mst;
  final String? email;
  final int? field_so_ngay_han_cong_no;

  final String? phiHaiQuan;
  final String? cuocVanTai;
  final String? phiBaoHiem;
  final String? phiLuuCa;
  final String? phiCungTinhKhacTuyen;
  final String? phiHangNang;
  final String? phiCungTuyenKhacTinh;
  final String? congNo;

  KhachHang({
    required this.nid,
    required this.hoTen,
    this.maKh,
    this.diaChi,
    this.dienThoai,
    this.mst,
    this.email,
    this.phiHaiQuan,
    this.cuocVanTai,
    this.phiBaoHiem,
    this.phiLuuCa,
    this.phiCungTinhKhacTuyen,
    this.phiHangNang,
    this.phiCungTuyenKhacTinh,
    this.congNo,
    this.field_so_ngay_han_cong_no
  });

  factory KhachHang.fromJson(Map<String, dynamic> json) {
    return KhachHang(
      nid: json['nid'] ?? 0,
      hoTen: json['field_ho_ten'] ?? "",
      maKh: json['field_ma_kh'],
      diaChi: json['field_dia_chi'],
      dienThoai: json['field_dien_thoai'],
      mst: json['field_mst'],
      email: json['field_email'],
      phiHaiQuan: json['field_phi_hai_quan']?.toString(),
      cuocVanTai: json['field_cuoc_van_tai']?.toString(),
      phiBaoHiem: json['field_phi_bao_hiem']?.toString(),
      phiLuuCa: json['field_phi_luu_ca']?.toString(),
      phiCungTinhKhacTuyen: json['field_phi_cung_tinh_khac_tuyen']?.toString(),
      phiHangNang: json['field_phi_hang_nang']?.toString(),
      phiCungTuyenKhacTinh: json['field_phi_cung_tuyen_khac_tinh']?.toString(),
      congNo: json['field_cong_no']?.toString(),
      field_so_ngay_han_cong_no: int.tryParse(json['field_so_ngay_han_cong_no']!.toString()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "nid": nid,
      "field_ho_ten": hoTen,
      "field_ma_kh": maKh,
      "field_dia_chi": diaChi,
      "field_dien_thoai": dienThoai,
      "field_mst": mst,
      "field_email": email,
      "field_phi_hai_quan": phiHaiQuan,
      "field_cuoc_van_tai": cuocVanTai,
      "field_phi_bao_hiem": phiBaoHiem,
      "field_phi_luu_ca": phiLuuCa,
      "field_phi_cung_tinh_khac_tuyen": phiCungTinhKhacTuyen,
      "field_phi_hang_nang": phiHangNang,
      "field_phi_cung_tuyen_khac_tinh": phiCungTuyenKhacTinh,
      "field_cong_no": congNo,
      "field_so_ngay_han_cong_no": field_so_ngay_han_cong_no,
    };
  }

  Map<String, String> customerLabels = {
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
    "field_so_ngay_han_cong_no": "Số ngày Công nợ",
  };

}

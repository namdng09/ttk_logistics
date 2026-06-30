class NhaXe {
  final int nid;
  final String title;                // Tên nhà xe
  final String? diaChi;              // Địa chỉ
  final String? soDienThoai;         // Số điện thoại
  final String? email;               // Email
  final String? mst;                 // Mã số thuế
  final String? nguoiDaiDien;        // Người đại diện
  final String? chucVuNguoiDaiDien;  // Chức vụ người đại diện
  final String? dienThoaiNguoiDaiDien; // SĐT người đại diện
  final String? thongTinTaiKhoan;    // Thông tin tài khoản

  final String? hoatDong;            // Hoạt động (status)
  final String? cuocVanTai;          // Cước vận tải
  final String? phiHaiQuan;          // Phí hải quan
  final String? phiBaoHiem;          // Phí bảo hiểm
  final String? phiLuuCa;            // Phí lưu ca
  final String? phiCungTinhKhacTuyen;// Phí cùng tỉnh khác tuyến
  final String? phiHangNang;         // Phí hàng nặng
  final String? phiCungTuyenKhacTinh;// Phí cùng tuyến khác tỉnh
  final double? field_cong_no;// Phí cùng tuyến khác tỉnh

  final bool xeNha;                  // Xe nhà (true/false)

  NhaXe({
    required this.nid,
    required this.title,
    this.diaChi,
    this.soDienThoai,
    this.email,
    this.mst,
    this.nguoiDaiDien,
    this.chucVuNguoiDaiDien,
    this.dienThoaiNguoiDaiDien,
    this.thongTinTaiKhoan,
    this.hoatDong,
    this.cuocVanTai,
    this.phiHaiQuan,
    this.phiBaoHiem,
    this.phiLuuCa,
    this.phiCungTinhKhacTuyen,
    this.phiHangNang,
    this.phiCungTuyenKhacTinh,
    this.field_cong_no,
    this.xeNha = true,
  });

  factory NhaXe.fromJson(Map<String, dynamic> json) {
    return NhaXe(
      nid: json['nid'] ?? 0,
      title: json['title'] ?? "",
      diaChi: json['field_dia_chi'],
      soDienThoai: json['field_so_dien_thoai'],
      email: json['field_email'],
      mst: json['field_mst'],
      nguoiDaiDien: json['field_nguoi_dai_dien'],
      chucVuNguoiDaiDien: json['field_chuc_vu_nguoi_dai_dien'],
      dienThoaiNguoiDaiDien: json['field_dien_thoai_nguoi_dai_dien'],
      thongTinTaiKhoan: json['field_thong_tin_tai_khoan'],
      hoatDong: json['field_hoat_dong'],
      cuocVanTai: json['field_cuoc_van_tai']?.toString(),
      phiHaiQuan: json['field_phi_hai_quan']?.toString(),
      phiBaoHiem: json['field_phi_bao_hiem']?.toString(),
      phiLuuCa: json['field_phi_luu_ca']?.toString(),
      phiCungTinhKhacTuyen: json['field_phi_cung_tinh_khac_tuyen']?.toString(),
      phiHangNang: json['field_phi_hang_nang']?.toString(),
      phiCungTuyenKhacTinh: json['field_phi_cung_tuyen_khac_tinh']?.toString(),
      field_cong_no: double.tryParse(json['field_cong_no'].toString()),
      xeNha: json['field_xe_nha'] == true ||
          json['field_xe_nha'] == 1 ||
          json['field_xe_nha'] == "1",
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "nid": nid,
      "title": title,
      "field_dia_chi": diaChi,
      "field_so_dien_thoai": soDienThoai,
      "field_email": email,
      "field_mst": mst,
      "field_nguoi_dai_dien": nguoiDaiDien,
      "field_chuc_vu_nguoi_dai_dien": chucVuNguoiDaiDien,
      "field_dien_thoai_nguoi_dai_dien": dienThoaiNguoiDaiDien,
      "field_thong_tin_tai_khoan": thongTinTaiKhoan,
      "field_hoat_dong": hoatDong,
      "field_cuoc_van_tai": cuocVanTai,
      "field_phi_hai_quan": phiHaiQuan,
      "field_phi_bao_hiem": phiBaoHiem,
      "field_phi_luu_ca": phiLuuCa,
      "field_phi_cung_tinh_khac_tuyen": phiCungTinhKhacTuyen,
      "field_phi_hang_nang": phiHangNang,
      "field_phi_cung_tuyen_khac_tinh": phiCungTuyenKhacTinh,
      "field_xe_nha": xeNha ? 1 : 0,
      "field_cong_no": field_cong_no
    };
  }
}

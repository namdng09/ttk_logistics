import 'package:ttk_logistics/helper/extensions/extensions.dart';

class LaiXe {
  final int nid;
  final String? tenLaiXe;             // Tên lái xe
  final String? dienThoai;            // Điện thoại
  final String? ngaySinh;             // Ngày sinh
  final String? diaChi;               // Địa chỉ
  final String? loaiBangLai;          // Loại bằng lái
  final String? hoatDong;             // Hoạt động
  final double? ngayCong;             // Số ngày công
  final double? baoHiem;              // Bảo hiểm
  final double? luongThang;           // Lương tháng
  final double? luongNgay;            // Lương ngày
  final double? tienAn;            // Lương ngày

  LaiXe({
    required this.nid,
    this.tenLaiXe,
    this.dienThoai,
    this.ngaySinh,
    this.diaChi,
    this.loaiBangLai,
    this.hoatDong,
    this.ngayCong,
    this.baoHiem,
    this.luongThang,
    this.luongNgay,
    this.tienAn,
  });

  factory LaiXe.fromJson(Map<String, dynamic> json) {
    return LaiXe(
      nid: json['nid'] ?? 0,
      tenLaiXe: json['field_ten_lai_xe'],
      dienThoai: json['field_dien_thoai'],
      ngaySinh: json['field_ngay_sinh_time'],
      diaChi: json['field_dia_chi'],
      loaiBangLai: json['field_loai_bang_lai'],
      hoatDong: json['field_hoat_dong'],
      ngayCong: json['field_ngay_cong']!.toString().toDouble(),
      baoHiem: json['field_bao_hiem']?.toString().toDouble(),
      luongThang: json['field_luong_thang']?.toString().toDouble(),
      luongNgay: json['field_luong_ngay']?.toString().toDouble(),
      tienAn: json['field_tien_an']?.toString().toDouble()
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "nid": nid,
      "field_ten_lai_xe": tenLaiXe,
      "field_dien_thoai": dienThoai,
      "field_ngay_sinh_time": ngaySinh,
      "field_dia_chi": diaChi,
      "field_loai_bang_lai": loaiBangLai,
      "field_hoat_dong": hoatDong,
      "field_ngay_cong": ngayCong,
      "field_bao_hiem": baoHiem,
      "field_luong_thang": luongThang,
      "field_tien_an": tienAn,
      "field_luong_ngay": luongNgay,
    };
  }
}

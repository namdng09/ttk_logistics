class PhuongTien {
  final int nid;
  final String title; // Tên phương tiện
  final String? bienKiemSoat;
  final String? taiTrong;
  final String? ghiChu;
  final String? laiXe; // Entity Reference ID
  final String? tenLaiXe; // 👈 hiển thị tên lái xe
  final bool? hoatDong;
  final double? dinhMucNhienLieu;
  final String? ngayDoDau; // yyyy-MM-dd
  final String? ngayDoDauTime; // timestamp hoặc int string
  final double? soDau;
  final double? km;
  final String? ngayDangKiem;
  final String? nhaXe; // Entity Reference ID
  final String? tenNhaXe; // 👈 hiển thị tên nhà xe
  final double? trongTai;
  final double? theTich;
  final String? loaiXe;

  PhuongTien({
    required this.nid,
    required this.title,
    this.bienKiemSoat,
    this.taiTrong,
    this.ghiChu,
    this.laiXe,
    this.tenLaiXe,
    this.hoatDong,
    this.dinhMucNhienLieu,
    this.ngayDoDau,
    this.ngayDoDauTime,
    this.soDau,
    this.km,
    this.ngayDangKiem,
    this.nhaXe,
    this.tenNhaXe,
    this.trongTai,
    this.theTich,
    this.loaiXe,
  });

  factory PhuongTien.fromJson(Map<String, dynamic> json) {
    return PhuongTien(
      nid: int.tryParse(json['nid']?.toString() ?? '0') ?? 0,
      title: json['title'] ?? '',
      bienKiemSoat: json['field_bien_kiem_soat'],
      taiTrong: json['field_tai_trong'],
      ghiChu: json['field_ghi_chu'],
      laiXe: json['field_lai_xe'],
      tenLaiXe: json['ten_lai_xe'], // 👈 thêm
      hoatDong: json['field_hoat_dong'] == true || json['field_hoat_dong'] == 1,
      dinhMucNhienLieu:
      double.tryParse(json['field_dinh_muc_nhien_lieu']?.toString() ?? ''),
      ngayDoDau: json['field_ngay_do_dau'],
      ngayDoDauTime: json['field_ngay_do_dau_time']?.toString(),
      soDau: double.tryParse(json['field_so_dau']?.toString() ?? ''),
      km: double.tryParse(json['field_km']?.toString() ?? ''),
      ngayDangKiem: json['field_ngay_dang_kiem'],
      nhaXe: json['field_nha_xe'],
      tenNhaXe: json['ten_nha_xe'], // 👈 thêm
      trongTai: double.tryParse(json['field_trong_tai']?.toString() ?? ''),
      theTich: double.tryParse(json['field_the_tich']?.toString() ?? ''),
      loaiXe: json['field_loai_xe'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "nid": nid,
      "title": title,
      "field_bien_kiem_soat": bienKiemSoat,
      "field_tai_trong": taiTrong,
      "field_ghi_chu": ghiChu,
      "field_lai_xe": laiXe,
      "ten_lai_xe": tenLaiXe, // 👈 thêm
      "field_hoat_dong": hoatDong == true ? 1 : 0,
      "field_dinh_muc_nhien_lieu": dinhMucNhienLieu,
      "field_ngay_do_dau": ngayDoDau,
      "field_ngay_do_dau_time": ngayDoDauTime,
      "field_so_dau": soDau,
      "field_km": km,
      "field_ngay_dang_kiem": ngayDangKiem,
      "field_nha_xe": nhaXe,
      "ten_nha_xe": tenNhaXe, // 👈 thêm
      "field_trong_tai": trongTai,
      "field_the_tich": theTich,
      "field_loai_xe": loaiXe,
    };
  }
}

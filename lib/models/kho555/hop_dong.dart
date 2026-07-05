import 'dart:convert';

class BenThongTin {
  final int nid;
  final String title;
  final String phanLoai;
  final String tenGanGon;
  final String soDienThoai;
  final String maSoThueCccd;
  final String diaChi;
  final String ghiChu;

  BenThongTin({
    required this.nid,
    required this.title,
    this.phanLoai = '',
    this.tenGanGon = '',
    this.soDienThoai = '',
    this.maSoThueCccd = '',
    this.diaChi = '',
    this.ghiChu = '',
  });

  factory BenThongTin.fromJson(Map<String, dynamic> json) {
    return BenThongTin(
      nid: int.tryParse(json['nid']?.toString() ?? '') ?? 0,
      title: json['title']?.toString() ?? '',
      phanLoai: json['phan_loai']?.toString() ?? '',
      tenGanGon: json['ten_gan_gon']?.toString() ?? '',
      soDienThoai: json['so_dien_thoai']?.toString() ?? '',
      maSoThueCccd: json['ma_so_thue_cccd']?.toString() ?? '',
      diaChi: json['dia_chi']?.toString() ?? '',
      ghiChu: json['ghi_chu']?.toString() ?? '',
    );
  }

  String get displayShort => tenGanGon.isNotEmpty ? tenGanGon : title;
}

class HopDong {
  final int nid;
  final String title;
  final int hoatDong;

  final String soHopDong;
  final String ngayHopDong;
  final String hanHopDong;
  final int nidKhachHang;
  final int nidNhanVienKinhDoanh;
  final String ghiChu;
  final BenThongTin? khachHang;
  final BenThongTin? nhanVienKinhDoanh;

  HopDong({
    required this.nid,
    required this.title,
    required this.hoatDong,
    this.soHopDong = '',
    this.ngayHopDong = '',
    this.hanHopDong = '',
    this.nidKhachHang = 0,
    this.nidNhanVienKinhDoanh = 0,
    this.ghiChu = '',
    this.khachHang,
    this.nhanVienKinhDoanh,
  });

  factory HopDong.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);

    BenThongTin? kh;
    if (json['khach_hang'] is Map) {
      kh = BenThongTin.fromJson(Map<String, dynamic>.from(json['khach_hang']));
    }

    BenThongTin? nvkd;
    if (json['nhan_vien_kinh_doanh'] is Map) {
      nvkd = BenThongTin.fromJson(Map<String, dynamic>.from(json['nhan_vien_kinh_doanh']));
    }

    return HopDong(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? '',
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
      soHopDong: _valueOf(info, ['so_hop_dong']),
      ngayHopDong: _valueOf(info, ['ngay_hop_dong']),
      hanHopDong: _valueOf(info, ['han_hop_dong']),
      nidKhachHang: _toInt(info['nid_ben_thu_ba']),
      nidNhanVienKinhDoanh: _toInt(info['nid_nhan_vien_kinh_doanh']),
      ghiChu: _valueOf(info, ['ghi_chu']),
      khachHang: kh,
      nhanVienKinhDoanh: nvkd,
    );
  }

  Map<String, dynamic> toThongTinJson() {
    return {
      'so_hop_dong': soHopDong,
      'ngay_hop_dong': ngayHopDong,
      'han_hop_dong': hanHopDong,
      'nid_ben_thu_ba': nidKhachHang,
      'nid_nhan_vien_kinh_doanh': nidNhanVienKinhDoanh,
      'ghi_chu': ghiChu,
    };
  }

  bool matches(String keyword) {
    final q = keyword.trim().toLowerCase();
    if (q.isEmpty) return true;
    return title.toLowerCase().contains(q) ||
        soHopDong.toLowerCase().contains(q) ||
        ngayHopDong.toLowerCase().contains(q) ||
        hanHopDong.toLowerCase().contains(q) ||
        ghiChu.toLowerCase().contains(q) ||
        (khachHang?.title.toLowerCase().contains(q) ?? false) ||
        (khachHang?.tenGanGon.toLowerCase().contains(q) ?? false) ||
        (nhanVienKinhDoanh?.title.toLowerCase().contains(q) ?? false) ||
        (nhanVienKinhDoanh?.tenGanGon.toLowerCase().contains(q) ?? false);
  }

  static Map<String, dynamic> _decodeThongTinJson(dynamic value) {
    if (value == null) return {};
    if (value is Map<String, dynamic>) return Map<String, dynamic>.from(value);
    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }

    final raw = value.toString().trim();
    if (raw.isEmpty) return {};

    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) {
        return decoded.map((key, val) => MapEntry(key.toString(), val));
      }
    } catch (_) {}

    return {};
  }

  static String _valueOf(Map<String, dynamic> source, List<String> keys) {
    for (final key in keys) {
      if (source.containsKey(key)) return source[key]?.toString() ?? '';
    }
    return '';
  }

  static int _toInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? defaultValue;
  }
}

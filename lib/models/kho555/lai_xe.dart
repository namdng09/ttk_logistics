import 'dart:convert';

class LaiXe {
  final int nid;
  final String title;
  final int hoatDong;

  final String maNhanVien;
  final String sdt;
  final String cccd;
  final String ngayCap;
  final String noiCap;
  final String hanCccd;
  final String soBangLai;
  final String loaiBangLai;
  final String hanBangLai;
  final String ngayNhanViec;
  final String soTkNganHang;
  final String nganHang;

  LaiXe({
    required this.nid,
    required this.title,
    required this.hoatDong,
    this.maNhanVien = '',
    this.sdt = '',
    this.cccd = '',
    this.ngayCap = '',
    this.noiCap = '',
    this.hanCccd = '',
    this.soBangLai = '',
    this.loaiBangLai = '',
    this.hanBangLai = '',
    this.ngayNhanViec = '',
    this.soTkNganHang = '',
    this.nganHang = '',
  });

  factory LaiXe.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);

    return LaiXe(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? '',
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
      maNhanVien: _valueOf(info, ['ma_nhan_vien']),
      sdt: _valueOf(info, ['sdt']),
      cccd: _valueOf(info, ['cccd']),
      ngayCap: _valueOf(info, ['ngay_cap']),
      noiCap: _valueOf(info, ['noi_cap']),
      hanCccd: _valueOf(info, ['han_cccd']),
      soBangLai: _valueOf(info, ['so_bang_lai']),
      loaiBangLai: _valueOf(info, ['loai_bang_lai']),
      hanBangLai: _valueOf(info, ['han_bang_lai']),
      ngayNhanViec: _valueOf(info, ['ngay_nhan_viec']),
      soTkNganHang: _valueOf(info, ['so_tk_ngan_hang']),
      nganHang: _valueOf(info, ['ngan_hang']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nid': nid,
      'title': title,
      'field_thong_tin_json': jsonEncode(toThongTinJson()),
      'field_hoat_dong': hoatDong,
    };
  }

  Map<String, dynamic> toThongTinJson() {
    return {
      'ma_nhan_vien': maNhanVien,
      'sdt': sdt,
      'cccd': cccd,
      'ngay_cap': ngayCap,
      'noi_cap': noiCap,
      'han_cccd': hanCccd,
      'so_bang_lai': soBangLai,
      'loai_bang_lai': loaiBangLai,
      'han_bang_lai': hanBangLai,
      'ngay_nhan_viec': ngayNhanViec,
      'so_tk_ngan_hang': soTkNganHang,
      'ngan_hang': nganHang,
    };
  }

  bool matches(String keyword) {
    final q = keyword.trim().toLowerCase();
    if (q.isEmpty) return true;
    return title.toLowerCase().contains(q) ||
        maNhanVien.toLowerCase().contains(q) ||
        sdt.toLowerCase().contains(q) ||
        cccd.toLowerCase().contains(q) ||
        soBangLai.toLowerCase().contains(q);
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

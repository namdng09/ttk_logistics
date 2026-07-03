import 'dart:convert';

class PhuongTien {
  final int nid;
  final String title;
  final int hoatDong;

  final String maTaiSan;
  final String loaiPhuongTien;
  final String hangXe;
  final int namSanXuat;
  final double giaMua;
  final String ngayMua;
  final String soDangKiem;
  final String hanDangKiem;
  final String soBaoHiemThanVo;
  final String hanBaoHiemThanVo;
  final String soBaoHiemTnds;
  final String hanBaoHiemTnds;
  final String ngayPhuHieu;
  final String hanPhuHieu;

  PhuongTien({
    required this.nid,
    required this.title,
    required this.hoatDong,
    this.maTaiSan = '',
    this.loaiPhuongTien = '',
    this.hangXe = '',
    this.namSanXuat = 0,
    this.giaMua = 0,
    this.ngayMua = '',
    this.soDangKiem = '',
    this.hanDangKiem = '',
    this.soBaoHiemThanVo = '',
    this.hanBaoHiemThanVo = '',
    this.soBaoHiemTnds = '',
    this.hanBaoHiemTnds = '',
    this.ngayPhuHieu = '',
    this.hanPhuHieu = '',
  });

  factory PhuongTien.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);

    return PhuongTien(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? '',
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
      maTaiSan: _valueOf(info, ['ma_tai_san']),
      loaiPhuongTien: _valueOf(info, ['loai_phuong_tien']),
      hangXe: _valueOf(info, ['hang_xe']),
      namSanXuat: _toInt(_valueOf(info, ['nam_san_xuat'])),
      giaMua: _toDouble(_valueOf(info, ['gia_mua'])),
      ngayMua: _valueOf(info, ['ngay_mua']),
      soDangKiem: _valueOf(info, ['so_dang_kiem']),
      hanDangKiem: _valueOf(info, ['han_dang_kiem']),
      soBaoHiemThanVo: _valueOf(info, ['so_bao_hiem_than_vo']),
      hanBaoHiemThanVo: _valueOf(info, ['han_bao_hiem_than_vo']),
      soBaoHiemTnds: _valueOf(info, ['so_bao_hiem_tnds']),
      hanBaoHiemTnds: _valueOf(info, ['han_bao_hiem_tnds']),
      ngayPhuHieu: _valueOf(info, ['ngay_phu_hieu']),
      hanPhuHieu: _valueOf(info, ['han_phu_hieu']),
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
      'ma_tai_san': maTaiSan,
      'loai_phuong_tien': loaiPhuongTien,
      'hang_xe': hangXe,
      'nam_san_xuat': namSanXuat,
      'gia_mua': giaMua,
      'ngay_mua': ngayMua,
      'so_dang_kiem': soDangKiem,
      'han_dang_kiem': hanDangKiem,
      'so_bao_hiem_than_vo': soBaoHiemThanVo,
      'han_bao_hiem_than_vo': hanBaoHiemThanVo,
      'so_bao_hiem_tnds': soBaoHiemTnds,
      'han_bao_hiem_tnds': hanBaoHiemTnds,
      'ngay_phu_hieu': ngayPhuHieu,
      'han_phu_hieu': hanPhuHieu,
    };
  }

  bool matches(String keyword) {
    final q = keyword.trim().toLowerCase();
    if (q.isEmpty) return true;
    return title.toLowerCase().contains(q) ||
        maTaiSan.toLowerCase().contains(q) ||
        loaiPhuongTien.toLowerCase().contains(q) ||
        hangXe.toLowerCase().contains(q) ||
        soDangKiem.toLowerCase().contains(q) ||
        soBaoHiemThanVo.toLowerCase().contains(q) ||
        soBaoHiemTnds.toLowerCase().contains(q);
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

  static double _toDouble(dynamic value, {double defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? defaultValue;
  }
}

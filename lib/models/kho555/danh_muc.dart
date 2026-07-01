import 'dart:convert';

class DanhMuc {
  final int nid;
  final String title;
  final String phanLoai;
  final int hoatDong;

  DanhMuc({
    required this.nid,
    required this.title,
    required this.phanLoai,
    required this.hoatDong,
  });

  factory DanhMuc.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);

    return DanhMuc(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? '',
      phanLoai: _valueOf(info, const ['phan_loai']),
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
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
      'phan_loai': phanLoai,
    };
  }

  bool matches(String keyword) {
    final q = keyword.trim().toLowerCase();
    if (q.isEmpty) return true;
    return title.toLowerCase().contains(q) ||
        phanLoai.toLowerCase().contains(q);
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

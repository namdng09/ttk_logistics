import 'dart:convert';

class VatTu {
  final int nid;
  final String title;
  final String ma;
  final String ten;
  final String quyCachDongGoi;
  final int soLuong;
  final String donVi;
  final String ghiChu;
  final String dinhMucTieuThu;
  final String donViDinhMuc;
  final int hoatDong;
  final String? fieldThongTinJson;

  VatTu({
    required this.nid,
    required this.title,
    required this.ma,
    required this.ten,
    required this.quyCachDongGoi,
    required this.soLuong,
    required this.donVi,
    required this.ghiChu,
    required this.dinhMucTieuThu,
    required this.donViDinhMuc,
    required this.hoatDong,
    this.fieldThongTinJson,
  });

  factory VatTu.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);
    final donViValues = info['__don_vi_values'];

    String donVi = _valueOf(info, const [
      'don_vi',
      'Đơn vị',
      'Đơn vị',
      'Don vi',
      'field_don_vi',
    ]);
    String donViDinhMuc = _valueOf(info, const [
      'don_vi_dinh_muc_tieu_thu',
      'don_vi_dinh_muc',
      'Đơn vị định mức',
      'Đơn vị định mức tiêu thụ',
      'Đơn vị định mức',
      'Don vi dinh muc',
      'field_don_vi_dinh_muc',
    ]);

    if (donViValues is List && donViValues.isNotEmpty) {
      donVi = donViValues.first.toString();
      if (donViValues.length > 1) {
        donViDinhMuc = donViValues.last.toString();
      }
    }

    final ten = _valueOf(info, const [
      'ten',
      'Tên',
      'Ten',
      'field_ten',
    ]);

    return VatTu(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? ten,
      ma: _valueOf(info, const [
        'ma',
        'Mã',
        'Mã',
        'Ma',
        'field_ma',
      ]),
      ten: ten.isNotEmpty ? ten : (json['title']?.toString() ?? ''),
      quyCachDongGoi: _valueOf(info, const [
        'quy_cach_dong_goi',
        'Quy cách đóng gói',
        'Quy cách đóng gói',
        'Quy cach dong goi',
        'field_quy_cach_dong_goi',
      ]),
      soLuong: _toInt(json['field_so_luong']),
      donVi: donVi,
      ghiChu: _valueOf(info, const [
        'ghi_chu',
        'Ghi chú',
        'Ghi chú',
        'Ghi chu',
        'field_ghi_chu',
      ]),
      dinhMucTieuThu: _valueOf(info, const [
        'dinh_muc_tieu_thu',
        'Định mức tiêu thụ',
        'Định mức tiêu thụ',
        'Dinh muc tieu thu',
        'field_dinh_muc_tieu_thu',
      ]),
      donViDinhMuc: donViDinhMuc,
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
      fieldThongTinJson: json['field_thong_tin_json']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nid': nid,
      'title': title,
      'field_thong_tin_json': jsonEncode(toThongTinJson()),
      'field_so_luong': soLuong,
      'field_hoat_dong': hoatDong,
      'ma': ma,
      'ten': ten,
      'quy_cach_dong_goi': quyCachDongGoi,
      'don_vi': donVi,
      'ghi_chu': ghiChu,
      'dinh_muc_tieu_thu': dinhMucTieuThu,
      'don_vi_dinh_muc_tieu_thu': donViDinhMuc,
    };
  }

  Map<String, dynamic> toThongTinJson() {
    return {
      'ma': ma,
      'ten': ten,
      'quy_cach_dong_goi': quyCachDongGoi,
      'don_vi': donVi,
      'ghi_chu': ghiChu,
      'dinh_muc_tieu_thu': dinhMucTieuThu,
      'don_vi_dinh_muc_tieu_thu': donViDinhMuc,
    };
  }

  bool matches(String keyword) {
    final q = keyword.trim().toLowerCase();
    if (q.isEmpty) return true;

    return [
      ma,
      ten,
      quyCachDongGoi,
      donVi,
      ghiChu,
      dinhMucTieuThu,
      donViDinhMuc,
    ].any((value) => value.toLowerCase().contains(q));
  }

  static Map<String, dynamic> _decodeThongTinJson(dynamic value) {
    if (value == null) return {};
    if (value is Map<String, dynamic>) return Map<String, dynamic>.from(value);
    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }

    final raw = value.toString().trim();
    if (raw.isEmpty) return {};

    final looseMap = _decodeLooseJsonObject(raw);
    if (looseMap.isNotEmpty) return looseMap;

    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) {
        return decoded.map((key, val) => MapEntry(key.toString(), val));
      }
    } catch (_) {
      return {};
    }

    return {};
  }

  static Map<String, dynamic> _decodeLooseJsonObject(String raw) {
    final result = <String, dynamic>{};
    final donViValues = <String>[];
    final pairRegex = RegExp(
      r'"((?:\\.|[^"\\])*)"\s*:\s*("((?:\\.|[^"\\])*)"|-?\d+(?:\.\d+)?|true|false|null)',
    );

    for (final match in pairRegex.allMatches(raw)) {
      final key = _decodeJsonString(match.group(1) ?? '');
      final token = match.group(2) ?? '';
      final value = token.startsWith('"')
          ? _decodeJsonString(match.group(3) ?? '')
          : token;

      result[key] = value;
      if (_normalizeKey(key) == 'donvi') {
        donViValues.add(value);
      }
    }

    if (donViValues.isNotEmpty) {
      result['__don_vi_values'] = donViValues;
    }

    return result;
  }

  static String _decodeJsonString(String value) {
    try {
      return jsonDecode('"$value"').toString();
    } catch (_) {
      return value;
    }
  }

  static String _valueOf(Map<String, dynamic> source, List<String> keys) {
    for (final key in keys) {
      if (source.containsKey(key) && source[key] != null) {
        return source[key].toString();
      }
    }

    final normalizedKeys = keys.map(_normalizeKey).toSet();
    for (final entry in source.entries) {
      if (normalizedKeys.contains(_normalizeKey(entry.key))) {
        return entry.value?.toString() ?? '';
      }
    }

    return '';
  }

  static int _toInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? defaultValue;
  }

  static String _normalizeKey(String value) {
    var text = value
        .trim()
        .toLowerCase()
        .replaceAll(RegExp(r'[\u0300-\u036f]'), '');
    const marks = {
      'a': 'àáảãạăằắẳẵặâầấẩẫậ',
      'e': 'èéẻẽẹêềếểễệ',
      'i': 'ìíỉĩị',
      'o': 'òóỏõọôồốổỗộơờớởỡợ',
      'u': 'ùúủũụưừứửữự',
      'y': 'ỳýỷỹỵ',
      'd': 'đ',
    };

    for (final entry in marks.entries) {
      for (final rune in entry.value.runes) {
        final char = String.fromCharCode(rune);
        text = text.replaceAll(char, entry.key);
      }
    }

    return text.replaceAll(RegExp(r'[^a-z0-9]'), '');
  }
}

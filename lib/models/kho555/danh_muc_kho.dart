import 'dart:convert';

class KhoUser {
  final int uid;
  final String name;
  final String mail;

  KhoUser({
    required this.uid,
    required this.name,
    required this.mail,
  });

  factory KhoUser.fromJson(Map<String, dynamic> json) {
    return KhoUser(
      uid: _toInt(json['uid']),
      name: json['name']?.toString() ?? '',
      mail: json['mail']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'name': name,
      'mail': mail,
    };
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}

class DanhMucKho {
  final int nid;
  final String title;
  final String maKho;
  final String tenKho;
  final String diaChi;
  final String ghiChu;
  final List<int> nguoiQuanLy;
  final List<KhoUser> nguoiQuanLyInfo;
  final String phanLoai;
  final int hoatDong;
  final String? fieldThongTinJson;

  DanhMucKho({
    required this.nid,
    required this.title,
    required this.maKho,
    required this.tenKho,
    required this.diaChi,
    required this.ghiChu,
    required this.nguoiQuanLy,
    required this.nguoiQuanLyInfo,
    required this.phanLoai,
    required this.hoatDong,
    this.fieldThongTinJson,
  });

  factory DanhMucKho.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);
    final tenKho = _valueOf(info, const [
      'ten_kho',
      'Tên kho',
      'Ten kho',
      'ten',
      'title',
    ]);

    return DanhMucKho(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? tenKho,
      maKho: _valueOf(info, const [
        'ma_kho',
        'Mã kho',
        'Ma kho',
        'ma',
      ]),
      tenKho: tenKho.isNotEmpty ? tenKho : (json['title']?.toString() ?? ''),
      diaChi: _valueOf(info, const [
        'dia_chi',
        'Địa chỉ',
        'Dia chi',
      ]),
      ghiChu: _valueOf(info, const [
        'ghi_chu',
        'Ghi chú',
        'Ghi chu',
      ]),
      nguoiQuanLy: _parseUidList(_valueRaw(info, const [
        'nguoi_quan_ly',
        'người quản lý',
        'nguoi quan ly',
      ])),
      nguoiQuanLyInfo: _parseUserList(json['nguoi_quan_ly_info']),
      phanLoai: _valueOf(info, const ['phan_loai', 'Phân loại']),
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
      fieldThongTinJson: json['field_thong_tin_json']?.toString(),
    );
  }

  String get nguoiQuanLyText {
    if (nguoiQuanLyInfo.isNotEmpty) {
      return nguoiQuanLyInfo
          .map((item) => item.name.isNotEmpty ? item.name : item.uid.toString())
          .join(', ');
    }

    return nguoiQuanLy.join(', ');
  }

  Map<String, dynamic> toJson() {
    return {
      'nid': nid,
      'title': title,
      'field_thong_tin_json': jsonEncode(toThongTinJson()),
      'field_hoat_dong': hoatDong,
      'ma_kho': maKho,
      'ten_kho': tenKho,
      'dia_chi': diaChi,
      'nguoi_quan_ly': nguoiQuanLy,
      'nguoi_quan_ly_info': nguoiQuanLyInfo.map((item) => item.toJson()).toList(),
      'ghi_chu': ghiChu,
      'phan_loai': phanLoai,
    };
  }

  Map<String, dynamic> toThongTinJson() {
    return {
      'phan_loai': 'Kho',
      'ma_kho': maKho,
      'ten_kho': tenKho,
      'dia_chi': diaChi,
      'nguoi_quan_ly': nguoiQuanLy,
      'ghi_chu': ghiChu,
    };
  }

  bool matches(String keyword) {
    final q = keyword.trim().toLowerCase();
    if (q.isEmpty) return true;

    return [
      maKho,
      tenKho,
      diaChi,
      nguoiQuanLyText,
      ghiChu,
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

    try {
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) {
        return decoded.map((key, val) => MapEntry(key.toString(), val));
      }
    } catch (_) {}

    return {};
  }

  static dynamic _valueRaw(Map<String, dynamic> source, List<String> keys) {
    for (final key in keys) {
      if (source.containsKey(key)) return source[key];
    }

    final normalizedKeys = keys.map(_normalizeKey).toSet();
    for (final entry in source.entries) {
      if (normalizedKeys.contains(_normalizeKey(entry.key))) {
        return entry.value;
      }
    }

    return null;
  }

  static String _valueOf(Map<String, dynamic> source, List<String> keys) {
    final value = _valueRaw(source, keys);
    return value?.toString() ?? '';
  }

  static List<int> _parseUidList(dynamic value) {
    if (value == null) return [];

    if (value is List) {
      return value.map(_toInt).where((uid) => uid > 0).toList();
    }

    if (value is String && value.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is List) {
          return decoded.map(_toInt).where((uid) => uid > 0).toList();
        }
      } catch (_) {}

      return value
          .split(',')
          .map((item) => _toInt(item.trim()))
          .where((uid) => uid > 0)
          .toList();
    }

    return [];
  }

  static List<KhoUser> _parseUserList(dynamic value) {
    if (value is List) {
      return value
          .whereType<Map>()
          .map((item) => KhoUser.fromJson(Map<String, dynamic>.from(item)))
          .where((item) => item.uid > 0)
          .toList();
    }

    return [];
  }

  static int _toInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? defaultValue;
  }

  static String _normalizeKey(String value) {
    var text = value.trim().toLowerCase();
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
        text = text.replaceAll(String.fromCharCode(rune), entry.key);
      }
    }

    return text.replaceAll(RegExp(r'[^a-z0-9]'), '');
  }
}

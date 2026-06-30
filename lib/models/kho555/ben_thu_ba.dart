import 'dart:convert';

class TaiKhoanNganHang {
  final String tenTaiKhoan;
  final String soTaiKhoan;
  final String nganHang;

  TaiKhoanNganHang({
    required this.tenTaiKhoan,
    required this.soTaiKhoan,
    required this.nganHang,
  });

  factory TaiKhoanNganHang.fromJson(Map<String, dynamic> json) {
    return TaiKhoanNganHang(
      tenTaiKhoan: json['ten_tai_khoan']?.toString() ?? '',
      soTaiKhoan: json['so_tai_khoan']?.toString() ?? '',
      nganHang: json['ngan_hang']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'ten_tai_khoan': tenTaiKhoan,
      'so_tai_khoan': soTaiKhoan,
      'ngan_hang': nganHang,
    };
  }

  bool get isEmpty {
    return tenTaiKhoan.trim().isEmpty &&
        soTaiKhoan.trim().isEmpty &&
        nganHang.trim().isEmpty;
  }
}

class BenThuBa {
  final int nid;
  final String title;
  final String tenCongTy;
  final String tenGanGon;
  final String soDienThoai;
  final String maSoThueCccd;
  final String diaChi;
  final String ghiChu;
  final List<TaiKhoanNganHang> thongTinNganHang;
  final String fieldPhanLoai;
  final int hoatDong;
  final String? fieldThongTinJson;

  BenThuBa({
    required this.nid,
    required this.title,
    required this.tenCongTy,
    required this.tenGanGon,
    required this.soDienThoai,
    required this.maSoThueCccd,
    required this.diaChi,
    required this.ghiChu,
    required this.thongTinNganHang,
    required this.fieldPhanLoai,
    required this.hoatDong,
    this.fieldThongTinJson,
  });

  factory BenThuBa.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);
    final tenCongTy = _valueOf(info, const [
      'ten_cong_ty',
      'Tên công ty',
      'Ten cong ty',
      'ten',
      'title',
    ]);

    return BenThuBa(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? tenCongTy,
      tenCongTy:
          tenCongTy.isNotEmpty ? tenCongTy : (json['title']?.toString() ?? ''),
      tenGanGon: _valueOf(info, const [
        'ten_gan_gon',
        'Tên gắn gọn',
        'Ten gan gon',
      ]),
      soDienThoai: _valueOf(info, const [
        'so_dien_thoai',
        'Số điện thoại',
        'So dien thoai',
        'dien_thoai',
      ]),
      maSoThueCccd: _valueOf(info, const [
        'ma_so_thue_cccd',
        'Mã số thuế CCCD',
        'Mã số thuế/CCCD',
        'MST/CCCD',
        'mst',
        'cccd',
      ]),
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
      thongTinNganHang: _parseThongTinNganHang(info),
      fieldPhanLoai: json['field_phan_loai']?.toString() ?? '',
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
      fieldThongTinJson: json['field_thong_tin_json']?.toString(),
    );
  }

  List<String> get phanLoaiList {
    return fieldPhanLoai
        .split(',')
        .map((item) => item.trim())
        .where((item) => item.isNotEmpty)
        .toList();
  }

  String get soTaiKhoanText {
    return thongTinNganHang
        .map((item) => item.soTaiKhoan)
        .where((item) => item.trim().isNotEmpty)
        .join('\n');
  }

  String get tenNganHangText {
    return thongTinNganHang
        .map((item) => item.nganHang)
        .where((item) => item.trim().isNotEmpty)
        .join('\n');
  }

  Map<String, dynamic> toJson() {
    return {
      'nid': nid,
      'title': title,
      'field_thong_tin_json': jsonEncode(toThongTinJson()),
      'field_phan_loai': fieldPhanLoai,
      'field_hoat_dong': hoatDong,
      'ten_cong_ty': tenCongTy,
      'ten_gan_gon': tenGanGon,
      'so_dien_thoai': soDienThoai,
      'ma_so_thue_cccd': maSoThueCccd,
      'dia_chi': diaChi,
      'ghi_chu': ghiChu,
      'thong_tin_ngan_hang':
          thongTinNganHang.map((item) => item.toJson()).toList(),
    };
  }

  Map<String, dynamic> toThongTinJson() {
    return {
      'ten_cong_ty': tenCongTy,
      'ten_gan_gon': tenGanGon,
      'so_dien_thoai': soDienThoai,
      'ma_so_thue_cccd': maSoThueCccd,
      'dia_chi': diaChi,
      'thong_tin_ngan_hang':
          thongTinNganHang.map((item) => item.toJson()).toList(),
      'ghi_chu': ghiChu,
    };
  }

  bool matches(String keyword) {
    final q = keyword.trim().toLowerCase();
    if (q.isEmpty) return true;

    final bankText = thongTinNganHang
        .expand((item) => [item.tenTaiKhoan, item.soTaiKhoan, item.nganHang])
        .join(' ');

    return [
      tenCongTy,
      tenGanGon,
      soDienThoai,
      maSoThueCccd,
      diaChi,
      ghiChu,
      fieldPhanLoai,
      bankText,
    ].any((value) => value.toLowerCase().contains(q));
  }

  static List<TaiKhoanNganHang> _parseThongTinNganHang(
    Map<String, dynamic> info,
  ) {
    final raw = _valueRaw(info, const [
      'thong_tin_ngan_hang',
      'tai_khoan_ngan_hang',
      'Thông tin ngân hàng',
    ]);

    if (raw is List) {
      return raw
          .whereType<Map>()
          .map((item) => TaiKhoanNganHang.fromJson(Map<String, dynamic>.from(item)))
          .where((item) => !item.isEmpty)
          .toList();
    }

    if (raw is String && raw.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded
              .whereType<Map>()
              .map((item) =>
                  TaiKhoanNganHang.fromJson(Map<String, dynamic>.from(item)))
              .where((item) => !item.isEmpty)
              .toList();
        }
      } catch (_) {}
    }

    final legacy = TaiKhoanNganHang(
      tenTaiKhoan: _valueOf(info, const ['ten_tai_khoan', 'Tên tài khoản']),
      soTaiKhoan: _valueOf(info, const [
        'so_tai_khoan',
        'Số tài khoản',
        'So tai khoan',
      ]),
      nganHang: _valueOf(info, const [
        'ngan_hang',
        'Tên ngân hàng',
        'Ten ngan hang',
      ]),
    );

    return legacy.isEmpty ? [] : [legacy];
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

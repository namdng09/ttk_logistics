import 'dart:convert';

class OptionItem {
  final int id;
  final String title;
  final String subtitle;

  OptionItem({
    required this.id,
    required this.title,
    this.subtitle = '',
  });

  factory OptionItem.fromJson(
    Map<String, dynamic> json, {
    String idKey = 'nid',
    String titleKey = 'title',
    String subtitleKey = '',
  }) {
    return OptionItem(
      id: _toInt(json[idKey]),
      title: json[titleKey]?.toString() ?? '',
      subtitle: subtitleKey.isEmpty ? '' : json[subtitleKey]?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
    };
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}

class ChiTietVatTuNhap {
  final int nidVatTu;
  final String tenVatTu;
  final double soLuong;
  final String quyCachDongGoi;
  final double donGia;
  final double tongTien;
  final String loaiVat;
  final double vat;
  final double tienVat;
  final double tongTienSauVat;

  ChiTietVatTuNhap({
    required this.nidVatTu,
    required this.tenVatTu,
    required this.soLuong,
    required this.quyCachDongGoi,
    required this.donGia,
    required this.tongTien,
    required this.loaiVat,
    required this.vat,
    required this.tienVat,
    required this.tongTienSauVat,
  });

  factory ChiTietVatTuNhap.fromJson(Map<String, dynamic> json) {
    final loaiVat = json['loai_vat']?.toString() ??
        json['vat_kieu']?.toString() ??
        json['vat_type']?.toString() ??
        '%';
    final tongTien = _toDouble(json['tong_tien']);
    final vat = _toDouble(json['vat']);
    final tienVat = json.containsKey('tien_vat')
        ? _toDouble(json['tien_vat'])
        : calculateTienVat(tongTien: tongTien, loaiVat: loaiVat, vat: vat);

    return ChiTietVatTuNhap(
      nidVatTu: _toInt(json['nid_vat_tu']),
      tenVatTu: json['ten_vat_tu']?.toString() ?? '',
      soLuong: _toDouble(json['so_luong']),
      quyCachDongGoi: json['quy_cach_dong_goi']?.toString() ?? '',
      donGia: _toDouble(json['don_gia']),
      tongTien: tongTien,
      loaiVat: loaiVat,
      vat: vat,
      tienVat: tienVat,
      tongTienSauVat: json.containsKey('tong_tien_sau_vat')
          ? _toDouble(json['tong_tien_sau_vat'])
          : tongTien + tienVat,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'nid_vat_tu': nidVatTu,
      'ten_vat_tu': tenVatTu,
      'so_luong': soLuong,
      'quy_cach_dong_goi': quyCachDongGoi,
      'don_gia': donGia,
      'tong_tien': tongTien,
      'loai_vat': loaiVat,
      'vat': vat,
      'tien_vat': tienVat,
      'tong_tien_sau_vat': tongTienSauVat,
    };
  }

  static double calculateTongTien({
    required double soLuong,
    required double donGia,
  }) {
    return soLuong * donGia;
  }

  static double calculateTienVat({
    required double tongTien,
    required String loaiVat,
    required double vat,
  }) {
    if (loaiVat == '%') {
      return tongTien * vat / 100;
    }
    return vat;
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(
          value.toString().replaceAll('.', '').replaceAll(',', '.'),
        ) ??
        0;
  }
}

class PhieuNhapVatTu {
  final int nid;
  final String title;
  final int nhaCungCapNid;
  final String nhaCungCapTitle;
  final int ngay;
  final double tongTien;
  final double tienVat;
  final double phanTramVat;
  final double tongTienSauVat;
  final double daThanhToan;
  final double soTienConLai;
  final int hoatDong;
  final int khoNid;
  final int nguoiTaoLenhUid;
  final String trangThai;
  final String trangThaiIn;
  final String loaiVatPhieu;
  final List<ChiTietVatTuNhap> chiTietVatTu;
  final String? fieldThongTinJson;

  PhieuNhapVatTu({
    required this.nid,
    required this.title,
    required this.nhaCungCapNid,
    required this.nhaCungCapTitle,
    required this.ngay,
    required this.tongTien,
    required this.tienVat,
    required this.phanTramVat,
    required this.tongTienSauVat,
    required this.daThanhToan,
    required this.soTienConLai,
    required this.hoatDong,
    required this.khoNid,
    required this.nguoiTaoLenhUid,
    required this.trangThai,
    required this.trangThaiIn,
    required this.loaiVatPhieu,
    required this.chiTietVatTu,
    this.fieldThongTinJson,
  });

  factory PhieuNhapVatTu.fromJson(Map<String, dynamic> json) {
    final info = _decodeThongTinJson(json['field_thong_tin_json']);

    return PhieuNhapVatTu(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? '',
      nhaCungCapNid: _toInt(json['field_ben_thu_ba']),
      nhaCungCapTitle: json['nha_cung_cap_title']?.toString() ?? '',
      ngay: _toInt(json['field_ngay']),
      tongTien: _toDouble(json['field_tong_tien']),
      tienVat: _toDouble(json['field_tien_vat']),
      phanTramVat: _toDouble(json['field_phan_tram_vat']),
      tongTienSauVat: _toDouble(json['field_tong_tien_sau_vat']),
      daThanhToan: _toDouble(json['field_da_thanh_toan']),
      soTienConLai: _toDouble(json['field_so_tien_con_lai']),
      hoatDong: _toInt(json['field_hoat_dong'], defaultValue: 1),
      khoNid: _toInt(info['kho_nid']),
      nguoiTaoLenhUid: _toInt(info['nguoi_tao_lenh_uid']),
      trangThai: info['trang_thai']?.toString() ?? 'Chờ duyệt',
      trangThaiIn: info['trang_thai_in']?.toString() ?? 'Chưa in',
      loaiVatPhieu: info['loai_vat_phieu']?.toString() ?? '%',
      chiTietVatTu: _parseChiTiet(info['chi_tiet_vat_tu']),
      fieldThongTinJson: json['field_thong_tin_json']?.toString(),
    );
  }

  static List<ChiTietVatTuNhap> _parseChiTiet(dynamic value) {
    if (value is List) {
      return value
          .whereType<Map>()
          .map((item) =>
              ChiTietVatTuNhap.fromJson(Map<String, dynamic>.from(item)))
          .toList();
    }
    return [];
  }

  static Map<String, dynamic> _decodeThongTinJson(dynamic value) {
    if (value == null) return {};
    if (value is Map<String, dynamic>) return Map<String, dynamic>.from(value);
    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }

    try {
      final decoded = jsonDecode(value.toString());
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) {
        return decoded.map((key, val) => MapEntry(key.toString(), val));
      }
    } catch (_) {}

    return {};
  }

  static int _toInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? defaultValue;
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(
          value.toString().replaceAll('.', '').replaceAll(',', '.'),
        ) ??
        0;
  }
}

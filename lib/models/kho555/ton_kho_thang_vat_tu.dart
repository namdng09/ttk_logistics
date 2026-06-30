class TonKhoThangVatTu {
  final int khoNid;
  final String khoTitle;
  final int vatTuNid;
  final String vatTuTitle;
  final double tonDauKy;
  final double nhapTrongKy;
  final double xuatTrongKy;
  final double tonCuoiKy;

  TonKhoThangVatTu({
    required this.khoNid,
    required this.khoTitle,
    required this.vatTuNid,
    required this.vatTuTitle,
    required this.tonDauKy,
    required this.nhapTrongKy,
    required this.xuatTrongKy,
    required this.tonCuoiKy,
  });

  factory TonKhoThangVatTu.fromJson(Map<String, dynamic> json) {
    return TonKhoThangVatTu(
      khoNid: _toInt(json['kho_nid']),
      khoTitle: json['kho_title']?.toString() ?? '',
      vatTuNid: _toInt(json['vat_tu_nid']),
      vatTuTitle: json['vat_tu_title']?.toString() ?? '',
      tonDauKy: _toDouble(json['ton_dau_ky']),
      nhapTrongKy: _toDouble(json['nhap_trong_ky']),
      xuatTrongKy: _toDouble(json['xuat_trong_ky']),
      tonCuoiKy: _toDouble(json['ton_cuoi_ky']),
    );
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class BaoCaoTonKhoSummary {
  final double tonDauKy;
  final double nhapTrongKy;
  final double xuatTrongKy;
  final double tonCuoiKy;

  const BaoCaoTonKhoSummary({
    this.tonDauKy = 0,
    this.nhapTrongKy = 0,
    this.xuatTrongKy = 0,
    this.tonCuoiKy = 0,
  });

  factory BaoCaoTonKhoSummary.fromJson(Map<String, dynamic> json) {
    return BaoCaoTonKhoSummary(
      tonDauKy: _toDouble(json['ton_dau_ky']),
      nhapTrongKy: _toDouble(json['nhap_trong_ky']),
      xuatTrongKy: _toDouble(json['xuat_trong_ky']),
      tonCuoiKy: _toDouble(json['ton_cuoi_ky']),
    );
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is double) return value;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class BaoCaoTonKhoTheoThangResult {
  final List<TonKhoThangVatTu> items;
  final BaoCaoTonKhoSummary summary;

  BaoCaoTonKhoTheoThangResult({
    required this.items,
    required this.summary,
  });
}

class DanhMucBaoCaoOption {
  final int nid;
  final String title;

  DanhMucBaoCaoOption({
    required this.nid,
    required this.title,
  });

  factory DanhMucBaoCaoOption.fromJson(Map<String, dynamic> json) {
    return DanhMucBaoCaoOption(
      nid: _toInt(json['nid']),
      title: json['title']?.toString() ?? '',
    );
  }

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is num) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }
}

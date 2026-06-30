class TonKhoVatTu {
  final int ngayInt;
  final String ngayText;
  final int thangInt;

  final int khoNid;
  final String khoTitle;

  final int vatTuNid;
  final String vatTuTitle;

  final double tonDauKy;
  final double nhapTrongKy;
  final double xuatTrongKy;
  final double tonCuoiKy;

  TonKhoVatTu({
    required this.ngayInt,
    required this.ngayText,
    required this.thangInt,
    required this.khoNid,
    required this.khoTitle,
    required this.vatTuNid,
    required this.vatTuTitle,
    required this.tonDauKy,
    required this.nhapTrongKy,
    required this.xuatTrongKy,
    required this.tonCuoiKy,
  });

  factory TonKhoVatTu.fromJson(Map<String, dynamic> json) {
    return TonKhoVatTu(
      ngayInt: _toInt(json['ngay_int']),
      ngayText: _toString(json['ngay_text']),
      thangInt: _toInt(json['thang_int']),

      khoNid: _toInt(json['kho_nid']),
      khoTitle: _toString(json['kho_title']),

      vatTuNid: _toInt(json['vat_tu_nid']),
      vatTuTitle: _toString(json['vat_tu_title']),

      tonDauKy: _toDouble(json['ton_dau_ky']),
      nhapTrongKy: _toDouble(json['nhap_trong_ky']),
      xuatTrongKy: _toDouble(json['xuat_trong_ky']),
      tonCuoiKy: _toDouble(json['ton_cuoi_ky']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'ngay_int': ngayInt,
      'ngay_text': ngayText,
      'thang_int': thangInt,
      'kho_nid': khoNid,
      'kho_title': khoTitle,
      'vat_tu_nid': vatTuNid,
      'vat_tu_title': vatTuTitle,
      'ton_dau_ky': tonDauKy,
      'nhap_trong_ky': nhapTrongKy,
      'xuat_trong_ky': xuatTrongKy,
      'ton_cuoi_ky': tonCuoiKy,
    };
  }

  /// Giữ lại getter cũ để view đang dùng item.ngayNhapXuat không bị lỗi
  String get ngayNhapXuat => ngayText;

  static int _toInt(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString()) ?? 0;
  }

  static double _toDouble(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }

  static String _toString(dynamic value) {
    if (value == null) return '';
    return value.toString();
  }
}

class TonKhoVatTuPagingResponse {
  final List<TonKhoVatTu> items;

  final int page;
  final int limit;
  final int total;
  final int totalPages;

  final bool hasNext;
  final bool hasPrev;

  final int fromDate;
  final int toDate;
  final String fromDateText;
  final String toDateText;

  final int khoNid;
  final int vatTuNid;

  TonKhoVatTuPagingResponse({
    required this.items,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrev,
    required this.fromDate,
    required this.toDate,
    required this.fromDateText,
    required this.toDateText,
    required this.khoNid,
    required this.vatTuNid,
  });

  factory TonKhoVatTuPagingResponse.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];

    return TonKhoVatTuPagingResponse(
      items: rawItems is List
          ? rawItems
          .whereType<Map>()
          .map((e) => TonKhoVatTu.fromJson(Map<String, dynamic>.from(e)))
          .toList()
          : [],

      page: _toInt(json['page'], defaultValue: 1),
      limit: _toInt(json['limit'], defaultValue: 20),
      total: _toInt(json['total']),
      totalPages: _toInt(
        json['total_pages'] ?? json['totalPages'],
        defaultValue: 1,
      ),

      hasNext: _toBool(json['has_next'] ?? json['hasNext']),
      hasPrev: _toBool(json['has_prev'] ?? json['hasPrev']),

      fromDate: _toInt(json['from_date']),
      toDate: _toInt(json['to_date']),
      fromDateText: _toString(json['from_date_text']),
      toDateText: _toString(json['to_date_text']),

      khoNid: _toInt(json['kho_nid']),
      vatTuNid: _toInt(json['vat_tu_nid']),
    );
  }

  factory TonKhoVatTuPagingResponse.empty({
    int page = 1,
    int limit = 20,
  }) {
    return TonKhoVatTuPagingResponse(
      items: [],
      page: page,
      limit: limit,
      total: 0,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
      fromDate: 0,
      toDate: 0,
      fromDateText: '',
      toDateText: '',
      khoNid: 0,
      vatTuNid: 0,
    );
  }

  static int _toInt(dynamic value, {int defaultValue = 0}) {
    if (value == null) return defaultValue;
    if (value is int) return value;
    if (value is double) return value.toInt();
    return int.tryParse(value.toString()) ?? defaultValue;
  }

  static bool _toBool(dynamic value) {
    if (value == null) return false;
    if (value is bool) return value;
    if (value is int) return value == 1;

    final text = value.toString().toLowerCase().trim();
    return text == 'true' || text == '1' || text == 'yes';
  }

  static String _toString(dynamic value) {
    if (value == null) return '';
    return value.toString();
  }
}
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:ttk_logistics/models/api_response.dart';
import 'package:ttk_logistics/models/kho555/phieu_nhap_vat_tu.dart';
import 'package:ttk_logistics/models/kho555/ton_kho_thang_vat_tu.dart';

import '../../models/kho555/ton_kho_vat_tu.dart';

class TonKhoThangVatTuResult {
  final List<TonKhoThangVatTu> rows;

  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasNext;
  final bool hasPrev;

  final int thangInt;
  final int month;
  final int year;
  final int khoNid;
  final int vatTuNid;

  final double summaryTonDauKy;
  final double summaryNhapTrongKy;
  final double summaryXuatTrongKy;
  final double summaryTonCuoiKy;

  TonKhoThangVatTuResult({
    required this.rows,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrev,
    required this.thangInt,
    required this.month,
    required this.year,
    required this.khoNid,
    required this.vatTuNid,
    required this.summaryTonDauKy,
    required this.summaryNhapTrongKy,
    required this.summaryXuatTrongKy,
    required this.summaryTonCuoiKy,
  });
}

class PhieuNhapVatTuService {
  static Future<List<PhieuNhapVatTu>> fetchPhieuNhapVatTu() async {
    final res = await _postWorker(
      url: AuthService.getListPhieuNhapVatTu,
      params: {'loai_phieu': 'nhap_vat_tu'},
    );
    final content = _decodeContentList(res['content']);
    return content
        .whereType<Map>()
        .map((e) => PhieuNhapVatTu.fromJson(Map<String, dynamic>.from(e)))
        .toList();
  }

  static Future<List<OptionItem>> fetchNhaCungCap() async {
    final res = await _postWorker(url: AuthService.getListNhaCungCapPhieu);
    return _decodeContentList(res['content'])
        .whereType<Map>()
        .map((e) => OptionItem.fromJson(
              Map<String, dynamic>.from(e),
              idKey: 'nid',
              titleKey: 'title',
              subtitleKey: 'field_phan_loai',
            ))
        .where((item) => item.id > 0)
        .toList();
  }

  static Future<List<OptionItem>> fetchKho() async {
    final res = await _postWorker(url: AuthService.getListKhoPhieu);
    return _decodeContentList(res['content'])
        .whereType<Map>()
        .map((e) => OptionItem.fromJson(
              Map<String, dynamic>.from(e),
              idKey: 'nid',
              titleKey: 'title',
            ))
        .where((item) => item.id > 0)
        .toList();
  }

  static Future<List<OptionItem>> fetchVatTu() async {
    final res = await _postWorker(url: AuthService.getListVatTuPhieu);
    return _decodeContentList(res['content'])
        .whereType<Map>()
        .map((e) {
          final json = Map<String, dynamic>.from(e);
          final info = _decodeJsonMap(json['field_thong_tin_json']);
          return OptionItem(
            id: _toInt(json['nid']),
            title: info['ten']?.toString() ??
                info['Tên']?.toString() ??
                json['title']?.toString() ??
                '',
            subtitle: info['quy_cach_dong_goi']?.toString() ??
                info['Quy cách đóng gói']?.toString() ??
                '',
          );
        })
        .where((item) => item.id > 0)
        .toList();
  }

  static Future<List<OptionItem>> fetchUsers() async {
    final res = await _postWorker(url: AuthService.getListUserPhieu);
    return _decodeContentList(res['content'])
        .whereType<Map>()
        .map((e) => OptionItem.fromJson(
              Map<String, dynamic>.from(e),
              idKey: 'uid',
              titleKey: 'name',
              subtitleKey: 'mail',
            ))
        .where((item) => item.id > 0)
        .toList();
  }

  static Future<ApiResponse> savePhieuNhapVatTu(
    Map<String, dynamic> data,
  ) async {
    return _postPhieu(
      url: AuthService.savePhieuNhapVatTu,
      data: data,
      fallbackMessage: 'Không thể lưu phiếu nhập vật tư',
    );
  }

  static Future<ApiResponse> updatePhieuNhapVatTu(
    int nid,
    Map<String, dynamic> data,
  ) async {
    return _postPhieu(
      url: AuthService.savePhieuNhapVatTu,
      data: {'nid': nid, ...data},
      fallbackMessage: 'Không thể cập nhật phiếu nhập vật tư',
    );
  }

  static Future<ApiResponse> updateTrangThaiPhieuNhapVatTu(int nid, String trangThai) async {
    return _postPhieu(
      url: AuthService.updateTrangThaiPhieuNhapVatTu,
      data: {'nid': nid, 'trang_thai': trangThai},
      fallbackMessage: 'Không thể cập nhật trạng thái phiếu nhập vật tư',
    );
  }

  static Future<ApiResponse> deletePhieuNhapVatTu(int nid) async {
    return _postPhieu(
      url: AuthService.deletePhieuNhapVatTu,
      data: {'nid': nid},
      fallbackMessage: 'Không thể xoá phiếu nhập vật tư',
    );
  }

  static Future<ApiResponse> _postPhieu({
    required String url,
    required Map<String, dynamic> data,
    required String fallbackMessage,
  }) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();
      final res = await _postWorker(
        url: url,
        params: {
          ...data,
          'created_email': email,
          'token': token,
        },
      );

      if (res['success'] == true) {
        return ApiResponse.fromJson(res);
      }

      return ApiResponse(
        success: false,
        message: res['content']?.toString() ??
            res['message']?.toString() ??
            fallbackMessage,
      );
    } catch (e) {
      return ApiResponse(success: false, message: 'Lỗi kết nối: $e');
    }
  }

  static Future<TonKhoVatTuPagingResponse> fetchBaoCaoTonKhoVatTu({
    int? fromDate,
    int? toDate,
    int? khoNid,
    int? vatTuNid,
    int page = 1,
    int limit = 20,
  }) async {
    final int filterPage = page < 1 ? 1 : page;
    final int filterLimit = limit < 1 ? 20 : limit;

    final res = await _postWorker(
      url: AuthService.getBaoCaoTonKhoVatTu,
      params: {
        if ((fromDate ?? 0) > 0) 'from_date': fromDate,
        if ((toDate ?? 0) > 0) 'to_date': toDate,
        if ((khoNid ?? 0) > 0) 'kho_nid': khoNid,
        if ((vatTuNid ?? 0) > 0) 'vat_tu_nid': vatTuNid,
        'page': filterPage,
        'limit': filterLimit,
      },
    );

    if (res['success'] == false) {
      throw Exception(res['message'] ?? 'Không tải được báo cáo tồn kho');
    }

    final content = res['content'];

    if (content is Map) {
      return TonKhoVatTuPagingResponse.fromJson(
        Map<String, dynamic>.from(content),
      );
    }

    if (content is List) {
      return TonKhoVatTuPagingResponse(
        items: content
            .whereType<Map>()
            .map((e) => TonKhoVatTu.fromJson(Map<String, dynamic>.from(e)))
            .toList(),
        page: filterPage,
        limit: filterLimit,
        total: content.length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
        fromDate: fromDate ?? 0,
        toDate: toDate ?? 0,
        fromDateText: '',
        toDateText: '',
        khoNid: khoNid ?? 0,
        vatTuNid: vatTuNid ?? 0,
      );
    }

    return TonKhoVatTuPagingResponse.empty(
      page: filterPage,
      limit: filterLimit,
    );
  }

  static Future<TonKhoThangVatTuResult> fetchBaoCaoTonKhoTheoThang({
    int? thangInt,
    int? month,
    int? year,
    int? khoNid,
    int? vatTuNid,
    int? page,
    int? limit,
  }) async {
    final params = <String, dynamic>{
      if ((thangInt ?? 0) > 0) 'thang_int': thangInt,
      if ((thangInt ?? 0) <= 0 && (month ?? 0) > 0) 'month': month,
      if ((thangInt ?? 0) <= 0 && (year ?? 0) > 0) 'year': year,
      if ((khoNid ?? 0) > 0) 'kho_nid': khoNid,
      if ((vatTuNid ?? 0) > 0) 'vat_tu_nid': vatTuNid,
      if ((page ?? 0) > 0) 'page': page,
      if ((limit ?? 0) > 0) 'limit': limit,
    };

    final res = await _postWorker(
      url: AuthService.getBaoCaoTonKhoVatTuTheoThang,
      params: params,
    );

    if (res['success'] != true) {
      throw Exception(
        res['content']?.toString() ??
            res['message']?.toString() ??
            'Không thể lấy báo cáo tồn kho theo tháng',
      );
    }

    final content = _decodeContentList(res['content']);

    final rows = content
        .whereType<Map>()
        .map((e) => TonKhoThangVatTu.fromJson(Map<String, dynamic>.from(e)))
        .toList();

    final data = _decodeJsonMap(res['data']);
    final summary = _decodeJsonMap(data['summary']);

    return TonKhoThangVatTuResult(
      rows: rows,
      page: _toInt(data['page']),
      limit: _toInt(data['limit']),
      total: _toInt(data['total']),
      totalPages: _toInt(data['total_pages']),
      hasNext: _toBool(data['has_next']),
      hasPrev: _toBool(data['has_prev']),
      thangInt: _toInt(data['thang_int']),
      month: _toInt(data['month']),
      year: _toInt(data['year']),
      khoNid: _toInt(data['kho_nid']),
      vatTuNid: _toInt(data['vat_tu_nid']),
      summaryTonDauKy: _toDouble(summary['ton_dau_ky']),
      summaryNhapTrongKy: _toDouble(summary['nhap_trong_ky']),
      summaryXuatTrongKy: _toDouble(summary['xuat_trong_ky']),
      summaryTonCuoiKy: _toDouble(summary['ton_cuoi_ky']),
    );
  }

  static Future<Map<String, dynamic>> _postWorker({
    required String url,
    Map<String, dynamic>? params,
  }) async {
    final response = await http.post(
      Uri.parse(AuthService.workerUrl),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'url': url,
        'method': 'POST',
        'params': ?params,
      }),
    );

    if (response.statusCode == 200) {
      return _decodeBody(response.body);
    }

    throw Exception('Lỗi server: ${response.statusCode}');
  }

  static Map<String, dynamic> _decodeBody(String body) {
    final decoded = jsonDecode(body);
    if (decoded is String) {
      return Map<String, dynamic>.from(jsonDecode(decoded));
    }
    return Map<String, dynamic>.from(decoded);
  }

  static List<dynamic> _decodeContentList(dynamic content) {
    if (content is List) {
      return content;
    }

    if (content is String && content.trim().isNotEmpty) {
      final decoded = jsonDecode(content);
      if (decoded is List) return decoded;
      if (decoded is Map && decoded['content'] is List) {
        return decoded['content'] as List;
      }
    }

    throw Exception('Dữ liệu không hợp lệ từ Worker');
  }

  static Map<String, dynamic> _decodeJsonMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }
    if (value is String && value.trim().isNotEmpty) {
      try {
        final decoded = jsonDecode(value);
        if (decoded is Map<String, dynamic>) return decoded;
        if (decoded is Map) {
          return decoded.map((key, val) => MapEntry(key.toString(), val));
        }
      } catch (_) {}
    }
    return {};
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
    if (value is int) return value.toDouble();
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }

  static bool _toBool(dynamic value) {
    if (value is bool) return value;
    if (value is num) return value != 0;

    final text = value?.toString().toLowerCase().trim();
    return text == 'true' || text == '1' || text == 'yes';
  }
}

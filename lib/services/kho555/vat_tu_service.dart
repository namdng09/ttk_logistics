import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:ttk_logistics/models/api_response.dart';
import 'package:ttk_logistics/models/kho555/vat_tu.dart';

class VatTuService {
  static Future<List<VatTu>> fetchVatTu() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'url': AuthService.getListVatTu,
          'method': 'POST',
          'params': {
            'field_hoat_dong': 1,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = _decodeBody(response.body);
        final content = _decodeContentList(res['content']);

        return content
            .whereType<Map>()
            .map((e) => VatTu.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }

      throw Exception('Lỗi server: ${response.statusCode}');
    } catch (e) {
      throw Exception('Lỗi kết nối: $e');
    }
  }

  static Future<ApiResponse> saveVatTu(Map<String, dynamic> data) async {
    return _postVatTu(
      url: AuthService.saveVatTu,
      data: data,
      fallbackMessage: 'Không thể lưu vật tư',
    );
  }

  static Future<ApiResponse> updateVatTu(
      int nid,
      Map<String, dynamic> data,
      ) async {
    return _postVatTu(
      url: AuthService.saveVatTu,
      data: {
        'nid': nid,
        ...data,
      },
      fallbackMessage: 'Không thể cập nhật vật tư',
    );
  }

  static Future<ApiResponse> deleteVatTu(int nid) async {
    return _postVatTu(
      url: AuthService.deleteVatTu,
      data: {
        'nid': nid,
      },
      fallbackMessage: 'Không thể xoá vật tư',
    );
  }

  static Future<ApiResponse> nhapVatTu({
    required int nid,
    required int soLuongNhap,
  }) async {
    return _postVatTu(
      url: AuthService.nhapVatTu,
      data: {
        'nid': nid,
        'so_luong_nhap': soLuongNhap,
        'action': 'nhap_vat_tu',
      },
      fallbackMessage: 'Không thể nhập vật tư',
    );
  }

  static Future<ApiResponse> _postVatTu({
    required String url,
    required Map<String, dynamic> data,
    required String fallbackMessage,
  }) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'url': url,
          'method': 'POST',
          'params': {
            ...data,
            'created_email': email,
            'token': token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = _decodeBody(response.body);
        if (res['success'] == true) {
          return ApiResponse.fromJson(res);
        }

        return ApiResponse(
          success: false,
          message: res['content']?.toString() ??
              res['message']?.toString() ??
              fallbackMessage,
        );
      }

      return ApiResponse(
        success: false,
        message: 'Lỗi server: ${response.statusCode}',
      );
    } catch (e) {
      return ApiResponse(success: false, message: 'Lỗi kết nối: $e');
    }
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
      if (decoded is List) {
        return decoded;
      }
      if (decoded is Map && decoded['content'] is List) {
        return decoded['content'] as List;
      }
    }

    throw Exception('Dữ liệu vật tư không hợp lệ từ Worker');
  }
}

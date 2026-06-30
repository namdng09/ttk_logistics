import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:ttk_logistics/models/api_response.dart';
import 'package:ttk_logistics/models/kho555/danh_muc_kho.dart';

class DanhMucKhoService {
  static Future<List<DanhMucKho>> fetchDanhMucKho() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'url': AuthService.getListDanhMucKho,
          'method': 'POST',
          'params': {
            'field_hoat_dong': 1,
            'phan_loai': 'Kho',
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = _decodeBody(response.body);
        final content = _decodeContentList(res['content']);

        return content
            .whereType<Map>()
            .map((e) => DanhMucKho.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }

      throw Exception('Lỗi server: ${response.statusCode}');
    } catch (e) {
      throw Exception('Lỗi kết nối: $e');
    }
  }

  static Future<List<KhoUser>> fetchKhoUsers() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'url': AuthService.getListKhoUser,
          'method': 'POST',
        }),
      );

      if (response.statusCode == 200) {
        final res = _decodeBody(response.body);
        final content = _decodeContentList(res['content']);

        return content
            .whereType<Map>()
            .map((e) => KhoUser.fromJson(Map<String, dynamic>.from(e)))
            .where((item) => item.uid > 0)
            .toList();
      }

      throw Exception('Lỗi server: ${response.statusCode}');
    } catch (e) {
      throw Exception('Lỗi kết nối: $e');
    }
  }

  static Future<ApiResponse> saveDanhMucKho(Map<String, dynamic> data) async {
    return _postKho(
      url: AuthService.saveDanhMucKho,
      data: data,
      fallbackMessage: 'Không thể lưu kho',
    );
  }

  static Future<ApiResponse> updateDanhMucKho(
    int nid,
    Map<String, dynamic> data,
  ) async {
    return _postKho(
      url: AuthService.saveDanhMucKho,
      data: {
        'nid': nid,
        ...data,
      },
      fallbackMessage: 'Không thể cập nhật kho',
    );
  }

  static Future<ApiResponse> deleteDanhMucKho(int nid) async {
    return _postKho(
      url: AuthService.deleteDanhMucKho,
      data: {
        'nid': nid,
      },
      fallbackMessage: 'Không thể xoá kho',
    );
  }

  static Future<ApiResponse> _postKho({
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

    throw Exception('Dữ liệu kho không hợp lệ từ Worker');
  }
}

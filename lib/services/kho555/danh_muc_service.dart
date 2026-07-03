import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:ttk_logistics/models/api_response.dart';
import 'package:ttk_logistics/models/kho555/danh_muc.dart';

class DanhMucService {
  static const String _endpoint = AuthService.danhMucEndpoint;

  static Future<List<DanhMuc>> fetchDanhMuc() async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'url': _endpoint,
          'method': 'POST',
          'params': {
            '_method': 'GET',
            'field_hoat_dong': 1,
            'created_email': email,
            'token': token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = _decodeBody(response.body);

        final items = _extractItems(res);
        if (items != null) {
          return items
              .whereType<Map>()
              .map((e) => DanhMuc.fromJson(Map<String, dynamic>.from(e)))
              .toList();
        }

        throw Exception('Không tìm thấy dữ liệu danh mục');
      }

      throw Exception('Lỗi server: ${response.statusCode}');
    } catch (e) {
      throw Exception('Lỗi kết nối: $e');
    }
  }

  static List<dynamic>? _extractItems(Map<String, dynamic> res) {
    if (res['content'] is String) {
      try {
        return _decodeContentList(res['content']);
      } catch (_) {}
    }
    if (res['content'] is List) {
      return res['content'] as List<dynamic>;
    }
    if (res['data'] is Map && res['data']['items'] is List) {
      return res['data']['items'] as List<dynamic>;
    }
    if (res['items'] is List) {
      return res['items'] as List<dynamic>;
    }
    return null;
  }

  static Future<ApiResponse> saveDanhMuc(Map<String, dynamic> data) async {
    return _request(
      url: _endpoint,
      method: 'POST',
      data: data,
      fallbackMessage: 'Không thể lưu danh mục',
    );
  }

  static Future<ApiResponse> updateDanhMuc(
    int nid,
    Map<String, dynamic> data,
  ) async {
    return _request(
      url: '$_endpoint/$nid',
      method: 'PUT',
      data: data,
      fallbackMessage: 'Không thể cập nhật danh mục',
    );
  }

  static Future<ApiResponse> deleteDanhMuc(int nid) async {
    return _request(
      url: '$_endpoint/$nid',
      method: 'DELETE',
      data: {},
      fallbackMessage: 'Không thể xoá danh mục',
    );
  }

  static Future<ApiResponse> _request({
    required String url,
    required String method,
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
            '_method': method,
            ...data,
            'created_email': email,
            'token': token,
          },
        }),
      );

      try {
        final res = _decodeBody(response.body);

        final success = res['success'] == true ||
            res['status'] == 'success';
        String message;

        if (response.statusCode == 200) {
          message = res['content']?.toString() ??
              res['message']?.toString() ?? fallbackMessage;
        } else {
          message = res['message']?.toString() ??
              'Lỗi server: ${response.statusCode}';
        }

        if (success) {
          return ApiResponse(success: true, message: message);
        }

        return ApiResponse(success: false, message: message);
      } catch (e) {
        if (response.statusCode == 200) {
          return ApiResponse(success: false, message: 'Lỗi xử lý: $e');
        }
        return ApiResponse(
          success: false,
          message: 'Lỗi server: ${response.statusCode}',
        );
      }
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
      return _extractList(jsonDecode(content));
    }

    if (content is Map) {
      return _extractList(content);
    }

    throw Exception('Dữ liệu danh mục không hợp lệ từ Worker');
  }

  static List<dynamic> _extractList(dynamic data) {
    if (data is List) return data;
    if (data is Map) {
      if (data['items'] is List) return data['items'] as List;
      if (data['data'] is Map && data['data']['items'] is List) {
        return data['data']['items'] as List;
      }
      if (data['content'] is List) return data['content'] as List;
    }
    throw Exception('Dữ liệu danh mục không hợp lệ từ Worker');
  }
}

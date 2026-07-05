import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:ttk_logistics/models/api_response.dart';
import 'package:ttk_logistics/models/kho555/ben_thu_ba.dart';

class BenThuBaService {
  static Future<List<BenThuBa>> fetchBenThuBaByPhanLoai({String phanLoai = '', int limit = 500}) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final params = <String, dynamic>{
        'limit': limit,
        'field_hoat_dong': 1,
        'created_email': email,
        'token': token,
      };
      if (phanLoai.isNotEmpty) {
        params['field_phan_loai'] = phanLoai;
      }

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'url': AuthService.benThuBaEndpoint,
          'method': 'POST',
          'params': {
            '_method': 'GET',
            ...params,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = _decodeBody(response.body);
        final items = _extractItems(res);
        if (items == null) return <BenThuBa>[];
        return items
            .whereType<Map>()
            .map((e) => BenThuBa.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }
      throw Exception('Lỗi server: ${response.statusCode}');
    } catch (e) {
      throw Exception('Lỗi tải bên thứ 3: $e');
    }
  }

  static List<dynamic>? _extractItems(Map<String, dynamic> res) {
    if (res['data'] is Map && res['data']['items'] is List) {
      return res['data']['items'] as List<dynamic>;
    }
    if (res['items'] is List) return res['items'] as List<dynamic>;
    if (res['content'] is List) return res['content'] as List<dynamic>;
    if (res['content'] is String) {
      try {
        final decoded = jsonDecode(res['content']);
        if (decoded is List) return decoded;
        if (decoded is Map && decoded['items'] is List) {
          return decoded['items'] as List;
        }
      } catch (_) {}
    }
    return null;
  }

  static Future<List<BenThuBa>> fetchBenThuBa() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'url': AuthService.getListBenThuBa,
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
            .map((e) => BenThuBa.fromJson(Map<String, dynamic>.from(e)))
            .toList();
      }

      throw Exception('Lỗi server: ${response.statusCode}');
    } catch (e) {
      throw Exception('Lỗi kết nối: $e');
    }
  }

  static Future<ApiResponse> saveBenThuBa(Map<String, dynamic> data) async {
    return _postBenThuBa(
      url: AuthService.saveBenThuBa,
      data: data,
      fallbackMessage: 'Không thể lưu bên thứ 3',
    );
  }

  static Future<ApiResponse> updateBenThuBa(
    int nid,
    Map<String, dynamic> data,
  ) async {
    return _postBenThuBa(
      url: AuthService.saveBenThuBa,
      data: {
        'nid': nid,
        ...data,
      },
      fallbackMessage: 'Không thể cập nhật bên thứ 3',
    );
  }

  static Future<ApiResponse> deleteBenThuBa(int nid) async {
    return _postBenThuBa(
      url: AuthService.deleteBenThuBa,
      data: {
        'nid': nid,
      },
      fallbackMessage: 'Không thể xoá bên thứ 3',
    );
  }

  static Future<ApiResponse> _postBenThuBa({
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

      try {
        final res = _decodeBody(response.body);
        final message = res['message']?.toString() ??
            res['content']?.toString() ??
            'Lỗi server: ${response.statusCode}';
        return ApiResponse(success: false, message: message);
      } catch (_) {
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
      final decoded = jsonDecode(content);
      if (decoded is List) {
        return decoded;
      }
      if (decoded is Map && decoded['content'] is List) {
        return decoded['content'] as List;
      }
    }

    throw Exception('Dữ liệu bên thứ 3 không hợp lệ từ Worker');
  }
}

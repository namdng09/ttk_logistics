import 'dart:convert';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:http/http.dart' as http;
import '../helper/storage/local_storage.dart';
import '../models/api_response.dart';
import '../models/bap/phuong_tien.dart';

class PhuongTienService {
  static Future<List<PhuongTien>> fetchPhuongTien() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListPhuongTien,
          "method": "POST", // 👈 Worker sẽ gọi GET tới API thật
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        if (res['content'] is List) {
          final list = res['content'] as List;
          return list.map((e) => PhuongTien.fromJson(e)).toList();
        }

        throw Exception("Dữ liệu không hợp lệ từ Worker");
      } else {
        throw Exception("Lỗi server: ${response.statusCode}");
      }
    } catch (e) {
      throw Exception("Lỗi kết nối: $e");
    }
  }

  static Future<ApiResponse> savePhuongTien(Map<String, dynamic> data) async {
    try {
      // Lấy token & email từ LocalStorage
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

// print('AuthService.savePhuongTien ${AuthService.savePhuongTien}'); // TODO: remove debug
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.savePhuongTien,
          "method": "POST",
          "params": {
            ...data,
            "created_email": email,
            "token": token,
          },
        }),
      );

// print("response.body Luu phuong tien ${response.body}"); // TODO: remove debug
      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if(res['success']) {
          return ApiResponse.fromJson(res);
        }
        return ApiResponse(
          success: false,
          message: res['content']
        );
      } else {
        return ApiResponse(
          success: false,
          message: "Lỗi server: ${response.statusCode}",
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: "Lỗi kết nối: $e");
    }
  }
  //
  static Future<ApiResponse> updatePhuongTien(int nid, Map<String, dynamic> data) async {
    try {
      // Lấy token & email từ LocalStorage
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.savePhuongTien, // 👈 endpoint sửa khách hàng
          "method": "POST",
          "params": {
            "nid": nid,
            ...data,
            "created_email": email,
            "token": token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res is String) {
          return ApiResponse.fromJson(jsonDecode(res));
        }
        return ApiResponse.fromJson(res);
      } else {
        return ApiResponse(success: false, message: "Lỗi server: ${response.statusCode}");
      }
    } catch (e) {
      return ApiResponse(success: false, message: "Lỗi kết nối: $e");
    }
  }
  //
  static Future<ApiResponse> deletePhuongTien(int nid) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.deletePhuongTien, // 👈 endpoint xoá khách hàng
          "method": "POST",
          "params": {
            "nid": nid,
            "created_email": email,
            "token": token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res is String) {
          return ApiResponse.fromJson(jsonDecode(res));
        }
        return ApiResponse.fromJson(res);
      } else {
        return ApiResponse(
          success: false,
          message: "Lỗi server: ${response.statusCode}",
        );
      }
    } catch (e) {
      return ApiResponse(success: false, message: "Lỗi kết nối: $e");
    }
  }

  static Future<Map<String, dynamic>> initPhuongTienForm() async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.initPhuongTienForm,
          "method": "POST",
          "params": {
            "created_email": email,
            "token": token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        final data = res is String ? jsonDecode(res) : res;

        if (data["success"] == true) {
          final content = data["content"] ?? {};
          return {
            "taiXe": content["taiXe"] ?? [],
            "nhaXe": content["nhaXe"] ?? [],
            "loaiXe": content["loaiXe"] ?? [],
          };
        } else {
          throw Exception(data["message"] ?? "Không lấy được dữ liệu");
        }
      } else {
        throw Exception("Lỗi server: ${response.statusCode}");
      }
    } catch (e) {
      throw Exception("Lỗi kết nối: $e");
    }
  }

}

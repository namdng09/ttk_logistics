import 'dart:convert';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:http/http.dart' as http;
import '../helper/storage/local_storage.dart';
import '../models/api_response.dart';
import '../models/bap/don_hang.dart';

class DonHangService {
  static Future<List<DonHang>> fetchDonHang() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListDonHang,
          "method": "POST", // 👈 Worker sẽ gọi GET tới API thật
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        if (res['content'] is List) {
          final list = res['content'] as List;
          return list.map((e) => DonHang.fromJson(e)).toList();
        }

        throw Exception("Dữ liệu không hợp lệ từ Worker");
      } else {
        throw Exception("Lỗi server: ${response.statusCode}");
      }
    } catch (e) {
      throw Exception("Lỗi kết nối: $e");
    }
  }

  static Future<ApiResponse> saveDonHang(Map<String, dynamic> data) async {
    try {
      // Lấy token & email từ LocalStorage
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.saveDonHang,
          "method": "POST",
          "params": {
            ...data,
            "created_email": email,
            "token": token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if(res['success'])
          return ApiResponse.fromJson(res);
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
  static Future<ApiResponse> updateDonHang(int nid, Map<String, dynamic> data) async {
    try {
      // Lấy token & email từ LocalStorage
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.saveDonHang, // 👈 endpoint sửa khách hàng
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
  static Future<ApiResponse> deleteDonHang(int nid) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.deleteDonHang, // 👈 endpoint xoá khách hàng
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

  static Future<Map<String, dynamic>> initDonHangForm() async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl), // 👈 gọi qua Worker để tránh CORS
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.initDonHangForm, // 👈 endpoint khởi tạo form đơn hàng
          "method": "POST",
          "params": {
            "created_email": email,
            "token": token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        // Trường hợp worker trả về string JSON
        if (res is String) {
          return jsonDecode(res);
        }
        return res;
      } else {
        return {
          "success": false,
          "message": "Lỗi server: ${response.statusCode}",
        };
      }
    } catch (e) {
      return {
        "success": false,
        "message": "Lỗi kết nối: $e",
      };
    }
  }

  static Future<List<dynamic>> fetchPhuongTien(int nhaXeId, String loaiXe) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.fetchPhuongTien, // 👈 endpoint lấy phương tiện
          "method": "POST",
          "params": {
            "nha_xe": nhaXeId,
            "loai_xe": loaiXe,
            "created_email": email,
            "token": token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res['success'] == true) {
          return res['content'] ?? [];
        } else {
          throw res['message'] ?? "Lỗi không xác định";
        }
      } else {
        throw "Lỗi server: ${response.statusCode}";
      }
    } catch (e) {
      throw "Lỗi kết nối: $e";
    }
  }

  static Future<Map<String, dynamic>> fetchChiPhiKhac(
      Map<String, dynamic> params) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      print('params ${params}');
      final response = await http.post(
        Uri.parse(AuthService.workerUrl), // Worker URL (tránh CORS)
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.fetchChiPhiKhac, // 👈 endpoint API gốc
          "method": "POST",
          "params": {
            ...params,
            "created_email": email,
            "token": token,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        if (res is String) {
          return jsonDecode(res);
        }
        return res;
      } else {
        return {
          "success": false,
          "message": "Lỗi server: ${response.statusCode}",
        };
      }
    } catch (e) {
      return {
        "success": false,
        "message": "Lỗi kết nối: $e",
      };
    }
  }
}

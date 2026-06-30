import 'dart:convert';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:http/http.dart' as http;
import '../helper/storage/local_storage.dart';
import '../models/api_response.dart';
import '../models/bap/khach_hang.dart';
import '../models/bap/lai_xe.dart';
import '../models/bap/nha_xe.dart';

class LaiXeService {
  static Future<List<LaiXe>> fetchLaiXe() async {
    print('AuthService.getListLaiXe ${AuthService.getListLaiXe}');
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListLaiXe,
          "method": "POST", // 👈 Worker sẽ gọi GET tới API thật
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        if (res['content'] is List) {
          final list = res['content'] as List;
          return list.map((e) => LaiXe.fromJson(e)).toList();
        }

        throw Exception("Dữ liệu không hợp lệ từ Worker");
      } else {
        throw Exception("Lỗi server: ${response.statusCode}");
      }
    } catch (e) {
      throw Exception("Lỗi kết nối: $e");
    }
  }

  static Future<ApiResponse> saveLaiXe(Map<String, dynamic> data) async {
    try {
      // Lấy token & email từ LocalStorage
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.saveLaiXe,
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
  static Future<ApiResponse> updateLaiXe(int nid, Map<String, dynamic> data) async {
    try {
      // Lấy token & email từ LocalStorage
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.saveLaiXe, // 👈 endpoint sửa khách hàng
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
  static Future<ApiResponse> deleteLaiXe(int nid) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.deleteLaiXe, // 👈 endpoint xoá khách hàng
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
  //
  // static Future<ApiResponse> saveChiPhi(
  //     int nid, String fieldName, String jsonData) async {
  //   try {
  //     final token = await LocalStorage.getUserToken();
  //     final email = await LocalStorage.getUserEmail();
  //
  //     final response = await http.post(
  //       Uri.parse(AuthService.workerUrl),
  //       headers: {"Content-Type": "application/json"},
  //       body: jsonEncode({
  //         "url": AuthService.saveChiPhiLaiXe, // 👈 endpoint thật từ backend
  //         "method": "POST",
  //         "params": {
  //           "nid": nid,
  //           "field": fieldName,
  //           "value": jsonData,
  //           "created_email": email,
  //           "token": token,
  //         },
  //       }),
  //     );
  //
  //     if (response.statusCode == 200) {
  //       final res = jsonDecode(response.body);
  //
  //       return ApiResponse(
  //         success: res["success"] == true,
  //         message: res["content"] ?? "Không có thông báo",
  //       );
  //     } else {
  //       return ApiResponse(
  //         success: false,
  //         message: "Lỗi server: ${response.statusCode}",
  //       );
  //     }
  //   } catch (e) {
  //     return ApiResponse(success: false, message: "Lỗi kết nối: $e");
  //   }
  // }
}

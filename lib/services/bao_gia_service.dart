import 'dart:convert';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:http/http.dart' as http;

class BaoGiaService {
  static const workerUrl = "https://callapifromurlwithparams.hungddvimaru.workers.dev";
  static const saveBaoGiaEndpoint = AuthService.saveBaoGia;
  // 👆 endpoint Drupal 7 bạn cần viết hook_menu + callback để nhận dữ liệu

  static Future<bool> saveBaoGia(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse(workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": saveBaoGiaEndpoint,
          "method": "POST",
          "params": data, // toàn bộ JSON báo giá
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res['success']) {
          return true;
        } else {
          throw Exception(res['content'] ?? "Lưu báo giá thất bại");
        }
      } else {
        throw Exception("Server error: ${response.statusCode}");
      }
    } catch (e) {
      throw Exception("Lỗi kết nối: $e");
    }
  }
}

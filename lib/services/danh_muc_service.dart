import 'dart:convert';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:http/http.dart' as http;
import '../models/danh_muc.dart';

class DanhMucService {
  static const workerUrl = "https://callapifromurlwithparams.hungddvimaru.workers.dev";
  static const danhMucEndpoint = AuthService.getListDanhMuc; // API gốc

  static Future<List<DanhMuc>> fetchDanhMuc() async {
    try {
      final response = await http.post(
        Uri.parse(workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": danhMucEndpoint,
          "method": "POST", // 👈 báo cho Worker gọi GET
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        // Nếu Worker trả nguyên body JSON của API gốc
        if (res['content'] is List) {
          final list = res['content'] as List; // ép kiểu rõ ràng
          return list.map((e) => DanhMuc.fromJson(e)).toList();
        }


        throw Exception("Dữ liệu không hợp lệ từ Worker");
      } else {
        throw Exception("Lỗi server: ${response.statusCode}");
      }
    } catch (e) {
      throw Exception("Lỗi kết nối: $e");
    }
  }
}

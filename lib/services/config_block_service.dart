import 'dart:convert';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:http/http.dart' as http;
import '../models/bap/config_block.dart';

class ConfigBlockService {
  static const String workerUrl = AuthService.workerUrl;

  // Lấy config_block theo machine_name
  static Future<ConfigBlock> fetchConfigBlock(String url, Map<String, dynamic> data) async {
// print('url featchConfigBlock $url'); // TODO: remove debug
    final response = await http.post(
      Uri.parse(workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": url,
        "params": data
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if(!data['success']) {
        throw Exception("❌ Lỗi khi load config_block: ${response.statusCode}");
      }
      return ConfigBlock.fromJson(data['content']);
    } else {
      throw Exception("❌ Lỗi khi load config_block: ${response.statusCode}");
    }
  }

  // Update config_block
  static Future<bool> updateConfigBlock(String url, ConfigBlock block, Map<String, dynamic> params) async {
    // Gộp block.toJson() và extraParams thành một map duy nhất
    final Map<String, dynamic> mergedParams = {
      ...block.toJson(),
      ...params,
    };

    try {
      final response = await http.post(
        Uri.parse(workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": url,
          "params": mergedParams,
        }),
      );

      return response.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

}

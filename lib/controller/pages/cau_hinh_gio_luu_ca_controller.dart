import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';

class CauHinhGioLuuCaController extends GetxController {
  /// Danh sách dữ liệu cấu hình
  var data = <Map<String, dynamic>>[].obs;

  /// Trạng thái tải và lưu
  final isLoading = false.obs;
  final isSaving = false.obs;

  /// =======================================================
  /// 🧩 LOAD DỮ LIỆU TỪ API HOẶC FILE OFFLINE
  /// =======================================================
  Future<void> loadConfig() async {
    try {
      isLoading.value = true;
      update();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getCauHinhGioLuuCa,
          "method": "POST",
          "params": {},
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        dynamic content = res["content"];
// print('content $content'); // TODO: remove debug

        // Nếu content là chuỗi JSON -> decode
        if (content is String) {
          try {
            content = jsonDecode(content);
          } catch (_) {}
        }

        if (res["success"] == true && content is List) {
          data.value = List<Map<String, dynamic>>.from(content);
          // _showSnack("Thành công", "Đã tải dữ liệu cấu hình", true);
        } else {
          data.clear();
          _showSnack("Thất bại",
              res["content"]?.toString() ?? "Không thể tải cấu hình", false);
        }
      } else {
        _showSnack(
          "Lỗi mạng",
          "Server trả về mã ${response.statusCode}",
          false,
        );
        await _loadOfflineData(); // fallback offline
      }
    } catch (e) {
      _showSnack("Lỗi tải dữ liệu", e.toString(), false);
      await _loadOfflineData(); // fallback offline
    } finally {
      isLoading.value = false;
      update();
    }
  }

  /// =======================================================
  /// 💾 LƯU DỮ LIỆU VỀ API
  /// =======================================================
  Future<void> saveConfig() async {
    try {
      isSaving.value = true;
      update();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateCauHinhGioLuuCa,
          "method": "POST",
          "params": {
            "content": jsonEncode(data),
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        final contentMsg =
            res["content"]?.toString() ?? "Không có phản hồi từ máy chủ";

        if (res["success"] == true) {
          _showSnack("Thành công", contentMsg, true);
        } else {
          _showSnack("Thất bại", contentMsg, false);
        }
      } else {
        _showSnack(
            "Lỗi mạng", "Server trả về mã ${response.statusCode}", false);
      }
    } catch (e) {
      _showSnack("Lỗi kết nối", e.toString(), false);
    } finally {
      isSaving.value = false;
      update();
    }
  }

  /// =======================================================
  /// 🔧 CÁC THAO TÁC VỚI BẢNG
  /// =======================================================
  void addRow() {
    data.add({
      "Trọng tải": "",
      "Chi phí": "",
    });
    update();
  }

  void removeRow(int index) {
    if (index >= 0 && index < data.length) {
      data.removeAt(index);
      update();
    }
  }

  void duplicateRow(int index) {
    if (index >= 0 && index < data.length) {
      final newRow = Map<String, dynamic>.from(data[index]);
      data.insert(index + 1, newRow);
      update();
    }
  }

  void updateCell(int rowIndex, String key, String subKey, dynamic value) {
    if (rowIndex >= 0 && rowIndex < data.length) {
      data[rowIndex][key] = value;
      update();
    }
  }

  /// =======================================================
  /// 📂 LOAD DỮ LIỆU OFFLINE (DÙNG KHI TEST)
  /// =======================================================
  Future<void> _loadOfflineData() async {
    try {
      final jsonString =
      await rootBundle.loadString('assets/CungTuyenKhacTinh.json');
      final List<dynamic> jsonData = jsonDecode(jsonString);
      data.value = List<Map<String, dynamic>>.from(jsonData);
      _showSnack(
          "Dữ liệu mẫu", "Đang hiển thị dữ liệu từ file offline", true);
    } catch (e) {
      _showSnack("Lỗi đọc file offline", e.toString(), false);
    }
  }

  /// =======================================================
  /// 🪧 THÔNG BÁO CHUNG
  /// =======================================================
  void _showSnack(String title, String message, bool success) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor:
      success ? Colors.green.shade600 : Colors.red.shade600,
      colorText: Colors.white,
      duration: const Duration(seconds: 3),
    );
  }
}

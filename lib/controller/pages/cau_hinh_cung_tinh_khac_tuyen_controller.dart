import 'dart:convert';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:kho555/helper/services/auth_services.dart';

class CauHinhCungTinhKhacTuyenController extends GetxController {
  var data = <Map<String, dynamic>>[].obs;

  final isLoading = false.obs;
  final isSaving = false.obs;

  /// Thông tin cấu hình theo ngữ cảnh (mặc định / khách hàng)
  String contextType = "default";
  int? khachHangNid;
  String? tenKhachHang;

  /// -------------------------
  /// 🧩 Load dữ liệu từ API
  /// -------------------------
  Future<void> loadConfig({String? type, int? nid}) async {
    try {
      isLoading.value = true;
      update();

      String apiUrl = AuthService.getCauHinhCungTinhKhacTuyen;

      final isCustomer = type == "khach_hang" && nid != null;
      final isNhaXe = type == "nha_xe" && nid != null;

      if(isCustomer){
        apiUrl = AuthService.getCauHinhCungTinhKhacTuyenKhachHang;
      } else if(isNhaXe) {
        apiUrl = AuthService.getCauHinhCungTinhKhacTuyenNhaXe;
      }

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": apiUrl,
          "method": "POST",
          "params": isCustomer || isNhaXe ? {"nid": nid} : {},
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        dynamic content = res["content"];

        if (content is String) {
          try {
            content = jsonDecode(content);
          } catch (_) {}
        }

        if (res["success"] == true && content is List) {
          data.value = content.map<Map<String, dynamic>>((item) {
            return Map<String, dynamic>.from(item);
          }).toList();
        } else {
          data.value = [];
          _showSnack(
            "Không có dữ liệu",
            res["content"]?.toString() ?? "Không thể tải cấu hình",
            false,
          );
        }
      } else {
        _showSnack("Lỗi mạng", "Server trả về mã ${response.statusCode}", false);
      }
    } catch (e) {
      _showSnack("Lỗi tải dữ liệu", e.toString(), false);
    } finally {
      isLoading.value = false;
      update();
    }
  }

  /// -------------------------
  /// 💾 Lưu dữ liệu về API
  /// -------------------------
  Future<void> saveConfig() async {
    try {
      isSaving.value = true;
      update();

      final isCustomer = contextType == "khach_hang" && khachHangNid != null;
      final isNhaXe = contextType == "nha_xe" && khachHangNid != null;

      String apiUrl =  AuthService.updateCauHinhCungTinhKhacTuyen;

      if(isCustomer){
        apiUrl = AuthService.updateCauHinhCungTinhKhacTuyenKhachHang;
      } else if(isNhaXe) {
        apiUrl = AuthService.updateCauHinhCungTinhKhacTuyenNhaXe;
      }


      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": apiUrl,
          "method": "POST",
          "params": {
            "content": jsonEncode(data),
            if (isCustomer || isNhaXe) "nid": khachHangNid,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        final contentMsg = res["content"]?.toString() ?? "Không có phản hồi";

        if (res["success"] == true) {
          AppToast.success(contentMsg);
        } else {
          AppToast.error(contentMsg);
        }
      } else {
        AppToast.error("Server trả về mã ${response.statusCode}");
      }
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isSaving.value = false;
      update();
    }
  }

  /// -------------------------
  /// 🔧 Các thao tác với bảng
  /// -------------------------
  void addRow() {
    data.add({
      "Trọng tải": "",
      "Chi phí": "",
      "KM gần nhất": "",
      "KM xa nhất": "",
      "ĐVT": "",
    });
    update();
  }

  void removeRow(int index) {
    if (index >= 0 && index < data.length) {
      data.removeAt(index);
      update();
    }
  }

  void updateCell(int rowIndex, String key, String subKey, dynamic value) {
    if (rowIndex >= 0 && rowIndex < data.length) {
      data[rowIndex][key] = value;
      update();
    }
  }

  void duplicateRow(int index) {
    if (index < 0 || index >= data.length) return;
    final newRow = Map<String, dynamic>.from(data[index]);
    data.insert(index + 1, newRow);
    update();
  }

  /// -------------------------
  /// 🪧 Snackbar helper
  /// -------------------------
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

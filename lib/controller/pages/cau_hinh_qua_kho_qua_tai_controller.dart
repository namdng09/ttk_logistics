import 'dart:convert';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';

class CauHinhQuaKhoQuaTaiController extends GetxController {
  var data = <Map<String, dynamic>>[].obs;
  final isLoading = false.obs;
  final isSaving = false.obs;

  /// Ngữ cảnh khách hàng
  String contextType = "default";
  int? khachHangNid;
  String? tenKhachHang;

  /// =======================================================
  /// 🧩 LOAD DỮ LIỆU
  /// =======================================================
  Future<void> loadConfig({String? type, int? nid}) async {
    try {
      isLoading.value = true;
      update();

      final isCustomer = type == "khach_hang" && nid != null;
      final isNhaXe = type == "nha_xe" && nid != null;

      String apiUrl =  AuthService.getCauHinhQuaKhoQuaTai;

      if(isCustomer){
        apiUrl = AuthService.getCauHinhQuaKhoQuaTaiKhachHang;
      } else if(isNhaXe) {
        apiUrl = AuthService.getCauHinhQuaKhoQuaTaiNhaXe;
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
          data.value = List<Map<String, dynamic>>.from(content);
        } else {
          data.clear();
          _showSnack("Thất bại",
              res["content"]?.toString() ?? "Không thể tải cấu hình", false);
        }
      } else {
        _showSnack("Lỗi mạng", "Server trả về mã ${response.statusCode}", false);
        await _loadOfflineData();
      }
    } catch (e) {
      _showSnack("Lỗi tải dữ liệu", e.toString(), false);
      await _loadOfflineData();
    } finally {
      isLoading.value = false;
      update();
    }
  }

  /// =======================================================
  /// 💾 LƯU DỮ LIỆU
  /// =======================================================
  Future<void> saveConfig() async {
    try {
      isSaving.value = true;
      update();

      final isCustomer = contextType == "khach_hang" && khachHangNid != null;
      final isNhaXe = contextType == "nha_xe" && khachHangNid != null;

      String apiUrl =  AuthService.updateCauHinhQuaKhoQuaTai;

      if(isCustomer){
        apiUrl = AuthService.updateCauHinhQuaKhoQuaTaiKhachHang;
      } else if(isNhaXe) {
        apiUrl = AuthService.updateCauHinhQuaKhoQuaTaiNhaXe;
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
        res["success"] == true ? AppToast.success("Thành công") : AppToast.error("Thất bại");
      } else {
        AppToast.error("Server trả về ${response.statusCode}");
      }
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isSaving.value = false;
      update();
    }
  }

  /// =======================================================
  /// 🔧 THAO TÁC DỮ LIỆU
  /// =======================================================
  void addRow() {
    data.add({"Trọng tải": "", "Chi phí": ""});
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
  /// 📂 LOAD OFFLINE
  /// =======================================================
  Future<void> _loadOfflineData() async {
    try {
      final jsonString =
      await rootBundle.loadString('assets/QuaKhoQuaTai.json');
      final List<dynamic> jsonData = jsonDecode(jsonString);
      data.value = List<Map<String, dynamic>>.from(jsonData);
      _showSnack("Dữ liệu mẫu", "Đang hiển thị dữ liệu offline", true);
    } catch (e) {
      _showSnack("Lỗi đọc file offline", e.toString(), false);
    }
  }

  /// =======================================================
  /// 🪧 THÔNG BÁO
  /// =======================================================
  void _showSnack(String title, String message, bool success) {
    Get.snackbar(title, message,
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor:
        success ? Colors.green.shade600 : Colors.red.shade600,
        colorText: Colors.white,
        duration: const Duration(seconds: 3));
  }
}

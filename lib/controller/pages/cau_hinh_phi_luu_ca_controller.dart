import 'dart:convert';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';

class CauHinhPhiLuuCaController extends GetxController {
  /// =========================
  /// 🧩 DỮ LIỆU VÀ TRẠNG THÁI
  /// =========================
  var data = <Map<String, dynamic>>[].obs;
  final isLoading = false.obs;
  final isSaving = false.obs;

  /// Loại cấu hình (default hoặc khach_hang)
  String contextType = "default";

  /// Nếu là khách hàng, sẽ có nid & tên khách hàng
  int? khachHangNid;
  String? tenKhachHang;

  /// =========================
  /// 🔹 LOAD DỮ LIỆU
  /// =========================
  Future<void> loadConfig({String? type, int? nid}) async {
    try {
      isLoading.value = true;
      // 🔗 Xác định API tương ứng
      String apiUrl = AuthService.getCauHinhPhiLuuCa;

      final isCustomer = type == "khach_hang" && nid != null;
      final isNhaXe = type == "nha_xe" && nid != null;
      Map<String, dynamic> params = {};

      if(isCustomer){
        apiUrl = AuthService.getCauHinhPhiLuuCaKhachHang;
        params = {"nid": nid};
      } else if(isNhaXe) {
        apiUrl = AuthService.getCauHinhPhiLuuCaNhaXe;
        params = {"nid": nid};
      }

// print('apiUrl phi luu ca $apiUrl'); // TODO: remove debug

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": apiUrl,
          "method": "POST",
          "params": params,
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
          _showSnack(
            "Không có dữ liệu",
            res["content"]?.toString() ?? "Không thể tải cấu hình",
            false,
          );
        }
      } else {
        _showSnack(
          "Lỗi mạng",
          "Server trả về mã ${response.statusCode}",
          false,
        );
      }
    } catch (e) {
      _showSnack("Lỗi tải dữ liệu", e.toString(), false);
    } finally {
      isLoading.value = false;
      update();
    }
  }

  /// =========================
  /// 💾 LƯU DỮ LIỆU
  /// =========================
  Future<bool> saveConfig() async {
    try {
      isSaving.value = true;
      update();

      final isCustomer = contextType == "khach_hang" && khachHangNid != null;
      final isNhaXe = contextType == "nha_xe" && khachHangNid != null;

      // 🔗 Chọn API tương ứng
      String apiUrl =  AuthService.updateCauHinhPhiLuuCa;

      if(isCustomer){
        apiUrl = AuthService.updateCauHinhPhiLuuCaKhachHang;
      } else if(isNhaXe) {
        apiUrl = AuthService.updateCauHinhPhiLuuCaNhaXe;
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
        final msg = res["content"]?.toString() ?? "Không có phản hồi";

        if (res["success"] == true) {
          AppToast.success(msg);
          return true;
        } else {
          AppToast.error(msg);
          return false;
        }
      } else {
        AppToast.error("Server trả về mã ${response.statusCode}");
        return false;
      }
    } catch (e) {
      AppToast.error(e.toString());
      return false;
    } finally {
      isSaving.value = false;
      update();
    }
  }

  /// =========================
  /// 🔧 HÀM TIỆN ÍCH VỚI BẢNG
  /// =========================
  void addRow() {
    data.add({
      "Ngày": "",
      "Trọng tải 1T": "",
      "Trọng tải 2T": "",
      "Trọng tải 5T": "",
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

  void updateCell(int rowIndex, String column, dynamic value) {
    if (rowIndex >= 0 && rowIndex < data.length) {
      data[rowIndex][column] = value;
      update();
    }
  }

  void renameColumn(String oldName, String newName) {
    if (oldName == newName) return;
    for (var row in data) {
      if (row.containsKey(oldName)) {
        row[newName] = row.remove(oldName);
      }
    }
    update();
  }

  void addColumn(String columnName) {
    for (var row in data) {
      row[columnName] = '';
    }
    update();
  }

  void removeColumn(String columnName) {
    for (var row in data) {
      row.remove(columnName);
    }
    update();
  }

  /// =========================
  /// 🪧 HIỂN THỊ THÔNG BÁO
  /// =========================
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

import 'dart:convert';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

class CuocVanChuyenController extends GetxController {
  // ===============================
  // 🔹 Dữ liệu bảng
  // ===============================
  List<Map<String, dynamic>> rows = [];
  List<String> columns = [];
  Map<String, String> columnLabels = {};

  // ===============================
  // 🔹 Trạng thái và ngữ cảnh
  // ===============================
  bool isLoading = false;
  var isSaving = false.obs;

  /// "default" = cấu hình hệ thống, "khach_hang" = cấu hình riêng từng KH
  String contextType = "default";

  int? khachHangNid;
  String? tenKhachHang;

  // ===============================
  // 📦 Load dữ liệu
  // ===============================
  Future<void> loadData({
    String type = "default",
    int? khachHangNid,
  }) async {
    contextType = type;
    this.khachHangNid = khachHangNid;
    isLoading = true;
    update();

    try {
      late final Map<String, dynamic> body;

      if (contextType == "khach_hang" && khachHangNid != null) {
        // 🚛 Cước vận chuyển của từng khách hàng
        body = {
          "url": AuthService.getCuocVanChuyenKhachHang,
          "method": "POST",
          "params": {"nid": khachHangNid},
        };
      } else {
        // ⚙️ Cước vận chuyển mặc định của hệ thống
        body = {
          "url": AuthService.getCuocVanChuyen,
          "method": "POST",
        };
      }

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        dynamic content = res["content"];

        if (content is String && content.trim().isNotEmpty) {
          rows = List<Map<String, dynamic>>.from(jsonDecode(content));
        } else if (content is List) {
          rows = List<Map<String, dynamic>>.from(content);
        }

        if (rows.isEmpty) {
          rows = [
            {"Điểm đi": "Hải Phòng", "Điểm đến mới": "", "Cước": ""}
          ];
        }

        columns = rows.first.keys.toList();
        columnLabels = {for (var c in columns) c: _toDisplayLabel(c)};
      } else {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi loadData: $e");
      Get.snackbar("Lỗi tải dữ liệu", e.toString(),
          backgroundColor: Colors.red.shade100);
    } finally {
      isLoading = false;
      update();
    }
  }

  // ===============================
  // 💾 Lưu dữ liệu
  // ===============================
  Future<bool> saveData() async {
    try {
      isSaving.value = true;
      update();

      late final Map<String, dynamic> body;

      if (contextType == "khach_hang" && khachHangNid != null) {
        // 🚛 Lưu cấu hình riêng của khách hàng
        body = {
          "url": AuthService.saveCuocVanChuyenKhachHang,
          "method": "POST",
          "params": {
            "nid": khachHangNid,
            "content": jsonEncode(rows),
          },
        };
      } else {
        // ⚙️ Lưu cấu hình mặc định toàn hệ thống
        body = {
          "url": AuthService.saveCuocVanChuyen,
          "method": "POST",
          "params": {
            "content": rows,
          },
        };
      }

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(body),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        final success = res["success"] == true;
        final msg = res["content"]?.toString() ??
            (success ? "Đã lưu cấu hình cước" : "Không thể lưu dữ liệu");

        Get.snackbar(
          success ? "Thành công" : "Thất bại",
          msg,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor:
          success ? Colors.green.shade600 : Colors.red.shade600,
          colorText: Colors.white,
          duration: const Duration(seconds: 3),
        );

        return success;
      } else {
        Get.snackbar(
          "Lỗi mạng",
          "Server trả về mã ${response.statusCode}",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.orange.shade700,
          colorText: Colors.white,
        );
        return false;
      }
    } catch (e) {
      Get.snackbar(
        "Lỗi kết nối",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade700,
        colorText: Colors.white,
      );
      return false;
    } finally {
      isSaving.value = false;
      update();
    }
  }

  // ===============================
  // 🔠 Helper hiển thị cột
  // ===============================
  String _toDisplayLabel(String key) {
    switch (key) {
      case 'Điểm đến mới':
        return 'Điểm đến';
      default:
        return key.replaceAll('_', ' ').capitalizeFirst!;
    }
  }

  // ===============================
  // ✏️ Các thao tác bảng
  // ===============================
  void renameColumn(String oldName, String newName) {
    if (oldName == newName) return;

    for (var row in rows) {
      if (row.containsKey(oldName)) {
        row[newName] = row.remove(oldName);
      }
    }

    final index = columns.indexOf(oldName);
    if (index != -1) {
      columns[index] = newName;
    }

    update();
  }

  void addColumn(String label) {
    for (var row in rows) {
      row[label] = '';
    }
    columns.add(label);
    update();
  }

  void removeColumn(String key) {
    columns.remove(key);
    for (var row in rows) {
      row.remove(key);
    }
    columnLabels.remove(key);
    update();
  }

  void duplicateColumn(String key) {
    var newKey = "$key (copy)";
    var counter = 1;
    while (columns.contains(newKey)) {
      counter++;
      newKey = "$key (copy $counter)";
    }

    for (var row in rows) {
      row[newKey] = row[key];
    }

    columns.add(newKey);
    update();
  }

  bool canRename(String key) =>
      key != 'Điểm đi' && key != 'Điểm đến mới' && key != 'Điểm đến cũ';
  bool canDelete(String key) => canRename(key);
  bool canDuplicate(String key) => canRename(key);

  void updateCell(int rowIndex, String column, dynamic value) {
    if (rowIndex < 0 || rowIndex >= rows.length) return;
    rows[rowIndex][column] = value;
    update();
  }

  void duplicateRow(int index) {
    if (index < 0 || index >= rows.length) return;
    final newRow = Map<String, dynamic>.from(rows[index]);
    rows.insert(index + 1, newRow);
    update();
  }

  void removeRow(int index) {
    if (index < 0 || index >= rows.length) return;
    rows.removeAt(index);
    update();
  }
}

import 'dart:convert';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

class CuocVanChuyenThueNgoaiController extends GetxController {
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

  /// Loại ngữ cảnh: "default" hoặc "nha_xe"
  String contextType = "default";

  /// Nếu là cấu hình nhà xe thì có thêm thông tin
  int? nhaXeNid;
  String? tenNhaXe;

  // ===============================
  // 📦 Load dữ liệu
  // ===============================
  Future<void> loadData({
    String type = "default",
    int? nhaXeNid,
  }) async {
    contextType = type;
    this.nhaXeNid = nhaXeNid;
    isLoading = true;
    update();

    try {
      late final Map<String, dynamic> body;

      if (contextType == "nha_xe" && nhaXeNid != null) {
        // 🚛 Load dữ liệu cước của từng nhà xe
        body = {
          "url": AuthService.getCuocVanChuyenNhaXe,
          "method": "POST",
          "params": {"nid": nhaXeNid}
        };
      } else {
        // ⚙️ Load dữ liệu cước mặc định (node 5443)
        body = {
          "url": AuthService.getCuocVanChuyenThueNgoai,
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

      if (contextType == "nha_xe" && nhaXeNid != null) {
        // 🚛 Lưu cấu hình cước riêng cho nhà xe
        body = {
          "url": AuthService.saveCuocVanChuyenNhaXe,
          "method": "POST",
          "params": {
            "nid": nhaXeNid,
            "content": jsonEncode(rows),
          },
        };
      } else {
        // ⚙️ Lưu cấu hình mặc định toàn hệ thống
        body = {
          "url": AuthService.updateCuocVanChuyenThueNgoai,
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
        success ? AppToast.success(msg) : AppToast.error(msg);
        return success;
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

  // ===============================
  // 🧩 Helper: đổi nhãn hiển thị
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
  // ✏️ Thao tác bảng
  // ===============================
  void renameColumn(String oldName, String newName) {
    if (oldName == newName) return;
    for (var row in rows) {
      if (row.containsKey(oldName)) {
        row[newName] = row.remove(oldName);
      }
    }
    final index = columns.indexOf(oldName);
    if (index != -1) columns[index] = newName;
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

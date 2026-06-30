import 'dart:convert';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';

/// ------------------------------------------
///  CauHinhBaoHiemController
/// ------------------------------------------
/// Quản lý cấu hình chi phí bảo hiểm cho hệ thống hoặc từng khách hàng.
/// Dữ liệu có dạng:
/// [
///   {
///     "loaiXe": "Xe tải 5 tấn",
///     "Chi phí": { "Bảo hiểm A": "100000", "Bảo hiểm B": "200000" },
///     "Trọng tải": { "5T": "x", "10T": "" }
///   },
///   ...
/// ]
class CauHinhBaoHiemController extends GetxController {
  /// Danh sách cấu hình JSON
  var data = <Map<String, dynamic>>[].obs;

  /// Trạng thái xử lý
  final isLoading = false.obs;
  final isSaving = false.obs;

  /// -------------------------
  /// 🧩 Ngữ cảnh hiện tại
  /// -------------------------
  String contextType = "default"; // "default" hoặc "khach_hang"
  int? khachHangNid;
  String? tenKhachHang;

  /// -------------------------
  /// 🧩 Load dữ liệu
  /// -------------------------
  Future<void> loadConfig({String type = "default", int? nid}) async {
    try {
      isLoading.value = true;
      contextType = type;
      khachHangNid = nid;
      update();

      // 🔹 Xác định API tương ứng
      final isCustomer = type == "khach_hang" && nid != null;
      final isNhaXe = type == "nha_xe" && nid != null;
      Map<String, dynamic> params = {};
      String apiUrl =  AuthService.getCauHinhBaoHiem;

      if(isCustomer){
        apiUrl = AuthService.getCauHinhBaoHiemKhachHang;
        params = {"nid": nid};
      } else if(isNhaXe) {
        apiUrl = AuthService.getCauHinhBaoHiemNhaXe;
        params = {"nid": nid};
      }

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": apiUrl,
          "method": "POST",
          "params": params,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception("Server trả về mã ${response.statusCode}");
      }

      final res = jsonDecode(response.body);

      if (res["success"] == true && res["content"] != null) {
        dynamic content = res["content"];
        if (content is String) content = jsonDecode(content);

        if (content is List) {
          data.value = content.map<Map<String, dynamic>>((item) {
            final row = Map<String, dynamic>.from(item);

            // ✅ Chuẩn hóa cấu trúc
            row["Chi phí"] =
            row["Chi phí"] is Map ? Map<String, dynamic>.from(row["Chi phí"]) : {};
            row["Trọng tải"] =
            row["Trọng tải"] is Map ? Map<String, dynamic>.from(row["Trọng tải"]) : {};

            row["loaiXe"] = row["loaiXe"]?.toString() ?? "";
            return row;
          }).toList();
        } else {
          data.value = [];
        }
      } else {
        Get.snackbar(
          "Không có dữ liệu",
          res["content"]?.toString() ?? "Không thể tải cấu hình",
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.orange.shade700,
          colorText: Colors.white,
        );
      }
    } catch (e) {
      Get.snackbar(
        "Lỗi tải dữ liệu",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade700,
        colorText: Colors.white,
      );
    } finally {
      isLoading.value = false;
      update();
    }
  }

  /// -------------------------
  /// 💾 Lưu cấu hình
  /// -------------------------
  Future<void> saveConfig() async {
    try {
      isSaving.value = true;
      update();

      // 🔹 Xác định API cần gọi
      final isCustomer = contextType == "khach_hang" && khachHangNid != null;
      final isNhaXe = contextType == "nha_xe" && khachHangNid != null;

      String apiUrl = AuthService.updateCauHinhBaoHiem;
      Map<String, dynamic> params = {"content": jsonEncode(data)};
      
      if(isCustomer){
        apiUrl = AuthService.updateCauHinhBaoHiemKhachHang;
        params["nid"] = khachHangNid;
      } else if(isNhaXe) {
        apiUrl = AuthService.updateCauHinhBaoHiemNhaXe;
        params["nid"] = khachHangNid;
      }

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": apiUrl,
          "method": "POST",
          "params": params,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception("Server trả về mã ${response.statusCode}");
      }

      final res = jsonDecode(response.body);
      final success = res["success"] == true;
      final msg = res["content"]?.toString() ?? "";

      success ? AppToast.success(msg) : AppToast.error(msg);
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isSaving.value = false;
      update();
    }
  }

  /// -------------------------
  /// 🔧 Các thao tác bảng
  /// -------------------------

  /// ➕ Thêm dòng
  void addRow() {
    data.add({"loaiXe": "", "Chi phí": {}, "Trọng tải": {}});
    update();
  }

  /// ❌ Xóa dòng
  void removeRow(int index) {
    if (index >= 0 && index < data.length) {
      data.removeAt(index);
      update();
    }
  }

  /// ✏️ Cập nhật ô
  void updateCell(int rowIndex, String group, String key, dynamic value) {
    if (rowIndex >= 0 && rowIndex < data.length) {
      final row = data[rowIndex];
      if (row.containsKey(group) && row[group] is Map) {
        row[group][key] = value;
      } else {
        row[group] = {key: value};
      }
      update();
    }
  }

  /// 🪶 Đổi tên cột trong nhóm “Chi phí” hoặc “Trọng tải”
  void renameColumn(String group, String oldKey, String newKey) {
    if (oldKey == newKey) return;
    for (var row in data) {
      if (row[group] != null && row[group] is Map) {
        final map = row[group] as Map<String, dynamic>;
        if (map.containsKey(oldKey)) {
          map[newKey] = map.remove(oldKey);
        }
      }
    }
    update();
  }

  /// ➕ Thêm cột mới
  void addColumn(String group, String key) {
    for (var row in data) {
      if (row[group] == null || row[group] is! Map) row[group] = {};
      row[group][key] = "";
    }
    update();
  }

  /// 🗑️ Xóa cột
  void removeColumn(String group, String key) {
    for (var row in data) {
      if (row[group] != null && row[group] is Map) {
        (row[group] as Map).remove(key);
      }
    }
    update();
  }

  /// 📋 Nhân bản dòng
  void duplicateRow(int index) {
    if (index < 0 || index >= data.length) return;

    final currentRow = data[index];
    final newRow = <String, dynamic>{
      "loaiXe": currentRow["loaiXe"] ?? "",
      "Chi phí": Map<String, dynamic>.from(currentRow["Chi phí"] ?? {}),
      "Trọng tải": Map<String, dynamic>.from(currentRow["Trọng tải"] ?? {}),
    };

    data.insert(index + 1, newRow);
    update();
  }

  /// -------------------------
  /// 🧩 Tiện ích
  /// -------------------------
  List<String> getChiPhiColumns() {
    if (data.isEmpty) return [];
    final row = data.first;
    if (row["Chi phí"] is Map<String, dynamic>) {
      return (row["Chi phí"] as Map<String, dynamic>).keys.toList();
    }
    return [];
  }

  List<String> getTrongTaiColumns() {
    if (data.isEmpty) return [];
    final row = data.first;
    if (row["Trọng tải"] is Map<String, dynamic>) {
      return (row["Trọng tải"] as Map<String, dynamic>).keys.toList();
    }
    return [];
  }
}

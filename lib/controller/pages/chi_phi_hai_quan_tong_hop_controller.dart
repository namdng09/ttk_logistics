import 'dart:convert';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

/// ----------------------------------------------------------------
///  ChiPhiHaiQuanTongHopController (v2)
/// ----------------------------------------------------------------
/// - Quản lý cấu hình chi phí hải quan tổng hợp.
/// - Hỗ trợ cả 2 loại cấu hình:
///   1️⃣ Mặc định hệ thống
///   2️⃣ Riêng cho từng khách hàng (qua `type` và `khachHangNid`)
/// ----------------------------------------------------------------
/// 📦 Cấu trúc dữ liệu ví dụ:
/// [
///   {
///     "Cửa khẩu": "Hữu Nghị",
///     "Chi phí": "Thông quan hàng nhập",
///     "Loại": "Số",
///     "Phí kiểm hóa": "1000000",
///     "Phí kho bãi": "250000"
///   },
///   ...
/// ]
/// ----------------------------------------------------------------
class ChiPhiHaiQuanTongHopController extends GetxController {
  /// Dữ liệu bảng
  List<Map<String, dynamic>> rows = [];

  /// Danh sách cột hiện tại
  List<String> columns = [];

  /// Nhãn hiển thị cột
  Map<String, String> columnLabels = {};

  /// Trạng thái tải / lưu
  bool isLoading = false;
  var isSaving = false.obs;

  /// Loại ngữ cảnh (default / khach_hang)
  String contextType = "default";

  /// Nếu là khách hàng, lưu thông tin nid và tên
  int? khachHangNid;
  String? tenKhachHang;

  // ----------------------------------------------------------
  // 🔹 LOAD DỮ LIỆU
  // ----------------------------------------------------------
  Future<void> loadData({String type = "default", int? nid}) async {
    isLoading = true;
    contextType = type;
    khachHangNid = nid;
    update();

    try {
      // ✅ Xác định endpoint API
      final isCustomer = type == "khach_hang" && nid != null;
      final isNhaXe = type == "nha_xe" && nid != null;
      Map<String, dynamic> params = {};
      String apiUrl =  AuthService.getChiPhiHaiQuanTongHop;

      if(isCustomer){
        apiUrl = AuthService.getChiPhiHaiQuanKhachHang;
        params = {"nid": nid};
      } else if(isNhaXe) {
        apiUrl = AuthService.getChiPhiHaiQuanNhaXe;
        params = {"nid": nid};
      }

      // Gửi yêu cầu qua Worker (tránh CORS)
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
        if (res["content"] is List) {
          final list = res["content"] as List;
          rows = List<Map<String, dynamic>>.from(list);

          if (rows.isNotEmpty) {
            columns = rows.first.keys.toList();
            columnLabels = {for (var c in columns) c: _toDisplayLabel(c)};
          } else {
            columns = ["Cửa khẩu", "Chi phí", "Loại"];
            rows = [];
          }
        } else {
          throw Exception("Dữ liệu không hợp lệ từ Worker");
        }
      } else {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi loadData: $e");
      Get.snackbar(
        "Lỗi tải dữ liệu",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade700,
        colorText: Colors.white,
      );
    } finally {
      isLoading = false;
      update();
    }
  }

  // ----------------------------------------------------------
  // 🔹 LƯU DỮ LIỆU
  // ----------------------------------------------------------
  Future<bool> saveData() async {
    try {
      isSaving.value = true;
      update();

      final isCustomer = contextType == "khach_hang" && khachHangNid != null;
      final isNhaXe = contextType == "nha_xe" && khachHangNid != null;

      Map<String, dynamic> params = {"content": rows};
      String apiUrl =  AuthService.saveChiPhiHaiQuanTongHop;

      if(isCustomer){
        apiUrl = AuthService.saveChiPhiHaiQuanKhachHang;
        params["nid"] = khachHangNid;
      } else if(isNhaXe) {
        apiUrl = AuthService.saveChiPhiHaiQuanNhaXe;
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

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        final bool success = res["success"] == true;
        final msg = res["content"]?.toString() ??
            (success ? "Lưu thành công" : "Lưu thất bại");

        success ? AppToast.success(msg) : AppToast.error(msg);

        return success;
      } else {
        AppToast.error("Server trả về mã ${response.statusCode}");
        return false;
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi saveData: $e");
      AppToast.error(e.toString());
      return false;
    } finally {
      isSaving.value = false;
      update();
    }
  }

  // ----------------------------------------------------------
  // 🔹 XỬ LÝ NHÃN HIỂN THỊ
  // ----------------------------------------------------------
  String _toDisplayLabel(String key) {
    switch (key) {
      case 'Cửa khẩu':
        return 'Cửa khẩu';
      case 'Chi phí':
        return 'Chi phí';
      case 'Loại':
        return 'Loại';
      default:
        return key.replaceAll('_', ' ').capitalizeFirst!;
    }
  }

  // ----------------------------------------------------------
  // 🔹 LẤY CỘT ĐỘNG (bỏ 3 cột chính)
  // ----------------------------------------------------------
  List<String> getDynamicColumns(List<Map<String, dynamic>> rows) {
    if (rows.isEmpty) return [];
    final keys = rows.first.keys.toList();
    return keys.where((k) => !['Cửa khẩu', 'Chi phí', 'Loại'].contains(k)).toList();
  }

  // ----------------------------------------------------------
  // 🔹 THAO TÁC CỘT
  // ----------------------------------------------------------
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

    if (columnLabels.containsKey(oldName)) {
      columnLabels[newName] = columnLabels.remove(oldName)!;
    } else {
      columnLabels[newName] = newName;
    }

    update();
    debugPrint("📝 Đã đổi tên cột '$oldName' → '$newName'");
  }

  bool canRename(String key) =>
      key != 'Cửa khẩu' && key != 'Chi phí' && key != 'Loại';
  bool canDelete(String key) => canRename(key);
  bool canDuplicate(String key) => canRename(key);

// ----------------------------------------------------------
// 🔹 CẬP NHẬT Ô DỮ LIỆU TRONG NHÓM "CỬA KHẨU"
// ----------------------------------------------------------
  void updateCell(String cuaKhau, int localIndex, String column, dynamic value) {
    // Lọc các dòng trong nhóm "Cửa khẩu" tương ứng
    final filtered = rows
        .asMap()
        .entries
        .where((e) => e.value['Cửa khẩu']?.toString().trim() == cuaKhau)
        .toList();

    if (localIndex < 0 || localIndex >= filtered.length) return;

    // Lấy vị trí thực (global index) trong danh sách gốc
    final globalIndex = filtered[localIndex].key;

    // Cập nhật giá trị
    rows[globalIndex][column] = value;

    debugPrint(
        "🟢 updateCell → Cửa khẩu: $cuaKhau | Hàng: $localIndex (global: $globalIndex) | Cột: $column | Giá trị: $value");

    update();
  }

// ----------------------------------------------------------
// 🔹 NHÂN BẢN DÒNG TRONG NHÓM "CỬA KHẨU"
// ----------------------------------------------------------
  void duplicateRow(String cuaKhau, int localIndex) {
    final filtered = rows
        .asMap()
        .entries
        .where((e) => e.value['Cửa khẩu']?.toString().trim() == cuaKhau)
        .toList();

    if (localIndex < 0 || localIndex >= filtered.length) return;

    final globalIndex = filtered[localIndex].key;
    final newRow = Map<String, dynamic>.from(rows[globalIndex]);

    // ✅ Giữ nguyên "Cửa khẩu" để vẫn nằm trong nhóm đó
    newRow['Cửa khẩu'] = cuaKhau;

    // ✅ Thêm dòng ngay sau vị trí cũ trong danh sách gốc
    rows.insert(globalIndex + 1, newRow);

    debugPrint(
        "🟩 duplicateRow → Cửa khẩu: $cuaKhau | localIndex: $localIndex | globalIndex: $globalIndex");

    update();
  }

// ----------------------------------------------------------
// 🔹 XÓA DÒNG TRONG NHÓM "CỬA KHẨU"
// ----------------------------------------------------------
  void removeRow(String cuaKhau, int localIndex) {
    final filtered = rows
        .asMap()
        .entries
        .where((e) => e.value['Cửa khẩu']?.toString().trim() == cuaKhau)
        .toList();

    if (localIndex < 0 || localIndex >= filtered.length) return;

    final globalIndex = filtered[localIndex].key;
    rows.removeAt(globalIndex);

    debugPrint(
        "🟥 removeRow → Cửa khẩu: $cuaKhau | localIndex: $localIndex | globalIndex: $globalIndex");

    update();
  }

}

import 'dart:convert';
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/storage/local_storage.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

/// Controller quản lý dữ liệu bảng lương lái xe
class LuongLaiXeController extends MyController {
  int currentPage = 1;

  /// Danh sách bảng lương hiện tại (items từ API)
  RxList<Map<String, dynamic>> listLuong = <Map<String, dynamic>>[].obs;

  /// Danh sách lái xe (dropdown)
  RxList<Map<String, dynamic>> laiXeList = <Map<String, dynamic>>[].obs;

  /// Lái xe được chọn trong dropdown
  RxInt selectedLaiXeId = 0.obs;

  /// Trạng thái tải dữ liệu
  RxBool isLoading = false.obs;

  /// Số dòng trên mỗi trang
  int rowsPerPage = 10;

  /// Tổng số dòng trong API (để tính phân trang)
  int totalRows = 0;

  RxBool isUpdating = false.obs;

  @override
  void onInit() {
    super.onInit();
    _loadDanhSachLaiXe();
  }

  // ======================================================
  // 🔹 3️⃣ Làm mới dữ liệu hiện tại (Refresh)
  // ======================================================
  Future<void> refreshData({String? thang}) async {
    await fetchData(
      page: 1,
      limit: rowsPerPage,
      thang: thang,
      laiXeId: selectedLaiXeId.value,
    );
  }

  // ======================================================
  // 🔹 4️⃣ Xuất dữ liệu (Excel / JSON)
  // ======================================================
  Future<String> exportToJson() async {
    final jsonStr = jsonEncode(listLuong);
    return jsonStr;
  }

  // ======================================================
  // 🔹 1️⃣ Lấy danh sách lái xe (qua Cloudflare Worker)
  // ======================================================
  Future<void> _loadDanhSachLaiXe({int page = 1}) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      isLoading.value = true;
      update();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListLaiXe, // 🔸 API Drupal thật (ví dụ: https://legend.andinjsc.com/api/lai_xe/list)
          "method": "POST",
          "params": {
            'token': token,
            'created_email': email,
            "page": page,
            "limit": 100, // tải tối đa 100 lái xe để fill dropdown
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        if (res["success"] == true && res["content"] != null) {
          final content = res["content"];
          final data = content ?? content ?? [];

          laiXeList.assignAll(List<Map<String, dynamic>>.from(data));
        } else {
          throw Exception("Dữ liệu lái xe không hợp lệ hoặc rỗng");
        }
      } else {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi _loadDanhSachLaiXe: $e");
      Get.snackbar(
        "Lỗi tải danh sách lái xe",
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

  // ======================================================
  // 🔹 2️⃣ Gọi API lấy danh sách lương lái xe (qua Worker)
  // ======================================================
  Future<void> fetchData({
    int page = 1,
    int limit = 10,
    String? thang,
    int? laiXeId,
  }) async {
    isLoading.value = true;
    update();

    try {
      // 🔹 Payload gửi qua Cloudflare Worker
      final payload = {
        "url": AuthService.getLuongLaiXeList, // https://legend.andinjsc.com/api/luong_lai_xe/list
        "method": "POST",
        "params": {
          "page": page,
          "limit": limit,
          if (thang != null && thang.isNotEmpty) "thang": thang,
          if (laiXeId != null && laiXeId > 0) "lai_xe": laiXeId,
        },
      };

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode(payload),
      );

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }

      // Parse JSON từ Worker hoặc từ API trực tiếp
      final res = jsonDecode(response.body);

      // Nếu Worker bọc dữ liệu → res["content"] là Drupal JSON
      final data = res["content"] ?? res;

      if (data["success"] != true) {
        throw Exception(data["message"] ?? "Không thể tải dữ liệu lương lái xe");
      }

      // 🔹 Parse danh sách và tổng
      final List<dynamic> items = data["items"] ?? [];

      print('items luong lai xe ${items}');
      final int total = data["total"] ?? items.length;

      // 🔹 Gán vào biến controller
      listLuong.assignAll(List<Map<String, dynamic>>.from(items));
      totalRows = total;
    } catch (e) {
      debugPrint("⚠️ Lỗi fetchData: $e");
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

  Future<bool> capNhatChiPhiLuongLaiXe(Map<String, dynamic> payload) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      isUpdating.value = true;
      update();

      print('AuthService.updateChiPhiLuongLaiXe ${AuthService.updateChiPhiLuongLaiXe}');
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateChiPhiLuongLaiXe,
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            "data": payload,
          },
        }),
      );

      if (response.statusCode != 200) {
        AppToast.error("Lỗi kết nối ${response.statusCode}");
        return false;
      }

      final res = jsonDecode(response.body);

      // ❌ Khi success = false
      if (res["success"] != true) {
        final msg = res["message"]?.toString() ?? "Máy chủ từ chối cập nhật chi phí.";
        AppToast.error(msg);
        return false;
      }

      AppToast.success(res["message"]?.toString() ?? "Đã cập nhật chi phí lương lái xe!");
      return true;

    } catch (e) {
      debugPrint("⚠️ Lỗi capNhatChiPhiLuongLaiXe: $e");
      AppToast.error(e.toString());
      return false;

    } finally {
      isUpdating.value = false;
      update();
    }
  }

// Nếu cần xuất Excel hoặc PDF, bạn có thể mở rộng tại đây
// Future<void> exportToExcel() {...}
}

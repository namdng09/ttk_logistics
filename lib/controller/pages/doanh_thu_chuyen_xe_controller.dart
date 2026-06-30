import 'dart:convert';
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/storage/local_storage.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;

/// Controller quản lý dữ liệu doanh thu xe
class DoanhThuChuyenXeController extends MyController {
  int currentPage = 1;

  /// Danh sách doanh thu xe (items từ API)
  RxList<Map<String, dynamic>> listDoanhThu = <Map<String, dynamic>>[].obs;

  /// Danh sách xe (dropdown)
  RxList<Map<String, dynamic>> xeList = <Map<String, dynamic>>[].obs;

  /// Xe được chọn trong dropdown
  RxInt selectedXeId = 0.obs;

  /// Trạng thái tải dữ liệu
  RxBool isLoading = false.obs;

  /// Số dòng trên mỗi trang
  int rowsPerPage = 10;

  /// Tổng số dòng trong API (để tính phân trang)
  int totalRows = 0;

  @override
  void onInit() {
    super.onInit();
    _loadDanhSachXe();
  }

  bool toBool(dynamic v) =>
      v == true ||
          v == "true" ||
          v == 1 ||
          v == "1" ||
          v.toString().toLowerCase() == "yes";

  // ======================================================
  // 🔹 1️⃣ Lấy danh sách xe (qua Cloudflare Worker)
  // ======================================================
  Future<void> _loadDanhSachXe({int page = 1}) async {
    try {
      isLoading.value = true;
      update();

      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListPhuongTien,
          "method": "POST",
          "params": {
            'token': token,
            'created_email': email,
            "page": page,
            "limit": 100,
          },
        }),
      );

      debugPrint('STATUS: ${response.statusCode}');
      debugPrint('RAW BODY: ${response.body}');

      if (response.statusCode != 200) {
        throw Exception("HTTP ${response.statusCode}");
      }

      final decoded = jsonDecode(response.body);

      /// 🔑 Chuẩn hóa items
      List items = [];

      if (decoded is Map) {
        if (decoded["items"] is List) {
          items = decoded["items"];
        } else if (decoded["content"] is Map &&
            decoded["content"]["items"] is List) {
          items = decoded["content"]["items"];
        }
      } else if (decoded is List) {
        items = decoded;
      }

      if (items.isNotEmpty) {
        xeList.assignAll(
          List<Map<String, dynamic>>.from(items),
        );
      } else {
        xeList.clear();
      }
    } catch (e, stack) {
      debugPrint("❌ Lỗi _loadDanhSachXe: $e");
      debugPrintStack(stackTrace: stack);
    } finally {
      isLoading.value = false;
      update();
    }
  }

  // ======================================================
  // 🔹 2️⃣ Gọi API lấy danh sách doanh thu xe (qua Worker)
  // ======================================================
  Future<void> fetchData({
    int page = 1,
    int limit = 10,
    String? thang,
    int? xeId,
  }) async {
    isLoading.value = true;
    update();

    print('AuthService.getDoanhThuPhuongTienList ${AuthService.getDoanhThuPhuongTienList}');

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    final payload = {
      "url": AuthService.getDoanhThuPhuongTienList, // 🔸 ví dụ: https://legend.andinjsc.com/api/doanh_thu_phuong_tien/list
      "method": "POST",
      "params": {
        'token': token,
        'created_email': email,
        "page": page,
        "limit": limit,
        if (thang != null && thang.isNotEmpty) "thang": thang,
        if (xeId != null && xeId > 0) "xe": xeId,
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
    final data = res["content"] ?? res;

    if (data["success"] != true) {
      throw Exception(data["message"] ?? "Không thể tải dữ liệu doanh thu xe");
    }

    final List<dynamic> items = data["items"] ?? [];
    final int total = data["total"] ?? items.length;

    listDoanhThu.assignAll(List<Map<String, dynamic>>.from(items));
    totalRows = total;

    update();
      isLoading.value = false;
      update();

    // try {
    //
    // } catch (e) {
    //   AppToast.error(e.toString());
    // } finally {
    //   isLoading.value = false;
    //   update();
    // }
  }

  // ======================================================
  // 🔹 3️⃣ Làm mới dữ liệu (Refresh)
  // ======================================================
  Future<void> refreshData({String? thang}) async {
    await fetchData(
      page: 1,
      limit: rowsPerPage,
      thang: thang,
      xeId: selectedXeId.value,
    );
  }

  // ======================================================
  // 🔹 4️⃣ Xuất dữ liệu ra JSON (hoặc Excel)
  // ======================================================
  Future<String> exportToJson() async {
    return jsonEncode(listDoanhThu);
  }

  /// Lưu thông tin doanh thu xe (field_thong_tin_json)
  Future<bool> capNhatDoanhThuXe({
    required int nid,
    required Map<String, dynamic> thongTinJson,
  })
  async {
    try {
      isLoading.value = true;
      update();

      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      print('AuthService.updateDoanhThuXe ${AuthService.updateDoanhThuXe}');

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateDoanhThuXe, // API Drupal
          "method": "POST",
          "params": {
            "nid": nid,
            "token": token,
            "created_email": email,
            "field_thong_tin_json": jsonEncode(thongTinJson),
          },
        }),
      );

      final res = jsonDecode(response.body);

      if (res["success"] == true) {
        return true;
      } else {
        throw Exception(res["message"] ?? "Cập nhật doanh thu thất bại");
      }
    } catch (e) {
      AppToast.error("❌ Lỗi lưu doanh thu: $e");
      debugPrint("❌ capNhatDoanhThuXe error: $e");
      return false;
    } finally {
      isLoading.value = false;
      update();
    }
  }

}

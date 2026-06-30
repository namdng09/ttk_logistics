import 'dart:convert';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:get/get.dart';
import 'package:flutter/material.dart';
import 'package:kho555/controller/my_controller.dart';
import 'package:http/http.dart' as http;
import 'package:kho555/helper/storage/local_storage.dart'; // Đảm bảo đã import LocalStorage

class CauHinhController extends MyController {
  TextEditingController thoiGianHanController = TextEditingController();
  double thoiGianHan = 0.0;

  RxBool isLoading = false.obs; // Biến để quản lý trạng thái loading

  // Phương thức gọi API để load dữ liệu cấu hình
  Future<void> loadCauHinh() async {
    try {
      isLoading.value = true; // Bắt đầu quá trình tải dữ liệu
      update(); // Cập nhật UI khi bắt đầu gọi API

      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl), // URL của API
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.loadCauHinh, // API URL để tải cấu hình
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            'type': 'cauHinhKhac'
          },
        }),
      );

      final res = jsonDecode(response.body);

      print('cau hinh thoi gian cong no ${response.body}');
      if (res["success"] == true) {
        // Nếu API trả về thành công, lấy dữ liệu cấu hình
        final thongTinCauHinh = res["noi_dung_html"];
        // Cập nhật giá trị vào controller
        thoiGianHanController.text = thongTinCauHinh.toString();
        thoiGianHan = double.tryParse(thongTinCauHinh.toString()) ?? 0.0;
        update(); // Cập nhật UI sau khi nhận dữ liệu
      } else {
        throw Exception(res["content"] ?? "Lỗi tải cấu hình");
      }
    } catch (e) {
      AppToast.error("❌ Lỗi tải cấu hình: $e");
      debugPrint("❌ loadCauHinh error: $e");
    } finally {
      isLoading.value = false; // Kết thúc quá trình tải dữ liệu
      update(); // Cập nhật UI khi kết thúc
    }
  }

  // Phương thức lưu cấu hình
  Future<void> saveCauHinh() async {
    try {
      isLoading.value = true;
      update(); // Cập nhật UI khi bắt đầu lưu cấu hình

      print('thoiGianHan ${thoiGianHan}');
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl), // URL của API
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateCauHinh, // URL API để lưu cấu hình
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            "noi_dung_html": thoiGianHan, // Truyền giá trị số ngày vào API
            'type': "cauHinhKhac"
          },
        }),
      );

      final res = jsonDecode(response.body);

      if (res["success"] == true) {
        AppToast.success(res['content']);
      } else {
        throw Exception(res["content"] ?? "Lỗi lưu cấu hình");
      }
    } catch (e) {
      AppToast.error("❌ Lỗi lưu cấu hình: $e");
      debugPrint("❌ saveCauHinh error: $e");
    } finally {
      isLoading.value = false; // Kết thúc quá trình lưu cấu hình
      update(); // Cập nhật UI khi kết thúc
    }
  }

  @override
  void onClose() {
    thoiGianHanController.dispose(); // Giải phóng tài nguyên của controller
    super.onClose();
  }
}

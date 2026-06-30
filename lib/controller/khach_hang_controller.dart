import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/bap/khach_hang.dart';
import '../services/khach_hang_service.dart';

class KhachHangController extends MyController {
  var isLoading = false.obs;
  var khachHangList = <KhachHang>[].obs;
  var isSaving = false.obs;
  var errorMessage = "".obs;

  @override
  void onInit() {
    super.onInit();
    fetchKhachHang();
  }

  Future<void> fetchKhachHang() async {
    try {
      isLoading.value = true;
      final data = await KhachHangService.fetchKhachHang();
      khachHangList.assignAll(data);
    } catch (e) {
      Get.snackbar("Lỗi", e.toString());
    } finally {
      isLoading.value = false;
      update(); // 👈 đảm bảo GetBuilder cũng cập nhật
    }
  }

  void addKhachHang(Map<String, dynamic> data) {
    khachHangList.add(KhachHang.fromJson(data));
    update();
  }

  void updateKhachHang(int index, Map<String, dynamic> data) {
    khachHangList[index] = KhachHang.fromJson({
      ...khachHangList[index].toJson(),
      ...data,
    });
    update();
  }

  Future<void> saveKhachHang(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await KhachHangService.saveKhachHang(data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchKhachHang();
        AppToast.success(res.message);
      } else {
        AppToast.success("Thất bại");
      }
    } catch (e) {
      AppToast.success(e.toString());
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> updateKhachHangOnServer(int nid, Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await KhachHangService.updateKhachHang(nid, data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchKhachHang(); // refresh lại danh sách

        Get.snackbar(
          "Thành công",
          res.message,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green.shade600,
          colorText: Colors.white,
          margin: const EdgeInsets.all(12),
          borderRadius: 8,
          duration: const Duration(seconds: 3),
          icon: const Icon(Icons.check_circle, color: Colors.white),
        );
      } else {
        Get.snackbar(
          "Thất bại",
          res.message,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red.shade700,
          colorText: Colors.white,
          margin: const EdgeInsets.all(12),
          borderRadius: 8,
          duration: const Duration(seconds: 4),
          icon: const Icon(Icons.error, color: Colors.white),
        );
      }
    } catch (e) {
      Get.snackbar(
        "Lỗi",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade900,
        colorText: Colors.white,
        margin: const EdgeInsets.all(12),
        borderRadius: 8,
        duration: const Duration(seconds: 4),
        icon: const Icon(Icons.error_outline, color: Colors.white),
      );
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> deleteKhachHang(int nid) async {
    try {
      isSaving.value = true;
      final res = await KhachHangService.deleteKhachHang(nid);

      if (res.success) {
        fetchKhachHang(); // refresh danh sách
        Get.snackbar(
          "Thành công",
          res.message,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.green.shade600,
          colorText: Colors.white,
          margin: const EdgeInsets.all(12),
          borderRadius: 8,
          duration: const Duration(seconds: 3),
          icon: const Icon(Icons.check_circle, color: Colors.white),
        );
      } else {
        Get.snackbar(
          "Thất bại",
          res.message,
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red.shade700,
          colorText: Colors.white,
          margin: const EdgeInsets.all(12),
          borderRadius: 8,
          duration: const Duration(seconds: 4),
          icon: const Icon(Icons.error, color: Colors.white),
        );
      }
    } catch (e) {
      Get.snackbar(
        "Lỗi",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade900,
        colorText: Colors.white,
        margin: const EdgeInsets.all(12),
        borderRadius: 8,
        duration: const Duration(seconds: 4),
        icon: const Icon(Icons.error_outline, color: Colors.white),
      );
    } finally {
      isSaving.value = false;
    }
  }
}

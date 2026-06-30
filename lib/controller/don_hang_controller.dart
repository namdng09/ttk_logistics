
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/models/bap/don_hang.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../services/don_hang_service.dart';

class DonHangController extends MyController {
  var isLoading = false.obs;
  var DonHangList = <DonHang>[].obs;
  var isSaving = false.obs;
  var errorMessage = "".obs;

  @override
  void onInit() {
    super.onInit();
    fetchDonHang();
  }

  Future<void> fetchDonHang() async {
    try {
      isLoading.value = true;
      final data = await DonHangService.fetchDonHang();
      DonHangList.assignAll(data);
    } catch (e) {
      Get.snackbar("Lỗi", e.toString());
    } finally {
      isLoading.value = false;
      update(); // 👈 đảm bảo GetBuilder cũng cập nhật
    }
  }

  void addDonHang(Map<String, dynamic> data) {
    DonHangList.add(DonHang.fromJson(data));
    update();
  }

  void updateDonHang(int index, Map<String, dynamic> data) {
    DonHangList[index] = DonHang.fromJson({
      ...DonHangList[index].toJson(),
      ...data,
    });
    update();
  }

  Future<void> saveDonHang(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await DonHangService.saveDonHang(data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchDonHang();

        Get.snackbar(
          "Thành công",
          res.message, // ✅ lấy nội dung từ content
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
          res.message, // ✅ lấy nội dung từ content
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

  Future<void> updateDonHangOnServer(int nid, Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await DonHangService.updateDonHang(nid, data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchDonHang(); // refresh lại danh sách

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
  //
  Future<void> deleteDonHang(int nid) async {
    try {
      isSaving.value = true;
      final res = await DonHangService.deleteDonHang(nid);

      if (res.success) {
        fetchDonHang(); // refresh danh sách
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

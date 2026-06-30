import 'package:kho555/controller/my_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/bap/lai_xe.dart';
import '../services/lai_xe_service.dart';

class LaiXeController extends MyController {
  var isLoading = false.obs;
  var LaiXeList = <LaiXe>[].obs;
  var isSaving = false.obs;
  var errorMessage = "".obs;

  @override
  void onInit() {
    super.onInit();
    fetchLaiXe();
  }

  Future<void> fetchLaiXe() async {
    try {
      isLoading.value = true;
      final data = await LaiXeService.fetchLaiXe();
      LaiXeList.assignAll(data);
    } catch (e) {
      Get.snackbar("Lỗi", e.toString());
    } finally {
      isLoading.value = false;
      update(); // 👈 đảm bảo GetBuilder cũng cập nhật
    }
  }

  void addLaiXe(Map<String, dynamic> data) {
    LaiXeList.add(LaiXe.fromJson(data));
    update();
  }

  void updateLaiXe(int index, Map<String, dynamic> data) {
    LaiXeList[index] = LaiXe.fromJson({
      ...LaiXeList[index].toJson(),
      ...data,
    });
    update();
  }

  Future<void> saveLaiXe(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await LaiXeService.saveLaiXe(data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchLaiXe();

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

  Future<void> updateLaiXeOnServer(int nid, Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await LaiXeService.updateLaiXe(nid, data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchLaiXe(); // refresh lại danh sách

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
  Future<void> deleteLaiXe(int nid) async {
    try {
      isSaving.value = true;
      final res = await LaiXeService.deleteLaiXe(nid);

      if (res.success) {
        fetchLaiXe(); // refresh danh sách
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

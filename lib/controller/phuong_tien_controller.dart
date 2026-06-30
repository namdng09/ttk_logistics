import 'dart:convert';

import 'package:kho555/controller/my_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/api_response.dart';
import '../models/bap/khach_hang.dart';
import '../models/bap/nha_xe.dart';
import '../models/bap/phuong_tien.dart';
import '../services/khach_hang_service.dart';
import '../services/nha_xe_service.dart';
import '../services/phuong_tien_service.dart';

class PhuongTienController extends MyController {
  var isLoading = false.obs;
  var PhuongTienList = <PhuongTien>[].obs;
  var isSaving = false.obs;
  var errorMessage = "".obs;

  @override
  void onInit() {
    super.onInit();
    fetchPhuongTien();
  }

  Future<void> fetchPhuongTien() async {
    try {
      isLoading.value = true;
      final data = await PhuongTienService.fetchPhuongTien();
      PhuongTienList.assignAll(data);
    } catch (e) {
      Get.snackbar("Lỗi", e.toString());
    } finally {
      isLoading.value = false;
      update(); // 👈 đảm bảo GetBuilder cũng cập nhật
    }
  }

  void addPhuongTien(Map<String, dynamic> data) {
    PhuongTienList.add(PhuongTien.fromJson(data));
    update();
  }

  void updatePhuongTien(int index, Map<String, dynamic> data) {
    PhuongTienList[index] = PhuongTien.fromJson({
      ...PhuongTienList[index].toJson(),
      ...data,
    });
    update();
  }

  Future<void> savePhuongTien(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await PhuongTienService.savePhuongTien(data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchPhuongTien();

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

  Future<void> updatePhuongTienOnServer(int nid, Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await PhuongTienService.updatePhuongTien(nid, data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchPhuongTien(); // refresh lại danh sách

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
  Future<void> deletePhuongTien(int nid) async {
    try {
      isSaving.value = true;
      final res = await PhuongTienService.deletePhuongTien(nid);

      if (res.success) {
        fetchPhuongTien(); // refresh danh sách
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

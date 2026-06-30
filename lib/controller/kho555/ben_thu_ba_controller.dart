import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:kho555/models/kho555/ben_thu_ba.dart';
import 'package:kho555/services/kho555/ben_thu_ba_service.dart';

class BenThuBaController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var benThuBaList = <BenThuBa>[].obs;

  List<BenThuBa> get filteredBenThuBaList {
    final keyword = searchKeyword.value.trim();
    if (keyword.isEmpty) return benThuBaList;
    return benThuBaList.where((item) => item.matches(keyword)).toList();
  }

  @override
  void onInit() {
    super.onInit();
    fetchBenThuBa();
  }

  Future<void> fetchBenThuBa() async {
    try {
      isLoading.value = true;
      final data = await BenThuBaService.fetchBenThuBa();
      benThuBaList.assignAll(data);
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void searchBenThuBa(String keyword) {
    searchKeyword.value = keyword;
    update();
  }

  void clearSearch() {
    searchKeyword.value = '';
    update();
  }

  Future<void> saveBenThuBa(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await BenThuBaService.saveBenThuBa(data);
      if (res.success) {
        Get.back();
        await fetchBenThuBa();
        AppToast.success(res.message);
      } else {
        _showError('Thất bại', res.message);
      }
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> updateBenThuBaOnServer(
    int nid,
    Map<String, dynamic> data,
  ) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await BenThuBaService.updateBenThuBa(nid, data);
      if (res.success) {
        Get.back();
        await fetchBenThuBa();
        _showSuccess(res.message);
      } else {
        _showError('Thất bại', res.message);
      }
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> deleteBenThuBa(int nid) async {
    try {
      isSaving.value = true;
      final res = await BenThuBaService.deleteBenThuBa(nid);

      if (res.success) {
        await fetchBenThuBa();
        _showSuccess(res.message);
      } else {
        _showError('Thất bại', res.message);
      }
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isSaving.value = false;
    }
  }

  void _showSuccess(String message) {
    Get.snackbar(
      'Thành công',
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.green.shade600,
      colorText: Colors.white,
      margin: const EdgeInsets.all(12),
      borderRadius: 8,
      duration: const Duration(seconds: 3),
      icon: const Icon(Icons.check_circle, color: Colors.white),
    );
  }

  void _showError(String title, String message) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.shade700,
      colorText: Colors.white,
      margin: const EdgeInsets.all(12),
      borderRadius: 8,
      duration: const Duration(seconds: 4),
      icon: const Icon(Icons.error_outline, color: Colors.white),
    );
  }
}

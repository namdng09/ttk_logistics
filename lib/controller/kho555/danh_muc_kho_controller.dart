import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/models/kho555/danh_muc_kho.dart';
import 'package:ttk_logistics/services/kho555/danh_muc_kho_service.dart';

class DanhMucKhoController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var khoList = <DanhMucKho>[].obs;
  var userList = <KhoUser>[].obs;

  List<DanhMucKho> get filteredKhoList {
    final keyword = searchKeyword.value.trim();
    if (keyword.isEmpty) return khoList;
    return khoList.where((item) => item.matches(keyword)).toList();
  }

  @override
  void onInit() {
    super.onInit();
    fetchInitialData();
  }

  Future<void> fetchInitialData() async {
    try {
      isLoading.value = true;
      final khoData = await DanhMucKhoService.fetchDanhMucKho();
      final userData = await DanhMucKhoService.fetchKhoUsers();
      khoList.assignAll(khoData);
      userList.assignAll(userData);
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  Future<void> fetchDanhMucKho() async {
    try {
      isLoading.value = true;
      final data = await DanhMucKhoService.fetchDanhMucKho();
      khoList.assignAll(data);
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void searchKho(String keyword) {
    searchKeyword.value = keyword;
    update();
  }

  void clearSearch() {
    searchKeyword.value = '';
    update();
  }

  Future<void> saveDanhMucKho(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await DanhMucKhoService.saveDanhMucKho(data);
      if (res.success) {
        Get.back();
        await fetchDanhMucKho();
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

  Future<void> updateDanhMucKhoOnServer(
    int nid,
    Map<String, dynamic> data,
  ) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await DanhMucKhoService.updateDanhMucKho(nid, data);
      if (res.success) {
        Get.back();
        await fetchDanhMucKho();
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

  Future<void> deleteDanhMucKho(int nid) async {
    try {
      isSaving.value = true;
      final res = await DanhMucKhoService.deleteDanhMucKho(nid);

      if (res.success) {
        await fetchDanhMucKho();
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

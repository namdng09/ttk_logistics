import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/models/kho555/danh_muc.dart';
import 'package:ttk_logistics/services/kho555/danh_muc_service.dart';

class DanhMucController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var danhMucList = <DanhMuc>[].obs;

  List<DanhMuc> get filteredDanhMucList {
    final keyword = searchKeyword.value.trim();
    if (keyword.isEmpty) return danhMucList;
    return danhMucList.where((item) => item.matches(keyword)).toList();
  }

  @override
  void onInit() {
    super.onInit();
    fetchDanhMuc();
  }

  Future<void> fetchDanhMuc() async {
    try {
      isLoading.value = true;
      final data = await DanhMucService.fetchDanhMuc();
      danhMucList.assignAll(data);
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void searchDanhMuc(String keyword) {
    searchKeyword.value = keyword;
    update();
  }

  void clearSearch() {
    searchKeyword.value = '';
    update();
  }

  Future<void> saveDanhMuc(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await DanhMucService.saveDanhMuc(data);
      if (res.success) {
        Get.back();
        await fetchDanhMuc();
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

  Future<void> updateDanhMucOnServer(
    int nid,
    Map<String, dynamic> data,
  ) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await DanhMucService.updateDanhMuc(nid, data);
      if (res.success) {
        Get.back();
        await fetchDanhMuc();
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

  Future<void> deleteDanhMuc(int nid) async {
    try {
      isSaving.value = true;
      final res = await DanhMucService.deleteDanhMuc(nid);

      if (res.success) {
        await fetchDanhMuc();
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

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:kho555/models/kho555/vat_tu.dart';
import 'package:kho555/services/kho555/vat_tu_service.dart';

class VatTuController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var vatTuList = <VatTu>[].obs;

  List<VatTu> get filteredVatTuList {
    final keyword = searchKeyword.value.trim();
    if (keyword.isEmpty) return vatTuList;
    return vatTuList.where((item) => item.matches(keyword)).toList();
  }

  List<String> get donViSuggestions {
    final values = <String>{};
    for (final item in vatTuList) {
      if (item.donVi.trim().isNotEmpty) {
        values.add(item.donVi.trim());
      }
      if (item.donViDinhMuc.trim().isNotEmpty) {
        values.add(item.donViDinhMuc.trim());
      }
    }

    final result = values.toList();
    result.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return result;
  }

  @override
  void onInit() {
    super.onInit();
    fetchVatTu();
  }

  Future<void> fetchVatTu() async {
    try {
      isLoading.value = true;
      final data = await VatTuService.fetchVatTu();
      vatTuList.assignAll(data);
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void searchVatTu(String keyword) {
    searchKeyword.value = keyword;
    update();
  }

  void clearSearch() {
    searchKeyword.value = '';
    update();
  }

  Future<void> saveVatTu(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await VatTuService.saveVatTu(data);
      if (res.success) {
        Get.back();
        await fetchVatTu();
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

  Future<void> updateVatTuOnServer(
      int nid,
      Map<String, dynamic> data,
      ) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await VatTuService.updateVatTu(nid, data);
      if (res.success) {
        Get.back();
        await fetchVatTu();
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

  Future<void> deleteVatTu(int nid) async {
    try {
      isSaving.value = true;
      final res = await VatTuService.deleteVatTu(nid);

      if (res.success) {
        await fetchVatTu();
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

  Future<void> nhapVatTu({
    required int nid,
    required int soLuongNhap,
  }) async {
    if (soLuongNhap <= 0) {
      _showError('Dữ liệu chưa đúng', 'Số lượng nhập phải lớn hơn 0');
      return;
    }

    try {
      isSaving.value = true;
      final res = await VatTuService.nhapVatTu(
        nid: nid,
        soLuongNhap: soLuongNhap,
      );

      if (res.success) {
        Get.back();
        await fetchVatTu();
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

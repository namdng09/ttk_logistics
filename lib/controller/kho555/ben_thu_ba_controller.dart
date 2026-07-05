import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/models/kho555/ben_thu_ba.dart';
import 'package:ttk_logistics/services/kho555/ben_thu_ba_service.dart';

class BenThuBaController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var isDeleting = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var benThuBaList = <BenThuBa>[].obs;

  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var totalItems = 0.obs;
  var limit = 20.obs;

  bool get hasNext => currentPage.value < totalPages.value;
  bool get hasPrev => currentPage.value > 1;

  List<BenThuBa> get displayList {
    final keyword = searchKeyword.value.trim();
    var filtered = benThuBaList.toList();
    if (keyword.isNotEmpty) {
      filtered = benThuBaList.where((item) => item.matches(keyword)).toList();
    }
    final start = (currentPage.value - 1) * limit.value;
    final end = start + limit.value;
    if (start >= filtered.length) return [];
    return filtered.sublist(start, end > filtered.length ? filtered.length : end);
  }

  @override
  void onInit() {
    super.onInit();
    fetchBenThuBa();
  }

  Future<void> fetchBenThuBa() async {
    if (isLoading.value) return;
    try {
      isLoading.value = true;
      final data = await BenThuBaService.fetchBenThuBa();
      benThuBaList.assignAll(data);
      _recalcPagination();
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void _recalcPagination() {
    final keyword = searchKeyword.value.trim();
    final total = keyword.isNotEmpty
        ? benThuBaList.where((item) => item.matches(keyword)).length
        : benThuBaList.length;
    totalItems.value = total;
    totalPages.value = (total / limit.value).ceil();
    if (totalPages.value < 1) totalPages.value = 1;
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
  }

  void goToPage(int page) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    update();
  }

  void nextPage() {
    if (hasNext) goToPage(currentPage.value + 1);
  }

  void prevPage() {
    if (hasPrev) goToPage(currentPage.value - 1);
  }

  void searchBenThuBa(String keyword) {
    searchKeyword.value = keyword;
    currentPage.value = 1;
    _recalcPagination();
    update();
  }

  void clearSearch() {
    searchKeyword.value = '';
    currentPage.value = 1;
    _recalcPagination();
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
      isDeleting.value = true;
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
      isDeleting.value = false;
    }
  }

  void _showSuccess(String message) {
    AppToast.success(message);
  }

  void _showError(String title, String message) {
    AppToast.error(message);
  }
}

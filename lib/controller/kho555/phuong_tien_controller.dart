import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/models/kho555/phuong_tien.dart';
import 'package:ttk_logistics/services/kho555/phuong_tien_service.dart';

class PhuongTienController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var isDeleting = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var phuongTienList = <PhuongTien>[].obs;

  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var totalItems = 0.obs;
  var limit = 20.obs;

  bool get hasNext => currentPage.value < totalPages.value;
  bool get hasPrev => currentPage.value > 1;

  @override
  void onInit() {
    super.onInit();
    fetchPhuongTien();
  }

  Future<void> fetchPhuongTien() async {
    if (isLoading.value) return;
    try {
      isLoading.value = true;
      final result = await PhuongTienService.fetchPhuongTien(
        page: currentPage.value,
        limit: limit.value,
        keyword: searchKeyword.value,
      );
      final items = result['items'] as List<PhuongTien>;
      final pagination = result['pagination'] as Map<String, dynamic>;

      phuongTienList.assignAll(items);
      currentPage.value = pagination['page'] ?? 1;
      totalPages.value = pagination['total_pages'] ?? 1;
      totalItems.value = pagination['total'] ?? 0;
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void goToPage(int page) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchPhuongTien();
  }

  void nextPage() {
    if (hasNext) goToPage(currentPage.value + 1);
  }

  void prevPage() {
    if (hasPrev) goToPage(currentPage.value - 1);
  }

  void changeLimit(int newLimit) {
    limit.value = newLimit;
    currentPage.value = 1;
    fetchPhuongTien();
  }

  void searchPhuongTien(String keyword) {
    searchKeyword.value = keyword;
    currentPage.value = 1;
    fetchPhuongTien();
  }

  void clearSearch() {
    searchKeyword.value = '';
    currentPage.value = 1;
    fetchPhuongTien();
  }

  Future<void> savePhuongTien(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await PhuongTienService.savePhuongTien(data);
      if (res.success) {
        Get.back();
        await fetchPhuongTien();
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

  Future<void> updatePhuongTienOnServer(
    int nid,
    Map<String, dynamic> data,
  ) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await PhuongTienService.updatePhuongTien(nid, data);
      if (res.success) {
        Get.back();
        await fetchPhuongTien();
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

  Future<void> deletePhuongTien(int nid) async {
    if (isDeleting.value) return;
    try {
      isDeleting.value = true;
      final res = await PhuongTienService.deletePhuongTien(nid);

      if (res.success) {
        Get.back();
        if (phuongTienList.length <= 1 && currentPage.value > 1) {
          currentPage.value--;
        }
        await fetchPhuongTien();
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

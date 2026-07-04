import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/models/kho555/lai_xe.dart';
import 'package:ttk_logistics/services/kho555/lai_xe_service.dart';

class LaiXeController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var isDeleting = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var laiXeList = <LaiXe>[].obs;

  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var totalItems = 0.obs;
  var limit = 20.obs;

  bool get hasNext => currentPage.value < totalPages.value;
  bool get hasPrev => currentPage.value > 1;

  @override
  void onInit() {
    super.onInit();
    fetchLaiXe();
  }

  Future<void> fetchLaiXe() async {
    if (isLoading.value) return;
    try {
      isLoading.value = true;
      final result = await LaiXeService.fetchLaiXe(
        page: currentPage.value,
        limit: limit.value,
        keyword: searchKeyword.value,
      );
      final items = result['items'] as List<LaiXe>;
      final pagination = result['pagination'] as Map<String, dynamic>;

      laiXeList.assignAll(items);
      currentPage.value = pagination['page'] ?? 1;
      totalPages.value = pagination['total_pages'] ?? 1;
      totalItems.value = pagination['total'] ?? 0;
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void goToPage(int page) {
    if (page < 1 || page > totalPages.value) return;
    currentPage.value = page;
    fetchLaiXe();
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
    fetchLaiXe();
  }

  void searchLaiXe(String keyword) {
    searchKeyword.value = keyword;
    currentPage.value = 1;
    fetchLaiXe();
  }

  void clearSearch() {
    searchKeyword.value = '';
    currentPage.value = 1;
    fetchLaiXe();
  }

  Future<void> saveLaiXe(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await LaiXeService.saveLaiXe(data);
      if (res.success) {
        Get.back();
        await fetchLaiXe();
        AppToast.success(res.message);
      } else {
        AppToast.warning(res.message);
      }
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> updateLaiXeOnServer(
    int nid,
    Map<String, dynamic> data,
  ) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';

      final res = await LaiXeService.updateLaiXe(nid, data);
      if (res.success) {
        Get.back();
        await fetchLaiXe();
        AppToast.success(res.message);
      } else {
        AppToast.warning(res.message);
      }
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> deleteLaiXe(int nid) async {
    if (isDeleting.value) return;
    try {
      isDeleting.value = true;
      final res = await LaiXeService.deleteLaiXe(nid);

      if (res.success) {
        Get.back();
        if (laiXeList.length <= 1 && currentPage.value > 1) {
          currentPage.value--;
        }
        await fetchLaiXe();
        AppToast.success(res.message);
      } else {
        AppToast.warning(res.message);
      }
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isDeleting.value = false;
    }
  }
}

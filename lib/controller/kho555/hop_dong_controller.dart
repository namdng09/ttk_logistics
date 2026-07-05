import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/models/kho555/hop_dong.dart';
import 'package:ttk_logistics/services/kho555/hop_dong_service.dart';

class HopDongController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var isDeleting = false.obs;
  var errorMessage = ''.obs;
  var searchKeyword = ''.obs;
  var hopDongList = <HopDong>[].obs;

  var currentPage = 1.obs;
  var totalPages = 1.obs;
  var totalItems = 0.obs;
  var limit = 20.obs;

  bool get hasNext => currentPage.value < totalPages.value;
  bool get hasPrev => currentPage.value > 1;

  @override
  void onInit() {
    super.onInit();
    fetchHopDong();
  }

  Future<void> fetchHopDong() async {
    if (isLoading.value) return;
    try {
      isLoading.value = true;
      final result = await HopDongService.fetchHopDong(
        page: currentPage.value,
        limit: limit.value,
        keyword: searchKeyword.value,
      );
      final items = result['items'] as List<HopDong>;
      final pagination = result['pagination'] as Map<String, dynamic>;

      hopDongList.assignAll(items);
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
    fetchHopDong();
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
    fetchHopDong();
  }

  void searchHopDong(String keyword) {
    searchKeyword.value = keyword;
    currentPage.value = 1;
    fetchHopDong();
  }

  void clearSearch() {
    searchKeyword.value = '';
    currentPage.value = 1;
    fetchHopDong();
  }

  Future<void> saveHopDong(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';
      final res = await HopDongService.saveHopDong(data);
      if (res.success) {
        Get.back();
        await fetchHopDong();
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

  Future<void> updateHopDongOnServer(int nid, Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = '';
      final res = await HopDongService.updateHopDong(nid, data);
      if (res.success) {
        Get.back();
        await fetchHopDong();
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

  Future<void> deleteHopDong(int nid) async {
    if (isDeleting.value) return;
    try {
      isDeleting.value = true;
      final res = await HopDongService.deleteHopDong(nid);
      if (res.success) {
        Get.back();
        if (hopDongList.length <= 1 && currentPage.value > 1) {
          currentPage.value--;
        }
        await fetchHopDong();
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

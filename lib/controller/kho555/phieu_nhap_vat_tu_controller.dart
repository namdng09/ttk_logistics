import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:kho555/models/kho555/phieu_nhap_vat_tu.dart';
import 'package:kho555/models/kho555/ton_kho_thang_vat_tu.dart';
import 'package:kho555/services/kho555/phieu_nhap_vat_tu_service.dart';

import '../../models/kho555/ton_kho_vat_tu.dart';

class PhieuNhapVatTuController extends MyController {
  var isLoading = false.obs;
  var isSaving = false.obs;
  var searchKeyword = ''.obs;
  var phieuList = <PhieuNhapVatTu>[].obs;
  var nhaCungCapList = <OptionItem>[].obs;
  var khoList = <OptionItem>[].obs;
  var vatTuList = <OptionItem>[].obs;
  var userList = <OptionItem>[].obs;

  // Tồn kho theo ngày
  final tonKhoList = <TonKhoVatTu>[].obs;

  final tonKhoPage = 1.obs;
  final tonKhoLimit = 20.obs;
  final tonKhoTotal = 0.obs;
  final tonKhoTotalPages = 1.obs;
  final tonKhoHasNext = false.obs;
  final tonKhoHasPrev = false.obs;

  final tonKhoFromDate = 0.obs;
  final tonKhoToDate = 0.obs;
  final tonKhoFromDateText = ''.obs;
  final tonKhoToDateText = ''.obs;

  // Tồn kho theo tháng
  var tonKhoTheoThangList = <TonKhoThangVatTu>[].obs;

  var tonKhoThangPage = 1.obs;
  var tonKhoThangLimit = 20.obs;
  var tonKhoThangTotal = 0.obs;
  var tonKhoThangTotalPages = 0.obs;
  var tonKhoThangHasNext = false.obs;
  var tonKhoThangHasPrev = false.obs;

  var tonKhoThangSummaryTonDauKy = 0.0.obs;
  var tonKhoThangSummaryNhapTrongKy = 0.0.obs;
  var tonKhoThangSummaryXuatTrongKy = 0.0.obs;
  var tonKhoThangSummaryTonCuoiKy = 0.0.obs;

  final DateTime _now = DateTime.now();

  late final RxInt selectedMonth = _now.month.obs;
  late final RxInt selectedYear = _now.year.obs;

  var selectedKhoNid = 0.obs;
  var selectedVatTuNid = 0.obs;

  List<PhieuNhapVatTu> get filteredPhieuList {
    final keyword = searchKeyword.value.trim().toLowerCase();
    if (keyword.isEmpty) return phieuList;
    return phieuList.where((item) {
      return [
        item.title,
        item.nhaCungCapTitle,
        item.trangThai,
        item.trangThaiIn,
      ].any((value) => value.toLowerCase().contains(keyword));
    }).toList();
  }

  double get tongTonDauKyThang {
    return tonKhoTheoThangList.fold<double>(
      0,
          (sum, item) => sum + item.tonDauKy,
    );
  }

  double get tongNhapTrongKyThang {
    return tonKhoTheoThangList.fold<double>(
      0,
          (sum, item) => sum + item.nhapTrongKy,
    );
  }

  double get tongXuatTrongKyThang {
    return tonKhoTheoThangList.fold<double>(
      0,
          (sum, item) => sum + item.xuatTrongKy,
    );
  }

  double get tongTonCuoiKyThang {
    return tonKhoTheoThangList.fold<double>(
      0,
          (sum, item) => sum + item.tonCuoiKy,
    );
  }

  @override
  void onInit() {
    super.onInit();
    fetchInitialData();
  }

  Future<void> fetchInitialData() async {
    try {
      isLoading.value = true;
      phieuList.assignAll(await PhieuNhapVatTuService.fetchPhieuNhapVatTu());
      nhaCungCapList.assignAll(await PhieuNhapVatTuService.fetchNhaCungCap());
      khoList.assignAll(await PhieuNhapVatTuService.fetchKho());
      vatTuList.assignAll(await PhieuNhapVatTuService.fetchVatTu());
      userList.assignAll(await PhieuNhapVatTuService.fetchUsers());
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  Future<void> fetchPhieuNhapVatTu() async {
    try {
      isLoading.value = true;
      phieuList.assignAll(await PhieuNhapVatTuService.fetchPhieuNhapVatTu());
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void searchPhieu(String keyword) {
    searchKeyword.value = keyword;
    update();
  }

  void clearSearch() {
    searchKeyword.value = '';
    update();
  }

  Future<void> savePhieuNhapVatTu(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      final res = await PhieuNhapVatTuService.savePhieuNhapVatTu(data);
      if (res.success) {
        Get.back();
        await fetchPhieuNhapVatTu();
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

  Future<void> updatePhieuNhapVatTuOnServer(
    int nid,
    Map<String, dynamic> data,
  ) async {
    try {
      isSaving.value = true;
      final res = await PhieuNhapVatTuService.updatePhieuNhapVatTu(nid, data);
      if (res.success) {
        Get.back();
        await fetchPhieuNhapVatTu();
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

  Future<void> deletePhieuNhapVatTu(int nid) async {
    try {
      isSaving.value = true;
      final res = await PhieuNhapVatTuService.deletePhieuNhapVatTu(nid);
      if (res.success) {
        await fetchPhieuNhapVatTu();
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

  Future<void> updateTrangThaiPhieuNhapVatTu(int nid, String trangThai) async {
    try {
      isSaving.value = true;
      final res = await PhieuNhapVatTuService.updateTrangThaiPhieuNhapVatTu(nid, trangThai);
      if (res.success) {
        await fetchPhieuNhapVatTu();
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

  Future<void> fetchBaoCaoTonKhoVatTu({
    int? fromDate,
    int? toDate,
    int? khoNid,
    int? vatTuNid,
    int page = 1,
    int limit = 20,
    bool showSuccessToast = false,
  }) async {
    try {
      isLoading.value = true;

      final int filterPage = page < 1 ? 1 : page;
      final int filterLimit = limit < 1 ? 20 : limit;

      tonKhoPage.value = filterPage;
      tonKhoLimit.value = filterLimit;

      final response = await PhieuNhapVatTuService.fetchBaoCaoTonKhoVatTu(
        fromDate: fromDate,
        toDate: toDate,
        khoNid: (khoNid ?? 0) > 0 ? khoNid : null,
        vatTuNid: (vatTuNid ?? 0) > 0 ? vatTuNid : null,
        page: filterPage,
        limit: filterLimit,
      );

      tonKhoList.assignAll(response.items);

      tonKhoPage.value = response.page;
      tonKhoLimit.value = response.limit;
      tonKhoTotal.value = response.total;
      tonKhoTotalPages.value = response.totalPages <= 0 ? 1 : response.totalPages;
      tonKhoHasNext.value = response.hasNext;
      tonKhoHasPrev.value = response.hasPrev;

      tonKhoFromDate.value = response.fromDate;
      tonKhoToDate.value = response.toDate;
      tonKhoFromDateText.value = response.fromDateText;
      tonKhoToDateText.value = response.toDateText;

      selectedKhoNid.value = response.khoNid;
      selectedVatTuNid.value = response.vatTuNid;

      if (showSuccessToast) {
        _showSuccess('Đã tải báo cáo tồn kho');
      }
    } catch (e) {
      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  Future<void> fetchBaoCaoTonKhoTheoThang({
    int? month,
    int? year,
    int? khoNid,
    int? vatTuNid,
    int? page,
    int? limit,
    bool showSuccessToast = false,
  }) async {
    try {
      isLoading.value = true;

      final int filterMonth = month ?? selectedMonth.value;
      final int filterYear = year ?? selectedYear.value;
      final int filterKhoNid = khoNid ?? selectedKhoNid.value;
      final int filterVatTuNid = vatTuNid ?? selectedVatTuNid.value;
      final int filterPage = page ?? tonKhoThangPage.value;
      final int filterLimit = limit ?? tonKhoThangLimit.value;

      selectedMonth.value = filterMonth;
      selectedYear.value = filterYear;
      selectedKhoNid.value = filterKhoNid;
      selectedVatTuNid.value = filterVatTuNid;

      final result = await PhieuNhapVatTuService.fetchBaoCaoTonKhoTheoThang(
        month: filterMonth,
        year: filterYear,
        khoNid: filterKhoNid > 0 ? filterKhoNid : null,
        vatTuNid: filterVatTuNid > 0 ? filterVatTuNid : null,
        page: filterPage,
        limit: filterLimit,
      );

      tonKhoTheoThangList.assignAll(result.rows);

      tonKhoThangPage.value = result.page;
      tonKhoThangLimit.value = result.limit;
      tonKhoThangTotal.value = result.total;
      tonKhoThangTotalPages.value = result.totalPages;
      tonKhoThangHasNext.value = result.hasNext;
      tonKhoThangHasPrev.value = result.hasPrev;

      selectedMonth.value = result.month > 0 ? result.month : filterMonth;
      selectedYear.value = result.year > 0 ? result.year : filterYear;

      // API có default kho đầu tiên.
      // Ví dụ app không gửi kho_nid thì API trả về kho_nid = 3.
      selectedKhoNid.value = result.khoNid;
      selectedVatTuNid.value = result.vatTuNid;

      tonKhoThangSummaryTonDauKy.value = result.summaryTonDauKy;
      tonKhoThangSummaryNhapTrongKy.value = result.summaryNhapTrongKy;
      tonKhoThangSummaryXuatTrongKy.value = result.summaryXuatTrongKy;
      tonKhoThangSummaryTonCuoiKy.value = result.summaryTonCuoiKy;

      if (showSuccessToast) {
        AppToast.success(
          'Đã tải báo cáo tồn kho tháng ${selectedMonth.value}/${selectedYear.value}',
        );
      }
    } catch (e) {
      tonKhoTheoThangList.clear();

      tonKhoThangTotal.value = 0;
      tonKhoThangTotalPages.value = 0;
      tonKhoThangHasNext.value = false;
      tonKhoThangHasPrev.value = false;

      tonKhoThangSummaryTonDauKy.value = 0;
      tonKhoThangSummaryNhapTrongKy.value = 0;
      tonKhoThangSummaryXuatTrongKy.value = 0;
      tonKhoThangSummaryTonCuoiKy.value = 0;

      _showError('Lỗi', e.toString());
    } finally {
      isLoading.value = false;
      update();
    }
  }

  void changeTonKhoThangFilter({
    int? month,
    int? year,
    int? khoNid,
    int? vatTuNid,
  }) {
    if (month != null) selectedMonth.value = month;
    if (year != null) selectedYear.value = year;
    if (khoNid != null) selectedKhoNid.value = khoNid;
    if (vatTuNid != null) selectedVatTuNid.value = vatTuNid;

    tonKhoThangPage.value = 1;

    update();
  }

  Future<void> resetTonKhoThangFilter() async {
    selectedMonth.value = DateTime.now().month;
    selectedYear.value = DateTime.now().year;
    selectedKhoNid.value = 0;
    selectedVatTuNid.value = 0;

    tonKhoThangPage.value = 1;
    tonKhoThangLimit.value = 20;

    await fetchBaoCaoTonKhoTheoThang();
  }

  Future<void> refreshBaoCaoTonKhoTheoThang() async {
    await fetchBaoCaoTonKhoTheoThang(
      month: selectedMonth.value,
      year: selectedYear.value,
      khoNid: selectedKhoNid.value,
      vatTuNid: selectedVatTuNid.value,
      page: tonKhoThangPage.value,
      limit: tonKhoThangLimit.value,
    );
  }

  Future<void> nextTonKhoThangPage() async {
    if (!tonKhoThangHasNext.value) return;

    await fetchBaoCaoTonKhoTheoThang(
      month: selectedMonth.value,
      year: selectedYear.value,
      khoNid: selectedKhoNid.value,
      vatTuNid: selectedVatTuNid.value,
      page: tonKhoThangPage.value + 1,
      limit: tonKhoThangLimit.value,
    );
  }

  Future<void> prevTonKhoThangPage() async {
    if (!tonKhoThangHasPrev.value) return;

    await fetchBaoCaoTonKhoTheoThang(
      month: selectedMonth.value,
      year: selectedYear.value,
      khoNid: selectedKhoNid.value,
      vatTuNid: selectedVatTuNid.value,
      page: tonKhoThangPage.value - 1,
      limit: tonKhoThangLimit.value,
    );
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

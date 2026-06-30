import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_hop_dong_nha_xe_screen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../models/bap/nha_xe.dart';
import '../services/nha_xe_service.dart';

class NhaXeController extends MyController {
  var isLoading = false.obs;
  var nhaXeList = <NhaXe>[].obs;
  var isSaving = false.obs;
  var errorMessage = "".obs;

  @override
  void onInit() {
    super.onInit();
    fetchNhaXe();
  }

  Future<void> fetchNhaXe() async {
    try {
      isLoading.value = true;
      final data = await NhaXeService.fetchNhaXe();
      nhaXeList.assignAll(data);
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isLoading.value = false;
      update(); // 👈 đảm bảo GetBuilder cũng cập nhật
    }
  }

  void addNhaXe(Map<String, dynamic> data) {
    nhaXeList.add(NhaXe.fromJson(data));
    update();
  }

  void updateNhaXe(int index, Map<String, dynamic> data) {
    nhaXeList[index] = NhaXe.fromJson({
      ...nhaXeList[index].toJson(),
      ...data,
    });
    update();
  }

  Future<void> saveNhaXe(Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await NhaXeService.saveNhaXe(data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchNhaXe();
        AppToast.success(res.message);
      } else {
        AppToast.error(res.message);
      }
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> updateNhaXeOnServer(int nid, Map<String, dynamic> data) async {
    try {
      isSaving.value = true;
      errorMessage.value = "";

      final res = await NhaXeService.updateNhaXe(nid, data);

      if (res.success) {
        Get.back(); // đóng dialog
        fetchNhaXe(); // refresh lại danh sách
        AppToast.success(res.message);
      } else {
        AppToast.error(res.message);
      }
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isSaving.value = false;
    }
  }
  //
  Future<void> deleteNhaXe(int nid) async {
    try {
      isSaving.value = true;
      final res = await NhaXeService.deleteNhaXe(nid);

      if (res.success) {
        fetchNhaXe(); // refresh danh sách
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

  Future<void> openHopDongNhaXeEditor(Map<String, dynamic> nhaXe) async {
    try {
      final nid = nhaXe["nid"];
      final tenNhaXe = nhaXe["title"] ?? "";

      if (nid == null) {
        Get.snackbar("Thiếu dữ liệu", "Không xác định được nhà xe để in hợp đồng!");
        return;
      }

      Get.to(
            () => const CauHinhHopDongNhaXeScreen(),
        arguments: {
          "nid": nid,
          "tenNhaXe": tenNhaXe,
        },
      );
    } catch (e) {
      Get.snackbar("Lỗi", "Không thể mở trình soạn thảo hợp đồng: $e");
    }
  }

}


import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

import '../../models/bap/config_block.dart';
import '../../services/config_block_service.dart';
class ConfigBlockPageController extends MyController {
  var config = Rxn<ConfigBlock>();
  var isLoading = false.obs;
  final isSaving = false.obs;
  /// Lựa chọn cửa khẩu hiện tại
  var selectedCuaKhau = RxnString();
  Future<void> loadConfig(String url, Map<String, dynamic> data) async {
    try {
      isLoading.value = true;
      update(); // báo UI rebuild
      config.value = await ConfigBlockService.fetchConfigBlock(url, data);
// print('config.value ${config.value}'); // TODO: remove debug
    } catch (e) {
      Get.snackbar("Lỗi", "Không tải được config $url: $e");
    } finally {
      isLoading.value = false;
      update(); // báo UI rebuild lần nữa
    }
  }

  /// Auto save: gọi API khi thay đổi dữ liệu
  Future<void> updateConfigRealtime(String blockName, Map<String, dynamic> params) async {
    if (config.value == null) return;

    isSaving.value = true;

    final result = await ConfigBlockService.updateConfigBlock(blockName, config.value!, params);

    if (result) {
      Get.snackbar(
        "Thành công",
        "Đã lưu cấu hình",
        backgroundColor: const Color(0xff23c58f),
        snackPosition: SnackPosition.BOTTOM,
        colorText: Colors.white
      );
    } else {
      Get.snackbar(
        "Thất bại",
        "Không thể lưu cấu hình",
        backgroundColor: Colors.red.shade400,
        snackPosition: SnackPosition.BOTTOM,
          colorText: Colors.white
      );
    }

    isSaving.value = false;
  }
}
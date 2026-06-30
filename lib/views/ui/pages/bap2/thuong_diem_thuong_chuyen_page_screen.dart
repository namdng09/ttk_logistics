import 'dart:convert';

import 'package:amount_input_formatter/amount_input_formatter.dart';
import 'package:ttk_logistics/controller/pages/config_block_page_controller.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:intl/intl.dart';

import '../../../../helper/widgets/my_text.dart';

class ThuongDiemThuongChuyenPageScreen extends StatefulWidget {
  const ThuongDiemThuongChuyenPageScreen({super.key});

  @override
  State<ThuongDiemThuongChuyenPageScreen> createState() => _ThuongDiemThuongChuyenPageScreenState();
}

class _ThuongDiemThuongChuyenPageScreenState extends State<ThuongDiemThuongChuyenPageScreen>
    with UIMixin {
  // final ConfigBlockPageController controller = Get.put(ConfigBlockPageController());
  final controller = Get.put(ConfigBlockPageController(), tag: "thuong-diem-thuong-chuyen");

  @override
  void initState() {
    super.initState();
    // Load dữ liệu khi khởi động
    controller.loadConfig(AuthService.getThuongDiemThuongChuyen, {});
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConfigBlockPageController>(
      tag: 'thuong-diem-thuong-chuyen',
      init: controller,
      builder: (controller) {
        final rawData = controller.config.value?.data;
        Map<String, dynamic> data = {};
        if (rawData is String) {
          try {
            data = jsonDecode(rawData);
          } catch (_) {}
        } else if (rawData is Map<String, dynamic>) {
          data = Map<String, dynamic>.from(rawData);
        }

        data["tra_diem"] ??= 0;
        final thuongChuyen = (data["thuong_chuyen"] as List?)?.map((e) => e is int ? e : int.tryParse(e.toString()) ?? 0).toList() ?? List.filled(30, 0);


        if (thuongChuyen.length < 30) {
          thuongChuyen.addAll(List.filled(30 - thuongChuyen.length, 0));
        }
        return Layout(
          mainScreenName: 'Cấu hình',
          subScreenName: 'Thưởng trả điểm, thưởng chuyến',
          actions: [
            Obx(() => MyContainer(
              onTap: controller.isSaving.value
                  ? null
                  : () {
                final current = controller.config.value;
                if (current == null) return;
                controller.config.value = current.copyWith(
                  data: jsonEncode({
                    "tra_diem": data["tra_diem"],
                    "thuong_chuyen": thuongChuyen,
                  }),
                );
                controller.updateConfigRealtime(
                  AuthService.updateThuongDiemThuongChuyen,
                  {},
                );
              },
              color: contentTheme.success,
              paddingAll: 12,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  controller.isSaving.value
                      ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white),
                  )
                      : const Icon(Icons.save,
                      size: 20, color: Colors.white),
                  const SizedBox(width: 8),
                  MyText.labelMedium("Lưu cấu hình",
                      color: contentTheme.onSuccess),
                ],
              ),
            )),
          ],
          child: MyContainer(
            child: controller.isLoading.value
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Ô nhập thưởng trả điểm
                  Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: Row(
                      children: [
                        const Text("Thưởng trả điểm:",
                            style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(width: 12),
                        SizedBox(
                          width: 200,
                          child: TextFormField(
                            initialValue:
                            NumberFormat.decimalPattern('vi_VN')
                                .format(data["tra_diem"] ?? 0),
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              border: OutlineInputBorder(),
                              isDense: true,
                              contentPadding: EdgeInsets.all(12),
                            ),
                            onChanged: (val) {
                              final parsed =
                                  int.tryParse(val.replaceAll('.', '')) ?? 0;
                              data["tra_diem"] = parsed;
                            },
                            inputFormatters: [
                              AmountInputFormatter(
                                  fractionalDigits: 0,
                                  groupSeparator: NumberFormatter.kDot,
                                  decimalSeparator: NumberFormatter.kComma)
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Các ô nhập thưởng chuyến
                  const Text("Thưởng chuyến (1 → 30):",
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 16,
                    runSpacing: 20,
                    children: List.generate(30, (index) {
                      return SizedBox(
                        width: 120,
                        child: TextFormField(
                          initialValue:
                          NumberFormat.decimalPattern('vi_VN').format(
                              thuongChuyen[index] ?? 0),
                          keyboardType: TextInputType.number,
                          decoration: InputDecoration(
                            isDense: true,
                            border: const OutlineInputBorder(),
                            labelText: "Chuyến ${index + 1}",
                            contentPadding: const EdgeInsets.all(10),
                          ),
                          onChanged: (val) {
                            final parsed =
                                int.tryParse(val.replaceAll('.', '')) ?? 0;
                            thuongChuyen[index] = parsed;
                          },
                          inputFormatters: [
                            AmountInputFormatter(
                                fractionalDigits: 0,
                                groupSeparator: NumberFormatter.kDot,
                                decimalSeparator: NumberFormatter.kComma)
                          ],
                        ),
                      );
                    }),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

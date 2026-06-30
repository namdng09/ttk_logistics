
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

class TinhPhiLuuCaPageScreen extends StatefulWidget {
  const TinhPhiLuuCaPageScreen({super.key});

  @override
  State<TinhPhiLuuCaPageScreen> createState() => _TinhPhiLuuCaPageScreenState();
}

class _TinhPhiLuuCaPageScreenState extends State<TinhPhiLuuCaPageScreen>
    with UIMixin {
  // final ConfigBlockPageController controller = Get.put(ConfigBlockPageController());
  final controller = Get.put(ConfigBlockPageController(), tag: "tinh-phi-luu-ca");

  @override
  void initState() {
    super.initState();

    // Load dữ liệu khi khởi động
    controller.loadConfig(AuthService.getCauHinhPhiLuuCa, {});
  }
  Widget buildDataTable(List<dynamic> jsonData) {
    final Set<String> allKeys = {};
    for (var day in jsonData) {
      if (day is Map) {
        allKeys.addAll(day.keys.cast<String>());
      }
    }

    final List<String> sortedKeys = allKeys.toList()..sort();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 24,
        columns: [
          const DataColumn(label: Text("Loại xe (chỉnh sửa)")),
          for (int dayIndex = 0; dayIndex < jsonData.length; dayIndex++)
            DataColumn(label: Text("Ngày ${dayIndex + 1}")),
        ],
        rows: sortedKeys.map((vehicleType) {
          return DataRow(
            cells: [
              DataCell(
                SizedBox(
                  width: 390,
                  child: TextFormField(
                    initialValue: vehicleType,
                    decoration: const InputDecoration(
                      isDense: true,
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (newKey) {
                      for (int i = 0; i < jsonData.length; i++) {
                        final value = jsonData[i][vehicleType];
                        jsonData[i].remove(vehicleType);
                        jsonData[i][newKey] = value;
                      }
                      Get.find<ConfigBlockPageController>(tag: 'tinh-phi-luu-ca')
                          .update();
                    },
                  ),
                ),
              ),
              for (int dayIndex = 0;
              dayIndex < jsonData.length;
              dayIndex++)
                DataCell(
                  SizedBox(
                    width: 100,
                    child: TextFormField(
                      initialValue: (jsonData[dayIndex][vehicleType] != null && jsonData[dayIndex][vehicleType].toString().isNotEmpty)
                          ? NumberFormat.decimalPattern('vi_VN')
                          .format(int.tryParse(jsonData[dayIndex][vehicleType].toString().replaceAll('.', '')) ?? 0)
                          : '',
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        isDense: true,
                        contentPadding:
                        EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (val) {
                        final parsed = int.tryParse(val.replaceAll('.', '')) ?? 0;
                        jsonData[dayIndex][vehicleType] = val;
                      },
                      inputFormatters: [
                        AmountInputFormatter(
                            fractionalDigits: 0,
                            groupSeparator: NumberFormatter.kDot,
                            decimalSeparator: NumberFormatter.kComma)
                      ],
                    ),
                  ),
                ),
            ],
          );
        }).toList(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConfigBlockPageController>(
      tag: 'tinh-phi-luu-ca',
      init: controller,
      builder: (controller) {
        final jsonData = controller.config.value?.data as List<dynamic>? ?? [];
        return Layout(
          mainScreenName: 'Cấu hình',
          subScreenName: 'Tính phí lưu ca',
          actions: [
            Obx(() => MyContainer(
              onTap: controller.isSaving.value
                  ? null
                  : () {
                final current = controller.config.value;
                if (current == null) return;

                controller.config.value = current.copyWith(data: jsonData);
                controller.updateConfigRealtime(
                  AuthService.updateCauHinhPhiLuuCa,{}
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
                      : const Icon(Icons.save, size: 20, color: Colors.white),
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
                : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // // Nút Thêm/Xoá ngày
                Row(
                  children: [
                    ElevatedButton.icon(
                      icon: const Icon(Icons.add),
                      label: const Text("Thêm ngày"),
                      onPressed: () {
                        final firstDay =
                        Map<String, dynamic>.from(jsonData.firstOrNull ?? {});
                        jsonData.add(
                            firstDay.map((key, _) => MapEntry(key, "")));
                        controller.update();
                      },
                    ),
                    const SizedBox(width: 12),
                    if (jsonData.length > 1)
                      ElevatedButton.icon(
                        icon: const Icon(Icons.remove),
                        label: const Text("Xoá ngày cuối"),
                        onPressed: () {
                          jsonData.removeLast();
                          controller.update();
                        },
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                // Bảng dữ liệu
                buildDataTable(jsonData)
              ],
            ),
          ),
        );
      },
    );
  }
}

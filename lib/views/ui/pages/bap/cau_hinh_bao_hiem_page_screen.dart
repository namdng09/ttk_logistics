import 'package:amount_input_formatter/amount_input_formatter.dart';
import 'package:kho555/controller/pages/config_block_page_controller.dart';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../../helper/widgets/my_text.dart';

class CauHinhBaoHiemPageScreen extends StatefulWidget {
  const CauHinhBaoHiemPageScreen({super.key});

  @override
  State<CauHinhBaoHiemPageScreen> createState() =>
      _CauHinhBaoHiemPageScreenState();
}

class _CauHinhBaoHiemPageScreenState
    extends State<CauHinhBaoHiemPageScreen> with UIMixin {
  final controller =
  Get.put(ConfigBlockPageController(), tag: "cau-hinh-chi-phi-bao-hiem");

  @override
  void initState() {
    super.initState();
    controller.loadConfig(AuthService.getCauHinhBaoHiem, {});
  }

  String shortenLabel(String label) {
    final regex = RegExp(r'([0-9\.]+ ?-? ?[0-9\.]* ?tấn).*?\((\d+ CBM)\)');
    final match = regex.firstMatch(label);
    if (match != null) {
      return "${match.group(1)} (${match.group(2)})"; // ví dụ: "1.5–2.4 tấn (9 CBM)"
    }
    return label.length > 10 ? label.substring(0, 10) + "…" : label;
  }

  bool isVehicleColumn(String key) {
    // Nhận diện cột loại xe dựa vào từ khóa "tấn", "HQ", "FOOC", "Sàn/Rào"
    return key.contains("tấn") ||
        key.contains("HQ") ||
        key.contains("FOOC") ||
        key.contains("Sàn/Rào");
  }

  Widget buildDataTable(List<dynamic> jsonData) {
    // Lấy toàn bộ key động (bỏ loaiXe)
    final Set<String> dynamicCols = {};
    for (var item in jsonData) {
      if (item is Map) {
        for (var k in item.keys) {
          if (k != 'loaiXe') {
            dynamicCols.add(k);
          }
        }
      }
    }
    final cols = dynamicCols.toList();

    final ScrollController scrollController = ScrollController();

    return GestureDetector(
      onHorizontalDragUpdate: (details) {
        scrollController.jumpTo(
          (scrollController.offset - details.delta.dx).clamp(
            0.0,
            scrollController.position.maxScrollExtent,
          ),
        );
      },
      child: SingleChildScrollView(
        controller: scrollController,
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columnSpacing: 12,
          columns: [
            const DataColumn(label: Text("Loại xe")),
            ...cols.map((c) => DataColumn(
              label: Tooltip(
                message: c,
                child: Text(
                  shortenLabel(c),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            )),
            const DataColumn(label: Text("Xoá")),
          ],
          rows: List.generate(jsonData.length, (i) {
            final item = jsonData[i] as Map<String, dynamic>;

            return DataRow(cells: [
              // Cột "Loại xe" (text input)
              DataCell(SizedBox(
                width: 150,
                child: TextFormField(
                  initialValue: item['loaiXe'] ?? '',
                  onChanged: (val) => item['loaiXe'] = val,
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding:
                    EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                  ),
                ),
              )),

              // Các cột động
              ...cols.map((c) {
                if (isVehicleColumn(c)) {
                  // 🔹 Nếu là cột loại xe → Checkbox
                  return DataCell(
                     Checkbox(
                      value: (item[c]?.toString().toLowerCase() == "x" ||
                          item[c]?.toString() == "1"),
                      onChanged: (val) {
                        item[c] = val == true ? "x" : "";
                        controller.update();
                      },
                       activeColor: Colors.green, // màu khi được chọn
                       checkColor: Colors.white,  // màu dấu check
                    ),
                  );
                } else {
                  // 🔹 Các cột phí khác → TextFormField
                  return DataCell(SizedBox(
                    width: 90,
                    child: TextFormField(

                      initialValue: (item[c] != null && item[c].toString().isNotEmpty)
                          ? NumberFormat.decimalPattern('vi_VN')
                          .format(int.tryParse(item[c].toString().replaceAll('.', '')) ?? 0)
                          : '',
                      decoration: const InputDecoration(
                        isDense: true,
                        border: OutlineInputBorder(),
                        contentPadding:
                        EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                      ),
                      onChanged: (val) {
                        final parsed = int.tryParse(val.replaceAll('.', '')) ?? 0;
                        item[c] = parsed;
                      },
                      inputFormatters: [
                        AmountInputFormatter(
                            fractionalDigits: 0,
                            groupSeparator: NumberFormatter.kDot,
                            decimalSeparator: NumberFormatter.kComma)
                      ],
                    ),
                  ));
                }
              }),

              // Cột xoá
              DataCell(IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                onPressed: () {
                  jsonData.removeAt(i);
                  controller.update();
                },
              )),
            ]);
          }),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConfigBlockPageController>(
      tag: 'cau-hinh-chi-phi-bao-hiem',
      init: controller,
      builder: (controller) {
        final jsonData = controller.config.value?.data as List<dynamic>? ?? [];

        return Layout(
          mainScreenName: 'Cấu hình',
          subScreenName: 'Chi phí bảo hiểm',
          actions: [
            // Nút lưu cấu hình
            Obx(() => MyContainer(
              onTap: controller.isSaving.value
                  ? null
                  : () {
                final current = controller.config.value;
                if (current == null) return;

                controller.config.value =
                    current.copyWith(data: jsonData);
                controller.updateConfigRealtime(
                  AuthService.updateCauHinhBaoHiem,{}
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
                : buildDataTable(jsonData),
          ),
        );
      },
    );
  }
}


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

class CauHinhPhiHaiQuanPageScreen extends StatefulWidget {
  final String type;

  const CauHinhPhiHaiQuanPageScreen({super.key, required this.type});

  @override
  State<CauHinhPhiHaiQuanPageScreen> createState() => _CauHinhPhiHaiQuanPageScreenState();
}

class _CauHinhPhiHaiQuanPageScreenState extends State<CauHinhPhiHaiQuanPageScreen>
    with UIMixin {
  // final ConfigBlockPageController controller = Get.put(ConfigBlockPageController());
  // final controller = Get.put(ConfigBlockPageController(), tag: "cau-hinh-phi-hai-quan");
  late String tag = "cau-hinh-phi-hai-quan-${widget.type}";
  late String tenCuaKhau;
  late ConfigBlockPageController controller = Get.put(ConfigBlockPageController(), tag: tag);

  @override
  void initState() {
    super.initState();

    // Load dữ liệu khi khởi động
    controller.loadConfig(AuthService.getCauHinhPhiHaiQuan, {
      'type': widget.type
    });
    if(widget.type == 'huu-nghi') {
      tenCuaKhau = 'Hữu Nghị';
    } else if(widget.type == 'chi-ma')
      tenCuaKhau = 'Chi Ma';
    else if(widget.type == 'coc-nam')
      tenCuaKhau = 'Cốc Nam';
    else if(widget.type == 'tan-thanh')
      tenCuaKhau = 'Tân Thanh';
    else
      tenCuaKhau = '';
  }

  String shortenLabel(String label) {
    final regex = RegExp(r'([0-9\.]+ ?-? ?[0-9\.]* ?tấn).*?\((\d+ CBM)\)');
    final match = regex.firstMatch(label);
    if (match != null) {
      return "${match.group(1)} (${match.group(2)})"; // ví dụ: "1.5–2.4t (9 CBM)"
    }
    return label.length > 10 ? "${label.substring(0, 10)}…" : label;
  }


  Widget buildDataTable(List<dynamic> jsonData) {
    // Lấy tất cả loại xe (các key khác label/key/value)
    final Set<String> dynamicCols = {};
    for (var item in jsonData) {
      if (item is Map) {
        for (var k in item.keys) {
          if (k != 'label' && k != 'key' && k != 'value') {
            dynamicCols.add(k);
          }
        }
      }
    }
    final cols = dynamicCols.toList();

    // Controller để cuộn ngang khi kéo
    final ScrollController scrollController = ScrollController();

    return GestureDetector(
      onHorizontalDragUpdate: (details) {
        scrollController.jumpTo(
          scrollController.offset - details.delta.dx,
        );
      },
      child: SingleChildScrollView(
        controller: scrollController,
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columnSpacing: 12,
          columns: [
            const DataColumn(label: Text("Nhãn")),
            ...cols.map((c) => DataColumn(
              label: Tooltip(
                message: c,
                child: Text(
                  c.length > 10 ? "${c.substring(0, 10)}..." : c,
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            )),
            const DataColumn(label: Text("Xoá")),
          ],
          rows: List.generate(jsonData.length, (i) {
            final item = jsonData[i] as Map<String, dynamic>;
            return DataRow(cells: [
              // Label
              DataCell(SizedBox(
                width: 180,
                child: TextFormField(
                  initialValue: item['label'] ?? '',
                  onChanged: (val) => item['label'] = val,
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding:
                    EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                  ),
                ),
              )),

              // Các loại xe động
              ...cols.map((c) => DataCell(SizedBox(
                width: 80,
                child: TextFormField(
                  initialValue: (item[c] != null && item[c].toString().isNotEmpty)
                      ? NumberFormat.decimalPattern('vi_VN')
                      .format(int.tryParse(item[c].toString().replaceAll('.', '')) ?? 0)
                      : '',
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
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding:
                    EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                  ),
                ),
              ))),

              // Nút xoá
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
      tag: 'cau-hinh-phi-hai-quan-${widget.type}',
      init: controller,
      builder: (controller) {
        final jsonData = controller.config.value?.data as List<dynamic>? ?? [];
        return Layout(
          mainScreenName: 'Cấu hình',
          subScreenName: 'Phí hải quan $tenCuaKhau',
          actions: [
            Obx(() => MyContainer(
              onTap: controller.isSaving.value
                  ? null
                  : () {
                final current = controller.config.value;
                if (current == null) return;

                controller.config.value = current.copyWith(data: jsonData);
                controller.updateConfigRealtime(
                  AuthService.updateCauHinhPhiHaiQuan, {
                    'type': widget.type
                }
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
            MyContainer(
              onTap: () {
                jsonData.add({"label": "", "key": "", "value": ""});
                controller.update();
              },
              color: contentTheme.primary,
              paddingAll: 12,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.add, color: Colors.white),
                  SizedBox(width: 8),
                  Text("Thêm dòng", style: TextStyle(color: Colors.white)),
                ],
              ),
            ),
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

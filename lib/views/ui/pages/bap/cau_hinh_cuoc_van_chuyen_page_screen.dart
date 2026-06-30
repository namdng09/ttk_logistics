import 'package:amount_input_formatter/amount_input_formatter.dart';
import 'package:ttk_logistics/controller/pages/config_block_page_controller.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import '../../../../helper/widgets/my_text.dart';

class CauHinhCuocVanChuyenPageScreen extends StatefulWidget {
  const CauHinhCuocVanChuyenPageScreen({super.key});

  @override
  State<CauHinhCuocVanChuyenPageScreen> createState() =>
      _CauHinhCuocVanChuyenPageScreenState();
}

class _CauHinhCuocVanChuyenPageScreenState
    extends State<CauHinhCuocVanChuyenPageScreen> with UIMixin {
  final controller =
  Get.put(ConfigBlockPageController());

  final ScrollController _scrollController = ScrollController(); // chỉ khai báo 1 lần

  String? selectedCuaKhau;

  final List<String> cuaKhauOptions = [
    "Hữu Nghị",
    "Tân Thanh",
    "Chi Ma",
    "Cốc Nam",
    "Ga"
  ];

  @override
  void initState() {
    super.initState();
    controller.loadConfig(AuthService.getCuocVanChuyen, {});
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ConfigBlockPageController>(
      init: controller,
      builder: (controller) {
        final allData =
            controller.config.value?.data as List<dynamic>? ?? [];

        final filteredData = selectedCuaKhau == null
            ? []
            : allData.where((e) => e['Điiểm đi'] == selectedCuaKhau).toList();

        return Layout(
          mainScreenName: 'Cấu hình',
          subScreenName: 'Cước vận chuyển',
          actions: [
            Obx(() => MyContainer(
              onTap: controller.isSaving.value
                  ? null
                  : () {
                final current = controller.config.value;
                if (current == null) return;

                controller.config.value =
                    current.copyWith(data: allData);
                controller.updateConfigRealtime(
                    AuthService.saveCuocVanChuyen, {});
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
                : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Selection cửa khẩu
                SizedBox(
                  width: 200,
                  child: DropdownButtonFormField<String>(
                    dropdownColor: contentTheme.onPrimary,
                    initialValue: selectedCuaKhau,
                    items: cuaKhauOptions
                        .map((ck) => DropdownMenuItem(
                      value: ck,
                      child: Text(ck),
                    ))
                        .toList(),
                    onChanged: (val) {
                      setState(() {
                        selectedCuaKhau = val;
                      });
                    },

                    decoration: const InputDecoration(
                      labelText: "Chọn cửa khẩu",
                      border: OutlineInputBorder(),
                      isDense: true,
                      contentPadding: EdgeInsets.symmetric(
                          vertical: 8, horizontal: 8),
                    ),
                  ),
                ),

                const SizedBox(height: 16),

                // Hiển thị dữ liệu lọc theo cửa khẩu
                SizedBox(
                  child: filteredData.isEmpty
                      ? const Center(child: Text("Chưa có dữ liệu cho cửa khẩu này"))
                      : GestureDetector(
                    onHorizontalDragUpdate: (details) {
                      _scrollController.jumpTo(
                        (_scrollController.offset -
                            details.delta.dx)
                            .clamp(
                          0.0,
                          _scrollController
                              .position.maxScrollExtent,
                        ),
                      );
                    },
                    child: SingleChildScrollView(
                      controller: _scrollController,
                      scrollDirection: Axis.horizontal,
                      child: buildDataTable(filteredData, allData),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget buildDataTable(List<dynamic> jsonData, List<dynamic> allData) {
    // Lấy danh sách cột động (loại xe)
    final Set<String> dynamicCols = {};
    for (var item in allData) {
      if (item is Map) {
        for (var k in item.keys) {
          if (k != 'ca_xe' && k != 'Điểm đi' && k != 'Điểm đến cũ' && k != 'Điểm đến mới') {
            dynamicCols.add(k);
          }
        }
      }
    }
    final cols = dynamicCols.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Nút thêm dòng
        Align(
          alignment: Alignment.centerLeft,
          child: ElevatedButton.icon(
            onPressed: selectedCuaKhau == null
                ? null
                : () {
              final newRow = {
                "ca_xe": "",
                "Điểm đi": selectedCuaKhau,
                "Điểm đến cũ": "",
                "Điểm đến mới": "",
                for (var c in cols) c: "",
              };
              allData.add(Map<String, dynamic>.from(newRow));
              controller.update();
              setState(() {});
            },
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text("Thêm dòng",
                style: TextStyle(color: Colors.white)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Bảng dữ liệu
        DataTable(
          columnSpacing: 12,
          columns: [
            const DataColumn(label: Text("Điểm đi")),
            const DataColumn(label: Text("Điểm đến cũ")),
            const DataColumn(label: Text("Điểm đến mới")),
            ...cols.map(
                  (c) => DataColumn(
                label: Tooltip(
                  message: c,
                  child: Text(
                    shortenLabel(c),
                    style: const TextStyle(fontSize: 12),
                  ),
                ),
              ),
            ),
            const DataColumn(label: Text("Xoá")),
          ],
          rows: List.generate(jsonData.length, (i) {
            final item = jsonData[i] as Map<String, dynamic>;
            return DataRow(cells: [
              // Điểm đi (readonly)
              DataCell(Text(item['Điiểm đi'] ?? '')),

              // Điểm đến cũ
              DataCell(SizedBox(
                width: 200,
                child: TextFormField(
                  initialValue: item['Điểm đến cũ'] ?? '',
                  onChanged: (val) {
                    item['Điểm đến cũ'] = val;
                  },
                  onFieldSubmitted: (val) {
                    item['Điểm đến cũ'] = val;
                    controller.update();
                    setState(() {});
                  },
                  onEditingComplete: () {
                    controller.update();
                    setState(() {});
                  },
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding:
                    EdgeInsets.symmetric(vertical: 6, horizontal: 6),
                  ),
                ),
              )),

              // Điểm đến mới
              DataCell(SizedBox(
                width: 200,
                child: TextFormField(
                  initialValue: item['Điểm đến mới'] ?? '',
                  onChanged: (val) {
                    item['Điểm đến mới'] = val;
                    controller.update();
                  },

                  onFieldSubmitted: (val) {
                    setState(() {
                      item['Điểm đến mới'] = val;
                    });
// print('diem den moi ${item['Điểm đến mới']}'); // TODO: remove debug
                    controller.update();
                  },
                  onEditingComplete: () {
                    controller.update();
                    setState(() {});
                  },
                  decoration: const InputDecoration(
                    isDense: true,
                    border: OutlineInputBorder(),
                    contentPadding:
                    EdgeInsets.symmetric(vertical: 6, horizontal: 6),
                  ),
                ),
              )),

              // Các cột loại xe
              ...cols.map(
                    (c) => DataCell(SizedBox(
                  width: 100,
                  child: TextFormField(
                    initialValue: (item[c] != null &&
                        item[c].toString().isNotEmpty)
                        ? NumberFormat.decimalPattern('vi_VN').format(
                        int.tryParse(
                            item[c].toString().replaceAll('.', '')) ??
                            0)
                        : '',
                    onChanged: (val) {
                      item[c] = val.replaceAll('.', '');
                    },
                    onFieldSubmitted: (val) {
                      item[c] = val.replaceAll('.', '');
                      controller.update();
                      setState(() {});
                    },
                    onEditingComplete: () {
                      controller.update();
                      setState(() {});
                    },
                    inputFormatters: [
                      AmountInputFormatter(
                        fractionalDigits: 0,
                        groupSeparator: NumberFormatter.kDot,
                        decimalSeparator: NumberFormatter.kComma,
                      )
                    ],
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      isDense: true,
                      border: OutlineInputBorder(),
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 6, horizontal: 6),
                    ),
                  ),
                )),
              ),

              // Nút xoá
              DataCell(IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                onPressed: () {
                  allData.remove( item);
                  controller.update();
                  setState(() {});
                },
              )),
            ]);
          }),
        ),
      ],
    );
  }

  String shortenLabel(String label) {
    final regex =
    RegExp(r'([0-9\.]+ ?-? ?[0-9\.]* ?tấn).*?\((\d+ CBM)\)');
    final match = regex.firstMatch(label);
    if (match != null) {
      return "${match.group(1)} (${match.group(2)})";
    }
    return label.length > 10 ? "${label.substring(0, 10)}…" : label;
  }
}


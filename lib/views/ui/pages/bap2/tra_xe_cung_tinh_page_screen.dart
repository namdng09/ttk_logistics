import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:kho555/controller/pages/cau_hinh_cung_tinh_khac_tuyen_controller.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/editable_cell.dart';

class TraXeCungTinhPageScreen extends StatefulWidget {
  const TraXeCungTinhPageScreen({super.key});

  @override
  State<TraXeCungTinhPageScreen> createState() =>
      _TraXeCungTinhPageScreenState();
}

class _TraXeCungTinhPageScreenState
    extends State<TraXeCungTinhPageScreen> with TickerProviderStateMixin {
  late CauHinhCungTinhKhacTuyenController controller;
  final ScrollController _hCtrl = ScrollController();
  final ScrollController _vCtrl = ScrollController();
  final NumberFormat currencyFormat = NumberFormat.decimalPattern('vi_VN');

  @override
  void initState() {
    super.initState();
    controller = Get.put(CauHinhCungTinhKhacTuyenController());

    // 🔹 Nhận tham số truyền vào (nếu có)
    final args = Get.arguments ?? {};
    controller.contextType = args["type"] ?? "default";
    controller.khachHangNid = args["nid"];
    controller.tenKhachHang = args["tenKhachHang"];

    // 🔹 Gọi API phù hợp
    controller.loadConfig(
      type: controller.contextType,
      nid: controller.khachHangNid,
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhCungTinhKhacTuyenController>(
      builder: (controller) {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        final rows = controller.data;
        final double containerHeight = MediaQuery.of(context).size.height * 0.7;

        return Layout(
          mainScreenName: "Cấu hình",
          subScreenName: controller.contextType == "khach_hang" || controller.contextType == "nha_xe"
              ? "Phí cùng tỉnh khác tuyến – ${controller.tenKhachHang ?? ''}"
              : "Phí cùng tỉnh khác tuyến (mặc định)",
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 🔹 Thanh công cụ
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      if (controller.contextType == "khach_hang" || controller.contextType == "nha_xe")
                        ElevatedButton.icon(
                          icon: const Icon(Icons.arrow_back_ios_new, size: 16),
                          label: const Text("Quay lại"),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey.shade400,
                          ),
                          onPressed: () => Get.back(),
                        ),
                      if (controller.contextType == "khach_hang" || controller.contextType == "nha_xe")
                        const SizedBox(width: 8),
                      Text(
                        controller.contextType == "khach_hang" || controller.contextType == "nha_xe"
                            ? "Cấu hình phí cùng tỉnh khác tuyến cho ${controller.tenKhachHang}"
                            : "Cấu hình phí cùng tỉnh khác tuyến (mặc định)",
                        style: const TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh),
                        label: const Text('Tải lại'),
                        onPressed: () => controller.loadConfig(
                          type: controller.contextType,
                          nid: controller.khachHangNid,
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm dòng'),
                        onPressed: controller.addRow,
                      ),
                      const SizedBox(width: 8),
                      Obx(() => ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green),
                        icon: controller.isSaving.value
                            ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                              strokeWidth: 2, color: Colors.white),
                        )
                            : const Icon(Icons.save),
                        label: Text(controller.isSaving.value
                            ? 'Đang lưu...'
                            : 'Lưu dữ liệu'),
                        onPressed: controller.isSaving.value
                            ? null
                            : controller.saveConfig,
                      )),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 🧭 Bảng dữ liệu
              MyContainer(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  height: containerHeight,
                  child: GestureDetector(
                    onPanUpdate: (details) {
                      if (_hCtrl.hasClients) {
                        _hCtrl.jumpTo(
                          (_hCtrl.offset - details.delta.dx * 0.7).clamp(
                            0.0,
                            _hCtrl.position.maxScrollExtent,
                          ),
                        );
                      }
                      if (_vCtrl.hasClients) {
                        _vCtrl.jumpTo(
                          (_vCtrl.offset - details.delta.dy * 0.7).clamp(
                            0.0,
                            _vCtrl.position.maxScrollExtent,
                          ),
                        );
                      }
                    },
                    child: SingleChildScrollView(
                      controller: _hCtrl,
                      scrollDirection: Axis.horizontal,
                      child: SingleChildScrollView(
                        controller: _vCtrl,
                        scrollDirection: Axis.vertical,
                        child: _buildTable(rows),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 🧾 Bảng dữ liệu chính
  Widget _buildTable(List<Map<String, dynamic>> rows) {
    final columns = [
      "Trọng tải",
      "Chi phí",
      "KM gần nhất",
      "KM xa nhất",
      "ĐVT",
      "Chức năng",
    ];

    final hasData = rows.isNotEmpty;
    final displayRows = hasData ? rows : [{}];

    return DataTable(
      headingRowColor: MaterialStateProperty.all(Colors.grey.shade200),
      headingRowHeight: 56,
      dataRowHeight: 44,
      columns: columns
          .map(
            (c) => DataColumn(
          label: Text(
            c,
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      )
          .toList(),
      rows: List.generate(displayRows.length, (index) {
        if (!hasData) {
          return const DataRow(
            cells: [
              DataCell(Text(
                "Không có dữ liệu",
                style: TextStyle(color: Colors.grey),
              )),
              DataCell(Text("")),
              DataCell(Text("")),
              DataCell(Text("")),
              DataCell(Text("")),
              DataCell(Text("")),
            ],
          );
        }

        final row = displayRows[index];
        final format = NumberFormat.decimalPattern('vi_VN');

        return DataRow(
          cells: [
            DataCell(EditableCell(
              initialValue: row["Trọng tải"] ?? '',
              onChanged: (v) => controller.updateCell(index, "Trọng tải", "", v),
            )),
            DataCell(EditableCell(
              initialValue: format.format(
                  int.tryParse(row["Chi phí"]?.toString() ?? "0") ?? 0),
              isNumeric: true,
              onChanged: (v) {
                final val = v.replaceAll('.', '').replaceAll(',', '');
                controller.updateCell(index, "Chi phí", "", val);
              },
            )),
            DataCell(EditableCell(
              initialValue: row["KM gần nhất"]?.toString() ?? '',
              onChanged: (v) =>
                  controller.updateCell(index, "KM gần nhất", "", v),
            )),
            DataCell(EditableCell(
              initialValue: row["KM xa nhất"]?.toString() ?? '',
              onChanged: (v) =>
                  controller.updateCell(index, "KM xa nhất", "", v),
            )),
            DataCell(EditableCell(
              initialValue: row["ĐVT"] ?? '',
              onChanged: (v) => controller.updateCell(index, "ĐVT", "", v),
            )),
            DataCell(Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.copy, color: Colors.blue),
                  tooltip: 'Nhân bản dòng',
                  onPressed: () => controller.duplicateRow(index),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  tooltip: 'Xóa dòng',
                  onPressed: () => controller.removeRow(index),
                ),
              ],
            )),
          ],
        );
      }),
    );
  }
}

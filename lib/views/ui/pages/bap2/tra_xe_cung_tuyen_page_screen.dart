import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/controller/pages/cau_hinh_cung_tuyen_khac_tinh_controller.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:ttk_logistics/helper/widgets/editable_cell.dart';

class TraXeCungTuyenPageScreen extends StatefulWidget {
  const TraXeCungTuyenPageScreen({super.key});

  @override
  State<TraXeCungTuyenPageScreen> createState() =>
      _TraXeCungTuyenPageScreenState();
}

class _TraXeCungTuyenPageScreenState extends State<TraXeCungTuyenPageScreen>
    with TickerProviderStateMixin {
  late CauHinhCungTuyenKhacTinhController controller;
  final ScrollController _hCtrl = ScrollController();
  final ScrollController _vCtrl = ScrollController();
  final NumberFormat currencyFormat = NumberFormat.decimalPattern('vi_VN');

  @override
  void initState() {
    super.initState();
    controller = Get.put(CauHinhCungTuyenKhacTinhController());

    // 🔹 Nhận tham số truyền vào
    final args = Get.arguments ?? {};
    controller.contextType = args["type"] ?? "default";
    controller.khachHangNid = args["nid"];
    controller.tenKhachHang = args["tenKhachHang"];

    controller.loadConfig(
      type: controller.contextType,
      nid: controller.khachHangNid,
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhCungTuyenKhacTinhController>(
      builder: (controller) {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        final rows = controller.data;
        final double containerHeight = MediaQuery.of(context).size.height * 0.7;

        return Layout(
          mainScreenName: "Cước vận chuyển",
          subScreenName: controller.contextType == "khach_hang" || controller.contextType == "nha_xe"
              ? "Cước cùng tuyến khác tỉnh – ${controller.tenKhachHang ?? ''}"
              : "Cước cùng tuyến khác tỉnh (mặc định)",
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 🔹 Thanh công cụ
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      if (controller.contextType == "khach_hang" || controller.contextType == "nha_xe") ...[
                        ElevatedButton.icon(
                          icon: const Icon(Icons.arrow_back_ios_new, size: 16),
                          label: const Text("Quay lại"),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey.shade400),
                          onPressed: () => Get.back(),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        controller.contextType == "khach_hang" || controller.contextType == "nha_xe"
                            ? "Cấu hình cước cùng tuyến khác tỉnh cho ${controller.tenKhachHang}"
                            : "Cấu hình cước cùng tuyến khác tỉnh (mặc định)",
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
                              0.0, _hCtrl.position.maxScrollExtent),
                        );
                      }
                      if (_vCtrl.hasClients) {
                        _vCtrl.jumpTo(
                          (_vCtrl.offset - details.delta.dy * 0.7).clamp(
                              0.0, _vCtrl.position.maxScrollExtent),
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

  // 🧾 Bảng dữ liệu
  Widget _buildTable(List<Map<String, dynamic>> rows) {
    final hasData = rows.isNotEmpty;
    final displayRows = hasData ? rows : [{}];

    return DataTable(
      headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
      headingRowHeight: 56,
      dataRowHeight: 44,
      columns: const [
        DataColumn(
            label: Text("Trọng tải",
                style: TextStyle(fontWeight: FontWeight.bold))),
        DataColumn(
            label: Text("Chi phí",
                style: TextStyle(fontWeight: FontWeight.bold))),
        DataColumn(
            label: Text("Chức năng",
                style: TextStyle(fontWeight: FontWeight.bold))),
      ],
      rows: List.generate(displayRows.length, (index) {
        if (!hasData) {
          return const DataRow(cells: [
            DataCell(Text("Không có dữ liệu",
                style: TextStyle(color: Colors.grey))),
            DataCell(Text("")),
            DataCell(Text("")),
          ]);
        }

        final row = displayRows[index];
        final trongTai = (row["Trọng tải"] ?? "").toString();
        final chiPhiRaw = (row["Chi phí"] ?? "0").toString();
        final chiPhiNum = int.tryParse(
          chiPhiRaw.replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
            0;

        return DataRow(cells: [
          DataCell(EditableCell(
            initialValue: trongTai,
            onChanged: (v) => controller.updateCell(index, "Trọng tải", "", v),
          )),
          DataCell(EditableCell(
            initialValue: currencyFormat.format(chiPhiNum),
            isNumeric: true,
            onChanged: (v) {
              final val = v.replaceAll('.', '').replaceAll(',', '');
              controller.updateCell(index, "Chi phí", "", val);
            },
          )),
          DataCell(Row(children: [
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
          ])),
        ]);
      }),
    );
  }
}

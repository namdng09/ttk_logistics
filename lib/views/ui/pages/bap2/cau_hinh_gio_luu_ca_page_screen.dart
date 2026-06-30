import 'package:kho555/controller/pages/cau_hinh_gio_luu_ca_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:kho555/helper/widgets/editable_cell.dart';

class CauHinhGioLuuCaPageScreen extends StatefulWidget {
  const CauHinhGioLuuCaPageScreen({super.key});

  @override
  State<CauHinhGioLuuCaPageScreen> createState() =>
      _CauHinhGioLuuCaPageScreenState();
}

class _CauHinhGioLuuCaPageScreenState extends State<CauHinhGioLuuCaPageScreen> {
  final controller = Get.put(CauHinhGioLuuCaController());
  final ScrollController _hCtrl = ScrollController();
  final ScrollController _vCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    controller.loadConfig();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhGioLuuCaController>(
      builder: (controller) {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        final rows = controller.data;
        final double containerHeight = MediaQuery.of(context).size.height * 0.7;

        return Layout(
          mainScreenName: "Cấu hình",
          subScreenName: "Giờ lưu ca",
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 🔹 Thanh công cụ
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Danh sách cấu hình giờ lưu ca",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh),
                        label: const Text('Tải lại'),
                        onPressed: controller.loadConfig,
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

  // 🧾 Bảng dữ liệu
  Widget _buildTable(List<Map<String, dynamic>> rows) {
    final hasData = rows.isNotEmpty;
    final displayRows = hasData ? rows : [{}];

    return DataTable(
      headingRowColor: MaterialStateProperty.all(Colors.grey.shade200),
      headingRowHeight: 56,
      dataRowHeight: 44,
      columns: const [
        DataColumn(label: Text("Trọng tải", style: TextStyle(fontWeight: FontWeight.bold))),
        DataColumn(label: Text("Giờ", style: TextStyle(fontWeight: FontWeight.bold))),
        DataColumn(label: Text("Phút", style: TextStyle(fontWeight: FontWeight.bold))),
        DataColumn(label: Text("Chức năng", style: TextStyle(fontWeight: FontWeight.bold))),
      ],
      rows: List.generate(displayRows.length, (index) {
        if (!hasData) {
          return const DataRow(cells: [
            DataCell(Text("Không có dữ liệu", style: TextStyle(color: Colors.grey))),
            DataCell(Text("")),
            DataCell(Text("")),
            DataCell(Text("")),
          ]);
        }

        final row = displayRows[index];
        final trongTai = (row["Loại xe"] ?? "").toString();
        final gio = (row["Thời gian Giờ"] ?? "").toString();
        final phut = (row["Thời gian Phút"] ?? "").toString();

        return DataRow(
          cells: [
            DataCell(EditableCell(
              initialValue: trongTai,
              onChanged: (v) => controller.updateCell(index, "Loại xe", "", v),
            )),
            DataCell(EditableCell(
              initialValue: gio,
              isNumeric: true,
              onChanged: (v) =>
                  controller.updateCell(index, "Thời gian Giờ", "", v),
            )),
            DataCell(EditableCell(
              initialValue: phut,
              isNumeric: true,
              onChanged: (v) =>
                  controller.updateCell(index, "Thời gian Phút", "", v),
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

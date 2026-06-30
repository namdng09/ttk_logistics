import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:kho555/helper/widgets/editable_cell.dart';
import 'package:kho555/controller/pages/cau_hinh_phi_luu_ca_controller.dart';

class CauHinhPhiLuuCaScreen extends StatefulWidget {
  const CauHinhPhiLuuCaScreen({super.key});

  @override
  State<CauHinhPhiLuuCaScreen> createState() => _CauHinhPhiLuuCaScreenState();
}

class _CauHinhPhiLuuCaScreenState extends State<CauHinhPhiLuuCaScreen> {
  late CauHinhPhiLuuCaController controller;
  final ScrollController _hCtrl = ScrollController();
  final ScrollController _vCtrl = ScrollController();
  final NumberFormat currencyFormat = NumberFormat.decimalPattern('vi_VN');

  @override
  void initState() {
    super.initState();
    controller = Get.put(CauHinhPhiLuuCaController());

    // ✅ Nhận tham số từ Get.arguments
    final args = Get.arguments ?? {};
    final type = args["type"] ?? "default";
    final nid = args["nid"];
    final tenKhachHang = args["tenKhachHang"];

    controller.contextType = type;
    controller.khachHangNid = nid;
    controller.tenKhachHang = tenKhachHang;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.loadConfig(type: type, nid: nid);
    });
  }

  void _showAddColumnDialog() {
    final labelCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Thêm cột trọng tải mới'),
        content: TextField(
          controller: labelCtrl,
          decoration: const InputDecoration(labelText: 'Tên trọng tải xe'),
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () {
              final label = labelCtrl.text.trim();
              if (label.isNotEmpty) {
                for (var row in controller.data) {
                  row[label] = '';
                }
                controller.update();
              }
              Get.back();
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  void _showRenameDialog(String oldName) {
    final ctrl = TextEditingController(text: oldName);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Đổi tên cột'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(labelText: 'Tên mới'),
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () {
              final newName = ctrl.text.trim();
              if (newName.isNotEmpty) {
                for (var row in controller.data) {
                  if (row.containsKey(oldName)) {
                    row[newName] = row.remove(oldName);
                  }
                }
                controller.update();
              }
              Get.back();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteColumn(String name) {
    Get.dialog(AlertDialog(
      title: const Text('Xác nhận xoá cột'),
      content: Text('Bạn có chắc muốn xoá cột "$name" không?'),
      actions: [
        TextButton(onPressed: Get.back, child: const Text('Hủy')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () {
            for (var row in controller.data) {
              row.remove(name);
            }
            controller.update();
            Get.back();
          },
          child: const Text('Xóa'),
        ),
      ],
    ));
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhPhiLuuCaController>(
      builder: (controller) {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        final rows = controller.data;
        if (rows.isEmpty) {
          return const Center(child: Text("Không có dữ liệu."));
        }

        // 🔹 Xác định chế độ khách hàng hay cấu hình mặc định
        final isCustomerMode = controller.contextType == "khach_hang";
        final isNhaXeMode = controller.contextType == "nha_xe";
        final title = isCustomerMode || isNhaXeMode
            ? "Phí lưu ca – ${controller.tenKhachHang ?? 'Khách hàng'}"
            : "Cấu hình phí lưu ca (Mặc định hệ thống)";

        // Lấy tất cả tên cột từ phần tử đầu tiên (trừ cột Ngày)
        final columns = rows.first.keys.where((e) => e != "Ngày").toList();
        final double containerHeight = MediaQuery.of(context).size.height * 0.7;

        return Layout(
          mainScreenName: 'Cấu hình',
          subScreenName: title,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 🔹 Thanh công cụ
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      if (isCustomerMode || isNhaXeMode)
                        ElevatedButton.icon(
                          icon: const Icon(Icons.arrow_back_ios_new, size: 16),
                          label: const Text("Quay lại"),
                          style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey.shade400),
                          onPressed: () => Get.back(),
                        ),
                      if (isCustomerMode || isNhaXeMode) const SizedBox(width: 8),
                      Text(
                        title,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh),
                        label: const Text('Tải lại'),
                        onPressed: () =>
                            controller.loadConfig(type: controller.contextType, nid: controller.khachHangNid),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add_box),
                        label: const Text('Thêm cột'),
                        onPressed: _showAddColumnDialog,
                      ),
                      const SizedBox(width: 8),
                      Obx(() => ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green),
                        onPressed: controller.isSaving.value
                            ? null
                            : () => controller.saveConfig(),
                        icon: controller.isSaving.value
                            ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white))
                            : const Icon(Icons.save),
                        label: Text(controller.isSaving.value
                            ? 'Đang lưu...'
                            : 'Lưu dữ liệu'),
                      )),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 🔹 Bảng dữ liệu
              MyContainer(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  height: containerHeight,
                  child: GestureDetector(
                    onPanUpdate: (details) {
                      if (_hCtrl.hasClients) {
                        _hCtrl.jumpTo(
                          (_hCtrl.offset - details.delta.dx * 0.7)
                              .clamp(0.0, _hCtrl.position.maxScrollExtent),
                        );
                      }
                      if (_vCtrl.hasClients) {
                        _vCtrl.jumpTo(
                          (_vCtrl.offset - details.delta.dy * 0.7)
                              .clamp(0.0, _vCtrl.position.maxScrollExtent),
                        );
                      }
                    },
                    child: SingleChildScrollView(
                      controller: _hCtrl,
                      scrollDirection: Axis.horizontal,
                      child: SingleChildScrollView(
                        controller: _vCtrl,
                        scrollDirection: Axis.vertical,
                        child: _buildTable(rows, columns),
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

  Widget _buildTable(List<Map<String, dynamic>> rows, List<String> columns) {
    return DataTable(
      headingRowColor: MaterialStateProperty.all(Colors.grey.shade200),
      headingRowHeight: 72,
      dataRowHeight: 44,
      columns: [
        const DataColumn(
            label:
            Text("Ngày", style: TextStyle(fontWeight: FontWeight.bold))),
        ...columns.map((c) => DataColumn(
          label: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c, style: const TextStyle(fontWeight: FontWeight.bold)),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                      icon: const Icon(Icons.edit,
                          size: 14, color: Colors.grey),
                      tooltip: 'Đổi tên cột',
                      onPressed: () => _showRenameDialog(c)),
                  IconButton(
                      icon: const Icon(Icons.copy,
                          size: 14, color: Colors.blueGrey),
                      tooltip: 'Nhân bản cột',
                      onPressed: () {
                        final newName = "$c (copy)";
                        for (var row in controller.data) {
                          row[newName] = row[c];
                        }
                        controller.update();
                      }),
                  IconButton(
                      icon: const Icon(Icons.delete_outline,
                          size: 14, color: Colors.redAccent),
                      tooltip: 'Xóa cột',
                      onPressed: () => _confirmDeleteColumn(c)),
                ],
              )
            ],
          ),
        )),
        const DataColumn(label: Text('Chức năng')),
      ],
      rows: List.generate(rows.length, (i) {
        final r = rows[i];
        return DataRow(
          cells: [
            // Cột Ngày
            DataCell(EditableCell(
              initialValue: r["Ngày"].toString(),
              isNumeric: true,
              onChanged: (v) {
                r["Ngày"] = v;
                controller.update();
              },
            )),
            // Cột trọng tải
            ...columns.map((c) {
              final raw = r[c];
              final numVal = int.tryParse(raw?.toString() ?? '');
              final displayValue = numVal != null
                  ? currencyFormat.format(numVal)
                  : (raw?.toString() ?? '');
              return DataCell(EditableCell(
                initialValue: displayValue,
                isNumeric: true,
                onChanged: (v) {
                  r[c] = v.replaceAll('.', '').replaceAll(',', '');
                  controller.update();
                },
              ));
            }),
            // Cột chức năng
            DataCell(Row(children: [
              IconButton(
                  icon: const Icon(Icons.add, color: Colors.green),
                  tooltip: 'Nhân bản dòng',
                  onPressed: () {
                    final newRow = Map<String, dynamic>.from(r);
                    controller.data.insert(i + 1, newRow);
                    controller.update();
                  }),
              IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  tooltip: 'Xóa dòng',
                  onPressed: () {
                    controller.data.removeAt(i);
                    controller.update();
                  }),
            ])),
          ],
        );
      }),
    );
  }
}

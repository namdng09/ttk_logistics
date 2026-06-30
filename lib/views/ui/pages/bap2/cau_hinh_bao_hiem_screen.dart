import 'package:ttk_logistics/controller/pages/cau_hinh_bao_hiem_controller.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/editable_cell.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class CauHinhBaoHiemScreen extends StatefulWidget {
  const CauHinhBaoHiemScreen({super.key});

  @override
  State<CauHinhBaoHiemScreen> createState() => _CauHinhBaoHiemScreenState();
}

class _CauHinhBaoHiemScreenState extends State<CauHinhBaoHiemScreen>
    with TickerProviderStateMixin {
  late CauHinhBaoHiemController controller;
  final ScrollController _horizontalController = ScrollController();
  final ScrollController _verticalController = ScrollController();

  @override
  void initState() {
    super.initState();
    controller = Get.put(CauHinhBaoHiemController());

    // ✅ Nhận tham số từ Get.arguments
    final args = Get.arguments ?? {};
    final type = args["type"] ?? "default";
    final nid = args["nid"];
    final tenKhachHang = args["tenKhachHang"];

    controller.contextType = type;
    controller.khachHangNid = nid;
    controller.tenKhachHang = tenKhachHang;

    controller.loadConfig(type: type, nid: nid);
  }

  // -----------------------------
  // 🔧 Các dialog thao tác cột
  // -----------------------------
  void _showAddColumnDialog(String group) {
    final labelCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Thêm cột mới cho $group'),
        content: TextField(
          controller: labelCtrl,
          decoration: const InputDecoration(labelText: 'Tên cột'),
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () {
              final label = labelCtrl.text.trim();
              if (label.isEmpty) return;
              controller.addColumn(group, label);
              Get.back();
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  void _showRenameDialog(String group, String oldName) {
    final textCtrl = TextEditingController(text: oldName);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Đổi tên cột'),
        content: TextField(
          controller: textCtrl,
          decoration: const InputDecoration(labelText: 'Tên hiển thị mới'),
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () {
              final newName = textCtrl.text.trim();
              if (newName.isEmpty || newName == oldName) return;
              controller.renameColumn(group, oldName, newName);
              Get.back();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteColumn(String group, String key) {
    Get.dialog(AlertDialog(
      title: const Text('Xác nhận xoá cột'),
      content: Text('Bạn có chắc muốn xoá cột "$key" không?'),
      actions: [
        TextButton(onPressed: Get.back, child: const Text('Hủy')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () {
            controller.removeColumn(group, key);
            Get.back();
          },
          child: const Text('Xóa'),
        ),
      ],
    ));
  }

  // -----------------------------
  // 🧱 Giao diện chính
  // -----------------------------
  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhBaoHiemController>(
      builder: (controller) {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        final rows = controller.data;
        final isCustomerMode = controller.contextType == "khach_hang";
        final isNhaXeMode = controller.contextType == "nha_xe";
        final title = isCustomerMode || isNhaXeMode
            ? "Phí bảo hiểm – ${controller.tenKhachHang ?? 'Khách hàng'}"
            : "Cấu hình phí bảo hiểm (Mặc định hệ thống)";
        final double containerHeight = MediaQuery.of(context).size.height * 0.65;

        if (rows.isEmpty) {
          return Layout(
            mainScreenName: 'Cấu hình',
            subScreenName: title,
            child: const Center(child: Text("Không có dữ liệu.")),
          );
        }

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
                      Text(title,
                          style: const TextStyle(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  Row(
                    children: [
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh),
                        label: const Text('Tải lại'),
                        onPressed: () => controller.loadConfig(
                            type: controller.contextType,
                            nid: controller.khachHangNid),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm Chi phí'),
                        onPressed: () => _showAddColumnDialog("Chi phí"),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add_box),
                        label: const Text('Thêm Trọng tải'),
                        onPressed: () => _showAddColumnDialog("Trọng tải"),
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
                            color: Colors.white,
                          ),
                        )
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

              // 🧭 Bảng cấu hình
              MyContainer(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  height: containerHeight,
                  child: GestureDetector(
                    onPanUpdate: (details) {
                      if (_horizontalController.hasClients) {
                        _horizontalController.jumpTo(
                          (_horizontalController.offset - details.delta.dx * 0.7)
                              .clamp(0.0,
                              _horizontalController.position.maxScrollExtent),
                        );
                      }
                      if (_verticalController.hasClients) {
                        _verticalController.jumpTo(
                          (_verticalController.offset - details.delta.dy * 0.7)
                              .clamp(0.0,
                              _verticalController.position.maxScrollExtent),
                        );
                      }
                    },
                    child: SingleChildScrollView(
                      controller: _horizontalController,
                      scrollDirection: Axis.horizontal,
                      child: SingleChildScrollView(
                        controller: _verticalController,
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

  // -----------------------------
  // 🧾 Xây dựng bảng dữ liệu
  // -----------------------------
  Widget _buildTable(List<Map<String, dynamic>> rows) {
    final chiPhiCols = controller.getChiPhiColumns();
    final trongTaiCols = controller.getTrongTaiColumns();

    return DataTable(
      headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
      headingRowHeight: 72,
      dataRowHeight: 44,
      columns: [
        const DataColumn(
          label: Text("Loại xe", style: TextStyle(fontWeight: FontWeight.bold)),
        ),
        // 🔹 Nhóm Chi phí
        ...chiPhiCols.map((c) => DataColumn(
          label: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit, size: 14, color: Colors.grey),
                    tooltip: 'Đổi tên cột',
                    onPressed: () => _showRenameDialog("Chi phí", c),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy,
                        size: 14, color: Colors.blueGrey),
                    tooltip: 'Nhân bản cột',
                    onPressed: () =>
                        controller.addColumn("Chi phí", "$c (copy)"),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline,
                        size: 14, color: Colors.redAccent),
                    tooltip: 'Xóa cột',
                    onPressed: () => _confirmDeleteColumn("Chi phí", c),
                  ),
                ],
              ),
            ],
          ),
        )),
        // 🔹 Nhóm Trọng tải
        ...trongTaiCols.map((c) => DataColumn(
          label: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(c, style: const TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 2),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: const Icon(Icons.edit, size: 14, color: Colors.grey),
                    tooltip: 'Đổi tên cột',
                    onPressed: () => _showRenameDialog("Trọng tải", c),
                  ),
                  IconButton(
                    icon: const Icon(Icons.copy,
                        size: 14, color: Colors.blueGrey),
                    tooltip: 'Nhân bản cột',
                    onPressed: () =>
                        controller.addColumn("Trọng tải", "$c (copy)"),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline,
                        size: 14, color: Colors.redAccent),
                    tooltip: 'Xóa cột',
                    onPressed: () => _confirmDeleteColumn("Trọng tải", c),
                  ),
                ],
              ),
            ],
          ),
        )),
        const DataColumn(label: Text('Chức năng')),
      ],

      // 🔹 Các dòng dữ liệu
      rows: List.generate(rows.length, (index) {
        final row = rows[index];
        final chiPhi = row["Chi phí"] as Map<String, dynamic>;
        final trongTai = row["Trọng tải"] as Map<String, dynamic>;

        return DataRow(
          cells: [
            DataCell(EditableCell(
              initialValue: row["loaiXe"] ?? '',
              onChanged: (v) => row["loaiXe"] = v,
            )),
            ...chiPhiCols.map((c) {
              final val = chiPhi[c]?.toString() ?? '';
              return DataCell(EditableCell(
                initialValue: val.isEmpty
                    ? ''
                    : NumberFormat.decimalPattern('vi_VN')
                    .format(int.tryParse(val) ?? 0),
                isNumeric: true,
                onChanged: (v) => chiPhi[c] =
                    v.replaceAll('.', '').replaceAll(',', ''),
              ));
            }),
            ...trongTaiCols.map((c) {
              final val = trongTai[c]?.toString() ?? '';
              return DataCell(
                Checkbox(
                  value: val.toLowerCase() == 'x',
                  onChanged: (checked) {
                    trongTai[c] = checked == true ? 'x' : '';
                    controller.update();
                  },
                ),
              );
            }),
            DataCell(Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.add, color: Colors.green),
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

import 'package:ttk_logistics/controller/pages/cuoc_van_chuyen_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:ttk_logistics/helper/widgets/editable_cell.dart';
import 'package:intl/intl.dart';

class CuocVanChuyenScreen extends StatefulWidget {
  const CuocVanChuyenScreen({super.key});

  @override
  State<CuocVanChuyenScreen> createState() => _CuocVanChuyenScreenState();
}

class _CuocVanChuyenScreenState extends State<CuocVanChuyenScreen>
    with TickerProviderStateMixin {
  late CuocVanChuyenController controller;
  TabController? _tabController;
  final ScrollController _horizontalController = ScrollController();
  final ScrollController _verticalController = ScrollController();

  @override
  void initState() {
    super.initState();
    controller = Get.put(CuocVanChuyenController());

    // 📦 Nhận tham số từ Get.arguments
    final args = Get.arguments ?? {};
    final type = args["type"] ?? "default";
    final int? khachHangNid = args["nid"];
    final String? tenKhachHang = args["tenKhachHang"];

    controller.contextType = type;
    controller.khachHangNid = khachHangNid;
    controller.tenKhachHang = tenKhachHang;

    // 🚀 Tải dữ liệu ban đầu
    controller.loadData(type: type, khachHangNid: khachHangNid).then((_) => _initTabs());
  }

  void _initTabs() {
    final grouped = _groupByDiemDi(controller.rows);
    _tabController = TabController(length: grouped.keys.length, vsync: this);
    setState(() {});
  }

  Map<String, List<Map<String, dynamic>>> _groupByDiemDi(List<Map<String, dynamic>> rows) {
    final Map<String, List<Map<String, dynamic>>> grouped = {};
    for (var row in rows) {
      final label = row['Điểm đi']?.toString().trim() ?? 'Khác';
      grouped.putIfAbsent(label, () => []).add(row);
    }
    return grouped;
  }

  // -------------------
  // 🔧 Xử lý cột
  // -------------------
  void _showRenameDialog(String oldName) {
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
              controller.renameColumn(oldName, textCtrl.text.trim());
              Get.back();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  void _showAddColumnDialog() {
    final labelCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Thêm cột mới'),
        content: TextField(
          controller: labelCtrl,
          decoration: const InputDecoration(labelText: 'Tên hiển thị'),
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () {
              final label = labelCtrl.text.trim();
              if (label.isEmpty) return;
              controller.addColumn(label);
              Get.back();
            },
            child: const Text('Thêm'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteColumn(String key) {
    Get.dialog(AlertDialog(
      title: const Text('Xác nhận xoá cột'),
      content: Text('Bạn có chắc muốn xoá cột "$key" không?'),
      actions: [
        TextButton(onPressed: Get.back, child: const Text('Hủy')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
          onPressed: () {
            controller.removeColumn(key);
            Get.back();
          },
          child: const Text('Xóa'),
        ),
      ],
    ));
  }

  // -------------------
  // 🧱 Giao diện chính
  // -------------------
  @override
  Widget build(BuildContext context) {
    return GetBuilder<CuocVanChuyenController>(
      builder: (controller) {
        if (controller.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final grouped = _groupByDiemDi(controller.rows);
        final visibleColumns = controller.columns
            .where((c) => c != 'Điểm đến cũ' && c != 'Điểm đi cũ')
            .toList();

        _tabController ??= TabController(length: grouped.keys.length, vsync: this);
        final double containerHeight = MediaQuery.of(context).size.height * 0.65;

        final title = controller.contextType == "khach_hang"
            ? "Cước vận chuyển - ${controller.tenKhachHang ?? ''}"
            : "Cước vận chuyển (cấu hình mặc định)";

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
                  Text(title,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Row(
                    children: [
                      // 🔙 Nút quay lại chỉ hiển thị khi cấu hình khách hàng
                      if (controller.contextType == "khach_hang") ...[
                        ElevatedButton.icon(
                          icon: const Icon(Icons.arrow_back),
                          label: const Text('Quay lại'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey.shade700,
                          ),
                          onPressed: () => Get.back(),
                        ),
                        const SizedBox(width: 8),
                      ],
                      ElevatedButton.icon(
                        icon: const Icon(Icons.refresh),
                        label: const Text('Tải lại'),
                        onPressed: () => controller.loadData(
                          type: controller.contextType,
                          khachHangNid: controller.khachHangNid,
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm cột'),
                        onPressed: _showAddColumnDialog,
                      ),
                      const SizedBox(width: 8),
                      Obx(() => ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                        onPressed: controller.isSaving.value
                            ? null
                            : () => controller.saveData(),
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
                        label: Text(
                          controller.isSaving.value
                              ? 'Đang lưu...'
                              : 'Lưu dữ liệu',
                        ),
                      )),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 🧭 Tabs
              MyContainer(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TabBar(
                      controller: _tabController,
                      isScrollable: true,
                      labelColor: Colors.blueAccent,
                      unselectedLabelColor: Colors.black87,
                      tabs: grouped.keys.map((key) => Tab(text: key)).toList(),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: containerHeight,
                      child: TabBarView(
                        controller: _tabController,
                        children: grouped.keys.map((diemDi) {
                          final rows = grouped[diemDi]!;
                          return GestureDetector(
                            onPanUpdate: (details) {
                              // Kéo ngang
                              if (_horizontalController.hasClients) {
                                _horizontalController.jumpTo(
                                  (_horizontalController.offset - details.delta.dx * 0.7)
                                      .clamp(0.0, _horizontalController.position.maxScrollExtent),
                                );
                              }
                              // Kéo dọc
                              if (_verticalController.hasClients) {
                                _verticalController.jumpTo(
                                  (_verticalController.offset - details.delta.dy * 0.7)
                                      .clamp(0.0, _verticalController.position.maxScrollExtent),
                                );
                              }
                            },
                            child: SingleChildScrollView(
                              controller: _horizontalController,
                              scrollDirection: Axis.horizontal,
                              child: SingleChildScrollView(
                                controller: _verticalController,
                                scrollDirection: Axis.vertical,
                                child: _buildTable(visibleColumns, rows),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // 🧾 Bảng dữ liệu
  Widget _buildTable(List<String> columns, List<Map<String, dynamic>> rows) {
    final fixedColumns = ['Điểm đi', 'Điểm đến mới'];
    final visibleColumns = [
      ...fixedColumns,
      ...columns.where(
              (c) => !fixedColumns.contains(c) && c != 'Điểm đến cũ' && c != 'Điểm đi cũ'),
    ];

    return DataTable(
      headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
      headingRowHeight: 72,
      dataRowHeight: 44,
      columns: [
        ...visibleColumns.map((c) {
          final label = c;
          final isFixed = (c == 'Điểm đi' || c == 'Điểm đến mới');
          final editable = controller.canRename(c) && !isFixed;
          final deletable = controller.canDelete(c) && !isFixed;
          final duplicable = controller.canDuplicate(c) && !isFixed;

          return DataColumn(
            label: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (editable)
                      IconButton(
                        icon: const Icon(Icons.edit, size: 14, color: Colors.grey),
                        tooltip: 'Đổi tên cột',
                        onPressed: () => _showRenameDialog(c),
                      ),
                    if (duplicable)
                      IconButton(
                        icon: const Icon(Icons.copy, size: 14, color: Colors.blueGrey),
                        tooltip: 'Nhân bản cột',
                        onPressed: () => controller.duplicateColumn(c),
                      ),
                    if (deletable)
                      IconButton(
                        icon: const Icon(Icons.delete_outline,
                            size: 14, color: Colors.redAccent),
                        tooltip: 'Xóa cột',
                        onPressed: () => _confirmDeleteColumn(c),
                      ),
                  ],
                ),
              ],
            ),
          );
        }),
        const DataColumn(label: Text('Chức năng')),
      ],
      rows: List.generate(rows.length, (index) {
        final row = rows[index];
        return DataRow(
          cells: [
            ...visibleColumns.map((c) {
              final cellValue = row[c]?.toString() ?? '';

              if (c == 'Điểm đi') {
                return DataCell(Text(row['Điểm đi'] ?? ''));
              }

              if (c == 'Điểm đến mới') {
                return DataCell(Padding(
                  padding: const EdgeInsets.only(bottom: 2),
                  child: EditableCell(
                    initialValue: row['Điểm đến mới'] ?? '',
                    onChanged: (v) => controller.updateCell(index, 'Điểm đến mới', v),
                  ),
                ));
              }

              // ✅ Nếu là cột số, hiển thị có phân cách hàng nghìn
              final bool isNumericColumn = RegExp(
                r'(cước|giá|fee|km|số|tấn|cbm|weight|amount)',
                caseSensitive: false,
              ).hasMatch(c);

              String displayValue = cellValue;
              if (isNumericColumn && cellValue.isNotEmpty) {
                try {
                  final num? number = num.tryParse(
                      cellValue.replaceAll('.', '').replaceAll(',', ''));
                  if (number != null) {
                    displayValue =
                        NumberFormat.decimalPattern('vi_VN').format(number);
                  }
                } catch (_) {}
              }

              return DataCell(EditableCell(
                initialValue: displayValue,
                isNumeric:
                isNumericColumn || RegExp(r'^\d+$').hasMatch(cellValue),
                onChanged: (v) => controller.updateCell(
                    index, c, v.replaceAll('.', '').replaceAll(',', '')),
              ));
            }),
            DataCell(Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.add, color: Colors.green),
                  tooltip: 'Nhân bản dòng này',
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

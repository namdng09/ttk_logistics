import 'package:ttk_logistics/controller/pages/chi_phi_hai_quan_tong_hop_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:ttk_logistics/helper/widgets/editable_cell.dart';
import 'package:intl/intl.dart';

class ChiPhiHaiQuanTongHopScreen extends StatefulWidget {
  const ChiPhiHaiQuanTongHopScreen({super.key});

  @override
  State<ChiPhiHaiQuanTongHopScreen> createState() =>
      _ChiPhiHaiQuanTongHopScreenState();
}

class _ChiPhiHaiQuanTongHopScreenState
    extends State<ChiPhiHaiQuanTongHopScreen> with TickerProviderStateMixin {
  late ChiPhiHaiQuanTongHopController controller;
  TabController? _tabController;
  final ScrollController _horizontalController = ScrollController();
  final ScrollController _verticalController = ScrollController();

  @override
  void initState() {
    super.initState();
    controller = Get.put(ChiPhiHaiQuanTongHopController());

    // ✅ Nhận tham số từ Get.arguments
    final args = Get.arguments ?? {};
    final type = args["type"] ?? "default";
    final nid = args["nid"];
    final tenKhachHang = args["tenKhachHang"];

    controller.contextType = type;
    controller.khachHangNid = nid;
    controller.tenKhachHang = tenKhachHang;

    // ✅ Gọi loadData với ngữ cảnh phù hợp
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller
          .loadData(type: type, nid: nid)
          .then((_) => _initTabs());
    });
  }

  void _initTabs() {
    final grouped = _groupByCuaKhau(controller.rows);
    _tabController = TabController(length: grouped.keys.length, vsync: this);
    setState(() {});
  }

  Map<String, List<Map<String, dynamic>>> _groupByCuaKhau(
      List<Map<String, dynamic>> rows) {
    final Map<String, List<Map<String, dynamic>>> grouped = {};
    for (var row in rows) {
      final label = row['Cửa khẩu']?.toString().trim() ?? 'Khác';
      grouped.putIfAbsent(label, () => []).add(row);
    }
    return grouped.isEmpty ? {'Chưa có dữ liệu': []} : grouped;
  }

  // ---------------------------------------------------------
  // 🧩 Giao diện chính
  // ---------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return GetBuilder<ChiPhiHaiQuanTongHopController>(
      builder: (controller) {
        if (controller.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        // Gom nhóm dữ liệu
        final grouped = _groupByCuaKhau(controller.rows);
        final tabKeys =
        grouped.keys.isEmpty ? ['Chưa có dữ liệu'] : grouped.keys.toList();

        // Gắn tab controller
        _tabController ??= TabController(length: tabKeys.length, vsync: this);

        final double containerHeight = MediaQuery.of(context).size.height * 0.65;
        final isCustomerMode = controller.contextType == "khach_hang";
        final isNhaXeMode = controller.contextType == "nha_xe";
        final title = isCustomerMode || isNhaXeMode
            ? "Phí hải quan – ${controller.tenKhachHang ?? 'Khách hàng'}"
            : "Chi phí hải quan tổng hợp (Mặc định hệ thống)";

        return Layout(
          mainScreenName: 'Cấu hình',
          subScreenName: title,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ---------------------------------------------------------
              // 🔹 Thanh công cụ
              // ---------------------------------------------------------
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
                      if (isCustomerMode) const SizedBox(width: 8),
                      Text(
                        title,
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
                        onPressed: () => controller
                            .loadData(type: controller.contextType, nid: controller.khachHangNid),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add),
                        label: const Text('Thêm cột'),
                        onPressed: _showAddColumnDialog,
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.add_box_outlined),
                        label: const Text('Thêm dòng'),
                        onPressed: () {
                          controller.rows.add({
                            'Cửa khẩu': '',
                            'Chi phí': '',
                            'Loại': 'Số',
                            ...{for (var c in controller.columns) c: ''}
                          });
                          controller.update();
                        },
                      ),
                      const SizedBox(width: 8),
                      Obx(() => ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green),
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
                        label: Text(controller.isSaving.value
                            ? 'Đang lưu...'
                            : 'Lưu dữ liệu'),
                      )),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // ---------------------------------------------------------
              // 🧭 Tabs + Bảng dữ liệu
              // ---------------------------------------------------------
              MyContainer(
                padding: const EdgeInsets.all(12),
                child: Column(
                  children: [
                    TabBar(
                      controller: _tabController,
                      isScrollable: true,
                      labelColor: Colors.blueAccent,
                      unselectedLabelColor: Colors.black87,
                      tabs: tabKeys.map((key) => Tab(text: key)).toList(),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: containerHeight,
                      child: TabBarView(
                        controller: _tabController,
                        children: tabKeys.map((cuaKhau) {
                          final rows = grouped[cuaKhau] ?? [];

                          return KeyedSubtree( // 👈 thêm Key để mỗi tab có identity riêng
                            key: ValueKey(cuaKhau),
                            child: GestureDetector(
                              onPanUpdate: (details) {
                                if (_horizontalController.hasClients) {
                                  _horizontalController.jumpTo(
                                    (_horizontalController.offset - details.delta.dx * 0.7)
                                        .clamp(0.0, _horizontalController.position.maxScrollExtent),
                                  );
                                }
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
                                  child: _buildTable(controller.columns, rows, cuaKhau),
                                ),
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

  // ---------------------------------------------------------
  // 🧱 Hộp thoại thêm/sửa/xóa cột
  // ---------------------------------------------------------
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

  void _showRenameDialog(String oldName) {
    final textCtrl = TextEditingController(text: oldName);
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Đổi tên cột'),
        content: TextField(
          controller: textCtrl,
          decoration: const InputDecoration(labelText: 'Tên cột mới'),
        ),
        actions: [
          TextButton(onPressed: Get.back, child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () {
              final newName = textCtrl.text.trim();
              if (newName.isEmpty || newName == oldName) {
                Get.back();
                return;
              }
              controller.renameColumn(oldName, newName);
              Get.back();
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  // ---------------------------------------------------------
  // 🧾 Bảng dữ liệu
  // ---------------------------------------------------------
  Widget _buildTable(List<String> columns, List<Map<String, dynamic>> rows, String cuaKhau)
  {
    final fixedColumns = ['Cửa khẩu', 'Chi phí', 'Loại'];
    final visibleColumns = [
      ...fixedColumns,
      ...columns.where((c) => !fixedColumns.contains(c)),
    ];

    return DataTable(
      headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
      headingRowHeight: 72,
      dataRowHeight: 44,
      columns: [
        ...visibleColumns.map((c) {
          final label = c;
          final isFixed = fixedColumns.contains(c);
          final editable = controller.canRename(c) && !isFixed;
          final deletable = controller.canDelete(c) && !isFixed;
          final duplicable = controller.canDuplicate(c) && !isFixed;

          return DataColumn(
            label: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 2),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (editable)
                      IconButton(
                        icon: const Icon(Icons.edit,
                            size: 14, color: Colors.grey),
                        tooltip: 'Đổi tên cột',
                        onPressed: () => _showRenameDialog(c),
                      ),
                    if (duplicable)
                      IconButton(
                        icon: const Icon(Icons.copy,
                            size: 14, color: Colors.blueGrey),
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
        final loai = row['Loại']?.toString() ?? 'Số';
        final isSo = loai == 'Số';

        return DataRow(
          cells: [
            ...visibleColumns.map((c) {
              final cellValue = row[c]?.toString() ?? '';

              // 🔸 Cột Cửa khẩu (readonly)
              if (c == 'Cửa khẩu') return DataCell(Text(cellValue));

              // 🔸 Cột Chi phí (editable text)
              if (c == 'Chi phí') {
                return DataCell(EditableCell(
                  initialValue: cellValue,
                  onChanged: (v) => controller.updateCell(cuaKhau, index, 'Chi phí', v.trim()),
                ));
              }

              // 🔸 Cột Loại (dropdown)
              if (c == 'Loại') {
                return DataCell(
                  DropdownButton<String>(
                    dropdownColor: Colors.white,
                    value: (cellValue.isEmpty) ? 'Số' : cellValue,
                    items: const [
                      DropdownMenuItem(value: 'Số', child: Text('Số')),
                      DropdownMenuItem(value: 'Chữ', child: Text('Chữ')),
                    ],
                    onChanged: (v) => controller.updateCell(cuaKhau, index, 'Loại', v ?? 'Số'),
                  ),
                );
              }

              // 🔸 Cột dữ liệu số
              final bool isNumericColumn = RegExp(
                r'(phí|giá|fee|số|tấn|cbm|amount)',
                caseSensitive: false,
              ).hasMatch(c);

              String displayValue = cellValue;
              if (isSo && cellValue.isNotEmpty) {
                try {
                  final num? number = num.tryParse(
                      cellValue.replaceAll('.', '').replaceAll(',', ''));
                  if (number != null) {
                    displayValue = NumberFormat.decimalPattern('vi_VN').format(number);
                  }
                } catch (_) {}
              }

              // 🔸 Ô dữ liệu có thể sửa
              return DataCell(EditableCell(
                initialValue: displayValue,
                isNumeric: isSo &&
                    (isNumericColumn || RegExp(r'^\d+$').hasMatch(cellValue)),
                onChanged: (v) {
                  final newValue = isSo ? v.replaceAll('.', '').replaceAll(',', '') : v;
                  controller.updateCell(cuaKhau, index, c, newValue);
                },
              ));
            }),
            // ---------------------------------------------------------
            // 🔸 Cột chức năng (nhân bản / xóa dòng)
            // ---------------------------------------------------------
            DataCell(Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.add, color: Colors.green),
                  tooltip: 'Nhân bản dòng này',
                  onPressed: () => controller.duplicateRow(cuaKhau, index),
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  tooltip: 'Xóa dòng',
                  onPressed: () => controller.removeRow(cuaKhau, index),
                ),
              ],
            )),
          ],
        );
      }),
    );
  }
}

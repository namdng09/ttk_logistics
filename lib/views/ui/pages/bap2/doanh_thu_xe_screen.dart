import 'package:kho555/controller/pages/doanh_thu_chuyen_xe_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:kho555/views/ui/pages/bap2/cap_nhat_doanh_thu_screen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class DoanhThuXeScreen extends StatefulWidget {
  const DoanhThuXeScreen({super.key});

  @override
  State<DoanhThuXeScreen> createState() => _DoanhThuXeScreenState();
}

class _DoanhThuXeScreenState extends State<DoanhThuXeScreen> with UIMixin {
  late DoanhThuChuyenXeController controller;
  final TextEditingController _thangController = TextEditingController();

  final NumberFormat nf = NumberFormat('#,###');
  double _lastDx = 0;
  double _lastDy = 0;

  final ScrollController _horizontalCtrl = ScrollController();
  final ScrollController _verticalCtrl = ScrollController();

  @override
  void initState() {
    controller = Get.put(DoanhThuChuyenXeController());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.fetchData(page: 1, limit: controller.rowsPerPage);
    });
    super.initState();
  }
  @override
  void dispose() {
    _thangController.dispose();
    super.dispose();
  }
  String formatCurrency(dynamic value) {
    if (value == null) return '';
    final num? number = num.tryParse(value.toString());
    if (number == null) return value.toString();
    return number.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d)(?=(\d{3})+(?!\d))'),
          (m) => '${m[1]}.',
    );
  }

  Future<void> _chonThang() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      helpText: 'Chọn tháng doanh thu',
    );
    if (picked != null) {
      final formatted = DateFormat('yyyy-MM').format(picked);
      setState(() => _thangController.text = formatted);
      controller.fetchData(page: 1, limit: controller.rowsPerPage, thang: formatted);
    }
  }

  void _xoaThang() {
    setState(() => _thangController.clear());
    controller.fetchData(page: 1, limit: controller.rowsPerPage);
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (_) {
        return Layout(
          subScreenName: 'Doanh thu xe',
          mainScreenName: 'Tài chính',
          child: MyContainer(
            paddingAll: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 🔹 Bộ lọc tháng và xe
                Row(
                  children: [
                    // 🔸 Lọc theo tháng
                    SizedBox(
                      width: 200,
                      child: TextField(
                        controller: _thangController,
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: 'Tháng doanh thu (YYYY-MM)',
                          suffixIcon: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.calendar_today),
                                tooltip: 'Chọn tháng',
                                onPressed: _chonThang,
                              ),
                              if (_thangController.text.isNotEmpty)
                                IconButton(
                                  icon: const Icon(Icons.clear),
                                  tooltip: 'Xóa tháng đã chọn',
                                  onPressed: _xoaThang,
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // 🔸 Lọc theo xe
                    Expanded(
                      child: Obx(() {
                        final hasSelected = controller.selectedXeId.value != 0;
                        return Stack(
                          alignment: Alignment.centerRight,
                          children: [
                            DropdownButtonFormField<int>(
                              dropdownColor: Colors.white,
                              value: hasSelected ? controller.selectedXeId.value : null,
                              hint: const Text('Chọn xe'),
                              decoration: InputDecoration(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                                isDense: true,
                              ),
                              items: controller.xeList.map((e) {
                                final bienSo = e['field_bien_kiem_soat'] ?? e['title'];
                                return DropdownMenuItem<int>(
                                  value: e['nid'],
                                  child: Text(bienSo, style: const TextStyle(fontSize: 14)),
                                );
                              }).toList(),
                              onChanged: (v) {
                                controller.selectedXeId.value = v ?? 0;
                                controller.fetchData(
                                  page: 1,
                                  limit: controller.rowsPerPage,
                                  thang: _thangController.text,
                                  xeId: controller.selectedXeId.value,
                                );
                              },
                            ),

                            if (hasSelected)
                              Positioned(
                                right: 8,
                                child: GestureDetector(
                                  onTap: () {
                                    controller.selectedXeId.value = 0;
                                    controller.fetchData(
                                      page: 1,
                                      limit: controller.rowsPerPage,
                                      thang: _thangController.text,
                                    );
                                  },
                                  child: Container(
                                    width: 28,
                                    height: 28,
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade200,
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(Icons.close, size: 18, color: Colors.grey),
                                  ),
                                ),
                              ),
                          ],
                        );
                      }),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // ============================
                // 🔹 Bảng dữ liệu
                // ============================
                Container(
                  child: Obx(() {
                    if (controller.isLoading.value) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (controller.listDoanhThu.isEmpty) {
                      return const Center(child: Text("Không có dữ liệu doanh thu"));
                    }

                    final list = controller.listDoanhThu;
                    final currentPage = controller.currentPage;
                    final rowsPerPage = controller.rowsPerPage;
                    final total = controller.totalRows;
                    final totalPages = (total / rowsPerPage).ceil();

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // ============================
                        // 🔹 BẢNG DỮ LIỆU
                        // ============================
                        Container(
                          child: GestureDetector(
                            onHorizontalDragStart: (details) => _lastDx = details.globalPosition.dx,
                            onHorizontalDragUpdate: (details) {
                              final delta = _lastDx - details.globalPosition.dx;
                              if (_horizontalCtrl.hasClients) {
                                _horizontalCtrl.jumpTo((_horizontalCtrl.offset + delta)
                                    .clamp(0.0, _horizontalCtrl.position.maxScrollExtent));
                              }
                              _lastDx = details.globalPosition.dx;
                            },
                            onVerticalDragStart: (details) => _lastDy = details.globalPosition.dy,
                            onVerticalDragUpdate: (details) {
                              final delta = _lastDy - details.globalPosition.dy;
                              if (_verticalCtrl.hasClients) {
                                _verticalCtrl.jumpTo((_verticalCtrl.offset + delta)
                                    .clamp(0.0, _verticalCtrl.position.maxScrollExtent));
                              }
                              _lastDy = details.globalPosition.dy;
                            },
                            child: Scrollbar(
                              controller: _horizontalCtrl,
                              thumbVisibility: true,
                              child: SingleChildScrollView(
                                controller: _horizontalCtrl,
                                scrollDirection: Axis.horizontal,
                                child: Scrollbar(
                                  controller: _verticalCtrl,
                                  thumbVisibility: true,
                                  child: SingleChildScrollView(
                                    controller: _verticalCtrl,
                                    scrollDirection: Axis.vertical,
                                    child: DataTable(
                                      dataRowMinHeight: 34,
                                      headingRowHeight: 36,
                                      columnSpacing: 14, // 🔹 giảm khoảng cách giữa các cột
                                      headingRowColor: MaterialStateProperty.all(Colors.blueGrey.shade50),
                                      border: TableBorder.all(color: Colors.grey.shade300, width: 0.8),
                                      columns: const [
                                        DataColumn(label: Text("")),
                                        DataColumn(label: Text("Xe")),
                                        DataColumn(label: Text("Tháng")),
                                        DataColumn(label: Text("Lợi nhuận")),
                                        DataColumn(label: Text("CTY Báo Luật")),
                                        DataColumn(label: Text("Lãi Ngân Hàng")),
                                        DataColumn(label: Text("VETC")),
                                        DataColumn(label: Text("Thay dầu")),
                                        DataColumn(label: Text("Xin giấy phép")),
                                        DataColumn(label: Text("Đổ dầu")),
                                        DataColumn(label: Text("Vé cao tốc")),
                                        DataColumn(label: Text("Vé cầu lương")),
                                        DataColumn(label: Text("Vé phát sinh")),
                                        DataColumn(label: Text("Doanh thu")),
                                        DataColumn(label: Text("Chi phí")),
                                      ],
                                      rows: list.map((item) {
                                        final xe = item["field_xe"]?["label"] ?? "Chưa rõ";
                                        final thang = item["field_thang_doanh_thu"] ?? 0;
                                        final json = item["field_thong_tin_json"] ?? {};

                                        final num loiNhuan = num.tryParse(json["Lợi nhuận"].toString()) ?? 0;
                                        final isPositive = loiNhuan >= 0;
                                        final profitColor = isPositive ? Colors.green.shade700 : Colors.red.shade700;

                                        String f(dynamic v) => formatCurrency(v);

                                        Widget align(dynamic val, {Color? color, bool bold = false}) => Align(
                                          alignment: Alignment.centerRight,
                                          child: Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4), // 🔹 giảm padding ô
                                            child: Text(
                                              f(val),
                                              textAlign: TextAlign.right,
                                              style: TextStyle(
                                                color: color,
                                                fontWeight: bold ? FontWeight.w600 : FontWeight.normal,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ),
                                        );

                                        return DataRow(cells: [
                                          // 🔹 Cột chức năng đầu tiên
                                          DataCell(
                                            IconButton(
                                              icon: const Icon(Icons.edit_note, color: Colors.blueAccent),
                                              tooltip: "Cập nhật doanh thu xe theo tháng",
                                              onPressed: () async {
                                                final result = await Get.to(
                                                      () => CapNhatDoanhThuScreen(
                                                    payload: {
                                                      "nid": item["nid"], // node doanh thu
                                                      "xe": item["field_xe"]?["label"] ?? "",
                                                      "thang": item["field_thang_doanh_thu"],
                                                      "field_thong_tin_json": Map<String, dynamic>.from(item["field_thong_tin_json"] ?? {},
                                                      ),
                                                    },
                                                  ),
                                                  fullscreenDialog: true,
                                                );

                                                if (result == true) {
                                                  controller.fetchData(
                                                    page: controller.currentPage,
                                                    limit: controller.rowsPerPage,
                                                    thang: _thangController.text,
                                                    xeId: controller.selectedXeId.value,
                                                  );
                                                }
                                              },
                                            ),
                                          ),

                                          DataCell(Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 4),
                                            child: Text(xe, style: const TextStyle(fontSize: 13)),
                                          )),
                                          DataCell(Padding(
                                            padding: const EdgeInsets.symmetric(horizontal: 4),
                                            child: Text(
                                              DateFormat('MM/yyyy').format(
                                                DateTime.fromMillisecondsSinceEpoch(thang * 1000),
                                              ),
                                              style: const TextStyle(fontSize: 13),
                                            ),
                                          )),
                                          // 🔹 Cột Lợi nhuận (nổi bật)
                                          DataCell(
                                            align(
                                              json["Lợi nhuận"],
                                              color: profitColor,
                                              bold: true,
                                            ),
                                          ),
                                          DataCell(align(json["CTY Báo Luật"])),
                                          DataCell(align(json["Lãi Ngân Hàng"])),
                                          DataCell(align(json["VETC"])),
                                          DataCell(align(json["Thay dầu"])),
                                          DataCell(align(json["Xin giấy phép"])),
                                          DataCell(align(json["Đổ dầu"])),
                                          DataCell(align(json["Vé cao tốc"])),
                                          DataCell(align(json["Vé cầu lương"])),
                                          DataCell(align(json["Vé phát sinh"])),
                                          DataCell(align(json["Doanh thu"], bold: true)),
                                          DataCell(align(json["Tổng chi"])),
                                        ]);
                                      }).toList(),
                                    )
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                        const SizedBox(height: 8),

                        // 🔹 Thanh phân trang
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              "Trang $currentPage / $totalPages (${controller.totalRows} bản ghi)",
                              style: const TextStyle(fontWeight: FontWeight.w500),
                            ),
                            const SizedBox(width: 16),
                            IconButton(
                              icon: const Icon(Icons.chevron_left),
                              onPressed: currentPage > 1
                                  ? () {
                                controller.fetchData(
                                  page: currentPage - 1,
                                  limit: rowsPerPage,
                                  thang: _thangController.text,
                                  xeId: controller.selectedXeId.value,
                                );
                                controller.currentPage--;
                              }
                                  : null,
                            ),
                            IconButton(
                              icon: const Icon(Icons.chevron_right),
                              onPressed: currentPage < totalPages
                                  ? () {
                                controller.fetchData(
                                  page: currentPage + 1,
                                  limit: rowsPerPage,
                                  thang: _thangController.text,
                                  xeId: controller.selectedXeId.value,
                                );
                                controller.currentPage++;
                              }
                                  : null,
                            ),
                          ],
                        ),
                      ],
                    );
                  }),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

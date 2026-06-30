import 'dart:convert';
import 'package:kho555/controller/pages/luong_lai_xe_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

import 'cap_nhat_chi_phi_screen.dart';

class LuongLaiXeScreen extends StatefulWidget {
  const LuongLaiXeScreen({super.key});

  @override
  State<LuongLaiXeScreen> createState() => _LuongLaiXeScreenState();
}

class _LuongLaiXeScreenState extends State<LuongLaiXeScreen> with UIMixin {
  late LuongLaiXeController controller;
  final NumberFormat nf = NumberFormat('#,###');
  final TextEditingController _thangController = TextEditingController();

  double _lastDx = 0;
  double _lastDy = 0;

  final ScrollController _horizontalCtrl = ScrollController();
  final ScrollController _verticalCtrl = ScrollController();

  @override
  void initState() {
    controller = Get.put(LuongLaiXeController());
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // ✅ Khi mở form, chưa chọn tháng nào → lấy toàn bộ dữ liệu
      controller.fetchData(page: 1, limit: controller.rowsPerPage);
    });

  }

  String f(num? v) => v == null ? '' : nf.format(v);

  /// Chọn tháng (YYYY-MM)
  Future<void> _chonThang() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      helpText: 'Chọn tháng lương',
    );

    if (picked != null) {
      final formatted = DateFormat('yyyy-MM').format(picked);
      setState(() => _thangController.text = formatted);
      controller.fetchData(
        page: 1,
        limit: controller.rowsPerPage,
        thang: formatted,
        laiXeId: controller.selectedLaiXeId.value,
      );
    }
  }

  /// Xoá tháng đã chọn (reset filter)
  void _xoaThang() {
    setState(() => _thangController.clear());
    controller.fetchData(
      page: 1,
      limit: controller.rowsPerPage,
      laiXeId: controller.selectedLaiXeId.value,
    );
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

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (_) {
        return Layout(
          subScreenName: 'Lương lái xe',
          mainScreenName: 'Kế toán',
          child: MyContainer(
            paddingAll: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ============================
                // 🔹 Bộ lọc
                // ============================
                Row(
                  children: [
                    // 🔸 Lọc theo tháng
                    SizedBox(
                      width: 200,
                      child: TextField(
                        controller: _thangController,
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: 'Tháng lương (YYYY-MM)',
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

                    // 🔸 Lọc theo lái xe
                    Expanded(
                      child: Obx(() {
                        final hasSelected = controller.selectedLaiXeId.value != 0;

                        return Stack(
                          alignment: Alignment.centerRight,
                          children: [
                            DropdownButtonFormField<int>(
                              dropdownColor: Colors.white,
                              value: hasSelected ? controller.selectedLaiXeId.value : null,
                              hint: const Text('Chọn lái xe'),
                              decoration: InputDecoration(
                                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                border: OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
                                isDense: true,
                              ),
                              items: controller.laiXeList.map((e) {
                                final tenLaiXe = e['field_ten_lai_xe'] ?? '';
                                final dienThoai = e['field_dien_thoai'] ?? '';

                                return DropdownMenuItem<int>(
                                  value: e['nid'],
                                  child: Text(
                                    "$tenLaiXe${dienThoai.isNotEmpty ? ' - $dienThoai' : ''}",
                                    style: const TextStyle(fontSize: 14),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              }).toList(),
                              onChanged: (v) {
                                controller.selectedLaiXeId.value = v ?? 0;
                                controller.fetchData(
                                  page: 1,
                                  limit: controller.rowsPerPage,
                                  thang: _thangController.text,
                                  laiXeId: controller.selectedLaiXeId.value,
                                );
                              },
                            ),

                            // 🔹 Nút xoá lựa chọn (hiện khi đã chọn lái xe)
                            if (hasSelected)
                              Positioned(
                                right: 8,
                                child: GestureDetector(
                                  onTap: () {
                                    controller.selectedLaiXeId.value = 0;
                                    controller.fetchData(
                                      page: 1,
                                      limit: controller.rowsPerPage,
                                      thang: _thangController.text,
                                      laiXeId: 0,
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

                    if (controller.listLuong.isEmpty) {
                      return const Center(child: Text("Không có dữ liệu"));
                    }

                    final list = controller.listLuong;
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
                            onHorizontalDragStart: (details) {
                              _lastDx = details.globalPosition.dx.toDouble();
                            },
                            onHorizontalDragUpdate: (details) {
                              final double delta = _lastDx - details.globalPosition.dx.toDouble();
                              if (_horizontalCtrl.hasClients) {
                                final newOffset = (_horizontalCtrl.offset + delta)
                                    .clamp(0.0, _horizontalCtrl.position.maxScrollExtent);
                                _horizontalCtrl.jumpTo(newOffset);
                              }
                              _lastDx = details.globalPosition.dx.toDouble();
                            },
                            onVerticalDragStart: (details) {
                              _lastDy = details.globalPosition.dy.toDouble();
                            },
                            onVerticalDragUpdate: (details) {
                              final double delta = _lastDy - details.globalPosition.dy.toDouble();
                              if (_verticalCtrl.hasClients) {
                                final newOffset = (_verticalCtrl.offset + delta)
                                    .clamp(0.0, _verticalCtrl.position.maxScrollExtent);
                                _verticalCtrl.jumpTo(newOffset);
                              }
                              _lastDy = details.globalPosition.dy.toDouble();
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
                                      dataRowMinHeight: 36,
                                      dataRowMaxHeight: 36,
                                      headingRowHeight: 40,
                                      headingRowColor:
                                      MaterialStateProperty.all(Colors.blueGrey.shade50),
                                      border: TableBorder.all(color: Colors.grey.shade300),
                                      columns: const [
                                        DataColumn(label: Text("")), // ✅ thêm cột đầu tiên
                                        DataColumn(label: Text("Lái xe")),
                                        DataColumn(label: Text("Tháng lương")),
                                        DataColumn(label: Text("Số chuyến")),
                                        DataColumn(label: Text("LƯƠNG CƠ BẢN")),
                                        DataColumn(label: Text("TIỀN ĂN")),
                                        DataColumn(label: Text("THƯỞNG CHUYẾN")),
                                        DataColumn(label: Text("TRẢ ĐIỂM")),
                                        DataColumn(label: Text("TRỐN VÉ")),
                                        DataColumn(label: Text("BẢO HIỂM")),
                                        DataColumn(label: Text("LXE BÁO LUẬT")),
                                        DataColumn(label: Text("LÁI XE CHI")),
                                        DataColumn(label: Text("TỔNG LƯƠNG")),
                                        DataColumn(label: Text("ỨNG TIỀN LÁI XE")),
                                        DataColumn(label: Text("THỰC NHẬN")),
                                      ],
                                      rows: list.map((item) {
                                        final chiPhi = Map<String, dynamic>.from(item["chi_phi"] ?? {});
                                        return DataRow(cells: [
                                          // 🔹 Cột chức năng đầu tiên
                                          DataCell(
                                            IconButton(
                                              icon: const Icon(Icons.edit_note, color: Colors.blueAccent),
                                              tooltip: "Cập nhật chi phí",
                                              onPressed: () async {
                                                final result = await Get.to(
                                                      () => CapNhatChiPhiScreen(item: item),
                                                  fullscreenDialog: true,
                                                );

                                                if (result == true) {
                                                  controller.fetchData(
                                                    page: controller.currentPage,
                                                    limit: controller.rowsPerPage,
                                                    thang: _thangController.text,
                                                    laiXeId: controller.selectedLaiXeId.value,
                                                  );
                                                }
                                              },
                                            ),
                                          ),
                                          // 🔹 Lái xe – căn trái
                                          DataCell(Align(
                                            alignment: Alignment.centerLeft,
                                            child: Text(item["lai_xe"] ?? ''),
                                          )),
                                          // 🔹 Tháng lương – căn giữa
                                          DataCell(Align(
                                            alignment: Alignment.center,
                                            child: Text(item["thang_luong"] ?? ''),
                                          )),
                                          // 🔹 Các cột còn lại – căn phải
                                          DataCell(Align(
                                            alignment: Alignment.centerRight,
                                            child: Text(item["so_chuyen_xe"]?.toString() ?? ''),
                                          )),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["LƯƠNG CƠ BẢN"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["TIỀN ĂN"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["THƯỞNG CHUYẾN"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["TRẢ ĐIỂM"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["TRỐN VÉ"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["BẢO HIỂM"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["CHI PHÍ LX BÁO LUẬT"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["CHI PHÍ LÁI XE CHI"])))
                                          ),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["TỔNG LƯƠNG"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["ỨNG TIỀN LÁI XE"])))),
                                          DataCell(Align(
                                              alignment: Alignment.centerRight,
                                              child: Text(formatCurrency(chiPhi["THỰC NHẬN"])))),
                                        ]);
                                      }).toList(),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                    const SizedBox(height: 8),

                        // ============================
                        // 🔹 THANH PHÂN TRANG
                        // ============================
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
                                  laiXeId: controller.selectedLaiXeId.value,
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
                                  laiXeId: controller.selectedLaiXeId.value,
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
                )

              ],
            ),
          ),
        );
      },
    );
  }
}

import 'package:kho555/controller/cong_no_controller.dart';
import 'package:kho555/controller/cong_no_nha_cung_cap_controller.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:intl/intl.dart';

class CongNoNhaCungCapScreen extends StatefulWidget {
  const CongNoNhaCungCapScreen({super.key});

  @override
  State<CongNoNhaCungCapScreen> createState() => _CongNoNhaCungCapScreenState();
}

class _CongNoNhaCungCapScreenState extends State<CongNoNhaCungCapScreen> with UIMixin {
  late CongNoNhaCungCapController controller;
  final ScrollController _horizontalController = ScrollController();
  final ScrollController _verticalController = ScrollController();

  final NumberFormat _currency = NumberFormat("#,###", "vi_VN");
  final DateFormat _dateFormat = DateFormat("dd/MM/yyyy");

  @override
  void initState() {
    super.initState();
    controller = Get.put(CongNoNhaCungCapController());
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.fetchCongNo();
    });
  }

  /// ===============================
  /// BUILD ROWS
  /// ===============================
  List<DataRow> buildRows(List<Map<String, dynamic>> data) {
    if (data.isEmpty) {
      return [
        DataRow(
          cells: const [
            DataCell(Text("")),
            DataCell(Text("")),
            DataCell(Text("")),
            DataCell(Text("")),
            DataCell(
              Center(
                child: Text(
                  "Không có dữ liệu",
                  style: TextStyle(
                    fontStyle: FontStyle.italic,
                    color: Colors.grey,
                  ),
                ),
              ),
            ),
            DataCell(Text("")),
            DataCell(Text("")),
            DataCell(Text("")),
            DataCell(Text("")),
            DataCell(Text("")),
          ],
        ),
      ];
    }

    return data.map((item) {
      final int nid = int.tryParse(item["nid"].toString()) ?? 0;

      final num tongTien =
          num.tryParse(item["tong_tien"].toString()) ?? 0;
      final num tongCongNo =
          num.tryParse(item["cong_no"].toString()) ?? 0;
      final num daTra =
          num.tryParse(item["da_tra"].toString()) ?? 0;
      final num conLai =
          num.tryParse(item["con_lai"].toString()) ?? 0;

      return DataRow(
        cells: [
          // 🔹 Chức năng
          DataCell(
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: Colors.grey),
              onSelected: (v) async {
                switch (v) {
                  case "view":
                  /// ✅ XEM LỊCH SỬ THANH TOÁN THEO CHUYẾN XE
                    await controller.viewCongNo(
                      context,
                      int.tryParse(item["nid"]?.toString() ?? "0") ?? 0,
                    );
                    break;

                  case "thu_tien":
                  // 🔥 GỌI FLOW THU TIỀN
                    await controller.openThuTienDialog(
                      context: context,
                      khachHangNid: int.tryParse(item["khach_hang_nid"]?.toString() ?? "0") ?? 0
                      // hoặc nếu chưa có thì bạn sẽ bổ sung từ API
                    );
                    break;
                }
              },
              itemBuilder: (_) => buildMenu(),
            ),
          ),
          // 🔹 Mã
          DataCell(cellText("#$nid", width: 50)),

          // 🔹 Ngày VC (FIX KEY)
          DataCell(
            cellText(
              formatDate(item["ngay_van_chuyen"]),
              width: 100,
            ),
          ),

          // 🔹 Khách hàng
          DataCell(
            cellText(
              item["khach_hang"] ?? "",
              width: 220,
            ),
          ),
          // 🔹 Khách hàng
          DataCell(
            cellText(
              "${formatMoney(tongCongNo)} đ",
              right: true,
              weight: FontWeight.bold,
              width: 100,
            ),
          ),

          // 🔹 Tổng tiền
          DataCell(
            cellText(
              "${formatMoney(tongTien)} đ",
              right: true,
              weight: FontWeight.bold,
              width: 100,
            ),
          ),

          // 🔹 Đã trả
          DataCell(
            cellText(
              "${formatMoney(daTra)} đ",
              right: true,
              color: Colors.green.shade700,
              width: 100,
            ),
          ),

          // 🔹 Còn lại (API quyết định)
          DataCell(
            cellText(
              "${formatMoney(conLai)} đ",
              right: true,
              color: conLai > 0 ? Colors.redAccent : Colors.grey,
              weight: FontWeight.bold,
              width: 100,
            ),
          ),
        ],
      );
    }).toList();
  }

  /// ===============================
  /// FORMATTERS
  /// ===============================
  String formatMoney(dynamic value) {
    final num? n = num.tryParse(value.toString());
    return n != null ? _currency.format(n) : "0";
  }

  String formatDate(dynamic ts) {
    try {
      final int? v = int.tryParse(ts.toString());
      if (v != null) {
        return _dateFormat.format(
          DateTime.fromMillisecondsSinceEpoch(v * 1000),
        );
      }
    } catch (_) {}
    return "";
  }

  Widget cellText(
      String text, {
        bool right = false,
        Color? color,
        FontWeight weight = FontWeight.normal,
        double width = 120,
      }) {
    return Container(
      width: width,
      alignment: right ? Alignment.centerRight : Alignment.centerLeft,
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Text(
        text,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          fontSize: 14,
          color: color ?? Colors.black87,
          fontWeight: weight,
        ),
      ),
    );
  }

  /// ===============================
  /// MENU CHỨC NĂNG
  /// ===============================
  List<PopupMenuEntry<String>> buildMenu() => const [
    PopupMenuItem(
      value: "view",
      child: Row(
        children: [
          Icon(Icons.visibility_outlined, size: 18),
          SizedBox(width: 8),
          Text("Xem chi tiết"),
        ],
      ),
    ),
    PopupMenuItem(
      value: "thu_tien",
      child: Row(
        children: [
          Icon(Icons.payments_outlined,
              size: 18, color: Colors.green),
          SizedBox(width: 8),
          Text("Thu tiền"),
        ],
      ),
    ),
  ];
  @override
  Widget build(BuildContext context) {
    return GetBuilder<CongNoNhaCungCapController>(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Công nợ nhà cung cấp',
          mainScreenName: 'Tài chính',
          child: MyContainer(
            height: 400,
            paddingAll: 10,
            child: controller.isLoading
                ? const Center(child: CircularProgressIndicator())
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,

                    children: [
                    // ===============================
                    // 🔢 TỔNG CÔNG NỢ
                    // ===============================
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          /// ===============================
                          /// 🔢 THỐNG KÊ
                          /// ===============================
                          Expanded(
                            flex: 4,
                            child: Row(
                              children: [
                                _buildSummaryBox(
                                  title: "Tổng tiền công nợ",
                                  value: controller.tongTienCongNo,
                                  color: Colors.blue,
                                ),
                                _buildSummaryBox(
                                  title: "Đã thu",
                                  value: controller.tongTienDaTra,
                                  color: Colors.green,
                                ),
                                _buildSummaryBox(
                                  title: "Còn lại",
                                  value: controller.tongTienConLai,
                                  color: Colors.redAccent,
                                ),
                              ],
                            ),
                          ),

                          const SizedBox(width: 12),

                          /// ===============================
                          /// 🔍 BỘ LỌC
                          /// ===============================
                          Expanded(
                            flex: 5,
                            child: Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              alignment: WrapAlignment.end,
                              children: [
                                // 🔍 Tên khách hàng
                                SizedBox(
                                  width: 200,
                                  height: 55,
                                  child: TextField(
                                    controller: controller.keywordController,
                                    decoration: const InputDecoration(
                                      hintText: "Tên khách hàng",
                                      prefixIcon: Icon(Icons.search, size: 18),
                                      isDense: true,
                                      contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                      border: OutlineInputBorder(),
                                    ),
                                  ),
                                ),

                                // ▼ Trạng thái
                                SizedBox(
                                  width: 160,
                                  height: 41, // 👈 ép chiều cao
                                  child: DropdownButtonFormField<String>(
                                    dropdownColor: Colors.white,
                                    value: controller.trangThaiCongNo,
                                    decoration: const InputDecoration(
                                      isDense: true,
                                      border: OutlineInputBorder(),
                                    ),
                                    items: const [
                                      DropdownMenuItem(value: "all", child: Text("Tất cả")),
                                      DropdownMenuItem(value: "done", child: Text("Đã thu hết")),
                                      DropdownMenuItem(value: "pending", child: Text("Chưa thu hết")),
                                    ],
                                    onChanged: (v) {
                                      controller.trangThaiCongNo = v ?? "all";
                                    },
                                  ),
                                ),

                                // 🔎 Tìm kiếm
                                ElevatedButton.icon(
                                  icon: const Icon(Icons.search),
                                  label: const Text("Tìm"),
                                  onPressed: () {
                                    controller.fetchCongNo(
                                      page: 1,
                                      keywordKhachHang: controller.keywordController.text,
                                      trangThaiCongNo: controller.trangThaiCongNo,
                                    );
                                  },
                                ),

                                // ♻ Reset
                                OutlinedButton.icon(
                                  icon: const Icon(Icons.refresh),
                                  label: const Text("Reset"),
                                  onPressed: () {
                                    controller.keywordController.clear();
                                    controller.trangThaiCongNo = "all";
                                    controller.fetchCongNo(page: 1);
                                  },
                                ),

                                // ⬇ Tải bảng kê
                                GetBuilder<CongNoController>(
                                  builder: (controller) {
                                    return ElevatedButton.icon(
                                      icon: controller.isExporting
                                          ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                          : const Icon(Icons.download),
                                      label: Text(
                                        controller.isExporting ? "Đang xuất..." : "Tải bảng kê",
                                      ),
                                      onPressed: controller.isExporting
                                          ? null
                                          : () {
                                        controller.fetchCongNo(
                                          page: 1,
                                          keywordKhachHang: controller.keywordController.text,
                                          trangThaiCongNo: controller.trangThaiCongNo,
                                          export: true,
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.deepPurple,
                                      ),
                                    );
                                  },
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                    GestureDetector(
                                  onPanUpdate: (details) {
                    // Kéo ngang
                    if (_horizontalController.hasClients) {
                      _horizontalController.jumpTo(
                        (_horizontalController.offset -
                            details.delta.dx * 0.7)
                            .clamp(
                          0.0,
                          _horizontalController
                              .position.maxScrollExtent,
                        ),
                      );
                    }
                    // Kéo dọc
                    if (_verticalController.hasClients) {
                      _verticalController.jumpTo(
                        (_verticalController.offset -
                            details.delta.dy * 0.7)
                            .clamp(
                          0.0,
                          _verticalController
                              .position.maxScrollExtent,
                        ),
                      );
                    }

                    },
                                  child: SingleChildScrollView(
                    controller: _horizontalController,
                    scrollDirection: Axis.horizontal,
                    child: SingleChildScrollView(
                      controller: _verticalController,
                      scrollDirection: Axis.vertical,
                      child: DataTable(
                        headingRowColor:
                        MaterialStateProperty.all(
                            Colors.grey.shade200),
                        headingRowHeight: 48,
                        dataRowHeight: 56,
                        columnSpacing: 12,
                        columns: const [
                          DataColumn(label: Text("")), // Chức năng
                          DataColumn(label: Text("Mã")),
                          DataColumn(label: Text("Ngày VC")),
                          DataColumn(label: Text("Nhà xe")),
                          DataColumn(label: Text("Công nợ")),
                          DataColumn(label: Text("Tổng tiền")),
                          DataColumn(label: Text("Đã trả")),
                          DataColumn(label: Text("Còn lại")),
                        ],
                        rows: buildRows(controller.congNoList),
                      ),
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

  Widget _buildSummaryBox({
    required String title,
    required double value,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: 13,
                color: color,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              "${formatMoney(value)} đ",
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }

}

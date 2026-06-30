import 'package:kho555/controller/pages/luong_lai_xe_controller.dart';
import 'package:kho555/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class CapNhatChiPhiScreen extends StatefulWidget {
  final Map<String, dynamic> item;

  const CapNhatChiPhiScreen({super.key, required this.item});

  @override
  State<CapNhatChiPhiScreen> createState() => _CapNhatChiPhiScreenState();
}

class _CapNhatChiPhiScreenState extends State<CapNhatChiPhiScreen> {
  late Map<String, dynamic> chiPhi;
  late Map<String, dynamic> chiPhiCoDinh;
  late List<Map<String, dynamic>> chiPhiPhatSinh;

  final ScrollController _scrollController = ScrollController();
  final luongController = Get.find<LuongLaiXeController>();

  bool updating = false;

  @override
  void initState() {
    super.initState();

    // Toàn bộ chi phí gốc
    chiPhi = Map<String, dynamic>.from(widget.item["chi_phi"] ?? {});

    // Nhóm chi phí cố định đầy đủ
    chiPhiCoDinh = {
      "LƯƠNG CƠ BẢN": chiPhi["LƯƠNG CƠ BẢN"] ?? 0,
      "TIỀN ĂN": chiPhi["TIỀN ĂN"] ?? 0,
      "THƯỞNG CHUYẾN": chiPhi["THƯỞNG CHUYẾN"] ?? 0,
      "TRẢ ĐIỂM": chiPhi["TRẢ ĐIỂM"] ?? 0,
      "TRỐN VÉ": chiPhi["TRỐN VÉ"] ?? 0,
      "BẢO HIỂM": chiPhi["BẢO HIỂM"] ?? 0,
      "CHI PHÍ LX BÁO LUẬT": chiPhi["CHI PHÍ LX BÁO LUẬT"] ?? 0,
      "ỨNG TIỀN LÁI XE": chiPhi["ỨNG TIỀN LÁI XE"] ?? 0,
    };

    // Danh sách chi phí phát sinh
    chiPhiPhatSinh = List<Map<String, dynamic>>.from(
      chiPhi["CHI PHÍ KHÁC"] ?? [],
    );
  }
  // =============================
  // FORMAT CURRENCY
  // =============================
  String _formatCurrency(dynamic value) {
    if (value == null) return '';
    final num? number = num.tryParse(value.toString());
    if (number == null) return value.toString();
    return number
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
  }

  // =============================
  // TÍNH TỔNG CHI PHÍ PHÁT SINH
  // =============================
  num get tongPhatSinh {
    num total = 0;
    for (final e in chiPhiPhatSinh) {
      total += num.tryParse(e["sauVat"].toString()) ?? 0;
    }
    return total;
  }

  // =============================
  // TÍNH TỔNG LƯƠNG (CỐ ĐỊNH + PHÁT SINH)
  // =============================
  num get tongLuong {
    final tongCoDinh =
        chiPhiCoDinh["LƯƠNG CƠ BẢN"] +
            chiPhiCoDinh["TIỀN ĂN"] +
            chiPhiCoDinh["THƯỞNG CHUYẾN"] +
            chiPhiCoDinh["TRẢ ĐIỂM"] +
            chiPhiCoDinh["TRỐN VÉ"] +
            chiPhiCoDinh["BẢO HIỂM"] +
            chiPhiCoDinh["CHI PHÍ LX BÁO LUẬT"];

    return tongCoDinh + tongPhatSinh;
  }

  // =============================
  // TÍNH THỰC NHẬN
  // =============================
  num get thucNhan {
    final ungTien = chiPhiCoDinh["ỨNG TIỀN LÁI XE"] ?? 0;
    final baoHiem = chiPhiCoDinh["BẢO HIỂM"] ?? 0;

    return tongLuong - ungTien - baoHiem;
  }

  // =============================
  // RECALC MỖI DÒNG PHÁT SINH
  // =============================
  void _recalcRow(Map<String, dynamic> row) {
    final double donGia = double.tryParse(row["donGia"].toString()) ?? 0;
    final double soLuong = double.tryParse(row["soLuong"].toString()) ?? 0;
    final double vat = double.tryParse(row["vat"].toString()) ?? 0;

    final double tongTien = donGia * soLuong;
    final double sauVat = tongTien * (1 + vat / 100);

    row["tongTien"] = tongTien;
    row["sauVat"] = sauVat;
  }
  // =============================
  // UI CHI PHÍ CỐ ĐỊNH (2 INPUT / HÀNG)
  // =============================
  Widget _buildBlockChiPhiCoDinh() {
    final keys = chiPhiCoDinh.keys.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Chi phí cố định",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        // Mỗi dòng 4 input
        Column(
          children: List.generate(
            (keys.length / 4).ceil(),
                (rowIndex) {
              final item1 = keys[rowIndex * 4];
              final item2 = (rowIndex * 4 + 1 < keys.length)
                  ? keys[rowIndex * 4 + 1]
                  : null;
              final item3 = (rowIndex * 4 + 2 < keys.length)
                  ? keys[rowIndex * 4 + 2]
                  : null;
              final item4 = (rowIndex * 4 + 3 < keys.length)
                  ? keys[rowIndex * 4 + 3]
                  : null;

              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Expanded(child: _buildFixedCostInput(item1)),
                    const SizedBox(width: 16),
                    Expanded(
                      child: item2 != null
                          ? _buildFixedCostInput(item2)
                          : Container(),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: item3 != null
                          ? _buildFixedCostInput(item3)
                          : Container(),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: item4 != null
                          ? _buildFixedCostInput(item4)
                          : Container(),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // =============================
  // INPUT CHI PHÍ CỐ ĐỊNH
  // =============================
  Widget _buildFixedCostInput(String key) {
    final controller =
    TextEditingController(text: _formatCurrency(chiPhiCoDinh[key]));
    final focusNode = FocusNode();

    void save() {
      final text = controller.text.replaceAll('.', '');
      chiPhiCoDinh[key] = double.tryParse(text) ?? 0;
      setState(() {});
    }

    focusNode.addListener(() {
      if (!focusNode.hasFocus) save();
    });

    return TextField(
      controller: controller,
      focusNode: focusNode,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.right,
      inputFormatters: [ThousandsSeparatorInputFormatter()],
      decoration: InputDecoration(
        labelText: key,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
      onSubmitted: (_) => save(),
    );
  }

  // =============================
  // BẢNG CHI PHÍ PHÁT SINH
  // =============================
  Widget _buildPhatSinhTable() {
    // =============================
    // ADD / REMOVE ROW CHI PHÍ PHÁT SINH
    // =============================
    void _addRow() {
      setState(() {
        chiPhiPhatSinh.add({
          "ten": "",
          "donGia": 0,
          "soLuong": 1,
          "donVi": "",
          "vat": 0,
          "tongTien": 0,
          "sauVat": 0,
        });
      });
    }

    void _removeRow(int index) {
      setState(() {
        chiPhiPhatSinh.removeAt(index);
      });
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Danh sách chi phí phát sinh",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            ElevatedButton.icon(
              onPressed: _addRow,
              icon: const Icon(Icons.add),
              label: const Text("Thêm dòng"),
            )
          ],
        ),
        const SizedBox(height: 8),

        GestureDetector(
          onHorizontalDragUpdate: (d) {
            if (_scrollController.hasClients) {
              _scrollController.jumpTo(
                (_scrollController.offset - d.delta.dx)
                    .clamp(0.0, _scrollController.position.maxScrollExtent),
              );
            }
          },
          child: SingleChildScrollView(
            controller: _scrollController,
            scrollDirection: Axis.horizontal,
            child: DataTable(
              border: TableBorder.all(color: Colors.grey.shade300),
              columns: const [
                DataColumn(label: Text("Tên chi phí")),
                DataColumn(label: Text("Đơn giá")),
                DataColumn(label: Text("SL")),
                DataColumn(label: Text("ĐVT")),
                DataColumn(label: Text("Tổng")),
                DataColumn(label: Text("VAT")),
                DataColumn(label: Text("Sau VAT")),
                DataColumn(label: Text("Xoá")),
              ],
              rows: List.generate(chiPhiPhatSinh.length, (index) {
                final item = chiPhiPhatSinh[index];
                _recalcRow(item);

                return DataRow(
                  cells: [
                    DataCell(_cell(item, "ten", isNum: false)),
                    DataCell(_cell(item, "donGia")),
                    DataCell(_cell(item, "soLuong")),
                    DataCell(_cell(item, "donVi", isNum: false)),
                    DataCell(Text(_formatCurrency(item["tongTien"]))),
                    DataCell(_cell(item, "vat")),
                    DataCell(Text(_formatCurrency(item["sauVat"]))),
                    DataCell(
                      IconButton(
                        icon: const Icon(Icons.delete, color: Colors.red),
                        onPressed: () => _removeRow(index),
                      ),
                    ),
                  ],
                );
              }),
            ),
          ),
        ),

        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            "Tổng phát sinh: ${_formatCurrency(tongPhatSinh)} ₫",
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        )
      ],
    );
  }

  // =============================
  // CELL INPUT TRONG TABLE PHÁT SINH
  // =============================
  Widget _cell(Map<String, dynamic> row, String key, {bool isNum = true}) {
    final controller = TextEditingController(
      text: isNum ? _formatCurrency(row[key]) : row[key]?.toString(),
    );
    final focusNode = FocusNode();

    void save() {
      final text = controller.text.replaceAll('.', '').replaceAll(',', '');
      row[key] = isNum ? double.tryParse(text) ?? 0 : controller.text;
      setState(() {});
    }

    focusNode.addListener(() {
      if (!focusNode.hasFocus) save();
    });

    return SizedBox(
      width: 100,
      child: TextFormField(
        controller: controller,
        focusNode: focusNode,
        textAlign: isNum ? TextAlign.right : TextAlign.left,
        keyboardType: isNum ? TextInputType.number : TextInputType.text,
        inputFormatters: isNum ? [ThousandsSeparatorInputFormatter()] : [],
        decoration: const InputDecoration(border: InputBorder.none),
        onFieldSubmitted: (_) => save(),
      ),
    );
  }
  // =============================
  // SUMMARY BOX – CỘT PHẢI
  // =============================
  Widget _buildSummaryBox() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: Colors.blueGrey.shade50,
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "TỔNG KẾT",
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 20),

          // TỔNG LƯƠNG
          const Text(
            "Tổng lương (gồm phát sinh):",
            style: TextStyle(fontWeight: FontWeight.w500),
          ),
          Text(
            "${_formatCurrency(tongLuong)} ₫",
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          const SizedBox(height: 20),

          // ỨNG TIỀN
          const Text(
            "Ứng tiền lái xe:",
            style: TextStyle(fontWeight: FontWeight.w500),
          ),
          Text(
            "${_formatCurrency(chiPhiCoDinh["ỨNG TIỀN LÁI XE"])} ₫",
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 20),

          // BẢO HIỂM
          const Text(
            "Khấu trừ bảo hiểm:",
            style: TextStyle(fontWeight: FontWeight.w500),
          ),
          Text(
            "${_formatCurrency(chiPhiCoDinh["BẢO HIỂM"])} ₫",
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),

          const SizedBox(height: 20),
          const Divider(),

          // THỰC NHẬN
          const SizedBox(height: 12),
          const Text(
            "THỰC NHẬN:",
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          Text(
            "${_formatCurrency(thucNhan)} ₫",
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Colors.teal,
            ),
          ),
        ],
      ),
    );
  }
  // =============================
  // PAYLOAD GỬI SERVER
  // =============================
  Map<String, dynamic> _buildPayload() {
    return {
      "id": widget.item["nid"],
      "lai_xe": widget.item["lai_xe"],
      "thang_luong": widget.item["thang_luong"],

      "chi_phi": {
        ...chiPhiCoDinh,
        "TỔNG LƯƠNG": tongLuong,
        "THỰC NHẬN": thucNhan,
        "CHI PHÍ KHÁC": chiPhiPhatSinh,
        "tong_phat_sinh": tongPhatSinh,
      }
    };
  }

  // =============================
  // LƯU
  // =============================
  Future<void> _save() async {
    setState(() => updating = true);

    final ok = await luongController.capNhatChiPhiLuongLaiXe(_buildPayload());

    setState(() => updating = false);

    if (ok) {
      Navigator.pop(context, true);
    }
  }

  // =============================
  // BUILD — LAYOUT 2 CỘT
  // =============================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        elevation: 1,
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.black),
        title: Text(
          "Cập nhật chi phí: ${widget.item["lai_xe"]}",
          style: const TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: updating ? Colors.teal.shade200 : Colors.teal,
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
            ),
            icon: updating
                ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
                : const Icon(Icons.save_outlined),
            label: Text(updating ? "Đang lưu..." : "Lưu thay đổi"),
            onPressed: updating ? null : _save,
          ),
        ],
      ),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // =======================
            // 🔹 CỘT TRÁI (INPUT + PHÁT SINH)
            // =======================
            Expanded(
              flex: 7,
              child: ListView(
                children: [
                  _buildBlockChiPhiCoDinh(),
                  const SizedBox(height: 24),
                  _buildPhatSinhTable(),
                ],
              ),
            ),

            const SizedBox(width: 20),

            // =======================
            // 🔹 CỘT PHẢI (SUMMARY BOX)
            // =======================
            Expanded(
              flex: 3,
              child: _buildSummaryBox(),
            ),
          ],
        ),
      ),
    );
  }
}

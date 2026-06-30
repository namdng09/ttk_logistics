import 'package:kho555/controller/pages/doanh_thu_chuyen_xe_controller.dart';
import 'package:kho555/helper/extensions/extensions.dart';
import 'package:kho555/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';

class CapNhatDoanhThuScreen extends StatefulWidget {
  final Map<String, dynamic> payload;

  const CapNhatDoanhThuScreen({super.key, required this.payload});

  @override
  State<CapNhatDoanhThuScreen> createState() => _CapNhatDoanhThuScreenState();
}

class _CapNhatDoanhThuScreenState extends State<CapNhatDoanhThuScreen> {
  late Map<String, dynamic> data;
  late List<Map<String, dynamic>> chiPhiKhac;

  bool updating = false;

  static const List<String> costKeys = [
    "CTY Báo Luật",
    "Lãi Ngân Hàng",
    "VETC",
    "Thay dầu",
    "Xin giấy phép",
    "Đổ dầu",
    "Vé cao tốc",
    "Vé cầu lương",
    "Vé phát sinh",
  ];

  @override
  void initState() {
    super.initState();
    data = Map<String, dynamic>.from(widget.payload["field_thong_tin_json"] ?? {});
    chiPhiKhac = List<Map<String, dynamic>>.from(
      data["Chi phí khác"] ?? [],
    );

    for (final k in costKeys) {
      data.putIfAbsent(k, () => 0);
    }
  }

  // =============================
  // FORMAT
  // =============================
  String money(dynamic v) {
    final n = num.tryParse(v.toString()) ?? 0;
    return n
        .toStringAsFixed(0)
        .replaceAllMapped(RegExp(r'(\d)(?=(\d{3})+(?!\d))'), (m) => '${m[1]}.');
  }

  // =============================
  // TÍNH TOÁN
  // =============================
  num get tongChiPhiKhac {
    return chiPhiKhac.fold(
      0,
          (sum, e) => sum + (e["thanh_tien"] ?? 0),
    );
  }

  num _toNum(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v;
    return num.tryParse(v.toString().replaceAll('.', '').replaceAll(',', '')) ?? 0;
  }

  num get tongChi {
    final num tongChinh = costKeys.fold<num>(
      0,
          (sum, k) => sum + _toNum(data[k]),
    );

    return tongChinh + tongChiPhiKhac;
  }


  num get tongThu => data["Doanh thu"] ?? 0;
  num get loiNhuan => tongThu - tongChi;

  // =============================
  // INPUT CHI PHÍ CHÍNH
  // =============================
  Widget buildInput(String key) {
    final ctrl = TextEditingController(text: money(data[key]));
    final focus = FocusNode();

    void commit() {
      final raw = ctrl.text.replaceAll('.', '');
      data[key] = num.tryParse(raw) ?? 0;
      ctrl.text = money(data[key]);
      setState(() {});
    }

    focus.addListener(() {
      if (!focus.hasFocus) commit();
    });

    return TextField(
      controller: ctrl,
      focusNode: focus,
      keyboardType: TextInputType.number,
      textAlign: TextAlign.right,
      inputFormatters: [ThousandsSeparatorInputFormatter()],
      decoration: InputDecoration(
        labelText: key,
        border: const OutlineInputBorder(),
        isDense: true,
      ),
      onSubmitted: (_) => commit(),
    );
  }

  // =============================
  // CHI PHÍ CHÍNH (6 INPUT / DÒNG)
  // =============================
  Widget buildChiPhiChinh() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Chi phí nhà xe",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 12),

        ...List.generate(
          (costKeys.length / 6).ceil(),
              (row) {
            final i = row * 6;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: List.generate(6, (j) {
                  if (i + j >= costKeys.length) {
                    return const Expanded(child: SizedBox());
                  }
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: buildInput(costKeys[i + j]),
                    ),
                  );
                }),
              ),
            );
          },
        ),
      ],
    );
  }

  // =============================
  // BẢNG CHI PHÍ KHÁC
  // =============================
  Widget buildChiPhiKhacTable() {
    void addRow() {
      setState(() {
        chiPhiKhac.add({
          "ten": "",
          "don_gia": 0,
          "so_luong": 1,
          "don_vi": "",
          "tong_tien": 0,
          "vat": 0,
          "thanh_tien": 0,
        });
      });
    }

    void removeRow(int i) {
      setState(() => chiPhiKhac.removeAt(i));
    }

    void recalc(Map<String, dynamic> r) {
      final dg = r["don_gia"] ?? 0;
      final sl = r["so_luong"] ?? 0;
      final vat = r["vat"] ?? 0;
      r["tong_tien"] = dg * sl;
      r["thanh_tien"] = r["tong_tien"] * (1 + vat / 100);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [

        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            dataRowMinHeight: 32,
            dataRowMaxHeight: 36,
            headingRowHeight: 34,
            columnSpacing: 12,
            horizontalMargin: 8,
            border: TableBorder.all(color: Colors.grey.shade300, width: 0.8),
            columns: [
              const DataColumn(label: Text("Tên chi phí")),
              const DataColumn(label: Text("Đơn giá")),
              const DataColumn(label: Text("SL")),
              const DataColumn(label: Text("ĐVT")),
              const DataColumn(label: Text("Tổng")),
              const DataColumn(label: Text("VAT %")),
              const DataColumn(label: Text("Thành tiền")),
              DataColumn(
                label: InkWell(
                  onTap: addRow, // 👈 hàm thêm dòng
                  child: const Icon(
                    Icons.add_circle_outline,
                    size: 20,
                    color: Colors.blueAccent,
                  ),
                ),
              ),
            ],
            rows: List.generate(chiPhiKhac.length, (i) {
              final r = chiPhiKhac[i];
              recalc(r);

              return DataRow(
                cells: [
                  // Tên chi phí
                  DataCell(
                    Padding(
                      padding: const EdgeInsets.all(2),
                      child: SizedBox(
                        width: 140,
                        child: _buildChiPhiKhacInput(
                          value: r["ten"],
                          isNumber: false,
                          onCommit: (v) => r["ten"] = v,
                        ),
                      ),
                    ),
                  ),

                  // Đơn giá
                  DataCell(
                    Padding(
                      padding: const EdgeInsets.all(2),
                      child: SizedBox(
                        width: 90,
                        child: _buildChiPhiKhacInput(
                          value: r["don_gia"],
                          onCommit: (v) {
                            r["don_gia"] = v;
                            setState(() {});
                          },
                        ),
                      ),
                    ),
                  ),

                  // Số lượng
                  DataCell(
                    Padding(
                      padding: const EdgeInsets.all(2),
                      child: SizedBox(
                        width: 60,
                        child: _buildChiPhiKhacInput(
                          value: r["so_luong"],
                          onCommit: (v) {
                            r["so_luong"] = v;
                            setState(() {});
                          },
                        ),
                      ),
                    ),
                  ),

                  // Đơn vị tính
                  DataCell(
                    Padding(
                      padding: const EdgeInsets.all(2),
                      child: SizedBox(
                        width: 60,
                        child: _buildChiPhiKhacInput(
                          value: r["don_vi"],
                          isNumber: false,
                          onCommit: (v) => r["don_vi"] = v,
                        ),
                      ),
                    ),
                  ),

                  // Tổng (readonly)
                  DataCell(
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          money(r["tong_tien"]),
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                    ),
                  ),

                  // VAT
                  DataCell(
                    Padding(
                      padding: const EdgeInsets.all(2),
                      child: SizedBox(
                        width: 60,
                        child: _buildChiPhiKhacInput(
                          value: r["vat"],
                          onCommit: (v) {
                            r["vat"] = v;
                            setState(() {});
                          },
                        ),
                      ),
                    ),
                  ),

                  // Thành tiền (readonly)
                  DataCell(
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: Text(
                          money(r["thanh_tien"]),
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ),

                  // Xoá dòng
                  DataCell(
                    IconButton(
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      icon: const Icon(
                        Icons.delete_outline,
                        size: 18,
                        color: Colors.redAccent,
                      ),
                      onPressed: () => removeRow(i),
                    ),
                  ),
                ],
              );
            }),
          ),
        ),

        const SizedBox(height: 8),
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            "Tổng chi phí khác: ${money(tongChiPhiKhac)} ₫",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
  // =============================
  // SUMMARY
  // =============================
  Widget buildSummary() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("TỔNG KẾT",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          buildInput("Doanh thu"),
          const SizedBox(height: 12),

          Text("Tổng chi: ${money(tongChi)} ₫",
              style:
              const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),

          const Divider(height: 24),

          Text(
            "Lợi nhuận: ${money(loiNhuan)} ₫",
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: loiNhuan >= 0 ? Colors.green : Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _save() async {
    setState(() => updating = true);

    // =========================
    // 1️⃣ CẬP NHẬT TỔNG
    // =========================
    data["Tổng chi"] = tongChi;
    data["Lợi nhuận"] = tongThu - tongChi;

    // =========================
    // 2️⃣ LƯU BẢNG CHI PHÍ KHÁC
    // =========================
    data["Chi phí khác"] = chiPhiKhac.map((e) {
      return {
        "ten": e["ten"] ?? "",
        "don_gia": e["don_gia"] ?? 0,
        "so_luong": e["so_luong"] ?? 0,
        "don_vi": e["don_vi"] ?? "",
        "tong_tien": e["tong_tien"] ?? 0,
        "vat": e["vat"] ?? 0,
        "thanh_tien": e["thanh_tien"] ?? 0,
      };
    }).toList();

    // =========================
    // 3️⃣ GỌI CONTROLLER
    // =========================
    final controller = Get.find<DoanhThuChuyenXeController>();

    final ok = await controller.capNhatDoanhThuXe(
      nid: int.parse(widget.payload["nid"].toString()),
      thongTinJson: data,
    );

    setState(() => updating = false);

    // =========================
    // 4️⃣ ĐÓNG FORM
    // =========================
    if (ok) {
      Navigator.pop(context, true);
    }
  }

  // =============================
  // BUILD
  // =============================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
        title: Text("Cập nhật doanh thu – ${widget.payload["xe"]}"),
        actions: [
          ElevatedButton.icon(
            onPressed: updating ? null : _save,
            icon: updating
                ? const SizedBox(
              width: 18,
              height: 18,
              child: CircularProgressIndicator(
                  strokeWidth: 2, color: Colors.white),
            )
                : const Icon(Icons.save),
            label: Text(updating ? "Đang lưu..." : "Lưu"),
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 7,
              child: ListView(
                children: [
                  buildChiPhiChinh(),
                  const SizedBox(height: 24),
                  buildChiPhiKhacTable(),
                ],
              ),
            ),
            const SizedBox(width: 20),
            Expanded(flex: 3, child: buildSummary()),
          ],
        ),
      ),
    );
  }

  Widget _buildChiPhiKhacInput({
    required dynamic value,
    required Function(dynamic) onCommit,
    bool isNumber = true,
  }) {
    final ctrl = TextEditingController(
      text: isNumber ? money(value) : value?.toString(),
    );
    final focusNode = FocusNode();

    void commit() {
      final raw = ctrl.text.replaceAll('.', '').replaceAll(',', '');
      final v = isNumber ? num.tryParse(raw) ?? 0 : ctrl.text;
      onCommit(v);
    }

    focusNode.addListener(() {
      if (!focusNode.hasFocus) commit();
    });

    return TextField(
      controller: ctrl,
      focusNode: focusNode,
      keyboardType: isNumber ? TextInputType.number : TextInputType.text,
      textAlign: isNumber ? TextAlign.right : TextAlign.left,
      inputFormatters: isNumber ? [ThousandsSeparatorInputFormatter()] : [],
      style: const TextStyle(fontSize: 13),
      decoration: const InputDecoration(
        isDense: true,
        contentPadding: EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        border: OutlineInputBorder(borderSide: BorderSide.none),
      ),
      onSubmitted: (_) => commit(),
    );
  }

}

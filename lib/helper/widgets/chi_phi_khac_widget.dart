import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:kho555/widgets/thousands_separator_input_formatter.dart';

class ChiPhiKhacWidget extends StatefulWidget {
  /// Dữ liệu khởi tạo (từ chuyến xe)
  final List<Map<String, dynamic>>? initialList;

  /// Callback khi tổng chi phí thay đổi
  final ValueChanged<double>? onTotalChanged;

  /// Callback khi danh sách thay đổi (để đồng bộ controller)
  final ValueChanged<List<Map<String, dynamic>>>? onListChanged;

  const ChiPhiKhacWidget({
    super.key,
    this.initialList,
    this.onTotalChanged,
    this.onListChanged,
  });

  @override
  State<ChiPhiKhacWidget> createState() => _ChiPhiKhacWidgetState();
}

class _ChiPhiKhacWidgetState extends State<ChiPhiKhacWidget> {
  final _formatCurrency = NumberFormat('#,##0', 'vi_VN');
  final ScrollController _scrollController = ScrollController();

  /// Danh sách chi phí
  List<Map<String, dynamic>> chiPhiList = [];

  /// Controllers cho từng cột
  final List<TextEditingController> _tenControllers = [];
  final List<TextEditingController> _donGiaControllers = [];
  final List<TextEditingController> _soLuongControllers = [];
  final List<TextEditingController> _vatControllers = [];

  /// FocusNodes để tính lại khi mất focus
  final List<FocusNode> _donGiaFocusNodes = [];
  final List<FocusNode> _soLuongFocusNodes = [];
  final List<FocusNode> _vatFocusNodes = [];

  @override
  void initState() {
    super.initState();

    // ✅ Nạp dữ liệu ban đầu
    if (widget.initialList != null && widget.initialList!.isNotEmpty) {
      for (var item in widget.initialList!) {
        _addRow({
          "ten": item["ten"] ?? "",
          "donGia": item["donGia"] ?? "",
          "soLuong": item["soLuong"] ?? 1,
          "vat": item["vat"] ?? 0,
        });
      }
    }
  }

  /// 🟢 Thêm dòng mới
  void _addRow(Map<String, dynamic> data) {
    final row = {
      "ten": data["ten"] ?? "",
      "donGia": double.tryParse(data["donGia"].toString()) ?? "",
      "soLuong": double.tryParse(data["soLuong"].toString()) ?? 1,
      "vat": double.tryParse(data["vat"].toString()) ?? 0,
      "tong": 0.0,
      "sauVat": 0.0,
    };

    chiPhiList.add(row);

    _tenControllers.add(TextEditingController(text: row["ten"]));
    _donGiaControllers.add(TextEditingController(text: row["donGia"].toString()));
    _soLuongControllers.add(TextEditingController(text: row["soLuong"].toString()));
    _vatControllers.add(TextEditingController(text: row["vat"].toString()));

    final donGiaNode = FocusNode();
    final soLuongNode = FocusNode();
    final vatNode = FocusNode();

    final index = chiPhiList.length - 1;
    donGiaNode.addListener(() {
      if (!donGiaNode.hasFocus) _recalculate(index);
    });
    soLuongNode.addListener(() {
      if (!soLuongNode.hasFocus) _recalculate(index);
    });
    vatNode.addListener(() {
      if (!vatNode.hasFocus) _recalculate(index);
    });

    _donGiaFocusNodes.add(donGiaNode);
    _soLuongFocusNodes.add(soLuongNode);
    _vatFocusNodes.add(vatNode);

    _recalculate(index);
    setState(() {});
  }

  /// ❌ Xóa dòng
  void _removeRow(int index) {
    chiPhiList.removeAt(index);
    _tenControllers.removeAt(index);
    _donGiaControllers.removeAt(index);
    _soLuongControllers.removeAt(index);
    _vatControllers.removeAt(index);
    _donGiaFocusNodes.removeAt(index);
    _soLuongFocusNodes.removeAt(index);
    _vatFocusNodes.removeAt(index);

    _notifyChanged();
    setState(() {});
  }

  /// 🔹 Tính toán Tổng tiền và Sau VAT cho 1 dòng
  void _recalculate(int index) {
    double parseVN(String value) {
      return double.tryParse(value.replaceAll('.', '').replaceAll(',', '.')) ?? 0;
    }

    final item = chiPhiList[index];
    final donGia = parseVN(_donGiaControllers[index].text);
    final soLuong = parseVN(_soLuongControllers[index].text);
    final vat = parseVN(_vatControllers[index].text);

    final tong = donGia * soLuong;
    final sauVat = tong + (tong * vat / 100);

    item["tong"] = tong; //_formatCurrency.format(tong);
    item["sauVat"] = sauVat; //_formatCurrency.format();
    item["soLuong"] = soLuong; //_formatCurrency.format();
    item["donGia"] = donGia; //_formatCurrency.format();
    item["vat"] = vat; //_formatCurrency.format();


    _notifyChanged();
    setState(() {});
  }

  /// 🧮 Gửi dữ liệu và tổng tiền ra ngoài
  void _notifyChanged() {
    // Tổng tiền sau VAT
    double sum = 0;
    for (var item in chiPhiList) {
      final value = double.tryParse(
        item["sauVat"].toString().replaceAll('.', '').replaceAll(',', '.'),
      ) ?? 0;
      sum += value;
    }

    widget.onTotalChanged?.call(sum);
    widget.onListChanged?.call(List<Map<String, dynamic>>.from(chiPhiList));
  }

  /// 🖱️ Cho phép kéo bảng ngang
  void _onHorizontalDrag(DragUpdateDetails details) {
    _scrollController.jumpTo(
      (_scrollController.offset - details.primaryDelta!).clamp(
        _scrollController.position.minScrollExtent,
        _scrollController.position.maxScrollExtent,
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    for (final c in [
      ..._tenControllers,
      ..._donGiaControllers,
      ..._soLuongControllers,
      ..._vatControllers
    ]) {
      c.dispose();
    }
    for (final f in [
      ..._donGiaFocusNodes,
      ..._soLuongFocusNodes,
      ..._vatFocusNodes
    ]) {
      f.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.attach_money, color: Colors.green, size: 16),
            SizedBox(width: 4),
            Text(
              "Chi phí khác",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
          ],
        ),
        const SizedBox(height: 6),

        // ✅ Bảng chi phí
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
          ),
          child: GestureDetector(
            onHorizontalDragUpdate: _onHorizontalDrag,
            child: SingleChildScrollView(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              child: DataTable(
                columnSpacing: 12,
                columns: const [
                  DataColumn(label: Text("Tên chi phí")),
                  DataColumn(label: Text("Đơn giá")),
                  DataColumn(label: Text("Số lượng")),
                  DataColumn(label: Text("Tổng tiền")),
                  DataColumn(label: Text("VAT (%)")),
                  DataColumn(label: Text("TT sau VAT")),
                  DataColumn(label: Text("Xóa")),
                ],
                rows: List.generate(chiPhiList.length, (index) {
                  final item = chiPhiList[index];
                  return DataRow(cells: [
                    // 🔹 Tên chi phí
                    DataCell(SizedBox(
                      width: 160,
                      child: TextField(
                        controller: _tenControllers[index],
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                        ),
                        onChanged: (v) {
                          item["ten"] = v;
                          _notifyChanged();
                        },
                      ),
                    )),

                    // 🔹 Đơn giá
                    DataCell(SizedBox(
                      width: 110,
                      child: TextField(
                        textAlign: TextAlign.right,
                        controller: _donGiaControllers[index],
                        focusNode: _donGiaFocusNodes[index],
                        keyboardType: TextInputType.number,
                        inputFormatters: [ThousandsSeparatorInputFormatter()],
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                          suffixText: " ₫",
                        ),
                      ),
                    )),

                    // 🔹 Số lượng
                    DataCell(SizedBox(
                      width: 80,
                      child: TextField(
                        textAlign: TextAlign.center,
                        controller: _soLuongControllers[index],
                        focusNode: _soLuongFocusNodes[index],
                        keyboardType: TextInputType.number,
                        inputFormatters: [ThousandsSeparatorInputFormatter()],
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    )),

                    // 🔹 Tổng tiền (readonly)
                    DataCell(SizedBox(
                      width: 110,
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: Text(_formatCurrency.format(item["tong"])),
                      ),
                    )),

                    // 🔹 VAT (%)
                    DataCell(SizedBox(
                      width: 70,
                      child: TextField(
                        textAlign: TextAlign.center,
                        controller: _vatControllers[index],
                        focusNode: _vatFocusNodes[index],
                        keyboardType: TextInputType.number,
                        inputFormatters: [ThousandsSeparatorInputFormatter()],
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    )),

                    // 🔹 TT sau VAT (readonly)
                    DataCell(SizedBox(
                      width: 110,
                      child: Align(
                        alignment: Alignment.centerRight,
                        child: Text(_formatCurrency.format(item["sauVat"])),
                      ),
                    )),

                    // 🔹 Xóa
                    DataCell(SizedBox(
                      width: 50,
                      child: IconButton(
                        icon: const Icon(Icons.delete, size: 20, color: Colors.redAccent),
                        onPressed: () => _removeRow(index),
                      ),
                    )),
                  ]);
                }),
              ),
            ),
          ),
        ),

        const SizedBox(height: 6),

        // 🔹 Nút thêm dòng
        TextButton.icon(
          onPressed: () => _addRow({}),
          icon: const Icon(Icons.add, size: 18),
          label: const Text("Thêm chi phí khác"),
        ),
      ],
    );
  }
}

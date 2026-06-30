import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:amount_input_formatter/amount_input_formatter.dart';

class PhiLuuCaTable extends StatefulWidget {
  final Map<String, dynamic> customer;
  final GlobalKey<PhiLuuCaTableState> key;

  const PhiLuuCaTable({required this.customer, required this.key})
      : super(key: key);

  @override
  State<PhiLuuCaTable> createState() => PhiLuuCaTableState();
}

class PhiLuuCaTableState extends State<PhiLuuCaTable> {
  late List<Map<String, dynamic>> data; // mỗi phần tử = 1 ngày

  @override
  void initState() {
    super.initState();
    final rawJson = widget.customer['field_phi_luu_ca'] ?? '[]';
    data = List<Map<String, dynamic>>.from(jsonDecode(rawJson));
  }

  String toJson() => jsonEncode(data);

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,###", "vi_VN");

    if (data.isEmpty) {
      return const Center(child: Text("Không có dữ liệu phí lưu ca"));
    }

    // lấy tất cả loại xe từ keys
    final Set<String> loaiXeSet = {};
    for (var dayData in data) {
      loaiXeSet.addAll(dayData.keys);
    }
    final loaiXeList = loaiXeSet.toList();

    // tạo cột: Ngày 1, Ngày 2, ...
    final columns = [
      const DataColumn(label: Text("Loại xe")),
      ...List.generate(
        data.length,
            (i) => DataColumn(
          label: Text("Ngày ${i + 1}",
              style: const TextStyle(fontWeight: FontWeight.bold)),
        ),
      ),
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        border: TableBorder.all(color: Colors.grey.shade300, width: 1),
        headingRowColor: MaterialStateProperty.all(Colors.grey.shade100),
        columns: columns,
        rows: loaiXeList.map((xe) {
          return DataRow(
            cells: [
              DataCell(Text(xe)), // cột loại xe
              ...List.generate(data.length, (dayIndex) {
                final rawValue = data[dayIndex][xe]?.toString() ?? "";
                final initialText =
                rawValue.isNotEmpty && int.tryParse(rawValue) != null
                    ? formatter.format(int.parse(rawValue))
                    : rawValue;

                final controller = TextEditingController(text: initialText);

                return DataCell(
                  TextFormField(
                    controller: controller,
                    onChanged: (val) {
                      final numeric = val.replaceAll('.', '');
                      data[dayIndex][xe] = numeric;
                    },
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                      AmountInputFormatter(
                        fractionalDigits: 0,
                        groupSeparator: NumberFormatter.kDot,
                        decimalSeparator: NumberFormatter.kComma,
                      ),
                    ],
                    textAlign: TextAlign.right,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.black),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      isDense: true,
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 6, horizontal: 6),
                    ),
                  ),
                );
              }),
            ],
          );
        }).toList(),
      ),
    );
  }
}

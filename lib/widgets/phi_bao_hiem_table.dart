import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:amount_input_formatter/amount_input_formatter.dart';
import 'package:intl/intl.dart';

class PhiBaoHiemTable extends StatefulWidget {
  final Map<String, dynamic> customer;
  final GlobalKey<PhiBaoHiemTableState> key;

  const PhiBaoHiemTable({required this.customer, required this.key})
      : super(key: key);

  @override
  State<PhiBaoHiemTable> createState() => PhiBaoHiemTableState();
}

class PhiBaoHiemTableState extends State<PhiBaoHiemTable> {
  late List<Map<String, dynamic>> data;
  final formatter = NumberFormat("#,###", "vi_VN");

  @override
  void initState() {
    super.initState();
    final rawJson = widget.customer['field_phi_bao_hiem'] ?? '[]';
    data = List<Map<String, dynamic>>.from(jsonDecode(rawJson));
  }

  String toJson() => jsonEncode(data);

  @override
  Widget build(BuildContext context) {
    final excludedKeys = [
      "1.5 - 2.4 tấn _ 3.5*1.67*1.7 (9 CBM)",
      "3.5 tấn _ 5.2*2.1*2.4 (25 CBM)",
      "7.0 tấn _ 6.2*2.1*2.1 (27 CBM)",
      "8.0 tấn 7.6M _ 7.6*2.4*2.2 (40 CBM)",
      "10 tấn _ 8.3*2.36*2.2 (43 CBM)",
      "8.0 tấn Thùng kín _ 9.6*2.38*2.6 (58 CBM)",
      "8.0 tấn Thùng bạt _ 9.6*2.38*2.6 (58 CBM)",
      "15 tấn Thùng bạt _ 9.6*2.38*2.6 (58 CBM)",
      "18 tấn Thùng bạt _ 9.6*2.38*2.6 (58 CBM)",
      "40/45HQ _ 13.5*2.38*2.6 (70 CBM)",
      "Sàn/Rào _ 14.5-16.8*2.38*2.6 (80-100 CBM)",
      "FOOC 15M _ 15*3*3",
      "FOOC 18M _ 18*3*3",
      "FOOC 18M _ 18*3.3*3.3",
    ];

    final columns = data.isNotEmpty
        ? data.first.keys.where((k) => !excludedKeys.contains(k)).toList()
        : [];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        border: TableBorder.all(color: Colors.grey.shade300, width: 1),
        headingRowColor: MaterialStateProperty.all(Colors.grey.shade100),
        columns: columns
            .map((c) => DataColumn(
          label: Text(
            c == 'loaiXe' ? 'Loại xe' : c,
            style: const TextStyle(
                fontWeight: FontWeight.bold, color: Colors.black),
          ),
        ))
            .toList(),
        rows: List.generate(data.length, (rowIndex) {
          final row = data[rowIndex];
          return DataRow(
            cells: columns.map((c) {
              if (c == "loaiXe") {
                return DataCell(Text(row[c]?.toString() ?? ""));
              }

              final rawValue = row[c]?.toString() ?? "";
              final initialText = rawValue.isNotEmpty &&
                  int.tryParse(rawValue) != null
                  ? formatter.format(int.parse(rawValue))
                  : rawValue;
              final controller = TextEditingController(text: initialText);

              return DataCell(
                TextFormField(
                  controller: controller,
                  onChanged: (val) {
                    final numeric = val.replaceAll('.', '');
                    // update state data
                    data[rowIndex][c] = numeric;
                    // update vào customer để đồng bộ
                    widget.customer['field_phi_bao_hiem'] = jsonEncode(data);
                  },
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
                    AmountInputFormatter(
                        fractionalDigits: 0,
                        groupSeparator: NumberFormatter.kDot,
                        decimalSeparator: NumberFormatter.kComma)
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
            }).toList(),
          );
        }),
      ),
    );
  }
}

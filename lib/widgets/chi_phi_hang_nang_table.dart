import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:amount_input_formatter/amount_input_formatter.dart';

class ChiPhiHangNangTable extends StatefulWidget {
  final Map<String, dynamic> customer;
  final GlobalKey<ChiPhiHangNangTableState> key;

  const ChiPhiHangNangTable({
    required this.customer,
    required this.key,
  }) : super(key: key);

  @override
  State<ChiPhiHangNangTable> createState() =>
      ChiPhiHangNangTableState();
}

class ChiPhiHangNangTableState
    extends State<ChiPhiHangNangTable> {
  late List<Map<String, dynamic>> data;
  Map<String, dynamic>? config; // chứa {min, max, dvt}
  String fixToJson(String raw) {
    // thêm dấu nháy cho key
    raw = raw.replaceAllMapped(RegExp(r'(\w+):'), (m) => '"${m[1]}":');
    // thêm dấu nháy cho value dạng text (không phải số)
    raw = raw.replaceAllMapped(RegExp(r': ([^,\}\]]+)([,}\]])'), (m) {
      final val = m[1]!.trim();
      if (int.tryParse(val) != null) return ': $val${m[2]}'; // số -> giữ nguyên
      return ': "$val"${m[2]}';
    });
    return raw;
  }

  @override
  void initState() {
    super.initState();
    final rawJson = widget.customer['field_phi_hang_nang'] ?? '[]';
    final fixedJson = fixToJson(rawJson);
    print("fixedJson $fixedJson"); // sẽ thành JSON hợp lệ
    final parsed = jsonDecode(fixedJson);
    print('rawJson ${rawJson}');
    // final List<dynamic> parsed = jsonDecode(rawJson);

    // Tách phần dữ liệu loại xe và phần config
    data = [];
    for (var item in parsed) {
      if (item is Map && item.containsKey("key_vi")) {
        data.add(Map<String, dynamic>.from(item));
      }
    }
  }

  String toJson() {
    final list = [...data];
    if (config != null) list.add(config!);
    return jsonEncode(list);
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,###", "vi_VN");

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            border: TableBorder.all(color: Colors.grey.shade300, width: 1),
            headingRowColor:
            MaterialStateProperty.all(Colors.grey.shade100),
            columns: const [
              DataColumn(
                label: Text(
                  "Loại xe",
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.black),
                ),
              ),
              DataColumn(
                label: Text(
                  "Giá trị",
                  style: TextStyle(
                      fontWeight: FontWeight.bold, color: Colors.black),
                ),
              ),
            ],
            rows: data.map((row) {
              final rawValue = row['value']?.toString() ?? "";
              final initialText =
              rawValue.isNotEmpty && int.tryParse(rawValue) != null
                  ? formatter.format(int.parse(rawValue))
                  : rawValue;

              final controller =
              TextEditingController(text: initialText);

              return DataRow(
                cells: [
                  DataCell(Text(row['key_vi'] ?? "")),
                  DataCell(
                    TextFormField(
                      controller: controller,
                      onChanged: (val) {
                        final numeric = val.replaceAll('.', '');
                        row['value'] = numeric;
                      },
                      inputFormatters: [
                        FilteringTextInputFormatter.allow(
                            RegExp(r'[0-9.]')),
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
                  ),
                ],
              );
            }).toList(),
          ),
        ),

        const SizedBox(height: 16),
      ],
    );
  }
}

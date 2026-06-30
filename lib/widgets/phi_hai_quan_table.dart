import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:amount_input_formatter/amount_input_formatter.dart';

class PhiHaiQuanTable extends StatefulWidget {
  final Map<String, dynamic> customer;
  @override
  final GlobalKey<PhiHaiQuanTableState> key;

  const PhiHaiQuanTable({
    required this.customer,
    required this.key,
  }) : super(key: key);

  @override
  State<PhiHaiQuanTable> createState() => PhiHaiQuanTableState();
}

class PhiHaiQuanTableState extends State<PhiHaiQuanTable> {
  late List<Map<String, dynamic>> cuaKhauList;
  String? selectedCuaKhau;
  Map<String, List<Map<String, dynamic>>> dataByCuaKhau = {};
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    final rawJson = widget.customer['field_phi_hai_quan'] ?? '[]';
    final List<dynamic> parsed = jsonDecode(rawJson);

    cuaKhauList = List<Map<String, dynamic>>.from(parsed);

    for (var ck in cuaKhauList) {
      final title = ck['title']?.toString() ?? '';
      final List<dynamic> rawData = ck['data'] ?? [];
      final dataList = rawData
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
      dataByCuaKhau[title] = dataList;
    }

    if (cuaKhauList.isNotEmpty) {
      selectedCuaKhau = cuaKhauList.first['title'];
    }
  }

  String toJson() {
    final list = cuaKhauList.map((ck) {
      return {
        "title": ck['title'],
        "data": dataByCuaKhau[ck['title']] ?? [],
      };
    }).toList();
    return jsonEncode(list);
  }

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,###", "vi_VN");
    final data = dataByCuaKhau[selectedCuaKhau] ?? [];

    if (data.isEmpty) {
      return const Text("Không có dữ liệu");
    }

    // Các cột loại xe
    final xeList = <String>{
      for (var row in data) ...row.keys.where((k) => k != "label" && k != "key")
    }.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Dropdown chọn cửa khẩu
        DropdownButton<String>(
          value: selectedCuaKhau,
          dropdownColor: Colors.white,
          items: cuaKhauList.map((ck) {
            final title = ck['title'] ?? '';
            return DropdownMenuItem<String>(
              value: title,
              child: Text(title),
            );
          }).toList(),
          onChanged: (val) {
            setState(() {
              selectedCuaKhau = val;
            });
          },
        ),
        const SizedBox(height: 16),

        // Bảng dữ liệu có thể kéo ngang + dọc
        Expanded(
          child: GestureDetector(
            onHorizontalDragUpdate: (details) {
              _scrollController.jumpTo(
                _scrollController.offset - details.delta.dx,
              );
            },
            child: SingleChildScrollView(
              controller: _scrollController,
              scrollDirection: Axis.horizontal,
              child: SingleChildScrollView(
                scrollDirection: Axis.vertical,
                child: DataTable(
                  columnSpacing: 12,
                  border: TableBorder.all(color: Colors.grey.shade300, width: 1),
                  headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
                  columns: [
                    const DataColumn(
                      label: Text(
                        "Dịch vụ",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    ...xeList.map((c) => DataColumn(
                      label: Tooltip(
                        message: c,
                        child: Text(
                          c.length > 10 ? "${c.substring(0, 10)}..." : c,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                    )),
                  ],
                  rows: List.generate(data.length, (i) {
                    final row = data[i];
                    return DataRow(
                      cells: [
                        // Dịch vụ (label) - chỉ đọc
                        DataCell(Text(row['label'] ?? "")),

                        // Các loại xe
                        ...xeList.map((xe) {
                          final rawValue = row[xe]?.toString() ?? '';
                          final initialText =
                          rawValue.isNotEmpty && int.tryParse(rawValue) != null
                              ? formatter.format(int.parse(rawValue))
                              : rawValue;

                          final controller = TextEditingController(text: initialText);

                          return DataCell(
                            SizedBox(
                              width: 90,
                              child: TextFormField(
                                controller: controller,
                                onChanged: (val) {
                                  final numeric = val.replaceAll('.', '');
                                  row[xe] = numeric;
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
                                decoration: const InputDecoration(
                                  isDense: true,
                                  border: OutlineInputBorder(),
                                  contentPadding:
                                  EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                                ),
                              ),
                            ),
                          );
                        }),
                      ],
                    );
                  }),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:amount_input_formatter/amount_input_formatter.dart';

class PhiVanTaiTable extends StatefulWidget {
  final Map<String, dynamic> customer;
  final GlobalKey<PhiVanTaiTableState> key;

  const PhiVanTaiTable({
    required this.customer,
    required this.key,
  }) : super(key: key);

  @override
  State<PhiVanTaiTable> createState() => PhiVanTaiTableState();
}

class PhiVanTaiTableState extends State<PhiVanTaiTable> {
  late List<Map<String, dynamic>> allData;
  String? selectedDiemDi;
  late List<String> xeList;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    final rawJson = widget.customer['field_cuoc_van_tai'] ?? '[]';
    allData = List<Map<String, dynamic>>.from(jsonDecode(rawJson));

    // Lấy danh sách loại xe
    if (allData.isNotEmpty) {
      xeList = allData.first.keys
          .where((k) => !['diem_di', 'diem_den_cu', 'diem_den_moi', 'label'].contains(k))
          .toList();
    } else {
      xeList = [];
    }

    // Mặc định chọn cửa khẩu đầu tiên
    if (allData.isNotEmpty) {
      selectedDiemDi = allData.first['diem_di'];
    }
  }

  String toJson() => jsonEncode(allData);

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,###", "vi_VN");

    // Lấy danh sách cửa khẩu
    final diemDiList = allData.map((e) => e['diem_di'] as String).toSet().toList();

    // Lọc dữ liệu theo cửa khẩu đã chọn
    final data = allData.where((e) => e['diem_di'] == selectedDiemDi).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Dropdown chọn cửa khẩu
        DropdownButton<String>(
          value: selectedDiemDi,
          dropdownColor: Colors.white,
          items: diemDiList.map((d) {
            return DropdownMenuItem(
              value: d,
              child: Text(d),
            );
          }).toList(),
          onChanged: (val) {
            setState(() {
              selectedDiemDi = val;
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
                  headingRowColor: MaterialStateProperty.all(Colors.grey.shade100),
                  columns: [
                    const DataColumn(
                      label: Text(
                        "Dịch vụ",
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    ...xeList.map(
                          (c) => DataColumn(
                        label: Tooltip(
                          message: c,
                          child: Text(
                            c.length > 10 ? "${c.substring(0, 10)}..." : c,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ),
                  ],
                  rows: List.generate(data.length, (i) {
                    final row = data[i];
                    return DataRow(
                      cells: [
                        // Cột dịch vụ (chỉ đọc)
                        DataCell(Text("${row['diem_den_moi']}")),

                        // Các cột loại xe
                        ...xeList.map((xe) {
                          final rawValue = row[xe]?.toString() ?? '';
                          final initialText = rawValue.isNotEmpty && int.tryParse(rawValue) != null
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
                                  contentPadding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
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

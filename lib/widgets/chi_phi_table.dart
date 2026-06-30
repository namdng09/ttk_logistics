import 'dart:convert';
import 'package:flutter/material.dart';

class ChiPhiTable extends StatelessWidget {
  final String title;
  final dynamic rawData;

  const ChiPhiTable({
    super.key,
    required this.title,
    required this.rawData,
  });

  @override
  Widget build(BuildContext context) {
    List<dynamic> phiData = [];
    try {
      if (rawData is String && rawData.isNotEmpty) {
        phiData = jsonDecode(rawData);
      } else if (rawData is List) {
        phiData = rawData;
      }
    } catch (_) {
      phiData = [];
    }

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 12),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            phiData.isEmpty
                ? const Text("(Chưa có dữ liệu)")
                : SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                border: TableBorder.all(color: Colors.grey.shade300),
                columnSpacing: 16,
                headingRowColor:
                WidgetStateProperty.all(Colors.grey.shade200),
                columns: const [
                  DataColumn(label: Text("Loại xe (VI)")),
                  DataColumn(label: Text("Loại xe (EN)")),
                  DataColumn(label: Text("Giá trị")),
                ],
                rows: phiData.map((e) {
                  return DataRow(
                    cells: [
                      DataCell(Text(e['key_vi'] ?? "")),
                      DataCell(Text(e['key_eng'] ?? "")),
                      DataCell(Text(e['value'].toString())),
                    ],
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

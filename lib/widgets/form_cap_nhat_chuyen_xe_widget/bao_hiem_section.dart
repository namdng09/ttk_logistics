import 'package:ttk_logistics/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class BaoHiemSection extends StatelessWidget {
  final Map<String, TextEditingController> controllers;
  final Map<dynamic, dynamic> data;
  final num total;
  final Function(String key) onCommit;

  const BaoHiemSection({
    super.key,
    required this.controllers,
    required this.data,
    required this.total,
    required this.onCommit,
  });

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,##0", "vi_VN");

    // 🔹 Lọc key — giữ nguyên thứ tự entry trong map gốc
    final entries = data.entries.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        Align(
          alignment: Alignment.centerLeft,
          child: Text(
            "💰 Thông tin chi phí bảo hiểm",
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: Colors.teal.shade700,
            ),
          ),
        ),
        const SizedBox(height: 12),

        // ========================== DANH SÁCH INPUT ==========================
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: entries.map((entry) {
              final key = entry.key.toString();
              final controller = controllers[key]!;

              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: SizedBox(
                  width: 180,
                  child: Focus(
                    onFocusChange: (hasFocus) {
                      if (!hasFocus) {
                        onCommit(key);
                      }
                    },
                    child: TextField(
                      controller: controller,
                      keyboardType: TextInputType.number,
                      inputFormatters: [ThousandsSeparatorInputFormatter()],
                      style: const TextStyle(fontSize: 15, height: 1.0),
                      decoration: InputDecoration(
                        labelText: key,
                        labelStyle: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.teal,
                        ),
                        border: const OutlineInputBorder(),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 15,
                          horizontal: 8,
                        ),
                      ),
                      onEditingComplete: () {
                        FocusScope.of(context).unfocus();
                        onCommit(key);
                      },
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),

        const SizedBox(height: 6),

        // ========================== TỔNG PHÍ ==========================
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            "Tổng phí bảo hiểm: ${formatter.format(total)} ₫",
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.teal,
              fontSize: 15,
            ),
          ),
        ),
      ],
    );
  }
}

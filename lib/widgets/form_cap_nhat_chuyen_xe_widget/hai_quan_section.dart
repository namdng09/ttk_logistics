import 'package:ttk_logistics/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class HaiQuanSection extends StatelessWidget {
  final Map<String, TextEditingController> controllers;
  final Map<dynamic, dynamic> data;
  final num total;
  final Function(String key) onCommit;

  const HaiQuanSection({
    super.key,
    required this.controllers,
    required this.data,
    required this.total,
    required this.onCommit,
  });

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,##0", "vi_VN");
    final items = data.entries.toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),

        Text(
          "💰 Thông tin chi phí hải quan",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 15,
            color: Colors.orange.shade700,
          ),
        ),

        const SizedBox(height: 12),

        // ========================== DANH SÁCH INPUT ==========================
        LayoutBuilder(
          builder: (context, constraints) {
            double spacing = 8;
            double itemWidth = (constraints.maxWidth - 7 * spacing) / 8;

            return Wrap(
              spacing: spacing,
              runSpacing: 20,
              children: items.map((entry) {
                final key = entry.key.toString();
                final controller = controllers[key]!;

                return SizedBox(
                  width: itemWidth,
                  child: Focus(
                    onFocusChange: (hasFocus) {
                      if (!hasFocus) onCommit(key);
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
                          height: 0.8,
                          color: Colors.orange,
                          fontWeight: FontWeight.w600,
                        ),
                        border: const OutlineInputBorder(),
                        isDense: true,
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 14,
                          horizontal: 6,
                        ),
                      ),
                      onEditingComplete: () {
                        FocusScope.of(context).unfocus();
                        onCommit(key);
                      },
                    ),
                  ),
                );
              }).toList(),
            );
          },
        ),

        const SizedBox(height: 6),

        // ========================== TỔNG PHÍ ==========================
        Align(
          alignment: Alignment.centerRight,
          child: Text(
            "Tổng phí hải quan: ${formatter.format(total)} ₫",
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.orange,
            ),
          ),
        ),
      ],
    );
  }
}

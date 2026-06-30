import 'package:ttk_logistics/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class ChiPhiKhacSection extends StatelessWidget {
  final num chiPhiKhacTotal;
  final num traThemDiemTotal;

  final ValueChanged<num> onChiPhiKhacChanged;
  final ValueChanged<num> onTraThemDiemChanged;

  const ChiPhiKhacSection({
    super.key,
    required this.chiPhiKhacTotal,
    required this.traThemDiemTotal,
    required this.onChiPhiKhacChanged,
    required this.onTraThemDiemChanged,
  });

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,##0", "vi_VN");

    final chiPhiKhacCtrl = TextEditingController(
      text: chiPhiKhacTotal > 0 ? formatter.format(chiPhiKhacTotal) : "",
    );

    final traThemDiemCtrl = TextEditingController(
      text: traThemDiemTotal > 0 ? formatter.format(traThemDiemTotal) : "",
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 12),
        const Text(
          "Chi phí khác & trả thêm điểm",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 10),

        Row(
          children: [
            // ================== TRẢ THÊM ĐIỂM ==================
            Expanded(
              child: _buildInput(
                label: "Trả thêm điểm",
                controller: traThemDiemCtrl,
                onChanged: (value) {
                  final cleaned = value.replaceAll(RegExp(r'[^0-9]'), '');
                  onTraThemDiemChanged(num.tryParse(cleaned) ?? 0);
                },
              ),
            ),

            const SizedBox(width: 12),

            // ================== CHI PHÍ KHÁC ==================
            Expanded(
              child: _buildInput(
                label: "Chi phí khác",
                controller: chiPhiKhacCtrl,
                onChanged: (value) {
                  final cleaned = value.replaceAll(RegExp(r'[^0-9]'), '');
                  onChiPhiKhacChanged(num.tryParse(cleaned) ?? 0);
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ========================== INPUT FIELD ==========================
  Widget _buildInput({
    required String label,
    required TextEditingController controller,
    required ValueChanged<String> onChanged,
  }) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      inputFormatters: [ThousandsSeparatorInputFormatter()],
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      ),
      onChanged: onChanged,
    );
  }
}

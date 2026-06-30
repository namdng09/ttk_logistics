import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// 💰 Widget hiển thị 1 dòng chi phí trong bảng tổng hợp
/// - Gồm nhãn và giá trị (căn phải, định dạng tiền tệ)
/// - Có thể in đậm cho dòng tổng tiền
/// - Không có TextField (chỉ đọc)
class MyCostRow extends StatelessWidget {
  final String label;
  final dynamic value;
  final bool bold;
  final String suffixText;
  final EdgeInsetsGeometry padding;
  final Color? color;

  const MyCostRow({
    super.key,
    required this.label,
    required this.value,
    this.bold = false,
    this.suffixText = "đ",
    this.padding = const EdgeInsets.symmetric(vertical: 8),
    this.color,
  });

  /// ✅ Hàm định dạng tiền Việt Nam
  String _formatCurrency(dynamic v) {
    try {
      final num number = v is num ? v : num.tryParse(v.toString()) ?? 0;
      final formatter = NumberFormat("#,##0", "vi_VN");
      return formatter.format(number);
    } catch (_) {
      return v.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: padding,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // 🔹 Label chi phí
          Expanded(
            flex: 5,
            child: Text(
              label,
              style: TextStyle(
                fontWeight: bold ? FontWeight.bold : FontWeight.w600,
                fontSize: 14,
                color: color ?? Colors.black87,
                decoration: TextDecoration.none, // ✅ QUAN TRỌNG
              ),
            ),
          ),

          const SizedBox(width: 12),

          // 🔹 Giá trị căn phải
          Expanded(
            flex: 5,
            child: Text(
              "${_formatCurrency(value)} $suffixText",
              textAlign: TextAlign.right,
              style: TextStyle(
                fontWeight: bold ? FontWeight.bold : FontWeight.normal,
                fontSize: 15,
                color: bold
                    ? Colors.teal.shade700
                    : color ?? Colors.grey.shade900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

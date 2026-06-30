import 'package:ttk_logistics/helper/utils/utils.dart';
import 'package:flutter/material.dart';

class HeaderSection extends StatelessWidget {
  final Map<String, dynamic> data;
  final VoidCallback onBack;

  const HeaderSection({
    super.key,
    required this.data,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // 🔙 Nút quay lại danh sách
        TextButton.icon(
          icon: const Icon(Icons.arrow_back),
          label: const Text("Quay lại danh sách"),
          onPressed: onBack,
        ),

        // 🟩 Trạng thái chuyến xe
        if (data["trang_thai"] != null)
          Container(
            margin: const EdgeInsets.only(left: 8),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Utils.getStatusBackground(data["trang_thai"]),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: Utils.getStatusColor(data["trang_thai"]),
                width: 0.8,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Utils.getStatusIcon(data["trang_thai"]),
                  color: Utils.getStatusColor(data["trang_thai"]),
                  size: 14,
                ),
                const SizedBox(width: 5),
                Text(
                  data["trang_thai"] ?? "-",
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: Utils.getStatusColor(data["trang_thai"]),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

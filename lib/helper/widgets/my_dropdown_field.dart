import 'package:flutter/material.dart';

/// ✅ Widget Dropdown tái sử dụng, hỗ trợ:
/// - Cắt chữ dài bằng ellipsis
/// - Tooltip hiển thị đầy đủ nội dung
/// - Tự động loại bỏ giá trị trùng
/// - Có thể truyền hàm hiển thị tuỳ chỉnh (displayBuilder)
class MyDropdownField extends StatelessWidget {
  final String label;
  final String? value;
  final List<String> options;
  final ValueChanged<String?> onChanged;
  final String Function(String?)? displayBuilder;
  final EdgeInsetsGeometry padding;

  const MyDropdownField({
    super.key,
    required this.label,
    required this.value,
    required this.options,
    required this.onChanged,
    this.displayBuilder,
    this.padding = const EdgeInsets.symmetric(vertical: 6),
  });

  @override
  Widget build(BuildContext context) {
    // ✅ Giữ value hợp lệ trong options
    final safeValue = (value != null && options.contains(value)) ? value : null;

    // ✅ Loại bỏ giá trị trùng để tránh lỗi dropdown
    final uniqueOptions = options.toSet().toList();

    return Padding(
      padding: padding,
      child: LayoutBuilder(
        builder: (context, constraints) {
          return DropdownButtonFormField<String>(
            dropdownColor: Colors.white,
            isExpanded: true, // ✅ full chiều ngang
            initialValue: safeValue,
            onChanged: onChanged,
            items: uniqueOptions.map((opt) {
              final display = displayBuilder != null ? displayBuilder!(opt) : opt;

              return DropdownMenuItem(
                value: opt,
                child: Tooltip(
                  message: display,
                  child: Text(
                    display,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                    style: const TextStyle(fontSize: 14),
                  ),
                ),
              );
            }).toList(),
            decoration: InputDecoration(
              labelText: label,
              border: const OutlineInputBorder(),
              contentPadding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          );
        },
      ),
    );
  }
}

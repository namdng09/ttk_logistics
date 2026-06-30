import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class DatePickerField extends StatefulWidget {
  final String label;
  final String? initialDate;
  final ValueChanged<String?> onDateSelected;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final String hintText;
  final bool readOnly;

  const DatePickerField({
    super.key,
    required this.label,
    required this.onDateSelected,
    this.initialDate,
    this.firstDate,
    this.lastDate,
    this.hintText = "Chưa chọn ngày",
    this.readOnly = false,
  });

  @override
  State<DatePickerField> createState() => _DatePickerFieldState();
}

class _DatePickerFieldState extends State<DatePickerField> {
  late TextEditingController _controller;
  final DateFormat dateFormat = DateFormat('yyyy-MM-dd', 'vi_VN');

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialDate ?? "");
  }

  @override
  void didUpdateWidget(covariant DatePickerField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialDate != widget.initialDate) {
      _controller.text = widget.initialDate ?? "";
    }
  }

  Future<void> _showCustomDatePicker() async {
    // 🔹 Parse giá trị hiện tại (nếu có)
    DateTime tempDate;
    try {
      tempDate = _controller.text.isNotEmpty
          ? dateFormat.parse(_controller.text)
          : DateTime.now();
    } catch (_) {
      tempDate = DateTime.now();
    }

    // 🔹 Dùng post-frame để tránh lỗi context khi build web release
    await Future.delayed(Duration.zero);

    final pickedDate = await showDialog<DateTime?>(
      context: context,
      builder: (ctx) {
        DateTime selected = tempDate;

        return Theme(
          data: Theme.of(ctx).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.teal,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: AlertDialog(
            title: Text(
              widget.label,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            content: SizedBox(
              height: 320,
              width: 420,
              child: CalendarDatePicker(
                initialDate: selected,
                firstDate: widget.firstDate ?? DateTime(2020),
                lastDate: widget.lastDate ?? DateTime(2100),
                onDateChanged: (date) => selected = date,
              ),
            ),
            actionsAlignment: MainAxisAlignment.spaceBetween,
            actions: [
              // 🔹 Nút Xóa ngày
              TextButton.icon(
                icon: const Icon(Icons.delete_outline, size: 18),
                label: const Text("Xóa ngày"),
                onPressed: () => Navigator.pop(ctx, null),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text("HỦY"),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.teal,
                    ),
                    onPressed: () => Navigator.pop(ctx, selected),
                    child: const Text("OK"),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );

    // 🔹 Cập nhật giá trị
    if (!mounted) return;

    if (pickedDate == null) {
      // Người dùng chọn “Xóa ngày” hoặc bấm Cancel
      setState(() => _controller.text = "");
      widget.onDateSelected(null);
    } else {
      final formatted = dateFormat.format(pickedDate);
      setState(() => _controller.text = formatted);
      widget.onDateSelected(formatted);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasValue = _controller.text.isNotEmpty;

    return TextFormField(
      controller: _controller,
      readOnly: true,
      style: TextStyle(color: hasValue ? Colors.black : Colors.grey),
      decoration: InputDecoration(
        labelText: widget.label,
        hintText: widget.hintText,
        border: const OutlineInputBorder(),
        suffixIcon: const Icon(Icons.calendar_today, size: 18),
        contentPadding:
        const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      ),
      onTap: widget.readOnly ? null : _showCustomDatePicker,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

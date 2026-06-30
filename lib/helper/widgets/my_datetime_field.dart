import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class MyDateTimeField extends StatefulWidget {
  final String label;
  final TextEditingController controller;
  final DateFormat? format;
  final ValueChanged<String>? onChanged;
  final EdgeInsetsGeometry padding;
  final bool readOnly;
  final IconData icon;

  const MyDateTimeField({
    super.key,
    required this.label,
    required this.controller,
    this.onChanged,
    this.format,
    this.padding = const EdgeInsets.symmetric(vertical: 6),
    this.readOnly = true,
    this.icon = Icons.calendar_today_outlined,
  });

  @override
  State<MyDateTimeField> createState() => _MyDateTimeFieldState();
}

class _MyDateTimeFieldState extends State<MyDateTimeField> {
  Future<void> _selectDateTime(BuildContext context) async {
    // 🔹 Chọn ngày
    DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.tryParse(widget.controller.text) ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );

    if (pickedDate == null) return;

    // 🔹 Chọn giờ
    TimeOfDay? pickedTime = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );

    if (pickedTime == null) return;

    // 🔹 Gộp ngày & giờ
    final combined = DateTime(
      pickedDate.year,
      pickedDate.month,
      pickedDate.day,
      pickedTime.hour,
      pickedTime.minute,
    );

    final f = widget.format ?? DateFormat("yyyy-MM-dd HH:mm");
    final formatted = f.format(combined);

    setState(() => widget.controller.text = formatted);
    widget.onChanged?.call(formatted);
  }

  /// 🗑️ Xóa giá trị đã chọn
  void _clearDateTime() {
    setState(() {
      widget.controller.clear();
      widget.onChanged?.call('');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: widget.padding,
      child: TextFormField(
        controller: widget.controller,
        readOnly: widget.readOnly,
        decoration: InputDecoration(
          labelText: widget.label,
          border: const OutlineInputBorder(),
          suffixIcon: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // 🔹 Nút xóa chỉ hiện khi có giá trị
              if (widget.controller.text.isNotEmpty)
                IconButton(
                  tooltip: "Xóa ngày giờ",
                  icon: const Icon(Icons.clear, color: Colors.redAccent),
                  onPressed: _clearDateTime,
                ),
              IconButton(
                tooltip: "Chọn ngày & giờ",
                icon: Icon(widget.icon),
                onPressed: () => _selectDateTime(context),
              ),
            ],
          ),
        ),
        onTap: widget.readOnly ? () => _selectDateTime(context) : null,
        onChanged: widget.onChanged,
      ),
    );
  }
}

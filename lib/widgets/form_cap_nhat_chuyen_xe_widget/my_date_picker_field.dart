import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class MyDatePickerField extends StatefulWidget {
  final String label;
  final String? initialDate;
  final Function(String?) onDateSelected;
  final bool readOnly;

  const MyDatePickerField({
    super.key,
    required this.label,
    required this.onDateSelected,
    this.initialDate,
    this.readOnly = true,
  });

  @override
  State<MyDatePickerField> createState() => _MyDatePickerFieldState();
}

class _MyDatePickerFieldState extends State<MyDatePickerField> {
  late TextEditingController _controller;
  final DateFormat _format = DateFormat("yyyy-MM-dd");

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialDate ?? "");
  }

  Future<void> _pickDate() async {
    DateTime initial = DateTime.now();
    try {
      if (_controller.text.isNotEmpty) {
        initial = _format.parse(_controller.text);
      }
    } catch (_) {}

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(2020),
      lastDate: DateTime(2035),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Colors.teal,
              onPrimary: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      final formatted = _format.format(picked);
      _controller.text = formatted;
      widget.onDateSelected(formatted);
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      readOnly: widget.readOnly,
      decoration: InputDecoration(
        labelText: widget.label,
        border: const OutlineInputBorder(),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          vertical: 14,
          horizontal: 10,
        ),
        suffixIcon: const Icon(Icons.calendar_month),
      ),
      onTap: widget.readOnly ? _pickDate : null,
    );
  }
}

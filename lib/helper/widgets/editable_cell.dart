import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:amount_input_formatter/amount_input_formatter.dart';

class EditableCell extends StatefulWidget {
  final String initialValue;
  final ValueChanged<String> onChanged;
  final bool isNumeric;

  const EditableCell({
    super.key,
    required this.initialValue,
    required this.onChanged,
    this.isNumeric = false,
  });

  @override
  State<EditableCell> createState() => _EditableCellState();
}

class _EditableCellState extends State<EditableCell> {
  late TextEditingController _controller;
  bool _isEditing = false;

  @override
  void initState() {
    _controller = TextEditingController(text: widget.initialValue);
    super.initState();
  }

  @override
  void didUpdateWidget(covariant EditableCell oldWidget) {
    if (oldWidget.initialValue != widget.initialValue && !_isEditing) {
      _controller.text = widget.initialValue;
    }
    super.didUpdateWidget(oldWidget);
  }

  String formatNumber(String value) {
    if (value.isEmpty) return '';
    final cleaned = value.replaceAll(RegExp(r'[^0-9]'), '');
    if (cleaned.isEmpty) return '';
    try {
      final number = int.parse(cleaned);
      final formatter = NumberFormat('#,###', 'vi_VN');
      return formatter.format(number);
    } catch (_) {
      return value;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isEditing) {
      return TextField(
        controller: _controller,
        autofocus: true,
        keyboardType:
        widget.isNumeric ? TextInputType.number : TextInputType.text,
        textAlign: widget.isNumeric ? TextAlign.right : TextAlign.left,
        inputFormatters: widget.isNumeric
            ? [
          AmountInputFormatter(
            fractionalDigits: 0,
            groupSeparator: NumberFormatter.kDot,
            decimalSeparator: NumberFormatter.kComma,
          ),
        ]
            : null,
        style: const TextStyle(fontSize: 13),
        decoration: const InputDecoration(
          isDense: true,
          border: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.grey, width: 0.5),
          ),
          focusedBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.blue, width: 1),
          ),
          enabledBorder: UnderlineInputBorder(
            borderSide: BorderSide(color: Colors.grey, width: 0.5),
          ),
          contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        ),
        onSubmitted: (_) => _finishEdit(),
        onEditingComplete: _finishEdit,
      );
    }

    final displayValue =
    widget.isNumeric ? formatNumber(widget.initialValue) : widget.initialValue;

    return GestureDetector(
      onTap: () => setState(() => _isEditing = true),
      child: Align(
        alignment:
        widget.isNumeric ? Alignment.centerRight : Alignment.centerLeft,
        child: Text(
          displayValue.isEmpty ? '—' : displayValue,
          style: const TextStyle(fontSize: 13),
        ),
      ),
    );
  }

  void _finishEdit() {
    setState(() => _isEditing = false);
    widget.onChanged(_controller.text.trim());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}

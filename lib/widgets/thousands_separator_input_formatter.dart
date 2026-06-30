import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

// ✅ Custom formatter — chỉ chèn dấu chấm mà không làm đảo ký tự
class ThousandsSeparatorInputFormatter extends TextInputFormatter {
  final NumberFormat _formatter = NumberFormat.decimalPattern('vi_VN');

  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    // Nếu rỗng thì giữ nguyên
    if (newValue.text.isEmpty) {
      return newValue.copyWith(text: '');
    }

    // Loại bỏ ký tự không phải số
    String digits = newValue.text.replaceAll(RegExp(r'[^0-9]'), '');

    // Format lại
    final formatted = _formatter.format(int.parse(digits));

    // Tính vị trí con trỏ hợp lý
    int selectionIndex =
        formatted.length - (oldValue.text.length - oldValue.selection.end);
    if (selectionIndex < 0) selectionIndex = 0;
    if (selectionIndex > formatted.length) selectionIndex = formatted.length;

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: selectionIndex),
    );
  }
}

// 🧩 Widget hiển thị form nhập chi phí hải quan
Widget buildChiPhiHaiQuanForm(Map<String, dynamic> item, dynamic controller) {
  final phiHaiQuanChiTiet =
      item["phiHaiQuanChiTiet"] as Map<String, dynamic>? ?? {};
  if (item["haiQuan"] != true || phiHaiQuanChiTiet.isEmpty) return const SizedBox();

  final Map<String, TextEditingController> _controllers = {};

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const SizedBox(height: 12),
      const Text(
        "💰 Thông tin chi phí hải quan",
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
          color: Colors.orange,
        ),
      ),
      const SizedBox(height: 20),
      LayoutBuilder(
        builder: (context, constraints) {
          final double itemWidth = (constraints.maxWidth - 7 * 8) / 8;

          return Wrap(
            spacing: 8,
            runSpacing: 20,
            children: phiHaiQuanChiTiet.entries.map<Widget>((entry) {
              final key = entry.key;
              final data = entry.value;
              String value = "";
              String kieuDuLieu = "Số";

              try {
                final cuaKhau = item["diemDi"];
                final chiPhi = key;
                final matched = controller.phiHaiQuanList.firstWhereOrNull((e) {
                  return e["Cửa khẩu"] == cuaKhau && e["Chi phí"] == chiPhi;
                });
                if (matched != null && matched["Kiểu dữ liệu"] != null) {
                  kieuDuLieu = matched["Kiểu dữ liệu"].toString().trim();
                }
              } catch (_) {}

              // Lấy giá trị ban đầu
              if (data is Map && data["value"] != null) {
                value = data["value"].toString();
              } else if (data is String || data is num) {
                value = data.toString();
              }

              // ✅ Controller chỉ khởi tạo 1 lần
              _controllers[key] = _controllers[key] ??
                  TextEditingController(
                    text: kieuDuLieu == "Số" && value.isNotEmpty
                        ? NumberFormat.decimalPattern('vi_VN')
                        .format(double.tryParse(value) ?? 0)
                        : value,
                  );

              return SizedBox(
                width: itemWidth,
                child: TextField(
                  controller: _controllers[key],
                  keyboardType: kieuDuLieu == "Số"
                      ? TextInputType.number
                      : TextInputType.text,
                  inputFormatters: kieuDuLieu == "Số"
                      ? [ThousandsSeparatorInputFormatter()]
                      : null,
                  style: const TextStyle(fontSize: 12, height: 1.0),
                  decoration: InputDecoration(
                    labelText: key,
                    labelStyle:
                    const TextStyle(fontSize: 11, height: 0.8),
                    border: const OutlineInputBorder(),
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                        vertical: 8, horizontal: 6),
                  ),
                  onChanged: (v) {
                    final clean = kieuDuLieu == "Số"
                        ? v.replaceAll(RegExp(r'[^0-9]'), '')
                        : v;

                    if (data is Map) {
                      item["phiHaiQuanChiTiet"][key]["value"] = clean;
                    } else {
                      item["phiHaiQuanChiTiet"][key] = clean;
                    }

                    controller.tinhTongPhiHaiQuan();
                  },
                ),
              );
            }).toList(),
          );
        },
      ),
    ],
  );
}

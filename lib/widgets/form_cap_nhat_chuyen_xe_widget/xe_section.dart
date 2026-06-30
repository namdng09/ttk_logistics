import 'package:kho555/widgets/xe_info_form.dart';
import 'package:flutter/material.dart';

class XeSection extends StatelessWidget {
  final Map<String, dynamic> json;

  final TextEditingController bksCtrl;
  final TextEditingController trongTaiCtrl;

  /// Callback khi thông tin xe thay đổi
  final void Function(Map<String, dynamic> xe, bool isXeNha) onChanged;

  const XeSection({
    super.key,
    required this.json,
    required this.bksCtrl,
    required this.trongTaiCtrl,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return XeInfoForm(
      json: json,
      index: 0,
      tag: 'form-sua-chuyen-xe',
      onXeChanged: (xe, isXeNha) {
        // Cập nhật control hiển thị
        if (xe["bks"] != null) {
          bksCtrl.text = xe["bks"];
        }
        if (xe["loai_xe"] != null) {
          trongTaiCtrl.text = xe["loai_xe"];
        }

        // Gọi callback để màn chính xử lý tiếp
        onChanged(xe, isXeNha);
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:collection/collection.dart';
import '../../helper/widgets/my_dropdown_field.dart';

class ThongTinCoBanSection extends StatelessWidget {
  final List<dynamic> khachHangList;
  final String? khachHangId;

  final TextEditingController diemDiCtrl;
  final TextEditingController diemDenCtrl;
  final TextEditingController trongTaiCtrl;

  final Function({
  String? khachHangId,
  String? diemDi,
  String? diemDen,
  String? trongTai,
  }) onChanged;

  final List<String> diemDenList;
  final List<String> diemDiList;
  final List<String> trongTaiList;

  ThongTinCoBanSection({
    super.key,
    required this.khachHangList,
    required this.khachHangId,
    required this.diemDiCtrl,
    required this.diemDenCtrl,
    required this.trongTaiCtrl,
    required this.onChanged,

    // 🔹 Hai trường này sẽ được cập nhật từ màn to, truyền vào để đảm bảo đúng danh sách
    this.diemDenList = const [],
    this.diemDiList = const [],
    this.trongTaiList = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "🚚 Thông tin cơ bản",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 8),

        Row(
          children: [
            // =================== 🔹 KHÁCH HÀNG ===================
            Expanded(
              child: MyDropdownField(
                label: "Khách hàng",
                value: khachHangId,
                options: khachHangList.map((e) => e["nid"].toString()).toList(),
                displayBuilder: (id) {
                  final m = khachHangList.firstWhereOrNull(
                        (e) => e["nid"].toString() == id,
                  );
                  return m?["text"] ?? "-";
                },
                onChanged: (v) {
                  onChanged(
                    khachHangId: v,
                    diemDi: diemDiCtrl.text,
                    diemDen: diemDenCtrl.text,
                    trongTai: trongTaiCtrl.text,
                  );
                },
              ),
            ),

            const SizedBox(width: 8),

            // =================== 🔹 ĐIỂM ĐI ===================
            Expanded(
              child: MyDropdownField(
                label: "Điểm đi",
                value: diemDiCtrl.text.isNotEmpty ? diemDiCtrl.text : null,
                options: diemDiList,
                onChanged: (v) {
                  diemDiCtrl.text = v ?? '';
                  onChanged(
                    khachHangId: khachHangId,
                    diemDi: v,
                    diemDen: diemDenCtrl.text,
                    trongTai: trongTaiCtrl.text,
                  );
                },
              ),
            ),

            const SizedBox(width: 8),

            // =================== 🔹 ĐIểm đến ===================
            Expanded(
              child: MyDropdownField(
                label: "Điểm đến",
                value: diemDenList.contains(diemDenCtrl.text)
                    ? diemDenCtrl.text
                    : null,
                options: diemDenList,
                onChanged: (v) {
                  diemDenCtrl.text = v ?? '';
                  onChanged(
                    khachHangId: khachHangId,
                    diemDi: diemDiCtrl.text,
                    diemDen: v,
                    trongTai: trongTaiCtrl.text,
                  );
                },
              ),
            ),

            const SizedBox(width: 8),

            // =================== 🔹 TRỌNG TẢI ===================
            Expanded(
              child: MyDropdownField(
                label: "Trọng tải",
                value: trongTaiList.contains(trongTaiCtrl.text)
                    ? trongTaiCtrl.text
                    : null,
                options: trongTaiList,
                onChanged: (v) {
                  trongTaiCtrl.text = v ?? '';
                  onChanged(
                    khachHangId: khachHangId,
                    diemDi: diemDiCtrl.text,
                    diemDen: diemDenCtrl.text,
                    trongTai: v,
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }
}

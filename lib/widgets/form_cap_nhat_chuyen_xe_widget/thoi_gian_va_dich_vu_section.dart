import 'package:ttk_logistics/widgets/form_cap_nhat_chuyen_xe_widget/my_date_picker_field.dart';
import 'package:flutter/material.dart';
import '../../helper/widgets/my_datetime_field.dart';

class ThoiGianVaDichVuSection extends StatelessWidget {
  final TextEditingController ngayVanChuyenCtrl;
  final TextEditingController ngayGioTraHangCtrl;

  final bool showBaoHiem;
  final bool showHaiQuan;
  final bool hangThuong;

  final Map<String, dynamic> json;

  final ValueChanged<bool> onBaoHiemChanged;
  final ValueChanged<bool> onHaiQuanChanged;
  final ValueChanged<bool> onCuocXeChanged;
  final ValueChanged<bool> onHangThuongChanged;
  final ValueChanged<bool> onQuaTaiChanged;

  final Function(String?) onNgayVanChuyenChanged;
  final Function(String?) onNgayGioTraHangChanged;

  const ThoiGianVaDichVuSection({
    super.key,
    required this.ngayVanChuyenCtrl,
    required this.ngayGioTraHangCtrl,
    required this.showBaoHiem,
    required this.showHaiQuan,
    required this.hangThuong,
    required this.json,
    required this.onBaoHiemChanged,
    required this.onHaiQuanChanged,
    required this.onCuocXeChanged,
    required this.onHangThuongChanged,
    required this.onQuaTaiChanged,
    required this.onNgayVanChuyenChanged,
    required this.onNgayGioTraHangChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // ============================ NGÀY VẬN CHUYỂN ============================
        Expanded(
          flex: 2,
          child: MyDatePickerField(
            label: "Ngày VC",
            initialDate:
            ngayVanChuyenCtrl.text.isNotEmpty ? ngayVanChuyenCtrl.text : null,
            onDateSelected: (v) {
              ngayVanChuyenCtrl.text = v ?? '';
              onNgayVanChuyenChanged(v);
            },
            readOnly: false,
          ),
        ),

        const SizedBox(width: 8),

        // ============================ NGÀY GIỜ GIAO ============================
        Expanded(
          flex: 3,
          child: MyDateTimeField(
            label: "Ngày & giờ giao hàng",
            controller: ngayGioTraHangCtrl,
            onChanged: (v) {
              onNgayGioTraHangChanged(v);
            },
          ),
        ),

        const SizedBox(width: 8),

        // ============================ NHÓM DỊCH VỤ ============================
        Expanded(
          flex: 6,
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [
              // =================== BẢO HIỂM ===================
              FilterChip(
                label: const Text("Bảo hiểm"),
                selected: showBaoHiem,
                onSelected: (selected) {
                  onBaoHiemChanged(selected);
                },
              ),

              // =================== CƯỚC XE ===================
              FilterChip(
                label: const Text("Cước xe"),
                selected: json["dich_vu"]?["cuoc_xe"] == true,
                onSelected: (selected) {
                  json["dich_vu"] ??= {};
                  json["dich_vu"]["cuoc_xe"] = selected;
                  onCuocXeChanged(selected);
                },
              ),

              // =================== HẢI QUAN ===================
              FilterChip(
                label: const Text("Hải quan"),
                selected: showHaiQuan,
                onSelected: (selected) {
                  onHaiQuanChanged(selected);
                },
              ),

              // =================== HÀNG THƯỜNG ===================
              FilterChip(
                label: const Text("Hàng thường"),
                selected: hangThuong,
                onSelected: (selected) {
                  onHangThuongChanged(selected);
                },
              ),

              // =================== QUÁ KHỔ / QUÁ TẢI ===================
              FilterChip(
                label: const Text("Quá khổ / Quá tải"),
                selected: json["dich_vu"]?["qua_tai"] == true,
                onSelected: (selected) {
                  json["dich_vu"] ??= {};
                  json["dich_vu"]["qua_tai"] = selected;
                  onQuaTaiChanged(selected);
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../helper/widgets/my_cost_row.dart';

class TongHopChiPhiSection extends StatelessWidget {
  final num phiCuocXe;
  final num tongPhiBaoHiem;
  final num tongPhiHaiQuan;
  final num phiLuuCa;
  final int soNgayLuuCa;
  final num chiPhiKhacTotal;
  final num traThemDiemTotal;

  final bool showBaoHiem;
  final bool showHaiQuan;

  final Map<String, dynamic> json;

  const TongHopChiPhiSection({
    super.key,
    required this.phiCuocXe,
    required this.tongPhiBaoHiem,
    required this.tongPhiHaiQuan,
    required this.phiLuuCa,
    required this.soNgayLuuCa,
    required this.chiPhiKhacTotal,
    required this.traThemDiemTotal,
    required this.showBaoHiem,
    required this.showHaiQuan,
    required this.json,
  });

  @override
  Widget build(BuildContext context) {
    final formatter = NumberFormat("#,##0", "vi_VN");

    final tongTien =
        phiCuocXe +
            tongPhiBaoHiem +
            chiPhiKhacTotal +
            traThemDiemTotal +
            (showHaiQuan ? (json["phi_hai_quan"] ?? 0) : 0) +
            ((json["dich_vu"]?["qua_tai"] == true)
                ? (json["phi_qua_kho_qua_tai"] ?? 0)
                : 0) +
            (json["phi_luu_ca"] ?? 0);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            "💰 Tổng hợp chi phí",
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),

          // ---------------------- CƯỚC ----------------------
          MyCostRow(label: "Cước xe", value: phiCuocXe),

          // ---------------------- BẢO HIỂM ----------------------
          MyCostRow(
            label: "Phí bảo hiểm",
            value: showBaoHiem ? (json["phi_bao_hiem"] ?? 0) : 0,
          ),

          // ---------------------- HẢI QUAN ----------------------
          MyCostRow(
            label: "Phí hải quan",
            value: showHaiQuan ? (json["phi_hai_quan"] ?? 0) : 0,
          ),

          // ---------------------- LƯU CA ----------------------
          MyCostRow(
            label: "Phí lưu ca",
            value: json["phi_luu_ca"] ?? 0,
          ),

          const SizedBox(height: 4),

          // 🔹 Hiển thị số ngày lưu ca
          if (soNgayLuuCa > 0)
            Text(
              "📦 Lưu ca: $soNgayLuuCa ngày (${formatter.format(phiLuuCa)} ₫)",
              style: const TextStyle(
                color: Colors.redAccent,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            )
          else
            const Text(
              "Không bị lưu ca",
              style: TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.w500,
                fontSize: 13,
              ),
            ),

          // ---------------------- TRẢ THÊM ĐIỂM ----------------------
          MyCostRow(label: "Trả thêm điểm", value: traThemDiemTotal),

          // ---------------------- QUÁ TẢI ----------------------
          MyCostRow(
            label: "Phí quá khổ / quá tải",
            value: (json["dich_vu"]?["qua_tai"] == true)
                ? (json["phi_qua_kho_qua_tai"] ?? 0)
                : 0,
          ),

          // ---------------------- CHI PHÍ KHÁC ----------------------
          MyCostRow(label: "Chi phí khác", value: chiPhiKhacTotal),

          const Divider(),

          // ---------------------- TỔNG TIỀN ----------------------
          MyCostRow(
            label: "Tổng tiền",
            value: tongTien,
            bold: true,
          ),
        ],
      ),
    );
  }
}

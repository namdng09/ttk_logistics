import 'package:kho555/widgets/chi_phi_hang_nang_table.dart';
import 'package:kho555/widgets/phi_cung_tinh_khac_tuyen_table.dart';
import 'package:kho555/widgets/phi_cung_tuyen_khac_tinh_table.dart';
import 'package:kho555/widgets/phi_hai_quan_table.dart';
import 'package:kho555/widgets/phi_van_tai_table.dart';
import 'package:flutter/material.dart';
import 'package:kho555/services/khach_hang_service.dart';
import 'package:kho555/widgets/phi_bao_hiem_table.dart';
import 'package:kho555/widgets/phi_luu_ca_table.dart';

class CauHinhChiPhiPage extends StatefulWidget {
  final String title;
  final Map<String, dynamic> customer;
  final String fieldName;
  final String type; // Khách hàng / Nhà xe

  const CauHinhChiPhiPage({
    super.key,
    required this.title,
    required this.customer,
    required this.fieldName,
    required this.type
  });

  @override
  State<CauHinhChiPhiPage> createState() => _CauHinhChiPhiPageState();
}

class _CauHinhChiPhiPageState extends State<CauHinhChiPhiPage> {
  final _phiBaoHiemKey = GlobalKey<PhiBaoHiemTableState>();
  final _phiLuuCaKey = GlobalKey<PhiLuuCaTableState>();
  final _phiCungTinhKhacTuyenKey = GlobalKey<PhiCungTinhKhacTuyenTableState>();
  final _phiHangNangKey = GlobalKey<ChiPhiHangNangTableState>();
  final _phiCungTuyenKhacTinhKey = GlobalKey<PhiCungTuyenKhacTinhTableState>();
  final _phiHaiQuanKey = GlobalKey<PhiHaiQuanTableState>();
  final _phiVanTaiKey = GlobalKey<PhiVanTaiTableState>();

  bool isLoading = false;


  Widget _buildTable() {
    switch (widget.fieldName) {
      case "field_phi_bao_hiem":
        return PhiBaoHiemTable(customer: widget.customer, key: _phiBaoHiemKey);
      case "field_phi_luu_ca":
        return PhiLuuCaTable(customer: widget.customer, key: _phiLuuCaKey);
      case "field_phi_cung_tinh_khac_tuyen":
        return PhiCungTinhKhacTuyenTable(customer: widget.customer, key: _phiCungTinhKhacTuyenKey);
      case "field_phi_hang_nang":
        return ChiPhiHangNangTable(customer: widget.customer, key: _phiHangNangKey);
      case "field_phi_cung_tuyen_khac_tinh":
        return PhiCungTuyenKhacTinhTable(customer: widget.customer, key: _phiCungTuyenKhacTinhKey);
      case "field_phi_hai_quan":
        return PhiHaiQuanTable(customer: widget.customer, key: _phiHaiQuanKey);
      case "field_cuoc_van_tai":
        return PhiVanTaiTable(customer: widget.customer, key: _phiVanTaiKey);
      default:
        return const Center(child: Text("Chưa hỗ trợ loại chi phí này"));
    }
  }

  Future<void> _saveData() async {
    setState(() => isLoading = true);

    String jsonData = "[]";
    if (widget.fieldName == "field_phi_bao_hiem") {
      jsonData = _phiBaoHiemKey.currentState?.toJson() ?? "[]";
    } else if (widget.fieldName == "field_phi_luu_ca") {
      jsonData = _phiLuuCaKey.currentState?.toJson() ?? "[]";
    } else if (widget.fieldName == "field_phi_cung_tinh_khac_tuyen") {
      jsonData = _phiCungTinhKhacTuyenKey.currentState?.toJson() ?? "[]";
    } else if (widget.fieldName == "field_phi_hang_nang") {
      jsonData = _phiHangNangKey.currentState?.toJson() ?? "[]";
    } else if (widget.fieldName == "field_phi_cung_tuyen_khac_tinh") {
      jsonData = _phiCungTuyenKhacTinhKey.currentState?.toJson() ?? "[]";
    } else if (widget.fieldName == "field_phi_hai_quan") {
      jsonData = _phiHaiQuanKey.currentState?.toJson() ?? "[]";
    } else if (widget.fieldName == "field_cuoc_van_tai") {
      jsonData = _phiVanTaiKey.currentState?.toJson() ?? "[]";
    }

    final res = await KhachHangService.saveChiPhi(
      int.tryParse(widget.customer['nid'].toString()) ?? 0,
      widget.fieldName,
      jsonData,
      widget.type
    );

    if (mounted) {
      setState(() => isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res.message),
          backgroundColor: res.success ? Colors.green : Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Scaffold(
          appBar: AppBar(
            title: Text(
              widget.title,
              style: const TextStyle(
                color: Colors.black54,
                fontWeight: FontWeight.w600,
              ),
            ),
            centerTitle: true,
            backgroundColor: Colors.white,
            elevation: 1,
            iconTheme: const IconThemeData(color: Colors.black54),
            actions: [
              TextButton.icon(
                onPressed: _saveData,
                icon: const Icon(Icons.save, color: Colors.blue),
                label: const Text(
                  "Lưu lại",
                  style: TextStyle(color: Colors.blue),
                ),
              ),
            ],
          ),
          backgroundColor: Colors.white,
          body: Padding(
            padding: const EdgeInsets.all(16),
            child: _buildTable(),
          ),
        ),

        // Spin loading overlay
        if (isLoading)
          Container(
            color: Colors.black45,
            child: const Center(
              child: CircularProgressIndicator(),
            ),
          ),
      ],
    );
  }
}

import 'dart:convert';
import 'package:ttk_logistics/controller/pages/chuyen_xe_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class ChiTietChuyenXeScreen extends StatefulWidget {
  const ChiTietChuyenXeScreen({super.key});

  @override
  State<ChiTietChuyenXeScreen> createState() => _ChiTietChuyenXeScreenState();
}

class _ChiTietChuyenXeScreenState extends State<ChiTietChuyenXeScreen> with UIMixin {
  late ChuyenXeController controller;
  final dateFormat = DateFormat("dd/MM/yyyy HH:mm");

  @override
  void initState() {
    controller = Get.find<ChuyenXeController>(tag: 'chi-tiet-chuyen-xe');
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ChuyenXeController>(
      tag: 'chi-tiet-chuyen-xe',
      builder: (controller) {
        final item = controller.currentChuyenXe ?? {};
        final thongTin = item["thong_tin_json"] ?? {};

        return Layout(
          mainScreenName: "Chuyến xe",
          subScreenName: "Chi tiết chuyến xe",
          child: MyContainer(
            paddingAll: 16,
            child: controller.isLoading
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 🔹 Nút Back
                  Align(
                    alignment: Alignment.centerLeft,
                    child: TextButton.icon(
                      icon: const Icon(Icons.arrow_back),
                      label: const Text("Quay lại danh sách"),
                      onPressed: () {
                        // controller.clearCurrentChuyenXe();
                        Get.back();
                      },
                    ),
                  ),
                  const SizedBox(height: 8),

                  // 🔹 Tiêu đề chuyến xe
                  Text(
                    item["title"] ?? "Không có dữ liệu",
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  // 🔹 Thông tin cơ bản
                  _buildInfoRow("Khách hàng",
                      item["khach_hang"]?["ten_khach_hang"]),
                  _buildInfoRow("Trạng thái", item["trang_thai"]),
                  _buildInfoRow("Loại xe", item["loai_xe"]),
                  _buildInfoRow(
                      "Nhà xe", item["nha_xe"]?["ten_nha_xe"]),
                  _buildInfoRow("Ngày vận chuyển",
                      item["ngay_van_chuyen"] ?? "-"),
                  _buildInfoRow("Ngày trả hàng",
                      item["ngay_gio_tra_hang"] ?? "-"),

                  const Divider(height: 30),

                  // 🔹 Hành trình
                  const Text("📍 Hành trình",
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _buildInfoRow("Điểm đi", thongTin["diem_di"]),
                  _buildInfoRow("Điểm đến", thongTin["diem_den"]),
                  _buildInfoRow("Trọng tải", thongTin["trong_tai"]),
                  _buildInfoRow("BKS", thongTin["bks"]),
                  const Divider(height: 30),

                  // 🔹 Chi phí
                  const Text("💰 Chi phí",
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  _buildInfoRow(
                      "Cước xe",
                      _formatCurrency(thongTin["phi_cuoc_xe"] ?? 0)),
                  _buildInfoRow(
                      "Phí bảo hiểm",
                      _formatCurrency(thongTin["phi_bao_hiem"] ?? 0)),
                  _buildInfoRow(
                      "Phí hải quan",
                      _formatCurrency(thongTin["phi_hai_quan"] ?? 0)),
                  _buildInfoRow(
                      "Tổng phí",
                      _formatCurrency(thongTin["tong_phi"] ?? 0)),
                  const Divider(height: 30),

                  // 🔹 Lịch sử trạng thái
                  const Text("📋 Lịch sử trạng thái",
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  ...List.generate(
                    (thongTin["lich_su_trang_thai"]?.length ?? 0),
                        (i) {
                      final ls = thongTin["lich_su_trang_thai"][i];
                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading: const Icon(Icons.history, size: 22),
                        title: Text(ls["trang_thai_moi"] ?? "-",
                            style: const TextStyle(
                                fontWeight: FontWeight.w600)),
                        subtitle: Text(
                            "${ls["ten_nguoi_cap_nhat"] ?? "Không rõ"} — ${ls["thoi_gian"] ?? ""}"),
                      );
                    },
                  ),
                  const SizedBox(height: 30),

                  // 🔹 Thông tin JSON đầy đủ (debug)
                  ExpansionTile(
                    title: const Text("📦 Xem toàn bộ dữ liệu JSON"),
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          const JsonEncoder.withIndent("  ")
                              .convert(item),
                          style: const TextStyle(
                              fontFamily: "monospace", fontSize: 12),
                        ),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(String label, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
              width: 150,
              child: Text("$label:",
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, color: Colors.black87))),
          Expanded(
              child: Text(value?.toString() ?? "-",
                  style: const TextStyle(color: Colors.black87))),
        ],
      ),
    );
  }

  String _formatCurrency(dynamic value) {
    try {
      final num number = value is num ? value : num.parse(value.toString());
      final formatter = NumberFormat("#,##0", "vi_VN");
      return "${formatter.format(number)} đ";
    } catch (_) {
      return "-";
    }
  }
}

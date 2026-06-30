import 'package:kho555/controller/cong_no_controller.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class DialogLichSuThanhToanTheoChuyenXe extends StatelessWidget {
  DialogLichSuThanhToanTheoChuyenXe({
    super.key,
    required this.chuyenXeNid,
  });

  final int chuyenXeNid;
  final CongNoController controller = Get.find();
  final DateFormat df = DateFormat("dd/MM/yyyy HH:mm");

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text("Lịch sử thanh toán – Chuyến xe #$chuyenXeNid"),
      content: SizedBox(
        width: 700,
        child: GetBuilder<CongNoController>(
          builder: (controller) {
            if (controller.isLoadingLichSu) {
              return const Center(child: CircularProgressIndicator());
            }

            if (controller.lichSuThanhToanTheoChuyen.isEmpty) {
              return const Text("Chưa có lịch sử thanh toán");
            }

            return ListView.separated(
              shrinkWrap: true,
              itemCount: controller.lichSuThanhToanTheoChuyen.length,
              separatorBuilder: (_, __) => const Divider(),
              itemBuilder: (_, i) {
                final item = controller.lichSuThanhToanTheoChuyen[i];
                final thuChi = item["thu_chi"] ?? {};

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    /// 🔹 Ngày thu
                    Text(
                      "Ngày thu: ${df.format(
                        DateTime.fromMillisecondsSinceEpoch( item["ngay_thu_chi"] * 1000,
                        ),
                      )}",
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),

                    const SizedBox(height: 4),

                    /// 🔹 Số tiền
                    Text(
                      "Số tiền: ${NumberFormat("#,###", "vi_VN")
                          .format(item["so_tien"])} đ",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),

                    const SizedBox(height: 4),

                    /// 🔹 Người thực hiện
                    Text("Người thực hiện: ${item["nguoi_thuc_hien"] ?? ""}"),

                    /// 🔹 Nội dung
                    if (item["noi_dung"] != null &&
                        item["noi_dung"].toString().isNotEmpty)
                      Text("Ghi chú: ${item["noi_dung"]}"),

                    /// 🔹 Thông tin chuyển khoản
                    if (item["thong_tin_chuyen_khoan"] != null &&
                        item["thong_tin_chuyen_khoan"].toString().isNotEmpty)
                      Text(
                        "CK: ${item["thong_tin_chuyen_khoan"]}",
                        style: const TextStyle(fontStyle: FontStyle.italic),
                      ),

                    const SizedBox(height: 6),

                    /// 🔹 Liên kết phiếu thu
                    Text(
                      "Phiếu thu #${thuChi["nid"]} – Tổng tiền: "
                          "${NumberFormat("#,###", "vi_VN")
                          .format(thuChi["tong_tien"] ?? 0)} đ",
                      style: const TextStyle(color: Colors.grey),
                    ),
                  ],
                );
              },
            );
          },
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("Đóng"),
        ),
      ],
    );
  }
}

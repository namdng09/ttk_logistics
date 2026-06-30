import 'dart:convert';
import 'package:kho555/controller/pages/chuyen_xe_controller.dart';
import 'package:kho555/helper/extensions/extensions.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:kho555/views/ui/pages/bap2/form_sua_chuyen_xe_screen.dart';
import 'package:kho555/widgets/dialog_sua_chuyen_xe.dart';
import 'package:kho555/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class ChuyenXeScreen extends StatefulWidget {
  const ChuyenXeScreen({super.key});

  @override
  State<ChuyenXeScreen> createState() => _ChuyenXeScreenState();
}

class _ChuyenXeScreenState extends State<ChuyenXeScreen> with UIMixin {
  late ChuyenXeController controller;
  final currency = NumberFormat("#,###", "vi_VN");
  final dateFormat = DateFormat("dd/MM/yyyy");
  final timeFormat = DateFormat("HH:mm");

  final ScrollController _horizontalController = ScrollController();
  final ScrollController _verticalController = ScrollController();
  final NumberFormat _formatCurrency = NumberFormat('#,##0', 'vi_VN');

  final int rowsPerPage = 20;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    if (controller.needReload) {
      controller.fetchChuyenXeList();
      controller.needReload = false;
    }
  }

  @override
  void initState() {
    super.initState();
    controller = Get.put(ChuyenXeController());
    // ✅ Chờ UI build xong mới fetch dữ liệu
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.fetchChuyenXeList();
    });
  }

  List<DataRow> _buildRows(List<Map<String, dynamic>> data) {
    return List.generate(data.length, (index) {
      final item = data[index];
      final rawJson = item["field_thong_tin_json"];
      final info = (rawJson is Map)
          ? rawJson
          : (rawJson is String
          ? (jsonDecode(rawJson) as Map<String, dynamic>)
          : <String, dynamic>{});

      // ======== Trạng thái chuyến xe ========
      final trangThai = (item["field_trang_thai"] ?? "Chờ duyệt").toString();
      Color colorTrangThai = Colors.grey;
      if (trangThai.contains("Chờ")) colorTrangThai = Colors.orange;
      if (trangThai.contains("thành")) colorTrangThai = Colors.blue;
      if (trangThai.contains("Hủy")) colorTrangThai = Colors.grey;
      if (trangThai.contains("chạy")) colorTrangThai = Colors.green;

      // ======== Menu chức năng ========
      List<PopupMenuEntry<String>> buildMenu() {
        final items = <PopupMenuEntry<String>>[
          PopupMenuItem(
            value: "view",
            child: Row(
              children: const [
                Icon(Icons.visibility_outlined, size: 18, color: Colors.blueGrey),
                SizedBox(width: 8),
                Text("Xem chi tiết"),
              ],
            ),
          ),
        ];

        if (trangThai.contains("Chờ duyệt")) {
          items.addAll([
            PopupMenuItem(
              value: "update",
              child: Row(
                children: const [
                  Icon(Icons.edit_outlined, size: 18, color: Colors.teal),
                  SizedBox(width: 8),
                  Text("Cập nhật"),
                ],
              ),
            ),
            PopupMenuItem(
              value: "run",
              child: Row(
                children: const [
                  Icon(Icons.play_arrow_rounded, size: 18, color: Colors.blue),
                  SizedBox(width: 8),
                  Text("Thực hiện"),
                ],
              ),
            ),
            PopupMenuItem(
              value: "cancel",
              child: Row(
                children: const [
                  Icon(Icons.cancel_outlined, size: 18, color: Colors.redAccent),
                  SizedBox(width: 8),
                  Text("Hủy"),
                ],
              ),
            ),
          ]);
        }
        else if (trangThai.contains("Thực hiện") || trangThai.contains("Đang chạy")) {

          items.addAll([
            PopupMenuItem(
              value: "update",
              child: Row(
                children: const [
                  Icon(Icons.edit_outlined, size: 18, color: Colors.teal),
                  SizedBox(width: 8),
                  Text("Cập nhật"),
                ],
              ),
            ),
            PopupMenuItem(
              value: "finish",
              child: Row(
                children: const [
                  Icon(Icons.check_circle_outline, size: 18, color: Colors.green),
                  SizedBox(width: 8),
                  Text("Hoàn thành"),
                ],
              ),
            ),
          ]);
        }else if (trangThai.contains("Hoàn thành")) {
          items.addAll([
            PopupMenuItem(
              value: "update",
              child: Row(
                children: const [
                  Icon(Icons.edit_outlined, size: 18, color: Colors.teal),
                  SizedBox(width: 8),
                  Text("Cập nhật"),
                ],
              ),
            ),
            const PopupMenuDivider(),
            PopupMenuItem(
              value: "reopen",
              child: Row(
                children: const [
                  Icon(Icons.refresh_outlined, size: 18, color: Colors.orange),
                  SizedBox(width: 8),
                  Text("Mở lại"),
                ],
              ),
            ),
          ]);
        }

        // Future<void> _saveChiPhiCoDinh(int nid, Map<String, dynamic> thongTin) async {
        //   try {
        //     final response = await http.post(
        //       Uri.parse(AuthService.workerUrl),
        //       headers: {"Content-Type": "application/json"},
        //       body: jsonEncode({
        //         "url": "https://yourdomain.com/api/chuyen_xe/update_chi_phi_co_dinh",
        //         "method": "POST",
        //         "params": {
        //           "nid": nid,
        //           "thong_tin_json": thongTin,
        //         },
        //       }),
        //     );
        //
        //     final res = jsonDecode(response.body);
        //     if (res["success"] != true) throw Exception(res["message"] ?? "Lỗi không xác định");
        //   } catch (e) {
        //     Get.snackbar("Lỗi", e.toString(),
        //         backgroundColor: Colors.red.shade50,
        //         colorText: Colors.red.shade900,
        //         snackPosition: SnackPosition.BOTTOM);
        //   }
        // }
        // 🔹 Bổ sung nhóm in ấn
        items.add(const PopupMenuDivider());
        items.addAll([
          PopupMenuItem(
            value: "print_ca_nhan",
            child: Row(
              children: const [
                Icon(Icons.print_outlined, size: 18, color: Colors.indigo),
                SizedBox(width: 8),
                Text("In hợp đồng"),
              ],
            ),
          ),
          PopupMenuItem(
            value: "print_lenh_dieu_dong",
            child: Row(
              children: const [
                Icon(Icons.assignment_outlined, size: 18, color: Colors.blueGrey),
                SizedBox(width: 8),
                Text("In lệnh điều động"),
              ],
            ),
          ),
        ]);

        return items;
      }

      void onAction(String value) async {
        final int safeId = int.tryParse(item["nid"].toString()) ?? 0;
        final String title = item["title"] ?? "";

        switch (value) {
        // 🟠 Hủy chuyến xe
          case "cancel":
            controller.showDialogXacNhanTrangThai(
              context,
              safeId,
              title,
              newStatus: "Hủy",
              question: "Bạn có chắc chắn muốn hủy chuyến xe [$title] không?",
              buttonLabel: "Hủy chuyến xe",
              icon: Icons.cancel,
              color: Colors.red.shade600,
            );
            break;

        // 🟢 Hoàn thành
          case "finish":
            controller.showDialogXacNhanTrangThai(
              context,
              safeId,
              title,
              newStatus: "Hoàn thành",
              question: "Bạn có chắc chắn muốn hoàn thành chuyến xe [$title] không?",
              buttonLabel: "Hoàn thành",
              icon: Icons.check_circle_outline,
              color: Colors.teal,
            );
            break;

        // 🔵 Bắt đầu thực hiện
          case "run":
            controller.showDialogXacNhanTrangThai(
              context,
              safeId,
              title,
              newStatus: "Đang chạy",
              question: "Bạn có muốn bắt đầu thực hiện chuyến xe [$title] không?",
              buttonLabel: "Thực hiện chuyến xe",
              icon: Icons.play_circle_outline,
              color: Colors.blueAccent,
            );
            break;

        // ✏️ Cập nhật thông tin
          case "update":
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => DialogSuaChuyenXe(
                nid: safeId,
              ),
            );
            break;

        // 🔄 Mở lại chuyến xe
          case "reopen":
            controller.showDialogXacNhanTrangThai(
              context,
              safeId,
              title,
              newStatus: "Chờ duyệt",
              question: "Mở lại chuyến xe [$title] để xử lý lại?",
              buttonLabel: "Mở lại",
              icon: Icons.refresh,
              color: Colors.orange,
            );
            break;

        // 👁️ Xem chi tiết
          case "view":
            controller.viewDetail(
              safeId,
              mode: ChuyenXeViewMode.view,
            );            break;

        // 🖨️ In hợp đồng cá nhân
          case "print_ca_nhan":
            await controller.openHopDongCaNhanView(item);
            break;
          case "print_lenh_dieu_dong":
            await controller.openLenhDieuDongView(item);
            break;
        // 🔹 Mặc định
          default:
            Get.snackbar("Thông báo", "Chức năng chưa được hỗ trợ!",
                backgroundColor: Colors.orange.shade50,
                colorText: Colors.orange.shade800);
            break;
        }
      }

      // ======== Ngày vận chuyển =========
      String ngayVC = "";
      try {
        final raw = item["field_ngay_van_chuyen"];
        if (raw != null) {
          DateTime date;
          if (raw is int) {
            date = DateTime.fromMillisecondsSinceEpoch(raw * 1000);
          } else if (raw is String) {
            final ts = int.tryParse(raw);
            if (ts != null) {
              date = DateTime.fromMillisecondsSinceEpoch(ts * 1000);
            } else {
              date = DateTime.parse(raw);
            }
          } else {
            date = DateTime.now();
          }
          ngayVC = dateFormat.format(date);
        }
      } catch (_) {}

      // ======== Ngày trả =========
      DateTime? ngayTra;
      if (item["field_ngay_gio_tra_hang"] != null) {
        try {
          final timestamp =
          int.tryParse(item["field_ngay_gio_tra_hang"].toString());
          if (timestamp != null && timestamp > 0) {
            ngayTra = DateTime.fromMillisecondsSinceEpoch(timestamp * 1000);
          }
        } catch (_) {}
      }

      // ======== Định dạng tiền =========
      String formatMoney(dynamic value) {
        if (value == null) return "";
        final num? val = num.tryParse(value.toString());
        return val != null ? currency.format(val) : "";
      }

      // ======== Hàm tạo ô =========
      Widget cellText(String text,
          {bool alignRight = false,
            Color? color,
            FontWeight? weight,
            double width = 120}) {
        return Container(
          width: width,
          padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 6),
          alignment:
          alignRight ? Alignment.centerRight : Alignment.centerLeft,
          child: Text(
            text,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 14,
              color: color ?? Colors.black87,
              fontWeight: weight ?? FontWeight.normal,
              height: 1.3,
            ),
          ),
        );
      }

      // ======== Dòng dữ liệu ========
      return DataRow(
          color: MaterialStateProperty.resolveWith<Color?>(
                (Set<MaterialState> states) {
              final isHighlighted = controller.highlightedRowId?.value == item["nid"].toString();
              return isHighlighted ? Colors.yellow.shade100 : null;
            },
          ),
          cells: [
            // 🟩 Cột chức năng
            DataCell(
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, color: Colors.grey),
                tooltip: "Chức năng",
                onSelected: onAction,
                itemBuilder: (_) => buildMenu(),
              ),
            ),

            // 🟩 Cột trạng thái
            DataCell(
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: colorTrangThai.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: colorTrangThai, width: 0.6),
                ),
                child: Text(
                  trangThai,
                  style: TextStyle(
                    color: colorTrangThai,
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),

            // 🟩 Các cột cũ giữ nguyên
            DataCell(cellText(ngayVC, width: 90)),
            DataCell(cellText(
                ngayTra != null ? dateFormat.format(ngayTra) : "", width: 90)),
            DataCell(cellText(
                ngayTra != null ? timeFormat.format(ngayTra) : "", width: 40)),
            DataCell(cellText(info["diem_di"]?.toString() ?? "", width: 80)),
            DataCell(
              Tooltip(
                message: info["diem_den"] ?? "",
                child: cellText(info["diem_den"] ?? "", width: 200),
              ),
            ),
            DataCell(cellText(info["trong_tai"]?.toString() ?? "")),
            DataCell(
              cellText(
                (() {
                  final loaiXe = item['field_loai_xe'];
                  final thongTin = item['field_thong_tin_json'];

                  if (thongTin == null) return '';

                  if (loaiXe == 'xe_nha') {
                    return thongTin['xe_nha']?['bks']?.toString() ?? '';
                  }

                  if (loaiXe == 'xe_ngoai') {
                    return thongTin['xe_ngoai']?['bks']?.toString() ?? '';
                  }

                  return '';
                })(),
                width: 100,
              ),
            ),

            // 🟩 Nhà xe (ưu tiên lấy từ xe_nha hoặc xe_ngoai)
            DataCell(
              cellText(
                (() {
                  final xeNha = info["xe_nha"];
                  final xeNgoai = info["xe_ngoai"];

                  if (xeNha != null && xeNha is Map && xeNha["nha_xe"] != null) {
                    return xeNha["nha_xe"].toString();
                  } else if (xeNgoai != null &&
                      xeNgoai is Map &&
                      xeNgoai["nha_xe"] != null) {
                    return xeNgoai["nha_xe"].toString();
                  } else {
                    return item["field_nha_xe"]?.toString() ?? "";
                  }
                })(),
                width: 100,
              ),
            ),
            DataCell(cellText(item["field_khach_hang_ref"] ?? "")),
            DataCell(cellText(formatMoney(info["doanh_thu"]),
                alignRight: true,
                color: Colors.teal,
                weight: FontWeight.w600,
                width: 90)),
            DataCell(cellText(
                info["tong_chi_phi"] != null
                    ? "${formatMoney(info["tong_chi_phi"])} đ"
                    : "",
                alignRight: true,
                weight: FontWeight.bold)
            ),
            DataCell(cellText(
                info["loi_nhuan"] != null
                    ? "${formatMoney(info["loi_nhuan"])} đ"
                    : "",
                alignRight: true,
                color: Colors.redAccent,
                weight: FontWeight.bold)
            ),
            //
            DataCell(cellText(
                info["phi_cuoc_xe"] != null
                    ? "${formatMoney(
                    (
                        info["phi_cuoc_xe"] - info['chi_phi_ncc']["phi_cuoc_xe"])
                      + (info["phi_luu_ca"]  - info['chi_phi_ncc']["phi_luu_ca"])
                      + (info["tra_them_diem_total"] - info['chi_phi_ncc']["tra_them_diem_total"])
                      + (info["qua_kho_qua_tai"] - info['chi_phi_ncc']["qua_kho_qua_tai"])
                      + (info["ve_cao_toc"] - info['chi_phi_ncc']["ve_cao_toc"])
                      + (info["phi_phat_sinh"] - info['chi_phi_ncc']["phi_phat_sinh"])
                )
      } đ"
                    : "",
                alignRight: true,
            ) ),
            DataCell(cellText(
                info["phi_bao_hiem"] != null
                    ? "${formatMoney(info["phi_bao_hiem"] - info['chi_phi_ncc']["phi_bao_hiem"])} đ"
                    : "",
                alignRight: true,
            ) ),
            DataCell(cellText(
                info["phi_hai_quan"] != null
                    ? "${formatMoney(info["phi_hai_quan"] - info['chi_phi_ncc']["phi_hai_quan"])} đ"
                    : "",
                alignRight: true,
            )),
          ]);
    });
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ChuyenXeController>(
      builder: (controller) {
        final allData = controller.chuyenXeList;
        final totalPages = controller.totalPages;
        final currentData = allData;

        return Layout(
          subScreenName: "Bảng chuyến xe",
          mainScreenName: "Chuyến xe",
          child: MyContainer(
            paddingAll: 10,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: 8.0),
                  child: Text(
                    "Danh sách chuyến xe (Trang ${controller.currentPage}/$totalPages)",
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),

                // ====== BẢNG DỮ LIỆU ======
                Container(
                  child: controller.isLoading
                      ? const Center(child: CircularProgressIndicator())
                      : allData.isEmpty
                      ? const Center(
                      child: Text("Không có dữ liệu chuyến xe"))
                      : GestureDetector(
                    onPanUpdate: (details) {
                      // Kéo ngang
                      if (_horizontalController.hasClients) {
                        _horizontalController.jumpTo(
                          (_horizontalController.offset -
                              details.delta.dx * 0.7)
                              .clamp(
                            0.0,
                            _horizontalController
                                .position.maxScrollExtent,
                          ),
                        );
                      }
                      // Kéo dọc
                      if (_verticalController.hasClients) {
                        _verticalController.jumpTo(
                          (_verticalController.offset -
                              details.delta.dy * 0.7)
                              .clamp(
                            0.0,
                            _verticalController
                                .position.maxScrollExtent,
                          ),
                        );
                      }
                    },
                    child: SingleChildScrollView(
                      controller: _horizontalController,
                      scrollDirection: Axis.horizontal,
                      child: SingleChildScrollView(
                        controller: _verticalController,
                        scrollDirection: Axis.vertical,
                        child: DataTable(
                          headingRowColor: MaterialStateProperty.all(
                              Colors.grey.shade200),
                          headingRowHeight: 50,
                          dataRowHeight: 56,
                          columnSpacing: 10,
                          columns: const [
                            DataColumn(label: Text("")), // Cột chức năng
                            DataColumn(label: Text("Trạng thái")),
                            DataColumn(label: Text("Ngày VC")),
                            DataColumn(label: Text("Ngày trả")),
                            DataColumn(label: Text("Giờ trả")),
                            DataColumn(label: Text("Điểm đi")),
                            DataColumn(label: Text("Điểm đến")),
                            DataColumn(label: Text("Loại xe")),
                            DataColumn(label: Text("Số xe VN")),
                            DataColumn(label: Text("Nhà xe")),
                            DataColumn(label: Text("Khách hàng")),
                            DataColumn(label: Text("Doanh thu")),
                            DataColumn(label: Text("Tổng chi")),
                            DataColumn(label: Text("Lợi nhuận")),
                            DataColumn(label: Text("Cước xe")),
                            DataColumn(label: Text("Bảo Hiểm")),
                            DataColumn(label: Text("Phí Hải Quan")),
                          ],
                          rows: _buildRows(currentData),
                        ),
                      ),
                    ),
                  ),
                ),

                // ====== PHÂN TRANG ======
                if (!controller.isLoading && totalPages > 1)
                  Padding(
                    padding: const EdgeInsets.only(top: 8.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.first_page),
                          onPressed: controller.currentPage > 1
                              ? () => controller.changePage(1)
                              : null,
                        ),
                        IconButton(
                          icon: const Icon(Icons.navigate_before),
                          onPressed: controller.currentPage > 1
                              ? () => controller
                              .changePage(controller.currentPage - 1)
                              : null,
                        ),
                        Text(
                          "Trang ${controller.currentPage}/$totalPages",
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.navigate_next),
                          onPressed: controller.currentPage < totalPages
                              ? () => controller
                              .changePage(controller.currentPage + 1)
                              : null,
                        ),
                        IconButton(
                          icon: const Icon(Icons.last_page),
                          onPressed: controller.currentPage < totalPages
                              ? () => controller.changePage(totalPages)
                              : null,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

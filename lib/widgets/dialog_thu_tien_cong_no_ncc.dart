import 'package:kho555/controller/cong_no_nha_cung_cap_controller.dart';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:kho555/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';

class DialogThuTienCongNoNcc extends StatelessWidget {
  DialogThuTienCongNoNcc({super.key});

  final CongNoNhaCungCapController controller = Get.find();
  final DateFormat df = DateFormat("dd/MM/yyyy");

  @override
  Widget build(BuildContext context) {

    return AlertDialog(
      title: const Text("Thu tiền công nợ"),
      content: SizedBox(
        width: 650,
        child: SingleChildScrollView(
          child: GetBuilder<CongNoNhaCungCapController>(
            builder: (controller) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [

                  /// ===============================
                  /// 1️⃣ CHỌN HÌNH THỨC THANH TOÁN
                  /// ===============================
                  const Text("Hình thức thanh toán",
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: RadioListTile<HinhThucThanhToan>(
                          value: HinhThucThanhToan.theoChuyenXe,
                          groupValue: controller.hinhThucThanhToan,
                          title: const Text("Thanh toán theo chuyến xe"),
                          onChanged: (v) {
                            controller.hinhThucThanhToan = v!;
                            controller.update();
                          },
                        ),
                      ),
                      Expanded(
                        child: RadioListTile<HinhThucThanhToan>(
                          value: HinhThucThanhToan.theoTongTien,
                          groupValue: controller.hinhThucThanhToan,
                          title: const Text("Thanh toán theo tổng tiền"),
                          onChanged: (v) {
                            controller.hinhThucThanhToan = v!;
                            controller.update();
                          },
                        ),
                      ),
                    ],
                  ),

                  const Divider(),

                  /// ===============================
                  /// 2️⃣ THANH TOÁN THEO CHUYẾN XE
                  /// ===============================
                  if (controller.hinhThucThanhToan ==
                      HinhThucThanhToan.theoChuyenXe)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Danh sách chuyến xe cần thanh toán",
                            style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),

                        DataTable(
                          columnSpacing: 30,
                          columns: const [
                            DataColumn(label: Text("Mã")),
                            DataColumn(label: Text("Ngày VC")),
                            DataColumn(label: Text("Còn lại")),
                            DataColumn(label: Text("Số tiền chi")),
                            DataColumn(label: Text("")),
                          ],
                          rows: List.generate(
                            controller.chuyenXeChuaThuHet.length,
                                (i) {
                              final item = controller.chuyenXeChuaThuHet[i];
                              final int nid = int.parse(item["nid"].toString());

                              return DataRow(cells: [
                                DataCell(Text("#${item["nid"]}")),
                                DataCell(Text(item["ngay_van_chuyen"] ?? "")),
                                DataCell(Text(
                                  NumberFormat("#,###", "vi_VN")
                                      .format(item["con_lai"]),
                                  style: const TextStyle(color: Colors.red),
                                )),
                                DataCell(
                                  SizedBox(
                                    width: 130,
                                    child: Focus(
                                      onFocusChange: (hasFocus) {
                                        if (!hasFocus) {
                                          final text =
                                              controller.soTienThanhToanCtrls[nid]?.text ?? '';

                                          final soTien =
                                              num.tryParse(text.replaceAll('.', '')) ?? 0;

                                          item["so_tien_thanh_toan"] = soTien;
                                          controller.tinhTongTienTheoChuyen();
                                        }
                                      },
                                      child: TextFormField(
                                        controller: controller.soTienThanhToanCtrls[nid],
                                        keyboardType: TextInputType.number,
                                        textAlign: TextAlign.right,
                                        inputFormatters: [
                                          ThousandsSeparatorInputFormatter(),
                                        ],
                                        onEditingComplete: () {
                                          FocusScope.of(context).unfocus();

                                          final text =
                                              controller.soTienThanhToanCtrls[nid]?.text ?? '';

                                          final soTien =
                                              num.tryParse(text.replaceAll('.', '')) ?? 0;

                                          item["so_tien_thanh_toan"] = soTien;
                                          controller.tinhTongTienTheoChuyen();
                                        },
                                        decoration: const InputDecoration(
                                          isDense: true,
                                          contentPadding:
                                          EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                DataCell(
                                  IconButton(
                                    tooltip: "Thanh toán đủ",
                                    icon: const Icon(Icons.done,
                                        color: Colors.green),
                                    onPressed: () {
                                      controller.thanhToanDuChoChuyen(i);
                                    },
                                  ),
                                ),
                              ]);
                            },
                          ),
                        ),

                        const SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              /// 🔴 Tổng tiền cần thanh toán
                              Row(
                                children: [
                                  const Text(
                                    "Tổng cần chi:",
                                    style: TextStyle(fontWeight: FontWeight.w500),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    "${NumberFormat("#,###", "vi_VN")
                                        .format(controller.tongTienCanThu)} đ",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.red,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(width: 24),

                              /// 🔵 Tổng tiền khách thanh toán
                              Row(
                                children: [
                                  const Text(
                                    style: TextStyle(fontWeight: FontWeight.w500),
                                    "Số tiền TT:",
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    "${NumberFormat("#,###", "vi_VN")
                                        .format(controller.tongTienKhachThanhToan)} đ",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(width: 24),

                              /// 🟠 / 🟢 Công nợ còn lại
                              Row(
                                children: [
                                  const Text(
                                    "Còn lại:",
                                    style: TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    "${NumberFormat("#,###", "vi_VN")
                                        .format(
                                      (controller.tongTienCanThu -
                                          controller.tongTienKhachThanhToan) <
                                          0
                                          ? 0
                                          : controller.tongTienCanThu -
                                          controller.tongTienKhachThanhToan,
                                    )} đ",
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: (controller.tongTienCanThu -
                                          controller.tongTienKhachThanhToan) <=
                                          0
                                          ? Colors.green
                                          : Colors.orange,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                      ],
                    ),

                  /// ===============================
                  /// 3️⃣ THANH TOÁN THEO TỔNG TIỀN
                  /// ===============================
                  if (controller.hinhThucThanhToan == HinhThucThanhToan.theoTongTien)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text("Số tiền thanh toán", style: TextStyle(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: controller.tongTienKhachThanhToanCtrl,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.right,
                          inputFormatters: [
                            ThousandsSeparatorInputFormatter(),
                          ],
                          decoration: const InputDecoration(
                            isDense: true,
                            contentPadding:
                            EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                          ),
                          onChanged: (value) {
                            final soTien =
                                double.tryParse(value.replaceAll('.', '')) ?? 0;

                            controller.tongTienKhachThanhToanTheoTong = soTien;
                            controller.update();
                          },
                        ),

                        const SizedBox(height: 8),

                        Align(
                          alignment: Alignment.centerRight,
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              /// 🔴 Tổng tiền cần thu
                              Row(
                                children: [
                                  const Text(
                                    "Tổng cần chi:",
                                    style: TextStyle(fontWeight: FontWeight.w500),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    "${NumberFormat("#,###", "vi_VN")
                                        .format(controller.tongTienCanThu)} đ",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.red,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(width: 24),

                              /// 🔵 Khách thanh toán
                              Row(
                                children: [
                                  const Text(
                                    "Số tiền TT:",
                                    style: TextStyle(fontWeight: FontWeight.w500),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    "${NumberFormat("#,###", "vi_VN").format(controller.tongTienKhachThanhToan)} đ",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.blue,
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(width: 24),

                              /// 🟠 / 🟢 Công nợ còn lại
                              Row(
                                children: [
                                  const Text(
                                    "Còn lại:",
                                    style: TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    "${NumberFormat("#,###", "vi_VN")
                                        .format(
                                      (controller.tongTienCanThu -
                                          controller.tongTienKhachThanhToan) <
                                          0
                                          ? 0
                                          : controller.tongTienCanThu -
                                          controller.tongTienKhachThanhToan,
                                    )} đ",
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: (controller.tongTienCanThu -
                                          controller.tongTienKhachThanhToan) <=
                                          0
                                          ? Colors.green
                                          : Colors.orange,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                  const SizedBox(height: 14),

                  /// ===============================
                  /// 4️⃣ CÁC TRƯỜNG CHUNG
                  /// ===============================
                  Text("Ngày chi"),
                  const SizedBox(height: 4),
                  TextFormField(
                    readOnly: true,
                    decoration: InputDecoration(
                      suffixIcon:
                      const Icon(Icons.calendar_today, size: 18),
                      hintText: df.format(controller.ngayThuChi),
                    ),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: controller.ngayThuChi,
                        firstDate: DateTime(2020),
                        lastDate: DateTime(2100),
                      );
                      if (picked != null) {
                        controller.ngayThuChi = picked;
                        controller.update();
                      }
                    },
                  ),

                  const SizedBox(height: 12),

                  Text("Người thực hiện"),
                  const SizedBox(height: 4),
                  DropdownButtonFormField<String>(
                    dropdownColor: Colors.white,
                    value: controller.nguoiThucHienId,
                    items: controller.userList.map((u) {
                      return DropdownMenuItem(
                        value: u["uid"].toString(),
                        child: Text(u["name"] ?? ""),
                      );
                    }).toList(),
                    onChanged: (v) {
                      controller.nguoiThucHienId = v;
                    },
                    hint: const Text("Chọn người thực hiện"),
                  ),

                  const SizedBox(height: 12),

                  Text("Thông tin chuyển khoản"),
                  const SizedBox(height: 4),
                  TextField(
                    controller: controller.thongTinChuyenKhoanCtrl,
                    minLines: 3,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      hintText: "Nhập nội dung chuyển khoản...",
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("Hủy"),
        ),
        ElevatedButton.icon(
          icon: const Icon(Icons.save),
          label: const Text("Xác nhận thu tiền"),
          onPressed: controller.isLoadingThuTien
              ? null
              : () async {
            /// validate cơ bản
            if (controller.tongTienKhachThanhToan <= 0) {
              AppToast.error("Vui lòng nhập số tiền cần thanh toán");
              return;
            }

            if (controller.nguoiThucHienId == null) {
              AppToast.error("Vui lòng chọn người thực hiện");
              return;
            }

            await controller.submitThuTienCongNo();
          },
        ),
      ],
    );
  }

}

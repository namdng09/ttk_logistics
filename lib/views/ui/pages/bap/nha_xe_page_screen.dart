import 'package:ttk_logistics/controller/nha_xe_controller.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_bao_hiem_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_cuoc_van_chuyen_thue_ngoai_page_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_phi_luu_ca_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_qua_kho_qua_tai_page_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/chi_phi_hai_quan_tong_hop_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/tra_xe_cung_tinh_page_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/tra_xe_cung_tuyen_page_screen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:intl/intl.dart';
import 'package:remixicon/remixicon.dart';
import '../../../../helper/theme/admin_theme.dart';
import '../../../../helper/widgets/my_spacing.dart';
import '../../../../helper/widgets/my_text.dart';

class NhaXePageScreen extends StatefulWidget with UIMixin {
  const NhaXePageScreen({super.key});

  @override
  State<NhaXePageScreen> createState() => _NhaXePageScreenState();
}

class _NhaXePageScreenState extends State<NhaXePageScreen> {
  final controller = Get.put(NhaXeController());
  final contentTheme = AdminTheme.theme.contentTheme;

  /// ------------------------------
  /// 📋 Bảng danh sách nhà xe
  /// ------------------------------
  /// ------------------------------
  /// 📋 Bảng danh sách nhà xe
  /// ------------------------------
  Widget buildTable(List<dynamic> jsonData) {
    final contentTheme = AdminTheme.theme.contentTheme;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: DataTable(
          columnSpacing: 16,
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
          columns: const [
            // ---------------------------------------
            // 🧩 Cột chức năng (đưa lên đầu tiên)
            // ---------------------------------------
            DataColumn(label: Text("Chức năng")),
            DataColumn(label: Text("Cấu hình")),

            // ---------------------------------------
            // 🔹 Các cột thông tin chính
            // ---------------------------------------
            DataColumn(label: Text("Tên nhà xe")),
            DataColumn(label: Text("Địa chỉ")),
            DataColumn(label: Text("Điện thoại")),
            DataColumn(label: Text("Email")),
            DataColumn(label: Text("MST")),

            // ---------------------------------------
            // 🔹 Các cột bổ sung
            // ---------------------------------------
            DataColumn(label: Text("Người đại diện")),
            DataColumn(label: Text("SĐT người đại diện")),
            DataColumn(label: Text("Chức vụ")),
            DataColumn(label: Text("Xe nhà")),
            DataColumn(label: Text("Công nợ")),
          ],
          rows: List.generate(jsonData.length, (i) {
            final item = jsonData[i] as Map<String, dynamic>;
            final NumberFormat moneyFormat = NumberFormat.decimalPattern('vi_VN');

            final isXeNha = item["field_xe_nha"] == 1 ||
                item["field_xe_nha"] == true ||
                item["field_xe_nha"] == "1";

            return DataRow(cells: [
              // =====================================================
              // ⚙️ CỘT CHỨC NĂNG (popup menu)
              // =====================================================
              DataCell(
                Center(
                  child: PopupMenuButton<int>(
                    offset: const Offset(0, 44),
                    clipBehavior: Clip.antiAliasWithSaveLayer,
                    shape: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    onSelected: (value) {
                      switch (value) {
                        case 1: // Sửa
                          showNhaXeDialog(context, existingData: item);
                          break;
                        case 2: // Xoá
                          showDeleteConfirmDialog(context, item['nid']);
                          break;
                        case 3: // In hợp đồng
                          controller.openHopDongNhaXeEditor(item);
                          break;
                      }
                    },
                    itemBuilder: (BuildContext context) => [
                      PopupMenuItem(
                        value: 1,
                        padding: MySpacing.xy(16, 8),
                        child: Row(
                          children: [
                            const Icon(Icons.edit, color: Colors.blue, size: 18),
                            MySpacing.width(8),
                            MyText.bodyMedium("Sửa", fontWeight: 600),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 2,
                        padding: MySpacing.xy(16, 8),
                        child: Row(
                          children: [
                            const Icon(Icons.delete, color: Colors.red, size: 18),
                            MySpacing.width(8),
                            MyText.bodyMedium("Xoá", fontWeight: 600),
                          ],
                        ),
                      ),
                      const PopupMenuDivider(),
                      PopupMenuItem(
                        value: 3,
                        padding: MySpacing.xy(16, 8),
                        child: Row(
                          children: [
                            const Icon(Icons.print, color: Colors.orange, size: 18),
                            MySpacing.width(8),
                            MyText.bodyMedium("In hợp đồng", fontWeight: 600),
                          ],
                        ),
                      ),
                    ],
                    child: MyContainer(
                      color: contentTheme.secondary,
                      paddingAll: 8,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Remix.tools_line,
                              size: 18, color: contentTheme.onSecondary),
                          MySpacing.width(4),
                          Icon(Remix.arrow_down_s_line,
                              size: 18, color: contentTheme.onSecondary),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              DataCell(
                PopupMenuButton<int>(
                  offset: const Offset(0, 44),
                  clipBehavior: Clip.antiAliasWithSaveLayer,
                  shape: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: BorderSide.none,
                  ),
                  onSelected: (value) {
                    final khachHang = item["field_ho_ten"] ?? item["title"] ?? "Nhà xe";
                    final nid = item["nid"];

                    switch (value) {
                      case 1:
                      // 👉 Cước vận tải
                        Get.to(() => const CauHinhCuocVanChuyenThueNgoaiPageScreen(),
                          arguments: {
                            "type": "nha_xe",
                            "nid": nid,
                            "tenNhaXe": khachHang,
                          },
                        );
                        return;

                      case 2:
                      // 👉 Phí hải quan
                        Get.to(() => const ChiPhiHaiQuanTongHopScreen(), arguments: {
                          "type": "nha_xe",
                          "nid": nid,
                          "tenKhachHang": khachHang,
                        });
                        return;

                      case 3:
                      // 👉 Phí bảo hiểm
                        Get.to(() => const CauHinhBaoHiemScreen(), arguments: {
                          "type": "nha_xe",
                          "nid": nid,
                          "tenKhachHang": khachHang,
                        });
                        return;

                      case 4:
                      // 👉 Phí lưu ca
                        Get.to(() => const CauHinhPhiLuuCaScreen(), arguments: {
                          "type": "nha_xe",
                          "nid": nid,
                          "tenKhachHang": khachHang,
                        });
                        return;

                      case 5:
                      // 👉 Phí cùng tỉnh khác tuyến
                        Get.to(() => const TraXeCungTinhPageScreen(), arguments: {
                          "type": "nha_xe",
                          "nid": nid,
                          "tenKhachHang": khachHang,
                        });
                        return;

                      case 6:
                      // 👉 Phí quá khổ quá tải
                        Get.to(() => const CauHinhQuaKhoQuaTaiPageScreen(), arguments: {
                          "type": "nha_xe",
                          "nid": nid,
                          "tenKhachHang": khachHang,
                        });
                        return;
                      case 8:
                      // 👉 Phí cùng tuyến khác tỉnh
                        Get.to(() => const TraXeCungTuyenPageScreen(), arguments: {
                          "type": "nha_xe",
                          "nid": nid,
                          "tenKhachHang": khachHang,
                        });
                        return;
                    }
                  },
                  itemBuilder: (BuildContext context) => [
                    PopupMenuItem(
                      value: 1,
                      padding: MySpacing.xy(16, 8),
                      height: 10,
                      child: MyText.bodyMedium("Cước vận tải", fontWeight: 600),
                    ),
                    PopupMenuItem(
                      value: 2,
                      padding: MySpacing.xy(16, 8),
                      height: 10,
                      child: MyText.bodyMedium("Phí hải quan", fontWeight: 600),
                    ),
                    PopupMenuItem(
                      value: 3,
                      padding: MySpacing.xy(16, 8),
                      height: 10,
                      child: MyText.bodyMedium("Phí bảo hiểm", fontWeight: 600),
                    ),
                    PopupMenuItem(
                      value: 4,
                      padding: MySpacing.xy(16, 8),
                      height: 10,
                      child: MyText.bodyMedium("Phí lưu ca", fontWeight: 600),
                    ),
                    PopupMenuItem(
                      value: 5,
                      padding: MySpacing.xy(16, 8),
                      height: 10,
                      child: MyText.bodyMedium("Phí cùng tỉnh khác tuyến", fontWeight: 600),
                    ),
                    PopupMenuItem(
                      value: 6,
                      padding: MySpacing.xy(16, 8),
                      height: 10,
                      child: MyText.bodyMedium("Phí quá khổ quá tải", fontWeight: 600),
                    ),
                    PopupMenuItem(
                      value: 8,
                      padding: MySpacing.xy(16, 8),
                      height: 10,
                      child:
                      MyText.bodyMedium("Phí cùng tuyến khác tỉnh", fontWeight: 600),
                    ),
                  ],
                  child: MyContainer(
                    color: contentTheme.secondary,
                    paddingAll: 8,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Remix.tools_line,
                            size: 18, color: contentTheme.onSecondary),
                        MySpacing.width(4),
                        Icon(Remix.arrow_down_s_line,
                            size: 18, color: contentTheme.onSecondary),
                      ],
                    ),
                  ),
                ),
              ),

              // =====================================================
              // 🔹 Các cột dữ liệu nhà xe
              // =====================================================
              DataCell(Text(item["title"] ?? "")),
              DataCell(Text(item["field_dia_chi"] ?? "")),
              DataCell(Text(item["field_so_dien_thoai"] ?? "")),
              DataCell(Text(item["field_email"] ?? "")),
              DataCell(Text(item["field_mst"] ?? "")),
              DataCell(Text(item["field_nguoi_dai_dien"] ?? "")),
              DataCell(Text(item["field_dien_thoai_nguoi_dai_dien"] ?? "")),
              DataCell(Text(item["field_chuc_vu_nguoi_dai_dien"] ?? "")),
              DataCell(
                Center(
                  child: isXeNha
                      ? const Icon(Remix.check_line, color: Colors.green)
                      : const SizedBox(),
                ),
              ),
              DataCell(
                Text(
                  moneyFormat.format(
                    num.tryParse(item['field_cong_no']?.toString() ?? '0') ?? 0,
                  ),
                  textAlign: TextAlign.right,
                ),
              ),
            ]);
          }),
        ),
      ),
    );
  }

  /// ------------------------------
  /// 🧱 Giao diện chính
  /// ------------------------------
  @override
  Widget build(BuildContext context) {
    return GetBuilder<NhaXeController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Nhà xe',
          actions: [
            // ➕ Thêm
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars();
                showNhaXeDialog(context);
              },
              color: contentTheme.success,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.add, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium("Thêm", color: contentTheme.onSuccess),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // 🔍 Tìm kiếm
            MyContainer(
              onTap: () {},
              color: contentTheme.primary,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium("Tìm kiếm", color: contentTheme.onPrimary),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // 🔄 Khôi phục
            MyContainer(
              onTap: () {
                controller.fetchNhaXe();
              },
              color: contentTheme.warning,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.refresh, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium("Khôi phục",
                      color: contentTheme.onWarning),
                ],
              ),
            ),
          ],
          child: MyContainer(
            child: controller.isLoading.value
                ? const Center(child: CircularProgressIndicator())
                : buildTable(
              controller.nhaXeList.map((e) => e.toJson()).toList(),
            ),
          ),
        );
      },
    );
  }

  /// ------------------------------
  /// 🪶 Dialog thêm / sửa nhà xe
  /// ------------------------------
  void showNhaXeDialog(BuildContext context,
      {Map<String, dynamic>? existingData})
  {
    final tenCtrl = TextEditingController(text: existingData?['title'] ?? '');
    final diaChiCtrl =
    TextEditingController(text: existingData?['field_dia_chi'] ?? '');
    final dienThoaiCtrl =
    TextEditingController(text: existingData?['field_so_dien_thoai'] ?? '');
    final emailCtrl =
    TextEditingController(text: existingData?['field_email'] ?? '');
    final mstCtrl =
    TextEditingController(text: existingData?['field_mst'] ?? '');
    final nguoiDaiDienCtrl =
    TextEditingController(text: existingData?['field_nguoi_dai_dien'] ?? '');
    final chucVuNguoiDaiDienCtrl = TextEditingController(
        text: existingData?['field_chuc_vu_nguoi_dai_dien'] ?? '');
    final dienThoaiNguoiDaiDienCtrl = TextEditingController(
        text: existingData?['field_dien_thoai_nguoi_dai_dien'] ?? '');
    final thongTinTaiKhoanCtrl = TextEditingController(
        text: existingData?['field_thong_tin_tai_khoan'] ?? '');

    bool xeNha =
        existingData?['field_xe_nha'] == true || existingData?['field_xe_nha'] == 1;

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setState) {
          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 700, minWidth: 500),
              child: Padding(
                padding: MySpacing.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // -------------------------
                    // 🔹 Tiêu đề
                    // -------------------------
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        MyText.titleMedium(
                            existingData == null
                                ? "Thêm nhà xe"
                                : "Sửa thông tin nhà xe",
                            fontWeight: 700),
                        InkWell(
                            onTap: () => Get.back(),
                            child: const Icon(Remix.close_line)),
                      ],
                    ),
                    MySpacing.height(20),

                    // ======================================================
                    // 🧩 DÒNG 1: Điện thoại, Email, MST, Người đại diện
                    // ======================================================
                    Row(
                      children: [
                        Expanded(
                            child: _buildInput(
                                "Điện thoại", dienThoaiCtrl, isPhone: true)),
                        MySpacing.width(12),
                        Expanded(
                            child:
                            _buildInput("Email", emailCtrl, isEmail: true)),
                        MySpacing.width(12),
                        Expanded(child: _buildInput("MST", mstCtrl)),
                        MySpacing.width(12),
                        Expanded(child: _buildInput("Người đại diện", nguoiDaiDienCtrl)),
                      ],
                    ),

                    // ======================================================
                    // 🧩 DÒNG 2: Tên nhà xe
                    // ======================================================
                    MySpacing.height(12),
                    _buildInput("Tên nhà xe", tenCtrl),

                    // ======================================================
                    // 🧩 DÒNG 3: Địa chỉ
                    // ======================================================
                    MySpacing.height(12),
                    _buildInput("Địa chỉ", diaChiCtrl),

                    // ======================================================
                    // 🧩 DÒNG 4: Chức vụ, SĐT người đại diện
                    // ======================================================
                    MySpacing.height(12),
                    Row(
                      children: [
                        Expanded(
                            flex: 2,
                            child: _buildInput(
                                "Chức vụ người đại diện", chucVuNguoiDaiDienCtrl)),
                        MySpacing.width(12),
                        Expanded(
                            flex: 2,
                            child: _buildInput("SĐT người đại diện",
                                dienThoaiNguoiDaiDienCtrl,
                                isPhone: true)),
                      ],
                    ),

                    // ======================================================
                    // 🧩 DÒNG 5: Thông tin tài khoản + Checkbox xe nhà
                    // ======================================================
                    MySpacing.height(12),
                    _buildInput("Thông tin tài khoản", thongTinTaiKhoanCtrl,
                        maxLines: 3),

                    MySpacing.height(8),
                    Row(
                      children: [
                        Checkbox(
                          value: xeNha,
                          onChanged: (val) => setState(() => xeNha = val ?? false),
                        ),
                        const Text("Xe nhà"),
                      ],
                    ),

                    // ======================================================
                    // 🔹 Buttons
                    // ======================================================
                    MySpacing.height(16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        MyContainer(
                          onTap: () => Get.back(),
                          color: contentTheme.secondary.withAlpha(36),
                          padding: MySpacing.xy(12, 8),
                          child: MyText.bodySmall("Đóng",
                              color: contentTheme.secondary),
                        ),
                        MySpacing.width(12),
                        MyContainer(
                          onTap: () async {
                            final data = {
                              "nid": existingData?['nid'], // ✅ gửi kèm nếu đang sửa
                              "title": tenCtrl.text.trim(),
                              "field_dia_chi": diaChiCtrl.text.trim(),
                              "field_dien_thoai": dienThoaiCtrl.text.trim(),
                              "field_email": emailCtrl.text.trim(),
                              "field_mst": mstCtrl.text.trim(),
                              "field_nguoi_dai_dien": nguoiDaiDienCtrl.text.trim(),
                              "field_chuc_vu_nguoi_dai_dien": chucVuNguoiDaiDienCtrl.text.trim(),
                              "field_dien_thoai_nguoi_dai_dien":
                              dienThoaiNguoiDaiDienCtrl.text.trim(),
                              "field_thong_tin_tai_khoan": thongTinTaiKhoanCtrl.text.trim(),
                              "field_xe_nha": xeNha ? 1 : 0,
                            };

                            if (data["title"].isEmpty && data["field_dien_thoai"].isEmpty) {
                              Get.snackbar("Thiếu dữ liệu", "Vui lòng nhập Tên nhà xe hoặc SĐT!",
                                  backgroundColor: Colors.orange.shade100,
                                  colorText: Colors.orange.shade900);
                              return;
                            }

                            if (existingData != null && existingData['nid'] != null) {
                              await controller.updateNhaXeOnServer(existingData['nid'], data);
                            } else {
                              await controller.saveNhaXe(data);
                            }
                          },
                          color: contentTheme.primary,
                          padding: MySpacing.xy(12, 8),
                          child: Obx(() => controller.isSaving.value
                              ? const SizedBox(
                              width: 18,
                              height: 18,
                              child:
                              CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : MyText.bodySmall("Lưu", color: contentTheme.onPrimary)),
                        )
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  /// ------------------------------
  /// 🗑️ Dialog xác nhận xoá
  /// ------------------------------
  void showDeleteConfirmDialog(BuildContext context, int nid) {
    showDialog(
      context: context,
      builder: (_) {
        return Dialog(
          shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 450, minWidth: 250),
            child: Padding(
              padding: MySpacing.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.warning_amber_rounded,
                      color: Colors.red.shade600, size: 48),
                  MySpacing.height(20),
                  MyText.bodyMedium("Xác nhận xoá", fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodySmall(
                    "Bạn có chắc chắn muốn xoá nhà xe này không?",
                    textAlign: TextAlign.center,
                  ),
                  MySpacing.height(20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      MyContainer(
                        onTap: () => Get.back(),
                        padding: MySpacing.xy(12, 8),
                        color: contentTheme.secondary.withOpacity(0.3),
                        child: MyText.bodySmall("Huỷ",
                            color: contentTheme.secondary),
                      ),
                      MySpacing.width(12),
                      MyContainer(
                        onTap: () {
                          Get.back();
                          controller.deleteNhaXe(nid);
                        },
                        padding: MySpacing.xy(12, 8),
                        color: Colors.red.shade600,
                        child:
                        MyText.bodySmall("Xoá", color: Colors.white),
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

  Widget _buildInput(String label, TextEditingController ctrl,
      {bool isPhone = false, bool isEmail = false, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.labelMedium(label),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          keyboardType: isPhone
              ? TextInputType.phone
              : (isEmail ? TextInputType.emailAddress : TextInputType.text),
          maxLines: maxLines,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            isDense: true,
            contentPadding: EdgeInsets.all(12),
          ),
        ),
      ],
    );
  }

}

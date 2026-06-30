import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_bao_hiem_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_phi_luu_ca_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cau_hinh_qua_kho_qua_tai_page_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/cuoc_van_chuyen_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/chi_phi_hai_quan_tong_hop_screen.dart'; // 👈 thêm import
import 'package:ttk_logistics/views/ui/pages/bap2/tra_xe_cung_tinh_page_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/tra_xe_cung_tuyen_page_screen.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:intl/intl.dart';
import 'package:remixicon/remixicon.dart';
import '../../../../helper/constants/customer_labels.dart';
import '../../../../helper/theme/admin_theme.dart';
import '../../../../helper/widgets/my_spacing.dart';
import '../../../../helper/widgets/my_text.dart';
import '../../../../controller/khach_hang_controller.dart';

class KhachHangPageScreen extends StatefulWidget with UIMixin {
  const KhachHangPageScreen({super.key});

  @override
  State<KhachHangPageScreen> createState() => _KhachHangPageScreenState();
}

class _KhachHangPageScreenState extends State<KhachHangPageScreen> {
  final controller = Get.put(KhachHangController());
  final contentTheme = AdminTheme.theme.contentTheme;

  // ---------------------------
  // 🧾 Xây dựng bảng khách hàng
  // ---------------------------
  Widget buildKhachHangTable(List<dynamic> jsonData) {
    final Set<String> dynamicCols = {};
    for (var item in jsonData) {
      if (item is Map) {
        for (var k in item.keys) {
          if (k != 'nid' &&
              k != 'text' &&
              k != 'field_cuoc_van_tai' &&
              k != 'field_phi_hai_quan' &&
              k != 'field_phi_bao_hiem' &&
              k != 'field_phi_luu_ca' &&
              k != 'field_phi_cung_tinh_khac_tuyen' &&
              k != 'field_phi_hang_nang' &&
              k != 'field_phi_cung_tuyen_khac_tinh' &&
              k != 'field_cong_no'
          ) {
            dynamicCols.add(k);
          }
        }
      }
    }

    final cols = dynamicCols.toList();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: DataTable(
          columnSpacing: 16,
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
          columns: [
            ...cols.map(
                  (c) => DataColumn(
                label: Tooltip(
                  message: customerLabels[c] ?? c,
                  child: Text(
                    customerLabels[c] ?? c,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
            const DataColumn(label: Text("Công nợ")),
            const DataColumn(label: Text("Sửa")),
            const DataColumn(label: Text("Xoá")),
            const DataColumn(label: Text("Cấu hình")),
          ],
          rows: List.generate(jsonData.length, (i) {
            final item = jsonData[i] as Map<String, dynamic>;
            final NumberFormat moneyFormat = NumberFormat.decimalPattern('vi_VN');

            return DataRow(
              cells: [
                ...cols.map((c) => DataCell(Text(item[c]?.toString() ?? ''))),
                DataCell(
                  Text(
                    moneyFormat.format(
                      num.tryParse(item['field_cong_no']?.toString() ?? '0') ?? 0,
                    ),
                    textAlign: TextAlign.right,
                  ),
                ),
                // ✏️ Sửa khách hàng
                DataCell(Center(
                  child: IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blue),
                    onPressed: () {
                      Get.closeAllSnackbars();
                      showKhachHangDialog(context, existingData: item);
                    },
                  ),
                )),

                // ❌ Xoá khách hàng
                DataCell(Center(
                  child: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () {
                      Get.closeAllSnackbars();
                      showDeleteConfirmDialog(context, item['nid']);
                    },
                  ),
                )),

                // ⚙️ Menu cấu hình
                DataCell(
                  PopupMenuButton<int>(
                    offset: const Offset(0, 44),
                    clipBehavior: Clip.antiAliasWithSaveLayer,
                    shape: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide: BorderSide.none,
                    ),
                    onSelected: (value) {
                      final khachHang =
                          item["field_ho_ten"] ?? item["title"] ?? "Khách hàng";
                      final nid = item["nid"];

                      switch (value) {
                        case 1:
                        // 👉 Cước vận tải
                          Get.to(() => const CuocVanChuyenScreen(), arguments: {
                            "type": "khach_hang",
                            "nid": nid,
                            "tenKhachHang": khachHang,
                          });
                          return;

                        case 2:
                        // 👉 Phí hải quan
                          Get.to(() => const ChiPhiHaiQuanTongHopScreen(), arguments: {
                            "type": "khach_hang",
                            "nid": nid,
                            "tenKhachHang": khachHang,
                          });
                          return;

                        case 3:
                        // 👉 Phí bảo hiểm
                          Get.to(() => const CauHinhBaoHiemScreen(), arguments: {
                            "type": "khach_hang",
                            "nid": nid,
                            "tenKhachHang": khachHang,
                          });
                          return;

                        case 4:
                        // 👉 Phí lưu ca
                          Get.to(() => const CauHinhPhiLuuCaScreen(), arguments: {
                            "type": "khach_hang",
                            "nid": nid,
                            "tenKhachHang": khachHang,
                          });
                          return;

                        case 5:
                        // 👉 Phí cùng tỉnh khác tuyến
                          Get.to(() => const TraXeCungTinhPageScreen(), arguments: {
                            "type": "khach_hang",
                            "nid": nid,
                            "tenKhachHang": khachHang,
                          });
                          return;

                        case 6:
                        // 👉 Phí quá khổ quá tải
                          Get.to(() => const CauHinhQuaKhoQuaTaiPageScreen(), arguments: {
                            "type": "khach_hang",
                            "nid": nid,
                            "tenKhachHang": khachHang,
                          });
                          return;
                        case 8:
                        // 👉 Phí cùng tuyến khác tỉnh
                          Get.to(() => const TraXeCungTuyenPageScreen(), arguments: {
                            "type": "khach_hang",
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
              ],
            );
          }),
        ),
      ),
    );
  }

  // ---------------------------
  // 🧩 Giao diện chính
  // ---------------------------
  @override
  Widget build(BuildContext context) {
    return GetBuilder<KhachHangController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Khách hàng',
          actions: [
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars();
                showKhachHangDialog(context);
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

            // 🔍 Nút tìm kiếm
            MyContainer(
              onTap: () => Get.snackbar("Tìm kiếm", "Mở bộ lọc tìm kiếm"),
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

            // 🔄 Nút khôi phục
            MyContainer(
              onTap: () => controller.fetchKhachHang(),
              color: contentTheme.warning,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.refresh, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium("Khôi phục", color: contentTheme.onWarning),
                ],
              ),
            ),
          ],
          child: MyContainer(
            child: controller.isLoading.value
                ? const Center(child: CircularProgressIndicator())
                : buildKhachHangTable(
              controller.khachHangList.map((e) => e.toJson()).toList(),
            ),
          ),
        );
      },
    );
  }

  // ---------------------------
  // Các hàm nhập và dialog giữ nguyên
  // ---------------------------
  void showKhachHangDialog(
      BuildContext context, {Map<String, dynamic>? existingData}) {
    final maKhCtrl = TextEditingController(text: existingData?['field_ma_kh'] ?? '');
    final mstCtrl = TextEditingController(text: existingData?['field_mst'] ?? '');
    final soNgayCongNoCtrl = TextEditingController(text: existingData?['field_so_ngay_han_cong_no'].toString() ?? '');
    final dienThoaiCtrl = TextEditingController(text: existingData?['field_dien_thoai'] ?? '');
    final emailCtrl =  TextEditingController(text: existingData?['field_email'] ?? '');
    final hoTenCtrl =
    TextEditingController(text: existingData?['field_ho_ten'] ?? '');
    final diaChiCtrl =
    TextEditingController(text: existingData?['field_dia_chi'] ?? '');
    final nguoiDaiDienCtrl =
    TextEditingController(text: existingData?['field_nguoi_dai_dien'] ?? '');
    final chucVuNguoiDaiDienCtrl = TextEditingController(
        text: existingData?['field_chuc_vu_nguoi_dai_dien'] ?? '');
    final dienThoaiNguoiDaiDienCtrl = TextEditingController(
        text: existingData?['field_dien_thoai_nguoi_dai_dien'] ?? '');
    final thongTinTaiKhoanCtrl = TextEditingController(
        text: existingData?['field_thong_tin_tai_khoan'] ?? '');

    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 700, minWidth: 500),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // 🔹 Header
              Padding(
                padding: MySpacing.fromLTRB(20, 20, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    MyText.titleMedium(
                      existingData == null
                          ? "Thêm khách hàng"
                          : "Sửa khách hàng",
                      fontWeight: 700,
                    ),
                    InkWell(
                        onTap: () => Get.back(),
                        child: const Icon(RemixIcons.close_line)),
                  ],
                ),
              ),

              // 🔹 Form content
              Padding(
                padding: MySpacing.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // =========================
                    // 🧩 DÒNG 1
                    // =========================
                    Row(
                      children: [
                        Expanded(child: _buildInput("Mã KH", maKhCtrl)),
                        MySpacing.width(12),
                        Expanded(child: _buildInput("MST", mstCtrl)),
                      ],
                    ),
                    Row(
                      children: [
                        Expanded(
                            child: _buildInput("Điện thoại", dienThoaiCtrl,
                                isPhone: true)),
                        MySpacing.width(12),
                        Expanded(
                            child:
                            _buildInput("Email", emailCtrl, isEmail: true)),
                      ],
                    ),

                    // =========================
                    // 🧩 DÒNG 2: Tên khách hàng
                    // =========================
                    MySpacing.height(12),
                    _buildInput("Tên khách hàng", hoTenCtrl),

                    // =========================
                    // 🧩 DÒNG 3: Địa chỉ
                    // =========================
                    MySpacing.height(12),
                    _buildInput("Địa chỉ", diaChiCtrl),

                    // =========================
                    // 🧩 DÒNG 4: Người đại diện, chức vụ, điện thoại
                    // =========================
                    MySpacing.height(12),
                    Row(
                      children: [
                        Expanded(
                            flex: 2,
                            child:
                            _buildInput("Người đại diện", nguoiDaiDienCtrl)),
                        MySpacing.width(12),
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
                    MySpacing.height(12),
                    Row(
                      children: [
                        Expanded(
                            flex: 2,
                            child: _buildInput("Số ngày hạn công nợ", soNgayCongNoCtrl)),
                      ],
                    ),

                    // =========================
                    // 🧩 DÒNG 5: Thông tin tài khoản
                    // =========================
                    MySpacing.height(12),
                    _buildInput("Thông tin tài khoản", thongTinTaiKhoanCtrl,
                        maxLines: 3),
                  ],
                ),
              ),

              const Divider(height: 0),

              // 🔹 Buttons
              Padding(
                padding: MySpacing.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    MyContainer(
                      onTap: () => Get.back(),
                      color: contentTheme.secondary.withAlpha(36),
                      padding: MySpacing.xy(12, 8),
                      child: MyText.bodySmall("Đóng",
                          fontWeight: 600, color: contentTheme.secondary),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        final data = {
                          "field_ma_kh": maKhCtrl.text,
                          "field_mst": mstCtrl.text,
                          "field_dien_thoai": dienThoaiCtrl.text,
                          "field_email": emailCtrl.text,
                          "field_ho_ten": hoTenCtrl.text,
                          "field_dia_chi": diaChiCtrl.text,
                          "field_nguoi_dai_dien": nguoiDaiDienCtrl.text,
                          "field_chuc_vu_nguoi_dai_dien":
                          chucVuNguoiDaiDienCtrl.text,
                          "field_dien_thoai_nguoi_dai_dien":
                          dienThoaiNguoiDaiDienCtrl.text,
                          "field_thong_tin_tai_khoan": thongTinTaiKhoanCtrl.text,
                          "field_so_ngay_han_cong_no": soNgayCongNoCtrl.text,
                        };

                        if (existingData != null && existingData['nid'] != null) {
                          controller.updateKhachHangOnServer(
                              existingData['nid'], data);
                        } else {
                          controller.saveKhachHang(data);
                        }
                      },
                      color: contentTheme.primary,
                      padding: MySpacing.xy(12, 8),
                      child: Obx(() {
                        return controller.isSaving.value
                            ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                            : MyText.bodySmall("Lưu",
                            fontWeight: 600,
                            color: contentTheme.onPrimary);
                      }),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

// ---------------------------
// 🔹 Reusable input widget
// ---------------------------
  Widget _buildInput(String label, TextEditingController ctrl,
      {bool isPhone = false, bool isEmail = false, int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
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
            decoration: InputDecoration(
              border: const OutlineInputBorder(),
              isDense: true,
              contentPadding: MySpacing.all(12),
            ),
          ),
        ],
      ),
    );
  }

  void showDeleteConfirmDialog(BuildContext context, int nid) {
    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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
                  "Bạn có chắc chắn muốn xoá khách hàng này không?",
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
                          fontWeight: 600, color: contentTheme.secondary),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        Get.back();
                        controller.deleteKhachHang(nid);
                      },
                      padding: MySpacing.xy(12, 8),
                      color: Colors.red.shade600,
                      child: MyText.bodySmall("Xoá",
                          fontWeight: 600, color: Colors.white),
                    ),
                  ],
                )
              ],
            ),
          ),
        ),
      ),
    );
  }
}

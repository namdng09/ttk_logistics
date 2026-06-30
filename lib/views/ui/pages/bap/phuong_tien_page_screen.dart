import 'package:kho555/controller/nha_xe_controller.dart';
import 'package:kho555/controller/phuong_tien_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';
import '../../../../helper/constants/customer_labels.dart';
import '../../../../helper/theme/admin_theme.dart';
import '../../../../helper/widgets/my_spacing.dart';
import '../../../../helper/widgets/my_text.dart';
import 'package:kho555/widgets/cau_hinh_chi_phi_khach_hang.dart';

import '../../../../services/phuong_tien_service.dart';

class PhuongTienPageScreen extends StatefulWidget with UIMixin {
  const PhuongTienPageScreen({super.key});

  @override
  State<PhuongTienPageScreen> createState() => _PhuongTienPageScreen();
}

class _PhuongTienPageScreen extends State<PhuongTienPageScreen> {
  final controller = Get.put(PhuongTienController());
 // 👈 khai báo controller
  Widget buildTable(List<dynamic> jsonData) {
    final Set<String> dynamicCols = {};
    for (var item in jsonData) {
      if (item is Map) {
        for (var k in item.keys) {
          if (k != 'nid' &&
              k != 'title' &&
              k != 'field_hoat_dong' &&
              k != 'field_lai_xe' &&
              k != 'field_nha_xe' &&
              k != 'field_tai_trong' &&
              k != 'field_ghi_chu' &&
              k != 'field_dinh_muc_nhien_lieu' &&
              k != 'field_ngay_do_dau' &&
              k != 'field_ngay_do_dau_time' &&
              k != 'field_so_dau' &&
              k != 'field_km' &&
              k != 'field_ngay_dang_kiem' &&
              k != 'field_trong_tai' &&
              k != 'field_the_tich'
          )
          {
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
          headingRowColor: MaterialStateProperty.all(Colors.grey.shade200),
          columns: [
            ...cols.map(
                  (c) => DataColumn(
                label: Tooltip(
                  message: PhuongTienLabels[c] ?? c,
                  child: Text(
                    PhuongTienLabels[c] ?? c,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ),
            const DataColumn(label: Text("Sửa")),
            const DataColumn(label: Text("Xoá")),
          ],
          rows: List.generate(jsonData.length, (i) {
            final item = jsonData[i] as Map<String, dynamic>;

            return DataRow(
              cells: [
                ...cols.map((c) {
                  if (c == 'field_xe_nha') {
                    final isXeNha = item[c] == 1 || item[c] == true || item[c] == "1";
                    return DataCell(
                      Center(
                        child: isXeNha ? Icon(
                          RemixIcons.check_line,
                          color: Colors.green,
                        ) : SizedBox()
                      ),
                    );
                  } else {
                    return DataCell(Text(item[c]?.toString() ?? ''));
                  }
                }),
                // Sửa
                DataCell(Center(
                  child: IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blue),
                    onPressed: () async {
                      Get.closeAllSnackbars();

                      // Gọi API khởi tạo form
                      final formData = await PhuongTienService.initPhuongTienForm();

                      // Lấy danh sách
                      final taiXeList = formData['taiXe'] ?? [];
                      final nhaXeList = formData['nhaXe'] ?? [];
                      final loaiXeList = formData['loaiXe'] ?? [];

                      // Gọi dialog và truyền existingData
                      showPhuongTienDialog(
                        context,
                        existingData: item,
                        taiXe: taiXeList,
                        nhaXe: nhaXeList,
                        loaiXe: loaiXeList,
                      );
                    },
                  ),
                )),

                // Xoá
                DataCell(Center(
                  child: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () {
                      Get.closeAllSnackbars(); // 👈 Đảm bảo không còn snackbar nào
                      showDeleteConfirmDialog(context, item['nid']);
                    },
                  ),
                )),
              ],
            );
          }),
        ),
      ),
    );
  }

  final contentTheme = AdminTheme.theme.contentTheme;

  @override
  Widget build(BuildContext context) {
    return GetBuilder<PhuongTienController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Nhà xe',
          actions: [
            MyContainer(
              onTap: () async {
                Get.closeAllSnackbars();

                // 👉 show loading spinner
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (_) => const Center(child: CircularProgressIndicator()),
                );

                try {
                  final formData = await PhuongTienService.initPhuongTienForm();

                  // 👉 đóng spinner
                  Get.back();

                  showPhuongTienDialog(
                    context,
                    taiXe: formData['taiXe'] ?? [],
                    nhaXe: formData['nhaXe'] ?? [],
                    loaiXe: formData['loaiXe'] ?? [],
                  );
                } catch (e) {
                  // 👉 đóng spinner nếu lỗi
                  Get.back();
                  Get.snackbar("Lỗi", e.toString());
                }
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

            // Nút Tìm kiếm
            MyContainer(
              onTap: () {
                // TODO: mở form tìm kiếm
                // Get.snackbar("Tìm kiếm", "Mở bộ lọc tìm kiếm khách hàng");
              },
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

            // Nút Khôi phục danh sách
            MyContainer(
              onTap: () {
                controller.fetchPhuongTien(); // gọi lại API để reset
              },
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
                : buildTable(controller.PhuongTienList.map((e) => e.toJson()).toList(),
            ),
          ),
        );
      },
    );
  }

  Widget modalHeading(String title) {
    return Padding(
      padding: MySpacing.nBottom(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          MyText.titleMedium(title, fontWeight: 700, muted: true),
          InkWell(onTap: () => Get.back(), child: Icon(RemixIcons.close_line)),
        ],
      ),
    );
  }

  String shortenLabel(String label, {int maxLength = 20}) {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength) + "...";
  }

  int? parseNid(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is String) return int.tryParse(value);
    if (value is Map && value['nid'] != null) return int.tryParse(value['nid'].toString());
    return null;
  }

  void showPhuongTienDialog(
      BuildContext context, {
        Map<String, dynamic>? existingData,
        required List<dynamic> taiXe,
        required List<dynamic> nhaXe,
        required List<dynamic> loaiXe,
      })
  {
    final bienKiemSoatCtrl = TextEditingController(
      text: existingData?['field_bien_kiem_soat'] ?? '',
    );

    int? selectedNhaXe;
    int? selectedLaiXe;
    String? selectedLoaiXe;

    if (existingData != null) {
      final nhaXeId = parseNid(existingData['field_nha_xe']);
      final laiXeId = parseNid(existingData['field_lai_xe']);
      final loaiXeId = existingData['field_loai_xe']?.toString();

      selectedNhaXe = nhaXe.any((e) => e['nid'] == nhaXeId) ? nhaXeId : null;
      selectedLaiXe = taiXe.any((e) => e['nid'] == laiXeId) ? laiXeId : null;
      selectedLoaiXe = loaiXe.contains(loaiXeId) ? loaiXeId : null;
    }

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setState) {
          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 600, minWidth: 400),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Thông tin phương tiện",
                        style: Theme.of(context).textTheme.titleMedium),

                    const SizedBox(height: 16),
                    // Biển kiểm soát
                    TextFormField(
                      controller: bienKiemSoatCtrl,
                      decoration: const InputDecoration(
                        labelText: "Biển kiểm soát",
                        border: OutlineInputBorder(),
                        isDense: true, // 👈 giảm chiều cao
                        contentPadding: EdgeInsets.symmetric(vertical: 16, horizontal: 12), // 👈 chỉnh padding
                      ),
                    ),
                    const SizedBox(height: 12), // 👈 cũng giảm khoảng cách giữa các ô

                    // Nhà xe
                    DropdownButtonFormField<int>(
                      value: selectedNhaXe,
                      dropdownColor: Colors.white,
                      decoration: const InputDecoration(
                        labelText: "Nhà xe",
                        border: OutlineInputBorder(),
                        isDense: true, // 👈 giảm chiều cao
                        contentPadding: EdgeInsets.symmetric(vertical: 16, horizontal: 12), // 👈 chỉnh padding
                      ),
                      items: nhaXe
                          .map((e) => DropdownMenuItem<int>(
                        value: e['nid'],
                        child: Text(e['title'] ?? ''),
                      ))
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          selectedNhaXe = val;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Lái xe
                    DropdownButtonFormField<int>(
                      dropdownColor: Colors.white,
                      value: selectedLaiXe,
                      decoration: const InputDecoration(
                        isDense: true, // 👈 giảm chiều cao
                        contentPadding: EdgeInsets.symmetric(vertical: 16, horizontal: 12), // 👈 chỉnh padding
                        labelText: "Lái xe",
                        border: OutlineInputBorder(),
                      ),
                      items: taiXe
                          .map((e) => DropdownMenuItem<int>(
                        value: e['nid'],
                        child: Text(e['title'] ?? ''),
                      ))
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          selectedLaiXe = val;
                        });
                      },
                    ),
                    const SizedBox(height: 16),

                    // Loại xe
                    DropdownButtonFormField<String>(
                      dropdownColor: Colors.white,
                      value: selectedLoaiXe,
                      decoration: const InputDecoration(
                        isDense: true, // 👈 giảm chiều cao
                        contentPadding: EdgeInsets.symmetric(vertical: 16, horizontal: 12), // 👈 chỉnh padding
                        labelText: "Loại xe",
                        border: OutlineInputBorder(),
                      ),
                      items: loaiXe
                          .map((e) => DropdownMenuItem<String>(
                        value: e.toString(),
                        child: Text(e.toString()),
                      ))
                          .toList(),
                      onChanged: (val) {
                        setState(() {
                          selectedLoaiXe = val;
                        });
                      },
                    ),

                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                            onPressed: () => Get.back(), child: const Text("Đóng")),
                        const SizedBox(width: 12),
                        ElevatedButton(
                          onPressed: () {
                            final dataToSave = {
                              "field_bien_kiem_soat": bienKiemSoatCtrl.text,
                              "field_nha_xe": selectedNhaXe,
                              "field_lai_xe": selectedLaiXe,
                              "field_loai_xe": selectedLoaiXe,
                            };

                            if (existingData != null && existingData['nid'] != null) {
                              controller.updatePhuongTienOnServer(existingData['nid'], dataToSave);
                            } else {
                              controller.savePhuongTien(dataToSave);
                            }
                          },
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
                                : const Text("Lưu");
                          }),
                        )
                      ],
                    )
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  void showDeleteConfirmDialog(BuildContext context, int nid) {
    showDialog(
      context: context,
      builder: (_) {
        return Dialog(
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
                  MyText.bodyMedium(
                    "Bạn có chắc chắn muốn xoá nhà xe này không?",
                    maxLines: 4,
                    fontWeight: 600,
                    textAlign: TextAlign.center,
                  ),
                  MySpacing.height(20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Nút Huỷ
                      MyContainer(
                        onTap: () => Get.back(),
                        padding: MySpacing.xy(12, 8),
                        color: contentTheme.secondary.withOpacity(0.3),
                        child: MyText.bodySmall("Huỷ",
                            fontWeight: 600, color: contentTheme.secondary),
                      ),
                      MySpacing.width(12),
                      // Nút Xoá
                      MyContainer(
                        onTap: () {
                          Get.back(); // luôn đóng dialog trước
                          controller.deletePhuongTien(nid); // chỉ lo gọi API
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
        );
      },
    );
  }

}

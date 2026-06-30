import 'package:amount_input_formatter/amount_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:intl/intl.dart';
import 'package:remixicon/remixicon.dart';
import 'package:ttk_logistics/controller/lai_xe_controller.dart';
import '../../../../helper/constants/customer_labels.dart';
import '../../../../helper/theme/admin_theme.dart';
import '../../../../helper/widgets/my_spacing.dart';
import '../../../../helper/widgets/my_text.dart';

class LaiXePageScreen extends StatefulWidget with UIMixin {
  const LaiXePageScreen({super.key});

  @override
  State<LaiXePageScreen> createState() => _LaiXePageScreenState();
}

class _LaiXePageScreenState extends State<LaiXePageScreen> {
  final controller = Get.put(LaiXeController());
 // 👈 khai báo controller
  Widget buildTable(List<dynamic> jsonData) {
    final Set<String> dynamicCols = {};
// print('jsonData $jsonData'); // TODO: remove debug
    for (var item in jsonData) {
      if (item is Map) {
        for (var k in item.keys) {
          if (k != 'nid' &&
              k != 'title' &&
              k != 'field_hoat_dong' &&
              k != 'field_loai_bang_lai') {
            dynamicCols.add(k);
          }
        }
      }
    }

    final cols = dynamicCols.toList();

    // Các cột số cần căn phải + format
    const numericFields = {
      'field_ngay_cong',
      'field_bao_hiem',
      'field_luong_thang',
      'field_luong_ngay',
      'field_tien_an'
    };

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
                  message: laiXeLabels[c] ?? c,
                  child: Text(
                    laiXeLabels[c] ?? c,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                numeric: numericFields.contains(c), // 👈 căn phải header
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
                  var value = item[c];
                  String displayValue = '';

                  if (numericFields.contains(c)) {
                    // format số
                    final parsed = double.tryParse(value?.toString() ?? '');
                    if (parsed != null) {
                      displayValue =
                          NumberFormat.decimalPattern('vi_VN').format(parsed.toInt());
                    }
                  } else {
                    displayValue = value?.toString() ?? '';
                  }

                  return DataCell(
                    Align(
                      alignment: numericFields.contains(c)
                          ? Alignment.centerRight
                          : Alignment.centerLeft,
                      child: Text(displayValue),
                    ),
                  );
                }),

                // Sửa
                DataCell(Center(
                  child: IconButton(
                    icon: const Icon(Icons.edit, color: Colors.blue),
                    onPressed: () {
                      Get.closeAllSnackbars();
                      showLaiXeDialog(context, existingData: item);
                    },
                  ),
                )),
                // Xoá
                DataCell(Center(
                  child: IconButton(
                    icon: const Icon(Icons.delete, color: Colors.red),
                    onPressed: () {
                      Get.closeAllSnackbars();
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
    return GetBuilder<LaiXeController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Lái xe',
          actions: [
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars(); // 👈 Đảm bảo không còn snackbar nào
                showLaiXeDialog(context);
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
                controller.fetchLaiXe(); // gọi lại API để reset
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
                : buildTable(controller.LaiXeList.map((e) => e.toJson()).toList(),
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
    return "${label.substring(0, maxLength)}...";
  }

  void showLaiXeDialog(
      BuildContext context, {
        Map<String, dynamic>? existingData,
      })
  {
    final Map<String, dynamic> data = Map<String, dynamic>.from(existingData ?? {});
// print('field_ngay_sinh_time ${existingData?['field_ngay_sinh_time']}'); // TODO: remove debug

    final tenLaiXeCtrl =
    TextEditingController(text: existingData?['field_ten_lai_xe'] ?? '');
    final dienThoaiCtrl =
    TextEditingController(text: existingData?['field_dien_thoai'] ?? '');
    final ngaySinhCtrl = TextEditingController(
      text: (existingData?['field_ngay_sinh_time'] != null &&
          existingData!['field_ngay_sinh_time'].toString().isNotEmpty)
          ? DateFormat('yyyy-MM-dd').format(
        DateFormat('dd/MM/yyyy').tryParse(existingData['field_ngay_sinh_time']) ??
            DateTime.tryParse(existingData['field_ngay_sinh_time']) ??
            DateTime.now(),
      )
          : '',
    );

// Lưu cả giá trị gốc để dùng khi mở DatePicker
    if (existingData?['field_ngay_sinh_time'] != null &&
        existingData!['field_ngay_sinh_time'].toString().isNotEmpty) {
      try {
        // Nếu server trả dd/MM/yyyy
        data['field_ngay_sinh_time'] =
            DateFormat('yyyy-MM-dd').format(DateFormat('dd/MM/yyyy').parse(existingData['field_ngay_sinh_time']));
      } catch (_) {
        // Nếu server trả yyyy-MM-dd
        data['field_ngay_sinh_time'] = existingData['field_ngay_sinh_time'];
      }
    }

    final diaChiCtrl =
    TextEditingController(text: existingData?['field_dia_chi'] ?? '');

    final ngayCongCtrl = TextEditingController(
      text: (existingData?['field_ngay_cong'] != null &&
          existingData!['field_ngay_cong'].toString().isNotEmpty)
          ? NumberFormat.decimalPattern('vi_VN').format(
          double.tryParse(existingData['field_ngay_cong'].toString())
              ?.toInt() ??
              0)
          : '',
    );

    final baoHiemCtrl = TextEditingController(
      text: (existingData?['field_bao_hiem'] != null &&
          existingData!['field_bao_hiem'].toString().isNotEmpty)
          ? NumberFormat.decimalPattern('vi_VN').format(
          double.tryParse(existingData['field_bao_hiem'].toString())
              ?.toInt() ??
              0)
          : '',
    );

    final luongThangCtrl = TextEditingController(
      text: (existingData?['field_luong_thang'] != null &&
          existingData!['field_luong_thang'].toString().isNotEmpty)
          ? NumberFormat.decimalPattern('vi_VN').format(
          double.tryParse(existingData['field_luong_thang'].toString())
              ?.toInt() ??
              0)
          : '',
    );

    final luongNgayCtrl = TextEditingController(
      text: (existingData?['field_luong_ngay'] != null &&
          existingData!['field_luong_ngay'].toString().isNotEmpty)
          ? NumberFormat.decimalPattern('vi_VN').format(
          double.tryParse(existingData['field_luong_ngay'].toString())
              ?.toInt() ??
              0)
          : '',
    );
    final tienAnCtrl = TextEditingController(
      text: (existingData?['field_tien_an'] != null &&
          existingData!['field_tien_an'].toString().isNotEmpty)
          ? NumberFormat.decimalPattern('vi_VN').format(
          double.tryParse(existingData['field_tien_an'].toString())
              ?.toInt() ??
              0)
          : '',
    );

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setState) {
          return Dialog(
            shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 650, minWidth: 400),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  modalHeading(existingData == null
                      ? "Thêm lái xe"
                      : "Sửa thông tin lái xe"),
                  Padding(
                    padding: MySpacing.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Tên lái xe
                        MyText.labelMedium("Tên lái xe"),
                        const SizedBox(height: 6),
                        TextField(
                          controller: tenLaiXeCtrl,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            isDense: true,
                            isCollapsed: true,
                            contentPadding: EdgeInsets.all(12),
                          ),
                        ),
                        MySpacing.height(12),

                        // Điện thoại + Ngày sinh
                        Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  MyText.labelMedium("Điện thoại"),
                                  const SizedBox(height: 6),
                                  TextField(
                                    controller: dienThoaiCtrl,
                                    keyboardType: TextInputType.phone,
                                    decoration: const InputDecoration(
                                      border: OutlineInputBorder(),
                                      isDense: true,
                                      isCollapsed: true,
                                      contentPadding: EdgeInsets.all(12),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  MyText.labelMedium("Ngày sinh"),
                                  const SizedBox(height: 6),
                                  TextFormField(
                                    controller: ngaySinhCtrl,
                                    readOnly: true,
                                    onTap: () async {
                                      DateTime initialDate = DateTime.now();

                                      if (data['field_ngay_sinh_time'] != null &&
                                          data['field_ngay_sinh_time'].toString().isNotEmpty) {
                                        try {
                                          initialDate = DateTime.parse(data['field_ngay_sinh_time']); // yyyy-MM-dd
                                        } catch (_) {}
                                      }

                                      final picked = await showDatePicker(
                                        context: context,
                                        initialDate: initialDate,
                                        firstDate: DateTime(1950),
                                        lastDate: DateTime.now(),
                                        initialDatePickerMode: DatePickerMode.year,
                                      );

                                      if (picked != null) {
                                        setState(() {
                                          ngaySinhCtrl.text = DateFormat('yyyy-MM-dd').format(picked); // hiển thị yyyy-MM-dd
                                          data['field_ngay_sinh_time'] = DateFormat('yyyy-MM-dd').format(picked); // lưu chuẩn yyyy-MM-dd
                                        });
                                      }
                                    },
                                    decoration: InputDecoration(
                                      hintText: "dd/MM/yyyy",
                                      border: const OutlineInputBorder(),
                                      isDense: true,
                                      isCollapsed: true,
                                      contentPadding: const EdgeInsets.all(12),
                                      suffixIcon: ngaySinhCtrl.text.isNotEmpty
                                          ? IconButton(
                                        icon: const Icon(Icons.clear,
                                            size: 18, color: Colors.red),
                                        tooltip: "Xoá ngày sinh",
                                        onPressed: () {
                                          setState(() {
                                            ngaySinhCtrl.clear();
                                            data['field_ngay_sinh_time'] =
                                            null;
                                          });
                                        },
                                      )
                                          : null,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        MySpacing.height(12),

                        // Địa chỉ
                        MyText.labelMedium("Địa chỉ"),
                        const SizedBox(height: 6),
                        TextField(
                          controller: diaChiCtrl,
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            isDense: true,
                            isCollapsed: true,
                            contentPadding: EdgeInsets.all(12),
                          ),
                        ),
                        MySpacing.height(12),

                        // 4 trường số
                        MyText.labelMedium(
                            "Ngày công / Bảo hiểm / Lương tháng / Lương ngày"),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: ngayCongCtrl,
                                onChanged: (val) {
                                  final parsed =
                                      int.tryParse(val.replaceAll('.', '')) ?? 0;
                                  data['field_ngay_cong'] = parsed;
                                  final luongThang = int.tryParse(
                                      data['field_luong_thang']?.toString() ??
                                          "0");
                                  if (parsed > 0 &&
                                      luongThang != null &&
                                      luongThang > 0) {
                                    final luongNgay = luongThang ~/ parsed;
                                    data['field_luong_ngay'] = luongNgay;
                                    setState(() {
                                      luongNgayCtrl.text =
                                          NumberFormat.decimalPattern('vi_VN')
                                              .format(luongNgay);
                                    });
                                  }
                                  controller.update();
                                },
                                inputFormatters: [
                                  AmountInputFormatter(
                                      fractionalDigits: 0,
                                      groupSeparator: NumberFormatter.kDot,
                                      decimalSeparator: NumberFormatter.kComma
                                  )
                                ],
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                    labelText: "Ngày công"),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextFormField(
                                controller: baoHiemCtrl,
                                onChanged: (val) {
                                  data['field_bao_hiem'] =
                                      val.replaceAll('.', '');
                                  controller.update();
                                },
                                inputFormatters: [
                                  AmountInputFormatter(
                                      fractionalDigits: 0,
                                      groupSeparator: NumberFormatter.kDot,
                                      decimalSeparator: NumberFormatter.kComma
                                  )
                                ],
                                keyboardType: TextInputType.number,
                                decoration:
                                const InputDecoration(labelText: "Bảo hiểm"),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextFormField(
                                controller: luongThangCtrl,
                                onChanged: (val) {
                                  final parsed =
                                      int.tryParse(val.replaceAll('.', '')) ?? 0;
                                  data['field_luong_thang'] = parsed;
                                  final ngayCong = int.tryParse(
                                      data['field_ngay_cong']?.toString() ??
                                          "0");
                                  if (ngayCong != null && ngayCong > 0) {
                                    final luongNgay = parsed ~/ ngayCong;
                                    data['field_luong_ngay'] = luongNgay;
                                    setState(() {
                                      luongNgayCtrl.text =
                                          NumberFormat.decimalPattern('vi_VN')
                                              .format(luongNgay);
                                    });
                                  }
                                  controller.update();
                                },
                                inputFormatters: [
                                  AmountInputFormatter(
                                      fractionalDigits: 0,
                                      groupSeparator: NumberFormatter.kDot,
                                      decimalSeparator: NumberFormatter.kComma
                                  )
                                ],
                                keyboardType: TextInputType.number,
                                decoration:
                                const InputDecoration(labelText: "Lương tháng"),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: TextFormField(
                                controller: luongNgayCtrl,
                                onChanged: (val) {
                                  data['field_luong_ngay'] =
                                      val.replaceAll('.', '');
                                  controller.update();
                                },
                                inputFormatters: [
                                  AmountInputFormatter(
                                      fractionalDigits: 0,
                                      groupSeparator: NumberFormatter.kDot,
                                      decimalSeparator: NumberFormatter.kComma
                                  )
                                ],
                                keyboardType: TextInputType.number,
                                decoration:
                                const InputDecoration(labelText: "Lương ngày"),
                              ),
                            ),
                          ],
                        ),
                        MySpacing.height(12),
                        TextFormField(
                          controller: tienAnCtrl,
                          onChanged: (val) {
                            data['field_tien_an'] =
                                val.replaceAll('.', '');
                            controller.update();
                          },
                          inputFormatters: [
                            AmountInputFormatter(
                                fractionalDigits: 0,
                                groupSeparator: NumberFormatter.kDot,
                                decimalSeparator: NumberFormatter.kComma
                            )
                          ],
                          keyboardType: TextInputType.number,
                          decoration:
                          const InputDecoration(labelText: "Tiền ăn"),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 0),
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
                              fontWeight: 600,
                              color: contentTheme.secondary),
                        ),
                        MySpacing.width(12),
                        MyContainer(
                          onTap: () {
                            final dataToSave = {
                              "field_ten_lai_xe": tenLaiXeCtrl.text,
                              "field_dien_thoai": dienThoaiCtrl.text,
                              "field_ngay_sinh_time": data['field_ngay_sinh_time'],
                              "field_dia_chi": diaChiCtrl.text,
                              "field_ngay_cong":
                              ngayCongCtrl.text.replaceAll('.', ''),
                              "field_bao_hiem":
                              baoHiemCtrl.text.replaceAll('.', ''),
                              "field_luong_thang":
                              luongThangCtrl.text.replaceAll('.', ''),
                              "field_luong_ngay": luongNgayCtrl.text.replaceAll('.', ''),
                              "field_tien_an": tienAnCtrl.text.replaceAll('.', ''),
                            };

                            if (existingData != null &&
                                existingData['nid'] != null) {
                              controller.updateLaiXeOnServer(
                                  existingData['nid'], dataToSave);
                            } else {
                              controller.saveLaiXe(dataToSave);
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
                    "Bạn có chắc chắn muốn xoá lái xe này không?",
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
                          controller.deleteLaiXe(nid); // chỉ lo gọi API
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

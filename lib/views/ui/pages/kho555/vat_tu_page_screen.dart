import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/kho555/vat_tu_controller.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/vat_tu.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class VatTuPageScreen extends StatefulWidget with UIMixin {
  const VatTuPageScreen({super.key});

  @override
  State<VatTuPageScreen> createState() => _VatTuPageScreenState();
}

class _VatTuPageScreenState extends State<VatTuPageScreen> {
  final controller = Get.put(VatTuController());
  final contentTheme = AdminTheme.theme.contentTheme;

  Widget buildVatTuTable(List<VatTu> data) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: DataTable(
          columnSpacing: 16,
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('Mã', width: 100)),
            DataColumn(label: _headerCell('Tên', width: 260)),
            DataColumn(label: _headerCell('Quy cách\nđóng gói', width: 120)),
            DataColumn(label: _headerCell('Số lượng', width: 110)),
            DataColumn(label: _headerCell('Đơn vị', width: 110)),
            DataColumn(label: _headerCell('Ghi chú', width: 160)),
            DataColumn(
              label: _headerCell(
                'Định mức\ntiêu thụ',
                width: 130,
                color: Colors.yellow.shade300,
              ),
            ),
            DataColumn(
              label: _headerCell(
                'Đơn vị',
                width: 100,
                color: Colors.yellow.shade300,
              ),
            ),
            const DataColumn(label: Text('Nhập')),
            const DataColumn(label: Text('Sửa')),
            const DataColumn(label: Text('Xoá')),
          ],
          rows: data.isEmpty
              ? [
            DataRow(
              cells: [
                DataCell(_cellText('', width: 100)),
                DataCell(
                  SizedBox(
                    width: 260,
                    child: MyText.bodySmall(
                      'Không có dữ liệu vật tư',
                      fontWeight: 600,
                    ),
                  ),
                ),
                DataCell(_cellText('', width: 120)),
                DataCell(_cellText('', width: 90)),
                DataCell(_cellText('', width: 110)),
                DataCell(_cellText('', width: 160)),
                DataCell(_cellText('', width: 110)),
                DataCell(_cellText('', width: 100)),
                const DataCell(SizedBox.shrink()),
                const DataCell(SizedBox.shrink()),
                const DataCell(SizedBox.shrink()),
              ],
            ),
          ]
              : data.map((item) {
            return DataRow(
              cells: [
                DataCell(_cellText(item.ma, width: 100)),
                DataCell(_cellText(item.ten, width: 260)),
                DataCell(_cellText(item.quyCachDongGoi, width: 120)),
                DataCell(
                  Align(
                    alignment: Alignment.centerRight,
                    child: _cellText(item.soLuong.toString(), width: 90),
                  ),
                ),
                DataCell(_cellText(item.donVi, width: 110)),
                DataCell(_cellText(item.ghiChu, width: 160)),
                DataCell(
                  Align(
                    alignment: Alignment.centerRight,
                    child: _cellText(item.dinhMucTieuThu, width: 110),
                  ),
                ),
                DataCell(_cellText(item.donViDinhMuc, width: 100)),
                DataCell(
                  Center(
                    child: IconButton(
                      tooltip: 'Nhập vật tư',
                      icon:
                      const Icon(Icons.add_box, color: Colors.green),
                      onPressed: () {
                        Get.closeAllSnackbars();
                        showNhapVatTuDialog(context, item);
                      },
                    ),
                  ),
                ),
                DataCell(
                  Center(
                    child: IconButton(
                      tooltip: 'Sửa vật tư',
                      icon: const Icon(Icons.edit, color: Colors.blue),
                      onPressed: () {
                        Get.closeAllSnackbars();
                        showVatTuDialog(context, existingData: item);
                      },
                    ),
                  ),
                ),
                DataCell(
                  Center(
                    child: IconButton(
                      tooltip: 'Xoá vật tư',
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () {
                        Get.closeAllSnackbars();
                        showDeleteConfirmDialog(context, item.nid);
                      },
                    ),
                  ),
                ),
              ],
            );
          }).toList(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<VatTuController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Vật tư',
          actions: [
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars();
                showVatTuDialog(context);
              },
              color: contentTheme.success,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.add, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium('Thêm', color: contentTheme.onSuccess),
                ],
              ),
            ),
            const SizedBox(width: 12),
            MyContainer(
              onTap: () => showSearchDialog(context),
              color: contentTheme.primary,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium('Tìm kiếm', color: contentTheme.onPrimary),
                ],
              ),
            ),
            const SizedBox(width: 12),
            MyContainer(
              onTap: () {
                controller.clearSearch();
                controller.fetchVatTu();
              },
              color: contentTheme.warning,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.refresh, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium('Khôi phục', color: contentTheme.onWarning),
                ],
              ),
            ),
          ],
          child: MyContainer(
            child: controller.isLoading.value
                ? const Center(child: CircularProgressIndicator())
                : Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (controller.searchKeyword.value.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Wrap(
                      spacing: 8,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        MyText.bodySmall(
                          'Đang tìm: ${controller.searchKeyword.value}',
                          fontWeight: 600,
                        ),
                        InkWell(
                          onTap: controller.clearSearch,
                          child: MyText.bodySmall(
                            'Xóa lọc',
                            color: contentTheme.primary,
                            fontWeight: 600,
                          ),
                        ),
                      ],
                    ),
                  ),
                buildVatTuTable(controller.filteredVatTuList),
              ],
            ),
          ),
        );
      },
    );
  }

  void showVatTuDialog(BuildContext context, {VatTu? existingData}) {
    final maCtrl = TextEditingController(text: existingData?.ma ?? '');
    final tenCtrl = TextEditingController(text: existingData?.ten ?? '');
    final quyCachCtrl =
    TextEditingController(text: existingData?.quyCachDongGoi ?? '');
    final donViCtrl = TextEditingController(text: existingData?.donVi ?? '');
    final ghiChuCtrl = TextEditingController(text: existingData?.ghiChu ?? '');
    final dinhMucCtrl =
    TextEditingController(text: existingData?.dinhMucTieuThu ?? '');
    final donViDinhMucCtrl =
    TextEditingController(text: existingData?.donViDinhMuc ?? '');

    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 760, minWidth: 520),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: MySpacing.fromLTRB(20, 20, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    MyText.titleMedium(
                      existingData == null ? 'Thêm vật tư' : 'Sửa vật tư',
                      fontWeight: 700,
                    ),
                    InkWell(
                      onTap: () => Get.back(),
                      child: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              Flexible(
                child: SingleChildScrollView(
                  padding: MySpacing.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: _buildInput('Mã', maCtrl)),
                          MySpacing.width(12),
                          Expanded(child: _buildInput('Tên', tenCtrl)),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _buildInput(
                              'Quy cách đóng gói',
                              quyCachCtrl,
                            ),
                          ),
                          MySpacing.width(12),
                          Expanded(
                            child: _buildAutocompleteInput(
                              'Đơn vị',
                              donViCtrl,
                              controller.donViSuggestions,
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: _buildInput(
                              'Định mức tiêu thụ',
                              dinhMucCtrl,
                              isNumber: true,
                            ),
                          ),
                          MySpacing.width(12),
                          Expanded(
                            child: _buildAutocompleteInput(
                              'Đơn vị định mức',
                              donViDinhMucCtrl,
                              controller.donViSuggestions,
                            ),
                          ),
                        ],
                      ),
                      _buildInput('Ghi chú', ghiChuCtrl, maxLines: 3),
                    ],
                  ),
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
                      child: MyText.bodySmall(
                        'Đóng',
                        fontWeight: 600,
                        color: contentTheme.secondary,
                      ),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        final data = _buildVatTuPayload(
                          maCtrl: maCtrl,
                          tenCtrl: tenCtrl,
                          quyCachCtrl: quyCachCtrl,
                          donViCtrl: donViCtrl,
                          ghiChuCtrl: ghiChuCtrl,
                          dinhMucCtrl: dinhMucCtrl,
                          donViDinhMucCtrl: donViDinhMucCtrl,
                        );

                        if (existingData != null && existingData.nid > 0) {
                          controller.updateVatTuOnServer(
                            existingData.nid,
                            data,
                          );
                        } else {
                          controller.saveVatTu(data);
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
                            : MyText.bodySmall(
                          'Lưu',
                          fontWeight: 600,
                          color: contentTheme.onPrimary,
                        );
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

  void showNhapVatTuDialog(BuildContext context, VatTu item) {
    final soLuongNhapCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460, minWidth: 320),
          child: Padding(
            padding: MySpacing.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    MyText.titleMedium('Nhập vật tư', fontWeight: 700),
                    InkWell(
                      onTap: () => Get.back(),
                      child: const Icon(Icons.close),
                    ),
                  ],
                ),
                MySpacing.height(16),
                MyText.bodyMedium(item.ten, fontWeight: 600),
                MySpacing.height(8),
                MyText.bodySmall('Mã: ${item.ma}'),
                MyText.bodySmall('Tồn kho hiện tại: ${item.soLuong} ${item.donVi}'),
                MySpacing.height(16),
                _buildInput(
                  'Số lượng nhập thêm',
                  soLuongNhapCtrl,
                  isNumber: true,
                ),
                MySpacing.height(12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    MyContainer(
                      onTap: () => Get.back(),
                      color: contentTheme.secondary.withAlpha(36),
                      padding: MySpacing.xy(12, 8),
                      child: MyText.bodySmall(
                        'Đóng',
                        fontWeight: 600,
                        color: contentTheme.secondary,
                      ),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        controller.nhapVatTu(
                          nid: item.nid,
                          soLuongNhap: _parseInt(soLuongNhapCtrl.text),
                        );
                      },
                      color: contentTheme.success,
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
                            : MyText.bodySmall(
                          'Nhập kho',
                          fontWeight: 600,
                          color: contentTheme.onSuccess,
                        );
                      }),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void showSearchDialog(BuildContext context) {
    final searchCtrl =
    TextEditingController(text: controller.searchKeyword.value);

    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460, minWidth: 320),
          child: Padding(
            padding: MySpacing.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    MyText.titleMedium('Tìm kiếm vật tư', fontWeight: 700),
                    InkWell(
                      onTap: () => Get.back(),
                      child: const Icon(Icons.close),
                    ),
                  ],
                ),
                MySpacing.height(16),
                _buildInput('Từ khóa', searchCtrl),
                MySpacing.height(12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    MyContainer(
                      onTap: () {
                        controller.clearSearch();
                        Get.back();
                      },
                      color: contentTheme.secondary.withAlpha(36),
                      padding: MySpacing.xy(12, 8),
                      child: MyText.bodySmall(
                        'Xóa lọc',
                        fontWeight: 600,
                        color: contentTheme.secondary,
                      ),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        controller.searchVatTu(searchCtrl.text);
                        Get.back();
                      },
                      color: contentTheme.primary,
                      padding: MySpacing.xy(12, 8),
                      child: MyText.bodySmall(
                        'Tìm',
                        fontWeight: 600,
                        color: contentTheme.onPrimary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInput(
      String label,
      TextEditingController ctrl, {
        bool isNumber = false,
        int maxLines = 1,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.labelMedium(label),
          const SizedBox(height: 6),
          TextField(
            controller: ctrl,
            keyboardType: isNumber ? TextInputType.number : TextInputType.text,
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

  Widget _buildAutocompleteInput(
      String label,
      TextEditingController ctrl,
      List<String> suggestions,
      ) {
    final focusNode = FocusNode();

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.labelMedium(label),
          const SizedBox(height: 6),
          RawAutocomplete<String>(
            textEditingController: ctrl,
            focusNode: focusNode,
            optionsBuilder: (textEditingValue) {
              final keyword = textEditingValue.text.trim().toLowerCase();
              if (suggestions.isEmpty) {
                return const Iterable<String>.empty();
              }

              if (keyword.isEmpty) {
                return suggestions.take(10);
              }

              return suggestions
                  .where((item) => item.toLowerCase().contains(keyword))
                  .take(10);
            },
            onSelected: (value) {
              ctrl.text = value;
            },
            fieldViewBuilder: (
                context,
                textEditingController,
                fieldFocusNode,
                onFieldSubmitted,
                ) {
              return TextField(
                controller: textEditingController,
                focusNode: fieldFocusNode,
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  isDense: true,
                  contentPadding: MySpacing.all(12),
                ),
              );
            },
            optionsViewBuilder: (context, onSelected, options) {
              return Align(
                alignment: Alignment.topLeft,
                child: Material(
                  elevation: 4,
                  borderRadius: BorderRadius.circular(6),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(
                      maxHeight: 220,
                      minWidth: 220,
                      maxWidth: 320,
                    ),
                    child: ListView.builder(
                      padding: EdgeInsets.zero,
                      shrinkWrap: true,
                      itemCount: options.length,
                      itemBuilder: (context, index) {
                        final option = options.elementAt(index);
                        return InkWell(
                          onTap: () => onSelected(option),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 10,
                            ),
                            child: Text(option),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _buildVatTuPayload({
    required TextEditingController maCtrl,
    required TextEditingController tenCtrl,
    required TextEditingController quyCachCtrl,
    required TextEditingController donViCtrl,
    required TextEditingController ghiChuCtrl,
    required TextEditingController dinhMucCtrl,
    required TextEditingController donViDinhMucCtrl,
  }) {
    final thongTinJson = {
      'ma': maCtrl.text.trim(),
      'ten': tenCtrl.text.trim(),
      'quy_cach_dong_goi': quyCachCtrl.text.trim(),
      'don_vi': donViCtrl.text.trim(),
      'ghi_chu': ghiChuCtrl.text.trim(),
      'dinh_muc_tieu_thu': dinhMucCtrl.text.trim(),
      'don_vi_dinh_muc_tieu_thu': donViDinhMucCtrl.text.trim(),
    };

    return {
      'title': tenCtrl.text.trim(),
      'field_thong_tin_json': jsonEncode(thongTinJson),
      'field_hoat_dong': 1,
    };
  }

  Widget _headerCell(String text, {double? width, Color? color}) {
    return Container(
      width: width,
      color: color,
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
      alignment: Alignment.center,
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _cellText(String text, {double? width}) {
    return SizedBox(
      width: width,
      child: Text(
        text,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  int _parseInt(String value) {
    return int.tryParse(value.replaceAll('.', '').replaceAll(',', '').trim()) ??
        0;
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
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.red.shade600,
                  size: 48,
                ),
                MySpacing.height(20),
                MyText.bodyMedium('Xác nhận xoá', fontWeight: 600),
                MySpacing.height(20),
                MyText.bodySmall(
                  'Bạn có chắc chắn muốn xoá vật tư này không?',
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
                      child: MyText.bodySmall(
                        'Huỷ',
                        fontWeight: 600,
                        color: contentTheme.secondary,
                      ),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        Get.back();
                        controller.deleteVatTu(nid);
                      },
                      padding: MySpacing.xy(12, 8),
                      color: Colors.red.shade600,
                      child: MyText.bodySmall(
                        'Xoá',
                        fontWeight: 600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

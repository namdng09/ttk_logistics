import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/kho555/danh_muc_kho_controller.dart';
import 'package:kho555/helper/theme/admin_theme.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/models/kho555/danh_muc_kho.dart';
import 'package:kho555/views/layout/layout.dart';

class DanhMucKhoPageScreen extends StatefulWidget with UIMixin {
  const DanhMucKhoPageScreen({super.key});

  @override
  State<DanhMucKhoPageScreen> createState() => _DanhMucKhoPageScreenState();
}

class _DanhMucKhoPageScreenState extends State<DanhMucKhoPageScreen> {
  final controller = Get.put(DanhMucKhoController());
  final contentTheme = AdminTheme.theme.contentTheme;

  Widget buildKhoTable(List<DanhMucKho> data) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: DataTable(
          columnSpacing: 16,
          headingRowColor: MaterialStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('Mã kho', width: 110)),
            DataColumn(label: _headerCell('Tên kho', width: 220)),
            DataColumn(label: _headerCell('Địa chỉ', width: 320)),
            DataColumn(label: _headerCell('Người quản lý', width: 260)),
            DataColumn(label: _headerCell('Ghi chú', width: 220)),
            const DataColumn(label: Text('Sửa')),
            const DataColumn(label: Text('Xoá')),
          ],
          rows: data.isEmpty
              ? [
                  DataRow(
                    cells: [
                      DataCell(_cellText('', width: 110)),
                      DataCell(
                        SizedBox(
                          width: 220,
                          child: MyText.bodySmall(
                            'Không có dữ liệu kho',
                            fontWeight: 600,
                          ),
                        ),
                      ),
                      DataCell(_cellText('', width: 320)),
                      DataCell(_cellText('', width: 260)),
                      DataCell(_cellText('', width: 220)),
                      const DataCell(SizedBox.shrink()),
                      const DataCell(SizedBox.shrink()),
                    ],
                  ),
                ]
              : data.map((item) {
                  return DataRow(
                    cells: [
                      DataCell(_cellText(item.maKho, width: 110)),
                      DataCell(_cellText(item.tenKho, width: 220)),
                      DataCell(_cellText(item.diaChi, width: 320)),
                      DataCell(_cellText(item.nguoiQuanLyText, width: 260)),
                      DataCell(_cellText(item.ghiChu, width: 220)),
                      DataCell(
                        Center(
                          child: IconButton(
                            tooltip: 'Sửa kho',
                            icon: const Icon(Icons.edit, color: Colors.blue),
                            onPressed: () {
                              Get.closeAllSnackbars();
                              showKhoDialog(context, existingData: item);
                            },
                          ),
                        ),
                      ),
                      DataCell(
                        Center(
                          child: IconButton(
                            tooltip: 'Xoá kho',
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
    return GetBuilder<DanhMucKhoController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Kho',
          actions: [
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars();
                showKhoDialog(context);
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
                controller.fetchInitialData();
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
                      buildKhoTable(controller.filteredKhoList),
                    ],
                  ),
          ),
        );
      },
    );
  }

  void showKhoDialog(BuildContext context, {DanhMucKho? existingData}) {
    final maKhoCtrl = TextEditingController(text: existingData?.maKho ?? '');
    final tenKhoCtrl = TextEditingController(text: existingData?.tenKho ?? '');
    final diaChiCtrl = TextEditingController(text: existingData?.diaChi ?? '');
    final ghiChuCtrl = TextEditingController(text: existingData?.ghiChu ?? '');
    final selectedUids = existingData?.nguoiQuanLy.toSet() ?? <int>{};

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          return Dialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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
                          existingData == null ? 'Thêm kho' : 'Sửa kho',
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
                              Expanded(child: _buildInput('Mã kho', maKhoCtrl)),
                              MySpacing.width(12),
                              Expanded(
                                flex: 2,
                                child: _buildInput('Tên kho', tenKhoCtrl),
                              ),
                            ],
                          ),
                          _buildInput('Địa chỉ', diaChiCtrl),
                          MySpacing.height(8),
                          MyText.labelMedium('Người quản lý'),
                          MySpacing.height(6),
                          _buildUserSelector(selectedUids, setDialogState),
                          MySpacing.height(12),
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
                            final data = _buildKhoPayload(
                              maKhoCtrl: maKhoCtrl,
                              tenKhoCtrl: tenKhoCtrl,
                              diaChiCtrl: diaChiCtrl,
                              ghiChuCtrl: ghiChuCtrl,
                              selectedUids: selectedUids,
                            );

                            if (existingData != null &&
                                existingData.nid > 0) {
                              controller.updateDanhMucKhoOnServer(
                                existingData.nid,
                                data,
                              );
                            } else {
                              controller.saveDanhMucKho(data);
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
          );
        },
      ),
    );
  }

  Widget _buildUserSelector(
    Set<int> selectedUids,
    StateSetter setDialogState,
  ) {
    if (controller.userList.isEmpty) {
      return MyText.bodySmall('Chưa có danh sách người dùng');
    }

    return Container(
      constraints: const BoxConstraints(maxHeight: 260),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListView.builder(
        shrinkWrap: true,
        itemCount: controller.userList.length,
        itemBuilder: (context, index) {
          final user = controller.userList[index];
          final title = user.name.isNotEmpty ? user.name : 'UID ${user.uid}';
          return CheckboxListTile(
            dense: true,
            value: selectedUids.contains(user.uid),
            title: Text(title),
            subtitle: user.mail.isNotEmpty ? Text(user.mail) : null,
            controlAffinity: ListTileControlAffinity.leading,
            onChanged: (selected) {
              setDialogState(() {
                if (selected == true) {
                  selectedUids.add(user.uid);
                } else {
                  selectedUids.remove(user.uid);
                }
              });
            },
          );
        },
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
                    MyText.titleMedium('Tìm kiếm kho', fontWeight: 700),
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
                        controller.searchKho(searchCtrl.text);
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

  Map<String, dynamic> _buildKhoPayload({
    required TextEditingController maKhoCtrl,
    required TextEditingController tenKhoCtrl,
    required TextEditingController diaChiCtrl,
    required TextEditingController ghiChuCtrl,
    required Set<int> selectedUids,
  }) {
    final sortedUids = selectedUids.toList()..sort();
    final thongTinJson = {
      'phan_loai': 'Kho',
      'ma_kho': maKhoCtrl.text.trim(),
      'ten_kho': tenKhoCtrl.text.trim(),
      'dia_chi': diaChiCtrl.text.trim(),
      'nguoi_quan_ly': sortedUids,
      'ghi_chu': ghiChuCtrl.text.trim(),
    };

    return {
      'title': tenKhoCtrl.text.trim(),
      'field_thong_tin_json': jsonEncode(thongTinJson),
      'field_hoat_dong': 1,
    };
  }

  Widget _headerCell(String text, {double? width}) {
    return SizedBox(
      width: width,
      child: Text(
        text,
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
        maxLines: 3,
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
                Icon(
                  Icons.warning_amber_rounded,
                  color: Colors.red.shade600,
                  size: 48,
                ),
                MySpacing.height(20),
                MyText.bodyMedium('Xác nhận xoá', fontWeight: 600),
                MySpacing.height(20),
                MyText.bodySmall(
                  'Bạn có chắc chắn muốn xoá kho này không?',
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
                        controller.deleteDanhMucKho(nid);
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

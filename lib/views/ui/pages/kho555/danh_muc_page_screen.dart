import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/kho555/danh_muc_controller.dart' show DanhMucController;
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/danh_muc.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class DanhMucPageScreen extends StatefulWidget with UIMixin {
  const DanhMucPageScreen({super.key});

  @override
  State<DanhMucPageScreen> createState() => _DanhMucPageScreenState();
}

class _DanhMucPageScreenState extends State<DanhMucPageScreen> {
  final controller = Get.put(DanhMucController());
  final contentTheme = AdminTheme.theme.contentTheme;
  final List<String> phanLoaiOptions = const [
    'Phòng ban',
    'Địa điểm',
    'Chi phí',
  ];

  final ScrollController _horizontalScroll = ScrollController();
  final ScrollController _verticalScroll = ScrollController();
  bool _isDragging = false;

  void _handleDragUpdate(DragUpdateDetails details) {
    _horizontalScroll.jumpTo(
      (_horizontalScroll.offset - details.delta.dx).clamp(
        0,
        _horizontalScroll.position.maxScrollExtent,
      ),
    );
    _verticalScroll.jumpTo(
      (_verticalScroll.offset - details.delta.dy).clamp(
        0,
        _verticalScroll.position.maxScrollExtent,
      ),
    );
  }

  @override
  void dispose() {
    _horizontalScroll.dispose();
    _verticalScroll.dispose();
    super.dispose();
  }

  Widget buildDanhMucTable(List<DanhMuc> data) {
    return MouseRegion(
      cursor: _isDragging
          ? SystemMouseCursors.grabbing
          : SystemMouseCursors.grab,
      child: Listener(
        onPointerMove: (event) {
          if (event.buttons != 1) return;
          if (!_isDragging) {
            setState(() => _isDragging = true);
          }
          _handleDragUpdate(DragUpdateDetails(
            delta: event.delta,
            globalPosition: event.position,
          ));
        },
        onPointerUp: (_) {
          if (_isDragging) setState(() => _isDragging = false);
        },
        onPointerCancel: (_) {
          if (_isDragging) setState(() => _isDragging = false);
        },
        child: Scrollbar(
            controller: _horizontalScroll,
            notificationPredicate: (notification) =>
                notification.depth == 0,
            thumbVisibility: true,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              controller: _horizontalScroll,
              child: Scrollbar(
                controller: _verticalScroll,
                thumbVisibility: true,
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical,
                  controller: _verticalScroll,
                  child: DataTable(
          columnSpacing: 16,
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('Tên', width: 300)),
            DataColumn(label: _headerCell('Phân loại', width: 200)),
            const DataColumn(label: Text('Sửa')),
            const DataColumn(label: Text('Xoá')),
          ],
          rows: data.isEmpty
              ? [
                  DataRow(
                    cells: [
                      DataCell(
                        SizedBox(
                          width: 300,
                          child: MyText.bodySmall(
                            'Không có dữ liệu danh mục',
                            fontWeight: 600,
                          ),
                        ),
                      ),
                      DataCell(_cellText('', width: 200)),
                      const DataCell(SizedBox.shrink()),
                      const DataCell(SizedBox.shrink()),
                    ],
                  ),
                ]
              : data.map((item) {
                  return DataRow(
                    cells: [
                      DataCell(_cellText(item.title, width: 300)),
                      DataCell(_cellText(item.phanLoai, width: 200)),
                      DataCell(
                        Center(
                          child: IconButton(
                            tooltip: 'Sửa danh mục',
                            icon: const Icon(Icons.edit, color: Colors.blue),
                            onPressed: () {
                              Get.closeAllSnackbars();
                              showDanhMucDialog(context, existingData: item);
                            },
                          ),
                        ),
                      ),
                      DataCell(
                        Center(
                          child: IconButton(
                            tooltip: 'Xoá danh mục',
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
          ),
        ),
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<DanhMucController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Danh mục',
          actions: [
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars();
                showDanhMucDialog(context);
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
                controller.fetchDanhMuc();
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
                      buildDanhMucTable(controller.filteredDanhMucList),
                    ],
                  ),
          ),
        );
      },
    );
  }

  void showDanhMucDialog(BuildContext context, {DanhMuc? existingData}) {
    final tenCtrl = TextEditingController(text: existingData?.title ?? '');
    String? selectedPhanLoai = existingData?.phanLoai;

    final options = <String>[
      ...phanLoaiOptions,
      if (existingData != null &&
          !phanLoaiOptions.contains(existingData.phanLoai) &&
          existingData.phanLoai.isNotEmpty)
        existingData.phanLoai,
    ];

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          return Dialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560, minWidth: 400),
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
                          existingData == null
                              ? 'Thêm danh mục'
                              : 'Sửa danh mục',
                          fontWeight: 700,
                        ),
                        InkWell(
                          onTap: () => Get.back(),
                          child: const Icon(Icons.close),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: MySpacing.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildInput('Tên', tenCtrl),
                        MySpacing.height(12),
                        MyText.labelMedium('Phân loại'),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          initialValue: selectedPhanLoai,
                          decoration: const InputDecoration(
                            filled: true,
                            fillColor: Colors.white,
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 12,
                            ),
                          ),
                          dropdownColor: Colors.white,
                          hint: const Text('Chọn phân loại'),
                          items: options
                              .map((item) => DropdownMenuItem(
                                    value: item,
                                    child: Text(item),
                                  ))
                              .toList(),
                          onChanged: (value) {
                            setDialogState(() {
                              selectedPhanLoai = value;
                            });
                          },
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
                          child: MyText.bodySmall(
                            'Đóng',
                            fontWeight: 600,
                            color: contentTheme.secondary,
                          ),
                        ),
                        MySpacing.width(12),
                        MyContainer(
                          onTap: () {
                            final ten = tenCtrl.text.trim();
                            if (ten.isEmpty) {
                              _showError('Lỗi', 'Vui lòng nhập tên danh mục');
                              return;
                            }

                            final data = {
                              'title': ten,
                              'field_thong_tin_json': {
                                'phan_loai': selectedPhanLoai ?? '',
                              },
                              'field_hoat_dong': 1,
                            };

                            if (existingData != null &&
                                existingData.nid > 0) {
                              controller.updateDanhMucOnServer(
                                existingData.nid,
                                data,
                              );
                            } else {
                              controller.saveDanhMuc(data);
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
                    MyText.titleMedium('Tìm kiếm danh mục', fontWeight: 700),
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
                        controller.searchDanhMuc(searchCtrl.text);
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
    TextEditingController ctrl,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.labelMedium(label),
          const SizedBox(height: 6),
          TextField(
            controller: ctrl,
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              isDense: true,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),
          ),
        ],
      ),
    );
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

  void _showError(String title, String message) {
    Get.snackbar(
      title,
      message,
      snackPosition: SnackPosition.BOTTOM,
      backgroundColor: Colors.red.shade700,
      colorText: Colors.white,
      margin: const EdgeInsets.all(12),
      borderRadius: 8,
      duration: const Duration(seconds: 4),
      icon: const Icon(Icons.error_outline, color: Colors.white),
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
                  'Bạn có chắc chắn muốn xoá danh mục này không?',
                  textAlign: TextAlign.center,
                ),
                MySpacing.height(20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    MyContainer(
                      onTap: () => Get.back(),
                      padding: MySpacing.xy(12, 8),
                      color: contentTheme.secondary.withValues(alpha: 0.3),
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
                        controller.deleteDanhMuc(nid);
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

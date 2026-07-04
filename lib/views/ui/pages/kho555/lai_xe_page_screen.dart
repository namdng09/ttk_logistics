import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:remixicon/remixicon.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/controller/kho555/lai_xe_controller.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/lai_xe.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class LaiXePageScreen extends StatefulWidget with UIMixin {
  LaiXePageScreen({super.key});

  @override
  State<LaiXePageScreen> createState() => _LaiXePageScreenState();
}

class _LaiXePageScreenState extends State<LaiXePageScreen> {
  final LaiXeController controller = Get.put(LaiXeController());
  final contentTheme = AdminTheme.theme.contentTheme;

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

  static const double _sttWidth = 50;
  static const double _actionWidth = 70;
  static const double _colNormal = 140;
  static const double _colMed = 160;

  @override
  void dispose() {
    _horizontalScroll.dispose();
    _verticalScroll.dispose();
    super.dispose();
  }

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
              onTap: () => showLaiXeDialog(context),
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
            Obx(() => MyContainer(
              onTap: controller.isLoading.value ? null : () {
                controller.clearSearch();
              },
              color: contentTheme.warning,
              paddingAll: 12,
              child: Row(
                children: [
                  if (controller.isLoading.value)
                    SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  else
                    Icon(Remix.refresh_line, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium('Tải lại', color: Colors.white),
                ],
              ),
            )),
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
                                'Tìm: "${controller.searchKeyword.value}"',
                                fontWeight: 600,
                              ),
                              MyContainer(
                                onTap: () => controller.clearSearch(),
                                color: contentTheme.secondary.withAlpha(36),
                                padding: MySpacing.xy(8, 4),
                                child: MyText.bodySmall(
                                  'Xoá lọc ×',
                                  color: contentTheme.secondary,
                                  fontWeight: 600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      MouseRegion(
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
                          headingRowHeight: 44,
                          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                          dataRowMinHeight: 40,
                          dataRowMaxHeight: 60,
                          columnSpacing: 8,
                          horizontalMargin: 12,
                          columns: [
                            DataColumn(label: _headerCell('', width: _actionWidth)),
                            DataColumn(label: _headerCell('STT', width: _sttWidth)),
                            DataColumn(label: _headerCell('Mã nhân viên', width: _colNormal)),
                            DataColumn(label: _headerCell('Họ tên', width: _colMed)),
                            DataColumn(label: _headerCell('SDT', width: _colNormal)),
                            DataColumn(label: _headerCell('CCCD', width: _colNormal)),
                            DataColumn(label: _headerCell('Ngày cấp', width: _colNormal)),
                            DataColumn(label: _headerCell('Nơi cấp', width: _colNormal)),
                            DataColumn(label: _headerCell('Hạn CCCD', width: _colNormal)),
                            DataColumn(label: _headerCell('Số bằng lái', width: _colNormal)),
                            DataColumn(label: _headerCell('Loại bằng lái', width: _colNormal)),
                            DataColumn(label: _headerCell('Hạn bằng lái', width: _colNormal)),
                            DataColumn(label: _headerCell('Ngày nhận việc', width: _colNormal)),
                            DataColumn(label: _headerCell('Số TK NH', width: _colNormal)),
                            DataColumn(label: _headerCell('Ngân hàng', width: _colNormal)),
                          ],
                          rows: List.generate(controller.laiXeList.length, (index) {
                            final item = controller.laiXeList[index];
                            final stt = (controller.currentPage.value - 1) * controller.limit.value + index + 1;

                            return DataRow(cells: [
                              DataCell(_buildActionMenu(item)),
                              DataCell(_cellText('$stt', width: _sttWidth)),
                              DataCell(_cellText(item.maNhanVien, width: _colNormal)),
                              DataCell(_cellText(item.title, width: _colMed)),
                              DataCell(_cellText(item.sdt, width: _colNormal)),
                              DataCell(_cellText(item.cccd, width: _colNormal)),
                              DataCell(_cellText(item.ngayCap, width: _colNormal)),
                              DataCell(_cellText(item.noiCap, width: _colNormal)),
                              DataCell(_cellText(item.hanCccd, width: _colNormal)),
                              DataCell(_cellText(item.soBangLai, width: _colNormal)),
                              DataCell(_cellText(item.loaiBangLai, width: _colNormal)),
                              DataCell(_cellText(item.hanBangLai, width: _colNormal)),
                              DataCell(_cellText(item.ngayNhanViec, width: _colNormal)),
                              DataCell(_cellText(item.soTkNganHang, width: _colNormal)),
                              DataCell(_cellText(item.nganHang, width: _colNormal)),
                            ]);
                          }),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
                      const Divider(height: 0),
                      _buildPagination(),
                    ],
                  ),
          ),
        );
      },
    );
  }

  Widget _buildActionMenu(LaiXe item) {
    return PopupMenuButton<String>(
      padding: EdgeInsets.zero,
      icon: const Icon(Icons.more_vert, size: 20),
      onSelected: (value) {
        if (value == 'edit') {
          showLaiXeDialog(context, existingData: item);
        } else if (value == 'delete') {
          _confirmDelete(item);
        }
      },
      itemBuilder: (_) => [
        const PopupMenuItem(value: 'edit', child: ListTile(leading: Icon(Icons.edit, color: Colors.blue), title: Text('Sửa'), dense: true)),
        const PopupMenuItem(value: 'delete', child: ListTile(leading: Icon(Icons.delete, color: Colors.red), title: Text('Xoá'), dense: true)),
      ],
    );
  }

  void _confirmDelete(LaiXe item) {
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
                  MyText.bodyMedium('Xác nhận xoá', fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodyMedium(
                    'Bạn có chắc chắn muốn xoá lái xe "${item.title}"?',
                    maxLines: 4,
                    fontWeight: 600,
                    textAlign: TextAlign.center,
                  ),
                  MySpacing.height(20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      MyContainer(
                        onTap: controller.isDeleting.value ? null : () => Get.back(),
                        padding: MySpacing.xy(12, 8),
                        color: contentTheme.secondary.withOpacity(0.3),
                        child: MyText.bodySmall('Huỷ',
                            fontWeight: 600,
                            color: contentTheme.secondary),
                      ),
                      MySpacing.width(12),
                      MyContainer(
                        onTap: controller.isDeleting.value ? null : () => controller.deleteLaiXe(item.nid),
                        padding: MySpacing.xy(12, 8),
                        color: Colors.red.shade600,
                        child: Obx(() => controller.isDeleting.value
                          ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : MyText.bodySmall('Xoá', fontWeight: 600, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _headerCell(String text, {double? width}) {
    return SizedBox(
      width: width,
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700)),
    );
  }

  Widget _cellText(String text, {double? width}) {
    return SizedBox(
      width: width,
      child: Text(text, overflow: TextOverflow.ellipsis, maxLines: 3),
    );
  }

  Widget _buildPagination() {
    final int page = controller.currentPage.value;
    final int pages = controller.totalPages.value;
    final int total = controller.totalItems.value;

    final TextEditingController pageInputCtrl = TextEditingController(text: '$page');

    return Padding(
      padding: MySpacing.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          MyText.bodySmall(
            'Trang $page/$pages - Tổng $total dòng',
            fontWeight: 600,
          ),
          const SizedBox(width: 12),
          SizedBox(
            width: 60,
            height: 32,
            child: TextFormField(
              controller: pageInputCtrl,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                border: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade300)),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade300)),
              ),
              onFieldSubmitted: (value) {
                final p = int.tryParse(value);
                if (p != null) controller.goToPage(p);
              },
            ),
          ),
          const SizedBox(width: 12),
          _paginationButton(
            label: 'Trước',
            enabled: controller.hasPrev && !controller.isLoading.value,
            onTap: controller.prevPage,
          ),
          const SizedBox(width: 8),
          _paginationButton(
            label: 'Sau',
            enabled: controller.hasNext && !controller.isLoading.value,
            onTap: controller.nextPage,
          ),
        ],
      ),
    );
  }

  Widget _paginationButton({
    required String label,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    return MyContainer(
      onTap: enabled ? onTap : null,
      color: enabled ? contentTheme.primary : Colors.grey.shade300,
      padding: MySpacing.xy(12, 8),
      child: MyText.bodySmall(
        label,
        color: enabled ? contentTheme.onPrimary : Colors.grey.shade600,
        fontWeight: 700,
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Search dialog
  // ---------------------------------------------------------------------------

  void showSearchDialog(BuildContext context) {
    final searchCtrl = TextEditingController(text: controller.searchKeyword.value);

    showDialog(
      context: context,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 460, minWidth: 320),
          child: Padding(
            padding: MySpacing.all(20),
            child: Focus(
              onKeyEvent: (node, event) {
                if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.enter) {
                  controller.searchLaiXe(searchCtrl.text);
                  Get.back();
                  return KeyEventResult.handled;
                }
                return KeyEventResult.ignored;
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      MyText.titleMedium('Tìm kiếm lái xe', fontWeight: 700),
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
                          controller.searchLaiXe(searchCtrl.text);
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
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // Create / Edit dialog
  // ---------------------------------------------------------------------------

  void showLaiXeDialog(BuildContext context, {LaiXe? existingData}) {
    final bksCtrl = TextEditingController(text: existingData?.title ?? '');
    final maNvCtrl = TextEditingController(text: existingData?.maNhanVien ?? '');
    final sdtCtrl = TextEditingController(text: existingData?.sdt ?? '');
    final cccdCtrl = TextEditingController(text: existingData?.cccd ?? '');
    final ngayCapCtrl = TextEditingController(text: _toDisplayDate(existingData?.ngayCap ?? ''));
    final noiCapCtrl = TextEditingController(text: existingData?.noiCap ?? '');
    final hanCccdCtrl = TextEditingController(text: _toDisplayDate(existingData?.hanCccd ?? ''));
    final soBlCtrl = TextEditingController(text: existingData?.soBangLai ?? '');
    final loaiBlCtrl = TextEditingController(text: existingData?.loaiBangLai ?? '');
    final hanBlCtrl = TextEditingController(text: _toDisplayDate(existingData?.hanBangLai ?? ''));
    final ngayNvCtrl = TextEditingController(text: _toDisplayDate(existingData?.ngayNhanViec ?? ''));
    final soTkCtrl = TextEditingController(text: existingData?.soTkNganHang ?? '');
    final nganHangCtrl = TextEditingController(text: existingData?.nganHang ?? '');

    bool isTenError = false;

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          void submitForm() {
            if (controller.isSaving.value) return;
            final ten = bksCtrl.text.trim();
            if (ten.isEmpty) {
              setDialogState(() => isTenError = true);
              AppToast.warning('Vui lòng nhập họ tên');
              return;
            }

            final data = {
              'title': ten,
              'field_thong_tin_json': {
                'ma_nhan_vien': maNvCtrl.text.trim(),
                'sdt': sdtCtrl.text.trim(),
                'cccd': cccdCtrl.text.trim(),
                'ngay_cap': _toApiDate(ngayCapCtrl.text.trim()),
                'noi_cap': noiCapCtrl.text.trim(),
                'han_cccd': _toApiDate(hanCccdCtrl.text.trim()),
                'so_bang_lai': soBlCtrl.text.trim(),
                'loai_bang_lai': loaiBlCtrl.text.trim(),
                'han_bang_lai': _toApiDate(hanBlCtrl.text.trim()),
                'ngay_nhan_viec': _toApiDate(ngayNvCtrl.text.trim()),
                'so_tk_ngan_hang': soTkCtrl.text.trim(),
                'ngan_hang': nganHangCtrl.text.trim(),
              },
              'field_hoat_dong': 1,
            };

            if (existingData != null && existingData.nid > 0) {
              controller.updateLaiXeOnServer(existingData.nid, data);
            } else {
              controller.saveLaiXe(data);
            }
          }

          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 640, maxHeight: 700),
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
                          existingData == null ? 'Thêm lái xe' : 'Sửa lái xe',
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
                    child: Padding(
                      padding: MySpacing.all(20),
                      child: SingleChildScrollView(
                        child: Focus(
                          onKeyEvent: (node, event) {
                            if (event is KeyDownEvent && (event.logicalKey == LogicalKeyboardKey.enter || event.logicalKey == LogicalKeyboardKey.space)) {
                              submitForm();
                              return KeyEventResult.handled;
                            }
                            return KeyEventResult.ignored;
                          },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildInput('Họ tên', bksCtrl, required: true, hasError: isTenError, onChanged: (_) { if (isTenError) setDialogState(() => isTenError = false); }),
                              MySpacing.height(12),
                              _buildInput('Mã nhân viên', maNvCtrl),
                              MySpacing.height(12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildInput('SDT', sdtCtrl),
                                  ),
                                  MySpacing.width(12),
                                  Expanded(
                                    child: _buildInput('CCCD', cccdCtrl),
                                  ),
                                ],
                              ),
                              MySpacing.height(12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildDateInput('Ngày cấp', ngayCapCtrl),
                                  ),
                                  MySpacing.width(12),
                                  Expanded(
                                    child: _buildInput('Nơi cấp', noiCapCtrl),
                                  ),
                                ],
                              ),
                              MySpacing.height(12),
                              _buildDateInput('Hạn CCCD', hanCccdCtrl),
                              MySpacing.height(12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildInput('Số bằng lái', soBlCtrl),
                                  ),
                                  MySpacing.width(12),
                                  Expanded(
                                    child: _buildInput('Loại bằng lái', loaiBlCtrl),
                                  ),
                                ],
                              ),
                              MySpacing.height(12),
                              _buildDateInput('Hạn bằng lái', hanBlCtrl),
                              MySpacing.height(12),
                              _buildDateInput('Ngày nhận việc', ngayNvCtrl),
                              MySpacing.height(12),
                              Row(
                                children: [
                                  Expanded(
                                    child: _buildInput('Số TK ngân hàng', soTkCtrl),
                                  ),
                                  MySpacing.width(12),
                                  Expanded(
                                    child: _buildInput('Ngân hàng', nganHangCtrl),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
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
                        Tooltip(
                          message: 'Lưu lái xe',
                          child: MyContainer(
                          onTap: submitForm,
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

  // ---------------------------------------------------------------------------
  // Input builders
  // ---------------------------------------------------------------------------

  Widget _buildInput(String label, TextEditingController ctrl,
      {bool isNumber = false, bool isInteger = false, bool required = false, bool hasError = false, ValueChanged<String>? onChanged}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            MyText.labelMedium(label),
            if (required)
              const Text(' *', style: TextStyle(color: Colors.red)),
          ],
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          onChanged: onChanged,
          keyboardType: isInteger
              ? TextInputType.number
              : isNumber
                  ? TextInputType.numberWithOptions(decimal: true)
                  : TextInputType.text,
          decoration: InputDecoration(
            filled: true,
            fillColor: hasError ? Colors.red.shade50 : Colors.white,
            border: OutlineInputBorder(
              borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(color: hasError ? Colors.red : Colors.blue, width: 2),
            ),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  Widget _buildDateInput(String label, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.labelMedium(label),
        const SizedBox(height: 6),
        TextFormField(
          controller: ctrl,
          onChanged: (val) {
            final formatted = _formatDateInput(val);
            if (formatted != val) {
              ctrl.value = TextEditingValue(
                text: formatted,
                selection: TextSelection.collapsed(offset: formatted.length),
              );
            }
          },
          keyboardType: TextInputType.number,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(color: Colors.blue, width: 2),
            ),
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            hintText: 'dd-mm-yyyy',
            suffixIcon: IconButton(
              icon: const Icon(Icons.calendar_month),
              onPressed: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _parseDateOrNow(ctrl.text),
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                );
                if (picked != null) {
                  ctrl.text = DateFormat('dd-MM-yyyy').format(picked);
                }
              },
            ),
          ),
        ),
      ],
    );
  }

  DateTime _parseDateOrNow(String text) {
    try {
      return DateFormat('dd-MM-yyyy').parse(text);
    } catch (_) {}
    return DateTime.now();
  }

  String _formatDateInput(String value) {
    final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.length > 8) return value;

    if (digits.length >= 5) {
      return '${digits.substring(0, 2)}-${digits.substring(2, 4)}-${digits.substring(4)}';
    }
    if (digits.length >= 3) {
      return '${digits.substring(0, 2)}-${digits.substring(2)}';
    }
    return digits;
  }

  String _toDisplayDate(String apiDate) {
    if (apiDate.isEmpty) return '';
    try {
      final parsed = DateFormat('dd-MM-yyyy').parse(apiDate);
      return DateFormat('dd-MM-yyyy').format(parsed);
    } catch (_) {}
    try {
      final parsed = DateFormat('yyyy-MM-dd').parse(apiDate);
      return DateFormat('dd-MM-yyyy').format(parsed);
    } catch (_) {}
    return apiDate;
  }

  String _toApiDate(String displayDate) {
    if (displayDate.isEmpty) return '';
    try {
      final parsed = DateFormat('dd-MM-yyyy').parse(displayDate);
      return DateFormat('dd-MM-yyyy').format(parsed);
    } catch (_) {}
    return displayDate;
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:remixicon/remixicon.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/controller/kho555/phuong_tien_controller.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/phuong_tien.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class PhuongTienPageScreen extends StatefulWidget with UIMixin {
  const PhuongTienPageScreen({super.key});

  @override
  State<PhuongTienPageScreen> createState() => _PhuongTienPageScreenState();
}

class _PhuongTienPageScreenState extends State<PhuongTienPageScreen> {
  final controller = Get.put(PhuongTienController());
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

  @override
  void dispose() {
    _horizontalScroll.dispose();
    _verticalScroll.dispose();
    super.dispose();
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

  Widget buildPhuongTienTable(List<PhuongTien> data) {
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
          columnSpacing: 12,
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('', width: 60)),
            DataColumn(label: _headerCell('STT', width: 40)),
            DataColumn(label: _headerCell('Biển kiểm soát', width: 130)),
            DataColumn(label: _headerCell('Mã tài sản', width: 120)),
            DataColumn(label: _headerCell('Loại PT', width: 120)),
            DataColumn(label: _headerCell('Hãng xe', width: 130)),
            DataColumn(label: _headerCell('Năm SX', width: 70)),
            DataColumn(label: _headerCell('Giá mua', width: 120)),
            DataColumn(label: _headerCell('Ngày mua', width: 110)),
            DataColumn(label: _headerCell('Số ĐK', width: 120)),
            DataColumn(label: _headerCell('Hạn ĐK', width: 110)),
            DataColumn(label: _headerCell('Số BHTV', width: 120)),
            DataColumn(label: _headerCell('Hạn BHTV', width: 110)),
            DataColumn(label: _headerCell('Số BHTNDS', width: 120)),
            DataColumn(label: _headerCell('Hạn BHTNDS', width: 110)),
            DataColumn(label: _headerCell('Ngày PH', width: 110)),
            DataColumn(label: _headerCell('Hạn PH', width: 110)),
          ],
          rows: data.isEmpty
              ? [
                  DataRow(
                    cells: List.generate(17, (_) => const DataCell(SizedBox.shrink())),
                  ),
                ]
              : [for (var i = 0; i < data.length; i++)
                  DataRow(
                    cells: [
                      DataCell(
                        PopupMenuButton<String>(
                          padding: EdgeInsets.zero,
                          icon: const Icon(Icons.more_vert, size: 20),
                          onSelected: (value) {
                            if (value == 'edit') {
                              Get.closeAllSnackbars();
                              showPhuongTienDialog(context, existingData: data[i]);
                            } else if (value == 'delete') {
                              Get.closeAllSnackbars();
                              showDeleteConfirmDialog(context, data[i].nid);
                            }
                          },
                          itemBuilder: (_) => [
                            const PopupMenuItem(value: 'edit', child: ListTile(leading: Icon(Icons.edit, color: Colors.blue), title: Text('Sửa'), dense: true)),
                            const PopupMenuItem(value: 'delete', child: ListTile(leading: Icon(Icons.delete, color: Colors.red), title: Text('Xoá'), dense: true)),
                          ],
                        ),
                      ),
                      DataCell(_cellText('${i + 1}', width: 30)),
                      DataCell(_cellText(data[i].title, width: 130)),
                      DataCell(_cellText(data[i].maTaiSan, width: 120)),
                      DataCell(_cellText(data[i].loaiPhuongTien, width: 120)),
                      DataCell(_cellText(data[i].hangXe, width: 130)),
                      DataCell(_cellText(data[i].namSanXuat > 0 ? data[i].namSanXuat.toString() : '', width: 70)),
                      DataCell(_cellText(_formatCurrency(data[i].giaMua), width: 120)),
                      DataCell(_cellText(_toDisplayDate(data[i].ngayMua), width: 110)),
                      DataCell(_cellText(data[i].soDangKiem, width: 120)),
                      DataCell(_cellText(_toDisplayDate(data[i].hanDangKiem), width: 110)),
                      DataCell(_cellText(data[i].soBaoHiemThanVo, width: 120)),
                      DataCell(_cellText(_toDisplayDate(data[i].hanBaoHiemThanVo), width: 110)),
                      DataCell(_cellText(data[i].soBaoHiemTnds, width: 120)),
                      DataCell(_cellText(_toDisplayDate(data[i].hanBaoHiemTnds), width: 110)),
                      DataCell(_cellText(_toDisplayDate(data[i].ngayPhuHieu), width: 110)),
                      DataCell(_cellText(_toDisplayDate(data[i].hanPhuHieu), width: 110)),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<PhuongTienController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Phương tiện',
          actions: [
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars();
                showPhuongTienDialog(context);
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
            Obx(() => MyContainer(
              onTap: controller.isLoading.value ? null : () {
                controller.clearSearch();
                controller.fetchPhuongTien();
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
                      buildPhuongTienTable(controller.phuongTienList),
                      const SizedBox(height: 12),
                      _buildPagination(),
                    ],
                  ),
          ),
        );
      },
    );
  }

  String _formatCurrency(double value) {
    if (value <= 0) return '';
    return NumberFormat('#,###').format(value).replaceAll(',', '.');
  }

  double _parseCurrency(String text) {
    return double.tryParse(text.replaceAll('.', '')) ?? 0;
  }

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
              borderSide: BorderSide(
                color: hasError ? Colors.red : Colors.grey.shade300,
              ),
            ),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(
                color: hasError ? Colors.red : Colors.grey.shade300,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(
                color: hasError ? Colors.red : Colors.blue,
                width: 2,
              ),
            ),
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          ),
        ),
      ],
    );
  }

  String _toDisplayDate(String apiDate) {
    if (apiDate.isEmpty) return '';
    try {
      final parsed = DateFormat('yyyy-MM-dd').parse(apiDate);
      return DateFormat('dd/MM/yyyy').format(parsed);
    } catch (_) {}
    return apiDate;
  }

  String _toApiDate(String displayDate) {
    if (displayDate.isEmpty) return '';
    try {
      final parsed = DateFormat('dd/MM/yyyy').parse(displayDate);
      return DateFormat('yyyy-MM-dd').format(parsed);
    } catch (_) {}
    return displayDate;
  }

  String _formatDateInput(String raw) {
    final digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) return '';
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length && i < 8; i++) {
      if (i == 2 || i == 4) buffer.write('/');
      buffer.write(digits[i]);
    }
    return buffer.toString();
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
            hintText: 'dd/mm/yyyy',
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
                  ctrl.text = DateFormat('dd/MM/yyyy').format(picked);
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
      return DateFormat('dd/MM/yyyy').parse(text);
    } catch (_) {}
    return DateTime.now();
  }

  void showPhuongTienDialog(BuildContext context, {PhuongTien? existingData}) {
    final bksCtrl = TextEditingController(text: existingData?.title ?? '');
    final maTsCtrl = TextEditingController(text: existingData?.maTaiSan ?? '');
    final loaiPtCtrl = TextEditingController(text: existingData?.loaiPhuongTien ?? '');
    final hangXeCtrl = TextEditingController(text: existingData?.hangXe ?? '');
    final namSxCtrl = TextEditingController(
      text: (existingData?.namSanXuat ?? 0) > 0 ? existingData!.namSanXuat.toString() : '',
    );
    final giaMuaCtrl = TextEditingController(
      text: _formatCurrency(existingData?.giaMua ?? 0),
    );
    giaMuaCtrl.addListener(() {
      final text = giaMuaCtrl.text;
      final clean = text.replaceAll('.', '');
      if (clean.isEmpty) return;
      final num = int.tryParse(clean);
      if (num != null) {
        final formatted = _formatCurrency(num.toDouble());
        if (formatted != text) {
          giaMuaCtrl.text = formatted;
          giaMuaCtrl.selection = TextSelection.collapsed(offset: formatted.length);
        }
      }
    });
    final ngayMuaCtrl = TextEditingController(text: _toDisplayDate(existingData?.ngayMua ?? ''));
    final soDkCtrl = TextEditingController(text: existingData?.soDangKiem ?? '');
    final hanDkCtrl = TextEditingController(text: _toDisplayDate(existingData?.hanDangKiem ?? ''));
    final soBhtvCtrl = TextEditingController(text: existingData?.soBaoHiemThanVo ?? '');
    final hanBhtvCtrl = TextEditingController(text: _toDisplayDate(existingData?.hanBaoHiemThanVo ?? ''));
    final soBhtndsCtrl = TextEditingController(text: existingData?.soBaoHiemTnds ?? '');
    final hanBhtndsCtrl = TextEditingController(text: _toDisplayDate(existingData?.hanBaoHiemTnds ?? ''));
    final ngayPhCtrl = TextEditingController(text: _toDisplayDate(existingData?.ngayPhuHieu ?? ''));
    final hanPhCtrl = TextEditingController(text: _toDisplayDate(existingData?.hanPhuHieu ?? ''));

    bool isBksError = false;

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          void submitForm() {
            if (controller.isSaving.value) return;
            final bks = bksCtrl.text.trim();
            if (bks.isEmpty) {
              setDialogState(() => isBksError = true);
              AppToast.warning('Vui lòng nhập biển kiểm soát');
              return;
            }

            final data = {
              'title': bks,
              'field_thong_tin_json': {
                'ma_tai_san': maTsCtrl.text.trim(),
                'loai_phuong_tien': loaiPtCtrl.text.trim(),
                'hang_xe': hangXeCtrl.text.trim(),
                'nam_san_xuat': int.tryParse(namSxCtrl.text.trim()) ?? 0,
                'gia_mua': _parseCurrency(giaMuaCtrl.text.trim()),
                'ngay_mua': _toApiDate(ngayMuaCtrl.text.trim()),
                'so_dang_kiem': soDkCtrl.text.trim(),
                'han_dang_kiem': _toApiDate(hanDkCtrl.text.trim()),
                'so_bao_hiem_than_vo': soBhtvCtrl.text.trim(),
                'han_bao_hiem_than_vo': _toApiDate(hanBhtvCtrl.text.trim()),
                'so_bao_hiem_tnds': soBhtndsCtrl.text.trim(),
                'han_bao_hiem_tnds': _toApiDate(hanBhtndsCtrl.text.trim()),
                'ngay_phu_hieu': _toApiDate(ngayPhCtrl.text.trim()),
                'han_phu_hieu': _toApiDate(hanPhCtrl.text.trim()),
              },
              'field_hoat_dong': 1,
            };

            if (existingData != null && existingData.nid > 0) {
              controller.updatePhuongTienOnServer(
                  existingData.nid, data);
            } else {
              controller.savePhuongTien(data);
            }
          }

          return Dialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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
                          existingData == null
                              ? 'Thêm phương tiện'
                              : 'Sửa phương tiện',
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
                            _buildInput('Biển kiểm soát', bksCtrl, required: true, hasError: isBksError, onChanged: (_) { if (isBksError) setDialogState(() => isBksError = false); }),
                            MySpacing.height(12),
                            _buildInput('Mã tài sản', maTsCtrl),
                            MySpacing.height(12),
                            _buildInput('Loại phương tiện', loaiPtCtrl),
                            MySpacing.height(12),
                            _buildInput('Hãng xe', hangXeCtrl),
                            MySpacing.height(12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInput('Năm sản xuất',
                                      namSxCtrl,
                                      isNumber: true,
                                      isInteger: true),
                                ),
                                MySpacing.width(12),
                                Expanded(
                                  child: _buildInput('Giá mua', giaMuaCtrl,
                                      isNumber: true),
                                ),
                              ],
                            ),
                            MySpacing.height(12),
                            _buildDateInput('Ngày mua', ngayMuaCtrl),
                            MySpacing.height(12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInput('Số đăng kiểm', soDkCtrl),
                                ),
                                MySpacing.width(12),
                                Expanded(
                                  child: _buildDateInput(
                                      'Hạn đăng kiểm', hanDkCtrl),
                                ),
                              ],
                            ),
                            MySpacing.height(12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInput(
                                      'Số BHTV', soBhtvCtrl),
                                ),
                                MySpacing.width(12),
                                Expanded(
                                  child: _buildDateInput(
                                      'Hạn BHTV', hanBhtvCtrl),
                                ),
                              ],
                            ),
                            MySpacing.height(12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInput(
                                      'Số BHTNDS', soBhtndsCtrl),
                                ),
                                MySpacing.width(12),
                                Expanded(
                                  child: _buildDateInput(
                                      'Hạn BHTNDS', hanBhtndsCtrl),
                                ),
                              ],
                            ),
                            MySpacing.height(12),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildDateInput(
                                      'Ngày phù hiệu', ngayPhCtrl),
                                ),
                                MySpacing.width(12),
                                Expanded(
                                  child: _buildDateInput(
                                      'Hạn phù hiệu', hanPhCtrl),
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
                          message: 'Lưu phương tiện',
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
            child: Focus(
              onKeyEvent: (node, event) {
                if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.enter) {
                  controller.searchPhuongTien(searchCtrl.text);
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
                      MyText.titleMedium('Tìm kiếm phương tiện', fontWeight: 700),
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
                          controller.searchPhuongTien(searchCtrl.text);
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

  Widget _buildPagination() {
    final int page = controller.currentPage.value;
    final int pages = controller.totalPages.value;
    final int total = controller.totalItems.value;

    final TextEditingController pageInputCtrl = TextEditingController(text: '$page');

    return Row(
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
              border: OutlineInputBorder(
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(color: Colors.grey.shade300),
              ),
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
                  MyText.bodyMedium('Xác nhận xoá', fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodyMedium(
                    'Bạn có chắc chắn muốn xoá phương tiện này không?',
                    maxLines: 4,
                    fontWeight: 600,
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
                        child: MyText.bodySmall('Huỷ',
                            fontWeight: 600,
                            color: contentTheme.secondary),
                      ),
                      MySpacing.width(12),
                      MyContainer(
                        onTap: () {
                          Get.back();
                          controller.deletePhuongTien(nid);
                        },
                        padding: MySpacing.xy(12, 8),
                        color: Colors.red.shade600,
                        child: MyText.bodySmall('Xoá',
                            fontWeight: 600, color: Colors.white),
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
}

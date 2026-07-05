import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:remixicon/remixicon.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/controller/kho555/hop_dong_controller.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/ben_thu_ba.dart';
import 'package:ttk_logistics/models/kho555/hop_dong.dart';
import 'package:ttk_logistics/services/kho555/ben_thu_ba_service.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class HopDongPageScreen extends StatefulWidget with UIMixin {
  const HopDongPageScreen({super.key});

  @override
  State<HopDongPageScreen> createState() => _HopDongPageScreenState();
}

class _HopDongPageScreenState extends State<HopDongPageScreen> {
  final HopDongController controller = Get.put(HopDongController());
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
  static const double _colMed = 180;
  static const double _colDate = 110;
  static const double _colKH = 160;
  static const double _colNVKD = 140;

  @override
  void dispose() {
    _horizontalScroll.dispose();
    _verticalScroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<HopDongController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Hợp đồng',
          actions: [
            MyContainer(
              onTap: () => showHopDongDialog(context),
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
                    const SizedBox(
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
                                    columnSpacing: 12,
                                    horizontalMargin: 12,
                                    columns: [
                                      DataColumn(label: _headerCell('', width: _actionWidth)),
                                      DataColumn(label: _headerCell('STT', width: _sttWidth)),
                                      DataColumn(label: _headerCell('Số HĐ', width: _colNormal)),
                                      DataColumn(label: _headerCell('Ngày ký', width: _colDate)),
                                      DataColumn(label: _headerCell('Hạn HĐ', width: _colDate)),
                                      DataColumn(label: _headerCell('Tên KH', width: _colKH)),
                                      DataColumn(label: _headerCell('Phân loại', width: _colKH)),
                                      DataColumn(label: _headerCell('Tên gọn', width: _colKH)),
                                      DataColumn(label: _headerCell('SĐT', width: 120)),
                                      DataColumn(label: _headerCell('MST/CCCD', width: 120)),
                                      DataColumn(label: _headerCell('NVKD', width: _colNVKD)),
                                      DataColumn(label: _headerCell('Ghi chú', width: _colMed)),
                                    ],
                                    rows: List.generate(controller.hopDongList.length, (index) {
                                      final item = controller.hopDongList[index];
                                      final stt = (controller.currentPage.value - 1) * controller.limit.value + index + 1;

                                      return DataRow(cells: [
                                        DataCell(_buildActionMenu(item)),
                                        DataCell(_cellText('$stt', width: _sttWidth)),
                                        DataCell(_cellText(item.soHopDong, width: _colNormal)),
                                        DataCell(_cellText(item.ngayHopDong, width: _colDate)),
                                        DataCell(_cellText(item.hanHopDong, width: _colDate)),
                                        DataCell(_cellText(item.khachHang?.title ?? '—', width: _colKH)),
                                        DataCell(_cellText(item.khachHang?.phanLoai ?? '—', width: _colKH)),
                                        DataCell(_cellText(item.khachHang?.tenGanGon ?? '—', width: _colKH)),
                                        DataCell(_cellText(item.khachHang?.soDienThoai ?? '—', width: 120)),
                                        DataCell(_cellText(item.khachHang?.maSoThueCccd ?? '—', width: 120)),
                                        DataCell(_cellText(
                                          item.nhanVienKinhDoanh != null
                                              ? (item.nhanVienKinhDoanh!.tenGanGon.isNotEmpty ? item.nhanVienKinhDoanh!.tenGanGon : item.nhanVienKinhDoanh!.title)
                                              : '—',
                                          width: _colNVKD,
                                        )),
                                        DataCell(_cellText(item.ghiChu, width: _colMed)),
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

  Widget _buildActionMenu(HopDong item) {
    return PopupMenuButton<String>(
      padding: EdgeInsets.zero,
      icon: const Icon(Icons.more_vert, size: 20),
      onSelected: (value) {
        if (value == 'edit') {
          showHopDongDialog(context, existingData: item);
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

  void _confirmDelete(HopDong item) {
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
                  Icon(Icons.warning_amber_rounded, color: Colors.red.shade600, size: 48),
                  MySpacing.height(20),
                  MyText.bodyMedium('Xác nhận xoá', fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodyMedium(
                    'Bạn có chắc chắn muốn xoá hợp đồng "${item.title}"?',
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
                        child: MyText.bodySmall('Huỷ', fontWeight: 600, color: contentTheme.secondary),
                      ),
                      MySpacing.width(12),
                      MyContainer(
                        onTap: controller.isDeleting.value ? null : () => controller.deleteHopDong(item.nid),
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

  void showSearchDialog(BuildContext context) {
    final searchCtrl = TextEditingController(text: controller.searchKeyword.value);
    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          void submitSearch() {
            controller.searchHopDong(searchCtrl.text.trim());
            Get.back();
          }
          return Dialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 450, minWidth: 280),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        MyText.titleMedium('Tìm kiếm hợp đồng', fontWeight: 700),
                        InkWell(onTap: () => Get.back(), child: const Icon(Icons.close)),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _buildInput('Từ khoá', searchCtrl, onSubmitted: (_) => submitSearch()),
                  ),
                  const SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        MyContainer(
                          onTap: () => Get.back(),
                          color: contentTheme.secondary.withAlpha(36),
                          padding: MySpacing.xy(12, 8),
                          child: MyText.bodySmall('Đóng', fontWeight: 600, color: contentTheme.secondary),
                        ),
                        const SizedBox(width: 12),
                        MyContainer(
                          onTap: submitSearch,
                          color: contentTheme.primary,
                          padding: MySpacing.xy(12, 8),
                          child: MyText.bodySmall('Tìm', fontWeight: 600, color: contentTheme.onPrimary),
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

  String _benThuBaDisplay(BenThuBa p) {
    return p.tenGanGon.isNotEmpty ? p.tenGanGon : p.title;
  }

  Widget _buildInput(String label, TextEditingController ctrl,
      {bool isNumber = false, bool isInteger = false, bool required = false, bool hasError = false, ValueChanged<String>? onSubmitted, ValueChanged<String>? onChanged}) {
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
          onFieldSubmitted: onSubmitted,
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

  Widget _buildDateInput(String label, TextEditingController ctrl, {bool required = false, bool hasError = false, ValueChanged<String>? onChanged}) {
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
          onChanged: (val) {
            if (onChanged != null) onChanged(val);
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
              borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
            ),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
            ),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(color: hasError ? Colors.red : Colors.blue, width: 2),
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

  void showHopDongDialog(BuildContext context, {HopDong? existingData}) {
    final soHdCtrl = TextEditingController(text: existingData?.soHopDong ?? existingData?.title ?? '');
    final ngayKyCtrl = TextEditingController(text: _toDisplayDate(existingData?.ngayHopDong ?? ''));
    final hanHdCtrl = TextEditingController(text: _toDisplayDate(existingData?.hanHopDong ?? ''));
    final ghiChuCtrl = TextEditingController(text: existingData?.ghiChu ?? '');

    BenThuBa? selectedKH = existingData?.khachHang != null
        ? BenThuBa(
            nid: existingData!.khachHang!.nid,
            title: existingData.khachHang!.title,
            tenCongTy: existingData.khachHang!.title,
            tenGanGon: existingData.khachHang!.tenGanGon,
            soDienThoai: existingData.khachHang!.soDienThoai,
            maSoThueCccd: existingData.khachHang!.maSoThueCccd,
            diaChi: existingData.khachHang!.diaChi,
            ghiChu: existingData.khachHang!.ghiChu,
            thongTinNganHang: const [],
            fieldPhanLoai: existingData.khachHang!.phanLoai,
            hoatDong: 1,
          )
        : null;
    BenThuBa? selectedNVKD = existingData?.nhanVienKinhDoanh != null
        ? BenThuBa(
            nid: existingData!.nhanVienKinhDoanh!.nid,
            title: existingData.nhanVienKinhDoanh!.title,
            tenCongTy: existingData.nhanVienKinhDoanh!.title,
            tenGanGon: existingData.nhanVienKinhDoanh!.tenGanGon,
            soDienThoai: existingData.nhanVienKinhDoanh!.soDienThoai,
            maSoThueCccd: existingData.nhanVienKinhDoanh!.maSoThueCccd,
            diaChi: existingData.nhanVienKinhDoanh!.diaChi,
            ghiChu: existingData.nhanVienKinhDoanh!.ghiChu,
            thongTinNganHang: const [],
            fieldPhanLoai: existingData.nhanVienKinhDoanh!.phanLoai,
            hoatDong: 1,
          )
        : null;

    bool isSoHdError = false;
    bool isNgayKyError = false;
    bool isHanHdError = false;
    bool isKhError = false;

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          void submitForm() {
            if (controller.isSaving.value) return;
            final soHd = soHdCtrl.text.trim();
            final ngayKy = ngayKyCtrl.text.trim();
            final hanHd = hanHdCtrl.text.trim();

            if (soHd.isEmpty) {
              setDialogState(() => isSoHdError = true);
              AppToast.warning('Vui lòng nhập số hợp đồng');
              return;
            }
            if (ngayKy.isEmpty) {
              setDialogState(() => isNgayKyError = true);
              AppToast.warning('Vui lòng nhập ngày ký');
              return;
            }
            if (hanHd.isEmpty) {
              setDialogState(() => isHanHdError = true);
              AppToast.warning('Vui lòng nhập hạn hợp đồng');
              return;
            }
            if (selectedKH == null) {
              setDialogState(() => isKhError = true);
              AppToast.warning('Vui lòng chọn khách hàng');
              return;
            }

            final data = {
              'title': soHd,
              'field_thong_tin_json': {
                'so_hop_dong': soHd,
                'ngay_hop_dong': _toApiDate(ngayKy),
                'han_hop_dong': _toApiDate(hanHd),
                'nid_ben_thu_ba': selectedKH!.nid,
                if (selectedNVKD != null) 'nid_nhan_vien_kinh_doanh': selectedNVKD!.nid,
                'ghi_chu': ghiChuCtrl.text.trim(),
              },
              'field_hoat_dong': 1,
            };

            if (existingData != null && existingData.nid > 0) {
              controller.updateHopDongOnServer(existingData.nid, data);
            } else {
              controller.saveHopDong(data);
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
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        MyText.titleMedium(
                          existingData == null ? 'Thêm hợp đồng' : 'Sửa hợp đồng',
                          fontWeight: 700,
                        ),
                        InkWell(onTap: () => Get.back(), child: const Icon(Icons.close)),
                      ],
                    ),
                  ),
                  Flexible(
                    child: Padding(
                      padding: MySpacing.all(20),
                      child: SingleChildScrollView(
                        child: Focus(
                          onKeyEvent: (node, event) {
                            if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.enter) {
                              submitForm();
                              return KeyEventResult.handled;
                            }
                            return KeyEventResult.ignored;
                          },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _buildInput('Số hợp đồng', soHdCtrl, required: true, hasError: isSoHdError, onChanged: (_) { if (isSoHdError) setDialogState(() => isSoHdError = false); }),
                              MySpacing.height(12),
                              Row(
                                children: [
                                  Expanded(child: _buildDateInput('Ngày ký', ngayKyCtrl, required: true, hasError: isNgayKyError, onChanged: (_) { if (isNgayKyError) setDialogState(() => isNgayKyError = false); })),
                                  MySpacing.width(12),
                                  Expanded(child: _buildDateInput('Hạn hợp đồng', hanHdCtrl, required: true, hasError: isHanHdError, onChanged: (_) { if (isHanHdError) setDialogState(() => isHanHdError = false); })),
                                ],
                              ),
                              MySpacing.height(12),
                              _buildBenThuBaSelector(
                                'Khách hàng',
                                selectedKH,
                                phanLoai: '',
                                excludePhanLoai: 'Nhân viên kinh doanh',
                                hasError: isKhError,
                                required: true,
                                onChanged: (p) {
                                  setDialogState(() {
                                    selectedKH = p;
                                    isKhError = false;
                                  });
                                },
                              ),
                              MySpacing.height(12),
                              _buildBenThuBaSelector(
                                'Nhân viên kinh doanh',
                                selectedNVKD,
                                phanLoai: 'Nhân viên kinh doanh',
                                hasError: false,
                                required: false,
                                onChanged: (p) {
                                  setDialogState(() => selectedNVKD = p);
                                },
                              ),
                              MySpacing.height(12),
                              _buildInput('Ghi chú', ghiChuCtrl),
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
                          child: MyText.bodySmall('Đóng', fontWeight: 600, color: contentTheme.secondary),
                        ),
                        const SizedBox(width: 12),
                        Tooltip(
                          message: 'Lưu hợp đồng',
                          child: MyContainer(
                            onTap: submitForm,
                            color: contentTheme.primary,
                            padding: MySpacing.xy(12, 8),
                            child: Obx(() => controller.isSaving.value
                                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : MyText.bodySmall('Lưu', fontWeight: 600, color: contentTheme.onPrimary),
                            ),
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

  Widget _buildBenThuBaSelector(
    String label,
    BenThuBa? selected, {
    required String phanLoai,
    String excludePhanLoai = '',
    required bool hasError,
    bool required = false,
    required ValueChanged<BenThuBa?> onChanged,
  }) {
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
        _BenThuBaDropdown(
          selected: selected,
          phanLoai: phanLoai,
          excludePhanLoai: excludePhanLoai,
          hasError: hasError,
          displayFn: _benThuBaDisplay,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _headerCell(String text, {required double width}) {
    return SizedBox(
      width: width,
      child: MyText.labelMedium(text, fontWeight: 700),
    );
  }

  Widget _cellText(String text, {required double width}) {
    return SizedBox(
      width: width,
      child: MyText.bodySmall(
        text.isEmpty ? '—' : text,
        color: text.isEmpty ? Colors.black38 : null,
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
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

  String _formatDateInput(String raw) {
    final digits = raw.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) return '';
    final buffer = StringBuffer();
    for (var i = 0; i < digits.length && i < 8; i++) {
      if (i == 2 || i == 4) buffer.write('-');
      buffer.write(digits[i]);
    }
    return buffer.toString();
  }

  String _toDisplayDate(String apiDate) {
    if (apiDate.isEmpty) return '';
    try {
      return DateFormat('dd-MM-yyyy').parse(apiDate).toString().split(' ')[0];
    } catch (_) {}
    try {
      return DateFormat('yyyy-MM-dd').parse(apiDate).toString().split(' ')[0].split('-').reversed.join('-');
    } catch (_) {}
    return apiDate;
  }

  String _toApiDate(String displayDate) {
    if (displayDate.isEmpty) return '';
    try {
      return DateFormat('dd-MM-yyyy').parse(displayDate).toString().split(' ')[0].split('-').reversed.join('-');
    } catch (_) {}
    return displayDate;
  }
}

class _BenThuBaDropdown extends StatefulWidget {
  final BenThuBa? selected;
  final String phanLoai;
  final String excludePhanLoai;
  final bool hasError;
  final ValueChanged<BenThuBa?> onChanged;
  final String Function(BenThuBa) displayFn;

  const _BenThuBaDropdown({
    required this.selected,
    required this.phanLoai,
    required this.excludePhanLoai,
    required this.hasError,
    required this.onChanged,
    required this.displayFn,
  });

  @override
  State<_BenThuBaDropdown> createState() => _BenThuBaDropdownState();
}

class _BenThuBaDropdownState extends State<_BenThuBaDropdown> {
  final TextEditingController _ctrl = TextEditingController();
  late final String Function(BenThuBa) _displayFn = widget.displayFn;
  List<BenThuBa> _list = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.selected != null) {
      _ctrl.text = _displayFn(widget.selected!);
    }
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final list = await BenThuBaService.fetchBenThuBaByPhanLoai(phanLoai: widget.phanLoai);
      var filtered = list;
      if (widget.excludePhanLoai.isNotEmpty) {
        filtered = list.where((p) => !p.phanLoaiList.any((pl) => pl.toLowerCase().contains(widget.excludePhanLoai.toLowerCase()))).toList();
      }
      if (!mounted) return;
      setState(() {
        _list = filtered;
      });
    } catch (e) {
      if (mounted) AppToast.error(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: Autocomplete<BenThuBa>(
        initialValue: TextEditingValue(text: _ctrl.text),
        displayStringForOption: (p) => _displayFn(p),
        optionsBuilder: (textEditingValue) {
          if (textEditingValue.text.isEmpty) return _list;
          final q = textEditingValue.text.toLowerCase();
          return _list.where((p) =>
            _displayFn(p).toLowerCase().contains(q) ||
            p.title.toLowerCase().contains(q) ||
            p.soDienThoai.toLowerCase().contains(q) ||
            p.maSoThueCccd.toLowerCase().contains(q));
        },
        onSelected: (p) {
          _ctrl.text = _displayFn(p);
          widget.onChanged(p);
        },
        fieldViewBuilder: (context, fieldCtrl, focusNode, onSubmitted) {
          fieldCtrl.value = TextEditingValue(text: _ctrl.text);
          return TextFormField(
            controller: fieldCtrl,
            focusNode: focusNode,
            style: const TextStyle(color: Colors.black),
            decoration: InputDecoration(
              isDense: true,
              filled: true,
              fillColor: Colors.white,
              hintText: _isLoading ? 'Đang tải...' : 'Chọn hoặc nhập để tìm...',
              hintStyle: const TextStyle(color: Colors.black38),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              border: OutlineInputBorder(
                borderSide: BorderSide(color: widget.hasError ? Colors.red : Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(color: widget.hasError ? Colors.red : Colors.grey.shade300),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: Colors.blue, width: 2),
              ),
            ),
          );
        },
        optionsViewBuilder: (context, onSelected, opts) {
          return Align(
            alignment: Alignment.topLeft,
            child: Material(
              color: Colors.white,
              elevation: 4,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 240, minWidth: 360),
                child: ListView(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  children: [
                    for (var i = 0; i < opts.length; i++)
                      Builder(
                        builder: (context) {
                          final highlighted = AutocompleteHighlightedOption.of(context);
                          final isHi = i == highlighted;
                          final p = opts.elementAt(i);
                          return InkWell(
                            onTap: () => onSelected(p),
                            child: Container(
                              color: isHi ? Colors.grey.shade300 : Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _displayFn(p),
                                    style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
                                  ),
                                  if (p.fieldPhanLoai.isNotEmpty)
                                    Text(
                                      p.fieldPhanLoai,
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
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
}

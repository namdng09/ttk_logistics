import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:remixicon/remixicon.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/kho555/ben_thu_ba_controller.dart'
    show BenThuBaController;
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/ben_thu_ba.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class BenThuBaPageScreen extends StatefulWidget with UIMixin {
  const BenThuBaPageScreen({super.key});

  @override
  State<BenThuBaPageScreen> createState() => _BenThuBaPageScreenState();
}

class _BenThuBaPageScreenState extends State<BenThuBaPageScreen> {
  final controller = Get.put(BenThuBaController());
  final contentTheme = AdminTheme.theme.contentTheme;
  final List<String> phanLoaiOptions = const [
    'Doanh nghiệp',
    'Cá nhân',
    'Nhà cung cấp',
    'Khách hàng',
    'Nhân viên kinh doanh',
  ];

  static const double _sttWidth = 40;
  static const double _actionWidth = 60;
  static const double _colLarge = 260;
  static const double _colNormal = 170;
  static const double _colMed = 150;
  static const double _colPhanLoai = 210;

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

  Widget buildBenThuBaTable(List<BenThuBa> data) {
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
          _handleDragUpdate(
            DragUpdateDetails(
              delta: event.delta,
              globalPosition: event.position,
            ),
          );
        },
        onPointerUp: (_) {
          if (_isDragging) setState(() => _isDragging = false);
        },
        onPointerCancel: (_) {
          if (_isDragging) setState(() => _isDragging = false);
        },
        child: Scrollbar(
          controller: _horizontalScroll,
          notificationPredicate: (notification) => notification.depth == 0,
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
                  headingRowHeight: 44,
                  headingRowColor: WidgetStateProperty.all(
                    Colors.grey.shade200,
                  ),
                  dataRowMinHeight: 40,
                  dataRowMaxHeight: 60,
                  columns: [
                    DataColumn(label: _headerCell('', width: _actionWidth)),
                    DataColumn(label: _headerCell('STT', width: _sttWidth)),
                    DataColumn(
                      label: _headerCell('Tên công ty', width: _colLarge),
                    ),
                    DataColumn(
                      label: _headerCell('Tên gắn gọn', width: _colNormal),
                    ),
                    DataColumn(
                      label: _headerCell('Số điện thoại', width: _colMed),
                    ),
                    DataColumn(
                      label: _headerCell('Mã số thuế CCCD', width: _colNormal),
                    ),
                    DataColumn(label: _headerCell('Địa chỉ', width: _colLarge)),
                    DataColumn(
                      label: _headerCell('Số tài khoản', width: _colNormal),
                    ),
                    DataColumn(
                      label: _headerCell('Tên ngân hàng', width: _colNormal),
                    ),
                    DataColumn(
                      label: _headerCell('Phân loại', width: _colPhanLoai),
                    ),
                    DataColumn(
                      label: _headerCell('Ghi chú', width: _colNormal),
                    ),
                  ],
                  rows: data.isEmpty
                      ? [
                          DataRow(
                            cells: [
                              DataCell(_cellText('', width: _actionWidth)),
                              DataCell(_cellText('', width: _sttWidth)),
                              DataCell(
                                _cellText(
                                  'Không có dữ liệu bên thứ 3',
                                  width: _colLarge,
                                ),
                              ),
                              DataCell(_cellText('', width: _colNormal)),
                              DataCell(_cellText('', width: _colMed)),
                              DataCell(_cellText('', width: _colNormal)),
                              DataCell(_cellText('', width: _colLarge)),
                              DataCell(_cellText('', width: _colNormal)),
                              DataCell(_cellText('', width: _colNormal)),
                              DataCell(_cellText('', width: _colPhanLoai)),
                              DataCell(_cellText('', width: _colNormal)),
                            ],
                          ),
                        ]
                      : data.asMap().entries.map((entry) {
                          final index = entry.key;
                          final item = entry.value;
                          final stt =
                              (controller.currentPage.value - 1) *
                                  controller.limit.value +
                              index +
                              1;
                          return DataRow(
                            cells: [
                              DataCell(_buildActionMenu(item)),
                              DataCell(_cellText('$stt', width: _sttWidth)),
                              DataCell(
                                _cellText(item.tenCongTy, width: _colLarge),
                              ),
                              DataCell(
                                _cellText(item.tenGanGon, width: _colNormal),
                              ),
                              DataCell(
                                _cellText(item.soDienThoai, width: _colMed),
                              ),
                              DataCell(
                                _cellText(item.maSoThueCccd, width: _colNormal),
                              ),
                              DataCell(
                                _cellText(item.diaChi, width: _colLarge),
                              ),
                              DataCell(
                                _cellText(
                                  item.soTaiKhoanText,
                                  width: _colNormal,
                                ),
                              ),
                              DataCell(
                                _cellText(
                                  item.tenNganHangText,
                                  width: _colNormal,
                                ),
                              ),
                              DataCell(
                                _cellText(
                                  item.fieldPhanLoai,
                                  width: _colPhanLoai,
                                ),
                              ),
                              DataCell(
                                _cellText(item.ghiChu, width: _colNormal),
                              ),
                            ],
                          );
                        }).toList(),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionMenu(BenThuBa item) {
    return PopupMenuButton<String>(
      padding: EdgeInsets.zero,
      icon: const Icon(Icons.more_vert, size: 20),
      onSelected: (value) {
        if (value == 'edit') {
          Get.closeAllSnackbars();
          showBenThuBaDialog(context, existingData: item);
        } else if (value == 'delete') {
          _confirmDelete(item);
        }
      },
      itemBuilder: (_) => [
        const PopupMenuItem(
          value: 'edit',
          child: ListTile(
            leading: Icon(Icons.edit, color: Colors.blue),
            title: Text('Sửa'),
            dense: true,
          ),
        ),
        const PopupMenuItem(
          value: 'delete',
          child: ListTile(
            leading: Icon(Icons.delete, color: Colors.red),
            title: Text('Xoá'),
            dense: true,
          ),
        ),
      ],
    );
  }

  void _confirmDelete(BenThuBa item) {
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
                  Icon(
                    Icons.warning_amber_rounded,
                    color: Colors.red.shade600,
                    size: 48,
                  ),
                  MySpacing.height(20),
                  MyText.bodyMedium('Xác nhận xoá', fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodyMedium(
                    'Bạn có chắc chắn muốn xoá bên thứ 3 "${item.tenCongTy}"?',
                    maxLines: 4,
                    fontWeight: 600,
                    textAlign: TextAlign.center,
                  ),
                  MySpacing.height(20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      MyContainer(
                        onTap: controller.isDeleting.value
                            ? null
                            : () => Get.back(),
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
                        onTap: controller.isDeleting.value
                            ? null
                            : () => controller.deleteBenThuBa(item.nid),
                        padding: MySpacing.xy(12, 8),
                        color: Colors.red.shade600,
                        child: Obx(
                          () => controller.isDeleting.value
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : MyText.bodySmall(
                                  'Xoá',
                                  fontWeight: 600,
                                  color: Colors.white,
                                ),
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

  @override
  Widget build(BuildContext context) {
    return GetBuilder<BenThuBaController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Danh mục',
          subScreenName: 'Bên thứ 3',
          actions: [
            MyContainer(
              onTap: () {
                Get.closeAllSnackbars();
                showBenThuBaDialog(context);
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
            Obx(
              () => MyContainer(
                onTap: controller.isLoading.value
                    ? null
                    : () {
                        controller.clearSearch();
                        controller.fetchBenThuBa();
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
                      buildBenThuBaTable(controller.displayList),
                      const Divider(height: 0),
                      _buildPagination(),
                    ],
                  ),
          ),
        );
      },
    );
  }

  void showBenThuBaDialog(BuildContext context, {BenThuBa? existingData}) {
    final tenCongTyCtrl = TextEditingController(
      text: existingData?.tenCongTy ?? '',
    );
    final tenGanGonCtrl = TextEditingController(
      text: existingData?.tenGanGon ?? '',
    );
    final soDienThoaiCtrl = TextEditingController(
      text: existingData?.soDienThoai ?? '',
    );
    final maSoThueCccdCtrl = TextEditingController(
      text: existingData?.maSoThueCccd ?? '',
    );
    final diaChiCtrl = TextEditingController(text: existingData?.diaChi ?? '');
    final ghiChuCtrl = TextEditingController(text: existingData?.ghiChu ?? '');
    final selectedPhanLoai = existingData?.phanLoaiList.toSet() ?? <String>{};
    final bankRows = (existingData?.thongTinNganHang.isNotEmpty ?? false)
        ? existingData!.thongTinNganHang
              .map((item) => _BankAccountControllers.fromModel(item))
              .toList()
        : [_BankAccountControllers()];

    bool isTenCongTyError = false;

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          void submitForm() {
            if (controller.isSaving.value) return;
            final tenCongTy = tenCongTyCtrl.text.trim();
            if (tenCongTy.isEmpty) {
              setDialogState(() => isTenCongTyError = true);
              AppToast.warning('Vui lòng nhập tên công ty / cá nhân');
              return;
            }
            final data = _buildBenThuBaPayload(
              tenCongTyCtrl: tenCongTyCtrl,
              tenGanGonCtrl: tenGanGonCtrl,
              soDienThoaiCtrl: soDienThoaiCtrl,
              maSoThueCccdCtrl: maSoThueCccdCtrl,
              diaChiCtrl: diaChiCtrl,
              ghiChuCtrl: ghiChuCtrl,
              bankRows: bankRows,
              selectedPhanLoai: selectedPhanLoai,
            );

            if (existingData != null && existingData.nid > 0) {
              controller.updateBenThuBaOnServer(existingData.nid, data);
            } else {
              controller.saveBenThuBa(data);
            }
          }

          return Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 860, minWidth: 560),
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
                              ? 'Thêm bên thứ 3'
                              : 'Sửa bên thứ 3',
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
                      child: Focus(
                        onKeyEvent: (node, event) {
                          if (event is KeyDownEvent &&
                              event.logicalKey == LogicalKeyboardKey.enter) {
                            submitForm();
                            return KeyEventResult.handled;
                          }
                          return KeyEventResult.ignored;
                        },
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: _buildInput(
                                    'Tên công ty / cá nhân',
                                    tenCongTyCtrl,
                                    required: true,
                                    hasError: isTenCongTyError,
                                    onChanged: (_) {
                                      if (isTenCongTyError)
                                        setDialogState(
                                          () => isTenCongTyError = false,
                                        );
                                    },
                                  ),
                                ),
                                MySpacing.width(12),
                                Expanded(
                                  child: _buildInput(
                                    'Tên gắn gọn',
                                    tenGanGonCtrl,
                                  ),
                                ),
                              ],
                            ),
                            Row(
                              children: [
                                Expanded(
                                  child: _buildInput(
                                    'Số điện thoại',
                                    soDienThoaiCtrl,
                                    keyboardType: TextInputType.phone,
                                  ),
                                ),
                                MySpacing.width(12),
                                Expanded(
                                  child: _buildInput(
                                    'Mã số thuế / CCCD',
                                    maSoThueCccdCtrl,
                                  ),
                                ),
                              ],
                            ),
                            _buildInput('Địa chỉ', diaChiCtrl),
                            MySpacing.height(8),
                            MyText.labelMedium('Phân loại'),
                            MySpacing.height(6),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: phanLoaiOptions.map((item) {
                                return FilterChip(
                                  label: Text(item),
                                  selected: selectedPhanLoai.contains(item),
                                  onSelected: (selected) {
                                    setDialogState(() {
                                      if (item == 'Doanh nghiệp' && selected) {
                                        selectedPhanLoai.remove('Cá nhân');
                                      }
                                      if (item == 'Cá nhân' && selected) {
                                        selectedPhanLoai.remove('Doanh nghiệp');
                                      }
                                      selected
                                          ? selectedPhanLoai.add(item)
                                          : selectedPhanLoai.remove(item);
                                    });
                                  },
                                );
                              }).toList(),
                            ),
                            MySpacing.height(16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                MyText.bodyMedium(
                                  'Thông tin ngân hàng',
                                  fontWeight: 700,
                                ),
                                InkWell(
                                  onTap: () {
                                    setDialogState(() {
                                      bankRows.add(_BankAccountControllers());
                                    });
                                  },
                                  child: MyText.bodySmall(
                                    '+ Thêm tài khoản',
                                    color: contentTheme.primary,
                                    fontWeight: 600,
                                  ),
                                ),
                              ],
                            ),
                            MySpacing.height(8),
                            ...List.generate(bankRows.length, (index) {
                              final row = bankRows[index];
                              return Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: Colors.grey.shade300,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildInput(
                                            'Tên tài khoản',
                                            row.tenTaiKhoanCtrl,
                                          ),
                                        ),
                                        MySpacing.width(12),
                                        Expanded(
                                          child: _buildInput(
                                            'Số tài khoản',
                                            row.soTaiKhoanCtrl,
                                          ),
                                        ),
                                        MySpacing.width(12),
                                        Expanded(
                                          child: _buildInput(
                                            'Ngân hàng',
                                            row.nganHangCtrl,
                                          ),
                                        ),
                                        IconButton(
                                          tooltip: 'Xóa tài khoản',
                                          icon: const Icon(
                                            Icons.delete_outline,
                                            color: Colors.red,
                                          ),
                                          onPressed: bankRows.length == 1
                                              ? null
                                              : () {
                                                  setDialogState(() {
                                                    bankRows.removeAt(index);
                                                  });
                                                },
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            }),
                            _buildInput('Ghi chú', ghiChuCtrl, maxLines: 3),
                          ],
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
                        MyContainer(
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
    final searchCtrl = TextEditingController(
      text: controller.searchKeyword.value,
    );

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          void submitSearch() {
            controller.searchBenThuBa(searchCtrl.text.trim());
            Get.back();
          }

          return Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 460, minWidth: 320),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        MyText.titleMedium(
                          'Tìm kiếm bên thứ 3',
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
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: _buildInput(
                      'Từ khóa',
                      searchCtrl,
                      onSubmitted: (_) => submitSearch(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
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
                          onTap: submitSearch,
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
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInput(
    String label,
    TextEditingController ctrl, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool required = false,
    bool hasError = false,
    ValueChanged<String>? onChanged,
    ValueChanged<String>? onSubmitted,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
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
            keyboardType: keyboardType,
            maxLines: maxLines,
            onChanged: onChanged,
            onFieldSubmitted: onSubmitted,
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
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _buildBenThuBaPayload({
    required TextEditingController tenCongTyCtrl,
    required TextEditingController tenGanGonCtrl,
    required TextEditingController soDienThoaiCtrl,
    required TextEditingController maSoThueCccdCtrl,
    required TextEditingController diaChiCtrl,
    required TextEditingController ghiChuCtrl,
    required List<_BankAccountControllers> bankRows,
    required Set<String> selectedPhanLoai,
  }) {
    final thongTinNganHang = bankRows
        .map(
          (row) => {
            'ten_tai_khoan': row.tenTaiKhoanCtrl.text.trim(),
            'so_tai_khoan': row.soTaiKhoanCtrl.text.trim(),
            'ngan_hang': row.nganHangCtrl.text.trim(),
          },
        )
        .where((row) {
          return row.values.any((value) => value.toString().trim().isNotEmpty);
        })
        .toList();

    final thongTinJson = {
      'ten_cong_ty': tenCongTyCtrl.text.trim(),
      'ten_gan_gon': tenGanGonCtrl.text.trim(),
      'so_dien_thoai': soDienThoaiCtrl.text.trim(),
      'ma_so_thue_cccd': maSoThueCccdCtrl.text.trim(),
      'dia_chi': diaChiCtrl.text.trim(),
      'thong_tin_ngan_hang': thongTinNganHang,
      'ghi_chu': ghiChuCtrl.text.trim(),
    };

    return {
      'title': tenCongTyCtrl.text.trim(),
      'field_thong_tin_json': jsonEncode(thongTinJson),
      'field_phan_loai': phanLoaiOptions
          .where((item) => selectedPhanLoai.contains(item))
          .join(', '),
      'field_hoat_dong': 1,
    };
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

    final TextEditingController pageInputCtrl = TextEditingController(
      text: '$page',
    );

    return Padding(
      padding: const EdgeInsets.only(top: 12),
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
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 6,
                ),
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
}

class _BankAccountControllers {
  final TextEditingController tenTaiKhoanCtrl;
  final TextEditingController soTaiKhoanCtrl;
  final TextEditingController nganHangCtrl;

  _BankAccountControllers()
    : tenTaiKhoanCtrl = TextEditingController(),
      soTaiKhoanCtrl = TextEditingController(),
      nganHangCtrl = TextEditingController();

  _BankAccountControllers.fromModel(TaiKhoanNganHang item)
    : tenTaiKhoanCtrl = TextEditingController(text: item.tenTaiKhoan),
      soTaiKhoanCtrl = TextEditingController(text: item.soTaiKhoan),
      nganHangCtrl = TextEditingController(text: item.nganHang);
}

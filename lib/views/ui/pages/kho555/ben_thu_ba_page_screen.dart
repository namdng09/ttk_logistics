import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/kho555/ben_thu_ba_controller.dart' show BenThuBaController;
import 'package:kho555/helper/theme/admin_theme.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/models/kho555/ben_thu_ba.dart';
import 'package:kho555/views/layout/layout.dart';

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
  ];

  Widget buildBenThuBaTable(List<BenThuBa> data) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: DataTable(
          columnSpacing: 16,
          headingRowColor: MaterialStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('Tên công ty', width: 300)),
            DataColumn(label: _headerCell('Tên gắn gọn', width: 170)),
            DataColumn(label: _headerCell('Số điện thoại', width: 150)),
            DataColumn(label: _headerCell('Mã số thuế CCCD', width: 170)),
            DataColumn(label: _headerCell('Địa chỉ', width: 260)),
            DataColumn(label: _headerCell('Số tài khoản', width: 170)),
            DataColumn(label: _headerCell('Tên ngân hàng', width: 170)),
            DataColumn(label: _headerCell('Phân loại', width: 210)),
            DataColumn(label: _headerCell('Ghi chú', width: 180)),
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
                            'Không có dữ liệu bên thứ 3',
                            fontWeight: 600,
                          ),
                        ),
                      ),
                      DataCell(_cellText('', width: 170)),
                      DataCell(_cellText('', width: 150)),
                      DataCell(_cellText('', width: 170)),
                      DataCell(_cellText('', width: 260)),
                      DataCell(_cellText('', width: 170)),
                      DataCell(_cellText('', width: 170)),
                      DataCell(_cellText('', width: 210)),
                      DataCell(_cellText('', width: 180)),
                      const DataCell(SizedBox.shrink()),
                      const DataCell(SizedBox.shrink()),
                    ],
                  ),
                ]
              : data.map((item) {
                  return DataRow(
                    cells: [
                      DataCell(_cellText(item.tenCongTy, width: 300)),
                      DataCell(_cellText(item.tenGanGon, width: 170)),
                      DataCell(_cellText(item.soDienThoai, width: 150)),
                      DataCell(_cellText(item.maSoThueCccd, width: 170)),
                      DataCell(_cellText(item.diaChi, width: 260)),
                      DataCell(_cellText(item.soTaiKhoanText, width: 170)),
                      DataCell(_cellText(item.tenNganHangText, width: 170)),
                      DataCell(_cellText(item.fieldPhanLoai, width: 210)),
                      DataCell(_cellText(item.ghiChu, width: 180)),
                      DataCell(
                        Center(
                          child: IconButton(
                            tooltip: 'Sửa bên thứ 3',
                            icon: const Icon(Icons.edit, color: Colors.blue),
                            onPressed: () {
                              Get.closeAllSnackbars();
                              showBenThuBaDialog(context, existingData: item);
                            },
                          ),
                        ),
                      ),
                      DataCell(
                        Center(
                          child: IconButton(
                            tooltip: 'Xoá bên thứ 3',
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
            MyContainer(
              onTap: () {
                controller.clearSearch();
                controller.fetchBenThuBa();
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
                      buildBenThuBaTable(controller.filteredBenThuBaList),
                    ],
                  ),
          ),
        );
      },
    );
  }

  void showBenThuBaDialog(BuildContext context, {BenThuBa? existingData}) {
    final tenCongTyCtrl =
        TextEditingController(text: existingData?.tenCongTy ?? '');
    final tenGanGonCtrl =
        TextEditingController(text: existingData?.tenGanGon ?? '');
    final soDienThoaiCtrl =
        TextEditingController(text: existingData?.soDienThoai ?? '');
    final maSoThueCccdCtrl =
        TextEditingController(text: existingData?.maSoThueCccd ?? '');
    final diaChiCtrl = TextEditingController(text: existingData?.diaChi ?? '');
    final ghiChuCtrl = TextEditingController(text: existingData?.ghiChu ?? '');
    final selectedPhanLoai = existingData?.phanLoaiList.toSet() ?? <String>{};
    final bankRows = (existingData?.thongTinNganHang.isNotEmpty ?? false)
        ? existingData!.thongTinNganHang
            .map((item) => _BankAccountControllers.fromModel(item))
            .toList()
        : [_BankAccountControllers()];

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          return Dialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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
                                border: Border.all(color: Colors.grey.shade300),
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

                            if (existingData != null &&
                                existingData.nid > 0) {
                              controller.updateBenThuBaOnServer(
                                existingData.nid,
                                data,
                              );
                            } else {
                              controller.saveBenThuBa(data);
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
                    MyText.titleMedium('Tìm kiếm bên thứ 3', fontWeight: 700),
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
                        controller.searchBenThuBa(searchCtrl.text);
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
    TextInputType keyboardType = TextInputType.text,
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
            keyboardType: keyboardType,
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
        .map((row) => {
              'ten_tai_khoan': row.tenTaiKhoanCtrl.text.trim(),
              'so_tai_khoan': row.soTaiKhoanCtrl.text.trim(),
              'ngan_hang': row.nganHangCtrl.text.trim(),
            })
        .where((row) {
      return row.values.any((value) => value.toString().trim().isNotEmpty);
    }).toList();

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
                  'Bạn có chắc chắn muốn xoá bên thứ 3 này không?',
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
                        controller.deleteBenThuBa(nid);
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

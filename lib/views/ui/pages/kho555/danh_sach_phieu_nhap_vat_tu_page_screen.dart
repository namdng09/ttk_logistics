import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/controller/kho555/phieu_nhap_vat_tu_controller.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/phieu_nhap_vat_tu.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

import 'nhap_vat_tu_page_screen.dart';

class DanhSachPhieuNhapVatTuPageScreen extends StatefulWidget with UIMixin {
  const DanhSachPhieuNhapVatTuPageScreen({super.key});

  @override
  State<DanhSachPhieuNhapVatTuPageScreen> createState() =>
      _DanhSachPhieuNhapVatTuPageScreenState();
}

class _DanhSachPhieuNhapVatTuPageScreenState
    extends State<DanhSachPhieuNhapVatTuPageScreen> {
  final controller = Get.isRegistered<PhieuNhapVatTuController>()
      ? Get.find<PhieuNhapVatTuController>()
      : Get.put(PhieuNhapVatTuController());
  final contentTheme = AdminTheme.theme.contentTheme;
  final moneyFormat = NumberFormat.decimalPattern('vi_VN');

  @override
  Widget build(BuildContext context) {
    return GetBuilder<PhieuNhapVatTuController>(
      init: controller,
      builder: (controller) {
        return Layout(
          mainScreenName: 'Kho',
          subScreenName: 'Danh sách phiếu nhập vật tư',
          actions: [
            MyContainer(
              onTap: () async {
                await Get.to(() => const NhapVatTuPageScreen());
                controller.fetchPhieuNhapVatTu();
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
                : buildPhieuTable(controller.filteredPhieuList),
          ),
        );
      },
    );
  }

  Widget buildPhieuTable(List<PhieuNhapVatTu> data) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: DataTable(
          columnSpacing: 16,
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('Mã phiếu', width: 140)),
            DataColumn(label: _headerCell('Nhà cung cấp', width: 240)),
            DataColumn(label: _headerCell('Ngày phiếu', width: 130)),
            DataColumn(label: _headerCell('Tổng trước VAT', width: 150)),
            DataColumn(label: _headerCell('Tiền VAT', width: 130)),
            DataColumn(label: _headerCell('Tổng sau VAT', width: 150)),
            DataColumn(label: _headerCell('Trạng thái', width: 120)),
            const DataColumn(label: Text('Sửa')),
            const DataColumn(label: Text('Xoá')),
          ],
          rows: data.isEmpty
              ? [
                  DataRow(
                    cells: [
                      DataCell(_cellText('', width: 140)),
                      DataCell(
                        SizedBox(
                          width: 240,
                          child: MyText.bodySmall(
                            'Không có phiếu nhập vật tư',
                            fontWeight: 600,
                          ),
                        ),
                      ),
                      DataCell(_cellText('', width: 130)),
                      DataCell(_cellText('', width: 150)),
                      DataCell(_cellText('', width: 130)),
                      DataCell(_cellText('', width: 150)),
                      DataCell(_cellText('', width: 120)),
                      const DataCell(SizedBox.shrink()),
                      const DataCell(SizedBox.shrink()),
                    ],
                  ),
                ]
              : data.map((item) {
                  return DataRow(
                    cells: [
                      DataCell(_cellText(item.title, width: 140)),
                      DataCell(_cellText(item.nhaCungCapTitle, width: 240)),
                      DataCell(_cellText(_formatDate(item.ngay), width: 130)),
                      DataCell(_cellMoney(item.tongTien, width: 150)),
                      DataCell(_cellMoney(item.tienVat, width: 130)),
                      DataCell(_cellMoney(item.tongTienSauVat, width: 150)),
                      DataCell(_cellText(item.trangThai, width: 120)),
                      DataCell(
                        IconButton(
                          icon: const Icon(Icons.edit, color: Colors.blue),
                          onPressed: () async {
                            await Get.to(
                              () => NhapVatTuPageScreen(existingData: item),
                            );
                            controller.fetchPhieuNhapVatTu();
                          },
                        ),
                      ),
                      DataCell(
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () =>
                              showDeleteConfirmDialog(context, item.nid),
                        ),
                      ),
                    ],
                  );
                }).toList(),
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
                MyText.titleMedium('Tìm kiếm phiếu', fontWeight: 700),
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
                      child: MyText.bodySmall('Xóa lọc'),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        controller.searchPhieu(searchCtrl.text);
                        Get.back();
                      },
                      color: contentTheme.primary,
                      padding: MySpacing.xy(12, 8),
                      child: MyText.bodySmall(
                        'Tìm',
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

  Widget _buildInput(String label, TextEditingController ctrl) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.labelMedium(label),
          const SizedBox(height: 6),
          TextField(
            controller: ctrl,
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
                  'Bạn có chắc chắn muốn xoá phiếu này không?',
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
                      child: MyText.bodySmall('Huỷ'),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        Get.back();
                        controller.deletePhieuNhapVatTu(nid);
                      },
                      padding: MySpacing.xy(12, 8),
                      color: Colors.red.shade600,
                      child: MyText.bodySmall('Xoá', color: Colors.white),
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

  Widget _headerCell(String text, {double? width}) {
    return SizedBox(
      width: width,
      child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700)),
    );
  }

  Widget _cellText(String text, {double? width}) {
    return SizedBox(
      width: width,
      child: Text(text, overflow: TextOverflow.ellipsis, maxLines: 2),
    );
  }

  Widget _cellMoney(double value, {double? width}) {
    return SizedBox(
      width: width,
      child: Text(
        moneyFormat.format(value),
        textAlign: TextAlign.right,
      ),
    );
  }

  String _formatDate(int value) {
    if (value <= 0) return '';
    final raw = value.toString();
    if (raw.length != 8) return raw;
    return '${raw.substring(6, 8)}/${raw.substring(4, 6)}/${raw.substring(0, 4)}';
  }
}

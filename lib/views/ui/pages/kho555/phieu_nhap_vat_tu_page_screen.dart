import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:kho555/controller/kho555/phieu_nhap_vat_tu_controller.dart';
import 'package:kho555/helper/theme/admin_theme.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/models/kho555/phieu_nhap_vat_tu.dart';
import 'package:kho555/views/layout/layout.dart';

import 'nhap_vat_tu_page_screen.dart';

class PhieuNhapVatTuPageScreen extends StatefulWidget with UIMixin {
  const PhieuNhapVatTuPageScreen({super.key});

  @override
  State<PhieuNhapVatTuPageScreen> createState() =>
      _PhieuNhapVatTuPageScreenState();
}

class _PhieuNhapVatTuPageScreenState extends State<PhieuNhapVatTuPageScreen> {
  final controller = Get.isRegistered<PhieuNhapVatTuController>()
      ? Get.find<PhieuNhapVatTuController>()
      : Get.put(PhieuNhapVatTuController());
  final contentTheme = AdminTheme.theme.contentTheme;
  final moneyFormat = NumberFormat.decimalPattern('vi_VN');

  Widget buildPhieuTable(List<PhieuNhapVatTu> data) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        scrollDirection: Axis.vertical,
        child: DataTable(
          columnSpacing: 16,
          headingRowColor: MaterialStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('Mã phiếu', width: 140)),
            DataColumn(label: _headerCell('Nhà cung cấp', width: 240)),
            DataColumn(label: _headerCell('Ngày phiếu', width: 130)),
            DataColumn(label: _headerCell('Tổng trước VAT', width: 150)),
            DataColumn(label: _headerCell('Tiền VAT', width: 130)),
            DataColumn(label: _headerCell('Tổng sau VAT', width: 150)),
            DataColumn(label: _headerCell('Trạng thái', width: 120)),
            const DataColumn(label: Text('Cập nhật TT')),
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
                          tooltip: 'Cập nhật trạng thái',
                          icon: const Icon(Icons.update, color: Colors.orange),
                          onPressed: () {
                            showUpdateStatusDialog(context, item.nid);
                          },
                        ),
                      ),
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
                          onPressed: () => showDeleteConfirmDialog(
                            context,
                            item.nid,
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

  void showPhieuDialog(BuildContext context, {PhieuNhapVatTu? existingData}) {
    final maPhieuCtrl = TextEditingController(text: existingData?.title ?? '');
    final ngayCtrl = TextEditingController(
      text: existingData == null ? _formatDateInt(_todayInt()) : _formatDate(existingData.ngay),
    );
    final tongTruocVatCtrl = TextEditingController();
    final vatPhieuCtrl = TextEditingController();
    final tongTienVatCtrl = TextEditingController();
    final tongSauVatCtrl = TextEditingController();
    final daThanhToanCtrl = TextEditingController(
      text: existingData == null ? '0' : _formatNumber(existingData.daThanhToan),
    );
    final soTienConLaiCtrl = TextEditingController();

    int? nhaCungCapNid =
        existingData?.nhaCungCapNid == 0 ? null : existingData?.nhaCungCapNid;
    int? khoNid = existingData?.khoNid == 0 ? null : existingData?.khoNid;
    int? nguoiThucHienUid = existingData?.nguoiTaoLenhUid == 0
        ? null
        : existingData?.nguoiTaoLenhUid;
    String loaiVatPhieu = existingData?.loaiVatPhieu ?? '%';
    final rows = (existingData?.chiTietVatTu.isNotEmpty ?? false)
        ? existingData!.chiTietVatTu.map(_VatTuNhapRowControllers.fromModel).toList()
        : [_VatTuNhapRowControllers()];

    void recalculateTotals(StateSetter setDialogState) {
      double totalBeforeVat = 0;
      double detailVatTotal = 0;

      for (final row in rows) {
        row.recalculate();
        totalBeforeVat += row.tongTien;
        detailVatTotal += row.tienVat;
      }

      final vatPhieuValue = _parseMoney(vatPhieuCtrl.text);
      final totalVat =
          loaiVatPhieu == '%' ? totalBeforeVat * vatPhieuValue / 100 : detailVatTotal;
      final totalAfterVat = totalBeforeVat + totalVat;
      final daThanhToan = _parseMoney(daThanhToanCtrl.text);

      tongTruocVatCtrl.text = _formatNumber(totalBeforeVat);
      tongTienVatCtrl.text = _formatNumber(totalVat);
      tongSauVatCtrl.text = _formatNumber(totalAfterVat);
      soTienConLaiCtrl.text = _formatNumber(totalAfterVat - daThanhToan);
      setDialogState(() {});
    }

    showDialog(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setDialogState) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (tongTruocVatCtrl.text.isEmpty) {
              vatPhieuCtrl.text = existingData == null
                  ? '0'
                  : (loaiVatPhieu == '%'
                      ? _formatNumber(existingData.phanTramVat)
                      : _formatNumber(existingData.tienVat));
              recalculateTotals(setDialogState);
            }
          });

          return Dialog(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1180, minWidth: 760),
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
                              ? 'Thêm phiếu nhập vật tư'
                              : 'Sửa phiếu nhập vật tư',
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
                              Expanded(child: _buildInput('Mã phiếu', maPhieuCtrl)),
                              MySpacing.width(12),
                              Expanded(
                                child: _buildDropdown(
                                  'Nhà cung cấp',
                                  nhaCungCapNid,
                                  controller.nhaCungCapList,
                                  (value) => setDialogState(() {
                                    nhaCungCapNid = value;
                                  }),
                                ),
                              ),
                              MySpacing.width(12),
                              Expanded(child: _buildInput('Ngày phiếu', ngayCtrl)),
                            ],
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: _buildDropdown(
                                  'Người thực hiện',
                                  nguoiThucHienUid,
                                  controller.userList,
                                  (value) => setDialogState(() {
                                    nguoiThucHienUid = value;
                                  }),
                                ),
                              ),
                              MySpacing.width(12),
                              Expanded(
                                child: _buildDropdown(
                                  'Kho',
                                  khoNid,
                                  controller.khoList,
                                  (value) => setDialogState(() {
                                    khoNid = value;
                                  }),
                                ),
                              ),
                              MySpacing.width(12),
                              Expanded(
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: _buildDropdownString(
                                        'VAT phiếu',
                                        loaiVatPhieu,
                                        const ['%', 'Số tiền'],
                                        (value) {
                                          loaiVatPhieu = value ?? '%';
                                          recalculateTotals(setDialogState);
                                        },
                                      ),
                                    ),
                                    MySpacing.width(12),
                                    Expanded(
                                      child: _buildInput(
                                        loaiVatPhieu == '%' ? 'VAT (%)' : 'VAT',
                                        vatPhieuCtrl,
                                        keyboardType: TextInputType.number,
                                        onChanged: (_) =>
                                            recalculateTotals(setDialogState),
                                        enabled: loaiVatPhieu == '%',
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: _buildInput(
                                  'Tổng tiền trước VAT',
                                  tongTruocVatCtrl,
                                  enabled: false,
                                ),
                              ),
                              MySpacing.width(12),
                              Expanded(
                                child: _buildInput(
                                  'Tổng tiền VAT',
                                  tongTienVatCtrl,
                                  enabled: false,
                                ),
                              ),
                              MySpacing.width(12),
                              Expanded(
                                child: _buildInput(
                                  'Tổng tiền sau VAT',
                                  tongSauVatCtrl,
                                  enabled: false,
                                ),
                              ),
                              MySpacing.width(12),
                              Expanded(
                                child: _buildInput(
                                  'Đã thanh toán',
                                  daThanhToanCtrl,
                                  keyboardType: TextInputType.number,
                                  onChanged: (_) =>
                                      recalculateTotals(setDialogState),
                                ),
                              ),
                              MySpacing.width(12),
                              Expanded(
                                child: _buildInput(
                                  'Số tiền còn lại',
                                  soTienConLaiCtrl,
                                  enabled: false,
                                ),
                              ),
                            ],
                          ),
                          MySpacing.height(16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              MyText.bodyMedium(
                                'Chi tiết vật tư nhập kho',
                                fontWeight: 700,
                              ),
                              InkWell(
                                onTap: () {
                                  rows.add(_VatTuNhapRowControllers());
                                  recalculateTotals(setDialogState);
                                },
                                child: MyText.bodySmall(
                                  '+ Thêm dòng',
                                  color: contentTheme.primary,
                                  fontWeight: 600,
                                ),
                              ),
                            ],
                          ),
                          MySpacing.height(8),
                          _buildDetailTable(
                            rows,
                            setDialogState,
                            recalculateTotals,
                          ),
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
                            final data = _buildPayload(
                              maPhieuCtrl: maPhieuCtrl,
                              ngayCtrl: ngayCtrl,
                              tongTruocVatCtrl: tongTruocVatCtrl,
                              vatPhieuCtrl: vatPhieuCtrl,
                              tongTienVatCtrl: tongTienVatCtrl,
                              tongSauVatCtrl: tongSauVatCtrl,
                              daThanhToanCtrl: daThanhToanCtrl,
                              soTienConLaiCtrl: soTienConLaiCtrl,
                              nhaCungCapNid: nhaCungCapNid,
                              khoNid: khoNid,
                              nguoiThucHienUid: nguoiThucHienUid,
                              loaiVatPhieu: loaiVatPhieu,
                              rows: rows,
                            );

                            if (existingData != null && existingData.nid > 0) {
                              controller.updatePhieuNhapVatTuOnServer(
                                existingData.nid,
                                data,
                              );
                            } else {
                              controller.savePhieuNhapVatTu(data);
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

  Widget _buildDetailTable(
    List<_VatTuNhapRowControllers> rows,
    StateSetter setDialogState,
    void Function(StateSetter) recalculateTotals,
  ) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 12,
        headingRowColor: MaterialStateProperty.all(Colors.grey.shade100),
        columns: const [
          DataColumn(label: Text('Vật tư')),
          DataColumn(label: Text('Số lượng')),
          DataColumn(label: Text('Quy cách')),
          DataColumn(label: Text('Đơn giá')),
          DataColumn(label: Text('Tổng tiền')),
          DataColumn(label: Text('VAT')),
          DataColumn(label: Text('Tiền VAT')),
          DataColumn(label: Text('Tổng sau VAT')),
          DataColumn(label: Text('Xóa')),
        ],
        rows: List.generate(rows.length, (index) {
          final row = rows[index];
          return DataRow(
            cells: [
              DataCell(
                SizedBox(
                  width: 220,
                  child: DropdownButtonFormField<int>(
                    value: row.nidVatTu,
                    isExpanded: true,
                    items: controller.vatTuList.map((item) {
                      return DropdownMenuItem<int>(
                        value: item.id,
                        child: Text(
                          item.title,
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      final selected = _findOption(controller.vatTuList, value);
                      row.nidVatTu = value;
                      row.tenVatTu = selected?.title ?? '';
                      row.quyCachCtrl.text = selected?.subtitle ?? '';
                      recalculateTotals(setDialogState);
                    },
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                  ),
                ),
              ),
              DataCell(_smallInput(row.soLuongCtrl, () => recalculateTotals(setDialogState), width: 90)),
              DataCell(_smallInput(row.quyCachCtrl, () => recalculateTotals(setDialogState), width: 120)),
              DataCell(_smallInput(row.donGiaCtrl, () => recalculateTotals(setDialogState), width: 120)),
              DataCell(SizedBox(width: 120, child: Text(_formatNumber(row.tongTien)))),
              DataCell(
                SizedBox(
                  width: 160,
                  child: Row(
                    children: [
                      SizedBox(
                        width: 70,
                        child: DropdownButtonFormField<String>(
                          value: row.loaiVat,
                          items: const ['%', 'Số tiền']
                              .map(
                                (item) => DropdownMenuItem<String>(
                                  value: item,
                                  child: Text(item),
                                ),
                              )
                              .toList(),
                          onChanged: (value) {
                            row.loaiVat = value ?? '%';
                            recalculateTotals(setDialogState);
                          },
                          decoration: const InputDecoration(
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(
                        child: _smallInput(
                          row.vatCtrl,
                          () => recalculateTotals(setDialogState),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              DataCell(SizedBox(width: 120, child: Text(_formatNumber(row.tienVat)))),
              DataCell(SizedBox(width: 130, child: Text(_formatNumber(row.tongTienSauVat)))),
              DataCell(
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: rows.length == 1
                      ? null
                      : () {
                          rows.removeAt(index);
                          recalculateTotals(setDialogState);
                        },
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _smallInput(
    TextEditingController ctrl,
    VoidCallback onChanged, {
    double? width,
  }) {
    return SizedBox(
      width: width,
      child: TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        onChanged: (_) => onChanged(),
        decoration: const InputDecoration(
          border: OutlineInputBorder(),
          isDense: true,
        ),
      ),
    );
  }

  Widget _buildInput(
    String label,
    TextEditingController ctrl, {
    bool enabled = true,
    TextInputType keyboardType = TextInputType.text,
    void Function(String)? onChanged,
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
            enabled: enabled,
            keyboardType: keyboardType,
            onChanged: onChanged,
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

  Widget _buildDropdown(
    String label,
    int? value,
    List<OptionItem> options,
    void Function(int?) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.labelMedium(label),
          const SizedBox(height: 6),
          DropdownButtonFormField<int>(
            value: value,
            isExpanded: true,
            items: options.map((item) {
              return DropdownMenuItem<int>(
                value: item.id,
                child: Text(item.title, overflow: TextOverflow.ellipsis),
              );
            }).toList(),
            onChanged: onChanged,
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

  Widget _buildDropdownString(
    String label,
    String value,
    List<String> options,
    void Function(String?) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.labelMedium(label),
          const SizedBox(height: 6),
          DropdownButtonFormField<String>(
            value: value,
            items: options
                .map((item) => DropdownMenuItem(value: item, child: Text(item)))
                .toList(),
            onChanged: onChanged,
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

  Map<String, dynamic> _buildPayload({
    required TextEditingController maPhieuCtrl,
    required TextEditingController ngayCtrl,
    required TextEditingController tongTruocVatCtrl,
    required TextEditingController vatPhieuCtrl,
    required TextEditingController tongTienVatCtrl,
    required TextEditingController tongSauVatCtrl,
    required TextEditingController daThanhToanCtrl,
    required TextEditingController soTienConLaiCtrl,
    required int? nhaCungCapNid,
    required int? khoNid,
    required int? nguoiThucHienUid,
    required String loaiVatPhieu,
    required List<_VatTuNhapRowControllers> rows,
  }) {
    final chiTiet = rows
        .where((row) => (row.nidVatTu ?? 0) > 0)
        .map((row) {
          row.recalculate();
          return {
            'nid_vat_tu': row.nidVatTu,
            'ten_vat_tu': row.tenVatTu,
            'so_luong': _parseMoney(row.soLuongCtrl.text),
            'quy_cach_dong_goi': row.quyCachCtrl.text.trim(),
            'don_gia': _parseMoney(row.donGiaCtrl.text),
            'tong_tien': row.tongTien,
            'loai_vat': row.loaiVat,
            'vat': _parseMoney(row.vatCtrl.text),
            'tien_vat': row.tienVat,
            'tong_tien_sau_vat': row.tongTienSauVat,
          };
        })
        .toList();

    final thongTinJson = {
      'loai_phieu': 'nhap_vat_tu',
      'kho_nid': khoNid,
      'nguoi_tao_lenh_uid': nguoiThucHienUid,
      'trang_thai': 'Chờ duyệt',
      'trang_thai_in': 'Chưa in',
      'loai_vat_phieu': loaiVatPhieu,
      'chi_tiet_vat_tu': chiTiet,
    };

    return {
      'title': maPhieuCtrl.text.trim(),
      'field_ben_thu_ba': nhaCungCapNid ?? 0,
      'field_ngay': _parseDateToInt(ngayCtrl.text),
      'field_tong_tien': _parseMoney(tongTruocVatCtrl.text),
      'field_tien_vat': _parseMoney(tongTienVatCtrl.text),
      'field_phan_tram_vat':
          loaiVatPhieu == '%' ? _parseMoney(vatPhieuCtrl.text) : 0,
      'field_tong_tien_sau_vat': _parseMoney(tongSauVatCtrl.text),
      'field_da_thanh_toan': _parseMoney(daThanhToanCtrl.text),
      'field_so_tien_con_lai': _parseMoney(soTienConLaiCtrl.text),
      'field_hoat_dong': 1,
      'field_thong_tin_json': jsonEncode(thongTinJson),
    };
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

  void showUpdateStatusDialog(BuildContext context, int nid) {
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
                  Icons.update,
                  color: Colors.orange.shade600,
                  size: 48,
                ),
                MySpacing.height(20),
                MyText.bodyMedium(
                  'Cập nhật trạng thái',
                  fontWeight: 600,
                ),
                MySpacing.height(12),
                MyText.bodySmall(
                  'Vui lòng chọn trạng thái muốn cập nhật cho phiếu này.',
                  textAlign: TextAlign.center,
                ),
                MySpacing.height(24),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    MyContainer(
                      onTap: () {
                        Get.back();
                        controller.updateTrangThaiPhieuNhapVatTu(
                          nid,
                          'duyet',
                        );
                      },
                      padding: MySpacing.xy(12, 8),
                      color: Colors.green.shade600,
                      child: MyText.bodySmall(
                        'Duyệt',
                        color: Colors.white,
                      ),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        Get.back();
                        controller.updateTrangThaiPhieuNhapVatTu(
                          nid,
                          'khong_duyet',
                        );
                      },
                      padding: MySpacing.xy(12, 8),
                      color: Colors.yellow.shade600,
                      child: MyText.bodySmall(
                        'Không duyệt',
                        color: Colors.black,
                      ),
                    ),
                    MySpacing.width(12),
                    MyContainer(
                      onTap: () {
                        Get.back();
                        controller.updateTrangThaiPhieuNhapVatTu(
                          nid,
                          'huy',
                        );
                      },
                      padding: MySpacing.xy(12, 8),
                      color: Colors.red.shade600,
                      child: MyText.bodySmall(
                        'Hủy',
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

  int _todayInt() {
    final now = DateTime.now();
    return now.year * 10000 + now.month * 100 + now.day;
  }

  String _formatDateInt(int value) => _formatDate(value);

  int _parseDateToInt(String value) {
    final parts = value.split('/');
    if (parts.length == 3) {
      final d = int.tryParse(parts[0]) ?? 0;
      final m = int.tryParse(parts[1]) ?? 0;
      final y = int.tryParse(parts[2]) ?? 0;
      return y * 10000 + m * 100 + d;
    }
    return int.tryParse(value.replaceAll(RegExp(r'[^0-9]'), '')) ?? _todayInt();
  }

  double _parseMoney(String value) {
    return double.tryParse(
          value.replaceAll('.', '').replaceAll(',', '.').trim(),
        ) ??
        0;
  }

  String _formatNumber(double value) {
    if (value == value.roundToDouble()) {
      return value.round().toString();
    }
    return value.toStringAsFixed(2);
  }

  OptionItem? _findOption(List<OptionItem> options, int? id) {
    for (final option in options) {
      if (option.id == id) return option;
    }
    return null;
  }
}

class _VatTuNhapRowControllers {
  int? nidVatTu;
  String tenVatTu = '';
  String loaiVat = '%';
  final TextEditingController soLuongCtrl;
  final TextEditingController quyCachCtrl;
  final TextEditingController donGiaCtrl;
  final TextEditingController vatCtrl;
  double tongTien = 0;
  double tienVat = 0;
  double tongTienSauVat = 0;

  _VatTuNhapRowControllers()
      : soLuongCtrl = TextEditingController(text: '1'),
        quyCachCtrl = TextEditingController(),
        donGiaCtrl = TextEditingController(text: '0'),
        vatCtrl = TextEditingController(text: '0');

  _VatTuNhapRowControllers.fromModel(ChiTietVatTuNhap item)
      : nidVatTu = item.nidVatTu,
        tenVatTu = item.tenVatTu,
        loaiVat = item.loaiVat,
        soLuongCtrl = TextEditingController(text: item.soLuong.toString()),
        quyCachCtrl = TextEditingController(text: item.quyCachDongGoi),
        donGiaCtrl = TextEditingController(text: item.donGia.toString()),
        vatCtrl = TextEditingController(text: item.vat.toString()),
        tongTien = item.tongTien,
        tienVat = item.tienVat,
        tongTienSauVat = item.tongTienSauVat;

  void recalculate() {
    final soLuong = _parseNumber(soLuongCtrl.text);
    final donGia = _parseNumber(donGiaCtrl.text);
    final vat = _parseNumber(vatCtrl.text);
    tongTien = soLuong * donGia;
    tienVat = loaiVat == '%' ? tongTien * vat / 100 : vat;
    tongTienSauVat = tongTien + tienVat;
  }

  static double _parseNumber(String value) {
    return double.tryParse(
          value.replaceAll('.', '').replaceAll(',', '.').trim(),
        ) ??
        0;
  }
}

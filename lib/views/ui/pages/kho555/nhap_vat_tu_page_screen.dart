import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/kho555/phieu_nhap_vat_tu_controller.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/models/kho555/phieu_nhap_vat_tu.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class NhapVatTuPageScreen extends StatefulWidget with UIMixin {
  final PhieuNhapVatTu? existingData;

  const NhapVatTuPageScreen({super.key, this.existingData});

  @override
  State<NhapVatTuPageScreen> createState() => _NhapVatTuPageScreenState();
}

class _NhapVatTuPageScreenState extends State<NhapVatTuPageScreen> {
  final controller = Get.isRegistered<PhieuNhapVatTuController>()
      ? Get.find<PhieuNhapVatTuController>()
      : Get.put(PhieuNhapVatTuController());
  final contentTheme = AdminTheme.theme.contentTheme;

  late final TextEditingController maPhieuCtrl;
  late final TextEditingController ngayCtrl;
  late final TextEditingController tongTruocVatCtrl;
  late final TextEditingController vatPhieuCtrl;
  late final TextEditingController tongTienVatCtrl;
  late final TextEditingController tongSauVatCtrl;
  late final TextEditingController daThanhToanCtrl;
  late final TextEditingController soTienConLaiCtrl;

  int? nhaCungCapNid;
  int? khoNid;
  int? nguoiThucHienUid;
  String loaiVatPhieu = '%';
  late final List<_VatTuNhapRowControllers> rows;
  bool initializedTotals = false;

  @override
  void initState() {
    super.initState();
    final existingData = widget.existingData;
    maPhieuCtrl = TextEditingController(text: existingData?.title ?? '');
    ngayCtrl = TextEditingController(
      text: existingData == null
          ? _formatDate(_todayInt())
          : _formatDate(existingData.ngay),
    );
    tongTruocVatCtrl = TextEditingController();
    vatPhieuCtrl = TextEditingController(
      text: existingData == null
          ? '0'
          : (existingData.loaiVatPhieu == '%'
              ? _formatNumber(existingData.phanTramVat)
              : _formatNumber(existingData.tienVat)),
    );
    tongTienVatCtrl = TextEditingController();
    tongSauVatCtrl = TextEditingController();
    daThanhToanCtrl = TextEditingController(
      text: existingData == null ? '0' : _formatNumber(existingData.daThanhToan),
    );
    soTienConLaiCtrl = TextEditingController();
    nhaCungCapNid =
        existingData?.nhaCungCapNid == 0 ? null : existingData?.nhaCungCapNid;
    khoNid = existingData?.khoNid == 0 ? null : existingData?.khoNid;
    nguoiThucHienUid = existingData?.nguoiTaoLenhUid == 0
        ? null
        : existingData?.nguoiTaoLenhUid;
    loaiVatPhieu = existingData?.loaiVatPhieu ?? '%';
    rows = (existingData?.chiTietVatTu.isNotEmpty ?? false)
        ? existingData!.chiTietVatTu
            .map(_VatTuNhapRowControllers.fromModel)
            .toList()
        : [_VatTuNhapRowControllers()];
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<PhieuNhapVatTuController>(
      init: controller,
      builder: (_) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!initializedTotals && mounted) {
            initializedTotals = true;
            _recalculateTotals();
          }
        });

        return Layout(
          mainScreenName: 'Kho',
          subScreenName: widget.existingData == null
              ? 'Nhập vật tư'
              : 'Sửa phiếu nhập vật tư',
          actions: [
            MyContainer(
              onTap: () => Get.back(),
              color: contentTheme.secondary,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.arrow_back, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium('Quay lại',
                      color: contentTheme.onSecondary),
                ],
              ),
            ),
          ],
          child: MyContainer(
            child: controller.isLoading.value
                ? const Center(child: CircularProgressIndicator())
                : SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildHeaderForm(),
                        MySpacing.height(16),
                        MyText.bodyMedium(
                          'Chi tiết vật tư nhập kho',
                          fontWeight: 700,
                        ),
                        MySpacing.height(8),
                        _buildDetailTable(),
                        MySpacing.height(16),
                        _buildActions(),
                      ],
                    ),
                  ),
          ),
        );
      },
    );
  }

  Widget _buildHeaderForm() {
    return Column(
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
                (value) => setState(() => nhaCungCapNid = value),
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
                (value) => setState(() => nguoiThucHienUid = value),
              ),
            ),
            MySpacing.width(12),
            Expanded(
              child: _buildDropdown(
                'Kho',
                khoNid,
                controller.khoList,
                (value) => setState(() => khoNid = value),
              ),
            ),
            MySpacing.width(12),
            Expanded(
              child: _buildDropdownString(
                'VAT phiếu',
                loaiVatPhieu,
                const ['%', 'Số tiền'],
                (value) {
                  loaiVatPhieu = value ?? '%';
                  _recalculateTotals();
                },
              ),
            ),
            MySpacing.width(12),
            Expanded(
              child: _buildInput(
                loaiVatPhieu == '%' ? 'VAT (%)' : 'VAT',
                vatPhieuCtrl,
                enabled: loaiVatPhieu == '%',
                keyboardType: TextInputType.number,
                onChanged: (_) => _recalculateTotals(),
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
                onChanged: (_) => _recalculateTotals(),
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
      ],
    );
  }

  Widget _buildDetailTable() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        columnSpacing: 12,
        headingRowColor: WidgetStateProperty.all(Colors.grey.shade100),
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
                    dropdownColor: Colors.white,
                    initialValue: _safeDropdownValue(row.nidVatTu, controller.vatTuList),
                    isExpanded: true,
                    items: controller.vatTuList.map((item) {
                      return DropdownMenuItem<int>(
                        value: item.id,
                        child: Text(item.title,
                            overflow: TextOverflow.ellipsis),
                      );
                    }).toList(),
                    onChanged: (value) {
                      final selected = _findOption(controller.vatTuList, value);
                      row.nidVatTu = value;
                      row.tenVatTu = selected?.title ?? '';
                      row.quyCachCtrl.text = selected?.subtitle ?? '';
                      _recalculateTotals();
                    },
                    decoration: _tableInputDecoration(),
                  ),
                ),
              ),
              DataCell(_smallInput(row.soLuongCtrl, width: 90)),
              DataCell(_smallInput(row.quyCachCtrl, width: 120)),
              DataCell(_smallInput(row.donGiaCtrl, width: 120)),
              DataCell(SizedBox(
                width: 120,
                child: Text(_formatNumber(row.tongTien)),
              )),
              DataCell(
                SizedBox(
                  width: 160,
                  child: Row(
                    children: [
                      SizedBox(
                        width: 80,
                        child: DropdownButtonFormField<String>(
                          dropdownColor: Colors.white,
                          initialValue: row.loaiVat,
                          items: const ['%', 'Số tiền']
                              .map((item) => DropdownMenuItem<String>(
                                    value: item,
                                    child: Text(item),
                                  ))
                              .toList(),
                          onChanged: (value) {
                            row.loaiVat = value ?? '%';
                            _recalculateTotals();
                          },
                          decoration: _tableInputDecoration(),
                        ),
                      ),
                      const SizedBox(width: 6),
                      Expanded(child: _smallInput(row.vatCtrl)),
                    ],
                  ),
                ),
              ),
              DataCell(SizedBox(
                width: 120,
                child: Text(_formatNumber(row.tienVat)),
              )),
              DataCell(SizedBox(
                width: 130,
                child: Text(_formatNumber(row.tongTienSauVat)),
              )),
              DataCell(
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.red),
                  onPressed: rows.length == 1
                      ? null
                      : () {
                          rows.removeAt(index);
                          _recalculateTotals();
                        },
                ),
              ),
            ],
          );
        }),
      ),
    );
  }

  Widget _buildActions() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        MyContainer(
          onTap: () {
            rows.add(_VatTuNhapRowControllers());
            _recalculateTotals();
          },
          color: contentTheme.success,
          padding: MySpacing.xy(12, 8),
          child: MyText.bodySmall(
            '+ Thêm dòng vật tư',
            color: contentTheme.onSuccess,
            fontWeight: 600,
          ),
        ),
        Row(
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
              onTap: _save,
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
                        'Lưu phiếu',
                        fontWeight: 600,
                        color: contentTheme.onPrimary,
                      );
              }),
            ),
          ],
        ),
      ],
    );
  }

  Widget _smallInput(TextEditingController ctrl, {double? width}) {
    return SizedBox(
      width: width,
      child: TextField(
        controller: ctrl,
        keyboardType: TextInputType.number,
        onChanged: (_) => _recalculateTotals(),
        decoration: _tableInputDecoration(),
      ),
    );
  }

  InputDecoration _tableInputDecoration() {
    return const InputDecoration(
      border: InputBorder.none,
      enabledBorder: InputBorder.none,
      focusedBorder: InputBorder.none,
      errorBorder: InputBorder.none,
      disabledBorder: InputBorder.none,
      isDense: true,
      contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
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
            dropdownColor: Colors.white,
            initialValue: _safeDropdownValue(value, options),
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
            dropdownColor: Colors.white,
            initialValue: value,
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

  void _recalculateTotals() {
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
    if (mounted) setState(() {});
  }

  void _save() {
    final data = _buildPayload();
    final existingData = widget.existingData;
    if (existingData != null && existingData.nid > 0) {
      controller.updatePhieuNhapVatTuOnServer(existingData.nid, data);
    } else {
      controller.savePhieuNhapVatTu(data);
    }
  }

  Map<String, dynamic> _buildPayload() {
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
      'trang_thai': widget.existingData?.trangThai ?? 'Chờ duyệt',
      'trang_thai_in': widget.existingData?.trangThaiIn ?? 'Chưa in',
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

  OptionItem? _findOption(List<OptionItem> options, int? id) {
    for (final option in options) {
      if (option.id == id) return option;
    }
    return null;
  }

  int? _safeDropdownValue(int? value, List<OptionItem> options) {
    if (value == null) return null;
    return options.any((item) => item.id == value) ? value : null;
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
    if (value == value.roundToDouble()) return value.round().toString();
    return value.toStringAsFixed(2);
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

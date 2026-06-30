import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

import '../../../../controller/kho555/phieu_nhap_vat_tu_controller.dart';
import '../../../../models/kho555/phieu_nhap_vat_tu.dart';
import '../../../../models/kho555/ton_kho_vat_tu.dart';

class TonKhoVatTuPageScreen extends StatefulWidget with UIMixin {
  const TonKhoVatTuPageScreen({super.key});

  @override
  State<TonKhoVatTuPageScreen> createState() => _TonKhoVatTuPageScreenState();
}

class _TonKhoVatTuPageScreenState extends State<TonKhoVatTuPageScreen> {
  final controller = Get.isRegistered<PhieuNhapVatTuController>()
      ? Get.find<PhieuNhapVatTuController>()
      : Get.put(PhieuNhapVatTuController());

  final contentTheme = AdminTheme.theme.contentTheme;
  final numberFormat = NumberFormat.decimalPattern('vi_VN');

  late final TextEditingController fromDateCtrl;
  late final TextEditingController toDateCtrl;

  int? khoNid;
  int? vatTuNid;

  @override
  void initState() {
    super.initState();

    final now = DateTime.now();

    fromDateCtrl = TextEditingController(
      text: _formatDate(DateTime(now.year, now.month, 1)),
    );

    toDateCtrl = TextEditingController(
      text: _formatDate(now),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) => _search());
  }

  @override
  void dispose() {
    fromDateCtrl.dispose();
    toDateCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<PhieuNhapVatTuController>(
      init: controller,
      builder: (_) {
        return Layout(
          mainScreenName: 'Kho',
          subScreenName: 'Báo cáo tồn kho vật tư',
          actions: [
            MyContainer(
              onTap: () {
                if (controller.isLoading.value) return;

                _search(page: controller.tonKhoPage.value);
              },
              color: contentTheme.primary,
              paddingAll: 12,
              child: Row(
                children: [
                  const Icon(Icons.refresh, color: Colors.white, size: 18),
                  const SizedBox(width: 6),
                  MyText.labelMedium(
                    'Tải lại',
                    color: contentTheme.onPrimary,
                  ),
                ],
              ),
            ),
          ],
          child: MyContainer(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildFilters(),
                MySpacing.height(16),
                Obx(() {
                  return _buildTableWithLoading(context);
                }),
                MySpacing.height(12),
                _buildPagination(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFilters() {
    return Wrap(
      spacing: 12,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.end,
      children: [
        SizedBox(
          width: 150,
          child: _buildDateInput('Từ ngày', fromDateCtrl),
        ),
        SizedBox(
          width: 150,
          child: _buildDateInput('Đến ngày', toDateCtrl),
        ),
        SizedBox(
          width: 220,
          child: _buildDropdown(
            'Kho',
            khoNid,
            controller.khoList,
                (value) {
              setState(() => khoNid = value);
            },
          ),
        ),
        SizedBox(
          width: 260,
          child: _buildDropdown(
            'Vật tư',
            vatTuNid,
            controller.vatTuList,
                (value) {
              setState(() => vatTuNid = value);
            },
          ),
        ),
        SizedBox(
          width: 100,
          child: _buildLimitDropdown(),
        ),
        MyContainer(
          onTap: () {
            if (controller.isLoading.value) return;

            _search(page: 1, showSuccessToast: true);
          },
          color: contentTheme.primary,
          padding: MySpacing.xy(14, 10),
          child: MyText.bodySmall(
            'Xem báo cáo',
            color: contentTheme.onPrimary,
            fontWeight: 700,
          ),
        ),
        MyContainer(
          onTap: () {
            _clearFilter();
          },
          color: contentTheme.warning,
          padding: MySpacing.xy(14, 10),
          child: MyText.bodySmall(
            'Xóa lọc',
            color: contentTheme.onWarning,
            fontWeight: 700,
          ),
        ),
      ],
    );
  }

  Widget _buildTableWithLoading(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.62,
      child: Stack(
        children: [
          Positioned.fill(
            child: _buildTable(controller.tonKhoList),
          ),
          if (controller.isLoading.value)
            Positioned.fill(
              child: Container(
                color: Colors.white.withOpacity(0.72),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 18,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.08),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 34,
                          height: 34,
                          child: CircularProgressIndicator(strokeWidth: 3),
                        ),
                        const SizedBox(height: 14),
                        MyText.bodyMedium(
                          'Đang tải dữ liệu...',
                          fontWeight: 700,
                        ),
                        const SizedBox(height: 4),
                        MyText.bodySmall(
                          'Vui lòng chờ trong giây lát',
                          color: Colors.grey.shade600,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTable(List<TonKhoVatTu> data) {
    final int page = controller.tonKhoPage.value;
    final int limit = controller.tonKhoLimit.value;
    final int startIndex = ((page - 1) * limit) + 1;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: SingleChildScrollView(
        child: DataTable(
          columnSpacing: 18,
          headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
          columns: [
            DataColumn(label: _headerCell('STT', width: 60)),
            DataColumn(label: _headerCell('Ngày', width: 150)),
            DataColumn(label: _headerCell('Vật tư', width: 260)),
            DataColumn(label: _headerCell('Tồn đầu kỳ', width: 130)),
            DataColumn(label: _headerCell('Nhập trong kỳ', width: 130)),
            DataColumn(label: _headerCell('Xuất trong kỳ', width: 130)),
            DataColumn(label: _headerCell('Tồn cuối kỳ', width: 130)),
          ],
          rows: data.isEmpty
              ? [
            DataRow(
              cells: [
                DataCell(_cellText('', width: 60)),
                DataCell(_cellText('', width: 150)),
                DataCell(
                  SizedBox(
                    width: 260,
                    child: MyText.bodySmall(
                      'Không có dữ liệu tồn kho',
                      fontWeight: 600,
                    ),
                  ),
                ),
                DataCell(_cellText('', width: 130)),
                DataCell(_cellText('', width: 130)),
                DataCell(_cellText('', width: 130)),
                DataCell(_cellText('', width: 130)),
              ],
            ),
          ]
              : [
            ...List.generate(data.length, (index) {
              final item = data[index];

              return DataRow(
                cells: [
                  DataCell(_cellText('${startIndex + index}', width: 60)),
                  DataCell(_cellText(item.ngayNhapXuat, width: 150)),
                  DataCell(_cellText(item.vatTuTitle, width: 260)),
                  DataCell(_cellNumber(item.tonDauKy, width: 130)),
                  DataCell(_cellNumber(item.nhapTrongKy, width: 130)),
                  DataCell(_cellNumber(item.xuatTrongKy, width: 130)),
                  DataCell(_cellNumber(item.tonCuoiKy, width: 130)),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildPagination() {
    final int page = controller.tonKhoPage.value;
    final int totalPages = controller.tonKhoTotalPages.value;
    final int total = controller.tonKhoTotal.value;
    final int limit = controller.tonKhoLimit.value;

    final int displayTotalPages = totalPages <= 0 ? 1 : totalPages;

    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        MyText.bodySmall(
          'Trang $page/$displayTotalPages - Tổng $total dòng - $limit dòng/trang',
          fontWeight: 600,
        ),
        const SizedBox(width: 12),
        _paginationButton(
          label: 'Trước',
          icon: Icons.chevron_left,
          enabled: controller.tonKhoHasPrev.value && !controller.isLoading.value,
          onTap: () {
            if (controller.isLoading.value) return;

            _search(page: page - 1);
          },
        ),
        const SizedBox(width: 8),
        _paginationButton(
          label: 'Sau',
          icon: Icons.chevron_right,
          enabled: controller.tonKhoHasNext.value && !controller.isLoading.value,
          onTap: () {
            if (controller.isLoading.value) return;

            _search(page: page + 1);
          },
        ),
      ],
    );
  }

  Widget _paginationButton({
    required String label,
    required IconData icon,
    required bool enabled,
    required VoidCallback onTap,
  }) {
    return MyContainer(
      onTap: enabled ? onTap : null,
      color: enabled ? contentTheme.primary : Colors.grey.shade300,
      padding: MySpacing.xy(12, 8),
      child: Row(
        children: [
          Icon(
            icon,
            color: enabled ? contentTheme.onPrimary : Colors.grey.shade600,
            size: 18,
          ),
          const SizedBox(width: 4),
          MyText.bodySmall(
            label,
            color: enabled ? contentTheme.onPrimary : Colors.grey.shade600,
            fontWeight: 700,
          ),
        ],
      ),
    );
  }

  Widget _buildLimitDropdown() {
    final int currentLimit = _safeLimitValue(controller.tonKhoLimit.value);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        MyText.labelMedium('Hiển thị'),
        const SizedBox(height: 6),
        DropdownButtonFormField<int>(
          dropdownColor: Colors.white,
          initialValue: currentLimit,
          isExpanded: true,
          items: const [
            DropdownMenuItem<int>(value: 10, child: Text('10')),
            DropdownMenuItem<int>(value: 20, child: Text('20')),
            DropdownMenuItem<int>(value: 50, child: Text('50')),
            DropdownMenuItem<int>(value: 100, child: Text('100')),
            DropdownMenuItem<int>(value: 200, child: Text('200')),
          ],
          onChanged: (value) {
            if (value == null) return;

            controller.tonKhoLimit.value = value;

            if (controller.isLoading.value) return;

            _search(page: 1);
          },
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            isDense: true,
            contentPadding: MySpacing.all(12),
          ),
        ),
      ],
    );
  }

  Widget _buildDateInput(String label, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        MyText.labelMedium(label),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          readOnly: true,
          onTap: () => _pickDate(ctrl),
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: 'Chọn ngày',
            isDense: true,
            contentPadding: MySpacing.all(12),
            suffixIcon: const Icon(Icons.calendar_month, size: 20),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown(
      String label,
      int? value,
      List<OptionItem> options,
      void Function(int?) onChanged,
      ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        MyText.labelMedium(label),
        const SizedBox(height: 6),
        DropdownButtonFormField<int>(
          dropdownColor: Colors.white,
          initialValue: _safeDropdownValue(value, options),
          isExpanded: true,
          items: _buildDropdownItems(options),
          onChanged: (value) => onChanged(value == 0 ? null : value),
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            isDense: true,
            contentPadding: MySpacing.all(12),
          ),
        ),
      ],
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
        maxLines: 2,
      ),
    );
  }

  Widget _cellNumber(double value, {double? width, bool bold = false}) {
    return SizedBox(
      width: width,
      child: Text(
        numberFormat.format(value),
        textAlign: TextAlign.right,
        style: TextStyle(
          fontWeight: bold ? FontWeight.w700 : FontWeight.normal,
        ),
      ),
    );
  }

  Future<void> _pickDate(TextEditingController ctrl) async {
    final currentDate = _parseDateFromText(ctrl.text) ?? DateTime.now();

    final pickedDate = await showDatePicker(
      context: context,
      initialDate: currentDate,
      firstDate: DateTime(2020, 1, 1),
      lastDate: DateTime(2100, 12, 31),
      locale: const Locale('vi', 'VN'),
    );

    if (pickedDate != null) {
      setState(() {
        ctrl.text = _formatDate(pickedDate);
      });
    }
  }

  Future<void> _search({
    int page = 1,
    bool showSuccessToast = false,
  }) async {
    await controller.fetchBaoCaoTonKhoVatTu(
      fromDate: _parseDateToInt(fromDateCtrl.text),
      toDate: _parseDateToInt(toDateCtrl.text),
      khoNid: khoNid ?? 0,
      vatTuNid: vatTuNid ?? 0,
      page: page,
      limit: controller.tonKhoLimit.value,
      showSuccessToast: showSuccessToast,
    );

    if (!mounted) return;

    setState(() {
      khoNid = controller.selectedKhoNid.value > 0
          ? controller.selectedKhoNid.value
          : null;

      vatTuNid = controller.selectedVatTuNid.value > 0
          ? controller.selectedVatTuNid.value
          : null;
    });
  }

  Future<void> _clearFilter() async {
    final now = DateTime.now();

    setState(() {
      fromDateCtrl.text = _formatDate(DateTime(now.year, now.month, 1));
      toDateCtrl.text = _formatDate(now);
      khoNid = null;
      vatTuNid = null;
    });

    controller.tonKhoPage.value = 1;
    controller.tonKhoLimit.value = 20;

    if (controller.isLoading.value) return;

    await _search(page: 1);
  }

  List<DropdownMenuItem<int>> _buildDropdownItems(List<OptionItem> options) {
    return [
      const DropdownMenuItem<int>(
        value: 0,
        child: Text('Tất cả'),
      ),
      ...options.map((item) {
        return DropdownMenuItem<int>(
          value: item.id,
          child: Text(
            item.title,
            overflow: TextOverflow.ellipsis,
          ),
        );
      }),
    ];
  }

  int _safeDropdownValue(int? value, List<OptionItem> options) {
    if ((value ?? 0) <= 0) {
      return 0;
    }

    return options.any((item) => item.id == value) ? value! : 0;
  }

  int _safeLimitValue(int value) {
    const limits = [10, 20, 50, 100, 200];

    if (limits.contains(value)) {
      return value;
    }

    return 20;
  }

  DateTime? _parseDateFromText(String value) {
    final text = value.trim();
    if (text.isEmpty) return null;

    final parts = text.split('/');
    if (parts.length != 3) return null;

    final day = int.tryParse(parts[0]);
    final month = int.tryParse(parts[1]);
    final year = int.tryParse(parts[2]);

    if (day == null || month == null || year == null) return null;

    try {
      return DateTime(year, month, day);
    } catch (_) {
      return null;
    }
  }

  String _formatDate(DateTime value) {
    return '${value.day.toString().padLeft(2, '0')}/${value.month.toString().padLeft(2, '0')}/${value.year}';
  }

  int? _parseDateToInt(String value) {
    final text = value.trim();
    if (text.isEmpty) return null;

    final parts = text.split('/');
    if (parts.length == 3) {
      final d = int.tryParse(parts[0]) ?? 0;
      final m = int.tryParse(parts[1]) ?? 0;
      final y = int.tryParse(parts[2]) ?? 0;

      if (d > 0 && m > 0 && y > 0) {
        return y * 10000 + m * 100 + d;
      }
    }

    final digits = text.replaceAll(RegExp(r'[^0-9]'), '');
    if (digits.isEmpty) return null;

    return int.tryParse(digits);
  }
}

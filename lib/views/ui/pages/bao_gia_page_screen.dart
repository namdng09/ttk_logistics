import 'package:kho555/controller/pages/bao_gia_page_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import '../../../helper/widgets/my_spacing.dart';
import '../../../helper/widgets/my_text.dart';
import '../../../services/bao_gia_service.dart';

class BaoGiaPageScreen extends StatefulWidget {
  const BaoGiaPageScreen({super.key});

  @override
  State<BaoGiaPageScreen> createState() => _BaoGiaPageScreenState();
}

class _BaoGiaPageScreenState extends State<BaoGiaPageScreen> with UIMixin {
  late BaoGiaPageController controller;

  @override
  void initState() {
    controller = Get.put(BaoGiaPageController());
    super.initState();
  }

  Widget _buildTextField(String hint, {double width = 150, Function(String)? onChanged}) {
    return SizedBox(
      width: width,
      child: TextField(
        decoration: InputDecoration(
          hintText: hint,
          border: const OutlineInputBorder(),
          isDense: true,
          contentPadding: MySpacing.all(12),
        ),
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildDropdown({
    required List<String> items,
    required String hint,
    required String? value,
    required Function(String?) onChanged,
    double width = 150,
  }) {
    return SizedBox(
      width: width,
      child: DropdownButtonFormField<String>(
        value: value,
        hint: MyText.bodyMedium(hint, fontWeight: 600),
        isExpanded: true,
        dropdownColor: contentTheme.onPrimary,
        items: items
            .map((e) => DropdownMenuItem(value: e, child: MyText.bodyMedium(e, fontWeight: 600)))
            .toList(),
        onChanged: onChanged,
        borderRadius: BorderRadius.circular(12),
        decoration: InputDecoration(
          isDense: true,
          isCollapsed: true,
          border: const OutlineInputBorder(),
          contentPadding: MySpacing.all(12),
        ),
      ),
    );
  }

  Widget _buildRowCuocBien(int index) {
    final row = controller.cuocBienRows[index];

    return Row(
      children: [
        Expanded(
          flex: 1,
          child: DropdownButtonFormField<String>(
            value: row.danhMuc,
            hint: const Text("Chọn danh mục"),
            isExpanded: true,
            dropdownColor: contentTheme.onPrimary,
            items: ["Ocean Freight", "DOC", "THC"]
                .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                .toList(),
            onChanged: (val) {
              row.danhMuc = val;
            },
            decoration: InputDecoration(
              isDense: true,
              isCollapsed: true,
              border: OutlineInputBorder(),
              contentPadding: MySpacing.all(10),
            ),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(

          child: TextField(
            decoration: InputDecoration(
              hintText: "20FT",
              border: const OutlineInputBorder(),
              isDense: true,
              contentPadding: MySpacing.all(12),
            ),
            onChanged: (val) => row.ft20 = val,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            decoration: InputDecoration(
                border: OutlineInputBorder(),
                isDense: true,
                hintText: "40FT",
                contentPadding: MySpacing.all(12),
            ),
            onChanged: (val) => row.ft40 = val,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 2,
          child: TextField(
            decoration: InputDecoration(
                border: OutlineInputBorder(),
                isDense: true,
                hintText: "Ghi chú",
                contentPadding: MySpacing.all(12),
            ),
            onChanged: (val) => row.ghiChu = val,
          ),
        ),
        const SizedBox(width: 8),
        IconButton(
          onPressed: controller.addCuocBienRow,
          icon: const Icon(Icons.add, color: Colors.green),
        ),
        IconButton(
          onPressed: () => controller.removeCuocBienRow(index),
          icon: const Icon(Icons.remove, color: Colors.red),
        ),
      ],
    );
  }

  Widget _buildBangCuocBien() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.titleMedium("Bảng cước biển", fontWeight: 700),
        const SizedBox(height: 12),
        ...List.generate(
          controller.cuocBienRows.length,
              (index) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: _buildRowCuocBien(index),
          ),
        ),
      ],
    );
  }

  Widget _buildBangLoaiXe(
      String title,
      List<LoaiXeRow> rows,
      Function onAdd,
      Function(int) onRemove, {
        required List<String> loaiXe, // 👈 truyền loại xe từ ngoài vào
      }) {
    DataRow buildDataRow(int index) {
      final row = rows[index];
      return DataRow(
        cells: [
          DataCell(
            DropdownButtonFormField<String>(
              value: row.danhMucPhi,
              hint: const Text("Chọn"),
              isExpanded: true,
              items: ["Phí mở tờ khai", "Phí dịch vụ", "Phí xử lý"]
                  .map((value) => DropdownMenuItem(value: value, child: Text(value)))
                  .toList(),
              onChanged: (val) => row.danhMucPhi = val,
              dropdownColor: contentTheme.light,
              decoration: InputDecoration(
                  border: OutlineInputBorder(),
                  isDense: true,
                  contentPadding: MySpacing.all(10),
              ),
            ),
          ),
          ...loaiXe.map((e) {
            return DataCell(
              TextField(
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  isDense: true,
                  hintText: e,
                  contentPadding: MySpacing.all(12),
                ),
                onChanged: (val) => row.giaTheoLoaiXe[e] = val,
              ),
            );
          }).toList(),
          DataCell(
            IconButton(
              onPressed: () => onAdd(),
              icon: const Icon(Icons.add, color: Colors.green),
            ),
          ),
          DataCell(
            IconButton(
              onPressed: () => onRemove(index),
              icon: const Icon(Icons.remove, color: Colors.red),
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.titleMedium(title, fontWeight: 700),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: DataTable(
            columnSpacing: 12,
            columns: [
              const DataColumn(label: Text("Danh mục phí")),
              ...loaiXe.map((e) => DataColumn(label: Text(e))).toList(),
              const DataColumn(label: Text("Thêm")),
              const DataColumn(label: Text("Xoá")),
            ],
            rows: List.generate(rows.length, (i) => buildDataRow(i)),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<BaoGiaPageController>(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Thêm báo giá',
          mainScreenName: 'Trang',
          actions: [
            MyContainer(
              onTap: controller.isSaving ? null : () => controller.saveBaoGia(),
              color: contentTheme.success,
              paddingAll: 12,
              child: controller.isSaving
                  ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
                  : MyText.labelMedium("Lưu báo giá", color: contentTheme.onSuccess),
            ),
          ],
          child: MyContainer(
            clipBehavior: Clip.none, // ✅ để dropdown hiển thị ra ngoài
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hàng chọn thông tin chung
                  Row(
                    children: [
                      Expanded(
                        child: _buildDropdown(
                          items: ["Khách hàng A", "Khách hàng B"],
                          hint: "Khách hàng",
                          value: controller.selectedKhachHang,
                          onChanged: controller.onSelectKhachHang,
                        ),
                      ),
                      const SizedBox(width: 12),

                      Expanded(
                        child: _buildDropdown(
                          items: ["Export", "Import"],
                          hint: "Loại báo giá",
                          value: controller.selectedLoaiBaoGia,
                          onChanged: controller.onSelectLoaiBaoGia,
                        ),
                      ),
                      const SizedBox(width: 12),

                      Expanded(
                        child: _buildDropdown(
                          items: ["VND", "USD"],
                          hint: "Tiền tệ",
                          value: controller.selectedTienTe,
                          onChanged: controller.onSelectTienTe,
                        ),
                      ),
                      const SizedBox(width: 12),

                      Expanded(
                        child: _buildDropdown(
                          items: ["Door to Door", "Dịch vụ thông quan"],
                          hint: "Loại dịch vụ",
                          value: controller.selectedLoaiDichVu,
                          onChanged: controller.onSelectLoaiDichVu,
                        ),
                      ),
                      const SizedBox(width: 12),

                      Expanded(
                        flex: 2, // 👈 cho mô tả rộng gấp đôi
                        child: _buildTextField(
                          "Mô tả hàng hoá",
                          onChanged: controller.onChangeMoTa,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  _buildBangCuocBien(),
                  const SizedBox(height: 24),

                  // SEA EXPORT: giữ nguyên
                  _buildBangLoaiXe(
                    "SEA EXPORT (Cảng Hải Phòng)",
                    controller.seaExportRows,
                    controller.addSeaExportRow,
                    controller.removeSeaExportRow,
                    loaiXe: [
                      "1.25 Tấn","2.5 Tấn","3.5 Tấn","5.0 Tấn","8.0 Tấn","10.0 Tấn","12.0 Tấn","Xe 3 chân","Xe 4 chân","Cont 20","Cont 40"
                    ],
                  ),

                  const SizedBox(height: 24),

// AIR EXPORT: không có Cont
                  _buildBangLoaiXe(
                    "AIR EXPORT (Cảng hàng không Nội Bài)",
                    controller.airExportRows,
                    controller.addAirExportRow,
                    controller.removeAirExportRow,
                    loaiXe: [
                      "1.25 Tấn","2.5 Tấn","3.5 Tấn","5.0 Tấn","8.0 Tấn","10.0 Tấn","12.0 Tấn","Xe 3 chân","Xe 4 chân"
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

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/pages/blank_page_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import '../../../helper/widgets/my_spacing.dart';
import '../../../helper/widgets/my_text.dart';
import '../../../models/danh_muc.dart';
import '../../../services/danh_muc_service.dart';

class DanhMucPageScreen extends StatefulWidget {
  const DanhMucPageScreen({super.key});

  @override
  State<DanhMucPageScreen> createState() => _DanhMucPageScreenState();
}

class _DanhMucPageScreenState extends State<DanhMucPageScreen> with UIMixin {
  late BlankPageController controller;

  @override
  void initState() {
    controller = Get.put(BlankPageController());
    super.initState();
  }

  Widget basicBorderlessExample() {
    DataRow buildDataRow(DanhMuc dm) {
      return DataRow(
        cells: [
          DataCell(MyText.bodyMedium(dm.title)),
          DataCell(MyText.bodyMedium(dm.phanLoai)),
          DataCell(
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, color: Colors.blue),
                  tooltip: 'Sửa',
                  onPressed: () {},
                ),
                IconButton(
                  icon: const Icon(Icons.delete, color: Colors.red),
                  tooltip: 'Xoá',
                  onPressed: () {},
                ),
              ],
            ),
          ),
        ],
      );
    }

    return FutureBuilder<List<DanhMuc>>(
      future: DanhMucService.fetchDanhMuc(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text("Lỗi: ${snapshot.error}"));
        } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return const Center(child: Text("Không có dữ liệu"));
        }

        final danhMucList = snapshot.data!;

        return Padding(
          padding: MySpacing.nTop(20),
          child: SizedBox(
            width: double.infinity,
            child: DataTable(
              columnSpacing: 20,
              columns: [
                const DataColumn(label: Text('Tên danh mục')),
                const DataColumn(label: Text('Phân loại')),
                DataColumn(
                  label: SizedBox(
                    width: double.infinity,
                    child: Align(
                      alignment: Alignment.centerRight,
                      child: Text('Chức năng'),
                    ),
                  ),
                ),
              ],
              rows: danhMucList.map((dm) => buildDataRow(dm)).toList(),
              decoration: const BoxDecoration(
                border: Border.fromBorderSide(BorderSide(color: Colors.transparent)),
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {

    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Danh mục chung',
          mainScreenName: 'Trang',
          actions: [
            MyContainer(
              onTap: () {},
              color: contentTheme.success,
              paddingAll: 12,
              child: MyText.labelMedium("Thêm danh mục", color: contentTheme.onSuccess),
            ),
            const SizedBox(width: 12),
            MyContainer(
              onTap: () {},
              color: contentTheme.primary,
              paddingAll: 12,
              child: MyText.labelMedium("Export Excel", color: contentTheme.onPrimary),
            ),
          ],
          child: MyContainer(
            child: basicBorderlessExample(),
          ),
        );
      },
    );
  }
}

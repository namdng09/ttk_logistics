import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/blank_page_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import '../../../helper/widgets/my_spacing.dart';
import '../../../helper/widgets/my_text.dart';
import '../../../helper/widgets/my_text_style.dart';

class LoaiXePageScreen extends StatefulWidget {
  const LoaiXePageScreen({super.key});

  @override
  State<LoaiXePageScreen> createState() => _LoaiXePageScreenState();
}

class _LoaiXePageScreenState extends State<LoaiXePageScreen> with UIMixin {
  late BlankPageController controller;

  @override
  void initState() {
    controller = Get.put(BlankPageController());
    super.initState();
  }

  Widget buildTable(List<String> loaiXeList) {
    final controllers = loaiXeList.map((e) => TextEditingController(text: e)).toList();

    DataRow buildDataRow(int index) {
      return DataRow(
        cells: [
          DataCell(MyText.bodyMedium((index + 1).toString())), // STT
          DataCell(
              TextField(
                controller: controllers[index],
                style: MyTextStyle.bodyMedium(),
                decoration: InputDecoration(
                  border: const OutlineInputBorder(),
                  isDense: true,
                  contentPadding: MySpacing.all(12),
                ),
                onChanged: (value) async {
                  // ✅ Cập nhật mảng local
                  loaiXeList[index] = value;

                  // ✅ Gọi API update configBlock
                  // final ok = await ConfigService.updateConfigBlock("loai_xe", loaiXeList);
                  // if (!ok) {
                  //   // TODO: có thể hiện toast báo lỗi
                  //   debugPrint("Cập nhật configBlock thất bại!");
                  // }
                },
              )

          ),
          DataCell(
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                icon: const Icon(Icons.delete, color: Colors.red),
                tooltip: 'Xoá',
                onPressed: () {
                  setState(() {
                    loaiXeList.removeAt(index);
                    controllers.removeAt(index);
                  });
                },
              ),
            ),
          ),
        ],
      );
    }

    return Padding(
      padding: MySpacing.nTop(20),
      child: SizedBox(
        width: double.infinity,
        child: DataTable(
          columnSpacing: 20,
          columns: [
            const DataColumn(label: Text('STT')),
            const DataColumn(label: Text('Tên loại xe')),
            DataColumn(
              label: SizedBox(
                width: double.infinity,
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text('Xoá'),
                ),
              ),
            ),
          ],
          rows: List.generate(loaiXeList.length, (i) => buildDataRow(i)),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Danh sách loại xe',
          mainScreenName: 'Trang',
          actions: [
            MyContainer(
              onTap: () {
                // TODO: thêm loại xe mới
              },
              color: contentTheme.success,
              paddingAll: 12,
              child: MyText.labelMedium("Thêm loại xe", color: contentTheme.onSuccess),
            ),
            const SizedBox(width: 12),
            MyContainer(
              onTap: () {
                // TODO: export excel
              },
              color: contentTheme.primary,
              paddingAll: 12,
              child: MyText.labelMedium("Export Excel", color: contentTheme.onPrimary),
            ),
          ],
          // child: MyContainer(
          //   child: FutureBuilder<List<String>>(
          //     future: ConfigService.fetchLoaiXe(),
          //     builder: (context, snapshot) {
          //       if (snapshot.connectionState == ConnectionState.waiting) {
          //         return const Center(child: CircularProgressIndicator());
          //       } else if (snapshot.hasError) {
          //         return Center(child: Text("Lỗi: ${snapshot.error}"));
          //       } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
          //         return const Center(child: Text("Không có dữ liệu"));
          //       }
          //       return buildTable(snapshot.data!);
          //     },
          //   ),
          // ),
        );
      },
    );
  }
}


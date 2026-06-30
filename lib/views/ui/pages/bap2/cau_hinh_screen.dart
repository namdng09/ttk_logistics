import 'package:ttk_logistics/controller/pages/cau_hinh_controller.dart';
import 'package:ttk_logistics/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class CauHinhScreen extends StatefulWidget {
  const CauHinhScreen({super.key});

  @override
  State<CauHinhScreen> createState() => _CauHinhScreenState();
}

class _CauHinhScreenState extends State<CauHinhScreen> with UIMixin {
  late CauHinhController controller;

  @override
  void initState() {
    controller = Get.put(CauHinhController());
    super.initState();
    // Gọi API để load dữ liệu cấu hình khi khởi động form
    controller.loadCauHinh();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhController>(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Cấu hình khác',
          mainScreenName: 'Hệ thống',
          child: MyContainer(
            height: 400,
            width: double.infinity, // Đặt độ rộng của MyContainer là 100%
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, // Căn trái nội dung của Column
              children: [
                // Container bao bọc TextFormField để điều chỉnh độ rộng
                SizedBox(
                  width: 120,
                  child: Focus(
                    onFocusChange: (hasFocus) {
                      if (!hasFocus) {
                        // Khi mất focus, cập nhật giá trị vào controller
                        setState(() {
                          controller.thoiGianHan = double.tryParse(controller.thoiGianHanController.text.replaceAll('.', '')) ?? 0.0;
                        });
                      }
                    },
                    child: TextField(
                      controller: controller.thoiGianHanController,
                      keyboardType: TextInputType.number,
                      textAlign: TextAlign.right,
                      inputFormatters: [ThousandsSeparatorInputFormatter()],
                      decoration: const InputDecoration(
                        labelText: "Phí phát sinh",
                        floatingLabelBehavior: FloatingLabelBehavior.always,
                        border: OutlineInputBorder(),
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      ),
                      onEditingComplete: () {
                        // Khi người dùng nhấn "Done", lưu giá trị vào controller
                        FocusScope.of(context).unfocus();
                        setState(() {
                          controller.thoiGianHan = double.tryParse(controller.thoiGianHanController.text.replaceAll('.', '')) ?? 0.0;
                        });
                      },
                    ),
                  ),
                ),

                SizedBox(height: 20),
                // Hiển thị nút "Lưu"
                Obx(() {
                  if (controller.isLoading.value) {
                    return Center(
                      child: CircularProgressIndicator(), // Hiển thị loading khi đang tải hoặc lưu
                    );
                  } else {
                    return ElevatedButton(
                      onPressed: () {
                        // Lấy giá trị mới nhất từ controller khi nhấn nút "Lưu"
                        controller.thoiGianHan = double.tryParse(controller.thoiGianHanController.text.replaceAll('.', '')) ?? 0.0;
                        // Gọi phương thức lưu cấu hình khi nhấn nút "Lưu"
                        controller.saveCauHinh();
                      },
                      child: Text('Lưu'),
                    );
                  }
                }),
              ],
            ),
          ),
        );
      },
    );
  }
}

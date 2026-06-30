import 'package:kho555/controller/pages/cau_hinh_hop_dong_ca_nhan_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:html_editor_enhanced/html_editor.dart';

class CauHinhLenhDieuDongScreen extends StatefulWidget {
  const CauHinhLenhDieuDongScreen({super.key});

  @override
  State<CauHinhLenhDieuDongScreen> createState() =>
      _CauHinhLenhDieuDongScreenState();
}

class _CauHinhLenhDieuDongScreenState
    extends State<CauHinhLenhDieuDongScreen> with UIMixin {
  final controller = Get.put(CauHinhHopDongCaNhanController(), tag: 'editor_lenh_dieu_dong_controller');

  @override
  void initState() {
    super.initState();
    // 🧩 Gọi tải nội dung mẫu khi form khởi tạo
    WidgetsBinding.instance.addPostFrameCallback((_) {
      controller.taiNoiDungMau(type: 'lenh_dieu_dong');
    });
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhHopDongCaNhanController>(
      tag: 'editor_lenh_dieu_dong_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Cấu hình biểu mẫu điều động',
          mainScreenName: 'Cấu hình',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            borderRadiusAll: 4,
            paddingAll: 20,
            child: Obx(() {
              // 🌀 Nếu đang tải dữ liệu mẫu → hiển thị loading
              if (controller.isLoading.value) {
                return const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 12),
                      Text("Đang tải nội dung mẫu..."),
                    ],
                  ),
                );
              }

              // ✅ Khi đã có dữ liệu → hiển thị editor
              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    "📝 Trình soạn thảo nội dung",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  HtmlEditor(
                    controller: controller.htmlController,
                    htmlEditorOptions: const HtmlEditorOptions(
                      hint: "Nhập nội dung...",
                      shouldEnsureVisible: true,
                    ),
                    htmlToolbarOptions: const HtmlToolbarOptions(
                      toolbarPosition: ToolbarPosition.aboveEditor,
                      toolbarType: ToolbarType.nativeScrollable,
                      dropdownBackgroundColor: Colors.white,
                      defaultToolbarButtons: [
                        FontButtons(),
                        ColorButtons(),
                        ListButtons(),
                        ParagraphButtons(),
                        InsertButtons(),
                      ],
                    ),
                    otherOptions: const OtherOptions(
                      height: 400,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 🧩 Nút hành động
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      // 🔹 Nút Lưu
                      Obx(() {
                        final isSaving = controller.isSaving.value;
                        return ElevatedButton.icon(
                          icon: isSaving
                              ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                              : const Icon(Icons.save),
                          label: Text(isSaving ? "Đang lưu..." : "Lưu nội dung"),
                          onPressed: isSaving
                              ? null
                              : () => controller.luuHopDong(type: 'lenh_dieu_dong'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.blue.shade600,
                            padding: const EdgeInsets.symmetric(
                              horizontal: 20,
                              vertical: 12,
                            ),
                            disabledBackgroundColor: Colors.blue.shade300,
                          ),
                        );
                      }),

                      const SizedBox(width: 10),

                      // 🔹 Nút tải lại mẫu
                      OutlinedButton.icon(
                        icon: const Icon(Icons.refresh),
                        label: const Text("Tải lại mẫu"),
                        onPressed: () => controller.taiNoiDungMau(type: 'lenh_dieu_dong'),
                      ),
                    ],
                  ),
                ],
              );
            }),
          ),
        );
      },
    );
  }
}

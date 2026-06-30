import 'package:kho555/controller/pages/cau_hinh_hop_dong_nha_xe_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:html_editor_enhanced/html_editor.dart';

class CauHinhHopDongNhaXeScreen extends StatefulWidget {
  const CauHinhHopDongNhaXeScreen({super.key});

  @override
  State<CauHinhHopDongNhaXeScreen> createState() =>
      _CauHinhHopDongNhaXeScreenState();
}

class _CauHinhHopDongNhaXeScreenState
    extends State<CauHinhHopDongNhaXeScreen> with UIMixin {
  final controller =
  Get.put(CauHinhHopDongNhaXeController(), tag: 'editor_nhaxe');

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final args = Get.arguments ?? {};
      final nid = args["nid"];
      final tenNhaXe = args["tenNhaXe"];
      if (nid != null) {
        controller.taiNoiDungMau(nid: nid, tenNhaXe: tenNhaXe);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CauHinhHopDongNhaXeController>(
      tag: 'editor_nhaxe',
      builder: (controller) {
        return Layout(
          subScreenName: 'Cấu hình hợp đồng Nhà Xe',
          mainScreenName: 'Cấu hình',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            borderRadiusAll: 4,
            paddingAll: 20,
            child: Obx(() {
              if (controller.isLoading.value) {
                return const Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      CircularProgressIndicator(),
                      SizedBox(height: 12),
                      Text("Đang tải nội dung hợp đồng Nhà Xe..."),
                    ],
                  ),
                );
              }

              return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    "📝 Trình soạn thảo hợp đồng Nhà Xe${controller.tenNhaXe.isNotEmpty ? " - ${controller.tenNhaXe}" : ""}",
                    style: const TextStyle(
                        fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),

                  HtmlEditor(
                    controller: controller.htmlController,
                    callbacks: Callbacks(onInit: () async {
                      // Đảm bảo setText chỉ khi editor đã sẵn sàng và có nội dung
                      final currentContent = controller.initialContent.value;
                      print("🧩 Editor onInit, nội dung initial: ${currentContent.isNotEmpty ? 'Có nội dung' : 'Trống'}");
                      if (currentContent.isNotEmpty) {
                        controller.htmlController.setText(currentContent);
                        print("✅ Đã chèn nội dung hợp đồng vào editor");
                      }
                    }),
                    htmlEditorOptions: const HtmlEditorOptions(
                      hint: "Nhập nội dung hợp đồng...",
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
                    otherOptions: const OtherOptions(height: 450),
                  ),

                  const SizedBox(height: 24),

                  // 🧭 Hàng nút hành động (bổ sung nút Quay lại)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // ⬅ Quay lại
                      OutlinedButton.icon(
                        icon: const Icon(Icons.arrow_back),
                        label: const Text("Quay lại"),
                        onPressed: () => Get.back(),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.grey.shade800,
                          side: BorderSide(color: Colors.grey.shade400),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 18,
                            vertical: 12,
                          ),
                        ),
                      ),

                      // 🔹 Cụm nút hành động bên phải
                      Row(
                        children: [
                          // 💾 Lưu nội dung
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
                              label: Text(isSaving
                                  ? "Đang lưu..."
                                  : "Lưu nội dung hợp đồng"),
                              onPressed: isSaving ? null : controller.luuHopDong,
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

                          // 🔄 Tải lại mẫu
                          OutlinedButton.icon(
                            icon: const Icon(Icons.refresh),
                            label: const Text("Tải lại mẫu"),
                            onPressed: () => controller.taiNoiDungMau(
                              nid: controller.nhaXeId,
                              tenNhaXe: controller.tenNhaXe,
                            ),
                          ),

                          const SizedBox(width: 10),

                          // 🖨️ In hợp đồng
                          ElevatedButton.icon(
                            icon: const Icon(Icons.print),
                            label: const Text("In hợp đồng"),
                            onPressed: () async {
                              final nid = controller.nhaXeId ?? 0;
                              await controller.inHopDong(nid);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade600,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                            ),
                          ),
                        ],
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

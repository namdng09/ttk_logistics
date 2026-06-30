import 'package:kho555/controller/pages/cau_hinh_hop_dong_ca_nhan_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:html_editor_enhanced/html_editor.dart';

class InHopDongCaNhanScreen extends StatefulWidget {
  final Map<String, dynamic> chuyenXe;
  final String noiDungMau;

  const InHopDongCaNhanScreen({
    super.key,
    required this.chuyenXe,
    required this.noiDungMau,
  });

  @override
  State<InHopDongCaNhanScreen> createState() => _InHopDongCaNhanScreenState();
}

class _InHopDongCaNhanScreenState extends State<InHopDongCaNhanScreen>
    with UIMixin {
  late CauHinhHopDongCaNhanController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.put(
      CauHinhHopDongCaNhanController(),
      tag: 'in_hop_dong_controller',
    );

    WidgetsBinding.instance.addPostFrameCallback((_) async {
      controller.htmlController.setText(widget.noiDungMau);
      controller.noiDung.value = widget.noiDungMau;
    });
  }

  @override
  Widget build(BuildContext context) {
    final chuyenXe = widget.chuyenXe;
    // 🧩 Lấy nid ngay đầu hàm
    final int nid = int.tryParse(widget.chuyenXe["nid"].toString()) ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          "Hợp đồng cá nhân - ${chuyenXe["title"] ?? ""}",
          style: const TextStyle(fontSize: 16),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Get.back(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.save_outlined),
            tooltip: "Lưu nội dung",
            onPressed: () => controller.luuHopDongCaNhan(widget.chuyenXe["nid"]),
          ),
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: "In hợp đồng",
            onPressed: () async {
              final nid = int.tryParse(widget.chuyenXe["nid"].toString()) ?? 0;
              await controller.inHopDongCaNhan(nid);
            },
          ),
        ],
      ),
      body: Obx((){
        final isSaving = controller.isSaving.value;
        return Padding(
          padding: const EdgeInsets.all(16),
          child: MyCard(
            shadow: MyShadow(elevation: 2),
            borderRadiusAll: 8,
            paddingAll: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  "📝 Soạn thảo hợp đồng cá nhân",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: HtmlEditor(
                    controller: controller.htmlController,
                    htmlEditorOptions: HtmlEditorOptions(
                      hint: "Soạn nội dung hợp đồng...",
                      shouldEnsureVisible: true,
                      initialText: widget.noiDungMau,
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
                    otherOptions: const OtherOptions(height: 500),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton.icon(
                      icon: const Icon(Icons.arrow_back),
                      label: const Text("Quay lại"),
                      onPressed: () => Get.back(),
                    ),
                    const SizedBox(width: 10),
                    // 🔹 Nút lưu có spinner
                    ElevatedButton.icon(
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
                      onPressed:
                      isSaving ? null : () => controller.luuHopDongCaNhan(nid),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue.shade700,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 20, vertical: 12),
                        disabledBackgroundColor: Colors.blue.shade300,
                      ),
                    ),
                    const SizedBox(width: 10),
                    // 🔹 Nút In hợp đồng
                    ElevatedButton.icon(
                      icon: const Icon(Icons.print),
                      label: const Text("In hợp đồng"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.teal.shade600,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      ),
                      onPressed: () async {
                        final nid = int.tryParse(widget.chuyenXe["nid"].toString()) ?? 0;
                        await controller.inHopDongCaNhan(nid);
                      },
                    ),
                  ],
                )
              ],
            ),
          ),
        );
      })
    );
  }

  Future<void> _onPrint() async {
    final content = await controller.htmlController.getText();
    if (content.isEmpty) {
      Get.snackbar("⚠️ Cảnh báo", "Chưa có nội dung để in");
      return;
    }

    // TODO: Xuất PDF hoặc mở preview
    Get.snackbar(
      "In hợp đồng",
      "Đang chuẩn bị nội dung in...",
      backgroundColor: Colors.blue.shade50,
      colorText: Colors.blue.shade700,
    );
  }
}

import 'package:ttk_logistics/controller/pages/in_lenh_dieu_dong_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:html_editor_enhanced/html_editor.dart';

class InLenhDieuDongScreen extends StatefulWidget {
  final Map<String, dynamic> chuyenXe;
  final String noiDungMau;

  const InLenhDieuDongScreen({
    super.key,
    required this.chuyenXe,
    required this.noiDungMau,
  });

  @override
  State<InLenhDieuDongScreen> createState() => _InLenhDieuDongScreenState();
}

class _InLenhDieuDongScreenState extends State<InLenhDieuDongScreen>
    with UIMixin {
  late InLenhDieuDongController controller;

  @override
  void initState() {
    super.initState();
    controller = Get.put(
      InLenhDieuDongController(),
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
          "Lệnh điều động - ${chuyenXe["title"] ?? ""}",
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
            onPressed: () => controller.luuLenhDieuDongTheoChuyenXe(widget.chuyenXe["nid"]),
          ),
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: "In lệnh điều động",
            onPressed: () async {
              final nid = int.tryParse(widget.chuyenXe["nid"].toString()) ?? 0;
              await controller.inLenhDieuDong(nid);
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
                  "📝 Soạn thảo nội dung",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 10),
                Expanded(
                  child: HtmlEditor(
                    controller: controller.htmlController,
                    htmlEditorOptions: HtmlEditorOptions(
                      hint: "Soạn nội dung ...",
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
                      isSaving ? null : () => controller.luuLenhDieuDongTheoChuyenXe(nid),
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
                      label: const Text("In lệnh điều động"),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.teal.shade600,
                        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      ),
                      onPressed: () async {
                        final nid = int.tryParse(widget.chuyenXe["nid"].toString()) ?? 0;
                        await controller.inLenhDieuDong(nid);
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
}

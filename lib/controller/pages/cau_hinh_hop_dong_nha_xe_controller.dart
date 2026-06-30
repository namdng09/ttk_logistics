import 'dart:html' as html;
import 'dart:convert';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/storage/local_storage.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:html_editor_enhanced/html_editor.dart';
import 'package:http/http.dart' as http;

class CauHinhHopDongNhaXeController extends GetxController {
  final isLoading = true.obs;
  final isSaving = false.obs;
  final initialContent = ''.obs;

  final htmlController = HtmlEditorController();

  int? nhaXeId;
  String tenNhaXe = "";

  /// 🧩 Tải nội dung mẫu hợp đồng Nhà Xe
  Future<void> taiNoiDungMau({int? nid, String? tenNhaXe}) async {
    isLoading.value = true;
    nhaXeId = nid ?? nhaXeId;
    this.tenNhaXe = tenNhaXe ?? this.tenNhaXe;

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getHopDongNhaXe,
          "method": "POST",
          "params": {
            "nid": nhaXeId,
            "token": token,
            "created_email": email,
          },
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final rawContent = data["noi_dung"] ?? "";

        // ✅ Lưu tạm nội dung vào biến để set sau trong editor.onInit
        final decoded = rawContent
            .replaceAll(r'\n', '\n')
            .replaceAll(r'\t', ' ')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&amp;', '&');

        initialContent.value = decoded;
      } else {
        Get.snackbar("Lỗi", "Không thể tải hợp đồng!");
      }

    } catch (e) {
      Get.snackbar("Lỗi", e.toString());
    }

    isLoading.value = false;
  }

  /// 💾 Lưu hợp đồng sau khi chỉnh sửa
  Future<void> luuHopDong() async {
    isSaving.value = true;
    final html = await htmlController.getText();

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    try {
      final res = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.saveHopDongNhaXe,
          "method": "POST",
          "params": {
            "nid": nhaXeId,
            "noi_dung_hop_dong": html,
            "token": token,
            "created_email": email,
          },
        }),
      );

      final data = jsonDecode(res.body);
      if (data["success"] == true) {
        Get.snackbar(
          "✅ Thành công",
          "Đã lưu nội dung hợp đồng!",
          backgroundColor: Colors.green.shade50,
          colorText: Colors.green.shade800,
          snackPosition: SnackPosition.BOTTOM,
          margin: const EdgeInsets.all(12),
          duration: const Duration(seconds: 3),
        );
      } else {
        Get.snackbar(
          "❌ Lỗi",
          data["content"] ?? "Không thể lưu hợp đồng!",
          backgroundColor: Colors.red.shade50,
          colorText: Colors.red.shade800,
          snackPosition: SnackPosition.BOTTOM,
          margin: const EdgeInsets.all(12),
          duration: const Duration(seconds: 4),
        );
      }
    } catch (e) {
      Get.snackbar(
        "❌ Lỗi hệ thống",
        e.toString(),
        backgroundColor: Colors.red.shade50,
        colorText: Colors.red.shade800,
        snackPosition: SnackPosition.BOTTOM,
        margin: const EdgeInsets.all(12),
        duration: const Duration(seconds: 4),
      );
    }

    isSaving.value = false;
  }

  /// 🖨️ In hợp đồng → gọi API sinh PDF
  Future<void> inHopDong(int nidNhaXe) async {
    try {
      Get.dialog(const Center(child: CircularProgressIndicator()),
          barrierDismissible: false);

      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();
      final htmlContent = await htmlController.getText();

      // 🧩 1️⃣ Gọi API tạo file PDF
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.printHopDongNhaXe,
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            "nid": nidNhaXe,
            "noi_dung": htmlContent,
          },
        }),
      );

      Get.back();
      final res = jsonDecode(response.body);

      if (res["success"] != true || res["pdf_url"] == null) {
        throw Exception(res["message"] ?? "Không thể tạo hợp đồng");
      }

      final pdfUrl = res["pdf_url"].toString();

      // 🧩 2️⃣ Tải file PDF qua Worker (tránh CORS)
      final pdfResponse = await http.post(
        Uri.parse(AuthService.workerUrlGetFile),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": pdfUrl,
          "method": "GET",
        }),
      );

      if (pdfResponse.statusCode != 200) {
        throw Exception("Không thể tải PDF (HTTP ${pdfResponse.statusCode})");
      }

      final pdfBytes = pdfResponse.bodyBytes;

      // 🧩 3️⃣ Tạo blob PDF
      final blob = html.Blob([pdfBytes], 'application/pdf');
      final blobUrl = html.Url.createObjectUrlFromBlob(blob);

      // 🧩 4️⃣ Tạo iframe ẩn chứa PDF
      final iframe = html.IFrameElement()
        ..src = blobUrl
        ..style.border = 'none'
        ..style.width = '0'
        ..style.height = '0';

      html.document.body?.append(iframe);

      // 🧩 5️⃣ Khi iframe load, chèn script JS gọi print()
      iframe.onLoad.listen((_) {
        // chèn script trực tiếp vào document
        final script = html.ScriptElement()
          ..text = 'window.frames[window.frames.length - 1].print();';

        html.document.body?.append(script);

        // Xóa script & iframe sau vài giây
        Future.delayed(const Duration(seconds: 5), () {
          // script.remove();
          // iframe.remove();
          html.Url.revokeObjectUrl(blobUrl);
        });
      });

      Get.snackbar(
        "✅ Thành công",
        "Đã gửi lệnh in hợp đồng cá nhân.",
        backgroundColor: Colors.green.shade50,
        colorText: Colors.green.shade900,
      );
    } catch (e) {
      Get.back();
      Get.snackbar("❌ Lỗi in hợp đồng", e.toString(),
          backgroundColor: Colors.red.shade700, colorText: Colors.white);
    }
  }
}

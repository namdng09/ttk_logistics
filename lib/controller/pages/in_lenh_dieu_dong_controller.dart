import 'dart:core';
import 'dart:html' as html;
import 'dart:convert';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/storage/local_storage.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:html_editor_enhanced/html_editor.dart';
import 'package:http/http.dart' as http;
import 'package:printing/printing.dart';

class InLenhDieuDongController extends GetxController {
  final HtmlEditorController htmlController = HtmlEditorController();
  var noiDung = ''.obs;
  var isSaving = false.obs;
  var isLoading = false.obs;
  /// 🧩 Hàm lưu lệnh điều động
  Future<bool> luuLenhDieuDongTheoChuyenXe(int nidChuyenXe) async {
    print('luuLenhDieuDongTheoChuyenXe ${luuLenhDieuDongTheoChuyenXe}');
    if (isSaving.value) return false;
    isSaving.value = true;

    try {
      final htmlContent = await htmlController.getText();
      if (htmlContent
          .trim()
          .isEmpty) {
        Get.snackbar("⚠️ Thiếu nội dung", "Vui lòng nhập nội dung.");
        isSaving.value = false;
        return false;
      }

      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.saveLenhDieuDong, // API Drupal
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            "nid_chuyen_xe": nidChuyenXe,
            "noi_dung": htmlContent,
          },
        }),
      );

      final res = jsonDecode(response.body);

      if (res["success"] == true) {
        Get.snackbar("✅ Thành công", res["message"] ?? "Đã lưu nội dung điều động.",
            backgroundColor: Colors.green.shade100,
            colorText: Colors.green.shade900);
        return true;
      } else {
        Get.snackbar("⚠️ Thất bại",
            res["message"] ?? "Không thể lưu nội dung lệnh điều động.",
            backgroundColor: Colors.orange.shade100,
            colorText: Colors.orange.shade900);
        return false;
      }
    } catch (e) {
      Get.snackbar("❌ Lỗi", e.toString(),
          backgroundColor: Colors.red.shade700, colorText: Colors.white);
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  Future<void> inLenhDieuDong(int nidChuyenXe) async {
    print('in lenh dieu dong nid chuyen xe ${nidChuyenXe}');
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
          "url": AuthService.inLenhDieuDong,
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            "nid_chuyen_xe": nidChuyenXe,
            "noi_dung": htmlContent,
          },
        }),
      );

      Get.back();
      final res = jsonDecode(response.body);

      if (res["success"] != true || res["pdf_url"] == null) {
        throw Exception(res["message"] ?? "Không thể tạo lệnh điều động");
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
        "Đã gửi lệnh in lệnh điều động cá nhân.",
        backgroundColor: Colors.green.shade50,
        colorText: Colors.green.shade900,
      );
    } catch (e) {
      Get.back();
      Get.snackbar("❌ Lỗi in lệnh điều động", e.toString(),
          backgroundColor: Colors.red.shade700, colorText: Colors.white);
    }
  }

}

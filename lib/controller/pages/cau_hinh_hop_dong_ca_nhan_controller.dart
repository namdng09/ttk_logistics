import 'dart:core';
import 'dart:html' as html;
import 'dart:convert';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:html_editor_enhanced/html_editor.dart';
import 'package:http/http.dart' as http;

class CauHinhHopDongCaNhanController extends GetxController {
  final HtmlEditorController htmlController = HtmlEditorController();
  var noiDung = ''.obs;
  var isSaving = false.obs;
  var isLoading = false.obs;

  Future<void> luuHopDong({type = 'hopDongCaNhan'}) async {
    if (isSaving.value) return;
    isSaving.value = true;

    try {
      final htmlContent = await htmlController.getText();
      noiDung.value = htmlContent;

      // 🧩 Lấy thông tin đăng nhập
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      // 🧩 Dữ liệu cần lưu
      final cleanedData = {
        "title": "Cấu hình biểu mẫu ",
        "noi_dung_html": htmlContent,
        "created_email": email,
        "token": token,
        "type": type
      };

      // 🧩 Gọi API qua Cloudflare Worker để tránh CORS
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateCauHinh,
          "method": "POST",
          "params": cleanedData,
        }),
      );

      final data = jsonDecode(response.body);

      if (data["success"] == true) {
        Get.snackbar(
          "✅ Thành công",
          "Đã lưu nội dung biểu mẫu .",
          backgroundColor: const Color(0xFFD6F5D6),
          colorText: const Color(0xFF145A32),
        );
      } else {
        Get.snackbar(
          "⚠️ Thất bại",
          "Không thể lưu biểu mẫu: ${data["content"] ?? "Lỗi không xác định."}",
          backgroundColor: const Color(0xFFFFE8E8),
          colorText: const Color(0xFFB71C1C),
        );
      }
    } catch (e) {
      Get.snackbar(
        "❌ Lỗi",
        "Không thể kết nối đến máy chủ: $e",
        backgroundColor: const Color(0xFFFFE8E8),
        colorText: const Color(0xFFB71C1C),
      );
    } finally {
      isSaving.value = false;
    }
  }

  /// 🧩 Tải nội dung mẫu khi khởi tạo form
  Future<void> taiNoiDungMau({type = 'hopDongCaNhan'}) async {
    isLoading.value = true;
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.loadCauHinh,
          "method": "POST",
          "params": {
            "created_email": email,
            "token": token,
            'type': type,
          },
        }),
      );

      final data = jsonDecode(response.body);
      String content = "";

      if (data["success"] == true && data["noi_dung_html"] != null) {
        content = data["noi_dung_html"];
      } else {
        content = "<p>Điền nội dung mẫu ở đây...</p>";
      }

      // ✅ Đợi HtmlEditor khởi tạo trước khi setText
      Future.delayed(const Duration(milliseconds: 600), () async {
        try {
          htmlController.setText(content);
          noiDung.value = content;
        } catch (e) {
        }
      });
    } catch (e) {
      const fallback = "<p>Điền nội dung mẫu ở đây...</p>";
      Future.delayed(const Duration(milliseconds: 600), () async {
        htmlController.setText(fallback);
        noiDung.value = fallback;
      });
      Get.snackbar("⚠️ Lỗi tải dữ liệu", "Không thể tải nội dung mẫu: $e");
    } finally {
      isLoading.value = false;
      update();
    }
  }

  /// 🧩 Hàm lưu hợp đồng
  Future<bool> luuHopDongCaNhan(int nidChuyenXe) async {
    if (isSaving.value) return false;
    isSaving.value = true;

    try {
      final htmlContent = await htmlController.getText();
      if (htmlContent
          .trim()
          .isEmpty) {
        Get.snackbar("⚠️ Thiếu nội dung", "Vui lòng nhập nội dung hợp đồng.");
        isSaving.value = false;
        return false;
      }

      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.saveHopDongCaNhan, // API Drupal
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
        Get.snackbar("✅ Thành công", res["message"] ?? "Đã lưu hợp đồng.",
            backgroundColor: Colors.green.shade100,
            colorText: Colors.green.shade900);
        return true;
      } else {
        Get.snackbar("⚠️ Thất bại",
            res["message"] ?? "Không thể lưu nội dung hợp đồng.",
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

  /// 🖨️ Hàm in hợp đồng
  // Future<void> inHopDongCaNhan(int nidChuyenXe) async {
  //   try {
  //     Get.dialog(const Center(child: CircularProgressIndicator()),
  //         barrierDismissible: false);
  //
  //     final token = await LocalStorage.getUserToken();
  //     final email = await LocalStorage.getUserEmail();
  //     final htmlContent = await htmlController.getText();
  //
  //     final response = await http.post(
  //       Uri.parse(AuthService.workerUrl),
  //       headers: {"Content-Type": "application/json"},
  //       body: jsonEncode({
  //         "url": AuthService.inHopDongCaNhan,
  //         // → /api/chuyen-xe/in-hop-dong-ca-nhan
  //         "method": "POST",
  //         "params": {
  //           "token": token,
  //           "created_email": email,
  //           "nid_chuyen_xe": nidChuyenXe,
  //           "noi_dung": htmlContent,
  //         },
  //       }),
  //     );
  //
  //     Get.back();
  //
  //     final res = jsonDecode(response.body);
  //     if (res["success"] == true && res["pdf_url"] != null) {
  //       final pdfUrl = res["pdf_url"];
  //       // Mở file PDF trong trình duyệt (Flutter Web)
  //       html.window.open(pdfUrl, '_blank');
  //     } else {
  //       throw Exception(res["message"] ?? "Không thể in hợp đồng");
  //     }
  //   } catch (e) {
  //     Get.back();
  //     Get.snackbar("❌ Lỗi in hợp đồng", e.toString(),
  //         backgroundColor: Colors.red.shade700, colorText: Colors.white);
  //   }
  // }

  // Future<void> inHopDongCaNhan(int nidChuyenXe) async {
  //   try {
  //     // 🌀 Hiển thị spinner khi đang xử lý
  //     Get.dialog(
  //       const Center(child: CircularProgressIndicator()),
  //       barrierDismissible: false,
  //     );
  //
  //     // 🧩 1️⃣ Lấy token, email và nội dung HTML
  //     final token = await LocalStorage.getUserToken();
  //     final email = await LocalStorage.getUserEmail();
  //     final htmlContent = await htmlController.getText();
  //
  //     // 🧩 2️⃣ Gọi API sinh PDF
  //     final response = await http.post(
  //       Uri.parse(AuthService.workerUrl),
  //       headers: {"Content-Type": "application/json"},
  //       body: jsonEncode({
  //         "url": AuthService.inHopDongCaNhan, // /api/chuyen-xe/in-hop-dong-ca-nhan
  //         "method": "POST",
  //         "params": {
  //           "token": token,
  //           "created_email": email,
  //           "nid_chuyen_xe": nidChuyenXe,
  //           "noi_dung": htmlContent,
  //         },
  //       }),
  //     );
  //
  //     Get.back(); // đóng loading
  //
  //     final res = jsonDecode(response.body);
  //
  //     // 🧩 3️⃣ Nếu sinh PDF thành công
  //     if (res["success"] == true && res["pdf_url"] != null) {
  //       final pdfUrl = res["pdf_url"].toString();
  //
  //       // 🧩 2️⃣ Tải file PDF qua Cloudflare Worker để tránh lỗi CORS
  //       final pdfResponse = await http.post(
  //         Uri.parse(AuthService.workerUrlGetFile),
  //         headers: {"Content-Type": "application/json"},
  //         body: jsonEncode({
  //           "url": pdfUrl, // chính là URL PDF Drupal
  //           "method": "POST",
  //         }),
  //       );
  //
  //       final pdfBytes = pdfResponse.bodyBytes;
  //
  //       // 🧩 5️⃣ Mở hộp thoại in trực tiếp
  //       await Printing.layoutPdf(
  //         onLayout: (format) async => pdfBytes,
  //         name: 'hop_dong_ca_nhan.pdf',
  //       );
  //
  //       Get.snackbar(
  //         "✅ Thành công",
  //         "Đã mở hộp thoại in hợp đồng cá nhân.",
  //         backgroundColor: Colors.green.shade50,
  //         colorText: Colors.green.shade900,
  //       );
  //     } else {
  //       throw Exception(res["message"] ?? "Không thể in hợp đồng");
  //     }
  //   } catch (e) {
  //     Get.back();
  //     print('e.toString() ${e.toString()}');
  //     Get.snackbar(
  //       "❌ Lỗi in hợp đồng",
  //       e.toString(),
  //       backgroundColor: Colors.red.shade700,
  //       colorText: Colors.white,
  //     );
  //   }
  // }

  Future<void> inHopDongCaNhan(int nidChuyenXe) async {
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
          "url": AuthService.inHopDongCaNhan,
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

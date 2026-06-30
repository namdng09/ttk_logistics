import 'dart:convert';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/chi_tiet_chuyen_xe_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/form_sua_chuyen_xe_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/in_hop_dong_ca_nhan_screen.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/in_lenh_dieu_dong_screen.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';

import '../../helper/widgets/xe_dialog_helper.dart';

enum ChuyenXeViewMode {
  view, // 👁️ Xem chi tiết chuyến xe
  edit, // ✏️ Sửa thông tin chuyến xe
}
class ChuyenXeController extends GetxController {
  List<Map<String, dynamic>> chuyenXeList = [];
  List<Map<String, dynamic>> khachHangList = [];
  final RxBool isLoadingXeNha = false.obs;
  final RxBool isLoadingXeNgoai = false.obs;
  final isUpdating = false.obs;
  final RxString? highlightedRowId = RxString("");
  bool isSaving = false;
  bool needReload = false;

  bool isLoading = false;

  // ✅ Thông tin phân trang
  int currentPage = 1;
  int totalPages = 1;
  int totalItems = 0;
  final int limit = 20;
  bool isUpdatingStatus = false;

  // 🔹 Biến lưu chuyến xe hiện tại khi xem chi tiết
  Map<String, dynamic>? currentChuyenXe;

  /// ✅ Load danh sách chuyến xe (phân trang)
  Future<void> fetchChuyenXeList({int page = 1}) async {
// print('AuthService.getChuyenXeList ${AuthService.getChuyenXeList}'); // TODO: remove debug

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    try {
      isLoading = true;
      update();
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getChuyenXeList,
          "method": "POST",
          "params": {
            "page": page,
            "limit": limit,

            "token": token,
            "created_email": email,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);

        if (res["success"] == true && res["content"] != null) {
          final content = res["content"];
          final data = content["data"] ?? [];
          final pagination = content["pagination"] ?? {};
          chuyenXeList = List<Map<String, dynamic>>.from(data);

          // Lưu thông tin phân trang
          currentPage = pagination["page"] ?? 1;
          totalPages = pagination["total_pages"] ?? 1;
          totalItems = int.tryParse(pagination["total"].toString()) ?? data.length;
        } else {
          throw Exception("Dữ liệu chuyến xe không hợp lệ");
        }
      } else {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi fetchChuyenXeList: $e");
      AppToast.error(e.toString());
    } finally {
      isLoading = false;
      update();
    }
  }

  /// ✅ Xuất Excel (theo bộ lọc hoặc trang hiện tại)
  Future<void> exportExcel({
    String? ngayVC,
    String? tuyen,
    String? khachHang,
  }) async {
    try {
      Get.snackbar(
        "Đang xử lý",
        "Đang xuất dữ liệu Excel...",
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.blueGrey.shade700,
        colorText: Colors.white,
      );

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.exportChuyenXeExcel,
          "method": "POST",
          "params": {
            "ngay": ngayVC ?? "",
            "tuyen": tuyen ?? "",
            "khach_hang": khachHang ?? "",
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res["success"] == true && res["file_url"] != null) {
          Get.snackbar(
            "✅ Thành công",
            "Tải file Excel tại: ${res['file_url']}",
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green.shade700,
            colorText: Colors.white,
            duration: const Duration(seconds: 5),
          );
        } else {
          throw Exception(res["message"] ?? "Không thể tạo file Excel");
        }
      } else {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi exportExcel: $e");
      Get.snackbar(
        "Lỗi xuất Excel",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade700,
        colorText: Colors.white,
      );
    }
  }

  /// ✅ Chuyển trang (next/prev)
  Future<void> changePage(int newPage) async {
    if (newPage < 1 || newPage > totalPages) return;
    await fetchChuyenXeList(page: newPage);
  }

  Future<void> updateTrangThai(int nid, String newStatus) async {
    try {
      isUpdatingStatus = true;
      update();
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

// print('AuthService.updateTrangThaiChuyenXe ${AuthService.updateTrangThaiChuyenXe}'); // TODO: remove debug
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateTrangThaiChuyenXe,
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            "nid": nid,
            "trang_thai": newStatus,
          },
        }),
      );

      final res = jsonDecode(response.body);

      if (response.statusCode == 200 && res["success"] == true) {
        // ✅ Tìm chuyến xe trong danh sách hiện có
        final index = chuyenXeList.indexWhere((item) =>
        int.tryParse(item["nid"].toString()) == nid);

        if (index != -1) {
          final current = chuyenXeList[index];

          // ✅ Cập nhật trạng thái mới
          current["field_trang_thai"] = newStatus;

          // ✅ Cập nhật lịch sử trong JSON (nếu có)
          Map<String, dynamic> thongTin = {};
          final raw = current["field_thong_tin_json"];

          if (raw is Map) {
            thongTin = Map<String, dynamic>.from(raw);
          } else if (raw is String) {
            thongTin = jsonDecode(raw);
          }


          // ✅ Gán lại JSON mới
          current["field_thong_tin_json"] = thongTin;

          // ✅ Ghi đè lại phần tử trong danh sách
          chuyenXeList[index] = current;
        }

        AppToast.success("Đã chuyển trạng thái chuyến xe sang [$newStatus]");
        update(); // chỉ refresh UI, không gọi API nữa
      } else {
        throw Exception(res["message"] ?? "Cập nhật trạng thái thất bại");
      }
    } catch (e) {
      Get.snackbar(
        "Lỗi cập nhật",
        e.toString(),
        backgroundColor: Colors.red.shade700,
        colorText: Colors.white,
      );
    } finally {
      isUpdatingStatus = false;
      update();
    }
  }

  Future<void> showDialogXacNhanTrangThai(
      BuildContext context,
      int id,
      String title, {
        required String newStatus,
        required String question,
        required String buttonLabel,
        required IconData icon,
        required Color color,
      }) async {
    bool isSubmitting = false;

    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              title: Text(
                "Xác nhận $newStatus chuyến xe",
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              content: Text(
                question,
                style: const TextStyle(fontSize: 15),
              ),
              actionsAlignment: MainAxisAlignment.end,
              actions: [
                TextButton(
                  onPressed: isSubmitting ? null : () => Navigator.pop(ctx, false),
                  child: const Text("Thoát"),
                ),
                ElevatedButton.icon(
                  icon: isSubmitting
                      ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                      : Icon(icon, color: Colors.white, size: 18),
                  label: Text(
                    isSubmitting ? "Đang xử lý..." : buttonLabel,
                    style: const TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: color,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  ),
                  onPressed: isSubmitting
                      ? null
                      : () async {
                    setState(() => isSubmitting = true);
                    await updateTrangThai(id, newStatus);
                    setState(() => isSubmitting = false);
                    if (context.mounted) Navigator.pop(ctx, true);
                  },
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> viewDetail(
      int id, {
        ChuyenXeViewMode mode = ChuyenXeViewMode.view,
      })
  async {
    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    // ===============================
    // 🌀 LOADING
    // ===============================
    Get.dialog(
      const Center(
        child: CircularProgressIndicator(color: Colors.white),
      ),
      barrierDismissible: false,
      barrierColor: Colors.black54,
    );

// print('AuthService.getChuyenXeDetail ${AuthService.getChuyenXeDetail}'); // TODO: remove debug
// print('nid view detail $id'); // TODO: remove debug
    try {
      // ===============================
      // 🧩 CALL API
      // ===============================
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getChuyenXeDetail,
          "method": "POST",
          "params": {
            "nid": id,
            "token": token,
            "created_email": email,
          },
        }),
      );

      Get.back(); // đóng loading

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }

      final res = jsonDecode(response.body);
      if (res["success"] != true || res["content"] == null) {
        throw Exception("Không tìm thấy dữ liệu chuyến xe");
      }

      final chuyenXeData = Map<String, dynamic>.from(res["content"]);

      // ===============================
      // 🧩 CONTROLLER DÙNG CHUNG
      // ===============================
      ChuyenXeController targetController;

      final tag = (mode == ChuyenXeViewMode.edit)
          ? 'form-sua-chuyen-xe'
          : 'chi-tiet-chuyen-xe';

      if (!Get.isRegistered<ChuyenXeController>(tag: tag)) {
        targetController = Get.put(ChuyenXeController(), tag: tag);
      } else {
        targetController = Get.find<ChuyenXeController>(tag: tag);
      }

      // ===============================
      // 🧩 GÁN DATA
      // ===============================
      targetController.currentChuyenXe = chuyenXeData;
      targetController.update();

      // ===============================
      // 🧭 ĐIỀU HƯỚNG
      // ===============================
      if (mode == ChuyenXeViewMode.view) {
        Get.to(() => const ChiTietChuyenXeScreen(), arguments: {"nid": id});
      } else {
        // 👉 dialog full màn hình để sửa
        await Get.dialog(
          const FormSuaChuyenXeScreen(),
          barrierDismissible: false,
        );

        // final result = await Get.dialog(
        //   const FormSuaChuyenXeScreen(),
        //   barrierDismissible: false,
        // );

        // if (result == true) {
        //   // reload danh sách chuyến xe
        //   // fetchChuyenXeList(page: 1);
        // }
      }
    } catch (e) {
      Get.back(); // đảm bảo đóng loading nếu lỗi sớm
      debugPrint("⚠️ viewDetail error: $e");
      Get.snackbar(
        "Lỗi tải chuyến xe",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade700,
        colorText: Colors.white,
      );
    }
  }

  void clearCurrentChuyenXe() {
    currentChuyenXe = null;
    update();
  }
  Future<void> capNhatChuyenXe({
    Map<String, dynamic>? chiPhiForm,   // 🟢 nhận thêm
  }) async {

    if (currentChuyenXe == null) {
      AppToast.warning("Không tìm thấy thông tin chuyến xe hiện tại.");
      return;
    }

// print('AuthService.updateChuyenXe ${AuthService.updateChuyenXe}'); // TODO: remove debug
    try {
      isUpdating.value = true; // ✅ Hiển thị spinner “Đang lưu...”

      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();
//
//       // ==========================================================
//       // 🧩 1️⃣ Chuẩn bị dữ liệu cập nhật
//       // ==========================================================
//       final thongTinJson = Map<String, dynamic>.from(currentChuyenXe!["thong_tin_json"] ?? {});
// //controller.currentChuyenXe?["thong_tin_json"]?["phi_hai_quan_chi_tiet"]
//       print('controller.currentChuyenXe?["thong_tin_json"]?["phi_hai_quan_chi_tiet"] ${currentChuyenXe?["thong_tin_json"]?["phi_hai_quan_chi_tiet"]}');
//
//       // ✅ Đồng bộ xe mới
//       if (currentChuyenXe!["thong_tin_json"]?["xe_nha"] != null) {
//         thongTinJson["xe_nha"] = currentChuyenXe!["thong_tin_json"]["xe_nha"];
//         thongTinJson["xe_ngoai"] = null;
//       } else if (currentChuyenXe!["thong_tin_json"]?["xe_ngoai"] != null) {
//         thongTinJson["xe_ngoai"] = currentChuyenXe!["thong_tin_json"]["xe_ngoai"];
//         thongTinJson["xe_nha"] = null;
//       }
//
//       // ==========================================================
//       // 🧩 2️⃣ Xử lý dịch vụ & chi phí
//       // ==========================================================
//       Map<String, dynamic> dichVu = {};
//       if (thongTinJson["dich_vu"] is Map) {
//         dichVu = Map<String, dynamic>.from(thongTinJson["dich_vu"]);
//       }
//
//       bool toBool(dynamic v) =>
//           v == true ||
//               v == "true" ||
//               v == 1 ||
//               v == "1" ||
//               v.toString().toLowerCase() == "yes";
//
//       dichVu = {
//         "bao_hiem": toBool(dichVu["bao_hiem"]),
//         "cuoc_xe": toBool(dichVu["cuoc_xe"]),
//         "hai_quan": toBool(dichVu["hai_quan"]),
//         "qua_tai": toBool(dichVu["qua_tai"]),
//         "hang_thuong": toBool(dichVu["hang_thuong"]),
//       };
//       thongTinJson["dich_vu"] = dichVu;
//
//       double _toDouble(dynamic val) {
//         if (val == null) return 0;
//         return double.tryParse(val.toString().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0;
//       }
//
//       final phiCuocXe = dichVu['cuoc_xe'] ? _toDouble(thongTinJson["phi_cuoc_xe"]) : 0;
//       final phiBaoHiem = dichVu['bao_hiem'] ? _toDouble(thongTinJson["phi_bao_hiem"]) : 0;
//       final phiHaiQuan = dichVu['hai_quan'] ? _toDouble(thongTinJson["phi_hai_quan"]) : 0;
//       final phiLuuCa = _toDouble(thongTinJson["phi_luu_ca"]);
//       final phiQuaTai = dichVu['qua_tai'] ? _toDouble(thongTinJson["phi_qua_kho_qua_tai"]) : 0;
//       final traThemDiem = thongTinJson["tra_them_diem"] ?? [];
//       final chiPhiKhac = thongTinJson["chi_phi_khac"] ?? [];
//
//       final tongPhi = phiCuocXe +
//           phiBaoHiem +
//           phiHaiQuan +
//           phiLuuCa +
//           phiQuaTai +
//           _sumListMoney(chiPhiKhac) +
//           _sumListMoney(traThemDiem);
//
//       thongTinJson["tong_phi"] = tongPhi;
//
//       Map<String, dynamic>? khachHang;
//       if (khachHangList != null &&
//           khachHangList.isNotEmpty &&
//           khachHangIdFinal != null) {
//         final khMatch = khachHangList.firstWhereOrNull(
//               (e) => e["nid"].toString() == khachHangIdFinal,
//         );
//         if (khMatch != null) {
//           khachHang = {
//             "nid": khMatch["nid"],
//             "ten_khach_hang":
//             khMatch["ten_khach_hang"] ?? khMatch["title"],
//             "dien_thoai": khMatch["dien_thoai"] ?? "",
//             "email": khMatch["email"] ?? "",
//           };
//           thongTinJson["khach_hang_id"] = khachHangIdFinal;
//         }
//       } else {
//         khachHang = currentChuyenXe?["khach_hang"];
//       }
//
//       // ==========================================================
//       // 🧩 3.5️⃣ Xóa dữ liệu chi tiết nếu dịch vụ bị tắt
//       // ==========================================================
//       if (dichVu["hai_quan"] == false) {
//         thongTinJson["phi_hai_quan_chi_tiet"] = null;
//       }
//       if (dichVu["bao_hiem"] == false) {
//         thongTinJson["phi_bao_hiem_chi_tiet"] = null;
//       }
//
//       // ==========================================================
//       // 🧩 4️⃣ Chuẩn hóa payload
//       // ==========================================================
//       currentChuyenXe!["thong_tin_json"] = thongTinJson;
//       print('thongTinJson ${thongTinJson}');
//
//       final payload = {
//         "nid": currentChuyenXe!["nid"],
//         "ma_chuyen_xe": currentChuyenXe!["title"],
//         "trang_thai": currentChuyenXe!["trang_thai"],
//         "ngay_van_chuyen": currentChuyenXe!["ngay_van_chuyen"] ??
//             thongTinJson["ngay_van_chuyen"],
//         "don_hang": currentChuyenXe!["don_hang"],
//         "khach_hang": khachHang,
//         "phuong_tien": currentChuyenXe!["phuong_tien"],
//         "lai_xe": currentChuyenXe!["lai_xe"],
//         "thong_tin_json": {
//           ...thongTinJson,
//           "dich_vu": dichVu,
//           "phi_cuoc_xe": phiCuocXe,
//           "phi_bao_hiem": phiBaoHiem,
//           "phi_hai_quan": phiHaiQuan,
//           "phi_luu_ca": phiLuuCa,
//           "phi_qua_kho_qua_tai": phiQuaTai,
//           "tong_phi": tongPhi,
//           "chi_phi_khac": chiPhiKhac
//         }
//       };
//
//       print('payload ${payload}');

      // debugPrintJson('currentChuyenXe', currentChuyenXe);

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateChuyenXe,
          "method": "POST",
          "params": {
            "token": token,
            "created_email": email,
            "chuyen_xe": currentChuyenXe,
          },
        }),
      );

      final res = jsonDecode(response.body);

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }
      if (res["success"] != true) {
        throw Exception(res["message"] ?? "Không thể cập nhật chuyến xe");
      }
      //
      // // ==========================================================
      // // 🧩 6️⃣ Thành công
      // // ==========================================================
      // // currentChuyenXe = Map<String, dynamic>.from(res["content"] ?? payload);
      update();
      //
      // // ✅ Ẩn spinner
      isUpdating.value = false;
      AppToast.success(res["message"] );
      // // Get.back(result: {
      // //   "status": "success",
      // //   "data": currentChuyenXe,
      // // });
    } catch (e) {
      debugPrint("⚠️ Lỗi capNhatChuyenXe: $e");
      AppToast.error(e.toString());
    } finally {
      isUpdating.value = false;
    }
  }

  void debugPrintJson(String label, dynamic data) {
    const encoder = JsonEncoder.withIndent('  ');
    final prettyJson = encoder.convert(data);
    debugPrint('🔎 $label:\n$prettyJson');
  }

  Future<void> chonXeNha() async {
    final xe = await XeDialogHelper.chonXeNhaAuto(Get.context!);
    if (xe != null) {
      currentChuyenXe!["thong_tin_json"] ??= {};
      currentChuyenXe!["thong_tin_json"]["xe_nha"] = xe;
      currentChuyenXe!["thong_tin_json"]["xe_ngoai"] = null;
      currentChuyenXe!["thong_tin_json"]["bks"] = xe["bks"];
      update();
    }
  }

  Future<void> chonXeNgoai() async {
    final xe = await XeDialogHelper.chonXeNgoaiAuto(Get.context!);
    if (xe != null) {
      currentChuyenXe!["thong_tin_json"] ??= {};
      currentChuyenXe!["thong_tin_json"]["xe_ngoai"] = xe;
      currentChuyenXe!["thong_tin_json"]["xe_nha"] = null;
      currentChuyenXe!["thong_tin_json"]["bks"] = xe["bks"];
      update();
    }
  }

  Future<void> openHopDongCaNhanView(Map<String, dynamic> chuyenXe) async {
    try {
      // 🌀 Hiển thị loading
      Get.dialog(
        const Center(child: CircularProgressIndicator()),
        barrierDismissible: false,
      );

      // 🧩 Lấy token và email
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();
      final chuyenXeNid = int.tryParse(chuyenXe["nid"].toString()) ?? 0;

      if (chuyenXeNid == 0) {
        Get.back();
        AppToast.error("Không tìm thấy mã chuyến xe hợp lệ.");
        return;
      }

      // 🧩 Gọi API qua Cloudflare Worker để tránh CORS
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getHopDongCaNhan, // Drupal API endpoint /api/hop_dong_ca_nhan/get
          "method": "POST",
          "params": {
            "nid": chuyenXeNid,
            "token": token,
            "created_email": email,
          },
        }),
      );

      Get.back(); // Đóng loading

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }

      final res = jsonDecode(response.body);

      if (res["success"] != true) {
        throw Exception(res["message"] ?? "Không thể tải nội dung hợp đồng.");
      }

      final noiDungMau = (res["noi_dung"] ?? "").toString();
      final soHopDong = (res["so_hop_dong"] ?? "").toString();

      // 🔹 Nếu nội dung trống
      if (noiDungMau.isEmpty) {
        AppToast.error("Vui lòng kiểm tra lại mẫu hợp đồng trên hệ thống.");
        return;
      }

      // 🧭 Điều hướng sang màn hình In hợp đồng cá nhân
      Get.to(() => InHopDongCaNhanScreen(
        chuyenXe: {
          ...chuyenXe,
          "so_hop_dong": soHopDong,
        },
        noiDungMau: noiDungMau,
      ));
    } catch (e) {
      Get.back();
      AppToast.error(e.toString());
    }
  }

  Future<void> openLenhDieuDongView(Map<String, dynamic> chuyenXe) async {
    try {
      // 🌀 Hiển thị loading
      Get.dialog(
        const Center(child: CircularProgressIndicator()),
        barrierDismissible: false,
      );

      // 🧩 Lấy token và email
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();
      final chuyenXeNid = int.tryParse(chuyenXe["nid"].toString()) ?? 0;

      if (chuyenXeNid == 0) {
        Get.back();
        Get.snackbar(
          "Thiếu dữ liệu",
          "Không tìm thấy mã chuyến xe hợp lệ.",
          backgroundColor: Colors.orange.shade100,
          colorText: Colors.orange.shade900,
        );
        return;
      }

      // 🧩 Gọi API qua Cloudflare Worker để tránh CORS
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getLenhDieuDong, // Drupal API endpoint /api/hop_dong_ca_nhan/get
          "method": "POST",
          "params": {
            "nid": chuyenXeNid,
            "token": token,
            "created_email": email,
          },
        }),
      );

      Get.back(); // Đóng loading

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }

      final res = jsonDecode(response.body);

      if (res["success"] != true) {
        throw Exception(res["message"] ?? "Không thể tải nội dung hợp đồng.");
      }

      final noiDungMau = (res["noi_dung"] ?? "").toString();
      final soHopDong = (res["so_hop_dong"] ?? "").toString();
// print('noiDungMau $noiDungMau'); // TODO: remove debug

      // 🔹 Nếu nội dung trống
      if (noiDungMau.isEmpty) {
        Get.snackbar(
          "Không có nội dung hợp đồng",
          "Vui lòng kiểm tra lại mẫu hợp đồng trên hệ thống.",
          backgroundColor: Colors.orange.shade100,
          colorText: Colors.orange.shade900,
        );
        return;
      }

      // 🧭 Điều hướng sang màn hình In hợp đồng cá nhân
      Get.to(() => InLenhDieuDongScreen(
        chuyenXe: {
          ...chuyenXe,
          "so_hop_dong": soHopDong,
        },
        noiDungMau: noiDungMau,
      ));
    } catch (e) {
      Get.back();
      Get.snackbar(
        "Lỗi tải hợp đồng",
        e.toString(),
        snackPosition: SnackPosition.BOTTOM,
        backgroundColor: Colors.red.shade700,
        colorText: Colors.white,
      );
    }
  }

  void setPhiBaoHiem(double value) {
    currentChuyenXe!["thong_tin_json"]['chi_phi_ncc']["phi_bao_hiem"] = value;
    update();
  }

  Future<Map<String, dynamic>?> loadKhachHangDetail(String khachHangId) async {
    try {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();
// print('AuthService.getKhachHangDetail ${AuthService.getKhachHangDetail}'); // TODO: remove debug

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getKhachHangDetail, // API chi tiết KH
          "method": "POST",
          "params": {
            "nid": khachHangId,
            "token": token,
            "created_email": email,
          },
        }),
      );

      final res = jsonDecode(response.body);
      if (res["success"] == true && res["content"] != null) {
        return Map<String, dynamic>.from(res["content"]);
      }
    } catch (e) {
      AppToast.error("⚠️ loadKhachHangDetail error: $e");
      debugPrint("⚠️ loadKhachHangDetail error: $e");
    }
    return null;
  }

  /// 🔥 Gọi API lấy thông tin nhà xe / NCC theo xe
  Future<void> fetchThongTinNhaXe({
    required Map<String, dynamic> xe,
    required bool isXeNha,
  }) async {
    try
    {
      final token = await LocalStorage.getUserToken();
      final email = await LocalStorage.getUserEmail();

      isLoading = true;
      update();

      // final String? xeId = xe['id'] ?? xe['nid'];
      // if (xeId == null) return;

      // 🔥 API backend tương ứng
      final String apiUrl = AuthService.getInfoThongTinNhaXe;
// print('AuthService.getInfoThongTinNhaXe ${AuthService.getInfoThongTinNhaXe}'); // TODO: remove debug

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": apiUrl,
          "method": "POST",
          "params": {
            "nid": xe.containsKey('nid_nha_xe') ? xe['nid_nha_xe'] : xe['nid'],
            'token': token,
            'created_email': email,
          },
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res["success"] == true && res["content"] != null) {
          final content = Map<String, dynamic>.from(res["content"]);

          // 🔹 Ghi thẳng vào currentChuyenXe (KHÔNG xử lý nghiệp vụ)
          currentChuyenXe?['field_thong_tin_json_ncc']['field_phi_hai_quan'] = content['field_phi_hai_quan'];
          currentChuyenXe?['field_thong_tin_json_ncc']['field_phi_bao_hiem'] = content['field_phi_bao_hiem'];
          currentChuyenXe?['field_thong_tin_json_ncc']['field_phi_luu_ca'] = content['field_phi_luu_ca'];
          currentChuyenXe?['field_thong_tin_json_ncc']['field_phi_cung_tinh_khac_tuyen'] = content['field_phi_cung_tinh_khac_tuyen'];
          currentChuyenXe?['field_thong_tin_json_ncc']['field_phi_hang_nang'] = content['field_phi_hang_nang'];
          currentChuyenXe?['field_thong_tin_json_ncc']['field_phi_cung_tuyen_khac_tinh'] = content['field_phi_cung_tuyen_khac_tinh'];
          currentChuyenXe?['field_thong_tin_json_ncc']['field_cau_hinh_gio_luu_ca'] = content['field_cau_hinh_gio_luu_ca'];
          currentChuyenXe?['field_cuoc_van_chuyen_nha_cc'] = content['field_cuoc_van_tai'];

        } else {
          throw Exception(res["message"] ?? "Không lấy được thông tin nhà xe");
        }
      } else {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }
    }
    catch (e) {
      debugPrint("⚠️ Lỗi fetchThongTinNhaXe: $e");
      AppToast.error(e.toString());
    }
    finally
    {
      isLoading = false;
      update();
    }
  }
}

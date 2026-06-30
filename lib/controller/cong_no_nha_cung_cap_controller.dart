import 'dart:convert';

import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';
import 'package:ttk_logistics/widgets/dialog_lich_su_thanh_toan_theo_chuyen_xe.dart';
import 'package:ttk_logistics/widgets/dialog_thu_tien_cong_no_ncc.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';

/// ===============================
/// HÌNH THỨC THANH TOÁN
/// ===============================
enum HinhThucThanhToan {
  theoChuyenXe,
  theoTongTien,
}

class CongNoNhaCungCapController extends MyController {
  final TextEditingController keywordController = TextEditingController();
  bool isExporting = false;      // 🔥 load export
  // FILTER STATE
  String keywordKhachHang = "";
  String trangThaiCongNo = "all"; // all | done | pending

  double tongTienCongNo = 0;
  double tongTienDaTra = 0;
  double tongTienConLai = 0;

  bool isLoading = false;
  /// Controller input tiền theo chuyến xe
  final Map<int, TextEditingController> soTienThanhToanCtrls = {};
  /// Khách hàng đang thu tiền công nợ
  int? currentKhachHangNid;
  /// uid người đang đăng nhập
  String? currentUserUid;

  /// ===============================
  /// PHÂN TRANG
  /// ===============================
  int currentPage = 1;
  int totalPages = 1;
  int totalItems = 0;
  final int limit = 20;
  /// Thanh toán theo chuyến xe
  double tongTienKhachThanhToanTheoChuyen = 0;

  /// Thanh toán theo tổng tiền
  double tongTienKhachThanhToanTheoTong = 0;

  /// ===============================
  /// STATE DIALOG THU TIỀN
  /// ===============================
  bool isLoadingThuTien = false;

  List<Map<String, dynamic>> userList = [];
  List<Map<String, dynamic>> chuyenXeChuaThuHet = [];

  double tongTienCanThu = 0;

  /// Form controllers
  final TextEditingController thongTinChuyenKhoanCtrl =
  TextEditingController();

  DateTime ngayThuChi = DateTime.now();
  String? nguoiThucHienId;

  /// ===============================
  /// DATA CÔNG NỢ
  /// ===============================
  List<Map<String, dynamic>> congNoList = [];


  HinhThucThanhToan hinhThucThanhToan = HinhThucThanhToan.theoChuyenXe;

  double tongTienThanhToanTheoChuyen = 0;

  /// ===============================
  /// THANH TOÁN THEO TỔNG TIỀN
  /// ===============================
  final TextEditingController tongTienKhachThanhToanCtrl = TextEditingController();

  List<Map<String, dynamic>> lichSuThanhToanTheoChuyen = [];
  bool isLoadingLichSu = false;

  double get tongTienKhachThanhToan {
    if (hinhThucThanhToan == HinhThucThanhToan.theoChuyenXe) {
      return tongTienKhachThanhToanTheoChuyen;
    }
    return tongTienKhachThanhToanTheoTong;
  }
  @override
  void onClose() {
    keywordController.dispose();
    super.onClose();
  }


  /// ===============================
  /// HÀM CHÍNH – LOAD CÔNG NỢ
  /// ===============================
  Future<void> fetchCongNo({
    int page = 1,
    String? keywordKhachHang,
    String? trangThaiCongNo, // all | done | pending
    bool export = false,
}) async {
    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    try {
      isLoading = true;
      update();

      debugPrint(
        '➡️ AuthService.getCongNoNCC: ${AuthService.getCongNoNCC}',
      );

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getCongNoNCC,
          "method": "POST",
          "params": {
            "page": page,
            "limit": limit,
            "token": token,
            "created_email": email,
          },
        }),
      );

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }

      final res = jsonDecode(response.body);

      if (res["success"] != true || res["content"] == null) {
        throw Exception("Dữ liệu công nợ không hợp lệ");
      }

      final content = res["content"];
      final List data = content["data"] ?? [];
      final pagination = content["pagination"] ?? {};

      /// ===============================
      /// MAP DATA → UI
      /// (API đã xử lý nghiệp vụ)
      /// ===============================
      congNoList = data.map<Map<String, dynamic>>((item) {
        return {
          "nid": item["nid"],
          "khach_hang_nid": item["khach_hang_nid"],
          "ngay_van_chuyen": item["ngay_van_chuyen"],
          "khach_hang": item["khach_hang"],
          "cong_no": item["cong_no"],
          "ma_khach_hang": item["ma_khach_hang"],
          "thoi_han_cong_no": item["thoi_han_cong_no"],
          "tong_tien": item["tong_tien"],
          "da_tra": item["da_tra"],
          "con_lai": item["con_lai"],
        };
      }).toList();

      currentPage = pagination["page"] ?? 1;
      totalPages = pagination["total_pages"] ?? 1;
      totalItems =
          int.tryParse(pagination["total"].toString()) ??
              congNoList.length;
      final summary = content["summary"] ?? {};

      tongTienCongNo =
          double.tryParse(summary["tong_tien_cong_no"]?.toString() ?? "0") ?? 0;

      tongTienDaTra =
          double.tryParse(summary["tong_tien_da_tra"]?.toString() ?? "0") ?? 0;

      tongTienConLai =
          double.tryParse(summary["tong_tien_con_lai"]?.toString() ?? "0") ?? 0;

// print('tongTienCongNo $tongTienCongNo'); // TODO: remove debug
    } catch (e) {
      debugPrint("⚠️ fetchCongNo error: $e");
      AppToast.error(e.toString());
    } finally {
      isLoading = false;
      update();
    }
  }

  Future<void> fetchUserList() async {
// print('AuthService.getUserList ${AuthService.getUserList}'); // TODO: remove debug

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    final response = await http.post(
      Uri.parse(AuthService.workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": AuthService.getUserList,
        "method": "POST",
        "params": {
          "token": token,
          "created_email": email,
        },
      }),
    );

    final res = jsonDecode(response.body);
    if (res["success"] == true) {
      userList = List<Map<String, dynamic>>.from(res["content"] ?? []);
    }
  }

  Future<void> fetchChuyenXeChuaThanhToanHet(int khachHangNid) async {
// print('AuthService.getChuyenXeChuaThanhToanNCC ${AuthService.getChuyenXeChuaThanhToanNCC}'); // TODO: remove debug

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

// print('khachHangNid $khachHangNid'); // TODO: remove debug
    final response = await http.post(
      Uri.parse(AuthService.workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": AuthService.getChuyenXeChuaThanhToanNCC,
        "method": "POST",
        "params": {
          "khach_hang_nid": khachHangNid,
          "token": token,
          "created_email": email,
        },
      }),
    );

    final res = jsonDecode(response.body);

    if (res["success"] == true) {
      chuyenXeChuaThuHet = List<Map<String, dynamic>>.from(res["content"]["data"] ?? []);

      tongTienCanThu = double.tryParse(res["content"]["tong_tien"].toString()) ?? 0;
    }
  }

  Future<void> openThuTienDialog({
    required BuildContext context,
    required int khachHangNid,
  }) async {
    isLoadingThuTien = true;
    update();

    /// 🔥 lưu KH đang thao tác
    currentKhachHangNid = khachHangNid;

    /// 🔥 lấy uid người đăng nhập
    currentUserUid = await LocalStorage.getUserID();

// print('currentUserUid $currentUserUid'); // TODO: remove debug
// print('khachHangNid $khachHangNid'); // TODO: remove debug

    await Future.wait([
      fetchUserList(),
      fetchChuyenXeChuaThanhToanHet(khachHangNid),
    ]);

    /// 🔥 set mặc định người thực hiện = user đăng nhập
    if (currentUserUid != null &&
        userList.any((u) => u["uid"].toString() == currentUserUid)) {
      nguoiThucHienId = currentUserUid;
    }

    initThanhToanTheoChuyen();
    isLoadingThuTien = false;
    update();

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => DialogThuTienCongNoNcc(),
    );
  }

  Future<void> viewCongNo(
      BuildContext context,
      int chuyenXeNid,
      ) async {
    await fetchLichSuThanhToanTheoChuyenXe(chuyenXeNid);

    showDialog(
      context: context,
      builder: (_) => DialogLichSuThanhToanTheoChuyenXe(
        chuyenXeNid: chuyenXeNid,
      ),
    );
  }

  void tinhTongTienTheoChuyen() {
    tongTienThanhToanTheoChuyen = 0;

    for (final item in chuyenXeChuaThuHet) {
      final num v =
          num.tryParse(item["so_tien_thanh_toan"]?.toString() ?? "0") ?? 0;
      tongTienThanhToanTheoChuyen += v;
    }

    /// 🔥 LƯU RIÊNG CHO THEO CHUYẾN
    tongTienKhachThanhToanTheoChuyen =
        tongTienThanhToanTheoChuyen.toDouble();

    update();
  }

  void thanhToanDuChoChuyen(int index) {
    final item = chuyenXeChuaThuHet[index];
    final int nid = int.parse(item["nid"].toString());
    final num conLai = item["con_lai"];

    item["so_tien_thanh_toan"] = conLai;

    // 🔥 CẬP NHẬT UI INPUT
    soTienThanhToanCtrls[nid]?.text = conLai.toString();

    tinhTongTienTheoChuyen();
  }

  void initThanhToanTheoChuyen() {
    soTienThanhToanCtrls.clear();

    for (final item in chuyenXeChuaThuHet) {
      final int nid = int.parse(item["nid"].toString());
      soTienThanhToanCtrls[nid] = TextEditingController(
        text: item["so_tien_thanh_toan"]?.toString() ?? "",
      );
    }
  }

  Future<void> submitThuTienCongNo() async {
    if (currentKhachHangNid == null) {
      AppToast.error("Không xác định được khách hàng");
      return;
    }

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    try {
      isLoadingThuTien = true;
      update();

      /// ===============================
      /// BUILD CHI TIẾT THEO HÌNH THỨC
      /// ===============================
      List<Map<String, dynamic>> chiTietChuyenXe = [];

      if (hinhThucThanhToan == HinhThucThanhToan.theoChuyenXe) {
        chiTietChuyenXe = chuyenXeChuaThuHet
            .where((e) =>
        (num.tryParse(e["so_tien_thanh_toan"]?.toString() ?? "0") ??
            0) >
            0)
            .map((e) => {
          "chuyen_xe_nid": e["nid"],
          "so_tien_thu": e["so_tien_thanh_toan"],
        })
            .toList();
      }

      /// ===============================
      /// PAYLOAD
      /// ===============================
      final payload = {
        "khach_hang_nid": currentKhachHangNid, // ✅ LUÔN CÓ
        // "khach_hang_nid": khachHangNid,
        "hinh_thuc_thanh_toan": hinhThucThanhToan.name,
        "tong_tien_khach_thanh_toan": tongTienKhachThanhToan,
        "tong_tien_can_thu": tongTienCanThu,
        "cong_no_con_lai": tongTienCanThu - tongTienKhachThanhToan < 0
            ? 0
            : tongTienCanThu - tongTienKhachThanhToan,
        "ngay_thu_chi": ngayThuChi.toIso8601String(),
        "nguoi_thuc_hien_id": nguoiThucHienId,
        "thong_tin_chuyen_khoan": thongTinChuyenKhoanCtrl.text,
        "chi_tiet_chuyen_xe": chiTietChuyenXe,
        "token": token,
        "created_email": email,
      };

      debugPrint("➡️ API: ${AuthService.luuPhieuThuCongNoNhaCC}");
      debugPrint("➡️ Payload: $payload");

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.luuPhieuThuCongNoNhaCC,
          "method": "POST",
          "params": payload,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }

      final res = jsonDecode(response.body);

      if (res["success"] != true) {
        throw Exception(res["message"] ?? "Lưu phiếu thu thất bại");
      }

      AppToast.success("Thu tiền công nợ thành công");

      /// reload lại danh sách công nợ
      await fetchCongNo(page: currentPage);

      /// đóng dialog
      Get.back();
    } catch (e) {
      debugPrint("⚠️ submitThuTienCongNo error: $e");
      AppToast.error(e.toString());
    } finally {
      isLoadingThuTien = false;
      update();
    }
  }

  Future<void> fetchLichSuThanhToanTheoChuyenXe(
      int chuyenXeNid,
      ) async {
    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    try {
      isLoadingLichSu = true;
      update();

      debugPrint(
        '➡️ API: ${AuthService.getLichSuThanhToanTheoChuyenXe}',
      );

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getLichSuThanhToanTheoChuyenXe,
          "method": "POST",
          "params": {
            "chuyen_xe_nid": chuyenXeNid,
            "token": token,
            "created_email": email,
          },
        }),
      );

      if (response.statusCode != 200) {
        throw Exception("Server lỗi ${response.statusCode}");
      }

// print('response.body xem lich su thanh toan ${response.body}'); // TODO: remove debug

      final res = jsonDecode(response.body);

      if (res["success"] != true) {
        throw Exception("Không có lịch sử thanh toán");
      }

      lichSuThanhToanTheoChuyen =
      List<Map<String, dynamic>>.from(res["content"] ?? []);
    } catch (e) {
      AppToast.error(e.toString());
    } finally {
      isLoadingLichSu = false;
      update();
    }
  }
  Future<void> updateHanCongNo({
    required int chuyenXeNid,
    required DateTime hanCongNoMoi,
  }) async {
    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    try {
      isLoading = true;
      update();

      /// ===============================
      /// PAYLOAD
      /// ===============================
      final payload = {
        "chuyen_xe_nid": chuyenXeNid,
        "thoi_han_cong_no": hanCongNoMoi.toIso8601String(),
        "token": token,
        "created_email": email,
      };

      debugPrint("➡️ API: ${AuthService.updateHanCongNo}");
      debugPrint("➡️ Payload: $payload");

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.updateHanCongNo,
          "method": "POST",
          "params": payload,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception("Server trả về lỗi ${response.statusCode}");
      }

      final res = jsonDecode(response.body);

      if (res["success"] != true) {
        throw Exception(res["message"] ?? "Cập nhật hạn công nợ thất bại");
      }

      AppToast.success("Cập nhật hạn công nợ thành công");

      /// 🔄 reload lại danh sách công nợ
      await fetchCongNo(page: currentPage);

      /// đóng dialog (nếu đang mở)
      if (Get.isDialogOpen == true) {
        Get.back();
      }
    } catch (e) {
      debugPrint("⚠️ updateHanCongNo error: $e");
      AppToast.error(e.toString());
    } finally {
      isLoading = false;
      update();
    }
  }
  Future<void> openUpdateHanCongNoDialog({
    required BuildContext context,
    required int chuyenXeNid,
    dynamic currentHanCongNo,
  }) async {
    DateTime? hanCongNoMoi;
    bool isSubmitting = false;

    /// ===============================
    /// PARSE HẠN HIỆN TẠI (NẾU CÓ)
    /// ===============================
    if (currentHanCongNo != null) {
      final int? ts = int.tryParse(currentHanCongNo.toString());
      if (ts != null && ts > 0) {
        hanCongNoMoi = DateTime.fromMillisecondsSinceEpoch(ts * 1000);
      }
    }

    await Get.dialog(
      StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Text(
              "Cập nhật hạn công nợ",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.event),
                  title: Text(
                    hanCongNoMoi != null
                        ? DateFormat("dd/MM/yyyy").format(hanCongNoMoi!)
                        : "Chọn hạn công nợ mới",
                  ),
                  subtitle: const Text(
                    "Áp dụng cho chuyến xe này",
                    style: TextStyle(fontSize: 12),
                  ),
                  onTap: isSubmitting
                      ? null
                      : () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: hanCongNoMoi ?? DateTime.now(),
                      firstDate: DateTime.now()
                          .subtract(const Duration(days: 365)),
                      lastDate: DateTime.now()
                          .add(const Duration(days: 365 * 5)),
                    );
                    if (picked != null) {
                      setDialogState(() {
                        hanCongNoMoi = picked;
                      });
                    }
                  },
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: isSubmitting ? null : () => Get.back(),
                child: const Text("Hủy"),
              ),
              ElevatedButton(
                onPressed: (hanCongNoMoi == null || isSubmitting)
                    ? null
                    : () async {
                  setDialogState(() => isSubmitting = true);

                  await updateHanCongNo(
                    chuyenXeNid: chuyenXeNid,
                    hanCongNoMoi: hanCongNoMoi!,
                  );

                  // updateHanCongNo sẽ tự Get.back() khi thành công
                  setDialogState(() => isSubmitting = false);
                },
                child: isSubmitting
                    ? const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
                    : const Text("Cập nhật"),
              ),
            ],
          );
        },
      ),
      barrierDismissible: false,
    );
  }
}

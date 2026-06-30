import 'dart:convert';
import 'package:ttk_logistics/controller/pages/chuyen_xe_controller.dart';
import 'package:ttk_logistics/helper/storage/local_storage.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/helper/utils/app_toast.dart';

class FormDonHangController extends GetxController {
  bool isLoadingKhachHangDetail = false;

  final isLoadingXeNgoai = false.obs;
  final isLoadingXeNha = false.obs; // ✅ thêm dòng này cạnh isLoadingXeNgoai

  // -------------------------
  // 🧩 Dữ liệu chính
  // -------------------------
  String? selectedKhachHang;
  List<Map<String, dynamic>> khachHangList = [];
  Map<String, dynamic> thongTinNhaXeNgoai = {};

  // Dropdown options
  List<String> diemDiList = [];
  List<String> diemDenList = [];
  List<String> trongTaiList = [];
  List<Map<String, dynamic>> nhaXeNgoaiList = []; // 📦 Danh sách nhà xe ngoài

  // Danh sách cấu hình cước của khách
  List<dynamic> cuocVanTaiList = [];

  List<Map<String, dynamic>> phuongTienList = [];
  List<Map<String, dynamic>> laiXeList = [];

  // Danh sách xe vận chuyển
  List<Map<String, dynamic>> xeList = [];
  List<dynamic> phiHaiQuanList = []; // 📦 Danh sách phí hải quan của khách hàng

  // Controllers
  TextEditingController tienCuocCtrl = TextEditingController();
  TextEditingController tienBaoHiemCtrl = TextEditingController();
  TextEditingController phiHaiQuanCtrl = TextEditingController();
  TextEditingController tongTienCtrl = TextEditingController();

  final isLoading = false.obs;
  final isSaving = false.obs; // ✅ Trạng thái đang lưu đơn hàng

  // -------------------------
  // 🧩 Khởi tạo
  // -------------------------
  @override
  void onInit() {
    super.onInit();
    loadKhachHang();
    addXe();
  }

  // -------------------------
  // 🧩 Gọi API danh sách khách hàng
  // -------------------------
  Future<void> loadKhachHang() async {
// print('AuthService.getListKhachHang ${AuthService.getListKhachHang}'); // TODO: remove debug
    try {
      isLoading.value = true;
      update();

      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListKhachHang,
          "method": "POST",
          "params": {},
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res["success"] == true && res["content"] is List) {
          khachHangList =
          List<Map<String, dynamic>>.from(res["content"].cast<Map>());
        } else {
          khachHangList = [];
        }
      }
    } catch (e) {
      debugPrint("❌ loadKhachHang error: $e");
    } finally {
      isLoading.value = false;
      update();
    }

  }

  // Future<void> loadThongTinNhaXe(nidNhaXe) async {
  //   print('AuthService.getInfoThongTinNhaXe ${AuthService.getInfoThongTinNhaXe}');
  //   try {
  //     isLoading.value = true;
  //     update();
  //     final token = await LocalStorage.getUserToken();
  //     final email = await LocalStorage.getUserEmail();
  //
  //     final response = await http.post(
  //       Uri.parse(AuthService.workerUrl),
  //       headers: {"Content-Type": "application/json"},
  //       body: jsonEncode({
  //         "url": AuthService.getInfoThongTinNhaXe,
  //         "method": "POST",
  //         "params": {
  //           'nid': nidNhaXe,
  //           'token': token,
  //           'created_email': email,
  //         },
  //       }),
  //     );
  //
  //     if (response.statusCode == 200) {
  //       final res = jsonDecode(response.body);
  //       if (res["success"] == true) {
  //         thongTinNhaXeNgoai = Map<String, dynamic>.from(res["content"]);
  //       } else {
  //         AppToast.warning(res["content"]);
  //       }
  //     }
  //   } catch (e) {
  //     debugPrint("❌ loadKhachHang error: $e");
  //     AppToast.warning("❌ loadKhachHang error: $e");
  //   } finally {
  //     isLoading.value = false;
  //     update();
  //   }
  // }

  Future<void> onKhachHangChanged(String? khachId) async {
    // 🔥 bật loading
    isLoadingKhachHangDetail = true;
    update();

    selectedKhachHang = khachId;

    // Reset danh sách dữ liệu
    diemDiList.clear();
    diemDenList.clear();
    trongTaiList.clear();
    cuocVanTaiList.clear();
    phiHaiQuanList.clear();

    selectedKhachHang = khachId;

    if (khachId == null || khachId.isEmpty) {
      isLoadingKhachHangDetail = false;
      update();
      return;
    }
    if (!Get.isRegistered<ChuyenXeController>()) {
      Get.put(ChuyenXeController());
    }

    final chuyenXeCtrl = Get.find<ChuyenXeController>();
    final Map<String, dynamic>? kh = await chuyenXeCtrl.loadKhachHangDetail(khachId);

    if (kh == null || kh.isEmpty) {
      debugPrint("⚠️ Không lấy được chi tiết KH: $khachId");
      update();
      return;
    }
    final thongTinKH = kh['field_thong_tin_json_khach_hang'];

    if (thongTinKH is! Map) {
      debugPrint("⚠️ field_thong_tin_json_khach_hang không hợp lệ");
      isLoadingKhachHangDetail = false;
      update();
      return;
    }
    // ================= cập nhật lại KH trong list =================
    final index = khachHangList.indexWhere(
          (e) => e["nid"].toString() == khachId,
    );

    if (index == -1) {
      debugPrint("⚠️ KH không tồn tại trong khachHangList");
      isLoadingKhachHangDetail = false;
      update();
      return;
    }

    final Map<String, dynamic> updatedKH =
    Map<String, dynamic>.from(khachHangList[index]);

    updatedKH['field_cuoc_van_tai'] = thongTinKH['field_cuoc_van_tai'];
    updatedKH['field_phi_hai_quan'] =  thongTinKH['field_phi_hai_quan'];
    updatedKH['field_phi_bao_hiem'] = thongTinKH['field_phi_bao_hiem'];
    updatedKH['field_phi_luu_ca'] = thongTinKH['field_phi_luu_ca'];
    updatedKH['field_phi_cung_tinh_khac_tuyen'] = thongTinKH['field_phi_cung_tinh_khac_tuyen'];
    updatedKH['field_phi_cung_tuyen_khac_tinh'] = thongTinKH['field_phi_cung_tuyen_khac_tinh'];
    updatedKH['field_cau_hinh_gio_luu_ca'] = thongTinKH['field_cau_hinh_gio_luu_ca'];

    // 🔥 gán lại vào list (GetX detect được)
    khachHangList[index] = updatedKH;

    // =====================================================
    // 🔸 CƯỚC VẬN TẢI
    // =====================================================
    try {
      dynamic rawCuoc = thongTinKH["field_cuoc_van_tai"];
      List<dynamic> cuocList = [];

      if (rawCuoc is String && rawCuoc.isNotEmpty) {
        final parsed = jsonDecode(rawCuoc);
        if (parsed is List) {
          cuocList = parsed;
        } else if (parsed is Map) cuocList = [parsed];
      } else if (rawCuoc is List) {
        cuocList = rawCuoc;
      }

      if (cuocList.isNotEmpty) {
        cuocVanTaiList = cuocList;

        // Lấy danh sách điểm đi / điểm đến
        diemDiList = cuocList
            .map((e) => e["Điểm đi"]?.toString() ?? "")
            .where((v) => v.isNotEmpty)
            .toSet()
            .toList();

        diemDenList = cuocList
            .map((e) => e["Điểm đến mới"]?.toString() ?? "")
            .where((v) => v.isNotEmpty)
            .toSet()
            .toList();

        // Lấy danh sách trọng tải từ cước vận tải
        final exclude = ["Điểm đi", "Điểm đến cũ", "Điểm đến mới"];
        final allKeys = cuocList
            .expand((map) => map.keys)
            .where((k) => !exclude.contains(k))
            .toSet()
            .toList();

        trongTaiList = allKeys.map((e) => e.toString()).toList();
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi xử lý field_cuoc_van_tai: $e");
    }

    // =====================================================
    // 🔸 PHÍ HẢI QUAN
    // =====================================================
    try {
      dynamic rawHaiQuan = kh['field_thong_tin_json_khach_hang']["field_phi_hai_quan"];
      List<dynamic> haiQuanList = [];

      if (rawHaiQuan is String && rawHaiQuan.isNotEmpty) {
        final parsed = jsonDecode(rawHaiQuan);
        if (parsed is List) {
          haiQuanList = parsed;
        } else if (parsed is Map) haiQuanList = [parsed];
      } else if (rawHaiQuan is List) {
        haiQuanList = rawHaiQuan;
      }

      if (haiQuanList.isNotEmpty) {
        phiHaiQuanList = haiQuanList;
      }
    } catch (e) {
      debugPrint("⚠️ Lỗi xử lý field_phi_hai_quan: $e");
    }

    // =====================================================
    // 🔸 Reset dữ liệu tạm
    // =====================================================
    tienCuocCtrl.text = "0";
    tienBaoHiemCtrl.text = "0";
    phiHaiQuanCtrl.text = "0";
    tongTienCtrl.text = "0";

    for (var xe in xeList) {
      xe["phiCuocXe"] = 0;
      xe["phiBaoHiemChiTiet"] = {};
      xe["phiHaiQuanChiTiet"] = {};
    }
    // 🔥 tắt loading
    isLoadingKhachHangDetail = false;
    update();
  }

  // -------------------------
  // 🧩 Thêm / xoá / nhân bản xe
  // -------------------------
  void addXe() {
    xeList.add({
      "diemDi": null,
      "diemDen": null,
      "trongTai": null,
      "loaiXe": null,
      "xeDaChon": [],
      "baoHiem": false,
      "cuocXe": true,
      "haiQuan": false,
      "hangThuong": true,
      "phiCuocXe": 0.0,
      "soLuong": "1",
      "ngay": "",
    });
    update();
  }

  void duplicateLastXe() {
    if (xeList.isEmpty) return;

    // Lấy bản ghi cuối cùng
    final lastXe = xeList.last;

    // ✅ Tạo bản sao mới
    final copy = Map<String, dynamic>.from(lastXe);

    // ✅ Làm sạch các trường không nên copy nguyên trạng
    copy["xeNha"] = [];
    copy["xeNgoai"] = [];
    copy["phiHaiQuanChiTiet"] = {};
    copy["phiBaoHiemChiTiet"] = {};
    copy["tongBaoHiem"] = 0.0;
    copy["tongHaiQuan"] = 0.0;
    copy["tongTienXe"] = 0.0;

    // ✅ Gán ID tạm để phân biệt
    copy["id"] = DateTime.now().millisecondsSinceEpoch;

    // ✅ Nếu có số lượng → giữ nguyên
    copy["soLuong"] = lastXe["soLuong"] ?? "1";

    // ✅ Tính lại cước vận chuyển cho xe mới
    final diemDi = copy["diemDi"];
    final diemDen = copy["diemDen"];
    final trongTai = copy["trongTai"];
    final soLuong = double.tryParse(copy["soLuong"].toString()) ?? 1;

    if (diemDi != null && diemDen != null && trongTai != null) {
      final matched = cuocVanTaiList.firstWhereOrNull(
              (e) => e["Điểm đi"] == diemDi && e["Điểm đến mới"] == diemDen);

      if (matched != null) {
        final donGia = double.tryParse(matched[trongTai]?.toString() ?? "0") ?? 0.0;
        final thanhTien = donGia * soLuong;
        copy["phiCuocXe"] = thanhTien;
      } else {
        copy["phiCuocXe"] = 0.0;
      }
    } else {
      copy["phiCuocXe"] = 0.0;
    }

    // ✅ Thêm xe mới vào danh sách
    xeList.add(copy);

    // ✅ Cập nhật tổng toàn đơn hàng
    tinhTongTien();

    // ✅ Refresh UI
    update();

    debugPrint("✅ Đã nhân bản xe cuối cùng, tổng số xe hiện tại: ${xeList.length}");
  }
  void removeXe(int index) {
    xeList.removeAt(index);
    tinhTongCuocXe();
    update();
  }
  void onChangeDropdown(int index, {String? diemDi, String? diemDen, String? trongTai}) async {
    final xe = xeList[index];

    if (diemDi != null) xe["diemDi"] = diemDi;
    if (diemDen != null) xe["diemDen"] = diemDen;
    if (trongTai != null) xe["trongTai"] = trongTai;

    // 🔹 Khi thay đổi trọng tải → cập nhật lại phí bảo hiểm
    if (trongTai != null && xe["baoHiem"] == true) {
      updateChiPhiBaoHiemTheoTrongTai(index);
    }

    // 🔹 Khi thay đổi điểm đi hoặc trọng tải → cập nhật lại phí hải quan (nếu có bật)
    if (xe["haiQuan"] == true && (diemDi != null || trongTai != null)) {
      await Future.delayed(const Duration(milliseconds: 50));
      updateChiPhiHaiQuanTheoXe(index);

      // ✅ Reset controller form hải quan để rebuild lại form input
      xe["_controllers"] = <String, TextEditingController>{};
    }

    // 🔹 Tính lại cước xe (nếu đủ dữ liệu)
    tinhCuocXe(index);

    // 🔹 Tính tổng tiền toàn đơn hàng
    tinhTongTien();

    // 🔹 Cập nhật UI
    update();
  }
  final NumberFormat currencyFormat = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: '₫',
    decimalDigits: 0,
  );
  void tinhCuocXe(int index) {
    final xe = xeList[index];
    final diemDi = xe["diemDi"];
    final diemDen = xe["diemDen"];
    final trongTai = xe["trongTai"];
    final soLuong = double.tryParse(
        xe["soLuong"].toString().trim().replaceAll(RegExp(r'[^0-9.]'), '')) ??
        1;

    if (diemDi == null || diemDen == null || trongTai == null) {
      xe["phiCuocXe"] = 0.0;
      tinhTongCuocXe();
      return;
    }

    final matched = cuocVanTaiList.firstWhereOrNull(
            (e) => e["Điểm đi"] == diemDi && e["Điểm đến mới"] == diemDen);

    if (matched != null) {
      final donGia = double.tryParse(matched[trongTai]?.toString() ?? "0") ?? 0.0;
      final thanhTien = donGia * soLuong;

      xe["phiCuocXe"] = thanhTien;
      debugPrint(
          "🚛 [$index] $diemDi → $diemDen ($trongTai): ${donGia.toStringAsFixed(0)} × $soLuong = ${thanhTien.toStringAsFixed(0)}");
    } else {
      xe["phiCuocXe"] = 0.0;
      debugPrint("⚠️ Không tìm thấy cước cho $diemDi → $diemDen ($trongTai)");
    }

    tinhTongCuocXe();
    update();
  }

  void tinhTongCuocXe() {
    double tong = 0.0;
    for (var xe in xeList) {
      if (xe["cuocXe"] == true) {
        tong += double.tryParse(xe["phiCuocXe"].toString()) ?? 0.0;
      }
    }

    tienCuocCtrl.text = currencyFormat.format(tong);
    tinhTongTien(); // ✅ thêm dòng này
    update();
  }

  // -------------------------
  // 🧩 Bật/tắt dịch vụ
  // -------------------------
  void onToggleDichVu(int index, String field, bool value) {
    final item = xeList[index];
    item[field] = value;

    switch (field) {
      case "haiQuan":
        if (value) {
          updateChiPhiHaiQuanTheoXe(index);
        } else {
          // ❌ Bỏ chọn → reset toàn bộ phí hải quan
          item["phiHaiQuanChiTiet"] = {};
          item["tongHaiQuan"] = 0;
        }
        break;

      case "baoHiem":
        if (value) {
// print('phi bao hiem chi tiet ${item["phiBaoHiemChiTiet"]}'); // TODO: remove debug
          // 🔹 Nếu đã có dữ liệu nhập trước → giữ nguyên
          if (item["phiBaoHiemChiTiet"] != null &&
              (item["phiBaoHiemChiTiet"] as Map).isNotEmpty) {
            debugPrint("🔁 Giữ lại dữ liệu bảo hiểm đã nhập cho xe[$index]");
          } else {
            // 🔹 Nếu chưa có → load mới theo trọng tải
            updateChiPhiBaoHiemTheoTrongTai(index);
          }
        } else {
          // ❌ Bỏ chọn → reset
          item["phiBaoHiemChiTiet"] = {};
          item["tongBaoHiem"] = 0;
        }

        // 🔹 Dù bật hay tắt, đều cần tính lại tổng
        tinhTongBaoHiem();
        break;

      case "cuocXe":
        if (!value) {
          // ❌ Bỏ chọn → reset cước xe
          item["phiCuocXe"] = 0;
        } else {
          // ✅ Chọn lại → cập nhật đúng cước theo điểm đi/đến và trọng tải
          tinhCuocXe(index);
        }
        break;

      case "hangThuong":
      // ✅ Chỉ cập nhật lại tổng nếu hàng thường thay đổi
        tinhTongTien();
        break;
    }

    // ✅ Sau mỗi thay đổi, tính lại toàn bộ tổng
    tinhTongTien();
    update();
  }


  /// -------------------------
  /// 🧩 Cập nhật chi phí hải quan theo xe (lọc theo điểm đi + trọng tải)
  /// -------------------------
  void updateChiPhiHaiQuanTheoXe(int index) {
    final xe = xeList[index];
    final diemDi = xe["diemDi"];
    final trongTai = xe["trongTai"];

    if (selectedKhachHang == null || diemDi == null || trongTai == null) {
      xe["phiHaiQuanChiTiet"] = {};
      update();
      return;
    }

    final khachHang = khachHangList.firstWhereOrNull(
          (e) => e["nid"].toString() == selectedKhachHang,
    );

    if (khachHang == null) {
      xe["phiHaiQuanChiTiet"] = {};
      update();
      return;
    }

    dynamic raw = khachHang["field_phi_hai_quan"];
// print('phi hai quan raw $raw'); // TODO: remove debug

    List<dynamic> phiHaiQuanList = [];
    if (raw is String && raw.isNotEmpty) {
      try {
        final parsed = jsonDecode(raw);
        if (parsed is List) {
          phiHaiQuanList = parsed;
        } else if (parsed is Map) phiHaiQuanList = [parsed];
      } catch (e) {
        debugPrint("⚠️ Không parse được field_phi_hai_quan: $e");
      }
    } else if (raw is List) {
      phiHaiQuanList = raw;
    }

    if (phiHaiQuanList.isEmpty) {
      xe["phiHaiQuanChiTiet"] = {};
      update();
      return;
    }

    // 🔍 Lọc phí hải quan theo điểm đi và trọng tải
    Map<String, dynamic> chiTiet = {};
    for (final group in phiHaiQuanList) {
      final cuaKhau = group["Cửa khẩu"]?.toString().trim();
      if (cuaKhau == null || cuaKhau.isEmpty) continue;
      if (cuaKhau == diemDi && group.containsKey(trongTai)) {
        final chiPhi = group["Chi phí"]?.toString() ?? "Không rõ";
        final rawVal = group[trongTai];
        final val = double.tryParse(rawVal.toString()) ?? 0.0;
        chiTiet[chiPhi] = val;
      }
    }

    xe["phiHaiQuanChiTiet"] = chiTiet;
    xe["_controllers"] = <String, TextEditingController>{}; // 🧹 reset để rebuild form
    debugPrint("🔁 Reload phí hải quan cho xe[$index] ($diemDi - $trongTai): ${chiTiet.length} khoản");

    tinhTongHaiQuan();
    update();
  }

  /// -------------------------
  /// 🧩 Tính tổng phí hải quan cho toàn đơn hàng
  /// -------------------------
  void tinhTongHaiQuan() {
    double tong = 0.0;
    for (var xe in xeList) {
      if (xe["haiQuan"] == true && xe["phiHaiQuanChiTiet"] != null) {
        final soLuong = double.tryParse(xe["soLuong"].toString()) ?? 1;
        final chiTiet = Map<String, dynamic>.from(xe["phiHaiQuanChiTiet"]);
        for (final val in chiTiet.values) {
          final num = double.tryParse(val.toString()) ?? 0.0;
          tong += num * soLuong;
        }
      }
    }
    phiHaiQuanCtrl.text = currencyFormat.format(tong);
    tinhTongTien();
    update();
  }

  // -------------------------
  // 🧩 Chọn xe nhà / ngoài
  // -------------------------
  void chonXe(int index, {required String loai}) {
    final xe = {
      "title": loai == "nha" ? "Xe nhà 29H-12345" : "Xe ngoài 30A-88888",
      "bks": loai == "nha" ? "29H-12345" : "30A-88888",
      "laiXe": loai == "nha" ? "Nguyễn Văn A" : "Trần Văn B",
      "sdt": loai == "nha" ? "0909123456" : "0909888888",
    };

    xeList[index]["loaiXe"] = loai;
    xeList[index]["xeDaChon"] = [xe];
    update();
  }

  /// Gọi API lấy danh sách nhà xe ngoài
  Future<void> loadNhaXeNgoai() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListNhaXe, // 👈 endpoint API nhà xe ngoài
          "method": "POST",
          "params": {
            "type": "ngoai"}, // nếu cần phân biệt xe nhà/ngoài
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res["success"] == true && res["content"] is List) {
          nhaXeNgoaiList = List<Map<String, dynamic>>.from(res["content"]);
        }
      }
    } catch (e) {
      debugPrint("⚠️ loadNhaXeNgoai error: $e");
    }
  }

  Future<void> loadPhuongTien() async {
// print('AuthService.getListPhuongTien ${AuthService.getListPhuongTien}'); // TODO: remove debug
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListPhuongTien,
          "method": "POST",
        }),
      );

// print('response.statusCode ${response.statusCode}'); // TODO: remove debug
      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res["success"] == true && res["content"] is List) {
          phuongTienList = List<Map<String, dynamic>>.from(res["content"]);
        }
      }else {
        AppToast.warning(response.body);
      }
    } catch (e) {
      debugPrint("⚠️ loadPhuongTien error: $e");
    }
  }

  Future<void> loadLaiXe() async {
    try {
      final response = await http.post(
        Uri.parse(AuthService.workerUrl),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "url": AuthService.getListLaiXe,
          "method": "POST",
        }),
      );

      if (response.statusCode == 200) {
        final res = jsonDecode(response.body);
        if (res["success"] == true && res["content"] is List) {
          laiXeList = List<Map<String, dynamic>>.from(res["content"]);
        }
      }
    } catch (e) {
      debugPrint("⚠️ loadLaiXe error: $e");
    }
  }
  void updateChiPhiBaoHiemTheoTrongTai(int index) {
    final xe = xeList[index];
// print('xe $xe'); // TODO: remove debug
    final trongTai = xe["trongTai"];
    if (selectedKhachHang == null || trongTai == null || trongTai.toString().isEmpty) {
      xe["phiBaoHiemChiTiet"] = {};
      xe["_controllersBaoHiem"] = <String, TextEditingController>{}; // 🧹 reset form
      update();
      return;
    }

    // 🔹 Tìm khách hàng hiện tại
    final khachHang = khachHangList.firstWhereOrNull(
          (e) => e["nid"].toString() == selectedKhachHang,
    );
    if (khachHang == null) {
      xe["phiBaoHiemChiTiet"] = {};
      xe["_controllersBaoHiem"] = <String, TextEditingController>{};
      update();
      return;
    }

    // 🔹 Lấy dữ liệu field_phi_bao_hiem
    dynamic raw = khachHang["field_phi_bao_hiem"];
    List<dynamic> phiBaoHiemList = [];
    if (raw is String && raw.isNotEmpty) {
      try {
        final parsed = jsonDecode(raw);
        if (parsed is List) {
          phiBaoHiemList = parsed;
        } else if (parsed is Map) phiBaoHiemList = [parsed];
      } catch (e) {
        debugPrint("⚠️ Không parse được field_phi_bao_hiem: $e");
      }
    } else if (raw is List) {
      phiBaoHiemList = raw;
    }

    if (phiBaoHiemList.isEmpty) {
      xe["phiBaoHiemChiTiet"] = {};
      xe["_controllersBaoHiem"] = <String, TextEditingController>{};
      update();
      return;
    }

    // 🔹 Tìm nhóm có trọng tải khớp (Trọng tải[trongTai] == 'x')
    Map<String, dynamic>? chiPhiMatch;
    for (final group in phiBaoHiemList) {
      final trongTaiMap = Map<String, dynamic>.from(group["Trọng tải"] ?? {});
      if (trongTaiMap[trongTai] == "x") {
        chiPhiMatch = Map<String, dynamic>.from(group["Chi phí"] ?? {});
        break;
      }
    }

    // 🔹 Cập nhật chi phí và reset controller
    if (chiPhiMatch != null) {
      xe["phiBaoHiemChiTiet"] = chiPhiMatch.map((k, v) => MapEntry(k, v.toString()));
      xe["_controllersBaoHiem"] = <String, TextEditingController>{}; // 🧹 reset controllers
      debugPrint("🔁 Reload phí bảo hiểm cho xe[$index] theo trọng tải '$trongTai' (${chiPhiMatch.length} mục)");
      tinhTongBaoHiem();
    } else {
      xe["phiBaoHiemChiTiet"] = {};
      xe["_controllersBaoHiem"] = <String, TextEditingController>{};
      tinhTongBaoHiem();
    }

    update();
  }

  void tinhTongBaoHiem() {
    double tong = 0.0;

    for (var xe in xeList) {
      if (xe["baoHiem"] == true && xe["phiBaoHiemChiTiet"] != null) {
        final chiTiet = Map<String, dynamic>.from(xe["phiBaoHiemChiTiet"]);
        final soLuong = double.tryParse(xe["soLuong"].toString()) ?? 1;

        // ✅ Nếu Hàng thường → chỉ tính “Hàng thông thường”
        // ✅ Nếu Hàng quá cảnh → chỉ tính “Hàng Quá Cảnh”
        for (final entry in chiTiet.entries) {
          final key = entry.key;
          final val = entry.value.toString();
          final num = double.tryParse(val.replaceAll('.', '').replaceAll(',', '')) ?? 0.0;

          double thanhTien = num * soLuong; // 🔹 Nhân số lượng

          if (xe["hangThuong"] == true) {
            if (key == "Hàng thông thường" ||
                (!key.contains("Hàng Quá Cảnh") && key != "Hàng Quá Cảnh")) {
              tong += thanhTien;
            }
          } else {
            if (key == "Hàng Quá Cảnh" ||
                (!key.contains("Hàng thông thường") && key != "Hàng thông thường")) {
              tong += thanhTien;
            }
          }
        }
      }
    }

    tienBaoHiemCtrl.text = currencyFormat.format(tong);
    tinhTongTien(); // ✅ Cập nhật tổng đơn hàng luôn
    update();
  }
  void tinhTongTien() {
    double tongCuoc = 0.0;
    double tongBaoHiem = 0.0;
    double tongHaiQuan = 0.0;

    for (var xe in xeList) {
      final int soLuong = int.tryParse(
        xe["soLuong"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
      ) ?? 1;

      // 🔹 Cước xe (đã bao gồm tổng)
      final double cuocXe =
          double.tryParse(xe["phiCuocXe"]?.toString().replaceAll('.', '').replaceAll(',', '') ?? "0") ?? 0;
      tongCuoc += cuocXe;

      // 🔹 Phí bảo hiểm
      double tongBHItem = 0.0;
      if (xe["baoHiem"] == true && xe["phiBaoHiemChiTiet"] != null) {
        final chiTiet = Map<String, dynamic>.from(xe["phiBaoHiemChiTiet"]);
        final bool isHangThuong = xe["hangThuong"] == true;

        for (final entry in chiTiet.entries) {
          final key = entry.key.toString().toLowerCase();
          final val = entry.value.toString();
          final num = double.tryParse(val.replaceAll('.', '').replaceAll(',', '')) ?? 0.0;

          if (isHangThuong && key.contains("quá cảnh")) continue;
          if (!isHangThuong && key.contains("thông thường")) continue;

          tongBHItem += num;
        }

        tongBHItem *= soLuong; // vẫn nhân theo số lượng xe
      }

      tongBaoHiem += tongBHItem;

      // 🔹 Phí hải quan
      double tongHQItem = 0.0;
      if (xe["haiQuan"] == true && xe["phiHaiQuanChiTiet"] != null) {
        final chiTiet = Map<String, dynamic>.from(xe["phiHaiQuanChiTiet"]);
        for (final entry in chiTiet.entries) {
          final val = entry.value;
          double num = 0.0;
          if (val is Map && val["value"] != null) {
            num = double.tryParse(val["value"].toString().replaceAll('.', '').replaceAll(',', '')) ?? 0.0;
          } else {
            num = double.tryParse(val.toString().replaceAll('.', '').replaceAll(',', '')) ?? 0.0;
          }
          tongHQItem += num;
        }
        tongHQItem *= soLuong;
      }

      tongHaiQuan += tongHQItem;

      xe["tongBaoHiem"] = tongBHItem;
      xe["tongHaiQuan"] = tongHQItem;
      xe["tongTienXe"] = cuocXe + tongBHItem + tongHQItem;
    }

    final tong = tongCuoc + tongBaoHiem + tongHaiQuan;

    tienCuocCtrl.text = currencyFormat.format(tongCuoc);
    tienBaoHiemCtrl.text = currencyFormat.format(tongBaoHiem);
    phiHaiQuanCtrl.text = currencyFormat.format(tongHaiQuan);
    tongTienCtrl.text = currencyFormat.format(tong);

    update();
  }

  void onChangeSoLuong(int index, String value) {
    final soLuong = double.tryParse(value.trim().replaceAll(RegExp(r'[^0-9.]'), '')) ?? 1;
    xeList[index]["soLuong"] = soLuong.toString();

    // ✅ Tính lại cước và bảo hiểm theo số lượng
    tinhCuocXe(index);
    tinhTongBaoHiem();

    update();
  }
  /// -------------------------
  /// 🧩 Khi thay đổi giá trị phí hải quan
  /// -------------------------
  void onChangePhiHaiQuan(int xeIndex, String key, String value) {
    final xe = xeList[xeIndex];
    final chiTiet = Map<String, dynamic>.from(xe["phiHaiQuanChiTiet"] ?? {});
    final clean = value.replaceAll(RegExp(r'[^0-9]'), '');
    chiTiet[key] = clean;
    xe["phiHaiQuanChiTiet"] = chiTiet;
    tinhTongHaiQuan();
    update();
  }

  void tinhTongPhiHaiQuan() {
    double tong = 0.0;

    for (var xe in xeList) {
      final chiTiet = xe["phiHaiQuanChiTiet"] ?? {};
      if (chiTiet is Map<String, dynamic>) {
        for (var e in chiTiet.entries) {
          final val = e.value is Map ? e.value["value"] : e.value;
          final num? so = num.tryParse(val?.toString() ?? '');
          if (so != null) tong += so;
        }
      }
    }

    // ✅ Cập nhật vào TextController hoặc biến tổng
    phiHaiQuanCtrl.text = currencyFormat.format(tong);
    tinhTongTien(); // Cập nhật tổng đơn hàng
    update();
  }

  Future<Map<String, dynamic>?> chonXeNhaDialog(BuildContext context, int index) async {
    isLoadingXeNha.value = true;
    update();

    await Future.wait([loadPhuongTien(), loadLaiXe()]);

    isLoadingXeNha.value = false;
    update();

    final item = xeList[index];
    final int maxSoLuong = int.tryParse(
      item["soLuong"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
    ) ?? 1;

    // Danh sách tạm xe nhà được chọn
    final List<Map<String, dynamic>> tempSelected = List<Map<String, dynamic>>.from(
      (item["xeNha"] ?? []).map((e) => Map<String, dynamic>.from(e)),
    );

    final int currentXeNgoai = (item["xeNgoai"] as List?)?.length ?? 0;

    final selectedXe = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            title: Text("Danh sách xe nhà (tối đa $maxSoLuong xe)"),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: SizedBox(
              width: 1000,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    color: Colors.grey.shade200,
                    child: Row(
                      children: const [
                        SizedBox(width: 40, child: Center(child: Text("Chọn"))),
                        Expanded(flex: 2, child: Text("BKS", style: TextStyle(fontWeight: FontWeight.bold))),
                        SizedBox(width: 8),
                        Expanded(flex: 2, child: Text("Nhà xe", style: TextStyle(fontWeight: FontWeight.bold))),
                        SizedBox(width: 8),
                        Expanded(flex: 3, child: Text("Tài xế", style: TextStyle(fontWeight: FontWeight.bold))),
                        SizedBox(width: 8),
                        Expanded(flex: 3, child: Text("Loại xe", style: TextStyle(fontWeight: FontWeight.bold))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  SizedBox(
                    height: 400,
                    child: ListView.builder(
                      itemCount: phuongTienList.length,
                      itemBuilder: (context, i) {
                        final xe = phuongTienList[i];
                        final nid = xe["nid"];
                        final bks = xe["field_bien_kiem_soat"] ?? "";
                        final nhaXe = xe["ten_nha_xe"] ?? "";
                        final loaiXe = xe["field_loai_xe"] ?? "";
                        final tenLaiXe = xe["ten_lai_xe"] ?? "";
                        final idLaiXe = xe["field_lai_xe"];
                        final isChecked = tempSelected.any((sel) => sel["nid"] == nid);

                        final currentLaiXe = tempSelected
                            .firstWhereOrNull((sel) => sel["nid"] == nid)?["laiXe"] ??
                            tenLaiXe;

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 40,
                                child: Checkbox(
                                  value: isChecked,
                                  onChanged: (val) {
                                    if (val == true) {
                                      final totalSelected = currentXeNgoai + tempSelected.length + 1;
                                      if (totalSelected > maxSoLuong) {
                                        Get.snackbar(
                                          "Giới hạn xe",
                                          "Tổng xe nhà + xe ngoài không vượt quá $maxSoLuong.",
                                          backgroundColor: Colors.orange.shade100,
                                          colorText: Colors.orange.shade900,
                                        );
                                        return;
                                      }

                                      tempSelected.add({
                                        "nid": nid,
                                        "bks": bks,
                                        "nhaXe": nhaXe,
                                        "laiXe": tenLaiXe,
                                        "laiXeId": idLaiXe,
                                        "sdt": laiXeList.firstWhereOrNull(
                                              (lx) => lx["nid"].toString() == idLaiXe.toString(),
                                        )?["field_dien_thoai"] ?? "",
                                        "loaiXe": loaiXe,
                                      });
                                    } else {
                                      tempSelected.removeWhere((e) => e["nid"] == nid);
                                    }
                                    setState(() {});
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(flex: 2, child: Text(bks)),
                              const SizedBox(width: 8),
                              Expanded(flex: 2, child: Text(nhaXe)),
                              const SizedBox(width: 8),
                              Expanded(
                                flex: 3,
                                child: DropdownButtonFormField<int>(
                                  dropdownColor: Colors.white,
                                  initialValue: laiXeList.firstWhereOrNull(
                                        (lx) => lx["field_ten_lai_xe"] == currentLaiXe,
                                  )?["nid"],
                                  isExpanded: true,
                                  decoration: const InputDecoration(
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                  items: laiXeList.map((lx) {
                                    final ten = lx["field_ten_lai_xe"] ?? "Không rõ";
                                    final sdt = lx["field_dien_thoai"] ?? "";
                                    final nid = lx["nid"];
                                    return DropdownMenuItem<int>(
                                      value: nid,
                                      child: Text("$ten (${sdt.isEmpty ? '---' : sdt})",
                                          overflow: TextOverflow.ellipsis),
                                    );
                                  }).toList(),
                                  onChanged: (int? selectedId) {
                                    final laiXe = laiXeList.firstWhereOrNull(
                                          (lx) => lx["nid"] == selectedId,
                                    );
                                    final found = tempSelected.firstWhereOrNull((e) => e["nid"] == nid);
                                    if (found != null && laiXe != null) {
                                      found["laiXeId"] = laiXe["nid"];
                                      found["laiXe"] = laiXe["field_ten_lai_xe"];
                                      found["sdt"] = laiXe["field_dien_thoai"];
                                    }
                                    setState(() {});
                                  },
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(flex: 3, child: Text(loaiXe)),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, null),
                child: const Text("Đóng"),
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.save),
                label: const Text("Lưu lại"),
                onPressed: () {
                  if (tempSelected.isEmpty) {
                    Get.snackbar(
                      "Chưa chọn xe",
                      "Vui lòng chọn ít nhất 1 xe nhà.",
                      backgroundColor: Colors.red.shade100,
                      colorText: Colors.red.shade800,
                    );
                    return;
                  }

                  if (tempSelected.length + currentXeNgoai > maxSoLuong) {
                    Get.snackbar(
                      "Giới hạn xe",
                      "Tổng xe nhà + xe ngoài không vượt quá $maxSoLuong.",
                      backgroundColor: Colors.orange.shade100,
                      colorText: Colors.orange.shade900,
                    );
                    return;
                  }

                  // ✅ Lưu danh sách xe
                  xeList[index]["xeNha"] = tempSelected;
                  update();

                  // ✅ Trả về xe đầu tiên để hiển thị form
                  Navigator.pop(context, tempSelected.first);
                },
              ),
            ],
          );
        });
      },
    );

    return selectedXe;
  }
  Future<Map<String, dynamic>?> chonXeNgoaiDialog(BuildContext context, int index) async {
    isLoadingXeNgoai.value = true;
    update();

    await loadNhaXeNgoai();

    isLoadingXeNgoai.value = false;
    update();

    final item = xeList[index];
    final int maxSoLuong = int.tryParse(
      item["soLuong"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
    ) ?? 1;

    final List<Map<String, dynamic>> tempList =
    (item["xeNgoai"] ?? []).map<Map<String, dynamic>>((e) {
      return Map<String, dynamic>.from(e);
    }).toList();

    if (tempList.isEmpty) {
      tempList.add({
        "nid": null,
        "nhaXeTen": "",
        "bks": "",
        "laiXe": "",
        "sdt": "",
      });
    }

    final int currentXeNha = (item["xeNha"] as List?)?.length ?? 0;

// print('currentXeNha $currentXeNha'); // TODO: remove debug
    // ✅ Lưu kết quả trả về từ showDialog
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            title: Text("🚛 Danh sách xe ngoài (tối đa $maxSoLuong xe)"),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            content: SizedBox(
              width: 850,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: tempList.length,
                      itemBuilder: (context, i) {
                        final xe = tempList[i];

                        final bksController =
                        TextEditingController(text: xe["bks"] ?? "");
                        final laiXeController =
                        TextEditingController(text: xe["laiXe"] ?? "");
                        final sdtController =
                        TextEditingController(text: xe["sdt"] ?? "");

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            children: [
                              // 🔹 Nhà xe ngoài
                              Expanded(
                                flex: 3,
                                child: DropdownButtonFormField<int>(
                                  dropdownColor: Colors.white,
                                  initialValue: xe["nid"] != null
                                      ? int.tryParse(xe["nid"].toString())
                                      : null,
                                  isExpanded: true,
                                  decoration: const InputDecoration(
                                    labelText: "Nhà xe ngoài",
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                  items: nhaXeNgoaiList.map((nhaXe) {
                                    final ten = nhaXe["title"] ??
                                        nhaXe["field_ten_nha_xe"] ??
                                        "Không rõ";
                                    final nid = int.tryParse(nhaXe["nid"].toString()) ?? 0;
                                    return DropdownMenuItem<int>(
                                      value: nid,
                                      child: Text(ten, overflow: TextOverflow.ellipsis),
                                    );
                                  }).toList(),
                                  onChanged: (nid) {
                                    final nhaXe = nhaXeNgoaiList.firstWhere(
                                          (n) => int.tryParse(n["nid"].toString()) == nid,
                                      orElse: () => {},
                                    );
                                    xe["nid"] = nid;
                                    xe["nhaXeTen"] =
                                        nhaXe["title"] ?? nhaXe["field_ten_nha_xe"] ?? "";
                                    setState(() {});
                                  },
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                flex: 2,
                                child: TextField(
                                  controller: bksController,
                                  decoration: const InputDecoration(
                                    labelText: "BKS",
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                  onChanged: (v) => xe["bks"] = v,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                flex: 3,
                                child: TextField(
                                  controller: laiXeController,
                                  decoration: const InputDecoration(
                                    labelText: "Tài xế",
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                  onChanged: (v) => xe["laiXe"] = v,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Expanded(
                                flex: 3,
                                child: TextField(
                                  controller: sdtController,
                                  keyboardType: TextInputType.phone,
                                  decoration: const InputDecoration(
                                    labelText: "SĐT",
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                  onChanged: (v) => xe["sdt"] = v,
                                ),
                              ),
                              const SizedBox(width: 6),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () {
                                  tempList.removeAt(i);
                                  if (tempList.isEmpty) {
                                    tempList.add({
                                      "nid": null,
                                      "nhaXeTen": "",
                                      "bks": "",
                                      "laiXe": "",
                                      "sdt": "",
                                    });
                                  }
                                  setState(() {});
                                },
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 8),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.add),
                      label: const Text("Thêm dòng xe ngoài"),
                      onPressed: () {
                        final totalSelected = currentXeNha + tempList.length + 1;
                        if (totalSelected > maxSoLuong) {
                          Get.snackbar(
                            "Giới hạn xe",
                            "Tổng xe nhà + xe ngoài không vượt quá $maxSoLuong.",
                            backgroundColor: Colors.orange.shade100,
                            colorText: Colors.orange.shade900,
                          );
                          return;
                        }
                        tempList.add({
                          "nid": null,
                          "nhaXeTen": "",
                          "bks": "",
                          "laiXe": "",
                          "sdt": "",
                        });
                        setState(() {});
                      },
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context, null),
                child: const Text("Đóng"),
              ),
              ElevatedButton.icon(
                icon: const Icon(Icons.save),
                label: const Text("Lưu lại"),
                onPressed: () {
                  for (var xe in tempList) {
                    if ((xe["nid"] == null) || (xe["bks"] ?? "").isEmpty) {
                      Get.snackbar(
                        "Thiếu thông tin",
                        "Vui lòng chọn Nhà xe và nhập BKS.",
                        backgroundColor: Colors.red.shade100,
                        colorText: Colors.red.shade800,
                      );
                      return;
                    }
                  }
                  xeList[index]["xeNgoai"] = List<Map<String, dynamic>>.from(tempList);
                  update();
                  Navigator.pop(context, tempList.first); // ✅ return dữ liệu
                },
              ),
            ],
          );
        });
      },
    );

    // ✅ Trả kết quả ra ngoài để XeInfoForm nhận
    return result;
  }

  Future<void> luuDonHang() async {
    if (isSaving.value) return;
    isSaving.value = true;
    update();

    Get.dialog(
      const Center(child: CircularProgressIndicator()),
      barrierDismissible: false,
    );

    final List<Map<String, dynamic>> dsChuyenXe = [];
    final String maDonHang = "DH-${DateFormat('yyyyMMdd-HHmmss').format(DateTime.now())}";

    double tongCuoc = 0;
    double tongBH = 0;
    double tongHQ = 0;
    double tongTien = 0;

    final khach = khachHangList.firstWhereOrNull(
          (k) => k["nid"].toString() == selectedKhachHang?.toString(),
    );

    if (khach == null) {
      Get.back();
      AppToast.warning("Vui lòng chọn khách hàng trước khi lưu đơn hàng.");
      isSaving.value = false;
      update();
      return;
    }

    // ====================================================
    // 🔹 Duyệt từng item trong danh sách xe
    // ====================================================
    for (final item in xeList) {
      final bool isHangThuong = item["hangThuong"] == true;
      final int soLuong = int.tryParse(
        item["soLuong"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
      ) ??
          1;

      final double phiCuocXe =
          double.tryParse(item["phiCuocXe"]?.toString() ?? "0") ?? 0;

      // ====================================================
      // 🔹 BẢO HIỂM
      // ====================================================
      Map<String, dynamic> phiBaoHiemMap = {};
      if (khach["field_phi_bao_hiem"] != null &&
          khach["field_phi_bao_hiem"].toString().isNotEmpty) {
        try {
          final List<dynamic> phiList = jsonDecode(khach["field_phi_bao_hiem"]);
          final String trongTai = item["trongTai"] ?? "";
          for (final p in phiList) {
            final map = Map<String, dynamic>.from(p);
            final trongTaiMap = Map<String, dynamic>.from(map["Trọng tải"] ?? {});
            if (trongTaiMap.containsKey(trongTai)) {
              phiBaoHiemMap = Map<String, dynamic>.from(map["Chi phí"] ?? {});
              break;
            }
          }
        } catch (e) {
          debugPrint("⚠️ Không parse được field_phi_bao_hiem: $e");
        }
      }
      // Merge nếu có chỉnh tay
      final currentBH = Map<String, dynamic>.from(item["phiBaoHiemChiTiet"] ?? {});
      phiBaoHiemMap.addAll(currentBH);
      item["phiBaoHiemChiTiet"] = phiBaoHiemMap;

      double tongBaoHiem = 0.0;
      if (item["baoHiem"] == true && item["phiBaoHiemChiTiet"] is Map) {
        (item["phiBaoHiemChiTiet"] as Map).forEach((key, val) {
          final double giaTri = double.tryParse(val.toString()) ?? 0;
          final lowerKey = key.toString().toLowerCase();
          if (isHangThuong && lowerKey.contains("quá cảnh")) return;
          if (!isHangThuong && lowerKey.contains("thông thường")) return;
          tongBaoHiem += giaTri;
        });
        tongBaoHiem *= soLuong;
      }

      // ====================================================
      // 🔹 HẢI QUAN
      // ====================================================
      Map<String, dynamic> phiHaiQuanMap = {};
      if (khach["field_phi_hai_quan"] != null &&
          khach["field_phi_hai_quan"].toString().isNotEmpty) {
        try {
          final List<dynamic> phiList = jsonDecode(khach["field_phi_hai_quan"]);
          final String cuaKhau = item["diemDi"] ?? "";
          final String trongTai = item["trongTai"] ?? "";
          for (final p in phiList) {
            final map = Map<String, dynamic>.from(p);
            if (map["Cửa khẩu"] == cuaKhau && map.containsKey(trongTai)) {
              phiHaiQuanMap[map["Chi phí"] ?? "Không rõ"] =
                  map[trongTai].toString();
            }
          }
        } catch (e) {
          debugPrint("⚠️ Không parse được field_phi_hai_quan: $e");
        }
      }

      final currentHQ = Map<String, dynamic>.from(item["phiHaiQuanChiTiet"] ?? {});
      phiHaiQuanMap.addAll(currentHQ);
      item["phiHaiQuanChiTiet"] = phiHaiQuanMap;

      double tongHaiQuan = 0.0;
      if (item["haiQuan"] == true && item["phiHaiQuanChiTiet"] is Map) {
        (item["phiHaiQuanChiTiet"] as Map).forEach((k, v) {
          double giaTri = 0;
          if (v is Map && v["value"] != null) {
            giaTri = double.tryParse(v["value"].toString()) ?? 0;
          } else {
            giaTri = double.tryParse(v.toString()) ?? 0;
          }
          tongHaiQuan += giaTri;
        });
        tongHaiQuan *= soLuong;
      }

      // ====================================================
      // 🔹 Tổng phí cho item
      // ====================================================
      final double tongXe = phiCuocXe + tongBaoHiem + tongHaiQuan;
      item["tongBaoHiem"] = tongBaoHiem;
      item["tongHaiQuan"] = tongHaiQuan;
      item["tongTienXe"] = tongXe;

      tongCuoc += phiCuocXe;
      tongBH += tongBaoHiem;
      tongHQ += tongHaiQuan;
      tongTien += tongXe;

      // ====================================================
      // 🔹 PHÂN BỔ XE
      // ====================================================
      final xeNhaList = (item["xeNha"] ?? []).cast<Map<String, dynamic>>();
      final xeNgoaiList = (item["xeNgoai"] ?? []).cast<Map<String, dynamic>>();
      int idxNha = 0;
      int idxNgoai = 0;

      // print('item["ngayVanChuyen"] ${item["ngayVanChuyen"]}');
      // 🆕 Lấy ngày vận chuyển (định dạng chuẩn backend)
      final ngayVanChuyenStr = (item["ngayVanChuyen"] != null &&
          item["ngayVanChuyen"].toString().isNotEmpty)
          ? item["ngayVanChuyen"]
          : null;

      for (int i = 0; i < soLuong; i++) {
        Map<String, dynamic>? xeNha;
        Map<String, dynamic>? xeNgoai;

        if (idxNha < xeNhaList.length) {
          final xe = xeNhaList[idxNha++];
          xeNha = {
            "nid": xe["nid"],
            "bks": xe["bks"],
            "nha_xe": xe["nhaXe"],
            "lai_xe": {
              "nid": xe["laiXeId"],
              "ten": xe["laiXe"],
              "sdt": xe["sdt"],
            },
            "loai_xe": xe["loaiXe"]
          };
        } else if (idxNgoai < xeNgoaiList.length) {
          final xe = xeNgoaiList[idxNgoai++];
          xeNgoai = {
            "nid": xe["nid"],
            "nha_xe": xe["nha_xe"],
            "bks": xe["bks"],
            "lai_xe": {
              "ten": xe["ten"],
              "sdt": xe["sdt"],
            },
            "loai_xe": xe["loaiXe"]
          };
        }

        dsChuyenXe.add({
          "diem_di": item["diemDi"],
          "diem_den": item["diemDen"],
          "trong_tai": item["trongTai"],
          "so_luong": 1,
          "bks": xeNha?["bks"] ?? xeNgoai?["bks"] ?? "",
          "ngay_van_chuyen": ngayVanChuyenStr, // 🆕 thêm vào từng chuyến
          "dich_vu": {
            "bao_hiem": item["baoHiem"] == true,
            "cuoc_xe": item["cuocXe"] == true,
            "hai_quan": item["haiQuan"] == true,
            "hang_thuong": isHangThuong,
            "qua_kho_qua_tai": false
          },
          "phi_cuoc_xe": phiCuocXe / soLuong,
          "phi_bao_hiem": tongBaoHiem / soLuong,
          "phi_hai_quan": tongHaiQuan / soLuong,
          "tong_phi": phiCuocXe / soLuong + tongBaoHiem / soLuong + tongHaiQuan / soLuong,
          "xe_nha": xeNha,
          "xe_ngoai": xeNgoai,
          "ma_don_hang": maDonHang,
          "ngay_tao": DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now()),
        });
      }
    }

    // ====================================================
    // 🔹 Tổng hợp đơn hàng
    // ====================================================
    final donHang = {
      "ma_don_hang": maDonHang,
      "tong_chuyen_xe": dsChuyenXe.length,
      "tong_tien_cuoc": tongCuoc,
      "tong_tien_bao_hiem": tongBH,
      "tong_tien_hai_quan": tongHQ,
      "tong_tien": tongTien,
      "ngay_tao": DateFormat('yyyy-MM-dd HH:mm:ss').format(DateTime.now()),
      "don_hang_json": {"xe_list": xeList},
      "khach_hang_nid": khach["nid"],
    };

    // ✅ Bổ sung dữ liệu khách hàng chi tiết để backend có thể tạo nếu chưa có
    final khachHangData = {
      "nid": khach["nid"],
      "ten": khach["title"] ?? khach["field_ho_ten"] ?? "",
      "sdt": khach["field_sdt"] ?? "",
      "email": khach["field_email"] ?? "",
      "dia_chi": khach["field_dia_chi"] ?? "",
    };

    final token = await LocalStorage.getUserToken();
    final email = await LocalStorage.getUserEmail();

    Map<String, dynamic> cleanMap(Map source) {
      final result = <String, dynamic>{};
      source.forEach((key, value) {
        if (value is TextEditingController) {
          result[key] = value.text;
        } else if (value is Map) {
          result[key] = cleanMap(value);
        } else if (value is List) {
          result[key] = value.map((e) => e is Map ? cleanMap(e) : e).toList();
        } else {
          result[key] = value;
        }
      });
      return result;
    }

    final cleanedDonHang = cleanMap(donHang);
    final cleanedChuyenXeList = dsChuyenXe.map((e) => cleanMap(e)).toList();
    final cleanedKhachHang = cleanMap(khachHangData);

    // ====================================================
    // 🔹 Gửi API về Drupal
    // ====================================================
// print('AuthService.saveDonHang ${AuthService.saveDonHang}'); // TODO: remove debug
    final response = await http.post(
      Uri.parse(AuthService.workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": AuthService.saveDonHang,
        "method": "POST",
        "params": {
          "don_hang": cleanedDonHang,
          "chuyen_xe_list": cleanedChuyenXeList,
          "khach_hang": cleanedKhachHang,
          "created_email": email,
          "token": token,
        },
      }),
    );

    Get.back();

    if (response.statusCode == 200) {
      final res = jsonDecode(response.body);
      if (res["success"] == true) {
        final content = res["content"];
        AppToast.success("Đã lưu đơn hàng ${content["message"] ?? maDonHang}");
        xeList.clear();
        isSaving.value = false;
        update();
      } else {
        AppToast.error(res["content"].toString());

        isSaving.value = false;
        update();
      }
    } else {
      AppToast.warning("Không kết nối được với máy chủ (${response.statusCode})");

      isSaving.value = false;
      update();
    }

  }
  void updatePhiBaoHiemKhachHang(
      String? khachId, String? trongTai, String key, String newValue) {
    if (khachId == null || trongTai == null || trongTai.isEmpty) return;

    // 🔹 Tìm khách hàng hiện tại trong danh sách
    final kh = khachHangList.firstWhereOrNull(
            (e) => e["nid"].toString() == khachId.toString());
    if (kh == null) return;

    // 🔹 Parse field_phi_bao_hiem từ JSON
    dynamic raw = kh["field_phi_bao_hiem"];
    List<dynamic> phiBaoHiemList = [];
    if (raw is String && raw.isNotEmpty) {
      try {
        final parsed = jsonDecode(raw);
        if (parsed is List) {
          phiBaoHiemList = parsed;
        } else if (parsed is Map) phiBaoHiemList = [parsed];
      } catch (e) {
        debugPrint("⚠️ Không parse được field_phi_bao_hiem: $e");
        return;
      }
    } else if (raw is List) {
      phiBaoHiemList = raw;
    }

    // 🔹 Nếu chưa có nhóm dữ liệu nào thì tạo mới
    if (phiBaoHiemList.isEmpty) {
      phiBaoHiemList.add({
        "Trọng tải": {trongTai: "x"},
        "Chi phí": {key: newValue}
      });
      kh["field_phi_bao_hiem"] = jsonEncode(phiBaoHiemList);
      return;
    }

    // 🔹 Tìm nhóm có trọng tải tương ứng
    bool updated = false;
    for (final group in phiBaoHiemList) {
      final trongTaiMap = Map<String, dynamic>.from(group["Trọng tải"] ?? {});
      if (trongTaiMap[trongTai] == "x") {
        final chiPhiMap = Map<String, dynamic>.from(group["Chi phí"] ?? {});
        chiPhiMap[key] = newValue;
        group["Chi phí"] = chiPhiMap;
        updated = true;
        break;
      }
    }

    // 🔹 Nếu không tìm thấy nhóm phù hợp → thêm mới
    if (!updated) {
      phiBaoHiemList.add({
        "Trọng tải": {trongTai: "x"},
        "Chi phí": {key: newValue},
      });
    }

    // 🔹 Cập nhật lại JSON trong khachHangList
    kh["field_phi_bao_hiem"] = jsonEncode(phiBaoHiemList);
    debugPrint(
        "💾 Đã cập nhật $key = $newValue vào field_phi_bao_hiem[$trongTai] cho khách hàng ${kh["nid"]}");
  }
  void updatePhiHaiQuanKhachHang(
      String? khachId,
      String? cuaKhau,
      String chiPhi,
      String? trongTai,
      String newValue,
      ) {
    if (khachId == null || cuaKhau == null || cuaKhau.isEmpty) return;

    final kh = khachHangList.firstWhereOrNull(
            (e) => e["nid"].toString() == khachId.toString());
    if (kh == null) return;

    // 🔹 Parse field_phi_hai_quan
    dynamic raw = kh["field_phi_hai_quan"];
    List<dynamic> phiHaiQuanList = [];

    if (raw is String && raw.isNotEmpty) {
      try {
        final parsed = jsonDecode(raw);
        if (parsed is List) {
          phiHaiQuanList = parsed;
        } else if (parsed is Map) phiHaiQuanList = [parsed];
      } catch (e) {
        debugPrint("⚠️ Không parse được field_phi_hai_quan: $e");
        return;
      }
    } else if (raw is List) {
      phiHaiQuanList = raw;
    }

    // 🔹 Tìm nhóm có Cửa khẩu khớp
    bool updated = false;
    for (final group in phiHaiQuanList) {
      final cuaKhauGroup = group["Cửa khẩu"]?.toString().trim();
      final chiPhiGroup = group["Chi phí"]?.toString().trim();

      if (cuaKhauGroup == cuaKhau && chiPhiGroup == chiPhi) {
        // ✅ Cập nhật hoặc thêm cột trọng tải
        if (trongTai != null && trongTai.isNotEmpty) {
          group[trongTai] = newValue;
        } else {
          // Nếu chưa xác định trọng tải → mặc định là "Chung"
          group["Chung"] = newValue;
        }
        updated = true;
        break;
      }
    }

    // 🔹 Nếu không tìm thấy → thêm mới nhóm
    if (!updated) {
      phiHaiQuanList.add({
        "Cửa khẩu": cuaKhau,
        "Chi phí": chiPhi,
        "Kiểu dữ liệu": "Số",
        "Loại": "Khác",
        trongTai ?? "Chung": newValue,
      });
    }

    // 🔹 Ghi lại vào khachHangList
    kh["field_phi_hai_quan"] = jsonEncode(phiHaiQuanList);

    debugPrint(
        "💾 Đã cập nhật phí hải quan: $cuaKhau → $chiPhi = $newValue (${trongTai ?? 'Chung'}) cho khách hàng ${kh["nid"]}");
  }

}
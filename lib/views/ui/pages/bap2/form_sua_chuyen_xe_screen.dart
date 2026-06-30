import 'dart:convert';

import 'package:kho555/helper/utils/app_toast.dart';
import 'package:kho555/helper/utils/utils.dart';
import 'package:kho555/helper/widgets/my_cost_row.dart';
import 'package:kho555/helper/widgets/my_datetime_field.dart';
import 'package:kho555/helper/widgets/my_dropdown_field.dart';
import 'package:kho555/helper/widgets/tra_diem_va_chi_phi_khac_row.dart';
import 'package:kho555/widgets/chi_phi_co_dinh_lai_xe_widget.dart';
import 'package:kho555/widgets/date_picker_field.dart';
import 'package:kho555/widgets/thousands_separator_input_formatter.dart';
import 'package:kho555/widgets/xe_info_form.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:get/get.dart';
import 'package:intl/intl.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/controller/pages/chuyen_xe_controller.dart';
import 'package:kho555/controller/pages/form_don_hang_controller.dart';

class FormSuaChuyenXeScreen extends StatefulWidget {
  const FormSuaChuyenXeScreen({super.key});

  @override
  State<FormSuaChuyenXeScreen> createState() => _FormSuaChuyenXeScreenState();
}

class _FormSuaChuyenXeScreenState extends State<FormSuaChuyenXeScreen> with UIMixin {
  double phiLuuCa = 0;
  int soNgayLuuCa = 0;
  final ScrollController _scrollController = ScrollController();

  final trongTaiCtrl = TextEditingController();
  List<dynamic> khachHangList = [];
  double phiQuaKhoQuaTai = 0; // ✅ Phí quá khổ / quá tải
  final TextEditingController _phiLuuCaCtrl = TextEditingController();

  Map<String, dynamic> thongTinNhaXeNgoai = {};
  Map<String, TextEditingController> _controllersBaoHiem = {};
  final TextEditingController _quaKhoQuaTaiCtrl = TextEditingController();

  double phiCuocXeNCC = 0;
  bool daNhanLuuChuyenXe = false;

  double chiPhiKhacTotal = 0;
  double traThemDiemTotal = 0;
  double traThemDiemNCCTotal = 0;

  // Map<String, dynamic> phiHaiQuanChiTiet = {};
  Map<String, dynamic> phiHaiQuanChiTietNCC = {};
  final Map<String, TextEditingController> _controllersHaiQuan = {};
  double tongPhiHaiQuanNCC = 0;

  late ChuyenXeController controller;

  final dateFormat = DateFormat("yyyy-MM-dd");
  List<String> trongTaiList = [];

  // Controllers cho text field
  final TextEditingController diemDiCtrl = TextEditingController();
  final TextEditingController diemDenCtrl = TextEditingController();
  // final TextEditingController trongTaiCtrl = TextEditingController();
  final TextEditingController bksCtrl = TextEditingController();
  final TextEditingController ngayVanChuyenCtrl = TextEditingController();
  final TextEditingController _phiCuocXeCtrl = TextEditingController();
  final TextEditingController _phiVeCaoTocCtrl = TextEditingController();
  final TextEditingController _phiPhatSinhKhacCtrl = TextEditingController();

  final TextEditingController phiCuocXeCtrl = TextEditingController();
  final TextEditingController phiVeCaoTocCtrl = TextEditingController();
  final TextEditingController phiPhatSinhKhacCtrl = TextEditingController();
  final TextEditingController phiBaoHiemCtrl = TextEditingController();
  final TextEditingController phiHaiQuanCtrl = TextEditingController();
  final TextEditingController ngayGioTraHangCtrl = TextEditingController();
  final NumberFormat _formatCurrency = NumberFormat('#,##0', 'vi_VN');

  // List<Map<String, dynamic>> traThemDiemList = [];

  String? trangThai;
  String? loaiXe;
  String? nhaXe;

  String? khachHang; // Khách hàng đang chọn
  late FormDonHangController khController; // dùng để load khách hàng
  // List<Map<String, dynamic>> khachHangList = [];
  // String? khachHangId; // NID khách hàng được chọn

  List<String> diemDiList = [];
  List<String> diemDenList = [];

  double phiBaoHiemNCC = 0;
  Map<String, dynamic> phiBaoHiemChiTietNCC = {};
  Map<String, TextEditingController> _controllersBaoHiemNCC = {};

  // ====================
// 🔹 DỊCH VỤ / TOGGLE
// ====================
  bool showQuaTai  = false;

// ====================
// 🔹 XE NHÀ / XE NGOÀI
// ====================
  Map<String, dynamic>? selectedXeNha;
  Map<String, dynamic>? selectedXeNgoai;

// ====================
// 🔹 CHI PHÍ ĐỘNG
// ====================
  List<Map<String, dynamic>> chiPhiKhac  = [];
  List<Map<String, dynamic>> traThemDiem = [];

// ====================
// 🔹 CÁC KHOẢN TIỀN
// ====================
  double phiBaoHiem = 0;
  double phiHaiQuan = 0;
  double phiQuaTai  = 0;
  final Map<int, TextEditingController> _phiThemCtrls = {};

  bool isTinhPhiKhach = true; // true = Khách trả, false = NCC

  @override
  void initState() {
    super.initState();

    // 🔹 Controller đã được tạo từ Dialog
    controller = Get.find<ChuyenXeController>(tag: 'form-sua-chuyen-xe');
    khController = Get.find<FormDonHangController>();

    // 🔹 Chỉ bind dữ liệu sau khi UI sẵn sàng
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _bindDataToForm();
    });
  }

  // ======================================================
  // 🧩 4️⃣ Dịch vụ
  // ======================================================
  bool toBool(dynamic v) =>
      v == true ||
          v == "true" ||
          v == 1 ||
          v == "1" ||
          v.toString().toLowerCase() == "yes";

  // ======================================================
  // 🧩 5️⃣ Chi phí chính
  // ======================================================
  double toDouble(dynamic v) {
    if (v == null) return 0;
    return double.tryParse(
      v.toString().replaceAll(RegExp(r'[^0-9.]'), ''),
    ) ??
        0;
  }

  void _bindDataToForm() async {
    await khController.loadKhachHang(); // ✅ Dùng lại logic FormDonHangController
    setState(() {
      khachHangList = khController.khachHangList;
    });
    // traThemDiemList = (controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'] as List?)
    //     ?.map((e) => Map<String, dynamic>.from(e))
    //     .toList() ??
    //     [];
    //{
    //   "diem_di": "Hữu Nghị",
    //   "diem_den": "Bắc Ninh  ( Hiệp Hòa, Lục Nam )",
    //   "trong_tai": "1.5 - 2.4 tấn (9 CBM)",
    //   "so_luong": 1,
    //   "bks": "111",
    //   "ngay_van_chuyen": "2025-12-09",
    //   "dich_vu": {
    //     "bao_hiem": false,
    //     "cuoc_xe": true,
    //     "hai_quan": false,
    //     "hang_thuong": true,
    //     "qua_kho_qua_tai": false
    //   },
    //   "phi_cuoc_xe": 3700000,
    //   "phi_bao_hiem": 0,
    //   "phi_hai_quan": 0,
    //   "tong_phi": 3700000,
    //   "xe_nha": null,
    //   "xe_ngoai": {
    //     "nid": 5846,
    //     "nha_xe": null,
    //     "bks": "111",
    //     "lai_xe": {
    //       "ten": null,
    //       "sdt": ""
    //     },
    //     "loai_xe": null
    //   },
    //   "ma_don_hang": "DH-20251209-233247",
    //   "ngay_tao": "2025-12-09 23:32:47",
    //   "chi_phi_ncc": {
    //     "phi_bao_hiem": 0,
    //     "phi_hai_quan": 0,
    //     "phi_luu_ca": 0,
    //     "tra_them_diem": 0,
    //     "qua_kho_qua_tai": 0,
    //     "chi_phi_khac": {
    //       "chi_tiet": [],
    //       "tong_tien": 0
    //     },
    //     "phi_cuoc_xe": 2000000,
    //     "so_ngay_luu_ca": 0,
    //     "tra_them_diem_total": 0
    //   },
    //   "chi_phi_co_dinh": {
    //     "tron_ve": 0,
    //     "ung_lai_xe": 0,
    //     "bao_luat": 0,
    //     "cty_bao_luat": 0,
    //     "lai_ngan_hang": 0,
    //     "vetc": 0,
    //     "thay_dau": 0,
    //     "xin_giay_phep": 0,
    //     "do_dau": 0,
    //     "ve_cao_toc": 0,
    //     "ve_cau_luong": 0,
    //     "ve_phat_sinh": 0
    //   },
    //   "chi_phi_lai_xe": [],
    //   "phi_luu_ca": 0,
    //   "so_ngay_luu_ca": 0,
    //   "tra_them_diem_total": 0,
    //   "tong_chi_phi": 2000000
    // }
    if (controller.currentChuyenXe == null) return;

    // print('controller.currentChuyenXe ${controller.currentChuyenXe}');

    diemDiCtrl.text = controller.currentChuyenXe!['field_thong_tin_json']["diem_di"]?.toString() ?? "";
    diemDenCtrl.text = controller.currentChuyenXe!['field_thong_tin_json']["diem_den"]?.toString() ?? "";
    trongTaiCtrl.text = controller.currentChuyenXe!['field_thong_tin_json']["trong_tai"]?.toString() ?? "";

    _extractDiemDiVaDiemDen();

    bksCtrl.text = controller.currentChuyenXe!["bks"]?.toString() ?? "";
    ngayVanChuyenCtrl.text = controller.currentChuyenXe!["ngay_van_chuyen"]?.toString() ?? controller.currentChuyenXe!['ngay_van_chuyen']?.toString() ?? "";
    ngayGioTraHangCtrl.text = controller.currentChuyenXe!['ngay_gio_tra_hang']?.toString() ?? controller.currentChuyenXe!['ngay_gio_tra_hang']?.toString() ?? "";
    soNgayLuuCa = int.tryParse(controller.currentChuyenXe!['field_thong_tin_json']["so_ngay_luu_ca"]?.toString() ?? "0") ?? 0;

    // ======================================================
    // 🧩 3️⃣ Trạng thái – loại xe – nhà xe
    // ======================================================
    trangThai = controller.currentChuyenXe!["trang_thai"] ?? "Đang chạy";
    phiLuuCa    = toDouble(controller.currentChuyenXe!['field_thong_tin_json']["phi_luu_ca"]);

    phiCuocXeCtrl.text  = toDouble(controller.currentChuyenXe!['field_thong_tin_json']["phi_cuoc_xe"]).toStringAsFixed(0);
    phiBaoHiemCtrl.text = toDouble(controller.currentChuyenXe!['field_thong_tin_json']["phi_bao_hiem"]).toStringAsFixed(0);
    phiHaiQuanCtrl.text = toDouble(controller.currentChuyenXe!['field_thong_tin_json']["phi_hai_quan"]).toStringAsFixed(0);
    _quaKhoQuaTaiCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
      double.tryParse(
        controller.currentChuyenXe?['field_thong_tin_json']?['qua_kho_qua_tai']
            ?.toString() ??
            '0',
      ) ??
          0,
    );
    _phiLuuCaCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
      double.tryParse(
        controller.currentChuyenXe?['field_thong_tin_json']?['phi_luu_ca']
            ?.toString() ??
            '0',
      ) ??
          0,
    );
    _phiCuocXeCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
      double.tryParse(
        controller.currentChuyenXe?['field_thong_tin_json']?['phi_cuoc_xe']
            ?.toString() ??
            '0',
      ) ??
          0,
    );

    // ======================================================
    // 🧩 7️⃣ Xe nhà / xe ngoài
    // ======================================================
    if (controller.currentChuyenXe!['field_thong_tin_json']["xe_nha"] != null) {
      selectedXeNha = Map<String, dynamic>.from(controller.currentChuyenXe!['field_thong_tin_json']["xe_nha"]);
      selectedXeNgoai = null;
    } else if (controller.currentChuyenXe!['field_thong_tin_json']["xe_ngoai"] != null) {
      selectedXeNgoai = Map<String, dynamic>.from(controller.currentChuyenXe!['field_thong_tin_json']["xe_ngoai"]);
      selectedXeNha = null;
    }

    chiPhiKhac   = List<Map<String, dynamic>>.from(controller.currentChuyenXe!['field_thong_tin_json']["chi_phi_khac"]);
    // traThemDiem  = List<Map<String, dynamic>>.from(controller.currentChuyenXe!['field_thong_tin_json']["tra_them_diem"]);

    setState(() {});
  }

/*
  Future<void> _loadNhaXeNgoaiController(int nidNhaXe) async {
    await khController.loadThongTinNhaXe(nidNhaXe); // ✅ Dùng lại logic FormDonHangController
    setState(() {
      thongTinNhaXeNgoai = khController.thongTinNhaXeNgoai;
      //controller.currentChuyenXe!["thong_tin_json"]["phi_cuoc_ncc"]
      _capNhatCuocNhaXeNgoai();
      _tinhPhiBaoHiemNCC();
      _tinhPhiHaiQuanNCC();
      _tinhPhiLuuCaNCC();
      _tinhPhiQuaKhoQuaTaiNCC();
    });
  }*/

  @override
  Widget build(BuildContext context) {
    return DefaultTextStyle.merge(
      style: const TextStyle(
        decoration: TextDecoration.none, // 🔥 reset underline
      ),
      child: _buildContent(context),
    );
  }

  void _extractDiemDiVaDiemDen() {
    try {
      if (controller.currentChuyenXe?['field_cuoc_van_chuyen_khach_hang'] == null) return;

      final List<dynamic> cuocList = controller.currentChuyenXe?['field_cuoc_van_chuyen_khach_hang'] is String
          ? jsonDecode(controller.currentChuyenXe?['field_cuoc_van_chuyen_khach_hang'])
          : controller.currentChuyenXe?['field_cuoc_van_chuyen_khach_hang'];

      if (cuocList.isEmpty) return;

      // ✅ Lấy danh sách điểm đi duy nhất
      final Set<String> diemDiSet = {};
      for (final item in cuocList) {
        if (item is Map && item["Điểm đi"] != null) {
          diemDiSet.add(item["Điểm đi"].toString().trim());
        }
      }

      // ✅ Lấy danh sách trọng tải (các key khác ngoài 3 key cố định)
      final Map<String, dynamic> firstRow =
      cuocList.firstWhere((e) => e is Map, orElse: () => {});
      final List<String> keys = firstRow.keys
          .where((k) => k != "Điểm đi" && k != "Điểm đến cũ" && k != "Điểm đến mới")
          .toList();

      // ✅ Nếu đã có điểm đi của chuyến xe, lọc danh sách điểm đến tương ứng
      List<String> diemDen = [];
      print('diemDiCtrl.text ${diemDiCtrl.text}');
      if (diemDiCtrl.text.isNotEmpty) {
        final Set<String> diemDenSet = {};
        for (final item in cuocList) {
          if (item is Map &&
              item["Điểm đi"] == diemDiCtrl.text &&
              item["Điểm đến mới"] != null) {
            diemDenSet.add(item["Điểm đến mới"].toString().trim());
          }
        }
        diemDen = diemDenSet.toList();
      }

      setState(() {
        diemDiList = diemDiSet.toList();
        diemDenList = diemDen;
        trongTaiList = keys; // ✅ gán danh sách trọng tải
      });

    } catch (e) {
      debugPrint("⚠️ Lỗi phân tích field_cuoc_van_tai: $e");
    }
  }

  void _extractDiemDenTheoDiemDi(String diemDiChon) {
    try {
      final List<dynamic> cuocList = controller.currentChuyenXe?['field_cuoc_van_chuyen_khach_hang'] is String
          ? jsonDecode(controller.currentChuyenXe?['field_cuoc_van_chuyen_khach_hang'])
          : controller.currentChuyenXe?['field_cuoc_van_chuyen_khach_hang'];

      final Set<String> diemDenSet = {};
      for (final item in cuocList) {
        if (item is Map && item["Điểm đi"] == diemDiChon && item["Điểm đến mới"] != null) {
          diemDenSet.add(item["Điểm đến mới"].toString().trim());
        }
      }
      setState(() {
        diemDenList = diemDenSet.toList();
      });
    } catch (e) {
      debugPrint("⚠️ Lỗi lọc điểm đến theo điểm đi: $e");
    }
  }

  Widget _buildContent(BuildContext context) {
    return Scaffold(
        body: MyContainer(
            paddingAll: 16,
            child: Stack(
              children: [
                SingleChildScrollView(
                  child: Column(
                    children: [
                      Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 7,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // 🔹 Thanh tiêu đề phụ gồm nút quay lại và trạng thái
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      TextButton.icon(
                                        icon: const Icon(Icons.arrow_back),
                                        label: const Text("Quay lại danh sách"),
                                        onPressed: () {
                                          controller.clearCurrentChuyenXe();

                                          Get.until((route) => route.settings.name == '/chuyen-xe');
                                        },
                                      ),

                                      // 🟩 Trạng thái chuyến xe
                                      if (controller.currentChuyenXe?['field_trang_thai'] != null)
                                        Container(
                                          margin: const EdgeInsets.only(left: 8),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                          decoration: BoxDecoration(
                                            color: Utils.getStatusBackground(controller.currentChuyenXe?['field_trang_thai']),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(
                                              color: Utils.getStatusColor(controller.currentChuyenXe?['field_trang_thai']),
                                              width: 0.8,
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                Utils.getStatusIcon(controller.currentChuyenXe?['field_trang_thai']),
                                                color: Utils.getStatusColor(controller.currentChuyenXe?['field_trang_thai']),
                                                size: 14,
                                              ),
                                              const SizedBox(width: 5),
                                              Text(
                                                controller.currentChuyenXe?['field_trang_thai'] ?? "-",
                                                style: TextStyle(
                                                  fontWeight: FontWeight.w600,
                                                  fontSize: 14,
                                                  color: Utils.getStatusColor(controller.currentChuyenXe?['field_trang_thai']),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 10),

                                  // ====================== 🟩 THÔNG TIN CƠ BẢN ======================
                                  const Text(
                                    "🚚 Thông tin cơ bản",
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  // 1️⃣ Dòng 1: Khách hàng, Điểm đi, Điểm đến, Trọng tải
                                  Row(
                                    children: [
                                      // 🔹 Dropdown Khách hàng
                                      Expanded(
                                        child: MyDropdownField(
                                          label: "Khách hàng",
                                          value: controller.currentChuyenXe?["khach_hang"]?["nid"]?.toString(),
                                          options: khachHangList.map((e) => e["nid"].toString()).toList(),
                                          displayBuilder: (id) {
                                            final m = khachHangList.firstWhereOrNull(
                                                  (e) => e["nid"].toString() == id,
                                            );
                                            return m?["text"] ?? "-";
                                          },
                                          onChanged: (v) async {
                                            if (v == null) return;

                                            // 🌀 Loading nhỏ
                                            Get.dialog(
                                              const Center(child: CircularProgressIndicator()),
                                              barrierDismissible: false,
                                            );

                                            // 🔹 Gọi API chi tiết khách hàng
                                            final khachHangDetail = await controller.loadKhachHangDetail(v);
                                            Get.back(); // đóng loading

                                            if (khachHangDetail == null) {
                                              AppToast.error("Không lấy được thông tin khách hàng");
                                              return;
                                            }

                                            setState(() {
                                              // ✅ Cập nhật khách hàng cho chuyến xe
                                              controller.currentChuyenXe!["field_khach_hang_ref"] = khachHangDetail["ten_khach_hang"] ?? "";
                                              controller.currentChuyenXe!["khach_hang"] = {
                                                "nid": khachHangDetail["nid"],
                                                "ten_khach_hang": khachHangDetail["ten_khach_hang"] ?? "",
                                                "dien_thoai": khachHangDetail["dien_thoai"],
                                              };
                                              controller.currentChuyenXe!['field_cuoc_van_chuyen_khach_hang'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_cuoc_van_tai'];
                                              // ✅ LƯU TOÀN BỘ CẤU HÌNH KHÁCH HÀNG
                                              controller.currentChuyenXe!["field_thong_tin_json_khach_hang"]['field_phi_hai_quan'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_phi_hai_quan'];
                                              controller.currentChuyenXe!["field_thong_tin_json_khach_hang"]['field_phi_bao_hiem'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_phi_bao_hiem'];
                                              controller.currentChuyenXe!["field_thong_tin_json_khach_hang"]['field_phi_luu_ca'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_phi_luu_ca'];
                                              controller.currentChuyenXe!["field_thong_tin_json_khach_hang"]['field_phi_cung_tinh_khac_tuyen'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_phi_cung_tinh_khac_tuyen'];
                                              controller.currentChuyenXe!["field_thong_tin_json_khach_hang"]['field_phi_hang_nang'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_phi_hang_nang'];
                                              controller.currentChuyenXe!["field_thong_tin_json_khach_hang"]['field_phi_cung_tuyen_khac_tinh'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_phi_cung_tuyen_khac_tinh'];
                                              controller.currentChuyenXe!["field_thong_tin_json_khach_hang"]['field_cau_hinh_gio_luu_ca'] = khachHangDetail['field_thong_tin_json_khach_hang']['field_cau_hinh_gio_luu_ca'];

                                              print('cuoc van tai moi ${controller.currentChuyenXe!['field_cuoc_van_chuyen_khach_hang']}');
                                            });
                                            _extractDiemDiVaDiemDen();
                                            // 🔁 Re-calc các phí phụ thuộc KH
                                            _tinhCuocXe();
                                            _fillHaiQuanControllers();
                                            _tinhPhiLuuCa();
                                            _fillBaoHiemControllersTheoTrongTai();
                                          },
                                        ),
                                      ),

                                      const SizedBox(width: 8),

                                      // 🔹 Dropdown Điểm đi
                                      Expanded(
                                        child: MyDropdownField(
                                          label: "Điểm đi",
                                          value: controller.currentChuyenXe?["field_thong_tin_json"]?["diem_di"],
                                          options: diemDiList,
                                          onChanged: (v) {
                                            setState(() {
                                              controller.currentChuyenXe?["field_thong_tin_json"]?["diem_di"] = v;
                                              diemDenCtrl.text = ''; // reset khi đổi điểm đi
                                              controller.currentChuyenXe?["field_thong_tin_json"]?["diem_den"] = '';
                                              diemDiCtrl.text = v!;
                                              diemDenList = [];
                                              _extractDiemDenTheoDiemDi(v);
                                            });
                                            _tinhCuocXe();
                                            _fillHaiQuanControllers();
                                          },
                                        ),
                                      ),

                                      const SizedBox(width: 8),

                                      // 🔹 Dropdown Điểm đến
                                      Expanded(
                                        child: MyDropdownField(
                                          label: "Điểm đến",
                                          value: controller.currentChuyenXe?["field_thong_tin_json"]?["diem_den"],
                                          options: diemDenList,
                                          onChanged: (v) {
                                            setState(() {
                                              controller.currentChuyenXe?["field_thong_tin_json"]?["diem_den"] = v;
                                              diemDenCtrl.text = v ?? "";
                                            });
                                            // ✅ Khi thay đổi điểm đến → tính lại cước nếu đã bật
                                            _tinhCuocXe();
                                          },
                                        ),
                                      ),

                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: MyDropdownField(
                                          label: "Trọng tải",
                                          value: trongTaiList.contains(
                                            controller.currentChuyenXe?["field_thong_tin_json"]?["trong_tai"],
                                          )
                                              ? controller.currentChuyenXe?["field_thong_tin_json"]?["trong_tai"]
                                              : null,
                                          options: trongTaiList,
                                          onChanged: (v) {
                                            if (v == null) return;

                                            setState(() {
                                              controller.currentChuyenXe?["field_thong_tin_json"]?["trong_tai"] = v;
                                              trongTaiCtrl.text = v;
                                            });

                                            // Các chi phí phụ thuộc trọng tải
                                            _tinhCuocXe();
                                            _tinhPhiQuaKhoQuaTai();
                                            _fillBaoHiemControllersTheoTrongTai();
                                            _fillHaiQuanControllers();
                                            _tinhPhiLuuCa();
                                            _recalculateAllTraThemDiemByTrongTai();
                                          },
                                        ),
                                      ),

                                    ],
                                  ),

                                  XeInfoForm(
                                    json: controller.currentChuyenXe!,
                                    index: 0,
                                    tag: 'form-sua-chuyen-xe', // ✅ Truyền tag vào
                                    onXeChanged: (xe, isXeNha) {
                                      print('xe ${xe}');
                                      if (xe["bks"] != null) bksCtrl.text = xe["bks"];
                                      if (xe["loai_xe"] != null) trongTaiCtrl.text = xe["loai_xe"];

                                      controller.currentChuyenXe!['field_thong_tin_json']['xe_nha'] = isXeNha ? xe : null;
                                      controller.currentChuyenXe!['field_thong_tin_json']['xe_ngoai'] = isXeNha ? null : xe;

                                      controller.fetchThongTinNhaXe(
                                        xe: xe,
                                        isXeNha: isXeNha,
                                      );
                                      _fillHaiQuanControllers();
                                      _fillBaoHiemControllersTheoTrongTai();
                                      _commitCuocXe();
                                      _commitPhiQuaKhoQuaTai();
                                      _commitLuuCa();
                                      _recalculateAllTraThemDiemByTrongTai();
                                    },
                                  ),

                                  // Dòng 2
                              const SizedBox(height:20),
                              // 3️⃣ Dòng 3: Thời gian + dịch vụ
                                  Row(children:[
                                    Expanded(
                                      flex: 2,
                                      child: DatePickerField(
                                        label: "Ngày VC",
                                        initialDate: ngayVanChuyenCtrl.text.isNotEmpty
                                            ? ngayVanChuyenCtrl.text
                                            : null,
                                        onDateSelected: (v) {
                                          // ✅ Cập nhật controller khi chọn ngày
                                          setState(() => ngayVanChuyenCtrl.text = v ?? '');
                                          controller.currentChuyenXe?["field_thong_tin_json"]?["ngay_van_chuyen"] = v ?? '';
                                          controller.currentChuyenXe?["ngay_van_chuyen"] = v ?? '';
                                          controller.currentChuyenXe?["field_ngay_van_chuyen"] = v ?? '';
                                          _tinhPhiLuuCa();
                                          // _tinhPhiLuuCaNCC()
                                        },
                                        readOnly: false, // Cho phép mở hộp thoại chọn ngày
                                      ),
                                    ),
                                    const SizedBox(width:8),
                                    Expanded(
                                      flex: 2,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          // 🔹 Trường ngày giờ giao hàng
                                          MyDateTimeField(
                                            label: "Ngày & giờ giao hàng",
                                            controller: ngayGioTraHangCtrl,
                                            onChanged: (v) {
                                              (controller.currentChuyenXe!["field_thong_tin_json"] as Map)["ngay_gio_luu_ca"] = v ?? '';
                                              _tinhPhiLuuCa();
                                            },
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(width:8),
                                    Expanded(
                                      flex:7,
                                      child: Wrap(
                                        spacing:6,
                                        runSpacing:6,
                                        children:[
                                          FilterChip(
                                            label: const Text("Bảo hiểm"),
                                            selected: toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["bao_hiem"]),
                                            onSelected: (selected) {
                                              // Dùng post-frame để tránh conflict với build()
                                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                                if (!mounted) return;
                                                setState(() {
                                                  controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["bao_hiem"] = selected;
                                                  // controller.currentChuyenXe?["field_thong_tin_json"]?["phi_bao_hiem"] = selected ? (controller.currentChuyenXe!["field_thong_tin_json"]["phi_bao_hiem"] ?? 0) : 0;
                                                  if (selected) {
                                                    _fillBaoHiemControllersTheoTrongTai();
                                                  }
                                                  else {
                                                    // ❌ Nếu bỏ chọn → reset toàn bộ dữ liệu bảo hiểm
                                                    controller.currentChuyenXe?["field_thong_tin_json"]?["phi_bao_hiem"] = 0;
                                                    controller.currentChuyenXe?["field_thong_tin_json"]?['chi_phi_ncc']["phi_bao_hiem"] = 0;
                                                  }

                                                  /*_tinhPhiBaoHiemNCC();*/
                                                });
                                              });
                                            },
                                          ),

                                          FilterChip(
                                            label: const Text("Cước xe"),
                                            selected: controller.currentChuyenXe?["field_thong_tin_json"]["dich_vu"]?["cuoc_xe"] == true,
                                            onSelected: (selected) {
                                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                                if (!mounted) return;
                                                setState(() {
                                                  controller.currentChuyenXe?["field_thong_tin_json"]?["dich_vu"]?["cuoc_xe"] = selected;
                                                  if (selected) {
                                                    // ✅ Tính lại cước xe từ hành trình và trọng tải
                                                    _tinhCuocXe();
                                                  } else {
                                                    controller.currentChuyenXe?["field_thong_tin_json"]["phi_cuoc_xe"] = 0;
                                                    controller.currentChuyenXe?["field_thong_tin_json"]?['chi_phi_ncc']["phi_cuoc_xe"] = 0;

                                                    phiCuocXeCtrl.text = "0";
                                                  }
                                                });
                                              });
                                            },
                                          ),

                                          FilterChip(
                                            label: const Text("Hải quan"),
                                            selected: toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["hai_quan"]),
                                            onSelected: (selected) {
                                              // Dùng post-frame để tránh conflict với rebuild
                                              WidgetsBinding.instance.addPostFrameCallback((_) {
                                                if (!mounted) return;

                                                setState(() {
                                                  // 🔹 Đảm bảo luôn tồn tại key "dich_vu"
                                                  controller.currentChuyenXe?["field_thong_tin_json"]?["dich_vu"]?["hai_quan"] = selected;
                                                  if (selected) {
                                                    _fillHaiQuanControllers();
                                                    tinhTongPhiHaiQuan();
                                                  }
                                                  else {
                                                    controller.currentChuyenXe?["field_thong_tin_json"]?["phi_hai_quan"] = 0;
                                                    controller.currentChuyenXe?["field_thong_tin_json"]?['chi_phi_ncc']["phi_hai_quan"] = 0;
                                                  }
                                                });
                                                // _tinhPhiHaiQuanNCC();
                                              });

                                            },
                                          ),

                                          FilterChip(
                                            label: const Text("Hàng thường"),
                                            selected: controller.currentChuyenXe?["field_thong_tin_json"]?["dich_vu"]?["hang_thuong"],
                                            onSelected: (selected) {
                                              setState(() {
                                                controller.currentChuyenXe?["field_thong_tin_json"]?["dich_vu"]?["hang_thuong"] = selected;
                                                _fillBaoHiemControllersTheoTrongTai();
                                              });
                                            },
                                          ),

                                          FilterChip(
                                            label: const Text("Quá tải"),
                                            selected: controller.currentChuyenXe?["field_thong_tin_json"]?["dich_vu"]?["qua_kho_qua_tai"] == true,
                                            onSelected: (selected) {
                                              setState(() {
                                                controller.currentChuyenXe?["field_thong_tin_json"]?["dich_vu"]?["qua_kho_qua_tai"] = selected;

                                                if (selected) {
                                                  _tinhPhiQuaKhoQuaTai();
                                                } else {
                                                  controller.currentChuyenXe?["field_thong_tin_json"]?["qua_kho_qua_tai"] = 0;
                                                  controller.currentChuyenXe?["field_thong_tin_json"]?['chi_phi_ncc']["qua_kho_qua_tai"] = 0;
                                                }
                                              });
                                            },
                                          ),

                                        ],
                                      ),
                                    ),
                                  ]),
                                ],
                              ),
                            ),
                            SizedBox(width: 20,),
                            Expanded(
                              flex: 3,
                              child: Column(
                                children: [
                                  // ================== 🟦 CỘT PHẢI: TỔNG HỢP Chi phí khách hàng ==================
                              Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                border: Border.all(color: Colors.grey.shade300),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  const Text(
                                    "💰 Chi phí",
                                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                  const SizedBox(height: 12),

                                  // 🔹 Header
                                  Row(
                                    children: const [
                                      Expanded(flex: 4, child: Text("Tên chi phí", style: TextStyle(fontWeight: FontWeight.bold))),
                                      Expanded(flex: 3, child: Text("Cước bán", textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold))),
                                      Expanded(flex: 3, child: Text("Cước nhập", textAlign: TextAlign.right, style: TextStyle(fontWeight: FontWeight.bold))),
                                    ],
                                  ),
                                  const Divider(),

                                  _cost3ColRow(
                                    label: "Cước xe",
                                    giaBan: controller.currentChuyenXe!['field_thong_tin_json']["phi_cuoc_xe"] ?? 0,
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_cuoc_xe"] ?? 0,
                                  ),

                                  _cost3ColRow(
                                    label: "Phí bảo hiểm",
                                    giaBan: controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]?['bao_hiem'] == true ? (controller.currentChuyenXe!['field_thong_tin_json']["phi_bao_hiem"] ?? 0) : 0,
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_bao_hiem"] ?? 0,
                                  ),

                                  _cost3ColRow(
                                    label: "Phí hải quan",
                                    giaBan: toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]?["hai_quan"]) ? (controller.currentChuyenXe!['field_thong_tin_json']["phi_hai_quan"] ?? 0) : 0,
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_hai_quan"] ?? 0,
                                  ),

                                  _cost3ColRow(
                                    label: "Phí lưu ca",
                                    giaBan: controller.currentChuyenXe!['field_thong_tin_json']["phi_luu_ca"] ?? 0,
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_luu_ca"] ?? 0,
                                  ),

                                  _cost3ColRow(
                                    label: "Trả thêm điểm",
                                    giaBan: controller.currentChuyenXe!['field_thong_tin_json']["tra_them_diem_total"] ?? 0,
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["tra_them_diem_total"] ?? 0,
                                  ),

                                  _cost3ColRow(
                                    label: "Phí quá khổ / quá tải",
                                    giaBan: toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]?["qua_kho_qua_tai"]) ? (controller.currentChuyenXe!['field_thong_tin_json']["qua_kho_qua_tai"] ?? 0) : 0,
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["qua_kho_qua_tai"] ?? 0,
                                  ),

                                  _cost3ColRow(
                                    label: "Vé cao tốc",
                                    giaBan: (controller.currentChuyenXe!['field_thong_tin_json']["ve_cao_toc"] ?? 0),
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["ve_cao_toc"] ?? 0,
                                  ),
                                  _cost3ColRow(
                                    label: "Phí phát sinh",
                                    giaBan: (controller.currentChuyenXe!['field_thong_tin_json']["phi_phat_sinh"] ?? 0),
                                    giaNhap: controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_phat_sinh"] ?? 0,
                                  ),

                                  const Divider(thickness: 1.2),

                                  // 🔥 TỔNG
                                  _cost3ColRow(
                                    label: "TỔNG TIỀN",
                                    giaBan:
                                    (controller.currentChuyenXe!['field_thong_tin_json']["phi_cuoc_xe"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']["phi_bao_hiem"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']["tra_them_diem_total"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']["ve_cao_toc"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']["phi_phat_sinh"] ?? 0) +
                                        (toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]?["hai_quan"]) ? (controller.currentChuyenXe!['field_thong_tin_json']["phi_hai_quan"] ?? 0) : 0) +
                                        (toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]?["qua_kho_qua_tai"]) ? (controller.currentChuyenXe!['field_thong_tin_json']["qua_kho_qua_tai"] ?? 0) : 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']["phi_luu_ca"] ?? 0),
                                    giaNhap:
                                    (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_cuoc_xe"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_bao_hiem"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_hai_quan"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["tra_them_diem_total"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["qua_kho_qua_tai"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["ve_cao_toc"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_phat_sinh"] ?? 0) +
                                        (controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["phi_luu_ca"] ?? 0),
                                    bold: true,
                                    labelColor: Colors.redAccent,
                                  ),
                                ],
                              ),
                            )
                                ],
                              ),
                            ),
                          ]
                      ),

                      Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: isTinhPhiKhach
                              ? Colors.blue.shade50   // 🔵 Khách trả
                              : Colors.green.shade50, // 🟢 NCC
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isTinhPhiKhach ? Colors.blue.shade200 : Colors.green.shade200,
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(30), // 🔥 padding trong 30
                          child: Column(
                            children: [
                              Row(
                                children: [
                                  ChoiceChip(
                                    selected: isTinhPhiKhach,
                                    selectedColor: Colors.blue.shade400,
                                    backgroundColor: Colors.blue.shade100,
                                    label: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (isTinhPhiKhach)
                                          const Icon(Icons.check_circle,
                                              size: 18, color: Colors.white),
                                        if (isTinhPhiKhach) const SizedBox(width: 6),
                                        Text(
                                          "Tính phí khách trả",
                                          style: TextStyle(
                                            color: isTinhPhiKhach
                                                ? Colors.white
                                                : Colors.blue.shade800,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    onSelected: (_) {
                                      setState(() => isTinhPhiKhach = true);
                                      _commitChangeVeCaoTocPhiPhatSinh();
                                      _fillHaiQuanControllers();
                                      _fillBaoHiemControllersTheoTrongTai();
                                      _commitCuocXe();
                                      _commitPhiQuaKhoQuaTai();
                                      _commitLuuCa();
                                      _recalculateAllTraThemDiemByTrongTai();

                                    },
                                  ),

                                  const SizedBox(width: 12),

                                  ChoiceChip(
                                    selected: !isTinhPhiKhach,
                                    selectedColor: Colors.green.shade400,
                                    backgroundColor: Colors.green.shade100,
                                    label: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        if (!isTinhPhiKhach)
                                          const Icon(Icons.check_circle,
                                              size: 18, color: Colors.white),
                                        if (!isTinhPhiKhach) const SizedBox(width: 6),
                                        Text(
                                          "Tính phí NCC",
                                          style: TextStyle(
                                            color: !isTinhPhiKhach
                                                ? Colors.white
                                                : Colors.green.shade800,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                    onSelected: (_) {
                                      setState(() => isTinhPhiKhach = false);
                                      _commitChangeVeCaoTocPhiPhatSinh();
                                      _fillHaiQuanControllers();
                                      _fillBaoHiemControllersTheoTrongTai();
                                      _commitCuocXe();
                                      _commitPhiQuaKhoQuaTai();
                                      _commitLuuCa();
                                      // print('phi them ncc ${controller.currentChuyenXe!['field_thong_tin_json']['tra_them_diem']}');
                                      _recalculateAllTraThemDiemByTrongTai();
                                    },
                                  ),
                                ],
                              ),
                              const SizedBox(height:20),
                              // 3️⃣ Dòng 4: Phí lưu ca, quá khổ quá tải, vé cao tốc, phí phát sinh khác
                              Row(
                                children: [
                                  SizedBox(
                                    width: 120,
                                    child: Focus(
                                      onFocusChange: (hasFocus) {
                                        if (!hasFocus) {
                                          setState(() {
                                            if(isTinhPhiKhach){
                                              controller.currentChuyenXe?['field_thong_tin_json']?['ve_cao_toc'] = double.tryParse(_phiVeCaoTocCtrl.text.replaceAll('.',''));
                                            }else{
                                              controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['ve_cao_toc'] = double.tryParse(_phiVeCaoTocCtrl.text.replaceAll('.',''));
                                            }
                                          });
                                        }
                                      },
                                      child: TextField(
                                        controller: _phiVeCaoTocCtrl,
                                        keyboardType: TextInputType.number,
                                        textAlign: TextAlign.right,
                                        inputFormatters: [ThousandsSeparatorInputFormatter()],
                                        decoration: const InputDecoration(
                                          labelText: "Vé cao tốc",
                                          floatingLabelBehavior: FloatingLabelBehavior.always,
                                          border: OutlineInputBorder(),
                                          isDense: true,
                                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                        ),
                                        onEditingComplete: () {
                                          FocusScope.of(context).unfocus();
                                          setState(() {
                                            if(isTinhPhiKhach){
                                              controller.currentChuyenXe?['field_thong_tin_json']?['ve_cao_toc'] = double.tryParse(_phiVeCaoTocCtrl.text.replaceAll('.',''));
                                            }else{
                                              controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['ve_cao_toc'] = double.tryParse(_phiVeCaoTocCtrl.text.replaceAll('.',''));
                                            }
                                          });
                                        },
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 20),

                                  SizedBox(
                                    width: 120,
                                    child: Focus(
                                      onFocusChange: (hasFocus) {
                                        if (!hasFocus) {
                                          setState(() {
                                            if(isTinhPhiKhach){
                                              controller.currentChuyenXe?['field_thong_tin_json']?['phi_phat_sinh'] = double.tryParse(_phiPhatSinhKhacCtrl.text.replaceAll('.',''));
                                            }else{
                                              controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_phat_sinh'] = double.tryParse(_phiPhatSinhKhacCtrl.text.replaceAll('.',''));
                                            }
                                          });
                                        }
                                      },
                                      child: TextField(
                                        controller: _phiPhatSinhKhacCtrl,
                                        keyboardType: TextInputType.number,
                                        textAlign: TextAlign.right,
                                        inputFormatters: [ThousandsSeparatorInputFormatter()],
                                        decoration: const InputDecoration(
                                          labelText: "Phí phát sinh",
                                          floatingLabelBehavior: FloatingLabelBehavior.always,
                                          border: OutlineInputBorder(),
                                          isDense: true,
                                          contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                        ),
                                        onEditingComplete: () {
                                          FocusScope.of(context).unfocus();
                                          setState(() {
                                            if(isTinhPhiKhach){
                                              controller.currentChuyenXe?['field_thong_tin_json']?['phi_phat_sinh'] = double.tryParse(_phiPhatSinhKhacCtrl.text.replaceAll('.',''));
                                            }else{
                                              controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_phat_sinh'] = double.tryParse(_phiPhatSinhKhacCtrl.text.replaceAll('.',''));
                                            }
                                          });
                                        },
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 20),

                                  // 🚚 CƯỚC XE
                                  if (toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]?["cuoc_xe"])) ...[
                                    SizedBox(
                                      width: 120,
                                      child: Focus(
                                        onFocusChange: (hasFocus) {
                                          if (!hasFocus) {
                                            setState(() {
                                              if(isTinhPhiKhach){
                                                controller.currentChuyenXe?['field_thong_tin_json']?['phi_cuoc_xe'] = double.tryParse(_phiCuocXeCtrl.text.replaceAll('.',''));
                                              }else{
                                                controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_cuoc_xe'] = double.tryParse(_phiCuocXeCtrl.text.replaceAll('.',''));
                                              }
                                            });
                                          }
                                        },
                                        child: TextField(
                                          controller: _phiCuocXeCtrl,
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.right,
                                          inputFormatters: [ThousandsSeparatorInputFormatter()],
                                          decoration: const InputDecoration(
                                            labelText: "Cước xe",
                                            floatingLabelBehavior: FloatingLabelBehavior.always,
                                            border: OutlineInputBorder(),
                                            isDense: true,
                                            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                          ),
                                          onEditingComplete: () {
                                            FocusScope.of(context).unfocus();
                                            setState(() {
                                              if(isTinhPhiKhach){
                                                controller.currentChuyenXe?['field_thong_tin_json']?['phi_cuoc_xe'] = double.tryParse(_phiCuocXeCtrl.text.replaceAll('.',''));
                                              }else{
                                                controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_cuoc_xe'] = double.tryParse(_phiCuocXeCtrl.text.replaceAll('.',''));
                                              }
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 20),
                                  ],
                                  if (toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["qua_kho_qua_tai"])) ...[
                                    SizedBox(
                                      width: 120,
                                      child: Focus(
                                        onFocusChange: (hasFocus) {
                                          if (!hasFocus) {
                                            setState(() {
                                              if(isTinhPhiKhach){
                                                controller.currentChuyenXe?['field_thong_tin_json']?['qua_kho_qua_tai'] = double.tryParse(_quaKhoQuaTaiCtrl.text.replaceAll('.',''));
                                              }else{
                                                controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['qua_kho_qua_tai'] = double.tryParse(_quaKhoQuaTaiCtrl.text.replaceAll('.',''));
                                              }
                                            });
                                          }
                                        },
                                        child: TextField(
                                          controller: _quaKhoQuaTaiCtrl,
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.right,
                                          inputFormatters: [ThousandsSeparatorInputFormatter()],
                                          decoration: const InputDecoration(
                                            labelText: "Phí Quá khổ quá tải",
                                            floatingLabelBehavior: FloatingLabelBehavior.always,
                                            border: OutlineInputBorder(),
                                            isDense: true,
                                            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                          ),
                                          onEditingComplete: () {
                                            // Optional: Enter key
                                            FocusScope.of(context).unfocus();
                                            setState(() {
                                              if(isTinhPhiKhach){
                                                controller.currentChuyenXe?['field_thong_tin_json']?['qua_kho_qua_tai'] = double.tryParse(_quaKhoQuaTaiCtrl.text.replaceAll('.',''));
                                              }else{
                                                controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['qua_kho_qua_tai'] = double.tryParse(_quaKhoQuaTaiCtrl.text.replaceAll('.',''));
                                              }
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                    SizedBox(width: 20,)
                                  ],
                                  if (controller.currentChuyenXe!['field_thong_tin_json']["phi_luu_ca"] > 0) ...[
                                    SizedBox(
                                      width: 120,
                                      child: Focus(
                                        onFocusChange: (hasFocus) {
                                          if (!hasFocus) {
                                            setState(() {
                                              if(isTinhPhiKhach){
                                                controller.currentChuyenXe?['field_thong_tin_json']?['phi_luu_ca'] = double.tryParse(_phiLuuCaCtrl.text.replaceAll('.',''));
                                              }else{
                                                controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_luu_ca'] = double.tryParse(_phiLuuCaCtrl.text.replaceAll('.',''));
                                              }
                                            });
                                          }
                                        },
                                        child: TextField(
                                          controller: _phiLuuCaCtrl,
                                          keyboardType: TextInputType.number,
                                          textAlign: TextAlign.right,
                                          inputFormatters: [ThousandsSeparatorInputFormatter()],
                                          decoration: const InputDecoration(
                                            labelText: "Phí lưu ca",
                                            floatingLabelBehavior: FloatingLabelBehavior.always,
                                            border: OutlineInputBorder(),
                                            isDense: true,
                                            contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                          ),
                                          onEditingComplete: () {
                                            // Bắt phím Enter / Done
                                            FocusScope.of(context).unfocus();
                                            setState(() {
                                              if(isTinhPhiKhach){
                                                controller.currentChuyenXe?['field_thong_tin_json']?['phi_luu_ca'] = double.tryParse(_phiLuuCaCtrl.text.replaceAll('.',''));
                                              }else{
                                                controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_luu_ca'] = double.tryParse(_phiLuuCaCtrl.text.replaceAll('.',''));
                                              }
                                            });
                                          },
                                        ),
                                      ),
                                    ),
                                  ],
                                  const SizedBox(width: 20),

                                  // 4️⃣ Khối bảo hiểm (ẩn/hiện)
                                  if (toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["bao_hiem"])) ...[
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Align(
                                          alignment: Alignment.centerLeft,
                                          child: Text(
                                            "💰 Thông tin chi phí bảo hiểm",
                                            style: TextStyle(
                                              fontWeight: FontWeight.bold,
                                              fontSize: 15,
                                              color: Colors.teal.shade700,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(height: 12),

                                        // 🔹 Lọc danh sách hạng mục hiển thị theo loại hàng
                                        // (Nếu chọn Hàng thường → chỉ hiện Hàng thông thường; ngược lại chỉ hiện Hàng Quá Cảnh)
                                        Builder(builder: (context) {
                                          final baoHiemTheoXe = isTinhPhiKhach ? _getBaoHiemTheoTrongTai(controller.currentChuyenXe?['field_thong_tin_json_khach_hang']['field_phi_bao_hiem'])
                                          :  _getBaoHiemTheoTrongTai(controller.currentChuyenXe?['field_thong_tin_json_ncc']['field_phi_bao_hiem']);

                                          final filteredEntries = baoHiemTheoXe?.entries.where((entry) {
                                            final key = entry.key.toString();
                                            if (toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["hang_thuong"])) {
                                              // ✅ Nếu chọn hàng thường → chỉ hiển thị mục "Hàng thông thường"
                                              return key == "Hàng thông thường" || !key.contains("Hàng Quá Cảnh");
                                            } else {
                                              // ✅ Nếu KHÔNG chọn hàng thường → chỉ hiển thị mục "Hàng Quá Cảnh"
                                              return key == "Hàng Quá Cảnh" || !key.contains("Hàng thông thường");
                                            }
                                          }).toList();

                                          return Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              SingleChildScrollView(
                                                scrollDirection: Axis.horizontal,
                                                child: Row(
                                                  children: filteredEntries!.map((entry) {
                                                    final key = entry.key;
                                                    final textCtrl = _controllersBaoHiem.putIfAbsent(
                                                      key,
                                                          () => TextEditingController(
                                                        text: NumberFormat('#,##0', 'vi_VN')
                                                            .format(double.tryParse(entry.value.toString()) ?? 0),
                                                      ),
                                                    );

                                                    return Padding(
                                                      padding: const EdgeInsets.only(right: 5),
                                                      child: SizedBox(
                                                        width: 100,
                                                        child: Focus(
                                                          onFocusChange: (hasFocus) {
                                                            if (!hasFocus) _updateFormBaoHiemKhachChange();
                                                          },
                                                          child: TextField(
                                                            textAlign: TextAlign.right, // ✅ CĂN PHẢI CHỮ NHẬP
                                                            controller: textCtrl,
                                                            keyboardType: TextInputType.number,
                                                            inputFormatters: [ThousandsSeparatorInputFormatter()],
                                                            decoration: InputDecoration(
                                                              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                                              labelText: key,
                                                              labelStyle: const TextStyle(
                                                                fontSize: 14,
                                                              ),
                                                              border: const OutlineInputBorder(),
                                                              isDense: true,
                                                            ),
                                                            onEditingComplete: () {
                                                              FocusScope.of(context).unfocus();
                                                              _updateFormBaoHiemKhachChange();
                                                            },
                                                          ),
                                                        ),
                                                      ),
                                                    );
                                                  }).toList(),
                                                ),
                                              ),

                                              const SizedBox(height: 8),

                                              Align(
                                                alignment: Alignment.centerRight,
                                                child: Text(
                                                  "Tổng phí bảo hiểm: ${NumberFormat('#,##0', 'vi_VN').format(
                                                     isTinhPhiKhach ? controller.currentChuyenXe!['field_thong_tin_json']['phi_bao_hiem'] :  controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_bao_hiem']
                                                  )} ₫",
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.teal,
                                                    fontSize: 15,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          );
                                        }),
                                      ],
                                    )

                                  ],
                                ],
                              ),

                              // 5️⃣ Khối hải quan (ẩn/hiện)
                              if ((toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["hai_quan"]))) ...[
                                const SizedBox(height: 12),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: Text(
                                    "💰 Thông tin chi phí hải quan",
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                      color: Colors.orange.shade700,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 12),

                                LayoutBuilder(
                                  builder: (context, constraints) {
                                    const int itemsPerRow = 12;
                                    const double spacing = 8;

                                    final double totalSpacing = spacing * (itemsPerRow - 1);
                                    final double itemWidth =
                                        (constraints.maxWidth - totalSpacing) / itemsPerRow;


                                    final String? trongTai = controller.currentChuyenXe!['field_thong_tin_json']['trong_tai'];

                                    final String? diemDi = controller.currentChuyenXe!['field_thong_tin_json']['diem_di'];

                                    final List<dynamic> danhSachHaiQuan = isTinhPhiKhach ? controller.currentChuyenXe?['field_thong_tin_json_khach_hang']?['field_phi_hai_quan'] : controller.currentChuyenXe?['field_thong_tin_json_ncc']?['field_phi_hai_quan'];

                                    // 🔥 Lọc theo cửa khẩu + có dữ liệu trọng tải
                                    final filtered = danhSachHaiQuan.where((e) {
                                      if (e is! Map) return false;
                                      if (diemDi != null && e['Cửa khẩu'] != diemDi) return false;
                                      return trongTai != null && e.containsKey(trongTai);
                                    }).toList();

                                    return Wrap(
                                      spacing: spacing,
                                      runSpacing: 16,
                                      children: filtered.map<Widget>((item) {
                                        final String label = item['Chi phí']?.toString() ?? '';
                                        final dynamic rawValue = trongTai != null ? item[trongTai] : 0;

                                        final String displayValue =
                                        rawValue == null ? '' : rawValue.toString();

                                        final textCtrl = _controllersHaiQuan.putIfAbsent(
                                          label,
                                              () => TextEditingController(
                                            text: NumberFormat('#,##0', 'vi_VN').format(
                                              double.tryParse(
                                                displayValue.replaceAll(RegExp(r'[^0-9]'), ''),
                                              ) ??
                                                  0,
                                            ),
                                          ),
                                        );

                                        return SizedBox(
                                          width: itemWidth, // 🔥 chính xác 1/8 dòng
                                          child: Focus(
                                            onFocusChange: (hasFocus) {
                                              if (!hasFocus) {
                                                // 🔥 COMMIT + TÍNH LẠI PHÍ
                                                _commitHaiQuanChange();
                                              }
                                            },
                                            child: TextField(
                                              controller: textCtrl,
                                              keyboardType: TextInputType.number,
                                              textAlign: TextAlign.right,
                                              inputFormatters: [ThousandsSeparatorInputFormatter()],
                                              decoration: InputDecoration(
                                                labelText: label,
                                                floatingLabelBehavior: FloatingLabelBehavior.always,
                                                labelStyle: const TextStyle(
                                                  fontSize: 13,
                                                  fontWeight: FontWeight.w600,
                                                  color: Colors.orange,
                                                ),
                                                border: const OutlineInputBorder(),
                                                isDense: true,
                                                contentPadding:
                                                const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                              ),
                                              onEditingComplete: () {
                                                FocusScope.of(context).unfocus();

                                                // 🔥 COMMIT + TÍNH LẠI PHÍ
                                                _commitHaiQuanChange();
                                              },
                                            ),
                                          ),
                                        );
                                      }).toList(),
                                    );
                                  },
                                ),

                                const SizedBox(height: 6),
                                Align(
                                  alignment: Alignment.centerRight,
                                  child: Text(
                                    "Tổng phí hải quan: ${NumberFormat("#,##0", "vi_VN").format(
                                       isTinhPhiKhach ? controller.currentChuyenXe!['field_thong_tin_json']['phi_hai_quan'] : controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_hai_quan']
                                    )} ₫",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.orange,
                                    ),
                                  ),
                                ),
                              ],

                              SizedBox(height: 10,),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    "Trả thêm điểm",
                                    style: TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 6),

                                  SizedBox(
                                    width: double.infinity, // 🔥 ép full chiều ngang
                                    child: Container(
                                      decoration: BoxDecoration(
                                        border: Border.all(color: Colors.grey.shade300),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: GestureDetector(
                                        onHorizontalDragUpdate: _onHorizontalDrag,
                                        child: SingleChildScrollView(
                                          controller: _scrollController,
                                          scrollDirection: Axis.horizontal,
                                          child: DataTable(
                                            columnSpacing: 12,
                                            columns: const [
                                              DataColumn(
                                                label: SizedBox(
                                                  width: 100,
                                                  child: Text(
                                                    "Tên điểm",
                                                    textAlign: TextAlign.center,
                                                    softWrap: true,
                                                    // style: TextStyle(fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                              ),
                                              DataColumn(
                                                label: SizedBox(
                                                  width: 90,
                                                  child: Text(
                                                    "Khoảng cách\n(km)",
                                                    textAlign: TextAlign.center,
                                                    softWrap: true,
                                                    // style: TextStyle(fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                              ),
                                              DataColumn(
                                                label: SizedBox(
                                                  width: 110,
                                                  child: Text(
                                                    "Cùng tỉnh\nkhác tuyến",
                                                    textAlign: TextAlign.center,
                                                    softWrap: true,
                                                    // style: TextStyle(fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                              ),
                                              DataColumn(
                                                label: SizedBox(
                                                  width: 110,
                                                  child: Text(
                                                    "Cùng tuyến\nkhác tỉnh",
                                                    textAlign: TextAlign.center,
                                                    softWrap: true,
                                                    // style: TextStyle(fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                              ),
                                              DataColumn(
                                                label: SizedBox(
                                                  width: 90,
                                                  child: Text(
                                                    "Phí thêm\n(₫)",
                                                    textAlign: TextAlign.center,
                                                    softWrap: true,
                                                    // style: TextStyle(fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                              ),
                                              DataColumn(
                                                label: SizedBox(
                                                  width: 100,
                                                  child: Text(
                                                    "Ghi chú",
                                                    textAlign: TextAlign.center,
                                                    softWrap: true,
                                                    // style: TextStyle(fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                              ),
                                              DataColumn(
                                                label: SizedBox(
                                                  width: 60,
                                                  child: Text(
                                                    "Xóa",
                                                    textAlign: TextAlign.center,
                                                    softWrap: true,
                                                    // style: TextStyle(fontWeight: FontWeight.bold),
                                                  ),
                                                ),
                                              ),
                                            ],
                                            rows: List.generate(controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'].length, (i) {
                                              // final item = controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'][i];

                                              return DataRow(cells: [
                                                // 🔹 Tên điểm
                                                DataCell(SizedBox(
                                                  width: 160,
                                                  child: _buildDeferredTextField(
                                                    initialValue: controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'][i]["ten"],
                                                    onCommit: (v) {
                                                      setState(() {
                                                        controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'][i]["ten"] = v;
                                                      });
                                                    },
                                                  ),
                                                )),

                                                DataCell(SizedBox(
                                                  width: 100,
                                                  child: _buildDeferredTextField(
                                                    initialValue: controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'][i]["khoangCach"]?.toString() ?? "",
                                                    textAlign: TextAlign.right,
                                                    keyboardType: TextInputType.number,
                                                    inputFormatters: [ThousandsSeparatorInputFormatter()],
                                                    suffixText: " km",
                                                    onCommit: (v) {
                                                      // 🔸 Chuẩn hóa giá trị về double
                                                      final double km = (v is num)
                                                          ? (v as num).toDouble()
                                                          : double.tryParse(v.toString().replaceAll(',', '').trim()) ?? 0;

                                                      setState(() {
                                                        controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'][i]["khoangCach"] = km;
                                                      });

                                                      if (controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'][i]["cungTinhKhacTuyen"] == true) {
                                                        _tinhPhiThem(i);
                                                      }
                                                    },
                                                  ),
                                                )),

                                                // 🔹 Cùng tỉnh khác tuyến
                                                DataCell(Checkbox(
                                                  value: controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["cungTinhKhacTuyen"] ?? false,
                                                  onChanged: (v) {
                                                    setState(() {
                                                      controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["cungTinhKhacTuyen"] = v;
                                                      if (v == true)
                                                        controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["cungTuyenKhacTinh"] = false;
                                                    });
                                                    _tinhPhiThem(i);
                                                  },
                                                )),

                                                // 🔹 Cùng tuyến khác tỉnh
                                                DataCell(Checkbox(
                                                  value: controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["cungTuyenKhacTinh"] ?? false,
                                                  onChanged: (v) {
                                                    setState(() {
                                                      controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["cungTuyenKhacTinh"] = v;
                                                      if (v == true) controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["cungTinhKhacTuyen"] = false;
                                                    });
                                                    _tinhPhiThem(i);
                                                  },
                                                )),

                                                // 🔹 Phí thêm
                                                // 🔹 Phí thêm (cho phép nhập tay)
                                                DataCell(
                                                  SizedBox(
                                                    width: 120,
                                                    child: Focus(
                                                      onFocusChange: (hasFocus) {
                                                        if (!hasFocus) {
                                                          final text = _phiThemCtrls[i]?.text ?? '0';
                                                          final value = double.tryParse(
                                                            text.replaceAll(RegExp(r'[^0-9]'), ''),
                                                          ) ??
                                                              0;

                                                          setState(() {
                                                            if (isTinhPhiKhach) {
                                                              controller.currentChuyenXe!['field_thong_tin_json']['tra_them_diem'][i]['phiThem'] = value;
                                                            } else {
                                                              controller.currentChuyenXe!['field_thong_tin_json']['tra_them_diem'][i]['phiThemNCC'] = value;
                                                              print('phi them ncc ${controller.currentChuyenXe!['field_thong_tin_json']['tra_them_diem'][i]['phiThemNCC']}');
                                                            }
                                                          });

                                                          _tinhTongPhiTraThemDiem();
                                                        }
                                                      },
                                                      child: TextField(
                                                        controller: _phiThemCtrls.putIfAbsent(i,
                                                              () => TextEditingController(
                                                            text: _formatCurrency.format(
                                                              isTinhPhiKhach ? controller.currentChuyenXe!['field_thong_tin_json']['tra_them_diem'][i]['phiThem']
                                                                : controller.currentChuyenXe!['field_thong_tin_json']['tra_them_diem'][i]['phiThemNCC'],
                                                            ),
                                                          ),
                                                        ),
                                                        keyboardType: TextInputType.number,
                                                        textAlign: TextAlign.right,
                                                        inputFormatters: [ThousandsSeparatorInputFormatter()],
                                                        decoration: const InputDecoration(
                                                          border: InputBorder.none,
                                                          isDense: true,
                                                        ),
                                                        onEditingComplete: () {
                                                          FocusScope.of(context).unfocus();
                                                        },
                                                      ),
                                                    ),
                                                  ),
                                                ),

                                                // 🔹 Ghi chú
                                                DataCell(SizedBox(
                                                  width: 150,
                                                  child: _buildDeferredTextField(
                                                    initialValue: controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["ghiChu"],
                                                    onCommit: (v) {
                                                      setState(() {
                                                        controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["ghiChu"] = v;
                                                      });
                                                    },
                                                  ),
                                                )),

                                                // 🔹 Xóa
                                                DataCell(SizedBox(
                                                  width: 50,
                                                  child: IconButton(
                                                    icon: const Icon(Icons.delete, size: 20),
                                                    onPressed: () => _removeRow(i),
                                                  ),
                                                )),
                                              ]);

                                            }),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),

                                  TextButton.icon(
                                    onPressed: () {
                                      setState(() {
                                        controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'].add({
                                          "ten": "",
                                          "khoangCach": "",
                                          "phiThem": 0,
                                          "phiThemNCC": 0,
                                          "ghiChu": "",
                                          "cungTuyenKhacTinh": false,
                                          "cungTinhKhacTuyen": false,
                                        });
                                      });
                                    },
                                    icon: const Icon(Icons.add),
                                    label: const Text("Thêm điểm"),
                                  ),
                                ],
                              ),
                            ],
                          ),),
                      ),

                      SizedBox(height: 30,),
                      // ====================== 🟩 NÚT LƯU ======================
                      Center(
                        child: Obx(() {
                          final updating = controller.isUpdating.value;
                          // 🟢 LẤY DỮ LIỆU FORM CHI PHÍ CỐ ĐỊNH & LÁI XE CHI
                          return ElevatedButton.icon(
                            icon: AnimatedSwitcher(
                              duration: const Duration(milliseconds: 250),
                              child: updating
                                  ? const SizedBox(
                                key: ValueKey("spinner"),
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                                  : const Icon(
                                Icons.save_outlined,
                                key: ValueKey("icon"),
                              ),
                            ),
                            label: AnimatedSwitcher(
                              duration: const Duration(milliseconds: 250),
                              child: Text(
                                updating ? "Đang lưu..." : "Lưu thay đổi",
                                key: ValueKey(updating),
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: updating ? Colors.teal.shade200 : Colors.teal,
                              padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 14),
                              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            onPressed: updating
                                ? null
                                : () async {
                              setState(() {
                                daNhanLuuChuyenXe = true;
                              });
                              await controller.capNhatChuyenXe();
                            },
                          );
                        }),
                      ),

                    ],
                  ),
                ),
              ],
            )
        )
    );
  }

  void tinhCuocBaoHiemKhachHang(bool isKhachHang) {
    final chuyenXe = controller.currentChuyenXe;
    if (chuyenXe == null) return;

    final thongTinJson = chuyenXe['field_thong_tin_json'];
    if (thongTinJson == null) return;

    // ❌ Không bật bảo hiểm → set = 0
    if (toBool(thongTinJson['dich_vu']?['bao_hiem']) != true) {
      setState(() {
        thongTinJson['phi_bao_hiem'] = 0;
        thongTinJson['chi_phi_ncc']?['phi_bao_hiem'] = 0;
      });
      return;
    }

    final String? trongTai = thongTinJson['trong_tai'];
    if (trongTai == null || trongTai.isEmpty) return;

    final Map<String, dynamic>? doiTuongJson = isKhachHang
        ? chuyenXe['field_thong_tin_json_khach_hang']
        : chuyenXe['field_thong_tin_json_ncc'];

    if (doiTuongJson == null) return;

    final List<dynamic>? baoHiemList = doiTuongJson['field_phi_bao_hiem'];
    if (baoHiemList == null) return;

    double tong = 0;
    double phiHangThuong = 0;
    double phiHangQuaCanh = 0;

    // ==============================
    // 🔍 TÌM ĐÚNG DÒNG THEO TRỌNG TẢI
    // ==============================
    for (final item in baoHiemList) {
      if (item is! Map) continue;

      final Map? mapTrongTai = item['Trọng tải'];
      final Map? mapChiPhi = item['Chi phí'];

      if (mapTrongTai is! Map || mapChiPhi is! Map) continue;
      if (mapTrongTai[trongTai] != 'x') continue;

      // ==============================
      // 💰 CỘNG TẤT CẢ CHI PHÍ
      // ==============================
      mapChiPhi.forEach((key, value) {
        final soTien = double.tryParse(
          value.toString().replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
            0;

        tong += soTien;

        if (key == 'Hàng thông thường') {
          phiHangThuong = soTien;
        } else if (key == 'Hàng Quá Cảnh') {
          phiHangQuaCanh = soTien;
        }
      });

      break; // ✅ chỉ có 1 dòng khớp
    }

    // ==============================
    // 🔥 TRỪ THEO LOẠI HÀNG
    // ==============================
    final bool isHangThuong =
        toBool(thongTinJson['dich_vu']?['hang_thuong']) == true;

    if (isHangThuong) {
      tong -= phiHangQuaCanh;
    } else {
      tong -= phiHangThuong;
    }

    if (tong < 0) tong = 0;

    // ==============================
    // ✅ GHI VÀO CHUYẾN XE
    // ==============================
    setState(() {
      if (isKhachHang) {
        controller.currentChuyenXe?['field_thong_tin_json']['phi_bao_hiem'] = tong;
      } else {
        controller.currentChuyenXe?['field_thong_tin_json']['chi_phi_ncc']?['phi_bao_hiem'] = tong;
      }
    });
  }


  void _commitBaoHiemKhachChange() {
    tinhCuocBaoHiemKhachHang(true);
    tinhCuocBaoHiemKhachHang(false);
  }

  Map<String, dynamic>? _getBaoHiemTheoTrongTai(rawList) {
    if (rawList is! List) return {};

    final trongTai = controller.currentChuyenXe?['field_thong_tin_json']?['trong_tai'];
    if (trongTai == null) return null;

    for (final item in rawList) {
      final trongTaiMap = item['Trọng tải'];
      if (trongTaiMap is Map && trongTaiMap[trongTai] == 'x') {
        return Map<String, dynamic>.from(item['Chi phí'] ?? {});
      }
    }
    return {};
  }

  void TinhCuocXeChung(isChonKhach){
    final jsonCuocVanChuyen = isChonKhach ? controller.currentChuyenXe!['field_cuoc_van_chuyen_khach_hang']: controller.currentChuyenXe!['field_cuoc_van_chuyen_nha_cc'];
    print('jsonCuocVanChuyen ${jsonCuocVanChuyen}');
    for (final item in jsonCuocVanChuyen) {
      if (item["Điểm đi"] == diemDiCtrl.text && (item["Điểm đến mới"] == diemDenCtrl.text || item["Điểm đến cũ"] == diemDenCtrl.text)) {
        // final trongTaiKey = trongTaiCtrl.text;
        final cuocValue = item[controller.currentChuyenXe?["field_thong_tin_json"]?["trong_tai"]];
        print('cuocValue ${cuocValue}');
        if (cuocValue != null) {
          final parsed = double.tryParse(cuocValue.toString().replaceAll('.', '').replaceAll(',', '.')) ?? 0;

          setState(() {
            if(isChonKhach)
              controller.currentChuyenXe?['field_thong_tin_json']['phi_cuoc_xe'] = parsed;
            else
              controller.currentChuyenXe?['field_thong_tin_json']['chi_phi_ncc']['phi_cuoc_xe'] = parsed;
          });
          print('parsed ${parsed}');
          return;
        }
      }
    }
    setState(() {
      if(isChonKhach)
        controller.currentChuyenXe?['field_thong_tin_json']['phi_cuoc_xe'] = 0;
      else
        controller.currentChuyenXe?['field_thong_tin_json']['chi_phi_ncc']['phi_cuoc_xe'] = 0;
    });
  }

  void tinhCuocQuaKhoQuaTai(bool isChonKhach) {
    final chuyenXe = controller.currentChuyenXe;
    if (chuyenXe == null) return;

    final thongTinJson = chuyenXe['field_thong_tin_json'];
    if (thongTinJson == null) return;

    final String? trongTai = thongTinJson['trong_tai'];
    if (trongTai == null || trongTai.isEmpty) return;

    // 🔁 Chọn bảng cấu hình theo đối tượng
    final Map<String, dynamic>? doiTuongJson = isChonKhach
        ? chuyenXe['field_thong_tin_json_khach_hang']
        : chuyenXe['field_thong_tin_json_ncc'];

    if (doiTuongJson == null) return;

    final List<dynamic>? phiHangNangList = doiTuongJson['field_phi_hang_nang'];
    if (phiHangNangList == null) return;

    double giaTri = 0;

    // 🔍 Tìm đúng dòng theo trọng tải
    for (final item in phiHangNangList) {
      if (item is! Map) continue;

      if (item['Trọng tải']?.toString() == trongTai) {
        giaTri = double.tryParse(
          item['Chi phí']!.toString().replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
            0;
        break;
      }
    }

    // 🧾 GHI LẠI VÀO JSON CHUYẾN XE
    setState(() {
      if (isChonKhach) {
        // 👉 Phí khách trả
        controller.currentChuyenXe!['field_thong_tin_json']
        ['qua_kho_qua_tai'] = giaTri;
      } else {
        // 👉 Phí NCC
        controller.currentChuyenXe!['field_thong_tin_json']
        ['chi_phi_ncc']['qua_kho_qua_tai'] = giaTri;
      }
    });
  }

  void _tinhCuocXe() {
    if(toBool(controller.currentChuyenXe?['field_thong_tin_json']['dich_vu']['cuoc_xe'])){
      TinhCuocXeChung(true);
      TinhCuocXeChung(false);
      _commitCuocXe();
    }else{
      setState(() {
        if(isTinhPhiKhach)
          controller.currentChuyenXe?['field_thong_tin_json']['phi_cuoc_xe'] = 0;
        else
          controller.currentChuyenXe?['field_thong_tin_json']['chi_phi_ncc']['phi_cuoc_xe'] = 0;
      });
      phiCuocXeCtrl.text = '0';
    }
  }

  void _commitHaiQuanChange() {
    final chuyenXe = controller.currentChuyenXe;
    if (chuyenXe == null) return;

    final thongTin = chuyenXe['field_thong_tin_json'];
    final khach = isTinhPhiKhach ? chuyenXe['field_thong_tin_json_khach_hang'] : chuyenXe['field_thong_tin_json_ncc'];

    if (thongTin == null || khach == null) return;

    final String? trongTai = thongTin['trong_tai'];
    final String? diemDi = thongTin['diem_di'];

    if (trongTai == null || diemDi == null) return;

    final List<dynamic>? list = khach['field_phi_hai_quan'];
    if (list == null) return;

    double tongPhi = 0;
    final Map<String, double> giaTriMoi = {};

    _controllersHaiQuan.forEach((label, ctrl) {
      final val = double.tryParse(
        ctrl.text.replaceAll(RegExp(r'[^0-9]'), ''),
      ) ??
          0;
      giaTriMoi[label] = val;
      tongPhi += val;
    });

    for (final item in list) {
      if (item is! Map) continue;
      if (item['Cửa khẩu'] != diemDi) continue;
      if (!item.containsKey(trongTai)) continue;

      final label = item['Chi phí'];
      if (giaTriMoi.containsKey(label)) {
        item[trongTai] = giaTriMoi[label];
      }
    }

    setState(() {
      if(isTinhPhiKhach){
        controller.currentChuyenXe!['field_thong_tin_json']['phi_hai_quan'] = tongPhi;
      }
      else{
        // if(controller.currentChuyenXe!['field_loai_xe'] != 'xe_ngoai')
        //   controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_hai_quan'] = 0;
        // else
          controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_hai_quan'] = tongPhi;
      }

      // thongTin['phi_hai_quan'] = tongPhi;
    });
  }

  void _tinhPhiQuaKhoQuaTai() {
    if(toBool(controller.currentChuyenXe?['field_thong_tin_json']['dich_vu']['cuoc_xe'])){
      tinhCuocQuaKhoQuaTai(true);
      tinhCuocQuaKhoQuaTai(false);

      _commitPhiQuaKhoQuaTai();
    }else{
      setState(() {
        if(isTinhPhiKhach)
          controller.currentChuyenXe?['field_thong_tin_json']['qua_kho_qua_tai'] = 0;
        else
          controller.currentChuyenXe?['field_thong_tin_json']['chi_phi_ncc']['qua_kho_qua_tai'] = 0;
      });
      _quaKhoQuaTaiCtrl.text = '0';
    }
  }

  void tinhPhiLuuCaChung(bool isKhachHang){

    late List<dynamic> gioLuuCaList;
    late List<dynamic> phiLuuCaList;

    if (isKhachHang) {
      gioLuuCaList = controller.currentChuyenXe?['field_thong_tin_json_khach_hang']?['field_cau_hinh_gio_luu_ca'] ?? [];
      phiLuuCaList = controller.currentChuyenXe?['field_thong_tin_json_khach_hang']?['field_phi_luu_ca'] ?? [];
    }else{
      gioLuuCaList = controller.currentChuyenXe?['field_thong_tin_json_ncc']?['field_cau_hinh_gio_luu_ca'] ?? [];
      phiLuuCaList = controller.currentChuyenXe?['field_thong_tin_json_ncc']?['field_phi_luu_ca'] ?? [];
    }

    final String trongTai = trongTaiCtrl.text.trim();

    // ====================================================
    // 🔴 0️⃣ THIẾU NGÀY → RESET TOÀN BỘ
    // ====================================================
    if (ngayVanChuyenCtrl.text.trim().isEmpty ||
        ngayGioTraHangCtrl.text.trim().isEmpty) {
      setState(() {
        soNgayLuuCa = 0;
        phiLuuCa = 0;
        if(isKhachHang){
          controller.currentChuyenXe?['field_thong_tin_json']?['phi_luu_ca'] = 0;
          controller.currentChuyenXe?['field_thong_tin_json']?['so_ngay_luu_ca'] = 0;
        }else{
          controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_luu_ca'] = 0;
          controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['so_ngay_luu_ca'] = 0;
        }
      });

      _phiLuuCaCtrl.text = '0';
      debugPrint("ℹ️ Chưa đủ ngày → reset phí lưu ca");
      return;
    }

    // ====================================================
    // 🔹 Parse ngày vận chuyển & giao hàng
    // ====================================================
    DateTime? ngayVC;
    DateTime? ngayGiao;

    try {
      ngayVC = DateFormat("yyyy-MM-dd").parse(ngayVanChuyenCtrl.text);
      ngayGiao =
          DateFormat("yyyy-MM-dd HH:mm").parse(ngayGioTraHangCtrl.text);
    } catch (e) {
      debugPrint("⚠️ Lỗi parse ngày: $e");

      // ❌ Parse lỗi cũng reset cho an toàn
      setState(() {
        soNgayLuuCa = 0;
        phiLuuCa = 0;

        if(isKhachHang) {
          controller.currentChuyenXe?['field_thong_tin_json']?['phi_luu_ca'] = 0;
          controller.currentChuyenXe?['field_thong_tin_json']?['so_ngay_luu_ca'] = 0;
        }else{
          controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_luu_ca'] = 0;
          controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['so_ngay_luu_ca'] = 0;
        }

      });
      _phiLuuCaCtrl.text = '0';
      return;
    }

    // ====================================================
    // 🔹 Lấy cấu hình giờ lưu ca theo loại xe
    // ====================================================
    final matched = gioLuuCaList.firstWhereOrNull(
          (e) => e is Map && e["Loại xe"]?.toString().trim() == trongTai,
    );

    if (matched == null) {
      debugPrint("⚠️ Không tìm thấy cấu hình giờ lưu ca cho $trongTai");
      return;
    }

    final int gioQuyDinh =
        int.tryParse(matched["Thời gian Giờ"].toString()) ?? 0;
    final int phutQuyDinh =
        int.tryParse(matched["Thời gian Phút"].toString()) ?? 0;

    final gioGioiHan = DateTime(
      ngayVC.year,
      ngayVC.month,
      ngayVC.day,
      gioQuyDinh,
      phutQuyDinh,
    ).add(const Duration(days: 1));

    // ====================================================
    // 🔹 Không bị lưu ca
    // ====================================================
    if (!ngayGiao.isAfter(gioGioiHan)) {
      setState(() {
        soNgayLuuCa = 0;
        phiLuuCa = 0;
        controller.currentChuyenXe?['field_thong_tin_json']
        ?['phi_luu_ca'] = 0;
        controller.currentChuyenXe?['field_thong_tin_json']
        ?['so_ngay_luu_ca'] = 0;
      });

      _phiLuuCaCtrl.text = '0';
      debugPrint("✅ Không bị lưu ca");
      return;
    }

    // ====================================================
    // 🔹 Tính số ngày lưu ca
    // ====================================================
    final diffDays =
        ngayGiao.difference(gioGioiHan).inHours / 24;
    soNgayLuuCa = diffDays.ceil();

    final phiRow = phiLuuCaList.firstWhereOrNull(
          (e) =>
      e is Map &&
          int.tryParse(e["Ngày"].toString()) == soNgayLuuCa,
    );

    if (phiRow == null) {
      debugPrint("⚠️ Không tìm thấy mức phí lưu ca cho $soNgayLuuCa ngày");
      return;
    }

    final rawPhi = phiRow[trongTai];
    final phi = double.tryParse(
      rawPhi?.toString().replaceAll(RegExp(r'[^0-9]'), '') ??
          '0',
    ) ??
        0;

    // ====================================================
    // 🔹 GHI KẾT QUẢ
    // ====================================================
    setState(() {
      phiLuuCa = phi;
      if(isKhachHang)
        controller.currentChuyenXe?['field_thong_tin_json']?['phi_luu_ca'] = phi;
      else
        controller.currentChuyenXe?['field_thong_tin_json']?['chi_phi_ncc']['phi_luu_ca'] = phi;

      controller.currentChuyenXe?['field_thong_tin_json']?['so_ngay_luu_ca'] = soNgayLuuCa;
    });

    _phiLuuCaCtrl.text = NumberFormat('#,##0', 'vi_VN').format(phi);
  }

  void _tinhPhiLuuCa() {
    tinhPhiLuuCaChung(true);
    tinhPhiLuuCaChung(false);
    _commitLuuCa();
  }

  void _commitCuocXe() {
    if(isTinhPhiKhach){
      _phiCuocXeCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe?['field_thong_tin_json']?['phi_cuoc_xe']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
    else {
      _phiCuocXeCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_cuoc_xe']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
  }

  void _commitLuuCa() {
    if(isTinhPhiKhach){
      _phiLuuCaCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe?['field_thong_tin_json']?['phi_luu_ca']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
    else {
      _phiLuuCaCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_luu_ca']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
  }

  void _commitPhiQuaKhoQuaTai() {
    if(isTinhPhiKhach){
      _quaKhoQuaTaiCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe?['field_thong_tin_json']?['qua_kho_qua_tai']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
    else {
      _quaKhoQuaTaiCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['qua_kho_qua_tai']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
  }

  void _commitChangeVeCaoTocPhiPhatSinh() {
    if(isTinhPhiKhach){
      _phiVeCaoTocCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe?['field_thong_tin_json']?['ve_cao_toc']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
      _phiPhatSinhKhacCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe?['field_thong_tin_json']?['phi_phat_sinh']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
    else {
      _phiVeCaoTocCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['ve_cao_toc']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
      _phiPhatSinhKhacCtrl.text = NumberFormat('#,##0', 'vi_VN').format(
        double.tryParse(
          controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_phat_sinh']
              ?.toString() ??
              '0',
        ) ??
            0,
      );
    }
  }

  Widget ChiPhiItem({
    required IconData icon,
    required String label,
    required double value,
    required VoidCallback onTap,
    Color? color,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
        margin: const EdgeInsets.symmetric(vertical: 6),
        decoration: BoxDecoration(
          color: color ?? Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade300),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.withOpacity(0.08),
              blurRadius: 4,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: Colors.blueGrey),
            const SizedBox(width: 12),

            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),

            Text(
              NumberFormat('#,##0', 'vi_VN').format(value),
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),

            const SizedBox(width: 6),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  // 🔹 1️⃣ Hàm lấy Chi phí theo trọng tải (pure function)
  Map<String, dynamic>? _getChiPhiBaoHiemTheoTrongTai(
      List<dynamic>? baoHiemList,
      String trongTai,
      ) {
    if (baoHiemList == null) return null;

    for (final item in baoHiemList) {
      if (item is! Map) continue;

      final trongTaiMap = item['Trọng tải'];
      if (trongTaiMap is Map && trongTaiMap[trongTai] == 'x') {
        return Map<String, dynamic>.from(item['Chi phí'] ?? {});
      }
    }
    return null;
  }
  // 🔹 2️⃣ Hàm REFILL lại UI bảo hiểm (điểm mấu chốt)
  void _fillBaoHiemControllersTheoTrongTai() {
    final String? trongTai = controller.currentChuyenXe?['field_thong_tin_json']?['trong_tai'];
    if (trongTai == null) return;

    final chiPhi = _getChiPhiBaoHiemTheoTrongTai(isTinhPhiKhach ? controller.currentChuyenXe?['field_thong_tin_json_khach_hang']?['field_phi_bao_hiem'] : controller.currentChuyenXe?['field_thong_tin_json_ncc']?['field_phi_bao_hiem'], trongTai);
    if (chiPhi == null) return;

    chiPhi.forEach((key, value) {
      final numValue = double.tryParse(value.toString().replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;

      final ctrl = _controllersBaoHiem.putIfAbsent(
        key,
            () => TextEditingController(),
      );

      ctrl.text = NumberFormat('#,##0', 'vi_VN').format(numValue);
    });

    // 👉 Sau khi fill xong thì commit lại tổng
    _commitBaoHiemKhachChange();
  }
  // 🧩 1️⃣ Hàm lấy Chi phí Hải quan theo (Cửa khẩu + Trọng tải)
  Map<String, dynamic> _getHaiQuanTheoTrongTaiVaCuaKhau(
      List<dynamic>? list,
      String trongTai,
      String diemDi,
      ) {
    final Map<String, dynamic> result = {};

    if (list == null) return result;

    for (final item in list) {
      if (item is! Map) continue;
      if (item['Cửa khẩu'] != diemDi) continue;
      if (!item.containsKey(trongTai)) continue;

      final label = item['Chi phí']?.toString();
      if (label == null) continue;

      result[label] = item[trongTai];
    }

    print('result ${result}');
    return result;
  }
  // 🔁 2️⃣ Hàm REFILL controller Hải quan (QUAN TRỌNG NHẤT)
  void _fillHaiQuanControllers() {
    if(controller.currentChuyenXe?['field_thong_tin_json']['dich_vu']['hai_quan']){
      final chuyenXe = controller.currentChuyenXe;
      if (chuyenXe == null) return;

      final thongTin = chuyenXe['field_thong_tin_json'];
      final khach = isTinhPhiKhach ? chuyenXe['field_thong_tin_json_khach_hang'] : chuyenXe['field_thong_tin_json_ncc'];

      if (thongTin == null || khach == null) return;

      final String? cuaKhau = thongTin['diem_di']; // 👈 cửa khẩu
      final String? trongTai = thongTin['trong_tai'];

      if (cuaKhau == null || trongTai == null) return;

      final List<dynamic>? list = khach['field_phi_hai_quan'] ?? [];
      if (list == null) return;

      // 🔥 Clear để tránh dính dữ liệu trọng tải cũ
      _controllersHaiQuan.clear();

      for (final item in list) {
        if (item is! Map) continue;

        // 1️⃣ Lọc theo Cửa khẩu
        if (item['Cửa khẩu'] != cuaKhau) continue;

        // 2️⃣ Phải có cột trọng tải
        if (!item.containsKey(trongTai)) continue;

        final String? label = item['Chi phí']?.toString();
        if (label == null || label.isEmpty) continue;

        final rawValue = item[trongTai];
        final numValue =
            double.tryParse(
              rawValue.toString().replaceAll(RegExp(r'[^0-9]'), ''),
            ) ??
                0;

        _controllersHaiQuan[label] = TextEditingController(
          text: NumberFormat('#,##0', 'vi_VN').format(numValue),
        );
      }

      // 👉 Sau khi fill xong → tính lại tổng
      _commitHaiQuanChange();
    }
  }
  /// 🖱️ Cho phép kéo bảng ngang
  void _onHorizontalDrag(DragUpdateDetails details) {
    _scrollController.jumpTo(
      (_scrollController.offset - details.primaryDelta!).clamp(
        _scrollController.position.minScrollExtent,
        _scrollController.position.maxScrollExtent,
      ),
    );
  }
  Widget _buildDeferredTextField({
    required String initialValue,
    required Function(String) onCommit,
    TextAlign textAlign = TextAlign.left,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
    String? suffixText,
  }) {
    final controller = TextEditingController(text: initialValue);
    final focusNode = FocusNode();

    void commit() {
      final value = controller.text.trim();
      onCommit(value);
    }

    focusNode.addListener(() {
      if (!focusNode.hasFocus) commit();
    });

    return TextField(
      controller: controller,
      focusNode: focusNode,
      textAlign: textAlign,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      decoration: InputDecoration(
        border: InputBorder.none,
        isDense: true,
        suffixText: suffixText,
      ),
      onSubmitted: (_) => commit(),
      onEditingComplete: commit,
    );
  }

  void _tinhPhiThem(int i) {
    final thongTinJson = controller.currentChuyenXe?['field_thong_tin_json'];
    if (thongTinJson == null) return;

    final String? trongTai = thongTinJson['trong_tai']?.trim();
    if (trongTai == null || trongTai.isEmpty) return;

    double phi = 0;
    double phiNCC = 0;

    final item = thongTinJson['tra_them_diem'][i];

    // =============================
    // 🟩 CÙNG TUYẾN KHÁC TỈNH
    // =============================
    if (item["cungTuyenKhacTinh"] == true) {
      final listKH = _parsePhiList(
        controller.currentChuyenXe?['field_thong_tin_json_khach_hang'] ["field_phi_cung_tuyen_khac_tinh"],
      );

      final listNCC = _parsePhiList(
        controller.currentChuyenXe?['field_thong_tin_json_ncc'] ["field_phi_cung_tuyen_khac_tinh"],
      );

      for (final e in listKH) {
        if (e["Trọng tải"]?.toString().trim() == trongTai) {
          phi = double.tryParse(
            e["Chi phí"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
          ) ??
              0;
          break;
        }
      }

      for (final e in listNCC) {
        if (e["Trọng tải"]?.toString().trim() == trongTai) {
          phiNCC = double.tryParse(
            e["Chi phí"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
          ) ??
              0;
          break;
        }
      }
    }

    // =============================
    // 🟨 CÙNG TỈNH KHÁC TUYẾN
    // =============================
    if (item["cungTinhKhacTuyen"] == true) {
      final double km = double.tryParse(
        item["khoangCach"]?.toString().replaceAll(',', '.') ?? '0',
      ) ??
          0;

      final listKH = _parsePhiList(
        controller.currentChuyenXe?['field_thong_tin_json_khach_hang'] ["field_phi_cung_tinh_khac_tuyen"],
      );

      final listNCC = _parsePhiList(
        controller.currentChuyenXe?['field_thong_tin_json_ncc'] ["field_phi_cung_tinh_khac_tuyen"],
      );

      for (final e in listKH) {
        if (e["Trọng tải"]?.toString().trim() != trongTai) continue;

        final minKm = double.tryParse(e["KM gần nhất"]?.toString() ?? '0') ?? 0;
        final maxKm =
            double.tryParse(e["KM xa nhất"]?.toString() ?? '0') ?? double.infinity;
        final donGia =
            double.tryParse(e["Chi phí"]?.toString().replaceAll(RegExp(r'[^0-9]'), '') ?? '0') ?? 0;

        if (km >= minKm && km <= maxKm) {
          phi = (km - minKm) * donGia;
          break;
        }
      }

      for (final e in listNCC) {
        if (e["Trọng tải"]?.toString().trim() != trongTai) continue;

        final minKm = double.tryParse(e["KM gần nhất"]?.toString() ?? '0') ?? 0;
        final maxKm =
            double.tryParse(e["KM xa nhất"]?.toString() ?? '0') ?? double.infinity;
        final donGia =
            double.tryParse(e["Chi phí"]?.toString().replaceAll(RegExp(r'[^0-9]'), '') ?? '0') ?? 0;

        if (km >= minKm && km <= maxKm) {
          phiNCC = (km - minKm) * donGia;
          break;
        }
      }
    }

    // =============================
    // ✅ UPDATE JSON + UI CONTROLLER
    // =============================
    setState(() {
      item["phiThem"] = phi;
      item["phiThemNCC"] = phiNCC;

      // 🔥 ĐỔ GIÁ TRỊ VÀO Ô INPUT
      final valueToShow = isTinhPhiKhach ? phi : phiNCC;

      final ctrl = _phiThemCtrls.putIfAbsent(
        i,
            () => TextEditingController(),
      );

      ctrl.text = _formatCurrency.format(valueToShow);
    });

    // =============================
    // 🔢 TÍNH LẠI TỔNG
    // =============================
    _tinhTongPhiTraThemDiem();
  }

  void _dienLaiPhiThem(int i) {
    final thongTinJson = controller.currentChuyenXe?['field_thong_tin_json'];
    final item = thongTinJson['tra_them_diem'][i];
    setState(() {
      // 🔥 ĐỔ GIÁ TRỊ VÀO Ô INPUT
      final valueToShow = isTinhPhiKhach ? item["phiThem"] : item["phiThemNCC"];

      final ctrl = _phiThemCtrls.putIfAbsent(
        i,
            () => TextEditingController(),
      );

      ctrl.text = _formatCurrency.format(valueToShow);
    });

    // =============================
    // 🔢 TÍNH LẠI TỔNG
    // =============================
    _tinhTongPhiTraThemDiem();
  }

  List<Map<String, dynamic>> _parsePhiList(dynamic raw) {
    try {
      if (raw == null) return [];
      if (raw is String) raw = jsonDecode(raw);
      if (raw is Map) return raw.values.map((e) => Map<String, dynamic>.from(e)).toList();
      if (raw is List) {
        if (raw.isNotEmpty && raw.first is String) {
          return raw.map((e) => jsonDecode(e)).map((e) => Map<String, dynamic>.from(e)).toList();
        }
        if (raw.isNotEmpty && raw.first is Map) {
          return raw.map((e) => Map<String, dynamic>.from(e)).toList();
        }
      }
      return [];
    } catch (e) {
      debugPrint("⚠️ Lỗi parse phí: $e");
      return [];
    }
  }
  void _removeRow(int index) {
    setState(() {
    });
  }
  void tinhTongPhiTraThemDiem(bool isKhach){

    final list = controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'];

    if (list is! List) return;

    double total = 0;

    for (final item in list) {
      if (item is! Map) continue;
//controller.currentChuyenXe?['field_thong_tin_json']!['tra_them_diem'][i]["phiThemNCC"]
      final double phi = double.tryParse(
        (isKhach ? item['phiThem'] : item['phiThemNCC'])?.toString().replaceAll(RegExp(r'[^0-9]'), '') ?? '0',
      ) ??
          0;

      total += phi;
    }

    setState(() {
      if(isKhach) {
        controller.currentChuyenXe!['field_thong_tin_json']["tra_them_diem_total"] = total;
      } else {
        controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']["tra_them_diem_total"] = total;
      }
    });
  }
  void _tinhTongPhiTraThemDiem() {
    tinhTongPhiTraThemDiem(true);
    tinhTongPhiTraThemDiem(false);
  }
  void _recalculateAllTraThemDiemByTrongTai() {
    final list = controller.currentChuyenXe?['field_thong_tin_json']?['tra_them_diem'];

    if (list is! List || list.isEmpty) {
      _tinhTongPhiTraThemDiem();
      return;
    }

    for (int i = 0; i < list.length; i++) {
      final item = list[i];
      if (item is! Map) continue;

      // 🔹 Chỉ tính lại những dòng có chọn loại tuyến
      if (item["cungTinhKhacTuyen"] == true ||  item["cungTuyenKhacTinh"] == true) {
        // _tinhPhiThem(i);
        _dienLaiPhiThem(i);
      }
    }

    // 🔥 đảm bảo tổng luôn đúng
    _tinhTongPhiTraThemDiem();
  }
  Widget _cost3ColRow({
    required String label,
    required num giaBan,
    required num giaNhap,
    bool bold = false,
    Color? labelColor,
  }) {
    final textStyle = TextStyle(
      fontWeight: bold ? FontWeight.bold : FontWeight.normal,
      fontSize: bold ? 15 : 14,
      color: labelColor,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: Text(label, style: textStyle),
          ),
          Expanded(
            flex: 3,
            child: Text(
              NumberFormat('#,##0', 'vi_VN').format(giaBan),
              textAlign: TextAlign.right,
              style: textStyle,
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              NumberFormat('#,##0', 'vi_VN').format(giaNhap),
              textAlign: TextAlign.right,
              style: textStyle,
            ),
          ),
        ],
      ),
    );
  }

  void tinhTongChiPhiBaoHiem() {
    double tong = 0;

    final String? trongTai = controller.currentChuyenXe!['field_thong_tin_json']['trong_tai'];

    if (trongTai == null || trongTai.isEmpty) return;

    // 🔁 Nếu đang tính phí KH → lấy bảng NCC và ngược lại
    final List<dynamic> phiBaoHiemJson = isTinhPhiKhach
        ? controller.currentChuyenXe!['field_thong_tin_json_ncc']['field_phi_bao_hiem']
        : controller.currentChuyenXe!['field_thong_tin_json_khach_hang']['field_phi_bao_hiem'];

    Map<String, dynamic>? cauHinhPhuHop;

    // 1️⃣ TÌM CẤU HÌNH ĐÚNG TRỌNG TẢI
    for (final item in phiBaoHiemJson) {
      if (item is! Map) continue;

      final Map? mapTrongTai = item['Trọng tải'];
      if (mapTrongTai == null) continue;

      final flag = mapTrongTai[trongTai]?.toString().trim();
      if (flag == 'x') {
        cauHinhPhuHop = item.map(
              (k, v) => MapEntry(k.toString(), v),
        );
        break;
      }
    }

    if (cauHinhPhuHop == null) {
      debugPrint('⚠️ Không tìm thấy cấu hình bảo hiểm cho trọng tải: $trongTai');
      return;
    }

    // 2️⃣ CỘNG TỔNG CHI PHÍ
    final Map<String, dynamic>? chiPhi =
    cauHinhPhuHop['Chi phí'] as Map<String, dynamic>?;

    if (chiPhi == null) return;

    chiPhi.forEach((key, value) {
      final soTien = double.tryParse(
        value.toString().replaceAll(RegExp(r'[^0-9]'), ''),
      ) ??
          0;
      tong += soTien;
    });

    // 3️⃣ TRỪ THEO LOẠI HÀNG
    final bool hangThuong =
    toBool(controller.currentChuyenXe!['field_thong_tin_json']["dich_vu"]["hang_thuong"]);

    if (hangThuong == true) {
      // 🔻 Trừ Hàng Quá Cảnh
      final quaCanh = chiPhi['Hàng Quá Cảnh'];
      if (quaCanh != null) {
        tong -= double.tryParse(
          quaCanh.toString().replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
            0;
      }
    } else {
      // 🔻 Trừ Hàng thông thường
      final hangThuongPhi = chiPhi['Hàng thông thường'];
      if (hangThuongPhi != null) {
        tong -= double.tryParse(
          hangThuongPhi.toString().replaceAll(RegExp(r'[^0-9]'), ''),
        ) ??
            0;
      }
    }

    // 4️⃣ GÁN GIÁ TRỊ
    setState(() {
      if (isTinhPhiKhach) {
        controller.currentChuyenXe!['field_thong_tin_json']
        ['chi_phi_ncc']['phi_bao_hiem'] = tong;
      } else {
        controller.currentChuyenXe!['field_thong_tin_json']
        ['phi_bao_hiem'] = tong;
      }
    });
  }
  void tinhTongPhiHaiQuan() {
    double tong = 0;

    final String? trongTai = controller.currentChuyenXe!['field_thong_tin_json']['trong_tai'];
    final String? cuaKhau = controller.currentChuyenXe!['field_thong_tin_json']['diem_di'];

    if (trongTai == null || trongTai.isEmpty) return;
    if (cuaKhau == null || cuaKhau.isEmpty) return;

    // 🔁 Nếu đang tính phí KH → lấy bảng NCC và ngược lại
    final List<dynamic> phiHaiQuanJson = isTinhPhiKhach
        ? controller.currentChuyenXe!['field_thong_tin_json_ncc']['field_phi_hai_quan']
        : controller.currentChuyenXe!['field_thong_tin_json_khach_hang']['field_phi_hai_quan'];

    for (final item in phiHaiQuanJson) {
      if (item is! Map) continue;

      // 1️⃣ Lọc theo cửa khẩu
      if (item['Cửa khẩu']?.toString() != cuaKhau) continue;

      // 2️⃣ Lấy phí theo trọng tải
      final dynamic rawValue = item[trongTai];
      if (rawValue == null) continue;

      final double soTien = double.tryParse(
        rawValue.toString().replaceAll(RegExp(r'[^0-9]'), ''),
      ) ??
          0;

      tong += soTien;
    }

    // 3️⃣ GÁN GIÁ TRỊ
    setState(() {
      if (isTinhPhiKhach) {
        // if(controller.currentChuyenXe!['field_loai_xe'] != 'xe_ngoai')
        //   controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_hai_quan'] = 0;
        // else
          controller.currentChuyenXe!['field_thong_tin_json']['chi_phi_ncc']['phi_hai_quan'] = tong;
      } else {
        controller.currentChuyenXe!['field_thong_tin_json']['phi_hai_quan'] = tong;
      }
    });
  }
  void _updateFormBaoHiemKhachChange() {
    final chuyenXe = controller.currentChuyenXe;
    if (chuyenXe == null) return;

    final thongTinJson = chuyenXe['field_thong_tin_json'];
    if (thongTinJson == null) return;

    final String? trongTai = thongTinJson['trong_tai'];
    if (trongTai == null || trongTai.isEmpty) return;

    // 🔁 Xác định đối tượng cập nhật
    final Map<String, dynamic>? doiTuongJson = isTinhPhiKhach
        ? chuyenXe['field_thong_tin_json_khach_hang']
        : chuyenXe['field_thong_tin_json_ncc'];

    if (doiTuongJson == null) return;

    final List<dynamic>? baoHiemList = doiTuongJson['field_phi_bao_hiem'];
    if (baoHiemList == null) return;

    // ==============================
    // 1️⃣ LẤY GIÁ TRỊ TỪ FORM
    // ==============================
    final Map<String, dynamic> chiPhiMoi = {};
    _controllersBaoHiem.forEach((key, ctrl) {
      final value = double.tryParse(
        ctrl.text.replaceAll(RegExp(r'[^0-9]'), ''),
      ) ??
          0;
      chiPhiMoi[key] = value;
    });

    // ==============================
    // 2️⃣ UPDATE ĐÚNG DÒNG TRỌNG TẢI
    // ==============================
    for (final item in baoHiemList) {
      if (item is! Map) continue;

      final Map? mapTrongTai = item['Trọng tải'];
      final Map? mapChiPhi = item['Chi phí'];

      if (mapTrongTai is! Map || mapChiPhi is! Map) continue;

      if (mapTrongTai[trongTai] == 'x') {
        item['Chi phí'] = {
          ...Map<String, dynamic>.from(mapChiPhi),
          ...chiPhiMoi,
        };
        break;
      }
    }

    // ==============================
    // 3️⃣ GHI NGƯỢC VÀO CONTROLLER
    // ==============================
    setState(() {
      doiTuongJson['field_phi_bao_hiem'] = baoHiemList;
    });

    // ==============================
    // 4️⃣ TÍNH LẠI TỔNG PHÍ
    // ==============================
    _commitBaoHiemKhachChange();
  }

}
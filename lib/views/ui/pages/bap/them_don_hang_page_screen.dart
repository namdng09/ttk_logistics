import 'package:amount_input_formatter/amount_input_formatter.dart';
import 'package:dropdown_search/dropdown_search.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/blank_page_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:intl/intl.dart';
import '../../../../services/don_hang_service.dart';

class ThemDonHangPageScreen extends StatefulWidget {
  const ThemDonHangPageScreen({super.key});

  @override
  State<ThemDonHangPageScreen> createState() => _ThemDonHangPageScreenState();
}

class _ThemDonHangPageScreenState extends State<ThemDonHangPageScreen>
    with UIMixin {
  late BlankPageController controller;

  // Data từ API
  List<dynamic> khachHang = [];
  List<dynamic> nhaXe = [];
  List<dynamic> taiXe = [];
  List<dynamic> loaiXe = [];
  List<dynamic> diaDiem = [];

  // State chọn
  int? selectedKhachHang;
  int? selectedNhaXe;
  int? selectedTaiXe;
  String? selectedLoaiXe;
  String? selectedDiemDi;
  String? selectedDiemDen;
  int? selectedBienKiemSoat;

  List<Map<String, dynamic>> bienKiemSoatList = [];

  final bienKiemSoatCtrl = TextEditingController();
  final tenLaiXeCtrl = TextEditingController();
  final dienThoaiCtrl = TextEditingController();
  final bksXeNgoaiCtrl = TextEditingController();

  final ngayVanChuyenCtrl = TextEditingController();
  DateTime? selectedNgayVanChuyen;

  bool haiQuan = false;
  bool baoHiem = false;
  bool cuocXe = false;

  bool isXeNha = true;
  bool isLoading = true;

  bool isLoadingPhuongTien = false;

  bool isLoadingChiPhi = false;
  Map<String, dynamic>? chiPhiKhacData;

  // State để giữ dữ liệu chi phí
  Map<String, dynamic> chiPhiKhac = {};
  List<Map<String, dynamic>> phiHaiQuanList = [];
  Map<String, dynamic> phiBaoHiemMap = {};
  String? cuocXeValue;

  bool isSaving = false;

  bool hangThongThuong = true; // mặc định chọn hàng thông thường

  @override
  void initState() {
    super.initState();
    controller = Get.put(BlankPageController());
    _initForm();
  }

  Future<void> _initForm() async {
    try {
      final data = await DonHangService.initDonHangForm();
      final content = data['content'] ?? {};
      setState(() {
        khachHang = content['khachHang'] ?? [];
        nhaXe = content['nhaxe'] ?? [];
        taiXe = content['taiXe'] ?? [];
        loaiXe = content['loaiXe'] ?? [];
        diaDiem = content['diaDiem'] ?? [];
        isLoading = false;
      });
    } catch (e) {
      setState(() => isLoading = false);
      Get.snackbar("Lỗi", e.toString());
    }
  }

  Future<void> _fetchPhuongTien(int nhaXeId, String loaiXe) async {
    setState(() {
      isLoadingPhuongTien = true;
    });

    try {
      final res = await DonHangService.fetchPhuongTien(nhaXeId, loaiXe);
      setState(() {
        bienKiemSoatList = List<Map<String, dynamic>>.from(res);
        selectedBienKiemSoat = null; // reset lựa chọn cũ
      });
    } catch (e) {
      Get.snackbar("Lỗi", "Không tải được phương tiện: $e");
    } finally {
      setState(() {
        isLoadingPhuongTien = false;
      });
    }
  }

  // Hàm fetch
  Future<void> _fetchChiPhiKhac() async {
    final res = await DonHangService.fetchChiPhiKhac({
      "field_khach_hang": selectedKhachHang,
      "field_loai_xe": selectedLoaiXe,
      "field_diem_di": selectedDiemDi,
      "field_diem_den": selectedDiemDen,
    });

    if (res['success'] == true) {
      final content = res['content'];
      setState(() {
        chiPhiKhac = content;
        cuocXeValue = content['cuocXe']?.toString() ?? "";
        phiHaiQuanList =
            (content['phiHaiQuan'] as List<dynamic>).map((e) => {
              "label": e['label'],
              "value": e['value'] ?? "",
            }).toList();
        phiBaoHiemMap =
            (content['phiBaoHiem'] as Map<String, dynamic>) ?? {};
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<BlankPageController>(
      init: controller,
      builder: (controller) {
        if (isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        return Layout(
          mainScreenName: "Đơn hàng",
          subScreenName: "Thêm đơn hàng",
          child: MyContainer(
            paddingAll: 20,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // === Dòng 1: Khách hàng + Ngày vận chuyển
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<int>(
                          dropdownColor: Colors.white,
                          initialValue: selectedKhachHang,
                          decoration: const InputDecoration(
                            labelText: "Khách hàng",
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding:
                            EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                          ),
                          items: khachHang
                              .map<DropdownMenuItem<int>>((e) =>
                              DropdownMenuItem<int>(
                                value: e['nid'],
                                child: Text(e['title'] ?? ''),
                              ))
                              .toList(),
                          onChanged: (val) {
                            setState(() {
                              selectedKhachHang = val;
                            });
                            _fetchChiPhiKhac(); // 👈 gọi API
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        flex: 2,
                        child: TextFormField(
                          controller: ngayVanChuyenCtrl,
                          readOnly: true,
                          decoration: InputDecoration(
                            labelText: "Ngày vận chuyển",
                            border: const OutlineInputBorder(),
                            isDense: true,
                            suffixIcon: selectedNgayVanChuyen != null
                                ? IconButton(
                              icon: const Icon(Icons.clear, size: 18),
                              tooltip: "Xoá ngày",
                              onPressed: () {
                                setState(() {
                                  selectedNgayVanChuyen = null;
                                  ngayVanChuyenCtrl.clear();
                                });
                              },
                            )
                                : null,
                          ),
                          onTap: () async {
                            final now = DateTime.now();
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: selectedNgayVanChuyen ?? now,
                              firstDate: DateTime(now.year - 1),
                              lastDate: DateTime(now.year + 2),
                            );
                            if (picked != null) {
                              setState(() {
                                selectedNgayVanChuyen = picked;
                                ngayVanChuyenCtrl.text =
                                "${picked.day.toString().padLeft(2, '0')}/"
                                    "${picked.month.toString().padLeft(2, '0')}/"
                                    "${picked.year}";
                              });
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Expanded(flex: 6, child: SizedBox()),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // === Dòng 2: Điểm đi + Điểm đến
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: DropdownSearch<String>(
                          selectedItem: selectedDiemDi,
                          items: (String? filter, _) {
                            return diaDiem
                                .map((e) => e.toString())
                                .where((e) =>
                            filter == null ||
                                filter.isEmpty ||
                                e.toLowerCase().contains(filter.toLowerCase()))
                                .toList();
                          },
                          decoratorProps: const DropDownDecoratorProps(
                            decoration: InputDecoration(
                              labelText: "Điểm đi",
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                          popupProps: const PopupProps.menu(
                            showSearchBox: true,
                            constraints: BoxConstraints(maxHeight: 300),
                          ),
                          onSelected: (val) {
                            setState(() {
                              selectedDiemDi = val;
                            });
                            _fetchChiPhiKhac(); // 👈 gọi API
                          },
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 8,
                        child: DropdownSearch<String>(
                          selectedItem: selectedDiemDen,
                          items: (String? filter, _) {
                            return diaDiem
                                .map((e) => e.toString())
                                .where((e) =>
                            filter == null ||
                                filter.isEmpty ||
                                e.toLowerCase().contains(filter.toLowerCase()))
                                .toList();
                          },
                          decoratorProps: const DropDownDecoratorProps(
                            decoration: InputDecoration(
                              labelText: "Điểm đến",
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                          popupProps: const PopupProps.menu(
                            showSearchBox: true,
                            constraints: BoxConstraints(maxHeight: 300),
                          ),
                          onSelected: (val) {
                            setState(() {
                              selectedDiemDen = val;
                            });
                            _fetchChiPhiKhac(); // 👈 gọi API
                          },
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // === Dòng 3: Nhà xe + Loại xe + Biển kiểm soát/Tài xế hoặc input ngoài
                  Row(
                    children: [
                      // Nhà xe
                      Expanded(
                        flex: 2,
                        child: DropdownButtonFormField<int>(
                          dropdownColor: Colors.white,
                          initialValue: selectedNhaXe,
                          decoration: const InputDecoration(
                            labelText: "Nhà xe",
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding:
                            EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                          ),
                          items: nhaXe
                              .map((e) => DropdownMenuItem<int>(
                            value: e['nid'],
                            child: Text(e['title'] ?? ''),
                          ))
                              .toList(),
                          onChanged: (val) {
                            setState(() {
                              selectedNhaXe = val;
                              final xe = nhaXe.firstWhere((x) => x['nid'] == val, orElse: () => {});
                              isXeNha = xe['field_xe_nha'] == true;
                            });

                            if (isXeNha && selectedLoaiXe != null) {
                              _fetchPhuongTien(val!, selectedLoaiXe!);
                            }
                          },
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Loại xe
                      Expanded(
                        flex: 4,
                        child: DropdownButtonFormField<String>(
                          dropdownColor: Colors.white,
                          initialValue: selectedLoaiXe,
                          decoration: const InputDecoration(
                            labelText: "Loại xe",
                            border: OutlineInputBorder(),
                            isDense: true,
                            contentPadding:
                            EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                          ),
                          items: loaiXe
                              .map((e) => DropdownMenuItem<String>(
                            value: e.toString(),
                            child: Text(e.toString()),
                          ))
                              .toList(),
                          onChanged: (val) {
                            setState(() {
                              selectedLoaiXe = val;
                            });

                            if (isXeNha && selectedNhaXe != null) {
                              _fetchPhuongTien(selectedNhaXe!, val!);
                            }
                            _fetchChiPhiKhac(); // 👈 gọi API
                          },

                        ),
                      ),
                      const SizedBox(width: 12),

                      // Nếu xe nhà
                      if (isXeNha) ...[
                        Expanded(
                          flex: 2,
                          child: isLoadingPhuongTien
                              ? const Center(
                            child: SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                              : DropdownButtonFormField<int>(
                            initialValue: selectedBienKiemSoat,
                            dropdownColor: Colors.white,
                            decoration: const InputDecoration(
                              labelText: "Biển kiểm soát",
                              border: OutlineInputBorder(),
                              isDense: true,
                              contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                            ),
                            items: bienKiemSoatList.map((e) {
                              return DropdownMenuItem<int>(
                                value: int.tryParse(e['nid']),
                                child: Text(e['title'] ?? ''),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setState(() {
                                selectedBienKiemSoat = val;


                                // 🔥 Tìm lai_xe trong danh sách BKS
                                final matched = bienKiemSoatList.firstWhere(
                                      (e) => int.tryParse(e['nid'].toString()) == val,
                                  orElse: () => {},
                                );

                                if (matched.isNotEmpty && matched['lai_xe'] != null) {
                                  selectedTaiXe = int.tryParse(matched['lai_xe'].toString());
                                }
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: DropdownButtonFormField<int>(
                            dropdownColor: Colors.white,
                            initialValue: selectedTaiXe,
                            decoration: const InputDecoration(
                              labelText: "Tài xế",
                              border: OutlineInputBorder(),
                              isDense: true,
                              contentPadding:
                              EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                            ),
                            items: taiXe
                                .map((e) => DropdownMenuItem<int>(
                              value: e['nid'],
                              child: Text(e['title'] ?? ''),
                            ))
                                .toList(),
                            onChanged: (val) =>
                                setState(() => selectedTaiXe = val),
                          ),
                        ),
                      ] else ...[
                        // Nếu xe ngoài
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: tenLaiXeCtrl,
                            decoration: const InputDecoration(
                              labelText: "Tên lái xe",
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: dienThoaiCtrl,
                            decoration: const InputDecoration(
                              labelText: "SĐT lái xe",
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          flex: 2,
                          child: TextFormField(
                            controller: bksXeNgoaiCtrl,
                            decoration: const InputDecoration(
                              labelText: "BKS xe ngoài",
                              border: OutlineInputBorder(),
                              isDense: true,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Checkbox Hải quan, Bảo hiểm, Cước xe
                  Row(
                    children: [
                      Checkbox(
                        value: haiQuan,
                        onChanged: (val) {
                          setState(() => haiQuan = val ?? false);
                          if (val == true) _fetchChiPhiKhac();
                        },
                      ),
                      const Text("Hải quan"),
                      const SizedBox(width: 16),
                      Checkbox(
                        value: baoHiem,
                        onChanged: (val) {
                          setState(() => baoHiem = val ?? false);
                          if (val == true) _fetchChiPhiKhac();
                        },
                      ),
                      const Text("Bảo hiểm"),
                      const SizedBox(width: 16),
                      Checkbox(
                        value: cuocXe,
                        onChanged: (val) {
                          setState(() => cuocXe = val ?? false);
                          if (val == true) _fetchChiPhiKhac();
                        },
                      ),
                      const Text("Cước xe"),
                      const SizedBox(width: 16),
                      Checkbox(
                        value: hangThongThuong,
                        onChanged: (val) {
                          setState(() => hangThongThuong = val ?? true);
                        },
                      ),
                      const Text("Hàng thông thường"),
                    ],
                  ),

                  const SizedBox(height: 12),
// Nếu chọn Cước xe → hiển thị input cước xe
                  if (cuocXe) ...[
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          flex: 1, // 👈 chỉ chiếm 2/10 độ rộng
                          child: StatefulBuilder(
                            builder: (context, setStateSB) {
                              final rawValue = cuocXeValue ?? "";
                              final initialValue = int.tryParse(
                                rawValue.replaceAll('.', '').replaceAll(',', ''),
                              ) ?? 0;

                              final formatted = NumberFormat("#,###", "vi_VN").format(initialValue);

                              final ctrl = TextEditingController(text: formatted);

                              return TextFormField(
                                controller: ctrl,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(
                                  labelText: "Cước xe",
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                  contentPadding: EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                                ),
                                inputFormatters: [
                                  AmountInputFormatter(
                                    fractionalDigits: 0,
                                    groupSeparator: '.',
                                    decimalSeparator: ',',
                                  ),
                                ],
                                onChanged: (val) {
                                  final parsed = int.tryParse(val.replaceAll('.', '').replaceAll(',', '')) ?? 0;
                                  cuocXeValue = parsed.toString();
                                  setStateSB(() {}); // cập nhật lại control
                                },
                              );
                            },
                          ),
                        ),
                        const Expanded(flex: 9, child: SizedBox()), // 👈 chừa trống 8/10 còn lại
                      ],
                    ),
                  ],

                  const SizedBox(height: 12),

// Nếu chọn Hải quan → hiển thị form phiHaiQuan
                  if (haiQuan) ...[
                    const SizedBox(height: 20),
                    const Text("CHI PHÍ HẢI QUAN", style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),

                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: phiHaiQuanList.map((item) {
                        final label = item['label'] ?? "";
                        final rawValue = item['value']?.toString() ?? "";
                        final initialValue = int.tryParse(rawValue.replaceAll('.', '').replaceAll(',', '')) ?? 0;
                        final formatted = NumberFormat("#,###", "vi_VN").format(initialValue);

                        final ctrl = TextEditingController(text: formatted);

                        return SizedBox(
                          width: 155, // 👈 giữ cố định mỗi ô
                          child: TextFormField(
                            controller: ctrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: label,
                              border: const OutlineInputBorder(),
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                            ),
                            inputFormatters: [
                              AmountInputFormatter(
                                  fractionalDigits: 0,
                                  groupSeparator: NumberFormatter.kDot,
                                  decimalSeparator: NumberFormatter.kComma)
                            ],
                            onChanged: (val) {
                              final parsed = int.tryParse(val.replaceAll('.', '').replaceAll(',', '')) ?? 0;
                              item['value'] = parsed; // lưu lại dạng số để gửi API
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ],

// Nếu chọn Bảo hiểm → hiển thị form phiBaoHiem
                  if (baoHiem) ...[
                    const SizedBox(height: 20),
                    const Text("CHI PHÍ BẢO HIỂM", style: TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 12,
                      runSpacing: 12,
                      children: phiBaoHiemMap.keys.map((key) {
                        // Ẩn theo logic
                        if (hangThongThuong && key == "Hàng Quá Cảnh") {
                          return const SizedBox.shrink();
                        }
                        if (!hangThongThuong && key == "Hàng thông thường") {
                          return const SizedBox.shrink();
                        }

                        final rawValue = phiBaoHiemMap[key]?.toString() ?? "";
                        final initialValue = int.tryParse(rawValue.replaceAll('.', '').replaceAll(',', '')) ?? 0;
                        final formatted = NumberFormat("#,###", "vi_VN").format(initialValue);
                        final ctrl = TextEditingController(text: formatted);

                        return SizedBox(
                          width: 155,
                          child: TextFormField(
                            controller: ctrl,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: key,
                              border: const OutlineInputBorder(),
                              isDense: true,
                              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                            ),
                            onChanged: (val) {
                              final parsed = int.tryParse(val.replaceAll('.', '').replaceAll(',', '')) ?? 0;
                              phiBaoHiemMap[key] = parsed;
                            },
                            inputFormatters: [
                              AmountInputFormatter(
                                  fractionalDigits: 0,
                                  groupSeparator: NumberFormatter.kDot,
                                  decimalSeparator: NumberFormatter.kComma)
                            ],
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                  const SizedBox(height: 20),
                  // === Buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      TextButton(
                        onPressed: () {
                          Get.offNamed('danh-sach-don-hang'); // 👈 quay lại danh sách
                        },
                        child: const Text("Quay lại danh sách"),
                      ),
                      const SizedBox(width: 12),
                      ElevatedButton(
                        onPressed: isSaving
                            ? null
                            : () async {
                          setState(() => isSaving = true);

                          try {
                            final dataToSave = {
                              "field_khach_hang": selectedKhachHang,
                              "field_ngay_van_chuyen": selectedNgayVanChuyen?.toIso8601String(),
                              "field_diem_di": selectedDiemDi,
                              "field_diem_den": selectedDiemDen,
                              "field_nha_xe": selectedNhaXe,
                              "field_loai_xe": selectedLoaiXe,
                              "field_bien_kiem_soat": selectedBienKiemSoat,
                              "field_lai_xe": selectedTaiXe,
                              "field_ten_lai_xe": tenLaiXeCtrl.text,
                              "field_sdt_lai_xe": dienThoaiCtrl.text,
                              "field_bks_xe_ngoai": bksXeNgoaiCtrl.text,
                              "field_hai_quan": haiQuan ? 1 : 0,
                              "field_bao_hiem": baoHiem ? 1 : 0,
                              "field_cuoc_xe": cuocXe ? 1 : 0,
                              "field_phi_hai_quan": phiHaiQuanList,
                              "field_phi_bao_hiem": phiBaoHiemMap,
                              "field_cuoc_xe_value": cuocXeValue,
                              "field_hang_thong_thuong": hangThongThuong == true ? 1 : 0
                            };

                            final res = await DonHangService.saveDonHang(dataToSave);

                            if (res.success) {
                              Get.snackbar(
                                "Thành công",
                                res.message,
                                snackPosition: SnackPosition.BOTTOM,
                                backgroundColor: Colors.green.shade600,
                                colorText: Colors.white,
                                margin: const EdgeInsets.all(12),
                                borderRadius: 8,
                                duration: const Duration(seconds: 2),
                                icon: const Icon(Icons.check_circle, color: Colors.white),
                              );

                              // Sau 1 chút delay để snack hiển thị rồi bật dialog
                              Future.delayed(const Duration(milliseconds: 500), () {
                                showDialog(
                                  context: context,
                                  builder: (_) => AlertDialog(
                                    title: const Text("Bạn có muốn nhập đơn tiếp theo không?"),
                                    actions: [
                                      // Quay về danh sách
                                      TextButton(
                                        onPressed: () {
                                          Get.back(); // đóng dialog
                                          Get.offNamed('danh-sach-don-hang');
                                        },
                                        child: const Text("Quay về danh sách"),
                                      ),
                                      // Nhập đơn hàng tương tự
                                      TextButton(
                                        onPressed: () {
                                          Get.back(); // chỉ đóng dialog, giữ nguyên form
                                        },
                                        child: const Text("Nhập đơn hàng tương tự"),
                                      ),
                                      // Nhập đơn hàng mới
                                      TextButton(
                                        onPressed: () {
                                          Get.back(); // đóng dialog
                                          setState(() {
                                            // Reset tất cả input và state
                                            selectedKhachHang = null;
                                            selectedNgayVanChuyen = null;
                                            ngayVanChuyenCtrl.clear();
                                            selectedDiemDi = null;
                                            selectedDiemDen = null;
                                            selectedNhaXe = null;
                                            selectedLoaiXe = null;
                                            selectedBienKiemSoat = null;
                                            bienKiemSoatList = [];
                                            selectedTaiXe = null;
                                            tenLaiXeCtrl.clear();
                                            dienThoaiCtrl.clear();
                                            bksXeNgoaiCtrl.clear();
                                            haiQuan = false;
                                            baoHiem = false;
                                            cuocXe = false;
                                            cuocXeValue = null;
                                            phiHaiQuanList = [];
                                            phiBaoHiemMap = {};
                                          });
                                        },
                                        child: const Text("Nhập đơn hàng mới"),
                                      ),
                                    ],
                                  ),
                                );
                              });
                            }
                            else {
                              Get.snackbar(
                                "Thất bại",
                                res.message,
                                snackPosition: SnackPosition.BOTTOM,
                                backgroundColor: Colors.red.shade700,
                                colorText: Colors.white,
                                margin: const EdgeInsets.all(12),
                                borderRadius: 8,
                                duration: const Duration(seconds: 4),
                                icon: const Icon(Icons.error, color: Colors.white),
                              );
                            }
                          } catch (e) {
                            Get.snackbar(
                              "Thất bại",
                              e.toString(),
                              snackPosition: SnackPosition.BOTTOM,
                              backgroundColor: Colors.red.shade700,
                              colorText: Colors.white,
                              margin: const EdgeInsets.all(12),
                              borderRadius: 8,
                              duration: const Duration(seconds: 4),
                              icon: const Icon(Icons.error, color: Colors.white),
                            );
                          } finally {
                            setState(() => isSaving = false);
                          }
                        },
                        child: isSaving
                            ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                            : const Text("Lưu"),
                      ),
                    ],
                  )
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

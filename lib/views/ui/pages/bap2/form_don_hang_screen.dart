
import 'package:ttk_logistics/controller/pages/form_don_hang_controller.dart';
import 'package:ttk_logistics/widgets/date_picker_field.dart';
import 'package:ttk_logistics/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:intl/intl.dart';

class FormDonHangScreen extends StatefulWidget {
  const FormDonHangScreen({super.key});

  @override
  State<FormDonHangScreen> createState() => _FormDonHangScreenState();
}

class _FormDonHangScreenState extends State<FormDonHangScreen> with UIMixin {
  late FormDonHangController controller;
  final NumberFormat currencyFormat = NumberFormat.decimalPattern('vi_VN');

  @override
  void initState() {
    // ❌ Xoá controller cũ nếu tồn tại
    if (Get.isRegistered<FormDonHangController>()) {
      Get.delete<FormDonHangController>();
    }

    // ✅ Tạo controller mới hoàn toàn
    controller = Get.put(FormDonHangController());

    super.initState();
  }
  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;

    return GetBuilder<FormDonHangController>(
      init: controller,
      builder: (controller) {

        return Layout(
          mainScreenName: 'Quản lý đơn hàng',
          subScreenName: 'Thêm Đơn hàng',
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: DefaultTextStyle(
              style: const TextStyle(fontFamily: 'NotoSans'),
              child: controller.isLoading.value ? Center(child: CircularProgressIndicator()) :
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 🟦 Thông tin chung
                  MyContainer(
                    margin: const EdgeInsets.only(bottom: 16),
                    width: screenWidth,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "🔹 Thông tin chung",
                          style: Theme.of(context)
                              .textTheme
                              .bodyLarge!
                              .copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            // ✅ Dropdown chọn khách hàng
                            Expanded(
                              flex: 3,
                              child: GetBuilder<FormDonHangController>(
                                builder: (controller) {
                                  return Stack(
                                    alignment: Alignment.centerRight,
                                    children: [
                                      DropdownButtonFormField<String>(
                                        dropdownColor: Colors.white,
                                        initialValue: controller.selectedKhachHang,
                                        isExpanded: true,
                                        onChanged: controller.isLoadingKhachHangDetail
                                            ? null // 🔒 disable khi loading
                                            : (value) async {
                                          await controller.onKhachHangChanged(value);
                                        },
                                        decoration: InputDecoration(
                                          labelText: "Thông tin khách hàng",
                                          border: const OutlineInputBorder(),
                                          contentPadding:
                                          const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                                        ),
                                        items: controller.khachHangList.map((kh) {
                                          final ten = kh["field_ho_ten"] ?? kh["title"] ?? "";
                                          final value = kh["nid"].toString();
                                          return DropdownMenuItem<String>(
                                            value: value,
                                            child: Text(ten),
                                          );
                                        }).toList(),
                                      ),

                                      // 🔄 Loading overlay
                                      if (controller.isLoadingKhachHangDetail)
                                        const Padding(
                                          padding: EdgeInsets.only(right: 12),
                                          child: SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(strokeWidth: 2),
                                          ),
                                        ),
                                    ],
                                  );
                                },
                              ),
                              // DropdownButtonFormField<String>(
                              //   dropdownColor: Colors.white,
                              //   value: controller.selectedKhachHang,
                              //   isExpanded: true,
                              //   decoration: const InputDecoration(
                              //     labelText: "Thông tin khách hàng",
                              //     border: OutlineInputBorder(),
                              //     contentPadding: EdgeInsets.symmetric(
                              //         vertical: 12, horizontal: 12),
                              //   ),
                              //   items: controller.khachHangList.map((kh) {
                              //     final ten =
                              //         kh["field_ho_ten"] ?? kh["title"] ?? "";
                              //     final value = kh["nid"].toString();
                              //     return DropdownMenuItem<String>(
                              //       value: value,
                              //       child: Text(ten),
                              //     );
                              //   }).toList(),
                              //   onChanged: controller.isLoadingKhachHangDetail
                              //       ? null // 🔒 disable khi loading
                              //       : (value) async {
                              //     await controller.onKhachHangChanged(value);
                              //   },
                              //   // onChanged: (value) {
                              //   //   print('value chon khach hang moi ${value}');
                              //   //   // 🔹 Khi chọn khách hàng mới
                              //   //   controller.onKhachHangChanged(value);
                              //   // },
                              // ),
                            ),

                            const SizedBox(width: 8),

                            // Tiền cước
                            Expanded(
                              flex: 2,
                              child: TextField(
                                controller: controller.tienCuocCtrl,
                                readOnly: true,
                                decoration: const InputDecoration(
                                  labelText: "Tiền cước",
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(
                                      vertical: 12, horizontal: 12),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),

                            Expanded(
                              flex: 2,
                              child: TextField(
                                controller: controller.tienBaoHiemCtrl,
                                readOnly: true,
                                textAlign: TextAlign.right,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.blueAccent,
                                ),
                                decoration: const InputDecoration(
                                  labelText: "Tiền bảo hiểm",
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Phí hải quan
                            Expanded(
                              flex: 2,
                              child: TextField(
                                controller: controller.phiHaiQuanCtrl,
                                readOnly: true,
                                decoration: const InputDecoration(
                                  labelText: "Phí hải quan",
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(
                                      vertical: 12, horizontal: 12),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),

                            // ✅ Tổng tiền (Cước + Bảo hiểm + Hải quan)
                            Expanded(
                              flex: 2,
                              child: TextField(
                                controller: controller.tongTienCtrl,
                                readOnly: true,
                                textAlign: TextAlign.right,
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.red,
                                  fontSize: 16,
                                ),
                                decoration: const InputDecoration(
                                  labelText: "Tổng tiền (Cước + Bảo hiểm + Hải quan)",
                                  border: OutlineInputBorder(),
                                  contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                                ),
                              ),
                            ),

                          ],
                        ),
                      ],
                    ),
                  ),

                  // 🟩 Danh sách xe vận chuyển
                  MyContainer(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text("🚚 Danh sách xe vận chuyển",
                                style: Theme.of(context)
                                    .textTheme
                                    .bodyLarge!
                                    .copyWith(fontWeight: FontWeight.bold)),
                            Row(
                              children: [
                                ElevatedButton.icon(
                                  icon: const Icon(Icons.add),
                                  label: const Text("Thêm xe"),
                                  onPressed: controller.addXe,
                                ),
                                const SizedBox(width: 8),
                                ElevatedButton.icon(
                                  icon: const Icon(Icons.copy),
                                  label: const Text("Nhân bản"),
                                  onPressed: controller.duplicateLastXe,
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        if (controller.xeList.isEmpty)
                          const Padding(
                            padding: EdgeInsets.all(8),
                            child: Text("Chưa có xe nào được thêm."),
                          ),

                        ...List.generate(
                          controller.xeList.length,
                              (index) => _buildXeItem(context, index),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),
                  Align(
                    alignment: Alignment.centerRight,
                    child: ElevatedButton.icon(
                      icon: controller.isSaving.value
                          ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                          : const Icon(Icons.save),
                      label: Text(controller.isSaving.value ? "Đang lưu..." : "Lưu đơn hàng"),
                      onPressed: controller.isSaving.value
                          ? null
                          : () => controller.luuDonHang(),
                    ),
                  )
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  /// -------------------------------
  /// 🧩 Widget item xe vận chuyển
  /// -------------------------------
  Widget _buildXeItem(BuildContext context, int index) {
    final item = controller.xeList[index];

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ======================
            // 🔹 Header: tiêu đề + chip dịch vụ
            // ======================
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      "Xe ${index + 1}",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(width: 12),
                    TextButton.icon(
                      icon: const Icon(Icons.delete_outline,
                          color: Colors.red, size: 20),
                      label: const Text(
                        "Xóa xe",
                        style: TextStyle(color: Colors.red),
                      ),
                      onPressed: () => controller.removeXe(index),
                    ),
                  ],
                ),
                Wrap(
                  spacing: 6,
                  children: [
                    FilterChip(
                      label: const Text("Bảo hiểm"),
                      selected: item["baoHiem"] == true,
                      onSelected: (val) {
                        controller.onToggleDichVu(index, "baoHiem", val);
                        if (val == true) {
                          controller.updateChiPhiBaoHiemTheoTrongTai(index);
                        } else {
                          item["phiBaoHiemChiTiet"] = {};
                          controller.tinhTongBaoHiem();
                        }
                      },
                    ),
                    FilterChip(
                      label: const Text("Cước xe"),
                      selected: item["cuocXe"],
                      onSelected: (val) => controller.onToggleDichVu(index, "cuocXe", val),
                    ),
                    FilterChip(
                      label: const Text("Phí hải quan"),
                      selected: item["haiQuan"],
                      onSelected: (val) => controller.onToggleDichVu(index, "haiQuan", val),
                    ),
                    FilterChip(
                      label: const Text("Hàng thường"),
                      selected: item["hangThuong"] == true,
                      onSelected: (val) {
                        item["hangThuong"] = val;
                        controller.tinhTongBaoHiem();
                        controller.tinhTongTien();
                        controller.update();
                      },
                    ),
                  ],
                ),
              ],
            ),

            const Divider(height: 20),

            // ======================
            // 🔹 Dòng dropdowns chính
            // ======================
            Row(
              children: [
                // 🔽 Điểm đi
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<String>(
                    dropdownColor: Colors.white,
                    isExpanded: true,
                    initialValue: controller.diemDiList.contains(item["diemDi"])
                        ? item["diemDi"]
                        : null,
                    decoration: const InputDecoration(
                      labelText: "Điểm đi",
                      border: OutlineInputBorder(),
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    ),
                    items: controller.diemDiList.map((d) {
                      return DropdownMenuItem<String>(
                        value: d,
                        child: Text(
                          d,
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (v) {
                      controller.onChangeDropdown(index, diemDi: v);
                      if (item["haiQuan"] == true) {
                        controller.updateChiPhiHaiQuanTheoXe(index);
                      }
                      if (item["baoHiem"] == true) {
                        controller.updateChiPhiBaoHiemTheoTrongTai(index);
                      }
                      controller.tinhTongTien();
                    },
                  ),
                ),
                const SizedBox(width: 8),

                // 🔽 Điểm đến
                Expanded(
                  flex: 3,
                  child: DropdownButtonFormField<String>(
                    dropdownColor: Colors.white,
                    isExpanded: true,
                    initialValue: controller.diemDenList.contains(item["diemDen"])
                        ? item["diemDen"]
                        : null,
                    decoration: const InputDecoration(
                      labelText: "Điểm đến",
                      border: OutlineInputBorder(),
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    ),
                    items: controller.diemDenList.map((d) {
                      return DropdownMenuItem<String>(
                        value: d,
                        child: Text(
                          d,
                          overflow: TextOverflow.ellipsis,
                        ),
                      );
                    }).toList(),
                    onChanged: (v) =>
                        controller.onChangeDropdown(index, diemDen: v),
                  ),
                ),
                const SizedBox(width: 8),

                // 🔽 Trọng tải xe
                Expanded(
                  flex: 3,
                  child: DropdownButtonFormField<String>(
                    dropdownColor: Colors.white,
                    isExpanded: true,
                    initialValue: controller.trongTaiList.contains(item["trongTai"])
                        ? item["trongTai"]
                        : null,
                    decoration: const InputDecoration(
                      labelText: "Trọng tải xe",
                      border: OutlineInputBorder(),
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    ),
                    items: controller.trongTaiList.map((t) {
                      return DropdownMenuItem<String>(
                        value: t,
                        child: Row(
                          children: [
                            const Icon(Icons.local_shipping_outlined,
                                size: 16, color: Colors.blueGrey),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                t,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (v) {
                      controller.onChangeDropdown(index, trongTai: v);
                      if (item["haiQuan"] == true) {
                        controller.updateChiPhiHaiQuanTheoXe(index);
                      }
                      if (item["baoHiem"] == true) {
                        controller.updateChiPhiBaoHiemTheoTrongTai(index);
                      }
                      controller.tinhTongTien();
                    },
                  ),
                ),
                const SizedBox(width: 8),

                // Số lượng
                Expanded(
                  flex: 1,
                  child: TextFormField(
                    keyboardType:
                    const TextInputType.numberWithOptions(decimal: false),
                    initialValue: item["soLuong"]?.toString() ?? "1",
                    decoration: const InputDecoration(
                      labelText: "SL",
                      border: OutlineInputBorder(),
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    ),
                    onChanged: (v) {
                      final clean = v.replaceAll(RegExp(r'[^0-9]'), '');
                      item["soLuong"] = clean.isEmpty ? "1" : clean;
                      controller.onChangeSoLuong(index, item["soLuong"]);
                    },
                  ),
                ),
                const SizedBox(width: 8),

// 🔹 Ngày vận chuyển
                Expanded(
                  flex: 3,
                  child: DatePickerField(
                    label: "Ngày vận chuyển",
                    initialDate: item["ngayVanChuyen"],
                    onDateSelected: (value) {
                      setState(() {
                        item["ngayVanChuyen"] = value ?? "";
                      });
                      controller.update();
                    },
                  ),
                ),
                const SizedBox(width: 8),

                // Cước xe (readonly)
                Expanded(
                  flex: 2,
                  child: TextField(
                    readOnly: true,
                    decoration: const InputDecoration(
                      labelText: "Cước xe",
                      border: OutlineInputBorder(),
                      contentPadding:
                      EdgeInsets.symmetric(vertical: 12, horizontal: 12),
                    ),
                    controller: TextEditingController(
                      text: controller.currencyFormat
                          .format(double.tryParse(item["phiCuocXe"].toString()) ?? 0),
                    ),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // ======================
            // 🔹 Nhóm nút chọn xe
            // ======================
            Row(
              children: [
                Obx(() => ElevatedButton.icon(
                  icon: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: controller.isLoadingXeNha.value
                        ? const SizedBox(
                      key: ValueKey("spinner_nha"),
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.blueAccent,
                      ),
                    )
                        : const Icon(
                      Icons.local_shipping_outlined,
                      key: ValueKey("icon_nha"),
                    ),
                  ),
                  label: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: Text(
                      controller.isLoadingXeNha.value ? "Đang tải..." : "Chọn xe nhà",
                      key: ValueKey(controller.isLoadingXeNha.value),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: controller.isLoadingXeNha.value
                        ? Colors.blue.shade50
                        : Colors.blue.shade100,
                    foregroundColor: Colors.blue.shade800,
                  ),
                  onPressed: controller.isLoadingXeNha.value
                      ? null // 🔒 Disable khi đang tải
                      : () async {
                    controller.isLoadingXeNha.value = true;
                    try {
                      await controller.chonXeNhaDialog(context, index);
                    } finally {
                      controller.isLoadingXeNha.value = false;
                    }
                  },
                )),
                const SizedBox(width: 8),
                Obx(() => ElevatedButton.icon(
                  icon: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: controller.isLoadingXeNgoai.value
                        ? const SizedBox(
                      key: ValueKey("spinner"),
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.deepOrange,
                      ),
                    )
                        : const Icon(
                      Icons.fire_truck_outlined,
                      key: ValueKey("icon"),
                    ),
                  ),
                  label: AnimatedSwitcher(
                    duration: const Duration(milliseconds: 250),
                    child: Text(
                      controller.isLoadingXeNgoai.value ? "Đang tải..." : "Chọn xe ngoài",
                      key: ValueKey(controller.isLoadingXeNgoai.value),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: controller.isLoadingXeNgoai.value
                        ? Colors.orange.shade50
                        : Colors.orange.shade100,
                    foregroundColor: Colors.orange.shade900,
                  ),
                  onPressed: controller.isLoadingXeNgoai.value
                      ? null // 🔒 Không cho bấm trong lúc đang tải
                      : () async {
                    controller.isLoadingXeNgoai.value = true;
                    try {
                      await controller.chonXeNgoaiDialog(context, index);
                    } finally {
                      controller.isLoadingXeNgoai.value = false;
                    }
                  },
                )),
              ],
            ),

            const SizedBox(height: 12),

            // ======================
            // 🔹 Hiển thị xe đã chọn (cả nhà & ngoài)
            // ======================
            if ((item["xeNha"] != null && item["xeNha"].isNotEmpty) ||
                (item["xeNgoai"] != null && item["xeNgoai"].isNotEmpty)) ...[
              const SizedBox(height: 10),

// 🧩 Hiển thị danh sách xe nhà & xe ngoài cạnh nhau
              if ((item["xeNha"] != null && item["xeNha"].isNotEmpty) ||
                  (item["xeNgoai"] != null && item["xeNgoai"].isNotEmpty)) ...[
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ==================================================
                    // 🟩 BẢNG XE NHÀ
                    // ==================================================
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.green.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 🔹 Tiêu đề
                            Row(
                              children: [
                                const Icon(Icons.local_shipping_outlined,
                                    size: 18, color: Colors.green),
                                const SizedBox(width: 6),
                                const Text(
                                  "Xe nhà đã chọn",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: Colors.green,
                                  ),
                                ),
                                const Spacer(),
                                if (item["xeNha"] != null && item["xeNha"].isNotEmpty)
                                  IconButton(
                                    icon: const Icon(Icons.delete_forever,
                                        size: 18, color: Colors.red),
                                    tooltip: "Xoá tất cả xe nhà",
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        builder: (_) => AlertDialog(
                                          title: const Text("Xác nhận xoá tất cả"),
                                          content: const Text("Bạn có chắc muốn xoá toàn bộ xe nhà?"),
                                          actions: [
                                            TextButton(
                                                onPressed: () => Navigator.pop(context),
                                                child: const Text("Huỷ")),
                                            ElevatedButton.icon(
                                              icon: const Icon(Icons.delete_forever, size: 16),
                                              label: const Text("Xoá hết"),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.red.shade600,
                                                foregroundColor: Colors.white,
                                              ),
                                              onPressed: () {
                                                item["xeNha"].clear();
                                                setState(() {});
                                                Navigator.pop(context);
                                              },
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                              ],
                            ),
                            const Divider(thickness: 1),
                            // 🔹 Header
                            Row(
                              children: const [
                                Expanded(flex: 2, child: Text("BKS", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                Expanded(flex: 3, child: Text("Nhà xe", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                Expanded(flex: 3, child: Text("Tài xế", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                Expanded(flex: 2, child: Text("SĐT", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                SizedBox(width: 32),
                              ],
                            ),
                            const SizedBox(height: 4),
                            // 🔹 Danh sách
                            ...List.generate((item["xeNha"] as List?)?.length ?? 0, (i) {
                              final xe = item["xeNha"][i];
                              final bks = xe["bks"]?.toString() ?? "";
                              final nhaXe = xe["nhaXe"]?.toString() ?? "";
                              final laiXe = xe["laiXe"]?.toString() ?? "";
                              final sdt = xe["sdt"]?.toString() ?? "";
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 2),
                                child: Row(
                                  children: [
                                    Expanded(flex: 2, child: Text(bks, style: const TextStyle(fontSize: 16))),
                                    Expanded(flex: 3, child: Text(nhaXe, style: const TextStyle(fontSize: 16))),
                                    Expanded(flex: 3, child: Text(laiXe, style: const TextStyle(fontSize: 16))),
                                    Expanded(flex: 2, child: Text(sdt, style: const TextStyle(fontSize: 16))),
                                    IconButton(
                                      icon: const Icon(Icons.close, size: 16, color: Colors.red),
                                      tooltip: "Xóa xe này",
                                      padding: EdgeInsets.zero,
                                      onPressed: () {
                                        item["xeNha"].removeAt(i);
                                        if (item["xeNha"].isEmpty) item["xeNha"] = [];
                                        setState(() {});
                                      },
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // ==================================================
                    // 🟧 BẢNG XE NGOÀI
                    // ==================================================
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.orange.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // 🔹 Tiêu đề
                            Row(
                              children: [
                                const Icon(Icons.fire_truck_outlined,
                                    size: 18, color: Colors.deepOrange),
                                const SizedBox(width: 6),
                                const Text(
                                  "Xe ngoài đã chọn",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 13,
                                    color: Colors.deepOrange,
                                  ),
                                ),
                                const Spacer(),
                                if (item["xeNgoai"] != null && item["xeNgoai"].isNotEmpty)
                                  IconButton(
                                    icon: const Icon(Icons.delete_forever,
                                        size: 18, color: Colors.red),
                                    tooltip: "Xoá tất cả xe ngoài",
                                    onPressed: () {
                                      showDialog(
                                        context: context,
                                        builder: (_) => AlertDialog(
                                          title: const Text("Xác nhận xoá tất cả"),
                                          content: const Text("Bạn có chắc muốn xoá toàn bộ xe ngoài?"),
                                          actions: [
                                            TextButton(
                                                onPressed: () => Navigator.pop(context),
                                                child: const Text("Huỷ")),
                                            ElevatedButton.icon(
                                              icon: const Icon(Icons.delete_forever, size: 16),
                                              label: const Text("Xoá hết"),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: Colors.red.shade600,
                                                foregroundColor: Colors.white,
                                              ),
                                              onPressed: () {
                                                item["xeNgoai"].clear();
                                                setState(() {});
                                                Navigator.pop(context);
                                              },
                                            ),
                                          ],
                                        ),
                                      );
                                    },
                                  ),
                              ],
                            ),
                            const Divider(thickness: 1),
                            // 🔹 Header
                            Row(
                              children: const [
                                Expanded(flex: 2, child: Text("BKS", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                Expanded(flex: 3, child: Text("Nhà xe", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                Expanded(flex: 3, child: Text("Tài xế", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                Expanded(flex: 2, child: Text("SĐT", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                                SizedBox(width: 32),
                              ],
                            ),
                            const SizedBox(height: 4),
                            // 🔹 Danh sách
                            ...List.generate((item["xeNgoai"] as List?)?.length ?? 0, (i) {
                              final xe = item["xeNgoai"][i];
                              final bks = xe["bks"]?.toString() ?? "";
                              final nhaXe = xe["nhaXeTen"]?.toString() ?? "";
                              final laiXe = xe["laiXe"]?.toString() ?? "";
                              final sdt = xe["sdt"]?.toString() ?? "";
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 2),
                                child: Row(
                                  children: [
                                    Expanded(flex: 2, child: Text(bks, style: const TextStyle(fontSize: 16))),
                                    Expanded(flex: 3, child: Text(nhaXe, style: const TextStyle(fontSize: 16))),
                                    Expanded(flex: 3, child: Text(laiXe, style: const TextStyle(fontSize: 16))),
                                    Expanded(flex: 2, child: Text(sdt, style: const TextStyle(fontSize: 16))),
                                    IconButton(
                                      icon: const Icon(Icons.close, size: 16, color: Colors.red),
                                      tooltip: "Xóa xe này",
                                      padding: EdgeInsets.zero,
                                      onPressed: () {
                                        item["xeNgoai"].removeAt(i);
                                        if (item["xeNgoai"].isEmpty) item["xeNgoai"] = [];
                                        setState(() {});
                                      },
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],

            ],

// 🧩 Hiển thị form nhập chi phí bảo hiểm (CÓ ĐỒNG BỘ JSON)
            if (item["baoHiem"] == true &&
                item["phiBaoHiemChiTiet"] != null &&
                item["phiBaoHiemChiTiet"].isNotEmpty) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "💰 Thông tin chi phí bảo hiểm",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: item["phiBaoHiemChiTiet"].entries
                      .where((entry) {
                    final key = entry.key.toString();
                    // 🔹 Nếu chọn Hàng thường → chỉ hiện "Hàng thông thường"
                    if (item["hangThuong"] == true) {
                      return key == "Hàng thông thường" ||
                          !key.contains("Hàng Quá Cảnh");
                    }
                    // 🔹 Nếu chọn Hàng quá cảnh → chỉ hiện "Hàng Quá Cảnh"
                    else {
                      return key == "Hàng Quá Cảnh" ||
                          !key.contains("Hàng thông thường");
                    }
                  })
                      .map<Widget>((entry) {
                    final key = entry.key;
                    final value = entry.value.toString();

                    // ✅ Bộ nhớ controllers riêng cho phần bảo hiểm
                    item["_controllersBaoHiem"] ??= <String, TextEditingController>{};
                    final controllers =
                    item["_controllersBaoHiem"] as Map<String, TextEditingController>;

                    // ✅ Chỉ tạo controller 1 lần duy nhất
                    if (!controllers.containsKey(key)) {
                      controllers[key] = TextEditingController(
                        text: value.isEmpty
                            ? ''
                            : NumberFormat.decimalPattern('vi_VN')
                            .format(double.tryParse(value.replaceAll('.', '')) ?? 0),
                      );
                    }

                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: SizedBox(
                        width: 175,
                        child: TextField(
                          controller: controllers[key],
                          keyboardType: TextInputType.number,
                          inputFormatters: [ThousandsSeparatorInputFormatter()],
                          style: const TextStyle(fontSize: 16, height: 1.0),
                          decoration: InputDecoration(
                            labelText: key,
                            labelStyle: const TextStyle(fontSize: 16, height: 0.8),
                            border: const OutlineInputBorder(),
                            isDense: true,
                            contentPadding:
                            const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                          ),
                          onChanged: (v) {
                            // 🔹 Làm sạch số
                            final clean = v.replaceAll(RegExp(r'[^0-9]'), '');

                            // 🔹 Cập nhật trực tiếp vào map chi tiết của xe
                            item["phiBaoHiemChiTiet"][key] = clean;

                            // 🔹 Tìm index của xe trong controller
                            final xeIndex = controller.xeList.indexWhere((e) => identical(e, item));
                            if (xeIndex != -1) {
                              controller.xeList[xeIndex]["phiBaoHiemChiTiet"] =
                              Map<String, dynamic>.from(item["phiBaoHiemChiTiet"]);
                            }

                            // 🔹 Cập nhật dữ liệu vào khách hàng
                            controller.updatePhiBaoHiemKhachHang(
                              controller.selectedKhachHang,
                              item["trongTai"],
                              key,
                              clean,
                            );

                            // 🔹 Gọi tính tổng bảo hiểm
                            controller.tinhTongBaoHiem();
                          },
                          onEditingComplete: () {
                            // Khi nhấn Enter hoặc mất focus → đồng bộ lại
                            final xeIndex =
                            controller.xeList.indexWhere((e) => identical(e, item));
                            if (xeIndex != -1) {
                              controller.xeList[xeIndex]["phiBaoHiemChiTiet"] =
                              Map<String, dynamic>.from(item["phiBaoHiemChiTiet"]);
                            }
                            controller.tinhTongBaoHiem();
                          },
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],

// ===============================
// 🧩 Hiển thị form nhập chi phí hải quan (ĐÃ FIX MƯỢT NHẬP SỐ)
// ===============================
            if (item["haiQuan"] == true &&
                item["phiHaiQuanChiTiet"] != null &&
                item["phiHaiQuanChiTiet"].isNotEmpty) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "💰 Thông tin chi phí hải quan",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.orange,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              LayoutBuilder(
                builder: (context, constraints) {
                  final double itemWidth = (constraints.maxWidth - 7 * 8) / 8;

                  // ✅ Lưu controllers cho mỗi field (chỉ khởi tạo 1 lần)
                  item["_controllers"] ??= <String, TextEditingController>{};
                  final controllers = item["_controllers"] as Map<String, TextEditingController>;

                  return Wrap(
                    spacing: 8,
                    runSpacing: 20,
                    children:
                    (item["phiHaiQuanChiTiet"] as Map<String, dynamic>).entries.map<Widget>((entry) {
                      final key = entry.key;
                      final data = entry.value;

                      // ---------------------
                      // Lấy kiểu dữ liệu
                      // ---------------------
                      String kieuDuLieu = "Số";
                      try {
                        final cuaKhau = item["diemDi"];
                        final chiPhi = key;
                        final matched = controller.phiHaiQuanList.firstWhereOrNull((e) {
                          return e["Cửa khẩu"] == cuaKhau && e["Chi phí"] == chiPhi;
                        });
                        if (matched != null && matched["Kiểu dữ liệu"] != null) {
                          kieuDuLieu = matched["Kiểu dữ liệu"].toString().trim();
                        }
                      } catch (_) {}

                      // ---------------------
                      // Lấy giá trị ban đầu
                      // ---------------------
                      String value = "";
                      if (data is Map && data["value"] != null) {
                        value = data["value"].toString();
                      } else if (data is String || data is num) {
                        value = data.toString();
                      }

                      // ---------------------
                      // Tạo controller 1 lần duy nhất
                      // ---------------------
                      if (!controllers.containsKey(key)) {
                        controllers[key] = TextEditingController(
                          text: kieuDuLieu == "Số" && value.isNotEmpty
                              ? NumberFormat.decimalPattern('vi_VN')
                              .format(double.tryParse(value.replaceAll('.', '')) ?? 0)
                              : value,
                        );
                      }

                      return SizedBox(
                        width: itemWidth,
                        child: TextField(
                          controller: controllers[key],
                          keyboardType:
                          kieuDuLieu == "Số" ? TextInputType.number : TextInputType.text,
                          inputFormatters:
                          kieuDuLieu == "Số" ? [ThousandsSeparatorInputFormatter()] : null,
                          style: const TextStyle(fontSize: 16, height: 1.0),
                          decoration: InputDecoration(
                            labelText: key,
                            labelStyle: const TextStyle(fontSize: 16, height: 0.8),
                            border: const OutlineInputBorder(),
                            isDense: true,
                            contentPadding:
                            const EdgeInsets.symmetric(vertical: 12, horizontal: 6),
                          ),
                          onChanged: (v) {
                            final clean = kieuDuLieu == "Số"
                                ? v.replaceAll(RegExp(r'[^0-9]'), '')
                                : v;

                            // 🔹 Cập nhật trực tiếp vào map chi tiết của xe
                            if (data is Map) {
                              item["phiHaiQuanChiTiet"][key]["value"] = clean;
                            } else {
                              item["phiHaiQuanChiTiet"][key] = clean;
                            }

                            // 🔹 Tìm index của xe
                            final xeIndex = controller.xeList.indexWhere((e) => identical(e, item));
                            if (xeIndex != -1) {
                              controller.xeList[xeIndex]["phiHaiQuanChiTiet"] =
                              Map<String, dynamic>.from(item["phiHaiQuanChiTiet"]);
                            }

                            // 🔹 Cập nhật vào dữ liệu khách hàng
                            controller.updatePhiHaiQuanKhachHang(
                              controller.selectedKhachHang,
                              item["diemDi"],
                              key,
                              item["trongTai"],
                              clean,
                            );

                            // 🔹 Tính lại tổng hải quan
                            controller.tinhTongHaiQuan();
                          },

                        ),
                      );
                    }).toList(),
                  );
                },
              ),
            ],

          ],
        ),
      ),
    );
  }
}

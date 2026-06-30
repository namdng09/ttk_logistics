import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/widgets/xe_dialog_helper.dart';
import '../controller/pages/chuyen_xe_controller.dart';
import '../controller/pages/form_don_hang_controller.dart';

class XeInfoForm extends StatefulWidget {
  final String? tag;
  final Map<String, dynamic>? json;
  final int? index;
  final void Function(Map<String, dynamic> selectedXe, bool isXeNha)? onXeChanged;

  const XeInfoForm({
    super.key,
    required this.json,
    this.index,
    this.tag,
    this.onXeChanged,
  });

  @override
  State<XeInfoForm> createState() => _XeInfoFormState();
}

class _XeInfoFormState extends State<XeInfoForm> {
  dynamic controller;
  // late Map<String, dynamic> jsonLocal;

  String get tag => widget.tag ?? 'form-sua-chuyen-xe';

  @override
  void initState() {
    super.initState();
    // jsonLocal = Map<String, dynamic>.from(widget.json!['thong_tin_json'] ?? {});

    if (Get.isRegistered<ChuyenXeController>(tag: tag)) {
      controller = Get.find<ChuyenXeController>(tag: tag);
    } else if (Get.isRegistered<FormDonHangController>()) {
      controller = Get.find<FormDonHangController>();
    } else {
      // fallback
      controller = Get.put(ChuyenXeController(), tag: tag);
    }
  }

  @override
  void didUpdateWidget(covariant XeInfoForm oldWidget) {
    super.didUpdateWidget(oldWidget);
    // if (widget.json != oldWidget.json) {
    //   jsonLocal = Map<String, dynamic>.from(widget.json ?? {});
    // }
  }

  // ✅ Hàm xử lý chọn xe chung
  Future<void> _chonXe(BuildContext context, {required bool isXeNha}) async {
    final xe = isXeNha
        ? await XeDialogHelper.chonXeNhaAuto(context)
        : await XeDialogHelper.chonXeNgoaiAuto(context);
    if (xe == null) return;

    final Map<String, dynamic> xeMap = Map<String, dynamic>.from(xe);

    // 🧩 Cập nhật dữ liệu controller
    if (controller is ChuyenXeController) {
      final c = controller as ChuyenXeController;
      c.currentChuyenXe ??= {};
      c.currentChuyenXe!["field_thong_tin_json"] ??= {};

// print('xeMap $xeMap'); // TODO: remove debug
      if(isXeNha){
        c.currentChuyenXe!["field_thong_tin_json"]['xe_nha'] = xeMap;
        c.currentChuyenXe!['field_loai_xe'] = 'xe_nha';
        // Nếu chọn xe nhà thì k có chi phí hải quan
        c.currentChuyenXe!["field_thong_tin_json"]['chi_phi_ncc']['phi_hai_quan'] = 0;
      }
      else{
        c.currentChuyenXe!["field_thong_tin_json"]['xe_ngoai'] = xeMap;
        c.currentChuyenXe!['field_loai_xe'] = 'xe_ngoai';
      }

      c.update();

      // debugPrint("🔁 Đã cập nhật vào controller.currentChuyenXe:");
      // debugPrint(const JsonEncoder.withIndent('  ').convert(thongTin));
    }

    // 🧩 Cập nhật local form để hiển thị lại
    // setState(() {
    //   jsonLocal["xe_nha"] = isXeNha ? xeMap : null;
    //   jsonLocal["xe_ngoai"] = isXeNha ? null : xeMap;
    //   jsonLocal["bks"] = xeMap["bks"];
    // });

    // 🧩 Gọi callback cho form cha nếu có
    widget.onXeChanged?.call(xeMap, isXeNha);
  }

  @override
  Widget build(BuildContext context) {
    final bool isLoadingXeNha = (controller?.isLoadingXeNha?.value ?? false);
    final bool isLoadingXeNgoai = (controller?.isLoadingXeNgoai?.value ?? false);

    // final json = jsonLocal;
    // final xeNha = widget.json?['field_thong_tin_json']["xe_nha"];
    // final xeNgoai = json["xe_ngoai"];
    final bool isXeNha = (widget.json?['field_loai_xe'] == 'xe_nha');
    // xeNha != null && xeNgoai == null;
    // final xeInfo = isXeNha ? xeNha : xeNgoai;

    final String loaiXe = (widget.json?['field_loai_xe'] == 'xe_nha') ? "Xe nhà" : (widget.json?['field_loai_xe'] == 'xe_ngoai'? "Xe ngoài" : "Chưa chọn");
    final String nhaXe = (widget.json?['field_loai_xe'] == 'xe_nha') ? widget.json!['field_thong_tin_json']['xe_nha']['nha_xe'] : (
        widget.json?['field_loai_xe'] == 'xe_ngoai'? widget.json!['field_thong_tin_json']['xe_ngoai']['nha_xe'] : ''
    );
    final String bks =
    loaiXe == 'Xe nhà' ? widget.json?['field_thong_tin_json']?['xe_nha']['bks'] :
    loaiXe == 'Xe ngoài' ? widget.json?['field_thong_tin_json']?['xe_ngoai']['bks'] : '';

    widget.json!['field_thong_tin_json']?["bks"]?.toString() ?? "";
    final String taiXe =
    loaiXe == 'Xe nhà' ? widget.json?['field_thong_tin_json']?['xe_nha']?['lai_xe']?['ten'] ?? '' :
    loaiXe == 'Xe ngoài' ? widget.json?['field_thong_tin_json']?['xe_ngoai']?['lai_xe']?['ten'] ?? '' : '';

    final String dienThoai =
    loaiXe == 'Xe nhà' ? widget.json?['field_thong_tin_json']?['xe_nha']?['lai_xe']?['sdt'] ?? '' :
    loaiXe == 'Xe ngoài' ? widget.json?['field_thong_tin_json']?['xe_ngoai']?['lai_xe']?['sdt'] ?? '' : '';

    return Container(
      margin: const EdgeInsets.only(top: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 🔹 Tiêu đề + nút chọn xe
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Thông tin xe ($loaiXe)",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isXeNha ? Colors.teal : Colors.blueGrey,
                ),
              ),
              Wrap(
                spacing: 8,
                children: [
                  // 🟢 Xe nhà
                  ElevatedButton.icon(
                    icon: _buildIcon(isLoadingXeNha, Colors.teal),
                    label: Text(isLoadingXeNha ? "Đang tải..." : "Chọn xe nhà"),
                    style: _xeButtonStyle(isLoadingXeNha, Colors.teal),
                    onPressed: isLoadingXeNha
                        ? null
                        : () => _chonXe(context, isXeNha: true),
                  ),

                  // 🔵 Xe ngoài
                  ElevatedButton.icon(
                    icon: _buildIcon(isLoadingXeNgoai, Colors.blueGrey),
                    label:
                    Text(isLoadingXeNgoai ? "Đang tải..." : "Chọn xe ngoài"),
                    style: _xeButtonStyle(isLoadingXeNgoai, Colors.blueGrey),
                    onPressed: isLoadingXeNgoai
                        ? null
                        : () => _chonXe(context, isXeNha: false),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 16),

          // 🔹 Thông tin xe chi tiết
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            child: widget.json?['field_loai_xe'] == ''
                ? _buildEmptyBox("Chưa có thông tin xe")
                : Column(
              key: ValueKey(bks),
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                        flex: 2,
                        child: _buildReadonlyField("Loại xe", loaiXe)),
                    const SizedBox(width: 8),
                    Expanded(
                        flex: 2,
                        child:
                        _buildReadonlyField("Nhà xe/Đơn vị", nhaXe)),
                    const SizedBox(width: 8),
                    Expanded(
                        flex: 2, child: _buildReadonlyField("BKS", bks)),
                    const SizedBox(width: 8),
                    Expanded(
                        flex: 2,
                        child: _buildReadonlyField("Tài xế", taiXe)),
                    const SizedBox(width: 8),
                    Expanded(
                        flex: 2,
                        child:
                        _buildReadonlyField("Điện thoại", dienThoai)),
                  ],
                ),
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton.icon(
                    icon: const Icon(Icons.delete_outline,
                        color: Colors.red),
                    label: const Text(
                      "Xóa xe hiện tại",
                      style: TextStyle(color: Colors.red),
                    ),
                    onPressed: _xoaXeHienTai,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 🧩 Helper: Xóa xe
  void _xoaXeHienTai() {
    if (controller is ChuyenXeController) {
      final c = controller as ChuyenXeController;
      c.currentChuyenXe?["field_thong_tin_json"]?["xe_nha"] = null;
      c.currentChuyenXe?["field_thong_tin_json"]?["xe_ngoai"] = null;
      c.currentChuyenXe?["field_loai_xe"] = '';
      c.currentChuyenXe?["field_xe"] = '';
      c.currentChuyenXe?["field_nha_xe"] = null;
      c.update();
    }

    widget.onXeChanged?.call({}, false);
  }

  // 🧩 Helper: Icon động
  Widget _buildIcon(bool isLoading, Color color) => AnimatedSwitcher(
    duration: const Duration(milliseconds: 250),
    child: isLoading
        ? SizedBox(
      key: const ValueKey("spinner"),
      width: 16,
      height: 16,
      child: CircularProgressIndicator(strokeWidth: 2, color: color),
    )
        : Icon(Icons.local_shipping_outlined, color: color),
  );

  // 🧩 Helper: style nút
  ButtonStyle _xeButtonStyle(bool isLoading, MaterialColor baseColor) =>
      ElevatedButton.styleFrom(
        backgroundColor:
        isLoading ? baseColor.shade50 : baseColor.shade100,
        foregroundColor: baseColor.shade800,
        elevation: 0,
      );

  // 🧩 Helper: field đọc-only
  Widget _buildReadonlyField(String label, String value) => TextFormField(
    readOnly: true,
    initialValue: value,
    decoration: InputDecoration(
      labelText: label,
      border: const OutlineInputBorder(),
      filled: true,
      fillColor: Colors.grey.shade50,
      suffixIcon: const Icon(Icons.lock_outline, size: 18),
      isDense: true,
      contentPadding:
      const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
    ),
    style: const TextStyle(color: Colors.black87, fontSize: 14),
  );

  Widget _buildEmptyBox(String message) => Container(
    key: const ValueKey("empty"),
    margin: const EdgeInsets.only(top: 12),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Colors.grey.shade50,
      borderRadius: BorderRadius.circular(8),
      border: Border.all(color: Colors.grey.shade300),
    ),
    child: Text(message, style: const TextStyle(color: Colors.grey)),
  );
}

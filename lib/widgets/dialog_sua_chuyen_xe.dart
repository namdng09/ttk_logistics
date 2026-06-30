import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/chuyen_xe_controller.dart';
import 'package:ttk_logistics/controller/pages/form_don_hang_controller.dart';
import 'package:ttk_logistics/views/ui/pages/bap2/form_sua_chuyen_xe_screen.dart';

class DialogSuaChuyenXe extends StatefulWidget {
  final int nid;
  const DialogSuaChuyenXe({super.key, required this.nid});

  @override
  State<DialogSuaChuyenXe> createState() => _DialogSuaChuyenXeState();
}

class _DialogSuaChuyenXeState extends State<DialogSuaChuyenXe> {
  late ChuyenXeController chuyenXeCtrl;
  late FormDonHangController khCtrl;
  bool isReady = false;

  @override
  void initState() {
    super.initState();

    // Controller riêng cho form
    chuyenXeCtrl = Get.put(
      ChuyenXeController(),
      tag: 'form-sua-chuyen-xe',
    );

    khCtrl = Get.put(FormDonHangController());

    _initData();
  }

  Future<void> _initData() async {
    // 1️⃣ Load chi tiết chuyến xe
    await chuyenXeCtrl.viewDetail(widget.nid,
      mode: ChuyenXeViewMode.edit,
    );
    // 2️⃣ Load danh sách khách hàng
    await khCtrl.loadKhachHang();

    if (!mounted) return;

    setState(() {
      isReady = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: EdgeInsets.zero,
      backgroundColor: Colors.white,
      child: SizedBox(
        width: MediaQuery.of(context).size.width,
        height: MediaQuery.of(context).size.height,
        child: isReady
            ? const FormSuaChuyenXeScreen()
            : const Center(
          child: CircularProgressIndicator(),
        ),
      ),
    );
  }
}

import 'dart:convert';
import 'package:kho555/helper/utils/app_toast.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:http/http.dart' as http;
import 'package:kho555/helper/services/auth_services.dart';
import 'package:oktoast/oktoast.dart';

class XeDialogHelper {
  /// ===============================================================
  /// 🧩 CHỌN XE NHÀ (dùng chung)
  /// ===============================================================
  static Future<Map<String, dynamic>?> chonXeNha(
      BuildContext context, {
        required int index,
        required int soLuong,
        required List<Map<String, dynamic>> laiXeList,
        required List<Map<String, dynamic>> phuongTienList,
        required List<Map<String, dynamic>> xeNhaHienTai,
        required List<Map<String, dynamic>> xeNgoaiHienTai,
      })
  async {

    final int maxSoLuong = soLuong;
    final int currentXeNgoai = xeNgoaiHienTai.length;

    // Danh sách chọn tạm thời
    final List<Map<String, dynamic>> tempSelected =
    List<Map<String, dynamic>>.from(xeNhaHienTai.map((e) => Map<String, dynamic>.from(e)));

    final selectedXe = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            title: Text("Danh sách xe nhà (tối đa $maxSoLuong xe)"),
            shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                        SizedBox(
                            width: 40,
                            child: Center(child: Text("Chọn", style: TextStyle(fontWeight: FontWeight.bold)))),
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
                        final field_nha_xe = xe['field_nha_xe'];
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
                                        AppToast.warning("Tổng xe nhà + xe ngoài không vượt quá $maxSoLuong.");
                                        return;
                                      }

                                      tempSelected.add({
                                        "field_nha_xe": field_nha_xe,
                                        "nid": nid,
                                        "bks": bks,
                                        "nhaXe": nhaXe,
                                        "laiXe": tenLaiXe,
                                        "laiXeId": idLaiXe,
                                        "sdt": laiXeList.firstWhereOrNull(
                                              (lx) => lx["nid"].toString() ==
                                              idLaiXe.toString(),
                                        )?["field_dien_thoai"] ??
                                            "",
                                        "loaiXe": loaiXe,
                                      });
                                    } else {
                                      tempSelected.removeWhere(
                                              (e) => e["nid"] == nid);
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
                                  value: laiXeList.firstWhereOrNull(
                                          (lx) =>
                                      lx["field_ten_lai_xe"] ==
                                          currentLaiXe)?["nid"],
                                  isExpanded: true,
                                  decoration: const InputDecoration(
                                    border: OutlineInputBorder(),
                                    isDense: true,
                                  ),
                                  items: laiXeList.map((lx) {
                                    final ten =
                                        lx["field_ten_lai_xe"] ?? "Không rõ";
                                    final sdt =
                                        lx["field_dien_thoai"] ?? "";
                                    final nid = lx["nid"];
                                    return DropdownMenuItem<int>(
                                      value: nid,
                                      child: Text("$ten (${sdt.isEmpty ? '---' : sdt})",
                                          overflow: TextOverflow.ellipsis),
                                    );
                                  }).toList(),
                                  onChanged: (int? selectedId) {
                                    final laiXe = laiXeList.firstWhereOrNull(
                                            (lx) => lx["nid"] == selectedId);
                                    final found = tempSelected.firstWhereOrNull(
                                            (e) => e["nid"] == nid);
                                    if (found != null && laiXe != null) {
                                      found["laiXeId"] = laiXe["nid"];
                                      found["laiXe"] =
                                      laiXe["field_ten_lai_xe"];
                                      found["sdt"] =
                                      laiXe["field_dien_thoai"];
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
                    AppToast.warning("Vui lòng chọn ít nhất 1 xe nhà.");
                    return;
                  }

                  if (tempSelected.length + currentXeNgoai > maxSoLuong) {
                    AppToast.warning("Tổng xe nhà + xe ngoài không vượt quá $maxSoLuong.");
                    return;
                  }

                  print('tempSelected.first ${tempSelected.first}');
                  Navigator.pop(context, tempSelected.first);
                },
              ),
            ],
          );
        });
      },
    );

    print('selectedXe ${selectedXe}');
    return selectedXe;
  }

  /// ===============================================================
  /// 🧩 CHỌN XE NGOÀI (dùng chung)
  /// ===============================================================
  static Future<Map<String, dynamic>?> chonXeNgoai(
      BuildContext context, {
        required int index,
        required int soLuong,
        required List<Map<String, dynamic>> nhaXeNgoaiList,
        required List<Map<String, dynamic>> xeNgoaiHienTai,
        required List<Map<String, dynamic>> xeNhaHienTai,
      }) async {

    final int maxSoLuong = soLuong;
    final int currentXeNha = xeNhaHienTai.length;

    final List<Map<String, dynamic>> tempList = List<Map<String, dynamic>>.from(
        xeNgoaiHienTai.map((e) => Map<String, dynamic>.from(e)));

    if (tempList.isEmpty) {
      tempList.add({
        "field_nha_xe": null,
        "nid": null,
        "nhaXeTen": "",
        "bks": "",
        "laiXe": "",
        "sdt": "",
      });
    }

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) {
        return StatefulBuilder(builder: (context, setState) {
          return AlertDialog(
            title: Text("🚛 Danh sách xe ngoài (tối đa $maxSoLuong xe)"),
            shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                              Expanded(
                                flex: 3,
                                child: DropdownButtonFormField<int>(
                                  dropdownColor: Colors.white,
                                  value: xe["nid"] != null
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
                                    final nid = int.tryParse(
                                        nhaXe["nid"].toString()) ??
                                        0;
                                    return DropdownMenuItem<int>(
                                      value: nid,
                                      child: Text(ten,
                                          overflow: TextOverflow.ellipsis),
                                    );
                                  }).toList(),
                                  onChanged: (nid) {
                                    final nhaXe = nhaXeNgoaiList.firstWhere(
                                          (n) =>
                                      int.tryParse(n["nid"].toString()) ==
                                          nid,
                                      orElse: () => {},
                                    );
                                    xe["nid"] = nid;
                                    xe["nhaXeTen"] =
                                        nhaXe["title"] ??
                                            nhaXe["field_ten_nha_xe"] ??
                                            "";
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
                                icon: const Icon(Icons.delete_outline,
                                    color: Colors.red),
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
                        final totalSelected =
                            currentXeNha + tempList.length + 1;
                        if (totalSelected > maxSoLuong) {
                          AppToast.warning("Tổng xe nhà + xe ngoài không vượt quá $maxSoLuong.");
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
                      AppToast.warning("Vui lòng chọn Nhà xe và nhập BKS.");
                      return;
                    }
                  }
                  print('tempList.first ${tempList.first}');
                  Navigator.pop(context, tempList.first);
                },
              ),
            ],
          );
        });
      },
    );

    return result;
  }

  /// ===============================================================
  /// 🧩 API tiện ích (load danh sách)
  /// ===============================================================
  static Future<List<Map<String, dynamic>>> getPhuongTien() async {
    print('AuthService.getListPhuongTien ${AuthService.getListPhuongTien}');
    final res = await http.post(
      Uri.parse(AuthService.workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": AuthService.getListPhuongTien,
        "method": "POST",
      }),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data["success"] == true) {
        return List<Map<String, dynamic>>.from(data["content"]);
      }
    }
    return [];
  }

  static Future<List<Map<String, dynamic>>> getLaiXe() async {
    print('AuthService.getListLaiXe ${AuthService.getListLaiXe}');
    final res = await http.post(
      Uri.parse(AuthService.workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": AuthService.getListLaiXe,
        "method": "POST",
      }),
    );

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data["success"] == true) {
        return List<Map<String, dynamic>>.from(data["content"]);
      }
    }
    return [];
  }

  static Future<List<Map<String, dynamic>>> getNhaXeNgoai() async {
    final res = await http.post(
      Uri.parse(AuthService.workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": AuthService.getListNhaXe,
        "method": "POST",
        "params": {"type": "ngoai"},
      }),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      if (data["success"] == true) {
        return List<Map<String, dynamic>>.from(data["content"]);
      }
    }
    return [];
  }

  /// ===============================================================
  /// 🧩 PHIÊN BẢN RÚT GỌN CHO CHUYẾN XE
  /// ===============================================================
  static Future<Map<String, dynamic>?> chonXeNhaAuto(BuildContext context) async {
    try {
      Get.dialog(const Center(child: CircularProgressIndicator()),
          barrierDismissible: false);

      // 🔹 Tải dữ liệu cần thiết
      final phuongTienList = await getPhuongTien();
      final laiXeList = await getLaiXe();

      Get.back();

      // 🔹 Gọi dialog chọn xe
      final xe = await chonXeNha(
        context,
        index: 0,
        soLuong: 1,
        laiXeList: laiXeList,
        phuongTienList: phuongTienList,
        xeNhaHienTai: [],
        xeNgoaiHienTai: [],
      );

      if (xe == null) return null;

      print('dialog chon xe ${xe}');
      // 🔹 Chuẩn hóa kết quả trả về (dạng giống FormDonHangController)
      return {
        'nid_nha_xe': xe['field_nha_xe'],
        "nid": xe["nid"],
        "bks": xe["bks"],
        "nha_xe": xe["nhaXe"],
        "lai_xe": {
          "nid": xe["laiXeId"],
          "ten": xe["laiXe"],
          "sdt": xe["sdt"],
        },
        "loai_xe": xe["loaiXe"],
      };
    } catch (e) {
      Get.back();
      AppToast.error("Không thể tải danh sách xe nhà: $e");
      return null;
    }
  }

  static Future<Map<String, dynamic>?> chonXeNgoaiAuto(BuildContext context) async {
    try {
      Get.dialog(const Center(child: CircularProgressIndicator()),
          barrierDismissible: false);

      // 🔹 Tải dữ liệu cần thiết
      final nhaXeNgoaiList = await getNhaXeNgoai();

      Get.back();

      // 🔹 Gọi dialog chọn xe ngoài
      final xe = await chonXeNgoai(
        context,
        index: 0,
        soLuong: 1,
        nhaXeNgoaiList: nhaXeNgoaiList,
        xeNgoaiHienTai: [],
        xeNhaHienTai: [],
      );

      if (xe == null) return null;

      // 🔹 Chuẩn hóa kết quả trả về (giống FormDonHangController)
      return {
        "nid": xe["nid"],
        "nha_xe": xe["nhaXeTen"],
        "bks": xe["bks"],
        "lai_xe": {
          "ten": xe["laiXe"],
          "sdt": xe["sdt"],
        },
        "loai_xe": xe["loaiXe"] ?? "",
      };
    } catch (e) {
      Get.back();
      AppToast.error("Không thể tải danh sách xe ngoài: $e");
      return null;
    }
  }

}

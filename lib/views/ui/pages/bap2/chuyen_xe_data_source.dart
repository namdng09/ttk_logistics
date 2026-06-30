import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// ✅ DataSource cho bảng chuyến xe (phiên bản không zebra style)
class ChuyenXeDataSource extends DataTableSource {
  final List<Map<String, dynamic>> data;
  final NumberFormat currency;
  final DateFormat dateFormat;
  final DateFormat timeFormat;

  ChuyenXeDataSource(
      this.data,
      this.currency,
      this.dateFormat,
      this.timeFormat,
      );

  @override
  DataRow? getRow(int index) {
    if (index >= data.length) return null;
    final item = data[index];
    final rawJson = item["field_thong_tin_json"];
    final info = (rawJson is Map)
        ? rawJson
        : (rawJson is String
        ? (jsonDecode(rawJson) as Map<String, dynamic>)
        : <String, dynamic>{});


    // final info = item["field_thong_tin_json"] ?? {};

    // ✅ Ngày vận chuyển (field_ngay_van_chuyen)
    String ngayVC = "";
    try {
      final raw = item["field_ngay_van_chuyen"];
      if (raw != null) {
        DateTime date;
        if (raw is int) {
          date = DateTime.fromMillisecondsSinceEpoch(raw * 1000);
        } else if (raw is String) {
          final ts = int.tryParse(raw);
          if (ts != null) {
            date = DateTime.fromMillisecondsSinceEpoch(ts * 1000);
          } else {
            date = DateTime.parse(raw);
          }
        } else {
          date = DateTime.now();
        }
        ngayVC = DateFormat("dd/MM/yyyy").format(date);
      }
    } catch (e) {
      ngayVC = "";
    }

    // 🔹 Format Ngày trả (timestamp → dd/MM/yyyy HH:mm)
    DateTime? ngayTra;
    if (item["field_ngay_gio_tra_hang"] != null) {
      try {
        final timestamp =
        int.tryParse(item["field_ngay_gio_tra_hang"].toString());
        if (timestamp != null && timestamp > 0) {
          ngayTra = DateTime.fromMillisecondsSinceEpoch(timestamp * 1000);
        }
      } catch (_) {}
    }

    // 🔹 Hàm định dạng tiền
    String formatMoney(dynamic value) {
      if (value == null) return "";
      final num? val = num.tryParse(value.toString());
      return val != null ? currency.format(val) : "";
    }

    // 🔹 Helper cell gọn gàng (không có màu nền)
    Widget cellText(
        String text, {
          bool alignRight = false,
          Color? color,
          FontWeight? weight,
        }) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        alignment:
        alignRight ? Alignment.centerRight : Alignment.centerLeft,
        child: Text(
          text,
          style: TextStyle(
            fontSize: 13,
            color: color ?? Colors.black87,
            fontWeight: weight ?? FontWeight.normal,
            height: 1.3,
          ),
        ),
      );
    }

    return DataRow(cells: [
      // ✅ Ngày VC (dd/MM/yyyy)
      DataCell(cellText(ngayVC)),

      // ✅ Ngày trả (dd/MM/yyyy)
      DataCell(cellText(
          ngayTra != null ? DateFormat("dd/MM/yyyy").format(ngayTra) : "")),

      // ✅ Giờ trả (HH:mm)
      DataCell(cellText(ngayTra != null ? timeFormat.format(ngayTra) : "")),

      DataCell(cellText(info["diem_di"]?.toString() ?? "")),

      // ✅ Điểm đến (cho phép xuống dòng + tooltip)
      DataCell(
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Tooltip(
            message: info["diem_den"] ?? "",
            waitDuration: const Duration(milliseconds: 400),
            child: SizedBox(
              width: 200,
              child: Text(
                info["diem_den"] ?? "",
                softWrap: true,
                maxLines: 3,
                style: const TextStyle(fontSize: 13, height: 1.3),
              ),
            ),
          ),
        ),
      ),

      DataCell(cellText(info["trong_tai"] ?? "")),
      DataCell(cellText(info["bks"] ?? "")),
      DataCell(cellText(info["luu_ca"]?.toString() ?? "")),
      DataCell(cellText(item["field_nha_xe"]?.toString() ?? "")),

      // ✅ Chi phí khác (căn phải)
      DataCell(cellText(formatMoney(info["phi_phat_sinh_khac"]),
          alignRight: true, color: Colors.blueGrey)),

      // ✅ Tổng tiền (căn phải)
      DataCell(cellText(formatMoney(info["tong_phi"]),
          alignRight: true,
          color: Colors.teal,
          weight: FontWeight.w600)),

      DataCell(cellText(item["field_khach_hang_ref"] ?? "")),

      // ✅ Cước xe NCC (căn phải)
      DataCell(cellText(
          info["gia_cuoc_ncc"] != null
              ? "${formatMoney(info["gia_cuoc_ncc"])} đ"
              : "",
          alignRight: true,
          color: Colors.redAccent,
          weight: FontWeight.bold)),
    ]);
  }

  @override
  bool get isRowCountApproximate => false;
  @override
  int get rowCount => data.length;
  @override
  int get selectedRowCount => 0;
}

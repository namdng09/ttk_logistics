import 'package:flutter/material.dart';
import 'tra_them_diem_widget.dart';
import 'chi_phi_khac_widget.dart';

class TraDiemVaChiPhiKhacRow extends StatefulWidget {
  final Map<String, dynamic>? data; // ✅ Nhận dữ liệu chuyến xe hiện tại
  final Map<String, dynamic>? nhaCungCap; // ✅ Nhận dữ liệu chuyến xe hiện tại
  final ValueChanged<double>? onChiPhiKhacChanged;
  final ValueChanged<double>? onTraThemDiemChanged;
  final ValueChanged<double>? onTraThemDiemNCCChanged;

  final String trongTai;
  final List<dynamic> khachHangList;
  final String? khachHangId;

  const TraDiemVaChiPhiKhacRow({
    super.key,
    this.data,
    this.nhaCungCap,
    this.onChiPhiKhacChanged,
    this.onTraThemDiemChanged,
    this.onTraThemDiemNCCChanged,
    required this.trongTai,
    required this.khachHangList,
    this.khachHangId,
  });

  @override
  State<TraDiemVaChiPhiKhacRow> createState() => _TraDiemVaChiPhiKhacRowState();
}

class _TraDiemVaChiPhiKhacRowState extends State<TraDiemVaChiPhiKhacRow> {
  double chiPhiKhacTotal = 0;
  double traThemDiemTotal = 0;
  double traThemDiemNCCTotal = 0;

  List<Map<String, dynamic>> chiPhiKhacList = [];
  List<Map<String, dynamic>> traThemDiemList = [];

  @override
  void didUpdateWidget(covariant TraDiemVaChiPhiKhacRow oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.trongTai != widget.trongTai) {
      _recalculateTraThemDiemByTrongTai();
    }
  }
  Map<String, dynamic>? _asStringKeyMap(dynamic v) {
    if (v is Map) {
      return v.map((key, value) => MapEntry(key.toString(), value));
    }
    return null;
  }

  void _recalculateTraThemDiemByTrongTai() {
    final data = widget.data?['field_thong_tin_json'];
    final khach = widget.data?['field_thong_tin_json_khach_hang'];

    if (data == null || khach == null) return;

    final String? trongTai = widget.trongTai;
    final List<dynamic>? traThemList = data['tra_them_diem'];

    if (trongTai == null || traThemList == null) return;

    double total = 0;

    for (final item in traThemList) {
      if (item is! Map) continue;

      final String? loaiTuyen = item['loai_tuyen'];
      final double soKm = double.tryParse(item['so_km']?.toString() ?? '0') ?? 0;
      final double soLuong = double.tryParse(item['so_luong']?.toString() ?? '1') ?? 1;

      // =============================
      // 1️⃣ CHỌN ĐÚNG BẢNG CẤU HÌNH
      // =============================
      List<dynamic>? cauHinhList;

      if (loaiTuyen == 'cung_tinh_khac_tuyen') {
        cauHinhList = khach['field_phi_cung_tinh_khac_tuyen'];
      } else if (loaiTuyen == 'cung_tuyen_khac_tinh') {
        cauHinhList = khach['field_phi_cung_tuyen_khac_tinh'];
      }

      if (cauHinhList is! List) continue;

      // =============================
      // 2️⃣ TÌM DÒNG PHÙ HỢP TRỌNG TẢI + KM
      // =============================
      Map<String, dynamic>? matched;

      for (final cfg in cauHinhList) {
        final map = _asStringKeyMap(cfg);
        if (map == null) continue;

        if (map['Trọng tải'] != trongTai) continue;

        final double kmMin =
            double.tryParse(map['KM gần nhất']?.toString() ?? '0') ?? 0;
        final double kmMax =
            double.tryParse(map['KM xa nhất']?.toString() ?? '0') ?? double.infinity;

        if (soKm >= kmMin && soKm <= kmMax) {
          matched = map; // ✅ đúng type
          break;
        }
      }

      if (matched == null) continue;

      // =============================
      // 3️⃣ TÍNH TIỀN
      // =============================
      final double donGia =
          double.tryParse(
            matched['Chi phí']!.toString().replaceAll(RegExp(r'[^0-9]'), ''),
          ) ??
              0;

      final double thanhTien = donGia * soLuong;

      item['don_gia'] = donGia;
      item['thanh_tien'] = thanhTien;

      total += thanhTien;
    }

    // =============================
    // 4️⃣ UPDATE UI + CALLBACK
    // =============================
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;

      setState(() {
        traThemDiemTotal = total;
      });

      widget.onTraThemDiemChanged?.call(total);
    });
  }

  @override
  void initState() {
    super.initState();

    final Map<String, dynamic> data = widget.data ?? {};

    // 🔹 Lấy danh sách chi phí khác
    final rawChiPhi = data['field_thong_tin_json']["chi_phi_khac"];
    if (rawChiPhi is List) {
      chiPhiKhacList = List<Map<String, dynamic>>.from(rawChiPhi);
    } else {
      chiPhiKhacList = [];
      data['field_thong_tin_json']["chi_phi_khac"] = chiPhiKhacList;
    }

    // 🔹 Lấy danh sách trả thêm điểm
    final rawThemDiem = data['field_thong_tin_json']["tra_them_diem"];
    if (rawThemDiem is List) {
      traThemDiemList = List<Map<String, dynamic>>.from(rawThemDiem);
    } else {
      traThemDiemList = [];
      data['field_thong_tin_json']["tra_them_diem"] = traThemDiemList;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 🟩 Widget Trả thêm điểm
        TraThemDiemWidget(
          initialList: (widget.data?['field_thong_tin_json']["tra_them_diem"] as List?)?.map((e) => Map<String, dynamic>.from(e)).toList() ?? [],
          data: widget.data,
          onListChanged: (list) {
            widget.data?["tra_them_diem"] = list;
          },
          onTotalChanged: (value) {
            // ✅ Trì hoãn setState sau khi build kết thúc
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                setState(() => traThemDiemTotal = value);
                widget.onTraThemDiemChanged?.call(value);
              }
            });
          },
          onTotalChangedNCC: (value) {
            // ✅ Trì hoãn setState sau khi build kết thúc
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                setState(() => traThemDiemNCCTotal = value);
                widget.onTraThemDiemNCCChanged?.call(value);
              }
            });
          },
        ),

        const SizedBox(height: 12),

        ChiPhiKhacWidget(
          initialList: (widget.data?["chi_phi_khac"] as List?)?.map((e) => Map<String, dynamic>.from(e)).toList() ?? [],
          onListChanged: (list) {
            widget.data?["chi_phi_khac"] = list;
          },
          onTotalChanged: (value) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                setState(() => chiPhiKhacTotal = value);
                widget.onChiPhiKhacChanged?.call(value);
              }
            });
          },
        ),
      ],
    );
  }
}

import 'dart:convert';
import 'package:kho555/widgets/thousands_separator_input_formatter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';

class TraThemDiemWidget extends StatefulWidget {
  final ValueChanged<double>? onTotalChanged;
  final ValueChanged<double>? onTotalChangedNCC;
  final ValueChanged<List<Map<String, dynamic>>>? onListChanged;
  final Map<String, dynamic>? data; // 🧩 Thông tin khách hàng
  final List<Map<String, dynamic>>? initialList; // 🧩 Dữ liệu ban đầu

  const TraThemDiemWidget({
    super.key,
    this.onTotalChanged,
    this.onTotalChangedNCC,
    this.onListChanged,
    this.data,
    this.initialList,
  });

  @override
  State<TraThemDiemWidget> createState() => _TraThemDiemWidgetState();
}

class _TraThemDiemWidgetState extends State<TraThemDiemWidget> {
  final ScrollController _scrollController = ScrollController();
  final NumberFormat _formatCurrency = NumberFormat('#,##0', 'vi_VN');
  List<Map<String, dynamic>> traDiemList = [];

  @override
  void initState() {
    super.initState();
    traDiemList = List<Map<String, dynamic>>.from(widget.initialList ?? []);
    _notifyTotalChanged();
  }

  /// 🧮 Gửi tổng tiền ra ngoài
  void _notifyTotalChanged() {
    double sum = 0;
    double sumNCC = 0;
    for (final item in traDiemList) {
      final phiThem = double.tryParse(
        item["phiThem"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
      ) ?? 0;
      sum += phiThem;
    }
    for (final item in traDiemList) {
      final phiThemNCC = double.tryParse(
        item["phiThemNCC"].toString().replaceAll(RegExp(r'[^0-9]'), ''),
      ) ?? 0;
      sumNCC += phiThemNCC;
    }

    widget.onTotalChanged?.call(sum);
    widget.onTotalChangedNCC?.call(sumNCC);
    widget.onListChanged?.call(List<Map<String, dynamic>>.from(traDiemList));
  }

  /// 🧩 Parse danh sách phí cấu hình
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

  /// 🔹 Tính phí thêm
  void _tinhPhiThem(Map<String, dynamic> item) {
    final trongTai = widget.data?['field_thong_tin_json']['trong_tai'].trim();
    double phi = 0;
    double phiNCC = 0;

    // 🟩 Cùng tuyến khác tỉnh
    if (item["cungTuyenKhacTinh"] == true) {
      final list = _parsePhiList(widget.data?['field_thong_tin_json_khach_hang']["field_phi_cung_tuyen_khac_tinh"]);
      if (list.isNotEmpty) {
        final match = list.firstWhere(
              (e) => e["Trọng tải"]?.toString()?.trim() == trongTai,
          orElse: () => {},
        );
        if (match.isNotEmpty) {
          phi = double.tryParse(match["Chi phí"].toString()) ?? match["Chi phí"];
        }
      }

      final listNCC = _parsePhiList(widget.data?['field_thong_tin_json_ncc']["field_phi_cung_tuyen_khac_tinh"]);
      if (listNCC.isNotEmpty) {
        final match = listNCC.firstWhere(
              (e) => e["Trọng tải"]?.toString()?.trim() == trongTai,
          orElse: () => {},
        );
        if (match.isNotEmpty) {
          phiNCC = double.tryParse(match["Chi phí"].toString()) ?? match["Chi phí"];
        }
      }
    }

    // 🟨 Cùng tỉnh khác tuyến
    if (item["cungTinhKhacTuyen"] == true) {

      final list = _parsePhiList(widget.data?['field_thong_tin_json_khach_hang']["field_phi_cung_tinh_khac_tuyen"]);
      final double km = item["khoangCach"] == '' ? 0 : (double.tryParse(
        item["khoangCach"].toString().replaceAll(',', '.'),
      ) ?? item["khoangCach"]);

      for (final e in list) {
        final trongTaiMatch = e["Trọng tải"]?.toString()?.trim() == trongTai;
        if (!trongTaiMatch) continue;

        final minKm = double.tryParse(e["KM gần nhất"].toString()) ?? 0;
        final maxKm = double.tryParse(e["KM xa nhất"].toString()) ?? 0;
        final donGia = double.tryParse(e["Chi phí"].toString()) ?? 0;

        print('min ${minKm} max ${maxKm} donGia ${donGia}');
        if (km >= minKm && km <= maxKm) {
          final soKmTinhCuoc = km - minKm;
          phi = donGia * soKmTinhCuoc;
          debugPrint("🚛 Trả cùng tỉnh khác tuyến: $km km (min=$minKm, max=$maxKm), đơn giá=$donGia → số km=$soKmTinhCuoc → phí=$phi");
          break;
        }
      }

      // Tính chi phí cho nhà cung cấp
      final listNCC = _parsePhiList(widget.data?['field_thong_tin_json_ncc']["field_phi_cung_tinh_khac_tuyen"]);
      for (final e in listNCC) {
        final trongTaiMatch = e["Trọng tải"]?.toString()?.trim() == trongTai;
        if (!trongTaiMatch) continue;

        final minKm = double.tryParse(e["KM gần nhất"].toString()) ?? 0;
        final maxKm = double.tryParse(e["KM xa nhất"].toString()) ?? 0;
        final donGia = double.tryParse(e["Chi phí"].toString()) ?? 0;

        if (km >= minKm && km <= maxKm) {
          final soKmTinhCuoc = km - minKm;
          phiNCC = donGia * soKmTinhCuoc;
          break;
        }
      }
    }

    // ✅ Cập nhật item & tổng
    setState(() {
      item["phiThem"] = phi; //_formatCurrency.format(phi);
      item["phiThemNCC"] = phiNCC; //_formatCurrency.format(phi);
    });

    _notifyTotalChanged();
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

  void _addRow() {
    setState(() {
      traDiemList.add({
        "ten": "",
        "khoangCach": "",
        "phiThem": 0,
        "ghiChu": "",
        "cungTuyenKhacTinh": false,
        "cungTinhKhacTuyen": false,
      });
    });
    _notifyTotalChanged();
  }

  void _removeRow(int index) {
    setState(() {
      traDiemList.removeAt(index);
    });
    _notifyTotalChanged();
  }

  @override
  void didUpdateWidget(covariant TraThemDiemWidget oldWidget) {
    super.didUpdateWidget(oldWidget);

    // 🔄 Khi trọng tải thay đổi → tính lại toàn bộ
    if (oldWidget.data?['field_thong_tin_json']['trong_tai'] != widget.data?['field_thong_tin_json']['trong_tai']) {
      for (final item in traDiemList) {
        if (item["cungTinhKhacTuyen"] == true || item["cungTuyenKhacTinh"] == true) {
          _tinhPhiThem(item);
        }
      }
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

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.pin_drop_outlined, color: Colors.blue, size: 16),
            SizedBox(width: 4),
            Text("Trả thêm điểm", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          ],
        ),
        const SizedBox(height: 6),

        Container(
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
                rows: List.generate(traDiemList.length, (index) {
                  final item = traDiemList[index];
                  return DataRow(cells: [
                    // 🔹 Tên điểm
                    DataCell(SizedBox(
                      width: 160,
                      child: _buildDeferredTextField(
                        initialValue: item["ten"],
                        onCommit: (v) {
                          item["ten"] = v;
                          _notifyTotalChanged();
                        },
                      ),
                    )),

                    // 🔹 Khoảng cách
                    // DataCell(SizedBox(
                    //   width: 80,
                    //   child: _buildDeferredTextField(
                    //     initialValue: item["khoangCach"].toString(),
                    //     textAlign: TextAlign.center,
                    //     onCommit: (v) {
                    //       print('v khoang cach ${v}');
                    //       item["khoangCach"] = v;
                    //       if (item["cungTinhKhacTuyen"] == true) {
                    //         _tinhPhiThem(item);
                    //       } else {
                    //         _notifyTotalChanged();
                    //       }
                    //     },
                    //   ),
                    // )),

                    // 🔹 Khoảng cách
                    DataCell(SizedBox(
                      width: 100,
                      child: _buildDeferredTextField(
                        initialValue: item["khoangCach"]?.toString() ?? "",
                        textAlign: TextAlign.right,
                        keyboardType: TextInputType.number,
                        inputFormatters: [ThousandsSeparatorInputFormatter()],
                        suffixText: " km",
                        onCommit: (v) {
                          // 🔸 Chuẩn hóa giá trị về double
                          final double km = (v is num)
                              ? (v as num).toDouble()
                              : double.tryParse(v.toString().replaceAll(',', '').trim()) ?? 0;

                          item["khoangCach"] = km;
                          print('Khoảng cách đã nhập: $km');

                          if (item["cungTinhKhacTuyen"] == true) {
                            _tinhPhiThem(item);
                          } else {
                            _notifyTotalChanged();
                          }
                        },
                      ),
                    )),

                    // 🔹 Cùng tỉnh khác tuyến
                    DataCell(Checkbox(
                      value: item["cungTinhKhacTuyen"] ?? false,
                      onChanged: (v) {
                        setState(() {
                          item["cungTinhKhacTuyen"] = v;
                          if (v == true) item["cungTuyenKhacTinh"] = false;
                        });
                        _tinhPhiThem(item);
                      },
                    )),

                    // 🔹 Cùng tuyến khác tỉnh
                    DataCell(Checkbox(
                      value: item["cungTuyenKhacTinh"] ?? false,
                      onChanged: (v) {
                        setState(() {
                          item["cungTuyenKhacTinh"] = v;
                          if (v == true) item["cungTinhKhacTuyen"] = false;
                        });
                        _tinhPhiThem(item);
                      },
                    )),

                    // 🔹 Phí thêm
                    DataCell(SizedBox(
                      width: 100,
                      child: TextField(
                        textAlign: TextAlign.right,
                        readOnly: true,
                        controller: TextEditingController(text: _formatCurrency.format(item["phiThem"]).toString()),
                        // controller: TextEditingController(text: item["phiThem"]),
                        decoration: const InputDecoration(border: InputBorder.none),
                      ),
                    )),

                    // 🔹 Ghi chú
                    DataCell(SizedBox(
                      width: 150,
                      child: _buildDeferredTextField(
                        initialValue: item["ghiChu"],
                        onCommit: (v) {
                          item["ghiChu"] = v;
                          _notifyTotalChanged();
                        },
                      ),
                    )),

                    // 🔹 Xóa
                    DataCell(SizedBox(
                      width: 50,
                      child: IconButton(
                        icon: const Icon(Icons.delete, size: 20),
                        onPressed: () => _removeRow(index),
                      ),
                    )),
                  ]);
                }),
              ),
            ),
          ),
        ),

        const SizedBox(height: 6),
        TextButton.icon(
          onPressed: _addRow,
          icon: const Icon(Icons.add, size: 18),
          label: const Text("Thêm điểm trả"),
        ),
      ],
    );
  }
}

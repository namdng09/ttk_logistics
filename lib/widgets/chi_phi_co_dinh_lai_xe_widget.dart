import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:ttk_logistics/widgets/thousands_separator_input_formatter.dart';

class ChiPhiCoDinhVaLaiXeWidget extends StatefulWidget {
  final Map<String, dynamic> thongTinJson;
  final VoidCallback? onChanged;

  const ChiPhiCoDinhVaLaiXeWidget({
    super.key,
    required this.thongTinJson,
    this.onChanged,
  });

  @override
  State<ChiPhiCoDinhVaLaiXeWidget> createState() =>
      ChiPhiCoDinhVaLaiXeWidgetState();
}

class ChiPhiCoDinhVaLaiXeWidgetState
    extends State<ChiPhiCoDinhVaLaiXeWidget> {
  Map<String, dynamic> get thongTin => widget.thongTinJson;
  final List<String> _keysChiPhiCoDinh = [
    "tron_ve",
    "ung_lai_xe",
    "bao_luat",
    "cty_bao_luat",
    "lai_ngan_hang",
    "vetc",
    "thay_dau",
    "xin_giay_phep",
    "do_dau",
    "ve_cao_toc",
    "ve_cau_luong",
    "ve_phat_sinh",
  ];

  Map<String, dynamic> getData() {
    // Lọc chỉ lấy các trường chi phí cố định
    final Map<String, dynamic> chiPhiCoDinh = {};

// print('thongTin get data $thongTin'); // TODO: remove debug
    for (final key in _keysChiPhiCoDinh) {
      chiPhiCoDinh[key] = thongTin['chi_phi_co_dinh'][key] ?? 0;
    }

    return {
      "chi_phi_co_dinh": thongTin['chi_phi_co_dinh'],
      "chi_phi_lai_xe": List<Map<String, dynamic>>.from(
        thongTin["chi_phi_lai_xe"] ?? [],
      ),
    };
  }

// Chiều rộng cột — bạn có thể chỉnh lại tùy ý
  final double widthVat = 60;
  final double widthSoLuong = 80;
  final double widthTongSauVat = 140;

  @override
  Widget build(BuildContext context) {
    final tongVAT = _tongVAT(); // ➜ TÍNH TỔNG VAT TẠI ĐÂY

    return Column(
      children: [
        const SizedBox(height: 12),

        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey.shade300),
            color: Colors.grey.shade50,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Cập nhật chi phí cố định &  chi phí lái xe chi",
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 16),

              // ======================= HÀNG 1 (6 INPUT) =======================
              Row(
                children: [
                  Expanded(child: _buildCostInput("TRỐN VÉ", "tron_ve")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("ỨNG TIỀN LÁI XE", "ung_lai_xe")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("CHI PHÍ LX BÁO LUẬT", "bao_luat")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("CTY BÁO LUẬT", "cty_bao_luat")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("LÃI NGÂN HÀNG", "lai_ngan_hang")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("VETC", "vetc")),
                ],
              ),

              const SizedBox(height: 12),

              // ======================= HÀNG 2 (6 INPUT) =======================
              Row(
                children: [
                  Expanded(child: _buildCostInput("THAY DẦU", "thay_dau")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("XIN GIẤY PHÉP", "xin_giay_phep")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("ĐỔ DẦU", "do_dau")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("VÉ CAO TỐC", "ve_cao_toc")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("VÉ CẦU LƯƠNG", "ve_cau_luong")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCostInput("VÉ PHÁT SINH", "ve_phat_sinh")),
                ],
              ),

              const SizedBox(height: 20),

              const Text(
                "Chi phí lái xe chi",
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),

              const SizedBox(height: 10),

              _buildChiPhiLaiXeTable(),

              const SizedBox(height: 12),

              Align(
                alignment: Alignment.centerLeft,
                child: ElevatedButton.icon(
                  onPressed: _themDongChiPhi,
                  icon: const Icon(Icons.add),
                  label: const Text("Thêm dòng"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blueGrey,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // ======================= HIỂN THỊ TỔNG VAT =======================
              Text(
                "Tổng VAT: ${NumberFormat("#,##0", "vi_VN").format(tongVAT)} đ",
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: Colors.orange,
                ),
              ),

              const SizedBox(height: 8),

              // ======================= TỔNG CHI PHÍ =======================
              Text(
                "Tổng chi phí: ${NumberFormat("#,##0", "vi_VN").format(_tongChiPhi())} đ",
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ========================= COST INPUT ============================

  Widget _buildCostInput(String label, String key) {
    final controller = TextEditingController(
      text: NumberFormat.decimalPattern("vi_VN")
          .format(double.tryParse(thongTin['chi_phi_co_dinh'][key]?.toString() ?? "0") ?? 0),
    );

    return Focus(
      onFocusChange: (hasFocus) {
        if (!hasFocus) {
          final clean = controller.text.replaceAll(RegExp(r'[^0-9]'), '');
          thongTin['chi_phi_co_dinh'][key] = double.tryParse(clean) ?? 0;
          widget.onChanged?.call();
          setState(() {});
        }
      },
      child: TextField(
        controller: controller,
        keyboardType: TextInputType.number,
        inputFormatters: [ThousandsSeparatorInputFormatter()],
        style: const TextStyle(fontSize: 16, height: 1.5),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(fontSize: 13),
          border: const OutlineInputBorder(),
          isDense: true, // ➜ giảm chiều cao
          contentPadding: const EdgeInsets.symmetric(
            vertical: 8,
            horizontal: 8,
          ),
        ),
        onEditingComplete: () {
          final clean = controller.text.replaceAll(RegExp(r'[^0-9]'), '');
          thongTin['chi_phi_co_dinh'][key] = double.tryParse(clean) ?? 0;
          widget.onChanged?.call();
          setState(() {});
          FocusScope.of(context).unfocus();
        },
      ),
    );
  }

  // ========================= TABLE ============================

  Widget _buildChiPhiLaiXeTable() {
    final List list = thongTin["chi_phi_lai_xe"] ?? [];

    return Table(
      border: TableBorder.all(color: Colors.grey.shade300),
      columnWidths: {
        0: const FlexColumnWidth(3),
        1: const FlexColumnWidth(2),

        // 👉 Cột số lượng (fixed width)
        2: FixedColumnWidth(widthSoLuong),

        3: const FlexColumnWidth(2),

        // 👉 Cột VAT (fixed width)
        4: FixedColumnWidth(widthVat),

        // 👉 Cột tổng sau VAT (fixed width)
        5: FixedColumnWidth(widthTongSauVat),
        6: FixedColumnWidth(widthVat),
        7: FixedColumnWidth(widthTongSauVat),
      },
      children: [
        _rowHeader(),
        ...list.asMap().entries.map((e) => _rowItem(e.key, e.value)),
      ],
    );
  }

  TableRow _rowHeader() {
    return TableRow(
      decoration: BoxDecoration(color: Colors.grey.shade200),
      children: [
        _cellHeader("Tên chi phí"),
        _cellHeader("Đơn giá"),

        // ➜ Cột số lượng (thu hẹp)
        SizedBox(
          width: widthSoLuong,
          child: _cellHeader("SL"),
        ),

        _cellHeader("DVT"),

        // ➜ Cột VAT (thu hẹp)
        SizedBox(
          width: widthVat,
          child: _cellHeader("VAT (%)"),
        ),

        // ➜ Cột Tổng sau VAT (rộng hơn để chữ không xuống dòng)
        SizedBox(
          width: widthTongSauVat,
          child: _cellHeader("Tổng sau VAT"),
        ),

        _cellHeader("Copy"),
        _cellHeader("Xóa"),
      ],
    );
  }

  TableRow _rowItem(int index, Map row) {
    final tenCtrl = TextEditingController(text: row["ten"] ?? "");
    final donGiaCtrl = TextEditingController(
      text: NumberFormat.decimalPattern("vi_VN").format(row["don_gia"] ?? 0),
    );
    final soLuongCtrl = TextEditingController(
      text: NumberFormat.decimalPattern("vi_VN").format(row["so_luong"] ?? 1),
    );
    final dvtCtrl = TextEditingController(text: row["dvt"] ?? "");
    final vatCtrl = TextEditingController(text: (row["vat"] ?? 0).toString());

    final tongSauVat = _tinhTongSauVAT(row);

    return TableRow(
      children: [
        // --- TÊN CHI PHÍ ---
        Padding(
          padding: const EdgeInsets.all(4),
          child: TextField(
            controller: tenCtrl,
            style: const TextStyle(fontSize: 16, height: 1.5),
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              isDense: true, // ➜ Giảm chiều cao
              contentPadding: EdgeInsets.symmetric(
                vertical: 8, // ➜ Thu gọn
                horizontal: 8,
              ),
            ),
            onEditingComplete: () {
              row["ten"] = tenCtrl.text.trim();
              _refresh();
            },
          ),
        ),

        // --- ĐƠN GIÁ ---
        Padding(
          padding: const EdgeInsets.all(4),
          child: Focus(
            onFocusChange: (hasFocus) {
              if (!hasFocus) _commitDonGiaValue(donGiaCtrl, row);
            },
            child: TextField(
              controller: donGiaCtrl,
              keyboardType: TextInputType.number,
              inputFormatters: [ThousandsSeparatorInputFormatter()],
              style: const TextStyle(fontSize: 16, height: 1.5),
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                isDense: true, // ➜ Giảm chiều cao
                contentPadding: EdgeInsets.symmetric(
                  vertical: 8, // ➜ Thu gọn
                  horizontal: 8,
                ),
              ),
              onEditingComplete: () {
                _commitDonGiaValue(donGiaCtrl, row);
                FocusScope.of(context).unfocus();
              },
            ),
          ),
        ),

        // --- SỐ LƯỢNG ---
        SizedBox(
          width: widthSoLuong,
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: Focus(
              onFocusChange: (hasFocus) {
                if (!hasFocus) _commitSoLuongValue(soLuongCtrl, row);
              },
              child: TextField(
                controller: soLuongCtrl,
                keyboardType: TextInputType.number,
                inputFormatters: [ThousandsSeparatorInputFormatter()],
                style: const TextStyle(fontSize: 16, height: 1.5),
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                ),
                onEditingComplete: () {
                  _commitSoLuongValue(soLuongCtrl, row);
                  FocusScope.of(context).unfocus();
                },
              ),
            ),
          ),
        ),

        // --- ĐVT ---
        Padding(
          padding: const EdgeInsets.all(4),
          child: TextField(
            controller: dvtCtrl,
            style: const TextStyle(fontSize: 16, height: 1.5),
            decoration: const InputDecoration(
              border: OutlineInputBorder(),
              isDense: true, // ➜ Giảm chiều cao
              contentPadding: EdgeInsets.symmetric(
                vertical: 8, // ➜ Thu gọn
                horizontal: 8,
              ),
            ),
            onEditingComplete: () {
              row["dvt"] = dvtCtrl.text.trim();
              _refresh();
              FocusScope.of(context).unfocus();
            },
          ),
        ),

        // --- VAT % ---
        SizedBox(
          width: widthVat,
          child: Padding(
            padding: const EdgeInsets.all(4),
            child: Focus(
              onFocusChange: (hasFocus) {
                if (!hasFocus) _commitVatValue(vatCtrl.text, row);
              },
              child: TextField(
                controller: vatCtrl,
                keyboardType: TextInputType.number,
                style: const TextStyle(fontSize: 16, height: 1.5),
                decoration: const InputDecoration(
                  border: OutlineInputBorder(),
                  isDense: true,
                  contentPadding: EdgeInsets.symmetric(vertical: 8, horizontal: 8),
                ),
                onEditingComplete: () {
                  _commitVatValue(vatCtrl.text, row);
                  FocusScope.of(context).unfocus();
                },
              ),
            ),
          ),
        ),

        // --- TỔNG SAU VAT (highlight) ---
        SizedBox(
          width: widthTongSauVat,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
            child: Text(
              NumberFormat("#,##0", "vi_VN").format(tongSauVat),
              textAlign: TextAlign.right,   // ➜ Căn phải
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: tongSauVat > 0 ? Colors.green : Colors.red,
              ),
            ),
          ),
        ),

        // --- COPY DÒNG ---
        IconButton(
          onPressed: () => _copyRow(index, row),
          icon: const Icon(Icons.copy, color: Colors.blue, size: 16,),
        ),

        // --- XÓA ---
        IconButton(
          onPressed: () {
            (thongTin["chi_phi_lai_xe"] as List).removeAt(index);
            _refresh();
          },
          icon: const Icon(Icons.delete, color: Colors.red, size:  16,),
        ),
      ],
    );
  }

  void _commitDonGiaValue(TextEditingController ctrl, Map row) {
    final clean = ctrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    row["don_gia"] = double.tryParse(clean) ?? 0;

    // format lại
    ctrl.text = NumberFormat.decimalPattern("vi_VN").format(row["don_gia"]);

    _refresh();
  }

  void _commitSoLuongValue(TextEditingController ctrl, Map row) {
    final clean = ctrl.text.replaceAll(RegExp(r'[^0-9]'), '');
    row["so_luong"] = double.tryParse(clean) ?? 1;

    ctrl.text = NumberFormat.decimalPattern("vi_VN").format(row["so_luong"]);

    _refresh();
  }
  void _copyRow(int index, Map row) {
    thongTin["chi_phi_lai_xe"].insert(index + 1, {
      "ten": row["ten"],
      "don_gia": row["don_gia"],
      "so_luong": row["so_luong"],
      "dvt": row["dvt"],
      "vat": row["vat"],
    });

    _refresh();
  }
  double _tinhTongSauVAT(Map row) {
    final donGia = row["don_gia"] ?? 0;
    final soLuong = row["so_luong"] ?? 1;
    final vat = row["vat"] ?? 0;

    return donGia * soLuong * (1 + vat / 100);
  }

  void _commitVatValue(String raw, Map row) {
    row["vat"] = double.tryParse(raw) ?? 0;
    _refresh();
  }
  void _refresh() {
    widget.onChanged?.call();
    setState(() {});
  }
  double _tongVAT() {
    double total = 0;
    for (final row in thongTin["chi_phi_lai_xe"] ?? []) {
      final goc = (row["don_gia"] ?? 0) * (row["so_luong"] ?? 1);
      final vat = row["vat"] ?? 0;
      total += goc * vat / 100;
    }
    return total;
  }

  // ========================= UTILS ============================

  void _themDongChiPhi() {
    thongTin["chi_phi_lai_xe"] ??= [];

    thongTin["chi_phi_lai_xe"].add({
      "ten": "Chi phí ${thongTin["chi_phi_lai_xe"].length + 1}",
      "don_gia": 0,
      "so_luong": 1,
      "dvt": "",
    });

    widget.onChanged?.call();
    setState(() {});
  }

  double _tongChiPhi() {
    final list = thongTin["chi_phi_lai_xe"] ?? [];
    double total = 0;

    for (final row in list) {
      total += (row["don_gia"] ?? 0) * (row["so_luong"] ?? 1);
    }
    return total;
  }
}

// ========================= STATIC CELLS ============================

class _cellHeader extends StatelessWidget {
  final String text;
  const _cellHeader(this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: Text(text,
          style: const TextStyle(fontWeight: FontWeight.bold),
          textAlign: TextAlign.center),
    );
  }
}

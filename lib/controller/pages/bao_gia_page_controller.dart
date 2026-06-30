import 'package:kho555/controller/my_controller.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../helper/storage/local_storage.dart';
import '../../services/bao_gia_service.dart';

class BaoGiaPageController extends MyController {
  bool isSaving = false;

  String? selectedKhachHang;
  String? selectedLoaiBaoGia;
  String? selectedTienTe;
  String? selectedLoaiDichVu;
  String? moTaHangHoa;

  // Danh sách dòng bảng cước biển
  List<CuocBienRow> cuocBienRows = [CuocBienRow()];

  void onSelectKhachHang(String? val) {
    selectedKhachHang = val;
    update();
  }

  void onSelectLoaiBaoGia(String? val) {
    selectedLoaiBaoGia = val;
    update();
  }

  void onSelectTienTe(String? val) {
    selectedTienTe = val;
    update();
  }

  void onSelectLoaiDichVu(String? val) {
    selectedLoaiDichVu = val;
    update();
  }

  void onChangeMoTa(String val) {
    moTaHangHoa = val;
    update();
  }

  // Thêm dòng mới
  void addCuocBienRow() {
    cuocBienRows.add(CuocBienRow());
    update();
  }

  // Xoá dòng theo index
  void removeCuocBienRow(int index) {
    if (cuocBienRows.length > 1) {
      cuocBienRows.removeAt(index);
      update();
    }
  }
// SEA EXPORT
  List<LoaiXeRow> seaExportRows = [LoaiXeRow()];

  void addSeaExportRow() {
    seaExportRows.add(LoaiXeRow());
    update();
  }

  void removeSeaExportRow(int index) {
    if (seaExportRows.length > 1) {
      seaExportRows.removeAt(index);
      update();
    }
  }

// AIR EXPORT
  List<LoaiXeRow> airExportRows = [LoaiXeRow()];

  void addAirExportRow() {
    airExportRows.add(LoaiXeRow());
    update();
  }

  void removeAirExportRow(int index) {
    if (airExportRows.length > 1) {
      airExportRows.removeAt(index);
      update();
    }
  }

  // Gom dữ liệu thành JSON
  Future<Map<String, dynamic>> toJson() async {
    final seaLoaiXe = [
      "1.25 Tấn","2.5 Tấn","3.5 Tấn","5.0 Tấn","8.0 Tấn","10.0 Tấn","12.0 Tấn","Xe 3 chân","Xe 4 chân","Cont 20","Cont 40"
    ];
    final airLoaiXe = [
      "1.25 Tấn","2.5 Tấn","3.5 Tấn","5.0 Tấn","8.0 Tấn","10.0 Tấn","12.0 Tấn","Xe 3 chân","Xe 4 chân"
    ];

    return {
      "thong_tin_chung": {
        "khach_hang": selectedKhachHang,
        "loai_bao_gia": selectedLoaiBaoGia,
        "tien_te": selectedTienTe,
        "loai_dich_vu": selectedLoaiDichVu,
        "mo_ta": moTaHangHoa,
      },
      "cuoc_bien": cuocBienRows.map((e) => e.toJson()).toList(),
      "sea_export": seaExportRows.map((e) => e.toJson(loaiXe: seaLoaiXe)).toList(),
      "air_export": airExportRows.map((e) => e.toJson(loaiXe: airLoaiXe)).toList(),

      // ✅ thông tin người đăng nhập
      "user": {
        "email": await LocalStorage.getUserEmail() ?? "",
        "token": await LocalStorage.getUserToken() ?? "",
      }
    };
  }

  Future<void> saveBaoGia() async {
    isSaving = true;
    update(); // cập nhật UI để hiện spinner

    try {
      final data = await toJson(); // 👈 toJson giờ là async
      bool ok = await BaoGiaService.saveBaoGia(data);
      if (ok) {
        Get.snackbar("Thành công", "Đã lưu báo giá thành công",
            snackPosition: SnackPosition.BOTTOM,
            backgroundColor: Colors.green,
            colorText: Colors.white);
      }
    } catch (e) {
      Get.snackbar("Lỗi", e.toString(),
          snackPosition: SnackPosition.BOTTOM,
          backgroundColor: Colors.red,
          colorText: Colors.white);
    } finally {
      isSaving = false;
      update(); // ẩn spinner
    }
  }
}

// Model cho 1 dòng cước biển
class CuocBienRow {
  String? danhMuc;
  String? ft20;
  String? ft40;
  String? ghiChu;

  CuocBienRow({this.danhMuc, this.ft20, this.ft40, this.ghiChu});

  Map<String, dynamic> toJson() => {
    "danh_muc": danhMuc,
    "20ft": ft20,
    "40ft": ft40,
    "ghi_chu": ghiChu,
  };
}
// Model cho 1 dòng loại xe
class LoaiXeRow {
  String? danhMucPhi;
  Map<String, String> giaTheoLoaiXe = {};

  LoaiXeRow({this.danhMucPhi});

  Map<String, dynamic> toJson({List<String>? loaiXe}) {
    final result = <String, dynamic>{};

    // Nếu có danh sách loại xe truyền vào → ensure đầy đủ key
    if (loaiXe != null) {
      for (var lx in loaiXe) {
        result[lx] = giaTheoLoaiXe[lx] ?? "0"; // 👈 mặc định 0
      }
    } else {
      // fallback nếu không có danh sách truyền vào
      giaTheoLoaiXe.forEach((key, value) {
        result[key] = value.isEmpty ? "0" : value;
      });
    }

    return {
      "danh_muc_phi": danhMucPhi,
      "gia_theo_loai_xe": result,
    };
  }

}

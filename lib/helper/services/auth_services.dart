import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:ttk_logistics/helper/storage/local_storage.dart';

class AuthService {
  static bool isLoggedIn = false;
  static const String workerUrl = "https://callapifromurlwithparams.hungddvimaru.workers.dev";
  static const String workerUrlGetFile = "https://get-file.hungddvimaru.workers.dev";

  /// URL API login (Drupal 7)
  static const String baseUrl = "https://ttk.andinjsc.com"; // đổi domain
  static const String loginEndpoint = "$baseUrl/api/auth/user/login";
  static const String getListVatTu = '$baseUrl/api/get-list-vat-tu';
  static const String saveVatTu = '$baseUrl/api/save-vat-tu';
  static const String deleteVatTu = '$baseUrl/api/delete-vat-tu';
  static const String nhapVatTu = '$baseUrl/api/nhap-vat-tu';

  static const String getListBenThuBa = '$baseUrl/api/get-list-ben-thu-ba';
  static const String saveBenThuBa = '$baseUrl/api/save-ben-thu-ba';
  static const String deleteBenThuBa = '$baseUrl/api/delete-ben-thu-ba';

  static const String getListDanhMucKho = '$baseUrl/api/get-list-danh-muc-kho';
  static const String saveDanhMucKho = '$baseUrl/api/save-danh-muc-kho';
  static const String deleteDanhMucKho = '$baseUrl/api/delete-danh-muc-kho';
  static const String getListKhoUser = '$baseUrl/api/get-list-kho-user';

  static const String getListPhieuNhapVatTu = '$baseUrl/api/get-list-phieu-nhap-vat-tu';
  static const String savePhieuNhapVatTu = '$baseUrl/api/save-phieu-nhap-vat-tu';
  static const String deletePhieuNhapVatTu = '$baseUrl/api/delete-phieu-nhap-vat-tu';
  static const String updateTrangThaiPhieuNhapVatTu = '$baseUrl/api/update-trang-thai-phieu-nhap-vat-tu';

  static const String getListNhaCungCapPhieu = '$baseUrl/api/get-list-nha-cung-cap-phieu';
  static const String getListKhoPhieu = '$baseUrl/api/get-list-kho-phieu';
  static const String getListVatTuPhieu = '$baseUrl/api/get-list-vat-tu-phieu';
  static const String getListUserPhieu = '$baseUrl/api/get-list-user-phieu';

  static const String getBaoCaoTonKhoVatTu = '$baseUrl/api/get-bao-cao-ton-kho-vat-tu';
  static const String getBaoCaoTonKhoVatTuTheoThang = '$baseUrl/api/get-bao-cao-ton-kho-thang-vat-tu';
  static const String getListKhoStockLedger = '$baseUrl/api/get-list-kho-stock-ledger';


  static const String getCuocVanChuyen = "$baseUrl/api/config-block/get-cuoc-van-chuyen";
  static const String saveCuocVanChuyen = "$baseUrl/api/config-block/update-cuoc-van-chuyen";
  static const String getCuocVanChuyenThueNgoai = "$baseUrl/api/config-block/get-cuoc-van-chuyen-thue-ngoai";
  static const String updateCuocVanChuyenThueNgoai = "$baseUrl/api/config-block/update-cuoc-van-chuyen-thue-ngoai";
  static const String getChiPhiHaiQuanTongHop = "$baseUrl/api/config-block/get-chi-phi-hai-quan-tong-hop";
  static const String saveChiPhiHaiQuanTongHop = "$baseUrl/api/config-block/save-chi-phi-hai-quan-tong-hop";
  static const String getCauHinhBaoHiem = "$baseUrl/api/config-block/cau-hinh-bao-hiem";
  static const String updateCauHinhBaoHiem = "$baseUrl/api/config-block/update-cau-hinh-bao-hiem";
  static const String getCauHinhCungTinhKhacTuyen = "$baseUrl/api/config-block/get-cung-tinh-khac-tuyen";
  static const String updateCauHinhCungTinhKhacTuyen = "$baseUrl/api/config-block/update-cung-tinh-khac-tuyen";
  static const String getCauHinhCungTuyen = "$baseUrl/api/config-block/get-cung-tuyen";
  static const String updateCauHinhCungTuyen = "$baseUrl/api/config-block/update-cung-tuyen";
  static const String getCauHinhPhiLuuCa = "$baseUrl/api/config-block/get-phi-luu-ca";
  static const String updateCauHinhPhiLuuCa = "$baseUrl/api/config-block/update-phi-luu-ca";
  static const String getCauHinhGioLuuCa = "$baseUrl/api/config-block/get-gio-luu-ca";
  static const String updateCauHinhGioLuuCa = "$baseUrl/api/config-block/update-gio-luu-ca";
  static const String updateCauHinhQuaKhoQuaTai = "$baseUrl/api/config-block/update-cau-hinh-qua-kho-qua-tai";
  static const String getCauHinhQuaKhoQuaTai = "$baseUrl/api/config-block/get-qua-kho-qua-tai";
  static const String getThuongDiemThuongChuyen = "$baseUrl/api/config-block/get-thuong-diem-thuong-chuyen";
  static const String updateThuongDiemThuongChuyen = "$baseUrl/api/config-block/update-cau-hinh-thuong-diem-thuong-chuyen";
  static const String saveNhaXe = "$baseUrl/api/nha-xe/save-nha-xe"; /*sửa và thêm mới*/
  static const String saveCuocVanChuyenNhaXe = "$baseUrl/api/nha-xe/luu-cuoc-van-chuyen-nha-xe"; /*sửa và thêm mới*/
  static const String getCuocVanChuyenNhaXe = "$baseUrl/api/nha-xe/get-cuoc-van-chuyen-nha-xe";
  static const String getCuocVanChuyenKhachHang = "$baseUrl/api/khach-hang/get-cuoc-van-chuyen-khach-hang";
  static const String saveCuocVanChuyenKhachHang = "$baseUrl/api/khach-hang/save-cuoc-van-chuyen-khach-hang";
  static const String getChiPhiHaiQuanKhachHang = "$baseUrl/api/khach-hang/get-phi-hai-quan-khach-hang";
  static const String saveChiPhiHaiQuanKhachHang = "$baseUrl/api/khach-hang/save-phi-hai-quan-khach-hang";
  static const String getCauHinhBaoHiemKhachHang = "$baseUrl/api/khach-hang/get-cau-hinh-bao-hiem-khach-hang";
  static const String updateCauHinhBaoHiemKhachHang = "$baseUrl/api/khach-hang/save-cau-hinh-bao-hiem-khach-hang";
  static const String getCauHinhPhiLuuCaKhachHang = "$baseUrl/api/khach-hang/get-cau-hinh-phi-luu-ca-khach-hang";
  static const String updateCauHinhPhiLuuCaKhachHang = "$baseUrl/api/khach-hang/save-cau-hinh-phi-luu-ca-khach-hang";
  static const String getCauHinhCungTinhKhacTuyenKhachHang = "$baseUrl/api/khach-hang/get-cau-hinh-phi-cung-tinh-khac-tuyen-khach-hang";
  static const String updateCauHinhCungTinhKhacTuyenKhachHang = "$baseUrl/api/khach-hang/save-cau-hinh-phi-cung-tinh-khac-tuyen-khach-hang";
  static const String getCauHinhQuaKhoQuaTaiKhachHang = "$baseUrl/api/khach-hang/get-cau-hinh-phi-qua-kho-qua-tai-khach-hang";
  static const String updateCauHinhQuaKhoQuaTaiKhachHang = "$baseUrl/api/khach-hang/save-cau-hinh-phi-qua-kho-qua-tai-khach-hang";
  static const String getCauHinhCungTuyenKhacTinhKhachHang = "$baseUrl/api/khach-hang/get-cau-hinh-phi-cung-tuyen-khac-tinh-khach-hang";
  static const String updateCauHinhCungTuyenKhacTinhKhachHang = "$baseUrl/api/khach-hang/save-cau-hinh-phi-cung-tuyen-khac-tinh-khach-hang";
  static const String getKhachHangDetail = "$baseUrl/api/khach-hang/get-khach-hang-detail";

  static const String getCauHinhQuaKhoQuaTaiNhaXe = "$baseUrl/api/nha-xe/get-cau-hinh-phi-qua-kho-qua-tai-nha-xe";
  static const String updateCauHinhQuaKhoQuaTaiNhaXe = "$baseUrl/api/nha-xe/save-cau-hinh-phi-qua-kho-qua-tai-nha-xe";
  static const String getChiPhiHaiQuanNhaXe = "$baseUrl/api/nha-xe/get-phi-hai-quan-nha-xe";
  static const String saveChiPhiHaiQuanNhaXe = "$baseUrl/api/nha-xe/save-phi-hai-quan-nha-xe";
  static const String getCauHinhBaoHiemNhaXe = "$baseUrl/api/nha-xe/get-cau-hinh-bao-hiem-nha-xe";
  static const String updateCauHinhBaoHiemNhaXe = "$baseUrl/api/nha-xe/save-cau-hinh-bao-hiem-nha-xe";
  static const String getCauHinhPhiLuuCaNhaXe = "$baseUrl/api/nha-xe/get-cau-hinh-phi-luu-ca-nha-xe";
  static const String updateCauHinhPhiLuuCaNhaXe = "$baseUrl/api/nha-xe/save-cau-hinh-phi-luu-ca-nha-xe";
  static const String getCauHinhCungTinhKhacTuyenNhaXe = "$baseUrl/api/nha-xe/get-cau-hinh-phi-cung-tinh-khac-tuyen-nha-xe";
  static const String updateCauHinhCungTinhKhacTuyenNhaXe = "$baseUrl/api/nha-xe/save-cau-hinh-phi-cung-tinh-khac-tuyen-nha-xe";
  static const String getCauHinhCungTuyenKhacTinhNhaXe = "$baseUrl/api/nha-xe/get-cau-hinh-phi-cung-tuyen-khac-tinh-nha-xe";
  static const String updateCauHinhCungTuyenKhacTinhNhaXe = "$baseUrl/api/nha-xe/save-cau-hinh-phi-cung-tuyen-khac-tinh-nha-xe";

  static const String getListPhuongTien = "$baseUrl/api/phuong-tien/get-all-phuong-tien";
  static const String saveDonHang = "$baseUrl/api/don-hang/save-don-hang";

  static const String getChuyenXeList = "$baseUrl/api/chuyen-xe/get-chuyen-xe-list";
  static const String updateTrangThaiChuyenXe = "$baseUrl/api/chuyen-xe/update-trang-thai-chuyen-xe";
  static const String getChuyenXeDetail = "$baseUrl/api/chuyen-xe/detail";
  static const String updateChuyenXe = "$baseUrl/api/chuyen-xe/update";
  static const String getChuyenXeKhachHang = "$baseUrl/api/chuyen-xe/get-chuyen-xe-list-by-khach-hang";
  static const String exportChuyenXeExcel = "$baseUrl/api/chuyen-xe/export-excel";
  static const String getHopDongCaNhan = "$baseUrl/api/chuyen-xe/get-hop_dong_ca_nhan";
  static const String saveHopDongCaNhan = "$baseUrl/api/chuyen-xe/luu-hop-dong-ca-nhan";
  static const String inHopDongCaNhan = "$baseUrl/api/chuyen-xe/in-hop-dong-ca-nhan";
  static const String getLenhDieuDong = "$baseUrl/api/chuyen-xe/get-lenh-dieu-dong";
  static const String saveLenhDieuDong = "$baseUrl/api/chuyen-xe/luu-lenh-dieu-dong";
  static const String inLenhDieuDong = "$baseUrl/api/chuyen-xe/in-lenh-dieu-dong";
  static const String saveChiPhiCoDinh = "$baseUrl/api/chuyen-xe/luu-chi-phi-co-dinh";

  static const String updateCauHinh = "$baseUrl/api/cau-hinh/update-cau-hinh";
  static const String loadCauHinh = "$baseUrl/api/cau-hinh/load-cau-hinh";

  static const String getLuongLaiXeList = "$baseUrl/api/luong_lai_xe/list";
  static const String getDoanhThuPhuongTienList = "$baseUrl/api/chuyen-xe/doanh-thu-xe";
  static const String updateChiPhiLuongLaiXe = "$baseUrl/api/chuyen-xe/update-luong-lai-xe";
  static const String updateDoanhThuXe = "$baseUrl/api/chuyen-xe/update-doanh-thu-chuyen-xe";
  static const String getCongNoKhachHangByChuyenXe = "$baseUrl/api/chuyen-xe/cong-no-khach-hang";
  static const String getCongNoNCC = "$baseUrl/api/chuyen-xe/cong-no-nha-cung-cap";
  static const String getChuyenXeChuaThanhToanHet = "$baseUrl/api/chuyen-xe/chuyen-xe-khach-chua-thanh-toan-het";
  static const String getChuyenXeChuaThanhToanNCC = "$baseUrl/api/chuyen-xe/chuyen-xe-khach-chua-thanh-toan-ncc";

  static const String getUserList = "$baseUrl/api/nguoi-dung/get-list-user";

  static const String luuPhieuThuCongNoKhachHang = "$baseUrl/api/thu-chi/luu-cong-no-khach-hang";
  static const String luuPhieuThuCongNoNhaCC = "$baseUrl/api/thu-chi/luu-cong-no-ncc";
  static const String getLichSuThanhToanTheoChuyenXe = "$baseUrl/api/thu-chi/get-lich-su-thanh-toan-chuyen-xe";
  static const String updateHanCongNo = "$baseUrl/api/cong-no/update-han-cong-no";

  // static const String getListXeNha = "$baseUrl/api/khach-hang/save-cau-hinh-phi-cung-tuyen-khac-tinh-khach-hang";
  // static const String getListXeNgoai = "$baseUrl/api/khach-hang/save-cau-hinh-phi-cung-tuyen-khac-tinh-khach-hang";
  // static const String getListNhaXeNgoai = "$baseUrl/api/khach-hang/save-cau-hinh-phi-cung-tuyen-khac-tinh-khach-hang";


  static const String danhMucEndpoint = "$baseUrl/api/danh-muc";
  static const String phuongTienEndpoint = "$baseUrl/api/phuong-tien";
  static const String laiXeEndpoint = "$baseUrl/api/lai-xe";
  static const String phuongTienLaiXeEndpoint = "$baseUrl/api/phuong-tien-lai-xe";
  static const String hopDongEndpoint = "$baseUrl/api/hop-dong";
  static const String benThuBaEndpoint = "$baseUrl/api/ben-thu-ba";
  static const String getListLoaiXe = "$baseUrl/api/loai-xe/get-list-loai-xe";
  static const String updateListLoaiXe = "$baseUrl/api/loai-xe/update";
  static const String saveBaoGia = "$baseUrl/api/bao-gia/save";
  static const String getCauHinhPhiHaiQuan = "$baseUrl/api/config-block/get-phi-hai-quan";
  static const String updateCauHinhPhiHaiQuan = "$baseUrl/api/config-block/update-cau-hinh-phi-hai-quan";

  static const String getListKhachHang = "$baseUrl/api/khach-hang/get-all-khach-hang";
  static const String getInfoThongTinNhaXe = "$baseUrl/api/nha-xe/get-info-nha-xe";
  static const String saveKhachHang = "$baseUrl/api/quan-ly/save-khach-hang"; /*sửa và thêm mới*/
  static const String deleteKhachHang = "$baseUrl/api/quan-ly/delete-khach-hang";
  static const String saveChiPhiKhachHang = "$baseUrl/api/khach-hang/update-chi-phi"; // Sử dụng chung với lưu chi phí nhà xe

  static const String getListNhaXe = "$baseUrl/api/nha-xe/get-all-nha-xe";
  static const String deleteNhaXe = "$baseUrl/api/nha-xe/delete-nha-xe";
  static const String getHopDongNhaXe = "$baseUrl/api/nha-xe/get-hop-dong-nha-xe";
  static const String saveHopDongNhaXe = "$baseUrl/api/nha-xe/luu-hop-dong-nha-xe";
  static const String printHopDongNhaXe = "$baseUrl/api/nha-xe/in-hop-dong-nha-xe";

  static const String getListLaiXe = "$baseUrl/api/lai-xe/get-all-lai-xe";
  static const String saveLaiXe = "$baseUrl/api/lai-xe/save-lai-xe"; /*sửa và thêm mới*/
  static const String deleteLaiXe = "$baseUrl/api/lai-xe/delete-lai-xe";

  static const String savePhuongTien = "$baseUrl/api/phuong-tien/save-phuong-tien"; /*sửa và thêm mới*/
  static const String deletePhuongTien = "$baseUrl/api/phuong-tien/xoa-phuong-tien";
  static const String initPhuongTienForm = "$baseUrl/api/phuong-tien/init-form-phuong-tien";
  static const String fetchPhuongTien = "$baseUrl/api/phuong-tien/get-phuong-tien-theo-nha-xe-va-loai-xe";

  static const String getListDonHang = "$baseUrl/api/phuong-tien/get-all-don-hang";
  static const String deleteDonHang = "$baseUrl/api/phuong-tien/get-all-don-hang";
  static const String initDonHangForm = "$baseUrl/api/don-hang/khoi-tao-form";
  static const String fetchChiPhiKhac = "$baseUrl/api/van-chuyen/get-bang-gia";

  static Future<Map<String, String>?> loginUser(Map<String, dynamic> data) async {
    // try {
    //
    // } catch (e) {
    //   return {"general": "Lỗi kết nối: $e"};
    // }

    final response = await http.post(
      Uri.parse(workerUrl),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({
        "url": loginEndpoint, // API gốc
        "params": {
          "username": data['username'],   // hoặc đổi sang 'username' nếu API yêu cầu
          "password": data['password'],
        }
      }),
    );

    if (response.statusCode == 200) {
      final res = jsonDecode(response.body);

      if (res['status'] == 'success') {
        // Đánh dấu đăng nhập thành công
        isLoggedIn = true;
// print('res login $res'); // TODO: remove debug
        await LocalStorage.setLoggedInUser(true);
        await LocalStorage.setUserToken(res['token']); // lưu token
        await LocalStorage.setUserEmail(res['email'] ?? '');
        await LocalStorage.setUserID(res['uid'] ?? "0");

        return null; // null = không có lỗi
      } else {
        return {"general": res['message'] ?? "Đăng nhập thất bại"};
      }
    } else {
      return {"general": "Lỗi server: ${response.statusCode}"};
    }
  }

}

# Module Quản lý tài chính

## Chức năng chính

- `/quan-ly-tai-chinh`: Trang tổng quan nhanh.
- `/quan-ly-quy`: Quản lý quỹ tiền mặt/ngân hàng/ví nội bộ.
  - Thêm, sửa, xóa quỹ.
  - Theo dõi số dư đầu kỳ, thu, chi, chuyển đến, chuyển đi, số dư cuối kỳ.
  - Chuyển tiền nội bộ giữa các quỹ.
- `/thu-chi`: Quản lý giao dịch thu chi.
  - Thu công nợ khách hàng.
  - Chi phí cố định.
  - Chi phí lương.
  - Tạm ứng lái xe.
  - Khấu trừ tạm ứng lương.
  - Chi nhà cung cấp/xe ngoài.
  - Cược vỏ hàng nhập.

## Lưu trữ dữ liệu quỹ

Quỹ được lưu bằng content type `quy_tai_chinh`, không lưu trực tiếp ở bảng `qltc_quy` nữa.

- `title`: mã quỹ, đóng vai trò khóa chính nghiệp vụ và không được trùng.
- `field_thong_tin_json`: lưu thông tin text như `ten_quy`, `loai_quy`, `ghi_chu`.
- `field_so_du_dau_ky`: số dư đầu kỳ.
- `field_so_du_hien_tai`: số dư hiện tại.
- `field_hoat_dong`: 1 là đang tồn tại, 0 là đã xóa mềm.
- `status`: luôn lưu bằng 0 theo yêu cầu nghiệp vụ.

Bảng `qltc_giao_dich` vẫn dùng `nid_quy` và `nid_quy_nhan`, nhưng giá trị là `nid` của node quỹ.

## Bài toán tạm ứng lái xe

Khi tạo giao dịch `Tạm ứng lái xe`, số tiền được cộng vào công nợ/ví tạm ứng của lái xe.

Khi tính lương, module `bao_cao_luong_lai_xe` gọi sang module này để lấy:

```json
{
  "so_du_dau_ky": 3000000,
  "phat_sinh_ung_trong_ky": 0,
  "khau_tru_trong_ky": 2000000,
  "so_du_cuoi_ky": 1000000,
  "tong_luong": 8500000,
  "thuc_linh": 6500000
}
```

Khoản `Khấu trừ tạm ứng lương` không làm thay đổi tiền trong quỹ, vì đây là nghiệp vụ bù trừ công nợ khi tính lương. Khi thực trả lương bằng tiền mặt/ngân hàng, tạo giao dịch `Chi` nhóm `Chi phí lương` theo số thực lĩnh.

## Cài đặt

Copy thư mục `quan_ly_tai_chinh` vào `sites/all/modules/custom/`, bật module và clear cache.

```bash
drush cc all
```

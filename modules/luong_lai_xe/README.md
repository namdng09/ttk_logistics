# Module Lương lái xe

Module `luong_lai_xe` là bản convert theo format mới của dự án: custom module, route UI riêng, API JSON và giao diện hybrid `.tpl.php` + JS.

## Route

- UI: `/luong-lai-xe`
- API list: `GET /api/luong-lai-xe`
- API chi tiết lái xe: `GET /api/luong-lai-xe/{nid_lai_xe}`
- Lịch sử tạm ứng: `GET /api/luong-lai-xe/{nid_lai_xe}/tam-ung?ky_luong=YYYYMM`
- Tạo tạm ứng: `POST /api/luong-lai-xe/{nid_lai_xe}/tam-ung`
- Thanh toán lương: `POST /api/luong-lai-xe/{nid_lai_xe}/thanh-toan`
- In phiếu: `/luong-lai-xe/pdf/{nid_lai_xe}`

## Nguồn dữ liệu

- Kế hoạch: bảng `ke_hoach_xep_xe`
- Định mức khoán: `ke_hoach_xep_xe.thong_tin_json.dinh_muc_khoan_lai_xe`
- Chi phí kế hoạch: bảng `ke_hoach_chi_phi`
- Đề nghị chi phí đã chi: bảng `giao_dich_ops_de_nghi_ung`

## Công thức hiện tại

- Hình thức `khoan`: `lương tạm tính = tổng khoán - chi phí lái xe tự chịu`
- Hình thức `chuyen`: `lương tạm tính = lương theo chuyến` (chi phí dầu/phát sinh do công ty chịu, không điền vào chi phí lái xe tự chịu)
- Quy kết kỳ lương: 1 kỳ = 1 tháng, tính theo **ngày kết thúc** của kế hoạch (`ngay_ket_thuc`). Chuyến kết thúc 01/08 dù khởi hành 31/07 vẫn tính vào tháng 8.
- `ngay_ket_thuc` được tự ghi khi kế hoạch chuyển sang trạng thái `Hoàn thành` (PUT `/api/quan-ly-cont/{id}`): mặc định là ngày hoàn thành hiện tại, có thể truyền `ngay_ket_thuc` trong body để backdate. Khi revert về `Chưa xếp xe`, field này bị xoá.
- Chi phí `cong_ty_chi_tra` và chi hộ khách hàng không aggregate vào bảng lương vì không phải thu nhập của lái xe.
- `hoan_chi_phi_da_thanh_toan` là khoản công ty đã hoàn/chi trả cho lái xe qua đề nghị chi phí đã thanh toán; khoản này hiển thị để đối chiếu dòng tiền, không tự cộng vào công thức lương.
- Đề nghị chi phí chỉ được tính vào `hoan_chi_phi_da_thanh_toan` khi có `thong_tin_json.nguon = "ke_hoach_chi_phi"` và `thong_tin_json.nid_chi_phi`.
- Khi đề nghị gắn với chi phí kế hoạch được tạo/duyệt/thanh toán, module đồng bộ ngược `trang_thai_duyet`, `nid_de_nghi_chi_phi`, `nid_ledger` vào bảng `ke_hoach_chi_phi`.
- Tạm ứng lương tạo giao dịch `tam_ung_luong` trong `giao_dich_ops_ledger`, hướng `debit`/Chi.
- Thanh toán lương tạo giao dịch `thanh_toan_luong` trong `giao_dich_ops_ledger`, hướng `debit`/Chi, số tiền bằng `lương chốt - khấu trừ tạm ứng`.

## Ghi chú nghiệp vụ

Module chỉ dùng một bảng snapshot `luong_lai_xe`. Mỗi lái xe có một bảng lương theo `ky_luong` dạng `YYYYMM`; chi tiết các kế hoạch/chuyến được lưu trong `thong_tin_json` khi chốt kỳ lương.

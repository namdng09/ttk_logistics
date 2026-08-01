OPS API 7.x-1.5 - Fix slot cont/seal cho dữ liệu đơn hàng cũ

- Slot luôn tính theo so_cont_json; so_seal_json không chiếm thêm slot.
- Tự tạo loai_xe[].conts từ loai_xe[].so_luong hoặc tong_so_cont nếu JSON cũ chưa có mảng conts.
- Với booking CBR00802848N: tong_so_cont=1, so_cont_da_chon=0 sẽ tạo đúng 1 slot trống.
- Cho phép Flutter tiếp tục phân bổ khi AI đã đọc được cont/seal nhưng trả success=false do bước tự cập nhật của API AI cũ.
- Nhận và tái sử dụng cont_nids_json/seal_nids_json do AI đã tạo, tránh tạo node cont_seal trùng.
- Nhận loai_cont_json và iso_type_code_json từ AI.
- 1 cont + nhiều seal vẫn chỉ dùng 1 slot; seal dư gắn vào cont cuối.

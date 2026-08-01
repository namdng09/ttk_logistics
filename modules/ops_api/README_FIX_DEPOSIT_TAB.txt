FIX TAB CƯỢC VỎ - 7.x-2.0
================================

- Danh sách cược vỏ lấy đơn hàng có field_noi_dung_json.loai_xnk = SEA NHẬP/AIR NHẬP.
- Không lọc field_chua_chon_het vì booking đã chọn đủ cont có giá trị 0.
- Không phụ thuộc so_cont_da_chon để liệt kê; duyệt trực tiếp loai_xe[].conts[].so_cont.
- Trả cont chưa cược ở cả content.containers và bookings[].containers.
- Bổ sung content.diagnostic để kiểm tra số đơn hàng/cont qua từng bước lọc.
- Flutter được sửa để đọc cả mảng containers cấp ngoài và containers lồng trong booking.

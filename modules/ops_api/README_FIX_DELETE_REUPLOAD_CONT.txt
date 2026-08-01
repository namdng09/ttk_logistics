OPS API 7.x-1.6 - Fix xóa rồi upload lại cùng số cont

1. Sửa kiểm tra trùng:
- Hàm ops_api_find_containers_in_pending_orders() thực sự loại trừ nid đơn hàng hiện tại.
- Cont do API AI cũ vừa ghi vào đúng booking hiện tại được xử lý idempotent, không báo trùng với chính nó.
- Chỉ báo trùng khi số cont nằm trong một đơn hàng KHÁC có field_chua_chon_het = 1.

2. Bảo đảm lỗi thì không lưu:
- Khi AI trả success=false nhưng đã tạo cont_nids_json/seal_nids_json và OPS API thất bại,
  module hoàn tác đúng slot có cont_nid do AI vừa tạo và vô hiệu hóa các node cont_seal liên quan.
- Response lỗi có content.ai_prewrite_rollback để kiểm tra kết quả hoàn tác.

3. Xóa cont sạch hơn:
- Unset toàn bộ dữ liệu lựa chọn vỏ, kể cả iso_type_code, seal_nids và danh_sach_seal.
- Không gán mảng thành chuỗi rỗng.

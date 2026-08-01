# Ghi nhớ nghiệp vụ Ví OPS / Ứng và hoàn ứng

## Mục tiêu

Ví OPS là sổ công nợ nội bộ theo từng nhân viên OPS/vận hành, dùng để theo dõi tiền công ty ứng, tiền OPS đã chi, tiền hoàn ứng, tiền chi vượt cần công ty hoàn thêm và các điều chỉnh liên quan.

## Khái niệm chính

- `Ứng tiền`: công ty cấp tiền cho OPS xử lý nghiệp vụ chuyến xe/đơn hàng.
- `Hoàn ứng`: OPS kê khai chi phí thực tế và chứng từ để quyết toán khoản đã ứng.
- `Chi phí được duyệt`: chỉ khi kế toán/công ty duyệt thì mới ghi nhận chính thức vào sổ.
- `Số dư ví OPS`: số tiền OPS còn đang giữ hoặc chưa quyết toán xong.
- `Chi phí thực tế`: khoản OPS khai đã chi cho công việc; không đồng nghĩa tự động trừ số dư nếu chưa duyệt.

## Luồng nghiệp vụ tham khảo

```text
Đề nghị ứng
  -> Duyệt đề nghị
  -> Kế toán chi tiền
  -> Ghi tăng ví OPS
  -> OPS phát sinh chi phí
  -> Lập phiếu hoàn ứng
  -> Kế toán duyệt chứng từ
  -> Xử lý tiền thừa hoặc tiền thiếu
  -> Hoàn tất quyết toán
```

## Các biến động ví OPS

- Công ty ứng tiền cho OPS: `credit`.
- Bổ sung tiền ứng: `credit`.
- Ghi nhận chi phí hoàn ứng đã duyệt: `debit`.
- OPS hoàn lại tiền thừa: `debit`.
- Công ty hoàn thêm tiền chi vượt: `credit`.
- Điều chỉnh tăng: `credit`.
- Điều chỉnh giảm: `debit`.
- Hủy/đảo giao dịch: cần transaction đảo, không sửa/xóa lịch sử gốc nếu đã phát sinh.

## Ba trường hợp hoàn ứng

- Thực chi bằng đã ứng: chênh lệch `0`, kết thúc quyết toán.
- Thực chi nhỏ hơn đã ứng: OPS hoàn lại phần thừa.
- Thực chi lớn hơn đã ứng: công ty hoàn thêm phần chi vượt.

## Màn hình đề xuất

- `Đề nghị ứng`: tạo/duyệt tiền ứng.
- `Hoàn ứng`: kê khai chi phí, chứng từ, quyết toán.
- `Giao dịch ứng - hoàn ứng OPS`: sổ lịch sử biến động ví OPS.
- `Số dư OPS`: tổng hợp từng nhân viên OPS đang còn bao nhiêu tiền chưa quyết toán.

## Nguyên tắc triển khai trong dự án TTK

- Không dùng content type cho module mới nếu không bắt buộc.
- Dữ liệu nghiệp vụ mới nên lưu custom table qua `hook_schema()`.
- UI theo pattern list page + modal CRUD.
- API theo RESTful `/api/<entity>` và `/api/<entity>/{id}`.
- Giao dịch ví phát sinh từ nghiệp vụ đã duyệt, không nhập tất cả thủ công trên sổ giao dịch.
- Khi chưa duyệt hoàn ứng, không trừ số dư chính thức.

## Module chuẩn đang triển khai

- Module web/admin mới: `giao_dich_ops`.
- Route UI: `/giao-dich-ops`.
- API ledger: `/api/giao-dich-ops`, `/api/giao-dich-ops/{id}`.
- API số dư: `/api/so-du-ops`.
- API đề nghị ứng cho app/lái xe/OPS dùng sau này: `/api/de-nghi-ung-ops`, `/api/de-nghi-ung-ops/{id}`.
- Ba folder import cũ `ops_api`, `ops_wallet`, `ops_wallet_api` chỉ dùng để tham khảo nghiệp vụ/logic, không nên bật cùng `giao_dich_ops` nếu còn route trùng `/giao-dich-ops`.
- Field khóa ngoại trong module mới đặt id phía trước: `uid_ops`, `nid_lai_xe`, `nid_ke_hoach`, `nid_ledger`.

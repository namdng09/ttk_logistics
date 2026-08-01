OPS API 7.x-1.7 - Lọc XNK, cược vỏ và sổ ví OPS
===================================================

1. Chọn vỏ
- /ops-api/container-bookings và /ops-api/completed-container-bookings chỉ trả đơn hàng có loai_xnk thuộc SEA XUẤT hoặc AIR XUẤT.
- Giá trị loai_xnk được đọc từ field_noi_dung_json của content type don_hang.

2. Cược vỏ hàng nhập
- GET /ops-api/container-deposit-bookings
  Trả booking SEA NHẬP/AIR NHẬP, các cont đã có số cont nhưng chưa cược, lịch sử cont đã cược và ví OPS.
- POST /ops-api/pay-container-deposit
  Cho phép cược nhiều cont, mỗi cont có đơn giá và danh sách chi phí khác riêng.
  Server kiểm tra lại số dư, khóa giao dịch, trừ ví và cập nhật đơn hàng trong cùng transaction.
- GET /ops-api/wallet
  Trả số dư và tối đa 100 giao dịch gần nhất.

3. Lưu lịch sử ví
- Bảng ops_api_wallet_ledger do module ops_wallet quản lý và là sổ cái/số dư nguồn.
- Mỗi giao dịch đồng thời tạo node content type giao_dich_vi_ops, body lưu JSON đầy đủ để audit.
- Cược vỏ tạo giao dịch debit loại container_deposit.

4. Khởi tạo số dư
Module ưu tiên đọc số dư ban đầu từ user field:
- field_so_du_vi_ops
- field_so_du_vi
- field_so_du

Nếu website chưa có các field trên, đặt số dư đầu kỳ cho từng UID trước khi gọi API ví lần đầu:
  drush vset ops_api_wallet_opening_balance_<UID> <SO_TIEN>
Ví dụ:
  drush vset ops_api_wallet_opening_balance_25 10000000

5. Kết nối module ứng tiền/hoàn ứng
Sau khi phiếu ứng tiền được duyệt, module khác có thể cộng ví:
  // Module ops_wallet phải được bật.
  ops_api_wallet_credit($uid, $amount, 'advance_approved', $phieu_nid, 'Duyệt phiếu ứng tiền', $details);

Khi OPS hoàn ứng hoặc phát sinh khoản phải trừ ví:
  // Module ops_wallet phải được bật.
  ops_api_wallet_debit($uid, $amount, 'refund_paid', $phieu_nid, 'Hoàn ứng', $details);

6. Triển khai
- Ghi đè toàn bộ thư mục ops_api, bao gồm includes/ops_api.wallet.inc.
- Chạy /update.php hoặc: drush updb -y
- Xóa cache: drush cc all

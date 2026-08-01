MODULE VÍ OPS ĐỘC LẬP
=====================

Machine name: ops_wallet
Content type: giao_dich_vi_ops
Bảng sổ cái: ops_api_wallet_ledger (giữ tên cũ để tương thích dữ liệu/API)

Module cung cấp các hàm tương thích:
- ops_api_wallet_current_balance()
- ops_api_wallet_credit()
- ops_api_wallet_debit()
- ops_api_wallet_create_transaction()
- ops_api_wallet_build_summary()

Triển khai từ bản ops_api cũ:
1. Chép thư mục ops_wallet và ops_api vào sites/all/modules/custom.
2. Bật ops_wallet trước: drush en ops_wallet -y
3. Chạy: drush updb -y
4. Xóa cache: drush cc all

Dữ liệu bảng ops_api_wallet_ledger và node giao_dich_vi_ops hiện có được giữ nguyên.
Không cần sửa Flutter; các endpoint vẫn nằm ở ops_api.

Số dư đầu kỳ mới:
  drush vset ops_wallet_opening_balance_<UID> <SO_TIEN>
Module vẫn đọc biến cũ ops_api_wallet_opening_balance_<UID> để tương thích.

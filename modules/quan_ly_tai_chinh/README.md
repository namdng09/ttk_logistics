# Module Quản lý tài chính — màn `/quan-ly-quy`

Kiến trúc như các màn mới (xem AGENTS.md): template rỗng `templates/quan-ly-quy-list.tpl.php` + `assets/js/quan_ly_quy.js`
+ `assets/css/quan_ly_quy.css` (tiền tố `qq-`), dữ liệu qua API ở `quan_ly_tai_chinh.api.inc`.

## Dữ liệu

- `qltc_quy`: quỹ. `so_du_dau_ky` = số dư lúc tạo quỹ (không sửa sau đó), `so_du_hien_tai` chỉ là bản lưu tạm.
- `qltc_so_cai_quy`: sổ cái — nguồn duy nhất tính số dư (`so_du_dau_ky` + tổng `bien_dong` các dòng còn hiệu lực).
- `qltc_giao_dich`: giao dịch nội bộ của module (`chuyen_quy`, `dieu_chinh`); dòng `ref_type = phieu_thu_chi` là bản sao cũ, bỏ qua.

Phiếu thu/chi (module `thu_chi`) đã duyệt tự đồng bộ vào sổ cái; công nợ, lương, ĐNTT đều đi qua phiếu thu chi.

## API

Xem đầu file `quan_ly_tai_chinh.api.inc`.

# Brief thiết kế lại modal xếp xe tuyến xa

Mục tiêu: thiết kế lại giao diện modal xếp xe cho kế hoạch tuyến xa, dựa trên cấu trúc hiện tại gồm 4 khối nghiệp vụ rõ ràng.

## Cách dùng gói thiết kế

File MD này là tài liệu tổng hợp để đọc nhanh nghiệp vụ, layout hiện tại, danh sách input, cách lưu backend và các file code cần đối chiếu.

Khi thiết kế lại, nên bắt đầu theo thứ tự:

1. Đọc phần `Cấu trúc giao diện hiện tại`.
2. Thiết kế lại 4 khối lớn theo thứ tự nghiệp vụ.
3. Đối chiếu danh sách input trong từng khối.
4. Đối chiếu phần `Lưu backend` để biết field nào là column, field nào là JSON.
5. Khi gửi lại thiết kế cho dev, ghi rõ thay đổi layout theo từng khối: `Kế hoạch chính`, `Cont kéo về`, `Kế hoạch kết hợp`, `Chứng từ hình ảnh kế hoạch`.

## Nội dung gói zip

Gói zip nên có các file sau:

- `modules/ke_hoach_xep_xe/DESIGN_BRIEF_MODAL_XEP_XE_TUYEN_XA.md`
  - Tài liệu tổng hợp này.

- `modules/ke_hoach_xep_xe/assets/js/ke_hoach_xep_xe.js`
  - File quan trọng nhất cho modal xếp xe.
  - Hàm cần xem khi thiết kế: `renderCards()`, `syncLine()`, `gatherEditPayload()`, `renderPlanFilesHtml()`.

- `modules/ke_hoach_xep_xe/assets/css/ke_hoach_xep_xe.css`
  - Style hiện tại của modal.
  - Các class cần xem: `khxh-tuyen-xa-card`, `khxh-main-plan-card`, `khxh-cont-ref-card`, `khxh-ket-hop-card`, `khxh-plan-files-*`.

- `modules/ke_hoach_xep_xe/templates/ke-hoach-tuyen-xa-edit.tpl.php`
  - Khung template của màn xếp xe tuyến xa.

- `modules/ke_hoach_xep_xe/templates/ke-hoach-xep-xe-edit.tpl.php`
  - Template tuyến thường có nhiều phần dùng chung, đặc biệt khu vực chứng từ.

- `modules/ke_hoach_xep_xe/ke_hoach_xep_xe.module`
  - Backend/API chính.

- `modules/ke_hoach_xep_xe/ke_hoach_xep_xe.install`
  - Schema và update hook DB.

- `modules/ke_hoach_xep_xe/assets/js/ke_hoach_chi_phi.js`
  - File liên quan phần chi phí, cần tham khảo vì `Tăng bo` sau này sẽ link doanh thu/lương lái xe sang chi phí.

## Trạng thái hiện tại cần nhớ

- Modal xếp xe tuyến xa đang dùng card layout, không dùng table layout.
- Tuyến thường vẫn dùng nhiều phần chung nhưng không phải trọng tâm thiết kế lần này.
- Các thay đổi đang hướng tới tuyến xa trước, tránh phá tuyến cảng/tuyến thường.
- `Kế hoạch kết hợp` hiện mới là placeholder, chưa có nghiệp vụ chi tiết.
- `Tăng bo` hiện đã có UI nhập liệu và lưu JSON, nhưng chưa link sang chi phí thật.
- `Chứng từ hình ảnh kế hoạch` đã có upload, preview ảnh/PDF, giới hạn 25 file/kế hoạch, resize ảnh server-side.

## File code liên quan

- `modules/ke_hoach_xep_xe/templates/ke-hoach-tuyen-xa-edit.tpl.php`
  - Khung trang/modal xếp xe tuyến xa.
  - Chứa form chính, vùng render dòng kế hoạch, vùng chứng từ hình ảnh.

- `modules/ke_hoach_xep_xe/assets/js/ke_hoach_xep_xe.js`
  - Render layout form tuyến xa trong hàm `renderCards()`.
  - Xử lý Select2, checkbox, upload chứng từ, preview file, submit form.

- `modules/ke_hoach_xep_xe/assets/css/ke_hoach_xep_xe.css`
  - Style chính cho modal xếp xe.
  - Các class tuyến xa mới bắt đầu bằng `khxh-tuyen-xa-*`.

- `modules/ke_hoach_xep_xe/ke_hoach_xep_xe.module`
  - API create/update/get.
  - Lưu `loai_hang`, `bai_lay_thuc_te`, `bai_ha_thuc_te`, `tang_bo`, `ket_hop`.
  - Upload/xoá/preview dữ liệu chứng từ.

- `modules/ke_hoach_xep_xe/ke_hoach_xep_xe.install`
  - Schema/update hook.
  - Có update hook thêm column `loai_hang`.

## Cấu trúc giao diện hiện tại

Thứ tự 4 khối trong modal xếp xe tuyến xa:

1. Kế hoạch chính
2. Cont kéo về
3. Kế hoạch kết hợp
4. Chứng từ hình ảnh kế hoạch

## 1. Kế hoạch chính

Header card:

- Tiêu đề: `1. Kế hoạch chính`
- Checkbox bên phải:
  - `Bãi thực tế`
  - `Tăng bo`
  - `Kết hợp`

Section `Khách hàng & hàng`:

- `Khách hàng` - Select2, required, có option tạo mới khách hàng.
- `Số booking/ bill` - text, required.
- `Loại hàng` - text.
- `Loại cont` - Select2 tags.
- `Số cont` - text.
- `Seal chính` - text.
- `Seal phụ` - text.

Section `Tuyến vận chuyển`:

- `Địa chỉ đóng/ trả hàng (Kho)` - Select2 tags, required, có option tạo mới kho.
- `Bãi lấy` - Select2, có option tạo mới bãi.
- `Bãi hạ` - Select2, có option tạo mới bãi.

Khi bật checkbox `Bãi thực tế` mới hiển thị:

- `Bãi lấy thực tế` - Select2 tags, có option tạo mới bãi.
- `Bãi hạ thực tế` - Select2 tags, có option tạo mới bãi.

Khi tắt checkbox `Bãi thực tế`, lúc lưu sẽ clear:

- `bai_lay_thuc_te`
- `bai_ha_thuc_te`

Section `Phương tiện & vận hành`:

- `Phương tiện` - button mở modal chọn phương tiện.
- `Mooc` - button mở modal chọn mooc.
- `Lái xe` - Select2.
- `Ngày bắt đầu` - date `dd/mm/yyyy`.
- `Ngày kết thúc` - date `dd/mm/yyyy`.
- `Hình thức vận tải` - radio.
- `Ghi chú` - text full width.

Các option `Hình thức vận tải` tuyến xa hiện tại:

- `cat_keo` - Cắt kéo
- `tha_mooc` - Thả mooc
- `rut_mooc` - Rút mooc
- `dong_hang` - Đóng hàng

Tuyến xa đã bỏ:

- Cut-off
- Cảng xuất
- Cắt kéo chéo
- Rời Cont

Khi bật checkbox `Tăng bo` mới hiển thị section `Tăng bo`:

- `Khách hàng tăng bo` - Select2, có option tạo mới khách hàng.
- `Địa chỉ tăng bo` - text.
- `Doanh thu khách hàng` - money input.
- `Lương lái xe` - money input.
- `Ghi chú tăng bo` - text full width.

Khi bật checkbox `Kết hợp`:

- Hiển thị card `3. Kế hoạch kết hợp`.
- Hiện tại card này chỉ là placeholder, chờ thiết kế/chức năng tiếp theo.

## 2. Cont kéo về

Card riêng, tiêu đề: `2. Cont kéo về`.

Card chỉ hiển thị khi hình thức vận tải cho phép chọn cont kéo về.

Các hình thức hiện đang cho chọn cont kéo về:

- `cat_keo`
- `cat_keo_cheo`
- `rut_mooc`

Trong tuyến xa, do `cat_keo_cheo` đã bị bỏ khỏi option, thực tế người dùng chủ yếu còn:

- `cat_keo`
- `rut_mooc`

Nội dung card:

- Filter số BKG.
- Filter số cont.
- Filter kho.
- Filter trạng thái đủ hàng.
- Bảng chọn cont kéo về.

Cột bảng:

- Chọn
- Xe kéo lên
- Booking / Cont
- Địa chỉ đóng/ trả hàng (Kho)
- Bãi hạ
- Đủ hàng
- Ghi chú

## 3. Kế hoạch kết hợp

Card riêng, tiêu đề: `3. Kế hoạch kết hợp`.

Hiện tại:

- Chỉ hiện khi bật checkbox `Kết hợp`.
- Nội dung là placeholder.

Ý tưởng cho thiết kế tiếp theo:

- Đây là kế hoạch/hàng tiện chuyến khác với kế hoạch chính.
- Nên có background nhẹ khác để phân biệt.
- Không nên trộn field của kế hoạch kết hợp vào card kế hoạch chính.

## 4. Chứng từ hình ảnh kế hoạch

Card riêng, tiêu đề: `4. Chứng từ hình ảnh kế hoạch`.

Header:

- Badge số file dạng `N/25 file`.
- Khi đạt `25/25 file`, input file và nút upload bị disable.

Vùng upload:

- `Mốc nghiệp vụ` - select.
- `File ảnh/PDF` - file input multiple.
- Button `Upload`.

Mốc nghiệp vụ:

- `lay_cont_rong` - `1. Nhận cont rỗng`
- `giao_cont_rong_cho_kho` - `2. Giao cont rỗng`
- `nhan_cont_hang_tu_kho` - `3. Nhận cont hàng`
- `ha_cont` - `4. Hạ cont hàng`

Vùng danh sách file:

- Layout 2 cột trên desktop.
- 1 cột trên mobile.
- Mỗi nhóm hiển thị badge số file trong nhóm.
- Hover file có tooltip:
  - Tên file
  - Mốc nghiệp vụ
  - Thời gian upload
  - Dung lượng

Preview:

- Ảnh xem trực tiếp trong modal.
- PDF xem trực tiếp bằng iframe trong modal.
- Có nút `Mở tab mới`.

Giới hạn upload:

- Tối đa 25 file / kế hoạch.
- Tối đa 10MB / file.
- Ảnh nếu cạnh dài vượt 2560px sẽ resize xuống 2560px phía server.
- PDF không resize.

## Lưu backend

Column riêng trong bảng `ke_hoach_xep_xe`:

- `nid_khach_hang`
- `so_bkg`
- `loai_hang`
- `loai_cont`
- `so_cont`
- `so_seal_chinh`
- `so_seal_tam`
- `dia_chi_kho`
- `bai_lay_cont`
- `bai_lay_thuc_te`
- `bai_ha_cont`
- `bai_ha_thuc_te`
- `nid_phuong_tien`
- `nid_mooc`
- `nid_lai_xe`
- `ngay_bat_dau`
- `ngay_ket_thuc`
- `hinh_thuc_van_tai`
- `ke_hoach_cont_ref_nid`
- `da_cat_mooc`
- `da_du_hang`
- `loai_ke_hoach`

JSON trong `thong_tin_json`:

```json
{
  "ghi_chu": "",
  "tang_bo": {
    "enabled": 1,
    "nid_khach_hang": 0,
    "dia_chi": "",
    "ghi_chu": "",
    "doanh_thu_khach_hang": 0,
    "luong_lai_xe": 0
  },
  "ket_hop": {
    "enabled": 1
  },
  "hinh_anh_chung_tu": []
}
```

Ghi chú:

- `Loại hàng` là column riêng vì có khả năng cần lọc/báo cáo sau này.
- `Tăng bo` đang lưu JSON để sau này link sang chi phí/doanh thu.
- `Kết hợp` hiện mới lưu flag, chờ chức năng kế hoạch kết hợp.
- Chứng từ vẫn giữ key nhóm cũ để không ảnh hưởng file đã upload.

## Gợi ý thiết kế lại

- Giữ 4 khối lớn để phân biệt nghiệp vụ.
- `Kế hoạch chính` là card lớn đầu tiên.
- `Cont kéo về` là card riêng, không trộn với kế hoạch kết hợp.
- `Kế hoạch kết hợp` dùng card riêng, nền khác nhẹ.
- `Chứng từ hình ảnh kế hoạch` giữ ở cuối.
- Nên ưu tiên layout scan nhanh: ít chiều cao, label rõ, khoảng cách đều, không dùng text mô tả dài trong UI.

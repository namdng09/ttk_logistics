# Dự án TTK Logistics

## Công nghệ

- **Drupal 7** (module + theme)
- **Vuexy Bootstrap HTML Admin Template** (giao diện, lấy từ `html-version/Bootstrap5/vuexy-bootstrap-html-admin-template/`)

## Cấu trúc repo

```
/
├── modules/                     # Drupal modules (flat, không api/ con)
│   ├── phuong_tien/             # Module phương tiện (base pattern mới)
│   │   ├── phuong_tien.info     # Khai báo module
│   │   ├── phuong_tien.module   # hook_menu, hook_permission, hook_theme, API, UI
│   │   ├── phuong_tien.install  # hook_schema (custom table)
│   │   ├── templates/           # .tpl.php layout (hybrid pattern)
│   │   │   ├── phuong-tien-list.tpl.php
│   │   │   └── phuong-tien-form.tpl.php
│   │   └── assets/              # CSS/JS riêng
│   │       ├── css/
│   │       └── js/
│   │
│   ├── crm_dntt/                # (cũ) Module đề nghị thanh toán — tham khảo
│   ├── user_login_api/          # Auth module: login, token validation
│   ├── danh_muc/                # (sẽ migrate)
│   ├── ben_thu_ba/
│   ├── lai_xe/
│   ├── hop_dong/
│   ├── cau_hinh_gia_ban/          # Module cấu hình giá bán (bảng giá) — theo khách hàng
│   ├── dinh_muc_khoan/           # Định mức khoán lái xe theo tuyến — dùng CHUNG toàn hệ thống
│   ├── de_nghi_thanh_toan/       # Đề nghị thanh toán chi phí kế hoạch (gom chi phí → duyệt 2 bước → trả từng đợt)
│   ├── do_dau/                   # Theo dõi đổ dầu: phiếu đổ dầu → duyệt phiếu → (sau này) đề nghị thanh toán
│   └── ben_thu_ba_api/
│
├── themes/                      # Drupal theme
│   └── edusoul/                 # Theme chính, dùng Vuexy assets
│       ├── edusoul.info         # Khai báo theme
│       ├── template.php         # Preprocess, assets management, navbar
│       ├── html.tpl.php
│       ├── page.tpl.php
│       ├── page--front.tpl.php
│       ├── page--user--login.tpl.php
│       └── quan-ly/assets/      # Vuexy admin assets
│
├── html-version/                # HTML template mẫu (Vuexy) — copy từ /home/namdng09/work/html-version/
│
└── api/                         # (cũ) Module cũ dùng content type — sẽ migrate dần
```

## Hàng cảng và Tuyến xa — 2 nghiệp vụ độc lập (module `ke_hoach_xep_xe`)

Module `ke_hoach_xep_xe` chứa 2 màn hình **khác nhau hoàn toàn về nghiệp vụ**, dù đang dùng chung bảng `ke_hoach_xep_xe`, chung file `.module` / `.js` / `.css`:

| | Hàng cảng | Tuyến xa |
|---|---|---|
| Route | `/ke-hoach-xep-xe` | `/ke-hoach-tuyen-xa` |
| `loai_ke_hoach` | `thuong` | `tuyen_xa` |
| Trạng thái | Chờ duyệt → Chờ thực hiện → Đã nhận chuyến → Đang kéo lên → Đang kéo về → Hoàn thành / Đã huỷ | Chưa xếp xe → Đang vận chuyển → … → Hoàn thành |

Lý do: ban đầu tưởng kế hoạch chỉ là một kiểu nên gom chung, sau đó logic của 2 bên thay đổi độc lập nên giờ chúng là 2 chức năng riêng.

**Quy tắc khi code:**
- Mỗi task chỉ thuộc **một** màn. Xác định rõ màn nào trước khi sửa, sửa xong không được làm đổi hành vi của màn còn lại.
- **Không** thêm nhánh `if (loai_ke_hoach === 'tuyen_xa')` / `currentPlanType() === 'tuyen_xa'` để xử lý logic mới. Viết hàm, hằng số, CSS class, template riêng cho từng màn (VD: `hangCangPlanStatusColor()` chỉ dành cho hàng cảng).
- Code cũ còn nhiều chỗ dùng chung có rẽ nhánh theo loại. Khi phải sửa đúng chỗ đó thì tách phần cần đổi ra hàm riêng của màn đang làm, không thêm nhánh mới vào chỗ rẽ nhánh cũ.
- Tên mới đặt theo màn: hàng cảng dùng `hang_cang` / `hangCang` / `khxh-port-*`, tuyến xa dùng `tuyen_xa` / `tuyenXa` / `khxh-tuyen-xa-*`.
- Màu trạng thái, danh sách trạng thái, luồng chuyển trạng thái của 2 màn không dùng chung.

**Đã tách riêng (dùng làm mẫu khi tách tiếp):**
- Dòng danh sách: `hangCangListRowHtml()` / `tuyenXaListRowHtml()` (`ke_hoach_xep_xe.js`); `loadList()` chỉ giữ phần gọi API, phân trang, snapshot.
- Kiểm tra form: `validatePortForm()` / `validateTuyenXaForm()`; nút trạng thái trong modal: `updatePortStatusButton()` / `updateTuyenXaStatusButton()`; payload `thong_tin_json`: `portLineJson()` / `tuyenXaLineJson()`.
- Cập nhật cont/trạng thái (`PUT /api/quan-ly-cont/{id}`): `_ke_hoach_port_cont_rest_update()` / `_ke_hoach_tuyen_xa_cont_rest_update()`.
- Định mức khoán hàng cảng: `PUT /api/ke-hoach-xep-xe/{id}/dinh-muc` (không đi qua `/api/quan-ly-cont`).
- Cảnh báo thay đổi chưa lưu chỉ áp dụng cho modal xếp xe hàng cảng (`#ke-hoach-edit-fullscreen-modal`).

### Hàng cảng: 2 trạng thái tách riêng (chuyến lái xe và cont)

- **Trạng thái chuyến** (`trang_thai_van_chuyen`): thuộc từng kế hoạch, theo việc lái xe của kế hoạch đó làm. Hiện ở cột T.Thái và app lái xe.
- **Trạng thái cont** (`trang_thai_cont`): thuộc cont, theo hành trình cont: Chưa cắt mooc → Đã cắt mooc → Đủ hàng → Đang kéo về → Hoàn thành. Chỉ kế hoạch có cont ở kho (cắt kéo, cắt kéo chéo, thả mooc) mới có.
- Kế hoạch A chọn cont kéo về = kế hoạch B (`A.ke_hoach_cont_ref_nid = B.nid`). A "Thực hiện kéo về" ⇒ chuyến A: Đang kéo về, **cont B**: Đang kéo về (chuyến của B không đổi). A hoàn thành ⇒ cont B hoàn thành. Admin cũng có thể "Xác nhận cont đã về" trên web.
- Chặng theo hình thức: đóng hàng không có chặng nào (Đã nhận → Hoàn thành); thả mooc chỉ kéo lên; rút mooc chỉ kéo về (bắt buộc chọn cont); cắt kéo / cắt kéo chéo có cả kéo lên và kéo về. Cả ba hình thức có kéo về được lưu khi chưa chọn cont (lập kế hoạch trước), nhưng chuyến bị khoá ở bước "Thực hiện kéo về" (và không hoàn thành được) cho tới khi chọn cont. "Rời cont" đã ẩn khỏi form.
- Chưa làm (để sau): cont B phải Đủ hàng mới được kéo về; bước "Hoàn thành, không kéo về" (có lý do) cho trường hợp không kéo về được nữa.
- **Màn `/cat-mooc` (cont ở kho)** là màn riêng: template `ke-hoach-cat-mooc-list.tpl.php`, JS `ke_hoach_cat_mooc.js`, CSS `ke_hoach_cat_mooc.css`, API `GET /api/ke-hoach-cat-mooc` (phân trang, đếm theo tab, cần quyền xem). Giao diện giống hàng cảng nhưng là **bản riêng, không chia sẻ selector**: mọi id/class dùng tiền tố `cm-` (`#ke-hoach-cat-mooc-screen`, `#cm-list-app`, `.cm-*`), `ke_hoach_cat_mooc.css` là bản sao chép từ CSS hàng cảng rồi đổi tên; sửa CSS/JS hàng cảng không ảnh hưởng màn này và ngược lại. Lấy theo **trạng thái cont thật**, không theo hình thức vận tải: tab Tất cả (mặc định), Ở kho (`Đã cắt mooc` + `Đủ hàng`), Đủ hàng, Đang kéo về, Chưa cắt mooc, Hoàn thành; luôn là hàng cảng, bỏ kế hoạch đã huỷ. Thao tác cont do server trả về (`hanh_dong_cont`, `_ke_hoach_port_cont_actions()`) và đi qua `PUT /api/quan-ly-cont/{id}`: bấm trạng thái đổi `Đã cắt mooc` ↔ `Đủ hàng`; admin xác nhận `Chưa cắt mooc` → `Đã cắt mooc` (phòng lái xe quên) và `Đang kéo về` → `Hoàn thành`. Mỗi lần đổi trạng thái cont ghi mốc vào `thong_tin_json.moc_trang_thai_cont` (thời gian, uid) để tính số ngày ở kho. Cờ `da_cat_mooc` chỉ là ý định theo hình thức, không cho biết cont đã ở kho. Thanh lọc: Select2 gắn `dropdownParent` vào `#cm-filter`; khách hàng hiện theo mã KH; kho lấy đủ từ `/api/danh-muc?phan_loai=Kho`; các ô lọc chỉ có tác dụng khi bấm Tìm (hoặc Enter). **Tạo kế hoạch kéo về từ cont** (menu dòng, mục `tao_ke_hoach_keo_ve` do server trả về chỉ khi cont ở kho — `Đã cắt mooc`/`Đủ hàng` — và chưa có kế hoạch kéo về đang hoạt động): modal `#cm-create-modal` gọi `POST /api/ke-hoach-xep-xe` với `ke_hoach_cont_ref_nid` = cont của dòng (không chọn lại cont, một kế hoạch chỉ kéo một cont). Hình thức: rút mooc (điền sẵn khách hàng/BKG/kho theo cont, khoá kho), cắt kéo (kho trùng kho cont, khoá), cắt kéo chéo (kho khác kho cont). Server kiểm tra cont khi chọn/đổi cont (`_ke_hoach_port_validate_return_cont`: là hàng cảng, có cont ở kho, chưa huỷ, quy tắc kho; **không** kiểm tra trạng thái cont lúc lưu — lưu chỉ là lập kế hoạch trước, cont chưa cắt mooc vẫn chọn được. Trạng thái cont `Đã cắt mooc`/`Đủ hàng` chỉ chặn khi chạy xe, ở bước "Thực hiện kéo về", qua `_ke_hoach_port_keo_ve_blocker()`). Kế hoạch kéo về bị huỷ hoặc xoá thì giải phóng cont (`_ke_hoach_port_release_ref_cont`; kế hoạch đã huỷ không tính là đang kéo cont).
- **Danh sách hàng cảng (`/ke-hoach-xep-xe`)**: thẻ trạng thái cont ở cột T.Thái cũng bấm được để đổi `Đã cắt mooc` ↔ `Đủ hàng` (có hộp xác nhận, `requestPortContToggle()` trong `ke_hoach_xep_xe.js`). Server trả `hanh_dong_cont` cho từng dòng chỉ khi có quyền `ke_hoach_xep_xe_create` (`_ke_hoach_port_cont_toggle_actions()`); không thêm mục nào vào dropdown chức năng.
- **Bãi hạ ngoài (hàng cảng)**: cont hạ ở bãi ngoài thay vì bãi hạ theo booking (vd. kiểm dịch). Lưu ở cột `bai_ha_ngoai` (varchar 255, đổi tên từ cờ `ha_bai_ngoai` bằng `ke_hoach_xep_xe_update_7025`). Hàng cảng **không dùng** `bai_lay_thuc_te` / `bai_ha_thuc_te` nữa (tuyến xa vẫn dùng): bãi lấy = `bai_lay_cont`, bãi hạ ngoài = `bai_ha_ngoai`. Trong card `Thông tin xếp xe` có công tắc `Bãi hạ ngoài` (ẩn/hiện ô nằm giữa Địa chỉ kho và `Bãi hạ (theo booking)`); không có cờ bật/tắt riêng: bật = có giá trị, tắt rồi lưu = xoá `bai_ha_ngoai`, chưa lưu thì bật/tắt chỉ ẩn/hiện và giữ giá trị. Chặng định mức lái xe nhận theo `bai_ha_ngoai || bai_ha_cont`. Modal chọn cont kéo về ("Hạ theo booking") ghi vào cùng trường này qua `PUT /api/quan-ly-cont/{id}` (`bai_ha_ngoai`; bãi trùng bãi hạ theo booking thì lưu rỗng). Quản lý cont không còn tick "Hạ bãi ngoài" (chỉ hiện text `bai_ha_ngoai`).
- **Nút "Đẩy cho lái xe" trong modal xếp xe hàng cảng** (`#khxh-push-driver-btn`, header cạnh nút Lưu): chỉ hiện khi chuyến `Chờ duyệt`, bấm là chuyển thẳng `Chờ thực hiện` (qua `hanh_dong_tiep_theo` do server trả về) mà không cần Lưu; đẩy xong thì ẩn. Có hộp xác nhận + toast. Server chỉ thấy dữ liệu đã lưu nên nếu form có thay đổi chưa lưu thì hỏi "Lưu và đẩy" (lưu trước, đẩy sau qua `state.afterSave`); thiếu lái xe thì hiện lý do do server trả về.
- "Đủ hàng" nghĩa là cont đã ở kho và đủ hàng: tick đủ hàng chỉ chuyển trạng thái cont khi đang `Đã cắt mooc`; nếu đánh dấu đủ hàng trước khi cắt mooc thì khi cắt mooc cont vào thẳng `Đủ hàng`.
- **Một nguồn duy nhất** cho các bước hợp lệ: `_ke_hoach_port_trip_options()`; đổi trạng thái qua `_ke_hoach_port_trip_change()` (transaction, cập nhật cả cont). Web (menu, modal), `PUT /api/quan-ly-cont/{id}` và app (`api/mobile/chuyen-xe/{id}/nhan|keo-len|keo-ve|hoan-thanh`) đều dùng chung; JS chỉ hiển thị `hanh_dong_tiep_theo` do server trả về.

## Module pattern mới

### Schema thuần (không Entity API)

- Dùng `hook_schema()` trong `.install` để tạo custom DB table.
- CRUD qua `db_select()`, `db_insert()`, `db_update()`, `db_delete()`.
- **Không dùng** `hook_entity_info()`, `EntityAPIController`.
- Dữ liệu lưu trong custom table → không xem được qua Content UI, test qua API hoặc SQL.

### hook_permission

```php
function module_permission() {
  return array(
    'module_view' => array('title' => t('Xem')),
    'module_create' => array('title' => t('Tạo/sửa')),
    'module_delete' => array('title' => t('Xoá')),
  );
}
```

- Route UI page dùng `'access callback' => 'user_is_logged_in'`.
- API endpoint dùng `'access callback' => TRUE`.
- Auth token do `user_login_api` xử lý, authorization do `user_access()` trong callback.

### RESTful API — hook_menu

```
Collection:  GET    /api/<entity>        → list + phân trang
             POST   /api/<entity>        → tạo mới
Item:        GET    /api/<entity>/{id}   → chi tiết
             PUT    /api/<entity>/{id}   → cập nhật
             DELETE /api/<entity>/{id}   → xoá
```

Chỉ cần **2 route** trong `hook_menu()`:

```php
$items['api/<entity>'] = array(
  'page callback' => 'module_rest_collection',
  'access callback' => TRUE,
  'type' => MENU_CALLBACK,
  'delivery callback' => 'drupal_json_output',
);
$items['api/<entity>/%'] = array(
  'page callback' => 'module_rest_item',
  'page arguments' => array(2),
  'access callback' => TRUE,
  'type' => MENU_CALLBACK,
  'delivery callback' => 'drupal_json_output',
);
```

Dispatch method trong từng callback:

```php
function module_rest_collection() {
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':  return _module_rest_list();
    case 'POST': return _module_rest_create();
    default:     return array('success' => FALSE, 'message' => 'Method not allowed');
  }
}
```

### UI pages — hook_menu (Modal CRUD)

```
UI List:  /<entity>               → danh sách + modal create/edit/view
```

Chỉ cần **1 route**:

```php
$items['<entity>'] = array(
  'title' => 'Danh sách',
  'page callback' => 'module_page_list',
  'access callback' => 'user_is_logged_in',
  'type' => MENU_NORMAL_ITEM,
);
```

- Không có `/them-moi` hay `/{id}`. Tạo/sửa/xem đều qua modal trên cùng trang list.

### Hybrid pattern — hook_theme + .tpl.php

**.tpl.php chỉ chịu layout HTML rỗng + placeholder.**
**JS gọi API fill data.**

```php
function module_theme() {
  $path = drupal_get_path('module', 'module_name') . '/templates';
  return array(
    'module_list_page' => array(
      'template' => 'module-list',
      'path' => $path,
    ),
  );
}
```

Page callback:

```php
function module_page_list() {
  drupal_add_css(...);
  drupal_add_js(...);
  return theme('module_list_page');
}
```

JS (assets/js/module.js):

```javascript
function loadList() {
  $.getJSON('/api/<entity>', function(res) {
    // gán vào <tbody>
  });
}
```

### Auth

- **Module xác thực:** `user_login_api` — endpoint `api/auth/user/login`.
- Login → nhận token.
- Gọi API → gửi token qua header `Authorization: Bearer {token}` hoặc query param `?token=`.
- Module `user_login_api` có hàm `api_validate_token($token)` trả về user object; hàm này tự kiểm tra `status` tài khoản (khoá thì trả `FALSE`).
- Phân quyền qua `user_access()` với các permission đã define trong `hook_permission()`.
- **Chuẩn hiện tại (module `api_common`)**: request tới `api/*` **không có phiên đăng nhập nhưng có Bearer token hợp lệ** thì `api_common_init()` (hook_init) đặt `$user` của Drupal thành tài khoản của token cho riêng request đó (không tạo phiên, `drupal_save_session(FALSE)`). Vì vậy **mọi `user_access('quyen')`/`global $user` trong module đều tính đúng theo vai trò của tài khoản, như người đăng nhập trên web** — module mới **không tự đọc token**, chỉ cần khai báo `hook_permission()` rồi kiểm tra quyền ở đầu callback:
  ```php
  if ($deny = api_require_permission('module_view')) return $deny;   // NULL nếu được phép
  // hoặc: if (!api_has_permission('module_view')) return _module_unauthorized('Bạn không có quyền ...');
  ```
  Có phiên đăng nhập thì dùng phiên (phiên thắng token). Token sai/khoá/không có ⇒ khách vãng lai. Lấy tài khoản đang gọi: `api_current_account()` (NULL nếu khách). Token đọc từ `Authorization: Bearer` (kể cả `REDIRECT_HTTP_AUTHORIZATION`) rồi `?token=` (`api_bearer_token()`); tài khoản bị khoá thì token cũ mất hiệu lực ngay (`api_validate_token()`). Token **hiện không có hạn** và không có cơ chế thu hồi riêng (chỉ khoá tài khoản).
- **Từ chối truy cập**: `_module_unauthorized($msg)` = `api_response_denied()` ⇒ **401 nếu chưa đăng nhập, 403 nếu đã đăng nhập mà thiếu quyền** (client phân biệt được "phải đăng nhập lại" với "không đủ quyền"); `_module_forbidden()` luôn 403. Riêng các endpoint của app lái xe (`_ke_hoach_xep_xe_mobile_*`) giữ 401 như cũ.
- Đặt tên quyền dạng `module_view` / `module_create` / `module_delete` (+ quyền riêng theo nghiệp vụ như `de_nghi_thanh_toan_approve`). Route API vẫn `access callback => TRUE`; phân quyền nằm trong callback, không ở `hook_menu()`. Module cũ còn `'access callback' => 'user_access'` cho trang giao diện (phiên) — đúng chuẩn Drupal, giữ nguyên.
- Module `giao_dich_ops`, `luong_lai_xe` còn cho phép thêm quyền hệ thống `administer permissions` như quyền quản trị; các module khác không có (chưa thống nhất, quyết khi làm chức năng phân quyền).

### Khuôn phản hồi / đầu vào / phân trang dùng chung (`api_common`)

Mỗi module giữ tên hàm cũ (`_module_success/_fail/_error/_not_found/_unauthorized/_forbidden/_method_not_allowed/_input`) nhưng chỉ là **lớp mỏng gọi `api_response_*` / `api_request_input()`** — sửa quy tắc phản hồi 1 lần ở `api_common`. Phân trang: `api_page_number()`, `api_page_limit($default, $max)` (thiếu/rỗng/0/âm ⇒ mặc định, trên trần ⇒ trần), `api_page_params()`, `api_page_result($items, $total, $page, $limit)` (khuôn `{items,total,current_page,total_pages,limit}`). Module mới dùng thẳng các hàm `api_*`, không viết lại. Đầu `.module` có đoạn nạp thẳng `../api_common/api_common.module` nếu chưa bật (API không hỏng khi quên bật) và `.info` khai `dependencies[] = api_common`. Chưa chuẩn hoá (khuôn riêng, để nguyên): `thu_chi`, `ben_thu_ba_api`, `_cnkh_input` (nhận cả form `$_POST`).

### Response format

```json
// 2xx — Thành công
{ "status": "success", "data": { ... } }

// 2xx — Create / Update (trả về full record, không chỉ id)
POST /api/<entity> → { "status": "success", "data": { "nid": 1, "ten": "...", ... } }
PUT  /api/<entity>/{id} → { "status": "success", "data": { "nid": 1, "ten": "...", ... } }

// List
{ "status": "success", "data": { "items": [...], "total": N, "current_page": 1, "total_pages": 1 } }

// 4xx — Lỗi client (validation, auth, not found)
{ "status": "fail", "message": "..." }

// 5xx — Lỗi server
{ "status": "error", "message": "..." }
```

### Request

- POST/PUT: `Content-Type: application/json`, body là JSON object.
- GET/DELETE: query params (`?page=1&keyword=...`).
- Auth: `Authorization: Bearer {token}` hoặc `?token=`.

### Transaction

- Dùng `db_transaction()` cho operation nhiều bước.
- `$transaction->rollback()` + `watchdog()` khi catch Exception.

### assets

- Mỗi module có `assets/css/` và `assets/js/` riêng.
- Module tự load assets của mình trong page callback bằng `drupal_add_css()` / `drupal_add_js()`.
- Theme `themes/edusoul/template.php` có logic reset toàn bộ CSS trong `edusoul_preprocess_html()` rồi add lại vendor/theme CSS. Vì vậy CSS module chỉ hoạt động nếu được preserve trước khi reset.
- Drupal 7 `drupal_add_css()` trả về mảng flat dạng `$css[$path] = $info`, không phải mảng lồng theo media. Khi preserve CSS module, phải duyệt `foreach ($css as $path => $info)`.
- CSS module cần nằm theo pattern `modules/<module>/assets/css/*.css` hoặc `sites/all/modules/<module>/assets/css/*.css` để theme preserve lại được. Không dùng `type => external` với URL nội bộ có query cho CSS module nếu không thật sự cần.
- Nếu một màn hình không nhận CSS module: kiểm tra trước `edusoul_preprocess_html()` có preserve được path CSS trước khi gọi `drupal_static_reset('drupal_add_css')` hay không.

### Môi trường

- **Code:** `/home/namdng09/work/ttk_logistics/` (git repo)
- **Production:** `/public_html/sites/all/modules/` (deploy từ workspace)

## Cấu trúc file module mới

```
modules/<name>/
├── <name>.info             # core=7.x, package=Logistics
├── <name>.module           # hook_menu, hook_permission, hook_theme, API, UI
├── <name>.install          # hook_schema
├── templates/
│   └── <name>-list.tpl.php  # Card table + modal layout (JS fill data)
└── assets/
    ├── css/<name>.css
    └── js/<name>.js        # AJAX CRUD (modal-based)
```

## UI conventions — Modal CRUD screen

### Pattern
- **1 trang duy nhất:** list page + modal cho create/edit/view detail.
- **Không** tạo trang riêng cho form (không `/them-moi`, không `/{id}`).
- `hook_menu()` chỉ cần 1 route UI:

```php
$items['<entity>'] = array(
  'title' => 'Danh sách',
  'page callback' => 'module_page_list',
  'access callback' => 'user_is_logged_in',
  'type' => MENU_NORMAL_ITEM,
);
```

### Template (lai-xe-list.tpl.php)
- Card header: title (buttons chuyển xuống cùng hàng với search).
- Card body: search + buttons (col-md-8 + col-md-4 text-end), table, pagination.
- Không tự thêm text hướng dẫn/mô tả trong UI nếu user không yêu cầu rõ; tránh các đoạn `text-muted small` giải thích chức năng.
- Modal: `modal-dialog-centered modal-xl`, `modal-body` có `position:relative`.
- Loading overlay trong modal: `position:absolute;inset:0;z-index:10;background:rgba(255,255,255,0.85)`.
- Mọi UI có call API hoặc phải chờ dữ liệu trước khi thao tác đều phải có animation/loading state; không để người dùng thao tác khi dữ liệu chưa sẵn sàng.
- View modal: readonly fields.
- Toast: dùng Notyf (Vuexy built-in).
- JS: load list on page load, modal mở ngay với loading overlay, populate sau khi API trả về.

### Date picker — dd/MM/yyyy
- Dùng **Flatpickr** (Vuexy built-in: `vendor/libs/flatpickr/`).
- Input class: `flatpickr-date`.
- Format: `d/m/Y`. Cấu hình: `{ dateFormat: 'd/m/Y', allowInput: true, static: true }`.
- `static: true` để dùng position:fixed (tránh bị modal che).
- CSS override: `.flatpickr-calendar { z-index: 99999 !important; }` (cho modal).
- Date input cho phép gõ tay + tự thêm '/' (Cleave-zen `date-mask`).

### Input mask — Cleave-zen
- Phone: `phone-mask` class.
- Date: `date-mask` class (tự thêm `/`).
- Số thẻ/CMND: `numeric` mask.

### Validate
- Required fields: thêm `required` attribute + label có `<span class="text-danger">*</span>`.
- Email: `type="email"` hoặc pattern.
- Phone: validate bằng Cleave-zen phone mask.
- Số: `type="number"` hoặc inputmode + pattern.
- Client validate: Bootstrap validation (`needs-validation`, `valid-feedback`, `invalid-feedback`).

### Money format
- Input có class `money-mask`, hiển thị theo format Việt Nam (VD: `1.000.000`).
- Lưu vào DB dạng số nguyên (int/numeric), format lại ở frontend.

### Number fields
- `placeholder="0"` để biết là ô nhập số.
- `inputmode="numeric"`, `onkeypress="return (event.charCode >= 48 && event.charCode <= 57)"`.

### Toast
- Dùng **Notyf** (Vuexy built-in).
- Helper JS:

```javascript
var notyf = new Notyf();
notyf.success('Thành công');
notyf.error('Lỗi');
```

### Pagination
- Dùng Bootstrap pagination (`nav > ul.pagination > li.page-item`).
- JS render từ API response (`current_page`, `total_pages`).
- Luôn hiển thị kể cả 1 trang (cho phép jump input).

### Search
- Ô input tìm kiếm + button.
- Gọi lại API với param `?keyword=...`.

### Animation loading
- Spinner trong `<tbody>` khi load list.
- Disable button khi submit form.

### Modal loading overlay
- Modal mở ngay (không đợi API), loading overlay phủ form.
- `showLoading(true)`: hiện overlay, form vẫn render phía dưới.
- API trả về → `showLoading(false)` + `populateForm()` + re-init date pickers/masks.

### API error handler (JS)
- Dùng `apiMsg(jqXHR)` helper parse `responseText` JSON lấy `message`.
- Không dùng message cứng "Lỗi kết nối server".

### Submit on Enter
- Thêm `keydown` listener trên form, nếu `e.which === 13` thì trigger click nút Lưu.

### Naming convention
- `nid` là primary key, auto-increment (serial).
- `created` / `changed`: varchar(19), format `YYYY-MM-DD HH:MM:SS`.
- `hoat_dong`: int tiny, default 1 (soft-delete: 0 = deleted, 1 = active).
- FK trỏ đến node/record khác: đưa key lên đầu — `nid_<entity>` (VD: `nid_lai_xe`, `nid_quy`, `nid_phieu_thu_chi`), không dùng `<entity>_nid` hay `<entity>_id`. Với entity không có `nid` thì dùng `id_<entity>` / `uid_<entity>` tương ứng.
- Junction n-n vẫn dùng `<entity>_<entity>_id` (VD: `phuong_tien_lai_xe_id`).

### Select2 (searchable dropdown)
- **Select2** — thư viện jQuery, biến `<select>` thành ô vừa search vừa chọn.
- File trong Vuexy: `quan-ly/assets/vendor/libs/select2/select2.js` + `quan-ly/assets/js/select2.min.js`.
- Khởi tạo: gọi `$(sel).select2({ placeholder, allowClear, width: '100%' })`.
- `tags: true` — cho phép nhập giá trị mới không có trong list (dùng cho `loai_cont`).
- Helper `_jq()` kiểm tra cả `$` và `jQuery` để tìm instance có `$.fn.select2`.
- Khi làm việc với API: **populate `<option>` trước, init Select2 sau** (gọi `destroy()` rồi tạo lại nếu select đã có Select2).
- `dropdownParent` — chỉ định container (cần khi ở trong modal).
- Select2 mặc định có ô search cho single-select.

### Function dropdown (nút 3-dot trong bảng)
- **Mở/đóng bằng CLICK** — không dùng hover (`mouseover`/`mouseout`).
- HTML chuẩn (đồng nhất mọi module):

```html
<div class="dropdown">
  <button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">
    <i class="ti tabler-dots-vertical"></i></button>
  <ul class="dropdown-menu">...</ul>
</div>
```

- **KHÔNG dùng `data-bs-toggle="dropdown"`** cho nút này (trừ màn đã dùng Bootstrap dropdown chuẩn như quản lý quỹ).
- **Xử lý tập trung ở theme**: `themes/edusoul/quan-ly/assets/js/function-dropdown.js` — delegate click toàn trang cho mọi `.dropdown > button` chứa `.ti.tabler-dots-vertical`, tự:
  - toggle mở/đóng khi click (click lại = đóng).
  - đóng khi click ra ngoài / chọn item / nhấn Esc.
  - collision detection: flip sang trái nếu gần mép phải, đẩy lên trên nếu gần mép dưới (margin 8px), dùng `position:fixed`.
- Module JS **không** cần tự bind dropdown — chỉ cần đúng HTML pattern. Nếu dropdown riêng (như thu_chi `tc-function-btn`) thì thêm class riêng để helper skip.
- Theme `edusoul_preprocess_html()` đã load `function-dropdown.js` toàn cục — không cần `drupal_add_js` lại ở module.

## Định mức khoán lái xe (module `dinh_muc_khoan`) — dùng chung toàn hệ thống

- **Không còn theo từng khách hàng.** Trước đây định mức lưu trong `khach_hang.bang_gia_cuoc.dinh_muc` (JSON riêng mỗi khách hàng), cấu hình qua modal "Định mức khách hàng" ở màn Khách hàng — đã **bỏ hẳn** (route `api/khach-hang/{id}/dinh-muc`, modal, toàn bộ JS liên quan). Dữ liệu cũ không migrate, coi như bỏ. Riêng `bang_gia_cuoc.bang_gia` (giá bán cho khách hàng, module `cau_hinh_gia_ban`) **không đổi**, hai thứ nằm chung 1 cột JSON nhưng là 2 khái niệm khác nhau (giá bán cho khách ≠ định mức trả lái xe).
- **Giờ là 1 bảng dùng chung** (`dinh_muc_khoan`), mỗi dòng là 1 tuyến: `diem_dau`/`diem_cuoi` (text) kèm `diem_dau_alias`/`diem_cuoi_alias` (mảng JSON các tên gọi khác của cùng điểm, để so khớp đỡ lệch do lập kế hoạch gõ tên hơi khác), 3 mức tiền theo trạng thái xe `gia_vo`/`gia_hang`/`gia_trong` (Vỏ/Hàng/Trống). Trùng cặp điểm đầu-cuối (kể cả qua alias, 2 chiều) bị chặn khi tạo/sửa.
- UI: `/dinh-muc-khoan`, modal CRUD chuẩn (không có bước import/export Excel như bản cũ theo khách hàng).
- API: `GET/POST /api/dinh-muc-khoan`, `GET/PUT/DELETE /api/dinh-muc-khoan/{id}`, và `GET /api/dinh-muc-khoan/tuyen` (toàn bộ tuyến đang hoạt động, không phân trang, đúng hình dạng `{routes:[{from,to,km,v,h,t}]}` — cho kế hoạch tải về so khớp, `from`/`to` là tên chính + alias gộp lại).
- **Kế hoạch hàng cảng và tuyến xa dùng chung 1 nguồn** — `ke_hoach_chi_phi.js` (`loadDinhMucKhoan()`) là chỗ nạp dữ liệu duy nhất, phần so khớp/áp dụng (`findDinhMucAmount()`, `applyDinhMuc()`, cờ `manual`, snapshot lưu vào `thong_tin_json.dinh_muc_khoan_lai_xe` của từng kế hoạch) giữ nguyên như trước, không đổi theo màn.
- Kế hoạch đã lưu định mức trước đây (snapshot cũ) **không tự đổi** theo bảng giá mới — chỉ áp dụng khi tạo mới hoặc bấm "Tính lại định mức" trong tab Chi phí.

## Đề nghị thanh toán (module `de_nghi_thanh_toan`)

Trả tiền cho bên ngoài cho các dòng chi phí kế hoạch (`ke_hoach_chi_phi`). Chỉ **kế hoạch hàng cảng**; tuyến xa chưa hỗ trợ (API tạo đề nghị từ chối dòng tuyến xa, vì lưu kế hoạch tuyến xa xoá mềm rồi tạo lại toàn bộ dòng chi phí).

- **GỘP THEO BÊN NHẬN TIỀN, không còn "1 đề nghị = 1 hoá đơn = 1 NCC"** (mô hình cũ, đã bỏ). Bên nhận tiền (`loai_ben_nhan_tien` `ncc`|`nhan_vien` + `id_ben_nhan_tien`) là **khoá gộp bắt buộc, chọn khi tạo** (`_de_nghi_thanh_toan_resolve_payee_required()`) — 1 đề nghị có thể gồm nhiều dòng chi phí thuộc **nhiều hoá đơn của nhiều NCC khác nhau**, miễn mọi dòng có bên nhận tiền HIỆU LỰC trùng đề nghị (`_de_nghi_thanh_toan_line_effective_payee()` + `_de_nghi_thanh_toan_payee_matches()`, kiểm tra lại ở cả tạo/sửa/thêm-bớt dòng). Ví dụ thật: điều vận ứng tiền mặt trả 3 nơi khác NCC trong 1 chuyến, gộp cả 3 vào 1 đề nghị hoàn ứng vì cùng 1 người nhận tiền — mô hình cũ bắt buộc phải tách thành 3 đề nghị.
- **"Hoá đơn" không có bảng riêng**: là cặp `(nid_ncc, so_hoa_don)` lưu trên **từng dòng** `ke_hoach_chi_phi` (cột `so_hoa_don`/`ngay_hoa_don`, thêm ở `ke_hoach_xep_xe_update_7029`), không còn ở bảng đề nghị (3 cột `nid_ncc`/`so_hoa_don`/`ngay_hoa_don` cũ đã bị xoá khỏi `de_nghi_thanh_toan`, migrate xuống dòng ở `de_nghi_thanh_toan_update_7002`). `_de_nghi_thanh_toan_hoa_don_summaries()` là NGUỒN DUY NHẤT gom dòng của 1 đề nghị thành danh sách hoá đơn (`hoa_dons`, `so_hoa_don_count`, `co_dong_chua_hd`), dùng cho cả danh sách và chi tiết; đề nghị nguồn đổ dầu luôn đúng 1 hoá đơn, lấy thẳng từ `do_dau` (không qua hàm này). **Hạn thanh toán + hình thức TT vẫn 1 giá trị dùng chung cho cả đề nghị**, không tách theo từng hoá đơn (đã chốt với PO — mỗi hoá đơn có thể có hạn thật khác nhau nhưng đây là hạn công ty tự đặt cho lần chi này).
- **Sửa nhanh nội dung dòng chi phí** (tên/đơn giá/SL/VAT/ghi chú/số+ngày hoá đơn) **ngay trong modal đề nghị** qua `chi_phi_edits` (map `{nid: {...}}`) gửi kèm khi tạo/sửa đề nghị, xử lý bởi `_de_nghi_thanh_toan_apply_line_edits()` — chỉ cần quyền `de_nghi_thanh_toan_create`, KHÔNG cần `ke_hoach_xep_xe_create` (mục đích: kế toán không phải mở lại kế hoạch xếp xe). Chỉ đúng các trường đó; `nid_ncc`/`loai_chi_phi`/`nid_ke_hoach`/bên nhận tiền của dòng không đổi được từ đây.
- Chỉ dòng KH/CT gom được; LX (lái xe tự chịu) không tham gia. `PUT /api/de-nghi-thanh-toan/{id}` nhận `chi_phi_ids` = **toàn bộ** danh sách dòng muốn giữ (so với danh sách hiện tại để tự suy ra thêm/rút — đúng thao tác tick thêm/bỏ tick), không gửi thì giữ nguyên. Thêm vào đề nghị nháp có sẵn (`nid_de_nghi` khi tạo) thì bên nhận tiền lấy theo đề nghị đó, dòng mới thêm phải khớp.
- **Mã đề nghị** `DNTT-yymmdd-NNNN` (vd `DNTT-260924-0005`): NNNN tăng dần theo **ngày tạo**, sang ngày mới về 0001; đề nghị đã xoá mềm vẫn giữ số (`_de_nghi_thanh_toan_next_code()`). Mã cũ dạng `DNTT-NNNN` giữ nguyên, không đổi.
- **Tổng tiền không lưu cột**: tính động từ các dòng chi phí (`_de_nghi_thanh_toan_aggregates()`), đã trả = tổng bảng `de_nghi_thanh_toan_thanh_toan`. Dòng chi phí trỏ về đề nghị bằng `ke_hoach_chi_phi.nid_de_nghi_chi_phi`; `trang_thai_duyet` mirror trạng thái đề nghị (chỉ `_de_nghi_thanh_toan_set_status()` ghi).
- **Trạng thái**: `nhap → cho_duyet → cho_duyet_thanh_toan → cho_thanh_toan → hoan_thanh`, cộng `tu_choi`/`tu_choi_thanh_toan` (từ chối thì sửa rồi gửi lại, không có trạng thái huỷ). Quyền: `_create` (tạo/sửa/gửi/thu hồi, người tạo hoặc `_view_all`), `_approve`, `_approve_payment`, `_pay`, `_delete` (chỉ nháp), `_view_own`/`_view_all`.
- **Double-click 1 dòng** trong danh sách: mở modal **Sửa** nếu `item.co_the_sua`, không thì mở **Xem chi tiết**; bỏ qua khi trúng nút/link/ô nhập trong dòng. Cùng cơ chế với `/theo-doi-do-dau`/`/ke-hoach-xep-xe`; ở màn này còn phải tương thích với thao tác 1-click-mở-bảng-chi-phí có sẵn (`rowTimer`, phân biệt double click bằng cửa sổ 250ms) — click thứ 2 của double click đã tự huỷ việc mở bảng trước khi `dblclick` nổ ra.
- **Một nguồn duy nhất** cho hành động hợp lệ: `_de_nghi_thanh_toan_actions()`; giao diện chỉ hiện `hanh_dong` do server trả về, endpoint `POST /api/de-nghi-thanh-toan/{id}/{hanh-dong}` kiểm tra lại bằng đúng hàm này.
- API: `GET/POST /api/de-nghi-thanh-toan` (POST = tạo từ `chi_phi_ids` + `loai_ben_nhan_tien`/`id_ben_nhan_tien` bắt buộc, hoặc thêm vào đề nghị nháp bằng `nid_de_nghi`; cả 2 nhận kèm `chi_phi_edits`), `GET/PUT/DELETE /api/de-nghi-thanh-toan/{id}` (PUT nhận thêm `chi_phi_ids` để thêm/rút dòng và đổi bên nhận tiền), `GET /api/de-nghi-thanh-toan/tuy-chon` (NCC, nhân viên, hình thức, quỹ, lái xe của chuyến), hành động: `gui-duyet`, `thu-hoi`, `duyet`, `tu-choi`, `duyet-thanh-toan`, `tu-choi-thanh-toan`, `thanh-toan`, `rut-dong`. Bộ lọc danh sách: `nid_ncc_phat_hanh` (có hoá đơn của NCC này — EXISTS trên dòng chi phí/`do_dau`, không còn cột `nid_ncc` ở bảng đề nghị), `ben_nhan_tien`, `hinh_thuc`, `loai_nguon`, `qua_han`, `chua_hd` (có dòng chưa số hoá đơn), `nhieu_hd` (gồm ≥2 hoá đơn — thay cho `khac_ben` cũ, không còn ý nghĩa).
- **Thanh toán**: mỗi đợt chọn hình thức (`CK`/`TM`) + quỹ đúng loại (`ngan_hang`/`tien_mat`, từ `quan_ly_tai_chinh`). Hiện **chỉ lưu `nid_quy`**, chưa tạo giao dịch chi/trừ số dư quỹ (`ke_hoach_chi_phi.nid_ledger` dành cho bước sau).
- **Nhà cung cấp (khách hàng) hiển thị bằng `ma_kh`** (tên ngắn gọn), không có mã thì dùng tên — áp dụng cho `/de-nghi-thanh-toan`, `/theo-doi-do-dau` và cột NCC ở tab Chi phí hàng cảng. Server trả sẵn nhãn này (hàm `_de_nghi_thanh_toan_ncc_label()` / `_do_dau_ncc_label()`), JS chỉ hiển thị, danh sách NCC sắp theo nhãn. Đề nghị thanh toán ở danh sách/chi tiết: **cột "Bên nhận tiền" luôn hiện thẳng tên** (không còn "Trùng bên phát hành" — không có 1 bên phát hành duy nhất để so nữa); cột **"Hoá đơn liên quan"** hiện chip từng hoá đơn (`item.hoa_dons`, tối đa 2 + "+N khác"), click 1 dòng để bung xem đủ (giống cơ chế 1-click hiện có). Bộ lọc `/de-nghi-thanh-toan` có 2 Select2 riêng: **Nhà cung cấp trong hoá đơn** (`nid_ncc_phat_hanh`, nay lọc kiểu "có ít nhất 1 dòng/phiếu của NCC này") và **Bên nhận tiền** (`ben_nhan_tien` = `ncc|id` / `nhan_vien|uid` / `lai_xe|nid`; chọn lái xe khớp cả đề nghị lưu bên nhận kiểu nhân viên của tài khoản lái xe đó). Như `do_dau.js`, `de_nghi_thanh_toan.js` chọn bản jQuery có plugin lúc trang khởi tạo (`pickJq()`).
- **Bảng gộp 1 nguồn** cho mọi nơi hiện "các hoá đơn/dòng chi phí trong đề nghị" (dòng bung ở danh sách, modal Chi tiết, modal Sửa): `groupedLinesTableHtml()`/`editLinesRowsHtml()` trong `de_nghi_thanh_toan.js`, dùng chung `groupLinesByHoaDon()` — 1 bảng duy nhất, có dòng phân cách riêng (nền xám, viền trái tím) cho từng hoá đơn trước các dòng thuộc hoá đơn đó, kèm cột NCC/Cont-BKG (`so_cont` + `ke_hoach_label`) riêng từng dòng.
- **1 modal dùng chung cho cả Tạo và Sửa** (`#dn-create-modal`; không còn `#dn-edit-modal` riêng) — `createState.mode` (`'create'`/`'edit'`) + `createState.editId` quyết định tiêu đề/nút (`setCreateModalMode()`) và POST (tạo) hay PUT `.../{id}` (sửa) khi lưu (`submitCreate()`); `openCreate()`/`openEdit(id)` đều dựng cùng bảng chọn dòng. Chọn **Bên nhận tiền** trước (bắt buộc, `payeeSelectHtml()`/`initPayeeSelect()`) → gọi `GET /api/ke-hoach-chi-phi?ben_nhan_tien=loai|id&chua_gop=1&gop_duoc=1` (tải hết trang, tối đa 50 trang) → hiện bảng chọn dòng gom theo hoá đơn (`groupLinesByHoaDon()`). **Sửa** nạp thêm bên nhận tiền/hạn TT/hình thức/ghi chú/lý do từ chối hiện có và tự tick sẵn các dòng đã thuộc đề nghị (`createState.ownLines`, lấy thẳng từ `dong_chi_phi` của `GET /api/de-nghi-thanh-toan/{id}` — các dòng này bị `chua_gop=1` loại khỏi bể chọn nên phải gộp thủ công qua `mergeOwnLines()`); đổi payee khi đang sửa dùng cờ `createState.suppressPayeeChange` để tránh handler `change` xoá tick vừa nạp sẵn. Bỏ tick 1 dòng = rút khỏi đề nghị, tick thêm = gộp thêm, chỉ áp dụng khi bấm Lưu (PUT gửi `chi_phi_ids` đầy đủ, server tự so sánh suy ra thêm/rút) — không còn nút "Rút khỏi đề nghị" gọi API riêng theo từng dòng trong modal này nữa (endpoint `rut-dong` vẫn còn, dùng ở nơi khác — xem cột "Đề nghị thanh toán" trong tab Chi phí).
- **Bảng chọn dòng** ("Dòng chi phí gộp vào đề nghị này"): mỗi dòng sửa được ngay tại chỗ **Tên chi phí (select2, `tags:true` — gợi ý lấy từ chính các dòng đang tải, không phải danh mục chi phí mẫu, để khỏi cần thêm quyền `ke_hoach_xep_xe_view`) / Đơn giá / SL / VAT% (input thường) / Ghi chú (input) / Số HĐ (input) / Ngày HĐ (flatpickr `d/m/Y`, `static:true`)** (`.dn-create-edit`; Sau VAT tính lại ngay trên UI theo đúng công thức server rồi gửi cả 7 trường qua `chi_phi_edits` khi lưu — xem `_de_nghi_thanh_toan_apply_line_edits()`; NCC/Loại/Kế hoạch của dòng không đổi được từ đây). Không có cột "Trước VAT" (chỉ tính nội bộ để ra Sau VAT, không hiển thị). Bảng vẽ lại toàn bộ mỗi lần sửa 1 ô (giống các cột khác từ trước) nên phải khởi tạo lại select2/flatpickr sau mỗi lần render (`initCreateRowWidgets()`); sửa `ten_chi_phi` khi rỗng bị chặn và trả select2 về giá trị cũ qua `.trigger('change')` — có cờ `suppressLineEditChange` để lệnh trigger này không tự gọi lại chính handler. Thead dùng chung 1 kiểu (gọn, có màu nền) với bảng "Hoá đơn / chi phí trong đề nghị" ở modal Xem/dòng bung danh sách (`#dn-create-modal .dn-lines > thead > tr > th` gộp chung selector trong CSS). Tick cả nhóm hoặc từng dòng, lọc thêm theo tên chi phí (`keyword`), **số cont** (`so_cont`, JOIN kế hoạch), **số hoá đơn** (`so_hoa_don`, LIKE trên dòng) — dòng đã tick mà không khớp bộ lọc mới vẫn được giữ lại trong bảng (không mất tick), và **Ngày kế hoạch** — dùng lại nguyên bộ `daterangepicker` (Vietnamese locale + 3 nút chọn nhanh Hôm nay/Tuần này/Tháng này) của bộ lọc `/ke-hoach-xep-xe` (`initCreateDateRange()`), không phải input gõ tay. Từ 2 dòng đã tick cùng 1 NCC còn thiếu số hoá đơn trở lên thì hiện thanh "gán nhanh hoá đơn" riêng cho NCC đó (`.dn-bulk-hd`, tách theo từng NCC vì 1 hoá đơn chỉ thuộc 1 NCC). `GET /api/ke-hoach-chi-phi` với `ben_nhan_tien` chỉ cần quyền `de_nghi_thanh_toan_create` (không cần `ke_hoach_xep_xe_view`), và chỉ trả dòng hàng cảng (`loai_ke_hoach=thuong`). CSS module có `.flatpickr-calendar { z-index: 99999 !important; }` (quy ước chung dự án) để lịch Hạn thanh toán/Ngày HĐ không bị các phần tử khác trong modal che khuất.
- **Mở link "Xem" từ tab Chi phí kế hoạch** (`href="/de-nghi-thanh-toan#xem-{id}"`, `target="_blank"` — thường ra tab mới): `start()` phát hiện `#xem-{id}` thì gọi `openView(id, false, true)` — mở modal ngay và (`focusInList=true`) sau khi có chi tiết thì lọc danh sách nền theo đúng **mã đề nghị** (trang 1, tab "Tất cả", ô tìm kiếm tự điền) thay vì nạp danh sách mặc định rồi phải tự tìm/tự bấm sang trang — đề nghị luôn hiện đúng ở trang 1 bất kể đang ở trang/tab nào theo bộ lọc mặc định. Đóng modal (`hidden.bs.modal` trên `#dn-view-modal`) thì `applyTouchedRow()` nổi bật dòng đó (nền tím nhạt + vạch trái, nháy 2 lần, mờ dần sau 10s) và cuộn tới nếu chưa thấy — cùng cơ chế/animation với dòng kế hoạch vừa thao tác ở `/ke-hoach-xep-xe` (`markPlanTouched()`/`hangCangApplyTouchedRow()`). Mở "Xem" bình thường (menu dòng, double-click) cũng đặt `touchedId` nên đóng modal cũng nổi bật, nhưng không tự lọc list (dòng vốn đã hiện sẵn trên màn hình).
- **Chi phí kế hoạch (hàng cảng)**: `ke_hoach_chi_phi` thêm `nid_ncc` (người dùng chọn), `nid_khach_hang` (server tự điền theo khách hàng của kế hoạch khi dòng là KH), và **`so_hoa_don`/`ngay_hoa_don`** (hoá đơn của chính dòng này — xem mục "Hoá đơn không có bảng riêng" ở trên; thêm ở `ke_hoach_xep_xe_update_7029`, validate qua `_ke_hoach_chi_phi_valid_date()`). `trang_thai_duyet`/`nid_de_nghi_chi_phi`/`nid_ledger` không nhận từ client. Dòng thuộc đề nghị đã nộp duyệt (`cho_duyet`…`hoan_thanh`) bị **khoá sửa/xoá** ở server (web, bulk, mobile); dòng thuộc đề nghị nháp/từ chối không được chuyển sang LX/xoá (phải rút khỏi đề nghị trước); **NCC của dòng cũng không đổi được** khi dòng đã thuộc đề nghị (kể cả nháp) — vì dòng "trùng NCC" thì đổi NCC là đổi luôn bên nhận hiệu lực, và NCC là 1 nửa khoá hoá đơn; server chặn ở `_ke_hoach_chi_phi_assert_linked_change()`, ô NCC ở tab Chi phí bị disable như ô Bên nhận tiền; kế hoạch có dòng đang thuộc đề nghị không xoá được. Cột **"Hoá đơn"** (`hoaDonInner()` trong `ke_hoach_chi_phi_dntt.js`, giữa NCC và Bên nhận tiền) — 2 ô nhỏ Số HĐ/Ngày HĐ, khoá khi dòng đã thuộc đề nghị đang xử lý, ẩn hẳn (chỉ hiện "—") ở dòng LX.
- **Nguồn đổ dầu** (`de_nghi_thanh_toan.loai_nguon` = `do_dau`, mặc định `chi_phi`): đề nghị của **1 phiếu đổ dầu** (module `do_dau`, `do_dau.nid_de_nghi` trỏ về đề nghị; 1 phiếu = 1 đề nghị). **Không tạo từ màn đề nghị** mà **tự tạo khi phiếu được "Duyệt TT" ở màn phiếu** (`de_nghi_thanh_toan_create_from_do_dau()`): đề nghị **vào thẳng `cho_thanh_toan`** (duyệt phiếu và duyệt thanh toán đã làm ở phiếu). Người tạo đề nghị = người tạo phiếu, `uid_nguoi_duyet` = người duyệt phiếu, `uid_nguoi_duyet_tt` = người bấm Duyệt TT; bên nhận tiền lấy theo phiếu. Bên phát hành / số hoá đơn / ngày hoá đơn **không sao chép sang đề nghị** (bảng đề nghị không còn 3 cột này) — đọc thẳng từ `do_dau` qua `_de_nghi_thanh_toan_do_dau_refs()`/`_de_nghi_thanh_toan_hoa_don_summaries()` mỗi lần cần. Đề nghị đổ dầu **không có** nháp/gửi duyệt/duyệt bước 1, **không sửa/xoá/rút dòng**; ở màn đề nghị chỉ **Ghi nhận TT** và **Trả lại** (kế toán, khi chưa trả đồng nào). Trả lại ⇒ đề nghị bị huỷ (xoá mềm, giữ mã) và phiếu quay về `tu_choi` kèm lý do (`do_dau_on_de_nghi_rejected()`). Đề nghị còn `cho_duyet_thanh_toan` (tạo từ luồng cũ) vẫn xử lý được: Duyệt TT / Từ chối ngay ở màn phiếu (`de_nghi_thanh_toan_approve_payment_do_dau()`, `de_nghi_thanh_toan_reject_do_dau()`). Tổng tiền tính động từ phiếu (`_de_nghi_thanh_toan_aggregates()`), chi tiết trả phiếu dưới dạng "dòng" (`loai_chi_phi = do_dau`) + `phieu_do_dau`. Bên nhận tiền có thêm loại `lai_xe` (id = `lai_xe.nid`, lái xe chưa có tài khoản vẫn được) — dùng cho cả đề nghị đổ dầu **và đề nghị chi phí** (dòng chi phí đặt bên nhận là lái xe ở tab Chi phí thì gộp được vào đề nghị có bên nhận `lai_xe` cùng nid; `_de_nghi_thanh_toan_resolve_payee_required()` nhận `ncc`/`nhan_vien`/`lai_xe`, `GET /api/ke-hoach-chi-phi?ben_nhan_tien=lai_xe|nid` lọc được). Ô chọn Bên nhận tiền ở modal Tạo/Sửa nhóm theo thứ tự Nhân viên → Nhà cung cấp → Lái xe (cùng thứ tự popup ở tab Chi phí). API danh sách có thêm lọc `loai_nguon`.
- **Bên nhận tiền trên từng dòng chi phí** (căn cứ để sau này gom dòng vào đề nghị theo bên nhận): `ke_hoach_chi_phi.loai_ben_nhan_tien` (`''`|`ncc`|`nhan_vien`|`lai_xe`) + `id_ben_nhan_tien` (nid khach_hang | uid | nid lai_xe). **`''` + 0 = trùng nhà cung cấp của dòng** (đi theo khi đổi NCC, không lưu lặp); server tự về `''` khi dòng là Lái xe chi trả (LX) hoặc khi chọn đúng NCC của dòng (dòng chưa lưu / chưa chọn loại vẫn chọn được) (`_ke_hoach_chi_phi_payee_normalize()`), kiểm tra tồn tại ở `_ke_hoach_chi_phi_payee_is_valid()`. Không gửi key thì giữ giá trị cũ (app lái xe không nhận trường này); dòng đã thuộc đề nghị (kể cả nháp) **không đổi được bên nhận** (`_ke_hoach_chi_phi_assert_linked_change()`, rút khỏi đề nghị trước). API dòng chi phí trả thêm `ben_nhan_tien` = `{loai, id, ten, tu_dong}` (bên nhận hiệu lực; `tu_dong` = đang theo NCC). UI ở `ke_hoach_chi_phi_dntt.js`: cột **Bên nhận tiền** ngay sau Nhà cung cấp (nét đứt "trùng NCC", chọn khác thì có nhãn Lái xe/Nhân viên/NCC), bấm mở popup tìm theo tên/SĐT (Mặc định → Gợi ý: lái xe của chuyến + bên nhận đã dùng ở dòng khác → Lái xe / Nhân viên / Nhà cung cấp, nguồn `GET /api/de-nghi-thanh-toan/tuy-chon`), vừa đổi 1 dòng thì gợi ý áp cho các dòng khác cùng NCC chưa chọn riêng, tick nhiều dòng + nút "Gán bên nhận tiền" gán hàng loạt, dải "Gom theo bên nhận tiền" xem trước nhóm. Chọn trong popup phát 1 sự kiện `change` gốc lên `#khcp-cost-table-body` để modal xếp xe đánh dấu "chưa lưu". **Chưa** dùng để tự gom/tạo đề nghị (đề nghị vẫn chọn bên nhận riêng khi tạo). Nạp lên: chạy update database `ke_hoach_xep_xe_update_7028` (thêm 2 cột).
- **Giao diện tab Chi phí hàng cảng** là phần mở rộng tách riêng: `ke_hoach_chi_phi.js` chỉ có điểm mở rộng `Drupal.keHoachChiPhi.extension` (không rẽ nhánh theo loại kế hoạch); `ke_hoach_chi_phi_dntt.js` + `.css` đăng ký extension và chỉ được nạp ở màn hàng cảng (`_ke_hoach_hang_cang_add_dntt_assets()`), khi module đang bật và người dùng có quyền xem đề nghị. Tuyến xa không nạp file này nên giữ nguyên.
- **Cột "Đề nghị thanh toán" ở tab Chi phí** (`statusInner()` trong `ke_hoach_chi_phi_dntt.js`) chia 2 dòng: dòng 1 chỉ có trạng thái + mã đề nghị (không kèm số hoá đơn, không lặp lại bên nhận tiền — hai thứ này xem ở modal chi tiết/`/de-nghi-thanh-toan` và cột **Bên nhận tiền** riêng); dòng 2 là các nút hành động (`dn.hanh_dong`, chỉ gồm `thu-hoi`/`gui-duyet`/`rut-dong` — Duyệt/Từ chối làm ở `/de-nghi-thanh-toan`) cộng nút "Xem", style/icon đồng bộ với `/de-nghi-thanh-toan` (`ACTION_STYLE`: `thu-hoi` = `btn-label-secondary`, `gui-duyet` = `btn-primary`, `rut-dong` = `btn-label-danger`, `Xem` = `btn-label-info`) để rõ ràng là nút bấm được, không lẫn với chữ mô tả.
- **Tiêu đề card "Chi phí vận hành"** có thêm badge số dòng chi phí đang có (`#khcp-dntt-count`, `operatingCostCount()` trong `ke_hoach_chi_phi_dntt.js`: đếm dòng KH/CT/LX đã nhập tên, trừ dòng trống và trừ 2 loại thuộc card khác — lương lái xe theo chuyến, doanh thu khách hàng), cùng kiểu `badge rounded-pill bg-label-primary border` như badge tổng doanh thu ở card "Doanh thu khách hàng"; cập nhật lại mỗi khi `updateToolbar()` chạy (thêm/xoá/sửa dòng, lưu, tick chọn).
- **Nút "Thêm chi phí"** (`#khcp-dntt-add-btn`) ở cùng hàng với "Gán bên nhận tiền"/"Tạo đề nghị thanh toán" trong toolbar của card, thêm 1 dòng trống cuối bảng — dùng chung `insertCostRow()` của core (`Drupal.keHoachChiPhi.api.addBlankRow()`) với nút "+" trên từng dòng nên cũng chỉ cuộn trong bảng, không cuộn cả modal. Cũng như 2 nút kia, chỉ hiện khi `perms.create` (quyền `de_nghi_thanh_toan_create`).
- Nạp code lên: chạy update database (`ke_hoach_xep_xe_update_7027` thêm 2 cột, `ke_hoach_xep_xe_update_7029` thêm `so_hoa_don`/`ngay_hoa_don` cho `ke_hoach_chi_phi` — **phải chạy trước** `de_nghi_thanh_toan_update_7002` thêm bên dưới), bật module `de_nghi_thanh_toan` (tạo 2 bảng), gán quyền cho từng vai trò, mục menu "Đề nghị thanh toán" ở sidebar theme. **Đề nghị đã có dữ liệu thật trước khi nâng cấp**: bắt buộc chạy `de_nghi_thanh_toan_update_7002` (chuyển `nid_ncc`/`so_hoa_don`/`ngay_hoa_don` từ đề nghị xuống dòng chi phí rồi xoá 3 cột đó) — không chạy thì code mới sẽ lỗi vì đọc cột đã không còn ở bảng cũ. **Lưu ý thứ tự**: `update.php` của Drupal 7 chạy theo TÊN module (bảng chữ cái), không theo dependency, nên `de_nghi_thanh_toan` (d) chạy trước `ke_hoach_xep_xe` (k) trong cùng 1 lần bấm — `de_nghi_thanh_toan_update_7002` sẽ báo lỗi rõ ràng và dừng lại (không làm sai dữ liệu) nếu cột bên kia chưa có; chỉ cần bấm "Apply pending updates" thêm 1 lần nữa sau khi `ke_hoach_xep_xe_update_7029` đã chạy xong.

## Theo dõi đổ dầu (module `do_dau`)

Lái xe đổ dầu ở cây xăng (nhà cung cấp) rồi báo về công ty; công ty duyệt phiếu rồi thanh toán. Route UI `/theo-doi-do-dau`, API `api/do-dau`.

- **Bảng `do_dau`** (1 phiếu = 1 lần đổ = 1 số hoá đơn của 1 cây xăng cho 1 đầu kéo). Mã `DD-yymmdd-NNNN`, NNNN tăng theo **ngày tạo**, phiếu đã xoá mềm vẫn giữ số. FK: `nid_phuong_tien` (đầu kéo), `nid_lai_xe` (lưu giá trị đã chọn lúc tạo, không tự đổi khi xe đổi lái xe), `nid_ncc` (khach_hang phân loại Nhà cung cấp), `nid_de_nghi` (đề nghị thanh toán, 0 = chưa có; **chưa dùng ở giai đoạn 1**).
- **Bên nhận tiền chọn ngay trên phiếu**: `loai_ben_nhan_tien` (`ncc` nid khach_hang | `nhan_vien` uid Drupal | `lai_xe` nid lai_xe — lái xe **chưa có tài khoản vẫn chọn được**) + `id_ben_nhan_tien`, luôn lưu đủ, mặc định trùng bên phát hành (`ncc` + `nid_ncc`). Form có 2 ô cạnh nhau: Nhà cung cấp và Bên nhận tiền, dưới ô bên nhận là checkbox `Trùng bên phát hành` (mặc định bật: ô khoá và tự điền theo NCC; bỏ tick thì mở ra chọn, 3 nhóm Lái xe / Nhân viên / Nhà cung cấp, mỗi mục kèm số điện thoại nếu có). Nhóm Nhân viên bỏ các tài khoản lái xe (đã có nhóm Lái xe). Người tạo phiếu không nhất thiết là lái xe (admin hay người có quyền tạo đều tạo được).
- **Tiền là số nguyên đồng**, tính giống dòng chi phí kế hoạch và luôn tính lại ở server: `tong_truoc_vat = round(so_lit * don_gia)`, `tong_sau_vat = round(tong_truoc_vat * (1 + vat_percent / 100))`. `vat_percent` nhập tự do 0–100 (như chi phí), số lít tối đa 2 số lẻ. Tiền VAT hiển thị = sau − trước, không lưu cột.
- **Số công tơ mét** (`so_cong_to_met`, km) **không bắt buộc**, không kiểm tra so với lần đổ trước. Chỉ xem ở modal tạo/sửa và chi tiết, không có cột trong bảng.
- **Trạng thái lưu ở phiếu chỉ là phần trước thanh toán**: `cho_duyet`, `thu_hoi`, `da_duyet`, `tu_choi`, `huy`. Các trạng thái sau (`cho_duyet_tt`, `cho_tt`, `da_tt`) sẽ **lấy từ đề nghị thanh toán được gắn, không sao chép sang phiếu**; chỗ duy nhất quyết định trạng thái hiển thị là `_do_dau_display_status()`, các tab tương ứng đang trống cho tới khi nối.
- **Hành động hợp lệ** do `_do_dau_actions()` quyết định (một nguồn duy nhất, JS chỉ hiển thị `hanh_dong`): `thu-hoi`, `gui-duyet`, `huy`, `duyet`, `tu-choi` (bắt buộc lý do). Sửa chỉ khi `thu_hoi`/`tu_choi` và lưu xong là gửi duyệt lại (`cho_duyet`); xoá (mềm) chỉ khi `thu_hoi`/`tu_choi`/`huy`.
- **Quyền**: `do_dau_view_own`, `do_dau_view_all`, `do_dau_create` (tạo/sửa/gửi/thu hồi/huỷ, người tạo hoặc `_view_all`), `do_dau_approve` (duyệt/từ chối, tự xem được mọi phiếu), `do_dau_delete`. Người tạo không tự duyệt được phiếu chỉ vì có quyền tạo (cần `_approve`).
- **Giao diện `/theo-doi-do-dau`**: bộ lọc **1 dòng** (Từ khóa, Đầu kéo, Lái xe, Nhà cung cấp, Ngày đổ, Tìm/Reset) giống `/ke-hoach-xep-xe`, không khung viền, không nút chọn nhanh ngày; Đầu kéo/Lái xe/NCC ở bộ lọc **và trong modal** (kể cả ô Bên nhận tiền) dùng Select2 theo `SELECT2_PATTERN.md`; ô Ngày đổ là `daterangepicker` như ô Ngày kế hoạch của hàng cảng (mặc định **để trống**, không lọc ngày; Reset cũng xoá ngày). Modal tạo/sửa gọn (`gy-2`), **không có dòng chữ gợi ý** dưới ô Lái xe (chọn đầu kéo vẫn tự điền lái xe theo phân công); **Số hoá đơn không bắt buộc** (server chỉ giới hạn 50 ký tự). `do_dau.js` chọn bản jQuery có plugin (`pickJq()`) **lúc trang khởi tạo**, không dùng `jQuery` bắt lúc nạp file: trang có thể có nhiều bản jQuery và sự kiện của plugin (vd `change` của Select2) chỉ tới được handler gắn bằng đúng bản đó; cũng vì vậy `Drupal.settings` chỉ đọc lúc khởi tạo.
- **Đầu kéo** trong form loại rơ mooc và xe ngưng hoạt động; chọn đầu kéo sẽ **tự điền lái xe** đang được gán (`phuong_tien_lai_xe`), có thể chọn lại.
- **Luồng trạng thái (giống luồng của đề nghị thanh toán)**: `Chờ duyệt` →(**Duyệt**, `do_dau_approve`)→ `Chờ duyệt TT` →(**Duyệt TT**, `de_nghi_thanh_toan_approve_payment`)→ `Chờ thanh toán` (đề nghị thanh toán tự được tạo, ghi nhận thanh toán ở `/de-nghi-thanh-toan`) → `Đã thanh toán`. **Từ chối** ở Chờ duyệt (`do_dau_approve`) và ở Chờ duyệt TT (`tu-choi-tt`, `de_nghi_thanh_toan_approve_payment`) đều dùng chung hộp lý do bắt buộc `#dd-reject-modal`, phiếu về `Từ chối` kèm lý do, người tạo sửa rồi gửi duyệt lại từ đầu. **Trả lại** chỉ có ở màn đề nghị thanh toán (Chờ thanh toán, chưa trả đồng nào). **Không còn thu hồi sau khi duyệt thanh toán** (không có nút "Đề nghị TT" / "Thu hồi ĐNTT", quyền `do_dau_de_nghi_tt` đã bỏ). Ở màn phiếu, phiếu Chờ thanh toán / Đã thanh toán không có nút nào.
- **Trạng thái hiển thị của phiếu** (`_do_dau_display_status()`, nơi duy nhất): phiếu đã duyệt lưu `da_duyet` nhưng **không hiển thị "Đã duyệt"** — hiển thị `Chờ duyệt TT`; khi có đề nghị đang hoạt động thì lấy theo đề nghị (`Chờ thanh toán` / `Đã thanh toán`). Phiếu đang trong đề nghị bị khoá sửa/xoá. Lịch sử chi tiết phiếu gộp cả các bước của đề nghị. **1 phiếu = 1 đề nghị, không gom** (cần gom thì làm sau: `nid_de_nghi` cho phép nhiều phiếu trỏ về 1 đề nghị, nhưng đề nghị chỉ có 1 số hoá đơn / 1 bên nhận). Người có `do_dau_view_all`, `do_dau_approve`, `de_nghi_thanh_toan_approve_payment` hoặc `de_nghi_thanh_toan_pay` xem được mọi phiếu.
- **Double-click 1 dòng** trong danh sách: mở modal **Sửa** nếu `item.co_the_sua` (phiếu còn sửa được), không thì mở **Xem chi tiết**; bỏ qua khi double-click trúng nút/link/ô nhập trong dòng (`isRowInteractiveTarget()`). Cùng cơ chế loại trừ phần tử tương tác với double-click của `/ke-hoach-xep-xe` (`ke_hoach_xep_xe.js`, nguồn duy nhất có thao tác này trước đó), riêng phần chọn Sửa/Xem theo `co_the_sua` là spec riêng của `do_dau`.
- Nạp code lên: bật module `do_dau` (tự tạo bảng `do_dau`); chạy update database (`do_dau_update_7001` thêm 2 cột bên nhận tiền — phiếu cũ mặc định trùng bên phát hành — nếu bảng đã tạo từ trước; `de_nghi_thanh_toan_update_7001` thêm `loai_nguon`), gán quyền cho từng vai trò, mục menu "Theo dõi đổ dầu" ở sidebar theme.

## Tham số `select` cho API GET danh sách (module `api_common`)

Áp dụng cho `GET /api/khach-hang`, `/api/nhan-vien`, `/api/phuong-tien`, `/api/lai-xe`, `/api/danh-muc`. Kiểu Express/Mongoose: `?select=nid,ma_kh,ten` (chỉ các trường đó), `?select=-sdt,-email` (mọi trường trừ những trường đó), trộn `a,b,-c` thì trường có `-` thắng.

- **Không có `select` = như cũ hoàn toàn** (module không gọi `api_common`, giữ nguyên trần `limit` 100/500). Có `select` thì `limit` tối đa **100 mỗi lần gọi** cho mọi API (`API_SELECT_MAX_LIMIT`); cần nhiều hơn thì gọi tiếp `page=2, 3...` theo `total_pages` (không tăng trần). Lưu ý cũ: `limit=500` gửi lên khách hàng/lái xe/nhân viên trước đây vẫn chỉ nhận 100 dòng (trần cứng `min(100, ...)`) và client không tải thêm trang nên dropdown bị thiếu khi có hơn 100 bản ghi.
- Khoá chính (`nid`; nhân viên là `uid`) luôn được kèm, không loại được. Tên trường là tên trong JSON trả về (vd `ten`, không phải `ten_kh`), chỉ cấp một (không `a.b`). Trường lạ ⇒ 400 kèm danh sách trường hợp lệ. Thứ tự trường theo danh sách của module, không theo thứ tự gõ.
- **Danh sách trắng do từng module khai báo** (`_<module>_select_map()`: trường → cột SQL, `NULL` = trường tính thêm). Không bao giờ đưa chuỗi client vào SQL hay chọn cột theo tên client (bảng `users` có `pass`, `init`). Khách hàng: bảng giá cước / ngân hàng chỉ có ở API chi tiết nên không nằm trong danh sách.
- **Chỗ giảm việc thật là bỏ phần tính thêm khi không chọn**: `khach_hang` không `SELECT *` lại từng dòng và gom nhân viên kinh doanh 1 truy vấn (`nv_kinh_doanh`); `nhan_vien` gom `phong_ban`/`chuc_vu`/`role` mỗi thứ 1 truy vấn; `phuong_tien` chỉ join lái xe khi chọn `lai_xe`, chỉ giải mã JSON khi chọn `files`/`thong_tin_json`; `lai_xe` chỉ tra bảng `users` khi chọn `tai_khoan_app` (1 truy vấn cho cả trang).
- Module chưa bật `api_common` thì `select` **bị bỏ qua** (trả như cũ, trần `limit` cũ) chứ không báo lỗi, để đưa JS lên trước khi bật module không làm hỏng màn hình. Nạp code lên: bật module `api_common` (không có bảng, không cần update database). Áp dụng cả cho `danh_muc` (`nid,ten,phan_loai,thong_tin_json,thong_tin,...`).

### Màn danh mục (khách hàng, nhân viên, lái xe, phương tiện, danh mục): danh sách nhẹ, chi tiết khi cần

- **Danh sách** (`GET /api/<entity>?page=...`) luôn kèm `select=` chỉ gồm **cột đang hiển thị** (kể cả trường tính thêm mà cột cần, vd `tai_khoan_app` ở lái xe, `lai_xe` ở phương tiện, `thong_tin` phụ phí ở danh mục, `phong_ban/chuc_vu/role` ở nhân viên). **Xem/Sửa** mở modal ngay với vòng chờ rồi gọi `GET /api/<entity>/{id}` lấy đủ dữ liệu (không dùng lại dòng của danh sách). Thêm cột mới vào bảng danh sách thì thêm vào `select` của màn đó.
- **Màn theo dõi hạn** phương tiện (`phuong_tien_han.js`) chỉ lấy `nid,bks,ma_tai_san,loai_phuong_tien` + số/hạn của đúng loại giấy tờ đang xem, cache `sessionStorage` theo từng loại (`phuong_tien_han_<loại>_v2`, 10 phút).
- **Ô chọn (dropdown) ở mọi màn** dùng danh sách khách hàng / nhân viên / lái xe / phương tiện / danh mục: gọi có `select` chỉ các trường dựng ô chọn và **tải đủ các trang** (mỗi lần `limit=100`, trang 1 lấy `total_pages` rồi các trang còn lại song song, tối đa 50 trang; hàm `fetchAllPages()` chép trong từng file JS vì mỗi module độc lập). **Không dùng `limit` lớn** (`limit=500/1000` bị server chặn ở 100/500 và có `select` thì trần là 100, dữ liệu bị cắt mà không báo lỗi). Màn hàng cảng/tuyến xa dùng endpoint gộp `/api/ke-hoach-xep-xe/tuy-chon` (xem bên dưới). Màn khách hàng không còn tải danh mục Kho (mục "Địa chỉ kho & Bảng giá" đang ẩn); NV kinh doanh chỉ lấy `uid,ten,name,ma_nhan_vien`.

### Dữ liệu danh mục dùng chung của màn hàng cảng (`ke_hoach_hang_cang_master.js`)

Bộ lọc danh sách `/ke-hoach-xep-xe`, modal xếp xe/tạo kế hoạch, modal phiếu trả khách hàng, danh sách cont (`ke_hoach_cont_page_list`) và màn `/cat-mooc` cùng lấy **khách hàng, lái xe, phương tiện, danh mục Kho/Bãi/Cảng/Loại hàng** từ `Drupal.keHoachHangCangMaster` thay vì mỗi nơi tự gọi 4 API (limit 500, nguyên bản ghi) như trước.

- **Ưu tiên endpoint gộp `GET /api/ke-hoach-xep-xe/tuy-chon`** (`ke_hoach_xep_xe_rest_options()`): 1 request trả cả `customers`, `drivers`, `vehicles`, `dia_diem` (`kho/bai/cang/loaiHang/chiPhi`) — mỗi loại 1 câu SQL cố định, chỉ cột màn hình dùng, không phân trang, không truy vấn theo dòng (mẫu như `do-dau/tuy-chon`), giữ đúng giá trị/thứ tự của các API riêng (khách hàng, xe nid giảm dần; lái xe nid tăng dần; xe kèm `lai_xe` = lái xe gán mới nhất, kể cả lái xe đã nghỉ; tên danh mục giữ nguyên không trim). Quyền: cần `ke_hoach_xep_xe_view`; khách hàng cần thêm `khach_hang_view`, phương tiện cần `phuong_tien_view` — thiếu thì loại đó rỗng + nằm trong `denied` và client gọi API riêng như trước (nhận 401 như cũ). Mỗi loại tối đa `KE_HOACH_XEP_XE_OPTIONS_MAX` (5000) dòng; vượt trần thì nằm trong `truncated` và client tải loại đó theo trang. Client tự chuyển sang đường cũ (gọi riêng + phân trang) nếu endpoint lỗi/chưa có, và không thử lại endpoint gộp trong trang đó. **Thêm trường mới cho các màn này thì thêm ở endpoint gộp VÀ ở `SOURCES` của master (đường dự phòng).** Đường riêng: mỗi nguồn tải **1 lần**: gọi có `select` gọn (`khach-hang: nid,ma_kh,ten`; `lai-xe: nid,ten,ma_nhan_vien,sdt`; `phuong-tien: nid,bks,ma_tai_san,loai_phuong_tien,hang_xe,nam_san_xuat,lai_xe`; `danh-muc: nid,ten,phan_loai`), **100 dòng/lần**, trang 1 lấy `total_pages` rồi các trang còn lại gọi song song (tối đa 50 trang). Nhiều nơi gọi cùng lúc dùng chung 1 request; nguồn nào lỗi thì `load()` reject nhưng phần đã có vẫn dùng được và lần gọi sau thử lại.
- Cache `sessionStorage` (khoá `khxh_hang_cang_master_v1`) chỉ giữ các trường gọn ở trên, hạn **10 phút**; **F5 luôn tải mới**. Khách hàng/danh mục thêm nhanh trong modal ghi vào cùng mảng dùng chung rồi gọi `persist()` (`addCustomerToState`, `addDiaDiemToState`). Khách hàng/xe/lái xe tạo ở màn khác chỉ thấy sau khi hết hạn cache hoặc F5.
- **Thêm trường mới cần dùng ở các màn trên thì thêm vào `SOURCES` trong file này** (đối chiếu chỗ dùng trong `ke_hoach_xep_xe.js` / `ke_hoach_cat_mooc.js`), nếu không sẽ thiếu trường vì đã bỏ phần còn lại.
- **Tab Chi phí trong modal xếp xe không gọi lại những gì đã có**: danh mục (Chi phí/Kho/Bãi/Cảng) lấy từ nguồn dùng chung này (`diaDiem.chiPhi/kho/bai/cang`, tuyến xa không có file nên tự tải như cũ; tạo danh mục mới trong tab thì `invalidate('diaDiem')`); danh sách chi phí của kế hoạch do modal gọi sẵn lúc mở (tính tổng ở cột bên, `prefetchRows()`) được tab dùng lại **1 lần trong 60 giây** (lưu/xoá/tải lại luôn gọi mới); chi phí mẫu và định mức khoán (`/api/ke-hoach-chi-phi-mau`, `/api/dinh-muc-khoan/tuyen`) giữ trong bộ nhớ trang 5 phút (F5 tải mới; sửa định mức ở màn khác chỉ thấy sau 5 phút/F5); `GET /api/de-nghi-thanh-toan/tuy-chon` gọi **1 lần cho cả trang** (10 phút) không kèm `nid_lai_xe` — "lái xe của chuyến" suy ra từ `lai_xe_ds` (có thêm `uid` tài khoản) và tài khoản lái xe chuyến này được thêm vào nhóm Nhân viên ở phía client. **Bấm "Lưu xếp xe" (hàng cảng)**: tổng chi phí cột bên (`loadPortCostSummary`) chỉ tính 1 lần mỗi lần mở modal (`portCostSummaryLoadedFor`; sau khi lưu tab Chi phí tự cập nhật qua sự kiện `khcp:summary-changed`), danh sách kế hoạch phía sau **không tải lại ngay** mà 1 lần khi modal đóng (`listReloadAfterModal`, xử lý ở `hidden.bs.modal.khxhTouched`; tuyến xa vẫn tải ngay như cũ); `POST /api/ke-hoach-chi-phi/bulk` (client gửi thêm `nid_ke_hoach`) **trả luôn `data.rows`** = danh sách chi phí mới nhất của kế hoạch (cùng dạng/thứ tự `GET /api/ke-hoach-chi-phi`, `_ke_hoach_chi_phi_plan_items()`, chỉ khi có quyền xem) nên tab dùng luôn (`applyRows`) thay vì gọi `GET` tải lại; thiếu `rows` thì client tự tải như cũ. `PUT /api/ke-hoach-xep-xe/{id}/dinh-muc` (định mức khoán, lưu ở `thong_tin_json.dinh_muc_khoan_lai_xe`, tách khỏi `PUT /api/ke-hoach-xep-xe/{id}` vì kế hoạch chỉ merge JSON chứ không ghi định mức) **chỉ gọi khi bảng định mức đã đổi** so với bản đang lưu (`state.dinhMucSavedSig` trong `persistPortDinhMucRows()`; tuyến xa giữ nguyên) và gọi với `?response=min` nên server chỉ trả `{nid, dinh_muc_khoan_lai_xe}` (không dựng lại cả kế hoạch cùng kế hoạch/cont liên quan như `enrich_row`), client ghép vào `state.plan.thong_tin_json`. Thông tin kế hoạch (`/api/ke-hoach-xep-xe/{id}?context=chi_phi`, `related_mode=summary`) vẫn gọi vì khác dữ liệu chi tiết của modal. Thông tin kế hoạch và định mức tải song song.
- **Nút "Lưu xếp xe" (hàng cảng, đang SỬA kế hoạch đã có, tab Chi phí đã mở nhúng) chỉ gọi API của phần thực sự có sửa**, tránh gọi thừa `PUT` kế hoạch/`POST` bulk chi phí và tránh phần này vô tình lưu đè lúc chỉ định sửa phần kia: `hangCangPlanDirty` (thay đổi ngoài `.khxh-hang-cang-cost-mount`) và `hangCangCostMountDirty` (thay đổi trong đó) — 2 cờ tách riêng từ **cùng những sự kiện** đang set `hangCangEditDirty` (`markHangCangSectionDirty()` xác định theo vị trí DOM thật của sự kiện, không theo tên class vì `.btn-add-row`/`.btn-delete-row` dùng chung cho cả 2 nơi), reset cùng lúc với `hangCangEditDirty` trong `resetHangCangEditDirty()`. Chỉ sửa thông tin xếp xe ⇒ chỉ `PUT` kế hoạch; chỉ sửa chi phí ⇒ chỉ `Drupal.keHoachChiPhi.savePortTab()` (bỏ qua `reportPortCreateRequiredValidity()`/`validateForm()`/`PUT`); sửa cả hai ⇒ như cũ. **Bấm Lưu mà không sửa gì** (cả 2 cờ đều `false`) ⇒ coi như nút **Tải lại**, nhưng **chỉ tải lại đúng tab đang mở** (xác định bằng DOM thật — `$form('[data-khxh-port-tab].is-active')`, không phải biến JS vì `initHangCangEditCostTabs()` là closure riêng của `initForm()`): đang ở tab Chi phí ⇒ chỉ `Drupal.keHoachChiPhi.api.reload()` (chỉ tải lại danh sách dòng chi phí — **không** tải lại định mức khoán/doanh thu/nhật ký dầu, các phần đó chỉ nạp khi mở tab lần đầu); đang ở tab Thông tin xếp xe ⇒ chỉ `GET /api/ke-hoach-xep-xe/{id}` + `populateEdit()`. Không gọi API lưu nào, không đụng tab còn lại. Tạo mới (chưa có `nid`) hoặc tuyến xa (chi phí là modal riêng, không nhúng ở đây, `hasEmbeddedCost` luôn `false`) giữ nguyên luồng cũ — luôn lưu kế hoạch, không có nhánh tải lại. Cơ chế này chỉ tránh gọi thừa API của **chính phiên đang sửa**, không phải khoá/phát hiện xung đột khi 2 người cùng sửa 1 kế hoạch (Drupal không khoá bản ghi; ai lưu sau vẫn ghi đè).
- **Chỉ hàng cảng**: `ke_hoach_xep_xe.js` chuyển sang nguồn này qua `hangCangMaster()` (trả NULL với tuyến xa hoặc trang chưa nạp file) — tuyến xa vẫn dùng đường tải riêng cũ (`loadListSearchDropdowns`/`loadDropdowns` nhánh cũ, `getFormDropdownCache`). File được nạp bởi `_ke_hoach_hang_cang_add_master_assets()` ở màn hàng cảng, danh sách cont, `/cat-mooc`, trang sửa kế hoạch hàng cảng. Tab Chi phí (`ke_hoach_chi_phi.js`, dùng chung 2 màn) chỉ đổi `loadDanhMuc()` sang `select=nid,ten,phan_loai` 100 dòng/lần + tải các trang còn lại.

### Dữ liệu danh mục dùng chung của màn tuyến xa (`ke_hoach_tuyen_xa_master.js`)

Bản **riêng** của tuyến xa (không dùng chung với hàng cảng): namespace `Drupal.keHoachTuyenXaMaster`, khoá `sessionStorage` `khxh_tuyen_xa_master_v1`, cùng cách làm/cùng nguồn (`SOURCES`) như `ke_hoach_hang_cang_master.js`; 2 file được phép lệch nhau khi 2 màn cần trường khác. Nạp bởi `_ke_hoach_tuyen_xa_add_master_assets()` ở `/ke-hoach-tuyen-xa` và trang sửa kế hoạch tuyến xa. Trong `ke_hoach_xep_xe.js`, `planMaster()` = `hangCangMaster() || tuyenXaMaster()` chọn nguồn theo màn (NULL → đường tải riêng cũ); dùng cho bộ lọc danh sách, modal xếp xe/tạo, modal phiếu trả khách hàng. `ke_hoach_chi_phi.js` (modal Chi phí tuyến xa) lấy danh mục Chi phí/Kho/Bãi/Cảng từ nguồn nào đang có trên trang.

- Modal Chi phí **tuyến xa**: `PUT /api/quan-ly-cont/{id}?response=min` (định mức khoán + hình thức tính lương) chỉ trả `{nid, dinh_muc_khoan_lai_xe, hinh_thuc_tinh_luong_lai_xe}` và **chỉ gọi khi bảng định mức hoặc hình thức tính lương đã đổi** (`persistTuyenXaDinhMucRows()`, so với `state.dinhMucSavedSig` + `state.driverPayModeSaved`); `POST /api/ke-hoach-tuyen-xa-dau` (nhật ký dầu, ghi đè cả danh sách) chỉ gọi khi nhật ký đã đổi (`state.oilSavedSig`). `POST /api/ke-hoach-chi-phi/bulk` trả `rows` như hàng cảng (`saveAllRows` dùng chung) nên không gọi `GET` tải lại.
- Bấm "Lưu" ở modal xếp xe tuyến xa: `PUT /api/ke-hoach-xep-xe/{id}` đã trả đủ dữ liệu kế hoạch (`enrich_row`) và client dùng luôn (`populateEdit(res.data)`), không gọi `GET` chi tiết. Danh sách phía sau **không tải lại ngay** mà 1 lần khi modal đóng (`tuyenXaListReloadAfterModal`, handler `khxhTuyenXaReload`), tách riêng khỏi `listReloadAfterModal` của hàng cảng (handler đó còn làm nổi bật dòng vừa sửa).

## TODO

- Migrate các module cũ (danh_muc, ben_thu_ba, ...) sang schema + RESTful + hybrid.
- Xử lý module required login để whitelist API paths.

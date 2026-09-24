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
- **`user_access()` mặc định chỉ nhìn phiên đăng nhập trình duyệt (session), không tự đọc header `Authorization`.** Gọi API bằng Bearer token (Postman, app ngoài) mà không có phiên đăng nhập thì Drupal luôn coi là **Anonymous**, bất kể token đó ứng với tài khoản/vai trò nào — nếu chỉ gọi `user_access('quyen')` trơn, bật/tắt quyền theo vai trò sẽ **không có tác dụng** với các request kiểu này.
- **Mẫu chuẩn để phân quyền đúng cho cả web lẫn API bằng token** (đã áp dụng cho `phuong_tien`, `dinh_muc_khoan` — module mới nên copy đúng mẫu này):
  ```php
  function _module_current_account() {
    global $user;
    if (!empty($user->uid)) return $user; // web: có phiên đăng nhập, dùng luôn
    $auth = _module_require_auth();       // không có phiên: thử Bearer token/?token=
    return is_array($auth) ? NULL : $auth;
  }
  // Dùng ở mọi API cần phân quyền:
  user_access('module_view', _module_current_account());
  ```
  `_module_require_auth()` đọc header `Authorization: Bearer` (hoặc `?token=`), gọi `api_validate_token()`, trả về user object hoặc mảng lỗi `{status: fail, message: ...}`. Không bắt buộc phải có token — không có cả phiên lẫn token thì `_module_current_account()` trả `NULL`, `user_access()` tự hiểu là Anonymous như bình thường.
- Route API `access callback => TRUE` như cũ; việc phân quyền luôn nằm trong callback qua `user_access($quyen, _module_current_account())`, không phải ở `hook_menu()`.

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

- **1 đề nghị = 1 hoá đơn của 1 bên phát hành** (`nid_ncc`, là `khach_hang` có phân loại Nhà cung cấp). Bên nhận tiền lưu riêng `loai_ben_nhan_tien` (`ncc`|`nhan_vien`) + `id_ben_nhan_tien` (nid khach_hang | uid), luôn lưu đủ, mặc định trùng bên phát hành. **Bên phát hành do người tạo chọn trong modal tạo đề nghị (bắt buộc, gửi `nid_ncc`)**, không phụ thuộc NCC của từng dòng chi phí: dòng chưa có NCC hoặc khác NCC nhau vẫn gom được vào 1 đề nghị (modal gợi ý sẵn khi mọi dòng cùng 1 NCC). Chỉ dòng KH/CT gom được; LX (lái xe tự chịu) không tham gia. Thêm vào đề nghị nháp có sẵn thì bên phát hành lấy theo đề nghị đó.
- **Mã đề nghị** `DNTT-yymmdd-NNNN` (vd `DNTT-260924-0005`): NNNN tăng dần theo **ngày tạo**, sang ngày mới về 0001; đề nghị đã xoá mềm vẫn giữ số (`_de_nghi_thanh_toan_next_code()`). Mã cũ dạng `DNTT-NNNN` giữ nguyên, không đổi.
- **Tổng tiền không lưu cột**: tính động từ các dòng chi phí (`_de_nghi_thanh_toan_aggregates()`), đã trả = tổng bảng `de_nghi_thanh_toan_thanh_toan`. Dòng chi phí trỏ về đề nghị bằng `ke_hoach_chi_phi.nid_de_nghi_chi_phi`; `trang_thai_duyet` mirror trạng thái đề nghị (chỉ `_de_nghi_thanh_toan_set_status()` ghi).
- **Trạng thái**: `nhap → cho_duyet → cho_duyet_thanh_toan → cho_thanh_toan → hoan_thanh`, cộng `tu_choi`/`tu_choi_thanh_toan` (từ chối thì sửa rồi gửi lại, không có trạng thái huỷ). Quyền: `_create` (tạo/sửa/gửi/thu hồi, người tạo hoặc `_view_all`), `_approve`, `_approve_payment`, `_pay`, `_delete` (chỉ nháp), `_view_own`/`_view_all`.
- **Một nguồn duy nhất** cho hành động hợp lệ: `_de_nghi_thanh_toan_actions()`; giao diện chỉ hiện `hanh_dong` do server trả về, endpoint `POST /api/de-nghi-thanh-toan/{id}/{hanh-dong}` kiểm tra lại bằng đúng hàm này.
- API: `GET/POST /api/de-nghi-thanh-toan` (POST = tạo từ `chi_phi_ids`, hoặc thêm vào đề nghị nháp bằng `nid_de_nghi`), `GET/PUT/DELETE /api/de-nghi-thanh-toan/{id}`, `GET /api/de-nghi-thanh-toan/tuy-chon` (NCC, nhân viên, hình thức, quỹ, lái xe của chuyến), hành động: `gui-duyet`, `thu-hoi`, `duyet`, `tu-choi`, `duyet-thanh-toan`, `tu-choi-thanh-toan`, `thanh-toan`, `rut-dong`.
- **Thanh toán**: mỗi đợt chọn hình thức (`CK`/`TM`) + quỹ đúng loại (`ngan_hang`/`tien_mat`, từ `quan_ly_tai_chinh`). Hiện **chỉ lưu `nid_quy`**, chưa tạo giao dịch chi/trừ số dư quỹ (`ke_hoach_chi_phi.nid_ledger` dành cho bước sau).
- **Chi phí kế hoạch (hàng cảng)**: `ke_hoach_chi_phi` thêm `nid_ncc` (người dùng chọn) và `nid_khach_hang` (server tự điền theo khách hàng của kế hoạch khi dòng là KH). `trang_thai_duyet`/`nid_de_nghi_chi_phi`/`nid_ledger` không nhận từ client. Dòng thuộc đề nghị đã nộp duyệt (`cho_duyet`…`hoan_thanh`) bị **khoá sửa/xoá** ở server (web, bulk, mobile); dòng thuộc đề nghị nháp/từ chối không được chuyển sang LX/xoá (phải rút khỏi đề nghị trước; NCC của dòng vẫn sửa được vì bên phát hành do đề nghị giữ); kế hoạch có dòng đang thuộc đề nghị không xoá được.
- **Nguồn đổ dầu** (`de_nghi_thanh_toan.loai_nguon` = `do_dau`, mặc định `chi_phi`): đề nghị của **1 phiếu đổ dầu** (module `do_dau`, `do_dau.nid_de_nghi` trỏ về đề nghị; 1 phiếu = 1 đề nghị). **Không tạo từ màn đề nghị** mà **tự tạo khi phiếu được "Duyệt TT" ở màn phiếu** (`de_nghi_thanh_toan_create_from_do_dau()`): đề nghị **vào thẳng `cho_thanh_toan`** (duyệt phiếu và duyệt thanh toán đã làm ở phiếu). Người tạo đề nghị = người tạo phiếu, `uid_nguoi_duyet` = người duyệt phiếu, `uid_nguoi_duyet_tt` = người bấm Duyệt TT; bên phát hành / bên nhận tiền / số hoá đơn / ngày hoá đơn lấy theo phiếu. Đề nghị đổ dầu **không có** nháp/gửi duyệt/duyệt bước 1, **không sửa/xoá/rút dòng**; ở màn đề nghị chỉ **Ghi nhận TT** và **Trả lại** (kế toán, khi chưa trả đồng nào). Trả lại ⇒ đề nghị bị huỷ (xoá mềm, giữ mã) và phiếu quay về `tu_choi` kèm lý do (`do_dau_on_de_nghi_rejected()`). Đề nghị còn `cho_duyet_thanh_toan` (tạo từ luồng cũ) vẫn xử lý được: Duyệt TT / Từ chối ngay ở màn phiếu (`de_nghi_thanh_toan_approve_payment_do_dau()`, `de_nghi_thanh_toan_reject_do_dau()`). Tổng tiền tính động từ phiếu (`_de_nghi_thanh_toan_aggregates()`), chi tiết trả phiếu dưới dạng "dòng" (`loai_chi_phi = do_dau`) + `phieu_do_dau`. Bên nhận tiền có thêm loại `lai_xe` (id = `lai_xe.nid`, lái xe chưa có tài khoản vẫn được) — chỉ đề nghị đổ dầu dùng, đề nghị chi phí vẫn chỉ `ncc`/`nhan_vien`. API danh sách có thêm lọc `loai_nguon`.
- **Giao diện tab Chi phí hàng cảng** là phần mở rộng tách riêng: `ke_hoach_chi_phi.js` chỉ có điểm mở rộng `Drupal.keHoachChiPhi.extension` (không rẽ nhánh theo loại kế hoạch); `ke_hoach_chi_phi_dntt.js` + `.css` đăng ký extension và chỉ được nạp ở màn hàng cảng (`_ke_hoach_hang_cang_add_dntt_assets()`), khi module đang bật và người dùng có quyền xem đề nghị. Tuyến xa không nạp file này nên giữ nguyên.
- Nạp code lên: chạy update database (`ke_hoach_xep_xe_update_7027` thêm 2 cột), bật module `de_nghi_thanh_toan` (tạo 2 bảng), gán quyền cho từng vai trò, mục menu "Đề nghị thanh toán" ở sidebar theme.

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
- Nạp code lên: bật module `do_dau` (tự tạo bảng `do_dau`); chạy update database (`do_dau_update_7001` thêm 2 cột bên nhận tiền — phiếu cũ mặc định trùng bên phát hành — nếu bảng đã tạo từ trước; `de_nghi_thanh_toan_update_7001` thêm `loai_nguon`), gán quyền cho từng vai trò, mục menu "Theo dõi đổ dầu" ở sidebar theme.

## TODO

- Migrate các module cũ (danh_muc, ben_thu_ba, ...) sang schema + RESTful + hybrid.
- Xử lý module required login để whitelist API paths.

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
│   ├── cau_hinh_gia_ban/          # Module cấu hình giá bán (bảng giá)
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
- Module `user_login_api` có hàm `api_validate_token($token)` trả về user object.
- Phân quyền qua `user_access()` với các permission đã define trong `hook_permission()`.

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

## TODO

- Migrate các module cũ (danh_muc, ben_thu_ba, ...) sang schema + RESTful + hybrid.
- Xử lý module required login để whitelist API paths.

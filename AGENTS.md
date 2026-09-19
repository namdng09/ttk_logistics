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

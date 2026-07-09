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

### UI pages — hook_menu

```
UI List:  /<entity>               → danh sách
UI Tạo:   /<entity>/them-moi      → form thêm
UI Sửa:   /<entity>/{id}          → form sửa
```

```php
$items['<entity>'] = array(
  'title' => 'Danh sách',
  'page callback' => 'module_page_list',
  'access callback' => 'user_is_logged_in',
  'type' => MENU_NORMAL_ITEM,
);
$items['<entity>/them-moi'] = array(
  'title' => 'Thêm',
  'page callback' => 'module_page_form',
  'access arguments' => array('module_create'),
  'type' => MENU_CALLBACK,
);
$items['<entity>/%'] = array(
  'title' => 'Chi tiết',
  'page callback' => 'module_page_form',
  'page arguments' => array(1),
  'access callback' => 'user_is_logged_in',
  'type' => MENU_CALLBACK,
);
```

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
    'module_form_page' => array(
      'template' => 'module-form',
      'path' => $path,
      'variables' => array('id' => NULL),
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
// Success
{ "success": true, "data": { ... } }

// List
{ "success": true, "data": [...], "total": N, "page": 1, "pages": 1 }

// Error
{ "success": false, "message": "..." }
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

### Môi trường

- **Code:** `/home/namdng09/work/ttk_logistics/` (git repo)
- **Production:** `/public_html/sites/all/modules/` (deploy từ workspace)

## Cấu trúc file module mới

```
modules/<name>/
├── <name>.info             # core=7.x, package=Logistics
├── <name>.module           # hook_menu, hook_permission, hook_theme, API, UI
├── <name>.install          # hook_schema
├── templates/              # .tpl.php (layout rỗng, JS fill data)
│   ├── <name>-list.tpl.php
│   └── <name>-form.tpl.php
└── assets/
    ├── css/<name>.css
    └── js/<name>.js        # AJAX CRUD
```

## TODO

- Migrate các module cũ (danh_muc, ben_thu_ba, lai_xe, ...) sang schema + RESTful + hybrid.
- Xử lý module required login để whitelist API paths.

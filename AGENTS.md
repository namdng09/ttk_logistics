# Dự án TTK Logistics

## Công nghệ

- **Drupal 7** (module + theme)
- **Vuexy Bootstrap HTML Admin Template** (giao diện, lấy từ `html-version/Bootstrap5/vuexy-bootstrap-html-admin-template/`)

## Cấu trúc repo

```
/
├── modules/                     # Drupal modules (flat, không api/ con)
│   ├── crm_dntt/                # Module đề nghị thanh toán (base pattern)
│   │   ├── crm_dntt.info        # Khai báo module Drupal
│   │   ├── crm_dntt.module      # hook_menu, hook_entity_info, hook_permission, hook_theme, page callbacks
│   │   ├── crm_dntt.install     # hook_schema (custom tables, không content type)
│   │   ├── crm_dntt.test        # Chỉ tạo khi yêu cầu
│   │   ├── templates/           # .tpl.php cho Drupal views
│   │   │   ├── crm-dntt-form.tpl.php
│   │   │   └── crm-dntt-list.tpl.php
│   │   └── assets/              # CSS/JS riêng cho module
│   │       ├── css/
│   │       └── js/
│   │
│   ├── danh_muc/                # (sẽ migrate dần theo pattern crm_dntt)
│   ├── ben_thu_ba/
│   ├── phuong_tien/
│   ├── lai_xe/
│   ├── hop_dong/
│   ├── ben_thu_ba_api/
│   └── user_login_api/
│
├── themes/                      # Drupal theme
│   └── edusoul/                 # Theme chính, dùng Vuexy assets
│       ├── edusoul.info         # Khai báo theme
│       ├── template.php         # Preprocess, assets management
│       ├── html.tpl.php
│       ├── page.tpl.php
│       ├── page--front.tpl.php
│       ├── page--user--login.tpl.php
│       ├── template/            # Block templates v.v.
│       │   └── quan-ly/
│       └── quan-ly/             # Vuexy admin assets
│           └── assets/
│
├── html-version/                # HTML template mẫu (Vuexy) để chuyển thành .tpl.php
│   └── Bootstrap5/
│       └── vuexy-bootstrap-html-admin-template/
│
└── api/                         # (cũ) Module cũ dùng content type + controller/service/helpers
    └── ...                      # Sẽ migrate dần sang modules/
```

## Module pattern mới (follow crm_dntt)

### Yêu cầu

- **Entity API module** (`entity` contrib) — bắt buộc để dùng `hook_entity_info()`, `EntityAPIController`.

### hook_schema (thay content type)

- Dùng `hook_schema()` trong `.install` để tạo custom DB table — **không dùng Content Type + Field**.
- Dùng Entity API (`hook_entity_info()`, `EntityAPIController`) cho CRUD.

### hook_permission

- Define permission đầy đủ trong `hook_permission()`.
- Route endpoint API dùng `'access arguments' => array('permission_name')`.
- Route UI page dùng `'access callback' => 'user_is_logged_in'`.

### hook_menu

- Route API: prefix `api/<entity>/` (vd: `api/dntt/save`, `api/dntt/list`).
- Route UI: prefix `quan-ly/<entity>/` (vd: `quan-ly/dntt`, `quan-ly/dntt/them-moi`).
- Endpoint API dùng `'delivery callback' => 'drupal_json_output'`.

### hook_theme + .tpl.php

- Định nghĩa trong `hook_theme()`:
  ```php
  function module_theme() {
    $path = drupal_get_path('module', 'module_name') . '/templates';
    return array(
      'module_page' => array(
        'template' => 'module-page',   // file module-page.tpl.php
        'path' => $path,
        'variables' => array('var_name' => NULL),
      ),
    );
  }
  ```
- Lấy HTML mẫu từ `html-version/`, viết lại thành `.tpl.php` trong `templates/` của module.
- Module load CSS/JS riêng trong page callback bằng `drupal_add_css()` / `drupal_add_js()`.

### assets

- Mỗi module có `assets/css/` và `assets/js/` riêng.
- Module tự load assets của mình trong page/API callback.

### Môi trường

- **Code:** `/home/namdng09/work/ttk_logistics/` (git repo)
- **Production:** `/public_html/sites/all/modules/` (deploy từ workspace)

## Cấu trúc file module mới

```
modules/<name>/
├── <name>.info             # Drupal module info
├── <name>.module           # hook_menu, hook_entity_info, hook_permission, hook_theme, page callbacks
├── <name>.install          # hook_schema (định nghĩa bảng)
├── README.md               # Tổng hợp nội dung module
├── templates/              # .tpl.php cho Drupal theme
│   └── <name>-<page>.tpl.php
└── assets/                 # CSS/JS riêng
    ├── css/
    └── js/
```

## Quy tắc chung

### Response format (API)

```json
{ "success": true|false, "message": "...", "data": { ... } }
```

- List response: `{ "success": true, "data": [...], "total": N, "page": 1, "pages": 1 }`

### Auth

- Module tự xử lý auth (login → token → validate).
- `hook_permission()` + `user_access()` cho phân quyền.

### Transaction

- Dùng `db_transaction()` cho các operation có nhiều bước.
- Rollback + `watchdog()` khi catch Exception.

### No content type

- Dữ liệu lưu trong custom table (schema), không dùng node/field_data.
- Không xem được qua Drupal Content UI — test qua API hoặc SQL.

## TODO

- Migrate các module cũ (danh_muc, ben_thu_ba, phuong_tien, ...) sang schema pattern.
- Tạo module mới theo pattern crm_dntt.

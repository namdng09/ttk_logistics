# Dự án TTK Logistics

## Công nghệ

- **Flutter Web** (app mobile/web)
- **Drupal 7** (backend API)

## Cấu trúc repo

```
/
├── api/                    # Drupal module REST API (PHP)
│   ├── danh_muc/           # Module CRUD cho content type danh_muc
│   └── ben_thu_ba/         # Module CRUD cho content type ben_thu_ba
│       ├── danh_muc.info           # Khai báo module Drupal
│       ├── danh_muc.module         # hook_menu() routing
│       ├── danh_muc.controller.inc # Xử lý request, parse params, gọi service
│       ├── danh_muc.service.inc    # Business logic CRUD
│       └── danh_muc.helpers.inc    # Helpers chung (query, response, auth)
├── lib/                    # Flutter source code
├── assets/                 # Flutter assets
├── web/                    # Flutter web entry point
└── pubspec.yaml            # Flutter project config
```

## Quy tắc code API (Drupal 7)

### Routing (hook_menu)

- `danh-muc` — collection endpoint (GET list, POST create)
- `danh-muc/%` — item endpoint (GET detail, PUT update, DELETE soft-delete)
- Drupal ở subdirectory → URL đầy đủ: `https://site.com/api/danh-muc`
- Method dispatch trong callback controller, không dùng nhiều menu item.

### CORS

- `hook_init()` bắt request tới endpoint, thêm CORS headers, xử lý OPTIONS preflight.

### Auth

- `danh_muc_require_auth($params)` kiểm tra `created_email` + `token` trong params.
- Flutter gửi auth qua Cloudflare Worker dạng `{ url, method, params: { created_email, token, ... } }`.
- Server dùng `api_check_token($token, $email)` từ module `user_login_api`.
- **TODO:** Xây dựng auth riêng (login → token → validate).

### READ: db_select

- GET list và GET detail dùng `db_select` (JOIN field_data tables) cho tốc độ.
- Không JOIN field_data nếu không cần filter/sort trên field đó.

### WRITE: node_save

- POST create, PUT update, DELETE soft-delete dùng `node_save()`.
- Soft-delete: set `field_hoat_dong = 0`, không xoá thật.
- Luôn log `watchdog()` sau mỗi lần save thành công và cả khi catch Exception.

### Content type: danh_muc

| Field | Machine name | Type | Ghi chú |
|-------|-------------|------|---------|
| Title | title | node title | |
| Thông tin json | field_thong_tin_json | Long text | JSON linh hoạt, xem ghi chú bên dưới |
| Hoạt động | field_hoat_dong | Boolean | 1 = active, 0 = inactive |
| Số lượng | field_so_luong | Float | |

### Content type: ben_thu_ba

| Field | Machine name | Type | Ghi chú |
|-------|-------------|------|---------|
| Title | title | node title | |
| Thông tin json | field_thong_tin_json | Long text | JSON linh hoạt |
| Hoạt động | field_hoat_dong | Boolean | 1 = active, 0 = inactive |
| Phân loại | field_phan_loai | Text | NVKD, CSHT, ... |
| Ngày sinh | field_dob | Integer | Unix timestamp |

- List query mặc định chỉ lấy item có `field_hoat_dong = 1` (trừ khi `include_inactive=true`).

### field_thong_tin_json (JSON linh hoạt)

- Dùng để chứa mọi thông tin mở rộng dạng JSON, không cần tạo field Drupal mới.
- **Lưu:** Drupal lưu dưới dạng **string** trong text field.
- **Đọc (API → Flutter):** decode JSON string → trả về object `{}`.
- **Ghi (Flutter → API):** chấp nhận cả object (khuyến khích) lẫn string có sẵn. API tự động encode về string trước khi lưu.
- Tương thích ngược với dữ liệu cũ.

### Quy tắc đặt tên key trong response

- Dùng **machine name** (không dấu, không khoảng trắng, không tiếng Việt).
- Field Drupal: giữ nguyên tên máy (vd: `field_thong_tin_json`, `field_hoat_dong`, `field_so_luong`).
- Key trong `field_thong_tin_json`: dùng tên ngắn gọn, không dấu (vd: `phan_loai`, `ten_kho`, `nguoi_quan_ly`), **không** dùng "Quy cách đóng gói", "Tên", "Mã".

### Response format

```json
// Success (HTTP 200)
{ "status": "success", "message": "...", "data": { ... } }

// Business validation failed (HTTP 400)
{ "status": "failed", "message": "..." }

// Server error (HTTP 500)
{ "status": "error", "message": "..." }
```

- `data` khi response list: `{ "items": [...], "pagination": { "page", "limit", "total", "total_pages" } }`
- `data` khi response detail/create/update: object item

### HTTP status codes

| Code | Dùng cho |
|------|----------|
| 200 | Thành công |
| 400 | Validation failed (business logic) |
| 405 | Method không được hỗ trợ |
| 500 | Lỗi server |

### Query params (GET list)

- `page` — số trang (bắt đầu từ 1)
- `limit` — số item mỗi trang (mặc định 20, tối đa 500)
- `sort_by` — field để sort (nid, title, created, changed, field_hoat_dong, field_so_luong)
- `sort_dir` — ASC hoặc DESC
- `keyword` — tìm kiếm theo title (LIKE)
- `field_hoat_dong` — filter: 0, 1, 'all'
- `include_inactive` — nếu true thì bao gồm cả inactive

### Cấu trúc file API module

```
api/<module>/
├── <module>.info           # Drupal module info
├── <module>.module         # hook_menu, hook_init, hook_permission
├── <module>.controller.inc # Route dispatcher + controllers
├── <module>.service.inc    # Business logic layer
└── <module>.helpers.inc    # Helpers, response, query builders
```

## Flutter

- Dart/Flutter conventions.
- Dropdown kiểu combobox: `Autocomplete` — vừa gõ được vừa chọn từ suggestions, `filled: true, fillColor: Colors.white` để nền trắng, `isDense: true`, `contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12)` để chiều cao bằng các `TextFormField` khác.
- Dữ liệu dropdown lấy từ lần fetch đầu vào screen — extract unique values từ list items, bỏ qua giá trị rỗng.

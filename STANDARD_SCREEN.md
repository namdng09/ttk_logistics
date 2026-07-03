# Tiêu chuẩn màn hình CRUD (kho555)

## Loading animation

Mọi thao tác cần chờ (gọi API, CRUD) phải hiển thị loading để người dùng biết hệ thống đang xử lý:

- **Khi load danh sách:** `controller.isLoading.value ? const Center(child: CircularProgressIndicator()) : ...`
- **Khi save/update/delete:** `controller.isSaving.value` → button disabled + hiển thị spinner (dùng `Obx` bao button).
- **Phân biệt rõ:** `isLoading` cho fetch list, `isSaving` cho create/update/delete.
- **Luôn có `finally { isLoading.value = false; update(); }`** để tắt loading dù thành công hay thất bại.

```dart
// Controller
var isLoading = false.obs;
var isSaving = false.obs;

Future<void> fetchDuLieu() async {
  try {
    isLoading.value = true;
    // ... gọi API
  } catch (e) {
    // ... xử lý lỗi
  } finally {
    isLoading.value = false;
    update();
  }
}

// Screen
controller.isLoading.value
  ? const Center(child: CircularProgressIndicator())
  : buildTable(controller.list),
```

## Loading trên action buttons (reload, search, save)

Dùng `Obx` để hiển thị `CircularProgressIndicator` thay icon khi đang loading, đồng thời chặn click bằng `onTap: null`:

```dart
Obx(() => MyContainer(
  onTap: controller.isLoading.value ? null : () {
    controller.clearSearch();
    controller.fetchDuLieu();
  },
  color: contentTheme.warning,
  paddingAll: 12,
  child: Row(
    children: [
      if (controller.isLoading.value)
        SizedBox(
          width: 18, height: 18,
          child: CircularProgressIndicator(
            strokeWidth: 2, color: Colors.white,
          ),
        )
      else
        Icon(Remix.refresh_line, color: Colors.white, size: 18),
      const SizedBox(width: 6),
      MyText.labelMedium('Tải lại', color: Colors.white),
    ],
  ),
)),
```

Tương tự cho nút Lưu (dùng `isSaving`):

```dart
Obx(() {
  return controller.isSaving.value
      ? const SizedBox(
          width: 18, height: 18,
          child: CircularProgressIndicator(
            strokeWidth: 2, color: Colors.white,
          ),
        )
      : MyText.bodySmall('Lưu', fontWeight: 600, color: contentTheme.onPrimary);
}),
```

## Toast message (luôn dùng AppToast)

Mọi thông báo từ API (success/error/warning) phải dùng `AppToast` — **không dùng `Get.snackbar`**.

| Loại | Method | Màu |
|------|--------|-----|
| Thành công | `AppToast.success(message)` | Xanh (`#0DBF66`) |
| Cảnh báo | `AppToast.warning(message)` | Vàng (`#F9A825`) |
| Lỗi | `AppToast.error(message)` | Đỏ (`#E53935`) |

```dart
import 'package:ttk_logistics/helper/utils/app_toast.dart';

// Thành công
AppToast.success('Lưu thành công');

// Cảnh báo (vd: API trả về status "failed")
AppToast.warning('Dữ liệu không hợp lệ');

// Lỗi (vd: exception, network error)
AppToast.error('Lỗi kết nối: $e');
```

> ⚠️ Không dùng `Get.snackbar()`, `SnackBar`, `ScaffoldMessenger.showSnackBar` để hiển thị message API. `AppToast` đã thay thế hoàn toàn.

## Action buttons (trên header)

Ba nút luôn có, theo thứ tự trái → phải:

| Nút | Icon | Màu nền | Màu chữ | Ghi chú |
|-----|------|---------|---------|---------|
| Thêm | `Icons.add` | `contentTheme.success` | `Colors.white` | Mở dialog tạo mới |
| Tìm kiếm | `Icons.search` | `contentTheme.primary` | `Colors.white` | Mở dialog tìm kiếm |
| Tải lại | `Remix.refresh_line` | `contentTheme.warning` | `Colors.white` | Load lại dữ liệu, xoá search filter |

- Phải có loading animation (dùng `Obx`) trên nút Tải lại và Tìm kiếm khi `isLoading`.
- Chặn click bằng `onTap: null` khi đang loading.

## Controller pattern

### Pagination state

```dart
var currentPage = 1.obs;
var totalPages = 1.obs;
var totalItems = 0.obs;
var limit = 20.obs;

bool get hasNext => currentPage.value < totalPages.value;
bool get hasPrev => currentPage.value > 1;

Future<void> fetchDuLieu() async { ... }
void goToPage(int page) { ... }
void nextPage() { ... }
void prevPage() { ... }
void searchDuLieu(String keyword) { searchKeyword.value = keyword; currentPage = 1; fetchDuLieu(); }
void clearSearch() { searchKeyword.value = ''; currentPage = 1; fetchDuLieu(); }
```

### CRUD methods

```dart
Future<void> saveDuLieu(Map<String, dynamic> data) async {
  try {
    isSaving.value = true;
    final res = await Service.saveDuLieu(data);
    if (res.success) {
      Get.back();
      await fetchDuLieu();
      AppToast.success(res.message);
    } else {
      AppToast.warning(res.message);
    }
  } catch (e) {
    AppToast.error(e.toString());
  } finally {
    isSaving.value = false;
  }
}
```

### Service `fetchDuLieu()` phải trả về

```dart
Future<Map<String, dynamic>> fetchDuLieu({int page = 1, int limit = 20, String keyword = ''}) async {
  // ...
  return {'items': [...], 'pagination': {'page': 1, 'limit': 20, 'total': 0, 'total_pages': 1}};
}
```

### API response message (HTTP non-200)

Khi API trả về HTTP 400/500, service phải parse body để lấy `message` thay vì dùng generic "Lỗi server: {code}":

```dart
final res = _decodeBody(response.body);
if (response.statusCode == 200) {
  // xử lý thành công / thất bại từ body
} else {
  final message = res['message']?.toString() ?? 'Lỗi server: ${response.statusCode}';
  return ApiResponse(success: false, message: message);
}
```

## Pagination UI (dưới table)

```dart
Widget _buildPagination() {
  final int page = controller.currentPage.value;
  final int pages = controller.totalPages.value;
  final int total = controller.totalItems.value;

  final TextEditingController pageInputCtrl = TextEditingController(text: '$page');

  return Row(
    mainAxisAlignment: MainAxisAlignment.end,
    children: [
      MyText.bodySmall(
        'Trang $page/$pages - Tổng $total dòng',
        fontWeight: 600,
      ),
      const SizedBox(width: 12),
      SizedBox(
        width: 60,
        height: 32,
        child: TextFormField(
          controller: pageInputCtrl,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          decoration: InputDecoration(
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            border: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade300)),
            enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey.shade300)),
          ),
          onFieldSubmitted: (value) {
            final p = int.tryParse(value);
            if (p != null) controller.goToPage(p);
          },
        ),
      ),
      const SizedBox(width: 12),
      _paginationButton(
        label: 'Trước',
        enabled: controller.hasPrev && !controller.isLoading.value,
        onTap: controller.prevPage,
      ),
      const SizedBox(width: 8),
      _paginationButton(
        label: 'Sau',
        enabled: controller.hasNext && !controller.isLoading.value,
        onTap: controller.nextPage,
      ),
    ],
  );
}

Widget _paginationButton({
  required String label,
  required bool enabled,
  required VoidCallback onTap,
}) {
  return MyContainer(
    onTap: enabled ? onTap : null,
    color: enabled ? contentTheme.primary : Colors.grey.shade300,
    padding: MySpacing.xy(12, 8),
    child: MyText.bodySmall(
      label,
      color: enabled ? contentTheme.onPrimary : Colors.grey.shade600,
      fontWeight: 700,
    ),
  );
}
```

## Table cell/header style

```dart
Widget _headerCell(String text, {double? width}) {
  return SizedBox(
    width: width,
    child: Text(text, style: const TextStyle(fontWeight: FontWeight.w700)),
  );
}

Widget _cellText(String text, {double? width}) {
  return SizedBox(
    width: width,
    child: Text(text, overflow: TextOverflow.ellipsis, maxLines: 3),
  );
}
```

## Nhập liệu

### Input text/number

```dart
Widget _buildInput(String label, TextEditingController ctrl,
    {bool isNumber = false, bool isInteger = false, bool required = false, bool hasError = false, ValueChanged<String>? onChanged}) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          MyText.labelMedium(label),
          if (required)
            const Text(' *', style: TextStyle(color: Colors.red)),
        ],
      ),
      const SizedBox(height: 6),
      TextFormField(
        controller: ctrl,
        onChanged: onChanged,
        keyboardType: isInteger
            ? TextInputType.number
            : isNumber
                ? TextInputType.numberWithOptions(decimal: true)
                : TextInputType.text,
        decoration: InputDecoration(
          filled: true,
          fillColor: hasError ? Colors.red.shade50 : Colors.white,
          border: OutlineInputBorder(
            borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: hasError ? Colors.red : Colors.blue, width: 2),
          ),
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      ),
    ],
  );
}
```

### Date input

```dart
Widget _buildDateInput(String label, TextEditingController ctrl,
    {bool hasError = false}) {
  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          MyText.labelMedium(label),
        ],
      ),
      const SizedBox(height: 6),
      TextFormField(
        controller: ctrl,
        onChanged: (value) => _formatDateInput(ctrl, value),
        keyboardType: TextInputType.number,
        decoration: InputDecoration(
          suffixIcon: Icon(Icons.calendar_today, size: 18, color: Colors.grey.shade600),
          filled: true,
          fillColor: hasError ? Colors.red.shade50 : Colors.white,
          border: OutlineInputBorder(
            borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
          ),
          enabledBorder: OutlineInputBorder(
            borderSide: BorderSide(color: hasError ? Colors.red : Colors.grey.shade300),
          ),
          focusedBorder: OutlineInputBorder(
            borderSide: BorderSide(color: hasError ? Colors.red : Colors.blue, width: 2),
          ),
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        ),
      ),
    ],
  );
}

void _formatDateInput(TextEditingController ctrl, String value) {
  final digits = value.replaceAll(RegExp(r'[^0-9]'), '');
  if (digits.length > 8) return;

  final oldSelection = ctrl.selection;
  String formatted = digits;
  if (digits.length >= 3) {
    formatted = '${digits.substring(0, 2)}/${digits.substring(2)}';
  }
  if (digits.length >= 5) {
    formatted = '${digits.substring(0, 2)}/${digits.substring(2, 4)}/${digits.substring(4)}';
  }
  if (digits.length <= 4) {
    formatted = digits;
    if (digits.length >= 3) {
      formatted = '${digits.substring(0, 2)}/${digits.substring(2)}';
    }
  }

  ctrl.value = TextEditingValue(
    text: formatted,
    selection: TextSelection.collapsed(offset: formatted.length),
  );
}

String _toDisplayDate(String apiDate) {
  if (apiDate.isEmpty) return '';
  try {
    final parsed = DateFormat('yyyy-MM-dd').parse(apiDate);
    return DateFormat('dd/MM/yyyy').format(parsed);
  } catch (_) {
    return apiDate;
  }
}

String _toApiDate(String displayDate) {
  if (displayDate.isEmpty) return '';
  try {
    final parsed = DateFormat('dd/MM/yyyy').parse(displayDate);
    return DateFormat('yyyy-MM-dd').format(parsed);
  } catch (_) {
    return displayDate;
  }
}
```

### Currency input

```dart
String _formatCurrency(double value) {
  if (value <= 0) return '';
  return NumberFormat('#,###').format(value).replaceAll(',', '.');
}

double _parseCurrency(String text) {
  return double.tryParse(text.replaceAll('.', '')) ?? 0;
}
```

## Enter submit

Dùng `Focus` + `onKeyEvent` bọc form để bắt phím Enter ở mọi field, không cần `onFieldSubmitted`/`textInputAction` trên từng input:

### Form tạo/sửa

```dart
// Trong dialog builder:
void submitForm() {
  if (controller.isSaving.value) return; // guard double-submit
  // validation + gọi API save
}

Focus(
  onKeyEvent: (node, event) {
    if (event is KeyDownEvent && (event.logicalKey == LogicalKeyboardKey.enter || event.logicalKey == LogicalKeyboardKey.space)) {
      submitForm();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  },
  child: Column(
    children: [
      _buildInput(...),
      _buildDateInput(...),
      // ... các field khác
      MyContainer(
        onTap: submitForm, // dùng chung closure
        child: Obx(() => controller.isSaving.value
          ? CircularProgressIndicator(...)
          : Text('Lưu')),
      ),
    ],
  ),
)
```

### Search dialog

```dart
showDialog(
  context: context,
  builder: (_) => Dialog(
    child: Focus(
      onKeyEvent: (node, event) {
        if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.enter) {
          controller.searchDuLieu(searchCtrl.text);
          Get.back();
          return KeyEventResult.handled;
        }
        return KeyEventResult.ignored;
      },
      child: Column(
        children: [
          _buildInput('Từ khóa', searchCtrl),
          // Nút Tìm
        ],
      ),
    ),
  ),
);
```

> Cần `import 'package:flutter/services.dart'` cho `KeyDownEvent` và `LogicalKeyboardKey`.

## Button hover/focus

Nút Lưu / Xác nhận trong form dùng `MouseRegion` + `Focus` để hover/tab đổi màu:

```dart
bool isSaveHovered = false;
bool isSaveFocused = false;

MouseRegion(
  onEnter: (_) => setDialogState(() => isSaveHovered = true),
  onExit: (_) => setDialogState(() => isSaveHovered = false),
  child: Focus(
    onFocusChange: (focused) => setDialogState(() => isSaveFocused = focused),
    child: MyContainer(
      onTap: submitForm,
      color: isSaveHovered || isSaveFocused
          ? contentTheme.primary.withValues(alpha: 0.75)
          : contentTheme.primary,
      // ...
    ),
  ),
)
```

## Validation

- Bắt buộc: thêm `*` đỏ bên cạnh label, `hasError: true` làm border đỏ + nền hồng.
- Khi user bắt đầu gõ lại → reset `hasError` trong `onChanged`.
- Gọi `AppToast.warning('Vui lòng nhập ...')` khi save (không dùng `AppToast.error` cho validation).

## Response format (Drupal API)

```json
// Success (HTTP 200)
{ "status": "success", "message": "...", "data": { ... } }

// Business validation failed (HTTP 400)
{ "status": "failed", "message": "..." }

// Server error (HTTP 500)
{ "status": "error", "message": "..." }
```

- `data` khi response list: `{ "items": [...], "pagination": { "page", "limit", "total", "total_pages" } }`
- `data` khi detail/create/update: object item

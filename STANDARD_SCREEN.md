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

## Dropdown kiểu Autocomplete (combobox vừa gõ vừa chọn)

Dropdown dùng `Autocomplete` với cơ chế Enter select, FocusNode riêng, không submit form khi đang chọn.

### Cấu trúc

- `_buildBenThuBaSelector(...)`: wrapper chứa label + `_BenThuBaDropdown`.
- `_BenThuBaDropdown`: StatefulWidget chứa `Autocomplete<BenThuBa>` + logic fetch list.
- Truyền `FocusNode` riêng cho từng dropdown để form biết khi nào dropdown đang focus.

### Code mẫu

```dart
// ---------- Trong State của screen ----------

// Model cần có tenGanGon, tenCongTy, title, ...
String _displayFn(BenThuBa p) {
  final name = p.tenGanGon.isNotEmpty ? p.tenGanGon : p.title;
  final company = p.tenCongTy.isNotEmpty ? p.tenCongTy : p.title;
  return '$name - $company';
}

// ---------- Trong dialog tạo/sửa ----------

// 1. Tạo FocusNode riêng
final khFocusNode = FocusNode();
bool justSelectedFromDropdown = false;

// 2. Gọi selector
_buildBenThuBaSelector(
  'Khách hàng',
  selectedValue,
  phanLoai: '',
  hasError: isError,
  required: true,
  focusNode: khFocusNode,
  onChanged: (p) {
    setDialogState(() {
      selectedValue = p;
      justSelectedFromDropdown = true;  // ← flag chặn submit cùng Enter
    });
    khFocusNode.unfocus();  // ← để lần Enter sau submit được
  },
),

// 3. Focus.onKeyEvent bọc form
Focus(
  onKeyEvent: (node, event) {
    if (event is KeyDownEvent && event.logicalKey == LogicalKeyboardKey.enter) {
      if (justSelectedFromDropdown) {
        justSelectedFromDropdown = false;
        return KeyEventResult.ignored;
      }
      if (khFocusNode.hasFocus || nvkdFocusNode.hasFocus) {
        return KeyEventResult.ignored;  // để Autocomplete xử lý Enter
      }
      submitForm();
      return KeyEventResult.handled;
    }
    return KeyEventResult.ignored;
  },
  child: Column(children: [...]),
)

// ---------- Widget dropdown ----------

Widget _buildBenThuBaSelector(
  String label,
  BenThuBa? selected, {
  required String phanLoai,
  String excludePhanLoai = '',
  required bool hasError,
  bool required = false,
  FocusNode? focusNode,
  required ValueChanged<BenThuBa?> onChanged,
}) {
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
      _BenThuBaDropdown(
        selected: selected,
        phanLoai: phanLoai,
        excludePhanLoai: excludePhanLoai,
        hasError: hasError,
        displayFn: _displayFn,           // ← display function
        focusNode: focusNode,             // ← FocusNode riêng
        onChanged: onChanged,
      ),
    ],
  );
}

// ---------- StatefulWidget dropdown ----------

class _BenThuBaDropdown extends StatefulWidget {
  final BenThuBa? selected;
  final String phanLoai;
  final String excludePhanLoai;
  final bool hasError;
  final ValueChanged<BenThuBa?> onChanged;
  final String Function(BenThuBa) displayFn;
  final FocusNode? focusNode;

  const _BenThuBaDropdown({
    required this.selected,
    required this.phanLoai,
    required this.excludePhanLoai,
    required this.hasError,
    required this.onChanged,
    required this.displayFn,
    this.focusNode,
  });

  @override
  State<_BenThuBaDropdown> createState() => _BenThuBaDropdownState();
}

class _BenThuBaDropdownState extends State<_BenThuBaDropdown> {
  final TextEditingController _ctrl = TextEditingController();
  late final String Function(BenThuBa) _displayFn = widget.displayFn;
  List<BenThuBa> _list = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.selected != null) {
      _ctrl.text = _displayFn(widget.selected!);
    }
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final list = await SomeService.fetchByPhanLoai(phanLoai: widget.phanLoai);
      var filtered = list;
      if (widget.excludePhanLoai.isNotEmpty) {
        filtered = list.where((p) =>
          !p.phanLoaiList.any((pl) =>
            pl.toLowerCase().contains(widget.excludePhanLoai.toLowerCase()))
        ).toList();
      }
      if (!mounted) return;
      setState(() => _list = filtered);
    } catch (e) {
      if (mounted) AppToast.error(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      type: MaterialType.transparency,
      child: Autocomplete<BenThuBa>(
        focusNode: widget.focusNode,               // ← FocusNode từ ngoài
        textEditingController: _ctrl,               // ← bắt buộc khi dùng focusNode
        displayStringForOption: (p) => _displayFn(p),
        optionsBuilder: (textEditingValue) {
          if (textEditingValue.text.isEmpty) return _list;
          final q = textEditingValue.text.toLowerCase();
          return _list.where((p) =>
            _displayFn(p).toLowerCase().contains(q) ||
            p.title.toLowerCase().contains(q) ||
            p.soDienThoai.toLowerCase().contains(q));
        },
        onSelected: (p) {
          _ctrl.text = _displayFn(p);
          widget.onChanged(p);
        },
        fieldViewBuilder: (context, fieldCtrl, focusNode, onSubmitted) {
          return TextFormField(
            controller: fieldCtrl,
            focusNode: focusNode,
            onFieldSubmitted: (_) => onSubmitted(),  // ← Enter → chọn item
            decoration: InputDecoration(
              isDense: true,
              filled: true,
              fillColor: Colors.white,
              hintText: _isLoading ? 'Đang tải...' : 'Chọn hoặc nhập...',
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              border: OutlineInputBorder(
                borderSide: BorderSide(color: widget.hasError ? Colors.red : Colors.grey.shade300),
              ),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(color: widget.hasError ? Colors.red : Colors.grey.shade300),
              ),
              focusedBorder: const OutlineInputBorder(
                borderSide: BorderSide(color: Colors.blue, width: 2),
              ),
            ),
          );
        },
        optionsViewBuilder: (context, onSelected, opts) {
          return Align(
            alignment: Alignment.topLeft,
            child: Material(
              color: Colors.white,
              elevation: 4,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 240, minWidth: 360),
                child: ListView(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  children: [
                    for (var i = 0; i < opts.length; i++)
                      Builder(
                        builder: (context) {
                          final highlighted = AutocompleteHighlightedOption.of(context);
                          final isHi = i == highlighted;
                          final p = opts.elementAt(i);
                          return InkWell(
                            onTap: () => onSelected(p),
                            child: Container(
                              color: isHi ? Colors.grey.shade300 : Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _displayFn(p),
                                    style: const TextStyle(color: Colors.black, fontWeight: FontWeight.w600),
                                  ),
                                  if (p.fieldPhanLoai.isNotEmpty)
                                    Text(
                                      p.fieldPhanLoai,
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
```

### Luồng Enter

| Thao tác | `onFieldSubmitted` → `onSubmitted()` | `_handleKeyEvent` | Parent `Focus.onKeyEvent` | Kết quả |
|----------|--------------------------------------|-------------------|---------------------------|---------|
| Panel đang mở + Enter | Chọn item, set `justSelectedFromDropdown=true`, `unfocus()` | Panel null → `ignored` | Flag true → clear → `ignored` | **Chọn item, không submit** |
| Panel đóng + Enter lần sau | No-op | Panel null → `ignored` | Flag false, focus đã mất → `submitForm()` | **Submit form** |
| Field thường + Enter | — | — | `submitForm()` | **Submit form** |

### Quy tắc

1. Luôn truyền `FocusNode` riêng cho từng dropdown.
2. Luôn kèm `textEditingController` khi dùng `focusNode` custom (assertion bắt buộc).
3. `onFieldSubmitted` phải gọi `onSubmitted()` để Autocomplete xử lý chọn item.
4. Dùng flag `justSelectedFromDropdown` + `unfocus()` để không submit cùng Enter với select.
5. `displayFn` format `'ten_gan_gon - ten_cong_ty'` (hoặc `'$name - $company'`).
6. `optionsViewBuilder`: highlight item bằng `AutocompleteHighlightedOption.of(context)`.

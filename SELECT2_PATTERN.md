# Select2 Pattern

Mẫu chuẩn hiện tại lấy theo input `Bãi lấy thực tế` trong modal kế hoạch xếp xe.

## CSS chuẩn

Áp dụng cho scope của màn hình/modal đang làm. Ví dụ với modal chi phí:

```css
#your-scope .select2-container {
  width: 100% !important;
  font-family: inherit;
}

#your-scope .select2-container .select2-selection--single {
  display: flex;
  align-items: center;
  height: calc(1.5em + 0.75rem + 2px);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  line-height: 1.5;
}

#your-scope .select2-container .select2-selection--single .select2-selection__rendered {
  width: 100%;
  line-height: 1.5;
  padding: 0;
  padding-right: 1.75rem;
  font-size: 0.85rem;
}

#your-scope .select2-container .select2-selection--single .select2-selection__arrow {
  height: 100%;
  top: 0;
  right: 0.375rem;
  width: 1rem;
}

#your-scope .select2-container .select2-selection--single .select2-selection__clear {
  position: relative;
  z-index: 1;
  font-size: 0.875rem;
  line-height: 1.5;
}
```

Không thêm `margin-right` cho `.select2-selection__clear`. Dấu `x` đã được Select2 mặc định xử lý bằng `float: right`; khoảng trống bên phải nằm ở `padding-right` của `.select2-selection__rendered`.

## JS init cơ bản

```javascript
function initSelect2(el, placeholder, options) {
  if (!$.fn || !$.fn.select2 || !el) return;

  var $el = $(el);
  if ($el.data('select2')) $el.select2('destroy');

  var opts = $.extend({
    placeholder: placeholder || '— Chọn —',
    allowClear: true,
    width: '100%'
  }, options || {});

  if (!opts.dropdownParent) {
    var $modal = $el.closest('.modal');
    if ($modal.length) opts.dropdownParent = $modal;
  }

  $el.select2(opts);
}
```

## Cho phép nhập thêm item mới

Option cần dùng là:

```javascript
tags: true
```

Ví dụ:

```javascript
initSelect2(document.querySelector('.cost-name-select'), 'Tên chi phí', {
  tags: true,
  allowClear: true,
  dropdownParent: $('#ke-hoach-chi-phi-modal')
});
```

Nếu muốn kiểm soát item mới trước khi Select2 tạo option, dùng thêm `createTag`:

```javascript
initSelect2(document.querySelector('.cost-name-select'), 'Tên chi phí', {
  tags: true,
  allowClear: true,
  dropdownParent: $('#ke-hoach-chi-phi-modal'),
  createTag: function (params) {
    var term = $.trim(params.term || '');
    if (!term) return null;
    return {
      id: term,
      text: term,
      newTag: true
    };
  }
});
```

Khi dùng `tags: true`, Select2 chỉ thêm option ở phía frontend. Nếu cần lưu item mới vào danh mục, phải gọi thêm API tạo danh mục trước hoặc trong lúc lưu form.


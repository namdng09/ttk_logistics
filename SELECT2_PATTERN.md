# Select2 Pattern

Mẫu chuẩn hiện tại lấy theo input `Khách hàng *` trong modal kế hoạch xếp xe.

## CSS chuẩn

Áp dụng cho scope của màn hình/modal đang làm. Ví dụ với modal chi phí:

```css
#your-scope .select2-container {
  width: 100% !important;
  font-family: inherit;
}

#your-scope .select2-container .select2-selection--single {
  height: calc(1.5em + 0.75rem + 2px);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  line-height: 1.5;
}

#your-scope .select2-container .select2-selection--single .select2-selection__rendered {
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
}
```

Không thêm `margin-right` cho `.select2-selection__clear`. Dấu `x` đã được Select2 mặc định xử lý bằng `float: right`; khoảng trống bên phải nằm ở `padding-right` của `.select2-selection__rendered`.

Nếu chỉ cần sửa một input filter riêng, scope trực tiếp vào select đó để không ảnh hưởng các Select2 khác:

```css
#your-filter-select + .select2-container .select2-selection--single {
  height: calc(1.5em + 0.75rem + 2px);
  padding: 0.375rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.85rem;
  line-height: 1.5;
}
```

## Dropdown dài và min-width

Danh sách nhiều mục phải cuộn được thay vì kéo dài cả trang/modal, và dropdown không được hẹp hơn ô chứa nó (cột hẹp như ô `Giờ`). Áp dụng cho phạm vi đang làm; dropdown phải nằm trong phạm vi đó (dùng `dropdownParent`, xem phần JS init bên dưới), nếu không selector sẽ không khớp:

```css
#your-scope .select2-container--default .select2-results > .select2-results__options {
  max-height: 320px;
  overflow-y: auto;
}

#your-scope .select2-container--open .select2-dropdown--below,
#your-scope .select2-container--open .select2-dropdown--above {
  min-width: 200px !important;
  max-width: calc(100vw - 1rem);
}
```

- `max-height: 320px` + `overflow-y: auto`: danh sách dài (khách hàng, kho, xe...) cuộn bên trong dropdown.
- `min-width: 200px !important`: dropdown không bị co theo ô hẹp; `!important` vì Select2 đặt độ rộng theo ô bằng style trực tiếp.
- `max-width: calc(100vw - 1rem)`: không tràn khỏi màn hình nhỏ.
- Đang dùng ở: thanh lọc và modal xếp xe hàng cảng (`ke_hoach_hang_cang.css`), thanh lọc và modal `Tạo kế hoạch kéo về` của `/cat-mooc` (`ke_hoach_cat_mooc.css`).

## JS init cơ bản

```javascript
function _jq() {
  return (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ :
    (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function') ? jQuery : null;
}

function initSelect2(el, placeholder, options) {
  var jq = _jq();
  if (!jq || !el) return;

  var $el = jq(el);
  if ($el.data('select2')) $el.select2('destroy');

  var opts = jq.extend({
    placeholder: placeholder || '— Chọn —',
    allowClear: true,
    width: '100%'
  }, options || {});

  if (!opts.dropdownParent) {
    var $modal = $el.closest('.modal');
    if ($modal.length) opts.dropdownParent = $modal;
  }

  $el.select2(opts);
  $el.off('select2:open.khxhFocus').on('select2:open.khxhFocus', function () {
    window.setTimeout(function () {
      var search = document.querySelector('.select2-container--open .select2-search__field');
      if (search) search.focus();
    }, 0);
  });
}
```

Quy tắc dùng:

- Mỗi scope dùng Select2 cần đủ **hai** khối CSS: `CSS chuẩn` (chiều cao, vị trí `x`/mũi tên) và `Dropdown dài và min-width`.
- Populate `<option>` trước, init Select2 sau.
- Nếu re-init, luôn `destroy()` instance cũ trước.
- Trong modal, truyền `dropdownParent` hoặc để helper tự lấy `.closest('.modal')`.
- Với filter ngoài modal, có thể truyền `dropdownParent: jq('body')` nếu dropdown bị lệch/che.

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

## Danh mục cần đồng nhất

Với các dữ liệu cần chuẩn hóa để xuất chứng từ/hóa đơn, không dùng `tags: true`. Ví dụ tên chi phí kế hoạch phải chọn từ danh mục `Chi phí`:

```javascript
initSelect2(document.querySelector('.cost-name-select'), 'Tên chi phí', {
  allowClear: true,
  dropdownParent: $('#ke-hoach-chi-phi-modal')
});
```

Khi lưu, validate giá trị đã chọn có trong danh sách option/danh mục. Không tự tạo danh mục mới từ text người dùng nhập.

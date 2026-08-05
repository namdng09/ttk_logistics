# Money Input Pattern

Bản mẫu chuẩn nhất cho input nhập số tiền trong dự án TTK Logistics.

Mục tiêu:

- Khi người dùng nhập, số vẫn hiển thị dấu `.` phân tách hàng nghìn, ví dụ `1.000.000`.
- Khi sửa/xóa/thêm số ở giữa chuỗi, con trỏ không bị nhảy xuống cuối input.
- Khi submit API, chỉ gửi số thô, không gửi dấu phân tách.

## Nguồn chuẩn

- Modal chi phí kế hoạch: `modules/ke_hoach_xep_xe/assets/js/ke_hoach_chi_phi.js`
- Modal định mức khách hàng: `modules/khach_hang/assets/js/khach_hang.js`

## HTML mẫu

```html
<div class="input-group">
  <span class="input-group-text">đ</span>
  <input
    type="text"
    class="form-control money-mask"
    name="so_tien"
    inputmode="numeric"
    placeholder="0">
</div>
```

## JS mẫu

```javascript
function parseMoney(value) {
  return Number(String(value || '').replace(/[^\d]/g, '')) || 0;
}

function formatMoney(value) {
  var number = parseMoney(value);
  return number ? new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(number) : '';
}

function formatMoneyInputKeepingCaret(input) {
  if (!input || input.readOnly || input.disabled) return;

  var raw = String(input.value || '');
  var caret = typeof input.selectionStart === 'number' ? input.selectionStart : raw.length;
  var digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, '').length;
  var digits = raw.replace(/\D/g, '');

  if (!digits) {
    input.value = '';
    return;
  }

  input.value = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(digits));

  var nextCaret = input.value.length;
  var seen = 0;
  for (var i = 0; i < input.value.length; i++) {
    if (/\d/.test(input.value.charAt(i))) {
      seen += 1;
      if (seen >= digitsBeforeCaret) {
        nextCaret = i + 1;
        break;
      }
    }
  }

  try {
    input.setSelectionRange(nextCaret, nextCaret);
  } catch (e) {}
}

$('.money-mask').each(function () {
  if (this._moneyHandler) return;
  this._moneyHandler = true;
  this.addEventListener('input', function () {
    formatMoneyInputKeepingCaret(this);
  });
});
```

## Quy ước

- Dùng `type="text"` và `inputmode="numeric"` cho input tiền, không dùng `type="number"` nếu cần dấu `.` khi nhập.
- Dùng `parseMoney()` trước khi tính toán hoặc gửi API.
- Dùng `formatMoney()` khi populate dữ liệu từ API vào form.
- Không dùng cách đặt lại con trỏ bằng chênh lệch độ dài chuỗi cũ/mới. Cách chuẩn là đếm số chữ số trước con trỏ, format lại, rồi đặt con trỏ về đúng vị trí theo số chữ số đó.
- Mặc định helper này xử lý tiền nguyên VND. Nếu cần số thập phân, tạo helper riêng.

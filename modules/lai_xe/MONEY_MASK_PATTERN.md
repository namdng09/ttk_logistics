# Money Mask Pattern

Mẫu chuẩn hiện tại cho input nhập số tiền. Bản này dùng cho các ô tiền cần vừa format dấu `.` khi đang nhập, vừa giữ đúng vị trí con trỏ khi người dùng sửa số ở giữa chuỗi.

## Nguồn chuẩn

- Modal chi phí kế hoạch: `modules/ke_hoach_xep_xe/assets/js/ke_hoach_chi_phi.js`
- Modal định mức khách hàng: `modules/khach_hang/assets/js/khach_hang.js`

## HTML mẫu

```html
<div class="input-group">
  <span class="input-group-text">đ</span>
  <input type="text" class="form-control money-mask" name="gia_mua" placeholder="1.000.000">
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

## Quy ước sử dụng lại

- Input tiền luôn dùng class `money-mask`.
- Chỉ lưu số thô lên API/DB: bỏ toàn bộ dấu `.` trước khi submit.
- Khi populate dữ liệu edit modal, luôn format lại bằng `toLocaleString('vi-VN')` hoặc helper `formatMoney()`.
- Nếu có field tính toán phụ thuộc như `Lương ngày`, luôn dùng `parseMoney()` để lấy số nguyên từ input đã format.
- Không dùng cách tính `diff = formatted.length - oldValue.length` để đặt lại con trỏ. Cách đó dễ sai khi sửa/xóa số ở giữa chuỗi.
- Chuẩn mới là đếm số chữ số trước con trỏ, format lại chuỗi, rồi đặt con trỏ về sau đúng chữ số tương ứng.
- Mặc định tiền là số nguyên VND. Nếu sau này cần số thập phân, tạo helper riêng có xử lý phần thập phân, không sửa trực tiếp helper chuẩn này.

## Áp dụng tại module lái xe

- Module lái xe hiện **không còn field tiền nào** (đã bỏ Lương cơ bản, Lương tháng, Lương ngày).
- Nếu sau này thêm lại ô tiền, áp dụng đúng helper `money-mask` ở phần JS mẫu phía trên.

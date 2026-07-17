# Money Mask Pattern

Mẫu tham chiếu: input `Giá mua` trong modal phương tiện.

## Nguồn chuẩn

- Template: `modules/phuong_tien/templates/phuong-tien-list.tpl.php`
- JS: `modules/phuong_tien/assets/js/phuong_tien.js`

## HTML mẫu

```html
<div class="input-group">
  <span class="input-group-text">đ</span>
  <input type="text" class="form-control money-mask" name="gia_mua" placeholder="1.000.000">
</div>
```

## JS mẫu

```javascript
$('.money-mask').each(function () {
  if (this.hasAttribute('readonly')) return;
  if (this._moneyHandler) return;
  this._moneyHandler = true;
  this.addEventListener('input', function () {
    var cursor = this.selectionStart;
    var raw = this.value.replace(/[^\d]/g, '');
    var formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    if (formatted !== this.value) {
      var diff = formatted.length - this.value.length;
      this.value = formatted;
      this.setSelectionRange(cursor + diff, cursor + diff);
    }
  });
});
```

## Quy ước sử dụng lại

- Input tiền luôn dùng class `money-mask`.
- Chỉ lưu số thô lên API/DB: bỏ toàn bộ dấu `.` trước khi submit.
- Khi populate dữ liệu edit modal, luôn format lại bằng `toLocaleString('vi-VN')` hoặc helper `formatMoney()`.
- Nếu có field tính toán phụ thuộc như `Lương ngày`, luôn dùng `parseMoney()` để lấy số nguyên từ input đã format.

## Áp dụng tại module lái xe

- `Lương cơ bản`: `input[name="luong_co_ban"]`
- `Lương tháng`: `input[name="luong_thang"]`
- `Lương ngày`: field readonly, format hiển thị theo cùng chuẩn `vi-VN`

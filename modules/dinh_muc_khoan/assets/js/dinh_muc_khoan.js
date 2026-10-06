(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';

  // Gợi ý điểm đầu/cuối và tên gọi khác lấy từ danh mục Bãi/Kho/Cảng — vẫn cho
  // gõ tên mới không có trong danh mục (enforceWhitelist: false), theo đúng quy
  // ước Select2/Tagify tags:true đã dùng ở các màn khác.
  var LOCATION_WHITELIST = [];
  var LOCATION_LOADED = false;
  var LOCATION_LOADING = false;
  var LOCATION_CALLBACKS = [];
  var tagifyDiemDau = null;
  var tagifyDiemCuoi = null;

  // Dòng báo lỗi khi tải danh sách: hiện đúng lý do server trả về; 401/403 (không có quyền) thì chữ vàng + icon ổ khoá.
  function loadErrorRow(colspan, jqXHR) {
    var denied = !!jqXHR && (jqXHR.status === 401 || jqXHR.status === 403);
    var msg = String(apiMsg(jqXHR)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return '<tr><td colspan="' + colspan + '" class="text-center py-4 ' + (denied ? 'text-warning' : 'text-danger') + '">' +
      (denied ? '<i class="ti tabler-lock me-1"></i>' : '') + msg + '</td></tr>';
  }

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return (r && r.message) || 'Lỗi kết nối server';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMoney(val) {
    var num = parseInt(val, 10);
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function parseMoney(val) {
    var num = parseInt(String(val || '').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }

  function initMoneyMasks() {
    $('#dmk-modal .money-mask').each(function () {
      if (this._moneyMaskReady) return;
      this._moneyMaskReady = true;
      this.addEventListener('input', function () {
        var raw = this.value.replace(/[^0-9]/g, '');
        this.value = raw === '' ? '' : formatMoney(raw);
      });
    });
  }

  function showFormLoading(show) {
    $('#dmk-form-loading').toggle(!!show);
  }

  function dmkModal() {
    var el = document.getElementById('dmk-modal');
    return bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(el) : new bootstrap.Modal(el);
  }

  /** Tải 1 lần danh sách Bãi/Kho/Cảng từ danh mục làm gợi ý cho Tagify; các lần
   * gọi sau dùng luôn cache, không gọi lại API. */
  // Tải đủ mọi trang của 1 API danh sách: trang 1 cho biết total_pages, các trang còn lại gọi song song (mỗi lần tối đa 100 dòng
  // khi dùng select, tối đa 50 trang). done(items) khi đủ, fail(jqXHR|undefined) nếu có trang lỗi.
  function fetchAllPages(url, params, done, fail) {
    function request(page) {
      return $.ajax({ url: url, type: 'GET', dataType: 'json', data: $.extend({ page: page }, params) });
    }
    request(1).done(function (res) {
      if (!(res && res.status === 'success' && res.data && res.data.items)) {
        fail();
        return;
      }
      var first = res.data.items;
      var pages = Math.min(50, Math.max(1, parseInt(res.data.total_pages, 10) || 1));
      if (pages === 1) {
        done(first);
        return;
      }
      var chunks = [];
      var left = pages - 1;
      var failed = false;
      for (var page = 2; page <= pages; page++) {
        (function (p) {
          request(p).done(function (r) {
            if (r && r.status === 'success' && r.data && r.data.items) chunks[p - 2] = r.data.items; else failed = true;
          }).fail(function () {
            failed = true;
          }).always(function () {
            left -= 1;
            if (left > 0) return;
            if (failed) { fail(); return; }
            var all = first;
            for (var c = 0; c < chunks.length; c++) all = all.concat(chunks[c]);
            done(all);
          });
        })(page);
      }
    }).fail(function (jqXHR) {
      fail(jqXHR);
    });
  }

  function loadLocationWhitelist(callback) {
    if (LOCATION_LOADED) {
      if (callback) callback();
      return;
    }
    if (callback) LOCATION_CALLBACKS.push(callback);
    if (LOCATION_LOADING) return;
    LOCATION_LOADING = true;
    // Chỉ lấy nid + tên địa điểm; tải đủ mọi trang, mỗi lần 100 dòng.
    fetchAllPages('/api/danh-muc', { phan_loai: 'Bãi,Kho,Cảng', limit: 100, select: 'nid,ten' }, function (items) {
      var seen = {};
      var names = [];
      for (var i = 0; i < items.length; i++) {
        var ten = String((items[i] && items[i].ten) || '').trim();
        var key = ten.toLowerCase();
        if (ten === '' || seen[key]) continue;
        seen[key] = true;
        names.push(ten);
      }
      LOCATION_WHITELIST = names;
      finishLocations();
    }, function (jqXHR) {
      if (notyf) notyf.error(jqXHR ? apiMsg(jqXHR) : 'Không tải đủ danh sách địa điểm');
      finishLocations();
    });
    function finishLocations() {
      LOCATION_LOADED = true;
      LOCATION_LOADING = false;
      var callbacks = LOCATION_CALLBACKS.splice(0);
      for (var i = 0; i < callbacks.length; i++) callbacks[i]();
    }
  }

  function tagifyDropdownOptions(closeOnSelect) {
    return { enabled: 0, maxItems: 20, closeOnSelect: !!closeOnSelect };
  }

  /** Khởi tạo 2 ô Tagify (Điểm đầu, Điểm cuối) — chỉ tạo 1 lần, các lần sau chỉ cập
   * nhật whitelist/giá trị. Mỗi ô cho chọn/gõ nhiều tên gọi cho cùng 1 điểm — xem
   * splitPointNames() để biết cách tách tên chính/tên gọi chung lúc lưu. */
  function initTagifyFields() {
    if (typeof Tagify === 'undefined') return;
    if (!tagifyDiemDau) {
      tagifyDiemDau = new Tagify(document.getElementById('dmk-diem-dau'), {
        whitelist: LOCATION_WHITELIST,
        enforceWhitelist: false,
        dropdown: tagifyDropdownOptions(false)
      });
    }
    if (!tagifyDiemCuoi) {
      tagifyDiemCuoi = new Tagify(document.getElementById('dmk-diem-cuoi'), {
        whitelist: LOCATION_WHITELIST,
        enforceWhitelist: false,
        dropdown: tagifyDropdownOptions(false)
      });
    }
    tagifyDiemDau.settings.whitelist = LOCATION_WHITELIST;
    tagifyDiemCuoi.settings.whitelist = LOCATION_WHITELIST;
  }

  function setTagifyValue(tagify, values) {
    if (!tagify) return;
    tagify.removeAllTags();
    if (values && values.length) tagify.addTags(values);
  }

  function getTagifyValues(tagify) {
    if (!tagify) return [];
    return tagify.value.map(function (t) { return t.value; });
  }

  /** 1 ô = 1 điểm, cho gõ/chọn nhiều tên gọi cho cùng điểm đó (không phân biệt
   * "tên chính"/"tên gọi khác" trên form nữa). Tag đầu tiên lưu vào diem_dau/
   * diem_cuoi (dùng hiển thị ở danh sách), các tag còn lại (bỏ trùng, không phân
   * biệt hoa/thường) lưu vào diem_dau_alias/diem_cuoi_alias để so khớp. */
  function splitPointNames(tagify) {
    var all = getTagifyValues(tagify);
    var primary = all.length ? all[0] : '';
    var seen = primary ? { } : {};
    if (primary) seen[primary.toLowerCase()] = true;
    var alias = [];
    for (var i = 1; i < all.length; i++) {
      var key = all[i].toLowerCase();
      if (seen[key]) continue;
      seen[key] = true;
      alias.push(all[i]);
    }
    return { primary: primary, alias: alias };
  }

  function resetForm() {
    var form = document.getElementById('dmk-form');
    form.reset();
    form.classList.remove('was-validated');
    $(form).find('[name="nid"]').val('');
    $('#dmk-diem-dau-error, #dmk-diem-cuoi-error').addClass('d-none');
    setTagifyValue(tagifyDiemDau, []);
    setTagifyValue(tagifyDiemCuoi, []);
  }

  function populateForm(row) {
    var form = $('#dmk-form');
    form.find('[name="nid"]').val(row.nid || '');
    form.find('[name="khoang_cach"]').val(row.khoang_cach || '');
    form.find('[name="gia_vo"]').val(row.gia_vo ? formatMoney(row.gia_vo) : '');
    form.find('[name="gia_hang"]').val(row.gia_hang ? formatMoney(row.gia_hang) : '');
    form.find('[name="gia_trong"]').val(row.gia_trong ? formatMoney(row.gia_trong) : '');
    // Gộp tên chính + tên gọi chung vào lại đúng 1 ô, đúng thứ tự (tên chính trước).
    var diemDauNames = row.diem_dau ? [row.diem_dau].concat(row.diem_dau_alias || []) : [];
    var diemCuoiNames = row.diem_cuoi ? [row.diem_cuoi].concat(row.diem_cuoi_alias || []) : [];
    setTagifyValue(tagifyDiemDau, diemDauNames);
    setTagifyValue(tagifyDiemCuoi, diemCuoiNames);
  }

  function openCreateModal() {
    resetForm();
    $('#dmk-modal-title').text('Thêm định mức khoán');
    showFormLoading(false);
    dmkModal().show();
    loadLocationWhitelist(initTagifyFields);
  }

  function openEditModal(id) {
    resetForm();
    $('#dmk-modal-title').text('Sửa định mức khoán');
    dmkModal().show();
    showFormLoading(true);
    loadLocationWhitelist(initTagifyFields);
    $.ajax({
      url: '/api/dinh-muc-khoan/' + id,
      dataType: 'json',
      success: function (res) {
        showFormLoading(false);
        if (res.status !== 'success') {
          if (notyf) notyf.error(res.message || 'Không tải được định mức');
          return;
        }
        // Whitelist + Tagify có thể vẫn đang tải xong sau khi dữ liệu đã về —
        // đợi initTagifyFields() chạy xong (cùng promise) rồi mới populate.
        loadLocationWhitelist(function () { populateForm(res.data); });
      },
      error: function (jqXHR) {
        showFormLoading(false);
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function gatherPayload() {
    var form = $('#dmk-form');
    var diemDau = splitPointNames(tagifyDiemDau);
    var diemCuoi = splitPointNames(tagifyDiemCuoi);
    return {
      diem_dau: diemDau.primary,
      diem_dau_alias: diemDau.alias,
      diem_cuoi: diemCuoi.primary,
      diem_cuoi_alias: diemCuoi.alias,
      khoang_cach: form.find('[name="khoang_cach"]').val().trim(),
      gia_vo: parseMoney(form.find('[name="gia_vo"]').val()),
      gia_hang: parseMoney(form.find('[name="gia_hang"]').val()),
      gia_trong: parseMoney(form.find('[name="gia_trong"]').val())
    };
  }

  function saveForm() {
    var form = document.getElementById('dmk-form');
    var hasDiemDau = splitPointNames(tagifyDiemDau).primary !== '';
    var hasDiemCuoi = splitPointNames(tagifyDiemCuoi).primary !== '';
    $('#dmk-diem-dau-error').toggleClass('d-none', hasDiemDau);
    $('#dmk-diem-cuoi-error').toggleClass('d-none', hasDiemCuoi);
    if (!hasDiemDau || !hasDiemCuoi || !form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }
    var id = $(form).find('[name="nid"]').val();
    var btn = document.getElementById('dmk-btn-save');
    btn.disabled = true;
    $.ajax({
      url: id ? '/api/dinh-muc-khoan/' + id : '/api/dinh-muc-khoan',
      // 'type', không phải 'method' — jQuery chỉ nhận 'method' làm bí danh của 'type'
      // từ bản 1.9 trở lên; jQuery mặc định 1.4.4 của Drupal 7 sẽ bỏ qua nó và luôn
      // gửi GET nếu dùng 'method'.
      type: id ? 'PUT' : 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify(gatherPayload()),
      success: function (res) {
        btn.disabled = false;
        if (res.status !== 'success') {
          if (notyf) notyf.error(res.message || 'Lưu thất bại');
          return;
        }
        if (notyf) notyf.success(id ? 'Đã cập nhật định mức' : 'Đã tạo định mức');
        dmkModal().hide();
        loadList();
      },
      error: function (jqXHR) {
        btn.disabled = false;
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function confirmDelete(id) {
    var run = function () { deleteItem(id); };
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá định mức này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) run();
      });
    } else if (confirm('Bạn có chắc chắn muốn xoá định mức này?')) {
      run();
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/dinh-muc-khoan/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success('Đã xoá');
          loadList();
        } else if (notyf) {
          notyf.error(res.message || 'Xoá thất bại');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function rowHtml(row, stt) {
    var aliasTitle = function (primary, alias) {
      var names = [primary].concat($.isArray(alias) ? alias : []);
      return names.filter(Boolean).join(', ');
    };
    return '<tr>' +
      '<td>' + stt + '</td>' +
      '<td title="' + escapeHtml(aliasTitle(row.diem_dau, row.diem_dau_alias)) + '">' + escapeHtml(row.diem_dau) +
        (row.diem_dau_alias && row.diem_dau_alias.length ? ' <span class="badge bg-label-secondary">+' + row.diem_dau_alias.length + '</span>' : '') + '</td>' +
      '<td title="' + escapeHtml(aliasTitle(row.diem_cuoi, row.diem_cuoi_alias)) + '">' + escapeHtml(row.diem_cuoi) +
        (row.diem_cuoi_alias && row.diem_cuoi_alias.length ? ' <span class="badge bg-label-secondary">+' + row.diem_cuoi_alias.length + '</span>' : '') + '</td>' +
      '<td>' + escapeHtml(row.khoang_cach || '') + '</td>' +
      '<td>' + formatMoney(row.gia_trong) + '</td>' +
      '<td>' + formatMoney(row.gia_vo) + '</td>' +
      '<td>' + formatMoney(row.gia_hang) + '</td>' +
      '<td class="text-center">' +
        '<div class="dropdown">' +
          '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
          '<ul class="dropdown-menu">' +
            '<li><a class="dropdown-item dmk-btn-sua" href="javascript:void(0)" data-id="' + row.nid + '"><i class="ti tabler-edit me-2"></i>Sửa</a></li>' +
            '<li><a class="dropdown-item text-danger dmk-btn-xoa" href="javascript:void(0)" data-id="' + row.nid + '"><i class="ti tabler-trash me-2"></i>Xoá</a></li>' +
          '</ul>' +
        '</div>' +
      '</td>' +
    '</tr>';
  }

  function renderPagination(resp) {
    var container = document.getElementById('dmk-pagination');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';
    var total = resp.total_pages || 1;
    var current = resp.current_page || 1;
    document.getElementById('dmk-pagination-info').textContent = 'Tổng số: ' + (resp.total || 0) + ' bản ghi';
    document.getElementById('dmk-pagination-total-pages').textContent = '/ ' + total;
    var jump = document.getElementById('dmk-pagination-jump');
    jump.value = current;
    jump.setAttribute('data-total-pages', total);
    container.style.display = '';

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);
    if (start > 1) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }
    if (end < total) html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';
    ul.innerHTML = html;
  }

  function loadList() {
    var tbody = document.getElementById('dmk-tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>';
    $.ajax({
      url: '/api/dinh-muc-khoan',
      dataType: 'json',
      data: { page: currentPage, limit: 50, keyword: currentKeyword },
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center text-danger py-4">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>';
          return;
        }
        var items = res.data.items || [];
        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4">Không có dữ liệu</td></tr>';
          renderPagination(res.data);
          return;
        }
        var html = '';
        var pageSize = res.data.limit || 50;
        for (var i = 0; i < items.length; i++) {
          html += rowHtml(items[i], (res.data.current_page - 1) * pageSize + i + 1);
        }
        tbody.innerHTML = html;
        renderPagination(res.data);
      },
      error: function (jqXHR) {
        tbody.innerHTML = loadErrorRow(8, jqXHR);
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function bindEvents() {
    if (document.body.getAttribute('data-dmk-bound') === '1') return;
    document.body.setAttribute('data-dmk-bound', '1');

    document.getElementById('dmk-btn-search').addEventListener('click', function () {
      currentKeyword = document.getElementById('dmk-search').value.trim();
      currentPage = 1;
      loadList();
    });
    document.getElementById('dmk-search').addEventListener('keydown', function (e) {
      if (e.which === 13) {
        e.preventDefault();
        document.getElementById('dmk-btn-search').click();
      }
    });
    document.getElementById('dmk-btn-reload').addEventListener('click', function () {
      currentKeyword = '';
      document.getElementById('dmk-search').value = '';
      currentPage = 1;
      loadList();
    });
    document.getElementById('dmk-btn-them').addEventListener('click', openCreateModal);

    // Delegate bằng addEventListener + closest() thuần, không dùng $(document).on()
    // (cần jQuery >= 1.7) — trang này đôi lúc chạy jQuery mặc định 1.4.4 của Drupal 7.
    document.addEventListener('click', function (e) {
      var t = e.target;
      var sua = t.closest ? t.closest('#dmk-tbody .dmk-btn-sua') : null;
      if (sua) {
        openEditModal(sua.getAttribute('data-id'));
        return;
      }
      var xoa = t.closest ? t.closest('#dmk-tbody .dmk-btn-xoa') : null;
      if (xoa) {
        confirmDelete(xoa.getAttribute('data-id'));
        return;
      }
      var pageLink = t.closest ? t.closest('#dmk-pagination .page-link') : null;
      if (pageLink) {
        e.preventDefault();
        var page = parseInt(pageLink.getAttribute('data-page'), 10);
        if (!page || page === currentPage) return;
        currentPage = page;
        loadList();
      }
    });
    document.getElementById('dmk-pagination').addEventListener('keydown', function (e) {
      var t = e.target;
      if (!t || t.id !== 'dmk-pagination-jump' || e.which !== 13) return;
      var total = parseInt(t.getAttribute('data-total-pages'), 10) || 1;
      var page = Math.min(total, Math.max(1, parseInt(t.value, 10) || 1));
      currentPage = page;
      loadList();
    });

    document.getElementById('dmk-form').addEventListener('submit', function (e) {
      e.preventDefault();
      saveForm();
    });
    document.getElementById('dmk-form').addEventListener('keydown', function (e) {
      if (e.which !== 13) return;
      // Enter trong ô Tagify là để chọn gợi ý/chốt tag đang gõ, không phải lưu form —
      // để Tagify tự xử lý (nó tự preventDefault khi cần), không click hộ nút Lưu.
      if (e.target.closest && e.target.closest('.tagify')) return;
      var tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'textarea' || tag === 'button' || e.target.type === 'submit') return;
      e.preventDefault();
      document.getElementById('dmk-btn-save').click();
    });

    document.getElementById('dmk-modal').addEventListener('shown.bs.modal', initMoneyMasks);
  }

  Drupal.behaviors.dinhMucKhoan = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }
      if ($('#dmk-table', context).length) {
        loadList();
        bindEvents();
      }
    }
  };

})(jQuery, Drupal);

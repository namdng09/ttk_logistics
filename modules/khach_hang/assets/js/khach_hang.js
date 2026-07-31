(function bootKhachHang(window) {
  if (!window.jQuery || !window.Drupal) {
    window.setTimeout(function () {
      bootKhachHang(window);
    }, 30);
    return;
  }

  (function ($, Drupal) {
  'use strict';

  var notyf;
  var KHACH_HANG_INITIALIZED = false;
  var currentPage = 1;
  var currentKeyword = '';
  var currentPhanLoai = '';
  var tagifyPhanLoai = null;
  var NV_KINH_DOANH_MAP = {};
  var PHAN_LOAI_LIST = ['Doanh nghiệp', 'Cá nhân', 'Khách hàng', 'Nhà cung cấp', 'Đối tác', 'Khác'];
  var BANK_LIST = [];
  var BANK_LIST_LOADED = false;
  var DIADIEM_LIST = [];
  var NV_KINH_DOANH_LOADED = false;
  var DIADIEM_LIST_LOADED = false;
  var DINH_MUC_LOCATION_LIST = [];
  var DINH_MUC_LOCATION_LIST_LOADED = false;
  var FORM_SUPPORT_DATA_LOADED = false;
  var FORM_SUPPORT_DATA_LOADING = false;
  var FORM_SUPPORT_DATA_CALLBACKS = [];
  var moneyFormatter = new Intl.NumberFormat('vi-VN');
  var DINH_MUC_STATE = {
    customerId: 0,
    customerName: '',
    original: null,
    data: { locations: [], routes: {} },
    changed: false
  };

  function modalShow(id) {
    var el = document.getElementById(id);
    if (el) new bootstrap.Modal(el).show();
  }
  function modalHide(id) {
    var el = document.getElementById(id);
    if (el) {
      var m = bootstrap.Modal.getInstance(el);
      if (m) m.hide();
    }
  }

  function initKhachHang(context) {
    context = context || document;
    if (KHACH_HANG_INITIALIZED || !$('#table-khach-hang', context).length) return;
    KHACH_HANG_INITIALIZED = true;

    if (typeof Notyf !== 'undefined' && !notyf) {
      notyf = new Notyf();
    }

    loadList();
    bindNativeEvents();
  }

  Drupal.behaviors.khachHang = {
    attach: function (context, settings) {
      initKhachHang(context);
    }
  };

  $(function () {
    initKhachHang(document);
  });

  function bindNativeEvents() {
    var doc = document;

    // Search
    doc.getElementById('btn-search-khach-hang').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-khach-hang').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-khach-hang').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    // Filter phan loai
    doc.getElementById('filter-phan-loai').addEventListener('change', function () {
      currentPhanLoai = this.value;
      currentPage = 1;
      loadList();
    });

    // Enter key submit
    doc.getElementById('form-khach-hang').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-khach-hang');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-khach-hang');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentPhanLoai = '';
        doc.getElementById('search-khach-hang').value = '';
        doc.getElementById('filter-phan-loai').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-khach-hang');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
        ensureFormSupportData(function () {
          initRepeater();
        });
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-khach-hang');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('khach-hang-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initTagify();
      initDatePickers();
    });

    // Add bank info row
    var btnThemNh = doc.getElementById('btn-them-ngan-hang');
    if (btnThemNh) {
      btnThemNh.addEventListener('click', function () {
        addNganHangRow();
      });
    }

    // Add warehouse
    var btnThemKho = doc.getElementById('btn-them-kho');
    if (btnThemKho) {
      btnThemKho.addEventListener('click', function () {
        addWarehouse();
      });
    }

    // Delegated clicks
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-khach-hang')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-khach-hang')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-dinh-muc-khach-hang')) {
            e.preventDefault();
            openDinhMucModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-khach-hang')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-xoa-ngan-hang')) {
            e.preventDefault();
            var row = t.closest('.ngan-hang-row');
            if (row) {
              var sel = row.querySelector('.ngan-hang-ten-ngan-hang');
              if (sel && typeof $ === 'function' && $.fn.select2) {
                $(sel).select2('destroy');
              }
              row.remove();
            }
            return;
          }
          if (t.classList.contains('btn-xoa-kho')) {
            e.preventDefault();
            if (confirm('Bạn có chắc muốn xóa kho và toàn bộ bảng giá của kho này?')) {
              var card = t.closest('.kho-card');
              if (card) {
                card.querySelectorAll('.kho-dia-chi').forEach(function (sel) {
                  if (typeof $ === 'function' && $.fn.select2 && $(sel).data('select2')) {
                    $(sel).select2('destroy');
                  }
                });
                card.remove();
              }
            }
            return;
          }
          if (t.classList.contains('btn-them-dong-gia')) {
            e.preventDefault();
            var kCard = t.closest('.kho-card');
            if (kCard) addPriceRow(kCard);
            return;
          }
          if (t.classList.contains('btn-xoa-dong-gia')) {
            e.preventDefault();
            var kCard2 = t.closest('.kho-card');
            t.closest('tr').remove();
            if (kCard2) refreshKhoSummary(kCard2);
            return;
          }
          if (t.classList.contains('kh-dm-remove-location')) {
            e.preventDefault();
            removeDinhMucLocation(t.getAttribute('data-location'));
            return;
          }
          if (t.classList.contains('page-link')) {
            var pageLink = parseInt(t.getAttribute('data-page'));
            if (pageLink && pageLink !== currentPage) {
              e.preventDefault();
              currentPage = pageLink;
              loadList();
            }
            return;
          }
        }
        t = t.parentElement;
      }
    });

    // Delegated change on money inputs and checkboxes
    doc.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('dg-hoat-dong')) {
        // no-op, just checkbox
      }
    });

    doc.addEventListener('input', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('dg-don-gia')) {
        var kCard = t.closest('.kho-card');
        if (kCard) refreshKhoSummary(kCard);
      }
      if (t && t.classList && t.classList.contains('kh-dm-route-input')) {
        updateDinhMucRouteInput(t);
      }
    });

    doc.addEventListener('blur', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('money-input')) {
        formatMoneyInput(t);
      }
    }, true);

    var dmAdd = doc.getElementById('kh-dm-add-location');
    if (dmAdd) dmAdd.addEventListener('click', addDinhMucLocation);
    var dmNew = doc.getElementById('kh-dm-new-location');
    if (dmNew) {
      dmNew.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          addDinhMucLocation();
        }
      });
    }
    var dmCopy = doc.getElementById('kh-dm-copy-opposite');
    if (dmCopy) dmCopy.addEventListener('click', copyDinhMucOpposite);
    var dmSave = doc.getElementById('kh-dm-save');
    if (dmSave) dmSave.addEventListener('click', saveDinhMucData);
    var dmTable = doc.getElementById('kh-dm-matrix-table');
    if (dmTable) {
      dmTable.addEventListener('mouseover', handleDinhMucMatrixHover);
      dmTable.addEventListener('mouseleave', clearDinhMucMatrixHover);
    }

    // Dropdown hover
    doc.addEventListener('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-khach-hang-tbody')) {
        var menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          var btn = dropdown.querySelector('button');
          var rect = btn.getBoundingClientRect();
          menu.style.position = 'fixed';
          menu.style.top = rect.top + 'px';
          menu.style.left = rect.right + 'px';
          menu.style.display = 'block';
        }
      }
    });

    doc.addEventListener('mouseout', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#table-khach-hang-tbody')) {
        if (!dropdown.contains(e.relatedTarget)) {
          var menu = dropdown.querySelector('.dropdown-menu');
          if (menu) {
            menu.style.display = '';
            menu.style.position = '';
            menu.style.top = '';
            menu.style.left = '';
          }
        }
      }
    });

    // Pagination jump keypress
    doc.getElementById('pagination-jump').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value);
        var total = parseInt(this.getAttribute('data-total-pages'));
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });
  }

  /* =====================================================
     Money helpers
     ===================================================== */

  function parseMoney(value) {
    return Number(String(value || '').replace(/\D/g, '')) || 0;
  }

  function formatMoneyInput(input) {
    var number = parseMoney(input.value);
    input.value = number ? moneyFormatter.format(number) : '';
  }

  function formatMoneyValue(n) {
    if (!n) return '';
    return moneyFormatter.format(n);
  }

  /* =====================================================
     NV Kinh Doanh
     ===================================================== */

  function loadNvKinhDoanh() {
    if (NV_KINH_DOANH_LOADED) return;
    $.ajax({
      url: '/api/nhan-vien',
      type: 'GET',
      dataType: 'json',
      data: { limit: 100, chuc_vu: 28 },
      success: function (res) {
        if (res.status === 'success' && res.data) {
          var items = res.data.items || [];
          var map = {};
          var sel = document.getElementById('nv-kinh-doanh-select');
          if (!sel) return;
          sel.innerHTML = '<option value="">Chọn nhân viên</option>';
          for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var text = item.ten || item.name || '';
            if (item.ma_nhan_vien) text += ' - ' + item.ma_nhan_vien;
            map[String(item.uid)] = text;
            var opt = document.createElement('option');
            opt.value = item.uid;
            opt.textContent = text;
            sel.appendChild(opt);
          }
          NV_KINH_DOANH_MAP = map;
          NV_KINH_DOANH_LOADED = true;
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  /* =====================================================
     Tagify (Phân loại)
     ===================================================== */

  function initTagify() {
    var el = document.getElementById('tagifyPhanLoai');
    if (!el) return;
    if (tagifyPhanLoai) return;
    tagifyPhanLoai = new Tagify(el, {
      whitelist: PHAN_LOAI_LIST,
      enforceWhitelist: true,
      maxTags: 10,
      dropdown: {
        maxItems: 20,
        enabled: 0,
        closeOnSelect: false
      }
    });
    tagifyPhanLoai.on('change', function () {
      var wrapper = el.closest('.tagify');
      if (wrapper) wrapper.classList.remove('is-invalid');
    });
  }

  function getTagifyValue() {
    if (!tagifyPhanLoai) return [];
    return tagifyPhanLoai.value.map(function (t) { return t.value; });
  }

  function setTagifyValue(arr) {
    if (!tagifyPhanLoai) return;
    var el = document.getElementById('tagifyPhanLoai');
    if (el) {
      var wrapper = el.closest('.tagify');
      if (wrapper) wrapper.classList.remove('is-invalid');
    }
    tagifyPhanLoai.removeAllTags();
    if (arr && arr.length) {
      tagifyPhanLoai.addTags(arr);
    }
  }

  function destroyTagify() {
    if (tagifyPhanLoai) {
      tagifyPhanLoai.destroy();
      tagifyPhanLoai = null;
    }
  }

  /* =====================================================
     NV Kinh Doanh select
     ===================================================== */

  function getNvKdValue() {
    var sel = document.getElementById('nv-kinh-doanh-select');
    if (!sel) return [];
    var val = sel.value;
    return val ? [parseInt(val)] : [];
  }

  function setNvKdValue(uid) {
    var sel = document.getElementById('nv-kinh-doanh-select');
    if (!sel) return;
    if (!uid) {
      sel.value = '';
      return;
    }
    uid = String(uid);
    var opt = sel.querySelector('option[value="' + uid + '"]');
    if (opt) {
      sel.value = uid;
    } else {
      var text = NV_KINH_DOANH_MAP[uid] || 'NV #' + uid;
      var newOpt = document.createElement('option');
      newOpt.value = uid;
      newOpt.textContent = text;
      sel.appendChild(newOpt);
      sel.value = uid;
    }
  }

  /* =====================================================
     Bank info repeater
     ===================================================== */

  function initRepeater() {
    var container = document.getElementById('ngan-hang-repeater');
    if (!container) return;
    container.innerHTML = '';
    var headerHtml = '<div class="row g-2 mb-1">' +
      '<div class="col-md-3"><label class="form-label mb-0">Tên tài khoản</label></div>' +
      '<div class="col-md-4"><label class="form-label mb-0">Số tài khoản</label></div>' +
      '<div class="col-md-4"><label class="form-label mb-0">Ngân hàng</label></div>' +
      '<div class="col-md-1"></div>' +
    '</div>';
    container.innerHTML = headerHtml;
    addNganHangRow();
  }

  function addNganHangRow(data) {
    var container = document.getElementById('ngan-hang-repeater');
    if (!container) return;
    var html = '<div class="ngan-hang-row row g-2 mb-2">' +
      '<div class="col-md-3">' +
        '<input type="text" class="form-control nganh-hang-ten-tai-khoan" placeholder="Tên TK">' +
      '</div>' +
      '<div class="col-md-4">' +
        '<input type="text" class="form-control ngan-hang-so-tai-khoan" placeholder="Số TK">' +
      '</div>' +
      '<div class="col-md-4">' +
        '<select class="form-select ngan-hang-ten-ngan-hang" style="width:100%">' +
          '<option value="">Chọn ngân hàng</option>' +
        '</select>' +
      '</div>' +
      '<div class="col-md-1">' +
        '<button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-ngan-hang"><i class="ti tabler-x"></i></button>' +
      '</div>' +
    '</div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    var row = div.querySelector('.ngan-hang-row');
    container.appendChild(row);
    var sel = row.querySelector('.ngan-hang-ten-ngan-hang');
    initBankSelect(sel, data ? data.ngan_hang : null);
    if (data) {
      row.querySelector('.nganh-hang-ten-tai-khoan').value = data.ten_tai_khoan || '';
      row.querySelector('.ngan-hang-so-tai-khoan').value = data.so_tai_khoan || '';
    }
  }

  function collectNganHang() {
    var rows = document.querySelectorAll('#ngan-hang-repeater .ngan-hang-row');
    var result = [];
    for (var i = 0; i < rows.length; i++) {
      var ten = rows[i].querySelector('.nganh-hang-ten-tai-khoan').value.trim();
      var so = rows[i].querySelector('.ngan-hang-so-tai-khoan').value.trim();
      var sel = rows[i].querySelector('.ngan-hang-ten-ngan-hang');
      var nh = sel ? sel.value.trim() : '';
      if (ten || so || nh) {
        result.push({ ten_tai_khoan: ten, so_tai_khoan: so, ngan_hang: nh });
      }
    }
    return result;
  }

  function loadBankList(done) {
    if (BANK_LIST_LOADED) {
      if (done) done();
      return;
    }
    var cached = localStorage.getItem('bankList');
    if (cached) {
      try { BANK_LIST = JSON.parse(cached); BANK_LIST_LOADED = true; } catch (e) {}
    }
    if (BANK_LIST_LOADED) {
      if (done) done();
      return;
    }
    $.ajax({
      url: 'https://api.vietqr.io/v2/banks',
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res && res.data && res.data.length) {
          BANK_LIST = res.data;
          BANK_LIST_LOADED = true;
          try { localStorage.setItem('bankList', JSON.stringify(res.data)); } catch (e) {}
          var selects = document.querySelectorAll('.ngan-hang-ten-ngan-hang');
          for (var i = 0; i < selects.length; i++) {
            var curVal = selects[i].value;
            initBankSelect(selects[i], curVal || null);
          }
        }
      },
      error: function () {},
      complete: function () {
        if (done) done();
      }
    });
  }

  function initBankSelect(selEl, value) {
    selEl.innerHTML = '<option value="">Chọn ngân hàng</option>';
    for (var i = 0; i < BANK_LIST.length; i++) {
      var b = BANK_LIST[i];
      var opt = document.createElement('option');
      opt.value = b.shortName;
      opt.textContent = b.shortName + ' - ' + b.name;
      selEl.appendChild(opt);
    }
    if (value) {
      var found = false;
      for (var j = 0; j < selEl.options.length; j++) {
        if (selEl.options[j].value === value || selEl.options[j].textContent.indexOf(value) !== -1) {
          selEl.value = selEl.options[j].value;
          found = true;
          break;
        }
      }
      if (!found) {
        var newOpt = document.createElement('option');
        newOpt.value = value;
        newOpt.textContent = value;
        selEl.appendChild(newOpt);
        selEl.value = value;
      }
    }
    var $jq = _jqSelect2();
    if ($jq) {
      var $sel = $jq(selEl);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#khach-hang-modal'),
        placeholder: 'Chọn ngân hàng',
        allowClear: true,
        width: '100%'
      });
    }
  }

  /* =====================================================
     Dia Diem (for warehouse address selects)
     ===================================================== */

  function loadDiaDiem() {
    if (DIADIEM_LIST_LOADED) return;
    $.ajax({
      url: '/api/danh-muc',
      type: 'GET',
      dataType: 'json',
      data: { phan_loai: 'Kho', limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          var names = [];
          for (var i = 0; i < res.data.items.length; i++) {
            var ten = res.data.items[i].ten;
            if (ten) names.push(ten);
          }
          DIADIEM_LIST = names;
          DIADIEM_LIST_LOADED = true;
          var selects = document.querySelectorAll('.kho-dia-chi');
          for (var j = 0; j < selects.length; j++) {
            var curVal = selects[j].value;
            initDiaDiemSelect(selects[j], curVal || null);
          }
        }
      },
      error: function () {}
    });
  }

  function ensureFormSupportData(callback) {
    if (FORM_SUPPORT_DATA_LOADED) {
      if (callback) callback();
      return;
    }

    if (callback) {
      FORM_SUPPORT_DATA_CALLBACKS.push(callback);
    }

    if (FORM_SUPPORT_DATA_LOADING) {
      return;
    }

    FORM_SUPPORT_DATA_LOADING = true;

    var remaining = 3;
    function finishOne() {
      remaining--;
      if (remaining > 0) return;

      FORM_SUPPORT_DATA_LOADING = false;
      FORM_SUPPORT_DATA_LOADED = true;

      var bankSelects = document.querySelectorAll('#form-khach-hang .ngan-hang-ten-ngan-hang');
      for (var i = 0; i < bankSelects.length; i++) {
        var bankVal = bankSelects[i].value;
        initBankSelect(bankSelects[i], bankVal || null);
      }

      var diaDiemSelects = document.querySelectorAll('#form-khach-hang .kho-dia-chi');
      for (var j = 0; j < diaDiemSelects.length; j++) {
        var diaDiemVal = diaDiemSelects[j].value;
        initDiaDiemSelect(diaDiemSelects[j], diaDiemVal || null);
      }

      var callbacks = FORM_SUPPORT_DATA_CALLBACKS.slice();
      FORM_SUPPORT_DATA_CALLBACKS = [];
      for (var k = 0; k < callbacks.length; k++) {
        callbacks[k]();
      }
    }

    function finishNv() {
      if (NV_KINH_DOANH_LOADED) {
        finishOne();
        return;
      }
      $.ajax({
        url: '/api/nhan-vien',
        type: 'GET',
        dataType: 'json',
        data: { limit: 100, chuc_vu: 28 },
        success: function (res) {
          if (res.status === 'success' && res.data) {
            var items = res.data.items || [];
            var map = {};
            var sel = document.getElementById('nv-kinh-doanh-select');
            if (sel) {
              sel.innerHTML = '<option value="">Chọn nhân viên</option>';
              for (var i = 0; i < items.length; i++) {
                var item = items[i];
                var text = item.ten || item.name || '';
                if (item.ma_nhan_vien) text += ' - ' + item.ma_nhan_vien;
                map[String(item.uid)] = text;
                var opt = document.createElement('option');
                opt.value = item.uid;
                opt.textContent = text;
                sel.appendChild(opt);
              }
            }
            NV_KINH_DOANH_MAP = map;
            NV_KINH_DOANH_LOADED = true;
          }
        },
        error: function (jqXHR) {
          if (notyf) notyf.error(apiMsg(jqXHR));
        },
        complete: finishOne
      });
    }

    function finishDiaDiem() {
      if (DIADIEM_LIST_LOADED) {
        finishOne();
        return;
      }
      $.ajax({
        url: '/api/danh-muc',
        type: 'GET',
        dataType: 'json',
        data: { phan_loai: 'Kho', limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            var names = [];
            for (var i = 0; i < res.data.items.length; i++) {
              var ten = res.data.items[i].ten;
              if (ten) names.push(ten);
            }
            DIADIEM_LIST = names;
            DIADIEM_LIST_LOADED = true;
          }
        },
        complete: finishOne
      });
    }

    loadBankList(finishOne);
    finishNv();
    finishDiaDiem();
  }

  function initDiaDiemSelect(selEl, value) {
    selEl.innerHTML = '<option value="">Chọn/Nhập kho</option>';
    for (var i = 0; i < DIADIEM_LIST.length; i++) {
      var opt = document.createElement('option');
      opt.value = DIADIEM_LIST[i];
      opt.textContent = DIADIEM_LIST[i];
      selEl.appendChild(opt);
    }
    if (value) {
      selEl.value = value;
      if (!selEl.value) {
        var newOpt = document.createElement('option');
        newOpt.value = value;
        newOpt.textContent = value;
        selEl.appendChild(newOpt);
        selEl.value = value;
      }
    }
    var $jq = _jqSelect2();
    if ($jq) {
      var $sel = $jq(selEl);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#khach-hang-modal'),
        placeholder: 'Chọn/Nhập kho',
        allowClear: true,
        tags: true,
        width: '100%'
      });
    }
  }

  function _jqSelect2() {
    if (typeof $ === 'function' && typeof $.fn.select2 === 'function') return $;
    if (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function') return jQuery;
    return null;
  }

  /* =====================================================
     Warehouse + Pricing (bang_gia_cuoc)
     ===================================================== */

  function addWarehouse(data) {
    var tpl = document.getElementById('tpl-kho-card');
    var div = document.createElement('div');
    div.innerHTML = tpl.innerHTML;
    var card = div.querySelector('.kho-card');

    var sel = card.querySelector('.kho-dia-chi');
    initDiaDiemSelect(sel, data ? data.dia_chi : null);

    if (data) {
      card.querySelector('.kho-khoang-cach').value = data.khoang_cach || '';
      var prices = data.bang_gia && data.bang_gia.length ? data.bang_gia : [];
      if (prices.length) {
        for (var i = 0; i < prices.length; i++) {
          addPriceRow(card, prices[i]);
        }
      } else {
        addPriceRow(card);
      }
    } else {
      addPriceRow(card);
    }

    document.getElementById('kho-list').appendChild(card);
    refreshKhoSummary(card);
  }

  function addPriceRow($warehouse, data) {
    var tpl = document.getElementById('tpl-dong-gia');
    var wrapper = document.createElement('div');
    wrapper.innerHTML = '<table><tbody>' + tpl.innerHTML + '</tbody></table>';
    var row = wrapper.querySelector('tr');
    if (data) {
      var loaiContSel = row.querySelector('.dg-loai-cont');
      if (loaiContSel && data.loai_cont) loaiContSel.value = data.loai_cont;

      var donGia = row.querySelector('.dg-don-gia');
      if (donGia && data.don_gia_chua_vat) donGia.value = data.don_gia_chua_vat ? moneyFormatter.format(data.don_gia_chua_vat) : '';

      var phiNeo = row.querySelector('.dg-phi-neo-xe');
      if (phiNeo && data.phi_neo_xe) phiNeo.value = data.phi_neo_xe ? moneyFormatter.format(data.phi_neo_xe) : '';

      var phuPhi = row.querySelector('.dg-phu-phi-1');
      if (phuPhi && data.phu_phi_1) phuPhi.value = data.phu_phi_1 ? moneyFormatter.format(data.phu_phi_1) : '';

      var congNoSel = row.querySelector('.dg-loai-cong-no');
      if (congNoSel && data.loai_cong_no) congNoSel.value = data.loai_cong_no;

      var tongPhuCap = row.querySelector('.dg-tong-phu-cap');
      if (tongPhuCap && data.tong_phu_cap) tongPhuCap.value = data.tong_phu_cap ? moneyFormatter.format(data.tong_phu_cap) : '';

      var tienAn = row.querySelector('.dg-tien-an');
      if (tienAn && data.tien_an) tienAn.value = data.tien_an ? moneyFormatter.format(data.tien_an) : '';

      var veCaDuong = row.querySelector('.dg-ve-cau-duong');
      if (veCaDuong && data.ve_cau_duong) veCaDuong.value = data.ve_cau_duong ? moneyFormatter.format(data.ve_cau_duong) : '';

      var tienDau = row.querySelector('.dg-tien-dau');
      if (tienDau && data.tien_dau) tienDau.value = data.tien_dau ? moneyFormatter.format(data.tien_dau) : '';

      var luongCL = row.querySelector('.dg-luong-con-lai');
      if (luongCL && data.luong_con_lai) luongCL.value = data.luong_con_lai ? moneyFormatter.format(data.luong_con_lai) : '';

      var hd = row.querySelector('.dg-hoat-dong');
      if (hd) hd.checked = data.hoat_dong !== 0;
    }

    var tbody = $warehouse.querySelector('tbody');
    tbody.appendChild(row);
  }

  function refreshKhoSummary($warehouse) {
    var prices = [];
    $warehouse.querySelectorAll('.dg-don-gia').forEach(function (inp) {
      var val = parseMoney(inp.value);
      if (val > 0) prices.push(val);
    });

    var countEl = $warehouse.querySelector('.kho-summary-count');
    var minEl = $warehouse.querySelector('.kho-summary-min');
    var maxEl = $warehouse.querySelector('.kho-summary-max');

    if (countEl) countEl.textContent = $warehouse.querySelectorAll('tbody tr').length;
    if (minEl) minEl.textContent = prices.length ? moneyFormatter.format(Math.min.apply(null, prices)) + ' đ' : '0 đ';
    if (maxEl) maxEl.textContent = prices.length ? moneyFormatter.format(Math.max.apply(null, prices)) + ' đ' : '0 đ';
  }

  function collectBangGiaCuoc() {
    var result = [];
    var cards = document.querySelectorAll('#kho-list .kho-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var diaChiSel = card.querySelector('.kho-dia-chi');
      var diaChi = diaChiSel ? diaChiSel.value.trim() : '';
      var kcInput = card.querySelector('.kho-khoang-cach');
      var khoangCach = kcInput ? kcInput.value.trim() : '';

      var bangGia = [];
      var rows = card.querySelectorAll('tbody tr');
      for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        var loaiCont = row.querySelector('.dg-loai-cont').value;
        var donGia = parseMoney(row.querySelector('.dg-don-gia').value);
        var phiNeo = parseMoney(row.querySelector('.dg-phi-neo-xe').value);
        var phuPhi1 = parseMoney(row.querySelector('.dg-phu-phi-1').value);
        var loaiCN = row.querySelector('.dg-loai-cong-no').value;
        var tongPC = parseMoney(row.querySelector('.dg-tong-phu-cap').value);
        var tienAn = parseMoney(row.querySelector('.dg-tien-an').value);
        var veCD = parseMoney(row.querySelector('.dg-ve-cau-duong').value);
        var tienDau = parseMoney(row.querySelector('.dg-tien-dau').value);
        var luongCL = parseMoney(row.querySelector('.dg-luong-con-lai').value);
        var hd = row.querySelector('.dg-hoat-dong').checked ? 1 : 0;

        bangGia.push({
          loai_cont: loaiCont,
          don_gia_chua_vat: donGia,
          phi_neo_xe: phiNeo,
          phu_phi_1: phuPhi1,
          loai_cong_no: loaiCN,
          tong_phu_cap: tongPC,
          tien_an: tienAn,
          ve_cau_duong: veCD,
          tien_dau: tienDau,
          luong_con_lai: luongCL,
          hoat_dong: hd
        });
      }

      if (diaChi || bangGia.length > 0) {
        result.push({
          dia_chi: diaChi,
          khoang_cach: khoangCach,
          bang_gia: bangGia
        });
      }
    }
    return result;
  }

  function emptyBangGiaCuocConfig() {
    return {
      bang_gia_cuoc: [],
      dinh_muc: {
        locations: [],
        routes: {}
      }
    };
  }

  function getBangGiaCuocItems(config) {
    return config && config.bang_gia_cuoc && config.bang_gia_cuoc.length ? config.bang_gia_cuoc : [];
  }

  /* =====================================================
     Submit
     ===================================================== */

  function submitForm() {
    var form = document.getElementById('form-khach-hang');

    var phanLoai = getTagifyValue();
    if (!phanLoai || phanLoai.length === 0) {
      form.classList.add('was-validated');
      var tagifyEl = document.querySelector('#tagifyPhanLoai');
      if (tagifyEl) {
        var wrapper = tagifyEl.closest('.tagify');
        if (wrapper) wrapper.classList.add('is-invalid');
      }
      if (notyf) notyf.error('Vui lòng chọn phân loại');
      return;
    }

    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var nid = document.querySelector('#form-khach-hang input[name="nid"]').value;
    var phanLoaiVal = getTagifyValue();
    var nvKdVal = getNvKdValue();

    var apiData = {
      ten: document.querySelector('#form-khach-hang input[name="ten"]').value,
      ma_kh: document.querySelector('#form-khach-hang input[name="ma_kh"]').value,
      phan_loai: phanLoaiVal,
      cccd_mst: document.querySelector('#form-khach-hang input[name="cccd_mst"]').value,
      sdt: document.querySelector('#form-khach-hang input[name="sdt"]').value,
      dia_chi: document.querySelector('#form-khach-hang input[name="dia_chi"]').value,
      thong_tin_ngan_hang: collectNganHang(),
      bang_gia_cuoc: {
        bang_gia_cuoc: collectBangGiaCuoc()
      },
      nv_kinh_doanh: nvKdVal.map(Number),
      dob: document.querySelector('#form-khach-hang input[name="dob"]').value,
      ghi_chu: document.querySelector('#form-khach-hang input[name="ghi_chu"]').value
    };

    var url = nid ? '/api/khach-hang/' + nid : '/api/khach-hang';
    var method = nid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-khach-hang');
    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';

    $.ajax({
      url: url,
      type: method,
      contentType: 'application/json',
      data: JSON.stringify(apiData),
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status === 'success') {
          if (notyf) notyf.success(nid ? 'Cập nhật thành công' : 'Tạo mới thành công');
          modalHide('khach-hang-modal');
          resetForm();
          loadList();
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function (jqXHR) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  /* =====================================================
     Load list
     ===================================================== */

  function loadList() {
    var tbody = $('#table-khach-hang-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="11" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    var params = { page: currentPage, keyword: currentKeyword };
    if (currentPhanLoai) {
      params.phan_loai = currentPhanLoai;
    }

    $.ajax({
      url: '/api/khach-hang',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="11" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="11" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.nid);
          var phanLoaiHtml = escapeHtml(item.phan_loai || '');
          var nvKdHtml = '';
          if (item.nv_kinh_doanh) {
            var nvText = item.nv_kinh_doanh.ten || '';
            if (item.nv_kinh_doanh.ma_nhan_vien) nvText += ' - ' + item.nv_kinh_doanh.ma_nhan_vien;
            nvKdHtml = escapeHtml(nvText);
          }
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + escapeHtml(item.ten || '') + '</td>' +
            '<td>' + escapeHtml(item.ma_kh || '') + '</td>' +
            '<td>' + escapeHtml(item.cccd_mst || '') + '</td>' +
            '<td>' + escapeHtml(item.sdt || '') + '</td>' +
            '<td>' + escapeHtml(item.dia_chi || '') + '</td>' +
            '<td>' + nvKdHtml + '</td>' +
            '<td>' + (item.dob || '') + '</td>' +
            '<td>' + phanLoaiHtml + '</td>' +
            '<td>' + escapeHtml(item.ghi_chu || '') + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="11" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(nid) {
    var perms = Drupal.settings.khach_hang && Drupal.settings.khach_hang.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.khach_hang_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-khach-hang" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.khach_hang_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-khach-hang" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
      items += '<li><button type="button" class="dropdown-item btn-dinh-muc-khach-hang" data-id="' + nid + '"><i class="ti tabler-map-dollar me-2"></i>Định mức</button></li>';
    }
    if (perms.khach_hang_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-khach-hang" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-khach-hang');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var total = data.total_pages || 0;
    var current = data.current_page || 0;
    var totalItems = data.total || 0;

    document.getElementById('pagination-info').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('pagination-total-pages').textContent = '/ ' + total;

    var jumpInput = document.getElementById('pagination-jump');
    jumpInput.value = current;
    jumpInput.setAttribute('data-total-pages', total);

    container.style.display = '';

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-first" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-prev" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';

    var start = Math.max(1, current - 2);
    var end = Math.min(total, current + 2);

    if (start > 1) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }

    if (end < total) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-next" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link page-last" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';

    ul.innerHTML = html;
  }

  /* =====================================================
     Modal: View / Edit
     ===================================================== */

  function showLoading(show) {
    var loading = document.getElementById('modal-loading');
    loading.style.display = show ? '' : 'none';
  }

  function openViewModal(id) {
    setFormMode('view');
    document.getElementById('khach-hang-modal-title').textContent = 'Chi tiết khách hàng';
    document.querySelector('.btn-luu-khach-hang').style.display = 'none';
    showLoading(true);
    modalShow('khach-hang-modal');

    $.ajax({
      url: '/api/khach-hang/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        initTagify();
        initRepeater();
        populateForm(res.data);
        setFormMode('view');
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('khach-hang-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('khach-hang-modal-title').textContent = 'Cập nhật khách hàng';
    document.querySelector('#form-khach-hang input[name="nid"]').value = id;
    var btn = document.querySelector('.btn-luu-khach-hang');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    showLoading(true);
    modalShow('khach-hang-modal');

    var detailData = null;
    var detailLoaded = false;
    var supportLoaded = false;
    var detailFailed = false;

    function finalizeEditModal() {
      if (detailFailed || !detailLoaded || !supportLoaded) return;
      showLoading(false);
      initTagify();
      initRepeater();
      populateForm(detailData);
      setFormMode('edit');
    }

    ensureFormSupportData(function () {
      supportLoaded = true;
      finalizeEditModal();
    });

    $.ajax({
      url: '/api/khach-hang/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          detailFailed = true;
          showLoading(false);
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('khach-hang-modal');
          return;
        }
        detailData = res.data;
        detailLoaded = true;
        finalizeEditModal();
      },
      error: function (jqXHR) {
        detailFailed = true;
        showLoading(false);
        modalHide('khach-hang-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  /* =====================================================
     Form mode / populate / reset
     ===================================================== */

  function setFormMode(mode) {
    var inputs = document.querySelectorAll('#form-khach-hang input, #form-khach-hang select, #form-khach-hang textarea');
    var btn = document.querySelector('.btn-luu-khach-hang');
    for (var i = 0; i < inputs.length; i++) {
      if (mode === 'view') {
        inputs[i].setAttribute('readonly', 'readonly');
        inputs[i].setAttribute('disabled', 'disabled');
        btn.style.display = 'none';
      } else {
        inputs[i].removeAttribute('readonly');
        inputs[i].removeAttribute('disabled');
        btn.style.display = '';
      }
    }
    if (mode === 'view') {
      if (tagifyPhanLoai) tagifyPhanLoai.setReadonly(true);
      var nvSel = document.getElementById('nv-kinh-doanh-select');
      if (nvSel) nvSel.setAttribute('disabled', 'disabled');
    } else {
      if (tagifyPhanLoai) tagifyPhanLoai.setReadonly(false);
      var nvSel2 = document.getElementById('nv-kinh-doanh-select');
      if (nvSel2) nvSel2.removeAttribute('disabled');
    }
    var btnThemNh = document.getElementById('btn-them-ngan-hang');
    if (btnThemNh) {
      btnThemNh.style.display = mode === 'view' ? 'none' : '';
    }
    var btnXoaNh = document.querySelectorAll('.btn-xoa-ngan-hang');
    for (var j = 0; j < btnXoaNh.length; j++) {
      btnXoaNh[j].style.display = mode === 'view' ? 'none' : '';
    }
    var btnThemKho = document.getElementById('btn-them-kho');
    if (btnThemKho) {
      btnThemKho.style.display = mode === 'view' ? 'none' : '';
    }
    var btnXoaKho = document.querySelectorAll('.btn-xoa-kho');
    for (var k = 0; k < btnXoaKho.length; k++) {
      btnXoaKho[k].style.display = mode === 'view' ? 'none' : '';
    }
    var btnThemDG = document.querySelectorAll('.btn-them-dong-gia');
    for (var l = 0; l < btnThemDG.length; l++) {
      btnThemDG[l].style.display = mode === 'view' ? 'none' : '';
    }
    var btnXoaDG = document.querySelectorAll('.btn-xoa-dong-gia');
    for (var m = 0; m < btnXoaDG.length; m++) {
      btnXoaDG[m].style.display = mode === 'view' ? 'none' : '';
    }
    // Handle Select2 bank selects
    var bankSelects = document.querySelectorAll('#form-khach-hang .ngan-hang-ten-ngan-hang');
    for (var n = 0; n < bankSelects.length; n++) {
      var $sel;
      try { $sel = $(bankSelects[n]); } catch (e) {}
      if ($sel && typeof $sel.select2 === 'function' && $sel.data && $sel.data('select2')) {
        $sel.select2(mode === 'view' ? 'disable' : 'enable');
      }
    }
    // Handle Select2 warehouse address selects
    var khoSelects = document.querySelectorAll('#form-khach-hang .kho-dia-chi');
    for (var p = 0; p < khoSelects.length; p++) {
      var $selKho;
      try { $selKho = $(khoSelects[p]); } catch (e) {}
      if ($selKho && typeof $selKho.select2 === 'function' && $selKho.data && $selKho.data('select2')) {
        $selKho.select2(mode === 'view' ? 'disable' : 'enable');
      }
    }
    // Disable pricing table inputs in view mode
    var pricingInputs = document.querySelectorAll('#form-khach-hang .kho-pricing-table input, #form-khach-hang .kho-pricing-table select');
    for (var q = 0; q < pricingInputs.length; q++) {
      if (mode === 'view') {
        pricingInputs[q].setAttribute('disabled', 'disabled');
      } else {
        pricingInputs[q].removeAttribute('disabled');
      }
    }
  }

  function resetForm() {
    showLoading(false);
    destroyTagify();
    document.getElementById('form-khach-hang').reset();
    document.querySelector('#form-khach-hang input[name="nid"]').value = '';
    var nvSel = document.getElementById('nv-kinh-doanh-select');
    if (nvSel) nvSel.value = '';
    document.getElementById('khach-hang-modal-title').textContent = 'Thêm khách hàng';
    initRepeater();
    // Reset warehouse list
    var khoList = document.getElementById('kho-list');
    if (khoList) khoList.innerHTML = '';
    addWarehouse();
    setFormMode('create');
  }

  function populateForm(d) {
    document.querySelector('#form-khach-hang input[name="nid"]').value = d.nid || '';
    document.querySelector('#form-khach-hang input[name="ten"]').value = d.ten || '';
    document.querySelector('#form-khach-hang input[name="ma_kh"]').value = d.ma_kh || '';
    document.querySelector('#form-khach-hang input[name="cccd_mst"]').value = d.cccd_mst || '';
    document.querySelector('#form-khach-hang input[name="sdt"]').value = d.sdt || '';
    document.querySelector('#form-khach-hang input[name="dia_chi"]').value = d.dia_chi || '';
    document.querySelector('#form-khach-hang input[name="dob"]').value = d.dob || '';
    document.querySelector('#form-khach-hang input[name="ghi_chu"]').value = d.ghi_chu || '';

    // Tagify phan_loai
    if (d.phan_loai) {
      setTagifyValue(d.phan_loai.split(',').map(function (s) { return s.trim(); }));
    }

    // NV kinh doanh
    if (d.nv_kinh_doanh) {
      setNvKdValue(d.nv_kinh_doanh.uid);
    }

    // Repeater ngan hang
    var nhContainer = document.getElementById('ngan-hang-repeater');
    if (nhContainer) nhContainer.innerHTML = '';
    var headerHtml = '<div class="row g-2 mb-1">' +
      '<div class="col-md-3"><label class="form-label mb-0">Tên tài khoản</label></div>' +
      '<div class="col-md-4"><label class="form-label mb-0">Số tài khoản</label></div>' +
      '<div class="col-md-4"><label class="form-label mb-0">Ngân hàng</label></div>' +
      '<div class="col-md-1"></div>' +
    '</div>';
    if (nhContainer) nhContainer.innerHTML = headerHtml;
    if (d.thong_tin_ngan_hang && d.thong_tin_ngan_hang.length) {
      for (var i = 0; i < d.thong_tin_ngan_hang.length; i++) {
        addNganHangRow(d.thong_tin_ngan_hang[i]);
      }
    } else {
      addNganHangRow();
    }

    // Warehouse + pricing (bang_gia_cuoc)
    var khoList = document.getElementById('kho-list');
    if (khoList) khoList.innerHTML = '';
    var bangGiaCuocItems = getBangGiaCuocItems(d.bang_gia_cuoc || emptyBangGiaCuocConfig());
    if (bangGiaCuocItems.length) {
      for (var j = 0; j < bangGiaCuocItems.length; j++) {
        addWarehouse(bangGiaCuocItems[j]);
      }
    } else {
      addWarehouse();
    }

    initDatePickers();
  }

  function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
      $('.flatpickr-date').each(function () {
        try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
        if (!this.hasAttribute('readonly') && !this.hasAttribute('disabled')) {
          flatpickr(this, { dateFormat: 'd/m/Y', allowInput: true, static: true });
        }
      });
    }
  }

  /* =====================================================
     Delete
     ===================================================== */

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá khách hàng này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        confirmButtonColor: '#d33',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) {
          deleteItem(id);
        }
      });
    } else {
      if (confirm('Xác nhận xoá khách hàng này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/khach-hang/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success('Xoá thành công');
          loadList();
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  /* =====================================================
     Định mức khách hàng
     ===================================================== */

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function routeKey(from, to) {
    return from + '||' + to;
  }

  function emptyRoute() {
    return { km: '', t: '', v: '', h: '' };
  }

  function setDinhMucLoading(show) {
    var loading = document.getElementById('khach-hang-dinh-muc-loading');
    var modal = document.getElementById('khach-hang-dinh-muc-modal');
    if (loading) loading.style.display = show ? '' : 'none';
    if (modal) {
      modal.querySelectorAll('input, button').forEach(function (el) {
        if (!el.classList.contains('btn-close')) el.disabled = !!show;
      });
    }
  }

  function setDinhMucStatus(text, state) {
    var el = document.getElementById('kh-dm-status');
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-unsaved', state === 'unsaved');
    el.classList.toggle('is-error', state === 'error');
  }

  function normalizeDinhMucPayload(payload) {
    payload = payload || {};
    var seen = {};
    var locations = [];
    $.each(payload.locations || [], function (_, item) {
      item = $.trim(String(item || ''));
      var key = item.toLowerCase();
      if (item && !seen[key]) {
        seen[key] = true;
        locations.push(item);
      }
    });
    return {
      locations: locations,
      routes: payload.routes || {}
    };
  }

  function openDinhMucModal(id) {
    id = parseInt(id, 10) || 0;
    if (!id) return;

    ensureDinhMucLocationSelect();
    DINH_MUC_STATE.customerId = id;
    DINH_MUC_STATE.customerName = '';
    DINH_MUC_STATE.original = null;
    DINH_MUC_STATE.data = { locations: [], routes: {} };
    DINH_MUC_STATE.changed = false;
    document.getElementById('kh-dm-customer-name').value = '';
    setDinhMucLocationValue('');
    document.getElementById('kh-dm-matrix-head').innerHTML = '';
    document.getElementById('kh-dm-matrix-body').innerHTML = '';
    setDinhMucStatus('Đã lưu');
    setDinhMucLoading(true);
    modalShow('khach-hang-dinh-muc-modal');

    $.ajax({
      url: '/api/khach-hang/' + id + '/dinh-muc',
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        setDinhMucLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tải được định mức');
          return;
        }
        DINH_MUC_STATE.customerName = res.data.khach_hang && res.data.khach_hang.ten ? res.data.khach_hang.ten : '';
        DINH_MUC_STATE.data = normalizeDinhMucPayload(res.data);
        DINH_MUC_STATE.original = cloneData(DINH_MUC_STATE.data);
        DINH_MUC_STATE.changed = false;
        document.getElementById('khach-hang-dinh-muc-title').textContent = 'Định mức - ' + DINH_MUC_STATE.customerName;
        document.getElementById('kh-dm-customer-name').value = DINH_MUC_STATE.customerName;
        renderDinhMucMatrix();
        setDinhMucStatus('Đã lưu');
      },
      error: function (jqXHR) {
        setDinhMucLoading(false);
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function renderDinhMucMatrix() {
    var locations = DINH_MUC_STATE.data.locations || [];
    var head = '<tr><th><div class="kh-dm-corner">ĐI → ĐẾN</div></th>';
    for (var i = 0; i < locations.length; i++) {
      head += '<th data-col="' + i + '"><div class="kh-dm-place-head"><span>' + escapeHtml(locations[i]) + '</span>' +
        '<button class="kh-dm-remove-location" type="button" data-location="' + escapeHtml(locations[i]) + '" title="Xóa">×</button>' +
        '</div></th>';
    }
    head += '</tr>';
    document.getElementById('kh-dm-matrix-head').innerHTML = head;

    var body = '';
    for (var r = 0; r < locations.length; r++) {
      var from = locations[r];
      body += '<tr data-row="' + r + '"><th data-row="' + r + '"><div class="kh-dm-place-row"><span>' + escapeHtml(from) + '</span></div></th>';
      for (var c = 0; c < locations.length; c++) {
        body += renderDinhMucRouteCell(from, locations[c], r, c);
      }
      body += '</tr>';
    }
    document.getElementById('kh-dm-matrix-body').innerHTML = body || '<tr><td class="text-center text-muted py-5">Thêm địa điểm để cấu hình</td></tr>';
  }

  function renderDinhMucRouteCell(from, to, rowIndex, colIndex) {
    if (from === to) {
      return '<td class="kh-dm-diagonal" data-row="' + rowIndex + '" data-col="' + colIndex + '"></td>';
    }
    var route = DINH_MUC_STATE.data.routes[routeKey(from, to)] || emptyRoute();
    return '<td data-row="' + rowIndex + '" data-col="' + colIndex + '"><div class="kh-dm-route-cell" data-from="' + escapeHtml(from) + '" data-to="' + escapeHtml(to) + '">' +
      renderDinhMucMini('km', 'KM', route.km, '0.1', '') +
      renderDinhMucMini('t', 'T', route.t, '1', ' allowance') +
      renderDinhMucMini('v', 'V', route.v, '1', ' allowance') +
      renderDinhMucMini('h', 'H', route.h, '1', ' allowance') +
      '</div></td>';
  }

  function renderDinhMucMini(field, label, value, step, extraClass) {
    var mode = field === 'km' ? 'decimal' : 'numeric';
    var displayValue = field === 'km' ? value : formatMoneyValue(value);
    return '<div class="kh-dm-mini' + extraClass + '">' +
      '<input class="kh-dm-route-input" data-field="' + field + '" type="text" inputmode="' + mode + '" pattern="[0-9]*" value="' + escapeHtml(displayValue) + '" placeholder="0" autocomplete="off">' +
      '<span>' + label + '</span>' +
      '</div>';
  }

  function initDinhMucLocationSelect() {
    var selEl = document.getElementById('kh-dm-new-location');
    if (!selEl) return;

    selEl.innerHTML = '<option></option>';
    for (var i = 0; i < DINH_MUC_LOCATION_LIST.length; i++) {
      var opt = document.createElement('option');
      opt.value = DINH_MUC_LOCATION_LIST[i];
      opt.textContent = DINH_MUC_LOCATION_LIST[i];
      selEl.appendChild(opt);
    }

    var $jq = _jqSelect2();
    if ($jq) {
      var $sel = $jq(selEl);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#khach-hang-dinh-muc-modal'),
        placeholder: 'Thêm địa điểm',
        allowClear: true,
        tags: true,
        width: '100%'
      });
    }
  }

  function ensureDinhMucLocationSelect() {
    if (DINH_MUC_LOCATION_LIST_LOADED) {
      initDinhMucLocationSelect();
      return;
    }

    var types = ['Kho', 'Cảng', 'Bãi'];
    var pending = types.length;
    var seen = {};
    var names = [];

    function collect(res) {
      if (res.status === 'success' && res.data && res.data.items) {
        for (var i = 0; i < res.data.items.length; i++) {
          var ten = $.trim(res.data.items[i].ten || '');
          var key = ten.toLowerCase();
          if (ten && !seen[key]) {
            seen[key] = true;
            names.push(ten);
          }
        }
      }
    }

    function finish() {
      pending--;
      if (pending > 0) return;
      DINH_MUC_LOCATION_LIST = names;
      DINH_MUC_LOCATION_LIST_LOADED = true;
      initDinhMucLocationSelect();
    }

    for (var i = 0; i < types.length; i++) {
      $.ajax({
        url: '/api/danh-muc',
        type: 'GET',
        dataType: 'json',
        data: { phan_loai: types[i], limit: 500 },
        success: collect,
        complete: finish
      });
    }
  }

  function getDinhMucLocationValue() {
    var selEl = document.getElementById('kh-dm-new-location');
    if (!selEl) return '';
    var $jq = _jqSelect2();
    if ($jq && $jq(selEl).data('select2')) {
      return $jq.trim($jq(selEl).val() || '');
    }
    return $.trim(selEl.value || '');
  }

  function setDinhMucLocationValue(value) {
    var selEl = document.getElementById('kh-dm-new-location');
    if (!selEl) return;
    var $jq = _jqSelect2();
    if ($jq && $jq(selEl).data('select2')) {
      $jq(selEl).val(value || null).trigger('change');
      return;
    }
    selEl.value = value || '';
  }

  function clearDinhMucMatrixHover() {
    var table = document.getElementById('kh-dm-matrix-table');
    if (!table) return;
    table.querySelectorAll('.kh-dm-highlight-row, .kh-dm-highlight-col, .kh-dm-highlight-cell').forEach(function (el) {
      el.classList.remove('kh-dm-highlight-row', 'kh-dm-highlight-col', 'kh-dm-highlight-cell');
    });
  }

  function handleDinhMucMatrixHover(e) {
    var table = document.getElementById('kh-dm-matrix-table');
    var target = e.target && e.target.closest ? e.target.closest('[data-row], [data-col]') : null;
    if (!table || !target || !table.contains(target)) return;

    clearDinhMucMatrixHover();

    var row = target.getAttribute('data-row');
    var col = target.getAttribute('data-col');
    if (row !== null) {
      table.querySelectorAll('[data-row="' + row + '"]').forEach(function (el) {
        el.classList.add('kh-dm-highlight-row');
      });
    }
    if (col !== null) {
      table.querySelectorAll('[data-col="' + col + '"]').forEach(function (el) {
        el.classList.add('kh-dm-highlight-col');
      });
    }
    if (row !== null && col !== null) {
      var cell = target.closest('td, th');
      if (cell) cell.classList.add('kh-dm-highlight-cell');
    }
  }

  function markDinhMucChanged(cell) {
    DINH_MUC_STATE.changed = true;
    setDinhMucStatus('Chưa lưu', 'unsaved');
    if (cell) cell.classList.add('is-changed');
  }

  function updateDinhMucRouteInput(input) {
    var cell = input.closest('.kh-dm-route-cell');
    if (!cell) return;
    var from = cell.getAttribute('data-from');
    var to = cell.getAttribute('data-to');
    var field = input.getAttribute('data-field');
    var rawValue = String(input.value || '');
    var cleaned = rawValue.replace(',', '.').replace(field === 'km' ? /[^0-9.]/g : /[^0-9]/g, '');
    if (field === 'km') {
      var dotIndex = cleaned.indexOf('.');
      if (dotIndex !== -1) {
        cleaned = cleaned.slice(0, dotIndex + 1) + cleaned.slice(dotIndex + 1).replace(/\./g, '');
      }
      if (input.value !== cleaned) {
        input.value = cleaned;
      }
    }
    else {
      input.value = cleaned ? moneyFormatter.format(Number(cleaned)) : '';
    }
    var key = routeKey(from, to);
    if (!DINH_MUC_STATE.data.routes[key]) {
      DINH_MUC_STATE.data.routes[key] = emptyRoute();
    }
    DINH_MUC_STATE.data.routes[key][field] = cleaned === '' ? '' : Number(cleaned);
    var route = DINH_MUC_STATE.data.routes[key];
    if (route.km === '' && route.t === '' && route.v === '' && route.h === '') {
      delete DINH_MUC_STATE.data.routes[key];
    }
    markDinhMucChanged(cell);
  }

  function addDinhMucLocation() {
    var name = getDinhMucLocationValue();
    if (!name) return;
    var exists = false;
    $.each(DINH_MUC_STATE.data.locations, function (_, item) {
      if (String(item).toLowerCase() === name.toLowerCase()) exists = true;
    });
    if (exists) {
      setDinhMucStatus('Địa điểm đã tồn tại', 'error');
      return;
    }
    DINH_MUC_STATE.data.locations.push(name);
    setDinhMucLocationValue('');
    markDinhMucChanged();
    renderDinhMucMatrix();
  }

  function removeDinhMucLocation(name) {
    if (!name) return;
    if (!window.confirm('Xóa địa điểm "' + name + '"?')) return;
    DINH_MUC_STATE.data.locations = $.grep(DINH_MUC_STATE.data.locations, function (item) {
      return item !== name;
    });
    var nextRoutes = {};
    $.each(DINH_MUC_STATE.data.routes, function (key, route) {
      var parts = key.split('||');
      if (parts[0] !== name && parts[1] !== name) {
        nextRoutes[key] = route;
      }
    });
    DINH_MUC_STATE.data.routes = nextRoutes;
    markDinhMucChanged();
    renderDinhMucMatrix();
  }

  function copyDinhMucOpposite() {
    var copied = 0;
    var locations = DINH_MUC_STATE.data.locations || [];
    for (var i = 0; i < locations.length; i++) {
      for (var j = 0; j < locations.length; j++) {
        if (i === j) continue;
        var sourceKey = routeKey(locations[i], locations[j]);
        var targetKey = routeKey(locations[j], locations[i]);
        var source = DINH_MUC_STATE.data.routes[sourceKey];
        var target = DINH_MUC_STATE.data.routes[targetKey];
        if (source && (!target || (target.km === '' && target.t === '' && target.v === '' && target.h === ''))) {
          DINH_MUC_STATE.data.routes[targetKey] = cloneData(source);
          copied++;
        }
      }
    }
    if (!copied) {
      setDinhMucStatus('Không có ô trống để sao chép', 'error');
      return;
    }
    markDinhMucChanged();
    renderDinhMucMatrix();
  }

  function saveDinhMucData() {
    if (!DINH_MUC_STATE.customerId) return;
    setDinhMucLoading(true);
    $.ajax({
      url: '/api/khach-hang/' + DINH_MUC_STATE.customerId + '/dinh-muc',
      type: 'PUT',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(DINH_MUC_STATE.data),
      success: function (res) {
        setDinhMucLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Lưu định mức thất bại');
          return;
        }
        DINH_MUC_STATE.data = normalizeDinhMucPayload(res.data);
        DINH_MUC_STATE.original = cloneData(DINH_MUC_STATE.data);
        DINH_MUC_STATE.changed = false;
        renderDinhMucMatrix();
        setDinhMucStatus('Đã lưu');
        if (notyf) notyf.success('Đã lưu định mức');
      },
      error: function (jqXHR) {
        setDinhMucLoading(false);
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  /* =====================================================
     Helpers
     ===================================================== */

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r && r.message || 'Lỗi kết nối server';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  })(window.jQuery, window.Drupal);
})(window);

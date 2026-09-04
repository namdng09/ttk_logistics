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
  var KHACH_HANG_EVENTS_BOUND = false;
  var quickCreateCallback = null;
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
  var DINH_MUC_RULE_FILTER = '';
  var DINH_MUC_RENDERING = false;
  var FORM_SUPPORT_DATA_LOADED = false;
  var FORM_SUPPORT_DATA_LOADING = false;
  var FORM_SUPPORT_DATA_CALLBACKS = [];
  var moneyFormatter = new Intl.NumberFormat('vi-VN');
  var DINH_MUC_STATE = {
    customerId: 0,
    customerName: '',
    original: null,
    data: { routes: [] },
    changed: false
  };
  var tagifyDinhMucFrom = null;
  var tagifyDinhMucTo = null;

  function modalShow(id) {
    var el = document.getElementById(id);
    if (!el) return false;
    if (window.bootstrap && window.bootstrap.Modal) {
      var Modal = window.bootstrap.Modal;
      var instance = Modal.getOrCreateInstance ? Modal.getOrCreateInstance(el) : new Modal(el);
      instance.show();
      return true;
    }
    if ($ && $.fn && $.fn.modal) {
      $(el).modal('show');
      return true;
    }
    return false;
  }
  function modalHide(id) {
    var el = document.getElementById(id);
    if (el && window.bootstrap && window.bootstrap.Modal) {
      var m = window.bootstrap.Modal.getInstance(el);
      if (m) m.hide();
    }
  }

  function ensureModal() {
    var modal = document.getElementById('khach-hang-modal');
    if (modal) {
      return modal;
    }
    var html = Drupal.settings && Drupal.settings.khach_hang ? (Drupal.settings.khach_hang.modal_html || '') : '';
    if (!html) {
      return null;
    }
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    var node = wrap.firstElementChild;
    if (!node) {
      return null;
    }
    document.body.appendChild(node);
    bindNativeEvents();
    return node;
  }

  function initKhachHang(context) {
    context = context || document;
    if (typeof Notyf !== 'undefined' && !notyf) {
      notyf = new Notyf();
    }
    bindNativeEvents();
    bindViewAction();
    if (!KHACH_HANG_INITIALIZED && $('#table-khach-hang', context).length) {
      KHACH_HANG_INITIALIZED = true;
      loadList();
    }
  }

  /* Nút nằm trong dropdown được render lại sau mỗi lần tải danh sách.
   * Bind theo delegation để click luôn tới được luồng xem, kể cả khi menu
   * dropdown do helper toàn cục đóng/mở lại. */
  function bindViewAction() {
    $(document)
      .off('click.khachHangView', '.btn-view-khach-hang')
      .on('click.khachHangView', '.btn-view-khach-hang', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        openViewModal(this.getAttribute('data-id'));
      });
  }

  function bindRenderedViewButtons() {
    var buttons = document.querySelectorAll('#table-khach-hang-tbody .btn-view-khach-hang');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].onclick = function (e) {
        e.preventDefault();
        e.stopPropagation();
        openViewModal(this.getAttribute('data-id'));
        return false;
      };
    }
  }

  Drupal.khachHang = Drupal.khachHang || {};
  Drupal.khachHang.openCreate = function (config) {
    config = config || {};
    if (typeof Notyf !== 'undefined' && !notyf) {
      notyf = new Notyf();
    }
    var modal = ensureModal();
    if (!modal) {
      if (notyf) notyf.error('Không tải được form tạo khách hàng');
      return;
    }
    resetForm();
    setFormMode('create');
    document.getElementById('khach-hang-modal-title').textContent = config.title || 'Thêm khách hàng';
    quickCreateCallback = typeof config.onCreated === 'function' ? config.onCreated : null;
    ensureFormSupportData(function () {
      initTagify();
      setTagifyValue(config.phanLoai || ['Khách hàng']);
      initRepeater();
      initDatePickers();
    });
    modalShow('khach-hang-modal');
  };

  Drupal.behaviors.khachHang = {
    attach: function (context, settings) {
      initKhachHang(context);
    }
  };

  $(function () {
    initKhachHang(document);
  });

  function bindNativeEvents() {
    if (KHACH_HANG_EVENTS_BOUND) return;
    if (!document.getElementById('form-khach-hang') && !document.getElementById('table-khach-hang')) return;
    KHACH_HANG_EVENTS_BOUND = true;
    var doc = document;

    // Search
    var searchBtn = doc.getElementById('btn-search-khach-hang');
    var searchInput = doc.getElementById('search-khach-hang');
    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', function () {
        currentKeyword = searchInput.value.trim();
        currentPage = 1;
        loadList();
      });
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', function (e) {
        if (e.which === 13) {
          currentKeyword = this.value.trim();
          currentPage = 1;
          loadList();
        }
      });
    }

    // Filter phan loai
    var phanLoaiFilter = doc.getElementById('filter-phan-loai');
    if (phanLoaiFilter) {
      phanLoaiFilter.addEventListener('change', function () {
        currentPhanLoai = this.value;
        currentPage = 1;
        loadList();
      });
    }

    // Enter key submit
    var formKhachHang = doc.getElementById('form-khach-hang');
    if (formKhachHang) {
      formKhachHang.addEventListener('keydown', function (e) {
        if (e.which === 13 && !e.shiftKey) {
          e.preventDefault();
          var btn = doc.querySelector('.btn-luu-khach-hang');
          if (btn && !btn.disabled) btn.click();
        }
      });
    }

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-khach-hang');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentPhanLoai = '';
        if (searchInput) searchInput.value = '';
        if (phanLoaiFilter) phanLoaiFilter.value = '';
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
    if (modal) {
      modal.addEventListener('hidden.bs.modal', function () {
        resetForm();
        quickCreateCallback = null;
        modal.style.zIndex = '';
        var hasParentModal = document.getElementById('ke-hoach-fullscreen-modal') && document.getElementById('ke-hoach-fullscreen-modal').classList.contains('show');
        hasParentModal = hasParentModal || (document.getElementById('ke-hoach-edit-fullscreen-modal') && document.getElementById('ke-hoach-edit-fullscreen-modal').classList.contains('show'));
        hasParentModal = hasParentModal || (document.getElementById('ke-hoach-tuyen-xa-edit-fullscreen-modal') && document.getElementById('ke-hoach-tuyen-xa-edit-fullscreen-modal').classList.contains('show'));
        if (hasParentModal) document.body.classList.add('modal-open');
      });
      modal.addEventListener('shown.bs.modal', function () {
        initTagify();
        initDatePickers();
        var backdrops = document.querySelectorAll('.modal-backdrop.show');
        if (backdrops.length) {
          backdrops[backdrops.length - 1].style.zIndex = '2090';
        }
        modal.style.zIndex = '2100';
      });
    }

    // Add bank info row
    var btnThemNh = doc.getElementById('btn-them-ngan-hang');
    if (btnThemNh) {
      btnThemNh.addEventListener('click', function () {
        addNganHangRow();
      });
    }
    var btnThemLienHe = doc.getElementById('btn-them-lien-he');
    if (btnThemLienHe) btnThemLienHe.addEventListener('click', function () { addLienHeRow(); });

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
          if (t.classList.contains('btn-xoa-lien-he')) {
            e.preventDefault();
            var lienHeRow = t.closest('.lien-he-row');
            if (lienHeRow) lienHeRow.remove();
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
      if (t && t.classList && t.classList.contains('kh-dm-rule-number')) {
        normalizeDinhMucRuleNumber(t);
        updateDinhMucRowNumber(t);
      }
    });

    doc.addEventListener('blur', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('money-input')) {
        formatMoneyInputKeepingCaret(t);
      }
    }, true);

    var dmAddRule = doc.getElementById('kh-dm-add-rule');
    if (dmAddRule) dmAddRule.addEventListener('click', addDinhMucRuleFromForm);
    var dmResetRule = doc.getElementById('kh-dm-reset-rule');
    if (dmResetRule) dmResetRule.addEventListener('click', resetDinhMucRuleForm);
    var dmRuleSearch = doc.getElementById('kh-dm-rule-search');
    if (dmRuleSearch) {
      dmRuleSearch.addEventListener('input', function () {
        DINH_MUC_RULE_FILTER = $.trim(dmRuleSearch.value || '');
        renderDinhMucRules();
      });
    }
    var dmExport = doc.getElementById('kh-dm-export');
    if (dmExport) dmExport.addEventListener('click', exportDinhMucExcel);
    var dmImport = doc.getElementById('kh-dm-import');
    var dmImportFile = doc.getElementById('kh-dm-import-file');
    if (dmImport && dmImportFile) {
      dmImport.addEventListener('click', function () {
        dmImportFile.value = '';
        dmImportFile.click();
      });
      dmImportFile.addEventListener('change', handleDinhMucImportFile);
    }
    var dmSave = doc.getElementById('kh-dm-save');
    if (dmSave) dmSave.addEventListener('click', saveDinhMucData);
    var dmRuleBody = doc.getElementById('kh-dm-rule-body');
    if (dmRuleBody) {
      dmRuleBody.addEventListener('click', handleDinhMucRuleAction);
    }

    // Pagination jump keypress
    var paginationJump = doc.getElementById('pagination-jump');
    if (paginationJump) {
      paginationJump.addEventListener('keypress', function (e) {
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
  }

  /* =====================================================
     Money helpers
     ===================================================== */

  function parseMoney(value) {
    return Number(String(value || '').replace(/\D/g, '')) || 0;
  }

  function formatMoneyInput(input) {
    formatMoneyInputKeepingCaret(input);
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
    input.value = moneyFormatter.format(Number(digits));
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
    addNganHangRow();
    initLienHeRepeater();
  }

  function initLienHeRepeater() {
    var container = document.getElementById('lien-he-repeater');
    if (!container) return;
    container.innerHTML = '';
    addLienHeRow();
  }

  function addLienHeRow(data) {
    var container = document.getElementById('lien-he-repeater');
    if (!container) return;
    var div = document.createElement('div');
    div.className = 'lien-he-row mb-2';
    div.innerHTML = '<div class="row g-2 align-items-end"><div class="col-12 col-lg-4"><label class="form-label">Tên người</label><input type="text" class="form-control lien-he-ten" placeholder="Nguyễn Văn A"></div><div class="col-12 col-md-5 col-lg-3"><label class="form-label">SĐT</label><input type="tel" class="form-control lien-he-sdt" placeholder="0901234567" inputmode="numeric"></div><div class="col-12 col-md-5 col-lg-4"><label class="form-label">Chức vụ</label><input type="text" class="form-control lien-he-chuc-vu" placeholder="Giám đốc"></div><div class="col-12 col-md-2 col-lg-1 text-md-end"><button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-lien-he" title="Xoá người liên hệ"><i class="ti tabler-trash"></i></button></div></div>';
    container.appendChild(div);
    if (data) {
      div.querySelector('.lien-he-ten').value = data.ten || data.ho_ten || '';
      div.querySelector('.lien-he-sdt').value = data.sdt || '';
      div.querySelector('.lien-he-chuc-vu').value = data.chuc_vu || '';
    }
  }

  function collectLienHe() {
    var result = [];
    var rows = document.querySelectorAll('#lien-he-repeater .lien-he-row');
    for (var i = 0; i < rows.length; i++) {
      var ten = rows[i].querySelector('.lien-he-ten').value.trim();
      var sdt = rows[i].querySelector('.lien-he-sdt').value.trim();
      var chucVu = rows[i].querySelector('.lien-he-chuc-vu').value.trim();
      if (ten || sdt || chucVu) result.push({ ten: ten, sdt: sdt, chuc_vu: chucVu });
    }
    return result;
  }

  function addNganHangRow(data) {
    var container = document.getElementById('ngan-hang-repeater');
    if (!container) return;
    var html = '<div class="ngan-hang-row">' +
      '<div class="row g-2 align-items-end">' +
      '<div class="col-12 col-lg-4">' +
        '<label class="form-label">Chủ tài khoản</label>' +
        '<input type="text" class="form-control nganh-hang-ten-tai-khoan" placeholder="VD: NGUYEN VAN A">' +
      '</div>' +
      '<div class="col-12 col-md-6 col-lg-3">' +
        '<label class="form-label">Số tài khoản</label>' +
        '<input type="text" class="form-control ngan-hang-so-tai-khoan" placeholder="VD: 0123456789" inputmode="numeric" onkeypress="return (event.charCode >= 48 && event.charCode <= 57)">' +
      '</div>' +
      '<div class="col-12 col-md-6 col-lg-4">' +
        '<label class="form-label">Ngân hàng</label>' +
        '<select class="form-select ngan-hang-ten-ngan-hang" style="width:100%">' +
          '<option value="">Chọn ngân hàng</option>' +
        '</select>' +
      '</div>' +
      '<div class="col-12 col-lg-1 text-lg-end">' +
        '<button type="button" class="btn btn-icon btn-sm btn-label-danger btn-xoa-ngan-hang" title="Xoá ngân hàng"><i class="ti tabler-trash"></i></button>' +
      '</div>' +
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
      var so = rows[i].querySelector('.ngan-hang-so-tai-khoan').value.replace(/[^\d]/g, '').trim();
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
    var list = document.getElementById('kho-list');
    if (!tpl || !list) {
      return;
    }
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

    list.appendChild(card);
    refreshKhoSummary(card);
  }

  function addPriceRow($warehouse, data) {
    var tpl = document.getElementById('tpl-dong-gia');
    if (!tpl) {
      return;
    }
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
        routes: []
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
      email: document.querySelector('#form-khach-hang input[name="email"]').value,
      thong_tin_lien_he: collectLienHe(),
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
          if (!nid && quickCreateCallback && res.data) {
            quickCreateCallback(res.data);
          }
          modalHide('khach-hang-modal');
          resetForm();
          if (document.getElementById('table-khach-hang')) {
            loadList();
          }
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
        bindRenderedViewButtons();
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
    var modal = document.getElementById('khach-hang-modal');
    var loading = modal ? modal.querySelector('#modal-loading') : document.getElementById('modal-loading');
    if (loading) loading.style.display = show ? '' : 'none';
  }

  function openViewModal(id) {
    id = parseInt(id, 10) || 0;
    var modal = ensureModal();
    if (!id || !modal) {
      if (notyf) notyf.error('Không mở được form xem chi tiết khách hàng');
      return;
    }
    var title = modal.querySelector('#khach-hang-modal-title');
    var saveButton = modal.querySelector('.btn-luu-khach-hang');
    if (!title || !saveButton || !modal.querySelector('#form-khach-hang')) {
      if (notyf) notyf.error('Form xem chi tiết khách hàng chưa sẵn sàng');
      return;
    }
    showLoading(true);
    if (!modalShow('khach-hang-modal')) {
      showLoading(false);
      if (notyf) notyf.error('Không thể hiển thị modal khách hàng');
      return;
    }

    /* Modal phải hiện ngay khi người dùng bấm Xem. Các thao tác chuẩn bị form
     * được thực hiện sau đó để một lỗi ở plugin phụ (Tagify/Select2) không làm
     * mất hoàn toàn phản hồi giao diện. */
    try {
      resetForm();
      setFormMode('view');
      title.textContent = 'Chi tiết khách hàng';
      saveButton.style.display = 'none';
      showLoading(true);
    } catch (err) {
      showLoading(false);
      if (window.console && console.error) console.error('[Khách hàng] Không khởi tạo được form xem:', err);
      if (notyf) notyf.error('Không thể chuẩn bị form xem chi tiết khách hàng');
      return;
    }

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
    var btnThemLienHe = document.getElementById('btn-them-lien-he');
    if (btnThemLienHe) btnThemLienHe.style.display = mode === 'view' ? 'none' : '';
    var btnXoaLienHe = document.querySelectorAll('.btn-xoa-lien-he');
    for (var j2 = 0; j2 < btnXoaLienHe.length; j2++) btnXoaLienHe[j2].style.display = mode === 'view' ? 'none' : '';
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
    // Select2 v4 không còn hỗ trợ lệnh .select2('enable'/'disable'). Khóa
    // trực tiếp phần tử select để tránh lỗi JavaScript làm ngắt luồng mở modal.
    var bankSelects = document.querySelectorAll('#form-khach-hang .ngan-hang-ten-ngan-hang');
    for (var n = 0; n < bankSelects.length; n++) {
      bankSelects[n].disabled = mode === 'view';
      try { $(bankSelects[n]).trigger('change.select2'); } catch (e) {}
    }
    // Handle Select2 warehouse address selects.
    var khoSelects = document.querySelectorAll('#form-khach-hang .kho-dia-chi');
    for (var p = 0; p < khoSelects.length; p++) {
      khoSelects[p].disabled = mode === 'view';
      try { $(khoSelects[p]).trigger('change.select2'); } catch (e) {}
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
    document.querySelector('#form-khach-hang input[name="email"]').value = d.email || '';
    var lienHeContainer = document.getElementById('lien-he-repeater');
    if (lienHeContainer) lienHeContainer.innerHTML = '';
    var lienHeList = Array.isArray(d.thong_tin_lien_he) ? d.thong_tin_lien_he : (d.thong_tin_lien_he && Object.keys(d.thong_tin_lien_he).length ? [d.thong_tin_lien_he] : []);
    if (lienHeList.length) { for (var lh = 0; lh < lienHeList.length; lh++) addLienHeRow(lienHeList[lh]); } else addLienHeRow();
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

  function setDinhMucLoading(show) {
    var loading = document.getElementById('khach-hang-dinh-muc-loading');
    var modal = document.getElementById('khach-hang-dinh-muc-modal');
    if (loading) {
      loading.classList.toggle('is-active', !!show);
      loading.style.display = show ? 'flex' : 'none';
    }
    if (modal) {
      modal.querySelectorAll('input, button').forEach(function (el) {
        if (el.id === 'kh-dm-from-tags' || el.id === 'kh-dm-to-tags') return;
        if (!el.classList.contains('btn-close')) el.disabled = !!show;
      });
    }
    if (!show) {
      if (tagifyDinhMucFrom) {
        tagifyDinhMucFrom.setReadonly(false);
        tagifyDinhMucFrom.settings.whitelist = DINH_MUC_LOCATION_LIST;
      }
      if (tagifyDinhMucTo) {
        tagifyDinhMucTo.setReadonly(false);
        tagifyDinhMucTo.settings.whitelist = DINH_MUC_LOCATION_LIST;
      }
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
    var routes = [];
    $.each(payload.routes || [], function (_, route) {
      route = normalizeDinhMucRule(route);
      if (route) routes.push(route);
    });
    return {
      routes: routes
    };
  }

  function openDinhMucModal(id) {
    id = parseInt(id, 10) || 0;
    if (!id) return;

    ensureDinhMucLocationTags();
    DINH_MUC_STATE.customerId = id;
    DINH_MUC_STATE.customerName = '';
    DINH_MUC_STATE.original = null;
    DINH_MUC_STATE.data = { routes: [] };
    DINH_MUC_STATE.changed = false;
    DINH_MUC_RULE_FILTER = '';
    document.getElementById('kh-dm-customer-name').value = '';
    var searchInput = document.getElementById('kh-dm-rule-search');
    if (searchInput) searchInput.value = '';
    resetDinhMucRuleForm();
    document.getElementById('kh-dm-rule-body').innerHTML = '';
    updateDinhMucRuleCount();
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
        renderDinhMucRules();
        setDinhMucStatus('Đã lưu');
      },
      error: function (jqXHR) {
        setDinhMucLoading(false);
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function initDinhMucLocationTags() {
    initDinhMucTagify('kh-dm-from-tags', 'from');
    initDinhMucTagify('kh-dm-to-tags', 'to');
  }

  function initDinhMucTagify(id, type) {
    var el = document.getElementById(id);
    if (!el || typeof Tagify === 'undefined') return;
    var current = type === 'from' ? tagifyDinhMucFrom : tagifyDinhMucTo;
    if (current) {
      current.settings.whitelist = DINH_MUC_LOCATION_LIST;
      return;
    }
    var instance = new Tagify(el, {
      whitelist: DINH_MUC_LOCATION_LIST,
      enforceWhitelist: false,
      dropdown: {
        enabled: 0,
        maxItems: 100,
        closeOnSelect: false
      }
    });
    if (type === 'from') tagifyDinhMucFrom = instance;
    else tagifyDinhMucTo = instance;
    instance.on('change', updateDinhMucAddTagWhitelists);
    updateDinhMucAddTagWhitelists();
  }

  function ensureDinhMucLocationTags() {
    if (DINH_MUC_LOCATION_LIST_LOADED) {
      initDinhMucLocationTags();
      return;
    }

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

    $.ajax({
      url: '/api/danh-muc',
      type: 'GET',
      dataType: 'json',
      data: { phan_loai: 'Kho,Bãi,Cảng', limit: 500 },
      success: collect,
      complete: function () {
        DINH_MUC_LOCATION_LIST = names;
        DINH_MUC_LOCATION_LIST_LOADED = true;
        initDinhMucLocationTags();
        refreshDinhMucTagWhitelists();
      }
    });
  }

  function getDinhMucTagValues(instance) {
    if (!instance) return [];
    var values = [];
    $.each(instance.value || [], function (_, item) {
      var value = $.trim(item.value || '');
      if (value && values.indexOf(value) === -1) values.push(value);
    });
    return values;
  }

  function filterDinhMucLocationWhitelist(excludedItems) {
    var excluded = {};
    $.each(excludedItems || [], function (_, item) {
      excluded[normalizeDinhMucLocationKey(item)] = true;
    });
    var result = [];
    $.each(DINH_MUC_LOCATION_LIST || [], function (_, item) {
      if (!excluded[normalizeDinhMucLocationKey(item)]) result.push(item);
    });
    return result;
  }

  function updateTagifyWhitelist(instance, excludedItems) {
    if (!instance) return;
    instance.settings.whitelist = filterDinhMucLocationWhitelist(excludedItems);
  }

  function updateDinhMucAddTagWhitelists() {
    updateTagifyWhitelist(tagifyDinhMucFrom, getDinhMucTagValues(tagifyDinhMucTo));
    updateTagifyWhitelist(tagifyDinhMucTo, getDinhMucTagValues(tagifyDinhMucFrom));
  }

  function resetDinhMucRuleForm() {
    if (tagifyDinhMucFrom) tagifyDinhMucFrom.removeAllTags();
    if (tagifyDinhMucTo) tagifyDinhMucTo.removeAllTags();
    ['kh-dm-from-tags', 'kh-dm-to-tags', 'kh-dm-rule-km', 'kh-dm-rule-t', 'kh-dm-rule-v', 'kh-dm-rule-h'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = '';
    });
    updateDinhMucAddTagWhitelists();
  }

  function normalizeDinhMucRuleNumber(input) {
    if (!input || !input.classList || !input.classList.contains('kh-dm-rule-number')) return;
    var field = input.getAttribute('data-field') || '';
    var isKm = input.id === 'kh-dm-rule-km' || field === 'km';
    var value = String(input.value || '').replace(',', '.').replace(isKm ? /[^0-9.]/g : /[^0-9]/g, '');
    if (isKm) {
      var dot = value.indexOf('.');
      if (dot !== -1) value = value.slice(0, dot + 1) + value.slice(dot + 1).replace(/\./g, '');
      input.value = value;
    }
    else {
      formatMoneyInputKeepingCaret(input);
    }
  }

  function getDinhMucRuleFormData() {
    return normalizeDinhMucRule({
      from: getDinhMucTagValues(tagifyDinhMucFrom),
      to: getDinhMucTagValues(tagifyDinhMucTo),
      km: parseDistanceValue(document.getElementById('kh-dm-rule-km').value),
      t: parseMoney(document.getElementById('kh-dm-rule-t').value),
      v: parseMoney(document.getElementById('kh-dm-rule-v').value),
      h: parseMoney(document.getElementById('kh-dm-rule-h').value)
    });
  }

  function markDinhMucChanged(cell) {
    if (DINH_MUC_RENDERING) return;
    DINH_MUC_STATE.changed = true;
    setDinhMucStatus('Chưa lưu', 'unsaved');
    if (cell) cell.classList.add('is-changed');
  }

  function markDinhMucSaved() {
    DINH_MUC_STATE.changed = false;
    setDinhMucStatus('Đã lưu');
  }

  function normalizeDinhMucRule(route) {
    if (!route || !$.isArray(route.from) || !$.isArray(route.to)) return null;
    var from = uniqueStringList(route.from);
    var to = uniqueStringList(route.to);
    if (!from.length || !to.length) return null;
    var km = parseDistanceValue(route.km);
    var t = parseMoney(route.t);
    var v = parseMoney(route.v);
    var h = parseMoney(route.h);
    return { from: from, to: to, km: km === '' ? 0 : km, t: t, v: v, h: h };
  }

  function uniqueStringList(items) {
    var result = [];
    $.each(items || [], function (_, item) {
      item = $.trim(String(item || ''));
      if (item && result.indexOf(item) === -1) result.push(item);
    });
    return result;
  }

  function addDinhMucRuleFromForm() {
    var route = getDinhMucRuleFormData();
    if (!route) {
      setDinhMucStatus('Thiếu dữ liệu định mức', 'error');
      return;
    }
    if (hasDinhMucSameLocation(route)) {
      setDinhMucStatus('Hai nhóm địa điểm không được trùng', 'error');
      if (notyf) notyf.error('Hai nhóm địa điểm không được trùng nhau');
      return;
    }
    var conflictIndexes = getDinhMucConflictIndexes(route);
    if (conflictIndexes.length) {
      highlightDinhMucRows(conflictIndexes);
      setDinhMucStatus('Trùng tuyến đã có', 'error');
      if (notyf) notyf.error('Định mức bị trùng cặp địa điểm');
      return;
    }
    DINH_MUC_STATE.data.routes.push(route);
    resetDinhMucRuleForm();
    markDinhMucChanged();
    renderDinhMucRules();
  }

  function getDinhMucConflictIndexes(route, ignoreIndex) {
    var existing = {};
    $.each(DINH_MUC_STATE.data.routes || [], function (index, item) {
      if (index === ignoreIndex) return;
      addDinhMucRouteKeys(existing, item, index);
    });
    var indexes = [];
    $.each(route.from || [], function (_, from) {
      $.each(route.to || [], function (_, to) {
        var pairIndexes = existing[dinhMucRoutePairKey(from, to)] || [];
        $.each(pairIndexes, function (_, index) {
          if (indexes.indexOf(index) === -1) indexes.push(index);
        });
      });
    });
    return indexes;
  }

  function hasDinhMucSameLocation(route) {
    var seen = {};
    var duplicate = false;
    $.each(route.from || [], function (_, item) {
      seen[normalizeDinhMucLocationKey(item)] = true;
    });
    $.each(route.to || [], function (_, item) {
      if (seen[normalizeDinhMucLocationKey(item)]) duplicate = true;
    });
    return duplicate;
  }

  function addDinhMucRouteKeys(map, route, index) {
    $.each(route.from || [], function (_, from) {
      $.each(route.to || [], function (_, to) {
        var key = dinhMucRoutePairKey(from, to);
        if (!map[key]) map[key] = [];
        if (typeof index !== 'undefined' && map[key].indexOf(index) === -1) {
          map[key].push(index);
        }
      });
    });
  }

  function dinhMucRoutePairKey(from, to) {
    return normalizeDinhMucLocationKey(from) + '=>' + normalizeDinhMucLocationKey(to);
  }

  function normalizeDinhMucLocationKey(value) {
    return $.trim(String(value || '')).toLowerCase();
  }

  function duplicateDinhMucRule(index) {
    index = parseInt(index, 10);
    if (isNaN(index) || index < 0 || index >= DINH_MUC_STATE.data.routes.length) return;
    var route = DINH_MUC_STATE.data.routes[index];
    DINH_MUC_STATE.data.routes.splice(index + 1, 0, cloneData(route));
    markDinhMucChanged();
    renderDinhMucRules();
    window.setTimeout(highlightDinhMucDuplicateRows, 0);
  }

  function removeDinhMucRule(index) {
    index = parseInt(index, 10);
    if (isNaN(index) || index < 0 || index >= DINH_MUC_STATE.data.routes.length) return;
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        confirmButtonColor: '#d33',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) {
          doRemoveDinhMucRule(index);
        }
      });
      return;
    }
    if (window.confirm('Xóa định mức này?')) {
      doRemoveDinhMucRule(index);
    }
  }

  function doRemoveDinhMucRule(index) {
    DINH_MUC_STATE.data.routes.splice(index, 1);
    markDinhMucChanged();
    renderDinhMucRules();
  }

  function handleDinhMucRuleAction(e) {
    var btn = e.target.closest ? e.target.closest('[data-dm-action]') : null;
    if (!btn) return;
    var index = btn.getAttribute('data-index');
    if (btn.getAttribute('data-dm-action') === 'duplicate') {
      duplicateDinhMucRule(index);
    }
    else if (btn.getAttribute('data-dm-action') === 'delete') {
      removeDinhMucRule(index);
    }
  }

  function renderDinhMucRules() {
    var body = document.getElementById('kh-dm-rule-body');
    if (!body) return;
    DINH_MUC_RENDERING = true;
    var routes = DINH_MUC_STATE.data.routes || [];
    if (!routes.length) {
      body.innerHTML = '<tr><td colspan="8" class="kh-dm-rule-empty">Chưa có định mức</td></tr>';
      updateDinhMucRuleCount();
      window.setTimeout(function () {
        DINH_MUC_RENDERING = false;
      }, 250);
      return;
    }
    var filtered = getFilteredDinhMucRoutes(routes);
    if (!filtered.length) {
      body.innerHTML = '<tr><td colspan="8" class="kh-dm-rule-empty">Không có kết quả</td></tr>';
      updateDinhMucRuleCount();
      window.setTimeout(function () {
        DINH_MUC_RENDERING = false;
      }, 250);
      return;
    }
    var html = '';
    $.each(filtered, function (visibleIndex, item) {
      var index = item.index;
      var route = item.route;
      html += '<tr data-index="' + index + '">' +
        '<td class="text-center"><span class="kh-dm-stt">' + (visibleIndex + 1) + '</span></td>' +
        '<td><input type="text" class="form-control kh-dm-row-tags kh-dm-row-from" data-index="' + index + '" data-field="from" placeholder="Địa điểm 1"></td>' +
        '<td><input type="text" class="form-control kh-dm-row-tags kh-dm-row-to" data-index="' + index + '" data-field="to" placeholder="Địa điểm 2"></td>' +
        '<td><input type="text" class="form-control kh-dm-rule-number kh-dm-row-number" data-index="' + index + '" data-field="km" inputmode="decimal" value="' + escapeHtml(route.km === '' ? '' : route.km) + '"></td>' +
        '<td><input type="text" class="form-control kh-dm-rule-number kh-dm-row-number money-input" data-index="' + index + '" data-field="t" inputmode="numeric" value="' + escapeHtml(formatMoneyValue(route.t)) + '"></td>' +
        '<td><input type="text" class="form-control kh-dm-rule-number kh-dm-row-number money-input" data-index="' + index + '" data-field="v" inputmode="numeric" value="' + escapeHtml(formatMoneyValue(route.v)) + '"></td>' +
        '<td><input type="text" class="form-control kh-dm-rule-number kh-dm-row-number money-input" data-index="' + index + '" data-field="h" inputmode="numeric" value="' + escapeHtml(formatMoneyValue(route.h)) + '"></td>' +
        '<td class="text-center"><div class="kh-dm-row-actions">' +
          '<button type="button" class="btn btn-sm btn-icon btn-label-primary" data-dm-action="duplicate" data-index="' + index + '" title="Nhân bản"><i class="ti tabler-copy"></i></button>' +
          '<button type="button" class="btn btn-sm btn-icon btn-label-danger" data-dm-action="delete" data-index="' + index + '"><i class="ti tabler-trash"></i></button>' +
        '</div></td>' +
        '</tr>';
    });
    body.innerHTML = html;
    initDinhMucRowTags();
    window.setTimeout(function () {
      DINH_MUC_RENDERING = false;
    }, 250);
    updateDinhMucRuleCount();
  }

  function getFilteredDinhMucRoutes(routes) {
    var keyword = normalizeDinhMucSearchText(DINH_MUC_RULE_FILTER);
    var result = [];
    $.each(routes || [], function (index, route) {
      if (!keyword || normalizeDinhMucSearchText([
        (route.from || []).join(' '),
        (route.to || []).join(' '),
        route.km,
        route.t,
        route.v,
        route.h
      ].join(' ')).indexOf(keyword) !== -1) {
        result.push({ index: index, route: route });
      }
    });
    return result;
  }

  function normalizeDinhMucSearchText(value) {
    return removeVietnameseMarks(String(value || '').toLowerCase()).replace(/\s+/g, ' ').trim();
  }

  function initDinhMucRowTags() {
    var inputs = document.querySelectorAll('#kh-dm-rule-body .kh-dm-row-tags');
    for (var i = 0; i < inputs.length; i++) {
      initDinhMucRowTagify(inputs[i]);
    }
  }

  function initDinhMucRowTagify(el) {
    if (!el || typeof Tagify === 'undefined') return;
    var index = parseInt(el.getAttribute('data-index'), 10);
    var field = el.getAttribute('data-field');
    var route = DINH_MUC_STATE.data.routes[index];
    if (!route || (field !== 'from' && field !== 'to')) return;
    if (el.__tagify) {
      updateDinhMucRowTagWhitelists(index);
      return;
    }

    var instance = new Tagify(el, {
      whitelist: filterDinhMucLocationWhitelist(field === 'from' ? route.to : route.from),
      enforceWhitelist: false,
      dropdown: {
        enabled: 0,
        maxItems: 100,
        closeOnSelect: false
      }
    });
    instance.addTags(route[field] || []);
    instance.on('change', function () {
      var next = getDinhMucTagValues(instance);
      DINH_MUC_STATE.data.routes[index][field] = next;
      updateDinhMucRowTagWhitelists(index);
      markDinhMucChanged(el.closest('tr'));
      highlightDinhMucDuplicateRows();
      updateDinhMucRuleCount();
    });
  }

  function updateDinhMucRowTagWhitelists(index) {
    var route = DINH_MUC_STATE.data.routes[index];
    if (!route) return;
    var fromEl = document.querySelector('#kh-dm-rule-body .kh-dm-row-tags[data-index="' + index + '"][data-field="from"]');
    var toEl = document.querySelector('#kh-dm-rule-body .kh-dm-row-tags[data-index="' + index + '"][data-field="to"]');
    if (fromEl && fromEl.__tagify) updateTagifyWhitelist(fromEl.__tagify, route.to);
    if (toEl && toEl.__tagify) updateTagifyWhitelist(toEl.__tagify, route.from);
  }

  function updateDinhMucRowNumber(input) {
    if (!input || !input.classList || !input.classList.contains('kh-dm-row-number')) return;
    var index = parseInt(input.getAttribute('data-index'), 10);
    var field = input.getAttribute('data-field');
    if (isNaN(index) || !DINH_MUC_STATE.data.routes[index] || ['km', 't', 'v', 'h'].indexOf(field) === -1) return;
    DINH_MUC_STATE.data.routes[index][field] = field === 'km' ? parseDistanceValue(input.value) : parseMoney(input.value);
    markDinhMucChanged(input.closest('tr'));
    highlightDinhMucDuplicateRows();
  }

  function clearDinhMucRowHighlights() {
    var rows = document.querySelectorAll('#kh-dm-rule-body tr');
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.remove('is-error');
    }
  }

  function highlightDinhMucRows(indexes) {
    clearDinhMucRowHighlights();
    $.each(indexes || [], function (_, index) {
      var row = document.querySelector('#kh-dm-rule-body tr[data-index="' + index + '"]');
      if (row) row.classList.add('is-error');
    });
  }

  function highlightDinhMucDuplicateRows() {
    var seen = {};
    var duplicateIndexes = [];
    $.each(DINH_MUC_STATE.data.routes || [], function (index, route) {
      route = normalizeDinhMucRule(route);
      if (!route) {
        if (duplicateIndexes.indexOf(index) === -1) duplicateIndexes.push(index);
        return;
      }
      if (hasDinhMucSameLocation(route) && duplicateIndexes.indexOf(index) === -1) {
        duplicateIndexes.push(index);
      }
      $.each(route.from || [], function (_, from) {
        $.each(route.to || [], function (_, to) {
          var key = dinhMucRoutePairKey(from, to);
          if (typeof seen[key] !== 'undefined') {
            if (duplicateIndexes.indexOf(seen[key]) === -1) duplicateIndexes.push(seen[key]);
            if (duplicateIndexes.indexOf(index) === -1) duplicateIndexes.push(index);
          }
          else {
            seen[key] = index;
          }
        });
      });
    });
    highlightDinhMucRows(duplicateIndexes);
    return duplicateIndexes;
  }

  function updateDinhMucRuleCount() {
    var el = document.getElementById('kh-dm-rule-count');
    if (!el) return;
    var routes = DINH_MUC_STATE.data.routes || [];
    var totalRoutes = 0;
    $.each(routes, function (_, route) {
      totalRoutes += (route.from || []).length * (route.to || []).length;
    });
    el.textContent = routes.length + ' rule · ' + totalRoutes + ' tuyến';
  }

  function refreshDinhMucTagWhitelists() {
    initDinhMucLocationTags();
    var inputs = document.querySelectorAll('#kh-dm-rule-body .kh-dm-row-tags');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].__tagify) updateDinhMucRowTagWhitelists(parseInt(inputs[i].getAttribute('data-index'), 10));
    }
  }

  function validateDinhMucRulesBeforeSave() {
    var seen = {};
    var message = '';
    var errorIndexes = [];
    $.each(DINH_MUC_STATE.data.routes || [], function (index, route) {
      route = normalizeDinhMucRule(route);
      if (!route) {
        message = 'Thiếu dữ liệu định mức';
        errorIndexes.push(index);
      }
      if (!message) {
        $.each(route.from || [], function (_, from) {
          $.each(route.to || [], function (_, to) {
            if ($.trim(String(from || '')).toLowerCase() === $.trim(String(to || '')).toLowerCase()) {
              message = 'Hai nhóm địa điểm không được trùng';
              errorIndexes.push(index);
              return false;
            }
            var key = dinhMucRoutePairKey(from, to);
            if (typeof seen[key] !== 'undefined') {
              message = 'Trùng tuyến định mức';
              errorIndexes.push(seen[key]);
              errorIndexes.push(index);
              return false;
            }
            seen[key] = index;
          });
          if (message) return false;
        });
      }
      if (message) {
        return false;
      }
    });
    if (message) {
      highlightDinhMucRows(errorIndexes);
      setDinhMucStatus(message, 'error');
      if (notyf) notyf.error(message);
      return false;
    }
    clearDinhMucRowHighlights();
    return true;
  }

  function exportDinhMucExcel() {
    if (typeof XLSX === 'undefined') {
      if (notyf) notyf.error('Chưa tải được thư viện Excel');
      return;
    }
    var rows = buildDinhMucExportRows();
    var aoa = [['STT', 'Địa điểm 1', 'Địa điểm 2', 'KM', 'Trống', 'Vỏ', 'Hàng']];
    for (var i = 0; i < rows.length; i++) {
      aoa.push([
        i + 1,
        rows[i].from,
        rows[i].to,
        rows[i].km,
        rows[i].t,
        rows[i].v,
        rows[i].h
      ]);
    }
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [
      { wch: 8 },
      { wch: 32 },
      { wch: 32 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 }
    ];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DinhMuc');
    XLSX.writeFile(wb, 'dinh-muc-' + safeFilename(DINH_MUC_STATE.customerName || 'khach-hang') + '.xlsx');
  }

  function buildDinhMucExportRows() {
    var rows = [];
    $.each(DINH_MUC_STATE.data.routes || [], function (_, route) {
      rows.push({
        from: (route.from || []).join('; '),
        to: (route.to || []).join('; '),
        km: route.km === '' ? '' : route.km,
        t: route.t || '',
        v: route.v || '',
        h: route.h || ''
      });
    });
    return rows;
  }

  function handleDinhMucImportFile(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!/\.xlsx$/i.test(file.name)) {
      if (notyf) notyf.error('Chỉ hỗ trợ file .xlsx');
      return;
    }
    if (typeof XLSX === 'undefined') {
      if (notyf) notyf.error('Chưa tải được thư viện Excel');
      return;
    }

    var reader = new FileReader();
    reader.onload = function (evt) {
      var rows = parseDinhMucXlsxRows(evt.target.result);
      var stats = rows._stats || { total: rows.length, valid: rows.length, invalid: 0, duplicate: 0 };
      if (!rows.length) {
        if (notyf) notyf.error('File import không có dữ liệu hợp lệ');
        return;
      }
      stats = applyDinhMucImportRows(rows, stats);
      if (notyf) {
        var msg = 'Đã đọc ' + stats.total + ' dòng, áp dụng ' + stats.applied + ' tuyến';
        if (stats.duplicate) msg += ', trùng ' + stats.duplicate;
        if (stats.invalid) msg += ', lỗi ' + stats.invalid;
        notyf.success(msg);
      }
    };
    reader.onerror = function () {
      if (notyf) notyf.error('Không đọc được file import');
    };
    reader.readAsArrayBuffer(file);
  }

  function parseDinhMucXlsxRows(buffer) {
    var workbook = XLSX.read(buffer, { type: 'array' });
    var sheetName = workbook.SheetNames.indexOf('DinhMuc') !== -1 ? 'DinhMuc' : workbook.SheetNames[0];
    if (!sheetName) return [];
    var sheet = workbook.Sheets[sheetName];
    var rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    return normalizeDinhMucImportRows(rawRows);
  }

  function normalizeDinhMucImportRows(rawRows) {
    if (!rawRows.length) return [];
    var header = rawRows[0].map(normalizeExcelHeader);
    var fromHeader = header.indexOf('diadiem1') !== -1 ? 'diadiem1' : 'diemdi';
    var toHeader = header.indexOf('diadiem2') !== -1 ? 'diadiem2' : 'diemden';
    var hasHeader = header.indexOf(fromHeader) !== -1 && header.indexOf(toHeader) !== -1;
    var map = {};
    if (hasHeader) {
      for (var i = 0; i < header.length; i++) {
        map[header[i]] = i;
      }
      map.from = map[fromHeader];
      map.to = map[toHeader];
    }
    else {
      map = { from: 1, to: 2, km: 3, trong: 4, vo: 5, hang: 6 };
    }

    var result = [];
    var start = hasHeader ? 1 : 0;
    var stats = { total: Math.max(0, rawRows.length - start), valid: 0, invalid: 0, duplicate: 0, applied: 0 };
    for (var r = start; r < rawRows.length; r++) {
      var row = rawRows[r];
      var from = splitDinhMucPlaces(row[map.from]);
      var to = splitDinhMucPlaces(row[map.to]);
      if (!from.length || !to.length) {
        stats.invalid++;
        continue;
      }
      var route = {
        from: from,
        to: to,
        km: parseDistanceValue(row[map.km]),
        t: parseMoney(row[map.trong]),
        v: parseMoney(row[map.vo]),
        h: parseMoney(row[map.hang])
      };
      route = normalizeDinhMucRule(route);
      if (!route) {
        stats.invalid++;
        continue;
      }
      result.push(route);
      stats.valid++;
    }
    result._stats = stats;
    return result;
  }

  function applyDinhMucImportRows(rows, stats) {
    stats = stats || { total: rows.length, valid: rows.length, invalid: 0, duplicate: 0, applied: 0 };
    var routes = [];
    var seen = {};
    for (var i = 0; i < rows.length; i++) {
      var duplicated = false;
      $.each(rows[i].from || [], function (_, from) {
        $.each(rows[i].to || [], function (_, to) {
          if (seen[dinhMucRoutePairKey(from, to)]) duplicated = true;
        });
      });
      if (duplicated) {
        stats.duplicate++;
        continue;
      }
      addDinhMucRouteKeys(seen, rows[i]);
      routes.push(rows[i]);
    }
    DINH_MUC_STATE.data.routes = routes;
    markDinhMucChanged();
    renderDinhMucRules();
    stats.applied = routes.length;
    return stats;
  }

  function splitDinhMucPlaces(value) {
    return uniqueStringList(String(value || '').split(';'));
  }

  function normalizeExcelHeader(value) {
    value = removeVietnameseMarks(String(value || '').toLowerCase());
    return value.replace(/[^a-z0-9]/g, '');
  }

  function removeVietnameseMarks(value) {
    var map = {
      a: /[àáạảãâầấậẩẫăằắặẳẵ]/g,
      e: /[èéẹẻẽêềếệểễ]/g,
      i: /[ìíịỉĩ]/g,
      o: /[òóọỏõôồốộổỗơờớợởỡ]/g,
      u: /[ùúụủũưừứựửữ]/g,
      y: /[ỳýỵỷỹ]/g,
      d: /đ/g
    };
    for (var key in map) {
      if (Object.prototype.hasOwnProperty.call(map, key)) {
        value = value.replace(map[key], key);
      }
    }
    return value;
  }

  function parseDistanceValue(value) {
    value = String(value || '').replace(',', '.').replace(/[^0-9.]/g, '');
    var dotIndex = value.indexOf('.');
    if (dotIndex !== -1) {
      value = value.slice(0, dotIndex + 1) + value.slice(dotIndex + 1).replace(/\./g, '');
    }
    return value === '' ? '' : Number(value);
  }

  function safeFilename(value) {
    value = removeVietnameseMarks(String(value || '').toLowerCase());
    value = value.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return value || 'khach-hang';
  }

  function saveDinhMucData() {
    if (!DINH_MUC_STATE.customerId) return;
    if (!validateDinhMucRulesBeforeSave()) return;
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
        markDinhMucSaved();
        renderDinhMucRules();
        window.setTimeout(markDinhMucSaved, 300);
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
    if (str === null || typeof str === 'undefined') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  })(window.jQuery, window.Drupal);
})(window);

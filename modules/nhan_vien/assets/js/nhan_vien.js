(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentKeyword = '';
  var currentRoleRid = '';
  var currentTrangThai = '';
  var BANK_LIST = [];
  var BANK_LIST_LOADED = false;
  var FORM_SUPPORT_DATA_LOADED = false;
  var FORM_SUPPORT_DATA_LOADING = false;
  var FORM_SUPPORT_DATA_CALLBACKS = [];

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

  Drupal.behaviors.nhanVien = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-nhan-vien', context).length) {
        loadFilters();
        loadList();
        bindNativeEvents();
      }
    }
  };

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
          var sel = document.querySelector('#form-nhan-vien select[name="ngan_hang"]');
          if (sel) {
            var curVal = sel.value;
            initNganHangSelect(sel, curVal || null);
          }
        }
      },
      error: function () {},
      complete: function () {
        if (done) done();
      }
    });
  }

  function initNganHangSelect(selEl, value) {
    var $jq = (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ : (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function' ? jQuery : null);
    if ($jq && $jq.fn.select2) {
      var $sel = $jq(selEl);
      if ($sel.data('select2')) $sel.select2('destroy');
      $sel.select2({
        dropdownParent: $jq('#nhan-vien-modal'),
        placeholder: 'Chọn ngân hàng',
        allowClear: true,
        width: '100%'
      });
    }
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
    if ($jq && $jq.fn.select2 && $jq(selEl).data('select2')) {
      $jq(selEl).trigger('change.select2');
    }
  }

  function bindNativeEvents() {
    var doc = document;

    // Search
    doc.getElementById('btn-search-nhan-vien').addEventListener('click', function () {
      currentKeyword = doc.getElementById('search-nhan-vien').value.trim();
      currentPage = 1;
      loadList();
    });

    doc.getElementById('search-nhan-vien').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });

    // Filter role
    doc.getElementById('filter-role').addEventListener('change', function () {
      currentRoleRid = this.value;
      currentPage = 1;
      loadList();
    });

    // Filter trang thai
    doc.getElementById('filter-trang-thai').addEventListener('change', function () {
      currentTrangThai = this.value;
      currentPage = 1;
      loadList();
    });

    // Switch trang thai
    var switchInput = doc.getElementById('switch-trang-thai');
    if (switchInput) {
      switchInput.addEventListener('change', function () {
        var val = this.checked ? '1' : '0';
        doc.getElementById('input-trang-thai').value = val;
        var label = doc.getElementById('switch-trang-thai-label');
        if (label) label.textContent = this.checked ? 'Hoạt động' : 'Khoá';
      });
    }

    // Enter key submit
    doc.getElementById('form-nhan-vien').addEventListener('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey) {
        e.preventDefault();
        var btn = doc.querySelector('.btn-luu-nhan-vien');
        if (btn && !btn.disabled) btn.click();
      }
    });

    // Reload
    var reloadBtn = doc.querySelector('.btn-reload-nhan-vien');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentKeyword = '';
        currentRoleRid = '';
        currentTrangThai = '';
        doc.getElementById('search-nhan-vien').value = '';
        doc.getElementById('filter-role').value = '';
        doc.getElementById('filter-trang-thai').value = '';
        currentPage = 1;
        loadList();
      });
    }

    // Add new
    var themBtn = doc.querySelector('.btn-them-nhan-vien');
    if (themBtn) {
      themBtn.addEventListener('click', function () {
        resetForm();
        setFormMode('create');
        ensureFormSupportData();
      });
    }

    // Save button
    var luuBtn = doc.querySelector('.btn-luu-nhan-vien');
    if (luuBtn) {
      luuBtn.addEventListener('click', function (e) {
        e.preventDefault();
        submitForm();
      });
    }

    // Modal events
    var modal = doc.getElementById('nhan-vien-modal');
    modal.addEventListener('hidden.bs.modal', function () {
      resetForm();
    });
    modal.addEventListener('shown.bs.modal', function () {
      initDatePickers();
    });

    // Delegated clicks (dropdown items, pagination)
    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.classList.contains('btn-view-nhan-vien')) {
            e.preventDefault();
            openViewModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-edit-nhan-vien')) {
            e.preventDefault();
            openEditModal(t.getAttribute('data-id'));
            return;
          }
          if (t.classList.contains('btn-delete-nhan-vien')) {
            e.preventDefault();
            confirmDelete(t.getAttribute('data-id'));
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

  function loadFilters() {
    // Load roles
    $.ajax({
      url: '/api/roles',
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success' && res.data) {
          var filterRole = document.getElementById('filter-role');
          var formRole = document.querySelector('#form-nhan-vien select[name="role_rid"]');
          var html = '';
          for (var i = 0; i < res.data.length; i++) {
            var r = res.data[i];
            // Role Lái xe (rid 7) is managed exclusively in the Lái xe screen.
            var roleName = String(r.name || '').replace(/\s+/g, ' ').trim().toLowerCase();
            if (parseInt(r.rid, 10) === 7 || roleName === 'lái xe' || roleName === 'lai xe') continue;
            html += '<option value="' + r.rid + '">' + escapeHtml(r.name) + '</option>';
          }
          if (filterRole) {
            filterRole.innerHTML = '<option value="">Tất cả vai trò</option>' + html;
          }
          if (formRole) {
            formRole.innerHTML = '<option value="">Chọn vai trò</option>' + html;
          }
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });

  }

  function loadDanhMucOptions(phanLoai, fieldName, done) {
    $.ajax({
      url: '/api/danh-muc',
      type: 'GET',
      dataType: 'json',
      data: { phan_loai: phanLoai, limit: 100 },
      success: function (res) {
        if (res.status === 'success' && res.data) {
          var select = document.querySelector('#form-nhan-vien select[name="' + fieldName + '"]');
          if (!select) return;
          var html = '<option value="">Chọn ' + phanLoai.toLowerCase() + '</option>';
          var items = res.data.items || [];
          for (var i = 0; i < items.length; i++) {
            html += '<option value="' + items[i].nid + '">' + escapeHtml(items[i].ten) + '</option>';
          }
          select.innerHTML = html;
        }
      },
      error: function (jqXHR) {
        if (notyf) notyf.error(apiMsg(jqXHR));
      },
      complete: function () {
        if (done) done();
      }
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

      var sel = document.querySelector('#form-nhan-vien select[name="ngan_hang"]');
      if (sel) {
        var curVal = sel.value;
        initNganHangSelect(sel, curVal || null);
      }

      var callbacks = FORM_SUPPORT_DATA_CALLBACKS.slice();
      FORM_SUPPORT_DATA_CALLBACKS = [];
      for (var i = 0; i < callbacks.length; i++) {
        callbacks[i]();
      }
    }

    loadBankList(finishOne);
    loadDanhMucOptions('Phòng ban', 'phong_ban', finishOne);
    loadDanhMucOptions('Chức vụ', 'chuc_vu', finishOne);
  }

  function submitForm() {
    var form = document.getElementById('form-nhan-vien');
    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }

    var inputs = form.querySelectorAll('input, select');
    var data = {};
    for (var i = 0; i < inputs.length; i++) {
      var inp = inputs[i];
      if (inp.name) {
        data[inp.name] = inp.value;
      }
    }

    // password empty check on create
    var uid = data.uid;
    if (!uid && !data.password) {
      form.classList.add('was-validated');
      return;
    }

    // Build data untuk API: rename username -> username, keep all
    var apiData = {
      ten: data.ten,
      ma_nhan_vien: data.ma_nhan_vien || '',
      username: data.username,
      mail: data.mail || '',
      dob: data.dob || '',
      cccd: data.cccd || '',
      dia_chi: data.dia_chi || '',
      so_tk_ngan_hang: data.so_tk_ngan_hang || '',
      ngan_hang: data.ngan_hang || '',
      phong_ban: data.phong_ban || '',
      chuc_vu: data.chuc_vu || '',
      role_rid: data.role_rid || '',
      trang_thai: document.getElementById('input-trang-thai').value
    };
    if (data.password && data.password !== '') {
      apiData.password = data.password;
    }

    var url = uid ? '/api/nhan-vien/' + uid : '/api/nhan-vien';
    var method = uid ? 'PUT' : 'POST';

    var btn = document.querySelector('.btn-luu-nhan-vien');
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
          if (notyf) notyf.success(uid ? 'Cập nhật thành công' : 'Tạo mới thành công');
          modalHide('nhan-vien-modal');
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

  function loadList() {
    var tbody = $('#table-nhan-vien-tbody');
    tbody.html(
      '<tr id="loading-row"><td colspan="10" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    var params = { page: currentPage, keyword: currentKeyword };
    if (currentRoleRid) {
      params.role_rid = currentRoleRid;
    }
    if (currentTrangThai !== '') {
      params.status = currentTrangThai;
    }

    $.ajax({
      url: '/api/nhan-vien',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="10" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var pageSize = data.limit || 20;

        if (items.length === 0) {
          tbody.append('<tr><td colspan="10" class="text-center">Không có dữ liệu</td></tr>');
          renderPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(item.uid);
          var status = item.status == 1
            ? '<span class="badge bg-success">Hoạt động</span>'
            : '<span class="badge bg-secondary">Khoá</span>';
          html +=
            '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + escapeHtml(item.ma_nhan_vien || '') + '</td>' +
            '<td>' + escapeHtml(item.ten || '') + '</td>' +
            '<td>' + escapeHtml(item.name || '') + '</td>' +
            '<td>' + escapeHtml(item.mail || '') + '</td>' +
            '<td>' + escapeHtml(item.phong_ban ? item.phong_ban.ten : '') + '</td>' +
            '<td>' + escapeHtml(item.chuc_vu ? item.chuc_vu.ten : '') + '</td>' +
            '<td>' + escapeHtml(item.role ? item.role.ten : '') + '</td>' +
            '<td>' + status + '</td>' +
            '</tr>';
        }
        tbody.append(html);
        renderPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.append('<tr><td colspan="10" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function buildActions(uid) {
    var perms = Drupal.settings.nhan_vien && Drupal.settings.nhan_vien.permissions;
    if (!perms) return '';

    var items = '';
    if (perms.nhan_vien_view) {
      items += '<li><button type="button" class="dropdown-item btn-view-nhan-vien" data-id="' + uid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>';
    }
    if (perms.nhan_vien_create) {
      items += '<li><button type="button" class="dropdown-item btn-edit-nhan-vien" data-id="' + uid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>';
    }
    if (perms.nhan_vien_delete) {
      items += '<li><hr class="dropdown-divider"></li>';
      items += '<li><button type="button" class="dropdown-item text-danger btn-delete-nhan-vien" data-id="' + uid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    }
    if (!items) return '';

    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill">' +
      '<i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' + items + '</ul></div>';
  }

  function renderPagination(data) {
    var container = document.getElementById('pagination-nhan-vien');
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

  function showLoading(show) {
    var loading = document.getElementById('modal-loading');
    loading.style.display = show ? '' : 'none';
  }

  function openViewModal(id) {
    setFormMode('view');
    document.getElementById('nhan-vien-modal-title').textContent = 'Chi tiết nhân viên';
    document.querySelector('.btn-luu-nhan-vien').style.display = 'none';
    showLoading(true);
    modalShow('nhan-vien-modal');

    $.ajax({
      url: '/api/nhan-vien/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status !== 'success' || !res.data) {
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          return;
        }
        populateForm(res.data);
      },
      error: function (jqXHR) {
        showLoading(false);
        modalHide('nhan-vien-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openEditModal(id) {
    setFormMode('edit');
    document.getElementById('nhan-vien-modal-title').textContent = 'Cập nhật nhân viên';
    document.querySelector('#form-nhan-vien input[name="uid"]').value = id;
    var btn = document.querySelector('.btn-luu-nhan-vien');
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    btn.style.display = '';
    // Edit mode: password optional
    var label = document.getElementById('label-password');
    label.innerHTML = 'Password';
    var hint = document.getElementById('password-hint');
    if (hint) hint.style.display = '';
    showLoading(true);
    modalShow('nhan-vien-modal');

    var detailData = null;
    var detailLoaded = false;
    var supportLoaded = false;
    var detailFailed = false;

    function finalizeEditModal() {
      if (detailFailed || !detailLoaded || !supportLoaded) return;
      showLoading(false);
      populateForm(detailData);
    }

    ensureFormSupportData(function () {
      supportLoaded = true;
      finalizeEditModal();
    });

    $.ajax({
      url: '/api/nhan-vien/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          detailFailed = true;
          showLoading(false);
          if (notyf) notyf.error(res.message || 'Không tìm thấy dữ liệu');
          modalHide('nhan-vien-modal');
          return;
        }
        detailData = res.data;
        detailLoaded = true;
        finalizeEditModal();
      },
      error: function (jqXHR) {
        detailFailed = true;
        showLoading(false);
        modalHide('nhan-vien-modal');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function setFormMode(mode) {
    var inputs = document.querySelectorAll('#form-nhan-vien input, #form-nhan-vien select, #form-nhan-vien textarea');
    var btn = document.querySelector('.btn-luu-nhan-vien');
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
  }

  function resetForm() {
    showLoading(false);
    document.getElementById('form-nhan-vien').reset();
    document.querySelector('#form-nhan-vien input[name="uid"]').value = '';
    document.getElementById('nhan-vien-modal-title').textContent = 'Thêm nhân viên';
    // Create mode: password required
    var label = document.getElementById('label-password');
    label.innerHTML = 'Password <span class="text-danger">*</span>';
    var hint = document.getElementById('password-hint');
    if (hint) hint.style.display = 'none';
    // Reset switch trang thai
    var sw = document.getElementById('switch-trang-thai');
    var hiddenVal = document.getElementById('input-trang-thai');
    if (sw) sw.checked = true;
    if (hiddenVal) hiddenVal.value = '1';
    var lbl = document.getElementById('switch-trang-thai-label');
    if (lbl) lbl.textContent = 'Hoạt động';
    var selNH = document.querySelector('#form-nhan-vien select[name="ngan_hang"]');
    if (selNH) initNganHangSelect(selNH, '');
    setFormMode('create');
  }

  function populateForm(d) {
    document.querySelector('#form-nhan-vien input[name="uid"]').value = d.uid || '';
    document.querySelector('#form-nhan-vien input[name="ten"]').value = d.ten || '';
    document.querySelector('#form-nhan-vien input[name="ma_nhan_vien"]').value = d.ma_nhan_vien || '';
    document.querySelector('#form-nhan-vien input[name="username"]').value = d.name || '';
    document.querySelector('#form-nhan-vien input[name="password"]').value = '';
    document.querySelector('#form-nhan-vien input[name="mail"]').value = d.mail || '';
    document.querySelector('#form-nhan-vien input[name="dob"]').value = d.dob || '';
    document.querySelector('#form-nhan-vien input[name="cccd"]').value = d.cccd || '';
    document.querySelector('#form-nhan-vien input[name="dia_chi"]').value = d.dia_chi || '';
    document.querySelector('#form-nhan-vien input[name="so_tk_ngan_hang"]').value = d.so_tk_ngan_hang || '';
    var selNganHang = document.querySelector('#form-nhan-vien select[name="ngan_hang"]');
    if (selNganHang) {
      initNganHangSelect(selNganHang, d.ngan_hang || '');
    }

    var selectPB = document.querySelector('#form-nhan-vien select[name="phong_ban"]');
    if (selectPB && d.phong_ban) selectPB.value = d.phong_ban.nid;
    var selectCV = document.querySelector('#form-nhan-vien select[name="chuc_vu"]');
    if (selectCV && d.chuc_vu) selectCV.value = d.chuc_vu.nid;
    var selectRole = document.querySelector('#form-nhan-vien select[name="role_rid"]');
    if (selectRole && d.role) selectRole.value = d.role.nid;
    // Switch trang thai
    var sw = document.getElementById('switch-trang-thai');
    var hiddenVal = document.getElementById('input-trang-thai');
    if (sw && hiddenVal) {
      var statusVal = d.status != null ? d.status : 1;
      sw.checked = statusVal == 1;
      hiddenVal.value = statusVal == 1 ? '1' : '0';
      var lbl = document.getElementById('switch-trang-thai-label');
      if (lbl) lbl.textContent = statusVal == 1 ? 'Hoạt động' : 'Khoá';
    }
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

  function confirmDelete(id) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận khoá',
        text: 'Nhân viên sẽ bị khoá đăng nhập. Tiếp tục?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Khoá',
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
      if (confirm('Xác nhận khoá nhân viên này?')) {
        deleteItem(id);
      }
    }
  }

  function deleteItem(id) {
    $.ajax({
      url: '/api/nhan-vien/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          if (notyf) notyf.success('Khoá thành công');
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

})(jQuery, Drupal);

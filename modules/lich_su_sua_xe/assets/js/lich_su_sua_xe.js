(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentPage = 1;
  var currentItems = {};
  var vehicles = [];
  var drivers = [];
  var currentId = '';
  var currentMode = 'create';
  var hangMuc = [];
  var files = [];
  var selectedFile = null;
  var previewMap = {};

  var LOAI_LABEL = {
    sua_chua: 'Sửa chữa',
    bao_duong: 'Bảo dưỡng',
    thay_nhot: 'Thay nhớt',
    thay_vo: 'Thay vỏ',
    khac: 'Khác'
  };
  var FILE_GROUP_LABEL = {
    anh_truoc: 'Ảnh trước sửa',
    anh_sau: 'Ảnh sau sửa',
    chung_tu: 'Chứng từ/Hóa đơn'
  };
  var TINH_TRANG_LABEL = {
    dang_hoat_dong: 'Đang hoạt động',
    dang_sua: 'Đang sửa',
    can_bao_duong: 'Cần bảo dưỡng',
    ngung_hoat_dong: 'Ngưng hoạt động'
  };

  Drupal.behaviors.lichSuSuaXe = {
    attach: function (context) {
      if (typeof Notyf !== 'undefined' && !notyf) notyf = new Notyf();
      if ($('#lssx-table', context).length) {
        bindEvents();
        initDatePickers();
        initMasks();
        loadRefs(function () { loadList(); });
      }
    }
  };

  function bindEvents() {
    var body = document.body;
    if (body.getAttribute('data-lssx-bound') === '1') return;
    body.setAttribute('data-lssx-bound', '1');

    $('.btn-lssx-create').bind('click', function () {
      resetForm();
      setMode('create');
    });
    $('.btn-lssx-refresh, #btn-lssx-reset').bind('click', function () {
      clearFilters();
      loadList();
    });
    $('#btn-lssx-search').bind('click', function () {
      currentPage = 1;
      loadList();
    });
    $('#lssx-filter-keyword').bind('keypress', function (e) {
      if (e.which === 13) {
        currentPage = 1;
        loadList();
      }
    });
    $('#btn-lssx-save').bind('click', submitForm);
    $('#btn-lssx-add-hang-muc').bind('click', function () {
      addHangMucRow({});
    });
    $('#lssx-pagination-jump').bind('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value, 10);
        var total = parseInt(this.getAttribute('data-total-pages'), 10);
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });
    $('#lssx-file-input').bind('change', function () {
      selectedFile = this.files && this.files.length ? this.files[0] : null;
    });
    $('#btn-lssx-upload-file').bind('click', uploadFile);

    $(document).delegate('.btn-lssx-view', 'click', function () { openView($(this).attr('data-id')); });
    $(document).delegate('.btn-lssx-edit', 'click', function () { openEdit($(this).attr('data-id')); });
    $(document).delegate('.btn-lssx-delete', 'click', function () { confirmDelete($(this).attr('data-id')); });
    $(document).delegate('.btn-lssx-file-preview', 'click', function () {
      var id = $(this).attr('data-file-id');
      if (previewMap[id]) openFilePreview(previewMap[id]);
    });
    $(document).delegate('.btn-lssx-file-delete', 'click', function () {
      deleteFile($(this).attr('data-file-id'));
    });

    $('#lssx-hang-muc-body').delegate('.lssx-hang-muc-field', 'input change', function () {
      updateHangMucFromField(this);
      updateTotalFromItems();
    });
    $('#lssx-hang-muc-body').delegate('.btn-lssx-delete-hang-muc', 'click', function () {
      var index = parseInt($(this).closest('tr').attr('data-index'), 10);
      hangMuc.splice(index, 1);
      renderHangMuc();
      updateTotalFromItems();
    });
    $('#lssx-modal').bind('shown.bs.modal', function () {
      initDatePickers();
      initMasks();
    });
    $('#lssx-modal').bind('hidden.bs.modal', resetForm);
    $('#lssx-form').bind('keydown', function (e) {
      if (e.which === 13 && !e.shiftKey && !$(e.target).closest('#lssx-hang-muc-body').length) {
        e.preventDefault();
        $('#btn-lssx-save').trigger('click');
      }
    });
  }

  function loadRefs(done) {
    var remaining = 2;
    function finish() {
      remaining -= 1;
      if (remaining === 0) {
        fillVehicleSelects();
        fillDriverSelects();
        if (done) done();
      }
    }
    $.ajax({
      url: '/api/phuong-tien',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        vehicles = res.status === 'success' && res.data ? (res.data.items || []) : [];
      },
      complete: finish
    });
    $.ajax({
      url: '/api/lai-xe',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        drivers = res.status === 'success' && res.data ? (res.data.items || []) : [];
      },
      complete: finish
    });
  }

  function fillVehicleSelects() {
    var options = '<option value="">Chọn phương tiện</option>';
    var filterOptions = '<option value="">Tất cả phương tiện</option>';
    for (var i = 0; i < vehicles.length; i++) {
      var label = vehicleLabel(vehicles[i]);
      options += '<option value="' + esc(vehicles[i].nid) + '">' + esc(label) + '</option>';
      filterOptions += '<option value="' + esc(vehicles[i].nid) + '">' + esc(label) + '</option>';
    }
    $('[name="nid_phuong_tien"]').html(options);
    $('#lssx-filter-phuong-tien').html(filterOptions);
    initSelect2($('#lssx-filter-phuong-tien'), 'Tất cả phương tiện', $('body'));
    initSelect2($('#lssx-form [name="nid_phuong_tien"]'), 'Chọn phương tiện', $('#lssx-modal'));
  }

  function fillDriverSelects() {
    var options = '<option value="">Chọn lái xe</option>';
    for (var i = 0; i < drivers.length; i++) {
      options += '<option value="' + esc(drivers[i].nid) + '">' + esc(drivers[i].ten || '') + (drivers[i].sdt ? ' - ' + esc(drivers[i].sdt) : '') + '</option>';
    }
    $('[name="nid_lai_xe_mang_di_sua"]').html(options);
  }

  function loadList() {
    var tbody = $('#lssx-table-body');
    tbody.html('<tr><td colspan="9" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>');
    $.ajax({
      url: '/api/lich-su-sua-xe',
      type: 'GET',
      dataType: 'json',
      data: {
        page: currentPage,
        keyword: $('#lssx-filter-keyword').val(),
        nid_phuong_tien: $('#lssx-filter-phuong-tien').val(),
        tu_ngay: $('#lssx-filter-tu-ngay').val(),
        den_ngay: $('#lssx-filter-den-ngay').val()
      },
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          tbody.html('<tr><td colspan="9" class="text-center text-danger py-3">' + esc(res.message || 'Lỗi tải dữ liệu') + '</td></tr>');
          return;
        }
        renderList(res.data);
      },
      error: function (jqXHR) {
        tbody.html('<tr><td colspan="9" class="text-center text-danger py-3">Lỗi tải dữ liệu</td></tr>');
        toastError(apiMsg(jqXHR));
      }
    });
  }

  function renderList(data) {
    var items = data.items || [];
    var tbody = $('#lssx-table-body');
    currentItems = {};
    if (!items.length) {
      tbody.html('<tr><td colspan="9" class="text-center text-muted py-3">Không có dữ liệu</td></tr>');
      renderPagination(data);
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      currentItems[item.nid] = item;
      var stt = ((data.current_page || 1) - 1) * (data.limit || 20) + i + 1;
      var firstItem = item.hang_muc && item.hang_muc.length ? item.hang_muc[0].ten_hang_muc : '';
      var noiDung = firstItem || LOAI_LABEL[item.loai_sua_chua] || item.loai_sua_chua || '';
      if (item.hang_muc && item.hang_muc.length > 1) noiDung += '<div class="text-muted small">+' + (item.hang_muc.length - 1) + ' hạng mục</div>';
      if (item.tinh_trang_xe) noiDung += '<div><span class="badge bg-label-secondary border mt-1">' + esc(TINH_TRANG_LABEL[item.tinh_trang_xe] || item.tinh_trang_xe) + '</span></div>';
      html += '<tr>' +
        '<td class="text-center">' + actionsHtml(item.nid) + '</td>' +
        '<td>' + stt + '</td>' +
        '<td><strong>' + esc(item.phuong_tien ? item.phuong_tien.bks : '') + '</strong><div class="text-muted small">' + esc(item.phuong_tien ? (item.phuong_tien.nhan_hieu || item.phuong_tien.ma_tai_san || '') : '') + '</div></td>' +
        '<td>' + esc(item.ngay_sua || '') + '</td>' +
        '<td>' + noiDung + '</td>' +
        '<td>' + esc(item.co_so_sua_chua || '') + '</td>' +
        '<td>' + (item.lai_xe_mang_di_sua ? esc(item.lai_xe_mang_di_sua.ten || '') : '<span class="text-muted fst-italic">Chưa chọn</span>') + '</td>' +
        '<td class="text-end fw-semibold">' + money(item.tong_chi_phi) + '</td>' +
        '<td>' + reminderHtml(item) + '</td>' +
        '</tr>';
    }
    tbody.html(html);
    renderPagination(data);
  }

  function actionsHtml(id) {
    var perms = Drupal.settings.lich_su_sua_xe && Drupal.settings.lich_su_sua_xe.permissions || {};
    var html = '<div class="dropdown"><button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button><ul class="dropdown-menu">';
    if (perms.view) html += '<li><button type="button" class="dropdown-item btn-lssx-view" data-id="' + esc(id) + '"><i class="ti tabler-eye me-2 text-info"></i>Xem</button></li>';
    if (perms.create) html += '<li><button type="button" class="dropdown-item btn-lssx-edit" data-id="' + esc(id) + '"><i class="ti tabler-edit me-2 text-warning"></i>Sửa</button></li>';
    if (perms.delete) html += '<li><hr class="dropdown-divider"></li><li><button type="button" class="dropdown-item text-danger btn-lssx-delete" data-id="' + esc(id) + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>';
    html += '</ul></div>';
    return html;
  }

  function reminderHtml(item) {
    var parts = [];
    if (item.so_km_nhac_tiep_theo) parts.push(money(item.so_km_nhac_tiep_theo) + ' km');
    if (item.ngay_nhac_tiep_theo) parts.push(esc(item.ngay_nhac_tiep_theo));
    return parts.length ? parts.join('<br>') : '<span class="text-muted fst-italic">Chưa có</span>';
  }

  function renderPagination(data) {
    var container = document.getElementById('lssx-pagination');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var total = parseInt(data.total_pages, 10) || 0;
    var current = parseInt(data.current_page, 10) || 0;
    var totalItems = parseInt(data.total, 10) || 0;

    document.getElementById('lssx-pagination-info').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('lssx-pagination-total').textContent = '/ ' + total;

    var jumpInput = document.getElementById('lssx-pagination-jump');
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
    $(ul).find('a[data-page]').bind('click', function (e) {
      if (e && e.preventDefault) e.preventDefault();
      if ($(this).parent().hasClass('disabled')) return;
      currentPage = parseInt($(this).attr('data-page'), 10);
      if (currentPage > 0) loadList();
    });
  }

  function openView(id) {
    resetForm();
    setMode('view');
    $('#lssx-modal-title').text('Chi tiết lịch sử sửa xe');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('lssx-modal')).show();
    loadDetail(id);
  }

  function openEdit(id) {
    resetForm();
    setMode('edit');
    $('#lssx-modal-title').text('Cập nhật lịch sử sửa xe');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('lssx-modal')).show();
    loadDetail(id);
  }

  function loadDetail(id) {
    showLoading(true);
    $.ajax({
      url: '/api/lich-su-sua-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        showLoading(false);
        if (res.status === 'success' && res.data) populateForm(res.data);
        else toastError(res.message || 'Không tải được chi tiết');
      },
      error: function (jqXHR) {
        showLoading(false);
        toastError(apiMsg(jqXHR));
      }
    });
  }

  function populateForm(d) {
    currentId = d.nid || '';
    files = d.files || [];
    hangMuc = d.hang_muc || [];
    field('nid').val(currentId);
    field('nid_phuong_tien').val(d.nid_phuong_tien || '').trigger('change');
    field('ngay_sua').val(d.ngay_sua || '');
    field('loai_sua_chua').val(d.loai_sua_chua || '');
    field('nid_lai_xe_mang_di_sua').val(d.nid_lai_xe_mang_di_sua || '');
    field('co_so_sua_chua').val(d.co_so_sua_chua || '');
    field('so_km_luc_sua').val(money(d.so_km_luc_sua));
    field('so_km_nhac_tiep_theo').val(money(d.so_km_nhac_tiep_theo));
    field('ngay_nhac_tiep_theo').val(d.ngay_nhac_tiep_theo || '');
    field('thoi_gian_sua').val(d.thoi_gian_sua || '');
    field('tinh_trang_xe').val(d.tinh_trang_xe || '');
    field('tong_chi_phi').val(money(d.tong_chi_phi));
    field('ghi_chu').val(d.ghi_chu || '');
    renderHangMuc();
    renderFiles();
    setMode(currentMode);
  }

  function submitForm() {
    if (currentMode === 'view') return;
    var form = document.getElementById('lssx-form');
    if (form.checkValidity() === false) {
      form.classList.add('was-validated');
      return;
    }
    collectHangMuc();
    var payload = {
      nid_phuong_tien: field('nid_phuong_tien').val(),
      ngay_sua: field('ngay_sua').val(),
      loai_sua_chua: field('loai_sua_chua').val(),
      nid_lai_xe_mang_di_sua: field('nid_lai_xe_mang_di_sua').val(),
      co_so_sua_chua: field('co_so_sua_chua').val(),
      so_km_luc_sua: intClean(field('so_km_luc_sua').val()),
      so_km_nhac_tiep_theo: intClean(field('so_km_nhac_tiep_theo').val()),
      ngay_nhac_tiep_theo: field('ngay_nhac_tiep_theo').val(),
      thoi_gian_sua: field('thoi_gian_sua').val(),
      tinh_trang_xe: field('tinh_trang_xe').val(),
      tong_chi_phi: intClean(field('tong_chi_phi').val()),
      ghi_chu: field('ghi_chu').val(),
      hang_muc: hangMuc
    };
    var btn = $('#btn-lssx-save');
    btn.attr('disabled', 'disabled').html('<span class="spinner-border spinner-border-sm me-1"></span>Đang lưu');
    $.ajax({
      url: currentId ? '/api/lich-su-sua-xe/' + currentId : '/api/lich-su-sua-xe',
      type: currentId ? 'PUT' : 'POST',
      contentType: 'application/json',
      dataType: 'json',
      data: JSON.stringify(payload),
      success: function (res) {
        btn.removeAttr('disabled').html('<i class="ti tabler-device-floppy me-1"></i>Lưu');
        if (res.status === 'success' && res.data) {
          toastSuccess(currentId ? 'Cập nhật thành công' : 'Tạo mới thành công');
          currentId = res.data.nid;
          populateForm(res.data);
          loadList();
        } else {
          toastError(res.message || 'Lưu không thành công');
        }
      },
      error: function (jqXHR) {
        btn.removeAttr('disabled').html('<i class="ti tabler-device-floppy me-1"></i>Lưu');
        toastError(apiMsg(jqXHR));
      }
    });
  }

  function resetForm() {
    currentId = '';
    currentMode = 'create';
    hangMuc = [];
    files = [];
    selectedFile = null;
    $('#lssx-form')[0].reset();
    $('#lssx-form').removeClass('was-validated');
    $('#lssx-modal-title').text('Thêm lịch sử sửa xe');
    $('#lssx-file-input').val('');
    $('#lssx-file-title').val('');
    addHangMucRow({});
    renderFiles();
    setMode('create');
    showLoading(false);
  }

  function setMode(mode) {
    currentMode = mode;
    var readonly = mode === 'view';
    $('#lssx-form').find('input, select, textarea').each(function () {
      if (readonly) this.setAttribute('disabled', 'disabled');
      else this.removeAttribute('disabled');
    });
    $('#btn-lssx-save').toggle(!readonly);
    $('#btn-lssx-add-hang-muc').toggle(!readonly);
    $('#lssx-file-upload').toggle(!readonly && !!currentId);
    $('#lssx-file-create-note').toggle(!readonly && !currentId);
    $('.btn-lssx-file-delete').toggle(!readonly);
  }

  function addHangMucRow(row) {
    hangMuc.push($.extend({
      ten_hang_muc: '',
      so_luong: 1,
      don_gia: 0,
      thanh_tien: 0,
      co_bao_hanh: 0,
      ngay_het_bao_hanh: '',
      ghi_chu_bao_hanh: ''
    }, row || {}));
    renderHangMuc();
  }

  function renderHangMuc() {
    var html = '';
    for (var i = 0; i < hangMuc.length; i++) {
      var item = hangMuc[i];
      html += '<tr data-index="' + i + '">' +
        '<td class="text-center text-muted">' + (i + 1) + '</td>' +
        '<td><input type="text" class="form-control form-control-sm lssx-hang-muc-field" data-field="ten_hang_muc" value="' + escAttr(item.ten_hang_muc || '') + '" placeholder="VD: Thay vỏ"></td>' +
        '<td><input type="text" class="form-control form-control-sm money-mask lssx-hang-muc-field" data-field="don_gia" value="' + escAttr(money(item.don_gia)) + '"></td>' +
        '<td><input type="number" class="form-control form-control-sm lssx-hang-muc-field" data-field="so_luong" value="' + escAttr(item.so_luong || 1) + '" min="1" step="1" inputmode="numeric"></td>' +
        '<td><input type="text" class="form-control form-control-sm money-mask lssx-hang-muc-field" data-field="thanh_tien" value="' + escAttr(money(item.thanh_tien)) + '"></td>' +
        '<td class="text-center"><input type="checkbox" class="form-check-input lssx-hang-muc-field" data-field="co_bao_hanh"' + (parseInt(item.co_bao_hanh, 10) ? ' checked' : '') + '></td>' +
        '<td><input type="text" class="form-control form-control-sm flatpickr-date date-mask lssx-hang-muc-field" data-field="ngay_het_bao_hanh" value="' + escAttr(item.ngay_het_bao_hanh || '') + '" placeholder="dd/MM/yyyy"></td>' +
        '<td><input type="text" class="form-control form-control-sm lssx-hang-muc-field" data-field="ghi_chu_bao_hanh" value="' + escAttr(item.ghi_chu_bao_hanh || '') + '"></td>' +
        '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-danger btn-lssx-delete-hang-muc"><i class="ti tabler-trash"></i></button></td>' +
        '</tr>';
    }
    $('#lssx-hang-muc-body').html(html || '<tr><td colspan="9" class="text-center text-muted py-3">Chưa có hạng mục</td></tr>');
    initDatePickers();
    initMasks();
    setMode(currentMode);
  }

  function collectHangMuc() {
    var rows = [];
    $('#lssx-hang-muc-body tr[data-index]').each(function () {
      var row = {};
      $(this).find('.lssx-hang-muc-field').each(function () {
        var field = $(this).attr('data-field');
        row[field] = this.type === 'checkbox' ? (this.checked ? 1 : 0) : $(this).val();
      });
      var qty = parseInt(intClean(row.so_luong), 10) || 1;
      var price = parseFloat(intClean(row.don_gia)) || 0;
      var total = parseFloat(intClean(row.thanh_tien)) || (qty * price);
      row.so_luong = qty;
      row.don_gia = price;
      row.thanh_tien = total;
      if ((row.ten_hang_muc || '').trim()) rows.push(row);
    });
    hangMuc = rows;
  }

  function updateHangMucFromField(el) {
    var tr = $(el).closest('tr');
    var index = parseInt(tr.attr('data-index'), 10);
    if (isNaN(index) || !hangMuc[index]) return;
    var fieldName = $(el).attr('data-field');
    var value = el.type === 'checkbox' ? (el.checked ? 1 : 0) : $(el).val();
    if (fieldName === 'so_luong') value = parseInt(intClean(value), 10) || 1;
    if (fieldName === 'don_gia' || fieldName === 'thanh_tien') value = parseFloat(intClean(value)) || 0;
    hangMuc[index][fieldName] = value;
    if (fieldName === 'so_luong' || fieldName === 'don_gia') {
      hangMuc[index].thanh_tien = (parseInt(hangMuc[index].so_luong, 10) || 1) * (parseFloat(hangMuc[index].don_gia) || 0);
      tr.find('[data-field="thanh_tien"]').val(money(hangMuc[index].thanh_tien));
    }
  }

  function updateTotalFromItems() {
    var total = 0;
    for (var i = 0; i < hangMuc.length; i++) total += parseFloat(hangMuc[i].thanh_tien || 0);
    if (total > 0) field('tong_chi_phi').val(money(total));
  }

  function uploadFile() {
    if (!currentId) {
      toastError('Vui lòng lưu lịch sử sửa xe trước khi upload file');
      return;
    }
    var input = document.getElementById('lssx-file-input');
    var file = input && input.files && input.files.length ? input.files[0] : selectedFile;
    if (!file) {
      toastError('Vui lòng chọn file cần upload');
      return;
    }
    var formData = new FormData();
    formData.append('repair_file', file, file.name || 'repair_file');
    formData.append('nhom', $('#lssx-file-group').val() || 'chung_tu');
    formData.append('ten_hien_thi', $('#lssx-file-title').val() || '');
    var btn = $('#btn-lssx-upload-file');
    btn.attr('disabled', 'disabled').html('<span class="spinner-border spinner-border-sm me-1"></span>Upload');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/lich-su-sua-xe/' + currentId + '/file', true);
    xhr.onload = function () {
      btn.removeAttr('disabled').html('<i class="ti tabler-upload me-1"></i>Upload');
      var res = {};
      try { res = JSON.parse(xhr.responseText || '{}'); } catch (e) {}
      if (xhr.status >= 200 && xhr.status < 300 && res.status === 'success') {
        files = res.data.files || [];
        $('#lssx-file-input').val('');
        $('#lssx-file-title').val('');
        selectedFile = null;
        renderFiles();
        toastSuccess('Upload file thành công');
      } else {
        toastError(res.message || 'Upload không thành công');
      }
    };
    xhr.onerror = function () {
      btn.removeAttr('disabled').html('<i class="ti tabler-upload me-1"></i>Upload');
      toastError('Lỗi kết nối server');
    };
    xhr.send(formData);
  }

  function renderFiles() {
    previewMap = {};
    var byGroup = { anh_truoc: [], anh_sau: [], chung_tu: [] };
    for (var i = 0; i < files.length; i++) {
      var group = files[i].nhom || 'chung_tu';
      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push(files[i]);
      previewMap[files[i].id] = files[i];
    }
    var html = '';
    $.each(byGroup, function (group, list) {
      html += '<div class="lssx-file-group"><div class="lssx-file-group-title">' + esc(FILE_GROUP_LABEL[group] || group) + '</div>';
      if (!list.length) {
        html += '<div class="text-muted fst-italic small px-2 pb-2">Chưa có file</div>';
      } else {
        html += '<div class="lssx-file-grid">';
        for (var j = 0; j < list.length; j++) html += fileItemHtml(list[j]);
        html += '</div>';
      }
      html += '</div>';
    });
    $('#lssx-file-list').html(html);
    setMode(currentMode);
  }

  function fileItemHtml(file) {
    var isImg = isImage(file);
    return '<div class="lssx-file-item">' +
      '<button type="button" class="lssx-file-thumb btn-lssx-file-preview" data-file-id="' + esc(file.id || '') + '">' +
        (isImg ? '<img src="' + esc(file.url || '') + '" alt="">' : '<span><i class="ti tabler-file-type-pdf text-danger"></i></span>') +
      '</button>' +
      '<div class="lssx-file-name">' + esc(file.ten_hien_thi || file.filename || '') + '</div>' +
      '<div class="lssx-file-meta">' + esc(formatFileSize(file.size)) + '</div>' +
      '<button type="button" class="btn btn-sm btn-icon btn-label-danger btn-lssx-file-delete" data-file-id="' + esc(file.id || '') + '"><i class="ti tabler-trash"></i></button>' +
      '</div>';
  }

  function deleteFile(fileId) {
    if (!currentId || !fileId) return;
    $.ajax({
      url: '/api/lich-su-sua-xe/' + currentId + '/file/' + encodeURIComponent(fileId),
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success' && res.data) {
          files = res.data.files || [];
          renderFiles();
          toastSuccess('Đã xoá file');
        } else toastError(res.message || 'Xoá không thành công');
      },
      error: function (jqXHR) { toastError(apiMsg(jqXHR)); }
    });
  }

  function openFilePreview(file) {
    ensurePreviewModal();
    $('#lssx-preview-title').text(file.ten_hien_thi || file.filename || 'Xem file');
    $('#lssx-preview-open').attr('href', file.url || '#');
    if (isImage(file)) {
      $('#lssx-preview-body').html('<img src="' + esc(file.url) + '" class="lssx-preview-img" alt="">');
    } else {
      $('#lssx-preview-body').html('<div class="lssx-preview-pdf"><iframe src="' + esc(file.url) + '"></iframe></div>');
    }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('lssx-preview-modal')).show();
  }

  function ensurePreviewModal() {
    if ($('#lssx-preview-modal').length) return;
    $('body').append('<div class="modal fade" id="lssx-preview-modal" tabindex="-1" aria-hidden="true"><div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title mb-0" id="lssx-preview-title">Xem file</h5><div class="d-flex align-items-center gap-2 ms-auto"><a class="btn btn-sm btn-label-primary" id="lssx-preview-open" href="#" target="_blank" rel="noopener"><i class="ti tabler-external-link me-1"></i>Mở tab mới</a><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div></div><div class="modal-body text-center" id="lssx-preview-body"></div></div></div></div>');
  }

  function confirmDelete(id) {
    var done = function () { deleteRecord(id); };
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'Xác nhận xoá',
        text: 'Bạn có chắc chắn muốn xoá lịch sử sửa xe này?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xoá',
        cancelButtonText: 'Huỷ',
        confirmButtonColor: '#d33',
        customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) { if (result.isConfirmed) done(); });
    } else if (confirm('Xác nhận xoá lịch sử sửa xe này?')) done();
  }

  function deleteRecord(id) {
    $.ajax({
      url: '/api/lich-su-sua-xe/' + id,
      type: 'DELETE',
      dataType: 'json',
      success: function (res) {
        if (res.status === 'success') {
          toastSuccess('Đã xoá lịch sử sửa xe');
          loadList();
        } else toastError(res.message || 'Xoá không thành công');
      },
      error: function (jqXHR) { toastError(apiMsg(jqXHR)); }
    });
  }

  function clearFilters() {
    $('#lssx-filter-keyword').val('');
    $('#lssx-filter-phuong-tien').val('').trigger('change');
    $('#lssx-filter-tu-ngay').val('');
    $('#lssx-filter-den-ngay').val('');
    currentPage = 1;
  }

  function showLoading(show) {
    $('#lssx-modal-loading').toggle(!!show);
  }

  function field(name) {
    return $('#lssx-form [name="' + name + '"]');
  }

  function vehicleLabel(item) {
    return (item.bks || '') + (item.hang_xe ? ' - ' + item.hang_xe : '') + (item.ma_tai_san ? ' - ' + item.ma_tai_san : '');
  }

  function intClean(value) {
    return String(value || '').replace(/[^\d]/g, '');
  }

  function money(value) {
    if (value === null || value === undefined || value === '') return '';
    var raw = String(value).replace(/[^\d.-]/g, '');
    var num = parseFloat(raw);
    if (isNaN(num)) return '';
    return String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function esc(value) {
    return $('<div>').text(value == null ? '' : String(value)).html();
  }

  function escAttr(value) {
    return esc(value).replace(/"/g, '&quot;');
  }

  function apiMsg(jqXHR) {
    try {
      var res = JSON.parse(jqXHR.responseText || '{}');
      return res.message || 'Lỗi kết nối server';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function toastSuccess(msg) {
    if (notyf) notyf.success(msg);
  }

  function toastError(msg) {
    if (notyf) notyf.error(msg);
  }

  function isImage(file) {
    var mime = file && file.mime ? String(file.mime).toLowerCase() : '';
    var url = file && file.url ? String(file.url).toLowerCase() : '';
    return mime.indexOf('image/') === 0 || /\.(jpg|jpeg|png|webp|gif)(\?|$)/.test(url);
  }

  function formatFileSize(size) {
    size = parseInt(size, 10) || 0;
    if (!size) return '';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
    return (size / 1024 / 1024).toFixed(1).replace('.0', '') + ' MB';
  }

  function initDatePickers() {
    if (typeof flatpickr !== 'undefined') {
      $('.flatpickr-date').each(function () {
        try { this._flatpickr && this._flatpickr.destroy(); } catch (e) {}
        if (!this.disabled && !this.readOnly) {
          flatpickr(this, {
            dateFormat: 'd/m/Y',
            allowInput: true,
            appendTo: document.body,
            positionElement: this
          });
        }
      });
    }
  }

  function initMasks() {
    if (typeof Cleave !== 'undefined') {
      $('.date-mask').each(function () {
        if (this.disabled || this._cleave) return;
        this._cleave = new Cleave(this, { date: true, datePattern: ['d', 'm', 'Y'] });
      });
    }
    $('.money-mask, .integer-mask').each(function () {
      if (this.disabled || this._maskBound) return;
      this._maskBound = true;
      this.addEventListener('input', function () {
        if (this.className.indexOf('money-mask') !== -1) {
          formatMoneyInputKeepingCaret(this);
        } else {
          var raw = this.value.replace(/[^\d]/g, '');
          this.value = raw.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        }
      });
      this.addEventListener('blur', function () {
        if (this.className.indexOf('money-mask') !== -1) {
          this.value = money(intClean(this.value));
        }
      });
    });
  }

  function initSelect2($el, placeholder, dropdownParent) {
    if (!$el || !$el.length || !$.fn || !$.fn.select2) return;
    try {
      if ($el.data && $el.data('select2')) {
        $el.select2('destroy');
      }
    } catch (e) {}
    $el.select2({
      placeholder: placeholder || 'Chọn',
      allowClear: true,
      width: '100%',
      dropdownParent: dropdownParent && dropdownParent.length ? dropdownParent : $('body')
    });
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
    input.value = Number(digits).toLocaleString('vi-VN', { maximumFractionDigits: 0 });
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

})(jQuery, Drupal);

(function ($, Drupal) {
  'use strict';

  var notyf;
  var settings = Drupal.settings.ke_hoach_xep_xe || {};
  var perms = settings.permissions || {};
  var statuses = settings.statuses || [];
  var mode = settings.mode || 'list';
  var editData = settings.data || null;
  var currentPage = 1;
  var currentKeyword = '';
  var currentStatus = '';
  var currentFilters = {};
  // Dùng cho cả hai danh sách; mặc định giữ đúng thứ tự hiện tại là mới → cũ.
  var currentPortDateSort = 'desc';
  var FORM_DROPDOWN_CACHE_KEY = 'ke_hoach_xep_xe_form_dropdowns_v3';
  var LIST_SNAPSHOT_CACHE_KEY = 'ke_hoach_xep_xe_list_snapshot_v2';
  var LIST_FORCE_RELOAD_KEY = 'ke_hoach_xep_xe_list_force_reload_v1';
  var formDropdownCacheMemory = null;
  var detachedCreateFormApp = null;
  var listPageSettingsBeforeEdit = null;
  var listSearchDropdownsLoaded = false;
  var listSearchDropdownsLoading = false;
  var listSearchDropdownCallbacks = [];
  var nestedContEditContext = null;
  var nestedContRestorePending = null;
  var ptkhCreateState = {
    customersLoaded: false,
    candidates: []
  };
  var listSearchDropdownData = {
    customers: [],
    kho: [],
    loaiCont: ['20RF', '20DC', '40HC', '40RF', '40DC'],
    vehicles: [],
    moocs: [],
    drivers: []
  };

  function currentPlanType() {
    return settings.plan_type === 'tuyen_xa' ? 'tuyen_xa' : 'thuong';
  }

  function updatePortDateSortButton() {
    var $button = $('#khxh-date-sort');
    if (!$button.length) return;
    var ascending = currentPortDateSort === 'asc';
    $button.attr('data-direction', currentPortDateSort)
      .attr('title', ascending ? 'Sắp xếp ngày: cũ đến mới' : 'Sắp xếp ngày: mới đến cũ')
      .attr('aria-label', ascending ? 'Sắp xếp ngày: cũ đến mới' : 'Sắp xếp ngày: mới đến cũ');
    $button.find('i').attr('class', 'ti ' + (ascending ? 'tabler-sort-ascending' : 'tabler-sort-descending'));
  }

  function customerFullName(customer) {
    if (!customer) return '';
    return customer.ten || customer.name || customer.khach_hang_ten || customer.ten_khach_hang || '';
  }

  // Tuyến xa dùng mã khách hàng để các bảng/card điều phối luôn gọn. Các dữ
  // liệu cũ chưa có mã vẫn an toàn vì quay về tên đầy đủ.
  function customerDisplayName(customer, useShortCode) {
    var fullName = customerFullName(customer);
    if (useShortCode) return customer.ma_kh || fullName || (customer.nid ? ('#' + customer.nid) : '');
    return fullName || customer.ma_kh || (customer.nid ? ('#' + customer.nid) : '');
  }

  function customerPlanLabel(customer) {
    // Trên screen kế hoạch, mọi nhãn khách hàng dùng mã KH để giữ bố cục gọn.
    // Tiêu đề modal xếp xe gọi customerFullName() riêng nên vẫn giữ tên đầy đủ.
    return customerDisplayName(customer, true);
  }

  function currentListPath() {
    return currentPlanType() === 'tuyen_xa' ? '/ke-hoach-tuyen-xa' : '/ke-hoach-xep-xe';
  }

  function listSnapshotKey() {
    return LIST_SNAPSHOT_CACHE_KEY + '_' + currentPlanType();
  }

  function listForceReloadKey() {
    return LIST_FORCE_RELOAD_KEY + '_' + currentPlanType();
  }

  function listFilterFields() {
    var fields = {
      khach_hang: '#filter-khach-hang',
      dia_chi_kho: '#filter-dia-chi-kho'
    };
    if (currentPlanType() === 'tuyen_xa') {
      fields.so_cont = '#filter-so-cont';
      fields.bks_dau_keo = '#filter-bks-dau-keo';
      fields.bks_mooc = '#filter-bks-mooc';
      fields.lai_xe = '#filter-lai-xe';
      fields.da_du_hang = '#filter-da-du-hang';
      fields.date_from = '#filter-date-from';
      fields.date_to = '#filter-date-to';
    } else {
      fields.bkg_cont_seal = '#filter-bkg-cont-seal';
      fields.phuong_tien = '#filter-phuong-tien';
    }
    return fields;
  }

  var HINH_THUC_MAP = {
    cat_keo: 'Cắt kéo',
    cat_keo_cheo: 'Cắt kéo chéo',
    tha_mooc: 'Thả mooc',
    rut_mooc: 'Rút mooc',
    dong_hang: 'Đóng hàng',
    roi_cont: 'Rời Cont',
    ket_hop: 'Kết hợp'
  };
  var HINH_THUC_COLOR = {
    cat_keo: 'bg-label-success',
    cat_keo_cheo: 'bg-label-primary',
    tha_mooc: 'bg-label-warning',
    rut_mooc: 'bg-label-info',
    dong_hang: 'bg-label-danger',
    roi_cont: 'bg-label-secondary',
    ket_hop: 'bg-label-info'
  };
  var PLAN_FILE_GROUPS = {
    lay_cont_rong: '1. Nhận cont rỗng',
    tang_bo: '2. Tăng bo',
    giao_cont_rong_cho_kho: '3. Giao cont rỗng',
    nhan_cont_hang_tu_kho: '4. Nhận cont hàng',
    ha_cont: '5. Hạ cont hàng'
  };
  var PLAN_FILE_GROUP_ORDER = ['lay_cont_rong', 'giao_cont_rong_cho_kho', 'nhan_cont_hang_tu_kho', 'ha_cont'];
  var planFilePreviewMap = {};

  function normalizeHinhThuc(value) {
    value = String(value || '').trim();
    return value === 'dong_hang_trong_ngay' ? 'dong_hang' : value;
  }

  // So sánh tìm kiếm không phân biệt hoa/thường và dấu tiếng Việt.
  // Ví dụ: "tin" sẽ tìm được cả "Tín".
  function normalizeSearchText(value) {
    var text = String(value || '').toLowerCase();
    if (text.normalize) {
      text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return text.replace(/đ/g, 'd');
  }

  function hinhThucLabel(value) {
    value = normalizeHinhThuc(value);
    return HINH_THUC_MAP[value] || value;
  }

  function hinhThucColor(value) {
    return HINH_THUC_COLOR[normalizeHinhThuc(value)] || 'bg-label-secondary';
  }

  function hangCangPlanStatusColor(status) {
    var colors = {
      'Chờ thực hiện': 'bg-label-secondary',
      'Đã nhận chuyến': 'bg-label-info',
      'Đang kéo lên': 'bg-label-primary',
      'Đang kéo về': 'bg-label-warning',
      'Hoàn thành': 'bg-label-success',
      'Đã huỷ': 'bg-label-danger'
    };
    return colors[String(status || '')] || 'bg-label-secondary';
  }

  function formatTransportSelect2Option(option) {
    if (!option || !option.id) return option ? option.text : '';
    return $('<span class="badge ' + hinhThucColor(option.id) + '">' + escHtml(hinhThucLabel(option.id) || option.text) + '</span>');
  }

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r.message || 'Lỗi không xác định';
    } catch (e) {
      return 'Lỗi kết nối server';
    }
  }

  function setPlanStatus(id, status, options) {
    options = options || {};
    status = status || 'Hoàn thành';
    var isComplete = status === 'Hoàn thành';
    var doUpdate = function () {
      if (options.$button && options.$button.length) {
        options.$button.prop('disabled', true);
      }
      var payload = { trang_thai_van_chuyen: status };
      if (isComplete) {
        payload.ngay_ket_thuc = todayApiDate();
      }
      $.ajax({
        url: '/api/quan-ly-cont/' + id,
        type: 'PUT',
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        data: JSON.stringify(payload),
        success: function (res) {
          if (res.status === 'success') {
            if (!options.silentSuccess && notyf) notyf.success(isComplete ? 'Chuyến này đã hoàn thành' : 'Đã cập nhật trạng thái kế hoạch');
            if (typeof options.onSuccess === 'function') options.onSuccess(res, payload);
          } else if (notyf) {
            notyf.error(res.message || 'Cập nhật trạng thái thất bại');
          }
        },
        error: function (jqXHR) {
          if (notyf) notyf.error(apiMsg(jqXHR));
        },
        complete: function () {
          if (options.$button && options.$button.length) {
            options.$button.prop('disabled', false);
          }
        }
      });
    };
    if (options.skipConfirm) {
      doUpdate();
    } else if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: isComplete ? 'Chuyển hoàn thành?' : 'Chuyển về Chưa xếp xe?',
        text: isComplete ? 'Kế hoạch hoàn thành sẽ được đưa vào kỳ tính lương lái xe.' : 'Kế hoạch sẽ quay về trạng thái Chưa xếp xe.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: isComplete ? 'Hoàn thành' : 'Chuyển về',
        cancelButtonText: 'Huỷ',
        customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed) doUpdate();
      });
    } else if (confirm(isComplete ? 'Chuyển kế hoạch sang Hoàn thành?' : 'Chuyển kế hoạch về Chưa xếp xe?')) {
      doUpdate();
    }
  }

  function escHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function planFilesFromRow(row) {
    if (!row) return [];
    if (row.hinh_anh_chung_tu && $.isArray(row.hinh_anh_chung_tu)) return row.hinh_anh_chung_tu;
    if (row.thong_tin_json && row.thong_tin_json.hinh_anh_chung_tu && $.isArray(row.thong_tin_json.hinh_anh_chung_tu)) return row.thong_tin_json.hinh_anh_chung_tu;
    return [];
  }

  function planFileIsImage(file) {
    return !!(file && ((file.is_image === true) || String(file.mime || '').indexOf('image/') === 0));
  }

  function planFileIsPdf(file) {
    var mime = file && file.mime ? String(file.mime).toLowerCase() : '';
    var url = file && file.url ? String(file.url).toLowerCase() : '';
    return mime.indexOf('pdf') !== -1 || /\.pdf(\?|$)/.test(url);
  }

  function planFileSize(size) {
    size = parseInt(size, 10) || 0;
    if (!size) return '';
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return Math.round(size / 1024) + ' KB';
    return (size / 1024 / 1024).toFixed(1).replace('.0', '') + ' MB';
  }

  function ensurePlanFilePreviewModal() {
    if ($('#khxh-plan-file-preview-modal').length) return;
    $('body').append(
      '<div class="modal fade" id="khxh-plan-file-preview-modal" tabindex="-1" aria-hidden="true">' +
        '<div class="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">' +
          '<div class="modal-content">' +
            '<div class="modal-header">' +
              '<h5 class="modal-title mb-0" id="khxh-plan-file-preview-title">Xem chứng từ</h5>' +
              '<div class="d-flex align-items-center gap-2 ms-auto">' +
                '<a class="btn btn-sm btn-label-primary" id="khxh-plan-file-preview-open" href="#" target="_blank" rel="noopener"><i class="ti tabler-external-link me-1"></i>Mở tab mới</a>' +
                '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
              '</div>' +
            '</div>' +
            '<div class="modal-body text-center" id="khxh-plan-file-preview-body"></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  function openPlanFilePreview(file) {
    if (!file || !file.url) return;
    ensurePlanFilePreviewModal();
    $('#khxh-plan-file-preview-title').text(file.ten_hien_thi || file.filename || 'Xem chứng từ');
    $('#khxh-plan-file-preview-open').attr('href', file.url);
    if (planFileIsImage(file)) {
      $('#khxh-plan-file-preview-body').html('<img src="' + escHtml(file.url) + '" alt="' + escHtml(file.filename || '') + '" class="khxh-plan-file-preview-img">');
    } else if (planFileIsPdf(file)) {
      $('#khxh-plan-file-preview-body').html(
        '<div class="khxh-plan-file-preview-pdf">' +
          '<iframe src="' + escHtml(file.url) + '" title="' + escHtml(file.ten_hien_thi || file.filename || 'Xem chứng từ') + '"></iframe>' +
        '</div>'
      );
    } else {
      $('#khxh-plan-file-preview-body').html(
        '<div class="khxh-plan-file-preview-file">' +
          '<i class="ti tabler-file-type-pdf text-danger"></i>' +
          '<div class="fw-semibold mt-2">' + escHtml(file.ten_hien_thi || file.filename || '') + '</div>' +
          '<a class="btn btn-primary mt-3" target="_blank" rel="noopener" href="' + escHtml(file.url) + '"><i class="ti tabler-external-link me-1"></i>Mở file</a>' +
        '</div>'
      );
    }
    var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(document.getElementById('khxh-plan-file-preview-modal')) : new bootstrap.Modal(document.getElementById('khxh-plan-file-preview-modal'));
    modal.show();
  }

  function renderPlanFilesHtml(files, editable, includeTangBo) {
    files = files || [];
    var groups = PLAN_FILE_GROUP_ORDER.slice();
    if (includeTangBo !== false) groups.splice(1, 0, 'tang_bo');
    planFilePreviewMap = {};
    var byGroup = {};
    for (var i = 0; i < groups.length; i++) byGroup[groups[i]] = [];
    for (var j = 0; j < files.length; j++) {
      var group = files[j].nhom || 'lay_cont_rong';
      if (!byGroup[group]) byGroup[group] = [];
      byGroup[group].push(files[j]);
    }
    var html = '';
    for (var g = 0; g < groups.length; g++) {
      var key = groups[g];
      var groupFiles = byGroup[key] || [];
      html += '<div class="khxh-plan-file-group" data-group="' + escHtml(key) + '">' +
        '<div class="khxh-plan-file-group-title">' +
          '<span>' + escHtml(PLAN_FILE_GROUPS[key]) + '</span>' +
          '<span class="badge rounded-pill bg-label-secondary border">' + groupFiles.length + '</span>' +
        '</div>';
      if (!groupFiles.length) {
        html += '<div class="khxh-plan-file-empty">Chưa có file</div>';
      } else {
        html += '<div class="khxh-plan-file-grid">';
        for (var k = 0; k < groupFiles.length; k++) {
          var f = groupFiles[k];
          if (f.id) planFilePreviewMap[String(f.id)] = f;
          var isImage = planFileIsImage(f);
          var fileName = f.ten_hien_thi || f.filename || '';
          var fileSize = f.size ? planFileSize(f.size) : '';
          var fileMeta = (f.uploaded_text || '') + (fileSize ? ' · ' + fileSize : '');
          var fileTooltip = [
            fileName ? 'Tên file: ' + fileName : '',
            PLAN_FILE_GROUPS[key] ? 'Mốc nghiệp vụ: ' + PLAN_FILE_GROUPS[key] : '',
            f.uploaded_text ? 'Thời gian upload: ' + f.uploaded_text : '',
            fileSize ? 'Dung lượng: ' + fileSize : ''
          ].filter(Boolean).join('\n');
          html += '<div class="khxh-plan-file-item" data-file-id="' + escHtml(f.id || '') + '" title="' + escHtml(fileTooltip) + '">' +
            '<button type="button" class="khxh-plan-file-thumb btn-plan-file-preview" data-file-id="' + escHtml(f.id || '') + '" title="' + escHtml(fileTooltip) + '">' +
              (isImage
                ? '<img src="' + escHtml(f.url || '') + '" alt="' + escHtml(f.filename || '') + '">'
                : '<span class="khxh-plan-file-pdf"><i class="ti tabler-file-type-pdf"></i></span>') +
            '</button>' +
            '<div class="khxh-plan-file-name text-truncate" title="' + escHtml(fileName) + '">' + escHtml(fileName) + '</div>' +
            '<div class="khxh-plan-file-meta" title="' + escHtml(fileMeta) + '">' + escHtml(fileMeta) + '</div>' +
            (editable ? '<button type="button" class="btn btn-sm btn-icon btn-label-danger btn-plan-file-delete" data-file-id="' + escHtml(f.id || '') + '" title="Xoá"><i class="ti tabler-trash"></i></button>' : '') +
          '</div>';
        }
        html += '</div>';
      }
      html += '</div>';
    }
    return html;
  }

  function apiToDate(val) {
    if (!val) return '';
    var d = String(val).split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : val;
  }

  function todayApiDate() {
    var d = new Date();
    var month = String(d.getMonth() + 1);
    var day = String(d.getDate());
    return d.getFullYear() + '-' + (month.length === 1 ? '0' + month : month) + '-' + (day.length === 1 ? '0' + day : day);
  }

  function setDateInputValue($input, apiDate) {
    var displayDate = apiToDate(apiDate || '');
    if (!$input || !$input.length) return;
    $input.each(function () {
      if (this._flatpickr) {
        this._flatpickr.setDate(displayDate, false, 'd/m/Y');
      } else {
        $(this).val(displayDate);
      }
    });
  }

  function dateToApi(val) {
    if (!val) return '';
    var d = String(val).split('/');
    return d.length === 3 ? d[2] + '-' + d[1] + '-' + d[0] : val;
  }

  function apiToDatetime(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    if (parts.length === 2) {
      var d = parts[0].split('-');
      if (d.length === 3) return d[2] + '/' + d[1] + '/' + d[0] + ' ' + parts[1].slice(0, 5);
    }
    if (parts.length === 1) {
      var dateOnly = parts[0].split('-');
      if (dateOnly.length === 3) return dateOnly[2] + '/' + dateOnly[1] + '/' + dateOnly[0];
    }
    return val;
  }

  function datetimeToApi(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    if (parts.length === 2) {
      var d = parts[0].split('/');
      if (d.length === 3) return d[2] + '-' + d[1] + '-' + d[0] + ' ' + parts[1];
    }
    if (parts.length === 1) {
      var dateOnly = parts[0].split('/');
      if (dateOnly.length === 3) return dateOnly[2] + '-' + dateOnly[1] + '-' + dateOnly[0];
    }
    return val;
  }

  function splitDateTimeValue(value) {
    var display = apiToDatetime(value || '');
    var parts = String(display || '').trim().split(/\s+/);
    var hour = '';
    if (parts[1] && /^([01]\d|2[0-3]):\d{2}$/.test(parts[1])) {
      hour = parts[1].substring(0, 2) + ':00';
    }
    return { date: parts[0] || '', hour: hour };
  }

  function normalizeHourValue(value) {
    value = String(value || '').trim();
    return /^([01]\d|2[0-3]):00$/.test(value) ? value : '';
  }

  function dateAndHourToApi(dateValue, hourValue) {
    var date = dateToApi(String(dateValue || '').trim());
    var hour = normalizeHourValue(hourValue);
    if (!date) return '';
    // Giờ là tùy chọn: không chọn giờ thì chỉ gửi ngày, tuyệt đối không tự
    // bổ sung một mốc giờ mặc định.
    return hour ? (date + ' ' + hour) : date;
  }

  function hourSelectOptions(selected) {
    selected = normalizeHourValue(selected);
    var html = '<option value=""' + (selected ? '' : ' selected') + '>— Giờ —</option>';
    for (var hour = 0; hour < 24; hour++) {
      var value = (hour < 10 ? '0' : '') + hour + ':00';
      html += '<option value="' + value + '"' + (value === selected ? ' selected' : '') + '>' + value + '</option>';
    }
    return html;
  }

  function toDdMmYyyyHm(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    var d = parts[0] ? parts[0].split('-') : [];
    if (d.length !== 3) return val;
    return d[2] + '/' + d[1] + '/' + d[0] + (parts[1] ? ' ' + parts[1].substring(0, 5) : '');
  }

  function dateTimeStack(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    var d = parts[0] ? parts[0].split('-') : [];
    if (d.length !== 3) return escHtml(val);
    var year = d[0].slice(-2);
    var time = parts[1] ? parts[1].substring(0, 5) : '';
    return escHtml(d[2] + '/' + d[1] + '/' + year) + (time ? '<br>' + escHtml(time) : '');
  }

  function dateOnlyStack(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    var d = parts[0] ? parts[0].split('-') : [];
    if (d.length !== 3) return escHtml(parts[0] || val);
    return escHtml(d[2] + '/' + d[1] + '/' + d[0].slice(-2));
  }

  function cutOffBadge(val) {
    if (!val) return '';
    var normalized = apiToDatetime(val);
    var d = parseCutOff(normalized);
    if (!d) return escHtml(val);
    return dateTimeStack(val);
  }

  function vehicleListInfoHtml(row) {
    row = row || {};
    var lxName = (row.lai_xe && row.lai_xe.ten) || '';
    var lxSdt = (row.lai_xe && row.lai_xe.sdt) || '';
    var pt = row.phuong_tien || {};
    var mooc = row.mooc || {};
    var ptDisplay = pt.bks || '';
    var moocDisplay = mooc.bks || '';
    var ptText = pt.bks ? pt.bks + (pt.ma_tai_san ? ' - ' + pt.ma_tai_san : '') : '';
    var moocText = mooc.bks ? mooc.bks + (mooc.ma_tai_san ? ' - ' + mooc.ma_tai_san : '') : '';
    var ptTooltip = 'Đầu kéo: ' + (ptText || 'Chưa có');
    var moocTooltip = 'Mooc: ' + (moocText || 'Chưa có');
    var driverTooltip = 'Lái xe: ' + ((lxName || lxSdt) ? (lxName + (lxSdt ? ' - ' + lxSdt : '')) : 'Chưa có');
    var isHangCang = currentPlanType() !== 'tuyen_xa';
    return '' +
      '<div class="khxh-vehicle-info">' +
      '<div class="khxh-vehicle-bks" title="' + escHtml(ptTooltip) + '">' + (ptDisplay ? escHtml(ptDisplay) : (isHangCang ? '_' : '<span class="text-muted fst-italic small">BKS đầu kéo</span>')) + '</div>' +
      '<div class="khxh-vehicle-mooc" title="' + escHtml(moocTooltip) + '">' + (moocDisplay ? escHtml(moocDisplay) : (isHangCang ? '_' : '<span class="text-muted fst-italic small">BKS mooc</span>')) + '</div>' +
      '<div class="khxh-vehicle-driver" title="' + escHtml(driverTooltip) + '">' +
        (lxName ? escHtml(lxName) : (isHangCang ? '_' : '<span class="text-muted fst-italic small">lái xe</span>')) +
      '</div>' +
      '</div>';
  }

  function normalizeBaiHaThucTe(value, planned) {
    value = (value || '').trim();
    planned = (planned || '').trim();
    return value && value !== planned ? value : '';
  }

  function parseCutOff(val) {
    var parts = String(val).split(' ');
    if (parts.length < 1) return null;
    var dParts = parts[0].split('/');
    if (dParts.length !== 3) return null;
    var dd = parseInt(dParts[0], 10);
    var mm = parseInt(dParts[1], 10) - 1;
    var yyyy = parseInt(dParts[2], 10);
    if (isNaN(dd) || isNaN(mm) || isNaN(yyyy)) return null;
    var tParts = parts[1] ? parts[1].split(':') : [];
    var hh = tParts[0] ? parseInt(tParts[0], 10) : 0;
    var mi = tParts[1] ? parseInt(tParts[1], 10) : 0;
    return new Date(yyyy, mm, dd, hh, mi);
  }

  function getNidFromUrl() {
    var parts = window.location.pathname.split('/');
    if (parts.length >= 3 && parts[1] === 'ke-hoach-xep-xe') {
      return parseInt(parts[2], 10) || 0;
    }
    return 0;
  }

  function _jq() {
    return (typeof $ === 'function' && typeof $.fn.select2 === 'function') ? $ :
      (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 === 'function') ? jQuery : null;
  }

  function isKeHoachRoute(path) {
    path = path || window.location.pathname || '';
    return path.indexOf('/ke-hoach-xep-xe') === 0 || path.indexOf('/ke-hoach-tuyen-xa') === 0 || path.indexOf('/tao-ke-hoach-xep-xe') === 0;
  }

  function clearFormDropdownCache() {
    formDropdownCacheMemory = null;
    try {
      sessionStorage.removeItem(FORM_DROPDOWN_CACHE_KEY);
      sessionStorage.removeItem(formDropdownCacheKey());
    } catch (e) {}
  }

  function formDropdownCacheKey() {
    return FORM_DROPDOWN_CACHE_KEY + '_' + currentPlanType();
  }

  function maybeResetFormDropdownCache() {
    var navEntry = null;
    try {
      navEntry = window.performance && window.performance.getEntriesByType ? window.performance.getEntriesByType('navigation')[0] : null;
    } catch (e) {}
    if (navEntry && navEntry.type === 'reload') {
      clearFormDropdownCache();
      return;
    }

    var ref = document.referrer || '';
    if (!ref) {
      clearFormDropdownCache();
      return;
    }

    try {
      var refUrl = new URL(ref, window.location.origin);
      if (refUrl.origin !== window.location.origin || !isKeHoachRoute(refUrl.pathname)) {
        clearFormDropdownCache();
      }
    } catch (e) {
      clearFormDropdownCache();
    }
  }

  function getFormDropdownCache() {
    var key = formDropdownCacheKey();
    if (formDropdownCacheMemory && formDropdownCacheMemory._cacheKey === key) return formDropdownCacheMemory.data || null;
    try {
      var raw = sessionStorage.getItem(key);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !data.customers || !data.customers.length || !data.diaDiem) return null;
      formDropdownCacheMemory = { _cacheKey: key, data: data };
      return data;
    } catch (e) {
      return null;
    }
  }

  function setFormDropdownCache(data) {
    var key = formDropdownCacheKey();
    formDropdownCacheMemory = { _cacheKey: key, data: data };
    try {
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }

  function getListSnapshot() {
    try {
      var raw = sessionStorage.getItem(listSnapshotKey());
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setListSnapshot(data) {
    try {
      sessionStorage.setItem(listSnapshotKey(), JSON.stringify(data));
    } catch (e) {}
  }

  function clearListSnapshot() {
    try { sessionStorage.removeItem(listSnapshotKey()); } catch (e) {}
  }

  function shouldForceReloadList() {
    try {
      return sessionStorage.getItem(listForceReloadKey()) === '1';
    } catch (e) {
      return false;
    }
  }

  function markForceReloadList() {
    try { sessionStorage.setItem(listForceReloadKey(), '1'); } catch (e) {}
  }

  function clearForceReloadList() {
    try { sessionStorage.removeItem(listForceReloadKey()); } catch (e) {}
  }

  maybeResetFormDropdownCache();

  function syncPageSettings() {
    settings = Drupal.settings.ke_hoach_xep_xe || {};
    perms = settings.permissions || {};
    statuses = settings.statuses || [];
    mode = settings.mode || 'list';
    editData = settings.data || null;
  }

  function initSelect2(el, placeholder, options) {
    var jq = _jq();
    if (!jq || !el) return;
    var $el = jq(el);
    var existing = $el.data('select2');
    if (existing && existing.dataAdapter) {
      // Không huỷ Select2 khi nó đang xử lý sự kiện clear/open. Việc huỷ rồi
      // khởi tạo lại đồng bộ khiến Select2 gọi vào dataAdapter đã bị null.
      $el.off('select2:open.khxhFocus').on('select2:open.khxhFocus', function () {
        window.setTimeout(function () {
          var search = document.querySelector('.select2-container--open .select2-search__field');
          if (search) search.focus();
        }, 0);
      });
      return;
    }
    if (existing) $el.removeData('select2');
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
    $el.off('select2:open.khxhFocus').on('select2:open.khxhFocus', function () {
      window.setTimeout(function () {
        var search = document.querySelector('.select2-container--open .select2-search__field');
        if (search) search.focus();
      }, 0);
    });
  }

  function setSelect2Invalid($select, invalid) {
    if (!$select || !$select.length) return;
    var instance = $select.data('select2');
    var $container = instance && instance.$container ? instance.$container : $select.nextAll('.select2-container').first();
    $select.removeClass('is-invalid');
    $container.removeClass('is-invalid khxh-select2-invalid');
    if (invalid) $container.addClass('khxh-select2-invalid');
  }

  Drupal.behaviors.keHoachXepXe = {
    attach: function (context) {
      syncPageSettings();
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }
      bindGlobalCreateModal();
      if ($('#ke-hoach-list-app', context).length) initList();
      if ($('#ke-hoach-form-app', context).length) initForm();
      if ($('#ke-hoach-cont-app', context).length) initContList();
      if ($('#detail-body', context).length) initDetail();
    }
  };

  function bindGlobalCreateModal() {
    if (bindGlobalCreateModal._bound) return;
    bindGlobalCreateModal._bound = true;

    $(document).on('click', '.btn-plan-file-preview', function (e) {
      e.preventDefault();
      var id = String($(this).attr('data-file-id') || '');
      if (id && planFilePreviewMap[id]) {
        openPlanFilePreview(planFilePreviewMap[id]);
      }
    });

    $(document).on('click', '.btn-open-create-ke-hoach', function (e) {
      e.preventDefault();
      var modalEl = document.getElementById('ke-hoach-fullscreen-modal');
      if (!modalEl) {
        window.location.href = currentListPath() + '?open_create=1';
        return;
      }
      var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
      modal.show();
    });

    $(document).on('click', '.btn-open-ptkh-create', function (e) {
      e.preventDefault();
      openPtkhCreateModal();
    });
    $(document).on('click', '#khxh-ptkh-load-candidates', loadPtkhCandidates);
    $(document).on('change', '#khxh-ptkh-check-all', function () {
      $('.khxh-ptkh-plan-check:not(:disabled)').prop('checked', this.checked);
      updatePtkhSelectedTotal();
    });
    $(document).on('change', '.khxh-ptkh-plan-check', updatePtkhSelectedTotal);
    $(document).on('click', '#khxh-ptkh-create-submit', createPtkhVoucher);

    // Handler này phải chỉ bind một lần. Modal xếp xe được render lại sau khi
    // lưu và có cả bản hàng cảng/tuyến xa, nên không thể phụ thuộc vào closure
    // của từng lần init form.
    $(document)
      .off('click.khxhEditContCandidate', '.btn-edit-cont-candidate')
      .on('click.khxhEditContCandidate', '.btn-edit-cont-candidate', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var $number = $(this);
        var id = parseInt($number.data('id'), 10) || 0;
        var $ownerForm = $number.closest('#ke-hoach-form-app');
        var parentId = parseInt($ownerForm.find('#nid-input').val(), 10) || 0;
        if (!id || !parentId || id === parentId) return;
        openNestedContEditModal(id, parentId);
      });
  }

  function ptkhMoney(v) {
    v = parseInt(v || 0, 10) || 0;
    return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  function notifyPtkh(message, type) {
    if (typeof Notyf !== 'undefined' && !notyf) notyf = new Notyf();
    if (notyf) type === 'error' ? notyf.error(message) : notyf.success(message);
    else window.alert(message);
  }

  function resetPtkhCandidates(message) {
    ptkhCreateState.candidates = [];
    $('#khxh-ptkh-check-all').prop('checked', false);
    $('#khxh-ptkh-candidate-body').html('<tr><td colspan="7" class="text-center text-muted py-4">' + escHtml(message || 'Chọn khách hàng rồi bấm Lọc.') + '</td></tr>');
    updatePtkhSelectedTotal();
  }

  function loadPtkhCustomers(done) {
    var $select = $('#khxh-ptkh-create-customer');
    if (!$select.length) return;
    if (ptkhCreateState.customersLoaded) {
      initSelect2($select[0], 'Chọn khách hàng', { dropdownParent: $('#khxh-ptkh-create-modal') });
      if (done) done();
      return;
    }
    $select.prop('disabled', true);
    $.getJSON('/api/khach-hang', { limit: 500 }).done(function (res) {
      var items = res && res.data ? (res.data.items || []) : [];
      var html = '<option value="">Chọn khách hàng</option>';
      $.each(items, function (_, item) {
        var label = customerPlanLabel(item) || ('Khách hàng #' + item.nid);
        html += '<option value="' + escHtml(item.nid) + '">' + escHtml(label) + '</option>';
      });
      $select.html(html);
      ptkhCreateState.customersLoaded = true;
    }).fail(function (xhr) {
      notifyPtkh(apiMsg(xhr), 'error');
    }).always(function () {
      $select.prop('disabled', false);
      initSelect2($select[0], 'Chọn khách hàng', { dropdownParent: $('#khxh-ptkh-create-modal') });
      if (done) done();
    });
  }

  function initPtkhDatePickers() {
    if (typeof flatpickr === 'undefined') return;
    $('#khxh-ptkh-create-modal .flatpickr-date').each(function () {
      if (this._flatpickr) return;
      flatpickr(this, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        static: true
      });
    });
  }

  function openPtkhCreateModal() {
    var modalEl = document.getElementById('khxh-ptkh-create-modal');
    if (!modalEl) {
      notifyPtkh('Không tìm thấy modal tạo phiếu trả khách hàng.', 'error');
      return;
    }
    resetPtkhCandidates('Chọn khách hàng rồi bấm Lọc.');
    loadPtkhCustomers();
    initPtkhDatePickers();
    if (window.bootstrap && bootstrap.Modal) {
      var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
      modal.show();
    } else {
      $('#khxh-ptkh-create-modal').modal('show');
    }
  }

  function loadPtkhCandidates() {
    var customer = $('#khxh-ptkh-create-customer').val();
    if (!customer) {
      resetPtkhCandidates('Chọn khách hàng rồi bấm Lọc.');
      notifyPtkh('Vui lòng chọn khách hàng.', 'error');
      return;
    }
    $('#khxh-ptkh-check-all').prop('checked', false);
    $('#khxh-ptkh-load-candidates').prop('disabled', true);
    $('#khxh-ptkh-candidate-body').html('<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
    $.getJSON('/api/phieu-tra-khach-hang/candidates', {
      nid_khach_hang: customer,
      from_date: $('#khxh-ptkh-create-from').val() || '',
      to_date: $('#khxh-ptkh-create-to').val() || ''
    }).done(function (res) {
      if (!res || res.status !== 'success') {
        ptkhCreateState.candidates = [];
        $('#khxh-ptkh-candidate-body').html('<tr><td colspan="7" class="text-center text-danger py-4">' + escHtml((res && res.message) || 'Không tải được kế hoạch đủ điều kiện.') + '</td></tr>');
        updatePtkhSelectedTotal();
        return;
      }
      ptkhCreateState.candidates = res && res.data ? (res.data.items || []) : [];
      renderPtkhCandidates();
    }).fail(function (xhr) {
      ptkhCreateState.candidates = [];
      $('#khxh-ptkh-candidate-body').html('<tr><td colspan="7" class="text-center text-danger py-4">' + escHtml(apiMsg(xhr)) + '</td></tr>');
      updatePtkhSelectedTotal();
    }).always(function () {
      $('#khxh-ptkh-load-candidates').prop('disabled', false);
    });
  }

  function renderPtkhCandidates() {
    $('#khxh-ptkh-check-all').prop('checked', false);
    if (!ptkhCreateState.candidates.length) {
      $('#khxh-ptkh-candidate-body').html('<tr><td colspan="7" class="text-center text-muted py-4">Không có kế hoạch đủ điều kiện.</td></tr>');
      updatePtkhSelectedTotal();
      return;
    }
    $('#khxh-ptkh-candidate-body').html($.map(ptkhCreateState.candidates, function (item) {
      return '<tr>' +
        '<td class="text-center"><input type="checkbox" class="khxh-ptkh-plan-check" value="' + escHtml(item.nid) + '" data-total="' + escHtml(item.tong_tien || 0) + '"></td>' +
        '<td><strong>' + escHtml(item.label || '') + '</strong><div class="small text-muted">#' + escHtml(item.nid || '') + '</div></td>' +
        '<td>' + escHtml(apiToDate(item.ngay || '')) + '</td>' +
        '<td>' + escHtml(item.tuyen || '-') + '</td>' +
        '<td class="text-end khxh-ptkh-money">' + ptkhMoney(item.tong_doanh_thu) + '</td>' +
        '<td class="text-end khxh-ptkh-money">' + ptkhMoney(item.tong_chi_ho_khach_hang) + '</td>' +
        '<td class="text-end khxh-ptkh-money fw-semibold">' + ptkhMoney(item.tong_tien) + '</td>' +
      '</tr>';
    }).join(''));
    updatePtkhSelectedTotal();
  }

  function updatePtkhSelectedTotal() {
    var count = 0;
    var total = 0;
    $('.khxh-ptkh-plan-check:checked').each(function () {
      count += 1;
      total += parseInt($(this).data('total') || 0, 10) || 0;
    });
    $('#khxh-ptkh-selected-count').text(count);
    $('#khxh-ptkh-selected-total').text(ptkhMoney(total));
  }

  function createPtkhVoucher() {
    var ids = $('.khxh-ptkh-plan-check:checked').map(function () {
      return parseInt(this.value, 10);
    }).get();
    if (!ids.length) {
      notifyPtkh('Vui lòng chọn kế hoạch.', 'error');
      return;
    }
    $('#khxh-ptkh-create-submit').prop('disabled', true);
    $.ajax({
      url: '/api/phieu-tra-khach-hang',
      method: 'POST',
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      data: JSON.stringify({
        nid_khach_hang: $('#khxh-ptkh-create-customer').val(),
        tu_ngay: $('#khxh-ptkh-create-from').val(),
        den_ngay: $('#khxh-ptkh-create-to').val(),
        nid_ke_hoach: ids
      })
    }).done(function (res) {
      if (!res || res.status !== 'success') {
        notifyPtkh((res && res.message) || 'Tạo phiếu trả khách hàng thất bại.', 'error');
        return;
      }
      notifyPtkh('Đã tạo phiếu trả khách hàng.', 'success');
      $('#khxh-ptkh-create-modal').modal('hide');
      resetPtkhCandidates('Chọn khách hàng rồi bấm Lọc.');
    }).fail(function (xhr) {
      notifyPtkh(apiMsg(xhr), 'error');
    }).always(function () {
      $('#khxh-ptkh-create-submit').prop('disabled', false);
    });
  }

  function buildActions(row) {
    var nid = typeof row === 'object' ? row.nid : row;
    var nidLaiXe = typeof row === 'object' ? (row.nid_lai_xe || 0) : 0;
    var loaiKeHoach = typeof row === 'object' ? (row.loai_ke_hoach || currentPlanType()) : currentPlanType();
    var isHangCang = loaiKeHoach !== 'tuyen_xa';
    var costAction = isHangCang
      ? '<li><button type="button" class="dropdown-item btn-open-port-cost-tab" data-id="' + nid + '"><i class="ti tabler-receipt-2 me-2 text-success"></i>Nhập chi phí</button></li>'
      : '<li><button type="button" class="dropdown-item btn-open-ke-hoach-chi-phi" data-id="' + nid + '" data-nid-lai-xe="' + nidLaiXe + '" data-loai-ke-hoach="' + escHtml(loaiKeHoach) + '"><i class="ti tabler-receipt-2 me-2 text-success"></i>Chi phí</button></li>';
    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><button type="button" class="dropdown-item btn-view-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-eye me-2 text-info"></i>Xem chi tiết</button></li>' +
      '<li><button type="button" class="dropdown-item btn-edit-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-truck-delivery me-2 text-primary"></i>Xếp xe</button></li>' +
      costAction +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><button type="button" class="dropdown-item text-danger btn-delete-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>' +
      '</ul></div>';
  }

  function valueOrMuted(value, placeholder) {
    return value ? escHtml(value) : '<span class="text-muted fst-italic">' + escHtml(placeholder || 'Chưa có') + '</span>';
  }

  function detailItem(label, value) {
    return '<div class="detail-info-item"><div class="detail-info-label">' + escHtml(label) + '</div><div class="detail-info-value">' + valueOrMuted(value) + '</div></div>';
  }

  function detailSectionTitle(icon, title, meta) {
    return '<div class="detail-section-head">' +
      '<div class="detail-section-icon"><i class="ti ' + escHtml(icon) + '"></i></div>' +
      '<div class="min-w-0"><div class="detail-section-title">' + escHtml(title) + '</div>' +
      (meta ? '<div class="detail-section-meta">' + escHtml(meta) + '</div>' : '') +
      '</div></div>';
  }

  function detailBadge(value, colorClass, placeholder) {
    return value ? '<span class="badge rounded-pill ' + escHtml(colorClass || 'bg-label-secondary') + ' border">' + escHtml(value) + '</span>' : valueOrMuted('', placeholder);
  }

  function detailRoutePoint(label, value) {
    return '<div class="detail-route-point"><span>' + escHtml(label) + '</span><strong>' + valueOrMuted(value) + '</strong></div>';
  }

  function transportCardHtml(title, row, emptyText) {
    if (!row) {
      return '<div class="detail-transport-card detail-transport-empty"><div class="detail-transport-title"><span>' + escHtml(title) + '</span></div><div class="text-muted">' + escHtml(emptyText || 'Chưa có dữ liệu') + '</div></div>';
    }
    var driver = row.lai_xe || {};
    var vehicle = row.phuong_tien || {};
    var mooc = row.mooc || {};
    var routeFrom = row.bai_lay_thuc_te || row.bai_lay_cont || row.diem_di || '';
    var routeMid = row.dia_chi_kho || row.cua_khau || '';
    var routeTo = row.bai_ha_thuc_te || row.bai_ha_cont || row.diem_den || '';
    var html = '<div class="detail-transport-card">' +
      '<div class="detail-transport-title"><span>' + escHtml(title) + '</span>' + (currentPlanType() === 'tuyen_xa' || !row.so_bkg ? '' : '<small>' + escHtml(row.so_bkg) + '</small>') + '</div>' +
      '<div class="detail-route-inline">' +
        '<span>' + valueOrMuted(routeFrom, 'Điểm đi') + '</span>' +
        (routeMid ? '<i class="ti tabler-arrow-right"></i><span>' + escHtml(routeMid) + '</span>' : '') +
        '<i class="ti tabler-arrow-right"></i><span>' + valueOrMuted(routeTo, 'Điểm đến') + '</span>' +
      '</div>' +
      '<div class="detail-transport-meta">' +
        '<div><span>Đầu kéo</span><strong>' + valueOrMuted(vehicle.bks || '') + '</strong></div>' +
        '<div><span>Lái xe</span><strong>' + valueOrMuted(driver.ten || '') + '</strong></div>' +
        '<div><span>SĐT</span><strong>' + valueOrMuted(driver.sdt || '') + '</strong></div>' +
        '<div><span>Mooc</span><strong>' + valueOrMuted(mooc.bks || '') + '</strong></div>' +
      '</div>' +
    '</div>';
    return html;
  }

  function renderDetailModal(d) {
    var isTuyenXa = currentPlanType() === 'tuyen_xa';
    var khName = customerDisplayName(d.khach_hang, true);
    var hinhThuc = d.hinh_thuc_van_tai ? hinhThucLabel(d.hinh_thuc_van_tai) : '';
    var hinhThucBadgeColor = d.hinh_thuc_van_tai ? hinhThucColor(d.hinh_thuc_van_tai) : 'bg-label-secondary';
    var diemDen = d.bai_ha_thuc_te || d.bai_ha_cont || '';
    var contText = [d.loai_cont || '', d.so_cont || ''].filter(Boolean).join(' - ');
    var statusColor = d.trang_thai_van_chuyen === 'Hoàn thành' ? 'bg-label-success' : 'bg-label-primary';
    var commonHtml = '' +
      '<div class="detail-summary-strip">' +
        '<div><span>Khách hàng</span><strong>' + valueOrMuted(khName) + '</strong></div>' +
        (isTuyenXa ? '' : '<div><span>Booking</span><strong>' + valueOrMuted(d.so_bkg || '') + '</strong></div>') +
        '<div><span>Container</span><strong>' + valueOrMuted(contText) + '</strong></div>' +
        '<div><span>Trạng thái</span><strong>' + detailBadge(d.trang_thai_van_chuyen || '', statusColor) + '</strong></div>' +
      '</div>' +
      '<div class="detail-info-grid">' +
        detailItem('Ngày lập KH', d.created ? d.created.substring(0, 16) : '') +
        '<div class="detail-info-item"><div class="detail-info-label">Hình thức vận tải</div><div class="detail-info-value">' + detailBadge(hinhThuc, hinhThucBadgeColor, 'Chưa chọn') + '</div></div>' +
        detailItem('Cut-off', apiToDatetime(d.cut_off || '')) +
        detailItem('Ngày bắt đầu', apiToDate(d.ngay_bat_dau || '')) +
        detailItem('Ngày kết thúc', apiToDate(d.ngay_ket_thuc || '')) +
        detailItem('Loại hàng', d.loai_hang || '') +
        detailItem('Ghi chú', d.ghi_chu || '') +
      '</div>';
    var containerHtml = '' +
      '<div class="detail-container-layout">' +
        '<div class="detail-container-main">' +
          '<div class="detail-container-code">' + valueOrMuted(contText || (isTuyenXa ? '' : d.so_bkg || ''), 'Chưa có container') + '</div>' +
          '<div class="detail-container-sub">' +
            (isTuyenXa ? '' : '<span>BKG: ' + (d.so_bkg ? escHtml(d.so_bkg) : 'Chưa có') + '</span>') +
            (isTuyenXa ? '' :
              '<span>Seal chính: ' + (d.so_seal_chinh ? escHtml(d.so_seal_chinh) : 'Chưa có') + '</span>' +
              '<span>Seal phụ: ' + (d.so_seal_tam ? escHtml(d.so_seal_tam) : 'Chưa có') + '</span>') +
          '</div>' +
        '</div>' +
        '<div class="detail-container-status">' + detailBadge(parseInt(d.da_du_hang, 10) === 1 ? 'Đủ hàng' : 'Chưa đủ hàng', parseInt(d.da_du_hang, 10) === 1 ? 'bg-label-success' : 'bg-label-warning') + '</div>' +
      '</div>' +
      '<div class="detail-route-grid">' +
        detailRoutePoint('Bãi lấy', d.bai_lay_thuc_te || d.bai_lay_cont || '') +
        detailRoutePoint('Địa chỉ đóng/ trả hàng (Kho)', d.dia_chi_kho || '') +
        detailRoutePoint('Bãi hạ', d.bai_ha_thuc_te || d.bai_ha_cont || '') +
        detailRoutePoint('Cảng xuất', d.cang_xuat || '') +
      '</div>';
    var transportHtml = '<div class="detail-transport-grid">' +
      transportCardHtml('Kéo lên', d.cont_ref || d, 'Chưa có kế hoạch kéo lên') +
      transportCardHtml('Kéo về', d.cont_keo_ve_by || null, 'Chưa có kế hoạch kéo về') +
    '</div>';
    var files = planFilesFromRow(d);
    var filesHtml = '<div class="detail-card khxh-plan-files-card khxh-plan-files-detail-card">' +
      '<div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">' +
        '<div class="d-flex align-items-center gap-2 min-w-0">' +
          '<span class="khxh-plan-files-title">4. Chứng từ hình ảnh kế hoạch</span>' +
          '<span class="badge rounded-pill bg-label-secondary border">' + files.length + ' file</span>' +
        '</div>' +
      '</div>' +
      '<div class="khxh-plan-files-body">' + renderPlanFilesHtml(files, false) + '</div>' +
    '</div>';
    $('#ke-hoach-detail-subtitle').text((isTuyenXa ? 'Kế hoạch' : (d.so_bkg || 'Kế hoạch')) + (d.so_cont ? ' - ' + d.so_cont : ''));
    $('#ke-hoach-detail-edit-btn').attr('href', '/ke-hoach-xep-xe/' + d.nid + '/sua');
    $('#ke-hoach-detail-content').html(
      '<div class="detail-card">' + detailSectionTitle('tabler-info-circle', 'Thông tin chung', 'Tổng quan kế hoạch và tiến độ') + commonHtml + '</div>' +
      '<div class="detail-card">' + detailSectionTitle('tabler-container', 'Thông tin container', isTuyenXa ? 'Container và tuyến điểm' : 'Booking, seal và tuyến điểm') + containerHtml + '</div>' +
      '<div class="detail-card">' + detailSectionTitle('tabler-route', 'Thông tin vận chuyển', 'Phương tiện và lái xe theo chiều kéo') + transportHtml + '</div>' +
      filesHtml
    );
  }

  function openDetailModal(id) {
    var modalEl = document.getElementById('ke-hoach-detail-modal');
    if (!modalEl) return;
    var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
    $('#ke-hoach-detail-content').html('');
    $('#ke-hoach-detail-subtitle').text('Đang tải dữ liệu...');
    $('#ke-hoach-detail-loading').show();
    modal.show();
    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        $('#ke-hoach-detail-loading').hide();
        if (res.status !== 'success' || !res.data) {
          $('#ke-hoach-detail-content').html('<div class="alert alert-danger mb-0">' + escHtml(res.message || 'Không tải được chi tiết kế hoạch') + '</div>');
          return;
        }
        renderDetailModal(res.data);
      },
      error: function (jqXHR) {
        $('#ke-hoach-detail-loading').hide();
        $('#ke-hoach-detail-content').html('<div class="alert alert-danger mb-0">' + escHtml(apiMsg(jqXHR)) + '</div>');
      }
    });
  }

  function initHangCangEditCostTabs(plan, initialTab) {
    var $app = $('#ke-hoach-edit-modal-content #ke-hoach-form-app');
    if (!$app.length) return;
    var $tabs = $app.find('[data-khxh-port-tab]');
    var $panes = $app.find('[data-khxh-port-pane]');
    if (!$tabs.length || !$panes.length) return;
    $app.find('.khxh-hang-cang-modal-tabs').removeClass('d-none');
    // Form app được detach/reuse giữa các modal. populateEdit() sẽ đặt draft
    // đầy đủ (gồm cont_keo_ve_tu/den); chỉ reset khi nó thuộc kế hoạch khác.
    var savedDraft = $app.data('khxh-port-plan-draft');
    if (!savedDraft || String(savedDraft.nid || '') !== String((plan && plan.nid) || '')) {
      $app.data('khxh-port-plan-draft', $.extend(true, {}, plan || {}));
    }
    var costMounted = false;

    function portPlanDraft() {
      return $.extend(true, {}, plan || {}, $app.data('khxh-port-plan-draft') || {});
    }

    function portPlanDraftChanged(draft) {
      if (!draft || !plan) return false;
      return String(draft.ke_hoach_cont_ref_nid || 0) !== String(plan.ke_hoach_cont_ref_nid || 0) ||
        String(draft.hinh_thuc_van_tai || '') !== String(plan.hinh_thuc_van_tai || '');
    }

    function activate(tab) {
      tab = tab === 'cost' ? 'cost' : 'plan';
      $tabs.each(function () {
        var active = $(this).data('khxh-port-tab') === tab;
        $(this).toggleClass('is-active', active).attr('aria-selected', active ? 'true' : 'false');
      });
      $panes.each(function () {
        $(this).toggleClass('d-none', $(this).data('khxh-port-pane') !== tab);
      });
      if (tab === 'cost' && !costMounted) {
        if (!Drupal.keHoachChiPhi || typeof Drupal.keHoachChiPhi.mountPortTab !== 'function') {
          if (notyf) notyf.error('Không tải được phần chi phí. Vui lòng tải lại trang.');
          return;
        }
        var draft = portPlanDraft();
        costMounted = Drupal.keHoachChiPhi.mountPortTab({
          id: plan && plan.nid,
          driverId: plan && plan.nid_lai_xe,
          planType: 'thuong',
          draftPlan: draft,
          rebuildDinhMucFromDraft: portPlanDraftChanged(draft),
          mount: '#khxh-hang-cang-cost-mount'
        });
      }
      if (tab === 'plan') {
        window.requestAnimationFrame(function () {
          var $modalBody = $app.closest('.modal-content').find('> .modal-body');
          $modalBody.trigger('scroll');
        });
      }
    }

    $tabs.off('click.khxhPortCostTabs').on('click.khxhPortCostTabs', function () {
      activate($(this).data('khxh-port-tab'));
    });
    activate(initialTab === 'cost' ? 'cost' : 'plan');
  }

  function openEditFullscreenModal(id, options) {
    options = options || {};
    id = parseInt(id, 10) || 0;
    if (!id) return;
    var isTuyenXa = (options.planType || currentPlanType()) === 'tuyen_xa';
    var modalId = isTuyenXa ? 'ke-hoach-tuyen-xa-edit-fullscreen-modal' : 'ke-hoach-edit-fullscreen-modal';
    var templateId = isTuyenXa ? 'ke-hoach-tuyen-xa-edit-modal-template' : 'ke-hoach-edit-modal-template';
    var contentId = isTuyenXa ? 'ke-hoach-tuyen-xa-edit-modal-content' : 'ke-hoach-edit-modal-content';
    var modalEl = document.getElementById(modalId);
    var templateEl = document.getElementById(templateId);
    var contentEl = document.getElementById(contentId);
    if (!modalEl || !templateEl || !contentEl) {
      window.location.href = '/ke-hoach-xep-xe/' + id + '/sua';
      return;
    }
    if (!options.preserveListSettings) {
      listPageSettingsBeforeEdit = $.extend(true, {}, Drupal.settings.ke_hoach_xep_xe || {});
    }
    if (!detachedCreateFormApp) {
      detachedCreateFormApp = $('#ke-hoach-form-app').detach();
    }
    if (!isTuyenXa && Drupal.keHoachChiPhi && typeof Drupal.keHoachChiPhi.unmountPortTab === 'function') {
      Drupal.keHoachChiPhi.unmountPortTab();
    }
    $('#' + contentId).find('input').each(function () {
      if (this._flatpickr) this._flatpickr.destroy();
    });
    $('#' + contentId).find('select').each(function () {
      if (typeof $.fn.select2 === 'function' && $(this).data('select2')) $(this).select2('destroy');
    });
    contentEl.innerHTML = templateEl.innerHTML;
    if (options.keepOpen) {
      var modalScrollBody = modalEl.querySelector('.modal-body');
      if (modalScrollBody) modalScrollBody.scrollTop = 0;
    }
    $('#' + contentId + ' #form-loading').show();
    var modal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
    if (!options.keepOpen) modal.show();
    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          $('#' + contentId + ' #form-loading').hide();
          if (nestedContEditContext && nestedContEditContext.childId === id) nestedContEditContext = null;
          if (nestedContRestorePending && nestedContRestorePending.parentId === id) nestedContRestorePending = null;
          if (notyf) notyf.error(res.message || 'Không tải được kế hoạch');
          return;
        }
        Drupal.settings.ke_hoach_xep_xe = $.extend({}, Drupal.settings.ke_hoach_xep_xe || {}, {
          mode: 'edit',
          plan_type: res.data.loai_ke_hoach === 'tuyen_xa' ? 'tuyen_xa' : 'thuong',
          data: res.data
        });
        syncPageSettings();
        initForm._bound = false;
        initForm();
        if (res.data.loai_ke_hoach !== 'tuyen_xa') {
          initHangCangEditCostTabs(res.data, options.initialTab);
        }
        $('#' + contentId + ' #ke-hoach-form-app .card-header a.btn-outline-secondary')
          .attr('href', '#')
          .attr('data-bs-dismiss', 'modal');
      },
      error: function (jqXHR) {
        $('#' + contentId + ' #form-loading').hide();
        if (nestedContEditContext && nestedContEditContext.childId === id) nestedContEditContext = null;
        if (nestedContRestorePending && nestedContRestorePending.parentId === id) nestedContRestorePending = null;
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function openNestedContEditModal(id, parentId) {
    id = parseInt(id, 10) || 0;
    parentId = parseInt(parentId, 10) || 0;
    if (!id || !parentId || id === parentId) return;
    if (nestedContEditContext) {
      if (notyf) notyf.error('Đang mở một modal xếp xe liên quan. Vui lòng đóng modal hiện tại trước.');
      return;
    }
    nestedContEditContext = {
      parentId: parentId,
      childId: id,
      parentPlanType: currentPlanType()
    };
    openEditFullscreenModal(id, { preserveListSettings: true });
  }

  function collectListFilters() {
    var fields = listFilterFields();
    var filters = {};
    for (var key in fields) {
      if (!fields.hasOwnProperty(key)) continue;
      var rawValue = $(fields[key]).val();
      var value;
      if (Array.isArray(rawValue)) {
        value = $.grep(rawValue, function (item) { return String(item || '').trim() !== ''; });
      } else {
        value = String(rawValue || '').trim();
      }
      if (Array.isArray(value) ? value.length : value) filters[key] = value;
    }
    if (currentPlanType() !== 'tuyen_xa') {
      var $rangeInput = $('#filter-date-range');
      var rangePicker = $rangeInput.data('daterangepicker');
      // daterangepicker luôn có ngày mặc định nội bộ. Chỉ đưa vào API khi
      // người dùng thực sự đã áp dụng một khoảng ngày (input có giá trị).
      if ($rangeInput.val() && rangePicker) {
        filters.date_from = rangePicker.startDate.format('DD/MM/YYYY');
        filters.date_to = rangePicker.endDate.format('DD/MM/YYYY');
      }
    }
    return filters;
  }

  function setListFilterInputs(filters) {
    filters = filters || {};
    if (currentPlanType() !== 'tuyen_xa') {
      var $range = $('#filter-date-range');
      var rangePicker = $range.data('daterangepicker');
      if (rangePicker) {
        if (filters.date_from || filters.date_to) {
          var from = filters.date_from || filters.date_to;
          var to = filters.date_to || filters.date_from;
          rangePicker.setStartDate(moment(from, 'DD/MM/YYYY'));
          rangePicker.setEndDate(moment(to, 'DD/MM/YYYY'));
          $range.val(from + ' đến ' + to);
        } else {
          $range.val('');
          rangePicker.setStartDate(moment().startOf('day'));
          rangePicker.setEndDate(moment().endOf('day'));
        }
      }
    }
    var fields = listFilterFields();
    for (var key in fields) {
      if (!fields.hasOwnProperty(key)) continue;
      var $field = $(fields[key]);
      var value = filters[key] || '';
      if ($field[0] && $field[0]._flatpickr) {
        if (value) $field[0]._flatpickr.setDate(value, false, 'd/m/Y');
        else $field[0]._flatpickr.clear();
      } else {
        if ($field.prop('multiple')) {
          $field.val(Array.isArray(value) ? value : (value ? [value] : []));
        } else {
          $field.val(value);
        }
      }
      if ($field.data('select2')) $field.trigger('change');
    }
  }

  function clearListFilters() {
    currentKeyword = '';
    currentStatus = '';
    currentFilters = {};
    setListFilterInputs({});
    $('#status-filter').val('');
    if ($('#status-filter').data('select2')) $('#status-filter').trigger('change');
  }

  function setListSearchLoading(show) {
    var $modal = currentPlanType() === 'tuyen_xa' ? $('#ke-hoach-tuyen-xa-inline-filter') : $('#ke-hoach-inline-filter');
    $modal.find('input, select, button').prop('disabled', !!show);
  }

  function appendTextOptions($select, items, selectedValue) {
    var html = '<option></option>';
    var seen = {};
    selectedValue = selectedValue || '';
    for (var i = 0; i < items.length; i++) {
      var value = String(items[i] || '').trim();
      if (!value || seen[value]) continue;
      seen[value] = true;
      html += '<option value="' + escHtml(value) + '"' + (value === selectedValue ? ' selected' : '') + '>' + escHtml(value) + '</option>';
    }
    if (selectedValue && !seen[selectedValue]) {
      html += '<option value="' + escHtml(selectedValue) + '" selected>' + escHtml(selectedValue) + '</option>';
    }
    $select.html(html);
  }

  function appendVehicleFilterOptions($select, selectedValue) {
    var html = '<option></option>';
    var groups = [
      { type: 'dau_keo', label: 'Đầu kéo', items: listSearchDropdownData.vehicles || [] },
      { type: 'mooc', label: 'Mooc', items: listSearchDropdownData.moocs || [] }
    ];
    for (var g = 0; g < groups.length; g++) {
      for (var i = 0; i < groups[g].items.length; i++) {
        var item = groups[g].items[i] || {};
        var nid = parseInt(item.nid, 10) || 0;
        var bks = String(item.bks || item.bien_so || '').trim();
        if (!nid || !bks) continue;
        var value = groups[g].type + ':' + nid;
        var rawType = String(item.loai_phuong_tien || '').trim();
        var typeLabels = {
          dau_keo: 'Đầu kéo',
          mooc: 'Mooc',
          ro_mooc: 'Mooc',
          romooc: 'Mooc',
          may_phat: 'Máy phát'
        };
        var typeLabel = typeLabels[rawType.toLowerCase()] || rawType || groups[g].label;
        html += '<option value="' + escHtml(value) + '" data-short-label="' + escHtml(bks) + '"' + (value === selectedValue ? ' selected' : '') + '>' + escHtml(bks + ' (' + typeLabel + ')') + '</option>';
      }
    }
    $select.html(html);
  }

  function appendCustomerFilterOptions($select, selectedValues) {
    var selectedMap = {};
    var values = Array.isArray(selectedValues) ? selectedValues : (selectedValues ? [selectedValues] : []);
    $.each(values, function (index, value) {
      selectedMap[String(value)] = true;
    });
    var html = '';
    $.each(listSearchDropdownData.customers || [], function (index, customer) {
      var nid = parseInt(customer && customer.nid, 10) || 0;
      if (!nid) return;
      var label = customerPlanLabel(customer);
      html += '<option value="' + nid + '"' + (selectedMap[String(nid)] ? ' selected' : '') + '>' + escHtml(label) + '</option>';
    });
    $select.html(html);
  }

  function clearPortCustomerFilterSearch($select) {
    var select2 = $select.data('select2');
    var $searches = $();
    if (select2 && select2.selection && select2.selection.$search) $searches = $searches.add(select2.selection.$search);
    if (select2 && select2.dropdown && select2.dropdown.$search) $searches = $searches.add(select2.dropdown.$search);
    if (select2 && select2.$container) $searches = $searches.add(select2.$container.find('.select2-search__field'));
    // Select2 multiple đặt ô search ngay trong vùng chip; tùy cấu hình nó
    // cũng có thể tạo thêm ô search ở dropdown đang mở.
    $searches = $searches.add($('.select2-container--open .select2-search__field'));
    $searches.each(function () {
      if (this.value) $(this).val('').trigger('input');
    });
    // Trigger input chỉ xóa chữ hiển thị ở Select2 multiple. Gửi thêm query
    // rỗng để danh sách kết quả bên dưới nạp lại toàn bộ khách hàng.
    if (select2) select2.trigger('query', { term: '' });
  }

  function initPortCustomerFilterSelect($select, dropdownParent) {
    var jq = _jq();
    if (!jq || !$select.length) return;
    if ($select.data('select2')) $select.select2('destroy');
    $select.select2({
      placeholder: '— Chọn một hoặc nhiều khách hàng —',
      allowClear: true,
      closeOnSelect: false,
      width: '100%',
      dropdownParent: dropdownParent
    });
    $select.off('.portCustomerMultiple')
      .on('select2:select.portCustomerMultiple', function () {
        var $current = $(this);
        // Đợi Select2 hoàn tất thao tác chọn bằng Enter/click, rồi xóa chính
        // ô search inline đang đứng cạnh các chip đã chọn.
        window.setTimeout(function () {
          clearPortCustomerFilterSearch($current);
        }, 0);
      });
  }

  function formatListDriverResult(data) {
    if (!data || $.trim(data.text || '') === '') return data.text;
    var $row = $('<div class="khxh-driver-result"></div>')
      .append($('<span class="khxh-driver-result-name"></span>').text(data.text));
    if (data.element) {
      var phone = String($(data.element).data('phone') || '').trim();
      if (phone) $row.append($('<span class="khxh-driver-result-phone"></span>').text(phone));
    }
    return $row;
  }

  function formatListDriverSelection(data) {
    return data.text;
  }

  // Dropdown vẫn nêu loại phương tiện để dễ tìm; ô đã chọn chỉ giữ biển số.
  function formatVehicleFilterSelection(data) {
    if (!data || !data.element) return data ? data.text : '';
    return String($(data.element).data('short-label') || data.text || '');
  }

  function formatVehicleFilterResult(data) {
    if (!data || !data.id || !data.element) return data ? data.text : '';
    var type = String(data.id).split(':')[0];
    var label = type === 'mooc' ? 'Mooc' : 'Đầu kéo';
    var color = type === 'mooc' ? 'bg-label-warning' : 'bg-label-primary';
    var bks = String($(data.element).data('short-label') || data.text || '');
    return $('<div class="d-flex align-items-center justify-content-between gap-2"></div>')
      .append($('<span class="fw-medium text-truncate"></span>').text(bks))
      .append($('<span class="badge flex-shrink-0 ' + color + '"></span>').text(label));
  }

  function initListSearchSelects() {
    var isTuyenXa = currentPlanType() === 'tuyen_xa';
    var dropdownParent = isTuyenXa ? $('#ke-hoach-tuyen-xa-inline-filter') : $('#ke-hoach-inline-filter');
    var filters = $.extend({}, currentFilters || {});
    dropdownParent.find('input, select, button').prop('disabled', false);
    if (isTuyenXa) {
      appendTextOptions($('#filter-khach-hang'), $.map(listSearchDropdownData.customers, function (item) { return customerPlanLabel(item); }), filters.khach_hang || '');
    } else {
      appendCustomerFilterOptions($('#filter-khach-hang'), filters.khach_hang || []);
    }
    appendTextOptions($('#filter-dia-chi-kho'), listSearchDropdownData.kho, filters.dia_chi_kho || '');
    appendTextOptions($('#filter-bks-dau-keo'), $.map(listSearchDropdownData.vehicles, function (item) { return item.bks || ''; }), filters.bks_dau_keo || '');
    appendTextOptions($('#filter-bks-mooc'), $.map(listSearchDropdownData.moocs, function (item) { return item.bks || ''; }), filters.bks_mooc || '');
    appendTextOptions($('#filter-lai-xe'), $.map(listSearchDropdownData.drivers, function (item) { return item.ten || ''; }), filters.lai_xe || '');
    var driverMap = {};
    for (var di = 0; di < (listSearchDropdownData.drivers || []).length; di++) {
      var dv = listSearchDropdownData.drivers[di];
      driverMap[String(dv.ten || '').trim()] = String(dv.sdt || '').trim();
    }
    $('#filter-lai-xe option').each(function () {
      var phone = driverMap[String(this.value || '').trim()] || '';
      if (phone) $(this).data('phone', phone);
    });
    if (!isTuyenXa) appendVehicleFilterOptions($('#filter-phuong-tien'), filters.phuong_tien || '');
    setListFilterInputs(filters);
    $('#status-filter').val(currentStatus || '');
    if (isTuyenXa) {
      initSelect2(document.getElementById('filter-khach-hang'), '— Chọn khách hàng —', { dropdownParent: dropdownParent });
    } else {
      initPortCustomerFilterSelect($('#filter-khach-hang'), dropdownParent);
    }
    initSelect2(document.getElementById('filter-bks-dau-keo'), '— Chọn BKS đầu kéo —', { dropdownParent: dropdownParent });
    initSelect2(document.getElementById('filter-bks-mooc'), '— Chọn BKS mooc —', { dropdownParent: dropdownParent });
    initSelect2(document.getElementById('filter-lai-xe'), '— Chọn lái xe —', { dropdownParent: dropdownParent, templateResult: formatListDriverResult, templateSelection: formatListDriverSelection });
    initSelect2(document.getElementById('filter-da-du-hang'), '— Chọn đủ hàng —', { dropdownParent: dropdownParent, allowClear: true });
    initSelect2(document.getElementById('filter-dia-chi-kho'), '— Chọn địa chỉ kho —', { dropdownParent: dropdownParent });
    if (!isTuyenXa) {
      initSelect2(document.getElementById('filter-phuong-tien'), '— Chọn phương tiện —', { dropdownParent: dropdownParent, allowClear: true, templateResult: formatVehicleFilterResult, templateSelection: formatVehicleFilterSelection });
      initSelect2(document.getElementById('status-filter'), '— Chọn trạng thái —', { dropdownParent: dropdownParent, allowClear: true });
    }
  }

  function loadListSearchDropdowns(done) {
    if (listSearchDropdownsLoaded) {
      if (done) done();
      return;
    }
    if (done) listSearchDropdownCallbacks.push(done);
    if (listSearchDropdownsLoading) return;
    listSearchDropdownsLoading = true;
    var pending = 4;
    function finish() {
      pending -= 1;
      if (pending > 0) return;
      listSearchDropdownsLoaded = true;
      listSearchDropdownsLoading = false;
      var callbacks = listSearchDropdownCallbacks.splice(0);
      for (var i = 0; i < callbacks.length; i++) callbacks[i]();
    }
    $.ajax({
      url: '/api/khach-hang',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) listSearchDropdownData.customers = res.data.items;
      },
      complete: finish
    });
    $.ajax({
      url: '/api/phuong-tien',
      type: 'GET',
      dataType: 'json',
      data: { limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          listSearchDropdownData.vehicles = [];
          listSearchDropdownData.moocs = [];
          for (var i = 0; i < res.data.items.length; i++) {
            var item = res.data.items[i];
            if (String(item.loai_phuong_tien || '').toLowerCase().indexOf('mooc') !== -1) listSearchDropdownData.moocs.push(item);
            else listSearchDropdownData.vehicles.push(item);
          }
        }
      },
      complete: finish
    });
    $.ajax({
      url: '/api/danh-muc',
      type: 'GET',
      dataType: 'json',
      data: { phan_loai: 'Kho', limit: 500 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          listSearchDropdownData.kho = $.map(res.data.items, function (item) { return item.ten || ''; });
        }
      },
      complete: finish
    });
    $.ajax({
      url: '/api/lai-xe',
      type: 'GET',
      dataType: 'json',
      data: { limit: 100 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          listSearchDropdownData.drivers = res.data.items;
        }
      },
      complete: finish
    });
  }

  function initListDateFilters() {
    if (currentPlanType() !== 'tuyen_xa') {
      var $rangeInput = $('#filter-date-range');
      if (!$rangeInput.length || $rangeInput.data('daterangepicker') || typeof $.fn.daterangepicker !== 'function' || typeof moment === 'undefined') return;
      $rangeInput.daterangepicker({
        autoUpdateInput: false,
        autoApply: true,
        showDropdowns: true,
        opens: 'center',
        locale: {
          format: 'DD/MM/YYYY',
          separator: ' đến ',
          applyLabel: 'Áp dụng',
          cancelLabel: 'Xóa',
          customRangeLabel: 'Tùy chọn',
          daysOfWeek: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
          monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
          firstDay: 1
        }
      });
      var portDatePicker = $rangeInput.data('daterangepicker');
      if (portDatePicker && portDatePicker.container) {
        portDatePicker.container.addClass('khxh-port-filter-daterangepicker');
      }
      $rangeInput.on('apply.daterangepicker', function (event, picker) {
        $(this).val(picker.startDate.format('DD/MM/YYYY') + ' đến ' + picker.endDate.format('DD/MM/YYYY'));
        $(this).trigger('change');
      }).on('cancel.daterangepicker', function () {
        $(this).val('');
        $(this).trigger('change');
      }).on('show.daterangepicker', function (event, picker) {
        var $footer = picker.container.find('.drp-buttons');
        if (!$footer.length) return;
        $footer.find('.khxh-port-date-picker-shortcuts').remove();
        $footer.find('.drp-selected, .applyBtn').hide();
        $footer.find('.cancelBtn').show();
        var $shortcuts = $('<span class="khxh-port-date-picker-shortcuts"></span>')
          .append('<button type="button" class="btn btn-sm btn-label-secondary" data-port-date-quick="today">Hôm nay</button>')
          .append('<button type="button" class="btn btn-sm btn-label-secondary" data-port-date-quick="week">Tuần này</button>')
          .append('<button type="button" class="btn btn-sm btn-label-secondary" data-port-date-quick="month">Tháng này</button>');
        $footer.prepend($shortcuts);
        $footer.off('click.portDateQuick', '[data-port-date-quick]').on('click.portDateQuick', '[data-port-date-quick]', function () {
          var action = $(this).attr('data-port-date-quick');
          var end = moment().startOf('day');
          var start = end.clone();
          if (action === 'week') {
            start = end.clone().startOf('isoWeek');
            end = end.clone().endOf('isoWeek').startOf('day');
          } else if (action === 'month') {
            start = end.clone().startOf('month');
            end = end.clone().endOf('month').startOf('day');
          }
          picker.setStartDate(start);
          picker.setEndDate(end);
          $rangeInput.val(start.format('DD/MM/YYYY') + ' đến ' + end.format('DD/MM/YYYY')).trigger('change');
          picker.hide();
        });
      });
      return;
    }
    if (typeof flatpickr === 'undefined') return;
    $('#filter-date-from, #filter-date-to').each(function () {
      if (this._flatpickr) return;
      flatpickr(this, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        appendTo: document.body
      });
    });
  }

  function updatePortStatusTabs(counts, total) {
    if (currentPlanType() === 'tuyen_xa') return;
    counts = counts || {};
    $('#khxh-port-status-tabs [data-status-count]').each(function () {
      var status = String($(this).attr('data-status-count') || '');
      var count = status === 'all' ? (Number(total) || 0) : (Number(counts[status]) || 0);
      $(this).text(count);
    });
    $('#khxh-port-status-tabs [data-status]').each(function () {
      var isActive = String($(this).attr('data-status') || '') === String(currentStatus || '');
      $(this).toggleClass('active', isActive).attr('aria-selected', isActive ? 'true' : 'false');
    });
  }

  function initList() {
    if (initList._bound) return;
    initList._bound = true;
    var doc = document;
    initListDateFilters();
    setListSearchLoading(true);
    loadListSearchDropdowns(function () {
      initListSearchSelects();
      setListSearchLoading(false);
    });

    function canRestoreListSnapshot() {
      if (shouldForceReloadList()) return false;
      var navEntry = null;
      try {
        navEntry = window.performance && window.performance.getEntriesByType ? window.performance.getEntriesByType('navigation')[0] : null;
      } catch (e) {}
      if (navEntry && navEntry.type === 'reload') return false;
      if (!document.referrer) return false;
      try {
        var refUrl = new URL(document.referrer, window.location.origin);
        if (refUrl.origin !== window.location.origin) return false;
        return isKeHoachRoute(refUrl.pathname) && refUrl.pathname !== currentListPath();
      } catch (e) {
        return false;
      }
    }

    function restoreListSnapshot() {
      var snapshot = getListSnapshot();
      if (!snapshot) return false;
      currentPage = snapshot.currentPage || 1;
      currentKeyword = snapshot.currentKeyword || '';
      currentStatus = snapshot.currentStatus || '';
      currentFilters = snapshot.currentFilters || {};
      currentPortDateSort = snapshot.currentPortDateSort === 'asc' ? 'asc' : 'desc';
      setListFilterInputs(currentFilters);
      $('#status-filter').val(currentStatus);
      updatePortDateSortButton();
      updatePortStatusTabs(snapshot.portStatusCounts || {}, snapshot.portStatusTotal || 0);
      $('#list-body').html(snapshot.bodyHtml || '');
      if (snapshot.paginationWrapHtml) {
        $('#pagination-wrap').replaceWith(snapshot.paginationWrapHtml);
      }
      clearForceReloadList();
      return true;
    }

    function persistListSnapshot() {
      var paginationWrap = document.getElementById('pagination-wrap');
      setListSnapshot({
        currentPage: currentPage,
        currentKeyword: currentKeyword,
        currentStatus: currentStatus,
        currentFilters: currentFilters,
        currentPortDateSort: currentPortDateSort,
        portStatusCounts: window._khxhPortStatusCounts || {},
        portStatusTotal: window._khxhPortStatusTotal || 0,
        bodyHtml: $('#list-body').html(),
        paginationWrapHtml: paginationWrap ? paginationWrap.outerHTML : ''
      });
    }

    function isRowMenuInteractiveTarget(target) {
      return $(target).closest('button, a, input, select, textarea, label, .dropdown, .select2-container, [role="button"], .btn-tuyen-xa-toggle-du-hang, .btn-hang-cang-toggle-du-hang').length > 0;
    }

    function setRowMenuActive(row) {
      $('#list-body tr.khxh-row-menu-active').not(row).removeClass('khxh-row-menu-active');
      $(row).addClass('khxh-row-menu-active');
    }

    function openRowMenuAtCursor(row, x, y) {
      var dropdown = row.querySelector('.dropdown');
      var menu = row.querySelector('.dropdown-menu');
      if (!dropdown || !menu) return;

      // Cùng contract với helper dropdown dùng toàn hệ thống, nhưng không đi
      // qua nút CN nên menu không bị mở ở nút rồi mới dịch sang con trỏ.
      document.querySelectorAll('.dropdown[data-fd-open]').forEach(function (openDropdown) {
        var openMenu = openDropdown.querySelector('.dropdown-menu');
        if (!openMenu) return;
        openMenu.style.position = '';
        openMenu.style.top = '';
        openMenu.style.left = '';
        openMenu.style.display = '';
        openMenu.style.zIndex = '';
        openDropdown.removeAttribute('data-fd-open');
      });

      menu.style.position = 'fixed';
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
      menu.style.display = 'block';
      menu.style.zIndex = '1080';
      dropdown.setAttribute('data-fd-open', '1');
      setRowMenuActive(row);

      var margin = 8;
      var width = menu.offsetWidth || 190;
      var height = menu.offsetHeight || 200;
      var viewportW = window.innerWidth || document.documentElement.clientWidth;
      var viewportH = window.innerHeight || document.documentElement.clientHeight;
      var left = x;
      var top = y;
      if (left + width > viewportW - margin) left = Math.max(margin, x - width);
      if (top + height > viewportH - margin) top = Math.max(margin, y - height);
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }

    $('#list-body')
      .off('.khxhRowMenu')
      .on('contextmenu.khxhRowMenu', 'tr', function (e) {
        if (isRowMenuInteractiveTarget(e.target)) return;
        e.preventDefault();
        e.stopPropagation();
        var row = this;
        if (row.querySelector('.dropdown[data-fd-open]')) {
          var openDropdown = row.querySelector('.dropdown[data-fd-open]');
          var openMenu = openDropdown.querySelector('.dropdown-menu');
          if (openMenu) {
            openMenu.style.position = '';
            openMenu.style.top = '';
            openMenu.style.left = '';
            openMenu.style.display = '';
            openMenu.style.zIndex = '';
          }
          openDropdown.removeAttribute('data-fd-open');
          $(row).removeClass('khxh-row-menu-active');
          return;
        }
        openRowMenuAtCursor(row, e.clientX, e.clientY);
      })
      .on('dblclick.khxhRowMenu', 'tr', function (e) {
        if (isRowMenuInteractiveTarget(e.target)) return;
        var editButton = this.querySelector('.btn-edit-ke-hoach-xep-xe');
        var id = editButton && parseInt(editButton.getAttribute('data-id'), 10);
        if (id) {
          $('#list-body tr.khxh-row-menu-active').removeClass('khxh-row-menu-active');
          openEditFullscreenModal(id);
        }
      })
      // Chọn một chức năng nghĩa là đã rời khỏi thao tác chọn dòng. Bỏ nền
      // ngay tại đây, không đợi modal hoặc màn hình chức năng được đóng.
      .on('click.khxhRowMenu', '.khxh-row-action-menu .dropdown-item', function () {
        $(this).closest('tr').removeClass('khxh-row-menu-active');
      });

    $('#list-body').on('click.khxhRowMenu', '.khxh-row-actions-trigger', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var row = $(this).closest('tr')[0];
      if (!row) return;
      var dropdown = row.querySelector('.dropdown');
      var menu = row.querySelector('.dropdown-menu');
      if (dropdown && dropdown.hasAttribute('data-fd-open')) {
        menu.style.position = '';
        menu.style.top = '';
        menu.style.left = '';
        menu.style.display = '';
        menu.style.zIndex = '';
        dropdown.removeAttribute('data-fd-open');
        $(row).removeClass('khxh-row-menu-active');
        return;
      }
      var rect = this.getBoundingClientRect();
      openRowMenuAtCursor(row, rect.left + (rect.width / 2), rect.bottom);
    });

    function deleteItem(id) {
      $.ajax({
        url: '/api/ke-hoach-xep-xe/' + id,
        type: 'DELETE',
        dataType: 'json',
        success: function (res) {
          if (res.status === 'success') {
            if (notyf) notyf.success('Xoá kế hoạch thành công');
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

    $('#search-btn').on('click', function () {
      currentFilters = collectListFilters();
      if ($('#status-filter').length) currentStatus = $('#status-filter').val() || '';
      currentPage = 1;
      loadList();
    });
    $('.ke-hoach-list-filter input, .ke-hoach-list-filter select').on('keypress', function (e) {
      if (e.which === 13) {
        currentFilters = collectListFilters();
        if ($('#status-filter').length) currentStatus = $('#status-filter').val() || '';
        currentPage = 1;
        loadList();
      }
    });
    $('.btn-reload').on('click', function () {
      clearListFilters();
      currentPage = 1;
      loadList();
    });
    $('#ke-hoach-hang-cang-screen').on('click', '.khxh-port-date-quick', function () {
      if (currentPlanType() === 'tuyen_xa' || typeof moment === 'undefined') return;
      var $rangeInput = $('#filter-date-range');
      var picker = $rangeInput.data('daterangepicker');
      if (!picker) return;

      var date = moment().startOf('day');
      if ($(this).attr('data-date-quick') === 'tomorrow') date.add(1, 'day');
      picker.setStartDate(date.clone());
      picker.setEndDate(date.clone());
      $rangeInput.val(date.format('DD/MM/YYYY') + ' đến ' + date.format('DD/MM/YYYY'));
      $('#search-btn').trigger('click');
    });
    $('#ke-hoach-list-app').on('click', '#khxh-port-status-tabs [data-status]', function () {
      if (currentPlanType() === 'tuyen_xa') return;
      var nextStatus = String($(this).attr('data-status') || '');
      if (nextStatus === String(currentStatus || '')) return;
      currentStatus = nextStatus;
      currentPage = 1;
      updatePortStatusTabs(window._khxhPortStatusCounts || {}, window._khxhPortStatusTotal || 0);
      loadList();
    });
    $('#khxh-date-sort').on('click', function () {
      currentPortDateSort = currentPortDateSort === 'desc' ? 'asc' : 'desc';
      currentPage = 1;
      updatePortDateSortButton();
      loadList();
    });
    updatePortDateSortButton();
    $('#pagination-jump').on('keypress', function (e) {
      if (e.which === 13) {
        var total = parseInt($(this).attr('data-total-pages'), 10) || 0;
        var page = parseInt($(this).val(), 10) || 0;
        if (page > 0 && page <= total) {
          currentPage = page;
          loadList();
        }
      }
    });

    $(document).on('click', '.btn-view-ke-hoach-xep-xe', function (e) {
      e.preventDefault();
      openDetailModal($(this).data('id'));
    });
    $(document).on('click', '.btn-edit-ke-hoach-xep-xe', function (e) {
      e.preventDefault();
      persistListSnapshot();
      openEditFullscreenModal($(this).data('id'));
    });
    $(document).on('click', '.btn-open-port-cost-tab', function (e) {
      e.preventDefault();
      persistListSnapshot();
      openEditFullscreenModal($(this).data('id'), { initialTab: 'cost' });
    });
    $(document).on('click', '#ke-hoach-detail-edit-btn', function (e) {
      var id = $(this).attr('href') || '';
      var match = id.match(/ke-hoach-xep-xe\/(\d+)\/sua/);
      if (!match) return;
      e.preventDefault();
      var detailModalEl = document.getElementById('ke-hoach-detail-modal');
      var detailModal = detailModalEl && bootstrap.Modal.getInstance ? bootstrap.Modal.getInstance(detailModalEl) : null;
      if (detailModal) detailModal.hide();
      persistListSnapshot();
      openEditFullscreenModal(match[1]);
    });
    $('#ke-hoach-edit-fullscreen-modal, #ke-hoach-tuyen-xa-edit-fullscreen-modal').on('hide.bs.modal', function (e) {
      if (e.target !== this || !nestedContEditContext || !nestedContEditContext.parentId) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      var nestedToRestore = $.extend({}, nestedContEditContext);
      nestedContRestorePending = nestedToRestore;
      nestedContEditContext = null;
      openEditFullscreenModal(nestedToRestore.parentId, { preserveListSettings: true, keepOpen: true, planType: nestedToRestore.parentPlanType });
    });
    $('#ke-hoach-edit-fullscreen-modal, #ke-hoach-tuyen-xa-edit-fullscreen-modal').on('hidden.bs.modal', function (e) {
      if (e.target !== this) return;
      if (this.id === 'ke-hoach-edit-fullscreen-modal' && Drupal.keHoachChiPhi && typeof Drupal.keHoachChiPhi.unmountPortTab === 'function') {
        Drupal.keHoachChiPhi.unmountPortTab();
      }
      $('#ke-hoach-edit-modal-content, #ke-hoach-tuyen-xa-edit-modal-content').empty();
      if (detachedCreateFormApp) {
        $('#ke-hoach-edit-modal-template').after(detachedCreateFormApp);
        detachedCreateFormApp = null;
      }
      if (listPageSettingsBeforeEdit) {
        Drupal.settings.ke_hoach_xep_xe = listPageSettingsBeforeEdit;
        listPageSettingsBeforeEdit = null;
        syncPageSettings();
      }
      initForm._bound = false;
      initForm._formNode = null;
      initForm._planType = null;
      initForm();
    });
    $(document).on('click', '.btn-delete-ke-hoach-xep-xe', function (e) {
      e.preventDefault();
      var id = $(this).data('id');
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xác nhận xoá',
          text: 'Bạn có chắc chắn muốn xoá kế hoạch này?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xoá',
          cancelButtonText: 'Huỷ',
          confirmButtonColor: '#d33',
          customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false
        }).then(function (result) {
          if (result.isConfirmed) deleteItem(id);
        });
      } else if (confirm('Bạn có chắc chắn muốn xoá kế hoạch này?')) {
        deleteItem(id);
      }
    });
    $(document).on('click', '.btn-tuyen-xa-toggle-du-hang, .btn-hang-cang-toggle-du-hang', function (e) {
      e.preventDefault();
      e.stopPropagation();

      var $badge = $(this);
      if ($badge.attr('aria-disabled') === 'true') return;
      var id = parseInt($badge.attr('data-id'), 10) || 0;
      if (!id) return;
      var currentValue = parseInt($badge.attr('data-current'), 10) === 1 ? 1 : 0;
      var nextValue = currentValue ? 0 : 1;
      var contLabel = String($badge.attr('data-cont') || '').trim();
      var nextLabel = nextValue ? 'Đã đủ hàng' : 'Chưa đủ hàng';

      var applyBadgeState = function () {
        $badge
          .attr('data-current', nextValue)
          .attr('aria-pressed', nextValue ? 'true' : 'false')
          .toggleClass('bg-label-success', !!nextValue)
          .toggleClass('bg-label-warning', !nextValue)
          .text(nextLabel);
        persistListSnapshot();
      };
      var saveStatus = function () {
        $badge.attr('aria-disabled', 'true').addClass('is-saving');
        return $.ajax({
          url: '/api/quan-ly-cont/' + id,
          type: 'PUT',
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          data: JSON.stringify({ da_du_hang: nextValue })
        }).then(function (res) {
          if (!res || res.status !== 'success') {
            return $.Deferred().reject({ khxhMessage: (res && res.message) || 'Cập nhật trạng thái cont thất bại' }).promise();
          }
          applyBadgeState();
          if (notyf) notyf.success('Đã cập nhật trạng thái cont: ' + nextLabel);
          return res;
        }, function (jqXHR) {
          return $.Deferred().reject({ khxhMessage: apiMsg(jqXHR) }).promise();
        }).always(function () {
          $badge.removeAttr('aria-disabled').removeClass('is-saving');
        });
      };

      var confirmText = 'Chuyển ' + (contLabel ? 'cont ' + contLabel + ' ' : 'cont này ') + 'sang trạng thái “' + nextLabel + '”?';
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xác nhận trạng thái cont',
          text: confirmText,
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Xác nhận và lưu',
          cancelButtonText: 'Huỷ',
          showLoaderOnConfirm: true,
          allowOutsideClick: function () { return !Swal.isLoading(); },
          customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false,
          preConfirm: function () {
            return saveStatus().then(function (res) {
              return res;
            }, function (error) {
              Swal.showValidationMessage(error && error.khxhMessage ? error.khxhMessage : 'Cập nhật trạng thái cont thất bại');
              return false;
            });
          }
        });
      } else if (confirm(confirmText)) {
        saveStatus().fail(function (error) {
          if (notyf) notyf.error(error && error.khxhMessage ? error.khxhMessage : 'Cập nhật trạng thái cont thất bại');
        });
      }
    });
    $(document).on('keydown', '.btn-tuyen-xa-toggle-du-hang, .btn-hang-cang-toggle-du-hang', function (e) {
      if (e.which === 13 || e.which === 32) {
        e.preventDefault();
        $(this).trigger('click');
      }
    });
    $(document).on('click', '#pagination-wrap .page-link', function (e) {
      e.preventDefault();
      var page = parseInt($(this).data('page'), 10) || 0;
      if (page && page !== currentPage) {
        currentPage = page;
        loadList();
      }
    });

    if (canRestoreListSnapshot() && restoreListSnapshot()) {
      return;
    }
    clearForceReloadList();
    loadList();
    try {
      var url = new URL(window.location.href);
      if (url.searchParams.get('open_create') === '1') {
        url.searchParams.delete('open_create');
        window.history.replaceState({}, document.title, url.pathname + (url.search ? url.search : ''));
        $('.btn-open-create-ke-hoach').first().trigger('click');
      }
    } catch (e) {}
  }

  function loadList() {
    var tbody = document.getElementById('list-body');
    var listColumnCount = currentPlanType() === 'tuyen_xa' ? 8 : 9;
    tbody.innerHTML = '<tr id="loading-row"><td colspan="' + listColumnCount + '" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>';
    var params = { page: currentPage, loai_ke_hoach: currentPlanType(), limit: 50 };
    params.sort_created = currentPortDateSort;
    if (currentKeyword) params.keyword = currentKeyword;
    if (currentStatus) params.trang_thai_van_chuyen = currentStatus;
    $.extend(params, currentFilters || {});
    params.limit = 50;
    $.ajax({
      url: '/api/ke-hoach-xep-xe',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();
        if (res.status !== 'success' || !res.data) {
          tbody.innerHTML = '<tr><td colspan="' + listColumnCount + '" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi không xác định') + '</td></tr>';
          return;
        }
        var resp = res.data;
        var items = resp.items || [];
        var pageSize = resp.limit || 50;
        window._khxhPortStatusCounts = resp.status_counts || {};
        window._khxhPortStatusTotal = Number(resp.status_total) || 0;
        updatePortStatusTabs(window._khxhPortStatusCounts, window._khxhPortStatusTotal);
        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="' + listColumnCount + '" class="text-center py-4">Không có dữ liệu</td></tr>';
          renderPagination(resp);
          return;
        }
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var row = items[i];
          var daDuHang = parseInt(row.da_du_hang, 10) === 1;
          var stt = (resp.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(row);
          // Danh sách hàng cảng dùng mã khách hàng để tránh tên dài làm vỡ bố cục;
          // tuyến xa vẫn dùng customerPlanLabel như trước.
          var khName = currentPlanType() === 'tuyen_xa'
            ? customerPlanLabel(row.khach_hang)
            : ((row.khach_hang && row.khach_hang.ma_kh) || customerPlanLabel(row.khach_hang));
          var khFullName = customerFullName(row.khach_hang);
          var hinhThucBadge = row.hinh_thuc_van_tai ? '<span class="badge ' + hinhThucColor(row.hinh_thuc_van_tai) + '" title="Hình thức vận tải: ' + escHtml(hinhThucLabel(row.hinh_thuc_van_tai)) + '">' + escHtml(hinhThucLabel(row.hinh_thuc_van_tai)) + '</span>' : '';
          var hinhThucStatus = '';
          var planRoleClass = '';
          var listRowJson = row.thong_tin_json || {};
          var returnContText = '';
          var returnContDisplayHtml = '';
          var returnContTitle = '';
          if (currentPlanType() === 'tuyen_xa') {
            if (parseInt(row.nid_ke_hoach_nguon, 10) || listRowJson.ke_hoach_ket_hop_hang) {
              hinhThucStatus = 'Kế hoạch kết hợp';
              planRoleClass = 'khxh-plan-role-ket-hop';
            } else if (listRowJson.vai_tro_ke_hoach === 'thuc_hien_chang' || (!listRowJson.vai_tro_ke_hoach && row.ke_hoach_cont_ref_nid)) {
              hinhThucStatus = 'Thực hiện chặng';
              planRoleClass = 'khxh-plan-role-thuc-hien-chang';
            } else {
              hinhThucStatus = 'Kế hoạch gốc';
              planRoleClass = 'khxh-plan-role-goc';
            }
            var returnInfo = listRowJson.ket_hop || {};
            var returnCont = returnInfo.cont_ref || null;
            if ((parseInt(returnInfo.enabled, 10) === 1 || returnInfo.enabled === true) && returnCont) {
              var returnDestination = returnInfo.cont_keo_ve_den || '';
              if (!returnDestination) {
                var returnJson = returnCont.thong_tin_json || {};
                var returnPoints = [
                  returnCont.bai_lay_thuc_te || returnCont.bai_lay_cont || '',
                  parseInt(returnJson.bai_ha_tam_1_enabled, 10) === 1 ? (returnJson.bai_ha_tam_1 || '') : '',
                  returnCont.dia_chi_kho || '',
                  parseInt(returnJson.bai_ha_tam_2_enabled, 10) === 1 ? (returnJson.bai_ha_tam_2 || '') : '',
                  returnCont.bai_ha_thuc_te || returnCont.bai_ha_cont || ''
                ].filter(Boolean);
                returnDestination = returnPoints[parseInt(returnInfo.cont_thuc_hien_den_index, 10)] || '';
              }
              var returnNumber = returnCont.so_cont || '';
              returnContText = [returnNumber, returnDestination].filter(Boolean).join(' - ');
            }
          } else if (row.is_cont_keo_ve || normalizeHinhThuc(row.hinh_thuc_van_tai) === 'dong_hang') {
            hinhThucStatus = 'Kéo về';
          } else if (row.hinh_thuc_van_tai === 'cat_keo' || row.hinh_thuc_van_tai === 'cat_keo_cheo' || row.hinh_thuc_van_tai === 'tha_mooc') {
            hinhThucStatus = 'Kéo lên';
          }
          // Với hàng cảng, cont được chọn trong ô "Cont kéo về" nằm ở cont_ref.
          // Hiển thị ngay cạnh hình thức vận tải để nhìn nhanh trên danh sách.
          if (currentPlanType() !== 'tuyen_xa' && row.cont_ref) {
            var returnContNumber = row.cont_ref.so_cont || '';
            returnContText = returnContNumber ? '- ' + returnContNumber + ' (Về)' : '';
            returnContDisplayHtml = returnContNumber
              ? '- <span class="khxh-port-list-cont-number">' + escHtml(returnContNumber) + '</span> (Về)'
              : '';
            var returnContDestination = row.cont_ref.bai_ha_thuc_te || row.cont_ref.bai_ha_cont || '';
            returnContTitle = 'Số Cont: ' + (returnContNumber || 'Chưa có') + (returnContDestination ? ' (Về) - ' + returnContDestination : '');
          }
          var hinhThucStatusClass = hinhThucStatus === 'Kéo về'
            ? 'khxh-list-status-keo-ve'
            : (hinhThucStatus === 'Kéo lên' ? 'khxh-list-status-keo-len' : '');
          var hangCangPlanStatus = String(row.trang_thai_van_chuyen || 'Chờ thực hiện');
          var contTextRaw = [row.loai_cont || '', row.so_cont || ''].filter(Boolean).join(' - ');
          var baiLayDisplay = row.bai_lay_thuc_te || row.bai_lay_cont || '';
          var baiHaDisplay = row.bai_ha_thuc_te || row.bai_ha_cont || '';
          var isHangCangList = currentPlanType() !== 'tuyen_xa';
          var customerTitle = isHangCangList
            ? 'Khách hàng: ' + (khName ? (khName + (khFullName ? ' - ' + khFullName : '')) : 'Chưa có') + (row.so_bkg ? ' | BKG: ' + row.so_bkg : '')
            : khFullName;
          var customerDisplay = khName ? escHtml(khName) : (isHangCangList ? '_' : '<span class="text-muted fst-italic small">khách hàng</span>');
          if (isHangCangList && row.so_bkg) {
            customerDisplay += ' <span class="khxh-customer-bkg">- ' + escHtml(row.so_bkg) + '</span>';
          }
          var rowActionMenu = '<span class="khxh-row-action-menu">' + actions + '</span>';
          html += '<tr>' +
            '<td><button type="button" class="khxh-row-actions-trigger" title="Mở chức năng kế hoạch" aria-label="Mở chức năng kế hoạch #' + stt + '">' + stt + '</button></td>' +
            '<td class="khxh-date-cell">' + (currentPlanType() === 'tuyen_xa'
              ? '<div class="khxh-date-stack">' + (dateOnlyStack(row.created) || '<span class="text-muted">—</span>') + (hinhThucStatus ? '<br><span class="khxh-htvt-status ' + planRoleClass + '">' + escHtml(hinhThucStatus) + '</span>' : '') + '</div>' + rowActionMenu
              : '<div class="khxh-date-stack">' + (dateOnlyStack(row.ngay_gio_ke_hoach) || '<span class="text-muted">—</span>') + (hinhThucStatus ? '<br><span class="khxh-htvt-status ' + hinhThucStatusClass + '">' + escHtml(hinhThucStatus) + '</span>' : '') + '</div>' + rowActionMenu) + '</td>' +
            '<td class="khxh-common-cell">' +
              '<div class="khxh-customer-cell"' + (customerTitle ? ' title="' + escHtml(customerTitle) + '"' : '') + '>' + customerDisplay + '</div>' +
              '<div class="khxh-htvt-cell">' +
                ((hinhThucBadge || returnContText) ? '<div class="khxh-htvt-badge-wrap">' + hinhThucBadge + (returnContText ? '<span class="khxh-return-cont-list" title="' + escHtml(returnContTitle || ('Cont kéo về: ' + returnContText)) + '">' + (returnContDisplayHtml || escHtml(returnContText)) + '</span>' : '') + '</div>' : '') +
              '</div>' +
            '</td>' +
            '<td class="khxh-container-cell">' +
              (currentPlanType() === 'tuyen_xa'
                ? '<div>' + (row.loai_cont ? escHtml(row.loai_cont) : '<span class="text-muted fst-italic small">loại cont</span>') + '</div>' +
                  '<div>' + (row.so_cont ? escHtml(row.so_cont) : '<span class="text-muted fst-italic small">số cont</span>') + '</div>' +
                  '<div>' + (row.loai_hang ? escHtml(row.loai_hang) : '<span class="text-muted fst-italic small">loại hàng</span>') + '</div>'
                : '<div title="Container: ' + escHtml(contTextRaw || 'Chưa có') + '">' + (contTextRaw ? (row.loai_cont ? escHtml(row.loai_cont) + (row.so_cont ? ' - ' : '') : '') + (row.so_cont ? '<span class="khxh-port-list-cont-number">' + escHtml(row.so_cont) + '</span>' : '') : '_') + '</div>' +
                '<div title="Seal chính: ' + escHtml(row.so_seal_chinh || 'Chưa có') + '">' + (row.so_seal_chinh ? escHtml(row.so_seal_chinh) : '_') + '</div>' +
                (row.so_seal_tam ? '<div title="Seal phụ: Có"><span class="fst-italic">Có seal phụ</span></div>' : '')) +
            '</td>' +
            '<td class="khxh-vehicle-cell">' + vehicleListInfoHtml(row) + '</td>' +
            '<td class="khxh-kho-cell"' + (isHangCangList ? ' title="Địa chỉ kho: ' + escHtml(row.dia_chi_kho || 'Chưa có') + '"' : '') + '>' + (row.dia_chi_kho ? escHtml(row.dia_chi_kho) : (isHangCangList ? '_' : '')) + '</td>' +
            '<td class="text-nowrap">' +
              '<div class="khxh-hanh-trinh-cell">' +
                '<div class="khxh-hanh-trinh-box"' + (isHangCangList ? ' title="Bãi lấy: ' + escHtml(baiLayDisplay || 'Chưa có') + '"' : '') + '>' + (baiLayDisplay ? escHtml(baiLayDisplay) : (isHangCangList ? '_' : '<span class="text-muted fst-italic small">Chưa có</span>')) + '</div><div class="khxh-hanh-trinh-separator"></div><div class="khxh-hanh-trinh-box"' + (isHangCangList ? ' title="Bãi hạ: ' + escHtml(baiHaDisplay || 'Chưa có') + '"' : '') + '>' + (baiHaDisplay ? escHtml(baiHaDisplay) : (isHangCangList ? '_' : '<span class="text-muted fst-italic small">Chưa có</span>')) + '</div>' +
              '</div>' +
            '</td>' +
            (currentPlanType() === 'tuyen_xa' ? '' : '<td class="khxh-cang-cell" title="Cảng xuất: ' + escHtml(row.cang_xuat || 'Chưa có') + '">' + (row.cang_xuat ? escHtml(row.cang_xuat) : '_') + '</td>') +
            '<td class="khxh-status-cell">' + (currentPlanType() === 'tuyen_xa'
              ? '<span class="badge ' + (daDuHang ? 'bg-label-success' : 'bg-label-warning') + ' btn-tuyen-xa-toggle-du-hang" role="button" tabindex="0" aria-pressed="' + (daDuHang ? 'true' : 'false') + '" data-id="' + parseInt(row.nid, 10) + '" data-current="' + (daDuHang ? '1' : '0') + '" data-cont="' + escHtml(row.so_cont || '') + '" title="Trạng thái cont: ' + (daDuHang ? 'Đã đủ hàng' : 'Chưa đủ hàng') + '. Bấm để thay đổi">' + (daDuHang ? 'Đã đủ hàng' : 'Chưa đủ hàng') + '</span>'
              : '<span class="badge ' + hangCangPlanStatusColor(hangCangPlanStatus) + '" title="Trạng thái kế hoạch: ' + escHtml(hangCangPlanStatus) + '">' + escHtml(hangCangPlanStatus) + '</span>') + '</td>' +
            '</tr>';
        }
        tbody.innerHTML = html;
        renderPagination(resp);
        if ($('#ke-hoach-list-app').length) {
          setListSnapshot({
            currentPage: currentPage,
            currentKeyword: currentKeyword,
            currentStatus: currentStatus,
            currentPortDateSort: currentPortDateSort,
            portStatusCounts: window._khxhPortStatusCounts || {},
            portStatusTotal: window._khxhPortStatusTotal || 0,
            bodyHtml: $('#list-body').html(),
            paginationWrapHtml: document.getElementById('pagination-wrap') ? document.getElementById('pagination-wrap').outerHTML : ''
          });
        }
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.innerHTML = '<tr><td colspan="' + listColumnCount + '" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>';
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function renderPagination(resp) {
    var container = document.getElementById('pagination-wrap');
    if (!container) return;
    var ul = container.querySelector('ul.pagination');
    if (!ul) return;
    ul.innerHTML = '';
    var total = resp.total_pages || 0;
    var current = resp.current_page || 0;
    var totalItems = resp.total || 0;
    var infoEl = document.getElementById('pagination-info');
    if (infoEl) infoEl.textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    var totalPagesEl = document.getElementById('pagination-total-pages');
    if (totalPagesEl) totalPagesEl.textContent = '/ ' + total;
    var jumpInput = document.getElementById('pagination-jump');
    if (jumpInput) {
      jumpInput.value = current;
      jumpInput.setAttribute('data-total-pages', total);
    }
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

  function formatDateBadge(val) {
    if (!val) return '';
    return dateTimeStack(val);
  }

  function initForm() {
    // Không lấy form "đầu tiên" trong DOM: khi mở kế hoạch liên quan có thể
    // đồng thời còn markup của cả modal hàng cảng và tuyến xa. Luôn bám theo
    // loại kế hoạch đang được API trả về cho modal hiện tại.
    var formContentSelector = currentPlanType() === 'tuyen_xa'
      ? '#ke-hoach-tuyen-xa-edit-modal-content #ke-hoach-form-app'
      : '#ke-hoach-edit-modal-content #ke-hoach-form-app';
    var $formApp = $(formContentSelector).first();
    if (!$formApp.length) {
      $formApp = $('#ke-hoach-form-app').first();
    }
    if (!$formApp.length) return;
    var formNode = $formApp[0];
    var planType = currentPlanType();
    if (initForm._bound && initForm._formNode === formNode && initForm._planType === planType) return;
    initForm._bound = true;
    initForm._formNode = formNode;
    initForm._planType = planType;

    var state = {
      customers: [],
      drivers: [],
      vehicles: [],
      vehicleMap: {},
      moocs: [],
      moocMap: {},
      diaDiem: { bai: [], cang: [], kho: [], loaiHang: [] },
      cauHinh: { diaChiKho: [], loaiHang: [], loaiCont: ['20RF', '20DC', '40HC', '40RF', '40DC'] },
      contCandidateCache: {},
      contCandidatePending: {},
      pendingContDestinationUpdates: {},
      lines: [],
      activeLineKey: null,
      costSummary: { total: 0, customer: 0, company: 0, driver_self: 0 }
    };
	    var lineSeq = 0;
	    var vehicleModal = null;
    var contRefModal = null;
    var activeContPickerLineKey = null;
    var activeContPickerMode = 'source';
    var activePickerType = 'vehicle';
    var activePortTransportSelect = null;
    var activePortTransportTimer = null;
    var contPickerRowClickTimer = null;
    var formModal = null;
    var selectedPlanFiles = [];
    var MAX_PLAN_FILES = 25;
    var dropdownsLoaded = false;
    var dropdownsLoading = false;
    function $form(selector) {
      return $formApp.find(selector);
    }
    function $formOrPage(selector) {
      var $el = $form(selector);
      return $el.length ? $el : $(selector);
    }

    function formDropdownParent() {
      var $modal = $formApp.closest('.modal');
      if (!$modal.length) {
        $modal = $form('#ke-hoach-fullscreen-modal');
      }
      return $modal.length ? $modal : $(document.body);
    }
    var useTableLayout = $form('#ke-hoach-lines-body').length > 0;
    if (planType === 'tuyen_xa') {
      $form('#form-title').text('Xếp xe tuyến xa');
      $formApp.find('.card-header a[href="/ke-hoach-xep-xe"]').attr('href', '/ke-hoach-tuyen-xa');
    }

    $(document)
      .off('click', '.btn-open-vehicle-modal')
	      .off('click', '.btn-open-mooc-modal')
	      .off('click', '.btn-open-cont-ref-modal')
	      .off('click', '.btn-open-return-cont-modal')
	      .off('click', '.btn-remove-return-cont')
	      .off('click', '.btn-remove-row-ke-hoach')
      .off('click', '.btn-copy-row-ke-hoach')
      .off('click', '.btn-pick-vehicle')
      .off('change', 'input[name="vehicle-picker-radio"]')
      .off('click', '.line-hinh-thuc-radio')
      .off('change', '.line-hinh-thuc-select')
      .off('select2:open', '.line-hinh-thuc-select')
      .off('select2:close', '.line-hinh-thuc-select')
      .off('mousedown', '.select2-results__option')
      .off('input', '.line-cont-filter-bkg, .line-cont-filter-cont')
      .off('change', '.line-cont-filter-kho, .line-cont-filter-du-hang')
      .off('change', '.line-cont-ref-checkbox')
	      .off('change', '.line-cont-route-start, .line-cont-route-end')
      .off('click', '.cont-picker-row')
      .off('change', '.line-chuyen-xa-toggle')
      .off('change', '.line-bai-thuc-te-toggle')
      .off('change', '.line-bai-ha-tam-1-toggle, .line-bai-ha-tam-2-toggle')
      .off('change', '.line-tang-bo-toggle')
      .off('change', '.line-ket-hop-toggle')
      .off('change', '.line-plan-root-toggle')
      .off('change', '.line-plan-role-radio')
      .off('click', '.btn-line-toggle-du-hang')
	      .off('keydown', '.btn-line-toggle-du-hang')
      .off('change', '.line-kho-select, .line-bai-lay-select, .line-bai-ha-select, .line-bai-ha-tam-1-select, .line-bai-ha-tam-2-select, .line-bai-lay-thuc-te-select, .line-bai-ha-thuc-te-select')
      .off('input', '.line-money-input')
      .off('click', '.khxh-section-nav-item')
      .off('input change', '#ke-hoach-form input, #ke-hoach-form select, #ke-hoach-form textarea')
      .off('change', '.line-bai-ha-theo-ke-hoach-checkbox')
      .off('change', '.line-cont-picker-wrap .line-bai-ha-thuc-te-select')
      .off('change blur', '.cont-inline-note')
      .off('click', '#cont-ref-picker-confirm-btn, #port-cont-ref-picker-confirm-btn')
      .off('click', '#vehicle-picker-clear-btn')
      .off('input', '#vehicle-picker-search')
      .off('change', '#nid_khach_hang-input, .line-customer-select');

    function applyDropdownData(cache) {
      cache = cache || {};
      state.customers = cache.customers || [];
      state.drivers = cache.drivers || [];
      state.vehicles = cache.vehicles || [];
      state.vehicleMap = {};
      for (var i = 0; i < state.vehicles.length; i++) {
        state.vehicleMap[String(state.vehicles[i].nid)] = state.vehicles[i];
      }
      state.moocs = [];
      state.moocMap = {};
      for (var m = 0; m < state.vehicles.length; m++) {
        if (String(state.vehicles[m].loai_phuong_tien || '').toLowerCase().indexOf('mooc') !== -1) {
          state.moocs.push(state.vehicles[m]);
          state.moocMap[String(state.vehicles[m].nid)] = state.vehicles[m];
        }
      }
      state.diaDiem = $.extend({ bai: [], cang: [], kho: [], loaiHang: [] }, cache.diaDiem || {});
      state.diaDiem.bai = Array.isArray(state.diaDiem.bai) ? state.diaDiem.bai : [];
      state.diaDiem.cang = Array.isArray(state.diaDiem.cang) ? state.diaDiem.cang : [];
      state.diaDiem.kho = Array.isArray(state.diaDiem.kho) ? state.diaDiem.kho : [];
      state.diaDiem.loaiHang = Array.isArray(state.diaDiem.loaiHang) ? state.diaDiem.loaiHang : [];
      state.cauHinh.diaChiKho = state.diaDiem.kho.slice();
      state.cauHinh.loaiHang = state.diaDiem.loaiHang.slice();

      var html = '<option value="0">— Chọn —</option>';
      for (var j = 0; j < state.customers.length; j++) {
        html += '<option value="' + state.customers[j].nid + '">' + escHtml(customerPlanLabel(state.customers[j])) + '</option>';
      }
      $form('#nid_khach_hang-input').html(html);
      refreshLineSources();
    }

    function showLoading(show) {
      var $loading = $form('#form-loading');
      $loading.toggle(show);
      $loading.closest('.modal-body').toggleClass('khxh-form-loading-active', show);
      $form('#save-btn, #add-line-btn, #reset-lines-btn, #complete-plan-btn, #khxh-status-btn').prop('disabled', show);
      if (useTableLayout) {
        $form('#ke-hoach-fullscreen-modal').find('input, select, button').not('.btn-close').prop('disabled', show);
      }
    }

    function nextLineKey() {
      lineSeq += 1;
      return 'line-' + lineSeq;
    }

	    function findLine(key) {
	      for (var i = 0; i < state.lines.length; i++) {
	        if (state.lines[i].key === key) return state.lines[i];
	      }
	      return null;
	    }

	    function getLineElementByKey(key) {
	      if (!key) return $();
	      return useTableLayout
	        ? $form('#ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + key + '"]')
	        : $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]');
	    }

    function createLine(source) {
      return $.extend({
        key: nextLineKey(),
        nid_khach_hang: 0,
        nid_phuong_tien: 0,
        nid_mooc: 0,
        mooc: null,
        nid_lai_xe: 0,
        so_bkg: '',
        dia_chi_kho: '',
        loai_cont: '',
        loai_hang: '',
        so_cont: '',
        so_seal_chinh: '',
        so_seal_tam: '',
        bai_lay_cont: '',
        bai_lay_thuc_te: '',
        bai_ha_cont: '',
        bai_ha_thuc_te: '',
        bai_ha_tam_1_enabled: 0,
        bai_ha_tam_1: '',
        bai_ha_tam_2_enabled: 0,
        bai_ha_tam_2: '',
        vi_tri_cont_hien_tai: '',
        vi_tri_cont_index_hien_tai: 0,
        vai_tro_ke_hoach: 'ke_hoach_goc',
        cong_viec_chinh_hoan_thanh: 0,
        cont_keo_ve_tu: '',
        cont_keo_ve_den: '',
        cont_thuc_hien_tu_index: -1,
        cont_thuc_hien_den_index: -1,
        cont_thuc_hien_chang: [],
        cang_xuat: '',
        cut_off: '',
        ngay_bat_dau: '',
        ngay_gio_ke_hoach: '',
        ngay_ket_thuc: '',
        ghi_chu: '',
        kiem_dich: 0,
        kiem_hoa: 0,
        hun_trung: 0,
        cont_keo_ve_kiem_dich: 0,
        cont_keo_ve_kiem_hoa: 0,
        cont_keo_ve_hun_trung: 0,
        cont_keo_ve_seal_phu: 0,
	        hinh_thuc_van_tai: '',
	        hinh_thuc_tinh_luong_lai_xe: 'khoan',
	        ke_hoach_cont_ref_nid: 0,
	        cont_ref_label: '',
	        cont_ref: null,
	        da_cat_mooc: 0,
        da_du_hang: 0,
        ha_bai_ngoai: 0,
        ha_cang: 0,
        tang_bo: {
          enabled: 0,
          nid_khach_hang: 0,
          dia_chi: '',
          ghi_chu: '',
          doanh_thu_khach_hang: 0,
          luong_lai_xe: 0
        },
        ke_hoach_ket_hop_enabled: 0,
        ket_hop: {
          enabled: 0
        }
      }, source || {});
    }

    function findDriver(id) {
      id = parseInt(id, 10) || 0;
      for (var i = 0; i < state.drivers.length; i++) {
        if ((parseInt(state.drivers[i].nid, 10) || 0) === id) return state.drivers[i];
      }
      return null;
    }

    function buildTagOptions(list, value) {
      var html = '<option value="">— Chọn —</option>';
      var seen = {};
      list = Array.isArray(list) ? list : [];
      value = value || '';
      for (var i = 0; i < list.length; i++) {
        if (seen[list[i]]) continue;
        seen[list[i]] = true;
        html += '<option value="' + escHtml(list[i]) + '"' + (list[i] === value ? ' selected' : '') + '>' + escHtml(list[i]) + '</option>';
      }
      if (value && !seen[value]) {
        html += '<option value="' + escHtml(value) + '" selected>' + escHtml(value) + '</option>';
      }
      return html;
    }

    function vehicleSummaryText(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      if (!vehicle) {
        return '';
      }
      var mooc = state.moocMap[String(line.nid_mooc || 0)] || null;
      var parts = [];
      if (vehicle.bks) parts.push(vehicle.bks);
      if (mooc && mooc.bks) parts.push(mooc.bks);
      if (vehicle.lai_xe && vehicle.lai_xe.ten) parts.push(vehicle.lai_xe.ten);
      return parts.join(' - ');
    }

    function vehicleOnlyText(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      if (!vehicle) return '';
      return vehicle.bks || '';
    }

    function vehicleSummaryCardHtml(line) {
      var text = vehicleOnlyText(line);
      if (!text) {
        return '<span class="vehicle-inline-placeholder">Chọn phương tiện</span>';
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function moocSummaryText(line) {
      var mooc = line && line.mooc ? line.mooc : (state.moocMap[String(line.nid_mooc || 0)] || null);
      if (!mooc) return '';
      return mooc.bks || '';
    }

    function moocSummaryHtml(line) {
      var text = moocSummaryText(line);
      if (!text) {
        return '<span class="vehicle-inline-placeholder">Chọn mooc</span>';
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function findMoocById(id) {
      id = parseInt(id, 10) || 0;
      if (!id) return null;
      if (state.moocMap[String(id)]) return state.moocMap[String(id)];
      for (var i = 0; i < state.moocs.length; i++) {
        if ((parseInt(state.moocs[i].nid, 10) || 0) === id) return state.moocs[i];
      }
      for (var j = 0; j < state.vehicles.length; j++) {
        if ((parseInt(state.vehicles[j].nid, 10) || 0) === id) return state.vehicles[j];
      }
      return null;
    }

    function buildDriverOptions(selectedId) {
      var html = '<option></option>';
      for (var i = 0; i < state.drivers.length; i++) {
        var item = state.drivers[i];
        html += '<option value="' + item.nid + '"' + ((parseInt(selectedId, 10) === parseInt(item.nid, 10)) ? ' selected' : '') + '>' + escHtml(item.ten || ('#' + item.nid)) + '</option>';
      }
      return html;
    }

    function buildCustomerOptions(selectedId) {
      var html = '<option></option>';
      for (var i = 0; i < state.customers.length; i++) {
        var item = state.customers[i];
        html += '<option value="' + item.nid + '"' + ((parseInt(selectedId, 10) === parseInt(item.nid, 10)) ? ' selected' : '') + '>' + escHtml(customerPlanLabel(item)) + '</option>';
      }
      return html;
    }

    function buildMoocOptions(selectedId) {
      var html = '<option value="0">— Chọn mooc —</option>';
      for (var i = 0; i < state.moocs.length; i++) {
        var item = state.moocs[i];
        var label = item.bks || ('#' + item.nid);
        if (item.ma_tai_san) label += ' - ' + item.ma_tai_san;
        html += '<option value="' + item.nid + '"' + ((parseInt(selectedId, 10) === parseInt(item.nid, 10)) ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      }
      return html;
    }

    function moneyText(value) {
      var digits = String(value || '').replace(/[^\d]/g, '');
      if (!digits) return '';
      return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Number(digits));
    }

    function moneyValue(value) {
      var digits = String(value || '').replace(/[^\d]/g, '');
      return digits ? parseInt(digits, 10) : 0;
    }

    function lineTangBo(line) {
      return $.extend({
        enabled: 0,
        nid_khach_hang: 0,
        dia_chi: '',
        ghi_chu: '',
        doanh_thu_khach_hang: 0,
        luong_lai_xe: 0
      }, (line && line.tang_bo) || {});
    }

    function lineKetHop(line) {
      var value = $.extend({
        enabled: 0,
        ke_hoach_cont_ref_nid: 0,
        cont_thuc_hien_tu_index: -1,
        cont_thuc_hien_den_index: -1,
        cont_keo_ve_tu: '',
        cont_keo_ve_den: '',
        hoan_thanh: 0,
        cont_ref: null
      }, (line && line.ket_hop) || {});
      if (!(parseInt(value.ke_hoach_cont_ref_nid, 10) || 0)) value.enabled = 0;
      return value;
    }

    function lineKetHopPayload(line) {
      var value = lineKetHop(line);
      return {
        enabled: optionEnabled(value.enabled) ? 1 : 0,
        ke_hoach_cont_ref_nid: parseInt(value.ke_hoach_cont_ref_nid, 10) || 0,
        cont_thuc_hien_tu_index: parseInt(value.cont_thuc_hien_tu_index, 10),
        cont_thuc_hien_den_index: parseInt(value.cont_thuc_hien_den_index, 10),
        cont_keo_ve_tu: value.cont_keo_ve_tu || '',
        cont_keo_ve_den: value.cont_keo_ve_den || '',
        hoan_thanh: optionEnabled(value.hoan_thanh) ? 1 : 0
      };
    }

    function optionEnabled(value) {
      return value === true || value === 1 || value === '1' || value === 'true';
    }

    function planRole(line) {
      // A real source relation is authoritative. The JSON role is only used
      // while the user has switched to execution mode but has not selected a
      // source yet.
      if (line && parseInt(line.ke_hoach_cont_ref_nid, 10)) return 'thuc_hien_chang';
      return line && line.vai_tro_ke_hoach === 'thuc_hien_chang' ? 'thuc_hien_chang' : 'ke_hoach_goc';
    }

    function isExecutionPlan(line) {
      return currentPlanType() === 'tuyen_xa' && planRole(line) === 'thuc_hien_chang';
    }

    function sourcePickerApplicable(line) {
      return currentPlanType() === 'tuyen_xa' ? isExecutionPlan(line) : shouldShowContPicker(line && line.hinh_thuc_van_tai);
    }

    function sourcePickerEditable(line) {
      // Hàng cảng không có cơ chế khóa theo công việc chính. Cont đã chọn vẫn
      // có thể được thay đổi khi người dùng đang chỉnh sửa kế hoạch.
      if (currentPlanType() !== 'tuyen_xa') return sourcePickerApplicable(line);
      return sourcePickerApplicable(line) && !optionEnabled(line && line.cong_viec_chinh_hoan_thanh);
    }

    function clearPortReturnCont(line) {
      if (!line) return;
      line.ke_hoach_cont_ref_nid = 0;
      line.cont_ref_label = '';
      line.cont_ref = null;
      line.cont_keo_ve_tu = '';
      line.cont_keo_ve_den = '';
      line.cont_thuc_hien_tu_index = -1;
      line.cont_thuc_hien_den_index = -1;
      line.cont_thuc_hien_chang = [];
      line.cont_keo_ve_seal_phu = 0;
      line.cont_keo_ve_kiem_dich = 0;
      line.cont_keo_ve_kiem_hoa = 0;
      line.cont_keo_ve_hun_trung = 0;
    }

    function returnContApplicable(line) {
      var type = normalizeHinhThuc(line && line.hinh_thuc_van_tai);
      return currentPlanType() === 'tuyen_xa' && (type === 'cat_keo' || type === 'cat_keo_cheo' || type === 'rut_mooc');
    }

    function applySourcePlanFields(line, source) {
      if (!line || !source || currentPlanType() !== 'tuyen_xa') return;
      var sourceJson = source.thong_tin_json || {};
      line.nid_khach_hang = parseInt(source.khach_hang && source.khach_hang.nid, 10) || parseInt(source.nid_khach_hang, 10) || 0;
      line.so_cont = source.so_cont || '';
      line.loai_cont = source.loai_cont || '';
      line.loai_hang = source.loai_hang || sourceJson.loai_hang || '';
      line.bai_lay_cont = source.bai_lay_cont || '';
      line.bai_lay_thuc_te = source.bai_lay_thuc_te || '';
      line.dia_chi_kho = source.dia_chi_kho || '';
      line.bai_ha_cont = source.bai_ha_cont || '';
      line.bai_ha_thuc_te = source.bai_ha_thuc_te || '';
      line.bai_ha_tam_1_enabled = sourceJson.bai_ha_tam_1_enabled || 0;
      line.bai_ha_tam_1 = sourceJson.bai_ha_tam_1 || '';
      line.bai_ha_tam_2_enabled = sourceJson.bai_ha_tam_2_enabled || 0;
      line.bai_ha_tam_2 = sourceJson.bai_ha_tam_2 || '';
      line.vi_tri_cont_index_hien_tai = contCurrentPointIndex(source);
      line.vi_tri_cont_hien_tai = contCurrentLocation(source);
    }

    function hasBaiThucTe(line) {
      return !!(line && (line.bai_lay_thuc_te || line.bai_ha_thuc_te));
    }

    function hinhThucOptionsForForm() {
      var options = $.extend({}, HINH_THUC_MAP);
      // "Kết hợp" chỉ được tạo tự động từ chuyến chính, không phải lựa chọn
      // vận tải để người dùng chọn trong form xếp xe thông thường.
      delete options.ket_hop;
      if (currentPlanType() === 'tuyen_xa') {
        delete options.cat_keo_cheo;
        delete options.roi_cont;
      }
      return options;
    }

    function buildHinhThucRadios(line) {
      var html = '';
      var selected = normalizeHinhThuc(line.hinh_thuc_van_tai || '');
      $.each(hinhThucOptionsForForm(), function (key, label) {
        var checked = key === selected ? ' checked' : '';
        html += '<label class="form-check form-check-inline line-hinh-thuc-option' + (checked ? ' is-active' : '') + '">' +
          '<input class="form-check-input line-hinh-thuc-radio" type="radio" name="line-hinh-thuc-' + escHtml(line.key) + '" value="' + key + '" data-current="' + (checked ? '1' : '0') + '"' + checked + '>' +
          '<span class="form-check-label">' + escHtml(label) + '</span>' +
        '</label>';
      });
      return html;
    }

    function renderTuyenXaNav(line) {
      if (currentPlanType() !== 'tuyen_xa') {
        return '<div class="khxh-section-nav" data-line-key="' + escHtml(line.key) + '">' +
          '<button type="button" class="khxh-section-nav-item is-active" data-target="#khxh-main-plan-' + escHtml(line.key) + '"><span class="khxh-navnum">1</span><span class="khxh-navlabel">Thông tin xếp xe</span></button>' +
          '<button type="button" class="khxh-section-nav-item" data-target="#khxh-return-cont-' + escHtml(line.key) + '"><span class="khxh-navnum">2</span><span class="khxh-navlabel">Cont kéo về</span><span class="khxh-navbadge khxh-nav-return-count">0</span></button>' +
          '<button type="button" class="khxh-section-nav-item" data-target="#khxh-plan-files-card"><span class="khxh-navnum">3</span><span class="khxh-navlabel">Chứng từ</span><span class="khxh-navbadge khxh-nav-files-count">0/25</span></button>' +
        '</div>';
      }
      return '<div class="khxh-section-nav" data-line-key="' + escHtml(line.key) + '">' +
        '<button type="button" class="khxh-section-nav-item is-active" data-target="#khxh-main-plan-' + escHtml(line.key) + '"><span class="khxh-navnum">1</span><span class="khxh-navlabel">' + (isExecutionPlan(line) ? 'Công việc chính' : 'Kế hoạch gốc') + '</span></button>' +
        '<button type="button" class="khxh-section-nav-item" data-target="#khxh-return-cont-' + escHtml(line.key) + '"><span class="khxh-navnum">2</span><span class="khxh-navlabel">Kế hoạch nguồn</span><span class="khxh-navbadge khxh-nav-return-count">0</span></button>' +
        '<button type="button" class="khxh-section-nav-item" data-target="#khxh-combined-plan-' + escHtml(line.key) + '"><span class="khxh-navnum">3</span><span class="khxh-navlabel">Cont kéo về</span><span class="khxh-navbadge khxh-nav-combine-count">0</span></button>' +
        (mode === 'edit' ? '<button type="button" class="khxh-section-nav-item" data-target="#khxh-combined-plans-card"><span class="khxh-navnum">4</span><span class="khxh-navlabel">Kết hợp</span><span class="khxh-navbadge khxh-nav-combined-plan-count">0</span></button><button type="button" class="khxh-section-nav-item" data-target="#khxh-plan-files-card"><span class="khxh-navnum">5</span><span class="khxh-navlabel">Chứng từ</span><span class="khxh-navbadge khxh-nav-files-count">0/25</span></button>' : '') +
      '</div>';
    }

    function bindTuyenXaNavPin() {
      var nav = $form('.khxh-section-nav')[0];
      if (!nav) return;
      var modalBody = nav.closest('.modal-body');
      var $scrollTarget = modalBody ? $(modalBody) : $(window);
      var $holder = $(nav.parentElement);
      var pinTop = parseFloat(window.getComputedStyle(nav).top) || 0;
      var isPinned = false;

      function updatePin() {
        // Không đo nav khi pane Xếp xe đang bị tab Chi phí ẩn. Nếu đo ở thời
        // điểm này width trở thành 0 và khi quay lại các nút bị co/giãn sai.
        var planPane = nav.closest('[data-khxh-port-pane="plan"]');
        if ((planPane && planPane.classList.contains('d-none')) || !$holder[0].offsetParent) return;
        if (window.innerWidth <= 767 || !modalBody) {
          if (isPinned) {
            nav.classList.remove('is-scroll-pinned');
            nav.style.left = '';
            nav.style.width = '';
            nav.style.top = '';
            $holder.css('height', '');
            isPinned = false;
          }
          return;
        }
        var bodyRect = modalBody.getBoundingClientRect();
        var flowRect = $holder[0].getBoundingClientRect();
        var shouldPin = flowRect.top <= bodyRect.top + pinTop;
        if (shouldPin && !isPinned) {
          // Giữ cả khoảng cách dưới của nav. Nếu chỉ giữ offsetHeight thì
          // margin-bottom bị mất khi nav chuyển fixed, làm card kế tiếp nhảy.
          var navMarginBottom = parseFloat(window.getComputedStyle(nav).marginBottom) || 0;
          $holder.css('height', (nav.offsetHeight + navMarginBottom) + 'px');
          nav.classList.add('is-scroll-pinned');
          isPinned = true;
        } else if (!shouldPin && isPinned) {
          nav.classList.remove('is-scroll-pinned');
          nav.style.left = '';
          nav.style.width = '';
          nav.style.top = '';
          $holder.css('height', '');
          isPinned = false;
        }
        if (isPinned) {
          nav.style.left = flowRect.left + 'px';
          nav.style.width = flowRect.width + 'px';
          nav.style.top = (bodyRect.top + pinTop) + 'px';
        }
      }

      $scrollTarget.off('scroll.khxhNavPin').on('scroll.khxhNavPin', updatePin);
      $(window).off('resize.khxhNavPin').on('resize.khxhNavPin', updatePin);
      updatePin();
    }

    function lookupName(items, id, field) {
      id = parseInt(id, 10) || 0;
      if (!id) return '';
      field = field || 'ten';
      for (var i = 0; i < items.length; i++) {
        if ((parseInt(items[i].nid, 10) || 0) === id) return items[i][field] || items[i].name || items[i].label || ('#' + id);
      }
      return '#' + id;
    }

    function summaryRow(label, value, sub, title) {
      return '<div class="khxh-summary-row">' +
        '<div class="khxh-summary-key">' + escHtml(label) + '</div>' +
        '<div class="khxh-summary-value"' + (title ? ' title="' + escHtml(title) + '"' : '') + '>' + (value ? escHtml(value) : '<span class="text-muted fst-italic">Chưa có</span>') +
          (sub ? '<small>' + escHtml(sub) + '</small>' : '') +
        '</div>' +
      '</div>';
    }

    function summaryMoney(value) {
      return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(Number(value) || 0) + 'đ';
    }

    function resetPortCostSummary() {
      state.costSummary = { total: 0, customer: 0, company: 0, driver_self: 0 };
    }

    function loadPortCostSummary(planId) {
      resetPortCostSummary();
      planId = parseInt(planId, 10) || 0;
      if (!planId || currentPlanType() === 'tuyen_xa') return;
      $.getJSON('/api/ke-hoach-chi-phi', { nid_ke_hoach: planId, limit: 100 }).done(function (res) {
        var currentPlanId = parseInt($form('#nid-input').val(), 10) || 0;
        if (currentPlanId && currentPlanId !== planId) return;
        var items = res && res.data && $.isArray(res.data.items) ? res.data.items : [];
        $.each(items, function (_, item) {
          var amount = Number(item.tong_sau_vat) || 0;
          if (item.loai_chi_phi === 'tinh_cho_khach') state.costSummary.customer += amount;
          else if (item.loai_chi_phi === 'cong_ty_chi_tra') state.costSummary.company += amount;
          else if (item.loai_chi_phi === 'lai_xe_tu_chiu') state.costSummary.driver_self += amount;
        });
        state.costSummary.total = state.costSummary.customer + state.costSummary.company + state.costSummary.driver_self;
        updateTuyenXaSidebar();
      });
    }

    function checklistItem(ok, label, value, title) {
      return '<div class="khxh-check-item' + (ok ? '' : ' is-warning') + '">' +
        '<span class="khxh-check-mark"><i class="ti ' + (ok ? 'tabler-check' : 'tabler-alert-triangle') + '"></i></span>' +
        '<span>' + escHtml(label) + '</span>' +
        '<small' + (title ? ' title="' + escHtml(title) + '"' : '') + '>' + escHtml(value || (ok ? 'OK' : 'Thiếu')) + '</small>' +
      '</div>';
    }

    function updateTuyenXaSidebar() {
      var isTuyenXa = currentPlanType() === 'tuyen_xa';
      var contextSelector = '#khxh-tuyen-xa-context';
      var summarySelector = isTuyenXa ? '#khxh-tuyen-xa-summary' : '#khxh-hang-cang-summary';
      var checklistSelector = isTuyenXa ? '#khxh-tuyen-xa-checklist' : '#khxh-hang-cang-checklist';
      if (!$form(summarySelector).length) return;
      var line = state.lines[0] || null;
      var $card = line ? $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + line.key + '"], #ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + line.key + '"]') : $();
      if (line && $card.length) line = syncLine($card) || line;
      if (!line) {
        $form(summarySelector).html('<div class="khxh-summary-empty">Chưa có dữ liệu</div>');
        $form(checklistSelector).empty();
        if (!isTuyenXa) $form('#khxh-hang-cang-header-route').addClass('d-none').attr('title', '').find('span').empty();
        return;
      }
      if (!isTuyenXa) {
        var normalCustomer = lookupName(state.customers, line.nid_khach_hang, 'ma_kh');
        var normalCustomerFull = lookupName(state.customers, line.nid_khach_hang, 'ten');
        var normalDriver = lookupName(state.drivers, line.nid_lai_xe, 'ten');
        var normalVehicle = vehicleOnlyText(line);
        var normalMooc = moocSummaryText(line);
        var normalCont = [line.loai_cont || '', line.so_cont || ''].filter(Boolean).join(' - ');
        var normalRoute = [line.bai_lay_cont || '', line.dia_chi_kho || '', line.bai_ha_cont || '', line.cang_xuat || ''].filter(Boolean).join(' → ');
        var normalPlanDatetime = apiToDatetime(line.ngay_gio_ke_hoach || '');
        var normalFilesCount = planFilesFromRow(editData).length;
        var normalCost = state.costSummary || {};
        var normalCostText = summaryMoney(normalCost.total);
        var normalNav = $form('.khxh-section-nav[data-line-key="' + line.key + '"]');
        normalNav.find('.khxh-nav-return-count').text(line.ke_hoach_cont_ref_nid ? '1' : '0');
        normalNav.find('.khxh-nav-files-count').text(normalFilesCount + '/25');
        $form('#khxh-hang-cang-header-route')
          .toggleClass('d-none', !normalRoute)
          .attr('title', normalRoute || '')
          .find('span').text(normalRoute);
        $form(summarySelector).html(
          summaryRow('Khách hàng', normalCustomer, '', normalCustomerFull) +
          summaryRow('Container', normalCont, line.loai_hang || '') +
          summaryRow('Phương tiện', normalVehicle, '') +
          summaryRow('Mooc', normalMooc, '') +
          summaryRow('Lái xe', normalDriver, '') +
          summaryRow('Hình thức', line.hinh_thuc_van_tai ? hinhThucLabel(line.hinh_thuc_van_tai) : '', normalPlanDatetime) +
          summaryRow('Chi phí', normalCostText, '') +
          summaryRow('Cont kéo về', line.cont_ref ? (line.cont_ref.so_cont || ('#' + line.ke_hoach_cont_ref_nid)) : '', '') +
          summaryRow('Chứng từ', normalFilesCount + '/25 file', '')
        );
        $form(checklistSelector).html(
          checklistItem(!!line.nid_khach_hang, 'Khách hàng', normalCustomer || '', normalCustomerFull) +
          checklistItem(!!line.so_bkg, 'Booking/Bill', line.so_bkg || '') +
          checklistItem(!!line.so_cont, 'Số cont', line.so_cont || '') +
          checklistItem(!!line.dia_chi_kho, 'Kho/Cảng xuất', line.dia_chi_kho || line.cang_xuat || '') +
          checklistItem(!!line.nid_phuong_tien, 'Phương tiện', normalVehicle || '') +
          checklistItem(!!line.nid_lai_xe, 'Lái xe', normalDriver || '') +
          checklistItem(!!line.hinh_thuc_van_tai, 'Hình thức vận tải', line.hinh_thuc_van_tai ? hinhThucLabel(line.hinh_thuc_van_tai) : '') +
          checklistItem(normalFilesCount > 0, 'Chứng từ', normalFilesCount + '/25 file')
        );
        return;
      }
      var customerName = lookupName(state.customers, line.nid_khach_hang, 'ma_kh');
      var customerFullName = lookupName(state.customers, line.nid_khach_hang, 'ten');
      var driverName = lookupName(state.drivers, line.nid_lai_xe, 'ten');
      var vehicleName = vehicleOnlyText(line);
      var moocName = moocSummaryText(line);
      var contText = [line.loai_cont || '', line.so_cont || ''].filter(Boolean).join(' - ');
      var sourceContText = line.cont_ref ? [line.cont_ref.loai_cont || '', line.cont_ref.so_cont || ''].filter(Boolean).join(' - ') : '';
      var routePoints = [line.bai_lay_thuc_te || line.bai_lay_cont || ''];
      if (optionEnabled(lineTangBo(line).enabled) && lineTangBo(line).dia_chi) routePoints.push(lineTangBo(line).dia_chi);
      routePoints.push(line.bai_ha_tam_1_enabled ? line.bai_ha_tam_1 : '', line.dia_chi_kho || '', line.bai_ha_tam_2_enabled ? line.bai_ha_tam_2 : '', line.bai_ha_thuc_te || line.bai_ha_cont || '');
      var routeText = routePoints.filter(Boolean).join(' - ');
      var dateText = [apiToDate(line.ngay_bat_dau || ''), apiToDate(line.ngay_ket_thuc || '')].filter(Boolean).join(' - ');
      var filesCount = planFilesFromRow(editData).length;
      var tangBo = lineTangBo(line);
      var ketHop = lineKetHop(line);
      var hasSourceCont = !!(parseInt(line.ke_hoach_cont_ref_nid, 10) || 0);
      var $lineNav = $form('.khxh-section-nav[data-line-key="' + line.key + '"]');
      $lineNav.find('.khxh-nav-return-count').text(hasSourceCont ? '1' : '0');
      $lineNav.find('.khxh-nav-combine-count').text(optionEnabled(ketHop.enabled) ? '1' : '0');
      $lineNav.find('.khxh-nav-files-count').text(filesCount + '/25');
      $form(contextSelector + ' [data-context="customer"]').text(customerName || 'Chưa có').attr('title', customerFullName || '');
      $form(contextSelector + ' [data-context="container"]').text(contText || 'Chưa có');
      $form(contextSelector + ' [data-context="route"]').text(routeText || 'Chưa có');
      $form(contextSelector + ' [data-context="time"]').text(dateText || 'Chưa có');
      $form(summarySelector).html(
        summaryRow('Khách hàng', customerName, '', customerFullName) +
        summaryRow('Container', contText, line.loai_hang || '') +
        summaryRow('Phương tiện', vehicleName, '') +
        summaryRow('Mooc', moocName, '') +
        summaryRow('Lái xe', driverName, '') +
        summaryRow('Hình thức', line.hinh_thuc_van_tai ? hinhThucLabel(line.hinh_thuc_van_tai) : '', dateText) +
        summaryRow('Vị trí cont', line.vi_tri_cont_hien_tai || '', parseInt(line.da_du_hang, 10) === 1 ? 'Đã đủ hàng' : 'Chưa đủ hàng') +
        summaryRow('Vai trò', isExecutionPlan(line) ? 'Thực hiện chặng' : 'Kế hoạch gốc', '') +
        summaryRow('Kế hoạch nguồn', hasSourceCont ? sourceContText : '', hasSourceCont ? contServiceRouteText(line.cont_ref, line) : '') +
        summaryRow('Tăng bo', optionEnabled(tangBo.enabled) ? 'Có' : 'Không', optionEnabled(tangBo.enabled) ? lookupName(state.customers, tangBo.nid_khach_hang, 'ma_kh') : '') +
        summaryRow('Cont kéo về', optionEnabled(ketHop.enabled) && ketHop.cont_ref ? (ketHop.cont_ref.so_cont || ('#' + ketHop.ke_hoach_cont_ref_nid)) : '', optionEnabled(ketHop.hoan_thanh) ? 'Đã hoàn thành' : '') +
        summaryRow('Chứng từ', filesCount + '/25 file', '')
      );
      $form(checklistSelector).html(
        checklistItem(!!line.nid_khach_hang, 'Khách hàng', customerName || '', customerFullName) +
        checklistItem(!!line.so_cont, 'Số cont', line.so_cont || '') +
        checklistItem(!!line.dia_chi_kho, 'Kho đóng/trả', line.dia_chi_kho || '') +
        (line.bai_ha_tam_1_enabled ? checklistItem(!!line.bai_ha_tam_1, 'Bãi hạ tạm 1', line.bai_ha_tam_1 || '') : '') +
        (line.bai_ha_tam_2_enabled ? checklistItem(!!line.bai_ha_tam_2, 'Bãi hạ tạm 2', line.bai_ha_tam_2 || '') : '') +
        checklistItem(!!line.nid_phuong_tien, 'Phương tiện', vehicleName || '') +
        checklistItem(!!line.nid_lai_xe, 'Lái xe', driverName || '') +
        checklistItem(!!line.hinh_thuc_van_tai, 'Hình thức vận tải', line.hinh_thuc_van_tai ? hinhThucLabel(line.hinh_thuc_van_tai) : '') +
        checklistItem(filesCount > 0, 'Chứng từ', filesCount + '/25 file')
      );
    }

    function vehicleSummaryHtml(line) {
      var text = vehicleOnlyText(line);
      if (!text) {
        return '<span class="vehicle-inline-placeholder">Chọn phương tiện</span>';
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function vehicleSummaryTableHtml(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      if (!vehicle) {
        return '<span class="vehicle-inline-placeholder">Chọn PT</span>';
      }
      var text = vehicle.bks || '';
      if (vehicle.lai_xe && vehicle.lai_xe.ten) {
        text += ' - ' + vehicle.lai_xe.ten;
      }
      return '<span class="vehicle-inline-text">' + escHtml(text) + '</span>';
    }

    function addDiaDiemToState(phanLoai, ten) {
      if (!ten) return;
      var key = null;
      phanLoai = String(phanLoai || '').toLowerCase();
      if (phanLoai === 'kho') key = 'kho';
      else if (phanLoai === 'bãi') key = 'bai';
      else if (phanLoai === 'cảng') key = 'cang';
      if (!key) return;
      if (state.diaDiem[key].indexOf(ten) === -1) state.diaDiem[key].push(ten);
      if (key === 'kho') state.cauHinh.diaChiKho = state.diaDiem.kho.slice();
    }

    function addCustomerToState(customer) {
      if (!customer || !customer.nid) return;
      var id = parseInt(customer.nid, 10) || 0;
      if (!id) return;
      for (var i = 0; i < state.customers.length; i++) {
        if ((parseInt(state.customers[i].nid, 10) || 0) === id) {
          state.customers[i] = $.extend({}, state.customers[i], customer);
          return;
        }
      }
      state.customers.unshift(customer);
    }

    function openDanhMucCreate(phanLoai, onCreated) {
      if (!window.Drupal || !Drupal.danhMuc || typeof Drupal.danhMuc.openCreate !== 'function') {
        if (notyf) notyf.error('Không tải được công cụ tạo danh mục');
        return;
      }
      Drupal.danhMuc.openCreate({ phanLoai: phanLoai, onCreated: onCreated, phanLoaiLocked: true });
    }

    function openCustomerCreate(onCreated) {
      if (!window.Drupal || !Drupal.khachHang || typeof Drupal.khachHang.openCreate !== 'function') {
        if (notyf) notyf.error('Không tải được công cụ tạo khách hàng');
        return;
      }
      Drupal.khachHang.openCreate({ onCreated: onCreated, phanLoai: ['Khách hàng'] });
    }

    function attachCustomerCreateOption($select, line) {
      if (!$select || !$select.length) return;
      if (!$select.data('khxhCustomerCreateAttached')) {
        $select.data('khxhCustomerCreateAttached', 1);
        $select.prepend('<option value="__KHACH_HANG_CREATE__">+ Tạo mới...</option>');
      }
      $select.off('select2:selecting.khxhCustomerCreate').on('select2:selecting.khxhCustomerCreate', function (e) {
        if (!e.params || !e.params.args || !e.params.args.data) return;
        if (e.params.args.data.id !== '__KHACH_HANG_CREATE__') return;
        e.preventDefault();
        if ($select.select2) $select.select2('close');
        openCustomerCreate(function (data) {
          var id = parseInt(data.nid, 10) || 0;
          if (!id) return;
          var ten = customerPlanLabel(data) || ('#' + id);
          addCustomerToState(data);
          if (line) line.nid_khach_hang = id;
          if (!$select.find('option[value="' + id + '"]').length) {
            $select.append($('<option>', { value: id, text: ten }));
          }
          $select.val(String(id)).trigger('change');
        });
      });
    }

    function attachCreateOption($select, phanLoai, line, fieldName) {
      if (!$select || !$select.length) return;
      if (!$select.data('khxhCreateAttached')) {
        $select.data('khxhCreateAttached', 1);
        $select.prepend('<option value="__DANH_MUC_CREATE__">+ Tạo mới...</option>');
      }
      $select.off('select2:selecting.khxhCreate').on('select2:selecting.khxhCreate', function (e) {
        if (!e.params || !e.params.args || !e.params.args.data) return;
        if (e.params.args.data.id !== '__DANH_MUC_CREATE__') return;
        e.preventDefault();
        if ($select.select2) $select.select2('close');
        openDanhMucCreate(phanLoai, function (data) {
          var ten = data.ten || data.name || data.label || '';
          if (!ten) return;
          addDiaDiemToState(phanLoai, ten);
          if (line && fieldName) line[fieldName] = ten;
          var $opt = $select.find('option').filter(function () {
            return $(this).val() === ten;
          });
          if (!$opt.length) {
            $select.append($('<option>', { value: ten, text: ten }));
          }
          $select.val(ten).trigger('change');
        });
      });
    }

    function initRowUi($row, line) {
      var dropdownParent = formDropdownParent();
      initSelect2($row.find('.line-customer-select')[0], '— Chọn khách hàng —', { dropdownParent: dropdownParent });
      attachCustomerCreateOption($row.find('.line-customer-select'), line);
      initSelect2($row.find('.line-loai-cont-select')[0], 'Loại cont', { tags: true, dropdownParent: dropdownParent });
      initSelect2($row.find('.line-loai-hang-select')[0], '— Chọn tên hàng —', { tags: true, dropdownParent: dropdownParent });
      initSelect2($row.find('.line-hinh-thuc-select')[0], '— Chọn hình thức —', { dropdownParent: dropdownParent });
      initSelect2($row.find('.line-kho-select')[0], '— Chọn địa chỉ kho —', { tags: true, dropdownParent: dropdownParent });
      attachCreateOption($row.find('.line-kho-select'), 'Kho', line, 'dia_chi_kho');
      initSelect2($row.find('.line-bai-lay-select')[0], '— Chọn bãi lấy —', { dropdownParent: dropdownParent });
      attachCreateOption($row.find('.line-bai-lay-select'), 'Bãi', line, 'bai_lay_cont');
      initSelect2($row.find('.line-bai-ha-select')[0], '— Chọn bãi hạ —', { dropdownParent: dropdownParent });
      attachCreateOption($row.find('.line-bai-ha-select'), 'Bãi', line, 'bai_ha_cont');
      initSelect2($row.find('.line-cang-select')[0], '— Chọn cảng xuất —', { dropdownParent: dropdownParent });
      attachCreateOption($row.find('.line-cang-select'), 'Cảng', line, 'cang_xuat');
      if (typeof flatpickr !== 'undefined' && $row.find('.line-cut-off-input')[0]) {
        flatpickr($row.find('.line-cut-off-input')[0], {
          enableTime: true,
          dateFormat: 'd/m/Y H:i',
          time_24hr: true,
          allowInput: true,
          static: true
        });
      }
      $row.find('.line-date-input').each(function () {
        if (typeof flatpickr !== 'undefined') {
          flatpickr(this, {
            enableTime: false,
            dateFormat: 'd/m/Y',
            allowInput: true,
            static: true
          });
        }
	      });
	      $row.find('.line-vehicle-display').toggleClass('is-selected', !!line.nid_phuong_tien).html(vehicleSummaryTableHtml(line));
	      $row.find('.line-mooc-display').toggleClass('is-selected', !!line.nid_mooc).html(moocSummaryHtml(line));
	      updateContRefButton($row, line);
	    }

    function initCardUi($card, line) {
      var dropdownParent = formDropdownParent();
      initSelect2($card.find('.line-customer-select')[0], '— Chọn khách hàng —', { dropdownParent: dropdownParent });
      attachCustomerCreateOption($card.find('.line-customer-select'), line);
      initSelect2($card.find('.line-tang-bo-customer-select')[0], '— Chọn khách hàng —');
      attachCustomerCreateOption($card.find('.line-tang-bo-customer-select'), null);
      initSelect2($card.find('.line-driver-select')[0], '— Chọn lái xe —');
      initSelect2($card.find('.line-hinh-thuc-select')[0], '— Chọn hình thức vận tải —', currentPlanType() !== 'tuyen_xa' && mode !== 'edit' ? { templateResult: formatTransportSelect2Option } : {});
      initSelect2($card.find('.line-kho-select')[0], '— Chọn địa chỉ kho —', { tags: true });
      attachCreateOption($card.find('.line-kho-select'), 'Kho', line, 'dia_chi_kho');
      // Select2 thay select gốc bằng phần tử khác; chuyển title sang phần nhìn
      // thấy để browser vẫn hiện tooltip bắt buộc giống input Số BKG.
      $card.find('.line-customer-select, .line-kho-select').each(function () {
        var $select = $(this);
        var title = $select.attr('title');
        var instance = $select.data('select2');
        var $container = instance && instance.$container ? instance.$container : $select.nextAll('.select2-container').first();
        if (title && $container.length) $container.find('.select2-selection').attr('title', title);
      });
      initSelect2($card.find('.line-loai-cont-select')[0], 'Loại cont', { tags: true });
      initSelect2($card.find('.line-loai-hang-select')[0], '— Chọn tên hàng —', { tags: true });
      initSelect2($card.find('.line-bai-lay-select')[0], '— Chọn bãi lấy —');
      attachCreateOption($card.find('.line-bai-lay-select'), 'Bãi', line, 'bai_lay_cont');
      initSelect2($card.find('.line-bai-ha-select')[0], '— Chọn bãi hạ —');
      attachCreateOption($card.find('.line-bai-ha-select'), 'Bãi', line, 'bai_ha_cont');
      initSelect2($card.find('.line-bai-ha-tam-1-select')[0], '— Chọn bãi hạ tạm 1 —', { tags: true });
      attachCreateOption($card.find('.line-bai-ha-tam-1-select'), 'Bãi', line, 'bai_ha_tam_1');
      initSelect2($card.find('.line-bai-ha-tam-2-select')[0], '— Chọn bãi hạ tạm 2 —', { tags: true });
      attachCreateOption($card.find('.line-bai-ha-tam-2-select'), 'Bãi', line, 'bai_ha_tam_2');
      initSelect2($card.find('.line-vi-tri-cont-select')[0], '— Chọn vị trí thực tế của cont —');
      initSelect2($card.find('.line-bai-lay-thuc-te-select')[0], '— Theo bãi lấy kế hoạch —', { tags: true });
      attachCreateOption($card.find('.line-bai-lay-thuc-te-select'), 'Bãi', line, 'bai_lay_thuc_te');
      initSelect2($card.find('.line-bai-ha-thuc-te-select')[0], '— Theo bãi hạ kế hoạch —', { tags: true });
      attachCreateOption($card.find('.line-bai-ha-thuc-te-select'), 'Bãi', line, 'bai_ha_thuc_te');
      initSelect2($card.find('.line-cang-select')[0], '— Chọn cảng xuất —');
      attachCreateOption($card.find('.line-cang-select'), 'Cảng', line, 'cang_xuat');
      if (typeof flatpickr !== 'undefined' && $card.find('.line-cut-off-input')[0]) {
        flatpickr($card.find('.line-cut-off-input')[0], {
          enableTime: true,
          dateFormat: 'd/m/Y H:i',
          time_24hr: true,
          allowInput: true,
          appendTo: document.body
        });
      }
      var $planDatetime = $card.find('.line-ngay-gio-input');
      if (typeof flatpickr !== 'undefined' && $planDatetime[0]) {
        flatpickr($planDatetime[0], {
          enableTime: true,
          dateFormat: 'd/m/Y H:i',
          time_24hr: true,
          allowInput: true,
          appendTo: document.body
        });
      }
      $card.find('.line-plan-date-input, .line-cut-off-date-input').each(function () {
        if (typeof flatpickr === 'undefined' || this._flatpickr) return;
        flatpickr(this, {
          enableTime: false,
          dateFormat: 'd/m/Y',
          allowInput: true,
          static: true
        });
      });
      $card.find('.line-plan-hour-select, .line-cut-off-hour-select').each(function () {
        var isPlanHour = $(this).hasClass('line-plan-hour-select');
        var sourceValue = isPlanHour ? line.ngay_gio_ke_hoach : line.cut_off;
        // Đặt lại giá trị từ state sau khi Select2 khởi tạo để trình duyệt
        // không khôi phục lựa chọn cũ của form (ví dụ 12:00) cho kế hoạch mới.
        $(this).val(splitDateTimeValue(sourceValue || '').hour);
        initSelect2(this, '— Giờ —', { allowClear: true, dropdownParent: dropdownParent });
        $(this).trigger('change.select2');
      });
      $card.find('.line-date-input').each(function () {
        if (typeof flatpickr !== 'undefined') {
          flatpickr(this, {
            enableTime: false,
            dateFormat: 'd/m/Y',
            allowInput: true,
            static: true
          });
        }
      });
      $card.find('.vehicle-summary').toggleClass('is-selected', !!line.nid_phuong_tien).html(vehicleSummaryCardHtml(line));
      $card.find('.line-mooc-display').toggleClass('is-selected', !!line.nid_mooc).html(moocSummaryHtml(line));
      $card.find('.line-money-input').each(function () {
        $(this).val(moneyText($(this).val()));
      });
      renderSelectedContRef($card, line);
    }

    function portCreateTransportOptions(selected) {
      var html = '<option value="">Chọn hình thức vận tải</option>';
      $.each(hinhThucOptionsForForm(), function (key, label) {
        if (key === 'ket_hop') return;
        html += '<option value="' + escHtml(key) + '"' + (normalizeHinhThuc(selected) === key ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      });
      return html;
    }

    function portCreateCheck(name, label, checked) {
      return '<label class="form-check form-check-inline mb-0 khxh-port-create-option"><input type="checkbox" class="form-check-input line-' + name + '"' + (checked ? ' checked' : '') + '><span class="form-check-label">' + label + '</span></label>';
    }

    function portCreateReadOnlyCheck(name, label, checked) {
      return '<label class="form-check form-check-inline mb-0"><input type="checkbox" class="form-check-input line-' + name + '"' + (checked ? ' checked' : '') + ' disabled><span class="form-check-label">' + label + '</span></label>';
    }

    function portCreateReturnMarkup(line) {
      var applicable = shouldShowContPicker(line && line.hinh_thuc_van_tai);
      var selected = !!(line && line.ke_hoach_cont_ref_nid);
      var key = line && line.key ? line.key : '';
      return '<div class="pc-field-return-cont khxh-port-create-cont-picker' + (applicable ? '' : ' d-none') + '">' +
        '<label class="form-label">Cont kéo về</label>' +
        '<button type="button" class="btn btn-outline-secondary w-100 text-start line-cont-picker-display btn-open-cont-ref-modal" data-line-key="' + escHtml(key) + '"' + (applicable ? '' : ' disabled') + '><span class="' + (selected ? 'vehicle-inline-text' : 'vehicle-inline-placeholder') + '">' + escHtml(contRefButtonText(line)) + '</span></button>' +
        '</div>';
    }

    function normalizePortCreateCard($card, line, index) {
      var customer = null;
      $.each(state.customers || [], function (_, item) {
        if (parseInt(item.nid, 10) === parseInt(line.nid_khach_hang, 10)) customer = item;
      });
      updatePortCreateCardTitle($card, line, index, customer);
      $card.find('.khxh-port-create-cont-picker').replaceWith(portCreateReturnMarkup(line));
      var isDongHang = normalizeHinhThuc(line.hinh_thuc_van_tai) === 'dong_hang';
      $card.find('.khxh-port-create-option-group')
        .toggleClass('is-dong-hang', isDongHang)
        .find('.khxh-port-create-requirements').toggleClass('d-none', !isDongHang);
    }

    function updatePortCreateCardTitle($card, line, index, customer) {
      if (!customer) {
        $.each(state.customers || [], function (_, item) {
          if (parseInt(item.nid, 10) === parseInt(line.nid_khach_hang, 10)) customer = item;
        });
      }
      var title = customer ? customerPlanLabel(customer) : 'Kế hoạch ' + ((index || 0) + 1);
      if (line.so_bkg) title += ' · ' + line.so_bkg;
      $card.find('.khxh-hang-cang-card-title strong').text(title);
    }

    function renderPortCreateCard(line, index) {
      var title = line.so_bkg || ('Kế hoạch ' + (index + 1));
      var returnHtml = portCreateReturnMarkup(line);
      var sealPhuChecked = !!String(line.so_seal_tam || '').trim();
      var isDongHang = normalizeHinhThuc(line.hinh_thuc_van_tai) === 'dong_hang';
      var planDateTime = splitDateTimeValue(line.ngay_gio_ke_hoach || '');
      var cutOffDateTime = splitDateTimeValue(line.cut_off || '');
      return '<section class="ke-hoach-line-card khxh-hang-cang-card khxh-port-create-section" id="khxh-main-plan-' + escHtml(line.key) + '" data-line-key="' + escHtml(line.key) + '">' +
        '<div class="khxh-hang-cang-card-head"><div><div class="khxh-hang-cang-card-title"><span class="khxh-step-badge">' + (index + 1) + '</span><strong>' + escHtml(title) + '</strong></div></div><div class="khxh-section-tools"><button type="button" class="btn btn-sm btn-icon btn-label-secondary btn-copy-row-ke-hoach" title="Nhân bản"><i class="ti tabler-copy"></i></button><button type="button" class="btn btn-sm btn-icon btn-label-danger btn-remove-row-ke-hoach" title="Xóa kế hoạch"><i class="ti tabler-trash"></i></button></div></div>' +
        '<div class="khxh-hang-cang-section khxh-port-create-body"><div class="khxh-port-create-flex-row khxh-port-create-row-1">' +
        '<div class="pc-field-customer"><label class="form-label">Khách hàng <span class="text-danger">*</span></label><select class="form-select line-customer-select" required title="Không được để trống khách hàng">' + buildCustomerOptions(line.nid_khach_hang || 0) + '</select></div>' +
        '<div class="pc-field-bkg"><label class="form-label">Số BKG <span class="text-danger">*</span></label><input class="form-control line-so-bkg-input" value="' + escHtml(line.so_bkg || '') + '" placeholder="BKG" required title="Không được để trống số BKG"></div>' +
        '<div class="pc-field-plan-date"><label class="form-label">Ngày kế hoạch</label><input class="form-control line-plan-date-input" value="' + escHtml(planDateTime.date) + '" placeholder="dd/mm/yyyy" autocomplete="off"></div>' +
        '<div class="pc-field-plan-hour"><label class="form-label">Giờ</label><select class="form-select line-plan-hour-select" autocomplete="off">' + hourSelectOptions(planDateTime.hour) + '</select></div>' +
        '<div class="pc-field-kho"><label class="form-label">Địa chỉ kho <span class="text-danger">*</span></label><select class="form-select line-kho-select" required title="Không được để trống địa chỉ kho">' + buildTagOptions(state.cauHinh.diaChiKho, line.dia_chi_kho) + '</select></div>' +
        '<div class="pc-field-cont-type"><label class="form-label">Loại cont</label><select class="form-select line-loai-cont-select">' + buildTagOptions(state.cauHinh.loaiCont, line.loai_cont) + '</select></div>' +
        '</div><div class="khxh-port-create-flex-row khxh-port-create-row-route">' +
        '<div class="pc-field-yard"><label class="form-label">Bãi lấy dự kiến</label><select class="form-select line-bai-lay-select">' + buildTagOptions(state.diaDiem.bai, line.bai_lay_cont) + '</select></div>' +
        '<div class="pc-field-yard"><label class="form-label">Bãi hạ dự kiến</label><select class="form-select line-bai-ha-select">' + buildTagOptions(state.diaDiem.bai, line.bai_ha_cont) + '</select></div>' +
        '<div class="pc-field-port"><label class="form-label">Cảng xuất</label><select class="form-select line-cang-select">' + buildTagOptions(state.diaDiem.cang, line.cang_xuat) + '</select></div>' +
        '<div class="pc-field-cargo"><label class="form-label">Tên hàng</label><select class="form-select line-loai-hang-select">' + buildTagOptions(state.cauHinh.loaiHang, line.loai_hang) + '</select></div>' +
        '<div class="pc-field-cutoff-date"><label class="form-label">Cut-off</label><input class="form-control line-cut-off-date-input" value="' + escHtml(cutOffDateTime.date) + '" placeholder="dd/mm/yyyy" autocomplete="off"></div>' +
        '<div class="pc-field-cutoff-hour"><label class="form-label">Giờ</label><select class="form-select line-cut-off-hour-select" autocomplete="off">' + hourSelectOptions(cutOffDateTime.hour) + '</select></div>' +
        '<div class="pc-field-transport"><label class="form-label">Hình thức vận tải</label><select class="form-select line-hinh-thuc-select">' + portCreateTransportOptions(line.hinh_thuc_van_tai) + '</select></div>' +
        '</div><div class="khxh-port-create-flex-row khxh-port-create-row-2">' +
        '<div class="pc-field-vehicle"><label class="form-label">Phương tiện</label><input type="hidden" class="line-vehicle-id" value="' + (line.nid_phuong_tien || 0) + '"><button type="button" class="btn btn-outline-secondary w-100 text-start vehicle-summary btn-open-vehicle-modal"></button></div>' +
        '<div class="pc-field-driver"><label class="form-label">Lái xe</label><select class="form-select line-driver-select">' + buildDriverOptions(line.nid_lai_xe) + '</select></div>' +
        '<div class="pc-field-mooc"><label class="form-label">Số mooc</label><input type="hidden" class="line-mooc-id" value="' + (line.nid_mooc || 0) + '"><button type="button" class="btn btn-outline-secondary w-100 text-start line-mooc-display btn-open-mooc-modal">' + moocSummaryHtml(line) + '</button></div>' +
        '<div class="pc-field-container"><label class="form-label">Số cont</label><input class="form-control line-so-cont-input" value="' + escHtml(line.so_cont || '') + '" placeholder="Số cont"></div>' +
        '<div class="pc-field-seal"><label class="form-label">Seal chính</label><input class="form-control line-seal-chinh-input" value="' + escHtml(line.so_seal_chinh || '') + '" placeholder="Seal chính"></div>' +
        '<div class="pc-field-options khxh-port-create-option-group' + (isDongHang ? ' is-dong-hang' : '') + '"><label class="form-check form-check-inline mb-0 khxh-port-create-option"><input type="checkbox" class="form-check-input line-seal-phu-check"' + (sealPhuChecked ? ' checked' : '') + '><span class="form-check-label">Seal phụ</span></label><span class="khxh-port-create-requirements khxh-port-create-main-requirements' + (isDongHang ? '' : ' d-none') + '">' + portCreateCheck('kiem-dich', 'Kiểm dịch', !!line.kiem_dich) + portCreateCheck('kiem-hoa', 'Kiểm hoá', !!line.kiem_hoa) + portCreateCheck('hun-trung', 'Hun trùng', !!line.hun_trung) + '</span></div>' +
        returnHtml +
        '</div></div></section>';
    }

    function renderCards() {
      var html = '';
      var pickerHtml = '';
      var navHtml = '';
      var dateInputsHtml = '';
      var isTuyenXa = currentPlanType() === 'tuyen_xa';
      var modalClassPrefix = isTuyenXa ? 'khxh-tuyen-xa' : 'khxh-hang-cang';
      var isPortCreate = !isTuyenXa && mode !== 'edit';
      for (var i = 0; i < state.lines.length; i++) {
        var line = state.lines[i];
        if (isPortCreate) {
          html += renderPortCreateCard(line, i);
          continue;
        }
        var tangBo = lineTangBo(line);
        var ketHop = lineKetHop(line);
        var baiThucTeChecked = hasBaiThucTe(line);
        var chuyenXaChecked = line.hinh_thuc_tinh_luong_lai_xe === 'theo_chuyen';
        var baiHaTam1Checked = optionEnabled(line.bai_ha_tam_1_enabled);
        var baiHaTam2Checked = optionEnabled(line.bai_ha_tam_2_enabled);
        var combinedPlanChecked = optionEnabled(line.ke_hoach_ket_hop_enabled);
        // Chỉ tuyến xa mới có khái niệm "thực hiện chặng" và khóa các trường
        // nguồn. Hàng cảng luôn cho phép sửa các input, kể cả khi đã chọn cont.
        var executionPlan = isTuyenXa && (isExecutionPlan(line) || !!parseInt(line.ke_hoach_cont_ref_nid, 10));
        var mainWorkDone = isTuyenXa && optionEnabled(line.cong_viec_chinh_hoan_thanh);
        var rootDongHang = !executionPlan && normalizeHinhThuc(line.hinh_thuc_van_tai) === 'dong_hang';
        var planDt = splitDateTimeValue(line.ngay_gio_ke_hoach || '');
        var cutOffDt = splitDateTimeValue(line.cut_off || '');
        navHtml += renderTuyenXaNav(line);
        var routeMetaHtml = '';
        var portCangRouteHtml = isTuyenXa
          ? ''
          : '<div class="khxh-route-node"><label class="form-label">Cảng xuất</label><select class="form-select line-cang-select">' + buildTagOptions(state.diaDiem.cang, line.cang_xuat) + '</select></div>';
        dateInputsHtml = isTuyenXa && mode === 'edit'
          ? '<div class="khxh-span-4"><label class="form-label">Ngày bắt đầu</label><input type="text" class="form-control line-date-input line-ngay-bat-dau-input" value="' + escHtml(apiToDate(line.ngay_bat_dau || '')) + '" placeholder="dd/mm/yyyy"></div>' +
            '<div class="khxh-span-4"><label class="form-label">Ngày kết thúc</label><input type="text" class="form-control line-date-input line-ngay-ket-thuc-input" value="' + escHtml(apiToDate(line.ngay_ket_thuc || '')) + '" placeholder="dd/mm/yyyy"></div>'
          : '';
        html += '' +
          '<div class="ke-hoach-line-card ' + modalClassPrefix + '-card khxh-main-plan-card" id="khxh-main-plan-' + escHtml(line.key) + '" data-line-key="' + line.key + '">' +
            '<div class="' + modalClassPrefix + '-card-head">' +
              '<div>' +
                '<div class="' + modalClassPrefix + '-card-title"><span class="khxh-step-badge">1</span>' + (isTuyenXa ? (executionPlan ? 'Công việc thực hiện chặng' : 'Kế hoạch gốc') : 'Thông tin xếp xe') + '</div>' +
                '<div class="' + modalClassPrefix + '-card-subtitle">Thông tin hàng, tuyến vận chuyển và điều xe</div>' +
              '</div>' +
              (isTuyenXa ? '<div class="khxh-tuyen-xa-switches khxh-main-plan-switches">' +
                '<label class="form-check form-switch mb-0"><input class="form-check-input line-plan-root-toggle" type="checkbox"' + (executionPlan ? '' : ' checked') + (mainWorkDone ? ' disabled' : '') + '><span class="form-check-label">Kế hoạch gốc</span></label>' +
                '<label class="form-check form-switch mb-0"><input class="form-check-input line-chuyen-xa-toggle" type="checkbox"' + (chuyenXaChecked ? ' checked' : '') + '><span class="form-check-label">Chuyến xa</span></label>' +
                '<label class="form-check form-switch mb-0"><input class="form-check-input line-bai-thuc-te-toggle" type="checkbox"' + (baiThucTeChecked ? ' checked' : '') + (executionPlan || mainWorkDone ? ' disabled' : '') + '><span class="form-check-label">Bãi thực tế</span></label>' +
                '<label class="form-check form-switch mb-0"><input class="form-check-input line-bai-ha-tam-1-toggle" type="checkbox"' + (baiHaTam1Checked ? ' checked' : '') + (executionPlan || mainWorkDone || rootDongHang ? ' disabled' : '') + '><span class="form-check-label">Bãi hạ tạm 1</span></label>' +
                '<label class="form-check form-switch mb-0"><input class="form-check-input line-bai-ha-tam-2-toggle" type="checkbox"' + (baiHaTam2Checked ? ' checked' : '') + (executionPlan || mainWorkDone ? ' disabled' : '') + '><span class="form-check-label">Bãi hạ tạm 2</span></label>' +
                '<label class="form-check form-switch mb-0"><input class="form-check-input line-tang-bo-toggle" type="checkbox"' + (optionEnabled(tangBo.enabled) ? ' checked' : '') + (executionPlan ? ' disabled' : '') + '><span class="form-check-label">Tăng bo</span></label>' +
                '<label class="form-check form-switch mb-0"><input class="form-check-input line-ke-hoach-ket-hop-toggle" type="checkbox"' + (combinedPlanChecked ? ' checked' : '') + (executionPlan ? ' disabled' : '') + '><span class="form-check-label">Kết hợp</span></label>' +
              '</div>' : '') +
            '</div>' +
            '<div class="' + modalClassPrefix + '-section">' +
              (isTuyenXa ? '<div class="' + modalClassPrefix + '-section-head"><div class="' + modalClassPrefix + '-section-title">Hàng & lệnh</div></div>' : '') +
              '<div class="ke-hoach-edit-grid">' +
                '<div class="khxh-span-4"><label class="form-label">Khách hàng <span class="text-danger">*</span></label><select class="form-select select2-searchable line-customer-select" style="width:100%" required' + (executionPlan ? ' disabled' : '') + '>' + buildCustomerOptions(line.nid_khach_hang || 0) + '</select><div class="invalid-feedback">Vui lòng chọn khách hàng</div></div>' +
                (isTuyenXa ? '' : '<div class="khxh-span-4"><label class="form-label">Số booking/ bill <span class="text-danger">*</span></label><input type="text" id="so_bkg-input" class="form-control" value="' + escHtml(line.so_bkg || '') + '" placeholder="Số booking/ bill" required><div class="invalid-feedback">Vui lòng nhập số booking/ bill</div></div>') +
                '<div class="' + (isTuyenXa ? 'khxh-span-4' : 'khxh-span-3') + '"><label class="form-label">' + (isTuyenXa ? 'Loại hàng' : 'Tên hàng') + '</label><select class="form-select line-loai-hang-select"' + (executionPlan ? ' disabled' : '') + '>' + buildTagOptions(state.cauHinh.loaiHang, line.loai_hang) + '</select></div>' +
                (isTuyenXa ? '<div class="khxh-span-4"><label class="form-label">Loại cont</label><select class="form-select line-loai-cont-select"' + (executionPlan ? ' disabled' : '') + '>' + buildTagOptions(state.cauHinh.loaiCont, line.loai_cont) + '</select></div>' +
                '<div class="khxh-span-4"><label class="form-label">Số cont</label><input type="text" class="form-control line-so-cont-input" value="' + escHtml(line.so_cont || '') + '" placeholder="Số cont"' + (executionPlan ? ' disabled' : '') + '></div>' +
                dateInputsHtml
                : '<div class="khxh-span-2"><label class="form-label">Loại cont</label><select class="form-select line-loai-cont-select"' + (executionPlan ? ' disabled' : '') + '>' + buildTagOptions(state.cauHinh.loaiCont, line.loai_cont) + '</select></div>' +
                '<div class="khxh-span-3"><label class="form-label">Ngày kế hoạch</label><input type="text" class="form-control line-plan-date-input" value="' + escHtml(planDt.date) + '" placeholder="dd/mm/yyyy" autocomplete="off"></div>' +
                '<div class="khxh-span-2"><label class="form-label">Giờ</label><select class="form-select line-plan-hour-select" autocomplete="off">' + hourSelectOptions(planDt.hour) + '</select></div>' +
                '<div class="khxh-span-3"><label class="form-label">Số cont</label><input type="text" class="form-control line-so-cont-input" value="' + escHtml(line.so_cont || '') + '" placeholder="Số cont"' + (executionPlan ? ' disabled' : '') + '></div>' +
                '<div class="khxh-span-3"><label class="form-label">Seal chính</label><input type="text" class="form-control line-seal-chinh-input" value="' + escHtml(line.so_seal_chinh || '') + '" placeholder="Seal chính"></div>') +
              '</div>' +
            '</div>' +
            '<div class="' + modalClassPrefix + '-section">' +
              (isTuyenXa ? '<div class="' + modalClassPrefix + '-section-head"><div class="' + modalClassPrefix + '-section-title">Tuyến vận chuyển</div></div>' : '') +
              '<div class="ke-hoach-edit-grid khxh-route-meta-grid">' +
                routeMetaHtml +
              '</div>' +
              '<div class="khxh-route-flow">' +
                '<div class="khxh-route-node"><label class="form-label">Bãi lấy' + (isTuyenXa ? ' <span class="text-danger">*</span>' : '') + '</label><select class="form-select line-bai-lay-select"' + (executionPlan || mainWorkDone ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_lay_cont) + '</select></div>' +
                '<div class="khxh-route-arrow"><i class="ti tabler-arrow-right"></i></div>' +
                '<div class="khxh-route-node line-bai-ha-tam-1-fields' + (baiHaTam1Checked ? '' : ' d-none') + '"><label class="form-label">Bãi hạ tạm 1</label><select class="form-select line-bai-ha-tam-1-select"' + (executionPlan || mainWorkDone ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_ha_tam_1) + '</select></div>' +
                '<div class="khxh-route-arrow line-bai-ha-tam-1-fields' + (baiHaTam1Checked ? '' : ' d-none') + '"><i class="ti tabler-arrow-right"></i></div>' +
                '<div class="khxh-route-node khxh-route-node-main"><label class="form-label">Địa chỉ đóng/ trả hàng (Kho) <span class="text-danger">*</span></label><select class="form-select line-kho-select"' + (executionPlan || mainWorkDone ? ' disabled' : '') + '>' + buildTagOptions(state.cauHinh.diaChiKho, line.dia_chi_kho) + '</select></div>' +
                '<div class="khxh-route-arrow"><i class="ti tabler-arrow-right"></i></div>' +
                '<div class="khxh-route-node line-bai-ha-tam-2-fields' + (baiHaTam2Checked ? '' : ' d-none') + '"><label class="form-label">Bãi hạ tạm 2</label><select class="form-select line-bai-ha-tam-2-select"' + (executionPlan || mainWorkDone ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_ha_tam_2) + '</select></div>' +
                '<div class="khxh-route-arrow line-bai-ha-tam-2-fields' + (baiHaTam2Checked ? '' : ' d-none') + '"><i class="ti tabler-arrow-right"></i></div>' +
                '<div class="khxh-route-node"><label class="form-label">Bãi hạ' + (isTuyenXa ? ' <span class="text-danger">*</span>' : '') + '</label><select class="form-select line-bai-ha-select"' + (executionPlan || mainWorkDone ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_ha_cont) + '</select></div>' +
                (isTuyenXa ? '' : '<div class="khxh-route-arrow"><i class="ti tabler-arrow-right"></i></div>' + portCangRouteHtml) +
              '</div>' +
              (isTuyenXa && !executionPlan ? '<div class="ke-hoach-edit-grid khxh-current-location-grid mt-3"><div class="khxh-span-6"><label class="form-label">Vị trí cont hiện tại</label><select class="form-select line-vi-tri-cont-select">' + routePointOptions(tuyenXaRoutePoints(line), line.vi_tri_cont_index_hien_tai, 0) + '</select></div><div class="khxh-span-6"><label class="form-label">Trạng thái cont</label><div class="khxh-location-state"><span class="badge btn-line-toggle-du-hang ' + (parseInt(line.da_du_hang, 10) === 1 ? 'bg-label-success' : 'bg-label-warning') + '" role="button" tabindex="0">' + (parseInt(line.da_du_hang, 10) === 1 ? 'Đã đủ hàng' : 'Chưa đủ hàng') + '</span></div></div></div>' : '') +
              (isTuyenXa ? '<div class="khxh-route-flow khxh-route-flow-actual line-bai-thuc-te-fields' + (baiThucTeChecked ? '' : ' d-none') + '">' +
                '<div class="khxh-route-node"><label class="form-label">Bãi lấy thực tế</label><select class="form-select line-bai-lay-thuc-te-select"' + (executionPlan || mainWorkDone ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_lay_thuc_te) + '</select></div>' +
                '<div class="khxh-route-arrow"><i class="ti tabler-arrow-right"></i></div>' +
                '<div class="khxh-route-node khxh-route-node-empty" aria-hidden="true"></div>' +
                '<div class="khxh-route-arrow"><i class="ti tabler-arrow-right"></i></div>' +
                '<div class="khxh-route-node"><label class="form-label">Bãi hạ thực tế</label><select class="form-select line-bai-ha-thuc-te-select"' + (executionPlan || mainWorkDone ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_ha_thuc_te) + '</select></div>' +
              '</div>' : '') +
            '</div>' +
            '<div class="' + modalClassPrefix + '-section">' +
              (isTuyenXa ? '<div class="' + modalClassPrefix + '-section-head"><div class="' + modalClassPrefix + '-section-title">Điều xe & vận hành</div></div>' : '') +
              '<div class="ke-hoach-edit-grid">' +
                '<div class="khxh-span-4"><label class="form-label">Phương tiện</label><input type="hidden" class="line-vehicle-id" value="' + (line.nid_phuong_tien || 0) + '"><button type="button" class="btn btn-outline-secondary w-100 text-start vehicle-summary btn-open-vehicle-modal' + (line.nid_phuong_tien ? ' is-selected' : '') + '"></button><div class="invalid-feedback d-block line-vehicle-feedback" style="display:none !important;">Vui lòng chọn phương tiện</div></div>' +
                '<div class="khxh-span-4"><label class="form-label">Lái xe</label><select class="form-select line-driver-select">' + buildDriverOptions(line.nid_lai_xe) + '</select></div>' +
                '<div class="khxh-span-4"><label class="form-label">Mooc</label><input type="hidden" class="line-mooc-id" value="' + (line.nid_mooc || 0) + '"><button type="button" class="btn btn-outline-secondary w-100 text-start line-mooc-display btn-open-mooc-modal' + (line.nid_mooc ? ' is-selected' : '') + '">' + moocSummaryHtml(line) + '</button></div>' +
                (isTuyenXa ? '<div class="khxh-span-half"><label class="form-label">Ghi chú</label><input type="text" class="form-control line-ghi-chu-input" value="' + escHtml(line.ghi_chu || '') + '" placeholder="Ghi chú"></div><div class="khxh-span-half"><label class="form-label d-block">Hình thức vận tải</label><div class="line-hinh-thuc-group">' + buildHinhThucRadios(line) + '</div></div>' : '<div class="khxh-span-4"><label class="form-label">Cut-off</label><input type="text" class="form-control line-cut-off-date-input" value="' + escHtml(cutOffDt.date) + '" placeholder="dd/mm/yyyy" autocomplete="off"></div><div class="khxh-span-2"><label class="form-label">Giờ</label><select class="form-select line-cut-off-hour-select" autocomplete="off">' + hourSelectOptions(cutOffDt.hour) + '</select></div><div class="khxh-span-6"><label class="form-label">Ghi chú</label><input type="text" class="form-control line-ghi-chu-input" value="' + escHtml(line.ghi_chu || '') + '" placeholder="Ghi chú"></div><div class="khxh-span-half"><label class="form-label d-block">Hình thức vận tải</label><div class="line-hinh-thuc-group">' + buildHinhThucRadios(line) + '</div></div><div class="khxh-span-half khxh-port-edit-options khxh-port-create-option-group">' + portCreateCheck('seal-phu-check', 'Seal phụ', !!String(line.so_seal_tam || '').trim()) + portCreateCheck('kiem-dich', 'Kiểm dịch', !!line.kiem_dich) + portCreateCheck('kiem-hoa', 'Kiểm hoá', !!line.kiem_hoa) + portCreateCheck('hun-trung', 'Hun trùng', !!line.hun_trung) + '</div>') +
              '</div>' +
            '</div>' +
            (isTuyenXa ? '<div class="khxh-tuyen-xa-section khxh-tang-bo-wrap' + (optionEnabled(tangBo.enabled) ? '' : ' d-none') + '">' +
              '<div class="khxh-tuyen-xa-section-head">' +
                '<div class="khxh-tuyen-xa-section-title">Tăng bo</div>' +
              '</div>' +
              '<div class="ke-hoach-edit-grid khxh-tang-bo-section' + (optionEnabled(tangBo.enabled) ? '' : ' d-none') + '">' +
                '<div class="khxh-span-4"><label class="form-label">Khách hàng tăng bo</label><select class="form-select line-tang-bo-customer-select">' + buildCustomerOptions(tangBo.nid_khach_hang || 0) + '</select></div>' +
                '<div class="khxh-span-8"><label class="form-label">Địa chỉ tăng bo</label><input type="text" class="form-control line-tang-bo-dia-chi-input" value="' + escHtml(tangBo.dia_chi || '') + '" placeholder="Địa chỉ tăng bo"></div>' +
                '<div class="khxh-span-4"><label class="form-label">Doanh thu khách hàng</label><input type="text" inputmode="numeric" class="form-control line-money-input line-tang-bo-doanh-thu-input" value="' + escHtml(moneyText(tangBo.doanh_thu_khach_hang || '')) + '" placeholder="0"></div>' +
                '<div class="khxh-span-4"><label class="form-label">Lương lái xe</label><input type="text" inputmode="numeric" class="form-control line-money-input line-tang-bo-luong-input" value="' + escHtml(moneyText(tangBo.luong_lai_xe || '')) + '" placeholder="0"></div>' +
                '<div class="khxh-span-12"><label class="form-label">Ghi chú tăng bo</label><input type="text" class="form-control line-tang-bo-ghi-chu-input" value="' + escHtml(tangBo.ghi_chu || '') + '" placeholder="Ghi chú tăng bo"></div>' +
              '</div>' +
            '</div>' : '') +
          '</div>';
        pickerHtml += '' +
            '<div class="' + modalClassPrefix + '-card khxh-cont-ref-card" id="khxh-return-cont-' + escHtml(line.key) + '" data-line-key="' + line.key + '">' +
            '<div class="' + modalClassPrefix + '-card-head"><div><div class="' + modalClassPrefix + '-card-title"><span class="khxh-step-badge">2</span>' + (isTuyenXa ? 'Kế hoạch nguồn' : 'Cont kéo về') + '</div></div><span class="khxh-cont-ref-section-status">Chưa chọn</span></div>' +
              '<div class="khxh-cont-ref-content"></div>' +
            '</div>' +
            (isTuyenXa ? '<div class="khxh-tuyen-xa-card khxh-ket-hop-card' + (returnContApplicable(line) ? '' : ' d-none') + '" id="khxh-combined-plan-' + escHtml(line.key) + '" data-line-key="' + line.key + '">' +
              '<div class="khxh-tuyen-xa-card-head">' +
                '<div>' +
                  '<div class="khxh-tuyen-xa-card-title"><span class="khxh-step-badge">3</span>Cont kéo về</div>' +
                '</div>' +
                '<div class="khxh-section-tools">' +
                  '<span class="khxh-cont-ref-section-status' + (ketHop.ke_hoach_cont_ref_nid ? ' is-selected' : '') + '">' + (ketHop.ke_hoach_cont_ref_nid ? 'Đã chọn 1' : 'Chưa chọn') + '</span>' +
                '</div>' +
              '</div>' +
              '<div class="khxh-cont-ref-content">' + returnContSummaryHtml(line) + '</div>' +
            '</div>' : '');
      }
      $form(isTuyenXa ? '#khxh-tuyen-xa-nav' : '#khxh-hang-cang-nav').html(navHtml);
      bindTuyenXaNavPin();
      $form('#ke-hoach-lines').html(html);
      if (!$form('#ke-hoach-cont-pickers').length) {
        $form('#ke-hoach-lines').after('<div id="ke-hoach-cont-pickers"></div>');
      }
      $form('#ke-hoach-cont-pickers').html(pickerHtml);
      $form('#ke-hoach-lines .ke-hoach-line-card').each(function () {
        var $card = $(this);
        var line = findLine($card.data('line-key'));
        if (line) {
          if (!isTuyenXa && mode !== 'edit') normalizePortCreateCard($card, line, $card.index());
          initCardUi($card, line);
        }
      });
      updateTuyenXaSidebar();
    }

    function buildTableRow(line, index) {
      var actionCopy = mode === 'edit' ? '<span class="text-muted">-</span>' : '<button type="button" class="btn btn-sm btn-icon btn-label-secondary btn-copy-row-ke-hoach" title="Sao chép dòng"><i class="ti tabler-copy"></i></button>';
      var actionRemove = mode === 'edit' ? '<span class="text-muted">-</span>' : '<button type="button" class="btn btn-sm btn-icon btn-label-danger btn-remove-row-ke-hoach" title="Xoá dòng"><i class="ti tabler-trash"></i></button>';
      var hinhThucOptions = '<option value="">H.Thức VT</option>';
      var selectedHinhThuc = normalizeHinhThuc(line.hinh_thuc_van_tai || '');
      $.each(hinhThucOptionsForForm(), function (key, label) {
        hinhThucOptions += '<option value="' + key + '"' + (selectedHinhThuc === key ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      });
      var dateInputsHtml = mode === 'edit'
        ? '<input type="text" class="form-control line-date-input line-ngay-bat-dau-input mb-2" value="' + escHtml(apiToDate(line.ngay_bat_dau || '')) + '" placeholder="Ngày bắt đầu">' +
          '<input type="text" class="form-control line-date-input line-ngay-ket-thuc-input" value="' + escHtml(apiToDate(line.ngay_ket_thuc || '')) + '" placeholder="Ngày kết thúc">'
        : '';
      var cangSelectHtml = currentPlanType() === 'tuyen_xa'
        ? ''
        : '<select class="form-select line-cang-select">' + buildTagOptions(state.diaDiem.cang, line.cang_xuat) + '</select>';
      var isTX = currentPlanType() === 'tuyen_xa';
      var sourceLocked = isTX && !!parseInt(line.ke_hoach_cont_ref_nid, 10);
      var returnCont = lineKetHop(line);
      var returnContItem = returnCont.cont_ref || null;
      var returnContLabel = returnContItem
        ? (returnContItem.so_cont || ('Cont #' + returnCont.ke_hoach_cont_ref_nid))
        : 'Chọn cont kéo về';
      var cargoCellHtml = isTX ? '' : '<td class="line-combo-cell line-cargo-cell">' +
        '<select class="form-select line-loai-hang-select mb-2">' + buildTagOptions(state.cauHinh.loaiHang, line.loai_hang) + '</select>' +
        dateInputsHtml +
        '</td>';
      var normalContPickerHtml = !isTX
        ? '<button type="button" class="btn btn-outline-secondary w-100 text-start line-cont-picker-display btn-open-cont-ref-modal" data-line-key="' + escHtml(line.key) + '"' + (shouldShowContPicker(selectedHinhThuc) ? '' : ' disabled') + '><span class="' + (line.ke_hoach_cont_ref_nid ? 'vehicle-inline-text' : 'vehicle-inline-placeholder') + '">' + escHtml(shouldShowContPicker(selectedHinhThuc) ? contRefButtonText(line) : 'Không áp dụng') + '</span></button>'
        : '';
	      return '' +
	        '<tr class="ke-hoach-table-row" data-line-key="' + line.key + '">' +
          '<td class="line-combo-cell"><select class="form-select line-customer-select mb-2"' + (sourceLocked ? ' disabled' : '') + '>' + buildCustomerOptions(line.nid_khach_hang || 0) + '</select>' + (isTX ? '<select class="form-select line-loai-hang-select"' + (sourceLocked ? ' disabled' : '') + '>' + buildTagOptions(state.cauHinh.loaiHang, line.loai_hang) + '</select>' : '<input type="text" class="form-control line-so-bkg-input" value="' + escHtml(line.so_bkg || '') + '" placeholder="Số BKG">') + '<div class="line-customer-feedback text-danger small mt-1" style="display:none;">Vui lòng chọn khách hàng</div></td>' +
	          '<td>' +
	            '<input type="hidden" class="line-vehicle-id" value="' + (line.nid_phuong_tien || 0) + '">' +
	            '<button type="button" class="btn btn-outline-secondary w-100 text-start line-vehicle-display btn-open-vehicle-modal' + (line.nid_phuong_tien ? ' is-selected' : '') + '">' + vehicleSummaryTableHtml(line) + '</button>' +
	            '<input type="hidden" class="line-mooc-id" value="' + (line.nid_mooc || 0) + '">' +
	            '<button type="button" class="btn btn-outline-secondary w-100 text-start line-mooc-display btn-open-mooc-modal mt-2' + (line.nid_mooc ? ' is-selected' : '') + '">' + moocSummaryHtml(line) + '</button>' +
	          '</td>' +
          '<td class="line-combo-cell">' +
            '<select class="form-select line-loai-cont-select mb-2"' + (sourceLocked ? ' disabled' : '') + '>' + buildTagOptions(state.cauHinh.loaiCont, line.loai_cont) + '</select>' +
            '<input type="text" class="form-control line-so-cont-input" value="' + escHtml(line.so_cont || '') + '" placeholder="Số cont"' + (sourceLocked ? ' disabled' : '') + '>' +
          '</td>' +
	          (isTX ? '<td class="line-combo-cell line-source-plan-cell"><label class="form-check form-switch mb-2"><input class="form-check-input line-plan-root-toggle" type="checkbox"' + (planRole(line) === 'ke_hoach_goc' ? ' checked' : '') + '><span class="form-check-label">Kế hoạch gốc</span></label><button type="button" class="btn btn-outline-secondary w-100 text-start line-cont-picker-display btn-open-cont-ref-modal" data-line-key="' + escHtml(line.key) + '"' + (sourcePickerEditable(line) ? '' : ' disabled') + '><span class="' + (line.ke_hoach_cont_ref_nid ? 'vehicle-inline-text' : 'vehicle-inline-placeholder') + '">' + escHtml(sourcePickerApplicable(line) ? contRefButtonText(line) : 'Chọn kế hoạch nguồn') + '</span></button></td>' : '') +
          '<td class="line-combo-cell">' +
            '<select class="form-select line-hinh-thuc-select mb-2">' + hinhThucOptions + '</select>' +
	            (isTX ? '<button type="button" class="btn btn-outline-secondary w-100 text-start line-cont-picker-display btn-open-return-cont-modal" data-line-key="' + escHtml(line.key) + '"' + (returnContApplicable(line) ? '' : ' disabled') + '><span class="' + (returnContItem ? 'vehicle-inline-text' : 'vehicle-inline-placeholder') + '">' + escHtml(returnContLabel) + '</span></button>' : normalContPickerHtml) +
	          '</td>' +
          (isTX ? '' :
            '<td class="line-combo-cell">' +
              '<input type="text" class="form-control line-seal-tam-input mb-2" value="' + escHtml(line.so_seal_tam || '') + '" placeholder="Số seal tạm">' +
              '<input type="text" class="form-control line-seal-chinh-input" value="' + escHtml(line.so_seal_chinh || '') + '" placeholder="Số seal chính">' +
            '</td>') +
          '<td class="line-combo-cell">' +
            '<select class="form-select line-kho-select mb-2"' + (sourceLocked ? ' disabled' : '') + '>' + buildTagOptions(state.cauHinh.diaChiKho, line.dia_chi_kho) + '</select>' +
            cangSelectHtml +
          '</td>' +
          '<td class="line-combo-cell">' +
            '<select class="form-select line-bai-lay-select mb-2"' + (sourceLocked ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_lay_cont) + '</select>' +
            '<select class="form-select line-bai-ha-select"' + (sourceLocked ? ' disabled' : '') + '>' + buildTagOptions(state.diaDiem.bai, line.bai_ha_cont) + '</select>' +
          '</td>' +
          cargoCellHtml +
          '<td class="text-center">' + actionCopy + '</td>' +
          '<td class="text-center">' + actionRemove + '</td>' +
        '</tr>';
    }

    function renderRows() {
      if (!useTableLayout) {
        renderCards();
        return;
      }
      var html = '';
      for (var i = 0; i < state.lines.length; i++) {
        html += buildTableRow(state.lines[i], i);
      }
      $form('#ke-hoach-lines-body').html(html);
      $form('#ke-hoach-lines-body .ke-hoach-table-row').each(function () {
        var $row = $(this);
        var line = findLine($row.data('line-key'));
        if (line) initRowUi($row, line);
      });
      updateTuyenXaSidebar();
    }

    function syncLine($row) {
      var line = findLine($row.data('line-key'));
      if (!line) return null;
      if (!useTableLayout) {
        if (currentPlanType() === 'tuyen_xa') {
          line.vai_tro_ke_hoach = $row.find('.line-plan-root-toggle').is(':checked') ? 'ke_hoach_goc' : 'thuc_hien_chang';
        }
        line.nid_khach_hang = parseInt($row.find('.line-customer-select').val(), 10) || 0;
        line.nid_phuong_tien = parseInt($row.find('.line-vehicle-id').val(), 10) || 0;
        line.nid_mooc = parseInt($row.find('.line-mooc-id').val(), 10) || 0;
        if (line.nid_mooc && (!line.mooc || parseInt(line.mooc.nid, 10) !== line.nid_mooc)) {
          line.mooc = state.moocMap[String(line.nid_mooc)] || line.mooc || null;
        }
        if (!line.nid_mooc) {
          line.mooc = null;
        }
        line.nid_lai_xe = parseInt($row.find('.line-driver-select').val(), 10) || 0;
        if (currentPlanType() !== 'tuyen_xa') {
          var $bkgInput = $row.find('.line-so-bkg-input');
          if (!$bkgInput.length) $bkgInput = $form('#so_bkg-input');
          if ($bkgInput.length) line.so_bkg = ($bkgInput.val() || '').trim();
        }
        line.so_cont = $row.find('.line-so-cont-input').val().trim();
        line.loai_cont = ($row.find('.line-loai-cont-select').val() || '').trim();
        line.loai_hang = ($row.find('.line-loai-hang-select').val() || '').trim();
        line.hinh_thuc_tinh_luong_lai_xe = $row.find('.line-chuyen-xa-toggle').is(':checked') ? 'theo_chuyen' : 'khoan';
        line.ke_hoach_ket_hop_enabled = $row.find('.line-ke-hoach-ket-hop-toggle').is(':checked') ? 1 : 0;
        if (currentPlanType() !== 'tuyen_xa') {
          line.so_seal_chinh = $row.find('.line-seal-chinh-input').val().trim();
          var $sealTam = $row.find('.line-seal-tam-input');
          line.so_seal_tam = $sealTam.length
            ? ($sealTam.val() || '').trim()
            : ($row.find('.line-seal-phu-check').is(':checked') ? 'Có seal phụ' : '');
        }
        line.dia_chi_kho = ($row.find('.line-kho-select').val() || '').trim();
        line.bai_lay_cont = ($row.find('.line-bai-lay-select').val() || '').trim();
        line.bai_ha_cont = ($row.find('.line-bai-ha-select').val() || '').trim();
        line.bai_ha_tam_1_enabled = $row.find('.line-bai-ha-tam-1-toggle').is(':checked') ? 1 : 0;
        line.bai_ha_tam_1 = line.bai_ha_tam_1_enabled ? (($row.find('.line-bai-ha-tam-1-select').val() || '').trim()) : '';
        line.bai_ha_tam_2_enabled = $row.find('.line-bai-ha-tam-2-toggle').is(':checked') ? 1 : 0;
        line.bai_ha_tam_2 = line.bai_ha_tam_2_enabled ? (($row.find('.line-bai-ha-tam-2-select').val() || '').trim()) : '';
        var selectedLocationIndex = parseInt($row.find('.line-vi-tri-cont-select').val(), 10);
        if (!isNaN(selectedLocationIndex)) line.vi_tri_cont_index_hien_tai = selectedLocationIndex;
        if (isNaN(parseInt(line.vi_tri_cont_index_hien_tai, 10))) line.vi_tri_cont_index_hien_tai = 0;
        var routePoints = tuyenXaRoutePoints(line);
        line.vi_tri_cont_hien_tai = routePoints[line.vi_tri_cont_index_hien_tai] ? routePoints[line.vi_tri_cont_index_hien_tai].value : '';
        line.cang_xuat = currentPlanType() === 'tuyen_xa' ? '' : (($row.find('.line-cang-select').val() || '').trim());
        if ($row.find('.line-bai-thuc-te-toggle').is(':checked')) {
          line.bai_lay_thuc_te = ($row.find('.line-bai-lay-thuc-te-select').val() || '').trim();
          line.bai_ha_thuc_te = ($row.find('.line-bai-ha-thuc-te-select').val() || '').trim();
        } else {
          line.bai_lay_thuc_te = '';
          line.bai_ha_thuc_te = '';
        }
        line.cut_off = currentPlanType() === 'tuyen_xa' ? '' : datetimeToApi(($row.find('.line-cut-off-input').val() || '').trim());
        if ($row.find('.line-cut-off-date-input').length) {
          line.cut_off = dateAndHourToApi($row.find('.line-cut-off-date-input').val(), $row.find('.line-cut-off-hour-select').val());
        }
        if ($row.find('.line-ngay-gio-input').length) line.ngay_gio_ke_hoach = datetimeToApi(($row.find('.line-ngay-gio-input').val() || '').trim());
        if ($row.find('.line-plan-date-input').length) {
          line.ngay_gio_ke_hoach = dateAndHourToApi($row.find('.line-plan-date-input').val(), $row.find('.line-plan-hour-select').val());
        }
        if ($row.find('.line-ngay-bat-dau-input').length) line.ngay_bat_dau = dateToApi($row.find('.line-ngay-bat-dau-input').val().trim());
        if ($row.find('.line-ngay-ket-thuc-input').length) line.ngay_ket_thuc = dateToApi($row.find('.line-ngay-ket-thuc-input').val().trim());
        line.ghi_chu = ($row.find('.line-ghi-chu-input').val() || '').trim();
        line.hinh_thuc_van_tai = normalizeHinhThuc(($row.find('.line-hinh-thuc-select').val() || $row.find('.line-hinh-thuc-radio:checked').val() || '').trim());
        line.kiem_dich = $row.find('.line-kiem-dich').is(':checked') ? 1 : 0;
        line.kiem_hoa = $row.find('.line-kiem-hoa').is(':checked') ? 1 : 0;
        line.hun_trung = $row.find('.line-hun-trung').is(':checked') ? 1 : 0;
        line.tang_bo = {
          enabled: $row.find('.line-tang-bo-toggle').is(':checked') ? 1 : 0,
          nid_khach_hang: parseInt($row.find('.line-tang-bo-customer-select').val(), 10) || 0,
          dia_chi: ($row.find('.line-tang-bo-dia-chi-input').val() || '').trim(),
          ghi_chu: ($row.find('.line-tang-bo-ghi-chu-input').val() || '').trim(),
          doanh_thu_khach_hang: moneyValue($row.find('.line-tang-bo-doanh-thu-input').val() || ''),
          luong_lai_xe: moneyValue($row.find('.line-tang-bo-luong-input').val() || '')
        };
        if (!line.tang_bo.enabled) {
          line.tang_bo.nid_khach_hang = 0;
          line.tang_bo.dia_chi = '';
          line.tang_bo.ghi_chu = '';
          line.tang_bo.doanh_thu_khach_hang = 0;
          line.tang_bo.luong_lai_xe = 0;
        }
        line.ket_hop = lineKetHop(line);
        line.da_cat_mooc = (line.hinh_thuc_van_tai === 'cat_keo' || line.hinh_thuc_van_tai === 'cat_keo_cheo' || line.hinh_thuc_van_tai === 'tha_mooc') ? 1 : 0;
        if (currentPlanType() !== 'tuyen_xa' && line.hinh_thuc_van_tai === 'dong_hang') {
          line.da_du_hang = 1;
        }
        return line;
      }
      if (currentPlanType() === 'tuyen_xa') {
        line.vai_tro_ke_hoach = $row.find('.line-plan-root-toggle').is(':checked') ? 'ke_hoach_goc' : 'thuc_hien_chang';
      }
      line.nid_khach_hang = parseInt($row.find('.line-customer-select').val(), 10) || 0;
      line.nid_phuong_tien = parseInt($row.find('.line-vehicle-id').val(), 10) || 0;
      line.nid_mooc = parseInt($row.find('.line-mooc-id').val(), 10) || 0;
      if (line.nid_mooc && (!line.mooc || parseInt(line.mooc.nid, 10) !== line.nid_mooc)) {
        line.mooc = findMoocById(line.nid_mooc);
      }
      if (!line.nid_mooc) {
        line.mooc = null;
      }
      if (currentPlanType() !== 'tuyen_xa') line.so_bkg = $row.find('.line-so-bkg-input').val().trim();
      line.so_cont = $row.find('.line-so-cont-input').val().trim();
      line.loai_cont = ($row.find('.line-loai-cont-select').val() || '').trim();
      line.loai_hang = ($row.find('.line-loai-hang-select').val() || '').trim();
      if (currentPlanType() !== 'tuyen_xa') {
        line.so_seal_chinh = $row.find('.line-seal-chinh-input').val().trim();
        line.so_seal_tam = $row.find('.line-seal-tam-input').val().trim();
      }
      line.dia_chi_kho = ($row.find('.line-kho-select').val() || '').trim();
      line.bai_lay_cont = ($row.find('.line-bai-lay-select').val() || '').trim();
      line.bai_ha_cont = ($row.find('.line-bai-ha-select').val() || '').trim();
      line.bai_ha_thuc_te = normalizeBaiHaThucTe(($row.find('.line-bai-ha-thuc-te-select').val() || '').trim(), line.bai_ha_cont);
      line.hinh_thuc_van_tai = normalizeHinhThuc($row.find('.line-hinh-thuc-select').val() || '');
      line.cang_xuat = currentPlanType() === 'tuyen_xa' ? '' : (($row.find('.line-cang-select').val() || '').trim());
      if ($row.find('.line-cut-off-input').length) {
        line.cut_off = datetimeToApi(($row.find('.line-cut-off-input').val() || '').trim());
      }
      if ($row.find('.line-cut-off-date-input').length) {
        line.cut_off = dateAndHourToApi($row.find('.line-cut-off-date-input').val(), $row.find('.line-cut-off-hour-select').val());
      }
      if ($row.find('.line-plan-date-input').length) {
        line.ngay_gio_ke_hoach = dateAndHourToApi($row.find('.line-plan-date-input').val(), $row.find('.line-plan-hour-select').val());
      }
      if ($row.find('.line-ngay-bat-dau-input').length) line.ngay_bat_dau = dateToApi($row.find('.line-ngay-bat-dau-input').val().trim());
      if ($row.find('.line-ngay-ket-thuc-input').length) line.ngay_ket_thuc = dateToApi($row.find('.line-ngay-ket-thuc-input').val().trim());
      line.ghi_chu = ($row.find('.line-ghi-chu-input').val() || '').trim();
      return line;
    }

    function syncAllLines() {
      var selector = useTableLayout ? '#ke-hoach-lines-body .ke-hoach-table-row' : '#ke-hoach-lines .ke-hoach-line-card';
      $form(selector).each(function () {
        syncLine($(this));
      });
    }

    function refreshLineSources() {
      syncAllLines();
      renderRows();
    }

    function addLine(source) {
      var line = createLine(source);
      state.lines.push(line);
      renderRows();
    }

    function resetAllLines() {
      state.lines = [];
      addLine({});
    }

    function openVehicleModal(key) {
      activePickerType = 'vehicle';
      openPickerModal(key);
    }

    function openMoocModal(key) {
      activePickerType = 'mooc';
      openPickerModal(key);
    }

    function openPickerModal(key) {
      state.activeLineKey = key;
      // Hàng cảng dùng cùng picker dạng nút Chọn ở cả tạo mới và xếp xe.
      // Tuyến xa vẫn giữ picker radio cũ, độc lập với hàng cảng.
      var isPortCreatePicker = !useTableLayout && currentPlanType() !== 'tuyen_xa';
      var lineIndex = $form('#ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + key + '"]').index() + 1;
      if (!useTableLayout) {
        lineIndex = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]').index() + 1;
      }
      if (activePickerType === 'mooc') {
        $('#vehicle-picker-target').text('Đang chọn mooc cho dòng #' + lineIndex);
        $('#vehicle-picker-modal .modal-title').text('Chọn mooc');
        $('#vehicle-picker-col-bks').text('Biển số');
        $('#vehicle-picker-col-type').text('Loại xe');
        $('#vehicle-picker-col-extra').text('Nhãn hiệu / Năm SX');
        $('#vehicle-picker-search').attr('placeholder', 'Tìm theo BKS, mã tài sản, nhãn hiệu...');
      } else {
        $('#vehicle-picker-target').text('Đang chọn phương tiện cho dòng #' + lineIndex);
        $('#vehicle-picker-modal .modal-title').text('Chọn phương tiện');
        $('#vehicle-picker-col-bks').text('Biển số');
        $('#vehicle-picker-col-type').text('Loại xe');
        $('#vehicle-picker-col-extra').text('Lái xe hiện tại');
        $('#vehicle-picker-search').attr('placeholder', 'Tìm theo BKS, mã tài sản, lái xe...');
      }
      $('#vehicle-picker-modal').toggleClass('is-port-create-picker', isPortCreatePicker);
      $formOrPage('#vehicle-picker-search').val('');
      renderVehicleTable('');
      var vehicleModalEl = $formOrPage('#vehicle-picker-modal')[0];
      if (!vehicleModalEl) return;
      if (vehicleModalEl.parentNode !== document.body) {
        var vehiclePlaceholder = document.createComment('vehicle-picker-placeholder');
        vehicleModalEl.parentNode.insertBefore(vehiclePlaceholder, vehicleModalEl);
        vehicleModalEl.__vehiclePickerPlaceholder = vehiclePlaceholder;
        document.body.appendChild(vehicleModalEl);
      }
      if (!vehicleModal || vehicleModal._element !== vehicleModalEl) {
        var vehicleModalOptions = { backdrop: true, keyboard: true, focus: true };
        vehicleModal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(vehicleModalEl, vehicleModalOptions) : new bootstrap.Modal(vehicleModalEl, vehicleModalOptions);
      }
      function showVehiclePicker() {
        var pickerModalEl = vehicleModal._element;
        var pickerDialog = pickerModalEl.querySelector('.modal-dialog');
        pickerModalEl.classList.remove('show');
        if (pickerDialog) {
          var pickerInitialTransform = getComputedStyle(pickerDialog).transform;
          pickerDialog.style.transition = 'none';
          pickerDialog.style.transform = pickerInitialTransform;
          void pickerModalEl.offsetWidth;
          pickerDialog.style.transition = '';
          pickerDialog.style.transform = '';
        }
        vehicleModal.show();
      }
      if (vehicleModal._isShown || vehicleModal._isTransitioning) {
        var pickerEl = vehicleModal._element;
        pickerEl.addEventListener('hidden.bs.modal', function onHidden() {
          pickerEl.removeEventListener('hidden.bs.modal', onHidden);
          showVehiclePicker();
        });
        if (vehicleModal._isShown) vehicleModal.hide();
      }
      else {
        showVehiclePicker();
      }
    }

    function renderVehicleTable(keyword) {
      keyword = normalizeSearchText(keyword);
      var activeLine = findLine(state.activeLineKey);
      var html = '';
      var vehicleTypeMeta = function (value) {
        var raw = String(value || '').trim();
        var type = raw.toLowerCase();
        var types = {
          dau_keo: { label: 'Đầu kéo', badge: 'bg-label-primary' },
          mooc: { label: 'Mooc', badge: 'bg-label-warning' },
          may_phat: { label: 'Máy phát', badge: 'bg-label-info' }
        };
        return types[type] || { label: raw || 'Chưa phân loại', badge: 'bg-label-secondary' };
      };
      var sourceItems = activePickerType === 'mooc' ? state.moocs : state.vehicles;
      var isPortCreatePicker = !useTableLayout && currentPlanType() !== 'tuyen_xa';
      if (activePickerType === 'mooc' && (!sourceItems || !sourceItems.length)) {
        sourceItems = $.grep(state.vehicles, function (item) {
          return String(item.loai_phuong_tien || '').toLowerCase().indexOf('mooc') !== -1;
        });
      }
      for (var i = 0; i < sourceItems.length; i++) {
        var item = sourceItems[i];
        if (activePickerType === 'vehicle' && item.loai_phuong_tien !== 'dau_keo') continue;
        var typeMeta = vehicleTypeMeta(item.loai_phuong_tien);
        var driverText = item.lai_xe && item.lai_xe.ten ? item.lai_xe.ten + (item.lai_xe.sdt ? ' - ' + item.lai_xe.sdt : '') : 'Chưa gán lái xe';
        var metaText = item.ma_tai_san || item.hang_xe || item.loai_phuong_tien || '';
        var haystack = normalizeSearchText([item.bks, metaText, item.loai_phuong_tien, item.hang_xe, driverText].join(' '));
        if (keyword && haystack.indexOf(keyword) === -1) continue;
        var checked = activeLine && (activePickerType === 'mooc'
          ? parseInt(activeLine.nid_mooc, 10) === parseInt(item.nid, 10)
          : parseInt(activeLine.nid_phuong_tien, 10) === parseInt(item.nid, 10));
        var selectCell = isPortCreatePicker
          ? '<td class="text-center"><button type="button" class="btn btn-sm btn-primary btn-pick-vehicle" data-id="' + item.nid + '">Chọn</button></td>'
          : '<td class="text-center"><input type="radio" name="vehicle-picker-radio" value="' + item.nid + '"' + (checked ? ' checked' : '') + '></td>';
        var extraCell = activePickerType === 'mooc'
          ? '<td><div>' + escHtml(item.hang_xe || '—') + '</div><div class="vehicle-picker-driver">' + escHtml(item.nam_san_xuat || '—') + '</div></td>'
          : '<td><div>' + escHtml(item.lai_xe && item.lai_xe.ten ? item.lai_xe.ten : 'Chưa gán lái xe') + '</div><div class="vehicle-picker-driver">' + escHtml(item.lai_xe && item.lai_xe.sdt ? item.lai_xe.sdt : '') + '</div></td>';
        html += '<tr>' +
          selectCell +
          '<td><strong>' + escHtml(item.bks || ('#' + item.nid)) + '</strong><div class="text-muted small">' + escHtml(item.ma_tai_san || '') + '</div></td>' +
          '<td><span class="badge ' + typeMeta.badge + '">' + escHtml(typeMeta.label) + '</span></td>' +
          extraCell +
          (isPortCreatePicker ? '' : '<td class="text-center"><button type="button" class="btn btn-sm btn-primary btn-pick-vehicle" data-id="' + item.nid + '">Chọn</button></td>') +
          '</tr>';
      }
      if (!html) html = '<tr><td colspan="' + (isPortCreatePicker ? 4 : 5) + '" class="text-center text-muted py-4">Không tìm thấy ' + (activePickerType === 'mooc' ? 'mooc' : 'phương tiện') + ' phù hợp</td></tr>';
      $('#vehicle-picker-body').html(html);
    }

    function selectVehicleForLine(vehicleId) {
      var line = findLine(state.activeLineKey);
      if (!line) return;
      if (activePickerType === 'mooc') {
        var mooc = findMoocById(vehicleId);
        line.nid_mooc = mooc ? parseInt(mooc.nid, 10) || 0 : 0;
        line.mooc = mooc || null;
      } else {
        var vehicle = state.vehicleMap[String(vehicleId)] || null;
        line.nid_phuong_tien = vehicle ? parseInt(vehicle.nid, 10) || 0 : 0;
        line.nid_lai_xe = vehicle && vehicle.lai_xe && vehicle.lai_xe.nid ? parseInt(vehicle.lai_xe.nid, 10) || 0 : 0;
      }
      if (useTableLayout) {
        var $row = $form('#ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + line.key + '"]');
        if (activePickerType === 'vehicle') {
          $row.find('.line-vehicle-id').val(line.nid_phuong_tien || 0);
          $row.find('.line-vehicle-display').addClass('is-selected').html(vehicleSummaryTableHtml(line));
        } else {
          $row.find('.line-mooc-id').val(line.nid_mooc || 0);
          if (line.nid_mooc) {
            $row.find('.line-mooc-display').addClass('is-selected').html('<span class="vehicle-inline-text">' + escHtml(moocSummaryText(line)) + '</span>');
          } else {
            $row.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
          }
        }
        $row.removeClass('table-danger');
        $row.find('.line-customer-feedback').hide();
      }
      else {
        var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + line.key + '"]');
        if (activePickerType === 'mooc') {
          $card.find('.line-mooc-id').val(line.nid_mooc || 0);
          if (line.nid_mooc) {
            var moocText = moocSummaryText(line);
            $card.find('.line-mooc-display').addClass('is-selected').html('<span class="vehicle-inline-text">' + escHtml(moocText) + '</span>');
          } else {
            $card.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
          }
        } else {
          $card.find('.line-vehicle-id').val(line.nid_phuong_tien || 0);
          $card.find('.line-driver-select').val(line.nid_lai_xe || '').trigger('change');
        }
        $card.find('.vehicle-summary').addClass('is-selected').html(vehicleSummaryCardHtml(line));
        $card.find('.line-vehicle-feedback').hide();
        $card.removeClass('line-card-invalid');
      }
      if (vehicleModal) vehicleModal.hide();
      updateTuyenXaSidebar();
    }

    function clearVehicleForActiveLine() {
      var line = findLine(state.activeLineKey);
      if (!line) return;
      if (activePickerType === 'mooc') {
        line.nid_mooc = 0;
        line.mooc = null;
      } else {
        line.nid_phuong_tien = 0;
        line.nid_lai_xe = 0;
      }

      if (useTableLayout) {
        var $row = $form('#ke-hoach-lines-body .ke-hoach-table-row[data-line-key="' + line.key + '"]');
        if (activePickerType === 'vehicle') {
          $row.find('.line-vehicle-id').val(0);
          $row.find('.line-vehicle-display').removeClass('is-selected').html(vehicleSummaryTableHtml(line));
        } else {
          $row.find('.line-mooc-id').val(0);
          $row.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
        }
      }
      else {
        var $card = $form('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + line.key + '"]');
        if (activePickerType === 'mooc') {
          $card.find('.line-mooc-id').val(0);
          $card.find('.line-mooc-display').removeClass('is-selected').html(moocSummaryHtml(line));
        } else {
          $card.find('.line-vehicle-id').val(0);
          $card.find('.line-driver-select').val('').trigger('change');
        }
        $card.find('.vehicle-summary').removeClass('is-selected').html(vehicleSummaryCardHtml(line));
      }

      if (vehicleModal) vehicleModal.hide();
      updateTuyenXaSidebar();
    }

	    function shouldShowContPicker(hinhThuc) {
	      return hinhThuc === 'cat_keo' || hinhThuc === 'cat_keo_cheo' || hinhThuc === 'rut_mooc';
	    }

    function contRefButtonText(line) {
	      if (!line || !line.ke_hoach_cont_ref_nid) {
	        return currentPlanType() === 'tuyen_xa' ? 'Chọn kế hoạch nguồn' : 'Chọn cont kéo về';
	      }
      if (currentPlanType() !== 'tuyen_xa') {
        var item = line.cont_ref || {};
        var soCont = item.so_cont || line.cont_ref_label || ('Cont #' + line.ke_hoach_cont_ref_nid);
        var baiHa = item.bai_ha_thuc_te || item.bai_ha_cont || item.bai_ha || '';
        return soCont + (baiHa ? ' (Về) - ' + baiHa : '');
      }
      return line.cont_ref_label || ('Cont #' + line.ke_hoach_cont_ref_nid);
    }

    function contRefIdentityHtml(item, duHang, title) {
      return '<div class="khxh-cont-ref-identity"><button type="button" class="khxh-cont-ref-number btn-edit-cont-candidate" data-id="' + escHtml(item.nid) + '" title="' + escHtml(title) + '">' + escHtml(item.so_cont || ('#' + item.nid)) + '</button><span class="badge bg-label-secondary">' + escHtml(item.loai_cont || '—') + '</span><span class="badge ' + (duHang ? 'bg-label-success' : 'bg-label-warning') + '">' + (duHang ? 'Đủ hàng' : 'Chưa đủ') + '</span></div>';
    }

    function contRefIdentityMetaHtml(item, duHang, title) {
      return '<span class="khxh-cont-ref-cont"><small>Số cont</small><strong><button type="button" class="khxh-cont-ref-number btn-edit-cont-candidate" data-id="' + escHtml(item.nid) + '" title="' + escHtml(title) + '">' + escHtml(item.so_cont || ('#' + item.nid)) + '</button><span class="badge bg-label-secondary">' + escHtml(item.loai_cont || '—') + '</span><span class="badge ' + (duHang ? 'bg-label-success' : 'bg-label-warning') + '">' + (duHang ? 'Đủ hàng' : 'Chưa đủ') + '</span></strong></span>';
    }

    function normalContReturnRouteText(item) {
      if (!item) return '';
      var plannedDestination = item.bai_ha_cont || '';
      var actualDestination = normalizeBaiHaThucTe(item.bai_ha_thuc_te || '', plannedDestination);
      var destination = actualDestination || plannedDestination;
      return [item.dia_chi_kho || '', destination].filter(Boolean).join(' → ');
    }

    function selectedContSummaryHtml(item, line) {
      var isTuyenXa = currentPlanType() === 'tuyen_xa';
      if (!item) {
        return isTuyenXa
          ? '<div class="khxh-cont-ref-empty"><div><strong>Chưa chọn kế hoạch nguồn</strong><div class="text-muted small">Chọn cont gốc và dải chặng kế hoạch này nhận thực hiện.</div></div><button type="button" class="btn btn-primary btn-open-cont-ref-modal" data-line-key="' + escHtml(line.key) + '"><i class="ti tabler-plus me-1"></i>Chọn kế hoạch nguồn</button></div>'
          : '<div class="khxh-cont-ref-empty"><div><strong>Chưa chọn cont kéo về</strong><div class="text-muted small">Chọn cont kéo về cho kế hoạch này.</div></div><button type="button" class="btn btn-primary btn-open-cont-ref-modal" data-line-key="' + escHtml(line.key) + '"><i class="ti tabler-plus me-1"></i>Chọn cont</button></div>';
      }
      var customer = customerPlanLabel(item.khach_hang) || item.ma_kh || item.ten_khach_hang || item.khach_hang_ten || '';
      var customerFull = customerFullName(item.khach_hang) || item.ten_khach_hang || item.khach_hang_ten || '';
      var dauKeo = (item.phuong_tien && (item.phuong_tien.bks || item.phuong_tien.bien_so)) || item.bks_dau_keo || '';
      var mooc = (item.mooc && (item.mooc.bks || item.mooc.bien_so)) || item.bks_mooc || '';
      var laiXe = (item.lai_xe && item.lai_xe.ten) || item.ten_lai_xe || '';
      var routeText = isTuyenXa ? contServiceRouteText(item, line) : normalContReturnRouteText(item);
      var duHang = parseInt(item.da_du_hang, 10) === 1;
      var mainDone = isTuyenXa && optionEnabled(line.cong_viec_chinh_hoan_thanh);
      return '<div class="khxh-cont-ref-selected">' +
        '<div class="khxh-cont-ref-selected-top' + (isTuyenXa ? ' is-tuyen-xa' : ' is-grid') + '">' +
          '<div class="khxh-cont-ref-meta is-tuyen-xa' + (isTuyenXa ? '' : ' is-hang-cang') + '">' + contRefIdentityMetaHtml(item, duHang, isTuyenXa ? 'Mở kế hoạch cont nguồn' : 'Mở kế hoạch cont kéo về') + (isTuyenXa ? '' : '<span><small>Booking</small><strong>' + escHtml(item.so_bkg || '—') + '</strong></span>') + '<span><small>Khách hàng</small><strong' + (customerFull ? ' title="' + escHtml(customerFull) + '"' : '') + '>' + escHtml(customer || '—') + '</strong></span><span><small>Xe kéo lên</small><strong>' + escHtml(dauKeo || '—') + '</strong></span><span><small>Mooc</small><strong>' + escHtml(mooc || '—') + '</strong></span><span><small>Lái xe</small><strong>' + escHtml(laiXe || '—') + '</strong></span></div>' +
          '<div class="khxh-cont-ref-actions"><button type="button" class="btn btn-sm btn-outline-secondary btn-open-cont-ref-modal" data-line-key="' + escHtml(line.key) + '"' + (mainDone ? ' disabled' : '') + '>' + (isTuyenXa ? 'Đổi nguồn' : 'Đổi cont') + '</button><button type="button" class="btn btn-sm btn-icon btn-label-danger btn-remove-cont-ref" data-line-key="' + escHtml(line.key) + '" title="' + (isTuyenXa ? 'Bỏ kế hoạch nguồn' : 'Bỏ cont kéo về') + '"' + (mainDone ? ' disabled' : '') + '><i class="ti tabler-x"></i></button></div>' +
        '</div>' +
        '<div class="khxh-cont-ref-selected-bottom' + (currentPlanType() === 'tuyen_xa' ? ' is-tuyen-xa' : '') + '"><span><small>' + (isTuyenXa ? 'Dải chặng thực hiện' : 'Tuyến kéo về') + '</small><strong>' + escHtml(routeText || '—') + '</strong></span>' +
          (currentPlanType() === 'tuyen_xa' ? '' : '<span><small>Seal</small><strong>' + escHtml(item.so_seal_chinh || '—') + (item.so_seal_tam ? ' · ' + escHtml(item.so_seal_tam) : '') + '</strong></span>') +
          '<span><small>Ghi chú</small><strong>' + escHtml(item.ghi_chu || '—') + '</strong></span></div>' +
      '</div>';
    }

    function mainWorkEndLocation(line) {
      if (isExecutionPlan(line) && line.cont_ref) {
        var sourcePoints = tuyenXaRoutePoints(line.cont_ref);
        var sourceEnd = parseInt(line.cont_thuc_hien_den_index, 10);
        return sourcePoints[sourceEnd] ? sourcePoints[sourceEnd].value : '';
      }
      var ownPoints = tuyenXaRoutePoints(line);
      var ownEnd = rootInitialEndIndex(line);
      return ownPoints[ownEnd] ? ownPoints[ownEnd].value : '';
    }

    function returnContSummaryHtml(line) {
      var combined = lineKetHop(line);
      var item = combined.cont_ref;
      if (!combined.ke_hoach_cont_ref_nid || !item) {
        return '<div class="khxh-cont-ref-empty"><div><strong>Chưa chọn cont kéo về</strong></div><button type="button" class="btn btn-primary btn-open-return-cont-modal" data-line-key="' + escHtml(line.key) + '"><i class="ti tabler-plus me-1"></i>Chọn cont kéo về</button></div>';
      }
      var points = tuyenXaRoutePoints(item);
      var start = parseInt(combined.cont_thuc_hien_tu_index, 10);
      var end = parseInt(combined.cont_thuc_hien_den_index, 10);
      var route = start >= 0 && end > start ? $.map(points.slice(start, end + 1), function (point) { return point.value; }).join(' → ') : '';
      var customer = customerPlanLabel(item.khach_hang) || item.ma_kh || item.ten_khach_hang || item.khach_hang_ten || '';
      var customerFull = customerFullName(item.khach_hang) || item.ten_khach_hang || item.khach_hang_ten || '';
      var dauKeo = (item.phuong_tien && (item.phuong_tien.bks || item.phuong_tien.bien_so)) || item.bks_dau_keo || '';
      var mooc = (item.mooc && (item.mooc.bks || item.mooc.bien_so)) || item.bks_mooc || '';
      var laiXe = (item.lai_xe && item.lai_xe.ten) || item.ten_lai_xe || '';
      var duHang = parseInt(item.da_du_hang, 10) === 1;
      var isTuyenXa = currentPlanType() === 'tuyen_xa';
      return '<div class="khxh-cont-ref-selected">' +
        '<div class="khxh-cont-ref-selected-top' + (isTuyenXa ? ' is-tuyen-xa' : '') + '">' +
          (isTuyenXa ? '' : contRefIdentityHtml(item, duHang, 'Mở kế hoạch cont kéo về')) +
          '<div class="khxh-cont-ref-meta' + (isTuyenXa ? ' is-tuyen-xa' : '') + '">' + (isTuyenXa ? contRefIdentityMetaHtml(item, duHang, 'Mở kế hoạch cont kéo về') : '') + '<span><small>Khách hàng</small><strong' + (customerFull ? ' title="' + escHtml(customerFull) + '"' : '') + '>' + escHtml(customer || '—') + '</strong></span><span><small>Xe kéo lên</small><strong>' + escHtml(dauKeo || '—') + '</strong></span><span><small>Mooc</small><strong>' + escHtml(mooc || '—') + '</strong></span><span><small>Lái xe</small><strong>' + escHtml(laiXe || '—') + '</strong></span></div>' +
          '<div class="khxh-cont-ref-actions"><button type="button" class="btn btn-sm btn-outline-secondary btn-open-return-cont-modal" data-line-key="' + escHtml(line.key) + '"' + (optionEnabled(combined.hoan_thanh) ? ' disabled' : '') + '>Đổi cont</button><button type="button" class="btn btn-sm btn-icon btn-label-danger btn-remove-return-cont" data-line-key="' + escHtml(line.key) + '" title="Bỏ cont"' + (optionEnabled(combined.hoan_thanh) ? ' disabled' : '') + '><i class="ti tabler-x"></i></button></div>' +
        '</div>' +
        '<div class="khxh-cont-ref-selected-bottom is-tuyen-xa"><span><small>Dải chặng kéo về</small><strong>' + escHtml(route || '—') + '</strong></span><span><small>Ghi chú</small><strong>' + escHtml(item.ghi_chu || '—') + '</strong></span></div>' +
      '</div>';
    }

    function tuyenXaRoutePoints(item) {
      if (!item) return [];
      var json = item.thong_tin_json || {};
      var temp1Enabled = parseInt(item.bai_ha_tam_1_enabled !== undefined ? item.bai_ha_tam_1_enabled : json.bai_ha_tam_1_enabled, 10) === 1;
      var temp2Enabled = parseInt(item.bai_ha_tam_2_enabled !== undefined ? item.bai_ha_tam_2_enabled : json.bai_ha_tam_2_enabled, 10) === 1;
      var raw = [
        { key: 'bai_lay', label: 'Bãi lấy', value: item.bai_lay_thuc_te || item.bai_lay_cont || '' },
        { key: 'bai_ha_tam_1', label: 'Bãi hạ tạm 1', value: temp1Enabled ? (item.bai_ha_tam_1 || json.bai_ha_tam_1 || '') : '' },
        { key: 'kho', label: 'Kho', value: item.dia_chi_kho || '' },
        { key: 'bai_ha_tam_2', label: 'Bãi hạ tạm 2', value: temp2Enabled ? (item.bai_ha_tam_2 || json.bai_ha_tam_2 || '') : '' },
        { key: 'bai_ha', label: 'Bãi hạ', value: item.bai_ha_thuc_te || item.bai_ha_cont || '' }
      ];
      var points = [];
      $.each(raw, function (_, point) {
        if (point.value) {
          point.index = points.length;
          points.push(point);
        }
      });
      return points;
    }

    function tuyenXaRouteSegments(item) {
      var points = tuyenXaRoutePoints(item);
      var segments = [];
      for (var i = 0; i + 1 < points.length; i++) {
        var key = points[i].key + '>' + points[i + 1].key;
        segments.push({ key: key, from_index: i, to_index: i + 1, from: points[i].value, to: points[i + 1].value });
      }
      return segments;
    }

    function refreshTuyenXaRouteDerivedUi($card, line, preferredPointKey) {
      if (!$card || !$card.length || !line) return;
      var $scrollContainer = $card.closest('.modal-body');
      var scrollTop = $scrollContainer.length ? $scrollContainer.scrollTop() : 0;
      var points = tuyenXaRoutePoints(line);
      var selectedIndex = parseInt(line.vi_tri_cont_index_hien_tai, 10);
      if (preferredPointKey) {
        $.each(points, function (_, point) {
          if (point.key === preferredPointKey) selectedIndex = point.index;
        });
      }
      if (isNaN(selectedIndex) || !points[selectedIndex]) selectedIndex = points.length ? 0 : -1;
      line.vi_tri_cont_index_hien_tai = selectedIndex;
      line.vi_tri_cont_hien_tai = selectedIndex >= 0 && points[selectedIndex] ? points[selectedIndex].value : '';

      var $location = $card.find('.line-vi-tri-cont-select');
      if ($location.length) {
        if ($location.data('select2')) $location.select2('destroy');
        $location.html(routePointOptions(points, selectedIndex, 0));
        initSelect2($location[0], '— Chọn vị trí thực tế của cont —');
      }
      renderSelectedContRef($card, line);
      updateTuyenXaSidebar();
      if ($scrollContainer.length) $scrollContainer.scrollTop(scrollTop);
    }

    function routePointOptions(points, selected, minIndex, maxIndex) {
      var html = '';
      $.each(points, function (_, point) {
        if (minIndex !== undefined && point.index < minIndex) return;
        if (maxIndex !== undefined && point.index > maxIndex) return;
        html += '<option value="' + point.index + '"' + (parseInt(selected, 10) === point.index ? ' selected' : '') + '>' + escHtml(point.label + ': ' + point.value) + '</option>';
      });
      return html;
    }

    function contReservedSegmentMap(item, excludePlanNid) {
      var reserved = {};
      var itemJson = (item && item.thong_tin_json) || {};
      var itemRole = itemJson.vai_tro_ke_hoach || (parseInt(item && item.ke_hoach_cont_ref_nid, 10) ? 'thuc_hien_chang' : 'ke_hoach_goc');
      if (itemRole === 'ke_hoach_goc' && !optionEnabled(itemJson.cong_viec_chinh_hoan_thanh)) {
        var implicitEnd = rootInitialEndIndex(item);
        for (var implicitIndex = 0; implicitIndex < implicitEnd; implicitIndex++) {
          reserved[implicitIndex] = { nid: parseInt(item && item.nid, 10) || 0, implicit: true };
        }
      }
      $.each((item && item.cont_chang_da_nhan) || [], function (_, assignment) {
        if ((parseInt(assignment.nid, 10) || 0) === (parseInt(excludePlanNid, 10) || 0)) return;
        var start = parseInt(assignment.tu_index, 10);
        var end = parseInt(assignment.den_index, 10);
        for (var i = start; i < end; i++) reserved[i] = assignment;
      });
      return reserved;
    }

    function rootInitialEndIndex(item) {
      var points = tuyenXaRoutePoints(item);
      if (points.length < 2) return 0;
      var khoIndex = -1;
      $.each(points, function (_, point) {
        if (point.key === 'kho') khoIndex = point.index;
      });
      if (khoIndex < 0) return 1;
      if (normalizeHinhThuc(item && item.hinh_thuc_van_tai) === 'dong_hang') {
        return Math.min(points.length - 1, khoIndex + 1);
      }
      var json = (item && item.thong_tin_json) || {};
      return optionEnabled(json.bai_ha_tam_1_enabled) && json.bai_ha_tam_1 ? 1 : khoIndex;
    }

    function contAvailableStartIndexes(item, currentIndex, excludePlanNid) {
      var segments = tuyenXaRouteSegments(item);
      var reserved = contReservedSegmentMap(item, excludePlanNid);
      var indexes = [];
      for (var i = Math.max(0, currentIndex); i < segments.length; i++) {
        if (!reserved[i]) indexes.push(i);
      }
      return indexes;
    }

    function indexedRoutePointOptions(points, indexes, selected) {
      var html = '';
      $.each(indexes, function (_, index) {
        if (!points[index]) return;
        html += '<option value="' + index + '"' + (parseInt(selected, 10) === index ? ' selected' : '') + '>' + escHtml(points[index].label + ': ' + points[index].value) + '</option>';
      });
      return html;
    }

    function maxAvailableEndIndex(item, start, excludePlanNid) {
      var reserved = contReservedSegmentMap(item, excludePlanNid);
      var segmentCount = tuyenXaRouteSegments(item).length;
      var end = start;
      while (end < segmentCount && !reserved[end]) end++;
      return end;
    }

    function contServiceRouteText(item, line) {
      var points = tuyenXaRoutePoints(item);
      var start = parseInt(line && line.cont_thuc_hien_tu_index, 10);
      var end = parseInt(line && line.cont_thuc_hien_den_index, 10);
      if (start >= 0 && end > start && points[start] && points[end]) {
        return $.map(points.slice(start, end + 1), function (point) { return point.value; }).join(' → ');
      }
      return '';
    }

    function contCurrentPointIndex(item) {
      var points = tuyenXaRoutePoints(item);
      if (!points.length) return -1;
      var json = (item && item.thong_tin_json) || {};
      var savedIndex = parseInt(item && item.vi_tri_cont_index_hien_tai !== undefined ? item.vi_tri_cont_index_hien_tai : json.vi_tri_cont_index_hien_tai, 10);
      if (!isNaN(savedIndex) && points[savedIndex]) return savedIndex;
      var location = json.vi_tri_cont_hien_tai || item.bai_ha_thuc_te || '';
      var matches = [];
      if (location) {
        $.each(points, function (_, point) { if (point.value === location) matches.push(point.index); });
      }
      if (matches.length) return parseInt(item.da_du_hang, 10) === 1 ? matches[matches.length - 1] : matches[0];
      return 0;
    }

    function contCurrentLocation(item) {
      if (!item) return '';
      var json = item.thong_tin_json || {};
      var points = tuyenXaRoutePoints(item);
      var pointIndex = contCurrentPointIndex(item);
      if (pointIndex >= 0 && points[pointIndex]) return points[pointIndex].value;
      if (json.vi_tri_cont_hien_tai) return json.vi_tri_cont_hien_tai;
      if (item.bai_ha_thuc_te) return item.bai_ha_thuc_te;
      if (item.trang_thai_van_chuyen === 'Hoàn thành') return item.bai_ha_cont || json.bai_ha_tam_2 || json.bai_ha_tam_1 || item.dia_chi_kho || '';
      if (parseInt(item.da_du_hang, 10) === 1) return item.dia_chi_kho || json.bai_ha_tam_2 || json.bai_ha_tam_1 || item.bai_ha_cont || '';
      if (parseInt(json.bai_ha_tam_1_enabled, 10) === 1 && json.bai_ha_tam_1) return json.bai_ha_tam_1;
      return item.dia_chi_kho || item.bai_ha_thuc_te || item.bai_ha_cont || item.bai_lay_thuc_te || item.bai_lay_cont || '';
    }

    function contNextLocation(item) {
      if (!item) return '';
      var points = $.map(tuyenXaRoutePoints(item), function (point) { return point.value; });
      var index = contCurrentPointIndex(item);
      return index >= 0 && index + 1 < points.length ? points[index + 1] : '';
    }

    function renderSelectedContRef($card, line) {
      var $section = $form('#khxh-return-cont-' + line.key);
      var applicable = sourcePickerApplicable(line);
      var isPortCreate = currentPlanType() !== 'tuyen_xa' && mode !== 'edit';
      if (!$section.length && isPortCreate) {
        $section = $card.find('.khxh-port-create-cont-picker');
      }
      if (!$section.length) return;
      if (isPortCreate) {
        var $replacement = $(portCreateReturnMarkup(line));
        $section.attr('class', $replacement.attr('class')).html($replacement.html());
      }
      var $content = $section.find('.khxh-cont-ref-content');
      if (!$content.length && isPortCreate) $content = $section;
      if (!isPortCreate) $content.html(selectedContSummaryHtml(line.cont_ref || null, line));
      $section.find('.khxh-cont-ref-section-status')
        .text(line.cont_ref && line.ke_hoach_cont_ref_nid ? 'Đã chọn 1' : 'Chưa chọn')
        .toggleClass('is-selected', !!(line.cont_ref && line.ke_hoach_cont_ref_nid));
      $section.toggleClass('is-disabled', !applicable).toggleClass('d-none', !applicable);
      $section.find('.btn-open-cont-ref-modal').prop('disabled', !sourcePickerEditable(line));
      $form('.khxh-section-nav[data-line-key="' + line.key + '"] .khxh-section-nav-item[data-target="#khxh-return-cont-' + line.key + '"]').toggleClass('d-none', !applicable);
    }

    function portCreateSelectedContHtml(line) {
      var item = line && line.cont_ref ? line.cont_ref : {};
      var selected = !!(line && line.ke_hoach_cont_ref_nid);
      var mooc = item.bks_mooc || item.so_mooc || item.mooc || '';
      var baiHa = item.bai_ha_cont || item.bai_ha || '';
      var key = line && line.key ? line.key : '';
      return '<div class="khxh-port-create-flex-row"><div class="pc-field-cont-label khxh-port-create-return-label"><span><i class="ti tabler-arrow-down me-1"></i>Cont kéo về</span><button type="button" class="btn btn-sm btn-icon btn-label-danger btn-remove-cont-ref" data-line-key="' + escHtml(key) + '" title="Bỏ cont"><i class="ti tabler-x"></i></button></div><div class="pc-field-mooc"><label class="form-label">Số mooc</label><input class="form-control" value="' + escHtml(selected ? mooc : '') + '" disabled></div><div class="pc-field-container"><label class="form-label">Số cont</label><input class="form-control" value="' + escHtml(selected ? (item.so_cont || '') : '') + '" disabled></div><div class="pc-field-seal"><label class="form-label">Seal chính</label><input class="form-control" value="' + escHtml(selected ? (item.so_seal_chinh || '') : '') + '" disabled></div><div class="pc-field-options"><label class="form-label">Seal phụ</label><input class="form-control" value="' + escHtml(selected ? (item.so_seal_tam || '') : '') + '" disabled></div><div class="pc-field-yard"><label class="form-label">Bãi hạ dự kiến</label><input class="form-control" value="' + escHtml(selected ? baiHa : '') + '" disabled></div><div class="pc-field-note"><label class="form-label">Ghi chú</label><input class="form-control" value="' + escHtml(selected ? (item.ghi_chu || '') : '') + '" disabled></div></div>';
    }

	    function updateContRefButton($row, line) {
	      var $btn = $row.find('.btn-open-cont-ref-modal');
	      if (!$btn.length) return;
	      var applicable = sourcePickerApplicable(line);
	      var enabled = sourcePickerEditable(line);
	      $btn
	        .prop('disabled', !enabled)
	        .attr('aria-disabled', enabled ? 'false' : 'true')
	        .toggleClass('disabled', !enabled)
	        .toggleClass('is-selected', !!(applicable && line && line.ke_hoach_cont_ref_nid))
	        .html('<span class="vehicle-inline-text">' + escHtml(applicable ? contRefButtonText(line) : 'Không áp dụng') + '</span>');
	    }

	    function getContPicker($card) {
	      var key = $card && $card.length ? $card.data('line-key') : '';
	      var pickerSelector = contPickerWrapSelector();
	      if (useTableLayout) {
	        var $modalPicker = $formOrPage(pickerSelector);
	        if ($modalPicker.length && (!key || String($modalPicker.attr('data-line-key') || '') === String(key))) {
	          return $modalPicker;
	        }
	      }
      var $picker = $formOrPage(pickerSelector);
      return $picker.length ? $picker : $card.find('.line-cont-picker-wrap');
	    }

    // Modal chọn cont của hàng cảng được tách hoàn toàn khỏi modal tuyến xa.
    // Chỉ create hàng cảng dùng modal mới ở bước này; các màn cũ vẫn dùng
    // selector cũ nên không bị thay đổi hành vi.
    function usePortContPickerModal() {
      return currentPlanType() !== 'tuyen_xa' && mode !== 'edit' && $formOrPage('#port-cont-ref-picker-modal').length > 0;
    }

    function contPickerModalSelector() {
      return usePortContPickerModal() ? '#port-cont-ref-picker-modal' : '#cont-ref-picker-modal';
    }

    function contPickerWrapSelector() {
      return usePortContPickerModal() ? '#port-cont-ref-picker-wrap' : '#cont-ref-picker-wrap';
    }

    function contPickerConfirmSelector() {
      return usePortContPickerModal() ? '#port-cont-ref-picker-confirm-btn' : '#cont-ref-picker-confirm-btn';
    }

    function renderContPickerLoading($card, message) {
      var $wrap = getContPicker($card);
      var $body = $wrap.find('.line-cont-picker-body');
      $wrap.addClass('is-loading');
      $body.html(
        '<div class="text-center py-4">' +
            '<div class="cont-picker-loading">' +
              '<div class="spinner-border spinner-border-sm text-primary" role="status">' +
                '<span class="visually-hidden">Đang tải...</span>' +
              '</div>' +
              '<span>' + escHtml(message || 'Đang tải danh sách cont...') + '</span>' +
            '</div>' +
        '</div>'
      );
    }

    function clearContPickerLoading($card) {
      getContPicker($card).removeClass('is-loading');
    }

    function invalidateContCandidateCache() {
      state.contCandidateCache = {};
      window.keHoachXepXeContCandidateVersion = (parseInt(window.keHoachXepXeContCandidateVersion, 10) || 0) + 1;
    }

	    function loadContCandidates(line, $card) {
	      var hinhThuc = line.hinh_thuc_van_tai || '';
      var $wrap = getContPicker($card);
      var $body = $wrap.find('.line-cont-picker-body');
	      if ((activeContPickerMode === 'source' && !sourcePickerEditable(line)) || (activeContPickerMode === 'return' && !returnContApplicable(line))) {
        clearContPickerLoading($card);
        $wrap.hide();
        $body.html('<div class="text-center text-muted py-4">Không áp dụng cho hình thức này</div>');
        return;
      }
      $wrap.show();
      var currentNid = parseInt($form('#nid-input').val(), 10) || 0;
      var cacheVersion = parseInt(window.keHoachXepXeContCandidateVersion, 10) || 0;
      var cacheKey = [cacheVersion, currentPlanType(), hinhThuc, line.dia_chi_kho || '', currentNid].join('||');
      if (state.contCandidateCache[cacheKey]) {
        clearContPickerLoading($card);
        $card.data('contCandidates', state.contCandidateCache[cacheKey]);
        $card.data('contCandidatesCacheKey', cacheKey);
        $card.data('contCandidatesLoaded', true);
        renderContCandidateRows(line, $card);
        return;
      }
      if (state.contCandidatePending[cacheKey]) {
        renderContPickerLoading($card, 'Đang tải danh sách cont...');
        state.contCandidatePending[cacheKey].push($card);
        return;
      }
      var requestData = {
        loai_ke_hoach: currentPlanType(),
        available_keo_ve_for: currentNid
      };
      if (currentPlanType() !== 'tuyen_xa') requestData.da_cat_mooc = 1;
      if (currentNid) {
        requestData.exclude_nid = currentNid;
      }
      if (hinhThuc === 'cat_keo' && currentPlanType() !== 'tuyen_xa') {
        requestData.dia_chi_kho = line.dia_chi_kho || '';
      }
      renderContPickerLoading($card, 'Đang tải danh sách cont...');
      state.contCandidatePending[cacheKey] = [$card];
      $.ajax({
        url: '/api/quan-ly-cont',
        type: 'GET',
        dataType: 'json',
        data: requestData,
        success: function (res) {
          var waitingCards = state.contCandidatePending[cacheKey] || [];
          if (res.status !== 'success' || !res.data || !res.data.items) {
            for (var i = 0; i < waitingCards.length; i++) {
              clearContPickerLoading(waitingCards[i]);
              getContPicker(waitingCards[i]).find('.line-cont-picker-body').html('<div class="text-center text-danger py-4">Không tải được danh sách cont</div>');
            }
            return;
          }
          state.contCandidateCache[cacheKey] = res.data.items || [];
          for (var j = 0; j < waitingCards.length; j++) {
            var $waitingCard = waitingCards[j];
            var waitingLine = syncLine($waitingCard);
            clearContPickerLoading($waitingCard);
            $waitingCard.data('contCandidates', res.data.items || []);
            $waitingCard.data('contCandidatesCacheKey', cacheKey);
            $waitingCard.data('contCandidatesLoaded', true);
            renderContCandidateRows(waitingLine, $waitingCard);
          }
        },
        error: function () {
          var waitingCards = state.contCandidatePending[cacheKey] || [];
          for (var i = 0; i < waitingCards.length; i++) {
            clearContPickerLoading(waitingCards[i]);
            getContPicker(waitingCards[i]).find('.line-cont-picker-body').html('<div class="text-center text-danger py-4">Không tải được danh sách cont</div>');
          }
        },
        complete: function () {
          delete state.contCandidatePending[cacheKey];
        }
	      });
	    }

	    function openContRefModal(key, pickerMode) {
	      var $row = getLineElementByKey(key);
	      if (!$row.length) {
          return;
        }
	      var line = syncLine($row);
	      if (!line) {
          return;
        }
	      pickerMode = pickerMode === 'return' ? 'return' : 'source';
	      if (pickerMode === 'source' && !sourcePickerEditable(line)) {
	        if (notyf) notyf.error(currentPlanType() === 'tuyen_xa' && optionEnabled(line.cong_viec_chinh_hoan_thanh) ? 'Công việc chính đã hoàn thành, không thể đổi kế hoạch nguồn' : (currentPlanType() === 'tuyen_xa' ? 'Chỉ kế hoạch thực hiện chặng mới chọn kế hoạch nguồn' : 'Vui lòng chọn hình thức vận tải trước'));
	        return;
	      }
	      if (pickerMode === 'return' && !returnContApplicable(line)) {
	        if (notyf) notyf.error('Hình thức vận tải này không áp dụng cont kéo về');
	        return;
	      }
	      activeContPickerLineKey = key;
	      activeContPickerMode = pickerMode;
	      var pickerModalSelector = contPickerModalSelector();
	      var pickerWrapSelector = contPickerWrapSelector();
	      $formOrPage(pickerModalSelector + ' .modal-title').text(pickerMode === 'return' ? 'Chọn cont kéo về' : (currentPlanType() === 'tuyen_xa' ? 'Chọn kế hoạch gốc và dải chặng' : 'Chọn cont kéo về'));
	      var $wrap = $formOrPage(pickerWrapSelector);
	      if (!$wrap.length) {
	        if (notyf) notyf.error('Không tìm thấy modal chọn kế hoạch / cont');
	        return;
	      }
      $wrap.attr('data-line-key', key);
      var currentSelection = pickerMode === 'return' ? lineKetHop(line) : line;
      var savedContId = parseInt(currentSelection.ke_hoach_cont_ref_nid, 10) || 0;
      $wrap.data('saved-cont-id', savedContId);
      $wrap.data('pending-cont-id', savedContId);
      $wrap.data('pending-cont-start', parseInt(currentSelection.cont_thuc_hien_tu_index, 10));
      $wrap.data('pending-cont-end', parseInt(currentSelection.cont_thuc_hien_den_index, 10));
      $wrap.data('pending-cont-kiem-dich', line.cont_keo_ve_kiem_dich ? 1 : 0);
      $wrap.data('pending-cont-kiem-hoa', line.cont_keo_ve_kiem_hoa ? 1 : 0);
      $wrap.data('pending-cont-hun-trung', line.cont_keo_ve_hun_trung ? 1 : 0);
      $wrap.data('pending-cont-seal-phu', line.cont_keo_ve_seal_phu ? 1 : 0);
	      $wrap.find('.line-cont-filter-bkg, .line-cont-filter-cont').val('');
	      var $filterKho = $wrap.find('.line-cont-filter-kho');
	      if ($filterKho.data('select2')) $filterKho.select2('destroy');
	      $filterKho.html(buildTagOptions((state.diaDiem.bai || []).concat(state.diaDiem.kho || []), ''));
      $wrap.find('.line-cont-filter-du-hang').val('');
	      var modalEl = $formOrPage(pickerModalSelector)[0];
	      if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) {
	        if (notyf) notyf.error('Không khởi tạo được modal chọn kế hoạch / cont');
	        return;
	      }
      if (modalEl.parentNode !== document.body) {
	        var placeholder = document.createComment('cont-ref-picker-placeholder');
	        modalEl.parentNode.insertBefore(placeholder, modalEl);
	        modalEl.__contRefPickerPlaceholder = placeholder;
        document.body.appendChild(modalEl);
      }
      $(modalEl).toggleClass('is-port-cont-picker', currentPlanType() !== 'tuyen_xa');
      if (!contRefModal || contRefModal._element !== modalEl) {
        var contRefModalOptions = { backdrop: true, keyboard: true, focus: true };
        contRefModal = bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl, contRefModalOptions) : new bootstrap.Modal(modalEl, contRefModalOptions);
      }
	      contRefModal.show();
	      loadContCandidates(line, $row);
	    }

    function renderContCandidateRows(line, $card) {
      var hinhThuc = line.hinh_thuc_van_tai || '';
      var $picker = getContPicker($card);
      var $body = $picker.find('.line-cont-picker-body');
      var scrollTop = $picker.scrollTop();
      var bodyScrollTop = $formApp.closest('.modal-body').scrollTop();
      clearContPickerLoading($card);
      var items = $card.data('contCandidates') || [];
      var fBkg = ($picker.find('.line-cont-filter-bkg').val() || '').toLowerCase();
      var fCont = ($picker.find('.line-cont-filter-cont').val() || '').toLowerCase();
      var fKho = ($picker.find('.line-cont-filter-kho').val() || '').toLowerCase();
      var fDuHang = $picker.find('.line-cont-filter-du-hang').val();
      var isPortContPicker = currentPlanType() !== 'tuyen_xa';
      var rows = [];
      var candidates = [];
      var currentNid = parseInt($form('#nid-input').val(), 10) || 0;
      var pendingContId = parseInt($picker.data('pending-cont-id'), 10) || 0;
      // Chỉ cont đã được lưu trước khi mở modal được ghim đầu danh sách.
      // Cont vừa click là lựa chọn tạm nên giữ nguyên thứ tự dữ liệu ban đầu.
      var savedContId = parseInt($picker.data('saved-cont-id'), 10) || 0;
      var requiredReturnStart = activeContPickerMode === 'return' ? mainWorkEndLocation(line) : '';
      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var isPendingSelection = pendingContId === (parseInt(item.nid, 10) || 0);
        var isSavedSelection = savedContId === (parseInt(item.nid, 10) || 0);
        var isPinnedSelection = isPendingSelection || isSavedSelection;
        // Cont đã được chọn luôn phải được hiển thị lại khi mở modal để người
        // dùng biết trạng thái hiện tại, kể cả khi dữ liệu cũ không còn khớp
        // toàn bộ bộ lọc của hình thức vận tải.
        if (currentPlanType() !== 'tuyen_xa' && parseInt(item.da_cat_mooc, 10) !== 1 && !isPinnedSelection) continue;
        if (currentPlanType() === 'tuyen_xa') {
          if (!tuyenXaRouteSegments(item).length) continue;
          var candidateJson = item.thong_tin_json || {};
          var candidateRole = candidateJson.vai_tro_ke_hoach || (parseInt(item.ke_hoach_cont_ref_nid, 10) ? 'thuc_hien_chang' : 'ke_hoach_goc');
          if (candidateRole !== 'ke_hoach_goc') continue;
        }
        if ((parseInt(item.nid, 10) || 0) === currentNid) continue;
        if (activeContPickerMode === 'return' && (parseInt(item.nid, 10) || 0) === (parseInt(line.ke_hoach_cont_ref_nid, 10) || 0)) continue;
        if (currentPlanType() !== 'tuyen_xa' && hinhThuc === 'cat_keo' && item.dia_chi_kho !== line.dia_chi_kho && !isPinnedSelection) continue;
        if (currentPlanType() !== 'tuyen_xa' && hinhThuc === 'cat_keo_cheo' && item.dia_chi_kho === line.dia_chi_kho && !isPinnedSelection) continue;
        if (fBkg && String(item.so_bkg || '').toLowerCase().indexOf(fBkg) === -1) continue;
        if (fCont && String(item.so_cont || '').toLowerCase().indexOf(fCont) === -1) continue;
        var currentLocation = contCurrentLocation(item);
        if (fKho && String(currentLocation).toLowerCase().indexOf(fKho) === -1) continue;
        if (fDuHang !== '' && parseInt(item.da_du_hang, 10) !== parseInt(fDuHang, 10)) continue;
        var selected = pendingContId === parseInt(item.nid, 10);
	        var selectedByOtherLine = false;
	        for (var lineIndex = 0; lineIndex < state.lines.length; lineIndex++) {
	          var otherLine = state.lines[lineIndex];
	          if (!otherLine || otherLine.key === line.key) continue;
	          if ((parseInt(otherLine.ke_hoach_cont_ref_nid, 10) || 0) === (parseInt(item.nid, 10) || 0)) {
	            selectedByOtherLine = true;
	            break;
	          }
	        }
        if (selectedByOtherLine && currentPlanType() !== 'tuyen_xa' && !selected) continue;
	        var usedBy = item.cont_keo_ve_by || null;
        var usedByNid = usedBy && usedBy.nid ? (parseInt(usedBy.nid, 10) || 0) : 0;
        if (currentPlanType() !== 'tuyen_xa' && !selected && usedByNid && usedByNid !== currentNid) continue;
	        var candidateCurrentIndex = contCurrentPointIndex(item);
	        var selectedTaskDone = activeContPickerMode === 'return' ? optionEnabled(lineKetHop(line).hoan_thanh) : optionEnabled(line.cong_viec_chinh_hoan_thanh);
	        var availableStarts = contAvailableStartIndexes(item, selected && selectedTaskDone ? 0 : candidateCurrentIndex, currentNid);
	        if (requiredReturnStart) {
	          var candidatePointsForStart = tuyenXaRoutePoints(item);
	          availableStarts = $.grep(availableStarts, function (index) {
	            return candidatePointsForStart[index] && candidatePointsForStart[index].value === requiredReturnStart;
	          });
	        }
	        var hasAvailableSegment = availableStarts.length > 0;
	        if (currentPlanType() === 'tuyen_xa' && !hasAvailableSegment && !selected) continue;
        candidates.push({ item: item, selected: selected, saved: isSavedSelection, canSelect: true, disabledReason: '' });
      }
      candidates.sort(function (a, b) {
        if (a.saved && !b.saved) return -1;
        if (!a.saved && b.saved) return 1;
        return (parseInt(b.item.nid, 10) || 0) - (parseInt(a.item.nid, 10) || 0);
      });
      for (var c = 0; c < candidates.length; c++) {
        var item = candidates[c].item;
        var currentLocation = contCurrentLocation(item);
        var selected = candidates[c].selected;
        var canSelect = candidates[c].canSelect || selected;
        var plannedBaiHa = item.bai_ha_cont || '';
        var actualBaiHa = normalizeBaiHaThucTe(item.bai_ha_thuc_te || '', plannedBaiHa);
        var destinationValue = actualBaiHa || plannedBaiHa;
        var theoKeHoach = !actualBaiHa;
        var duHang = parseInt(item.da_du_hang, 10) === 1;
        var portRequirementsHtml = '';
        if (isPortContPicker) {
          // Chỉ cont bị khóa nghiệp vụ mới không thao tác được; cont hợp lệ
          // không cần chọn radio trước mới tick các yêu cầu.
          var requirementDisabled = canSelect ? '' : ' disabled';
          portRequirementsHtml = '<div class="cont-picker-cell cont-picker-port-requirements">' +
            '<label class="form-check form-check-inline mb-0"><input type="checkbox" class="form-check-input line-cont-return-requirement" data-id="' + item.nid + '" data-requirement="kiem-dich"' + (selected && $picker.data('pending-cont-kiem-dich') ? ' checked' : '') + requirementDisabled + '><span class="form-check-label">Kiểm dịch</span></label>' +
            '<label class="form-check form-check-inline mb-0"><input type="checkbox" class="form-check-input line-cont-return-requirement" data-id="' + item.nid + '" data-requirement="kiem-hoa"' + (selected && $picker.data('pending-cont-kiem-hoa') ? ' checked' : '') + requirementDisabled + '><span class="form-check-label">Kiểm hoá</span></label>' +
            '<label class="form-check form-check-inline mb-0"><input type="checkbox" class="form-check-input line-cont-return-requirement" data-id="' + item.nid + '" data-requirement="hun-trung"' + (selected && $picker.data('pending-cont-hun-trung') ? ' checked' : '') + requirementDisabled + '><span class="form-check-label">Hun trùng</span></label>' +
          '</div>';
        }
        var khachHangName = customerPlanLabel(item.khach_hang) || item.ma_kh || item.ten_khach_hang || item.khach_hang_ten || '';
        var dauKeo = (item.phuong_tien && (item.phuong_tien.bks || item.phuong_tien.bien_so)) || item.bks_dau_keo || '';
        var mooc = (item.mooc && (item.mooc.bks || item.mooc.bien_so)) || item.bks_mooc || '';
        var laiXe = (item.lai_xe && item.lai_xe.ten) || item.ten_lai_xe || '';
        var generalTooltip = 'Khách hàng: ' + (khachHangName || '—') + ' | Đầu kéo: ' + (dauKeo || '—') + ' | Mooc: ' + (mooc || '—') + ' | Lái xe: ' + (laiXe || '—');
        var txPoints = tuyenXaRoutePoints(item);
        var txCurrentIndex = contCurrentPointIndex(item);
        if (txCurrentIndex < 0 || txCurrentIndex >= txPoints.length) txCurrentIndex = 0;
        var txAvailableStarts = contAvailableStartIndexes(item, selected && selectedTaskDone ? 0 : txCurrentIndex, currentNid);
        if (requiredReturnStart) {
          txAvailableStarts = $.grep(txAvailableStarts, function (index) {
            return txPoints[index] && txPoints[index].value === requiredReturnStart;
          });
        }
        var txStart = selected ? parseInt($picker.data('pending-cont-start'), 10) : txCurrentIndex;
        if (isNaN(txStart) || txAvailableStarts.indexOf(txStart) === -1) txStart = txAvailableStarts.length ? txAvailableStarts[0] : txCurrentIndex;
        var txMaxEnd = maxAvailableEndIndex(item, txStart, currentNid);
        if (activeContPickerMode === 'source') {
          txMaxEnd = Math.min(txMaxEnd, txStart + ((txPoints[txStart + 1] && txPoints[txStart + 1].key === 'kho') ? 2 : 1));
        }
        var txEnd = selected ? parseInt($picker.data('pending-cont-end'), 10) : (txStart + 1);
        if (isNaN(txEnd) || txEnd <= txStart || txEnd > txMaxEnd) txEnd = txStart + 1;
        if (selected) {
          $picker.data('pending-cont-start', txStart);
          $picker.data('pending-cont-end', txEnd);
        }
        var txRangeHtml = '<div class="cont-picker-range-selects"><select class="form-select form-select-sm line-cont-route-start" data-id="' + item.nid + '">' + indexedRoutePointOptions(txPoints, txAvailableStarts, txStart) + '</select><i class="ti tabler-arrow-right"></i><select class="form-select form-select-sm line-cont-route-end" data-id="' + item.nid + '">' + routePointOptions(txPoints, txEnd, txStart + 1, txMaxEnd) + '</select></div>';
        rows.push('<div class="cont-picker-row' + (currentPlanType() === 'tuyen_xa' ? ' is-tuyen-xa' : '') + (selected ? ' is-selected' : '') + (canSelect ? '' : ' is-disabled') + '" title="' + escHtml(canSelect ? generalTooltip : candidates[c].disabledReason) + '">' +
          '<div class="cont-picker-radio"><input class="form-check-input line-cont-ref-checkbox" type="radio" name="cont-ref-' + escHtml(line.key) + '" value="' + item.nid + '" data-id="' + item.nid + '" data-so-bkg="' + escHtml(item.so_bkg || '') + '" data-so-cont="' + escHtml(item.so_cont || '') + '"' + (selected ? ' checked' : '') + (canSelect ? '' : ' disabled') + '></div>' +
          '<div class="cont-picker-cell"><div class="cont-picker-primary"><span class="cont-picker-cont mono">' + escHtml(item.so_cont || ('#' + item.nid)) + '</span><span class="badge bg-label-secondary">' + escHtml(item.loai_cont || '—') + '</span></div><div class="text-muted small">' + (currentPlanType() === 'tuyen_xa' ? 'Kế hoạch cont #' + escHtml(item.nid || '') : 'Bkg: ' + escHtml(item.so_bkg || '—')) + '</div></div>' +
          '<div class="cont-picker-cell"><div class="fw-semibold">' + escHtml(currentLocation || '—') + '</div><div class="text-muted small">Vị trí cont hiện tại</div></div>' +
          (currentPlanType() === 'tuyen_xa'
            ? '<div class="cont-picker-cell">' + (selected ? txRangeHtml : '<div class="fw-semibold">' + escHtml($.map(txPoints.slice(txCurrentIndex), function (point) { return point.value; }).join(' → ') || '—') + '</div><div class="text-muted small">Lộ trình còn lại</div>') + '</div>'
            : '<div class="cont-picker-cell cont-picker-destination-cell">' +
                '<label class="form-check form-check-inline mb-1">' +
                  '<input class="form-check-input line-bai-ha-theo-ke-hoach-checkbox" type="checkbox" data-id="' + item.nid + '"' + (theoKeHoach ? ' checked' : '') + '>' +
                  '<span class="form-check-label small">Hạ theo booking</span>' +
                '</label>' +
                '<select class="form-select form-select-sm line-bai-ha-thuc-te-select" data-id="' + item.nid + '" data-planned="' + escHtml(plannedBaiHa) + '">' + buildTagOptions(state.diaDiem.bai, destinationValue) + '</select>' +
              '</div>') +
          (currentPlanType() === 'tuyen_xa' ? '' : '<div class="cont-picker-cell"><div class="fw-semibold mb-1">' + escHtml(item.so_seal_chinh || '—') + '</div><label class="form-check form-check-inline mb-0"><input type="checkbox" class="form-check-input line-cont-return-seal-phu" data-id="' + item.nid + '"' + (selected && $picker.data('pending-cont-seal-phu') ? ' checked' : '') + (canSelect ? '' : ' disabled') + '><span class="form-check-label small">Seal phụ</span></label></div>') +
          portRequirementsHtml +
          '<div class="cont-picker-cell cont-picker-state"><span class="cont-picker-status ' + (duHang ? 'is-ready' : 'is-waiting') + '" title="' + (duHang ? 'Đã đủ hàng' : 'Chưa đủ hàng') + '"><i class="ti ' + (duHang ? 'tabler-circle-check' : 'tabler-clock') + '"></i></span><small class="d-block text-muted">' + (duHang ? 'Đã đủ' : 'Chưa đủ') + '</small></div>' +
          '<div class="cont-picker-cell"><input type="text" class="form-control form-control-sm cont-inline-note" data-id="' + item.nid + '" value="' + escHtml(item.ghi_chu || '') + '" placeholder="Ghi chú"></div>' +
        '</div>');
      }
      $body.html(rows.length ? rows.join('') : '<div class="text-center text-muted py-4">Không có cont phù hợp</div>');
	      var pickerDropdownParent = $picker.closest('.modal').length ? $picker.closest('.modal') : formDropdownParent();
	      $body.find('.line-bai-ha-thuc-te-select').each(function () {
	        initSelect2(this, '— Chọn bãi hạ —', { tags: true, allowClear: false, dropdownParent: pickerDropdownParent });
	      });
      $picker.find('.line-cont-filter-kho').each(function () {
        if (!$(this).data('select2')) {
          initSelect2(this, '— Tìm theo vị trí cont —', { allowClear: true, width: '100%', dropdownParent: pickerDropdownParent });
        }
      });
      $picker.scrollTop(scrollTop);
      $formApp.closest('.modal-body').scrollTop(bodyScrollTop);
    }

    function findContCandidate($card, id) {
      var items = $card.data('contCandidates') || [];
      id = parseInt(id, 10) || 0;
      for (var i = 0; i < items.length; i++) {
        if ((parseInt(items[i].nid, 10) || 0) === id) return items[i];
      }
      return null;
    }

    function updateContCandidateItem($card, id, fields) {
      id = parseInt(id, 10) || 0;
      if (!id) return;
      var items = $card.data('contCandidates') || [];
      for (var i = 0; i < items.length; i++) {
        if ((parseInt(items[i].nid, 10) || 0) === id) {
          $.extend(items[i], fields);
          break;
        }
      }
      $card.data('contCandidates', items);
      var cacheKey = $card.data('contCandidatesCacheKey');
      var cached = cacheKey ? state.contCandidateCache[cacheKey] : null;
      if (cached) {
        for (var j = 0; j < cached.length; j++) {
          if ((parseInt(cached[j].nid, 10) || 0) === id) {
            $.extend(cached[j], fields);
            break;
          }
        }
      }
      for (var k = 0; k < state.lines.length; k++) {
        if ((parseInt(state.lines[k].ke_hoach_cont_ref_nid, 10) || 0) === id) {
          state.lines[k].cont_ref = state.lines[k].cont_ref || {};
          $.extend(state.lines[k].cont_ref, fields);
          renderSelectedContRef(getLineElementByKey(state.lines[k].key), state.lines[k]);
        }
      }
    }

    function setContDestinationSelectValue($select, value) {
      if (!$select || !$select.length) return;
      value = value || '';
      if (value && !$select.find('option').filter(function () { return $(this).val() === value; }).length) {
        $select.append('<option value="' + escHtml(value) + '">' + escHtml(value) + '</option>');
      }
      $select.val(value).trigger('change.select2');
    }

    function stageContBaiHaThucTe($card, contId, value) {
      contId = parseInt(contId, 10) || 0;
      if (!contId) return;
      state.pendingContDestinationUpdates[String(contId)] = value || '';
      updateContCandidateItem($card, contId, { bai_ha_thuc_te: value || '' });
      var $picker = getContPicker($card);
      var $select = $picker.find('.line-bai-ha-thuc-te-select[data-id="' + contId + '"]');
      var planned = ($select.attr('data-planned') || '').trim();
      var actual = normalizeBaiHaThucTe(value || '', planned);
      setContDestinationSelectValue($select, actual || planned);
      $select.closest('.cont-picker-destination-cell').find('.line-bai-ha-theo-ke-hoach-checkbox').prop('checked', !actual);
    }

    function flushPendingContDestinationUpdates() {
      var updates = $.extend({}, state.pendingContDestinationUpdates);
      var ids = Object.keys(updates);
      if (!ids.length) return $.Deferred().resolve().promise();

      var requests = $.map(ids, function (id) {
        var deferred = $.Deferred();
        $.ajax({
          url: '/api/quan-ly-cont/' + id,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({ bai_ha_thuc_te: updates[id] || '' }),
          dataType: 'json'
        }).done(function (res) {
          if (res && res.status === 'success') {
            deferred.resolve(res);
          } else {
            deferred.reject({ responseText: JSON.stringify(res || { message: 'Không cập nhật được bãi hạ thực tế' }) });
          }
        }).fail(function (jqXHR) {
          deferred.reject(jqXHR);
        });
        return deferred.promise();
      });

      return $.when.apply($, requests).then(function () {
        state.pendingContDestinationUpdates = {};
      });
    }

    function loadCauHinh(khId, callback) {
      state.cauHinh = {
        diaChiKho: (state.diaDiem && state.diaDiem.kho) ? state.diaDiem.kho.slice() : [],
        loaiHang: (state.diaDiem && Array.isArray(state.diaDiem.loaiHang)) ? state.diaDiem.loaiHang.slice() : [],
        loaiCont: ['20RF', '20DC', '40HC', '40RF', '40DC']
      };
      // Chọn khách hàng chỉ thay đổi nid_khach_hang của dòng hiện tại. Không
      // render lại toàn bộ các card sau khi chọn, vì việc thay DOM làm mất
      // scroll position của modal khi có nhiều dòng được nhân bản.
      if (callback) callback();
    }

    function reportPortCreateRequiredValidity() {
      if (currentPlanType() === 'tuyen_xa' || mode === 'edit') return true;
      var firstInvalid = null;
      $form('.khxh-port-create-section').each(function () {
        var $card = $(this);
        var fields = [
          { selector: '.line-customer-select', message: 'Vui lòng chọn khách hàng', select2: true },
          { selector: '.line-so-bkg-input', message: 'Vui lòng nhập số BKG', select2: false },
          { selector: '.line-kho-select', message: 'Vui lòng chọn địa chỉ kho', select2: true }
        ];
        $.each(fields, function (_, config) {
          var $field = $card.find(config.selector).first();
          if (!$field.length) return;
          var empty = !String($field.val() || '').trim();
          // Đây là thông điệp native validation của trình duyệt, không phải
          // title hover. Khi bấm Lưu, browser sẽ hiện đúng câu tiếng Việt này.
          $field[0].setCustomValidity(empty ? config.message : '');
          if (config.select2) setSelect2Invalid($field, empty);
          else $field.toggleClass('is-invalid', empty);
          if (empty && !firstInvalid) firstInvalid = $field[0];
        });
      });
      if (!firstInvalid) return true;
      if (typeof firstInvalid.reportValidity === 'function') firstInvalid.reportValidity();
      return false;
    }

    function validateForm() {
	      var ok = true;
	      var contRefSeen = {};
	      if (!useTableLayout) setSelect2Invalid($form('.line-customer-select'), false);
      syncAllLines();
      if (!state.lines.length) {
        if (notyf) notyf.error('Cần có ít nhất một dòng xe');
        return false;
      }
      var selector = useTableLayout ? '#ke-hoach-lines-body .ke-hoach-table-row' : '#ke-hoach-lines .ke-hoach-line-card';
      $form(selector).each(function () {
        var $row = $(this);
        var line = syncLine($row);
        if (useTableLayout) {
          $row.removeClass('table-danger');
          $row.find('.line-customer-feedback').hide();
          setSelect2Invalid($row.find('.line-customer-select'), false);
          $row.find('.line-so-bkg-input').removeClass('is-invalid');
	          setSelect2Invalid($row.find('.line-kho-select'), false);
	          setSelect2Invalid($row.find('.line-cang-select'), false);
	          $row.find('.btn-open-cont-ref-modal').removeClass('is-invalid');
        } else {
          $row.removeClass('line-card-invalid');
          $form('#so_bkg-input').removeClass('is-invalid');
          $row.find('.line-so-bkg-input').removeClass('is-invalid');
          setSelect2Invalid($row.find('.line-driver-select'), false);
          setSelect2Invalid($row.find('.line-kho-select'), false);
          setSelect2Invalid($row.find('.line-cang-select'), false);
          setSelect2Invalid($row.find('.line-bai-ha-tam-1-select'), false);
          setSelect2Invalid($row.find('.line-bai-ha-tam-2-select'), false);
          setSelect2Invalid($row.find('.line-bai-lay-select'), false);
          setSelect2Invalid($row.find('.line-bai-ha-select'), false);
          $row.find('.line-vehicle-feedback').hide();
        }
        // Modal tạo hàng cảng mới đặt Số BKG trong từng card, không còn
        // #so_bkg-input dùng chung. Dùng dữ liệu đã sync từ card để tránh
        // gọi trim() trên phần tử không tồn tại.
        if (currentPlanType() !== 'tuyen_xa' && !line.so_bkg) {
          ok = false;
          $row.find('.line-so-bkg-input').addClass('is-invalid');
        }
	        if (useTableLayout && !line.nid_khach_hang) {
	          ok = false;
	          $row.find('.line-customer-feedback').show();
	          setSelect2Invalid($row.find('.line-customer-select'), true);
	        }
	        if (!useTableLayout && !line.nid_khach_hang && !isExecutionPlan(line)) {
	          ok = false;
	          setSelect2Invalid($row.find('.line-customer-select'), true);
	        }
        if (line.ke_hoach_cont_ref_nid) {
	          var refKey = String(line.ke_hoach_cont_ref_nid);
	          var startIndex = parseInt(line.cont_thuc_hien_tu_index, 10);
	          var endIndex = parseInt(line.cont_thuc_hien_den_index, 10);
	          if (currentPlanType() === 'tuyen_xa' && isExecutionPlan(line)) {
	            if (isNaN(startIndex) || isNaN(endIndex) || startIndex < 0 || endIndex <= startIndex) {
	              ok = false;
	              $row.find('.btn-open-cont-ref-modal').addClass('is-invalid');
	              if (notyf) notyf.error('Vui lòng chọn đúng dải chặng công việc chính');
	            }
              var workLength = endIndex - startIndex;
              if (!isNaN(startIndex) && !isNaN(endIndex) && (!line.hinh_thuc_van_tai || (workLength === 2 && line.hinh_thuc_van_tai !== 'dong_hang') || (workLength === 1 && line.hinh_thuc_van_tai === 'dong_hang'))) {
                ok = false;
                $row.addClass('line-card-invalid');
                if (notyf) notyf.error('Vui lòng chọn hình thức vận tải phù hợp với công việc chính');
              }
	            var ranges = contRefSeen[refKey] || [];
	            $.each(ranges, function (_, range) {
	              if (startIndex < range.end && endIndex > range.start) {
	                ok = false;
	                $row.find('.btn-open-cont-ref-modal').addClass('is-invalid');
	                if (notyf) notyf.error('Dải chặng cont bị trùng với dòng #' + range.line);
	              }
	            });
	            ranges.push({ start: startIndex, end: endIndex, line: $row.index() + 1 });
	            contRefSeen[refKey] = ranges;
	          } else if (contRefSeen[refKey]) {
	            ok = false;
	            if (notyf) notyf.error('Cont kéo về bị chọn trùng ở dòng #' + contRefSeen[refKey] + ' và dòng #' + ($row.index() + 1));
	            $row.find('.btn-open-cont-ref-modal').addClass('is-invalid');
	          } else {
	            contRefSeen[refKey] = $row.index() + 1;
	          }
	        }
        if (currentPlanType() === 'tuyen_xa' && isExecutionPlan(line) && !line.ke_hoach_cont_ref_nid) {
          ok = false;
          $row.addClass('line-card-invalid');
          $form('#khxh-return-cont-' + line.key + ' .btn-open-cont-ref-modal').addClass('is-invalid');
          if (notyf) notyf.error('Vui lòng chọn kế hoạch gốc và dải chặng thực hiện');
        }
        if (currentPlanType() === 'tuyen_xa' && !isExecutionPlan(line) && !line.hinh_thuc_van_tai) {
          ok = false;
          $row.addClass('line-card-invalid');
          if (notyf) notyf.error('Vui lòng chọn hình thức vận tải cho kế hoạch gốc');
        }
        if (!line.dia_chi_kho) {
          ok = false;
          if (useTableLayout) {
            setSelect2Invalid($row.find('.line-kho-select'), true);
          } else {
            $row.addClass('line-card-invalid');
            setSelect2Invalid($row.find('.line-kho-select'), true);
          }
        }
        if (currentPlanType() === 'tuyen_xa' && !line.bai_lay_cont) {
          ok = false;
          $row.addClass('line-card-invalid');
          setSelect2Invalid($row.find('.line-bai-lay-select'), true);
        }
        if (currentPlanType() === 'tuyen_xa' && !line.bai_ha_cont) {
          ok = false;
          $row.addClass('line-card-invalid');
          setSelect2Invalid($row.find('.line-bai-ha-select'), true);
        }
        if (currentPlanType() === 'tuyen_xa' && isExecutionPlan(line) && line.ke_hoach_cont_ref_nid && (parseInt(line.cont_thuc_hien_tu_index, 10) < 0 || parseInt(line.cont_thuc_hien_den_index, 10) <= parseInt(line.cont_thuc_hien_tu_index, 10))) {
          ok = false;
          $row.addClass('line-card-invalid');
          if (notyf) notyf.error('Không xác định được dải chặng công việc chính, vui lòng chọn lại');
        }
        if (currentPlanType() === 'tuyen_xa') {
          var ketHop = lineKetHop(line);
          if (optionEnabled(ketHop.enabled)) {
            var returnStart = parseInt(ketHop.cont_thuc_hien_tu_index, 10);
            var returnEnd = parseInt(ketHop.cont_thuc_hien_den_index, 10);
            var returnPoints = ketHop.cont_ref ? tuyenXaRoutePoints(ketHop.cont_ref) : [];
            if (!ketHop.ke_hoach_cont_ref_nid || returnStart < 0 || returnEnd <= returnStart || !returnPoints[returnEnd] || !returnPoints[returnStart] || returnPoints[returnStart].value !== mainWorkEndLocation(line)) {
              ok = false;
              $row.addClass('line-card-invalid');
              if (notyf) notyf.error('Cont kéo về không còn khớp điểm kết thúc công việc chính, vui lòng chọn lại');
            }
          }
        }
        if (currentPlanType() === 'tuyen_xa' && line.bai_ha_tam_1_enabled && !line.bai_ha_tam_1) {
          ok = false;
          $row.addClass('line-card-invalid');
          setSelect2Invalid($row.find('.line-bai-ha-tam-1-select'), true);
        }
        if (currentPlanType() === 'tuyen_xa' && line.bai_ha_tam_2_enabled && !line.bai_ha_tam_2) {
          ok = false;
          $row.addClass('line-card-invalid');
          setSelect2Invalid($row.find('.line-bai-ha-tam-2-select'), true);
        }
      });
      return ok;
    }

    function gatherCreatePayload() {
      syncAllLines();
      var firstLine = state.lines[0] || {};
      return {
        nid_khach_hang: firstLine.nid_khach_hang || 0,
        loai_ke_hoach: currentPlanType(),
        items: $.map(state.lines, function (line) {
          return {
            nid_khach_hang: line.nid_khach_hang || 0,
            so_bkg: line.so_bkg || '',
            nid_phuong_tien: line.nid_phuong_tien || 0,
            nid_mooc: line.nid_mooc || 0,
            nid_lai_xe: line.nid_lai_xe || 0,
            dia_chi_kho: line.dia_chi_kho || '',
            loai_cont: line.loai_cont || '',
            loai_hang: line.loai_hang || '',
            so_cont: line.so_cont || '',
            so_seal_chinh: line.so_seal_chinh || '',
            so_seal_tam: line.so_seal_tam || '',
            bai_lay_cont: line.bai_lay_cont || '',
            bai_lay_thuc_te: line.bai_lay_thuc_te || '',
            bai_ha_cont: line.bai_ha_cont || '',
            bai_ha_thuc_te: line.bai_ha_thuc_te || '',
            cang_xuat: line.cang_xuat || '',
            cut_off: line.cut_off || '',
            ngay_bat_dau: line.ngay_bat_dau || '',
            ngay_gio_ke_hoach: line.ngay_gio_ke_hoach || '',
            ngay_ket_thuc: line.ngay_ket_thuc || '',
            ghi_chu: line.ghi_chu || '',
            thong_tin_json: currentPlanType() === 'tuyen_xa' ? { vai_tro_ke_hoach: planRole(line), cong_viec_chinh_hoan_thanh: line.cong_viec_chinh_hoan_thanh || 0, hinh_thuc_tinh_luong_lai_xe: line.hinh_thuc_tinh_luong_lai_xe || 'khoan', ke_hoach_ket_hop_enabled: line.ke_hoach_ket_hop_enabled || 0, bai_ha_tam_1_enabled: line.bai_ha_tam_1_enabled || 0, bai_ha_tam_1: line.bai_ha_tam_1 || '', bai_ha_tam_2_enabled: line.bai_ha_tam_2_enabled || 0, bai_ha_tam_2: line.bai_ha_tam_2 || '', vi_tri_cont_hien_tai: line.vi_tri_cont_hien_tai || '', vi_tri_cont_index_hien_tai: parseInt(line.vi_tri_cont_index_hien_tai, 10) || 0, cont_thuc_hien_tu_index: parseInt(line.cont_thuc_hien_tu_index, 10), cont_thuc_hien_den_index: parseInt(line.cont_thuc_hien_den_index, 10), cont_thuc_hien_chang: line.cont_thuc_hien_chang || [], cont_keo_ve_tu: line.cont_keo_ve_tu || '', cont_keo_ve_den: line.cont_keo_ve_den || '' } : { kiem_dich: line.kiem_dich || 0, kiem_hoa: line.kiem_hoa || 0, hun_trung: line.hun_trung || 0, cont_keo_ve_seal_phu: line.cont_keo_ve_seal_phu || 0, cont_keo_ve_kiem_dich: line.cont_keo_ve_kiem_dich || 0, cont_keo_ve_kiem_hoa: line.cont_keo_ve_kiem_hoa || 0, cont_keo_ve_hun_trung: line.cont_keo_ve_hun_trung || 0 },
            hinh_thuc_van_tai: line.hinh_thuc_van_tai || '',
            ke_hoach_cont_ref_nid: line.ke_hoach_cont_ref_nid || 0,
            da_cat_mooc: line.da_cat_mooc || 0,
            da_du_hang: line.da_du_hang || 0,
            ha_bai_ngoai: line.ha_bai_ngoai || 0,
            ha_cang: line.ha_cang || 0,
            tang_bo: lineTangBo(line),
            ket_hop: lineKetHopPayload(line)
          };
        })
      };
    }

    function gatherEditPayload() {
      syncAllLines();
      var line = state.lines[0] || {};
      return {
        nid_khach_hang: line.nid_khach_hang || 0,
        item: {
          so_bkg: useTableLayout || currentPlanType() === 'tuyen_xa' ? (line.so_bkg || '') : $form('#so_bkg-input').val().trim(),
          nid_phuong_tien: line.nid_phuong_tien || 0,
          nid_mooc: line.nid_mooc || 0,
          nid_lai_xe: line.nid_lai_xe || 0,
          dia_chi_kho: line.dia_chi_kho || '',
          loai_cont: line.loai_cont || '',
          loai_hang: line.loai_hang || '',
          so_cont: line.so_cont || '',
          so_seal_chinh: line.so_seal_chinh || '',
          so_seal_tam: line.so_seal_tam || '',
          bai_lay_cont: line.bai_lay_cont || '',
          bai_lay_thuc_te: line.bai_lay_thuc_te || '',
          bai_ha_cont: line.bai_ha_cont || '',
          bai_ha_thuc_te: line.bai_ha_thuc_te || '',
          cang_xuat: line.cang_xuat || '',
          cut_off: line.cut_off || '',
          ngay_bat_dau: line.ngay_bat_dau || '',
          ngay_gio_ke_hoach: line.ngay_gio_ke_hoach || '',
          ngay_ket_thuc: line.ngay_ket_thuc || '',
          ghi_chu: line.ghi_chu || '',
          thong_tin_json: currentPlanType() === 'tuyen_xa' ? { vai_tro_ke_hoach: planRole(line), cong_viec_chinh_hoan_thanh: line.cong_viec_chinh_hoan_thanh || 0, hinh_thuc_tinh_luong_lai_xe: line.hinh_thuc_tinh_luong_lai_xe || 'khoan', ke_hoach_ket_hop_enabled: line.ke_hoach_ket_hop_enabled || 0, bai_ha_tam_1_enabled: line.bai_ha_tam_1_enabled || 0, bai_ha_tam_1: line.bai_ha_tam_1 || '', bai_ha_tam_2_enabled: line.bai_ha_tam_2_enabled || 0, bai_ha_tam_2: line.bai_ha_tam_2 || '', vi_tri_cont_hien_tai: line.vi_tri_cont_hien_tai || '', vi_tri_cont_index_hien_tai: parseInt(line.vi_tri_cont_index_hien_tai, 10) || 0, cont_thuc_hien_tu_index: parseInt(line.cont_thuc_hien_tu_index, 10), cont_thuc_hien_den_index: parseInt(line.cont_thuc_hien_den_index, 10), cont_thuc_hien_chang: line.cont_thuc_hien_chang || [], cont_keo_ve_tu: line.cont_keo_ve_tu || '', cont_keo_ve_den: line.cont_keo_ve_den || '' } : { kiem_dich: line.kiem_dich || 0, kiem_hoa: line.kiem_hoa || 0, hun_trung: line.hun_trung || 0, cont_keo_ve_seal_phu: line.cont_keo_ve_seal_phu || 0, cont_keo_ve_kiem_dich: line.cont_keo_ve_kiem_dich || 0, cont_keo_ve_kiem_hoa: line.cont_keo_ve_kiem_hoa || 0, cont_keo_ve_hun_trung: line.cont_keo_ve_hun_trung || 0 },
          hinh_thuc_van_tai: line.hinh_thuc_van_tai || '',
          ke_hoach_cont_ref_nid: line.ke_hoach_cont_ref_nid || 0,
          da_cat_mooc: line.da_cat_mooc || 0,
          da_du_hang: line.da_du_hang || 0,
          ha_bai_ngoai: line.ha_bai_ngoai || 0,
          ha_cang: line.ha_cang || 0,
          tang_bo: lineTangBo(line),
          ket_hop: lineKetHopPayload(line)
        }
      };
    }

    function updateEditTitle(row) {
      var parts = [currentPlanType() === 'tuyen_xa' ? 'Xếp xe tuyến xa' : 'Xếp xe'];
      var khName = customerFullName(row && row.khach_hang);
      var soBkg = currentPlanType() === 'tuyen_xa' ? '' : (row && row.so_bkg ? row.so_bkg : '');
      if (khName) parts.push(khName);
      if (soBkg) parts.push(soBkg);
      $form('#form-title').text(parts.join(' - '));
    }

    function updateCompleteButton(row) {
      var $btn = currentPlanType() === 'tuyen_xa' ? $form('#khxh-status-btn') : $form('#complete-plan-btn');
      if (!$btn.length) return;
      var nid = row && row.nid ? parseInt(row.nid, 10) : parseInt($form('#nid-input').val(), 10);
      var status = row && row.trang_thai_van_chuyen ? String(row.trang_thai_van_chuyen) : '';
      if (!nid) {
        $btn.addClass('d-none').removeAttr('data-id');
        return;
      }
      if (currentPlanType() === 'tuyen_xa') {
        var json = (row && row.thong_tin_json) || {};
        var displayStatus = status || 'Chưa xếp xe';
        $btn.removeClass('d-none btn-success btn-outline-success').addClass('btn-label-primary')
          .attr('data-id', nid)
          .html('<i class="icon-base ti tabler-arrows-exchange me-1"></i>' + escHtml(displayStatus));
        return;
      }
      $btn.removeClass('d-none').attr('data-id', nid);
      var portStatus = status || 'Chờ thực hiện';
      var portStatusColor = hangCangPlanStatusColor(portStatus);
      $btn.removeClass('btn-success btn-outline-success btn-label-secondary btn-label-info btn-label-primary btn-label-warning btn-label-success btn-label-danger')
        .addClass(portStatusColor)
        .html('<i class="icon-base ti tabler-arrows-exchange me-1"></i>' + escHtml(portStatus));
    }

    function populateEdit(row) {
      editData = row || editData;
      resetPortCostSummary();
      var khachHangId = (row.khach_hang && row.khach_hang.nid) || 0;
      var rowJson = row.thong_tin_json || {};
      updateEditTitle(row);
      $form('#nid-input').val(row.nid || '');
      updateCompleteButton(row);
      renderEditPlanFiles(planFilesFromRow(row));
      state.pendingContDestinationUpdates = {};
      state.lines = [];
      addLine({
        nid_khach_hang: khachHangId,
        so_bkg: row.so_bkg || '',
        nid_phuong_tien: row.phuong_tien ? row.phuong_tien.nid : 0,
        nid_mooc: row.nid_mooc || (row.mooc ? row.mooc.nid : 0),
        mooc: row.mooc || null,
        nid_lai_xe: row.lai_xe ? row.lai_xe.nid : 0,
        dia_chi_kho: row.dia_chi_kho || '',
        loai_cont: row.loai_cont || '',
        loai_hang: row.loai_hang || '',
        so_cont: row.so_cont || '',
        so_seal_chinh: row.so_seal_chinh || '',
        so_seal_tam: row.so_seal_tam || '',
        bai_lay_cont: row.bai_lay_cont || '',
        bai_lay_thuc_te: row.bai_lay_thuc_te || '',
        bai_ha_cont: row.bai_ha_cont || '',
        bai_ha_thuc_te: row.bai_ha_thuc_te || '',
        bai_ha_tam_1_enabled: rowJson.bai_ha_tam_1_enabled || 0,
        bai_ha_tam_1: rowJson.bai_ha_tam_1 || '',
        bai_ha_tam_2_enabled: rowJson.bai_ha_tam_2_enabled || 0,
        bai_ha_tam_2: rowJson.bai_ha_tam_2 || '',
        vi_tri_cont_hien_tai: rowJson.vi_tri_cont_hien_tai || '',
        vi_tri_cont_index_hien_tai: rowJson.vi_tri_cont_index_hien_tai !== undefined ? parseInt(rowJson.vi_tri_cont_index_hien_tai, 10) : contCurrentPointIndex(row),
        vai_tro_ke_hoach: rowJson.vai_tro_ke_hoach || (row.ke_hoach_cont_ref_nid ? 'thuc_hien_chang' : 'ke_hoach_goc'),
        cong_viec_chinh_hoan_thanh: rowJson.cong_viec_chinh_hoan_thanh || 0,
        cont_keo_ve_tu: rowJson.cont_keo_ve_tu || (row.cont_ref ? contCurrentLocation(row.cont_ref) : ''),
        cont_keo_ve_den: rowJson.cont_keo_ve_den || (row.cont_ref ? contNextLocation(row.cont_ref) : ''),
        cont_thuc_hien_tu_index: rowJson.cont_thuc_hien_tu_index !== undefined ? parseInt(rowJson.cont_thuc_hien_tu_index, 10) : -1,
        cont_thuc_hien_den_index: rowJson.cont_thuc_hien_den_index !== undefined ? parseInt(rowJson.cont_thuc_hien_den_index, 10) : -1,
        cont_thuc_hien_chang: rowJson.cont_thuc_hien_chang || [],
        cang_xuat: row.cang_xuat || '',
        cut_off: row.cut_off || '',
        ngay_bat_dau: row.ngay_bat_dau || '',
        ngay_gio_ke_hoach: row.ngay_gio_ke_hoach || '',
        ngay_ket_thuc: row.ngay_ket_thuc || '',
	        ghi_chu: row.ghi_chu || '',
	        kiem_dich: rowJson.kiem_dich || 0,
	        kiem_hoa: rowJson.kiem_hoa || 0,
	        hun_trung: rowJson.hun_trung || 0,
	        cont_keo_ve_seal_phu: rowJson.cont_keo_ve_seal_phu || 0,
	        cont_keo_ve_kiem_dich: rowJson.cont_keo_ve_kiem_dich || 0,
	        cont_keo_ve_kiem_hoa: rowJson.cont_keo_ve_kiem_hoa || 0,
	        cont_keo_ve_hun_trung: rowJson.cont_keo_ve_hun_trung || 0,
	        hinh_thuc_van_tai: row.hinh_thuc_van_tai || '',
        hinh_thuc_tinh_luong_lai_xe: row.hinh_thuc_tinh_luong_lai_xe || rowJson.hinh_thuc_tinh_luong_lai_xe || 'khoan',
        ke_hoach_ket_hop_enabled: rowJson.ke_hoach_ket_hop_enabled || 0,
        ke_hoach_cont_ref_nid: row.ke_hoach_cont_ref_nid || 0,
        nid_ke_hoach_nguon: row.nid_ke_hoach_nguon || 0,
	        cont_ref_label: row.cont_ref ? (row.cont_ref.so_cont || '') : '',
	        cont_ref: row.cont_ref || null,
	        da_cat_mooc: row.da_cat_mooc || 0,
        da_du_hang: row.da_du_hang || 0,
        ha_bai_ngoai: row.ha_bai_ngoai || 0,
        ha_cang: row.ha_cang || 0,
        tang_bo: rowJson.tang_bo || {},
        ket_hop: rowJson.ket_hop || {}
      });
      if (currentPlanType() !== 'tuyen_xa' && state.lines[0]) {
        // Dòng form đã bổ sung điểm hiện tại/kế tiếp của cont kéo về từ
        // cont_ref. Lưu nó làm draft cho tab Chi phí sử dụng.
        $form('#ke-hoach-form-app').data('khxh-port-plan-draft', $.extend(true, {}, row, state.lines[0]));
      }
      $form('#nid_khach_hang-input').val(khachHangId).trigger('change');
      if ($form('#so_bkg-input').length) $form('#so_bkg-input').val(row.so_bkg || '');
      renderEditPlanFiles(planFilesFromRow(row));
      if (currentPlanType() !== 'tuyen_xa') loadPortCostSummary(row.nid);
      loadCombinedPlans();
    }

    function planFileApiBase() {
      return (currentPlanType() === 'tuyen_xa' ? '/api/ke-hoach-tuyen-xa/' : '/api/ke-hoach-xep-xe/') + ($form('#nid-input').val() || '');
    }

    function renderEditPlanFiles(files) {
      files = files || [];
      var isFull = files.length >= MAX_PLAN_FILES;
      var line = state.lines[0] || null;
      var tangBoEnabled = currentPlanType() === 'tuyen_xa' && line && optionEnabled(lineTangBo(line).enabled);
      var $groupSelect = $form('#khxh-plan-file-group');
      $groupSelect.find('option[value="tang_bo"]').prop('disabled', !tangBoEnabled).toggleClass('d-none', !tangBoEnabled);
      if (!tangBoEnabled && $groupSelect.val() === 'tang_bo') $groupSelect.val('lay_cont_rong');
      $form('#khxh-plan-files-count')
        .text(files.length + '/' + MAX_PLAN_FILES + ' file')
        .toggleClass('bg-label-danger', isFull)
        .toggleClass('bg-label-secondary', !isFull);
      $form('#khxh-plan-file-input').prop('disabled', isFull);
      $form('#khxh-plan-file-upload').prop('disabled', isFull);
      $form('#khxh-plan-files-body').html(renderPlanFilesHtml(files, true, tangBoEnabled));
      if (editData) {
        editData.hinh_anh_chung_tu = files;
        editData.thong_tin_json = editData.thong_tin_json || {};
        editData.thong_tin_json.hinh_anh_chung_tu = files;
      }
      updateTuyenXaSidebar();
    }

    function uploadEditPlanFiles() {
      var nid = parseInt($form('#nid-input').val(), 10) || 0;
      if (!nid) {
        if (notyf) notyf.error('Vui lòng lưu kế hoạch trước khi upload chứng từ');
        return;
      }
      var input = $form('#khxh-plan-file-input')[0];
      var files = input && input.files && input.files.length ? Array.prototype.slice.call(input.files) : selectedPlanFiles;
      if (!files || !files.length) {
        if (notyf) notyf.error('Vui lòng chọn file cần upload');
        return;
      }
      var currentFiles = planFilesFromRow(editData);
      var currentCount = currentFiles.length;
      if (currentCount >= MAX_PLAN_FILES) {
        if (notyf) notyf.error('Kế hoạch này đã đạt giới hạn tối đa ' + MAX_PLAN_FILES + ' file chứng từ');
        return;
      }
      if (currentCount + files.length > MAX_PLAN_FILES) {
        if (notyf) notyf.error('Kế hoạch này chỉ được lưu tối đa ' + MAX_PLAN_FILES + ' file chứng từ. Hiện có ' + currentCount + ' file, bạn chỉ có thể upload thêm ' + (MAX_PLAN_FILES - currentCount) + ' file');
        return;
      }
      var selectedGroup = $form('#khxh-plan-file-group').val() || 'lay_cont_rong';
      var firstLine = state.lines[0] || null;
      if (selectedGroup === 'tang_bo' && (!firstLine || !optionEnabled(lineTangBo(firstLine).enabled))) {
        if (notyf) notyf.error('Chỉ upload chứng từ Tăng bo khi kế hoạch đã bật Tăng bo');
        return;
      }
      var formData = new FormData();
      for (var i = 0; i < files.length; i++) {
        formData.append('plan_files[]', files[i], files[i].name || ('file_' + i));
      }
      formData.append('nhom', selectedGroup);

      var $btn = $form('#khxh-plan-file-upload');
      $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm me-1"></span>Đang upload');
      var xhr = new XMLHttpRequest();
      xhr.open('POST', planFileApiBase() + '/file', true);
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.onload = function () {
        var res = null;
        try { res = JSON.parse(xhr.responseText || '{}'); } catch (e) {}
        $btn.prop('disabled', false).html('<i class="ti tabler-upload me-1"></i>Upload');
        if (xhr.status >= 200 && xhr.status < 300 && res && res.status === 'success' && res.data) {
          selectedPlanFiles = [];
          if (input) input.value = '';
          renderEditPlanFiles(res.data.hinh_anh_chung_tu || []);
          if (notyf) notyf.success('Upload chứng từ thành công');
          if (parseInt(res.data.failed || 0, 10) > 0 && notyf) {
            notyf.error('Có ' + res.data.failed + ' file không hợp lệ');
          }
        } else if (notyf) {
          notyf.error((res && res.message) || 'Upload không thành công');
        }
      };
      xhr.onerror = function () {
        $btn.prop('disabled', false).html('<i class="ti tabler-upload me-1"></i>Upload');
        if (notyf) notyf.error('Lỗi kết nối server');
      };
      xhr.send(formData);
    }

    function deleteEditPlanFile(fileId) {
      var doDelete = function () {
        $.ajax({
          url: planFileApiBase() + '/file/' + encodeURIComponent(fileId),
          type: 'DELETE',
          dataType: 'json',
          success: function (res) {
            if (res.status === 'success' && res.data) {
              renderEditPlanFiles(res.data.hinh_anh_chung_tu || []);
              if (notyf) notyf.success('Đã xoá chứng từ');
            } else if (notyf) {
              notyf.error(res.message || 'Xoá chứng từ thất bại');
            }
          },
          error: function (jqXHR) {
            if (notyf) notyf.error(apiMsg(jqXHR));
          }
        });
      };
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xoá chứng từ?',
          text: 'File sẽ bị xoá khỏi kế hoạch này.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xoá',
          cancelButtonText: 'Huỷ',
          confirmButtonColor: '#d33',
          customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false
        }).then(function (result) {
          if (result.isConfirmed) doDelete();
        });
      } else if (confirm('Xoá chứng từ này?')) {
        doDelete();
      }
    }

    // ===== Kế hoạch kết hợp / hàng vào (chỉ dùng cho kế hoạch tuyến xa gốc) =====
    var combinedPlans = [];

    function isCombinedPlan(row) {
      var json = row && row.thong_tin_json ? row.thong_tin_json : {};
      return !!(row && (parseInt(row.nid_ke_hoach_nguon, 10) || json.ke_hoach_ket_hop_hang));
    }

    function combinedPlanModalInstance() {
      var el = document.getElementById('khxh-combined-plan-modal');
      if (!el || typeof bootstrap === 'undefined' || !bootstrap.Modal) return null;
      return bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(el) : new bootstrap.Modal(el);
    }

    function combinedPlanEndpoint(id) {
      var sourceId = parseInt($form('#nid-input').val(), 10) || 0;
      var url = '/api/ke-hoach-tuyen-xa/' + sourceId + '/ke-hoach-ket-hop';
      return id ? url + '/' + parseInt(id, 10) : url;
    }

    function combinedPlanLoading(show) {
      $('#khxh-combined-plan-loading').toggle(!!show);
      $('#khxh-combined-plan-save').prop('disabled', !!show);
    }

    function combinedPlanRoute(row) {
      return [row.bai_lay_thuc_te || row.bai_lay_cont || row.diem_di || '', row.dia_chi_kho || '', row.bai_ha_thuc_te || row.bai_ha_cont || row.diem_den || ''].filter(Boolean).join(' → ');
    }

    function renderCombinedPlans() {
      var $card = $form('#khxh-combined-plans-card');
      if (!$card.length) return;
      var source = editData || {};
      var line = state.lines[0] || {};
      var available = currentPlanType() === 'tuyen_xa' && !!parseInt(source.nid, 10) && !isCombinedPlan(source) && optionEnabled(line.ke_hoach_ket_hop_enabled);
      $card.toggleClass('d-none', !available);
      if (!available) return;
      $form('#khxh-combined-plans-count').text(combinedPlans.length + ' kế hoạch');
      $form('.khxh-nav-combined-plan-count').text(combinedPlans.length);
      if (!combinedPlans.length) {
        $form('#khxh-combined-plans-body').html('<div class="text-muted text-center py-3">Chưa có kế hoạch kết hợp</div>');
        return;
      }
      var html = '<div class="khxh-combined-plan-list">';
      $.each(combinedPlans, function (_, item) {
        var customer = customerPlanLabel(item.khach_hang) || 'Chưa có khách hàng';
        var customerFull = customerFullName(item.khach_hang);
        var cont = [item.loai_cont || '', item.so_cont || ''].filter(Boolean).join(' - ');
        html += '<div class="khxh-combined-plan-item">' +
          '<div class="khxh-combined-plan-main"><strong' + (customerFull ? ' title="' + escHtml(customerFull) + '"' : '') + '>' + escHtml(customer) + '</strong><span>' + escHtml(combinedPlanRoute(item)) + '</span><small>' + escHtml([cont, item.loai_hang || ''].filter(Boolean).join(' · ')) + '</small></div>' +
          '<div class="d-flex align-items-center gap-2"><span class="badge ' + hinhThucColor('ket_hop') + '">Kết hợp</span><span class="badge bg-label-secondary">' + escHtml(item.trang_thai_van_chuyen || 'Chưa xếp xe') + '</span><button type="button" class="btn btn-sm btn-outline-secondary btn-edit-combined-plan" data-id="' + parseInt(item.nid, 10) + '"><i class="ti tabler-pencil me-1"></i>Sửa</button></div>' +
        '</div>';
      });
      $form('#khxh-combined-plans-body').html(html + '</div>');
    }

    function loadCombinedPlans() {
      var source = editData || {};
      var line = state.lines[0] || {};
      if (currentPlanType() !== 'tuyen_xa' || !source.nid || isCombinedPlan(source) || !optionEnabled(line.ke_hoach_ket_hop_enabled)) {
        combinedPlans = [];
        renderCombinedPlans();
        return;
      }
      $form('#khxh-combined-plans-card').removeClass('d-none');
      $form('#khxh-combined-plans-body').html('<div class="text-center text-muted py-3"><span class="spinner-border spinner-border-sm me-2"></span>Đang tải kế hoạch kết hợp...</div>');
      $.ajax({
        url: combinedPlanEndpoint(), type: 'GET', dataType: 'json',
        success: function (res) {
          combinedPlans = res && res.status === 'success' && res.data && Array.isArray(res.data.items) ? res.data.items : [];
          renderCombinedPlans();
        },
        error: function () {
          combinedPlans = [];
          $form('#khxh-combined-plans-body').html('<div class="text-danger text-center py-3">Không tải được kế hoạch kết hợp</div>');
        }
      });
    }

    function initCombinedPlanSelects(item) {
      var parent = $('#khxh-combined-plan-modal');
      // Modal được mở nhiều lần trong một phiên. Huỷ instance cũ trước khi
      // nạp option mới để Select2 luôn có đúng style, nút x và option tạo mới
      // giống phần kế hoạch chính.
      function resetSelect($select, optionsHtml, placeholder, options) {
        if ($select.data('select2')) $select.select2('destroy');
        $select
          .removeData('khxhCustomerCreateAttached')
          .removeData('khxhCreateAttached')
          .html(optionsHtml);
        initSelect2($select[0], placeholder, $.extend({ dropdownParent: parent }, options || {}));
      }

      var $customer = $('#khxh-combined-customer');
      var $cargoType = $('#khxh-combined-cargo-type');
      var $kho = $('#khxh-combined-kho');
      var $baiHa = $('#khxh-combined-bai-ha');
      resetSelect($customer, buildCustomerOptions(item && item.khach_hang ? item.khach_hang.nid : 0), '— Chọn khách hàng —');
      resetSelect($cargoType, buildTagOptions(state.cauHinh.loaiHang, item ? item.loai_hang : ''), '— Chọn tên hàng —', { tags: true });
      resetSelect($kho, buildTagOptions(state.diaDiem.kho, item ? item.dia_chi_kho : ''), '— Chọn địa chỉ kho —', { tags: true });
      resetSelect($baiHa, buildTagOptions(state.diaDiem.bai, item ? (item.bai_ha_thuc_te || item.bai_ha_cont) : ''), '— Chọn bãi hạ —', { tags: true });

      attachCustomerCreateOption($customer, null);
      attachCreateOption($kho, 'Kho', null, null);
      attachCreateOption($baiHa, 'Bãi', null, null);
    }

    function openCombinedPlanModal(id) {
      var item = null;
      $.each(combinedPlans, function (_, candidate) { if (parseInt(candidate.nid, 10) === parseInt(id, 10)) item = candidate; });
      var source = editData || {};
      if (!source.nid || isCombinedPlan(source)) return;
      $('#khxh-combined-plan-id').val(item ? item.nid : '');
      $('#khxh-combined-plan-modal-title').text(item ? 'Sửa kế hoạch kết hợp' : 'Tạo kế hoạch kết hợp');
      $('#khxh-combined-container-type').val((item && item.loai_cont) || source.loai_cont || '');
      $('#khxh-combined-container-no').val((item && item.so_cont) || source.so_cont || '');
      $('#khxh-combined-start').val(item ? (item.bai_lay_thuc_te || item.bai_lay_cont || item.diem_di || '') : 'Sẽ lấy theo điểm kết thúc của kế hoạch trước');
      $('#khxh-combined-note').val(item ? (item.ghi_chu || '') : '');
      $('#khxh-combined-plan-source').text('Chuyến chính #' + source.nid + ' · ' + (source.so_cont || 'Chưa có') + ' · ' + (source.bai_ha_thuc_te || source.bai_ha_cont || source.diem_den || 'Chưa xác định điểm cuối'));
      initCombinedPlanSelects(item);
      $('#khxh-combined-plan-form').removeClass('was-validated');
      var modal = combinedPlanModalInstance();
      if (modal) modal.show();
    }

    function saveCombinedPlan() {
      var form = $('#khxh-combined-plan-form')[0];
      if (!form) return;
      if (!form.checkValidity()) { $(form).addClass('was-validated'); return; }
      var id = parseInt($('#khxh-combined-plan-id').val(), 10) || 0;
      var payload = {
        nid_khach_hang: parseInt($('#khxh-combined-customer').val(), 10) || 0,
        loai_hang: $('#khxh-combined-cargo-type').val() || '',
        dia_chi_kho: $('#khxh-combined-kho').val() || '',
        bai_ha_cont: $('#khxh-combined-bai-ha').val() || '',
        ghi_chu: $('#khxh-combined-note').val() || ''
      };
      combinedPlanLoading(true);
      $.ajax({
        url: combinedPlanEndpoint(id), type: id ? 'PUT' : 'POST', contentType: 'application/json; charset=utf-8', dataType: 'json', data: JSON.stringify(payload),
        success: function (res) {
          if (!res || res.status !== 'success') { if (notyf) notyf.error((res && res.message) || 'Không lưu được kế hoạch kết hợp'); return; }
          var saved = res.data;
          var found = false;
          combinedPlans = $.map(combinedPlans, function (row) { if (parseInt(row.nid, 10) === parseInt(saved.nid, 10)) { found = true; return saved; } return row; });
          if (!found) combinedPlans.push(saved);
          renderCombinedPlans();
          var modal = combinedPlanModalInstance(); if (modal) modal.hide();
          markForceReloadList();
          if (notyf) notyf.success('Đã lưu kế hoạch kết hợp');
        },
        error: function (jqXHR) { if (notyf) notyf.error(apiMsg(jqXHR)); },
        complete: function () { combinedPlanLoading(false); }
      });
    }

    function loadEditDetail(done) {
      if (editData && parseInt(editData.nid, 10)) {
        if (done) done(editData);
        return;
      }
      var nid = getNidFromUrl();
      if (!nid) {
        if (done) done(editData);
        return;
      }
      $.ajax({
        url: '/api/ke-hoach-xep-xe/' + nid,
        type: 'GET',
        dataType: 'json',
        success: function (res) {
          if (res.status === 'success' && res.data) {
            editData = res.data;
            if (done) done(res.data);
            return;
          }
          if (notyf) notyf.error(res.message || 'Không tải được chi tiết kế hoạch');
          if (done) done(editData);
        },
        error: function (jqXHR) {
          if (notyf) notyf.error(apiMsg(jqXHR));
          if (done) done(editData);
        }
      });
    }

    function loadDropdowns(done) {
      var cached = getFormDropdownCache();
      if (cached) {
        applyDropdownData(cached);
        dropdownsLoaded = true;
        dropdownsLoading = false;
        if (done) done();
        return;
      }
      if (dropdownsLoaded) {
        if (done) done();
        return;
      }
      if (dropdownsLoading) {
        var timer = setInterval(function () {
          if (dropdownsLoaded) {
            clearInterval(timer);
            if (done) done();
          }
        }, 50);
        return;
      }
      dropdownsLoading = true;
      var pending = 4;
      function finish() {
        pending -= 1;
        if (pending === 0) {
          setFormDropdownCache({
            customers: state.customers,
            drivers: state.drivers,
            vehicles: state.vehicles,
            diaDiem: state.diaDiem
          });
          dropdownsLoaded = true;
          dropdownsLoading = false;
          if (done) done();
        }
      }
      $.ajax({
        url: '/api/khach-hang',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            state.customers = res.data.items;
            var html = '<option value="0">— Chọn —</option>';
            for (var i = 0; i < state.customers.length; i++) {
              html += '<option value="' + state.customers[i].nid + '">' + escHtml(customerPlanLabel(state.customers[i])) + '</option>';
            }
            $form('#nid_khach_hang-input').html(html);
          }
        },
        complete: finish
      });
      $.ajax({
        url: '/api/lai-xe',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) state.drivers = res.data.items;
        },
        complete: finish
      });
      $.ajax({
        url: '/api/phuong-tien',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            state.vehicles = res.data.items;
            state.vehicleMap = {};
            for (var i = 0; i < state.vehicles.length; i++) state.vehicleMap[String(state.vehicles[i].nid)] = state.vehicles[i];
          }
        },
        complete: finish
      });
      $.ajax({
        url: '/api/danh-muc',
        type: 'GET',
        dataType: 'json',
        data: { phan_loai: 'Kho,Bãi,Cảng,Loại hàng', limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            state.diaDiem.kho = [];
            state.diaDiem.loaiHang = [];
            for (var i = 0; i < res.data.items.length; i++) {
              var phanLoai = String(res.data.items[i].phan_loai || '').toLowerCase();
              var ten = res.data.items[i].ten || res.data.items[i].name || res.data.items[i].label || '';
              if (phanLoai === 'kho' && ten) state.diaDiem.kho.push(ten);
              if (phanLoai === 'bãi' && ten) state.diaDiem.bai.push(ten);
              if (phanLoai === 'cảng' && ten) state.diaDiem.cang.push(ten);
              if (phanLoai === 'loại hàng' && ten) state.diaDiem.loaiHang.push(ten);
            }
            state.cauHinh.diaChiKho = state.diaDiem.kho.slice();
            state.cauHinh.loaiHang = state.diaDiem.loaiHang.slice();
            // Các option danh mục đã được nạp vào state; không render lại toàn
            // bộ modal ở đây. Việc đó sẽ làm modal giật và khóa scroll sau khi
            // người dùng chọn khách hàng trong một dòng đã nhân bản.
          }
        },
        complete: finish
      });
    }

    $(document).on('change', '#nid_khach_hang-input, .line-customer-select', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      if ($card.length) {
        var line = findLine($card.data('line-key'));
        if (line) line.nid_khach_hang = parseInt($(this).val(), 10) || 0;
      }
      loadCauHinh(parseInt($(this).val(), 10) || 0);
      updateTuyenXaSidebar();
    });
    $(document).on('change', '.line-chuyen-xa-toggle', function () {
      var line = syncLine($(this).closest('.ke-hoach-line-card'));
      if (line) line.hinh_thuc_tinh_luong_lai_xe = this.checked ? 'theo_chuyen' : 'khoan';
      updateTuyenXaSidebar();
    });
    $(document).on('change', '.line-bai-thuc-te-toggle', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var oldLine = findLine($card.data('line-key'));
      var oldPoints = tuyenXaRoutePoints(oldLine);
      var oldIndex = oldLine ? parseInt(oldLine.vi_tri_cont_index_hien_tai, 10) : -1;
      var oldPointKey = oldPoints[oldIndex] ? oldPoints[oldIndex].key : '';
      $card.find('.line-bai-thuc-te-fields').toggleClass('d-none', !this.checked);
      if (!this.checked) {
        $card.find('.line-bai-lay-thuc-te-select, .line-bai-ha-thuc-te-select').val('').trigger('change.select2');
      }
      var line = syncLine($card);
      refreshTuyenXaRouteDerivedUi($card, line, oldPointKey);
    });
    $(document).on('change', '.line-bai-ha-tam-1-toggle, .line-bai-ha-tam-2-toggle', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var oldLine = findLine($card.data('line-key'));
      var oldPoints = tuyenXaRoutePoints(oldLine);
      var oldIndex = oldLine ? parseInt(oldLine.vi_tri_cont_index_hien_tai, 10) : -1;
      var oldPointKey = oldPoints[oldIndex] ? oldPoints[oldIndex].key : '';
      var isFirst = $(this).hasClass('line-bai-ha-tam-1-toggle');
      var selector = isFirst ? '.line-bai-ha-tam-1-fields' : '.line-bai-ha-tam-2-fields';
      $card.find(selector).toggleClass('d-none', !this.checked);
      if (!this.checked) {
        var $select = $card.find(isFirst ? '.line-bai-ha-tam-1-select' : '.line-bai-ha-tam-2-select');
        $select.val('').trigger('change.select2');
      }
      var line = syncLine($card);
      refreshTuyenXaRouteDerivedUi($card, line, oldPointKey);
    });
    $(document).on('change', '.line-tang-bo-toggle', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var $wrap = $card.find('.khxh-tang-bo-wrap');
      $wrap.toggleClass('d-none', !this.checked);
      $wrap.find('.khxh-tang-bo-section').toggleClass('d-none', !this.checked);
      syncLine($card);
      renderEditPlanFiles(planFilesFromRow(editData));
      updateTuyenXaSidebar();
    });
    $(document).on('change', '.line-ke-hoach-ket-hop-toggle', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var line = syncLine($card);
      if (!line) return;
      if (this.checked) {
        loadCombinedPlans();
      } else {
        renderCombinedPlans();
      }
      updateTuyenXaSidebar();
    });
    $(document).on('change', '.line-ket-hop-toggle', function () {
      $(this).closest('.khxh-ket-hop-card').find('.khxh-ket-hop-placeholder').toggleClass('d-none', !this.checked);
      updateTuyenXaSidebar();
    });
    $(document).on('change', '.line-plan-root-toggle', function () {
      var $row = $(this).closest('.ke-hoach-line-card, .ke-hoach-table-row');
      var line = syncLine($row);
      if (!line) return;
      line.vai_tro_ke_hoach = this.checked ? 'ke_hoach_goc' : 'thuc_hien_chang';
      if (this.checked) {
        line.ke_hoach_cont_ref_nid = 0;
        line.cont_ref_label = '';
        line.cont_ref = null;
        line.cont_thuc_hien_tu_index = -1;
        line.cont_thuc_hien_den_index = -1;
        line.cont_thuc_hien_chang = [];
      }
      renderRows();
    });
    $(document).on('change', '.line-plan-role-radio', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var line = syncLine($card);
      if (!line) return;
      line.vai_tro_ke_hoach = $(this).val() === 'thuc_hien_chang' ? 'thuc_hien_chang' : 'ke_hoach_goc';
      line.ket_hop = lineKetHop(null);
      if (!isExecutionPlan(line)) {
        line.ke_hoach_cont_ref_nid = 0;
        line.cont_ref_label = '';
        line.cont_ref = null;
        line.cont_keo_ve_tu = '';
        line.cont_keo_ve_den = '';
        line.cont_thuc_hien_tu_index = -1;
        line.cont_thuc_hien_den_index = -1;
        line.cont_thuc_hien_chang = [];
      } else {
        line.tang_bo = $.extend({}, lineTangBo(line), { enabled: 0 });
      }
      renderRows();
    });
    $(document).on('click', '.btn-line-toggle-du-hang', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var line = syncLine($card);
      if (!line) return;
      line.da_du_hang = parseInt(line.da_du_hang, 10) === 1 ? 0 : 1;
      var $badge = $card.find('.khxh-location-state .badge');
      $badge.toggleClass('bg-label-success', !!line.da_du_hang).toggleClass('bg-label-warning', !line.da_du_hang).text(line.da_du_hang ? 'Đã đủ hàng' : 'Chưa đủ hàng');
      updateTuyenXaSidebar();
      if (notyf) notyf.success(line.da_du_hang ? 'Đã đánh dấu cont đủ hàng. Bấm Lưu để cập nhật.' : 'Đã đánh dấu cont chưa đủ hàng. Bấm Lưu để cập nhật.');
    });
    $(document).on('keydown', '.btn-line-toggle-du-hang', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(this).trigger('click');
      }
    });
    $(document).on('change', '.line-kho-select, .line-bai-lay-select, .line-bai-ha-select, .line-bai-ha-tam-1-select, .line-bai-ha-tam-2-select, .line-bai-lay-thuc-te-select, .line-bai-ha-thuc-te-select', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var oldLine = findLine($card.data('line-key'));
      var oldPoints = tuyenXaRoutePoints(oldLine);
      var oldIndex = oldLine ? parseInt(oldLine.vi_tri_cont_index_hien_tai, 10) : -1;
      var oldPointKey = oldPoints[oldIndex] ? oldPoints[oldIndex].key : '';
      var line = syncLine($card);
      if (line && currentPlanType() === 'tuyen_xa') refreshTuyenXaRouteDerivedUi($card, line, oldPointKey);
      else updateTuyenXaSidebar();
    });
    $(document).on('input', '.line-money-input', function () {
      var pos = this.selectionStart || 0;
      var before = this.value;
      this.value = moneyText(this.value);
      if (document.activeElement === this && this.setSelectionRange) {
        var diff = this.value.length - before.length;
        this.setSelectionRange(Math.max(0, pos + diff), Math.max(0, pos + diff));
      }
      updateTuyenXaSidebar();
    });
    $(document).on('click', '.khxh-section-nav-item', function () {
      var target = $(this).attr('data-target') || '';
      var el = target ? $form(target)[0] : null;
      if (!el && target === '#khxh-plan-files-card') el = $form('#khxh-plan-files-card')[0];
      $(this).addClass('is-active').siblings('.khxh-section-nav-item').removeClass('is-active');
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $form('#add-line-btn, #reset-lines-btn, #save-btn, #complete-plan-btn, #khxh-status-btn, #vehicle-picker-search, #ke-hoach-form, #khxh-plan-file-upload, #khxh-plan-file-input').off();
    $('#khxh-status-save-btn').off('click.khxhStatus');
    $(document).off('khcp:summary-changed.khxhPort').on('khcp:summary-changed.khxhPort', function (e, summary) {
      if (currentPlanType() === 'tuyen_xa' || !summary) return;
      var currentPlanId = parseInt($form('#nid-input').val(), 10) || 0;
      var summaryPlanId = parseInt(summary.nid_ke_hoach, 10) || 0;
      if (currentPlanId && summaryPlanId && currentPlanId !== summaryPlanId) return;
      state.costSummary = {
        total: Number(summary.total) || 0,
        customer: Number(summary.customer) || 0,
        company: Number(summary.company) || 0,
        driver_self: Number(summary.driver_self) || 0
      };
      updateTuyenXaSidebar();
    });
    $form('#khxh-combined-plan-create').off('.khxhCombinedPlan');
    $form('#khxh-combined-plans-body').off('click.khxhCombinedPlan', '.btn-edit-combined-plan');
    $('#khxh-combined-plan-form').off('.khxhCombinedPlan');
    $form('#khxh-combined-plan-create').on('click.khxhCombinedPlan', function () {
      openCombinedPlanModal(0);
    });
    $form('#khxh-combined-plans-body').on('click.khxhCombinedPlan', '.btn-edit-combined-plan', function () {
      openCombinedPlanModal($(this).attr('data-id'));
    });
    $('#khxh-combined-plan-form').on('submit.khxhCombinedPlan', function (e) {
      e.preventDefault();
      saveCombinedPlan();
    });
    $form('#ke-hoach-form').on('input change', 'input, select, textarea', function () {
      if ($(this).is('.line-bai-thuc-te-toggle, .line-bai-ha-tam-1-toggle, .line-bai-ha-tam-2-toggle, .line-kho-select, .line-bai-lay-select, .line-bai-ha-select, .line-bai-ha-tam-1-select, .line-bai-ha-tam-2-select, .line-bai-lay-thuc-te-select, .line-bai-ha-thuc-te-select')) return;
      if (currentPlanType() !== 'tuyen_xa' && mode !== 'edit' && $(this).is('.line-so-bkg-input, .line-customer-select')) {
        var $card = $(this).closest('.khxh-port-create-section');
        var line = syncLine($card);
        if (line) updatePortCreateCardTitle($card, line, $card.index());
      }
      updateTuyenXaSidebar();
    });
    $form('#add-line-btn').on('click', function () {
      syncAllLines();
      addLine({});
    });
    $form('#reset-lines-btn').on('click', function () {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xác nhận reset',
          text: 'Bạn có chắc chắn muốn xoá toàn bộ dữ liệu đang nhập và quay về 1 dòng trống?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Reset',
          cancelButtonText: 'Huỷ',
          confirmButtonColor: '#7367f0',
          customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false
        }).then(function (result) {
          if (result.isConfirmed) resetAllLines();
        });
      } else if (confirm('Bạn có chắc chắn muốn reset toàn bộ dữ liệu đang nhập?')) {
        resetAllLines();
      }
    });
    $(document).on('input', '#vehicle-picker-search', function () {
      renderVehicleTable($(this).val());
    });
    $form('#khxh-plan-file-input').on('change', function () {
      selectedPlanFiles = this.files && this.files.length ? Array.prototype.slice.call(this.files) : [];
    });
    $form('#khxh-plan-file-upload').on('click', function () {
      uploadEditPlanFiles();
    });
    $formApp.off('click.khxhPlanFiles', '.btn-plan-file-delete').on('click.khxhPlanFiles', '.btn-plan-file-delete', function (e) {
      e.preventDefault();
      deleteEditPlanFile($(this).attr('data-file-id'));
    });
    function statusModalInstance() {
      var modalEl = document.getElementById('khxh-status-modal');
      if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) return null;
      return bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
    }

    function hangCangStatusModalInstance() {
      var modalEl = document.getElementById('khxh-hang-cang-status-modal');
      if (!modalEl || typeof bootstrap === 'undefined' || !bootstrap.Modal) return null;
      return bootstrap.Modal.getOrCreateInstance ? bootstrap.Modal.getOrCreateInstance(modalEl) : new bootstrap.Modal(modalEl);
    }

    function planStatusOptions(selected) {
      var html = '';
      var seen = {};
      for (var i = 0; i < statuses.length; i++) {
        var value = String(statuses[i] || '');
        if (!value || seen[value]) continue;
        seen[value] = true;
        html += '<option value="' + escHtml(value) + '"' + (value === String(selected || '') ? ' selected' : '') + '>' + escHtml(value) + '</option>';
      }
      if (!html) html = '<option value="Chưa xếp xe">Chưa xếp xe</option>';
      return html;
    }

    $form('#khxh-status-btn').on('click', function () {
      var id = parseInt($form('#nid-input').val(), 10) || 0;
      var line = state.lines[0];
      if (!id || !line) return;
      var ketHop = lineKetHop(line);
      $('#khxh-plan-status-select').html(planStatusOptions((editData && editData.trang_thai_van_chuyen) || 'Chưa xếp xe'));
      $('#khxh-main-work-status-select').val(optionEnabled(line.cong_viec_chinh_hoan_thanh) ? '1' : '0');
      $('#khxh-return-cont-status-wrap').toggleClass('d-none', !ketHop.ke_hoach_cont_ref_nid);
      $('#khxh-return-cont-status-select').val(optionEnabled(ketHop.hoan_thanh) ? '1' : '0');
      var modal = statusModalInstance();
      if (modal) modal.show();
    });

    $('#khxh-status-save-btn').on('click.khxhStatus', function () {
      var $saveStatus = $(this);
      var id = parseInt($form('#nid-input').val(), 10) || 0;
      var line = state.lines[0];
      if (!id || !line) return;
      var ketHop = lineKetHop(line);
      var oldMainDone = optionEnabled(line.cong_viec_chinh_hoan_thanh) ? 1 : 0;
      var oldReturnDone = optionEnabled(ketHop.hoan_thanh) ? 1 : 0;
      var nextMainDone = $('#khxh-main-work-status-select').val() === '1' ? 1 : 0;
      var hasReturn = !!ketHop.ke_hoach_cont_ref_nid;
      var nextReturnDone = $('#khxh-return-cont-status-select').val() === '1' ? 1 : 0;
      var oldStatus = String((editData && editData.trang_thai_van_chuyen) || 'Chưa xếp xe');
      var nextStatus = String($('#khxh-plan-status-select').val() || oldStatus);
      if (hasReturn && nextReturnDone && !nextMainDone) {
        if (notyf) notyf.error('Cần hoàn thành công việc chính trước khi hoàn thành cont kéo về');
        return;
      }
      var updates = [];
      /* Khi mở lại công việc chính, phải mở lại cont kéo về trước để backend
       * còn kiểm tra được thứ tự vị trí cont một cách nhất quán. */
      if (hasReturn && oldReturnDone !== nextReturnDone && nextMainDone === 0) {
        updates.push({ hoan_thanh_cont_keo_ve: nextReturnDone });
      }
      if (oldMainDone !== nextMainDone) updates.push({ hoan_thanh_cong_viec_chinh: nextMainDone });
      if (hasReturn && oldReturnDone !== nextReturnDone && nextMainDone !== 0) {
        updates.push({ hoan_thanh_cont_keo_ve: nextReturnDone });
      }
      if (oldStatus !== nextStatus) {
        var statusPayload = { trang_thai_van_chuyen: nextStatus };
        if (nextStatus === 'Hoàn thành') statusPayload.ngay_ket_thuc = todayApiDate();
        updates.push(statusPayload);
      }
      if (!updates.length) {
        var emptyModal = statusModalInstance();
        if (emptyModal) emptyModal.hide();
        return;
      }
      $saveStatus.prop('disabled', true);
      showLoading(true);
      var lastData = null;
      var runUpdate = function (index) {
        if (index >= updates.length) {
          invalidateContCandidateCache();
          markForceReloadList();
          if (lastData) populateEdit(lastData);
          var modal = statusModalInstance();
          if (modal) modal.hide();
          if (notyf) notyf.success('Đã cập nhật trạng thái');
          if (typeof loadList === 'function' && $('#ke-hoach-list-app').length) loadList();
          $saveStatus.prop('disabled', false);
          showLoading(false);
          return;
        }
        $.ajax({
          url: '/api/quan-ly-cont/' + id,
          type: 'PUT',
          contentType: 'application/json; charset=utf-8',
          dataType: 'json',
          data: JSON.stringify(updates[index]),
          success: function (res) {
            if (!res || res.status !== 'success') {
              if (notyf) notyf.error((res && res.message) || 'Không cập nhật được trạng thái');
              $saveStatus.prop('disabled', false);
              showLoading(false);
              return;
            }
            lastData = res.data || lastData;
            runUpdate(index + 1);
          },
          error: function (jqXHR) {
            if (notyf) notyf.error(apiMsg(jqXHR));
            $saveStatus.prop('disabled', false);
            showLoading(false);
          }
        });
      };
      runUpdate(0);
    });
    $('#khxh-hang-cang-status-save-btn').off('click.khxhPortStatus').on('click.khxhPortStatus', function () {
      var $save = $(this);
      var id = parseInt($form('#nid-input').val(), 10) || 0;
      var nextStatus = String($('#khxh-hang-cang-status-select').val() || '');
      if (!id || !nextStatus) return;
      setPlanStatus(id, nextStatus, {
        $button: $save,
        silentSuccess: true,
        skipConfirm: true,
        onSuccess: function (res) {
          var updated = res && res.data ? res.data : {};
          var modal = hangCangStatusModalInstance();
          if (modal) modal.hide();
          markForceReloadList();
          editData = $.extend({}, editData || {}, updated, { nid: id, trang_thai_van_chuyen: nextStatus });
          updateCompleteButton(editData);
          if (notyf) notyf.success('Đã cập nhật trạng thái kế hoạch.');
        }
      });
    });
    $form('#complete-plan-btn').on('click', function () {
      var $btn = $(this);
      var id = parseInt($btn.attr('data-id') || $form('#nid-input').val(), 10) || 0;
      if (!id) return;
      if (currentPlanType() !== 'tuyen_xa') {
        var currentPortStatus = String((editData && editData.trang_thai_van_chuyen) || 'Chờ thực hiện');
        $('#khxh-hang-cang-status-select').html(planStatusOptions(currentPortStatus));
        var portStatusModal = hangCangStatusModalInstance();
        if (portStatusModal) portStatusModal.show();
        return;
      }
      if (currentPlanType() === 'tuyen_xa') {
        var nextMainDone = $btn.attr('data-main-work-done') === '1' ? 0 : 1;
        var runMainWorkUpdate = function () {
          $btn.prop('disabled', true);
          $.ajax({
            url: '/api/quan-ly-cont/' + id,
            type: 'PUT',
            contentType: 'application/json; charset=utf-8',
            dataType: 'json',
            data: JSON.stringify({ hoan_thanh_cong_viec_chinh: nextMainDone }),
            success: function (res) {
              if (!res || res.status !== 'success') {
                if (notyf) notyf.error((res && res.message) || 'Không cập nhật được công việc chính');
                return;
              }
              invalidateContCandidateCache();
              markForceReloadList();
              if (notyf) notyf.success(nextMainDone ? 'Đã hoàn thành công việc chính' : 'Đã mở lại công việc chính');
              if (res.data) populateEdit(res.data);
              if (typeof loadList === 'function' && $('#ke-hoach-list-app').length) loadList();
            },
            error: function (jqXHR) {
              if (notyf) notyf.error(apiMsg(jqXHR));
            },
            complete: function () { $btn.prop('disabled', false); }
          });
        };
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: nextMainDone ? 'Hoàn thành công việc?' : 'Mở lại công việc?',
            text: nextMainDone ? 'Vị trí cont sẽ được chuyển tới điểm kết thúc của công việc này.' : 'Vị trí cont chỉ được đưa về điểm đầu nếu chưa có công việc tiếp theo.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Xác nhận',
            cancelButtonText: 'Huỷ',
            customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
            buttonsStyling: false
          }).then(function (result) { if (result.isConfirmed) runMainWorkUpdate(); });
        } else if (confirm(nextMainDone ? 'Hoàn thành công việc chính?' : 'Mở lại công việc chính?')) {
          runMainWorkUpdate();
        }
        return;
      }
      var isComplete = editData && String(editData.trang_thai_van_chuyen || '') === 'Hoàn thành';
      var nextStatus = isComplete ? 'Chưa xếp xe' : 'Hoàn thành';
      setPlanStatus(id, nextStatus, {
        $button: $btn,
        onSuccess: function (res, payload) {
          var updated = res && res.data ? res.data : {};
          var ngayKetThuc = typeof updated.ngay_ket_thuc !== 'undefined' ? updated.ngay_ket_thuc : (editData ? editData.ngay_ket_thuc : '');
          markForceReloadList();
          if (editData) {
            editData.trang_thai_van_chuyen = nextStatus;
            editData.ngay_ket_thuc = ngayKetThuc || '';
          }
          setDateInputValue($form('.line-ngay-ket-thuc-input'), ngayKetThuc || '');
          updateCompleteButton($.extend({}, editData || {}, { nid: id, trang_thai_van_chuyen: nextStatus, ngay_ket_thuc: ngayKetThuc || '' }));
        }
      });
    });
    $form('#ke-hoach-form').on('keydown', function (e) {
      if (e.which === 13 && !$(e.target).is('textarea')) {
        e.preventDefault();
        $form('#save-btn').trigger('click');
      }
    });
    $form('#save-btn').on('click', function () {
      if (!reportPortCreateRequiredValidity()) return;
      if (!validateForm()) return;
      if (planType !== 'tuyen_xa' && Drupal.keHoachChiPhi && typeof Drupal.keHoachChiPhi.validatePortTab === 'function' && !Drupal.keHoachChiPhi.validatePortTab()) return;
      showLoading(true);
      var nid = $form('#nid-input').val();
      $.ajax({
        url: nid ? '/api/ke-hoach-xep-xe/' + nid : '/api/ke-hoach-xep-xe',
        method: nid ? 'PUT' : 'POST',
        contentType: 'application/json',
        data: JSON.stringify(nid ? gatherEditPayload() : gatherCreatePayload()),
        success: function (res) {
          if (res.status !== 'success') {
            showLoading(false);
            if (notyf) notyf.error(res.message || 'Lưu thất bại');
            return;
          }

          invalidateContCandidateCache();
          flushPendingContDestinationUpdates().done(function () {
            var hasEmbeddedCost = planType !== 'tuyen_xa' && Drupal.keHoachChiPhi && typeof Drupal.keHoachChiPhi.hasPortTab === 'function' && Drupal.keHoachChiPhi.hasPortTab();
            var costSave = hasEmbeddedCost && typeof Drupal.keHoachChiPhi.savePortTab === 'function'
              ? Drupal.keHoachChiPhi.savePortTab()
              : $.Deferred().resolve().promise();
            costSave.done(function () {
              showLoading(false);
              if (notyf) notyf.success(nid ? (hasEmbeddedCost ? 'Đã lưu kế hoạch và chi phí' : 'Đã cập nhật kế hoạch') : 'Đã tạo kế hoạch');
              if (nid) {
                markForceReloadList();
                if ($('#ke-hoach-edit-fullscreen-modal').hasClass('show') || $('#ke-hoach-tuyen-xa-edit-fullscreen-modal').hasClass('show')) {
                  if (typeof loadList === 'function' && $('#ke-hoach-list-app').length) loadList();
                }
              }
              if (nid) {
                if (res.data) {
                  populateEdit(res.data);
                }
              } else {
                if (formModal) formModal.hide();
                var formEl = $form('#ke-hoach-form')[0];
                if (formEl) formEl.reset();
                $form('#nid_khach_hang-input, .line-customer-select').val('0').trigger('change');
                state.lines = [];
                addLine({});
                if (typeof loadList === 'function' && $('#ke-hoach-list-app').length) loadList();
              }
            }).fail(function (error) {
              showLoading(false);
              if (notyf) notyf.error('Kế hoạch đã lưu nhưng chi phí chưa lưu: ' + (error && error.responseText ? apiMsg(error) : (error && error.message ? error.message : 'Vui lòng kiểm tra lại dữ liệu chi phí.')));
            });
          }).fail(function (jqXHR) {
            showLoading(false);
            if (notyf) notyf.error(apiMsg(jqXHR));
          });
        },
        error: function (jqXHR) {
          showLoading(false);
          if (notyf) notyf.error(apiMsg(jqXHR));
        }
      });
    });

    $(document).on('click', '.btn-open-vehicle-modal', function () {
      syncAllLines();
      openVehicleModal($(this).closest(useTableLayout ? '.ke-hoach-table-row' : '.ke-hoach-line-card').data('line-key'));
    });
	    $(document).on('click', '.btn-open-mooc-modal', function () {
	      syncAllLines();
	      openMoocModal($(this).closest(useTableLayout ? '.ke-hoach-table-row' : '.ke-hoach-line-card').data('line-key'));
	    });
	    $(document).on('click', '.btn-open-cont-ref-modal', function (e) {
	      var $btn = $(this);
	      if ($btn.prop('disabled') || $btn.hasClass('disabled')) {
	        e.preventDefault();
	        return;
	      }
	      syncAllLines();
	      openContRefModal($btn.attr('data-line-key') || $btn.closest('.ke-hoach-table-row').data('line-key'), 'source');
	    });
    $(document).on('click', '.btn-open-return-cont-modal', function (e) {
      e.preventDefault();
      syncAllLines();
      openContRefModal($(this).attr('data-line-key') || '', 'return');
    });
    $(document).on('click', '.btn-remove-return-cont', function (e) {
      e.preventDefault();
      var line = findLine($(this).attr('data-line-key') || '');
      if (!line) return;
      line.ket_hop = lineKetHop(null);
      renderRows();
    });
    $(document).on('click', '.btn-remove-row-ke-hoach', function () {
      var isPortCreate = !useTableLayout && currentPlanType() !== 'tuyen_xa' && mode !== 'edit';
      if (!useTableLayout && !isPortCreate) return;
      var key = (isPortCreate ? $(this).closest('.ke-hoach-line-card') : $(this).closest('.ke-hoach-table-row')).data('line-key');
      if (state.lines.length <= 1) {
        resetAllLines();
        return;
      }
      state.lines = $.grep(state.lines, function (line) { return line.key !== key; });
      renderRows();
    });
    $(document).on('click', '.btn-copy-row-ke-hoach', function () {
	      var isPortCreate = !useTableLayout && currentPlanType() !== 'tuyen_xa' && mode !== 'edit';
	      if (!useTableLayout && !isPortCreate) return;
	      var line = syncLine($(this).closest(isPortCreate ? '.ke-hoach-line-card' : '.ke-hoach-table-row'));
	      var copy = $.extend({}, line);
	      delete copy.key;
      copy.ke_hoach_cont_ref_nid = 0;
      copy.cont_ref_label = '';
      copy.cont_ref = null;
      copy.cont_keo_ve_tu = '';
      copy.cont_keo_ve_den = '';
      copy.cont_thuc_hien_tu_index = -1;
      copy.cont_thuc_hien_den_index = -1;
      copy.cont_thuc_hien_chang = [];
	      addLine(copy);
	    });
    $(document).on('click', '.btn-pick-vehicle', function () {
      selectVehicleForLine($(this).data('id'));
    });
	    $(document).on('change', 'input[name="vehicle-picker-radio"]', function () {
	      selectVehicleForLine($(this).val());
	    });
	    $(document).on('change', '.line-hinh-thuc-select', function () {
	      var isPortCreate = !useTableLayout && currentPlanType() !== 'tuyen_xa' && mode !== 'edit';
	      if (!useTableLayout && !isPortCreate) return;
	      var $row = isPortCreate ? $(this).closest('.ke-hoach-line-card') : $(this).closest('.ke-hoach-table-row');
	      var line = syncLine($row);
	      if (!line) return;
	      if (currentPlanType() !== 'tuyen_xa' && !shouldShowContPicker(line.hinh_thuc_van_tai)) {
	        clearPortReturnCont(line);
	      }
	      if (currentPlanType() === 'tuyen_xa') {
	        renderRows();
	        return;
	      }
      if (isPortCreate) {
        // Chỉ cập nhật dòng cont kéo về. Không render lại toàn bộ card vì
        // việc thay thế DOM làm modal mất phần tử đang giữ vị trí scroll.
        normalizePortCreateCard($row, line, $row.index());
        renderSelectedContRef($row, line);
        updatePortCreateCardTitle($row, line, $row.index());
      } else {
        updateContRefButton($row, line);
      }
	    });
    $(document).on('select2:open', '.line-hinh-thuc-select', function () {
      var $select = $(this);
      var $card = $select.closest('.khxh-port-create-section');
      activePortTransportSelect = $card.length && currentPlanType() !== 'tuyen_xa' && mode !== 'edit' ? $select : null;
    });
    $(document).on('select2:close', '.line-hinh-thuc-select', function () {
      var selectEl = this;
      window.setTimeout(function () {
        if (activePortTransportSelect && activePortTransportSelect[0] === selectEl) activePortTransportSelect = null;
      }, 0);
    });
    function queuePortTransportModalFromOption(optionEl) {
      if (!activePortTransportSelect || !activePortTransportSelect.length) return;
      var $select = activePortTransportSelect;
      var $card = $select.closest('.khxh-port-create-section');
      if (!$card.length) return;
      var optionText = ($(optionEl).text() || '').replace(/\s+/g, ' ').trim();
      var selectedValue = '';
      $select.find('option').each(function () {
        if (($(this).text() || '').replace(/\s+/g, ' ').trim() === optionText) {
          selectedValue = $(this).val() || '';
          return false;
        }
      });
      // Quyết định theo đúng option vừa bấm, không theo value cũ của Select2.
      // Nhờ vậy lần chọn đầu tiên cũng mở picker; chọn một loại khác thì không
      // bị mở nhầm theo hình thức đang chọn trước đó.
      if (!selectedValue || !shouldShowContPicker(normalizeHinhThuc(selectedValue))) {
        activePortTransportSelect = null;
        return;
      }
      // Chỉ đổi sang một hình thức khác mới bỏ cont cũ. Bấm lại đúng option
      // đang chọn là thao tác xem/đổi cont, vì vậy phải giữ lựa chọn hiện tại.
      var currentTransport = normalizeHinhThuc($select.val());
      var nextTransport = normalizeHinhThuc(selectedValue);
      if (currentTransport !== nextTransport) clearPortReturnCont(syncLine($card));
      if (activePortTransportTimer) window.clearTimeout(activePortTransportTimer);
      activePortTransportTimer = window.setTimeout(function () {
        activePortTransportTimer = null;
        // Select2 cập nhật value sau pointerdown. Với option được phép mở
        // cont, set trực tiếp value vừa click để lần chọn đầu cũng chính xác.
        $select.val(selectedValue).trigger('change');
        var line = syncLine($card);
        if (line && shouldShowContPicker(line.hinh_thuc_van_tai)) {
          renderSelectedContRef($card, line);
          openContRefModal(line.key, 'source');
        }
      }, 0);
      activePortTransportSelect = null;
    }
    $(document).on('mousedown', '.select2-results__option', function () {
      queuePortTransportModalFromOption(this);
    });
    window.__khxhPortTransportOptionHandler = queuePortTransportModalFromOption;
    if (!document.__khxhPortTransportPointerBound) {
      document.__khxhPortTransportPointerBound = true;
      document.addEventListener('pointerdown', function (event) {
        var target = event.target;
        while (target && target !== document.body) {
          if (target.classList && target.classList.contains('select2-results__option')) {
            if (typeof window.__khxhPortTransportOptionHandler === 'function') {
              window.__khxhPortTransportOptionHandler(target);
            }
            return;
          }
          target = target.parentNode;
        }
      }, true);
    }
	    $(document).on('click', '.line-hinh-thuc-radio', function () {
      var $radio = $(this);
      var $card = $radio.closest('.ke-hoach-line-card');
      if ($radio.data('current') === 1) {
        $radio.prop('checked', false);
        $radio.data('current', 0);
        $radio.closest('.line-hinh-thuc-option').removeClass('is-active');
      } else {
        $card.find('.line-hinh-thuc-radio').data('current', 0);
        $card.find('.line-hinh-thuc-option').removeClass('is-active');
        $radio.data('current', 1);
        $radio.closest('.line-hinh-thuc-option').addClass('is-active');
      }
      var line = syncLine($card);
      if (line && currentPlanType() === 'tuyen_xa' && !isExecutionPlan(line) && line.hinh_thuc_van_tai === 'dong_hang') {
        line.bai_ha_tam_1_enabled = 0;
        line.bai_ha_tam_1 = '';
      }
      if (line && currentPlanType() !== 'tuyen_xa' && !shouldShowContPicker(line.hinh_thuc_van_tai)) {
        line.ke_hoach_cont_ref_nid = 0;
        line.cont_ref_label = '';
        line.cont_ref = null;
        line.cont_keo_ve_tu = '';
        line.cont_keo_ve_den = '';
        line.cont_thuc_hien_tu_index = -1;
        line.cont_thuc_hien_den_index = -1;
        line.cont_thuc_hien_chang = [];
      }
      if (line && currentPlanType() === 'tuyen_xa' && !returnContApplicable(line)) {
        line.ket_hop = lineKetHop(null);
      }
      renderSelectedContRef($card, line);
      updateTuyenXaSidebar();
      if (currentPlanType() === 'tuyen_xa') renderRows();
    });
	    $(document).on('input', '.line-cont-filter-bkg, .line-cont-filter-cont', function () {
	      var key = $(this).closest('.line-cont-picker-wrap').data('line-key');
	      var $card = getLineElementByKey(key);
	      var line = syncLine($card);
	      renderContCandidateRows(line, $card);
	    });
    $(document).on('change', '.line-cont-filter-kho, .line-cont-filter-du-hang', function () {
	      var key = $(this).closest('.line-cont-picker-wrap').data('line-key');
	      var $card = getLineElementByKey(key);
	      var line = syncLine($card);
      renderContCandidateRows(line, $card);
    });
    $(document).on('change', '.line-cont-ref-checkbox', function () {
      var $checkbox = $(this);
      var key = $checkbox.closest('.line-cont-picker-wrap').data('line-key');
      var $card = getLineElementByKey(key);
      var line = syncLine($card);
      var selectedId = $checkbox.is(':checked') ? (parseInt($checkbox.attr('data-id'), 10) || 0) : 0;
      var $picker = $checkbox.closest('.line-cont-picker-wrap');
      $picker.data('pending-cont-id', selectedId);
      if (selectedId && currentPlanType() === 'tuyen_xa') {
        var selectedItem = findContCandidate($card, selectedId);
        var startIndex = contCurrentPointIndex(selectedItem);
        if (startIndex < 0) startIndex = 0;
        $picker.data('pending-cont-start', startIndex);
        $picker.data('pending-cont-end', startIndex + 1);
      }
      renderContCandidateRows(line, $card);
    });
    $(document).on('change', '.line-cont-return-requirement', function () {
      var $input = $(this);
      var $picker = $input.closest('.line-cont-picker-wrap');
      var requirement = $input.attr('data-requirement') || '';
      if (!requirement) return;
      if (currentPlanType() !== 'tuyen_xa') {
        var id = parseInt($input.attr('data-id'), 10) || 0;
        if (id) {
          $picker.data('pending-cont-id', id);
          $picker.find('.line-cont-ref-checkbox[data-id="' + id + '"]').prop('checked', true);
        }
      }
      $picker.data('pending-cont-' + requirement, $input.is(':checked') ? 1 : 0);
      if (currentPlanType() !== 'tuyen_xa') {
        var key = $picker.data('line-key');
        var $card = getLineElementByKey(key);
        renderContCandidateRows(syncLine($card), $card);
      }
    });
    $(document).on('change', '.line-cont-return-seal-phu', function () {
      var $input = $(this);
      var $picker = $input.closest('.line-cont-picker-wrap');
      if (currentPlanType() !== 'tuyen_xa') {
        var id = parseInt($input.attr('data-id'), 10) || 0;
        if (id) {
          $picker.data('pending-cont-id', id);
          $picker.find('.line-cont-ref-checkbox[data-id="' + id + '"]').prop('checked', true);
        }
      }
      $picker.data('pending-cont-seal-phu', $input.is(':checked') ? 1 : 0);
      if (currentPlanType() !== 'tuyen_xa') {
        var key = $picker.data('line-key');
        var $card = getLineElementByKey(key);
        renderContCandidateRows(syncLine($card), $card);
      }
    });
    $(document).on('change', '.line-cont-route-start, .line-cont-route-end', function () {
      var $picker = $(this).closest('.line-cont-picker-wrap');
      var key = $picker.data('line-key');
      var $card = getLineElementByKey(key);
      var line = syncLine($card);
      if ($(this).hasClass('line-cont-route-start')) {
        var start = parseInt($(this).val(), 10);
        $picker.data('pending-cont-start', start);
        var end = parseInt($picker.data('pending-cont-end'), 10);
        if (isNaN(end) || end <= start) $picker.data('pending-cont-end', start + 1);
      } else {
        $picker.data('pending-cont-end', parseInt($(this).val(), 10));
      }
      renderContCandidateRows(line, $card);
    });
    $(document).on('click', '.cont-picker-row', function (e) {
      if ($(e.target).closest('input, select, textarea, button, a, label, .select2-container').length) return;
      var rowEl = this;
      // Chờ ngắn để trình duyệt hoàn thành thao tác kéo/double-click bôi đen
      // text. Khi có vùng text được chọn, tuyệt đối không đổi cont.
      if (contPickerRowClickTimer) window.clearTimeout(contPickerRowClickTimer);
      contPickerRowClickTimer = window.setTimeout(function () {
        contPickerRowClickTimer = null;
        if (!document.documentElement.contains(rowEl)) return;
        var selection = window.getSelection ? String(window.getSelection()) : '';
        if (selection.trim()) return;
        var $row = $(rowEl);
        var $radio = $row.find('.line-cont-ref-checkbox');
        if (!$radio.length) return;
        var $picker = $row.closest('.line-cont-picker-wrap');
        var key = $picker.data('line-key');
        var $card = getLineElementByKey(key);
        var line = syncLine($card);
        if ($radio.is(':checked')) {
          $radio.prop('checked', false);
          $picker.data('pending-cont-id', 0);
          renderContCandidateRows(line, $card);
          return;
        }
        $radio.prop('checked', true).trigger('change');
      }, 320);
    });
    $(document).on('click', '#cont-ref-picker-confirm-btn, #port-cont-ref-picker-confirm-btn', function () {
      var $picker = $(this).closest('.modal').find('.line-cont-picker-wrap').first();
      var key = $picker.data('line-key');
      var $card = getLineElementByKey(key);
      var line = syncLine($card);
      if (!line) return;
      var selectedId = parseInt($picker.data('pending-cont-id'), 10) || 0;
      if (!selectedId) {
        // Riêng hàng cảng, bỏ chọn cont kéo về là trạng thái hợp lệ. Tuyến xa
        // vẫn phải chọn kế hoạch nguồn/chặng theo các validation hiện có.
        if (currentPlanType() !== 'tuyen_xa' && activeContPickerMode === 'source') {
          clearPortReturnCont(line);
          renderSelectedContRef($card, line);
          $form('#ke-hoach-form-app').data('khxh-port-plan-draft', $.extend(true, {}, editData || {}, line));
          if (Drupal.keHoachChiPhi && typeof Drupal.keHoachChiPhi.updatePortPlanDraft === 'function') {
            Drupal.keHoachChiPhi.updatePortPlanDraft(line);
          }
          if (contRefModal) contRefModal.hide();
          if (notyf) notyf.success('Đã bỏ chọn cont kéo về');
          return;
        }
        if (notyf) notyf.error(activeContPickerMode === 'return' ? 'Vui lòng chọn cont kéo về' : 'Vui lòng chọn kế hoạch nguồn');
        return;
      }
      var selectedItem = findContCandidate($card, selectedId);
      if (!selectedItem) {
        if (notyf) notyf.error('Không tìm thấy dữ liệu cont đã chọn');
        return;
      }
      var selectedPoints = tuyenXaRoutePoints(selectedItem);
      var selectedStart = currentPlanType() === 'tuyen_xa' ? parseInt($picker.data('pending-cont-start'), 10) : -1;
      var selectedEnd = currentPlanType() === 'tuyen_xa' ? parseInt($picker.data('pending-cont-end'), 10) : -1;
      if (currentPlanType() === 'tuyen_xa' && (isNaN(selectedStart) || isNaN(selectedEnd) || selectedStart < 0 || selectedEnd <= selectedStart || !selectedPoints[selectedEnd])) {
        if (notyf) notyf.error('Vui lòng chọn đúng điểm bắt đầu và điểm kết thúc');
        return;
      }
      if (currentPlanType() === 'tuyen_xa' && activeContPickerMode === 'source' && (selectedEnd - selectedStart > 2 || (selectedEnd - selectedStart === 2 && (!selectedPoints[selectedStart + 1] || selectedPoints[selectedStart + 1].key !== 'kho')))) {
        if (notyf) notyf.error('Công việc đóng hàng phải gồm đúng 3 điểm và điểm giữa là Kho');
        return;
      }
      if (currentPlanType() === 'tuyen_xa' && activeContPickerMode === 'return') {
        var expectedStartLocation = mainWorkEndLocation(line);
        if (!selectedPoints[selectedStart] || selectedPoints[selectedStart].value !== expectedStartLocation) {
          if (notyf) notyf.error('Điểm bắt đầu cont kéo về phải trùng điểm kết thúc công việc chính');
          return;
        }
        line.ket_hop = {
          enabled: 1,
          ke_hoach_cont_ref_nid: selectedId,
          cont_thuc_hien_tu_index: selectedStart,
          cont_thuc_hien_den_index: selectedEnd,
          cont_keo_ve_tu: selectedPoints[selectedStart].value,
          cont_keo_ve_den: selectedPoints[selectedEnd].value,
          hoan_thanh: 0,
          cont_ref: selectedItem
        };
        if (contRefModal) contRefModal.hide();
        renderRows();
        if (notyf) notyf.success('Đã chọn cont kéo về: ' + (selectedItem.so_cont || ('#' + selectedId)));
        return;
      }
      line.ke_hoach_cont_ref_nid = selectedId;
      // Selecting a source is the unambiguous signal that this plan is
      // performing a leg of another plan. The role is therefore derived from
      // the relation instead of relying only on the radio choice.
      if (currentPlanType() === 'tuyen_xa') line.vai_tro_ke_hoach = 'thuc_hien_chang';
      line.cont_ref_label = selectedItem.so_cont || '';
      line.cont_ref = selectedItem;
      if (currentPlanType() !== 'tuyen_xa') {
        line.cont_keo_ve_seal_phu = $picker.data('pending-cont-seal-phu') ? 1 : 0;
        line.cont_keo_ve_kiem_dich = $picker.data('pending-cont-kiem-dich') ? 1 : 0;
        line.cont_keo_ve_kiem_hoa = $picker.data('pending-cont-kiem-hoa') ? 1 : 0;
        line.cont_keo_ve_hun_trung = $picker.data('pending-cont-hun-trung') ? 1 : 0;
      }
      line.cont_thuc_hien_tu_index = selectedStart;
      line.cont_thuc_hien_den_index = selectedEnd;
      line.cont_thuc_hien_chang = currentPlanType() === 'tuyen_xa' ? tuyenXaRouteSegments(selectedItem).slice(selectedStart, selectedEnd) : [];
      line.cont_keo_ve_tu = currentPlanType() === 'tuyen_xa' ? selectedPoints[selectedStart].value : (contCurrentLocation(selectedItem) || '');
      line.cont_keo_ve_den = currentPlanType() === 'tuyen_xa' ? selectedPoints[selectedEnd].value : (contNextLocation(selectedItem) || '');
      if (currentPlanType() === 'tuyen_xa') {
        applySourcePlanFields(line, selectedItem);
        if (selectedEnd - selectedStart === 2) line.hinh_thuc_van_tai = 'dong_hang';
        else if (line.hinh_thuc_van_tai === 'dong_hang') line.hinh_thuc_van_tai = '';
      }
      updateContRefButton($card, line);
      renderSelectedContRef($card, line);
      $form('#ke-hoach-form-app').data('khxh-port-plan-draft', $.extend(true, {}, editData || {}, line));
      if (currentPlanType() !== 'tuyen_xa' && Drupal.keHoachChiPhi && typeof Drupal.keHoachChiPhi.updatePortPlanDraft === 'function') {
        Drupal.keHoachChiPhi.updatePortPlanDraft(line);
      }
      updateTuyenXaSidebar();
      if (contRefModal) contRefModal.hide();
      if (currentPlanType() === 'tuyen_xa') renderRows();
      if (currentPlanType() === 'tuyen_xa') {
        // Candidate rows are intentionally light-weight. Reload the source
        // detail so fields remain correct even when the list response omits
        // customer/cargo metadata.
        $.getJSON('/api/quan-ly-cont/' + selectedId, function (res) {
          if (!res || res.status !== 'success' || !res.data) return;
          var currentLine = findLine(line.key);
          if (!currentLine || (parseInt(currentLine.ke_hoach_cont_ref_nid, 10) || 0) !== selectedId) return;
          currentLine.cont_ref = res.data;
          applySourcePlanFields(currentLine, res.data);
          currentLine.cont_thuc_hien_chang = tuyenXaRouteSegments(res.data).slice(selectedStart, selectedEnd);
          renderRows();
        });
      }
      if (notyf) notyf.success((currentPlanType() === 'tuyen_xa' ? 'Đã chọn kế hoạch nguồn: ' : 'Đã chọn cont kéo về: ') + (selectedItem.so_cont || ('#' + selectedId)));
    });
    $(document).on('click', '.btn-remove-cont-ref', function (e) {
      e.preventDefault();
      var key = $(this).attr('data-line-key') || '';
      var $card = getLineElementByKey(key);
      var line = syncLine($card);
      if (!line) return;
      line.ke_hoach_cont_ref_nid = 0;
      line.cont_ref_label = '';
      line.cont_ref = null;
      line.cont_keo_ve_tu = '';
      line.cont_keo_ve_den = '';
      line.cont_thuc_hien_tu_index = -1;
      line.cont_thuc_hien_den_index = -1;
      line.cont_thuc_hien_chang = [];
      updateContRefButton($card, line);
      renderSelectedContRef($card, line);
      $form('#ke-hoach-form-app').data('khxh-port-plan-draft', $.extend(true, {}, editData || {}, line));
      if (currentPlanType() !== 'tuyen_xa' && Drupal.keHoachChiPhi && typeof Drupal.keHoachChiPhi.updatePortPlanDraft === 'function') {
        Drupal.keHoachChiPhi.updatePortPlanDraft(line);
      }
      updateTuyenXaSidebar();
    });
    $(document).on('change', '.line-bai-ha-theo-ke-hoach-checkbox', function () {
	      var $checkbox = $(this);
	      var $picker = $checkbox.closest('.line-cont-picker-wrap');
	      var key = $picker.data('line-key');
	      var $card = getLineElementByKey(key);
      var contId = parseInt($checkbox.data('id'), 10) || 0;
      if (!contId) return;
      if ($checkbox.is(':checked')) {
        stageContBaiHaThucTe($card, contId, '');
        return;
      }
      var $select = $checkbox.closest('.cont-picker-destination-cell').find('.line-bai-ha-thuc-te-select');
      if ($select.data('select2')) $select.select2('open');
      else $select.focus();
    });
    $(document).on('change', '.line-cont-picker-wrap .line-bai-ha-thuc-te-select', function () {
	      var $select = $(this);
	      var $picker = $select.closest('.line-cont-picker-wrap');
	      var key = $picker.data('line-key');
	      var $card = getLineElementByKey(key);
      var contId = parseInt($select.data('id'), 10) || 0;
      var planned = ($select.attr('data-planned') || '').trim();
      var value = ($select.val() || '').trim();
      if (!contId) return;
      stageContBaiHaThucTe($card, contId, normalizeBaiHaThucTe(value, planned));
    });
    $(document).on('change blur', '.cont-inline-note', function () {
      var $input = $(this);
      var id = parseInt($input.data('id'), 10) || 0;
      if (!id) return;
      var $picker = $input.closest('.line-cont-picker-wrap');
      var $card = getLineElementByKey($picker.data('line-key'));
      var note = $input.val().trim();
      if ($input.data('last-saved-note') === note || $input.data('pending-note') === note) return;
      $input.data('pending-note', note);
      $input.removeClass('is-saved').addClass('is-saving');
      $.ajax({
        url: '/api/quan-ly-cont/' + id,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ ghi_chu: note }),
        dataType: 'json'
      }).done(function (res) {
        if (res && res.status === 'success') {
          updateContCandidateItem($card, id, { ghi_chu: note });
          $input.removeData('pending-note').data('last-saved-note', note);
          $input.removeClass('is-saving').addClass('is-saved');
          window.setTimeout(function () { $input.removeClass('is-saved'); }, 1200);
          return;
        }
        $input.removeData('pending-note');
        $input.removeClass('is-saving');
        if (notyf) notyf.error((res && res.message) || 'Không lưu được ghi chú cont');
      }).fail(function (jqXHR) {
        $input.removeData('pending-note');
        $input.removeClass('is-saving');
        if (notyf) notyf.error(apiMsg(jqXHR));
      });
    });
    $(document).on('click', '#vehicle-picker-clear-btn', function () {
      clearVehicleForActiveLine();
    });
	    $(document)
        .off('show.bs.modal', '#vehicle-picker-modal')
        .on('show.bs.modal', '#vehicle-picker-modal', function () {
          $(this).css('z-index', '200000');
          setTimeout(function () {
            $('.modal-backdrop').last().css('z-index', '199999');
          }, 0);
        });
	    $(document).off('hidden.bs.modal', '#vehicle-picker-modal').on('hidden.bs.modal', '#vehicle-picker-modal', function () {
	      var placeholder = this.__vehiclePickerPlaceholder;
	      if (placeholder && placeholder.parentNode) {
	        placeholder.parentNode.insertBefore(this, placeholder.nextSibling);
	        placeholder.parentNode.removeChild(placeholder);
	        this.__vehiclePickerPlaceholder = null;
	      }
	      $(this).css('z-index', '');
	      $('.modal-backdrop').last().css('z-index', '');
	      if ($('#ke-hoach-edit-fullscreen-modal').hasClass('show') || $('#ke-hoach-tuyen-xa-edit-fullscreen-modal').hasClass('show')) {
	        $('body').addClass('modal-open');
	      }
	    });
	    $(document)
	      .off('show.bs.modal', '#cont-ref-picker-modal, #port-cont-ref-picker-modal')
	      .on('show.bs.modal', '#cont-ref-picker-modal, #port-cont-ref-picker-modal', function () {
        $(this).css('z-index', '200000');
        setTimeout(function () {
          $('.modal-backdrop').last().css('z-index', '199999');
        }, 0);
	      });
	    $(document)
	      .off('hidden.bs.modal', '#cont-ref-picker-modal, #port-cont-ref-picker-modal')
	      .on('hidden.bs.modal', '#cont-ref-picker-modal, #port-cont-ref-picker-modal', function () {
        activeContPickerLineKey = null;
        $(this).find('.line-cont-picker-wrap').removeData('pending-cont-id').removeData('saved-cont-id');
        var placeholder = this.__contRefPickerPlaceholder;
        if (placeholder && placeholder.parentNode) {
          placeholder.parentNode.insertBefore(this, placeholder.nextSibling);
          placeholder.parentNode.removeChild(placeholder);
          this.__contRefPickerPlaceholder = null;
        }
        $(this).css('z-index', '');
        $('.modal-backdrop').last().css('z-index', '');
	        if ($('#ke-hoach-fullscreen-modal').hasClass('show') || $('#ke-hoach-edit-fullscreen-modal').hasClass('show') || $('#ke-hoach-tuyen-xa-edit-fullscreen-modal').hasClass('show')) {
	          $('body').addClass('modal-open');
	        }
	      });

	    var modalEl = $form('#ke-hoach-fullscreen-modal')[0];
	    // The tuyến xa create form uses the card layout (without the legacy
	    // #ke-hoach-lines-body table).  The modal must still be initialized so
	    // its first card/inputs are rendered when the user opens it.
	    if (modalEl) {
      formModal = new bootstrap.Modal(modalEl);
      modalEl.addEventListener('show.bs.modal', function () {
        showLoading(true);
        loadDropdowns(function () {
          try {
            if (!$form('#nid-input').val()) {
              var formEl = $form('#ke-hoach-form')[0];
              if (formEl) formEl.reset();
              state.lines = [];
              addLine({});
            }
          } catch (err) {
            if (notyf) notyf.error('Không khởi tạo được form tạo kế hoạch');
          } finally {
            showLoading(false);
          }
        });
      });
    }

    if (mode === 'edit') {
      showLoading(true);
      loadDropdowns(function () {
        try {
          initSelect2($form('#nid_khach_hang-input')[0], '— Chọn khách hàng —', { dropdownParent: formDropdownParent() });
          attachCustomerCreateOption($form('#nid_khach_hang-input'));
          loadEditDetail(function (row) {
            try {
              if (row) {
                populateEdit(row);
              }
            } catch (err) {
              if (notyf) notyf.error('Không hiển thị được form sửa kế hoạch');
            } finally {
              window.setTimeout(function () {
                showLoading(false);
                if (nestedContRestorePending && nestedContRestorePending.parentId === (parseInt($form('#nid-input').val(), 10) || 0)) {
                  var $card = useTableLayout ? $form('#ke-hoach-lines-body .ke-hoach-table-row').first() : $form('#ke-hoach-lines .ke-hoach-line-card').first();
                  var line = $card.length ? syncLine($card) : null;
                  if (line) {
                    state.contCandidateCache = {};
                    $card.removeData('contCandidates').removeData('contCandidatesCacheKey').removeData('contCandidatesLoaded');
                    renderSelectedContRef($card, line);
                  }
                  nestedContRestorePending = null;
                }
                $(document).trigger('keHoachEditReady');
              }, 0);
            }
          });
        } catch (err) {
          if (notyf) notyf.error('Không khởi tạo được form sửa kế hoạch');
          showLoading(false);
          $(document).trigger('keHoachEditReady');
        }
      });
    }
  }

  function initContList() {
    if (initContList._bound) return;
    initContList._bound = true;
    var contMode = (Drupal.settings.ke_hoach_cont && Drupal.settings.ke_hoach_cont.mode) || ($('#ke-hoach-cont-app').data('mode')) || 'overall';

    function loadCustomers() {
      $.getJSON('/api/khach-hang', { limit: 500 }, function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          var html = '<option value="">Khách hàng</option>';
          for (var i = 0; i < res.data.items.length; i++) {
            html += '<option value="' + res.data.items[i].nid + '">' + escHtml(res.data.items[i].ten || '') + '</option>';
          }
          $('#cont-filter-khach-hang').html(html);
        }
      });
    }

    function loadConts() {
      var params = {
        keyword: $('#cont-keyword').val().trim(),
        nid_khach_hang: $('#cont-filter-khach-hang').val() || '',
        da_du_hang: $('#cont-filter-du-hang').val() || ''
      };
      if (contMode === 'cat_mooc') {
        params.da_cat_mooc = 1;
      }
      $('#cont-list-body').html('<tr><td colspan="11" class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Đang tải dữ liệu...</td></tr>');
      $.getJSON('/api/quan-ly-cont', params, function (res) {
        if (res.status !== 'success' || !res.data) {
          $('#cont-list-body').html('<tr><td colspan="11" class="text-center text-danger">Không tải được dữ liệu</td></tr>');
          return;
        }
        var items = res.data.items || [];
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var daDuHang = parseInt(item.da_du_hang, 10) === 1;
          if (contMode === 'cat_mooc') {
            var hinhThucBadge = item.hinh_thuc_van_tai ? '<span class="badge ' + hinhThucColor(item.hinh_thuc_van_tai) + '">' + escHtml(hinhThucLabel(item.hinh_thuc_van_tai)) + '</span>' : '';
            var khName = item.khach_hang && item.khach_hang.ten ? item.khach_hang.ten : '';
            var contHtml = item.loai_cont ? escHtml(item.loai_cont) : '';
            if (item.so_cont) {
              contHtml += (contHtml ? ' - ' : '') + escHtml(item.so_cont);
            }
            html += '<tr data-id="' + item.nid + '">' +
              '<td>' + (i + 1) + '</td>' +
              '<td class="khxh-date-cell">' + formatDateBadge(item.created) + '</td>' +
              '<td class="khxh-common-cell">' +
                '<div class="khxh-customer-cell">' + (khName ? escHtml(khName) : '<span class="text-muted fst-italic small">khách hàng</span>') + '</div>' +
                '<div class="khxh-htvt-cell">' +
                  (item.hinh_thuc_status_text ? '<div class="khxh-htvt-status">' + escHtml(item.hinh_thuc_status_text) + '</div>' : '') +
                  (hinhThucBadge ? '<div class="khxh-htvt-badge-wrap">' + hinhThucBadge + '</div>' : '') +
                '</div>' +
              '</td>' +
              '<td class="khxh-bkg-cell">' + escHtml(item.so_bkg || '') + '</td>' +
              '<td class="khxh-container-cell">' +
                '<div>' + (contHtml || '<span class="text-muted fst-italic small">container</span>') + '</div>' +
                '<div>' + (item.so_seal_tam ? escHtml(item.so_seal_tam) : '<span class="text-muted fst-italic small">seal tạm</span>') + '</div>' +
                '<div>' + (item.so_seal_chinh ? escHtml(item.so_seal_chinh) : '<span class="text-muted fst-italic small">seal chính</span>') + '</div>' +
              '</td>' +
              '<td class="khxh-vehicle-cell">' + vehicleListInfoHtml(item) + '</td>' +
              '<td class="khxh-kho-cell">' + escHtml(item.dia_chi_kho || '') + '</td>' +
              '<td class="text-nowrap"><div class="khxh-hanh-trinh-cell"><div class="khxh-hanh-trinh-box">' + ((item.bai_lay_thuc_te || item.bai_lay_cont) ? escHtml(item.bai_lay_thuc_te || item.bai_lay_cont) : '<span class="text-muted fst-italic small">Chưa có</span>') + '</div><div class="khxh-hanh-trinh-separator"></div><div class="khxh-hanh-trinh-box">' + ((item.bai_ha_thuc_te || item.bai_ha_cont) ? escHtml(item.bai_ha_thuc_te || item.bai_ha_cont) : '<span class="text-muted fst-italic small">Chưa có</span>') + '</div></div></td>' +
              '<td class="khxh-cang-cell">' + escHtml(item.cang_xuat || '') + '</td>' +
              '<td class="khxh-date-cell">' + cutOffBadge(item.cut_off) + '</td>' +
              '<td class="khxh-status-cell text-center"><button type="button" class="btn btn-sm ' + (daDuHang ? 'btn-success' : 'btn-label-secondary') + ' cont-toggle-btn" data-field="da_du_hang">' + (daDuHang ? 'Đã đủ hàng' : 'Chưa đủ hàng') + '</button></td>' +
              '</tr>';
          } else {
            html += '<tr data-id="' + item.nid + '">' +
              '<td>' + (i + 1) + '</td>' +
              '<td>' + escHtml(item.khach_hang && item.khach_hang.ten ? item.khach_hang.ten : '') + '</td>' +
              '<td>' + escHtml(item.so_bkg || '') + '</td>' +
              '<td>' + escHtml(item.so_cont || '') + '</td>' +
              '<td class="text-center"><input type="checkbox" class="cont-toggle" data-field="da_du_hang"' + (daDuHang ? ' checked' : '') + '></td>' +
              '<td class="text-center"><input type="checkbox" class="cont-toggle" data-field="ha_bai_ngoai"' + (parseInt(item.ha_bai_ngoai, 10) === 1 ? ' checked' : '') + '></td>' +
              '<td class="text-center"><input type="checkbox" class="cont-toggle" data-field="ha_cang"' + (parseInt(item.ha_cang, 10) === 1 ? ' checked' : '') + '></td>' +
              '<td>' + escHtml(item.dia_chi_kho || '') + '</td>' +
              '<td>' + escHtml(item.hinh_thuc_status_text || '') + '</td>' +
              '<td>' + escHtml(item.trang_thai_cont || '') + '</td>' +
              '</tr>';
          }
        }
        $('#cont-list-body').html(html || '<tr><td colspan="' + (contMode === 'cat_mooc' ? '11' : '10') + '" class="text-center">Không có dữ liệu</td></tr>');
      }).fail(function () {
        $('#cont-list-body').html('<tr><td colspan="' + (contMode === 'cat_mooc' ? '11' : '10') + '" class="text-center text-danger">Không tải được dữ liệu</td></tr>');
      });
    }

    $(document).on('click', '#cont-search-btn', function () { loadConts(); });
    $(document).on('click', '#cont-reload-btn', function () {
      $('#cont-keyword').val('');
      $('#cont-filter-khach-hang').val('');
      $('#cont-filter-du-hang').val('');
      loadConts();
    });
    $(document).on('change', '.cont-toggle', function () {
      var $cb = $(this);
      var $tr = $cb.closest('tr');
      var id = $tr.data('id');
      var payload = {};
      payload[$cb.data('field')] = $cb.is(':checked') ? 1 : 0;
      $.ajax({ url: '/api/quan-ly-cont/' + id, type: 'PUT', contentType: 'application/json', data: JSON.stringify(payload), dataType: 'json' });
    });
    $(document).on('click', '.cont-toggle-btn', function () {
      var $btn = $(this);
      var $tr = $btn.closest('tr');
      var id = $tr.data('id');
      var nextVal = $btn.hasClass('btn-success') ? 0 : 1;
      var doUpdate = function () {
        $.ajax({
          url: '/api/quan-ly-cont/' + id,
          type: 'PUT',
          contentType: 'application/json',
          data: JSON.stringify({ da_du_hang: nextVal }),
          dataType: 'json',
          success: function () { loadConts(); }
        });
      };
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Xác nhận cập nhật',
          text: nextVal ? 'Chuyển cont này sang trạng thái đã đủ hàng?' : 'Chuyển cont này về trạng thái chưa đủ hàng?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xác nhận',
          cancelButtonText: 'Huỷ',
          customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
          buttonsStyling: false
        }).then(function (result) {
          if (result.isConfirmed) {
            doUpdate();
          }
        });
      } else if (confirm(nextVal ? 'Chuyển cont này sang trạng thái đã đủ hàng?' : 'Chuyển cont này về trạng thái updating.. ?')) {
        doUpdate();
      }
    });

    loadCustomers();
    loadConts();
  }

  function initDetail() {
    if (initDetail._bound) return;
    initDetail._bound = true;

    var nid = getNidFromUrl();
    if (!nid) {
      $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">ID không hợp lệ</td></tr>');
      return;
    }

    $.ajax({
      url: '/api/ke-hoach-xep-xe/' + nid,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (res.status !== 'success' || !res.data) {
          $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi tải dữ liệu') + '</td></tr>');
          return;
        }
        var d = res.data;
        var khName = customerPlanLabel(d.khach_hang);
        var lxName = (d.lai_xe && d.lai_xe.ten) || '';
        var lxSdt = (d.lai_xe && d.lai_xe.sdt) || '';
        var ptName = (d.phuong_tien && d.phuong_tien.bks) || '';
        var rows = [
          { label: 'Ngày lập KH', value: d.created ? d.created.substring(0, 16) : '' },
          { label: 'Khách hàng', value: khName },
          { label: 'Lái xe', value: lxName + (lxSdt ? ' - ' + lxSdt : '') },
          { label: 'Phương tiện', value: ptName },
          { label: 'Số BKG', value: d.so_bkg },
          { label: 'Địa chỉ kho', value: d.dia_chi_kho },
          { label: 'Loại cont', value: d.loai_cont },
          { label: 'Số cont', value: d.so_cont },
          { label: 'Số seal chính', value: d.so_seal_chinh },
          { label: 'Số seal tạm', value: d.so_seal_tam },
          { label: 'Trạng thái', value: d.trang_thai_van_chuyen },
          { label: 'Bãi lấy cont', value: d.bai_lay_cont },
          { label: 'Bãi lấy thực tế', value: d.bai_lay_thuc_te },
          { label: 'Bãi hạ cont', value: d.bai_ha_cont },
          { label: 'Bãi hạ thực tế', value: d.bai_ha_thuc_te },
          { label: 'Cảng xuất', value: d.cang_xuat },
          { label: 'Cut-off', value: apiToDatetime(d.cut_off) },
          { label: 'Ngày bắt đầu', value: apiToDate(d.ngay_bat_dau) },
          { label: 'Ngày kết thúc', value: apiToDate(d.ngay_ket_thuc) },
          { label: 'Hình thức vận tải', value: hinhThucLabel(d.hinh_thuc_van_tai) },
        ];
        var html = '';
        $.each(rows, function (i, r) {
          html += '<tr><th class="text-nowrap" style="width:180px;">' + r.label + '</th><td>' + escHtml(r.value || '') + '</td></tr>';
        });
        $('#detail-body').html(html);
        if (d.nid) {
          $('#edit-btn').attr('href', '/ke-hoach-xep-xe/' + d.nid + '/sua');
        }
      },
      error: function (jqXHR) {
        $('#detail-body').html('<tr><td colspan="2" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>');
      }
    });
  }

})(jQuery, Drupal);

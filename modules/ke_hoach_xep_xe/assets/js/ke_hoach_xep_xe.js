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

  var HINH_THUC_MAP = {
    cat_keo: 'Cắt kéo',
    cat_keo_cheo: 'Cắt kéo chéo',
    tha_mooc: 'Thả mooc',
    rut_mooc: 'Rút mooc',
    dong_hang_trong_ngay: 'Đóng hàng trong ngày'
  };
  var HINH_THUC_COLOR = {
    cat_keo: 'bg-label-success',
    cat_keo_cheo: 'bg-label-primary',
    tha_mooc: 'bg-label-warning',
    rut_mooc: 'bg-label-info',
    dong_hang_trong_ngay: 'bg-label-danger'
  };

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return r.message || 'Lỗi không xác định';
    } catch (e) {
      return 'Lỗi kết nối server';
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

  function apiToDate(val) {
    if (!val) return '';
    var d = String(val).split('-');
    return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : val;
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
      if (d.length === 3) return d[2] + '/' + d[1] + '/' + d[0] + ' ' + parts[1];
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
    return val;
  }

  function toDdMmYyyyHm(val) {
    if (!val) return '';
    var parts = String(val).split(' ');
    var d = parts[0] ? parts[0].split('-') : [];
    if (d.length !== 3) return val;
    return d[2] + '/' + d[1] + '/' + d[0] + (parts[1] ? ' ' + parts[1].substring(0, 5) : '');
  }

  function cutOffBadge(val) {
    if (!val) return '<span class="text-muted fst-italic small">cut-off</span>';
    var normalized = apiToDatetime(val);
    var d = parseCutOff(normalized);
    if (!d) return escHtml(val);
    var now = new Date();
    var diffMs = d - now;
    var diffDays = diffMs / (1000 * 60 * 60 * 24);
    var color;
    if (diffMs < 0) {
      color = 'bg-label-danger';
    } else if (diffDays <= 1) {
      color = 'bg-label-warning';
    } else {
      color = 'bg-label-success';
    }
    return '<span class="badge ' + color + '">' + toDdMmYyyyHm(val) + '</span>';
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
    if ($el.data('select2')) $el.select2('destroy');
    $el.select2($.extend({
      placeholder: placeholder || '— Chọn —',
      allowClear: true,
      width: '100%'
    }, options || {}));
  }

  Drupal.behaviors.keHoachXepXe = {
    attach: function (context) {
      syncPageSettings();
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }
      if ($('#ke-hoach-list-app', context).length) initList();
      if ($('#ke-hoach-form-app', context).length) initForm();
      if ($('#detail-body', context).length) initDetail();
    }
  };

  function buildActions(nid) {
    return '<div class="dropdown">' +
      '<button class="btn btn-sm btn-icon btn-label-secondary rounded-pill"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><button type="button" class="dropdown-item btn-view-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-eye me-2"></i>Xem</button></li>' +
      '<li><button type="button" class="dropdown-item btn-edit-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-edit me-2"></i>Sửa</button></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><button type="button" class="dropdown-item text-danger btn-delete-ke-hoach-xep-xe" data-id="' + nid + '"><i class="ti tabler-trash me-2"></i>Xoá</button></li>' +
      '</ul></div>';
  }

  function initList() {
    if (initList._bound) return;
    initList._bound = true;
    var doc = document;
    var filterEl = doc.getElementById('status-filter');
    if (filterEl) {
      for (var i = 0; i < statuses.length; i++) {
        var opt = doc.createElement('option');
        opt.value = statuses[i];
        opt.textContent = statuses[i];
        filterEl.appendChild(opt);
      }
    }

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
      currentKeyword = $('#search-input').val().trim();
      currentPage = 1;
      loadList();
    });
    $('#search-input').on('keypress', function (e) {
      if (e.which === 13) {
        currentKeyword = this.value.trim();
        currentPage = 1;
        loadList();
      }
    });
    if (filterEl) {
      filterEl.addEventListener('change', function () {
        currentStatus = this.value;
        currentPage = 1;
        loadList();
      });
    }
    $('.btn-reload').on('click', function () {
      currentKeyword = '';
      currentStatus = '';
      currentPage = 1;
      $('#search-input').val('');
      $('#status-filter').val('');
      loadList();
    });
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
      window.location.href = '/ke-hoach-xep-xe/' + $(this).data('id');
    });
    $(document).on('click', '.btn-edit-ke-hoach-xep-xe', function (e) {
      e.preventDefault();
      window.location.href = '/ke-hoach-xep-xe/' + $(this).data('id') + '/sua';
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
    $(document).on('click', '#pagination-wrap .page-link', function (e) {
      e.preventDefault();
      var page = parseInt($(this).data('page'), 10) || 0;
      if (page && page !== currentPage) {
        currentPage = page;
        loadList();
      }
    });

    doc.addEventListener('mouseover', function (e) {
      var dropdown = e.target.closest ? e.target.closest('.dropdown') : null;
      if (dropdown && dropdown.closest('#list-body')) {
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
      if (dropdown && dropdown.closest('#list-body')) {
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

    loadList();
  }

  function loadList() {
    var tbody = document.getElementById('list-body');
    tbody.innerHTML = '<tr id="loading-row"><td colspan="13" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>';
    var params = { page: currentPage };
    if (currentKeyword) params.keyword = currentKeyword;
    if (currentStatus) params.trang_thai_van_chuyen = currentStatus;
    $.ajax({
      url: '/api/ke-hoach-xep-xe',
      type: 'GET',
      dataType: 'json',
      data: params,
      success: function (res) {
        $('#loading-row').remove();
        if (res.status !== 'success' || !res.data) {
          tbody.innerHTML = '<tr><td colspan="13" class="text-center text-danger py-4">' + escHtml(res.message || 'Lỗi không xác định') + '</td></tr>';
          return;
        }
        var resp = res.data;
        var items = resp.items || [];
        var pageSize = resp.limit || 20;
        if (!items.length) {
          tbody.innerHTML = '<tr><td colspan="13" class="text-center py-4">Không có dữ liệu</td></tr>';
          renderPagination(resp);
          return;
        }
        var html = '';
        for (var i = 0; i < items.length; i++) {
          var row = items[i];
          var stt = (resp.current_page - 1) * pageSize + i + 1;
          var actions = buildActions(row.nid);
          var khName = (row.khach_hang && row.khach_hang.ten) || '';
          var lxName = (row.lai_xe && row.lai_xe.ten) || '';
          var ptBks = (row.phuong_tien && row.phuong_tien.bks) || '';
          html += '<tr>' +
            '<td class="text-center">' + actions + '</td>' +
            '<td>' + stt + '</td>' +
            '<td>' + formatDateBadge(row.created) + '</td>' +
            '<td><span class="badge ' + (HINH_THUC_COLOR[row.hinh_thuc_van_tai] || 'bg-label-secondary') + '">' + escHtml(HINH_THUC_MAP[row.hinh_thuc_van_tai] || '') + '</span></td>' +
            '<td>' + escHtml(khName) + '</td>' +
            '<td>' + escHtml(row.so_bkg || '') + '</td>' +
            '<td>' + escHtml(row.dia_chi_kho || '') + '</td>' +
            '<td style="line-height:1.6">' +
              (row.loai_cont ? escHtml(row.loai_cont) : '<span class="text-muted fst-italic small">loại cont</span>') + '<br>' +
              (row.so_cont ? escHtml(row.so_cont) : '<span class="text-muted fst-italic small">số cont</span>') + '<br>' +
              (row.so_seal_chinh ? escHtml(row.so_seal_chinh) : '<span class="text-muted fst-italic small">seal chính</span>') + '<br>' +
              (row.so_seal_tam ? escHtml(row.so_seal_tam) : '<span class="text-muted fst-italic small">seal tạm</span>') +
            '</td>' +
            '<td style="line-height:1.6">' +
              (ptBks ? escHtml(ptBks) : '<span class="text-muted fst-italic small">BKS</span>') + '<br>' +
              (lxName ? escHtml(lxName) : '<span class="text-muted fst-italic small">lái xe</span>') +
              (row.lai_xe && row.lai_xe.sdt ? ' - ' + escHtml(row.lai_xe.sdt) : '') +
            '</td>' +
            '<td class="text-nowrap" style="line-height:1.6">' +
              (row.bai_lay_cont ? escHtml(row.bai_lay_cont) : '<span class="text-muted fst-italic small">bãi lấy</span>') + '<br>' +
              (row.bai_ha_cont ? escHtml(row.bai_ha_cont) : '<span class="text-muted fst-italic small">bãi hạ</span>') +
            '</td>' +
            '<td>' + cutOffBadge(row.cut_off) + '</td>' +
            '<td>' + escHtml(row.cang_xuat || '') + '</td>' +
            '<td><span class="badge bg-label-info">' + escHtml(row.trang_thai_van_chuyen || '') + '</span></td>' +
            '</tr>';
        }
        tbody.innerHTML = html;
        renderPagination(resp);
      },
      error: function (jqXHR) {
        $('#loading-row').remove();
        tbody.innerHTML = '<tr><td colspan="13" class="text-center text-danger py-4">Lỗi tải dữ liệu</td></tr>';
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
    return '<span class="badge bg-label-info fw-normal">' + toDdMmYyyyHm(val) + '</span>';
  }

  function initForm() {
    if (initForm._bound) return;
    initForm._bound = true;

    var state = {
      customers: [],
      drivers: [],
      vehicles: [],
      vehicleMap: {},
      diaDiem: { bai: [], cang: [] },
      cauHinh: { diaChiKho: [], loaiCont: [] },
      lines: [],
      activeLineKey: null
    };
    var lineSeq = 0;
    var vehicleModal = null;

    function showLoading(show) {
      $('#form-loading').toggle(show);
      $('#save-btn, #add-line-btn').prop('disabled', show);
    }

    function nextLineKey() {
      lineSeq += 1;
      return 'line-' + lineSeq;
    }

    function todayDdMmYyyy() {
      var now = new Date();
      return String(now.getDate()).padStart(2, '0') + '/' + String(now.getMonth() + 1).padStart(2, '0') + '/' + now.getFullYear();
    }

    function findDriver(id) {
      id = parseInt(id, 10) || 0;
      for (var i = 0; i < state.drivers.length; i++) {
        if ((parseInt(state.drivers[i].nid, 10) || 0) === id) return state.drivers[i];
      }
      return null;
    }

    function findLine(key) {
      for (var i = 0; i < state.lines.length; i++) {
        if (state.lines[i].key === key) return state.lines[i];
      }
      return null;
    }

    function createLine(source) {
      return $.extend({
        key: nextLineKey(),
        nid_phuong_tien: 0,
        nid_lai_xe: 0,
        dia_chi_kho: '',
        loai_cont: '',
        so_cont: '',
        so_seal_chinh: '',
        so_seal_tam: '',
        bai_lay_cont: '',
        bai_ha_cont: '',
        cang_xuat: '',
        cut_off: '',
        hinh_thuc_van_tai: ''
      }, source || {});
    }

    function buildTagOptions(list, value) {
      var html = '<option value="">— Chọn —</option>';
      var seen = {};
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

    function buildDriverOptions(selectedId) {
      var html = '<option value="0">— Chọn lái xe —</option>';
      for (var i = 0; i < state.drivers.length; i++) {
        var item = state.drivers[i];
        html += '<option value="' + item.nid + '"' + ((parseInt(selectedId, 10) === parseInt(item.nid, 10)) ? ' selected' : '') + '>' + escHtml(item.ten || ('#' + item.nid)) + '</option>';
      }
      return html;
    }

    function buildHinhThucOptions(value) {
      var html = '<option value="">— Chọn —</option>';
      $.each(HINH_THUC_MAP, function (key, label) {
        html += '<option value="' + key + '"' + (key === value ? ' selected' : '') + '>' + escHtml(label) + '</option>';
      });
      return html;
    }

    function buildHinhThucRadios(line) {
      var html = '';
      $.each(HINH_THUC_MAP, function (key, label) {
        var checked = key === (line.hinh_thuc_van_tai || '') ? ' checked' : '';
        html += '<label class="form-check form-check-inline line-hinh-thuc-option">' +
          '<input class="form-check-input line-hinh-thuc-radio" type="radio" name="line-hinh-thuc-' + escHtml(line.key) + '" value="' + key + '"' + checked + '>' +
          '<span class="form-check-label">' + escHtml(label) + '</span>' +
        '</label>';
      });
      return html;
    }

    function vehicleSummary(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      if (!vehicle) {
        return '<div class="vehicle-summary-empty"></div>';
      }
      var text = vehicle.bks || ('#' + vehicle.nid);
      if (vehicle.loai_phuong_tien) {
        text += ' - ' + vehicle.loai_phuong_tien;
      }
      return '<div class="vehicle-summary-text">' + escHtml(text) + '</div>';
    }

    function lineHeaderMeta(line) {
      var vehicle = state.vehicleMap[String(line.nid_phuong_tien || 0)] || null;
      var driver = line.nid_lai_xe ? findDriver(line.nid_lai_xe) : (vehicle && vehicle.lai_xe ? vehicle.lai_xe : null);
      var parts = [];
      if (vehicle && vehicle.bks) parts.push(vehicle.bks);
      if (vehicle && vehicle.loai_phuong_tien) parts.push(vehicle.loai_phuong_tien);
      if (driver && driver.ten) parts.push(driver.ten);
      if (!parts.length) return '';
      return parts.join(' | ');
    }

    function getNgayValue() {
      var $ngay = $('#ngay-input');
      if (!$ngay.length) return '';
      return dateToApi(($ngay.val() || '').trim());
    }

    function renderEmpty() {
      $('#ke-hoach-lines-empty').toggle(!state.lines.length);
    }

    function initLineUi($card, line) {
      initSelect2($card.find('.line-driver-select')[0], '— Chọn lái xe —');
      initSelect2($card.find('.line-kho-select')[0], '— Chọn địa chỉ kho —', { tags: true });
      initSelect2($card.find('.line-loai-cont-select')[0], 'Chọn/Nhập loại cont', { tags: true });
      initSelect2($card.find('.line-bai-lay-select')[0], '— Chọn bãi lấy cont —');
      initSelect2($card.find('.line-bai-ha-select')[0], '— Chọn bãi hạ cont —');
      initSelect2($card.find('.line-cang-select')[0], '— Chọn cảng xuất —');
      if (typeof flatpickr !== 'undefined' && $card.find('.line-cut-off-input')[0]) {
        flatpickr($card.find('.line-cut-off-input')[0], {
          enableTime: true,
          dateFormat: 'd/m/Y H:i',
          time_24hr: true,
          allowInput: true,
          static: true
        });
      }
      $card.find('.vehicle-summary').toggleClass('is-selected', !!line.nid_phuong_tien).html(vehicleSummary(line));
      $card.find('.ke-hoach-line-meta').text(lineHeaderMeta(line));
    }

    function refreshOrder() {
      $('#ke-hoach-lines .ke-hoach-line-card').each(function (index) {
        $(this).find('.line-order').text('#' + (index + 1));
      });
    }

    function renderLine(line) {
      var removeBtn = mode === 'edit' ? '' : '<button type="button" class="btn btn-sm btn-icon btn-label-danger btn-remove-line" title="Xoá dòng" aria-label="Xoá dòng"><i class="ti tabler-trash"></i></button>';
      var copyBtn = mode === 'edit' ? '' : '<button type="button" class="btn btn-sm btn-icon btn-label-secondary btn-copy-line" title="Sao chép dòng" aria-label="Sao chép dòng"><i class="ti tabler-copy"></i></button>';
      var html = '' +
        '<div class="ke-hoach-line-card" data-line-key="' + line.key + '">' +
          '<div class="ke-hoach-line-head">' +
            '<div class="ke-hoach-line-heading"><h5 class="ke-hoach-line-title">Dòng xe <span class="line-order"></span></h5><div class="ke-hoach-line-meta"></div></div>' +
            '<div class="ke-hoach-line-actions">' + copyBtn + removeBtn + '</div>' +
          '</div>' +
          '<div class="ke-hoach-line-section ke-hoach-line-section-primary">' +
            '<div class="row g-3">' +
            '<div class="col-md-6">' +
              '<label class="form-label">Phương tiện <span class="text-danger">*</span></label>' +
              '<input type="hidden" class="line-vehicle-id" value="' + (line.nid_phuong_tien || 0) + '">' +
              '<div class="vehicle-summary"></div>' +
              '<div class="vehicle-actions mt-2">' +
                '<button type="button" class="btn btn-outline-primary btn-open-vehicle-modal"><i class="ti tabler-truck me-1"></i> Chọn phương tiện</button>' +
                '<button type="button" class="btn btn-link text-secondary btn-clear-vehicle"><i class="ti tabler-x me-1"></i> Bỏ chọn</button>' +
              '</div>' +
              '<div class="invalid-feedback d-block line-vehicle-feedback" style="display:none !important;">Vui lòng chọn phương tiện</div>' +
            '</div>' +
            '<div class="col-md-6">' +
              '<label class="form-label">Lái xe <span class="text-danger">*</span></label>' +
              '<select class="form-select line-driver-select">' + buildDriverOptions(line.nid_lai_xe) + '</select>' +
            '</div>' +
            '</div>' +
          '</div>' +
          '<div class="ke-hoach-line-section">' +
            '<div class="row g-3">' +
            '<div class="col-md-3"><label class="form-label">Số cont</label><input type="text" class="form-control line-so-cont-input" value="' + escHtml(line.so_cont || '') + '" placeholder="Nhập số cont"></div>' +
            '<div class="col-md-3"><label class="form-label">Loại cont</label><select class="form-select line-loai-cont-select">' + buildTagOptions(state.cauHinh.loaiCont, line.loai_cont) + '</select></div>' +
            '<div class="col-md-3"><label class="form-label">Số seal chính</label><input type="text" class="form-control line-seal-chinh-input" value="' + escHtml(line.so_seal_chinh || '') + '" placeholder="Nhập số seal chính"></div>' +
            '<div class="col-md-3"><label class="form-label">Số seal tạm</label><input type="text" class="form-control line-seal-tam-input" value="' + escHtml(line.so_seal_tam || '') + '" placeholder="Nhập số seal tạm"></div>' +
            '<div class="col-md-3"><label class="form-label">Địa chỉ kho</label><select class="form-select line-kho-select">' + buildTagOptions(state.cauHinh.diaChiKho, line.dia_chi_kho) + '</select></div>' +
            '<div class="col-md-3"><label class="form-label">Bãi lấy cont</label><select class="form-select line-bai-lay-select">' + buildTagOptions(state.diaDiem.bai, line.bai_lay_cont) + '</select></div>' +
            '<div class="col-md-3"><label class="form-label">Bãi hạ cont</label><select class="form-select line-bai-ha-select">' + buildTagOptions(state.diaDiem.bai, line.bai_ha_cont) + '</select></div>' +
            '<div class="col-md-3"><label class="form-label">Cảng xuất</label><select class="form-select line-cang-select">' + buildTagOptions(state.diaDiem.cang, line.cang_xuat) + '</select></div>' +
            '<div class="col-md-4"><label class="form-label">Cut-off</label><input type="text" class="form-control line-cut-off-input" value="' + escHtml(apiToDatetime(line.cut_off || '')) + '" placeholder="dd/mm/yyyy HH:MM"></div>' +
            '<div class="col-md-8"><label class="form-label d-block">Hình thức vận tải</label><div class="line-hinh-thuc-group">' + buildHinhThucRadios(line) + '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>';
      var $card = $(html);
      $('#ke-hoach-lines').append($card);
      initLineUi($card, line);
      refreshOrder();
      renderEmpty();
    }

    function syncLine($card) {
      var line = findLine($card.data('line-key'));
      if (!line) return null;
      line.nid_phuong_tien = parseInt($card.find('.line-vehicle-id').val(), 10) || 0;
      line.nid_lai_xe = parseInt($card.find('.line-driver-select').val(), 10) || 0;
      line.dia_chi_kho = ($card.find('.line-kho-select').val() || '').trim();
      line.loai_cont = ($card.find('.line-loai-cont-select').val() || '').trim();
      line.so_cont = $card.find('.line-so-cont-input').val().trim();
      line.so_seal_chinh = $card.find('.line-seal-chinh-input').val().trim();
      line.so_seal_tam = $card.find('.line-seal-tam-input').val().trim();
      line.bai_lay_cont = ($card.find('.line-bai-lay-select').val() || '').trim();
      line.bai_ha_cont = ($card.find('.line-bai-ha-select').val() || '').trim();
      line.cang_xuat = ($card.find('.line-cang-select').val() || '').trim();
      line.cut_off = datetimeToApi($card.find('.line-cut-off-input').val().trim());
      line.hinh_thuc_van_tai = ($card.find('.line-hinh-thuc-radio:checked').val() || '').trim();
      return line;
    }

    function syncAllLines() {
      $('#ke-hoach-lines .ke-hoach-line-card').each(function () {
        syncLine($(this));
      });
    }

    function refreshLineSources() {
      $('#ke-hoach-lines .ke-hoach-line-card').each(function () {
        var $card = $(this);
        var line = syncLine($card);
        $card.find('.line-kho-select').html(buildTagOptions(state.cauHinh.diaChiKho, line.dia_chi_kho));
        $card.find('.line-loai-cont-select').html(buildTagOptions(state.cauHinh.loaiCont, line.loai_cont));
        $card.find('.line-bai-lay-select').html(buildTagOptions(state.diaDiem.bai, line.bai_lay_cont));
        $card.find('.line-bai-ha-select').html(buildTagOptions(state.diaDiem.bai, line.bai_ha_cont));
        $card.find('.line-cang-select').html(buildTagOptions(state.diaDiem.cang, line.cang_xuat));
        initLineUi($card, line);
      });
    }

    function addLine(source) {
      var line = createLine(source);
      state.lines.push(line);
      renderLine(line);
    }

    function openVehicleModal(key) {
      state.activeLineKey = key;
      var lineIndex = $('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]').index() + 1;
      $('#vehicle-picker-target').text('Đang chọn cho dòng #' + lineIndex);
      $('#vehicle-picker-search').val('');
      renderVehicleTable('');
      if (!vehicleModal) vehicleModal = new bootstrap.Modal(document.getElementById('vehicle-picker-modal'));
      vehicleModal.show();
    }

    function renderVehicleTable(keyword) {
      keyword = (keyword || '').toLowerCase();
      var activeLine = findLine(state.activeLineKey);
      var html = '';
      for (var i = 0; i < state.vehicles.length; i++) {
        var item = state.vehicles[i];
        var driverText = item.lai_xe && item.lai_xe.ten ? item.lai_xe.ten + (item.lai_xe.sdt ? ' - ' + item.lai_xe.sdt : '') : 'Chưa gán lái xe';
        var haystack = [item.bks, item.loai_phuong_tien, item.hang_xe, driverText].join(' ').toLowerCase();
        if (keyword && haystack.indexOf(keyword) === -1) continue;
        var checked = activeLine && parseInt(activeLine.nid_phuong_tien, 10) === parseInt(item.nid, 10);
        html += '<tr>' +
          '<td class="text-center"><input type="radio" name="vehicle-picker-radio" value="' + item.nid + '"' + (checked ? ' checked' : '') + '></td>' +
          '<td><strong>' + escHtml(item.bks || ('#' + item.nid)) + '</strong><div class="text-muted small">' + escHtml(item.ma_tai_san || '') + '</div></td>' +
          '<td><span class="badge bg-label-warning">' + escHtml(item.loai_phuong_tien || 'Chưa phân loại') + '</span></td>' +
          '<td><div>' + escHtml(item.lai_xe && item.lai_xe.ten ? item.lai_xe.ten : 'Chưa gán lái xe') + '</div><div class="vehicle-picker-driver">' + escHtml(item.lai_xe && item.lai_xe.sdt ? item.lai_xe.sdt : '') + '</div></td>' +
          '<td class="text-center"><button type="button" class="btn btn-sm btn-primary btn-pick-vehicle" data-id="' + item.nid + '">Chọn</button></td>' +
          '</tr>';
      }
      if (!html) html = '<tr><td colspan="5" class="text-center text-muted py-4">Không tìm thấy phương tiện phù hợp</td></tr>';
      $('#vehicle-picker-body').html(html);
    }

    function selectVehicleForLine(vehicleId) {
      var line = findLine(state.activeLineKey);
      if (!line) return;
      var vehicle = state.vehicleMap[String(vehicleId)] || null;
      line.nid_phuong_tien = vehicle ? parseInt(vehicle.nid, 10) || 0 : 0;
      if (vehicle && vehicle.lai_xe && vehicle.lai_xe.nid) {
        line.nid_lai_xe = parseInt(vehicle.lai_xe.nid, 10) || 0;
      }
      var $card = $('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + line.key + '"]');
      $card.find('.line-vehicle-id').val(line.nid_phuong_tien || 0);
      $card.find('.line-driver-select').val(line.nid_lai_xe || 0).trigger('change');
      $card.find('.vehicle-summary').addClass('is-selected').html(vehicleSummary(line));
      $card.find('.line-vehicle-feedback').hide();
      $card.removeClass('line-card-invalid');
      if (vehicleModal) vehicleModal.hide();
    }

    function loadCauHinh(khId, callback) {
      state.cauHinh = { diaChiKho: [], loaiCont: [] };
      if (!khId) {
        refreshLineSources();
        if (callback) callback();
        return;
      }
      $.ajax({
        url: '/api/cau-hinh-gia-ban',
        type: 'GET',
        dataType: 'json',
        data: { khach_hang_id: khId, limit: 999 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            var khoSet = {};
            var contSet = {};
            for (var i = 0; i < res.data.items.length; i++) {
              if (res.data.items[i].dia_chi_kho) khoSet[res.data.items[i].dia_chi_kho] = true;
              if (res.data.items[i].loai_cont) contSet[res.data.items[i].loai_cont] = true;
            }
            state.cauHinh.diaChiKho = Object.keys(khoSet);
            state.cauHinh.loaiCont = Object.keys(contSet);
          }
        },
        complete: function () {
          refreshLineSources();
          if (callback) callback();
        }
      });
    }

    function validateForm() {
      var ok = true;
      var khId = parseInt($('#nid_khach_hang-input').val(), 10) || 0;
      var bkg = $('#so_bkg-input').val().trim();
      $('#nid_khach_hang-input').removeClass('is-invalid').next('.select2-container').removeClass('is-invalid');
      $('#so_bkg-input').removeClass('is-invalid');
      if (!khId) {
        ok = false;
        $('#nid_khach_hang-input').addClass('is-invalid').next('.select2-container').addClass('is-invalid');
      }
      if (!bkg) {
        ok = false;
        $('#so_bkg-input').addClass('is-invalid');
      }
      syncAllLines();
      if (!state.lines.length) {
        if (notyf) notyf.error('Cần có ít nhất một dòng xe');
        return false;
      }
      var seenVehicle = {};
      var seenDriver = {};
      $('#ke-hoach-lines .ke-hoach-line-card').each(function () {
        var $card = $(this);
        var line = syncLine($card);
        $card.removeClass('line-card-invalid');
        $card.find('.line-driver-select').removeClass('is-invalid').next('.select2-container').removeClass('is-invalid');
        $card.find('.line-vehicle-feedback').hide();
        if (!line.nid_phuong_tien) {
          ok = false;
          $card.addClass('line-card-invalid');
          $card.find('.line-vehicle-feedback').show();
        }
        if (!line.nid_lai_xe) {
          ok = false;
          $card.addClass('line-card-invalid');
          $card.find('.line-driver-select').addClass('is-invalid').next('.select2-container').addClass('is-invalid');
        }
        if (line.nid_phuong_tien) {
          if (seenVehicle[line.nid_phuong_tien]) {
            ok = false;
            if (notyf) notyf.error('Phương tiện bị trùng giữa các dòng');
            return false;
          }
          seenVehicle[line.nid_phuong_tien] = true;
        }
        if (line.nid_lai_xe) {
          if (seenDriver[line.nid_lai_xe]) {
            ok = false;
            if (notyf) notyf.error('Lái xe bị trùng giữa các dòng');
            return false;
          }
          seenDriver[line.nid_lai_xe] = true;
        }
      });
      return ok;
    }

    function gatherCreatePayload() {
      syncAllLines();
      return {
        ngay: getNgayValue(),
        nid_khach_hang: parseInt($('#nid_khach_hang-input').val(), 10) || 0,
        so_bkg: $('#so_bkg-input').val().trim(),
        items: $.map(state.lines, function (line) {
          return {
            nid_phuong_tien: line.nid_phuong_tien || 0,
            nid_lai_xe: line.nid_lai_xe || 0,
            dia_chi_kho: line.dia_chi_kho || '',
            loai_cont: line.loai_cont || '',
            so_cont: line.so_cont || '',
            so_seal_chinh: line.so_seal_chinh || '',
            so_seal_tam: line.so_seal_tam || '',
            bai_lay_cont: line.bai_lay_cont || '',
            bai_ha_cont: line.bai_ha_cont || '',
            cang_xuat: line.cang_xuat || '',
            cut_off: line.cut_off || '',
            hinh_thuc_van_tai: line.hinh_thuc_van_tai || ''
          };
        })
      };
    }

    function gatherEditPayload() {
      syncAllLines();
      var line = state.lines[0] || {};
      return {
        ngay: getNgayValue(),
        nid_khach_hang: parseInt($('#nid_khach_hang-input').val(), 10) || 0,
        so_bkg: $('#so_bkg-input').val().trim(),
        item: {
          nid_phuong_tien: line.nid_phuong_tien || 0,
          nid_lai_xe: line.nid_lai_xe || 0,
          dia_chi_kho: line.dia_chi_kho || '',
          loai_cont: line.loai_cont || '',
          so_cont: line.so_cont || '',
          so_seal_chinh: line.so_seal_chinh || '',
          so_seal_tam: line.so_seal_tam || '',
          bai_lay_cont: line.bai_lay_cont || '',
          bai_ha_cont: line.bai_ha_cont || '',
          cang_xuat: line.cang_xuat || '',
          cut_off: line.cut_off || '',
          hinh_thuc_van_tai: line.hinh_thuc_van_tai || ''
        }
      };
    }

    function populateEdit(row) {
      var khachHangId = (row.khach_hang && row.khach_hang.nid) || 0;
      $('#nid-input').val(row.nid || '');
      if ($('#ngay-input').length) $('#ngay-input').val(apiToDate(row.ngay || ''));
      $('#nid_khach_hang-input').val(khachHangId).trigger('change');
      $('#so_bkg-input').val(row.so_bkg || '');
      state.lines = [];
      $('#ke-hoach-lines').empty();
      addLine({
        nid_phuong_tien: row.phuong_tien ? row.phuong_tien.nid : 0,
        nid_lai_xe: row.lai_xe ? row.lai_xe.nid : 0,
        dia_chi_kho: row.dia_chi_kho || '',
        loai_cont: row.loai_cont || '',
        so_cont: row.so_cont || '',
        so_seal_chinh: row.so_seal_chinh || '',
        so_seal_tam: row.so_seal_tam || '',
        bai_lay_cont: row.bai_lay_cont || '',
        bai_ha_cont: row.bai_ha_cont || '',
        cang_xuat: row.cang_xuat || '',
        cut_off: row.cut_off || '',
        hinh_thuc_van_tai: row.hinh_thuc_van_tai || ''
      });
      $('#add-line-btn').hide();
    }

    function loadEditDetail(done) {
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
      var pending = 4;
      function finish() {
        pending -= 1;
        if (pending === 0) done();
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
              html += '<option value="' + state.customers[i].nid + '">' + escHtml(state.customers[i].ten || ('#' + state.customers[i].nid)) + '</option>';
            }
            $('#nid_khach_hang-input').html(html);
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
        url: '/api/danh-muc-dia-diem',
        type: 'GET',
        dataType: 'json',
        data: { limit: 500 },
        success: function (res) {
          if (res.status === 'success' && res.data && res.data.items) {
            for (var i = 0; i < res.data.items.length; i++) {
              if (res.data.items[i].phan_loai === 'Bãi' && res.data.items[i].ten) state.diaDiem.bai.push(res.data.items[i].ten);
              if (res.data.items[i].phan_loai === 'Cảng' && res.data.items[i].ten) state.diaDiem.cang.push(res.data.items[i].ten);
            }
          }
        },
        complete: finish
      });
    }

    $('#nid_khach_hang-input').on('change', function () {
      loadCauHinh(parseInt($(this).val(), 10) || 0);
    });
    $('#add-line-btn').on('click', function () {
      addLine({});
    });
    $('#vehicle-picker-search').on('input', function () {
      renderVehicleTable($(this).val());
    });
    $('#paste-bkg-btn').on('click', function () {
      var input = document.getElementById('so_bkg-input');
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard.readText().then(function (text) {
          if (text) input.value = text;
        }).catch(function () {});
      }
    });
    $('#ke-hoach-form').on('keydown', function (e) {
      if (e.which === 13 && !$(e.target).is('textarea')) {
        e.preventDefault();
        $('#save-btn').trigger('click');
      }
    });
    $('#save-btn').on('click', function () {
      if (!validateForm()) return;
      showLoading(true);
      var nid = $('#nid-input').val();
      $.ajax({
        url: nid ? '/api/ke-hoach-xep-xe/' + nid : '/api/ke-hoach-xep-xe',
        method: nid ? 'PUT' : 'POST',
        contentType: 'application/json',
        data: JSON.stringify(nid ? gatherEditPayload() : gatherCreatePayload()),
        success: function (res) {
          showLoading(false);
          if (res.status !== 'success') {
            if (notyf) notyf.error(res.message || 'Lưu thất bại');
            return;
          }
          if (notyf) notyf.success(nid ? 'Đã cập nhật kế hoạch' : 'Đã tạo kế hoạch');
          if (nid) {
            window.location.href = '/ke-hoach-xep-xe/' + nid;
          } else {
            window.location.href = '/ke-hoach-xep-xe';
          }
        },
        error: function (jqXHR) {
          showLoading(false);
          if (notyf) notyf.error(apiMsg(jqXHR));
        }
      });
    });

    $(document).on('click', '.btn-open-vehicle-modal', function () {
      syncAllLines();
      openVehicleModal($(this).closest('.ke-hoach-line-card').data('line-key'));
    });
    $(document).on('click', '.btn-clear-vehicle', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var line = syncLine($card);
      line.nid_phuong_tien = 0;
      $card.find('.line-vehicle-id').val(0);
      $card.find('.vehicle-summary').removeClass('is-selected').html(vehicleSummary(line));
    });
    $(document).on('click', '.btn-remove-line', function () {
      var key = $(this).closest('.ke-hoach-line-card').data('line-key');
      state.lines = $.grep(state.lines, function (line) { return line.key !== key; });
      $('#ke-hoach-lines .ke-hoach-line-card[data-line-key="' + key + '"]').remove();
      refreshOrder();
      renderEmpty();
    });
    $(document).on('click', '.btn-copy-line', function () {
      var line = syncLine($(this).closest('.ke-hoach-line-card'));
      var copy = $.extend({}, line);
      delete copy.key;
      addLine(copy);
    });
    $(document).on('click', '.btn-pick-vehicle', function () {
      selectVehicleForLine($(this).data('id'));
    });
    $(document).on('change', 'input[name="vehicle-picker-radio"]', function () {
      selectVehicleForLine($(this).val());
    });
    $(document).on('change', '.line-driver-select', function () {
      var $card = $(this).closest('.ke-hoach-line-card');
      var line = syncLine($card);
      $card.find('.vehicle-summary').html(vehicleSummary(line));
    });

    if (typeof flatpickr !== 'undefined' && document.getElementById('ngay-input')) {
      flatpickr(document.getElementById('ngay-input'), { dateFormat: 'd/m/Y', allowInput: true, static: true });
    }

    loadDropdowns(function () {
      initSelect2(document.getElementById('nid_khach_hang-input'), '— Chọn khách hàng —');
      if (mode === 'edit') {
        showLoading(true);
        loadEditDetail(function (row) {
          showLoading(false);
          if (row) {
            populateEdit(row);
          }
        });
      } else {
        if ($('#ngay-input').length) $('#ngay-input').val(todayDdMmYyyy());
        addLine({});
      }
    });
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
        var khName = (d.khach_hang && d.khach_hang.ten) || '';
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
          { label: 'Bãi hạ cont', value: d.bai_ha_cont },
          { label: 'Cảng xuất', value: d.cang_xuat },
          { label: 'Cut-off', value: apiToDatetime(d.cut_off) },
          { label: 'Hình thức vận tải', value: HINH_THUC_MAP[d.hinh_thuc_van_tai] },
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

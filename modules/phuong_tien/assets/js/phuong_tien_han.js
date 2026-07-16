(function ($, Drupal) {
  'use strict';

  var notyf;
  var screenType = '';
  var allItems = [];
  var filteredItems = [];
  var currentHanPage = 1;
  var PAGE_SIZE = 20;

  var LOAI_PHUONG_TIEN_MAP = {
    dau_keo: 'Đầu kéo',
    mooc: 'Mooc',
  };

  var TYPE_CONFIG = {
    'dang-kiem': {
      title: 'Đăng kiểm',
      soField: 'so_dang_kiem',
      hanField: 'han_dang_kiem',
      thLabel: 'Số đăng kiểm',
      hanLabel: 'Hạn đăng kiểm',
    },
    'bao-hiem-than-vo': {
      title: 'Bảo hiểm thân vỏ',
      soField: 'so_bao_hiem_than_vo',
      hanField: 'han_bao_hiem_than_vo',
      thLabel: 'Số BH thân vỏ',
      hanLabel: 'Hạn BH thân vỏ',
    },
    'tnds': {
      title: 'Bảo hiểm TNDS',
      soField: 'so_bao_hiem_tnds',
      hanField: 'han_bao_hiem_tnds',
      thLabel: 'Số BH TNDS',
      hanLabel: 'Hạn BH TNDS',
    },
    'phu-hieu': {
      title: 'Phù hiệu',
      soField: null,
      hanField: 'han_phu_hieu',
      thLabel: '',
      hanLabel: 'Hạn phù hiệu',
    },
  };

  Drupal.behaviors.phuongTienHan = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }

      if ($('#table-han', context).length) {
        var s = Drupal.settings.phuong_tien_han;
        if (s && s.type) {
          screenType = s.type;
        }
        var cfg = TYPE_CONFIG[screenType];
        if (cfg) {
          document.getElementById('han-page-title').textContent = cfg.title + ' - Phương tiện';
          document.title = cfg.title + ' - Phương tiện';
          if (cfg.soField) {
            document.getElementById('th-so').textContent = cfg.thLabel;
          } else {
            document.getElementById('th-so').style.display = 'none';
          }
          document.getElementById('th-han').textContent = cfg.hanLabel;
          bindHanEvents();
          loadAllItems();
        }
      }
    }
  };

  function bindHanEvents() {
    var doc = document;

    doc.getElementById('btn-search-han').addEventListener('click', function () {
      applyFilters();
    });

    doc.getElementById('search-han').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        applyFilters();
      }
    });

    doc.getElementById('filter-trang-thai').addEventListener('change', function () {
      applyFilters();
    });

    doc.getElementById('filter-loai-pt').addEventListener('change', function () {
      applyFilters();
    });

    var reloadBtn = doc.querySelector('.btn-reload-han');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        sessionStorage.removeItem(STORAGE_KEY);
        doc.getElementById('search-han').value = '';
        doc.getElementById('filter-trang-thai').value = '';
        doc.getElementById('filter-loai-pt').value = '';
        loadAllItems();
      });
    }

    doc.getElementById('pagination-jump-han').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value);
        var totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
        if (page > 0 && page <= totalPages) {
          currentHanPage = page;
          renderTable();
        }
      }
    });

    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList && t.classList.contains('page-link') && t.getAttribute('data-page')) {
          var pageLink = parseInt(t.getAttribute('data-page'));
          var totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
          if (pageLink && pageLink !== currentHanPage && pageLink >= 1 && pageLink <= totalPages) {
            e.preventDefault();
            currentHanPage = pageLink;
            renderTable();
          }
          return;
        }
        t = t.parentElement;
      }
    });
  }

  function parseDateDDMMYYYY(str) {
    if (!str) return null;
    var parts = str.split('/');
    if (parts.length !== 3) return null;
    var d = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10) - 1;
    var y = parseInt(parts[2], 10);
    if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
    return new Date(y, m, d);
  }

  function calcMonthsRemaining(hanStr) {
    var hanDate = parseDateDDMMYYYY(hanStr);
    if (!hanDate) return null;
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var diffMonths = (hanDate.getFullYear() - now.getFullYear()) * 12 + (hanDate.getMonth() - now.getMonth());
    var remainingDays = hanDate.getDate() - now.getDate();
    if (remainingDays < 0) diffMonths--;
    return diffMonths;
  }

  function getTrangThaiInfo(hanStr) {
    var months = calcMonthsRemaining(hanStr);
    if (months === null) return { key: 'chua_co', label: 'Chưa có thông tin', cls: 'badge-chua-co' };
    if (months < 0) return { key: 'qua_han', label: 'Quá hạn', cls: 'badge-qua-han' };
    if (months <= 3) return { key: 'sap_het_han', label: 'Sắp hết hạn', cls: 'badge-sap-het-han' };
    return { key: 'con_han', label: 'Còn hạn', cls: 'badge-con-han' };
  }

  var STORAGE_KEY = 'phuong_tien_all_items';

  function loadAllItems() {
    var tbody = $('#table-han-tbody');

    var cached = sessionStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        allItems = JSON.parse(cached);
        applyFilters();
        return;
      } catch (e) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }

    tbody.html(
      '<tr id="loading-row-han"><td colspan="7" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    $.ajax({
      url: '/api/phuong-tien',
      type: 'GET',
      dataType: 'json',
      data: { page: 1, limit: 9999 },
      success: function (res) {
        if (res.status === 'success' && res.data && res.data.items) {
          allItems = res.data.items;
        } else {
          allItems = [];
        }
        try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(allItems)); } catch (e) {}
        applyFilters();
      },
      error: function (jqXHR) {
        allItems = [];
        applyFilters();
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function applyFilters() {
    var keyword = document.getElementById('search-han').value.trim().toLowerCase();
    var loai = document.getElementById('filter-loai-pt').value;
    var trangThai = document.getElementById('filter-trang-thai').value;
    var cfg = TYPE_CONFIG[screenType];

    filteredItems = [];
    for (var i = 0; i < allItems.length; i++) {
      var item = allItems[i];

      if (keyword) {
        var bks = (item.bks || '').toLowerCase();
        var maTS = (item.ma_tai_san || '').toLowerCase();
        if (bks.indexOf(keyword) === -1 && maTS.indexOf(keyword) === -1) continue;
      }

      if (loai && item.loai_phuong_tien !== loai) continue;

      if (trangThai) {
        var hanVal = cfg.hanField ? (item[cfg.hanField] || '') : '';
        var tt = getTrangThaiInfo(hanVal);
        if (tt.key !== trangThai) continue;
      }

      filteredItems.push(item);
    }

    currentHanPage = 1;
    renderTable();
  }

  function renderTable() {
    $('#loading-row-han').remove();
    var tbody = $('#table-han-tbody');
    tbody.empty();

    var cfg = TYPE_CONFIG[screenType];
    var totalPages = Math.ceil(filteredItems.length / PAGE_SIZE);
    var start = (currentHanPage - 1) * PAGE_SIZE;
    var pageItems = filteredItems.slice(start, start + PAGE_SIZE);

    if (pageItems.length === 0) {
      tbody.append('<tr><td colspan="7" class="text-center">Không có dữ liệu</td></tr>');
      renderPagination(totalPages);
      return;
    }

    var html = '';
    for (var i = 0; i < pageItems.length; i++) {
      var item = pageItems[i];
      var stt = start + i + 1;
      var hanVal = cfg.hanField ? (item[cfg.hanField] || '') : '';
      var soVal = cfg.soField ? (item[cfg.soField] || '') : '';
      var months = calcMonthsRemaining(hanVal);
      var monthsText = months !== null ? months : '—';
      var tt = getTrangThaiInfo(hanVal);

      html += '<tr>';
      html += '<td>' + stt + '</td>';
      html += '<td>' + escapeHtml(item.bks || '') + '</td>';
      html += '<td>' + escapeHtml(LOAI_PHUONG_TIEN_MAP[item.loai_phuong_tien] || item.loai_phuong_tien || '') + '</td>';
      if (cfg.soField) {
        html += '<td>' + escapeHtml(soVal) + '</td>';
      }
      html += '<td>' + escapeHtml(hanVal) + '</td>';
      html += '<td class="text-center">' + monthsText + '</td>';
      html += '<td class="text-center"><span class="badge ' + tt.cls + '">' + tt.label + '</span></td>';
      html += '</tr>';
    }
    tbody.append(html);
    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    var container = document.getElementById('pagination-han');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var totalItems = filteredItems.length;

    document.getElementById('pagination-info-han').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('pagination-total-pages-han').textContent = '/ ' + totalPages;

    var jumpInput = document.getElementById('pagination-jump-han');
    jumpInput.value = currentHanPage;
    jumpInput.setAttribute('data-total-pages', totalPages);

    container.style.display = '';

    var html = '';
    html += '<li class="page-item ' + (currentHanPage <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (currentHanPage <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (currentHanPage - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';

    var start = Math.max(1, currentHanPage - 2);
    var end = Math.min(totalPages, currentHanPage + 2);

    if (start > 1) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === currentHanPage ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }
    if (end < totalPages) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    html += '<li class="page-item ' + (currentHanPage >= totalPages ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (currentHanPage + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (currentHanPage >= totalPages ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + totalPages + '"><i class="ti tabler-chevrons-right"></i></a></li>';

    ul.innerHTML = html;
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

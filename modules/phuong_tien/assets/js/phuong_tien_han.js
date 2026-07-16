(function ($, Drupal) {
  'use strict';

  var notyf;
  var currentHanPage = 1;
  var currentHanKeyword = '';
  var currentHanTrangThai = '';
  var screenType = '';

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

  function _jq(sel) {
    var j = typeof jQuery !== 'undefined' ? jQuery : (typeof $ !== 'undefined' ? $ : null);
    if (!j) return null;
    return j(sel);
  }

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
          loadHanList();
        }
      }
    }
  };

  function bindHanEvents() {
    var doc = document;

    doc.getElementById('btn-search-han').addEventListener('click', function () {
      currentHanKeyword = doc.getElementById('search-han').value.trim();
      currentHanPage = 1;
      loadHanList();
    });

    doc.getElementById('search-han').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        currentHanKeyword = this.value.trim();
        currentHanPage = 1;
        loadHanList();
      }
    });

    doc.getElementById('filter-trang-thai').addEventListener('change', function () {
      currentHanTrangThai = this.value;
      currentHanPage = 1;
      loadHanList();
    });

    var reloadBtn = doc.querySelector('.btn-reload-han');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', function () {
        currentHanKeyword = '';
        currentHanTrangThai = '';
        doc.getElementById('search-han').value = '';
        doc.getElementById('filter-trang-thai').value = '';
        currentHanPage = 1;
        loadHanList();
      });
    }

    doc.getElementById('pagination-jump-han').addEventListener('keypress', function (e) {
      if (e.which === 13) {
        var page = parseInt(this.value);
        var total = parseInt(this.getAttribute('data-total-pages'));
        if (page > 0 && page <= total) {
          currentHanPage = page;
          loadHanList();
        }
      }
    });

    doc.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== doc) {
        if (t.classList) {
          if (t.id === 'pagination-jump-han' && e.type === 'keypress' && e.which === 13) {
            var page = parseInt(t.value);
            var total = parseInt(t.getAttribute('data-total-pages'));
            if (page > 0 && page <= total) {
              currentHanPage = page;
              loadHanList();
            }
            return;
          }
          if (t.classList.contains('page-link')) {
            var pageLink = parseInt(t.getAttribute('data-page'));
            if (pageLink && pageLink !== currentHanPage) {
              e.preventDefault();
              currentHanPage = pageLink;
              loadHanList();
            }
            return;
          }
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
    var diffMs = hanDate.getTime() - now.getTime();
    var diffMonths = (hanDate.getFullYear() - now.getFullYear()) * 12 + (hanDate.getMonth() - now.getMonth());
    var daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var remainingDays = hanDate.getDate() - now.getDate();
    if (remainingDays < 0) diffMonths--;
    return diffMonths;
  }

  function getTrangThaiInfo(hanStr) {
    var months = calcMonthsRemaining(hanStr);
    if (months === null) return { label: 'Chưa có thông tin', cls: 'badge-chua-co' };
    if (months < 0) return { label: 'Quá hạn', cls: 'badge-qua-han' };
    if (months <= 3) return { label: 'Sắp hết hạn', cls: 'badge-sap-het-han' };
    return { label: 'Còn hạn', cls: 'badge-con-han' };
  }

  function loadHanList() {
    var tbody = $('#table-han-tbody');
    tbody.html(
      '<tr id="loading-row-han"><td colspan="7" class="text-center py-4">' +
      '<div class="spinner-border text-primary" role="status">' +
      '<span class="visually-hidden">Đang tải...</span></div></td></tr>'
    );

    $.ajax({
      url: '/api/phuong-tien',
      type: 'GET',
      dataType: 'json',
      data: { page: currentHanPage, keyword: currentHanKeyword, limit: 20 },
      success: function (res) {
        $('#loading-row-han').remove();

        if (res.status !== 'success' || !res.data) {
          tbody.append('<tr><td colspan="7" class="text-center text-danger">' + escapeHtml(res.message || 'Lỗi không xác định') + '</td></tr>');
          return;
        }

        var data = res.data;
        var items = data.items || [];
        var cfg = TYPE_CONFIG[screenType];

        if (items.length === 0) {
          tbody.append('<tr><td colspan="7" class="text-center">Không có dữ liệu</td></tr>');
          renderHanPagination(data);
          return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          var stt = (data.current_page - 1) * (data.limit || 20) + i + 1;
          var hanVal = cfg.hanField ? (item[cfg.hanField] || '') : '';
          var soVal = cfg.soField ? (item[cfg.soField] || '') : '';
          var months = calcMonthsRemaining(hanVal);
          var monthsText = months !== null ? months : '—';
          var tt = getTrangThaiInfo(hanVal);

          if (currentHanTrangThai && tt.cls !== 'badge-' + currentHanTrangThai) {
            continue;
          }

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

        if (html === '') {
          tbody.append('<tr><td colspan="7" class="text-center">Không có dữ liệu phù hợp</td></tr>');
        } else {
          tbody.append(html);
        }
        renderHanPagination(data);
      },
      error: function (jqXHR) {
        $('#loading-row-han').remove();
        tbody.append('<tr><td colspan="7" class="text-center text-danger">Lỗi tải dữ liệu</td></tr>');
        if (notyf) notyf.error(apiMsg(jqXHR));
      }
    });
  }

  function renderHanPagination(data) {
    var container = document.getElementById('pagination-han');
    var ul = container.querySelector('ul.pagination');
    ul.innerHTML = '';

    var total = data.total_pages || 0;
    var current = data.current_page || 0;
    var totalItems = data.total || 0;

    document.getElementById('pagination-info-han').textContent = 'Tổng số: ' + totalItems + ' bản ghi';
    document.getElementById('pagination-total-pages-han').textContent = '/ ' + total;

    var jumpInput = document.getElementById('pagination-jump-han');
    jumpInput.value = current;
    jumpInput.setAttribute('data-total-pages', total);

    container.style.display = '';

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';

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

    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= total ? 'disabled' : '') + '"><a class="page-link" href="#" data-page="' + total + '"><i class="ti tabler-chevrons-right"></i></a></li>';

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

(function ($, Drupal) {
  'use strict';

  var notyf;
  var driverCache = null;

  function _jq(sel) {
    var j = typeof jQuery !== 'undefined' ? jQuery : (typeof $ !== 'undefined' ? $ : null);
    if (!j) return null;
    return j(sel);
  }

  Drupal.behaviors.ptlxAssign = {
    attach: function (context, settings) {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }
    }
  };

  /**
   * Open "Chọn lái xe" modal.
   * @param {number} nidPT      - nid phương tiện
   * @param {string} bksText    - text hiển thị (BKS - mã tài sản)
   * @param {object|null} laixe - nested lai_xe object from list API {nid, ten, sdt, ...}
   */
  window.ptlxOpenAssignModal = function (nidPT, bksText, laixe) {
    var modal = document.getElementById('phuong-tien-lai-xe-modal');
    var displayBks = document.getElementById('ptlx-display-bks');
    var btn = document.querySelector('.btn-luu-ptlx');
    var loading = document.getElementById('ptlx-modal-loading');
    var selectLX = document.getElementById('ptlx-select-lai-xe');

    displayBks.textContent = bksText || '---';
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    modal.setAttribute('data-nid-pt', nidPT);
    modal.setAttribute('data-current-id', '');

    var currentNidLX = laixe ? parseInt(laixe.nid) : null;

    var bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    if (driverCache) {
      populateDriverSelect(selectLX, driverCache, currentNidLX, modal);
      initSelect2(modal, currentNidLX);
    } else {
      loading.style.display = '';
      selectLX.innerHTML = '<option value="">Đang tải...</option>';
      loadDriverList(function () {
        loading.style.display = 'none';
        populateDriverSelect(selectLX, driverCache, currentNidLX, modal);
        initSelect2(modal, currentNidLX);
      });
    }
  };

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

  function loadDriverList(callback) {
    // Chỉ các trường ô chọn dùng (tên, mã NV, SĐT, đang hoạt động); tải đủ mọi trang, mỗi lần 100 dòng.
    fetchAllPages('/api/lai-xe', { limit: 100, select: 'nid,ten,ma_nhan_vien,sdt,hoat_dong' }, function (items) {
      driverCache = items;
      if (callback) callback();
    }, function () {
      driverCache = [];
      if (callback) callback();
    });
  }

  function populateDriverSelect(select, items, currentNidLX, modal) {
    select.innerHTML = '<option value="">-- Chọn lái xe --</option>';
    for (var i = 0; i < items.length; i++) {
      if (items[i].hoat_dong == 1) {
        var opt = document.createElement('option');
        opt.value = items[i].nid;
        var label = items[i].ten || '';
        if (items[i].ma_nhan_vien) label += ' (' + items[i].ma_nhan_vien + ')';
        if (items[i].sdt) label += ' - ' + items[i].sdt;
        opt.textContent = label;
        select.appendChild(opt);
      }
    }
  }

  function initSelect2(modal, currentNidLX) {
    var jqSel2 = _jq('#ptlx-select-lai-xe');
    var jqModal = _jq('#phuong-tien-lai-xe-modal');
    var jqGlobal = typeof jQuery !== 'undefined' ? jQuery : (typeof $ !== 'undefined' ? $ : null);
    if (jqSel2 && jqSel2.length && jqGlobal && jqGlobal.fn && jqGlobal.fn.select2) {
      if (jqSel2.data('select2')) {
        jqSel2.select2('destroy');
      }
      jqSel2.select2({
        placeholder: 'Tìm kiếm tên, SĐT, CCCD...',
        allowClear: true,
        width: '100%',
        dropdownParent: jqModal
      });
      if (currentNidLX) {
        jqSel2.val(String(currentNidLX)).trigger('change');
      }
    }
  }

  function ptlxSubmit() {
    var modal = document.getElementById('phuong-tien-lai-xe-modal');
    var nidPT = parseInt(modal.getAttribute('data-nid-pt'));
    var selectLX = document.getElementById('ptlx-select-lai-xe');
    var nidLX = parseInt(selectLX.value) || 0;
    var btn = document.querySelector('.btn-luu-ptlx');

    if (!nidPT || nidPT <= 0) {
      if (notyf) notyf.error('Thiếu thông tin phương tiện');
      return;
    }
    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';

    $.ajax({
      url: '/api/phuong-tien-lai-xe',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        nid_phuong_tien: nidPT,
        nid_lai_xe: nidLX
      }),
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status === 'success') {
          if (notyf) notyf.success(nidLX > 0 ? 'Chọn lái xe thành công' : 'Đã xoá lái xe khỏi phương tiện');
          var bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
          if (typeof window.ptlxLoadList === 'function') window.ptlxLoadList();
        } else {
          if (notyf) notyf.error(res.message || 'Lỗi không xác định');
        }
      },
      error: function (jqXHR) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        var msg = 'Lỗi kết nối server';
        try { var r = JSON.parse(jqXHR.responseText); msg = r.message || msg; } catch (e) {}
        if (notyf) notyf.error(msg);
      }
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document) {
      if (t.classList && t.classList.contains('btn-luu-ptlx')) {
        e.preventDefault();
        ptlxSubmit();
        return;
      }
      t = t.parentNode;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.which === 13 && !e.shiftKey) {
      var form = document.getElementById('form-ptlx-assign');
      if (form && form.contains(e.target)) {
        e.preventDefault();
        var btn = document.querySelector('.btn-luu-ptlx');
        if (btn && !btn.disabled) btn.click();
      }
    }
  });

})(jQuery, Drupal);

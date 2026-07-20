(function ($, Drupal) {
  'use strict';

  var notyf;
  var moocCacheByDauKeo = {};

  function _jq(sel) {
    var j = typeof jQuery !== 'undefined' ? jQuery : (typeof $ !== 'undefined' ? $ : null);
    if (!j) return null;
    return j(sel);
  }

  Drupal.behaviors.ptmAssign = {
    attach: function () {
      if (typeof Notyf !== 'undefined' && !notyf) {
        notyf = new Notyf();
      }
    }
  };

  window.ptmOpenAssignModal = function (nidDauKeo, dauKeoText, currentMooc) {
    var modal = document.getElementById('phuong-tien-mooc-modal');
    var display = document.getElementById('ptm-display-dau-keo');
    var btn = document.querySelector('.btn-luu-ptm');
    var loading = document.getElementById('ptm-modal-loading');
    var selectMooc = document.getElementById('ptm-select-mooc');
    var currentText = document.getElementById('ptm-current-mooc');

    display.textContent = dauKeoText || '---';
    currentText.textContent = currentMooc && currentMooc.label ? currentMooc.label : 'Chưa chọn';
    btn.removeAttribute('disabled');
    btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
    modal.setAttribute('data-nid-dau-keo', nidDauKeo);

    var currentNidMooc = currentMooc ? parseInt(currentMooc.nid, 10) : null;
    var bsModal = new bootstrap.Modal(modal);
    bsModal.show();

    if (moocCacheByDauKeo[nidDauKeo]) {
      populateMoocSelect(selectMooc, moocCacheByDauKeo[nidDauKeo], currentNidMooc);
      initSelect2(currentNidMooc);
      return;
    }

    loading.style.display = '';
    selectMooc.innerHTML = '<option value="">Đang tải...</option>';
    $.ajax({
      url: '/api/phuong-tien-mooc',
      type: 'GET',
      dataType: 'json',
      data: { available: 1, nid_dau_keo: nidDauKeo },
      success: function (res) {
        loading.style.display = 'none';
        moocCacheByDauKeo[nidDauKeo] = res.status === 'success' && res.data && res.data.items ? res.data.items : [];
        populateMoocSelect(selectMooc, moocCacheByDauKeo[nidDauKeo], currentNidMooc);
        initSelect2(currentNidMooc);
      },
      error: function () {
        loading.style.display = 'none';
        moocCacheByDauKeo[nidDauKeo] = [];
        populateMoocSelect(selectMooc, [], currentNidMooc);
        initSelect2(currentNidMooc);
      }
    });
  };

  function populateMoocSelect(select, items, currentNidMooc) {
    select.innerHTML = '<option value="">-- Chọn mooc --</option>';
    for (var i = 0; i < items.length; i++) {
      var opt = document.createElement('option');
      opt.value = items[i].nid;
      opt.textContent = items[i].label || items[i].bks || '';
      select.appendChild(opt);
    }
    if (currentNidMooc) {
      select.value = String(currentNidMooc);
    }
  }

  function initSelect2(currentNidMooc) {
    var jqSel2 = _jq('#ptm-select-mooc');
    var jqModal = _jq('#phuong-tien-mooc-modal');
    var jqGlobal = typeof jQuery !== 'undefined' ? jQuery : (typeof $ !== 'undefined' ? $ : null);
    if (jqSel2 && jqSel2.length && jqGlobal && jqGlobal.fn && jqGlobal.fn.select2) {
      if (jqSel2.data('select2')) {
        jqSel2.select2('destroy');
      }
      jqSel2.select2({
        placeholder: 'Tìm kiếm BKS hoặc mã tài sản...',
        allowClear: true,
        width: '100%',
        dropdownParent: jqModal
      });
      if (currentNidMooc) {
        jqSel2.val(String(currentNidMooc)).trigger('change');
      }
    }
  }

  function ptmSubmit() {
    var modal = document.getElementById('phuong-tien-mooc-modal');
    var nidDauKeo = parseInt(modal.getAttribute('data-nid-dau-keo'), 10);
    var selectMooc = document.getElementById('ptm-select-mooc');
    var nidMooc = parseInt(selectMooc.value, 10);
    var btn = document.querySelector('.btn-luu-ptm');

    if (!nidDauKeo || nidDauKeo <= 0) {
      if (notyf) notyf.error('Thiếu thông tin đầu kéo');
      return;
    }

    btn.setAttribute('disabled', 'disabled');
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Đang lưu...';

    $.ajax({
      url: '/api/phuong-tien-mooc',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({
        nid_dau_keo: nidDauKeo,
        nid_mooc: nidMooc
      }),
      dataType: 'json',
      success: function (res) {
        btn.removeAttribute('disabled');
        btn.innerHTML = '<i class="ti tabler-device-floppy me-1"></i> Lưu';
        if (res.status === 'success') {
          moocCacheByDauKeo[nidDauKeo] = null;
          if (notyf) {
            if (res.data && res.data.removed === true) {
              notyf.success('Đã gỡ mooc khỏi đầu kéo');
            } else if (res.data && res.data.removed === false) {
              notyf.success('Không có thay đổi');
            } else {
              notyf.success('Chọn mooc thành công');
            }
          }
          var bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
          if (bsModal) bsModal.hide();
          if (typeof window.ptlxLoadList === 'function') window.ptlxLoadList();
        } else if (notyf) {
          notyf.error(res.message || 'Lỗi không xác định');
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
      if (t.classList && t.classList.contains('btn-luu-ptm')) {
        e.preventDefault();
        ptmSubmit();
        return;
      }
      t = t.parentNode;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.which === 13 && !e.shiftKey) {
      var form = document.getElementById('form-ptm-assign');
      if (form && form.contains(e.target)) {
        e.preventDefault();
        var btn = document.querySelector('.btn-luu-ptm');
        if (btn && !btn.disabled) btn.click();
      }
    }
  });

})(jQuery, Drupal);

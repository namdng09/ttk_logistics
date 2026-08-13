(function quanLyTaiChinhWaitForDependencies(factory) {
  'use strict';

  var retryCount = 0;
  var maxRetry = 200;

  function boot() {
    if (window.jQuery && window.Drupal && typeof window.jQuery.fn.off === 'function') {
      factory(window.jQuery, window.Drupal);
      return;
    }

    retryCount++;
    if (retryCount <= maxRetry) {
      window.setTimeout(boot, 50);
    }
  }

  boot();
})(function ($, Drupal) {
  'use strict';

  var NS = '.quanLyTaiChinh';
  var MODAL_ID = 'qltc-finance-runtime-modal';
  var MODAL_SELECTOR = '#' + MODAL_ID;
  var QUY_API_BASE = '/api/quan-ly-quy';
  var QUY_TRANSFER_API = '/api/quan-ly-quy/chuyen-tien';
  var QUY_PAGE_LIMIT = 20;
  var quyCurrentPage = 1;

  Drupal.behaviors = Drupal.behaviors || {};

  Drupal.behaviors.quanLyTaiChinh = {
    attach: function (context) {
      initMoneyInputs(context);
      initFlatpickrInputs(context);

      if ($(document).data('quanLyTaiChinhInited')) {
        return;
      }

      $(document).data('quanLyTaiChinhInited', true);
      bindEvents();
      if ($('.qltc-page-quy').length) {
        refreshQuyList();
      }
    }
  };

  $(function () {
    Drupal.behaviors.quanLyTaiChinh.attach(document);
  });

  function bindEvents() {
    $(document)
      .off('click' + NS, '.qltc-quy-open-modal')
      .on('click' + NS, '.qltc-quy-open-modal', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var title = $btn.attr('data-title') || $.trim($btn.text()) || 'Thông tin quỹ';
        var id = parseIdFromUrl($btn.attr('data-url') || $btn.attr('href'));

        openQuyModal(id ? 'form-edit' : 'form-create', title, id);
        return false;
      });

    $(document)
      .off('click' + NS, '.qltc-quy-detail-modal')
      .on('click' + NS, '.qltc-quy-detail-modal', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var title = $btn.attr('data-title') || $.trim($btn.text()) || 'Chi tiết quỹ';
        var id = parseIdFromUrl($btn.attr('data-url') || $btn.attr('href'));

        openQuyModal('detail', title, id);
        return false;
      });

    $(document)
      .off('click' + NS, '.qltc-quy-adjust-modal')
      .on('click' + NS, '.qltc-quy-adjust-modal', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var title = $btn.attr('data-title') || $.trim($btn.text()) || 'Điều chỉnh số dư đầu kỳ';
        var id = parseIdFromUrl($btn.attr('data-url') || $btn.attr('href'));

        openQuyModal('adjust', title, id);
        return false;
      });

    $(document)
      .off('submit' + NS, '#qltc-quy-form')
      .on('submit' + NS, '#qltc-quy-form', function (e) {
        e.preventDefault();
        saveQuy($(this));
        return false;
      });

    $(document)
      .off('submit' + NS, '#qltc-quy-adjust-form')
      .on('submit' + NS, '#qltc-quy-adjust-form', function (e) {
        e.preventDefault();
        saveQuyAdjust($(this));
        return false;
      });

    $(document)
      .off('submit' + NS, '#qltc-quy-transfer-form')
      .on('submit' + NS, '#qltc-quy-transfer-form', function (e) {
        e.preventDefault();
        submitChuyenTienForm($(this));
        return false;
      });

    $(document)
      .off('input' + NS, '#qltc-quy-adjust-form .qltc-adjust-new-balance')
      .on('input' + NS, '#qltc-quy-adjust-form .qltc-adjust-new-balance', function () {
        updateAdjustDiff($(this).closest('#qltc-quy-adjust-form'));
      });

    $(document)
      .off('click' + NS, '.qltc-quy-delete')
      .on('click' + NS, '.qltc-quy-delete', function (e) {
        e.preventDefault();
        e.stopPropagation();
        deleteQuy($(this));
        return false;
      });

    $(document)
      .off('click' + NS, '.qltc-ajax-modal')
      .on('click' + NS, '.qltc-ajax-modal', function (e) {
        e.preventDefault();
        openGenericModal($(this).attr('href'), $(this).attr('data-title') || $.trim($(this).text()) || 'Cập nhật dữ liệu');
      });

    $(document)
      .off('click' + NS, '.qltc-btn-reload')
      .on('click' + NS, '.qltc-btn-reload', function (e) {
        e.preventDefault();
        setFlatpickrValue($('#qltc-filter-from-date'), firstOfMonth());
        setFlatpickrValue($('#qltc-filter-to-date'), lastOfMonth());
        quyCurrentPage = 1;
        refreshQuyList();
      });

    $(document)
      .off('click' + NS, '.qltc-btn-filter')
      .on('click' + NS, '.qltc-btn-filter', function (e) {
        e.preventDefault();
        quyCurrentPage = 1;
        refreshQuyList();
        return false;
      });

    $(document)
      .off('click' + NS, '.qltc-quy-transfer-modal')
      .on('click' + NS, '.qltc-quy-transfer-modal', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openTransferModal();
        return false;
      });

    $(document)
      .off('click' + NS, '#qltc-pagination-wrap .page-link')
      .on('click' + NS, '#qltc-pagination-wrap .page-link', function (e) {
        e.preventDefault();
        var page = parseInt($(this).attr('data-page'), 10);
        if (!page || page === quyCurrentPage) {
          return false;
        }
        quyCurrentPage = page;
        refreshQuyList();
        return false;
      });

    $(document)
      .off('keypress' + NS, '#qltc-pagination-jump')
      .on('keypress' + NS, '#qltc-pagination-jump', function (e) {
        if (e.which === 13) {
          e.preventDefault();
          var total = parseInt($(this).attr('data-total-pages'), 10) || 1;
          var page = parseInt($(this).val(), 10);
          if (!page || page < 1) {
            page = 1;
          }
          if (page > total) {
            page = total;
          }
          if (page !== quyCurrentPage) {
            quyCurrentPage = page;
            refreshQuyList();
          }
          $(this).blur();
          return false;
        }
      });

    $(document)
      .off('submit' + NS, '.qltc-ajax-filter')
      .on('submit' + NS, '.qltc-ajax-filter', function (e) {
        e.preventDefault();
        var $form = $(this);
        var url = $form.attr('action') + '?' + $form.serialize();
        refreshFinanceRegion(url, $form.closest('.qltc-ajax-region'));
      });

    $(document)
      .off('click' + NS, '.qltc-ajax-region .pager a')
      .on('click' + NS, '.qltc-ajax-region .pager a', function (e) {
        e.preventDefault();
        refreshFinanceRegion($(this).attr('href'), $(this).closest('.qltc-ajax-region'));
      });

    $(document)
      .off('submit' + NS, MODAL_SELECTOR + ' form:not(#qltc-quy-form):not(#qltc-quy-adjust-form):not(#qltc-quy-transfer-form)')
      .on('submit' + NS, MODAL_SELECTOR + ' form:not(#qltc-quy-form):not(#qltc-quy-adjust-form):not(#qltc-quy-transfer-form)', function (e) {
        e.preventDefault();
        submitGenericModalForm($(this));
      });

    $(document)
      .off('hidden.bs.modal' + NS, MODAL_SELECTOR)
      .on('hidden.bs.modal' + NS, MODAL_SELECTOR, function () {
        var $modal = $(this);

        if ($modal.data('qltcRefreshQuyAfterHide')) {
          $modal.removeData('qltcRefreshQuyAfterHide');
          refreshQuyList();
        }

        $modal.find('.qltc-runtime-modal-body').empty();
        setModalLoading(false);
      });

    $(document)
      .off('input' + NS, '.qltc-money-input')
      .on('input' + NS, '.qltc-money-input', function () {
        formatMoneyInputWhileTyping(this);
      });

    $(document)
      .off('blur' + NS, '.qltc-money-input')
      .on('blur' + NS, '.qltc-money-input', function () {
        var val = parseMoney($(this).val());
        $(this).val(val ? formatMoney(val) : '0');
      });
  }

  function ensureModal() {
    var $modal = $(MODAL_SELECTOR);

    if ($modal.length) {
      return $modal;
    }

    var html = '' +
      '<div class="modal fade qltc-runtime-modal" id="' + MODAL_ID + '" tabindex="-1" aria-hidden="true" data-qltc-owned-modal="1">' +
      '  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-xl qltc-runtime-modal-dialog">' +
      '    <div class="modal-content qltc-runtime-modal-content">' +
      '      <div class="modal-header qltc-runtime-modal-header">' +
      '        <h5 class="modal-title qltc-runtime-modal-title">Cập nhật dữ liệu</h5>' +
      '        <button type="button" class="btn-close qltc-runtime-modal-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
      '      </div>' +
      '      <div class="modal-body qltc-runtime-modal-body"></div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    $('body').append(html);
    return $(MODAL_SELECTOR);
  }

  function setModalSize($modal, size) {
    var $dialog = $modal.find('.qltc-runtime-modal-dialog');

    $dialog
      .removeClass('modal-sm modal-lg modal-xl modal-fullscreen')
      .addClass(size || 'modal-lg');
  }

  function openQuyModal(mode, title, id) {
    var $modal = ensureModal();

    setModalSize($modal, 'modal-lg');
    $modal.find('.qltc-runtime-modal-title').text(title || 'Thông tin quỹ');
    $modal.find('.qltc-runtime-modal-body').html(renderLoadingHtml('Đang tải form quỹ...'));
    showModal($modal);

    if (mode === 'form-create') {
      $modal.find('.qltc-runtime-modal-body').html(renderQuyForm(null));
      initMoneyInputs($modal);
      initFlatpickrInputs($modal);
      return;
    }

    if (!id) {
      $modal.find('.qltc-runtime-modal-body').html(renderAlert('Thiếu ID quỹ.', 'danger'));
      return;
    }

    $.ajax({
      url: QUY_API_BASE + '/' + id,
      type: 'GET',
      dataType: 'json',
      beforeSend: function () {
        block('body');
      },
      success: function (response) {
        if (!isSuccessResponse(response) || !response.data) {
          $modal.find('.qltc-runtime-modal-body').html(renderAlert(response.message || 'Không tải được dữ liệu quỹ.', 'danger'));
          notify(response, 5000);
          return;
        }

        if (mode === 'detail') {
          setModalSize($modal, 'modal-xl');
          $modal.find('.qltc-runtime-modal-body').html(renderQuyDetail(response.data));
        }
        else if (mode === 'adjust') {
          setModalSize($modal, 'modal-lg');
          $modal.find('.qltc-runtime-modal-body').html(renderQuyAdjust(response.data));
        }
        else {
          setModalSize($modal, 'modal-lg');
          $modal.find('.qltc-runtime-modal-body').html(renderQuyForm(response.data));
        }

        initMoneyInputs($modal);
        initFlatpickrInputs($modal);
        updateAdjustDiff($modal.find('#qltc-quy-adjust-form'));

        if ($.fn.select2) {
          $modal.find('select').each(function () {
            var $select = $(this);
            if ($select.data('select2')) {
              try { $select.select2('destroy'); } catch (ignore) {}
            }
            $select.select2({
              dropdownParent: $modal,
              width: '100%'
            });
          });
        }
      },
      error: function (xhr) {
        $modal.find('.qltc-runtime-modal-body').html(renderAlert(getAjaxErrorMessage(xhr, 'Không tải được form quỹ.'), 'danger'));
      },
      complete: function () {
        unblock('body');
      }
    });
  }

  function saveQuy($form) {
    var $modal = $form.closest(MODAL_SELECTOR);
    var $content = $modal.find('.qltc-runtime-modal-content');
    var $btn = $form.find('.qltc-btn-save-quy').first();
    var id = parseInt($form.find('[name="nid_quy"]').val(), 10) || 0;
    var url = id ? (QUY_API_BASE + '/' + id) : QUY_API_BASE;
    var method = id ? 'PUT' : 'POST';
    var payload = {
      ma_quy: $form.find('[name="ma_quy"]').val(),
      ten_quy: $form.find('[name="ten_quy"]').val(),
      loai_quy: $form.find('[name="loai_quy"]').val(),
      so_du_dau_ky: $form.find('[name="so_du_dau_ky"]').val(),
      ghi_chu: $form.find('[name="ghi_chu"]').val()
    };

    clearFormAlert($form);
    setButtonLoading($btn, true);
    setFormDisabled($form, true);

    $.ajax({
      url: url,
      type: method,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      beforeSend: function () {
        block($content[0]);
      },
      success: function (response) {
        if (isSuccessResponse(response)) {
          notify(response, 4000);
          $modal.removeData('qltcRefreshQuyAfterHide');
          hideModal($modal);
          setTimeout(refreshQuyList, 250);
          return;
        }

        showFormAlert($form, response.message || response.content || 'Không lưu được thông tin quỹ.', 'danger');
        notify(response, 5000);
      },
      error: function (xhr) {
        var message = getAjaxErrorMessage(xhr, 'Không lưu được thông tin quỹ.');
        showFormAlert($form, message, 'danger');
        notify({ success: false, message: message }, 5000);
      },
      complete: function () {
        unblock($content[0]);
        setButtonLoading($btn, false);
        setFormDisabled($form, false);
      }
    });
  }

  function saveQuyAdjust($form) {
    var $modal = $form.closest(MODAL_SELECTOR);
    var $content = $modal.find('.qltc-runtime-modal-content');
    var $btn = $form.find('.qltc-btn-save-adjust').first();
    var id = parseInt($form.find('[name="nid_quy"]').val(), 10) || 0;
    var url = QUY_API_BASE + '/' + id + '?action=adjust';
    var payload = {
      so_du_moi: $form.find('[name="so_du_moi"]').val(),
      ly_do: $form.find('[name="ly_do"]').val(),
      ngay_dieu_chinh: $form.find('[name="ngay_dieu_chinh"]').val()
    };

    clearFormAlert($form);
    setButtonLoading($btn, true);
    setFormDisabled($form, true);

    $.ajax({
      url: url,
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      beforeSend: function () {
        block($content[0]);
      },
      success: function (response) {
        if (isSuccessResponse(response)) {
          notify(response, 4500);
          hideModal($modal);
          setTimeout(refreshQuyList, 250);
          return;
        }

        showFormAlert($form, response.message || response.content || 'Không lưu được điều chỉnh số dư.', 'danger');
        notify(response, 5000);
      },
      error: function (xhr) {
        var message = getAjaxErrorMessage(xhr, 'Không lưu được điều chỉnh số dư.');
        showFormAlert($form, message, 'danger');
        notify({ success: false, message: message }, 5000);
      },
      complete: function () {
        unblock($content[0]);
        setButtonLoading($btn, false);
        setFormDisabled($form, false);
      }
    });
  }

  function updateAdjustDiff($form) {
    if (!$form || !$form.length) return;

    var oldBalance = parseMoney($form.find('[name="so_du_cu"]').val());
    var newBalance = parseMoney($form.find('[name="so_du_moi"]').val());
    var diff = newBalance - oldBalance;
    var $diff = $form.find('.qltc-adjust-diff');

    $diff
      .removeClass('text-success text-danger text-muted')
      .addClass(diff > 0 ? 'text-success' : (diff < 0 ? 'text-danger' : 'text-muted'))
      .val((diff > 0 ? '+' : '') + formatMoney(diff));
  }

  function deleteQuy($btn) {
    var id = parseIdFromUrl($btn.attr('data-url') || '');
    var url = QUY_API_BASE + '/' + id;
    var title = $btn.attr('data-title') || 'quỹ này';

    confirmDialog('Xóa quỹ?', 'Bạn có chắc chắn muốn xóa ' + title + '?', function () {
      $.ajax({
        url: url,
        type: 'DELETE',
        dataType: 'json',
        beforeSend: function () {
          block('#qltc-quy-list-wrapper');
        },
        success: function (response) {
          notify(response, 4000);
          if (isSuccessResponse(response)) {
            refreshQuyList();
          }
        },
        error: function (xhr) {
          notify({ success: false, message: getAjaxErrorMessage(xhr, 'Không xóa được quỹ.') }, 5000);
        },
        complete: function () {
          unblock('#qltc-quy-list-wrapper');
        }
      });
    });
  }

  function refreshQuyList() {
    var $wrapper = $('#qltc-quy-list-wrapper');
    if (!$wrapper.length) {
      refreshFinanceRegion(window.location.href, $('.qltc-ajax-region').first());
      return;
    }

    var url = $wrapper.attr('data-api-url') || QUY_API_BASE;
    var params = { page: quyCurrentPage };
    var fromDate = $('#qltc-filter-from-date').val() || $('.qltc-page-quy form input[name="from_date"]').first().val();
    var toDate = $('#qltc-filter-to-date').val() || $('.qltc-page-quy form input[name="to_date"]').first().val();
    if (fromDate) {
      params.from_date = fromDate;
    }
    if (toDate) {
      params.to_date = toDate;
    }
    setQuyTableLoading();
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      data: params,
      beforeSend: function () {
        block('#qltc-quy-list-wrapper');
      },
      success: function (response) {
        if (isSuccessResponse(response) && response.data && response.data.items) {
          renderQuyList(response.data);
          return;
        }

        if (response && response.message) {
          notify(response, 4000);
        }
        notify(response, 4000);
        setQuyTableEmpty();
      },
      error: function (xhr) {
        notify({ success: false, message: getAjaxErrorMessage(xhr, 'Không tải được danh sách quỹ.') }, 5000);
        setQuyTableEmpty();
      },
      complete: function () {
        unblock('#qltc-quy-list-wrapper');
      }
    });
  }

  function setQuyTableLoading() {
    var $tbody = $('#qltc-quy-table-body');
    if (!$tbody.length) {
      return;
    }
    $tbody.html('<tr><td colspan="11" class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Đang tải...</span></div></td></tr>');
  }

  function setQuyTableEmpty() {
    var $tbody = $('#qltc-quy-table-body');
    if (!$tbody.length) {
      return;
    }
    $tbody.html('<tr><td colspan="11" class="text-center">Không tải được dữ liệu quỹ.</td></tr>');
  }

  function openGenericModal(url, title) {
    var $modal = ensureModal();
    setModalSize($modal, 'modal-lg');
    $modal.find('.qltc-runtime-modal-title').text(title || 'Cập nhật dữ liệu');
    $modal.find('.qltc-runtime-modal-body').html(renderLoadingHtml('Đang tải dữ liệu...'));
    showModal($modal);

    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'html',
      beforeSend: function () {
        block('body');
      },
      success: function (html) {
        var body = extractModalBody(html);
        $modal.find('.qltc-runtime-modal-body').html(body);
        initMoneyInputs($modal);
        initFlatpickrInputs($modal);
      },
      error: function (xhr) {
        $modal.find('.qltc-runtime-modal-body').html(renderAlert(getAjaxErrorMessage(xhr, 'Không tải được form.'), 'danger'));
      },
      complete: function () {
        unblock('body');
      }
    });
  }

  function submitGenericModalForm($form) {
    var $modal = $form.closest(MODAL_SELECTOR);
    var $body = $modal.find('.qltc-runtime-modal-body');
    var $content = $modal.find('.qltc-runtime-modal-content');
    var formData = $form.serialize();
    var url = $form.attr('action') || window.location.href;

    $.ajax({
      url: url,
      type: ($form.attr('method') || 'POST').toUpperCase(),
      data: formData,
      dataType: 'html',
      beforeSend: function () {
        block($content[0]);
      },
      success: function (html) {
        var hasError = html.indexOf('messages error') !== -1 || html.indexOf('error messages') !== -1 || html.indexOf('form-item--error') !== -1 || html.indexOf('error"') !== -1;
        if (hasError) {
          $body.html(extractModalBody(html));
          initMoneyInputs($modal);
          initFlatpickrInputs($modal);
          return;
        }

        notify({ success: true, message: 'Cập nhật dữ liệu thành công.' }, 4000);
        hideModal($modal);
        refreshFinanceRegion(window.location.href, $('.qltc-ajax-region').first());
      },
      error: function (xhr) {
        $body.html(renderAlert(getAjaxErrorMessage(xhr, 'Không lưu được dữ liệu.'), 'danger'));
      },
      complete: function () {
        unblock($content[0]);
      }
    });
  }

  function renderChuyenTienForm(quys) {
    var optHtml = '<option value="">- Chọn quỹ -</option>';
    for (var i = 0; i < quys.length; i++) {
      var q = quys[i];
      var label = escapeHtml((q.ten_quy || '') + (q.ma_quy ? ' (' + q.ma_quy + ')' : ''));
      optHtml += '<option value="' + parseInt(q.nid, 10) + '">' + label + '</option>';
    }
    return '<div class="qltc-modal-content" data-qltc-form-key="quy-transfer">' +
      '<form id="qltc-quy-transfer-form" class="qltc-quy-transfer-form qltc-module-form qltc-bootstrap-form" method="post">' +
      '<div class="row g-3">' +
      '<div class="col-12 col-md-6"><label class="form-label fw-semibold">Quỹ chuyển <span class="text-danger">*</span></label><select class="form-select" name="nid_quy" required>' + optHtml + '</select></div>' +
      '<div class="col-12 col-md-6"><label class="form-label fw-semibold">Quỹ nhận <span class="text-danger">*</span></label><select class="form-select" name="nid_quy_nhan" required>' + optHtml + '</select></div>' +
      '</div>' +
      '<div class="row g-3 mt-1">' +
      '<div class="col-12 col-md-6"><label class="form-label fw-semibold">Số tiền <span class="text-danger">*</span></label><input type="text" inputmode="numeric" class="form-control text-end qltc-money-input" name="so_tien" value="0" placeholder="0" required></div>' +
      '<div class="col-12 col-md-6"><label class="form-label fw-semibold">Ngày chuyển <span class="text-danger">*</span></label><input type="text" class="form-control qltc-flatpickr-date" name="ngay_giao_dich" value="' + currentDate() + '" autocomplete="off" required></div>' +
      '</div>' +
      '<div class="row g-3 mt-1">' +
      '<div class="col-12"><label class="form-label fw-semibold">Diễn giải</label><textarea class="form-control" name="dien_giai" rows="3" placeholder="VD: Chuyển tiền nội bộ giữa các quỹ">Chuyển tiền nội bộ giữa các quỹ</textarea></div>' +
      '</div>' +
      '<div class="qltc-form-alert mt-3 d-none"></div>' +
      '<div class="qltc-modal-actions d-flex justify-content-end gap-2 mt-4 pt-2"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button><button type="submit" class="btn btn-primary qltc-btn-save-transfer"><span class="spinner-border spinner-border-sm me-1 d-none qltc-btn-spinner" role="status" aria-hidden="true"></span><span class="qltc-btn-text"><i class="icon-base ti tabler-arrows-exchange me-1"></i>Lưu chuyển tiền</span></button></div>' +
      '</form></div>';
  }

  function initTransferSelects($modal) {
    if (!$.fn.select2) {
      return;
    }
    $modal.find('#qltc-quy-transfer-form select').each(function () {
      var $select = $(this);
      if ($select.data('select2')) {
        try { $select.select2('destroy'); } catch (ignore) {}
      }
      $select.select2({
        dropdownParent: $modal,
        width: '100%',
        placeholder: '- Chọn quỹ -',
        allowClear: false
      });
    });
  }

  function openTransferModal() {
    var $modal = ensureModal();
    setModalSize($modal, 'modal-lg');
    $modal.find('.qltc-runtime-modal-title').text('Chuyển tiền nội bộ');
    $modal.find('.qltc-runtime-modal-body').html(renderLoadingHtml('Đang tải danh sách quỹ...'));
    showModal($modal);

    $.ajax({
      url: QUY_API_BASE + '?limit=100',
      type: 'GET',
      dataType: 'json',
      beforeSend: function () {
        block('body');
      },
      success: function (response) {
        if (!isSuccessResponse(response) || !response.data) {
          $modal.find('.qltc-runtime-modal-body').html(renderAlert(response.message || 'Không tải được danh sách quỹ.', 'danger'));
          notify(response, 5000);
          return;
        }

        var quys = response.data.items || [];
        if (!quys.length) {
          $modal.find('.qltc-runtime-modal-body').html(renderAlert('Chưa có quỹ hoạt động nào để chuyển tiền.', 'warning'));
          return;
        }

        $modal.find('.qltc-runtime-modal-body').html(renderChuyenTienForm(quys));
        initMoneyInputs($modal);
        initFlatpickrInputs($modal);
        initTransferSelects($modal);
      },
      error: function (xhr) {
        $modal.find('.qltc-runtime-modal-body').html(renderAlert(getAjaxErrorMessage(xhr, 'Không tải được danh sách quỹ.'), 'danger'));
      },
      complete: function () {
        unblock('body');
      }
    });
  }

  function submitChuyenTienForm($form) {
    var $modal = $form.closest(MODAL_SELECTOR);
    var $content = $modal.find('.qltc-runtime-modal-content');
    var $btn = $form.find('.qltc-btn-save-transfer').first();
    var payload = {
      nid_quy: $form.find('[name="nid_quy"]').val(),
      nid_quy_nhan: $form.find('[name="nid_quy_nhan"]').val(),
      so_tien: $form.find('[name="so_tien"]').val(),
      ngay_giao_dich: $form.find('[name="ngay_giao_dich"]').val(),
      dien_giai: $form.find('[name="dien_giai"]').val()
    };

    clearFormAlert($form);
    setButtonLoading($btn, true);
    setFormDisabled($form, true);

    $.ajax({
      url: QUY_TRANSFER_API,
      type: 'POST',
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      beforeSend: function () {
        block($content[0]);
      },
      success: function (response) {
        if (isSuccessResponse(response)) {
          notify({ success: true, message: 'Chuyển tiền nội bộ thành công.' }, 4000);
          hideModal($modal);
          setTimeout(refreshQuyList, 250);
          return;
        }

        showFormAlert($form, response.message || response.content || 'Không chuyển được tiền.', 'danger');
        notify(response, 5000);
      },
      error: function (xhr) {
        var message = getAjaxErrorMessage(xhr, 'Không chuyển được tiền.');
        showFormAlert($form, message, 'danger');
        notify({ success: false, message: message }, 5000);
      },
      complete: function () {
        unblock($content[0]);
        setButtonLoading($btn, false);
        setFormDisabled($form, false);
      }
    });
  }

  function extractModalBody(html) {
    var $parsed = $('<div>').append($.parseHTML(html, document, true));
    var $moduleContent = $parsed.find('.qltc-modal-content').first();
    var $forms = $parsed.find('form').filter(function () {
      return $(this).find('input, select, textarea').length > 0;
    });
    var messages = $parsed.find('.messages, .status, .warning, .error').map(function () {
      return this.outerHTML;
    }).get().join('');

    if ($moduleContent.length) {
      return messages + $('<div>').append($moduleContent.clone()).html();
    }

    if ($forms.length) {
      return messages + $('<div>').append($forms.first().clone()).html();
    }

    return messages + html;
  }

  function refreshFinanceRegion(url, $region) {
    $region = $region && $region.length ? $region : $('.qltc-ajax-region').first();
    if (!$region.length) {
      window.location.href = url;
      return;
    }

    $region.addClass('qltc-region-loading');
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'html',
      beforeSend: function () {
        block($region[0]);
      },
      success: function (html) {
        var $parsed = $('<div>').append($.parseHTML(html, document, true));
        var $newRegion = $parsed.find('.qltc-ajax-region').first();

        if ($newRegion.length) {
          $region.replaceWith($newRegion);
          Drupal.attachBehaviors($newRegion.get(0));
        }
        else {
          window.location.href = url;
        }
      },
      error: function () {
        window.location.href = url;
      },
      complete: function () {
        $('.qltc-ajax-region').removeClass('qltc-region-loading');
        unblock($region[0]);
      }
    });
  }

  function renderQuyList(data) {
    var items = data.items || [];
    var startIndex = ((parseInt(data.current_page, 10) || 1) - 1) * (parseInt(data.limit, 10) || QUY_PAGE_LIMIT) + 1;
    var html = '';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var period = item.period || {};
      html += '<tr>' +
        '<td class="text-center">' + buildQuyActions(item) + '</td>' +
        '<td class="text-center">' + (startIndex + i) + '</td>' +
        '<td><span class="fw-semibold">' + escapeHtml(item.ma_quy || '') + '</span></td>' +
        '<td><strong>' + escapeHtml(item.ten_quy || '') + '</strong>' + (item.ghi_chu ? '<div class="qltc-muted">' + escapeHtml(item.ghi_chu) + '</div>' : '') + '</td>' +
        '<td>' + escapeHtml(loaiQuyLabel(item.loai_quy || '')) + '</td>' +
        '<td class="text-end">' + formatMoney(period.dau_ky || 0) + '</td>' +
        '<td class="text-end text-success">' + formatMoney(period.thu || 0) + '</td>' +
        '<td class="text-end text-danger">' + formatMoney(period.chi || 0) + '</td>' +
        '<td class="text-end text-success">' + formatMoney(period.chuyen_den || 0) + '</td>' +
        '<td class="text-end text-danger">' + formatMoney(period.chuyen_di || 0) + '</td>' +
        '<td class="text-end"><strong>' + formatMoney(period.cuoi_ky || 0) + '</strong></td>' +
        '</tr>';
    }
    if (!html) {
      html = '<tr><td colspan="11" class="text-center py-4 text-muted">Chưa có quỹ nào.</td></tr>';
    }
    $('#qltc-quy-table-body').html(html);
    renderQuyPagination(data);
  }

  function renderQuyPagination(data) {
    var $wrap = $('#qltc-pagination-wrap');
    if (!$wrap.length) {
      return;
    }

    var total = data.total || 0;
    var current = data.current_page || 0;
    var totalPages = data.total_pages || 0;
    var $ul = $wrap.find('ul.pagination');
    var $info = $wrap.find('#qltc-pagination-info');
    var $totalPages = $wrap.find('#qltc-pagination-total-pages');
    var $jump = $wrap.find('#qltc-pagination-jump');

    if (!totalPages) {
      $wrap.hide();
      return;
    }
    $wrap.show();

    if ($info.length) {
      $info.text('Tổng số: ' + total + ' bản ghi');
    }
    if ($totalPages.length) {
      $totalPages.text('/ ' + totalPages);
    }
    if ($jump.length) {
      $jump.val(current);
      $jump.attr('data-total-pages', totalPages);
    }

    var html = '';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-first" href="#" data-page="1"><i class="ti tabler-chevrons-left"></i></a></li>';
    html += '<li class="page-item ' + (current <= 1 ? 'disabled' : '') + '"><a class="page-link page-prev" href="#" data-page="' + (current - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';

    var start = Math.max(1, current - 2);
    var end = Math.min(totalPages, current + 2);

    if (start > 1) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    for (var p = start; p <= end; p++) {
      html += '<li class="page-item ' + (p === current ? 'active' : '') + '"><a class="page-link" href="#" data-page="' + p + '">' + p + '</a></li>';
    }

    if (end < totalPages) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }

    html += '<li class="page-item ' + (current >= totalPages ? 'disabled' : '') + '"><a class="page-link page-next" href="#" data-page="' + (current + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    html += '<li class="page-item ' + (current >= totalPages ? 'disabled' : '') + '"><a class="page-link page-last" href="#" data-page="' + totalPages + '"><i class="ti tabler-chevrons-right"></i></a></li>';

    $ul.html(html);
  }

  function buildQuyActions(item) {
    return '<div class="dropdown qltc-function-dropdown">' +
      '<button type="button" class="btn btn-sm btn-icon btn-label-secondary rounded-pill qltc-function-btn" data-bs-toggle="dropdown" aria-expanded="false"><i class="ti tabler-dots-vertical"></i></button>' +
      '<ul class="dropdown-menu">' +
      '<li><a href="#" class="dropdown-item qltc-quy-detail-modal" data-url="' + QUY_API_BASE + '/' + item.nid + '" data-title="Chi tiết quỹ"><i class="ti tabler-eye me-2"></i>Xem</a></li>' +
      '<li><a href="#" class="dropdown-item qltc-quy-open-modal" data-url="' + QUY_API_BASE + '/' + item.nid + '" data-title="Sửa quỹ"><i class="ti tabler-edit me-2"></i>Sửa</a></li>' +
      '<li><a href="#" class="dropdown-item qltc-quy-adjust-modal" data-url="' + QUY_API_BASE + '/' + item.nid + '?action=adjust" data-title="Điều chỉnh số dư đầu kỳ"><i class="ti tabler-adjustments-dollar me-2"></i>Điều chỉnh</a></li>' +
      '<li><hr class="dropdown-divider"></li>' +
      '<li><a href="#" class="dropdown-item text-danger qltc-quy-delete" data-url="' + QUY_API_BASE + '/' + item.nid + '" data-title="' + escapeHtml(item.ten_quy || '') + '"><i class="ti tabler-trash me-2"></i>Xóa</a></li>' +
      '</ul></div>';
  }

  function parseIdFromUrl(url) {
    var match = String(url || '').match(/(\d+)(?:\?.*)?$/);
    return match ? parseInt(match[1], 10) : 0;
  }

  function renderQuyForm(item) {
    item = item || {};
    var isEdit = !!item.nid;
    return '<div class="qltc-modal-content" data-qltc-form-key="quy">' +
      '<form id="qltc-quy-form" class="qltc-quy-form qltc-module-form qltc-bootstrap-form" method="post">' +
      '<input type="hidden" name="nid_quy" value="' + (item.nid || 0) + '">' +
      '<div class="row g-3 qltc-quy-field-row">' +
      '<div class="col-12 col-md-2"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold">Mã quỹ <span class="text-danger">*</span></label><input type="text" class="form-control" name="ma_quy" value="' + escapeHtml(item.ma_quy || '') + '" placeholder="VD: TM01" required></div></div></div>' +
      '<div class="col-12 col-md-4"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold">Tên quỹ <span class="text-danger">*</span></label><input type="text" class="form-control" name="ten_quy" value="' + escapeHtml(item.ten_quy || '') + '" placeholder="VD: Tiền mặt công ty" required></div></div></div>' +
      '<div class="col-12 col-md-3"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold">Loại quỹ</label><select class="form-select" name="loai_quy"><option value="tien_mat"' + ((item.loai_quy || 'tien_mat') === 'tien_mat' ? ' selected' : '') + '>Tiền mặt</option><option value="ngan_hang"' + (item.loai_quy === 'ngan_hang' ? ' selected' : '') + '>Ngân hàng</option><option value="vi_noi_bo"' + (item.loai_quy === 'vi_noi_bo' ? ' selected' : '') + '>Ví nội bộ</option></select></div></div></div>' +
      '<div class="col-12 col-md-3"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold">Số dư đầu kỳ</label><input type="text" inputmode="numeric" class="form-control text-end qltc-money-input' + (isEdit ? ' bg-light' : '') + '" name="so_du_dau_ky" value="' + formatMoney(item.so_du_dau_ky || 0) + '" placeholder="0"' + (isEdit ? ' readonly disabled data-qltc-locked="1"' : '') + '>' + (isEdit ? '<div class="form-text small text-muted">Không cho sửa số dư đầu kỳ sau khi tạo quỹ.</div>' : '') + '</div></div></div>' +
      '</div>' +
      '<div class="row g-3 mt-2 qltc-quy-note-row"><div class="col-12"><div class="row g-1"><div class="col-12"><label class="form-label fw-semibold">Ghi chú</label><textarea class="form-control" name="ghi_chu" rows="3" placeholder="Nhập ghi chú nếu có">' + escapeHtml(item.ghi_chu || '') + '</textarea></div></div></div></div>' +
      '<div class="qltc-form-alert mt-3 d-none"></div>' +
      '<div class="qltc-modal-actions d-flex justify-content-end gap-2 mt-4 pt-2"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button><button type="submit" class="btn btn-primary qltc-btn-save-quy"><span class="spinner-border spinner-border-sm me-1 d-none qltc-btn-spinner" role="status" aria-hidden="true"></span><span class="qltc-btn-text"><i class="icon-base ti tabler-device-floppy me-1"></i>' + (isEdit ? 'Cập nhật quỹ' : 'Lưu quỹ') + '</span></button></div>' +
      '</form></div>';
  }

  function renderQuyAdjust(item) {
    var oldBalance = item.so_du_dau_ky || 0;
    return '<div class="qltc-modal-content" data-qltc-form-key="quy-adjust"><form id="qltc-quy-adjust-form" class="qltc-quy-adjust-form qltc-module-form qltc-bootstrap-form" method="post">' +
      '<input type="hidden" name="nid_quy" value="' + (item.nid || 0) + '"><input type="hidden" name="so_du_cu" value="' + formatMoney(oldBalance) + '">' +
      '<div class="alert alert-info py-2 mb-3"><strong>Lưu ý:</strong> Điều chỉnh số dư đầu kỳ không tạo phiếu thu/chi. Hệ thống sẽ lưu lịch sử điều chỉnh.</div>' +
      '<div class="row g-3 align-items-end"><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Mã quỹ</label><input type="text" class="form-control bg-light" value="' + escapeHtml(item.ma_quy || '') + '" readonly></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Tên quỹ</label><input type="text" class="form-control bg-light" value="' + escapeHtml(item.ten_quy || '') + '" readonly></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Số dư đầu kỳ hiện tại</label><input type="text" class="form-control text-end bg-light" value="' + formatMoney(oldBalance) + '" readonly></div></div>' +
      '<div class="row g-3 align-items-end mt-1"><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Số dư đầu kỳ mới <span class="text-danger">*</span></label><input type="text" inputmode="numeric" class="form-control text-end qltc-money-input qltc-adjust-new-balance" name="so_du_moi" value="' + formatMoney(oldBalance) + '" required></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Chênh lệch</label><input type="text" class="form-control text-end bg-light qltc-adjust-diff" value="0" readonly></div><div class="col-12 col-md"><label class="form-label fw-semibold mb-1">Ngày điều chỉnh</label><input type="text" class="form-control qltc-flatpickr-date" name="ngay_dieu_chinh" value="' + escapeHtml(currentDate()) + '" autocomplete="off"></div></div>' +
      '<div class="row g-3 mt-2"><div class="col-12"><label class="form-label fw-semibold mb-1">Lý do điều chỉnh <span class="text-danger">*</span></label><textarea class="form-control" name="ly_do" rows="3" placeholder="VD: Cập nhật số dư theo sao kê ngân hàng" required></textarea></div></div>' +
      '<div class="qltc-form-alert mt-3 d-none"></div>' +
      '<div class="d-flex justify-content-end gap-2 mt-4 pt-2"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button><button type="submit" class="btn btn-warning qltc-btn-save-adjust"><span class="spinner-border spinner-border-sm me-1 d-none qltc-btn-spinner" role="status" aria-hidden="true"></span><span class="qltc-btn-text"><i class="icon-base ti tabler-adjustments-dollar me-1"></i>Lưu điều chỉnh</span></button></div>' +
      '</form></div>';
  }

  function renderQuyDetail(item) {
    return '<div class="qltc-modal-content qltc-quy-detail" data-qltc-form-key="quy-detail">' +
      '<div class="row g-3 mb-3"><div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Mã quỹ</div><div class="fw-semibold">' + escapeHtml(item.ma_quy || '') + '</div></div></div></div><div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Tên quỹ</div><div class="fw-semibold">' + escapeHtml(item.ten_quy || '') + '</div></div></div></div><div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Loại quỹ</div><div class="fw-semibold">' + escapeHtml(loaiQuyLabel(item.loai_quy || '')) + '</div></div></div></div><div class="col-12 col-md-3"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Trạng thái</div><span class="badge bg-label-success">Đang hoạt động</span></div></div></div></div>' +
      '<div class="row g-3 mb-3"><div class="col-12 col-md-4"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Số dư đầu kỳ</div><div class="h5 mb-0 text-primary">' + formatMoney(item.so_du_dau_ky || 0) + '</div></div></div></div><div class="col-12 col-md-4"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Số dư hiện tại</div><div class="h5 mb-0 text-success">' + formatMoney(item.so_du_hien_tai || 0) + '</div></div></div></div><div class="col-12 col-md-4"><div class="card h-100 border"><div class="card-body py-3"><div class="text-muted small mb-1">Cập nhật gần nhất</div><div class="fw-semibold">' + escapeHtml(item.changed ? formatDateTime(item.changed) : '-') + '</div></div></div></div></div>' +
      (item.ghi_chu ? '<div class="alert alert-secondary py-2 mb-3"><strong>Ghi chú:</strong> ' + escapeHtml(item.ghi_chu) + '</div>' : '') +
      '<div class="d-flex justify-content-end mt-3"><button type="button" class="btn btn-label-secondary" data-bs-dismiss="modal">Đóng</button></div>' +
      '</div>';
  }

  function currentDate() {
    var d = new Date();
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function firstOfMonth() {
    var d = new Date();
    return '01/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function lastOfMonth() {
    var d = new Date();
    var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return String(last).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  function setFlatpickrValue($input, value) {
    if ($input.length && $input[0]._flatpickr) {
      $input[0]._flatpickr.setDate(value, true);
    }
    else {
      $input.val(value);
    }
  }

  function loaiQuyLabel(value) {
    var labels = {
      'tien_mat': 'Tiền mặt',
      'ngan_hang': 'Ngân hàng',
      'vi_noi_bo': 'Ví nội bộ'
    };
    return labels[value] || value || '';
  }

  function formatDateTime(timestamp) {
    var d = new Date(parseInt(timestamp, 10) * 1000);
    if (isNaN(d.getTime())) return '';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function initMoneyInputs(context) {
    $(context || document).find('.qltc-money-input').each(function () {
      var val = parseMoney($(this).val());
      $(this).val(val ? formatMoney(val) : '0');
    });
  }

  function initFlatpickrInputs(context) {
    if (typeof flatpickr !== 'function') {
      return;
    }

    $(context || document).find('.qltc-flatpickr-date').each(function () {
      if (this._flatpickr) {
        return;
      }
      flatpickr(this, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        static: true
      });
    });
  }

  function parseMoney(value) {
    if (value === null || typeof value === 'undefined') {
      return 0;
    }
    value = String(value).replace(/[^0-9-]/g, '');
    if (value === '' || value === '-') {
      return 0;
    }
    return parseInt(value, 10) || 0;
  }

  function formatMoney(value) {
    value = parseMoney(value);
    var negative = value < 0;
    var str = String(Math.abs(value));
    str = str.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return negative ? '-' + str : str;
  }

  function formatMoneyInputWhileTyping(input) {
    var caret = input.selectionStart || 0;
    var oldLength = input.value.length;
    input.value = formatMoney(input.value);
    var newLength = input.value.length;
    try {
      input.setSelectionRange(caret + (newLength - oldLength), caret + (newLength - oldLength));
    } catch (ignore) {}
  }

  function renderLoadingHtml(text) {
    return '<div class="d-flex align-items-center justify-content-center py-5 text-muted"><div class="spinner-border spinner-border-sm me-2"></div>' + escapeHtml(text || 'Đang tải...') + '</div>';
  }

  function renderAlert(message, type) {
    return '<div class="alert alert-' + escapeHtml(type || 'info') + '">' + escapeHtml(message || '') + '</div>';
  }

  function showFormAlert($form, message, type) {
    var $alert = $form.find('.qltc-form-alert');
    if (!$alert.length) {
      $alert = $('<div class="qltc-form-alert mt-3"></div>');
      $form.append($alert);
    }
    $alert.removeClass('d-none alert-success alert-danger alert-warning alert-info').addClass('alert alert-' + (type || 'danger')).html(escapeHtml(message || ''));
  }

  function clearFormAlert($form) {
    $form.find('.qltc-form-alert').addClass('d-none').removeClass('alert-success alert-danger alert-warning alert-info').empty();
  }

  function setButtonLoading($btn, loading) {
    if (!$btn || !$btn.length) return;
    $btn.prop('disabled', !!loading);
    $btn.find('.qltc-btn-spinner').toggleClass('d-none', !loading);
  }

  function setFormDisabled($form, disabled) {
    $form.find('input, select, textarea, button').prop('disabled', !!disabled);
    $form.find('[data-qltc-locked="1"]').prop('disabled', true);
  }

  function isSuccessResponse(response) {
    return !!(response && (response.success === true || response.status === 'success'));
  }

  function getAjaxErrorMessage(xhr, fallback) {
    var responseText = xhr && xhr.responseText ? xhr.responseText : '';
    try {
      var data = JSON.parse(responseText);
      if (data && data.message) {
        return data.message;
      }
    } catch (ignore) {}
    if (responseText) {
      var plain = $('<div>').html(responseText).text().replace(/\s+/g, ' ').trim();
      if (plain) {
        return plain;
      }
    }
    return fallback || 'Có lỗi xảy ra.';
  }

  function notify(response, timeout) {
    var success = response && (response.success === true || response.status === 'success');
    var message = response && (response.message || response.content) ? (response.message || response.content) : '';
    if (!message) return;

    if (window.Notyf) {
      window._qltcNotyf = window._qltcNotyf || new window.Notyf({ duration: timeout || 4000 });
      if (success) {
        window._qltcNotyf.success(message);
      }
      else {
        window._qltcNotyf.error(message);
      }
      return;
    }

    if (success) {
      alert(message);
    }
  }

  function confirmDialog(title, text, onConfirm) {
    if (window.Swal && typeof window.Swal.fire === 'function') {
      window.Swal.fire({
        title: title || 'Xác nhận',
        text: text || '',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy',
        customClass: { confirmButton: 'btn btn-primary', cancelButton: 'btn btn-label-secondary ms-1' },
        buttonsStyling: false
      }).then(function (result) {
        if (result.isConfirmed && typeof onConfirm === 'function') {
          onConfirm();
        }
      });
      return;
    }

    if (window.confirm(text || title || 'Xác nhận?') && typeof onConfirm === 'function') {
      onConfirm();
    }
  }

  function block(target) {
    if (window.Notiflix && window.Notiflix.Block && target) {
      try {
        window.Notiflix.Block.standard(target);
        return;
      } catch (ignore) {}
    }
  }

  function unblock(target) {
    if (window.Notiflix && window.Notiflix.Block && target) {
      try {
        window.Notiflix.Block.remove(target);
        return;
      } catch (ignore) {}
    }
  }

  function showModal($modal) {
    if (!$modal || !$modal.length) return;
    var instance = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal.getOrCreateInstance($modal[0]) : null;
    if (instance) {
      instance.show();
    }
  }

  function hideModal($modal) {
    if (!$modal || !$modal.length) return;
    var instance = window.bootstrap && window.bootstrap.Modal ? window.bootstrap.Modal.getInstance($modal[0]) : null;
    if (instance) {
      instance.hide();
    }
  }

  function setModalLoading() {}

  function escapeHtml(value) {
    return $('<div>').text(value === null || value === undefined ? '' : value).html();
  }
});

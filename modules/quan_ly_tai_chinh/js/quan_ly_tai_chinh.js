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
        var url = $btn.attr('data-url') || $btn.attr('href');
        var title = $btn.attr('data-title') || $.trim($btn.text()) || 'Thông tin quỹ';

        openQuyModal(url, title);
        return false;
      });

    $(document)
      .off('click' + NS, '.qltc-quy-detail-modal')
      .on('click' + NS, '.qltc-quy-detail-modal', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var url = $btn.attr('data-url') || $btn.attr('href');
        var title = $btn.attr('data-title') || $.trim($btn.text()) || 'Chi tiết quỹ';

        openQuyModal(url, title);
        return false;
      });

    $(document)
      .off('click' + NS, '.qltc-quy-adjust-modal')
      .on('click' + NS, '.qltc-quy-adjust-modal', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var url = $btn.attr('data-url') || $btn.attr('href');
        var title = $btn.attr('data-title') || $.trim($btn.text()) || 'Điều chỉnh số dư đầu kỳ';

        openQuyModal(url, title);
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
      .off('submit' + NS, MODAL_SELECTOR + ' form:not(#qltc-quy-form):not(#qltc-quy-adjust-form)')
      .on('submit' + NS, MODAL_SELECTOR + ' form:not(#qltc-quy-form):not(#qltc-quy-adjust-form)', function (e) {
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
      '  <div class="modal-dialog modal-dialog-scrollable modal-lg qltc-runtime-modal-dialog">' +
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

  function openQuyModal(url, title) {
    var $modal = ensureModal();

    setModalSize($modal, 'modal-lg');
    $modal.find('.qltc-runtime-modal-title').text(title || 'Thông tin quỹ');
    $modal.find('.qltc-runtime-modal-body').html(renderLoadingHtml('Đang tải form quỹ...'));
    showModal($modal);

    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      beforeSend: function () {
        block('body');
      },
      success: function (response) {
        if (!isSuccessResponse(response)) {
          $modal.find('.qltc-runtime-modal-body').html(renderAlert(response.message || response.content || 'Không tải được form quỹ.', 'danger'));
          notify(response, 5000);
          return;
        }

        if (response.title) {
          $modal.find('.qltc-runtime-modal-title').text(response.title);
        }

        setModalSize($modal, response.size || 'modal-lg');
        $modal.find('.qltc-runtime-modal-body').html(response.html || '');
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
    var url = $form.attr('data-action') || $form.attr('action');
    var formData = $form.serialize();

    clearFormAlert($form);
    setButtonLoading($btn, true);
    setFormDisabled($form, true);

    $.ajax({
      url: url,
      type: 'POST',
      dataType: 'json',
      data: formData,
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
    var url = $form.attr('data-action') || $form.attr('action');
    var formData = $form.serialize();

    clearFormAlert($form);
    setButtonLoading($btn, true);
    setFormDisabled($form, true);

    $.ajax({
      url: url,
      type: 'POST',
      dataType: 'json',
      data: formData,
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
    var url = $btn.attr('data-url');
    var title = $btn.attr('data-title') || 'quỹ này';

    confirmDialog('Xóa quỹ?', 'Bạn có chắc chắn muốn xóa ' + title + '?', function () {
      $.ajax({
        url: url,
        type: 'POST',
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

    var url = $wrapper.attr('data-list-url') || window.location.href;
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json',
      beforeSend: function () {
        block('#qltc-quy-list-wrapper');
      },
      success: function (response) {
        if (isSuccessResponse(response) && response.html) {
          $wrapper.html(response.html);
          Drupal.attachBehaviors($wrapper.get(0));
          return;
        }

        if (response && response.message) {
          notify(response, 4000);
        }
        refreshFinanceRegion(window.location.href, $('.qltc-ajax-region').first());
      },
      error: function () {
        refreshFinanceRegion(window.location.href, $('.qltc-ajax-region').first());
      },
      complete: function () {
        unblock('#qltc-quy-list-wrapper');
      }
    });
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

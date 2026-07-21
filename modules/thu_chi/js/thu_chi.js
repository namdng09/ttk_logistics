(function thuChiWaitForDependencies(factory) {
  'use strict';

  var retryCount = 0;
  var maxRetry = 200;

  function boot() {
    if (window.jQuery && window.Drupal) {
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

  var NS = '.thuChiModule';
  var MODAL_ID = 'thu-chi-runtime-modal';
  var MODAL_SELECTOR = '#' + MODAL_ID;

  Drupal.behaviors = Drupal.behaviors || {};

  Drupal.behaviors.thuChiModule = {
    attach: function (context) {
      initMoneyInputs(context);
      initFlatpickrInputs(context);
      initDetailRows(context);

      if ($(document).data('thuChiModuleInited')) {
        return;
      }

      $(document).data('thuChiModuleInited', true);
      bindEvents();
    }
  };

  $(function () {
    Drupal.behaviors.thuChiModule.attach(document);
  });

  function bindEvents() {
    $(document)
      .off('click' + NS, '.tc-thu-chi-open-modal')
      .on('click' + NS, '.tc-thu-chi-open-modal', function (e) {
        e.preventDefault();
        e.stopPropagation();

        var $btn = $(this);
        var url = $btn.attr('data-url') || $btn.attr('href');
        var title = $btn.attr('data-title') || $.trim($btn.text()) || 'Phiếu thu/chi';

        openThuChiModal(url, title);
        return false;
      });

    $(document)
      .off('submit' + NS, '#tc-thu-chi-form')
      .on('submit' + NS, '#tc-thu-chi-form', function (e) {
        e.preventDefault();
        saveThuChi($(this));
        return false;
      });

    $(document)
      .off('change' + NS, '#tc-thu-chi-form .tc-loai-phieu')
      .on('change' + NS, '#tc-thu-chi-form .tc-loai-phieu', function () {
        updateThuChiConditionalFields($(this).closest('#tc-thu-chi-form'));
      });

    $(document)
      .off('click' + NS, '.tc-thu-chi-delete')
      .on('click' + NS, '.tc-thu-chi-delete', function (e) {
        e.preventDefault();
        e.stopPropagation();
        deleteThuChi($(this));
        return false;
      });

    $(document)
      .off('click' + NS, '.tc-thu-chi-detail')
      .on('click' + NS, '.tc-thu-chi-detail', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openThuChiDetail($(this).attr('data-url') || $(this).attr('href'), $(this).attr('data-title') || 'Chi tiết phiếu thu/chi');
        return false;
      });

    $(document)
      .off('click' + NS, '.tc-thu-chi-approve')
      .on('click' + NS, '.tc-thu-chi-approve', function (e) {
        e.preventDefault();
        e.stopPropagation();
        approveThuChi($(this));
        return false;
      });

    $(document)
      .off('click' + NS, '.tc-thu-chi-request-adjust')
      .on('click' + NS, '.tc-thu-chi-request-adjust', function (e) {
        e.preventDefault();
        e.stopPropagation();
        requestAdjustThuChi($(this));
        return false;
      });

    $(document)
      .off('click' + NS, '.tc-thu-chi-approve-adjust')
      .on('click' + NS, '.tc-thu-chi-approve-adjust', function (e) {
        e.preventDefault();
        e.stopPropagation();
        approveAdjustThuChi($(this));
        return false;
      });

    $(document)
      .off('submit' + NS, '.tc-ajax-filter')
      .on('submit' + NS, '.tc-ajax-filter', function (e) {
        e.preventDefault();
        var $form = $(this);
        var url = $form.attr('action') + '?' + $form.serialize();
        if (window.history && window.history.pushState) {
          window.history.pushState({}, '', url);
        }
        refreshThuChiRegion(url, $form.closest('.tc-ajax-region'));
      });

    $(document)
      .off('click' + NS, '.tc-ajax-region .pager a')
      .on('click' + NS, '.tc-ajax-region .pager a', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        if (window.history && window.history.pushState) {
          window.history.pushState({}, '', url);
        }
        refreshThuChiRegion(url, $(this).closest('.tc-ajax-region'));
      });

    $(document)
      .off('hidden.bs.modal' + NS, MODAL_SELECTOR)
      .on('hidden.bs.modal' + NS, MODAL_SELECTOR, function () {
        $(this).find('.tc-runtime-modal-body').empty();
        setModalLoading(false);
      });

    $(document)
      .off('input' + NS, '.tc-money-input')
      .on('input' + NS, '.tc-money-input', function () {
        formatMoneyInputWhileTyping(this);
      });

    $(document)
      .off('blur' + NS, '.tc-money-input')
      .on('blur' + NS, '.tc-money-input', function () {
        var val = parseMoney($(this).val());
        $(this).val(val ? formatMoney(val) : '0');
      });


    $(document)
      .off('click' + NS, '.tc-add-detail-row')
      .on('click' + NS, '.tc-add-detail-row', function (e) {
        e.preventDefault();
        addDetailRow($(this).closest('#tc-thu-chi-form'));
      });

    $(document)
      .off('click' + NS, '.tc-remove-detail-row')
      .on('click' + NS, '.tc-remove-detail-row', function (e) {
        e.preventDefault();
        var $form = $(this).closest('#tc-thu-chi-form');
        var $tbody = $form.find('.tc-detail-body');
        if ($tbody.find('.tc-detail-row').length <= 1) {
          clearDetailRow($(this).closest('.tc-detail-row'));
        }
        else {
          $(this).closest('.tc-detail-row').remove();
        }
        recalculateAllDetails($form);
      });

    $(document)
      .off('input' + NS + ' change' + NS, '.tc-detail-unit-price, .tc-detail-quantity, .tc-detail-vat')
      .on('input' + NS + ' change' + NS, '.tc-detail-unit-price, .tc-detail-quantity, .tc-detail-vat', function () {
        var $form = $(this).closest('#tc-thu-chi-form');
        recalculateAllDetails($form);
      });
  }

  function ensureModal() {
    var $modal = $(MODAL_SELECTOR);

    if ($modal.length) {
      return $modal;
    }

    var html = '' +
      '<div class="modal fade tc-runtime-modal" id="' + MODAL_ID + '" tabindex="-1" aria-hidden="true" data-thu-chi-owned-modal="1">' +
      '  <div class="modal-dialog modal-dialog-scrollable modal-fullscreen tc-runtime-modal-dialog">' +
      '    <div class="modal-content tc-runtime-modal-content">' +
      '      <div class="modal-header tc-runtime-modal-header">' +
      '        <h5 class="modal-title tc-runtime-modal-title">Phiếu thu/chi</h5>' +
      '        <button type="button" class="btn-close tc-runtime-modal-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
      '      </div>' +
      '      <div class="modal-body tc-runtime-modal-body"></div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    $('body').append(html);
    return $(MODAL_SELECTOR);
  }

  function setModalSize($modal, size) {
    var $dialog = $modal.find('.tc-runtime-modal-dialog');

    $dialog
      .removeClass('modal-sm modal-lg modal-xl modal-fullscreen')
      .addClass(size || 'modal-xl');
  }

  function openThuChiModal(url, title) {
    var $modal = ensureModal();

    setModalSize($modal, 'modal-fullscreen');
    $modal.find('.tc-runtime-modal-title').text(title || 'Phiếu thu/chi');
    $modal.find('.tc-runtime-modal-body').html(renderLoadingHtml('Đang tải form phiếu thu/chi...'));
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
          $modal.find('.tc-runtime-modal-body').html(renderAlert(response.message || response.content || 'Không tải được form phiếu thu/chi.', 'danger'));
          notify(response, 5000);
          return;
        }

        if (response.title) {
          $modal.find('.tc-runtime-modal-title').text(response.title);
        }

        setModalSize($modal, response.size || 'modal-fullscreen');
        $modal.find('.tc-runtime-modal-body').html(response.html || '');
        initMoneyInputs($modal);
        initFlatpickrInputs($modal);

        initSelect2Inputs($modal);
        updateThuChiConditionalFields($modal.find('#tc-thu-chi-form'));
        initDetailRows($modal);
      },
      error: function (xhr) {
        $modal.find('.tc-runtime-modal-body').html(renderAlert(getAjaxErrorMessage(xhr, 'Không tải được form phiếu thu/chi.'), 'danger'));
      },
      complete: function () {
        unblock('body');
      }
    });
  }


  function openThuChiDetail(url, title) {
    var $modal = ensureModal();

    setModalSize($modal, 'modal-xl');
    $modal.find('.tc-runtime-modal-title').text(title || 'Chi tiết phiếu thu/chi');
    $modal.find('.tc-runtime-modal-body').html(renderLoadingHtml('Đang tải chi tiết phiếu...'));
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
          $modal.find('.tc-runtime-modal-body').html(renderAlert(response.message || response.content || 'Không tải được chi tiết phiếu.', 'danger'));
          notify(response, 5000);
          return;
        }

        if (response.title) {
          $modal.find('.tc-runtime-modal-title').text(response.title);
        }
        setModalSize($modal, response.size || 'modal-xl');
        $modal.find('.tc-runtime-modal-body').html(response.html || '');
      },
      error: function (xhr) {
        $modal.find('.tc-runtime-modal-body').html(renderAlert(getAjaxErrorMessage(xhr, 'Không tải được chi tiết phiếu.'), 'danger'));
      },
      complete: function () {
        unblock('body');
      }
    });
  }


  function initSelect2Inputs(context) {
    if (!$.fn.select2) {
      return;
    }

    var $context = $(context || document);
    var $modal = $context.closest(MODAL_SELECTOR);
    if (!$modal.length) {
      $modal = $(MODAL_SELECTOR);
    }

    $context.find('select').each(function () {
      var $select = $(this);
      if ($select.data('select2')) {
        try { $select.select2('destroy'); } catch (ignore) {}
      }

      var options = {
        dropdownParent: $modal.length ? $modal : $(document.body),
        width: '100%',
        allowClear: !$select.prop('required')
      };

      if ($select.hasClass('tc-category-select2') || $select.hasClass('tc-category-tags')) {
        options.placeholder = $select.attr('data-placeholder') || 'Chọn hoặc nhập mới phân loại';
        options.tags = true;
        options.tokenSeparators = [','];
        options.createTag = createSelect2Tag;
        options.ajax = buildSelect2AjaxConfig($select.attr('data-ajax-url'));
      }
      else if ($select.hasClass('tc-noi-dung-select')) {
        options.placeholder = $select.attr('data-placeholder') || 'Chọn hoặc nhập nội dung';
        options.tags = true;
        options.createTag = createSelect2Tag;
        options.ajax = buildSelect2AjaxConfig($select.attr('data-ajax-url'));
      }
      else if ($select.hasClass('tc-select2-basic')) {
        options.placeholder = $select.find('option:first').text() || 'Chọn dữ liệu';
      }
      else if (!$select.hasClass('select2') && !$select.hasClass('tc-force-select2')) {
        // Chỉ khởi tạo Select2 cho các select của module có class rõ ràng,
        // tránh tác động nhầm tới select trong theme hoặc module khác.
        return;
      }

      $select.select2(options);
    });
  }

  function buildSelect2AjaxConfig(url) {
    if (!url) {
      return null;
    }

    return {
      url: url,
      dataType: 'json',
      delay: 250,
      cache: false,
      data: function (params) {
        return {
          term: params.term || '',
          _tc_ajax: 1
        };
      },
      processResults: function (data) {
        if (data && data.results) {
          return data;
        }
        return {
          results: []
        };
      }
    };
  }

  function createSelect2Tag(params) {
    var term = $.trim(params.term || '');
    if (!term) {
      return null;
    }
    return {
      id: term,
      text: term,
      newTag: true
    };
  }


  function updateThuChiConditionalFields($form) {
    if (!$form || !$form.length) {
      return;
    }

    var loai = $form.find('.tc-loai-phieu').val() || 'thu';
    var isChi = loai === 'chi';
    var $chiOnly = $form.find('.tc-chi-only');

    $chiOnly.toggleClass('d-none', !isChi);
    $chiOnly.find('select, input, textarea').prop('disabled', !isChi);
  }


  function initDetailRows(context) {
    $(context || document).find('#tc-thu-chi-form').each(function () {
      recalculateAllDetails($(this));
    });
  }

  function addDetailRow($form) {
    if (!$form || !$form.length) {
      return;
    }

    var $tbody = $form.find('.tc-detail-body');
    var $tpl = $form.find('#tc-detail-row-template');
    if (!$tbody.length || !$tpl.length) {
      return;
    }

    var index = parseInt($tbody.attr('data-next-index') || $tbody.find('.tc-detail-row').length, 10);
    if (isNaN(index)) {
      index = $tbody.find('.tc-detail-row').length;
    }

    var html = ($tpl.html() || '').replace(/__INDEX__/g, index);
    $tbody.attr('data-next-index', index + 1);
    var $row = $(html);
    $tbody.append($row);

    initMoneyInputs($row);
    initSelect2Inputs($row);
    recalculateAllDetails($form);
  }

  function clearDetailRow($row) {
    if (!$row || !$row.length) {
      return;
    }

    var $select = $row.find('.tc-noi-dung-select');
    if ($select.data('select2')) {
      $select.val(null).trigger('change');
    }
    else {
      $select.val('');
    }

    $row.find('.tc-detail-unit-price').val('0');
    $row.find('.tc-detail-quantity').val('1');
    $row.find('.tc-detail-unit').val('');
    $row.find('.tc-detail-total').val('0');
    $row.find('.tc-detail-vat').val('0');
    $row.find('.tc-detail-amount').val('0');
  }

  function recalculateAllDetails($form) {
    if (!$form || !$form.length) {
      return;
    }

    var total = 0;
    $form.find('.tc-detail-row').each(function () {
      total += recalculateDetailRow($(this));
    });

    $form.find('.tc-grand-total').val(formatMoney(total));
  }

  function recalculateDetailRow($row) {
    var unitPrice = parseMoney($row.find('.tc-detail-unit-price').val());
    var quantity = parseNumber($row.find('.tc-detail-quantity').val());
    var vat = parseNumber($row.find('.tc-detail-vat').val());

    if (!quantity || quantity < 0) {
      quantity = 0;
    }
    if (!vat || vat < 0) {
      vat = 0;
    }

    var rowTotal = unitPrice * quantity;
    var amount = rowTotal + (rowTotal * vat / 100);

    $row.find('.tc-detail-total').val(formatMoney(rowTotal));
    $row.find('.tc-detail-amount').val(formatMoney(amount));

    return amount;
  }

  function parseNumber(value) {
    if (typeof value === 'number') return value;
    value = (value || '').toString().trim();
    if (!value) return 0;
    value = value.replace(',', '.').replace(/[^0-9.\-]/g, '');
    var number = Number(value);
    return isNaN(number) ? 0 : number;
  }

  function saveThuChi($form) {
    var $modal = $form.closest(MODAL_SELECTOR);
    var $content = $modal.find('.tc-runtime-modal-content');
    var $btn = $form.find('.tc-btn-save-thu-chi').first();
    var url = $form.attr('data-action') || $form.attr('action');

    recalculateAllDetails($form);

    // Serialize trước khi disable form, nếu không POST sẽ bị rỗng.
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
          hideModal($modal);
          setTimeout(refreshThuChiList, 250);
          return;
        }

        showFormAlert($form, response.message || response.content || 'Không lưu được phiếu thu/chi.', 'danger');
        notify(response, 5000);
      },
      error: function (xhr) {
        var message = getAjaxErrorMessage(xhr, 'Không lưu được phiếu thu/chi.');
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


  function approveThuChi($btn) {
    var url = $btn.attr('data-url');
    var decision = $btn.attr('data-decision') || '';
    var title = $btn.attr('data-title') || 'phiếu này';
    var isApprove = decision === 'duyet';
    var confirmTitle = isApprove ? 'Duyệt phiếu?' : 'Không duyệt phiếu?';
    var confirmText = isApprove
      ? 'Duyệt ' + title + '? Nếu là phiếu chi, số tiền sẽ được trừ khỏi quỹ đã chọn.'
      : 'Chuyển ' + title + ' sang trạng thái Không duyệt? Phiếu không được hạch toán vào quỹ.';

    confirmDialog(confirmTitle, confirmText, function () {
      $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: { decision: decision },
        beforeSend: function () {
          block('#tc-thu-chi-list-wrapper');
        },
        success: function (response) {
          if (isSuccessResponse(response)) {
            notify(response, 4000);
            refreshThuChiList();
            return;
          }
          notify(response, 5000);
        },
        error: function (xhr) {
          notify({ success: false, message: getAjaxErrorMessage(xhr, 'Không cập nhật được trạng thái phiếu.') }, 5000);
        },
        complete: function () {
          unblock('#tc-thu-chi-list-wrapper');
        }
      });
    });
  }

  function requestAdjustThuChi($btn) {
    var url = $btn.attr('data-url');
    var title = $btn.attr('data-title') || 'phiếu này';
    confirmDialog('Yêu cầu điều chỉnh phiếu?', 'Gửi yêu cầu điều chỉnh ' + title + '? Phiếu sẽ chờ người có quyền duyệt điều chỉnh trước khi sửa.', function () {
      $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        beforeSend: function () {
          block('#tc-thu-chi-list-wrapper');
        },
        success: function (response) {
          notify(response, isSuccessResponse(response) ? 4000 : 5000);
          if (isSuccessResponse(response)) {
            refreshThuChiList();
          }
        },
        error: function (xhr) {
          notify({ success: false, message: getAjaxErrorMessage(xhr, 'Không gửi được yêu cầu điều chỉnh phiếu.') }, 5000);
        },
        complete: function () {
          unblock('#tc-thu-chi-list-wrapper');
        }
      });
    });
  }

  function approveAdjustThuChi($btn) {
    var url = $btn.attr('data-url');
    var decision = $btn.attr('data-decision') || '';
    var title = $btn.attr('data-title') || 'phiếu này';
    var isApprove = decision === 'duyet';
    var confirmTitle = isApprove ? 'Duyệt điều chỉnh?' : 'Không duyệt điều chỉnh?';
    var confirmText = isApprove
      ? 'Duyệt yêu cầu điều chỉnh ' + title + '? Phiếu sẽ được phép sửa và tạm thời không hạch toán cho tới khi duyệt lại.'
      : 'Không duyệt yêu cầu điều chỉnh ' + title + '? Phiếu giữ nguyên hiệu lực đã duyệt.';

    confirmDialog(confirmTitle, confirmText, function () {
      $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        data: { decision: decision },
        beforeSend: function () {
          block('#tc-thu-chi-list-wrapper');
        },
        success: function (response) {
          notify(response, isSuccessResponse(response) ? 4000 : 5000);
          if (isSuccessResponse(response)) {
            refreshThuChiList();
          }
        },
        error: function (xhr) {
          notify({ success: false, message: getAjaxErrorMessage(xhr, 'Không duyệt được yêu cầu điều chỉnh phiếu.') }, 5000);
        },
        complete: function () {
          unblock('#tc-thu-chi-list-wrapper');
        }
      });
    });
  }

  function deleteThuChi($btn) {
    var url = $btn.attr('data-url');
    var title = $btn.attr('data-title') || 'phiếu này';

    confirmDialog('Xóa phiếu?', 'Bạn có chắc chắn muốn xóa ' + title + '?', function () {
      $.ajax({
        url: url,
        type: 'POST',
        dataType: 'json',
        beforeSend: function () {
          block('#tc-thu-chi-list-wrapper');
        },
        success: function (response) {
          if (isSuccessResponse(response)) {
            notify(response, 4000);
            refreshThuChiList();
            return;
          }
          notify(response, 5000);
        },
        error: function (xhr) {
          notify({ success: false, message: getAjaxErrorMessage(xhr, 'Không xóa được phiếu.') }, 5000);
        },
        complete: function () {
          unblock('#tc-thu-chi-list-wrapper');
        }
      });
    });
  }

  function refreshThuChiList() {
    var $region = $('.tc-ajax-region[data-refresh-type="thu-chi"]').first();
    refreshThuChiRegion(window.location.href, $region.length ? $region : $('.tc-ajax-region').first());
  }

  function refreshThuChiRegion(url, $region) {
    $region = $region && $region.length ? $region : $('.tc-ajax-region').first();

    if (!$region.length || !url) {
      window.location.reload();
      return;
    }

    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'html',
      beforeSend: function () {
        $region.addClass('tc-region-loading');
        block($region[0]);
      },
      success: function (html) {
        var $parsed = $('<div>').append($.parseHTML(html, document, true));
        var $newRegion = $parsed.find('.tc-ajax-region').first();

        if ($newRegion.length) {
          $region.replaceWith($newRegion);
          Drupal.attachBehaviors($newRegion[0]);
          initMoneyInputs($newRegion);
          initFlatpickrInputs($newRegion);
        }
        else {
          window.location.reload();
        }
      },
      error: function () {
        window.location.reload();
      },
      complete: function () {
        unblock($region[0]);
        $('.tc-ajax-region').removeClass('tc-region-loading');
      }
    });
  }

  function showModal($modal) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      bootstrap.Modal.getOrCreateInstance($modal[0]).show();
      return;
    }
    if ($.fn.modal) {
      $modal.modal('show');
    }
  }

  function hideModal($modal) {
    if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
      var instance = bootstrap.Modal.getInstance($modal[0]) || bootstrap.Modal.getOrCreateInstance($modal[0]);
      instance.hide();
      return;
    }
    if ($.fn.modal) {
      $modal.modal('hide');
    }
  }

  function initMoneyInputs(context) {
    $(context || document).find('.tc-money-input').each(function () {
      var val = parseMoney($(this).val());
      $(this).val(val ? formatMoney(val) : '0');
    });
  }

  function initFlatpickrInputs(context) {
    if (typeof flatpickr === 'undefined') {
      return;
    }

    $(context || document).find('.tc-flatpickr-date').each(function () {
      var input = this;

      if (input._flatpickr) {
        try { input._flatpickr.destroy(); } catch (ignore) {}
      }

      flatpickr(input, {
        dateFormat: 'd/m/Y',
        allowInput: true,
        disableMobile: true,
        monthSelectorType: 'dropdown',
        appendTo: document.body,
        positionElement: input,
        onReady: function (selectedDates, dateStr, instance) {
          instance.calendarContainer.style.zIndex = 99999;
        },
        onOpen: function (selectedDates, dateStr, instance) {
          instance.calendarContainer.style.zIndex = 99999;
        }
      });
    });
  }

  function parseMoney(value) {
    if (typeof value === 'number') return value;
    value = (value || '').toString().trim();
    if (!value) return 0;
    var negative = value.indexOf('-') === 0;
    var digits = value.replace(/[^0-9]/g, '');
    if (!digits) return 0;
    var number = Number(digits);
    return negative ? -number : number;
  }

  function formatMoney(number) {
    number = Math.round(Number(number) || 0);
    var negative = number < 0;
    number = Math.abs(number);
    var formatted = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return negative ? '-' + formatted : formatted;
  }

  function formatMoneyInputWhileTyping(input) {
    var $input = $(input);
    var raw = ($input.val() || '').toString();
    var cursor = input.selectionStart || raw.length;
    var digitsBeforeCursor = raw.substring(0, cursor).replace(/[^0-9]/g, '').length;
    var negative = raw.indexOf('-') === 0;
    var digits = raw.replace(/[^0-9]/g, '');

    if (!digits) {
      $input.val(negative ? '-' : '');
      return;
    }

    var formatted = formatMoney((negative ? -1 : 1) * Number(digits));
    $input.val(formatted);

    var newCursor = formatted.length;
    var seenDigits = 0;
    for (var i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted.charAt(i))) {
        seenDigits++;
      }
      if (seenDigits >= digitsBeforeCursor) {
        newCursor = i + 1;
        break;
      }
    }

    try {
      input.setSelectionRange(newCursor, newCursor);
    }
    catch (ignore) {}
  }

  function setButtonLoading($btn, isLoading) {
    if (!$btn || !$btn.length) return;

    $btn.prop('disabled', !!isLoading).toggleClass('is-loading', !!isLoading);
    $btn.find('.tc-btn-spinner').toggleClass('d-none', !isLoading);

    if (isLoading) {
      if (!$btn.data('origin-text')) {
        $btn.data('origin-text', $btn.find('.tc-btn-text').html());
      }
      $btn.find('.tc-btn-text').text('Đang lưu...');
    }
    else if ($btn.data('origin-text')) {
      $btn.find('.tc-btn-text').html($btn.data('origin-text'));
    }
  }

  function setFormDisabled($form, disabled) {
    $form.find('input, select, textarea, button').not('.btn-close').not('[data-tc-locked="1"]').prop('disabled', !!disabled);
    $form.toggleClass('tc-form-disabled', !!disabled);
  }

  function showFormAlert($form, message, type) {
    var $alert = $form.find('.tc-form-alert').first();
    if (!$alert.length) {
      $alert = $('<div class="tc-form-alert mt-3"></div>');
      $form.prepend($alert);
    }

    $alert
      .removeClass('d-none alert-success alert-danger alert-warning alert-info')
      .addClass('alert alert-' + (type || 'danger'))
      .html(escapeHtml(message || 'Có lỗi xảy ra.'));
  }

  function clearFormAlert($form) {
    $form.find('.tc-form-alert').addClass('d-none').removeClass('alert alert-success alert-danger alert-warning alert-info').empty();
  }

  function isSuccessResponse(response) {
    if (!response) return false;
    var success = response.success;
    var status = response.status;

    if (success === true || success === 1 || success === '1') return true;
    if (typeof success === 'string' && success.toLowerCase() === 'true') return true;
    if (typeof status === 'string' && status.toLowerCase() === 'success') return true;

    return false;
  }

  function notify(response, duration) {
    var ok = isSuccessResponse(response);
    var message = response && (response.message || response.content || response.error) || (ok ? 'Thành công.' : 'Có lỗi xảy ra.');

    if (typeof notyf !== 'undefined' && notyf.open) {
      notyf.open({
        type: ok ? 'success' : 'error',
        message: message,
        duration: duration || 4000,
        dismissible: false,
        ripple: true,
        position: { x: 'right', y: 'top' }
      });
      return;
    }

    if (typeof Swal !== 'undefined' && Swal.fire) {
      Swal.fire({
        icon: ok ? 'success' : 'error',
        title: ok ? 'Thành công' : 'Lỗi',
        text: message,
        timer: ok ? 1800 : undefined,
        showConfirmButton: !ok
      });
      return;
    }

    if (!ok) {
      alert(message);
    }
  }

  function confirmDialog(title, text, onConfirm) {
    if (typeof Swal !== 'undefined' && Swal.fire) {
      Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
      }).then(function (result) {
        if (result.isConfirmed && typeof onConfirm === 'function') {
          onConfirm();
        }
      });
      return;
    }

    if (confirm(text)) {
      onConfirm();
    }
  }

  function block(target) {
    var $target = $(target || 'body');
    if (!$target.length) return;

    if (typeof Block !== 'undefined' && Block.circle) {
      Block.circle($target[0], {
        backgroundColor: 'rgba(' + (window.Helpers && window.Helpers.getCssVar ? window.Helpers.getCssVar('black-rgb') : '0,0,0') + ', 0.5)',
        svgSize: '40px',
        svgColor: (typeof config !== 'undefined' && config.colors && config.colors.white) ? config.colors.white : '#fff'
      });
      return;
    }

    $target.addClass('tc-block-fallback');
  }

  function unblock(target) {
    var $target = $(target || 'body');
    if (!$target.length) return;

    if (typeof Block !== 'undefined' && Block.remove) {
      try { Block.remove($target[0]); } catch (ignore) {}
    }

    $target.removeClass('tc-block-fallback');
  }

  function setModalLoading(isLoading) {
    $(MODAL_SELECTOR).find('.tc-runtime-modal-body').toggleClass('tc-loading-state', !!isLoading);
  }

  function renderLoadingHtml(text) {
    return '<div class="tc-modal-loading text-center py-4"><div class="spinner-border spinner-border-sm me-2" role="status"></div>' + escapeHtml(text || 'Đang tải...') + '</div>';
  }

  function renderAlert(message, type) {
    return '<div class="alert alert-' + (type || 'warning') + ' mb-0">' + escapeHtml(message || 'Có lỗi xảy ra.') + '</div>';
  }

  function getAjaxErrorMessage(xhr, fallback) {
    if (xhr && xhr.responseJSON && (xhr.responseJSON.message || xhr.responseJSON.error)) {
      return xhr.responseJSON.message || xhr.responseJSON.error;
    }

    if (xhr && xhr.responseText) {
      var text = $('<div>').html(xhr.responseText).text().replace(/\s+/g, ' ').trim();
      if (text) {
        return text.substring(0, 300);
      }
    }

    return fallback || 'Có lỗi xảy ra khi gửi yêu cầu.';
  }

  function escapeHtml(text) {
    return $('<div>').text(text == null ? '' : String(text)).html();
  }

});

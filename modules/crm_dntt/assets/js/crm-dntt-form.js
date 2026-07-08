(function ($) {
  'use strict';

  var CFG, notyf, rowCounter = 0;

  var STATUS_LABELS = {
    moi:         {text: 'Mới',        cls: 'bg-label-secondary'},
    cho_duyet:   {text: 'Chờ duyệt',  cls: 'bg-label-warning'},
    da_duyet:    {text: 'Đã duyệt',   cls: 'bg-label-info'},
    tu_choi:     {text: 'Từ chối',     cls: 'bg-label-danger'},
    da_tt:       {text: 'Đã TT',       cls: 'bg-label-success'},
    tu_choi_tt:  {text: 'Từ chối TT',  cls: 'bg-label-danger'}
  };

  var LOAI_LABELS = {
    thanh_toan: 'Thanh toán',
    hoan_ve:    'Hoàn về'
  };

  // =========================================================================
  // Init
  // =========================================================================

  $(function () {
    CFG = Drupal.settings.crm_dntt || {};
    notyf = new Notyf({position: {x: 'right', y: 'top'}, duration: 3000});

    initFlatpickr();
    initEvents();
    initCurrencyToggle();

    setTimeout(function () {
      initHeaderSelects();
      loadDonViOptions(function () {
        if (CFG.dntt_id) {
          loadDntt(CFG.dntt_id);
        } else {
          addRow();
          prefillLoHang();
        }

        if (!CFG.is_editable) {
          lockForm();
        }

        renderActionButtons();
      });
    }, 100);
  });

  // =========================================================================
  // Select2 AJAX helper
  // =========================================================================

  function doiTacSelect2Opts() {
    return {
      ajax: {
        url: '/api/doi-tac/search',
        dataType: 'json',
        delay: 300,
        data: function (p) { return {term: p.term, page: p.page || 1}; },
        processResults: function (d) { return {results: d.results, pagination: d.pagination}; }
      },
      placeholder: 'Nhập MST hoặc tên...',
      allowClear: true,
      width: '100%',
      minimumInputLength: 1,
      dropdownParent: $('body')
    };
  }

  // =========================================================================
  // Load DNTT (edit mode)
  // =========================================================================

  function loadDntt(id) {
    $.ajax({
      url: '/api/dntt/get/' + id,
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (!res.success) { notyf.error(res.message); return; }
        var d = res.data;

        $('#dntt-so-dntt').val(d.so_dntt);
        if (d.created) {
          var dt = new Date(d.created * 1000);
          $('#dntt-ngay-tao').val(dt.toLocaleDateString('vi-VN'));
        }

        setSelect2Val('#dntt-ben-phat-hanh', d.ben_phat_hanh_id, d.ben_phat_hanh_ten);
        setSelect2Val('#dntt-doi-tac-nhan-tien', d.doi_tac_nhan_tien_id, d.doi_tac_nhan_tien_ten);

        var isSame = String(d.ben_phat_hanh_id) === String(d.doi_tac_nhan_tien_id);
        $('#dntt-same-doi-tac').prop('checked', isSame);
        if (!isSame) {
          $('#row-doi-tac-nhan-tien').removeClass('d-none');
        }

        $('#dntt-so-hoa-don').val(d.so_hoa_don || '');
        $('#dntt-no-hoa-don').prop('checked', d.no_hoa_don == 1);
        if (d.ngay_hoa_don) setFlatpickrVal('#dntt-ngay-hoa-don', d.ngay_hoa_don);
        if (d.han_thanh_toan) setFlatpickrVal('#dntt-han-thanh-toan', d.han_thanh_toan);

        $('#dntt-hinh-thuc-tt').val(d.hinh_thuc_tt);
        $('#dntt-loai-tien').val(d.loai_tien).trigger('change');
        $('#dntt-ti-gia').val(d.ti_gia);

        var sl = STATUS_LABELS[d.trang_thai] || {text: d.trang_thai, cls: 'bg-label-secondary'};
        $('#badge-trang-thai').attr('class', 'badge ' + sl.cls).text(sl.text);
        $('#badge-loai-dntt').text(LOAI_LABELS[d.loai_dntt] || d.loai_dntt);

        CFG.trang_thai = d.trang_thai;
        CFG.loai_dntt = d.loai_dntt;
        renderActionButtons();
        renderHoanVeLinks(d);

        loadChiTiet(id);
      }
    });
  }

  function loadChiTiet(dnttId) {
    $.ajax({
      url: '/api/dntt-chi-tiet/list',
      data: {dntt_id: dnttId},
      type: 'GET',
      dataType: 'json',
      success: function (res) {
        if (!res.success) return;
        $('#chi-tiet-body').empty();
        $.each(res.data, function (i, ct) {
          var $row = addRow();
          $row.attr('data-chi-tiet-id', ct.chi_tiet_id);

          if (ct.lo_hang_nid && ct.lo_hang_ten) {
            setSelect2Val($row.find('.ct-lo-hang'), ct.lo_hang_nid, ct.lo_hang_ten);
          }
          if (ct.loai_chi_phi_id) {
            var loaiLabel = ct.loai_chi_phi_ma || ct.loai_chi_phi_ten;
            setSelect2Val($row.find('.ct-loai-chi-phi'), ct.loai_chi_phi_id, loaiLabel);
          }

          $row.find('.ct-nhom-chi-phi').text(ct.nhom_chi_phi_ten || '');
          if (ct.don_vi) setSelect2Val($row.find('.ct-don-vi'), ct.don_vi, ct.don_vi);
          $row.find('.ct-don-gia').val(formatNum(ct.don_gia));
          $row.find('.ct-so-luong').val(formatNum(ct.so_luong));
          $row.find('.ct-vat-pct').val(Math.round(parseFloat(ct.vat_phan_tram) || 0));
          $row.find('.ct-vat-amount').val(formatNum(ct.so_tien_vat));
          $row.find('.ct-truoc-vat').text(formatNum(ct.tien_truoc_vat));
          $row.find('.ct-sau-vat').text(formatNum(ct.tien_sau_vat));
          $row.find('.ct-ghi-chu').val(ct.ghi_chu || '');
        });
        recalcTotal();
        if (!CFG.is_editable) lockForm();
      }
    });
  }

  // =========================================================================
  // Init UI components
  // =========================================================================

  function initFlatpickr() {
    flatpickr('#dntt-ngay-hoa-don', {dateFormat: 'd/m/Y'});
    flatpickr('#dntt-han-thanh-toan', {dateFormat: 'd/m/Y'});
  }

  function initHeaderSelects() {
    $('#dntt-ben-phat-hanh').select2(doiTacSelect2Opts());
    $('#dntt-doi-tac-nhan-tien').select2(doiTacSelect2Opts());
  }

  function initCurrencyToggle() {
    $('#dntt-loai-tien').on('change', function () {
      var isUSD = $(this).val() === 'USD';
      $('#dntt-ti-gia-wrap').toggle(isUSD);
      if (!isUSD) $('#dntt-ti-gia').val(1);
    });
  }

  function initEvents() {
    $('#dntt-same-doi-tac').on('change', function () {
      if ($(this).is(':checked')) {
        $('#row-doi-tac-nhan-tien').addClass('d-none');
        syncDoiTac();
      } else {
        $('#row-doi-tac-nhan-tien').removeClass('d-none');
      }
    });
    $('#dntt-ben-phat-hanh').on('select2:select', function () {
      if ($('#dntt-same-doi-tac').is(':checked')) syncDoiTac();
    });

    $('#btn-add-row').on('click', function () { addRow(); });

    $('#table-chi-tiet').on('click', '.btn-delete-row', function () {
      var $row = $(this).closest('tr');
      var chiTietId = $row.attr('data-chi-tiet-id');
      if (chiTietId) {
        Swal.fire({
          title: 'Xóa dòng chi tiết?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xóa',
          cancelButtonText: 'Hủy'
        }).then(function (result) {
          if (result.isConfirmed) deleteChiTiet(chiTietId, $row);
        });
      } else {
        $row.remove();
        renumberRows();
        recalcTotal();
      }
    });

    $('#table-chi-tiet').on('focus', '.num-fmt', function () {
      var raw = parseNum($(this).val());
      $(this).val(raw || '');
    });
    $('#table-chi-tiet').on('blur', '.num-fmt', function () {
      var raw = parseNum($(this).val());
      $(this).val(raw ? formatNum(raw) : '0');
    });
    $('#table-chi-tiet').on('input', '.ct-don-gia, .ct-so-luong, .ct-vat-pct', function () {
      calcRow($(this).closest('tr'), false);
    });
    $('#table-chi-tiet').on('input', '.ct-vat-amount', function () {
      calcRow($(this).closest('tr'), true);
    });

    $(document).on('click', '#btn-save-dntt', saveDntt);
    $(document).on('click', '#btn-delete-dntt', deleteDntt);
    $(document).on('click', '#btn-trinh-duyet', function () { transitionDntt('cho_duyet'); });

    $(document).on('click', '#btn-create-hoan-ve', function () {
      Swal.fire({
        title: 'Tạo DNTT hoàn về?',
        text: 'Hệ thống sẽ tạo DNTT hoàn về từ DNTT này và copy toàn bộ chi tiết.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Tạo hoàn về',
        cancelButtonText: 'Hủy'
      }).then(function (r) {
        if (!r.isConfirmed) return;
        $.ajax({
          url: '/api/dntt/create-hoan-ve',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({dntt_goc_id: CFG.dntt_id}),
          dataType: 'json',
          success: function (res) {
            if (res.success) {
              notyf.success('Đã tạo ' + res.so_dntt);
              window.location.href = '/quan-ly/dntt/' + res.dntt_id;
            } else {
              Swal.fire('Lỗi', res.message, 'error');
            }
          },
          error: function () { Swal.fire('Lỗi', 'Không thể kết nối server.', 'error'); }
        });
      });
    });
  }

  function syncDoiTac() {
    var data = $('#dntt-ben-phat-hanh').select2('data');
    if (data && data.length) {
      setSelect2Val('#dntt-doi-tac-nhan-tien', data[0].id, data[0].text);
    }
  }

  // =========================================================================
  // Detail rows
  // =========================================================================

  function addRow() {
    rowCounter++;
    var rid = 'r' + rowCounter;
    var html = '<tr class="chi-tiet-row" data-chi-tiet-id="" data-row-id="' + rid + '">' +
      '<td class="text-center row-stt">' + rowCounter + '</td>' +
      '<td><select class="ct-lo-hang w-100" id="lo-hang-' + rid + '"></select></td>' +
      '<td><select class="ct-loai-chi-phi w-100" id="loai-phi-' + rid + '"></select></td>' +
      '<td class="ct-nhom-chi-phi text-muted small"></td>' +
      '<td><input type="text" class="form-control form-control-sm text-end ct-don-gia num-fmt" name="don_gia" value="0"></td>' +
      '<td><input type="text" class="form-control form-control-sm text-end ct-so-luong num-fmt" name="so_luong" value="1"></td>' +
      '<td><select class="ct-don-vi w-100" id="don-vi-' + rid + '"></select></td>' +
      '<td><input type="number" class="form-control form-control-sm text-end ct-vat-pct" name="vat_phan_tram" value="0" step="1"></td>' +
      '<td><input type="text" class="form-control form-control-sm text-end ct-vat-amount num-fmt" name="so_tien_vat" value="0"></td>' +
      '<td class="text-end ct-truoc-vat">0</td>' +
      '<td class="text-end ct-sau-vat fw-semibold">0</td>' +
      '<td><input type="text" class="form-control form-control-sm ct-ghi-chu" name="ghi_chu" placeholder="..."></td>' +
      '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-danger btn-delete-row" title="Xóa"><i class="ti tabler-trash"></i></button></td>' +
      '</tr>';

    var $row = $(html).appendTo('#chi-tiet-body');

    setTimeout(function () { initRowSelect2($row); }, 100);

    return $row;
  }

  var donViOptions = [];

  function loadDonViOptions(callback) {
    $.ajax({
      url: '/api/danh-muc-list',
      data: {phan_loai: 'đơn vị tính', hoat_dong: 1, limit: 100},
      dataType: 'json',
      success: function (res) {
        if (res.success && res.data) {
          donViOptions = $.map(res.data, function (item) {
            return {id: item.title, text: item.title};
          });
        }
      },
      complete: function () { callback(); }
    });
  }

  function initRowSelect2($row) {
    var $loHang = $row.find('.ct-lo-hang');
    var $loaiPhi = $row.find('.ct-loai-chi-phi');
    var $donVi = $row.find('.ct-don-vi');

    $donVi.select2({
      data: donViOptions,
      tags: true,
      placeholder: 'Đơn vị...',
      allowClear: true,
      width: '100%',
      dropdownParent: $('body')
    }).val(null).trigger('change');

    $loHang.select2({
      ajax: {
        url: '/api/dntt/search-jobfile',
        dataType: 'json',
        delay: 300,
        data: function (p) { return {term: p.term}; },
        processResults: function (d) {
          return {results: d.results || []};
        }
      },
      placeholder: 'Jobfile...',
      allowClear: true,
      width: '100%',
      minimumInputLength: 1,
      dropdownParent: $('body')
    });

    $loaiPhi.select2({
      ajax: {
        url: '/api/loai-chi-phi/search',
        dataType: 'json',
        delay: 300,
        data: function (p) { return {term: p.term}; },
        processResults: function (d) {
          return {
            results: $.map(d.results || [], function (item) {
              return {
                id: item.id,
                text: item.text,
                nhom_ten: item.nhom_ten || '',
                don_vi: item.don_vi || '',
                gia_mac_dinh: item.gia_mac_dinh || 0
              };
            })
          };
        }
      },
      placeholder: 'Loại phí...',
      allowClear: true,
      width: '100%',
      minimumInputLength: 0,
      dropdownParent: $('body')
    });

    $loaiPhi.on('select2:select', function (e) {
      var $tr = $(this).closest('tr');
      $tr.find('.ct-nhom-chi-phi').text(e.params.data.nhom_ten || '');
      if (e.params.data.don_vi) {
        setSelect2Val($tr.find('.ct-don-vi'), e.params.data.don_vi, e.params.data.don_vi);
      }
      if (e.params.data.gia_mac_dinh) {
        $tr.find('.ct-don-gia').val(formatNum(e.params.data.gia_mac_dinh));
        calcRow($tr, false);
      }
    });
    $loaiPhi.on('select2:clear', function () {
      $(this).closest('tr').find('.ct-nhom-chi-phi').text('');
    });
  }

  function calcRow($row, vatOverride) {
    var donGia = parseNum($row.find('.ct-don-gia').val());
    var soLuong = parseNum($row.find('.ct-so-luong').val());
    var vatPct = parseInt($row.find('.ct-vat-pct').val(), 10) || 0;

    var truocVat = donGia * soLuong;
    var tienVat;
    if (vatOverride) {
      tienVat = parseNum($row.find('.ct-vat-amount').val());
    } else {
      tienVat = Math.round(truocVat * vatPct / 100);
      $row.find('.ct-vat-amount').val(formatNum(tienVat));
    }
    var sauVat = truocVat + tienVat;

    $row.find('.ct-truoc-vat').text(formatNum(truocVat));
    $row.find('.ct-sau-vat').text(formatNum(sauVat));
    recalcTotal();
  }

  function recalcTotal() {
    var total = 0;
    $('#chi-tiet-body .chi-tiet-row').each(function () {
      total += parseNum($(this).find('.ct-sau-vat').text());
    });
    $('#dntt-tong-tien').text(formatNum(total));
  }

  function renumberRows() {
    $('#chi-tiet-body .chi-tiet-row').each(function (i) {
      $(this).find('.row-stt').text(i + 1);
    });
    rowCounter = $('#chi-tiet-body .chi-tiet-row').length;
  }

  // =========================================================================
  // Save
  // =========================================================================

  function saveDntt() {
    var bph = $('#dntt-ben-phat-hanh').val();
    var dtntt = $('#dntt-doi-tac-nhan-tien').val();
    if (!bph) { notyf.error('Chọn Bên phát hành.'); return; }
    if (!dtntt) { notyf.error('Chọn Đối tác nhận tiền.'); return; }

    var payload = {
      ben_phat_hanh_id: bph,
      doi_tac_nhan_tien_id: dtntt,
      so_hoa_don: $('#dntt-so-hoa-don').val(),
      ngay_hoa_don: fpToTimestamp('#dntt-ngay-hoa-don'),
      no_hoa_don: $('#dntt-no-hoa-don').is(':checked') ? 1 : 0,
      hinh_thuc_tt: $('#dntt-hinh-thuc-tt').val(),
      han_thanh_toan: fpToTimestamp('#dntt-han-thanh-toan'),
      loai_tien: $('#dntt-loai-tien').val(),
      ti_gia: parseFloat($('#dntt-ti-gia').val()) || 1
    };

    var dnttId = $('#dntt-id').val();
    if (dnttId) payload.dntt_id = parseInt(dnttId);

    $.ajax({
      url: '/api/dntt/save',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(payload),
      dataType: 'json',
      success: function (res) {
        if (!res.success) { notyf.error(res.message); return; }

        if (!dnttId) {
          $('#dntt-id').val(res.dntt_id);
          CFG.dntt_id = res.dntt_id;
          window.history.replaceState(null, '', '/quan-ly/dntt/' + res.dntt_id);
        }

        saveAllChiTiet(res.dntt_id, function () {
          notyf.success('Đã lưu DNTT ' + res.so_dntt);
          if (!dnttId) loadDntt(res.dntt_id);
        });
      }
    });
  }

  function saveAllChiTiet(dnttId, callback) {
    var $rows = $('#chi-tiet-body .chi-tiet-row');
    if (!$rows.length) { callback(); return; }

    var pending = $rows.length;
    var errors = [];

    $rows.each(function (i) {
      var $row = $(this);
      var loaiId = $row.find('.ct-loai-chi-phi').val();
      if (!loaiId) { pending--; if (!pending) callback(); return; }

      var loHangVal = $row.find('.ct-lo-hang').val();
      var vatAmountRaw = $row.find('.ct-vat-amount').val();

      var data = {
        dntt_id: dnttId,
        loai_chi_phi_id: loaiId,
        lo_hang_nid: loHangVal || null,
        don_vi: $row.find('.ct-don-vi').val() || '',
        don_gia: parseNum($row.find('.ct-don-gia').val()),
        so_luong: parseNum($row.find('.ct-so-luong').val()) || 1,
        vat_phan_tram: parseInt($row.find('.ct-vat-pct').val(), 10) || 0,
        ghi_chu: $row.find('.ct-ghi-chu').val(),
        thu_tu: i + 1
      };

      if (vatAmountRaw !== '' && vatAmountRaw !== null) {
        data.so_tien_vat = parseNum(vatAmountRaw);
      }

      var chiTietId = $row.attr('data-chi-tiet-id');
      if (chiTietId) data.chi_tiet_id = parseInt(chiTietId);

      $.ajax({
        url: '/api/dntt-chi-tiet/save',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            $row.attr('data-chi-tiet-id', res.chi_tiet_id);
            $row.find('.ct-truoc-vat').text(formatNum(res.tien_truoc_vat));
            $row.find('.ct-sau-vat').text(formatNum(res.tien_sau_vat));
            $row.find('.ct-vat-amount').val(formatNum(res.so_tien_vat));
            if (res.dntt_tong_tien !== undefined) {
              $('#dntt-tong-tien').text(formatNum(res.dntt_tong_tien));
            }
          } else {
            errors.push(res.message);
          }
        },
        complete: function () {
          pending--;
          if (!pending) {
            if (errors.length) notyf.error(errors.join('; '));
            callback();
          }
        }
      });
    });
  }

  function deleteChiTiet(chiTietId, $row) {
    $.ajax({
      url: '/api/dntt-chi-tiet/delete',
      type: 'POST',
      contentType: 'application/json',
      data: JSON.stringify({chi_tiet_id: parseInt(chiTietId)}),
      dataType: 'json',
      success: function (res) {
        if (res.success) {
            $row.remove();
          renumberRows();
          if (res.dntt_tong_tien !== undefined) {
            $('#dntt-tong-tien').text(formatNum(res.dntt_tong_tien));
          }
          notyf.success('Đã xóa dòng chi tiết.');
        } else {
          notyf.error(res.message);
        }
      }
    });
  }

  function deleteDntt() {
    var dnttId = $('#dntt-id').val();
    if (!dnttId) return;
    Swal.fire({
      title: 'Xóa DNTT này?',
      text: 'Tất cả chi tiết sẽ bị xóa theo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(function (result) {
      if (!result.isConfirmed) return;
      $.ajax({
        url: '/api/dntt/delete',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({dntt_id: parseInt(dnttId)}),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            notyf.success('Đã xóa DNTT.');
            window.location.href = '/quan-ly/dntt';
          } else {
            notyf.error(res.message);
          }
        }
      });
    });
  }

  function transitionDntt(newStatus) {
    var dnttId = $('#dntt-id').val();
    if (!dnttId) { notyf.error('Lưu DNTT trước khi trình duyệt.'); return; }

    saveDntt();

    setTimeout(function () {
      $.ajax({
        url: '/api/dntt/transition',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({dntt_id: parseInt(dnttId), new_status: newStatus}),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            notyf.success('Đã chuyển trạng thái.');
            window.location.reload();
          } else {
            notyf.error(res.message);
          }
        }
      });
    }, 500);
  }

  // =========================================================================
  // Action bar
  // =========================================================================

  function renderActionButtons() {
    var $wrap = $('#action-buttons').empty();
    var status = CFG.trang_thai || 'moi';
    var isNew = !CFG.dntt_id;

    if (isNew || status === 'moi' || status === 'tu_choi' || status === 'tu_choi_tt') {
      $wrap.append('<button class="btn btn-primary" id="btn-save-dntt"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>');
      if (!isNew) {
        $wrap.append('<button class="btn btn-outline-danger" id="btn-delete-dntt"><i class="ti tabler-trash me-1"></i>Xóa</button>');
        $wrap.append('<button class="btn btn-warning" id="btn-trinh-duyet"><i class="ti tabler-send me-1"></i>Trình duyệt</button>');
      }
    } else if (status === 'da_tt') {
      var sl = STATUS_LABELS[status];
      $wrap.append('<span class="badge ' + sl.cls + ' fs-6">' + sl.text + '</span>');
      if (CFG.loai_dntt !== 'hoan_ve') {
        $wrap.append('<button class="btn btn-primary" id="btn-create-hoan-ve"><i class="ti tabler-receipt-refund me-1"></i>Tạo DNTT hoàn về</button>');
      }
    } else {
      var sl2 = STATUS_LABELS[status] || {text: status, cls: 'bg-label-secondary'};
      $wrap.append('<span class="badge ' + sl2.cls + ' fs-6">' + sl2.text + '</span>');
    }
  }

  function renderHoanVeLinks(d) {
    var $el = $('#dntt-hoan-ve-links').empty();
    if (d.loai_dntt === 'hoan_ve' && d.dntt_goc_id && d.dntt_goc_so_dntt) {
      $el.append('<a href="/quan-ly/dntt/' + d.dntt_goc_id + '" class="badge bg-label-warning">Gốc: ' + d.dntt_goc_so_dntt + '</a>');
    }
    if (d.dntt_hoan_ve && d.dntt_hoan_ve.length) {
      $.each(d.dntt_hoan_ve, function (i, hv) {
        $el.append(' <a href="/quan-ly/dntt/' + hv.dntt_id + '" class="badge bg-label-info">Hoàn: ' + hv.so_dntt + '</a>');
      });
    }
  }

  // =========================================================================
  // Lock
  // =========================================================================

  function lockForm() {
    $('.crm-dntt-form').addClass('locked');
    $('#dntt-ben-phat-hanh, #dntt-doi-tac-nhan-tien').prop('disabled', true);
    $('#chi-tiet-body .ct-lo-hang, #chi-tiet-body .ct-loai-chi-phi, #chi-tiet-body .ct-don-vi').prop('disabled', true);
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  function formatNum(n) {
    if (n === null || n === undefined || n === '') return '0';
    return Math.round(parseFloat(n) || 0).toLocaleString('vi-VN');
  }

  function parseNum(str) {
    if (typeof str === 'number') return Math.round(str);
    if (!str) return 0;
    return parseInt(String(str).replace(/\./g, ''), 10) || 0;
  }

  function setSelect2Val(sel, id, text) {
    if (!id) return;
    var $el = $(sel);
    var opt = new Option(text || String(id), id, true, true);
    $el.append(opt).trigger('change');
  }

  function setFlatpickrVal(sel, timestamp) {
    var fp = document.querySelector(sel)._flatpickr;
    if (fp && timestamp) fp.setDate(new Date(timestamp * 1000));
  }

  function fpToTimestamp(sel) {
    var fp = document.querySelector(sel)._flatpickr;
    if (fp && fp.selectedDates.length) {
      return Math.floor(fp.selectedDates[0].getTime() / 1000);
    }
    return null;
  }

  function prefillLoHang() {
    var params = new URLSearchParams(window.location.search);
    var loHang = params.get('lo_hang');
    if (!loHang) return;
    var $row = $('#chi-tiet-body .chi-tiet-row').first();
    if (!$row.length) return;
    $.ajax({
      url: '/api/dntt/search-jobfile',
      data: {term: '', nid: loHang},
      dataType: 'json',
      success: function (res) {
        if (res.results && res.results.length) {
          setSelect2Val($row.find('.ct-lo-hang'), res.results[0].id, res.results[0].text);
        }
      }
    });
  }

})(jQuery);

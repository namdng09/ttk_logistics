(function ($) {
  'use strict';

  var CFG, notyf, rowCounter = 0;
  var currentDntt = null;
  var SIDEBAR_COLLAPSE_KEY = 'crmDnttSidebarCollapsed';

  var STATUS_LABELS = {
    moi:             {text: 'Mới',             cls: 'bg-label-secondary'},
    cho_duyet:       {text: 'Chờ duyệt',       cls: 'bg-label-warning'},
    da_duyet:        {text: 'Chờ duyệt TT',    cls: 'bg-label-info'},
    cho_thanh_toan:  {text: 'Chờ thanh toán',  cls: 'bg-label-primary'},
    tu_choi:         {text: 'Từ chối',         cls: 'bg-label-danger'},
    tu_choi_tt:      {text: 'Từ chối TT',      cls: 'bg-label-danger'}
  };

  var LOAI_LABELS = {
    thanh_toan: 'Thanh toán',
    hoan_ve:    'Hoàn về',
    dieu_chinh: 'Điều chỉnh'
  };

  // =========================================================================
  // Init
  // =========================================================================

  $(function () {
    CFG = Drupal.settings.crm_dntt || {};
    notyf = new Notyf({position: {x: 'right', y: 'top'}, duration: 3000});

    initFlatpickr();
    initEvents();
    initSidebarCollapse();

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
        setupBackToWin();
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
        $('#dntt-ti-gia').val(d.ti_gia || 1);

        var sl = STATUS_LABELS[d.trang_thai] || {text: d.trang_thai, cls: 'bg-label-secondary'};
        $('#badge-trang-thai').attr('class', 'badge ' + sl.cls).text(sl.text);
        $('#badge-loai-dntt').text(LOAI_LABELS[d.loai_dntt] || d.loai_dntt);

        CFG.trang_thai = d.trang_thai;
        CFG.loai_dntt = d.loai_dntt;
        // Issue 07: trạng thái "đã trả đủ" + cho phép tạo hoàn về là giá trị
        // dẫn xuất từ Công nợ, backend trả về trong /api/dntt/get.
        CFG.thanh_toan_da_tra_du = !!d.thanh_toan_da_tra_du;
        CFG.co_the_tao_hoan_ve = !!d.co_the_tao_hoan_ve;
        // ADR-0011: cho phép tạo DNTT điều chỉnh là cờ dẫn xuất từ Công nợ
        // (gốc thanh toán đã ghi nợ + còn phần điều chỉnh > 0).
        CFG.co_the_tao_dieu_chinh = !!d.co_the_tao_dieu_chinh;
        currentDntt = d;
        renderActionButtons();
        renderHoanVeLinks(d);
        renderStickyMeta(d);
        renderSummary(d);

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
          setSoCont($row, ct.so_cont);
          if (ct.loai_chi_phi_id) {
            var loaiLabel = ct.loai_chi_phi_ten || ct.loai_chi_phi_ma;
            setSelect2Val($row.find('.ct-loai-chi-phi'), ct.loai_chi_phi_id, loaiLabel);
          }

          $row.find('.ct-nhom-chi-phi').text(ct.nhom_chi_phi_ten || '');
          if (ct.don_vi) setSelect2Val($row.find('.ct-don-vi'), ct.don_vi, ct.don_vi);
          $row.find('.ct-don-gia').val(formatNum(ct.don_gia || 0));
          $row.find('.ct-loai-tien').val((ct.loai_tien || 'VND').toUpperCase());
          $row.find('.ct-so-luong').val(ct.so_luong ? formatNum(ct.so_luong) : '');
          $row.find('.ct-vat-pct').val(Math.round(parseFloat(ct.vat_phan_tram) || 0));
          $row.find('.ct-vat-amount').val(formatNum(ct.so_tien_vat));
          $row.find('.ct-truoc-vat').text(formatNum(ct.tien_truoc_vat));
          $row.find('.ct-sau-vat').text(formatNum(ct.tien_sau_vat));
          $row.find('.ct-sau-vat-vnd').text(formatNum(ct.tien_sau_vat_vnd || ct.tien_sau_vat));
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
    $('#table-chi-tiet').on('input', '.ct-don-gia', function () {
      calcRow($(this).closest('tr'), false);
    });
    $('#table-chi-tiet').on('change', '.ct-loai-tien', function () {
      calcRow($(this).closest('tr'), false);
    });
    $('#table-chi-tiet').on('input', '.ct-so-luong, .ct-vat-pct', function () {
      calcRow($(this).closest('tr'), false);
    });
    $('#dntt-ti-gia').on('input', function () {
      $('#chi-tiet-body .chi-tiet-row').each(function () { calcRow($(this), false); });
    });
    initTyGiaChungCheckbox();
    $('#table-chi-tiet').on('input', '.ct-vat-amount', function () {
      calcRow($(this).closest('tr'), true);
    });

    $(document).on('click', '#btn-save-dntt', saveDntt);
    $(document).on('click', '#btn-delete-dntt', deleteDntt);
    $(document).on('click', '#btn-trinh-duyet', function () { transitionDntt('cho_duyet'); });

    $('#dntt-sidebar-tabs').on('click', '.sidebar-tab', function () {
      var tab = $(this).data('tab');
      $('#dntt-sidebar-tabs .sidebar-tab').removeClass('active');
      $(this).addClass('active');
      $('.sidebar-panel').hide();
      $('#dntt-panel-' + tab).show();

      if ($('.crm-dntt-workspace').hasClass('sidebar-collapsed') && !isSidebarMobile()) {
        setSidebarCollapsed(false, true);
      }
    });

    $('#dntt-sidebar-toggle').on('click', function () {
      setSidebarCollapsed(!$('.crm-dntt-workspace').hasClass('sidebar-collapsed'), true);
    });

    $('#dntt-lo-hang-wrap').on('click', '.dntt-acc-header', function () {
      $(this).closest('.dntt-acc-item').toggleClass('open');
    });

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

    // ADR-0011: tạo DNTT điều chỉnh từ DNTT gốc (copy chi tiết làm mức khởi đầu).
    $(document).on('click', '#btn-create-dieu-chinh', function () {
      Swal.fire({
        title: 'Tạo DNTT điều chỉnh?',
        text: 'Tạo chứng từ điều chỉnh từ DNTT này; chỉnh dòng xuống rồi duyệt để giảm số dư phải trả.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Tạo điều chỉnh',
        cancelButtonText: 'Hủy'
      }).then(function (r) {
        if (!r.isConfirmed) return;
        $.ajax({
          url: '/api/dntt/create-dieu-chinh',
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

    // ADR-0011: duyệt DNTT điều chỉnh trực tiếp → ghi bút toán âm vào sổ cái.
    $(document).on('click', '#btn-approve-dieu-chinh', function () {
      Swal.fire({
        title: 'Duyệt DNTT điều chỉnh?',
        text: 'Hệ thống sẽ ghi bút toán điều chỉnh ÂM, giảm số dư phải trả của DNTT gốc. Không thể sửa sau khi duyệt.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Duyệt điều chỉnh',
        cancelButtonText: 'Hủy'
      }).then(function (r) {
        if (!r.isConfirmed) return;
        $.ajax({
          url: '/api/dntt/approve-dieu-chinh',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({dntt_id: CFG.dntt_id}),
          dataType: 'json',
          success: function (res) {
            if (res.success) {
              notyf.success('Đã duyệt điều chỉnh');
              window.location.reload();
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
      // Số cont nằm TRONG ô Jobfile, không phải cột thứ 16 — lý lẽ ở nhan đề
      // cột trong `crm-dntt-form.tpl.php`. `d-none` cho tới khi có cont thật,
      // để dòng không cont giữ đúng chiều cao cũ.
      '<td><select class="ct-lo-hang w-100" id="lo-hang-' + rid + '"></select>' +
      '<div class="ct-so-cont small text-muted d-none"></div></td>' +
      '<td><select class="ct-loai-chi-phi w-100" id="loai-phi-' + rid + '"></select></td>' +
      '<td class="ct-nhom-chi-phi text-muted small"></td>' +
      '<td><input type="text" class="form-control form-control-sm text-end ct-don-gia num-fmt" name="don_gia" value="0"></td>' +
      '<td><select class="form-select form-select-sm ct-loai-tien" name="loai_tien"><option value="VND" selected>VND</option><option value="USD">USD</option></select></td>' +
      '<td><input type="text" class="form-control form-control-sm text-end ct-so-luong num-fmt" name="so_luong" value=""></td>' +
      '<td><select class="ct-don-vi w-100" id="don-vi-' + rid + '"></select></td>' +
      '<td><input type="number" class="form-control form-control-sm text-end ct-vat-pct" name="vat_phan_tram" value="0" step="1"></td>' +
      '<td><input type="text" class="form-control form-control-sm text-end ct-vat-amount num-fmt" name="so_tien_vat" value="0"></td>' +
      '<td class="text-end ct-truoc-vat">0</td>' +
      '<td class="text-end ct-sau-vat fw-semibold">0</td>' +
      '<td class="text-end ct-sau-vat-vnd fw-semibold text-primary">0</td>' +
      '<td><input type="text" class="form-control form-control-sm ct-ghi-chu" name="ghi_chu" placeholder="..."></td>' +
      '<td class="text-center"><button type="button" class="btn btn-sm btn-icon btn-label-danger btn-delete-row" title="Xóa"><i class="ti tabler-trash"></i></button></td>' +
      '</tr>';

    var $row = $(html).appendTo('#chi-tiet-body');

    setTimeout(function () { initRowSelect2($row); }, 100);

    return $row;
  }

  /**
   * Số cont của chuyến đã gom dòng, dưới ô Jobfile.
   *
   * Dòng nhập tay để TRỐNG — không dấu gạch, không chữ "Nhập tay": trang này
   * là màn của người ký trả tiền và nó không có khái niệm "nguồn" như tab Chi
   * phí trong modal đơn hàng. Cả bốn hình dạng của "chưa biết cont" (khoá
   * vắng mặt vì module trucking tắt · NULL · chuỗi rỗng · dòng nhập tay) vẽ ra
   * cùng một ô trống, nên không ca nào được ném lỗi.
   *
   * `.text()` chứ không phải chuỗi HTML ghép tay: số cont là dữ liệu người
   * dùng gõ, và nó cũng đi vào `title`. Không qua `Drupal.t()` — placeholder
   * `@` của nó chạy `checkPlain()` rồi lớp escape sau escape lần nữa.
   */
  function setSoCont($row, soCont) {
    var $oCont = $row.find('.ct-so-cont');
    var cont = soCont === null || soCont === undefined ? '' : String(soCont).trim();

    $oCont.text(cont).toggleClass('d-none', cont === '');
    if (cont === '') {
      $oCont.removeAttr('title');
    }
    else {
      $oCont.attr('title', 'Số cont: ' + cont);
    }
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
    });

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
    }).on('select2:select select2:clear', function () {
      renderLoHangRelated();
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
        $tr.find('.ct-loai-tien').val('VND');
        calcRow($tr, false);
      }
      renderLoHangRelated();
    });
    $loaiPhi.on('select2:clear', function () {
      $(this).closest('tr').find('.ct-nhom-chi-phi').text('');
      renderLoHangRelated();
    });
  }

  function calcRow($row, vatOverride) {
    var donGia = parseNum($row.find('.ct-don-gia').val());
    var loaiTien = ($row.find('.ct-loai-tien').val() || 'VND').toUpperCase();
    var rate = loaiTien === 'USD' ? (parseFloat($('#dntt-ti-gia').val()) || 1) : 1;
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
    var sauVatVnd = Math.round(sauVat * rate);

    $row.find('.ct-truoc-vat').text(formatNum(truocVat));
    $row.find('.ct-sau-vat').text(formatNum(sauVat));
    $row.find('.ct-sau-vat-vnd').text(formatNum(sauVatVnd));
    recalcTotal();
  }

  function recalcTotal() {
    var total = 0;
    var rows = $('#chi-tiet-body .chi-tiet-row');
    rows.each(function () {
      total += parseNum($(this).find('.ct-sau-vat-vnd').text());
    });
    $('#dntt-tong-tien').text(formatNum(total));
    $('#sticky-so-dong').text(rows.length);
    renderLoHangRelated();
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

  function saveDntt(callback) {
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

          // ADR-0003 / Issue 01: quay lại đơn hàng win sau khi lưu.
          if (CFG.from === 'don-hang-win') {
            var back = '/quan-ly/don-hang-win';
            if (CFG.lo_hang_nid) back += '?open_chi_phi=' + CFG.lo_hang_nid;
            window.location.href = back;
            return;
          }

          if (!dnttId) loadDntt(res.dntt_id);
          if (typeof callback === 'function') {
            callback(res.dntt_id, res);
          }
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
        loai_tien: ($row.find('.ct-loai-tien').val() || 'VND').toUpperCase(),
        so_luong: parseNum($row.find('.ct-so-luong').val()),
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
            $row.find('.ct-sau-vat-vnd').text(formatNum(res.tien_sau_vat_vnd));
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

    if (newStatus === 'cho_duyet') {
      saveDntt(function (savedDnttId) {
        $.ajax({
          url: '/api/lo-dntt/create-batch',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({dntt_ids: [parseInt(savedDnttId, 10)]}),
          dataType: 'json',
          success: function (res) {
            if (res.success) {
              notyf.success('Đã tạo lô và trình duyệt DNTT.');
              window.location.reload();
            } else {
              notyf.error(res.message || 'Không thể trình duyệt DNTT.');
            }
          },
          error: function () { notyf.error('Lỗi kết nối server.'); }
        });
      });
      return;
    }

    saveDntt(function (savedDnttId) {
      $.ajax({
        url: '/api/dntt/transition',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({dntt_id: parseInt(savedDnttId, 10), new_status: newStatus}),
        dataType: 'json',
        success: function (res) {
          if (res.success) {
            notyf.success('Đã chuyển trạng thái.');
            window.location.reload();
          } else {
            notyf.error(res.message);
          }
        },
        error: function () { notyf.error('Lỗi kết nối server.'); }
      });
    });
  }

  // =========================================================================
  // Action bar
  // =========================================================================

  function renderActionButtons() {
    var $wrap = $('#action-buttons').empty();
    var status = CFG.trang_thai || 'moi';
    var isNew = !CFG.dntt_id;
    // ADR-0003 / Issue 03: readonly do trạng thái HOẶC do phân quyền (CFG.is_editable
    // đã gộp cả hai) → khóa Lưu/Xóa/Trình duyệt, chỉ hiện badge trạng thái.
    var editable = isNew || CFG.is_editable !== false;

    if (editable && (isNew || status === 'moi' || status === 'tu_choi' || status === 'tu_choi_tt')) {
      $wrap.append('<button class="btn btn-primary" id="btn-save-dntt"><i class="ti tabler-device-floppy me-1"></i>Lưu</button>');
      if (!isNew) {
        $wrap.append('<button class="btn btn-outline-danger" id="btn-delete-dntt"><i class="ti tabler-trash me-1"></i>Xóa</button>');
        // ADR-0011: DNTT điều chỉnh duyệt trực tiếp (chứng từ sửa sổ), KHÔNG đi
        // đường lô "Trình duyệt" như DNTT thanh toán/Hoàn về.
        if (CFG.loai_dntt === 'dieu_chinh') {
          $wrap.append('<button class="btn btn-success" id="btn-approve-dieu-chinh"><i class="ti tabler-check me-1"></i>Duyệt điều chỉnh</button>');
        } else {
          $wrap.append('<button class="btn btn-warning" id="btn-trinh-duyet"><i class="ti tabler-send me-1"></i>Trình duyệt</button>');
        }
      }
    } else {
      var sl = STATUS_LABELS[status] || {text: status, cls: 'bg-label-secondary'};
      $wrap.append('<span class="badge ' + sl.cls + ' fs-6">' + sl.text + '</span>');
    }

    // Issue 07: nút "Tạo DNTT hoàn về" hiện theo cờ dẫn xuất từ backend
    // (đã trả đủ trên Công nợ + chưa có hoàn về), không còn gắn với da_tt.
    if (!isNew && CFG.loai_dntt !== 'hoan_ve' && CFG.co_the_tao_hoan_ve) {
      $wrap.append('<button class="btn btn-primary" id="btn-create-hoan-ve"><i class="ti tabler-receipt-refund me-1"></i>Tạo DNTT hoàn về</button>');
    }

    // ADR-0011: nút "Tạo DNTT điều chỉnh" trên DNTT thanh toán đã ghi nợ và còn
    // phần điều chỉnh — giảm nghĩa vụ phải trả sai khi chưa/đang trả dở.
    if (!isNew && CFG.loai_dntt === 'thanh_toan' && CFG.co_the_tao_dieu_chinh) {
      $wrap.append('<button class="btn btn-outline-primary" id="btn-create-dieu-chinh"><i class="ti tabler-pencil-minus me-1"></i>Tạo DNTT điều chỉnh</button>');
    }
  }

  function renderHoanVeLinks(d) {
    var $el = $('#dntt-hoan-ve-links').empty();
    // Hoàn về và Điều chỉnh đều trỏ về một DNTT gốc.
    if ((d.loai_dntt === 'hoan_ve' || d.loai_dntt === 'dieu_chinh') && d.dntt_goc_id && d.dntt_goc_so_dntt) {
      $el.append('<a href="/quan-ly/dntt/' + d.dntt_goc_id + '" class="badge bg-label-warning">Gốc: ' + d.dntt_goc_so_dntt + '</a>');
    }
    if (d.dntt_hoan_ve && d.dntt_hoan_ve.length) {
      $.each(d.dntt_hoan_ve, function (i, hv) {
        $el.append(' <a href="/quan-ly/dntt/' + hv.dntt_id + '" class="badge bg-label-info">Hoàn: ' + hv.so_dntt + '</a>');
      });
    }
    // Các DNTT điều chỉnh con (ADR-0011): xanh = đã duyệt, xám = còn nháp.
    if (d.dntt_dieu_chinh && d.dntt_dieu_chinh.length) {
      $.each(d.dntt_dieu_chinh, function (i, dc) {
        var cls = dc.trang_thai === 'da_duyet' ? 'bg-label-success' : 'bg-label-secondary';
        $el.append(' <a href="/quan-ly/dntt/' + dc.dntt_id + '" class="badge ' + cls + '">ĐC: ' + dc.so_dntt + '</a>');
      });
    }
  }

  // =========================================================================
  // Sidebar + sticky bar (Issue 16)
  // =========================================================================

  function renderStickyMeta(d) {
    if (!d) return;
    $('#sticky-so-dntt').text(d.so_dntt || '');
    var sl = STATUS_LABELS[d.trang_thai] || {text: d.trang_thai, cls: 'bg-label-secondary'};
    var loai = LOAI_LABELS[d.loai_dntt] || d.loai_dntt || '';
    $('#sticky-badges').html(
      '<span class="badge bg-label-primary me-1">' + loai + '</span>' +
      '<span class="badge ' + sl.cls + '">' + sl.text + '</span>'
    );
  }

  function summaryRow(label, value) {
    return '<div class="dntt-summary-row"><span class="lbl">' + label + '</span>' +
           '<span class="val">' + (value || '—') + '</span></div>';
  }

  function renderSummary(d) {
    var $wrap = $('#dntt-summary-wrap');
    if (!d) {
      $wrap.html('<div class="text-muted small">Lưu DNTT để xem tổng hợp.</div>');
      return;
    }
    var sl = STATUS_LABELS[d.trang_thai] || {text: d.trang_thai, cls: 'bg-label-secondary'};
    var loai = LOAI_LABELS[d.loai_dntt] || d.loai_dntt || '';
    var hinhThuc = d.hinh_thuc_tt === 'TM' ? 'Tiền mặt (TM)' : 'Chuyển khoản (CK)';
    var ngayHd = d.ngay_hoa_don ? new Date(d.ngay_hoa_don * 1000).toLocaleDateString('vi-VN') : '';
    var hanTt = d.han_thanh_toan ? new Date(d.han_thanh_toan * 1000).toLocaleDateString('vi-VN') : '';

    var html = '';
    html += summaryRow('Số DNTT', d.so_dntt);
    html += summaryRow('Trạng thái', '<span class="badge ' + sl.cls + '">' + sl.text + '</span>');
    html += summaryRow('Loại DNTT', '<span class="badge bg-label-primary">' + loai + '</span>');
    html += summaryRow('Đối tác nhận tiền', d.doi_tac_nhan_tien_ten);
    html += summaryRow('Bên phát hành', d.ben_phat_hanh_ten);
    html += summaryRow('Số hóa đơn', d.no_hoa_don == 1 ? 'Nợ HĐ' : (d.so_hoa_don || '—'));
    html += summaryRow('Ngày hóa đơn', ngayHd);
    html += summaryRow('Hạn thanh toán', hanTt);
    html += summaryRow('Hình thức TT', hinhThuc);
    html += summaryRow('Tỉ giá USD', formatNum(d.ti_gia || 1));
    $wrap.html('<div class="p-3">' + html + '</div>');
  }

  function renderLoHangRelated() {
    var $wrap = $('#dntt-lo-hang-wrap');
    if (!$wrap.length) return;

    var groups = {};
    var order = [];
    var VP_KEY = '__vp__';

    $('#chi-tiet-body .chi-tiet-row').each(function () {
      var $row = $(this);
      var loaiSel = $row.find('.ct-loai-chi-phi');
      var loaiText = select2Text(loaiSel);

      var loHangSel = $row.find('.ct-lo-hang');
      var loHang = select2Selection(loHangSel);
      var jobKey = VP_KEY, jobText = 'Chi phí VP / Chung';
      if (loHang.id) {
        jobKey = String(loHang.id);
        jobText = loHang.text || jobKey;
      }

      var nhom = $row.find('.ct-nhom-chi-phi').text() || '';
      var vnd = parseNum($row.find('.ct-sau-vat-vnd').text());
      var isUsd = ($row.find('.ct-loai-tien').val() || 'VND').toUpperCase() === 'USD';

      if (!groups[jobKey]) {
        groups[jobKey] = {text: jobText, lines: [], total: 0, isVp: jobKey === VP_KEY};
        order.push(jobKey);
      }
      groups[jobKey].lines.push({loai: loaiText || '(chưa chọn loại phí)', nhom: nhom, vnd: vnd, isUsd: isUsd});
      groups[jobKey].total += vnd;
    });

    // VP nhóm xuống cuối
    order.sort(function (a, b) {
      if (a === VP_KEY) return 1;
      if (b === VP_KEY) return -1;
      return 0;
    });

    $('#dntt-lo-hang-count').text(order.length);

    if (!order.length) {
      $wrap.html('<div class="p-3 text-muted small">Chưa có dòng chi phí.</div>');
      return;
    }

    var html = '';
    $.each(order, function (i, key) {
      var g = groups[key];
      var lines = '';
      $.each(g.lines, function (j, ln) {
        var badge = ln.isUsd ? '<span class="badge bg-label-info ms-1" style="font-size:9px;">USD</span>'
                             : '<span class="badge bg-label-secondary ms-1" style="font-size:9px;">VND</span>';
        lines += '<div class="dntt-acc-line">' +
          '<span class="ten">' + escapeHtml(ln.loai) + badge +
          (ln.nhom ? '<div class="nhom">' + escapeHtml(ln.nhom) + '</div>' : '') +
          '</span>' +
          '<span class="amt">' + formatNum(ln.vnd) + '</span>' +
          '</div>';
      });
      var icon = g.isVp ? 'ti tabler-building-warehouse' : 'ti tabler-package';
      html += '<div class="dntt-acc-item' + (i === 0 ? ' open' : '') + '">' +
        '<div class="dntt-acc-header">' +
          '<i class="ti tabler-chevron-down dntt-acc-chevron"></i>' +
          '<i class="' + icon + '" style="font-size:13px;color:#7367f0;"></i>' +
          '<span class="dntt-acc-id">' + escapeHtml(g.text) + '</span>' +
          '<span class="text-muted ms-1" style="font-size:10px;">(' + g.lines.length + ')</span>' +
          '<span class="dntt-acc-amount">' + formatNum(g.total) + '</span>' +
        '</div>' +
        '<div class="dntt-acc-body">' + lines + '</div>' +
        '</div>';
    });
    $wrap.html(html);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Đọc text/selection từ Select2 an toàn (Select2 có thể chưa init lúc gọi sớm).
  function select2Selection($el) {
    try {
      if ($el.data('select2')) {
        var data = $el.select2('data') || [];
        if (data.length && data[0].id) {
          return {id: data[0].id, text: data[0].text || ''};
        }
        return {id: '', text: ''};
      }
    } catch (e) {}
    var val = $el.val();
    var text = $el.find('option:selected').text();
    return {id: val || '', text: text || ''};
  }

  function select2Text($el) {
    return select2Selection($el).text;
  }

  function isSidebarMobile() {
    return window.matchMedia && window.matchMedia('(max-width: 991.98px)').matches;
  }

  function sidebarStorage(value) {
    try {
      if (value === undefined) {
        return window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
      }
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, value);
    } catch (e) {}
    return null;
  }

  function setSidebarCollapsed(collapsed, persist) {
    if (isSidebarMobile()) {
      collapsed = false;
    }

    $('.crm-dntt-workspace').toggleClass('sidebar-collapsed', collapsed);

    var $toggle = $('#dntt-sidebar-toggle');
    var label = collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar';
    var icon = collapsed ? 'ti tabler-layout-sidebar-right-expand' : 'ti tabler-layout-sidebar-right-collapse';
    $toggle.attr({
      'aria-expanded': collapsed ? 'false' : 'true',
      'aria-label': label,
      title: label
    }).find('i').attr('class', icon);

    if (persist !== false && !isSidebarMobile()) {
      sidebarStorage(collapsed ? '1' : '0');
    }
  }

  function initSidebarCollapse() {
    setSidebarCollapsed(sidebarStorage() === '1', false);
    $(window).on('resize.crmDnttSidebar', function () {
      setSidebarCollapsed(!isSidebarMobile() && sidebarStorage() === '1', false);
    });
  }


  // =========================================================================
  // Checkbox "Dùng tỷ giá hiện tại" (ticket 04, ADR-0004)
  // =========================================================================

  /**
   * Gắn checkbox `#dntt-dung-ty-gia-chung` vào helper dùng chung của
   * `cau_hinh_ty_gia` (ticket 02) — module MỀM, `template.php` tự
   * `module_exists()` trước khi nạp file helper.
   *
   * Chỉ gắn khi phiếu còn sửa được (`CFG.is_editable`): form Xem (readonly)
   * disable hẳn checkbox thay vì gắn helper — cố ý KHÔNG đụng `lockForm()`
   * (nó khoá `#dntt-ti-gia` theo lý do riêng, trạng thái phiếu), để hai cơ chế
   * khoá không dẫm lên nhau; nếu gắn helper trong ca readonly, untick checkbox
   * sẽ mở khoá lại `#dntt-ti-gia` mà `lockForm()` vừa khoá.
   */
  function initTyGiaChungCheckbox() {
    var $checkbox = $('#dntt-dung-ty-gia-chung');
    if (!CFG.is_editable || typeof window.attachTyGiaChungCheckbox !== 'function') {
      $checkbox.prop('disabled', true);
      return;
    }

    window.attachTyGiaChungCheckbox($checkbox, '#dntt-ti-gia');

    // `dntt.ti_gia` là numeric(15,2) — làm tròn về 2 chữ số thập phân, khớp
    // step="0.01" của input, khác precision numeric(18,4) của tỷ giá chung
    // (helper dùng chung set nguyên giá trị 4 chữ số, không tự làm tròn theo
    // từng nơi tiêu thụ).
    $checkbox.on('change.tyGiaChungLamTron', function () {
      if (!$(this).is(':checked')) return;
      var v = parseFloat($('#dntt-ti-gia').val());
      if (!isNaN(v)) {
        $('#dntt-ti-gia').val(v.toFixed(2));
      }
    });
  }

  // =========================================================================
  // Lock
  // =========================================================================

  function lockForm() {
    $('.crm-dntt-form').addClass('locked');
    $('#dntt-ben-phat-hanh, #dntt-doi-tac-nhan-tien').prop('disabled', true);
    $('#chi-tiet-body .ct-lo-hang, #chi-tiet-body .ct-loai-chi-phi, #chi-tiet-body .ct-don-vi').prop('disabled', true);
    $('#chi-tiet-body input, #chi-tiet-body button, #dntt-ti-gia').prop('disabled', true);
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

  function setupBackToWin() {
    // ADR-0003 / Issue 01: khi mở từ đơn hàng win, nút "Quay lại" trỏ về view win.
    if (CFG.from !== 'don-hang-win') return;
    var back = '/quan-ly/don-hang-win';
    if (CFG.lo_hang_nid) back += '?open_chi_phi=' + CFG.lo_hang_nid;
    $('#action-bar a.btn-label-secondary').attr('href', back)
      .html('<i class="bx bx-arrow-back me-1"></i>Quay lại đơn hàng win');
  }

  function prefillLoHang() {
    var loHang = CFG.lo_hang_nid || null;
    if (!loHang) {
      var params = new URLSearchParams(window.location.search);
      loHang = params.get('lo_hang_nid');
    }
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

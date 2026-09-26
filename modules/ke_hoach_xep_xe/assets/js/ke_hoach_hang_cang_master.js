/**
 * Dữ liệu danh mục dùng chung cho các màn HÀNG CẢNG (khách hàng, lái xe, phương tiện, kho/bãi/cảng/loại hàng).
 *
 * Trước đây bộ lọc của danh sách và modal xếp xe mỗi bên tự gọi 4 API (limit 500, nguyên bản ghi) nên mở modal
 * là gọi lại từ đầu. Giờ mỗi API chỉ tải 1 lần với `select` gọn (module api_common), mỗi lần gọi tối đa 100 dòng
 * (trang 1 lấy total_pages, các trang còn lại gọi song song), lưu chung trong bộ nhớ trang:
 * bộ lọc, modal xếp xe, phiếu trả khách hàng, danh sách cont đều lấy từ đây. Gọi đồng thời cùng một nguồn thì dùng
 * chung 1 request. Lưu thêm vào sessionStorage (chỉ các trường gọn, hạn 10 phút) để đi lại giữa các trang kế hoạch
 * không phải tải lại; F5 luôn tải mới.
 *
 * Chỉ nạp ở màn hàng cảng (ke_hoach_xep_xe.js chỉ dùng khi plan_type != tuyen_xa). Tuyến xa không dùng file này.
 * Trường nào được lấy: xem SOURCES (đối chiếu với nơi dùng trong ke_hoach_xep_xe.js — thêm trường mới thì sửa ở đây).
 */
(function (Drupal, window) {
  'use strict';

  var STORAGE_KEY = 'khxh_hang_cang_master_v2';
  var TTL_MS = 10 * 60 * 1000;
  var PAGE_SIZE = 100;   // mỗi lần gọi API tối đa 100 dòng
  var MAX_PAGES = 50;    // chặn an toàn: tối đa 5.000 dòng mỗi nguồn

  var SOURCES = {
    customers: {
      url: '/api/khach-hang',
      data: { select: 'nid,ma_kh,ten', limit: PAGE_SIZE }
    },
    drivers: {
      url: '/api/lai-xe',
      data: { select: 'nid,ten,ma_nhan_vien,sdt', limit: PAGE_SIZE }
    },
    vehicles: {
      url: '/api/phuong-tien',
      data: { select: 'nid,bks,ma_tai_san,loai_phuong_tien,hang_xe,nam_san_xuat,lai_xe', limit: PAGE_SIZE }
    },
    // Tên kho/bãi/cảng/loại hàng/chi phí, đã chia sẵn theo loại (xem normalize).
    diaDiem: {
      url: '/api/danh-muc',
      data: { phan_loai: 'Kho,Bãi,Cảng,Loại hàng,Chi phí', select: 'nid,ten,phan_loai', limit: PAGE_SIZE }
    }
  };

  // Trang có thể có nhiều bản jQuery (của Drupal và của theme, có bản slim không có ajax/Deferred). Không bắt `jQuery` lúc nạp file:
  // nơi dùng gọi use($) với bản jQuery của chính họ, chưa gọi thì chọn lúc cần bản nào đủ ajax + Deferred.
  var jq = null;
  function J() {
    if (jq) return jq;
    var list = [window.jQuery, window.$];
    for (var i = 0; i < list.length; i++) {
      if (list[i] && list[i].ajax && list[i].Deferred) return list[i];
    }
    return window.jQuery;
  }

  var data = { customers: null, drivers: null, vehicles: null, diaDiem: null };
  var stamps = {};      // kind => thời điểm tải (ms) để tính hạn cache
  var pending = {};     // kind => promise đang chạy (dùng chung cho mọi nơi gọi cùng lúc)

  function emptyDiaDiem() {
    return { kho: [], bai: [], cang: [], loaiHang: [], chiPhi: [] };
  }

  function normalize(kind, items) {
    if (kind !== 'diaDiem') return items;
    var out = emptyDiaDiem();
    for (var i = 0; i < items.length; i++) {
      var phanLoai = String(items[i].phan_loai || '').toLowerCase();
      var ten = items[i].ten || '';
      if (!ten) continue;
      if (phanLoai === 'kho') out.kho.push(ten);
      else if (phanLoai === 'bãi') out.bai.push(ten);
      else if (phanLoai === 'cảng') out.cang.push(ten);
      else if (phanLoai === 'loại hàng') out.loaiHang.push(ten);
      else if (phanLoai === 'chi phí') out.chiPhi.push(ten);
    }
    return out;
  }

  function fallback(kind) {
    return kind === 'diaDiem' ? emptyDiaDiem() : [];
  }

  function isReload() {
    try {
      var nav = window.performance && window.performance.getEntriesByType ? window.performance.getEntriesByType('navigation')[0] : null;
      return !!(nav && nav.type === 'reload');
    } catch (e) {
      return false;
    }
  }

  function clearStorage() {
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function persist() {
    try {
      var out = {};
      Object.keys(data).forEach(function (kind) {
        if (data[kind]) out[kind] = { t: stamps[kind] || 0, v: data[kind] };
      });
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    } catch (e) {
      // Hết hạn mức hoặc bị chặn: bỏ qua, lần sau tải lại.
    }
  }

  function hydrate() {
    if (isReload()) {
      clearStorage();
      return;
    }
    try {
      var raw = window.sessionStorage.getItem(STORAGE_KEY);
      var saved = raw ? JSON.parse(raw) : null;
      if (!saved) return;
      var now = new Date().getTime();
      Object.keys(SOURCES).forEach(function (kind) {
        var entry = saved[kind];
        if (entry && entry.v && now - (Number(entry.t) || 0) < TTL_MS) {
          data[kind] = entry.v;
          stamps[kind] = Number(entry.t) || 0;
        }
      });
    } catch (e) {
      clearStorage();
    }
  }

  // Tải đủ mọi trang của 1 nguồn: trang 1 cho biết total_pages, các trang còn lại gọi song song rồi ghép đúng thứ tự.
  function fetchAllPages(source) {
    var $ = J();
    var deferred = $.Deferred();
    function request(page) {
      return $.ajax({ url: source.url, type: 'GET', dataType: 'json', data: $.extend({}, source.data, { page: page }) });
    }
    function itemsOf(res) {
      return res && res.status === 'success' && res.data && $.isArray(res.data.items) ? res.data.items : null;
    }
    request(1).done(function (res) {
      var first = itemsOf(res);
      if (!first) {
        deferred.reject(res && res.message ? res.message : 'Không tải được dữ liệu');
        return;
      }
      var pages = Math.min(MAX_PAGES, Math.max(1, parseInt(res.data.total_pages, 10) || 1));
      if (pages === 1) {
        deferred.resolve(first);
        return;
      }
      var chunks = [];
      var left = pages - 1;
      var failed = false;
      $.each($.map(new Array(pages - 1), function (_, i) { return i + 2; }), function (_, page) {
        request(page).done(function (r) {
          var got = itemsOf(r);
          if (got) chunks[page - 2] = got; else failed = true;
        }).fail(function () {
          failed = true;
        }).always(function () {
          left -= 1;
          if (left > 0) return;
          if (failed) {
            deferred.reject('Không tải đủ dữ liệu');
            return;
          }
          var all = first;
          for (var c = 0; c < chunks.length; c++) all = all.concat(chunks[c]);
          deferred.resolve(all);
        });
      });
    }).fail(function (jqXHR) {
      deferred.reject(jqXHR);
    });
    return deferred.promise();
  }

  function loadKind(kind) {
    var $ = J();
    if (data[kind]) return $.Deferred().resolve().promise();
    if (pending[kind]) return pending[kind];
    var deferred = $.Deferred();
    pending[kind] = deferred.promise();
    fetchAllPages(SOURCES[kind])
      .done(function (items) {
        data[kind] = normalize(kind, items);
        stamps[kind] = new Date().getTime();
        persist();
        deferred.resolve();
      })
      .fail(function (reason) { deferred.reject(reason); })
      .always(function () { delete pending[kind]; });
    return deferred.promise();
  }

  hydrate();

  Drupal.keHoachHangCangMaster = {
    /**
     * Tải các nguồn còn thiếu (đã có thì không gọi). Promise resolve khi mọi nguồn xong, reject nếu có nguồn lỗi —
     * luôn đợi tất cả nguồn kết thúc rồi mới báo, để nơi gọi dùng .always() và lấy phần nào có.
     */
    load: function (kinds) {
      var $ = J();
      kinds = kinds && kinds.length ? kinds : ['customers', 'drivers', 'vehicles', 'diaDiem'];
      var deferred = $.Deferred();
      var left = kinds.length;
      var failed = false;
      $.each(kinds, function (_, kind) {
        loadKind(kind)
          .fail(function () { failed = true; })
          .always(function () {
            left -= 1;
            if (left > 0) return;
            if (failed) deferred.reject(); else deferred.resolve();
          });
      });
      return deferred.promise();
    },

    /** Chỉ định bản jQuery (đủ ajax + Deferred) mà nơi gọi đang dùng. */
    use: function (jquery) {
      if (jquery && jquery.ajax && jquery.Deferred) jq = jquery;
    },

    /** Dữ liệu đã tải (cùng một mảng/đối tượng cho mọi nơi gọi: sửa tại chỗ rồi gọi persist()). Chưa tải thì trả rỗng. */
    get: function (kind) {
      return data[kind] || fallback(kind);
    },

    /** Ghi lại sau khi có nơi thêm khách hàng / danh mục mới vào mảng dùng chung. */
    persist: persist,

    /** Bỏ 1 nguồn (hoặc tất cả nếu không truyền) để lần load sau tải mới, vd sau khi vừa tạo danh mục mới. */
    invalidate: function (kind) {
      if (kind) {
        data[kind] = null;
        delete stamps[kind];
        persist();
        return;
      }
      data = { customers: null, drivers: null, vehicles: null, diaDiem: null };
      stamps = {};
      clearStorage();
    }
  };
})(Drupal, window);

/**
 * Màn Phân quyền hệ thống (/phan-quyen).
 *
 * Toàn bộ dữ liệu lấy 1 lần từ GET /api/phan-quyen (module/quyền, vai trò, quyền đang cấp, người dùng). Mọi thao tác
 * tick chỉ ghi vào S.changes (chưa lưu); bấm Lưu → hộp xác nhận → POST /api/phan-quyen với danh sách thay đổi,
 * server trả lại dữ liệu mới. Đối tượng (subject) viết tắt: 'r<rid>' = vai trò, 'u<uid>' = quyền riêng 1 người.
 */
(function (Drupal) {
  'use strict';

  // Trang có 2 bản jQuery: bản cũ của Drupal core (không có .on()) và bản mới của theme nạp sau. Lúc file này chạy
  // window.jQuery vẫn là bản cũ, nên chọn bản jQuery lúc trang khởi tạo (behavior attach), ưu tiên bản có .on().
  var $ = null;
  function pickJq() {
    var list = [window.jQuery, window.$];
    for (var i = 0; i < list.length; i++) {
      if (typeof list[i] === 'function' && list[i].fn && typeof list[i].fn.on === 'function') return list[i];
    }
    return null;
  }

  var API = '/api/phan-quyen';
  var STORE_KEY = 'phan_quyen_ui_v1';

  var canManage = false;
  var notyf = null;
  var D = null;          // dữ liệu server
  var idx = {};          // tra cứu nhanh dựng từ D (buildIndex)
  var S = {
    tab: 'mt',
    changes: {},         // 'r5|quyen' => true/false (khác hiện trạng)
    q: '',
    onlyChanged: false,
    collapsed: {},       // module id => true
    hidden: {},          // rid => true (ẩn cột)
    userCols: [],        // uid đang hiện cột
    copyFrom: 0,
    copyTo: 0,
    copyMode: 'add',
    lsPage: 1,
    lsQ: ''
  };

  /* ─────────── Tiện ích ─────────── */

  function esc(v) {
    if (v === null || typeof v === 'undefined') return '';
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function apiMsg(jqXHR) {
    try {
      var r = JSON.parse(jqXHR.responseText);
      return (r && r.message) || 'Có lỗi xảy ra';
    } catch (e) {
      return 'Có lỗi xảy ra';
    }
  }

  function toast(msg, ok) {
    if (notyf) notyf[ok === false ? 'error' : 'success'](msg);
    else window.alert(msg);
  }

  // Chuẩn hoá để tìm không phân biệt hoa/thường và dấu tiếng Việt: "Danh muc" khớp "Danh mục", "d" khớp "đ".
  function fold(v) {
    return String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }

  function loading(on) { $('#pq-loading').toggleClass('is-on', !!on); }

  function call(method, url, body, ok, fail) {
    $.ajax({
      url: url,
      type: method,
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
      data: body ? JSON.stringify(body) : undefined,
      success: function (res) { ok(res && res.data); },
      error: function (jqXHR) { if (fail) fail(jqXHR); toast(apiMsg(jqXHR), false); }
    });
  }

  // Cột người dùng đang mở + cột vai trò đang ẩn: nhớ theo trình duyệt (tiện, không quan trọng nếu mất).
  function saveUiPrefs() {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify({ hidden: S.hidden, userCols: S.userCols })); } catch (e) {}
  }

  function loadUiPrefs() {
    try {
      var p = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');
      if (p.hidden && typeof p.hidden === 'object') S.hidden = p.hidden;
      if (Array.isArray(p.userCols)) S.userCols = p.userCols;
    } catch (e) {}
  }

  /* ─────────── Dữ liệu & quy tắc kế thừa ─────────── */

  function buildIndex() {
    idx = { role: {}, user: {}, grant: {}, perm: {}, adminRid: parseInt(D.admin_rid, 10) || 0 };
    $.each(D.roles, function (_, r) { idx.role[r.rid] = r; });
    $.each(D.users, function (_, u) { idx.user[u.uid] = u; u.directSet = toSet(u.direct); });
    $.each(D.grants || {}, function (rid, list) { idx.grant[rid] = toSet(list); });
    $.each(D.modules, function (_, m) {
      $.each(m.quyen, function (_, p) { idx.perm[p.key] = { title: p.title, module: m.ten, restrict: !!p.restrict }; });
    });
    S.userCols = $.grep(S.userCols, function (uid) { return !!idx.user[uid]; });
    $.each(Object.keys(S.hidden), function (_, rid) { if (!idx.role[rid]) delete S.hidden[rid]; });
    $.each(Object.keys(S.changes), function (_, key) {
      var p = splitKey(key);
      if (!idx.perm[p.k] || !subjectExists(p.subj)) delete S.changes[key];
    });
    var normal = normalRoles();
    if (!idx.role[S.copyFrom] && normal[0]) S.copyFrom = normal[0].rid;
    if (!idx.role[S.copyTo] && normal[1]) S.copyTo = normal[1].rid;
  }

  function toSet(list) {
    var s = {};
    $.each(list || [], function (_, k) { s[k] = true; });
    return s;
  }

  function splitKey(key) {
    var i = key.indexOf('|');
    return { subj: key.slice(0, i), k: key.slice(i + 1) };
  }

  function subjId(subj) { return parseInt(subj.slice(1), 10); }
  function isRoleSubj(subj) { return subj.charAt(0) === 'r'; }

  function subjectExists(subj) {
    return isRoleSubj(subj) ? !!idx.role[subjId(subj)] : !!idx.user[subjId(subj)];
  }

  function normalRoles() { return $.grep(D.roles, function (r) { return r.loai === 'thuong'; }); }

  function subjName(subj) {
    var id = subjId(subj);
    if (isRoleSubj(subj)) return idx.role[id] ? idx.role[id].ten : '';
    return idx.user[id] ? idx.user[id].ten + ' (quyền riêng)' : '';
  }

  function orig(subj, k) {
    var id = subjId(subj);
    if (isRoleSubj(subj)) return !!(idx.grant[id] && idx.grant[id][k]);
    return !!(idx.user[id] && idx.user[id].directSet[k]);
  }

  function eff(subj, k) {
    var key = subj + '|' + k;
    return S.changes.hasOwnProperty(key) ? S.changes[key] : orig(subj, k);
  }

  function setChange(subj, k, val) {
    var key = subj + '|' + k;
    if (val === orig(subj, k)) delete S.changes[key];
    else S.changes[key] = val;
  }

  // Quyền đến từ đâu (không tính quyền cấp thẳng cho chính đối tượng): Authenticated user kế thừa xuống mọi vai trò;
  // người dùng kế thừa từ Authenticated + các vai trò của họ (vai trò Quản trị = mọi quyền).
  function inheritFrom(subj, k) {
    var out = [];
    var auth = idx.role[2];
    var id = subjId(subj);
    if (isRoleSubj(subj)) {
      var r = idx.role[id];
      if (r && r.loai === 'thuong' && auth && eff('r2', k)) out.push(auth.ten);
      return out;
    }
    var u = idx.user[id];
    if (!u) return out;
    if (auth && eff('r2', k)) out.push(auth.ten);
    $.each(u.roles, function (_, rid) {
      var ro = idx.role[rid];
      if (ro && (ro.loai === 'admin' || eff('r' + rid, k))) out.push(ro.ten);
    });
    return out;
  }

  function subjects() {
    var list = [];
    $.each(D.roles, function (_, r) { if (!S.hidden[r.rid]) list.push({ subj: 'r' + r.rid, role: r }); });
    $.each(S.userCols, function (_, uid) { if (idx.user[uid]) list.push({ subj: 'u' + uid, user: idx.user[uid] }); });
    return list;
  }

  function roleNames(rids) {
    return $.map(rids, function (rid) { return idx.role[rid] ? idx.role[rid].ten : null; }).join(', ');
  }

  /* ─────────── Ma trận ─────────── */

  function renderHead(subs) {
    var html = '<tr><th class="pq-col-perm">Chức năng / Quyền</th><th class="pq-col-entry">Màn hình / API</th>';
    $.each(subs, function (_, x) {
      if (x.user) {
        html += '<th class="pq-col-user">' + esc(x.user.ten) + '<span class="pq-col-sub">' + esc(roleNames(x.user.roles) || 'Chưa có vai trò') + '</span>' +
          '<button type="button" class="pq-col-remove" data-uid="' + x.user.uid + '">Bỏ cột ×</button></th>';
      } else {
        var r = x.role;
        var sub = r.loai === 'auth' ? 'mọi tài khoản' : (r.loai === 'admin' ? 'toàn quyền' : r.so_thanh_vien + ' người');
        html += '<th class="pq-col-role">' + esc(r.ten) + '<span class="pq-col-sub">' + sub + '</span></th>';
      }
    });
    $('#pq-thead').html(html + '</tr>');
  }

  function permMatches(m, p, q) {
    if (!q) return true;
    return fold(p.title + ' ' + p.description + ' ' + p.key + ' ' + m.ten + ' ' + m.id + ' ' + p.entry.join(' ')).indexOf(q) !== -1;
  }

  function cellHtml(x, p) {
    var subj = x.subj;
    var key = subj + '|' + p.key;
    var cls = 'pq-cell' + (x.user ? ' is-user' : '') + (S.changes.hasOwnProperty(key) ? ' is-changed' : '');
    if (x.role && x.role.loai === 'admin') {
      return '<td class="' + cls + ' is-readonly"><span class="pq-admin-mark" title="Quản trị luôn có mọi quyền">✓</span></td>';
    }
    var on = eff(subj, p.key);
    var inh = inheritFrom(subj, p.key);
    if (inh.length && !on) {
      return '<td class="' + cls + ' is-readonly"><span class="pq-inh" title="Kế thừa từ ' + esc(inh.join(', ')) + '">✓</span></td>';
    }
    var blocked = !on && p.restrict && x.role && x.role.loai === 'auth';
    var disabled = !canManage || blocked;
    var title = blocked ? 'Quyền nhạy cảm, không cấp cho mọi tài khoản' : (p.title + ' — ' + (x.user ? x.user.ten : x.role.ten));
    return '<td class="' + cls + (disabled ? ' is-readonly' : '') + '" data-s="' + subj + '" data-k="' + esc(p.key) + '">' +
      '<input type="checkbox" class="form-check-input pq-cb" data-s="' + subj + '" data-k="' + esc(p.key) + '" title="' + esc(title) + '"' +
      (on ? ' checked' : '') + (disabled ? ' disabled' : '') + '></td>';
  }

  // Ô tổng của nhóm: ✓ = cả nhóm đã có (cấp thẳng hoặc kế thừa), – = một phần. Bấm: có đủ thì bỏ hết phần cấp
  // thẳng, chưa đủ thì cấp những quyền còn thiếu (bỏ qua quyền đã kế thừa).
  function groupCellHtml(x, m, perms) {
    if (x.role && x.role.loai === 'admin') return '<td class="text-center"><span class="pq-all-label">Toàn quyền</span></td>';
    var direct = 0, covered = 0;
    $.each(perms, function (_, p) {
      var on = eff(x.subj, p.key);
      if (on) direct++;
      if (on || inheritFrom(x.subj, p.key).length) covered++;
    });
    var all = direct > 0 && covered === perms.length;
    var cls = 'pq-tri' + (all ? ' is-all' : (direct ? ' is-some' : ''));
    var name = x.user ? x.user.ten : x.role.ten;
    return '<td class="text-center"><button type="button" class="' + cls + '" data-s="' + x.subj + '" data-m="' + esc(m.id) + '" data-all="' + (all ? 1 : 0) + '"' +
      ' title="' + (all ? 'Bỏ hết' : 'Cấp hết') + ' nhóm ' + esc(m.ten) + ' cho ' + esc(name) + '"' + (canManage ? '' : ' disabled') + '>' +
      (all ? '✓' : (direct ? '–' : '')) + '</button></td>';
  }

  function renderBody() {
    var subs = subjects();
    var q = fold($.trim(S.q));
    var html = '', shown = 0, total = 0;
    $.each(D.modules, function (_, m) {
      total += m.quyen.length;
      var perms = $.grep(m.quyen, function (p) {
        if (!permMatches(m, p, q)) return false;
        if (!S.onlyChanged) return true;
        var changed = false;
        $.each(subs, function (_, x) { if (S.changes.hasOwnProperty(x.subj + '|' + p.key)) changed = true; });
        return changed;
      });
      if (!perms.length) return;
      shown += perms.length;
      var open = !S.collapsed[m.id] || !!q || S.onlyChanged;
      html += '<tr class="pq-group"><th class="pq-col-perm"><button type="button" class="pq-group-toggle" data-m="' + esc(m.id) + '" aria-label="Mở/thu gọn nhóm">' +
        '<i class="ti ' + (open ? 'tabler-chevron-down' : 'tabler-chevron-right') + '"></i></button>' +
        '<span class="pq-group-name">' + esc(m.ten) + '</span><span class="pq-group-sub">' + perms.length + ' quyền · ' + esc(m.id) + '</span></th><td></td>';
      $.each(subs, function (_, x) { html += groupCellHtml(x, m, perms); });
      html += '</tr>';
      if (!open) return;
      $.each(perms, function (_, p) {
        html += '<tr><th class="pq-col-perm fw-normal">' +
          '<div class="pq-perm-title">' + esc(p.title) + (p.restrict ? '<span class="badge bg-label-danger pq-perm-restrict">Nhạy cảm</span>' : '') + '</div>' +
          (p.description ? '<div class="pq-perm-desc">' + esc(p.description) + '</div>' : '') +
          '<div class="pq-perm-key">' + esc(p.key) + '</div></th>' +
          '<td class="pq-col-entry">' + ($.map(p.entry, function (e) { return '<span class="pq-entry">' + esc(e) + '</span>'; }).join('<br>') || '<span class="text-muted">—</span>') + '</td>';
        $.each(subs, function (_, x) { html += cellHtml(x, p); });
        html += '</tr>';
      });
    });
    if (!shown) html = '<tr><td colspan="' + (subs.length + 2) + '" class="text-center text-muted py-4">Không có quyền khớp bộ lọc</td></tr>';
    $('#pq-tbody').html(html);
    $('#pq-footer').text('Hiển thị ' + shown + '/' + total + ' quyền · ' + D.modules.length + ' module');
    $('#pq-toggle-groups').text(anyGroupOpen() ? 'Thu gọn tất cả nhóm' : 'Mở tất cả nhóm');
  }

  function anyGroupOpen() {
    for (var i = 0; i < D.modules.length; i++) if (!S.collapsed[D.modules[i].id]) return true;
    return false;
  }

  function renderColChips() {
    var html = $.map(D.roles, function (r) {
      return '<button type="button" class="btn btn-sm ' + (S.hidden[r.rid] ? 'btn-outline-secondary' : 'btn-label-primary') + ' pq-col-chip" data-rid="' + r.rid + '">' + esc(r.ten) + '</button>';
    }).join('');
    $('#pq-col-chips').html(html);
  }

  function renderMatrix() {
    renderHead(subjects());
    renderBody();
    renderColChips();
  }

  function updateChangeUi() {
    var n = Object.keys(S.changes).length;
    $('#pq-change-badge').toggleClass('d-none', !n).text(n + ' thay đổi chưa lưu');
    $('#pq-save-count').text(n);
    $('#pq-btn-save, #pq-btn-discard').prop('disabled', !n);
    $('#pq-only-changed').toggleClass('btn-primary', S.onlyChanged).toggleClass('btn-label-secondary', !S.onlyChanged);
  }

  function refresh() {
    renderMatrix();
    updateChangeUi();
  }

  /* ─────────── Popover: thêm cột người dùng / sao chép quyền ─────────── */

  function renderUserPick() {
    var q = fold($.trim($('#pq-user-q').val()));
    var list = $.grep(D.users, function (u) {
      return $.inArray(u.uid, S.userCols) === -1 && (!q || fold(u.ten + ' ' + u.name).indexOf(q) !== -1);
    }).slice(0, 50);
    var html = $.map(list, function (u) {
      return '<button type="button" class="pq-user-item" data-uid="' + u.uid + '"><span>' + esc(u.ten) + ' <span class="small text-muted">' + esc(u.name) + '</span></span>' +
        '<span class="small text-muted">' + esc(roleNames(u.roles)) + '</span></button>';
    }).join('');
    $('#pq-user-list').html(html || '<div class="small text-muted p-2">Không có người dùng phù hợp</div>');
  }

  function renderCopyPop() {
    var chips = function (sel, cur) {
      return $.map(normalRoles(), function (r) {
        return '<button type="button" class="btn btn-sm ' + (r.rid === cur ? 'btn-primary' : 'btn-label-secondary') + '" data-rid="' + r.rid + '">' + esc(r.ten) + '</button>';
      }).join('');
    };
    $('#pq-copy-from').html(chips('from', S.copyFrom));
    $('#pq-copy-to').html(chips('to', S.copyTo));
    $('#pq-copy-mode button').each(function () {
      var on = $(this).data('mode') === S.copyMode;
      $(this).toggleClass('btn-primary', on).toggleClass('btn-label-secondary', !on);
    });
  }

  function closePops() { $('.pq-pop').addClass('d-none'); }

  function applyCopy() {
    if (!S.copyFrom || !S.copyTo || S.copyFrom === S.copyTo) {
      toast('Chọn 2 vai trò khác nhau.', false);
      return;
    }
    var from = 'r' + S.copyFrom, to = 'r' + S.copyTo, n = 0;
    $.each(D.modules, function (_, m) {
      $.each(m.quyen, function (_, p) {
        var fv = eff(from, p.key);
        var target = S.copyMode === 'over' ? fv : (fv || eff(to, p.key));
        if (target && p.restrict && S.copyTo === 2) return;
        if (target !== eff(to, p.key)) { setChange(to, p.key, target); n++; }
      });
    });
    delete S.hidden[S.copyTo];
    saveUiPrefs();
    closePops();
    refresh();
    toast(n ? 'Đã áp ' + n + ' thay đổi (chưa lưu).' : 'Hai vai trò đã giống nhau, không có gì thay đổi.');
  }

  /* ─────────── Lưu ─────────── */

  // Hộp xác nhận: dòng tổng (+thêm / −bỏ / số đối tượng), rồi 1 khối cho mỗi vai trò/người; trong khối gom theo
  // module (tên module làm tiêu đề nhỏ, không lặp lại ở từng dòng), mỗi quyền 1 dòng có dấu + / − rõ ràng.
  function openConfirm() {
    var bySubj = {}, order = [], adds = 0, removes = 0;
    $.each(Object.keys(S.changes), function (_, key) {
      var p = splitKey(key);
      var info = idx.perm[p.k] || { title: p.k, module: 'Khác' };
      if (!bySubj[p.subj]) { bySubj[p.subj] = { mods: {}, modOrder: [], add: 0, rem: 0 }; order.push(p.subj); }
      var g = bySubj[p.subj];
      if (!g.mods[info.module]) { g.mods[info.module] = []; g.modOrder.push(info.module); }
      g.mods[info.module].push({ title: info.title, add: !!S.changes[key] });
      if (S.changes[key]) { g.add++; adds++; } else { g.rem++; removes++; }
    });

    var html = '<div class="pq-diff-summary">' +
      (adds ? '<span class="badge bg-label-success">+' + adds + ' quyền được thêm</span>' : '') +
      (removes ? '<span class="badge bg-label-danger">−' + removes + ' quyền bị bỏ</span>' : '') +
      '<span class="text-muted small">cho ' + order.length + (order.length > 1 ? ' vai trò / người dùng' : ' đối tượng') + '</span></div>';

    html += $.map(order, function (subj) {
      var g = bySubj[subj];
      var id = subjId(subj);
      var isRole = isRoleSubj(subj);
      var name = isRole ? (idx.role[id] ? idx.role[id].ten : '') : (idx.user[id] ? idx.user[id].ten : '');
      var head = '<div class="pq-diff-head"><span class="pq-diff-name">' + esc(name) + '</span>' +
        '<span class="badge ' + (isRole ? 'bg-label-primary">Vai trò' : 'bg-label-info">Quyền riêng') + '</span>' +
        '<span class="pq-diff-count">' + (g.add ? '<span class="text-success">+' + g.add + '</span>' : '') +
        (g.add && g.rem ? ' · ' : '') + (g.rem ? '<span class="text-danger">−' + g.rem + '</span>' : '') + '</span></div>';
      var body = $.map(g.modOrder, function (mod) {
        var items = g.mods[mod].slice().sort(function (a, b) { return (b.add ? 1 : 0) - (a.add ? 1 : 0); });
        return '<div class="pq-diff-mod">' + esc(mod) + '</div><ul class="pq-diff-list">' + $.map(items, function (it) {
          return '<li class="' + (it.add ? 'is-add' : 'is-remove') + '"><span class="pq-diff-sign" aria-label="' + (it.add ? 'Thêm' : 'Bỏ') + '">' +
            (it.add ? '+' : '−') + '</span><span class="pq-diff-title">' + esc(it.title) + '</span>' +
            '<span class="pq-diff-act">' + (it.add ? 'Thêm' : 'Bỏ') + '</span></li>';
        }).join('') + '</ul>';
      }).join('');
      return '<div class="pq-diff-card">' + head + body + '</div>';
    }).join('');

    $('#pq-confirm-count').text(Object.keys(S.changes).length);
    $('#pq-confirm-body').html(html);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('pq-confirm-modal')).show();
  }

  function save() {
    var changes = $.map(Object.keys(S.changes), function (key) {
      var p = splitKey(key);
      return { loai: isRoleSubj(p.subj) ? 'role' : 'user', id: subjId(p.subj), quyen: p.k, cap: !!S.changes[key] };
    });
    var $btn = $('#pq-confirm-save').prop('disabled', true);
    call('POST', API, { changes: changes }, function (data) {
      $btn.prop('disabled', false);
      bootstrap.Modal.getOrCreateInstance(document.getElementById('pq-confirm-modal')).hide();
      S.changes = {};
      applyData(data);
      toast('Đã lưu ' + (data.saved || 0) + ' thay đổi phân quyền.');
    }, function () { $btn.prop('disabled', false); });
  }

  function applyData(data) {
    D = data;
    buildIndex();
    refresh();
    renderRoles();
  }

  /* ─────────── Tab Vai trò ─────────── */

  function renderRoles() {
    var html = $.map(D.roles, function (r) {
      var locked = r.loai !== 'thuong';
      var count = r.loai === 'admin' ? 'Tất cả' : Object.keys(idx.grant[r.rid] || {}).length;
      var name = locked || !canManage
        ? '<span class="fw-medium">' + esc(r.ten) + '</span>' + (locked ? ' <span class="badge bg-label-secondary border ms-1">' + (r.loai === 'auth' ? 'Vai trò hệ thống' : 'Toàn quyền, không sửa') + '</span>' : '')
        : '<input type="text" class="form-control form-control-sm pq-role-name" maxlength="64" data-rid="' + r.rid + '" data-old="' + esc(r.ten) + '" value="' + esc(r.ten) + '" style="max-width:340px">';
      return '<tr><td>' + name + '</td><td>' + (r.so_thanh_vien === null ? 'Mọi tài khoản' : r.so_thanh_vien) + '</td><td>' + count + '</td>' +
        '<td class="text-end"><button type="button" class="btn btn-sm btn-label-primary pq-role-view" data-rid="' + r.rid + '">Xem trên ma trận</button>' +
        (!locked && canManage ? ' <button type="button" class="btn btn-sm btn-label-danger pq-role-del" data-rid="' + r.rid + '">Xoá</button>' : '') + '</td></tr>';
    }).join('');
    $('#pq-role-tbody').html(html);
  }

  function confirmThen(title, text, run) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: title, text: text, icon: 'warning', showCancelButton: true, confirmButtonText: 'Xoá', cancelButtonText: 'Huỷ',
        customClass: { confirmButton: 'btn btn-danger me-2', cancelButton: 'btn btn-label-secondary' }, buttonsStyling: false
      }).then(function (r) { if (r.isConfirmed) run(); });
    } else if (window.confirm(title + '\n' + text)) {
      run();
    }
  }

  /* ─────────── Tab Lịch sử ─────────── */

  var HANH_DONG = {
    them_quyen: ['Thêm quyền', 'bg-label-success'],
    bo_quyen: ['Bỏ quyền', 'bg-label-danger'],
    tao_vai_tro: ['Tạo vai trò', 'bg-label-info'],
    doi_ten_vai_tro: ['Đổi tên vai trò', 'bg-label-secondary'],
    xoa_vai_tro: ['Xoá vai trò', 'bg-label-danger']
  };

  function loadHistory() {
    $('#pq-ls-tbody').html('<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>');
    $.ajax({
      url: API + '/lich-su', type: 'GET', dataType: 'json', data: { page: S.lsPage, keyword: S.lsQ },
      success: function (res) { renderHistory((res && res.data) || {}); },
      error: function (jqXHR) { $('#pq-ls-tbody').html('<tr><td colspan="5" class="text-center text-danger py-4">' + esc(apiMsg(jqXHR)) + '</td></tr>'); }
    });
  }

  function renderHistory(d) {
    var items = d.items || [];
    var html = $.map(items, function (h) {
      var hd = HANH_DONG[h.hanh_dong] || [h.hanh_dong, 'bg-label-secondary'];
      var what = h.ten_quyen ? esc(h.ten_quyen) + ' <span class="small text-muted">' + esc(h.quyen) + '</span>' : '';
      if (h.ghi_chu) what += (what ? '<br>' : '') + '<span class="small text-muted">' + esc(h.ghi_chu) + '</span>';
      return '<tr><td>' + esc(h.created) + '</td><td>' + esc(h.nguoi_thuc_hien) + '</td><td>' + esc(h.ten_doi_tuong) + '</td>' +
        '<td><span class="badge ' + hd[1] + '">' + hd[0] + '</span></td><td>' + (what || '—') + '</td></tr>';
    }).join('');
    $('#pq-ls-tbody').html(html || '<tr><td colspan="5" class="text-center text-muted py-4">Chưa có thay đổi nào</td></tr>');
    $('#pq-ls-info').text(d.total ? 'Trang ' + d.current_page + '/' + d.total_pages + ' · ' + d.total + ' dòng' : '');
    var pages = '';
    if (d.total_pages > 1) {
      pages += '<li class="page-item' + (d.current_page <= 1 ? ' disabled' : '') + '"><a class="page-link" href="#" data-page="' + (d.current_page - 1) + '"><i class="ti tabler-chevron-left"></i></a></li>';
      pages += '<li class="page-item active"><span class="page-link">' + d.current_page + '</span></li>';
      pages += '<li class="page-item' + (d.current_page >= d.total_pages ? ' disabled' : '') + '"><a class="page-link" href="#" data-page="' + (d.current_page + 1) + '"><i class="ti tabler-chevron-right"></i></a></li>';
    }
    $('#pq-ls-pages').html(pages);
  }

  /* ─────────── Sự kiện ─────────── */

  function switchTab(tab) {
    S.tab = tab;
    closePops();
    $('#pq-tabs .nav-link').each(function () { $(this).toggleClass('active', $(this).data('tab') === tab); });
    $('#pq-app .pq-panel').each(function () { $(this).toggleClass('d-none', $(this).data('panel') !== tab); });
    if (tab === 'vt') renderRoles();
    if (tab === 'ls') loadHistory();
  }

  function bind() {
    var qTimer = null;
    $('#pq-tabs').on('click', '.nav-link', function () { switchTab($(this).data('tab')); });

    $('#pq-q').on('input', function () {
      var v = this.value;
      clearTimeout(qTimer);
      qTimer = setTimeout(function () { S.q = v; renderBody(); }, 200);
    });
    $('#pq-only-changed').on('click', function () { S.onlyChanged = !S.onlyChanged; refresh(); });
    // Như tải lại trang: xoá ô tìm + bộ lọc, bỏ thay đổi chưa lưu (hỏi trước nếu có), tải lại dữ liệu từ server.
    $('#pq-btn-reset').on('click', function () {
      var n = Object.keys(S.changes).length;
      if (n && !window.confirm('Bỏ ' + n + ' thay đổi chưa lưu và tải lại dữ liệu?')) return;
      clearTimeout(qTimer);
      $('#pq-q').val('');
      S.q = '';
      S.onlyChanged = false;
      S.collapsed = {};
      S.changes = {};
      loadData();
    });
    $('#pq-toggle-groups').on('click', function () {
      var open = anyGroupOpen();
      S.collapsed = {};
      if (open) $.each(D.modules, function (_, m) { S.collapsed[m.id] = true; });
      renderBody();
    });

    var $tbody = $('#pq-tbody');
    $tbody.on('click', '.pq-group-toggle', function () {
      var m = $(this).data('m');
      S.collapsed[m] = !S.collapsed[m];
      renderBody();
    });
    $tbody.on('change', '.pq-cb', function () {
      setChange($(this).data('s'), String($(this).data('k')), this.checked);
      refresh();
    });
    // Bấm cả ô (không riêng checkbox) cũng tick — như màn ispace.
    $tbody.on('click', 'td.pq-cell', function (e) {
      if ($(e.target).is('input')) return;
      var $cb = $(this).find('.pq-cb');
      if (!$cb.length || $cb.prop('disabled')) return;
      $cb.prop('checked', !$cb.prop('checked')).trigger('change');
    });
    $tbody.on('click', '.pq-tri', function () {
      var subj = $(this).data('s'), mid = $(this).data('m'), all = $(this).data('all') === 1;
      $.each(D.modules, function (_, m) {
        if (m.id !== mid) return;
        $.each(m.quyen, function (_, p) {
          if (all) { setChange(subj, p.key, false); return; }
          if (inheritFrom(subj, p.key).length) return;
          if (p.restrict && subj === 'r2') return;
          setChange(subj, p.key, true);
        });
      });
      refresh();
    });

    $('#pq-thead').on('click', '.pq-col-remove', function () {
      var uid = parseInt($(this).data('uid'), 10);
      S.userCols = $.grep(S.userCols, function (x) { return x !== uid; });
      saveUiPrefs();
      renderMatrix();
    });
    $('#pq-col-chips').on('click', '.pq-col-chip', function () {
      var rid = $(this).data('rid');
      if (S.hidden[rid]) delete S.hidden[rid]; else S.hidden[rid] = true;
      saveUiPrefs();
      renderMatrix();
    });

    $('#pq-btn-add-user').on('click', function (e) {
      e.stopPropagation();
      var $pop = $('#pq-pop-user');
      var show = $pop.hasClass('d-none');
      closePops();
      if (show) { $pop.removeClass('d-none'); $('#pq-user-q').val(''); renderUserPick(); $('#pq-user-q').trigger('focus'); }
    });
    $('#pq-user-q').on('input', renderUserPick);
    $('#pq-user-list').on('click', '.pq-user-item', function () {
      S.userCols.push(parseInt($(this).data('uid'), 10));
      saveUiPrefs();
      closePops();
      renderMatrix();
    });

    $('#pq-btn-copy').on('click', function (e) {
      e.stopPropagation();
      var $pop = $('#pq-pop-copy');
      var show = $pop.hasClass('d-none');
      closePops();
      if (show) { renderCopyPop(); $pop.removeClass('d-none'); }
    });
    $('#pq-copy-from').on('click', 'button', function () { S.copyFrom = parseInt($(this).data('rid'), 10); renderCopyPop(); });
    $('#pq-copy-to').on('click', 'button', function () { S.copyTo = parseInt($(this).data('rid'), 10); renderCopyPop(); });
    $('#pq-copy-mode').on('click', 'button', function () { S.copyMode = $(this).data('mode'); renderCopyPop(); });
    $('#pq-copy-apply').on('click', applyCopy);
    $('#pq-app').on('click', '.pq-pop-close', closePops);
    // Gắn thẳng vào khung popover (không delegate): bấm chọn vai trò sẽ vẽ lại các nút bên trong, nút vừa bấm bị gỡ
    // khỏi trang nên delegate không còn nhận ra cú bấm nằm trong popover → click lan tới document và đóng popover.
    $('#pq-app .pq-pop').on('click', function (e) { e.stopPropagation(); });
    $(document).on('click', closePops);

    $('#pq-btn-discard').on('click', function () { S.changes = {}; refresh(); });
    $('#pq-btn-save').on('click', function () { if (Object.keys(S.changes).length) openConfirm(); });
    $('#pq-confirm-save').on('click', save);

    // Vai trò
    $('#pq-btn-add-role').on('click', function () {
      var ten = $.trim($('#pq-new-role').val());
      if (!ten) { $('#pq-new-role').trigger('focus'); return; }
      call('POST', API + '/vai-tro', { ten: ten }, function (data) {
        $('#pq-new-role').val('');
        applyData(data);
        toast('Đã tạo vai trò ' + ten + '.');
      });
    });
    $('#pq-new-role').on('keydown', function (e) { if (e.which === 13) { e.preventDefault(); $('#pq-btn-add-role').trigger('click'); } });
    $('#pq-role-tbody').on('keydown', '.pq-role-name', function (e) { if (e.which === 13) { e.preventDefault(); this.blur(); } });
    $('#pq-role-tbody').on('change', '.pq-role-name', function () {
      var $i = $(this), rid = $i.data('rid'), ten = $.trim($i.val());
      if (!ten || ten === $i.data('old')) { $i.val($i.data('old')); return; }
      call('PUT', API + '/vai-tro/' + rid, { ten: ten }, function (data) {
        applyData(data);
        toast('Đã đổi tên vai trò.');
      }, function () { $i.val($i.data('old')); });
    });
    $('#pq-role-tbody').on('click', '.pq-role-view', function () {
      delete S.hidden[$(this).data('rid')];
      saveUiPrefs();
      switchTab('mt');
      renderMatrix();
    });
    $('#pq-role-tbody').on('click', '.pq-role-del', function () {
      var r = idx.role[$(this).data('rid')];
      if (!r) return;
      confirmThen('Xoá vai trò ' + r.ten + '?', r.so_thanh_vien + ' tài khoản đang có vai trò này sẽ bị gỡ vai trò (và mất các quyền của nó).', function () {
        call('DELETE', API + '/vai-tro/' + r.rid, null, function (data) {
          applyData(data);
          toast('Đã xoá vai trò ' + r.ten + '.');
        });
      });
    });

    // Lịch sử
    $('#pq-ls-search').on('click', function () { S.lsQ = $.trim($('#pq-ls-q').val()); S.lsPage = 1; loadHistory(); });
    $('#pq-ls-q').on('keydown', function (e) { if (e.which === 13) { e.preventDefault(); $('#pq-ls-search').trigger('click'); } });
    $('#pq-ls-pages').on('click', 'a[data-page]', function (e) {
      e.preventDefault();
      if ($(this).parent().hasClass('disabled')) return;
      S.lsPage = parseInt($(this).data('page'), 10);
      loadHistory();
    });

    window.addEventListener('beforeunload', function (e) {
      if (Object.keys(S.changes).length) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  function start() {
    var settings = (Drupal.settings && Drupal.settings.phan_quyen) || {};
    canManage = !!(settings.permissions && settings.permissions.manage);
    if (!canManage) $('#pq-app .pq-manage-only').addClass('d-none');
    if (typeof Notyf !== 'undefined') notyf = new Notyf({ duration: 3000, position: { x: 'right', y: 'top' } });
    loadUiPrefs();
    bind();
    loadData();
  }

  function loadData() {
    var $btn = $('#pq-btn-reset').prop('disabled', true);
    $btn.find('i').addClass('pq-spin');
    loading(true);
    $.ajax({
      url: API, type: 'GET', dataType: 'json', cache: false,
      success: function (res) { applyData(res.data); },
      error: function (jqXHR) { $('#pq-tbody').html('<tr><td class="text-center text-danger py-4">' + esc(apiMsg(jqXHR)) + '</td></tr>'); },
      complete: function () {
        loading(false);
        $btn.prop('disabled', false).find('i').removeClass('pq-spin');
      }
    });
  }

  Drupal.behaviors.phanQuyen = {
    attach: function (context) {
      if (Drupal.behaviors.phanQuyen._done) return;
      $ = $ || pickJq();
      if (!$ || !$('#pq-app').length) return;
      Drupal.behaviors.phanQuyen._done = true;
      start();
    }
  };
})(Drupal);

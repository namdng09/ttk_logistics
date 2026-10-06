<?php

/**
 * @file
 * API màn /quan-ly-quy (nạp qua 'file' của hook_menu).
 *
 *   GET    /api/quan-ly-quy                     danh sách + số liệu theo kỳ, status_counts (theo loại quỹ), tong
 *   POST   /api/quan-ly-quy                     tạo quỹ
 *   GET    /api/quan-ly-quy/tuy-chon            loại quỹ, quỹ (cho chuyển tiền), người quản lý
 *   POST   /api/quan-ly-quy/chuyen-tien         chuyển tiền nội bộ (chặn khi quỹ chuyển không đủ)
 *   POST   /api/quan-ly-quy/giao-dich/{id}/huy  huỷ chuyển tiền / điều chỉnh
 *   GET    /api/quan-ly-quy/{id}                chi tiết (+ giao dịch nội bộ, lịch sử)
 *   PUT    /api/quan-ly-quy/{id}                sửa thông tin (không sửa số dư đầu kỳ)
 *   DELETE /api/quan-ly-quy/{id}                xoá mềm (chỉ khi số dư 0 và không còn phiếu chưa duyệt)
 *   GET    /api/quan-ly-quy/{id}/so-quy         sổ quỹ theo kỳ, phân trang
 *   GET    /api/quan-ly-quy/{id}/so-du?ngay=    số dư theo sổ cuối ngày
 *   POST   /api/quan-ly-quy/{id}/dieu-chinh     điều chỉnh số dư (kiểm quỹ)
 */

/* ---------------------------------------------------------------------------
 * Phản hồi / quyền
 * ------------------------------------------------------------------------- */

function _quan_ly_tai_chinh_input() {
  return api_request_input();
}
function _quan_ly_tai_chinh_success($data = NULL) {
  return api_response_success($data);
}
function _quan_ly_tai_chinh_fail($message) {
  return api_response_fail($message);
}
function _quan_ly_tai_chinh_not_found($message) {
  return api_response_not_found($message);
}
function _quan_ly_tai_chinh_unauthorized($message) {
  return api_response_denied($message);
}
function _quan_ly_tai_chinh_method_not_allowed($allowed) {
  return api_response_method_not_allowed($allowed);
}
function _quan_ly_tai_chinh_error($message) {
  return api_response_error($message);
}

/**
 * Đọc quỹ qua API: người xem/quản lý quỹ, và người trả lương/tạm ứng lái xe (màn Lương lái xe chọn quỹ chi). NULL = được phép.
 */
function _quan_ly_tai_chinh_quy_read_denied() {
  foreach (array('quan_ly_tai_chinh_view', 'quan ly tai chinh', 'luong_lai_xe_pay', 'luong_lai_xe_create') as $perm) {
    if (api_has_permission($perm)) {
      return NULL;
    }
  }
  return api_response_denied('Bạn không có quyền xem quỹ');
}

function _quan_ly_tai_chinh_manage_denied($message) {
  return quan_ly_tai_chinh_manage_access() ? NULL : api_response_denied($message);
}

/* ---------------------------------------------------------------------------
 * Định dạng dữ liệu trả về
 * ------------------------------------------------------------------------- */

/** Kỳ lọc từ tu_ngay/den_ngay (dd/mm/yyyy), mặc định tháng hiện tại. */
function _quan_ly_tai_chinh_api_period() {
  $tu = isset($_GET['tu_ngay']) ? trim((string) $_GET['tu_ngay']) : '';
  $den = isset($_GET['den_ngay']) ? trim((string) $_GET['den_ngay']) : '';
  $ok = '/^\d{1,2}\/\d{1,2}\/\d{4}$/';
  $from = preg_match($ok, $tu) ? quan_ly_tai_chinh_parse_date($tu, TRUE) : strtotime(date('Y-m-01 00:00:00', REQUEST_TIME));
  $to = preg_match($ok, $den) ? quan_ly_tai_chinh_parse_date($den, FALSE) : strtotime(date('Y-m-t 23:59:59', REQUEST_TIME));
  if ($from > $to) {
    list($from, $to) = array(strtotime(date('Y-m-d 00:00:00', $to)), strtotime(date('Y-m-d 23:59:59', $from)));
  }
  return array('from' => $from, 'to' => $to, 'tu_ngay' => date('d/m/Y', $from), 'den_ngay' => date('d/m/Y', $to));
}

function _quan_ly_tai_chinh_api_item($quy, array $period = NULL, $with_blockers = FALSE) {
  $item = array(
    'nid' => intval($quy->nid_quy),
    'ma_quy' => (string) $quy->ma_quy,
    'ten_quy' => (string) $quy->ten_quy,
    'loai_quy' => (string) $quy->loai_quy,
    'loai_label' => quan_ly_tai_chinh_loai_quy_label($quy->loai_quy),
    'ghi_chu' => (string) $quy->ghi_chu,
    'so_du_dau_ky' => round($quy->so_du_dau_ky),
    'so_du_hien_tai' => round(quan_ly_tai_chinh_quy_balance(intval($quy->nid_quy))),
    'nguoi_quan_ly' => $quy->uid_nguoi_quan_ly ? array('uid' => intval($quy->uid_nguoi_quan_ly), 'ten' => quan_ly_tai_chinh_user_display_name($quy->uid_nguoi_quan_ly)) : NULL,
    'created' => $quy->created ? date('Y-m-d H:i:s', $quy->created) : '',
    'changed' => $quy->changed ? date('Y-m-d H:i:s', $quy->changed) : '',
    'hanh_dong' => quan_ly_tai_chinh_quy_actions($quy, $with_blockers),
  );
  if ($period) {
    $s = quan_ly_tai_chinh_quy_period_summary(intval($quy->nid_quy), $period['from'], $period['to']);
    foreach ($s as $k => $v) {
      $s[$k] = round($v);
    }
    $item['ky'] = $s;
  }
  return $item;
}

/** Nhãn nguồn phiếu thu chi theo ref_type (sổ quỹ). */
function _quan_ly_tai_chinh_phieu_source_label($ref_type) {
  $map = array(
    'cong_no_khach_hang' => 'Công nợ khách hàng',
    'de_nghi_thanh_toan' => 'Đề nghị thanh toán',
    'llx_thanh_toan_luong' => 'Lương lái xe',
    'bcllx_thanh_toan_luong_lai_xe' => 'Lương lái xe',
    'bcllx_tam_ung_lai_xe' => 'Ứng tiền lái xe',
  );
  $ref_type = trim((string) $ref_type);
  return isset($map[$ref_type]) ? $map[$ref_type] : 'Thu chi';
}

/** Giao dịch nội bộ (chuyển quỹ / điều chỉnh) → mảng API. $quy_names: nid => tên. */
function _quan_ly_tai_chinh_api_giao_dich($gd, array $quy_names) {
  $so_tien = round(quan_ly_tai_chinh_money_to_number($gd->so_tien));
  $active = intval($gd->status) === 1;
  $row = array(
    'gd_id' => intval($gd->gd_id),
    'ma' => (string) $gd->ma_giao_dich,
    'loai' => (string) $gd->loai_giao_dich,
    'loai_label' => $gd->loai_giao_dich === 'chuyen_quy' ? 'Chuyển quỹ' : 'Điều chỉnh số dư',
    'ngay' => $gd->ngay_giao_dich ? date('d/m/Y', $gd->ngay_giao_dich) : '',
    'so_tien' => $so_tien,
    'quy_chuyen' => isset($quy_names[intval($gd->nid_quy)]) ? $quy_names[intval($gd->nid_quy)] : '',
    'quy_nhan' => isset($quy_names[intval($gd->nid_quy_nhan)]) ? $quy_names[intval($gd->nid_quy_nhan)] : '',
    'nid_quy' => intval($gd->nid_quy),
    'nid_quy_nhan' => intval($gd->nid_quy_nhan),
    'dien_giai' => (string) $gd->dien_giai,
    'nguoi_tao' => quan_ly_tai_chinh_user_display_name($gd->uid),
    'tao_luc' => $gd->created ? date('d/m/Y H:i', $gd->created) : '',
    'da_huy' => !$active,
    'co_the_huy' => FALSE,
  );
  if ($active && quan_ly_tai_chinh_manage_access()) {
    $reason = quan_ly_tai_chinh_giao_dich_cancel_blocker($gd);
    $row['co_the_huy'] = $reason === '';
    $row['ly_do_khong_huy'] = $reason;
  }
  return $row;
}

function _quan_ly_tai_chinh_quy_names() {
  $names = array();
  foreach (db_query("SELECT nid, ten_quy FROM {qltc_quy}") as $r) {
    $names[intval($r->nid)] = (string) $r->ten_quy;
  }
  return $names;
}

/* ---------------------------------------------------------------------------
 * Danh sách / tạo
 * ------------------------------------------------------------------------- */

function quan_ly_tai_chinh_quy_rest_collection() {
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
      return _quan_ly_tai_chinh_quy_rest_list();
    case 'POST':
      return _quan_ly_tai_chinh_quy_rest_save(0);
    default:
      return _quan_ly_tai_chinh_method_not_allowed('GET, POST');
  }
}

/**
 * Danh sách quỹ: ít bản ghi nên lọc ở PHP. Số liệu kỳ (đầu kỳ, thu, chi, chuyển, điều chỉnh, cuối kỳ) từ sổ cái. status_counts theo
 * loại quỹ (trên cùng bộ lọc từ khoá), tong = số dư hiện tại theo loại + tổng các cột của kỳ (không theo tab).
 */
function _quan_ly_tai_chinh_quy_rest_list() {
  if ($deny = _quan_ly_tai_chinh_quy_read_denied()) {
    return $deny;
  }
  $period = _quan_ly_tai_chinh_api_period();
  $keyword = isset($_GET['keyword']) ? drupal_strtolower(trim((string) $_GET['keyword'])) : '';
  $loai = isset($_GET['loai_quy']) ? trim((string) $_GET['loai_quy']) : '';

  $loai_options = quan_ly_tai_chinh_loai_quy_options();
  $counts = array('all' => 0);
  foreach ($loai_options as $k => $label) {
    $counts[$k] = 0;
  }
  $tong = array('so_du_hien_tai' => 0, 'theo_loai' => array(), 'dau_ky' => 0, 'thu' => 0, 'chi' => 0, 'chuyen_den' => 0, 'chuyen_di' => 0, 'dieu_chinh' => 0, 'cuoi_ky' => 0);
  foreach ($loai_options as $k => $label) {
    $tong['theo_loai'][$k] = 0;
  }

  $rows = array();
  foreach (quan_ly_tai_chinh_quy_get_all(TRUE) as $quy) {
    if ($keyword !== '' && strpos(drupal_strtolower($quy->ma_quy . ' ' . $quy->ten_quy . ' ' . $quy->ghi_chu), $keyword) === FALSE) {
      continue;
    }
    $item = _quan_ly_tai_chinh_api_item($quy, $period);
    $counts['all']++;
    if (isset($counts[$item['loai_quy']])) {
      $counts[$item['loai_quy']]++;
    }
    $tong['so_du_hien_tai'] += $item['so_du_hien_tai'];
    if (isset($tong['theo_loai'][$item['loai_quy']])) {
      $tong['theo_loai'][$item['loai_quy']] += $item['so_du_hien_tai'];
    }
    foreach (array('dau_ky', 'thu', 'chi', 'chuyen_den', 'chuyen_di', 'dieu_chinh', 'cuoi_ky') as $k) {
      $tong[$k] += $item['ky'][$k];
    }
    if ($loai === '' || $item['loai_quy'] === $loai) {
      $rows[] = $item;
    }
  }

  $page = api_page_number();
  $limit = api_page_limit(20, 100);
  $total = count($rows);
  $pages = $total ? (int) ceil($total / $limit) : 0;
  if ($pages && $page > $pages) {
    $page = $pages;
  }
  $result = api_page_result(array_slice($rows, ($page - 1) * $limit, $limit), $total, $page, $limit);
  $result['status_counts'] = $counts;
  $result['tong'] = $tong;
  $result['ky'] = array('tu_ngay' => $period['tu_ngay'], 'den_ngay' => $period['den_ngay']);
  return _quan_ly_tai_chinh_success($result);
}

/**
 * Tạo ($id = 0) / sửa quỹ. Số dư đầu kỳ chỉ nhận khi tạo; muốn khớp lại số dư thì dùng Điều chỉnh số dư.
 */
function _quan_ly_tai_chinh_quy_rest_save($id) {
  if ($deny = _quan_ly_tai_chinh_manage_denied($id ? 'Bạn không có quyền sửa quỹ' : 'Bạn không có quyền tạo quỹ')) {
    return $deny;
  }
  global $user;
  $input = _quan_ly_tai_chinh_input();
  $ma = isset($input['ma_quy']) ? trim((string) $input['ma_quy']) : '';
  $ten = isset($input['ten_quy']) ? trim((string) $input['ten_quy']) : '';
  $loai = isset($input['loai_quy']) ? trim((string) $input['loai_quy']) : 'tien_mat';
  $ghi_chu = isset($input['ghi_chu']) ? trim((string) $input['ghi_chu']) : '';
  $uid_ql = isset($input['uid_nguoi_quan_ly']) ? intval($input['uid_nguoi_quan_ly']) : 0;

  if ($ma === '' || mb_strlen($ma) > 64) {
    return _quan_ly_tai_chinh_fail('Vui lòng nhập mã quỹ (tối đa 64 ký tự).');
  }
  if ($ten === '' || mb_strlen($ten) > 255) {
    return _quan_ly_tai_chinh_fail('Vui lòng nhập tên quỹ (tối đa 255 ký tự).');
  }
  if (!array_key_exists($loai, quan_ly_tai_chinh_loai_quy_options())) {
    return _quan_ly_tai_chinh_fail('Loại quỹ không hợp lệ.');
  }
  if (quan_ly_tai_chinh_quy_find_nid_by_ma($ma, $id)) {
    return _quan_ly_tai_chinh_fail('Mã quỹ đã tồn tại, vui lòng nhập mã khác.');
  }
  if ($uid_ql && !db_query("SELECT 1 FROM {users} WHERE uid = :u AND status = 1", array(':u' => $uid_ql))->fetchField()) {
    return _quan_ly_tai_chinh_fail('Người quản lý quỹ không hợp lệ.');
  }

  if ($id) {
    $quy = quan_ly_tai_chinh_quy_load($id);
    if (!$quy || intval($quy->hoat_dong) !== 1) {
      return _quan_ly_tai_chinh_not_found('Không tìm thấy quỹ');
    }
    $json = quan_ly_tai_chinh_quy_node_get_json_data($quy);
    $json['ten_quy'] = $ten;
    $json['loai_quy'] = $loai;
    $json['ghi_chu'] = $ghi_chu;
    if (intval($quy->uid_nguoi_quan_ly) !== $uid_ql) {
      $json['lich_su_nguoi_quan_ly'][] = array('time' => REQUEST_TIME, 'uid_cu' => intval($quy->uid_nguoi_quan_ly), 'uid_moi' => $uid_ql, 'uid_thuc_hien' => intval($user->uid));
    }
    db_update('qltc_quy')->fields(array(
      'ma_quy' => $ma,
      'ten_quy' => $ten,
      'loai_quy' => $loai,
      'ghi_chu' => $ghi_chu,
      'thong_tin_json' => quan_ly_tai_chinh_json_encode($json),
      'uid_nguoi_quan_ly' => $uid_ql,
      'uid' => intval($user->uid),
      'changed' => REQUEST_TIME,
    ))->condition('nid', $id)->execute();
  }
  else {
    $so_du = round(quan_ly_tai_chinh_money_to_number(isset($input['so_du_dau_ky']) ? $input['so_du_dau_ky'] : 0));
    if ($so_du < 0) {
      return _quan_ly_tai_chinh_fail('Số dư đầu kỳ không được âm.');
    }
    $id = intval(db_insert('qltc_quy')->fields(array(
      'ma_quy' => $ma,
      'ten_quy' => $ten,
      'loai_quy' => $loai,
      'ghi_chu' => $ghi_chu,
      'thong_tin_json' => quan_ly_tai_chinh_json_encode(array('ten_quy' => $ten, 'loai_quy' => $loai, 'ghi_chu' => $ghi_chu)),
      'so_du_dau_ky' => $so_du,
      'so_du_hien_tai' => $so_du,
      'uid_nguoi_quan_ly' => $uid_ql,
      'uid' => intval($user->uid),
      'status' => 0,
      'hoat_dong' => 1,
      'created' => REQUEST_TIME,
      'changed' => REQUEST_TIME,
    ))->execute());
    quan_ly_tai_chinh_rebuild_quy_balance($id, FALSE);
  }
  return _quan_ly_tai_chinh_success(_quan_ly_tai_chinh_api_item(quan_ly_tai_chinh_quy_load($id), _quan_ly_tai_chinh_api_period(), TRUE));
}

/* ---------------------------------------------------------------------------
 * 1 quỹ
 * ------------------------------------------------------------------------- */

function quan_ly_tai_chinh_quy_rest_item($id) {
  $id = intval($id);
  if (!$id) {
    return _quan_ly_tai_chinh_fail('ID không hợp lệ');
  }
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
      return _quan_ly_tai_chinh_quy_rest_get($id);
    case 'PUT':
      return _quan_ly_tai_chinh_quy_rest_save($id);
    case 'DELETE':
      return _quan_ly_tai_chinh_quy_rest_delete($id);
    case 'POST':
      // Tương thích đường cũ POST /api/quan-ly-quy/{id}?action=adjust.
      if (isset($_GET['action']) && $_GET['action'] === 'adjust') {
        return quan_ly_tai_chinh_quy_rest_adjust($id);
      }
      return _quan_ly_tai_chinh_method_not_allowed('GET, PUT, DELETE');
    default:
      return _quan_ly_tai_chinh_method_not_allowed('GET, PUT, DELETE');
  }
}

/**
 * Chi tiết quỹ: thông tin + số liệu kỳ + giao dịch nội bộ (chuyển quỹ/điều chỉnh, kể cả đã huỷ, mới nhất trước, tối đa 200)
 * + lịch sử người quản lý + lịch sử điều chỉnh số dư đầu kỳ kiểu cũ (chỉ để xem).
 */
function _quan_ly_tai_chinh_quy_rest_get($id) {
  if ($deny = _quan_ly_tai_chinh_quy_read_denied()) {
    return $deny;
  }
  $quy = quan_ly_tai_chinh_quy_load($id);
  if (!$quy || intval($quy->hoat_dong) !== 1) {
    return _quan_ly_tai_chinh_not_found('Không tìm thấy quỹ');
  }
  $data = _quan_ly_tai_chinh_api_item($quy, _quan_ly_tai_chinh_api_period(), TRUE);
  $data['so_du_dau_ky_goc'] = round($quy->so_du_dau_ky);

  $names = _quan_ly_tai_chinh_quy_names();
  $data['giao_dich_noi_bo'] = array();
  $q = db_query_range("SELECT * FROM {qltc_giao_dich} WHERE loai_giao_dich IN ('chuyen_quy', 'dieu_chinh') AND ref_type <> 'phieu_thu_chi'
    AND (nid_quy = :q OR nid_quy_nhan = :q) ORDER BY ngay_giao_dich DESC, gd_id DESC", 0, 200, array(':q' => $id));
  foreach ($q as $gd) {
    $data['giao_dich_noi_bo'][] = _quan_ly_tai_chinh_api_giao_dich($gd, $names);
  }

  $json = quan_ly_tai_chinh_quy_node_get_json_data($quy);
  $data['lich_su_nguoi_quan_ly'] = array();
  $list = !empty($json['lich_su_nguoi_quan_ly']) && is_array($json['lich_su_nguoi_quan_ly']) ? $json['lich_su_nguoi_quan_ly'] : array();
  usort($list, 'quan_ly_tai_chinh_quy_history_sort_desc');
  foreach ($list as $h) {
    $t = quan_ly_tai_chinh_quy_history_time($h);
    $data['lich_su_nguoi_quan_ly'][] = array(
      'thoi_gian' => $t ? date('d/m/Y H:i', $t) : '',
      'tu' => !empty($h['uid_cu']) ? quan_ly_tai_chinh_user_display_name($h['uid_cu']) : '—',
      'den' => !empty($h['uid_moi']) ? quan_ly_tai_chinh_user_display_name($h['uid_moi']) : '—',
      'nguoi' => quan_ly_tai_chinh_user_display_name(isset($h['uid_thuc_hien']) ? $h['uid_thuc_hien'] : 0),
    );
  }
  $data['lich_su_dieu_chinh_cu'] = array();
  $list = !empty($json['lich_su_dieu_chinh_so_du']) && is_array($json['lich_su_dieu_chinh_so_du']) ? $json['lich_su_dieu_chinh_so_du'] : array();
  usort($list, 'quan_ly_tai_chinh_quy_history_sort_desc');
  foreach ($list as $h) {
    $t = quan_ly_tai_chinh_quy_history_time($h);
    $cu = quan_ly_tai_chinh_money_to_number(isset($h['so_du_cu']) ? $h['so_du_cu'] : 0);
    $moi = quan_ly_tai_chinh_money_to_number(isset($h['so_du_moi']) ? $h['so_du_moi'] : 0);
    $data['lich_su_dieu_chinh_cu'][] = array(
      'thoi_gian' => $t ? date('d/m/Y H:i', $t) : (isset($h['ngay_dieu_chinh_text']) ? $h['ngay_dieu_chinh_text'] : ''),
      'so_du_cu' => round($cu),
      'so_du_moi' => round($moi),
      'chenh_lech' => round($moi - $cu),
      'ly_do' => isset($h['ly_do']) ? (string) $h['ly_do'] : '',
      'nguoi' => quan_ly_tai_chinh_user_display_name(isset($h['nguoi_thuc_hien']) ? $h['nguoi_thuc_hien'] : 0),
    );
  }
  return _quan_ly_tai_chinh_success($data);
}

function _quan_ly_tai_chinh_quy_rest_delete($id) {
  if ($deny = _quan_ly_tai_chinh_manage_denied('Bạn không có quyền xoá quỹ')) {
    return $deny;
  }
  $quy = quan_ly_tai_chinh_quy_load($id);
  if (!$quy || intval($quy->hoat_dong) !== 1) {
    return _quan_ly_tai_chinh_not_found('Không tìm thấy quỹ');
  }
  if ($reason = quan_ly_tai_chinh_quy_delete_blocker($quy)) {
    return _quan_ly_tai_chinh_fail($reason);
  }
  db_update('qltc_quy')->fields(array('hoat_dong' => 0, 'changed' => REQUEST_TIME))->condition('nid', $id)->execute();
  return _quan_ly_tai_chinh_success(array('nid' => $id, 'deleted' => TRUE, 'message' => 'Đã xoá quỹ ' . $quy->ten_quy . '.'));
}

/**
 * Sổ quỹ theo kỳ (tăng dần theo ngày, phân trang): dòng nào cũng có chứng từ, nguồn, diễn giải, thu/chi, số dư sau. Kèm đầu kỳ,
 * tổng thu/chi trong kỳ, cuối kỳ (tính trên cả kỳ, không theo trang).
 */
function quan_ly_tai_chinh_quy_rest_ledger($id) {
  if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    return _quan_ly_tai_chinh_method_not_allowed('GET');
  }
  if ($deny = _quan_ly_tai_chinh_quy_read_denied()) {
    return $deny;
  }
  $id = intval($id);
  $quy = $id ? quan_ly_tai_chinh_quy_load($id) : NULL;
  if (!$quy) {
    return _quan_ly_tai_chinh_not_found('Không tìm thấy quỹ');
  }
  quan_ly_tai_chinh_ensure_so_cai_quy_table();
  $period = _quan_ly_tai_chinh_api_period();
  $args = array(':q' => $id, ':f' => $period['from'], ':t' => $period['to']);
  $where = "nid_quy = :q AND status = 1 AND ngay_giao_dich >= :f AND ngay_giao_dich <= :t";
  $sum = db_query("SELECT COUNT(*) AS n, COALESCE(SUM(CASE WHEN bien_dong > 0 THEN bien_dong ELSE 0 END), 0) AS thu,
      COALESCE(SUM(CASE WHEN bien_dong < 0 THEN -bien_dong ELSE 0 END), 0) AS chi FROM {qltc_so_cai_quy} WHERE $where", $args)->fetchObject();
  $dau_ky = round(quan_ly_tai_chinh_quy_balance($id, $period['from'] - 1));

  $page = api_page_number();
  $limit = api_page_limit(50, 200);
  $total = intval($sum->n);
  $pages = $total ? (int) ceil($total / $limit) : 0;
  if ($pages && $page > $pages) {
    $page = $pages;
  }
  $rows = db_query_range("SELECT * FROM {qltc_so_cai_quy} WHERE $where ORDER BY ngay_giao_dich ASC, id ASC", ($page - 1) * $limit, $limit, $args)->fetchAll();

  // Nạp nguồn 1 lần cho cả trang: phiếu thu chi (ref_type, nội dung) và giao dịch nội bộ (loại, quỹ đối ứng, diễn giải).
  $phieu_ids = $gd_ids = array();
  foreach ($rows as $r) {
    if ($r->source_type === 'phieu_thu_chi' && $r->nid_phieu) $phieu_ids[] = intval($r->nid_phieu);
    elseif ($r->source_type === 'qltc_giao_dich') $gd_ids[] = intval($r->source_id);
  }
  $phieus = $gds = array();
  if ($phieu_ids && db_table_exists('qltc_phieu_thu_chi')) {
    foreach (db_query("SELECT nid, ref_type, chi_tiet_json, thong_tin_json FROM {qltc_phieu_thu_chi} WHERE nid IN (:ids)", array(':ids' => $phieu_ids)) as $p) {
      $phieus[intval($p->nid)] = $p;
    }
  }
  if ($gd_ids) {
    foreach (db_query("SELECT * FROM {qltc_giao_dich} WHERE gd_id IN (:ids)", array(':ids' => $gd_ids)) as $g) {
      $gds[intval($g->gd_id)] = $g;
    }
  }
  $names = _quan_ly_tai_chinh_quy_names();

  $items = array();
  foreach ($rows as $r) {
    $delta = round(quan_ly_tai_chinh_money_to_number($r->bien_dong));
    $nguon = 'Khác';
    $dien_giai = (string) $r->ghi_chu;
    if ($r->source_type === 'phieu_thu_chi') {
      $p = isset($phieus[intval($r->nid_phieu)]) ? $phieus[intval($r->nid_phieu)] : NULL;
      $nguon = _quan_ly_tai_chinh_phieu_source_label($p ? $p->ref_type : '');
      if ($p) {
        $lines = quan_ly_tai_chinh_json_decode((string) $p->chi_tiet_json);
        $texts = array();
        foreach ($lines as $l) {
          if (!empty($l['noi_dung'])) $texts[] = is_scalar($l['noi_dung']) ? (string) $l['noi_dung'] : '';
        }
        $texts = array_values(array_filter($texts));
        $dien_giai = $texts ? $texts[0] . (count($texts) > 1 ? ' (+' . (count($texts) - 1) . ' dòng)' : '') : '';
        $info = quan_ly_tai_chinh_json_decode((string) $p->thong_tin_json);
        if (!empty($info['ghi_chu']) && is_scalar($info['ghi_chu'])) $dien_giai .= ($dien_giai !== '' ? ' — ' : '') . $info['ghi_chu'];
      }
    }
    elseif ($r->source_type === 'qltc_giao_dich') {
      $g = isset($gds[intval($r->source_id)]) ? $gds[intval($r->source_id)] : NULL;
      if ($g && $g->loai_giao_dich === 'chuyen_quy') {
        $nguon = 'Chuyển quỹ';
        $other = $r->loai_bien_dong === 'chuyen_di' ? intval($g->nid_quy_nhan) : intval($g->nid_quy);
        $dien_giai = ($r->loai_bien_dong === 'chuyen_di' ? 'Chuyển sang ' : 'Nhận từ ') . (isset($names[$other]) ? $names[$other] : '#' . $other) . ($g->dien_giai !== '' ? ' — ' . $g->dien_giai : '');
      }
      elseif ($g && $g->loai_giao_dich === 'dieu_chinh') {
        $nguon = 'Điều chỉnh';
        $dien_giai = (string) $g->dien_giai;
      }
      else {
        $nguon = 'Giao dịch cũ';
      }
    }
    $items[] = array(
      'id' => intval($r->id),
      'ngay' => $r->ngay_giao_dich ? date('d/m/Y', $r->ngay_giao_dich) : '',
      'ma_chung_tu' => (string) $r->ma_chung_tu,
      'nguon' => $nguon,
      'loai_bien_dong' => (string) $r->loai_bien_dong,
      'dien_giai' => $dien_giai,
      'thu' => $delta > 0 ? $delta : 0,
      'chi' => $delta < 0 ? -$delta : 0,
      'so_du_sau' => round(quan_ly_tai_chinh_money_to_number($r->so_du_sau)),
      'nguoi' => quan_ly_tai_chinh_user_display_name($r->uid_thuc_hien),
      'nid_phieu' => $r->source_type === 'phieu_thu_chi' ? intval($r->nid_phieu) : 0,
    );
  }
  $result = api_page_result($items, $total, $page, $limit);
  $result['dau_ky'] = $dau_ky;
  $result['thu'] = round($sum->thu);
  $result['chi'] = round($sum->chi);
  $result['cuoi_ky'] = round($dau_ky + $sum->thu - $sum->chi);
  $result['ky'] = array('tu_ngay' => $period['tu_ngay'], 'den_ngay' => $period['den_ngay']);
  return _quan_ly_tai_chinh_success($result);
}

/** Số dư theo sổ cuối ngày `ngay` (dd/mm/yyyy, mặc định hôm nay) — modal Điều chỉnh hiển thị để so với số thực tế. */
function quan_ly_tai_chinh_quy_rest_balance_at($id) {
  if ($deny = _quan_ly_tai_chinh_quy_read_denied()) {
    return $deny;
  }
  $id = intval($id);
  if (!$id || !quan_ly_tai_chinh_quy_load($id)) {
    return _quan_ly_tai_chinh_not_found('Không tìm thấy quỹ');
  }
  $ngay = isset($_GET['ngay']) && preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}$/', $_GET['ngay']) ? $_GET['ngay'] : date('d/m/Y', REQUEST_TIME);
  return _quan_ly_tai_chinh_success(array('ngay' => $ngay, 'so_du' => round(quan_ly_tai_chinh_quy_balance($id, quan_ly_tai_chinh_parse_date($ngay, FALSE)))));
}

/* ---------------------------------------------------------------------------
 * Chuyển tiền / điều chỉnh / huỷ / tuỳ chọn
 * ------------------------------------------------------------------------- */

function quan_ly_tai_chinh_quy_rest_transfer() {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    return _quan_ly_tai_chinh_method_not_allowed('POST');
  }
  if ($deny = _quan_ly_tai_chinh_manage_denied('Bạn không có quyền chuyển tiền nội bộ.')) {
    return $deny;
  }
  $in = _quan_ly_tai_chinh_input();
  $result = quan_ly_tai_chinh_transfer_create(
    isset($in['nid_quy']) ? $in['nid_quy'] : 0,
    isset($in['nid_quy_nhan']) ? $in['nid_quy_nhan'] : 0,
    isset($in['so_tien']) ? $in['so_tien'] : 0,
    isset($in['ngay_giao_dich']) ? $in['ngay_giao_dich'] : date('d/m/Y', REQUEST_TIME),
    isset($in['dien_giai']) ? $in['dien_giai'] : ''
  );
  if (is_string($result)) {
    return _quan_ly_tai_chinh_fail($result);
  }
  $gd = quan_ly_tai_chinh_giao_dich_load($result['gd_id']);
  $data = _quan_ly_tai_chinh_api_giao_dich($gd, _quan_ly_tai_chinh_quy_names());
  $data['message'] = 'Đã chuyển ' . quan_ly_tai_chinh_format_money($data['so_tien']) . ' đ từ ' . $data['quy_chuyen'] . ' sang ' . $data['quy_nhan'] . ' (' . $data['ma'] . ').';
  return _quan_ly_tai_chinh_success($data);
}

function quan_ly_tai_chinh_quy_rest_adjust($id) {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    return _quan_ly_tai_chinh_method_not_allowed('POST');
  }
  if ($deny = _quan_ly_tai_chinh_manage_denied('Bạn không có quyền điều chỉnh quỹ')) {
    return $deny;
  }
  $in = _quan_ly_tai_chinh_input();
  // so_du_moi: tên trường của bản cũ (giờ hiểu là số dư thực tế).
  $thuc_te = isset($in['so_du_thuc_te']) ? $in['so_du_thuc_te'] : (isset($in['so_du_moi']) ? $in['so_du_moi'] : NULL);
  if ($thuc_te === NULL || trim((string) $thuc_te) === '') {
    return _quan_ly_tai_chinh_fail('Vui lòng nhập số dư thực tế.');
  }
  $result = quan_ly_tai_chinh_adjust_create(intval($id), $thuc_te, isset($in['ngay_dieu_chinh']) ? $in['ngay_dieu_chinh'] : date('d/m/Y', REQUEST_TIME), isset($in['ly_do']) ? $in['ly_do'] : '');
  if (is_string($result)) {
    return _quan_ly_tai_chinh_fail($result);
  }
  $data = _quan_ly_tai_chinh_api_item(quan_ly_tai_chinh_quy_load(intval($id)), _quan_ly_tai_chinh_api_period(), TRUE);
  $data['message'] = 'Đã điều chỉnh số dư: ' . ($result['chenh_lech'] > 0 ? '+' : '') . quan_ly_tai_chinh_format_money($result['chenh_lech']) . ' đ.';
  return _quan_ly_tai_chinh_success($data);
}

function quan_ly_tai_chinh_quy_rest_cancel($gd_id) {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    return _quan_ly_tai_chinh_method_not_allowed('POST');
  }
  if ($deny = _quan_ly_tai_chinh_manage_denied('Bạn không có quyền huỷ giao dịch quỹ')) {
    return $deny;
  }
  $in = _quan_ly_tai_chinh_input();
  if ($error = quan_ly_tai_chinh_giao_dich_cancel(intval($gd_id), isset($in['ly_do']) ? $in['ly_do'] : '')) {
    return _quan_ly_tai_chinh_fail($error);
  }
  $gd = quan_ly_tai_chinh_giao_dich_load(intval($gd_id));
  $data = _quan_ly_tai_chinh_api_giao_dich($gd, _quan_ly_tai_chinh_quy_names());
  $data['message'] = 'Đã huỷ ' . $data['ma'] . '.';
  return _quan_ly_tai_chinh_success($data);
}

/** Tuỳ chọn cho bộ lọc / modal: loại quỹ, quỹ đang hoạt động (kèm số dư — chọn quỹ chuyển), người quản lý. */
function quan_ly_tai_chinh_quy_rest_options() {
  if ($deny = _quan_ly_tai_chinh_quy_read_denied()) {
    return $deny;
  }
  $loai = array();
  foreach (quan_ly_tai_chinh_loai_quy_options() as $k => $label) {
    $loai[] = array('id' => $k, 'ten' => $label);
  }
  $quy = array();
  foreach (quan_ly_tai_chinh_quy_get_all(TRUE) as $q) {
    $quy[] = array('id' => intval($q->nid_quy), 'ten' => $q->ten_quy, 'ma' => $q->ma_quy, 'loai' => $q->loai_quy, 'so_du' => round(quan_ly_tai_chinh_quy_balance(intval($q->nid_quy))));
  }
  $users = array();
  $sql = db_field_exists('users', 'ten')
    ? "SELECT uid, name, ten FROM {users} WHERE uid > 0 AND status = 1 ORDER BY name ASC"
    : "SELECT uid, name, '' AS ten FROM {users} WHERE uid > 0 AND status = 1 ORDER BY name ASC";
  foreach (db_query_range($sql, 0, 2000) as $u) {
    $users[] = array('id' => intval($u->uid), 'ten' => trim((string) $u->ten) !== '' ? trim((string) $u->ten) . ' (' . $u->name . ')' : (string) $u->name);
  }
  return _quan_ly_tai_chinh_success(array('loai_quy' => $loai, 'quy' => $quy, 'nguoi_quan_ly' => $users));
}

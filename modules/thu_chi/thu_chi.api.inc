<?php

/**
 * @file
 * REST API cho màn /thu-chi (hybrid: template rỗng + JS gọi API). Lõi nghiệp vụ nằm trong thu_chi.module và được giữ
 * nguyên tên để các module khác gọi: thu_chi_giao_dich_save_values(), thu_chi_approve_giao_dich(), thu_chi_request_adjustment(),
 * thu_chi_approve_adjustment(), thu_chi_ajax_delete() — API chỉ kiểm tra quyền + thao tác hợp lệ rồi gọi xuống.
 *
 *   GET    /api/thu-chi              danh sách (lọc, phân trang, đếm theo trạng thái, tổng thu/chi đã duyệt)
 *   POST   /api/thu-chi              tạo phiếu
 *   GET    /api/thu-chi/tuy-chon     dữ liệu ô chọn (quỹ, phân loại, khách hàng, NCC, người đề xuất, gợi ý nội dung)
 *   GET    /api/thu-chi/{id}         chi tiết
 *   PUT    /api/thu-chi/{id}         sửa
 *   DELETE /api/thu-chi/{id}         xoá (mềm)
 *   POST   /api/thu-chi/{id}/{thao-tac}  duyet | khong-duyet | yeu-cau-dieu-chinh | duyet-dieu-chinh | tu-choi-dieu-chinh
 *
 * Quyền: xem = thu_chi_access() (thu_chi_view hoặc quản lý); ghi = thu_chi_manage_access() ('quan ly thu chi').
 */

function thu_chi_api_collection() {
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
      return _thu_chi_api_list();
    case 'POST':
      return _thu_chi_api_save(0);
    default:
      return api_response_method_not_allowed('GET, POST');
  }
}

function thu_chi_api_item($id) {
  $id = intval($id);
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
      return _thu_chi_api_get($id);
    case 'PUT':
      return _thu_chi_api_save($id);
    case 'DELETE':
      return _thu_chi_api_delete($id);
    default:
      return api_response_method_not_allowed('GET, PUT, DELETE');
  }
}

/* ---------------------------------------------------------------------------
 * Thao tác hợp lệ — một nguồn duy nhất (giao diện chỉ hiện các mục này, API kiểm tra lại bằng đúng hàm này)
 * ------------------------------------------------------------------------- */

/**
 * Thao tác của 1 phiếu theo trạng thái duyệt (luồng giữ như cũ):
 *   Chờ duyệt: sửa, duyệt, không duyệt, xoá · Không duyệt: sửa, duyệt, xoá · Đã duyệt: yêu cầu điều chỉnh (khi chưa đóng phiếu)
 *   Yêu cầu điều chỉnh: duyệt điều chỉnh, từ chối điều chỉnh · Duyệt điều chỉnh: sửa (lưu xong về Chờ duyệt), xoá.
 * Phiếu đã duyệt không đổi thẳng sang "Không duyệt" — muốn sửa phải yêu cầu điều chỉnh.
 * Phiếu do module khác quản lý (thu công nợ…) hoặc người chỉ có quyền xem: không có thao tác.
 */
function _thu_chi_actions($item) {
  if (!$item || thu_chi_locked_reason($item) || !thu_chi_manage_access()) {
    return array();
  }
  $map = array(
    'sua' => 'Sửa phiếu',
    'duyet' => 'Duyệt phiếu',
    'khong_duyet' => 'Không duyệt',
    'yeu_cau_dieu_chinh' => 'Yêu cầu điều chỉnh',
    'duyet_dieu_chinh' => 'Duyệt điều chỉnh',
    'tu_choi_dieu_chinh' => 'Từ chối điều chỉnh',
    'xoa' => 'Xoá phiếu',
  );
  $status = isset($item->duyet_status) ? $item->duyet_status : 'cho_duyet';
  // Phiếu tạm ứng / trả lương lái xe: chỉ duyệt / không duyệt khi đang chờ duyệt (thu_chi_edit_locked_reason()).
  if (thu_chi_edit_locked_reason($item)) {
    $actions = array();
    if ($status === 'cho_duyet') {
      $actions[] = array('action' => 'duyet', 'label' => $map['duyet']);
      $actions[] = array('action' => 'khong_duyet', 'label' => $map['khong_duyet']);
    }
    return $actions;
  }
  $keys = array();
  switch ($status) {
    case 'cho_duyet':
      $keys = array('sua', 'duyet', 'khong_duyet', 'xoa');
      break;
    case 'khong_duyet':
      $keys = array('sua', 'duyet', 'xoa');
      break;
    case 'da_duyet':
      if (thu_chi_can_request_adjust($item)) $keys = array('yeu_cau_dieu_chinh');
      break;
    case 'yeu_cau_dieu_chinh':
      if (empty($item->dong_phieu)) $keys = array('duyet_dieu_chinh', 'tu_choi_dieu_chinh');
      break;
    case 'duyet_dieu_chinh':
      $keys = array('sua', 'xoa');
      break;
  }
  $actions = array();
  foreach ($keys as $key) $actions[] = array('action' => $key, 'label' => $map[$key]);
  return $actions;
}

function _thu_chi_action_allowed($item, $action) {
  foreach (_thu_chi_actions($item) as $a) {
    if ($a['action'] === $action) return TRUE;
  }
  return FALSE;
}

/** Nhãn nguồn của phiếu do module khác tạo (theo ref_type). Rỗng = phiếu tạo tay ở Thu chi. */
function _thu_chi_source_label($ref_type) {
  $map = array(
    'cong_no_khach_hang' => 'Công nợ khách hàng',
    'de_nghi_thanh_toan' => 'Đề nghị thanh toán',
    'bcllx_tam_ung_lai_xe' => 'Ứng tiền lái xe',
    'llx_thanh_toan_luong' => 'Thanh toán lương lái xe',
    'bcllx_thanh_toan_luong_lai_xe' => 'Thanh toán lương lái xe',
    'bcllx_tam_ung_khau_tru' => 'Khấu trừ tạm ứng lương',
  );
  $ref_type = trim((string) $ref_type);
  return isset($map[$ref_type]) ? $map[$ref_type] : ($ref_type !== '' ? $ref_type : '');
}

/* ---------------------------------------------------------------------------
 * Dữ liệu trả về
 * ------------------------------------------------------------------------- */

function _thu_chi_api_quy_labels() {
  $labels = &drupal_static(__FUNCTION__);
  if ($labels === NULL) $labels = thu_chi_quy_options(FALSE);
  return $labels;
}

/** 1 phiếu ⇒ mảng JSON. $full: kèm chi tiết từng dòng + lịch sử trạng thái. */
function _thu_chi_api_item($item, $full = FALSE) {
  $quy = _thu_chi_api_quy_labels();
  $phan_loai = thu_chi_selected_danh_muc_options($item->loai_giao_dich_ids);
  $phan_loai_id = $phan_loai ? (int) key($phan_loai) : 0;
  $json = is_array($item->json) ? $item->json : array();
  $locked = thu_chi_locked_reason($item);
  $data = array(
    'nid' => (int) $item->gd_id,
    'ma_giao_dich' => (string) $item->ma_giao_dich,
    'loai_phieu' => (string) $item->loai_phieu,
    'loai_phieu_label' => thu_chi_loai_label($item->loai_phieu),
    'phan_loai' => $phan_loai_id ? array('nid' => $phan_loai_id, 'ten' => (string) reset($phan_loai)) : NULL,
    'nid_quy' => (int) $item->nid_quy,
    'quy' => isset($quy[$item->nid_quy]) ? $quy[$item->nid_quy] : ($item->nid_quy ? '#' . (int) $item->nid_quy : ''),
    'so_tien' => (float) thu_chi_money_to_number($item->so_tien),
    'ngay_giao_dich' => $item->ngay_giao_dich ? date('Y-m-d', (int) $item->ngay_giao_dich) : '',
    'thang_luong' => (string) $item->thang_luong,
    'khach_hang' => $item->nid_khach_hang ? array('nid' => (int) $item->nid_khach_hang, 'ten' => thu_chi_khach_hang_label((int) $item->nid_khach_hang)) : NULL,
    'nha_cung_cap' => $item->nid_nha_cung_cap ? array('nid' => (int) $item->nid_nha_cung_cap, 'ten' => thu_chi_khach_hang_label((int) $item->nid_nha_cung_cap)) : NULL,
    'nguoi_de_xuat' => array('uid' => (int) $item->uid_nguoi_de_xuat, 'ten' => thu_chi_user_label_by_uid($item->uid_nguoi_de_xuat)),
    'noi_dung_tom_tat' => thu_chi_detail_summary($item),
    'ghi_chu' => isset($json['ghi_chu']) ? (string) $json['ghi_chu'] : '',
    'duyet_status' => (string) $item->duyet_status,
    'duyet_label' => thu_chi_duyet_label($item->duyet_status),
    'nguon' => array('ref_type' => (string) $item->ref_type, 'label' => _thu_chi_source_label($item->ref_type)),
    'khoa' => $locked,
    'khoa_sua' => $locked ? '' : thu_chi_edit_locked_reason($item),
    'hanh_dong' => _thu_chi_actions($item),
    'created' => $item->created ? date('Y-m-d H:i:s', (int) $item->created) : '',
    'changed' => $item->changed ? date('Y-m-d H:i:s', (int) $item->changed) : '',
  );
  if ($full) {
    $rows = array();
    foreach ((array) $item->chi_tiet as $row) {
      if (!is_array($row)) continue;
      $rows[] = array(
        'noi_dung' => thu_chi_normalize_noi_dung_nid(isset($row['noi_dung']) ? $row['noi_dung'] : ''),
        'don_vi_tinh' => isset($row['don_vi_tinh']) ? (string) $row['don_vi_tinh'] : '',
        'so_luong' => isset($row['so_luong']) ? (float) $row['so_luong'] : 1,
        'don_gia' => isset($row['don_gia']) ? (float) thu_chi_money_to_number($row['don_gia']) : 0,
        'vat' => isset($row['vat']) ? (float) $row['vat'] : 0,
        'thanh_tien' => isset($row['thanh_tien']) ? (float) thu_chi_money_to_number($row['thanh_tien']) : 0,
      );
    }
    $data['chi_tiet'] = $rows;
    $history = array();
    foreach ((array) (isset($json['lich_su_trang_thai_phieu']) ? $json['lich_su_trang_thai_phieu'] : array()) as $h) {
      if (!is_array($h)) continue;
      $history[] = array(
        'thoi_gian' => isset($h['time_text']) ? (string) $h['time_text'] : (!empty($h['time']) ? date('d/m/Y H:i:s', (int) $h['time']) : ''),
        'nguoi' => isset($h['nguoi_cap_nhat']) ? (string) $h['nguoi_cap_nhat'] : '',
        'tu' => isset($h['tu_trang_thai']) ? (string) $h['tu_trang_thai'] : '',
        'den' => isset($h['den_trang_thai']) ? (string) $h['den_trang_thai'] : '',
        'ghi_chu' => isset($h['ghi_chu']) ? (string) $h['ghi_chu'] : '',
      );
    }
    $data['lich_su'] = $history;
    $data['phan_bo_cong_no'] = !empty($json['phan_bo_phieu_tra_khach_hang']) && is_array($json['phan_bo_phieu_tra_khach_hang']) ? array_values($json['phan_bo_phieu_tra_khach_hang']) : array();
  }
  return $data;
}

/* ---------------------------------------------------------------------------
 * Danh sách
 * ------------------------------------------------------------------------- */

/** Áp các bộ lọc chung (trừ trạng thái duyệt) lên query qltc_phieu_thu_chi alias p. */
function _thu_chi_api_apply_filters(SelectQuery $query) {
  $query->condition('p.hoat_dong', 1);
  if (!empty($_GET['loai_phieu']) && in_array($_GET['loai_phieu'], array('thu', 'chi'), TRUE)) {
    $query->condition('p.loai_phieu', $_GET['loai_phieu']);
  }
  if (!empty($_GET['nid_quy'])) {
    $query->condition('p.nid_quy', intval($_GET['nid_quy']));
  }
  if (!empty($_GET['nid_phan_loai'])) {
    // loai_giao_dich_json là mảng nid (vd [12]) — khớp đúng phần tử, không khớp nhầm 1 với 12.
    $id = intval($_GET['nid_phan_loai']);
    $query->condition(db_or()
      ->condition('p.loai_giao_dich_json', '[' . $id . ']')
      ->condition('p.loai_giao_dich_json', '[' . $id . ',%', 'LIKE')
      ->condition('p.loai_giao_dich_json', '%,' . $id . ']', 'LIKE')
      ->condition('p.loai_giao_dich_json', '%,' . $id . ',%', 'LIKE'));
  }
  if (!empty($_GET['tu_ngay'])) {
    $from = thu_chi_parse_date($_GET['tu_ngay'], TRUE);
    if ($from) $query->condition('p.ngay_giao_dich', $from, '>=');
  }
  if (!empty($_GET['den_ngay'])) {
    $to = thu_chi_parse_date($_GET['den_ngay'], FALSE);
    if ($to) $query->condition('p.ngay_giao_dich', $to, '<=');
  }
  $keyword = isset($_GET['keyword']) ? trim((string) $_GET['keyword']) : '';
  if ($keyword !== '') {
    $like = '%' . db_like($keyword) . '%';
    $query->condition(db_or()->condition('p.ma_giao_dich', $like, 'LIKE')->condition('p.chi_tiet_json', $like, 'LIKE'));
  }
}

function _thu_chi_api_list() {
  if (!thu_chi_access()) return api_response_denied('Bạn không có quyền xem thu chi');
  $paging = api_page_params(20, 100);
  $page = $paging['page'];
  $limit = $paging['limit'];
  $offset = $paging['offset'];

  // Đếm theo trạng thái (cho tab) + tổng thu/chi đang tính vào quỹ, trên cùng bộ lọc khác — trước khi lọc theo tab.
  $counts = array('all' => 0);
  foreach (thu_chi_duyet_options() as $k => $v) $counts[$k] = 0;
  $q = db_select('qltc_phieu_thu_chi', 'p');
  _thu_chi_api_apply_filters($q);
  $q->addField('p', 'duyet_status');
  $q->addExpression('COUNT(*)', 'so_luong');
  $q->groupBy('p.duyet_status');
  foreach ($q->execute() as $r) {
    $counts[(string) $r->duyet_status] = (int) $r->so_luong;
    $counts['all'] += (int) $r->so_luong;
  }
  $totals = array('thu' => 0, 'chi' => 0);
  $q = db_select('qltc_phieu_thu_chi', 'p');
  _thu_chi_api_apply_filters($q);
  $q->condition('p.duyet_status', array('da_duyet', 'yeu_cau_dieu_chinh'), 'IN');
  $q->addField('p', 'loai_phieu');
  $q->addExpression('SUM(p.so_tien)', 'tong');
  $q->groupBy('p.loai_phieu');
  foreach ($q->execute() as $r) {
    if (isset($totals[$r->loai_phieu])) $totals[$r->loai_phieu] = (float) $r->tong;
  }

  $query = db_select('qltc_phieu_thu_chi', 'p')->fields('p');
  _thu_chi_api_apply_filters($query);
  $tab = isset($_GET['duyet_status']) ? trim((string) $_GET['duyet_status']) : '';
  if ($tab !== '' && $tab !== 'all') $query->condition('p.duyet_status', $tab);
  $count = clone $query;
  $total = (int) $count->countQuery()->execute()->fetchField();
  $rows = $query->orderBy('p.ngay_giao_dich', 'DESC')->orderBy('p.nid', 'DESC')->range($offset, $limit)->execute()->fetchAll();
  $items = array();
  foreach ($rows as $row) $items[] = _thu_chi_api_item(thu_chi_node_to_item($row));

  $result = api_page_result($items, $total, $page, $limit);
  $result['status_counts'] = $counts;
  $result['tong'] = array('thu' => $totals['thu'], 'chi' => $totals['chi'], 'chenh_lech' => $totals['thu'] - $totals['chi']);
  return api_response_success($result);
}

function _thu_chi_api_get($id) {
  if (!thu_chi_access()) return api_response_denied('Bạn không có quyền xem thu chi');
  $item = thu_chi_giao_dich_load($id);
  if (!$item || !intval($item->status)) return api_response_not_found('Phiếu thu chi không tồn tại');
  return api_response_success(_thu_chi_api_item($item, TRUE));
}

/* ---------------------------------------------------------------------------
 * Tạo / sửa / xoá / thao tác
 * ------------------------------------------------------------------------- */

/**
 * Tạo (id = 0) hoặc sửa phiếu. Body JSON: loai_phieu, nid_phan_loai (hoặc phan_loai_ten để tạo phân loại mới), nid_quy,
 * ngay_giao_dich (d/m/Y), uid_nguoi_de_xuat, nid_khach_hang, nid_nha_cung_cap, ghi_chu,
 * chi_tiet: [{noi_dung, don_vi_tinh, so_luong, don_gia, vat}]. Sửa thì giữ nguồn / nhóm / tháng hạch toán của phiếu cũ.
 */
function _thu_chi_api_save($id) {
  if (!thu_chi_manage_access()) return api_response_denied('Bạn không có quyền tạo / sửa phiếu thu chi');
  $old = NULL;
  if ($id) {
    $old = thu_chi_giao_dich_load($id);
    if (!$old || !intval($old->status)) return api_response_not_found('Phiếu thu chi không tồn tại');
    if ($locked = thu_chi_locked_reason($old)) return api_response_fail($locked);
    if (!_thu_chi_action_allowed($old, 'sua')) return api_response_fail('Trạng thái phiếu hiện tại không cho phép sửa. Phiếu đã duyệt phải yêu cầu điều chỉnh trước.');
  }
  $input = api_request_input();
  $phan_loai = !empty($input['nid_phan_loai']) ? intval($input['nid_phan_loai']) : (isset($input['phan_loai_ten']) ? trim((string) $input['phan_loai_ten']) : '');
  $ngay = isset($input['ngay_giao_dich']) ? trim((string) $input['ngay_giao_dich']) : date('d/m/Y');
  $ts = thu_chi_parse_date($ngay);
  $values = array(
    'loai_phieu' => isset($input['loai_phieu']) ? (string) $input['loai_phieu'] : '',
    'loai_giao_dich' => $phan_loai !== '' && $phan_loai !== 0 ? array($phan_loai) : array(),
    'nid_quy' => isset($input['nid_quy']) ? intval($input['nid_quy']) : 0,
    'ngay_giao_dich' => $ngay,
    'thang_luong' => $old ? (string) $old->thang_luong : ($ts ? date('Ym', $ts) : date('Ym')),
    'uid_nguoi_de_xuat' => isset($input['uid_nguoi_de_xuat']) ? intval($input['uid_nguoi_de_xuat']) : 0,
    'nid_khach_hang' => isset($input['nid_khach_hang']) ? intval($input['nid_khach_hang']) : 0,
    'nid_nha_cung_cap' => isset($input['nid_nha_cung_cap']) ? intval($input['nid_nha_cung_cap']) : 0,
    'ghi_chu' => isset($input['ghi_chu']) ? (string) $input['ghi_chu'] : '',
    'chi_tiet' => isset($input['chi_tiet']) && is_array($input['chi_tiet']) ? $input['chi_tiet'] : array(),
  );
  if ($old) {
    // Tháng hạch toán đi theo ngày phiếu (đổi ngày thì đổi tháng).
    if ($ts) $values['thang_luong'] = date('Ym', $ts);
  }
  if (!$values['loai_giao_dich']) return api_response_fail('Vui lòng chọn phân loại phiếu.');

  $transaction = db_transaction();
  try {
    $result = thu_chi_giao_dich_save_values($values, $id);
    if (empty($result['success'])) {
      $transaction->rollback();
      return api_response_fail(!empty($result['message']) ? $result['message'] : 'Không lưu được phiếu');
    }
  }
  catch (Exception $e) {
    $transaction->rollback();
    watchdog('thu_chi', 'Lỗi lưu phiếu thu chi: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    return api_response_error('Lỗi hệ thống khi lưu phiếu thu chi');
  }
  return api_response_success(_thu_chi_api_item(thu_chi_giao_dich_load((int) $result['gd_id'], TRUE), TRUE));
}

function _thu_chi_api_delete($id) {
  if (!thu_chi_manage_access()) return api_response_denied('Bạn không có quyền xoá phiếu thu chi');
  $item = thu_chi_giao_dich_load($id);
  if (!$item || !intval($item->status)) return api_response_not_found('Phiếu thu chi không tồn tại');
  if ($locked = thu_chi_locked_reason($item)) return api_response_fail($locked);
  if (!_thu_chi_action_allowed($item, 'xoa')) return api_response_fail('Trạng thái phiếu hiện tại không cho phép xoá.');
  $result = thu_chi_ajax_delete($id);
  return !empty($result['success']) ? api_response_success(array('nid' => $id, 'deleted' => TRUE, 'message' => $result['message'])) : api_response_fail($result['message']);
}

/** POST /api/thu-chi/{id}/{thao-tac}. */
function thu_chi_api_action($id, $action) {
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') return api_response_method_not_allowed('POST');
  if (!thu_chi_manage_access()) return api_response_denied('Bạn không có quyền duyệt phiếu thu chi');
  $id = intval($id);
  $action = str_replace('-', '_', (string) $action);
  $item = thu_chi_giao_dich_load($id);
  if (!$item || !intval($item->status)) return api_response_not_found('Phiếu thu chi không tồn tại');
  if ($locked = thu_chi_locked_reason($item)) return api_response_fail($locked);
  if (!_thu_chi_action_allowed($item, $action)) return api_response_fail('Trạng thái phiếu hiện tại không cho phép thao tác này.');
  switch ($action) {
    case 'duyet':
      $result = thu_chi_approve_giao_dich($id, 'duyet');
      break;
    case 'khong_duyet':
      $result = thu_chi_approve_giao_dich($id, 'khong_duyet');
      break;
    case 'yeu_cau_dieu_chinh':
      $result = thu_chi_request_adjustment($id);
      break;
    case 'duyet_dieu_chinh':
      $result = thu_chi_approve_adjustment($id, 'duyet');
      break;
    case 'tu_choi_dieu_chinh':
      $result = thu_chi_approve_adjustment($id, 'khong_duyet');
      break;
    default:
      return api_response_not_found('Thao tác không tồn tại');
  }
  if (empty($result['success'])) return api_response_fail(!empty($result['message']) ? $result['message'] : 'Không thực hiện được thao tác');
  $data = _thu_chi_api_item(thu_chi_giao_dich_load($id, TRUE), TRUE);
  $data['message'] = $result['message'];
  return api_response_success($data);
}

/* ---------------------------------------------------------------------------
 * Ô chọn
 * ------------------------------------------------------------------------- */

function thu_chi_api_options() {
  if ($_SERVER['REQUEST_METHOD'] !== 'GET') return api_response_method_not_allowed('GET');
  if (!thu_chi_access()) return api_response_denied('Bạn không có quyền xem thu chi');
  $quy = array();
  if (function_exists('quan_ly_tai_chinh_quy_get_all')) {
    foreach (quan_ly_tai_chinh_quy_get_all(TRUE) as $q) {
      $quy[] = array('id' => (int) $q->nid_quy, 'ten' => $q->ten_quy . ($q->ma_quy ? ' (' . $q->ma_quy . ')' : ''), 'loai' => isset($q->loai_quy) ? (string) $q->loai_quy : '');
    }
  }
  $pairs = function (array $map) {
    $out = array();
    foreach ($map as $id => $ten) $out[] = array('id' => (int) $id, 'ten' => (string) $ten);
    return $out;
  };
  return api_response_success(array(
    'quy' => $quy,
    'phan_loai' => $pairs(thu_chi_category_options()),
    'khach_hang' => $pairs(thu_chi_khach_hang_options()),
    'nha_cung_cap' => $pairs(thu_chi_nha_cung_cap_options()),
    'nguoi_de_xuat' => $pairs(thu_chi_user_options()),
    'noi_dung' => thu_chi_noi_dung_options(),
    'loai_phieu' => array(array('id' => 'thu', 'ten' => 'Phiếu thu'), array('id' => 'chi', 'ten' => 'Phiếu chi')),
    'trang_thai' => array_map(function ($k, $v) { return array('id' => $k, 'ten' => $v); }, array_keys(thu_chi_duyet_options()), thu_chi_duyet_options()),
    'quyen' => array('quan_ly' => thu_chi_manage_access()),
  ));
}

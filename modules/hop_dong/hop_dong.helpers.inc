<?php

/**
 * @file
 * Helper functions cho module hop_dong.
 */

define('HOP_DONG_HTTP_OK', 200);
define('HOP_DONG_HTTP_BAD_REQUEST', 400);
define('HOP_DONG_HTTP_UNAUTHORIZED', 401);
define('HOP_DONG_HTTP_METHOD_NOT_ALLOWED', 405);
define('HOP_DONG_HTTP_INTERNAL_ERROR', 500);

define('HOP_DONG_BUNDLE', 'hop_dong');
define('HOP_DONG_DEFAULT_LIMIT', 20);
define('HOP_DONG_MAX_LIMIT', 500);

function hop_dong_get_params() {
  $params = array();
  foreach ($_GET as $key => $value) { $params[$key] = $value; }
  $raw = file_get_contents('php://input');
  if ($raw !== '') {
    $decoded = json_decode($raw, TRUE);
    if (is_array($decoded)) { $params = array_merge($params, $decoded); }
  }
  foreach ($_POST as $key => $value) { $params[$key] = $value; }
  return $params;
}

function hop_dong_require_auth($params) {
  $email = isset($params['created_email']) ? trim($params['created_email']) : '';
  $token = isset($params['token']) ? trim($params['token']) : '';
  if ($email === '' || $token === '') {
    hop_dong_respond_unauthorized('Thiếu thông tin xác thực');
  }
  module_load_include('module', 'user_login_api', 'user_login_api');
  if (!function_exists('api_check_token')) {
    hop_dong_respond_unauthorized('Hệ thống xác thực chưa được bật');
  }
  $result = api_check_token($token, $email);
  if ($result === FALSE) {
    hop_dong_respond_unauthorized('Token không hợp lệ');
  }
  return $result;
}

function hop_dong_field_value($node, $field_name, $default = '') {
  if (isset($node->{$field_name}[LANGUAGE_NONE][0]['value']) && $node->{$field_name}[LANGUAGE_NONE][0]['value'] !== '') {
    return $node->{$field_name}[LANGUAGE_NONE][0]['value'];
  }
  return $default;
}

function hop_dong_decode_json($value) {
  if (empty($value)) { return array(); }
  $decoded = json_decode($value, TRUE);
  return is_array($decoded) ? $decoded : array();
}

function hop_dong_encode_json_value($value) {
  if (is_string($value) && $value !== '') {
    $decoded = json_decode($value, TRUE);
    if (is_array($decoded)) { return $value; }
  }
  if (is_array($value)) { return drupal_json_encode($value); }
  return '';
}

function hop_dong_parse_active($value) {
  if ($value === NULL || $value === '') { return 1; }
  $text = drupal_strtolower(trim((string) $value));
  if ($text === '0' || $text === 'false' || $text === 'không' || $text === 'khong' || $text === 'inactive') { return 0; }
  return 1;
}

function hop_dong_node_is_active($entity) {
  if (isset($entity->hoat_dong)) { return intval($entity->hoat_dong) === 1; }
  if (isset($entity->field_hoat_dong[LANGUAGE_NONE][0]['value'])) { return intval($entity->field_hoat_dong[LANGUAGE_NONE][0]['value']) === 1; }
  return TRUE;
}

function hop_dong_format_row($row, $btb_map = array()) {
  $info = isset($row->thong_tin_json) ? hop_dong_decode_json($row->thong_tin_json) : array();
  $nid_kh = isset($info['nid_ben_thu_ba']) ? intval($info['nid_ben_thu_ba']) : 0;
  $nid_nvkd = isset($info['nid_nhan_vien_kinh_doanh']) ? intval($info['nid_nhan_vien_kinh_doanh']) : 0;
  return array(
    'nid' => intval($row->nid),
    'title' => (string) $row->title,
    'field_thong_tin_json' => $info,
    'field_hoat_dong' => isset($row->hoat_dong) ? intval($row->hoat_dong) : 1,
    'created' => isset($row->created) ? intval($row->created) : 0,
    'changed' => isset($row->changed) ? intval($row->changed) : 0,
    'khach_hang' => $nid_kh > 0 && isset($btb_map[$nid_kh]) ? $btb_map[$nid_kh] : NULL,
    'nhan_vien_kinh_doanh' => $nid_nvkd > 0 && isset($btb_map[$nid_nvkd]) ? $btb_map[$nid_nvkd] : NULL,
  );
}

function hop_dong_format_node($node) {
  $info = hop_dong_decode_json(hop_dong_field_value($node, 'field_thong_tin_json', ''));
  $btb_map = array();
  $nid_kh = isset($info['nid_ben_thu_ba']) ? intval($info['nid_ben_thu_ba']) : 0;
  $nid_nvkd = isset($info['nid_nhan_vien_kinh_doanh']) ? intval($info['nid_nhan_vien_kinh_doanh']) : 0;
  $nids = array();
  if ($nid_kh > 0) { $nids[] = $nid_kh; }
  if ($nid_nvkd > 0) { $nids[] = $nid_nvkd; }
  if (!empty($nids)) { $btb_map = hop_dong_load_ben_thu_ba_map($nids); }

  return array(
    'nid' => intval($node->nid),
    'title' => (string) $node->title,
    'field_thong_tin_json' => $info,
    'field_hoat_dong' => isset($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) ? intval($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) : 1,
    'created' => !empty($node->created) ? intval($node->created) : 0,
    'changed' => !empty($node->changed) ? intval($node->changed) : 0,
    'khach_hang' => $nid_kh > 0 && isset($btb_map[$nid_kh]) ? $btb_map[$nid_kh] : NULL,
    'nhan_vien_kinh_doanh' => $nid_nvkd > 0 && isset($btb_map[$nid_nvkd]) ? $btb_map[$nid_nvkd] : NULL,
  );
}

function hop_dong_build_list_query($params) {
  $query = db_select('node', 'n');
  $query->condition('n.type', HOP_DONG_BUNDLE, '=');
  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  $keyword = isset($params['keyword']) ? trim((string) $params['keyword']) : '';
  if ($keyword !== '') {
    $or = db_or();
    $or->condition('n.title', '%' . db_like($keyword) . '%', 'LIKE');
    $or->condition('ftj.field_thong_tin_json_value', '%' . db_like($keyword) . '%', 'LIKE');
    $query->condition($or);
  }

  if (isset($params['field_hoat_dong']) && $params['field_hoat_dong'] !== '' && $params['field_hoat_dong'] !== 'all') {
    $query->condition('fhd.field_hoat_dong_value', hop_dong_parse_active($params['field_hoat_dong']), '=');
  }
  elseif (!isset($params['include_inactive']) || !$params['include_inactive']) {
    $or = db_or();
    $or->condition('fhd.field_hoat_dong_value', 1, '=');
    $or->isNull('fhd.field_hoat_dong_value');
    $query->condition($or);
  }

  return $query;
}

function hop_dong_apply_sort(&$query, $params) {
  $sort_by = isset($params['sort_by']) ? trim((string) $params['sort_by']) : 'title';
  $sort_dir = isset($params['sort_dir']) ? strtoupper(trim((string) $params['sort_dir'])) : 'ASC';
  if ($sort_dir !== 'ASC' && $sort_dir !== 'DESC') { $sort_dir = 'ASC'; }

  $map = array(
    'nid' => 'n.nid',
    'title' => 'n.title',
    'created' => 'n.created',
    'changed' => 'n.changed',
    'field_hoat_dong' => 'fhd.field_hoat_dong_value',
  );

  $query->orderBy(isset($map[$sort_by]) ? $map[$sort_by] : 'n.title', $sort_dir);
  if ($sort_by !== 'nid') { $query->orderBy('n.nid', 'ASC'); }
}

function hop_dong_title_exists($title, $exclude_nid = 0) {
  $query = db_select('node', 'n');
  $query->fields('n', array('nid'));
  $query->condition('n.type', HOP_DONG_BUNDLE, '=');
  $query->condition('n.title', $title, '=');
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  $or = db_or();
  $or->condition('fhd.field_hoat_dong_value', 1, '=');
  $or->isNull('fhd.field_hoat_dong_value');
  $query->condition($or);

  if ($exclude_nid > 0) {
    $query->condition('n.nid', $exclude_nid, '!=');
  }
  $query->range(0, 1);
  return (bool) $query->execute()->fetchField();
}

/**
 * Load thông tin bên thứ 3 (khách hàng / NVKD) theo danh sách nid.
 *
 * Trả về map [nid => {nid, title, phan_loai, info từ field_thong_tin_json}].
 *
 * @param array $nids
 * @return array
 */
function hop_dong_load_ben_thu_ba_map($nids) {
  $result = array();
  $nids = array_filter(array_map('intval', (array) $nids), function ($n) { return $n > 0; });
  $nids = array_unique($nids);
  if (empty($nids)) { return $result; }

  $q = db_select('node', 'n');
  $q->condition('n.type', 'ben_thu_ba', '=');
  $q->condition('n.nid', $nids, 'IN');
  $q->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $q->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $q->leftJoin('field_data_field_phan_loai', 'fpl', "n.nid = fpl.entity_id AND fpl.entity_type = 'node' AND fpl.deleted = 0");
  $q->addField('n', 'nid', 'nid');
  $q->addField('n', 'title', 'title');
  $q->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $q->addField('fpl', 'field_phan_loai_value', 'phan_loai');

  $or = db_or();
  $or->condition('fhd.field_hoat_dong_value', 1, '=');
  $or->isNull('fhd.field_hoat_dong_value');
  $q->condition($or);

  $rows = $q->execute()->fetchAll();
  foreach ($rows as $r) {
    $json = hop_dong_decode_json($r->thong_tin_json);
    $result[intval($r->nid)] = array(
      'nid' => intval($r->nid),
      'title' => (string) $r->title,
      'phan_loai' => isset($r->phan_loai) ? (string) $r->phan_loai : '',
      'ten_gan_gon' => isset($json['ten_gan_gon']) ? (string) $json['ten_gan_gon'] : '',
      'so_dien_thoai' => isset($json['so_dien_thoai']) ? (string) $json['so_dien_thoai'] : '',
      'ma_so_thue_cccd' => isset($json['ma_so_thue_cccd']) ? (string) $json['ma_so_thue_cccd'] : '',
      'dia_chi' => isset($json['dia_chi']) ? (string) $json['dia_chi'] : '',
      'ghi_chu' => isset($json['ghi_chu']) ? (string) $json['ghi_chu'] : '',
    );
  }
  return $result;
}

/**
 * Validate tham chiếu bên thứ 3: phải tồn tại + đúng phan_loai.
 *
 * @param int $nid
 * @param string $required_phan_loai Nếu khác rỗng: phan_loai phải bằng giá trị này.
 * @param string $label Label tiếng Việt dùng trong message lỗi.
 * @return object|false Node bên thứ 3 nếu OK, FALSE nếu fail (đã respond_failed).
 */
function hop_dong_validate_ben_thu_ba($nid, $required_phan_loai, $label) {
  $nid = intval($nid);
  if ($nid <= 0) {
    hop_dong_respond_failed("{$label} không hợp lệ");
  }
  $node = node_load($nid);
  if (!$node || $node->type !== 'ben_thu_ba') {
    hop_dong_respond_failed("{$label} không tồn tại");
  }
  if (!hop_dong_node_is_active($node)) {
    hop_dong_respond_failed("{$label} đã bị vô hiệu hoá");
  }
  $phan_loai = isset($node->field_phan_loai[LANGUAGE_NONE][0]['value']) ? trim((string) $node->field_phan_loai[LANGUAGE_NONE][0]['value']) : '';
  if ($required_phan_loai !== '' && $phan_loai !== $required_phan_loai) {
    hop_dong_respond_failed("{$label} phải có phân loại \"{$required_phan_loai}\" (hiện tại: \"{$phan_loai}\")");
  }
  return $node;
}

/**
 * Validate nid_ben_thu_ba: phải có phan_loai KHÔNG chứa "Nhân viên kinh doanh".
 * (Cho phép: Khách hàng / Doanh nghiệp / Doanh nghiệp, Khách hàng / v.v.)
 */
function hop_dong_validate_khach_hang($nid) {
  $nid = intval($nid);
  if ($nid <= 0) {
    hop_dong_respond_failed('Khách hàng không hợp lệ');
  }
  $node = node_load($nid);
  if (!$node || $node->type !== 'ben_thu_ba') {
    hop_dong_respond_failed('Khách hàng không tồn tại');
  }
  if (!hop_dong_node_is_active($node)) {
    hop_dong_respond_failed('Khách hàng đã bị vô hiệu hoá');
  }
  $phan_loai = isset($node->field_phan_loai[LANGUAGE_NONE][0]['value']) ? trim((string) $node->field_phan_loai[LANGUAGE_NONE][0]['value']) : '';
  if (stripos($phan_loai, 'Nhân viên kinh doanh') !== FALSE) {
    hop_dong_respond_failed('Bên thứ 3 được chọn là Nhân viên kinh doanh, không phải Khách hàng');
  }
  return $node;
}

/**
 * Validate nid_nhan_vien_kinh_doanh: phải có phan_loai = "Nhân viên kinh doanh".
 */
function hop_dong_validate_nvkd($nid) {
  $nid = intval($nid);
  if ($nid <= 0) {
    hop_dong_respond_failed('Nhân viên kinh doanh không hợp lệ');
  }
  $node = node_load($nid);
  if (!$node || $node->type !== 'ben_thu_ba') {
    hop_dong_respond_failed('Nhân viên kinh doanh không tồn tại');
  }
  if (!hop_dong_node_is_active($node)) {
    hop_dong_respond_failed('Nhân viên kinh doanh đã bị vô hiệu hoá');
  }
  $phan_loai = isset($node->field_phan_loai[LANGUAGE_NONE][0]['value']) ? trim((string) $node->field_phan_loai[LANGUAGE_NONE][0]['value']) : '';
  if (stripos($phan_loai, 'Nhân viên kinh doanh') === FALSE) {
    hop_dong_respond_failed("Nhân viên kinh doanh phải có phân loại \"Nhân viên kinh doanh\" (hiện tại: \"{$phan_loai}\")");
  }
  return $node;
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function hop_dong_add_cors_headers() {
  drupal_add_http_header('Access-Control-Allow-Origin', '*');
  drupal_add_http_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  drupal_add_http_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  drupal_add_http_header('Access-Control-Max-Age', '86400');
}

function hop_dong_cors_preflight() {
  hop_dong_add_cors_headers();
  drupal_add_http_header('Status', '204 No Content');
  drupal_exit();
}

function hop_dong_respond($status, $message, $data = NULL, $http_code = HOP_DONG_HTTP_OK) {
  hop_dong_add_cors_headers();
  drupal_add_http_header('Content-Type', 'application/json; charset=utf-8');
  drupal_add_http_header('Status', $http_code . ' ' . _hop_dong_status_text($http_code));
  $response = array('status' => $status, 'message' => $message);
  if ($data !== NULL) { $response['data'] = $data; }
  drupal_json_output($response);
  drupal_exit();
}

function hop_dong_respond_success($message, $data = NULL) { hop_dong_respond('success', $message, $data, HOP_DONG_HTTP_OK); }
function hop_dong_respond_failed($message) { hop_dong_respond('failed', $message, NULL, HOP_DONG_HTTP_BAD_REQUEST); }
function hop_dong_respond_unauthorized($message) { hop_dong_respond('failed', $message, NULL, HOP_DONG_HTTP_UNAUTHORIZED); }
function hop_dong_respond_error($message) { hop_dong_respond('error', $message, NULL, HOP_DONG_HTTP_INTERNAL_ERROR); }

function hop_dong_respond_method_not_allowed($allowed) {
  hop_dong_add_cors_headers();
  drupal_add_http_header('Allow', $allowed);
  hop_dong_respond('error', 'Method không được hỗ trợ. Allowed: ' . $allowed, NULL, HOP_DONG_HTTP_METHOD_NOT_ALLOWED);
}

function _hop_dong_status_text($code) {
  $map = array(200 => 'OK', 400 => 'Bad Request', 401 => 'Unauthorized', 405 => 'Method Not Allowed', 500 => 'Internal Server Error');
  return isset($map[$code]) ? $map[$code] : 'Unknown';
}

<?php

/**
 * @file
 * Helper functions cho module lai_xe.
 */

define('LAI_XE_HTTP_OK', 200);
define('LAI_XE_HTTP_BAD_REQUEST', 400);
define('LAI_XE_HTTP_UNAUTHORIZED', 401);
define('LAI_XE_HTTP_METHOD_NOT_ALLOWED', 405);
define('LAI_XE_HTTP_INTERNAL_ERROR', 500);

define('LAI_XE_BUNDLE', 'lai_xe');
define('LAI_XE_DEFAULT_LIMIT', 20);
define('LAI_XE_MAX_LIMIT', 500);

function lai_xe_get_params() {
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

function lai_xe_require_auth($params) {
  $email = isset($params['created_email']) ? trim($params['created_email']) : '';
  $token = isset($params['token']) ? trim($params['token']) : '';
  if ($email === '' || $token === '') {
    lai_xe_respond_unauthorized('Thiếu thông tin xác thực');
  }
  module_load_include('module', 'user_login_api', 'user_login_api');
  if (!function_exists('api_check_token')) {
    lai_xe_respond_unauthorized('Hệ thống xác thực chưa được bật');
  }
  $result = api_check_token($token, $email);
  if ($result === FALSE) {
    lai_xe_respond_unauthorized('Token không hợp lệ');
  }
  return $result;
}

function lai_xe_field_value($node, $field_name, $default = '') {
  if (isset($node->{$field_name}[LANGUAGE_NONE][0]['value']) && $node->{$field_name}[LANGUAGE_NONE][0]['value'] !== '') {
    return $node->{$field_name}[LANGUAGE_NONE][0]['value'];
  }
  return $default;
}

function lai_xe_decode_json($value) {
  if (empty($value)) { return array(); }
  $decoded = json_decode($value, TRUE);
  return is_array($decoded) ? $decoded : array();
}

function lai_xe_encode_json_value($value) {
  if (is_string($value) && $value !== '') {
    $decoded = json_decode($value, TRUE);
    if (is_array($decoded)) { return $value; }
  }
  if (is_array($value)) { return drupal_json_encode($value); }
  return '';
}

/**
 * Kiểm tra duplicate cho field trong field_thong_tin_json.
 *
 * @param string $json_key   Key trong JSON (vd: 'ma_nhan_vien', 'sdt', 'cmt').
 * @param string $value      Giá trị cần kiểm tra.
 * @param int    $exclude_nid Bỏ qua node này (khi update).
 * @return array|NULL        Node info đã tồn tại, NULL nếu không duplicate.
 */
function lai_xe_check_duplicate($json_key, $value, $exclude_nid = 0) {
  if ($json_key === '' || $value === '') { return NULL; }

  $query = db_select('node', 'n');
  $query->fields('n', array('nid', 'title'));
  $query->condition('n.type', LAI_XE_BUNDLE);
  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  // Pattern tìm chính xác key:value trong JSON
  $pattern = '%"' . db_like($json_key) . '":"' . db_like($value) . '"%';
  $query->condition('ftj.field_thong_tin_json_value', $pattern, 'LIKE');

  // Chỉ check node đang hoạt động
  $or = db_or();
  $or->condition('fhd.field_hoat_dong_value', 1, '=');
  $or->isNull('fhd.field_hoat_dong_value');
  $query->condition($or);

  if ($exclude_nid > 0) {
    $query->condition('n.nid', $exclude_nid, '!=');
  }

  $query->range(0, 1);
  $result = $query->execute()->fetchAssoc();
  return $result ? $result : NULL;
}

/**
 * Kiểm tra các field unique (ma_nhan_vien, sdt, cmt) từ field_thong_tin_json.
 */
function lai_xe_validate_unique_fields($thong_tin, $exclude_nid = 0) {
  $checks = array(
    'ma_nhan_vien' => 'Mã nhân viên',
    'sdt'          => 'SDT',
    'cccd'         => 'CCCD',
  );

  foreach ($checks as $key => $label) {
    $value = isset($thong_tin[$key]) ? trim((string) $thong_tin[$key]) : '';
    if ($value === '') { continue; }

    $dup = lai_xe_check_duplicate($key, $value, $exclude_nid);
    if ($dup) {
      lai_xe_respond_failed("{$label} đã tồn tại");
    }
  }
}

function lai_xe_parse_active($value) {
  if ($value === NULL || $value === '') { return 1; }
  $text = drupal_strtolower(trim((string) $value));
  if ($text === '0' || $text === 'false' || $text === 'không' || $text === 'khong' || $text === 'inactive') { return 0; }
  return 1;
}

function lai_xe_node_is_active($entity) {
  if (isset($entity->hoat_dong)) { return intval($entity->hoat_dong) === 1; }
  if (isset($entity->field_hoat_dong[LANGUAGE_NONE][0]['value'])) { return intval($entity->field_hoat_dong[LANGUAGE_NONE][0]['value']) === 1; }
  return TRUE;
}

/**
 * Load phương tiện hiện tại (đang dùng) cho danh sách lái xe.
 *
 * Truy vấn bảng quan hệ phuong_tien_lai_xe (chỉ lấy bản ghi active) +
 * JOIN với node phuong_tien để lấy title, ma_tai_san, hang_xe.
 *
 * @param array $lai_xe_nids Danh sách nid lái xe.
 * @return array Map [lai_xe_nid => {nid, title, ma_tai_san, hang_xe}] (lai_xe chưa gán thì không có key).
 */
function lai_xe_load_phuong_tien_hien_tai_map($lai_xe_nids) {
  $result = array();
  if (empty($lai_xe_nids)) { return $result; }
  $lai_xe_nids = array_map('intval', $lai_xe_nids);
  $lai_xe_nids = array_filter($lai_xe_nids, function ($n) { return $n > 0; });
  if (empty($lai_xe_nids)) { return $result; }

  $q = db_select('node', 'nrel');
  $q->condition('nrel.type', 'phuong_tien_lai_xe', '=');
  $q->leftJoin('field_data_field_uid_lai_xe', 'fuid', "nrel.nid = fuid.entity_id AND fuid.entity_type = 'node' AND fuid.deleted = 0");
  $q->leftJoin('field_data_field_nid_phuong_tien', 'fnpt', "nrel.nid = fnpt.entity_id AND fnpt.entity_type = 'node' AND fnpt.deleted = 0");
  $q->leftJoin('field_data_field_hoat_dong', 'fhd', "nrel.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $q->addField('fuid', 'field_uid_lai_xe_target_id', 'lai_xe_nid');
  $q->addField('fnpt', 'field_nid_phuong_tien_target_id', 'pt_nid');
  $q->condition('fuid.field_uid_lai_xe_target_id', $lai_xe_nids, 'IN');
  $or = db_or();
  $or->condition('fhd.field_hoat_dong_value', 1, '=');
  $or->isNull('fhd.field_hoat_dong_value');
  $q->condition($or);

  $rows = $q->execute()->fetchAll();
  if (empty($rows)) { return $result; }

  $pt_nids = array();
  foreach ($rows as $r) {
    if (intval($r->pt_nid) > 0) { $pt_nids[] = intval($r->pt_nid); }
  }
  $pt_nids = array_unique($pt_nids);

  $pt_info = array();
  if (!empty($pt_nids)) {
    $pq = db_select('node', 'npt');
    $pq->condition('npt.type', 'phuong_tien', '=');
    $pq->condition('npt.nid', $pt_nids, 'IN');
    $pq->leftJoin('field_data_field_thong_tin_json', 'ptj', "npt.nid = ptj.entity_id AND ptj.entity_type = 'node' AND ptj.deleted = 0");
    $pq->addField('npt', 'nid', 'nid');
    $pq->addField('npt', 'title', 'title');
    $pq->addField('ptj', 'field_thong_tin_json_value', 'thong_tin_json');
    $prows = $pq->execute()->fetchAll();
    foreach ($prows as $pr) {
      $json = lai_xe_decode_json($pr->thong_tin_json);
      $pt_info[intval($pr->nid)] = array(
        'nid' => intval($pr->nid),
        'title' => (string) $pr->title,
        'ma_tai_san' => isset($json['ma_tai_san']) ? (string) $json['ma_tai_san'] : '',
        'hang_xe' => isset($json['hang_xe']) ? (string) $json['hang_xe'] : '',
      );
    }
  }

  foreach ($rows as $r) {
    $lx = intval($r->lai_xe_nid);
    $pt = intval($r->pt_nid);
    if ($lx <= 0 || $pt <= 0 || !isset($pt_info[$pt])) { continue; }
    if (isset($result[$lx])) { continue; }
    $result[$lx] = $pt_info[$pt];
  }

  return $result;
}

function lai_xe_format_row($row) {
  return array(
    'nid' => intval($row->nid),
    'title' => (string) $row->title,
    'field_thong_tin_json' => isset($row->thong_tin_json) ? lai_xe_decode_json($row->thong_tin_json) : new stdClass(),
    'field_hoat_dong' => isset($row->hoat_dong) ? intval($row->hoat_dong) : 1,
    'created' => isset($row->created) ? intval($row->created) : 0,
    'changed' => isset($row->changed) ? intval($row->changed) : 0,
  );
}

function lai_xe_format_node($node) {
  $pt_map = lai_xe_load_phuong_tien_hien_tai_map(array(intval($node->nid)));
  return array(
    'nid' => intval($node->nid),
    'title' => (string) $node->title,
    'field_thong_tin_json' => lai_xe_decode_json(lai_xe_field_value($node, 'field_thong_tin_json', '')),
    'field_hoat_dong' => isset($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) ? intval($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) : 1,
    'created' => !empty($node->created) ? intval($node->created) : 0,
    'changed' => !empty($node->changed) ? intval($node->changed) : 0,
    'phuong_tien_hien_tai' => isset($pt_map[intval($node->nid)]) ? $pt_map[intval($node->nid)] : NULL,
  );
}

function lai_xe_build_list_query($params) {
  $query = db_select('node', 'n');
  $query->condition('n.type', LAI_XE_BUNDLE, '=');
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
    $query->condition('fhd.field_hoat_dong_value', lai_xe_parse_active($params['field_hoat_dong']), '=');
  }
  elseif (!isset($params['include_inactive']) || !$params['include_inactive']) {
    $or = db_or();
    $or->condition('fhd.field_hoat_dong_value', 1, '=');
    $or->isNull('fhd.field_hoat_dong_value');
    $query->condition($or);
  }

  return $query;
}

function lai_xe_apply_sort(&$query, $params) {
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

function lai_xe_title_exists($title, $exclude_nid = 0) {
  $query = db_select('node', 'n');
  $query->fields('n', array('nid'));
  $query->condition('n.type', LAI_XE_BUNDLE, '=');
  $query->condition('n.title', $title, '=');
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  $or = db_or();
  $or->condition('fhd.field_hoat_dong_value', 1, '=');
  $or->isNull('fhd.field_hoat_dong_value');
  $query->condition($or);

  if ($exclude_nid > 0) { $query->condition('n.nid', $exclude_nid, '!='); }
  $query->range(0, 1);
  return (bool) $query->execute()->fetchField();
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function lai_xe_add_cors_headers() {
  drupal_add_http_header('Access-Control-Allow-Origin', '*');
  drupal_add_http_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  drupal_add_http_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  drupal_add_http_header('Access-Control-Max-Age', '86400');
}

function lai_xe_cors_preflight() {
  lai_xe_add_cors_headers();
  drupal_add_http_header('Status', '204 No Content');
  drupal_exit();
}

function lai_xe_respond($status, $message, $data = NULL, $http_code = LAI_XE_HTTP_OK) {
  lai_xe_add_cors_headers();
  drupal_add_http_header('Content-Type', 'application/json; charset=utf-8');
  drupal_add_http_header('Status', $http_code . ' ' . _lai_xe_status_text($http_code));
  $response = array('status' => $status, 'message' => $message);
  if ($data !== NULL) { $response['data'] = $data; }
  drupal_json_output($response);
  drupal_exit();
}

function lai_xe_respond_success($message, $data = NULL) { lai_xe_respond('success', $message, $data, LAI_XE_HTTP_OK); }
function lai_xe_respond_failed($message) { lai_xe_respond('failed', $message, NULL, LAI_XE_HTTP_BAD_REQUEST); }
function lai_xe_respond_unauthorized($message) { lai_xe_respond('failed', $message, NULL, LAI_XE_HTTP_UNAUTHORIZED); }
function lai_xe_respond_error($message) { lai_xe_respond('error', $message, NULL, LAI_XE_HTTP_INTERNAL_ERROR); }

function lai_xe_respond_method_not_allowed($allowed) {
  lai_xe_add_cors_headers();
  drupal_add_http_header('Allow', $allowed);
  lai_xe_respond('error', 'Method không được hỗ trợ. Allowed: ' . $allowed, NULL, LAI_XE_HTTP_METHOD_NOT_ALLOWED);
}

function _lai_xe_status_text($code) {
  $map = array(200 => 'OK', 400 => 'Bad Request', 401 => 'Unauthorized', 405 => 'Method Not Allowed', 500 => 'Internal Server Error');
  return isset($map[$code]) ? $map[$code] : 'Unknown';
}

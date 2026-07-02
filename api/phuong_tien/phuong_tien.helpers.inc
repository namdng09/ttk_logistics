<?php

/**
 * @file
 * Helper functions cho module phuong_tien.
 */

define('PHUONG_TIEN_HTTP_OK', 200);
define('PHUONG_TIEN_HTTP_BAD_REQUEST', 400);
define('PHUONG_TIEN_HTTP_UNAUTHORIZED', 401);
define('PHUONG_TIEN_HTTP_METHOD_NOT_ALLOWED', 405);
define('PHUONG_TIEN_HTTP_INTERNAL_ERROR', 500);

define('PHUONG_TIEN_BUNDLE', 'phuong_tien');
define('PHUONG_TIEN_DEFAULT_LIMIT', 20);
define('PHUONG_TIEN_MAX_LIMIT', 500);

/**
 * Parse request params từ JSON body, GET, POST.
 */
function phuong_tien_get_params() {
  $params = array();

  foreach ($_GET as $key => $value) {
    $params[$key] = $value;
  }

  $raw = file_get_contents('php://input');
  if ($raw !== '') {
    $decoded = json_decode($raw, TRUE);
    if (is_array($decoded)) {
      $params = array_merge($params, $decoded);
    }
  }

  foreach ($_POST as $key => $value) {
    $params[$key] = $value;
  }

  return $params;
}

/**
 * Validate authentication token.
 */
function phuong_tien_require_auth($params) {
  $email = isset($params['created_email']) ? trim($params['created_email']) : '';
  $token = isset($params['token']) ? trim($params['token']) : '';

  if ($email === '' || $token === '') {
    phuong_tien_respond_unauthorized('Thiếu thông tin xác thực');
  }

  module_load_include('module', 'user_login_api', 'user_login_api');
  if (!function_exists('api_check_token')) {
    phuong_tien_respond_unauthorized('Hệ thống xác thực chưa được bật');
  }

  $result = api_check_token($token, $email);
  if ($result === FALSE) {
    phuong_tien_respond_unauthorized('Token không hợp lệ');
  }

  return $result;
}

/**
 * Get single field value từ node Drupal.
 */
function phuong_tien_field_value($node, $field_name, $default = '') {
  if (isset($node->{$field_name}[LANGUAGE_NONE][0]['value']) && $node->{$field_name}[LANGUAGE_NONE][0]['value'] !== '') {
    return $node->{$field_name}[LANGUAGE_NONE][0]['value'];
  }
  return $default;
}

/**
 * Decode JSON string, trả về array rỗng nếu lỗi.
 */
function phuong_tien_decode_json($value) {
  if (empty($value)) {
    return array();
  }
  $decoded = json_decode($value, TRUE);
  return is_array($decoded) ? $decoded : array();
}

/**
 * Encode field_thong_tin_json về string để lưu vào Drupal.
 * Chấp nhận cả JSON string (cũ) lẫn array/object (mới từ Flutter).
 */
function phuong_tien_encode_json_value($value) {
  if (is_string($value) && $value !== '') {
    $decoded = json_decode($value, TRUE);
    if (is_array($decoded)) {
      return $value;
    }
  }
  if (is_array($value)) {
    return drupal_json_encode($value);
  }
  return '';
}

/**
 * Parse boolean/active value từ input.
 */
function phuong_tien_parse_active($value) {
  if ($value === NULL || $value === '') {
    return 1;
  }
  $text = drupal_strtolower(trim((string) $value));
  if ($text === '0' || $text === 'false' || $text === 'không' || $text === 'khong' || $text === 'inactive') {
    return 0;
  }
  return 1;
}

/**
 * Alias: node còn hoạt động không.
 * Chấp nhận cả node object từ node_load và row từ db_select.
 */
function phuong_tien_node_is_active($entity) {
  if (isset($entity->hoat_dong)) {
    return intval($entity->hoat_dong) === 1;
  }
  if (isset($entity->field_hoat_dong[LANGUAGE_NONE][0]['value'])) {
    return intval($entity->field_hoat_dong[LANGUAGE_NONE][0]['value']) === 1;
  }
  return TRUE;
}

/**
 * Format một row từ db_select thành array trả về.
 */
function phuong_tien_format_row($row) {
  return array(
    'nid' => intval($row->nid),
    'title' => (string) $row->title,
    'field_thong_tin_json' => isset($row->thong_tin_json) ? phuong_tien_decode_json($row->thong_tin_json) : new stdClass(),
    'field_hoat_dong' => isset($row->hoat_dong) ? intval($row->hoat_dong) : 1,
    'created' => isset($row->created) ? intval($row->created) : 0,
    'changed' => isset($row->changed) ? intval($row->changed) : 0,
  );
}

/**
 * Format một node Drupal thành array trả về.
 */
function phuong_tien_format_node($node) {
  return array(
    'nid' => intval($node->nid),
    'title' => (string) $node->title,
    'field_thong_tin_json' => phuong_tien_decode_json(phuong_tien_field_value($node, 'field_thong_tin_json', '')),
    'field_hoat_dong' => isset($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) ? intval($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) : 1,
    'created' => !empty($node->created) ? intval($node->created) : 0,
    'changed' => !empty($node->changed) ? intval($node->changed) : 0,
  );
}

/**
 * Build query cơ sở cho phuong_tien, dùng db_select.
 */
function phuong_tien_build_list_query($params) {
  $query = db_select('node', 'n');
  $query->condition('n.type', PHUONG_TIEN_BUNDLE, '=');

  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  $keyword = isset($params['keyword']) ? trim((string) $params['keyword']) : '';
  if ($keyword !== '') {
    $query->condition('n.title', '%' . db_like($keyword) . '%', 'LIKE');
  }

  if (isset($params['field_hoat_dong']) && $params['field_hoat_dong'] !== '' && $params['field_hoat_dong'] !== 'all') {
    $query->condition('fhd.field_hoat_dong_value', phuong_tien_parse_active($params['field_hoat_dong']), '=');
  }
  elseif (!isset($params['include_inactive']) || !$params['include_inactive']) {
    $or = db_or();
    $or->condition('fhd.field_hoat_dong_value', 1, '=');
    $or->isNull('fhd.field_hoat_dong_value');
    $query->condition($or);
  }

  return $query;
}

/**
 * Apply sort vào query.
 */
function phuong_tien_apply_sort(&$query, $params) {
  $sort_by = isset($params['sort_by']) ? trim((string) $params['sort_by']) : 'title';
  $sort_dir = isset($params['sort_dir']) ? strtoupper(trim((string) $params['sort_dir'])) : 'ASC';
  if ($sort_dir !== 'ASC' && $sort_dir !== 'DESC') {
    $sort_dir = 'ASC';
  }

  $map = array(
    'nid' => 'n.nid',
    'title' => 'n.title',
    'created' => 'n.created',
    'changed' => 'n.changed',
    'field_hoat_dong' => 'fhd.field_hoat_dong_value',
  );

  $query->orderBy(isset($map[$sort_by]) ? $map[$sort_by] : 'n.title', $sort_dir);
  if ($sort_by !== 'nid') {
    $query->orderBy('n.nid', 'ASC');
  }
}

/**
 * Kiểm tra BKS (title) đã tồn tại chưa (tránh trùng biển số).
 */
function phuong_tien_title_exists($title, $exclude_nid = 0) {
  $query = db_select('node', 'n');
  $query->fields('n', array('nid'));
  $query->condition('n.type', PHUONG_TIEN_BUNDLE, '=');
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

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function phuong_tien_add_cors_headers() {
  drupal_add_http_header('Access-Control-Allow-Origin', '*');
  drupal_add_http_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  drupal_add_http_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  drupal_add_http_header('Access-Control-Max-Age', '86400');
}

function phuong_tien_cors_preflight() {
  phuong_tien_add_cors_headers();
  drupal_add_http_header('Status', '204 No Content');
  drupal_exit();
}

function phuong_tien_respond($status, $message, $data = NULL, $http_code = PHUONG_TIEN_HTTP_OK) {
  phuong_tien_add_cors_headers();
  drupal_add_http_header('Content-Type', 'application/json; charset=utf-8');
  drupal_add_http_header('Status', $http_code . ' ' . _phuong_tien_status_text($http_code));

  $response = array(
    'status' => $status,
    'message' => $message,
  );
  if ($data !== NULL) {
    $response['data'] = $data;
  }

  drupal_json_output($response);
  drupal_exit();
}

function phuong_tien_respond_success($message, $data = NULL) {
  phuong_tien_respond('success', $message, $data, PHUONG_TIEN_HTTP_OK);
}

function phuong_tien_respond_failed($message) {
  phuong_tien_respond('failed', $message, NULL, PHUONG_TIEN_HTTP_BAD_REQUEST);
}

function phuong_tien_respond_unauthorized($message) {
  phuong_tien_respond('failed', $message, NULL, PHUONG_TIEN_HTTP_UNAUTHORIZED);
}

function phuong_tien_respond_error($message) {
  phuong_tien_respond('error', $message, NULL, PHUONG_TIEN_HTTP_INTERNAL_ERROR);
}

function phuong_tien_respond_method_not_allowed($allowed) {
  phuong_tien_add_cors_headers();
  drupal_add_http_header('Allow', $allowed);
  phuong_tien_respond('error', 'Method không được hỗ trợ. Allowed: ' . $allowed, NULL, PHUONG_TIEN_HTTP_METHOD_NOT_ALLOWED);
}

function _phuong_tien_status_text($code) {
  $map = array(
    200 => 'OK',
    400 => 'Bad Request',
    401 => 'Unauthorized',
    405 => 'Method Not Allowed',
    500 => 'Internal Server Error',
  );
  return isset($map[$code]) ? $map[$code] : 'Unknown';
}

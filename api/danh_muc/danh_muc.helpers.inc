<?php

/**
 * @file
 * Helper functions cho module danh_muc.
 */

/**
 * HTTP status code constants.
 */
define('DANH_MUC_HTTP_OK', 200);
define('DANH_MUC_HTTP_BAD_REQUEST', 400);
define('DANH_MUC_HTTP_UNAUTHORIZED', 401);
define('DANH_MUC_HTTP_METHOD_NOT_ALLOWED', 405);
define('DANH_MUC_HTTP_INTERNAL_ERROR', 500);

define('DANH_MUC_BUNDLE', 'danh_muc');
define('DANH_MUC_DEFAULT_LIMIT', 20);
define('DANH_MUC_MAX_LIMIT', 500);

/**
 * Parse request params từ JSON body, GET, POST.
 */
function danh_muc_get_params() {
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
function danh_muc_require_auth($params) {
  $email = isset($params['created_email']) ? trim($params['created_email']) : '';
  $token = isset($params['token']) ? trim($params['token']) : '';

  if ($email === '' || $token === '') {
    danh_muc_respond_unauthorized('Thiếu thông tin xác thực');
  }

  module_load_include('module', 'user_login_api', 'user_login_api');
  if (!function_exists('api_check_token')) {
    danh_muc_respond_unauthorized('Hệ thống xác thực chưa được bật');
  }

  $result = api_check_token($token, $email);
  if ($result === FALSE) {
    danh_muc_respond_unauthorized('Token không hợp lệ');
  }

  return $result;
}

/**
 * Get single field value từ node Drupal.
 */
function danh_muc_field_value($node, $field_name, $default = '') {
  if (isset($node->{$field_name}[LANGUAGE_NONE][0]['value']) && $node->{$field_name}[LANGUAGE_NONE][0]['value'] !== '') {
    return $node->{$field_name}[LANGUAGE_NONE][0]['value'];
  }
  return $default;
}

/**
 * Decode JSON string, trả về array rỗng nếu lỗi.
 */
function danh_muc_decode_json($value) {
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
function danh_muc_encode_json_value($value) {
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
function danh_muc_parse_active($value) {
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
function danh_muc_node_is_active($entity) {
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
function danh_muc_format_row($row) {
  return array(
    'nid' => intval($row->nid),
    'title' => (string) $row->title,
    'field_thong_tin_json' => isset($row->thong_tin_json) ? danh_muc_decode_json($row->thong_tin_json) : new stdClass(),
    'field_hoat_dong' => isset($row->hoat_dong) ? intval($row->hoat_dong) : 1,
    'field_so_luong' => isset($row->so_luong) ? floatval($row->so_luong) : 0,
    'created' => isset($row->created) ? intval($row->created) : 0,
    'changed' => isset($row->changed) ? intval($row->changed) : 0,
  );
}

/**
 * Format một node Drupal thành array trả về.
 */
function danh_muc_format_node($node) {
  return array(
    'nid' => intval($node->nid),
    'title' => (string) $node->title,
    'field_thong_tin_json' => danh_muc_decode_json(danh_muc_field_value($node, 'field_thong_tin_json', '')),
    'field_hoat_dong' => isset($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) ? intval($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) : 1,
    'field_so_luong' => !empty($node->field_so_luong[LANGUAGE_NONE][0]['value']) ? floatval($node->field_so_luong[LANGUAGE_NONE][0]['value']) : 0,
    'created' => !empty($node->created) ? intval($node->created) : 0,
    'changed' => !empty($node->changed) ? intval($node->changed) : 0,
  );
}

/**
 * Build query cơ sở cho danh_muc, dùng db_select.
 */
function danh_muc_build_list_query($params) {
  $query = db_select('node', 'n');
  $query->condition('n.type', DANH_MUC_BUNDLE, '=');

  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $query->leftJoin('field_data_field_so_luong', 'fsl', "n.nid = fsl.entity_id AND fsl.entity_type = 'node' AND fsl.deleted = 0");

  $keyword = isset($params['keyword']) ? trim((string) $params['keyword']) : '';
  if ($keyword !== '') {
    $query->condition('n.title', '%' . db_like($keyword) . '%', 'LIKE');
  }

  if (isset($params['field_hoat_dong']) && $params['field_hoat_dong'] !== '' && $params['field_hoat_dong'] !== 'all') {
    $query->condition('fhd.field_hoat_dong_value', danh_muc_parse_active($params['field_hoat_dong']), '=');
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
function danh_muc_apply_sort(&$query, $params) {
  $sort_by = isset($_GET['sort_by']) ? trim((string) $_GET['sort_by']) : 'title';
  $sort_dir = isset($_GET['sort_dir']) ? strtoupper(trim((string) $_GET['sort_dir'])) : 'ASC';
  if ($sort_dir !== 'ASC' && $sort_dir !== 'DESC') {
    $sort_dir = 'ASC';
  }

  $map = array(
    'nid' => 'n.nid',
    'title' => 'n.title',
    'created' => 'n.created',
    'changed' => 'n.changed',
    'field_hoat_dong' => 'fhd.field_hoat_dong_value',
    'field_so_luong' => 'fsl.field_so_luong_value',
  );

  $query->orderBy(isset($map[$sort_by]) ? $map[$sort_by] : 'n.title', $sort_dir);
  if ($sort_by !== 'nid') {
    $query->orderBy('n.nid', 'ASC');
  }
}

/**
 * Kiểm tra title đã tồn tại chưa (tránh trùng tên).
 */
function danh_muc_title_exists($title, $exclude_nid = 0) {
  $query = db_select('node', 'n');
  $query->fields('n', array('nid'));
  $query->condition('n.type', DANH_MUC_BUNDLE, '=');
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

function danh_muc_add_cors_headers() {
  drupal_add_http_header('Access-Control-Allow-Origin', '*');
  drupal_add_http_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  drupal_add_http_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  drupal_add_http_header('Access-Control-Max-Age', '86400');
}

function danh_muc_cors_preflight() {
  danh_muc_add_cors_headers();
  drupal_add_http_header('Status', '204 No Content');
  drupal_exit();
}

function danh_muc_respond($status, $message, $data = NULL, $http_code = DANH_MUC_HTTP_OK) {
  danh_muc_add_cors_headers();
  drupal_add_http_header('Content-Type', 'application/json; charset=utf-8');
  drupal_add_http_header('Status', $http_code . ' ' . _danh_muc_status_text($http_code));

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

function danh_muc_respond_success($message, $data = NULL) {
  danh_muc_respond('success', $message, $data, DANH_MUC_HTTP_OK);
}

function danh_muc_respond_failed($message) {
  danh_muc_respond('failed', $message, NULL, DANH_MUC_HTTP_BAD_REQUEST);
}

function danh_muc_respond_unauthorized($message) {
  danh_muc_respond('failed', $message, NULL, DANH_MUC_HTTP_UNAUTHORIZED);
}

function danh_muc_respond_error($message) {
  danh_muc_respond('error', $message, NULL, DANH_MUC_HTTP_INTERNAL_ERROR);
}

function danh_muc_respond_method_not_allowed($allowed) {
  danh_muc_add_cors_headers();
  drupal_add_http_header('Allow', $allowed);
  danh_muc_respond('error', 'Method không được hỗ trợ. Allowed: ' . $allowed, NULL, DANH_MUC_HTTP_METHOD_NOT_ALLOWED);
}

function _danh_muc_status_text($code) {
  $map = array(
    200 => 'OK',
    400 => 'Bad Request',
    401 => 'Unauthorized',
    405 => 'Method Not Allowed',
    500 => 'Internal Server Error',
  );
  return isset($map[$code]) ? $map[$code] : 'Unknown';
}

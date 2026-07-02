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
  return array(
    'nid' => intval($node->nid),
    'title' => (string) $node->title,
    'field_thong_tin_json' => lai_xe_decode_json(lai_xe_field_value($node, 'field_thong_tin_json', '')),
    'field_hoat_dong' => isset($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) ? intval($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) : 1,
    'created' => !empty($node->created) ? intval($node->created) : 0,
    'changed' => !empty($node->changed) ? intval($node->changed) : 0,
  );
}

function lai_xe_build_list_query($params) {
  $query = db_select('node', 'n');
  $query->condition('n.type', LAI_XE_BUNDLE, '=');
  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  $keyword = isset($params['keyword']) ? trim((string) $params['keyword']) : '';
  if ($keyword !== '') {
    $query->condition('n.title', '%' . db_like($keyword) . '%', 'LIKE');
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

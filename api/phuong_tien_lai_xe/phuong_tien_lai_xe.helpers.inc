<?php

/**
 * @file
 * Helper functions cho module phuong_tien_lai_xe.
 */

define('PTLX_HTTP_OK', 200);
define('PTLX_HTTP_BAD_REQUEST', 400);
define('PTLX_HTTP_UNAUTHORIZED', 401);
define('PTLX_HTTP_METHOD_NOT_ALLOWED', 405);
define('PTLX_HTTP_INTERNAL_ERROR', 500);

define('PTLX_BUNDLE', 'phuong_tien_lai_xe');
define('PTLX_DEFAULT_LIMIT', 20);
define('PTLX_MAX_LIMIT', 500);

function ptlx_get_params() {
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

function ptlx_require_auth($params) {
  $email = isset($params['created_email']) ? trim($params['created_email']) : '';
  $token = isset($params['token']) ? trim($params['token']) : '';
  if ($email === '' || $token === '') {
    ptlx_respond_unauthorized('Thiếu thông tin xác thực');
  }
  module_load_include('module', 'user_login_api', 'user_login_api');
  if (!function_exists('api_check_token')) {
    ptlx_respond_unauthorized('Hệ thống xác thực chưa được bật');
  }
  $result = api_check_token($token, $email);
  if ($result === FALSE) {
    ptlx_respond_unauthorized('Token không hợp lệ');
  }
  return $result;
}

function ptlx_field_value($node, $field_name, $default = '') {
  if (isset($node->{$field_name}[LANGUAGE_NONE][0]['value']) && $node->{$field_name}[LANGUAGE_NONE][0]['value'] !== '') {
    return $node->{$field_name}[LANGUAGE_NONE][0]['value'];
  }
  return $default;
}

function ptlx_parse_active($value) {
  if ($value === NULL || $value === '') { return 1; }
  $text = drupal_strtolower(trim((string) $value));
  if ($text === '0' || $text === 'false' || $text === 'không' || $text === 'khong' || $text === 'inactive') { return 0; }
  return 1;
}

function ptlx_node_is_active($entity) {
  if (isset($entity->hoat_dong)) { return intval($entity->hoat_dong) === 1; }
  if (isset($entity->field_hoat_dong[LANGUAGE_NONE][0]['value'])) { return intval($entity->field_hoat_dong[LANGUAGE_NONE][0]['value']) === 1; }
  return TRUE;
}

function ptlx_get_node_title($nid) {
  if (empty($nid)) { return ''; }
  $query = db_select('node', 'n');
  $query->fields('n', array('title'));
  $query->condition('n.nid', intval($nid));
  $result = $query->execute()->fetchField();
  return $result !== FALSE ? (string) $result : '';
}

function ptlx_generate_title($lai_xe_nid, $phuong_tien_nid) {
  $ten_lai_xe = ptlx_get_node_title($lai_xe_nid);
  $bks = ptlx_get_node_title($phuong_tien_nid);
  $thoi_gian = date('Y-m-d H:i');
  return $ten_lai_xe . ' - ' . $bks . ' - ' . $thoi_gian;
}

function ptlx_format_row($row) {
  return array(
    'nid' => intval($row->nid),
    'title' => (string) $row->title,
    'field_uid_lai_xe' => intval($row->uid_lai_xe),
    'lai_xe_title' => isset($row->lai_xe_title) ? (string) $row->lai_xe_title : '',
    'field_nid_phuong_tien' => intval($row->nid_phuong_tien),
    'phuong_tien_title' => isset($row->phuong_tien_title) ? (string) $row->phuong_tien_title : '',
    'field_hoat_dong' => isset($row->hoat_dong) ? intval($row->hoat_dong) : 1,
    'created' => isset($row->created) ? intval($row->created) : 0,
    'changed' => isset($row->changed) ? intval($row->changed) : 0,
  );
}

function ptlx_format_node($node) {
  $lai_xe_nid = isset($node->field_uid_lai_xe[LANGUAGE_NONE][0]['target_id']) ? intval($node->field_uid_lai_xe[LANGUAGE_NONE][0]['target_id']) : 0;
  $phuong_tien_nid = isset($node->field_nid_phuong_tien[LANGUAGE_NONE][0]['target_id']) ? intval($node->field_nid_phuong_tien[LANGUAGE_NONE][0]['target_id']) : 0;

  return array(
    'nid' => intval($node->nid),
    'title' => (string) $node->title,
    'field_uid_lai_xe' => $lai_xe_nid,
    'lai_xe_title' => $lai_xe_nid ? ptlx_get_node_title($lai_xe_nid) : '',
    'field_nid_phuong_tien' => $phuong_tien_nid,
    'phuong_tien_title' => $phuong_tien_nid ? ptlx_get_node_title($phuong_tien_nid) : '',
    'field_hoat_dong' => isset($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) ? intval($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) : 1,
    'created' => !empty($node->created) ? intval($node->created) : 0,
    'changed' => !empty($node->changed) ? intval($node->changed) : 0,
  );
}

function ptlx_build_list_query($params) {
  $query = db_select('node', 'n');
  $query->condition('n.type', PTLX_BUNDLE, '=');
  $query->leftJoin('field_data_field_uid_lai_xe', 'fuid', "n.nid = fuid.entity_id AND fuid.entity_type = 'node' AND fuid.deleted = 0");
  $query->leftJoin('field_data_field_nid_phuong_tien', 'fnpt', "n.nid = fnpt.entity_id AND fnpt.entity_type = 'node' AND fnpt.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  $keyword = isset($params['keyword']) ? trim((string) $params['keyword']) : '';
  if ($keyword !== '') {
    $query->leftJoin('node', 'nlx', 'fuid.field_uid_lai_xe_target_id = nlx.nid');
    $query->leftJoin('node', 'npt', 'fnpt.field_nid_phuong_tien_target_id = npt.nid');
    $or = db_or();
    $or->condition('n.title', '%' . db_like($keyword) . '%', 'LIKE');
    $or->condition('nlx.title', '%' . db_like($keyword) . '%', 'LIKE');
    $or->condition('npt.title', '%' . db_like($keyword) . '%', 'LIKE');
    $query->condition($or);
  }

  if (isset($params['field_uid_lai_xe']) && $params['field_uid_lai_xe'] !== '') {
    $query->condition('fuid.field_uid_lai_xe_target_id', intval($params['field_uid_lai_xe']), '=');
  }

  if (isset($params['field_nid_phuong_tien']) && $params['field_nid_phuong_tien'] !== '') {
    $query->condition('fnpt.field_nid_phuong_tien_target_id', intval($params['field_nid_phuong_tien']), '=');
  }

  if (isset($params['field_hoat_dong']) && $params['field_hoat_dong'] !== '' && $params['field_hoat_dong'] !== 'all') {
    $query->condition('fhd.field_hoat_dong_value', ptlx_parse_active($params['field_hoat_dong']), '=');
  }
  elseif (!isset($params['include_inactive']) || !$params['include_inactive']) {
    $or = db_or();
    $or->condition('fhd.field_hoat_dong_value', 1, '=');
    $or->isNull('fhd.field_hoat_dong_value');
    $query->condition($or);
  }

  return $query;
}

function ptlx_apply_sort(&$query, $params) {
  $sort_by = isset($params['sort_by']) ? trim((string) $params['sort_by']) : 'created';
  $sort_dir = isset($params['sort_dir']) ? strtoupper(trim((string) $params['sort_dir'])) : 'DESC';
  if ($sort_dir !== 'ASC' && $sort_dir !== 'DESC') { $sort_dir = 'DESC'; }

  $map = array(
    'nid' => 'n.nid',
    'title' => 'n.title',
    'created' => 'n.created',
    'changed' => 'n.changed',
    'field_hoat_dong' => 'fhd.field_hoat_dong_value',
  );

  $query->orderBy(isset($map[$sort_by]) ? $map[$sort_by] : 'n.created', $sort_dir);
  if ($sort_by !== 'nid') { $query->orderBy('n.nid', 'ASC'); }
}

function ptlx_deactivate_old_assignments($lai_xe_nid, $exclude_nid = 0) {
  $query = db_select('node', 'n');
  $query->fields('n', array('nid'));
  $query->condition('n.type', PTLX_BUNDLE, '=');
  $query->leftJoin('field_data_field_uid_lai_xe', 'fuid', "n.nid = fuid.entity_id AND fuid.entity_type = 'node' AND fuid.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $query->condition('fuid.field_uid_lai_xe_target_id', intval($lai_xe_nid), '=');
  $query->condition('fhd.field_hoat_dong_value', 1, '=');
  if ($exclude_nid > 0) {
    $query->condition('n.nid', intval($exclude_nid), '!=');
  }

  $old_nids = $query->execute()->fetchCol();

  $deactivated = 0;
  foreach ($old_nids as $old_nid) {
    $old_node = node_load($old_nid);
    if ($old_node) {
      $old_node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
      node_save($old_node);
      $deactivated++;
    }
  }

  if ($deactivated > 0) {
    watchdog('phuong_tien_lai_xe', 'Deactivated @count old assignment(s) for lai xe @nid', array('@count' => $deactivated, '@nid' => $lai_xe_nid), WATCHDOG_NOTICE);
  }

  return $deactivated;
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function ptlx_add_cors_headers() {
  drupal_add_http_header('Access-Control-Allow-Origin', '*');
  drupal_add_http_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  drupal_add_http_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  drupal_add_http_header('Access-Control-Max-Age', '86400');
}

function ptlx_cors_preflight() {
  ptlx_add_cors_headers();
  drupal_add_http_header('Status', '204 No Content');
  drupal_exit();
}

function ptlx_respond($status, $message, $data = NULL, $http_code = PTLX_HTTP_OK) {
  ptlx_add_cors_headers();
  drupal_add_http_header('Content-Type', 'application/json; charset=utf-8');
  drupal_add_http_header('Status', $http_code . ' ' . _ptlx_status_text($http_code));
  $response = array('status' => $status, 'message' => $message);
  if ($data !== NULL) { $response['data'] = $data; }
  drupal_json_output($response);
  drupal_exit();
}

function ptlx_respond_success($message, $data = NULL) { ptlx_respond('success', $message, $data, PTLX_HTTP_OK); }
function ptlx_respond_failed($message) { ptlx_respond('failed', $message, NULL, PTLX_HTTP_BAD_REQUEST); }
function ptlx_respond_unauthorized($message) { ptlx_respond('failed', $message, NULL, PTLX_HTTP_UNAUTHORIZED); }
function ptlx_respond_error($message) { ptlx_respond('error', $message, NULL, PTLX_HTTP_INTERNAL_ERROR); }

function ptlx_respond_method_not_allowed($allowed) {
  ptlx_add_cors_headers();
  drupal_add_http_header('Allow', $allowed);
  ptlx_respond('error', 'Method không được hỗ trợ. Allowed: ' . $allowed, NULL, PTLX_HTTP_METHOD_NOT_ALLOWED);
}

function _ptlx_status_text($code) {
  $map = array(200 => 'OK', 400 => 'Bad Request', 401 => 'Unauthorized', 405 => 'Method Not Allowed', 500 => 'Internal Server Error');
  return isset($map[$code]) ? $map[$code] : 'Unknown';
}

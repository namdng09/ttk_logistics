<?php

define('BEN_THU_BA_HTTP_OK', 200);
define('BEN_THU_BA_HTTP_BAD_REQUEST', 400);
define('BEN_THU_BA_HTTP_METHOD_NOT_ALLOWED', 405);
define('BEN_THU_BA_HTTP_INTERNAL_ERROR', 500);

define('BEN_THU_BA_BUNDLE', 'ben_thu_ba');
define('BEN_THU_BA_DEFAULT_LIMIT', 20);
define('BEN_THU_BA_MAX_LIMIT', 500);

function ben_thu_ba_get_params() {
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

function ben_thu_ba_require_auth($params) {
  $email = isset($params['created_email']) ? trim($params['created_email']) : '';
  $token = isset($params['token']) ? trim($params['token']) : '';

  if ($email === '' || $token === '') {
    throw new Exception('Thiếu thông tin xác thực');
  }

  module_load_include('module', 'user_login_api', 'user_login_api');
  if (!function_exists('api_check_token')) {
    throw new Exception('Hệ thống xác thực chưa được bật');
  }

  $result = api_check_token($token, $email);
  if ($result === FALSE) {
    throw new Exception('Token không hợp lệ');
  }

  return $result;
}

function ben_thu_ba_field_value($node, $field_name, $default = '') {
  if (isset($node->{$field_name}[LANGUAGE_NONE][0]['value']) && $node->{$field_name}[LANGUAGE_NONE][0]['value'] !== '') {
    return $node->{$field_name}[LANGUAGE_NONE][0]['value'];
  }
  return $default;
}

function ben_thu_ba_decode_json($value) {
  if (empty($value)) {
    return array();
  }
  $decoded = json_decode($value, TRUE);
  return is_array($decoded) ? $decoded : array();
}

function ben_thu_ba_encode_json_value($value) {
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

function ben_thu_ba_parse_active($value) {
  if ($value === NULL || $value === '') {
    return 1;
  }
  $text = drupal_strtolower(trim((string) $value));
  if ($text === '0' || $text === 'false' || $text === 'không' || $text === 'khong' || $text === 'inactive') {
    return 0;
  }
  return 1;
}

function ben_thu_ba_node_is_active($entity) {
  if (isset($entity->hoat_dong)) {
    return intval($entity->hoat_dong) === 1;
  }
  if (isset($entity->field_hoat_dong[LANGUAGE_NONE][0]['value'])) {
    return intval($entity->field_hoat_dong[LANGUAGE_NONE][0]['value']) === 1;
  }
  return TRUE;
}

function ben_thu_ba_format_row($row) {
  return array(
    'nid' => intval($row->nid),
    'title' => (string) $row->title,
    'field_thong_tin_json' => isset($row->thong_tin_json) ? ben_thu_ba_decode_json($row->thong_tin_json) : new stdClass(),
    'field_hoat_dong' => isset($row->hoat_dong) ? intval($row->hoat_dong) : 1,
    'field_phan_loai' => isset($row->phan_loai) ? (string) $row->phan_loai : '',
    'field_dob' => isset($row->dob) ? intval($row->dob) : 0,
    'created' => isset($row->created) ? intval($row->created) : 0,
    'changed' => isset($row->changed) ? intval($row->changed) : 0,
  );
}

function ben_thu_ba_format_node($node) {
  return array(
    'nid' => intval($node->nid),
    'title' => (string) $node->title,
    'field_thong_tin_json' => ben_thu_ba_decode_json(ben_thu_ba_field_value($node, 'field_thong_tin_json', '')),
    'field_hoat_dong' => isset($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) ? intval($node->field_hoat_dong[LANGUAGE_NONE][0]['value']) : 1,
    'field_phan_loai' => ben_thu_ba_field_value($node, 'field_phan_loai', ''),
    'field_dob' => isset($node->field_dob[LANGUAGE_NONE][0]['value']) ? intval($node->field_dob[LANGUAGE_NONE][0]['value']) : 0,
    'created' => !empty($node->created) ? intval($node->created) : 0,
    'changed' => !empty($node->changed) ? intval($node->changed) : 0,
  );
}

function ben_thu_ba_build_list_query($params) {
  $query = db_select('node', 'n');
  $query->condition('n.type', BEN_THU_BA_BUNDLE, '=');

  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $query->leftJoin('field_data_field_phan_loai', 'fpl', "n.nid = fpl.entity_id AND fpl.entity_type = 'node' AND fpl.deleted = 0");
  $query->leftJoin('field_data_field_dob', 'fdb', "n.nid = fdb.entity_id AND fdb.entity_type = 'node' AND fdb.deleted = 0");

  $keyword = isset($params['keyword']) ? trim((string) $params['keyword']) : '';
  if ($keyword !== '') {
    $query->condition('n.title', '%' . db_like($keyword) . '%', 'LIKE');
  }

  if (isset($params['field_hoat_dong']) && $params['field_hoat_dong'] !== '' && $params['field_hoat_dong'] !== 'all') {
    $query->condition('fhd.field_hoat_dong_value', ben_thu_ba_parse_active($params['field_hoat_dong']), '=');
  }
  elseif (!isset($params['include_inactive']) || !$params['include_inactive']) {
    $or = db_or();
    $or->condition('fhd.field_hoat_dong_value', 1, '=');
    $or->isNull('fhd.field_hoat_dong_value');
    $query->condition($or);
  }

  if (isset($params['field_phan_loai']) && trim((string) $params['field_phan_loai']) !== '') {
    $query->condition('fpl.field_phan_loai_value', trim((string) $params['field_phan_loai']), '=');
  }

  return $query;
}

function ben_thu_ba_apply_sort(&$query, $params) {
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
    'field_phan_loai' => 'fpl.field_phan_loai_value',
    'field_dob' => 'fdb.field_dob_value',
  );

  $query->orderBy(isset($map[$sort_by]) ? $map[$sort_by] : 'n.title', $sort_dir);
  if ($sort_by !== 'nid') {
    $query->orderBy('n.nid', 'ASC');
  }
}

function ben_thu_ba_title_exists($title, $exclude_nid = 0) {
  $query = db_select('node', 'n');
  $query->fields('n', array('nid'));
  $query->condition('n.type', BEN_THU_BA_BUNDLE, '=');
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

function ben_thu_ba_add_cors_headers() {
  drupal_add_http_header('Access-Control-Allow-Origin', '*');
  drupal_add_http_header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  drupal_add_http_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  drupal_add_http_header('Access-Control-Max-Age', '86400');
}

function ben_thu_ba_cors_preflight() {
  ben_thu_ba_add_cors_headers();
  drupal_add_http_header('Status', '204 No Content');
  drupal_exit();
}

function ben_thu_ba_respond($status, $message, $data = NULL, $http_code = BEN_THU_BA_HTTP_OK) {
  ben_thu_ba_add_cors_headers();
  drupal_add_http_header('Content-Type', 'application/json; charset=utf-8');
  drupal_add_http_header('Status', $http_code . ' ' . _ben_thu_ba_status_text($http_code));

  $response = array('status' => $status, 'message' => $message);
  if ($data !== NULL) {
    $response['data'] = $data;
  }

  drupal_json_output($response);
  drupal_exit();
}

function ben_thu_ba_respond_success($message, $data = NULL) {
  ben_thu_ba_respond('success', $message, $data, BEN_THU_BA_HTTP_OK);
}

function ben_thu_ba_respond_failed($message) {
  ben_thu_ba_respond('failed', $message, NULL, BEN_THU_BA_HTTP_BAD_REQUEST);
}

function ben_thu_ba_respond_error($message) {
  ben_thu_ba_respond('error', $message, NULL, BEN_THU_BA_HTTP_INTERNAL_ERROR);
}

function ben_thu_ba_respond_method_not_allowed($allowed) {
  ben_thu_ba_add_cors_headers();
  drupal_add_http_header('Allow', $allowed);
  ben_thu_ba_respond('error', 'Method không được hỗ trợ. Allowed: ' . $allowed, NULL, BEN_THU_BA_HTTP_METHOD_NOT_ALLOWED);
}

function _ben_thu_ba_status_text($code) {
  $map = array(
    200 => 'OK',
    400 => 'Bad Request',
    405 => 'Method Not Allowed',
    500 => 'Internal Server Error',
  );
  return isset($map[$code]) ? $map[$code] : 'Unknown';
}

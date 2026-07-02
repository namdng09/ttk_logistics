<?php

/**
 * @file
 * Request routing & controller functions cho lai_xe API.
 */

function _lai_xe_resolve_method($params) {
  if (isset($params['_method'])) {
    $m = strtoupper(trim($params['_method']));
    if (in_array($m, array('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))) { return $m; }
  }
  return $_SERVER['REQUEST_METHOD'];
}

function lai_xe_route_collection() {
  $method = $_SERVER['REQUEST_METHOD'];
  if ($method === 'OPTIONS') { lai_xe_cors_preflight(); return; }

  try {
    $params = lai_xe_get_params();
    $method = _lai_xe_resolve_method($params);

    if ($method === 'GET') { lai_xe_controller_list($params); return; }
    if ($method === 'POST') { lai_xe_controller_create($params); return; }
  }
  catch (Exception $e) {
    watchdog('lai_xe', 'Collection error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    lai_xe_respond_error($e->getMessage());
  }

  lai_xe_respond_method_not_allowed('GET, POST');
}

function lai_xe_route_item($nid) {
  $method = $_SERVER['REQUEST_METHOD'];
  if ($method === 'OPTIONS') { lai_xe_cors_preflight(); return; }

  try {
    $params = lai_xe_get_params();
    $method = _lai_xe_resolve_method($params);

    if ($method === 'GET') { lai_xe_controller_detail($nid, $params); return; }
    if ($method === 'PUT' || $method === 'PATCH') { lai_xe_controller_update($nid, $params); return; }
    if ($method === 'DELETE') { lai_xe_controller_delete($nid, $params); return; }
  }
  catch (Exception $e) {
    watchdog('lai_xe', 'Item error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    lai_xe_respond_error($e->getMessage());
  }

  lai_xe_respond_method_not_allowed('GET, PUT, PATCH, DELETE');
}

function lai_xe_controller_list($params) {
  lai_xe_require_auth($params);
  lai_xe_respond_success('Lấy danh sách thành công', lai_xe_service_get_list($params));
}

function lai_xe_controller_detail($nid, $params) {
  lai_xe_require_auth($params);
  $item = lai_xe_service_get_detail($nid);
  if (!$item) { lai_xe_respond_failed('Không tìm thấy lái xe'); }
  lai_xe_respond_success('Lấy chi tiết thành công', $item);
}

function lai_xe_controller_create($params) {
  lai_xe_require_auth($params);

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') { lai_xe_respond_failed('Tên lái xe là bắt buộc'); }

  $node = new stdClass();
  $node->type = LAI_XE_BUNDLE;
  node_object_prepare($node);
  $node->language = LANGUAGE_NONE;

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? lai_xe_encode_json_value($params['field_thong_tin_json']) : '';
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = lai_xe_parse_active(isset($params['field_hoat_dong']) ? $params['field_hoat_dong'] : 1);

  node_save($node);
  watchdog('lai_xe', 'Created lai xe @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  lai_xe_respond_success('Tạo lái xe thành công', lai_xe_format_node(node_load($node->nid)));
}

function lai_xe_controller_update($nid, $params) {
  lai_xe_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== LAI_XE_BUNDLE) { lai_xe_respond_failed('Không tìm thấy lái xe để cập nhật'); }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') { lai_xe_respond_failed('Tên lái xe là bắt buộc'); }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? lai_xe_encode_json_value($params['field_thong_tin_json']) : lai_xe_field_value($node, 'field_thong_tin_json', '');
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? lai_xe_parse_active($params['field_hoat_dong']) : lai_xe_field_value($node, 'field_hoat_dong', 1);

  node_save($node);
  watchdog('lai_xe', 'Updated lai xe @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  lai_xe_respond_success('Cập nhật lái xe thành công', lai_xe_format_node(node_load($node->nid)));
}

function lai_xe_controller_delete($nid, $params) {
  lai_xe_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== LAI_XE_BUNDLE) { lai_xe_respond_failed('Không tìm thấy lái xe để xoá'); }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('lai_xe', 'Soft deleted lai xe @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);
  lai_xe_respond_success('Xoá lái xe thành công', array('nid' => intval($node->nid), 'deleted' => TRUE));
}

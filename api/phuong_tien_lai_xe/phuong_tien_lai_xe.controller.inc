<?php

/**
 * @file
 * Request routing & controller functions cho phuong_tien_lai_xe API.
 */

function _ptlx_resolve_method($params) {
  if (isset($params['_method'])) {
    $m = strtoupper(trim($params['_method']));
    if (in_array($m, array('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))) { return $m; }
  }
  return $_SERVER['REQUEST_METHOD'];
}

function phuong_tien_lai_xe_route_collection() {
  $method = $_SERVER['REQUEST_METHOD'];
  if ($method === 'OPTIONS') { ptlx_cors_preflight(); return; }

  try {
    $params = ptlx_get_params();
    $method = _ptlx_resolve_method($params);

    if ($method === 'GET') { ptlx_controller_list($params); return; }
    if ($method === 'POST') { ptlx_controller_create($params); return; }
  }
  catch (Exception $e) {
    watchdog('phuong_tien_lai_xe', 'Collection error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    ptlx_respond_error($e->getMessage());
  }

  ptlx_respond_method_not_allowed('GET, POST');
}

function phuong_tien_lai_xe_route_item($nid) {
  $method = $_SERVER['REQUEST_METHOD'];
  if ($method === 'OPTIONS') { ptlx_cors_preflight(); return; }

  try {
    $params = ptlx_get_params();
    $method = _ptlx_resolve_method($params);

    if ($method === 'GET') { ptlx_controller_detail($nid, $params); return; }
    if ($method === 'PUT' || $method === 'PATCH') { ptlx_controller_update($nid, $params); return; }
    if ($method === 'DELETE') { ptlx_controller_delete($nid, $params); return; }
  }
  catch (Exception $e) {
    watchdog('phuong_tien_lai_xe', 'Item error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    ptlx_respond_error($e->getMessage());
  }

  ptlx_respond_method_not_allowed('GET, PUT, PATCH, DELETE');
}

function ptlx_controller_list($params) {
  ptlx_require_auth($params);
  ptlx_respond_success('Lấy danh sách thành công', ptlx_service_get_list($params));
}

function ptlx_controller_detail($nid, $params) {
  ptlx_require_auth($params);
  $item = ptlx_service_get_detail($nid);
  if (!$item) { ptlx_respond_failed('Không tìm thấy bản ghi PT-LX'); }
  ptlx_respond_success('Lấy chi tiết thành công', $item);
}

function ptlx_controller_create($params) {
  ptlx_require_auth($params);

  $lai_xe_nid = isset($params['field_uid_lai_xe']) ? intval($params['field_uid_lai_xe']) : 0;
  $phuong_tien_nid = isset($params['field_nid_phuong_tien']) ? intval($params['field_nid_phuong_tien']) : 0;

  if ($lai_xe_nid <= 0) { ptlx_respond_failed('Lái xe là bắt buộc'); }
  if ($phuong_tien_nid <= 0) { ptlx_respond_failed('Phương tiện là bắt buộc'); }

  $lai_xe = node_load($lai_xe_nid);
  if (!$lai_xe || $lai_xe->type !== 'lai_xe') { ptlx_respond_failed('Không tìm thấy lái xe'); }

  $phuong_tien = node_load($phuong_tien_nid);
  if (!$phuong_tien || $phuong_tien->type !== 'phuong_tien') { ptlx_respond_failed('Không tìm thấy phương tiện'); }

  ptlx_deactivate_old_assignments($lai_xe_nid);

  $node = new stdClass();
  $node->type = PTLX_BUNDLE;
  node_object_prepare($node);
  $node->language = LANGUAGE_NONE;

  $node->title = ptlx_generate_title($lai_xe_nid, $phuong_tien_nid);
  $node->field_uid_lai_xe[LANGUAGE_NONE][0]['target_id'] = $lai_xe_nid;
  $node->field_nid_phuong_tien[LANGUAGE_NONE][0]['target_id'] = $phuong_tien_nid;
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = ptlx_parse_active(isset($params['field_hoat_dong']) ? $params['field_hoat_dong'] : 1);

  node_save($node);
  watchdog('phuong_tien_lai_xe', 'Created ptlx @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  ptlx_respond_success('Tạo bản ghi PT-LX thành công', ptlx_format_node(node_load($node->nid)));
}

function ptlx_controller_update($nid, $params) {
  ptlx_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== PTLX_BUNDLE) { ptlx_respond_failed('Không tìm thấy bản ghi PT-LX để cập nhật'); }

  $lai_xe_nid = isset($params['field_uid_lai_xe']) ? intval($params['field_uid_lai_xe']) : 0;
  $phuong_tien_nid = isset($params['field_nid_phuong_tien']) ? intval($params['field_nid_phuong_tien']) : 0;

  if ($lai_xe_nid > 0) {
    $lai_xe = node_load($lai_xe_nid);
    if (!$lai_xe || $lai_xe->type !== 'lai_xe') { ptlx_respond_failed('Không tìm thấy lái xe'); }
    $node->field_uid_lai_xe[LANGUAGE_NONE][0]['target_id'] = $lai_xe_nid;
  }

  if ($phuong_tien_nid > 0) {
    $phuong_tien = node_load($phuong_tien_nid);
    if (!$phuong_tien || $phuong_tien->type !== 'phuong_tien') { ptlx_respond_failed('Không tìm thấy phương tiện'); }
    $node->field_nid_phuong_tien[LANGUAGE_NONE][0]['target_id'] = $phuong_tien_nid;
  }

  $final_lai_xe = isset($node->field_uid_lai_xe[LANGUAGE_NONE][0]['target_id']) ? intval($node->field_uid_lai_xe[LANGUAGE_NONE][0]['target_id']) : 0;
  $final_pt = isset($node->field_nid_phuong_tien[LANGUAGE_NONE][0]['target_id']) ? intval($node->field_nid_phuong_tien[LANGUAGE_NONE][0]['target_id']) : 0;
  $node->title = ptlx_generate_title($final_lai_xe, $final_pt);

  if (isset($params['field_hoat_dong'])) {
    $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = ptlx_parse_active($params['field_hoat_dong']);
  }

  node_save($node);
  watchdog('phuong_tien_lai_xe', 'Updated ptlx @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  ptlx_respond_success('Cập nhật bản ghi PT-LX thành công', ptlx_format_node(node_load($node->nid)));
}

function ptlx_controller_delete($nid, $params) {
  ptlx_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== PTLX_BUNDLE) { ptlx_respond_failed('Không tìm thấy bản ghi PT-LX để xoá'); }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('phuong_tien_lai_xe', 'Soft deleted ptlx @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);
  ptlx_respond_success('Xoá bản ghi PT-LX thành công', array('nid' => intval($node->nid), 'deleted' => TRUE));
}

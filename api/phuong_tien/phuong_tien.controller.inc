<?php

/**
 * @file
 * Request routing & controller functions cho phuong_tien API.
 */

/**
 * Resolve HTTP method từ params _method (worker override) hoặc SERVER.
 */
function _phuong_tien_resolve_method($params) {
  if (isset($params['_method'])) {
    $m = strtoupper(trim($params['_method']));
    if (in_array($m, array('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))) {
      return $m;
    }
  }
  return $_SERVER['REQUEST_METHOD'];
}

/**
 * Route: /api/phuong-tien
 */
function phuong_tien_route_collection() {
  $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'OPTIONS') {
    phuong_tien_cors_preflight();
    return;
  }

  try {
    $params = phuong_tien_get_params();
    $method = _phuong_tien_resolve_method($params);

    if ($method === 'GET') {
      phuong_tien_controller_list($params);
      return;
    }

    if ($method === 'POST') {
      phuong_tien_controller_create($params);
      return;
    }
  }
  catch (Exception $e) {
    watchdog('phuong_tien', 'Collection error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    phuong_tien_respond_error($e->getMessage());
  }

  phuong_tien_respond_method_not_allowed('GET, POST');
}

/**
 * Route: /api/phuong-tien/{nid}
 */
function phuong_tien_route_item($nid) {
  $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'OPTIONS') {
    phuong_tien_cors_preflight();
    return;
  }

  try {
    $params = phuong_tien_get_params();
    $method = _phuong_tien_resolve_method($params);

    if ($method === 'GET') {
      phuong_tien_controller_detail($nid, $params);
      return;
    }

    if ($method === 'PUT' || $method === 'PATCH') {
      phuong_tien_controller_update($nid, $params);
      return;
    }

    if ($method === 'DELETE') {
      phuong_tien_controller_delete($nid, $params);
      return;
    }
  }
  catch (Exception $e) {
    watchdog('phuong_tien', 'Item error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    phuong_tien_respond_error($e->getMessage());
  }

  phuong_tien_respond_method_not_allowed('GET, PUT, PATCH, DELETE');
}

/**
 * Controller: GET list.
 */
function phuong_tien_controller_list($params) {
  phuong_tien_require_auth($params);
  $data = phuong_tien_service_get_list($params);
  phuong_tien_respond_success('Lấy danh sách thành công', $data);
}

/**
 * Controller: GET detail.
 */
function phuong_tien_controller_detail($nid, $params) {
  phuong_tien_require_auth($params);
  $item = phuong_tien_service_get_detail($nid);

  if (!$item) {
    phuong_tien_respond_failed('Không tìm thấy phương tiện');
  }

  phuong_tien_respond_success('Lấy chi tiết thành công', $item);
}

/**
 * Controller: POST create.
 */
function phuong_tien_controller_create($params) {
  phuong_tien_require_auth($params);

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    phuong_tien_respond_failed('Biển kiểm soát là bắt buộc');
  }

  if (phuong_tien_title_exists($title)) {
    phuong_tien_respond_failed('Biển kiểm soát đã tồn tại');
  }

  $node = new stdClass();
  $node->type = PHUONG_TIEN_BUNDLE;
  node_object_prepare($node);
  $node->language = LANGUAGE_NONE;

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? phuong_tien_encode_json_value($params['field_thong_tin_json']) : '';
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = phuong_tien_parse_active(isset($params['field_hoat_dong']) ? $params['field_hoat_dong'] : 1);

  node_save($node);
  watchdog('phuong_tien', 'Created phuong tien @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  phuong_tien_respond_success('Tạo phương tiện thành công', phuong_tien_format_node(node_load($node->nid)));
}

/**
 * Controller: PUT update.
 */
function phuong_tien_controller_update($nid, $params) {
  phuong_tien_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== PHUONG_TIEN_BUNDLE) {
    phuong_tien_respond_failed('Không tìm thấy phương tiện để cập nhật');
  }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    phuong_tien_respond_failed('Biển kiểm soát là bắt buộc');
  }

  if (phuong_tien_title_exists($title, intval($nid))) {
    phuong_tien_respond_failed('Biển kiểm soát đã tồn tại');
  }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? phuong_tien_encode_json_value($params['field_thong_tin_json']) : phuong_tien_field_value($node, 'field_thong_tin_json', '');
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? phuong_tien_parse_active($params['field_hoat_dong']) : phuong_tien_field_value($node, 'field_hoat_dong', 1);

  node_save($node);
  watchdog('phuong_tien', 'Updated phuong tien @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  phuong_tien_respond_success('Cập nhật phương tiện thành công', phuong_tien_format_node(node_load($node->nid)));
}

/**
 * Controller: DELETE soft-delete.
 */
function phuong_tien_controller_delete($nid, $params) {
  phuong_tien_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== PHUONG_TIEN_BUNDLE) {
    phuong_tien_respond_failed('Không tìm thấy phương tiện để xoá');
  }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('phuong_tien', 'Soft deleted phuong tien @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);

  phuong_tien_respond_success('Xoá phương tiện thành công', array('nid' => intval($node->nid), 'deleted' => TRUE));
}

<?php

/**
 * @file
 * Request routing & controller functions cho hop_dong API.
 */

function _hop_dong_resolve_method($params) {
  if (isset($params['_method'])) {
    $m = strtoupper(trim($params['_method']));
    if (in_array($m, array('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))) { return $m; }
  }
  return $_SERVER['REQUEST_METHOD'];
}

function hop_dong_route_collection() {
  $method = $_SERVER['REQUEST_METHOD'];
  if ($method === 'OPTIONS') { hop_dong_cors_preflight(); return; }

  try {
    $params = hop_dong_get_params();
    $method = _hop_dong_resolve_method($params);

    if ($method === 'GET') { hop_dong_controller_list($params); return; }
    if ($method === 'POST') { hop_dong_controller_create($params); return; }
  }
  catch (Exception $e) {
    watchdog('hop_dong', 'Collection error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    hop_dong_respond_error($e->getMessage());
  }

  hop_dong_respond_method_not_allowed('GET, POST');
}

function hop_dong_route_item($nid) {
  $method = $_SERVER['REQUEST_METHOD'];
  if ($method === 'OPTIONS') { hop_dong_cors_preflight(); return; }

  try {
    $params = hop_dong_get_params();
    $method = _hop_dong_resolve_method($params);

    if ($method === 'GET') { hop_dong_controller_detail($nid, $params); return; }
    if ($method === 'PUT' || $method === 'PATCH') { hop_dong_controller_update($nid, $params); return; }
    if ($method === 'DELETE') { hop_dong_controller_delete($nid, $params); return; }
  }
  catch (Exception $e) {
    watchdog('hop_dong', 'Item error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    hop_dong_respond_error($e->getMessage());
  }

  hop_dong_respond_method_not_allowed('GET, PUT, PATCH, DELETE');
}

function hop_dong_controller_list($params) {
  hop_dong_require_auth($params);
  hop_dong_respond_success('Lấy danh sách thành công', hop_dong_service_get_list($params));
}

function hop_dong_controller_detail($nid, $params) {
  hop_dong_require_auth($params);
  $item = hop_dong_service_get_detail($nid);
  if (!$item) { hop_dong_respond_failed('Không tìm thấy hợp đồng'); }
  hop_dong_respond_success('Lấy chi tiết thành công', $item);
}

function hop_dong_controller_create($params) {
  hop_dong_require_auth($params);

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') { hop_dong_respond_failed('Tiêu đề hợp đồng là bắt buộc'); }

  $thong_tin = array();
  if (isset($params['field_thong_tin_json'])) {
    if (is_array($params['field_thong_tin_json'])) {
      $thong_tin = $params['field_thong_tin_json'];
    } else {
      $decoded = json_decode((string) $params['field_thong_tin_json'], TRUE);
      if (is_array($decoded)) { $thong_tin = $decoded; }
    }
  }

  $nid_kh = isset($thong_tin['nid_ben_thu_ba']) ? intval($thong_tin['nid_ben_thu_ba']) : 0;
  if ($nid_kh > 0) {
    hop_dong_validate_khach_hang($nid_kh);
  }

  $nid_nvkd = isset($thong_tin['nid_nhan_vien_kinh_doanh']) ? intval($thong_tin['nid_nhan_vien_kinh_doanh']) : 0;
  if ($nid_nvkd > 0) {
    hop_dong_validate_nvkd($nid_nvkd);
  }

  $node = new stdClass();
  $node->type = HOP_DONG_BUNDLE;
  node_object_prepare($node);
  $node->language = LANGUAGE_NONE;

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = !empty($thong_tin) ? drupal_json_encode($thong_tin) : '';
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = hop_dong_parse_active(isset($params['field_hoat_dong']) ? $params['field_hoat_dong'] : 1);

  node_save($node);
  watchdog('hop_dong', 'Created hop dong @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  hop_dong_respond_success('Tạo hợp đồng thành công', hop_dong_format_node(node_load($node->nid)));
}

function hop_dong_controller_update($nid, $params) {
  hop_dong_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== HOP_DONG_BUNDLE) { hop_dong_respond_failed('Không tìm thấy hợp đồng để cập nhật'); }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') { hop_dong_respond_failed('Tiêu đề hợp đồng là bắt buộc'); }

  $current_json_raw = hop_dong_field_value($node, 'field_thong_tin_json', '');
  $current_json = hop_dong_decode_json($current_json_raw);

  $new_thong_tin = $current_json;
  if (isset($params['field_thong_tin_json'])) {
    if (is_array($params['field_thong_tin_json'])) {
      $new_thong_tin = array_merge($current_json, $params['field_thong_tin_json']);
    } else {
      $decoded = json_decode((string) $params['field_thong_tin_json'], TRUE);
      if (is_array($decoded)) {
        $new_thong_tin = array_merge($current_json, $decoded);
      }
    }
  }

  if (isset($new_thong_tin['nid_ben_thu_ba'])) {
    hop_dong_validate_khach_hang($new_thong_tin['nid_ben_thu_ba']);
  }
  if (isset($new_thong_tin['nid_nhan_vien_kinh_doanh'])) {
    hop_dong_validate_nvkd($new_thong_tin['nid_nhan_vien_kinh_doanh']);
  }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = drupal_json_encode($new_thong_tin);
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? hop_dong_parse_active($params['field_hoat_dong']) : hop_dong_field_value($node, 'field_hoat_dong', 1);

  node_save($node);
  watchdog('hop_dong', 'Updated hop dong @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  hop_dong_respond_success('Cập nhật hợp đồng thành công', hop_dong_format_node(node_load($node->nid)));
}

function hop_dong_controller_delete($nid, $params) {
  hop_dong_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== HOP_DONG_BUNDLE) { hop_dong_respond_failed('Không tìm thấy hợp đồng để xoá'); }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('hop_dong', 'Soft deleted hop dong @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);
  hop_dong_respond_success('Xoá hợp đồng thành công', array('nid' => intval($node->nid), 'deleted' => TRUE));
}

<?php

/**
 * @file
 * Request routing & controller functions cho danh_muc API.
 */

/**
 * Resolve HTTP method từ params _method (worker override) hoặc SERVER.
 */
function _danh_muc_resolve_method($params) {
  if (isset($params['_method'])) {
    $m = strtoupper(trim($params['_method']));
    if (in_array($m, array('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))) {
      return $m;
    }
  }
  return $_SERVER['REQUEST_METHOD'];
}

/**
 * Route: /api/danh-muc
 */
function danh_muc_route_collection() {
  $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'OPTIONS') {
    danh_muc_cors_preflight();
    return;
  }

  try {
    $params = danh_muc_get_params();
    $method = _danh_muc_resolve_method($params);

    if ($method === 'GET') {
      danh_muc_controller_list($params);
      return;
    }

    if ($method === 'POST') {
      danh_muc_controller_create($params);
      return;
    }
  }
  catch (Exception $e) {
    watchdog('danh_muc', 'Collection error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    danh_muc_respond_error($e->getMessage());
  }

  danh_muc_respond_method_not_allowed('GET, POST');
}

/**
 * Route: /api/danh-muc/{nid}
 */
function danh_muc_route_item($nid) {
  $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'OPTIONS') {
    danh_muc_cors_preflight();
    return;
  }

  try {
    $params = danh_muc_get_params();
    $method = _danh_muc_resolve_method($params);

    if ($method === 'GET') {
      danh_muc_controller_detail($nid, $params);
      return;
    }

    if ($method === 'PUT' || $method === 'PATCH') {
      danh_muc_controller_update($nid, $params);
      return;
    }

    if ($method === 'DELETE') {
      danh_muc_controller_delete($nid, $params);
      return;
    }
  }
  catch (Exception $e) {
    watchdog('danh_muc', 'Item error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    danh_muc_respond_error($e->getMessage());
  }

  danh_muc_respond_method_not_allowed('GET, PUT, PATCH, DELETE');
}

/**
 * Controller: GET list.
 */
function danh_muc_controller_list($params) {
  danh_muc_require_auth($params);
  $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
  $limit = isset($params['limit']) ? max(1, intval($params['limit'])) : DANH_MUC_DEFAULT_LIMIT;
  $limit = min($limit, DANH_MUC_MAX_LIMIT);
  $offset = ($page - 1) * $limit;

  $query = danh_muc_build_list_query($params);
  $query->fields('n', array('nid', 'title', 'created', 'changed'));
  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');
  $query->addField('fsl', 'field_so_luong_value', 'so_luong');

  danh_muc_apply_sort($query, $params);
  $query->range($offset, $limit);

  $rows = $query->execute()->fetchAllAssoc('nid');

  $count_query = danh_muc_build_list_query($params);
  $count_query->addExpression('COUNT(DISTINCT n.nid)', 'total');
  $total = intval($count_query->execute()->fetchField());

  $items = array();
  foreach ($rows as $row) {
    $items[] = danh_muc_format_row($row);
  }

  danh_muc_respond_success('Lấy danh sách thành công', array(
    'items' => $items,
    'pagination' => array(
      'page' => $page,
      'limit' => $limit,
      'total' => $total,
      'total_pages' => $limit > 0 ? intval(ceil($total / $limit)) : 0,
    ),
  ));
}

/**
 * Controller: GET detail.
 */
function danh_muc_controller_detail($nid, $params) {
  danh_muc_require_auth($params);

  $query = db_select('node', 'n')
    ->fields('n', array('nid', 'title', 'created', 'changed'))
    ->condition('n.nid', intval($nid))
    ->condition('n.type', DANH_MUC_BUNDLE);

  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $query->leftJoin('field_data_field_so_luong', 'fsl', "n.nid = fsl.entity_id AND fsl.entity_type = 'node' AND fsl.deleted = 0");

  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');
  $query->addField('fsl', 'field_so_luong_value', 'so_luong');

  $row = $query->execute()->fetchObject();

  if (!$row) {
    danh_muc_respond_failed('Không tìm thấy danh mục');
  }

  if (!danh_muc_node_is_active($row)) {
    danh_muc_respond_failed('Không tìm thấy danh mục');
  }

  danh_muc_respond_success('Lấy chi tiết thành công', danh_muc_format_row($row));
}

/**
 * Controller: POST create.
 */
function danh_muc_controller_create($params) {
  danh_muc_require_auth($params);

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    danh_muc_respond_failed('Tên danh mục là bắt buộc');
  }

  if (danh_muc_title_exists($title)) {
    danh_muc_respond_failed('Tên danh mục đã tồn tại');
  }

  $node = new stdClass();
  $node->type = DANH_MUC_BUNDLE;
  node_object_prepare($node);
  $node->language = LANGUAGE_NONE;

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? danh_muc_encode_json_value($params['field_thong_tin_json']) : '';
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = danh_muc_parse_active(isset($params['field_hoat_dong']) ? $params['field_hoat_dong'] : 1);
  $node->field_so_luong[LANGUAGE_NONE][0]['value'] = isset($params['field_so_luong']) ? floatval($params['field_so_luong']) : 0;

  node_save($node);
  watchdog('danh_muc', 'Created danh muc @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  danh_muc_respond_success('Tạo danh mục thành công', danh_muc_format_node(node_load($node->nid)));
}

/**
 * Controller: PUT update.
 */
function danh_muc_controller_update($nid, $params) {
  danh_muc_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== DANH_MUC_BUNDLE) {
    danh_muc_respond_failed('Không tìm thấy danh mục để cập nhật');
  }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    danh_muc_respond_failed('Tên danh mục là bắt buộc');
  }

  if (danh_muc_title_exists($title, intval($nid))) {
    danh_muc_respond_failed('Tên danh mục đã tồn tại');
  }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? danh_muc_encode_json_value($params['field_thong_tin_json']) : danh_muc_field_value($node, 'field_thong_tin_json', '');
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? danh_muc_parse_active($params['field_hoat_dong']) : danh_muc_field_value($node, 'field_hoat_dong', 1);
  $node->field_so_luong[LANGUAGE_NONE][0]['value'] = isset($params['field_so_luong']) ? floatval($params['field_so_luong']) : danh_muc_field_value($node, 'field_so_luong', 0);

  node_save($node);
  watchdog('danh_muc', 'Updated danh muc @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  danh_muc_respond_success('Cập nhật danh mục thành công', danh_muc_format_node(node_load($node->nid)));
}

/**
 * Controller: DELETE soft-delete.
 */
function danh_muc_controller_delete($nid, $params) {
  danh_muc_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== DANH_MUC_BUNDLE) {
    danh_muc_respond_failed('Không tìm thấy danh mục để xoá');
  }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('danh_muc', 'Soft deleted danh muc @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);

  danh_muc_respond_success('Xoá danh mục thành công', array('nid' => intval($node->nid), 'deleted' => TRUE));
}

<?php

function _ben_thu_ba_resolve_method($params) {
  if (isset($params['_method'])) {
    $m = strtoupper(trim($params['_method']));
    if (in_array($m, array('GET', 'POST', 'PUT', 'PATCH', 'DELETE'))) { return $m; }
  }
  return $_SERVER['REQUEST_METHOD'];
}

function ben_thu_ba_route_collection() {
  $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'OPTIONS') {
    ben_thu_ba_cors_preflight();
    return;
  }

  try {
    $params = ben_thu_ba_get_params();
    $method = _ben_thu_ba_resolve_method($params);

    if ($method === 'GET') { ben_thu_ba_controller_list($params); return; }
    if ($method === 'POST') { ben_thu_ba_controller_create($params); return; }
  }
  catch (Exception $e) {
    watchdog('ben_thu_ba', 'Collection error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    ben_thu_ba_respond_error($e->getMessage());
  }

  ben_thu_ba_respond_method_not_allowed('GET, POST');
}

function ben_thu_ba_route_item($nid) {
  $method = $_SERVER['REQUEST_METHOD'];

  if ($method === 'OPTIONS') {
    ben_thu_ba_cors_preflight();
    return;
  }

  try {
    $params = ben_thu_ba_get_params();
    $method = _ben_thu_ba_resolve_method($params);

    if ($method === 'GET') { ben_thu_ba_controller_detail($nid, $params); return; }
    if ($method === 'PUT' || $method === 'PATCH') { ben_thu_ba_controller_update($nid, $params); return; }
    if ($method === 'DELETE') { ben_thu_ba_controller_delete($nid, $params); return; }
  }
  catch (Exception $e) {
    watchdog('ben_thu_ba', 'Item error: @msg', array('@msg' => $e->getMessage()), WATCHDOG_ERROR);
    ben_thu_ba_respond_error($e->getMessage());
  }

  ben_thu_ba_respond_method_not_allowed('GET, PUT, PATCH, DELETE');
}

function ben_thu_ba_controller_list($params) {
  ben_thu_ba_require_auth($params);

  $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
  $limit = isset($params['limit']) ? max(1, intval($params['limit'])) : BEN_THU_BA_DEFAULT_LIMIT;
  $limit = min($limit, BEN_THU_BA_MAX_LIMIT);
  $offset = ($page - 1) * $limit;

  $query = ben_thu_ba_build_list_query($params);
  $query->fields('n', array('nid', 'title', 'created', 'changed'));
  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');
  $query->addField('fpl', 'field_phan_loai_value', 'phan_loai');
  $query->addField('fdb', 'field_dob_value', 'dob');

  ben_thu_ba_apply_sort($query, $params);
  $query->range($offset, $limit);

  $rows = $query->execute()->fetchAllAssoc('nid');

  $count_query = ben_thu_ba_build_list_query($params);
  $count_query->addExpression('COUNT(DISTINCT n.nid)', 'total');
  $total = intval($count_query->execute()->fetchField());

  $items = array();
  foreach ($rows as $row) {
    $items[] = ben_thu_ba_format_row($row);
  }

  ben_thu_ba_respond_success('Lấy danh sách thành công', array(
    'items' => $items,
    'pagination' => array(
      'page' => $page,
      'limit' => $limit,
      'total' => $total,
      'total_pages' => $limit > 0 ? intval(ceil($total / $limit)) : 0,
    ),
  ));
}

function ben_thu_ba_controller_detail($nid, $params) {
  ben_thu_ba_require_auth($params);

  $query = db_select('node', 'n')
    ->fields('n', array('nid', 'title', 'created', 'changed'))
    ->condition('n.nid', intval($nid))
    ->condition('n.type', BEN_THU_BA_BUNDLE);

  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $query->leftJoin('field_data_field_phan_loai', 'fpl', "n.nid = fpl.entity_id AND fpl.entity_type = 'node' AND fpl.deleted = 0");
  $query->leftJoin('field_data_field_dob', 'fdb', "n.nid = fdb.entity_id AND fdb.entity_type = 'node' AND fdb.deleted = 0");

  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');
  $query->addField('fpl', 'field_phan_loai_value', 'phan_loai');
  $query->addField('fdb', 'field_dob_value', 'dob');

  $row = $query->execute()->fetchObject();

  if (!$row) {
    ben_thu_ba_respond_failed('Không tìm thấy bên thứ ba');
  }

  if (!ben_thu_ba_node_is_active($row)) {
    ben_thu_ba_respond_failed('Không tìm thấy bên thứ ba');
  }

  ben_thu_ba_respond_success('Lấy chi tiết thành công', ben_thu_ba_format_row($row));
}

function ben_thu_ba_controller_create($params) {
  ben_thu_ba_require_auth($params);

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    ben_thu_ba_respond_failed('Tên bên thứ ba là bắt buộc');
  }

  if (ben_thu_ba_title_exists($title)) {
    ben_thu_ba_respond_failed('Tên bên thứ ba đã tồn tại');
  }

  $node = new stdClass();
  $node->type = BEN_THU_BA_BUNDLE;
  node_object_prepare($node);
  $node->language = LANGUAGE_NONE;

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? ben_thu_ba_encode_json_value($params['field_thong_tin_json']) : '';
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = ben_thu_ba_parse_active(isset($params['field_hoat_dong']) ? $params['field_hoat_dong'] : 1);
  $node->field_phan_loai[LANGUAGE_NONE][0]['value'] = isset($params['field_phan_loai']) ? trim((string) $params['field_phan_loai']) : '';
  $node->field_dob[LANGUAGE_NONE][0]['value'] = isset($params['field_dob']) ? intval($params['field_dob']) : 0;

  node_save($node);
  watchdog('ben_thu_ba', 'Created ben thu ba @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  ben_thu_ba_respond_success('Tạo bên thứ ba thành công', ben_thu_ba_format_node(node_load($node->nid)));
}

function ben_thu_ba_controller_update($nid, $params) {
  ben_thu_ba_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== BEN_THU_BA_BUNDLE) {
    ben_thu_ba_respond_failed('Không tìm thấy bên thứ ba để cập nhật');
  }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    ben_thu_ba_respond_failed('Tên bên thứ ba là bắt buộc');
  }

  if (ben_thu_ba_title_exists($title, intval($nid))) {
    ben_thu_ba_respond_failed('Tên bên thứ ba đã tồn tại');
  }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? ben_thu_ba_encode_json_value($params['field_thong_tin_json']) : $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'];
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? ben_thu_ba_parse_active($params['field_hoat_dong']) : $node->field_hoat_dong[LANGUAGE_NONE][0]['value'];
  $node->field_phan_loai[LANGUAGE_NONE][0]['value'] = isset($params['field_phan_loai']) ? trim((string) $params['field_phan_loai']) : (isset($node->field_phan_loai[LANGUAGE_NONE][0]['value']) ? $node->field_phan_loai[LANGUAGE_NONE][0]['value'] : '');
  $node->field_dob[LANGUAGE_NONE][0]['value'] = isset($params['field_dob']) ? intval($params['field_dob']) : (isset($node->field_dob[LANGUAGE_NONE][0]['value']) ? $node->field_dob[LANGUAGE_NONE][0]['value'] : 0);

  node_save($node);
  watchdog('ben_thu_ba', 'Updated ben thu ba @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  ben_thu_ba_respond_success('Cập nhật bên thứ ba thành công', ben_thu_ba_format_node(node_load($node->nid)));
}

function ben_thu_ba_controller_delete($nid, $params) {
  ben_thu_ba_require_auth($params);

  $node = node_load(intval($nid));
  if (!$node || $node->type !== BEN_THU_BA_BUNDLE) {
    ben_thu_ba_respond_failed('Không tìm thấy bên thứ ba để xoá');
  }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('ben_thu_ba', 'Soft deleted ben thu ba @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);

  ben_thu_ba_respond_success('Xoá bên thứ ba thành công', array('nid' => intval($node->nid), 'deleted' => TRUE));
}

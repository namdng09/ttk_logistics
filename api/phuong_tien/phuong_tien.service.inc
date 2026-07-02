<?php

/**
 * @file
 * Business logic layer cho phuong_tien API.
 */

/**
 * Lấy danh sách phương tiện có phân trang, sort, filter.
 */
function phuong_tien_service_get_list($params = array()) {
  $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
  $limit = isset($params['limit']) ? max(1, intval($params['limit'])) : PHUONG_TIEN_DEFAULT_LIMIT;
  $limit = min($limit, PHUONG_TIEN_MAX_LIMIT);
  $offset = ($page - 1) * $limit;

  $query = phuong_tien_build_list_query($params);
  $query->fields('n', array('nid', 'title', 'created', 'changed'));
  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');

  phuong_tien_apply_sort($query, $params);
  $query->range($offset, $limit);

  $rows = $query->execute()->fetchAllAssoc('nid');

  $count_query = phuong_tien_build_list_query($params);
  $count_query->addExpression('COUNT(DISTINCT n.nid)', 'total');
  $total = intval($count_query->execute()->fetchField());

  $items = array();
  foreach ($rows as $row) {
    $items[] = phuong_tien_format_row($row);
  }

  return array(
    'items' => $items,
    'pagination' => array(
      'page' => $page,
      'limit' => $limit,
      'total' => $total,
      'total_pages' => $limit > 0 ? intval(ceil($total / $limit)) : 0,
    ),
  );
}

/**
 * Lấy chi tiết 1 phương tiện theo nid (dùng db_select).
 */
function phuong_tien_service_get_detail($nid) {
  $query = db_select('node', 'n')
    ->fields('n', array('nid', 'title', 'created', 'changed'))
    ->condition('n.nid', intval($nid))
    ->condition('n.type', PHUONG_TIEN_BUNDLE);

  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");

  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');

  $row = $query->execute()->fetchObject();

  if (!$row) {
    return NULL;
  }
  if (!phuong_tien_node_is_active($row)) {
    return NULL;
  }
  return phuong_tien_format_row($row);
}

/**
 * Tạo mới phương tiện.
 */
function phuong_tien_service_create($params) {
  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    throw new Exception('Biển kiểm soát là bắt buộc');
  }

  if (phuong_tien_title_exists($title)) {
    throw new Exception('Biển kiểm soát đã tồn tại');
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

  return phuong_tien_format_node(node_load($node->nid));
}

/**
 * Cập nhật phương tiện.
 */
function phuong_tien_service_update($nid, $params) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== PHUONG_TIEN_BUNDLE) {
    throw new Exception('Không tìm thấy phương tiện để cập nhật');
  }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    throw new Exception('Biển kiểm soát là bắt buộc');
  }

  if (phuong_tien_title_exists($title, intval($nid))) {
    throw new Exception('Biển kiểm soát đã tồn tại');
  }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? phuong_tien_encode_json_value($params['field_thong_tin_json']) : phuong_tien_field_value($node, 'field_thong_tin_json', '');
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? phuong_tien_parse_active($params['field_hoat_dong']) : phuong_tien_field_value($node, 'field_hoat_dong', 1);

  node_save($node);
  watchdog('phuong_tien', 'Updated phuong tien @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  return phuong_tien_format_node(node_load($node->nid));
}

/**
 * Soft-delete phương tiện.
 */
function phuong_tien_service_delete($nid) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== PHUONG_TIEN_BUNDLE) {
    throw new Exception('Không tìm thấy phương tiện để xoá');
  }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('phuong_tien', 'Soft deleted phuong tien @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);

  return array('nid' => intval($node->nid), 'deleted' => TRUE);
}

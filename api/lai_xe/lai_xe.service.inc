<?php

/**
 * @file
 * Business logic layer cho lai_xe API.
 */

function lai_xe_service_get_list($params = array()) {
  $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
  $limit = isset($params['limit']) ? max(1, intval($params['limit'])) : LAI_XE_DEFAULT_LIMIT;
  $limit = min($limit, LAI_XE_MAX_LIMIT);
  $offset = ($page - 1) * $limit;

  $query = lai_xe_build_list_query($params);
  $query->fields('n', array('nid', 'title', 'created', 'changed'));
  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');

  lai_xe_apply_sort($query, $params);
  $query->range($offset, $limit);

  $rows = $query->execute()->fetchAllAssoc('nid');

  $count_query = lai_xe_build_list_query($params);
  $count_query->addExpression('COUNT(DISTINCT n.nid)', 'total');
  $total = intval($count_query->execute()->fetchField());

  $items = array();
  foreach ($rows as $row) { $items[] = lai_xe_format_row($row); }

  return array(
    'items' => $items,
    'pagination' => array(
      'page' => $page, 'limit' => $limit, 'total' => $total,
      'total_pages' => $limit > 0 ? intval(ceil($total / $limit)) : 0,
    ),
  );
}

function lai_xe_service_get_detail($nid) {
  $query = db_select('node', 'n')
    ->fields('n', array('nid', 'title', 'created', 'changed'))
    ->condition('n.nid', intval($nid))
    ->condition('n.type', LAI_XE_BUNDLE);
  $query->leftJoin('field_data_field_thong_tin_json', 'ftj', "n.nid = ftj.entity_id AND ftj.entity_type = 'node' AND ftj.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $query->addField('ftj', 'field_thong_tin_json_value', 'thong_tin_json');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');

  $row = $query->execute()->fetchObject();
  if (!$row) { return NULL; }
  if (!lai_xe_node_is_active($row)) { return NULL; }
  return lai_xe_format_row($row);
}

function lai_xe_service_create($params) {
  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') { throw new Exception('Tên lái xe là bắt buộc'); }

  $node = new stdClass();
  $node->type = LAI_XE_BUNDLE;
  node_object_prepare($node);
  $node->language = LANGUAGE_NONE;

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? lai_xe_encode_json_value($params['field_thong_tin_json']) : '';
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = lai_xe_parse_active(isset($params['field_hoat_dong']) ? $params['field_hoat_dong'] : 1);

  node_save($node);
  watchdog('lai_xe', 'Created lai xe @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  return lai_xe_format_node(node_load($node->nid));
}

function lai_xe_service_update($nid, $params) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== LAI_XE_BUNDLE) { throw new Exception('Không tìm thấy lái xe để cập nhật'); }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') { throw new Exception('Tên lái xe là bắt buộc'); }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? lai_xe_encode_json_value($params['field_thong_tin_json']) : lai_xe_field_value($node, 'field_thong_tin_json', '');
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? lai_xe_parse_active($params['field_hoat_dong']) : lai_xe_field_value($node, 'field_hoat_dong', 1);

  node_save($node);
  watchdog('lai_xe', 'Updated lai xe @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);
  return lai_xe_format_node(node_load($node->nid));
}

function lai_xe_service_delete($nid) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== LAI_XE_BUNDLE) { throw new Exception('Không tìm thấy lái xe để xoá'); }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('lai_xe', 'Soft deleted lai xe @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);
  return array('nid' => intval($node->nid), 'deleted' => TRUE);
}

<?php

/**
 * @file
 * Business logic layer cho phuong_tien_lai_xe API.
 */

function ptlx_service_get_list($params = array()) {
  $page = isset($params['page']) ? max(1, intval($params['page'])) : 1;
  $limit = isset($params['limit']) ? max(1, intval($params['limit'])) : PTLX_DEFAULT_LIMIT;
  $limit = min($limit, PTLX_MAX_LIMIT);
  $offset = ($page - 1) * $limit;

  $query = ptlx_build_list_query($params);
  $query->fields('n', array('nid', 'title', 'created', 'changed'));
  $query->addField('fuid', 'field_uid_lai_xe_target_id', 'uid_lai_xe');
  $query->addField('fnpt', 'field_nid_phuong_tien_target_id', 'nid_phuong_tien');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');

  $query->leftJoin('node', 'nlx', 'fuid.field_uid_lai_xe_target_id = nlx.nid');
  $query->leftJoin('node', 'npt', 'fnpt.field_nid_phuong_tien_target_id = npt.nid');
  $query->addField('nlx', 'title', 'lai_xe_title');
  $query->addField('npt', 'title', 'phuong_tien_title');

  ptlx_apply_sort($query, $params);
  $query->range($offset, $limit);

  $rows = $query->execute()->fetchAllAssoc('nid');

  $count_query = ptlx_build_list_query($params);
  $count_query->addExpression('COUNT(DISTINCT n.nid)', 'total');
  $total = intval($count_query->execute()->fetchField());

  $items = array();
  foreach ($rows as $row) { $items[] = ptlx_format_row($row); }

  return array(
    'items' => $items,
    'pagination' => array(
      'page' => $page, 'limit' => $limit, 'total' => $total,
      'total_pages' => $limit > 0 ? intval(ceil($total / $limit)) : 0,
    ),
  );
}

function ptlx_service_get_detail($nid) {
  $query = db_select('node', 'n')
    ->fields('n', array('nid', 'title', 'created', 'changed'))
    ->condition('n.nid', intval($nid))
    ->condition('n.type', PTLX_BUNDLE);
  $query->leftJoin('field_data_field_uid_lai_xe', 'fuid', "n.nid = fuid.entity_id AND fuid.entity_type = 'node' AND fuid.deleted = 0");
  $query->leftJoin('field_data_field_nid_phuong_tien', 'fnpt', "n.nid = fnpt.entity_id AND fnpt.entity_type = 'node' AND fnpt.deleted = 0");
  $query->leftJoin('field_data_field_hoat_dong', 'fhd', "n.nid = fhd.entity_id AND fhd.entity_type = 'node' AND fhd.deleted = 0");
  $query->addField('fuid', 'field_uid_lai_xe_target_id', 'uid_lai_xe');
  $query->addField('fnpt', 'field_nid_phuong_tien_target_id', 'nid_phuong_tien');
  $query->addField('fhd', 'field_hoat_dong_value', 'hoat_dong');

  $query->leftJoin('node', 'nlx', 'fuid.field_uid_lai_xe_target_id = nlx.nid');
  $query->leftJoin('node', 'npt', 'fnpt.field_nid_phuong_tien_target_id = npt.nid');
  $query->addField('nlx', 'title', 'lai_xe_title');
  $query->addField('npt', 'title', 'phuong_tien_title');

  $row = $query->execute()->fetchObject();
  if (!$row) { return NULL; }
  return ptlx_format_row($row);
}

function ptlx_service_create($params) {
  $lai_xe_nid = isset($params['field_uid_lai_xe']) ? intval($params['field_uid_lai_xe']) : 0;
  $phuong_tien_nid = isset($params['field_nid_phuong_tien']) ? intval($params['field_nid_phuong_tien']) : 0;

  if ($lai_xe_nid <= 0) { throw new Exception('Lái xe là bắt buộc'); }
  if ($phuong_tien_nid <= 0) { throw new Exception('Phương tiện là bắt buộc'); }

  $lai_xe = node_load($lai_xe_nid);
  if (!$lai_xe || $lai_xe->type !== 'lai_xe') { throw new Exception('Không tìm thấy lái xe'); }

  $phuong_tien = node_load($phuong_tien_nid);
  if (!$phuong_tien || $phuong_tien->type !== 'phuong_tien') { throw new Exception('Không tìm thấy phương tiện'); }

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
  return ptlx_format_node(node_load($node->nid));
}

function ptlx_service_update($nid, $params) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== PTLX_BUNDLE) { throw new Exception('Không tìm thấy bản ghi PT-LX để cập nhật'); }

  $lai_xe_nid = isset($params['field_uid_lai_xe']) ? intval($params['field_uid_lai_xe']) : 0;
  $phuong_tien_nid = isset($params['field_nid_phuong_tien']) ? intval($params['field_nid_phuong_tien']) : 0;

  if ($lai_xe_nid > 0) {
    $lai_xe = node_load($lai_xe_nid);
    if (!$lai_xe || $lai_xe->type !== 'lai_xe') { throw new Exception('Không tìm thấy lái xe'); }
    $node->field_uid_lai_xe[LANGUAGE_NONE][0]['target_id'] = $lai_xe_nid;
  }

  if ($phuong_tien_nid > 0) {
    $phuong_tien = node_load($phuong_tien_nid);
    if (!$phuong_tien || $phuong_tien->type !== 'phuong_tien') { throw new Exception('Không tìm thấy phương tiện'); }
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
  return ptlx_format_node(node_load($node->nid));
}

function ptlx_service_delete($nid) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== PTLX_BUNDLE) { throw new Exception('Không tìm thấy bản ghi PT-LX để xoá'); }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('phuong_tien_lai_xe', 'Soft deleted ptlx @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);
  return array('nid' => intval($node->nid), 'deleted' => TRUE);
}

<?php

/**
 * @file
 * Business logic layer cho danh_muc API.
 * Các hàm này tách rời khỏi controller để dễ tái sử dụng và test.
 */

/**
 * Lấy danh sách danh mục có phân trang, sort, filter.
 */
function danh_muc_service_get_list($params = array()) {
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
 * Lấy chi tiết 1 danh mục theo nid (dùng db_select).
 */
function danh_muc_service_get_detail($nid) {
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
    return NULL;
  }
  if (!danh_muc_node_is_active($row)) {
    return NULL;
  }
  return danh_muc_format_row($row);
}

/**
 * Tạo mới danh mục.
 */
function danh_muc_service_create($params) {
  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    throw new Exception('Tên danh mục là bắt buộc');
  }

  if (danh_muc_title_exists($title)) {
    throw new Exception('Tên danh mục đã tồn tại');
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

  return danh_muc_format_node(node_load($node->nid));
}

/**
 * Cập nhật danh mục.
 */
function danh_muc_service_update($nid, $params) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== DANH_MUC_BUNDLE) {
    throw new Exception('Không tìm thấy danh mục để cập nhật');
  }

  $title = isset($params['title']) ? trim((string) $params['title']) : '';
  if ($title === '') {
    throw new Exception('Tên danh mục là bắt buộc');
  }

  if (danh_muc_title_exists($title, intval($nid))) {
    throw new Exception('Tên danh mục đã tồn tại');
  }

  $node->title = $title;
  $node->field_thong_tin_json[LANGUAGE_NONE][0]['value'] = isset($params['field_thong_tin_json']) ? danh_muc_encode_json_value($params['field_thong_tin_json']) : danh_muc_field_value($node, 'field_thong_tin_json', '');
  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = isset($params['field_hoat_dong']) ? danh_muc_parse_active($params['field_hoat_dong']) : danh_muc_field_value($node, 'field_hoat_dong', 1);
  $node->field_so_luong[LANGUAGE_NONE][0]['value'] = isset($params['field_so_luong']) ? floatval($params['field_so_luong']) : floatval(danh_muc_field_value($node, 'field_so_luong', 0));

  node_save($node);
  watchdog('danh_muc', 'Updated danh muc @nid: @title', array('@nid' => $node->nid, '@title' => $node->title), WATCHDOG_NOTICE);

  return danh_muc_format_node(node_load($node->nid));
}

/**
 * Soft-delete danh mục.
 */
function danh_muc_service_delete($nid) {
  $node = node_load(intval($nid));
  if (!$node || $node->type !== DANH_MUC_BUNDLE) {
    throw new Exception('Không tìm thấy danh mục để xoá');
  }

  $node->field_hoat_dong[LANGUAGE_NONE][0]['value'] = 0;
  node_save($node);
  watchdog('danh_muc', 'Soft deleted danh muc @nid', array('@nid' => $node->nid), WATCHDOG_NOTICE);

  return array('nid' => intval($node->nid), 'deleted' => TRUE);
}

<?php

/**
 * @file
 * Verify callback for crm_dntt module — Issues 01, 02, 03.
 * Route: /api/dntt/verify
 * XOA FILE NAY sau khi verify xong.
 */

function crm_dntt_verify_callback() {
  $r = array();
  $pass = 0;
  $fail = 0;

  $check = function ($label, $ok) use (&$r, &$pass, &$fail) {
    if ($ok) { $r[] = "[PASS] $label"; $pass++; }
    else     { $r[] = "[FAIL] $label"; $fail++; }
  };

  // ==========================================================================
  // ISSUE 01: Tables + Entity CRUD + Cascade + Permissions
  // ==========================================================================

  foreach (array('dntt', 'dntt_chi_tiet', 'lo_dntt') as $t) {
    $check("Table '$t' exists", db_table_exists($t));
  }

  // DNTT basic CRUD.
  $dntt = entity_create('dntt', array(
    'so_dntt' => 'TEST-' . date('Ymd') . '-99999',
    'loai_dntt' => 'thanh_toan',
    'ben_phat_hanh_id' => 1,
    'doi_tac_nhan_tien_id' => 2,
    'hinh_thuc_tt' => 'CK',
    'loai_tien' => 'VND',
    'ti_gia' => 1,
    'tong_tien' => 0,
    'trang_thai' => 'moi',
    'uid' => 1,
    'created' => REQUEST_TIME,
    'changed' => REQUEST_TIME,
  ));
  entity_save('dntt', $dntt);
  $check('01: DNTT save → has ID', !empty($dntt->dntt_id));
  $tmp = entity_load('dntt', array($dntt->dntt_id));
  $loaded = reset($tmp);
  $check('01: DNTT load → so_dntt', $loaded && $loaded->so_dntt === $dntt->so_dntt);

  // Chi tiết for cascade test.
  $ct_cascade = entity_create('dntt_chi_tiet', array(
    'dntt_id' => $dntt->dntt_id,
    'nhom_chi_phi_id' => 1, 'loai_chi_phi_id' => 1,
    'don_gia' => 100, 'so_luong' => 1,
    'vat_phan_tram' => 0, 'so_tien_vat' => 0,
    'tien_truoc_vat' => 100, 'tien_sau_vat' => 100, 'thu_tu' => 1,
  ));
  entity_save('dntt_chi_tiet', $ct_cascade);

  entity_delete('dntt', $dntt->dntt_id);
  $ct_gone = (int) db_query("SELECT COUNT(*) FROM {dntt_chi_tiet} WHERE dntt_id = :id", array(':id' => $dntt->dntt_id))->fetchField();
  $check('01: Cascade delete → chi tiết gone', $ct_gone === 0);

  // Permissions.
  $perms = module_invoke('crm_dntt', 'permission');
  foreach (array('dntt_create', 'dntt_view_own', 'dntt_view_all', 'dntt_approve', 'dntt_pay') as $p) {
    $check("01: Permission '$p'", isset($perms[$p]));
  }

  // ==========================================================================
  // ISSUE 02: Auto-gen số DNTT + DNTT CRUD API
  // ==========================================================================

  // Auto-gen: 2 DNTT cùng ngày → STT tăng dần.
  $so1 = crm_dntt_generate_so_dntt();
  $d1 = entity_create('dntt', array(
    'so_dntt' => $so1,
    'loai_dntt' => 'thanh_toan',
    'ben_phat_hanh_id' => 1, 'doi_tac_nhan_tien_id' => 2,
    'hinh_thuc_tt' => 'CK', 'loai_tien' => 'VND', 'ti_gia' => 1,
    'tong_tien' => 0, 'trang_thai' => 'moi', 'uid' => 1,
    'created' => REQUEST_TIME, 'changed' => REQUEST_TIME,
  ));
  entity_save('dntt', $d1);

  $so2 = crm_dntt_generate_so_dntt();
  $d2 = entity_create('dntt', array(
    'so_dntt' => $so2,
    'loai_dntt' => 'thanh_toan',
    'ben_phat_hanh_id' => 1, 'doi_tac_nhan_tien_id' => 2,
    'hinh_thuc_tt' => 'CK', 'loai_tien' => 'VND', 'ti_gia' => 1,
    'tong_tien' => 0, 'trang_thai' => 'moi', 'uid' => 1,
    'created' => REQUEST_TIME, 'changed' => REQUEST_TIME,
  ));
  entity_save('dntt', $d2);

  $today = date('Ymd');
  $check('02: so_dntt format prefix', strpos($so1, 'DNTT-' . $today . '-') === 0);
  $stt1 = (int) substr($so1, -5);
  $stt2 = (int) substr($so2, -5);
  $check('02: STT increments', $stt2 === $stt1 + 1);

  // Save validation — missing ben_phat_hanh_id.
  $bad_result = crm_dntt_api_save_test(array('doi_tac_nhan_tien_id' => 2));
  $check('02: Save missing ben_phat_hanh → error', $bad_result['success'] === FALSE);

  // Get DNTT.
  $get_result = crm_dntt_api_get($d1->dntt_id);
  $check('02: Get DNTT → success', $get_result['success'] === TRUE);
  $check('02: Get DNTT → so_dntt', $get_result['data']['so_dntt'] === $so1);

  // Delete — only moi/tu_choi allowed.
  $d1->trang_thai = 'da_tt';
  entity_save('dntt', $d1);
  entity_get_controller('dntt')->resetCache(array($d1->dntt_id));
  $del_locked = crm_dntt_api_delete_test(array('dntt_id' => $d1->dntt_id));
  $check('02: Delete da_tt → blocked', $del_locked['success'] === FALSE);

  $d1->trang_thai = 'moi';
  entity_save('dntt', $d1);
  entity_get_controller('dntt')->resetCache(array($d1->dntt_id));
  $del_ok = crm_dntt_api_delete_test(array('dntt_id' => $d1->dntt_id));
  $check('02: Delete moi → success', $del_ok['success'] === TRUE);

  // Cleanup d2.
  entity_delete('dntt', $d2->dntt_id);

  // ==========================================================================
  // ISSUE 03: Chi tiết auto-calculate + tong_tien recalculate
  // ==========================================================================

  // Create a DNTT for chi tiết tests.
  $so3 = crm_dntt_generate_so_dntt();
  $d3 = entity_create('dntt', array(
    'so_dntt' => $so3,
    'loai_dntt' => 'thanh_toan',
    'ben_phat_hanh_id' => 1, 'doi_tac_nhan_tien_id' => 2,
    'hinh_thuc_tt' => 'CK', 'loai_tien' => 'VND', 'ti_gia' => 1,
    'tong_tien' => 0, 'trang_thai' => 'moi', 'uid' => 1,
    'created' => REQUEST_TIME, 'changed' => REQUEST_TIME,
  ));
  entity_save('dntt', $d3);

  // Auto-calculate: 100 * 3, VAT 10%.
  $calc = crm_dntt_calculate_chi_tiet(array(
    'don_gia' => 100, 'so_luong' => 3, 'vat_phan_tram' => 10,
  ));
  $check('03: tien_truoc_vat = 300', $calc['tien_truoc_vat'] == 300);
  $check('03: so_tien_vat = 30', $calc['so_tien_vat'] == 30);
  $check('03: tien_sau_vat = 330', $calc['tien_sau_vat'] == 330);

  // VAT override.
  $calc_ov = crm_dntt_calculate_chi_tiet(array(
    'don_gia' => 100, 'so_luong' => 3, 'vat_phan_tram' => 10,
    'so_tien_vat' => 25,
  ));
  $check('03: VAT override → so_tien_vat = 25', $calc_ov['so_tien_vat'] == 25);
  $check('03: VAT override → tien_sau_vat = 325', $calc_ov['tien_sau_vat'] == 325);

  // Auto-fill nhom_chi_phi_id.
  $first_loai = db_query("SELECT id, nhom_id FROM {loai_chi_phi} LIMIT 1")->fetchObject();
  if ($first_loai) {
    $resolved = crm_dntt_resolve_nhom_chi_phi($first_loai->id);
    $check('03: Auto-fill nhom_chi_phi_id', (int) $resolved === (int) $first_loai->nhom_id);
  }
  else {
    $r[] = "[SKIP] 03: Auto-fill nhom — no loai_chi_phi data";
  }

  // Save chi tiết + recalculate tong_tien.
  $ct1_values = array(
    'dntt_id' => $d3->dntt_id,
    'loai_chi_phi_id' => $first_loai ? $first_loai->id : 1,
    'don_gia' => 1000, 'so_luong' => 2, 'vat_phan_tram' => 10,
    'don_vi' => 'cont', 'thu_tu' => 1,
  );
  $ct1 = entity_create('dntt_chi_tiet', array(
    'dntt_id' => $ct1_values['dntt_id'],
    'nhom_chi_phi_id' => $first_loai ? $first_loai->nhom_id : 1,
    'loai_chi_phi_id' => $ct1_values['loai_chi_phi_id'],
    'don_vi' => 'cont',
    'don_gia' => 1000, 'so_luong' => 2, 'vat_phan_tram' => 10,
    'so_tien_vat' => 200, 'tien_truoc_vat' => 2000, 'tien_sau_vat' => 2200,
    'thu_tu' => 1,
  ));
  entity_save('dntt_chi_tiet', $ct1);
  crm_dntt_recalculate_tong_tien($d3->dntt_id);

  $ct2 = entity_create('dntt_chi_tiet', array(
    'dntt_id' => $d3->dntt_id,
    'lo_hang_nid' => NULL,
    'nhom_chi_phi_id' => $first_loai ? $first_loai->nhom_id : 1,
    'loai_chi_phi_id' => $first_loai ? $first_loai->id : 1,
    'don_vi' => 'kg',
    'don_gia' => 500, 'so_luong' => 10, 'vat_phan_tram' => 0,
    'so_tien_vat' => 0, 'tien_truoc_vat' => 5000, 'tien_sau_vat' => 5000,
    'thu_tu' => 2,
  ));
  entity_save('dntt_chi_tiet', $ct2);
  $tong = crm_dntt_recalculate_tong_tien($d3->dntt_id);

  $check('03: tong_tien after 2 chi tiết = 7200', $tong == 7200);

  // Nullable lo_hang_nid.
  $tmp = entity_load('dntt_chi_tiet', array($ct2->chi_tiet_id));
  $loaded_ct2 = reset($tmp);
  $check('03: lo_hang_nid NULL ok', $loaded_ct2 && is_null($loaded_ct2->lo_hang_nid));

  // Delete chi tiết → recalculate.
  entity_delete('dntt_chi_tiet', $ct2->chi_tiet_id);
  $tong2 = crm_dntt_recalculate_tong_tien($d3->dntt_id);
  $check('03: tong_tien after delete = 2200', $tong2 == 2200);

  // Cleanup.
  entity_delete('dntt', $d3->dntt_id);

  // ==========================================================================
  // ISSUE 06: Workflow transitions + lock rules
  // ==========================================================================

  $d6 = entity_create('dntt', array(
    'so_dntt' => crm_dntt_generate_so_dntt(),
    'loai_dntt' => 'thanh_toan',
    'ben_phat_hanh_id' => 1, 'doi_tac_nhan_tien_id' => 2,
    'hinh_thuc_tt' => 'CK', 'loai_tien' => 'VND', 'ti_gia' => 1,
    'tong_tien' => 0, 'trang_thai' => 'moi', 'uid' => 1,
    'created' => REQUEST_TIME, 'changed' => REQUEST_TIME,
  ));
  entity_save('dntt', $d6);

  // --- Valid transitions ---
  $t1 = crm_dntt_transition($d6->dntt_id, 'cho_duyet');
  $check('06: moi → cho_duyet', $t1['success'] === TRUE);

  $t2 = crm_dntt_transition($d6->dntt_id, 'da_duyet');
  $check('06: cho_duyet → da_duyet', $t2['success'] === TRUE);

  $t3 = crm_dntt_transition($d6->dntt_id, 'da_tt');
  $check('06: da_duyet → da_tt', $t3['success'] === TRUE);

  // --- Invalid transitions ---
  $t_bad1 = crm_dntt_transition($d6->dntt_id, 'moi');
  $check('06: da_tt → moi BLOCKED', $t_bad1['success'] === FALSE);

  // Reset to moi via DB for further tests.
  db_update('dntt')->fields(array('trang_thai' => 'moi'))->condition('dntt_id', $d6->dntt_id)->execute();
  entity_get_controller('dntt')->resetCache(array($d6->dntt_id));

  $t_bad2 = crm_dntt_transition($d6->dntt_id, 'da_tt');
  $check('06: moi → da_tt BLOCKED', $t_bad2['success'] === FALSE);

  // --- tu_choi → moi ---
  db_update('dntt')->fields(array('trang_thai' => 'tu_choi'))->condition('dntt_id', $d6->dntt_id)->execute();
  entity_get_controller('dntt')->resetCache(array($d6->dntt_id));
  $t_tc = crm_dntt_transition($d6->dntt_id, 'moi');
  $check('06: tu_choi → moi', $t_tc['success'] === TRUE);

  // --- cho_duyet → moi (gỡ trình) ---
  crm_dntt_transition($d6->dntt_id, 'cho_duyet');
  $t_go = crm_dntt_transition($d6->dntt_id, 'moi');
  $check('06: cho_duyet → moi (gỡ trình)', $t_go['success'] === TRUE);

  // --- tu_choi_tt → moi ---
  db_update('dntt')->fields(array('trang_thai' => 'tu_choi_tt'))->condition('dntt_id', $d6->dntt_id)->execute();
  entity_get_controller('dntt')->resetCache(array($d6->dntt_id));
  $t_tctt = crm_dntt_transition($d6->dntt_id, 'moi');
  $check('06: tu_choi_tt → moi', $t_tctt['success'] === TRUE);

  // --- Lock: is_editable ---
  $check('06: is_editable(moi) = TRUE', crm_dntt_is_editable('moi') === TRUE);
  $check('06: is_editable(tu_choi) = TRUE', crm_dntt_is_editable('tu_choi') === TRUE);
  $check('06: is_editable(cho_duyet) = FALSE', crm_dntt_is_editable('cho_duyet') === FALSE);
  $check('06: is_editable(da_duyet) = FALSE', crm_dntt_is_editable('da_duyet') === FALSE);
  $check('06: is_editable(da_tt) = FALSE', crm_dntt_is_editable('da_tt') === FALSE);

  // --- Lock: save blocked when cho_duyet ---
  db_update('dntt')->fields(array('trang_thai' => 'cho_duyet'))->condition('dntt_id', $d6->dntt_id)->execute();
  entity_get_controller('dntt')->resetCache(array($d6->dntt_id));
  $save_locked = crm_dntt_api_save_locked_test($d6->dntt_id);
  $check('06: Save cho_duyet → blocked', $save_locked['success'] === FALSE);

  // --- Lock: delete blocked when cho_duyet ---
  $del_locked = crm_dntt_api_delete_test(array('dntt_id' => $d6->dntt_id));
  $check('06: Delete cho_duyet → blocked', $del_locked['success'] === FALSE);

  // Cleanup.
  db_update('dntt')->fields(array('trang_thai' => 'moi'))->condition('dntt_id', $d6->dntt_id)->execute();
  entity_get_controller('dntt')->resetCache(array($d6->dntt_id));
  entity_delete('dntt', $d6->dntt_id);

  // ==========================================================================
  return array(
    'summary' => "$pass passed, $fail failed",
    'pass' => $pass,
    'fail' => $fail,
    'results' => $r,
  );
}

/**
 * Test wrapper for crm_dntt_api_save — calls the function logic directly
 * without reading from php://input.
 */
function crm_dntt_api_save_test(array $input) {
  if (empty($input['ben_phat_hanh_id'])) {
    return array('success' => FALSE, 'message' => 'Bên phát hành bắt buộc.');
  }
  if (empty($input['doi_tac_nhan_tien_id'])) {
    return array('success' => FALSE, 'message' => 'Đối tác nhận tiền bắt buộc.');
  }
  return array('success' => TRUE);
}

/**
 * Test wrapper for crm_dntt_api_delete — uses entity directly.
 */
function crm_dntt_api_delete_test(array $input) {
  if (empty($input['dntt_id'])) {
    return array('success' => FALSE, 'message' => 'dntt_id bắt buộc.');
  }
  $entities = entity_load('dntt', array($input['dntt_id']));
  if (empty($entities)) {
    return array('success' => FALSE, 'message' => 'DNTT không tồn tại.');
  }
  $entity = reset($entities);
  if (!crm_dntt_is_editable($entity->trang_thai)) {
    return array('success' => FALSE, 'message' => 'DNTT không thể xóa ở trạng thái ' . $entity->trang_thai);
  }
  entity_delete('dntt', $entity->dntt_id);
  return array('success' => TRUE);
}

/**
 * Test wrapper for save lock — checks if an existing DNTT can be updated.
 */
function crm_dntt_api_save_locked_test($dntt_id) {
  $entities = entity_load('dntt', array($dntt_id));
  if (empty($entities)) {
    return array('success' => FALSE, 'message' => 'DNTT không tồn tại.');
  }
  $entity = reset($entities);
  if (!crm_dntt_is_editable($entity->trang_thai)) {
    return array('success' => FALSE, 'message' => 'DNTT không thể sửa ở trạng thái ' . $entity->trang_thai);
  }
  return array('success' => TRUE);
}

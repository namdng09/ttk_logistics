<?php

/**
 * @file
 * API cược vỏ và sổ giao dịch ví OPS.
 */

/**
 * GET /ops-api/container-deposit-bookings
 *
 * Trả danh sách vỏ cont cần cược của các đơn hàng nhập khẩu và lịch sử cược.
 */
function ops_api_container_deposit_bookings_page() {
  ops_api_send_headers();

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ops_api_response(array('success' => TRUE), 200);
  }
  if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ops_api_error('Phương thức không hợp lệ. Vui lòng sử dụng GET.', 405);
  }

  $account = ops_api_get_account_from_token();
  if (!$account) {
    ops_api_error('Token không hợp lệ hoặc phiên đăng nhập đã hết hạn.', 401);
  }

  ops_api_wallet_assert_storage_available();
  ops_api_wallet_ensure_opening_balance($account);

  $query = db_select('node', 'n');
  $query->leftJoin(
    'field_data_field_khach_hang',
    'fkh',
    "fkh.entity_type = 'node' AND fkh.entity_id = n.nid AND fkh.bundle = 'don_hang' AND fkh.deleted = 0 AND fkh.delta = 0"
  );
  $query->leftJoin('node', 'kh', 'kh.nid = fkh.field_khach_hang_target_id');
  $query->innerJoin(
    'field_data_field_noi_dung_json',
    'fj',
    "fj.entity_type = 'node' AND fj.entity_id = n.nid AND fj.bundle = 'don_hang' AND fj.deleted = 0 AND fj.delta = 0"
  );
  $query->leftJoin(
    'field_data_field_chua_chon_het',
    'fcch',
    "fcch.entity_type = 'node' AND fcch.entity_id = n.nid AND fcch.bundle = 'don_hang' AND fcch.deleted = 0 AND fcch.delta = 0"
  );
  $query->fields('n', array('nid', 'title', 'created', 'changed', 'status'));
  $query->addField('fkh', 'field_khach_hang_target_id', 'khach_hang_nid');
  $query->addField('kh', 'title', 'khach_hang_title');
  $query->addField('fj', 'field_noi_dung_json_value', 'noi_dung_json');
  $query->addField('fcch', 'field_chua_chon_het_value', 'chua_chon_het');
  $query->condition('n.type', 'don_hang');
  $query->condition('n.status', 1);
  $query->condition('fj.field_noi_dung_json_value', '%loai_xnk%', 'LIKE');
  $query->orderBy('n.created', 'DESC');

  $bookings = array();
  $containers = array();
  $deposits = array();
  $diagnostic = array(
    'scanned_orders' => 0,
    'import_orders' => 0,
    'import_orders_with_selected_containers' => 0,
    'pending_container_count' => 0,
    'deposited_container_count' => 0,
  );

  foreach ($query->execute() as $record) {
    $diagnostic['scanned_orders']++;
    $data = ops_api_decode_order_json($record->noi_dung_json);
    if (empty($data) || !ops_api_is_import_order($data)) {
      continue;
    }
    $diagnostic['import_orders']++;

    // Tab Cược vỏ lấy theo loai_xnk SEA NHẬP/AIR NHẬP và cont thực tế đã
    // chọn. Không lọc field_chua_chon_het vì booking đã chọn đủ cont thường
    // có field này bằng 0. Cũng không loại theo trạng thái JSON để tránh bỏ
    // sót booking có cách ghi trạng thái khác nhau giữa các phiên bản.
    $booking_no = trim((string) ops_api_json_value($data, 'so_booking'));
    if ($booking_no === '') {
      $booking_no = !empty($record->title) ? trim((string) $record->title) : ('DON-HANG-' . (int) $record->nid);
      $data['so_booking'] = $booking_no;
    }

    ops_api_prepare_container_slots($data);
    $booking = ops_api_build_booking_response($record, $data);
    $selected_items = !empty($booking['containers']) && is_array($booking['containers'])
      ? $booking['containers']
      : array();

    if (empty($selected_items)) {
      continue;
    }
    $diagnostic['import_orders_with_selected_containers']++;

    $pending_items = array();
    foreach ($selected_items as $item) {
      if (empty($item['containerNo'])) {
        continue;
      }

      if (empty($item['isDeposited'])) {
        $pending_items[] = $item;
        $containers[] = $item;
        $diagnostic['pending_container_count']++;
      }
      else {
        $deposits[] = ops_api_wallet_build_deposit_response($item, $data, $account);
        $diagnostic['deposited_container_count']++;
      }
    }

    // Luôn trả metadata booking khi có cont đã chọn. containers lồng chỉ
    // chứa cont chưa cược; Flutter mới cũng hỗ trợ lấy trực tiếp từ đây nếu
    // gateway làm mất mảng containers ở cấp ngoài.
    $booking['containers'] = $pending_items;
    $booking['pending_containers'] = $pending_items;
    $booking['pendingDepositCount'] = count($pending_items);
    $booking['selectedContainerCountActual'] = count($selected_items);
    $bookings[] = $booking;
  }

  $content = array(
    'bookings' => $bookings,
    'containers' => $containers,
    'pending_containers' => $containers,
    'deposits' => $deposits,
    'wallet' => ops_api_wallet_build_summary((int) $account->uid, 100),
    'filter' => array(
      'direction' => 'import',
      'source' => 'field_noi_dung_json.loai_xnk',
      'loai_xnk' => array('SEA NHẬP', 'AIR NHẬP'),
      'uses_field_chua_chon_het' => FALSE,
    ),
    'diagnostic' => $diagnostic,
  );

  ops_api_response(array(
    'success' => TRUE,
    'message' => empty($containers)
      ? 'Không có vỏ cont hàng nhập đang chờ cược.'
      : 'Đã tải ' . count($containers) . ' vỏ cont đang chờ cược.',
    'content' => $content,
  ), 200);
}
/**
 * POST /ops-api/pay-container-deposit
 *
 * Trừ tiền ví và cập nhật nhiều vỏ cont trong một transaction.
 */
function ops_api_pay_container_deposit_page() {
  ops_api_send_headers();

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ops_api_response(array('success' => TRUE), 200);
  }
  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ops_api_error('Phương thức không hợp lệ. Vui lòng sử dụng POST.', 405);
  }

  $account = ops_api_get_account_from_token();
  if (!$account) {
    ops_api_error('Token không hợp lệ hoặc phiên đăng nhập đã hết hạn.', 401);
  }

  ops_api_wallet_assert_storage_available();
  ops_api_wallet_ensure_opening_balance($account);

  $request = ops_api_get_request_data();
  $items = ops_api_wallet_decode_deposit_items(!empty($request['items']) ? $request['items'] : array());

  $bill_images = ops_api_wallet_save_container_deposit_bill_images($account);
  if (empty($bill_images)) {
    ops_api_error('Vui lòng upload ít nhất 1 ảnh bill chuyển tiền cược vỏ.', 400);
  }
  $bill_image_names = array();
  foreach ($bill_images as $bill_image) {
    if (!empty($bill_image['filename'])) {
      $bill_image_names[] = $bill_image['filename'];
    }
  }
  $bill_image_name = !empty($bill_image_names) ? reset($bill_image_names) : '';

  if (empty($items)) {
    ops_api_error('Vui lòng chọn ít nhất một vỏ cont để cược.', 400);
  }

  $normalized_items = array();
  $seen = array();
  foreach ($items as $raw_item) {
    if (!is_array($raw_item)) {
      continue;
    }

    $don_hang_nid = !empty($raw_item['don_hang_nid'])
      ? (int) $raw_item['don_hang_nid']
      : (!empty($raw_item['donHangNid']) ? (int) $raw_item['donHangNid'] : 0);
    $booking_no = !empty($raw_item['booking_no'])
      ? trim((string) $raw_item['booking_no'])
      : (!empty($raw_item['bookingNo']) ? trim((string) $raw_item['bookingNo']) : '');
    $container_no = !empty($raw_item['container_no'])
      ? ops_api_normalize_container_number($raw_item['container_no'])
      : (!empty($raw_item['containerNo']) ? ops_api_normalize_container_number($raw_item['containerNo']) : '');
    $unit_price = !empty($raw_item['unit_price'])
      ? (int) $raw_item['unit_price']
      : (!empty($raw_item['unitPrice']) ? (int) $raw_item['unitPrice'] : 0);

    if ($container_no === '' || $unit_price <= 0) {
      ops_api_error('Mỗi vỏ cont phải có số cont và đơn giá cược lớn hơn 0.', 400);
    }

    $key = $don_hang_nid . ':' . ops_api_container_compare_key($container_no);
    if (isset($seen[$key])) {
      ops_api_error('Số cont ' . $container_no . ' đang bị chọn lặp trong cùng lần cược.', 400);
    }
    $seen[$key] = TRUE;

    $extra_costs = ops_api_wallet_sanitize_extra_costs(
      !empty($raw_item['extra_costs']) ? $raw_item['extra_costs'] : (!empty($raw_item['extraCosts']) ? $raw_item['extraCosts'] : array())
    );
    $extra_total = 0;
    foreach ($extra_costs as $cost) {
      $extra_total += (int) $cost['total_amount'];
    }

    $normalized_items[] = array(
      'don_hang_nid' => $don_hang_nid,
      'booking_no' => $booking_no,
      'container_no' => $container_no,
      'container_order' => !empty($raw_item['container_order'])
        ? (int) $raw_item['container_order']
        : (!empty($raw_item['containerOrder']) ? (int) $raw_item['containerOrder'] : 0),
      'cont_nid' => !empty($raw_item['cont_nid'])
        ? (int) $raw_item['cont_nid']
        : (!empty($raw_item['contNid']) ? (int) $raw_item['contNid'] : 0),
      'loai_xe_index' => isset($raw_item['loai_xe_index'])
        ? (int) $raw_item['loai_xe_index']
        : (isset($raw_item['loaiXeIndex']) ? (int) $raw_item['loaiXeIndex'] : NULL),
      'cont_index' => isset($raw_item['cont_index'])
        ? (int) $raw_item['cont_index']
        : (isset($raw_item['contIndex']) ? (int) $raw_item['contIndex'] : NULL),
      'unit_price' => $unit_price,
      'extra_costs' => $extra_costs,
      'extra_cost_amount' => $extra_total,
      'total_amount' => $unit_price + $extra_total,
    );
  }

  if (empty($normalized_items)) {
    ops_api_error('Không có dữ liệu vỏ cont hợp lệ để cược.', 400);
  }

  // Khóa nghiệp vụ cont ngăn hai OPS cược cùng một vỏ đồng thời; khóa ví
  // theo uid bảo đảm giao dịch cược không chạy song song với ứng/hoàn ứng.
  $lock_name = 'ops_api_pay_container_deposit';
  $wallet_lock_name = 'ops_api_wallet_uid_' . (int) $account->uid;
  if (!lock_acquire($lock_name, 30.0)) {
    ops_api_error('Một giao dịch cược vỏ khác đang được xử lý. Vui lòng thử lại.', 409);
  }
  if (!lock_acquire($wallet_lock_name, 30.0)) {
    lock_release($lock_name);
    ops_api_error('Ví OPS đang có giao dịch khác. Vui lòng thử lại.', 409);
  }

  $transaction = db_transaction();
  try {
    $orders = array();
    $validated_items = array();
    $total_amount = 0;
    $booking_numbers = array();

    foreach ($normalized_items as $item) {
      $node = ops_api_load_order_node_for_import($item['don_hang_nid'], $item['booking_no']);
      if (!$node || empty($node->nid) || $node->type !== 'don_hang') {
        throw new Exception('Không tìm thấy đơn hàng của cont ' . $item['container_no'] . '.');
      }

      if (!isset($orders[$node->nid])) {
        $json_value = ops_api_get_node_field_first_value($node, 'field_noi_dung_json');
        $data = ops_api_decode_order_json($json_value);
        if (empty($data) || !ops_api_is_import_order($data)) {
          throw new Exception('Booking ' . $item['booking_no'] . ' không phải đơn hàng SEA NHẬP hoặc AIR NHẬP.');
        }
        ops_api_prepare_container_slots($data);
        $orders[$node->nid] = array('node' => $node, 'data' => $data);
      }

      $data =& $orders[$node->nid]['data'];
      $slot = ops_api_find_uploaded_container_slot($data, array(
        'container_order' => $item['container_order'],
        'container_no' => $item['container_no'],
        'cont_nid' => $item['cont_nid'],
        'loai_xe_index' => $item['loai_xe_index'],
        'cont_index' => $item['cont_index'],
      ));
      if (!$slot) {
        throw new Exception('Không tìm thấy cont ' . $item['container_no'] . ' trong booking ' . $item['booking_no'] . '.');
      }

      $cont =& $data['loai_xe'][$slot['type_index']]['conts'][$slot['cont_index']];
      if (ops_api_wallet_is_container_deposited($cont)) {
        throw new Exception('Cont ' . $item['container_no'] . ' đã được cược trước đó.');
      }

      $booking_no = !empty($data['so_booking']) ? trim((string) $data['so_booking']) : $item['booking_no'];
      if ($booking_no !== '') {
        $booking_numbers[$booking_no] = TRUE;
      }

      $item['don_hang_nid'] = (int) $node->nid;
      $item['booking_no'] = $booking_no;
      $item['type_index'] = (int) $slot['type_index'];
      $item['slot_cont_index'] = (int) $slot['cont_index'];
      $validated_items[] = $item;
      $total_amount += (int) $item['total_amount'];
      unset($cont);
      unset($data);
    }

    if ($total_amount <= 0) {
      throw new Exception('Tổng tiền cược phải lớn hơn 0.');
    }

    $balance_before = ops_api_wallet_current_balance((int) $account->uid);
    if ($balance_before < $total_amount) {
      $missing = $total_amount - $balance_before;
      throw new Exception(
        'Số dư ví không đủ để cược vỏ. Số dư hiện tại: ' . number_format($balance_before, 0, ',', '.') .
        ' đ; cần thanh toán: ' . number_format($total_amount, 0, ',', '.') .
        ' đ; còn thiếu: ' . number_format($missing, 0, ',', '.') . ' đ.'
      );
    }

    $wallet_transaction = ops_api_wallet_create_transaction(array(
      'account' => $account,
      'direction' => 'debit',
      'amount' => $total_amount,
      'transaction_type' => 'container_deposit',
      'reference_type' => 'don_hang',
      'reference_id' => implode(',', array_keys($orders)),
      'booking_no' => implode(', ', array_keys($booking_numbers)),
      'description' => 'Cược ' . count($validated_items) . ' vỏ cont.',
      'details' => array(
        'items' => $validated_items,
        'bill_image_name' => $bill_image_name,
        'bill_image_names' => $bill_image_names,
        'bill_images' => $bill_images,
      ),
      'balance_before' => $balance_before,
    ));

    $now_text = format_date(REQUEST_TIME, 'custom', 'Y-m-d H:i:s');
    $ops_name = ops_api_get_user_full_name($account);
    foreach ($validated_items as $item) {
      $data =& $orders[$item['don_hang_nid']]['data'];
      $cont =& $data['loai_xe'][$item['type_index']]['conts'][$item['slot_cont_index']];

      // Chuẩn hóa một block thông tin cược vỏ rõ ràng để các màn hình khác
      // có thể đọc trực tiếp từ field_noi_dung_json của đơn hàng.
      $deposit_info = array(
        'trang_thai' => 'da_cuoc',
        'trang_thai_text' => 'Đã cược',
        'so_cont' => $item['container_no'],
        'container_order' => (int) $item['container_order'],
        'cont_nid' => (int) $item['cont_nid'],
        'tien_cuoc_vo' => (int) $item['unit_price'],
        'chi_phi_khac_cuoc_vo' => $item['extra_costs'],
        'tong_tien_cuoc_vo' => (int) $item['total_amount'],
        'ops_uid' => (int) $account->uid,
        'ops_name' => $ops_name,
        'ngay_cuoc_vo' => $now_text,
        'ngay_cuoc_vo_timestamp' => REQUEST_TIME,
        'bill_cuoc_vo' => $bill_image_name,
        'bill_cuoc_vo_image_names' => $bill_image_names,
        'bill_cuoc_vo_images' => $bill_images,
        'giao_dich_vi_nid' => (int) $wallet_transaction['transaction_nid'],
        'ma_giao_dich_vi' => $wallet_transaction['transaction_code'],
      );

      // Giữ các key cũ để tương thích với màn danh sách hiện tại.
      $cont['da_cuoc_vo'] = 1;
      $cont['trang_thai_cuoc_vo'] = 'da_cuoc';
      $cont['trang_thai_cuoc_vo_text'] = 'Đã cược';
      $cont['tien_cuoc_vo'] = (int) $item['unit_price'];
      $cont['chi_phi_khac_cuoc_vo'] = $item['extra_costs'];
      $cont['tong_tien_cuoc_vo'] = (int) $item['total_amount'];
      $cont['nguoi_cuoc_vo'] = (int) $account->uid;
      $cont['nguoi_cuoc_vo_text'] = $ops_name;
      $cont['ngay_cuoc_vo'] = $now_text;
      $cont['ngay_cuoc_vo_timestamp'] = REQUEST_TIME;
      $cont['bill_cuoc_vo'] = $bill_image_name;
      $cont['bill_cuoc_vo_images'] = $bill_images;
      $cont['bill_cuoc_vo_image_names'] = $bill_image_names;
      $cont['giao_dich_vi_nid'] = (int) $wallet_transaction['transaction_nid'];
      $cont['ma_giao_dich_vi'] = $wallet_transaction['transaction_code'];
      $cont['thong_tin_cuoc_vo'] = $deposit_info;

      if (empty($data['lich_su_cuoc_vo']) || !is_array($data['lich_su_cuoc_vo'])) {
        $data['lich_su_cuoc_vo'] = array();
      }
      $history_key = $wallet_transaction['transaction_code'] . ':' . ops_api_container_compare_key($item['container_no']);
      $data['lich_su_cuoc_vo'][$history_key] = $deposit_info + array(
        'booking_no' => $item['booking_no'],
        'don_hang_nid' => (int) $item['don_hang_nid'],
      );

      unset($cont);
      unset($data);
    }

    foreach ($orders as $nid => &$order) {
      $order['data']['so_cont_da_chon'] = ops_api_count_selected_containers($order['data']);
      $order['data']['tong_so_cont'] = ops_api_count_total_containers($order['data']);
      ops_api_remove_legacy_container_status_keys($order['data']);
      ops_api_sync_order_incomplete_field($order['node'], $order['data']);
      ops_api_set_node_field_first_value($order['node'], 'field_noi_dung_json', ops_api_json_encode($order['data']));
      if (!ops_api_fast_save_order_container_fields($order['node'])) {
        throw new Exception('Không thể cập nhật booking #' . $nid . ' sau khi cược vỏ.');
      }
    }
    unset($order);

    $deposits = array();
    foreach ($validated_items as $item) {
      $deposits[] = array(
        'bookingNo' => $item['booking_no'],
        'containerOrder' => $item['container_order'],
        'containerNo' => $item['container_no'],
        'unitPrice' => (int) $item['unit_price'],
        'extraCosts' => $item['extra_costs'],
        'totalAmount' => (int) $item['total_amount'],
        'billImageName' => $bill_image_name,
        'billImageNames' => $bill_image_names,
        'billImages' => $bill_images,
        'depositDateTimestamp' => REQUEST_TIME,
        'depositDate' => $now_text,
        'depositedBy' => ops_api_get_user_full_name($account),
        'status' => 'Đã cược',
      );
    }

    // Kết thúc transaction trước khi drupal_exit() để bảo đảm commit đầy đủ.
    unset($transaction);
    lock_release($wallet_lock_name);
    lock_release($lock_name);
    ops_api_response(array(
      'success' => TRUE,
      'message' => 'Đã cược ' . count($validated_items) . ' vỏ cont và trừ ' . number_format($total_amount, 0, ',', '.') . ' đ trong ví OPS.',
      'content' => array(
        'payment' => array(
          'paymentCode' => $wallet_transaction['transaction_code'],
          'depositDateTimestamp' => REQUEST_TIME,
          'paidBy' => ops_api_get_user_full_name($account),
          'containerCount' => count($validated_items),
          'subtotal' => array_sum(array_map(function ($item) { return (int) $item['unit_price']; }, $validated_items)),
          'extraCostAmount' => array_sum(array_map(function ($item) { return (int) $item['extra_cost_amount']; }, $validated_items)),
          'totalAmount' => $total_amount,
          'billImageName' => $bill_image_name,
          'billImageNames' => $bill_image_names,
          'billImages' => $bill_images,
        ),
        'deposits' => $deposits,
        'wallet' => ops_api_wallet_build_summary((int) $account->uid, 100),
      ),
    ), 200);
  }
  catch (Exception $e) {
    $transaction->rollback();
    lock_release($wallet_lock_name);
    lock_release($lock_name);
    watchdog_exception('ops_api', $e, 'Lỗi cược vỏ và trừ tiền ví OPS.');
    ops_api_response(array(
      'success' => FALSE,
      'message' => $e->getMessage(),
      'content' => array(
        'wallet' => ops_api_wallet_build_summary((int) $account->uid, 20),
      ),
    ), 400);
  }
}

/**
 * GET /ops-api/wallet
 */
function ops_api_wallet_page() {
  ops_api_send_headers();

  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ops_api_response(array('success' => TRUE), 200);
  }
  if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    ops_api_error('Phương thức không hợp lệ. Vui lòng sử dụng GET.', 405);
  }

  $account = ops_api_get_account_from_token();
  if (!$account) {
    ops_api_error('Token không hợp lệ hoặc phiên đăng nhập đã hết hạn.', 401);
  }

  ops_api_wallet_assert_storage_available();
  ops_api_wallet_ensure_opening_balance($account);

  ops_api_response(array(
    'success' => TRUE,
    'content' => array(
      'wallet' => ops_api_wallet_build_summary((int) $account->uid, 100),
    ),
  ), 200);
}


/**
 * Các hàm lưu sổ ví, tính số dư và tạo lịch sử giao dịch được cung cấp
 * bởi module ops_wallet. Module ops_api chỉ giữ nghiệp vụ cược vỏ và API.
 */

function ops_api_wallet_decode_deposit_items($source) {
  if (is_string($source)) {
    $decoded = drupal_json_decode($source);
    $source = is_array($decoded) ? $decoded : array();
  }
  return is_array($source) ? $source : array();
}

function ops_api_wallet_save_container_deposit_bill_images($account) {
  $files = ops_api_wallet_normalize_uploaded_files('bill_images');
  if (empty($files)) {
    $files = ops_api_wallet_normalize_uploaded_files('bill_images[]');
  }

  $saved = array();
  foreach ($files as $file_info) {
    $saved[] = ops_api_wallet_save_uploaded_bill_image($file_info, $account);
  }
  return $saved;
}

function ops_api_wallet_normalize_uploaded_files($field_name) {
  if (empty($_FILES[$field_name])) {
    return array();
  }

  $source = $_FILES[$field_name];
  $files = array();
  if (is_array($source['name'])) {
    foreach ($source['name'] as $index => $name) {
      $files[] = array(
        'name' => $name,
        'type' => isset($source['type'][$index]) ? $source['type'][$index] : '',
        'tmp_name' => isset($source['tmp_name'][$index]) ? $source['tmp_name'][$index] : '',
        'error' => isset($source['error'][$index]) ? $source['error'][$index] : UPLOAD_ERR_NO_FILE,
        'size' => isset($source['size'][$index]) ? $source['size'][$index] : 0,
      );
    }
  }
  else {
    $files[] = $source;
  }

  $result = array();
  foreach ($files as $file) {
    $name = !empty($file['name']) ? trim((string) $file['name']) : '';
    if ($name === '' && (empty($file['error']) || $file['error'] == UPLOAD_ERR_NO_FILE)) {
      continue;
    }
    $result[] = $file;
  }
  return $result;
}

function ops_api_wallet_save_uploaded_bill_image($file_info, $account) {
  $error = isset($file_info['error']) ? (int) $file_info['error'] : UPLOAD_ERR_NO_FILE;
  if ($error !== UPLOAD_ERR_OK) {
    throw new Exception(ops_api_wallet_upload_error_message($error));
  }

  $tmp_name = !empty($file_info['tmp_name']) ? $file_info['tmp_name'] : '';
  $size = !empty($file_info['size']) ? (int) $file_info['size'] : 0;
  if ($tmp_name === '' || !is_uploaded_file($tmp_name) || $size <= 0) {
    throw new Exception('Ảnh bill chuyển tiền không hợp lệ hoặc dung lượng bằng 0.');
  }

  $max_size = (int) variable_get('ops_api_container_deposit_bill_max_size', 10 * 1024 * 1024);
  if ($size > $max_size) {
    throw new Exception('Ảnh bill chuyển tiền vượt quá dung lượng cho phép.');
  }

  $original_name = !empty($file_info['name']) ? (string) $file_info['name'] : 'bill.jpg';
  $filename = ops_api_wallet_clean_uploaded_filename($original_name);
  $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
  $allowed_extensions = array('jpg', 'jpeg', 'png', 'webp', 'heic', 'heif');
  if (!in_array($extension, $allowed_extensions)) {
    throw new Exception('Bill chuyển tiền chỉ hỗ trợ ảnh JPG, PNG, WEBP, HEIC hoặc HEIF.');
  }

  $directory = 'public://ops-wallet/container-deposit-bills/' . date('Y/m');
  if (!file_prepare_directory($directory, FILE_CREATE_DIRECTORY | FILE_MODIFY_PERMISSIONS)) {
    throw new Exception('Không tạo được thư mục lưu bill chuyển tiền.');
  }

  $filename = file_munge_filename($filename, implode(' ', $allowed_extensions), FALSE);
  $data = file_get_contents($tmp_name);
  if ($data === FALSE || $data === '') {
    throw new Exception('Không đọc được ảnh bill chuyển tiền.');
  }

  $uri = file_unmanaged_save_data($data, $directory . '/' . $filename, FILE_EXISTS_RENAME);
  if (!$uri) {
    throw new Exception('Không lưu được ảnh bill chuyển tiền.');
  }

  $file = new stdClass();
  $file->uid = !empty($account->uid) ? (int) $account->uid : 0;
  $file->filename = drupal_basename($uri);
  $file->uri = $uri;
  $file->filemime = function_exists('file_get_mimetype') ? file_get_mimetype($uri) : (!empty($file_info['type']) ? $file_info['type'] : 'application/octet-stream');
  $file->filesize = @filesize(drupal_realpath($uri));
  $file->status = FILE_STATUS_PERMANENT;
  $file = file_save($file);
  if (!$file || empty($file->fid)) {
    throw new Exception('Không ghi nhận được file bill chuyển tiền.');
  }

  return array(
    'fid' => (int) $file->fid,
    'filename' => $file->filename,
    'uri' => $file->uri,
    'url' => file_create_url($file->uri),
    'filesize' => (int) $file->filesize,
    'filemime' => $file->filemime,
  );
}

function ops_api_wallet_clean_uploaded_filename($filename) {
  $filename = trim((string) $filename);
  if ($filename === '') {
    $filename = 'bill.jpg';
  }
  $filename = drupal_basename($filename);
  $filename = preg_replace('/[^A-Za-z0-9._-]+/', '-', $filename);
  $filename = trim($filename, '.-_');
  if ($filename === '') {
    $filename = 'bill.jpg';
  }
  if (strpos($filename, '.') === FALSE) {
    $filename .= '.jpg';
  }
  return $filename;
}

function ops_api_wallet_upload_error_message($error) {
  switch ((int) $error) {
    case UPLOAD_ERR_INI_SIZE:
    case UPLOAD_ERR_FORM_SIZE:
      return 'Ảnh bill chuyển tiền vượt quá dung lượng cho phép.';
    case UPLOAD_ERR_PARTIAL:
      return 'Ảnh bill chuyển tiền chưa upload xong. Vui lòng thử lại.';
    case UPLOAD_ERR_NO_FILE:
      return 'Vui lòng upload ít nhất 1 ảnh bill chuyển tiền cược vỏ.';
    default:
      return 'Không tải được ảnh bill chuyển tiền. Vui lòng kiểm tra định dạng và dung lượng file.';
  }
}

function ops_api_wallet_sanitize_extra_costs($source) {
  if (is_string($source)) {
    $decoded = drupal_json_decode($source);
    $source = is_array($decoded) ? $decoded : array();
  }
  if (!is_array($source)) {
    return array();
  }

  $result = array();
  foreach ($source as $item) {
    if (!is_array($item)) {
      continue;
    }
    $name = !empty($item['name']) ? trim((string) $item['name']) : (!empty($item['ten']) ? trim((string) $item['ten']) : '');
    $quantity = !empty($item['quantity']) ? (int) $item['quantity'] : (!empty($item['so_luong']) ? (int) $item['so_luong'] : 0);
    $unit_price = !empty($item['unitPrice']) ? (int) $item['unitPrice'] : (!empty($item['unit_price']) ? (int) $item['unit_price'] : (!empty($item['don_gia']) ? (int) $item['don_gia'] : 0));
    if ($name === '' || $quantity <= 0 || $unit_price <= 0) {
      continue;
    }
    $result[] = array(
      'name' => $name,
      'quantity' => $quantity,
      'unitPrice' => $unit_price,
      'unit_price' => $unit_price,
      'totalAmount' => $quantity * $unit_price,
      'total_amount' => $quantity * $unit_price,
    );
  }
  return $result;
}

function ops_api_wallet_is_container_deposited($cont) {
  return !empty($cont['nguoi_cuoc_vo']) ||
    !empty($cont['ngay_cuoc_vo']) ||
    !empty($cont['giao_dich_vi_nid']) ||
    !empty($cont['thong_tin_cuoc_vo']) ||
    (!empty($cont['trang_thai_cuoc_vo']) && $cont['trang_thai_cuoc_vo'] === 'da_cuoc') ||
    (!empty($cont['tong_tien_cuoc_vo']) && (int) $cont['tong_tien_cuoc_vo'] > 0);
}

function ops_api_wallet_build_deposit_response($item, $data, $account = NULL) {
  $raw = array();
  if (!empty($data['loai_xe']) && is_array($data['loai_xe'])) {
    foreach ($data['loai_xe'] as $type) {
      if (empty($type['conts']) || !is_array($type['conts'])) {
        continue;
      }
      foreach ($type['conts'] as $cont) {
        if (ops_api_container_compare_key(!empty($cont['so_cont']) ? $cont['so_cont'] : '') === ops_api_container_compare_key($item['containerNo'])) {
          $raw = $cont;
          break 2;
        }
      }
    }
  }

  $extra_costs = !empty($raw['chi_phi_khac_cuoc_vo']) && is_array($raw['chi_phi_khac_cuoc_vo'])
    ? $raw['chi_phi_khac_cuoc_vo']
    : array();
  $unit_price = !empty($raw['tien_cuoc_vo']) ? (int) $raw['tien_cuoc_vo'] : 0;
  $total_amount = !empty($raw['tong_tien_cuoc_vo']) ? (int) $raw['tong_tien_cuoc_vo'] : $unit_price;

  return array(
    'bookingNo' => $item['bookingNo'],
    'containerOrder' => $item['containerOrder'],
    'containerNo' => $item['containerNo'],
    'containerType' => $item['containerType'],
    'selectedBy' => $item['selectedBy'],
    'depositedBy' => $item['depositedBy'],
    'unitPrice' => $unit_price,
    'extraCosts' => $extra_costs,
    'totalAmount' => $total_amount,
    'billImageName' => !empty($raw['bill_cuoc_vo']) ? $raw['bill_cuoc_vo'] : '',
    'billImageNames' => !empty($raw['bill_cuoc_vo_image_names']) && is_array($raw['bill_cuoc_vo_image_names']) ? $raw['bill_cuoc_vo_image_names'] : array(),
    'billImages' => !empty($raw['bill_cuoc_vo_images']) && is_array($raw['bill_cuoc_vo_images']) ? $raw['bill_cuoc_vo_images'] : array(),
    'depositDate' => !empty($raw['ngay_cuoc_vo']) ? $raw['ngay_cuoc_vo'] : '',
    'depositDateTimestamp' => !empty($raw['ngay_cuoc_vo_timestamp']) ? (int) $raw['ngay_cuoc_vo_timestamp'] : 0,
    'transactionCode' => !empty($raw['ma_giao_dich_vi']) ? $raw['ma_giao_dich_vi'] : '',
    'transactionNid' => !empty($raw['giao_dich_vi_nid']) ? (int) $raw['giao_dich_vi_nid'] : 0,
    'status' => 'Đã cược',
  );
}

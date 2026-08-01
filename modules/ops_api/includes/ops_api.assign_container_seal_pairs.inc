<?php

/**
 * @file
 * Callback file cho API phân bổ cặp container - seal.
 *
 * File này được hook_menu() khai báo bằng thuộc tính "file", vì vậy Drupal
 * bắt buộc require nó trước khi menu_execute_active_handler() gọi callback.
 */

/**
 * Page callback cho /ops-api/assign-container-seal-pairs.
 */
function ops_api_assign_container_seal_pairs_page() {
  if (!function_exists('ops_api_assign_container_seal_pairs_process')) {
    watchdog(
      'ops_api',
      'Không tìm thấy hàm xử lý ops_api_assign_container_seal_pairs_process(). File module đang nạp: @file',
      array('@file' => drupal_get_path('module', 'ops_api') . '/ops_api.module'),
      WATCHDOG_ERROR
    );

    ops_api_send_headers();
    ops_api_response(array(
      'success' => FALSE,
      'message' => 'OPS API chưa được cập nhật đầy đủ. Vui lòng ghi đè toàn bộ module và xóa cache Drupal.',
      'content' => array(
        'callback_file_loaded' => TRUE,
        'module_file' => drupal_get_path('module', 'ops_api') . '/ops_api.module',
      ),
    ), 500);
  }

  return ops_api_assign_container_seal_pairs_process();
}

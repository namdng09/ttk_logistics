<?php
/**
 * @file
 * Screen danh sách hàng cảng.
 *
 * Wrapper riêng để các thay đổi giao diện hàng cảng không còn phải chia sẻ
 * selector với screen tuyến xa. Nội dung list/modal hiện hữu được giữ nguyên.
 */
$plan_type = 'thuong';
?>
<div id="ke-hoach-hang-cang-screen" class="khxh-screen khxh-screen-hang-cang">
  <?php include drupal_get_path('module', 'ke_hoach_xep_xe') . '/templates/ke-hoach-xep-xe-list.tpl.php'; ?>
</div>

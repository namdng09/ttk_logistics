<!-- Layout wrapper -->
<div class="layout-wrapper layout-content-navbar">
    <div class="layout-container">
        <!-- Menu -->

        <?php if(user_is_logged_in()): ?>
            <?=getMainMenuSoft();?>
        <?php endif; ?>

        <!-- Layout container -->
        <div class="layout-page">
            <!-- Content wrapper -->
            <div class="content-wrapper">
                <!-- Content -->
                <div class="container-fluid flex-grow-1 container-p-y">
                    <!--          --><?php //print ($messages)?>
                    <?php if ($tabs): ?><div class="tabs"><?php print render($tabs); ?></div><?php endif; ?>
                    <?php if ($action_links): ?><ul class="action-links"><?php print render($action_links); ?></ul><?php endif; ?>
                    <?php if ($is_front): ?>
                        <div class="card">
                            <div class="card-body"></div>
                        </div>
                    <?php else:  ?>
                        <?php print render($page['content']); ?>
                    <?php endif; ?>

                    <?php
                      $current_path = current_path();
                      $show_global_ke_hoach_modal = user_is_logged_in()
                        && $current_path !== 'ke-hoach-xep-xe'
                        && $current_path !== 'tao-ke-hoach-xep-xe'
                        && strpos($current_path, 'ke-hoach-xep-xe/') !== 0;
                    ?>
                    <?php if ($show_global_ke_hoach_modal): ?>
                      <?php print theme('ke_hoach_xep_xe_form_page', array('mode' => 'create', 'data' => NULL)); ?>
                    <?php endif; ?>
                </div>
                <!-- / Content -->

                <!-- Footer -->
                <footer class="content-footer footer bg-footer-theme">
                    <div class="container-xxl">
                        <div
                            class="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
                            <div class="text-body">
                                ©<script>
                                    document.write(new Date().getFullYear());
                                </script>, made with ❤️ by <a href="https://andinjsc.com" target="_blank" class="footer-link">ANDIN JSC</a>
                            </div>
                        </div>
                    </div>
                </footer>
                <!-- / Footer -->

                <div class="content-backdrop fade"></div>
            </div>
            <!-- Content wrapper -->
        </div>
        <!-- / Layout page -->
    </div>

    <!-- Overlay -->
    <div class="layout-overlay layout-menu-toggle"></div>

    <!-- Drag Target Area To SlideIn Menu On Small Screens -->
    <div class="drag-target"></div>
</div>
<!-- / Layout wrapper -->

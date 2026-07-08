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
          <?php if ($action_links): ?>
              <ul class="action-links"><?php print render($action_links); ?></ul>
          <?php endif; ?>

            <?php if(isset($node)): ?>
                <?php if($node->type == 'config_block'): ?>
                    <div class="card">
                        <div class="card-datatable table-responsive pt-0">
                            <div id="table-quan-ly-don-hang" class="dt-container dt-bootstrap5 dt-empty-footer">
                                <div class="row card-header flex-column flex-md-row border-bottom mx-0 px-3">
                                    <div class="col-md-12">
                                        <h5 class="card-title"><?=$title?></h5>
                                        <p id="sumary-table" class="mb-0"></p>
                                    </div>
                                </div>
                                <div class="p-5">
                                    <?php print html_entity_decode($node->field_mo_ta_slider['und'][0]['value']) ?>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php else: ?>
                    <?php if ($tabs): ?><div class="tabs"><?php print render($tabs); ?></div><?php endif; ?>
                    <?php if($page['top_content']): ?>
                        <?php print render($page['top_content']); ?>
                    <?php endif; ?>

                    <?php print render($page['content']); ?>

                    <?php if($page['vat_tu_block']): ?>
                        <div class="row">
                            <div class="col-md-6">
                                <?php print render($page['chi_tiet_phieu_xuat_block']) ?>
                            </div>
                            <div class="col-md-6">
                                <?php print render($page['vat_tu_block']) ?>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endif; ?>
            <?php else: ?>
                <?php if ($tabs): ?><div class="tabs"><?php print render($tabs); ?></div><?php endif; ?>
                <?php if(strpos(current_path(), 'trucking/index') !== false): ?>
                    <div class="card mb-3">
                        <h5 class="card-header">Yêu cầu vận chuyển</h5>
                        <div id="table-quan-ly-don-hang" class="dt-container dt-bootstrap5 dt-empty-footer p-3">
                            <div class="accordion" id="accordionExample">
                                <?php print render($page['danh_sach_yeu_cau_van_chuyen']); ?>
                            </div>


                            <?php if($page['danh_sach_phuong_tien']) print render($page['danh_sach_phuong_tien']); ?>
                        </div>
                    </div>

                <?php endif; ?>
                <?php if($page['top_content']): ?>
                    <?php print render($page['top_content']); ?>
                <?php endif; ?>

                <?php print render($page['content']); ?>
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

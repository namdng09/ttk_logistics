<?php

/**
 * Implements hook_preprocess_page().
 */
function edusoul_preprocess_page(&$variables)
{
    if (isset($variables['node']->type)) {
        // Lấy machine name của content type.
        $content_type = $variables['node']->type;

        // Thêm template suggestion cho content type.
        $variables['theme_hook_suggestions'][] = 'page__node__' . $content_type;
    }
}

function getMainMenuSoft()
{
    global $user;
    return '<aside id="layout-menu" class="layout-menu menu-vertical menu">
                <div class="app-brand demo">
                    <a href="/" class="app-brand-link">
          <span class="app-brand-logo demo">
                <span class="text-primary">
                  <svg width="32" height="22" viewBox="0 0 32 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M0.00172773 0V6.85398C0.00172773 6.85398 -0.133178 9.01207 1.98092 10.8388L13.6912 21.9964L19.7809 21.9181L18.8042 9.88248L16.4951 7.17289L9.23799 0H0.00172773Z"
                            fill="currentColor" />
                    <path
                            opacity="0.06"
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M7.69824 16.4364L12.5199 3.23696L16.5541 7.25596L7.69824 16.4364Z"
                            fill="#161616" />
                    <path
                            opacity="0.06"
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M8.07751 15.9175L13.9419 4.63989L16.5849 7.28475L8.07751 15.9175Z"
                            fill="#161616" />
                    <path
                            fill-rule="evenodd"
                            clip-rule="evenodd"
                            d="M7.77295 16.3566L23.6563 0H32V6.88383C32 6.88383 31.8262 9.17836 30.6591 10.4057L19.7824 22H13.6938L7.77295 16.3566Z"
                            fill="currentColor" />
                  </svg>
                </span>
              </span>
                        <span class="app-brand-text demo menu-text fw-bold ms-3">Tân Trường Khoa</span>
                    </a>

                    <a href="javascript:void(0);" class="layout-menu-toggle menu-link text-large ms-auto">
                        <i class="icon-base ti menu-toggle-icon d-none d-xl-block"></i>
                        <i class="icon-base ti tabler-x d-block d-xl-none"></i>
                    </a>
                </div>

                <div class="menu-inner-shadow"></div>

                <ul class="menu-inner py-1">
                    <li class="menu-item">
                        <a href="/" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-smart-home"></i>
                            <div data-i18n="Tổng quan">Tổng quan</div>
                        </a>
                    </li>

                    <li class="menu-header small">
                        <span class="menu-header-text" data-i18n="Hợp đồng">Hợp đồng</span>
                    </li>
                    <li class="menu-item">
                        <a href="/hop-dong" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-file-text"></i>
                            <div data-i18n="Hợp đồng">Hợp đồng</div>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a href="/cau-hinh-gia-ban" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-currency-dollar"></i>
                            <div data-i18n="Cấu hình giá bán">Cấu hình giá bán</div>
                        </a>
                    </li>

                     <li class="menu-header small">
                        <span class="menu-header-text" data-i18n="Hệ Thống">Hệ Thống</span>
                    </li>
                    <li class="menu-item">
                        <a href="/nhan-vien" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-user-cog"></i>
                            <div data-i18n="Nhân viên">Nhân viên</div>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a href="/khach-hang" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-users"></i>
                            <div data-i18n="Khách hàng">Khách hàng</div>
                        </a>
                    </li>

                    <li class="menu-header small">
                        <span class="menu-header-text" data-i18n="DANH MỤC">DANH MỤC</span>
                    </li>

                    <li class="menu-item">
                        <a href="/danh-muc" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-category"></i>
                            <div data-i18n="Danh mục">Danh mục</div>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a href="/phuong-tien" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-truck"></i>
                            <div data-i18n="Phương tiện">Phương tiện</div>
                        </a>
                    </li>
                    <li class="menu-item">
                        <a href="/lai-xe" class="menu-link">
                            <i class="menu-icon icon-base ti tabler-users"></i>
                            <div data-i18n="Lái xe">Lái xe</div>
                        </a>
                    </li>
                    
                    <!-- Hệ thống -->
                    <li class="menu-item">
                        <a href="javascript:void(0);" class="menu-link menu-toggle">
                            <i class="menu-icon icon-base ti tabler-automation"></i>
                            <div data-i18n="Hệ thống">Hệ thống</div>
                        </a>
                        <ul class="menu-sub">
                    <!-- 
                            <li class="menu-item">
                                <a href="/vai-tro" class="menu-link">
                                    <div data-i18n="Bộ phận">Bộ phận</div>
                                </a>
                            </li>
                            <li class="menu-item">
                                <a href="/phan-quyen" class="menu-link">
                                    <div data-i18n="Phân quyền">Phân quyền</div>
                                </a>
                            </li>
                            <li class="menu-item">
                                <a href="/quan-ly/cap-nhat-ho-so/' . $user->uid . '" class="menu-link" id="update-ho-so">
                                    <div data-i18n="Hồ sơ cá nhân">Hồ sơ cá nhân</div>
                                </a>
                            </li>
                    Hệ thống -->
                            <li class="menu-item">
                                <a href="/user/logout" class="menu-link">
                                    <div data-i18n="Đăng xuất">Đăng xuất</div>
                                </a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </aside>

            <div class="menu-mobile-toggler d-xl-none rounded-1">
                <a href="javascript:void(0);" class="layout-menu-toggle menu-link text-large text-bg-secondary p-2 rounded-1">
                    <i class="ti tabler-menu icon-base"></i>
                    <i class="ti tabler-chevron-right icon-base"></i>
                </a>
            </div>';
}

/**
 * Implements hook_preprocess_html().
 * Loại bỏ tất cả các thư viện CSS/JS và chỉ nạp thư viện riêng cho các trang /quan-ly/*
 */
function edusoul_preprocess_html(&$variables)
{
    // Lấy đường dẫn hiện tại
    $current_path = current_path();
    $isFront = drupal_is_front_page();

    // Kiểm tra nếu đường dẫn bắt đầu bằng "quan-ly"
    /*if (strpos($current_path, 'quan-ly') === 0)*/ {
    // --- XÓA TẤT CẢ CSS MẶC ĐỊNH ---
    $css = drupal_add_css();
    foreach ($css as $media => $stylesheets) {
        foreach ($stylesheets as $path => $info) {
            // Xóa tất cả các CSS
            unset($css[$media][$path]);
        }
    }
    drupal_static_reset('drupal_add_css'); // Reset CSS

    // --- XÓA TẤT CẢ JS MẶC ĐỊNH ---
//    $js = drupal_add_js();
//    foreach ($js as $type => $scripts) {
//      if (is_array($scripts)) {
//        foreach ($scripts as $path => $info) {
//          // Xóa tất cả các JS
//          unset($js[$type][$path]);
//        }
//      }
//    }
//    drupal_static_reset('drupal_add_js'); // Reset JS

    // --- NẠP CSS VÀ JS RIÊNG ---
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/fonts/iconify-icons.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/sweetalert2/sweetalert2.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/node-waves/node-waves.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/css/core.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/css/demo.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/select2/select2.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/tagify/tagify.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/bs-stepper/bs-stepper.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/bootstrap-select/bootstrap-select.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/typeahead-js/typeahead.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/notyf/notyf.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/flatpickr/flatpickr.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/bootstrap-daterangepicker/bootstrap-daterangepicker.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/jquery-timepicker/jquery-timepicker.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/pickr/pickr-themes.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/libs/tagify/tagify.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));

    if ($isFront) {
        drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/css/pages/app-logistics-dashboard.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/css/pages/style.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));

    if ($current_path == 'user/login') {
        drupal_add_css(path_to_theme() . '/quan-ly/assets/vendor/css/pages/page-auth.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if ($current_path == 'luong-lai-xe') {
      drupal_add_css(drupal_get_path('module', 'bao_cao_luong_lai_xe') . '/css/bao_cao_luong_lai_xe.css', array('group' => CSS_THEME, 'every_page' => FALSE, 'weight' => 1));
//      drupal_add_js(drupal_get_path('module', 'bao_cao_luong_lai_xe') . '/quan-ly/assets/vendor/libs/jquery/jquery.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }

    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/jquery/jquery.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/popper/popper.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/js/bootstrap.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/select2/select2.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/tagify/tagify.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/bootstrap-select/bootstrap-select.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/typeahead-js/typeahead.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/bloodhound/bloodhound.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/node-waves/node-waves.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/@algolia/autocomplete-js.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/hammer/hammer.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/i18n/i18n.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/js/menu.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/js/helpers.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/notyf/notyf.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/sweetalert2/sweetalert2.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));

    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/notiflix/notiflix.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/js/config.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/js/select2.min.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/js/dropdown-hover.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));

    if ($isFront) {
        drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/apex-charts/apexcharts.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
        drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/swiper/swiper.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/bs-stepper/bs-stepper.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/moment/moment.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/flatpickr/flatpickr.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/bootstrap-daterangepicker/bootstrap-daterangepicker.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/jquery-timepicker/jquery-timepicker.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/pickr/pickr.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/js/forms-pickers.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/tagify/tagify.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/typeahead-js/typeahead.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/bloodhound/bloodhound.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/vendor/libs/cleave-zen/cleave-zen.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    drupal_add_js(path_to_theme() . '/quan-ly/assets/js/main.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));

    if ($current_path == 'user/login') {
        drupal_add_js(path_to_theme() . '/quan-ly/assets/js/login.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if ($isFront) {
        drupal_add_js(path_to_theme() . '/quan-ly/assets/js/dashboards-analytics.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
        drupal_add_js(path_to_theme() . '/quan-ly/assets/js/app-logistics-dashboard.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
        drupal_add_js(path_to_theme() . '/quan-ly/assets/js/app-academy-dashboard.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }

    // drupal_add_js(drupal_get_path('module', 'quan_ly_danh_muc') . '/js/quan_ly_danh_muc.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    // drupal_add_js(drupal_get_path('module', 'config') . '/js/config.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    // drupal_add_js(drupal_get_path('module', 'trucking') . '/js/trucking.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    // drupal_add_js(drupal_get_path('module', 'excel_import') . '/excel_import.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    // drupal_add_js(drupal_get_path('module', 'door_to_door') . '/js/door_to_door.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));

    if (strpos($current_path, 'trucking/index') !== false ||
        strpos($current_path, 'trucking-nhap') !== false ||
        strpos($current_path, 'trucking-nhap-chua-tra') !== false) {
        drupal_add_js(drupal_get_path('module', 'hack_toan_trucking') . '/js/xu_ly_trucking.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if (strpos($current_path, 'tai-xe') !== FALSE) {
        drupal_add_js(drupal_get_path('module', 'quan_ly_tai_xe') . '/js/quan_ly_tai_xe.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if (strpos($current_path, 'cung-duong') !== FALSE) {
        drupal_add_js(drupal_get_path('module', 'quan_ly_cung_duong') . '/js/quan_ly_cung_duong.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if (strpos($current_path, 'phuong-tien') !== FALSE) {
        // drupal_add_js(drupal_get_path('module', 'quan_ly_phuong_tien') . '/js/quan_ly_phuong_tien.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if ($current_path == 'quan-ly/vietnam-cities/edit') {
        drupal_add_js(drupal_get_path('module', 'vietnam_cities') . '/js/vietnam_cities.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if (strpos($current_path, 'vai-tro') !== FALSE) {
        drupal_add_js(drupal_get_path('module', 'quan_ly_vai_tro') . '/js/quan_ly_vai_tro.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    if (strpos($current_path, 'phan-quyen') !== FALSE) {
        drupal_add_js(drupal_get_path('module', 'phan_quyen') . '/js/phan_quyen.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));
    }
    // drupal_add_js(drupal_get_path('module', 'cap_nhat_ho_so') . '/js/cap_nhat_ho_so.js', array('group' => JS_THEME, 'every_page' => FALSE, 'weight' => 1));

    // Thêm class vào body để dễ quản lý bằng CSS
    $variables['classes_array'][] = 'quan-ly-page';
}
}

?>

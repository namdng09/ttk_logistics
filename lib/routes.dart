import 'package:kho555/views/ui/app/ecommerce/add_product_screen.dart';
import 'package:kho555/views/ui/app/ecommerce/cart_screen.dart';
import 'package:kho555/views/ui/app/ecommerce/checkout_screen.dart';
import 'package:kho555/views/ui/app/ecommerce/customers_screen.dart';
import 'package:kho555/views/ui/app/ecommerce/order_screen.dart';
import 'package:kho555/views/ui/app/ecommerce/product_detail_screen.dart';
import 'package:kho555/views/ui/app/ecommerce/product_screen.dart';
import 'package:kho555/views/ui/app/ecommerce/shop_screen.dart';
import 'package:kho555/views/ui/app/email/email_compose_screen.dart';
import 'package:kho555/views/ui/app/email/email_read_screen.dart';
import 'package:kho555/views/ui/app/email/inbox_screen.dart';
import 'package:kho555/views/ui/auth/lock_screen.dart';
import 'package:kho555/views/ui/auth/login_screen.dart';
import 'package:kho555/views/ui/auth/reset_password_screen.dart';
import 'package:kho555/views/ui/auth/sign_up_screen.dart';
import 'package:kho555/views/ui/calendar_screen.dart';
import 'package:kho555/views/ui/chat_screen.dart';
import 'package:kho555/views/ui/components/base_ui/accordions_screen.dart';
import 'package:kho555/views/ui/components/base_ui/alerts_screen.dart';
import 'package:kho555/views/ui/components/base_ui/avatar_screen.dart';
import 'package:kho555/views/ui/components/base_ui/badges_screen.dart';
import 'package:kho555/views/ui/components/base_ui/breadcrumb_screen.dart';
import 'package:kho555/views/ui/components/base_ui/buttons_screen.dart';
import 'package:kho555/views/ui/components/base_ui/cards_screen.dart';
import 'package:kho555/views/ui/components/base_ui/carousel_screen.dart';
import 'package:kho555/views/ui/components/base_ui/collapse_screen.dart';
import 'package:kho555/views/ui/components/base_ui/dropdowns_screen.dart';
import 'package:kho555/views/ui/components/base_ui/embed_video_screen.dart';
import 'package:kho555/views/ui/components/base_ui/links_screen.dart';
import 'package:kho555/views/ui/components/base_ui/list_group_screen.dart';
import 'package:kho555/views/ui/components/base_ui/modals_screen.dart';
import 'package:kho555/views/ui/components/base_ui/notifications_screen.dart';
import 'package:kho555/views/ui/components/base_ui/pagination_screen.dart';
import 'package:kho555/views/ui/components/base_ui/placeholders_screen.dart';
import 'package:kho555/views/ui/components/base_ui/progress_screen.dart';
import 'package:kho555/views/ui/components/base_ui/spinners_screen.dart';
import 'package:kho555/views/ui/components/base_ui/tabs_screen.dart';
import 'package:kho555/views/ui/components/base_ui/tool_tip_screen.dart';
import 'package:kho555/views/ui/components/base_ui/typography_screen.dart';
import 'package:kho555/views/ui/components/base_ui/utilities_screen.dart';
import 'package:kho555/views/ui/components/chart_screen.dart';
import 'package:kho555/views/ui/components/extended_ui/portlets_screen.dart';
import 'package:kho555/views/ui/components/extended_ui/range_slider_screen.dart';
import 'package:kho555/views/ui/components/extended_ui/scroll_bar_screen.dart';
import 'package:kho555/views/ui/components/forms/basic_element_screen.dart';
import 'package:kho555/views/ui/components/forms/file_uploads_screen.dart';
import 'package:kho555/views/ui/components/forms/form_editor_screen.dart';
import 'package:kho555/views/ui/components/forms/form_validation_screen.dart';
import 'package:kho555/views/ui/components/forms/form_wizard_screen.dart';
import 'package:kho555/views/ui/components/forms/x_editable_screen.dart';
import 'package:kho555/views/ui/components/icon/remix_icon_screen.dart';
import 'package:kho555/views/ui/components/map_screen.dart';
import 'package:kho555/views/ui/components/table_screen.dart';
import 'package:kho555/views/ui/dashboard_screen.dart';
import 'package:kho555/views/ui/pages/bao_gia_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/cau_hinh_bao_hiem_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/cau_hinh_cuoc_van_chuyen_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/lai_xe_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/phuong_tien_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/them_don_hang_page_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cau_hinh_lenh_dieu_dong_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cau_hinh_screen.dart';
import 'package:kho555/views/ui/pages/bap2/chuyen_xe_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cong_no_khach_hang_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cong_no_nha_cung_cap_screen.dart';
import 'package:kho555/views/ui/pages/bap2/doanh_thu_xe_screen.dart';
import 'package:kho555/views/ui/pages/bap2/form_don_hang_screen.dart';
import 'package:kho555/views/ui/pages/bap2/luong_lai_xe_screen.dart';
import 'package:kho555/views/ui/pages/bap2/thuong_diem_thuong_chuyen_page_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cau_hinh_phi_luu_ca_screen.dart';
import 'package:kho555/views/ui/pages/bap2/tra_xe_cung_tinh_page_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cau_hinh_cuoc_van_chuyen_thue_ngoai_page_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cau_hinh_gio_luu_ca_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/cau_hinh_phi_hai_quan_page_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cau_hinh_qua_kho_qua_tai_page_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cau_hinh_bao_hiem_screen.dart';
import 'package:kho555/views/ui/pages/bap2/chi_phi_hai_quan_tong_hop_screen.dart';
import 'package:kho555/views/ui/pages/bap2/cuoc_van_chuyen_screen.dart';
import 'package:kho555/views/ui/pages/danh_muc_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/khach_hang_page_screen.dart';
import 'package:kho555/views/ui/pages/kho555/ton_kho_vat_tu_page_screen.dart';
import 'package:kho555/views/ui/pages/kho555/ton_kho_vat_tu_theo_thang_page_screen.dart';
import 'package:kho555/views/ui/pages/loai_xe_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/nha_xe_page_screen.dart';
import 'package:kho555/views/ui/pages/bap/tinh_phi_luu_ca_page_screen.dart';
import 'package:kho555/views/ui/pages/bap2/tra_xe_cung_tuyen_page_screen.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/views/ui/pages/blank_page_screen.dart';
import 'package:kho555/views/ui/pages/coming_soon_screen.dart';
import 'package:kho555/views/ui/pages/error_404_screen.dart';
import 'package:kho555/views/ui/pages/error_500_screen.dart';
import 'package:kho555/views/ui/pages/faqs_screen.dart';
import 'package:kho555/views/ui/pages/invoice_screen.dart';
import 'package:kho555/views/ui/pages/pricing_screen.dart';
import 'package:kho555/views/ui/pages/timeline_screen.dart';

import 'controller/pages/config_block_page_controller.dart';
import 'views/ui/pages/kho555/ben_thu_ba_page_screen.dart';
import 'views/ui/pages/kho555/danh_muc_kho_page_screen.dart';
import 'views/ui/pages/kho555/nhap_vat_tu_page_screen.dart';
import 'views/ui/pages/kho555/phieu_nhap_vat_tu_page_screen.dart';
import 'views/ui/pages/kho555/vat_tu_page_screen.dart';

class AuthMiddleware extends GetMiddleware {
  @override
  RouteSettings? redirect(String? route) {
    return AuthService.isLoggedIn ? null : const RouteSettings(name: '/auth/login');
  }
}

List<GetPage> getPageRoute() {
  var routes = [
    GetPage(name: '/auth/reset_password', page: () => ResetPasswordScreen()),
    GetPage(name: '/auth/sign_up', page: () => SignUpScreen()),
    GetPage(name: '/auth/lock', page: () => LockScreen()),

    GetPage(name: '/dashboard', page: () => DashboardScreen()),
    // GetPage(name: '/calendar', page: () => CalendarScreen()),
    // GetPage(name: '/chat', page: () => ChatScreen()),
    // GetPage(name: '/ecommerce/products', page: () => ProductScreen()),
    // GetPage(name: '/ecommerce/product_detail', page: () => ProductDetailScreen()),
    // GetPage(name: '/ecommerce/orders', page: () => OrderScreen()),
    // GetPage(name: '/ecommerce/customers', page: () => CustomersScreen()),
    // GetPage(name: '/ecommerce/cart', page: () => CartScreen()),
    // GetPage(name: '/ecommerce/checkout', page: () => CheckoutScreen()),
    // GetPage(name: '/ecommerce/shop', page: () => ShopScreen()),
    // GetPage(name: '/ecommerce/add_product', page: () => AddProductScreen()),
    // GetPage(name: '/email/inbox', page: () => InboxScreen()),
    // GetPage(name: '/email/read', page: () => EmailReadScreen()),
    // GetPage(name: '/email/compose', page: () => EmailComposeScreen()),
    //
    // GetPage(name: '/components/accordions', page: () => AccordionsScreen()),
    // GetPage(name: '/components/alerts', page: () => AlertsScreen()),
    // GetPage(name: '/components/avatar', page: () => AvatarScreen()),
    // GetPage(name: '/components/button', page: () => ButtonsScreen()),
    // GetPage(name: '/components/badges', page: () => BadgesScreen()),
    // GetPage(name: '/components/breadcrumb', page: () => BreadcrumbScreen()),
    // GetPage(name: '/components/card', page: () => CardsScreen()),
    // GetPage(name: '/components/carousel', page: () => CarouselScreen()),
    // GetPage(name: '/components/collapse', page: () => CollapseScreen()),
    // GetPage(name: '/components/dropdown', page: () => DropdownsScreen()),
    // GetPage(name: '/components/embed_video', page: () => EmbedVideoScreen()),
    // GetPage(name: '/components/links', page: () => LinksScreen()),
    // GetPage(name: '/components/list_group', page: () => ListGroupScreen()),
    // GetPage(name: '/components/modals', page: () => ModalsScreen()),
    // GetPage(name: '/components/notification', page: () => NotificationsScreen()),
    // GetPage(name: '/components/placeholders', page: () => PlaceholdersScreen()),
    // GetPage(name: '/components/pagination', page: () => PaginationScreen()),
    // GetPage(name: '/components/progress', page: () => ProgressScreen()),
    // GetPage(name: '/components/spinner', page: () => SpinnersScreen()),
    // GetPage(name: '/components/tab', page: () => TabsScreen()),
    // GetPage(name: '/components/tooltip', page: () => ToolTipScreen()),
    // GetPage(name: '/components/typography', page: () => TypographyScreen()),
    // GetPage(name: '/components/utilities', page: () => UtilitiesScreen()),
    // GetPage(name: '/extended_ui/range_slider', page: () => RangeSliderScreen()),
    // GetPage(name: '/extended_ui/scrollbar', page: () => ScrollBarScreen()),
    // GetPage(name: '/extended_ui/portlets', page: () => PortletsScreen()),
    // GetPage(name: '/icon/remix_icon', page: () => RemixIconScreen()),
    // GetPage(name: '/chart', page: () => ChartScreen()),
    // GetPage(name: '/table', page: () => TableScreen()),
    // GetPage(name: '/maps', page: () => MapScreen()),
    // GetPage(name: '/forms/basic_element', page: () => BasicElementScreen()),
    // GetPage(name: '/forms/validation', page: () => FormValidationScreen()),
    // GetPage(name: '/forms/file_upload', page: () => FileUploadsScreen()),
    // GetPage(name: '/forms/form_editors', page: () => FormEditorScreen()),
    // GetPage(name: '/forms/x_editable', page: () => XEditableScreen()),
    // GetPage(name: '/forms/form_wizard', page: () => FormWizardScreen()),
    //
    // GetPage(name: '/pages/blank_page', page: () => BlankPageScreen()),
    // GetPage(name: '/pages/coming_soon', page: () => ComingSoonScreen()),
    // GetPage(name: '/pages/page_404', page: () => Error404Screen()),
    // GetPage(name: '/pages/page_500', page: () => Error500Screen()),
    // GetPage(name: '/pages/faqs', page: () => FaqsScreen()),
    // GetPage(name: '/pages/invoice', page: () => InvoiceScreen()),
    // GetPage(name: '/pages/pricing', page: () => PricingScreen()),
    // GetPage(name: '/pages/timeline', page: () => TimelineScreen()),
    // // new
    // GetPage(
    //     name: '/danh-muc',
    //     page: () => DanhMucPageScreen(),
    //     middlewares: [AuthMiddleware()],
    // ),
    // // GetPage(name: '/loai-xe', page: () => LoaiXePageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/them-bao-gia', page: () => BaoGiaPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/tra-xe-cung-tinh', page: () => TraXeCungTinhPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/tra-xe-cung-tuyen', page: () => TraXeCungTuyenPageScreen(),middlewares: [AuthMiddleware()]),
    // // GetPage(name: '/tinh-phi-luu-ca', page: () => TinhPhiLuuCaPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-phi-luu-ca', page: () => CauHinhPhiLuuCaScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/gio-luu-ca', page: () => CauHinhGioLuuCaPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-qua-kho-qua-tai', page: () => CauHinhQuaKhoQuaTaiPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/thuong-tra-diem-tra-chuyen', page: () => ThuongDiemThuongChuyenPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cong-no-khach-hang', page: () => CongNoKhachHangScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cong-no-nha-cung-cap', page: () => CongNoNhaCungCapScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-khac', page: () => CauHinhScreen(),middlewares: [AuthMiddleware()]),
    // // GetPage(name: '/huu-nghi', page: () => CauHinhPhiHaiQuanPageScreen(type: 'huu-nghi',),middlewares: [AuthMiddleware()]),
    // // GetPage(name: '/chi-ma', page: () => CauHinhPhiHaiQuanPageScreen(type: 'chi-ma',),middlewares: [AuthMiddleware()]),
    // // GetPage(name: '/coc-nam', page: () => CauHinhPhiHaiQuanPageScreen(type: 'coc-nam',),middlewares: [AuthMiddleware()]),
    // // GetPage(name: '/quan-ga', page: () => CauHinhPhiHaiQuanPageScreen(type: 'quan-ga',),middlewares: [AuthMiddleware()]),
    // // GetPage(name: '/tan-thanh', page: () => CauHinhPhiHaiQuanPageScreen(type: 'tan-thanh',),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-bao-hiem', page: () => CauHinhBaoHiemScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-cuoc-van-chuyen', page: () => CuocVanChuyenScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-cuoc-van-chuyen-thue-ngoai', page: () => CauHinhCuocVanChuyenThueNgoaiPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-phi-hai-quan', page: () => ChiPhiHaiQuanTongHopScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/nha-xe', page: () => NhaXePageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/tai-xe', page: () => LaiXePageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/phuong-tien', page: () => PhuongTienPageScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/them-don-hang', page: () => FormDonHangScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/chuyen-xe', page: () => ChuyenXeScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/login', page: () => LoginScreen()),
    // GetPage(name: '/cau-hinh-hop-dong-cong-ty', page: () => CauHinhHopDongCongTyScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/cau-hinh-lenh-dieu-dong', page: () => CauHinhLenhDieuDongScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/luong-lai-xe', page: () => LuongLaiXeScreen(),middlewares: [AuthMiddleware()]),
    // GetPage(name: '/doanh-thu-xe', page: () => DoanhThuXeScreen(),middlewares: [AuthMiddleware()]),
    //


    // Quản lý kho
    GetPage(name: '/vat-tu', page: () => VatTuPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/ben-thu-ba', page: () => BenThuBaPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/kho-vat-tu', page: () => DanhMucKhoPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/nhap-vat-tu', page: () => NhapVatTuPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/phieu-nhap', page: () => PhieuNhapVatTuPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/ton-kho', page: () => TonKhoVatTuPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/ton-kho-theo-thang', page: () => TonKhoVatTuTheoThangPageScreen(),middlewares: [AuthMiddleware()]),

  ];
  // return routes.map((e) => GetPage(name: e.name, page: e.page, middlewares: e.middlewares, transition: Transition.noTransition)).toList();
  // map toàn bộ để thêm transition mặc định
  return routes
      .map((e) => GetPage(
    name: e.name,
    page: e.page,
    middlewares: e.middlewares,
    transition: Transition.noTransition,
  ))
  .toList();
}

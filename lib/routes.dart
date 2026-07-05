import 'package:ttk_logistics/views/ui/auth/lock_screen.dart';
import 'package:ttk_logistics/views/ui/auth/login_screen.dart';
import 'package:ttk_logistics/views/ui/auth/reset_password_screen.dart';
import 'package:ttk_logistics/views/ui/auth/sign_up_screen.dart';
import 'package:ttk_logistics/views/ui/dashboard_screen.dart';
import 'package:ttk_logistics/views/ui/pages/kho555/ton_kho_vat_tu_page_screen.dart';
import 'package:ttk_logistics/views/ui/pages/kho555/ton_kho_vat_tu_theo_thang_page_screen.dart';
import 'package:flutter/cupertino.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';

import 'views/ui/pages/kho555/ben_thu_ba_page_screen.dart';
import 'views/ui/pages/kho555/danh_muc_kho_page_screen.dart';
import 'views/ui/pages/kho555/nhap_vat_tu_page_screen.dart';
import 'views/ui/pages/kho555/phieu_nhap_vat_tu_page_screen.dart';
import 'views/ui/pages/kho555/vat_tu_page_screen.dart';
import 'views/ui/pages/kho555/danh_muc_page_screen.dart';
import 'views/ui/pages/kho555/phuong_tien_page_screen.dart';
import 'views/ui/pages/kho555/lai_xe_page_screen.dart';
import 'views/ui/pages/kho555/hop_dong_page_screen.dart';

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
    GetPage(name: '/danh-muc', page: () => DanhMucPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/phuong-tien', page: () => PhuongTienPageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/lai-xe', page: () => LaiXePageScreen(),middlewares: [AuthMiddleware()]),
    GetPage(name: '/hop-dong', page: () => HopDongPageScreen(),middlewares: [AuthMiddleware()]),
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

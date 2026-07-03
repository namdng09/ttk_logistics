import 'package:ttk_logistics/helper/services/url_service.dart';
import 'package:ttk_logistics/helper/theme/theme_customizer.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/images.dart';
import 'package:ttk_logistics/views/layout/widget/menu_item.dart';
import 'package:ttk_logistics/views/layout/widget/menu_widget.dart';
import 'package:ttk_logistics/views/layout/widget/navigation_item.dart';
import 'package:flutter/material.dart';
import 'package:remixicon/remixicon.dart';

class LeftBar extends StatefulWidget {
  final bool isCondensed;

  const LeftBar({super.key, this.isCondensed = false});

  @override
  State<LeftBar> createState() => _LeftBarState();
}

class _LeftBarState extends State<LeftBar> with SingleTickerProviderStateMixin, UIMixin {
  final ThemeCustomizer customizer = ThemeCustomizer.instance;

  bool isCondensed = false;
  String path = UrlService.getCurrentUrl();

  @override
  Widget build(BuildContext context) {
    isCondensed = widget.isCondensed;
    return MyCard(
      paddingAll: 0,
      shadow: MyShadow(position: MyShadowPosition.centerRight, elevation: 0.2),
      child: AnimatedContainer(
        color: leftBarTheme.background,
        width: isCondensed ? 70 : 255,
        curve: Curves.easeInOut,
        duration: Duration(milliseconds: 400),
        child: Column(
          children: [
            if (!isCondensed)
              Container(
                height: 150,
                width: double.infinity,
                color: contentTheme.primary.withValues(alpha: .7),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Stack(
                      children: [
                        MyContainer.roundBordered(
                          paddingAll: 4,
                          color: Colors.transparent,
                          border: Border.all(width: 3, color: Colors.green),
                          child: MyContainer.rounded(
                            height: 50,
                            width: 50,
                            paddingAll: 0,
                            color: Colors.transparent,
                            child: Image.asset(Images.users[6]),
                          ),
                        ),
                        Positioned(
                          bottom: 2,
                          right: 2,
                          child: MyContainer.roundBordered(
                            width: 15,
                            height: 15,
                            color: Colors.green,
                            paddingAll: 0,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                        ),
                      ],
                    ),
                    MySpacing.height(12),
                    MyText.bodyMedium("James Raphael", color: leftBarTheme.background, fontWeight: 600),
                    MySpacing.height(4),
                    MyText.bodySmall("Administrator", muted: true, color: leftBarTheme.background),
                  ],
                ),
              ),
            MySpacing.height(12),
            Expanded(
              child: ScrollConfiguration(
                behavior: ScrollConfiguration.of(context).copyWith(scrollbars: false),
                child: ListView(
                  shrinkWrap: true,
                  controller: ScrollController(),
                  physics: BouncingScrollPhysics(),
                  clipBehavior: Clip.antiAliasWithSaveLayer,
                  children: [
                    labelWidget("menu"),
                    NavigationItem(iconData: RemixIcons.home_4_line, title: "Tổng quan", isCondensed: isCondensed, route: '/dashboard'),
                    // labelWidget("Hợp đồng"),
                    // NavigationItem(iconData: RemixIcons.add_circle_line, title: "Thêm hợp đồng", isCondensed: isCondensed, route: '/them-don-hang'),
                    // NavigationItem(iconData: RemixIcons.add_circle_line, title: "Danh sách HĐ", isCondensed: isCondensed, route: '/chuyen-xe'),
                    // labelWidget("Quản lý kho"),
                    // NavigationItem(iconData: RemixIcons.group_line, title: "Vật tư", isCondensed: isCondensed, route: '/vat-tu'),
                    // NavigationItem(iconData: RemixIcons.group_line, title: "Nhập vật tư", isCondensed: isCondensed, route: '/nhap-vat-tu'),
                    // NavigationItem(iconData: RemixIcons.group_line, title: "Tồn kho ngày", isCondensed: isCondensed, route: '/ton-kho'),
                    // NavigationItem(iconData: RemixIcons.group_line, title: "Tồn kho tháng", isCondensed: isCondensed, route: '/ton-kho-theo-thang'),
                    labelWidget("Nhập xuất kho"),
                    NavigationItem(iconData: RemixIcons.group_line, title: "Phiếu nhập", isCondensed: isCondensed, route: '/phieu-nhap'),
                    NavigationItem(iconData: RemixIcons.group_line, title: "Phiếu xuất", isCondensed: isCondensed, route: '/vat-tu'),
                    labelWidget("Tài chính"),
                    NavigationItem(iconData: RemixIcons.user_2_line, title: "Đề nghị TT", isCondensed: isCondensed, route: '/luong-lai-xe'),
                    NavigationItem(iconData: RemixIcons.money_pound_circle_line, title: "Công nợ KH", isCondensed: isCondensed, route: '/cong-no-khach-hang'),
                    NavigationItem(iconData: RemixIcons.money_pound_circle_line, title: "Công nợ NCC", isCondensed: isCondensed, route: '/cong-no-nha-cung-cap'),
                    labelWidget("Danh mục"),
                    NavigationItem(iconData: RemixIcons.group_line, title: "Kho vật tư", isCondensed: isCondensed, route: '/kho-vat-tu'),
                    NavigationItem(iconData: RemixIcons.group_line, title: "Bên thứ 3", isCondensed: isCondensed, route: '/ben-thu-ba'),
                    NavigationItem(iconData: RemixIcons.group_line, title: "Danh mục", isCondensed: isCondensed, route: '/danh-muc'),
                    NavigationItem(iconData: RemixIcons.truck_line, title: "Phương tiện", isCondensed: isCondensed, route: '/phuong-tien'),

                    MenuWidget(
                      iconData: RemixIcons.tools_line,
                      isCondensed: isCondensed,
                      title: "Hệ thống",
                      children: [
                        MenuItem(title: 'Người dùng', route: '/nguoi-dung', isCondensed: widget.isCondensed),
                        MenuItem(title: 'Vai trò', route: '/vai-tro', isCondensed: widget.isCondensed),
                        MenuItem(title: 'Phân quyền', route: '/phan-quyen', isCondensed: widget.isCondensed),
                        MenuItem(title: 'Khoá màn hình', route: '/auth/lock', isCondensed: widget.isCondensed),
                      ],
                    ),
                    MySpacing.height(20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget labelWidget(String label) {
    return isCondensed
        ? MySpacing.empty()
        : Container(
            padding: MySpacing.x(24),
            child: MyText.labelSmall(
              label.toUpperCase(),
              color: leftBarTheme.labelColor,
              muted: true,
              maxLines: 1,
              overflow: TextOverflow.clip,
              fontWeight: 700,
            ),
          );
  }
}

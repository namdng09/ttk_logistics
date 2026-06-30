import 'package:ttk_logistics/controller/layout/layout_controller.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/theme/app_style.dart';
import 'package:ttk_logistics/helper/theme/theme_customizer.dart';
import 'package:ttk_logistics/helper/widgets/my_breadcrumb.dart';
import 'package:ttk_logistics/helper/widgets/my_breadcrumb_item.dart';
import 'package:ttk_logistics/helper/widgets/my_button.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_responsive.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/images.dart';
import 'package:ttk_logistics/views/layout/left_bar.dart';
import 'package:ttk_logistics/views/layout/top_bar.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/widgets/custom_pop_menu.dart';
import 'package:remixicon/remixicon.dart';

import '../../helper/services/auth_services.dart';
import '../../helper/storage/local_storage.dart';
import '../ui/auth/login_screen.dart';

class Layout extends StatefulWidget {
  final Widget? child;
  final String subScreenName;
  final String mainScreenName;

  final List<Widget>? actions;

  const Layout({
    super.key,
    this.child,
    required this.subScreenName,
    required this.mainScreenName,
    this.actions,
  });

  @override
  State<Layout> createState() => _LayoutState();
}

class _LayoutState extends State<Layout> {
  final LayoutController controller = LayoutController();

  final topBarTheme = AdminTheme.theme.topBarTheme;

  final contentTheme = AdminTheme.theme.contentTheme;

  Function? languageHideFn;

  @override
  Widget build(BuildContext context) {
    return MyResponsive(
      builder: (BuildContext context, _, screenMT) {
        return GetBuilder(
          init: controller,
          builder: (controller) {
            if (screenMT.isMobile || screenMT.isTablet) {
              return mobileScreen();
            } else {
              return largeScreen();
            }
          },
        );
      },
    );
  }

  Widget mobileScreen() {
    return Scaffold(
      key: controller.scaffoldKey,
      appBar: AppBar(
        elevation: 0,
        actions: [
          InkWell(
            onTap: () {
              ThemeCustomizer.setTheme(ThemeCustomizer.instance.theme == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark);
            },
            child: Icon(
              ThemeCustomizer.instance.theme == ThemeMode.dark ? RemixIcons.sun_line : RemixIcons.moon_line,
              size: 18,
              color: topBarTheme.onBackground,
            ),
          ),
          MySpacing.width(8),
          CustomPopupMenu(
            backdrop: true,
            onChange: (_) {},
            offsetX: -240,
            menu: Padding(
              padding: MySpacing.xy(8, 8),
              child: Center(child: Icon(RemixIcons.notification_3_line, size: 18)),
            ),
            menuBuilder: (_) => _buildNotificationIcon(),
          ),
          MySpacing.width(8),
          CustomPopupMenu(
            backdrop: true,
            onChange: (_) {},
            offsetX: -90,
            offsetY: 4,
            menu: Padding(
              padding: MySpacing.xy(8, 8),
              child: MyContainer.rounded(paddingAll: 0, child: Image.asset(Images.users[0], height: 28, width: 28, fit: BoxFit.cover)),
            ),
            menuBuilder: (_) => buildAccountMenu(),
          ),
          MySpacing.width(20),
        ],
      ),
      // endDrawer: RightBar(),
      drawer: LeftBar(),
      body: SingleChildScrollView(padding: MySpacing.all(20), key: controller.scrollKey, child: widget.child),
    );
  }

  Widget largeScreen() {
    return Scaffold(
      key: controller.scaffoldKey,
      body: Column(
        children: [
          TopBar(),
          Expanded(
            child: Row(
              children: [
                LeftBar(isCondensed: ThemeCustomizer.instance.leftBarCondensed),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: SingleChildScrollView(
                          controller: controller.scrollController,
                          key: controller.scrollKey,
                          child: Stack(
                            children: [
                              MyContainer.none(
                                height: 150,
                                color: contentTheme.primary.withValues(alpha: 0.7),
                                child: Padding(
                                  padding: MySpacing.nBottom(28),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          MyText.titleMedium(
                                            widget.subScreenName.toUpperCase(),
                                            fontSize: 18,
                                            fontWeight: 600,
                                            color: contentTheme.onPrimary,
                                          ),
                                          MyBreadcrumb(
                                            children: [
                                              MyBreadcrumbItem(name: widget.mainScreenName),
                                              MyBreadcrumbItem(name: widget.subScreenName),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const Spacer(), // giữ để đẩy các nút sang phải
                                      if (widget.actions != null)
                                        Row(
                                          children: widget.actions!,
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                              Padding(
                                padding: MySpacing.only(top: 94, left: 28, right: 28, bottom: 28),
                                child: widget.child,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationIcon() {
    final List<Map<String, dynamic>> notifications = [
      {'avatar': 'assets/users/avatar-1.jpg', 'text': 'Sally Bieber started following you. Check out their profile!'},
      {
        'avatar': null,
        'icon': Icons.person,
        'bgColor': Colors.blue,
        'title': 'Gloria Chambers',
        'text': "mentioned you in a comment: '@admin, check this out!'",
      },
      {
        'avatar': 'assets/users/avatar-3.jpg',
        'title': 'Jacob Gines',
        'text': "Answered to your comment on the cash flow forecast's graph 🔔.",
      },
      {
        'avatar': null,
        'icon': Icons.system_update,
        'bgColor': Colors.orange,
        'text': 'A new system update is available. Update now for the latest features.',
      },
      {'avatar': 'assets/users/avatar-5.jpg', 'title': 'Shawn Bunch', 'text': "commented on your post: 'Great photo!'"},
    ];
    return MyContainer(
      paddingAll: 0,
      width: 320,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: MySpacing.x(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                MyText.bodyMedium("Notification", fontWeight: 600),
                MyButton.text(
                  padding: MySpacing.xy(8, 12),
                  onPressed: () => languageHideFn?.call(),
                  elevation: 0,
                  backgroundColor: Colors.transparent,
                  splashColor: Colors.transparent,
                  child: MyText.labelSmall("Clear All", xMuted: true, decoration: TextDecoration.underline),
                ),
              ],
            ),
          ),
          Divider(height: 0),
          MyContainer(
            height: 300,
            paddingAll: 0,
            child: ListView.separated(
              itemCount: notifications.length,
              shrinkWrap: true,
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return MyButton(
                  backgroundColor: Colors.transparent,
                  msBackgroundColor: WidgetStatePropertyAll(Colors.transparent),
                  onPressed: () {},
                  padding: MySpacing.zero,
                  msPadding: WidgetStatePropertyAll(MySpacing.zero),
                  splashColor: contentTheme.light.withValues(alpha: 0.4),
                  child: Padding(
                    padding: MySpacing.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyContainer.rounded(
                          height: 36,
                          width: 36,
                          paddingAll: 0,
                          color: contentTheme.background,
                          child: notification['avatar'] != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(36),
                                  child: Image.asset(notification['avatar']!, fit: BoxFit.cover),
                                )
                              : Center(
                                  child: notification['name'] == null
                                      ? Icon(notification['icon'], size: 16, color: notification['bgColor'])
                                      : MyText.titleMedium(notification['name']![0].toUpperCase(), color: contentTheme.primary),
                                ),
                        ),
                        MySpacing.width(12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (notification['title'] != null) MyText.bodyMedium(notification['title'] ?? "", fontWeight: 600),
                              if (notification['title'] != null) MySpacing.height(4),
                              MyText.bodySmall(notification['text'] ?? ""),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
              separatorBuilder: (context, index) => Divider(height: 0),
            ),
          ),
          Divider(height: 0),
          SizedBox(
            height: 60,
            child: Center(
              child: MyButton.small(
                onPressed: () => languageHideFn?.call(),
                elevation: 0,
                padding: MySpacing.all(8),
                backgroundColor: contentTheme.primary,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    MyText.labelMedium("View all notification", fontWeight: 600, color: contentTheme.onPrimary),
                    MySpacing.width(8),
                    Icon(RemixIcons.arrow_right_line, size: 16, color: contentTheme.onPrimary),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget buildAccountMenu() {
    return MyContainer.bordered(
      paddingAll: 0,
      width: 150,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: MySpacing.xy(8, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyButton(
                  onPressed: () => {},
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  borderRadiusAll: AppStyle.buttonRadius.medium,
                  padding: MySpacing.xy(8, 4),
                  splashColor: contentTheme.onBackground.withAlpha(20),
                  backgroundColor: Colors.transparent,
                  child: Row(
                    children: [
                      Icon(RemixIcons.user_line, size: 14, color: contentTheme.onBackground),
                      MySpacing.width(8),
                      MyText.labelMedium("My Account", fontWeight: 600),
                    ],
                  ),
                ),
                MySpacing.height(4),
                MyButton(
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  onPressed: () => {},
                  borderRadiusAll: AppStyle.buttonRadius.medium,
                  padding: MySpacing.xy(8, 4),
                  splashColor: contentTheme.onBackground.withAlpha(20),
                  backgroundColor: Colors.transparent,
                  child: Row(
                    children: [
                      Icon(RemixIcons.settings_line, size: 14, color: contentTheme.onBackground),
                      MySpacing.width(8),
                      MyText.labelMedium("Settings", fontWeight: 600),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 1),
          Padding(
            padding: MySpacing.xy(8, 8),
            child: MyButton(
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              onPressed: () async {
                // ✅ Xoá dữ liệu đăng nhập
                await LocalStorage.setLoggedInUser(false);
                await LocalStorage.setUserToken("");
                await LocalStorage.setUserEmail("");
                await LocalStorage.setUserID("");

                AuthService.isLoggedIn = false;

                // Nếu muốn xoá sạch toàn bộ storage:
                // await LocalStorage.preferences.clear();

                // ✅ Quay về màn hình login
                Get.offAll(() => LoginScreen());
              },
              borderRadiusAll: AppStyle.buttonRadius.medium,
              padding: MySpacing.xy(8, 4),
              splashColor: contentTheme.danger.withAlpha(28),
              backgroundColor: Colors.transparent,
              child: Row(
                children: [
                  Icon(RemixIcons.logout_box_r_line, size: 14, color: contentTheme.danger),
                  MySpacing.width(8),
                  MyText.labelMedium("Đăng xuất", fontSize: 16, fontWeight: 600, color: contentTheme.danger),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

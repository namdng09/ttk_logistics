import 'package:kho555/helper/localization/language.dart';
import 'package:kho555/helper/theme/app_notifier.dart';
import 'package:kho555/helper/theme/app_style.dart';
import 'package:kho555/helper/theme/theme_customizer.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/widgets/my_button.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/images.dart';
import 'package:kho555/views/ui/auth/login_screen.dart';
import 'package:kho555/widgets/custom_pop_menu.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:provider/provider.dart';
import 'package:remixicon/remixicon.dart';

import '../../helper/services/auth_services.dart';
import '../../helper/storage/local_storage.dart';

class TopBar extends StatefulWidget {
  const TopBar({super.key});

  @override
  State<TopBar> createState() => _TopBarState();
}

class _TopBarState extends State<TopBar> with SingleTickerProviderStateMixin, UIMixin {
  Function? languageHideFn;
  bool isLeftBarCondensed = false;
  int isNotificationTab = 0;
  Function? hideFn;

  void leftBarCondensedToggle() {
    ThemeCustomizer.toggleLeftBarCondensed();
    isLeftBarCondensed = !isLeftBarCondensed;
    setState(() {});
  }

  void onChangeNotificationTabBar(int id) {
    isNotificationTab = id;
    setState(() {});
  }

  final List<Map<String, dynamic>> notifications = [
    {'avatar': 'assets/users/avatar-1.jpg', 'text': 'Sally Bieber started following you. Check out their profile!'},
    {
      'avatar': null,
      'icon': Icons.person,
      'bgColor': Colors.blue,
      'title': 'Gloria Chambers',
      'text': "mentioned you in a comment: '@admin, check this out!'",
    },
    {'avatar': 'assets/users/avatar-3.jpg', 'title': 'Jacob Gines', 'text': "Answered to your comment on the cash flow forecast's graph 🔔."},
    {
      'avatar': null,
      'icon': Icons.system_update,
      'bgColor': Colors.orange,
      'text': 'A new system update is available. Update now for the latest features.',
    },
    {'avatar': 'assets/users/avatar-5.jpg', 'title': 'Shawn Bunch', 'text': "commented on your post: 'Great photo!'"},
  ];

  @override
  Widget build(BuildContext context) {
    return MyCard(
      shadow: MyShadow(position: MyShadowPosition.bottomRight, elevation: 0.5),
      height: 69,
      borderRadiusAll: 0,
      padding: MySpacing.x(32),
      color: topBarTheme.background.withAlpha(246),
      child: Row(
        children: [
          SizedBox(
            height: 60,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                InkWell(
                  onTap: () {
                    Get.toNamed('/dashboard');
                  },
                  child: Image.asset(Images.logoDark, height: 28),
                ),
              ],
            ),
          ),
          MySpacing.width(70),
          InkWell(
            splashColor: colorScheme.onSurface,
            highlightColor: colorScheme.onSurface,
            onTap: () => leftBarCondensedToggle(),
            child: Icon(RemixIcons.menu_line, color: topBarTheme.onBackground),
          ),
          MySpacing.width(12),
          Icon(RemixIcons.mail_line, size: 20, color: contentTheme.secondary.withValues(alpha: 2)),
          MySpacing.width(12),
          Icon(RemixIcons.chat_2_line, size: 20, color: contentTheme.secondary.withValues(alpha: 2)),
          MySpacing.width(12),
          Icon(RemixIcons.calendar_2_line, size: 20, color: contentTheme.secondary.withValues(alpha: 2)),
          MySpacing.width(12),
          Icon(RemixIcons.printer_fill, size: 20, color: contentTheme.secondary.withValues(alpha: 2)),
          Expanded(
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                MySpacing.width(24),
                CustomPopupMenu(
                  backdrop: true,
                  onChange: (_) {},
                  offsetX: -200,
                  offsetY: 21,
                  menu: Icon(RemixIcons.notification_3_line, size: 20),
                  menuBuilder: (_) => _buildNotificationIcon(),
                ),
                MySpacing.width(24),
                InkWell(
                  onTap: () {},
                  child: Icon(RemixIcons.settings_4_line, size: 20, color: topBarTheme.onBackground),
                ),
                MySpacing.width(24),
                CustomPopupMenu(
                  backdrop: true,
                  onChange: (_) {},
                  offsetX: -100,
                  offsetY: 0,
                  menu: Padding(
                    padding: MySpacing.xy(8, 8),
                    child: MyContainer.rounded(paddingAll: 0, child: Image.asset(Images.users[1], height: 28, width: 28, fit: BoxFit.cover)),
                  ),
                  menuBuilder: (_) => buildAccountMenu(),
                  hideFn: (hide) => languageHideFn = hide,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buildLanguageSelector() {
    return MyContainer.bordered(
      padding: MySpacing.xy(8, 8),
      width: 125,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: Language.languages
            .map(
              (language) => MyButton.text(
                padding: MySpacing.xy(8, 4),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                splashColor: contentTheme.onBackground.withAlpha(20),
                onPressed: () async {
                  languageHideFn?.call();
                  await Provider.of<AppNotifier>(context, listen: false).changeLanguage(language, notify: true);
                  ThemeCustomizer.notify();
                  setState(() {});
                },
                child: Row(
                  children: [
                    ClipRRect(
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      borderRadius: BorderRadius.circular(2),
                      child: Image.asset("assets/lang/${language.locale.languageCode}.jpg", width: 18, height: 14, fit: BoxFit.cover),
                    ),
                    MySpacing.width(8),
                    MyText.labelMedium(language.languageName),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildNotificationIcon() {
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
                MyText.bodyMedium("Notifications", fontWeight: 600),
                MyButton.text(
                  padding: MySpacing.xy(8, 12),
                  onPressed: () => hideFn?.call(),
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
                  splashColor: contentTheme.light.withAlpha(40),
                  child: Padding(
                    padding: MySpacing.all(16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyContainer.rounded(
                          height: 36,
                          width: 36,
                          paddingAll: 0,
                          color: notification['avatar'] == null ? notification['bgColor'] ?? contentTheme.primary : contentTheme.background,
                          child: notification['avatar'] != null
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(36),
                                  child: Image.asset(notification['avatar'], fit: BoxFit.cover, height: 36, width: 36),
                                )
                              : Center(child: Icon(notification['icon'], size: 16, color: Colors.white)),
                        ),
                        MySpacing.width(12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (notification['title'] != null) MyText.bodyMedium(notification['title'], fontWeight: 600),
                              if (notification['title'] != null) MySpacing.height(4),
                              MyText.bodySmall(notification['text'] ?? ""),
                              if (notification['time'] != null) MySpacing.height(6),
                              if (notification['time'] != null)
                                Row(
                                  children: [
                                    Icon(Icons.access_time_outlined, size: 12, color: contentTheme.secondary),
                                    MySpacing.width(4),
                                    MyText.bodySmall(notification['time'], fontSize: 10, color: contentTheme.secondary),
                                  ],
                                ),
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
                onPressed: () => hideFn?.call(),
                elevation: 0,
                padding: MySpacing.all(8),
                backgroundColor: Colors.transparent,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    MyText.labelMedium("View More", fontWeight: 600, color: contentTheme.primary),
                    MySpacing.width(8),
                    Icon(RemixIcons.arrow_right_line, size: 16, color: contentTheme.primary),
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
    return MyContainer(
      borderRadiusAll: 8,
      width: 160,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyButton(
            onPressed: () => {},
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            borderRadiusAll: AppStyle.buttonRadius.medium,
            padding: MySpacing.xy(8, 4),
            splashColor: colorScheme.onSurface.withAlpha(20),
            backgroundColor: Colors.transparent,
            child: Row(
              children: [
                Icon(RemixIcons.user_fill, size: 14, color: contentTheme.onBackground),
                MySpacing.width(8),
                MyText.labelMedium("Profile", fontWeight: 600),
              ],
            ),
          ),
          MySpacing.height(8),
          MyButton(
            onPressed: () => {},
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            borderRadiusAll: AppStyle.buttonRadius.medium,
            padding: MySpacing.xy(8, 4),
            splashColor: colorScheme.onSurface.withAlpha(20),
            backgroundColor: Colors.transparent,
            child: Row(
              children: [
                Icon(RemixIcons.wallet_line, size: 14, color: contentTheme.onBackground),
                MySpacing.width(8),
                MyText.labelMedium("My Wallet", fontWeight: 600),
              ],
            ),
          ),
          MySpacing.height(8),
          MyButton(
            onPressed: () => {},
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            borderRadiusAll: AppStyle.buttonRadius.medium,
            padding: MySpacing.xy(8, 4),
            splashColor: colorScheme.onSurface.withAlpha(20),
            backgroundColor: Colors.transparent,
            child: Row(
              children: [
                Icon(RemixIcons.settings_3_line, size: 14, color: contentTheme.onBackground),
                MySpacing.width(8),
                MyText.labelMedium("Settings", fontWeight: 600),
              ],
            ),
          ),
          MySpacing.height(8),
          MyButton(
            onPressed: () => {},
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            borderRadiusAll: AppStyle.buttonRadius.medium,
            padding: MySpacing.xy(8, 4),
            splashColor: colorScheme.onSurface.withAlpha(20),
            backgroundColor: Colors.transparent,
            child: Row(
              children: [
                Icon(RemixIcons.login_box_line, size: 14, color: contentTheme.onBackground),
                MySpacing.width(8),
                MyText.labelMedium("Khoá màn hình", fontWeight: 600),
              ],
            ),
          ),
          MySpacing.height(8),

          MyButton(
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            onPressed: () async {
              // ✅ Xoá dữ liệu đăng nhập
              await LocalStorage.setLoggedInUser(false);
              await LocalStorage.setUserToken("");
              await LocalStorage.setUserEmail("");

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
                MyText.labelMedium(
                  "Đăng xuất",
                  fontSize: 14,
                  fontWeight: 600,
                  color: contentTheme.danger,
                ),
              ],
            ),
          )
    ],
      ),
    );
  }
}

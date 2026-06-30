import 'package:kho555/helper/services/navigation_service.dart';
import 'package:kho555/helper/storage/local_storage.dart';
import 'package:kho555/helper/theme/app_style.dart';
import 'package:kho555/helper/localization/language.dart';
import 'package:kho555/helper/theme/app_notifier.dart';
import 'package:kho555/helper/theme/app_theme.dart';
import 'package:kho555/helper/theme/theme_customizer.dart';
import 'package:kho555/routes.dart';
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:oktoast/oktoast.dart';
import 'package:provider/provider.dart';
import 'package:url_strategy/url_strategy.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_quill/flutter_quill.dart' as quill; // 🧩 thêm dòng này

import 'helper/services/auth_services.dart';


Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('vi_VN');

  setPathUrlStrategy();

  await LocalStorage.init();
  AppStyle.init();
  await ThemeCustomizer.init();

  // Load trạng thái đăng nhập từ LocalStorage
  AuthService.isLoggedIn = await LocalStorage.getLoggedInUser() ?? false;

  // runApp(
  //   ChangeNotifierProvider<AppNotifier>(
  //     create: (context) => AppNotifier(),
  //     child: MyApp(),
  //   ),
  // );

  runApp(
    OKToast(                                  // 👈 BỌC APP BẰNG OKTOAST
      position: ToastPosition.bottom,         // vị trí mặc định
      textPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: ChangeNotifierProvider<AppNotifier>(
        create: (context) => AppNotifier(),
        child: const MyApp(),
      ),
    ),
  );

}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AppNotifier>(
      builder: (_, notifier, __) {
        return GetMaterialApp(
          debugShowCheckedModeBanner: false,

          // 🎨 Chủ đề sáng/tối
          theme: AppTheme.lightTheme,
          darkTheme: AppTheme.darkTheme,
          themeMode: ThemeCustomizer.instance.theme,

          // 🧭 Điều hướng toàn cục
          navigatorKey: NavigationService.navigatorKey,

          // 👇 Điều hướng theo trạng thái đăng nhập
          initialRoute: AuthService.isLoggedIn ? "/dashboard" : "/login",
          getPages: getPageRoute(),

          // 🗺️ Hỗ trợ ngôn ngữ
          locale: const Locale('vi', 'VN'), // 🇻🇳 Đặt ngôn ngữ mặc định là tiếng Việt
          supportedLocales: const [
            Locale('vi', 'VN'),
            Locale('en', 'US'),
          ],
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            quill.FlutterQuillLocalizations.delegate, // 👈 Quan trọng
          ],

          // 📌 Builder để duy trì Directionality và context toàn cục
          builder: (context, child) {
            NavigationService.registerContext(context);
            return Directionality(
              textDirection: TextDirection.ltr,
              child: child ?? Container(),
            );
          },
        );
      },
    );
  }
}


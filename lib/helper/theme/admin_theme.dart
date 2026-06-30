import 'package:flutter/material.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/theme/theme_customizer.dart';
import 'package:ttk_logistics/helper/theme/theme_type.dart';

enum LeftBarThemeType { light, dark }

enum ContentThemeType { light, dark }

enum RightBarThemeType { light, dark }

enum ContentThemeColor {
  primary,
  secondary,
  success,
  info,
  warning,
  danger,
  light,
  dark,
  pink,
  green,
  red,
  blue;

  Color get color {
    return (AdminTheme.theme.contentTheme.getMappedIntoThemeColor[this]?['color']) ?? Colors.black;
  }

  Color get onColor {
    return (AdminTheme.theme.contentTheme.getMappedIntoThemeColor[this]?['onColor']) ?? Colors.white;
  }
}

class LeftBarTheme {
  final Color background, onBackground;
  final Color labelColor;
  final Color activeItemColor, activeItemBackground;

  LeftBarTheme({
    this.background = const Color(0xffffffff),
    this.onBackground = const Color(0xff2a323c),
    this.labelColor = const Color(0xff6c757d),
    this.activeItemColor = const Color(0xff525ce5),
    this.activeItemBackground = const Color(0x14009678),
  });

  //--------------------------------------  Left Bar Theme ----------------------------------------//

  static final LeftBarTheme lightLeftBarTheme = LeftBarTheme();

  static final LeftBarTheme darkLeftBarTheme = LeftBarTheme(
    background: const Color(0xff2a323c),
    onBackground: const Color(0xffdcdcdc),
    labelColor: const Color(0xff879baf),
    activeItemBackground: const Color(0xff363c44),
    activeItemColor: const Color(0xffffffff),
  );

  static LeftBarTheme getThemeFromType(LeftBarThemeType leftBarThemeType) {
    switch (leftBarThemeType) {
      case LeftBarThemeType.light:
        return lightLeftBarTheme;
      case LeftBarThemeType.dark:
        return darkLeftBarTheme;
    }
  }
}

class TopBarTheme {
  final Color background;
  final Color onBackground;

  TopBarTheme({this.background = const Color(0xffffffff), this.onBackground = const Color(0xff313a46)});

  //--------------------------------------  Left Bar Theme ----------------------------------------//

  static final TopBarTheme lightTopBarTheme = TopBarTheme();

  static final TopBarTheme darkTopBarTheme = TopBarTheme(background: const Color(0xff2c3036), onBackground: const Color(0xffdcdcdc));
}

class RightBarTheme {
  final Color disabled, onDisabled;
  final Color activeSwitchBorderColor, inactiveSwitchBorderColor;

  RightBarTheme({
    this.disabled = const Color(0xffffffff),
    this.activeSwitchBorderColor = const Color(0xff009678),
    this.inactiveSwitchBorderColor = const Color(0xffdee2e6),
    this.onDisabled = const Color(0xff313a46),
  });

  //--------------------------------------  Left Bar Theme ----------------------------------------//

  static final RightBarTheme lightRightBarTheme = RightBarTheme(
    disabled: const Color(0xffffffff),
    onDisabled: const Color(0xffdee2e6),
    activeSwitchBorderColor: const Color(0xff009678),
    inactiveSwitchBorderColor: const Color(0xffdee2e6),
  );

  static final RightBarTheme darkRightBarTheme = RightBarTheme(
    disabled: const Color(0xff444d57),
    activeSwitchBorderColor: const Color(0xff009678),
    inactiveSwitchBorderColor: const Color(0xffdee2e6),
    onDisabled: const Color(0xff515a65),
  );
}

class ContentTheme {
  final Color background, onBackground;

  final Color primary, onPrimary;
  final Color secondary, onSecondary;
  final Color success, onSuccess;
  final Color danger, onDanger;
  final Color warning, onWarning;
  final Color info, onInfo;
  final Color light, onLight;
  final Color dark, onDark;

  // New Added----------------
  final Color purple, onPurple;
  final Color pink, onPink;
  final Color red, onRed;
  final Color blue, onBlue;

  //--------------------------

  final Color cardBackground, cardShadow, cardBorder, cardText, cardTextMuted;

  final Color title;

  final Color disabled, onDisabled;

  Map<ContentThemeColor, Map<String, Color>> get getMappedIntoThemeColor {
    var c = AdminTheme.theme.contentTheme;
    return {
      ContentThemeColor.primary: {'color': c.primary, 'onColor': c.onPrimary},
      ContentThemeColor.secondary: {'color': c.secondary, 'onColor': c.onSecondary},
      ContentThemeColor.success: {'color': c.success, 'onColor': c.onSuccess},
      ContentThemeColor.info: {'color': c.info, 'onColor': c.onInfo},
      ContentThemeColor.warning: {'color': c.warning, 'onColor': c.onWarning},
      ContentThemeColor.danger: {'color': c.danger, 'onColor': c.onDanger},
      ContentThemeColor.light: {'color': c.light, 'onColor': c.onLight},
      ContentThemeColor.dark: {'color': c.dark, 'onColor': c.onDark},
      ContentThemeColor.pink: {'color': c.pink, 'onColor': c.onPink},
      ContentThemeColor.red: {'color': c.red, 'onColor': c.onRed},
      ContentThemeColor.blue: {'color': c.blue, 'onColor': c.onBlue},
    };
  }

  //--------------------------------------  Left Bar Theme ----------------------------------------//

  ContentTheme({
    this.background = const Color(0xfff0f0f0),
    this.onBackground = const Color(0xffF1F1F2),
    this.primary = const Color(0xff525ce5),
    this.onPrimary = const Color(0xffffffff),
    this.disabled = const Color(0xffffffff),
    this.onDisabled = const Color(0xffffffff),
    this.secondary = const Color(0xff74788d),
    this.onSecondary = const Color(0xffffffff),
    this.success = const Color(0xff23c58f),
    this.onSuccess = const Color(0xffffffff),
    this.danger = const Color(0xfff14e4e),
    this.onDanger = const Color(0xffffffff),
    this.warning = const Color(0xffeeb148),
    this.onWarning = const Color(0xff313a46),
    this.info = const Color(0xff5ba4e5),
    this.onInfo = const Color(0xffffffff),
    this.light = const Color(0xfff9fafc),
    this.onLight = const Color(0xff313a46),
    this.dark = const Color(0xff343a40),
    this.onDark = const Color(0xffffffff),
    this.cardBackground = const Color(0xffffffff),
    this.cardShadow = const Color(0xffffffff),
    this.cardBorder = const Color(0xffffffff),
    this.cardText = const Color(0xff6c757d),
    this.cardTextMuted = const Color(0xff98a6ad),
    this.title = const Color(0xff6c757d),
    this.pink = const Color(0xffFF1087),
    this.onPink = const Color(0xffffffff),
    this.purple = const Color(0xff800080),
    this.onPurple = const Color(0xffFF0000),
    this.red = const Color(0xffFF0000),
    this.onRed = const Color(0xffffffff),
    this.blue = const Color(0xff1569C7),
    this.onBlue = const Color(0xffffffff),
  });

  static final ContentTheme lightContentTheme = ContentTheme(
    background: const Color(0xfffafbfe),
    onBackground: const Color(0xff313a46),
    cardBorder: const Color(0xffe8ecf1),
    cardBackground: const Color(0xffffffff),
    cardShadow: const Color(0xff9aa1ab),
    cardText: const Color(0xff6c757d),
    title: const Color(0xff6c757d),
    cardTextMuted: const Color(0xff98a6ad),
    light: const Color(0xfff9fafc),
  );

  static final ContentTheme darkContentTheme = ContentTheme(
    background: const Color(0xff343a40),
    onBackground: const Color(0xffF1F1F2),
    disabled: const Color(0xff444d57),
    onDisabled: const Color(0xff515a65),
    cardBorder: const Color(0xff464f5b),
    cardBackground: const Color(0xff37404a),
    cardShadow: const Color(0xff01030E),
    cardText: const Color(0xffaab8c5),
    title: const Color(0xffaab8c5),
    cardTextMuted: const Color(0xff8391a2),
    onLight: const Color(0xff313a46),
  );
}

class AdminTheme {
  final LeftBarTheme leftBarTheme;
  final RightBarTheme rightBarTheme;
  final TopBarTheme topBarTheme;
  final ContentTheme contentTheme;

  AdminTheme({required this.leftBarTheme, required this.topBarTheme, required this.rightBarTheme, required this.contentTheme});

  //--------------------------------------  Left Bar Theme ----------------------------------------//

  static AdminTheme theme = AdminTheme(
    leftBarTheme: LeftBarTheme.lightLeftBarTheme,
    topBarTheme: TopBarTheme.lightTopBarTheme,
    rightBarTheme: RightBarTheme.lightRightBarTheme,
    contentTheme: ContentTheme.lightContentTheme,
  );

  static void setTheme() {
    theme = AdminTheme(
      leftBarTheme: ThemeCustomizer.instance.theme == ThemeMode.dark ? LeftBarTheme.darkLeftBarTheme : LeftBarTheme.lightLeftBarTheme,
      topBarTheme: ThemeCustomizer.instance.theme == ThemeMode.dark ? TopBarTheme.darkTopBarTheme : TopBarTheme.lightTopBarTheme,
      rightBarTheme: ThemeCustomizer.instance.theme == ThemeMode.dark ? RightBarTheme.darkRightBarTheme : RightBarTheme.lightRightBarTheme,
      contentTheme: ThemeCustomizer.instance.theme == ThemeMode.dark ? ContentTheme.darkContentTheme : ContentTheme.lightContentTheme,
    );

    AppTheme.themeType = ThemeCustomizer.instance.theme == ThemeMode.light ? ThemeType.light : ThemeType.dark;
    AppTheme.theme = AppTheme.getTheme();
  }
}

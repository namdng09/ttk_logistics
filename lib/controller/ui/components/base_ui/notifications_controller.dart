import 'dart:async';
import 'dart:developer';

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:remixicon/remixicon.dart';
import 'package:ttk_logistics/helper/extensions/string.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/widgets/my_button.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/controller/my_controller.dart';

class NotificationsController extends MyController {
  bool isShowBasicNotification = false;

  void onShowBasicNotification() {
    isShowBasicNotification = !isShowBasicNotification;
    update();
  }

  final TickerProvider ticker;
  Timer? _timer;

  TextEditingController toastTitleController = TextEditingController(text: "Henox is awesome");
  ContentThemeColor selectedColor = ContentThemeColor.primary;
  SnackBarBehavior selectedBehavior = SnackBarBehavior.floating;
  late AnimationController animationController = AnimationController(vsync: ticker, duration: Duration(seconds: 20));

  bool showCloseIcon = true, showOkAction = true, showBanner = false, showLeadingIcon = true, sticky = false;

  NotificationsController(this.ticker);

  void setBannerType(bool value) {
    showBanner = value;
    update();
  }

  void onChangeColor(ContentThemeColor? value) {
    if (value != null) {
      selectedColor = value;
      update();
    }
  }

  void onChangeBehavior(SnackBarBehavior? value) {
    if (value != null) {
      selectedBehavior = value;
      update();
    }
  }

  void onChangeShowCloseIcon(bool? value) {
    if (value != null) {
      showCloseIcon = value;
      update();
    }
  }

  void onAction(bool? value) {
    if (value != null) {
      showBanner ? showLeadingIcon = value : showOkAction = value;
      update();
    }
  }

  void onChangeSticky(bool? value) {
    if (value != null) {
      sticky = value;
      update();
    }
  }

  //Show snackBar
  void show() {
    showBanner ? showMaterialBanner() : showSnackBar();
  }

  void showMaterialBanner() {
    String text = toastTitleController.text.nullIfEmpty ?? "Please set title";
    Color backgroundColor = selectedColor.color;
    Color color = selectedColor.onColor;

    List<Widget> actions = [];
    if (showCloseIcon) {
      actions.add(
        MyButton.text(
          onPressed: () => ScaffoldMessenger.of(Get.context!).hideCurrentMaterialBanner(),
          padding: MySpacing.x(8),
          splashColor: color.withValues(alpha: 0.1),
          child: MyText.labelMedium('Dismiss', color: color),
        ),
      );
    } else {
      actions.add(MySpacing.empty());
    }

    Widget? leadingIcon;
    if (showLeadingIcon) {
      leadingIcon = Icon(RemixIcons.info_i, color: color, size: 20);
    }

    MaterialBanner banner = MaterialBanner(
      content: MyText.labelMedium(text, color: color),
      padding: MySpacing.x(24),
      leading: leadingIcon,
      actions: actions,
      overflowAlignment: OverflowBarAlignment.center,
      forceActionsBelow: false,
      backgroundColor: backgroundColor,
    );

    ScaffoldMessenger.of(Get.context!).hideCurrentMaterialBanner();
    ScaffoldMessenger.of(Get.context!).showMaterialBanner(banner);

    _timer?.cancel();
    if (!sticky) {
      _timer = Timer(Duration(seconds: 3), () {
        ScaffoldMessenger.of(Get.context!).hideCurrentMaterialBanner();
      });
    }
  }

  void showSnackBar() {
    String text = toastTitleController.text.nullIfEmpty ?? "Please set title";
    Color backgroundColor = selectedColor.color;
    Color color = selectedColor.onColor;
    double? width = selectedBehavior == SnackBarBehavior.fixed ? null : 300;
    Duration duration = Duration(seconds: sticky ? 10000 : 3);

    SnackBarAction? action;
    if (showOkAction) {
      action = SnackBarAction(label: "Ok", onPressed: () => ScaffoldMessenger.of(Get.context!).hideCurrentSnackBar(), textColor: color);
    }

    SnackBar snackBar = SnackBar(
      width: width,
      behavior: selectedBehavior,
      duration: duration,
      showCloseIcon: showCloseIcon,
      closeIconColor: color,
      action: action,
      animation: Tween<double>(begin: 0, end: 300).animate(animationController),
      content: MyText.labelLarge(text, color: color),
      backgroundColor: backgroundColor,
    );
    ScaffoldMessenger.of(Get.context!).hideCurrentSnackBar();
    ScaffoldMessenger.of(Get.context!).showSnackBar(snackBar);
  }

  @override
  void dispose() {
    super.dispose();
    _timer?.cancel();
    try {
      ScaffoldMessenger.of(Get.context!).hideCurrentSnackBar();
      ScaffoldMessenger.of(Get.context!).hideCurrentMaterialBanner();
    } catch (e) {
      log(e.toString());
    }
  }
}

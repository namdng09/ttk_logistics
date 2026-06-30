import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/layout/auth_layout_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_responsive.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';

class AuthLayout extends StatelessWidget with UIMixin{
  final Widget? child;

  final AuthLayoutController controller = AuthLayoutController();

  AuthLayout({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    return MyResponsive(
      builder: (BuildContext context, _, screenMT) {
        return GetBuilder(
          init: controller,
          builder: (controller) {
            return screenMT.isMobile ? mobileScreen(context) : largeScreen(context);
          },
        );
      },
    );
  }

  Widget mobileScreen(BuildContext context) {
    return Scaffold(
      key: controller.scaffoldKey,
      body: Center(
        child: SingleChildScrollView(padding: MySpacing.x(24), key: controller.scrollKey, child: child),
      ),
    );
  }

  Widget largeScreen(BuildContext context) {
    return Scaffold(
      key: controller.scaffoldKey,
      backgroundColor: contentTheme.primary.withValues(alpha: .7),
      body: Center(
        child: MyFlex(
          wrapAlignment: WrapAlignment.center,
          wrapCrossAlignment: WrapCrossAlignment.center,
          runAlignment: WrapAlignment.center,
          spacing: 0,
          runSpacing: 0,
          children: [MyFlexItem(sizes: "xxl-2.9 lg-4 md-6 sm-8", child: child ?? Container())],
        ),
      ),
    );
  }
}

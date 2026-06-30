import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/pages/error_500_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/images.dart';
import 'package:kho555/views/layout/auth_layout.dart';

class Error500Screen extends StatefulWidget {
  const Error500Screen({super.key});

  @override
  State<Error500Screen> createState() => _Error500ScreenState();
}

class _Error500ScreenState extends State<Error500Screen> with UIMixin {
  late Error500Controller controller;

  @override
  void initState() {
    controller = Get.put(Error500Controller());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return AuthLayout(
          child: MyContainer(
            height: 480,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                Image.asset(Images.logoDark, height: 24),

                MyText.displayLarge('500!', fontSize: 120, fontWeight: 600, color: contentTheme.primary),
                MyText.titleLarge("Sorry, page not found", fontWeight: 600),
                Padding(
                  padding: MySpacing.x(MediaQuery.of(context).size.width * 0.02),
                  child: MyText.bodyMedium(
                    "It will be as simple as Occidental in fact, it will Occidental to an English person",
                    height: 1.5,
                    textAlign: TextAlign.center,
                    fontWeight: 600,
                    muted: true,
                  ),
                ),
                MyContainer(
                  color: contentTheme.primary,
                  paddingAll: 12,
                  onTap: controller.goToHome,
                  child: MyText.bodyMedium("Back to Dashboard", fontWeight: 600, color: contentTheme.onSuccess),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

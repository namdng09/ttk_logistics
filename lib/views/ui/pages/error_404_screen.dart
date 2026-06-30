import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/error_404_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/images.dart';
import 'package:ttk_logistics/views/layout/auth_layout.dart';

class Error404Screen extends StatefulWidget {
  const Error404Screen({super.key});

  @override
  State<Error404Screen> createState() => _Error404ScreenState();
}

class _Error404ScreenState extends State<Error404Screen> with UIMixin{
  late Error404Controller controller;

  @override
  void initState() {
    controller = Get.put(Error404Controller());
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

              MyText.displayLarge('404!',fontSize: 120,fontWeight: 600,color: contentTheme.primary),
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
    },);
  }
}

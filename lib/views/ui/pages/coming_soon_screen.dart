import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/coming_soon_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/images.dart';

class ComingSoonScreen extends StatefulWidget {
  const ComingSoonScreen({super.key});

  @override
  State<ComingSoonScreen> createState() => _ComingSoonScreenState();
}

class _ComingSoonScreenState extends State<ComingSoonScreen> with UIMixin {
  late ComingSoonController controller;

  @override
  void initState() {
    controller = Get.put(ComingSoonController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        String strDigits(int n) => n.toString().padLeft(2, '0');
        final days = strDigits(controller.myDuration.inDays);
        final hours = strDigits(controller.myDuration.inHours.remainder(24));
        final minutes = strDigits(controller.myDuration.inMinutes.remainder(60));
        final seconds = strDigits(controller.myDuration.inSeconds.remainder(60));
        return Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(Images.logoDark, height: 28),MySpacing.height(22),
                MyText.bodyMedium("Responsive Bootstrap 5 Admin Dashboard", fontWeight: 600,fontSize: 16,),
                MySpacing.height(32),
                MyText.titleLarge("Let's get started with Morvin", fontWeight: 600),
                MySpacing.height(16),
                MyText.bodyMedium('It will be as simple as Occidental in fact it will be Occidental.'),
                MySpacing.height(12),
                Image.asset(Images.comingSoonBg),
                MySpacing.height(12),
                Wrap(
                  runSpacing: 16,
                  spacing: 16,
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    timerContainer(days, 'days'),
                    timerContainer(hours, 'Hours'),
                    timerContainer(minutes, 'Minutes'),
                    timerContainer(seconds, 'Seconds'),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget timerContainer(String timing, String days) {
    return MyCard(
      color: contentTheme.light,
      height: 100,
      width: 100,
      paddingAll: 0,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            MyText.titleLarge(timing, fontSize: 32, key: ValueKey(timing), color: contentTheme.dark),
            MyText.bodyMedium(days, color: contentTheme.dark),
          ],
        ),
      ),
    );
  }
}

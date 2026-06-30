import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/components/base_ui/progress_controller.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_progress_bar.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class ProgressScreen extends StatefulWidget {
  const ProgressScreen({super.key});

  @override
  State<ProgressScreen> createState() => _ProgressScreenState();
}

class _ProgressScreenState extends State<ProgressScreen> with UIMixin {
  ProgressController controller = Get.put(ProgressController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'progress_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Progress',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-6', child: example()),
              MyFlexItem(sizes: 'lg-6', child: heightProgress()),
              MyFlexItem(sizes: 'lg-6', child: background()),
            ],
          ),
        );
      },
    );
  }

  Widget example() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("Example", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyProgressBar(progress: 0, height: 20, width: 750, inactiveColor: theme.colorScheme.secondary.withAlpha(36)),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .2,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.primary,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .5,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.primary,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .7,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.primary,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: 1,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.primary,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget heightProgress() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("Height", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyProgressBar(
                  progress: .2,
                  height: 4,
                  width: 750,
                  activeColor: contentTheme.primary,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .2,
                  height: 8,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.secondary,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .5,
                  height: 12,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.info,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .7,
                  height: 16,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.pink,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: 1,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.purple,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget background() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("Background", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyProgressBar(
                  progress: .2,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.success,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .4,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.info,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .7,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.warning,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: 1,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.danger,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .8,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.pink,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .7,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.purple,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .4,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.dark,
                ),
                MySpacing.height(20),
                MyProgressBar(
                  progress: .2,
                  height: 20,
                  width: 750,
                  inactiveColor: theme.colorScheme.secondary.withAlpha(36),
                  activeColor: contentTheme.dark.withAlpha(70),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

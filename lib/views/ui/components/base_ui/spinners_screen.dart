import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/ui/components/base_ui/spinner_controller.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/views/layout/layout.dart';


class SpinnersScreen extends StatefulWidget {
  const SpinnersScreen({super.key});

  @override
  State<SpinnersScreen> createState() => _SpinnersScreenState();
}

class _SpinnersScreenState extends State<SpinnersScreen> with UIMixin {
  SpinnerController controller = Get.put(SpinnerController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'spinners_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Spinners',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-6 md-6', child: borderSpinner()),
              MyFlexItem(sizes: 'lg-6 md-6', child: colors()),
              MyFlexItem(sizes: 'lg-6 md-6', child: alignmentSpinner()),
              MyFlexItem(sizes: 'lg-6 md-6', child: placementSpinner()),
              MyFlexItem(sizes: 'lg-6 md-6', child: sizeSpinner()),
              MyFlexItem(sizes: 'lg-6 md-6', child: buttonsSpinner()),
            ],
          ),
        );
      },
    );
  }

  Widget borderSpinner() {
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
            child: MyText.titleMedium("Border Spinner", fontWeight: 700, muted: true),
          ),
          Padding(padding: MySpacing.all(24), child: CircularProgressIndicator()),
        ],
      ),
    );
  }

  Widget colors() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Color", fontWeight: 700, muted: true)),

          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                CircularProgressIndicator(),
                CircularProgressIndicator(color: contentTheme.secondary),
                CircularProgressIndicator(color: contentTheme.success),
                CircularProgressIndicator(color: contentTheme.danger),
                CircularProgressIndicator(color: contentTheme.pink),
                CircularProgressIndicator(color: contentTheme.light),
                CircularProgressIndicator(color: contentTheme.dark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget alignmentSpinner() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Alignment", fontWeight: 700, muted: true)),
          Padding(
            padding: MySpacing.all(24),

            child: Center(child: CircularProgressIndicator()),
          ),
        ],
      ),
    );
  }

  Widget placementSpinner() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Placement", fontWeight: 700, muted: true)),
          Padding(
            padding: MySpacing.all(24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [MyText.titleMedium("Loading...", fontWeight: 600), CircularProgressIndicator()],
            ),
          ),
        ],
      ),
    );
  }

  Widget sizeSpinner() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Size", fontWeight: 700, muted: true)),
          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                SizedBox(height: 100, width: 100, child: CircularProgressIndicator()),
                SizedBox(height: 50, width: 50, child: CircularProgressIndicator()),
                CircularProgressIndicator(),
                SizedBox(height: 25, width: 25, child: CircularProgressIndicator()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget buttonsSpinner() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Buttons Spinner", fontWeight: 600)),
          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                MyContainer(
                  paddingAll: 12,
                  color: contentTheme.primary,
                  child: SizedBox(height: 28, width: 28, child: CircularProgressIndicator(color: contentTheme.onPrimary)),
                ),
                MyContainer(
                  paddingAll: 12,
                  color: contentTheme.primary,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(height: 28, width: 28, child: CircularProgressIndicator(color: contentTheme.onPrimary)),
                      SizedBox(width: 12),
                      MyText.bodyMedium("Loading...", fontWeight: 600, color: contentTheme.onPrimary),
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
}

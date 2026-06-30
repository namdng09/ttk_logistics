import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:remixicon/remixicon.dart';

import 'package:kho555/controller/ui/components/base_ui/pagination_controller.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_button.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/views/layout/layout.dart';


class PaginationScreen extends StatefulWidget {
  const PaginationScreen({super.key});

  @override
  State<PaginationScreen> createState() => _PaginationScreenState();
}

class _PaginationScreenState extends State<PaginationScreen> with UIMixin {
  PaginationController controller = Get.put(PaginationController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'pagination_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Pagination',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(child: defaultPagination()),
              MyFlexItem(child: roundPagination()),
              MyFlexItem(child: disabledAndActiveStates()),
              MyFlexItem(child: sizing()),
            ],
          ),
        );
      },
    );
  }

  Widget defaultPagination() {
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
            child: MyText.titleMedium("Default Pagination", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: MyContainer.bordered(
              paddingAll: 8,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  IconButton(icon: Icon(RemixIcons.arrow_left_s_line, size: 18), onPressed: () {}),
                  for (int i = 1; i <= 5; i++)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4.0),
                      child: MyButton(
                        backgroundColor: i == 2 ? contentTheme.primary : contentTheme.disabled,
                        elevation: 0,
                        borderRadiusAll: 4,
                        onPressed: () {},
                        child: MyText.bodyMedium('$i', muted: true, color: i == 2 ? contentTheme.onPrimary : null),
                      ),
                    ),
                  IconButton(icon: Icon(RemixIcons.arrow_right_s_line, size: 18), onPressed: () {}),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget roundPagination() {
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
            child: MyText.titleMedium("Round Pagination", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                IconButton(
                  icon: Icon(RemixIcons.arrow_left_s_line, size: 18),
                  onPressed: () =>
                      controller.roundedPagination > 1 ? controller.goToRoundPagination(controller.roundedPagination - 1) : null,
                ),
                for (int i = 1; i <= 5; i++)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: MyContainer(
                      height: 32,
                      width: 32,
                      paddingAll: 0,
                      color: i == controller.roundedPagination ? contentTheme.primary : null,
                      borderRadiusAll: 100,
                      onTap: () => controller.goToRoundPagination(i),
                      child: Center(
                        child: MyText.bodySmall(
                          '$i',
                          muted: true,
                          color: i == controller.roundedPagination ? contentTheme.onPrimary : null,
                        ),
                      ),
                    ),
                  ),
                IconButton(
                  icon: Icon(RemixIcons.arrow_right_s_line, size: 18),
                  onPressed: () {
                    controller.roundedPagination < 5 ? controller.goToRoundPagination(controller.roundedPagination + 1) : null;
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget disabledAndActiveStates() {
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
            child: MyText.titleMedium("Disabled and active states", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: Row(
              children: <Widget>[
                MyButton(
                  onPressed: null,
                  backgroundColor: contentTheme.secondary,
                  borderRadiusAll: 8,
                  child: MyText.bodySmall('Previous', fontWeight: 600),
                ),
                MySpacing.width(12),
                for (int i = 1; i <= 3; i++)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                    child: MyButton(
                      backgroundColor: i == 2 ? contentTheme.primary : contentTheme.secondary.withAlpha(36),
                      elevation: 0,
                      borderRadiusAll: 4,
                      onPressed: () {},
                      child: MyText.bodyMedium('$i', muted: true, color: i == 2 ? contentTheme.onPrimary : null),
                    ),
                  ),
                MySpacing.width(12),
                MyButton(
                  onPressed: () {},
                  borderRadiusAll: 8,
                  elevation: 0,
                  backgroundColor: contentTheme.primary,
                  child: MyText.bodyMedium('Next', fontWeight: 600, color: contentTheme.onPrimary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget sizing() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Sizing", fontWeight: 700, muted: true)),

          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyContainer.bordered(
                  paddingAll: 12,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      IconButton(icon: Icon(RemixIcons.arrow_left_s_line, size: 18), onPressed: () {}),
                      for (int i = 1; i <= 5; i++)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4.0),
                          child: MyButton(
                            backgroundColor: i == 2 ? contentTheme.primary : contentTheme.secondary.withAlpha(36),
                            elevation: 0,
                            padding: MySpacing.all(20),
                            borderRadiusAll: 4,
                            onPressed: () {},
                            child: MyText.bodyMedium('$i', fontWeight: 600, color: i == 2 ? contentTheme.onPrimary : null),
                          ),
                        ),
                      IconButton(icon: Icon(RemixIcons.arrow_right_s_line, size: 18), onPressed: () {}),
                    ],
                  ),
                ),
                MySpacing.height(20),
                MyContainer.bordered(
                  paddingAll: 12,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: <Widget>[
                      IconButton(icon: Icon(RemixIcons.arrow_left_s_line, size: 18), onPressed: () {}),
                      for (int i = 1; i <= 5; i++)
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 4.0),
                          child: MyButton(
                            backgroundColor: i == 2 ? contentTheme.primary : contentTheme.secondary.withAlpha(36),
                            elevation: 0,
                            padding: MySpacing.all(4),
                            borderRadiusAll: 4,
                            onPressed: () {},
                            child: MyText.bodySmall('$i', fontWeight: 600, color: i == 2 ? contentTheme.onPrimary : null),
                          ),
                        ),
                      IconButton(icon: Icon(RemixIcons.arrow_right_s_line, size: 18), onPressed: () {}),
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

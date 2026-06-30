import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:shimmer/shimmer.dart';
import 'package:ttk_logistics/controller/ui/components/base_ui/placeholders_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/images.dart';
import 'package:ttk_logistics/views/layout/layout.dart';


class PlaceholdersScreen extends StatefulWidget {
  const PlaceholdersScreen({super.key});

  @override
  State<PlaceholdersScreen> createState() => _PlaceholdersScreenState();
}

class _PlaceholdersScreenState extends State<PlaceholdersScreen> with UIMixin {
  PlaceholdersController controller = Get.put(PlaceholdersController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'placeholders_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Placeholder',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-6', child: placeholders()),
              MyFlexItem(sizes: 'lg-6 md-6', child: color()),
              MyFlexItem(sizes: 'lg-6 md-6', child: sizes()),
            ],
          ),
        );
      },
    );
  }

  Widget placeholders() {
    return MyCard(
     shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Placeholders", fontWeight: 700, muted: true)),

          Padding(
            padding: MySpacing.all(24),
            child: MyFlex(
              contentPadding: false,
              children: [
                MyFlexItem(
                  sizes: 'lg-6 md-6',
                  child: MyCard(
                    paddingAll: 0,
                    borderRadiusAll: 4,
                    clipBehavior: Clip.antiAliasWithSaveLayer,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyContainer(
                          height: 250,
                          paddingAll: 0,
                          width: double.infinity,
                          child: Image.asset(Images.small[1], fit: BoxFit.cover),
                        ),
                        Padding(
                          padding: MySpacing.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              MyText.titleMedium("Card Title", fontWeight: 600),
                              MySpacing.height(20),
                              MyText.bodyMedium(controller.dummyTexts[0], xMuted: true, maxLines: 3),
                              MySpacing.height(20),
                              MyContainer(
                                onTap: () {},
                                color: contentTheme.primary,
                                paddingAll: 12,
                                child: MyText.bodyMedium("Button", color: contentTheme.onPrimary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                MyFlexItem(
                  sizes: 'lg-6 md-6',
                  child: Shimmer.fromColors(
                    baseColor: contentTheme.secondary.withAlpha(36),
                    highlightColor: contentTheme.dark.withAlpha(60),
                    child: Container(
                      padding: MySpacing.all(16),
                      width: MediaQuery.of(context).size.width,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(height: 200, width: double.infinity, color: Colors.grey),
                          Padding(
                            padding: MySpacing.only(top: 20),
                            child: Container(height: 12, width: 100, color: Colors.grey),
                          ),
                          Padding(
                            padding: MySpacing.only(top: 20),
                            child: Container(height: 52, color: Colors.grey),
                          ),
                          Padding(
                            padding: MySpacing.only(top: 20),
                            child: Container(height: 32, width: 80, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget color() {
    Widget colorWidget(Color color, {double? width}) {
      return Shimmer.fromColors(
        baseColor: color.withAlpha(36),
        highlightColor: contentTheme.secondary.withAlpha(60),
        child: Container(margin: MySpacing.top(12), height: 12, width: width ?? double.infinity, color: Colors.grey),
      );
    }

    return Column(
      children: [
        MyCard(
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
                child: Column(
                  children: [
                    colorWidget(contentTheme.secondary),
                    colorWidget(contentTheme.primary),
                    colorWidget(contentTheme.info),
                    colorWidget(contentTheme.danger),
                    colorWidget(contentTheme.warning),
                    colorWidget(contentTheme.pink),
                    colorWidget(contentTheme.purple),
                    colorWidget(contentTheme.light),
                    colorWidget(contentTheme.dark),
                  ],
                ),
              ),
            ],
          ),
        ),
        MySpacing.height(20),
        MyCard(
         shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
          paddingAll: 0,
          width: double.infinity,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Width", fontWeight: 700, muted: true)),
              Padding(
                padding: MySpacing.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    colorWidget(contentTheme.secondary, width: Get.size.width * .2),
                    MySpacing.height(20),
                    colorWidget(contentTheme.secondary, width: Get.size.width * .35),
                    MySpacing.height(20),
                    colorWidget(contentTheme.secondary, width: Get.size.width * .15),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget sizes() {
    Widget sizeWidget(Color color, {double? height}) {
      return Shimmer.fromColors(
        baseColor: contentTheme.secondary.withAlpha(36),
        highlightColor: color.withAlpha(60),
        child: Container(margin: MySpacing.top(12), height: height ?? 12, color: Colors.grey),
      );
    }

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
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                sizeWidget(contentTheme.secondary, height: 44),
                sizeWidget(contentTheme.secondary, height: 32),
                sizeWidget(contentTheme.secondary, height: 12),
                sizeWidget(contentTheme.secondary, height: 4),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

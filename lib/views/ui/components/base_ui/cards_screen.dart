import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:remixicon/remixicon.dart';
import 'package:kho555/helper/widgets/responsive.dart';

import 'package:kho555/controller/ui/components/base_ui/cards_controller.dart';
import 'package:kho555/helper/theme/app_theme.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_button.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_utils.dart';
import 'package:kho555/images.dart';
import 'package:kho555/views/layout/layout.dart';

class CardsScreen extends StatefulWidget {
  const CardsScreen({super.key});

  @override
  State<CardsScreen> createState() => _CardsScreenState();
}

class _CardsScreenState extends State<CardsScreen> with UIMixin {
  CardsController controller = Get.put(CardsController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'card_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Cards',
          mainScreenName: 'Base UI',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-3 md-6 sm-6',
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
                                MyText.titleMedium("Card Title", fontWeight: 700,muted: true,),
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
                    sizes: 'lg-3 md-6 sm-6',
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
                            child: Image.asset(Images.small[2], fit: BoxFit.cover),
                          ),
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.titleMedium("Card Title", fontWeight: 700, muted: true),
                                MySpacing.height(20),
                                MyText.bodyMedium("Some quick example text to build on the card..", maxLines: 1, xMuted: true),
                                MySpacing.height(20),
                                MyText.bodyMedium("Cras justo odi", xMuted: true),
                                MySpacing.height(16),
                                Wrap(
                                  runSpacing: 20,
                                  spacing: 20,
                                  children: [
                                    MyButton.text(
                                      onPressed: () {},
                                      padding: MySpacing.all(8),
                                      child: MyText.bodyMedium("Card Link", color: contentTheme.primary),
                                    ),
                                    MyButton.text(
                                      onPressed: () {},
                                      padding: MySpacing.all(8),
                                      child: MyText.bodyMedium("Another Link", color: contentTheme.primary),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-3 md-6 sm-6',
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
                            child: Image.asset(Images.small[3], fit: BoxFit.cover),
                          ),
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.bodyMedium(controller.dummyTexts[0], maxLines: 3, xMuted: true),
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
                    sizes: 'lg-3 md-6 sm-6',
                    child: MyCard(
                      paddingAll: 0,
                      borderRadiusAll: 4,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.titleMedium("Card Title", fontWeight: 700, muted: true),
                                MySpacing.height(8),
                                MyText.bodyMedium("Support card subtitle", maxLines: 1, xMuted: true),
                              ],
                            ),
                          ),
                          MyContainer(
                            height: 200,
                            paddingAll: 0,
                            width: double.infinity,
                            child: Image.asset(Images.small[4], fit: BoxFit.cover),
                          ),
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.bodyMedium(controller.dummyTexts[0], maxLines: 3, xMuted: true),
                                MySpacing.height(20),
                                Wrap(
                                  spacing: 20,
                                  runSpacing: 20,
                                  children: [
                                    MyButton.text(
                                      onPressed: () {},
                                      padding: MySpacing.all(8),
                                      child: MyText.bodyMedium("Card Link", color: contentTheme.primary),
                                    ),
                                    MyButton.text(
                                      onPressed: () {},
                                      padding: MySpacing.all(8),
                                      child: MyText.bodyMedium("Another Link", color: contentTheme.primary),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-6 md-6 sm-6',
                    child: MyCard(
                      paddingAll: 20,
                      borderRadiusAll: 4,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyText.titleMedium("Special title treatment", fontWeight: 700, muted: true),
                          MySpacing.height(8),
                          MyText.bodyMedium("With supporting text below as a natural lead-in to additional content.", xMuted: true),
                          MySpacing.height(20),
                          MyButton.block(
                            onPressed: () {},
                            elevation: 0,
                            backgroundColor: contentTheme.primary,
                            child: MyText.labelMedium("Go Somewhere", color: contentTheme.onPrimary),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-6 md-6 sm-6',
                    child: MyCard(
                      paddingAll: 20,
                      borderRadiusAll: 4,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyText.titleMedium("Special title treatment", fontWeight: 700, muted: true),
                          MySpacing.height(8),
                          MyText.bodyMedium("With supporting text below as a natural lead-in to additional content.", xMuted: true),
                          MySpacing.height(20),
                          MyButton.block(
                            onPressed: () {},
                            elevation: 0,
                            backgroundColor: contentTheme.primary,
                            child: MyText.labelMedium("Go Somewhere", color: contentTheme.onPrimary),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: MyCard(
                      paddingAll: 20,
                      borderRadiusAll: 4,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyText.titleMedium("Featured", fontWeight: 600, muted: true),
                          MySpacing.height(20),
                          MyText.bodyMedium("Special title treatment", fontWeight: 600, muted: true),
                          MySpacing.height(20),
                          MyText.bodySmall("With supporting text below as a natural lead-in to additional content.", muted: true),
                          MySpacing.height(20),
                          MyContainer(
                            onTap: () {},
                            color: contentTheme.primary,
                            paddingAll: 12,
                            child: MyText.labelMedium("Go somewhere", color: contentTheme.onPrimary),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: MyCard(
                      paddingAll: 20,
                      borderRadiusAll: 4,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      child: SizedBox(
                        height: 150,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            MyText.titleMedium("Quote"),
                            MySpacing.height(20),
                            MyText.bodyMedium(controller.dummyTexts[0], maxLines: 2, muted: true),
                            MySpacing.height(20),
                            MyText.bodySmall("Someone famous in Source Title"),
                          ],
                        ),
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4',
                    child: MyCard(
                      paddingAll: 0,
                      borderRadiusAll: 4,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(padding: MySpacing.all(20), child: MyText.titleMedium("Featured")),
                          Padding(
                            padding: MySpacing.nTop(20),
                            child: MyContainer(
                              paddingAll: 12,
                              onTap: () {},
                              color: contentTheme.primary,
                              child: MyText.bodyMedium("Go Somewhere", fontWeight: 600, color: contentTheme.onPrimary),
                            ),
                          ),
                          Divider(height: 0),
                          Padding(padding: MySpacing.all(20), child: MyText.bodySmall("2 days ago", fontWeight: 600, xMuted: true)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              MySpacing.height(flexSpacing),
              Padding(padding: MySpacing.x(flexSpacing / 2), child: MyText.titleMedium("Card Colored", fontWeight: 700, muted: true)),
              MySpacing.height(flexSpacing),
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: MyContainer(
                      color: contentTheme.secondary,
                      paddingAll: 20,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyText.titleMedium("Special title treatment", fontWeight: 600, color: contentTheme.onSecondary),
                          MySpacing.height(20),
                          MyText.bodyMedium(
                            "With supporting text below as a natural lead-in to additional content.",
                            muted: true,
                            color: contentTheme.onSecondary,
                          ),
                          MySpacing.height(20),
                          MyContainer(
                            onTap: () {},
                            paddingAll: 12,
                            color: contentTheme.primary,
                            child: MyText.bodyMedium("Button", fontWeight: 600, color: contentTheme.onPrimary),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardColor(controller.dummyTexts[0], "Someone famous in Source Title", contentTheme.primary),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardColor(controller.dummyTexts[1], "Someone famous in Source Title", contentTheme.success),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardColor(controller.dummyTexts[2], "Someone famous in Source Title", contentTheme.info),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardColor(controller.dummyTexts[3], "Someone famous in Source Title", contentTheme.warning),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardColor(controller.dummyTexts[4], "Someone famous in Source Title", contentTheme.danger),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardColor(controller.dummyTexts[5], "Someone famous in Source Title", Colors.pinkAccent),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardColor(controller.dummyTexts[6], "Someone famous in Source Title", Colors.deepPurple),
                  ),
                ],
              ),
              MySpacing.height(flexSpacing),
              Padding(padding: MySpacing.x(flexSpacing / 2), child: MyText.titleMedium("Card Border", fontWeight: 700,muted: true)),
              MySpacing.height(flexSpacing),
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardBorder(
                      "Special title treatment",
                      "With supporting text below as a natural lead-in to additional content.",
                      contentTheme.secondary,
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardBorder(
                      "Special title treatment",
                      "With supporting text below as a natural lead-in to additional content.",
                      contentTheme.primary,
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4 md-4 sm-6',
                    child: cardBorder(
                      "Special title treatment",
                      "With supporting text below as a natural lead-in to additional content.",
                      contentTheme.success,
                    ),
                  ),
                ],
              ),
              MySpacing.height(flexSpacing),
              Padding(padding: MySpacing.x(flexSpacing / 2), child: MyText.titleMedium("Horizontal Card", fontWeight: 700,muted: true)),
              MySpacing.height(flexSpacing),
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-6',
                    child: MyContainer(
                      paddingAll: 0,
                      child: Row(
                        children: [
                          MyContainer(
                            height: 200,
                            width: 250,
                            paddingAll: 0,
                            child: Image.asset(Images.small[3], fit: BoxFit.cover),
                          ),
                          MySpacing.width(20),
                          Expanded(
                            child: SizedBox(
                              height: 150,
                              child: Padding(
                                padding: MySpacing.all(20),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    MyText.bodyMedium("Card Title", fontWeight: 600, muted: true),
                                    MyText.bodyMedium(controller.dummyTexts[0], maxLines: 2, muted: true),
                                    MyText.bodySmall("Last updated 3 min ago", xMuted: true),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-6',
                    child: MyContainer(
                      paddingAll: 0,
                      child: Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 150,
                              child: Padding(
                                padding: MySpacing.all(20),
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    MyText.bodyMedium("Card Title", muted: true, fontWeight: 600),
                                    MyText.bodyMedium(controller.dummyTexts[0], maxLines: 2, muted: true),
                                    MyText.bodySmall("Last updated 3 min ago", fontWeight: 600, xMuted: true),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          MySpacing.width(20),
                          MyContainer(
                            height: 200,
                            width: 250,
                            paddingAll: 0,
                            child: Image.asset(Images.small[1], fit: BoxFit.cover),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              MySpacing.height(flexSpacing),
              Padding(padding: MySpacing.x(flexSpacing / 2), child: MyText.titleMedium("Stretched link", fontWeight: 700,muted: true)),
              MySpacing.height(flexSpacing),
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-3 md-3',
                    child: MyContainer(
                      paddingAll: 0,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyContainer(
                            height: 200,
                            borderRadiusAll: 0,
                            width: double.infinity,
                            clipBehavior: Clip.antiAliasWithSaveLayer,
                            paddingAll: 0,
                            child: Image.asset(Images.small[1], fit: BoxFit.cover),
                          ),
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.bodyMedium("Card with stretched link", fontWeight: 600),
                                MySpacing.height(20),
                                MyContainer(
                                  color: contentTheme.primary,
                                  paddingAll: 12,
                                  child: MyText.bodyMedium("Go somewhere", fontWeight: 600, color: contentTheme.onPrimary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-3 md-3',
                    child: MyContainer(
                      onTap: () {},
                      paddingAll: 0,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyContainer(
                            height: 200,
                            borderRadiusAll: 0,
                            width: double.infinity,
                            clipBehavior: Clip.antiAliasWithSaveLayer,
                            paddingAll: 0,
                            child: Image.asset(Images.small[2], fit: BoxFit.cover),
                          ),
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.bodyMedium("Card with stretched link", fontWeight: 600, color: contentTheme.success),
                                MySpacing.height(20),
                                MyText.bodyMedium(controller.dummyTexts[0], muted: true, maxLines: 2),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-3 md-3',
                    child: MyContainer(
                      onTap: () {},
                      paddingAll: 0,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyContainer(
                            height: 200,
                            borderRadiusAll: 0,
                            width: double.infinity,
                            clipBehavior: Clip.antiAliasWithSaveLayer,
                            paddingAll: 0,
                            child: Image.asset(Images.small[3], fit: BoxFit.cover),
                          ),
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.bodyMedium("Card with stretched link", fontWeight: 600),
                                MySpacing.height(20),
                                MyContainer(
                                  color: contentTheme.info,
                                  paddingAll: 12,
                                  child: MyText.bodyMedium("Go somewhere", fontWeight: 600, color: contentTheme.onInfo),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-3 md-3',
                    child: MyContainer(
                      onTap: () {},
                      paddingAll: 0,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyContainer(
                            height: 200,
                            width: double.infinity,
                            clipBehavior: Clip.antiAliasWithSaveLayer,
                            paddingAll: 0,
                            borderRadiusAll: 0,
                            child: Image.asset(Images.small[1], fit: BoxFit.cover),
                          ),
                          Padding(
                            padding: MySpacing.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.bodyMedium("Card with stretched link", fontWeight: 600, color: contentTheme.primary),
                                MySpacing.height(20),
                                MyText.bodyMedium(controller.dummyTexts[0], muted: true, maxLines: 2),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              MySpacing.height(flexSpacing),
              Padding(padding: MySpacing.x(flexSpacing / 2), child: MyText.titleMedium("Card group", fontWeight: 700,muted: true)),
              MySpacing.height(flexSpacing),
              Padding(
                padding: MySpacing.x(flexSpacing / 2),
                child: MyFlex(
                  spacing: 0,
                  children: [
                    MyFlexItem(
                      sizes: 'lg-4 md-4',
                      child: MyContainer(
                        paddingAll: 0,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            MyContainer(
                              height: 300,
                              width: double.infinity,
                              borderRadiusAll: 0,
                              paddingAll: 0,
                              clipBehavior: Clip.antiAliasWithSaveLayer,
                              child: Image.asset(Images.small[1], fit: BoxFit.cover),
                            ),
                            Padding(
                              padding: MySpacing.all(20),
                              child: SizedBox(
                                height: 100,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    MyText.bodyMedium("Card title", fontWeight: 700,muted: true),
                                    MyText.bodySmall(controller.dummyTexts[0], maxLines: 2, muted: true),
                                    MyText.bodySmall("Last updated 3 mins ago", fontWeight: 600, xMuted: true),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    MyFlexItem(
                      sizes: 'lg-4 md-4',
                      child: MyContainer(
                        paddingAll: 0,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            MyContainer(
                              height: 300,
                              width: double.infinity,
                              paddingAll: 0,
                              borderRadiusAll: 0,
                              clipBehavior: Clip.antiAliasWithSaveLayer,
                              child: Image.asset(Images.small[1], fit: BoxFit.cover),
                            ),
                            Padding(
                              padding: MySpacing.all(20),
                              child: SizedBox(
                                height: 100,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    MyText.bodyMedium("Card title", fontWeight: 700,muted: true),
                                    MyText.bodySmall(controller.dummyTexts[0], maxLines: 1),
                                    MyText.bodySmall("Last updated 3 mins ago", fontWeight: 600, xMuted: true),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    MyFlexItem(
                      sizes: 'lg-4 md-4',
                      child: MyContainer(
                        paddingAll: 0,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            MyContainer(
                              height: 300,
                              width: double.infinity,
                              paddingAll: 0,
                              borderRadiusAll: 0,
                              clipBehavior: Clip.antiAliasWithSaveLayer,
                              child: Image.asset(Images.small[2], fit: BoxFit.cover),
                            ),
                            Padding(
                              padding: MySpacing.all(20),
                              child: SizedBox(
                                height: 100,
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    MyText.bodyMedium("Card title", fontWeight: 700,muted: true),
                                    MyText.bodySmall(controller.dummyTexts[0], maxLines: 2),
                                    MyText.bodySmall("Last updated 3 mins ago", fontWeight: 600, xMuted: true),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              MySpacing.height(flexSpacing),
              Padding(padding: MySpacing.x(flexSpacing / 2), child: MyText.titleMedium("Custom Card", fontWeight: 700,muted: true)),
              MySpacing.height(flexSpacing),
              MyFlex(
                children: [
                  MyFlexItem(sizes: 'lg-4', child: CustomCardPortlets()),
                  MyFlexItem(sizes: 'lg-4', child: CustomCardPortlets()),
                  MyFlexItem(sizes: 'lg-4', child: CustomCardPortlets()),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget cardColor(String title, String subTitle, Color color) {
    return MyContainer(
      height: 156,
      color: color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.bodySmall(title, maxLines: 2, color: contentTheme.onPrimary),
          MySpacing.height(30),
          MyText.bodySmall(subTitle, muted: true, color: contentTheme.onPrimary),
        ],
      ),
    );
  }

  Widget cardBorder(String title, String subTitle, Color color) {
    return MyContainer.bordered(
      borderColor: color,
      paddingAll: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium(title, maxLines: 2, fontWeight: 600, color: color),
          MySpacing.height(20),
          MyText.bodyMedium(subTitle, muted: true, color: color),
          MySpacing.height(20),
          MyContainer(
            color: color,
            paddingAll: 12,
            onTap: () {},
            child: MyText.bodyMedium("Button", fontWeight: 600, color: contentTheme.onPrimary),
          ),
        ],
      ),
    );
  }
}

class CustomCardPortlets extends StatefulWidget {
  const CustomCardPortlets({super.key});

  @override
  State<CustomCardPortlets> createState() => _CustomCardPortletsState();
}

class _CustomCardPortletsState extends State<CustomCardPortlets> {
  List<String> dummyTexts = List.generate(12, (index) => MyTextUtils.getDummyText(60));
  bool isMinimize = false;

  bool isClose = false;

  bool isLoading = false;

  void onMinimizeToggle() {
    setState(() {
      isMinimize = !isMinimize;
    });
  }

  void onCloseToggle() {
    setState(() {
      isClose = !isClose;
    });
  }

  Future<void> onLoadingToggle() async {
    setState(() {
      isLoading = true;
    });
    await Future.delayed(Duration(seconds: 2));
    setState(() {
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (isClose) {
      return SizedBox();
    } else {
      return MyCard(
        paddingAll: 20,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                MyText.bodyMedium("Card title", fontWeight: 600),
                Spacer(),
                InkWell(onTap: onLoadingToggle, child: Icon(Remix.refresh_line, size: 18)),
                MySpacing.width(12),
                InkWell(onTap: onMinimizeToggle, child: Icon(isMinimize ? Remix.add_line : Remix.subtract_line, size: 18)),
                MySpacing.width(12),
                InkWell(onTap: onCloseToggle, child: Icon(Remix.close_line, size: 18)),
              ],
            ),
            if (!isMinimize) MySpacing.height(20),
            Stack(
              clipBehavior: Clip.antiAliasWithSaveLayer,
              alignment: Alignment.center,
              children: [
                if (!isMinimize)
                  MyText.bodySmall(
                    "Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.",
                    fontWeight: 600,
                    xMuted: true,
                    letterSpacing: .5,
                    color: isLoading ? theme.colorScheme.secondary.withAlpha(2) : null,
                  ),
                if (isLoading) Center(child: CircularProgressIndicator()),
              ],
            ),
          ],
        ),
      );
    }
  }
}

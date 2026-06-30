import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/pricing_controller.dart';
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

class PricingScreen extends StatefulWidget {
  const PricingScreen({super.key});

  @override
  State<PricingScreen> createState() => _PricingScreenState();
}

class _PricingScreenState extends State<PricingScreen> with UIMixin, SingleTickerProviderStateMixin {
  late PricingController controller;


  @override
  void initState() {
    controller = Get.put(PricingController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Pricing',
          mainScreenName: 'Page',
          child: MyCard(
            shadow: MyShadow(elevation: 0.7, position: MyShadowPosition.bottom),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyText.bodyMedium('Pricing Plans', fontWeight: 600),
                MySpacing.height(12),
                MyFlex(
                  runAlignment: WrapAlignment.center,
                  wrapCrossAlignment: WrapCrossAlignment.center,
                  wrapAlignment: WrapAlignment.center,
                  children: [
                    MyFlexItem(
                      sizes: 'lg-7',
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                MyText.bodyMedium(controller.dummyTexts[0], style: TextStyle(color: Colors.grey[700])),
                                MySpacing.height(12),
                                Align(
                                  alignment: Alignment.centerLeft,
                                  child: TextButton(onPressed: () {}, child: Text("Read More")),
                                ),
                                Divider(),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    MyContainer(
                                      color: contentTheme.primary,
                                      paddingAll: 8,
                                      child: Icon(Icons.format_quote, size: 24, color: contentTheme.onPrimary),
                                    ),
                                    MySpacing.width(12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          MyText.bodyMedium(
                                            'Varius natoque penatibus et magnis dis parturient montes nascetur ridiculus mus morbi vehicula tempus maximus.',
                                          ),

                                          MySpacing.height(12),
                                          Row(
                                            children: [
                                              CircleAvatar(backgroundImage: AssetImage(Images.users[6]), radius: 20),
                                              MySpacing.width(12),
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  MyText.titleMedium("James Raphael", fontWeight: 700),
                                                  MyText.bodyMedium("Web Developer", muted: true),
                                                ],
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    MyFlexItem(
                      sizes: 'lg-5',
                      child: Column(
                        children: [
                          MyContainer.bordered(
                            paddingAll: 8,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                MyContainer(
                                  onTap: () {
                                    controller.toggleTab(0);
                                  },
                                  color: controller.isSelect == 0 ? contentTheme.primary : null,
                                  paddingAll: 12,
                                  child: MyText.bodyMedium("Monthly", color: controller.isSelect == 0 ? contentTheme.onPrimary : null),
                                ),
                                MySpacing.width(12),
                                MyContainer(
                                  onTap: () {
                                    controller.toggleTab(1);
                                  },
                                  color: controller.isSelect == 1 ? contentTheme.primary : null,
                                  paddingAll: 12,
                                  child: Row(
                                    children: [
                                      MyText.bodyMedium("Yearly", color: controller.isSelect == 1 ? contentTheme.onPrimary : null),
                                      MySpacing.width(12),
                                      MyContainer(
                                        paddingAll: 2,
                                        color: contentTheme.success,
                                        child: Row(
                                          mainAxisAlignment: MainAxisAlignment.end,
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            MyText.labelSmall("20%", color: contentTheme.onSuccess),
                                            MyText.labelSmall("off", color: contentTheme.onSuccess),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          MySpacing.height(12),
                          pricingCard(),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget pricingCard() {
    Widget pricingCardDetails(String title, String price) {
      return MyContainer(
        color: contentTheme.light,
        borderRadiusAll: 12,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium(title, fontWeight: 600),
                  MySpacing.height(4),
                  MyText.bodyMedium('Desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.'),
                ],
              ),
            ),
            MySpacing.width(12),
            MyText.titleLarge(price),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 20,
      children: [
        pricingCardDetails('Starter', controller.isSelect == 0 ? 'Free' : '\$129'),
        pricingCardDetails('Professional', controller.isSelect == 0 ? '\$49' : '\$149'),
        pricingCardDetails('Unlimited', controller.isSelect == 0 ? '\$99' : '\$199'),
      ],
    );
  }

  // Widget pricingCard(String title, String price, String description, {bool highlight = false}) {
  //   return Card(
  //     shape: highlight
  //         ? RoundedRectangleBorder(
  //             side: BorderSide(color: Colors.blue, width: 2),
  //             borderRadius: BorderRadius.circular(10),
  //           )
  //         : null,
  //     color: Colors.grey[100],
  //     child: Padding(
  //       padding: const EdgeInsets.all(16),
  //       child: Column(
  //         crossAxisAlignment: CrossAxisAlignment.start,
  //         children: [
  //           Align(
  //             alignment: Alignment.topRight,
  //             child: Text(price, style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
  //           ),
  //           Text(title, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
  //           SizedBox(height: 6),
  //           Text(description, style: TextStyle(color: Colors.grey[600])),
  //         ],
  //       ),
  //     ),
  //   );
  // }
  //
  // Widget buildTabContent(bool isMonthly) {
  //   final plans = isMonthly
  //       ? [
  //           {'title': 'Starter', 'price': 'Free'},
  //           {'title': 'Professional', 'price': '\$49', 'highlight': true},
  //           {'title': 'Unlimited', 'price': '\$99'},
  //         ]
  //       : [
  //           {'title': 'Starter', 'price': '\$129'},
  //           {'title': 'Professional', 'price': '\$149', 'highlight': true},
  //           {'title': 'Unlimited', 'price': '\$199'},
  //         ];
  //
  //   return Column(
  //     children: plans.map((plan) {
  //       return pricingCard(
  //         plan['title'] as String,
  //         plan['price'] as String,
  //         'Desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.',
  //         highlight: plan['highlight'] == true,
  //       );
  //     }).toList(),
  //   );
  // }
}

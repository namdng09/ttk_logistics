import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/faqs_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class FaqsScreen extends StatefulWidget {
  const FaqsScreen({super.key});

  @override
  State<FaqsScreen> createState() => _FaqsScreenState();
}

class _FaqsScreenState extends State<FaqsScreen> with UIMixin {
  late FaqsController controller;

  @override
  void initState() {
    controller = Get.put(FaqsController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'FAQs',
          mainScreenName: 'Page',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            borderRadiusAll: 4,
            child: MyFlex(
              children: controller.faqList.map((faq) {
                return MyFlexItem(
                  sizes: 'lg-4',
                  child: MyContainer(
                    height: 150,
                    color: contentTheme.light,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: MyText.titleMedium('${faq['id']}.',color: contentTheme.primary,fontWeight: 600)),
                            MyContainer.roundBordered(
                              borderColor: contentTheme.primary,
                              color: contentTheme.primary.withValues(alpha: 0.1),
                              paddingAll: 8,
                              child: Icon(RemixIcons.question_mark,color: contentTheme.primary,size: 16,),
                            )
                          ],
                        ),
                        MyText.titleMedium(faq['question'],fontWeight: 600),
                        MySpacing.height(12),
                        MyText.bodyMedium(faq['answer'],fontWeight: 600,muted: true),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        );
      },
    );
  }
}

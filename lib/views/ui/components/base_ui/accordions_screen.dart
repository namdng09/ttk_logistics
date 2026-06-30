import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/components/base_ui/accordions_controller.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class AccordionsScreen extends StatefulWidget {
  const AccordionsScreen({super.key});

  @override
  State<AccordionsScreen> createState() => _AccordionsScreenState();
}

class _AccordionsScreenState extends State<AccordionsScreen> with UIMixin {
  AccordionsController controller = Get.put(AccordionsController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'accordion_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Accordions',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [defaultAccordions(), flushAccordions(), simpleCardAccordions(), alwaysOpenAccordions()],
          ),
        );
      },
    );
  }

  MyFlexItem alwaysOpenAccordions() {
    return MyFlexItem(
      sizes: "lg-6",
      child: MyCard(
        shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
        paddingAll: 0,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        borderRadiusAll: 4,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MyContainer(
              width: double.infinity,
              borderRadiusAll: 0,
              child: MyText.titleMedium("Always Open Accordions", fontWeight: 700, muted: true),
            ),
            Padding(
              padding: MySpacing.all(20),
              child: ExpansionPanelList(
                expandedHeaderPadding: EdgeInsets.all(0),
                expansionCallback: (int index, bool isExpanded) => setState(() => controller.alwaysOpenAccordions[index] = isExpanded),
                animationDuration: Duration(milliseconds: 500),
                children: <ExpansionPanel>[
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #1"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.alwaysOpenAccordions[0],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #2"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.alwaysOpenAccordions[1],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #3"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.alwaysOpenAccordions[2],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  MyFlexItem defaultAccordions() {
    return MyFlexItem(
      sizes: "lg-6",
      child: MyCard(
        shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
        paddingAll: 0,
        borderRadiusAll: 4,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MyContainer(
              width: double.infinity,
              borderRadiusAll: 0,
              clipBehavior: Clip.antiAliasWithSaveLayer,
              child: MyText.titleMedium("Default Accordions", fontWeight: 700, muted: true),
            ),
            Padding(
              padding: MySpacing.all(20),
              child: ExpansionPanelList(
                expandedHeaderPadding: EdgeInsets.all(0),
                expansionCallback: (int index, bool isExpanded) => setState(() => controller.defaultAccordions[index] = isExpanded),
                animationDuration: Duration(milliseconds: 500),
                children: <ExpansionPanel>[
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #1"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.defaultAccordions[0],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #2"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.defaultAccordions[1],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #3"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.defaultAccordions[2],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  MyFlexItem simpleCardAccordions() {
    return MyFlexItem(
      sizes: "lg-6",
      child: MyCard(
        shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
        paddingAll: 0,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        borderRadiusAll: 4,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MyContainer(
              width: double.infinity,
              borderRadiusAll: 0,
              child: MyText.titleMedium("Simple Accordions", fontWeight: 700, muted: true),
            ),
            Padding(
              padding: MySpacing.all(20),
              child: ExpansionPanelList(
                expandedHeaderPadding: EdgeInsets.all(0),
                expansionCallback: (int index, bool isExpanded) => setState(() => controller.simpleCardAccordions[index] = isExpanded),
                animationDuration: Duration(milliseconds: 500),
                children: <ExpansionPanel>[
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #1"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.simpleCardAccordions[0],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #2"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.simpleCardAccordions[1],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #3"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.simpleCardAccordions[2],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  MyFlexItem flushAccordions() {
    return MyFlexItem(
      sizes: "lg-6",
      child: MyCard(
        shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
        paddingAll: 0,
        clipBehavior: Clip.antiAliasWithSaveLayer,
        borderRadiusAll: 4,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MyContainer(
              width: double.infinity,
              borderRadiusAll: 0,
              child: MyText.titleMedium("Flash Accordions", fontWeight: 700, muted: true),
            ),

            Padding(
              padding: MySpacing.all(20),
              child: ExpansionPanelList(
                expandedHeaderPadding: EdgeInsets.all(0),
                expansionCallback: (int index, bool isExpanded) => setState(() => controller.flushAccordions[index] = isExpanded),
                animationDuration: Duration(milliseconds: 500),
                children: <ExpansionPanel>[
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #1"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.flushAccordions[0],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #2"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.flushAccordions[1],
                  ),
                  ExpansionPanel(
                    canTapOnHeader: true,
                    headerBuilder: (BuildContext context, bool isExpanded) => title(isExpanded, "Accordions Item #3"),
                    body: Padding(padding: MySpacing.all(20), child: MyText.bodyMedium(controller.dummyTexts[1], xMuted: true)),
                    isExpanded: controller.flushAccordions[2],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget title(bool isExpanded, title) {
    return ListTile(
      title: MyText.bodyMedium(
        title,
        color: isExpanded ? contentTheme.primary : theme.colorScheme.onSurface,
        fontWeight: isExpanded ? 600 : 500,
      ),
    );
  }
}

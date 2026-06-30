import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/components/base_ui/tool_tip_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';


class ToolTipScreen extends StatefulWidget {
  const ToolTipScreen({super.key});

  @override
  State<ToolTipScreen> createState() => _ToolTipScreenState();
}

class _ToolTipScreenState extends State<ToolTipScreen> with UIMixin {
  ToolTipController controller = Get.put(ToolTipController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'tool_tip_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Tool Tip',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(child: fourDirections()),
              MyFlexItem(child: htmlTag()),
              MyFlexItem(child: disableElement()),
              MyFlexItem(child: colorToolTip()),
            ],
          ),
        );
      },
    );
  }

  Widget fourDirections() {
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
            child: MyText.titleMedium("Four Directions", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                Tooltip(
                  verticalOffset: -48,
                  message: "Tool tip on top",
                  child: MyContainer(
                    padding: MySpacing.xy(12, 8),
                    color: contentTheme.info,
                    child: MyText.bodySmall("Tooltip on top", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ),
                Tooltip(
                  message: "Tool tip on bottom",
                  child: MyContainer(
                    padding: MySpacing.xy(12, 8),
                    color: contentTheme.info,
                    child: MyText.bodySmall("Tooltip on bottom", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ),
                Tooltip(
                  message: "Tool tip on left",
                  preferBelow: true,
                  margin: MySpacing.left(240),
                  verticalOffset: -12,
                  child: MyContainer(
                    padding: MySpacing.xy(12, 8),
                    color: contentTheme.info,
                    child: MyText.bodySmall("Tooltip on left", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ),
                Tooltip(
                  message: "Tool tip on right",
                  preferBelow: true,
                  margin: MySpacing.right(240),
                  verticalOffset: -12,
                  child: MyContainer(
                    padding: MySpacing.xy(12, 8),
                    color: contentTheme.info,
                    child: MyText.bodySmall("Tooltip on right", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget htmlTag() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("HTML Tag", fontWeight: 700, muted: true)),
          Padding(
            padding: MySpacing.all(24),
            child: Tooltip(
              message: 'Tooltip with HTML',
              child: MyContainer(
                padding: MySpacing.xy(12, 8),
                color: contentTheme.secondary,
                onTap: () {},
                child: MyText.bodySmall('Tooltip with HTML', fontWeight: 600, color: contentTheme.onSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget disableElement() {
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
            child: MyText.titleMedium("Disable Element", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Tooltip(
              message: 'Disable',
              child: MyContainer(
                padding: MySpacing.xy(12, 8),
                color: contentTheme.secondary,
                child: MyText.bodySmall('Disable button', fontWeight: 600, color: contentTheme.onSecondary),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget colorToolTip() {
    Widget colorToolTipWidget(String name, Color color) {
      return Tooltip(
        message: '$name Tooltip',
        decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(8)),
        child: MyContainer(
          padding: MySpacing.xy(12, 8),

          color: color,
          onTap: () {},
          child: MyText.bodySmall('$name Tooltip', fontWeight: 600, color: contentTheme.onPrimary),
        ),
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
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Color Tooltip", fontWeight: 700, muted: true)),
          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                colorToolTipWidget("Primary", contentTheme.primary),
                colorToolTipWidget("Danger", contentTheme.danger),
                colorToolTipWidget("Info", contentTheme.info),
                colorToolTipWidget("Success", contentTheme.success),
                colorToolTipWidget("Pink", contentTheme.pink),
                colorToolTipWidget("Purple", contentTheme.purple),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

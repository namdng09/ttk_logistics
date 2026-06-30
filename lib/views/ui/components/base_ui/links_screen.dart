import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/components/base_ui/links_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart' show MyFlexItem;
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';
import 'package:ttk_logistics/views/layout/layout.dart';


class LinksScreen extends StatefulWidget {
  const LinksScreen({super.key});

  @override
  State<LinksScreen> createState() => _LinksScreenState();
}

class _LinksScreenState extends State<LinksScreen> with UIMixin {
  LinksController controller = Get.put(LinksController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'links_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Links',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(child: coloredLinks()),
              MyFlexItem(child: linkUtilities()),
              MyFlexItem(child: linksOpacity()),
              MyFlexItem(child: linkHoverOpacity()),
              MyFlexItem(child: underLineColor()),
              MyFlexItem(child: underLineOpacity()),
              MyFlexItem(child: underlineOffset()),
              MyFlexItem(child: hoverVariants()),
            ],
          ),
        );
      },
    );
  }

  Widget coloredLinks() {
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
            child: MyText.bodyMedium("Colored Links", fontWeight: 600),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(onTap: () {}, child: MyText.bodyMedium("Primary link", color: contentTheme.primary)),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Secondary link", color: contentTheme.secondary)),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Success link", color: contentTheme.success)),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Danger link", color: contentTheme.danger)),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Warning link", color: contentTheme.warning)),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Info link", color: contentTheme.info)),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Light link", color: contentTheme.light)),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Dark link", color: contentTheme.dark)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget linkUtilities() {
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
            child: MyText.bodyMedium("Link Utilities", fontWeight: 600),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Primary link", color: contentTheme.primary, decoration: TextDecoration.underline),
                ),
                MySpacing.height(20),
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Secondary link", color: contentTheme.secondary, decoration: TextDecoration.underline),
                ),
                MySpacing.height(20),
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Success link", color: contentTheme.success, decoration: TextDecoration.underline),
                ),
                MySpacing.height(20),
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Danger link", color: contentTheme.dark, decoration: TextDecoration.underline),
                ),
                MySpacing.height(20),
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Warning link", color: contentTheme.warning, decoration: TextDecoration.underline),
                ),
                MySpacing.height(20),
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Info link", color: contentTheme.info, decoration: TextDecoration.underline),
                ),
                MySpacing.height(20),
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Light link", color: contentTheme.light, decoration: TextDecoration.underline),
                ),
                MySpacing.height(20),
                InkWell(
                  onTap: () {},
                  child: MyText.bodyMedium("Dark link", color: contentTheme.dark, decoration: TextDecoration.underline),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget linksOpacity() {
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
            child: MyText.bodyMedium("Link Opacity", fontWeight: 600),
          ),
          Padding(
            padding: MySpacing.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(onTap: () {}, child: MyText.bodyMedium("Link opacity 10", color: contentTheme.primary.withValues(alpha: .1))),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Link opacity 25", color: contentTheme.primary.withValues(alpha: .25))),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Link opacity 50", color: contentTheme.primary.withValues(alpha: .5))),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Link opacity 75", color: contentTheme.primary.withValues(alpha: .75))),
                MySpacing.height(20),
                InkWell(onTap: () {}, child: MyText.bodyMedium("Link opacity 100", color: contentTheme.primary.withValues(alpha: 1))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget linkHoverOpacity() {
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
            child: MyText.bodyMedium("Link hove opacity", fontWeight: 600),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LinkHoverOpacity(text: "Link hover opacity 10", opacity: .10),
                MySpacing.height(20),
                LinkHoverOpacity(text: "Link hover opacity 25", opacity: .25),
                MySpacing.height(20),
                LinkHoverOpacity(text: "Link hover opacity 50", opacity: .5),
                MySpacing.height(20),
                LinkHoverOpacity(text: "Link hover opacity 75", opacity: .7),
                MySpacing.height(20),
                LinkHoverOpacity(text: "Link hover opacity 100", opacity: .8),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget underLineColor() {
    Widget buildLink(String text, Color underlineColor) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: InkWell(
          onTap: () {},
          child: MyText.bodyMedium(
            text,
            fontWeight: 600,
            muted: true,
            style: TextStyle(
              color: contentTheme.primary,
              decoration: TextDecoration.underline,
              decorationColor: underlineColor,
              decorationThickness: 2,
            ),
          ),
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
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.bodyMedium("Underline Color", fontWeight: 600),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                buildLink("Primary underline", Colors.blue),
                MySpacing.height(20),
                buildLink("Secondary underline", Colors.grey),
                MySpacing.height(20),
                buildLink("Success underline", Colors.green),
                MySpacing.height(20),
                buildLink("Danger underline", Colors.red),
                MySpacing.height(20),
                buildLink("Warning underline", Colors.orange),
                MySpacing.height(20),
                buildLink("Info underline", Colors.cyan),
                MySpacing.height(20),
                buildLink("Light underline", Colors.white),
                MySpacing.height(20),
                buildLink("Dark underline", Colors.black),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget underLineOpacity() {
    Widget buildLink(String text, double opacity) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: InkWell(
          onTap: () {},
          child: MyText.bodyMedium(
            text,
            fontWeight: 600,
            style: TextStyle(
              color: contentTheme.primary,
              decoration: TextDecoration.underline,
              decorationColor: Colors.blue.withValues(alpha: opacity),
              decorationThickness: 2.0,
              decorationStyle: TextDecorationStyle.solid,
            ),
          ),
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
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.bodyMedium("Underline Opacity", fontWeight: 600),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                buildLink("Underline opacity 0", 0.0),
                MySpacing.height(20),
                buildLink("Underline opacity 10", 0.1),
                MySpacing.height(20),
                buildLink("Underline opacity 25", 0.25),
                MySpacing.height(20),
                buildLink("Underline opacity 50", 0.5),
                MySpacing.height(20),
                buildLink("Underline opacity 75", 0.75),
                MySpacing.height(20),
                buildLink("Underline opacity 100", 1.0),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget underlineOffset() {
    Widget buildLink(String text, double offset) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 8.0),
        child: Stack(
          children: [
            MyText.bodyMedium(text, style: MyTextStyle.bodyMedium(color: contentTheme.primary, decoration: TextDecoration.none)),
            Positioned(bottom: -offset, child: Container(width: text.length * 8.0, height: 2, color: contentTheme.primary)),
          ],
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
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.bodyMedium("Underline Offset", fontWeight: 600),
          ),
          Padding(
            padding: MySpacing.all(8.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                buildLink("Default link", 0.0),
                buildLink("Offset 1 link", 1.0),
                buildLink("Offset 2 link", 2.0),
                buildLink("Offset 3 link", 3.0),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget hoverVariants() {
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
            child: MyText.bodyMedium("Underline Offset", fontWeight: 600),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: MouseRegion(
              onEnter: (event) => controller.onEnter(event),
              onExit: (event) => controller.onExit(event),
              child: AnimatedContainer(
                duration: Duration(milliseconds: 200),
                padding: EdgeInsets.only(bottom: controller.isHovered ? 3.0 : 2.0),
                child: Text(
                  'Underline opacity 0',
                  style: TextStyle(
                    color: contentTheme.primary,
                    decoration: TextDecoration.underline,
                    decorationColor: contentTheme.primary.withValues(alpha: controller.isHovered ? 0.75 : 0.0),
                    decorationThickness: 2.0,
                    decorationStyle: TextDecorationStyle.solid,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class LinkHoverOpacity extends StatefulWidget {
  const LinkHoverOpacity({super.key, required this.text, required this.opacity});

  final String text;
  final double opacity;

  @override
  State<LinkHoverOpacity> createState() => _LinkHoverOpacityState();
}

class _LinkHoverOpacityState extends State<LinkHoverOpacity> with UIMixin {
  double opacity = 1.0;

  void onEnter(PointerEvent event) {
    setState(() {
      opacity = widget.opacity;
    });
  }

  void onExit(PointerEvent event) {
    setState(() {
      opacity = 1.0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (event) => onEnter(event),
      onExit: (event) => onExit(event),
      child: AnimatedOpacity(
        opacity: opacity,
        duration: Duration(milliseconds: 200),
        child: InkWell(onTap: () {}, child: MyText.bodyMedium(widget.text, color: contentTheme.primary, muted: true, fontWeight: 600)),
      ),
    );
  }
}

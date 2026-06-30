import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:remixicon/remixicon.dart';

import 'package:ttk_logistics/controller/ui/components/base_ui/alerts_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_button.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_list_extension.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> with UIMixin {
  AlertsController controller = Get.put(AlertsController());

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'alert_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Alerts',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-6', child: defaultAlert()),
              MyFlexItem(sizes: 'lg-6', child: dismissingAlerts()),
              MyFlexItem(sizes: 'lg-6', child: customAlerts()),
              MyFlexItem(sizes: 'lg-6', child: linkColor()),
              MyFlexItem(sizes: 'lg-6', child: iconWithAlert()),
              MyFlexItem(sizes: 'lg-6', child: additionalContent()),
              MyFlexItem(sizes: 'lg-6', child: liveAlert()),
            ],
          ),
        );
      },
    );
  }

  Widget defaultAlert() {
    Widget defaultAlertWidget(String colorName, Color color) {
      return MyContainer.bordered(
        width: MediaQuery.of(context).size.width,
        color: color.withValues(alpha: .2),
        borderColor: color,
        paddingAll: 12,
        onTap: () {},
        child: Row(
          children: [
            MyText.bodySmall("$colorName - ", fontWeight: 600, color: colorName == 'Light' ? contentTheme.dark : color),
            Expanded(
              child: MyText.bodySmall(
                "A Simple $colorName alert--Check it out!",
                overflow: TextOverflow.ellipsis,
                muted: true,
                color: colorName == 'Light' ? contentTheme.dark : color,
              ),
            ),
          ],
        ),
      );
    }

    return MyCard(
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
            child: MyText.titleMedium("Default Alert", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: Column(
              children: [
                defaultAlertWidget("Primary", contentTheme.primary),
                MySpacing.height(16),
                defaultAlertWidget("Secondary", contentTheme.secondary),
                MySpacing.height(16),
                defaultAlertWidget("Success", contentTheme.success),
                MySpacing.height(16),
                defaultAlertWidget("Error", contentTheme.danger),
                MySpacing.height(16),
                defaultAlertWidget("Warning", contentTheme.warning),
                MySpacing.height(16),
                defaultAlertWidget("Info", contentTheme.info),
                MySpacing.height(16),
                defaultAlertWidget("Pink", contentTheme.pink),
                MySpacing.height(16),
                defaultAlertWidget("Purple", contentTheme.purple),
                MySpacing.height(16),
                defaultAlertWidget("Light", contentTheme.light),
                MySpacing.height(16),
                defaultAlertWidget("Dark", contentTheme.dark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget dismissingAlerts() {
    Widget dismissingAlertsWidgets(String colorName, Color color, void Function()? onTap) {
      return MyContainer(
        color: color,
        paddingAll: 12,
        margin: MySpacing.only(bottom: 15),
        child: Row(
          children: [
            MyText.bodySmall("$colorName - ", fontWeight: 600, color: colorName == 'Light' ? contentTheme.dark : contentTheme.onPrimary),
            Expanded(
              child: MyText.bodySmall(
                "A Simple $colorName alert--Check it out!",
                overflow: TextOverflow.ellipsis,
                muted: true,
                color: colorName == 'Light' ? contentTheme.dark : contentTheme.onPrimary,
              ),
            ),
            InkWell(
              onTap: onTap,
              child: Icon(RemixIcons.close_line, size: 17, color: colorName == 'Light' ? contentTheme.dark : contentTheme.onPrimary),
            ),
          ],
        ),
      );
    }

    return MyCard(
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
            child: MyText.titleMedium("Dismissing Alerts", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: Column(
              children:
                  controller.dismissingAlerts.mapIndexed((index, element) {
                    dynamic alert = controller.dismissingAlerts[index];
                    return dismissingAlertsWidgets(
                      alert['colorName'],
                      Color(int.parse(alert['color'])),
                      () => controller.removeColorToggle(index),
                    );
                  }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget customAlerts() {
    Widget customAlertsWidget(String colorName, Color color) {
      return MyContainer.bordered(
        width: MediaQuery.of(context).size.width,
        paddingAll: 12,
        borderColor: color,
        child: Row(
          children: [
            MyText.bodySmall("This is a ", muted: true, color: colorName == 'Light' ? contentTheme.dark : color),
            MyText.bodySmall("$colorName ", fontWeight: 600, color: colorName == 'Light' ? contentTheme.dark : color),
            MyText.bodySmall("alert--Check it out!", muted: true, color: colorName == 'Light' ? contentTheme.dark : color),
          ],
        ),
      );
    }

    return MyCard(
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
            child: MyText.titleMedium("Custom Alerts", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(20),
            child: Column(
              children: [
                customAlertsWidget("Primary", contentTheme.primary),
                MySpacing.height(16),
                customAlertsWidget("Secondary", contentTheme.secondary),
                MySpacing.height(16),
                customAlertsWidget("Success", contentTheme.success),
                MySpacing.height(16),
                customAlertsWidget("Error", contentTheme.danger),
                MySpacing.height(16),
                customAlertsWidget("Warning", contentTheme.warning),
                MySpacing.height(16),
                customAlertsWidget("Info", contentTheme.info),
                MySpacing.height(16),
                customAlertsWidget("Pink", contentTheme.pink),
                MySpacing.height(16),
                customAlertsWidget("Purple", contentTheme.purple),
                MySpacing.height(16),
                customAlertsWidget("Light", contentTheme.light),
                MySpacing.height(16),
                customAlertsWidget("Dark", contentTheme.dark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget linkColor() {
    Widget linkColorWidget(String colorName, Color color) {
      return MyContainer.bordered(
        width: MediaQuery.of(context).size.width,
        color: color.withValues(alpha: .2),
        borderColor: color,
        paddingAll: 12,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: MyText.bodySmall(
                "A simple $colorName alert with",
                overflow: TextOverflow.ellipsis,
                muted: true,
                color: colorName == 'Light' ? contentTheme.dark : color,
              ),
            ),
            MySpacing.width(4),
            InkWell(
              onTap: () {},
              child: MyText.bodySmall(
                "an example link.",
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
                fontWeight: 800,
                color: colorName == 'Light' ? contentTheme.dark : color,
              ),
            ),
            MySpacing.width(4),
            Expanded(
              child: MyText.bodySmall(
                "Give it a click if you like",
                overflow: TextOverflow.ellipsis,
                maxLines: 1,
                muted: true,
                color: colorName == 'Light' ? contentTheme.dark : color,
              ),
            ),
          ],
        ),
      );
    }

    return MyCard(
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
            child: MyText.titleMedium("Link Color", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: Column(
              children: [
                linkColorWidget("Primary", contentTheme.primary),
                MySpacing.height(16),
                linkColorWidget("Secondary", contentTheme.secondary),
                MySpacing.height(16),
                linkColorWidget("Success", contentTheme.success),
                MySpacing.height(16),
                linkColorWidget("Error", contentTheme.danger),
                MySpacing.height(16),
                linkColorWidget("Warning", contentTheme.warning),
                MySpacing.height(16),
                linkColorWidget("Info", contentTheme.info),
                MySpacing.height(16),
                linkColorWidget("Pink", contentTheme.pink),
                MySpacing.height(16),
                linkColorWidget("Purple", contentTheme.purple),
                MySpacing.height(16),
                linkColorWidget("Light", contentTheme.light),
                MySpacing.height(16),
                linkColorWidget("Dark", contentTheme.dark),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget iconWithAlert() {
    Widget iconWithAlertWidget(IconData icon, String colorName, Color color) {
      return MyContainer.bordered(
        color: color.withValues(alpha: .2),
        borderColor: color,
        paddingAll: 12,
        child: Row(
          children: [
            Icon(icon, size: 16, color: color),
            MySpacing.width(12),
            MyText.bodySmall("This is ", muted: true, color: color),
            MyText.bodySmall("$colorName ", fontWeight: 600, color: color),
            MyText.bodySmall("alert - check it out!", muted: true, color: color),
          ],
        ),
      );
    }

    return MyCard(
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
            child: MyText.titleMedium("Icons with Alerts", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: Column(
              children: [
                iconWithAlertWidget(RemixIcons.check_line, "Success", contentTheme.success),
                MySpacing.height(16),
                iconWithAlertWidget(RemixIcons.close_circle_line, "Danger", contentTheme.danger),
                MySpacing.height(16),
                iconWithAlertWidget(RemixIcons.triangle_line, "Warning", contentTheme.warning),
                MySpacing.height(16),
                iconWithAlertWidget(RemixIcons.info_i, "Info", contentTheme.info),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget additionalContent() {
    return MyCard(
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
            child: MyText.titleMedium("Additional content", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: MyContainer.bordered(
              color: contentTheme.info.withValues(alpha: .2),
              borderColor: contentTheme.info,
              width: MediaQuery.of(context).size.width,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  MyContainer.roundBordered(
                    borderColor: contentTheme.info,
                    color: contentTheme.info,
                    paddingAll: 8,
                    child: Icon(RemixIcons.check_line, size: 20, color: contentTheme.onInfo),
                  ),
                  MySpacing.height(12),
                  MyText.titleMedium("Well Done!", fontWeight: 600, color: contentTheme.info),
                  MySpacing.height(12),
                  MyText.bodySmall(
                    "Aww yeah, you successfully read this important alert message. This example text is going to run a bit longer so that you can see how spacing within an alert works with this kind of content.",
                    textAlign: TextAlign.center,
                    color: contentTheme.info,
                    muted: true,
                  ),
                  Divider(color: contentTheme.info, thickness: .5, height: 20),
                  MyText.bodySmall(
                    "Whenever you need to, be sure to use margin utilities to keep things nice and tidy.",
                    textAlign: TextAlign.center,
                    color: contentTheme.info,
                    muted: true,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget liveAlert() {
    return MyCard(
      paddingAll: 0,
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(
            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("Live Alert", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: Column(
              children: [
                MyText.bodyMedium(
                  "Click the button below to show an alert (hidden with inline styles to start), then dismiss (and destroy) it with the built-in close button.",
                  muted: true,
                ),
                MySpacing.height(16),
                ListView.separated(
                  itemCount: controller.liveMessage.length,
                  shrinkWrap: true,
                  itemBuilder: (context, index) {
                    return MyContainer.bordered(
                      color: contentTheme.blue.withValues(alpha: 0.3),
                      borderColor: contentTheme.blue,
                      paddingAll: 12,
                      child: Row(
                        children: [
                          Expanded(child: MyText.bodyMedium(controller.liveMessage[index], color: contentTheme.blue)),
                          InkWell(
                            onTap: () {
                              controller.removeLiveMessage(index);
                            },
                            child: Icon(RemixIcons.close_line, size: 16),
                          ),
                        ],
                      ),
                    );
                  },
                  separatorBuilder: (context, index) {
                    return MySpacing.height(12);
                  },
                ),
                MySpacing.height(16),
                MyButton(
                  onPressed: () {
                    controller.addLiveMessage();
                  },
                  elevation: 0,
                  backgroundColor: contentTheme.primary,
                  borderRadiusAll: 8,
                  child: MyText.bodyMedium('Show live alert', color: contentTheme.onPrimary),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:remixicon/remixicon.dart';

import 'package:ttk_logistics/controller/ui/components/base_ui/modals_controller.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_button.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class ModalsScreen extends StatefulWidget {
  const ModalsScreen({super.key});

  @override
  State<ModalsScreen> createState() => _ModalsScreenState();
}

class _ModalsScreenState extends State<ModalsScreen> with UIMixin {
  ModalsController controller = Get.put(ModalsController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'Modals_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Modals',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(child: bootstrapModals()),
              MyFlexItem(child: modalWithPages()),
              MyFlexItem(child: modalBaseAlert()),
              MyFlexItem(child: modalPosition()),
              MyFlexItem(child: staticBackDrop()),
              MyFlexItem(child: coloredHeaderModal()),
              MyFlexItem(child: filledModal()),
            ],
          ),
        );
      },
    );
  }

  Widget bootstrapModals() {
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
            child: MyText.bodyMedium("Bootstrap Modals", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => standardModal()),
                  backgroundColor: contentTheme.primary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Standard Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => largeModal()),
                  backgroundColor: contentTheme.info,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Large Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => smallModal()),
                  backgroundColor: contentTheme.success,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Small Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => fullWidthModal()),
                  backgroundColor: contentTheme.primary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Full Width Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => scrollableModal()),
                  backgroundColor: contentTheme.secondary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Scrollable Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget modalHeading(String title) {
    return Padding(
      padding: MySpacing.nBottom(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          MyText.titleMedium(title, fontWeight: 700, muted: true),
          InkWell(onTap: () => Get.back(), child: Icon(RemixIcons.close_line)),
        ],
      ),
    );
  }

  Dialog standardModal() {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            modalHeading("Modal Heading"),
            Divider(height: 40),
            Padding(
              padding: MySpacing.nTop(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Text in Modal", fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodyMedium("Duis mollis, est non commodo luctus, nisi erat porttitor ligula.", fontWeight: 600, muted: true),
                  Divider(height: 40),
                  MyText.bodyMedium("Overflowing text to show scroll behavior", fontWeight: 600),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 3, fontWeight: 600, xMuted: true),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 4, fontWeight: 600, xMuted: true),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 4, fontWeight: 600, xMuted: true),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.primary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog largeModal() {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 600, minWidth: 250),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            modalHeading('Large Modal'),
            Divider(),
            Padding(padding: MySpacing.nTop(20), child: MyText.bodyMedium("...")),
          ],
        ),
      ),
    );
  }

  Dialog smallModal() {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 400, minWidth: 250),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            modalHeading('Small Modal'),
            Divider(),
            Padding(padding: MySpacing.nTop(20), child: MyText.bodyMedium("...")),
          ],
        ),
      ),
    );
  }

  Dialog fullWidthModal() {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: double.infinity, minWidth: 250),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            modalHeading("Model Heading"),
            Divider(height: 40),
            Padding(
              padding: MySpacing.nTop(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Text in Modal", fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodyMedium("Duis mollis, est non commodo luctus, nisi erat porttitor ligula.", fontWeight: 600, muted: true),
                  Divider(height: 40),
                  MyText.bodyMedium("Overflowing text to show scroll behavior", fontWeight: 600),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 3, fontWeight: 600, xMuted: true),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 4, fontWeight: 600, xMuted: true),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 4, fontWeight: 600, xMuted: true),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.primary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog scrollableModal() {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          children: [
            modalHeading('Modal Title'),
            SizedBox(height: 20),
            Divider(height: 0),
            Expanded(
              child: ListView(
                shrinkWrap: true,
                padding: MySpacing.xy(20, 20),
                children: [
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[1], fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[2], fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[3], fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[4], fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[5], fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[6], fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[7], fontWeight: 600, muted: true),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.primary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget modalWithPages() {
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
            child: MyText.bodyMedium("Modal with Pages", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => SignUpModal()),
                  backgroundColor: contentTheme.primary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Sign Up Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => LoginModal()),
                  backgroundColor: contentTheme.info,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Login Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget modalBaseAlert() {
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
            child: MyText.bodyMedium("Modal Base Alert", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => successModal()),
                  backgroundColor: contentTheme.success,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Success Alert", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => infoModal()),
                  backgroundColor: contentTheme.info,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Info Alert", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => warningModal()),
                  backgroundColor: contentTheme.warning,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Warning Alert", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => dangerModal()),
                  backgroundColor: contentTheme.danger,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Danger Alert", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => pinkModal()),
                  backgroundColor: contentTheme.pink,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Pink Alert", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => purpleModal()),
                  backgroundColor: contentTheme.purple,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Purple Alert", color: contentTheme.onPrimary, fontWeight: 600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Dialog successModal() {
    return Dialog(
      backgroundColor: contentTheme.success,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Padding(
          padding: MySpacing.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Remix.check_line, color: contentTheme.onSuccess, size: 44),
              MySpacing.height(20),
              MyText.bodyMedium("Well Done!", fontWeight: 600, color: contentTheme.onSuccess),
              MySpacing.height(20),
              MyText.bodySmall(controller.dummyTexts[1], maxLines: 4, fontWeight: 600, color: contentTheme.onSuccess),
              MySpacing.height(20),
              MyContainer(padding: MySpacing.xy(12, 8), onTap: () => Get.back(), child: MyText.bodySmall("Continue", fontWeight: 600)),
            ],
          ),
        ),
      ),
    );
  }

  Dialog infoModal() {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Padding(
          padding: MySpacing.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Remix.information_line, color: contentTheme.info, size: 44),
              MySpacing.height(20),
              MyText.bodyMedium("Heads Up!", fontWeight: 600),
              MySpacing.height(20),
              MyText.bodySmall(controller.dummyTexts[1], maxLines: 4, fontWeight: 600, textAlign: TextAlign.center),
              MySpacing.height(20),
              MyContainer(
                onTap: () => Get.back(),
                padding: MySpacing.xy(12, 8),
                color: contentTheme.info,
                child: MyText.bodySmall("Continue", fontWeight: 600, color: contentTheme.onInfo),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Dialog warningModal() {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Padding(
          padding: MySpacing.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Remix.alert_line, color: contentTheme.warning, size: 44),
              MySpacing.height(20),
              MyText.bodyMedium("Incorrect Information", fontWeight: 600),
              MySpacing.height(20),
              MyText.bodySmall(controller.dummyTexts[1], maxLines: 4, fontWeight: 600, textAlign: TextAlign.center),
              MySpacing.height(20),
              MyContainer(
                onTap: () => Get.back(),
                padding: MySpacing.xy(12, 8),
                color: contentTheme.warning,
                child: MyText.bodySmall("Continue", fontWeight: 600, color: contentTheme.onInfo),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Dialog dangerModal() {
    return Dialog(
      backgroundColor: contentTheme.danger,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Padding(
          padding: MySpacing.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Remix.close_circle_line, color: contentTheme.onDanger, size: 44),
              MySpacing.height(20),
              MyText.bodyMedium("Oh Snap!", fontWeight: 600, color: contentTheme.onDanger),
              MySpacing.height(20),
              MyText.bodySmall(controller.dummyTexts[1], maxLines: 4, fontWeight: 600, color: contentTheme.onDanger),
              MySpacing.height(20),
              MyContainer(padding: MySpacing.xy(12, 8), onTap: () => Get.back(), child: MyText.bodySmall("Continue", fontWeight: 600)),
            ],
          ),
        ),
      ),
    );
  }

  Dialog pinkModal() {
    return Dialog(
      backgroundColor: contentTheme.pink,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Padding(
          padding: MySpacing.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Remix.close_circle_line, color: contentTheme.onPink, size: 44),
              MySpacing.height(20),
              MyText.bodyMedium("Oh Snap!", fontWeight: 600, color: contentTheme.onPink),
              MySpacing.height(20),
              MyText.bodySmall(controller.dummyTexts[1], maxLines: 4, fontWeight: 600, color: contentTheme.onPink),
              MySpacing.height(20),
              MyContainer(padding: MySpacing.xy(12, 8), onTap: () => Get.back(), child: MyText.bodySmall("Continue", fontWeight: 600)),
            ],
          ),
        ),
      ),
    );
  }

  Dialog purpleModal() {
    return Dialog(
      backgroundColor: contentTheme.purple,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Padding(
          padding: MySpacing.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Remix.close_circle_line, color: contentTheme.onPrimary, size: 44),
              MySpacing.height(20),
              MyText.bodyMedium("Oh Snap!", fontWeight: 600, color: contentTheme.onPrimary),
              MySpacing.height(20),
              MyText.bodySmall(controller.dummyTexts[1], maxLines: 4, fontWeight: 600, color: contentTheme.onPrimary),
              MySpacing.height(20),
              MyContainer(padding: MySpacing.xy(12, 8), onTap: () => Get.back(), child: MyText.bodySmall("Continue", fontWeight: 600)),
            ],
          ),
        ),
      ),
    );
  }

  Widget modalPosition() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.bodyMedium("Modal Position", fontWeight: 700, muted: true)),

          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => topModal()),
                  backgroundColor: contentTheme.secondary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Top Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => bottomModal()),
                  backgroundColor: contentTheme.secondary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Bottom Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => centerModal()),
                  backgroundColor: contentTheme.secondary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Center Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => rightModal()),
                  backgroundColor: contentTheme.secondary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Right Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => leftModal()),
                  backgroundColor: contentTheme.secondary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Left Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Dialog topModal() {
    return Dialog(
      insetPadding: MySpacing.fromLTRB(0, 0, 0, MediaQuery.of(context).size.height - 350),
      child: SizedBox(
        width: 300,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(padding: MySpacing.all(16), child: MyText.labelLarge('Top Modal', fontWeight: 700, muted: true)),
            const Divider(height: 0, thickness: 1),
            Padding(
              padding: MySpacing.all(12),
              child: MyText.bodySmall(controller.dummyTexts[4], maxLines: 6, overflow: TextOverflow.ellipsis),
            ),
            const Divider(height: 0),
            Padding(
              padding: MySpacing.xy(16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: theme.colorScheme.secondary.withAlpha(36),
                    child: MyText.bodySmall("Close", color: theme.colorScheme.secondary),
                  ),
                  MySpacing.width(16),
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: theme.colorScheme.primary,
                    child: MyText.bodySmall("Save", color: theme.colorScheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog bottomModal() {
    return Dialog(
      insetPadding: MySpacing.fromLTRB(0, MediaQuery.of(context).size.height - 350, 0, 0),
      child: SizedBox(
        width: 300,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(padding: MySpacing.all(16), child: MyText.labelLarge('Bottom Modal', fontWeight: 700, muted: true)),
            const Divider(height: 0, thickness: 1),
            Padding(
              padding: MySpacing.all(16),
              child: MyText.bodySmall(controller.dummyTexts[3], maxLines: 6, overflow: TextOverflow.ellipsis),
            ),
            const Divider(height: 0),
            Padding(
              padding: MySpacing.xy(16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: contentTheme.secondary.withAlpha(36),
                    child: MyText.bodySmall("Close", color: contentTheme.secondary),
                  ),
                  MySpacing.width(16),
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: theme.colorScheme.primary,
                    child: MyText.bodySmall("Save", color: theme.colorScheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog centerModal() {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            modalHeading("Center Modal"),
            Divider(height: 40),
            Padding(
              padding: MySpacing.nTop(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Text in Modal", fontWeight: 600),
                  MySpacing.height(20),
                  MyText.bodyMedium("Duis mollis, est non commodo luctus, nisi erat porttitor ligula.", fontWeight: 600, muted: true),
                  Divider(height: 40),
                  MyText.bodyMedium("Overflowing text to show scroll behavior", fontWeight: 600),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 3, fontWeight: 600, xMuted: true),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 4, fontWeight: 600, xMuted: true),
                  MySpacing.height(12),
                  MyText.bodyMedium(controller.dummyTexts[0], maxLines: 4, fontWeight: 600, xMuted: true),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.primary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog rightModal() {
    return Dialog(
      insetPadding: MySpacing.fromLTRB(MediaQuery.of(context).size.width - 350, 0, 0, 0),
      child: SizedBox(
        width: 300,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(padding: MySpacing.all(16), child: MyText.labelLarge('Right Modal', fontWeight: 700, muted: true)),
            const Divider(height: 0, thickness: 1),
            Padding(
              padding: MySpacing.all(16),
              child: MyText.bodySmall(controller.dummyTexts[2], maxLines: 6, overflow: TextOverflow.ellipsis),
            ),
            const Divider(height: 0, thickness: 1),
            Padding(
              padding: MySpacing.xy(16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: contentTheme.secondary.withAlpha(36),
                    child: MyText.bodySmall("Close", color: contentTheme.secondary),
                  ),
                  MySpacing.width(16),
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: contentTheme.primary,
                    child: MyText.bodySmall("Save", color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog leftModal() {
    return Dialog(
      insetPadding: MySpacing.fromLTRB(0, 0, MediaQuery.of(context).size.width - 350, 0),
      child: SizedBox(
        width: 300,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(padding: MySpacing.all(16), child: MyText.labelLarge('Left Modal', fontWeight: 700, muted: true)),
            const Divider(height: 0, thickness: 1),
            Padding(
              padding: MySpacing.all(16),
              child: MyText.bodySmall(controller.dummyTexts[5], maxLines: 6, overflow: TextOverflow.ellipsis),
            ),
            const Divider(height: 0, thickness: 1),
            Padding(
              padding: MySpacing.xy(16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: contentTheme.secondary.withAlpha(36),
                    child: MyText.bodySmall("Close", color: contentTheme.secondary),
                  ),
                  MySpacing.width(16),
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: contentTheme.primary,
                    child: MyText.bodySmall("Save", color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget staticBackDrop() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.bodyMedium("Static Modal", fontWeight: 700, muted: true)),

          Padding(
            padding: MySpacing.all(24),
            child: MyButton(
              onPressed: () => showDialog(context: context, barrierDismissible: false, builder: (BuildContext context) => staticModal()),
              backgroundColor: contentTheme.secondary.withAlpha(36),
              elevation: 0,
              padding: MySpacing.xy(12, 16),
              borderRadiusAll: 4,
              child: MyText.bodyMedium("Static", color: contentTheme.secondary, fontWeight: 600),
            ),
          ),
        ],
      ),
    );
  }

  Dialog staticModal() {
    return Dialog(
      child: SizedBox(
        width: 400,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                children: [
                  Expanded(child: MyText.labelLarge('Static Modal')),
                  InkWell(
                    onTap: () => Navigator.pop(context),
                    child: Icon(RemixIcons.close_line, size: 20, color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
                  ),
                ],
              ),
            ),
            const Divider(height: 0, thickness: 1),
            Padding(padding: MySpacing.all(16), child: MyText.bodySmall(controller.dummyTexts[0])),
            const Divider(height: 0, thickness: 1),
            Padding(
              padding: MySpacing.xy(12, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: contentTheme.secondary.withAlpha(36),
                    child: MyText.bodySmall("Close", color: contentTheme.secondary),
                  ),
                  MySpacing.width(16),
                  MyButton.rounded(
                    onPressed: () => Navigator.pop(context),
                    elevation: 0,
                    padding: MySpacing.xy(12, 8),
                    backgroundColor: contentTheme.primary,
                    child: MyText.bodySmall("Save", color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget coloredHeaderModal() {
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
            child: MyText.bodyMedium("Color Header Modal", fontWeight: 700, muted: true),
          ),

          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => primaryHeading()),
                  backgroundColor: contentTheme.primary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Primary Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => successHeader()),
                  backgroundColor: contentTheme.success,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Success Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => infoHeader()),
                  backgroundColor: contentTheme.info,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Info Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => warningHeader()),
                  backgroundColor: contentTheme.warning,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Warning Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => dangerHeader()),
                  backgroundColor: contentTheme.danger,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Danger Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget colorHeadingWidget(Color color) {
    return MyContainer(
      paddingAll: 12,
      borderRadiusAll: 0,
      color: color,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          MyText.titleMedium("Color Heading", fontWeight: 700, muted: true, color: contentTheme.onPrimary),
          InkWell(
            onTap: () => Get.back(),
            child: Icon(RemixIcons.close_line, color: contentTheme.onPrimary),
          ),
        ],
      ),
    );
  }

  Dialog primaryHeading() {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.primary),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Primary Background", fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.primary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog successHeader() {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.success),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Success Background", fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.success,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog infoHeader() {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.info),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Info Background", fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.info,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog warningHeader() {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.warning),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Warning Background", fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.warning,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog dangerHeader() {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.danger),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Danger Background", fontWeight: 600, muted: true),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.secondary.withAlpha(36),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer(
                    onTap: () => Get.back(),
                    color: contentTheme.danger,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget filledModal() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.bodyMedium("Filled Modal", fontWeight: 700, muted: true)),

          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => primaryFill()),
                  backgroundColor: contentTheme.primary,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Primary Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => successFill()),
                  backgroundColor: contentTheme.success,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Success Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => infoFill()),
                  backgroundColor: contentTheme.info,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Info Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => warningFill()),
                  backgroundColor: contentTheme.warning,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Warning Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
                MyButton(
                  onPressed: () => showDialog(context: context, builder: (BuildContext context) => dangerFill()),
                  backgroundColor: contentTheme.danger,
                  elevation: 0,
                  padding: MySpacing.xy(12, 16),
                  borderRadiusAll: 4,
                  child: MyText.bodySmall("Danger Modal", color: contentTheme.onPrimary, fontWeight: 600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Dialog primaryFill() {
    return Dialog(
      backgroundColor: contentTheme.primary,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.primary),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Primary Background", fontWeight: 600, muted: true, color: contentTheme.onPrimary),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600, color: contentTheme.onPrimary),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer.bordered(
                    onTap: () => Get.back(),
                    color: Colors.transparent,
                    borderColor: contentTheme.onPrimary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog successFill() {
    return Dialog(
      backgroundColor: contentTheme.success,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.success),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Success Background", fontWeight: 600, muted: true, color: contentTheme.onPrimary),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600, color: contentTheme.onPrimary),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer.bordered(
                    onTap: () => Get.back(),
                    color: Colors.transparent,
                    borderColor: contentTheme.onPrimary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog infoFill() {
    return Dialog(
      backgroundColor: contentTheme.info,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.info),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Info Background", fontWeight: 600, muted: true, color: contentTheme.onPrimary),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600, color: contentTheme.onPrimary),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer.bordered(
                    onTap: () => Get.back(),
                    color: Colors.transparent,
                    borderColor: contentTheme.onPrimary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog warningFill() {
    return Dialog(
      backgroundColor: contentTheme.warning,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.warning),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Warning Background", fontWeight: 600, muted: true, color: contentTheme.onPrimary),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600, color: contentTheme.onPrimary),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer.bordered(
                    onTap: () => Get.back(),
                    color: Colors.transparent,
                    borderColor: contentTheme.onPrimary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Dialog dangerFill() {
    return Dialog(
      backgroundColor: contentTheme.danger,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            colorHeadingWidget(contentTheme.danger),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.titleMedium("Danger Background", fontWeight: 600, muted: true, color: contentTheme.onPrimary),
                  MySpacing.height(20),
                  MyText.bodySmall(controller.dummyTexts[0], fontWeight: 600, color: contentTheme.onPrimary),
                ],
              ),
            ),
            Divider(height: 0),
            Padding(
              padding: MySpacing.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyContainer(
                    onTap: () => Get.back(),
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Close", fontWeight: 600, color: contentTheme.secondary),
                  ),
                  MySpacing.width(12),
                  MyContainer.bordered(
                    onTap: () => Get.back(),
                    color: Colors.transparent,
                    borderColor: contentTheme.onPrimary,
                    padding: MySpacing.xy(12, 8),
                    child: MyText.bodySmall("Save Changes", fontWeight: 600, color: contentTheme.onPrimary),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SignUpModal extends StatefulWidget {
  const SignUpModal({super.key});

  @override
  State<SignUpModal> createState() => _SignUpModalState();
}

class _SignUpModalState extends State<SignUpModal> with UIMixin {
  bool isCheckAccept = false;

  void onCheckBoxAccept() {
    setState(() {
      isCheckAccept = !isCheckAccept;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Padding(padding: MySpacing.top(20), child: Image.asset('assets/images/dummy/logo-dark.png', height: 28)),
            ),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.bodyMedium("Name", fontWeight: 600),
                  MySpacing.height(12),
                  TextField(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide()),
                      hintText: "Michael Zanaty",
                      contentPadding: MySpacing.all(12),
                    ),
                  ),
                  MySpacing.height(20),
                  MyText.bodyMedium("Email Address", fontWeight: 600),
                  MySpacing.height(12),
                  TextField(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide()),
                      hintText: "john@deo.com",
                      contentPadding: MySpacing.all(12),
                    ),
                  ),
                  MySpacing.height(20),
                  MyText.bodyMedium("Password", fontWeight: 600),
                  MySpacing.height(12),
                  TextField(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide()),
                      hintText: "Enter your password",
                      contentPadding: MySpacing.all(12),
                    ),
                  ),
                  MySpacing.height(20),
                  Row(
                    children: [
                      Theme(
                        data: ThemeData(),
                        child: Checkbox(value: isCheckAccept, onChanged: (value) => onCheckBoxAccept()),
                      ),
                      MySpacing.width(4),
                      RichText(
                        text: TextSpan(
                          children: [
                            TextSpan(text: "I accept "),
                            TextSpan(
                              text: "Term and condition",
                              style: MyTextStyle.bodyMedium(color: contentTheme.primary, fontWeight: 600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  MySpacing.height(20),
                  Center(
                    child: MyContainer(
                      onTap: () {},
                      padding: MySpacing.xy(12, 8),
                      color: contentTheme.primary,
                      child: MyText.bodyMedium("Sign up free", fontWeight: 600, color: contentTheme.onPrimary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class LoginModal extends StatefulWidget {
  const LoginModal({super.key});

  @override
  State<LoginModal> createState() => _LoginModalState();
}

class _LoginModalState extends State<LoginModal> with UIMixin {
  bool isRemember = false;

  void onRemember() {
    setState(() {
      isRemember = !isRemember;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: 450, minWidth: 250),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Padding(padding: MySpacing.top(20), child: Image.asset('assets/images/dummy/logo-dark.png', height: 28)),
            ),
            Padding(
              padding: MySpacing.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.bodyMedium("Email Address", fontWeight: 600),
                  MySpacing.height(12),
                  TextField(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide()),
                      hintText: "john@deo.com",
                      contentPadding: MySpacing.all(12),
                    ),
                  ),
                  MySpacing.height(20),
                  MyText.bodyMedium("Password", fontWeight: 600),
                  MySpacing.height(12),
                  TextField(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(4), borderSide: BorderSide()),
                      hintText: "Enter your password",
                      contentPadding: MySpacing.all(12),
                    ),
                  ),
                  MySpacing.height(20),
                  Row(
                    children: [
                      Theme(
                        data: ThemeData(),
                        child: Checkbox(value: isRemember, onChanged: (value) => onRemember()),
                      ),
                      MySpacing.width(4),
                      MyText.bodyMedium("Remember me", fontWeight: 600),
                    ],
                  ),
                  MySpacing.height(20),
                  Center(
                    child: MyContainer(
                      onTap: () {},
                      padding: MySpacing.xy(12, 8),
                      color: contentTheme.primary,
                      child: MyText.bodyMedium("Sign in", fontWeight: 600, color: contentTheme.onPrimary),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

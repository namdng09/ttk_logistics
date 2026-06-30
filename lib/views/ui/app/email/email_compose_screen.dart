import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/app/email/email_compose_controller.dart';
import 'package:kho555/helper/theme/app_theme.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_button.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_progress_bar.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class EmailComposeScreen extends StatefulWidget {
  const EmailComposeScreen({super.key});

  @override
  State<EmailComposeScreen> createState() => _EmailComposeScreenState();
}

class _EmailComposeScreenState extends State<EmailComposeScreen> with UIMixin {
  late EmailComposeController controller;

  @override
  void initState() {
    controller = Get.put(EmailComposeController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Compose',
          mainScreenName: 'Email',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-2.5 md-5', child: emailCompose()),
              MyFlexItem(sizes: 'lg-9.5 md-7', child: composeDetails()),
            ],
          ),
        );
      },
    );
  }

  Widget emailCompose() {
    Widget emailLabelWidget(IconData icon, String title) {
      return InkWell(
        onTap: () {},
        child: Row(children: [Icon(icon, size: 16), MySpacing.width(12), MyText.bodySmall(title, fontWeight: 600, muted: true)]),
      );
    }

    Widget labelWidget(String text, Color color) {
      return InkWell(
        onTap: () {},
        child: Row(
          children: [
            MyContainer.rounded(paddingAll: 6, color: color),
            MySpacing.width(12),
            MyText.bodySmall(text, fontWeight: 600, muted: true),
          ],
        ),
      );
    }

    Widget composeBTN() {
      return MyButton.block(
        backgroundColor: contentTheme.danger,
        elevation: 0,
        padding: MySpacing.all(20),
        onPressed: () => {},
        child: MyText.bodyMedium("Compose", color: contentTheme.onDanger),
      );
    }

    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      height: 800,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          composeBTN(),
          MySpacing.height(20),
          emailLabelWidget(Remix.inbox_line, "Inbox"),
          MySpacing.height(20),
          emailLabelWidget(Remix.star_line, "Starred"),
          MySpacing.height(20),
          emailLabelWidget(Remix.article_line, "Draft"),
          MySpacing.height(20),
          emailLabelWidget(Remix.mail_send_line, "Sent Mail"),
          MySpacing.height(20),
          emailLabelWidget(Remix.delete_bin_line, "Trash"),
          MySpacing.height(20),
          emailLabelWidget(Remix.price_tag_3_line, "Important"),
          MySpacing.height(20),
          emailLabelWidget(Remix.alert_line, "Spam"),
          MySpacing.height(20),
          MyText.bodyMedium("Labels", fontWeight: 600),
          MySpacing.height(20),
          labelWidget('Updates', Colors.blue),
          MySpacing.height(20),
          labelWidget('Friends', Colors.orange),
          MySpacing.height(20),
          labelWidget('Family', Colors.green),
          MySpacing.height(20),
          labelWidget('Social', Colors.blueAccent),
          MySpacing.height(20),
          labelWidget('Important', Colors.red),
          MySpacing.height(20),
          labelWidget('Promotions', Colors.grey),
          Spacer(),
          MyText.bodySmall("STORAGE", fontWeight: 600),
          MySpacing.height(12),
          MyProgressBar(width: 300, progress: 0.35, height: 5, radius: 4, inactiveColor: theme.dividerColor, activeColor: contentTheme.success),
          MySpacing.height(14),
          RichText(
            text: TextSpan(
              children: [
                TextSpan(text: '7.02 GB ', style: MyTextStyle.bodyMedium(fontWeight: 600)),
                TextSpan(text: '(46%) of  ', style: MyTextStyle.bodyMedium()),
                TextSpan(text: '15 GB', style: MyTextStyle.bodyMedium(fontWeight: 600)),
                TextSpan(text: ' used', style: MyTextStyle.bodyMedium()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget composeDetails() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            style: MyTextStyle.bodyMedium(),
            decoration: InputDecoration(
              hintText: 'To',
              hintStyle: MyTextStyle.bodyMedium(),
              isDense: true,
              isCollapsed: true,
              contentPadding: MySpacing.all(14),
              border: OutlineInputBorder(),
            ),
          ),
          MySpacing.height(16),
          TextFormField(
            style: MyTextStyle.bodyMedium(),
            decoration: InputDecoration(
              hintText: 'Subject',
              hintStyle: MyTextStyle.bodyMedium(),
              isDense: true,
              isCollapsed: true,
              contentPadding: MySpacing.all(14),
              border: OutlineInputBorder(),
            ),
          ),
          MySpacing.height(16),
          MyContainer.bordered(
            child: Column(
              children: [
                QuillSimpleToolbar(controller: controller.quillController, config: QuillSimpleToolbarConfig()),
                SizedBox(
                  height: 200,
                  child: QuillEditor.basic(controller: controller.quillController, config: QuillEditorConfig(showCursor: true, expands: false)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

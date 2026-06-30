import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/app/email/inbox_controller.dart';
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
import 'package:kho555/helper/widgets/responsive.dart';
import 'package:kho555/models/email_model.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> with UIMixin {
  late InboxController controller;

  @override
  void initState() {
    controller = Get.put(InboxController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Layout(
      subScreenName: 'Inbox',
      mainScreenName: 'Email',
      child: GetBuilder(
        init: controller,
        tag: 'inbox_controller',
        builder: (controller) {
          return Padding(
            padding: MySpacing.x(flexSpacing / 2),
            child: MyFlex(
              children: [
                MyFlexItem(sizes: 'lg-2.5 md-5', child: emailCompose()),
                MyFlexItem(sizes: 'lg-9.5 md-7', child: emailListing()),
              ],
            ),
          );
        },
      ),
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
        onPressed: (){},
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

  Widget emailListing() {
    Widget listingHeader() {
      return Wrap(
        spacing: 20,
        runSpacing: 20,
        children: [
          MyContainer(
            paddingAll: 12,
            color: contentTheme.primary,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Remix.inbox_archive_line, size: 18, color: contentTheme.onSecondary),
                MySpacing.width(20),
                Icon(Remix.spam_2_line, size: 18, color: contentTheme.onSecondary),
                MySpacing.width(20),
                Icon(Remix.delete_bin_line, size: 18, color: contentTheme.onSecondary),
              ],
            ),
          ),
          PopupMenuButton(
            offset: Offset(0, 44),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            shape: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            itemBuilder: (BuildContext context) => [
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Social", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Promotion", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Updates", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Forums", fontWeight: 600)),
            ],
            child: MyContainer(
              color: contentTheme.primary,
              paddingAll: 12,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Remix.folder_2_line, size: 18, color: contentTheme.onSecondary),
                  MySpacing.width(4),
                  Icon(RemixIcons.arrow_down_s_line, size: 18, color: contentTheme.onSecondary),
                ],
              ),
            ),
          ),
          PopupMenuButton(
            offset: Offset(0, 44),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            shape: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            itemBuilder: (BuildContext context) => [
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Updates", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Social", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Promotion", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Forums", fontWeight: 600)),
            ],
            child: MyContainer(
              color: contentTheme.primary,
              paddingAll: 12,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Remix.price_tag_3_line, size: 18, color: contentTheme.onSecondary),
                  MySpacing.width(4),
                  Icon(RemixIcons.arrow_down_s_line, size: 18, color: contentTheme.onSecondary),
                ],
              ),
            ),
          ),
          PopupMenuButton(
            offset: Offset(0, 44),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            shape: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            itemBuilder: (BuildContext context) => [
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Mark as unread", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Add to task", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Add star", fontWeight: 600)),
              PopupMenuItem(padding: MySpacing.xy(16, 8), height: 10, child: MyText.bodyMedium("Mute", fontWeight: 600)),
            ],
            child: MyContainer(
              color: contentTheme.primary,
              paddingAll: 12,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Remix.more_line, size: 18, color: contentTheme.onSecondary),
                  MySpacing.width(4),
                  MyText.bodyMedium("More", fontWeight: 600, color: contentTheme.onSecondary),
                  MySpacing.width(4),
                  Icon(RemixIcons.arrow_down_s_line, size: 18, color: contentTheme.onSecondary),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return MyCard(
      shadow: MyShadow(elevation: .7, position: MyShadowPosition.bottom),
      height: 800,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(padding: MySpacing.all(24), child: listingHeader()),
          Expanded(
            child: ListView.separated(
              padding: MySpacing.nTop(20),
              shrinkWrap: true,
              itemCount: controller.emails.length,
              itemBuilder: (context, index) {
                EmailModel mail = controller.emails[index];
                return InkWell(
                  onTap: controller.gotoDetailScreen,
                  child: Row(
                    children: [
                      Theme(
                        data: ThemeData(unselectedWidgetColor: Colors.white),
                        child: Checkbox(
                          value: mail.isCheckMail,
                          activeColor: contentTheme.primary,
                          onChanged: (value) => controller.onCheckMail(mail),
                        ),
                      ),
                      MySpacing.width(20),
                      SizedBox(width: 200, child: MyText.bodySmall(mail.subject, fontWeight: 600, maxLines: 1, xMuted: mail.seen)),
                      MySpacing.width(20),
                      Expanded(child: MyText.bodySmall(mail.details, fontWeight: 600, maxLines: 1, xMuted: mail.seen)),
                      MySpacing.width(20),
                      MyText.bodyMedium(mail.date, fontWeight: 600, maxLines: 1, xMuted: mail.seen),
                    ],
                  ),
                );
              },
              separatorBuilder: (context, index) {
                return SizedBox(height: 20);
              },
            ),
          ),
        ],
      ),
    );
  }
}

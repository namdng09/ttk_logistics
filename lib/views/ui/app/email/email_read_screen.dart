import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/app/email/email_read_controller.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_button.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_progress_bar.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';
import 'package:ttk_logistics/helper/widgets/responsive.dart';
import 'package:ttk_logistics/images.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class EmailReadScreen extends StatefulWidget {
  const EmailReadScreen({super.key});

  @override
  State<EmailReadScreen> createState() => _EmailReadScreenState();
}

class _EmailReadScreenState extends State<EmailReadScreen> with UIMixin {
  late EmailReadController controller;

  @override
  void initState() {
    controller = Get.put(EmailReadController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Layout(
      subScreenName: 'Read',
      mainScreenName: 'Email',
      child: GetBuilder(
        init: controller,
        tag: 'read_email_controller',
        builder: (controller) {
          return MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-2.5 md-5', child: emailCompose()),
              MyFlexItem(sizes: 'lg-9.5 md-7', child: emailDetail()),
            ],
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

  Widget emailDetail() {
    Widget listingHeader() {
      return Wrap(
        spacing: 20,
        runSpacing: 20,
        children: [
          MyContainer(
            paddingAll: 12,
            color: contentTheme.secondary,
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
              color: contentTheme.secondary,
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
              color: contentTheme.secondary,
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
              color: contentTheme.secondary,
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
     shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          listingHeader(),
          MySpacing.height(20),
          MyText.titleMedium("Your elite author Graphic Optimization reward is ready!", fontWeight: 600),
          Divider(height: 40),
          Row(
            children: [
              MyContainer.rounded(
                height: 36,
                width: 36,
                paddingAll: 0,
                clipBehavior: Clip.antiAliasWithSaveLayer,
                child: Image.asset(Images.users[1], fit: BoxFit.cover),
              ),
              MySpacing.width(12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [MyText.titleMedium("Steven Smith", fontWeight: 600), MyText.bodySmall("From: jonathan@domain.com", muted: true)],
                ),
              ),
              MyText.bodySmall("April 24, 2023, 10:59 PM", fontWeight: 600, xMuted: true),
            ],
          ),
          MySpacing.height(20),
          MyText.bodyMedium("Hi", fontWeight: 600, muted: true),
          MySpacing.height(20),
          MyText.bodySmall(
            "Clicking ‘Order Service’ on the right-hand side of the above page will present you with an order page. This service has the following Briefing Guidelines that will need to be filled before placing your order:",
            fontWeight: 600,
            muted: true,
            overflow: TextOverflow.ellipsis,
          ),
          MySpacing.height(20),
          Padding(
            padding: MySpacing.x(flexSpacing),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyText.bodyMedium(
                  "1. Your design preferences (Color, style, shapes, Fonts, others)",
                  fontWeight: 600,
                  xMuted: true,
                  overflow: TextOverflow.ellipsis,
                ),
                MySpacing.height(8),
                MyText.bodyMedium("2. Tell me, why is your item different?", fontWeight: 600, xMuted: true, overflow: TextOverflow.ellipsis),
                MySpacing.height(8),
                MyText.bodyMedium(
                  "3. Do you want to bring up a specific feature of your item? If yes, please tell me",
                  fontWeight: 600,
                  xMuted: true,
                  overflow: TextOverflow.ellipsis,
                ),
                MySpacing.height(8),
                MyText.bodyMedium(
                  "4. Do you have any preference or specific thing you would like to change or improve on your item page?",
                  fontWeight: 600,
                  xMuted: true,
                  overflow: TextOverflow.ellipsis,
                ),
                MySpacing.height(8),
                MyText.bodyMedium(
                  "5. Do you want to include your item's or your provider's logo on the page? if yes, please send it to me in vector format (Ai or EPS)",
                  fontWeight: 600,
                  xMuted: true,
                  overflow: TextOverflow.ellipsis,
                ),
                MySpacing.height(8),
                MyText.bodyMedium(
                  "6. Please provide me with the copy or text to display",
                  fontWeight: 600,
                  xMuted: true,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          MySpacing.height(20),
          MyText.bodyMedium(
            "Filling in this form with the above information will ensure that they will be able to start work quickly.",
            fontWeight: 600,
            xMuted: true,
            overflow: TextOverflow.ellipsis,
          ),
          MySpacing.height(20),
          MyText.bodyMedium(
            "You can complete your order by putting your coupon code into the Promotional code box and clicking ‘Apply Coupon’.",
            fontWeight: 600,
            xMuted: true,
            overflow: TextOverflow.ellipsis,
          ),
          MySpacing.height(20),
          MyText.bodyMedium("Best,", fontWeight: 600),
          MySpacing.height(8),
          MyText.bodyMedium("Graphic Studio", muted: true),
          Divider(height: 40),
          MyText.titleMedium("Attachments", fontWeight: 600, muted: true),
          MySpacing.height(20),
          Wrap(
            spacing: 20,
            runSpacing: 20,
            children: [
              MyContainer.bordered(
                onTap: () {},
                paddingAll: 12,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    MyContainer(
                      paddingAll: 0,
                      height: 44,
                      width: 44,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      color: contentTheme.primary.withAlpha(30),
                      child: Center(child: MyText.bodySmall(".ZIP", fontWeight: 600, color: contentTheme.primary)),
                    ),
                    MySpacing.width(20),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyText.bodyMedium("admin-design.zip", fontWeight: 600, muted: true),
                        MySpacing.height(6),
                        MyText.bodySmall("2.3 MB", xMuted: true),
                      ],
                    ),
                    MySpacing.width(20),
                    Icon(Remix.download_2_line, color: contentTheme.secondary, size: 18),
                  ],
                ),
              ),
              MyContainer.bordered(
                paddingAll: 12,
                onTap: () {},
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    MyContainer(
                      paddingAll: 0,
                      height: 44,
                      width: 44,
                      borderRadiusAll: 4,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      color: contentTheme.primary.withAlpha(30),
                      child: Image.asset(Images.small[3], fit: BoxFit.cover),
                    ),
                    MySpacing.width(20),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyText.bodyMedium("Dashboard-design.jpg", fontWeight: 600, muted: true),
                        MySpacing.height(6),
                        MyText.bodySmall("3.25 MB", xMuted: true),
                      ],
                    ),
                    MySpacing.width(20),
                    Icon(Remix.download_2_line, color: contentTheme.secondary, size: 18),
                  ],
                ),
              ),
              MyContainer.bordered(
                paddingAll: 12,
                onTap: () {},
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    MyContainer(
                      paddingAll: 0,
                      height: 44,
                      width: 44,
                      clipBehavior: Clip.antiAliasWithSaveLayer,
                      color: contentTheme.secondary,
                      child: Center(child: MyText.bodySmall(".MP4", fontWeight: 600, color: contentTheme.onSecondary)),
                    ),
                    MySpacing.width(20),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyText.bodyMedium("Admin-bug-report.mp4", fontWeight: 600, muted: true),
                        MySpacing.height(6),
                        MyText.bodySmall("7.5 MB", xMuted: true),
                      ],
                    ),
                    MySpacing.width(20),
                    Icon(Remix.download_2_line, color: contentTheme.secondary, size: 18),
                  ],
                ),
              ),
            ],
          ),
          MySpacing.height(36),
          Row(
            children: [
              MyContainer(
                onTap: () {},
                paddingAll: 12,
                color: contentTheme.secondary,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Remix.reply_line, color: contentTheme.onSecondary, size: 18),
                    MySpacing.width(4),
                    MyText.bodyMedium("Reply", fontWeight: 600, color: contentTheme.onSecondary),
                  ],
                ),
              ),
              MySpacing.width(20),
              MyContainer(
                onTap: () {},
                paddingAll: 12,
                color: contentTheme.secondary.withAlpha(30),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    MyText.bodyMedium("Forward", fontWeight: 600, color: contentTheme.secondary),
                    MySpacing.width(4),
                    Icon(Remix.share_forward_2_fill, color: contentTheme.secondary, size: 18),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

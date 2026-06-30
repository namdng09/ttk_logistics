import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/ui/chat_controller.dart';
import 'package:kho555/helper/theme/app_theme.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/utils/utils.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/images.dart';
import 'package:kho555/models/chat_model.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

import '../../helper/widgets/my_flex_item.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with UIMixin {
  late ChatController controller;

  @override
  void initState() {
    controller = Get.put(ChatController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Chat',
          mainScreenName: 'Dashboard',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-3', child: userIndex()),
              MyFlexItem(sizes: 'lg-8.98', child: messages()),
            ],
          ),
        );
      },
    );
  }

  Widget userIndex() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      height: 800,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextFormField(
            style: MyTextStyle.bodyMedium(),
            onChanged: controller.onSearchChat,
            controller: controller.searchController,
            decoration: InputDecoration(
              hintText: "Search...",
              hintStyle: MyTextStyle.bodyMedium(),
              border: OutlineInputBorder(borderSide: BorderSide(color: contentTheme.secondary.withValues(alpha: 0.2))),
              focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: contentTheme.secondary.withValues(alpha: 0.2))),
              errorBorder: OutlineInputBorder(borderSide: BorderSide(color: contentTheme.secondary.withValues(alpha: 0.2))),
              enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: contentTheme.secondary.withValues(alpha: 0.2))),
              disabledBorder: OutlineInputBorder(borderSide: BorderSide(color: contentTheme.secondary.withValues(alpha: 0.2))),
              focusedErrorBorder: OutlineInputBorder(borderSide: BorderSide(color: contentTheme.secondary.withValues(alpha: 0.2))),
              isCollapsed: true,
              isDense: true,
              prefixIcon: Icon(RemixIcons.search_line, size: 14),
              contentPadding: MySpacing.all(12),
            ),
          ),
          MySpacing.height(12),
          inboxTab(),
          MySpacing.height(12),
          if (controller.currentIndex == 0) chatUserList(),
          if (controller.currentIndex == 1) groupView(),
          if (controller.currentIndex == 2) userContacts(),
        ],
      ),
    );
  }

  Widget inboxTab() {
    final tabs = [
      {'label': 'Chat', 'icon': RemixIcons.message_2_line},
      {'label': 'Group', 'icon': RemixIcons.group_line},
      {'label': 'Contact', 'icon': RemixIcons.contacts_book_2_line},
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: List.generate(tabs.length, (index) {
        final isSelected = controller.currentIndex == index;
        final tab = tabs[index];

        return Expanded(
          child: MyContainer(
            onTap: () => controller.onChangeIndex(index),
            color: isSelected ? contentTheme.primary : null,
            borderRadiusAll: 4,
            paddingAll: 12,
            child: Center(
              child: MyText.bodyMedium(tab['label'] as String, fontWeight: 600, color: isSelected ? contentTheme.onPrimary : contentTheme.secondary),
            ),
          ),
        );
      }),
    );
  }

  Widget chatUserList() {
    return Expanded(
      child: controller.searchChat.isEmpty
          ? Center(child: MyText.bodyMedium("Not User Found", fontWeight: 600))
          : ListView.separated(
              shrinkWrap: true,
              clipBehavior: Clip.antiAliasWithSaveLayer,
              itemCount: controller.searchChat.length,
              itemBuilder: (context, index) {
                ChatModel chat = controller.chat[index];
                String name = chat.firstName;

                List<TextSpan> textSpans = _highlightText(name, controller.searchController.text);

                return MyContainer.bordered(
                  onTap: () => controller.onChangeChat(chat),
                  borderRadiusAll: 4,
                  padding: MySpacing.all(12),
                  color: theme.colorScheme.surface.withAlpha(5),
                  splashColor: theme.colorScheme.onSurface.withAlpha(10),
                  child: Row(
                    children: [
                      MyContainer.rounded(paddingAll: 3, color: contentTheme.success),
                      MySpacing.width(12),
                      MyContainer.rounded(paddingAll: 0, height: 32, width: 32, child: Image.asset(chat.image)),
                      MySpacing.width(12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: RichText(
                                    text: TextSpan(style: MyTextStyle.bodyMedium(), children: textSpans),
                                  ),
                                ),
                                MyText.bodySmall(
                                  Utils.getTimeStringFromDateTime(chat.timestamp, showSecond: false),
                                  fontWeight: 600,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  muted: true,
                                ),
                              ],
                            ),
                            MySpacing.height(6),
                            MyText.bodySmall(chat.messages.lastOrNull!.message, overflow: TextOverflow.ellipsis, muted: true),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
              separatorBuilder: (context, index) => SizedBox(height: 22),
            ),
    );
  }

  List<TextSpan> _highlightText(String text, String searchQuery) {
    if (searchQuery.isEmpty) return [TextSpan(text: text)];

    final regex = RegExp(RegExp.escape(searchQuery), caseSensitive: false);
    final List<TextSpan> textSpans = [];
    int start = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > start) {
        textSpans.add(TextSpan(text: text.substring(start, match.start)));
      }
      textSpans.add(
        TextSpan(
          text: text.substring(match.start, match.end),
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blue), // Highlight style
        ),
      );
      start = match.end;
    }

    if (start < text.length) {
      textSpans.add(TextSpan(text: text.substring(start)));
    }

    return textSpans;
  }

  Widget groupView() {
    return Expanded(
      child: ListView(
        children: [
          Row(children: [MyText.bodyMedium("Group", fontWeight: 600)]),
          MySpacing.height(12),
          ListView.separated(
            itemCount: controller.group.length,
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) {
              Groups currentGroup = controller.group[index];

              return MyContainer.bordered(
                paddingAll: 12,
                borderRadiusAll: 4,
                child: Row(
                  children: [
                    MyContainer.rounded(paddingAll: 3, color: contentTheme.success),
                    MySpacing.width(12),
                    MyContainer.rounded(
                      height: 32,
                      width: 32,
                      color: contentTheme.secondary.withValues(alpha: 0.2),
                      paddingAll: 0,
                      child: Center(
                        child: MyText.titleMedium(
                          currentGroup.name != null && currentGroup.name!.isNotEmpty ? currentGroup.name![0] : "G",
                          fontWeight: 700,
                          color: contentTheme.secondary,
                        ),
                      ),
                    ),
                    MySpacing.width(16),
                    MyText.bodyMedium("#${currentGroup.name}", fontWeight: 600),
                    Spacer(),
                    if (currentGroup.badge != null && currentGroup.badge! > 0)
                      MyContainer.bordered(
                        borderColor: contentTheme.danger,
                        paddingAll: 4,
                        child: MyText.bodySmall("+${currentGroup.badge} ", fontWeight: 700, color: contentTheme.danger),
                      ),
                  ],
                ),
              );
            },
            separatorBuilder: (context, index) {
              return SizedBox(height: 24);
            },
          ),
        ],
      ),
    );
  }

  Widget userContacts() {
    Widget buildUserRow(String avatarPath, String name, String status) {
      return MyContainer.bordered(
        paddingAll: 12,
        borderRadiusAll: 4,
        child: ListTile(
          contentPadding: EdgeInsets.all(0),
          leading: CircleAvatar(backgroundImage: AssetImage(avatarPath), radius: 18),
          title: Text(name, style: TextStyle(fontSize: 14)),
          subtitle: status.isNotEmpty ? Text(status, style: TextStyle(color: Colors.grey, fontSize: 12)) : null,
          onTap: () {},
        ),
      );
    }

    return Expanded(
      child: ListView(
        children: [
          InkWell(
            onTap: () {},
            child: Row(children: [MyText.bodyMedium("Contact", fontWeight: 600)]),
          ),
          MySpacing.height(12),
          buildUserRow(Images.users[0], 'Gaston Lapierre', ''),
          MySpacing.height(12),
          buildUserRow(Images.users[1], 'Fantina LeBatelier', '** no status **'),
          MySpacing.height(12),
          buildUserRow(Images.users[2], 'Gilbert Chicoine', '|| Karma ||'),
          MySpacing.height(12),
          buildUserRow(Images.users[3], 'Mignonette Brodeur', 'Hey there! I am using Chat.'),
          MySpacing.height(12),
          buildUserRow(Images.users[4], 'Thomas Menard', 'TM'),
          MySpacing.height(12),
          buildUserRow(Images.users[5], 'Melisande Lapointe', 'Available'),
          MySpacing.height(12),
          buildUserRow(Images.users[6], 'Danielle Despins', 'Hey there! I am using Chat.'),
        ],
      ),
    );
  }

  Widget messages() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      paddingAll: 0,
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      height: 800,
      child: Column(
        children: [
          userDetail(),
          Divider(height: 0),
          Expanded(
            child: ListView.separated(
              padding: MySpacing.xy(16, 12),
              shrinkWrap: true,
              controller: controller.scrollController,
              itemCount: (controller.selectChat?.messages ?? []).length,
              itemBuilder: (context, index) {
                final message = (controller.selectChat?.messages ?? [])[index];
                final isSent = message.fromMe == true;
                final theme = isSent ? contentTheme.secondary : contentTheme.primary;
                return Row(
                  mainAxisAlignment: isSent ? MainAxisAlignment.end : MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Wrap(
                        alignment: isSent ? WrapAlignment.end : WrapAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              !isSent
                                  ? MyContainer.rounded(
                                      height: 36,
                                      width: 36,
                                      paddingAll: 0,
                                      clipBehavior: Clip.antiAliasWithSaveLayer,
                                      child: Image.asset(controller.selectChat!.image, fit: BoxFit.cover),
                                    )
                                  : SizedBox(),
                              MySpacing.width(12),
                              Expanded(
                                child: Align(
                                  alignment: isSent ? Alignment.centerRight : Alignment.centerLeft,
                                  child: MyContainer(
                                    padding: EdgeInsets.all(12),
                                    margin: EdgeInsets.only(
                                      left: isSent ? MediaQuery.of(context).size.width * 0.20 : 0,
                                      right: isSent ? 0 : MediaQuery.of(context).size.width * 0.20,
                                    ),
                                    color: theme.withValues(alpha: 0.1),
                                    child: Column(
                                      crossAxisAlignment: isSent ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        MyText.bodyMedium(
                                          !isSent ? controller.selectChat!.firstName : "Henry Wells",
                                          fontWeight: 600,
                                          color: contentTheme.primary,
                                        ),
                                        MySpacing.height(4),
                                        MyText.bodyMedium(message.message, color: contentTheme.secondary, overflow: TextOverflow.clip),
                                        MySpacing.height(4),
                                        MyText.labelSmall(
                                          Utils.getTimeStringFromDateTime(message.sendAt, showSecond: false),
                                          fontSize: 9,
                                          muted: true,
                                          fontWeight: 600,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              MySpacing.width(12),
                              isSent
                                  ? MyContainer.rounded(
                                      height: 36,
                                      width: 36,
                                      paddingAll: 0,
                                      clipBehavior: Clip.antiAliasWithSaveLayer,
                                      child: Image.asset(Images.users[2], fit: BoxFit.cover),
                                    )
                                  : SizedBox(),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
              separatorBuilder: (context, index) {
                return MySpacing.height(12);
              },
            ),
          ),
          Padding(padding: MySpacing.all(20), child: sendMessage()),
        ],
      ),
    );
  }

  Widget userDetail() {
    return Padding(
      padding: MySpacing.all(20),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (controller.selectChat != null) MyText.bodyMedium(controller.selectChat!.firstName, fontWeight: 600),
              if (!controller.isTyping)
                Row(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    MyContainer.rounded(paddingAll: 4, color: Colors.green),
                    MySpacing.width(4),
                    MyText.bodySmall("Active Now", fontWeight: 600, muted: true),
                  ],
                ),
              if (controller.isTyping) MyText.bodySmall("Typing...", fontWeight: 600),
            ],
          ),
          Spacer(),
          Flexible(
            flex: 1,
            child: TextFormField(
              style: MyTextStyle.bodyMedium(),
              decoration: InputDecoration(
                hintText: "Search...",
                hintStyle: MyTextStyle.bodyMedium(),
                border: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                focusedBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                errorBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                disabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                focusedErrorBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.grey)),
                isCollapsed: true,
                isDense: true,
                prefixIcon: Icon(RemixIcons.search_line, size: 14),
                contentPadding: MySpacing.all(14.4),
              ),
            ),
          ),
          MySpacing.width(12),
          Icon(RemixIcons.settings_line, size: 22, color: contentTheme.secondary),
          MySpacing.width(12),
          Icon(RemixIcons.more_line, size: 22, color: contentTheme.secondary),
        ],
      ),
    );
  }

  Widget sendMessage() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Expanded(
          child: MyContainer(
            paddingAll: 0,
            child: TextFormField(
              controller: controller.messageController,
              maxLines: 1,
              minLines: 1,
              textInputAction: TextInputAction.go,
              onChanged: (value) => controller.onTyping(),
              onFieldSubmitted: (value) {
                if (value.trim().isNotEmpty) controller.sendMessage();
              },
              clipBehavior: Clip.antiAliasWithSaveLayer,
              style: MyTextStyle.bodyMedium(fontWeight: 600, color: contentTheme.secondary),
              decoration: InputDecoration(
                isDense: true,
                filled: true,
                contentPadding: MySpacing.xy(12, 14),
                hintText: "Enter your message",
                hintStyle: MyTextStyle.bodyMedium(fontWeight: 600, color: contentTheme.secondary),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(100), borderSide: BorderSide.none),
              ),
            ),
          ),
        ),
        MySpacing.width(12),
        MyContainer(
          padding: MySpacing.xy(12, 8),
          borderRadiusAll: 100,
          onTap: () {
            if (controller.messageController.text.trim().isNotEmpty) controller.sendMessage();
          },
          color: contentTheme.primary,
          child: Row(
            children: [
              MyText.bodyMedium("Send", color: contentTheme.light),
              MySpacing.width(12),
              Icon(RemixIcons.send_plane_line, size: 16, color: contentTheme.onPrimary),
            ],
          ),
        ),
      ],
    );
  }
}

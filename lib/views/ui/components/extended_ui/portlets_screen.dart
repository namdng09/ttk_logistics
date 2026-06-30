import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:remixicon/remixicon.dart';

import 'package:kho555/controller/ui/components/extended_ui/portlets_controller.dart';
import 'package:kho555/helper/theme/app_theme.dart';

import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_utils.dart';
import 'package:kho555/views/layout/layout.dart';

class PortletsScreen extends StatefulWidget {
  const PortletsScreen({super.key});

  @override
  State<PortletsScreen> createState() => _PortletsScreenState();
}

class _PortletsScreenState extends State<PortletsScreen> with UIMixin {
  PortletsController controller = Get.put(PortletsController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'portlets_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Portlets',
          mainScreenName: 'Advanced UI',
          child: MyFlex(
            children: [
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.disabled, cardTitle: "Default Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.primary, cardTitle: "Primary Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.info, cardTitle: "Info Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.success, cardTitle: "Success Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.warning, cardTitle: "Warning Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.danger, cardTitle: "Danger Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.dark, cardTitle: "Dark Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.pink, cardTitle: "Pink Heading"),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: CustomCardPortlets(color: contentTheme.purple, cardTitle: "Purple Heading"),
              ),
            ],
          ),
        );
      },
    );
  }
}

class CustomCardPortlets extends StatefulWidget {
  const CustomCardPortlets({super.key, required this.color, required this.cardTitle});
  final Color color;
  final String cardTitle;

  @override
  State<CustomCardPortlets> createState() => _CustomCardPortletsState();
}

class _CustomCardPortletsState extends State<CustomCardPortlets> with UIMixin {
  List<String> dummyTexts = List.generate(12, (index) => MyTextUtils.getDummyText(60));
  bool isMinimize = false;

  bool isClose = false;

  bool isLoading = false;

  void onMinimizeToggle() {
    setState(() {
      isMinimize = !isMinimize;
    });
  }

  void onCloseToggle() {
    setState(() {
      isClose = !isClose;
    });
  }

  Future<void> onLoadingToggle() async {
    setState(() {
      isLoading = true;
    });
    await Future.delayed(Duration(seconds: 2));
    setState(() {
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    Color? contentColor = widget.cardTitle == "Default Heading" ? null : contentTheme.light;
    if (isClose) {
      return SizedBox();
    } else {
      return MyCard(
        paddingAll: 0,
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            MyContainer(
              color: widget.color,
              borderRadiusAll: 0,
              child: Row(
                children: [
                  MyText.bodyMedium(widget.cardTitle, fontWeight: 700, muted: true, color: contentColor),
                  Spacer(),
                  InkWell(
                    onTap: onLoadingToggle,
                    child: Icon(Remix.refresh_line, size: 18, color: contentColor),
                  ),
                  MySpacing.width(12),
                  InkWell(
                    onTap: onMinimizeToggle,
                    child: Icon(isMinimize ? Remix.add_line : Remix.subtract_line, size: 18, color: contentColor),
                  ),
                  MySpacing.width(12),
                  InkWell(
                    onTap: onCloseToggle,
                    child: Icon(Remix.close_line, size: 18, color: contentColor),
                  ),
                ],
              ),
            ),
            Padding(
              padding: MySpacing.all(!isMinimize ? 20 : 0),
              child: Stack(
                clipBehavior: Clip.antiAliasWithSaveLayer,
                alignment: Alignment.center,
                children: [
                  if (!isMinimize)
                    MyText.bodyMedium(
                      "Some quick example text to build on the card title and make up the bulk of the card's content. Some quick example text to build on the card title and make up.",
                      fontWeight: 700,
                      xMuted: true,
                      maxLines: 2,
                    ),
                  if (isLoading) CircularProgressIndicator(color: isLoading ? theme.colorScheme.secondary.withAlpha(2) : null),
                  if (isLoading) Center(child: CircularProgressIndicator()),
                ],
              ),
            ),
          ],
        ),
      );
    }
  }
}

import 'package:flutter/material.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_breadcrumb_item.dart';
import 'package:kho555/helper/widgets/my_constant.dart';
import 'package:kho555/helper/widgets/my_responsive.dart';
import 'package:kho555/helper/widgets/my_router.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';

class MyBreadcrumb extends StatelessWidget with UIMixin {
  final List<MyBreadcrumbItem> children;
  final bool hideOnMobile;

  MyBreadcrumb({super.key, required List<MyBreadcrumbItem> children, this.hideOnMobile = true}) : children = _buildChildren(children);

  static List<MyBreadcrumbItem> _buildChildren(List<MyBreadcrumbItem> original) {
    final breadcrumbItems = List<MyBreadcrumbItem>.from(original);
    final defaultItem = MyConstant.constant.defaultBreadCrumbItem;
    if (defaultItem != null) {
      breadcrumbItems.insert(0, defaultItem);
    }
    return breadcrumbItems;
  }

  @override
  Widget build(BuildContext context) {
    final themeColor = contentTheme.onPrimary;

    final breadcrumbWidgets = <Widget>[];
    for (int i = 0; i < children.length; i++) {
      final item = children[i];
      final textWidget = MyText.labelMedium(item.name, fontWeight: 500, fontSize: 13, letterSpacing: 0, color: themeColor);

      breadcrumbWidgets.add(
        item.active || item.route == null
            ? textWidget
            : InkWell(onTap: () => MyRouter.pushReplacementNamed(context, item.route!), child: textWidget),
      );

      if (i < children.length - 1) {
        breadcrumbWidgets.addAll([
          MySpacing.width(12),
          Icon(Icons.arrow_forward_ios_rounded, size: 10, color: themeColor),
          MySpacing.width(12),
        ]);
      }
    }

    return MyResponsive(
      builder: (_, _, type) {
        if (type.isMobile && hideOnMobile) {
          return const SizedBox();
        }
        return Row(mainAxisSize: MainAxisSize.min, children: breadcrumbWidgets);
      },
    );
  }
}

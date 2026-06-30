import 'package:flutter/material.dart';
import 'package:ttk_logistics/helper/theme/admin_theme.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/widgets/my_dashed_divider.dart';
import 'package:ttk_logistics/helper/widgets/my_navigation_mixin.dart';

mixin UIMixin {
  LeftBarTheme get leftBarTheme => AdminTheme.theme.leftBarTheme;

  TopBarTheme get topBarTheme => AdminTheme.theme.topBarTheme;

  RightBarTheme get rightBarTheme => AdminTheme.theme.rightBarTheme;

  ContentTheme get contentTheme => AdminTheme.theme.contentTheme;

  ColorScheme get colorScheme => theme.colorScheme;

  VisualDensity get getCompactDensity => VisualDensity(horizontal: -4, vertical: -4);


  // ThemeData get theme => AppStyle.theme;
  // LeftBarTheme get leftBarTheme => AdminTheme.theme.leftBarTheme;
  //
  // TopBarTheme get topBarTheme => AdminTheme.theme.topBarTheme;
  //
  // RightBarTheme get rightBarTheme => AdminTheme.theme.rightBarTheme;
  //
  // ContentTheme get contentTheme => AdminTheme.theme.contentTheme;
  //
  // ColorScheme get colorScheme => theme.colorScheme;
  //
  // VisualDensity get getCompactDensity => VisualDensity(horizontal: -4, vertical: -4);

  // theme.colorScheme. get theme.colorScheme. => theme.theme.colorScheme.;

  OutlineInputBorder get outlineInputBorder => OutlineInputBorder(
    borderRadius: BorderRadius.all(Radius.circular(12)),
    borderSide: BorderSide(width: 1, strokeAlign: 0, color: colorScheme.onSurface.withAlpha(80)),
  );

  OutlineInputBorder get focusedInputBorder => OutlineInputBorder(
    borderRadius: BorderRadius.all(Radius.circular(12)),
    borderSide: BorderSide(width: 1, color: contentTheme.primary),
  );

  OutlineInputBorder generateOutlineInputBorder({double radius = 8}) => OutlineInputBorder(
    borderRadius: BorderRadius.all(Radius.circular(radius)),
    borderSide: BorderSide(color: Colors.transparent),
  );

  OutlineInputBorder generateFocusedInputBorder({double radius = 8}) => OutlineInputBorder(
    borderRadius: BorderRadius.all(Radius.circular(radius)),
    borderSide: BorderSide(width: 1, color: colorScheme.primary),
  );

  Widget getBackButton(MyNavigationMixin navigationMixin) {
    return InkWell(
      onTap: navigationMixin.goBack,
      child: Center(child: Icon(Icons.chevron_left_rounded, size: 26, color: colorScheme.onSurface)),
    );
  }

  Widget getDashedDivider() {
    return MyDashedDivider(dashWidth: 6, dashSpace: 4, color: colorScheme.onSurface.withAlpha(64), height: 0.5);
  }

  String numberFormatter(String n) {
    var numArr = n.split('');
    String revStr = "";
    int thousands = 0;
    for (var i = numArr.length - 1; i >= 0; i--) {
      if (numArr[i].toString() == ".") {
        thousands = 0;
      } else {
        thousands++;
      }
      revStr = revStr + numArr[i].toString();
      if (thousands == 3 && i > 0) {
        thousands = 0;
        revStr = '$revStr,';
      }
    }
    return revStr.split('').reversed.join('');
  }

  double findAspectRatio(double width) {
    //Logic for aspect ratio of grid view
    return (width / 2 - 24) / ((width / 2 - 24) + 92);
  }

}

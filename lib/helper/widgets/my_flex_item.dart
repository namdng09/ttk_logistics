import 'package:ttk_logistics/helper/widgets/my_display_type.dart';
import 'package:ttk_logistics/helper/widgets/my_screen_media.dart';
import 'package:ttk_logistics/helper/widgets/my_screen_media_type.dart';
import 'package:flutter/material.dart';

class MyFlexItem extends StatelessWidget {
  final Widget child;
  final String? sizes;
  final String? displays;

  Map<MyScreenMediaType, double> get flex => MyScreenMedia.getFlexedDataFromString(sizes);

  Map<MyScreenMediaType, MyDisplayType> get display => MyScreenMedia.getDisplayDataFromString(displays);

  const MyFlexItem({super.key, required this.child, this.sizes, this.displays});

  @override
  Widget build(BuildContext context) {
    return child;
  }
}

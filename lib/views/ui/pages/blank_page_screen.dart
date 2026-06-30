import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/blank_page_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class BlankPageScreen extends StatefulWidget {
  const BlankPageScreen({super.key});

  @override
  State<BlankPageScreen> createState() => _BlankPageScreenState();
}

class _BlankPageScreenState extends State<BlankPageScreen> with UIMixin {
  late BlankPageController controller;

  @override
  void initState() {
    controller = Get.put(BlankPageController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(subScreenName: 'Blank Page', mainScreenName: 'Pages', child: MyContainer(height: 400));
      },
    );
  }
}

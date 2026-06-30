import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/widgets/my_text_utils.dart';
import 'package:flutter/material.dart';

class AuthLayoutController extends MyController {
  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey();
  final scrollKey = GlobalKey();
  List<String> dummyTexts = List.generate(12, (index) => MyTextUtils.getDummyText(60));
  int animatedCarouselSize = 3;
  int selectedAnimatedCarousel = 0;
  final PageController animatedPageController = PageController(initialPage: 0);

  @override
  void onInit() {
    super.onInit();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      update();
    });

  }

  void onChangeAnimatedCarousel(int value) {
    selectedAnimatedCarousel = value;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      update();
    });
  }
}

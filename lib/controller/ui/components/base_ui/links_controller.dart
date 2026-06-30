import 'package:flutter/material.dart';
import 'package:ttk_logistics/controller/my_controller.dart';

class LinksController extends MyController {
  bool isHovered = false;

  void onEnter(PointerEvent event) {
    isHovered = true;
    update();
  }

  void onExit(PointerEvent event) {
    isHovered = false;
    update();
  }
}
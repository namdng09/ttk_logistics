import 'package:flutter/material.dart';
import 'package:ttk_logistics/controller/my_controller.dart';

class XEditableController extends MyController {
  final usernameController = TextEditingController(text: "superuser");
  final firstnameController = TextEditingController();
  final commentsController = TextEditingController(text: "awesome user!");

  bool isEditingUsername = false;
  bool isEditingFirstname = false;

  String? selectedSex;
  String? selectedGroup = "Admin";
  String? selectedStatus = "Active";
  DateTime? dob = DateTime(1984, 5, 15);
  DateTime? eventDate;
  TimeOfDay? eventTime;
  List<String> selectedFruits = [];

  final List<String> sexOptions = ["Male", "Female", "Other"];
  final List<String> groupOptions = ["Admin", "Editor", "Viewer"];
  final List<String> statusOptions = ["Active", "Inactive"];
  final List<String> fruitOptions = ["Banana", "Apple", "Peach", "Watermelon", "Orange"];

  void toggleUsernameEditing() {
    isEditingUsername = !isEditingUsername;
    update();
  }

  void toggleFirstnameEditing() {
    isEditingFirstname = !isEditingFirstname;
    update();
  }

  void setSex(String? value) {
    selectedSex = value;
    update();
  }

  void setGroup(String? value) {
    selectedGroup = value;
    update();
  }

  void setStatus(String? value) {
    selectedStatus = value;
    update();
  }

  void setDOB(DateTime value) {
    dob = value;
    update();
  }

  void setEventDateTime(DateTime date, TimeOfDay time) {
    eventDate = date;
    eventTime = time;
    update();
  }

  void toggleFruit(String fruit, bool selected) {
    if (selected) {
      selectedFruits.add(fruit);
    } else {
      selectedFruits.remove(fruit);
    }
    update();
  }
}

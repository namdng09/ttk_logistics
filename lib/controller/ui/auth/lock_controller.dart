import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/widgets/my_form_validator.dart';
import 'package:ttk_logistics/helper/widgets/my_validators.dart';

class LockController extends MyController{
  MyFormValidator basicValidator = MyFormValidator();

  @override
  void onInit() {
    basicValidator.addField('password',
        required: true, label: "Password", validators: [MyLengthValidator(min: 6, max: 10)], controller: TextEditingController(text: '123456789'));
    super.onInit();
  }

  Future<void> onSignIn() async {
    if (basicValidator.validateForm()) {
      update();
      await Future.delayed(Duration(seconds: 1));
      Get.toNamed('/dashboard');
      update();
    }
  }

  void goToRegisterScreen() {
    Get.toNamed('/auth/register_account');
  }

  void goToSignUp() {
    Get.toNamed('/auth/sign_up');
  }
}
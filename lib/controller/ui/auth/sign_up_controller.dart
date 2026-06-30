import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/widgets/my_form_validator.dart';
import 'package:ttk_logistics/helper/widgets/my_validators.dart';

class SignUpController extends MyController {
  MyFormValidator basicValidator = MyFormValidator();
  bool termAndConditions = false;

  @override
  void onInit() {
    super.onInit();
    basicValidator.addField('email', required: true, label: "Email", validators: [MyEmailValidator()], controller: TextEditingController());
    basicValidator.addField(
      'name',
      required: true,
      label: 'Name',
      validators: [MyNameValidator(max: 10)],
      controller: TextEditingController(),
    );
    basicValidator.addField(
      'password',
      required: true,
      validators: [MyLengthValidator(min: 6, max: 10)],
      controller: TextEditingController(),
    );
  }

  void termAndConditionsToggle() {
    termAndConditions = !termAndConditions;
    update();
  }

  Future<void> onLogin() async {
    if (basicValidator.validateForm()) {
      update();
      var errors = await AuthService.loginUser(basicValidator.getData());
      if (errors != null) {
        basicValidator.addErrors(errors);
        basicValidator.validateForm();
        basicValidator.clearErrors();
      }
      String nextUrl = Uri.parse(ModalRoute.of(Get.context!)?.settings.name ?? "").queryParameters['next'] ?? "/dashboard";
      Get.toNamed(nextUrl);
      update();
    }
  }

  void gotoLogin() {
    Get.toNamed('/login');
  }
}

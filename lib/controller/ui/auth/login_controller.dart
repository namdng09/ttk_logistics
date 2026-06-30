import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/services/auth_services.dart';
import 'package:ttk_logistics/helper/widgets/my_form_validator.dart';
import 'package:ttk_logistics/helper/widgets/my_validators.dart';

import '../../../helper/theme/admin_theme.dart';
import '../../../helper/widgets/my_text.dart';

class LoginController extends MyController {
  MyFormValidator basicValidator = MyFormValidator();

  bool loading = false;
  bool rememberMe = false;

  final String _dummyEmail = "";
  final String _dummyPassword = "";

  @override
  void onInit() {
    super.onInit();
    basicValidator.addField(
      'username',
      required: true,
      label: "Tên đăng nhập",
      // validators: [MyEmailValidator()],
      controller: TextEditingController(text: _dummyEmail),
    );

    basicValidator.addField(
      'password',
      required: true,
      label: "Password",
      validators: [MyLengthValidator(min: 6, max: 10)],
      controller: TextEditingController(text: _dummyPassword),
    );
  }
  void showSnackBar({required String message, String type = "info"}) {
    ContentThemeColor selectedColor = ContentThemeColor.primary;
    SnackBarBehavior selectedBehavior = SnackBarBehavior.floating;

    Color color = selectedColor.onColor;
    double? width = selectedBehavior == SnackBarBehavior.fixed ? null : 300;
    Duration duration = Duration(seconds: 5);
    // Nếu là lỗi thì dùng màu danger
    if (type == "error") {
      selectedColor = ContentThemeColor.danger;
      color = Colors.white;         // chữ trắng cho dễ đọc
    }

    Color backgroundColor = selectedColor.color;

    SnackBar snackBar = SnackBar(
      width: width,
      behavior: selectedBehavior,
      duration: duration,
      showCloseIcon: true,
      closeIconColor: color,
      content: MyText.labelLarge(message, color: color),
      backgroundColor: backgroundColor,
    );

    ScaffoldMessenger.of(Get.context!).hideCurrentSnackBar();
    ScaffoldMessenger.of(Get.context!).showSnackBar(snackBar);
  }

  // Services
  Future<void> onLogin() async {
    if (basicValidator.validateForm()) {
      loading = true;
      update();
      var errors = await AuthService.loginUser(basicValidator.getData());
      if (errors != null) {
        basicValidator.addErrors(errors);
        basicValidator.validateForm();
        basicValidator.clearErrors();
        showSnackBar(message: errors['general']!, type: "error");
      } else {
        String nextUrl = Uri.parse(ModalRoute.of(Get.context!)?.settings.name ?? "").queryParameters['next'] ?? "/dashboard";
        Get.toNamed(nextUrl);
      }
      loading = false;
      update();
    }

  }

  void goToForgotPassword() {
    Get.toNamed('/auth/reset_password');
  }

  void gotoSignUp() {
    Get.toNamed('/auth/sign_up');
  }
}

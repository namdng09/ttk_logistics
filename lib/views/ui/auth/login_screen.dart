import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/ui/auth/login_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/views/layout/auth_layout.dart';
import 'package:kho555/helper/widgets/my_button.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/images.dart';
import 'package:remixicon/remixicon.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with UIMixin {
  late LoginController controller;
  bool obscurePassword = true;

  @override
  void initState() {
    controller = Get.put(LoginController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {

    return GetBuilder(
      init: controller,
      tag: 'login_controller',
      builder: (controller) {
        return AuthLayout(
          child: Column(
            children: [
              MyContainer(
                paddingAll: 40,
                child: Form(
                  key: controller.basicValidator.formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(child: Image.asset(Images.logoDark, height: 80)),
                      MySpacing.height(24),
                      Center(child: MyText.titleMedium("Xin chào!", fontWeight: 600, muted: true,color: contentTheme.primary,)),
                      MySpacing.height(12),
                      Center(child: MyText.bodyMedium("Đăng nhập quản lý hệ thống HENG XING 555.")),
                      MySpacing.height(12),
                      MyText.bodyMedium("Tên đăng nhập", fontWeight: 600),
                      MySpacing.height(8),
                      TextFormField(
                        validator: controller.basicValidator.getValidation('username'), // ✅ đổi từ email sang username
                        controller: controller.basicValidator.getController('username'),
                        keyboardType: TextInputType.text, // ✅ nhập text thường thay vì email
                        style: MyTextStyle.bodyMedium(),
                        decoration: InputDecoration(
                          hintText: "Tên đăng nhập",
                          hintStyle: MyTextStyle.bodySmall(xMuted: true),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(6)),
                            borderSide: BorderSide(
                              width: 1,
                              strokeAlign: 0,
                              color: colorScheme.onSurface.withAlpha(80),
                            ),
                          ),
                          contentPadding: MySpacing.all(16),
                          isDense: true,
                          isCollapsed: true,
                          floatingLabelBehavior: FloatingLabelBehavior.never,
                        ),
                      ),
                      MySpacing.height(16),
                      MyText.bodyMedium("Mật khẩu", fontWeight: 600),
                      TextFormField(
                        style: MyTextStyle.bodyMedium(xMuted: true),
                        validator: controller.basicValidator.getValidation('password'),
                        controller: controller.basicValidator.getController('password'),
                        keyboardType: TextInputType.visiblePassword,
                        obscureText: obscurePassword,
                        decoration: InputDecoration(
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.all(Radius.circular(6)),
                            borderSide: BorderSide(width: 1, strokeAlign: 0, color: colorScheme.onSurface.withAlpha(80)),
                          ),
                          contentPadding: MySpacing.all(16),
                          isCollapsed: true,
                          isDense: true,
                          floatingLabelBehavior: FloatingLabelBehavior.never,
                          hintText: "Mật khẩu",
                          hintStyle: MyTextStyle.bodySmall(xMuted: true),
                          suffixIcon: IconButton(
                            icon: Icon(
                              obscurePassword ? RemixIcons.eye_line : RemixIcons.eye_off_line,
                            ),
                            onPressed: () {
                              setState(() {
                                obscurePassword = !obscurePassword;
                              });
                            },
                          ),
                        ),
                      ),
                      MySpacing.height(12),
                      Row(
                        children: [
                          Theme(
                            data: ThemeData(visualDensity: VisualDensity.compact),
                            child: Checkbox(
                              visualDensity: VisualDensity.compact,
                              value: controller.rememberMe,
                              onChanged: (bool? value) {
                                setState(() {
                                  controller.rememberMe = value ?? false;
                                });
                              },
                            ),
                          ),
                          MyText.bodyMedium('Ghi nhớ đăng nhập', fontWeight: 600, muted: true),
                        ],
                      ),
                      MySpacing.height(16),
                      MyContainer(
                        onTap: controller.onLogin,
                        color: contentTheme.primary,
                        borderRadiusAll: 6,
                        child: Center(child:
                        controller.loading
                            ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          ) :  MyText.bodyMedium("Đăng nhập", color: contentTheme.onPrimary)
                        ),

                        //     : ,
                      ),
                      Center(
                        child: MyButton.text(
                          onPressed: controller.goToForgotPassword,
                          elevation: 0,
                          padding: MySpacing.xy(0, 0),
                          splashColor: contentTheme.secondary.withValues(alpha: 0.1),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(RemixIcons.lock_fill, size: 16, color: contentTheme.secondary),
                              MySpacing.width(12),
                              MyText.labelMedium('Quên mật khẩu?', color: contentTheme.secondary),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              MySpacing.height(16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  MyText.bodyMedium("Chưa có tài khoản?", color: contentTheme.background),
                  MySpacing.width(12),
                  InkWell(
                    onTap: () => controller.gotoSignUp(),
                    splashColor: Colors.transparent,
                    focusColor: Colors.transparent,
                    highlightColor: Colors.transparent,
                    child: MyText.bodyMedium("Đăng ký", fontWeight: 700, color: contentTheme.onBlue),
                  ),
                ],
              ),
              MySpacing.height(16),
              MyText.bodyMedium('© 2025 ANDIN JSC',color: contentTheme.onPrimary,)
            ],
          ),
        );
      },
    );
  }
}

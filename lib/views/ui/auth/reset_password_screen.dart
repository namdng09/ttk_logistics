import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/auth/reset_password_controller.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/views/layout/auth_layout.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';
import 'package:ttk_logistics/images.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> with UIMixin {
  late ResetPasswordController controller;

  @override
  void initState() {
    controller = Get.put(ResetPasswordController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'reset_password_controller',
      builder: (controller) {
        return AuthLayout(
          child: Column(
            children: [
              MyContainer(
                paddingAll: 40,
                child: Form(
                  key: controller.basicValidator.formKey,
                  child: Column(
                    children: [
                      Image.asset(Images.logoDark, height: 32),
                      MySpacing.height(20),
                      MyText.titleMedium("Reset Password", fontWeight: 600, muted: true,color: contentTheme.primary),
                      MySpacing.height(16),
                      MyText.bodyMedium(
                        "Re-Password with Morvin.",
                        textAlign: TextAlign.center,
                      ),
                      MySpacing.height(16),
                      MyContainer.bordered(
                        color: contentTheme.success.withValues(alpha: 0.2),
                        borderColor: contentTheme.success,
                        paddingAll: 12,
                        child: Center(child: MyText.bodySmall('Enter your Email and instructions will be sent to you!')),
                      ),
                      MySpacing.height(16),
                      emailTextField(),
                      MySpacing.height(20),
                      signInButton(),
                    ],
                  ),
                ),
              ),
              MySpacing.height(12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  MyText.bodyMedium("Remember It ?", color: contentTheme.background),
                  MySpacing.width(8),
                  InkWell(
                    onTap: controller.gotoLogIn,
                    child: MyText.bodyMedium("Sign In here", fontWeight: 800, muted: true, color: contentTheme.onBlue),
                  ),
                ],
              ),
              MySpacing.height(16),
              MyText.bodyMedium('© 2025 Morvin. Crafted with  by Themesdesign',color: contentTheme.onPrimary,)
            ],
          ),
        );
      },
    );
  }

  Widget emailTextField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.bodyMedium("Email Address", fontWeight: 600, muted: true),
        MySpacing.height(12),
        TextFormField(
          controller: controller.basicValidator.getController('email'),
          validator: controller.basicValidator.getValidation('email'),
          style: MyTextStyle.bodyMedium(xMuted: true),
          cursorWidth: 1,
          cursorColor: theme.colorScheme.onSurface.withAlpha(120),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            disabledBorder: OutlineInputBorder(
              borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80)),
            ),
            errorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            focusedBorder: OutlineInputBorder(
              borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80)),
            ),
            focusedErrorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            enabledBorder: OutlineInputBorder(
              borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80)),
            ),
            hintText: "Enter your email",
            hintStyle: MyTextStyle.bodyMedium(xMuted: true),
            isCollapsed: true,
            isDense: true,
            contentPadding: MySpacing.all(15),
          ),
        ),
      ],
    );
  }

  Widget signInButton() {
    return MyContainer(
      onTap: controller.onLogin,
      paddingAll: 12,
      color: contentTheme.primary,
      child: Center(child: MyText.bodyMedium("Reset", fontWeight: 600, color: contentTheme.onPrimary)),
    );
  }
}

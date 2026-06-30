import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/auth/lock_controller.dart';
import 'package:ttk_logistics/helper/theme/app_theme.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/views/layout/auth_layout.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';
import 'package:ttk_logistics/images.dart';

class LockScreen extends StatefulWidget {
  const LockScreen({super.key});

  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> with UIMixin {
  late LockController controller;

  @override
  void initState() {
    controller = Get.put(LockController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'lock_controller',
      builder: (controller) {
        return AuthLayout(
          child: Column(
            children: [
              MyContainer(
                paddingAll: 40,
                child: Form(
                  key: controller.basicValidator.formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      Image.asset(Images.logoDark, height: 32),
                      MySpacing.height(20),
                      MyText.titleMedium("Khoá màn hình", fontWeight: 600, muted: true,color: contentTheme.primary),
                      MySpacing.height(20),
                      MyText.bodyMedium("Vui lòng nhập mật khẩu để quay lại chương trình!", textAlign: TextAlign.center),
                      MySpacing.height(20),
                      MyContainer.roundBordered(
                        paddingAll: 4,
                        child: MyContainer.rounded(
                          height: 48,
                          paddingAll: 0,
                          child: Image.asset(Images.users[6]),
                        ),
                      ),
                      MyText.bodyMedium("<Tên đăng nhập>",fontWeight: 600),
                      MySpacing.height(20),
                      emailTextField(),
                      MySpacing.height(20),
                      signInButton(),
                    ],
                  ),
                ),
              ),
              MySpacing.height(20),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  MyText.bodyMedium("Nếu không phải bạn? ", color: contentTheme.background),
                  MySpacing.width(8),
                  InkWell(
                    onTap: controller.goToSignUp,
                    child: MyText.bodyMedium("Đăng ký ngay", fontWeight: 800, muted: true, color: contentTheme.onBlue),
                  ),
                ],
              ),
              MySpacing.height(16),
              MyText.bodyMedium(
                '© ${DateTime.now().year} HENG XING 555',
                color: contentTheme.onPrimary,
              )
            ],
          ),
        );
      },
    );
  }

  Widget emailTextField() {
    return TextFormField(
      controller: controller.basicValidator.getController('password'),
      validator: controller.basicValidator.getValidation('password'),
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
        hintText: "Enter your password",
        hintStyle: MyTextStyle.bodyMedium(xMuted: true),
        isCollapsed: true,
        isDense: true,
        contentPadding: MySpacing.all(15),
      ),
    );
  }

  Widget signInButton() {
    return MyContainer(
      onTap: controller.onSignIn,
      paddingAll: 12,
      width: double.infinity,
      color: contentTheme.primary,
      child: Center(child: MyText.bodyMedium("Unlock", fontWeight: 600, color: contentTheme.onPrimary)),
    );
  }
}

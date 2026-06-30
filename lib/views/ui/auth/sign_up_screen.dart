import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/ui/auth/sign_up_controller.dart';
import 'package:kho555/helper/theme/app_theme.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/views/layout/auth_layout.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/images.dart';

class SignUpScreen extends StatefulWidget {
  const SignUpScreen({super.key});

  @override
  State<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends State<SignUpScreen> with UIMixin {
  late SignUpController controller;

  @override
  void initState() {
    controller = Get.put(SignUpController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'sign_up_controller',
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
                      MySpacing.height(24),
                      Center(child: MyText.titleMedium("Free Register", fontWeight: 600, muted: true, color: contentTheme.primary)),
                      MySpacing.height(12),
                      MyText.bodyMedium("Get your free Morvin account now.", fontWeight: 600, textAlign: TextAlign.center),
                      MySpacing.height(20),
                      nameTextField(),
                      MySpacing.height(20),
                      emailTextField(),
                      MySpacing.height(20),
                      passwordField(),
                      MySpacing.height(12),
                      remember(),
                      MySpacing.height(12),
                      signInButton(),
                      MySpacing.height(12),
                      Row(
                        children: [
                          MyText.bodyMedium('By registering you agree to the Morvin '),
                          MyText.bodyMedium('Terms of Use',color: contentTheme.primary),
                        ],
                      )
                    ],
                  ),
                ),
              ),
              MySpacing.height(16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  MyText.bodyMedium("Already have an account ?", color: contentTheme.background),
                  MySpacing.width(12),
                  InkWell(
                    onTap: () {
                      Get.back();
                    },
                    splashColor: Colors.transparent,
                    focusColor: Colors.transparent,
                    highlightColor: Colors.transparent,
                    child: MyText.bodyMedium("Login", fontWeight: 700, color: contentTheme.onBlue),
                  ),
                ],
              ),
              MySpacing.height(16),
              MyText.bodyMedium('© 2025 Morvin. Crafted with  by Themesdesign', color: contentTheme.onPrimary),
            ],
          ),
        );
      },
    );
  }

  Widget nameTextField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.bodyMedium("Name", fontWeight: 600, muted: true),
        MySpacing.height(12),
        TextFormField(
          controller: controller.basicValidator.getController('name'),
          validator: controller.basicValidator.getValidation('name'),
          style: MyTextStyle.bodyMedium(xMuted: true),
          cursorWidth: 1,
          cursorColor: theme.colorScheme.onSurface.withAlpha(120),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            disabledBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            errorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            focusedBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            focusedErrorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            enabledBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            hintText: "Enter your name",
            hintStyle: MyTextStyle.bodyMedium(xMuted: true),
            isCollapsed: true,
            isDense: true,
            contentPadding: MySpacing.all(15),
          ),
        ),
      ],
    );
  }

  Widget emailTextField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.bodyMedium("Email", fontWeight: 600, muted: true),
        MySpacing.height(12),
        TextFormField(
          controller: controller.basicValidator.getController('email'),
          validator: controller.basicValidator.getValidation('email'),
          style: MyTextStyle.bodyMedium(xMuted: true),
          cursorWidth: 1,
          cursorColor: theme.colorScheme.onSurface.withAlpha(120),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            disabledBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            errorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            focusedBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            focusedErrorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            enabledBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
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

  Widget passwordField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.bodyMedium("Password", fontWeight: 600, muted: true),
        MySpacing.height(12),
        TextFormField(
          controller: controller.basicValidator.getController('password'),
          validator: controller.basicValidator.getValidation('password'),
          style: MyTextStyle.bodyMedium(xMuted: true),
          cursorWidth: 1,
          cursorColor: theme.colorScheme.onSurface.withAlpha(120),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            disabledBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            errorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            focusedBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            focusedErrorBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: contentTheme.danger)),
            enabledBorder: OutlineInputBorder(borderSide: BorderSide(width: 1, strokeAlign: 0, color: theme.colorScheme.onSurface.withAlpha(80))),
            hintText: "Enter your password",
            hintStyle: MyTextStyle.bodyMedium(xMuted: true),
            isCollapsed: true,
            isDense: true,
            contentPadding: MySpacing.all(15),
          ),
        ),
      ],
    );
  }

  Widget remember() {
    return Theme(
      data: ThemeData(),
      child: CheckboxListTile(
        value: controller.termAndConditions,
        onChanged: (value) => controller.termAndConditionsToggle(),
        visualDensity: VisualDensity(horizontal: -4, vertical: -4),
        controlAffinity: ListTileControlAffinity.leading,
        contentPadding: MySpacing.zero,
        activeColor: contentTheme.primary,
        dense: true,
        side: BorderSide(color: contentTheme.secondary),
        title: MyText.bodyMedium("I accept Terms and Condition", fontWeight: 600, color: contentTheme.secondary),
      ),
    );
  }

  Widget signInButton() {
    return MyContainer(
      onTap: controller.onLogin,
      paddingAll: 10,
      width: double.infinity,
      color: contentTheme.primary,
      child: Center(child: MyText.bodyMedium("Register", color: contentTheme.onPrimary)),
    );
  }
}

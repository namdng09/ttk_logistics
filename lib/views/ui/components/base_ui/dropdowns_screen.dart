import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/ui/components/base_ui/dropdowns_controller.dart';
import 'package:kho555/helper/extensions/string.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/views/layout/layout.dart';


class DropdownsScreen extends StatefulWidget {
  const DropdownsScreen({super.key});

  @override
  State<DropdownsScreen> createState() => _DropdownsScreenState();
}

class _DropdownsScreenState extends State<DropdownsScreen> with UIMixin {
  DropdownsController controller = Get.put(DropdownsController());
  OutlineInputBorder outlineBorder = OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none);
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'dropdowns_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Dropdown',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [MyFlexItem(child: singleButtonDropdowns()), MyFlexItem(child: variant()), MyFlexItem(child: sizing())],
          ),
        );
      },
    );
  }

  Widget singleButtonDropdowns() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("Single button dropdowns", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MyText.titleSmall("Dropdown Button", fontWeight: 600),
                      MySpacing.height(20),
                      DropdownButtonFormField<SingleButtonDropdowns>(
                        initialValue: controller.singleButtonDropdowns1,
                        onChanged: (value) {},
                        dropdownColor: contentTheme.background,
                        items:
                            SingleButtonDropdowns.values.map((SingleButtonDropdowns singleButton) {
                              return DropdownMenuItem<SingleButtonDropdowns>(
                                onTap: () => controller.onSelectSingleButtonDropdowns1(singleButton),
                                value: singleButton,
                                child: MyText.bodyMedium(singleButton.name.capitalizeWords, fontWeight: 600),
                              );
                            }).toList(),
                        decoration: InputDecoration(
                          labelText: "Select button",
                          labelStyle: MyTextStyle.bodyMedium(),
                          disabledBorder: outlineBorder,
                          enabledBorder: outlineBorder,
                          errorBorder: outlineBorder,
                          focusedBorder: outlineBorder,
                          focusedErrorBorder: outlineBorder,
                          border: outlineBorder,
                          contentPadding: MySpacing.all(16),
                          isCollapsed: true,
                          filled: true,
                          floatingLabelBehavior: FloatingLabelBehavior.never,
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      MyText.titleSmall("Dropdown Link", fontWeight: 600),
                      MySpacing.height(20),
                      DropdownButtonFormField<SingleButtonDropdowns>(
                        initialValue: controller.singleButtonDropdowns2,
                        onChanged: (value) {},
                        dropdownColor: contentTheme.background,
                        items:
                            SingleButtonDropdowns.values.map((SingleButtonDropdowns singleButton) {
                              return DropdownMenuItem<SingleButtonDropdowns>(
                                onTap: () => controller.onSelectSingleButtonDropdowns2(singleButton),
                                value: singleButton,
                                child: MyText.bodyMedium(singleButton.name.capitalizeWords, fontWeight: 600),
                              );
                            }).toList(),
                        decoration: InputDecoration(
                          labelText: "Select button link",
                          labelStyle: MyTextStyle.bodyMedium(),
                          disabledBorder: outlineBorder,
                          enabledBorder: outlineBorder,
                          errorBorder: outlineBorder,
                          focusedBorder: outlineBorder,
                          focusedErrorBorder: outlineBorder,
                          border: outlineBorder,
                          contentPadding: MySpacing.all(16),
                          filled: true,
                          isCollapsed: true,
                          isDense: true,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget variant() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("Variant", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                SizedBox(
                  width: 170,
                  child: DropdownButtonFormField<SingleButtonDropdowns>(
                    initialValue: controller.primaryButton,
                    onChanged: (value) {
                      if (value != null) {
                        controller.onSelectSinglePrimaryButton(value);
                      }
                    },
                    style: MyTextStyle.bodyMedium(color: contentTheme.onPrimary, fontWeight: 600),
                    dropdownColor: contentTheme.primary,
                    iconEnabledColor: contentTheme.onPrimary,
                    decoration: InputDecoration(
                      labelText: "Primary",
                      labelStyle: MyTextStyle.bodyMedium(color: contentTheme.onPrimary),
                      fillColor: contentTheme.primary,
                      filled: true,
                      contentPadding: MySpacing.all(16),
                      floatingLabelBehavior: FloatingLabelBehavior.never,
                      border: outlineBorder,
                      enabledBorder: outlineBorder,
                      focusedBorder: outlineBorder,
                    ),
                    items:
                        SingleButtonDropdowns.values
                            .map(
                              (SingleButtonDropdowns singleButton) => DropdownMenuItem<SingleButtonDropdowns>(
                                value: singleButton,
                                child: MyText.bodyMedium(singleButton.name.capitalizeWords, color: contentTheme.onPrimary, fontWeight: 600),
                              ),
                            )
                            .toList(),
                  ),
                ),

                SizedBox(
                  width: 170,
                  child: DropdownButtonFormField<SingleButtonDropdowns>(
                    initialValue: controller.secondaryButton,
                    onChanged: (value) {
                      if (value != null) controller.onSelectSingleSecondaryButton(value);
                    },
                    dropdownColor: contentTheme.secondary,
                    iconEnabledColor: contentTheme.onSecondary,
                    style: MyTextStyle.bodyMedium(color: contentTheme.onSecondary, fontWeight: 600),
                    decoration: InputDecoration(
                      labelText: "Secondary",
                      labelStyle: MyTextStyle.bodyMedium(color: contentTheme.onSecondary),
                      border: outlineBorder,
                      enabledBorder: outlineBorder,
                      focusedBorder: outlineBorder,
                      fillColor: contentTheme.secondary,
                      filled: true,
                      contentPadding: MySpacing.all(16),
                      floatingLabelBehavior: FloatingLabelBehavior.never,
                    ),
                    items:
                        SingleButtonDropdowns.values.map((singleButton) {
                          return DropdownMenuItem<SingleButtonDropdowns>(
                            value: singleButton,
                            child: MyText.bodyMedium(singleButton.name.capitalizeWords, color: contentTheme.onSecondary, fontWeight: 600),
                          );
                        }).toList(),
                  ),
                ),

                SizedBox(
                  width: 170,
                  child: DropdownButtonFormField<SingleButtonDropdowns>(
                    initialValue: controller.successButton,
                    onChanged: (value) {
                      if (value != null) controller.onSelectSingleSuccessButton(value);
                    },
                    dropdownColor: contentTheme.success,
                    iconEnabledColor: contentTheme.onSuccess,
                    style: MyTextStyle.bodyMedium(color: contentTheme.onSuccess, fontWeight: 600),
                    decoration: InputDecoration(
                      labelText: "Success",
                      labelStyle: MyTextStyle.bodyMedium(color: contentTheme.onSuccess),
                      border: outlineBorder,
                      enabledBorder: outlineBorder,
                      focusedBorder: outlineBorder,
                      fillColor: contentTheme.success,
                      filled: true,
                      contentPadding: MySpacing.all(16),
                      floatingLabelBehavior: FloatingLabelBehavior.never,
                    ),
                    items:
                        SingleButtonDropdowns.values.map((singleButton) {
                          return DropdownMenuItem<SingleButtonDropdowns>(
                            value: singleButton,
                            child: MyText.bodyMedium(singleButton.name.capitalizeWords, color: contentTheme.onSuccess, fontWeight: 600),
                          );
                        }).toList(),
                  ),
                ),

                SizedBox(
                  width: 170,
                  child: DropdownButtonFormField<SingleButtonDropdowns>(
                    initialValue: controller.warningButton,
                    onChanged: (value) {
                      if (value != null) controller.onSelectSingleWarningButton(value);
                    },
                    dropdownColor: contentTheme.warning,
                    iconEnabledColor: contentTheme.onWarning,
                    style: MyTextStyle.bodyMedium(color: contentTheme.onWarning, fontWeight: 600),
                    decoration: InputDecoration(
                      labelText: "Warning",
                      labelStyle: MyTextStyle.bodyMedium(color: contentTheme.onWarning),
                      border: outlineBorder,
                      enabledBorder: outlineBorder,
                      focusedBorder: outlineBorder,
                      fillColor: contentTheme.warning,
                      filled: true,
                      contentPadding: MySpacing.all(16),
                      floatingLabelBehavior: FloatingLabelBehavior.never,
                    ),
                    items:
                        SingleButtonDropdowns.values.map((singleButton) {
                          return DropdownMenuItem<SingleButtonDropdowns>(
                            value: singleButton,
                            child: MyText.bodyMedium(singleButton.name.capitalizeWords, color: contentTheme.onWarning, fontWeight: 600),
                          );
                        }).toList(),
                  ),
                ),

                SizedBox(
                  width: 170,
                  child: DropdownButtonFormField<SingleButtonDropdowns>(
                    initialValue: controller.dangerButton,
                    onChanged: (value) {
                      if (value != null) controller.onSelectSingleDangerButton(value);
                    },
                    dropdownColor: contentTheme.danger,
                    iconEnabledColor: contentTheme.onDanger,
                    style: MyTextStyle.bodyMedium(color: contentTheme.onDanger, fontWeight: 600),
                    decoration: InputDecoration(
                      labelText: "Danger",
                      labelStyle: MyTextStyle.bodyMedium(color: contentTheme.onDanger),
                      border: outlineBorder,
                      enabledBorder: outlineBorder,
                      focusedBorder: outlineBorder,
                      fillColor: contentTheme.danger,
                      filled: true,
                      contentPadding: MySpacing.all(16),
                      floatingLabelBehavior: FloatingLabelBehavior.never,
                    ),
                    items:
                        SingleButtonDropdowns.values.map((singleButton) {
                          return DropdownMenuItem<SingleButtonDropdowns>(
                            value: singleButton,
                            child: MyText.bodyMedium(singleButton.name.capitalizeWords, color: contentTheme.onDanger, fontWeight: 600),
                          );
                        }).toList(),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget sizing() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          MyContainer(

            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("Sizing", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(24),
            child: Wrap(
              spacing: 20,
              runSpacing: 20,
              children: [
                DropdownButtonFormField<SingleButtonDropdowns>(
                  initialValue: controller.largeButton1,
                  onChanged: (value) {},
                  focusColor: contentTheme.onPrimary,
                  dropdownColor: contentTheme.background,
                  itemHeight: 70,
                  style: MyTextStyle.bodyLarge(),
                  items:
                      SingleButtonDropdowns.values
                          .map(
                            (SingleButtonDropdowns singleButton) => DropdownMenuItem<SingleButtonDropdowns>(
                              onTap: () => controller.onSelectLargeButton1(singleButton),
                              value: singleButton,
                              child: MyText.bodyLarge(singleButton.name.capitalizeWords, fontWeight: 600),
                            ),
                          )
                          .toList(),
                  decoration: InputDecoration(
                    labelText: "Large Button",
                    labelStyle: MyTextStyle.bodyLarge(),
                    disabledBorder: outlineBorder,
                    enabledBorder: outlineBorder,
                    errorBorder: outlineBorder,
                    focusedBorder: outlineBorder,
                    focusedErrorBorder: outlineBorder,
                    border: outlineBorder,
                    contentPadding: MySpacing.all(16),
                    isCollapsed: true,
                    filled: true,
                    floatingLabelBehavior: FloatingLabelBehavior.never,
                  ),
                ),
                DropdownButtonFormField<SingleButtonDropdowns>(
                  initialValue: controller.largeButton2,
                  onChanged: (value) {},
                  focusColor: contentTheme.onPrimary,
                  dropdownColor: contentTheme.background,
                  itemHeight: 60,
                  style: MyTextStyle.bodyMedium(),
                  items:
                      SingleButtonDropdowns.values
                          .map(
                            (SingleButtonDropdowns singleButton) => DropdownMenuItem<SingleButtonDropdowns>(
                              onTap: () => controller.onSelectLargeButton2(singleButton),
                              value: singleButton,
                              child: MyText.bodyMedium(singleButton.name.capitalizeWords, fontWeight: 600),
                            ),
                          )
                          .toList(),
                  decoration: InputDecoration(
                    labelText: "Large Button",
                    labelStyle: MyTextStyle.bodyMedium(),
                    disabledBorder: outlineBorder,
                    enabledBorder: outlineBorder,
                    errorBorder: outlineBorder,
                    focusedBorder: outlineBorder,
                    focusedErrorBorder: outlineBorder,
                    border: outlineBorder,
                    contentPadding: MySpacing.all(16),
                    isCollapsed: true,
                    filled: true,
                    floatingLabelBehavior: FloatingLabelBehavior.never,
                  ),
                ),
                DropdownButtonFormField<SingleButtonDropdowns>(
                  initialValue: controller.smallButton1,
                  onChanged: (value) {},
                  focusColor: contentTheme.onPrimary,
                  dropdownColor: contentTheme.background,
                  style: MyTextStyle.bodySmall(),
                  itemHeight: 48,
                  menuMaxHeight: 160,
                  items:
                      SingleButtonDropdowns.values
                          .map(
                            (SingleButtonDropdowns singleButton) => DropdownMenuItem<SingleButtonDropdowns>(
                              onTap: () => controller.onSelectSmallButton1(singleButton),
                              value: singleButton,
                              child: MyText.bodySmall(singleButton.name.capitalizeWords, fontWeight: 600),
                            ),
                          )
                          .toList(),
                  decoration: InputDecoration(
                    labelText: "Small Button",
                    labelStyle: MyTextStyle.bodySmall(),
                    disabledBorder: outlineBorder,
                    enabledBorder: outlineBorder,
                    errorBorder: outlineBorder,
                    focusedBorder: outlineBorder,
                    focusedErrorBorder: outlineBorder,
                    border: outlineBorder,
                    contentPadding: MySpacing.all(16),
                    isCollapsed: true,
                    filled: true,
                    floatingLabelBehavior: FloatingLabelBehavior.never,
                  ),
                ),
                DropdownButtonFormField<SingleButtonDropdowns>(
                  initialValue: controller.smallButton2,
                  onChanged: (value) {},
                  focusColor: contentTheme.onPrimary,
                  dropdownColor: contentTheme.background,
                  style: MyTextStyle.labelSmall(),
                  items:
                      SingleButtonDropdowns.values
                          .map(
                            (SingleButtonDropdowns singleButton) => DropdownMenuItem<SingleButtonDropdowns>(
                              onTap: () => controller.onSelectSmallButton2(singleButton),
                              value: singleButton,
                              child: MyText.labelSmall(singleButton.name.capitalizeWords, fontWeight: 600),
                            ),
                          )
                          .toList(),
                  decoration: InputDecoration(
                    labelText: "Small Button",
                    labelStyle: MyTextStyle.labelSmall(),
                    disabledBorder: outlineBorder,
                    enabledBorder: outlineBorder,
                    errorBorder: outlineBorder,
                    focusedBorder: outlineBorder,
                    focusedErrorBorder: outlineBorder,
                    border: outlineBorder,
                    contentPadding: MySpacing.all(16),
                    isCollapsed: true,
                    filled: true,
                    floatingLabelBehavior: FloatingLabelBehavior.never,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ButtonGroup extends StatefulWidget {
  final Color buttonColor;
  final String buttonText;
  final List<String> dropdownItems;

  const ButtonGroup({super.key, required this.buttonColor, required this.buttonText, required this.dropdownItems});

  @override
  State<ButtonGroup> createState() => _ButtonGroupState();
}

class _ButtonGroupState extends State<ButtonGroup> with UIMixin {
  String? selectedItem;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: 190,
          child: DropdownButtonFormField<String>(
            initialValue: selectedItem,
            hint: MyText.bodyMedium('Options', fontWeight: 600),
            icon: Icon(Icons.arrow_drop_down),
            dropdownColor: contentTheme.disabled,
            decoration: InputDecoration(isCollapsed: true, isDense: true, contentPadding: MySpacing.all(12), border: OutlineInputBorder()),
            items:
                widget.dropdownItems.map((String item) {
                  return DropdownMenuItem<String>(value: item, child: MyText.bodyMedium(item));
                }).toList(),
            onChanged: (String? newValue) => setState(() => selectedItem = newValue),
          ),
        ),
        MyContainer(
          onTap: () {},
          borderRadiusAll: 4,
          paddingAll: 12,
          color: widget.buttonColor,
          child: MyText.bodyMedium(widget.buttonText, fontWeight: 600, color: contentTheme.onPrimary),
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/ui/components/forms/x_editable_controller.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/views/layout/layout.dart';


class XEditableScreen extends StatefulWidget {
  const XEditableScreen({super.key});

  @override
  State<XEditableScreen> createState() => _XEditableScreenState();
}

class _XEditableScreenState extends State<XEditableScreen> with UIMixin {
  XEditableController controller = Get.put(XEditableController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'x Editable',
          mainScreenName: 'Basic Elements',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            clipBehavior: Clip.antiAliasWithSaveLayer,
            borderRadiusAll: 4,
            paddingAll: 20,
            child: SingleChildScrollView(
              child: Table(
                columnWidths: {0: FractionColumnWidth(0.35), 1: FractionColumnWidth(0.65)},
                border: TableBorder.all(color: Colors.grey.shade300),
                defaultVerticalAlignment: TableCellVerticalAlignment.middle,
                children: [
                  _buildRow(
                    "Simple text field",
                    controller.isEditingUsername
                        ? Focus(
                            onFocusChange: (hasFocus) {
                              if (!hasFocus) controller.toggleUsernameEditing();
                            },
                            child: TextField(
                              controller: controller.usernameController,
                              autofocus: true,
                              onSubmitted: (_) => controller.toggleUsernameEditing(),
                            ),
                          )
                        : InkWell(
                            onTap: controller.toggleUsernameEditing,
                            child: MyText.bodyMedium(controller.usernameController.text, color: contentTheme.primary),
                          ),
                  ),
                  _buildRow(
                    "Empty text field, required",
                    controller.isEditingFirstname
                        ? Focus(
                            onFocusChange: (hasFocus) {
                              if (!hasFocus) controller.toggleFirstnameEditing();
                            },
                            child: TextField(
                              controller: controller.firstnameController,
                              autofocus: true,
                              decoration: InputDecoration(hintText: "Required"),
                              onSubmitted: (_) => controller.toggleFirstnameEditing(),
                            ),
                          )
                        : InkWell(
                            onTap: controller.toggleFirstnameEditing,
                            child: MyText.bodyMedium(
                              controller.firstnameController.text.isEmpty ? "Required" : controller.firstnameController.text,
                              color: contentTheme.primary,
                            ),
                          ),
                  ),

                  _buildRow(
                    "Select, local array",
                    MyContainer(
                      color: contentTheme.secondary.withValues(alpha: 0.12),
                      borderRadiusAll: 4,
                      padding: MySpacing.x(12),
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: controller.selectedSex,
                        hint: MyText.bodyMedium("Select sex", fontWeight: 600),
                        dropdownColor: Colors.white,
                        underline: SizedBox(),
                        items: controller.sexOptions.map((e) => DropdownMenuItem(value: e, child: MyText.bodyMedium(e))).toList(),
                        onChanged: (val) => setState(() => controller.setSex(val)),
                      ),
                    ),
                  ),

                  _buildRow(
                    "Select, remote",
                    MyContainer(
                      color: contentTheme.secondary.withValues(alpha: 0.12),
                      borderRadiusAll: 4,
                      padding: MySpacing.x(12),
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: controller.selectedGroup,
                        dropdownColor: Colors.white,
                        underline: SizedBox(),
                        items: controller.groupOptions.map((e) => DropdownMenuItem<String>(value: e, child: MyText.bodyMedium(e))).toList(),
                        onChanged: (val) => setState(() => controller.setGroup(val)),
                      ),
                    ),
                  ),

                  _buildRow(
                    "Select with error",
                    MyContainer(
                      color: contentTheme.secondary.withValues(alpha: 0.12),
                      borderRadiusAll: 4,
                      padding: MySpacing.x(12),
                      child: DropdownButton<String>(
                        isExpanded: true,
                        value: controller.selectedStatus,
                        dropdownColor: Colors.white,
                        underline: SizedBox(),
                        items: controller.statusOptions.map((e) => DropdownMenuItem(value: e, child: MyText.bodyMedium(e))).toList(),
                        onChanged: (val) => setState(() => controller.setStatus(val)),
                      ),
                    ),
                  ),

                  _buildRow(
                    "Combodate (date)",
                    MyContainer.bordered(
                      onTap: _selectDOB,
                      padding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                      borderRadiusAll: 4,
                      borderColor: contentTheme.secondary.withValues(alpha: 0.4),
                      child: MyText.bodyMedium(
                        controller.dob != null
                            ? "${controller.dob!.day}/${controller.dob!.month}/${controller.dob!.year}"
                            : "Select Date of Birth",
                      ),
                    ),
                  ),
                  _buildRow(
                    "Combodate (datetime)",
                    MyContainer.bordered(
                      onTap: _selectEventDateTime,
                      padding: EdgeInsets.symmetric(vertical: 12, horizontal: 8),
                      borderRadiusAll: 4,
                      borderColor: contentTheme.secondary.withValues(alpha: 0.4),
                      child: MyText.bodyMedium(
                        (controller.eventDate != null && controller.eventTime != null)
                            ? "${controller.eventDate!.day}-${controller.eventDate!.month}-${controller.eventDate!.year} ${controller.eventTime!.hour}:${controller.eventTime!.minute.toString().padLeft(2, '0')}"
                            : "Setup event date and time",
                      ),
                    ),
                  ),
                  _buildRow(
                    "Textarea",
                    TextFormField(
                      controller: controller.commentsController,
                      maxLines: 3,
                      style: MyTextStyle.bodyMedium(),
                      decoration: InputDecoration(hintText: "Your comments here...", border: OutlineInputBorder()),
                    ),
                  ),
                  _buildRow(
                    "Checklist",
                    Wrap(
                      spacing: 8,
                      children: controller.fruitOptions.map((fruit) {
                        final isSelected = controller.selectedFruits.contains(fruit);

                        return Theme(
                          data: Theme.of(context).copyWith(
                            splashColor: contentTheme.primary.withValues(alpha: 0.2),
                            highlightColor: contentTheme.primary.withValues(alpha: 0.1),
                          ),
                          child: FilterChip(
                            elevation: 0,
                            pressElevation: 0,
                            label: MyText.bodyMedium(fruit, color: isSelected ? contentTheme.primary : null),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() => controller.toggleFruit(fruit, selected));
                            },
                            selectedColor: contentTheme.primary.withValues(alpha: 0.12),
                            backgroundColor: contentTheme.secondary.withValues(alpha: 0.12),
                            checkmarkColor: contentTheme.primary,
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _selectDOB() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: controller.dob ?? DateTime.now(),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) setState(() => controller.setDOB(picked));
  }

  Future<void> _selectEventDateTime() async {
    final date = await showDatePicker(
      context: context,
      initialDate: controller.eventDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2100),
    );
    if (date != null) {
      final time = await showTimePicker(context: Get.context!, initialTime: controller.eventTime ?? TimeOfDay.now());
      if (time != null) {
        setState(() => controller.setEventDateTime(date, time));
      }
    }
  }

  TableRow _buildRow(String label, Widget child) {
    return TableRow(
      children: [
        Padding(padding: MySpacing.all(8), child: MyText.bodyMedium(label, fontWeight: 600)),
        Padding(padding: MySpacing.all(8), child: child),
      ],
    );
  }
}

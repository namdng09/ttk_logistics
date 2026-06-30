import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/ui/calendar_controller.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:syncfusion_flutter_calendar/calendar.dart' as sf_calendar;

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> with UIMixin {
  final CalendarController controller = Get.put(CalendarController());

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CalendarController>(
      init: controller,
      builder: (_) {
        return Layout(
          subScreenName: 'Calendar',
          mainScreenName: 'Dashboard',
          child: MyCard(
            shadow: MyShadow(elevation: 0.7, position: MyShadowPosition.bottom),
            height: 700,
            child: sf_calendar.SfCalendar(
              view: sf_calendar.CalendarView.week,
              controller: sf_calendar.CalendarController(),
              allowedViews: controller.allowedViews,
              dataSource: controller.events,
              allowDragAndDrop: true,
              allowAppointmentResize: true,
              allowViewNavigation: true,
              showTodayButton: true,
              showCurrentTimeIndicator: true,
              showNavigationArrow: true,
              monthViewSettings: const sf_calendar.MonthViewSettings(
                showAgenda: true,
                appointmentDisplayMode: sf_calendar.MonthAppointmentDisplayMode.appointment,
              ),
              onSelectionChanged: (details) {
                controller.onSelectDate(details);
                _showAddEventDialog(context);
              },
              onDragEnd: controller.dragEnd,
            ),
          ),
        );
      },
    );
  }

  Future<void> _showAddEventDialog(BuildContext context) {
    return showDialog<void>(
      context: context,
      builder: (_) {
        return AlertDialog(
          clipBehavior: Clip.antiAliasWithSaveLayer,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: MyText.titleMedium("Add Event", fontWeight: 600),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildTextField(controller.titleTE, "Add Title"),
              MySpacing.height(12),
              _buildTextField(controller.descriptionTE, "Add Description"),
              MySpacing.height(12),
              _buildColorSelector(),
            ],
          ),
          actionsPadding: MySpacing.nTop(20),
          actions: [
            TextButton(child: MyText.bodyMedium('Cancel'), onPressed: () => Navigator.of(context).pop()),
            TextButton(onPressed: controller.addEvent, child: MyText.bodyMedium('Add')),
          ],
        );
      },
    );
  }

  Widget _buildColorSelector() {
    return DropdownButtonFormField<Color>(
      dropdownColor: contentTheme.background,
      initialValue: controller.selectedColor,
      decoration: _inputDecoration("Select Color"),
      items: controller.colorCollection.map((color) {
        return DropdownMenuItem<Color>(
          value: color,
          child: MyText.bodyMedium(_colorToString(color), color: color, fontWeight: 600),
        );
      }).toList(),
      onChanged: (value) => controller.onSelectedColor(value!),
    );
  }

  Widget _buildTextField(TextEditingController textController, String hint) {
    return TextFormField(controller: textController, decoration: _inputDecoration(hint));
  }

  InputDecoration _inputDecoration(String hintText) {
    return InputDecoration(
      border: outlineInputBorder,
      enabledBorder: outlineInputBorder,
      focusedBorder: outlineInputBorder,
      contentPadding: MySpacing.all(12),
      filled: true,
      hintText: hintText,
      hintStyle: MyTextStyle.bodyMedium(fontWeight: 600),
    );
  }

  String _colorToString(Color color) {
    switch (color) {
      case Colors.red:
        return 'Red';
      case Colors.blue:
        return 'Blue';
      case Colors.green:
        return 'Green';
      case Colors.yellow:
        return 'Yellow';
      case Colors.pink:
        return 'Pink';
      case Colors.purple:
        return 'Purple';
      case Colors.brown:
        return 'Brown';
      default:
        return 'Color';
    }
  }
}

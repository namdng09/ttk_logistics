import 'package:flutter/material.dart';
import 'package:ttk_logistics/controller/my_controller.dart';

class RangeSliderController extends MyController {
  double defaultSliderValue = 10;
  RangeValues defaultSlider = RangeValues(550, 1000);
  RangeValues prefixSlider = RangeValues(200, 800);
  RangeValues rangeSlider = RangeValues(-500, 500);
  final double step = 250;
  final int stepDivisions = 2000 ~/ 250;
  RangeValues stepValue = RangeValues(-500, 500);
  final List<String> customValues = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  final double customMin = 0;
  final double customMax = 11;
  RangeValues values = RangeValues(3, 8);
  double labelSliderValue = 50;
  double tickSliderValue = 0;
  double dividerSliderValue = 50;

  DateTime yearValue = DateTime(2017, 01, 01);
  DateTime hourValue = DateTime(2020, 01, 01, 13, 00, 00);

  DateTime dateValue = DateTime(2016, 1, 01);
  double stepSliderValue = 0;

  void onDefaultSlider(double value) {
    defaultSliderValue = value;
    update();
  }

  void onMinAndMaxRangeSlider(RangeValues value) {
    defaultSlider = value;
    update();
  }

  void onPrefixSlider(RangeValues value) {
    prefixSlider = value;
    update();
  }

  void onRangeSlider(RangeValues value) {
    rangeSlider = value;
    update();
  }

  void onStepSlider(RangeValues values) {
    stepValue = RangeValues(
      (values.start / step).round() * step,
      (values.end / step).round() * step,
    );
    update();
  }

  void onCustomValues(RangeValues value) {
    values = value;
    update();
  }

  void onHourSlider(DateTime value){
    hourValue = value;
    update();
  }

  void onYearSlider(DateTime value){
    yearValue = value;
    update();
  }

  void onDividerSlider(double value){
    dividerSliderValue = value;
    update();
  }

  void onTickSlider(double value){
    tickSliderValue = value;
    update();
  }

  void onLabelSlider(double value) {
    labelSliderValue = value;
    update();
  }

  void onStepSliderValue(double value) {
    stepSliderValue = value;
    update();
  }

  void onDateValue(DateTime value){
    dateValue = value;
    update();
  }
}
import 'package:ttk_logistics/helper/extensions/extensions.dart';
import 'package:flutter/material.dart';

class Utils {
  static String getDateStringFromDateTime(DateTime dateTime, {bool showMonthShort = false}) {
    String date = dateTime.day < 10 ? "0${dateTime.day}" : dateTime.day.toString();
    late String month;
    if (showMonthShort) {
      month = dateTime.getMonthName();
    } else {
      month = dateTime.month < 10 ? "0${dateTime.month}" : dateTime.month.toString();
    }

    String year = dateTime.year.toString();
    String separator = showMonthShort ? " " : "/";
    return "$date$separator$month$separator$year";
  }

  static String getTimeStringFromDateTime(DateTime dateTime, {bool showSecond = true}) {
    String hour = dateTime.hour.toString();
    if (dateTime.hour > 12) {
      hour = (dateTime.hour - 12).toString();
    }

    String minute = dateTime.minute < 10 ? "0${dateTime.minute}" : dateTime.minute.toString();
    String second = "";

    if (showSecond) {
      second = dateTime.second < 10 ? "0${dateTime.second}" : dateTime.second.toString();
    }
    String meridian = "";
    meridian = dateTime.hour < 12 ? " AM" : " PM";

    return "$hour:$minute${showSecond ? ":" : ""}$second$meridian";
  }

  static String getDateTimeStringFromDateTime(
    DateTime dateTime, {
    bool showSecond = true,
    bool showDate = true,
    bool showTime = true,
    bool showMonthShort = false,
  }) {
    if (showDate && !showTime) {
      return getDateStringFromDateTime(dateTime);
    } else if (!showDate && showTime) {
      return getTimeStringFromDateTime(dateTime, showSecond: showSecond);
    }
    return "${getDateStringFromDateTime(dateTime, showMonthShort: showMonthShort)} ${getTimeStringFromDateTime(dateTime, showSecond: showSecond)}";
  }

  static String getStorageStringFromByte(int bytes) {
    double b = bytes.toDouble(); //1024
    double k = bytes / 1024; //1
    double m = k / 1024; //0.001
    double g = m / 1024; //...
    double t = g / 1024; //...

    if (t >= 1) {
      return "${t.toStringAsFixed(2)} TB";
    } else if (g >= 1) {
      return "${g.toStringAsFixed(2)} GB";
    } else if (m >= 1) {
      return "${m.toStringAsFixed(2)} MB";
    } else if (k >= 1) {
      return "${k.toStringAsFixed(2)} KB";
    } else {
      return "${b.toStringAsFixed(2)} Bytes";
    }
  }

  /// 🟢 Trả về màu tương ứng với trạng thái chuyến xe
  static Color getStatusColor(String? status) {
    if (status == null) return Colors.grey;
    final s = status.toLowerCase();

    if (s.contains("chờ")) return Colors.orange;
    if (s.contains("đang") || s.contains("thực hiện")) return Colors.blue;
    if (s.contains("hoàn")) return Colors.green;
    if (s.contains("hủy")) return Colors.grey;

    return Colors.teal;
  }

  /// 🟣 Màu nền nhạt cho tag trạng thái
  static Color getStatusBackground(String? status) {
    final base = getStatusColor(status);
    return base.withOpacity(0.15);
  }

  /// 🔵 Biểu tượng phù hợp với trạng thái
  static IconData getStatusIcon(String? status) {
    if (status == null) return Icons.circle_outlined;
    final s = status.toLowerCase();

    if (s.contains("chờ")) return Icons.hourglass_bottom;
    if (s.contains("đang") || s.contains("thực hiện")) return Icons.play_circle_outline;
    if (s.contains("hoàn")) return Icons.check_circle_outline;
    if (s.contains("hủy")) return Icons.cancel_outlined;

    return Icons.circle_outlined;
  }
}

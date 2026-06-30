// ignore_for_file: avoid_web_libraries_in_flutter
import 'package:printing/printing.dart';

/// Đảm bảo plugin `printing` được bundle vào web release build.
/// Gọi một hàm thật từ plugin để tránh bị tree-shake.
void registerWebPlugins() {
  // Thực hiện 1 lệnh giả để ép Flutter giữ plugin trong bundle
  // Không cần await, chỉ gọi một hàm sync là đủ
  Printing.info();
}

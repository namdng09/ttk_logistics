import 'package:get/get.dart';
import 'package:ttk_logistics/controller/my_controller.dart';

class Error404Controller extends MyController {
  void goToHome() {
    Get.offNamed('/dashboard');
  }
}
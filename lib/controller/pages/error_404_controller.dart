import 'package:get/get.dart';
import 'package:kho555/controller/my_controller.dart';

class Error404Controller extends MyController {
  void goToHome() {
    Get.offNamed('/dashboard');
  }
}
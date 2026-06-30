import 'package:kho555/controller/my_controller.dart';

class PaginationController extends MyController {
  int roundedPagination = 2;

  void goToRoundPagination(int page) {
    roundedPagination = page;
    update();
  }
}
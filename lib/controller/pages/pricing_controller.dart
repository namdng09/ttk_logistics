import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/utils/my_utils.dart';

class PricingController extends MyController {
  List<String> dummyTexts = List.generate(12, (index) => MyTextUtils.getDummyText(60));
  int isSelect = 0;

  void toggleTab(int id){
    isSelect = id;
    update();
  }
}

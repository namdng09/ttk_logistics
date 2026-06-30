import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/widgets/my_text_utils.dart';

class BadgesController extends MyController {
  List<String> dummyTexts = List.generate(12, (index) => MyTextUtils.getDummyText(60));
}

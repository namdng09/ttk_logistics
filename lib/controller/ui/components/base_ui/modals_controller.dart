import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/widgets/my_text_utils.dart';

class ModalsController extends MyController {
  List<String> dummyTexts =
  List.generate(12, (index) => MyTextUtils.getDummyText(60));
}
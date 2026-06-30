import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/helper/widgets/my_text_utils.dart';

class AlertsController extends MyController {
  List<String> dummyTexts = List.generate(12, (index) => MyTextUtils.getDummyText(60));
  List<String> liveMessage =[];
  List dismissingAlerts = [
    {"colorName": "Primary", "color": "0xff007bff"},
    {"colorName": "Secondary", "color": "0xff6c757d"},
    {"colorName": "Success", "color": "0xff28a745"},
    {"colorName": "Error", "color": "0xffdc3545"},
    {"colorName": "Warning", "color": "0xffffc107"},
    {"colorName": "Info", "color": "0xff17a2b8"},
    {"colorName": "Pink", "color": "0xffe83e8c"},
    {"colorName": "Purple", "color": "0xff6f42c1"},
    {"colorName": "Light", "color": "0xfff8f9fa"},
    {"colorName": "Dark", "color": "0xff343a40"},
  ];

  void addLiveMessage(){
    liveMessage.add("Nice, you triggered this alert message!");
    update();
  }

  void removeLiveMessage(int index){
    liveMessage.removeAt(index);
    update();
  }

  void removeColorToggle(int index) {
    dismissingAlerts.removeAt(index);
    update();
  }
}

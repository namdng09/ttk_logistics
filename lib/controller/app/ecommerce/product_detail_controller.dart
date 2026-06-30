import 'package:ttk_logistics/controller/my_controller.dart';

class ProductDetailController extends MyController {
  String selectedImage = 'assets/product/img-7.png';
  int isSelectColorImage = 0;
  List images = ['assets/product/img-7.png', 'assets/product/img-8.png', 'assets/product/img-9.png', 'assets/product/img-11.png'];

  List<Map<String, String>> reviewList = [
    {'name': 'James', 'comment': 'To an English person, it will seem like simplified English, as a skeptical Cambridge', 'date': '11 Feb, 2020'},
    {'name': 'David', 'comment': 'Everyone realizes why a new common language would be desirable', 'date': '22 Jan, 2020'},
    {'name': 'Scott', 'comment': 'If several languages coalesce, the grammar of the resulting', 'date': '04 Jan, 2020'},
  ];

  void onChangeImage(String image) {
    selectedImage = image;
    update();
  }

  void onChangeSelectedColorImage(int id) {
    isSelectColorImage = id;
    update();
  }
}

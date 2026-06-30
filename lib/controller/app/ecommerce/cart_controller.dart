import 'package:ttk_logistics/controller/my_controller.dart';

class CartController extends MyController {
  final List<Map<String, dynamic>> products = [
    {'image': 'assets/product/img-7.png', 'name': 'Home & Office Chair', 'color': 'Green', 'price': 200, 'quantity': 2},
    {'image': 'assets/product/img-8.png', 'name': 'Home & Office Chair', 'color': 'Cream', 'price': 225, 'quantity': 1},
    {'image': 'assets/product/img-9.png', 'name': 'Home & Office Chair', 'color': 'White', 'price': 275, 'quantity': 2},
    {'image': 'assets/product/img-11.png', 'name': 'Home & Office Chair', 'color': 'Blue', 'price': 275, 'quantity': 1},
  ];

  void incrementQuantity(Map product) {
    product['quantity'] = (product['quantity'] as int) + 1;
    update();
  }

  void decrementQuantity(Map product) {
    if (product['quantity'] > 1) {
      product['quantity'] = (product['quantity'] as int) - 1;
      update();
    }
  }

  double get subTotal => products.fold(0, (sum, item) => sum + item['price'] * item['quantity']);
}

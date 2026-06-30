import 'package:kho555/controller/my_controller.dart';

class InvoiceController extends MyController {
  List<InvoiceItem> items = [
    InvoiceItem(item: 'BS-200', price: 10.99, quantity: 1),
    InvoiceItem(item: 'BS-400', price: 20.00, quantity: 3),
    InvoiceItem(item: 'BS-1000', price: 600.00, quantity: 1),
  ];

  double shipping = 15.0;

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.total);
  double get total => subtotal + shipping;

  void addItem(InvoiceItem item) {
    items.add(item);
    update(); // notifies GetBuilder
  }

  void removeItem(int index) {
    items.removeAt(index);
    update(); // notifies GetBuilder
  }
}

class InvoiceItem {
  final String item;
  final double price;
  final int quantity;

  InvoiceItem({required this.item, required this.price, required this.quantity});

  double get total => price * quantity;
}

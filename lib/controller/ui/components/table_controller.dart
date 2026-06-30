import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/images.dart';

class TableController extends MyController  {
  final List<StripedData> striped = [
    StripedData('Risa D. Pearson', 'AC336 508 2157', 'July 24, 1950', Images.users[2]),
    StripedData('Ann C. Thompson', 'SB646 473 2057', 'January 25, 1959', Images.users[3]),
    StripedData('Paul J. Friend', 'DL281 308 0793', 'September 1, 1939', Images.users[4]),
    StripedData('Sean C. Nguyen', 'CA269 714 6825', 'February 5, 1994', Images.users[5]),
  ];

  final List<TableHeadData> tableHead = [
    TableHeadData('ASOS Ridley High Waist', 'FedEx', 100, 'Delivered'),
    TableHeadData('Marco Lightweight Shirt', 'DHL', 50, 'Shipped'),
    TableHeadData('Half Sleeve Shirt', 'Bright', 25, 'Order Received'),
    TableHeadData('Lightweight Jacket', 'FedEx', 100, 'Delivered'),
    TableHeadData('Cargo Pant & Shirt', 'FedEx', 10, 'Payment Failed'),
  ];

  final List<HoverableData> hoverable = [
    HoverableData('ASOS Ridley High Waist', 79.49, 82, 6518.18),
    HoverableData('Marco Lightweight Shirt', 128.50, 37, 4754.50),
    HoverableData('Half Sleeve Shirt', 39.99, 64, 2559.36),
    HoverableData('Lightweight Jacket', 20.00, 184, 3680.00),
  ];

  final List<SmallTableData> smallTableData = [
    SmallTableData('ASOS Ridley High Waist', 79.49, 82, 6518.18),
    SmallTableData('Marco Lightweight Shirt', 128.50, 37, 4754.50),
    SmallTableData('Half Sleeve Shirt', 39.99, 64, 2559.36),
    SmallTableData('Lightweight Jacket', 20.00, 184, 3680.00),
    SmallTableData('Marco Shoes', 28.49, 69, 1965.81),
  ];


}

class StripedData {
  final String name;
  final String accountNo;
  final String balance;
  final String imagePath;

  StripedData(this.name, this.accountNo, this.balance, this.imagePath);
}

class TableHeadData {
  final String product;
  final String courier;
  final double progress;
  final String status;

  TableHeadData(this.product, this.courier, this.progress, this.status);
}

class HoverableData {
  final String product;
  final double price;
  final int quantity;
  final double amount;

  HoverableData(this.product, this.price, this.quantity, this.amount);
}

class SmallTableData {
  final String product;
  final double price;
  final int quantity;
  final double amount;

  SmallTableData(this.product, this.price, this.quantity, this.amount);
}

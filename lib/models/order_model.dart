import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:kho555/helper/services/json_decoder.dart';
import 'package:kho555/models/identifier_model.dart';

class OrderModel extends IdentifierModel {
  final String orderID, date, customer, amount, status;

  OrderModel(super.id, this.orderID, this.date, this.customer, this.amount, this.status);

  static OrderModel fromJSON(Map<String, dynamic> json) {
    JSONDecoder decoder = JSONDecoder(json);

    String orderID = decoder.getString('orderId');
    String date = decoder.getString('date');
    String customer = decoder.getString('customer');
    String amount = decoder.getString('amount');
    String status = decoder.getString('status');

    return OrderModel(decoder.getId, orderID, date, customer, amount, status);
  }

  static List<OrderModel> listFromJSON(List<dynamic> list) {
    return list.map((e) => OrderModel.fromJSON(e)).toList();
  }

  static List<OrderModel>? _dummyList;

  static Future<List<OrderModel>> get dummyList async {
    if (_dummyList == null) {
      dynamic data = json.decode(await getData());
      _dummyList = listFromJSON(data);
    }

    return _dummyList!;
  }

  static Future<String> getData() async {
    return await rootBundle.loadString('assets/data/order.json');
  }
}

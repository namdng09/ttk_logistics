import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:kho555/helper/services/json_decoder.dart';
import 'package:kho555/models/identifier_model.dart';

class CustomerModel extends IdentifierModel {
  final String customer, email, phone, joiningDate;
  final int walletBalance;

  CustomerModel(super.id, this.customer, this.email, this.phone, this.joiningDate, this.walletBalance);

  static CustomerModel fromJSON(Map<String, dynamic> json) {
    JSONDecoder decoder = JSONDecoder(json);

    String customer = decoder.getString('customer');
    String email = decoder.getString('email');
    String phone = decoder.getString('phone');
    String joiningDate = decoder.getString('joiningDate');
    int walletBalance = decoder.getInt('walletBalance');

    return CustomerModel(decoder.getId, customer, email, phone, joiningDate, walletBalance);
  }

  static List<CustomerModel> listFromJSON(List<dynamic> list) {
    return list.map((e) => CustomerModel.fromJSON(e)).toList();
  }

  static List<CustomerModel>? _dummyList;

  static Future<List<CustomerModel>> get dummyList async {
    if (_dummyList == null) {
      dynamic data = json.decode(await getData());
      _dummyList = listFromJSON(data);
    }

    return _dummyList!;
  }

  static Future<String> getData() async {
    return await rootBundle.loadString('assets/data/customer.json');
  }
}

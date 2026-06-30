import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:kho555/helper/services/json_decoder.dart';
import 'package:kho555/models/identifier_model.dart';

class ProductModel extends IdentifierModel {
  final String name, image, category;
  final String? discount;
  final int price;
  final int? originalPrice;
  final double rating;

  ProductModel(super.id, this.name, this.image, this.discount, this.price, this.originalPrice, this.rating, this.category);

  static ProductModel fromJSON(Map<String, dynamic> json) {
    JSONDecoder decoder = JSONDecoder(json);

    return ProductModel(
      decoder.getId,
      decoder.getString('name'),
      decoder.getString('image'),
      decoder.getStringOrNull('discount'),
      decoder.getInt('price'),
      decoder.getIntOrNull('originalPrice'),
      decoder.getDouble('rating'),
      decoder.getString('category'),
    );
  }

  static List<ProductModel> listFromJSON(List<dynamic> list) {
    return list.map((e) => ProductModel.fromJSON(e)).toList();
  }

  static List<ProductModel>? _dummyList;

  static Future<List<ProductModel>> get dummyList async {
    if (_dummyList == null) {
      dynamic data = json.decode(await getData());
      _dummyList = listFromJSON(data);
    }
    return _dummyList!;
  }

  static Future<String> getData() async {
    return await rootBundle.loadString('assets/data/products.json');
  }
}

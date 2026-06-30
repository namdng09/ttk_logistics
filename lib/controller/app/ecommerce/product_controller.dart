import 'package:flutter/material.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/models/product_model.dart';

class ProductController extends MyController {
  List<ProductModel> allProducts = [];
  List<ProductModel> products = [];

  String searchText = '';
  String selectedCategory = 'All';
  String selectedRange = 'All';
  RangeValues rangeValues = RangeValues(1, 1000);
  String? selectedDiscount;
  int? selectedRating;

  final Map<String, String> discountOptions = {
    "50": "50% or more",
    "40": "40% or more",
    "30": "30% or more",
    "25": "25% or more",
    "10": "10% or more",
    "less10": "Less than 10%",
  };

  final List<int> ratings = [5, 4, 3, 2, 1];
  final List<String> ranges = ['All', '\$1 - \$10', '\$10 - \$100', '\$100 - \$500', '\$500'];

  @override
  void onInit() {
    ProductModel.dummyList.then((value) {
      allProducts = value;
      products = List.from(allProducts);
      update();
    });
    applyFilters();
    super.onInit();
  }

  void applyFilters() {
    products = allProducts.where((product) {
      if (searchText.isNotEmpty && !product.name.toLowerCase().contains(searchText.toLowerCase())) {
        return false;
      }

      if (selectedCategory != 'All' && product.category != selectedCategory) {
        return false;
      }

      if (product.price < rangeValues.start || product.price > rangeValues.end) {
        return false;
      }

      if (selectedDiscount != null) {
        int discountValue = selectedDiscount == 'less10' ? 10 : int.tryParse(selectedDiscount!) ?? 0;
        int actualDiscount = _getDiscountPercent(product);

        if (selectedDiscount == 'less10') {
          if (actualDiscount >= 10) return false;
        } else {
          if (actualDiscount < discountValue) return false;
        }
      }

      if (selectedRating != null && product.rating < selectedRating!) {
        return false;
      }

      return true;
    }).toList();

    update();
  }

  int _getDiscountPercent(ProductModel p) {
    if (p.originalPrice == null || p.originalPrice == 0) return 0;
    return ((p.originalPrice! - p.price) / p.originalPrice! * 100).round();
  }
}

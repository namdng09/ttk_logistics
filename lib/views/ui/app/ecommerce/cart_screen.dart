import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/app/ecommerce/cart_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> with UIMixin {
  late CartController controller;

  @override
  void initState() {
    controller = Get.put(CartController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        const double discount = 30;
        const double shipping = 15;
        double total = controller.subTotal - discount + shipping;
        return Layout(
          subScreenName: 'Cart',
          mainScreenName: 'Ecommerce',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            borderRadiusAll: 4,
            child: Column(
              children: [
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: DataTable(
                    columnSpacing: 215,
                    headingRowHeight: 70,
                    dataRowMaxHeight: 80,
                    columns: [
                      DataColumn(label: MyText.bodyMedium("Product", fontWeight: 600)),
                      DataColumn(label: MyText.bodyMedium("Product Desc", fontWeight: 600)),
                      DataColumn(label: MyText.bodyMedium("Price", fontWeight: 600)),
                      DataColumn(label: MyText.bodyMedium("Quantity", fontWeight: 600)),
                      DataColumn(label: MyText.bodyMedium("Total", fontWeight: 600)),
                      DataColumn(label: Center(child: MyText.bodyMedium("Action", fontWeight: 600))),
                    ],
                    rows: controller.products.map((product) {
                      double totalPrice = product['price'].toDouble() * product['quantity'].toDouble();

                      return DataRow(
                        cells: [
                          DataCell(Image.asset(product['image'], width: 60, height: 60)),
                          DataCell(
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [MyText.bodyMedium(product['name'], fontWeight: 600), MyText.bodyMedium("Color: ${product['color']}")],
                            ),
                          ),
                          DataCell(MyText.bodyMedium("\$ ${product['price']}")),
                          DataCell(
                            MyContainer.bordered(
                              paddingAll: 12,
                              borderColor: contentTheme.secondary.withValues(alpha: 0.2),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  InkWell(
                                    onTap: () {
                                      controller.decrementQuantity(product);
                                    },
                                    child: Icon(RemixIcons.subtract_line, size: 16, color: contentTheme.secondary),
                                  ),
                                  MySpacing.width(8),
                                  MyText.bodyMedium(product['quantity'].toString().padLeft(2, '0'), fontWeight: 600),
                                  MySpacing.width(8),
                                  InkWell(
                                    onTap: () {
                                      controller.incrementQuantity(product);
                                    },
                                    child: Icon(RemixIcons.add_line, size: 16, color: contentTheme.secondary),
                                  ),
                                ],
                              ),
                            ),
                          ),

                          DataCell(MyText.bodyMedium("\$ $totalPrice")),
                          DataCell(
                            IconButton(
                              onPressed: () {},
                              icon: Icon(Icons.delete, color: Colors.red),
                            ),
                          ),
                        ],
                      );
                    }).toList(),
                  ),
                ),
                MySpacing.height(20),
                Align(
                  alignment: Alignment.centerRight,
                  child: MyContainer(
                    width: 600,
                    padding: MySpacing.symmetric(horizontal: 16, vertical: 12),
                    color: contentTheme.secondary.withValues(alpha: 0.1),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        rowTotal(label: "Sub Total", amount: controller.subTotal),
                        rowTotal(label: "Discount", amount: -discount),
                        rowTotal(label: "Shipping Charge", amount: shipping),
                        const Divider(),
                        rowTotal(label: "Total", amount: total, isBold: true),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget rowTotal({required String label, required double amount, bool isBold = false}) {
    return Padding(
      padding: MySpacing.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          Expanded(child: MyText.bodyMedium('$label :', textAlign: TextAlign.right, fontWeight: 600)),
          MySpacing.width(12),
          SizedBox(
            width: 80,
            child: MyText.bodyMedium("\$ ${amount.toStringAsFixed(2)}", fontWeight: isBold ? 600 : 500, textAlign: TextAlign.end),
          ),
        ],
      ),
    );
  }
}

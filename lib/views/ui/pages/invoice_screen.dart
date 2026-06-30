import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/invoice_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/images.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class InvoiceScreen extends StatefulWidget {
  const InvoiceScreen({super.key});

  @override
  State<InvoiceScreen> createState() => _InvoiceScreenState();
}

class _InvoiceScreenState extends State<InvoiceScreen> with UIMixin {
  late InvoiceController controller;

  @override
  void initState() {
    controller = Get.put(InvoiceController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Invoice',
          mainScreenName: 'Pages',
          child: MyCard(
            shadow: MyShadow(elevation: 0.7, position: MyShadowPosition.bottom),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [Image.asset(Images.logoDark, height: 20), MyText.bodyMedium("Order # 12345", fontWeight: 600)],
                ),
                Divider(height: 40),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyText.bodyMedium("Billed To:", fontWeight: 600),
                          MyText.bodyMedium('''Ricky Clemons
1234 Main
Apt. 4B
Springfield, ST 54321
'''),
                          MyText.bodyMedium("Payment Method:", fontWeight: 600),
                          MyText.bodyMedium('''Visa ending **** 4242
RClemons@email.com
'''),
                        ],
                      ),
                    ),
                    MySpacing.width(40),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          MyText.bodyMedium("Shipped To:", fontWeight: 600),
                          MyText.bodyMedium('''Kenny Rigdon
1234 Main
Apt. 4B
Springfield, ST 54321
''', textAlign: TextAlign.end),
                          MyText.bodyMedium("Order Date:", fontWeight: 600),
                          MyText.bodyMedium('October 7, 2016'),
                        ],
                      ),
                    ),
                  ],
                ),
                MyText.titleLarge("Order summary", fontWeight: 600),
                MySpacing.height(12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Table(
                      border: TableBorder.all(color: Colors.grey.shade300),
                      columnWidths: {0: FlexColumnWidth(3), 1: FlexColumnWidth(2), 2: FlexColumnWidth(2), 3: FlexColumnWidth(2)},
                      children: [
                        _buildTableHeaderRow(),
                        ...controller.items.map(_buildTableItemRow),
                        _buildSummaryRow("Subtotal", "\$${controller.subtotal.toStringAsFixed(2)}"),
                        _buildSummaryRow("Shipping", "\$${controller.shipping.toStringAsFixed(2)}"),
                        _buildTotalRow("Total", "\$${controller.total.toStringAsFixed(2)}"),
                      ],
                    ),
                    SizedBox(height: 24),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Wrap(
                        spacing: 12,
                        children: [
                          MyContainer(
                            color: contentTheme.success,
                            paddingAll: 12,
                            onTap: (){},
                            child: Icon(RemixIcons.printer_line,color: contentTheme.onSuccess, size: 18 ),
                          ),
                          MyContainer(
                            color: contentTheme.primary,
                            paddingAll: 12,
                            onTap: (){},
                            child: MyText.bodyMedium("Send",color: contentTheme.onPrimary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  TableRow _buildTableHeaderRow() {
    return TableRow(
      decoration: BoxDecoration(color: Color(0xFFF5F5F5)),
      children: [
        Padding(padding: MySpacing.all(12), child: MyText.titleMedium("Item", fontWeight: 600)),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.titleMedium("Price", textAlign: TextAlign.center, fontWeight: 600),
        ),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.titleMedium("Quantity", textAlign: TextAlign.center, fontWeight: 600),
        ),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.titleMedium("Totals", textAlign: TextAlign.end, fontWeight: 600),
        ),
      ],
    );
  }

  TableRow _buildTableItemRow(InvoiceItem item) {
    return TableRow(
      children: [
        Padding(padding: MySpacing.all(12), child: MyText.bodyMedium(item.item)),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.bodyMedium("\$${item.price.toStringAsFixed(2)}", textAlign: TextAlign.center),
        ),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.bodyMedium("${item.quantity}", textAlign: TextAlign.center),
        ),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.bodyMedium("\$${item.total.toStringAsFixed(2)}", textAlign: TextAlign.end),
        ),
      ],
    );
  }

  TableRow _buildSummaryRow(String label, String value) {
    return TableRow(
      children: [
        SizedBox(),
        SizedBox(),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.bodyMedium(label, fontWeight: 600, textAlign: TextAlign.center),
        ),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.bodyMedium(value, textAlign: TextAlign.end),
        ),
      ],
    );
  }

  TableRow _buildTotalRow(String label, String value) {
    return TableRow(
      children: [
        SizedBox(),
        SizedBox(),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.bodyMedium(label, fontWeight: 700, textAlign: TextAlign.center),
        ),
        Padding(
          padding: MySpacing.all(12),
          child: MyText.bodyLarge(value, fontWeight: 700, textAlign: TextAlign.end),
        ),
      ],
    );
  }
}

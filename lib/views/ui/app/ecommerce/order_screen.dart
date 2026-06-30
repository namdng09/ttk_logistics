import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/app/ecommerce/orders_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/models/order_model.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class OrderScreen extends StatefulWidget {
  const OrderScreen({super.key});
  @override
  State<OrderScreen> createState() => _OrderScreenState();
}

class _OrderScreenState extends State<OrderScreen> with UIMixin {
  late OrdersController controller;

  @override
  void initState() {
    controller = Get.put(OrdersController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<OrdersController>(
      builder: (ctrl) => Layout(
        subScreenName: 'Orders',
        mainScreenName: 'Ecommerce',
        child: MyCard(
          shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
          borderRadiusAll: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [customTab(0, 'All Orders'), customTab(1, 'Active'), customTab(2, 'Unpaid')]),
              Divider(),
              MySpacing.height(12),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  MyText.bodyMedium('Search:', fontWeight: 600),
                  MySpacing.width(8),
                  SizedBox(
                    width: MediaQuery.of(context).size.width / 8,
                    child: TextFormField(
                      onChanged: ctrl.onSearchChanged,
                      decoration: InputDecoration(isDense: true, isCollapsed: true, contentPadding: MySpacing.all(12), border: OutlineInputBorder()),
                    ),
                  ),
                ],
              ),
              MySpacing.height(12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  showCheckboxColumn: false,
                  checkboxHorizontalMargin: 0,
                  columnSpacing: 150,
                  columns: [
                    DataColumn(
                      label: Theme(
                    data:ThemeData(
                      visualDensity: VisualDensity.compact,
                    ),
                        child: Checkbox(
                          value: ctrl.filteredOrders.isNotEmpty &&
                              ctrl.multiSelectedIds.length == ctrl.filteredOrders.length,
                          tristate: true,
                          onChanged: (val) {
                            ctrl.toggleSelectAll(val);
                          },
                        ),
                      ),
                    ),
                    const DataColumn(label: MyText.bodyMedium('Order ID', fontWeight: 600)),
                    const DataColumn(label: MyText.bodyMedium('Date', fontWeight: 600)),
                    const DataColumn(label: MyText.bodyMedium('Billing Name', fontWeight: 600)),
                    const DataColumn(label: MyText.bodyMedium('Total', fontWeight: 600)),
                    const DataColumn(label: MyText.bodyMedium('Payment Status', fontWeight: 600)),
                    const DataColumn(label: MyText.bodyMedium('Invoice', fontWeight: 600)),
                    const DataColumn(label: MyText.bodyMedium('Action', fontWeight: 600)),
                  ],
                  rows: ctrl.filteredOrders.map((order) {
                    final isSingleSelected = ctrl.singleSelectedOrderId == order.orderID;
                    final isMultiSelected = ctrl.multiSelectedIds.contains(order.orderID);

                    return DataRow(
                      selected: isSingleSelected || isMultiSelected,
                      onSelectChanged: (_) => ctrl.toggleSingleSelection(order.orderID),
                      cells: [
                        DataCell(
                          Theme(
                            data: ThemeData(visualDensity: VisualDensity.compact,),
                            child: Checkbox(
                              value: isMultiSelected,
                              onChanged: (_) => ctrl.toggleMultiSelection(order.orderID),
                            ),
                          ),
                        ),
                        DataCell(MyText.bodyMedium(order.orderID)),
                        DataCell(MyText.bodyMedium(order.date)),
                        DataCell(MyText.bodyMedium(order.customer)),
                        DataCell(MyText.bodyMedium(order.amount)),
                        DataCell(
                          MyContainer(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            color: _getStatusColor(order).withValues(alpha: 0.1),
                            child: MyText.labelMedium(
                              order.status,
                              color: _getStatusColor(order),
                              fontWeight: 600,
                            ),
                          ),
                        ),
                        DataCell(
                          MyContainer.bordered(
                            onTap: () {},
                            borderRadiusAll: 100,
                            marginAll: 4,
                            paddingAll: 12,
                            child: Row(
                              children: [
                                MyText.bodyMedium('Invoice'),
                                MySpacing.width(4),
                                Icon(RemixIcons.download_fill, size: 16),
                              ],
                            ),
                          ),
                        ),
                        DataCell(
                          Row(
                            children: [
                              Icon(RemixIcons.pencil_fill, size: 16,color: contentTheme.primary),
                              MySpacing.width(4),
                              Icon(RemixIcons.delete_bin_5_fill, size: 16,color: contentTheme.danger),
                            ],
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget customTab(int id, String title) {
    final isSel = controller.isSelectedTab == id;
    return MyContainer.none(
      onTap: () => controller.onSelectedTab(id),
      color: isSel ? contentTheme.secondary.withValues(alpha: 0.15) : null,
      bordered: isSel,
      paddingAll: 12,
      border: Border(bottom: BorderSide(color: contentTheme.primary)),
      child: MyText.bodyMedium(title, fontWeight: 600, color: isSel ? contentTheme.primary : null),
    );
  }

  Color _getStatusColor(OrderModel order) {
    switch (order.status) {
      case 'Paid':
        return Colors.green;
      case 'Unpaid':
        return Colors.orange;
      case 'Chargeback':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

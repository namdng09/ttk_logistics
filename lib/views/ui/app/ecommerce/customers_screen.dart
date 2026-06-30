import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/app/ecommerce/customers_controller.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> with UIMixin {
  late CustomersController controller;

  @override
  void initState() {
    controller = Get.put(CustomersController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<CustomersController>(
      builder: (ctrl) => Layout(
        subScreenName: 'Customers',
        mainScreenName: 'Customer',
        child: MyCard(
          shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
          borderRadiusAll: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyContainer(
                onTap: () {},
                color: contentTheme.success,
                paddingAll: 12,
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(RemixIcons.add_line, color: contentTheme.onSuccess, size: 16),
                    MyText.bodyMedium('Add Customer', color: contentTheme.onSuccess),
                  ],
                ),
              ),
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
                  onSelectAll: ctrl.toggleSelectAll,
                  checkboxHorizontalMargin: 0,
                  columnSpacing: 130,
                  columns: [
                    DataColumn(
                      label: Theme(
                        data: ThemeData(visualDensity: VisualDensity.compact),
                        child: Checkbox(value: ctrl.isAllSelected, tristate: true, onChanged: (val) => ctrl.toggleSelectAll(val)),
                      ),
                    ),
                    DataColumn(label: MyText.bodyMedium('Customer', fontWeight: 600)),
                    DataColumn(label: MyText.bodyMedium('Email', fontWeight: 600)),
                    DataColumn(label: MyText.bodyMedium('Phone', fontWeight: 600)),
                    DataColumn(label: MyText.bodyMedium('Wallet Balance', fontWeight: 600)),
                    DataColumn(label: MyText.bodyMedium('Joining Date', fontWeight: 600)),
                    DataColumn(label: MyText.bodyMedium('Action', fontWeight: 600)),
                  ],
                  rows: ctrl.filteredCustomers.map((c) {
                    final isSelected = ctrl.selectedIds.contains(c.id);
                    return DataRow(
                      selected: isSelected,
                      onSelectChanged: (_) => ctrl.toggleSelection(c.id),
                      cells: [
                        DataCell(
                          Theme(
                            data: ThemeData(visualDensity: VisualDensity.compact),
                            child: Checkbox(value: isSelected, onChanged: (_) => ctrl.toggleSelection(c.id)),
                          ),
                        ),
                        DataCell(MyText.bodyMedium(c.customer)),
                        DataCell(MyText.bodyMedium(c.email)),
                        DataCell(MyText.bodyMedium(c.phone)),
                        DataCell(MyText.bodyMedium(c.walletBalance.toString())),
                        DataCell(MyText.bodyMedium(c.joiningDate)),
                        DataCell(
                          Row(
                            children: [
                              Icon(RemixIcons.pencil_fill, size: 16, color: contentTheme.primary),
                              MySpacing.width(4),
                              Icon(RemixIcons.delete_bin_5_fill, size: 16, color: contentTheme.danger),
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
}

import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/app/ecommerce/checkout_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';
import 'package:ttk_logistics/images.dart';
import 'package:ttk_logistics/views/layout/layout.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> with UIMixin {
  late CheckoutController controller;
  late OutlineInputBorder border;

  @override
  void initState() {
    controller = Get.put(CheckoutController());
    border = OutlineInputBorder(borderSide: BorderSide(color: contentTheme.secondary.withValues(alpha: 0.2), width: 1));
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        double subtotal = controller.products.fold(0, (sum, item) => sum + item.totalPrice);

        return Layout(
          subScreenName: 'Checkout',
          mainScreenName: 'Ecommerce',
          child: MyFlex(
            children: [
              ...buildCardItems(),
              MyFlexItem(sizes: 'lg-8', child: productShippingInformation()),
              MyFlexItem(
                sizes: 'lg-4',
                child: MyCard(
                  shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
                  borderRadiusAll: 4,
                  child: MyContainer.none(
                    color: contentTheme.secondary.withValues(alpha: 0.1),
                    child: Table(
                      columnWidths: const {0: FixedColumnWidth(100), 1: FlexColumnWidth(), 2: FixedColumnWidth(80)},
                      border: TableBorder(horizontalInside: BorderSide(color: Colors.grey.shade300)),
                      children: [
                        TableRow(
                          children: [
                            Padding(padding: MySpacing.all(8), child: MyText.bodyMedium("Photo", fontWeight: 600)),
                            Padding(padding: MySpacing.all(8), child: MyText.bodyMedium("Product", fontWeight: 600)),
                            Padding(padding: MySpacing.all(8), child: MyText.bodyMedium("Total", fontWeight: 600)),
                          ],
                        ),
                        ...controller.products.map(
                          (product) => TableRow(
                            children: [
                              Padding(padding: MySpacing.all(8), child: Image.asset(product.imagePath, width: 60, height: 60)),
                              Padding(
                                padding: MySpacing.all(8),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    MyText.bodyMedium(product.name, fontWeight: 600),
                                    MySpacing.height(4),
                                    MyText.bodyMedium('\$${product.unitPrice} X ${product.quantity}'),
                                  ],
                                ),
                              ),
                              Padding(padding: MySpacing.all(8), child: MyText.bodyMedium('\$${product.totalPrice}')),
                            ],
                          ),
                        ),
                        TableRow(
                          children: [
                            const SizedBox(),
                            Padding(
                              padding: MySpacing.all(8),
                              child: Align(alignment: Alignment.centerRight, child: MyText.bodyMedium("Sub Total:", fontWeight: 600)),
                            ),
                            Padding(padding: MySpacing.all(8), child: MyText.bodyMedium('\$${subtotal.toStringAsFixed(0)}', fontWeight: 600)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  List<MyFlexItem> buildCardItems() {
    return controller.cards.map((card) {
      return MyFlexItem(
        sizes: 'lg-3 md-6',
        child: MyCard(
          shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
          borderRadiusAll: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              FaIcon(card['icon'], color: card['iconColor'], size: 32),
              MySpacing.height(12),
              MyText.titleLarge(card['number'] ?? ''),
              MySpacing.height(12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(child: MyText.bodyMedium(card['holder'] ?? '', overflow: TextOverflow.ellipsis)),
                  Expanded(child: MyText.titleMedium("Expiry date: ${card['expiry']}", overflow: TextOverflow.ellipsis)),
                ],
              ),
            ],
          ),
        ),
      );
    }).toList();
  }

  Widget productShippingInformation() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      height: 600,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: MySpacing.y(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Flexible(child: SizedBox.shrink()),
                Flexible(child: _buildStep(0, '01. Billing Info')),
                Flexible(child: Divider(thickness: 2, color: contentTheme.secondary.withValues(alpha: 0.2))),
                Flexible(child: _buildStep(1, '02. Shipping Info')),
                Flexible(child: Divider(thickness: 2, color: contentTheme.secondary.withValues(alpha: 0.2))),
                Flexible(child: _buildStep(2, '03. Payment Info')),
                Flexible(child: SizedBox.shrink()),
              ],
            ),
          ),
          Expanded(
            child: PageView(
              controller: controller.pageController,
              physics: const NeverScrollableScrollPhysics(),
              children: [_buildBillingInfo(), _buildShippingInfo(), _buildPaymentInfo()],
            ),
          ),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (controller.currentStep > 0)
                MyContainer(
                  onTap: _goToPreviousStep,
                  color: contentTheme.primary,
                  borderRadiusAll: 4,
                  paddingAll: 12,
                  child: Row(
                    children: [
                      Icon(Icons.arrow_back, color: contentTheme.onPrimary, size: 16),
                      MySpacing.width(4),
                      MyText.labelMedium("Previous", color: contentTheme.onPrimary),
                    ],
                  ),
                )
              else
                const SizedBox(width: 120),
              MyContainer(
                onTap: _goToNextStep,
                color: contentTheme.primary,
                borderRadiusAll: 4,
                paddingAll: 12,
                child: Row(
                  children: [
                    Icon(Icons.arrow_forward, color: contentTheme.onPrimary, size: 16),
                    MySpacing.width(4),
                    MyText.labelMedium(controller.currentStep == 2 ? 'Complete Order' : 'Next', color: contentTheme.onPrimary),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStep(int step, String title) {
    bool isSelected = controller.currentStep == step;
    return MyContainer(
      onTap: () => _goToStep(step),
      borderRadiusAll: 100,
      paddingAll: 12,
      color: isSelected ? contentTheme.primary : contentTheme.primary.withValues(alpha: 0.2),
      child: MyText.bodyMedium(title, fontWeight: isSelected ? 600 : 500, color: isSelected ? contentTheme.onPrimary : contentTheme.primary),
    );
  }

  Widget _buildBillingInfo() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium('Billing information', fontWeight: 600),
          MySpacing.height(8),
          MyText.bodyMedium('If several languages coalesce, the grammar of the resulting', fontWeight: 600, xMuted: true),
          MySpacing.height(24),
          MyFlex(
            children: [
              MyFlexItem(
                sizes: 'lg-4',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MyText.bodyMedium("Name", fontWeight: 600),
                    MySpacing.height(12),
                    TextFormField(
                      style: MyTextStyle.bodyMedium(),
                      decoration: InputDecoration(
                        hintText: 'Enter name',
                        contentPadding: MySpacing.all(14),
                        isCollapsed: true,
                        isDense: true,
                        hintStyle: MyTextStyle.bodyMedium(),
                        border: border,
                        focusedBorder: border,
                        errorBorder: border,
                        focusedErrorBorder: border,
                        enabledBorder: border,
                        disabledBorder: border,
                      ),
                    ),
                  ],
                ),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MyText.bodyMedium("Name", fontWeight: 600),
                    MySpacing.height(12),
                    TextFormField(
                      style: MyTextStyle.bodyMedium(),
                      decoration: InputDecoration(
                        hintText: 'Enter email',
                        contentPadding: MySpacing.all(14),
                        isCollapsed: true,
                        isDense: true,
                        hintStyle: MyTextStyle.bodyMedium(),
                        border: border,
                        focusedBorder: border,
                        errorBorder: border,
                        focusedErrorBorder: border,
                        enabledBorder: border,
                        disabledBorder: border,
                      ),
                      keyboardType: TextInputType.emailAddress,
                    ),
                  ],
                ),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MyText.bodyMedium("Phone", fontWeight: 600),
                    MySpacing.height(12),
                    TextFormField(
                      style: MyTextStyle.bodyMedium(),
                      decoration: InputDecoration(
                        hintText: 'Phone Number',
                        contentPadding: MySpacing.all(14),
                        isCollapsed: true,
                        isDense: true,
                        hintStyle: MyTextStyle.bodyMedium(),
                        border: border,
                        focusedBorder: border,
                        errorBorder: border,
                        focusedErrorBorder: border,
                        enabledBorder: border,
                        disabledBorder: border,
                      ),
                      keyboardType: TextInputType.phone,
                    ),
                  ],
                ),
              ),
            ],
          ),
          MySpacing.height(16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyText.bodyMedium("Address", fontWeight: 600),
              MySpacing.height(12),
              TextFormField(
                style: MyTextStyle.bodyMedium(),
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: 'Enter full address',
                  contentPadding: MySpacing.all(14),
                  isCollapsed: true,
                  isDense: true,
                  hintStyle: MyTextStyle.bodyMedium(),
                  border: border,
                  focusedBorder: border,
                  errorBorder: border,
                  focusedErrorBorder: border,
                  enabledBorder: border,
                  disabledBorder: border,
                ),
                keyboardType: TextInputType.phone,
              ),
            ],
          ),
          MySpacing.height(16),
          MyFlex(
            children: [
              MyFlexItem(
                sizes: 'lg-4',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MyText.bodyMedium("Country", fontWeight: 600),
                    MySpacing.height(12),
                    DropdownButtonFormField<String>(
                      dropdownColor: contentTheme.light,
                      style: MyTextStyle.bodyMedium(),
                      isDense: true,
                      decoration: InputDecoration(
                        hintText: 'Country',
                        contentPadding: MySpacing.all(14),
                        isCollapsed: true,
                        isDense: true,
                        hintStyle: MyTextStyle.bodyMedium(),
                        border: border,
                        focusedBorder: border,
                        errorBorder: border,
                        focusedErrorBorder: border,
                        enabledBorder: border,
                        disabledBorder: border,
                      ),
                      initialValue: controller.selectedCountry,
                      items: [
                        const DropdownMenuItem(value: null, child: MyText.bodyMedium('Select Country')),
                        ...controller.countries.map((country) {
                          return DropdownMenuItem(value: country['code'], child: MyText.bodyMedium(country['name']));
                        }),
                      ],
                      onChanged: (value) {
                        setState(() {
                          controller.selectedCountry = value;
                        });
                      },
                    ),
                  ],
                ),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MyText.bodyMedium("City", fontWeight: 600),
                    MySpacing.height(12),
                    TextFormField(
                      style: MyTextStyle.bodyMedium(),
                      decoration: InputDecoration(
                        hintText: 'Enter City',
                        contentPadding: MySpacing.all(14),
                        isCollapsed: true,
                        isDense: true,
                        hintStyle: MyTextStyle.bodyMedium(),
                        border: border,
                        focusedBorder: border,
                        errorBorder: border,
                        focusedErrorBorder: border,
                        enabledBorder: border,
                        disabledBorder: border,
                      ),
                    ),
                  ],
                ),
              ),
              MyFlexItem(
                sizes: 'lg-4',
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MyText.bodyMedium('Zip / Postal code', fontWeight: 600),
                    MySpacing.height(12),
                    TextFormField(
                      style: MyTextStyle.bodyMedium(),
                      decoration: InputDecoration(
                        hintText: 'Enter Postal code',
                        contentPadding: MySpacing.all(14),
                        isCollapsed: true,
                        isDense: true,
                        hintStyle: MyTextStyle.bodyMedium(),
                        border: border,
                        focusedBorder: border,
                        errorBorder: border,
                        focusedErrorBorder: border,
                        enabledBorder: border,
                        disabledBorder: border,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildShippingInfo() {
    return SingleChildScrollView(
      padding: MySpacing.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium('Shipping information', fontWeight: 600),
          MySpacing.height(8),
          MyText.bodySmall('It will be as simple as occidental in fact'),
          MySpacing.height(24),
          Wrap(
            spacing: 20,
            runSpacing: 20,
            children: [
              MyContainer.bordered(
                onTap: () => setState(() => controller.selectedAddress = 0),
                borderColor: controller.selectedAddress == 0 ? contentTheme.primary : null,
                width: 324,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        MyText.bodyMedium('Address 1', fontWeight: 600),
                        InkWell(
                          onTap: () {},
                          child: MyText.bodyMedium('Edit', color: contentTheme.primary),
                        ),
                      ],
                    ),
                    MySpacing.height(8),
                    MyText.bodyMedium('Bradley McMillian', fontWeight: 600),
                    MySpacing.height(8),
                    MyText.bodyMedium('109 Clarksburg Park Road Show Low, AZ 85901'),
                    MySpacing.height(8),
                    MyText.bodySmall('Mo. 012-345-6789'),
                  ],
                ),
              ),
              MyContainer.bordered(
                onTap: () => setState(() => controller.selectedAddress = 1),
                borderColor: controller.selectedAddress == 1 ? contentTheme.primary : null,
                width: 324,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        MyText.bodyMedium('Address 2', fontWeight: 600),
                        InkWell(
                          onTap: () {},
                          child: MyText.bodyMedium('Edit', color: contentTheme.primary),
                        ),
                      ],
                    ),
                    MySpacing.height(8),
                    MyText.bodyMedium('Bradley McMillian', fontWeight: 600),
                    MySpacing.height(8),
                    MyText.bodyMedium('109 Clarksburg Park Road Show Low, AZ 85901'),
                    MySpacing.height(8),
                    MyText.bodySmall('Mo. 012-345-6789'),
                  ],
                ),
              ),
            ],
          ),
          MySpacing.height(24),
          DataTable(
            columnSpacing: 190,
            dataRowMaxHeight: 90,
            columns: const [
              DataColumn(label: MyText.titleMedium('Photo', fontWeight: 600)),
              DataColumn(label: MyText.titleMedium('Product', fontWeight: 600)),
              DataColumn(label: MyText.titleMedium('Total', fontWeight: 600)),
            ],
            rows: [
              DataRow(
                cells: [
                  DataCell(Image.asset(Images.products[6], height: 70)),
                  DataCell(
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [MyText.titleMedium('Home & Office Chair Green (3 units)', fontWeight: 600), MyText.bodyMedium('\$240 X 03')],
                    ),
                  ),
                  DataCell(MyText.bodyMedium('\$720', fontWeight: 600)),
                ],
              ),
              DataRow(
                cells: [
                  DataCell(SizedBox.shrink()),
                  DataCell(SizedBox.shrink()),
                  DataCell(Row(children: [MyText.bodyMedium('Sub Total:'), MySpacing.width(12), MyText.bodyMedium('\$720', fontWeight: 600)])),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPaymentInfo() {
    return SingleChildScrollView(
      padding: MySpacing.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium('Payment information', fontWeight: 600),
          MySpacing.height(8),
          MyText.titleMedium('It will be as simple as occidental in fact', fontWeight: 600, xMuted: true),
          MySpacing.height(24),
          MyText.bodyMedium('Payment method:'),
          MySpacing.height(8),
          Row(
            children: [
              Expanded(
                child: MyContainer(
                  onTap: () => setState(() => controller.selectedPaymentMethod = 0),
                  color: controller.selectedPaymentMethod == 0 ? contentTheme.primary : null,
                  paddingAll: 12,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.credit_card, size: 28, color: controller.selectedPaymentMethod == 0 ? contentTheme.onPrimary : null),
                      MySpacing.width(12),
                      MyText.bodyMedium(
                        'Credit/Debit Card',
                        fontWeight: 600,
                        color: controller.selectedPaymentMethod == 0 ? contentTheme.onPrimary : null,
                      ),
                    ],
                  ),
                ),
              ),
              MySpacing.width(16),
              Expanded(
                child: MyContainer(
                  paddingAll: 12,
                  onTap: () => setState(() => controller.selectedPaymentMethod = 1),
                  color: controller.selectedPaymentMethod == 1 ? contentTheme.primary : null,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.payment, size: 28, color: controller.selectedPaymentMethod == 1 ? contentTheme.onPrimary : null),
                      MySpacing.width(16),
                      MyText.bodyMedium('PayPal', color: controller.selectedPaymentMethod == 1 ? contentTheme.onPrimary : null),
                    ],
                  ),
                ),
              ),
              MySpacing.width(16),
              Expanded(
                child: MyContainer(
                  paddingAll: 12,
                  onTap: () => setState(() => controller.selectedPaymentMethod = 2),
                  color: controller.selectedPaymentMethod == 2 ? contentTheme.primary : null,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.money, size: 28, color: controller.selectedPaymentMethod == 2 ? contentTheme.onPrimary : null),
                      MySpacing.width(16),
                      MyText.bodyMedium('Cash on Delivery', color: controller.selectedPaymentMethod == 2 ? contentTheme.onPrimary : null),
                    ],
                  ),
                ),
              ),
            ],
          ),
          MySpacing.height(24),
          _buildCreditCardForm(),
        ],
      ),
    );
  }

  Widget _buildCreditCardForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        MyText.titleMedium(
          controller.selectedPaymentMethod == 0
              ? 'Credit / Debit Payment'
              : controller.selectedPaymentMethod == 1
              ? "Paypal Payment"
              : controller.selectedPaymentMethod == 2
              ? "Case Payment"
              : "",
          fontWeight: 600,
        ),
        MySpacing.height(16),
        MyContainer.bordered(
          child: Column(
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  MyText.bodyMedium('Name on card', fontWeight: 600),
                  MySpacing.height(12),
                  TextFormField(
                    style: MyTextStyle.bodyMedium(),
                    decoration: InputDecoration(
                      hintText: 'Name on card',
                      contentPadding: MySpacing.all(14),
                      isCollapsed: true,
                      isDense: true,
                      hintStyle: MyTextStyle.bodyMedium(),
                      border: border,
                      focusedBorder: border,
                      errorBorder: border,
                      focusedErrorBorder: border,
                      enabledBorder: border,
                      disabledBorder: border,
                    ),
                    keyboardType: TextInputType.phone,
                  ),
                ],
              ),
              MySpacing.height(16),
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-4',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyText.bodyMedium('Card Number', fontWeight: 600),
                        MySpacing.height(12),
                        TextFormField(
                          style: MyTextStyle.bodyMedium(),
                          decoration: InputDecoration(
                            hintText: '0000 0000 0000 0000',
                            contentPadding: MySpacing.all(14),
                            isCollapsed: true,
                            isDense: true,
                            hintStyle: MyTextStyle.bodyMedium(),
                            border: border,
                            focusedBorder: border,
                            errorBorder: border,
                            focusedErrorBorder: border,
                            enabledBorder: border,
                            disabledBorder: border,
                          ),
                          keyboardType: TextInputType.phone,
                        ),
                      ],
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyText.bodyMedium('Expiry date', fontWeight: 600),
                        MySpacing.height(12),
                        TextFormField(
                          style: MyTextStyle.bodyMedium(),
                          decoration: InputDecoration(
                            hintText: 'MM/YY',
                            contentPadding: MySpacing.all(14),
                            isCollapsed: true,
                            isDense: true,
                            hintStyle: MyTextStyle.bodyMedium(),
                            border: border,
                            focusedBorder: border,
                            errorBorder: border,
                            focusedErrorBorder: border,
                            enabledBorder: border,
                            disabledBorder: border,
                          ),
                          keyboardType: TextInputType.phone,
                        ),
                      ],
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-4',
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyText.bodyMedium('CVV Code', fontWeight: 600),
                        MySpacing.height(12),
                        TextFormField(
                          style: MyTextStyle.bodyMedium(),
                          decoration: InputDecoration(
                            hintText: 'Enter CVV Code',
                            contentPadding: MySpacing.all(14),
                            isCollapsed: true,
                            isDense: true,
                            hintStyle: MyTextStyle.bodyMedium(),
                            border: border,
                            focusedBorder: border,
                            errorBorder: border,
                            focusedErrorBorder: border,
                            enabledBorder: border,
                            disabledBorder: border,
                          ),
                          keyboardType: TextInputType.phone,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _goToStep(int step) {
    setState(() {
      controller.currentStep = step;
      controller.pageController.jumpToPage(step);
    });
  }

  void _goToNextStep() {
    if (controller.currentStep < 2) {
      setState(() {
        controller.currentStep++;
        controller.pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      });
    } else {
      _completeOrder();
    }
  }

  void _goToPreviousStep() {
    if (controller.currentStep > 0) {
      setState(() {
        controller.currentStep--;
        controller.pageController.previousPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
      });
    }
  }

  void _completeOrder() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Order Complete'),
        content: const Text('Your order has been placed successfully!'),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('OK'))],
      ),
    );
  }
}

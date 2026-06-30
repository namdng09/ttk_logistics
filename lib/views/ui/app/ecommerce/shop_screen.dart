import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/app/ecommerce/shop_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:syncfusion_flutter_maps/maps.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> with UIMixin {
  late ShopController controller;

  @override
  void initState() {
    controller = Get.put(ShopController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Shop',
          mainScreenName: 'Ecommerce',
          child: Column(
            children: [
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-8',
                    child: MyCard(
                      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
                      borderRadiusAll: 4,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          MyText.titleMedium("Popular shop", fontWeight: 600),
                          MySpacing.height(20),
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: DataTable(
                              headingRowColor: WidgetStateProperty.all(Colors.grey.shade200),
                              columnSpacing: 80,
                              headingRowHeight: 60,
                              dataRowMaxHeight: 70,
                              columns: [
                                DataColumn(label: MyText.bodyMedium('Brand')),
                                DataColumn(label: MyText.bodyMedium('Name')),
                                DataColumn(label: MyText.bodyMedium('Email')),
                                DataColumn(label: MyText.bodyMedium('Date')),
                                DataColumn(label: MyText.bodyMedium('Product')),
                                DataColumn(label: MyText.bodyMedium('Current Balance')),
                              ],
                              rows: controller.shops.map((shop) {
                                return DataRow(
                                  cells: [
                                    DataCell(Image.asset(shop['brand'], width: 36, height: 36)),
                                    DataCell(
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [MyText.bodyMedium(shop['name'], fontWeight: 600), MyText.bodySmall(shop['owner'])],
                                      ),
                                    ),
                                    DataCell(MyText.bodyMedium(shop['email'])),
                                    DataCell(MyText.bodyMedium(shop['date'])),
                                    DataCell(MyText.bodyMedium(shop['products'].toString())),
                                    DataCell(MyText.bodyMedium(shop['balance'])),
                                  ],
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  MyFlexItem(sizes: 'lg-4', child: salesByState()),
                ],
              ),
              MySpacing.height(40),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: contentTheme.primary)),
                  MySpacing.width(12),
                  MyText.bodySmall('Load More', color: contentTheme.primary, fontWeight: 600),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget salesByState() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        children: [
          MyText.titleMedium("Sales By State", fontWeight: 600),
          MySpacing.height(12),
          SizedBox(
            height: 300,
            child: SfMaps(
              layers: <MapLayer>[
                MapShapeLayer(
                  loadingBuilder: (BuildContext context) {
                    return CircularProgressIndicator(strokeWidth: 3);
                  },
                  source: controller.mapSource,
                  initialMarkersCount: 7,
                  markerBuilder: (_, int index) {
                    return MapMarker(
                      longitude: controller.worldClockData[index].longitude,
                      latitude: controller.worldClockData[index].latitude,
                      alignment: Alignment.topCenter,
                      offset: const Offset(0, -4),
                      size: const Size(100, 100),
                      child: _clockWidget(controller.worldClockData[index].countryName),
                    );
                  },
                  strokeWidth: 0,
                ),
              ],
            ),
          ),
          MySpacing.height(12),
          CountryProgress(country: 'United States', progress: 82.05, value: '659k', progressColor: Colors.grey),
          CountryProgress(country: 'Russia', progress: 70.5, value: '485k', progressColor: Colors.blue),
          CountryProgress(country: 'China', progress: 65.8, value: '355k', progressColor: Colors.orange),
        ],
      ),
    );
  }

  Widget _clockWidget(String countryName) {
    return Row(
      children: <Widget>[
        MyContainer.rounded(
          paddingAll: 4,
          color: contentTheme.secondary.withValues(alpha: .6),
          child: MyContainer.rounded(paddingAll: 4, color: contentTheme.secondary),
        ),
        MySpacing.width(4),
        MyText.bodyMedium(countryName, fontWeight: 700),
      ],
    );
  }
}

class CountryProgress extends StatelessWidget {
  final String country;
  final double progress;
  final String value;
  final Color progressColor;

  const CountryProgress({super.key, required this.country, required this.progress, required this.value, required this.progressColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: MySpacing.bottom(16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [MyText.bodyMedium(country, fontWeight: 600)]),
            ],
          ),
          MySpacing.height(8),
          Row(
            children: [
              Expanded(
                child: LinearProgressIndicator(
                  value: progress / 100,
                  backgroundColor: Colors.grey.shade300,
                  color: progressColor,
                  minHeight: 4,
                  borderRadius: BorderRadius.horizontal(left: Radius.circular(12)),
                ),
              ),
              MySpacing.width(8),
              MyText.bodyMedium(value, fontWeight: 600),
            ],
          ),
        ],
      ),
    );
  }
}

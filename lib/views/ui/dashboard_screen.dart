import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/dashboard_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';
import 'package:ttk_logistics/models/chart_model.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';
import 'package:syncfusion_flutter_charts/charts.dart';
import 'package:syncfusion_flutter_maps/maps.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> with UIMixin {
  late DashboardController controller;

  @override
  void initState() {
    controller = Get.put(DashboardController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Dashboard',
          mainScreenName: 'Dashboard',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-8', child: quickSummary()),
              MyFlexItem(sizes: 'lg-4', child: orderAndRevenueStastics()),
              MyFlexItem(sizes: 'lg-4', child: productTraking()),
              MyFlexItem(sizes: 'lg-4', child: earningGoalAndBestSellingProduct()),
              MyFlexItem(sizes: 'lg-4', child: salesByState()),
              MyFlexItem(sizes: 'lg-4', child: salesBySocialSource()),
              MyFlexItem(sizes: 'lg-8', child: productsOfTheMonth()),
            ],
          ),
        );
      },
    );
  }

  Widget quickSummary() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),

      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(child: MyText.titleMedium("Quick Summary", fontWeight: 600)),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: TimeView.values.map((view) {
                  final isActive = controller.selectedView == view;
                  return MyContainer(
                    color: isActive ? contentTheme.primary : Colors.transparent,
                    padding: MySpacing.xy(12, 8),
                    onTap: () {
                      setState(() {
                        controller.selectedView = view;
                      });
                    },
                    child: MyText.labelMedium(controller.getLabel(view), color: isActive ? contentTheme.onPrimary : null, fontWeight: 600),
                  );
                }).toList(),
              ),
            ],
          ),
          MySpacing.height(20),
          MyFlex(
            children: [
              MyFlexItem(
                sizes: 'lg-9 md-6',
                child: SizedBox(
                  height: 400,
                  child: SfCartesianChart(
                    plotAreaBorderWidth: 0,
                    primaryXAxis: const CategoryAxis(majorGridLines: MajorGridLines(width: 0)),
                    primaryYAxis: const NumericAxis(
                      axisLine: AxisLine(width: 0),
                      labelFormat: '{value}',
                      maximum: 15,
                      majorTickLines: MajorTickLines(size: 0),
                    ),
                    series: [
                      StackedColumnSeries<ChartSampleData, String>(
                        dataSource: controller.chartData,
                        color: contentTheme.primary,
                        width: 0.2,
                        xValueMapper: (ChartSampleData data, int index) => data.x,
                        yValueMapper: (ChartSampleData data, int index) => data.y,
                      ),
                      StackedColumnSeries<ChartSampleData, String>(
                        dataSource: controller.chartData,
                        color: contentTheme.secondary.withValues(alpha: 0.2),
                        width: 0.2,
                        xValueMapper: (ChartSampleData data, int index) => data.x,
                        yValueMapper: (ChartSampleData data, int index) => data.yValue,
                      ),
                    ],
                    tooltipBehavior: controller.tooltipBehavior,
                  ),
                ),
              ),
              MyFlexItem(
                sizes: 'lg-3 md-6',
                child: MyContainer(
                  color: contentTheme.secondary.withValues(alpha: 0.04),
                  child: Column(
                    children: [
                      _buildInfoItem(icon: Icons.currency_rupee, amount: '\$2354', label: 'Earning', actionText: 'Withdraw', onTap: () {}),
                      Divider(height: 0),
                      _buildInfoItem(icon: Icons.credit_card_outlined, amount: '\$1598', label: 'To Paid', actionText: 'Pay', onTap: () {}),
                      Divider(height: 0),
                      _buildInfoItem(icon: Icons.remove_red_eye_outlined, amount: '1230', label: 'To Online', actionText: 'View', onTap: () {}),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem({
    required IconData icon,
    required String amount,
    required String label,
    required String actionText,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: MySpacing.y(32),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            paddingAll: 12,
            borderRadiusAll: 100,
            clipBehavior: Clip.antiAliasWithSaveLayer,
            child: Icon(icon, color: contentTheme.primary, size: 16),
          ),
          MySpacing.width(12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyText.titleMedium(amount, fontWeight: 700, fontSize: 20,maxLines: 1),
                MySpacing.height(4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.start,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Expanded(child: MyText.bodyMedium(label, muted: true,maxLines: 1,)),
                    MySpacing.width(6),
                    Expanded(
                      child: InkWell(
                        onTap: onTap,
                        child: Row(
                          children: [
                            Flexible(child: MyText.labelMedium(actionText, color: contentTheme.primary,maxLines: 1,)),
                            MySpacing.width(8),
                            Icon(RemixIcons.arrow_right_line, color: contentTheme.primary, size: 14),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget orderAndRevenueStastics() {
    return MyFlex(
      children: [
        MyFlexItem(
          sizes: 'lg-6 md-4',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            height: 226,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                MyText.titleMedium("Order", fontWeight: 600),
                MyContainer.rounded(
                  paddingAll: 12,
                  color: contentTheme.primary.withValues(alpha: 0.3),
                  child: Icon(RemixIcons.shopping_cart_line, color: contentTheme.primary, size: 20),
                ),
                MyText.titleLarge("58", fontWeight: 600),
                MyText.bodyMedium("70% Target"),
                LinearProgressIndicator(value: 70 / 100, backgroundColor: Colors.grey.shade300, color: contentTheme.primary, minHeight: 4),
              ],
            ),
          ),
        ),
        MyFlexItem(
          sizes: 'lg-6 md-4',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            height: 226,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                MyText.titleMedium("Users", fontWeight: 600),
                MyContainer.rounded(
                  paddingAll: 12,
                  color: contentTheme.success.withValues(alpha: 0.3),
                  child: Icon(RemixIcons.user_line, color: contentTheme.success, size: 20),
                ),
                MyText.titleLarge("1366", fontWeight: 600),
                MyText.bodyMedium("80% Target"),
                LinearProgressIndicator(value: 70 / 100, backgroundColor: Colors.grey.shade300, color: contentTheme.success, minHeight: 4),
              ],
            ),
          ),
        ),
        MyFlexItem(sizes:'lg-12 md-4',child: revenueStatisticsCard()),
      ],
    );
  }

  Widget revenueStatisticsCard() {
    String selectedPeriod = 'Today';
    final List<String> periods = ['Today', 'Yesterday', 'Last Week', 'Last Month'];

    return StatefulBuilder(
      builder: (context, setState) {
        return MyCard(
          shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
          height: 234,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyText.titleMedium('Revenue Statistics', fontWeight: 600),
              MySpacing.height(12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  MyText.bodyMedium('\$14,235', fontWeight: 600),
                  MySpacing.width(12),
                  DecoratedBox(
                    decoration: BoxDecoration(border: Border.all(), borderRadius: BorderRadius.circular(8)),
                    child: Padding(
                      padding: MySpacing.all(4),
                      child: DropdownButton<String>(
                        value: selectedPeriod,
                        isDense: true,
                        icon: Icon(Icons.keyboard_arrow_down),
                        style: MyTextStyle.bodyMedium(),
                        onChanged: (String? newValue) {
                          if (newValue != null) {
                            setState(() {
                              selectedPeriod = newValue;
                            });
                          }
                        },
                        items: periods.map<DropdownMenuItem<String>>((String value) {
                          return DropdownMenuItem<String>(value: value, child: MyText.labelMedium(value));
                        }).toList(),
                        underline: SizedBox(),
                        dropdownColor: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ],
              ),
              MySpacing.height(12),
              SizedBox(
                height: 120,
                child: SfCartesianChart(
                  margin: MySpacing.zero,
                  plotAreaBorderWidth: 0,
                  primaryXAxis: const NumericAxis(isVisible: false),
                  primaryYAxis: const NumericAxis(isVisible: false),
                  series: [
                    SplineAreaSeries<SplineAreaData, double>(
                      dataSource: controller.revenueStasticsChartData,
                      xValueMapper: (SplineAreaData data, int index) => data.year,
                      yValueMapper: (SplineAreaData data, int index) => data.y1,
                      color: contentTheme.primary.withValues(alpha: 0.6),
                      borderColor: contentTheme.primary,
                      name: 'India',
                    ),
                  ],
                  tooltipBehavior: controller.revenueStasticsTooltipBehavior,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget productTraking() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        children: [
          ...controller.activities.map(
            (item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 10.0),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (item['type'] == 'image')
                    ClipOval(child: Image.asset(item['image'].toString(), width: 40, height: 40, fit: BoxFit.cover))
                  else
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: item['bgColor'],
                      child: Icon(item['icon'], color: item['iconColor'], size: 20),
                    ),
                  SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        MyText.bodyMedium(item['title'], fontWeight: 600),
                        MySpacing.height(2),
                        MyText.bodyMedium(item['subtitle'], muted: true),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      Icon(RemixIcons.timer_line, color: contentTheme.primary, size: 18),
                      MySpacing.width(4),
                      MyText.bodyMedium(item['time'], fontWeight: 600),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget earningGoalAndBestSellingProduct() {
    return Column(
      children: [
        MyCard(
          shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
          borderRadiusAll: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyText.titleMedium("Earning Goal", fontWeight: 600),
              MySpacing.height(20),
              MyFlex(
                children: [
                  MyFlexItem(
                    sizes: 'lg-6 md-6 sm-6',
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        CircularProgressIndicator(value: 0.7, backgroundColor: Colors.grey.shade300, color: contentTheme.primary, strokeWidth: 5.0),
                        MySpacing.height(16),
                        MyText.bodyMedium("Total Earning:", muted: true),
                        MySpacing.height(12),
                        MyText.titleLarge("USD 13,545.65", fontWeight: 700),
                      ],
                    ),
                  ),
                  MyFlexItem(
                    sizes: 'lg-6 md-6 sm-6',
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                      children: [
                        CircularProgressIndicator(value: 0.7, backgroundColor: Colors.grey.shade300, color: contentTheme.primary, strokeWidth: 5.0),
                        MySpacing.height(16),
                        MyText.bodyMedium("Earning Goal:", muted: true),
                        MySpacing.height(12),
                        MyText.titleLarge("USD 84,265.45", fontWeight: 700),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        MySpacing.height(16),
        MyCard(
          shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
          borderRadiusAll: 4,

          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              MyText.titleMedium("Best Selling Product", fontWeight: 600),
              MySpacing.height(12),
              SizedBox(
                height: 123,
                child: PageView.builder(
                  controller: controller.pageController,
                  onPageChanged: (index) => setState(() => controller.currentPage = index),
                  itemCount: controller.products.length,
                  itemBuilder: (context, index) {
                    final product = controller.products[index];
                    return Row(
                      children: [
                        Expanded(flex: 4, child: Image.asset(product['image'], fit: BoxFit.contain, height: 130)),
                        MySpacing.width(16),
                        Expanded(
                          flex: 6,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              MyText.bodyMedium(product['category']),
                              MySpacing.height(4),
                              MyText.bodyLarge(product['title'], fontWeight: 600, color: contentTheme.primary),
                              MySpacing.height(16),
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      MyText.bodyMedium('${product['sold']}', fontWeight: 600),
                                      MySpacing.height(4),
                                      MyText.bodySmall('Sold', muted: true),
                                    ],
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      MyText.bodyMedium('${product['stock']}', fontWeight: 600),
                                      MySpacing.height(4),
                                      MyText.bodySmall('Stock', muted: true),
                                    ],
                                  ),
                                  MyContainer(
                                    color: contentTheme.primary,
                                    padding: MySpacing.xy(12, 8),
                                    onTap: () {},
                                    child: MyText.labelMedium("Buy Nou", color: contentTheme.onPrimary),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
              Center(
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    controller.products.length,
                    (index) => MyContainer.rounded(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      width: controller.currentPage == index ? 10 : 8,
                      height: controller.currentPage == index ? 10 : 8,
                      color: controller.currentPage == index ? contentTheme.primary : contentTheme.primary.withValues(alpha: 0.3),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
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
            height: 143,
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

  Widget salesBySocialSource() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium('Sales By Social Source', fontWeight: 600),
          MySpacing.height(12),
          Column(
            children: controller.socialSources.map((data) {
              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: MyContainer(
                  color: data['bgColor'],
                  borderRadiusAll: 4,
                  paddingAll: 0,
                  child: Padding(
                    padding: MySpacing.all(12),
                    child: Icon(data['icon'], color: Colors.white, size: 20),
                  ),
                ),
                title: MyText.bodyMedium(data['platform'], fontWeight: 600),
                subtitle: MyText.bodySmall(data['sales'], muted: true),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(data['trendIcon'], color: data['trendColor'], size: 18),
                    MySpacing.width(4),
                    MyText.bodyMedium(data['trend']),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget productsOfTheMonth() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium("Products of the month", fontWeight: 600),
          MySpacing.height(12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              columnSpacing: 95,
              headingRowColor: WidgetStateColor.resolveWith((states) => contentTheme.secondary.withValues(alpha: 0.2)),
              columns: [
                DataColumn(label: MyText.bodyMedium('ID', fontWeight: 600)),
                DataColumn(label: MyText.bodyMedium('Product', fontWeight: 600)),
                DataColumn(label: MyText.bodyMedium('Customer', fontWeight: 600)),
                DataColumn(label: MyText.bodyMedium('Price', fontWeight: 600)),
                DataColumn(label: MyText.bodyMedium('Invoice', fontWeight: 600)),
                DataColumn(label: MyText.bodyMedium('Status', fontWeight: 600)),
              ],
              rows: controller.productsOfTheMonth.map((product) {
                return DataRow(
                  cells: [
                    DataCell(MyText.bodyMedium(product['id'])),
                    DataCell(
                      Row(children: [Image.asset(product['image'], width: 52, height: 52), MySpacing.width(8), MyText.bodyMedium(product['name'])]),
                    ),
                    DataCell(MyText.bodyMedium(product['customer'])),
                    DataCell(MyText.bodyMedium(product['price'])),
                    DataCell(MyText.bodyMedium(product['invoice'])),
                    DataCell(
                      MyContainer(
                        padding: MySpacing.xy(12, 6),
                        color: controller.getStatusColor(product['status']),
                        borderRadius: BorderRadius.circular(20),
                        child: MyText.bodyMedium(product['status'], color: controller.getTextColor(product['status']), fontWeight: 600),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ),
        ],
      ),
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

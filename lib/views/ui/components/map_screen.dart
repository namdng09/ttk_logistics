import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:syncfusion_flutter_maps/maps.dart';
import 'package:kho555/controller/ui/components/map_controller.dart';
import 'package:kho555/helper/theme/app_theme.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/views/layout/layout.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> with UIMixin {
  MapController controller = Get.put(MapController());

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'map_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'Map',
          mainScreenName: 'Other',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: "lg-6", child: dataLabel()),
              MyFlexItem(sizes: "lg-6", child: europeanTimeZone()),
              MyFlexItem(sizes: "lg-6", child: worldPopulationDensity()),
              MyFlexItem(sizes: "lg-6", child: worldClock()),
            ],
          ),
        );
      },
    );
  }

  Widget worldPopulationDensity() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        children: [
          MyContainer(
            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("World Population Density (per sq. km.)", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: SfMaps(
              layers: <MapLayer>[
                MapShapeLayer(
                  loadingBuilder: (BuildContext context) {
                    return const SizedBox(height: 25, width: 25, child: CircularProgressIndicator(strokeWidth: 3));
                  },
                  source: controller.mapSource1,
                  shapeTooltipBuilder: (BuildContext context, int index) {
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: MyText.bodySmall(
                        '${controller.worldPopulationDensity[index].countryName} : ${controller.numberFormat.format(controller.worldPopulationDensity[index].density)} per sq. km.',
                      ),
                    );
                  },
                  strokeColor: Colors.white30,
                  legend: const MapLegend.bar(
                    MapElement.shape,
                    position: MapLegendPosition.bottom,
                    overflowMode: MapLegendOverflowMode.wrap,
                    labelsPlacement: MapLegendLabelsPlacement.betweenItems,
                    padding: EdgeInsets.only(top: 15),
                    spacing: 1.0,
                    segmentSize: Size(55.0, 9.0),
                  ),
                  tooltipSettings: MapTooltipSettings(
                    color: theme.colorScheme.brightness == Brightness.light
                        ? const Color.fromRGBO(0, 32, 128, 1)
                        : const Color.fromRGBO(226, 233, 255, 1),
                    strokeColor: theme.colorScheme.brightness == Brightness.light ? Colors.white : Colors.black,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget worldClock() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("World Clock", fontWeight: 700, muted: true)),
          Padding(
            padding: MySpacing.all(20),
            child: SizedBox(
              height: 500,
              child: SfMaps(
                layers: <MapLayer>[
                  MapShapeLayer(
                    loadingBuilder: (BuildContext context) {
                      return const SizedBox(height: 25, width: 25, child: CircularProgressIndicator(strokeWidth: 3));
                    },
                    source: controller.mapSource2,
                    initialMarkersCount: 7,
                    markerBuilder: (_, int index) {
                      return MapMarker(
                        longitude: controller.worldClockData[index].longitude,
                        latitude: controller.worldClockData[index].latitude,
                        alignment: Alignment.topCenter,
                        offset: Offset(0, -4),
                        size: Size(150, 150),
                        child: ClockWidget(
                          countryName: controller.worldClockData[index].countryName,
                          date: controller.worldClockData[index].date,
                        ),
                      );
                    },
                    strokeWidth: 0,
                    color: theme.colorScheme.brightness == Brightness.light
                        ? Color.fromRGBO(71, 70, 75, 0.2)
                        : Color.fromRGBO(71, 70, 75, 1),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget europeanTimeZone() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        children: [
          MyContainer(
            width: double.infinity,
            borderRadiusAll: 0,
            child: MyText.titleMedium("European Time Zones", fontWeight: 700, muted: true),
          ),
          Padding(
            padding: MySpacing.all(20),
            child: SfMaps(
              layers: <MapLayer>[
                MapShapeLayer(
                  loadingBuilder: (BuildContext context) {
                    return const SizedBox(height: 25, width: 25, child: CircularProgressIndicator(strokeWidth: 3));
                  },
                  source: controller.mapSource,
                  shapeTooltipBuilder: (BuildContext context, int index) {
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: MyText.bodyMedium(
                        '${controller.timeZones[index].countryName} : ${controller.timeZones[index].gmtTime}',
                        color: contentTheme.light,
                      ),
                    );
                  },
                  legend: const MapLegend.bar(
                    MapElement.shape,
                    position: MapLegendPosition.bottom,
                    padding: EdgeInsets.only(top: 15),
                    segmentSize: Size(60.0, 10.0),
                  ),
                  tooltipSettings: const MapTooltipSettings(color: Color.fromRGBO(45, 45, 45, 1)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget dataLabel() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      clipBehavior: Clip.antiAliasWithSaveLayer,
      borderRadiusAll: 4,
      paddingAll: 0,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyContainer(width: double.infinity, borderRadiusAll: 0, child: MyText.titleMedium("Data Labels", fontWeight: 700, muted: true)),
          Padding(
            padding: MySpacing.all(20),
            child: SfMaps(
              layers: [
                MapShapeLayer(
                  source: controller.dataSource,
                  showDataLabels: true,
                  dataLabelSettings: const MapDataLabelSettings(overflowMode: MapLabelOverflow.ellipsis),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

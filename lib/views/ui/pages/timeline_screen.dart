import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/pages/timeline_controller.dart';
import 'package:ttk_logistics/helper/utils/my_shadow.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_card.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:timelines_plus/timelines_plus.dart';

class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> with UIMixin{
  late TimelineController controller;


  @override
  void initState() {
    controller = Get.put(TimelineController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
      return Layout(subScreenName: 'Timeline', mainScreenName: 'Pages',
      child: MyCard(
        shadow: MyShadow(elevation: 0.7, position: MyShadowPosition.bottom),
        child: Timeline.tileBuilder(
          shrinkWrap: true,
          builder: TimelineTileBuilder.fromStyle(
            itemCount: controller.timeLineData.length,
            contentsAlign: ContentsAlign.alternating,
            connectorStyle: ConnectorStyle.dashedLine,
            endConnectorStyle: ConnectorStyle.dashedLine,
            contentsBuilder: (context, index) {
              var timeLine = controller.timeLineData[index];

              // If the item is a year label
              if (timeLine['type'] == 'year') {
                return MyText.titleSmall(
                  timeLine['label'],
                  color: contentTheme.onDanger,
                  fontWeight: 600,
                );
              }
              return MyCard.bordered(
                marginAll: 20,
                color: contentTheme.light,
                shadow: MyShadow(elevation: 0.2),
                paddingAll: 24,
                child: Column(
                  crossAxisAlignment: index % 2 == 0
                      ? CrossAxisAlignment.start
                      : CrossAxisAlignment.end,
                  children: [
                    Row(
                      mainAxisAlignment: index % 2 == 0
                          ? MainAxisAlignment.start
                          : MainAxisAlignment.end,
                      children: [
                        Icon(Icons.calendar_today, size: 14, color: contentTheme.primary),
                        MySpacing.width(6),
                        MyText.bodySmall(
                          timeLine['date'] ?? '',
                          fontWeight: 600,
                        ),
                      ],
                    ),
                    MySpacing.height(12),
                    MyText.titleMedium(
                      timeLine['title'] ?? '',
                      fontWeight: 600,
                      overflow: TextOverflow.ellipsis,
                      textAlign: index % 2 == 0 ? TextAlign.start : TextAlign.end,
                    ),
                    MySpacing.height(12),
                    MyText.bodyMedium(
                      timeLine['description'] ?? '',
                      fontWeight: 600,
                      xMuted: true,
                      textAlign: index % 2 == 0 ? TextAlign.start : TextAlign.end,
                    ),
                    if (timeLine['images'] != null) ...[
                      MySpacing.height(12),
                      Wrap(
                        spacing: 8,
                        children: List.generate(
                          (timeLine['images'] as List).length,
                              (imgIndex) => ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.asset(
                              timeLine['images'][imgIndex],
                              width: 60,
                              height: 60,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    ]
                  ],
                ),
              );
            },
          ),
        ),
      ),
      );
    },);
  }
}

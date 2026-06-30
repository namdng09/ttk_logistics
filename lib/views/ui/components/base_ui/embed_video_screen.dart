import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:ttk_logistics/controller/ui/components/base_ui/embed_video_controller.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_flex.dart';
import 'package:ttk_logistics/helper/widgets/my_flex_item.dart';
import 'package:ttk_logistics/views/layout/layout.dart';
import 'package:video_player/video_player.dart';


class EmbedVideoScreen extends StatefulWidget {
  const EmbedVideoScreen({super.key});

  @override
  State<EmbedVideoScreen> createState() => _EmbedVideoScreenState();
}

class _EmbedVideoScreenState extends State<EmbedVideoScreen> with UIMixin {
  EmbedVideoController controller = Get.put(EmbedVideoController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Embed Video',
          mainScreenName: 'Base UI',
          child: MyFlex(
            children: [
              MyFlexItem(
                sizes: 'lg-6',
                child: MyContainer(
                  borderRadiusAll: 8,
                  clipBehavior: Clip.antiAliasWithSaveLayer,
                  paddingAll: 0,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      controller.videoController.value.isInitialized
                          ? AspectRatio(
                            aspectRatio: controller.videoController.value.aspectRatio,
                            child: VideoPlayer(controller.videoController),
                          )
                          : Container(),
                      Center(
                        child: MyContainer.rounded(
                          child: IconButton(
                            onPressed: () => controller.onVideoControl(),
                            icon: Icon(controller.videoController.value.isPlaying ? Icons.pause : Icons.play_arrow),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

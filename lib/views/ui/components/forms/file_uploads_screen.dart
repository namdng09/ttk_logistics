import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:remixicon/remixicon.dart';

import 'package:kho555/controller/ui/components/forms/file_upload_controller.dart';
import 'package:kho555/helper/theme/app_theme.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/utils.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_list_extension.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/views/layout/layout.dart';

class FileUploadsScreen extends StatefulWidget {
  const FileUploadsScreen({super.key});

  @override
  State<FileUploadsScreen> createState() => _FileUploadsScreenState();
}

class _FileUploadsScreenState extends State<FileUploadsScreen> with UIMixin {
  FileUploadController controller = Get.put(FileUploadController());
  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      tag: 'file_upload_controller',
      builder: (controller) {
        return Layout(
          subScreenName: 'File Upload',
          mainScreenName: 'Basic Elements',
          child: MyCard(
            shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
            paddingAll: 24,
            clipBehavior: Clip.antiAliasWithSaveLayer,
            child: Column(
              children: [
                Row(
                  children: [
                    MyText.labelLarge("Multiple File Select"),
                    MySpacing.width(12),
                    Switch(
                      onChanged: controller.onSelectMultipleFile,
                      value: controller.selectMultipleFile,
                      activeThumbColor: theme.colorScheme.primary,
                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                  ],
                ),
                MySpacing.height(20),
                uploadFile(),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget uploadFile() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        MyContainer.bordered(
          borderRadiusAll: 8,
          clipBehavior: Clip.antiAliasWithSaveLayer,
          onTap: controller.pickFiles,
          paddingAll: 23,
          child: Center(
            heightFactor: 1.5,
            child: Padding(
              padding: MySpacing.all(8),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(RemixIcons.upload_cloud_2_line),
                  MySpacing.height(12),
                  MyContainer(
                    width: 340,
                    alignment: Alignment.center,
                    paddingAll: 0,
                    child: MyText.titleMedium(
                      "Drop files here or click to upload.",
                      fontWeight: 600,
                      muted: true,
                      fontSize: 18,
                      textAlign: TextAlign.center,
                    ),
                  ),
                  MyContainer(
                    alignment: Alignment.center,
                    width: 610,
                    child: MyText.titleMedium(
                      "(This is just a demo dropzone. Selected files are not actually uploaded.)",
                      muted: true,
                      fontWeight: 500,
                      fontSize: 16,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        if (controller.files.isNotEmpty) ...[
          MySpacing.height(16),
          Wrap(
            spacing: 16,
            runSpacing: 16,
            clipBehavior: Clip.antiAliasWithSaveLayer,
            children:
                controller.files
                    .mapIndexed(
                      (index, file) => MyContainer.bordered(
                        borderRadiusAll: 4,
                        clipBehavior: Clip.antiAliasWithSaveLayer,
                        paddingAll: 20,
                        child: Row(
                          children: [
                            MyContainer(
                              height: 44,
                              width: 44,
                              borderRadiusAll: 8,
                              color: contentTheme.onBackground.withAlpha(28),
                              paddingAll: 0,
                              child: Icon(controller.getFileIcon(file.name), size: 20),
                            ),
                            MySpacing.width(12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  MyText.bodyMedium(file.name, fontWeight: 700, muted: true),
                                  MySpacing.height(4),
                                  MyText.bodySmall(Utils.getStorageStringFromByte(file.size), fontWeight: 700, muted: true),
                                ],
                              ),
                            ),
                            MyContainer.transparent(
                              onTap: () => controller.removeFile(file),
                              paddingAll: 4,
                              child: Icon(Remix.close_line, size: 20, color: contentTheme.danger),
                            ),
                          ],
                        ),
                      ),
                    )
                    .toList(),
          ),
        ],
      ],
    );
  }
}

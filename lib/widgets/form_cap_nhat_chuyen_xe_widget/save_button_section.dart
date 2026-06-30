import 'package:flutter/material.dart';
import 'package:get/get.dart';

class SaveButtonSection extends StatelessWidget {
  final dynamic controller;

  const SaveButtonSection({
    super.key,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Obx(() {
        final updating = controller.isUpdating.value;

        return ElevatedButton.icon(
          icon: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: updating
                ? const SizedBox(
              key: ValueKey("spinner"),
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
                : const Icon(
              Icons.save_outlined,
              key: ValueKey("icon"),
            ),
          ),
          label: AnimatedSwitcher(
            duration: const Duration(milliseconds: 250),
            child: Text(
              updating ? "Đang lưu..." : "Lưu thay đổi",
              key: ValueKey(updating),
            ),
          ),
          style: ElevatedButton.styleFrom(
            backgroundColor: updating ? Colors.teal.shade200 : Colors.teal,
            padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 14),
            textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),

          onPressed: updating
              ? null
              : () async {
            // Khi nhấn lưu → gọi hàm cập nhật của controller
            await controller.capNhatChuyenXe(
              khachHangList: controller.khachHangList,
              khachHangId: controller.khachHangId,
            );
          },
        );
      }),
    );
  }
}

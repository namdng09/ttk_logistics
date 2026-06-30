import 'package:flutter/material.dart';
import 'package:oktoast/oktoast.dart';

class AppToast {
  static void success(String message) {
    _showCustomToast(
      message,
      icon: Icons.check_circle,
      bgColor: const Color(0xFF0DBF66),
      iconColor: Colors.white,
    );
  }

  static void warning(String message) {
    _showCustomToast(
      message,
      icon: Icons.warning_amber_rounded,
      bgColor: const Color(0xFFF9A825),
      iconColor: Colors.white,
    );
  }

  static void error(String message) {
    _showCustomToast(
      message,
      icon: Icons.error_rounded,
      bgColor: const Color(0xFFE53935),
      iconColor: Colors.white,
    );
  }

  // ==========================================================
  // PREMIUM TOAST LAYOUT
  // ==========================================================
  static void _showCustomToast(
      String message, {
        required IconData icon,
        required Color bgColor,
        required Color iconColor,
      }) {
    showToastWidget(
      _buildToast(message, icon: icon, bg: bgColor, iconColor: iconColor),
      position: ToastPosition.bottom,
      duration: const Duration(seconds: 3),
      animationCurve: Curves.easeOutBack,
      animationDuration: const Duration(milliseconds: 350),
    );
  }

  static Widget _buildToast(
      String message, {
        required IconData icon,
        required Color bg,
        required Color iconColor,
      }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 40),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: bg.withOpacity(0.95),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: iconColor, size: 22),
          const SizedBox(width: 12),
          Flexible(
            child: Text(
              message,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                height: 1.3,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

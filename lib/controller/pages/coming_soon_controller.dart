import 'dart:async';

import 'package:ttk_logistics/controller/my_controller.dart';

class ComingSoonController extends MyController {
  Duration myDuration = Duration(days: 8);
  Timer? countdownTimer;

  void setCountDown() {
    final reduceSecondsBy = 1;
    final seconds = myDuration.inSeconds - reduceSecondsBy;
    if (seconds >= 0) {
      myDuration = Duration(seconds: seconds);
    }
    update();
  }

  void startTimer() {
    countdownTimer = Timer.periodic(Duration(seconds: 1), (_) => setCountDown());
  }

  @override
  void onInit() {
    startTimer();
    super.onInit();
  }
}
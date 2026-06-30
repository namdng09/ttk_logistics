import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/helper/widgets/my_text_style.dart';
import 'package:kho555/models/email_model.dart';

class InboxController extends MyController {
  List<EmailModel> emails = [];

  final editorTextStyle =
  MyTextStyle.bodyMedium(fontWeight: 600, textStyle: GoogleFonts.poppins());

  @override
  void onInit() {
    EmailModel.dummyList.then((value) {
      emails = value;
      update();
    });
    super.onInit();
  }

  void onCheckMail(EmailModel mail) {
    mail.isCheckMail = !mail.isCheckMail;
    update();
  }

  void gotoDetailScreen() {
    Get.toNamed('/email/read');
  }
}
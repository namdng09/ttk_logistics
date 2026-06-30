import 'package:url_launcher/url_launcher.dart';

class UrlService {
  static Future<void> goToUrl(String url) async {
    await launchUrl(Uri.parse(url));
  }

  static void goToPurchase() {
    goToUrl('https://codecanyon.net/item/webui-flutter-admin-dashboard-ui-kit/48069850');
  }

  static void goToRemixIcon() {
    goToUrl('https://remixicon.com/');
  }

  static String getCurrentUrl() {
    var path = Uri.base.path;
    return path.replaceAll('morvin/web/', '');
  }
}

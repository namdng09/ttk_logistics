import 'dart:math';

class Images {
  static const String _base = 'assets';

  static const String _companies = '$_base/companies';
  static const String _flags = '$_base/flags';
  static const String _product = '$_base/product';
  static const String _small = '$_base/small';
  static const String _users = '$_base/users';
  static const String _brands = '$_base/brands';

  static const String _flagSelect2 = '$_flags/select2';

  /// Brand Collections
  static const String bitbucket = '$_brands/bitbucket.png';
  static const String dribbble = '$_brands/dribbble.png';
  static const String dropbox = '$_brands/dropbox.png';
  static const String github = '$_brands/github.png';
  static const String mailChimp = '$_brands/mail_chimp.png';
  static const String slack = '$_brands/slack.png';

  /// Companies Collections
  static final List<String> companies = List.generate(8, (index) => '$_companies/img-${index + 1}.png');

  /// Flags Collections
  static const String french = '$_flags/french.jpg';
  static const String germany = '$_flags/germany.jpg';
  static const String italy = '$_flags/italy.jpg';
  static const String russia = '$_flags/russia.jpg';
  static const String spain = '$_flags/spain.jpg';
  static const String us = '$_flags/us.jpg';

  /// Flags Select 2
  static const String ak = '$_flagSelect2/ak.png';
  static const String ca = '$_flagSelect2/ca.png';
  static const String hi = '$_flagSelect2/hi.png';
  static const String nv = '$_flagSelect2/nv.png';
  static const String or = '$_flagSelect2/or.png';
  static const String wa = '$_flagSelect2/wa.png';

  /// Product Collections
  static final List<String> products = List.generate(14, (index) => '$_product/img-${index + 1}.png');

  /// Image Collections
  static final List<String> small = List.generate(7, (index) => '$_small/img-${index + 1}.jpg');

  static final List<String> users = List.generate(8, (index) => '$_users/avatar-${index + 1}.jpg');

  /// Static Assets
  static const String authenticationBg = '$_base/authentication-bg.jpg';
  static const String comingSoonBg = '$_base/coming-soon.png';
  static const String logoDark = '$_base/kho555-logo.jpg';
  static const String logoLight = '$_base/logo-light.png';
  static const String logoLightColored = '$_base/logo-light-colored.png';
  static const String logoSm = '$_base/logo-sm.png';
  static const String maintenance = '$_base/maintenance.png';
  static const String titleImg = '$_base/title-img.png';
  static const String userImg = '$_base/user-img.png';

  /// Utility: Get a random image from a list
  static String randomImage(List<String> images) {
    if (images.isEmpty) return '';
    return images[Random().nextInt(images.length)];
  }
}

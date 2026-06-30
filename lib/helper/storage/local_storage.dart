import 'package:shared_preferences/shared_preferences.dart';
import 'package:kho555/helper/localization/language.dart';
import 'package:kho555/helper/services/auth_services.dart';
import 'package:kho555/helper/theme/theme_customizer.dart';

class LocalStorage {
  static const String _loggedInUserKey = "user";
  static const String _themeCustomizerKey = "theme_customizer";
  static const String _languageKey = "lang_code";

  // ✅ Bổ sung key cho token và email
  static const String _userTokenKey = "user_token";
  static const String _userEmailKey = "user_email";
  static const String _userID = "user_ID";

  static SharedPreferences? _preferencesInstance;

  static SharedPreferences get preferences {
    if (_preferencesInstance == null) {
      throw ("Call LocalStorage.init() to initialize local storage");
    }
    return _preferencesInstance!;
  }

  static Future<void> init() async {
    _preferencesInstance = await SharedPreferences.getInstance();
    await initData();
  }

  static Future<void> initData() async {
    SharedPreferences preferences = await SharedPreferences.getInstance();
    AuthService.isLoggedIn = preferences.getBool(_loggedInUserKey) ?? false;
    ThemeCustomizer.fromJSON(preferences.getString(_themeCustomizerKey));
  }

  static Future<bool> setLoggedInUser(bool loggedIn) async {
    return preferences.setBool(_loggedInUserKey, loggedIn);
  }

  static Future<bool> setCustomizer(ThemeCustomizer themeCustomizer) {
    return preferences.setString(_themeCustomizerKey, themeCustomizer.toJSON());
  }

  static Future<bool> setLanguage(Language language) {
    return preferences.setString(_languageKey, language.locale.languageCode);
  }

  static String? getLanguage() {
    return preferences.getString(_languageKey);
  }

  static Future<bool> removeLoggedInUser() async {
    return preferences.remove(_loggedInUserKey);
  }

  // ✅ Hàm lưu token
  static Future<bool> setUserToken(String token) async {
    return preferences.setString(_userTokenKey, token);
  }

  // ✅ Hàm lưu email
  static Future<bool> setUserEmail(String email) async {
    return preferences.setString(_userEmailKey, email);
  }
  // ✅ Hàm lưu ID
  static Future<bool> setUserID(String uid) async {
    return preferences.setString(_userID, uid);
  }

  // ✅ Hàm xóa token và email khi logout
  static Future<void> clearUserData() async {
    await preferences.remove(_userTokenKey);
    await preferences.remove(_userEmailKey);
    await preferences.remove(_loggedInUserKey);
    await preferences.remove(_userID);
  }
  // ✅ Hàm lấy trạng thái đăng nhập
  static bool? getLoggedInUser() {
    return preferences.getBool(_loggedInUserKey);
  }
  static Future<String?> getUserEmail() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userEmailKey);
  }
  static Future<String?> getUserID() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userID);
  }

  static Future<String?> getUserToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_userTokenKey);
  }
}

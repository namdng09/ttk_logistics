import 'package:ttk_logistics/helper/widgets/my_base_exception.dart';

class RouteException extends BaseException {
  final String message;

  RouteException(this.message);

  @override
  String toString() {
    return 'RouteException{message: $message}';
  }
}

import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/models/order_model.dart';

class OrdersController extends MyController {
  List<OrderModel> order = [];
  int isSelectedTab = 0;
  String searchText = '';
  String? singleSelectedOrderId;
  Set<String> multiSelectedIds = {};

  List<OrderModel> get filteredOrders {
    return order.where((o) {
      final matchesSearch =
          searchText.isEmpty ||
          o.orderID.toLowerCase().contains(searchText.toLowerCase()) ||
          o.customer.toLowerCase().contains(searchText.toLowerCase());

      final matchesTab = isSelectedTab == 0 || (isSelectedTab == 1 && o.status == 'Paid') || (isSelectedTab == 2 && o.status == 'Unpaid');

      return matchesSearch && matchesTab;
    }).toList();
  }

  void onSelectedTab(int id) {
    isSelectedTab = id;
    clearSelections();
    update();
  }

  void onSearchChanged(String text) {
    searchText = text;
    clearSelections();
    update();
  }

  void clearSelections() {
    singleSelectedOrderId = null;
    multiSelectedIds.clear();
  }

  void toggleSingleSelection(String id) {
    singleSelectedOrderId = (singleSelectedOrderId == id) ? null : id;
    update();
  }

  void toggleMultiSelection(String id) {
    if (multiSelectedIds.contains(id)) {
      multiSelectedIds.remove(id);
    } else {
      multiSelectedIds.add(id);
    }
    update();
  }

  void toggleSelectAll(bool? value) {
    final visibleIds = filteredOrders.map((o) => o.orderID).toSet();
    if (value == true) {
      multiSelectedIds = visibleIds;
    } else {
      multiSelectedIds.clear();
    }
    update();
  }

  @override
  void onInit() {
    OrderModel.dummyList.then((value) {
      order = value;
      update();
    });
    super.onInit();
  }
}

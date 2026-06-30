import 'package:kho555/controller/my_controller.dart';
import 'package:kho555/models/customer_model.dart';

class CustomersController extends MyController {
  List<CustomerModel> customers = [];
  String searchText = '';
  Set<int> selectedIds = {}; // Store integer IDs

  List<CustomerModel> get filteredCustomers {
    return customers.where((c) {
      final matchesSearch = searchText.isEmpty ||
          c.customer.toLowerCase().contains(searchText.toLowerCase()) ||
          c.email.toLowerCase().contains(searchText.toLowerCase());
      return matchesSearch;
    }).toList();
  }

  void onSearchChanged(String text) {
    searchText = text;
    selectedIds.clear();
    update();
  }

  void toggleSelection(int id) {
    if (selectedIds.contains(id)) {
      selectedIds.remove(id);
    } else {
      selectedIds.add(id);
    }
    update();
  }

  void toggleSelectAll(bool? value) {
    final visibleIds = filteredCustomers.map((c) => c.id).toSet();
    if (value == true) {
      selectedIds = Set.from(visibleIds);
    } else {
      selectedIds.clear();
    }
    update();
  }

  bool? get isAllSelected {
    final visibleIds = filteredCustomers.map((c) => c.id).toSet();
    if (selectedIds.isEmpty) return false;
    if (selectedIds.length == visibleIds.length) return true;
    return null; // triggers indeterminate state
  }

  @override
  void onInit() {
    CustomerModel.dummyList.then((value) {
      customers = value;
      update();
    });
    super.onInit();
  }
}

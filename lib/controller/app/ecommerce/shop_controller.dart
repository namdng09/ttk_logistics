import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:syncfusion_flutter_maps/maps.dart';

class ShopController extends MyController {
  late List<TimeDetails> worldClockData;
  late MapShapeSource mapSource;
  final DateTime currentTime = DateTime.now().toUtc();

  @override
  void onInit() {
    mapSource = const MapShapeSource.asset('assets/data/world_map.json', shapeDataField: 'name');

    worldClockData = <TimeDetails>[
      TimeDetails('Seattle', 47.60621, -122.332071, currentTime.subtract(const Duration(hours: 7))),
      TimeDetails('Belem', -1.455833, -48.503887, currentTime.subtract(const Duration(hours: 3))),
      TimeDetails('Greenland', 71.706936, -42.604303, currentTime.subtract(const Duration(hours: 2))),
      TimeDetails('Yakutsk', 62.035452, 129.675475, currentTime.add(const Duration(hours: 9))),
      TimeDetails('Delhi', 28.704059, 77.10249, currentTime.add(const Duration(hours: 5, minutes: 30))),
      TimeDetails('Brisbane', -27.469771, 153.025124, currentTime.add(const Duration(hours: 10))),
      TimeDetails('Harare', -17.825166, 31.03351, currentTime.add(const Duration(hours: 2))),
    ];
    super.onInit();
  }

  final List<Map<String, dynamic>> shops = const [
    {
      'brand': 'assets/companies/img-1.png',
      'name': "Nedick's",
      'owner': 'Wayne McClain',
      'email': 'WayneMcclain@gmail.com',
      'date': '07/10/2020',
      'products': 86,
      'balance': '\$12,456',
    },
    {
      'brand': 'assets/companies/img-2.png',
      'name': "Brendle's",
      'owner': 'David Marshall',
      'email': 'Davidmarshall@gmail.com',
      'date': '12/10/2020',
      'products': 72,
      'balance': '\$10,352',
    },
    {
      'brand': 'assets/companies/img-3.png',
      'name': "Tech Hifi",
      'owner': 'Katia Stapleton',
      'email': 'Katiastapleton@gmail.com',
      'date': '14/10/2020',
      'products': 75,
      'balance': '\$9,963',
    },
    {
      'brand': 'assets/companies/img-5.png',
      'name': "Packer",
      'owner': 'Mae Rankin',
      'email': 'Maerankingmail.com',
      'date': '15/10/2020',
      'products': 72,
      'balance': '\$10,352',
    },
    {
      'brand': 'assets/companies/img-4.png',
      'name': "Lafayette",
      'owner': 'Andrew Bivens',
      'email': 'Andrewbivens@gmail.com',
      'date': '20/11/2020',
      'products': 65,
      'balance': '\$14,568',
    },
    {
      'brand': 'assets/companies/img-8.png',
      'name': "Tech Hifi",
      'owner': 'John McLeroy',
      'email': 'JohnmcLeroy@gmail.com',
      'date': '30/31/2020',
      'products': 58,
      'balance': '\$14,654',
    },
  ];
}

class TimeDetails {
  TimeDetails(this.countryName, this.latitude, this.longitude, this.date);

  final String countryName;
  final double latitude;
  final double longitude;
  final DateTime date;
}

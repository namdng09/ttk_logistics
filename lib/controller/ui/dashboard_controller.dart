import 'dart:async';

import 'package:flutter/material.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/models/chart_model.dart';
import 'package:remixicon/remixicon.dart';
import 'package:syncfusion_flutter_charts/charts.dart';
import 'package:syncfusion_flutter_maps/maps.dart';

enum TimeView { day, week, month, year }

class DashboardController extends MyController {
  List<ChartSampleData>? chartData;
  TooltipBehavior? tooltipBehavior;
  List<SplineAreaData>? revenueStasticsChartData;
  TooltipBehavior? revenueStasticsTooltipBehavior;
  late PageController pageController;
  int currentPage = 0;
  Timer? autoScrollTimer;
  late List<TimeDetails> worldClockData;
  late MapShapeSource mapSource;
  final DateTime currentTime = DateTime.now().toUtc();
  TimeView selectedView = TimeView.year;

  String getLabel(TimeView view) {
    switch (view) {
      case TimeView.day:
        return 'Day';
      case TimeView.week:
        return 'Week';
      case TimeView.month:
        return 'Month';
      case TimeView.year:
        return 'Year';
    }
  }

  @override
  void onInit() {
    pageController = PageController(initialPage: currentPage);

    tooltipBehavior = TooltipBehavior(enable: true, header: '', canShowMarker: false);
    chartData = <ChartSampleData>[
      ChartSampleData(x: 'Jan', y: 5, yValue: 5),
      ChartSampleData(x: 'Feb', y: 7, yValue: 6),
      ChartSampleData(x: 'Mar', y: 7, yValue: 4),
      ChartSampleData(x: 'Apr', y: 6, yValue: 5),
      ChartSampleData(x: 'May', y: 7, yValue: 6),
      ChartSampleData(x: 'Jun', y: 5, yValue: 4),
      ChartSampleData(x: 'Jul', y: 7, yValue: 3),
      ChartSampleData(x: 'Aug', y: 6, yValue: 5),
      ChartSampleData(x: 'Sep', y: 7, yValue: 4),
      ChartSampleData(x: 'Oct', y: 4, yValue: 6),
      ChartSampleData(x: 'Nov', y: 6, yValue: 4),
      ChartSampleData(x: 'Dec', y: 7, yValue: 3),
    ];

    revenueStasticsChartData = <SplineAreaData>[
      SplineAreaData(2010, 8.2, 2.1),
      SplineAreaData(2011, 7.4, 2.9),
      SplineAreaData(2012, 9.1, 3.5),
      SplineAreaData(2013, 10.3, 4.0),
      SplineAreaData(2014, 6.8, 2.7),
      SplineAreaData(2015, 5.5, 2.3),
      SplineAreaData(2016, 7.0, 2.9),
      SplineAreaData(2017, 6.2, 3.1),
      SplineAreaData(2018, 7.5, 3.8),
    ];

    revenueStasticsTooltipBehavior = TooltipBehavior(enable: true);
    startAutoPageScroll();
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

  void startAutoPageScroll() {
    autoScrollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (pageController.hasClients) {
        final nextPage = (currentPage + 1) % products.length;
        pageController.animateToPage(nextPage, duration: const Duration(milliseconds: 500), curve: Curves.easeInOut);
        currentPage = nextPage;
      }
    });
  }

  final List<Map<String, dynamic>> activities = [
    {'type': 'image', 'image': 'assets/users/avatar-7.jpg', 'title': 'Your Manager Posted', 'subtitle': 'James Raphael', 'time': '3 days'},
    {
      'type': 'icon',
      'icon': Icons.shopping_cart,
      'bgColor': const Color(0xFFE3F2FD),
      'iconColor': const Color(0xFF2196F3),
      'title': 'You have 5 pending order.',
      'subtitle': 'America',
      'time': '1 day',
    },
    {
      'type': 'icon',
      'icon': Icons.person_outline,
      'bgColor': const Color(0xFFE8F5E9),
      'iconColor': const Color(0xFF4CAF50),
      'title': 'New Order Received',
      'subtitle': 'Thank You',
      'time': 'Today',
    },
    {'type': 'image', 'image': 'assets/users/avatar-7.jpg', 'title': 'Your Manager Posted', 'subtitle': 'James Raphael', 'time': '3 days'},
    {
      'type': 'icon',
      'icon': Icons.shopping_cart,
      'bgColor': const Color(0xFFE3F2FD),
      'iconColor': const Color(0xFF2196F3),
      'title': 'You have 1 pending order.',
      'subtitle': 'Dubai',
      'time': '1 day',
    },
    {
      'type': 'icon',
      'icon': Icons.person_outline,
      'bgColor': const Color(0xFFE8F5E9),
      'iconColor': const Color(0xFF4CAF50),
      'title': 'New Order Received',
      'subtitle': 'Thank You',
      'time': 'Today',
    },
  ];
  final List<Map<String, dynamic>> products = [
    {'image': 'assets/product/img-3.png', 'category': 'Headphone', 'title': 'Blue Headphone', 'sold': 1200, 'stock': 450},
    {'image': 'assets/product/img-5.png', 'category': 'T-shirt', 'title': 'Blue T-shirt', 'sold': 800, 'stock': 250},
    {'image': 'assets/product/img-1.png', 'category': 'Sonic', 'title': 'Alarm Clock', 'sold': 600, 'stock': 150},
  ];

  final List<Map<String, dynamic>> socialSources = const [
    {
      'platform': 'Facebook Ads',
      'icon': RemixIcons.facebook_fill,
      'bgColor': Colors.blue,
      'sales': '3.2k Sale - 4.2k Like',
      'trend': '50%',
      'trendIcon': RemixIcons.arrow_right_up_line,
      'trendColor': Colors.green,
    },
    {
      'platform': 'Twitter Ads',
      'icon': RemixIcons.twitter_fill,
      'bgColor': Colors.lightBlue,
      'sales': '3.1k Sale - 3.7k Like',
      'trend': '45%',
      'trendIcon': RemixIcons.arrow_right_up_line,
      'trendColor': Colors.green,
    },
    {
      'platform': 'LinkedIn Ads',
      'icon': RemixIcons.linkedin_fill,
      'bgColor': Colors.redAccent,
      'sales': '4.3k Sale - 4.3k Like',
      'trend': '30%',
      'trendIcon': RemixIcons.arrow_right_down_line,
      'trendColor': Colors.red,
    },
    {
      'platform': 'YouTube Ads',
      'icon': RemixIcons.youtube_fill,
      'bgColor': Colors.red,
      'sales': '4.2k Sale - 3.7k Like',
      'trend': '35%',
      'trendIcon': RemixIcons.arrow_right_up_line,
      'trendColor': Colors.green,
    },
    {
      'platform': 'GitHub Ads',
      'icon': RemixIcons.github_fill,
      'bgColor': Colors.black87,
      'sales': '4.9k Sale - 4.1k Like',
      'trend': '40%',
      'trendIcon': RemixIcons.arrow_right_up_line,
      'trendColor': Colors.green,
    },
  ];

  final List<Map<String, dynamic>> productsOfTheMonth = const [
    {
      'id': '#2356',
      'image': 'assets/product/img-7.png',
      'name': 'Green Chair',
      'customer': 'Kenneth Gittens',
      'price': '\$200.00',
      'invoice': '42',
      'status': 'Pending',
    },
    {
      'id': '#2564',
      'image': 'assets/product/img-8.png',
      'name': 'Office Chair',
      'customer': 'Alfred Gordon',
      'price': '\$242.00',
      'invoice': '54',
      'status': 'Active',
    },
    {
      'id': '#2125',
      'image': 'assets/product/img-10.png',
      'name': 'Gray Chair',
      'customer': 'Keena Reyes',
      'price': '\$320.00',
      'invoice': '65',
      'status': 'Active',
    },
    {
      'id': '#8587',
      'image': 'assets/product/img-11.png',
      'name': 'Steel Chair',
      'customer': 'Timothy Zuniga',
      'price': '\$342.00',
      'invoice': '52',
      'status': 'Pending',
    },
    {
      'id': '#2354',
      'image': 'assets/product/img-12.png',
      'name': 'Home Chair',
      'customer': 'Joann Wiliams',
      'price': '\$320.00',
      'invoice': '25',
      'status': 'Pending',
    },
  ];


  Color getStatusColor(String status) {
    switch (status) {
      case 'Active':
        return Colors.green.shade100;
      case 'Pending':
      default:
        return Colors.blue.shade100;
    }
  }

  Color getTextColor(String status) {
    switch (status) {
      case 'Active':
        return Colors.green.shade700;
      case 'Pending':
      default:
        return Colors.blue.shade700;
    }
  }


  @override
  void onClose() {
    autoScrollTimer?.cancel();
    pageController.dispose();
    super.onClose();
  }

  @override
  void dispose() {
    worldClockData.clear();
    super.dispose();
  }
}

class SplineAreaData {
  SplineAreaData(this.year, this.y1, this.y2);
  final double year;
  final double y1;
  final double y2;
}

class TimeDetails {
  TimeDetails(this.countryName, this.latitude, this.longitude, this.date);

  final String countryName;
  final double latitude;
  final double longitude;
  final DateTime date;
}

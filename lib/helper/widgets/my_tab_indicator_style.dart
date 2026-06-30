import 'package:flutter/material.dart';

enum MyTabIndicatorStyle { circle, rectangle }

class MyTabIndicator extends Decoration {
  final double indicatorHeight, width, yOffset, radius;
  final Color indicatorColor;
  final MyTabIndicatorStyle indicatorStyle;

  const MyTabIndicator({
    this.indicatorHeight = 2,
    required this.indicatorColor,
    this.indicatorStyle = MyTabIndicatorStyle.circle,
    this.width = 20,
    this.yOffset = 28,
    this.radius = 4,
  });

  @override
  MyTabIndicatorPainter createBoxPainter([VoidCallback? onChanged]) {
    return MyTabIndicatorPainter(this, onChanged);
  }
}

class MyTabIndicatorPainter extends BoxPainter {
  final MyTabIndicator decoration;

  MyTabIndicatorPainter(this.decoration, VoidCallback? onChanged) : super(onChanged);

  @override
  void paint(Canvas canvas, Offset offset, ImageConfiguration configuration) {
    assert(configuration.size != null);

    final Paint paint = Paint()
      ..color = decoration.indicatorColor
      ..style = PaintingStyle.fill;

    if (decoration.indicatorStyle == MyTabIndicatorStyle.circle) {
      final Offset circleOffset = offset + Offset(configuration.size!.width / 2, decoration.yOffset);
      canvas.drawCircle(circleOffset, decoration.radius, paint);
    } else if (decoration.indicatorStyle == MyTabIndicatorStyle.rectangle) {
      final Rect rect =
          Offset(offset.dx + configuration.size!.width / 2 - (decoration.width / 2), decoration.yOffset) &
          Size(decoration.width, decoration.indicatorHeight);

      final RRect radiusRectangle = RRect.fromRectAndRadius(rect, Radius.circular(decoration.radius));

      canvas.drawRRect(radiusRectangle, paint);
    }
  }
}

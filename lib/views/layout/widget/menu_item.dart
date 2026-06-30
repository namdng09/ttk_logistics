import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/helper/services/url_service.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/widgets/custom_pop_menu.dart';
import 'package:remixicon/remixicon.dart';

typedef LeftBarMenuFunction = void Function(String key);

class LeftBarObserver {
  static Map<String, LeftBarMenuFunction> observers = {};

  static void attachListener(String key, LeftBarMenuFunction fn) {
    observers[key] = fn;
  }

  static void detachListener(String key) {
    observers.remove(key);
  }

  static void notifyAll(String key) {
    for (var fn in observers.values) {
      fn(key);
    }
  }
}

class MenuItem extends StatefulWidget {
  final IconData? iconData;
  final String title;
  final bool isCondensed;
  final String? route;
  final List<MenuItem> childrenMenuWidget;

  const MenuItem({super.key, this.iconData, required this.title, this.isCondensed = false, this.route, this.childrenMenuWidget = const []});

  @override
  State<MenuItem> createState() => _MenuItemState();
}

class _MenuItemState extends State<MenuItem> with UIMixin, SingleTickerProviderStateMixin {
  bool isHover = false;
  bool isActive = false;
  late Animation<double> _iconTurns;
  late AnimationController _controller;
  bool popupShowing = true;
  Function? hideFn;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(duration: Duration(milliseconds: 200), vsync: this);
    _iconTurns = _controller.drive(Tween<double>(begin: 0.0, end: 0.5).chain(CurveTween(curve: Curves.easeIn)));
    LeftBarObserver.attachListener(widget.title, onChangeMenuActive);
  }

  void onChangeMenuActive(String key) {
    if (key != widget.title) {
      onChangeExpansion(false);
    }
  }

  void onChangeExpansion(bool value) {
    isActive = value;
    if (isActive) {
      _controller.forward();
    } else {
      _controller.reverse();
    }
    if (mounted) {
      setState(() {});
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    var route = UrlService.getCurrentUrl();
    isActive = widget.childrenMenuWidget.any((element) => element.route == route);
    onChangeExpansion(isActive);
    if (hideFn != null) {
      hideFn!();
    }
    popupShowing = false;
  }

  @override
  Widget build(BuildContext context) {
    bool isActive = UrlService.getCurrentUrl() == widget.route;
    if (widget.childrenMenuWidget.isEmpty) {
      return GestureDetector(
        onTap: () {
          if (widget.route != null) {
            Get.toNamed(widget.route!);
            // MyRouter.pushReplacementNamed(context, widget.route!, arguments: 1);
          }
        },
        child: MouseRegion(
          cursor: SystemMouseCursors.click,
          onHover: (event) {
            setState(() {
              isHover = true;
            });
          },
          onExit: (event) {
            setState(() {
              isHover = false;
            });
          },
          child: MyContainer.transparent(
            marginAll: 0,
            borderRadiusAll: 8,
            width: MediaQuery.of(context).size.width,
            padding: MySpacing.xy(5, 7),
            child: Row(
              children: [
                Icon(RemixIcons.circle_line,size: 12,color: (isHover || isActive) ? leftBarTheme.activeItemColor : leftBarTheme.onBackground,),
                MySpacing.width(10),
                MyText.bodyMedium(
                  widget.title,
                  overflow: TextOverflow.clip,
                  maxLines: 1,
                  textAlign: TextAlign.left,
                  fontSize: 15,
                  color: (isHover || isActive) ? leftBarTheme.activeItemColor : leftBarTheme.onBackground,
                  fontWeight: isActive || isHover ? 600 : 500,
                ),
              ],
            ),
          ),
        ),
      );
    } else if (widget.isCondensed) {
      return CustomPopupMenu(
        backdrop: true,
        show: popupShowing,
        hideFn: (hide) => hideFn = hide,
        onChange: (value) {
          popupShowing = value;
        },
        placement: CustomPopupMenuPlacement.right,
        menu: MouseRegion(
          cursor: SystemMouseCursors.click,
          onHover: (event) {
            setState(() {
              isHover = true;
            });
          },
          onExit: (event) {
            setState(() {
              isHover = false;
            });
          },
          child: MyContainer.transparent(
            margin: MySpacing.fromLTRB(16, 0, 16, 8),
            color: isActive || isHover ? leftBarTheme.activeItemBackground : Colors.transparent,
            borderRadiusAll: 8,
            padding: MySpacing.xy(8, 8),
            child: Center(
              child: Icon(
                widget.iconData,
                color: !(isHover || isActive) ? leftBarTheme.labelColor.withValues(alpha: 0.5) : leftBarTheme.onBackground,
                size: 20,
              ),
            ),
          ),
        ),
        menuBuilder: (_) => MyContainer(
          borderRadiusAll: 8,
          paddingAll: 0,
          width: 240,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: widget.childrenMenuWidget,
          ),
        ),
      );
    } else {
      return MouseRegion(
        cursor: SystemMouseCursors.click,
        onHover: (event) {
          setState(() {
            isHover = true;
          });
        },
        onExit: (event) {
          setState(() {
            isHover = false;
          });
        },
        child: MyContainer.transparent(
          margin: MySpacing.fromLTRB(24, 0, 16, 0),
          paddingAll: 0,
          borderRadiusAll: 8,
          child: ListTileTheme(
            contentPadding: EdgeInsets.all(0),
            dense: true,
            horizontalTitleGap: 0.0,
            minLeadingWidth: 0,
            child: ExpansionTile(
              tilePadding: MySpacing.zero,
              initiallyExpanded: isActive,
              maintainState: true,
              onExpansionChanged: (value) {
                LeftBarObserver.notifyAll(widget.title);
                onChangeExpansion(value);
              },
              trailing: RotationTransition(
                turns: _iconTurns,
                child: Icon(RemixIcons.arrow_down_line, size: 18, color: leftBarTheme.onBackground),
              ),
              iconColor: leftBarTheme.activeItemColor,
              childrenPadding: MySpacing.x(12),
              title: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Icon(widget.iconData, size: 20, color: isHover || isActive ? leftBarTheme.activeItemColor : leftBarTheme.onBackground),
                  MySpacing.width(18),
                  Expanded(
                    child: MyText.labelLarge(
                      widget.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.start,
                      color: isHover || isActive ? leftBarTheme.activeItemColor : leftBarTheme.onBackground,
                    ),
                  ),
                ],
              ),
              collapsedBackgroundColor: Colors.transparent,
              shape: RoundedRectangleBorder(side: BorderSide(color: Colors.transparent)),
              backgroundColor: Colors.transparent,
              children: widget.childrenMenuWidget,
            ),
          ),
        ),
      );
    }
  }
}

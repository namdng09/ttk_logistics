import 'package:ttk_logistics/views/layout/widget/menu_item.dart';
import 'package:flutter/material.dart';
import 'package:ttk_logistics/helper/services/url_service.dart';
import 'package:ttk_logistics/helper/utils/ui_mixins.dart';
import 'package:ttk_logistics/helper/widgets/my_container.dart';
import 'package:ttk_logistics/helper/widgets/my_spacing.dart';
import 'package:ttk_logistics/helper/widgets/my_text.dart';
import 'package:ttk_logistics/widgets/custom_pop_menu.dart';
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

class MenuWidget extends StatefulWidget {
  final IconData iconData;
  final String title;
  final bool isCondensed;
  final bool active;
  final String? route;
  final List<MenuItem> children;

  const MenuWidget({
    super.key,
    required this.iconData,
    required this.title,
    this.isCondensed = false,
    this.active = false,
    this.children = const [],
    this.route,
  });

  @override
  State<MenuWidget> createState() => _MenuWidgetState();
}

class _MenuWidgetState extends State<MenuWidget> with UIMixin, SingleTickerProviderStateMixin {
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
    isActive = widget.children.any((element) => element.route == route);
    onChangeExpansion(isActive);
    if (hideFn != null) {
      hideFn!();
    }
    popupShowing = false;
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isCondensed) {
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

          /// Small Side Bar
          child: MyContainer(
            margin: MySpacing.xy(!widget.isCondensed ? 20 : 15, 8),
            borderRadiusAll: 8,
            color: (isHover || isActive) ? leftBarTheme.labelColor.withValues(alpha: 0.12) : Colors.transparent,
            paddingAll: 10,
            child: Icon(widget.iconData, color: (isHover || isActive) ? leftBarTheme.activeItemColor : leftBarTheme.onBackground, size: 20),
          ),
        ),
        menuBuilder: (_) => MyContainer(
          borderRadiusAll: 8,
          paddingAll: 8,
          width: 240,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, mainAxisSize: MainAxisSize.min, children: widget.children),
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
          margin: MySpacing.xy(!widget.isCondensed ? 20 : 15, 4),
          paddingAll: 10,
          child: ListTileTheme(
            contentPadding: EdgeInsets.all(0),
            dense: true,
            horizontalTitleGap: 0.0,
            minLeadingWidth: 0,
            minVerticalPadding: 0,
            child: ExpansionTile(
              tilePadding: MySpacing.zero,
              initiallyExpanded: isActive,
              maintainState: true,
              visualDensity: VisualDensity.compact,
              dense: true,
              minTileHeight: 0,
              onExpansionChanged: (value) {
                LeftBarObserver.notifyAll(widget.title);
                onChangeExpansion(value);
              },
              trailing: RotationTransition(
                turns: _iconTurns,
                child: Icon(
                  RemixIcons.arrow_down_s_line,
                  size: 18,
                  color: (isHover || isActive) ? leftBarTheme.activeItemColor : leftBarTheme.onBackground,
                ),
              ),
              iconColor: (isHover || isActive) ? leftBarTheme.activeItemColor : leftBarTheme.onBackground,
              childrenPadding: MySpacing.xy(12, 8),
              title: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  /// Large Side Bar
                  Icon(
                    widget.iconData,
                    size: 20,
                    color: (isHover || isActive) ? leftBarTheme.activeItemColor : leftBarTheme.onBackground,
                  ),
                  MySpacing.width(10),
                  Expanded(
                    child: MyText.labelLarge(
                      widget.title,
                      maxLines: 1,
                      fontSize: 15,
                      overflow: TextOverflow.ellipsis,
                      textAlign: TextAlign.start,
                      color: (isHover || isActive) ? leftBarTheme.activeItemColor : leftBarTheme.onBackground,
                    ),
                  ),
                ],
              ),
              collapsedBackgroundColor: Colors.transparent,
              shape: RoundedRectangleBorder(side: BorderSide(color: Colors.transparent)),
              backgroundColor: Colors.transparent,
              children: widget.children,
            ),
          ),
        ),
      );
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
    LeftBarObserver.detachListener(widget.title);
  }
}

import 'package:flutter/material.dart';

enum CustomPopupMenuPlacement { left, right, top, bottom }

typedef HideFn = void Function(Function hideFn);

class CustomPopupMenu extends StatefulWidget {
  final Widget menu;
  final ValueChanged<bool> onChange;
  final WidgetBuilder menuBuilder;
  final int selectedIndex;
  final CustomPopupMenuPlacement placement;
  final double offsetX, offsetY;
  final bool backdrop;
  final bool show;
  final HideFn? hideFn;

  const CustomPopupMenu({
    super.key,
    required this.menu,
    required this.onChange,
    required this.menuBuilder,
    this.selectedIndex = 0,
    this.backdrop = false,
    this.show = true,
    this.placement = CustomPopupMenuPlacement.bottom,
    this.offsetX = 0,
    this.offsetY = 0,
    this.hideFn,
  });

  @override
  State<CustomPopupMenu> createState() => _CustomPopupMenuState();
}

class _CustomPopupMenuState extends State<CustomPopupMenu> {
  final GlobalKey _buttonKey = GlobalKey();
  OverlayEntry? _menuOverlay;
  OverlayEntry? _backdropOverlay;

  @override
  void initState() {
    super.initState();
    widget.hideFn?.call(_closeMenu);
  }

  void _openMenu() {
    final RenderBox renderBox = _buttonKey.currentContext?.findRenderObject() as RenderBox;
    final Offset position = renderBox.localToGlobal(Offset.zero);
    final Size size = renderBox.size;

    final double left, top;

    switch (widget.placement) {
      case CustomPopupMenuPlacement.top:
        top = position.dy - widget.offsetY;
        left = position.dx + widget.offsetX;
        break;
      case CustomPopupMenuPlacement.bottom:
        top = position.dy + size.height + widget.offsetY;
        left = position.dx + widget.offsetX;
        break;
      case CustomPopupMenuPlacement.left:
        top = position.dy + widget.offsetY;
        left = position.dx - widget.offsetX;
        break;
      case CustomPopupMenuPlacement.right:
        top = position.dy + widget.offsetY;
        left = position.dx + size.width + widget.offsetX;
        break;
    }

    _backdropOverlay = OverlayEntry(
      builder: (_) => GestureDetector(
        onTap: _closeMenu,
        behavior: HitTestBehavior.translucent,
        child: Container(
          color: widget.backdrop ? Colors.black.withValues(alpha: 0.05) : Colors.transparent,
          width: MediaQuery.of(context).size.width,
          height: MediaQuery.of(context).size.height,
        ),
      ),
    );

    _menuOverlay = OverlayEntry(
      builder: (_) => Positioned(
        left: left,
        top: top,
        child: Material(elevation: 4, child: widget.menuBuilder(context)),
      ),
    );

    Overlay.of(context).insertAll([_backdropOverlay!, _menuOverlay!]);
    widget.onChange(true);
  }

  void _closeMenu() {
    _menuOverlay?.remove();
    _backdropOverlay?.remove();
    _menuOverlay = null;
    _backdropOverlay = null;
    widget.onChange(false);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      key: _buttonKey,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onTap: () {
            if (_menuOverlay != null) {
              _closeMenu();
            } else {
              _openMenu();
            }
          },
          child: widget.menu,
        ),
      ),
    );
  }
}

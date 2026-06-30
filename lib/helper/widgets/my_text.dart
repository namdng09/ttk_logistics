// ignore_for_file: annotate_overrides, overridden_fields

import 'package:flutter/material.dart';
import 'package:ttk_logistics/helper/widgets/my_text_style.dart';

class MyText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final int? fontWeight;
  final bool muted, xMuted;
  final double? letterSpacing;
  final Color? color;
  final TextDecoration decoration;
  final double? height;
  final double wordSpacing;
  final double? fontSize;
  final MyTextType textType;
  final TextAlign? textAlign;
  final int? maxLines;
  final Locale? locale;
  final TextOverflow? overflow;
  final String? semanticsLabel;
  final bool? softWrap;
  final StrutStyle? strutStyle;
  final TextDirection? textDirection;
  final TextHeightBehavior? textHeightBehavior;
  final double? textScaleFactor;
  final TextWidthBasis? textWidthBasis;

  const MyText(
    this.text, {
    super.key,
    this.style,
    this.fontWeight = 500,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing = 0.15,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.bodyMedium,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.displayLarge(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.displayLarge,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.displayMedium(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.displayMedium,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.displaySmall(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.displaySmall,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.headlineLarge(
    this.text, {
    super.key,
    this.style,
    this.fontWeight = 500,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.headlineLarge,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.headlineMedium(
    this.text, {
    super.key,
    this.style,
    this.fontWeight = 500,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.headlineMedium,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.headlineSmall(
    this.text, {
    super.key,
    this.style,
    this.fontWeight = 500,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.headlineSmall,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.titleLarge(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.titleLarge,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.titleMedium(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.titleMedium,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.titleSmall(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.titleSmall,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.labelLarge(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.labelLarge,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.labelMedium(
    this.text, {
    super.key,
    this.style,
    this.fontWeight = 500,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.labelMedium,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.labelSmall(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.labelSmall,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.bodyLarge(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.bodyLarge,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.bodyMedium(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.bodyMedium,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  const MyText.bodySmall(
    this.text, {
    super.key,
    this.style,
    this.fontWeight,
    this.muted = false,
    this.xMuted = false,
    this.letterSpacing,
    this.color,
    this.decoration = TextDecoration.none,
    this.height,
    this.wordSpacing = 0,
    this.fontSize,
    this.textType = MyTextType.bodySmall,
    this.textAlign,
    this.maxLines,
    this.locale,
    this.overflow,
    this.semanticsLabel,
    this.softWrap,
    this.strutStyle,
    this.textDirection,
    this.textHeightBehavior,
    this.textScaleFactor,
    this.textWidthBasis,
  });

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style:
          style ??
          MyTextStyle.getStyle(
            textStyle: style,
            color: color,
            fontWeight: fontWeight ?? MyTextStyle.defaultTextFontWeight[textType] ?? 500,
            muted: muted,
            letterSpacing: letterSpacing ?? MyTextStyle.defaultLetterSpacing[textType] ?? 0.15,
            height: height,
            xMuted: xMuted,
            decoration: decoration,
            wordSpacing: wordSpacing,
            fontSize: fontSize ?? MyTextStyle.defaultTextSize[textType],
          ),
      textAlign: textAlign,
      maxLines: maxLines,
      locale: locale,
      overflow: overflow,
      semanticsLabel: semanticsLabel,
      softWrap: softWrap,
      strutStyle: strutStyle,
      textDirection: textDirection,
      textHeightBehavior: textHeightBehavior,
      textWidthBasis: textWidthBasis,
    );
  }
}

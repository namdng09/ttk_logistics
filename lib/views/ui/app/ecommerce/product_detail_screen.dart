import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/app/ecommerce/product_detail_controller.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_star_rating.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class ProductDetailScreen extends StatefulWidget {
  const ProductDetailScreen({super.key});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> with UIMixin {
  late ProductDetailController controller;

  @override
  void initState() {
    controller = Get.put(ProductDetailController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Product Details',
          mainScreenName: 'Ecommerce',
          child: Column(
            children: [
              MyCard(
                shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
                borderRadiusAll: 4,
                height: 600,
                child: MyFlex(
                  children: [
                    MyFlexItem(sizes: 'lg-6', child: productImages()),
                    MyFlexItem(sizes: 'lg-6', child: productDetails()),
                  ],
                ),
              ),
              MySpacing.height(20),
              productTrack(),
              MySpacing.height(20),
              reviews(),
            ],
          ),
        );
      },
    );
  }

  Widget productImages() {
    return MyFlex(
      contentPadding: false,
      children: [
        MyFlexItem(
          sizes: 'xxl-2 xl-2 lg-2 md-2 sm-2 xs-2',
          child: SizedBox(
            height: 500,
            child: ListView.separated(
              shrinkWrap: true,
              itemCount: controller.images.length,
              itemBuilder: (context, index) {
                return MyContainer(
                  onTap: () => controller.onChangeImage(controller.images[index]),
                  height: 80,
                  width: 80,
                  paddingAll: 12,
                  color: controller.selectedImage == controller.images[index] ? contentTheme.secondary.withValues(alpha: 0.2) : null,
                  child: Image.asset(controller.images[index]),
                );
              },
              separatorBuilder: (context, index) {
                return SizedBox(height: 24);
              },
            ),
          ),
        ),
        MyFlexItem(
          sizes: 'xxl-8 xl-8 lg-8 md-8 sm-8 xs-8',
          child: MyContainer.bordered(height: 400, child: Image.asset(controller.selectedImage)),
        ),
      ],
    );
  }

  Widget productDetails() {
    return SizedBox(
      height: 550,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          MyText.bodyMedium("Chair", fontWeight: 600, color: contentTheme.primary),
          MyText.bodyLarge('Home & Office Chair Green', fontWeight: 600),
          MyStarRating(rating: 4),
          Row(
            children: [
              MyText.bodyLarge('\$200', decoration: TextDecoration.lineThrough, fontWeight: 600),
              MySpacing.width(12),
              MyText.bodyLarge('\$240', fontWeight: 600),
              MySpacing.width(12),
              MyText.bodySmall('25% off', color: contentTheme.danger),
            ],
          ),
          MySpacing.height(12),
          Divider(height: 0),
          MySpacing.height(12),
          MyText.bodyMedium('Feature :', fontWeight: 600),
          MySpacing.height(12),
          Row(
            children: [
              Icon(RemixIcons.check_fill, color: contentTheme.success, size: 16),
              MySpacing.width(8),
              MyText.bodyMedium('Various have evolved over years sometimes on purpose.'),
            ],
          ),
          MySpacing.height(8),
          Row(
            children: [
              Icon(RemixIcons.check_fill, color: contentTheme.success, size: 16),
              MySpacing.width(8),
              MyText.bodyMedium('Various have evolved over years sometimes on purpose.'),
            ],
          ),
          MySpacing.height(8),
          Row(
            children: [
              Icon(RemixIcons.check_fill, color: contentTheme.success, size: 16),
              MySpacing.width(8),
              MyText.bodyMedium('Various have evolved over years sometimes on purpose.'),
            ],
          ),
          MySpacing.height(12),
          MyContainer(
            color: contentTheme.primary,
            paddingAll: 12,
            onTap: () {},
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(RemixIcons.shopping_cart_line, size: 18, color: contentTheme.onPrimary),
                MySpacing.width(12),
                MyText.bodyMedium('Add to cart', fontWeight: 600, color: contentTheme.onPrimary),
              ],
            ),
          ),
          MySpacing.height(12),
          MyText.bodyMedium('Color:', fontWeight: 600),
          MySpacing.height(12),
          Row(
            spacing: 12,
            children: [
              colorImage(0, 'assets/product/img-7.png', 'Blue'),
              colorImage(1, 'assets/product/img-8.png', 'Cyan'),
              colorImage(2, 'assets/product/img-9.png', 'Green'),
            ],
          ),
        ],
      ),
    );
  }

  Widget colorImage(int id, String image, String chairColor) {
    bool isSelect = controller.isSelectColorImage == id;
    return Column(
      children: [
        MyContainer.bordered(
          onTap: () => controller.onChangeSelectedColorImage(id),
          paddingAll: 12,
          height: 80,
          width: 80,
          border: Border.all(width: 1.5, color: isSelect ? contentTheme.primary : contentTheme.secondary.withValues(alpha: 0.2)),
          child: Image.asset(image),
        ),
        MySpacing.height(12),
        MyText.bodyMedium(chairColor, color: isSelect ? contentTheme.primary : null, fontWeight: isSelect ? 600 : 500),
      ],
    );
  }

  Widget productTrack() {
    Widget detailsOfProductTrack(IconData icon, Color color, String title, String description) {
      return MyContainer.bordered(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color),
            MySpacing.height(12),
            MyText.titleMedium(title, muted: true, fontWeight: 600),
            MySpacing.height(12),
            MyText.bodyMedium(description),
          ],
        ),
      );
    }

    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium('Product Track :', fontWeight: 600),
          MySpacing.height(12),
          MyFlex(
            children: [
              MyFlexItem(
                sizes: 'lg-3 md-6',
                child: detailsOfProductTrack(
                  RemixIcons.truck_line,
                  contentTheme.primary,
                  "FAST DELIVERY",
                  'Passages and more recently with desktop publishing software like Aldus PageMaker including versions.',
                ),
              ),
              MyFlexItem(
                sizes: 'lg-3 md-6',
                child: detailsOfProductTrack(
                  RemixIcons.refresh_line,
                  contentTheme.danger,
                  "Returns in 7 Days",
                  'Principle of selection: he rejects pleasures to secure other greater pleasures or else endures pains worse pains."',
                ),
              ),
              MyFlexItem(
                sizes: 'lg-3 md-6',
                child: detailsOfProductTrack(
                  RemixIcons.customer_service_line,
                  contentTheme.warning,
                  "Online Support 24/7",
                  'Passages and more recently with desktop publishing software like Aldus PageMaker including versions.',
                ),
              ),
              MyFlexItem(
                sizes: 'lg-3 md-6',
                child: detailsOfProductTrack(
                  RemixIcons.wallet_line,
                  contentTheme.success,
                  "Secure Payment",
                  'Welcomed and every pain avoided certain circumstances and owing to the business it will frequently occur that.',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget reviews() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium("Reviews :", fontWeight: 600),
          MySpacing.height(12),
          Row(children: [MyStarRating(rating: 4), MySpacing.width(12), MyText.bodyMedium('(132 customer Review)')]),
          MySpacing.height(12),
          MyContainer.bordered(
            child: Column(
              children: List.generate(controller.reviewList.length, (index) {
                final review = controller.reviewList[index];
                return Column(
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              MyText.bodyMedium(review['comment']!, muted: true),
                              MySpacing.height(8),
                              MyText.bodyLarge(review['name']!, fontWeight: 600),
                              MySpacing.height(8),
                              Row(
                                children: [
                                  TextButton.icon(onPressed: () {}, icon: Icon(RemixIcons.thumb_up_line, size: 16), label: MyText.bodyMedium('Like')),
                                  TextButton.icon(
                                    onPressed: () {},
                                    icon: Icon(RemixIcons.message_2_line, size: 16),
                                    label: MyText.bodyMedium('Comment'),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        MyText.bodySmall(review['date']!, fontWeight: 600),
                      ],
                    ),
                    if (index != controller.reviewList.length - 1) Divider(height: 20),
                  ],
                );
              }),
            ),
          ),
        ],
      ),
    );
  }
}

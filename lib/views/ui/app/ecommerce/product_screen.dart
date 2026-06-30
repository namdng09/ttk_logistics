import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:kho555/controller/app/ecommerce/product_controller.dart';
import 'package:kho555/helper/utils/my_shadow.dart';
import 'package:kho555/helper/utils/ui_mixins.dart';
import 'package:kho555/helper/widgets/my_card.dart';
import 'package:kho555/helper/widgets/my_container.dart';
import 'package:kho555/helper/widgets/my_flex.dart';
import 'package:kho555/helper/widgets/my_flex_item.dart';
import 'package:kho555/helper/widgets/my_spacing.dart';
import 'package:kho555/helper/widgets/my_star_rating.dart';
import 'package:kho555/helper/widgets/my_text.dart';
import 'package:kho555/models/product_model.dart';
import 'package:kho555/views/layout/layout.dart';
import 'package:remixicon/remixicon.dart';

class ProductScreen extends StatefulWidget {
  const ProductScreen({super.key});

  @override
  State<ProductScreen> createState() => _ProductScreenState();
}

class _ProductScreenState extends State<ProductScreen> with UIMixin {
  late ProductController controller;

  @override
  void initState() {
    controller = Get.put(ProductController());
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return GetBuilder<ProductController>(
      init: controller,
      builder: (controller) {
        return Layout(
          subScreenName: 'Products',
          mainScreenName: 'Ecommerce',
          child: MyFlex(
            children: [
              MyFlexItem(sizes: 'lg-3', child: filter()),
              MyFlexItem(sizes: 'lg-9', child: productList()),
            ],
          ),
        );
      },
    );
  }

  Widget filter() {
    return MyCard(
      shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
      borderRadiusAll: 4,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          MyText.titleMedium('Filter', fontWeight: 600),
          MySpacing.height(12),
          MyContainer.bordered(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyText.bodyMedium('Search', fontWeight: 600),
                MySpacing.height(12),
                TextFormField(
                  decoration: InputDecoration(
                    hintText: "Search",
                    isDense: true,
                    isCollapsed: true,
                    contentPadding: MySpacing.all(12),
                    prefixIcon: Icon(RemixIcons.search_line),
                    border: OutlineInputBorder(borderSide: BorderSide(width: 0.4)),
                  ),
                  onChanged: (val) {
                    controller.searchText = val;
                    controller.applyFilters();
                  },
                ),
              ],
            ),
          ),
          MySpacing.height(12),
          MyContainer.bordered(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyText.titleMedium("Categories", fontWeight: 600),
                MySpacing.height(12),
                _buildExpansionTile(
                  icon: RemixIcons.computer_line,
                  title: 'Electronic',
                  children: const ['Mobile', 'Camera', 'Mobile accessories', 'Computers', 'Laptops', 'Speakers'],
                ),
                _buildExpansionTile(
                  icon: RemixIcons.armchair_line,
                  title: 'Furniture',
                  initiallyExpanded: false,
                  activeIndex: 0,
                  children: const ['Chairs', 'Tables', 'Beds', 'Seating'],
                ),
                _buildExpansionTile(icon: Icons.child_care, title: 'Baby & Kids', children: const ['Clothing', 'Footwear', 'Toys', 'Baby care']),
                _buildExpansionTile(
                  icon: Icons.fitness_center,
                  title: 'Fitness',
                  children: const ['Gym equipment', 'Yoga mat', 'Dumbbells', 'Protein supplements'],
                ),
              ],
            ),
          ),
          MySpacing.height(12),
          MyContainer.bordered(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyText.titleMedium("Multi Range", fontWeight: 600),
                MySpacing.height(12),
                Column(
                  children: controller.ranges.map((range) {
                    return RadioGroup<String>(
                      groupValue: controller.selectedRange,
                      onChanged: (value) {
                        setState(() {
                          controller.selectedRange = value!;
                        });
                        controller.applyFilters();
                      },
                      child: RadioListTile<String>(
                        contentPadding: EdgeInsets.zero,
                        value: range,
                        title: Text(range),
                        dense: true,
                        visualDensity: VisualDensity.compact,
                      ),
                    )
                    ;
                  }).toList(),
                ),
              ],
            ),
          ),
          MySpacing.height(12),
          MyContainer.bordered(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                MyText.titleMedium("Price"),
                MySpacing.height(12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    MyContainer(
                      color: contentTheme.secondary.withAlpha(50),
                      padding: MySpacing.xy(9, 4),
                      child: MyText.labelMedium('\$${controller.rangeValues.start.round()}', color: contentTheme.secondary),
                    ),
                    MyContainer(
                      color: contentTheme.secondary.withAlpha(50),
                      padding: MySpacing.xy(9, 4),
                      child: MyText.labelMedium('\$${controller.rangeValues.end.round()}', color: contentTheme.secondary),
                    ),
                  ],
                ),
                RangeSlider(
                  values: controller.rangeValues,
                  min: 0,
                  max: 1000,
                  divisions: 20,
                  labels: RangeLabels('\$${controller.rangeValues.start.round()}', '\$${controller.rangeValues.end.round()}'),
                  onChanged: (RangeValues values) {
                    setState(() {
                      controller.rangeValues = values;
                    });
                    controller.applyFilters();
                  },
                  activeColor: contentTheme.primary,
                  inactiveColor: contentTheme.secondary.withAlpha(50),
                ),
              ],
            ),
          ),
          MySpacing.height(12),
          MyContainer.bordered(
            child: ExpansionTile(
              initiallyExpanded: false,
              dense: true,
              minTileHeight: 20,
              visualDensity: VisualDensity.compact,
              title: MyText.titleMedium("Discount", fontWeight: 600),
              children: controller.discountOptions.entries.map((entry) {
                return RadioGroup<String>(
                  groupValue: controller.selectedDiscount,
                  onChanged: (value) {
                    setState(() {
                      controller.selectedDiscount = value;
                    });
                    controller.applyFilters();
                  },
                  child: Column(
                    children: controller.discountOptions.entries.map((entry) {
                      return RadioListTile<String>(
                        value: entry.key,
                        title: Text(entry.value),
                        dense: true,
                        visualDensity: VisualDensity.compact,
                      );
                    }).toList(),
                  ),
                )
                ;
              }).toList(),
            ),
          ),
          MySpacing.height(12),
          MyContainer.bordered(
            child: ExpansionTile(
              initiallyExpanded: false,
              dense: true,
              minTileHeight: 20,
              visualDensity: VisualDensity.compact,
              title: MyText.titleMedium("Customer Rating", fontWeight: 600),
              children: controller.ratings.map((rating) {
                return RadioGroup<int>(
                  groupValue: controller.selectedRating,
                  onChanged: (value) {
                    setState(() {
                      controller.selectedRating = value;
                    });
                    controller.applyFilters();
                  },
                  child: RadioListTile<int>(
                    value: rating,
                    visualDensity: VisualDensity.compact,
                    dense: true,
                    title: Row(
                      children: [
                        MyText.bodyMedium('$rating'),
                        MySpacing.width(4),
                        Icon(Icons.star, color: Colors.amber, size: 20),
                        if (rating != 1) ...[
                          MySpacing.width(4),
                          MyText.bodyMedium('& Above'),
                        ],
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExpansionTile({
    required IconData icon,
    required String title,
    required List<String> children,
    bool initiallyExpanded = false,
    int? activeIndex,
  }) {
    return ExpansionTile(
      initiallyExpanded: initiallyExpanded,
      visualDensity: VisualDensity.compact,
      leading: Icon(icon, size: 18),
      title: MyText.bodyMedium(title),
      trailing: const Icon(Icons.expand_more),
      children: children.asMap().entries.map((entry) {
        final item = entry.value;
        return ListTile(
          dense: true,
          visualDensity: VisualDensity.compact,
          leading: const Icon(Icons.circle, size: 8),
          title: MyText.bodyMedium(
            item,
            color: controller.selectedCategory == item ? contentTheme.primary : Colors.black87,
            fontWeight: controller.selectedCategory == item ? 700 : 600,
          ),
          onTap: () {
            setState(() {
              controller.selectedCategory = item;
            });
            controller.applyFilters();
          },
        );
      }).toList(),
    );
  }

  Widget productList() {
    return controller.products.isEmpty
        ? Center(child: MyText.bodyLarge('No products found'))
        : GridView.builder(
            itemCount: controller.products.length,
            shrinkWrap: true,
            physics: NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
              maxCrossAxisExtent: 400,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              mainAxisExtent: 456,
            ),
            itemBuilder: (context, index) {
              ProductModel product = controller.products[index];
              return MyCard(
                shadow: MyShadow(elevation: 1, position: MyShadowPosition.bottom),
                borderRadiusAll: 4,
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Image.asset(product.image),
                        if (product.discount != null && product.discount!.isNotEmpty)
                          Positioned(
                            top: 0,
                            left: 0,
                            child: ClipPath(
                              clipper: DiscountClipper(),
                              child: Container(
                                width: 62,
                                height: 60,
                                color: contentTheme.primary,
                                alignment: Alignment.center,
                                child: MyText.labelMedium(
                                  product.discount!,
                                  color: contentTheme.onPrimary,
                                  fontWeight: 600,
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                    MySpacing.height(12),
                    Column(
                      children: [
                        MyText.bodyLarge(product.name, fontWeight: 700),
                        MySpacing.height(8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            MyText.titleLarge("\$${product.price}", fontWeight: 600, height: 0),
                            if (product.originalPrice != null) ...[
                              MySpacing.width(8),
                              MyText.bodyMedium("\$${product.originalPrice}", decoration: TextDecoration.lineThrough),
                            ],
                          ],
                        ),
                        MySpacing.height(8),
                        MyStarRating(rating: product.rating),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
  }
}

class DiscountClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();

    path.moveTo(size.width * 0.5, 0);
    path.cubicTo(size.width * 0.85, 0, size.width * 1.0, size.height * 0.3, size.width * 1.0, size.height * 0.5);
    path.cubicTo(size.width * 1.0, size.height * 0.75, size.width * 0.7, size.height, size.width * 0.5, size.height);
    path.cubicTo(size.width * 0.2, size.height, 0, size.height * 0.75, 0, size.height * 0.5);
    path.cubicTo(0, size.height * 0.25, size.width * 0.2, 0, size.width * 0.5, 0);

    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

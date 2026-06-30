import 'dart:convert';

class ConfigBlock {
  dynamic data; // 🔁 bỏ final

  ConfigBlock({required this.data});

  factory ConfigBlock.fromJson(Map<String, dynamic> json) {
// print('json ConfigBlock $json'); // TODO: remove debug
    // field_mo_ta_slider chứa JSON gốc
    final raw = json;
    dynamic parsed;
    parsed = raw;

    return ConfigBlock(data: parsed);
  }

  Map<String, dynamic> toJson() {
    return {
      "field_mo_ta_slider": jsonEncode(data),
    };
  }
  ConfigBlock copyWith({dynamic data}) {
    return ConfigBlock(data: data ?? this.data);
  }
}

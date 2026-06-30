class DanhMuc {
  final String title;
  final String phanLoai;

  DanhMuc({required this.title, required this.phanLoai});

  factory DanhMuc.fromJson(Map<String, dynamic> json) {
    return DanhMuc(
      title: json['title'] ?? '',
      phanLoai: json['field_phan_loai'] ?? '',
    );
  }
}

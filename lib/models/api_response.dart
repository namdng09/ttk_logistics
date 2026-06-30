class ApiResponse {
  final bool success;
  final String message;

  ApiResponse({required this.success, required this.message});

  factory ApiResponse.fromJson(Map<String, dynamic> json) {
    return ApiResponse(
      success: json["success"] ?? false,
      message: json["content"]?.toString() ?? "",
    );
  }
}

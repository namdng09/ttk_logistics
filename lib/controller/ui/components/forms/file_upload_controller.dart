import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:remixicon/remixicon.dart';

class FileUploadController extends MyController {
  final List<PlatformFile> files = [];
  bool selectMultipleFile = false;
  FileType fileType = FileType.any;

  Future<void> pickFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: selectMultipleFile, type: fileType);

    if (result?.files.isNotEmpty ?? false) {
      files.addAll(result!.files);
      update();
    }
  }

  void onSelectMultipleFile(bool value) {
    if (selectMultipleFile != value) {
      selectMultipleFile = value;
      update();
    }
  }

  void removeFile(PlatformFile file) {
    files.remove(file);
    update();
  }

  IconData getFileIcon(String fileName) {
    final ext = _getFileExtension(fileName);
    if (_imageExtensions.contains(ext)) return RemixIcons.image_2_line;
    if (_pdfExtensions.contains(ext)) return RemixIcons.file_pdf_line;
    if (_wordExtensions.contains(ext)) return RemixIcons.file_word_2_line;
    if (_excelExtensions.contains(ext)) return RemixIcons.file_excel_2_line;
    if (_pptExtensions.contains(ext)) return RemixIcons.file_ppt_2_line;
    if (_textExtensions.contains(ext)) return RemixIcons.file_text_line;
    if (_archiveExtensions.contains(ext)) return RemixIcons.file_zip_line;
    if (_videoExtensions.contains(ext)) return RemixIcons.film_line;
    if (_audioExtensions.contains(ext)) return RemixIcons.music_line;
    if (_codeExtensions.contains(ext)) return RemixIcons.code_line;

    return RemixIcons.file_line;
  }

  String _getFileExtension(String fileName) {
    return fileName.split('.').last.toLowerCase();
  }

  static const List<String> _imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  static const List<String> _pdfExtensions = ['pdf'];
  static const List<String> _wordExtensions = ['doc', 'docx'];
  static const List<String> _excelExtensions = ['xls', 'xlsx'];
  static const List<String> _pptExtensions = ['ppt', 'pptx'];
  static const List<String> _textExtensions = ['txt', 'md'];
  static const List<String> _archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz'];
  static const List<String> _videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  static const List<String> _audioExtensions = ['mp3', 'wav', 'flac', 'aac'];
  static const List<String> _codeExtensions = ['html', 'css', 'js', 'json', 'xml', 'dart', 'py', 'java', 'ts'];
}

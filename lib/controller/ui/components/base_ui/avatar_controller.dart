import 'package:kho555/controller/my_controller.dart';

import 'package:kho555/images.dart';

class AvatarController extends MyController {
  List<String> images =[
    Images.users[1],
    Images.users[2],
    Images.users[3],
    Images.users[4],
  ];

  final List<AvatarData> avatars = [
    AvatarData(imageUrl: Images.users[1]),
    AvatarData(imageUrl: Images.users[3]),
    AvatarData(title: 'K'),
    AvatarData(title: '9+'),
  ];
}


class AvatarData {
  final String? imageUrl;
  final String? title;

  AvatarData({
    this.imageUrl,
    this.title
  });
}

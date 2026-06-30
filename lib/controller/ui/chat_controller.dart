import 'dart:async';

import 'package:ttk_logistics/controller/my_controller.dart';
import 'package:ttk_logistics/models/chat_model.dart';
import 'package:flutter/material.dart';

class ChatController extends MyController {
  late GlobalKey<ScaffoldState> scaffoldKey;
  List<ChatModel> chat = [];
  List<ChatModel> searchChat = [];
  ChatModel? selectChat;
  SearchController searchController = SearchController();
  TextEditingController messageController = TextEditingController();
  int currentIndex = 0;
  List<Groups> group = [];
  bool isTyping = false;
  String? typingUserId;
  ScrollController? scrollController;
  Timer? typingTimer;
  late Timer _timer;

  @override
  void onInit() {
    scaffoldKey = GlobalKey<ScaffoldState>();
    scrollController = ScrollController();
    ChatModel.dummyList.then((value) {
      chat = value;
      searchChat = value;
      selectChat = chat[0];
      update();
    });

    group = [
      Groups(name: "General"),
      Groups(name: "Company", badge: 33),
      Groups(name: "Life Suckers", badge: 17),
      Groups(name: "Drama Club"),
      Groups(name: "Unknown Friends"),
      Groups(name: "Family Ties", badge: 65),
      Groups(name: "2Good4U"),
    ];
    super.onInit();
  }

  void onSearchChat(String query) {
    final input = query.toLowerCase();

    searchChat = chat.where((chat) {
      return chat.firstName.toLowerCase().contains(input);
    }).toList();

    update();
  }

  void onChangeIndex(int id) {
    currentIndex = id;
    update();
  }

  void onChangeChat(ChatModel selectSingleChat) {
    selectChat = selectSingleChat;
    update();
  }

  void sendMessage() {
    if (messageController.value.text.isNotEmpty && selectChat != null) {
      selectChat!.messages.add(ChatMessageModel(-1, messageController.text, DateTime.now(), true));
      messageController.clear();
      scrollToBottom(isDelayed: true);
      update();
    }
  }

  void onTyping() {
    if (!isTyping) {
      isTyping = true;
      update();
    }

    typingTimer?.cancel();
    typingTimer = Timer(Duration(milliseconds: 300), () {
      isTyping = false;
      update();
    });
  }

  void scrollToBottom({bool isDelayed = false}) {
    final int delay = isDelayed ? 400 : 0;
    Future.delayed(Duration(milliseconds: delay), () {
      scrollController!.animateTo(scrollController!.position.maxScrollExtent,
          duration: const Duration(milliseconds: 500), curve: Curves.easeInOutCubicEmphasized);
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    typingTimer?.cancel();
    super.dispose();
  }
}

class Groups {
  String? name;
  int? badge;

  Groups({this.name, this.badge});
}

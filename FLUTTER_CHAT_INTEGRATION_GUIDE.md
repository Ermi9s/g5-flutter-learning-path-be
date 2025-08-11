# Flutter Chat Integration Guide

This guide will help you integrate the real-time chat system with your Flutter application using WebSockets and REST APIs.

## 🔌 Understanding WebSockets in Chat Systems

### What are WebSockets?
WebSockets provide a **persistent, bidirectional communication channel** between the client (Flutter app) and server. Unlike traditional HTTP requests that follow a request-response pattern, WebSockets maintain an open connection that allows both the client and server to send data at any time.

### Why WebSockets for Chat?
- **Real-time messaging**: Messages appear instantly without polling
- **Bidirectional**: Both client and server can initiate communication
- **Persistent connection**: No need to reconnect for each message
- **Low latency**: Direct communication without HTTP overhead
- **Event-driven**: Perfect for chat events like typing indicators, user status, etc.

### How Our Chat System Works:

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Flutter App   │ ←──────────────→ │   NestJS Server │
│   (Client A)    │                  │                 │
└─────────────────┘                  └─────────────────┘
                                              ↕
                                     ┌─────────────────┐
                                     │   Flutter App   │
                                     │   (Client B)    │
                                     └─────────────────┘
```

**Flow Example:**
1. **User A** sends message via WebSocket (`message:send` event)
2. **Server** receives message, saves to database
3. **Server** emits `message:delivered` to **User A** (confirmation)
4. **Server** emits `message:received` to **User B** (real-time delivery)

### Key WebSocket Events in Our System:
- **Outgoing (Client → Server):**
  - `message:send` - Send a new message
  - `chat:join` - Join a specific chat room

- **Incoming (Server → Client):**
  - `message:received` - New message from another user
  - `message:delivered` - Confirmation your message was sent
  - `message:error` - Error occurred while processing message

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Dependencies](#dependencies)
3. [Authentication Setup](#authentication-setup)
4. [Data Models](#data-models)
5. [API Service](#api-service)
6. [WebSocket Service](#websocket-service)
7. [Chat Implementation](#chat-implementation)
8. [Usage Examples](#usage-examples)

## Prerequisites

- Our backend server running at ( `https://g5-flutter-learning-path-be-tvum.onrender.com`)
- Valid JWT token for authentication

## Dependencies


Add these dependencies to your `pubspec.yaml`:
It doesnt mean you will have only these, just make sure you have the socket_io_client.

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  socket_io_client: ^2.0.3+1
  shared_preferences: ^2.2.2
  provider: ^6.1.1  # For state management (optional)
```

## Authentication Setup

### Understanding WebSocket Authentication

**Why Authentication Matters for WebSockets:**
WebSockets maintain persistent connections(look at the other document difference between http/RESTapi and ws to understand what persistant connection means), so we need to authenticate users when they connect and verify their identity for each message. Unlike REST APIs where each request includes authentication headers, WebSocket authentication happens during the initial handshake.

**Our Authentication Flow:**
1. **User logs in** via REST API → receives JWT token
2. **Token stored locally** (SharedPreferences)
3. **WebSocket connection** includes token in headers during handshake
4. **Server validates token** and associates the socket with the authenticated user
5. **All subsequent WebSocket events** are automatically authenticated

**fyi:** The JWT token contains user information and is used to identify who is sending messages and who should receive them.

### 1. Auth Service

```dart
// auth_service.dart 
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String baseUrl = 'https://g5-flutter-learning-path-be-tvum.onrender.com/v3';
  
  Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        // so now the uri is "https://g5-flutter-learning-path-be-tvum.onrender.com/v3/auth/login"
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        final data = jsonDecode(response.body);
        await _saveToken(data['access_token']);
        return data;
      }
      return null;
    } catch (e) {
      print('Login error: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> register(String name, String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': name,
          'email': email,
          'password': password,
        }),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      }
      return null;
    } catch (e) {
      print('Register error: $e');
      return null;
    }
  }

  Future<void> _saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('jwt_token');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }
}
```

## Data Models

### Understanding Chat Data Structure

**Why Proper Data Models Matter:**
In realtime chat systems, data flows between REST APIs and WebSocket events. Having consistent data models ensures smooth serialization/deserialization(I recomend you look up what serialization and deserialization is, it will be quick) and type safety.

**Our Data Flow:**
```
REST API Response → Dart Model → UI Display
WebSocket Event → Dart Model → UI Update
User Input → Dart Model → WebSocket Event
```

**Key Models in Our System:**
- **User**: Represents chat participants
- **Chat**: Represents a conversation between two users
- **Message**: Individual messages within a chat

**JSON Serialization:** Each model includes `fromJson()` and `toJson()` methods to convert between Dart objects and JSON (used in API responses and WebSocket events).

### 2. Chat Models

```dart
// user.dart
class User {
  final String id;
  final String name;
  final String email;

  User({
    required this.id,
    required this.name,
    required this.email,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? json['id'],
      name: json['name'],
      email: json['email'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
    };
  }
}

// chat.dart
class Chat {
  final String id;
  final User user1;
  final User user2;
  final DateTime createdAt;
  final DateTime updatedAt;

  Chat({
    required this.id,
    required this.user1,
    required this.user2,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      id: json['_id'],
      user1: User.fromJson(json['user1']),
      user2: User.fromJson(json['user2']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  User getOtherUser(String currentUserId) {
    return user1.id == currentUserId ? user2 : user1;
  }
}

// message.dart
class Message {
  final String id;
  final User sender;
  final String chatId;
  final String type;
  final String content;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.sender,
    required this.chatId,
    required this.type,
    required this.content,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'],
      sender: User.fromJson(json['sender']),
      chatId: json['chat']['_id'] ?? json['chat'],
      type: json['type'] ?? 'text',
      content: json['content'],
      createdAt: DateTime.parse(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'type': type,
      'content': content,
      'chatId': chatId,
    };
  }
}
```

## API Service

### Understanding REST API vs WebSocket Roles

**Why We Need Both REST APIs AND WebSockets:**

**REST APIs handle:**
- **Initial data loading** (chat history, user lists)
- **Chat management** (create, delete chats)
- **Authentication** (login, register)
- **Data persistence** operations

**WebSockets handle:**
- **Realtime messaging** (send/receive messages)
- **Live updates** (typing indicators, online status)
- **Instant notifications** 
- **Meaning**  on WS events, you dont need to ask the server for updates it just comes on its own.

**The Hybrid Approach:**
```
App Startup → REST API (load chat list, message history)
     ↓
WebSocket Connect → Real-time messaging begins
     ↓
New Message → WebSocket (instant delivery) + REST API (persistence)
```

**Why This Pattern Works:**
- REST APIs are reliable for data fetching and complex operations
- WebSockets provide the realtime experience users expect
- If WebSocket disconnects, REST APIs ensure data consistency

### 3. Chat API Service

```dart
// chat_api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/chat.dart';
import '../models/message.dart';
import '../models/user.dart';
import 'auth_service.dart';

class ChatApiService {
  static const String baseUrl = 'https://g5-flutter-learning-path-be-tvum.onrender.com/v3';
  final AuthService _authService = AuthService();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // Create or get existing chat with a user
  Future<Chat?> createChat(String userId) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chats'),
        headers: await _getHeaders(),
        body: jsonEncode({'userId': userId}),
      );

      if (response.statusCode == 201) {
        return Chat.fromJson(jsonDecode(response.body));
      }
      return null;
    } catch (e) {
      print('Create chat error: $e');
      return null;
    }
  }

  // Get all chats for current user
  Future<List<Chat>> getChats() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chats'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Chat.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Get chats error: $e');
      return [];
    }
  }

  // Get specific chat
  Future<Chat?> getChat(String chatId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chats/$chatId'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        return Chat.fromJson(jsonDecode(response.body));
      }
      return null;
    } catch (e) {
      print('Get chat error: $e');
      return null;
    }
  }

  // Get messages for a chat
  Future<List<Message>> getChatMessages(String chatId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chats/$chatId/messages'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Message.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Get messages error: $e');
      return [];
    }
  }

  // Get all users (for starting new chats)
  Future<List<User>> getUsers() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/users'),
        headers: await _getHeaders(),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => User.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      print('Get users error: $e');
      return [];
    }
  }

  // Delete chat
  Future<bool> deleteChat(String chatId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/chats/$chatId'),
        headers: await _getHeaders(),
      );

      return response.statusCode == 200;
    } catch (e) {
      print('Delete chat error: $e');
      return false;
    }
  }
}
```

## WebSocket Service

### 4. Realtime Chat Service

```dart
// websocket_service.dart
import 'dart:convert';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../models/message.dart';
import 'auth_service.dart';

class WebSocketService {
  static const String serverUrl = 'https://g5-flutter-learning-path-be-tvum.onrender.com';
  IO.Socket? _socket;
  final AuthService _authService = AuthService();

  // Callbacks
  Function(Message)? onMessageReceived;
  Function(Message)? onMessageDelivered;
  Function(String)? onMessageError;
  Function()? onConnected;
  Function()? onDisconnected;

  Future<void> connect() async {
    try {
      final token = await _authService.getToken();
      if (token == null) {
        print('No token available for WebSocket connection');
        return;
      }

      _socket = IO.io(serverUrl,
        IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .setExtraHeaders({
            'Authorization': 'Bearer $token',
          })
          .build()
      );

      _socket!.onConnect((_) {
        print('Connected to WebSocket');
        onConnected?.call();
      });

      _socket!.onDisconnect((_) {
        print('Disconnected from WebSocket');
        onDisconnected?.call();
      });

      _socket!.on('message:received', (data) {
        try {
          final message = Message.fromJson(data);
          onMessageReceived?.call(message);
        } catch (e) {
          print('Error parsing received message: $e');
        }
      });

      _socket!.on('message:delivered', (data) {
        try {
          final message = Message.fromJson(data);
          onMessageDelivered?.call(message);
        } catch (e) {
          print('Error parsing delivered message: $e');
        }
      });

      _socket!.on('message:error', (data) {
        final error = data['error'] ?? 'Unknown error';
        print('Message error: $error');
        onMessageError?.call(error);
      });

      _socket!.connect();
    } catch (e) {
      print('WebSocket connection error: $e');
    }
  }

  void sendMessage(Message message) {
    if (_socket?.connected == true) {
      _socket!.emit('message:send', message.toJson());
    } else {
      print('Socket not connected');
      onMessageError?.call('Not connected to server');
    }
  }

  void joinChat(String chatId) {
    if (_socket?.connected == true) {
      _socket!.emit('chat:join', {'chatId': chatId});
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  bool get isConnected => _socket?.connected ?? false;
}
```

## Chat Implementation

### 5. Chat Provider (State Management)

```dart
// chat_provider.dart
import 'package:flutter/foundation.dart';
import '../models/chat.dart';
import '../models/message.dart';
import '../models/user.dart';
import '../services/chat_api_service.dart';
import '../services/websocket_service.dart';

class ChatProvider with ChangeNotifier {
  final ChatApiService _apiService = ChatApiService();
  final WebSocketService _webSocketService = WebSocketService();

  List<Chat> _chats = [];
  Map<String, List<Message>> _chatMessages = {};
  bool _isLoading = false;
  String? _error;
  bool _isConnected = false;

  List<Chat> get chats => _chats;
  Map<String, List<Message>> get chatMessages => _chatMessages;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isConnected => _isConnected;

  ChatProvider() {
    _initializeWebSocket();
  }

  void _initializeWebSocket() {
    _webSocketService.onConnected = () {
      _isConnected = true;
      notifyListeners();
    };

    _webSocketService.onDisconnected = () {
      _isConnected = false;
      notifyListeners();
    };

    _webSocketService.onMessageReceived = (message) {
      _addMessageToChat(message.chatId, message);
      notifyListeners();
    };

    _webSocketService.onMessageDelivered = (message) {
      _addMessageToChat(message.chatId, message);
      notifyListeners();
    };

    _webSocketService.onMessageError = (error) {
      _error = error;
      notifyListeners();
    };
  }

  Future<void> connectWebSocket() async {
    await _webSocketService.connect();
  }

  void disconnectWebSocket() {
    _webSocketService.disconnect();
  }

  Future<void> loadChats() async {
    _setLoading(true);
    try {
      _chats = await _apiService.getChats();
      _error = null;
    } catch (e) {
      _error = e.toString();
    }
    _setLoading(false);
  }

  Future<void> loadChatMessages(String chatId) async {
    if (_chatMessages.containsKey(chatId)) return;

    try {
      final messages = await _apiService.getChatMessages(chatId);
      _chatMessages[chatId] = messages;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }

  Future<Chat?> createChat(String userId) async {
    try {
      final chat = await _apiService.createChat(userId);
      if (chat != null) {
        _chats.add(chat);
        notifyListeners();
      }
      return chat;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  void sendMessage(String chatId, String content, {String type = 'text'}) {
    final message = Message(
      id: '', // Will be set by server
      sender: User(id: '', name: '', email: ''), // Will be set by server
      chatId: chatId,
      type: type,
      content: content,
      createdAt: DateTime.now(),
    );

    _webSocketService.sendMessage(message);
  }

  void joinChat(String chatId) {
    _webSocketService.joinChat(chatId);
  }

  void _addMessageToChat(String chatId, Message message) {
    if (!_chatMessages.containsKey(chatId)) {
      _chatMessages[chatId] = [];
    }

    // Avoid duplicates
    final exists = _chatMessages[chatId]!.any((m) => m.id == message.id);
    if (!exists) {
      _chatMessages[chatId]!.add(message);
      _chatMessages[chatId]!.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    }
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  @override
  void dispose() {
    disconnectWebSocket();
    super.dispose();
  }
}
```


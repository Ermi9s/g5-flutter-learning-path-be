# WebSocket Service Documentation



## Understanding WebSocket Communication in Flutter

### What is a WebSocket Service?
A WebSocket service is a **persistent, bidirectional communication channel** between your Flutter app and the server. Unlike HTTP requests that are one-time interactions, WebSockets maintain an open connection that allows real-time data exchange.

### Why Use WebSockets for Chat?
```
Traditional HTTP:
Client → Request → Server
Client ← Response ← Server
(Connection closes)

WebSocket:
Client ←→ Persistent Connection ←→ Server
(Both can send data anytime)
```

## WebSocket Service Architecture

### Core Components Breakdown

```dart
class WebSocketService {
  // 1. Connection Management
  static const String serverUrl = 'https://g5-flutter-learning-path-be-tvum.onrender.com';
  IO.Socket? _socket;
  final AuthService _authService = AuthService();

  // 2. Event Callbacks (Observer Pattern)
  Function(Message)? onMessageReceived;
  Function(Message)? onMessageDelivered;
  Function(String)? onMessageError;
  Function()? onConnected;
  Function()? onDisconnected;
```

### Connection Management Explained

**1. Server URL Configuration**
```dart
static const String serverUrl = 'https://g5-flutter-learning-path-be-tvum.onrender.com';
```
- **Purpose**: Defines the WebSocket endpoint
- **Note**: This should match your backend server URL
- **Protocol**: Uses `https://` but WebSocket will upgrade to `wss://` (secure WebSocket)

**2. Socket Instance**
```dart
IO.Socket? _socket;
```
- **Nullable**: Can be `null` when disconnected
- **Private**: Only this service manages the socket connection
- **Lifecycle**: Created on connect, destroyed on disconnect

**3. Authentication Service**
```dart
final AuthService _authService = AuthService();
```
- **Purpose**: Retrieves JWT token for WebSocket authentication
- **Security**: Ensures only authenticated users can connect

## Event-Driven Architecture (Observer Pattern)

### Why Use Callbacks?
WebSockets are **asynchronous and event-driven**. We don't know when messages will arrive, so we use callbacks to handle events when they occur.

```dart
// Event Callbacks - These are "listeners" waiting for events
Function(Message)? onMessageReceived;    // When someone sends you a message
Function(Message)? onMessageDelivered;   // When your message is confirmed sent
Function(String)? onMessageError;        // When something goes wrong
Function()? onConnected;                 // When connection is established
Function()? onDisconnected;              // When connection is lost
```

**How It Works:**
1. **UI registers callbacks** → "Tell me when messages arrive"
2. **WebSocket receives data** → Triggers appropriate callback
3. **UI updates automatically** → Shows new message to user

## Connection Process Deep Dive

### Step-by-Step Connection Flow

```dart
Future<void> connect() async {
  try {
    // STEP 1: Get authentication token
    final token = await _authService.getToken();
    if (token == null) {
      print('No token available for WebSocket connection');
      return;
    }
```

**Why Authentication First?**
- WebSocket connections need to know **who is connecting**
- JWT token contains user identity and permissions
- Server validates token during handshake

### Socket Configuration

```dart
    // STEP 2: Configure WebSocket connection
    _socket = IO.io(serverUrl, 
      IO.OptionBuilder()
        .setTransports(['websocket'])        // Force WebSocket (not polling)
        .enableAutoConnect()                 // Auto-reconnect on disconnect
        .setExtraHeaders({                   // Send auth token in headers
          'Authorization': 'Bearer $token',
        })
        .build()
    );
```

**Configuration Explained:**
- **`setTransports(['websocket'])`**: Forces pure WebSocket connection (faster than polling)
- **`enableAutoConnect()`**: Automatically reconnects if connection drops
- **`setExtraHeaders()`**: Sends JWT token during initial handshake

### Event Listeners Setup

```dart
    // STEP 3: Set up connection event listeners
    _socket!.onConnect((_) {
      print('Connected to WebSocket');
      onConnected?.call();                   // Notify UI: "You're online!"
    });

    _socket!.onDisconnect((_) {
      print('Disconnected from WebSocket');
      onDisconnected?.call();                // Notify UI: "You're offline!"
    });
```

**Connection Events:**
- **`onConnect`**: Fired when handshake completes successfully
- **`onDisconnect`**: Fired when connection is lost (network issues, server restart, etc.)

## Message Event Handling

### Incoming Message Events

```dart
    // STEP 4: Set up message event listeners
    _socket!.on('message:received', (data) {
      try {
        final message = Message.fromJson(data);    // Convert JSON to Dart object
        onMessageReceived?.call(message);          // Notify UI: "New message!"
      } catch (e) {
        print('Error parsing received message: $e');
      }
    });
```

**Event Flow:**
1. **Another user sends message** → Server processes it
2. **Server emits `message:received`** → Your app receives JSON data
3. **JSON converted to Message object** → Type-safe Dart object
4. **Callback triggered** → UI updates with new message

### Message Delivery Confirmation

```dart
    _socket!.on('message:delivered', (data) {
      try {
        final message = Message.fromJson(data);
        onMessageDelivered?.call(message);         // Notify UI: "Message sent!"
      } catch (e) {
        print('Error parsing delivered message: $e');
      }
    });
```

**Why Delivery Confirmation?**
- **User feedback**: Shows message was successfully sent
- **UI updates**: Can show "delivered" status or checkmarks
- **Error handling**: If no confirmation, can retry sending

### Error Handling

```dart
    _socket!.on('message:error', (data) {
      final error = data['error'] ?? 'Unknown error';
      print('Message error: $error');
      onMessageError?.call(error);               // Notify UI: "Something went wrong!"
    });
```

**Common Error Scenarios:**
- **Authentication failed**: Invalid or expired token
- **Message validation failed**: Invalid message format
- **Server error**: Database issues, server overload
- **Rate limiting**: Sending messages too quickly

## Sending Messages

### Message Transmission

```dart
void sendMessage(Message message) {
  if (_socket?.connected == true) {
    _socket!.emit('message:send', message.toJson());    // Send as JSON
  } else {
    print('Socket not connected');
    onMessageError?.call('Not connected to server');   // Handle offline state
  }
}
```

**Send Process:**
1. **Check connection status** → Ensure WebSocket is connected
2. **Convert to JSON** → Server expects JSON format
3. **Emit event** → Send `message:send` event with data
4. **Handle offline** → Show error if not connected

### Chat Room Management

```dart
void joinChat(String chatId) {
  if (_socket?.connected == true) {
    _socket!.emit('chat:join', {'chatId': chatId});     // Join specific chat room
  }
}
```

**Why Join Chat?**
- **Room-based messaging**: Server knows which chat you're viewing
- **Targeted delivery**: Only receive messages for current chat
- **Optimization**: Reduces unnecessary network traffic

## Connection Lifecycle Management

### Proper Cleanup

```dart
void disconnect() {
  _socket?.disconnect();    // Close WebSocket connection
  _socket?.dispose();       // Free up resources
  _socket = null;          // Clear reference
}
```

**Why Cleanup Matters:**
- **Memory leaks**: Prevents app from consuming too much memory
- **Battery life**: Stops unnecessary background connections
- **Resource management**: Frees up network resources

### Connection Status

```dart
bool get isConnected => _socket?.connected ?? false;
```

**Usage in UI:**
- **Show online/offline indicator**
- **Enable/disable send button**
- **Display connection status messages**

## Integration with UI

### How UI Components Use This Service

```dart
// In your Flutter widget:
final webSocketService = WebSocketService();

// Set up callbacks
webSocketService.onMessageReceived = (message) {
  setState(() {
    messages.add(message);    // Add to message list
  });
};

webSocketService.onConnected = () {
  setState(() {
    isOnline = true;          // Update UI status
  });
};

// Connect when screen loads
webSocketService.connect();

// Send message when user types
webSocketService.sendMessage(newMessage);
```

## Real-Time Communication Flow

```
User A Types Message
        ↓
Flutter App (User A)
        ↓
WebSocket.emit('message:send')
        ↓
NestJS Server
        ↓
Save to Database
        ↓
Server.emit('message:delivered') → User A (confirmation)
        ↓
Server.emit('message:received') → User B (real-time delivery)
        ↓
Flutter App (User B)
        ↓
UI Updates with New Message
```

This WebSocket service provides the foundation for real-time, bidirectional communication in your Flutter chat application!

export function createWebSocketConnection() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  const wsUrl = `${protocol}//${host}/ws`;

  console.log('Attempting WebSocket connection to:', wsUrl);

  // Create WebSocket with explicit protocols
  const socket = new WebSocket(wsUrl, ['websocket']);

  socket.onopen = () => {
    console.log('WebSocket connection established with protocol:', socket.protocol);
    // Send an initial message to test the connection
    socket.send(JSON.stringify({ type: 'init', timestamp: new Date().toISOString() }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket message:', data);

      // Handle different message types
      switch(data.type) {
        case 'connection':
          console.log('Connection status:', data.status);
          break;
        case 'acknowledgment':
          console.log('Message acknowledged:', data.data);
          break;
        case 'error':
          console.error('Server error:', data.message);
          break;
        default:
          console.log('Received message:', data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });

    // Implement reconnection logic if needed
    if (event.code !== 1000) { // Not a normal closure
      console.log('Attempting to reconnect...');
      setTimeout(() => {
        createWebSocketConnection();
      }, 3000);
    }
  };

  return socket;
}
export function createWebSocketConnection() {
  // Use custom path for WebSocket connection
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/smarteats-ws`;
  console.log('[WebSocket] Attempting connection to:', wsUrl);

  // Create WebSocket with explicit protocols
  const socket = new WebSocket(wsUrl, ['websocket']);

  socket.onopen = () => {
    console.log('[WebSocket] Connection established with protocol:', socket.protocol);
    // Send an initial message to test the connection
    socket.send(JSON.stringify({ type: 'init', timestamp: new Date().toISOString() }));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log('[WebSocket] Received message:', data);

      // Handle different message types
      switch(data.type) {
        case 'connection':
          console.log('[WebSocket] Connection status:', data.status);
          break;
        case 'acknowledgment':
          console.log('[WebSocket] Message acknowledged:', data.data);
          break;
        case 'error':
          console.error('[WebSocket] Server error:', data.message);
          break;
        default:
          console.log('[WebSocket] Unknown message type:', data);
      }
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('[WebSocket] Connection error:', error);
  };

  socket.onclose = (event) => {
    console.log('[WebSocket] Connection closed:', {
      code: event.code,
      reason: event.reason,
      wasClean: event.wasClean
    });

    // Implement reconnection logic with backoff
    if (event.code !== 1000) { // Not a normal closure
      const backoff = Math.min(1000 * Math.pow(2, event.code % 6), 30000);
      console.log(`[WebSocket] Attempting reconnect in ${backoff}ms...`);
      setTimeout(() => {
        createWebSocketConnection();
      }, backoff);
    }
  };

  return socket;
}
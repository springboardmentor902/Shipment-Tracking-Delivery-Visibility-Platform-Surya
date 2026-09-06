import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscription = null;
  }

  connect(onConnectCallback, onErrorCallback) {
    if (this.client && this.connected) return;

    const wsUrl = window.location.origin.includes('5173')
      ? 'http://localhost:1022/api/ws/tracking'
      : '/api/ws/tracking';

    this.client = new Client({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 3000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.connected = true;
      if (onConnectCallback) onConnectCallback();
    };

    this.client.onStompError = (frame) => {
      this.connected = false;
      if (onErrorCallback) onErrorCallback(frame.headers['message'] || 'STOMP Protocol Error');
    };

    this.client.onWebSocketClose = () => {
      this.connected = false;
      if (onErrorCallback) onErrorCallback('WebSocket Connection Closed');
    };

    this.client.activate();
  }

  subscribeToShipment(shipmentId, onMessageCallback) {
    if (!this.client || !this.connected) return;

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    const destination = `/topic/shipment/${shipmentId}/location`;
    this.subscription = this.client.subscribe(destination, (message) => {
      if (message.body) {
        const data = JSON.parse(message.body);
        if (onMessageCallback) onMessageCallback(data);
      }
    });
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.connected = false;
    }
  }
}

export const websocketService = new WebSocketService();

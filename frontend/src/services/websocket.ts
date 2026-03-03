const WS_URL = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;

type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private room: string | null = null;
  private roomType: string = 'chat';
  private pingInterval: ReturnType<typeof setInterval> | null = null;

  connect(room: string, roomType: 'draft' | 'chat' | 'scoring' = 'chat') {
    this.room = room;
    this.roomType = roomType;
    const token = localStorage.getItem('dd_token');
    if (!token) return;

    try {
      this.ws = new WebSocket(`${WS_URL}/ws`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.ws?.send(JSON.stringify({ type: 'join', room, roomType, token }));
        this.startPing();
        this.emit('connected', { room });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data);
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      this.ws.onclose = () => {
        this.stopPing();
        this.emit('disconnected', {});
        this.attemptReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WS error:', err);
        this.emit('error', { error: err });
      };
    } catch (err) {
      console.error('WS connection failed:', err);
    }
  }

  disconnect() {
    this.stopPing();
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.room = null;
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendChat(content: string, messageType = 'TEXT') {
    this.send({ type: 'chat_message', content, messageType });
  }

  sendDraftPick(draftId: string, playerId: string) {
    this.send({ type: 'draft_pick', draftId, playerId });
  }

  sendTyping(isTyping: boolean) {
    this.send({ type: 'typing', isTyping });
  }

  sendReaction(messageId: string, emoji: string) {
    this.send({ type: 'reaction', messageId, emoji });
  }

  on(event: string, handler: MessageHandler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.off(event, handler);
  }

  off(event: string, handler: MessageHandler) {
    this.handlers.get(event)?.delete(handler);
  }

  private emit(event: string, data: any) {
    this.handlers.get(event)?.forEach((handler) => handler(data));
    this.handlers.get('*')?.forEach((handler) => handler({ type: event, ...data }));
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || !this.room) return;
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    setTimeout(() => {
      if (this.room) this.connect(this.room, this.roomType as any);
    }, delay);
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
export default wsService;
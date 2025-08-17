import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  timestamp: string;
  type: 'CHAT' | 'PLAYER_JOINED' | 'PLAYER_LEFT' | 'GAME_STARTED';
}

export interface Player {
  id: string;
  name: string;
  isOwner: boolean;
  owner?: boolean; // Jackson might serialize as 'owner' instead of 'isOwner'
}

export interface GameRoom {
  roomId: string;
  players: Player[];
  ownerId: string;
  gameStarted: boolean;
  quote?: string;
}

class WebSocketService {
  private client: Client | null = null;
  private isConnected = false;
  private subscriptions: any[] = [];

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      // Clear any existing subscriptions from a previous connection
      this.subscriptions = [];

      this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        onConnect: () => {
          this.isConnected = true;
          console.log('Connected to WebSocket');
          resolve();
        },
        onDisconnect: () => {
          this.isConnected = false;
          console.log('Disconnected from WebSocket');
        },
        onStompError: (error) => {
          console.error('STOMP error:', error);
          reject(error);
        },
      });

      this.client.activate();
    });
  }

  disconnect() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(subscription => {
      if (subscription) {
        subscription.unsubscribe();
      }
    });
    this.subscriptions = [];

    if (this.client) {
      this.client.deactivate();
      this.isConnected = false;
    }
  }

  subscribeToChatMessages(roomId: string, callback: (message: ChatMessage) => void) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const subscription = this.client.subscribe(`/topic/room/${roomId}/chat`, (message) => {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      callback(chatMessage);
    });
    
    this.subscriptions.push(subscription);
    return subscription;
  }

  subscribeToPlayerUpdates(roomId: string, callback: (players: Player[]) => void) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const subscription = this.client.subscribe(`/topic/room/${roomId}/players`, (message) => {
      const players: Player[] = JSON.parse(message.body);
      callback(players);
    });
    
    this.subscriptions.push(subscription);
    return subscription;
  }

  subscribeToGameStart(roomId: string, callback: (room: GameRoom) => void) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const subscription = this.client.subscribe(`/topic/room/${roomId}/gameStart`, (message) => {
      const room: GameRoom = JSON.parse(message.body);
      callback(room);
    });
    
    this.subscriptions.push(subscription);
    return subscription;
  }

  sendChatMessage(roomId: string, playerId: string, playerName: string, messageText: string) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const chatMessage = {
      playerId,
      playerName,
      message: messageText,
      type: 'CHAT'
    };

    this.client.publish({
      destination: `/app/room/${roomId}/chat`,
      body: JSON.stringify(chatMessage),
    });
  }

  startGame(roomId: string, playerName: string) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.client.publish({
      destination: `/app/room/${roomId}/start`,
      body: JSON.stringify({ playerName }),
    });
  }

  trackSession(roomId: string, playerId: string) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.client.publish({
      destination: `/app/room/${roomId}/track`,
      body: JSON.stringify({ playerId }),
    });
  }

  kickPlayer(roomId: string, ownerName: string, playerIdToKick: string) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    this.client.publish({
      destination: `/app/room/${roomId}/kick`,
      body: JSON.stringify({ ownerName, playerIdToKick }),
    });
  }

  subscribeToKickNotifications(roomId: string, playerId: string, callback: (message: string) => void) {
    if (!this.client || !this.isConnected) {
      throw new Error('WebSocket not connected');
    }

    const subscription = this.client.subscribe(`/topic/room/${roomId}/kicked/${playerId}`, (message) => {
      callback(message.body);
    });
    
    this.subscriptions.push(subscription);
    return subscription;
  }
}

export default new WebSocketService();
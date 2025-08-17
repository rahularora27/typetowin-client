import { GameRoom } from './WebSocketService';

const API_BASE_URL = 'http://localhost:8080/api';

export const ApiService = {
  async createRoom(playerName: string): Promise<GameRoom> {
    const response = await fetch(`${API_BASE_URL}/room/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName }),
    });

    if (!response.ok) {
      throw new Error('Failed to create room');
    }

    return response.json();
  },

  async joinRoom(roomId: string, playerName: string): Promise<GameRoom> {
    const response = await fetch(`${API_BASE_URL}/room/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, playerName }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to join room');
    }

    return response.json();
  },

  async getRoom(roomId: string): Promise<GameRoom> {
    const response = await fetch(`${API_BASE_URL}/room/${roomId}`);
    
    if (!response.ok) {
      throw new Error('Room not found');
    }

    return response.json();
  },
};
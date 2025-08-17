import { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import WebSocketService, { ChatMessage, Player, GameRoom } from '../services/WebSocketService';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';

export default function MultiPlayer() {
    const [gameState, setGameState] = useState<'lobby' | 'room' | 'game'>('lobby');
    const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Form states
    const [createName, setCreateName] = useState('');
    const [joinName, setJoinName] = useState('');
    const [roomId, setRoomId] = useState('');

    useEffect(() => {
        // Handle browser close/refresh
        const handleBeforeUnload = () => {
            WebSocketService.disconnect();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            WebSocketService.disconnect();
        };
    }, []);

    const handleCreateRoom = async () => {
        if (!createName.trim()) {
            setError('Please enter your name');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await WebSocketService.connect();
            const room = await ApiService.createRoom(createName.trim());
            
            const player = room.players[0];
            setCurrentRoom(room);
            setCurrentPlayer(player);
            setPlayers(room.players);
            setGameState('room');
            
            setupWebSocketSubscriptions(room.roomId, player);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!joinName.trim() || !roomId.trim()) {
            setError('Please enter your name and room ID');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await WebSocketService.connect();
            const room = await ApiService.joinRoom(roomId.trim().toUpperCase(), joinName.trim());
            
            setCurrentRoom(room);
            // Find the current player (the one just added)
            const newPlayer = room.players.find(p => p.name === joinName.trim());
            setCurrentPlayer(newPlayer || null);
            setPlayers(room.players);
            setGameState('room');
            
            if (newPlayer) {
                setupWebSocketSubscriptions(room.roomId, newPlayer);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to join room');
        } finally {
            setLoading(false);
        }
    };

    const setupWebSocketSubscriptions = (roomId: string, player: Player) => {
        // Track session with server
        WebSocketService.trackSession(roomId, player.id);

        // Subscribe to chat messages
        WebSocketService.subscribeToChatMessages(roomId, (message) => {
            setChatMessages(prev => [...prev, message]);
        });

        // Subscribe to player updates
        WebSocketService.subscribeToPlayerUpdates(roomId, (updatedPlayers) => {
            setPlayers(updatedPlayers);
        });

        // Subscribe to game start
        WebSocketService.subscribeToGameStart(roomId, (room) => {
            setCurrentRoom(room);
            setGameState('game');
        });

        // Subscribe to kick notifications
        WebSocketService.subscribeToKickNotifications(roomId, player.id, (message) => {
            alert(message);
            handleBackToLobby();
        });
    };

    const handleSendMessage = (message: string) => {
        if (currentPlayer && currentRoom) {
            WebSocketService.sendChatMessage(
                currentRoom.roomId,
                currentPlayer.id,
                currentPlayer.name,
                message
            );
        }
    };

    const handleStartGame = () => {
        if (currentPlayer && currentRoom) {
            WebSocketService.startGame(currentRoom.roomId, currentPlayer.name);
        }
    };

    const handleKickPlayer = (playerIdToKick: string) => {
        if (currentPlayer && currentRoom && currentPlayer.isOwner) {
            WebSocketService.kickPlayer(currentRoom.roomId, currentPlayer.name, playerIdToKick);
        }
    };

    const handleBackToLobby = () => {
        WebSocketService.disconnect();
        setGameState('lobby');
        setCurrentRoom(null);
        setCurrentPlayer(null);
        setChatMessages([]);
        setPlayers([]);
        setCreateName('');
        setJoinName('');
        setRoomId('');
        setError(null);
    };

    if (gameState === 'room') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
                            Game Room
                        </h1>
                        <button
                            onClick={handleBackToLobby}
                            className="text-white/80 hover:text-white underline"
                        >
                            ← Back to Lobby
                        </button>
                    </div>

                    {/* Room Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Player List */}
                        <div>
                            <PlayerList
                                players={players}
                                roomId={currentRoom?.roomId || ''}
                                currentPlayer={currentPlayer || undefined}
                                onStartGame={handleStartGame}
                                onKickPlayer={handleKickPlayer}
                                gameStarted={currentRoom?.gameStarted || false}
                            />
                        </div>

                        {/* Chat */}
                        <div>
                            <Chat
                                messages={chatMessages}
                                onSendMessage={handleSendMessage}
                                disabled={currentRoom?.gameStarted || false}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'game') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 p-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-white mb-8">Game Started!</h1>
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                        <p className="text-2xl text-gray-800 mb-4">The typing game will start here...</p>
                        <button
                            onClick={handleBackToLobby}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                        >
                            Back to Lobby
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        MultiPlayer
                    </h1>
                    <p className="text-xl text-white/90 font-light">
                        Connect with friends and start playing together
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="max-w-md mx-auto mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                
                {/* Sections Container */}
                <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
                    {/* Create Room Section */}
                    <div className="flex-1 max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                            🎮 Create Room
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name
                                </label>
                                <input
                                    id="create-name"
                                    type="text"
                                    value={createName}
                                    onChange={(e) => setCreateName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                                    disabled={loading}
                                />
                            </div>
                            
                            <button 
                                onClick={handleCreateRoom}
                                disabled={loading}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wide disabled:transform-none"
                            >
                                {loading ? 'Creating...' : 'Create Room'}
                            </button>
                        </div>
                    </div>

                    {/* Join Room Section */}
                    <div className="flex-1 max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                            🚪 Join Room
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="join-name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name
                                </label>
                                <input
                                    id="join-name"
                                    type="text"
                                    value={joinName}
                                    onChange={(e) => setJoinName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                                    disabled={loading}
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="room-id" className="block text-sm font-medium text-gray-700 mb-2">
                                    Room ID
                                </label>
                                <input
                                    id="room-id"
                                    type="text"
                                    value={roomId}
                                    onChange={(e) => setRoomId(e.target.value)}
                                    placeholder="Enter room ID"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                                    disabled={loading}
                                />
                            </div>
                            
                            <button 
                                onClick={handleJoinRoom}
                                disabled={loading}
                                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wide disabled:transform-none"
                            >
                                {loading ? 'Joining...' : 'Join Room'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { ApiService } from '../services/ApiService';
import WebSocketService, { ChatMessage, Player, GameRoom } from '../services/WebSocketService';
import Chat from '../components/Chat';
import PlayerList from '../components/PlayerList';
import TypingArea from '../components/TypingArea';

export default function MultiPlayer() {
    const [gameState, setGameState] = useState<'lobby' | 'room' | 'countdown' | 'game' | 'results'>('lobby');
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
    
    // Countdown and timer states
    const [countdown, setCountdown] = useState(0);
    const [gameTimer, setGameTimer] = useState(60);
    const [gameResults, setGameResults] = useState<GameRoom | null>(null);
    const [isGameActive, setIsGameActive] = useState(false);
    const [timerDuration, setTimerDuration] = useState(60);
    

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
            setTimerDuration(room.gameDuration || 60);
            
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
            setTimerDuration(room.gameDuration || 60);
            
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
        
        // Subscribe to countdown
        WebSocketService.subscribeToCountdown(roomId, (countdownTime) => {
            setCountdown(countdownTime);
            if (countdownTime > 0) {
                setGameState('countdown');
            }
        });
        
        // Subscribe to game started (after countdown)
        WebSocketService.subscribeToGameStarted(roomId, (room) => {
            setCurrentRoom(room);
            setGameState('game');
            setIsGameActive(true);
        });
        
        // Subscribe to game timer
        WebSocketService.subscribeToGameTimer(roomId, (timeLeft) => {
            setGameTimer(timeLeft);
        });
        
        // Subscribe to game ended
        WebSocketService.subscribeToGameEnded(roomId, (room) => {
            setGameResults(room);
            setGameState('results');
            setIsGameActive(false);
        });
        
        // Subscribe to timer changes
        WebSocketService.subscribeToTimerChanged(roomId, (room) => {
            setTimerDuration(room.gameDuration || 60);
            setCurrentRoom(room);
        });
    };
    
    const handleGameStart = () => {
        // Game started by TypingArea - no action needed for multiplayer
        console.log('Multiplayer typing started');
    };
    
    const handleGameOver = (correctChars: number, incorrectChars: number) => {
        // Game ended by server timer - no action needed
        console.log(`Multiplayer game finished: ${correctChars} correct, ${incorrectChars} incorrect`);
    };
    
    const handleServerGameOver = () => {
        // Server ended the game - already handled by WebSocket subscription
        console.log('Server ended the game');
    };
    
    const handleTimerSelect = (duration: number) => {
        if (currentPlayer && currentRoom && currentPlayer.isOwner) {
            WebSocketService.setTimerDuration(currentRoom.roomId, currentPlayer.name, duration);
        }
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
        setCountdown(0);
        setGameTimer(60);
        setGameResults(null);
        setIsGameActive(false);
        setTimerDuration(60);
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
                    
                    {/* Timer Selection - Only for Room Owner */}
                    {currentPlayer?.isOwner && !currentRoom?.gameStarted && (
                        <div className="text-center mb-8">
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/20 inline-block">
                                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Game Duration</h3>
                                <div className="flex space-x-4">
                                    <button
                                        className={`px-6 py-3 font-semibold rounded-xl transition-all duration-300 ${
                                            timerDuration === 15
                                                ? 'bg-indigo-500 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                        onClick={() => handleTimerSelect(15)}
                                    >
                                        15s
                                    </button>
                                    <button
                                        className={`px-6 py-3 font-semibold rounded-xl transition-all duration-300 ${
                                            timerDuration === 30
                                                ? 'bg-indigo-500 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                        onClick={() => handleTimerSelect(30)}
                                    >
                                        30s
                                    </button>
                                    <button
                                        className={`px-6 py-3 font-semibold rounded-xl transition-all duration-300 ${
                                            timerDuration === 60
                                                ? 'bg-indigo-500 text-white shadow-lg'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                        onClick={() => handleTimerSelect(60)}
                                    >
                                        60s
                                    </button>
                                </div>
                                <p className="text-sm text-gray-600 mt-3">Current: {timerDuration} seconds</p>
                            </div>
                        </div>
                    )}
                    
                    {/* Timer Display for Non-Owners */}
                    {!currentPlayer?.isOwner && !currentRoom?.gameStarted && (
                        <div className="text-center mb-8">
                            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/20 inline-block">
                                <p className="text-gray-700">
                                    <span className="font-semibold">Game Duration:</span> {timerDuration} seconds
                                </p>
                            </div>
                        </div>
                    )}

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

    if (gameState === 'countdown') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500 flex items-center justify-center p-8">
                <div className="max-w-2xl mx-auto text-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-2xl">
                        <h1 className="text-6xl font-bold text-gray-800 mb-8">Get Ready!</h1>
                        <div className="text-9xl font-bold text-orange-500 mb-8 animate-pulse">
                            {countdown > 0 ? countdown : 'GO!'}
                        </div>
                        <p className="text-xl text-gray-600">
                            {countdown > 0 ? 'Game starting in...' : 'Start typing now!'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    
    if (gameState === 'game') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-4">Multiplayer Game</h1>
                        <button
                            onClick={handleBackToLobby}
                            className="text-white/80 hover:text-white underline"
                        >
                            ← Back to Lobby
                        </button>
                    </div>
                    
                    {currentRoom?.quote && (
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                            <TypingArea
                                initialQuote={currentRoom.quote}
                                timerDuration={timerDuration}
                                onGameStart={handleGameStart}
                                onGameOver={handleGameOver}
                                isMultiplayer={true}
                                serverControlledTimer={gameTimer}
                                gameActive={isGameActive}
                                onServerGameOver={handleServerGameOver}
                            />
                        </div>
                    )}
                    
                    {!currentRoom?.quote && (
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
                            <p className="text-2xl text-gray-800">Loading game...</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'results') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 via-blue-500 to-purple-500 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-white mb-4">Game Results</h1>
                        <button
                            onClick={handleBackToLobby}
                            className="text-white/80 hover:text-white underline"
                        >
                            ← Back to Lobby
                        </button>
                    </div>
                    
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Time's Up!</h2>
                        {gameResults && (
                            <div className="text-center mb-4">
                                <p className="text-gray-600">Room: {gameResults.roomId}</p>
                                <p className="text-gray-600">{gameResults.players.length} players participated</p>
                            </div>
                        )}
                        <p className="text-center text-gray-600 mb-4">Detailed results will be displayed here once implemented.</p>
                        
                        <div className="text-center">
                            <button
                                onClick={handleBackToLobby}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl"
                            >
                                Play Again
                            </button>
                        </div>
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

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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center mb-6">
                    <h1 className="text-4xl font-bold text-black mb-4">
                        Game Room
                    </h1>
                    <button
                        onClick={handleBackToLobby}
                        className="text-black underline hover:no-underline"
                    >
                        ← Back to Lobby
                    </button>
                </div>
                
                {/* Timer Selection */}
                {!currentRoom?.gameStarted && (
                    <div className="flex space-x-4 mb-6">
                        <button
                            className={`text-black ${timerDuration === 15 ? 'underline' : ''} ${
                                currentPlayer?.isOwner ? 'cursor-pointer' : 'cursor-default'
                            }`}
                            onClick={currentPlayer?.isOwner ? () => handleTimerSelect(15) : undefined}
                        >
                            15s
                        </button>
                        <button
                            className={`text-black ${timerDuration === 30 ? 'underline' : ''} ${
                                currentPlayer?.isOwner ? 'cursor-pointer' : 'cursor-default'
                            }`}
                            onClick={currentPlayer?.isOwner ? () => handleTimerSelect(30) : undefined}
                        >
                            30s
                        </button>
                        <button
                            className={`text-black ${timerDuration === 60 ? 'underline' : ''} ${
                                currentPlayer?.isOwner ? 'cursor-pointer' : 'cursor-default'
                            }`}
                            onClick={currentPlayer?.isOwner ? () => handleTimerSelect(60) : undefined}
                        >
                            60s
                        </button>
                    </div>
                )}

                {/* Room Content */}
                <div className="w-full max-w-4xl">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-black mb-8">Get Ready!</h1>
                    <div className="text-8xl font-bold text-black mb-8">
                        {countdown > 0 ? countdown : 'GO!'}
                    </div>
                    <p className="text-xl text-black">
                        {countdown > 0 ? 'Game starting in...' : 'Start typing now!'}
                    </p>
                </div>
            </div>
        );
    }
    
    if (gameState === 'game') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                {currentRoom?.quote && (
                    <div className="w-full max-w-6xl p-6 rounded-lg">
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
                    <div className="text-center">
                        <p className="text-2xl text-black">Loading game...</p>
                    </div>
                )}
            </div>
        );
    }

    if (gameState === 'results') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-3xl p-6 rounded-lg flex flex-col items-center">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                        {gameResults && (
                            <div className="mb-4">
                                <p className="text-gray-700">Room: {gameResults.roomId}</p>
                                <p className="text-gray-700">{gameResults.players.length} players participated</p>
                            </div>
                        )}
                        <p className="text-gray-700 mb-4">Detailed results will be displayed here once implemented.</p>
                        
                        <div className="space-y-2">
                            <button
                                onClick={handleBackToLobby}
                                className="bg-black text-white py-2 px-4 rounded hover:bg-gray-800"
                            >
                                Play Again
                            </button>
                            <div className="text-gray-500 text-sm">
                                or click the button above
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-black mb-4">
                    MultiPlayer
                </h1>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            
            {/* Create and Join Forms */}
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Create Room Section */}
                <div className="bg-white p-6 rounded border">
                    <h2 className="text-xl font-semibold text-black mb-4 text-center">
                        Create Room
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={createName}
                                onChange={(e) => setCreateName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                                disabled={loading}
                            />
                        </div>
                        
                        <button 
                            onClick={handleCreateRoom}
                            disabled={loading}
                            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 disabled:bg-gray-400"
                        >
                            {loading ? 'Creating...' : 'Create Room'}
                        </button>
                    </div>
                </div>

                {/* Join Room Section */}
                <div className="bg-white p-6 rounded border">
                    <h2 className="text-xl font-semibold text-black mb-4 text-center">
                        Join Room
                    </h2>
                    
                    <div className="space-y-4">
                        <div>
                            <input
                                type="text"
                                value={joinName}
                                onChange={(e) => setJoinName(e.target.value)}
                                placeholder="Your name"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                                disabled={loading}
                            />
                        </div>
                        
                        <div>
                            <input
                                type="text"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                placeholder="Room ID"
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                                disabled={loading}
                            />
                        </div>
                        
                        <button 
                            onClick={handleJoinRoom}
                            disabled={loading}
                            className="w-full bg-black text-white py-2 px-4 rounded hover:bg-gray-800 disabled:bg-gray-400"
                        >
                            {loading ? 'Joining...' : 'Join Room'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

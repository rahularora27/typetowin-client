import { Player } from '../services/WebSocketService';

interface PlayerListProps {
  players: Player[];
  roomId: string;
  currentPlayer?: Player;
  onStartGame?: () => void;
  gameStarted: boolean;
}

export default function PlayerList({ players, roomId, currentPlayer, onStartGame, gameStarted }: PlayerListProps) {
  const canStartGame = currentPlayer?.isOwner && players.length > 1 && !gameStarted;
  
  // Debug logging
  console.log('PlayerList Debug:', {
    currentPlayer,
    players,
    canStartGame,
    isOwner: currentPlayer?.isOwner,
    playerCount: players.length,
    gameStarted
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Room: {roomId}</h3>
        <p className="text-sm text-gray-600">{players.length} player{players.length !== 1 ? 's' : ''} in room</p>
      </div>

      {/* Players List */}
      <div className="space-y-2 mb-4">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-800">{player.name}</span>
              {player.isOwner && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  Owner
                </span>
              )}
              {currentPlayer?.id === player.id && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  You
                </span>
              )}
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full" title="Online"></div>
          </div>
        ))}
      </div>

      {/* Game Controls */}
      {!gameStarted && (
        <div className="border-t pt-4">
          {currentPlayer?.isOwner ? (
            <div>
              <button
                onClick={onStartGame}
                disabled={!canStartGame}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                {players.length < 2 ? 'Waiting for more players...' : 'Start Game'}
              </button>
              {players.length < 2 && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Need at least 2 players to start
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600">Waiting for room owner to start the game...</p>
            </div>
          )}
        </div>
      )}

      {gameStarted && (
        <div className="border-t pt-4">
          <div className="text-center">
            <p className="text-green-600 font-semibold">Game Started!</p>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../services/WebSocketService';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function Chat({ messages, onSendMessage, disabled = false }: ChatProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !disabled) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMessageStyle = (messageType: string) => {
    switch (messageType) {
      case 'PLAYER_JOINED':
        return 'text-green-600 italic';
      case 'PLAYER_LEFT':
        return 'text-red-600 italic';
      case 'GAME_STARTED':
        return 'text-blue-600 italic font-semibold';
      default:
        return 'text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 h-96 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Chat</h3>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start chatting!</p>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="mb-2">
              <div className={`text-sm ${getMessageStyle(message.type)}`}>
                {message.type === 'CHAT' ? (
                  <>
                    <span className="font-medium">{message.playerName}</span>
                    <span className="text-gray-400 ml-2 text-xs">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    <div className="mt-1">{message.message}</div>
                  </>
                ) : (
                  <div className="flex items-center gap-1">
                    <span>{message.message}</span>
                    <span className="text-gray-400 text-xs">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={disabled ? "Chat disabled during game" : "Type a message..."}
          disabled={disabled}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || !inputMessage.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
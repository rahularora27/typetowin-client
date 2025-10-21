import { useState, useRef, useEffect, useCallback } from 'react';
import Timer from './Timer';

interface TypingAreaProps {
  initialQuote: string;
  timerDuration: number;
  onGameStart: () => void;
  onGameOver: (correctChars: number, incorrectChars: number) => void;
  // Optional props for multiplayer mode
  isMultiplayer?: boolean;
  serverControlledTimer?: number;
  gameActive?: boolean;
  onServerGameOver?: () => void;
}

function TypingArea({ 
  initialQuote, 
  timerDuration, 
  onGameStart, 
  onGameOver, 
  isMultiplayer = false,
  serverControlledTimer,
  gameActive = false,
  onServerGameOver
}: TypingAreaProps) {
  const [typedCharacters, setTypedCharacters] = useState('');
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [fullQuote, setFullQuote] = useState(initialQuote);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wordsToPrefetch] = useState(10);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Refs to always have the latest values in callbacks
  const correctCharsRef = useRef(correctChars);
  const incorrectCharsRef = useRef(incorrectChars);

  useEffect(() => {
    correctCharsRef.current = correctChars;
    incorrectCharsRef.current = incorrectChars;
  }, [correctChars, incorrectChars]);

  // Reset state when timerDuration or initialQuote changes
  useEffect(() => {
    setTypedCharacters('');
    setCorrectChars(0);
    setIncorrectChars(0);
    setStartTime(null);
    setFullQuote(initialQuote);
    setGameStarted(false);
    setGameOver(false);
  }, [timerDuration, initialQuote]);
  
  // Auto start game in multiplayer when gameActive becomes true
  useEffect(() => {
    if (isMultiplayer && gameActive && !gameStarted && !gameOver) {
      setGameStarted(true);
      onGameStart();
    }
  }, [isMultiplayer, gameActive, gameStarted, gameOver, onGameStart]);

  // Keyboard input handler
  useEffect(() => {
    if (gameOver) return; // Don't allow typing after game over
    if (isMultiplayer && !gameActive) return; // Don't allow typing in multiplayer if game not active

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === 'Shift' ||
        event.key === 'Control' ||
        event.key === 'Alt' ||
        event.key === 'Meta'
      )
        return;

      if (event.key === ' ') {
        if (
          typedCharacters.length < fullQuote.length &&
          fullQuote[typedCharacters.length] !== ' '
        ) {
          event.preventDefault();
          return;
        }
      } else {
        if (
          typedCharacters.length < fullQuote.length &&
          fullQuote[typedCharacters.length] === ' '
        ) {
          event.preventDefault();
          return;
        }
      }

      if (event.key === 'Backspace') {
        setTypedCharacters((prev) => prev.slice(0, -1));
      } else if (event.key.length === 1) {
        setTypedCharacters((prev) => prev + event.key);
      }

      if (startTime === null) {
        setStartTime(Date.now());
        if (!isMultiplayer) {
          onGameStart();
        }
        setGameStarted(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [startTime, onGameStart, fullQuote, typedCharacters.length, gameOver]);

  // Update correct/incorrect chars and prefetch more words if needed
  useEffect(() => {
    let correct = 0;
    let incorrect = 0;
    for (let i = 0; i < Math.min(typedCharacters.length, fullQuote.length); i++) {
      if (fullQuote[i] === ' ') continue;
      if (typedCharacters[i] === fullQuote[i]) {
        correct++;
      } else {
        incorrect++;
      }
    }
    setCorrectChars(correct);
    setIncorrectChars(incorrect);

    const remainingChars = fullQuote.length - typedCharacters.length;
    if (remainingChars < 20 && gameStarted && !isLoading && !gameOver) {
      const fetchMoreWords = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // REST API call instead of NATS
          const res = await fetch(`/api/game/next?wordCount=${wordsToPrefetch}`);
          if (!res.ok) throw new Error('Failed to fetch next words from backend.');
          const quoteData = await res.json();
          setFullQuote((prevQuote) => prevQuote + " " + quoteData.text);
          setIsLoading(false);
        } catch (e: any) {
          setError(`Failed to fetch next words: ${e.message}`);
          setIsLoading(false);
          console.error("Error fetching next words:", e);
        }
      };
      fetchMoreWords();
    }
  }, [typedCharacters, fullQuote, gameStarted, isLoading, gameOver, wordsToPrefetch]);

  // Handle server-controlled game over for multiplayer
  useEffect(() => {
    if (isMultiplayer && serverControlledTimer !== undefined && serverControlledTimer <= 0 && !gameOver) {
      setGameOver(true);
      if (onServerGameOver) {
        onServerGameOver();
      } else {
        onGameOver(correctCharsRef.current, incorrectCharsRef.current);
      }
    }
  }, [isMultiplayer, serverControlledTimer, gameOver, onServerGameOver, onGameOver]);
  
  // Only call onGameOver once for singleplayer
  const handleExpire = useCallback(() => {
    if (!gameOver && !isMultiplayer) {
      setTimeout(() => {
        setGameOver(true);
        onGameOver(correctCharsRef.current, incorrectCharsRef.current);
      }, 0);
    }
  }, [gameOver, onGameOver, isMultiplayer]);

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}
      <p className="text-gray-700 text-4xl">
        {isMultiplayer && serverControlledTimer !== undefined ? (
          <span>{serverControlledTimer}</span>
        ) : (
          <Timer
            duration={timerDuration}
            isRunning={gameStarted && !gameOver}
            onExpire={handleExpire}
          />
        )}
        s
      </p>
      <div className="text-3xl font-mono tracking-wide">
        {fullQuote.split('').map((char, index) => {
          let className = '';
          if (index < typedCharacters.length) {
            className = typedCharacters[index] === char ? 'text-green-500' : 'text-red-500';
          }
          return (
            <span key={index} className={className}>
              {char}
            </span>
          );
        })}
      </div>
      {isLoading && <p className="text-gray-500">Loading...</p>}
    </div>
  );
}

export default TypingArea;

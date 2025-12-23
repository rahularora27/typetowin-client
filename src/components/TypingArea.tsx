import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  // Optional props for content customization
  includePunctuation?: boolean;
  includeNumbers?: boolean;
  // Optional props for game mode
  gameMode?: 'timer' | 'words';
  targetWordCount?: number;
  // Progress callbacks
  onTimerTick?: (timeLeft: number) => void;
  onWordsProgress?: (completed: number) => void;
  // Block typing when modal/input is open
  inputBlocked?: boolean;
}

function TypingArea({ 
  initialQuote, 
  timerDuration, 
  onGameStart, 
  onGameOver, 
  isMultiplayer = false,
  serverControlledTimer,
  gameActive = false,
  onServerGameOver,
  includePunctuation = false,
  includeNumbers = false,
  gameMode = 'timer',
  targetWordCount = 10,
  onTimerTick,
  onWordsProgress,
  inputBlocked = false
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

  // Refs for smooth cursor animation
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, height: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

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
    setCursorVisible(false);
  }, [timerDuration, initialQuote]);

  // Update cursor position when typedCharacters changes
  useEffect(() => {
    const updateCursorPosition = () => {
      const charIndex = typedCharacters.length;
      const charRef = charRefs.current[charIndex];
      const container = containerRef.current;

      if (charRef && container) {
        const charRect = charRef.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setCursorPos({
          x: charRect.left - containerRect.left,
          y: charRect.top - containerRect.top,
          height: charRect.height
        });
        setCursorVisible(true);
      } else if (charRefs.current[0] && container) {
        // Fallback to first character position
        const firstCharRect = charRefs.current[0].getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setCursorPos({
          x: firstCharRect.left - containerRect.left,
          y: firstCharRect.top - containerRect.top,
          height: firstCharRect.height
        });
        setCursorVisible(true);
      }
    };

    // Small delay to ensure DOM is updated
    requestAnimationFrame(updateCursorPosition);
  }, [typedCharacters.length, fullQuote]);

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
    if (inputBlocked) return; // Block typing when a modal or input is focused

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const isFormField = target.closest('input, textarea, select, [contenteditable="true"]');
        if (isFormField) return;
      }
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
  }, [startTime, onGameStart, fullQuote, typedCharacters.length, gameOver, isMultiplayer, gameActive, inputBlocked]);

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

    // Check if we've completed the target word count in word mode
    if (gameMode === 'words') {
      const typedText = typedCharacters.slice(0, fullQuote.length);
      const wordsCompleted = typedText.trim().split(/\s+/).filter(word => word.length > 0).length;

      // Notify parent about progress
      if (onWordsProgress) onWordsProgress(wordsCompleted);
      
      // End game only when started and completed
      if (gameStarted && !gameOver) {
        if (typedCharacters.length > 0 && 
            typedCharacters[typedCharacters.length - 1] === ' ' && 
            wordsCompleted >= targetWordCount) {
          setGameOver(true);
          onGameOver(correct, incorrect);
          return;
        }
      }
    }

    // Prefetch more words if needed
    const remainingChars = fullQuote.length - typedCharacters.length;
    
    // In word mode: only prefetch if we need more words than we have
    // In timer mode: always prefetch when running low
    const shouldPrefetch = gameMode === 'timer' 
      ? remainingChars < 20 
      : (() => {
          // For word mode, count words in the quote
          const totalWords = fullQuote.trim().split(/\s+/).filter(w => w.length > 0).length;
          return totalWords < targetWordCount && remainingChars < 20;
        })();
    
    if (shouldPrefetch && gameStarted && !isLoading && !gameOver) {
      const fetchMoreWords = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // In word mode, calculate how many more words we need
          let wordsToFetch = wordsToPrefetch;
          if (gameMode === 'words') {
            const currentWords = fullQuote.trim().split(/\s+/).filter(w => w.length > 0).length;
            const wordsNeeded = targetWordCount - currentWords;
            wordsToFetch = Math.min(wordsToPrefetch, wordsNeeded);
          }
          
          // REST API call with punctuation and numbers parameters
          const params = new URLSearchParams({
            wordCount: wordsToFetch.toString(),
            punctuation: includePunctuation.toString(),
            numbers: includeNumbers.toString()
          });
          const res = await fetch(`/api/game/next?${params}`);
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
  }, [typedCharacters, fullQuote, gameStarted, isLoading, gameOver, wordsToPrefetch, includePunctuation, includeNumbers, gameMode, targetWordCount, onGameOver]);

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

  // Calculate words completed for word mode display
  const wordsCompleted = typedCharacters.trim().split(/\s+/).filter(word => word.length > 0).length;

  return (
    <div className="relative w-full">
      {error && <p className="text-red-400 mb-4 text-center">{error}</p>}
      
      {/* Container for text */}
      <div className="relative max-w-[1200px] mx-auto">
        {/* Typing Text - Larger Size - Centered */}
        <div ref={containerRef} className="text-3xl leading-relaxed font-mono relative text-center">
          {/* Smooth animated cursor */}
          {cursorVisible && !gameOver && (
            <motion.span
              className="absolute w-0.5 bg-[#e2b714] pointer-events-none"
              initial={false}
              animate={{
                x: cursorPos.x,
                y: cursorPos.y,
                height: cursorPos.height,
                opacity: [1, 1, 0, 0, 1],
              }}
              transition={{
                x: { type: "spring", stiffness: 500, damping: 30 },
                y: { type: "spring", stiffness: 500, damping: 30 },
                height: { duration: 0 },
                opacity: { duration: 1, repeat: Infinity, ease: "linear" }
              }}
              style={{ left: 0, top: 0 }}
            />
          )}
          {fullQuote.split('').map((char, index) => {
            let className = 'text-gray-600'; // Untyped text

            if (index < typedCharacters.length) {
              // Correct characters
              if (typedCharacters[index] === char) {
                className = 'text-gray-300';
              } else {
                // Incorrect characters
                className = 'text-red-400';
              }
            }

            return (
              <span
                key={index}
                ref={(el) => { charRefs.current[index] = el; }}
                className={`${className} transition-colors duration-100`}
              >
                {char}
              </span>
            );
          })}
        </div>
      </div>
      
      {isLoading && <p className="text-gray-600 text-sm mt-4 text-center">loading...</p>}

      {/* Hidden timer instance to drive countdown and onExpire for singleplayer */}
      {!isMultiplayer && (
        <div className="hidden">
          <Timer
            duration={timerDuration}
            isRunning={gameStarted && !gameOver}
            onExpire={handleExpire}
            onTick={onTimerTick}
          />
        </div>
      )}
    </div>
  );
}

export default TypingArea;

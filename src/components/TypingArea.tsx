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
  const [error, setError] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  // Word buffer pool system
  const [wordBuffer, setWordBuffer] = useState<string[]>([]);
  const isRefilling = useRef(false);
  const BUFFER_SIZE = 100; // Pre-fetch this many words
  const REFILL_THRESHOLD = 50; // Refill when buffer drops below this

  // Refs for smooth cursor animation
  const containerRef = useRef<HTMLDivElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, height: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);

  // State for 3-line sliding window
  const [lineHeight, setLineHeight] = useState(0);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [lineStartIndices, setLineStartIndices] = useState<number[]>([0]);

  // Refs to always have the latest values in callbacks
  const correctCharsRef = useRef(correctChars);
  const incorrectCharsRef = useRef(incorrectChars);

  useEffect(() => {
    correctCharsRef.current = correctChars;
    incorrectCharsRef.current = incorrectChars;
  }, [correctChars, incorrectChars]);

  // Fetch words for the buffer pool
  const fetchWordsToBuffer = useCallback(async (count: number) => {
    if (isRefilling.current) return;
    isRefilling.current = true;

    try {
      const params = new URLSearchParams({
        wordCount: count.toString(),
        punctuation: includePunctuation.toString(),
        numbers: includeNumbers.toString()
      });
      const res = await fetch(`/api/game/next?${params}`);
      if (!res.ok) throw new Error('Failed to fetch words');
      const data = await res.json();
      const newWords = data.text.split(' ').filter((w: string) => w.length > 0);
      setWordBuffer(prev => [...prev, ...newWords]);
    } catch (e: any) {
      console.error("Error fetching words for buffer:", e);
      setError(`Failed to fetch words: ${e.message}`);
    } finally {
      isRefilling.current = false;
    }
  }, [includePunctuation, includeNumbers]);

  // Initial buffer fill on mount
  useEffect(() => {
    if (gameMode === 'timer') {
      fetchWordsToBuffer(BUFFER_SIZE);
    }
  }, [includePunctuation, includeNumbers, gameMode, fetchWordsToBuffer]);

  // Refill buffer when it gets low
  useEffect(() => {
    if (gameMode === 'timer' && wordBuffer.length < REFILL_THRESHOLD && !isRefilling.current && gameStarted && !gameOver) {
      fetchWordsToBuffer(BUFFER_SIZE);
    }
  }, [wordBuffer.length, gameStarted, gameOver, gameMode, fetchWordsToBuffer]);

  // Add words from buffer to fullQuote as needed
  useEffect(() => {
    if (gameMode !== 'timer') return;

    const remainingChars = fullQuote.length - typedCharacters.length;
    // Add more words when we have less than 150 chars remaining (about 2-3 lines ahead)
    if (remainingChars < 150 && wordBuffer.length > 0 && !gameOver) {
      // Take 15-20 words from buffer at a time
      const wordsToAdd = Math.min(20, wordBuffer.length);
      const newWords = wordBuffer.slice(0, wordsToAdd);

      setWordBuffer(prev => prev.slice(wordsToAdd));
      setFullQuote(prev => prev + ' ' + newWords.join(' '));
    }
  }, [typedCharacters.length, fullQuote.length, wordBuffer, gameOver, gameMode]);

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
    setCurrentLineIndex(0);
    setLineStartIndices([0]);
    setWordBuffer([]);
    isRefilling.current = false;
  }, [timerDuration, initialQuote]);

  // Calculate line breaks based on character positions
  useEffect(() => {
    const calculateLines = () => {
      const chars = charRefs.current;
      if (chars.length === 0 || !chars[0]) return;

      const firstChar = chars[0];
      const firstRect = firstChar.getBoundingClientRect();

      const lineStarts: number[] = [0];
      const lineYPositions: number[] = [firstRect.top];
      let currentY = firstRect.top;

      for (let i = 1; i < chars.length; i++) {
        const char = chars[i];
        if (!char) continue;

        const rect = char.getBoundingClientRect();
        // If y-position changed significantly, it's a new line
        if (Math.abs(rect.top - currentY) > 5) {
          lineStarts.push(i);
          lineYPositions.push(rect.top);
          currentY = rect.top;
        }
      }

      // Calculate actual line height from the difference between first two lines
      // This accounts for line-height CSS property accurately
      if (lineYPositions.length >= 2) {
        const actualLineHeight = lineYPositions[1] - lineYPositions[0];
        setLineHeight(actualLineHeight);
      } else {
        // Fallback: use character height * 1.625 (leading-relaxed)
        setLineHeight(firstRect.height * 1.625);
      }

      setLineStartIndices(lineStarts);
    };

    // Run after DOM updates
    requestAnimationFrame(calculateLines);
  }, [fullQuote]);

  // Update which line the cursor is on
  useEffect(() => {
    const cursorIndex = typedCharacters.length;
    let lineIndex = 0;

    for (let i = 0; i < lineStartIndices.length; i++) {
      if (cursorIndex >= lineStartIndices[i]) {
        lineIndex = i;
      } else {
        break;
      }
    }

    // Only update if cursor moved to a new line (line 2 or beyond in the visible window)
    // We want to keep cursor on line 1 (second visible line) when possible
    const visibleLineOffset = lineIndex - currentLineIndex;
    if (visibleLineOffset >= 2 && lineIndex > 0) {
      setCurrentLineIndex(lineIndex - 1);
    }
  }, [typedCharacters.length, lineStartIndices, currentLineIndex]);

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
  }, [typedCharacters.length, fullQuote, currentLineIndex]);

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

  // Update correct/incorrect chars
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
  }, [typedCharacters, fullQuote, gameStarted, gameOver, gameMode, targetWordCount, onGameOver, onWordsProgress]);

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
      
      {/* Container for text - 3 line sliding window */}
      <div className="relative max-w-[1200px] mx-auto">
        {/* Outer container with fixed height and overflow hidden */}
        <div
          className="overflow-hidden relative"
          style={{ height: lineHeight > 0 ? `${lineHeight * 3}px` : 'auto' }}
        >
          {/* Sliding container that moves up as user types */}
          <motion.div
            ref={containerRef}
            className="text-3xl leading-relaxed font-mono relative text-center"
            animate={{
              y: lineHeight > 0 ? -currentLineIndex * lineHeight : 0
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
          >
            {/* Smooth animated cursor */}
            {cursorVisible && !gameOver && (
              <motion.span
                className="absolute w-0.5 bg-[#e2b714] pointer-events-none z-10"
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
          </motion.div>
        </div>
        {/* Fade gradient at top and bottom edges */}
        {lineHeight > 0 && currentLineIndex > 0 && (
          <div
            className="absolute top-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: '30px',
              background: 'linear-gradient(to bottom, #323437 0%, transparent 100%)'
            }}
          />
        )}
        {lineHeight > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none z-20"
            style={{
              height: '30px',
              background: 'linear-gradient(to top, #323437 0%, transparent 100%)'
            }}
          />
        )}
      </div>

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

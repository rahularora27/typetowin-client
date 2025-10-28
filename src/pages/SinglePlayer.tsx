import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Quote from "../components/Quote";
import TypingArea from "../components/TypingArea";
import Results from "../components/Results";
import OptionsBar from "../components/OptionsBar";
import NumberModal from "../components/NumberModal";

export default function SinglePlayer() {
  const [_sessionId, setSessionId] = useState<string | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [gameMode, setGameMode] = useState<'timer' | 'words'>('timer');
  const [timerDuration, setTimerDuration] = useState(30);
  const [wordCount, setWordCount] = useState(10);
  const [quoteFetched, setQuoteFetched] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState('');
  const [showCustomWordInput, setShowCustomWordInput] = useState(false);
  const [customWordValue, setCustomWordValue] = useState('');
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [wordsCompleted, setWordsCompleted] = useState(0);

  const handleSessionReceived = useCallback((newSessionId: string, newQuote: string) => {
    setSessionId(newSessionId);
    setQuote(newQuote);
    setQuoteFetched(true);
  }, []);

  const handleModeSelect = (mode: 'timer' | 'words') => {
    setGameMode(mode);
    if (!gameOver) {
      setGameActive(false);
      setSessionId(null);
      setQuote('');
      setQuoteFetched(false);
    }
  };

  const handleTimerSelect = (duration: number) => {
    setTimerDuration(duration);
    setTimeLeft(duration);
    if (!gameOver) {
      setGameActive(false);
    }
  };
  
  const handlePunctuationToggle = () => {
    if (!gameActive && !gameOver) {
      setIncludePunctuation(!includePunctuation);
      // Reset to get new quote with updated settings
      setSessionId(null);
      setQuote('');
      setQuoteFetched(false);
    }
  };
  
  const handleNumbersToggle = () => {
    if (!gameActive && !gameOver) {
      setIncludeNumbers(!includeNumbers);
      // Reset to get new quote with updated settings
      setSessionId(null);
      setQuote('');
      setQuoteFetched(false);
    }
  };
  
  const handleCustomTimeClick = () => {
    setShowCustomTimeInput(true);
  };
  
  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const time = parseInt(customTimeValue);
    if (!isNaN(time) && time > 0 && time <= 300) { // Max 5 minutes
      setTimerDuration(time);
      if (!gameOver) {
        setGameActive(false);
      }
      setShowCustomTimeInput(false);
      setCustomTimeValue('');
    }
  };
  
  const handleCustomTimeCancel = () => {
    setShowCustomTimeInput(false);
    setCustomTimeValue('');
  };
  
  const handleWordCountSelect = (count: number) => {
    setWordCount(count);
    if (!gameOver) {
      setGameActive(false);
      // Reset to get new quote with updated word count
      setSessionId(null);
      setQuote('');
      setQuoteFetched(false);
    }
  };
  
  const handleCustomWordClick = () => {
    setShowCustomWordInput(true);
  };
  
  const handleCustomWordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(customWordValue);
    if (!isNaN(count) && count > 0 && count <= 500) { // Max 500 words
      setWordCount(count);
      if (!gameOver) {
        setGameActive(false);
        // Reset to get new quote with updated word count
        setSessionId(null);
        setQuote('');
        setQuoteFetched(false);
      }
      setShowCustomWordInput(false);
      setCustomWordValue('');
    }
  };
  
  const handleCustomWordCancel = () => {
    setShowCustomWordInput(false);
    setCustomWordValue('');
  };

  // Unified handlers for primary option group (timer/words)
  const handlePrimaryOptionSelect = (value: number) => {
    if (gameMode === 'timer') {
      handleTimerSelect(value);
    } else {
      handleWordCountSelect(value);
    }
  };

  const handleCustomPrimaryClick = () => {
    if (gameMode === 'timer') {
      handleCustomTimeClick();
    } else {
      handleCustomWordClick();
    }
  };

  const handleGameStart = () => {
    setGameActive(true);
  };

  const handleGameOver = useCallback((correct: number, incorrect: number) => {
    setGameActive(false);
    setGameOver(true);
    setCorrectChars(correct);
    setIncorrectChars(incorrect);
  }, []);

  const handleRestart = useCallback(() => {
    setSessionId(null);
    setQuote('');
    setQuoteFetched(false);
    setGameActive(false);
    setGameOver(false);
    setCorrectChars(0);
    setIncorrectChars(0);
    setTimeLeft(timerDuration);
    setWordsCompleted(0);
    // Reset toggles to defaults
    setIncludePunctuation(false);
    setIncludeNumbers(false);
  }, [timerDuration]);

  useEffect(() => {
    const handleTabRestart = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        handleRestart();
      }
      if (event.key === "Escape" && showCustomTimeInput) {
        handleCustomTimeCancel();
      }
      if (event.key === "Escape" && showCustomWordInput) {
        handleCustomWordCancel();
      }
    };
    window.addEventListener("keydown", handleTabRestart);
    return () => window.removeEventListener("keydown", handleTabRestart);
  }, [handleRestart, showCustomTimeInput, showCustomWordInput]);

  return (
    <div className="flex flex-col min-h-screen bg-[#323437] text-gray-300">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6">
        {/* Logo */}
        <div className="text-2xl font-bold text-[#e2b714]">
          type2win
        </div>
        
        {/* Multiplayer Button */}
        <Link to="/multiplayer">
          <button className="px-4 py-2 text-[#e2b714] hover:text-[#d5a00f] font-medium transition-colors duration-200 cursor-pointer">
            multiplayer
          </button>
        </Link>
      </nav>
      
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-4">
      
      {!quoteFetched && (
        <div className="text-gray-500">
          <Quote 
            onSessionReceived={handleSessionReceived} 
            includePunctuation={includePunctuation}
            includeNumbers={includeNumbers}
            gameMode={gameMode}
            wordCount={wordCount}
          />
        </div>
      )}

      {/* Options/Timer bar area */}
      <div className="order-1 mb-3 min-h-[52px] w-full max-w-[1200px] flex items-center justify-center">
        {quoteFetched && !gameOver && (
          !gameActive ? (
            <OptionsBar
              gameMode={gameMode}
              includePunctuation={includePunctuation}
              includeNumbers={includeNumbers}
              timerDuration={timerDuration}
              wordCount={wordCount}
              onPunctuationToggle={handlePunctuationToggle}
              onNumbersToggle={handleNumbersToggle}
              onModeSelect={handleModeSelect}
              onPrimaryOptionSelect={handlePrimaryOptionSelect}
              onCustomPrimaryClick={handleCustomPrimaryClick}
            />
          ) : (
            <div className="text-[#e2b714] text-2xl font-medium">
              {gameMode === 'timer' ? (
                <span>{timeLeft}</span>
              ) : (
                <span>{wordsCompleted} <span className="text-gray-500">/ {wordCount}</span></span>
              )}
            </div>
          )
        )}
      </div>

        {/* Typing area - always same size */}
        <div className="order-2 w-full max-w-5xl min-h-[200px]">
          {quoteFetched && !gameOver && (
            <TypingArea
              initialQuote={quote}
              timerDuration={timerDuration}
              onGameStart={handleGameStart}
              onGameOver={handleGameOver}
              includePunctuation={includePunctuation}
              includeNumbers={includeNumbers}
              gameMode={gameMode}
              targetWordCount={wordCount}
              gameActive={gameActive}
              onTimerTick={setTimeLeft}
              onWordsProgress={setWordsCompleted}
              inputBlocked={showCustomTimeInput || showCustomWordInput}
            />
          )}
        </div>

        {gameOver && (
          <div className="w-full max-w-4xl flex flex-col items-center">
            <Results correctChars={correctChars} incorrectChars={incorrectChars} />
            <div className="mt-6 text-gray-600 text-sm">
              <kbd className="px-2 py-1 bg-[#2c2e31] rounded border border-gray-700">Tab</kbd> - restart test
            </div>
          </div>
        )}
      </div>
      
      {/* Custom Time Popup */}
      <NumberModal
        open={showCustomTimeInput}
        title="custom time"
        value={customTimeValue}
        placeholder="seconds (1-300)"
        min={1}
        max={300}
        onChange={setCustomTimeValue}
        onCancel={handleCustomTimeCancel}
        onSubmit={handleCustomTimeSubmit}
      />
      
      {/* Custom Word Count Popup */}
      <NumberModal
        open={showCustomWordInput}
        title="custom word count"
        value={customWordValue}
        placeholder="words (1-500)"
        min={1}
        max={500}
        onChange={setCustomWordValue}
        onCancel={handleCustomWordCancel}
        onSubmit={handleCustomWordSubmit}
      />
    </div>
  );
}

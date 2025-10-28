import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import Quote from "../components/Quote";
import TypingArea from "../components/TypingArea";
import Results from "../components/Results";

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
    // Reset toggles to defaults
    setIncludePunctuation(false);
    setIncludeNumbers(false);
  }, []);

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
          t2w
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

      {/* Show options box only when game is not active and not over */}
      <div className="order-1 mb-3 min-h-[52px] w-full max-w-[1200px] flex items-center justify-center">
        {quoteFetched && !gameActive && !gameOver && (
          <div className="flex items-center bg-[#2c2e31] rounded-lg px-4 py-2 space-x-4">
            {/* Content Options */}
            <div className="flex items-center space-x-3">
              <button
                className={`text-sm transition-colors duration-200 ${
                  includePunctuation 
                    ? 'text-[#e2b714]' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={handlePunctuationToggle}
              >
                punctuation
              </button>
              <button
                className={`text-sm transition-colors duration-200 ${
                  includeNumbers 
                    ? 'text-[#e2b714]' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={handleNumbersToggle}
              >
                numbers
              </button>
            </div>
            
            {/* Vertical Separator */}
            <div className="h-6 w-px bg-gray-700"></div>
            
            {/* Game Mode Selection */}
            <div className="flex items-center space-x-3">
              <button
                className={`text-sm transition-colors duration-200 ${
                  gameMode === 'timer' 
                    ? 'text-[#e2b714]' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => handleModeSelect('timer')}
              >
                time
              </button>
              <button
                className={`text-sm transition-colors duration-200 ${
                  gameMode === 'words' 
                    ? 'text-[#e2b714]' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
                onClick={() => handleModeSelect('words')}
              >
                words
              </button>
            </div>
            
            {/* Vertical Separator */}
            <div className="h-6 w-px bg-gray-700"></div>
            
            {/* Primary Options (time/words) - unified to avoid repetition */}
            <div className="flex items-center space-x-2">
              {(
                gameMode === 'timer' ? [15, 30, 60] : [10, 25, 50]
              ).map((val) => {
                const isSelected = gameMode === 'timer' ? timerDuration === val : wordCount === val;
                return (
                  <button
                    key={val}
                    className={`text-sm px-3 py-1 rounded transition-colors duration-200 ${
                      isSelected ? 'text-[#e2b714]' : 'text-gray-500 hover:text-gray-300'
                    }`}
                    onClick={() => handlePrimaryOptionSelect(val)}
                  >
                    {val}{gameMode === 'timer' ? '' : ''}
                  </button>
                );
              })}
              <button
                className={`text-sm px-3 py-1 rounded transition-colors duration-200 ${
                  gameMode === 'timer'
                    ? (timerDuration !== 15 && timerDuration !== 30 && timerDuration !== 60 ? 'bg-[#e2b714] text-[#323437]' : 'text-gray-500 hover:text-gray-300')
                    : (wordCount !== 10 && wordCount !== 25 && wordCount !== 50 ? 'bg-[#e2b714] text-[#323437]' : 'text-gray-500 hover:text-gray-300')
                }`}
                onClick={handleCustomPrimaryClick}
              >
                custom
              </button>
            </div>
          </div>
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
      {showCustomTimeInput && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#2c2e31] p-6 rounded border border-gray-700 shadow-2xl">
            <h3 className="text-lg font-medium text-gray-300 mb-4">custom time</h3>
            <form onSubmit={handleCustomTimeSubmit}>
              <div className="mb-4">
                <input
                  type="number"
                  value={customTimeValue}
                  onChange={(e) => setCustomTimeValue(e.target.value)}
                  placeholder="seconds (1-300)"
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 bg-[#323437] border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-[#e2b714]"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={handleCustomTimeCancel}
                  className="px-4 py-2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e2b714] text-[#323437] rounded hover:bg-[#d5a00f] transition-colors"
                >
                  ok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Custom Word Count Popup */}
      {showCustomWordInput && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#2c2e31] p-6 rounded border border-gray-700 shadow-2xl">
            <h3 className="text-lg font-medium text-gray-300 mb-4">custom word count</h3>
            <form onSubmit={handleCustomWordSubmit}>
              <div className="mb-4">
                <input
                  type="number"
                  value={customWordValue}
                  onChange={(e) => setCustomWordValue(e.target.value)}
                  placeholder="words (1-500)"
                  min="1"
                  max="500"
                  className="w-full px-3 py-2 bg-[#323437] border border-gray-700 rounded text-gray-300 focus:outline-none focus:border-[#e2b714]"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={handleCustomWordCancel}
                  className="px-4 py-2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e2b714] text-[#323437] rounded hover:bg-[#d5a00f] transition-colors"
                >
                  ok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, useEffect } from "react";
import Quote from "../components/Quote";
import TypingArea from "../components/TypingArea";
import Results from "../components/Results";

export default function SinglePlayer() {
  const [_sessionId, setSessionId] = useState<string | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState(30);
  const [quoteFetched, setQuoteFetched] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [includePunctuation, setIncludePunctuation] = useState(false);
  const [includeNumbers, setIncludeNumbers] = useState(false);
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);
  const [customTimeValue, setCustomTimeValue] = useState('');

  const handleSessionReceived = useCallback((newSessionId: string, newQuote: string) => {
    setSessionId(newSessionId);
    setQuote(newQuote);
    setQuoteFetched(true);
  }, []);

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
    };
    window.addEventListener("keydown", handleTabRestart);
    return () => window.removeEventListener("keydown", handleTabRestart);
  }, [handleRestart, showCustomTimeInput]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      {!quoteFetched && (
        <div>
          <Quote 
            onSessionReceived={handleSessionReceived} 
            includePunctuation={includePunctuation}
            includeNumbers={includeNumbers}
          />
        </div>
      )}

      {quoteFetched && !gameActive && !gameOver && (
        <div className="flex flex-col items-center space-y-4 mb-4">
          {/* Content Options */}
          <div className="flex space-x-6">
            <button
              className={`text-black ${includePunctuation ? 'underline' : ''}`}
              onClick={handlePunctuationToggle}
            >
              punctuation
            </button>
            <button
              className={`text-black ${includeNumbers ? 'underline' : ''}`}
              onClick={handleNumbersToggle}
            >
              numbers
            </button>
          </div>
          
          {/* Timer Options */}
          <div className="flex space-x-4 items-center">
            <button
              className={`text-black ${timerDuration === 15 ? 'underline' : ''}`}
              onClick={() => handleTimerSelect(15)}
            >
              15s
            </button>
            <button
              className={`text-black ${timerDuration === 30 ? 'underline' : ''}`}
              onClick={() => handleTimerSelect(30)}
            >
              30s
            </button>
            <button
              className={`text-black ${timerDuration === 60 ? 'underline' : ''}`}
              onClick={() => handleTimerSelect(60)}
            >
              60s
            </button>
            
            <button
              className={`text-black ${timerDuration !== 15 && timerDuration !== 30 && timerDuration !== 60 ? 'underline' : ''}`}
              onClick={handleCustomTimeClick}
            >
              custom
            </button>
          </div>
        </div>
      )}

      {quoteFetched && !gameOver && (
        <div className="w-full max-w-6xl p-6 rounded-lg">
          <TypingArea
            initialQuote={quote}
            timerDuration={timerDuration}
            onGameStart={handleGameStart}
            onGameOver={handleGameOver}
            includePunctuation={includePunctuation}
            includeNumbers={includeNumbers}
          />
        </div>
      )}

      {gameOver && (
        <div className="w-full max-w-3xl p-6 rounded-lg flex flex-col items-center">
          <Results correctChars={correctChars} incorrectChars={incorrectChars} />
          <div className="mt-2 text-gray-500 text-sm">
            Press <kbd>Tab</kbd> to restart
          </div>
        </div>
      )}
      
      {/* Custom Time Popup */}
      {showCustomTimeInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded border border-gray-300 shadow-lg">
            <h3 className="text-lg font-semibold text-black mb-4">Custom Time</h3>
            <form onSubmit={handleCustomTimeSubmit}>
              <div className="mb-4">
                <input
                  type="number"
                  value={customTimeValue}
                  onChange={(e) => setCustomTimeValue(e.target.value)}
                  placeholder="Enter seconds (1-300)"
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>
              <div className="flex space-x-3 justify-end">
                <button
                  type="button"
                  onClick={handleCustomTimeCancel}
                  className="px-4 py-2 text-black hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
                >
                  OK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const handleSessionReceived = useCallback((newSessionId: string, newQuote: string) => {
    setSessionId(newSessionId);
    setQuote(newQuote);
    setQuoteFetched(true);
  }, []);

  const handleTimerSelect = (duration: number) => {
    setTimerDuration(duration);
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
    };
    window.addEventListener("keydown", handleTabRestart);
    return () => window.removeEventListener("keydown", handleTabRestart);
  }, [handleRestart]);

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
          <div className="flex space-x-4">
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
    </div>
  );
}

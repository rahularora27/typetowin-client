'use client';

import React, { useState, useCallback, useEffect, useRef } from "react";
import Quote from "@/components/Quote";
import TypingArea from "@/components/TypingArea";
import Results from "@/components/Results";

// --- ResultSubmitter Component ---

interface ResultSubmitterProps {
  sessionId: string;
  quote: string;
  correctChars: number;
  incorrectChars: number;
  timer: number;
  onSubmitted: () => void;
}

const ResultSubmitter: React.FC<ResultSubmitterProps> = ({
  sessionId,
  quote,
  correctChars,
  incorrectChars,
  timer,
  onSubmitted,
}) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current) return; // Prevent double submission (React StrictMode)
    hasSubmitted.current = true;

    const submitResult = async () => {
      try {
        const result = {
          sessionId,
          quote,
          correctChars,
          incorrectChars,
          timer,
        };
        const res = await fetch('/api/game/result', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });
        if (!res.ok) throw new Error('Failed to submit result.');
        setSubmitted(true);
        onSubmitted();
      } catch (e: any) {
        setSubmitError(`Failed to submit result: ${e.message}`);
      }
    };
    submitResult();
    // eslint-disable-next-line
  }, []);

  if (submitError) return <div className="text-red-500">{submitError}</div>;
  if (!submitted) return <div>Submitting your result...</div>;
  return null;
};

// --- Main Page Component ---

export default function SinglePlayerPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [quote, setQuote] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState(30);
  const [quoteFetched, setQuoteFetched] = useState(false);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [correctChars, setCorrectChars] = useState(0);
  const [incorrectChars, setIncorrectChars] = useState(0);
  const [resultSubmitted, setResultSubmitted] = useState(false);

  // Handler for receiving sessionId and quote
  const handleSessionReceived = useCallback((newSessionId: string, newQuote: string) => {
    setSessionId(newSessionId);
    setQuote(newQuote);
    setQuoteFetched(true);
  }, []);

  const handleTimerSelect = (duration: number) => {
    setTimerDuration(duration);
  };

  const handleGameStart = () => {
    setGameActive(true);
  };

  const handleGameOver = useCallback((correct: number, incorrect: number) => {
    setGameActive(false);
    setGameOver(true);
    setCorrectChars(correct);
    setIncorrectChars(incorrect);
    setResultSubmitted(false); // Reset for new submission
  }, []);

  // Reset everything for a new game
  const handleRestart = useCallback(() => {
    setSessionId(null);
    setQuote('');
    setQuoteFetched(false);
    setGameActive(false);
    setGameOver(false);
    setCorrectChars(0);
    setIncorrectChars(0);
    setResultSubmitted(false);
  }, []);

  // Tab-to-restart support
  useEffect(() => {
    const handleTabRestart = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault(); // Prevent focus change
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
          <Quote onSessionReceived={handleSessionReceived} />
        </div>
      )}

      {quoteFetched && !gameActive && !gameOver && (
        <div className="flex space-x-4 mb-4">
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
      )}

      {quoteFetched && !gameOver && (
        <div className="w-full max-w-6xl p-6 rounded-lg">
          <TypingArea
            initialQuote={quote}
            timerDuration={timerDuration}
            onGameStart={handleGameStart}
            onGameOver={handleGameOver}
          />
        </div>
      )}

      {gameOver && (
        <div className="w-full max-w-3xl p-6 rounded-lg flex flex-col items-center">
          {/* Submit result only once per game over */}
          {sessionId && !resultSubmitted && (
            <ResultSubmitter
              sessionId={sessionId}
              quote={quote}
              correctChars={correctChars}
              incorrectChars={incorrectChars}
              timer={timerDuration}
              onSubmitted={() => setResultSubmitted(true)}
            />
          )}
          <Results correctChars={correctChars} incorrectChars={incorrectChars} />
          <div className="mt-2 text-gray-500 text-sm">
            Press <kbd>Tab</kbd> to restart
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import Quote from "@/components/Quote";
import TypingArea from "@/components/TypingArea";
import Results from "@/components/Results";
import { connect, NatsConnection } from "nats.ws";
import { useEffect, useState, useCallback } from "react";

export default function SinglePlayerGame() {
    const [nats, setNats] = useState<NatsConnection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [quote, setQuote] = useState<string>('');
    const [timerDuration, setTimerDuration] = useState(30);
    const [quoteFetched, setQuoteFetched] = useState(false);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [correctChars, setCorrectChars] = useState(0);
    const [incorrectChars, setIncorrectChars] = useState(0);

    const connectToNats = useCallback(async () => {
        try {
            const nc = await connect({ servers: ["ws://0.0.0.0:8080"] });
            setNats(nc);
            setError(null);
        } catch (e: any) {
            console.error("Failed to connect to NATS:", e);
            setError(`Failed to connect to NATS: ${e.message}`);
        }
    }, []);

    useEffect(() => {
        connectToNats();
        return () => {
            nats?.drain();
        };
    }, [connectToNats]);

    const handleQuoteReceived = (newQuote: string) => {
        setQuote(newQuote);
        setQuoteFetched(true);
    };

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
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            {error && <div className="text-red-500 mb-4">{error}</div>}

            {!quoteFetched && (
                <div>
                    <Quote natsConnection={nats} onQuoteReceived={handleQuoteReceived} />
                </div>
            )}

            {quoteFetched && !gameActive && !gameOver && (
                <div className="flex space-x-4 mb-4">
                    <button
                        className={`text-black ${timerDuration === 15 ? 'underline' :''}`}
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
                        natsConnection={nats}
                        initialQuote={quote}
                        timerDuration={timerDuration}
                        onGameStart={handleGameStart}
                        onGameOver={handleGameOver}
                    />
                </div>
            )}

            {gameOver && (
                <div className="w-full max-w-3xl p-6 rounded-lg">
                    <Results correctChars={correctChars} incorrectChars={incorrectChars} />
                </div>
            )}
        </div>
    );
}

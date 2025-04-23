'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NatsConnection, StringCodec } from 'nats.ws';

interface TypingAreaProps {
    natsConnection: NatsConnection | null;
    initialQuote: string;
    timerDuration: number;
}

function TypingArea({ natsConnection, initialQuote, timerDuration }: TypingAreaProps) {
    const [typedCharacters, setTypedCharacters] = useState('');
    const [correctChars, setCorrectChars] = useState(0);
    const [incorrectChars, setIncorrectChars] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [fullQuote, setFullQuote] = useState(initialQuote);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wordsToPrefetch, setWordsToPrefetch] = useState(10);
    const [timeLeft, setTimeLeft] = useState(timerDuration);
    const [gameOver, setGameOver] = useState(false);

    const sc = StringCodec();

    useEffect(() => {
        setTypedCharacters('');
        setCorrectChars(0);
        setIncorrectChars(0);
        setStartTime(null);
        setFullQuote(initialQuote);
        setTimeLeft(timerDuration);
        setGameOver(false);
    }, [timerDuration, initialQuote]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;

        if (startTime !== null && timeLeft > 0 && !gameOver) {
            intervalId = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);
        }

        if (timeLeft === 0 && !gameOver) {
            setGameOver(true);
            console.log("Game Over! Time's up!");
        }

        return () => clearInterval(intervalId);
    }, [startTime, timeLeft, gameOver]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (gameOver) return;

            if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta') {
                return;
            }

            if (event.key === 'Backspace') {
                setTypedCharacters((prev) => prev.slice(0, -1));
            } else {
                setTypedCharacters((prev) => prev + event.key);
            }

            if (startTime === null) {
                setStartTime(Date.now());
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [startTime, gameOver]);

    useEffect(() => {
        let correct = 0;
        let incorrect = 0;

        for (let i = 0; i < Math.min(typedCharacters.length, fullQuote.length); i++) {
            if (typedCharacters[i] === fullQuote[i]) {
                correct++;
            } else {
                incorrect++;
            }
        }

        setCorrectChars(correct);
        setIncorrectChars(incorrect);

        const remainingChars = fullQuote.length - typedCharacters.length;
        if (remainingChars < 20 && !gameOver) {
            const fetchMoreWords = async () => {
                setIsLoading(true);
                setError(null);

                try {
                    if (!natsConnection) {
                        throw new Error("NATS connection is not available.");
                    }

                    const request = { wordCount: wordsToPrefetch };
                    const msg = await natsConnection.request("quote.next", sc.encode(JSON.stringify(request)), { timeout: 5000 });
                    const quoteData = JSON.parse(sc.decode(msg.data));
                    setFullQuote((prevQuote) => prevQuote + " " + quoteData.text); // Append new words
                    setIsLoading(false);
                } catch (e: any) {
                    setError(`Failed to fetch next words from NATS: ${e.message}`);
                    setIsLoading(false);
                    console.error("Error fetching next words from NATS:", e);
                }
            };
            fetchMoreWords();
        }

        if (timeLeft === 0 && !gameOver) {
            setGameOver(true);
            console.log("Game Over! Time's up!");
        }

    }, [typedCharacters, fullQuote, natsConnection, timeLeft, gameOver]);

    return (
        <div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div className="text-lg">
                {fullQuote.split('').map((char, index) => {
                    let className = '';
                    if (index < typedCharacters.length) {
                        if (typedCharacters[index] === char) {
                            className = 'text-green-500';
                        } else {
                            className = 'text-red-500';
                        }
                    }
                    return (
                        <span key={index} className={className}>
                            {char}
                        </span>
                    );
                })}
            </div>
            <p>Time Left: {timeLeft}</p>
            <p>Correct Characters: {correctChars}</p>
            <p>Incorrect Characters: {incorrectChars}</p>
            {isLoading && <p>Loading...</p>}
            {gameOver && <p>Game Over!</p>}
        </div>
    );
}

export default TypingArea;

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { NatsConnection, StringCodec } from 'nats.ws';
import Timer from './Timer';

interface TypingAreaProps {
    natsConnection: NatsConnection | null;
    initialQuote: string;
    timerDuration: number;
    onGameStart: () => void;
    onGameOver: (correctChars: number, incorrectChars: number) => void;
}

function TypingArea({ natsConnection, initialQuote, timerDuration, onGameStart, onGameOver }: TypingAreaProps) {
    const [typedCharacters, setTypedCharacters] = useState('');
    const [correctChars, setCorrectChars] = useState(0);
    const [incorrectChars, setIncorrectChars] = useState(0);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [fullQuote, setFullQuote] = useState(initialQuote);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [wordsToPrefetch, setWordsToPrefetch] = useState(10);
    const [gameStarted, setGameStarted] = useState(false);

    const sc = StringCodec();

    useEffect(() => {
        setTypedCharacters('');
        setCorrectChars(0);
        setIncorrectChars(0);
        setStartTime(null);
        setFullQuote(initialQuote);
        setGameStarted(false);
    }, [timerDuration, initialQuote]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt' || event.key === 'Meta') return;

            if (event.key === ' ') {
                // Check if the current character in the quote is a space
                if (typedCharacters.length < fullQuote.length && fullQuote[typedCharacters.length] !== ' ') {
                    event.preventDefault(); // Prevent adding the space
                    return;
                }
            } else {
                // If the current character is a space, prevent any non-space character from being typed
                 if (typedCharacters.length < fullQuote.length && fullQuote[typedCharacters.length] === ' ') {
                    event.preventDefault();
                    return;
                }
            }

            if (event.key === 'Backspace') {
                setTypedCharacters((prev) => prev.slice(0, -1));
            } else {
                setTypedCharacters((prev) => prev + event.key);
            }

            if (startTime === null) {
                setStartTime(Date.now());
                onGameStart();
                setGameStarted(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [startTime, onGameStart, fullQuote, typedCharacters.length]);

    useEffect(() => {
        let correct = 0;
        let incorrect = 0;

        for (let i = 0; i < Math.min(typedCharacters.length, fullQuote.length); i++) {
            if (fullQuote[i] === ' ') continue; // Skip spaces in the quote

            if (typedCharacters[i] === fullQuote[i]) {
                correct++;
            } else {
                incorrect++;
            }
        }

        setCorrectChars(correct);
        setIncorrectChars(incorrect);

        const remainingChars = fullQuote.length - typedCharacters.length;
        if (remainingChars < 20 && gameStarted) {
            const fetchMoreWords = async () => {
                setIsLoading(true);
                setError(null);

                try {
                    if (!natsConnection) throw new Error("NATS connection is not available.");

                    const request = { wordCount: wordsToPrefetch };
                    const msg = await natsConnection.request("quote.next", sc.encode(JSON.stringify(request)), { timeout: 5000 });
                    const quoteData = JSON.parse(sc.decode(msg.data));
                    setFullQuote((prevQuote) => prevQuote + " " + quoteData.text);
                    setIsLoading(false);
                } catch (e: any) {
                    setError(`Failed to fetch next words from NATS: ${e.message}`);
                    setIsLoading(false);
                    console.error("Error fetching next words from NATS:", e);
                }
            };
            fetchMoreWords();
        }

    }, [typedCharacters, fullQuote, natsConnection, gameStarted]);

    return (
        <div>
            {error && <p className="text-red-500">{error}</p>}
            <p className="text-gray-700 text-4xl">
                <Timer duration={timerDuration} isRunning={gameStarted} onExpire={() => onGameOver(correctChars, incorrectChars)} />s
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

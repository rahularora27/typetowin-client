'use client';

import Quote from "@/components/Quote";
import TypingArea from "@/components/TypingArea";
import { connect, NatsConnection } from "nats.ws";
import { useEffect, useState, useCallback } from "react";

export default function SinglePlayerGame() {
    const [nats, setNats] = useState<NatsConnection | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [quote, setQuote] = useState<string>('');
    const [timerDuration, setTimerDuration] = useState(30);

    const connectToNats = useCallback(async () => {
        let nc: NatsConnection | undefined;
        try {
            nc = await connect({
                servers: ["ws://0.0.0.0:8080"],
            });
            setNats(nc);
            console.log("connected to NATS");
            setError(null);
        } catch (e: any) {
            console.error("Failed to connect to NATS:", e);
            setError(`Failed to connect to NATS: ${e.message}`);
        }
    }, []);

    useEffect(() => {
        connectToNats();

        return () => {
            if (nats) {
                nats.drain();
                console.log("closed NATS connection");
            }
        };
    }, [connectToNats]);

    const handleQuoteReceived = (newQuote: string) => {
        setQuote(newQuote);
    };

    const handleTimerSelect = (duration: number) => {
        setTimerDuration(duration);
    };

    return (
        <>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
                <button onClick={() => handleTimerSelect(15)}>15s</button>
                <button onClick={() => handleTimerSelect(30)}>30s</button>
                <button onClick={() => handleTimerSelect(60)}>60s</button>
            </div>
            <Quote natsConnection={nats} onQuoteReceived={handleQuoteReceived} />
            {quote && <TypingArea natsConnection={nats} initialQuote={quote} timerDuration={timerDuration} />}
        </>
    );
}

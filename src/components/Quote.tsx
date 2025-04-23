'use client';

import React, { useState } from 'react';
import { StringCodec, NatsConnection } from 'nats.ws';

interface QuoteProps {
    natsConnection: NatsConnection | null;
    onQuoteReceived: (quote: string) => void;
}

function Quote({ natsConnection, onQuoteReceived }: QuoteProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const sc = StringCodec();

    const fetchQuote = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (!natsConnection) {
                throw new Error("NATS connection is not available.");
            }

            const msg = await natsConnection.request("quote.request", sc.encode(""), { timeout: 5000 });
            const quoteData = JSON.parse(sc.decode(msg.data));
            onQuoteReceived(quoteData.text);
            setIsLoading(false);
        } catch (e: any) {
            setError(`Failed to fetch initial quote from NATS: ${e.message}`);
            setIsLoading(false);
            console.error("Error fetching initial quote from NATS:", e);
        }
    };

    return (
        <div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <button onClick={fetchQuote} disabled={isLoading}>
                {isLoading ? "Get Quote" : "Get Quote"}
            </button>
        </div>
    );
}

export default Quote;

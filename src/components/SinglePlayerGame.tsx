'use client';

import React, { useState, useEffect } from 'react';
import { connect, StringCodec, NatsConnection } from 'nats.ws';

interface Quote {
  text: string;
  author: string;
}

function SinglePlayerGame() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [natsConnection, setNatsConnection] = useState<NatsConnection | null>(null);

  const connectToNats = async (): Promise<NatsConnection> => {
    try {
      const nc = await connect({
        servers: ["ws://0.0.0.0:8080"], // Or your NATS server
      });
      console.log(`Connected to NATS at ${nc.getServer()}`);
      setNatsConnection(nc);
      return nc;
    } catch (e: any) {
      console.error("Failed to connect to NATS:", e);
      setError(`Failed to connect to NATS: ${e.message}`);
      throw e; // Re-throw to be caught in startGame
    }
  };

  const fetchQuote = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nc = await connectToNats();
      const sc = StringCodec();

      // Request a quote
      const msg = await nc.request("quote.request", sc.encode("getQuote"), { timeout: 5000 }); // Add timeout
      const quoteData: Quote = JSON.parse(sc.decode(msg.data));

      setQuote(quoteData);
      setIsLoading(false);
      setError(null);

    } catch (e: any) {
      setError(`Failed to fetch quote from NATS: ${e.message}`);
      setIsLoading(false);
      console.error("Error fetching quote from NATS:", e);
    }
  };

  useEffect(() => {
    // Cleanup function to close the NATS connection when the component unmounts
    return () => {
      if (natsConnection) {
        natsConnection.close();
        console.log("NATS connection closed");
      }
    };
  }, [natsConnection]);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {quote === null ? (
        <button onClick={fetchQuote} disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Quote"}
        </button>
      ) : (
        <>
          <p>{quote.text}</p>
        </>
      )}
    </div>
  );
}

export default SinglePlayerGame;

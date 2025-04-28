// context/NatsContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { connect, NatsConnection } from "nats.ws";

interface NatsContextType {
  nats: NatsConnection | null;
  error: string | null;
  reconnect: () => void;
}

const NatsContext = createContext<NatsContextType>({
  nats: null,
  error: null,
  reconnect: () => {},
});

export const NatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nats, setNats] = useState<NatsConnection | null>(null);
  const [error, setError] = useState<string | null>(null);

  const connectToNats = useCallback(async () => {
    try {
      const nc = await connect({ servers: ["ws://0.0.0.0:8080"] });
      setNats(nc);
      setError(null);
    } catch (e: any) {
      setError(`Failed to connect to NATS: ${e.message}`);
      setNats(null);
    }
  }, []);

  useEffect(() => {
    connectToNats();
    return () => {
      nats?.drain();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <NatsContext.Provider value={{ nats, error, reconnect: connectToNats }}>
      {children}
    </NatsContext.Provider>
  );
};

export const useNats = () => useContext(NatsContext);

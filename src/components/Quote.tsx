import React, { useEffect, useState } from 'react';
import { StringCodec } from 'nats.ws';
import { useNats } from '@/context/NatsContext';

const sc = StringCodec();

interface QuoteProps {
  onSessionReceived: (sessionId: string, quote: string) => void;
}

function Quote({ onSessionReceived }: QuoteProps) {
  const { nats } = useNats();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nats) return; // <-- Only run when nats is available

    const fetchSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const msg = await nats.request("game.session.create", sc.encode("{}"), { timeout: 5000 });
        const sessionData = JSON.parse(sc.decode(msg.data));
        onSessionReceived(sessionData.sessionId, sessionData.quote);
        setIsLoading(false);
      } catch (e: any) {
        setError(`Failed to fetch session from NATS: ${e.message}`);
        setIsLoading(false);
        console.error("Error fetching session from NATS:", e);
      }
    };
    fetchSession();
  }, [nats, onSessionReceived]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  return null;
}

export default Quote;

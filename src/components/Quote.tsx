import React, { useEffect, useState } from 'react';

interface QuoteProps {
  onSessionReceived: (sessionId: string, quote: string) => void;
}

function Quote({ onSessionReceived }: QuoteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Call your backend REST API to create a session and get a quote
        const res = await fetch('/api/game/session', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to fetch session from backend.');
        const sessionData = await res.json();
        onSessionReceived(sessionData.sessionId, sessionData.quote);
        setIsLoading(false);
      } catch (e: any) {
        setError(`Failed to fetch session: ${e.message}`);
        setIsLoading(false);
        console.error("Error fetching session:", e);
      }
    };
    fetchSession();
  }, [onSessionReceived]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  return null;
}

export default Quote;

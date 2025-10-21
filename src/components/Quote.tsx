import { useEffect, useState } from 'react';

interface QuoteProps {
  onSessionReceived: (sessionId: string, quote: string) => void;
  includePunctuation?: boolean;
  includeNumbers?: boolean;
}

function Quote({ onSessionReceived, includePunctuation = false, includeNumbers = false }: QuoteProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          punctuation: includePunctuation.toString(),
          numbers: includeNumbers.toString()
        });
        const res = await fetch(`/api/game/session?${params}`, { method: 'POST' });
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
  }, [onSessionReceived, includePunctuation, includeNumbers]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  return null;
}

export default Quote;

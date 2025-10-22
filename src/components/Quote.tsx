import { useEffect, useState } from 'react';

interface QuoteProps {
  onSessionReceived: (sessionId: string, quote: string) => void;
  includePunctuation?: boolean;
  includeNumbers?: boolean;
  gameMode?: 'timer' | 'words';
  wordCount?: number;
}

function Quote({ onSessionReceived, includePunctuation = false, includeNumbers = false, gameMode = 'timer', wordCount = 10 }: QuoteProps) {
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
        
        // In word mode: fetch exact count if ≤20, otherwise fetch 20 initially
        // In timer mode: always fetch 20
        if (gameMode === 'words') {
          const initialWordCount = wordCount <= 20 ? wordCount : 20;
          params.append('wordCount', initialWordCount.toString());
        } else {
          params.append('wordCount', '20');
        }
        
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
  }, [onSessionReceived, includePunctuation, includeNumbers, gameMode, wordCount]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  return null;
}

export default Quote;

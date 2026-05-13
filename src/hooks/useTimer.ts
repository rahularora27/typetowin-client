import { useState, useEffect, useRef } from 'react';

interface UseTimerOptions {
  duration: number;
  isRunning: boolean;
  onExpire: () => void;
  onTick?: (timeLeft: number) => void;
}

export function useTimer({ duration, isRunning, onExpire, onTick }: UseTimerOptions): number {
  const [timeLeft, setTimeLeft] = useState(duration);
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);

  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);
  useEffect(() => { onTickRef.current = onTick; }, [onTick]);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(duration);
      return;
    }
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, duration]);

  useEffect(() => {
    onTickRef.current?.(timeLeft);
  }, [timeLeft]);

  return timeLeft;
}

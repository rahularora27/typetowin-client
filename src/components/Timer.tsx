import { useState, useEffect, useRef } from 'react';

interface TimerProps {
    duration: number;
    isRunning: boolean;
    onExpire: () => void;
    onTick?: (timeLeft: number) => void;
}

function Timer({ duration, isRunning, onExpire, onTick }: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const onExpireRef = useRef(onExpire);
    const onTickRef = useRef(onTick);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

    useEffect(() => {
        onTickRef.current = onTick;
    }, [onTick]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        if (isRunning) {
            intervalId = setInterval(() => {
                setTimeLeft((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(intervalId!);
                        onExpireRef.current();
                        return 0;
                    } else {
                        return prevTime - 1;
                    }
                });
            }, 1000);
        } else {
            setTimeLeft(duration);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isRunning, duration]);

    useEffect(() => {
        if (onTickRef.current) {
            onTickRef.current(timeLeft);
        }
    }, [timeLeft]);

    return (
        <span>{timeLeft}</span>
    );
}

export default Timer;

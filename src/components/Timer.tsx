import React, { useState, useEffect, useRef } from 'react';

interface TimerProps {
    duration: number;
    isRunning: boolean;
    onExpire: () => void;
}

function Timer({ duration, isRunning, onExpire }: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(duration);
    const onExpireRef = useRef(onExpire);

    useEffect(() => {
        onExpireRef.current = onExpire;
    }, [onExpire]);

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

    return (
        <span>{timeLeft}</span>
    );
}

export default Timer;

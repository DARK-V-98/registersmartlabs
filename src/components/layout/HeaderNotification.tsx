'use client';

import { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';

const HeaderNotification = () => {
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 48, minutes: 0, seconds: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This effect runs only on the client
    setTargetDate(new Date().getTime() + 48 * 60 * 60 * 1000);
    setIsVisible(true);
  }, []);

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-2 text-center text-sm font-medium">
      <div className="container mx-auto px-4 flex items-center justify-center gap-2">
        <Megaphone className="w-4 h-4" />
        <span>Site upgrade in progress! New version will be live in approximately: </span>
        <span className="font-bold tabular-nums">
          {formatTime(timeLeft.hours)}h {formatTime(timeLeft.minutes)}m {formatTime(timeLeft.seconds)}s
        </span>
      </div>
    </div>
  );
};

export default HeaderNotification;

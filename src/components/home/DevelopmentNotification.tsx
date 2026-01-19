'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock } from 'lucide-react';

const DevelopmentNotification = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 48, minutes: 0, seconds: 0 });

  useEffect(() => {
    // This effect runs only on the client, preventing hydration mismatch.
    setIsOpen(true);
    setTargetDate(new Date().getTime() + 48 * 60 * 60 * 1000);
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
  
  if (!targetDate) {
    return null; // Don't render on the server or before client-side mount.
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Clock className="w-6 h-6 text-primary" />
            Site Upgrade in Progress
          </DialogTitle>
          <DialogDescription className="pt-2">
            Our website is currently undergoing a major upgrade. The new version will be live in approximately:
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center gap-2 sm:gap-4 my-4">
          <div className="text-center p-3 sm:p-4 bg-secondary rounded-lg flex-1">
            <p className="font-display text-3xl sm:text-4xl font-bold text-primary">{formatTime(timeLeft.hours)}</p>
            <p className="text-xs text-muted-foreground">Hours</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-secondary rounded-lg flex-1">
            <p className="font-display text-3xl sm:text-4xl font-bold text-primary">{formatTime(timeLeft.minutes)}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-secondary rounded-lg flex-1">
            <p className="font-display text-3xl sm:text-4xl font-bold text-primary">{formatTime(timeLeft.seconds)}</p>
            <p className="text-xs text-muted-foreground">Seconds</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
            In the meantime, you can visit our main site.
        </p>
        <div className="flex flex-col gap-3 pt-4">
            <a href="https://www.smartlabs.lk" target="_blank" rel="noopener noreferrer">
                <Button className="w-full btn-accent">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Main Site
                </Button>
            </a>
             <Button variant="outline" onClick={() => setIsOpen(false)}>
                Continue to Current Site
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevelopmentNotification;

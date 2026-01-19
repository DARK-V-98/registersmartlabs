'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Wrench } from 'lucide-react';

const DevelopmentNotification = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, preventing hydration mismatch.
    setIsOpen(true);
  }, []);

  if (!isOpen) {
    return null; // Don't render on the server or before client-side mount.
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-2xl">
            <Wrench className="w-6 h-6 text-primary" />
            Site Upgrade in Progress
          </DialogTitle>
          <DialogDescription className="pt-2">
            We're currently making things better and will be back shortly with an improved experience.
          </DialogDescription>
        </DialogHeader>
        <div className="my-6">
            <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                <div className="bg-gradient-to-r from-transparent via-primary to-transparent h-2.5 rounded-full w-full animate-shimmer bg-[length:200%_100%]"></div>
            </div>
            <p className="text-center text-sm text-primary font-medium mt-3">Upgrading...</p>
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

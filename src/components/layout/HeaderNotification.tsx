'use client';

import { useState, useEffect } from 'react';
import { Megaphone } from 'lucide-react';

const HeaderNotification = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // This effect runs only on the client to avoid hydration mismatch.
    setIsVisible(true);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground py-2 text-center text-sm font-medium overflow-hidden">
      <div className="container mx-auto px-4 flex items-center justify-center gap-2">
        <Megaphone className="w-4 h-4" />
        <span>Site upgrade in progress! We're making things better.</span>
        <div className="absolute inset-0 h-full w-full bg-white/10 animate-shimmer bg-[length:200%_100%] pointer-events-none" />
      </div>
    </div>
  );
};

export default HeaderNotification;

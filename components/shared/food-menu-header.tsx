'use client';

import { ChevronLeft, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NotificationIndicator } from '@/components/notifications/NotificationIndicator';
import { Button } from '@/components/ui/button';

interface FoodMenuHeaderProps {
  title?: string;
  location?: string;
  showBack?: boolean;
  tableNumber?: string;
  actions?: React.ReactNode;
}

export function FoodMenuHeader({
  title = "Menu",
  location,
  showBack = false,
  tableNumber = '1',
  actions
}: FoodMenuHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const displayLocation = location || `Table ${tableNumber}`;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-yellow-400 to-red-500 text-white sticky top-0 z-10 shadow-md">
      <div className="flex items-center gap-2">
        {showBack && (
          <Button 
            onClick={handleBack} 
            variant="ghost" 
            size="icon" 
            className="mr-1 text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <p className="text-sm text-white/70">Your Location</p>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            <p className="font-medium">{displayLocation}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <NotificationIndicator />
      </div>
    </div>
  );
}

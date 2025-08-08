"use client";

import { useState } from 'react';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { useLocationState } from '@/lib/hooks/useLocationState';
import { BookingForm } from '@/components/booking/BookingForm';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

// Only dynamically import heavy components that benefit from code splitting
const Toaster = dynamic(() => import('@/components/ui/toaster').then(mod => mod.Toaster), {
  ssr: false
});

// Extract BookingSuccess to a separate component for better maintainability
interface BookingSuccessProps {
  onReset: () => void;
}

function BookingSuccess({ onReset }: BookingSuccessProps) {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Booking Request Sent!</h2>
      <p className="text-muted-foreground mb-6">
        Thank you for your reservation request. We&apos;ll contact you shortly to confirm your booking.
      </p>
      <Button onClick={onReset} className="min-w-[160px]">
        Make Another Booking
      </Button>
    </div>
  );
}

// Location-specific content configuration
const LOCATION_CONFIG = {
  portland: {
    title: 'Portland Location',
    description: 'Reserve a table at our Portland location. Perfect for game days and special events.'
  },
  salem: {
    title: 'Salem Location', 
    description: 'Book your table at our Salem location. Great for family gatherings and watching sports.'
  }
} as const;

export default function BookingPage() {
  const { location } = useLocationState();
  const [submitted, setSubmitted] = useState(false);

  const handleSuccess = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSubmitted(false);
  };

  const locationConfig = LOCATION_CONFIG[location as keyof typeof LOCATION_CONFIG] || LOCATION_CONFIG.portland;

  return (
    <div className="container py-8">
      <header className="flex items-center mb-8 ml-16 sm:ml-20">
        <Calendar className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-3xl font-bold">Book a Table</h1>
      </header>
      
      <main className="max-w-3xl mx-auto">
        {submitted ? (
          <BookingSuccess onReset={handleReset} />
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-2">
                {locationConfig.title}
              </h2>
              <p className="text-muted-foreground">
                {locationConfig.description}
              </p>
            </section>
            
            <BookingForm
              location={location}
              onSuccessAction={handleSuccess}
            />
          </>
        )}
      </main>
      
      <Toaster />
    </div>
  );
}
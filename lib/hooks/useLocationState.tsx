// lib/hooks/useLocationState.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

// Type for location keys matching the database
export type LocationValue = 'salem' | 'portland';

interface LocationContextType {
  location: LocationValue;
  setLocation: (location: LocationValue) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Provider component
export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<LocationValue>('salem');
  const [mounted, setMounted] = useState(false);

  // Load location from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedLocation = localStorage.getItem('sidehustle-selected-location') as LocationValue;
      if (savedLocation && (savedLocation === 'salem' || savedLocation === 'portland')) {
        setLocationState(savedLocation);
      }
    }
  }, []);

  // Memoize setLocation to prevent unnecessary re-renders
  const setLocation = useCallback((newLocation: LocationValue) => {
    setLocationState(newLocation);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidehustle-selected-location', newLocation);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    location,
    setLocation
  }), [location, setLocation]);

  // Don't render children until we've loaded the location from localStorage
  if (!mounted) {
    return null;
  }

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

// Hook to use location state
export function useLocationState() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationState must be used within a LocationProvider');
  }
  return context;
}

// Utility function to get location details
export function getLocationDetails(location: LocationValue) {
  const locations = {
    salem: {
      name: 'Salem',
      address: '145 Liberty St NE Suite #101, Salem, OR 97301',
      coordinates: { lat: 44.9429, lng: -123.0351 },
      locationId: '50d17782-3f4a-43a1-b6b6-608171ca3c7c'
    },
    portland: {
      name: 'Portland',
      address: '327 SW Morrison St, Portland, OR 97204',
      coordinates: { lat: 45.5152, lng: -122.6784 },
      locationId: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
    }
  };
  
  return locations[location];
}
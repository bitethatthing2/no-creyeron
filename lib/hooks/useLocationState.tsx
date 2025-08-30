'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LocationType = 'portland' | 'salem';

interface LocationState {
  location: LocationType;
  setLocation: (location: LocationType) => void;
}

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationInternal] = useState<LocationType>('portland');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedLocation') as LocationType;
    if (saved && (saved === 'portland' || saved === 'salem')) {
      setLocationInternal(saved);
    }
  }, []);

  const setLocation = (newLocation: LocationType) => {
    setLocationInternal(newLocation);
    localStorage.setItem('selectedLocation', newLocation);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationState(): LocationState {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocationState must be used within a LocationProvider');
  }
  return context;
}
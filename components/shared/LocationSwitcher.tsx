// components/shared/LocationSwitcher.tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MapPin } from 'lucide-react';
import { useLocationState } from '@/lib/hooks/useLocationState';

// Export LocationKey type - matches what useLocationState expects
export type LocationKey = 'salem' | 'portland';

// Export Location interface
export interface Location {
  key: LocationKey;
  name: string;
  displayName: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  radius: number;
  locationId?: string; // Database ID from locations table
}

// Export LOCATIONS constant with data matching your database
export const LOCATIONS: Location[] = [
  { 
    key: 'salem',
    name: 'Salem',
    displayName: 'Salem',
    address: '145 Liberty St NE Suite #101, Salem, OR 97301',
    coordinates: { lat: 44.9429, lng: -123.0351 },
    radius: 500,
    locationId: '50d17782-3f4a-43a1-b6b6-608171ca3c7c'
  },
  { 
    key: 'portland',
    name: 'Portland',
    displayName: 'Portland',
    address: '327 SW Morrison St, Portland, OR 97204',
    coordinates: { lat: 45.5152, lng: -122.6784 },
    radius: 500,
    locationId: 'ec1e8869-454a-49d2-93e5-ed05f49bb932'
  }
] as const;

// Props interface for LocationSwitcher
interface LocationSwitcherProps {
  onLocationChange?: (location: Location) => void;
  className?: string;
}

// Export LocationSwitcher component
export function LocationSwitcher({ onLocationChange, className = '' }: LocationSwitcherProps) {
  const { location, setLocation } = useLocationState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled className={`gap-2 ${className}`}>
        <MapPin className="h-4 w-4" />
        <span>Loading...</span>
      </Button>
    );
  }

  // Find current location by matching the location state value
  // The location from useLocationState is just "salem" or "portland"
  const currentLocation = LOCATIONS.find(loc => loc.key === location) || LOCATIONS[0];

  const handleLocationSelect = (selectedLocation: Location) => {
    // Set location using just the key (salem or portland)
    setLocation(selectedLocation.key);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidehustle-selected-location', selectedLocation.key);
    }
    
    // Call the callback if provided
    if (onLocationChange) {
      onLocationChange(selectedLocation);
    }
  };

  return (
    <div className={`inline-flex items-center bg-black/20 backdrop-blur-sm border border-white/30 rounded-full p-1 ${className}`}>
      <button
        onClick={() => handleLocationSelect(LOCATIONS[0])}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          currentLocation.key === 'salem' 
            ? 'bg-white text-black shadow-sm font-bold' 
            : 'text-white hover:text-gray-300 hover:bg-white/10'
        }`}
      >
        Salem
      </button>
      <button
        onClick={() => handleLocationSelect(LOCATIONS[1])}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          currentLocation.key === 'portland' 
            ? 'bg-white text-black shadow-sm font-bold' 
            : 'text-white hover:text-gray-300 hover:bg-white/10'
        }`}
      >
        Portland
      </button>
    </div>
  );
}

// Export a simplified version for components that don't need the dropdown
export function LocationDisplay() {
  const { location } = useLocationState();
  const currentLocation = LOCATIONS.find(loc => loc.key === location) || LOCATIONS[0];
  
  return (
    <div className="flex items-center gap-2 text-sm text-foreground/80">
      <MapPin className="h-4 w-4 text-foreground/80" />
      <span>{currentLocation.displayName}</span>
    </div>
  );
}

// Default export for backward compatibility
export default LocationSwitcher;
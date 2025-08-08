import { useState, useCallback } from 'react';

interface UseLocationAccess {
  requestAccess: () => Promise<boolean>;
  isLoading: boolean;
  error?: string;
}

export function useLocationAccess(): UseLocationAccess {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const requestAccess = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(undefined);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Get user's current position
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Define establishment location (you can update these coordinates)
      const ESTABLISHMENT_LAT = 37.7749; // Example: San Francisco
      const ESTABLISHMENT_LNG = -122.4194;
      const MAX_DISTANCE_METERS = 100; // 100 meter radius

      // Calculate distance using Haversine formula
      const distance = calculateDistance(
        latitude,
        longitude,
        ESTABLISHMENT_LAT,
        ESTABLISHMENT_LNG
      );

      if (distance <= MAX_DISTANCE_METERS) {
        // User is within range, store verification
        localStorage.setItem('location_verified', 'true');
        localStorage.setItem('location_verified_at', Date.now().toString());
        return true;
      } else {
        throw new Error(`You must be within ${MAX_DISTANCE_METERS}m of the establishment to place orders. Current distance: ${Math.round(distance)}m`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Location access failed';
      setError(errorMessage);
      console.error('Location access error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    requestAccess,
    isLoading,
    error,
  };
}

// Helper function to calculate distance between two coordinates
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

import { useGeolocation, useLocalStorage } from 'usehooks-ts';

// Enhanced version using usehooks-ts
export function useAppGeolocation() {
  const location = useGeolocation();
  const [savedLocation, setSavedLocation] = useLocalStorage('userLocation', null);
  
  return {
    ...location,
    // Add our app-specific functionality
    coordinates: location.latitude && location.longitude ? {
      lat: location.latitude,
      lng: location.longitude
    } : null,
    savedLocation,
    saveCurrentLocation: () => {
      if (location.latitude && location.longitude) {
        setSavedLocation({
          lat: location.latitude,
          lng: location.longitude,
          timestamp: Date.now()
        });
      }
    },
    clearSavedLocation: () => setSavedLocation(null)
  };
}
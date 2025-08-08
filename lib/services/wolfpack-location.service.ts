import { supabase } from '@/lib/supabase';

// Centralized location configuration - from scattered definitions
export const SIDE_HUSTLE_LOCATIONS = {
  salem: {
    id: '50d17782-3f4a-43a1-b6b6-608171ca3c7c',
    name: 'Salem',
    lat: 44.94049607107024, // Exact coordinates from Google Maps
    lng: -123.0413951237716,
    address: '1849 Lancaster Dr NE, Salem, OR 97305',
    radius: 100 // meters
  },
  portland: {
    id: 'ec1e8869-454a-49d2-93e5-ed05f49bb932',
    name: 'Portland', 
    lat: 45.51853717107486, // Exact coordinates from Google Maps
    lng: -122.67878942374,
    address: '318 NW 11th Ave, Portland, OR 97209',
    radius: 100 // meters
  }
} as const;

export type LocationKey = keyof typeof SIDE_HUSTLE_LOCATIONS;

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationVerificationResult {
  isAtLocation: boolean;
  nearestLocation: LocationKey | null;
  distance: number;
  locationId: string | null;
  locationName: string | null;
  error?: string;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export class WolfpackLocationService {
  /**
   * Calculate distance between two points using Haversine formula
   * Consolidated from multiple implementations
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Get user's current position with enhanced error handling
   */
  static async getCurrentPosition(
    options: GeolocationOptions = {}
  ): Promise<Coordinates> {
    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          let errorMessage = 'Location access failed';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          
          reject(new Error(errorMessage));
        },
        defaultOptions
      );
    });
  }

  /**
   * Find nearest Side Hustle Bar location
   */
  static findNearestLocation(userCoords: Coordinates): {
    location: LocationKey | null;
    distance: number;
    locationData: typeof SIDE_HUSTLE_LOCATIONS[LocationKey] | null;
  } {
    let nearestLocation: LocationKey | null = null;
    let minDistance = Infinity;
    let nearestLocationData = null;

    for (const [key, location] of Object.entries(SIDE_HUSTLE_LOCATIONS)) {
      const distance = this.calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        location.lat,
        location.lng
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestLocation = key as LocationKey;
        nearestLocationData = location;
      }
    }

    return {
      location: nearestLocation,
      distance: minDistance,
      locationData: nearestLocationData
    };
  }

  /**
   * Verify if user is at a Side Hustle Bar location
   */
  static async verifyUserLocation(): Promise<LocationVerificationResult> {
    try {
      const userCoords = await this.getCurrentPosition();
      const nearest = this.findNearestLocation(userCoords);

      if (!nearest.location || !nearest.locationData) {
        return {
          isAtLocation: false,
          nearestLocation: null,
          distance: nearest.distance,
          locationId: null,
          locationName: null,
          error: 'No Side Hustle Bar locations found nearby'
        };
      }

      const isWithinRadius = nearest.distance <= nearest.locationData.radius;

      return {
        isAtLocation: isWithinRadius,
        nearestLocation: nearest.location,
        distance: nearest.distance,
        locationId: isWithinRadius ? nearest.locationData.id : null,
        locationName: isWithinRadius ? nearest.locationData.name : null
      };
    } catch (error) {
      console.error('Location verification failed:', error);
      return {
        isAtLocation: false,
        nearestLocation: null,
        distance: 0,
        locationId: null,
        locationName: null,
        error: error instanceof Error ? error.message : 'Location verification failed'
      };
    }
  }

  /**
   * Get location by ID from database
   */
  static async getLocationById(locationId: string) {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', locationId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching location:', error);
      return null;
    }
  }

  /**
   * Get all available locations
   */
  static async getAllLocations() {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  }

  /**
   * Check if coordinates are within a specific location's radius
   */
  static isWithinLocation(
    userCoords: Coordinates,
    locationKey: LocationKey
  ): boolean {
    const location = SIDE_HUSTLE_LOCATIONS[locationKey];
    const distance = this.calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      location.lat,
      location.lng
    );
    return distance <= location.radius;
  }

  /**
   * Get location key by ID
   */
  static getLocationKeyById(locationId: string): LocationKey | null {
    for (const [key, location] of Object.entries(SIDE_HUSTLE_LOCATIONS)) {
      if (location.id === locationId) {
        return key as LocationKey;
      }
    }
    return null;
  }

  /**
   * Get location data by key
   */
  static getLocationData(locationKey: LocationKey) {
    return SIDE_HUSTLE_LOCATIONS[locationKey];
  }

  /**
   * Format distance for display
   */
  static formatDistance(distanceInMeters: number): string {
    if (distanceInMeters < 1000) {
      return `${Math.round(distanceInMeters)}m`;
    } else {
      return `${(distanceInMeters / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Check if location services are available
   */
  static isGeolocationAvailable(): boolean {
    return 'geolocation' in navigator;
  }

  /**
   * Request location permission
   */
  static async requestLocationPermission(): Promise<PermissionState> {
    if (!('permissions' in navigator)) {
      throw new Error('Permissions API not available');
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch (error) {
      console.error('Error checking location permission:', error);
      throw error;
    }
  }

  // Location switching functionality
  private static selectedLocation: LocationKey = 'salem';
  private static readonly STORAGE_KEY = 'sidehustle-selected-location';

  /**
   * Set the selected location (used by location switcher)
   */
  static setSelectedLocation(locationKey: LocationKey): void {
    this.selectedLocation = locationKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, locationKey);
    }
  }

  /**
   * Get the currently selected location
   */
  static getSelectedLocation(): LocationKey {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY) as LocationKey;
      if (saved && saved in SIDE_HUSTLE_LOCATIONS) {
        this.selectedLocation = saved;
        return saved;
      }
    }
    return this.selectedLocation;
  }

  /**
   * Get the selected location data
   */
  static getSelectedLocationData() {
    return SIDE_HUSTLE_LOCATIONS[this.getSelectedLocation()];
  }

  /**
   * Verify user is at the selected location (fallback to nearest if not selected)
   */
  static async verifyAtSelectedLocation(): Promise<LocationVerificationResult & { selectedLocation: LocationKey }> {
    const selectedKey = this.getSelectedLocation();
    const selectedData = SIDE_HUSTLE_LOCATIONS[selectedKey];
    
    try {
      const userCoords = await this.getCurrentPosition();
      const distance = this.calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        selectedData.lat,
        selectedData.lng
      );
      
      const isAtLocation = distance <= selectedData.radius;
      
      return {
        isAtLocation,
        nearestLocation: selectedKey,
        distance,
        locationId: isAtLocation ? selectedData.id : null,
        locationName: isAtLocation ? selectedData.name : null,
        selectedLocation: selectedKey
      };
    } catch {
      // Fall back to regular verification if GPS fails
      const fallbackResult = await this.verifyUserLocation();
      return {
        ...fallbackResult,
        selectedLocation: selectedKey
      };
    }
  }

  /**
   * Get all locations for UI components
   */
  static getAllLocationData() {
    return Object.entries(SIDE_HUSTLE_LOCATIONS).map(([key, data]) => ({
      key: key as LocationKey,
      ...data
    }));
  }
}
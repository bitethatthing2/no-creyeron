'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationSwitcher, LOCATIONS, type LocationKey } from './LocationSwitcher';


interface DynamicGoogleMapsProps {
  className?: string;
  showLocationSwitcher?: boolean;
  height?: string;
}

export function DynamicGoogleMaps({ 
  className = '', 
  showLocationSwitcher = true,
  height = '400px'
}: DynamicGoogleMapsProps) {
  const [selectedLocationKey, setSelectedLocationKey] = useState<LocationKey>('salem');
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedLocationKey = localStorage.getItem('sidehustle-selected-location') as LocationKey;
      if (savedLocationKey && LOCATIONS.find(loc => loc.key === savedLocationKey)) {
        setSelectedLocationKey(savedLocationKey);
      }
    }
  }, []);

  const selectedLocation = LOCATIONS.find(loc => loc.key === selectedLocationKey) || LOCATIONS[0];

  // Generate Google Maps embed URL (no API key needed for iframe embeds)
  const generateMapEmbedUrl = (location: typeof selectedLocation) => {
    const query = encodeURIComponent(location.address);
    // Using the free iframe embed that doesn't require API key
    return `https://maps.google.com/maps?q=${query}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  // Generate directions URL
  const generateDirectionsUrl = (location: typeof selectedLocation) => {
    const query = encodeURIComponent(location.address);
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
  };

  // Handle location change from LocationSwitcher
  const handleLocationChange = (location: typeof selectedLocation) => {
    setSelectedLocationKey(location.key);
  };

  if (!mounted) {
    return (
      <div className={`animate-pulse bg-muted rounded-lg ${className}`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <MapPin className="h-8 w-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {selectedLocation.name} Location
            </CardTitle>
            <CardDescription>
              {selectedLocation.address}
            </CardDescription>
          </div>
          {showLocationSwitcher && (
            <LocationSwitcher 
              onLocationChange={handleLocationChange}
              className="ml-4"
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Google Maps Embed */}
        <div className="relative rounded-lg overflow-hidden border-2 border-primary bg-muted">
          <iframe
            width="100%"
            height={height}
            style={{ border: 0 }}
            src={generateMapEmbedUrl(selectedLocation)}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${selectedLocation.name} Location Map`}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1"
            onClick={() => window.open(generateDirectionsUrl(selectedLocation), '_blank')}
          >
            <Navigation className="mr-2 h-4 w-4" />
            Get Directions
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline"
            className="flex-1"
            onClick={() => window.open(`tel:${selectedLocation.key === 'salem' ? '5035550123' : '5035550456'}`, '_blank')}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Call Location
          </Button>
        </div>

        {/* Location Details */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <h4 className="font-medium text-sm mb-1">Address</h4>
            <p className="text-sm text-muted-foreground">{selectedLocation.address}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-1">Distance</h4>
            <p className="text-sm text-muted-foreground">
              Within {selectedLocation.radius}m radius
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
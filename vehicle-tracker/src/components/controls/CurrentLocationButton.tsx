import React from 'react';
import { MapPin, Loader, MapPinOff } from 'lucide-react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useAppStore } from '../../store';

export const CurrentLocationButton: React.FC = () => {
  const { position, error, isLoading, isWatching, startWatching, stopWatching } = useCurrentLocation();
  const { selectedMachineId, getLatestDataPoint, mapInstance } = useAppStore();

  const handleClick = () => {
    if (isWatching) {
      // Stop watching if currently watching
      stopWatching();
    } else {
      // Start watching
      startWatching();
    }
  };


  const fitBoundsToIncludeCurrentLocation = React.useCallback(() => {
    if (!mapInstance || !position) return;

    const bounds = new google.maps.LatLngBounds();
    
    // Add current location
    bounds.extend({
      lat: position.latitude,
      lng: position.longitude,
    });

    // Add selected machine's latest position if available
    if (selectedMachineId) {
      const latestPoint = getLatestDataPoint(selectedMachineId);
      if (latestPoint) {
        bounds.extend({
          lat: latestPoint.latitude,
          lng: latestPoint.longitude,
        });
      }
    }

    // Fit bounds with padding
    mapInstance.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });
  }, [mapInstance, position, selectedMachineId, getLatestDataPoint]);

  // Fit bounds when position changes
  React.useEffect(() => {
    if (position && isWatching) {
      fitBoundsToIncludeCurrentLocation();
    }
  }, [position, isWatching, fitBoundsToIncludeCurrentLocation]);

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={error || (isWatching ? "Stop tracking location" : "Start tracking location")}
      >
        {isLoading ? (
          <Loader className="w-5 h-5 animate-spin text-light-muted dark:text-dark-muted" />
        ) : isWatching ? (
          <MapPinOff className="w-5 h-5 text-light-accent dark:text-dark-accent" />
        ) : (
          <MapPin className="w-5 h-5 text-light-muted dark:text-dark-muted" />
        )}
      </button>
      
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};
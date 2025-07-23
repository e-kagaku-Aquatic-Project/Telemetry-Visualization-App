import React from 'react';
import { MapPin, Loader } from 'lucide-react';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useAppStore } from '../../store';

export const CurrentLocationButton: React.FC = () => {
  const { position, error, isLoading, getCurrentPosition } = useCurrentLocation();
  const { setMapCenter, setMapZoom } = useAppStore();

  const handleClick = () => {
    if (position) {
      // If we already have position, center on it
      setMapCenter({
        lat: position.latitude,
        lng: position.longitude,
      });
      setMapZoom(16);
    } else {
      // Otherwise, get current position
      getCurrentPosition();
    }
  };

  // Center on position when it's obtained
  React.useEffect(() => {
    if (position) {
      setMapCenter({
        lat: position.latitude,
        lng: position.longitude,
      });
      setMapZoom(16);
    }
  }, [position, setMapCenter, setMapZoom]);

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={error || "Show current location"}
      >
        {isLoading ? (
          <Loader className="w-5 h-5 animate-spin text-light-muted dark:text-dark-muted" />
        ) : (
          <MapPin 
            className={`w-5 h-5 ${
              position 
                ? 'text-light-accent dark:text-dark-accent' 
                : 'text-light-muted dark:text-dark-muted'
            }`} 
          />
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
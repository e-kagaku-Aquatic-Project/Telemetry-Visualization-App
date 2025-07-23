import React from 'react';
import { Marker, Circle } from '@react-google-maps/api';

interface CurrentLocationMarkerProps {
  position: {
    lat: number;
    lng: number;
  };
  accuracy?: number;
}

export const CurrentLocationMarker: React.FC<CurrentLocationMarkerProps> = ({ 
  position,
  accuracy 
}) => {
  // Create custom icon URL for current location
  const currentLocationIcon = {
    url: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="white"/>
      </svg>
    `),
    scaledSize: new google.maps.Size(24, 24),
    anchor: new google.maps.Point(12, 12),
  };

  return (
    <>
      <Marker
        position={position}
        icon={currentLocationIcon}
        title={accuracy ? `Current Location (±${Math.round(accuracy)}m)` : 'Current Location'}
        zIndex={1000}
      />
      {accuracy && accuracy > 0 && (
        <Circle
          center={position}
          radius={accuracy}
          options={{
            fillColor: '#4285F4',
            fillOpacity: 0.15,
            strokeColor: '#4285F4',
            strokeOpacity: 0.3,
            strokeWeight: 1,
            clickable: false,
            zIndex: 999,
          }}
        />
      )}
    </>
  );
};
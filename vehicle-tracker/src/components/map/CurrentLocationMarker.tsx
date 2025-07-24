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
  console.log('CurrentLocationMarker rendered with:', { position, accuracy });

  return (
    <>
      <Marker
        position={position}
        options={{
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 1000,
        }}
        title={accuracy ? `Current Location (±${Math.round(accuracy)}m)` : 'Current Location'}
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
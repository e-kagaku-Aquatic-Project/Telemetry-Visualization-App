import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useAppStore } from '../store';
import { DEFAULT_MAP_OPTIONS, DEFAULT_CENTER } from '../constants/map';
import { VehicleMarker } from './VehicleMarker';
import { WaypointMarker } from './WaypointMarker';
import { GradientTrackPolyline } from './GradientTrackPolyline';
import { GradientLegend } from './GradientLegend';

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = [];

export const MapContainer: React.FC = () => {
  const { 
    selectedVehicleId, 
    vehicleTracks, 
    mapCenter, 
    mapZoom, 
    getLatestDataPoint,
    viewMode,
    gradientVisualization,
  } = useAppStore();

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GMAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });


  // Auto-center logic based on view mode
  useEffect(() => {
    if (!map) return;

    if (viewMode === 'all') {
      // Fit bounds to show all vehicles
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;

      Object.values(vehicleTracks).forEach(track => {
        if (track.length > 0) {
          const latestPoint = track[track.length - 1];
          bounds.extend({
            lat: latestPoint.latitude,
            lng: latestPoint.longitude,
          });
          hasPoints = true;
        }
      });

      if (hasPoints) {
        map.fitBounds(bounds);
        // Add padding to ensure markers are not at the edge
        const padding = { top: 50, right: 50, bottom: 50, left: 50 };
        map.fitBounds(bounds, padding);
      }
    } else if (viewMode === 'individual' && selectedVehicleId) {
      // Center on selected vehicle's latest position
      const latestPoint = getLatestDataPoint(selectedVehicleId);
      if (latestPoint) {
        const center = {
          lat: latestPoint.latitude,
          lng: latestPoint.longitude,
        };
        map.panTo(center);
      }
    }
  }, [viewMode, selectedVehicleId, vehicleTracks, map, getLatestDataPoint]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);



  if (loadError) {
    return (
      <div className="card p-8 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load Google Maps</div>
          <div className="text-dark-muted text-sm">
            Please check your API key configuration
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="card p-8 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-dark-accent border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-dark-muted">Loading map...</div>
        </div>
      </div>
    );
  }

  const currentCenter = mapCenter || DEFAULT_CENTER;

  return (
    <div className="card overflow-hidden w-full h-full relative">
      <GoogleMap
        key={viewMode} // Force remount when viewMode changes
        mapContainerStyle={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
        center={currentCenter}
        zoom={mapZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={DEFAULT_MAP_OPTIONS}
      >
        {/* Render polylines based on view mode */}
        {viewMode === 'individual' && selectedVehicleId && vehicleTracks[selectedVehicleId] && (
          <GradientTrackPolyline
            key={selectedVehicleId}
            vehicleId={selectedVehicleId}
            data={vehicleTracks[selectedVehicleId]}
            isSelected={true}
            gradientParameter={gradientVisualization.isEnabled ? gradientVisualization.selectedParameter : null}
          />
        )}

        {/* Render markers for latest positions only */}
        {Object.entries(vehicleTracks).map(([vehicleId, data]) => {
          const latestPoint = data[data.length - 1];
          if (!latestPoint) return null;
          
          return (
            <VehicleMarker
              key={vehicleId}
              vehicleId={vehicleId}
              dataPoint={latestPoint}
              isSelected={vehicleId === selectedVehicleId}
            />
          );
        })}

        {/* Render additional waypoint markers for selected vehicle only (in individual mode) */}
        {viewMode === 'individual' && selectedVehicleId && vehicleTracks[selectedVehicleId] && (
          vehicleTracks[selectedVehicleId]
            .slice(0, -1) // Exclude latest point (already shown by VehicleMarker)
            .map((dataPoint, index) => (
              <WaypointMarker
                key={`${selectedVehicleId}-waypoint-${index}`}
                vehicleId={selectedVehicleId}
                dataPoint={dataPoint}
                isSelected={true}
                isLatest={false}
              />
            ))
        )}
      </GoogleMap>
      
      {/* Gradient legend overlay */}
      <GradientLegend />
    </div>
  );
};
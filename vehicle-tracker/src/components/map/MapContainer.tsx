import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useAppStore } from '../../store';
import { DEFAULT_MAP_OPTIONS, DEFAULT_CENTER } from '../../constants/map';
import { MachineMarker } from './MachineMarker';
import { WaypointMarker } from './WaypointMarker';
import { DirectGradientPolyline } from './DirectGradientPolyline';
import { GradientLegend } from '../features/GradientLegend';
import { GradientMapOverlay } from './GradientMapOverlay';
import { PredictionControls } from '../features/PredictionControls';
import { PredictionVisualization } from './PredictionMarker';

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing" | "visualization")[] = [];

export const MapContainer: React.FC = () => {
  const { 
    selectedMachineId, 
    machineTracks, 
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
      // Fit bounds to show all machines
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;

      Object.values(machineTracks).forEach(track => {
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
    } else if (viewMode === 'individual' && selectedMachineId) {
      // Center on selected machine's latest position
      const latestPoint = getLatestDataPoint(selectedMachineId);
      if (latestPoint) {
        const center = {
          lat: latestPoint.latitude,
          lng: latestPoint.longitude,
        };
        map.panTo(center);
      }
    }
  }, [viewMode, selectedMachineId, machineTracks, map, getLatestDataPoint]);

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
        {/* Render polylines managed outside React-Google-Maps */}
        {/* This is handled by DirectGradientPolyline component outside GoogleMap */}

        {/* Render markers for latest positions only */}
        {Object.entries(machineTracks).map(([machineId, data]) => {
          const latestPoint = data[data.length - 1];
          if (!latestPoint) return null;
          
          return (
            <MachineMarker
              key={machineId}
              machineId={machineId}
              dataPoint={latestPoint}
              isSelected={machineId === selectedMachineId}
            />
          );
        })}

        {/* Render additional waypoint markers for selected machine only (in individual mode) */}
        {viewMode === 'individual' && selectedMachineId && machineTracks[selectedMachineId] && (
          machineTracks[selectedMachineId]
            .slice(0, -1) // Exclude latest point (already shown by MachineMarker)
            .map((dataPoint, index) => (
              <WaypointMarker
                key={`${selectedMachineId}-waypoint-${index}`}
                machineId={selectedMachineId}
                dataPoint={dataPoint}
                isSelected={true}
                isLatest={false}
              />
            ))
        )}

        {/* Render prediction visualizations - only when map is available */}
        {map && Object.keys(machineTracks).map((machineId) => {
          const shouldShowPrediction = viewMode === 'individual' ? 
            machineId === selectedMachineId : 
            true; // Show all predictions in 'all' mode
            
          return shouldShowPrediction ? (
            <PredictionVisualization
              key={`prediction-${machineId}`}
              machineId={machineId}
              isSelected={machineId === selectedMachineId}
              map={map}
            />
          ) : null;
        })}
      </GoogleMap>
      
      {/* Direct Google Maps polyline management */}
      {viewMode === 'individual' && selectedMachineId && machineTracks[selectedMachineId] && map && (
        <DirectGradientPolyline
          key={`direct-${selectedMachineId}-${gradientVisualization.selectedParameter || 'none'}-${gradientVisualization.refreshKey}`}
          map={map}
          machineId={selectedMachineId}
          data={machineTracks[selectedMachineId]}
          isSelected={true}
          gradientParameter={gradientVisualization.isEnabled ? gradientVisualization.selectedParameter : null}
        />
      )}
      
      {/* Gradient controls overlay */}
      <GradientMapOverlay />
      
      {/* Prediction controls overlay */}
      <PredictionControls />
      
      {/* Gradient legend overlay */}
      <GradientLegend />
    </div>
  );
};
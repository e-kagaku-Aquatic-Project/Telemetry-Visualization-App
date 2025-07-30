import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { useAppStore } from '../../store';
import { getMapOptions, DEFAULT_CENTER } from '../../constants/map';
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
    mapMarkerLimit, // New: Get mapMarkerLimit from store
    getLatestDataPoint,
    viewMode,
    gradientVisualization,
    theme,
    mapType,
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

  const getGPSErrorStatusFromComment = (comment: string | undefined): string | undefined => {
    if (!comment) return undefined;
    const match = comment.match(/GPS_ERROR:([A-Z_]+)/);
    return match ? match[1] : undefined;
  };

  if (loadError) {
    return (
      <div className="card p-8 flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load Google Maps</div>
          <div className="text-light-muted dark:text-dark-muted text-sm">
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
          <div className="animate-spin w-8 h-8 border-2 border-light-accent dark:border-dark-accent border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-light-muted dark:text-dark-muted">Loading map...</div>
        </div>
      </div>
    );
  }

  const currentCenter = mapCenter || DEFAULT_CENTER;

  return (
    <div className="card overflow-hidden w-full h-full relative">
      <GoogleMap
        key={`${viewMode}-${theme}`} // Force remount when viewMode or theme changes
        mapContainerStyle={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
        center={currentCenter}
        zoom={mapZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={getMapOptions(theme, mapType)}
      >
        {/* Render polylines managed outside React-Google-Maps */}
        {/* This is handled by DirectGradientPolyline component outside GoogleMap */}

        {/* Render markers for latest positions only */}
        {Object.entries(machineTracks)
          .slice(0, mapMarkerLimit === Infinity ? undefined : mapMarkerLimit) // Apply limit from store
          .map(([machineId, data]) => {
          const latestPoint = data[data.length - 1];
          if (!latestPoint || getGPSErrorStatusFromComment(latestPoint.comment) !== 'NONE') return null;
          
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
            .slice(mapMarkerLimit === Infinity ? 0 : -mapMarkerLimit, -1) // Limit to the last 'mapMarkerLimit' points, excluding the very last one
            .filter(dataPoint => getGPSErrorStatusFromComment(dataPoint.comment) === 'NONE') // Filter for GPS_ERROR:NONE in comment
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
        {map && Object.keys(machineTracks)
          .slice(0, mapMarkerLimit) // Apply limit to prediction visualizations
          .map((machineId) => {
          const shouldShowPrediction = viewMode === 'individual' ? 
            machineId === selectedMachineId : 
            false; // Only show predictions in 'individual' mode
            
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
          data={machineTracks[selectedMachineId].slice(mapMarkerLimit === Infinity ? 0 : -mapMarkerLimit)}
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
import React, { useCallback, useEffect, useState, useRef } from 'react';
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
  const [userInteracted, setUserInteracted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const programmaticChangeRef = useRef(false);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GMAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });


  // Auto-center logic based on view mode (only when user hasn't interacted with map)
  useEffect(() => {
    if (!map || userInteracted) return;

    programmaticChangeRef.current = true;

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

    // Clear programmatic change flag after a delay
    setTimeout(() => {
      programmaticChangeRef.current = false;
    }, 200);
  }, [viewMode, selectedMachineId, map, getLatestDataPoint, userInteracted]);

  // Reset userInteracted when view mode or selected machine changes
  useEffect(() => {
    setUserInteracted(false);
    setIsInitialized(false);
  }, [viewMode, selectedMachineId]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    
    // Set initial zoom level
    map.setZoom(mapZoom);
    setIsInitialized(true);
    
    // Add event listeners to detect user interactions
    map.addListener('drag', () => setUserInteracted(true));
    map.addListener('dragstart', () => setUserInteracted(true));
    map.addListener('zoom_changed', () => {
      // Only set userInteracted if it's not a programmatic change
      if (!programmaticChangeRef.current) {
        setUserInteracted(true);
      }
    });
  }, [mapZoom]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);



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
        key={theme} // Only remount when theme changes
        mapContainerStyle={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
        center={currentCenter}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={getMapOptions(theme, mapType)}
      >
        {/* Render polylines managed outside React-Google-Maps */}
        {/* This is handled by DirectGradientPolyline component outside GoogleMap */}

        {/* Render markers for latest positions only */}
        {Object.entries(machineTracks)
          .slice(0, mapMarkerLimit) // Apply limit from store
          .map(([machineId, data]) => {
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
            .slice(-mapMarkerLimit, -1) // Limit to the last 'mapMarkerLimit' points, excluding the very last one
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
          data={machineTracks[selectedMachineId].slice(-mapMarkerLimit)}
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
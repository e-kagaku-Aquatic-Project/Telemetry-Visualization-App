import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
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
    mapMarkerLimit,
    viewMode,
    gradientVisualization,
    theme,
    mapType,
  } = useAppStore();

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const programmaticChangeRef = useRef(false);
  const tracksRef = useRef(machineTracks);

  // Keep a ref to the latest tracks to avoid adding it to the auto-center effect's dependencies
  useEffect(() => {
    tracksRef.current = machineTracks;
  }, [machineTracks]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GMAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapOptions = useMemo(() => getMapOptions(theme, mapType), [theme, mapType]);

  // Manually update map options to prevent remounting
  useEffect(() => {
    if (map) {
      map.setOptions(mapOptions);
    }
  }, [map, mapOptions]);

  // Auto-center logic - runs only when view changes, not on data refresh
  useEffect(() => {
    // Don't center if user has already interacted with the map
    if (!map || userInteracted) return;

    // Use the ref to get the latest tracks without making the effect dependent on them
    const currentTracks = tracksRef.current;
    const hasTracks = Object.keys(currentTracks).length > 0;
    if (!hasTracks) return;

    programmaticChangeRef.current = true;

    if (viewMode === 'all') {
      const bounds = new google.maps.LatLngBounds();
      let hasPoints = false;
      Object.values(currentTracks).forEach(track => {
        if (track.length > 0) {
          const latestPoint = track[track.length - 1];
          if (getGPSErrorStatusFromComment(latestPoint.comment) === 'NONE') {
            bounds.extend({ lat: latestPoint.latitude, lng: latestPoint.longitude });
            hasPoints = true;
          }
        }
      });

      if (hasPoints) {
        map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
      }
    } else if (viewMode === 'individual' && selectedMachineId) {
      const track = currentTracks[selectedMachineId];
      const latestPoint = track && track.length > 0 ? track[track.length - 1] : undefined;
      
      if (latestPoint && getGPSErrorStatusFromComment(latestPoint.comment) === 'NONE') {
        map.panTo({ lat: latestPoint.latitude, lng: latestPoint.longitude });
      }
    }

    // Allow user interaction to take over after programmatic change
    setTimeout(() => {
      programmaticChangeRef.current = false;
    }, 200);
    // This effect should only run when the view changes, not when data updates.
  }, [viewMode, selectedMachineId, map, userInteracted]); // Dependency array is now clean

  // Reset interaction flag when view changes, allowing auto-center to run again
  useEffect(() => {
    setUserInteracted(false);
  }, [viewMode, selectedMachineId]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    map.setZoom(mapZoom);
    
    const handleInteraction = () => {
      if (!programmaticChangeRef.current) {
        setUserInteracted(true);
      }
    };

    map.addListener('dragstart', handleInteraction);
    map.addListener('zoom_changed', handleInteraction);
  }, [mapZoom]);

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

  return (
    <div className="card overflow-hidden w-full h-full relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', display: 'block' }}
        center={mapCenter || DEFAULT_CENTER}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {Object.entries(machineTracks)
          .slice(0, mapMarkerLimit === Infinity ? undefined : mapMarkerLimit)
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

        {viewMode === 'individual' && selectedMachineId && machineTracks[selectedMachineId] && (
          machineTracks[selectedMachineId]
            .slice(mapMarkerLimit === Infinity ? 0 : -mapMarkerLimit, -1)
            .filter(dataPoint => getGPSErrorStatusFromComment(dataPoint.comment) === 'NONE')
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

        {map && Object.keys(machineTracks)
          .slice(0, mapMarkerLimit)
          .map((machineId) => {
            const shouldShowPrediction = viewMode === 'individual' ? machineId === selectedMachineId : false;
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
      
      <GradientMapOverlay />
      <PredictionControls />
      <GradientLegend />
    </div>
  );
};

export default React.memo(MapContainer);

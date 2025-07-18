import React from 'react';
import { Marker } from '@react-google-maps/api';
import { TelemetryDataPoint } from '../types';
import { useAppStore } from '../store';

interface WaypointMarkerProps {
  machineId: string;
  dataPoint: TelemetryDataPoint;
  isSelected: boolean;
  isLatest: boolean;
}

// Color palette for different machines (improved colors)
const MACHINE_COLORS = [
  '#58a6ff', // Blue
  '#7c3aed', // Purple  
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export const WaypointMarker: React.FC<WaypointMarkerProps> = ({
  machineId,
  dataPoint,
  isSelected,
  isLatest,
}) => {
  const { setSelectedDataPoint, setSelectedMachine, getMachineIds } = useAppStore();

  const handleMarkerClick = () => {
    setSelectedMachine(machineId);
    setSelectedDataPoint(dataPoint);
  };

  // Get consistent color for this machine
  const machineIds = getMachineIds();
  const machineIndex = machineIds.indexOf(machineId);
  const machineColor = MACHINE_COLORS[machineIndex % MACHINE_COLORS.length];

  // Create different marker styles for waypoints vs current position
  const markerIcon = isLatest ? {
    // Current position marker (larger, animated)
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: machineColor,
    fillOpacity: 1,
    strokeColor: '#0d1117',
    strokeWeight: 3,
    scale: isSelected ? 14 : 10,
  } : {
    // Waypoint marker (smaller, subtle)
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: machineColor,
    fillOpacity: 0.7,
    strokeColor: '#0d1117',
    strokeWeight: 1,
    scale: isSelected ? 6 : 4,
  };

  return (
    <Marker
      position={{
        lat: dataPoint.latitude,
        lng: dataPoint.longitude,
      }}
      onClick={handleMarkerClick}
      icon={markerIcon}
      title={`${machineId} - ${new Date(dataPoint.timestamp).toLocaleString()}`}
      animation={isSelected && isLatest ? google.maps.Animation.BOUNCE : undefined}
      zIndex={isLatest ? 1000 : (isSelected ? 500 : 100)}
    />
  );
};
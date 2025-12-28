import React from 'react';
import { Marker } from '@react-google-maps/api';
import { TelemetryDataPoint } from '../../types';
import { useAppStore } from '../../store';
import { formatTimestamp } from '../../utils/export';

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

  // Create different marker styles based on map_design_summary.md
  const markerIcon = isLatest ? {
    // Current Position: Large circle with machine color
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: machineColor, // Machine-specific color
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: isSelected ? 10 : 8,
  } : {
    // Standard Points: Small circle, Fill Black, Stroke White 1px, Scale 3
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: '#000000',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 1,
    scale: isSelected ? 4 : 3,
  };

  return (
    <Marker
      position={{
        lat: dataPoint.latitude,
        lng: dataPoint.longitude,
      }}
      onClick={handleMarkerClick}
      icon={markerIcon}
      title={`${machineId} - ${formatTimestamp(dataPoint.timestamp)}`}
      zIndex={isLatest ? 1000 : (isSelected ? 500 : 100)}
    />
  );
};
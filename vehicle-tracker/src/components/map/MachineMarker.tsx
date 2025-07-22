import React from 'react';
import { Marker } from '@react-google-maps/api';
import { TelemetryDataPoint } from '../../types';
import { useAppStore } from '../../store';
import { formatTimestamp } from '../../utils/export';

interface MachineMarkerProps {
  machineId: string;
  dataPoint: TelemetryDataPoint;
  isSelected: boolean;
}

// Color palette for different machines (matching TrackPolyline and WaypointMarker)
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

export const MachineMarker: React.FC<MachineMarkerProps> = ({
  machineId,
  dataPoint,
  isSelected,
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

  // Create custom marker icon
  const markerIcon = {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: machineColor,
    fillOpacity: 1,
    strokeColor: '#0d1117',
    strokeWeight: 3,
    scale: isSelected ? 14 : 10,
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
      animation={isSelected ? google.maps.Animation.BOUNCE : undefined}
      zIndex={isSelected ? 1000 : 100}
    />
  );
};
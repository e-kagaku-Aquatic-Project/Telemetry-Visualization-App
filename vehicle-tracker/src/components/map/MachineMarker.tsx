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

  // Create custom marker icon (special icons for specific machines)
  const getMarkerIcon = () => {
    // Get the base path for GitHub Pages deployment
    const basePath = process.env.NODE_ENV === 'production' ? '/Telemetry-Visualization-App' : '';
    
    if (machineId === 'Godzilla') {
      return {
        url: `${basePath}/godzilla-icon.png`, // PNG image for Godzilla
        scaledSize: new google.maps.Size(isSelected ? 48 : 36, isSelected ? 48 : 36),
        anchor: new google.maps.Point(isSelected ? 24 : 18, isSelected ? 48 : 36), // Anchor at bottom center
      };
    } else if (machineId === 'iseki') {
      return {
        url: `${basePath}/iseki-icon.png`, // PNG image for iseki
        scaledSize: new google.maps.Size(isSelected ? 48 : 36, isSelected ? 48 : 36),
        anchor: new google.maps.Point(isSelected ? 24 : 18, isSelected ? 48 : 36), // Anchor at bottom center
      };
    } else if (machineId === 'kitahara') {
      return {
        url: `${basePath}/kitahara-icon.png`, // PNG image for kitahara
        scaledSize: new google.maps.Size(isSelected ? 48 : 36, isSelected ? 48 : 36),
        anchor: new google.maps.Point(isSelected ? 24 : 18, isSelected ? 48 : 36), // Anchor at bottom center
      };
    } else {
      // Current Position style (using machine color for differentiation)
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: machineColor, // Machine-specific color
        fillOpacity: 1,
        strokeColor: '#ffffff', // White stroke
        strokeWeight: 2,
        scale: isSelected ? 10 : 8,
      };
    }
  };

  const markerIcon = getMarkerIcon();

  return (
    <Marker
      position={{
        lat: dataPoint.latitude,
        lng: dataPoint.longitude,
      }}
      onClick={handleMarkerClick}
      icon={markerIcon}
      title={`${machineId} - ${formatTimestamp(dataPoint.timestamp)}`}
      zIndex={isSelected ? 1000 : 100}
    />
  );
};
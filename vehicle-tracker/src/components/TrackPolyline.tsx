import React from 'react';
import { Polyline } from '@react-google-maps/api';
import { TelemetryDataPoint } from '../types';
import { useAppStore } from '../store';

interface TrackPolylineProps {
  machineId: string;
  data: TelemetryDataPoint[];
  isSelected: boolean;
}

// Color palette for different machines (matching WaypointMarker)
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

export const TrackPolyline: React.FC<TrackPolylineProps> = ({
  machineId,
  data,
  isSelected,
}) => {
  const { getMachineIds } = useAppStore();
  
  if (data.length < 2) return null;

  const path = data.map(point => ({
    lat: point.latitude,
    lng: point.longitude,
  }));

  // Get consistent color for this machine
  const machineIds = getMachineIds();
  const machineIndex = machineIds.indexOf(machineId);
  const machineColor = MACHINE_COLORS[machineIndex % MACHINE_COLORS.length];

  const polylineOptions: google.maps.PolylineOptions = {
    path,
    geodesic: true,
    strokeColor: machineColor,
    strokeOpacity: isSelected ? 0.9 : 0.6,
    strokeWeight: isSelected ? 4 : 2,
    zIndex: isSelected ? 100 : 50,
  };

  return <Polyline options={polylineOptions} />;
};
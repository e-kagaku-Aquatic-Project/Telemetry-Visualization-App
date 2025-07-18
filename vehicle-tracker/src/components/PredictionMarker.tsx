import React, { useEffect, useRef } from 'react';
import { Marker } from '@react-google-maps/api';
import { PredictedPosition } from '../utils/prediction';
import { TelemetryDataPoint } from '../types';
import { useAppStore } from '../store';

interface PredictionMarkerProps {
  machineId: string;
  currentPosition: TelemetryDataPoint;
  predictedPosition: PredictedPosition;
  isSelected: boolean;
  map: google.maps.Map;
}

// Color palette for different machines (matching other markers)
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

export const PredictionMarker: React.FC<PredictionMarkerProps> = ({
  machineId,
  currentPosition,
  predictedPosition,
  isSelected,
  map,
}) => {
  const { getMachineIds, predictionConfig } = useAppStore();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  // Get consistent color for this machine
  const machineIds = getMachineIds();
  const machineIndex = machineIds.indexOf(machineId);
  const machineColor = MACHINE_COLORS[machineIndex % MACHINE_COLORS.length];

  // Create arrow marker icon pointing in the direction of movement
  const arrowIcon = {
    path: 'M 0,0 L -5,10 L 0,7 L 5,10 Z', // Arrow pointing up
    fillColor: machineColor,
    fillOpacity: 0.8,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale: isSelected ? 1.2 : 1,
    rotation: predictedPosition.heading, // Rotate arrow to point in direction of movement
  };

  // Create and manage polyline directly with Google Maps API
  useEffect(() => {
    if (!map) return;

    // Create dotted line from current position to predicted position
    const predictionPath = [
      new google.maps.LatLng(currentPosition.latitude, currentPosition.longitude),
      new google.maps.LatLng(predictedPosition.latitude, predictedPosition.longitude),
    ];

    // Line style options based on confidence
    const getLineOpacity = (confidence: number) => {
      if (confidence > 0.7) return 0.8;
      if (confidence > 0.4) return 0.6;
      return 0.4;
    };

    // Use orange/yellow color for prediction lines to distinguish from track lines
    const predictionColor = '#ff6b35'; // Orange color for prediction

    const polyline = new google.maps.Polyline({
      path: predictionPath,
      geodesic: true,
      strokeColor: predictionColor,
      strokeOpacity: getLineOpacity(predictedPosition.confidence),
      strokeWeight: isSelected ? 3 : 2,
      strokeDashArray: '10,5',
      zIndex: isSelected ? 999 : 500,
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    // Cleanup function
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, currentPosition, predictedPosition, isSelected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, []);

  return (
    <Marker
      position={{
        lat: predictedPosition.latitude,
        lng: predictedPosition.longitude,
      }}
      icon={arrowIcon}
      title={`${machineId} - Predicted position in ${predictionConfig.predictionMinutes}min
Speed: ${predictedPosition.speed.toFixed(1)} km/h
Heading: ${predictedPosition.heading.toFixed(0)}°
Confidence: ${Math.round(predictedPosition.confidence * 100)}%`}
      zIndex={isSelected ? 1001 : 501}
    />
  );
};

interface PredictionVisualizationProps {
  machineId: string;
  isSelected: boolean;
  map: google.maps.Map;
}

// Wrapper component that handles the logic of getting current and predicted positions
export const PredictionVisualization: React.FC<PredictionVisualizationProps> = ({
  machineId,
  isSelected,
  map,
}) => {
  const { 
    getLatestDataPoint, 
    getPredictedPosition, 
    predictionConfig 
  } = useAppStore();

  if (!predictionConfig.isEnabled) {
    return null;
  }

  const currentPosition = getLatestDataPoint(machineId);
  const predictedPosition = getPredictedPosition(machineId);

  if (!currentPosition || !predictedPosition) {
    return null;
  }

  return (
    <PredictionMarker
      machineId={machineId}
      currentPosition={currentPosition}
      predictedPosition={predictedPosition}
      isSelected={isSelected}
      map={map}
    />
  );
};
import React, { useEffect, useRef } from 'react';
import { TelemetryDataPoint, GradientParameter } from '../../types';
import { generateGradientColors, getDataRange } from '../../utils/gradientColors';
import { useAppStore } from '../../store';

interface DirectGradientPolylineProps {
  map: google.maps.Map | null;
  machineId: string;
  data: TelemetryDataPoint[];
  isSelected: boolean;
  gradientParameter: GradientParameter | null;
}

// Fallback color palette for different machines
const MACHINE_COLORS = [
  '#58a6ff', '#7c3aed', '#f59e0b', '#10b981', 
  '#ef4444', '#ec4899', '#06b6d4', '#84cc16',
];

export const DirectGradientPolyline: React.FC<DirectGradientPolylineProps> = ({
  map,
  machineId,
  data,
  isSelected,
  gradientParameter,
}) => {
  const { getMachineIds } = useAppStore();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  // Clear all existing polylines
  const clearPolylines = () => {
    polylinesRef.current.forEach(polyline => {
      polyline.setMap(null);
    });
    polylinesRef.current = [];
  };

  useEffect(() => {
    if (!map || data.length < 2) {
      clearPolylines();
      return;
    }

    // Always clear existing polylines first
    clearPolylines();

    if (!gradientParameter) {
      // Create regular polyline
      const path = data.map(point => ({
        lat: point.latitude,
        lng: point.longitude,
      }));

      const machineIds = getMachineIds();
      const machineIndex = machineIds.indexOf(machineId);
      const machineColor = MACHINE_COLORS[machineIndex % MACHINE_COLORS.length];

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: machineColor,
        strokeOpacity: isSelected ? 0.9 : 0.6,
        strokeWeight: isSelected ? 4 : 2,
        zIndex: isSelected ? 100 : 50,
        map,
      });

      polylinesRef.current.push(polyline);
    } else {
      // Create gradient polylines
      const range = getDataRange(data, gradientParameter);
      const subsegmentsPerSegment = 5;

      for (let i = 0; i < data.length - 1; i++) {
        const startPoint = data[i];
        const endPoint = data[i + 1];
        const startValue = startPoint[gradientParameter];
        const endValue = endPoint[gradientParameter];

        for (let j = 0; j < subsegmentsPerSegment; j++) {
          const ratio1 = j / subsegmentsPerSegment;
          const ratio2 = (j + 1) / subsegmentsPerSegment;
          
          const lat1 = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio1;
          const lng1 = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio1;
          const lat2 = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio2;
          const lng2 = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio2;
          
          const interpolatedValue = startValue + (endValue - startValue) * ratio1;
          const color = generateGradientColors([{ [gradientParameter]: interpolatedValue }], gradientParameter, range)[0];
          
          const polyline = new google.maps.Polyline({
            path: [
              { lat: lat1, lng: lng1 },
              { lat: lat2, lng: lng2 }
            ],
            geodesic: true,
            strokeColor: color,
            strokeOpacity: isSelected ? 0.9 : 0.7,
            strokeWeight: isSelected ? 4 : 3,
            zIndex: isSelected ? 100 : 50,
            map,
          });

          polylinesRef.current.push(polyline);
        }
      }
    }

    // Cleanup function
    return () => {
      clearPolylines();
    };
  }, [map, data, gradientParameter, machineId, isSelected, getMachineIds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolylines();
    };
  }, []);

  // This component renders nothing - it only manages Google Maps polylines
  return null;
};
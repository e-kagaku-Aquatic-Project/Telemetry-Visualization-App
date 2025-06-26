import React, { useMemo } from 'react';
import { Polyline } from '@react-google-maps/api';
import { TelemetryDataPoint, GradientParameter, GradientSegment } from '../types';
import { generateGradientColors, getDataRange } from '../utils/gradientColors';
import { useAppStore } from '../store';

interface GradientTrackPolylineProps {
  vehicleId: string;
  data: TelemetryDataPoint[];
  isSelected: boolean;
  gradientParameter: GradientParameter | null;
}

// Fallback color palette for different vehicles (matching original TrackPolyline)
const VEHICLE_COLORS = [
  '#58a6ff', // Blue
  '#7c3aed', // Purple  
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export const GradientTrackPolyline: React.FC<GradientTrackPolylineProps> = ({
  vehicleId,
  data,
  isSelected,
  gradientParameter,
}) => {
  const { getVehicleIds } = useAppStore();
  
  // Create gradient segments with smooth interpolation
  const gradientSegments = useMemo((): GradientSegment[] => {
    if (data.length < 2) return [];

    // If no gradient parameter selected, return empty array (fall back to regular polyline)
    if (!gradientParameter) return [];

    const segments: GradientSegment[] = [];
    const range = getDataRange(data, gradientParameter);
    
    // Create multiple sub-segments between each data point for smooth gradient
    const subsegmentsPerSegment = 5; // Number of sub-segments for smooth interpolation

    for (let i = 0; i < data.length - 1; i++) {
      const startPoint = data[i];
      const endPoint = data[i + 1];
      const startValue = startPoint[gradientParameter];
      const endValue = endPoint[gradientParameter];

      // Create multiple sub-segments between start and end points
      for (let j = 0; j < subsegmentsPerSegment; j++) {
        const ratio1 = j / subsegmentsPerSegment;
        const ratio2 = (j + 1) / subsegmentsPerSegment;
        
        // Interpolate positions
        const lat1 = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio1;
        const lng1 = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio1;
        const lat2 = startPoint.latitude + (endPoint.latitude - startPoint.latitude) * ratio2;
        const lng2 = startPoint.longitude + (endPoint.longitude - startPoint.longitude) * ratio2;
        
        // Interpolate values for color calculation
        const interpolatedValue = startValue + (endValue - startValue) * ratio1;
        
        // Generate color for this sub-segment
        const color = generateGradientColors([{ [gradientParameter]: interpolatedValue }], gradientParameter, range)[0];
        
        segments.push({
          path: [
            { lat: lat1, lng: lng1 },
            { lat: lat2, lng: lng2 }
          ],
          color,
          value: interpolatedValue
        });
      }
    }

    return segments;
  }, [data, gradientParameter]);

  // Regular polyline (when gradient is disabled)
  const regularPolyline = useMemo(() => {
    if (data.length < 2 || gradientParameter) return null;

    const path = data.map(point => ({
      lat: point.latitude,
      lng: point.longitude,
    }));

    // Get consistent color for this vehicle
    const vehicleIds = getVehicleIds();
    const vehicleIndex = vehicleIds.indexOf(vehicleId);
    const vehicleColor = VEHICLE_COLORS[vehicleIndex % VEHICLE_COLORS.length];

    const polylineOptions: google.maps.PolylineOptions = {
      path,
      geodesic: true,
      strokeColor: vehicleColor,
      strokeOpacity: isSelected ? 0.9 : 0.6,
      strokeWeight: isSelected ? 4 : 2,
      zIndex: isSelected ? 100 : 50,
    };

    return <Polyline key={`regular-${vehicleId}`} options={polylineOptions} />;
  }, [data, gradientParameter, vehicleId, isSelected, getVehicleIds]);

  // Render gradient segments
  if (gradientParameter && gradientSegments.length > 0) {
    return (
      <>
        {gradientSegments.map((segment, index) => {
          const polylineOptions: google.maps.PolylineOptions = {
            path: segment.path,
            geodesic: true,
            strokeColor: segment.color,
            strokeOpacity: isSelected ? 0.9 : 0.7,
            strokeWeight: isSelected ? 4 : 3,
            zIndex: isSelected ? 100 : 50,
          };

          return (
            <Polyline
              key={`gradient-${vehicleId}-${gradientParameter}-${index}-${Date.now()}`}
              options={polylineOptions}
            />
          );
        })}
      </>
    );
  }

  // Render regular polyline when gradient is disabled
  return regularPolyline;
};
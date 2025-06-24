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
  
  // Create gradient segments
  const gradientSegments = useMemo((): GradientSegment[] => {
    if (data.length < 2) return [];

    // If no gradient parameter selected, return empty array (fall back to regular polyline)
    if (!gradientParameter) return [];

    const segments: GradientSegment[] = [];
    const range = getDataRange(data, gradientParameter);
    const colors = generateGradientColors(data, gradientParameter, range);

    for (let i = 0; i < data.length - 1; i++) {
      const startPoint = data[i];
      const endPoint = data[i + 1];
      
      segments.push({
        path: [
          { lat: startPoint.latitude, lng: startPoint.longitude },
          { lat: endPoint.latitude, lng: endPoint.longitude }
        ],
        color: colors[i],
        value: startPoint[gradientParameter]
      });
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
              key={`gradient-${vehicleId}-${index}`}
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
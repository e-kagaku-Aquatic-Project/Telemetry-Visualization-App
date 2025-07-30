import { TelemetryDataPoint } from '../types';

export interface PredictedPosition {
  latitude: number;
  longitude: number;
  timestamp: string;
  confidence: number; // 0-1, based on data quality
  speed: number; // km/h
  heading: number; // degrees from north
}

export interface PredictionConfig {
  referencePoints: number; // Number of past points to use (default: 2)
  predictionMinutes: number; // Minutes into the future (default: 5)
  isEnabled: boolean; // Whether to show predictions
}

/**
 * Calculate distance between two geographic points using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate bearing (heading) between two points
 * Returns bearing in degrees from north (0-360)
 */
export function calculateBearing(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculate new position given starting point, distance, and bearing
 */
export function calculateDestination(
  lat: number, 
  lon: number, 
  distance: number, // in kilometers
  bearing: number // in degrees
): { latitude: number; longitude: number } {
  const R = 6371; // Earth's radius in kilometers
  const latRad = lat * Math.PI / 180;
  const lonRad = lon * Math.PI / 180;
  const bearingRad = bearing * Math.PI / 180;
  
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distance / R) +
    Math.cos(latRad) * Math.sin(distance / R) * Math.cos(bearingRad)
  );
  
  const newLonRad = lonRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(distance / R) * Math.cos(latRad),
    Math.cos(distance / R) - Math.sin(latRad) * Math.sin(newLatRad)
  );
  
  return {
    latitude: newLatRad * 180 / Math.PI,
    longitude: newLonRad * 180 / Math.PI
  };
}

/**
 * Predict future position based on historical data points
 */
export function predictPosition(
  dataPoints: TelemetryDataPoint[],
  config: PredictionConfig
): PredictedPosition | null {
  if (!config.isEnabled) {
    return null;
  }

  // Normalize gps_error values: convert string 'undefined' or 'null' to actual undefined
  dataPoints.forEach(point => {
    if (point.gps_error === undefined || point.gps_error === null) {
      point.gps_error = undefined;
    }
  });

  // Log all gps_error values for debugging
  

  // Filter out data points where GPS_ERROR is not NONE
  const filteredDataPoints = dataPoints.filter(point => point.gps_error === 'GPS_ERROR:NONE' || point.gps_error === undefined);
  

  // Sort all filtered data points by timestamp (most recent first)
  const allNoneSortedPoints = filteredDataPoints
    .slice()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Determine the actual number of reference points to use.
  // It should be at most config.referencePoints, but at least 2 if available.
  const actualReferencePoints = Math.min(config.referencePoints, allNoneSortedPoints.length);

  // If we don't have at least 2 valid points, we cannot predict.
  if (actualReferencePoints < 2) {
    return null;
  }

  // Take the most recent 'actualReferencePoints' for prediction
  const sortedPoints = allNoneSortedPoints.slice(0, actualReferencePoints);

  // Calculate vectors between consecutive points
  const vectors: Array<{
    distance: number;
    bearing: number;
    timeSpan: number; // in minutes
    speed: number; // km/h
  }> = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const current = sortedPoints[i];
    const previous = sortedPoints[i + 1];
    
    const distance = calculateDistance(
      previous.latitude,
      previous.longitude,
      current.latitude,
      current.longitude
    );
    
    const bearing = calculateBearing(
      previous.latitude,
      previous.longitude,
      current.latitude,
      current.longitude
    );
    
    const timeSpan = (new Date(current.timestamp).getTime() - new Date(previous.timestamp).getTime()) / (1000 * 60);
    const speed = timeSpan > 0 ? (distance / timeSpan) * 60 : 0; // km/h
    
    vectors.push({ distance, bearing, timeSpan, speed });
  }

  // Calculate average speed and bearing (weighted by time span)
  const totalTimeSpan = vectors.reduce((sum, v) => sum + v.timeSpan, 0);
  if (totalTimeSpan === 0) {
    return null;
  }

  const avgSpeed = vectors.reduce((sum, v) => sum + v.speed * v.timeSpan, 0) / totalTimeSpan;
  
  // Calculate average bearing (circular mean)
  const avgBearing = calculateCircularMean(vectors.map(v => v.bearing));
  
  // Calculate confidence based on data consistency
  const speedVariation = calculateVariation(vectors.map(v => v.speed));
  const bearingVariation = calculateCircularVariation(vectors.map(v => v.bearing));
  const confidence = Math.max(0, 1 - (speedVariation + bearingVariation) / 2);

  // Predict position
  const latestPoint = sortedPoints[0];
  const predictionDistance = (avgSpeed * config.predictionMinutes) / 60; // km
  
  const predictedCoords = calculateDestination(
    latestPoint.latitude,
    latestPoint.longitude,
    predictionDistance,
    avgBearing
  );

  const predictedTime = new Date(new Date(latestPoint.timestamp).getTime() + config.predictionMinutes * 60 * 1000);

  return {
    latitude: predictedCoords.latitude,
    longitude: predictedCoords.longitude,
    timestamp: predictedTime.toISOString(),
    confidence,
    speed: avgSpeed,
    heading: avgBearing
  };
}

/**
 * Calculate circular mean for angles (bearings)
 */
function calculateCircularMean(angles: number[]): number {
  if (angles.length === 0) return 0;
  
  const radians = angles.map(a => a * Math.PI / 180);
  const sumSin = radians.reduce((sum, r) => sum + Math.sin(r), 0);
  const sumCos = radians.reduce((sum, r) => sum + Math.cos(r), 0);
  
  const meanRad = Math.atan2(sumSin / angles.length, sumCos / angles.length);
  return (meanRad * 180 / Math.PI + 360) % 360;
}

/**
 * Calculate variation (normalized standard deviation) for a set of values
 */
function calculateVariation(values: number[]): number {
  if (values.length === 0) return 1;
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return mean > 0 ? Math.min(1, stdDev / mean) : 1;
}

/**
 * Calculate circular variation for angles
 */
function calculateCircularVariation(angles: number[]): number {
  if (angles.length === 0) return 1;
  
  const radians = angles.map(a => a * Math.PI / 180);
  const sumSin = radians.reduce((sum, r) => sum + Math.sin(r), 0);
  const sumCos = radians.reduce((sum, r) => sum + Math.cos(r), 0);
  
  const R = Math.sqrt(sumSin * sumSin + sumCos * sumCos) / angles.length;
  return 1 - R; // 0 = no variation, 1 = maximum variation
}

/**
 * Default prediction configuration
 */
export const DEFAULT_PREDICTION_CONFIG: PredictionConfig = {
  referencePoints: 2,
  predictionMinutes: 5,
  isEnabled: false
};
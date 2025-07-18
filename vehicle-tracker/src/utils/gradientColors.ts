/**
 * Gradient color mapping utilities for telemetry data visualization
 */

export type GradientParameter = 'altitude' | 'satellites' | 'battery';

export interface ColorPalette {
  colors: string[];
  name: string;
  unit: string;
}

// Color palettes for different parameters
export const COLOR_PALETTES: Record<GradientParameter, ColorPalette> = {
  altitude: {
    colors: ['#0066cc', '#00cc66', '#ffcc00', '#ff6600', '#cc0000'], // Blue -> Green -> Yellow -> Orange -> Red
    name: 'Altitude',
    unit: 'm'
  },
  satellites: {
    colors: ['#ff0000', '#ff6600', '#ffcc00', '#66cc00', '#00cc00'], // Red (few) -> Green (many)
    name: 'Satellites',
    unit: 'count'
  },
  battery: {
    colors: ['#ff0000', '#ff6600', '#ffcc00', '#66cc00', '#00cc00'], // Red (low) -> Green (high)
    name: 'Battery',
    unit: 'V'
  }
};

// Expected value ranges for normalization (can be dynamic based on actual data)
export const PARAMETER_RANGES: Record<GradientParameter, { min: number; max: number }> = {
  altitude: { min: 0, max: 1000 },
  satellites: { min: 0, max: 12 },
  battery: { min: 0, max: 5 }
};

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

/**
 * Blend two colors with given ratio
 */
function blendColors(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  const r = rgb1.r + (rgb2.r - rgb1.r) * ratio;
  const g = rgb1.g + (rgb2.g - rgb1.g) * ratio;
  const b = rgb1.b + (rgb2.b - rgb1.b) * ratio;
  
  return rgbToHex(r, g, b);
}

/**
 * Normalize value based on min-max range
 */
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Get color for normalized value (0-1) based on parameter palette
 */
export function getColorForValue(normalizedValue: number, parameter: GradientParameter): string {
  const palette = COLOR_PALETTES[parameter];
  const colors = palette.colors;
  
  if (normalizedValue <= 0) return colors[0];
  if (normalizedValue >= 1) return colors[colors.length - 1];
  
  // Find the segment
  const segmentSize = 1 / (colors.length - 1);
  const segmentIndex = Math.floor(normalizedValue / segmentSize);
  const localRatio = (normalizedValue % segmentSize) / segmentSize;
  
  if (segmentIndex >= colors.length - 1) {
    return colors[colors.length - 1];
  }
  
  return blendColors(colors[segmentIndex], colors[segmentIndex + 1], localRatio);
}

/**
 * Get dynamic min/max values from data array
 */
export function getDataRange(data: Record<string, unknown>[], parameter: GradientParameter): { min: number; max: number } {
  if (data.length === 0) {
    return PARAMETER_RANGES[parameter];
  }
  
  const values = data.map(point => point[parameter]).filter(val => typeof val === 'number' && !isNaN(val));
  
  if (values.length === 0) {
    return PARAMETER_RANGES[parameter];
  }
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

/**
 * Generate gradient colors for a data array
 */
export function generateGradientColors(
  data: Record<string, unknown>[], 
  parameter: GradientParameter,
  customRange?: { min: number; max: number }
): string[] {
  const range = customRange || getDataRange(data, parameter);
  
  return data.map(point => {
    const value = point[parameter];
    if (typeof value !== 'number' || isNaN(value)) {
      return '#888888'; // Gray for invalid data
    }
    
    const normalizedValue = normalizeValue(value, range.min, range.max);
    return getColorForValue(normalizedValue, parameter);
  });
}

/**
 * Create color scale for legend display
 */
export function createColorScale(parameter: GradientParameter, steps: number = 100): Array<{ color: string; value: number }> {
  const range = PARAMETER_RANGES[parameter];
  const step = (range.max - range.min) / (steps - 1);
  
  return Array.from({ length: steps }, (_, index) => {
    const value = range.min + (step * index);
    const normalizedValue = index / (steps - 1);
    const color = getColorForValue(normalizedValue, parameter);
    
    return { color, value };
  });
}
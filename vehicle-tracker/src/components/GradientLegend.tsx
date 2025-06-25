import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { COLOR_PALETTES, getDataRange, getColorForValue, normalizeValue } from '../utils/gradientColors';

export const GradientLegend: React.FC = () => {
  const { 
    gradientVisualization,
    selectedVehicleId,
    vehicleTracks,
    viewMode,
  } = useAppStore();

  // Get current vehicle data
  const vehicleData = useMemo(() => {
    if (viewMode !== 'individual' || !selectedVehicleId || !vehicleTracks[selectedVehicleId]) {
      return [];
    }
    return vehicleTracks[selectedVehicleId];
  }, [viewMode, selectedVehicleId, vehicleTracks]);

  // Calculate data range and create legend scale
  const legendData = useMemo(() => {
    if (!gradientVisualization.isEnabled || 
        !gradientVisualization.selectedParameter || 
        vehicleData.length === 0) {
      return null;
    }

    const parameter = gradientVisualization.selectedParameter;
    const range = getDataRange(vehicleData, parameter);
    const palette = COLOR_PALETTES[parameter];
    
    // Create 50 steps for smooth gradient display
    const steps = 50;
    const stepSize = (range.max - range.min) / (steps - 1);
    
    const legendSteps = Array.from({ length: steps }, (_, index) => {
      const value = range.min + (stepSize * index);
      const normalizedValue = normalizeValue(value, range.min, range.max);
      const color = getColorForValue(normalizedValue, parameter);
      
      return { value, color };
    });

    return {
      steps: legendSteps,
      range,
      palette,
      parameter
    };
  }, [gradientVisualization, vehicleData]);

  if (!legendData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="absolute bottom-4 left-4 right-80 z-10 pointer-events-none"
      >
        <div className="max-w-sm">
          <div className="card p-3 bg-dark-surface/95 backdrop-blur-sm border border-dark-muted/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-medium text-dark-text">
                {legendData.palette.name} ({legendData.palette.unit})
              </h4>
              <div className="text-xs text-dark-muted">
                {vehicleData.length} data points
              </div>
            </div>
            
            {/* Color gradient bar */}
            <div className="relative h-4 rounded-inner overflow-hidden border border-dark-muted/30">
              <div className="absolute inset-0 flex">
                {legendData.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex-1 h-full"
                    style={{ backgroundColor: step.color }}
                  />
                ))}
              </div>
            </div>
            
            {/* Value labels */}
            <div className="flex justify-between mt-2 text-xs text-dark-muted">
              <span className="font-mono">
                {legendData.range.min.toFixed(1)}
              </span>
              <span className="font-mono">
                {((legendData.range.max + legendData.range.min) / 2).toFixed(1)}
              </span>
              <span className="font-mono">
                {legendData.range.max.toFixed(1)}
              </span>
            </div>
            
            {/* Additional info */}
            <div className="mt-2 text-xs text-dark-muted/70 text-center">
              Darker colors indicate higher values • Track segments: {Math.max(0, (vehicleData.length - 1) * 5)}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
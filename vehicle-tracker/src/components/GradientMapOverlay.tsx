import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { GradientParameter } from '../types';
import { COLOR_PALETTES } from '../utils/gradientColors';
import { Palette, ChevronDown, X } from 'lucide-react';

export const GradientMapOverlay: React.FC = () => {
  const { 
    gradientVisualization,
    setGradientParameter,
    toggleGradientVisualization,
    selectedVehicleId,
    vehicleTracks,
    viewMode,
  } = useAppStore();

  const [isExpanded, setIsExpanded] = useState(false);

  // Only show gradient controls when viewing individual vehicle
  if (viewMode !== 'individual' || !selectedVehicleId || !vehicleTracks[selectedVehicleId]) {
    return null;
  }

  const parameters: Array<{ key: GradientParameter; label: string; unit: string }> = [
    { key: 'altitude', label: 'Altitude', unit: 'm' },
    { key: 'waterTemperature', label: 'Water Temperature', unit: '°C' },
    { key: 'airPressure', label: 'Air Pressure', unit: 'hPa' },
    { key: 'airTemperature', label: 'Air Temperature', unit: '°C' },
    { key: 'satellites', label: 'Satellites', unit: 'count' },
  ];

  const handleParameterSelect = (parameter: GradientParameter) => {
    setGradientParameter(parameter);
    setIsExpanded(false);
  };

  const handleToggle = () => {
    if (gradientVisualization.isEnabled) {
      toggleGradientVisualization();
      setIsExpanded(false);
    } else {
      if (!gradientVisualization.selectedParameter) {
        setIsExpanded(true);
      } else {
        toggleGradientVisualization();
      }
    }
  };

  return (
    <div className="absolute top-4 right-4 z-10">
      <div className="flex flex-col items-end space-y-2">
        {/* Main gradient button */}
        <motion.button
          onClick={handleToggle}
          className={`btn ${gradientVisualization.isEnabled ? 'btn-primary' : 'btn-secondary'} 
                     flex items-center space-x-2 px-3 py-2 shadow-lg backdrop-blur-sm`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Palette size={16} />
          <span className="text-sm font-medium">
            {gradientVisualization.isEnabled && gradientVisualization.selectedParameter
              ? parameters.find(p => p.key === gradientVisualization.selectedParameter)?.label || 'Gradient'
              : 'Gradient'}
          </span>
          {!gradientVisualization.isEnabled && (
            <ChevronDown 
              size={14} 
              className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          )}
        </motion.button>

        {/* Parameter selection dropdown */}
        <AnimatePresence>
          {isExpanded && !gradientVisualization.isEnabled && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-surface/95 backdrop-blur-sm border border-dark-muted/20 rounded-lg shadow-lg p-2 min-w-48"
            >
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs font-medium text-dark-text">Select Parameter</span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-dark-bg rounded"
                >
                  <X size={12} className="text-dark-muted" />
                </button>
              </div>
              
              <div className="space-y-1">
                {parameters.map(param => (
                  <button
                    key={param.key}
                    onClick={() => handleParameterSelect(param.key)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-dark-bg transition-colors
                             flex items-center justify-between group"
                  >
                    <div>
                      <div className="text-sm text-dark-text">{param.label}</div>
                      <div className="text-xs text-dark-muted">({param.unit})</div>
                    </div>
                    
                    {/* Color palette preview */}
                    <div className="flex items-center space-x-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                      {COLOR_PALETTES[param.key].colors.slice(0, 4).map((color, index) => (
                        <div
                          key={index}
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick disable button when gradient is active */}
        {gradientVisualization.isEnabled && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              toggleGradientVisualization();
              setIsExpanded(false);
            }}
            className="btn btn-secondary p-2 shadow-lg backdrop-blur-sm"
            title="Disable gradient"
          >
            <X size={14} />
          </motion.button>
        )}
      </div>
    </div>
  );
};
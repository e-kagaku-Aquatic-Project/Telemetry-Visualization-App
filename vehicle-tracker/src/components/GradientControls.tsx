import React from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { GradientParameter } from '../types';
import { COLOR_PALETTES } from '../utils/gradientColors';
import { Palette } from 'lucide-react';

export const GradientControls: React.FC = () => {
  const { 
    gradientVisualization,
    setGradientParameter,
    toggleGradientVisualization,
    selectedVehicleId,
    vehicleTracks,
    viewMode,
  } = useAppStore();

  // Only show gradient controls when viewing individual vehicle
  if (viewMode !== 'individual' || !selectedVehicleId || !vehicleTracks[selectedVehicleId]) {
    return null;
  }

  const parameters: Array<{ key: GradientParameter; label: string; unit: string }> = [
    { key: 'altitude', label: '高度', unit: 'm' },
    { key: 'waterTemperature', label: '水温', unit: '°C' },
    { key: 'airPressure', label: '気圧', unit: 'hPa' },
    { key: 'airTemperature', label: '気温', unit: '°C' },
    { key: 'satellites', label: '衛星数', unit: '個' },
  ];

  return (
    <motion.div 
      className="card p-4 mb-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Palette size={18} className="text-dark-accent" />
          <h3 className="text-sm font-semibold text-dark-text">
            軌跡グラデーション表示
          </h3>
        </div>
        
        <button
          onClick={toggleGradientVisualization}
          className={`btn ${gradientVisualization.isEnabled ? 'btn-primary' : 'btn-secondary'} text-sm px-3 py-2`}
        >
          {gradientVisualization.isEnabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {gradientVisualization.isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2">
            <label className="text-sm text-dark-muted min-w-0">パラメータ:</label>
            <select
              value={gradientVisualization.selectedParameter || ''}
              onChange={(e) => setGradientParameter(e.target.value as GradientParameter || null)}
              className="input text-sm flex-1"
            >
              <option value="">選択してください</option>
              {parameters.map(param => (
                <option key={param.key} value={param.key}>
                  {param.label} ({param.unit})
                </option>
              ))}
            </select>
          </div>

          {gradientVisualization.selectedParameter && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 text-xs text-dark-muted"
            >
              <span>カラーパレット:</span>
              <div className="flex items-center space-x-1">
                {COLOR_PALETTES[gradientVisualization.selectedParameter].colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded-sm border border-dark-muted/30"
                    style={{ backgroundColor: color }}
                    title={`${COLOR_PALETTES[gradientVisualization.selectedParameter].name} - ${color}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
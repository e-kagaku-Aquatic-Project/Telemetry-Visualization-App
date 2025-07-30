import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';
import { Navigation, ChevronDown, X, Clock, MapPin } from 'lucide-react';

export const PredictionControls: React.FC = () => {
  const { 
    predictionConfig,
    setPredictionEnabled,
    setPredictionMinutes,
    setPredictionReferencePoints,
    selectedMachineId,
    machineTracks,
    viewMode,
    getPredictedPosition,
  } = useAppStore();

  const [isExpanded, setIsExpanded] = useState(false);

  // Only show prediction controls when viewing individual machine
  if (viewMode !== 'individual' || !selectedMachineId || !machineTracks[selectedMachineId]) {
    return null;
  }

  const selectedMachineData = machineTracks[selectedMachineId];
  const predictedPosition = getPredictedPosition(selectedMachineId);
  const canPredict = selectedMachineData.length >= 2;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleEnableToggle = () => {
    setPredictionEnabled(!predictionConfig.isEnabled);
  };

  const handleMinutesChange = (minutes: number) => {
    setPredictionMinutes(minutes);
  };

  const handleReferencePointsChange = (points: number) => {
    if (points === Infinity) {
      setPredictionReferencePoints(selectedMachineData.length);
    } else {
      setPredictionReferencePoints(points);
    }
  };

  const minuteOptions = [1, 2, 5, 10, 15, 30, 60];
  const pointOptions = [2, 3, 4, 5, 6, 8, 10, 20, 30, 50];

  return (
    <div className="absolute top-16 right-4 z-10">
      <div className="flex flex-col items-end space-y-2">
        {/* Main prediction button */}
        <motion.button
          onClick={handleToggle}
          className={`btn ${predictionConfig.isEnabled ? 'btn-primary' : 'btn-secondary'} 
                     flex items-center space-x-2 px-3 py-2 shadow-lg backdrop-blur-sm`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Navigation size={16} />
          <span className="text-sm font-medium">
            {predictionConfig.isEnabled ? 'Prediction ON' : 'Prediction'}
          </span>
          <ChevronDown 
            size={14} 
            className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </motion.button>

        {/* Prediction controls dropdown */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-dark-surface/95 backdrop-blur-sm border border-dark-muted/20 rounded-lg shadow-lg p-4 min-w-72"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-dark-text">Position Prediction</span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1 hover:bg-dark-bg rounded"
                >
                  <X size={12} className="text-dark-muted" />
                </button>
              </div>

              {/* Enable/Disable Toggle */}
              <div className="mb-4">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={predictionConfig.isEnabled}
                    onChange={handleEnableToggle}
                    disabled={!canPredict}
                    className="w-4 h-4 text-dark-accent bg-dark-bg border-dark-muted rounded focus:ring-dark-accent"
                  />
                  <span className="text-sm text-dark-text">
                    Enable Prediction
                  </span>
                </label>
                {!canPredict && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Need at least 2 data points for prediction
                  </p>
                )}
              </div>

              {/* Prediction Time */}
              <div className="mb-4">
                <label className="block text-xs text-dark-muted mb-2">
                  Prediction Time (minutes):
                </label>
                <div className="flex flex-wrap gap-1">
                  {minuteOptions.map(minutes => (
                    <button
                      key={minutes}
                      onClick={() => handleMinutesChange(minutes)}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        predictionConfig.predictionMinutes === minutes
                          ? 'bg-dark-accent text-white'
                          : 'bg-dark-bg text-dark-text hover:bg-dark-muted/20'
                      }`}
                    >
                      {minutes}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Points */}
              <div className="mb-4">
                <label className="block text-xs text-dark-muted mb-2">
                  Reference Points:
                </label>
                <div className="flex flex-wrap gap-1">
                  {pointOptions.map(points => {
                    const isInfinity = points === Infinity;
                    const isDisabled = selectedMachineData.length < (isInfinity ? 2 : points);

                    return (
                      <button
                        key={isInfinity ? 'all' : points}
                        onClick={() => handleReferencePointsChange(points)}
                        disabled={isDisabled}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          predictionConfig.referencePoints === points
                            ? 'bg-dark-accent text-white'
                            : isDisabled
                            ? 'bg-dark-bg/50 text-dark-muted/50 cursor-not-allowed'
                            : 'bg-dark-bg text-dark-text hover:bg-dark-muted/20'
                        }`}
                      >
                        {isInfinity ? 'All' : points}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prediction Status */}
              {predictionConfig.isEnabled && (
                <div className="border-t border-dark-muted/20 pt-3">
                  <div className="text-xs text-dark-muted mb-2">Status:</div>
                  {predictedPosition ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <MapPin size={12} className="text-green-400" />
                        <span className="text-xs text-green-400">
                          Prediction Available
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock size={12} className="text-dark-muted" />
                        <span className="text-xs text-dark-text">
                          Speed: {predictedPosition.speed.toFixed(1)} km/h
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Navigation size={12} className="text-dark-muted" />
                        <span className="text-xs text-dark-text">
                          Heading: {predictedPosition.heading.toFixed(0)}°
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-xs text-red-400">
                        Cannot predict position
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

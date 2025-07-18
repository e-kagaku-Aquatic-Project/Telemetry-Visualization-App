import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { X } from 'lucide-react';
import { TelemetryDataPoint } from '../types';
import { formatTimestamp, parseComment, getStatusColor, getStatusLabel } from '../utils/export';

interface SidePanelProps {
  isDesktop?: boolean;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isDesktop = false }) => {
  const { 
    selectedDataPoint, 
    isSidePanelOpen, 
    setSidePanelOpen,
  } = useAppStore();

  if (!selectedDataPoint || (!isDesktop && !isSidePanelOpen)) return null;

  if (isDesktop) {
    // Desktop: Static side panel
    return (
      <div className="h-full bg-dark-surface border border-dark-muted/20 rounded-lg overflow-y-auto">
        <div className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4 lg:mb-6">
            <h2 className="text-base lg:text-lg font-semibold text-dark-text">
              Sensor Details
            </h2>
          </div>
          <SidePanelContent selectedDataPoint={selectedDataPoint} />
        </div>
      </div>
    );
  }

  // Mobile: Overlay panel
  return (
    <AnimatePresence>
      {isSidePanelOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween', duration: 0.3 }}
          className="fixed right-0 top-0 h-full w-full sm:w-96 bg-dark-surface border-l border-dark-muted/20 shadow-2xl z-50 overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-dark-text">
                Sensor Details
              </h2>
              <button
                onClick={() => setSidePanelOpen(false)}
                className="p-2 rounded-inner hover:bg-dark-bg transition-colors"
              >
                <X size={20} className="text-dark-muted" />
              </button>
            </div>
            <SidePanelContent selectedDataPoint={selectedDataPoint} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Extracted content component to avoid duplication
const SidePanelContent: React.FC<{ selectedDataPoint: TelemetryDataPoint }> = ({ selectedDataPoint }) => (
  <div className="space-y-6">
    {/* Machine Info */}
    <div className="card p-4">
      <h3 className="font-medium text-dark-text mb-3">Machine Information</h3>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-dark-muted">Machine ID:</span>
          <span className="font-mono text-dark-text">{selectedDataPoint.machineId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted">Timestamp:</span>
          <span className="font-mono text-dark-text text-sm">
            {formatTimestamp(selectedDataPoint.timestamp)}
          </span>
        </div>
        {selectedDataPoint.machineTime && (
          <div className="flex justify-between">
            <span className="text-dark-muted">Machine Time:</span>
            <span className="font-mono text-dark-text text-sm">
              {formatTimestamp(selectedDataPoint.machineTime)}
            </span>
          </div>
        )}
        {selectedDataPoint.dataType && (
          <div className="flex justify-between">
            <span className="text-dark-muted">Data Type:</span>
            <span className="font-mono text-dark-text">{selectedDataPoint.dataType}</span>
          </div>
        )}
      </div>
    </div>

    {/* GPS Data */}
    <div className="card p-4">
      <h3 className="font-medium text-dark-text mb-3">GPS Data</h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-dark-muted">Latitude:</span>
          <span className="font-mono text-dark-text">
            {selectedDataPoint.latitude.toFixed(6)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted">Longitude:</span>
          <span className="font-mono text-dark-text">
            {selectedDataPoint.longitude.toFixed(6)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted">Altitude:</span>
          <span className="font-mono text-dark-text">
            {selectedDataPoint.altitude.toFixed(1)} m
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted">Satellites:</span>
          <span className="font-mono text-dark-text">
            {selectedDataPoint.satellites}
          </span>
        </div>
      </div>
    </div>

    {/* Additional Data */}
    <div className="card p-4">
      <h3 className="font-medium text-dark-text mb-3">Additional Information</h3>
      <div className="space-y-3">
        {selectedDataPoint.battery !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-dark-muted">Battery:</span>
            <div className="text-right">
              <span className="font-mono text-dark-text text-lg">
                {selectedDataPoint.battery.toFixed(2)}V
              </span>
            </div>
          </div>
        )}
        
        {selectedDataPoint.comment && (
          <div className="space-y-2">
            <span className="text-dark-muted">Status Information:</span>
            <div className="bg-dark-bg p-3 rounded-inner">
              <StatusDisplay comment={selectedDataPoint.comment} />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Raw Data */}
    <div className="card p-4">
      <h3 className="font-medium text-dark-text mb-3">Raw Data</h3>
      <pre className="text-xs font-mono text-dark-muted bg-dark-bg p-3 rounded-inner overflow-x-auto">
        {JSON.stringify(selectedDataPoint, null, 2)}
      </pre>
    </div>
  </div>
);

// Status Display Component for parsed comment data
const StatusDisplay: React.FC<{ comment: string }> = ({ comment }) => {
  const status = parseComment(comment);
  const statusEntries = Object.entries(status);
  
  if (statusEntries.length === 0) {
    // Fallback to raw comment if parsing fails
    return (
      <div className="text-sm font-mono text-dark-text break-all">
        {comment}
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {statusEntries.map(([key, value]) => {
        if (!value) return null;
        
        const label = getStatusLabel(key);
        const colorClass = getStatusColor(key, value);
        
        return (
          <div key={key} className="flex items-center justify-between">
            <span className="text-dark-muted text-sm">{label}:</span>
            <span className={`font-mono text-sm font-medium ${colorClass}`}>
              {value}
            </span>
          </div>
        );
      })}
      
      {/* Raw comment as fallback */}
      <details className="mt-3">
        <summary className="text-xs text-dark-muted cursor-pointer hover:text-dark-text transition-colors">
          Raw Data
        </summary>
        <div className="mt-1 text-xs font-mono text-dark-muted break-all bg-dark-surface p-2 rounded border">
          {comment}
        </div>
      </details>
    </div>
  );
};
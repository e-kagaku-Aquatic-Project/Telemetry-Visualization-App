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
        <div className="p-2 lg:p-3">
          <div className="flex items-center justify-between mb-2 lg:mb-3">
            <h2 className="text-sm lg:text-base font-semibold text-dark-text">
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
  <div className="space-y-3">
    {/* Machine Info */}
    <div className="card p-3">
      <h3 className="font-medium text-dark-text mb-2 text-sm">Machine Information</h3>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-dark-muted text-xs">Machine ID:</span>
          <span className="font-mono text-dark-text text-xs">{selectedDataPoint.machineId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted text-xs">Timestamp:</span>
          <span className="font-mono text-dark-text text-xs">
            {formatTimestamp(selectedDataPoint.timestamp)}
          </span>
        </div>
        {selectedDataPoint.machineTime && (
          <div className="flex justify-between">
            <span className="text-dark-muted text-xs">Machine Time:</span>
            <span className="font-mono text-dark-text text-xs">
              {formatTimestamp(selectedDataPoint.machineTime)}
            </span>
          </div>
        )}
        {selectedDataPoint.dataType && (
          <div className="flex justify-between">
            <span className="text-dark-muted text-xs">Data Type:</span>
            <span className="font-mono text-dark-text text-xs">{selectedDataPoint.dataType}</span>
          </div>
        )}
      </div>
    </div>

    {/* GPS Data */}
    <div className="card p-3">
      <h3 className="font-medium text-dark-text mb-2 text-sm">GPS Data</h3>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-dark-muted text-xs">Latitude:</span>
          <span className="font-mono text-dark-text text-xs">
            {selectedDataPoint.latitude.toFixed(6)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted text-xs">Longitude:</span>
          <span className="font-mono text-dark-text text-xs">
            {selectedDataPoint.longitude.toFixed(6)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted text-xs">Altitude:</span>
          <span className="font-mono text-dark-text text-xs">
            {selectedDataPoint.altitude.toFixed(1)} m
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-dark-muted text-xs">Satellites:</span>
          <span className="font-mono text-dark-text text-xs">
            {selectedDataPoint.satellites}
          </span>
        </div>
      </div>
    </div>

    {/* Additional Data */}
    <div className="card p-3">
      <h3 className="font-medium text-dark-text mb-2 text-sm">Additional Information</h3>
      <div className="space-y-2">
        {selectedDataPoint.battery !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-dark-muted text-xs">Battery:</span>
            <div className="text-right">
              <span className="font-mono text-dark-text text-sm">
                {selectedDataPoint.battery.toFixed(2)}V
              </span>
            </div>
          </div>
        )}
        
        {selectedDataPoint.comment && (
          <div className="space-y-1.5">
            <span className="text-dark-muted text-xs">Status Information:</span>
            <div className="bg-dark-bg p-2 rounded-inner">
              <StatusDisplay comment={selectedDataPoint.comment} />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Raw Data - Collapsible */}
    <details className="card p-3">
      <summary className="font-medium text-dark-text text-sm cursor-pointer hover:text-dark-accent transition-colors">
        Raw Data
      </summary>
      <pre className="text-xs font-mono text-dark-muted bg-dark-bg p-2 rounded-inner overflow-x-auto mt-2">
        {JSON.stringify(selectedDataPoint, null, 2)}
      </pre>
    </details>
  </div>
);

// Status Display Component for parsed comment data
const StatusDisplay: React.FC<{ comment: string }> = ({ comment }) => {
  const status = parseComment(comment);
  const statusEntries = Object.entries(status);
  
  if (statusEntries.length === 0) {
    // Fallback to raw comment if parsing fails
    return (
      <div className="text-xs font-mono text-dark-text break-all">
        {comment}
      </div>
    );
  }
  
  return (
    <div className="space-y-1.5">
      {statusEntries.map(([key, value]) => {
        if (!value) return null;
        
        const label = getStatusLabel(key);
        const colorClass = getStatusColor(key, value);
        
        return (
          <div key={key} className="flex items-center justify-between">
            <span className="text-dark-muted text-xs">{label}:</span>
            <span className={`font-mono text-xs font-medium ${colorClass}`}>
              {value}
            </span>
          </div>
        );
      })}
      
      {/* Raw comment as fallback */}
      <details className="mt-2">
        <summary className="text-xs text-dark-muted cursor-pointer hover:text-dark-text transition-colors">
          Raw Data
        </summary>
        <div className="mt-1 text-xs font-mono text-dark-muted break-all bg-dark-surface p-1.5 rounded border">
          {comment}
        </div>
      </details>
    </div>
  );
};
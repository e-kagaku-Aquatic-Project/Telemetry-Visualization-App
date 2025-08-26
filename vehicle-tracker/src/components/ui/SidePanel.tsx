import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../store';
import { X } from 'lucide-react';
import type { TelemetryDataPoint } from '../../types';
import { formatTimestamp, parseComment, getStatusColor, getStatusLabel } from '../../utils/export';
import { MachineInformationCard } from './MachineInformationCard';

interface SidePanelProps {
  isDesktop?: boolean;
}

export const SidePanel: React.FC<SidePanelProps> = ({ isDesktop = false }) => {
  const { 
    selectedDataPoint, 
    isSidePanelOpen, 
    setSidePanelOpen,
    selectedMachineId,
    getLatestDataPoint,
    machineTracks,
    viewMode,
  } = useAppStore();

  const latestPoint = selectedMachineId ? getLatestDataPoint(selectedMachineId) : null;
  const displayPoint = selectedDataPoint || latestPoint;

  const continuousOperationTime = React.useMemo(() => {
    if (selectedMachineId && machineTracks[selectedMachineId]) {
      const track = machineTracks[selectedMachineId];
      if (track.length > 1) {
        const startTime = new Date(track[0].timestamp.replace(/\//g, '-'));
        const endTime = new Date(track[track.length - 1].timestamp.replace(/\//g, '-'));
        const diffMs = endTime.getTime() - startTime.getTime();
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return `${diffHours}h ${diffMinutes}m`;
      }
    }
    return 'N/A';
  }, [selectedMachineId, machineTracks]);

  if (!isDesktop && !isSidePanelOpen) return null;

  if (isDesktop) {
    // Desktop: Static side panel
    return (
      <div className="h-full bg-light-surface dark:bg-dark-surface border border-light-muted/20 dark:border-dark-muted/20 rounded-lg overflow-y-auto">
        <div className="p-2 lg:p-3">
          {viewMode === 'all' ? (
            <div className="space-y-4">
              <h2 className="text-sm lg:text-base font-semibold text-light-text dark:text-white mb-2 lg:mb-3">
                All Machine Information
              </h2>
              {Object.entries(machineTracks).map(([machineId, track]) => {
                const latest = track[track.length - 1];
                return latest ? (
                  <MachineInformationCard key={machineId} dataPoint={latest} />
                ) : null;
              })}
            </div>
          ) : (
            displayPoint && (
              <>
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <h2 className="text-sm lg:text-base font-semibold text-light-text dark:text-white">
                    {selectedDataPoint ? 'Sensor Details' : 'Machine Details'}
                  </h2>
                </div>
                <SidePanelContent selectedDataPoint={displayPoint} continuousOperationTime={continuousOperationTime} />
              </>
            )
          )}
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
          className="fixed right-0 top-0 h-full w-full sm:w-96 bg-light-surface dark:bg-dark-surface border-l border-light-muted/20 dark:border-dark-muted/20 shadow-2xl z-50 overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-light-text dark:text-white">
                {selectedDataPoint ? 'Sensor Details' : 'Machine Details'}
              </h2>
              <button
                onClick={() => setSidePanelOpen(false)}
                className="p-2 rounded-inner hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
              >
                <X size={20} className="text-light-muted dark:text-light-muted dark:text-dark-muted" />
              </button>
            </div>
            <SidePanelContent selectedDataPoint={displayPoint} continuousOperationTime={continuousOperationTime} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Extracted content component to avoid duplication
const SidePanelContent: React.FC<{ selectedDataPoint: TelemetryDataPoint; continuousOperationTime: string }> = ({ selectedDataPoint, continuousOperationTime }) => {
  const [lossTime, setLossTime] = useState<string>('');
  const [isDelayed, setIsDelayed] = useState<boolean>(false);

  useEffect(() => {
    const calculateLossTime = () => {
      if (selectedDataPoint.machineTime) {
        const machineTime = new Date(selectedDataPoint.machineTime.replace(/\//g, '-')); // More reliable parsing
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - machineTime.getTime()) / 1000);
        
        setIsDelayed(diffSeconds > 600); // 10 minutes

        const days = Math.floor(diffSeconds / 86400);
        const hours = Math.floor((diffSeconds % 86400) / 3600);
        const minutes = Math.floor((diffSeconds % 3600) / 60);
        const seconds = diffSeconds % 60;

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0) timeString += `${hours}h `;
        if (minutes > 0) timeString += `${minutes}m `;
        timeString += `${seconds}s`;

        setLossTime(timeString.trim());
      } else {
        setLossTime('N/A');
        setIsDelayed(false);
      }
    };

    calculateLossTime();
    const interval = setInterval(calculateLossTime, 1000); // Update every second

    return () => clearInterval(interval);
  }, [selectedDataPoint.machineTime]);

  return (
  <div className="space-y-3">
    {/* Machine Info */}
    <div className="card p-3">
      <h3 className="font-medium text-light-text dark:text-white mb-2 text-sm">Machine Information</h3>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Machine ID:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">{selectedDataPoint.machineId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Continuous Operation:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {continuousOperationTime}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Timestamp:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {formatTimestamp(selectedDataPoint.timestamp)}
          </span>
        </div>
        {selectedDataPoint.machineTime && (
          <div className="flex justify-between">
            <span className="text-light-muted dark:text-dark-muted text-xs">Machine Time:</span>
            <span className="font-mono text-light-text dark:text-dark-text text-xs">
              {formatTimestamp(selectedDataPoint.machineTime)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Loss Time:</span>
          <span className={`font-mono text-xs ${isDelayed ? 'text-red-500' : 'text-light-text dark:text-dark-text'}`}>{lossTime}</span>
        </div>
        {selectedDataPoint.dataType && (
          <div className="flex justify-between">
            <span className="text-light-muted dark:text-dark-muted text-xs">Data Type:</span>
            <span className="font-mono text-light-text dark:text-dark-text text-xs">{selectedDataPoint.dataType}</span>
          </div>
        )}
      </div>
    </div>

    {/* GPS Data */}
    <div className="card p-3">
      <h3 className="font-medium text-light-text dark:text-dark-text mb-2 text-sm">GPS Data</h3>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Latitude:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {selectedDataPoint.latitude.toFixed(6)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Longitude:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {selectedDataPoint.longitude.toFixed(6)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Altitude:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {selectedDataPoint.altitude.toFixed(1)} m
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Satellites:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {selectedDataPoint.satellites}
          </span>
        </div>
      </div>
    </div>

    {/* Additional Data */}
    <div className="card p-3">
      <h3 className="font-medium text-light-text dark:text-dark-text mb-2 text-sm">Additional Information</h3>
      <div className="space-y-2">
        {selectedDataPoint.battery !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-light-muted dark:text-dark-muted text-xs">Battery:</span>
            <div className="text-right">
              <span className="font-mono text-light-text dark:text-dark-text text-sm">
                {selectedDataPoint.battery.toFixed(2)}V
              </span>
            </div>
          </div>
        )}
        
        {selectedDataPoint.comment && (
          <div className="space-y-1.5">
            <span className="text-light-muted dark:text-dark-muted text-xs">Status Information:</span>
            <div className="bg-light-bg dark:bg-dark-bg p-2 rounded-inner">
              <StatusDisplay comment={selectedDataPoint.comment} />
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Raw Data - Collapsible */}
    <details className="card p-3">
      <summary className="font-medium text-light-text dark:text-dark-text text-sm cursor-pointer hover:text-light-accent dark:hover:text-dark-accent transition-colors">
        Raw Data
      </summary>
      <pre className="text-xs font-mono text-light-muted dark:text-dark-muted bg-light-bg dark:bg-dark-bg p-2 rounded-inner overflow-x-auto mt-2">
        {JSON.stringify(selectedDataPoint, null, 2)}
      </pre>
    </details>
  </div>
)};

// Status Display Component for parsed comment data
const StatusDisplay: React.FC<{ comment: string }> = ({ comment }) => {
  const status = parseComment(comment);
  const statusEntries = Object.entries(status);
  
  if (statusEntries.length === 0) {
    // Fallback to raw comment if parsing fails
    return (
      <div className="text-xs font-mono text-light-text dark:text-dark-text break-all">
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
            <span className="text-light-muted dark:text-dark-muted text-xs">{label}:</span>
            <span className={`font-mono text-xs font-medium ${colorClass}`}>
              {value}
            </span>
          </div>
        );
      })}
      
      {/* Raw comment as fallback */}
      <details className="mt-2">
        <summary className="text-xs text-light-muted dark:text-dark-muted cursor-pointer hover:text-light-text dark:text-dark-text transition-colors">
          Raw Data
        </summary>
        <div className="mt-1 text-xs font-mono text-light-muted dark:text-dark-muted break-all bg-dark-surface p-1.5 rounded border">
          {comment}
        </div>
      </details>
    </div>
  );
};
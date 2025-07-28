import React from 'react';
import { useAppStore } from '../../store';
import { motion } from 'framer-motion';

export const MachineTabs: React.FC = () => {
  const { 
    machineTracks, 
    selectedMachineId, 
    setSelectedMachine,
    getLatestDataPoint,
    setMapCenter,
    viewMode,
    setViewMode,
    mapMarkerLimit, // New: Get mapMarkerLimit from store
  } = useAppStore();

  const machineIds = Object.keys(machineTracks);

  const handleTabClick = (machineId: string | 'all') => {
    if (machineId === 'all') {
      setViewMode('all');
      setSelectedMachine(null);
      // TODO: Implement fitBounds for all machines
    } else {
      setViewMode('individual');
      setSelectedMachine(machineId);
      
      // Center map on latest position
      const latestPoint = getLatestDataPoint(machineId);
      if (latestPoint) {
        setMapCenter({
          lat: latestPoint.latitude,
          lng: latestPoint.longitude,
        });
      }
    }
  };

  if (machineIds.length === 0) {
    return (
      <div className="card p-4 mb-4">
        <div className="text-center text-light-muted dark:text-dark-muted">
          No machines found. Check your connection or data source.
        </div>
      </div>
    );
  }

  return (
    <div className="flex space-x-2 overflow-x-auto scrollbar-thin scrollbar-thumb-light-muted/30 dark:scrollbar-thumb-dark-muted/30 scrollbar-track-transparent">
      {/* All Machines Tab */}
      <motion.button
        onClick={() => handleTabClick('all')}
        className={`
          flex-shrink-0 px-3 py-2 rounded border transition-all duration-150 ease-out min-w-0
          ${viewMode === 'all'
            ? 'bg-light-accent dark:bg-dark-accent text-white border-light-accent dark:border-dark-accent' 
            : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-muted/30 dark:border-dark-muted/30 hover:border-light-accent/50 dark:hover:border-dark-accent/50'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="font-medium text-sm">All ({machineIds.length})</span>
        </div>
      </motion.button>

      {/* Individual Machine Tabs */}
      {machineIds.map((machineId) => {
        const isSelected = viewMode === 'individual' && selectedMachineId === machineId;
        const dataCount = machineTracks[machineId]?.length || 0;
        
        const latestPoint = getLatestDataPoint(machineId);
        let isDelayed = false;
        if (latestPoint && latestPoint.machineTime) {
          const machineTime = new Date(latestPoint.machineTime.replace(/\//g, '-'));
          const now = new Date();
          const diffMinutes = (now.getTime() - machineTime.getTime()) / (1000 * 60);
          if (diffMinutes > 10) {
            isDelayed = true;
          }
        }

        return (
          <motion.button
            key={machineId}
            onClick={() => handleTabClick(machineId)}
            className={`
              flex-shrink-0 px-3 py-2 rounded border transition-all duration-150 ease-out min-w-0
              ${isSelected 
                ? 'bg-light-accent dark:bg-dark-accent text-white border-light-accent dark:border-dark-accent' 
                : 'bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text border-light-muted/30 dark:border-dark-muted/30 hover:border-light-accent/50 dark:hover:border-dark-accent/50'
              }
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className={`font-medium text-sm truncate ${isDelayed ? 'text-red-500' : ''}`}>
                {machineId}
              </span>
              <span className="text-xs opacity-70 bg-light-bg/50 dark:bg-dark-bg/50 px-1.5 py-0.5 rounded flex-shrink-0">
                {Math.min(dataCount, mapMarkerLimit)}/{dataCount}
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
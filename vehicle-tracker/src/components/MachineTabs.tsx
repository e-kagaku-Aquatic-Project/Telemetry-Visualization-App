import React from 'react';
import { useAppStore } from '../store';
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
        <div className="text-center text-dark-muted">
          No machines found. Check your connection or data source.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-2 lg:mb-4">
      <div className="flex space-x-1 lg:space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-dark-muted/30 scrollbar-track-transparent">
        {/* All Machines Tab */}
        <motion.button
          onClick={() => handleTabClick('all')}
          className={`
            flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-card border transition-all duration-150 ease-out min-w-0
            ${viewMode === 'all'
              ? 'bg-dark-accent text-white border-dark-accent' 
              : 'bg-dark-surface text-dark-text border-dark-muted/30 hover:border-dark-accent/50'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="text-left min-w-0">
            <div className="font-medium text-xs sm:text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              All Machines
            </div>
            <div className="text-xs opacity-70 mt-1 hidden sm:block">
              {machineIds.length} machines
            </div>
          </div>
        </motion.button>

        {/* Individual Machine Tabs */}
        {machineIds.map((machineId) => {
          const isSelected = viewMode === 'individual' && selectedMachineId === machineId;
          const latestPoint = getLatestDataPoint(machineId);
          const dataCount = machineTracks[machineId]?.length || 0;
          
          return (
            <motion.button
              key={machineId}
              onClick={() => handleTabClick(machineId)}
              className={`
                flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-card border transition-all duration-150 ease-out min-w-0
                ${isSelected 
                  ? 'bg-dark-accent text-white border-dark-accent' 
                  : 'bg-dark-surface text-dark-text border-dark-muted/30 hover:border-dark-accent/50'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-left min-w-0">
                <div className="font-medium text-xs sm:text-sm truncate">
                  {machineId}
                </div>
                <div className="text-xs opacity-70 mt-1 hidden sm:block">
                  {dataCount} points
                </div>
                {latestPoint && (
                  <div className="text-xs opacity-60 mt-1 hidden md:block">
                    Last: {new Date(latestPoint.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
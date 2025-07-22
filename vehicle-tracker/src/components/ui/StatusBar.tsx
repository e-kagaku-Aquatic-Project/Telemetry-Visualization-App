import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../../store';
import { Download, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { 
  exportToCSV, 
  exportToJSON, 
  exportAllMachinesToCSV, 
  exportAllMachinesToJSON,
  formatTimestamp 
} from '../../utils/export';

export const StatusBar: React.FC = () => {
  const { 
    connectionStatus, 
    machineTracks, 
    selectedMachineId,
    getSelectedMachineData,
    refreshInterval,
    isPaused,
  } = useAppStore();

  const [isExporting, setIsExporting] = useState(false);

  const selectedMachineData = getSelectedMachineData();
  const totalMachines = Object.keys(machineTracks).length;
  const totalDataPoints = Object.values(machineTracks).reduce((sum, data) => sum + data.length, 0);

  const handleExportSelected = async (format: 'csv' | 'json') => {
    if (!selectedMachineId || selectedMachineData.length === 0) {
      alert('No machine selected or no data to export');
      return;
    }

    setIsExporting(true);
    try {
      const filename = `${selectedMachineId}-data`;
      if (format === 'csv') {
        exportToCSV(selectedMachineData, filename);
      } else {
        exportToJSON(selectedMachineData, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async (format: 'csv' | 'json') => {
    if (totalDataPoints === 0) {
      alert('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      const filename = 'all-machines-data';
      if (format === 'csv') {
        exportAllMachinesToCSV(machineTracks, filename);
      } else {
        exportAllMachinesToJSON(machineTracks, filename);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const getConnectionStatusText = () => {
    if (isPaused) return 'Paused';
    if (connectionStatus.isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getConnectionIcon = () => {
    if (isPaused) return <RefreshCw size={16} className="text-yellow-400" />;
    if (connectionStatus.isConnected) return <Wifi size={16} className="text-green-400" />;
    return <WifiOff size={16} className="text-red-400" />;
  };

  return (
    <motion.div 
      className="card p-4 mt-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {getConnectionIcon()}
            <span className="text-sm text-dark-muted">
              {getConnectionStatusText()}
            </span>
            {!isPaused && (
              <span className="text-xs text-dark-muted">
                ({refreshInterval}s interval)
              </span>
            )}
          </div>

          {/* Data Stats */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-dark-muted">
              <span className="font-medium text-dark-text">{totalMachines}</span> machines
            </div>
            <div className="text-sm text-dark-muted">
              <span className="font-medium text-dark-text">{totalDataPoints}</span> data points
            </div>
            {selectedMachineId && (
              <div className="text-sm text-dark-muted">
                <span className="font-medium text-dark-accent">{selectedMachineData.length}</span> selected
              </div>
            )}
          </div>
        </div>

        {/* Export Controls */}
        <div className="flex items-center space-x-2">
          {selectedMachineId && selectedMachineData.length > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-dark-muted mr-2">Export Selected:</span>
              <button
                onClick={() => handleExportSelected('csv')}
                disabled={isExporting}
                className="btn-secondary text-xs px-2 py-1 flex items-center space-x-1"
              >
                <Download size={12} />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExportSelected('json')}
                disabled={isExporting}
                className="btn-secondary text-xs px-2 py-1 flex items-center space-x-1"
              >
                <Download size={12} />
                <span>JSON</span>
              </button>
            </div>
          )}

          {totalDataPoints > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-xs text-dark-muted mr-2">Export All:</span>
              <button
                onClick={() => handleExportAll('csv')}
                disabled={isExporting}
                className="btn-secondary text-xs px-2 py-1 flex items-center space-x-1"
              >
                <Download size={12} />
                <span>CSV</span>
              </button>
              <button
                onClick={() => handleExportAll('json')}
                disabled={isExporting}
                className="btn-secondary text-xs px-2 py-1 flex items-center space-x-1"
              >
                <Download size={12} />
                <span>JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Last Update Time */}
      {connectionStatus.lastUpdate && (
        <div className="mt-2 text-xs text-dark-muted">
          Last update: {formatTimestamp(connectionStatus.lastUpdate)}
          {connectionStatus.retryCount > 0 && (
            <span className="ml-2 text-red-400">
              (Failed attempts: {connectionStatus.retryCount})
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};
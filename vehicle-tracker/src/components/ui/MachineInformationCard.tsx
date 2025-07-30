import React from 'react';
import type { TelemetryDataPoint } from '../../types';
import { formatTimestamp, parseComment } from '../../utils/export';

interface MachineInformationCardProps {
  dataPoint: TelemetryDataPoint;
}

export const MachineInformationCard: React.FC<MachineInformationCardProps> = ({ dataPoint }) => {
  return (
    <div className="card p-3">
      <h3 className="font-medium text-light-text dark:text-white mb-2 text-sm">Machine ID: {dataPoint.machineId}</h3>
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Timestamp:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {formatTimestamp(dataPoint.timestamp)}
          </span>
        </div>
        {dataPoint.machineTime && (
          <div className="flex justify-between">
            <span className="text-light-muted dark:text-dark-muted text-xs">Machine Time:</span>
            <span className="font-mono text-light-text dark:text-dark-text text-xs">
              {formatTimestamp(dataPoint.machineTime)}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Latitude:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {dataPoint.latitude.toFixed(6)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Longitude:</span>
          <span className="font-mono text-light-text dark:text-dark-text text-xs">
            {dataPoint.longitude.toFixed(6)}°
          </span>
        </div>
        {dataPoint.battery !== undefined && (
          <div className="flex justify-between">
            <span className="text-light-muted dark:text-dark-muted text-xs">Battery:</span>
            <span className="font-mono text-light-text dark:text-dark-text text-xs">
              {dataPoint.battery.toFixed(2)}V
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-light-muted dark:text-dark-muted text-xs">Error:</span>
          <span className={`font-mono text-xs ${parseComment(dataPoint.comment).error === 'NONE' ? 'text-light-text dark:text-dark-text' : 'text-red-500'}`}>
            {parseComment(dataPoint.comment).error || 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
};

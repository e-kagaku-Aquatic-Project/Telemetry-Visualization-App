import Papa from 'papaparse';
import { TelemetryDataPoint, MachineTracks } from '../types';

export function exportToCSV(data: TelemetryDataPoint[], filename: string = 'machine-data') {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const csv = Papa.unparse(data, {
    header: true,
    columns: [
      'timestamp',
      'machineTime',
      'machineId',
      'dataType',
      'latitude',
      'longitude',
      'altitude',
      'satellites',
      'battery',
      'comment',
    ],
  });

  downloadFile(csv, `${filename}.csv`, 'text/csv');
}

export function exportToJSON(data: TelemetryDataPoint[], filename: string = 'machine-data') {
  if (data.length === 0) {
    throw new Error('No data to export');
  }

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
}

export function exportAllMachinesToCSV(machineTracks: MachineTracks, filename: string = 'all-machines-data') {
  const allData: TelemetryDataPoint[] = [];
  
  Object.values(machineTracks).forEach(machineData => {
    allData.push(...machineData);
  });

  // Sort by timestamp
  allData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  exportToCSV(allData, filename);
}

export function exportAllMachinesToJSON(machineTracks: MachineTracks, filename: string = 'all-machines-data') {
  if (Object.keys(machineTracks).length === 0) {
    throw new Error('No data to export');
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    totalMachines: Object.keys(machineTracks).length,
    totalDataPoints: Object.values(machineTracks).reduce((sum, data) => sum + data.length, 0),
    machines: machineTracks,
  };

  const json = JSON.stringify(exportData, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format timestamp to yyyy/mm/dd hh:mm:ss format
 */
export function formatTimestamp(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Parse machine comment string into structured data
 * Example: "MODE:NORMAL,COMM:OK,GPS:LOCKED,SENSOR:TEMP_OK,PRESSURE:STABLE,ERROR:NONE"
 */
export interface MachineStatus {
  mode?: string;
  comm?: string;
  gps?: string;
  sensor?: string;
  pressure?: string;
  error?: string;
  [key: string]: string | undefined;
}

export function parseComment(comment: string): MachineStatus {
  if (!comment || typeof comment !== 'string') {
    return {};
  }
  
  const status: MachineStatus = {};
  
  // Split by comma and parse key:value pairs
  const pairs = comment.split(',').map(pair => pair.trim());
  
  pairs.forEach(pair => {
    const [key, value] = pair.split(':').map(part => part.trim());
    if (key && value) {
      status[key.toLowerCase()] = value;
    }
  });
  
  return status;
}

/**
 * Get status color based on value
 */
export function getStatusColor(key: string, value: string): string {
  const normalizedKey = key.toLowerCase();
  const normalizedValue = value.toLowerCase();
  
  // Color mapping for different status types
  const colorMap: Record<string, Record<string, string>> = {
    mode: {
      'normal': 'text-green-400',
      'standby': 'text-yellow-400',
      'error': 'text-red-400',
      'maintenance': 'text-blue-400',
    },
    comm: {
      'ok': 'text-green-400',
      'weak': 'text-yellow-400',
      'lost': 'text-red-400',
      'disconnected': 'text-red-400',
    },
    gps: {
      'locked': 'text-green-400',
      'searching': 'text-yellow-400',
      'lost': 'text-red-400',
      'disabled': 'text-gray-400',
    },
    sensor: {
      'temp_ok': 'text-green-400',
      'temp_high': 'text-red-400',
      'temp_low': 'text-blue-400',
      'ok': 'text-green-400',
      'warning': 'text-yellow-400',
      'error': 'text-red-400',
    },
    pressure: {
      'stable': 'text-green-400',
      'rising': 'text-blue-400',
      'falling': 'text-yellow-400',
      'unstable': 'text-red-400',
    },
    error: {
      'none': 'text-green-400',
      'minor': 'text-yellow-400',
      'major': 'text-red-400',
      'critical': 'text-red-500',
    },
  };
  
  if (colorMap[normalizedKey] && colorMap[normalizedKey][normalizedValue]) {
    return colorMap[normalizedKey][normalizedValue];
  }
  
  // Default colors based on common patterns
  if (normalizedValue.includes('ok') || normalizedValue.includes('normal') || normalizedValue.includes('locked') || normalizedValue.includes('stable') || normalizedValue.includes('none')) {
    return 'text-green-400';
  } else if (normalizedValue.includes('warning') || normalizedValue.includes('weak') || normalizedValue.includes('searching') || normalizedValue.includes('rising') || normalizedValue.includes('falling')) {
    return 'text-yellow-400';
  } else if (normalizedValue.includes('error') || normalizedValue.includes('lost') || normalizedValue.includes('critical') || normalizedValue.includes('major')) {
    return 'text-red-400';
  }
  
  return 'text-dark-text';
}

/**
 * Get human-readable label for status key
 */
export function getStatusLabel(key: string): string {
  const labelMap: Record<string, string> = {
    mode: 'Mode',
    comm: 'Communication',
    gps: 'GPS Status',
    sensor: 'Sensor',
    pressure: 'Pressure',
    error: 'Error Status',
  };
  
  return labelMap[key.toLowerCase()] || key.charAt(0).toUpperCase() + key.slice(1);
}
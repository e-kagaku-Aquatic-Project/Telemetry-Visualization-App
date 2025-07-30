export interface TelemetryRow {
  timestamp: string;
  machineTime?: string;
  machineId: string;
  dataType?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  battery?: number;
  comment?: string;
}

export interface MachineData {
  machineId: string;
  data: TelemetryDataPoint[];
}

export interface TelemetryDataPoint {
  timestamp: string;
  machineTime?: string;
  machineId: string;
  dataType?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  satellites: number;
  battery?: number;
  comment?: string;
  gps_error?: string; // Added gps_error property
}

export type MachineTracks = Record<string, TelemetryDataPoint[]>;

export interface GASResponse {
  status: 'success' | 'error';
  message?: string;
  timestamp?: string;
  machines?: MachineData[];
  totalMachines?: number;
  machineId?: string;
  data?: TelemetryDataPoint[];
  dataCount?: number;
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastUpdate: Date | null;
  retryCount: number;
}

export interface MapOptions {
  center: google.maps.LatLngLiteral;
  zoom: number;
  styles: google.maps.MapTypeStyle[];
  disableDefaultUI: boolean;
  gestureHandling: 'greedy' | 'cooperative' | 'none' | 'auto';
}

export interface ExportFormat {
  type: 'csv' | 'json';
  filename: string;
}

export type GradientParameter = 'altitude' | 'satellites' | 'battery';

export interface GradientSegment {
  path: google.maps.LatLngLiteral[];
  color: string;
  value: number;
}

export interface GradientVisualizationState {
  isEnabled: boolean;
  selectedParameter: GradientParameter | null;
  refreshKey: number; // Force component refresh
}
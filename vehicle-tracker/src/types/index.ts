export interface TelemetryRow {
  timestamp: string;
  machine_id: string;
  gps: {
    latitude: number;
    longitude: number;
    altitude: number;
    satellites: number;
  };
  sensors: {
    water_temperature: number;
    air_pressure: number;
    air_temperature: number;
  };
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
  waterTemperature: number;
  airPressure: number;
  airTemperature: number;
  battery?: number;
  comment?: string;
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

export type GradientParameter = 'altitude' | 'waterTemperature' | 'airPressure' | 'airTemperature' | 'satellites';

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
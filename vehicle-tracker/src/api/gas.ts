import { GASResponse, VehicleData, TelemetryDataPoint, VehicleTracks } from '../types';

const GAS_ENDPOINT = import.meta.env.VITE_GAS_ENDPOINT;

if (!GAS_ENDPOINT) {
  console.warn('VITE_GAS_ENDPOINT not configured. Please set it in your .env file.');
}

export class GASApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'GASApiError';
  }
}

async function fetchGAS<T>(action: string, params: Record<string, string> = {}): Promise<GASResponse<T>> {
  if (!GAS_ENDPOINT) {
    throw new GASApiError('GAS endpoint not configured');
  }

  const url = new URL(GAS_ENDPOINT);
  url.searchParams.set('action', action);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new GASApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const data = await response.json();
    
    if (data.status === 'error') {
      throw new GASApiError(data.message || 'Unknown error from GAS API');
    }

    return data;
  } catch (error) {
    if (error instanceof GASApiError) {
      throw error;
    }
    
    throw new GASApiError(
      error instanceof Error ? error.message : 'Network error'
    );
  }
}

export async function getAllVehicles(): Promise<VehicleTracks> {
  const response = await fetchGAS<{ vehicles: VehicleData[] }>('getAllVehicles');
  
  const tracks: VehicleTracks = {};
  
  if (response.vehicles) {
    response.vehicles.forEach(vehicle => {
      tracks[vehicle.vehicleId] = vehicle.data;
    });
  }
  
  return tracks;
}

export async function getVehicle(vehicleId: string): Promise<TelemetryDataPoint[]> {
  const response = await fetchGAS<{ data: TelemetryDataPoint[] }>('getVehicle', { vehicleId });
  return response.data || [];
}

export async function getVehicleList(): Promise<string[]> {
  const response = await fetchGAS<{ 
    vehicles: Array<{ vehicleId: string; dataCount: number }> 
  }>('getVehicleList');
  
  return response.vehicles?.map(v => v.vehicleId) || [];
}

export async function postTelemetryData(data: Record<string, unknown>): Promise<void> {
  if (!GAS_ENDPOINT) {
    throw new GASApiError('GAS endpoint not configured');
  }

  try {
    const response = await fetch(GAS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new GASApiError(`HTTP ${response.status}: ${response.statusText}`, response.status);
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new GASApiError(result.message || 'Unknown error from GAS API');
    }
  } catch (error) {
    if (error instanceof GASApiError) {
      throw error;
    }
    
    throw new GASApiError(
      error instanceof Error ? error.message : 'Network error'
    );
  }
}
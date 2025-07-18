import { create } from 'zustand';
import { TelemetryDataPoint, MachineTracks, ConnectionStatus, GradientVisualizationState, GradientParameter } from '../types';

interface AppState {
  // Machine data
  machineTracks: MachineTracks;
  selectedMachineId: string | null;
  selectedDataPoint: TelemetryDataPoint | null;
  
  // UI state
  isSidePanelOpen: boolean;
  refreshInterval: number; // in seconds
  isPaused: boolean;
  currentView: 'map' | 'graphs';
  hasViewedGraphs: boolean;
  viewMode: 'all' | 'individual'; // New: Tab mode for all machines or individual
  
  // Connection status
  connectionStatus: ConnectionStatus;
  
  // Map state
  mapCenter: google.maps.LatLngLiteral | null;
  mapZoom: number;
  
  // Gradient visualization state
  gradientVisualization: GradientVisualizationState;
  
  // Actions
  setMachineTracks: (tracks: MachineTracks) => void;
  setSelectedMachine: (machineId: string | null) => void;
  setSelectedDataPoint: (dataPoint: TelemetryDataPoint | null) => void;
  setSidePanelOpen: (open: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  setPaused: (paused: boolean) => void;
  setConnectionStatus: (status: Partial<ConnectionStatus>) => void;
  setMapCenter: (center: google.maps.LatLngLiteral) => void;
  setMapZoom: (zoom: number) => void;
  setCurrentView: (view: 'map' | 'graphs') => void;
  setViewMode: (mode: 'all' | 'individual') => void; // New: Set tab mode
  setGradientParameter: (parameter: GradientParameter | null) => void;
  toggleGradientVisualization: () => void;
  
  // Computed getters
  getMachineIds: () => string[];
  getSelectedMachineData: () => TelemetryDataPoint[];
  getLatestDataPoint: (machineId: string) => TelemetryDataPoint | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  machineTracks: {},
  selectedMachineId: null,
  selectedDataPoint: null,
  isSidePanelOpen: false,
  refreshInterval: 5,
  isPaused: false,
  currentView: 'map',
  hasViewedGraphs: false,
  viewMode: 'all', // Default to showing all machines
  connectionStatus: {
    isConnected: false,
    lastUpdate: null,
    retryCount: 0,
  },
  mapCenter: null,
  mapZoom: 12,
  gradientVisualization: {
    isEnabled: false,
    selectedParameter: null,
    refreshKey: 0,
  },
  
  // Actions
  setMachineTracks: (tracks) => set({ machineTracks: tracks }),
  
  setSelectedMachine: (machineId) => set({ 
    selectedMachineId: machineId,
    selectedDataPoint: null,
    isSidePanelOpen: false,
  }),
  
  setSelectedDataPoint: (dataPoint) => set({ 
    selectedDataPoint: dataPoint,
    isSidePanelOpen: !!dataPoint,
  }),
  
  setSidePanelOpen: (open) => set({ isSidePanelOpen: open }),
  
  setRefreshInterval: (interval) => set({ refreshInterval: interval }),
  
  setPaused: (paused) => set({ isPaused: paused }),
  
  setConnectionStatus: (status) => set((state) => ({
    connectionStatus: { ...state.connectionStatus, ...status }
  })),
  
  setMapCenter: (center) => set({ mapCenter: center }),
  
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
  
  setCurrentView: (view) => set((state) => ({ 
    currentView: view, 
    hasViewedGraphs: state.hasViewedGraphs || view === 'graphs' 
  })),
  
  setViewMode: (mode: 'all' | 'individual') => set({ viewMode: mode }),
  
  setGradientParameter: (parameter: GradientParameter | null) => set((state) => ({
    gradientVisualization: {
      ...state.gradientVisualization,
      selectedParameter: parameter,
      isEnabled: parameter !== null,
      refreshKey: state.gradientVisualization.refreshKey + 1
    }
  })),
  
  toggleGradientVisualization: () => set((state) => ({
    gradientVisualization: {
      ...state.gradientVisualization,
      isEnabled: !state.gradientVisualization.isEnabled,
      selectedParameter: !state.gradientVisualization.isEnabled ? 
        state.gradientVisualization.selectedParameter || 'altitude' : 
        state.gradientVisualization.selectedParameter,
      refreshKey: state.gradientVisualization.refreshKey + 1
    }
  })),
  
  // Computed getters
  getMachineIds: () => Object.keys(get().machineTracks),
  
  getSelectedMachineData: () => {
    const { selectedMachineId, machineTracks } = get();
    return selectedMachineId ? machineTracks[selectedMachineId] || [] : [];
  },
  
  getLatestDataPoint: (machineId: string) => {
    const tracks = get().machineTracks[machineId];
    return tracks && tracks.length > 0 ? tracks[tracks.length - 1] : null;
  },
}));
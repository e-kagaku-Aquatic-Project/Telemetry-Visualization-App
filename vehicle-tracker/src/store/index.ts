import { create } from 'zustand';
import { TelemetryDataPoint, MachineTracks, ConnectionStatus, GradientVisualizationState, GradientParameter } from '../types';
import { PredictionConfig, PredictedPosition, predictPosition, DEFAULT_PREDICTION_CONFIG } from '../utils/prediction';
import { verifyPassword, generateSessionToken, saveSession, getSession, clearSession, checkAuthStatus as checkAuthStatusUtil } from '../utils/auth';

export type Theme = 'light' | 'dark';

interface AuthState {
  isAuthenticated: boolean;
  sessionToken: string | null;
  sessionTimestamp: number | null;
  login: (password: string) => boolean;
  logout: () => void;
  checkAuthStatus: () => boolean;
  initializeAuth: () => void;
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

interface AppState extends AuthState, ThemeState {
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
  mapMarkerLimit: number; // New: Limit for markers displayed on map
  setMapMarkerLimit: (limit: number) => void; // New: Action to set the limit
  mapType: 'roadmap' | 'satellite'; // New: Map type
  
  // Gradient visualization state
  gradientVisualization: GradientVisualizationState;
  
  // Position prediction state
  predictionConfig: PredictionConfig;
  
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
  
  // Prediction actions
  setPredictionEnabled: (enabled: boolean) => void;
  setPredictionMinutes: (minutes: number) => void;
  setPredictionReferencePoints: (points: number) => void;
  updatePredictionConfig: (config: Partial<PredictionConfig>) => void;
  
  // Computed getters
  getMachineIds: () => string[];
  getSelectedMachineData: () => TelemetryDataPoint[];
  getLatestDataPoint: (machineId: string) => TelemetryDataPoint | null;
  
  // Prediction getters
  getPredictedPosition: (machineId: string) => PredictedPosition | null;
  getAllPredictedPositions: () => Record<string, PredictedPosition>;
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
  mapMarkerLimit: 50, // Default limit
  mapType: 'roadmap', // Default map type
  gradientVisualization: {
    isEnabled: false,
    selectedParameter: null,
    refreshKey: 0,
  },
  
  predictionConfig: DEFAULT_PREDICTION_CONFIG,
  
  // Auth state
  isAuthenticated: false,
  sessionToken: null,
  sessionTimestamp: null,
  
  // Theme state
  theme: 'dark', // Default to dark theme
  
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
  setMapMarkerLimit: (limit) => set({ mapMarkerLimit: limit }),
  setMapType: (type: 'roadmap' | 'satellite') => set({ mapType: type }),
  
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
  
  // Prediction actions
  setPredictionEnabled: (enabled) => set((state) => ({
    predictionConfig: { ...state.predictionConfig, isEnabled: enabled }
  })),
  
  setPredictionMinutes: (minutes) => set((state) => ({
    predictionConfig: { ...state.predictionConfig, predictionMinutes: minutes }
  })),
  
  setPredictionReferencePoints: (points) => set((state) => ({
    predictionConfig: { ...state.predictionConfig, referencePoints: points }
  })),
  
  updatePredictionConfig: (config) => set((state) => ({
    predictionConfig: { ...state.predictionConfig, ...config }
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
  
  // Prediction getters
  getPredictedPosition: (machineId: string) => {
    const { machineTracks, predictionConfig } = get();
    const tracks = machineTracks[machineId];
    
    if (!tracks || tracks.length === 0) {
      return null;
    }
    
    return predictPosition(tracks, predictionConfig);
  },
  
  getAllPredictedPositions: () => {
    const { machineTracks, predictionConfig } = get();
    const predictions: Record<string, PredictedPosition> = {};
    
    Object.keys(machineTracks).forEach(machineId => {
      const tracks = machineTracks[machineId];
      if (tracks && tracks.length > 0) {
        const prediction = predictPosition(tracks, predictionConfig);
        if (prediction) {
          predictions[machineId] = prediction;
        }
      }
    });
    
    return predictions;
  },
  
  // Theme actions
  setTheme: (theme: Theme) => {
    set({ theme });
    // Apply theme to document root
    if (typeof document !== 'undefined') {
      document.documentElement.className = theme === 'dark' ? 'dark' : '';
      localStorage.setItem('theme', theme);
    }
  },
  
  toggleTheme: () => {
    const { theme } = get();
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    get().setTheme(newTheme);
  },
  
  // Auth actions
  login: (password: string) => {
    const isValid = verifyPassword(password);
    if (isValid) {
      const token = generateSessionToken();
      saveSession(token);
      set({
        isAuthenticated: true,
        sessionToken: token,
        sessionTimestamp: Date.now(),
      });
      return true;
    }
    return false;
  },
  
  logout: () => {
    clearSession();
    set({
      isAuthenticated: false,
      sessionToken: null,
      sessionTimestamp: null,
    });
  },
  
  checkAuthStatus: () => {
    const isValid = checkAuthStatusUtil();
    if (!isValid) {
      get().logout();
    }
    return isValid;
  },
  
  initializeAuth: () => {
    const { token, timestamp } = getSession();
    const isValid = checkAuthStatusUtil();
    set({
      isAuthenticated: isValid,
      sessionToken: isValid ? token : null,
      sessionTimestamp: isValid ? timestamp : null,
    });
    
    // Initialize theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const theme: Theme = savedTheme || 'dark';
      get().setTheme(theme);
    }
  },
}));
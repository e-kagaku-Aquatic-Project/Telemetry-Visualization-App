import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MachineTabs } from './components/MachineTabs';
import { ViewToggle } from './components/ViewToggle';
import { MapContainer } from './components/MapContainer';
import { SensorGraphs } from './components/SensorGraphs';
import { SidePanel } from './components/SidePanel';
import { useMachineData } from './hooks/useMachineData';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useAppStore } from './store';
import { Info, Wifi, WifiOff, LogOut } from 'lucide-react';
import { exportToCSV, exportToJSON, exportAllMachinesToCSV } from './utils/export';
import { LoginForm } from './components/auth/LoginForm';
import { PrivateRoute } from './components/auth/PrivateRoute';

function MainApplication() {
  const { machineTracks, error, isLoading } = useMachineData();
  const { 
    setSelectedMachine, 
    selectedMachineId, 
    getMachineIds, 
    currentView,
    connectionStatus,
    selectedDataPoint,
    setSidePanelOpen,
    isPaused,
    setPaused,
    refreshInterval,
    setRefreshInterval,
    getSelectedMachineData,
    logout
  } = useAppStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Auto-select first machine when data loads
  useEffect(() => {
    const machineIds = getMachineIds();
    if (machineIds.length > 0 && !selectedMachineId) {
      setSelectedMachine(machineIds[0]);
    }
  }, [machineTracks, selectedMachineId, setSelectedMachine, getMachineIds]);

  // Export functions
  const exportSelectedAsCSV = () => {
    if (!selectedMachineId) return;
    const data = getSelectedMachineData();
    if (data.length === 0) return;
    
    try {
      exportToCSV(data, `${selectedMachineId}-data`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const exportSelectedAsJSON = () => {
    if (!selectedMachineId) return;
    const data = getSelectedMachineData();
    if (data.length === 0) return;
    
    try {
      exportToJSON(data, `${selectedMachineId}-data`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const exportAllAsCSV = () => {
    if (Object.keys(machineTracks).length === 0) return;
    
    try {
      exportAllMachinesToCSV(machineTracks, 'all-machines-data');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="h-screen flex flex-col max-w-full">
        {/* Compact header section */}
        <div className="flex-shrink-0 p-2 pb-0">
          <div className="card p-3 mb-2">
            <div className="flex items-center justify-between">
              {/* Left side: Title, Connection Status, Machine Tabs */}
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                <h1 className="text-lg font-bold text-dark-text flex-shrink-0">
                  Machine Tracker
                </h1>
                
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${
                    connectionStatus.isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-dark-muted">
                    {connectionStatus.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                  {connectionStatus.lastUpdate && (
                    <span className="text-xs text-dark-muted hidden lg:inline">
                      Last update: {new Date(connectionStatus.lastUpdate).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                {/* Machine tabs in header */}
                <div className="flex-1 min-w-0 hidden md:block">
                  <MachineTabs />
                </div>
              </div>

              {/* Right side: Controls */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                {/* Info button for devices without persistent sidebar */}
                {selectedDataPoint && (
                  <button
                    onClick={() => setSidePanelOpen(true)}
                    className="xl:hidden btn btn-secondary p-1.5"
                    title="Show sensor details"
                  >
                    <Info size={14} />
                  </button>
                )}
                
                {/* Refresh interval selector */}
                <div className="hidden sm:flex items-center space-x-2">
                  <label className="text-xs text-dark-muted">Refresh:</label>
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="input text-xs"
                  >
                    {[5, 10, 30, 60].map(interval => (
                      <option key={interval} value={interval}>
                        {interval}s
                      </option>
                    ))}
                  </select>
                </div>
                
                <ViewToggle />
                
                <button
                  onClick={() => setPaused(!isPaused)}
                  className={`btn ${isPaused ? 'btn-primary' : 'btn-secondary'} text-xs px-2 py-1.5`}
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                
                <button
                  onClick={logout}
                  className="btn btn-secondary text-xs px-2 py-1.5 flex items-center space-x-1"
                  title="Logout"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
            
            {/* Machine tabs for mobile */}
            <div className="md:hidden mt-3">
              <MachineTabs />
            </div>
          </div>
        </div>
        
        {/* Main content area - expanded */}
        <div className="flex-1 flex p-1 sm:p-2 gap-2 min-h-0 overflow-hidden">
          <div className="flex-1 min-w-0 min-h-0">
            {currentView === 'map' ? <MapContainer /> : <SensorGraphs />}
          </div>
          
          {/* Compact side panel - only show for map view */}
          {currentView === 'map' && (
            <div className="hidden xl:block w-64 2xl:w-72 flex-shrink-0">
              <SidePanel isDesktop={true} />
            </div>
          )}
        </div>
        
        {/* Footer with export and status */}
        <div className="flex-shrink-0 p-2 sm:p-3 pt-0">
          <div className="card p-3 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 sm:space-x-6">
                <div className="flex items-center space-x-2">
                  {connectionStatus.isConnected ? <Wifi size={16} className="text-green-400" /> : <WifiOff size={16} className="text-red-400" />}
                  <span className="text-dark-muted">
                    {isPaused ? 'Paused' : (connectionStatus.isConnected ? 'Connected' : 'Disconnected')}
                  </span>
                  {!isPaused && (
                    <span className="text-xs text-dark-muted">
                      ({refreshInterval}s interval)
                    </span>
                  )}
                </div>
                
                <div className="text-dark-muted">
                  <span className="font-medium text-dark-text">{Object.keys(machineTracks).length}</span> machines
                </div>
                
                <div className="text-dark-muted">
                  <span className="font-medium text-dark-text">{Object.values(machineTracks).reduce((sum, data) => sum + data.length, 0)}</span> points
                </div>
                
                {selectedMachineId && (
                  <div className="text-dark-muted">
                    <span className="font-medium text-dark-accent">{getSelectedMachineData().length}</span> selected
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Export buttons */}
                <div className="flex items-center space-x-2">
                  {selectedMachineId && getSelectedMachineData().length > 0 && (
                    <>
                      <span className="text-xs text-dark-muted">Export:</span>
                      <button
                        onClick={() => exportSelectedAsCSV()}
                        className="btn-secondary text-xs px-2 py-1"
                        title="Export selected machine data as CSV"
                      >
                        CSV
                      </button>
                      <button
                        onClick={() => exportSelectedAsJSON()}
                        className="btn-secondary text-xs px-2 py-1"
                        title="Export selected machine data as JSON"
                      >
                        JSON
                      </button>
                    </>
                  )}
                  
                  {Object.keys(machineTracks).length > 0 && (
                    <>
                      <span className="text-xs text-dark-muted">All:</span>
                      <button
                        onClick={() => exportAllAsCSV()}
                        className="btn-secondary text-xs px-2 py-1"
                        title="Export all machine data as CSV"
                      >
                        CSV
                      </button>
                    </>
                  )}
                </div>
                
                <div className="text-xs text-dark-muted hidden lg:block">
                  Shortcuts: [/] tabs • P pause • E export • ESC close
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile/tablet side panel as overlay - only show for map view */}
        {currentView === 'map' && (
          <div className="xl:hidden">
            <SidePanel isDesktop={false} />
          </div>
        )}
        
        {/* Loading overlay */}
        {isLoading && Object.keys(machineTracks).length === 0 && (
          <div className="fixed inset-0 bg-dark-bg/80 flex items-center justify-center z-50">
            <div className="card p-8 text-center">
              <div className="animate-spin w-12 h-12 border-2 border-dark-accent border-t-transparent rounded-full mx-auto mb-4"></div>
              <div className="text-dark-text">Loading machine data...</div>
            </div>
          </div>
        )}
        
        {/* Error state */}
        {error && Object.keys(machineTracks).length === 0 && (
          <div className="fixed inset-0 bg-dark-bg/80 flex items-center justify-center z-50">
            <div className="card p-8 text-center max-w-md">
              <div className="text-red-400 mb-4">Failed to load data</div>
              <div className="text-dark-muted text-sm mb-4">
                {error.message || 'Unknown error occurred'}
              </div>
              <div className="text-dark-muted text-xs">
                Please check your .env configuration and GAS endpoint.
              </div>
            </div>
          </div>
        )}
        
        {/* Help overlay */}
        <div className="fixed bottom-2 left-2 text-xs text-dark-muted">
          <div>Shortcuts: [/] switch tabs • P pause • E export • ESC close panel</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { initializeAuth } = useAppStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainApplication />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
import useSWR from 'swr';
import { getAllMachines, GASApiError } from '../api/gas';
import { useAppStore } from '../store';
import { MachineTracks } from '../types';
import { useEffect } from 'react';

export function useMachineData() {
  const { 
    refreshInterval, 
    isPaused, 
    setMachineTracks, 
    setConnectionStatus,
    machineTracks 
  } = useAppStore();

  const { data, error, isLoading, mutate } = useSWR<MachineTracks>(
    isPaused ? null : 'machine-data',
    getAllMachines,
    {
      refreshInterval: refreshInterval * 1000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      onSuccess: (data) => {
        setMachineTracks(data);
        setConnectionStatus({
          isConnected: true,
          lastUpdate: new Date(),
          retryCount: 0,
        });
      },
      onError: (error: GASApiError) => {
        console.error('Failed to fetch machine data:', error);
        setConnectionStatus({
          isConnected: false,
          retryCount: (useAppStore.getState().connectionStatus.retryCount || 0) + 1,
        });
      },
    }
  );

  // Check for disconnection based on last update time
  useEffect(() => {
    const checkConnection = () => {
      const { connectionStatus } = useAppStore.getState();
      if (connectionStatus.lastUpdate) {
        const timeSinceUpdate = Date.now() - connectionStatus.lastUpdate.getTime();
        const threshold = refreshInterval * 3 * 1000; // 3x refresh interval
        
        if (timeSinceUpdate > threshold && connectionStatus.isConnected) {
          setConnectionStatus({ isConnected: false });
        }
      }
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, [refreshInterval, setConnectionStatus]);

  return {
    machineTracks: data || machineTracks,
    error,
    isLoading,
    refetch: mutate,
  };
}
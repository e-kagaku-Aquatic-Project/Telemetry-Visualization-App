import { useEffect } from 'react';
import { useAppStore } from '../store';
import { exportAllMachinesToCSV } from '../utils/export';

export function useKeyboardShortcuts() {
  const { 
    machineTracks,
    selectedMachineId,
    setSelectedMachine,
    setPaused,
    isPaused,
    getMachineIds,
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }

      const machineIds = getMachineIds();
      const currentIndex = selectedMachineId ? machineIds.indexOf(selectedMachineId) : -1;

      switch (event.key) {
        case '[':
        case 'ArrowLeft':
          event.preventDefault();
          if (machineIds.length > 0) {
            const prevIndex = currentIndex <= 0 ? machineIds.length - 1 : currentIndex - 1;
            setSelectedMachine(machineIds[prevIndex]);
          }
          break;

        case ']':
        case 'ArrowRight':
          event.preventDefault();
          if (machineIds.length > 0) {
            const nextIndex = currentIndex >= machineIds.length - 1 ? 0 : currentIndex + 1;
            setSelectedMachine(machineIds[nextIndex]);
          }
          break;

        case 'p':
        case 'P':
          if (event.ctrlKey || event.metaKey) return; // Don't interfere with Ctrl+P (print)
          event.preventDefault();
          setPaused(!isPaused);
          break;

        case 'e':
        case 'E':
          if (event.ctrlKey || event.metaKey) return; // Don't interfere with Ctrl+E
          event.preventDefault();
          if (Object.keys(machineTracks).length > 0) {
            try {
              exportAllMachinesToCSV(machineTracks);
            } catch (error) {
              console.error('Export failed:', error);
            }
          }
          break;

        case 'Escape':
          event.preventDefault();
          useAppStore.getState().setSidePanelOpen(false);
          break;

        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9': {
          event.preventDefault();
          const index = parseInt(event.key) - 1;
          if (machineIds[index]) {
            setSelectedMachine(machineIds[index]);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedMachineId, machineTracks, isPaused, setSelectedMachine, setPaused, getMachineIds]);
}
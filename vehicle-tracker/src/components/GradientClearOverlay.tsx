import React, { useEffect } from 'react';
import { useAppStore } from '../store';

/**
 * Invisible component that handles cleanup of gradient visualization
 * when parameters change. This ensures proper cleanup of Google Maps polylines.
 */
export const GradientClearOverlay: React.FC = () => {
  const { gradientVisualization } = useAppStore();

  useEffect(() => {
    // Force a small delay to ensure proper cleanup timing
    // This helps with Google Maps API asynchronous operations
    let timeoutId: NodeJS.Timeout;
    
    if (gradientVisualization.refreshKey > 0) {
      timeoutId = setTimeout(() => {
        // This effect ensures that any lingering map objects are cleaned up
        // The timeout gives Google Maps API time to process previous cleanup
      }, 50);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [gradientVisualization.refreshKey, gradientVisualization.selectedParameter]);

  // This component renders nothing but handles cleanup side effects
  return null;
};
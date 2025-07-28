import React from 'react';
import { useAppStore } from '../../store';
import { Map } from 'lucide-react';

export const MapTypeToggle: React.FC = () => {
  const { mapType, setMapType } = useAppStore();

  const toggleMapType = () => {
    setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap');
  };

  return (
    <button
      onClick={toggleMapType}
      className="p-2 rounded-lg bg-light-surface dark:bg-dark-surface hover:bg-light-bg dark:hover:bg-dark-bg transition-colors shadow-md flex items-center justify-center border border-light-muted/30 dark:border-dark-muted/30 hover:border-light-accent/50 dark:hover:border-dark-accent/50"
      title={mapType === 'roadmap' ? 'Switch to Satellite View' : 'Switch to Roadmap View'}
    >
      <Map size={20} className="text-light-text dark:text-dark-text" />
    </button>
  );
};

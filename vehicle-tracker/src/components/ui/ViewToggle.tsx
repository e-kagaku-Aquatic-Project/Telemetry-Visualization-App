import React from 'react';
import { MapPin, BarChart3 } from 'lucide-react';
import { useAppStore } from '../../store';
import { motion } from 'framer-motion';

export const ViewToggle: React.FC = () => {
  const { currentView, setCurrentView, viewMode } = useAppStore();

  const toggleView = (view: 'map' | 'graphs') => {
    setCurrentView(view);
  };

  return (
    <div className="flex bg-light-surface dark:bg-dark-surface border border-light-muted/30 dark:border-dark-muted/30 rounded-card p-1">
      <motion.button
        onClick={() => toggleView('map')}
        className={`
          flex items-center justify-center p-2 rounded-card transition-all duration-150
          ${currentView === 'map' 
            ? 'bg-light-accent dark:bg-dark-accent text-white shadow-sm' 
            : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-muted/10 dark:hover:bg-dark-muted/10'
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Map view"
      >
        <MapPin size={20} />
      </motion.button>
      
      {viewMode !== 'all' && (
        <motion.button
          onClick={() => toggleView('graphs')}
          className={`
            flex items-center justify-center p-2 rounded-card transition-all duration-150
            ${currentView === 'graphs' 
              ? 'bg-light-accent dark:bg-dark-accent text-white shadow-sm' 
              : 'text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text hover:bg-light-muted/10 dark:hover:bg-dark-muted/10'
            }
          `}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          aria-label="Graph view"
        >
          <BarChart3 size={20} />
        </motion.button>
      )}
    </div>
  );
};
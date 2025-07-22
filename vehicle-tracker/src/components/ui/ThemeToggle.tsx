import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useAppStore();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg transition-all duration-300 ease-in-out
                 bg-light-surface dark:bg-dark-surface 
                 border border-light-muted/30 dark:border-dark-muted/30
                 hover:border-light-accent/50 dark:hover:border-dark-accent/50
                 text-light-text dark:text-dark-text"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        <motion.div
          initial={false}
          animate={{
            scale: theme === 'dark' ? 1 : 0,
            rotate: theme === 'dark' ? 0 : 180,
            opacity: theme === 'dark' ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Moon size={16} />
        </motion.div>
        
        <motion.div
          initial={false}
          animate={{
            scale: theme === 'light' ? 1 : 0,
            rotate: theme === 'light' ? 0 : -180,
            opacity: theme === 'light' ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Sun size={16} />
        </motion.div>
      </div>
    </motion.button>
  );
};
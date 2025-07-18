import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const checkAuthStatus = useAppStore((state) => state.checkAuthStatus);
  const location = useLocation();

  useEffect(() => {
    // Check auth status on mount and periodically
    checkAuthStatus();
    
    const interval = setInterval(() => {
      checkAuthStatus();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkAuthStatus]);

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
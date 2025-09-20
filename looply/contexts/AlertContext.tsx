import React, { createContext, useContext, useState, ReactNode } from 'react';
import SystemAlert from '@/components/SystemAlert';

export interface AlertOptions {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  autoHide?: boolean;
  autoHideDelay?: number;
  actionText?: string;
  onAction?: () => void;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
  showError: (title: string, message: string, options?: Partial<AlertOptions>) => void;
  showWarning: (title: string, message: string, options?: Partial<AlertOptions>) => void;
  showInfo: (title: string, message: string, options?: Partial<AlertOptions>) => void;
  showSuccess: (title: string, message: string, options?: Partial<AlertOptions>) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

interface AlertProviderProps {
  children: ReactNode;
}

export const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alert, setAlert] = useState<AlertOptions | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = (options: AlertOptions) => {
    setAlert(options);
    setVisible(true);
  };

  const hideAlert = () => {
    setVisible(false);
    // Clear alert after animation completes
    setTimeout(() => {
      setAlert(null);
    }, 200);
  };

  const showError = (title: string, message: string, options: Partial<AlertOptions> = {}) => {
    showAlert({
      type: 'error',
      title,
      message,
      autoHide: true,
      autoHideDelay: 5000,
      ...options,
    });
  };

  const showWarning = (title: string, message: string, options: Partial<AlertOptions> = {}) => {
    showAlert({
      type: 'warning',
      title,
      message,
      autoHide: true,
      autoHideDelay: 4000,
      ...options,
    });
  };

  const showInfo = (title: string, message: string, options: Partial<AlertOptions> = {}) => {
    showAlert({
      type: 'info',
      title,
      message,
      autoHide: true,
      autoHideDelay: 3000,
      ...options,
    });
  };

  const showSuccess = (title: string, message: string, options: Partial<AlertOptions> = {}) => {
    showAlert({
      type: 'success',
      title,
      message,
      autoHide: true,
      autoHideDelay: 3000,
      ...options,
    });
  };

  const value: AlertContextType = {
    showAlert,
    hideAlert,
    showError,
    showWarning,
    showInfo,
    showSuccess,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alert && (
        <SystemAlert
          visible={visible}
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onDismiss={hideAlert}
          autoHide={alert.autoHide}
          autoHideDelay={alert.autoHideDelay}
          actionText={alert.actionText}
          onAction={alert.onAction}
        />
      )}
    </AlertContext.Provider>
  );
};

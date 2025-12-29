import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CustomAlert, AlertButton } from '../components/CustomAlert';
import { Ionicons } from '@expo/vector-icons';

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions>({
    title: '',
    message: '',
    buttons: [{ text: 'OK' }],
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlert
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        buttons={alertOptions.buttons}
        icon={alertOptions.icon}
        iconColor={alertOptions.iconColor}
        onDismiss={hideAlert}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}

export default useAlert;
